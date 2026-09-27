import type { ReceiptEmailTemplate, ReceiptTransactionOption } from "@/lib/receipt-email/types";

function escape(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

function money(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(amountMinor / 100);
}

export function renderReceiptEmail(input: { template: ReceiptEmailTemplate; transaction: ReceiptTransactionOption; customerName: string }) {
  const { template, transaction } = input;
  const rows = transaction.lineItems.map((item) => `<tr><td style="padding:12px 0;border-bottom:1px solid #e5e7eb">${escape(item.description)} × ${item.quantity}</td><td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">${escape(money(item.quantity * item.unitAmountMinor, transaction.currency))}</td></tr>`).join("");
  const logo = template.logoUrl ? `<img src="${escape(template.logoUrl)}" alt="${escape(template.merchantName)}" style="max-height:52px;max-width:180px;object-fit:contain" />` : `<div style="font-size:22px;font-weight:800;color:${template.primaryColor}">${escape(template.merchantName)}</div>`;
  return `<!doctype html><html><body style="margin:0;background:${template.backgroundColor};font-family:Arial,sans-serif;color:${template.textColor}"><div style="padding:32px 12px"><div style="max-width:620px;margin:auto;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #e5e7eb"><div style="height:7px;background:${template.primaryColor}"></div><div style="padding:32px">${logo}<h1 style="margin:28px 0 8px;font-size:28px">Receipt</h1><p style="margin:0 0 24px;color:#6b7280">Hello ${escape(input.customerName)}, ${escape(template.message)}</p><div style="padding:16px;border-radius:12px;background:#f8fafc"><div style="font-size:12px;color:#64748b;text-transform:uppercase">Verified EazyTools transaction</div><div style="margin-top:6px;font-family:monospace;font-weight:700">${escape(transaction.reference)}</div><div style="margin-top:4px;font-size:13px;color:#64748b">${escape(new Date(transaction.occurredAt).toLocaleString("en-NG"))}</div></div><table style="width:100%;border-collapse:collapse;margin-top:20px">${rows}<tr><td style="padding-top:18px;font-size:18px;font-weight:700">Total</td><td style="padding-top:18px;text-align:right;font-size:22px;font-weight:800;color:${template.primaryColor}">${escape(money(transaction.amountMinor, transaction.currency))}</td></tr></table><div style="margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:13px;line-height:1.7;color:#64748b"><strong style="color:${template.textColor}">${escape(template.merchantName)}</strong><br>${escape(template.merchantAddress)}<br>${escape(template.merchantEmail)}${template.merchantPhone ? ` · ${escape(template.merchantPhone)}` : ""}</div><p style="margin:24px 0 0;font-size:12px;color:#94a3b8">${escape(template.footer)}</p></div></div></div></body></html>`;
}
