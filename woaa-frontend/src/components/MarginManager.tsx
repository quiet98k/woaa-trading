/**
 * @fileoverview Component to manage borrowed margin using leverage multiplier (1x–10x).
 * Includes payback and testing-only delete button. Two-column layout.
 */

import React, { useState, type JSX } from "react";
import { useMe, useUpdateUserBalances } from "../hooks/useUser";
import {
  useUserSettings,
  useUpdateUserSettings,
} from "../hooks/useUserSettings";

/**
 * Component to view and manage borrowed margin using leverage multiplier (1x–10x).
 * Fills parent space and uses a two-column layout with controls on the right.
 *
 * @returns JSX.Element
 */
export function MarginManager(): JSX.Element {
  const { data: user } = useMe();
  const { data: settings } = useUserSettings();
  const updateSettings = useUpdateUserSettings(user?.id ?? "");
  const updateBalances = useUpdateUserBalances(user?.id ?? "");

  const [multiplier, setMultiplier] = useState<number>(1);

  if (!user || !settings) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-gray-500">Loading margin info...</span>
      </div>
    );
  }

  const simBalance = user.sim_balance;
  const borrowed = settings.borrowed_margin;
  const baseBalance = simBalance - borrowed;
  const targetBorrowed = baseBalance * (multiplier - 1);
  const targetSimBalance = baseBalance + targetBorrowed;

  const handleApply = () => {
    if (multiplier < 1 || multiplier > 10) return;
    console.log("borrowed_margin:", targetBorrowed);

    updateSettings.mutate({
      ...settings,
      borrowed_margin: targetBorrowed,
    });

    updateBalances.mutate({
      sim_balance: targetSimBalance,
      real_balance: user.real_balance,
    });
  };

  const handlePayback = () => {
    if (borrowed <= 0 || simBalance < borrowed) return;

    updateSettings.mutate({
      ...settings,
      borrowed_margin: 0,
    });

    updateBalances.mutate({
      sim_balance: simBalance - borrowed,
      real_balance: user.real_balance,
    });
  };

  const handleDeleteMargin = () => {
    // FOR TESTING ONLY
    updateSettings.mutate({
      ...settings,
      borrowed_margin: 0,
    });
    // No change to sim balance
  };

  return (
    <div className="w-full h-full p-4 flex flex-col text-black">
      <h2 className="text-xl font-semibold mb-4">Margin Manager</h2>

      <div className="flex flex-1 flex-col md:flex-row gap-6 overflow-auto">
        {/* Left: Info */}
        <div className="flex-1 space-y-2 text-sm">
          <p>
            Base Balance: <strong>${baseBalance.toFixed(2)}</strong>
          </p>
          <p>
            Sim Balance: <strong>${simBalance.toFixed(2)}</strong>
          </p>
          <p>
            Borrowed Margin: <strong>${borrowed.toFixed(2)}</strong>
          </p>
          <p>
            Selected Leverage: <strong>{multiplier}×</strong>
          </p>
          <p>
            New Borrowed: <strong>${targetBorrowed.toFixed(2)}</strong>
          </p>
          <p>
            New Sim Balance: <strong>${targetSimBalance.toFixed(2)}</strong>
          </p>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              Select Leverage
            </label>
            <select
              value={multiplier}
              onChange={(e) => setMultiplier(Number(e.target.value))}
              className="w-full rounded border px-2 py-1"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((x) => (
                <option key={x} value={x}>
                  {x}×
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Buttons */}
        <div className="flex flex-col justify-start gap-2 w-full md:w-48">
          <button
            onClick={handleApply}
            className="rounded bg-indigo-600 text-white py-2 hover:bg-indigo-700"
          >
            Apply {multiplier}× Margin
          </button>

          <button
            onClick={handlePayback}
            className="rounded bg-blue-500 text-white py-2 hover:bg-blue-600"
          >
            Pay Back
          </button>

          <button
            onClick={handleDeleteMargin}
            className="rounded bg-red-500 text-white py-2 hover:bg-red-600"
          >
            Delete Margin (Test)
          </button>
        </div>
      </div>
    </div>
  );
}
