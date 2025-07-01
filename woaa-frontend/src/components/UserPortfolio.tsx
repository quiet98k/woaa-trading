import { useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { useMe, useUpdateUserBalances } from "../hooks/useUser";
import { useUserSettings } from "../hooks/useUserSettings";
import { useMyPositions } from "../hooks/usePositions";
import { logout } from "../api/auth";
import * as Dialog from "@radix-ui/react-dialog";

/**
 * @fileoverview Fully self-contained user portfolio panel including user info, balances, and calculated profit with win/loss modal triggers.
 */

export function UserPortfolio(): JSX.Element {
  const navigate = useNavigate();
  const { data: user } = useMe();
  const { data: settings } = useUserSettings();
  const { data: positions } = useMyPositions();
  const updateUser = useUpdateUserBalances(user?.id ?? "");

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

  //   console.log("Positions:", positions);
  const unrealizedShortValue = parseFloat(
    (
      positions?.reduce((total, p) => {
        if (p.position_type === "Short" && p.status === "open") {
          return total + p.open_price * p.open_shares;
        }
        return total;
      }, 0) ?? 0
    ).toFixed(2)
  );

  const rawProfit = sim - initial - borrowed - unrealizedShortValue;
  const profit = Math.round(rawProfit * 100) / 100;

  const profitColor =
    profit > 0
      ? "text-green-600"
      : profit < 0
      ? "text-red-600"
      : "text-gray-600";

  const winAmount = (initial * gainThreshold) / 100;
  const loseAmount = (initial * (100 - drawdownThreshold)) / 100;

  // Show modal if thresholds reached
  useEffect(() => {
    if (!initial || !settings) return;

    console.log("[Threshold Check]");
    console.log("Sim Balance:", sim);
    console.log("Initial Balance:", initial);
    console.log("Borrowed Margin:", borrowed);
    console.log("Profit:", profit);
    console.log("Win Threshold ($):", winAmount);
    console.log("Loss Threshold ($):", loseAmount);
    console.log("unrealizedShortValue: ", unrealizedShortValue);

    if (profit >= winAmount) {
      console.log("✅ Profit reached win threshold");
      setWinModal(true);
    } else if (sim <= loseAmount) {
      console.log("❌ Sim balance dropped below loss threshold");
      setLoseModal(true);
    }
  }, [sim, profit, initial, winAmount, loseAmount, settings]);

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
              Your profit has reached ${winAmount.toLocaleString()}.
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
              Your balance dropped below ${loseAmount.toLocaleString()}.
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

          {/* Profit */}
          <div className="flex-1 border border-yellow-300 bg-yellow-50 p-2 rounded-md shadow-sm flex flex-col gap-1 justify-center">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Profit</span>
              <span className={`text-lg font-semibold ${profitColor}`}>
                $
                {profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-[10px] text-gray-500 text-right italic">
              (Initial: ${initial.toLocaleString()} | Borrowed: $
              {borrowed.toLocaleString()})
            </div>
          </div>

          {/* Win / Loss Thresholds */}
          <div className="flex-1 border border-indigo-300 bg-indigo-50 p-2 rounded-md shadow-sm text-xs flex flex-col justify-center gap-1">
            <div className="flex justify-between text-gray-700">
              <span>Target Profit:</span>
              <span className="font-semibold text-green-700">
                $
                {winAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Max Drawdown:</span>
              <span className="font-semibold text-red-700">
                $
                {loseAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
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
                  onChange={(e) => setNewRealValue(parseFloat(e.target.value))}
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
      </div>
    </>
  );
}
