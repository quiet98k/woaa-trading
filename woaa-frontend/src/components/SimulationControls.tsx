import React, { useEffect, useState, type JSX } from "react";
import { useSimTime } from "../hooks/useSimTimeSocket";
import {
  useUserSettings,
  useUpdateSpeed,
  useUpdatePause,
  useUpdateStartTime,
} from "../hooks/useUserSettings";
import { useMe } from "../hooks/useUser";

/**
 * Component that renders simulation controls and shows current sim_time.
 *
 * Automatically fetches the current user ID via useMe.
 *
 * @returns JSX.Element representing the simulation control UI.
 */
export default function SimulationControls(): JSX.Element {
  const { data: user, isLoading, error } = useMe();
  const userId = user?.id;
  const updateStartTime = useUpdateStartTime();

  const { simTime, connected } = useSimTime(userId ?? "");
  const { data: settings } = useUserSettings();
  const updateSpeed = useUpdateSpeed();
  const updatePause = useUpdatePause();

  const [localStartDate, setLocalStartDate] = useState("");
  const [localSpeed, setLocalSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalStartDate(settings.start_time?.split("T")[0] ?? "");
      setLocalSpeed(settings.speed ?? 1);
      setIsPaused(settings.paused ?? false);
    }
  }, [settings]);

  const handlePauseToggle = () => {
    updatePause.mutate(!isPaused);
    setIsPaused((prev) => !prev);
  };

  const handleApplyChanges = () => {
    updateSpeed.mutate(localSpeed);
    updateStartTime.mutate(localStartDate);
  };

  if (isLoading) {
    return <div className="text-gray-500">Loading simulation controls...</div>;
  }

  if (error || !userId) {
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

      {/* Speed Control */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-gray-600 w-1/2">Simulation Speed</label>
        <select
          className="flex-1 bg-white border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={localSpeed}
          onChange={(e) => setLocalSpeed(parseInt(e.target.value))}
        >
          {[1, 2, 3, 4, 5].map((speed) => (
            <option key={speed} value={speed}>
              {speed}x
            </option>
          ))}
        </select>
      </div>

      {/* Start Date (read-only for now) */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-gray-600 w-1/2">
          Start Date
          {settings?.start_time && (
            <span className="ml-2 text-gray-400 text-xs">
              (default: {settings.start_time.split("T")[0]})
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

      {/* Pause / Resume & Apply */}
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
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs focus:outline-none active:outline-none"
          onClick={handleApplyChanges}
        >
          Apply Changes
        </button>
      </div>
    </div>
  );
}
