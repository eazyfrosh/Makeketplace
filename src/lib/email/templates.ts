import { formatPrice } from "@/lib/utils";

export function licenseIssuedEmail(params: {
  name: string;
  orderId: string;
  totalCents: number;
  items: { serviceName: string; licenseKey: string }[];
}) {
  const rows = params.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;color:#e5e7eb;">${item.serviceName}</td>
          <td style="padding:8px 0;font-family:monospace;color:#818cf8;text-align:right;">${item.licenseKey}</td>
        </tr>`,
    )
    .join("");

  const html = `
    <div style="background:#0c0c14;padding:32px;font-family:system-ui,-apple-system,sans-serif;">
      <div style="max-width:520px;margin:0 auto;background:#111118;border-radius:16px;padding:32px;color:#f4f4f5;">
        <h1 style="font-size:20px;margin:0 0 8px;">Thanks for your purchase, ${params.name}</h1>
        <p style="color:#9ca3af;font-size:14px;margin:0 0 24px;">
          Order <span style="font-family:monospace;color:#e5e7eb;">${params.orderId}</span> — ${formatPrice(params.totalCents)}
        </p>
        <table style="width:100%;border-collapse:collapse;">${rows}</table>
        <p style="color:#9ca3af;font-size:13px;margin-top:24px;">
          Your license keys are also available anytime in your
          <a href="/dashboard" style="color:#818cf8;">Nexova dashboard</a>.
        </p>
      </div>
    </div>
  `;

  return {
    subject: `Your Nexova license key${params.items.length > 1 ? "s" : ""} — order ${params.orderId}`,
    html,
  };
}
