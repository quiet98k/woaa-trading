/**
 * @fileoverview Handles authentication API requests including login, logout, and registration.
 * Uses the backend base URL from environment variables.
 */

const BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Sends a login request to the backend API with the provided email and password.
 *
 * @param email - The user's email address.
 * @param password - The user's password.
 * @returns A promise that resolves to the JSON response containing authentication details.
 * @throws Will throw an error if the login request fails.
 */
export async function login(email: string, password: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ username: email, password }),
  });

  if (!res.ok) throw new Error("Login failed");
  return res.json();
}

/**
 * Logs out the current user by removing the authentication token from local storage.
 */
export function logout(): void {
  localStorage.removeItem("token");
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
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
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
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/auth/register-admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ username, email, password, is_admin: true }),
  });

  if (!res.ok) throw new Error("Admin registration failed");
  return res.json();
}
