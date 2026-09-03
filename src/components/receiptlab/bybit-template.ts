export const BYBIT_SAMPLE_NOTICE = 'SAMPLE ONLY — NOT A REAL TRANSACTION';

export function bybitRows(form: Record<string, string>) {
  return [
    { label: 'Receiver', value: form.blackPayTo || '(sample@example.com)' },
    { label: 'Bybit ID', value: `${form.blackBybitId || 'SAMPLE-ID'} (Bybit ID)` },
    { label: 'Note', value: form.blackMemo || '--' },
    { label: 'Payment date', value: form.blackTime || 'Demo date' },
    { label: 'Order ID', value: form.blackOrder || 'SAMPLE-ORDER' },
    { label: 'Amount', value: form.blackAmount || '0.00 USDT' },
  ];
}

// Draw the same flow layout used by the preview, without screenshot text beneath it.
export function drawBybitReceipt(canvas: HTMLCanvasElement, form: Record<string, string>) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');
  canvas.width = 900;
  const wrap = (value: string, width: number, font: string) => {
    ctx.font = font;
    const lines: string[] = [];
    let line = '';
    for (const char of value) {
      if (char === '\n' || (line && ctx.measureText(line + char).width > width)) {
        lines.push(line);
        line = char === '\n' ? '' : char;
      } else line += char;
    }
    lines.push(line);
    return lines;
  };
  const rows = bybitRows(form).map((row, index) => {
    const lines = wrap(row.value, row.label === 'Order ID' ? 396 : 426, '600 25px Arial');
    return { ...row, lines, height: Math.max(index < 2 ? 50 : 75, lines.length * 31 + 18) };
  });
  const cardTop = 403;
  const cardHeight = rows.reduce((sum, row) => sum + row.height, 0) + 32;
  const actionsTop = cardTop + cardHeight + 66;
  const noticeTop = actionsTop + 121;
  canvas.height = noticeTop + 48;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#e3f3e9';
  ctx.beginPath();
  ctx.arc(450, 135, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c8e5d4';
  ctx.lineWidth = 9;
  ctx.stroke();
  ctx.strokeStyle = '#31a578';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(428, 137);
  ctx.lineTo(445, 153);
  ctx.lineTo(473, 120);
  ctx.stroke();
  const centered = (value: string, y: number, size: number, maxWidth: number, weight = '600') => {
    ctx.font = `${weight} ${size}px Arial`;
    ctx.fillStyle = '#18181b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(value, 450, y, maxWidth);
  };
  centered(form.blackStatus || 'Success', 245, 34, 720);
  centered(form.blackAmount || '0.00 USDT', 317, 52, 720, '700');
  ctx.fillStyle = '#f5f5f9';
  ctx.beginPath();
  ctx.roundRect(90, cardTop, 720, cardHeight, 17);
  ctx.fill();
  let y = cardTop + 16;
  for (const row of rows) {
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = '24px Arial';
    ctx.fillStyle = '#77777d';
    ctx.fillText(row.label, 115, y + row.height / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#18181b';
    ctx.font = '600 25px Arial';
    const firstY = y + row.height / 2 - (row.lines.length - 1) * 31 / 2;
    row.lines.forEach((line, i) => ctx.fillText(line, row.label === 'Order ID' ? 754 : 785, firstY + i * 31));
    if (row.label === 'Order ID') {
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(769, y + row.height / 2 - 6, 13, 16, 2);
      ctx.roundRect(775, y + row.height / 2 - 12, 13, 16, 2);
      ctx.stroke();
    }
    y += row.height;
  }
  const actions = [
    { x: 90, width: 367, fill: '#f4ad00', text: form.blackShare || 'Download Bybit App' },
    { x: 495, width: 315, fill: '#fff', text: form.blackDone || 'View details' },
  ];
  for (const action of actions) {
    ctx.fillStyle = action.fill;
    ctx.strokeStyle = '#d6d6da';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(action.x, actionsTop, action.width, 76, 13);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#18181b';
    ctx.textAlign = 'center';
    ctx.font = '600 27px Arial';
    ctx.fillText(action.text, action.x + action.width / 2 + (action.x === 90 ? 11 : 0), actionsTop + 38, action.width - 54);
    if (action.x === 90) {
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(113, actionsTop + 28);
      ctx.lineTo(113, actionsTop + 44);
      ctx.moveTo(107, actionsTop + 38);
      ctx.lineTo(113, actionsTop + 44);
      ctx.lineTo(119, actionsTop + 38);
      ctx.moveTo(103, actionsTop + 42);
      ctx.lineTo(103, actionsTop + 49);
      ctx.lineTo(123, actionsTop + 49);
      ctx.lineTo(123, actionsTop + 42);
      ctx.stroke();
    }
  }
  ctx.fillStyle = '#fff3cd';
  ctx.fillRect(0, noticeTop, 900, 48);
  ctx.fillStyle = '#9f1239';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(BYBIT_SAMPLE_NOTICE, 450, noticeTop + 24);
}
