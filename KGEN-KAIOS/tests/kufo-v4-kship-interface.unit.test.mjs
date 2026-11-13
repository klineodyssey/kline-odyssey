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

test('stable KUFO has one explicit packed calendar and matching bounded carrier/transfer APIs',()=>{
  const {abi}=artifact('KUFO'),converter=artifact('KSHIPConverter');
  const constructor=abi.find(item=>item.type==='constructor');
  assert.deepEqual(constructor.inputs.map(item=>item.type),['address','address','tuple']);
  assert.deepEqual(constructor.inputs[2].components.map(item=>[item.name,item.type]),[
    ['version','bytes32'],['firstFinancialYear','uint32'],['yearStarts','uint64[]'],['packedBirthWindows','uint256[]']]);
  const method=name=>{const found=abi.find(item=>item.type==='function'&&item.name===name);assert.ok(found,name);return found;};
  assert.deepEqual(method('transferGroups').inputs.map(item=>item.type),['address','uint256','uint256[]']);
  assert.deepEqual(method('transferFromGroups').inputs.map(item=>item.type),['address','address','uint256','uint256[]']);
  assert.deepEqual(method('burnForCarrierGroups').inputs.map(item=>item.type),['address','address','uint256','bytes32','uint256[]']);
  assert.deepEqual(method('birthGroup').outputs[0].components.map(item=>item.name),['first','second','terminal']);
  assert.deepEqual(method('groupMetadata').outputs[0].components.map(item=>[item.name,item.type]),[
    ['start','uint64'],['end','uint64'],['financialYear','uint32'],['zodiac','uint8'],['constellation','uint8']]);
  const origin=method('mintOrigin').outputs[0].components;
  for(const [name,type] of [['bornAt','uint64'],['birthYear','uint32'],['birthZodiac','uint8'],['birthConstellation','uint8'],['groupId','uint16'],['calendarHash','bytes32']])assert.ok(origin.some(item=>item.name===name&&item.type===type),name);
  for(const name of ['groupCount','activeGroupCount','currentAnnualStage','calendarHash'])method(name);
  assert.equal(functionNames(abi).has('currentAutumn'),false,'formal annual API has no second maturity implementation');
  const convert=converter.abi.find(item=>item.type==='function'&&item.name==='convertGroups');
  assert.ok(convert);assert.deepEqual(convert.inputs.map(item=>item.type),['uint256','address','uint256[]']);
});
