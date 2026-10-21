import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Website Design is removed without removing Website Builder", async () => {
  const source = read("../src/lib/data/services.ts");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
  const { services, categories, getServiceBySlug } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

  assert.equal(getServiceBySlug("website-design"), undefined);
  assert.equal(categories.some((category) => category.id === "design"), false);
  assert.equal(getServiceBySlug("premium-templates")?.name, "Website Builder");
  assert.equal(services.some((service) => service.slug === "website-design"), false);
});

test("SMS Flashing is marked coming soon and direct sends are blocked", async () => {
  const source = read("../src/lib/data/services.ts");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
  const { getServiceBySlug } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
  assert.equal(getServiceBySlug("sms-messaging")?.comingSoon, true);

  const sendRoute = read("../src/app/api/sms/send/route.ts");
  assert.ok(sendRoute.indexOf("SMS_COMING_SOON") < sendRoute.indexOf("sendSms("));
  assert.match(read("../src/app/sms/layout.tsx"), /getServiceBySlug\("sms-messaging"\)\?\.comingSoon/);
});
