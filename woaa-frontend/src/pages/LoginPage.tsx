/**
 * @fileoverview Login page component that allows users to sign in using their email and password.
 * On successful login, the JWT token is stored and the user is redirected to the profile page.
 */

import { useState } from "react";
import { login } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { setToken } from "../utils/tokenStore";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      setToken(data.access_token);
      navigate("/profile");
    } catch {
      alert("Login failed");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 max-w-sm mx-auto mt-10"
    >
      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>

      {/* Register Button */}
      <button
        type="button"
        className="text-blue-600 underline"
        onClick={() => navigate("/register")}
      >
        Don’t have an account? Register
      </button>
    </form>
  );
};

export default LoginPage;
