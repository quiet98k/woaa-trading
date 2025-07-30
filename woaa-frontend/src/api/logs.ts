// src/utils/logger.ts
import { v4 as uuidv4 } from "uuid";
import { UAParser } from "ua-parser-js";

export interface FrontendLog {
  timestamp: string;
  log_id: string;
  session_id: string;
  device: string;
  username: string;
  level: "INFO" | "DEBUG" | "ERROR" | "WARN";
  event_type: string;
  status: string; // "success" | "fail" | "200" | "400" etc.
  error_msg: string | null;
  location: string; // File/component name
  additional_info: Record<string, any>;
  notes?: string | null;
}

const BASE_URL = import.meta.env.VITE_API_URL;

// Get device info
function getDeviceInfo(): string {
  const parser = new UAParser();
  const { os, browser, device } = parser.getResult();

  return (
    `${os.name ?? "Unknown OS"} ${os.version ?? ""} / ` +
    `${browser.name ?? "Unknown Browser"} ${browser.version ?? ""}` +
    (device.type ? ` (${device.type})` : "")
  );
}

// Generate a session ID for this browser tab/session
function getSessionId(): string {
  const key = "frontend_session_id";
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
}

// Send log to backend
export async function logFrontendEvent(
  log: Omit<FrontendLog, "timestamp" | "log_id" | "device" | "session_id">
) {
  const payload: FrontendLog = {
    ...log,
    timestamp: new Date().toISOString(),
    log_id: uuidv4(),
    session_id: getSessionId(),
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

// Simple logger factory (manual fileName & userName)
export function createLogger(location: string, userName: string) {
  return (
    log: Omit<
      FrontendLog,
      "timestamp" | "log_id" | "device" | "location" | "username" | "session_id"
    >
  ) => {
    return logFrontendEvent({
      ...log,
      location,
      username: userName,
    });
  };
}
