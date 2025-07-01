/**
 * @fileoverview Simple margin manager to show borrowed margin and allow borrowing or paying back a specific amount.
 */

import React, { useState, type JSX } from "react";
import { useMe, useUpdateUserBalances } from "../hooks/useUser";
import {
  useUserSettings,
  useUpdateUserSettings,
} from "../hooks/useUserSettings";

/**
 * Simple MarginManager to show and control borrowed margin via amount input.
 *
 * @returns JSX.Element
 */
export function MarginManager(): JSX.Element {
  const { data: user } = useMe();
  const { data: settings } = useUserSettings();
  const updateSettings = useUpdateUserSettings(user?.id ?? "");
  const updateBalances = useUpdateUserBalances(user?.id ?? "");

  const [borrowAmount, setBorrowAmount] = useState<number>(0);
  const [paybackAmount, setPaybackAmount] = useState<number>(0);

  if (!user || !settings) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-gray-500">Loading margin info...</span>
      </div>
    );
  }

  const simBalance = user.sim_balance;
  const borrowed = settings.borrowed_margin;
  const marginLimit = settings.margin_limit;
  const remainingBorrowable = marginLimit - borrowed;

  const handleBorrow = () => {
    if (borrowAmount <= 0 || borrowAmount > remainingBorrowable) return;

    updateSettings.mutate({
      ...settings,
      borrowed_margin: borrowed + borrowAmount,
    });

    updateBalances.mutate({
      sim_balance: simBalance + borrowAmount,
      real_balance: user.real_balance,
    });

    setBorrowAmount(0);
  };

  const handlePayback = () => {
    if (
      paybackAmount <= 0 ||
      paybackAmount > borrowed ||
      simBalance < paybackAmount
    )
      return;

    updateSettings.mutate({
      ...settings,
      borrowed_margin: borrowed - paybackAmount,
    });

    updateBalances.mutate({
      sim_balance: simBalance - paybackAmount,
      real_balance: user.real_balance,
    });

    setPaybackAmount(0);
  };

  return (
    <div className="w-full h-full p-4 text-black">
      <h2 className="text-xl font-semibold mb-4">Margin Manager</h2>

      <div className="space-y-3 text-sm">
        <p>
          Margin Limit: <strong>${marginLimit.toFixed(2)}</strong>
        </p>
        <p>
          Current Borrowed Margin: <strong>${borrowed.toFixed(2)}</strong>
        </p>
        <p>
          Remaining Borrowable:{" "}
          <strong>${remainingBorrowable.toFixed(2)}</strong>
        </p>
      </div>

      <div className="mt-6 space-y-6 max-w-sm">
        {/* Borrow */}
        <div>
          <label className="block mb-1 text-sm font-medium">
            Amount to Borrow
          </label>
          <input
            type="number"
            className="w-full border rounded px-2 py-1"
            value={borrowAmount}
            min={0}
            max={remainingBorrowable}
            step={100}
            onChange={(e) => setBorrowAmount(Number(e.target.value))}
          />
          <button
            onClick={handleBorrow}
            className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
          >
            Borrow
          </button>
        </div>

        {/* Payback */}
        <div>
          <label className="block mb-1 text-sm font-medium">
            Amount to Pay Back
          </label>
          <input
            type="number"
            className="w-full border rounded px-2 py-1"
            value={paybackAmount}
            min={0}
            max={borrowed}
            step={100}
            onChange={(e) => setPaybackAmount(Number(e.target.value))}
          />
          <button
            onClick={handlePayback}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
          >
            Pay Back
          </button>
        </div>
      </div>
    </div>
  );
}
