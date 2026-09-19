import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const component = readFileSync(new URL('../src/components/receiptlab/ReceiptLab.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/components/receiptlab/receiptlab.css', import.meta.url), 'utf8');

test('Coinbase wallet receipt matches the editable reference structure', () => {
  assert.ok(component.includes("field('blueAddress', 'Recipient wallet address')"));
  assert.ok(component.includes("field('blueFeeCrypto', 'Fee in crypto')"));
  assert.ok(component.includes("field('blueConfirmed', 'Confirmation date')"));
  assert.ok(component.includes('className="coinbase-wallet-screen"'));
  assert.ok(component.includes('className="coinbase-wallet-icon"'));
  assert.match(styles, /\.receipt\.blue\s*\{[\s\S]*?aspect-ratio:\s*600\s*\/\s*1159/);
  assert.match(styles, /\.coinbase-details\s*\{[\s\S]*?top:\s*68\.5%/);
});

test('Coinbase previews and exports always include the sample notice', () => {
  assert.ok(component.includes("template.id === 'black' || template.id === 'blue'"));
  assert.match(
    component,
    /className="watermark safety-footer">\s*DEMO • NOT A REAL TRANSACTION/,
  );
  assert.match(component, /template\.id === 'blue'\s*\? 1740/);
});
