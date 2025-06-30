/**
 * @fileoverview Dashboard page that displays the user and admin views for the trading simulation.
 * Includes simulated and real balances, a candlestick chart, user trade controls, and admin fee settings.
 */

import Chart from "../components/chart";

import { createContext, useState } from "react";
import { useMe, useUpdateUserBalances } from "../hooks/useUser";
import { logout } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { PositionTable } from "../components/positionTable";
import SharesInput from "../components/SharesInput";
import SimulationControls from "../components/SimulationControls";
import { AdminSettingsPanel } from "../components/AdminControls";

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

  const [isEditingSim, setIsEditingSim] = useState(false);
  const [isEditingReal, setIsEditingReal] = useState(false);
  const [newSimValue, setNewSimValue] = useState(user?.sim_balance || 0);
  const [newRealValue, setNewRealValue] = useState(user?.real_balance || 0);

  const updateUser = useUpdateUserBalances(user?.id ?? ""); // assumes user is loaded

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
    <div className="min-h-screen w-full space-y-2 bg-gray-100 p-2">
      <ChartContext.Provider value={{ ...chartState, setChartState }}>
        {/* User View */}
        <div className="w-full h-[70vh] border border-gray-400 p-2 bg-white rounded-lg shadow-sm flex flex-col gap-2">
          {/* User Portfolio */}
          <div className="flex-1 border border-purple-400 p-2 rounded-md flex flex-col gap-2">
            {/* User Info */}
            {user && (
              <div className="flex justify-between items-center text-xs text-gray-700 px-1">
                <div className="flex flex-col">
                  <div>
                    <strong>User:</strong> {user.username}
                  </div>
                  <div>
                    <strong>Email:</strong> {user.email}
                  </div>
                  <div>
                    <strong>Role:</strong>{" "}
                    {user.is_admin ? (
                      <span className="text-red-600 font-semibold">Admin</span>
                    ) : (
                      <span className="text-gray-600">Regular User</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs"
                >
                  Logout
                </button>
              </div>
            )}
            {/* Balance Info */}
            <div className="flex justify-between items-center gap-2 h-full">
              {/* Simulated Value */}
              <div className="flex-1 border border-green-300 bg-green-50 p-2 rounded-md shadow-sm flex items-center justify-between gap-2">
                <span className="text-sm text-gray-600">Simulated Value</span>
                {isEditingSim ? (
                  <>
                    <input
                      type="number"
                      className="w-24 px-2 py-1 text-sm text-black border rounded-md"
                      value={newSimValue}
                      placeholder={user?.sim_balance?.toString() ?? ""}
                      onChange={(e) =>
                        setNewSimValue(parseFloat(e.target.value))
                      }
                    />
                    <button
                      className="text-green-700 font-bold"
                      onClick={() => {
                        updateUser.mutate({ sim_balance: newSimValue });
                        setIsEditingSim(false);
                      }}
                    >
                      ✅
                    </button>
                    <button
                      className="text-red-500 font-bold"
                      onClick={() => setIsEditingSim(false)}
                    >
                      ❌
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-lg font-semibold text-green-700">
                      ${user?.sim_balance?.toLocaleString() ?? "—"}
                    </span>
                    <button
                      className="text-sm text-green-600 underline"
                      onClick={() => {
                        setNewSimValue(user?.sim_balance ?? 0);
                        setIsEditingSim(true);
                      }}
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>

              {/* Real Money */}
              <div className="flex-1 border border-blue-300 bg-blue-50 p-2 rounded-md shadow-sm flex items-center justify-between gap-2">
                <span className="text-sm text-gray-600">Real Money</span>
                {isEditingReal ? (
                  <>
                    <input
                      type="number"
                      className="w-24 px-2 py-1 text-sm text-black border rounded-md"
                      value={newRealValue}
                      onChange={(e) =>
                        setNewRealValue(parseFloat(e.target.value))
                      }
                    />
                    <button
                      className="text-blue-700 font-bold"
                      onClick={() => {
                        updateUser.mutate({ real_balance: newRealValue });
                        setIsEditingReal(false);
                      }}
                    >
                      ✅
                    </button>
                    <button
                      className="text-red-500 font-bold"
                      onClick={() => setIsEditingReal(false)}
                    >
                      ❌
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-lg font-semibold text-blue-700">
                      ${user?.real_balance?.toLocaleString() ?? "—"}
                    </span>
                    <button
                      className="text-sm text-blue-600 underline"
                      onClick={() => setIsEditingReal(true)}
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          {/* Stock Data */}
          <div className="flex-[6] border border-green-400 p-2 rounded-md">
            <div className="flex h-full gap-2">
              {/* Stock Chart */}
              <div className="w-[60%] border border-gray-300 rounded-md p-2 bg-gray-70 shadow-sm">
                <div className="w-full h-[500px] text-black">
                  <Chart setChartState={setChartState} />
                </div>
              </div>

              {/* Position Table */}
              <div className="w-[40%] border border-gray-300 rounded-md p-2 bg-gray-50 shadow-sm flex items-center justify-center">
                <PositionTable />
              </div>
            </div>
          </div>
          {/* User Action */}
          <div className="flex-[3] border border-orange-400 p-2 rounded-md">
            <div className="flex h-full gap-1">
              {/* Action 1 */}
              <div className="flex-1 border border-gray-300 rounded-md p-2 bg-gray-50 shadow-sm flex items-center justify-between gap-4">
                <SharesInput />
              </div>

              {/* Action 2 */}
              <div className="flex-1 border border-gray-300 rounded-md p-2 bg-gray-100 shadow-sm flex flex-col justify-between text-xs gap-3">
                <SimulationControls />
              </div>

              {/* Action 3 */}
              <div className="flex-1 border border-gray-300 rounded-md p-2 bg-gray-100 shadow-sm flex items-center justify-center">
                <div className="flex gap-4">
                  <button className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 py-1 rounded-md focus:outline-none active:outline-none">
                    Power Up
                  </button>
                  <button className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-4 py-1 rounded-md focus:outline-none active:outline-none">
                    Flatten
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ChartContext.Provider>

      {/* Admin View */}
      <div className="w-full h-[35vh] border border-blue-400 p-2 bg-white rounded-lg shadow-sm grid gap-2">
        <AdminSettingsPanel />
      </div>
    </div>
  );
}
