import type { ReceiptEmailTemplate } from "@/lib/receipt-email/types";

function escape(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export function isStatusOrPaymentTemplate(template: Pick<ReceiptEmailTemplate, "category" | "subject" | "heading" | "paragraphs">) {
  return template.category === "status-notice" || /payment|transaction|deposit|withdrawal|balance|paid|processing/i.test([template.subject, template.heading, ...template.paragraphs].join(" "));
}

export function renderReceiptEmail(template: ReceiptEmailTemplate) {
  const sensitive = isStatusOrPaymentTemplate(template);
  const paragraphs = template.paragraphs.map((paragraph) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;font-weight:400">${escape(paragraph)}</p>`).join("");
  const logo = template.logoUrl ? `<img src="${escape(template.logoUrl)}" alt="${escape(template.brandName)}" style="width:50px;height:50px;border-radius:4px;object-fit:contain;background:#fff" />` : `<div style="width:50px;height:50px;border-radius:4px;background:#fff;color:${template.accentColor};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px">${escape(template.brandName.slice(0, 1))}</div>`;
  const image = template.featuredImageUrl ? `<img src="${escape(template.featuredImageUrl)}" alt="" style="display:block;width:100%;max-height:300px;object-fit:cover;margin-bottom:24px" />` : "";
  const customWarning = template.warningEnabled && template.warningHeading && template.warningMessage ? `<div style="margin:24px 0 0;padding:16px 18px;border-left:4px solid #F59E0B;background:#FFFBEB;color:#78350F;border-radius:6px"><strong style="display:block;margin-bottom:6px;font-size:14px;line-height:1.4">${escape(template.warningHeading)}</strong><span style="font-size:13px;line-height:1.6">${escape(template.warningMessage)}</span></div>` : "";
  const button = template.buttonEnabled && template.buttonText && template.buttonUrl ? `<p style="margin:28px 0"><a href="${escape(template.buttonUrl)}" style="display:inline-block;background:${template.accentColor};color:${template.panelTextColor};padding:14px 24px;text-decoration:none;font-weight:700;border-radius:8px">${escape(template.buttonText)}</a></p>` : "";
  const warning = sensitive ? `<div style="border-top:1px solid #252525;padding:18px 22px;text-align:center"><strong style="font-size:12px">CUSTOMER-CREATED STATUS · UNVERIFIED · NOT PROOF OF PAYMENT</strong><br><span style="font-size:11px;color:${template.mutedColor}">Verify all financial or account information independently through the named institution.</span></div>` : "";
  return `<!doctype html><html><body style="margin:0;padding:0;background:${template.backgroundColor};color:${template.textColor};font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif"><div style="padding:16px"><div style="max-width:620px;margin:auto;background:${template.cardColor};border:1px solid #272727;border-radius:12px;overflow:hidden"><div style="padding:28px"><div style="display:flex;align-items:center;gap:18px">${logo}<div style="font-size:22px;font-weight:750;flex:1;letter-spacing:-.3px">${escape(template.brandName)}</div><div style="font-size:11px;font-weight:700;color:${template.mutedColor};text-transform:uppercase;letter-spacing:.08em">${escape(template.statusLabel)}</div></div><h1 style="margin:28px 0 16px;font-size:26px;line-height:1.25;letter-spacing:-.5px">${escape(template.heading)}</h1><div>${paragraphs}</div>${customWarning}<div style="margin-top:28px;background:${template.panelColor};color:${template.panelTextColor};padding:28px 24px;border-radius:10px">${image}<div style="font-size:30px;line-height:1.15;font-weight:800;letter-spacing:-.6px">${escape(template.panelHeading)}</div><p style="font-size:16px;line-height:1.7;margin:16px 0 0">${escape(template.panelBody)}</p>${button}</div><p style="margin:28px 0 0;font-size:14px;line-height:1.65;font-weight:500">${escape(template.footer)}</p></div>${warning}</div></div></body></html>`;
}

export function renderReceiptEmailText(template: ReceiptEmailTemplate) {
  const sections = [template.brandName, template.statusLabel, template.heading, ...template.paragraphs];
  if (template.warningEnabled) sections.push(template.warningHeading, template.warningMessage);
  sections.push(template.panelHeading, template.panelBody);
  if (template.buttonEnabled && template.buttonText && template.buttonUrl) sections.push(`${template.buttonText}: ${template.buttonUrl}`);
  sections.push(template.footer);
  if (isStatusOrPaymentTemplate(template)) sections.push("CUSTOMER-CREATED STATUS — UNVERIFIED — NOT PROOF OF PAYMENT. Verify independently through the named institution.");
  return sections.filter(Boolean).join("\n\n");
}
