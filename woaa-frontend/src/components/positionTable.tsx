import React, { type JSX, useContext } from "react";
import {
  useMyPositions,
  useDeletePosition,
  useUpdatePosition,
} from "../hooks/usePositions";
import { ChartContext } from "../pages/Dashboard";
import { useMe, useUpdateUserBalances } from "../hooks/useUser";

/**
 * Table component to display a list of user positions with live open prices.
 *
 * @returns Rendered JSX element showing the position table or appropriate messages.
 */
export function PositionTable(): JSX.Element {
  const { data: positions, isLoading } = useMyPositions();
  const { data: user } = useMe();
  const deleteMutation = useDeletePosition();
  // Remove this line, and instead call useUpdatePosition with the position ID inside handleClose
  const updateBalances = useUpdateUserBalances(user?.id ?? "");
  const { openPrices } = useContext(ChartContext);

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

  const handleClose = (p: any, currentPrice: number) => {
    const realized =
      (currentPrice - p.open_price) *
      (p.position_type === "Long" ? p.open_shares : -p.open_shares);

    const updatePosition = useUpdatePosition(p.id);

    updatePosition.mutate(
      {
        positionId: p.id,
        updates: {
          close_price: currentPrice,
          close_shares: p.open_shares,
          close_time: new Date().toISOString(),
          realized_pl: realized,
          status: "closed",
        },
      },
      {
        onSuccess: () => {
          if (user) {
            const netCash =
              currentPrice *
              (p.position_type === "Long" ? p.open_shares : -p.open_shares);
            updateBalances.mutate({
              sim_balance: parseFloat((user.sim_balance + netCash).toFixed(2)),
            });
          }
        },
      }
    );
  };

  return (
    <div className="w-full h-full">
      {isLoading ? (
        <p className="text-gray-500 text-sm">Loading positions...</p>
      ) : positions && positions.length > 0 ? (
        <table className="w-full text-xs text-gray-700">
          <thead>
            <tr className="border-b text-left">
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
      ) : (
        <p className="text-gray-500 text-sm">No positions found.</p>
      )}
    </div>
  );
}
