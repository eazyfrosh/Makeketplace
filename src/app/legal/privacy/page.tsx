export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        This is a demo marketplace project. Placeholder privacy policy — replace with your
        real policy before collecting real customer data.
      </p>
      <div className="glass mt-8 space-y-4 rounded-2xl p-6 text-sm text-muted-foreground">
        <p>1. We collect account details (name, email) and order history to fulfill purchases.</p>
        <p>2. Payment details are processed by Stripe, Paystack, or Flutterwave and never stored by us.</p>
        <p>3. We do not sell your personal data to third parties.</p>
        <p>4. You can request account deletion at any time via support.</p>
      </div>
    </div>
  );
}
