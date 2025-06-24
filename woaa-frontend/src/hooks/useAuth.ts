/**
 * @fileoverview React Query hooks for authentication.
 */

import { useMutation } from "@tanstack/react-query";
import { login, register, registerAdmin } from "../api/auth";

/**
 * Hook for logging in a user.
 */
export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
  });
}

/**
 * Hook for registering a new user.
 */
export function useRegister() {
  return useMutation({
    mutationFn: ({
      username,
      email,
      password,
    }: {
      username: string;
      email: string;
      password: string;
    }) => register(username, email, password),
  });
}

/**
 * Hook for registering an admin user.
 */
export function useRegisterAdmin() {
  return useMutation({
    mutationFn: ({
      username,
      email,
      password,
    }: {
      username: string;
      email: string;
      password: string;
    }) => registerAdmin(username, email, password),
  });
}
