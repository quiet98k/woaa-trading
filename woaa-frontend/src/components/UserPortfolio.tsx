import { useContext, useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { useMe, useUpdateUserBalances } from "../hooks/useUser";
import { useUserSettings } from "../hooks/useUserSettings";
import { useMyPositions } from "../hooks/usePositions";
import { logout } from "../api/auth";
import * as Dialog from "@radix-ui/react-dialog";
import { ChartContext } from "../pages/Dashboard";
import { useUpdatePause } from "../hooks/useUserSettings";

/**
 * @fileoverview Fully self-contained user portfolio panel including user info, balances, and calculated profit with win/loss modal triggers.
 */

export function UserPortfolio(): JSX.Element {
  const navigate = useNavigate();
  const { data: user } = useMe();
  const { data: settings } = useUserSettings();
  const { data: positions } = useMyPositions();
  const { openPrices } = useContext(ChartContext);
  const updateUser = useUpdateUserBalances(user?.id ?? "");
  const updatePause = useUpdatePause();
  const { mode, setMode } = useContext(ChartContext);

  const [isEditingSim, setIsEditingSim] = useState(false);
  const [isEditingReal, setIsEditingReal] = useState(false);
  const [newSimValue, setNewSimValue] = useState<number>(
    user?.sim_balance ?? 0
  );
  const [newRealValue, setNewRealValue] = useState<number>(
    user?.real_balance ?? 0
  );

  const [winModal, setWinModal] = useState(false);
  const [loseModal, setLoseModal] = useState(false);

  const sim = user?.sim_balance ?? 0;
  const initial = settings?.initial_sim_balance ?? 0;
  const borrowed = settings?.borrowed_margin ?? 0;
  const gainThreshold = settings?.gain_rate_threshold ?? 0;
  const drawdownThreshold = settings?.drawdown_rate_threshold ?? 0;

  const unrealizedShortValue = parseFloat(
    (
      positions?.reduce((total, p) => {
        if (p.position_type === "Short" && p.status === "open") {
          const currentPrice = openPrices[p.symbol];

          if (currentPrice === undefined || currentPrice === null) {
            console.error(`Missing current price for symbol: ${p.symbol}`);
            return total; // skip this position if no current price
          }

          return total + currentPrice * p.open_shares;
        }
        return total;
      }, 0) ?? 0
    ).toFixed(2)
  );

  const unrealizedLongValue = parseFloat(
    (
      positions?.reduce((total, p) => {
        if (p.position_type === "Long" && p.status === "open") {
          const currentPrice = openPrices[p.symbol];
          if (currentPrice === undefined || currentPrice === null) {
            console.error(
              `Missing current price for LONG position: ${p.symbol}`
            );
            return total;
          }
          return total + currentPrice * p.open_shares;
        }
        return total;
      }, 0) ?? 0
    ).toFixed(2)
  );

  const rawProfit =
    sim - unrealizedShortValue + unrealizedLongValue - borrowed - initial;
  const profit = Math.round(rawProfit * 100) / 100;
  const netWorth = profit + initial;

  const profitColor =
    profit > 0
      ? "text-green-600"
      : profit < 0
      ? "text-red-600"
      : "text-gray-600";

  const winAmount = initial * (gainThreshold / 100); // profit needed to win the game
  const loseAmount = initial * ((100 - drawdownThreshold) / 100); // minimum networth to lost the game

  // Show modal if thresholds reached
  useEffect(() => {
    if (!initial || !settings) return;

    console.log("[Threshold Check]", {
      simBalance: sim,
      initialBalance: initial,
      borrowedMargin: borrowed,
      profit,
      netWorth,
      winThreshold: winAmount,
      lossThreshold: loseAmount,
      unrealizedShortValue,
    });

    if (profit >= winAmount) {
      console.log(
        `✅ Profit reached win threshold: profit=${profit}, winThreshold=${winAmount}`
      );
      updatePause.mutate(true);
      setWinModal(true);
    } else if (netWorth <= loseAmount) {
      console.log(
        `❌ Net Worth dropped below loss threshold: netWorth=${netWorth}, lossThreshold=${loseAmount}`
      );
      updatePause.mutate(true);
      setLoseModal(true);
    }
  }, [
    sim,
    profit,
    initial,
    winAmount,
    loseAmount,
    settings,
    positions,
    openPrices,
  ]);

  return (
    <>
      {/* Win Modal */}
      <Dialog.Root open={winModal} onOpenChange={setWinModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-md shadow-xl z-50 max-w-md w-[80vw] text-center">
            <Dialog.Title className="text-2xl font-bold text-green-600 mb-2">
              🎉 You Win!
            </Dialog.Title>
            <Dialog.Description className="text-gray-700 mb-4">
              Your profit of ${profit.toLocaleString()} has reached $
              {winAmount.toLocaleString()}, Game Paused.
            </Dialog.Description>
            <Dialog.Close asChild>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                Close
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Lose Modal */}
      <Dialog.Root open={loseModal} onOpenChange={setLoseModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-md shadow-xl z-50 max-w-md w-[80vw] text-center">
            <Dialog.Title className="text-2xl font-bold text-red-600 mb-2">
              ❌ You Lose
            </Dialog.Title>
            <Dialog.Description className="text-gray-700 mb-4">
              Your net worth of ${netWorth.toLocaleString()} dropped below $
              {loseAmount.toLocaleString()}, Game Paused.
            </Dialog.Description>
            <Dialog.Close asChild>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
                Close
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Main Content */}
      <div className="flex flex-col gap-2 w-full h-full overflow-hidden">
        {/* Top Row: 4-Column Layout */}
        <div className="flex gap-2 text-gray-700 h-full">
          {/* Column 1: User Info + Logout */}
          <div className="flex justify-between items-start">
            {/* User Info */}
            <div className="flex flex-col text-xs sm:text-sm break-words">
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

            {/* Logout & Toggle */}
            <div className="flex items-center gap-3">
              {/* Toggle Button */}
              <button
                onClick={() =>
                  setMode(mode === "historical" ? "realtime" : "historical")
                }
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  mode === "realtime"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-800 hover:bg-gray-400"
                }`}
              >
                {mode === "realtime" ? "Real-Time" : "Historical"}
              </button>

              {/* Logout Button */}
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
          </div>

          {/* Column 2: Simulated + Real Value */}
          <div className="flex-1 min-w-0 h-full border border-green-300 bg-green-50 p-2 rounded-md shadow-sm flex flex-col overflow-auto">
            {/* Simulated Value */}
            <div className="flex justify-between items-center gap-2">
              <span className="text-gray-600">Simulated Value</span>
              {isEditingSim ? (
                <>
                  <input
                    type="number"
                    className="w-24 px-2 py-1 text-black border rounded-md"
                    value={newSimValue}
                    placeholder={user?.sim_balance?.toString() ?? ""}
                    onChange={(e) => setNewSimValue(parseFloat(e.target.value))}
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
                  <span className="font-semibold text-green-700">
                    ${user?.sim_balance?.toLocaleString() ?? "—"}
                  </span>
                  <button
                    className="text-green-600 underline"
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
            <div className="flex justify-between items-center gap-2">
              <span className="text-gray-600">Real Money</span>
              {isEditingReal ? (
                <>
                  <input
                    type="number"
                    className="w-24 px-2 py-1 text-black border rounded-md"
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
                  <span className="font-semibold text-blue-700">
                    ${user?.real_balance?.toLocaleString() ?? "—"}
                  </span>
                  <button
                    className="text-blue-600 underline"
                    onClick={() => {
                      setNewRealValue(user?.real_balance ?? 0);
                      setIsEditingReal(true);
                    }}
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>
          {/* Column 3: Profit + Net Worth */}
          <div className="flex-1 min-w-0 h-full border border-indigo-300 bg-indigo-50 p-2 rounded-md shadow-sm flex flex-col overflow-auto gap-2">
            <div className="flex justify-between items-center text-sm">
              <span>Profit:</span>
              <span className={`text-base font-semibold ${profitColor}`}>
                $
                {profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Net Worth:</span>
              <span className="font-semibold text-black">
                $
                {netWorth.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Column 4: Win/Loss Thresholds */}
          <div className="flex-1 min-w-0 h-full border border-yellow-300 bg-yellow-50 p-2 rounded-md shadow-sm flex flex-col overflow-auto gap-2">
            <div className="flex justify-between text-gray-700 text-sm">
              <span>Target Profit:</span>
              <span className="font-semibold text-green-700">
                $
                {winAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-gray-700 text-sm">
              <span>Min Net Worth:</span>
              <span className="font-semibold text-red-700">
                $
                {loseAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
