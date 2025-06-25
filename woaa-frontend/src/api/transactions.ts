/**
 * @fileoverview Handles API requests related to transactions.
 */

const BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Create a new transaction for the authenticated user.
 *
 * @param tx - Transaction data to submit.
 * @returns Promise resolving to the created transaction.
 */
export async function createTransaction(tx: any): Promise<any> {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE_URL}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(tx),
  });
  if (!response.ok) {
    const errorBody = await response.json();
    // Throw a richer error so React Query can catch it
    throw new Error(errorBody.detail || "Failed to create transaction");
  }
  return response.json();
}

/**
 * Fetch all transactions for the authenticated user.
 *
 * @returns Promise resolving to an array of transactions.
 */
export async function getMyTransactions(): Promise<any[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/transactions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

/**
 * Admin-only: Fetch transactions for a specific user.
 *
 * @param userId - UUID of the user.
 * @returns Promise resolving to a list of transactions.
 */
export async function getTransactionsByUserId(userId: string): Promise<any[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/transactions/user/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Admin failed to fetch user transactions");
  return res.json();
}

/**
 * Admin-only: Fetch a single transaction by its ID.
 *
 * @param txId - UUID of the transaction.
 * @returns Promise resolving to the transaction object.
 */
export async function getTransactionById(txId: string): Promise<any> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/transactions/item/${txId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Admin failed to fetch transaction");
  return res.json();
}

/**
 * Update a transaction (only allowed by the transaction owner).
 *
 * @param txId - UUID of the transaction.
 * @param updates - Fields to update.
 * @returns Promise resolving to the updated transaction.
 */
export async function updateTransaction(
  txId: string,
  updates: any
): Promise<any> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/transactions/item/${txId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update transaction");
  return res.json();
}

/**
 * Delete a transaction (only allowed by the transaction owner).
 *
 * @param txId - UUID of the transaction.
 */
export async function deleteTransaction(txId: string): Promise<void> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/transactions/item/${txId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete transaction");
}
