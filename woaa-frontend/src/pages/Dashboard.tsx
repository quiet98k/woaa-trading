/**
 * @fileoverview Dashboard page that displays the user and admin views for the trading simulation.
 * Includes simulated and real balances, a candlestick chart, user trade controls, and admin fee settings.
 */

import Chart from "../components/chart";

import { createContext, useState } from "react";
import { useMe, useUpdateUserBalances } from "../hooks/useUser";
import {
  useUpdatePause,
  useUpdateSpeed,
  useUpdateStartTime,
} from "../hooks/useUserSettings";
import { logout } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { PositionTable } from "../components/positionTable";
import SharesInput from "../components/SharesInput";
import SimulationControls from "../components/SimulationControls";

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

  const [commissionValue, setCommissionValue] = useState(0.5);
  const [commissionType, setCommissionType] = useState<"real" | "sim">("sim");

  const [holdingCostValue, setHoldingCostValue] = useState(0.5);
  const [holdingCostType, setHoldingCostType] = useState<"real" | "sim">("sim");

  const [marginValue, setMarginValue] = useState(1.0);

  const [overnightFeeValue, setOvernightFeeValue] = useState(5.0);
  const [overnightFeeType, setOvernightFeeType] = useState<"real" | "sim">(
    "sim"
  );

  const [powerUpValue, setPowerUpValue] = useState(50);
  const [powerUpType, setPowerUpType] = useState<"real" | "sim">("sim");

  const [gainThreshold, setGainThreshold] = useState(20);
  const [drawdownThreshold, setDrawdownThreshold] = useState(10);

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
      <div
        className="w-full h-[35vh] border border-blue-400 p-2 bg-white rounded-lg shadow-sm grid gap-2"
        style={{
          display: "grid",
          gridTemplateAreas: `
      "a b c"
      "d e f"
      "g g g"
    `,
          gridTemplateColumns: "1fr 1fr 1fr",
          gridTemplateRows: "1fr 1fr auto",
        }}
      >
        <div
          className="border border-gray-400 rounded-md p-2 flex flex-col justify-between text-gray-700 text-sm"
          style={{ gridArea: "a" }}
        >
          <div className="font-medium text-center mb-2">Commission</div>

          {/* Slider */}
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={10}
              step={0.1}
              className="w-full"
              value={commissionValue}
              onChange={(e) => setCommissionValue(parseFloat(e.target.value))}
            />
            <span className="w-10 text-right">
              {commissionValue.toFixed(1)}%
            </span>
          </div>

          {/* Compact Centered Simulate / Real Toggle */}
          <div className="flex flex-col items-center mt-2 text-[10px] text-gray-600">
            <div className="flex items-center gap-1">
              <span>Simulate</span>
              <div
                className={`w-8 h-4 flex items-center rounded-full p-[2px] cursor-pointer transition-all ${
                  commissionType === "real" ? "bg-blue-400" : "bg-green-400"
                } ${
                  commissionType === "real" ? "justify-end" : "justify-start"
                }`}
                onClick={() =>
                  setCommissionType((prev) =>
                    prev === "real" ? "sim" : "real"
                  )
                }
              >
                <div className="w-3 h-3 bg-white rounded-full shadow-sm transition-all" />
              </div>
              <span>Real</span>
            </div>
          </div>
        </div>

        <div
          className="border border-gray-400 rounded-md p-2 flex flex-col justify-between text-gray-700 text-sm"
          style={{ gridArea: "b" }}
        >
          <div className="font-medium text-center mb-2">Margin</div>

          {/* Margin Multiplier Slider (0x to 10x) */}
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={10}
              step={0.1}
              className="w-full"
              value={marginValue}
              onChange={(e) => setMarginValue(parseFloat(e.target.value))}
            />
            <span className="w-12 text-right">{marginValue.toFixed(1)}x</span>
          </div>
        </div>

        <div
          className="border border-gray-400 rounded-md p-2 flex flex-col justify-between text-gray-700 text-sm"
          style={{ gridArea: "c" }}
        >
          <div className="font-medium text-center mb-2">Gain & Drawdown</div>

          {/* Gain Threshold Slider */}
          <div className="flex items-center gap-2 text-xs">
            <span className="w-[80px] text-gray-500">Gain Threshold</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              className="w-full"
              value={gainThreshold}
              onChange={(e) => setGainThreshold(parseFloat(e.target.value))}
            />
            <span className="w-10 text-right">{gainThreshold.toFixed(0)}%</span>
          </div>

          {/* Drawdown Threshold Slider */}
          <div className="flex items-center gap-2 text-xs mt-2">
            <span className="w-[80px] text-gray-500">Drawdown Threshold</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              className="w-full"
              value={drawdownThreshold}
              onChange={(e) => setDrawdownThreshold(parseFloat(e.target.value))}
            />
            <span className="w-10 text-right">
              {drawdownThreshold.toFixed(0)}%
            </span>
          </div>
        </div>

        <div
          className="border border-gray-400 rounded-md p-2 flex flex-col justify-between text-gray-700 text-sm"
          style={{ gridArea: "d" }}
        >
          <div className="font-medium text-center mb-2">Holding Cost</div>

          {/* Slider */}
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={10}
              step={0.1}
              className="w-full"
              value={holdingCostValue}
              onChange={(e) => setHoldingCostValue(parseFloat(e.target.value))}
            />
            <span className="w-10 text-right">
              {holdingCostValue.toFixed(1)}%
            </span>
          </div>

          {/* Simulate / Real Toggle */}
          <div className="flex flex-col items-center mt-2 text-[10px] text-gray-600">
            <div className="flex items-center gap-1">
              <span>Simulate</span>
              <div
                className={`w-8 h-4 flex items-center rounded-full p-[2px] cursor-pointer transition-all ${
                  holdingCostType === "real" ? "bg-blue-400" : "bg-green-400"
                } ${
                  holdingCostType === "real" ? "justify-end" : "justify-start"
                }`}
                onClick={() =>
                  setHoldingCostType((prev) =>
                    prev === "real" ? "sim" : "real"
                  )
                }
              >
                <div className="w-3 h-3 bg-white rounded-full shadow-sm transition-all" />
              </div>
              <span>Real</span>
            </div>
          </div>
        </div>

        <div
          className="border border-gray-400 rounded-md p-2 flex flex-col justify-between text-gray-700 text-sm"
          style={{ gridArea: "e" }}
        >
          <div className="font-medium text-center mb-2">Overnight Fee</div>

          {/* Slider (0 to 50%) */}
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={50}
              step={0.5}
              className="w-full"
              value={overnightFeeValue}
              onChange={(e) => setOvernightFeeValue(parseFloat(e.target.value))}
            />
            <span className="w-12 text-right">
              {overnightFeeValue.toFixed(1)}%
            </span>
          </div>

          {/* Simulate / Real Toggle */}
          <div className="flex flex-col items-center mt-2 text-[10px] text-gray-600">
            <div className="flex items-center gap-1">
              <span>Simulate</span>
              <div
                className={`w-8 h-4 flex items-center rounded-full p-[2px] cursor-pointer transition-all ${
                  overnightFeeType === "real" ? "bg-blue-400" : "bg-green-400"
                } ${
                  overnightFeeType === "real" ? "justify-end" : "justify-start"
                }`}
                onClick={() =>
                  setOvernightFeeType((prev) =>
                    prev === "real" ? "sim" : "real"
                  )
                }
              >
                <div className="w-3 h-3 bg-white rounded-full shadow-sm transition-all" />
              </div>
              <span>Real</span>
            </div>
          </div>
        </div>

        <div
          className="border border-gray-400 rounded-md p-2 flex flex-col justify-between text-gray-700 text-sm"
          style={{ gridArea: "f" }}
        >
          <div className="font-medium text-center mb-2">Power Up Setting</div>

          {/* Slider (0 to 100) */}
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              className="w-full"
              value={powerUpValue}
              onChange={(e) => setPowerUpValue(parseFloat(e.target.value))}
            />
            <span className="w-12 text-right">{powerUpValue.toFixed(0)}</span>
          </div>

          {/* Simulate / Real Toggle */}
          <div className="flex flex-col items-center mt-2 text-[10px] text-gray-600">
            <div className="flex items-center gap-1">
              <span>Simulate</span>
              <div
                className={`w-8 h-4 flex items-center rounded-full p-[2px] cursor-pointer transition-all ${
                  powerUpType === "real" ? "bg-blue-400" : "bg-green-400"
                } ${powerUpType === "real" ? "justify-end" : "justify-start"}`}
                onClick={() =>
                  setPowerUpType((prev) => (prev === "real" ? "sim" : "real"))
                }
              >
                <div className="w-3 h-3 bg-white rounded-full shadow-sm transition-all" />
              </div>
              <span>Real</span>
            </div>
          </div>
        </div>

        {/* Apply Changes Button */}
        <div
          className="flex items-center justify-end px-4"
          style={{ gridArea: "g" }}
        >
          <button
            onClick={() => alert("Apply changes logic goes here")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
