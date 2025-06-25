import React, { useEffect, useRef, useState, type JSX } from "react";
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type Time,
  type LogicalRange,
} from "lightweight-charts";
import { useStockSocket } from "../hooks/useStockSocket";
import { formatISO, addDays, addMonths } from "date-fns";
import debounce from "lodash.debounce"; // npm install lodash.debounce

const DEFAULT_SYMBOL = "AAPL";
const TIME_OPTIONS = ["1D/1Min", "5D/5Min", "1M/1D", "1Y/1M"] as const;
type TimeOption = (typeof TIME_OPTIONS)[number];

const TIMEFRAME_INTERVAL_MAP: Record<TimeOption, [string, string]> = {
  "1D/1Min": ["1Day", "1Min"],
  "5D/5Min": ["5Day", "5Min"],
  "1M/1D": ["1Month", "1Day"],
  "1Y/1M": ["1Year", "1Month"],
};

const END_OFFSET_MAP: Record<TimeOption, { days?: number; months?: number }> = {
  "1D/1Min": { days: 1 },
  "5D/5Min": { days: 5 },
  "1M/1D": { months: 1 },
  "1Y/1M": { months: 12 },
};

const SYMBOLS = ["AAPL", "TSLA", "AMZN", "GOOG", "MSFT"];

export default function Chart(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);

  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [range, setRange] = useState<TimeOption>("1M/1D");
  const [visibleStart, setVisibleStart] = useState("2024-01-01");
  const [visibleEnd, setVisibleEnd] = useState("2024-02-01");

  const [_, interval] = TIMEFRAME_INTERVAL_MAP[range];

  const { data } = useStockSocket({
    symbols: symbol,
    timeframe: interval,
    start: visibleStart,
    end: visibleEnd,
  });

  useEffect(() => {
    if (containerRef.current && !chartRef.current) {
      chartRef.current = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: 400,
        layout: {
          background: { color: "white" },
          textColor: "black",
        },
        timeScale: { timeVisible: true },
      });

      seriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
        upColor: "#26a69a",
        downColor: "#ef5350",
        borderVisible: false,
        wickUpColor: "#26a69a",
        wickDownColor: "#ef5350",
      });
    }

    return () => {
      chartRef.current?.remove();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (data && seriesRef.current) {
      console.log("[Chart] Updating series data:", data);
      seriesRef.current.setData(data);
      chartRef.current?.timeScale().fitContent();
    }
  }, [data]);

  useEffect(() => {
    if (!chartRef.current) return;

    const timeScale = chartRef.current.timeScale();

    const handleVisibleRangeChange = debounce(() => {
      const visibleLogicalRange = chartRef.current
        ?.timeScale()
        .getVisibleLogicalRange();
      if (!visibleLogicalRange || !seriesRef.current) return;

      const fromIndex = Math.floor(visibleLogicalRange.from);
      const toIndex = Math.ceil(visibleLogicalRange.to);

      const fromBar = seriesRef.current.dataByIndex(fromIndex, 0);
      const toBar = seriesRef.current.dataByIndex(toIndex, 0);

      if (fromBar && toBar) {
        const newStart = new Date(fromBar.time * 1000);
        const newEnd = new Date(toBar.time * 1000);

        const startISO = formatISO(newStart, { representation: "date" });
        const endISO = formatISO(newEnd, { representation: "date" });

        // Only update if date boundaries actually changed
        if (startISO !== visibleStart || endISO !== visibleEnd) {
          console.log(
            "[Chart] Visible range changed. Fetching:",
            startISO,
            "→",
            endISO
          );
          setVisibleStart(startISO);
          setVisibleEnd(endISO);
        }
      }
    }, 1000);

    timeScale.subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);

    return () => {
      handleVisibleRangeChange.cancel();
    };
  }, [symbol, range]);

  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        <select
          className="border border-gray-300 rounded px-2 py-1"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        >
          {SYMBOLS.map((sym) => (
            <option key={sym} value={sym}>
              {sym}
            </option>
          ))}
        </select>

        <select
          className="border border-gray-300 rounded px-2 py-1"
          value={range}
          onChange={(e) => setRange(e.target.value as TimeOption)}
        >
          {TIME_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div ref={containerRef} className="border rounded-lg shadow-md" />
    </div>
  );
}
