import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const component = readFileSync(new URL('../src/components/receiptlab/ReceiptLab.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/components/receiptlab/receiptlab.css', import.meta.url), 'utf8');

test('Zelle preview uses one structured layout instead of screenshot text overlays', () => {
  const previewStart = component.indexOf('<article className="zelle-screen">');
  const previewEnd = component.indexOf("template.id === 'black'", previewStart);
  const preview = component.slice(previewStart, previewEnd);

  assert.ok(previewStart > -1);
  assert.ok(preview.includes('zelle-content'));
  assert.ok(preview.includes('zelle-battery-percent'));
  assert.ok(preview.includes('33%'));
  assert.ok(preview.includes('zelle-battery'));
  assert.ok(preview.includes('zelle-recipient-mark'));
  assert.ok(preview.includes('zelle-siri-action'));
  assert.ok(!preview.includes('indigo-reference.jpg'));
});

test('Zelle layout stays centered and permanently identifies sample output', () => {
  assert.match(styles, /\.zelle-screen\s*\{[\s\S]*?display:\s*flex;/);
  assert.match(styles, /\.zelle-content\s*\{[\s\S]*?align-items:\s*center;/);
  assert.match(styles, /\.zelle-battery\s*\{/);
  assert.ok(component.includes('SAMPLE ONLY • NOT A REAL TRANSACTION'));
});
