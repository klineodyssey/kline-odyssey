import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { id } from "ethers";
import {
  ETHER,
  advanceTime,
  approveAlchemy,
  cleanupProviders,
  eventArgs,
  mintKaiosByBurningKgen,
  setupLineage,
} from "./helpers.mjs";

afterEach(cleanupProviders);

function* deterministicValues(seed, count, maximum) {
  let state = BigInt(seed);
  for (let index = 0; index < count; index += 1) {
    state ^= state << 13n;
    state ^= state >> 7n;
    state ^= state << 17n;
    yield (state < 0n ? -state : state) % maximum + 1n;
  }
}

test("fuzz: incremental Friction Mirror settlement conserves KGEN-to-KAIOS mass", async () => {
  const context = await setupLineage();
  let cumulativeBurn = 0n;
  const cases = 64;
  for (const wholeTokens of deterministicValues(0x18888n, cases, 100n)) {
    const amount = wholeTokens * ETHER;
    cumulativeBurn += amount;
    await mintKaiosByBurningKgen(context, amount);
    assert.equal(await context.kaios.settledKgenBurned(), cumulativeBurn);
    assert.equal(await context.kaios.totalSupply(), cumulativeBurn * 1_000n);
    assert.equal(await context.kaios.conservationInvariantHolds(), true);
  }
  assert.equal(cumulativeBurn < 72_000_000n * ETHER, true);
});

test("invariant: arbitrary zero-tax KAIOS transfers preserve supply and settlement identity", async () => {
  const context = await setupLineage();
  const initialSupply = await mintKaiosByBurningKgen(context, 10_000n * ETHER);
  const actors = context.signers.slice(1, 7);
  let source = context.treasury;
  let iteration = 0;

  for (const wholeTokens of deterministicValues(0x511111n, 96, 50n)) {
    const target = actors[iteration % actors.length];
    const sourceBalance = await context.kaios.balanceOf(await source.getAddress());
    const candidate = wholeTokens * ETHER;
    const amount = sourceBalance < candidate ? sourceBalance : candidate;
    if (amount > 0n && (await source.getAddress()) !== (await target.getAddress())) {
      await (await context.kaios.connect(source).transfer(await target.getAddress(), amount)).wait();
    }
    source = target;
    iteration += 1;
    assert.equal(await context.kaios.totalSupply(), initialSupply);
    assert.equal(await context.kaios.conservationInvariantHolds(), true);
  }
});

test("fuzz: catalyst escrow, atomic return and KUFO output preserve exact mass scale", async () => {
  const context = await setupLineage({ epochSeconds: 1, halfLifeSeconds: 1_000 });
  await mintKaiosByBurningKgen(context, 10n * ETHER);
  const kgenSupply = await context.kgen.totalSupply();
  const treasuryAddress = await context.treasury.getAddress();
  const treasuryKgenBefore = await context.kgen.balanceOf(treasuryAddress);
  const proofIds = [];
  let totalKaios = 0n;

  for (const wholeKaios of deterministicValues(0x18911n, 8, 100n)) {
    const kaiosAmount = wholeKaios * ETHER;
    const catalyst = await approveAlchemy(context, context.treasury, kaiosAmount);
    const receipt = await (await context.furnace.connect(context.treasury).burnForKufo(
      kaiosAmount,
      await context.signers[2].getAddress(),
      id(`FUZZ-LIFE-${wholeKaios}`),
      id("FUZZ-DESTINATION"),
      { gasLimit: 1_500_000 },
    )).wait();
    const proofId = eventArgs(receipt, context.furnace, "AlchemyProofCreated").proofId;
    const proof = await context.furnace.proof(proofId);
    assert.equal(catalyst, kaiosAmount / 1_000n);
    assert.equal(proof.kgenCatalystAmount, catalyst);
    assert.equal(proof.kufoAmount, kaiosAmount * 1_000n);
    assert.equal(await context.kgen.totalSupply(), kgenSupply);
    proofIds.push(proofId);
    totalKaios += kaiosAmount;
  }

  assert.equal(await context.furnace.catalystLiability(), totalKaios / 1_000n);
  await advanceTime(context.provider, 49);
  for (const proofId of proofIds) {
    await (await context.wormhole.claim(proofId, { gasLimit: 2_000_000 })).wait();
  }
  assert.equal(await context.furnace.catalystLiability(), 0n);
  assert.equal(await context.kgen.balanceOf(treasuryAddress), treasuryKgenBefore);
  assert.equal(await context.kufo.totalSupply(), totalKaios * 1_000n);
  assert.equal(await context.kgen.totalSupply(), kgenSupply);
  assert.equal(await context.kufo.conservationInvariantHolds(), true);
});

test("invariant: completed half-life decay is monotonic and never exceeds 1000 KSHIP per KUFO", async () => {
  const context = await setupLineage({ epochSeconds: 1, halfLifeSeconds: 10 });
  await mintKaiosByBurningKgen(context, 1n * ETHER);
  const recipient = context.signers[2];
  const amount = 1n * ETHER;
  await approveAlchemy(context, context.treasury, amount);
  const receipt = await (await context.furnace.connect(context.treasury).burnForKufo(
    amount, await recipient.getAddress(), id("DECAY-FUZZ-LIFE"), id("DECAY-FUZZ-DEST"),
  )).wait();
  const proofId = eventArgs(receipt, context.furnace, "AlchemyProofCreated").proofId;
  await advanceTime(context.provider, 49);
  await (await context.wormhole.claim(proofId)).wait();
  const initial = (await context.kufo.decayLot(1)).initialAmount;
  let previous = 0n;
  for (let period = 1; period <= 12; period += 1) {
    await advanceTime(context.provider, 10);
    const cumulative = await context.kufo.cumulativeDecayedAmount(1);
    assert.equal(cumulative >= previous, true);
    assert.equal(cumulative <= initial, true);
    assert.equal(cumulative * 1_000n <= initial * 1_000n, true);
    previous = cumulative;
  }
});
