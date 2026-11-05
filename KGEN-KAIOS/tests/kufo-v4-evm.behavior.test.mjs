import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ganache from "ganache";
import { AbiCoder, BrowserProvider, ContractFactory, ZeroAddress, ZeroHash, keccak256, parseEther, toUtf8Bytes } from "ethers";

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
const tranches = (c) => [c.first, c.second, c.terminal];
const sum = (values) => values.reduce((a, b) => a + b, 0n);
const mined = async (promise) => (await promise).wait();

async function deploy(name, signer, args = []) {
  const a = JSON.parse(fs.readFileSync(path.join(artifacts, `${name}.json`), "utf8"));
  const contract = await new ContractFactory(a.abi, a.bytecode, signer).deploy(...args);
  await contract.waitForDeployment();
  return contract;
}

async function fixture(t, years = 4) {
  const starts = boundaries(years);
  const eip1193 = ganache.provider({
    logging: { quiet: true },
    chain: { chainId: 1337, time: new Date((BASE + 10) * 1000), hardfork: "shanghai" },
    miner: { timestampIncrement: 0, blockGasLimit: 100_000_000 },
    wallet: { totalAccounts: 6 },
  });
  const provider = new BrowserProvider(eip1193, undefined, { cacheTimeout: -1 });
  provider.pollingInterval = 10;
  const [owner, beneficiary, recipient, victim, outsider] = await Promise.all([0, 1, 2, 3, 4].map((i) => provider.getSigner(i)));
  t.after(async () => { provider.destroy(); await eip1193.disconnect(); });
  const registry = await deploy("KUFOV4MockOrganRegistry", owner);
  const kufo = await deploy("KUFOV4", owner, [await registry.getAddress(), VERSION, FIRST_YEAR, FIRST_ZODIAC, starts]);
  const output = await deploy("KUFOV4MockOutput", owner);
  const kship = await deploy("KSHIP", owner, [await registry.getAddress(), await kufo.getAddress()]);
  const converter = await deploy("KSHIPConverter", owner, [await kufo.getAddress(), await kship.getAddress()]);
  await mined(registry.setOrgan(OUTPUT_ID, await output.getAddress()));
  await mined(registry.setOrgan(CONVERTER_ID, await converter.getAddress()));
  return { eip1193, provider, starts, owner, beneficiary, recipient, victim, outsider, registry, kufo, output, kship, converter };
}

async function at(f, timestamp) {
  await f.eip1193.request({ method: "evm_setTime", params: [timestamp * 1000] });
  await f.eip1193.request({ method: "evm_mine", params: [timestamp] });
  const block = await f.eip1193.request({ method: "eth_getBlockByNumber", params: ["latest", false] });
  assert.equal(Number(block.timestamp), timestamp, "exact configured test boundary");
}

async function mint(f, amount, receiver = f.owner, label = "mint") {
  const proof = hash(label);
  const beneficiary = typeof receiver === "string" ? receiver : await receiver.getAddress();
  await mined(f.output.mint(await f.kufo.getAddress(), proof, beneficiary, amount));
  return proof;
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
  assert.equal(await f.kufo.currentAutumn(FIRST_YEAR), 1n);
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
  assert.equal(b.birthConstellation, 0n, "unconfigured means unknown, never guessed");
  await conservation(f);
});

