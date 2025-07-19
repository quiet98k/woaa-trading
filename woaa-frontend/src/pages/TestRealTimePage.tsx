import RealTimeChart from "../components/RealTimeChart";
import { useRealTimeData } from "../hooks/useRealTimeData";

const SYMBOL_OPTIONS: Record<string, string> = {
  Apple: "AAPL",
  Google: "GOOGL",
  Nvidia: "NVDA",
  Costco: "COST",
  Spy: "SPY",
  Dia: "DIA",
  QQQ: "QQQ",
  Lucid: "LCID",
  VXX: "VXX",
};

export default function TestRealTimePage() {
  const symbols = Object.values(SYMBOL_OPTIONS);
  const { latestBars, connectionStatus, authStatus } = useRealTimeData(symbols);

  return (
    <div className="flex h-screen gap-4 p-4 bg-black text-white">
      {/* Left: Chart */}
      <div className="flex-1 rounded-lg overflow-hidden bg-[#0F0F0F] shadow-md">
        <RealTimeChart />
      </div>

      {/* Right: Status + Real-time data */}
      <div className="w-[480px] flex-shrink-0 rounded-lg bg-[#111] p-4 shadow-md overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">📊 Real-Time Minute Bars</h2>

        {/* Connection and Auth Status */}
        <div className="mb-4">
          <div className="text-sm">
            🔌 Connection:{" "}
            <span
              className={
                connectionStatus === "connected"
                  ? "text-green-400"
                  : "text-red-400"
              }
            >
              {connectionStatus}
            </span>
          </div>
          <div className="text-sm">
            🛡️ Auth:{" "}
            <span
              className={
                authStatus === "authenticated"
                  ? "text-green-400"
                  : authStatus === "pending"
                  ? "text-yellow-400"
                  : "text-red-400"
              }
            >
              {authStatus}
            </span>
          </div>
        </div>

        {/* Table */}
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-[#222]">
              <th className="text-left py-2 px-2 border-b border-[#333]">
                Symbol
              </th>
              <th className="text-left py-2 px-2 border-b border-[#333]">
                Time
              </th>
              <th className="text-left py-2 px-2 border-b border-[#333]">
                Open
              </th>
              <th className="text-left py-2 px-2 border-b border-[#333]">
                High
              </th>
              <th className="text-left py-2 px-2 border-b border-[#333]">
                Low
              </th>
              <th className="text-left py-2 px-2 border-b border-[#333]">
                Close
              </th>
              <th className="text-left py-2 px-2 border-b border-[#333]">
                Vol
              </th>
            </tr>
          </thead>
          <tbody>
            {symbols.map((symbol) => {
              const bar = latestBars[symbol];
              return (
                <tr key={symbol} className="hover:bg-[#1c1c1c] transition">
                  <td className="py-1 px-2">{symbol}</td>
                  <td className="py-1 px-2">
                    {bar ? new Date(bar.t).toLocaleTimeString() : "--"}
                  </td>
                  <td className="py-1 px-2">{bar?.o ?? "--"}</td>
                  <td className="py-1 px-2">{bar?.h ?? "--"}</td>
                  <td className="py-1 px-2">{bar?.l ?? "--"}</td>
                  <td className="py-1 px-2">{bar?.c ?? "--"}</td>
                  <td className="py-1 px-2">{bar?.v ?? "--"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
