import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Premium Template catalog includes the NovaBank Dashboard preview", () => {
  const catalog = read("src/components/premium-templates/premium-template-catalog.tsx");
  assert.match(catalog, /id: "novabank-dashboard"/);
  assert.match(catalog, /name: "NovaBank Dashboard"/);
  assert.match(catalog, /https:\/\/novabank-dashboard\.vercel\.app/);
  assert.match(catalog, /workspaceReady: false/);
  assert.match(catalog, /Open Template Preview/);
});

test("NovaBank template access remains subscription-gated and preview-only", () => {
  const route = read("src/app/api/licenses/issue-access-token/route.ts");
  assert.match(route, /premiumTemplateIds/);
  assert.match(route, /novabank-dashboard/);
  assert.match(route, /destination !== "preview"/);
  assert.match(route, /NOVABANK_TEMPLATE_APP_ORIGIN/);
  assert.match(route, /getSubscriptionForUser/);
});
