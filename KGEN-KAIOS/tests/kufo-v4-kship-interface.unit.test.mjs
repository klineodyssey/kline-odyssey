import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function artifact(name) {
  return JSON.parse(fs.readFileSync(new URL(`../artifacts/${name}.json`, import.meta.url), "utf8"));
}

function functionNames(abi) {
  return new Set(abi.filter((item) => item.type === "function").map((item) => item.name));
}

test("KUFOV4 exposes the existing KSHIPConverter carrier interface", () => {
  const kufo = artifact("KUFOV4");
  const names = functionNames(kufo.abi);
  assert.equal(names.has("burnForCarrier"), true);
  assert.equal(names.has("carrierBurnRecord"), true);
  assert.equal(names.has("decayAvailableForKship"), false);
});

test("KSHIP and KSHIPConverter remain compatible with KUFOV4 proof lineage", () => {
  const kufo = artifact("KUFOV4");
  const kship = artifact("KSHIP");
  const converter = artifact("KSHIPConverter");

  const burn = kufo.abi.find((item) => item.type === "function" && item.name === "burnForCarrier");
  assert.deepEqual(burn.inputs.map((item) => item.type), ["address", "address", "uint256", "bytes32"]);
  assert.deepEqual(burn.outputs.map((item) => item.type), ["uint256"]);

  const record = kufo.abi.find((item) => item.type === "function" && item.name === "carrierBurnRecord");
  assert.equal(record.outputs.length, 1);
  assert.equal(record.outputs[0].type, "tuple");
  assert.deepEqual(record.outputs[0].components.map((item) => item.type), ["address", "address", "address", "uint256", "uint256"]);

  const kshipNames = functionNames(kship.abi);
  const converterNames = functionNames(converter.abi);
  assert.equal(kshipNames.has("mintFromCarrierProof"), true);
  assert.equal(converterNames.has("convert"), true);
});
