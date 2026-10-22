"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";

import { AuthCard } from "@/components/auth/auth-card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth, DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from "@/context/auth-context";
import { authDestination } from "@/lib/auth/destination";
import { trackLogin } from "@/lib/analytics/ga4";

export default function LoginPage() {
  const router = useRouter();
  const { login, isDemoMode } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);

  React.useEffect(() => {
    router.prefetch(authDestination(window.location.search));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      trackLogin();
      toast.success("Welcome back!");
      router.replace(authDestination(window.location.search));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      mode="login"
      title="Log in to EazyTool"
      description="Enter your details to get back to your tools and projects."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="font-semibold text-primary underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="email"
            className="h-12"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </div>
        <div className="space-y-2.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              className="h-12 pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} aria-controls="password" className="absolute inset-y-0 right-1 flex w-11 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary">
              {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
            </button>
          </div>
        </div>
        {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? "Logging in…" : "Log in"}
          {!loading && <ArrowRight className="size-4" aria-hidden="true" />}
        </Button>
      </form>

      <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground"><LockKeyhole className="size-3.5" aria-hidden="true" /> Secure, session-only sign-in</p>

      {isDemoMode && (
        <p className="mt-6 rounded-lg bg-white/5 p-3 text-xs text-muted-foreground">
          Demo mode: log in as admin with{" "}
          <span className="font-mono text-foreground">{DEMO_ADMIN_EMAIL}</span> /{" "}
          <span className="font-mono text-foreground">{DEMO_ADMIN_PASSWORD}</span>
        </p>
      )}
    </AuthCard>
  );
}