test("midyear and crossyear transfers retain cohort without decay settlement or age reset", async (t) => {
  const f = await fixture(t);
  const proof = await mint(f, 1003n);
  await at(f, f.starts[0] + 500);
  await mined(f.kufo.transfer(await f.recipient.getAddress(), 403n));
  assert.equal(await f.kufo.balanceOf(await f.owner.getAddress()), 600n);
  assert.equal(await f.kufo.balanceOf(await f.recipient.getAddress()), 403n);
  assert.equal(await f.kufo.totalDecayedForKship(), 0n);
  await at(f, f.starts[1] + 50);
  const before = tranches(await f.kufo.cohort(await f.recipient.getAddress(), FIRST_YEAR));
  await mined(f.kufo.connect(f.recipient).transfer(await f.victim.getAddress(), 403n));
  assert.deepEqual(tranches(await f.kufo.cohort(await f.victim.getAddress(), FIRST_YEAR)), before);
  assert.equal(sum(tranches(await f.kufo.cohort(await f.victim.getAddress(), FIRST_YEAR + 1))), 0n);
  assert.equal(await f.kufo.totalDecayedForKship(), 0n);
  assert.equal((await f.kufo.mintOrigin(proof)).birthYear, BigInt(FIRST_YEAR));
  assert.equal(await f.kufo.claimableDecay(await f.victim.getAddress(), FIRST_YEAR), before[0]);
  await conservation(f);
});

test("partial transfers before/after partial settlement conserve each remaining tranche", async (t) => {
  const f = await fixture(t);
  await mint(f, 1003n);
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
  assert.equal(await f.kship.totalSupply(), 1_003_000n);
  await conservation(f);
});

test("skip year catches up to 75 percent, repeat cannot settle twice, third year clears dust", async (t) => {
  const f = await fixture(t);
  await mint(f, 1003n);
  await at(f, f.starts[2]);
  assert.equal(await f.kufo.claimableTotal(await f.owner.getAddress()), 752n);
  await mined(f.converter.convert(752n, await f.beneficiary.getAddress()));
  assert.equal(await f.kufo.balanceOf(await f.owner.getAddress()), 251n);
  assert.equal(await f.kufo.claimableTotal(await f.owner.getAddress()), 0n);
  await assert.rejects(f.converter.convert.staticCall(1n, await f.beneficiary.getAddress()));
  await at(f, f.starts[3] - 1);
  assert.equal(await f.kufo.claimableTotal(await f.owner.getAddress()), 0n);
  await at(f, f.starts[3]);
  assert.equal(await f.kufo.claimableTotal(await f.owner.getAddress()), 251n);
  await mined(f.converter.convert(251n, await f.beneficiary.getAddress()));
  assert.equal(await f.kufo.balanceOf(await f.owner.getAddress()), 0n);
  assert.deepEqual(tranches(await f.kufo.cohort(await f.owner.getAddress(), FIRST_YEAR)), [0n, 0n, 0n]);
  await assert.rejects(f.converter.convert.staticCall(1n, await f.beneficiary.getAddress()));
  await conservation(f);
});

test("one smallest unit is swept exactly at the third boundary", async (t) => {
  const f = await fixture(t);
  await mint(f, 1n);
  await at(f, f.starts[2]);
  assert.equal(await f.kufo.claimableTotal(await f.owner.getAddress()), 0n);
  await at(f, f.starts[3]);
  await mined(f.converter.convert(1n, await f.beneficiary.getAddress()));
  assert.equal(await f.kufo.balanceOf(await f.owner.getAddress()), 0n);
  assert.equal(await f.kship.balanceOf(await f.beneficiary.getAddress()), 1000n);
  await conservation(f);
});

test("zero and self transfers preserve cohort state and do not create recipient history", async (t) => {
  const f = await fixture(t);
  await mint(f, 1003n);
  const owner = await f.owner.getAddress();
  const recipient = await f.recipient.getAddress();
  const before = tranches(await f.kufo.cohort(owner, FIRST_YEAR));
  await mined(f.kufo.transfer(recipient, 0n));
  await mined(f.kufo.transfer(owner, 1003n));
  await mined(f.kufo.approve(await f.outsider.getAddress(), 251n));
  await mined(f.kufo.connect(f.outsider).transferFrom(owner, owner, 251n));
  assert.deepEqual(tranches(await f.kufo.cohort(owner, FIRST_YEAR)), before);
  assert.equal(await f.kufo.balanceOf(owner), 1003n);
  assert.equal(await f.kufo.balanceOf(recipient), 0n);
  assert.equal(await f.kufo.activeCohortCount(recipient), 0n);
  assert.equal(await f.kufo.allowance(owner, await f.outsider.getAddress()), 0n);
  assert.equal(await f.kufo.totalDecayedForKship(), 0n);
  await conservation(f);
});

