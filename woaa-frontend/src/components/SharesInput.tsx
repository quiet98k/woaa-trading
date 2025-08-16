/**
 * @fileoverview Input component for specifying number of shares to trade
 * using the latest open price, user settings, and selected symbol from the ChartContext.
 */

import { useState, type JSX, useContext } from "react";
// import { useCreatePosition } from "../hooks/usePositions";
// import { useCreateTransaction } from "../hooks/useTransactions";
import { useMe } from "../hooks/useUser";
import { useUserSettings } from "../hooks/useUserSettings";
import { useMyPositions } from "../hooks/usePositions";
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

  const { data: positions } = useMyPositions();

  const existingShortNotional =
    positions?.reduce((sum, p) => {
      if (p.position_type === "Short" && p.status === "open") {
        // ✅ use entry (open) price to measure original notional of current shorts
        return sum + (p.open_price ?? 0) * (p.open_shares ?? 0);
      }
      return sum;
    }, 0) ?? 0;

  const sim = user?.sim_balance ?? 0;
  const shortCapacity = Math.max(0, sim - existingShortNotional * 2);

  // New order’s notional at the **entry** price you’re about to use
  const newShortNotional = (openPrice ?? 0) * Math.max(0, shares);
  const canShort = newShortNotional <= shortCapacity;

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

    // 🚧 Short exposure check
    if (type === "Short") {
      if (!canShort) {
        const maxShares = Math.max(0, Math.floor(shortCapacity / openPrice));
        alert(
          `Short limit exceeded.\n` +
            `Existing short value: $${existingShortNotional.toFixed(2)}\n` +
            `Available capacity: $${shortCapacity.toFixed(2)}\n` +
            `This order needs: $${newShortNotional.toFixed(2)}\n` +
            (maxShares > 0
              ? `Max shares you can short now: ${maxShares}`
              : `You cannot short more right now.`)
        );
        return;
      }
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
    } finally {
      console.log("set Processing False in SharesInput");
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <p className="text-sm text-gray-600">
        {symbol} @ ${openPrice.toFixed(2)}
      </p>

      <div className="flex items-center gap-2">
        <label className="w-1/2 text-sm text-gray-500">Number of Shares</label>
        <input
          type="number"
          value={shares}
          onChange={(e) => setShares(Number(e.target.value))}
          className="flex-1 border border-gray-300 text-black rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="10"
          min={1}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleTrade("Long")}
          disabled={!openPrice}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm py-1 rounded-md disabled:opacity-50"
        >
          Buy
        </button>
        <button
          onClick={() => handleTrade("Short")}
          disabled={!openPrice}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm py-1 rounded-md disabled:opacity-50"
        >
          Short
        </button>
      </div>
      <p className="text-sm text-gray-500">
        Remaining short capacity: $ {shortCapacity.toFixed(2)}
      </p>
    </div>
  );
}
