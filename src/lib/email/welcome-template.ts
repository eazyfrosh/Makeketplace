function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderWelcomeEmail(input: { name: string; dashboardUrl: string }) {
  const name = input.name.trim() || "there";
  const safeName = escapeHtml(name);
  const safeDashboardUrl = escapeHtml(input.dashboardUrl);
  const subject = "Welcome to EazyTool";
  const text = [
    `Hi ${name},`,
    "",
    "Welcome to EazyTool — your simple workspace for websites, email design, domains, business platforms, and everyday digital tools.",
    "",
    "You can start with one simple task, follow the guided steps, and come back to your dashboard whenever you are ready.",
    "",
    `Open your dashboard: ${input.dashboardUrl}`,
    "",
    "We are happy to have you with us.",
    "",
    "The EazyTool team",
  ].join("\n");
  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f4f7fb;color:#14213d;font-family:Arial,Helvetica,sans-serif">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 12px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #dce5f2;border-radius:18px;overflow:hidden">
          <tr><td style="padding:28px 32px;background:#102a56;color:#ffffff">
            <div style="font-size:24px;font-weight:700;letter-spacing:-.5px">EazyTool</div>
            <div style="margin-top:7px;color:#b9d9ff;font-size:12px;letter-spacing:1.6px;text-transform:uppercase">Simple tools for everyday digital work</div>
          </td></tr>
          <tr><td style="padding:34px 32px 30px">
            <p style="margin:0;color:#536783;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Welcome</p>
            <h1 style="margin:10px 0 0;color:#102a56;font-size:30px;line-height:1.2">We are glad you are here, ${safeName}.</h1>
            <p style="margin:18px 0 0;color:#3d506c;font-size:16px;line-height:1.7">Welcome to EazyTool — your simple workspace for websites, email design, domains, business platforms, and everyday digital tools.</p>
            <p style="margin:14px 0 0;color:#3d506c;font-size:16px;line-height:1.7">Start with one simple task, follow the guided steps, and come back to your dashboard whenever you are ready.</p>
            <p style="margin:28px 0 0"><a href="${safeDashboardUrl}" style="display:inline-block;background:#1769e0;color:#ffffff;text-decoration:none;border-radius:10px;padding:13px 20px;font-size:15px;font-weight:700">Open your dashboard</a></p>
          </td></tr>
          <tr><td style="padding:20px 32px 26px;border-top:1px solid #e6edf5;color:#71829a;font-size:12px;line-height:1.6">You are receiving this message because an EazyTool account was created with this email address.<br><br>The EazyTool team</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
  return { subject, html, text };
}
