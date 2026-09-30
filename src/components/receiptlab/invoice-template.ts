export const INVOICE_TEMPLATE_IDS = ['invoice-aurora', 'invoice-ledger', 'invoice-nova'] as const;

export type InvoiceTemplateId = (typeof INVOICE_TEMPLATE_IDS)[number];

export function isInvoiceTemplate(id: string): id is InvoiceTemplateId {
  return INVOICE_TEMPLATE_IDS.includes(id as InvoiceTemplateId);
}

export function invoiceTotals(form: Record<string, string>) {
  const quantity = Math.max(0, Number(form.invoiceQuantity) || 0);
  const unitPrice = Math.max(0, Number(form.invoiceUnitPrice) || 0);
  const taxRate = Math.max(0, Number(form.invoiceTaxRate) || 0);
  const subtotal = quantity * unitPrice;
  const tax = subtotal * (taxRate / 100);
  return { quantity, unitPrice, taxRate, subtotal, tax, total: subtotal + tax };
}

export function invoiceMoney(value: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.trim().toUpperCase() || 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

const palettes: Record<InvoiceTemplateId, { ink: string; muted: string; accent: string; pale: string }> = {
  'invoice-aurora': { ink: '#172033', muted: '#697386', accent: '#5b4ff7', pale: '#f1efff' },
  'invoice-ledger': { ink: '#171717', muted: '#6b7280', accent: '#171717', pale: '#f3f4f6' },
  'invoice-nova': { ink: '#12372a', muted: '#64746d', accent: '#087f5b', pale: '#e8f7f1' },
};

function wrappedLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

async function loadLogo(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function drawAuroraInvoice(
  canvas: HTMLCanvasElement,
  form: Record<string, string>,
  logoUrl: string,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');
  canvas.width = 900;
  ctx.fillStyle = '#f3f4f4';
  ctx.fillRect(0, 0, 900, 1400);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 900, 1400);
  let loadedLogo: HTMLImageElement | null = null;
  if (logoUrl) {
    try { loadedLogo = await loadLogo(logoUrl); } catch { /* Keep the Aurora mark fallback. */ }
  }
  if (loadedLogo) {
    ctx.drawImage(loadedLogo, 367, 42, 76, 76);
  } else {
    ctx.fillStyle = '#159447';
    ctx.font = '800 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('A', 405, 83);
    ctx.fillStyle = '#159447';
    ctx.font = '700 28px Arial';
    ctx.fillText(form.invoiceBusiness || 'Aurora Invoice', 450, 137);
  }
  ctx.textAlign = 'left';
  const rows: Array<[string, string]> = [
    ['Payment date', form.auroraPaymentDate || 'Demo date'],
    ['Bank name', form.auroraBankName || 'Sample bank'],
    ['Account number', form.auroraAccountNumber || '0000000000'],
    ['Your reference', form.auroraYourReference || 'FLASH DEMO'],
    ["Recipient's reference", form.auroraRecipientReference || 'Sample recipient'],
    ['Transaction number', form.auroraTransactionNumber || 'SAMPLE-TRANSACTION-ID'],
  ];
  let y = 205;
  rows.forEach(([label, value]) => {
    ctx.fillStyle = '#a0a4a8';
    ctx.font = '24px Arial';
    ctx.fillText(label, 105, y);
    ctx.fillStyle = '#202326';
    ctx.font = '700 28px Arial';
    const lines = wrappedLines(ctx, value, 690).slice(0, 2);
    lines.forEach((line, index) => ctx.fillText(line, 105, y + 42 + index * 34));
    y += label === 'Transaction number' ? 142 : 112;
  });
  ctx.fillStyle = '#e4efd9';
  ctx.beginPath();
  ctx.roundRect(105, 960, 690, 92, 9);
  ctx.fill();
  ctx.fillStyle = '#4e5a4b';
  ctx.beginPath();
  ctx.arc(136, 1006, 18, 0, Math.PI * 2);
  ctx.strokeStyle = '#64705d';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#4e5a4b';
  ctx.font = '700 22px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('i', 136, 1014);
  ctx.textAlign = 'left';
  ctx.font = '24px Arial';
  wrappedLines(ctx, form.auroraNotice || 'You can share your proof of payment from payment history.', 600).slice(0, 2).forEach((line, index) => ctx.fillText(line, 175, 996 + index * 30));
  ctx.fillStyle = '#159447';
  ctx.beginPath(); ctx.roundRect(105, 1085, 690, 74, 8); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '700 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(form.auroraFinishLabel || 'Finish', 450, 1132);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#159447';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(105, 1180, 690, 74, 8); ctx.stroke();
  ctx.fillStyle = '#159447';
  ctx.fillText(form.auroraNewPaymentLabel || 'New payment', 450, 1227);
}
export async function drawInvoice(
  canvas: HTMLCanvasElement,
  id: InvoiceTemplateId,
  form: Record<string, string>,
  logoUrl: string,
) {
  if (id === 'invoice-aurora') {
    await drawAuroraInvoice(canvas, form, logoUrl);
    return;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');
  const palette = palettes[id];
  const totals = invoiceTotals(form);
  const money = (value: number) => invoiceMoney(value, form.invoiceCurrency);
  canvas.width = 900;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 900, 1200);
  ctx.fillStyle = palette.accent;
  ctx.fillRect(0, 0, id === 'invoice-ledger' ? 18 : 900, id === 'invoice-ledger' ? 1200 : 16);

  if (logoUrl) {
    try {
      const logo = await loadLogo(logoUrl);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(66, 68, 92, 92, 20);
      ctx.clip();
      ctx.drawImage(logo, 66, 68, 92, 92);
      ctx.restore();
    } catch {
      // Keep the export useful if an uploaded image is no longer available.
    }
  } else {
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.roundRect(66, 68, 92, 92, id === 'invoice-ledger' ? 8 : 24);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 34px Arial';
    ctx.fillText((form.invoiceBusiness || 'NV').slice(0, 2).toUpperCase(), 112, 116);
  }

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = palette.ink;
  ctx.font = '700 29px Arial';
  ctx.fillText(form.invoiceBusiness || 'Nevora Studio', 180, 105, 350);
  ctx.fillStyle = palette.muted;
  ctx.font = '18px Arial';
  ctx.fillText(form.invoiceEmail || 'hello@example.com', 180, 137, 350);
  ctx.textAlign = 'right';
  ctx.fillStyle = palette.ink;
  ctx.font = '800 48px Arial';
  ctx.fillText('INVOICE', 834, 111);
  ctx.fillStyle = palette.muted;
  ctx.font = '18px Arial';
  ctx.fillText(`#${form.invoiceNumber || 'INV-001'}`, 834, 145);

  ctx.textAlign = 'left';
  ctx.fillStyle = palette.pale;
  ctx.beginPath();
  ctx.roundRect(66, 220, 768, 160, 22);
  ctx.fill();
  ctx.fillStyle = palette.muted;
  ctx.font = '700 14px Arial';
  ctx.fillText('BILL TO', 94, 258);
  ctx.fillText('ISSUED', 590, 258);
  ctx.fillText('DUE', 590, 328);
  ctx.fillStyle = palette.ink;
  ctx.font = '700 25px Arial';
  ctx.fillText(form.invoiceClient || 'Sample Client', 94, 296, 420);
  ctx.font = '18px Arial';
  ctx.fillText(form.invoiceClientEmail || 'client@example.com', 94, 329, 420);
  ctx.fillText(form.invoiceIssueDate || 'September 7, 2026', 590, 286, 220);
  ctx.fillText(form.invoiceDueDate || 'September 21, 2026', 590, 356, 220);

  ctx.fillStyle = palette.accent;
  ctx.fillRect(66, 436, 768, 52);
  ctx.fillStyle = '#fff';
  ctx.font = '700 15px Arial';
  ctx.fillText('DESCRIPTION', 88, 469);
  ctx.textAlign = 'center';
  ctx.fillText('QTY', 568, 469);
  ctx.fillText('RATE', 680, 469);
  ctx.textAlign = 'right';
  ctx.fillText('AMOUNT', 812, 469);
  ctx.fillStyle = '#f8f9fb';
  ctx.fillRect(66, 488, 768, 116);
  ctx.fillStyle = palette.ink;
  ctx.textAlign = 'left';
  ctx.font = '700 20px Arial';
  wrappedLines(ctx, form.invoiceDescription || 'Professional services', 400).slice(0, 2).forEach((line, index) => {
    ctx.fillText(line, 88, 532 + index * 27);
  });
  ctx.textAlign = 'center';
  ctx.font = '18px Arial';
  ctx.fillText(String(totals.quantity), 568, 542);
  ctx.fillText(money(totals.unitPrice), 680, 542);
  ctx.textAlign = 'right';
  ctx.font = '700 19px Arial';
  ctx.fillText(money(totals.subtotal), 812, 542);

  const summary = [
    ['Subtotal', money(totals.subtotal)],
    [`Tax (${totals.taxRate}%)`, money(totals.tax)],
  ];
  ctx.font = '18px Arial';
  summary.forEach(([label, value], index) => {
    const y = 690 + index * 49;
    ctx.fillStyle = palette.muted;
    ctx.textAlign = 'left';
    ctx.fillText(label, 540, y);
    ctx.fillStyle = palette.ink;
    ctx.textAlign = 'right';
    ctx.fillText(value, 834, y);
  });
  ctx.strokeStyle = '#dfe2e8';
  ctx.beginPath();
  ctx.moveTo(540, 778);
  ctx.lineTo(834, 778);
  ctx.stroke();
  ctx.fillStyle = palette.ink;
  ctx.textAlign = 'left';
  ctx.font = '800 24px Arial';
  ctx.fillText('Total due', 540, 830);
  ctx.textAlign = 'right';
  ctx.fillStyle = palette.accent;
  ctx.font = '800 31px Arial';
  ctx.fillText(money(totals.total), 834, 830);

  ctx.textAlign = 'left';
  ctx.fillStyle = palette.muted;
  ctx.font = '700 14px Arial';
  ctx.fillText('NOTES', 66, 902);
  ctx.fillStyle = palette.ink;
  ctx.font = '18px Arial';
  wrappedLines(ctx, form.invoiceNotes || 'Thank you for your business.', 690).slice(0, 3).forEach((line, index) => {
    ctx.fillText(line, 66, 938 + index * 28);
  });
  ctx.fillStyle = palette.pale;
  ctx.beginPath();
  ctx.roundRect(66, 1065, 768, 66, 14);
  ctx.fill();
  ctx.fillStyle = palette.accent;
  ctx.textAlign = 'center';
  ctx.font = '800 18px Arial';
  ctx.fillText('SAMPLE INVOICE • NOT A REAL TRANSACTION', 450, 1106);
}
