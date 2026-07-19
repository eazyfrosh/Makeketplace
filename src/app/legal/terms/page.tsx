export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        This is a demo marketplace project. Placeholder terms — replace with your real
        terms of service before taking real payments.
      </p>
      <div className="glass mt-8 space-y-4 rounded-2xl p-6 text-sm text-muted-foreground">
        <p>1. Nexova provides digital products and services as described on each service page.</p>
        <p>2. Payment is due in full for the package selected at checkout unless otherwise agreed.</p>
        <p>3. Delivered source code and assets are licensed for use per the purchased package.</p>
        <p>4. Refunds are handled on a case-by-case basis within 14 days of purchase.</p>
      </div>
    </div>
  );
}
