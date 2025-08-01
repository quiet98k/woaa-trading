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
import {
  fetchMarketCalendar,
  type FetchBarsOptions,
} from "../api/historicalData";

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

function defaultTickMarkFormatter(
  timePoint: { timestamp: any; businessDay?: any },
  tickMarkType: any,
  locale: Intl.LocalesArgument
) {
  const formatOptions: Intl.DateTimeFormatOptions = {};

  switch (tickMarkType) {
    case 0: //TickMarkType.Year:
      formatOptions.year = "numeric";
      break;

    case 1: // TickMarkType.Month:
      formatOptions.month = "short";
      break;

    case 2: //TickMarkType.DayOfMonth:
      formatOptions.day = "numeric";
      break;

    case 3: //TickMarkType.Time:
      formatOptions.hour12 = false;
      formatOptions.hour = "2-digit";
      formatOptions.minute = "2-digit";
      break;

    case 4: //TickMarkType.TimeWithSeconds:
      formatOptions.hour12 = false;
      formatOptions.hour = "2-digit";
      formatOptions.minute = "2-digit";
      formatOptions.second = "2-digit";
      break;

    default:
    // ensureNever(tickMarkType);
  }

  const date =
    timePoint.businessDay === undefined
      ? new Date(timePoint.timestamp * 1000)
      : new Date(
          Date.UTC(
            timePoint.businessDay.year,
            timePoint.businessDay.month - 1,
            timePoint.businessDay.day
          )
        );

  // from given date we should use only as UTC date or timestamp
  // but to format as locale date we can convert UTC date to local date
  const localDateFromUtc = new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds()
  );

  return localDateFromUtc.toLocaleString(locale, formatOptions);
}

export async function getPreviousMarketDay(date: Date): Promise<string | null> {
  const end = date.toISOString().split("T")[0];

  const lookback = new Date(date);
  lookback.setDate(lookback.getDate() - 30); // Look back 30 calendar days
  const start = lookback.toISOString().split("T")[0];

  const calendar = await fetchMarketCalendar(start, end);

  const sortedDates = Array.from(calendar.keys())
    .sort()
    .filter((d) => d <= end);
  if (sortedDates.length === 0) return null;

  return sortedDates.at(-1)!;
}

// export async function getNextMarketDay(date: Date): Promise<string | null> {
//   const start = date.toISOString().split("T")[0];

//   const forward = new Date(date);
//   forward.setDate(forward.getDate() + 30); // Look forward 30 calendar days
//   const end = forward.toISOString().split("T")[0];

//   const calendar = await fetchMarketCalendar(start, end);

//   const sortedDates = Array.from(calendar.keys())
//     .sort()
//     .filter((d) => d > start);
//   if (sortedDates.length === 0) return null;

//   return sortedDates[0];
// }

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
  const [fetchOptions, setFetchOptions] = useState<FetchBarsOptions | null>(
    null
  );
  useEffect(() => {
    const buildOptions = async () => {
      if (!symbol) return;

      const today = new Date();
      const end = await getPreviousMarketDay(today); // if today is not a trading day

      const startDate = new Date(today);
      if (rangeDays) startDate.setDate(startDate.getDate() - rangeDays);
      if (rangeMonths) startDate.setMonth(startDate.getMonth() - rangeMonths);
      if (rangeYears)
        startDate.setFullYear(startDate.getFullYear() - rangeYears);

      const start = await getPreviousMarketDay(startDate);

      if (start && end) {
        setFetchOptions({
          symbols: symbol,
          start,
          end,
          timeframe,
        });
      }
    };

    buildOptions();
  }, [symbol, timeframe, rangeDays, rangeMonths, rangeYears]);

  const bars = useHistoricalBars(fetchOptions!, !!fetchOptions);

  const { connected, subscribe, unsubscribe } = useRealTimeData((msg) => {
    const payload = Array.isArray(msg) ? msg[0] : msg;
    if (!payload) return;

    if (payload.T === "b" && payload.S === symbol) {
      const bar: CandlestickData = {
        time: Math.floor(new Date(payload.t).getTime() / 1000) as UTCTimestamp,
        open: payload.o,
        high: payload.h,
        low: payload.l,
        close: payload.c,
      };
      console.log("Received real-time bar:", bar);
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

    const localTimezoneOffset = new Date().getTimezoneOffset() * 60;

    const chart = createChart(containerRef.current, {
      layout: { background: { color: "white" }, textColor: "black" },
      height: 400,

      timeScale: {
        visible: true,
        timeVisible: timeOption === "1D/1Min",
        secondsVisible: false,
        tickMarkFormatter: (time: number, tickMarkType: any, locale: any) => {
          return defaultTickMarkFormatter(
            { timestamp: time - localTimezoneOffset },
            tickMarkType,
            locale
          );
        },
      },
      // localization: {
      //   locale: "en-US",
      //   timeFormatter: (timestamp: number) => {
      //     const local = timeToLocal(timestamp);
      //     return new Date(local * 1000).toLocaleString("en-US", {
      //       timeZone: "America/Los_Angeles", // your target timezone
      //       hour: "2-digit",
      //       minute: "2-digit",
      //       month: "short",
      //       day: "numeric",
      //     });
      //   },
      // },
      // localization: {
      //   timeFormatter: (timestamp: number) =>
      //     new Date(timestamp * 1000).toLocaleTimeString("en-US", {
      //       timeZone: "America/Los_Angeles",
      //       hour: "numeric",
      //       minute: "2-digit",
      //     }),
      // },
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
    //TODO: add log
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
          disabled={inputSymbol.trim().toUpperCase() === symbol}
          className={`px-3 py-1 rounded text-white ${
            inputSymbol.trim().toUpperCase() === symbol
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {inputSymbol.trim().toUpperCase() === symbol
            ? "Tracking..."
            : "Track"}
        </button>

        {(["1D/1Min", "1M/1D", "1Y/1M"] as TimeOption[]).map((opt) => (
          <button
            key={opt}
            onClick={
              //TODO: add log
              () => setTimeOption(opt)
            }
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
