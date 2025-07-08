import { type JSX, useContext, useState } from "react";
import {
  useMyPositions,
  useDeletePosition,
  useUpdatePosition,
} from "../hooks/usePositions";
import { useCreateTransaction } from "../hooks/useTransactions";
import { ChartContext } from "../pages/Dashboard";
import { useMe, useUpdateUserBalances } from "../hooks/useUser";
import { useUserSettings } from "../hooks/useUserSettings";

/**
 * Table component to display a list of user positions with live open prices.
 *
 * @returns Rendered JSX element showing the position table or appropriate messages.
 */
export function PositionTable(): JSX.Element {
  const { data: positions, isLoading } = useMyPositions();
  const { data: user } = useMe();
  const updateBalances = useUpdateUserBalances(user?.id ?? "");
  const deleteMutation = useDeletePosition();
  const { openPrices } = useContext(ChartContext);
  const createTransaction = useCreateTransaction();
  const { data: settings } = useUserSettings();
  const updatePosition = useUpdatePosition();
  const [selectedPowerUpId, setSelectedPowerUpId] = useState<string | null>(
    null
  );

  const handleDelete = (p: any) => {
    deleteMutation.mutate(p.id, {
      onSuccess: () => {
        if (user && p.status === "open") {
          const refund =
            p.open_price *
            (p.position_type === "Long" ? p.open_shares : -p.open_shares);
          updateBalances.mutate({
            sim_balance: parseFloat((user.sim_balance + refund).toFixed(2)),
          });
        }
      },
    });
  };

  const handlePowerUp = () => {
    if (!user || !settings || !selectedPowerUpId) return;

    const position = positions?.find((p) => p.id === selectedPowerUpId);
    if (!position || position.status !== "open") return;

    const fee = settings.power_up_fee ?? 0;
    const isReal = settings.power_up_type === "real";

    // Step 1: charge the fee
    const updatedBalances: { sim_balance?: number; real_balance?: number } = {};
    if (isReal) {
      updatedBalances.real_balance = parseFloat(
        ((user.real_balance ?? 0) - fee).toFixed(2)
      );
    } else {
      updatedBalances.sim_balance = parseFloat(
        ((user.sim_balance ?? 0) - fee).toFixed(2)
      );
    }

    updateBalances.mutate(updatedBalances);

    // Step 2: delete the position
    deleteMutation.mutate(position.id);

    // Step 3: clear selection
    setSelectedPowerUpId(null);
  };

  const handleClose = (p: any, currentPrice: number) => {
    if (!user || !settings) return;

    const shares = p.open_shares;
    const grossProceeds =
      currentPrice * (p.position_type === "Long" ? shares : -shares);

    const commission = Math.abs(
      currentPrice * shares * settings.commission_rate
    );
    const netProceeds =
      grossProceeds - (settings.commission_type === "sim" ? commission : 0);

    const realized =
      (currentPrice - p.open_price) *
      (p.position_type === "Long" ? shares : -shares);

    // Step 1: create transaction log
    createTransaction.mutate({
      symbol: p.symbol,
      shares,
      price: currentPrice,
      action: p.position_type === "Long" ? "sell" : "cover",
      notes: "",
      commission_charged: parseFloat(commission.toFixed(2)),
      commission_type: settings.commission_type,
    });

    // Step 2: update position
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
          // Step 3: update user balances
          const updatedBalances: {
            sim_balance?: number;
            real_balance?: number;
          } = {};

          if (settings.commission_type === "real") {
            updatedBalances.real_balance = parseFloat(
              ((user.real_balance ?? 0) - commission).toFixed(2)
            );
            updatedBalances.sim_balance = parseFloat(
              ((user.sim_balance ?? 0) + grossProceeds).toFixed(2)
            );
          } else {
            updatedBalances.sim_balance = parseFloat(
              ((user.sim_balance ?? 0) + netProceeds).toFixed(2)
            );
          }

          updateBalances.mutate(updatedBalances);
        },
      }
    );
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
                positions.forEach((p) => {
                  const currentPrice = openPrices[p.symbol];
                  if (
                    p.status === "open" &&
                    currentPrice !== undefined &&
                    currentPrice !== null
                  ) {
                    handleClose(p, currentPrice);
                  }
                });
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
                  <th className="px-1 py-1">Current Price</th>
                  <th className="px-1 py-1">Shares</th>
                  <th className="px-1 py-1">Status</th>
                  <th className="px-1 py-1">P&amp;L</th>
                  <th className="px-1 py-1">Action</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => {
                  const currentPrice = openPrices[p.symbol] ?? null;
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
                        {currentPrice !== null
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
                        {p.status === "open" && currentPrice !== null && (
                          <button
                            onClick={() => handleClose(p, currentPrice)}
                            className="text-blue-500 hover:underline"
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
