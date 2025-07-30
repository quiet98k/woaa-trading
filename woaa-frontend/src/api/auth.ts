/**
 * @fileoverview Handles authentication API requests including login, logout, and registration.
 * Uses the backend base URL from environment variables.
 */

const BASE_URL = import.meta.env.VITE_API_URL;
import { logFrontendEvent } from "./logs";
const LOCATION = "api/auth.ts";

/**
 * Sends a login request to the backend API with the provided email and password.
 *
 * @param email - The user's email address.
 * @param password - The user's password.
 * @returns A promise that resolves to the JSON response containing authentication details.
 * @throws Will throw an error if the login request fails.
 */
export async function login(email: string, password: string): Promise<any> {
  const url = `${BASE_URL}/auth/login`;
  const eventType = "api.auth.login";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ username: email, password }),
  });

  let errorMsg: string | null = null;
  if (!res.ok) {
    try {
      const errorData = await res.clone().json(); // clone so we can still parse JSON later
      errorMsg = errorData.message || res.statusText;
    } catch {
      errorMsg = res.statusText;
    }
  }

  // Log every request attempt with HTTP status
  await logFrontendEvent({
    username: email,
    level: res.ok ? "INFO" : "WARN",
    event_type: eventType,
    status: res.status.toString(),
    error_msg: errorMsg,
    location: LOCATION,
    additional_info: {},
    notes: res.ok ? "User logged in successfully" : "Invalid credentials",
  });

  if (!res.ok) throw new Error("Login failed");

  const data = await res.json();
  localStorage.setItem("username", email);

  return data;
}

/**
 * Logs out the current user by removing the authentication token from local storage.
 */
/**
 * Logs out the current user by removing the authentication token from local storage.
 */
export async function logout(): Promise<void> {
  const username = localStorage.getItem("username") || "guest";

  localStorage.removeItem("token");
  localStorage.removeItem("username");

  await logFrontendEvent({
    username: username,
    level: "INFO",
    event_type: "logic.logout",
    status: "success",
    error_msg: null,
    location: LOCATION,
    additional_info: {},
    notes: "User logged out successfully",
  });
}

/**
 * Registers a new user by sending their details to the backend API.
 *
 * @param username - The desired username for the new account.
 * @param email - The user's email address.
 * @param password - The user's chosen password.
 * @returns A promise that resolves to the JSON response containing registration details.
 * @throws Will throw an error if the registration request fails.
 */
export async function register(
  username: string,
  email: string,
  password: string
): Promise<any> {
  const url = `${BASE_URL}/auth/register`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  let errorMsg: string | null = null;
  if (!res.ok) {
    try {
      const errorData = await res.clone().json(); // clone so we can still parse JSON later
      errorMsg = errorData.message || res.statusText;
    } catch {
      errorMsg = res.statusText;
    }
  }

  await logFrontendEvent({
    username: email || "unknown",
    level: res.ok ? "INFO" : "WARN",
    event_type: "api.auth.register",
    status: res.status.toString(),
    error_msg: errorMsg,
    location: LOCATION,
    additional_info: {},
    notes: res.ok ? "User registered successfully" : "Registration failed",
  });

  if (!res.ok) throw new Error("Registration failed");
  return res.json();
}

/**
 * Registers a new admin by sending their details to the backend API.
 *
 * @param username - The desired username for the new admin.
 * @param email - The admin's email address.
 * @param password - The admin's chosen password.
 * @returns A promise that resolves to the JSON response containing admin registration details.
 * @throws Will throw an error if the registration request fails.
 */
export async function registerAdmin(
  username: string,
  email: string,
  password: string
): Promise<any> {
  const url = `${BASE_URL}/auth/register-admin`;
  const token = localStorage.getItem("token");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ username, email, password, is_admin: true }),
  });

  let errorMsg: string | null = null;
  if (!res.ok) {
    try {
      const errorData = await res.clone().json(); // clone so we can still parse JSON later
      errorMsg = errorData.message || res.statusText;
    } catch {
      errorMsg = res.statusText;
    }
  }

  await logFrontendEvent({
    username: email || "unknown",
    level: res.ok ? "INFO" : "WARN",
    event_type: "api.auth.register-admin",
    status: res.status.toString(),
    error_msg: errorMsg,
    location: LOCATION,
    additional_info: {},
    notes: res.ok
      ? "Admin registered successfully"
      : "Admin registration failed",
  });

  if (!res.ok) throw new Error("Admin registration failed");
  return res.json();
}
