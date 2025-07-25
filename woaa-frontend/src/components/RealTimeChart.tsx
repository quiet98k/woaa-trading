import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type UTCTimestamp,
  type CandlestickData,
  type ISeriesApi,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";
import { useHistoricalBars } from "../hooks/useHistoricalData";
import { useRealTimeData } from "../hooks/useRealTimeData";

type TimeOption = "1D/1Min" | "1M/1D" | "1Y/1M";

const TIMEFRAME_MAP: Record<
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

export default function RealTimeChart() {
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastCandleTimeRef = useRef<UTCTimestamp | null>(null);

  const [inputSymbol, setInputSymbol] = useState("AAPL");
  const [symbol, setSymbol] = useState("AAPL");
  const [timeOption, setTimeOption] = useState<TimeOption>("1D/1Min");
  const [realTimeBar, setRealTimeBar] = useState<CandlestickData | null>(null);

  const { timeframe, rangeDays, rangeMonths, rangeYears } =
    TIMEFRAME_MAP[timeOption];
  const end = new Date();
  const start = new Date(end);
  if (rangeDays) start.setDate(start.getDate() - rangeDays);
  if (rangeMonths) start.setMonth(start.getMonth() - rangeMonths);
  if (rangeYears) start.setFullYear(start.getFullYear() - rangeYears);

  const bars = useHistoricalBars(
    {
      symbols: symbol,
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
      timeframe,
    },
    !!symbol
  );

  const { connected, subscribe, unsubscribe } = useRealTimeData((msg) => {
    if (msg.T === "b" && msg.S === symbol) {
      const bar: CandlestickData = {
        time: Math.floor(new Date(msg.t).getTime() / 1000) as UTCTimestamp,
        open: msg.o,
        high: msg.h,
        low: msg.l,
        close: msg.c,
      };
      setRealTimeBar(bar);
    }
  });

  useEffect(() => {
    if (connected && symbol) {
      subscribe(symbol, "bars");
      return () => unsubscribe(symbol, "bars");
    }
  }, [connected, symbol, subscribe, unsubscribe]);

  useEffect(() => {
    if (!containerRef.current || !bars.data?.bars[symbol]) return;

    // Clean up
    chartRef.current?.remove();
    chartRef.current = null;

    const chart = createChart(containerRef.current, {
      layout: { background: { color: "white" }, textColor: "black" },
      height: 400,

      timeScale: {
        visible: true,
        timeVisible: timeOption === "1D/1Min",
        secondsVisible: false,
      },

      localization: {
        timeFormatter: (timestamp: number) =>
          new Date(timestamp * 1000).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
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

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      borderVisible: false,
      lastValueVisible: true,
    });
    seriesRef.current = series;

    const transformed = bars.data.bars[symbol].map((bar) => ({
      time: Math.floor(new Date(bar.t).getTime() / 1000) as UTCTimestamp,
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
    }));

    series.setData(transformed);
    lastCandleTimeRef.current = transformed.at(-1)?.time ?? null;
    chart.timeScale().fitContent();

    // Tooltip
    const tooltip = document.createElement("div");
    tooltip.style.cssText = `
      position: absolute; display: none; pointer-events: none; z-index: 1000;
      background: white; border: 1px solid #26a69a; border-radius: 4px;
      padding: 8px; font-size: 12px; font-family: sans-serif;
    `;
    containerRef.current.appendChild(tooltip);

    chart.subscribeCrosshairMove((param) => {
      if (!param.point || !param.time) {
        tooltip.style.display = "none";
        return;
      }

      const raw = param.seriesData.get(series);
      if (!raw) return;
      const data = raw as CandlestickData;

      tooltip.innerHTML = `
        <strong>${symbol}</strong><br/>
        Open: ${data.open?.toFixed(2)}<br/>
        High: ${data.high?.toFixed(2)}<br/>
        Low: ${data.low?.toFixed(2)}<br/>
        Close: ${data.close?.toFixed(2)}
      `;
      tooltip.style.display = "block";
      tooltip.style.left = `${param.point.x + 10}px`;
      tooltip.style.top = `${param.point.y + 10}px`;
    });

    return () => {
      chart.unsubscribeCrosshairMove(() => {});
      if (containerRef.current?.contains(tooltip)) {
        containerRef.current.removeChild(tooltip);
      }
    };
  }, [bars.data, symbol, timeOption]);

  useEffect(() => {
    if (!realTimeBar || !seriesRef.current) return;
    if (
      lastCandleTimeRef.current !== null &&
      Number(realTimeBar.time) <= Number(lastCandleTimeRef.current)
    ) {
      return;
    }

    seriesRef.current.update(realTimeBar);
    lastCandleTimeRef.current = Math.floor(
      new Date(realTimeBar.time as string).getTime() / 1000
    ) as UTCTimestamp;
  }, [realTimeBar]);

  const handleTrack = () => {
    const upper = inputSymbol.trim().toUpperCase();
    if (/^[A-Z]{1,5}$/.test(upper)) {
      setSymbol(upper);
      setRealTimeBar(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={inputSymbol}
          onChange={(e) => setInputSymbol(e.target.value)}
          placeholder="Enter symbol (e.g. AAPL)"
          className="border p-2 rounded-md text-black"
        />
        <button
          onClick={handleTrack}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          Track
        </button>
        {(["1D/1Min", "1M/1D", "1Y/1M"] as TimeOption[]).map((opt) => (
          <button
            key={opt}
            onClick={() => setTimeOption(opt)}
            className={`px-3 py-1 rounded text-sm font-medium ${
              timeOption === opt ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {bars.isLoading ? (
        <div>📊 Loading chart...</div>
      ) : bars.isError ? (
        <div>❌ Failed to load chart</div>
      ) : (
        <div ref={containerRef} className="w-full flex-1 overflow-hidden" />
      )}
    </div>
  );
}
