"use client";

import { getAuthHeaders } from "@/lib/licensing/client-auth";
import type { Account, AccountStatus, BankCard, Transaction } from "@/lib/banking/types";

const BANKING_SESSION_KEY = "nexova_banking_session";

export function getBankingSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(BANKING_SESSION_KEY);
}

export function setBankingSessionToken(token: string): void {
  window.localStorage.setItem(BANKING_SESSION_KEY, token);
}

export function clearBankingSessionToken(): void {
  window.localStorage.removeItem(BANKING_SESSION_KEY);
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders();
  const sessionToken = getBankingSessionToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(sessionToken ? { "x-banking-session": sessionToken } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

export function getAuthStatus(): Promise<{ hasAccount: boolean; sessionValid: boolean }> {
  return api("/api/banking/auth/status");
}

export async function registerBankingAccount(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<void> {
  const { token } = await api<{ token: string }>("/api/banking/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  setBankingSessionToken(token);
}

export async function loginBankingAccount(input: { email: string; password: string }): Promise<void> {
  const { token } = await api<{ token: string }>("/api/banking/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  setBankingSessionToken(token);
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

export function setPin(pin: string, currentPin?: string): Promise<{ ok: true }> {
  return api("/api/banking/pin", { method: "POST", body: JSON.stringify({ pin, currentPin }) });
}

export function setAccountStatus(status: Extract<AccountStatus, "active" | "frozen">): Promise<{ status: string }> {
  return api("/api/banking/account/status", { method: "PATCH", body: JSON.stringify({ status }) });
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

export function getNovabankSsoUrl(): Promise<{ redirectUrl: string }> {
  return api("/api/banking/sso/novabank");
}
