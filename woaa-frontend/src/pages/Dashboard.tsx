// src/pages/Dashboard.tsx

export default function Dashboard() {
  return (
    <div className="min-h-screen w-full space-y-2 bg-gray-100 p-2">
      {/* User View */}
      <div className="w-full h-[70vh] border border-gray-400 p-2 bg-white rounded-lg shadow-sm flex flex-col gap-2">
        {/* User Portfolio */}
        <div className="flex-1 border border-purple-400 p-2 rounded-md">
          <div className="flex justify-between items-center gap-2 h-full">
            {/* Simulated Value */}
            <div className="flex-1 border border-green-300 bg-green-50 p-2 rounded-md shadow-sm flex items-center justify-between">
              <span className="text-sm text-gray-600">Simulated Value</span>
              <span className="text-lg font-semibold text-green-700">
                $10,000
              </span>
            </div>
            {/* Real Money */}
            <div className="flex-1 border border-blue-300 bg-blue-50 p-2 rounded-md shadow-sm flex items-center justify-between">
              <span className="text-sm text-gray-600">Real Money</span>
              <span className="text-lg font-semibold text-blue-700">
                $1,000
              </span>
            </div>
          </div>
        </div>
        {/* Stock Data */}
        <div className="flex-[6] border border-green-400 p-2 rounded-md">
          <div className="flex h-full gap-2">
            {/* Stock Chart */}
            <div className="w-[60%] border border-gray-300 rounded-md p-2 bg-gray-50 shadow-sm flex items-center justify-center">
              <p className="text-gray-500 text-sm">[Stock Chart Placeholder]</p>
            </div>
            {/* Stock Table */}
            <div className="w-[40%] border border-gray-300 rounded-md p-2 bg-gray-50 shadow-sm flex items-center justify-center">
              <p className="text-gray-500 text-sm">[Stock Table Placeholder]</p>
            </div>
          </div>
        </div>
        {/* User Action */}
        <div className="flex-[3] border border-orange-400 p-2 rounded-md">
          <div className="flex h-full gap-1">
            {/* Action 1 */}
            <div className="flex-1 border border-gray-300 rounded-md p-1 bg-gray-50 shadow-sm flex flex-col justify-between gap-1">
              {/* Number of Shares */}
              <div className="flex items-center gap-2">
                <label className="w-1/2 text-xs text-gray-500">
                  Number of Shares
                </label>
                <input
                  type="number"
                  className="flex-1 border border-gray-300 text-black rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="10"
                />
              </div>
              {/* Stop Loss */}
              <div className="flex items-center gap-2">
                <label className="w-1/2 text-xs text-gray-500">Stop Loss</label>
                <input
                  type="number"
                  className="flex-1 border border-gray-300 text-black rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="100.00"
                />
              </div>
              {/* Trailing Stop Loss */}
              <div className="flex items-center gap-2">
                <label className="w-1/2 text-xs text-gray-500">
                  Trailing Stop Loss
                </label>
                <input
                  type="number"
                  className="flex-1 border border-gray-300 text-black rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="2.5"
                />
              </div>
              {/* Buy/Sell Buttons */}
              <div className="flex justify-between gap-2">
                <button className="flex-1 max-h-[80px] bg-green-500 hover:bg-green-600 text-xs py-1 rounded-md">
                  Buyy
                </button>
                <button className="flex-1 max-h-[80px] bg-red-500 hover:bg-red-600 text-xs py-1 rounded-md">
                  Selll
                </button>
              </div>
            </div>

            {/* Action 2 */}
            <div className="flex-1 border border-gray-300 rounded-md p-2 bg-gray-50 shadow-sm flex items-center justify-center">
              <p className="text-gray-500 text-sm">[Action 2 Placeholder]</p>
            </div>

            {/* Action 3 */}
            <div className="flex-1 border border-gray-300 rounded-md p-2 bg-gray-50 shadow-sm flex items-center justify-center">
              <p className="text-gray-500 text-sm">[Action 3 Placeholder]</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin View */}
      <div
        className="w-full h-[30vh] border border-blue-400 p-2 bg-white rounded-lg shadow-sm grid gap-2"
        style={{
          display: "grid",
          gridTemplateAreas: `
            "a b c"
            "d e f"
          `,
          gridTemplateColumns: "1fr 1fr 1fr",
          gridTemplateRows: "1fr 1fr",
        }}
      >
        <div
          className="border border-gray-400 rounded-md flex items-center justify-center text-gray-700 text-sm"
          style={{ gridArea: "a" }}
        >
          Commission
        </div>
        <div
          className="border border-gray-400 rounded-md flex items-center justify-center text-gray-700 text-sm"
          style={{ gridArea: "b" }}
        >
          Margin
        </div>
        <div
          className="border border-gray-400 rounded-md flex items-center justify-center text-gray-700 text-sm"
          style={{ gridArea: "c" }}
        >
          Gain & Drawdown Percentages
        </div>
        <div
          className="border border-gray-400 rounded-md flex items-center justify-center text-gray-700 text-sm"
          style={{ gridArea: "d" }}
        >
          Holding Cost
        </div>
        <div
          className="border border-gray-400 rounded-md flex items-center justify-center text-gray-700 text-sm"
          style={{ gridArea: "e" }}
        >
          Overnight Fee
        </div>
        <div
          className="border border-gray-400 rounded-md flex items-center justify-center text-gray-700 text-sm"
          style={{ gridArea: "f" }}
        >
          Power Up Setting
        </div>
      </div>
    </div>
  );
}
