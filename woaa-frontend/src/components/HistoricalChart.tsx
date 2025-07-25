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
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useHistoricalBars } from "../hooks/useHistoricalData";
import { useSimTime } from "../hooks/useSimTimeSocket";
import { ChartContext } from "../pages/Dashboard";

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

type TimeOption = "1D/1Min" | "1M/1D" | "1Y/1M";

const TIMEFRAME_INTERVAL_MAP: Record<
  TimeOption,
  {
    timeframe: string;
    rangeDays?: number;
    rangeMonths?: number;
    rangeYears?: number;
  }
> = {
  "1D/1Min": { timeframe: "1Min", rangeDays: 1 },
  "1M/1D": { timeframe: "1Day", rangeMonths: 1 },
  "1Y/1M": { timeframe: "1Month", rangeYears: 1 },
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

export default function Chart() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lastSimMinute = useRef<number | null>(null);
  const lastCandleTimeRef = useRef<UTCTimestamp | null>(null);
  const { setChartState } = useContext(ChartContext);

  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [selectedRange, setSelectedRange] = useState<TimeOption>("1D/1Min");

  const { simTime } = useSimTime();

  const buildAllSymbols1DOptions = () => {
    if (!simTime) return null;
    const config = TIMEFRAME_INTERVAL_MAP["1D/1Min"];
    const end = getNextMarketDay(simTime);
    const startDate = new Date(simTime);
    startDate.setDate(startDate.getDate() - (config.rangeDays ?? 1));
    const start = getPreviousMarketDay(startDate);
    return {
      symbols: Object.values(SYMBOL_OPTIONS).join(","),
      start,
      end,
      timeframe: config.timeframe,
    };
  };

  const optionsAll1D = useMemo(() => buildAllSymbols1DOptions(), [simTime]);
  const bars1D = useHistoricalBars(optionsAll1D!, !!optionsAll1D);

  const options1M = useMemo(() => {
    if (!simTime || !selectedSymbol) return null;
    const config = TIMEFRAME_INTERVAL_MAP["1M/1D"];
    const end = getNextMarketDay(simTime);
    const startDate = new Date(simTime);
    startDate.setMonth(startDate.getMonth() - (config.rangeMonths ?? 1));
    const start = getPreviousMarketDay(startDate);
    return { symbols: selectedSymbol, start, end, timeframe: config.timeframe };
  }, [simTime, selectedSymbol]);

  const options1Y = useMemo(() => {
    if (!simTime || !selectedSymbol) return null;
    const config = TIMEFRAME_INTERVAL_MAP["1Y/1M"];
    const end = getNextMarketDay(simTime);
    const startDate = new Date(simTime);
    startDate.setFullYear(startDate.getFullYear() - (config.rangeYears ?? 1));
    const start = getPreviousMarketDay(startDate);
    return { symbols: selectedSymbol, start, end, timeframe: config.timeframe };
  }, [simTime, selectedSymbol]);

  const bars1M = useHistoricalBars(options1M!, !!options1M);
  const bars1Y = useHistoricalBars(options1Y!, !!options1Y);

  const barsResult =
    selectedRange === "1D/1Min"
      ? bars1D
      : selectedRange === "1M/1D"
      ? bars1M
      : bars1Y;
  const { data, isLoading, isError } = barsResult;

  const allOpenPrices = useMemo(() => {
    if (!bars1D.data?.bars || !simTime) return {};
    const result: Record<string, number | null> = {};

    Object.values(SYMBOL_OPTIONS).forEach((symbol) => {
      const bars = bars1D.data?.bars[symbol];
      if (!bars) {
        result[symbol] = null;
        return;
      }
      const match = [...bars]
        .filter((bar) => new Date(bar.t) <= simTime)
        .at(-1);
      result[symbol] = match?.c ?? null;
    });

    return result;
  }, [bars1D.data, simTime]);

  useEffect(() => {
    setChartState({ symbol: selectedSymbol, openPrices: allOpenPrices });
  }, [selectedSymbol, allOpenPrices, setChartState]);

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
        timeVisible: selectedRange === "1D/1Min",
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

    chart.applyOptions({
      crosshair: {
        horzLine: {
          visible: true,
          labelVisible: true,
        },
        vertLine: {
          labelVisible: false,
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
      lastValueVisible: true,
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
    lastCandleTimeRef.current =
      transformed.length > 0
        ? (transformed.at(-1)!.time as UTCTimestamp)
        : null;
    chart.timeScale().fitContent();
  }, [data, selectedSymbol]);

  useEffect(() => {
    if (!chartRef.current || !seriesRef.current || !containerRef.current)
      return;

    const container = containerRef.current;
    const chart = chartRef.current;
    const series = seriesRef.current;

    const toolTipWidth = 96;
    const toolTipHeight = 80;
    const toolTipMargin = 15;

    // Create tooltip element
    const toolTip = document.createElement("div");
    toolTip.style.position = "absolute";
    toolTip.style.display = "none";
    toolTip.style.pointerEvents = "none";
    toolTip.style.background = "white";
    toolTip.style.color = "black";
    toolTip.style.border = "1px solid #26a69a";
    toolTip.style.borderRadius = "4px";
    toolTip.style.fontSize = "12px";
    toolTip.style.zIndex = "1000";
    toolTip.style.padding = "8px";
    toolTip.style.boxSizing = "border-box";
    toolTip.style.fontFamily =
      "-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif";
    toolTip.style.whiteSpace = "nowrap"; // ✅ Prevent overflow
    toolTip.style.maxWidth = "160px"; // ✅ Optional safety limit
    toolTip.style.overflow = "hidden"; // ✅ Clip anything excessive
    toolTip.style.textOverflow = "ellipsis"; // ✅ Visual fallback

    container.appendChild(toolTip);

    const handleCrosshairMove = (param: any) => {
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

      const data = param.seriesData.get(series);
      if (!data) {
        toolTip.style.display = "none";
        return;
      }

      const price = data.value ?? data.close;
      const coordinate = series.priceToCoordinate(price);
      if (coordinate === null) return;

      // const dateStr = new Date(
      //   (param.time as number) * 1000
      // ).toLocaleDateString("en-US", {
      //   month: "short",
      //   day: "numeric",
      //   year: "numeric",
      // });

      toolTip.style.display = "block";
      toolTip.innerHTML = `
      <div style="color: #26a69a; font-weight: bold;">${selectedSymbol}</div>
      <div style="color: black">Open: ${data.open?.toFixed(2) ?? "N/A"}</div>
      <div style="color: black">High: ${data.high?.toFixed(2) ?? "N/A"}</div>
      <div style="color: black">Low: ${data.low?.toFixed(2) ?? "N/A"}</div>
      <div style="color: black">Close: ${data.close?.toFixed(2) ?? "N/A"}</div>
    `;

      // Adjust tooltip position
      let left = param.point.x - toolTipWidth / 2;
      if (left < 0) left = 0;
      if (left + toolTipWidth > container.clientWidth)
        left = container.clientWidth - toolTipWidth;

      let top = param.point.y + toolTipMargin;
      if (top + toolTipHeight > container.clientHeight) {
        top = param.point.y - toolTipHeight - toolTipMargin;
      }

      toolTip.style.left = `${left}px`;
      toolTip.style.top = `${top}px`;
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);

    return () => {
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      if (container.contains(toolTip)) {
        container.removeChild(toolTip);
      }
    };
  }, [selectedSymbol, data]);

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

    if (!lastVisible) return;

    const updatedBar: CandlestickData = {
      time: Math.floor(
        new Date(lastVisible.t).getTime() / 1000
      ) as UTCTimestamp,
      open: lastVisible.o,
      high: lastVisible.h,
      low: lastVisible.l,
      close: lastVisible.c,
    };

    const lastTime = lastCandleTimeRef.current;

    if (lastTime !== null && Number(updatedBar.time) >= Number(lastTime)) {
      seriesRef.current.update(updatedBar);
      lastCandleTimeRef.current = Number(updatedBar.time) as UTCTimestamp;
    }
  }, [simTime, , selectedSymbol]);

  return (
    <div className="w-full h-full flex flex-col gap-2 overflow-hidden">
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
        {(["1D/1Min", "1M/1D", "1Y/1M"] as TimeOption[]).map((range) => (
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
      {isLoading ? (
        <div>Loading chart...</div>
      ) : isError ? (
        <div>Error loading chart</div>
      ) : (
        <div ref={containerRef} className="flex-1 w-full overflow-hidden" />
      )}
    </div>
  );
}
