import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

async function importTs(path) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}

const { WalletLedgerModel, applyBalanceChange } = await importTs('../src/lib/wallet/ledger-core.ts');
const paystackSource = readFileSync(new URL('../src/lib/wallet/paystack.ts', import.meta.url), 'utf8')
  .replace('import crypto from "node:crypto";', 'import crypto from "node:crypto";');
const { outputText: paystackJs } = ts.transpileModule(paystackSource, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const paystack = await import(`data:text/javascript;base64,${Buffer.from(paystackJs).toString('base64')}`);

test('successful deposit credits integer minor units', () => { const ledger = new WalletLedgerModel(); assert.equal(ledger.post('deposit-1', 5_000_000, 'credit'), true); assert.equal(ledger.balanceMinor, 5_000_000); });
test('duplicate webhook reference credits exactly once', () => { const ledger = new WalletLedgerModel(); ledger.post('provider-77', 5_000_000, 'credit'); assert.equal(ledger.post('provider-77', 5_000_000, 'credit'), false); assert.equal(ledger.balanceMinor, 5_000_000); });
test('concurrent-sized purchases cannot overdraw a wallet', () => { const ledger = new WalletLedgerModel(2_000_000); ledger.post('purchase-a', 1_500_000, 'debit'); assert.throws(() => ledger.post('purchase-b', 1_500_000, 'debit'), /INSUFFICIENT_BALANCE/); assert.equal(ledger.balanceMinor, 500_000); });
test('refund is a separate idempotent credit', () => { const ledger = new WalletLedgerModel(2_000_000); ledger.post('purchase', 1_850_000, 'debit'); ledger.post('refund_purchase', 1_850_000, 'credit'); assert.equal(ledger.post('refund_purchase', 1_850_000, 'credit'), false); assert.equal(ledger.balanceMinor, 2_000_000); });
test('amounts must be safe integer minor units', () => { assert.throws(() => applyBalanceChange(0, 10.5, 'credit'), /integer/); assert.throws(() => applyBalanceChange(0, -1, 'credit'), /non-negative/); });
test('valid Paystack HMAC is accepted and forged signature rejected', () => { const body = '{"event":"charge.success"}'; const secret = 'test-secret'; const valid = crypto.createHmac('sha512', secret).update(body).digest('hex'); assert.equal(paystack.verifyPaystackSignature(body, valid, secret), true); assert.equal(paystack.verifyPaystackSignature(body, '0'.repeat(128), secret), false); });
test('wallet Firestore rules deny all direct client writes', () => { const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'); for (const collection of ['wallets','wallet_transactions','wallet_funding_intents','wallet_audit_logs']) assert.match(rules, new RegExp(`match /${collection}\\/\\{[^}]+\\} \\{ allow read, write: if false; \\}`)); });
test('production mutations use Firestore transactions and reject negative balances', () => { const store = readFileSync(new URL('../src/lib/wallet/store.ts', import.meta.url), 'utf8'); assert.match(store, /runTransaction/g); assert.match(store, /INSUFFICIENT_BALANCE/); assert.match(store, /tx\.create\(ledgerRef/); });
test('webhook validates signature, verified amount, currency and identity metadata', () => { const route = readFileSync(new URL('../src/app/api/paystack/webhook/route.ts', import.meta.url), 'utf8'); for (const marker of ['verifyPaystackSignature','verifyPaystackTransaction','verified.amount !== intent.amountMinor','verified.currency !== intent.currency','verified.metadata?.userId !== intent.userId']) assert.ok(route.includes(marker), marker); });
test('admin adjustments require server-side admin authorization and a reason', () => { const route = readFileSync(new URL('../src/app/api/wallet/admin/adjustments/route.ts', import.meta.url), 'utf8'); assert.ok(route.includes('verifyAdminCaller')); assert.ok(route.includes('!reason')); });
test('domain purchase never accepts a client supplied price and reverses failure', () => { const route = readFileSync(new URL('../src/app/api/domains/checkout/wallet/route.ts', import.meta.url), 'utf8'); assert.ok(route.includes('calculateDomainPrice(getTld(domain))')); assert.ok(!route.includes('body.amount')); assert.ok(route.includes('type: "reversal"')); });
