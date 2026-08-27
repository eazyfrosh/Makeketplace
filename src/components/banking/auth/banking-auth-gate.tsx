"use client";

import * as React from "react";
import type { ReactNode } from "react";

import { getAuthStatus } from "@/lib/banking/client";
import { SignInForm } from "@/components/banking/auth/sign-in-form";
import { SignUpForm } from "@/components/banking/auth/sign-up-form";

type GateState = "loading" | "sign-up" | "sign-in" | "authed" | "error";

/**
 * Nested inside LicenseGuard (which already confirmed the Nexova license):
 * gates the Banking Platform's own pages behind a second, banking-specific
 * email/password sign-in, shown once per session (or until the session
 * token expires/is cleared).
 */
export function BankingAuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = React.useState<GateState>("loading");

  const checkStatus = React.useCallback(async () => {
    setState("loading");
    try {
      const { hasAccount, sessionValid } = await getAuthStatus();
      setState(sessionValid ? "authed" : hasAccount ? "sign-in" : "sign-up");
    } catch {
      setState("error");
    }
  }, []);

  React.useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  if (state === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground text-sm">Checking your banking sign-in…</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-muted-foreground text-sm">Couldn&apos;t reach the banking platform. Try refreshing.</p>
      </div>
    );
  }

  if (state === "authed") return <>{children}</>;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      {state === "sign-up" ? (
        <SignUpForm onSuccess={() => setState("authed")} onSwitchToSignIn={() => setState("sign-in")} />
      ) : (
        <SignInForm onSuccess={() => setState("authed")} onSwitchToSignUp={() => setState("sign-up")} />
      )}
    </div>
  );
}
