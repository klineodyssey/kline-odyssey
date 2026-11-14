import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function artifact(name) {
  return JSON.parse(fs.readFileSync(new URL(`../artifacts/${name}.json`, import.meta.url), "utf8"));
}

function functionNames(abi) {
  return new Set(abi.filter((item) => item.type === "function").map((item) => item.name));
}

test("stable KUFO exposes the existing KSHIPConverter carrier interface", () => {
  const kufo = artifact("KUFO");
  const names = functionNames(kufo.abi);
  assert.equal(names.has("burnForCarrier"), true);
  assert.equal(names.has("carrierBurnRecord"), true);
  assert.equal(names.has("decayAvailableForKship"), false);
});

test("KSHIP and KSHIPConverter remain compatible with stable KUFO proof lineage", () => {
  const kufo = artifact("KUFO");
  const furnace = artifact("KAIOSAlchemyFurnace");
  const output = artifact("KUFOOutputJindouyun168888");
  const kship = artifact("KSHIP");
  const converter = artifact("KSHIPConverter");

  const pointGetter = (contract, name) => {
    const getter = contract.abi.find(item => item.type === "function" && item.name === name);
    assert.ok(getter, name);
    assert.deepEqual(getter.inputs, []);
    assert.deepEqual(getter.outputs.map(item => item.type), ["uint256"]);
    assert.equal(getter.stateMutability, "view");
  };
  pointGetter(kufo, "TOKEN_POINT_18911");
  assert.equal(functionNames(kufo.abi).has("TOKEN_POINT_511111"), false, "the undeployed KUFO candidate must not advertise the KSHIP birthplace");
  for (const name of ["FURNACE_POINT", "TOKEN_POINT", "OUTPUT_POINT"]) pointGetter(furnace, name);
  for (const name of ["SOURCE_FURNACE_POINT", "TOKEN_POINT", "OUTPUT_POINT"]) pointGetter(output, name);
  pointGetter(kship, "TOKEN_POINT_511111");
  pointGetter(converter, "WORMHOLE_POINT_511111");

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


test("stable KUFO has one immutable civil-month calendar and bounded carrier/transfer APIs", () => {
  const { abi } = artifact("KUFO");
  const converter = artifact("KSHIPConverter");
  const constructor = abi.find(item => item.type === "constructor");
  assert.deepEqual(constructor.inputs.map(item => item.type), ["address", "address", "tuple"]);
  const calendarFields = [["version", "bytes32"], ["activationTime", "uint64"], ["utcOffsetSeconds", "int32"], ["constellationByMonth", "uint8[12]"]];
  assert.deepEqual(constructor.inputs[2].components.map(item => [item.name, item.type]), calendarFields);
  const method = name => { const found = abi.find(item => item.type === "function" && item.name === name); assert.ok(found, name); return found; };
  assert.deepEqual(method("calendarConfig").outputs[0].components.map(item => [item.name, item.type]), calendarFields);
  assert.deepEqual(method("transferGroups").inputs.map(item => item.type), ["address", "uint256", "uint256[]"]);
  assert.deepEqual(method("transferFromGroups").inputs.map(item => item.type), ["address", "address", "uint256", "uint256[]"]);
  assert.deepEqual(method("burnForCarrierGroups").inputs.map(item => item.type), ["address", "address", "uint256", "bytes32", "uint256[]"]);
  assert.deepEqual(method("birthGroup").outputs[0].components.map(item => item.name), ["first", "second", "terminal"]);
  const metadataFields = [["start", "uint64"], ["end", "uint64"], ["financialYear", "uint32"], ["month", "uint8"], ["tierId", "uint8"], ["constellation", "uint8"]];
  assert.deepEqual(method("groupMetadata").outputs[0].components.map(item => [item.name, item.type]), metadataFields);
  const at = method("birthGroupAt");
  assert.deepEqual(at.inputs.map(item => item.type), ["uint256"]);
  assert.deepEqual(at.outputs.map(item => [item.name, item.type]), [["id", "uint256"], ["metadata", "tuple"]]);
  assert.deepEqual(at.outputs[1].components.map(item => [item.name, item.type]), metadataFields);
  assert.deepEqual(method("mintOrigin").outputs[0].components.map(item => [item.name, item.type]), [
    ["beneficiary", "address"], ["amount", "uint256"], ["bornAt", "uint64"], ["birthYear", "uint32"],
    ["birthMonth", "uint8"], ["birthTierId", "uint8"], ["birthConstellation", "uint8"], ["groupId", "uint32"], ["calendarHash", "bytes32"],
  ]);
  for (const name of ["groupCount", "activeGroupCount", "currentAnnualStage", "calendarHash"]) method(name);
  assert.equal(functionNames(abi).has("currentAutumn"), false, "one annual maturity implementation");
  const convert = converter.abi.find(item => item.type === "function" && item.name === "convertGroups");
  assert.ok(convert);
  assert.deepEqual(convert.inputs.map(item => item.type), ["uint256", "address", "uint256[]"]);
});

test("civil calendar getters and bounded holder queries expose no mutable append calendar", () => {
  const { abi } = artifact("KUFO");
  const method = name => { const f = abi.find(item => item.type === "function" && item.name === name); assert.ok(f, name); return f; };
  const names = functionNames(abi);
  for (const name of ["proposeCalendarAppend", "executeCalendarAppend", "cancelCalendarAppend", "calendarAppendHash", "pendingCalendarAppend", "latestCalendarHash", "issuanceCohorts", "MAX_BIRTH_WINDOWS", "MAX_APPEND_BIRTH_WINDOWS"]) {
    assert.equal(names.has(name), false, name + " must not retain a second mutable calendar");
  }
  assert.deepEqual(method("civilDate").inputs.map(p => p.type), ["uint256"]);
  assert.deepEqual(method("civilDate").outputs.map(p => p.type), ["uint32", "uint8", "uint8"]);
  assert.equal(method("activationTime").outputs[0].type, "uint64");
  assert.equal(method("utcOffsetSeconds").outputs[0].type, "int32");
  assert.equal(method("firstBirthYear").outputs[0].type, "uint32");
  assert.equal(method("firstBirthMonth").outputs[0].type, "uint8");
  assert.equal(method("maximumGroupId").outputs[0].type, "uint32");
  assert.deepEqual(method("constellationByMonth").inputs.map(p => p.type), ["uint8"]);
  assert.deepEqual(method("groupCalendarHash").inputs.map(p => p.type), ["uint256"]);
  assert.deepEqual(method("heldGroups").inputs.map(p => p.type), ["address", "uint256", "uint256"]);
  assert.deepEqual(method("heldGroups").outputs.map(p => p.type), ["uint256[]"]);
  assert.deepEqual(method("claimableForGroups").inputs.map(p => p.type), ["address", "uint256[]"]);
  assert.equal(method("claimableForGroups").outputs[0].type, "uint256");
});
