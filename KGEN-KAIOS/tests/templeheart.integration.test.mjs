import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { Contract, id } from "ethers";
import {
  ETHER,
  artifact,
  cleanupProviders,
  deploy,
  eventArgs,
  mintKaiosByBurningKgen,
  setupLineage,
} from "./helpers.mjs";

afterEach(cleanupProviders);

async function deployTempleHeart(context) {
  const implementation = await deploy("KGEN_TempleHeart_Upgradeable", context.owner);
  const compiled = artifact("KGEN_TempleHeart_Upgradeable");
  const initData = implementation.interface.encodeFunctionData("initialize", [
    await context.owner.getAddress(),
    await context.owner.getAddress(),
    await context.owner.getAddress(),
    await context.signers[4].getAddress(),
    await context.kgen.getAddress(),
    await context.owner.getAddress(),
    await context.kaios.getAddress(),
  ]);
  const proxy = await deploy("TestERC1967Proxy", context.owner, [await implementation.getAddress(), initData]);
  return {
    implementation,
    proxy,
    heart: new Contract(await proxy.getAddress(), compiled.abi, context.owner),
  };
}

test("TempleHeart accepts only a holder-bound KAIOS Alchemy proof with wish-bound destination", async () => {
  const context = await setupLineage({ epochSeconds: 10 });
  const { heart } = await deployTempleHeart(context);
  await mintKaiosByBurningKgen(context, 2n * ETHER);

  const civilizationId = id("CIV-12345");
  const wishHash = id("WISH-12345");
  await (await heart.connect(context.treasury).makeWish(wishHash, civilizationId)).wait();
  const purpose = await heart.offeringPurposeCode(1);
  const destination = await heart.alchemyDestinationCode(purpose, wishHash);
  const amount = 250n * ETHER;
  await (await context.kaios.connect(context.treasury).approve(await context.furnace.getAddress(), amount)).wait();
  const burnReceipt = await (
    await context.furnace.connect(context.treasury).burnForKufo(
      amount,
      await context.treasury.getAddress(),
      civilizationId,
      destination,
    )
  ).wait();
  const proofId = eventArgs(burnReceipt, context.furnace, "AlchemyProofCreated").proofId;

  await (await heart.connect(context.treasury).recordBurnOffering(proofId, 1)).wait();
  assert.equal(await heart.totalOfferingKaiosBurned(), amount);
  assert.equal(await heart.offeringBurnProofConsumed(proofId), true);
  await assert.rejects(heart.connect(context.treasury).recordBurnOffering(proofId, 1));
});

test("TempleHeart rejects beneficiary redirect and mismatched purpose proofs", async () => {
  const context = await setupLineage({ epochSeconds: 10 });
  const { heart } = await deployTempleHeart(context);
  await mintKaiosByBurningKgen(context, 2n * ETHER);
  const civilizationId = id("CIV-ATTACK");
  const wishHash = id("WISH-ATTACK");
  await (await heart.connect(context.treasury).makeWish(wishHash, civilizationId)).wait();
  const purpose = await heart.offeringPurposeCode(1);
  const destination = await heart.alchemyDestinationCode(purpose, wishHash);
  const amount = 100n * ETHER;
  await (await context.kaios.connect(context.treasury).approve(await context.furnace.getAddress(), 2n * amount)).wait();

  const redirectReceipt = await (
    await context.furnace.connect(context.treasury).burnForKufo(
      amount,
      await context.signers[3].getAddress(),
      civilizationId,
      destination,
    )
  ).wait();
  const redirectProof = eventArgs(redirectReceipt, context.furnace, "AlchemyProofCreated").proofId;
  await assert.rejects(heart.connect(context.treasury).recordBurnOffering(redirectProof, 1));

  const mismatchReceipt = await (
    await context.furnace.connect(context.treasury).burnForKufo(
      amount,
      await context.treasury.getAddress(),
      civilizationId,
      id("WRONG-PURPOSE"),
    )
  ).wait();
  const mismatchProof = eventArgs(mismatchReceipt, context.furnace, "AlchemyProofCreated").proofId;
  await assert.rejects(heart.connect(context.treasury).recordBurnOffering(mismatchProof, 1));
});

test("TempleHeart UUPS upgrade is role-gated and preserves custom storage", async () => {
  const context = await setupLineage();
  const { heart } = await deployTempleHeart(context);
  const civilizationId = id("CIV-STORAGE");
  const wishHash = id("WISH-STORAGE");
  await (await heart.connect(context.treasury).makeWish(wishHash, civilizationId)).wait();
  const replacement = await deploy("KGEN_TempleHeart_Upgradeable", context.owner);

  await assert.rejects(
    heart.connect(context.signers[3]).upgradeToAndCall(await replacement.getAddress(), "0x"),
  );
  await (await heart.upgradeToAndCall(await replacement.getAddress(), "0x")).wait();
  assert.equal((await heart.activeWish(await context.treasury.getAddress())).wishHash, wishHash);
  assert.equal(await heart.version(), "3.3.2");
  await assert.rejects(heart.initializeAlchemyIntegration(await context.kaios.getAddress()));
});
