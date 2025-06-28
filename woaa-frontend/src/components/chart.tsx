/**
 * @fileoverview Candlestick chart with dropdown symbol selection, time range switching,
 * and real-time sim_time updates via WebSocket.
 * Uses Lightweight Charts and dynamic timeframe switching.
 */

import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type UTCTimestamp,
  type CandlestickData,
  type ISeriesApi,
} from "lightweight-charts";
import { useEffect, useMemo, useRef, useState } from "react";
import { useHistoricalBars } from "../hooks/useHistoricalBars";
import { useSimTime } from "../hooks/useSimTimeSocket";

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
  do {
    d.setDate(d.getDate() - 1);
  } while (d.getDay() === 0 || d.getDay() === 6);
  return d.toISOString().split("T")[0];
}

function getNextMarketDay(date: Date): string {
  const d = new Date(date);
  do {
    d.setDate(d.getDate() + 1);
  } while (d.getDay() === 0 || d.getDay() === 6);
  return d.toISOString().split("T")[0];
}

interface ChartProps {
  setChartState: React.Dispatch<
    React.SetStateAction<{ symbol: string; openPrice: number | null }>
  >;
}

export default function Chart({ setChartState }: ChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lastSimMinute = useRef<number | null>(null);

  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");

  const [selectedRange, setSelectedRange] = useState<TimeOption>("1D");
  const { simTime } = useSimTime();

  const buildOptions = (range: TimeOption) => {
    if (!simTime || !selectedSymbol) return null;
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
  const options1M = useMemo(
    () => buildOptions("1M"),
    [simTime, selectedSymbol]
  );
  const options1Y = useMemo(
    () => buildOptions("1Y"),
    [simTime, selectedSymbol]
  );

  const bars1D = useHistoricalBars(options1D!, !!options1D);
  const bars1M = useHistoricalBars(options1M!, !!options1M);
  const bars1Y = useHistoricalBars(options1Y!, !!options1Y);

  const barsResult =
    selectedRange === "1D" ? bars1D : selectedRange === "1M" ? bars1M : bars1Y;
  const { data, isLoading, isError } = barsResult;

  const openPrice = useMemo(() => {
    if (!bars1D.data?.bars[selectedSymbol] || !simTime) return null;
    const minuteBars = bars1D.data.bars[selectedSymbol];
    const match = [...minuteBars]
      .filter((bar) => new Date(bar.t) <= simTime)
      .at(-1);
    return match?.o ?? null;
  }, [bars1D.data, selectedSymbol, simTime]);

  useEffect(() => {
    setChartState({ symbol: selectedSymbol, openPrice });
  }, [selectedSymbol, openPrice, setChartState]);

  useEffect(() => {
    if (!containerRef.current || !data?.bars[selectedSymbol]) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      layout: { textColor: "black", background: { color: "white" } },
      height: 400,
      timeScale: {
        timeVisible: selectedRange === "1D",
        secondsVisible: false,
      },
      localization: {
        timeFormatter: (timestamp: number) => {
          return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
            timeZone: "America/Los_Angeles",
            hour: "numeric",
            minute: "2-digit",
          });
        },
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

    const transformed: CandlestickData[] = data.bars[selectedSymbol]
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
  }, [data, selectedSymbol]);

  useEffect(() => {
    if (!simTime || !data?.bars[selectedSymbol] || !seriesRef.current) return;

    const simTimeMinute = new Date(simTime);
    simTimeMinute.setSeconds(0, 0);
    const simMinuteKey = simTimeMinute.getTime();

    if (lastSimMinute.current === simMinuteKey) return;
    lastSimMinute.current = simMinuteKey;

    const bars = data.bars[selectedSymbol];
    const visibleBars = bars.filter((bar) => new Date(bar.t) <= simTime);
    const lastVisible = visibleBars.at(-1);

    if (lastVisible) {
      const updatedBar: CandlestickData = {
        time: (new Date(lastVisible.t).getTime() / 1000) as UTCTimestamp,
        open: lastVisible.o,
        high: lastVisible.h,
        low: lastVisible.l,
        close: lastVisible.c,
      };
      seriesRef.current.update(updatedBar);
    }
  }, [simTime, data, selectedSymbol]);

  return (
    <div className="w-full h-full flex flex-col gap-2">
      <div className="flex gap-2">
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
        {(["1D", "1M", "1Y"] as TimeOption[]).map((range) => (
          <button
            key={range}
            onClick={() => setSelectedRange(range)}
            className={`px-3 py-1 rounded text-sm font-medium ${
              selectedRange === range ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {range}
          </button>
        ))}
      </div>
      <div className="text-sm text-gray-600">
        Open price: {openPrice ?? "N/A"}
      </div>
      {isLoading ? (
        <div>Loading chart...</div>
      ) : isError ? (
        <div>Error loading chart</div>
      ) : (
        <div ref={containerRef} className="w-full h-full" />
      )}
    </div>
  );
}
