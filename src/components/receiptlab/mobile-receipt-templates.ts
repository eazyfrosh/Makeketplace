export const MOBILE_SAMPLE_NOTICE = 'SAMPLE ONLY • NOT A REAL TRANSACTION';

type ReceiptForm = Record<string, string>;

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

function row(ctx: CanvasRenderingContext2D, label: string, value: string, y: number, options: { valueWidth?: number; copy?: boolean } = {}) {
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#8f8f95';
  ctx.font = '32px Arial';
  ctx.fillText(label, 38, y);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#f3f3f5';
  ctx.font = '30px Arial';
  const max = options.valueWidth ?? 500;
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > max) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  lines.slice(0, 3).forEach((entry, index) => ctx.fillText(entry, options.copy ? 825 : 860, y + index * 36));
  if (options.copy) {
    ctx.strokeStyle = '#dadade';
    ctx.lineWidth = 2;
    ctx.strokeRect(842, y + 2, 22, 25);
    ctx.strokeRect(850, y + 10, 22, 25);
  }
}

export function drawGcashReceipt(canvas: HTMLCanvasElement, form: ReceiptForm) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#0964e8';
  ctx.fillRect(0, 0, 900, 1947);
  ctx.fillStyle = '#fff';
  ctx.font = '700 38px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(form.gcashTime || '10:06', 98, 68);
  ctx.textAlign = 'center';
  ctx.font = '600 28px Arial';
  ctx.fillText('Express Send', 450, 174);
  ctx.textAlign = 'right';
  ctx.font = '52px Arial';
  ctx.fillText('×', 858, 182);
  rounded(ctx, 50, 315, 800, 1410, 9, '#fff');
  ctx.fillStyle = '#0964e8';
  ctx.beginPath();
  ctx.arc(450, 315, 49, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(430, 314); ctx.lineTo(446, 330); ctx.lineTo(474, 299); ctx.stroke();
  ctx.fillStyle = '#0d3d92';
  ctx.textAlign = 'center';
  ctx.font = '700 44px Arial';
  ctx.fillText(form.gcashRecipient || 'HA•••D D.', 450, 430);
  rounded(ctx, 285, 454, 330, 56, 28, '#f1f4fb');
  ctx.font = '700 38px Arial';
  ctx.fillText(form.gcashPhone || '+63 915 750 3350', 450, 494);
  ctx.fillStyle = '#777b84';
  ctx.font = '29px Arial';
  ctx.fillText('Sent via GCash', 450, 568);
  ctx.strokeStyle = '#e1e2e6';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(82, 650); ctx.lineTo(818, 650); ctx.stroke();
  ctx.fillStyle = '#0d315f';
  ctx.font = '700 32px Arial';
  ctx.textAlign = 'left'; ctx.fillText('Amount', 82, 740);
  ctx.textAlign = 'right'; ctx.fillText(form.gcashAmount || '3,000.00', 818, 740);
  ctx.beginPath(); ctx.moveTo(82, 805); ctx.lineTo(818, 805); ctx.stroke();
  ctx.font = '700 32px Arial';
  ctx.textAlign = 'left'; ctx.fillText('Total Amount Sent', 82, 902);
  ctx.textAlign = 'right'; ctx.font = '800 48px Arial'; ctx.fillText(form.gcashTotal || '₱3000.00', 818, 912);
  ctx.fillStyle = '#f5f6fb'; ctx.fillRect(50, 970, 800, 755);
  ctx.fillStyle = '#60718d'; ctx.font = '700 25px Arial'; ctx.textAlign = 'left'; ctx.fillText('Ref No.', 82, 1038);
  ctx.fillStyle = '#12345f'; ctx.fillText(form.gcashReference || '9040035185241', 182, 1038);
  ctx.textAlign = 'right'; ctx.fillText(form.gcashDate || 'Apr 22, 2026 10:06 AM', 818, 1038);
  rounded(ctx, 82, 1414, 736, 190, 8, '#94e5c6');
  ctx.fillStyle = '#087e55'; ctx.textAlign = 'left'; ctx.font = '700 32px Arial'; ctx.fillText('♧  279g', 116, 1480);
  ctx.font = '24px Arial'; ctx.fillText('(gCO₂e)', 270, 1480);
  ctx.font = '23px Arial'; ctx.fillText('By going digital, you reduce your carbon footprint from', 116, 1540);
  ctx.fillText('transportation, paper, and plastic.', 116, 1578);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '700 31px Arial';
  ctx.fillText('⇩  Download', 245, 1865); ctx.fillText('⌯  Share Receipt', 690, 1865);
}

export function drawOkxReceipt(canvas: HTMLCanvasElement, form: ReceiptForm) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#101010';
  ctx.fillRect(0, 0, 900, 1800);
  ctx.fillStyle = '#f7f7f8';
  ctx.font = '700 40px Arial'; ctx.textAlign = 'left'; ctx.fillText('‹', 38, 105);
  ctx.textAlign = 'center'; ctx.fillText('Withdrawal details', 450, 104);
  ctx.strokeStyle = '#292929'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 138); ctx.lineTo(900, 138); ctx.stroke();
  ctx.fillStyle = '#96969b'; ctx.font = '28px Arial'; ctx.fillText('Amount', 450, 218);
  ctx.fillStyle = '#f7f7f8'; ctx.font = '700 48px Arial'; ctx.fillText(form.okxAmount || '- 10.316428 USDT', 450, 284);
  ctx.fillStyle = '#00c596'; ctx.font = '31px Arial'; ctx.fillText(`✓  ${form.okxStatus || 'Sent'}`, 450, 344);
  rounded(ctx, 36, 392, 828, 126, 10, '#1b1b1b');
  ctx.fillStyle = '#f5f5f6'; ctx.textAlign = 'left'; ctx.font = '700 28px Arial'; ctx.fillText('◎', 72, 448);
  ctx.fillText('Crypto transferred out of OKX', 155, 437);
  ctx.fillStyle = '#3f7bf6'; ctx.font = '25px Arial'; ctx.fillText(form.okxHelp || "Why hasn’t my transaction arrived?", 155, 476);
  row(ctx, 'Blockchain', form.okxBlockchain || 'TRC20', 572);
  row(ctx, 'Type', form.okxType || 'On-chain withdrawal', 650);
  row(ctx, 'Status', form.okxStatus || 'Sent', 728);
  row(ctx, 'Address/domain', form.okxAddress || 'THujD8W62Jmhd5WCrlUEhG75K4UzY18tYuX', 806, { valueWidth: 510, copy: true });
  row(ctx, 'Transaction ID  ⓘ', form.okxTransaction || 'fdf84500a1f28e4c0ff88ee10de23df4e7c519379c91fd18c908cdc9789065df', 926, { valueWidth: 510, copy: true });
  row(ctx, 'Fee', form.okxFee || '1 USDT', 1080);
  row(ctx, 'Time', form.okxTime || '02/09/2024, 19:23:29', 1158);
  row(ctx, 'Reference no.', form.okxReference || '151708673', 1236, { copy: true });
  rounded(ctx, 36, 1630, 828, 110, 55, '#fff');
  ctx.fillStyle = '#111'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 34px Arial';
  ctx.fillText(form.okxButton || 'View on blockchain explorer', 450, 1685);
}
