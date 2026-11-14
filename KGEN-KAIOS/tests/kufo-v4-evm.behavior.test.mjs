import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ganache from "ganache";
import { AbiCoder, BrowserProvider, ContractFactory, MaxUint256, ZeroAddress, ZeroHash, keccak256, parseEther, toUtf8Bytes } from "ethers";

const artifacts = path.resolve(import.meta.dirname, "../artifacts");
const hash = (value) => keccak256(toUtf8Bytes(value));
const OUTPUT_ID = hash("KAIOS.ORGAN.KUFO.OUTPUT.168888");
const CONVERTER_ID = hash("KAIOS.ORGAN.KSHIP.CONVERTER");
const FURNACE_ID = hash("KAIOS.ORGAN.FURNACE.18911");
const VERSION = hash("TEST_ONLY_UTC8_WHOLE_MONTH_001");
const FIRST_YEAR = 2027;
const UTC_OFFSET = 8 * 60 * 60;
const CONSTELLATIONS = Object.freeze([10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
// Independent host Gregorian oracle. These test activation dates are not a
// production deployment instruction; the adopted clock is Taiwan UTC+8.
const localTime = (year, month = 1, day = 1, hour = 0, minute = 0, second = 0) =>
  Date.UTC(year, month - 1, day, hour, minute, second) / 1000 - UTC_OFFSET;
const BASE = localTime(FIRST_YEAR);
const GAS_BOUND = 8_000_000n;
const E18 = parseEther("1");

const boundaries = (years = 4, firstYear = FIRST_YEAR) =>
  Array.from({ length: years + 3 }, (_, i) => localTime(firstYear + i));
const monthTime = (absoluteIndex, firstYear = FIRST_YEAR) =>
  localTime(firstYear + Math.floor(absoluteIndex / 12), absoluteIndex % 12 + 1);
const calendarConfig = (activationTime = BASE) => ({
  version: VERSION, activationTime, utcOffsetSeconds: UTC_OFFSET, constellationByMonth: [...CONSTELLATIONS],
});
const tranches = (c) => [c.first, c.second, c.terminal];
const sum = (values) => values.reduce((a, b) => a + b, 0n);
const mined = async (promise) => (await promise).wait();

async function deploy(name, signer, args = []) {
  const a = JSON.parse(fs.readFileSync(path.join(artifacts, `${name}.json`), "utf8"));
  const contract = await new ContractFactory(a.abi, a.bytecode, signer).deploy(...args);
  await contract.waitForDeployment();
  return contract;
}

async function rejectsCanonicalBinding(operation, contract) {
  await assert.rejects(operation, (error) => {
    const data = error.data ?? error.info?.error?.data?.result;
    const parsed = contract.interface.parseError(data);
    assert.equal(parsed.name, "CanonicalBindingMismatch");
    assert.deepEqual(Array.from(parsed.args), []);
    return true;
  });
}

async function fixture(t, years = 4, options = {}) {
  const firstYear = options.firstYear ?? FIRST_YEAR;
  const starts = boundaries(years, firstYear);
  const calendar = calendarConfig(options.activationTime ?? starts[0]);
  const eip1193 = ganache.provider({
    logging: { quiet: true },
    chain: { chainId: 1337, time: new Date((options.initialTime ?? calendar.activationTime + 10) * 1000), hardfork: "shanghai" },
    miner: { timestampIncrement: 0, blockGasLimit: 30_000_000 },
    wallet: { totalAccounts: 6 },
  });
  const provider = new BrowserProvider(eip1193, undefined, { cacheTimeout: -1 });
  provider.pollingInterval = 10;
  const [owner, beneficiary, recipient, victim, outsider] = await Promise.all([0, 1, 2, 3, 4].map((i) => provider.getSigner(i)));
  t.after(async () => { provider.destroy(); await eip1193.disconnect(); });
  const registry = await deploy("KUFOV4MockOrganRegistry", owner);
  const kgen = await deploy("MockKGEN", owner, [await owner.getAddress()]);
  const kaios = await deploy("KAIOS", owner, [await kgen.getAddress(), await owner.getAddress(), await registry.getAddress()]);
  await mined(kgen.burn(options.production ? E18 : await kgen.totalSupply()));
  await mined(kaios.settleWhiteHoleMass());
  const kufo = await deploy("KUFO", owner, [await registry.getAddress(), await kaios.getAddress(), calendar]);
  const output = await deploy("KUFOV4MockOutput", owner, [await kaios.getAddress(), await kufo.getAddress(), await registry.getAddress()]);
  const kship = await deploy("KSHIP", owner, [await registry.getAddress(), await kufo.getAddress()]);
  const converter = await deploy("KSHIPConverter", owner, [await kufo.getAddress(), await kship.getAddress()]);
  await mined(registry.setOrgan(OUTPUT_ID, await output.getAddress()));
  await mined(registry.setOrgan(FURNACE_ID, await output.getAddress()));
  await mined(registry.setOrgan(CONVERTER_ID, await converter.getAddress()));
  await mined(kaios.approve(await output.getAddress(), MaxUint256));
  for (const holder of [owner, beneficiary, recipient, victim, outsider]) {
    await mined(kufo.connect(holder).approve(await converter.getAddress(), MaxUint256));
  }
  return { eip1193, provider, starts, firstYear, calendar, owner, beneficiary, recipient, victim, outsider, registry, kgen, kaios, kufo, output, kship, converter };
}

async function at(f, timestamp) {
  assert.ok(Number.isSafeInteger(timestamp * 1000), "test clock must preserve every timestamp bit");
  await f.eip1193.request({ method: "evm_setTime", params: [timestamp * 1000] });
  await f.eip1193.request({ method: "evm_mine", params: [timestamp] });
  const block = await f.eip1193.request({ method: "eth_getBlockByNumber", params: ["latest", false] });
  assert.equal(Number(block.timestamp), timestamp, "exact configured test boundary");
}

async function mint(f, amount, receiver = f.owner, label = "mint") {
  const beneficiary = typeof receiver === "string" ? receiver : await receiver.getAddress();
  const receipt = await mined(f.output.mint(await f.kufo.getAddress(), hash(label), beneficiary, amount));
  const created = receipt.logs.map((log) => {
    try { return f.output.interface.parseLog(log); } catch { return null; }
  }).find((log) => log?.name === "FixtureMint");
  assert.ok(created, "mint must produce a verifiable real KAIOS burn proof");
  const burn = await f.kaios.alchemyBurnRecord(created.args.proofId);
  assert.equal(burn.expectedKufo, amount);
  assert.equal(burn.kaiosBurned * 1000n, amount);
  return created.args.proofId;
}

async function conservation(f) {
  const burned = await f.kufo.totalDecayedForKship();
  assert.equal(await f.kufo.totalSupply() + burned, await f.kufo.totalMintedFromAlchemy());
  assert.equal(await f.kufo.conservationInvariantHolds(), true);
  assert.equal(await f.kship.totalSupply(), burned * 1000n);
  assert.equal(await f.kship.totalMintedFromKufo(), burned * 1000n);
}

test("common year boundary for early and year-end births: before/exact/after", async (t) => {
  const f = await fixture(t);
  const early = await mint(f, E18, f.owner, "early");
  await at(f, f.starts[1] - 1);
  const late = await mint(f, E18, f.recipient, "year-end");
  assert.equal(await f.kufo.claimableDecay(await f.owner.getAddress(), FIRST_YEAR), 0n);
  assert.equal(await f.kufo.claimableDecay(await f.recipient.getAddress(), FIRST_YEAR), 0n);
  await assert.rejects(f.converter.convert.staticCall(1n, await f.beneficiary.getAddress()));
  await at(f, f.starts[1]);
  assert.equal(await f.kufo.currentYear(), BigInt(FIRST_YEAR + 1));
  assert.equal(await f.kufo.currentAnnualStage(FIRST_YEAR), 1n);
  assert.equal(await f.kufo.claimableDecay(await f.owner.getAddress(), FIRST_YEAR), E18 / 2n);
  assert.equal(await f.kufo.claimableDecay(await f.recipient.getAddress(), FIRST_YEAR), E18 / 2n);
  await at(f, f.starts[1] + 1);
  assert.equal(await f.kufo.claimableDecay(await f.recipient.getAddress(), FIRST_YEAR), E18 / 2n);
  const a = await f.kufo.mintOrigin(early);
  const b = await f.kufo.mintOrigin(late);
  assert.equal(a.birthYear, BigInt(FIRST_YEAR));
  assert.equal(b.birthYear, BigInt(FIRST_YEAR));
  assert.equal(b.bornAt, BigInt(f.starts[1] - 1));
  assert.equal(a.birthMonth, 1n);
  assert.equal(a.birthTierId, 1n);
  assert.equal(a.birthConstellation, 10n);
  assert.equal(b.birthMonth, 12n);
  assert.equal(b.birthTierId, 12n);
  assert.equal(b.birthConstellation, 9n, "December is Sagittarius without cross-day windows");
  await conservation(f);
});

test("midyear and crossyear transfers retain cohort without decay settlement or age reset", async (t) => {
  const f = await fixture(t);
  const proof = await mint(f, 1000n);
  await at(f, localTime(FIRST_YEAR, 7, 1));
  await mined(f.kufo.transfer(await f.recipient.getAddress(), 400n));
  assert.equal(await f.kufo.balanceOf(await f.owner.getAddress()), 600n);
  assert.equal(await f.kufo.balanceOf(await f.recipient.getAddress()), 400n);
  assert.equal(await f.kufo.totalDecayedForKship(), 0n);
  await at(f, f.starts[1] + 50);
  const before = tranches(await f.kufo.cohort(await f.recipient.getAddress(), FIRST_YEAR));
  await mined(f.kufo.connect(f.recipient).transfer(await f.victim.getAddress(), 400n));
  assert.deepEqual(tranches(await f.kufo.cohort(await f.victim.getAddress(), FIRST_YEAR)), before);
  assert.equal(sum(tranches(await f.kufo.cohort(await f.victim.getAddress(), FIRST_YEAR + 1))), 0n);
  assert.equal(await f.kufo.totalDecayedForKship(), 0n);
  assert.equal((await f.kufo.mintOrigin(proof)).birthYear, BigInt(FIRST_YEAR));
  assert.equal(await f.kufo.claimableDecay(await f.victim.getAddress(), FIRST_YEAR), before[0]);
  await conservation(f);
});

test("partial transfers before/after partial settlement conserve each remaining tranche", async (t) => {
  const f = await fixture(t);
  await mint(f, 1000n);
  const original = tranches(await f.kufo.cohort(await f.owner.getAddress(), FIRST_YEAR));
  await mined(f.kufo.transfer(await f.recipient.getAddress(), 317n));
  const p1 = tranches(await f.kufo.cohort(await f.owner.getAddress(), FIRST_YEAR));
  const c1 = tranches(await f.kufo.cohort(await f.recipient.getAddress(), FIRST_YEAR));
  original.forEach((value, i) => assert.equal(p1[i] + c1[i], value));
  assert.equal(sum(c1), 317n);
  await at(f, f.starts[1]);
  await mined(f.converter.convert(100n, await f.beneficiary.getAddress()));
  const pre = tranches(await f.kufo.cohort(await f.owner.getAddress(), FIRST_YEAR));
  await mined(f.kufo.transfer(await f.recipient.getAddress(), 113n));
  const parent = tranches(await f.kufo.cohort(await f.owner.getAddress(), FIRST_YEAR));
  const child = tranches(await f.kufo.cohort(await f.recipient.getAddress(), FIRST_YEAR));
  pre.forEach((value, i) => assert.equal(parent[i] + child[i] - c1[i], value));
  assert.equal(await f.kufo.totalDecayedForKship(), 100n);
  await at(f, f.starts[3]);
  for (const holder of [f.owner, f.recipient]) {
    const balance = await f.kufo.balanceOf(await holder.getAddress());
    await mined(f.converter.connect(holder).convert(balance, await holder.getAddress()));
    assert.equal(await f.kufo.balanceOf(await holder.getAddress()), 0n);
  }
  assert.equal(await f.kship.totalSupply(), 1_000_000n);
  await conservation(f);
});

test("skip year catches up to 75 percent, repeat cannot settle twice, third year clears dust", async (t) => {
  const f = await fixture(t);
  await mint(f, 1000n);
  await at(f, f.starts[2]);
  assert.equal(await f.kufo.claimableTotal(await f.owner.getAddress()), 750n);
  await mined(f.converter.convert(750n, await f.beneficiary.getAddress()));
  assert.equal(await f.kufo.balanceOf(await f.owner.getAddress()), 250n);
  assert.equal(await f.kufo.claimableTotal(await f.owner.getAddress()), 0n);
  await assert.rejects(f.converter.convert.staticCall(1n, await f.beneficiary.getAddress()));
  await at(f, f.starts[3] - 1);
  assert.equal(await f.kufo.claimableTotal(await f.owner.getAddress()), 0n);
  await at(f, f.starts[3]);
  assert.equal(await f.kufo.claimableTotal(await f.owner.getAddress()), 250n);
  await mined(f.converter.convert(250n, await f.beneficiary.getAddress()));
  assert.equal(await f.kufo.balanceOf(await f.owner.getAddress()), 0n);
  assert.deepEqual(tranches(await f.kufo.cohort(await f.owner.getAddress(), FIRST_YEAR)), [0n, 0n, 0n]);
  await assert.rejects(f.converter.convert.staticCall(1n, await f.beneficiary.getAddress()));
  await conservation(f);
});

test("one smallest unit is swept exactly at the third boundary", async (t) => {
  const f = await fixture(t);
  await mint(f, 1000n);
  await mined(f.kufo.transfer(await f.recipient.getAddress(), 1n));
  await at(f, f.starts[2]);
  assert.equal(await f.kufo.claimableTotal(await f.recipient.getAddress()), 0n);
  await at(f, f.starts[3]);
  await mined(f.converter.connect(f.recipient).convert(1n, await f.beneficiary.getAddress()));
  assert.equal(await f.kufo.balanceOf(await f.recipient.getAddress()), 0n);
  assert.equal(await f.kufo.balanceOf(await f.owner.getAddress()), 999n);
  assert.equal(await f.kship.balanceOf(await f.beneficiary.getAddress()), 1000n);
  await conservation(f);
});

test("zero and self transfers preserve cohort state and do not create recipient history", async (t) => {
  const f = await fixture(t);
  await mint(f, 1000n);
  const owner = await f.owner.getAddress();
  const recipient = await f.recipient.getAddress();
  const before = tranches(await f.kufo.cohort(owner, FIRST_YEAR));
  await mined(f.kufo.transfer(recipient, 0n));
  await mined(f.kufo.transfer(owner, 1000n));
  await mined(f.kufo.approve(await f.outsider.getAddress(), 250n));
  await mined(f.kufo.connect(f.outsider).transferFrom(owner, owner, 250n));
  assert.deepEqual(tranches(await f.kufo.cohort(owner, FIRST_YEAR)), before);
  assert.equal(await f.kufo.balanceOf(owner), 1000n);
  assert.equal(await f.kufo.balanceOf(recipient), 0n);
  assert.equal(await f.kufo.activeGroupCount(recipient), 0n);
  assert.equal(await f.kufo.allowance(owner, await f.outsider.getAddress()), 0n);
  assert.equal(await f.kufo.totalDecayedForKship(), 0n);
  await conservation(f);
});

test("merging an unsettled receipt into a same-year settled cohort preserves outstanding maturity", async (t) => {
  const f = await fixture(t);
  const owner = await f.owner.getAddress();
  const recipient = await f.recipient.getAddress();
  const beneficiary = await f.beneficiary.getAddress();
  await mint(f, 1000n, f.owner, "settled-owner-origin");
  await mint(f, 1000n, f.recipient, "unsettled-receipt-origin");
  await at(f, f.starts[1]);
  await mined(f.converter.convert(500n, beneficiary));
  assert.deepEqual(tranches(await f.kufo.cohort(owner, FIRST_YEAR)), [0n, 250n, 250n]);
  await mined(f.kufo.connect(f.recipient).transfer(owner, 1000n));
  assert.deepEqual(tranches(await f.kufo.cohort(owner, FIRST_YEAR)), [500n, 500n, 500n]);
  assert.equal(await f.kufo.activeGroupCount(owner), 1n);
  assert.equal(await f.kufo.balanceOf(recipient), 0n);
  assert.equal(await f.kufo.totalDecayedForKship(), 500n, "merge must not settle the received maturity");
  assert.equal(await f.kufo.claimableTotal(owner), 500n);
  await mined(f.converter.convert(500n, beneficiary));
  await assert.rejects(f.converter.convert.staticCall(1n, beneficiary));
  await at(f, f.starts[2]);
  assert.equal(await f.kufo.claimableTotal(owner), 500n);
  await mined(f.converter.convert(500n, beneficiary));
  await at(f, f.starts[3]);
  await mined(f.converter.convert(500n, beneficiary));
  assert.equal(await f.kufo.totalSupply(), 0n);
  assert.equal(await f.kship.totalSupply(), 2_000_000n);
  await conservation(f);
});

test("256 unsolicited dust transfers coalesce and cannot lock the victim's full balance", async (t) => {
  const f = await fixture(t);
  const victim = await f.victim.getAddress();
  const token = await f.kufo.getAddress();
  await mint(f, 1000n, f.victim, "victim-legitimate-principal");
  for (let i = 0; i < 8; i += 1) {
    await mined(f.output.batchDust(token, hash(`dust-a-${i}`), victim, 16n, 1n, { gasLimit: 20_000_000n }));
  }
  const firstGas = await f.kufo.connect(f.victim).transfer.estimateGas(await f.recipient.getAddress(), 1128n);
  for (let i = 0; i < 8; i += 1) {
    await mined(f.output.batchDust(token, hash(`dust-b-${i}`), victim, 16n, 1n, { gasLimit: 20_000_000n }));
  }
  assert.equal(await f.kufo.balanceOf(victim), 1256n);
  assert.equal(await f.kufo.activeGroupCount(victim), 1n);
  assert.deepEqual(tranches(await f.kufo.cohort(victim, FIRST_YEAR)), [500n, 250n, 506n]);
  const receipt = await mined(f.kufo.connect(f.victim).transfer(await f.recipient.getAddress(), 1256n, { gasLimit: GAS_BOUND }));
  assert.ok(receipt.gasUsed < 300_000n);
  assert.ok(receipt.gasUsed <= firstGas + 10_000n, "dust count must not grow transfer traversal");
  assert.equal(await f.kufo.balanceOf(victim), 0n);
  await at(f, f.starts[3]);
  const settlement = await mined(f.converter.connect(f.recipient).convert(1256n, await f.beneficiary.getAddress(), { gasLimit: GAS_BOUND }));
  assert.ok(settlement.gasUsed < 500_000n);
  assert.equal(await f.kufo.balanceOf(await f.recipient.getAddress()), 0n);
  t.diagnostic(`256 dust receipts: full transfer gas=${receipt.gasUsed}; terminal settlement gas=${settlement.gasUsed}`);
  await conservation(f);
});

test("32 dormant annual cohorts use bounded traversal and permit a new real birth ten thousand years later", async (t) => {
  const f = await fixture(t, 32);
  const ids = [];
  for (let i = 0; i < 32; i += 1) {
    await at(f, f.starts[i] + 10);
    const proof = await mint(f, 1000n, f.owner, `dormant-year-${i}`);
    ids.push((await f.kufo.mintOrigin(proof)).groupId);
  }
  assert.deepEqual(ids, Array.from({ length: 32 }, (_, i) => BigInt(i * 12 + 1)));
  assert.equal(await f.kufo.totalDecayedForKship(), 0n);
  assert.equal(await f.kufo.activeGroupCount(await f.owner.getAddress()), 32n);
  await at(f, localTime(FIRST_YEAR + 10_000));
  const receipt = await mined(f.kufo.transfer(await f.recipient.getAddress(), 32_000n, { gasLimit: GAS_BOUND }));
  assert.ok(receipt.gasUsed < GAS_BOUND);
  assert.equal(await f.kufo.balanceOf(await f.owner.getAddress()), 0n);
  for (let i = 0; i < 32; i += 1) {
    assert.equal(await f.kufo.currentAnnualStage(FIRST_YEAR + i), 3n);
    assert.equal((await f.kufo.groupMetadata(ids[i])).month, 1n);
    assert.equal(sum(tranches(await f.kufo.cohort(await f.recipient.getAddress(), FIRST_YEAR + i))), 1000n);
  }
  const settle = await mined(f.converter.connect(f.recipient).convert(32_000n, await f.beneficiary.getAddress(), { gasLimit: GAS_BOUND }));
  assert.ok(settle.gasUsed < GAS_BOUND);
  assert.equal(await f.kufo.totalSupply(), 0n);
  assert.equal(await f.kship.totalSupply(), 32_000_000n);
  const farProof = await mint(f, 1000n, f.owner, "real-birth-after-ten-thousand-years");
  const far = await f.kufo.mintOrigin(farProof);
  assert.equal(far.groupId, 120_001n, "a real sparse birth uses a uint32 ID beyond uint16");
  assert.equal(far.birthYear, 12_027n);
  assert.equal(await f.kufo.claimableForGroups(await f.owner.getAddress(), [far.groupId]), 0n);
  assert.equal(await f.kufo.activeGroupCount(await f.owner.getAddress()), 1n);
  t.diagnostic(`32 dormant cohorts: transfer gas=${receipt.gasUsed}; settlement gas=${settle.gasUsed}; bound=${GAS_BOUND}; late actual group=${far.groupId}`);
  await conservation(f);
});
test("mint, carrier burn and KSHIP proofs enforce authorization and replay protection", async (t) => {
  const f = await fixture(t);
  const owner = await f.owner.getAddress();
  const beneficiary = await f.beneficiary.getAddress();
  const proof = await mint(f, 11_000n, f.owner, "replay-mint");
  await assert.rejects(f.output.mintWithoutBurn.staticCall(await f.kufo.getAddress(), proof, beneficiary, 11_000n));
  await assert.rejects(f.kufo.connect(f.outsider).mintFromImmediateProof.staticCall(hash("unauthorized"), owner, 1n));
  await assert.rejects(f.kufo.connect(f.outsider).burnForCarrier.staticCall(owner, beneficiary, 1n, hash("unauthorized-burn")));
  await assert.rejects(f.kship.connect(f.outsider).mintFromCarrierProof.staticCall(hash("no-record")));
  await at(f, f.starts[3]);
  const replay = await deploy("KUFOV4ReplayConverter", f.owner);
  await mined(f.registry.setOrgan(CONVERTER_ID, await replay.getAddress()));
  const carrier = hash("carrier-replay");
  await assert.rejects(replay.burnAndMint.staticCall(await f.kufo.getAddress(), await f.kship.getAddress(), owner, beneficiary, 11_000n, carrier));
  assert.equal(await f.kufo.balanceOf(owner), 11_000n, "even the current converter requires holder approval");
  await mined(f.kufo.approve(await replay.getAddress(), 11_000n));
  await mined(replay.burnAndMint(await f.kufo.getAddress(), await f.kship.getAddress(), owner, beneficiary, 11_000n, carrier));
  assert.equal(await f.kship.balanceOf(beneficiary), 11_000_000n);
  assert.equal(await f.kship.balanceOf(owner), 0n);
  const record = await f.kufo.carrierBurnRecord(carrier);
  assert.equal(record.owner, owner);
  assert.equal(record.beneficiary, beneficiary);
  assert.equal(record.converter, await replay.getAddress());
  assert.equal(record.expectedKship, 11_000_000n);
  await assert.rejects(replay.mintAgain.staticCall(await f.kship.getAddress(), carrier));
  await assert.rejects(replay.burnAndMint.staticCall(await f.kufo.getAddress(), await f.kship.getAddress(), owner, beneficiary, 1n, carrier));
  await assert.rejects(replay.mintAgain.staticCall(await f.kship.getAddress(), hash("fabricated-carrier")));
  await conservation(f);
});

test("calendar is explicit, immutable and hash-addressable; non-adopted clocks and bindings fail", async (t) => {
  const f = await fixture(t);
  assert.equal(await f.kufo.name(), "KUFO");
  assert.equal(await f.kufo.symbol(), "KUFO");
  const registry = await f.registry.getAddress();
  const kaios = await f.kaios.getAddress();
  const expectedHash = keccak256(AbiCoder.defaultAbiCoder().encode(
    ["bytes32", "uint64", "int32", "uint8[12]"],
    [VERSION, BASE, UTC_OFFSET, CONSTELLATIONS],
  ));
  assert.equal(await f.kufo.calendarHash(), expectedHash);
  assert.equal(await f.kufo.calendarVersion(), VERSION);
  assert.equal(await f.kufo.activationTime(), BigInt(BASE));
  assert.equal(await f.kufo.utcOffsetSeconds(), BigInt(UTC_OFFSET));
  assert.equal(await f.kufo.firstBirthYear(), BigInt(FIRST_YEAR));
  assert.equal(await f.kufo.firstBirthMonth(), 1n);
  const cfg = await f.kufo.calendarConfig();
  assert.deepEqual([cfg.version, cfg.activationTime, cfg.utcOffsetSeconds, Array.from(cfg.constellationByMonth)],
    [VERSION, BigInt(BASE), BigInt(UTC_OFFSET), CONSTELLATIONS.map(BigInt)]);
  for (let i = 0; i < f.starts.length; i += 1) assert.equal(await f.kufo.calendarBoundary(i), BigInt(f.starts[i]));
  for (let month = 1; month <= 12; month += 1) assert.equal(await f.kufo.constellationByMonth(month), BigInt(CONSTELLATIONS[month - 1]));
  const configs = [
    { ...f.calendar, version: ZeroHash },
    { ...f.calendar, activationTime: 0 },
    ...[0, -43_200, 50_400, 28_801].map(utcOffsetSeconds => ({ ...f.calendar, utcOffsetSeconds })),
    { ...f.calendar, constellationByMonth: Array.from({ length: 12 }, (_, i) => i + 1) },
    ...[0, 13, 11].map(value => ({ ...f.calendar, constellationByMonth: [value, ...CONSTELLATIONS.slice(1)] })),
  ];
  for (const config of configs) await rejectsKufoError(deploy("KUFO", f.owner, [registry, kaios, config]), f, "InvalidCalendar");
  for (const month of [0, 13]) await rejectsKufoError(f.kufo.constellationByMonth(month), f, "InvalidCalendar");
  await assert.rejects(deploy("KUFO", f.owner, [ZeroAddress, kaios, f.calendar]));
  await assert.rejects(deploy("KUFO", f.owner, [registry, ZeroAddress, f.calendar]));
  const otherRegistry = await deploy("KUFOV4MockOrganRegistry", f.owner);
  await rejectsCanonicalBinding(deploy("KUFO", f.owner, [await otherRegistry.getAddress(), kaios, f.calendar]), f.kufo);
  const otherKufo = await deploy("KUFO", f.owner, [registry, kaios, f.calendar]);
  const otherRegistryKship = await deploy("KSHIP", f.owner, [await otherRegistry.getAddress(), await f.kufo.getAddress()]);
  await rejectsCanonicalBinding(deploy("KSHIPConverter", f.owner, [await otherKufo.getAddress(), await f.kship.getAddress()]), f.converter);
  await rejectsCanonicalBinding(deploy("KSHIPConverter", f.owner, [await f.kufo.getAddress(), await otherRegistryKship.getAddress()]), f.converter);
  const eoa = await f.owner.getAddress();
  for (const args of [[eoa, await f.kship.getAddress()], [await f.kufo.getAddress(), eoa]]) {
    await assert.rejects(deploy("KSHIPConverter", f.owner, args), (error) => {
      const parsed = f.converter.interface.parseError(error.data ?? error.info?.error?.data?.result);
      assert.equal(parsed.name, "NotAContract");
      assert.deepEqual(Array.from(parsed.args), [eoa]);
      return true;
    });
  }
});
test("lifetime issuance cap cannot be recycled after terminal burn", async (t) => {
  const f = await fixture(t);
  const maximum = await f.kufo.MAX_SUPPLY();
  await mint(f, maximum);
  await at(f, f.starts[3]); // still the fourth valid issuance year
  await mined(f.converter.convert(maximum, await f.beneficiary.getAddress(), { gasLimit: GAS_BOUND }));
  assert.equal(await f.kufo.totalSupply(), 0n);
  assert.equal(await f.kship.totalSupply(), maximum * 1000n);
  const rejected = hash("cap-recycle");
  // This checks the lifetime guard itself before provenance reads. The full-cap
  // mint above separately proves the real KAIOS burn and conservation path.
  await assert.rejects(f.output.mintWithoutBurn.staticCall(await f.kufo.getAddress(), rejected, await f.owner.getAddress(), 1000n), (error) => {
    const parsed = f.kufo.interface.parseError(error.data);
    assert.equal(parsed.name, "LifetimeIssuanceExceeded");
    assert.deepEqual(Array.from(parsed.args), [1000n, 0n]);
    return true;
  });
  await assert.rejects(f.output.mint.staticCall(await f.kufo.getAddress(), rejected, await f.owner.getAddress(), 1000n));
  assert.equal(await f.kufo.proofMinted(rejected), false);
  assert.equal(await f.kufo.totalMintedFromAlchemy(), maximum);
  await conservation(f);
});

async function alchemyFixture(t, options = {}) {
  const f = await fixture(t, options.years ?? 4, { ...options, production: true });
  const { kgen, kaios } = f;
  const furnace = await deploy("KAIOSAlchemyFurnace", f.owner, [await kaios.getAddress(), await kgen.getAddress(), await f.registry.getAddress(), await f.kufo.getAddress()]);
  const realOutput = await deploy("KUFOOutputJindouyun168888", f.owner, [await furnace.getAddress(), await f.kufo.getAddress()]);
  await mined(f.registry.setOrgan(FURNACE_ID, await furnace.getAddress()));
  await mined(f.registry.setOrgan(OUTPUT_ID, await realOutput.getAddress()));
  return { ...f, kgen, kaios, furnace, realOutput };
}

async function rejectsKufoError(operation, f, name) {
  await assert.rejects(operation, (error) => {
    const data = error.data ?? error.info?.error?.data?.result;
    const parsed = f.kufo.interface.parseError(data);
    assert.equal(parsed.name, name);
    return true;
  });
}

async function mintFromFurnace(f, input, receiver, label) {
  const beneficiary = typeof receiver === "string" ? receiver : await receiver.getAddress();
  await mined(f.kaios.approve(await f.furnace.getAddress(), input));
  const receipt = await mined(f.furnace.burnForKufo(input, beneficiary, hash(label)));
  const created = receipt.logs.map((log) => {
    try { return f.furnace.interface.parseLog(log); } catch { return null; }
  }).find((log) => log?.name === "ImmediateAlchemyCreated");
  assert.ok(created);
  return created.args.proofId;
}

test("real main KAIOS spends holder allowance; KGEN is balance-only; world points 18911/168888/511111 preserve lineage", async (t) => {
  const f = await alchemyFixture(t);
  assert.equal(await f.kufo.TOKEN_POINT_18911(), 18_911n);
  assert.equal(await f.furnace.FURNACE_POINT(), 18_911n);
  assert.equal(await f.furnace.TOKEN_POINT(), 18_911n);
  assert.equal(await f.furnace.OUTPUT_POINT(), 168_888n);
  assert.equal(await f.realOutput.SOURCE_FURNACE_POINT(), 18_911n);
  assert.equal(await f.realOutput.TOKEN_POINT(), 18_911n);
  assert.equal(await f.realOutput.OUTPUT_POINT(), 168_888n);
  assert.equal(await f.kship.TOKEN_POINT_511111(), 511_111n);
  assert.equal(await f.converter.WORMHOLE_POINT_511111(), 511_111n);
  assert.equal(await f.furnace.canonicalKufo(), await f.kufo.getAddress());
  assert.equal(await f.realOutput.furnace(), await f.furnace.getAddress());
  assert.equal(await f.realOutput.kufo(), await f.kufo.getAddress());
  assert.equal(await f.kship.kufo(), await f.kufo.getAddress());
  assert.equal(await f.converter.kufo(), await f.kufo.getAddress());
  assert.equal(await f.converter.kship(), await f.kship.getAddress());
  const otherKgen = await deploy("MockKGEN", f.owner, [await f.owner.getAddress()]);
  const otherRegistry = await deploy("KUFOV4MockOrganRegistry", f.owner);
  await rejectsCanonicalBinding(deploy("KAIOSAlchemyFurnace", f.owner, [
    await f.kaios.getAddress(), await otherKgen.getAddress(), await f.registry.getAddress(), await f.kufo.getAddress(),
  ]), f.furnace);
  await rejectsCanonicalBinding(deploy("KAIOSAlchemyFurnace", f.owner, [
    await f.kaios.getAddress(), await f.kgen.getAddress(), await otherRegistry.getAddress(), await f.kufo.getAddress(),
  ]), f.furnace);
  const input = parseEther("0.001");
  const owner = await f.owner.getAddress();
  const beneficiary = await f.beneficiary.getAddress();
  const life = hash("local-fixture-not-a-life-identity-claim");
  const invalidAmounts = [
    { amount: 0n, error: "AlchemyAmountTooSmall", args: [0n, 1000n] },
    { amount: 999n, error: "AlchemyAmountTooSmall", args: [999n, 1000n] },
    { amount: 1001n, error: "InexactRatio", args: [1001n] },
  ];
  for (const invalid of invalidAmounts) {
    await assert.rejects(f.furnace.burnForKufo.staticCall(invalid.amount, beneficiary, life), (error) => {
      const parsed = f.furnace.interface.parseError(error.data);
      assert.equal(parsed.name, invalid.error);
      assert.deepEqual(Array.from(parsed.args), invalid.args);
      return true;
    });
  }
  // A holder with sufficient KAIOS and allowance but no KGEN still cannot mint.
  const outsider = await f.outsider.getAddress();
  const requiredKgen = input / 1000n;
  await mined(f.kaios.transfer(outsider, input));
  await mined(f.kaios.connect(f.outsider).approve(await f.furnace.getAddress(), input));
  await assert.rejects(f.furnace.connect(f.outsider).burnForKufo.staticCall(input, beneficiary, life), (error) => {
    const parsed = f.furnace.interface.parseError(error.data);
    assert.equal(parsed.name, "InsufficientKgenBalance");
    assert.deepEqual(Array.from(parsed.args), [0n, requiredKgen]);
    return true;
  });
  assert.equal(await f.kaios.balanceOf(outsider), input);
  assert.equal(await f.kgen.balanceOf(outsider), 0n);
  await mined(f.kgen.transfer(outsider, requiredKgen - 1n));
  await assert.rejects(f.furnace.connect(f.outsider).burnForKufo.staticCall(input, beneficiary, life), (error) => {
    const parsed = f.furnace.interface.parseError(error.data);
    assert.equal(parsed.name, "InsufficientKgenBalance");
    assert.deepEqual(Array.from(parsed.args), [requiredKgen - 1n, requiredKgen]);
    return true;
  });
  await mined(f.kgen.transfer(outsider, 1n));
  const preSimulationSupply = await f.kaios.totalSupply();
  const simulated = await f.furnace.connect(f.outsider).burnForKufo.staticCall(input, beneficiary, life);
  assert.equal(simulated[1], E18, "the exact KGEN threshold permits the complete alchemy path");
  assert.equal(await f.kgen.balanceOf(outsider), requiredKgen);
  assert.equal(await f.kaios.balanceOf(outsider), input);
  assert.equal(await f.kaios.allowance(outsider, await f.furnace.getAddress()), input);
  assert.equal(await f.kaios.totalSupply(), preSimulationSupply);
  assert.equal(await f.kaios.alchemyBurnCount(), 0n);
  assert.equal(await f.kufo.totalSupply(), 0n);
  const beforeKaios = await f.kaios.balanceOf(owner);
  const beforeKaiosSupply = await f.kaios.totalSupply();
  const beforeKgen = await f.kgen.balanceOf(owner);
  await assert.rejects(f.furnace.burnForKufo.staticCall(input, beneficiary, life));
  assert.equal(await f.kaios.balanceOf(owner), beforeKaios);
  await mined(f.kaios.approve(await f.furnace.getAddress(), input - 1n));
  await assert.rejects(f.furnace.burnForKufo.staticCall(input, beneficiary, life));
  await mined(f.kaios.approve(await f.furnace.getAddress(), input));
  const receipt = await mined(f.furnace.burnForKufo(input, beneficiary, life));
  const created = receipt.logs.map((log) => { try { return f.furnace.interface.parseLog(log); } catch { return null; } })
    .find((log) => log?.name === "ImmediateAlchemyCreated");
  assert.ok(created);
  const proof = created.args.proofId;
  const stored = await f.furnace.proof(proof);
  assert.equal(stored.consumed, true);
  assert.equal(stored.beneficiary, beneficiary);
  assert.equal(stored.requiredKgenBalance, parseEther("0.000001"));
  assert.equal(await f.kaios.balanceOf(owner), beforeKaios - input);
  assert.equal(await f.kaios.totalSupply(), beforeKaiosSupply - input);
  assert.equal(await f.kaios.allowance(owner, await f.furnace.getAddress()), 0n);
  assert.equal(await f.kgen.balanceOf(owner), beforeKgen);
  assert.equal(await f.kgen.allowance(owner, await f.furnace.getAddress()), 0n);
  assert.equal(await f.kgen.balanceOf(await f.furnace.getAddress()), 0n);
  assert.equal(await f.kufo.balanceOf(beneficiary), E18);
  assert.equal(await f.kufo.balanceOf(owner), 0n);
  const canonicalBurn = await f.kaios.alchemyBurnRecord(proof);
  assert.equal(canonicalBurn.owner, owner);
  assert.equal(canonicalBurn.beneficiary, beneficiary);
  assert.equal(canonicalBurn.furnace, await f.furnace.getAddress());
  assert.equal(canonicalBurn.kaiosBurned, input);
  assert.equal(canonicalBurn.expectedKufo, E18);
  assert.equal(canonicalBurn.destinationCode, await f.furnace.DESTINATION_168888());
  const origin = await f.kufo.mintOrigin(proof);
  assert.equal(origin.beneficiary, beneficiary);
  assert.equal(origin.amount, E18);
  const outletReceipt = receipt.logs.map(log => { try { return f.realOutput.interface.parseLog(log); } catch { return null; } })
    .find(log => log?.name === "KUFOReleased");
  assert.ok(outletReceipt, "the actual fixed outlet must release this same real burn proof");
  assert.equal(outletReceipt.args.proofId, proof);
  assert.equal(outletReceipt.args.beneficiary, beneficiary);
  assert.equal(outletReceipt.args.amount, E18);
  assert.equal(outletReceipt.args.groupId, origin.groupId);
  await assert.rejects(f.realOutput.connect(f.outsider).releaseImmediate.staticCall(proof));
  await assert.rejects(f.furnace.connect(f.outsider).consumeImmediateProof.staticCall(proof));
  await assert.rejects(f.eip1193.request({ method: "eth_call", params: [{
    from: await f.realOutput.getAddress(), to: await f.furnace.getAddress(),
    data: f.furnace.interface.encodeFunctionData("consumeImmediateProof", [proof]),
  }, "latest"] }));
  await at(f, f.starts[3]);
  const conversion = await mined(f.converter.connect(f.beneficiary).convert(E18, beneficiary));
  const carrierReceipt = conversion.logs.map(log => { try { return f.converter.interface.parseLog(log); } catch { return null; } })
    .find(log => log?.name === "KSHIPConversion");
  assert.ok(carrierReceipt, "the existing converter is the single KSHIP birth route");
  const carrierProof = carrierReceipt.args.proofId;
  assert.equal(carrierReceipt.args.owner, beneficiary);
  assert.equal(carrierReceipt.args.beneficiary, beneficiary);
  assert.equal(carrierReceipt.args.kufoBurned, E18);
  assert.equal(carrierReceipt.args.kshipMinted, E18 * 1000n);
  const carrierBurn = await f.kufo.carrierBurnRecord(carrierProof);
  assert.equal(carrierBurn.owner, beneficiary);
  assert.equal(carrierBurn.beneficiary, beneficiary);
  assert.equal(carrierBurn.converter, await f.converter.getAddress());
  assert.equal(carrierBurn.kufoBurned, E18);
  assert.equal(carrierBurn.expectedKship, E18 * 1000n);
  assert.equal(await f.kship.carrierProofMinted(carrierProof), true);
  assert.deepEqual(Array.from(await f.kufo.mintOrigin(proof)), Array.from(origin));
  assert.equal(await f.kaios.conservationInvariantHolds(), true);
  assert.equal(await f.kufo.balanceOf(beneficiary), 0n);
  assert.equal(await f.kship.balanceOf(beneficiary), parseEther("1000"));
  await conservation(f);
});

test("pre-activation alchemy fails atomically and a partial first month starts at activation", async (t) => {
  const activation = localTime(FIRST_YEAR, 5, 17, 12, 34, 56);
  const f = await alchemyFixture(t, { activationTime: activation, initialTime: activation - 1 });
  const input = parseEther("0.001");
  const owner = await f.owner.getAddress();
  const beneficiary = await f.beneficiary.getAddress();
  await mined(f.kaios.approve(await f.furnace.getAddress(), input));
  const before = { balance: await f.kaios.balanceOf(owner), supply: await f.kaios.totalSupply(), allowance: input };
  assert.equal(await f.kufo.groupCount(), 0n);
  await rejectsKufoError(f.furnace.burnForKufo.staticCall(input, beneficiary, hash("preactivation")), f, "IssuanceCalendarClosed");
  await assert.rejects(mined(f.furnace.burnForKufo(input, beneficiary, hash("preactivation-real-revert"), { gasLimit: GAS_BOUND })));
  assert.equal(await f.kaios.balanceOf(owner), before.balance);
  assert.equal(await f.kaios.totalSupply(), before.supply);
  assert.equal(await f.kaios.allowance(owner, await f.furnace.getAddress()), before.allowance);
  assert.equal(await f.kaios.alchemyBurnCount(), 0n);
  assert.equal(await f.kufo.totalSupply(), 0n);
  await at(f, activation);
  const proof = await mintFromFurnace(f, input, f.beneficiary, "exact-partial-month-activation");
  const origin = await f.kufo.mintOrigin(proof);
  assert.equal(origin.groupId, 5n);
  assert.equal(origin.bornAt, BigInt(activation));
  assert.equal(origin.birthMonth, 5n);
  assert.equal(origin.birthTierId, 5n);
  assert.equal(origin.birthConstellation, 2n);
  const metadata = await f.kufo.groupMetadata(5);
  assert.equal(metadata.start, BigInt(activation));
  assert.equal(metadata.end, BigInt(localTime(FIRST_YEAR, 6)));
  assert.equal(await f.kufo.groupCount(), 5n, "virtual ID bound is not a materialized-group count");
  await rejectsKufoError(f.kufo.birthGroup(owner, 4), f, "UnknownBirthGroup");
  await conservation(f);
});
test("the current output cannot mint without a real KAIOS burn or an already consumed proof", async (t) => {
  const f = await fixture(t);
  const owner = await f.owner.getAddress();
  const beforeSupply = await f.kaios.totalSupply();
  const beforeBalance = await f.kaios.balanceOf(owner);
  const beforeAllowance = await f.kaios.allowance(owner, await f.output.getAddress());
  const fabricated = hash("output-role-alone-does-not-prove-burn");
  await assert.rejects(mined(f.output.mintWithoutBurn(await f.kufo.getAddress(), fabricated, owner, 1000n, { gasLimit: GAS_BOUND })));
  await assert.rejects(mined(f.output.mintWithUnconsumedProof(await f.kufo.getAddress(), hash("not-consumed"), owner, 1000n, { gasLimit: GAS_BOUND })));
  assert.equal(await f.kufo.proofMinted(fabricated), false);
  assert.equal(await f.kaios.totalSupply(), beforeSupply);
  assert.equal(await f.kaios.balanceOf(owner), beforeBalance);
  assert.equal(await f.kaios.allowance(owner, await f.output.getAddress()), beforeAllowance);
  assert.equal(await f.kaios.alchemyBurnCount(), 0n);
  assert.equal(await f.kufo.totalSupply(), 0n);
  await conservation(f);
});

test("a real consumed KAIOS proof cannot mint a second KUFO instance", async (t) => {
  const f = await fixture(t);
  const owner = await f.owner.getAddress();
  const proof = await mint(f, 1000n, f.owner, "canonical-token-only-proof");
  const firstOrigin = await f.kufo.mintOrigin(proof);
  const second = await deploy("KUFO", f.owner, [await f.registry.getAddress(), await f.kaios.getAddress(), f.calendar]);
  await assert.rejects(f.output.mintWithoutBurn.staticCall(await second.getAddress(), proof, owner, 1000n), (error) => {
    const parsed = second.interface.parseError(error.data);
    assert.equal(parsed.name, "InvalidLineageProof");
    assert.equal(parsed.args[0], proof);
    return true;
  });
  assert.equal(await f.kufo.totalSupply(), 1000n);
  assert.equal(await second.totalSupply(), 0n);
  assert.equal(await second.proofMinted(proof), false);
  assert.deepEqual(Array.from(await f.kufo.mintOrigin(proof)), Array.from(firstOrigin));
  await conservation(f);
});

test("an outlet returning the correct tuple without minting rolls the entire real alchemy burn back", async (t) => {
  const f = await alchemyFixture(t);
  const owner = await f.owner.getAddress();
  const beneficiary = await f.beneficiary.getAddress();
  const input = parseEther("0.001");
  const noMint = await deploy("KUFOV4NoMintOutput", f.owner, [await f.furnace.getAddress()]);
  await mined(f.registry.setOrgan(OUTPUT_ID, await noMint.getAddress()));
  await mined(f.kaios.approve(await f.furnace.getAddress(), input));
  const before = { balance: await f.kaios.balanceOf(owner), supply: await f.kaios.totalSupply(), burned: await f.kaios.totalKaiosBurnedForAlchemy() };
  await assert.rejects(mined(f.furnace.burnForKufo(input, beneficiary, hash("no-mint-correct-tuple"), { gasLimit: GAS_BOUND })));
  assert.equal(await f.kaios.balanceOf(owner), before.balance);
  assert.equal(await f.kaios.totalSupply(), before.supply);
  assert.equal(await f.kaios.totalKaiosBurnedForAlchemy(), before.burned);
  assert.equal(await f.kaios.allowance(owner, await f.furnace.getAddress()), input);
  assert.equal(await f.kaios.alchemyBurnCount(), 0n);
  assert.equal(await f.kufo.totalSupply(), 0n);
  await conservation(f);
});

test("whole-month births preserve immutable tier and constellation while annual rights use January 1", async (t) => {
  const f = await fixture(t);
  const owner = await f.owner.getAddress();
  const early = await mint(f, 1000n, f.owner, "january-birth");
  await at(f, localTime(FIRST_YEAR, 2) - 1);
  const last = await mint(f, 1000n, f.recipient, "january-last-second");
  await at(f, localTime(FIRST_YEAR, 2));
  const changedMonth = await mint(f, 1000n, f.owner, "february-first-second");
  const earlyOrigin = await f.kufo.mintOrigin(early);
  const lastOrigin = await f.kufo.mintOrigin(last);
  const nextOrigin = await f.kufo.mintOrigin(changedMonth);
  assert.equal(earlyOrigin.groupId, 1n);
  assert.equal(lastOrigin.groupId, 1n);
  assert.equal(nextOrigin.groupId, 2n);
  assert.equal(nextOrigin.birthYear, earlyOrigin.birthYear);
  assert.equal(nextOrigin.birthMonth, 2n);
  assert.equal(nextOrigin.birthTierId, 2n);
  assert.equal(nextOrigin.birthConstellation, 11n);
  assert.equal(nextOrigin.calendarHash, await f.kufo.calendarHash());
  const groupBefore = Array.from(await f.kufo.groupMetadata(1));
  await mined(f.kufo.transferGroups(await f.victim.getAddress(), 317n, [1]));
  assert.deepEqual(Array.from(await f.kufo.mintOrigin(early)), Array.from(earlyOrigin));
  assert.equal(await f.kufo.claimableDecay(owner, FIRST_YEAR), 0n, "month rollover is not annual maturity");
  await at(f, f.starts[1]);
  const changedYear = await mint(f, 1000n, f.recipient, "january-new-year");
  const yearOrigin = await f.kufo.mintOrigin(changedYear);
  assert.equal(yearOrigin.groupId, 13n);
  assert.equal(yearOrigin.birthYear, BigInt(FIRST_YEAR + 1));
  assert.equal(yearOrigin.birthMonth, 1n);
  assert.equal(yearOrigin.birthTierId, 1n);
  assert.equal(yearOrigin.birthConstellation, 10n);
  assert.equal(await f.kufo.claimableDecay(owner, FIRST_YEAR), 842n);
  assert.equal(await f.kufo.claimableDecay(await f.recipient.getAddress(), FIRST_YEAR + 1), 0n);
  await at(f, localTime(FIRST_YEAR + 20));
  await mined(f.converter.convertGroups(await f.kufo.balanceOf(owner), owner, [1, 2]));
  assert.deepEqual(Array.from(await f.kufo.mintOrigin(early)), Array.from(earlyOrigin));
  assert.deepEqual(Array.from(await f.kufo.groupMetadata(1)), groupBefore);
  await conservation(f);
});
test("33 active groups require explicit batches and selected transfer/convert remains bounded", async (t) => {
  const f = await fixture(t);
  const owner = await f.owner.getAddress();
  const recipient = await f.recipient.getAddress();
  for (let i = 0; i < 33; i += 1) {
    await at(f, monthTime(i) + 1);
    await mint(f, 1000n, f.owner, `bounded-group-${i}`);
  }
  const ids = Array.from({ length: 32 }, (_, i) => i + 1);
  assert.deepEqual(Array.from(await f.kufo.heldGroups(owner, 0, 32)), ids.map(BigInt));
  assert.deepEqual(Array.from(await f.kufo.heldGroups(owner, 32, 32)), [33n]);
  for (const limit of [0, 33]) await rejectsKufoError(f.kufo.heldGroups(owner, 0, limit), f, "InvalidPageLimit");
  await rejectsKufoError(f.kufo.claimableTotal(owner), f, "GroupBatchRequired");
  await rejectsKufoError(f.converter.convert.staticCall(33_000n, recipient), f, "GroupBatchRequired");
  assert.equal(await f.kufo.claimableForGroups(owner, ids), 15_000n);
  const invalid = [[], [0], [2, 1], [1, 1], [...ids, 33], [65_535]];
  for (const selected of invalid) await assert.rejects(f.kufo.transferGroups.staticCall(recipient, 1n, selected));
  await assert.rejects(f.kufo.transfer.staticCall(recipient, 33_000n), /GroupBatchRequired/);
  await assert.rejects(mined(f.kufo.transfer(recipient, 33_000n, { gasLimit: GAS_BOUND })));
  assert.equal(await f.kufo.balanceOf(owner), 33_000n);
  assert.equal(await f.kufo.balanceOf(recipient), 0n);
  await at(f, f.starts.at(-1) + 1_000_000);
  assert.equal(await f.kufo.claimableForGroups(owner, ids), 32_000n);
  const beforeRejectedConversion = {
    allowance: await f.kufo.allowance(owner, await f.converter.getAddress()),
    count: await f.converter.conversionCount(),
    supply: await f.kufo.totalSupply(),
    decayed: await f.kufo.totalDecayedForKship(),
    groups: await Promise.all(ids.map(async (id) => tranches(await f.kufo.birthGroup(owner, id)))),
  };
  await assert.rejects(f.converter.convert.staticCall(33_000n, owner), (error) => {
    const parsed = f.kufo.interface.parseError(error.data);
    assert.equal(parsed.name, "GroupBatchRequired");
    assert.deepEqual(Array.from(parsed.args), [32n]);
    return true;
  });
  await assert.rejects(mined(f.converter.convert(33_000n, owner, { gasLimit: GAS_BOUND })));
  assert.equal(await f.kufo.allowance(owner, await f.converter.getAddress()), beforeRejectedConversion.allowance);
  assert.equal(await f.converter.conversionCount(), beforeRejectedConversion.count);
  assert.equal(await f.kufo.totalSupply(), beforeRejectedConversion.supply);
  assert.equal(await f.kufo.totalDecayedForKship(), beforeRejectedConversion.decayed);
  assert.equal(await f.kufo.balanceOf(owner), 33_000n);
  assert.equal(await f.kship.totalSupply(), 0n);
  assert.deepEqual(await Promise.all(ids.map(async (id) => tranches(await f.kufo.birthGroup(owner, id)))), beforeRejectedConversion.groups);
  await assert.rejects(f.kufo.connect(f.outsider).transferFromGroups.staticCall(owner, recipient, 32_000n, ids));
  await mined(f.kufo.approve(await f.outsider.getAddress(), 32_000n));
  const move = await mined(f.kufo.connect(f.outsider).transferFromGroups(owner, recipient, 32_000n, ids, { gasLimit: GAS_BOUND }));
  assert.equal(await f.kufo.allowance(owner, await f.outsider.getAddress()), 0n);
  assert.ok(move.gasUsed < GAS_BOUND);
  assert.equal(await f.kufo.balanceOf(owner), 1000n);
  assert.equal(await f.kufo.balanceOf(recipient), 32_000n);
  assert.deepEqual(Array.from(await f.kufo.heldGroups(owner, 0, 32)), [33n]);
  assert.deepEqual(Array.from(await f.kufo.heldGroups(recipient, 0, 32)), ids.map(BigInt));
  await at(f, f.starts.at(-1) + 1_000_000);
  const allowance = await f.kufo.allowance(recipient, await f.converter.getAddress());
  const count = await f.converter.conversionCount();
  for (const selected of invalid) await assert.rejects(f.converter.connect(f.recipient).convertGroups.staticCall(1n, recipient, selected));
  assert.equal(await f.kufo.allowance(recipient, await f.converter.getAddress()), allowance);
  assert.equal(await f.converter.conversionCount(), count);
  const convert = await mined(f.converter.connect(f.recipient).convertGroups(32_000n, recipient, ids, { gasLimit: GAS_BOUND }));
  assert.ok(convert.gasUsed < GAS_BOUND);
  await mined(f.converter.convertGroups(1000n, owner, [33]));
  assert.equal(await f.kufo.totalSupply(), 0n);
  assert.equal(await f.kship.totalSupply(), 33_000_000n);
  t.diagnostic(`candidate batch32: transfer gas=${move.gasUsed}; conversion gas=${convert.gasUsed}; bound=${GAS_BOUND}`);
  await conservation(f);
});

test("constant-size civil calendar and alchemy pair deploy within fixed Shanghai gas limits", async (t) => {
  const f = await alchemyFixture(t);
  let pairGas = 0n;
  for (const contract of [f.kufo, f.furnace, f.realOutput]) {
    const tx = contract.deploymentTransaction();
    const receipt = await tx.wait();
    const initBytes = (tx.data.length - 2) / 2;
    assert.ok(initBytes <= 49_152, "Shanghai initcode limit stays enabled");
    assert.ok(receipt.gasUsed < GAS_BOUND, "each deployment retains the 8M operation ceiling");
    pairGas += receipt.gasUsed;
    t.diagnostic(`deployment ${await contract.getAddress()}: initcode=${initBytes}; gas=${receipt.gasUsed}`);
  }
  assert.ok(pairGas < GAS_BOUND, "KUFO/furnace/outlet combined local deployment remains bounded");
  const before = await f.kufo.calendarHash();
  await at(f, localTime(12_027));
  assert.equal(await f.kufo.groupCount(), 120_001n);
  assert.equal(await f.kufo.calendarHash(), before);
  assert.equal(await f.kufo.totalSupply(), 0n, "virtual months never create token supply");
  assert.equal(await f.kufo.activeGroupCount(await f.owner.getAddress()), 0n);
});
async function adversarialCarrierFixture(t) {
  const f = await fixture(t);
  const adversarialKship = await deploy("KUFOV4AdversarialKship", f.owner, [
    await f.registry.getAddress(), await f.kufo.getAddress(), await f.victim.getAddress(),
  ]);
  const adversarialConverter = await deploy("KSHIPConverter", f.owner, [await f.kufo.getAddress(), await adversarialKship.getAddress()]);
  await mint(f, 1000n, f.owner, "adversarial-carrier-real-burn-origin");
  await mined(f.registry.setOrgan(CONVERTER_ID, await adversarialConverter.getAddress()));
  await mined(f.kufo.approve(await adversarialConverter.getAddress(), 1000n));
  await at(f, f.starts[3]);
  return { ...f, adversarialKship, adversarialConverter };
}

async function carrierRollbackState(f, proofId) {
  const owner = await f.owner.getAddress();
  const beneficiary = await f.beneficiary.getAddress();
  const wrongRecipient = await f.victim.getAddress();
  const converter = await f.adversarialConverter.getAddress();
  return {
    kufoOwner: await f.kufo.balanceOf(owner),
    kufoBeneficiary: await f.kufo.balanceOf(beneficiary),
    cohort: tranches(await f.kufo.cohort(owner, FIRST_YEAR)),
    birthGroup: tranches(await f.kufo.birthGroup(owner, 1)),
    allowance: await f.kufo.allowance(owner, converter),
    kufoSupply: await f.kufo.totalSupply(),
    kufoMinted: await f.kufo.totalMintedFromAlchemy(),
    decayed: await f.kufo.totalDecayedForKship(),
    conversionCount: await f.adversarialConverter.conversionCount(),
    carrierRecord: Array.from(await f.kufo.carrierBurnRecord(proofId)),
    kshipSupply: await f.adversarialKship.totalSupply(),
    kshipBalances: await Promise.all([owner, beneficiary, wrongRecipient, converter].map((address) => f.adversarialKship.balanceOf(address))),
    kshipMinted: await f.adversarialKship.totalMintedFromKufo(),
    proofMinted: await f.adversarialKship.carrierProofMinted(proofId),
    fault: await f.adversarialKship.fault(),
  };
}

async function rejectsAtomicCarrierRelease(f, entrypoint) {
  const owner = await f.owner.getAddress();
  const beneficiary = await f.beneficiary.getAddress();
  const number = await f.adversarialConverter.conversionCount() + 1n;
  const chainId = (await f.provider.getNetwork()).chainId;
  const proofId = keccak256(AbiCoder.defaultAbiCoder().encode(
    ["uint256", "address", "uint256", "address", "address", "uint256"],
    [chainId, await f.adversarialConverter.getAddress(), number, owner, beneficiary, 1000n],
  ));
  const before = await carrierRollbackState(f, proofId);
  const args = [1000n, beneficiary];
  if (entrypoint === "convertGroups") args.push([1]);
  const method = f.adversarialConverter[entrypoint];
  await assert.rejects(method.staticCall(...args), (error) => {
    const data = error.data ?? error.info?.error?.data?.result;
    const parsed = f.adversarialConverter.interface.parseError(data);
    if (before.fault === 5n) {
      assert.equal(parsed.name, "Error");
      assert.deepEqual(Array.from(parsed.args), ["LINEAGE_MISMATCH"]);
    } else {
      assert.equal(parsed.name, "CanonicalKshipReleaseMissing");
      assert.deepEqual(Array.from(parsed.args), [proofId]);
    }
    return true;
  });
  await assert.rejects(mined(method(...args, { gasLimit: GAS_BOUND })));
  assert.deepEqual(await carrierRollbackState(f, proofId), before);
  await conservation(f);
}

test("converter rejects no-mint KSHIP output and rolls back real KUFO", async (t) => {
  const f = await adversarialCarrierFixture(t);
  for (const entrypoint of ["convert", "convertGroups"]) await rejectsAtomicCarrierRelease(f, entrypoint);
});

test("converter rejects inconsistent KSHIP release modes and preserves all state", async (t) => {
  const f = await adversarialCarrierFixture(t);
  const faults = [
    { mode: 1, name: "wrong recipient" },
    { mode: 2, name: "short amount" },
    { mode: 3, name: "wrong cumulative minted amount" },
    { mode: 4, name: "carrier proof not marked minted" },
    { mode: 5, name: "mismatched returned tuple" },
  ];
  for (const fault of faults) {
    await mined(f.adversarialKship.setFault(fault.mode));
    for (const entrypoint of ["convert", "convertGroups"]) await rejectsAtomicCarrierRelease(f, entrypoint);
    t.diagnostic(`atomic rejection verified for ${fault.name} through both converter entrypoints`);
  }
});

test("each of the twelve adopted whole months has the exact civil range, tier and constellation", async (t) => {
  const f = await fixture(t);
  const proofs = [];
  const owner = await f.owner.getAddress();
  for (let month = 1; month <= 12; month += 1) {
    const start = localTime(FIRST_YEAR, month);
    const end = localTime(FIRST_YEAR, month + 1);
    await at(f, start + 1);
    const proof = await mint(f, 1000n, f.owner, `whole-month-${month}`);
    proofs.push({ proof, origin: Array.from(await f.kufo.mintOrigin(proof)) });
    const origin = await f.kufo.mintOrigin(proof);
    assert.deepEqual([origin.birthYear, origin.birthMonth, origin.birthTierId, origin.birthConstellation, origin.groupId],
      [BigInt(FIRST_YEAR), BigInt(month), BigInt(month), BigInt(CONSTELLATIONS[month - 1]), BigInt(month)]);
    const metadata = await f.kufo.groupMetadata(month);
    assert.deepEqual(Array.from(metadata), [BigInt(start), BigInt(end), BigInt(FIRST_YEAR), BigInt(month), BigInt(month), BigInt(CONSTELLATIONS[month - 1])]);
    assert.equal((await f.kufo.birthGroupAt(start)).id, BigInt(month));
    assert.equal(await f.kufo.claimableDecay(owner, FIRST_YEAR), 0n);
  }
  assert.equal(await f.kufo.activeGroupCount(owner), 12n);
  assert.equal(await f.kufo.activeCohortCount(owner), 1n);
  assert.equal(await f.kufo.balanceOf(owner), 12_000n);
  await at(f, f.starts[1]);
  assert.equal(await f.kufo.claimableDecay(owner, FIRST_YEAR), 6000n);
  assert.equal(await f.kufo.groupCount(), 13n);
  assert.deepEqual(tranches(await f.kufo.cohort(owner, FIRST_YEAR)), [6000n, 3000n, 3000n]);
  for (let month = 1; month <= 12; month += 1) {
    assert.equal(await f.kufo.groupCalendarHash(month), await f.kufo.calendarHash());
    assert.equal(proofs[month - 1].origin[4], BigInt(month));
    assert.deepEqual(Array.from(await f.kufo.mintOrigin(proofs[month - 1].proof)), proofs[month - 1].origin);
  }
  await conservation(f);
});
test("UTC+8 month and year boundaries use the adopted civil clock without a wallet identity change", async (t) => {
  const f = await fixture(t);
  const samples = [
    [localTime(2027, 2) - 1, [2027n, 1n, 31n], 1n],
    [localTime(2027, 2), [2027n, 2n, 1n], 2n],
    [localTime(2028) - 1, [2027n, 12n, 31n], 12n],
    [localTime(2028), [2028n, 1n, 1n], 13n],
    [localTime(2028, 2, 29), [2028n, 2n, 29n], 14n],
  ];
  const original = await mint(f, 1000n, f.owner, "immutable-january-civil-birth");
  const birth = Array.from(await f.kufo.mintOrigin(original));
  for (const [timestamp, date, id] of samples) {
    assert.deepEqual(Array.from(await f.kufo.civilDate(timestamp)), date);
    assert.equal((await f.kufo.birthGroupAt(timestamp)).id, id);
  }
  await at(f, localTime(2028, 2, 29));
  assert.deepEqual(Array.from(await f.kufo.mintOrigin(original)), birth);
  assert.equal(await f.kufo.balanceOf(await f.owner.getAddress()), 1000n);
  assert.equal(await f.kufo.claimableDecay(await f.owner.getAddress(), 2027), 500n);
  assert.equal(await f.kufo.totalDecayedForKship(), 0n);
  await rejectsKufoError(f.kufo.transferGroups.staticCall(await f.recipient.getAddress(), 1n, [15]), f, "InvalidGroupSelection");
  await rejectsKufoError(f.kufo.birthGroup(await f.owner.getAddress(), 15), f, "UnknownBirthGroup");
  const future = await f.kufo.groupMetadata(15);
  assert.equal(future.start, BigInt(localTime(2028, 3)), "future metadata is predictable but not mint authority");
  await conservation(f);
});
test("real alchemy continues through 2039 and 12027 without governance or rewriting an old origin", async (t) => {
  const f = await alchemyFixture(t);
  const owner = await f.owner.getAddress();
  const initialHash = await f.kufo.calendarHash();
  const input = parseEther("0.001");
  const firstProof = await mintFromFurnace(f, input, f.owner, "first-civil-birth");
  const firstOrigin = await f.kufo.mintOrigin(firstProof);
  const initialMetadata = Array.from(await f.kufo.groupMetadata(firstOrigin.groupId));
  const later = [];
  for (const year of [2039, 12_027]) {
    await at(f, localTime(year, 7, 4, 12));
    const proof = await mintFromFurnace(f, input, f.owner, `continuous-birth-${year}`);
    const origin = await f.kufo.mintOrigin(proof);
    later.push(origin);
    assert.equal(origin.birthYear, BigInt(year));
    assert.equal(origin.birthMonth, 7n);
    assert.equal(origin.birthTierId, 7n);
    assert.equal(origin.birthConstellation, 4n);
    assert.equal(origin.groupId, BigInt((year - FIRST_YEAR) * 12 + 7));
    assert.equal(origin.calendarHash, initialHash);
    assert.equal(await f.kufo.groupCalendarHash(origin.groupId), initialHash);
    assert.equal(await f.kufo.claimableForGroups(owner, [origin.groupId]), 0n);
  }
  assert.ok(later[1].groupId > 65_535n, "real canonical burn creates a high sparse group ID");
  assert.equal(await f.kufo.calendarHash(), initialHash);
  assert.deepEqual(Array.from(await f.kufo.mintOrigin(firstProof)), Array.from(firstOrigin));
  assert.deepEqual(Array.from(await f.kufo.groupMetadata(firstOrigin.groupId)), initialMetadata);
  await mined(f.kufo.transferGroups(await f.recipient.getAddress(), 317n, [firstOrigin.groupId]));
  await mined(f.converter.convertGroups(E18 - 317n, owner, [firstOrigin.groupId]));
  await mined(f.converter.connect(f.recipient).convertGroups(317n, await f.recipient.getAddress(), [firstOrigin.groupId]));
  assert.equal(await f.kufo.totalSupply(), 2n * E18);
  assert.equal(await f.kship.totalSupply(), E18 * 1000n);
  assert.deepEqual(Array.from(await f.kufo.mintOrigin(firstProof)), Array.from(firstOrigin));
  await conservation(f);
});
test("Gregorian century, leap-century and year-10000 dates match an independent Date oracle", async (t) => {
  const f = await fixture(t);
  for (const year of [2099, 2100, 2101, 2399, 2400, 2401, 9999, 10_000, 10_001]) {
    const february = localTime(year, 2);
    const march = localTime(year, 3);
    const expectedDays = (march - february) / 86400;
    assert.equal(expectedDays, year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28);
    for (const timestamp of [february, march - 1, march, localTime(year + 1) - 1, localTime(year + 1)]) {
      const date = new Date((timestamp + UTC_OFFSET) * 1000);
      assert.deepEqual(Array.from(await f.kufo.civilDate(timestamp)),
        [BigInt(date.getUTCFullYear()), BigInt(date.getUTCMonth() + 1), BigInt(date.getUTCDate())]);
      const id = BigInt((date.getUTCFullYear() - FIRST_YEAR) * 12 + date.getUTCMonth() + 1);
      assert.equal((await f.kufo.birthGroupAt(timestamp)).id, id);
      const metadata = await f.kufo.groupMetadata(id);
      assert.equal(metadata.start, BigInt(localTime(date.getUTCFullYear(), date.getUTCMonth() + 1)));
      assert.equal(metadata.end, BigInt(localTime(date.getUTCFullYear(), date.getUTCMonth() + 2)));
    }
  }
  await rejectsKufoError(f.kufo.civilDate(1n << 64n), f, "InvalidCalendarTimestamp");
  await rejectsKufoError(f.kufo.civilDate((1n << 64n) - 1n), f, "CalendarIdentifierOverflow");
  const maximum = await f.kufo.maximumGroupId();
  assert.equal(maximum, 0xffff_ffffn);
  const last = await f.kufo.groupMetadata(maximum);
  assert.equal(last.financialYear, BigInt(FIRST_YEAR) + (maximum - 1n) / 12n);
  assert.equal((await f.kufo.birthGroupAt(last.start)).id, maximum);
  await rejectsKufoError(f.kufo.birthGroupAt(last.end), f, "CalendarIdentifierOverflow");
  await rejectsKufoError(f.kufo.groupMetadata(maximum + 1n), f, "UnknownBirthGroup");
  await rejectsKufoError(f.kufo.calendarBoundary(0xffff_ffffn), f, "CalendarIdentifierOverflow");
  assert.equal(await f.kufo.totalSupply(), 0n, "date queries cannot create birth rights");
});
test("century, millennium and ten-thousand-year old cohorts remain movable and settleable within a fixed gas bound", async (t) => {
  const f = await fixture(t);
  const holders = [f.owner, f.beneficiary, f.outsider];
  const proofs = [];
  for (const [index, holder] of holders.entries()) proofs.push(await mint(f, 1000n, holder, `long-voyage-${index}`));
  const origins = await Promise.all(proofs.map(async (proof) => Array.from(await f.kufo.mintOrigin(proof))));
  await mined(f.kufo.transfer(await f.victim.getAddress(), 1n));
  const horizons = [100, 1000, 10_000];
  const transferGas = [];
  for (let i = 0; i < holders.length; i += 1) {
    await at(f, localTime(FIRST_YEAR + horizons[i]));
    const amount = await f.kufo.balanceOf(await holders[i].getAddress());
    const moved = await mined(f.kufo.connect(holders[i]).transfer(await f.recipient.getAddress(), amount, { gasLimit: GAS_BOUND }));
    const settled = await mined(f.converter.connect(f.recipient).convert(amount, await holders[i].getAddress(), { gasLimit: GAS_BOUND }));
    assert.ok(moved.gasUsed < GAS_BOUND);
    assert.ok(settled.gasUsed < GAS_BOUND);
    transferGas.push(moved.gasUsed);
    assert.equal(await f.kufo.balanceOf(await f.recipient.getAddress()), 0n);
  }
  assert.ok(transferGas[2] <= transferGas[0] + 100_000n, "elapsed years must not become a transfer traversal");
  await mined(f.kufo.connect(f.victim).transfer(await f.recipient.getAddress(), 1n));
  await mined(f.converter.connect(f.recipient).convert(1n, await f.victim.getAddress()));
  assert.equal(await f.kufo.totalSupply(), 0n);
  assert.equal(await f.kship.totalSupply(), 3_000_000n);
  await assert.rejects(f.converter.connect(f.recipient).convert.staticCall(1n, await f.recipient.getAddress()));
  for (let i = 0; i < proofs.length; i += 1) assert.deepEqual(Array.from(await f.kufo.mintOrigin(proofs[i])), origins[i]);
  t.diagnostic(`100/1000/10000-year civil voyage transfer gas=${transferGas.join(",")}`);
  await conservation(f);
});

test("an independent year-12027 calendar preserves wide timestamps and final settlement", async (t) => {
  const firstYear = 12_027;
  const starts = boundaries(4, firstYear);
  const f = await alchemyFixture(t, { firstYear });
  const owner = await f.owner.getAddress();
  const proof = await mintFromFurnace(f, parseEther("0.001"), f.owner, "far-year-current-birth");
  const origin = await f.kufo.mintOrigin(proof);
  assert.equal(origin.birthYear, BigInt(firstYear));
  assert.ok(origin.bornAt > 0xffff_ffffn);
  assert.equal(origin.bornAt, BigInt(starts[0] + 10));
  assert.equal(origin.calendarHash, await f.kufo.groupCalendarHash(origin.groupId));
  await at(f, starts[1]);
  assert.equal(await f.kufo.claimableForGroups(owner, [origin.groupId]), E18 / 2n);
  await mined(f.converter.convertGroups(E18 / 2n, owner, [origin.groupId]));
  await at(f, starts[3]);
  await mined(f.converter.convertGroups(E18 / 2n, owner, [origin.groupId]));
  assert.equal(await f.kufo.totalSupply(), 0n);
  assert.equal(await f.kship.totalSupply(), E18 * 1000n);
  assert.deepEqual(Array.from(await f.kufo.mintOrigin(proof)), Array.from(origin));
  await conservation(f);
});

test("the internal held-group bitmap orders all uint32 tiers without creating calendar rights", async (t) => {
  const f = await fixture(t);
  const actor = await deploy("KUFOV4BitmapHarness", f.owner, [await f.registry.getAddress(), await f.kaios.getAddress(), f.calendar]);
  const holder = await f.owner.getAddress();
  const other = await f.recipient.getAddress();
  const maximum = 0xffff_ffffn;
  const ids = [1n, 255n, 256n, 257n, 65_535n, 65_536n, 65_537n, 16_777_215n, 16_777_216n, 16_777_217n, maximum - 1n, maximum];
  const shuffled = [...ids];
  let seed = 0x637;
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    seed = (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0;
    const index = seed % (i + 1);
    [shuffled[i], shuffled[index]] = [shuffled[index], shuffled[i]];
  }
  const queries = new Set([0n, maximum + 1n]);
  for (let i = 0; i < ids.length; i += 1) {
    queries.add(ids[i] - 1n);
    queries.add(ids[i]);
    queries.add(ids[i] + 1n);
    if (i + 1 < ids.length) queries.add(ids[i] + (ids[i + 1] - ids[i]) / 2n);
  }
  const present = new Set();
  async function checkSuccessors() {
    const sorted = [...present].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
    for (const after of queries) {
      const expected = sorted.find((id) => id > after) ?? 0n;
      assert.equal(await actor.testNextHeld(holder, after), expected, `successor after ${after}`);
    }
    assert.equal(await actor.testNextHeld(other, 0), 0n, "holder indexes remain independent");
  }
  for (const id of shuffled) {
    await mined(actor.testSetHeld(holder, id));
    present.add(id);
  }
  await checkSuccessors();
  await assert.rejects(actor.testSetHeld.staticCall(holder, ids[0]), (error) => {
    const parsed = actor.interface.parseError(error.data);
    assert.equal(parsed.name, "Panic");
    assert.deepEqual(Array.from(parsed.args), [1n]);
    return true;
  });
  for (const id of [0n, maximum + 1n]) {
    for (const method of [actor.testSetHeld, actor.testClearHeld]) {
      await assert.rejects(method.staticCall(holder, id), (error) => {
        const parsed = actor.interface.parseError(error.data);
        assert.equal(parsed.name, "UnknownBirthGroup");
        assert.deepEqual(Array.from(parsed.args), [id]);
        return true;
      });
    }
  }
  for (const id of [...shuffled].reverse()) {
    await mined(actor.testClearHeld(holder, id));
    present.delete(id);
    await checkSuccessors();
  }
  await assert.rejects(actor.testClearHeld.staticCall(holder, ids[0]), (error) => {
    const parsed = actor.interface.parseError(error.data);
    assert.equal(parsed.name, "Panic");
    assert.deepEqual(Array.from(parsed.args), [1n]);
    return true;
  });
  const reinserted = [maximum, 65_536n, 1n, 16_777_216n, 256n];
  for (const id of reinserted) {
    await mined(actor.testSetHeld(holder, id));
    present.add(id);
    await checkSuccessors();
  }
  for (const id of reinserted) {
    await mined(actor.testClearHeld(holder, id));
    present.delete(id);
    await checkSuccessors();
  }
  assert.equal(await actor.groupCount(), 1n, "index unit inputs do not create real calendar groups");
  assert.equal(await actor.totalSupply(), 0n);
  assert.equal(await actor.totalMintedFromAlchemy(), 0n);
  assert.equal(await actor.balanceOf(holder), 0n);
  assert.equal(await actor.activeGroupCount(holder), 0n);
});

test("real holder indexes and annual aggregates match every birth group through transfers and settlement", async (t) => {
  const f = await fixture(t);
  const holders = [f.owner, f.recipient, f.victim, f.beneficiary, f.outsider];
  const groupIds = [1, 2, 13];
  const count = groupIds.length;
  const metadata = await Promise.all(groupIds.map(id => f.kufo.groupMetadata(id)));
  const years = [...new Set(metadata.map((group) => group.financialYear))];
  async function checkPortfolios() {
    const state = [];
    let allBalances = 0n;
    for (const holder of holders) {
      const address = await holder.getAddress();
      const rows = await Promise.all(groupIds.map(async id => tranches(await f.kufo.birthGroup(address, id))));
      const expectedIds = [];
      const annual = new Map(years.map((year) => [year, [0n, 0n, 0n]]));
      for (let i = 0; i < rows.length; i += 1) {
        if (sum(rows[i]) !== 0n) expectedIds.push(BigInt(groupIds[i]));
        const aggregate = annual.get(metadata[i].financialYear);
        for (let field = 0; field < 3; field += 1) aggregate[field] += rows[i][field];
      }
      const indexed = [];
      let after = 0n;
      while (true) {
        const page = Array.from(await f.kufo.heldGroups(address, after, 2));
        if (page.length === 0) break;
        assert.ok(page[0] > after, "pagination must advance");
        indexed.push(...page);
        assert.ok(indexed.length <= count, "index traversal must terminate");
        after = page.at(-1);
      }
      assert.deepEqual(indexed, expectedIds);
      assert.equal(await f.kufo.activeGroupCount(address), BigInt(expectedIds.length));
      let activeYears = 0n;
      for (const [year, expected] of annual) {
        assert.deepEqual(tranches(await f.kufo.cohort(address, year)), expected);
        if (sum(expected) !== 0n) activeYears += 1n;
      }
      assert.equal(await f.kufo.activeCohortCount(address), activeYears);
      const balance = await f.kufo.balanceOf(address);
      assert.equal(rows.reduce((total, row) => total + sum(row), 0n), balance);
      allBalances += balance;
      state.push({ address, rows, indexed, balance, annual: [...annual], activeYears });
    }
    assert.equal(allBalances, await f.kufo.totalSupply());
    await conservation(f);
    return state;
  }
  await mint(f, 1000n, f.owner, "index-origin-first");
  await mint(f, 1000n, f.recipient, "index-recipient-first");
  await at(f, localTime(FIRST_YEAR, 2) + 100);
  await mint(f, 2000n, f.owner, "index-origin-second-window");
  await at(f, localTime(FIRST_YEAR + 1) + 100);
  await mint(f, 1000n, f.owner, "index-origin-next-year");
  await checkPortfolios();
  await mined(f.kufo.transfer(await f.victim.getAddress(), 317n));
  const beforeSelf = await checkPortfolios();
  await mined(f.kufo.transfer(await f.owner.getAddress(), 123n));
  await mined(f.kufo.transfer(await f.beneficiary.getAddress(), 0n));
  assert.deepEqual(await checkPortfolios(), beforeSelf);
  await mined(f.kufo.transferGroups(await f.recipient.getAddress(), 113n, [2]));
  await checkPortfolios();
  await mined(f.converter.convertGroups(100n, await f.beneficiary.getAddress(), [1]));
  const beforeRevert = await checkPortfolios();
  await assert.rejects(mined(f.kufo.transferGroups(await f.recipient.getAddress(), 1001n, [13], { gasLimit: GAS_BOUND })));
  assert.deepEqual(await checkPortfolios(), beforeRevert);
  await at(f, f.starts[4]);
  for (const holder of holders) {
    const address = await holder.getAddress();
    const balance = await f.kufo.balanceOf(address);
    if (balance === 0n) continue;
    const ids = Array.from(await f.kufo.heldGroups(address, 0, 32));
    await mined(f.converter.connect(holder).convertGroups(balance, address, ids));
    await checkPortfolios();
    assert.equal(await f.kufo.activeGroupCount(address), 0n);
    assert.equal(await f.kufo.activeCohortCount(address), 0n);
  }
  assert.equal(await f.kufo.totalSupply(), 0n);
  assert.equal(await f.kship.totalSupply(), 5_000_000n);
});

test("virtual calendar lookup stays bounded across ten thousand years without materializing empty groups", async (t) => {
  const f = await fixture(t);
  const hashBefore = await f.kufo.calendarHash();
  const points = [BASE, localTime(2039, 12, 31), localTime(12_027, 12, 31)];
  const costs = [];
  for (const timestamp of points) {
    const expected = new Date((timestamp + UTC_OFFSET) * 1000);
    const id = BigInt((expected.getUTCFullYear() - FIRST_YEAR) * 12 + expected.getUTCMonth() + 1);
    const gas = await f.kufo.birthGroupAt.estimateGas(timestamp);
    assert.ok(gas < 100_000n);
    costs.push(gas);
    assert.equal((await f.kufo.birthGroupAt(timestamp)).id, id);
    const metadata = await f.kufo.groupMetadata(id);
    assert.equal(metadata.financialYear, BigInt(expected.getUTCFullYear()));
    assert.equal(await f.kufo.groupCalendarHash(id), hashBefore);
  }
  assert.ok(costs[2] <= costs[0] + 20_000n, "elapsed years must not create a scan");
  await at(f, localTime(12_027, 12, 31));
  assert.equal(await f.kufo.groupCount(), 120_012n);
  assert.equal(await f.kufo.activeGroupCount(await f.owner.getAddress()), 0n);
  assert.equal(await f.kufo.activeCohortCount(await f.owner.getAddress()), 0n);
  assert.deepEqual(Array.from(await f.kufo.heldGroups(await f.owner.getAddress(), 0, 32)), []);
  assert.equal(await f.kufo.totalSupply(), 0n);
  t.diagnostic(`O(1) month lookup gas at 2027/2039/12027=${costs.join(',')}`);
});
