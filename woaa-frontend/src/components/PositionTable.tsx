import { type JSX, useContext, useEffect, useState } from "react";
import {
  useMyPositions,
  useDeletePosition,
  useUpdatePosition,
} from "../hooks/usePositions";
import { useCreateTransaction } from "../hooks/useTransactions";
import { ChartContext } from "../pages/Dashboard";
import { useMe, useUpdateUserBalances } from "../hooks/useUser";
import { useUserSettings } from "../hooks/useUserSettings";
import { useRealTimeData } from "../hooks/useRealTimeData";
import { useMarketClock } from "../hooks/useMarketClock";
import { createLogger } from "../api/logs";

/**
 * Table component to display a list of user positions with live open prices.
 *
 * @returns Rendered JSX element showing the position table or appropriate messages.
 */
export function PositionTable(): JSX.Element {
  const { data: positions, isLoading } = useMyPositions();
  const { data: user, refetch: refetchUser } = useMe();
  const updateBalances = useUpdateUserBalances(user?.id ?? "");
  const deleteMutation = useDeletePosition();
  const { openPrices, mode } = useContext(ChartContext);
  const { clock } = useMarketClock();
  const logger = createLogger("PositionTable.tsx", user.email);

  const [latestPrices, setLatestPrices] = useState<Record<string, number>>({});
  const { subscribe } = useRealTimeData((data) => {
    const msg = Array.isArray(data) ? data[0] : data;
    if (msg?.T === "t" && typeof msg.S === "string") {
      setLatestPrices((prev) => ({
        ...prev,
        [msg.S]: msg.p,
      }));
    }
  });

  const symbols = positions?.map((p) => p.symbol) ?? [];

  useEffect(() => {
    if (mode === "realtime") {
      symbols.forEach((sym) => {
        subscribe(sym, "trades");
      });
    }
  }, [mode, symbols, subscribe]);

  const createTransaction = useCreateTransaction();
  const { data: settings } = useUserSettings();
  const updatePosition = useUpdatePosition();
  const [selectedPowerUpId, setSelectedPowerUpId] = useState<string | null>(
    null
  );

  function runFlattenQueue(
    positions: any[],
    openPrices: Record<string, number | null>,
    handleClose: (p: any, currentPrice: number, next?: () => void) => void
  ) {
    logger({
      level: "INFO",
      event_type: "ui.flatten_all",
      status: "success",
      error_msg: null,
      additional_info: {},
      notes: "flatten all unclosed position",
    });
    const queue = [...positions];

    const runNext = () => {
      const p = queue.shift();
      if (!p) return;

      const currentPrice = openPrices[p.symbol];
      if (
        p.status === "open" &&
        currentPrice !== undefined &&
        currentPrice !== null
      ) {
        handleClose(p, currentPrice, runNext);
      } else {
        runNext(); // skip invalid and keep going
      }
    };

    runNext();
  }

  const handleDelete = (p: any) => {
    console.log("[Delete] Sim Balance Before:", user?.sim_balance);
    logger({
      level: "INFO",
      event_type: "ui.delete_position",
      status: "success",
      error_msg: null,
      additional_info: {
        position_id: p.id,
        symbol: p.symbol,
        type: p.position_type,
        open_price: p.open_price,
        open_shares: p.open_shares,
      },
      notes: "Deleted a position",
    });

    deleteMutation.mutate(p.id, {
      onSuccess: () => {
        if (user && p.status === "open") {
          const refund =
            p.open_price *
            (p.position_type === "Long" ? p.open_shares : -p.open_shares);

          const updatedSimBalance = parseFloat(
            (user.sim_balance + refund).toFixed(2)
          );

          console.log("[Delete] Refund Amount:", refund);
          console.log("[Delete] Sim Balance After:", updatedSimBalance);

          updateBalances.mutate({
            sim_balance: updatedSimBalance,
          });
        }
      },
    });
  };

  const handlePowerUp = () => {
    if (!user || !settings || !selectedPowerUpId) return;

    const position = positions?.find((p) => p.id === selectedPowerUpId);
    if (!position || position.status !== "open") return;

    logger({
      level: "INFO",
      event_type: "ui.power_up",
      status: "success",
      error_msg: null,
      additional_info: {
        position_id: position?.id,
        open_price: position?.open_price,
        open_shares: position?.open_shares,
        position_type: position?.position_type,
      },
      notes: "power up position",
    });

    const fee = settings.power_up_fee ?? 0;
    const isReal = settings.power_up_type === "real";

    const updatedBalances: { sim_balance?: number; real_balance?: number } = {};

    // === Refund Calculation ===
    const refund =
      position.open_price *
      (position.position_type === "Long"
        ? position.open_shares
        : -position.open_shares);

    if (isReal) {
      const before = user.real_balance ?? 0;
      const after = parseFloat((before - fee).toFixed(2));

      updatedBalances.real_balance = after;

      console.log("[PowerUp] Real Balance Before:", before);
      console.log("[PowerUp] Fee:", fee);
      console.log("[PowerUp] Real Balance After Fee:", after);
      console.log("[PowerUp] No refund applied for real mode.");
    } else {
      const before = user.sim_balance ?? 0;
      const after = parseFloat((before - fee + refund).toFixed(2));

      updatedBalances.sim_balance = after;

      console.log("[PowerUp] Sim Balance Before:", before);
      console.log("[PowerUp] Fee:", fee);
      console.log("[PowerUp] Refund:", refund);
      console.log("[PowerUp] Sim Balance After:", after);
    }

    // Step 1: charge fee and apply refund
    updateBalances.mutate(updatedBalances);

    // Step 2: delete the position
    deleteMutation.mutate(position.id);

    // Step 3: clear selection
    setSelectedPowerUpId(null);
  };

  const handleClose = (
    p: any,
    currentPrice: number,
    next?: () => void
  ): void => {
    if (!settings) return;

    logger({
      level: "INFO",
      event_type: "ui.close_position",
      status: "success",
      error_msg: null,
      additional_info: {
        position_id: p.id,
        symbol: p.symbol,
        type: p.position_type,
        open_price: p.open_price,
        current_price: currentPrice,
        open_shares: p.open_shares,
      },
      notes: "close a position",
    });

    refetchUser().then(({ data: freshUser }) => {
      if (!freshUser) return;

      const shares = p.open_shares;
      const grossProceeds =
        currentPrice * (p.position_type === "Long" ? shares : -shares);

      const commissionRaw = currentPrice * shares * settings.commission_rate;
      const commission = Math.abs(commissionRaw);

      const netProceeds =
        grossProceeds - (settings.commission_type === "sim" ? commission : 0);

      const realized =
        (currentPrice - p.open_price) *
        (p.position_type === "Long" ? shares : -shares);

      console.log("[Close Trade Info]", {
        id: p.id,
        symbol: p.symbol,
        type: p.position_type,
        shares,
        openPrice: p.open_price,
        currentPrice,
        grossProceeds,
        commissionType: settings.commission_type,
        commission: parseFloat(commission.toFixed(2)),
        netProceeds,
        realizedPL: realized,
        simBefore: freshUser.sim_balance,
        realBefore: freshUser.real_balance,
      });

      createTransaction.mutate(
        {
          symbol: p.symbol,
          shares,
          price: currentPrice,
          action: p.position_type === "Long" ? "sell" : "cover",
          notes: "",
          commission_charged: parseFloat(commission.toFixed(2)),
          commission_type: settings.commission_type,
        },
        {
          onSuccess: () => {
            const updatedBalances: {
              sim_balance?: number;
              real_balance?: number;
            } = {};

            if (settings.commission_type === "real") {
              updatedBalances.real_balance = parseFloat(
                ((freshUser.real_balance ?? 0) - commission).toFixed(2)
              );
              updatedBalances.sim_balance = parseFloat(
                ((freshUser.sim_balance ?? 0) + grossProceeds).toFixed(2)
              );
            } else {
              updatedBalances.sim_balance = parseFloat(
                ((freshUser.sim_balance ?? 0) + netProceeds).toFixed(2)
              );
            }

            // First update balances, then position
            updateBalances.mutate(updatedBalances, {
              onSuccess: () => {
                updatePosition.mutate(
                  {
                    positionId: p.id,
                    updates: {
                      close_price: currentPrice,
                      close_shares: shares,
                      close_time: new Date().toISOString(),
                      realized_pl: realized,
                      status: "closed",
                    },
                  },
                  {
                    onSuccess: () => {
                      if (next) next();
                    },
                  }
                );
              },
            });
          },
        }
      );
    });
  };

  return (
    <div className="w-full h-full">
      {isLoading ? (
        <p className="text-gray-500 text-sm">Loading positions...</p>
      ) : positions && positions.length > 0 ? (
        <>
          <div className="flex justify-end mb-2">
            <button
              className="text-xs text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
              onClick={() => {
                runFlattenQueue(positions, openPrices, handleClose);
              }}
            >
              Flatten All
            </button>

            <div className="flex items-center gap-2 text-black">
              <select
                value={selectedPowerUpId ?? ""}
                onChange={(e) => {
                  const val = e.target.value === "" ? null : e.target.value;
                  console.log("Selected power up ID:", val);
                  setSelectedPowerUpId(val);
                }}
                className="text-xs px-2 py-1 border rounded"
              >
                <option value="">Select Position</option>
                {positions
                  .filter((p) => p.status === "open")
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.symbol} — {p.open_shares} shares
                    </option>
                  ))}
              </select>

              <button
                disabled={!selectedPowerUpId}
                onClick={handlePowerUp}
                className={`text-xs text-white px-3 py-1 rounded ${
                  selectedPowerUpId
                    ? "bg-purple-500 hover:bg-purple-600"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                Power Up
              </button>
            </div>
          </div>

          {/* ✅ Scrollable table container */}
          <div className="max-h-[400px] overflow-y-auto border rounded-md">
            <table className="w-full text-xs text-gray-700">
              <thead className="sticky top-0 bg-white z-10 border-b">
                <tr className="text-left">
                  <th className="px-1 py-1">Symbol</th>
                  <th className="px-1 py-1">Type</th>
                  <th className="px-1 py-1">Open Price</th>
                  <th className="px-1 py-1">Current/Closed Price</th>
                  <th className="px-1 py-1">Shares</th>
                  <th className="px-1 py-1">Status</th>
                  <th className="px-1 py-1">P&amp;L</th>
                  <th className="px-1 py-1">Action</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => {
                  let currentPrice: number | null = null;

                  if (mode === "historical") {
                    currentPrice = openPrices[p.symbol] ?? null;
                  } else if (mode === "realtime" && clock?.is_open) {
                    currentPrice = latestPrices[p.symbol] ?? null;
                  }
                  // else if (mode === "realtime") {
                  //   currentPrice = latestPrices[p.symbol] ?? null;
                  // }

                  const unrealizedPL =
                    currentPrice !== null && p.status === "open"
                      ? (currentPrice - p.open_price) *
                        (p.position_type === "Long"
                          ? p.open_shares
                          : -p.open_shares)
                      : null;

                  return (
                    <tr key={p.id} className="border-b">
                      <td className="px-1 py-1">{p.symbol}</td>
                      <td className="px-1 py-1">{p.position_type}</td>
                      <td className="px-1 py-1">${p.open_price.toFixed(2)}</td>
                      <td className="px-1 py-1">
                        {p.status === "closed"
                          ? `$${p.close_price?.toFixed(2) ?? "—"}`
                          : currentPrice !== null
                          ? `$${currentPrice.toFixed(2)}`
                          : "—"}
                      </td>

                      <td className="px-1 py-1">{p.open_shares}</td>
                      <td className="px-1 py-1">{p.status}</td>
                      <td className="px-1 py-1">
                        {p.status === "closed"
                          ? `$${p.realized_pl?.toFixed(2) ?? "0.00"}`
                          : unrealizedPL !== null
                          ? `$${unrealizedPL.toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="px-1 py-1 flex gap-1 items-center">
                        {p.status === "open" && (
                          <button
                            onClick={() =>
                              currentPrice !== null &&
                              handleClose(p, currentPrice)
                            }
                            disabled={currentPrice === null}
                            className={`${
                              currentPrice === null
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-blue-500 hover:underline"
                            }`}
                          >
                            {p.position_type === "Long" ? "Sell" : "Cover"}
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(p)}
                          className="text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-gray-500 text-sm">No positions found.</p>
      )}
    </div>
  );
}
