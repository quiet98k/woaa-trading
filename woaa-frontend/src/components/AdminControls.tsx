/**
 * @fileoverview Admin settings panel with full logic and a modal to show current settings.
 */

import { useEffect, useState, type JSX } from "react";
import {
  useUserSettings,
  useUpdateUserSettings,
} from "../hooks/useUserSettings";
import { useMe } from "../hooks/useUser";
import * as Dialog from "@radix-ui/react-dialog";

/** Utility that safely parses a numeric string (allows empty while typing). */
function safeParseNumber(v: string, fallback = 0) {
  if (v.trim() === "") return NaN; // let input be empty while typing
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Reusable number-input card. */
function NumberInputCard({
  label,
  value,
  onChange,
  unit,
  toggleType,
  onToggle,
  area,
  min = 0,
  max,
  step = 1,
  placeholder,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  toggleType?: "real" | "sim";
  onToggle?: () => void;
  area: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}): JSX.Element {
  // Store a local string so the user can temporarily type invalid/empty values.
  const [text, setText] = useState<string>(
    Number.isNaN(value) ? "" : String(value)
  );

  useEffect(() => {
    // Keep local text in sync if parent updates the value externally
    if (String(value) !== text && !Number.isNaN(value)) setText(String(value));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (next: string) => {
    const parsed = safeParseNumber(next, value);
    if (!Number.isNaN(parsed)) {
      // clamp if min/max present
      const clamped = typeof max === "number" ? Math.min(parsed, max) : parsed;
      const finalV = typeof min === "number" ? Math.max(clamped, min) : clamped;
      onChange(finalV);
    }
  };

  return (
    <div
      className="border border-gray-400 rounded-md p-2 flex flex-col justify-between text-gray-700 text-sm"
      style={{ gridArea: area }}
    >
      <div className="font-medium text-center mb-2">{label}</div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          className="w-full border rounded px-2 py-1 text-sm text-right"
          min={min}
          {...(typeof max === "number" ? { max } : {})}
          step={step}
          value={text}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
        />
        {unit ? <span className="w-10 text-right">{unit}</span> : null}
      </div>

      {toggleType && onToggle && (
        <div className="flex flex-col items-center mt-2 text-[10px] text-gray-600">
          <div className="flex items-center gap-1">
            <span>Simulate</span>
            <div
              className={`w-8 h-4 flex items-center rounded-full p-[2px] cursor-pointer transition-all ${
                toggleType === "real"
                  ? "bg-blue-400 justify-end"
                  : "bg-green-400 justify-start"
              }`}
              onClick={onToggle}
              role="switch"
              aria-checked={toggleType === "real"}
              aria-label={`${label} type`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") onToggle();
              }}
            >
              <div className="w-3 h-3 bg-white rounded-full shadow-sm transition-all" />
            </div>
            <span>Real</span>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingCard({
  label,
  value,
  onChange,
  unit,
  toggleType,
  onToggle,
  area,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  toggleType?: "real" | "sim";
  onToggle?: () => void;
  area: string;
  max: number;
  step: number;
}) {
  return (
    <div
      className="border border-gray-400 rounded-md p-2 flex flex-col justify-between text-gray-700 text-sm"
      style={{ gridArea: area }}
    >
      <div className="font-medium text-center mb-2">{label}</div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={max}
          step={step}
          className="w-full"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        <span className="w-12 text-right">
          {value.toFixed(step >= 1 ? 0 : 1)}
          {unit ?? ""}
        </span>
      </div>

      {toggleType && onToggle && (
        <div className="flex flex-col items-center mt-2 text-[10px] text-gray-600">
          <div className="flex items-center gap-1">
            <span>Simulate</span>
            <div
              className={`w-8 h-4 flex items-center rounded-full p-[2px] cursor-pointer transition-all ${
                toggleType === "real"
                  ? "bg-blue-400 justify-end"
                  : "bg-green-400 justify-start"
              }`}
              onClick={onToggle}
            >
              <div className="w-3 h-3 bg-white rounded-full shadow-sm transition-all" />
            </div>
            <span>Real</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * AdminSettingsPanel component to control all user setting parameters for the current user.
 */
export function AdminSettingsPanel(): JSX.Element {
  const [appliedSettings, setAppliedSettings] = useState<any | null>(null);
  const { data: settings } = useUserSettings();
  const { data: user } = useMe();
  const updateSettings = useUpdateUserSettings(user?.id ?? "");

  const [initialSimBalance, setInitialSimBalance] = useState(10000);

  const [commissionValue, setCommissionValue] = useState(0);
  const [commissionType, setCommissionType] = useState<"real" | "sim">("sim");

  const [holdingCostValue, setHoldingCostValue] = useState(0);
  const [holdingCostType, setHoldingCostType] = useState<"real" | "sim">("sim");

  const [marginValue, setMarginValue] = useState(0);
  const [gainThreshold, setGainThreshold] = useState(0);
  const [drawdownThreshold, setDrawdownThreshold] = useState(0);

  const [overnightFeeValue, setOvernightFeeValue] = useState(0);
  const [overnightFeeType, setOvernightFeeType] = useState<"real" | "sim">(
    "sim"
  );

  const [powerUpValue, setPowerUpValue] = useState(0);
  const [powerUpType, setPowerUpType] = useState<"real" | "sim">("sim");

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (settings) {
      setCommissionValue(settings.commission_rate);
      setCommissionType(settings.commission_type);
      setHoldingCostValue(settings.holding_cost_rate);
      setHoldingCostType(settings.holding_cost_type);
      setMarginValue(settings.margin_limit);
      setInitialSimBalance(settings.initial_sim_balance);
      setGainThreshold(settings.gain_rate_threshold);
      setDrawdownThreshold(settings.drawdown_rate_threshold);
      setOvernightFeeValue(settings.overnight_fee_rate);
      setOvernightFeeType(settings.overnight_fee_type);
      setPowerUpValue(settings.power_up_fee);
      setPowerUpType(settings.power_up_type);
    }
  }, [settings]);

  const handleApply = () => {
    if (!settings) return;

    const payload = {
      commission_rate: commissionValue,
      commission_type: commissionType,
      holding_cost_rate: holdingCostValue,
      holding_cost_type: holdingCostType,
      margin_limit: marginValue,
      borrowed_margin: settings.borrowed_margin,
      gain_rate_threshold: gainThreshold,
      drawdown_rate_threshold: drawdownThreshold,
      overnight_fee_rate: overnightFeeValue,
      overnight_fee_type: overnightFeeType,
      power_up_fee: powerUpValue,
      power_up_type: powerUpType,
      initial_sim_balance: initialSimBalance,
      start_time: settings.start_time,
      speed: settings.speed,
      paused: settings.paused,
      sim_time: settings.sim_time,
      last_updated: new Date(),
    };

    updateSettings.mutate(payload, {
      onSuccess: () => {
        setAppliedSettings(payload);
        setShowModal(true);
      },
    });
  };

  return (
    <>
      <div
        className="w-full flex-1 overflow-auto grid gap-2"
        style={{
          display: "grid",
          gridTemplateAreas: `
            "a b c"
            "d e f"
            "g g g"
          `,
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gridTemplateRows: "auto auto auto",
        }}
      >
        <NumberInputCard
          label="Commission"
          value={commissionValue}
          onChange={setCommissionValue}
          unit="$"
          toggleType={commissionType}
          onToggle={() =>
            setCommissionType((p) => (p === "real" ? "sim" : "real"))
          }
          area="a"
          min={0}
          max={100}
          step={0.01}
          placeholder="0.00"
        />

        <SettingCard
          label="Margin Limit"
          value={marginValue}
          onChange={setMarginValue}
          unit=""
          area="b"
          max={100000000}
          step={1000}
        />

        {/* Gain & Drawdown */}
        <div
          className="border border-gray-400 rounded-md p-2 flex flex-col justify-between text-gray-700 text-sm"
          style={{ gridArea: "c" }}
        >
          <div className="font-medium text-center mb-2">
            Gain &amp; Drawdown
          </div>

          <div className="flex items-center gap-2 text-xs mb-2">
            <span className="w-[80px] text-gray-500">Init. Balance</span>
            <input
              type="number"
              className="w-full border rounded px-2 py-1 text-sm text-right"
              min={0}
              step={100}
              value={initialSimBalance}
              onChange={(e) =>
                setInitialSimBalance(parseFloat(e.target.value) || 0)
              }
            />
            <span className="text-xs text-gray-500">$</span>
          </div>

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
          <div className="pl-[85px] text-[10px] text-gray-500 mb-1">
            ≈ ${((initialSimBalance * gainThreshold) / 100).toFixed(2)} to win
          </div>

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
          <div className="pl-[85px] text-[10px] text-gray-500">
            ≈ ${((initialSimBalance * drawdownThreshold) / 100).toFixed(2)} to
            lose
          </div>
        </div>

        <SettingCard
          label="Holding Cost"
          value={holdingCostValue}
          onChange={setHoldingCostValue}
          unit="$"
          toggleType={holdingCostType}
          onToggle={() =>
            setHoldingCostType((p) => (p === "real" ? "sim" : "real"))
          }
          area="d"
          max={10}
          step={0.5}
        />

        <SettingCard
          label="Overnight Fee"
          value={overnightFeeValue}
          onChange={setOvernightFeeValue}
          unit="$"
          toggleType={overnightFeeType}
          onToggle={() =>
            setOvernightFeeType((p) => (p === "real" ? "sim" : "real"))
          }
          area="e"
          max={50}
          step={1}
        />

        <SettingCard
          label="Power Up Fee"
          value={powerUpValue}
          onChange={setPowerUpValue}
          unit="$"
          toggleType={powerUpType}
          onToggle={() =>
            setPowerUpType((p) => (p === "real" ? "sim" : "real"))
          }
          area="f"
          max={100}
          step={1}
        />

        <div
          className="flex items-center justify-between px-4"
          style={{ gridArea: "g" }}
        >
          <Dialog.Root open={showModal} onOpenChange={setShowModal}>
            <Dialog.Trigger asChild>
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-md text-sm"
                onClick={() => {
                  if (settings) {
                    setAppliedSettings(settings);
                    setShowModal(true);
                  }
                }}
              >
                Show Current Settings
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
              <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-md p-6 shadow-lg w-[90vw] max-w-md max-h-[80vh] overflow-auto">
                <Dialog.Title className="text-lg font-medium mb-2">
                  Current User Settings
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-500 mb-4">
                  Review the settings currently applied to this user.
                </Dialog.Description>
                <pre className="text-sm bg-gray-100 p-3 rounded whitespace-pre-wrap break-all text-black">
                  {JSON.stringify(appliedSettings, null, 2)}
                </pre>
                <div className="mt-4 flex justify-end">
                  <Dialog.Close asChild>
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm rounded">
                      Close
                    </button>
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <button
            onClick={handleApply}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </>
  );
}