test("merging an unsettled receipt into a same-year settled cohort preserves outstanding maturity", async (t) => {
  const f = await fixture(t);
  const owner = await f.owner.getAddress();
  const recipient = await f.recipient.getAddress();
  const beneficiary = await f.beneficiary.getAddress();
  await mint(f, 1003n, f.owner, "settled-owner-origin");
  await mint(f, 1003n, f.recipient, "unsettled-receipt-origin");
  await at(f, f.starts[1]);
  await mined(f.converter.convert(501n, beneficiary));
  assert.deepEqual(tranches(await f.kufo.cohort(owner, FIRST_YEAR)), [0n, 251n, 251n]);
  await mined(f.kufo.connect(f.recipient).transfer(owner, 1003n));
  assert.deepEqual(tranches(await f.kufo.cohort(owner, FIRST_YEAR)), [501n, 502n, 502n]);
  assert.equal(await f.kufo.activeCohortCount(owner), 1n);
  assert.equal(await f.kufo.balanceOf(recipient), 0n);
  assert.equal(await f.kufo.totalDecayedForKship(), 501n, "merge must not settle the received maturity");
  assert.equal(await f.kufo.claimableTotal(owner), 501n);
  await mined(f.converter.convert(501n, beneficiary));
  await assert.rejects(f.converter.convert.staticCall(1n, beneficiary));
  await at(f, f.starts[2]);
  assert.equal(await f.kufo.claimableTotal(owner), 502n);
  await mined(f.converter.convert(502n, beneficiary));
  await at(f, f.starts[3]);
  await mined(f.converter.convert(502n, beneficiary));
  assert.equal(await f.kufo.totalSupply(), 0n);
  assert.equal(await f.kship.totalSupply(), 2_006_000n);
  await conservation(f);
});

test("256 unsolicited dust transfers coalesce and cannot lock the victim's full balance", async (t) => {
  const f = await fixture(t);
  const victim = await f.victim.getAddress();
  const token = await f.kufo.getAddress();
  await mint(f, 1003n, f.victim, "victim-legitimate-principal");
  await mined(f.output.batchDust(token, hash("dust-a"), victim, 128n, 1n, { gasLimit: 90_000_000n }));
  const firstGas = await f.kufo.connect(f.victim).transfer.estimateGas(await f.recipient.getAddress(), 1131n);
  await mined(f.output.batchDust(token, hash("dust-b"), victim, 128n, 1n, { gasLimit: 90_000_000n }));
  assert.equal(await f.kufo.balanceOf(victim), 1259n);
  assert.equal(await f.kufo.activeCohortCount(victim), 1n);
  assert.deepEqual(tranches(await f.kufo.cohort(victim, FIRST_YEAR)), [501n, 251n, 507n]);
  const receipt = await mined(f.kufo.connect(f.victim).transfer(await f.recipient.getAddress(), 1259n, { gasLimit: GAS_BOUND }));
  assert.ok(receipt.gasUsed < 300_000n);
  assert.ok(receipt.gasUsed <= firstGas + 10_000n, "dust count must not grow transfer traversal");
  assert.equal(await f.kufo.balanceOf(victim), 0n);
  await at(f, f.starts[3]);
  const settlement = await mined(f.converter.connect(f.recipient).convert(1259n, await f.beneficiary.getAddress(), { gasLimit: GAS_BOUND }));
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
    await mint(f, 1003n, f.owner, `dormant-year-${i}`);
  }
  assert.equal(await f.kufo.totalDecayedForKship(), 0n);
  assert.equal(await f.kufo.activeCohortCount(await f.owner.getAddress()), 32n);
  await at(f, f.starts.at(-1) + 100_000 * STEP);
  const receipt = await mined(f.kufo.transfer(await f.recipient.getAddress(), 32_096n, { gasLimit: GAS_BOUND }));
  assert.ok(receipt.gasUsed < GAS_BOUND);
  assert.equal(await f.kufo.balanceOf(await f.owner.getAddress()), 0n);
  for (let i = 0; i < 32; i += 1) {
    assert.equal(await f.kufo.currentAutumn(FIRST_YEAR + i), 3n);
    assert.equal(await f.kufo.birthZodiac(FIRST_YEAR + i), BigInt((FIRST_ZODIAC + i) % 12));
    assert.equal(sum(tranches(await f.kufo.cohort(await f.recipient.getAddress(), FIRST_YEAR + i))), 1003n);
  }
  const settle = await mined(f.converter.connect(f.recipient).convert(32_096n, await f.beneficiary.getAddress(), { gasLimit: GAS_BOUND }));
  assert.ok(settle.gasUsed < GAS_BOUND);
  assert.equal(await f.kufo.totalSupply(), 0n);
  assert.equal(await f.kship.totalSupply(), 32_096_000n);
  await assert.rejects(f.output.mint.staticCall(await f.kufo.getAddress(), hash("past-horizon"), await f.owner.getAddress(), 1n));
  t.diagnostic(`32 dormant cohorts: full transfer gas=${receipt.gasUsed}; full settlement gas=${settle.gasUsed}; bound=${GAS_BOUND}`);
  await conservation(f);
});

