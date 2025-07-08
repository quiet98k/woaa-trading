/**
 * @fileoverview Utility functions for managing the authentication token in local storage.
 * Provides methods to get, set, and clear the token used for authenticated API requests.
 */

const TOKEN_KEY = "token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) =>
  localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);
