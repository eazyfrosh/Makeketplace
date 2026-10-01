import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const client = readFileSync(new URL("../src/lib/airline/services/bookings.ts", import.meta.url), "utf8");
const collectionRoute = readFileSync(new URL("../src/app/api/airline/bookings/route.ts", import.meta.url), "utf8");
const itemRoute = readFileSync(new URL("../src/app/api/airline/bookings/[id]/route.ts", import.meta.url), "utf8");
const serverStore = readFileSync(new URL("../src/lib/airline/server-bookings.ts", import.meta.url), "utf8");
const rules = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");

test("trip history uses the authenticated server API and migrates legacy browser bookings", () => {
  assert.match(client, /\/api\/airline\/bookings/);
  assert.match(client, /mode: "migration"/);
  assert.match(client, /getUserBookings/);
  assert.match(client, /cacheBooking/);
});

test("booking APIs authenticate and bind every booking to the caller", () => {
  assert.match(collectionRoute, /verifyCaller\(request\)/);
  assert.match(collectionRoute, /body\.booking\.userId !== caller\.uid/);
  assert.match(itemRoute, /getOwnedBooking\(id, caller\.uid\)/);
  assert.match(itemRoute, /saveOwnedBooking\(body\.booking, caller\.uid\)/);
});

test("server persistence atomically stores booking, reference and privacy-limited verification copy", () => {
  assert.match(serverStore, /runTransaction/);
  assert.match(serverStore, /transaction\.set\(bookingRef/);
  assert.match(serverStore, /transaction\.set\(referenceRef/);
  assert.match(serverStore, /publicVerificationBooking/);
  assert.match(serverStore, /options\.migrationOnly && existing/);
});

test("clients cannot bypass booking ownership through direct Firestore access", () => {
  for (const collection of ["airlineBookings", "airlineBookingReferences", "airlineBookingVerifications"]) {
    assert.match(rules, new RegExp(`match /${collection}`));
  }
});
