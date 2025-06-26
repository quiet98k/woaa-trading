/**
 * @fileoverview Component for controlling simulation parameters like speed,
 * start date, and pausing the simulation.
 */

import React, { type JSX } from "react";
import { useSimTimeSocket } from "../hooks/useSimTimeSocket";

interface SimulationControlsProps {
  onPause: () => void;
  onSpeedChange?: (speed: number) => void;
  onDateChange?: (date: string) => void;
}

/**
 * Component that renders controls for simulation speed, start date, and a pause button.
 *
 * @param onPause - Callback when pause button is clicked.
 * @param onSpeedChange - Optional callback when speed selection changes.
 * @param onDateChange - Optional callback when date input changes.
 * @returns JSX.Element representing the simulation control UI.
 */
export default function SimulationControls({
  onPause,
  onSpeedChange,
  onDateChange,
}: SimulationControlsProps): JSX.Element {
  const { simTime, loading } = useSimTimeSocket();

  return (
    <div className="flex flex-col gap-3">
      {/* Sim Time Display */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-gray-600 w-1/2">Simulation Time</label>
        <span className="flex-1 text-xs text-gray-800">
          {loading ? "Loading..." : simTime ? new Date(simTime).toLocaleString() : "-"}
        </span>
      </div>

      {/* Speed Control */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-gray-600 w-1/2">Simulation Speed</label>
        <select
          className="flex-1 bg-white border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          onChange={(e) => onSpeedChange?.(parseInt(e.target.value))}
        >
          {[1, 2, 3, 4, 5].map((speed) => (
            <option key={speed} value={speed}>
              {speed}x
            </option>
          ))}
        </select>
      </div>

      {/* Start Date */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-gray-600 w-1/2">Start Date</label>
        <input
          type="date"
          className="flex-1 bg-white border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          onChange={(e) => onDateChange?.(e.target.value)}
        />
      </div>

      {/* Pause Button */}
      <div className="flex justify-end">
        <button
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-xs focus:outline-none active:outline-none"
          onClick={onPause}
        >
          Pause
        </button>
      </div>
    </div>
  );
}
