import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { id } from "ethers";
import {
  ETHER,
  ORGAN_FURNACE_18911,
  ORGAN_KSHIP_CONVERTER,
  ORGAN_WORMHOLE_511111,
  advanceTime,
  cleanupProviders,
  deploy,
  eventArgs,
  mintKaiosByBurningKgen,
  setupLineage,
} from "./helpers.mjs";

afterEach(cleanupProviders);

test("Friction Mirror reads actual KGEN supply loss and settles only to 18888", async () => {
  const context = await setupLineage();
  const burned = 7n * ETHER;
  const minted = await mintKaiosByBurningKgen(context, burned);

  assert.equal(minted, 7_000n * ETHER);
  assert.equal(await context.kaios.balanceOf(await context.treasury.getAddress()), minted);
  assert.equal(await context.kaios.balanceOf(await context.owner.getAddress()), 0n);
  assert.equal(await context.kaios.settledKgenBurned(), burned);
  assert.equal(await context.kaios.conservationInvariantHolds(), true);
  await assert.rejects(context.kaios.settleWhiteHoleMass());
});

test("18911 burn is holder-allowance-bound and 511111 cannot redirect beneficiary", async () => {
  const context = await setupLineage({ epochSeconds: 10 });
  await mintKaiosByBurningKgen(context, 2n * ETHER);
  const amount = 1_250n * ETHER;
  const beneficiary = context.signers[2];
  const attacker = context.signers[3];
  const lifeId = id("LIFE-HOLDER-001");
  const destination = id("KUFO-CLAIM-511111");

  await assert.rejects(
    context.furnace.connect(context.treasury).burnForKufo(
      amount,
      await beneficiary.getAddress(),
      lifeId,
      destination,
    ),
  );

  await (await context.kaios.connect(context.treasury).approve(await context.furnace.getAddress(), amount)).wait();
  const receipt = await (
    await context.furnace.connect(context.treasury).burnForKufo(
      amount,
      await beneficiary.getAddress(),
      lifeId,
      destination,
      { gasLimit: 1_000_000 },
    )
  ).wait();
  const created = eventArgs(receipt, context.furnace, "AlchemyProofCreated");
  const proofId = created.proofId;

  await assert.rejects(context.wormhole.connect(attacker).claim(proofId));
  await advanceTime(context.provider, 49 * 10);
  await (await context.wormhole.connect(attacker).claim(proofId, { gasLimit: 1_000_000 })).wait();

  const kufoAmount = amount * 1_000n;
  assert.equal(await context.kufo.balanceOf(await beneficiary.getAddress()), kufoAmount);
  assert.equal(await context.kufo.balanceOf(await attacker.getAddress()), 0n);
  assert.equal((await context.furnace.proof(proofId)).beneficiary, await beneficiary.getAddress());
  await assert.rejects(context.wormhole.connect(attacker).claim(proofId));
});

test("49 Alchemy Epoch maturity boundary is enforced by Furnace Runtime", async () => {
  const context = await setupLineage({ epochSeconds: 20 });
  await mintKaiosByBurningKgen(context, 1n * ETHER);
  const amount = 500n * ETHER;
  await (await context.kaios.connect(context.treasury).approve(await context.furnace.getAddress(), amount)).wait();
  const receipt = await (
    await context.furnace.connect(context.treasury).burnForKufo(
      amount,
      await context.treasury.getAddress(),
      id("LIFE-EPOCH"),
      id("DEST-EPOCH"),
    )
  ).wait();
  const proofId = eventArgs(receipt, context.furnace, "AlchemyProofCreated").proofId;
  const proof = await context.furnace.proof(proofId);

  const currentEpoch = await context.furnace.currentEpoch();
  const secondsUntilPreviousEpoch = Number(proof.maturityEpoch - currentEpoch - 1n) * 20;
  if (secondsUntilPreviousEpoch > 0) await advanceTime(context.provider, secondsUntilPreviousEpoch);
  await assert.rejects(context.wormhole.claim(proofId));
  await advanceTime(context.provider, 20);
  await (await context.wormhole.claim(proofId, { gasLimit: 1_000_000 })).wait();
  assert.equal((await context.furnace.proof(proofId)).consumed, true);
});

test("KUFO to KSHIP conversion is allowance-bound, replay-safe, and conserves scale", async () => {
  const context = await setupLineage({ epochSeconds: 1 });
  await mintKaiosByBurningKgen(context, 1n * ETHER);
  const kaiosAmount = 400n * ETHER;
  const recipient = context.signers[2];
  await (await context.kaios.connect(context.treasury).approve(await context.furnace.getAddress(), kaiosAmount)).wait();
  const burnReceipt = await (
    await context.furnace.connect(context.treasury).burnForKufo(
      kaiosAmount,
      await recipient.getAddress(),
      id("LIFE-CARRIER"),
      id("DEST-CARRIER"),
    )
  ).wait();
  const alchemyProofId = eventArgs(burnReceipt, context.furnace, "AlchemyProofCreated").proofId;
  await advanceTime(context.provider, 49);
  await (await context.wormhole.claim(alchemyProofId)).wait();

  const kufoAmount = 125_000n * ETHER;
  await assert.rejects(context.converter.connect(recipient).convert(kufoAmount, await context.signers[4].getAddress()));
  await (await context.kufo.connect(recipient).approve(await context.converter.getAddress(), kufoAmount)).wait();
  await (await context.converter.connect(recipient).convert(kufoAmount, await context.signers[4].getAddress())).wait();

  assert.equal(await context.kship.balanceOf(await context.signers[4].getAddress()), kufoAmount * 1_000n);
  assert.equal(await context.kufo.conservationInvariantHolds(), true);
  assert.equal(await context.kaios.conservationInvariantHolds(), true);
  const modeledMassKg =
    (await context.kaios.totalSupply()) +
    (await context.kufo.totalSupply()) / 1_000n +
    (await context.kship.totalSupply()) / 1_000_000n;
  assert.equal(modeledMassKg, (await context.kaios.settledKgenBurned()) * 1_000n);
  assert.equal(await context.kship.totalSupply(), await context.kship.totalMintedFromKufo());
});

