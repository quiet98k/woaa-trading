/**
 * @fileoverview Dashboard page that displays the user and admin views for the trading simulation.
 * Includes simulated and real balances, a candlestick chart, user trade controls, and admin fee settings.
 */

import Chart from "../components/HistoricalChart";

import {
  createContext,
  useState,
  Component,
  type ReactNode,
  useEffect,
} from "react";
import { useMe } from "../hooks/useUser";
import { logout } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { PositionTable } from "../components/positionTable";
import SharesInput from "../components/SharesInput";
import SimulationControls from "../components/SimulationControls";
import { AdminSettingsPanel } from "../components/AdminControls";
import { MarginManager } from "../components/MarginManager";
import { UserPortfolio } from "../components/UserPortfolio";
import RealTimeChart from "../components/RealTimeChart";
import RealTimeSharesInput from "../components/RealTimeSharesInput";
import MarketStatusBanner from "../components/MarketStatusBanner";

export type DataMode = "historical" | "realtime";
export interface DataModeState {
  mode: DataMode;
  setMode: (mode: DataMode) => void;
}

export interface ChartState {
  symbol: string;
  openPrices: Record<string, number | null>;
}

export const ChartContext = createContext<{
  symbol: string;
  openPrices: Record<string, number | null>;
  setChartState: (state: ChartState) => void;
  mode: DataMode;
  setMode: (mode: DataMode) => void;
}>({
  symbol: "",
  openPrices: {},
  setChartState: () => {},
  mode: "historical",
  setMode: () => {},
});

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Caught in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError)
      return <div>Something went wrong in the chart.</div>;
    return this.props.children;
  }
}

export default function Dashboard() {
  const navigate = useNavigate();

  // ✅ Fetch authenticated user using React Query
  const { data: user, isLoading, isError } = useMe();

  const [chartState, setChartState] = useState<ChartState>({
    symbol: "",
    openPrices: {},
  });

  const [mode, setMode] = useState<DataMode>(() => {
    const saved = localStorage.getItem("dataMode");
    return saved === "realtime" ? "realtime" : "historical";
  });

  useEffect(() => {
    localStorage.setItem("dataMode", mode);
  }, [mode]);

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
      <ChartContext.Provider
        value={{ ...chartState, setChartState, mode, setMode }}
      >
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
              <ErrorBoundary>
                {mode === "historical" ? <Chart /> : <RealTimeChart />}
              </ErrorBoundary>
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
              {mode === "historical" ? (
                <SharesInput />
              ) : (
                <RealTimeSharesInput />
              )}
            </div>

            {/* Simulation Controls */}
            <div className="flex-1 h-full border border-gray-300 rounded-md p-2 bg-gray-100 shadow-sm flex flex-col justify-between overflow-auto">
              {mode === "historical" ? (
                <SimulationControls />
              ) : (
                <MarketStatusBanner />
              )}
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
