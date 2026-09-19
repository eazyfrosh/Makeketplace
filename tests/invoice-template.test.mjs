import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../src/components/receiptlab/invoice-template.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const invoice = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('recognizes only the three invoice layouts', () => {
  assert.equal(invoice.isInvoiceTemplate('invoice-aurora'), true);
  assert.equal(invoice.isInvoiceTemplate('invoice-ledger'), true);
  assert.equal(invoice.isInvoiceTemplate('invoice-nova'), true);
  assert.equal(invoice.isInvoiceTemplate('blue'), false);
});

test('calculates subtotal, tax, and total from editable values', () => {
  assert.deepEqual(
    invoice.invoiceTotals({ invoiceQuantity: '3', invoiceUnitPrice: '125.50', invoiceTaxRate: '8' }),
    { quantity: 3, unitPrice: 125.5, taxRate: 8, subtotal: 376.5, tax: 30.12, total: 406.62 },
  );
});

test('invalid negative values cannot produce a negative invoice', () => {
  assert.deepEqual(
    invoice.invoiceTotals({ invoiceQuantity: '-2', invoiceUnitPrice: 'oops', invoiceTaxRate: '-4' }),
    { quantity: 0, unitPrice: 0, taxRate: 0, subtotal: 0, tax: 0, total: 0 },
  );
});

test('Aurora export uses the blue corporate layout and keeps the sample notice', async () => {
  const text = [];
  const context = {
    fillText(value) { text.push(String(value)); },
    measureText(value) { return { width: String(value).length * 9 }; },
    fillRect() {}, beginPath() {}, roundRect() {}, fill() {}, save() {}, clip() {},
    drawImage() {}, restore() {}, stroke() {}, moveTo() {}, lineTo() {}, strokeRect() {},
  };
  const canvas = { width: 900, height: 1260, getContext: () => context };
  await invoice.drawInvoice(canvas, 'invoice-aurora', {
    invoiceBusiness: 'Sample Studio',
    invoiceDescription: 'Design service',
    invoiceQuantity: '2',
    invoiceUnitPrice: '125',
    invoiceTaxRate: '10',
    invoiceCurrency: 'USD',
    invoiceSigner: 'Jordan Sample',
  }, '');
  assert.ok(text.includes('INVOICE'));
  assert.ok(text.includes('Jordan Sample'));
  assert.ok(text.includes('LOCATION'));
  assert.ok(text.includes('PHONE'));
  assert.ok(text.includes('EMAIL'));
  assert.ok(text.includes('SAMPLE INVOICE • NOT A REAL TRANSACTION'));
  assert.ok(text.includes('$275.00'));
});
