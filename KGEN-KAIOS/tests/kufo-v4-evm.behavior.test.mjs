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
const VERSION = hash("TEST_ONLY_NONCANON_CALENDAR_001");
const FIRST_YEAR = 4100;
const FIRST_ZODIAC = 7;
const BASE = 1_900_000_000;
const STEP = 1_000;
const GAS_BOUND = 8_000_000n;
const E18 = parseEther("1");

// Artificial short annual intervals are test clocks, never civil/lunar/K280 canon.
const boundaries = (years = 4) => Array.from({ length: years + 3 }, (_, i) => BASE + i * STEP);
const annualWindows = (starts) => Array.from({ length: starts.length - 3 }, (_, i) => ({
  start: starts[i], end: starts[i + 1], zodiac: ((FIRST_ZODIAC - 1 + i) % 12) + 1, constellation: 1,
}));
const packWindow = ({ start, end, zodiac, constellation }) => BigInt(start) | (BigInt(end) << 64n)
  | (BigInt(zodiac) << 128n) | (BigInt(constellation) << 136n);
const calendarConfig = (starts, windows) => ({
  version: VERSION, firstFinancialYear: FIRST_YEAR, yearStarts: starts, packedBirthWindows: windows.map(packWindow),
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
  const starts = boundaries(years);
  const windows = options.windows ?? annualWindows(starts);
  const calendar = calendarConfig(starts, windows);
  const eip1193 = ganache.provider({
    logging: { quiet: true },
    chain: { chainId: 1337, time: new Date((BASE + 10) * 1000), hardfork: "shanghai" },
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
  return { eip1193, provider, starts, windows, calendar, owner, beneficiary, recipient, victim, outsider, registry, kgen, kaios, kufo, output, kship, converter };
}

async function at(f, timestamp) {
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
  assert.equal(a.birthZodiac, BigInt(FIRST_ZODIAC));
  assert.equal(b.birthZodiac, BigInt(FIRST_ZODIAC));
  assert.equal(b.birthConstellation, 1n, "birth metadata comes only from the configured window");
  await conservation(f);
});

test("midyear and crossyear transfers retain cohort without decay settlement or age reset", async (t) => {
  const f = await fixture(t);
  const proof = await mint(f, 1000n);
  await at(f, f.starts[0] + 500);
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

test("32 dormant annual cohorts transfer within a fixed gas bound and settle forever after issuance ends", async (t) => {
  const f = await fixture(t, 32);
  assert.equal(await f.kufo.issuanceCohorts(), 32n);
  for (let i = 0; i < 32; i += 1) {
    await at(f, f.starts[i] + 10);
    await mint(f, 1000n, f.owner, `dormant-year-${i}`);
  }
  assert.equal(await f.kufo.totalDecayedForKship(), 0n);
  assert.equal(await f.kufo.activeGroupCount(await f.owner.getAddress()), 32n);
  await at(f, f.starts.at(-1) + 100_000 * STEP);
  const receipt = await mined(f.kufo.transfer(await f.recipient.getAddress(), 32_000n, { gasLimit: GAS_BOUND }));
  assert.ok(receipt.gasUsed < GAS_BOUND);
  assert.equal(await f.kufo.balanceOf(await f.owner.getAddress()), 0n);
  for (let i = 0; i < 32; i += 1) {
    assert.equal(await f.kufo.currentAnnualStage(FIRST_YEAR + i), 3n);
    assert.equal((await f.kufo.groupMetadata(i + 1)).zodiac, BigInt(((FIRST_ZODIAC - 1 + i) % 12) + 1));
    assert.equal(sum(tranches(await f.kufo.cohort(await f.recipient.getAddress(), FIRST_YEAR + i))), 1000n);
  }
  const settle = await mined(f.converter.connect(f.recipient).convert(32_000n, await f.beneficiary.getAddress(), { gasLimit: GAS_BOUND }));
  assert.ok(settle.gasUsed < GAS_BOUND);
  assert.equal(await f.kufo.totalSupply(), 0n);
  assert.equal(await f.kship.totalSupply(), 32_000_000n);
  await assert.rejects(f.output.mint.staticCall(await f.kufo.getAddress(), hash("past-horizon"), await f.owner.getAddress(), 1000n));
  t.diagnostic(`32 dormant cohorts: full transfer gas=${receipt.gasUsed}; full settlement gas=${settle.gasUsed}; bound=${GAS_BOUND}`);
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

test("calendar is explicit, immutable, bounded and hash-addressable; invalid configurations fail", async (t) => {
  const f = await fixture(t);
  assert.equal(await f.kufo.name(), "KUFO");
  assert.equal(await f.kufo.symbol(), "KUFO");
  const registry = await f.registry.getAddress();
  const kaios = await f.kaios.getAddress();
  const expectedHash = keccak256(AbiCoder.defaultAbiCoder().encode(
    ["bytes32", "uint32", "uint64[]", "uint256[]"],
    [VERSION, FIRST_YEAR, f.starts, f.windows.map(packWindow)],
  ));
  assert.equal(await f.kufo.calendarHash(), expectedHash);
  for (let i = 0; i < f.starts.length; i += 1) assert.equal(await f.kufo.calendarBoundary(i), BigInt(f.starts[i]));
  const configs = [
    { ...f.calendar, version: ZeroHash },
    { ...f.calendar, firstFinancialYear: 0 },
    { ...f.calendar, firstFinancialYear: 4_294_967_295 },
    { ...f.calendar, yearStarts: [] },
    { ...f.calendar, yearStarts: boundaries(33), packedBirthWindows: annualWindows(boundaries(33)).map(packWindow) },
    { ...f.calendar, yearStarts: [0, ...f.starts.slice(1)] },
    { ...f.calendar, yearStarts: [f.starts[0], f.starts[0], ...f.starts.slice(2)] },
    { ...f.calendar, yearStarts: [f.starts[1], f.starts[0], ...f.starts.slice(2)] },
    { ...f.calendar, packedBirthWindows: [] },
    { ...f.calendar, packedBirthWindows: [f.calendar.packedBirthWindows[0] | (1n << 144n), ...f.calendar.packedBirthWindows.slice(1)] },
    { ...f.calendar, packedBirthWindows: [{ ...f.windows[0], zodiac: 0 }, ...f.windows.slice(1)].map(packWindow) },
    { ...f.calendar, packedBirthWindows: [{ ...f.windows[0], zodiac: 13 }, ...f.windows.slice(1)].map(packWindow) },
    { ...f.calendar, packedBirthWindows: [{ ...f.windows[0], constellation: 0 }, ...f.windows.slice(1)].map(packWindow) },
    { ...f.calendar, packedBirthWindows: [{ ...f.windows[0], constellation: 13 }, ...f.windows.slice(1)].map(packWindow) },
    { ...f.calendar, packedBirthWindows: [{ ...f.windows[0], start: f.starts[0] + 1 }, ...f.windows.slice(1)].map(packWindow) },
    { ...f.calendar, packedBirthWindows: [{ ...f.windows[0], end: f.starts[1] - 1 }, ...f.windows.slice(1)].map(packWindow) },
    { ...f.calendar, packedBirthWindows: [{ ...f.windows[0], end: f.starts[1] + 1 }, ...f.windows.slice(1)].map(packWindow) },
    { ...f.calendar, packedBirthWindows: [...f.windows.slice(0, -1), { ...f.windows.at(-1), end: f.starts[4] + 1 }].map(packWindow) },
  ];
  for (const config of configs) await assert.rejects(deploy("KUFO", f.owner, [registry, kaios, config]));
  await assert.rejects(deploy("KUFO", f.owner, [ZeroAddress, kaios, f.calendar]));
  await assert.rejects(deploy("KUFO", f.owner, [registry, ZeroAddress, f.calendar]));
  const otherRegistry = await deploy("KUFOV4MockOrganRegistry", f.owner);
  await rejectsCanonicalBinding(deploy("KUFO", f.owner, [await otherRegistry.getAddress(), kaios, f.calendar]), f.kufo);
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

async function alchemyFixture(t) {
  const f = await fixture(t, 4, { production: true });
  const { kgen, kaios } = f;
  const furnace = await deploy("KAIOSAlchemyFurnace", f.owner, [await kaios.getAddress(), await kgen.getAddress(), await f.registry.getAddress(), await f.kufo.getAddress()]);
  const realOutput = await deploy("KUFOOutputJindouyun168888", f.owner, [await furnace.getAddress(), await f.kufo.getAddress()]);
  await mined(f.registry.setOrgan(FURNACE_ID, await furnace.getAddress()));
  await mined(f.registry.setOrgan(OUTPUT_ID, await realOutput.getAddress()));
  return { ...f, kgen, kaios, furnace, realOutput };
}

test("real main KAIOS spends holder allowance; KGEN is balance-only; outlet beneficiary is fixed", async (t) => {
  const f = await alchemyFixture(t);
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
  await assert.rejects(f.realOutput.connect(f.outsider).releaseImmediate.staticCall(proof));
  await assert.rejects(f.furnace.connect(f.outsider).consumeImmediateProof.staticCall(proof));
  await assert.rejects(f.eip1193.request({ method: "eth_call", params: [{
    from: await f.realOutput.getAddress(), to: await f.furnace.getAddress(),
    data: f.furnace.interface.encodeFunctionData("consumeImmediateProof", [proof]),
  }, "latest"] }));
  await at(f, f.starts[3]);
  await mined(f.converter.connect(f.beneficiary).convert(E18, beneficiary));
  assert.equal(await f.kaios.conservationInvariantHolds(), true);
  assert.equal(await f.kufo.balanceOf(beneficiary), 0n);
  assert.equal(await f.kship.balanceOf(beneficiary), parseEther("1000"));
  await conservation(f);
});

test("outside the configured issuance interval the entire alchemy burn rolls back", async (t) => {
  const f = await alchemyFixture(t);
  const input = parseEther("0.001");
  const owner = await f.owner.getAddress();
  const beneficiary = await f.beneficiary.getAddress();
  await mined(f.kaios.approve(await f.furnace.getAddress(), input));
  const before = await f.kaios.balanceOf(owner);
  for (const timestamp of [f.starts[0] - 1, f.starts[4], f.starts.at(-1) + 1_000_000]) {
    await at(f, timestamp);
    await assert.rejects(mined(f.furnace.burnForKufo(input, beneficiary, hash(`closed-${timestamp}`), { gasLimit: 3_000_000n })));
    assert.equal(await f.kaios.balanceOf(owner), before);
    assert.equal(await f.kaios.allowance(owner, await f.furnace.getAddress()), input);
    assert.equal(await f.kaios.alchemyBurnCount(), 0n);
    assert.equal(await f.kufo.totalSupply(), 0n);
  }
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

test("birth windows and financial years split immutable groups without resetting either clock", async (t) => {
  const windows = [
    { start: BASE, end: BASE + 500, zodiac: 7, constellation: 2 },
    { start: BASE + 500, end: BASE + 1500, zodiac: 8, constellation: 3 },
    { start: BASE + 1500, end: BASE + 4000, zodiac: 9, constellation: 4 },
  ];
  const f = await fixture(t, 4, { windows });
  const owner = await f.owner.getAddress();
  const early = await mint(f, 1000n, f.owner, "birth-window-before");
  await at(f, BASE + 499);
  const last = await mint(f, 1000n, f.recipient, "birth-window-last-second");
  await at(f, BASE + 500);
  const changedWindow = await mint(f, 1000n, f.owner, "birth-window-first-second");
  const earlyOrigin = await f.kufo.mintOrigin(early);
  const lastOrigin = await f.kufo.mintOrigin(last);
  const nextOrigin = await f.kufo.mintOrigin(changedWindow);
  assert.equal(earlyOrigin.groupId, 1n);
  assert.equal(lastOrigin.groupId, 1n);
  assert.equal(nextOrigin.groupId, 2n);
  assert.equal(nextOrigin.birthYear, earlyOrigin.birthYear);
  assert.equal(nextOrigin.birthZodiac, 8n);
  assert.equal(nextOrigin.birthConstellation, 3n);
  assert.equal(nextOrigin.calendarHash, await f.kufo.calendarHash());
  const groupBefore = await f.kufo.groupMetadata(1);
  await mined(f.kufo.transferGroups(await f.victim.getAddress(), 317n, [1]));
  assert.deepEqual(Array.from(await f.kufo.groupMetadata(1)), Array.from(groupBefore));
  assert.deepEqual(Array.from(await f.kufo.mintOrigin(early)), Array.from(earlyOrigin));
  assert.equal(await f.kufo.totalDecayedForKship(), 0n);
  await at(f, BASE + STEP);
  const changedYear = await mint(f, 1000n, f.recipient, "financial-boundary-inside-birth-window");
  const yearOrigin = await f.kufo.mintOrigin(changedYear);
  assert.equal(yearOrigin.groupId, 3n);
  assert.equal(yearOrigin.birthYear, BigInt(FIRST_YEAR + 1));
  assert.equal(yearOrigin.birthZodiac, nextOrigin.birthZodiac);
  assert.equal(yearOrigin.birthConstellation, nextOrigin.birthConstellation);
  assert.equal(await f.kufo.claimableDecay(owner, FIRST_YEAR), 842n);
  assert.equal(await f.kufo.claimableDecay(await f.recipient.getAddress(), FIRST_YEAR + 1), 0n);
  await at(f, BASE + 20 * STEP);
  await mined(f.converter.convertGroups(await f.kufo.balanceOf(owner), owner, [1, 2]));
  assert.deepEqual(Array.from(await f.kufo.mintOrigin(early)), Array.from(earlyOrigin));
  assert.deepEqual(Array.from(await f.kufo.groupMetadata(1)), Array.from(groupBefore));
  await conservation(f);
});

test("33 active groups require explicit batches and selected transfer/convert remains bounded", async (t) => {
  const windows = Array.from({ length: 33 }, (_, i) => ({
    start: BASE + Math.floor(i * STEP / 33),
    end: BASE + Math.floor((i + 1) * STEP / 33),
    zodiac: (i % 12) + 1,
    constellation: ((i + 4) % 12) + 1,
  }));
  windows.push({ start: BASE + STEP, end: BASE + 4 * STEP, zodiac: 1, constellation: 1 });
  const f = await fixture(t, 4, { windows });
  const owner = await f.owner.getAddress();
  const recipient = await f.recipient.getAddress();
  for (let i = 0; i < 33; i += 1) {
    await at(f, windows[i].start + 1);
    await mint(f, 1000n, f.owner, `bounded-group-${i}`);
  }
  const ids = Array.from({ length: 32 }, (_, i) => i + 1);
  const invalid = [[], [0], [2, 1], [1, 1], [...ids, 33], [65_535]];
  for (const selected of invalid) await assert.rejects(f.kufo.transferGroups.staticCall(recipient, 1n, selected));
  await assert.rejects(f.kufo.transfer.staticCall(recipient, 33_000n), /GroupBatchRequired/);
  await assert.rejects(mined(f.kufo.transfer(recipient, 33_000n, { gasLimit: GAS_BOUND })));
  assert.equal(await f.kufo.balanceOf(owner), 33_000n);
  assert.equal(await f.kufo.balanceOf(recipient), 0n);
  await at(f, f.starts.at(-1) + 1_000_000);
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
  const move = await mined(f.kufo.transferGroups(recipient, 32_000n, ids, { gasLimit: GAS_BOUND }));
  assert.ok(move.gasUsed < GAS_BOUND);
  assert.equal(await f.kufo.balanceOf(owner), 1000n);
  assert.equal(await f.kufo.balanceOf(recipient), 32_000n);
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

test("the 32-year and 512-window candidate maximum deploys under Shanghai and settles selected groups forever", async (t) => {
  const starts = boundaries(32);
  const windows = Array.from({ length: 512 }, (_, i) => ({
    start: BASE + Math.floor(i * (32 * STEP) / 512) + (i === 0 ? 0 : 1),
    end: BASE + Math.floor((i + 1) * (32 * STEP) / 512) + (i === 511 ? 0 : 1),
    zodiac: (i % 12) + 1,
    constellation: ((i + 5) % 12) + 1,
  }));
  const f = await fixture(t, 32, { windows });
  const deployment = await f.kufo.deploymentTransaction().wait();
  const initBytes = (f.kufo.deploymentTransaction().data.length - 2) / 2;
  assert.ok(initBytes <= 49_152, "Shanghai initcode cap remains enabled");
  assert.ok(deployment.gasUsed < 30_000_000n, "synthetic local block bound remains conservative");
  assert.equal(await f.kufo.MAX_BIRTH_WINDOWS(), 512n);
  assert.equal(await f.kufo.issuanceCohorts(), 32n);
  assert.equal(await f.kufo.groupCount(), 543n, "all 31 internal financial boundaries split a birth window");
  const ids = [];
  for (let i = 480; i < 512; i += 1) {
    await at(f, windows[i].start + 1);
    const proof = await mint(f, 1000n, f.owner, `maximum-window-${i}`);
    ids.push(Number((await f.kufo.mintOrigin(proof)).groupId));
  }
  await mined(f.kufo.approve(await f.outsider.getAddress(), 32_000n));
  const move = await mined(f.kufo.connect(f.outsider).transferFromGroups(await f.owner.getAddress(), await f.recipient.getAddress(), 32_000n, ids, { gasLimit: GAS_BOUND }));
  assert.equal(await f.kufo.allowance(await f.owner.getAddress(), await f.outsider.getAddress()), 0n);
  await at(f, starts.at(-1) + 10_000_000);
  const convert = await mined(f.converter.connect(f.recipient).convertGroups(32_000n, await f.beneficiary.getAddress(), ids, { gasLimit: GAS_BOUND }));
  assert.ok(move.gasUsed < GAS_BOUND);
  assert.ok(convert.gasUsed < GAS_BOUND);
  assert.equal(await f.kufo.totalSupply(), 0n);
  assert.equal(await f.kship.balanceOf(await f.beneficiary.getAddress()), 32_000_000n);
  t.diagnostic(`candidate maximum: initcode=${initBytes} bytes; constructor gas=${deployment.gasUsed}; selected32 transfer gas=${move.gasUsed}; selected32 conversion gas=${convert.gasUsed}`);
  await conservation(f);
});
