export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        EazyTool uses account and service information to operate your workspace. Contact
        support@eazytool.app if you have a privacy question or want to request account deletion.
      </p>
      <div className="glass mt-8 space-y-4 rounded-2xl p-6 text-sm text-muted-foreground">
        <p>1. We collect account details (name, email) and subscription history to provide your plan.</p>
        <p>2. Subscription payment details are processed securely by Paystack. EazyTool does not store your card details.</p>
        <p>3. We do not sell your personal data to third parties.</p>
        <p>4. You can request account deletion at any time via support.</p>
        <p>5. Google Analytics is optional. It loads only after you choose “Allow analytics.” We use it to measure page visits, traffic sources, and general service and purchase events. Our Analytics events exclude names, email addresses, payment references, domain names, passwords, and payment details.</p>
        <p>6. If you allow analytics, Google may set analytics cookies. You can withdraw consent at any time using “Cookie settings” in the footer. Rejecting analytics does not block EazyTool’s core features.</p>
      </div>
    </div>
  );
}
