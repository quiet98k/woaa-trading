/**
 * @fileoverview Dashboard page that displays the user and admin views for the trading simulation.
 * Includes simulated and real balances, a candlestick chart, user trade controls, and admin fee settings.
 */

import Chart from "../components/chart";

import { createContext, useState } from "react";
import { useMe } from "../hooks/useUser";
import { logout } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { PositionTable } from "../components/positionTable";
import SharesInput from "../components/SharesInput";
import SimulationControls from "../components/SimulationControls";
import { AdminSettingsPanel } from "../components/AdminControls";
import { MarginManager } from "../components/MarginManager";
import { UserPortfolio } from "../components/UserPortfolio";

export interface ChartState {
  symbol: string;
  openPrices: Record<string, number | null>;
}

export const ChartContext = createContext<{
  symbol: string;
  openPrices: Record<string, number | null>;
  setChartState: (state: ChartState) => void;
}>({
  symbol: "",
  openPrices: {},
  setChartState: () => {},
});

export default function Dashboard() {
  const navigate = useNavigate();

  // ✅ Fetch authenticated user using React Query
  const { data: user, isLoading, isError } = useMe();

  const [chartState, setChartState] = useState<ChartState>({
    symbol: "",
    openPrices: {},
  });

  // ✅ Handle loading and error states
  if (isLoading) return <div>Loading...</div>;
  if (isError || !user) {
    return (
      <div className="text-red-500 p-4">
        Session expired or failed to load user.{" "}
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="underline text-blue-600"
        >
          Re-login
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <ChartContext.Provider value={{ ...chartState, setChartState }}>
        {/* User View */}
        <div className="flex-[7] flex flex-col gap-2 border border-gray-400 p-2 bg-white rounded-lg shadow-sm overflow-hidden">
          {/* User Portfolio */}
          <div className="flex-[1.5] border border-purple-400 p-2 rounded-md overflow-auto">
            <UserPortfolio />
          </div>

          {/* Stock Data */}
          <div className="flex-[6] flex gap-2 border border-green-400 p-2 rounded-md overflow-hidden">
            {/* Stock Chart */}
            <div className="w-[60%] h-full border border-gray-300 rounded-md p-2 bg-gray-70 shadow-sm text-black overflow-hidden">
              <Chart setChartState={setChartState} />
            </div>

            {/* Position Table */}
            <div className="w-[40%] h-full border border-gray-300 rounded-md p-2 bg-gray-50 shadow-sm flex items-center justify-center overflow-auto">
              <PositionTable />
            </div>
          </div>

          {/* User Actions */}
          <div className="flex-[2.5] flex gap-2 border border-orange-400 p-2 rounded-md overflow-hidden">
            {/* Shares Input */}
            <div className="flex-1 h-full border border-gray-300 rounded-md p-2 bg-gray-50 shadow-sm flex flex-col justify-between overflow-auto">
              <SharesInput />
            </div>

            {/* Simulation Controls */}
            <div className="flex-1 h-full border border-gray-300 rounded-md p-2 bg-gray-100 shadow-sm flex flex-col justify-between overflow-auto">
              <SimulationControls />
            </div>

            {/* Margin Manager */}
            <div className="flex-1 h-full border border-gray-300 rounded-md p-2 bg-gray-100 shadow-sm flex flex-col justify-between overflow-auto">
              <MarginManager />
            </div>
          </div>
        </div>
      </ChartContext.Provider>

      {/* Admin View */}
      <div className="flex-[3] min-h-0 border border-blue-400 p-2 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
        <AdminSettingsPanel />
      </div>
    </div>
  );
}