test("token genesis supplies and native token taxes are zero", async () => {
  const context = await setupLineage();
  assert.equal(await context.kaios.totalSupply(), 0n);
  assert.equal(await context.kufo.totalSupply(), 0n);
  assert.equal(await context.kship.totalSupply(), 0n);

  await mintKaiosByBurningKgen(context, 1n * ETHER);
  const amount = 100n * ETHER;
  await (await context.kaios.connect(context.treasury).transfer(await context.signers[2].getAddress(), amount)).wait();
  assert.equal(await context.kaios.balanceOf(await context.signers[2].getAddress()), amount);
  assert.equal(await context.kaios.balanceOf(await context.treasury.getAddress()), 900n * ETHER);
});

test("full KGEN supply loss reaches but cannot exceed the KAIOS cap", async () => {
  const context = await setupLineage();
  const fullSupply = await context.kgen.totalSupply();
  await mintKaiosByBurningKgen(context, fullSupply);
  assert.equal(await context.kaios.totalSupply(), await context.kaios.cap());
  assert.equal(await context.kaios.remainingMintableSupply(), 0n);
  await assert.rejects(context.kaios.settleWhiteHoleMass());
});

test("OrganRegistry migration is bootstrap-sealed and timelocked", async () => {
  const context = await setupLineage({ delay: 3600 });
  const replacement = await deploy("MockOrgan", context.owner);

  await assert.rejects(context.registry.bootstrapOrgan(ORGAN_FURNACE_18911, await replacement.getAddress()));
  await (await context.registry.proposeOrgan(ORGAN_FURNACE_18911, await replacement.getAddress())).wait();
  await assert.rejects(context.registry.executeOrgan(ORGAN_FURNACE_18911));
  await advanceTime(context.provider, 3600);
  await (await context.registry.connect(context.signers[5]).executeOrgan(ORGAN_FURNACE_18911)).wait();
  assert.equal(await context.registry.organ(ORGAN_FURNACE_18911), await replacement.getAddress());
});

test("OrganRegistry rejects a governance delay shorter than one hour", async () => {
  const context = await setupLineage();
  await assert.rejects(
    deploy("KAIOSOrganRegistry", context.owner, [await context.owner.getAddress(), 3599]),
  );
});

test("Pair Registry is governance metadata and cannot alter token transfers", async () => {
  const context = await setupLineage();
  const pair = await deploy("MockOrgan", context.owner);
  const venue = id("TEST-AMM");
  await assert.rejects(
    context.pairRegistry.connect(context.signers[3]).registerPair(
      await context.kaios.getAddress(),
      await context.kufo.getAddress(),
      await pair.getAddress(),
      venue,
    ),
  );
  const pairId = await context.pairRegistry.registerPair.staticCall(
    await context.kaios.getAddress(),
    await context.kufo.getAddress(),
    await pair.getAddress(),
    venue,
  );
  await (
    await context.pairRegistry.registerPair(
      await context.kaios.getAddress(),
      await context.kufo.getAddress(),
      await pair.getAddress(),
      venue,
    )
  ).wait();
  await (await context.pairRegistry.setPairActive(pairId, false)).wait();
  assert.equal((await context.pairRegistry.pair(pairId)).active, false);

  await mintKaiosByBurningKgen(context, 1n * ETHER);
  await (await context.kaios.connect(context.treasury).transfer(await context.signers[2].getAddress(), 50n * ETHER)).wait();
  assert.equal(await context.kaios.balanceOf(await context.signers[2].getAddress()), 50n * ETHER);
});

test("migrated organs cannot mint KUFO or KSHIP without an immutable Token Core burn record", async () => {
  const context = await setupLineage({ delay: 3600 });
  const malicious = await deploy("MockMintOrgan", context.owner);
  for (const organId of [ORGAN_WORMHOLE_511111, ORGAN_KSHIP_CONVERTER]) {
    await (await context.registry.proposeOrgan(organId, await malicious.getAddress())).wait();
    await advanceTime(context.provider, 3600);
    await (await context.registry.executeOrgan(organId)).wait();
  }

  await assert.rejects(
    malicious.attemptKufoMint(await context.kufo.getAddress(), id("FAKE-KUFO-PROOF")),
  );
  await assert.rejects(
    malicious.attemptKshipMint(await context.kship.getAddress(), id("FAKE-KSHIP-PROOF")),
  );
  assert.equal(await context.kufo.totalSupply(), 0n);
  assert.equal(await context.kship.totalSupply(), 0n);
});
