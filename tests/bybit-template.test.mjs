import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/components/receiptlab/bybit-template.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { bybitRows, drawBybitReceipt, BYBIT_SAMPLE_NOTICE } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

function canvasMock() {
  const text = [];
  const ctx = {
    font: '',
    measureText(value) { return { width: value.length * 13 }; },
    fillText(value, x, y) { text.push({ value, x, y }); },
    fillRect() {}, beginPath() {}, arc() {}, fill() {}, stroke() {},
    moveTo() {}, lineTo() {}, roundRect() {},
  };
  const canvas = { width: 0, height: 0, getContext: () => ctx };
  return { canvas, text };
}

test('Bybit rows use the new fields and one shared amount', () => {
  const rows = bybitRows({ blackPayTo: 'receiver@example.com', blackBybitId: '123', blackAmount: '42 USDT' });
  assert.deepEqual(rows.map(r => r.label), ['Receiver', 'Bybit ID', 'Note', 'Payment date', 'Order ID', 'Amount']);
  assert.equal(rows[1].value, '123 (Bybit ID)');
  assert.equal(rows.at(-1).value, '42 USDT');
});

test('exports always contain the sample notice and both amount occurrences', () => {
  const { canvas, text } = canvasMock();
  drawBybitReceipt(canvas, { blackAmount: '42 USDT' });
  assert.equal(text.filter(t => t.value === '42 USDT').length, 2);
  assert.equal(text.at(-1).value, BYBIT_SAMPLE_NOTICE);
  assert.ok(text.every(t => t.y >= 0 && t.y < canvas.height));
});

test('long details grow the card and move actions down without truncation', () => {
  const short = canvasMock();
  const long = canvasMock();
  drawBybitReceipt(short.canvas, {});
  const memo = 'Long sample payment note '.repeat(20);
  drawBybitReceipt(long.canvas, { blackMemo: memo });
  assert.ok(long.canvas.height > short.canvas.height);
  assert.ok(long.text.every(t => t.y < long.canvas.height));
  assert.equal(long.text.at(-1).value, BYBIT_SAMPLE_NOTICE);
});
