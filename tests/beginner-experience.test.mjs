import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const guide = readFileSync(new URL("../src/components/layout/beginner-guide.tsx", import.meta.url), "utf8");
const hero = readFileSync(new URL("../src/components/home/hero.tsx", import.meta.url), "utf8");
const header = readFileSync(new URL("../src/components/layout/site-header.tsx", import.meta.url), "utf8");

test("a plain-language getting-started guide is available from the shared header", () => {
  assert.match(header, /<BeginnerGuide \/>/);
  assert.match(guide, /What would you like to do\?/);
  assert.match(guide, /Find a tool/);
  assert.match(guide, /Create a website/);
  assert.match(guide, /Design an email/);
  assert.match(guide, /Use your wallet/);
});

test("homepage uses beginner-friendly copy and an original optimized image", () => {
  assert.match(hero, /Simple digital tools/);
  assert.match(hero, /without needing to be a technology expert/);
  assert.match(hero, /eazytool-for-everyone\.webp/);
  assert.equal(existsSync(new URL("../public/home/eazytool-for-everyone.webp", import.meta.url)), true);
});
