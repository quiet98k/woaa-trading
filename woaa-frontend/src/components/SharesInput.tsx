/**
 * @fileoverview Input component for specifying number of shares to trade
 * for the current symbol, using the latest bar data from the chart.
 * First creates a transaction, and then creates a position upon success.
 */

import React, { useState, type JSX } from "react";
import { useCreatePosition } from "../hooks/usePositions";
import { useCreateTransaction } from "../hooks/useTransactions";
import { useMe, useUpdateUserBalances } from "../hooks/useUser";

export interface LatestBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface SharesInputProps {
  symbol: string;
  latestBar: LatestBar | null;
}

/**
 * Component for entering the number of shares to buy/short for the selected stock.
 *
 * @param symbol - Current selected stock symbol.
 * @param latestBar - Latest candlestick bar data (open, high, low, close).
 * @returns JSX element representing trading controls.
 */
export default function SharesInput({
  symbol,
  latestBar,
}: SharesInputProps): JSX.Element {
  const [shares, setShares] = useState<number>(1);
  const createTransaction = useCreateTransaction();
  const createPosition = useCreatePosition();
  const { data: user } = useMe(); // Ensure current user is loaded
  const updateBalances = useUpdateUserBalances(user?.id ?? "");

  const handleTrade = (type: "Long" | "Short") => {
    if (!latestBar || !user) return;

    const price = latestBar.open;
    const cost = shares * price;

    // 🚫 Check if user has enough simulated balance
    if ((user.sim_balance ?? 0) < cost) {
      alert("Insufficient simulated balance.");
      return;
    }

    // ✅ Proceed with transaction
    createTransaction.mutate(
      {
        symbol,
        shares,
        price,
        action: type === "Long" ? "buy" : "short",
        notes: "",
        commission_charged: 0,
        commission_type: "sim", // this may still vary, but sim_balance is always affected
      },
      {
        onSuccess: () => {
          createPosition.mutate({
            symbol,
            position_type: type,
            open_price: price,
            open_shares: shares,
          });

          updateBalances.mutate({
            sim_balance: (user.sim_balance ?? 0) - cost,
          });
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <p className="text-xs text-gray-600">
        {symbol} @ ${latestBar?.open.toFixed(2) ?? "—"}
      </p>

      {/* Number of Shares */}
      <div className="flex items-center gap-2">
        <label className="w-1/2 text-xs text-gray-500">Number of Shares</label>
        <input
          type="number"
          value={shares}
          onChange={(e) => setShares(Number(e.target.value))}
          className="flex-1 border border-gray-300 text-black rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="10"
          min={1}
        />
      </div>

      {/* Buy/Short Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handleTrade("Long")}
          disabled={!latestBar}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs py-1 rounded-md disabled:opacity-50"
        >
          Buy
        </button>
        <button
          onClick={() => handleTrade("Short")}
          disabled={!latestBar}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs py-1 rounded-md disabled:opacity-50"
        >
          Short
        </button>
      </div>

      {/* Placeholders for Stop Loss / TSL */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Stop Loss (coming soon)</span>
        <span>Trailing SL (coming soon)</span>
      </div>
    </div>
  );
}
