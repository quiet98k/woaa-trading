/**
 * @fileoverview Input component for specifying number of shares to trade
 * using the latest open price, user settings, and selected symbol from the ChartContext.
 */

import { useState, type JSX, useContext } from "react";
import { useCreatePosition } from "../hooks/usePositions";
import { useCreateTransaction } from "../hooks/useTransactions";
import { useMe, useUpdateUserBalances } from "../hooks/useUser";
import { useUserSettings } from "../hooks/useUserSettings";
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
  const updateBalances = useUpdateUserBalances(user?.id ?? "");
  const { data: settings } = useUserSettings();
  const { symbol, openPrices } = useContext(ChartContext);

  const openPrice = openPrices[symbol];

  if (!symbol || openPrice === null || openPrice === undefined || !settings) {
    return <div>Loading symbol, price, or settings...</div>;
  }

  const handleTrade = (type: "Long" | "Short") => {
    if (!user) return;

    const baseCost = shares * openPrice;
    const commission = parseFloat(
      (baseCost * settings.commission_rate).toFixed(2)
    );
    const roundedBaseCost = parseFloat(baseCost.toFixed(2));

    const totalSimCost = type === "Long" ? -roundedBaseCost : roundedBaseCost;

    const newSimBalance = parseFloat(
      ((user.sim_balance ?? 0) + totalSimCost).toFixed(2)
    );
    const newRealBalance =
      (user.real_balance ?? 0) -
      (settings.commission_type === "real" ? commission : 0);
    const newSimBalanceAfterCommission =
      newSimBalance - (settings.commission_type === "sim" ? commission : 0);

    if (newSimBalanceAfterCommission < 0) {
      alert("Insufficient simulated balance (including commission).");
      return;
    }
    if (newRealBalance < 0) {
      alert("Insufficient real balance to cover commission.");
      return;
    }

    createTransaction.mutate(
      {
        symbol,
        shares,
        price: openPrice,
        action: type === "Long" ? "buy" : "short",
        notes: "",
        commission_charged: parseFloat(commission.toFixed(2)),
        commission_type: settings.commission_type,
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
            sim_balance: parseFloat(newSimBalanceAfterCommission.toFixed(2)),
            real_balance: parseFloat(newRealBalance.toFixed(2)),
          });
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <p className="text-xs text-gray-600">
        {symbol} @ ${openPrice.toFixed(2)}
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
