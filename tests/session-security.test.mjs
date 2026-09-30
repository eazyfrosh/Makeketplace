import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Firebase authentication uses tab-scoped session persistence", () => {
  const source = read("src/context/auth-context.tsx");
  assert.match(source, /browserSessionPersistence/);
  assert.match(source, /setPersistence\(auth, browserSessionPersistence\)/);
});

test("demo authentication does not persist its session in localStorage", () => {
  const auth = read("src/context/auth-context.tsx");
  const headers = read("src/lib/licensing/client-auth.ts");
  assert.match(auth, /sessionStorage\.setItem\(DEMO_SESSION_KEY/);
  assert.match(headers, /sessionStorage\.getItem\(DEMO_SESSION_KEY/);
  assert.doesNotMatch(headers, /localStorage\.getItem\(DEMO_SESSION_KEY/);
});
