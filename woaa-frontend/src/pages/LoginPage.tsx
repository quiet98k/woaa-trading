/**
 * @fileoverview Login page component that allows users to sign in using their email and password.
 * On successful login, the JWT token is stored and the user is redirected to the profile page.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setToken } from "../utils/tokenStore";
import { useLogin } from "../hooks/useAuth";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // ✅ useLogin hook from React Query
  const { mutate, isPending, isError } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      { email, password },
      {
        onSuccess: (data) => {
          setToken(data.access_token);
          navigate("/dashboard");
        },
        onError: () => {
          alert("Login failed");
        },
      }
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 max-w-sm mx-auto mt-10"
    >
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="border p-2 rounded-md"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="border p-2 rounded-md"
      />

      <button
        type="submit"
        disabled={isPending}
        className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Logging in..." : "Login"}
      </button>

      {isError && (
        <p className="text-red-600 text-sm">Invalid credentials. Try again.</p>
      )}

      <button
        type="button"
        className="text-blue-600 underline text-sm"
        onClick={() => navigate("/register")}
      >
        Don’t have an account? Register
      </button>
    </form>
  );
};

export default LoginPage;
