import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const contracts = path.resolve(here, "../contracts");
const read = (name) => fs.readFileSync(path.join(contracts, name), "utf8");

const furnace = read("KAIOSAlchemyFurnaceV4.sol");
const wormhole = read("KUFOClaimWormholeV4.sol");
const kufo = read("KUFOV4.sol");

test("V4 uses KGEN balance proof only and exact 1:1000 / 1:1000 ratios", () => {
  assert.match(furnace, /KAIOS_PER_KGEN = 1_000/);
  assert.match(furnace, /KUFO_PER_KAIOS = 1_000/);
  assert.match(furnace, /kgen\.balanceOf\(msg\.sender\)/);
  assert.doesNotMatch(furnace, /safeTransferFrom|transferFrom\(msg\.sender[^)]*kgen|KGEN.*allowance/i);
});

test("V4 fixes KUFO output point to K168888 and releases through K511111", () => {
  assert.match(furnace, /KAIOS\.POINT\.168888\.KUFO\.OUTLET/);
  assert.match(furnace, /KAIOS\.ORGAN\.WORMHOLE\.511111/);
  assert.match(wormhole, /KAIOS\.POINT\.168888\.KUFO\.OUTLET/);
});

test("V4 has no 49-epoch, tax accumulation, or KGEN holding-day gate", () => {
  const combined = `${furnace}\n${wormhole}`;
  assert.doesNotMatch(combined, /MATURATION_EPOCHS|49[_ ]?EPOCH|tax[_ -]?credit|0\.1%|130[_ -]?day|holding[_ -]?days/i);
});

test("KUFO lifetime is one K280 year and conversion is 1 KUFO to 1000 KSHIP", () => {
  assert.match(kufo, /K280_YEAR_SECONDS = 31_556_926/);
  assert.match(kufo, /KSHIP_PER_KUFO = 1_000/);
  assert.match(kufo, /LotNotExpired/);
  assert.match(kufo, /expectedKship = kufoAmount \* KSHIP_PER_KUFO/);
});

test("KUFO transfers preserve birth time through whole-lot move and split", () => {
  assert.match(kufo, /_moveLots\(from, to, value\)/);
  assert.match(kufo, /_createLot\(to, take, item\.bornAt, item\.sourceProof\)/);
  assert.match(kufo, /LotSplit/);
});

test("0.001 KAIOS example implies 0.000001 KGEN and 1 KUFO", () => {
  const one = 10n ** 18n;
  const kaios = one / 1000n;
  const requiredKgen = kaios / 1000n;
  const kufoOut = kaios * 1000n;
  assert.equal(requiredKgen, one / 1_000_000n);
  assert.equal(kufoOut, one);
});
