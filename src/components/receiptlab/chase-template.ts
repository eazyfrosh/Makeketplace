export const CHASE_SAMPLE_NOTICE = 'SAMPLE ONLY • NOT A REAL TRANSACTION';

type ReceiptForm = Record<string, string>;

export type ChasePaymentStatus = 'successful' | 'pending' | 'cancelled';

const CHASE_STATUS = {
  successful: {
    key: 'successful',
    label: 'Successful',
    title: 'Payment successful',
    message: 'Your payment has been completed.',
    footer: 'This payment was completed successfully.',
    icon: '✓',
    accent: '#168a52',
    border: '#22a06b',
    background: '#eefbf3',
    badge: '#dcfae6',
  },
  pending: {
    key: 'pending',
    label: 'Pending',
    title: 'Payment pending',
    message: 'Your payment is being processed.',
    footer: 'This payment is pending and will be processed shortly.',
    icon: '◷',
    accent: '#896900',
    border: '#f3c91b',
    background: '#fffdf6',
    badge: '#fff4c2',
  },
  cancelled: {
    key: 'cancelled',
    label: 'Cancelled',
    title: 'Payment cancelled',
    message: 'This payment has been cancelled.',
    footer: 'This payment was cancelled and will not be processed.',
    icon: '×',
    accent: '#b42318',
    border: '#e5484d',
    background: '#fff1f0',
    badge: '#fee4e2',
  },
} as const;

export function getChaseStatusPresentation(value?: string) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'successful' || normalized === 'success' || normalized === 'completed') return CHASE_STATUS.successful;
  if (normalized === 'cancelled' || normalized === 'canceled' || normalized === 'failed') return CHASE_STATUS.cancelled;
  return CHASE_STATUS.pending;
}

function rounded(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke?: string,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function fitText(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  weight = 600,
) {
  let fontSize = size;
  do {
    ctx.font = `${weight} ${fontSize}px Arial`;
    if (ctx.measureText(value).width <= maxWidth) break;
    fontSize -= 1;
  } while (fontSize > 18);
  ctx.fillText(value, x, y);
}

function detailRow(
  ctx: CanvasRenderingContext2D,
  label: string,
  primary: string,
  y: number,
  secondary = '',
) {
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#343943';
  ctx.font = '28px Arial';
  ctx.fillText(label, 55, y);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#10131b';
  fitText(ctx, primary, 845, y, 500, 29, 700);
  if (secondary) {
    ctx.fillStyle = '#454b55';
    fitText(ctx, secondary, 845, y + 39, 500, 25, 400);
  }
  ctx.strokeStyle = '#e4e7eb';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(55, y + 91);
  ctx.lineTo(845, y + 91);
  ctx.stroke();
}

export function drawChaseReceipt(
  canvas: HTMLCanvasElement,
  form: ReceiptForm,
  logo?: HTMLImageElement,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const status = getChaseStatusPresentation(form.chaseStatus);

  ctx.fillStyle = '#fbfcfe';
  ctx.fillRect(0, 0, 900, 1776);
  ctx.fillStyle = '#edf6ff';
  ctx.fillRect(0, 0, 900, 128);
  ctx.fillStyle = '#0d1118';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = '700 47px Arial';
  ctx.fillText('CHASE', 48, 31);
  if (logo) {
    ctx.drawImage(logo, 280, 20, 78, 78);
  } else {
    ctx.fillStyle = '#1787cf';
    ctx.save();
    ctx.translate(325, 59);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-25, -25, 50, 50);
    ctx.fillStyle = '#edf6ff';
    ctx.fillRect(-12, -12, 24, 24);
    ctx.restore();
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = '#343943';
  ctx.font = '24px Arial';
  ctx.fillText('Receipt', 850, 26);
  fitText(ctx, form.chaseReceiptDate || 'Demo date', 850, 59, 250, 25, 500);
  ctx.fillStyle = '#126bc5';
  ctx.fillRect(0, 125, 900, 6);

  ctx.fillStyle = status.border;
  ctx.fillRect(0, 133, 10, 155);
  ctx.fillStyle = status.background;
  ctx.fillRect(10, 133, 890, 155);
  ctx.strokeStyle = status.border;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(89, 207, 31, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = status.accent;
  ctx.font = '30px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(status.icon, 89, 187);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#111722';
  fitText(ctx, form.chaseStatusTitle || status.title, 148, 174, 680, 33, 700);
  ctx.fillStyle = '#414752';
  fitText(ctx, form.chaseStatusMessage || status.message, 148, 221, 680, 27, 400);

  rounded(ctx, 47, 333, 806, 203, 14, '#fbfcff', '#dde1e7');
  ctx.textAlign = 'center';
  ctx.fillStyle = '#353b46';
  ctx.font = '25px Arial';
  ctx.fillText('You sent', 450, 374);
  const amount = form.chaseAmount || '$0.00';
  const currency = form.chaseCurrency || 'USD';
  ctx.fillStyle = '#0a1020';
  ctx.textBaseline = 'middle';
  fitText(ctx, amount, 430, 454, 600, 62, 800);
  const amountWidth = Math.min(ctx.measureText(amount).width, 600);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#404650';
  ctx.font = '27px Arial';
  ctx.fillText(currency, 440 + amountWidth / 2, 454);

  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#11151d';
  ctx.font = '700 33px Arial';
  ctx.fillText('Transaction details', 55, 598);
  ctx.strokeStyle = '#cdd1d7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(55, 649);
  ctx.lineTo(845, 649);
  ctx.stroke();
  detailRow(ctx, 'To', form.chaseRecipient || 'Sample recipient', 689, form.chaseEmail || 'sample@example.com');
  detailRow(ctx, 'Transaction ID', form.chaseTransactionId || 'SAMPLE-ID', 820);
  detailRow(ctx, 'Date', form.chaseDate || 'Demo date', 951, form.chaseTime || 'Demo time');
  detailRow(ctx, 'Payment method', form.chaseMethod || 'Sample balance', 1082);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#343943';
  ctx.font = '28px Arial';
  ctx.fillText('Status', 55, 1213);
  rounded(ctx, 665, 1193, 180, 58, 29, status.badge);
  ctx.textAlign = 'center';
  ctx.fillStyle = status.accent;
  fitText(ctx, `${status.icon}  ${status.label}`, 755, 1207, 150, 25, 600);

  rounded(ctx, 53, 1300, 794, 330, 13, '#eef6ff', '#c8d9e9');
  ctx.textAlign = 'left';
  ctx.fillStyle = '#11151d';
  ctx.font = '700 31px Arial';
  ctx.fillText('Amount breakdown', 94, 1343);
  const breakdown = [
    ['Payment amount', `${amount} ${currency}`],
    ['Fee', `${form.chaseFee || '$0.00'} ${currency}`],
    ['Total', `${form.chaseTotal || '$0.00'} ${currency}`],
  ];
  breakdown.forEach(([label, value], index) => {
    const y = 1417 + index * 78;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#343943';
    ctx.font = `${index === 2 ? 500 : 400} 25px Arial`;
    ctx.fillText(label, 94, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#11151d';
    fitText(ctx, value, 807, y, 470, 25, index === 2 ? 700 : 500);
    if (index === 1) {
      ctx.strokeStyle = '#d0dce8';
      ctx.beginPath();
      ctx.moveTo(94, y + 55);
      ctx.lineTo(807, y + 55);
      ctx.stroke();
    }
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#5b616b';
  ctx.font = '20px Arial';
  ctx.fillText(`▣  ${status.footer}`, 450, 1670);
  ctx.fillText('Thank you for banking with Chase.', 450, 1702);
}
