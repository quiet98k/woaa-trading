/**
 * @fileoverview Provides a function to fetch the current user's profile using a JWT token stored in local storage.
 */

/**
 * Fetches the authenticated user's profile from the backend API using a stored JWT token.
 *
 * @returns A promise that resolves to the user's profile data in JSON format.
 * @throws Will throw an error if the request fails or the response is not OK.
 */
export async function getMe() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${import.meta.env.VITE_API_URL}/user/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}
