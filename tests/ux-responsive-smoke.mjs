import { chromium } from "playwright";

const baseUrl = process.env.EAZYTOOL_TEST_URL ?? "http://127.0.0.1:3100";
const viewports = [
  { name: "mobile", width: 360, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 1000 },
];
const publicRoutes = ["/", "/services", "/pricing", "/domains", "/auth/login"];

const browser = await chromium.launch({ headless: true });
const failures = [];

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  for (const route of publicRoutes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
    if (dimensions.scrollWidth > dimensions.clientWidth + 2) failures.push(`${viewport.name} ${route}: horizontal overflow ${dimensions.scrollWidth - dimensions.clientWidth}px`);
  }

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    const identity = { uid: "ux-test-user", email: "amara.okafor@example.test", password: "LocalDemoOnly!2026", name: "Amara Okafor" };
    localStorage.setItem("nexova_demo_users", JSON.stringify([identity]));
    localStorage.setItem("nexova_users", JSON.stringify([{ id: identity.uid, uid: identity.uid, email: identity.email, name: identity.name, role: "customer", createdAt: "2026-09-28T09:00:00.000Z" }]));
    localStorage.setItem("nexova_demo_session", identity.uid);
  });
  for (const route of ["/dashboard", "/wallet"]) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1_000);
    const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
    if (dimensions.scrollWidth > dimensions.clientWidth + 2) failures.push(`${viewport.name} ${route}: horizontal overflow ${dimensions.scrollWidth - dimensions.clientWidth}px`);
  }
  await context.close();
}

await browser.close();
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Responsive smoke test passed for ${viewports.length} viewports and ${publicRoutes.length + 2} routes per viewport.`);
}
