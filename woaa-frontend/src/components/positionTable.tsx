/**
 * @fileoverview Table component to display user trading positions with delete buttons for testing.
 */

import React, { type JSX } from "react";
import { useMyPositions, useDeletePosition } from "../hooks/usePositions";

/**
 * Table component to display a list of user positions.
 *
 * Fetches data internally and allows deletion for testing purposes.
 *
 * @returns Rendered JSX element showing the position table or appropriate messages.
 */
export function PositionTable(): JSX.Element {
  const { data: positions, isLoading } = useMyPositions();
  const deleteMutation = useDeletePosition(); // ✅ Use the hook once

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
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
              <th className="px-1 py-1">Shares</th>
              <th className="px-1 py-1">Status</th>
              <th className="px-1 py-1">P&amp;L</th>
              <th className="px-1 py-1">Action</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="px-1 py-1">{p.symbol}</td>
                <td className="px-1 py-1">{p.position_type}</td>
                <td className="px-1 py-1">${p.open_price.toFixed(2)}</td>
                <td className="px-1 py-1">{p.open_shares}</td>
                <td className="px-1 py-1">{p.status}</td>
                <td className="px-1 py-1">
                  {p.status === "closed"
                    ? `$${p.realized_pl?.toFixed(2) ?? "0.00"}`
                    : "—"}
                </td>
                <td className="px-1 py-1">
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500 text-sm">No positions found.</p>
      )}
    </div>
  );
}
