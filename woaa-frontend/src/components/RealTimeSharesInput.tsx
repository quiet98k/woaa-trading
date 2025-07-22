import { useRef, useState, type JSX } from "react";
import { useCreateTransaction } from "../hooks/useTransactions";
import { useCreatePosition } from "../hooks/usePositions";
import { useMe, useUpdateUserBalances } from "../hooks/useUser";
import { useUserSettings } from "../hooks/useUserSettings";
import { useRealTimeData } from "../hooks/useRealTimeData";
import { useMarketClock } from "../hooks/useMarketClock";

export default function RealTimeSharesInput(): JSX.Element {
  const createTransaction = useCreateTransaction();
  const createPosition = useCreatePosition();

  const [symbol, setSymbol] = useState("");
  const [shares, setShares] = useState<number>(1);
  const [trackedSymbol, setTrackedSymbol] = useState<string | null>(null);
  const [tradePrice, setTradePrice] = useState<number | null>(null);
  const [tradeTime, setTradeTime] = useState<string | null>(null);
  const trackedSymbolRef = useRef<string | null>(null);

  const { data: user } = useMe();
  const updateBalances = useUpdateUserBalances(user?.id ?? "");
  const { data: settings } = useUserSettings();
  const { clock, loading: clockLoading } = useMarketClock();

  const marketOpen = clock?.is_open;

  const { subscribe } = useRealTimeData((data) => {
    if (!trackedSymbolRef.current) return;

    const msg = Array.isArray(data) ? data[0] : data;

    if (msg?.T === "t") {
      const match = msg.S === trackedSymbolRef.current;
      // console.log(
      //   `[${match ? "✅ Match" : "🚫 Mismatch"}] Trade for ${msg.S} @ $${
      //     msg.p
      //   } — tracking ${trackedSymbolRef.current}`
      // );
      if (match) {
        setTradePrice(msg.p);
        setTradeTime(msg.t); // save the timestamp
      }
    }
  });

  const handleStartTracking = () => {
    const trimmed = symbol.trim().toUpperCase();
    if (trimmed) {
      trackedSymbolRef.current = trimmed; // <== set ref
      setTrackedSymbol(trimmed); // just for UI
      subscribe(trimmed);
    }
  };

  const handleTrade = (type: "Long" | "Short") => {
    if (!user || !settings || !tradePrice || !trackedSymbol) return;
    if (shares <= 0) {
      alert("Shares must be greater than 0.");
      return;
    }

    const baseCost = parseFloat((shares * tradePrice).toFixed(2));
    const commissionRaw = baseCost * settings.commission_rate;
    const commission = parseFloat(commissionRaw.toFixed(2));

    const totalSimCost = type === "Long" ? -baseCost : baseCost;

    const simCommission = settings.commission_type === "sim" ? commission : 0;
    const realCommission = settings.commission_type === "real" ? commission : 0;

    const newSimBalance = parseFloat(
      ((user.sim_balance ?? 0) + totalSimCost - simCommission).toFixed(2)
    );
    const newRealBalance = parseFloat(
      ((user.real_balance ?? 0) - realCommission).toFixed(2)
    );

    if (newSimBalance < 0) {
      alert("Insufficient simulated balance (including commission).");
      return;
    }
    if (newRealBalance < 0) {
      alert("Insufficient real balance to cover commission.");
      return;
    }

    createTransaction.mutate(
      {
        symbol: trackedSymbol,
        shares,
        price: tradePrice,
        action: type === "Long" ? "buy" : "short",
        notes: "",
        commission_charged: commission,
        commission_type: settings.commission_type,
      },
      {
        onSuccess: () => {
          createPosition.mutate({
            symbol: trackedSymbol,
            position_type: type,
            open_price: tradePrice,
            open_shares: shares,
          });

          updateBalances.mutate({
            sim_balance: newSimBalance,
            real_balance: newRealBalance,
          });
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Symbol Input */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="Enter Symbol (e.g., AAPL)"
          className="flex-1 border border-gray-300 text-black rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={handleStartTracking}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs"
        >
          Track
        </button>
      </div>

      {/* Price Display */}

      {/* {trackedSymbol && (
        <>
          {clockLoading ? (
            <p className="text-xs text-gray-600">Checking market status...</p>
          ) : marketOpen ? (
            tradePrice ? (
              <p className="text-xs text-gray-600">
                {trackedSymbol} @ ${tradePrice.toFixed(2)}
                {tradeTime && (
                  <span className="ml-2 text-gray-400">
                    ({new Date(tradeTime).toLocaleTimeString()})
                  </span>
                )}
              </p>
            ) : (
              <p className="text-xs text-orange-500">Waiting for price...</p>
            )
          ) : tradePrice ? (
            <p className="text-xs text-gray-600">
              {trackedSymbol} @ ${tradePrice.toFixed(2)}
              {tradeTime && (
                <span className="ml-2 text-gray-400">
                  ({new Date(tradeTime).toLocaleTimeString()})
                </span>
              )}
            </p>
          ) : (
            <p className="text-xs text-orange-500">Waiting for price...</p>
          )}
        </>
      )} */}
      {trackedSymbol && (
        <>
          {clockLoading ? (
            <p className="text-xs text-gray-600">Checking market status...</p>
          ) : marketOpen ? (
            tradePrice ? (
              <p className="text-xs text-gray-600">
                {trackedSymbol} @ ${tradePrice.toFixed(2)}
                {tradeTime && (
                  <span className="ml-2 text-gray-400">
                    ({new Date(tradeTime).toLocaleTimeString()})
                  </span>
                )}
              </p>
            ) : (
              <p className="text-xs text-orange-500">Waiting for price...</p>
            )
          ) : (
            <p className="text-xs text-red-500">Market is closed</p>
          )}
        </>
      )}

      {/* Shares Input */}
      <div className="flex items-center gap-2">
        <label className="w-1/2 text-xs text-gray-500">Number of Shares</label>
        <input
          type="number"
          value={shares}
          onChange={(e) => setShares(Number(e.target.value))}
          className="flex-1 border border-gray-300 text-black rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          min={1}
        />
      </div>

      {/* Trade Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handleTrade("Long")}
          disabled={!tradePrice || !marketOpen}
          // disabled={!tradePrice}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs py-1 rounded-md disabled:opacity-50"
        >
          Buy
        </button>
        <button
          onClick={() => handleTrade("Short")}
          disabled={!tradePrice || !marketOpen}
          // disabled={!tradePrice}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs py-1 rounded-md disabled:opacity-50"
        >
          Short
        </button>
      </div>
    </div>
  );
}
