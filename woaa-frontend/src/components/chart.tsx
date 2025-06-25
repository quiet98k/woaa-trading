/**
 * @fileoverview
 * Candlestick Chart Component using TradingView Lightweight Charts.
 * Includes company selector dropdown, timeframe/interval controls,
 * and WebSocket integration for real-time historical bar data.
 */

import React, { useEffect, useRef, useState, useMemo, type JSX } from "react";
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type Time,
  type LogicalRange,
} from "lightweight-charts";
import { useStockSocket } from "../hooks/useStockSocket";
import { formatISO, addDays, addMonths } from "date-fns";

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

  const [startISO, setStartISO] = useState<string>("");
  const [endISO, setEndISO] = useState<string>("");

  const [timeframe, interval] = useMemo(
    () => TIMEFRAME_INTERVAL_MAP[range],
    [range]
  );

  // Compute start and end ISO whenever range changes
  useEffect(() => {
    const offset = END_OFFSET_MAP[range];
    const end = new Date("2024-12-31");

    const start = offset.days
      ? addDays(end, -offset.days)
      : addMonths(end, -(offset.months || 1));

    console.log("startDay:", start);

    setStartISO(formatISO(start, { representation: "date" }));
    setEndISO(formatISO(end, { representation: "date" }));
  }, [range]);

  const query = useMemo(
    () => ({
      symbols: symbol,
      timeframe: interval,
      start: startISO,
      end: endISO,
    }),
    [symbol, interval, startISO, endISO]
  );

  const { data, loading } = useStockSocket(query);

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
    if (!chartRef.current || !seriesRef.current || !containerRef.current)
      return;

    const container = containerRef.current;

    const toolTip = document.createElement("div");
    toolTip.style = `
      position: absolute;
      display: none;
      z-index: 1000;
      padding: 8px;
      box-sizing: border-box;
      font-size: 12px;
      text-align: left;
      width: 140px;
      height: auto;
      background: white;
      border: 1px solid rgba(38, 166, 154, 1);
      border-radius: 4px;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif;
      color: black;
    `;
    container.appendChild(toolTip);

    const TOOLTIP_WIDTH = 140;
    const TOOLTIP_HEIGHT = 100;

    const moveHandler = (param: any) => {
      if (
        !param.point ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > container.clientWidth ||
        param.point.y < 0 ||
        param.point.y > container.clientHeight
      ) {
        toolTip.style.display = "none";
        return;
      }

      const data = param.seriesData.get(seriesRef.current);
      if (!data) {
        toolTip.style.display = "none";
        return;
      }

      const { open, high, low, close } = data;

      toolTip.innerHTML = `
        <div><strong>${symbol}</strong></div>
        <div>O: ${open}</div>
        <div>H: ${high}</div>
        <div>L: ${low}</div>
        <div>C: ${close}</div>
        <div style="margin-top: 4px;">${new Date(
          param.time * 1000
        ).toLocaleString()}</div>
      `;

      const TOOLTIP_MARGIN_X = 8;
      const TOOLTIP_MARGIN_Y = 8;

      // Position tooltip near the cursor, bottom-right by default
      let left = param.point.x + TOOLTIP_MARGIN_X;
      let top = param.point.y + TOOLTIP_MARGIN_Y;

      // Shift left if it overflows horizontally
      if (left + toolTip.offsetWidth > container.clientWidth) {
        left = param.point.x - TOOLTIP_MARGIN_X - toolTip.offsetWidth;
      }

      // Shift up if it overflows vertically
      if (top + toolTip.offsetHeight > container.clientHeight) {
        top = param.point.y - TOOLTIP_MARGIN_Y - toolTip.offsetHeight;
      }

      toolTip.style.left = `${left}px`;
      toolTip.style.top = `${top}px`;

      toolTip.style.display = "block";
    };

    chartRef.current.subscribeCrosshairMove(moveHandler);

    return () => {
      chartRef.current?.unsubscribeCrosshairMove(moveHandler);
      container.removeChild(toolTip);
    };
  }, [symbol]);

  // useEffect(() => {
  //   if (!chartRef.current) return;

  //   const timeScale = chartRef.current.timeScale();
  //   let debounceTimeout: NodeJS.Timeout | null = null;

  //   const handleVisibleRangeChange = (
  //     range: { from: Time; to: Time } | null
  //   ) => {
  //     if (!range) return;

  //     if (debounceTimeout) clearTimeout(debounceTimeout);

  //     debounceTimeout = setTimeout(() => {
  //       console.log("📗 Debounced Visible Range (raw):", range);

  //       const fromISO = new Date((range.from as number) * 1000).toISOString();
  //       const toISO = new Date((range.to as number) * 1000).toISOString();

  //       console.log("📆 Fetching from", fromISO, "to", toISO);

  //       setStartISO(fromISO);
  //       setEndISO(toISO);
  //     }, 300);
  //   };

  //   timeScale.subscribeVisibleTimeRangeChange(handleVisibleRangeChange);

  //   return () => {
  //     if (debounceTimeout) clearTimeout(debounceTimeout);
  //     timeScale.unsubscribeVisibleTimeRangeChange(handleVisibleRangeChange);
  //   };
  // }, []);

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
