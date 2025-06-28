/**
 * @fileoverview Candlestick chart component with dropdowns and live sim time updates.
 * Updates ChartContext with selected symbol and open price.
 */

import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type UTCTimestamp,
  type CandlestickData,
  type ISeriesApi,
} from "lightweight-charts";
import { useEffect, useMemo, useRef, useState, useContext, type JSX } from "react";
import { useHistoricalBars } from "../hooks/useHistoricalBars";
import { useSimTime } from "../hooks/useSimTimeSocket";
import { ChartContext, type ChartState } from "../pages/Dashboard";

const SYMBOL_OPTIONS: Record<string, string> = {
  Apple: "AAPL",
  Google: "GOOGL",
  Nvidia: "NVDA",
  Costco: "COST",
  Spy: "SPY",
  Dia: "DIA",
  QQQ: "QQQ",
  Lucid: "LCID",
  VXX: "VXX",
};

type TimeOption = "1D" | "1M" | "1Y";

const TIMEFRAME_INTERVAL_MAP: Record<
  TimeOption,
  {
    timeframe: string;
    rangeDays?: number;
    rangeMonths?: number;
    rangeYears?: number;
  }
> = {
  "1D": { timeframe: "1Min", rangeDays: 1 },
  "1M": { timeframe: "1Day", rangeMonths: 1 },
  "1Y": { timeframe: "1Month", rangeYears: 1 },
};

function getPreviousMarketDay(date: Date): string {
  const d = new Date(date);
  do d.setDate(d.getDate() - 1);
  while (d.getDay() === 0 || d.getDay() === 6);
  return d.toISOString().split("T")[0];
}

function getNextMarketDay(date: Date): string {
  const d = new Date(date);
  do d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6);
  return d.toISOString().split("T")[0];
}

interface ChartProps {
  setChartState: React.Dispatch<React.SetStateAction<ChartState>>;
}

export default function Chart({ setChartState }: ChartProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [selectedRange, setSelectedRange] = useState<TimeOption>("1D");
  const { simTime } = useSimTime();

  const buildOptions = (range: TimeOption) => {
    if (!simTime) return null;
    const config = TIMEFRAME_INTERVAL_MAP[range];
    const end = getNextMarketDay(simTime);
    const startDate = new Date(simTime);
    if (config.rangeDays)
      startDate.setDate(startDate.getDate() - config.rangeDays);
    if (config.rangeMonths)
      startDate.setMonth(startDate.getMonth() - config.rangeMonths);
    if (config.rangeYears)
      startDate.setFullYear(startDate.getFullYear() - config.rangeYears);
    const start = getPreviousMarketDay(startDate);
    return { symbols: selectedSymbol, start, end, timeframe: config.timeframe };
  };

  const options1D = useMemo(
    () => buildOptions("1D"),
    [simTime, selectedSymbol]
  );
  const bars1D = useHistoricalBars(options1D!, !!options1D);

  const openPrice = useMemo(() => {
    if (!bars1D.data?.bars[selectedSymbol] || !simTime) return null;
    const match = bars1D.data.bars[selectedSymbol]
      .filter((bar) => new Date(bar.t) <= simTime)
      .at(-1);
    return match?.o ?? null;
  }, [bars1D.data, selectedSymbol, simTime]);

  useEffect(() => {
    setChartState({ symbol: selectedSymbol, openPrice });
  }, [selectedSymbol, openPrice]);

  useEffect(() => {
    if (!containerRef.current || !bars1D.data?.bars[selectedSymbol]) return;
    if (chartRef.current) chartRef.current.remove();

    const chart = createChart(containerRef.current, {
      layout: { textColor: "black", background: { color: "white" } },
      height: 400,
      timeScale: { timeVisible: selectedRange === "1D" },
      localization: {
        timeFormatter: (ts: number) =>
          new Date(ts * 1000).toLocaleTimeString("en-US", {
            timeZone: "America/Los_Angeles",
            hour: "numeric",
            minute: "2-digit",
          }),
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    seriesRef.current = candlestickSeries;

    const transformed: CandlestickData[] = bars1D.data.bars[selectedSymbol]
      .filter((bar) => new Date(bar.t) <= simTime!)
      .map((bar) => ({
        time: (new Date(bar.t).getTime() / 1000) as UTCTimestamp,
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
      }));

    candlestickSeries.setData(transformed);
    chart.timeScale().fitContent();
  }, [bars1D.data, selectedSymbol]);

  return (
    <div className="flex flex-col gap-2">
      <select
        className="border p-2 rounded-md text-black"
        value={selectedSymbol}
        onChange={(e) => setSelectedSymbol(e.target.value)}
      >
        {Object.entries(SYMBOL_OPTIONS).map(([label, value]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
