import { v4 as uuidv4 } from "uuid";

export interface FrontendLog {
  timestamp: string;
  log_id: string;
  device: string;
  user_name: string;
  level: "INFO" | "DEBUG" | "ERROR" | "WARN";
  event_type: string;
  status: string; // "success" | "fail" | "200" | "400" etc.
  error_msg: string | null;
  location: string;
  additional_info: Record<string, any>;
}

const BASE_URL = import.meta.env.VITE_API_URL;

// Helper to get device info
function getDeviceInfo(): string {
  // More modern approach if available
  const uaData = (navigator as any).userAgentData;
  if (uaData) {
    return `${uaData.platform} / ${uaData.brands
      ?.map((b: any) => b.brand)
      .join(", ")}`;
  }
  return navigator.userAgent;
}

// Main log function
export async function logFrontendEvent(
  log: Omit<FrontendLog, "timestamp" | "log_id" | "device">
) {
  const payload: FrontendLog = {
    ...log,
    timestamp: new Date().toISOString(),
    log_id: uuidv4(),
    device: getDeviceInfo(),
  };

  try {
    await fetch(`${BASE_URL}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Failed to log event:", err);
  }
}
