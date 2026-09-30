import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
test("login protection defaults to five attempts and thirty minutes", () => { const source = read("src/lib/auth-security/login-lockout.ts"); assert.match(source, /LOGIN_MAX_ATTEMPTS \?\? 5/); assert.match(source, /LOGIN_LOCKOUT_MINUTES \?\? 30/); });
test("only an authenticated matching user can clear failures", () => { const route = read("src/app/api/auth/login-attempts/route.ts"); assert.match(route, /verifyCaller/); assert.match(route, /caller\.email\.toLowerCase\(\) !== email/); });
test("clients cannot edit login limits directly", () => { assert.match(read("firestore.rules"), /match \/auth_login_limits\/\{limitId\} \{ allow read, write: if false; \}/); });
