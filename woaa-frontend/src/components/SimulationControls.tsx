import { useEffect, useState, type JSX } from "react";
import { useSimTime } from "../hooks/useSimTimeSocket";
import {
  useUserSettings,
  useUpdateSpeed,
  useUpdatePause,
  useUpdateStartTime,
  useUpdateUserSettings,
} from "../hooks/useUserSettings";
import { useMe, useUpdateUserBalances } from "../hooks/useUser";
import { useDeletePosition, useMyPositions } from "../hooks/usePositions";

/**
 * Component that renders simulation controls and shows current sim_time.
 *
 * Automatically fetches the current user ID via useMe.
 *
 * @returns JSX.Element representing the simulation control UI.
 */
export default function SimulationControls(): JSX.Element {
  const { data: user, isLoading, error } = useMe();

  const { simTime, connected } = useSimTime();
  const { data: settings } = useUserSettings();
  const updateSpeed = useUpdateSpeed();
  const updatePause = useUpdatePause();
  const updateStartTime = useUpdateStartTime();

  const [localStartDate, setLocalStartDate] = useState("");
  const [initialStartDate, setInitialStartDate] = useState("");
  const [localSpeed, setLocalSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  const { data: positions } = useMyPositions();
  const updateBalances = useUpdateUserBalances(user?.id ?? "");
  const [lastSimDay, setLastSimDay] = useState<string | null>(null);

  const deletePositionMutation = useDeletePosition();
  const updateUserSettings = useUpdateUserSettings(user?.id ?? "");

  const triggerEndOfDayCharges = () => {
    if (!user || !settings || !positions) return;

    let newSim = user.sim_balance;
    let newReal = user.real_balance;

    // Holding cost for each open position
    const openPositions = positions.filter((p) => p.status === "open");
    const holdingCost = openPositions.length * settings.holding_cost_rate;

    // Overnight flat fee if borrowed
    const overnightFee =
      settings.borrowed_margin > 0 ? settings.overnight_fee_rate : 0;

    // Apply fees to balances
    if (settings.holding_cost_type === "real") {
      newReal -= holdingCost;
    } else {
      newSim -= holdingCost;
    }

    if (overnightFee > 0) {
      if (settings.overnight_fee_type === "real") {
        newReal -= overnightFee;
      } else {
        newSim -= overnightFee;
      }
    }

    // Update backend balances
    updateBalances.mutate({
      sim_balance: newSim,
      real_balance: newReal,
    });
  };

  useEffect(() => {
    if (settings) {
      const startDate = settings.start_time?.split("T")[0] ?? "";
      setLocalStartDate(startDate);
      setInitialStartDate(startDate);
      setLocalSpeed(settings.speed ?? 1);
      setIsPaused(settings.paused ?? false);
    }
  }, [settings]);

  useEffect(() => {
    if (!simTime) return;

    const currentDay = new Date(simTime).toISOString().slice(0, 10); // YYYY-MM-DD

    if (lastSimDay !== null && currentDay !== lastSimDay) {
      triggerEndOfDayCharges(); // ⏱️ Only once per new sim day
    }

    setLastSimDay(currentDay);
  }, [simTime]);

  const handlePauseToggle = () => {
    const newPaused = !isPaused;
    updatePause.mutate(newPaused);
    setIsPaused(newPaused);
  };

  const handleSpeedChange = (value: number) => {
    setLocalSpeed(value);
    updateSpeed.mutate(value);
  };

  const handleRestart = () => {
    updateStartTime.mutate(localStartDate);
    setInitialStartDate(localStartDate); // Update reference after successful change
  };

  const handleResetData = (): void => {
    if (!user || !settings || !positions) return;

    console.log("[Reset Data] Start");

    // Step 1: Reset sim_balance (user model)
    const initialSim = settings.initial_sim_balance ?? 10000;
    updateBalances.mutate(
      { sim_balance: initialSim, real_balance: 0 },
      {
      onSuccess: () => {
        console.log("[Reset Data] sim_balance reset to", initialSim, "and real_balance reset to 0");
      },
      onError: (err) => {
        console.error("[Reset Data] Failed to reset balances", err);
      },
      }
    );

    // Step 2: Reset borrowed_margin (userSettings — direct call)
    updateUserSettings.mutate(
      { ...settings, borrowed_margin: 0 },
      {
        onSuccess: () => {
          console.log("[Reset Data] borrowed_margin reset to 0");
        },
        onError: (err) => {
          console.error("[Reset Data] Failed to reset borrowed_margin", err);
        },
      }
    );

    // Step 3: Delete all positions manually
    positions.forEach((p) => {
      if (p.id) {
        deletePositionMutation.mutate(p.id, {
          onSuccess: () => {
            console.log(`[Reset Data] Deleted position ${p.id}`);
          },
          onError: (err) => {
            console.error(`[Reset Data] Error deleting position ${p.id}`, err);
          },
        });
      }
    });
  };

  const isStartDateChanged = localStartDate !== initialStartDate;

  if (isLoading) {
    return <div className="text-gray-500">Loading simulation controls...</div>;
  }

  if (error) {
    return <div className="text-red-500">Unable to load user data</div>;
  }

  return (
    <div className="flex flex-col gap-3 border p-3 rounded-md shadow bg-white">
      {/* WebSocket sim_time display */}
      <div className="text-sm text-gray-700">
        <span className="font-medium">Sim Time: </span>
        {simTime ? simTime.toLocaleString() : "Connecting..."}
        {!connected && (
          <span className="text-red-500 ml-2">(disconnected)</span>
        )}
      </div>

      {/* Speed Control with current speed display */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-gray-600 w-1/2">
          Simulation Speed
          <span className="ml-2 text-xs text-gray-400">
            (current: {localSpeed}x)
          </span>
        </label>
        <select
          className="flex-1 bg-white border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={localSpeed}
          onChange={(e) => handleSpeedChange(parseInt(e.target.value))}
        >
          {[1, 2, 3, 4, 5, 10, 20].map((speed) => (
            <option key={speed} value={speed}>
              {speed}x
            </option>
          ))}
        </select>
      </div>

      {/* Start Date */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-gray-600 w-1/2">
          Start Date
          {settings?.start_time && (
            <span className="ml-2 text-gray-400 text-xs">
              (current: {initialStartDate})
            </span>
          )}
        </label>
        <input
          type="date"
          value={localStartDate}
          onChange={(e) => setLocalStartDate(e.target.value)}
          className="flex-1 bg-white border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Pause / Resume & Restart */}
      <div className="flex justify-between items-center gap-2">
        <button
          className={`${
            isPaused
              ? "bg-green-500 hover:bg-green-600"
              : "bg-yellow-500 hover:bg-yellow-600"
          } text-white px-3 py-1 rounded-md text-xs focus:outline-none active:outline-none`}
          onClick={handlePauseToggle}
        >
          {isPaused ? "Resume" : "Pause"}
        </button>

        <button
          className={`bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs focus:outline-none active:outline-none ${
            isStartDateChanged ? "" : "opacity-50 cursor-not-allowed"
          }`}
          onClick={handleRestart}
          disabled={!isStartDateChanged}
        >
          Restart
        </button>

        <button
          onClick={handleResetData}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs"
        >
          Reset Data
        </button>

        <button
          onClick={triggerEndOfDayCharges}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md text-xs"
        >
          Apply End of Day Charges
        </button>
      </div>
    </div>
  );
}
