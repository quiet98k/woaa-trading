import { type JSX, useContext, useEffect, useState } from "react";
// import { useCreateTransaction } from "../hooks/useTransactions";
import { ChartContext } from "../pages/Dashboard";
import { useUserSettings } from "../hooks/useUserSettings";
import { useRealTimeData } from "../hooks/useRealTimeData";
import { useMarketClock } from "../hooks/useMarketClock";
import { createLogger } from "../api/logs";
import { useTradeProcessing } from "../stores/useTradeProcessing";
import { useMyPositions } from "../hooks/usePositions";
import { useMe } from "../hooks/useUser";
import { useCloseTrade, useDeleteTrade } from "../hooks/useTrade"; // add delete hook & fix path

/**
 * Table component to display a list of user positions with live open prices.
 *
 * @returns Rendered JSX element showing the position table or appropriate messages.
 */
export function PositionTable(): JSX.Element {
  const { data: positions, isLoading } = useMyPositions();
  const { data: user } = useMe();
  const { openPrices, mode } = useContext(ChartContext);
  const { clock } = useMarketClock();
  const logger = createLogger("PositionTable.tsx", user.email);
  const [showClosed, setShowClosed] = useState(true);
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
  const deleteTradeMutation = useDeleteTrade();

  const symbols = positions?.map((p) => p.symbol) ?? [];

  useEffect(() => {
    if (mode === "realtime") {
      symbols.forEach((sym) => {
        subscribe(sym, "trades");
      });
    }
  }, [mode, symbols, subscribe]);

  // const createTransaction = useCreateTransaction();
  const { data: settings } = useUserSettings();
  // const updatePosition = useUpdatePosition();

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

  const handlePowerUp = async (p: any) => {
    if (!p || p.status !== "open") return;

    logger({
      level: "INFO",
      event_type: "ui.power_up",
      status: "success",
      error_msg: null,
      additional_info: {
        position_id: p.id,
        symbol: p.symbol,
        open_price: p.open_price,
        open_shares: p.open_shares,
        position_type: p.position_type,
      },
      notes: "power up position",
    });

    const { start, stop } = useTradeProcessing.getState();
    try {
      start();
      await deleteTradeMutation.mutateAsync(p.id);
    } catch (err: any) {
      console.error("Power Up failed:", err);
      alert(err.message || "Failed to power up");
    } finally {
      stop();
    }
  };

  const closeTradeMutation = useCloseTrade();

  const handleClose = async (
    p: any,
    currentPrice: number,
    next?: () => void
  ): Promise<void> => {
    if (!settings) return;

    // optional: keep your existing UI log
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

    const { setProcessing } = useTradeProcessing.getState();
    console.log("set Processing True in Position Table");
    setProcessing(true);

    try {
      await closeTradeMutation.mutateAsync({
        positionId: p.id,
        currentPrice,
        notes: "", // add any notes if you want to pass them through
      });

      // backend updates balances, creates transaction, and closes the position
      if (next) next();
    } catch (err: any) {
      console.error("Close trade failed:", err);
      alert(err.message || "Failed to close trade");
    } finally {
      console.log("set Processing False in Position Table");
      setProcessing(false);
    }
  };

  const visiblePositions = showClosed
    ? positions ?? []
    : (positions ?? []).filter((p) => p.status !== "closed");

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
            <button
              className="ml-2 text-xs text-white bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded"
              onClick={() => setShowClosed((v) => !v)}
            >
              {showClosed ? "Hide Closed" : "Show Closed"}
            </button>
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
                {visiblePositions.map((p) => {
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

                        {p.status === "open" && (
                          <button
                            onClick={() => handlePowerUp(p)}
                            className="text-purple-600 hover:underline"
                            title="Charge fee (per settings), refund principal to sim, delete position"
                          >
                            Power Up
                          </button>
                        )}
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
