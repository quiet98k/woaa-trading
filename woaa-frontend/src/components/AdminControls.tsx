/**
 * @fileoverview Admin settings panel with full logic and a modal to show current settings.
 */

import React, { useEffect, useState, type JSX } from "react";
import {
  useUserSettingsById,
  useUpdateUserSettings,
} from "../hooks/useUserSettings";
import { useMe } from "../hooks/useUser";
import * as Dialog from "@radix-ui/react-dialog";

/**
 * AdminSettingsPanel component to control all user setting parameters.
 */
export function AdminSettingsPanel(): JSX.Element {
  const [appliedSettings, setAppliedSettings] = useState<any | null>(null);

  const { data: user } = useMe();
  const userId = user?.id;

  const { data: settings } = useUserSettingsById(userId ?? "");
  const updateSettings = useUpdateUserSettings(userId ?? "");

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
      setGainThreshold(settings.gain_rate_threshold);
      setDrawdownThreshold(settings.drawdown_rate_threshold);
      setOvernightFeeValue(settings.overnight_fee_rate);
      setOvernightFeeType(settings.overnight_fee_type);
      setPowerUpValue(settings.power_up_fee);
      setPowerUpType(settings.power_up_type);
    }
  }, [settings]);

  const handleApply = () => {
    if (!userId || !settings) return;

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

  const formattedSettings = {
    commission_rate: commissionValue,
    commission_type: commissionType,
    holding_cost_rate: holdingCostValue,
    holding_cost_type: holdingCostType,
    margin_limit: marginValue,
    gain_rate_threshold: gainThreshold,
    drawdown_rate_threshold: drawdownThreshold,
    overnight_fee_rate: overnightFeeValue,
    overnight_fee_type: overnightFeeType,
    power_up_fee: powerUpValue,
    power_up_type: powerUpType,
  };

  return (
    <>
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
        <SettingCard
          label="Commission"
          value={commissionValue}
          onChange={setCommissionValue}
          unit="%"
          toggleType={commissionType}
          onToggle={() =>
            setCommissionType((prev) => (prev === "real" ? "sim" : "real"))
          }
          area="a"
          max={10}
          step={0.1}
        />

        <SettingCard
          label="Margin"
          value={marginValue}
          onChange={setMarginValue}
          unit=""
          area="b"
          max={100000000}
          step={1000}
        />

        <div
          className="border border-gray-400 rounded-md p-2 flex flex-col justify-between text-gray-700 text-sm"
          style={{ gridArea: "c" }}
        >
          <div className="font-medium text-center mb-2">Gain & Drawdown</div>
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

        <SettingCard
          label="Holding Cost"
          value={holdingCostValue}
          onChange={setHoldingCostValue}
          unit="%"
          toggleType={holdingCostType}
          onToggle={() =>
            setHoldingCostType((prev) => (prev === "real" ? "sim" : "real"))
          }
          area="d"
          max={10}
          step={0.1}
        />

        <SettingCard
          label="Overnight Fee"
          value={overnightFeeValue}
          onChange={setOvernightFeeValue}
          unit="%"
          toggleType={overnightFeeType}
          onToggle={() =>
            setOvernightFeeType((prev) => (prev === "real" ? "sim" : "real"))
          }
          area="e"
          max={50}
          step={0.5}
        />

        <SettingCard
          label="Power Up Setting"
          value={powerUpValue}
          onChange={setPowerUpValue}
          unit=""
          toggleType={powerUpType}
          onToggle={() =>
            setPowerUpType((prev) => (prev === "real" ? "sim" : "real"))
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
                <pre className="text-xs bg-gray-100 p-3 rounded whitespace-pre-wrap break-all text-black">
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

interface SettingCardProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit: string;
  toggleType?: "real" | "sim";
  onToggle?: () => void;
  area: string;
  max: number;
  step: number;
}

/**
 * Reusable card for individual setting sliders and optional toggle.
 */
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
}: SettingCardProps): JSX.Element {
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
          {value.toFixed(1)}
          {unit}
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
