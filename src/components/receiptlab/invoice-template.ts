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
  const blue = '#2563eb';
  const navy = '#14213d';
  const ink = '#14213d';
  const muted = '#64748b';
  const totals = invoiceTotals(form);
  const money = (value: number) => invoiceMoney(value, form.invoiceCurrency);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 900, 1260);
  ctx.fillStyle = navy;
  ctx.fillRect(0, 0, 900, 12);
  ctx.fillStyle = navy;
  ctx.font = '800 50px Arial';
  ctx.textAlign = 'right';
  ctx.fillText('INVOICE', 830, 91);
  ctx.fillStyle = blue;
  ctx.fillRect(766, 107, 64, 6);

  let loadedLogo: HTMLImageElement | null = null;
  if (logoUrl) {
    try {
      loadedLogo = await loadLogo(logoUrl);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(70, 53, 74, 74, 14);
      ctx.clip();
      ctx.drawImage(loadedLogo, 70, 53, 74, 74);
      ctx.restore();
    } catch {
      // The text mark below remains available when an upload cannot be decoded.
    }
  }
  if (!logoUrl) {
    ctx.fillStyle = navy;
    ctx.beginPath();
    ctx.roundRect(70, 53, 74, 74, 17);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '800 27px Arial';
    ctx.fillText('NV', 107, 99);
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = ink;
  ctx.font = '800 27px Arial';
  ctx.fillText(form.invoiceBusiness || 'Nevora Studio', 154, 77, 360);

  ctx.fillStyle = '#f6f8fc';
  ctx.beginPath();
  ctx.roundRect(70, 155, 760, 145, 16);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(70, 155, 760, 145);

  ctx.fillStyle = ink;
  ctx.font = '800 16px Arial';
  ctx.fillStyle = blue;
  ctx.fillText('BILL TO', 95, 187);
  ctx.fillStyle = ink;
  ctx.font = '800 25px Arial';
  ctx.fillText(form.invoiceClient || 'Sample Client', 95, 221, 350);
  ctx.fillStyle = muted;
  ctx.font = '15px Arial';
  ctx.fillText(form.invoiceAddress || '223 Sample Street, New York, NY', 95, 247, 350);
  ctx.fillText(`P: ${form.invoicePhone || '+1 (000) 123-4567'}`, 95, 268, 350);
  ctx.fillText(`M: ${form.invoiceClientEmail || 'client@example.com'}`, 95, 289, 350);
  const meta = [
    ['Invoice', `#${form.invoiceNumber || 'INV-001'}`],
    ['Issued', form.invoiceIssueDate || 'Sample date'],
    ['Due', form.invoiceDueDate || 'Sample date'],
  ];
  meta.forEach(([label, value], index) => {
    const y = 207 + index * 30;
    ctx.fillStyle = ink;
    ctx.font = '700 17px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(label, 575, y);
    ctx.textAlign = 'right';
    ctx.fillText(value, 836, y, 155);
  });

  const columns = [70, 122, 525, 640, 731, 836];
  const tableTop = 360;
  ctx.fillStyle = navy;
  ctx.fillRect(70, tableTop, 766, 49);
  ctx.fillStyle = '#fff';
  ctx.font = '800 15px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('SL', 96, 391);
  ctx.textAlign = 'left';
  ctx.fillText('ITEM DESCRIPTION', 142, 391);
  ctx.textAlign = 'center';
  ctx.fillText('PRICE', 582, 391);
  ctx.fillText('QTY', 686, 391);
  ctx.fillText('TOTAL', 784, 391);
  for (let row = 0; row < 4; row += 1) {
    const y = tableTop + 49 + row * 78;
    ctx.fillStyle = row % 2 ? '#ffffff' : '#f8fafc';
    ctx.fillRect(70, y, 766, 78);
    ctx.strokeStyle = '#e3e8ef';
    ctx.beginPath();
    ctx.moveTo(70, y + 78);
    ctx.lineTo(836, y + 78);
    ctx.stroke();
    if (row === 0) {
      ctx.fillStyle = ink;
      ctx.font = '700 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('1', 96, y + 44);
      ctx.textAlign = 'left';
      wrappedLines(ctx, form.invoiceDescription || 'Professional services', 350).slice(0, 2).forEach((line, index) => {
        ctx.fillText(line, 142, y + 34 + index * 22);
      });
      ctx.textAlign = 'center';
      ctx.fillText(money(totals.unitPrice), 582, y + 44, 100);
      ctx.fillText(String(totals.quantity), 686, y + 44);
      ctx.fillText(money(totals.subtotal), 784, y + 44, 95);
    }
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = '#f3f6fb';
  ctx.beginPath();
  ctx.roundRect(70, 765, 390, 105, 12);
  ctx.fill();
  ctx.fillStyle = blue;
  ctx.fillRect(70, 765, 6, 105);
  ctx.fillStyle = ink;
  ctx.font = '800 19px Arial';
  ctx.fillText('PAYMENT DETAILS', 94, 796);
  ctx.fillStyle = muted;
  ctx.font = '16px Arial';
  ctx.fillText(form.invoicePaymentInfo || 'PayPal: billing@example.com', 94, 826, 340);
  ctx.fillText(`Account: ${form.invoiceEmail || 'hello@example.com'}`, 94, 852, 340);
  const summary = [
    ['SUBTOTAL', money(totals.subtotal)],
    [`TAX ${totals.taxRate}%`, money(totals.tax)],
    ['GRAND TOTAL', money(totals.total)],
  ];
  summary.forEach(([label, value], index) => {
    const y = 792 + index * 47;
    ctx.fillStyle = ink;
    ctx.font = index === 2 ? '800 19px Arial' : '700 17px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(label, 565, y);
    ctx.textAlign = 'right';
    ctx.fillText(value, 836, y);
    if (index === 2) {
      ctx.fillStyle = blue;
      ctx.beginPath();
      ctx.roundRect(550, y - 28, 286, 44, 9);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '800 18px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(label, 565, y);
      ctx.textAlign = 'right';
      ctx.fillText(value, 821, y);
    } else {
      ctx.strokeStyle = '#b7bcc2';
      ctx.beginPath();
      ctx.moveTo(565, y + 13);
      ctx.lineTo(836, y + 13);
      ctx.stroke();
    }
  });

  ctx.textAlign = 'left';
  ctx.fillStyle = ink;
  ctx.font = '800 19px Arial';
  ctx.fillText('TERMS & CONDITIONS', 70, 954);
  ctx.fillStyle = muted;
  ctx.font = '16px Arial';
  wrappedLines(ctx, form.invoiceNotes || 'Thank you for your business.', 490).slice(0, 3).forEach((line, index) => {
    ctx.fillText(line, 70, 986 + index * 24);
  });

  ctx.fillStyle = ink;
  ctx.font = '700 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(form.invoiceSigner || 'Alex Morgan', 687, 990, 245);
  ctx.strokeStyle = '#171717';
  ctx.beginPath();
  ctx.moveTo(565, 1003);
  ctx.lineTo(812, 1003);
  ctx.stroke();
  ctx.fillStyle = ink;
  ctx.font = '800 14px Arial';
  ctx.fillText((form.invoiceSignerTitle || 'Creative Director').toUpperCase(), 687, 1027, 245);

  ctx.fillStyle = navy;
  ctx.beginPath();
  ctx.roundRect(70, 1080, 42, 42, 10);
  ctx.fill();
  if (loadedLogo) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(70, 1080, 42, 42, 10);
    ctx.clip();
    ctx.drawImage(loadedLogo, 70, 1080, 42, 42);
    ctx.restore();
  } else {
    ctx.fillStyle = '#fff';
    ctx.font = '800 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('NV', 91, 1107);
  }
  const footerBlocks = [
    ['LOCATION', form.invoiceAddress || '223 Sample Street, New York, NY'],
    ['PHONE', form.invoicePhone || '+1 (000) 123-4567'],
    ['EMAIL', form.invoiceEmail || 'hello@example.com'],
  ];
  footerBlocks.forEach(([label, value], index) => {
    const x = 130 + index * 225;
    ctx.strokeStyle = '#8d9298';
    ctx.beginPath();
    ctx.moveTo(x, 1077);
    ctx.lineTo(x, 1127);
    ctx.stroke();
    ctx.fillStyle = blue;
    ctx.font = '800 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 14, 1093);
    ctx.fillStyle = muted;
    ctx.font = '13px Arial';
    wrappedLines(ctx, value, 190).slice(0, 2).forEach((line, lineIndex) => ctx.fillText(line, x + 14, 1112 + lineIndex * 15));
  });
  ctx.fillStyle = '#e8f8ff';
  ctx.fillRect(70, 1162, 766, 34);
  ctx.fillStyle = '#137da5';
  ctx.font = '800 13px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('SAMPLE INVOICE • NOT A REAL TRANSACTION', 453, 1184);
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
