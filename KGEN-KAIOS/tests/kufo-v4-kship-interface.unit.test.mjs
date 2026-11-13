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
  for(const [name,type] of [['bornAt','uint64'],['birthYear','uint32'],['birthZodiac','uint8'],['birthConstellation','uint8'],['groupId','uint32'],['calendarHash','bytes32']])assert.ok(origin.some(item=>item.name===name&&item.type===type),name);
  for(const name of ['groupCount','activeGroupCount','currentAnnualStage','calendarHash'])method(name);
  assert.equal(functionNames(abi).has('currentAutumn'),false,'formal annual API has no second maturity implementation');
  const convert=converter.abi.find(item=>item.type==='function'&&item.name==='convertGroups');
  assert.ok(convert);assert.deepEqual(convert.inputs.map(item=>item.type),['uint256','address','uint256[]']);
});

test('calendar continuation and bounded holder queries share one stable KUFO interface',()=>{
  const {abi}=artifact('KUFO');
  const method=name=>{const f=abi.find(item=>item.type==='function'&&item.name===name);assert.ok(f,name);return f;};
  for(const name of ['proposeCalendarAppend','executeCalendarAppend','calendarAppendHash']){
    assert.deepEqual(method(name).inputs.map(p=>p.type),['tuple']);
    assert.deepEqual(method(name).inputs[0].components.map(p=>p.type),['bytes32','uint32','uint64[]','uint256[]']);
  }
  assert.deepEqual(method('pendingCalendarAppend').outputs.map(p=>p.type),['bytes32','bytes32','address','uint64']);
  assert.equal(method('issuanceCohorts').outputs[0].type,'uint32');
  assert.equal(method('latestCalendarHash').outputs[0].type,'bytes32');
  assert.deepEqual(method('groupCalendarHash').inputs.map(p=>p.type),['uint256']);
  assert.deepEqual(method('heldGroups').inputs.map(p=>p.type),['address','uint256','uint256']);
  assert.deepEqual(method('heldGroups').outputs.map(p=>p.type),['uint256[]']);
  assert.deepEqual(method('claimableForGroups').inputs.map(p=>p.type),['address','uint256[]']);
  assert.equal(method('claimableForGroups').outputs[0].type,'uint256');
});
