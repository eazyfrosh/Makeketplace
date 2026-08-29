"use client";

import * as React from "react";
import Link from "next/link";
import { KeyRound, Loader2, Snowflake, Sparkles, Sun, User } from "lucide-react";
import { toast } from "sonner";

import { useBankingAccount } from "@/lib/banking/use-account";
import { adjustOwnBalance, setAccountStatus, setPin, updateOwnProfile } from "@/lib/banking/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function BankingSettingsPage() {
  const { data, loading, error, reload } = useBankingAccount();
  const [togglingAccount, setTogglingAccount] = React.useState(false);

  const [profileInitialized, setProfileInitialized] = React.useState(false);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [savingProfile, setSavingProfile] = React.useState(false);

  React.useEffect(() => {
    if (data?.profile && !profileInitialized) {
      setFirstName(data.profile.firstName ?? "");
      setLastName(data.profile.lastName ?? "");
      setProfileInitialized(true);
    }
  }, [data, profileInitialized]);

  const [currentPin, setCurrentPin] = React.useState("");
  const [newPin, setNewPin] = React.useState("");
  const [confirmPin, setConfirmPin] = React.useState("");
  const [savingPin, setSavingPin] = React.useState(false);

  const [demoDirection, setDemoDirection] = React.useState<"credit" | "debit">("credit");
  const [demoAmount, setDemoAmount] = React.useState("");
  const [demoReason, setDemoReason] = React.useState("");
  const [applyingDemoFunds, setApplyingDemoFunds] = React.useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Enter your first and last name.");
      return;
    }
    setSavingProfile(true);
    try {
      await updateOwnProfile({ firstName: firstName.trim(), lastName: lastName.trim() });
      toast.success("Profile updated.");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function toggleAccount() {
    if (!data) return;
    const next = data.account.status === "frozen" ? "active" : "frozen";
    setTogglingAccount(true);
    try {
      await setAccountStatus(next);
      toast.success(next === "frozen" ? "Account frozen." : "Account unfrozen.");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update account.");
    } finally {
      setTogglingAccount(false);
    }
  }

  async function handleChangePin(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPin)) {
      toast.error("New PIN must be 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("New PINs don't match.");
      return;
    }
    if (data?.hasPin && !/^\d{4}$/.test(currentPin)) {
      toast.error("Enter your current PIN.");
      return;
    }
    setSavingPin(true);
    try {
      await setPin(newPin, data?.hasPin ? currentPin : undefined);
      toast.success("PIN updated.");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update PIN.");
    } finally {
      setSavingPin(false);
    }
  }

  async function handleAddDemoFunds() {
    const amount = Number(demoAmount);
    if (!(amount > 0) || !demoReason.trim()) {
      toast.error("Enter a positive amount and a reason.");
      return;
    }
    setApplyingDemoFunds(true);
    try {
      await adjustOwnBalance({ direction: demoDirection, amount, description: demoReason.trim() });
      toast.success("Demo funds applied.");
      setDemoAmount("");
      setDemoReason("");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply demo funds.");
    } finally {
      setApplyingDemoFunds(false);
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Account settings</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Manage your own account&apos;s security — this only affects your account, never anyone else&apos;s.
      </p>

      {loading ? (
        <Skeleton className="mt-8 h-40" />
      ) : (
        data && (
          <>
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-base">Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="settings-first-name">First name</Label>
                      <Input id="settings-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="settings-last-name">Last name</Label>
                      <Input id="settings-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={data.profile.email ?? ""} disabled className="opacity-60" />
                    <p className="text-muted-foreground mt-1 text-xs">
                      Your banking sign-in email can&apos;t be changed here.
                    </p>
                  </div>
                  <Button type="submit" disabled={savingProfile} className="mt-1 w-fit">
                    <User className="size-3.5" />
                    {savingProfile ? "Saving…" : "Save profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Account status</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3">
                <Badge variant={data.account.status === "active" ? "default" : "outline"} className="capitalize">
                  {data.account.status}
                </Badge>
                <p className="text-muted-foreground flex-1 text-sm">
                  Freezing blocks all transfers immediately — use this if you think your account may be
                  compromised. You can unfreeze it yourself at any time.
                </p>
                {data.account.status !== "closed" && (
                  <Button variant="outline" size="sm" disabled={togglingAccount} onClick={toggleAccount}>
                    {togglingAccount ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : data.account.status === "frozen" ? (
                      <Sun className="size-3.5" />
                    ) : (
                      <Snowflake className="size-3.5" />
                    )}
                    {data.account.status === "frozen" ? "Unfreeze account" : "Freeze account"}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Transaction PIN</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePin} className="flex flex-col gap-3">
                  {data.hasPin && (
                    <div>
                      <Label htmlFor="settings-current-pin">Current PIN</Label>
                      <Input
                        id="settings-current-pin"
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={currentPin}
                        onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                        placeholder="••••"
                        className="max-w-32 text-center text-lg tracking-[0.4em]"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="settings-new-pin">{data.hasPin ? "New PIN" : "Set a PIN"}</Label>
                    <Input
                      id="settings-new-pin"
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••"
                      className="max-w-32 text-center text-lg tracking-[0.4em]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="settings-confirm-pin">Confirm {data.hasPin ? "new" : ""} PIN</Label>
                    <Input
                      id="settings-confirm-pin"
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••"
                      className="max-w-32 text-center text-lg tracking-[0.4em]"
                    />
                  </div>
                  <Button type="submit" disabled={savingPin} className="mt-1 w-fit">
                    <KeyRound className="size-3.5" />
                    {savingPin ? "Saving…" : data.hasPin ? "Change PIN" : "Set PIN"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Demo funds</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  This is a demo account — add or remove funds from your own balance to explore transfers and
                  transactions. This never affects anyone else&apos;s account.
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="w-32">
                    <Label>Direction</Label>
                    <Select value={demoDirection} onValueChange={(v) => setDemoDirection(v as "credit" | "debit")}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit">Add funds</SelectItem>
                        <SelectItem value="debit">Remove funds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={demoAmount}
                      onChange={(e) => setDemoAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Reason</Label>
                    <Input
                      value={demoReason}
                      onChange={(e) => setDemoReason(e.target.value)}
                      placeholder="e.g. Testing the transfer flow"
                    />
                  </div>
                  <Button disabled={applyingDemoFunds} onClick={handleAddDemoFunds}>
                    <Sparkles className="size-3.5" />
                    Apply
                  </Button>
                </div>
              </CardContent>
            </Card>

            <p className="text-muted-foreground mt-6 text-xs">
              Looking to freeze or unblock your card instead? That&apos;s on the{" "}
              <Link href="/platform/banking-platform/cards" className="text-primary underline-offset-4 hover:underline">
                Cards page
              </Link>
              . Want to edit a transaction&apos;s receipt (description, reference, status)? Each transaction on the{" "}
              <Link
                href="/platform/banking-platform/transactions"
                className="text-primary underline-offset-4 hover:underline"
              >
                Transactions page
              </Link>{" "}
              has its own Edit button.
            </p>
          </>
        )
      )}
    </div>
  );
}
