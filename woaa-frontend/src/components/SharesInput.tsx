/**
 * @fileoverview Input component for specifying number of shares to trade
 * for the current symbol, using the latest bar data from the chart.
 */

import React, { useState, type JSX } from "react";
import { useCreatePosition } from "../hooks/usePositions";

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
 * Component for entering the number of shares to buy/sell for the selected stock.
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
  const createPosition = useCreatePosition();

  const handleTrade = (type: "Long" | "Short") => {
    if (!latestBar) return;

    createPosition.mutate({
      symbol,
      position_type: type,
      open_price: latestBar.open,
      open_shares: shares,
    });
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

      {/* Buy/Sell Buttons */}
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
          Sell
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
