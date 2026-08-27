"use client";

import { getAuthHeaders } from "@/lib/licensing/client-auth";
import type { Account, BankCard, Transaction } from "@/lib/banking/types";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...headers, ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

export type RedactedCard = Omit<BankCard, "cardNumber" | "cvv" | "pin">;

export function getAccount(): Promise<{
  account: Account;
  card: RedactedCard;
  transactions: Transaction[];
  hasPin: boolean;
}> {
  return api("/api/banking/account");
}

export function setPin(pin: string): Promise<{ ok: true }> {
  return api("/api/banking/pin", { method: "POST", body: JSON.stringify({ pin }) });
}

export function transfer(input: {
  kind: "internal" | "bank" | "international";
  amount: number;
  pin: string;
  recipientName: string;
  recipientAccount: string;
  recipientBank?: string;
  note?: string;
}): Promise<{ reference: string; status: string; fee: number }> {
  return api("/api/banking/transfer", { method: "POST", body: JSON.stringify(input) });
}

export function revealCard(pin: string): Promise<{ cardNumber: string; cvv: string; pin: string }> {
  return api("/api/banking/cards/reveal", { method: "POST", body: JSON.stringify({ pin }) });
}

export function freezeCard(): Promise<{ status: string }> {
  return api("/api/banking/cards/freeze", { method: "POST" });
}

export function replaceCard(): Promise<{ ok: true }> {
  return api("/api/banking/cards/replace", { method: "POST" });
}
