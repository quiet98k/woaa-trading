/**
 * @fileoverview Handles API requests related to transactions.
 */

const BASE_URL = import.meta.env.VITE_API_URL;
import { logFrontendEvent } from "./logs";

const LOCATION = "api/transactions.ts";

/**
 * Unified logger for transaction API calls
 */
async function logTransactionEvent(
  eventType: string,
  res: Response,
  notes: string,
  additional_info: Record<string, any> = {}
) {
  const username = localStorage.getItem("username") || "unknown";

  let errorMsg: string | null = null;
  if (!res.ok) {
    try {
      const errData = await res.clone().json();
      errorMsg = errData.message || errData.detail || res.statusText;
    } catch {
      errorMsg = res.statusText;
    }
  }

  await logFrontendEvent({
    username,
    level: res.ok ? "INFO" : "WARN",
    event_type: eventType,
    status: res.status.toString(),
    error_msg: errorMsg,
    location: LOCATION,
    additional_info,
    notes,
  });

  if (!res.ok) throw new Error(errorMsg || notes);
}

/**
 * Create a new transaction for the authenticated user.
 */
export async function createTransaction(tx: any): Promise<any> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(tx),
  });

  await logTransactionEvent(
    "api.transactions.create",
    res,
    "Create transaction",
    {
      symbol: tx?.symbol,
      shares: tx?.shares,
      price: tx?.price,
      action: tx?.action,
      commission_charged: tx?.commission_charged,
      commission_type: tx?.commission_type,
    }
  );

  return res.json();
}

/**
 * Fetch all transactions for the authenticated user.
 */
export async function getMyTransactions(): Promise<any[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/transactions`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = res.ok ? await res.clone().json() : [];
  await logTransactionEvent(
    "api.transactions.getAll",
    res,
    "Fetch my transactions",
    {
      count: data.length ?? 0,
    }
  );

  return res.ok ? data : [];
}

/**
 * Admin-only: Fetch transactions for a specific user.
 */
export async function getTransactionsByUserId(userId: string): Promise<any[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/transactions/user/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = res.ok ? await res.clone().json() : [];
  await logTransactionEvent(
    "api.transactions.getByUser",
    res,
    "Fetch user transactions",
    {
      userId,
      count: data.length ?? 0,
    }
  );

  return res.ok ? data : [];
}

/**
 * Admin-only: Fetch a single transaction by its ID.
 */
export async function getTransactionById(txId: string): Promise<any> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/transactions/item/${txId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  await logTransactionEvent("api.transactions.get", res, "Fetch transaction", {
    txId,
  });

  return res.json();
}

/**
 * Update a transaction (only allowed by the transaction owner).
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

  await logTransactionEvent(
    "api.transactions.update",
    res,
    "Update transaction",
    {
      txId,
      ...updates,
    }
  );

  return res.json();
}

/**
 * Delete a transaction (only allowed by the transaction owner).
 */
export async function deleteTransaction(txId: string): Promise<void> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/transactions/item/${txId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  await logTransactionEvent(
    "api.transactions.delete",
    res,
    "Delete transaction",
    {
      txId,
    }
  );
}
