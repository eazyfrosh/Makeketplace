import type { ReceiptEmailTemplate } from "@/lib/receipt-email/types";

function escape(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export function isStatusOrPaymentTemplate(template: Pick<ReceiptEmailTemplate, "category" | "subject" | "heading" | "paragraphs">) {
  return template.category === "status-notice" || /payment|transaction|deposit|withdrawal|balance|paid|processing/i.test([template.subject, template.heading, ...template.paragraphs].join(" "));
}

export function renderReceiptEmail(template: ReceiptEmailTemplate) {
  const sensitive = isStatusOrPaymentTemplate(template);
  const paragraphs = template.paragraphs.map((paragraph) => `<p style="margin:0 0 18px;font-size:18px;line-height:1.45;font-weight:650">${escape(paragraph)}</p>`).join("");
  const logo = template.logoUrl ? `<img src="${escape(template.logoUrl)}" alt="${escape(template.brandName)}" style="width:50px;height:50px;border-radius:4px;object-fit:contain;background:#fff" />` : `<div style="width:50px;height:50px;border-radius:4px;background:#fff;color:${template.accentColor};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px">${escape(template.brandName.slice(0, 1))}</div>`;
  const image = template.featuredImageUrl ? `<img src="${escape(template.featuredImageUrl)}" alt="" style="display:block;width:100%;max-height:300px;object-fit:cover;margin-bottom:24px" />` : "";
  const button = template.buttonEnabled && template.buttonText && template.buttonUrl ? `<p style="margin:28px 0"><a href="${escape(template.buttonUrl)}" style="display:inline-block;background:${template.accentColor};color:${template.panelTextColor};padding:14px 24px;text-decoration:none;font-weight:800;border-radius:2px">${escape(template.buttonText)}</a></p>` : "";
  const warning = sensitive ? `<div style="border-top:1px solid #252525;padding:18px 22px;text-align:center"><strong style="font-size:12px">CUSTOMER-CREATED STATUS · UNVERIFIED · NOT PROOF OF PAYMENT</strong><br><span style="font-size:11px;color:${template.mutedColor}">Verify all financial or account information independently through the named institution.</span></div>` : "";
  return `<!doctype html><html><body style="margin:0;padding:0;background:${template.backgroundColor};color:${template.textColor};font-family:Georgia,'Times New Roman',serif"><div style="padding:16px"><div style="max-width:620px;margin:auto;background:${template.cardColor};border:1px solid #272727"><div style="padding:24px"><div style="display:flex;align-items:center;gap:20px">${logo}<div style="font-size:23px;font-weight:800;flex:1">${escape(template.brandName)}</div><div style="font:12px Arial,sans-serif;color:${template.mutedColor};text-transform:uppercase">${escape(template.statusLabel)}</div></div><h1 style="margin:24px 0 16px;font-size:23px;line-height:1.2">${escape(template.heading)}</h1><div>${paragraphs}</div><div style="margin-top:26px;background:${template.panelColor};color:${template.panelTextColor};padding:24px 20px">${image}<div style="font-family:Impact,Arial Black,sans-serif;font-size:44px;line-height:.92;text-transform:uppercase;letter-spacing:-1px">${escape(template.panelHeading)}</div><p style="font:18px/1.55 Arial,sans-serif;margin:24px 0 0">${escape(template.panelBody)}</p>${button}</div><p style="margin:26px 0 0;font-size:16px;line-height:1.45;font-weight:700">${escape(template.footer)}</p><p style="margin:18px 0 0;font:11px/1.5 Arial,sans-serif;color:${template.mutedColor}">Sent by ${escape(template.senderName)} &lt;${escape(template.senderEmail)}&gt;</p></div>${warning}</div></div></body></html>`;
}
