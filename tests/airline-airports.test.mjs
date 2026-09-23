import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Module } from "node:module";
import { dirname, resolve } from "node:path";
import test from "node:test";
import ts from "typescript";

const filename = resolve("src/lib/airline/data/airports.ts");
const source = readFileSync(filename, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, resolveJsonModule: true },
}).outputText;
const airportModule = new Module(filename);
airportModule.filename = filename;
airportModule.paths = Module._nodeModulePaths(dirname(filename));
airportModule._compile(compiled, filename);
const { airports, findAirport, recognizeAirport, searchAirports } = airportModule.exports;

test("airport index includes global IATA airports without duplicate codes", () => {
  assert.ok(airports.length > 9000);
  assert.equal(new Set(airports.map((airport) => airport.code)).size, airports.length);
  assert.equal(findAirport("lex")?.name, "Blue Grass Airport");
});

test("Blue Grass Airport is found by code, name, city and pasted label", () => {
  for (const query of ["LEX", "Blue Grass Airport", "Lexington", "Blue Grass Airport (LEX)"]) {
    assert.equal(searchAirports(query)[0]?.code, "LEX", query);
  }
  assert.equal(recognizeAirport("Blue Grass Airport (LEX)")?.code, "LEX");
});

test("airports outside the old shortlist remain searchable", () => {
  for (const code of ["LEX", "ABE", "BTV", "FAI", "TOS"]) {
    assert.ok(findAirport(code), code);
    assert.equal(searchAirports(code)[0]?.code, code);
  }
  assert.deepEqual(searchAirports("not a real airport xyzzy"), []);
});

