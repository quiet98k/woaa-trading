import { useMarketClock } from "../hooks/useMarketClock";
import { useEffect, useState } from "react";

function formatTimeLeft(ms: number) {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

export default function MarketStatusBanner() {
  const { clock, loading } = useMarketClock();
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!clock) return;

    const update = () => {
      const now = new Date();
      const target = new Date(
        clock.is_open ? clock.next_close : clock.next_open
      );
      const msLeft = target.getTime() - now.getTime();
      setTimeLeft(formatTimeLeft(msLeft));
    };

    update(); // initial call
    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [clock]);

  if (loading) {
    return (
      <div className="bg-gray-100 text-gray-600 text-sm p-2 rounded">
        ⏳ Checking market status...
      </div>
    );
  }

  if (!clock) {
    return (
      <div className="bg-red-100 text-red-600 text-sm p-2 rounded">
        ❌ Failed to load market clock
      </div>
    );
  }

  const status = clock.is_open ? "OPEN" : "CLOSED";
  const label = clock.is_open ? "Closes in" : "Opens in";
  const statusColor = clock.is_open
    ? "bg-green-100 text-green-800"
    : "bg-red-100 text-red-800";

  return (
    <div className={`text-sm p-2 rounded font-medium ${statusColor}`}>
      🕒 Market is <strong>{status}</strong> — {label}:{" "}
      <span className="font-mono">{timeLeft}</span>
    </div>
  );
}
