/**
 * @fileoverview Profile page component that displays authenticated user details.
 * Fetches user data from the backend and shows profile information like balances and role.
 */

import { useEffect, useState } from "react";
import { getMe } from "../api/user";

type User = {
  id: string;
  username: string;
  email: string;
  real_balance: number;
  sim_balance: number;
  is_admin: boolean;
  created_at: string;
};

const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        alert("Session expired. Please log in again.");
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in.</div>;

  return (
    <div className="p-6 max-w-md mx-auto space-y-4 bg-white rounded shadow text-black">
      <h2 className="text-2xl font-bold">User Profile</h2>
      <p>
        <strong>ID:</strong> {user.id}
      </p>
      <p>
        <strong>Username:</strong> {user.username}
      </p>
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>Real Balance:</strong> ${user.real_balance.toFixed(2)}
      </p>
      <p>
        <strong>Simulated Balance:</strong> ${user.sim_balance.toFixed(2)}
      </p>
      <p>
        <strong>Admin:</strong> {user.is_admin ? "Yes" : "No"}
      </p>
      <p>
        <strong>Joined:</strong> {new Date(user.created_at).toLocaleString()}
      </p>
    </div>
  );
};

export default ProfilePage;
