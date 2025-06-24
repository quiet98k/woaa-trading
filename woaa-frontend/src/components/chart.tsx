/**
 * @fileoverview Displays a candlestick chart for a selected symbol.
 * Uses WebSocket query via `useHistoricalBars` hook.
 */

import { useState } from "react";
import ReactApexChart from "react-apexcharts";
import { useHistoricalBars } from "../hooks/useHistoricalBars";

export default function Chart() {
  const [symbol, setSymbol] = useState("AAPL");

  const { data, loading, error } = useHistoricalBars({
    symbols: symbol,
    timeframe: "1Hour",
    start: "2024-06-01",
    end: "2024-06-03",
  });

  console.log("📊 ChartPage rendered. Symbol:", symbol);

  const options = {
    chart: {
      type: "candlestick" as const,
      height: 350,
      toolbar: { show: true },
    },
    title: {
      text: `${symbol} Candlestick Chart`,
      align: "left" as const,
      style: { color: "#000" },
    },
    xaxis: {
      type: "datetime" as const,
      labels: { style: { colors: "#000" } },
    },
    yaxis: {
      tooltip: { enabled: true },
      labels: { style: { colors: "#000" } },
    },
    tooltip: {
      theme: "light" as const,
    },
    plotOptions: {
      candlestick: {
        wick: { useFillColor: true },
      },
    },
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <label htmlFor="symbol" className="text-sm font-medium text-gray-700">
          Select Symbol:
        </label>
        <select
          id="symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="border px-2 py-1 rounded shadow-sm"
        >
          <option value="AAPL">AAPL</option>
          <option value="TSLA">TSLA</option>
          <option value="MSFT">MSFT</option>
          <option value="GOOGL">GOOGL</option>
          <option value="AMZN">AMZN</option>
          <option value="META">META</option>
          <option value="NVDA">NVDA</option>
          <option value="NFLX">NFLX</option>
          <option value="BABA">BABA</option>
          <option value="INTC">INTC</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading data...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <ReactApexChart
          options={options}
          series={[{ name: symbol, data }]}
          type="candlestick"
          height={350}
        />
      )}
    </div>
  );
}