test("mint, carrier burn and KSHIP proofs enforce authorization and replay protection", async (t) => {
  const f = await fixture(t);
  const owner = await f.owner.getAddress();
  const beneficiary = await f.beneficiary.getAddress();
  const proof = await mint(f, 11n, f.owner, "replay-mint");
  await assert.rejects(f.output.mint.staticCall(await f.kufo.getAddress(), proof, beneficiary, 11n));
  await assert.rejects(f.kufo.connect(f.outsider).mintFromImmediateProof.staticCall(hash("unauthorized"), owner, 1n));
  await assert.rejects(f.kufo.connect(f.outsider).burnForCarrier.staticCall(owner, beneficiary, 1n, hash("unauthorized-burn")));
  await assert.rejects(f.kship.connect(f.outsider).mintFromCarrierProof.staticCall(hash("no-record")));
  await at(f, f.starts[3]);
  const replay = await deploy("KUFOV4ReplayConverter", f.owner);
  await mined(f.registry.setOrgan(CONVERTER_ID, await replay.getAddress()));
  const carrier = hash("carrier-replay");
  await mined(replay.burnAndMint(await f.kufo.getAddress(), await f.kship.getAddress(), owner, beneficiary, 11n, carrier));
  assert.equal(await f.kship.balanceOf(beneficiary), 11_000n);
  assert.equal(await f.kship.balanceOf(owner), 0n);
  const record = await f.kufo.carrierBurnRecord(carrier);
  assert.equal(record.owner, owner);
  assert.equal(record.beneficiary, beneficiary);
  assert.equal(record.converter, await replay.getAddress());
  assert.equal(record.expectedKship, 11_000n);
  await assert.rejects(replay.mintAgain.staticCall(await f.kship.getAddress(), carrier));
  await assert.rejects(replay.burnAndMint.staticCall(await f.kufo.getAddress(), await f.kship.getAddress(), owner, beneficiary, 1n, carrier));
  await assert.rejects(replay.mintAgain.staticCall(await f.kship.getAddress(), hash("fabricated-carrier")));
  await conservation(f);
});

