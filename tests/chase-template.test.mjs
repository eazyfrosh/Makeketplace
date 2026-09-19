import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

const component = readFileSync(new URL('../src/components/receiptlab/ReceiptLab.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/components/receiptlab/receiptlab.css', import.meta.url), 'utf8');
const source = readFileSync(new URL('../src/components/receiptlab/chase-template.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { drawChaseReceipt, getChaseStatusPresentation } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('Chase is a complete editable template with a removable sample notice', () => {
  assert.ok(component.includes("id: 'chase'"));
  assert.ok(component.includes("field('chaseRecipient', 'Recipient name')"));
  assert.ok(component.includes("field('chaseTransactionId', 'Transaction ID')"));
  assert.ok(component.includes("field('chaseFee', 'Fee')"));
  assert.ok(component.includes('<option value="Successful">Successful</option>'));
  assert.ok(component.includes('<option value="Cancelled">Cancelled</option>'));
  assert.ok(component.includes('<ChaseReceiptPreview form={form} />'));
  assert.ok(component.includes('drawChaseReceipt(c, form)'));
  assert.ok(component.includes("template.id === 'okx' || isInvoiceTemplate(template.id)"));
  assert.match(styles, /\.receipt\.chase\s*\{[\s\S]*?aspect-ratio:\s*38\s*\/\s*75/);
});

test('Chase status controls green, yellow, and red receipt states', () => {
  assert.equal(getChaseStatusPresentation('Successful').key, 'successful');
  assert.equal(getChaseStatusPresentation('Pending').key, 'pending');
  assert.equal(getChaseStatusPresentation('Cancelled').key, 'cancelled');
  assert.equal(getChaseStatusPresentation('Successful').border, '#22a06b');
  assert.equal(getChaseStatusPresentation('Cancelled').border, '#e5484d');
  assert.match(styles, /\.chase-status-successful[\s\S]*?#22a06b/);
  assert.match(styles, /\.chase-status-cancelled[\s\S]*?#e5484d/);
});

test('Chase export uses the editable values without overflowing the canvas', () => {
  const text = [];
  const ctx = {
    fillText(value, x, y) { text.push({ value, x, y }); },
    measureText(value) { return { width: value.length * 15 }; },
    fillRect() {}, beginPath() {}, roundRect() {}, fill() {}, stroke() {},
    arc() {}, save() {}, translate() {}, rotate() {}, restore() {}, moveTo() {}, lineTo() {},
  };
  const canvas = { getContext: () => ctx };
  drawChaseReceipt(canvas, {
    chaseAmount: '$125.00',
    chaseRecipient: 'Sample Recipient',
    chaseTransactionId: 'SAMPLE-123',
  });
  assert.ok(text.some((entry) => entry.value === '$125.00'));
  assert.ok(text.some((entry) => entry.value === 'Sample Recipient'));
  assert.ok(text.some((entry) => entry.value === 'SAMPLE-123'));
  assert.ok(text.every((entry) => entry.y >= 0 && entry.y < 1776));
});

test('Chase export applies the selected status wording', () => {
  const text = [];
  const ctx = {
    fillText(value) { text.push(value); }, measureText(value) { return { width: value.length * 15 }; },
    fillRect() {}, beginPath() {}, roundRect() {}, fill() {}, stroke() {}, arc() {},
    save() {}, translate() {}, rotate() {}, restore() {}, moveTo() {}, lineTo() {},
  };
  drawChaseReceipt({ getContext: () => ctx }, { chaseStatus: 'Successful', chaseStatusTitle: '', chaseStatusMessage: '' });
  assert.ok(text.includes('Payment successful'));
  assert.ok(text.some((value) => String(value).includes('Successful')));
});
