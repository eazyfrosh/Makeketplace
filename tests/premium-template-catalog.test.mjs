import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Premium Template catalog includes the workspace-ready NovaBank Dashboard", () => {
  const catalog = read("src/components/premium-templates/premium-template-catalog.tsx");
  assert.match(catalog, /id: "novabank-dashboard"/);
  assert.match(catalog, /name: "NovaBank Dashboard"/);
  assert.match(catalog, /https:\/\/novabank-dashboard\.vercel\.app/);
  assert.match(catalog, /novabank-dashboard[\s\S]*workspaceReady: true/);
  assert.match(catalog, /Generate \/ Open Admin/);
});

test("NovaBank template access remains subscription-gated and uses trusted SSO", () => {
  const route = read("src/app/api/licenses/issue-access-token/route.ts");
  assert.match(route, /premiumTemplateIds/);
  assert.match(route, /novabank-dashboard/);
  assert.match(route, /NOVABANK_TEMPLATE_APP_ORIGIN/);
  assert.match(route, /novabank-dashboard"\) \{[\s\S]*\/api\/eazytools\/sso/);
  assert.match(route, /accessUrl\.searchParams\.set\("token", token\)/);
  assert.match(route, /getSubscriptionForUser/);
});
