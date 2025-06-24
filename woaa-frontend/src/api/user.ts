/**
 * @fileoverview Handles API requests related to user data,
 * including fetching the current user's profile and performing admin-level actions.
 */

const BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Fetches the profile of the currently authenticated user.
 *
 * @returns A promise resolving to the user's profile data.
 * @throws Will throw an error if the request fails or the response is not OK.
 */
export async function getMe(): Promise<any> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/user/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

/**
 * Fetches a user's profile by their UUID (admin-only access).
 *
 * @param userId - The UUID of the user to fetch.
 * @returns A promise resolving to the target user's profile data.
 * @throws Will throw an error if the user is not found or the caller is unauthorized.
 */
export async function getUserById(userId: string): Promise<any> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/user/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch user by ID");
  return res.json();
}

/**
 * Updates a user's real and/or simulated balances (admin-only access).
 *
 * @param userId - The UUID of the user to update.
 * @param data - Object containing one or both of `real_balance` and `sim_balance`.
 * @returns A promise resolving to the updated user profile.
 * @throws Will throw an error if no valid fields are provided or the user is not found.
 */
export async function updateUserBalances(
  userId: string,
  data: { real_balance?: number; sim_balance?: number }
): Promise<any> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/user/${userId}/balances`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to update user balances");
  return res.json();
}