test("calendar is explicit, immutable, bounded and hash-addressable; invalid configurations fail", async (t) => {
  const f = await fixture(t);
  const registry = await f.registry.getAddress();
  const good = [registry, VERSION, FIRST_YEAR, FIRST_ZODIAC, f.starts];
  const expectedHash = keccak256(AbiCoder.defaultAbiCoder().encode(["bytes32", "uint32", "uint8", "uint64[]"], good.slice(1)));
  assert.equal(await f.kufo.calendarHash(), expectedHash);
  for (let i = 0; i < f.starts.length; i += 1) assert.equal(await f.kufo.calendarBoundary(i), BigInt(f.starts[i]));
  const rejects = [
    [ZeroAddress, ...good.slice(1)],
    [registry, ZeroHash, ...good.slice(2)],
    [registry, VERSION, FIRST_YEAR, 12, f.starts],
    [registry, VERSION, 0, FIRST_ZODIAC, f.starts],
    [registry, VERSION, FIRST_YEAR, FIRST_ZODIAC, []],
    [registry, VERSION, FIRST_YEAR, FIRST_ZODIAC, boundaries(33)],
    [registry, VERSION, FIRST_YEAR, FIRST_ZODIAC, [0, ...f.starts.slice(1)]],
    [registry, VERSION, FIRST_YEAR, FIRST_ZODIAC, [f.starts[0], f.starts[0], ...f.starts.slice(2)]],
    [registry, VERSION, FIRST_YEAR, FIRST_ZODIAC, [f.starts[1], f.starts[0], ...f.starts.slice(2)]],
    [registry, VERSION, 4_294_967_295, FIRST_ZODIAC, f.starts],
  ];
  for (const args of rejects) await assert.rejects(deploy("KUFOV4", f.owner, args));
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
  await assert.rejects(f.output.mint.staticCall(await f.kufo.getAddress(), rejected, await f.owner.getAddress(), 1n));
  assert.equal(await f.kufo.proofMinted(rejected), false);
  assert.equal(await f.kufo.totalMintedFromAlchemy(), maximum);
  await conservation(f);
});

async function alchemyFixture(t) {
  const f = await fixture(t);
  const kgen = await deploy("MockKGEN", f.owner, [await f.owner.getAddress()]);
  const kaios = await deploy("KAIOS", f.owner, [await kgen.getAddress(), await f.owner.getAddress(), await f.registry.getAddress()]);
  await mined(kgen.burn(E18));
  await mined(kaios.settleWhiteHoleMass());
  const furnace = await deploy("KAIOSAlchemyFurnaceV4", f.owner, [await kaios.getAddress(), await kgen.getAddress(), await f.registry.getAddress()]);
  const realOutput = await deploy("KUFOOutputJindouyun168888V4", f.owner, [await furnace.getAddress(), await f.kufo.getAddress()]);
  await mined(f.registry.setOrgan(FURNACE_ID, await furnace.getAddress()));
  await mined(f.registry.setOrgan(OUTPUT_ID, await realOutput.getAddress()));
  return { ...f, kgen, kaios, furnace, realOutput };
}

test("real main KAIOS spends holder allowance; KGEN is balance-only; outlet beneficiary is fixed", async (t) => {
  const f = await alchemyFixture(t);
  const input = parseEther("0.001");
  const owner = await f.owner.getAddress();
  const beneficiary = await f.beneficiary.getAddress();
  const life = hash("local-fixture-not-a-life-identity-claim");
  // A holder with sufficient KAIOS and allowance but no KGEN still cannot mint.
  const outsider = await f.outsider.getAddress();
  await mined(f.kaios.transfer(outsider, input));
  await mined(f.kaios.connect(f.outsider).approve(await f.furnace.getAddress(), input));
  await assert.rejects(f.furnace.connect(f.outsider).burnForKufo.staticCall(input, beneficiary, life));
  assert.equal(await f.kaios.balanceOf(outsider), input);
  assert.equal(await f.kgen.balanceOf(outsider), 0n);
  const beforeKaios = await f.kaios.balanceOf(owner);
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
  assert.equal(await f.kaios.allowance(owner, await f.furnace.getAddress()), 0n);
  assert.equal(await f.kgen.balanceOf(owner), beforeKgen);
  assert.equal(await f.kgen.allowance(owner, await f.furnace.getAddress()), 0n);
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
