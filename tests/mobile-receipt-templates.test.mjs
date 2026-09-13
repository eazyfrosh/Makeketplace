import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const component = readFileSync(new URL('../src/components/receiptlab/ReceiptLab.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/components/receiptlab/receiptlab.css', import.meta.url), 'utf8');
const exportsSource = readFileSync(new URL('../src/components/receiptlab/mobile-receipt-templates.ts', import.meta.url), 'utf8');

test('Gcash is editable, exported, image-matched, and permanently sample labeled', () => {
  assert.ok(component.includes("id: 'gcash'"));
  assert.ok(component.includes("field('gcashRecipient'"));
  assert.ok(component.includes('<GcashReceiptPreview form={form} />'));
  assert.ok(component.includes('drawGcashReceipt(c, form)'));
  assert.match(styles, /\.receipt\.gcash\s*\{[\s\S]*?aspect-ratio:\s*947\s*\/\s*2048/);
  assert.ok(exportsSource.includes('SAMPLE ONLY • NOT A REAL TRANSACTION'));
});

test('OKX is editable, exported, image-matched, and permanently sample labeled', () => {
  assert.ok(component.includes("id: 'okx'"));
  assert.ok(component.includes("field('okxTransaction'"));
  assert.ok(component.includes('<OkxReceiptPreview form={form} />'));
  assert.ok(component.includes('drawOkxReceipt(c, form)'));
  assert.match(styles, /\.receipt\.okx\s*\{[\s\S]*?aspect-ratio:\s*1\s*\/\s*2/);
  assert.ok(component.includes("template.id === 'gcash' || template.id === 'okx'"));
});
