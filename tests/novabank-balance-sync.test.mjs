import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const adjustment = readFileSync(
  new URL("../src/app/api/banking/admin/users/[uid]/adjust-balance/route.ts", import.meta.url),
  "utf8",
);
const selfAdjustment = readFileSync(
  new URL("../src/app/api/banking/account/adjust-balance/route.ts", import.meta.url),
  "utf8",
);
const sync = readFileSync(
  new URL("../src/lib/banking/novabank-sync.ts", import.meta.url),
  "utf8",
);

test("admin balance adjustments synchronize only after the local ledger write", () => {
  const ledgerWrite = adjustment.indexOf("await createTransaction(tx)");
  const externalSync = adjustment.indexOf("await syncUserToNovaBank(uid)");
  assert.ok(ledgerWrite >= 0);
  assert.ok(externalSync > ledgerWrite);
  assert.match(adjustment, /novaBankSynced: sync\.ok/);
});

test("self-service demo adjustments synchronize only after the local ledger write", () => {
  const ledgerWrite = selfAdjustment.indexOf("await createTransaction(tx)");
  const externalSync = selfAdjustment.indexOf("await syncUserToNovaBank(caller.uid)");
  assert.ok(ledgerWrite >= 0);
  assert.ok(externalSync > ledgerWrite);
  assert.match(selfAdjustment, /novaBankSynced: sync\.ok/);
});

test("NovaBank sync derives identity and financial data on the server", () => {
  assert.match(sync, /getBankingProfile\(userId\)/);
  assert.match(sync, /getAccountForUser\(userId\)/);
  assert.match(sync, /getTransactionsForUser\(userId\)/);
  assert.match(sync, /NOVABANK_SSO_SHARED_SECRET/);
  assert.match(sync, /cache: "no-store"/);
});
