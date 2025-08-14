/**
 * @fileoverview Input component for specifying number of shares to trade
 * using the latest open price, user settings, and selected symbol from the ChartContext.
 */

import { useState, type JSX, useContext } from "react";
// import { useCreatePosition } from "../hooks/usePositions";
// import { useCreateTransaction } from "../hooks/useTransactions";
import { useMe } from "../hooks/useUser";
import { useUserSettings } from "../hooks/useUserSettings";
import { ChartContext } from "../pages/Dashboard";
import { useTradeProcessing } from "../stores/useTradeProcessing";
import { useCreateTrade } from "../hooks/useTrade";

/**
 * Component for entering the number of shares to buy/short for the selected stock.
 *
 * @returns JSX element representing trading controls.
 */
export default function SharesInput(): JSX.Element {
  const [shares, setShares] = useState<number>(1);
  // const createTransaction = useCreateTransaction();
  // const createPosition = useCreatePosition();
  const { data: user } = useMe();
  // const updateBalances = useUpdateUserBalances(user?.id ?? "");
  const { data: settings } = useUserSettings();
  const { symbol, openPrices } = useContext(ChartContext);
  const createTradeMutation = useCreateTrade();

  const openPrice = openPrices[symbol];

  if (!symbol || openPrice === null || openPrice === undefined || !settings) {
    return (
      <div className="text-black">Loading symbol, price, or settings...</div>
    );
  }

  const handleTrade = async (type: "Long" | "Short") => {
    if (!user || !settings || !openPrice || !symbol) return;
    if (shares <= 0) {
      alert("Shares must be greater than 0.");
      return;
    }

    const { setProcessing } = useTradeProcessing.getState();
    console.log("set Processing True in SharesInput");
    setProcessing(true);

    try {
      await createTradeMutation.mutateAsync({
        symbol,
        shares,
        price: openPrice,
        action: type === "Long" ? "buy" : "short",
        notes: "",
      });

      console.log("Trade created successfully");
    } catch (err: any) {
      console.error("Trade creation failed:", err);
      // alert(err.message || "Failed to create trade");
    } finally {
      console.log("set Processing False in SharesInput");
      setProcessing(false);
    }
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
