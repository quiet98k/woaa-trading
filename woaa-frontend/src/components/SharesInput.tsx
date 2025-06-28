/**
 * @fileoverview Input component for specifying number of shares to trade
 * using the latest open price and selected symbol from the ChartContext.
 */

import React, { useState, type JSX, useContext } from "react";
import { useCreatePosition } from "../hooks/usePositions";
import { useCreateTransaction } from "../hooks/useTransactions";
import { useMe, useUpdateUserBalances } from "../hooks/useUser";
import { ChartContext } from "../pages/Dashboard";

/**
 * Component for entering the number of shares to buy/short for the selected stock.
 *
 * @returns JSX element representing trading controls.
 */
export default function SharesInput(): JSX.Element {
  const [shares, setShares] = useState<number>(1);
  const createTransaction = useCreateTransaction();
  const createPosition = useCreatePosition();
  const { data: user } = useMe();
  const { symbol, openPrice } = useContext(ChartContext);
  const updateBalances = useUpdateUserBalances(user?.id ?? "");

  if (!symbol || !openPrice) return <div>Loading symbol and price...</div>;

  const handleTrade = (type: "Long" | "Short") => {
    if (!openPrice || !user) return;
    const cost = shares * openPrice;

    if ((user.sim_balance ?? 0) < cost) {
      alert("Insufficient simulated balance.");
      return;
    }

    createTransaction.mutate(
      {
        symbol,
        shares,
        price: openPrice,
        action: type === "Long" ? "buy" : "short",
        notes: "",
        commission_charged: 0,
        commission_type: "sim",
      },
      {
        onSuccess: () => {
          createPosition.mutate({
            symbol,
            position_type: type,
            open_price: openPrice,
            open_shares: shares,
          });

          updateBalances.mutate({
            sim_balance: parseFloat(
              (
                (user.sim_balance ?? 0) + (type === "Long" ? -cost : cost)
              ).toFixed(2)
            ),
          });
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <p className="text-xs text-gray-600">
        {symbol} @ ${openPrice?.toFixed(2) ?? "—"}
      </p>

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

      <div className="flex gap-2">
        <button
          onClick={() => handleTrade("Long")}
          disabled={!openPrice}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs py-1 rounded-md disabled:opacity-50"
        >
          Buy
        </button>
        <button
          onClick={() => handleTrade("Short")}
          disabled={!openPrice}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs py-1 rounded-md disabled:opacity-50"
        >
          Short
        </button>
      </div>
    </div>
  );
}
