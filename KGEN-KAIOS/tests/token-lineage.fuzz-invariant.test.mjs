import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import {
  ETHER,
  cleanupProviders,
  deploy,
  mintKaiosByBurningKgen,
  setupLingxiaoBank,
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

test("invariant: 18888 settlement balance tracks fuzzed direct KAIOS mints before any approved claim", async () => {
  const context = await setupLingxiaoBank();
  const mockKaios = await deploy("MockKAIOSForTreasury", context.deployer, [
    await context.kgen.getAddress(),
    await context.bank.getAddress(),
  ]);
  await (await context.bank.bindKAIOS(await mockKaios.getAddress())).wait();

  let expected = 0n;
  for (const wholeTokens of deterministicValues(0x18888_20000n, 64, 10_000n)) {
    const amount = wholeTokens * ETHER;
    expected += amount;
    await (await mockKaios.mintToTreasury(amount)).wait();
    assert.equal(await context.bank.kaiosBalance(), expected);
    assert.equal(await mockKaios.balanceOf(await context.bank.getAddress()), expected);
  }
});
