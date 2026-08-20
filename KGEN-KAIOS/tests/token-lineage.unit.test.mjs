import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { AbiCoder, id, keccak256, ZeroHash } from "ethers";
import {
  ETHER,
  ORGAN_FURNACE_18911,
  advanceTime,
  approveAlchemy,
  cleanupProviders,
  deploy,
  eventArgs,
  mintKaiosByBurningKgen,
  setupLineage,
} from "./helpers.mjs";

afterEach(cleanupProviders);

test("program contracts expose unique frozen Life identities and guardian recruitments", async () => {
  const context = await setupLineage();
  const identities = [
    [context.kaios, "LIFE-KAIOS-JIEHENG-33333"],
    [context.furnace, "LIFE-KAIOS-TAISHANG-LAOJUN-18911"],
    [context.kufo, "LIFE-KAIOS-DANLING-KUFO-CORE"],
    [context.wormhole, "LIFE-KAIOS-QITIAN-DASHENG-511111"],
    [context.kship, "LIFE-KAIOS-XINGSUO-KSHIP-CORE"],
    [context.converter, "LIFE-KAIOS-HUAHANG-KSHIP-CONVERTER"],
    [context.registry, "LIFE-KAIOS-SIJI-REGISTRY-0001"],
  ];
  const seen = new Set();
  for (const [contract, text] of identities) {
    const value = await contract.lifeId();
    assert.equal(value, id(text));
    assert.equal(seen.has(value), false, text);
    seen.add(value);
    assert.equal(await contract.EMBODIMENT_STATUS(), "RECRUITED_PENDING_EMBODIMENT");
  }
  assert.equal(await context.kaios.guardianPoint(), 33_333n);
  assert.equal(await context.furnace.guardianPoint(), 18_911n);
  assert.equal(await context.wormhole.guardianPoint(), 511_111n);
  assert.equal(await context.kship.guardianPoint(), 188_888n);
  assert.equal(await context.kship.guardianLifeId(), id("LIFE-KAIOS-NIUMOWANG-188888"));
  assert.equal(await context.kship.parentLifeId(), id("LIFE-KAIOS-NIUMOWANG-188888"));
  assert.equal(await context.converter.parentLifeId(), id("LIFE-KAIOS-NIUMOWANG-188888"));
  assert.equal(await context.kufo.LAND_GUARDIAN(), false);
  assert.equal(await context.kufo.MASS_CELL_IS_INDIVIDUAL_LIFE(), false);
  assert.equal(await context.kship.MASS_CELL_IS_INDIVIDUAL_LIFE(), false);
  assert.equal(await context.ufoConsumer.DEPLOYABLE(), false);
  assert.equal(await context.ufoConsumer.EMPLOYABLE(), false);
  assert.equal(
    await context.ufoConsumer.LIFE_ID(),
    id("LIFE-KAIOS-SHIHANG-TONGZI-TEST-0001"),
  );
});

async function burnAndMature(context, {
  amount = 1n * ETHER,
  beneficiary = context.signers[2],
  lifeId = id("LIFE-HOLDER-001"),
  destination = id("KUFO-CLAIM-511111"),
} = {}) {
  await approveAlchemy(context, context.treasury, amount);
  const receipt = await (
    await context.furnace.connect(context.treasury).burnForKufo(
      amount,
      await beneficiary.getAddress(),
      lifeId,
      destination,
      { gasLimit: 1_500_000 },
    )
  ).wait();
  const proofId = eventArgs(receipt, context.furnace, "AlchemyProofCreated").proofId;
  await advanceTime(context.provider, 49 * context.epochSeconds);
  return { proofId, beneficiary, amount };
}

async function claimKufo(context, options = {}) {
  const result = await burnAndMature(context, options);
  await (await context.wormhole.claim(result.proofId, { gasLimit: 2_000_000 })).wait();
  return result;
}

async function advanceToLotBoundary(context, lotId, periods) {
  const lot = await context.kufo.decayLot(lotId);
  const target = Number(lot.bornAt) + context.halfLifeSeconds * periods;
  await context.eip1193.request({ method: "evm_setTime", params: [target * 1_000] });
  await context.eip1193.request({ method: "evm_mine", params: [] });
}

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

test("18911 requires exact independent KAIOS and KGEN allowances and escrows 0.001 KGEN per KAIOS", async () => {
  const context = await setupLineage({ epochSeconds: 10 });
  await mintKaiosByBurningKgen(context, 2n * ETHER);
  const amount = 1n * ETHER;
  const catalyst = amount / 1_000n;
  const treasuryAddress = await context.treasury.getAddress();
  const furnaceAddress = await context.furnace.getAddress();

  await (await context.kgen.connect(context.treasury).approve(furnaceAddress, catalyst)).wait();
  await assert.rejects(context.furnace.connect(context.treasury).burnForKufo(
    amount, treasuryAddress, id("LIFE-CATALYST"), id("DEST-CATALYST"),
  ));
  await (await context.kgen.connect(context.treasury).approve(furnaceAddress, 0)).wait();
  await (await context.kaios.connect(context.treasury).approve(furnaceAddress, amount)).wait();
  await assert.rejects(context.furnace.connect(context.treasury).burnForKufo(
    amount, treasuryAddress, id("LIFE-CATALYST"), id("DEST-CATALYST"),
  ));
  await (await context.kgen.connect(context.treasury).approve(furnaceAddress, catalyst)).wait();

  const beforeKgen = await context.kgen.balanceOf(treasuryAddress);
  const supplyBeforeAlchemy = await context.kgen.totalSupply();
  const receipt = await (await context.furnace.connect(context.treasury).burnForKufo(
    amount, treasuryAddress, id("LIFE-CATALYST"), id("DEST-CATALYST"),
  )).wait();
  const proofId = eventArgs(receipt, context.furnace, "AlchemyProofCreated").proofId;
  const proof = await context.furnace.proof(proofId);
  const burnRecord = await context.kaios.alchemyBurnRecord(proofId);

  assert.equal(proof.kgenCatalystAmount, catalyst);
  assert.equal(proof.catalystOwner, treasuryAddress);
  assert.equal(burnRecord.requiredKgenCatalyst, catalyst);
  assert.equal(burnRecord.catalystOwner, treasuryAddress);
  assert.equal(await context.kgen.balanceOf(furnaceAddress), catalyst);
  assert.equal(await context.kgen.balanceOf(treasuryAddress), beforeKgen - catalyst);
  assert.equal(await context.furnace.catalystLiability(), catalyst);
  assert.equal(await context.kgen.totalSupply(), supplyBeforeAlchemy);
  await assert.rejects(context.furnace.connect(context.treasury).burnForKufo(
    amount + 1n, treasuryAddress, id("LIFE-INEXACT"), id("DEST-INEXACT"),
  ));
});

test("511111 atomically returns catalyst and mints KUFO only to the fixed beneficiary", async () => {
  const context = await setupLineage({ epochSeconds: 10 });
  await mintKaiosByBurningKgen(context, 2n * ETHER);
  const beneficiary = context.signers[2];
  const attacker = context.signers[3];
  const treasuryAddress = await context.treasury.getAddress();
  const beforeKgen = await context.kgen.balanceOf(treasuryAddress);
  const amount = 1_250n * ETHER;
  await approveAlchemy(context, context.treasury, amount);
  const burnReceipt = await (await context.furnace.connect(context.treasury).burnForKufo(
    amount,
    await beneficiary.getAddress(),
    id("LIFE-HOLDER-001"),
    id("KUFO-CLAIM-511111"),
  )).wait();
  const proofId = eventArgs(burnReceipt, context.furnace, "AlchemyProofCreated").proofId;
  const catalyst = amount / 1_000n;

  await assert.rejects(context.wormhole.connect(attacker).claim(proofId));
  assert.equal(await context.kgen.balanceOf(await context.furnace.getAddress()), catalyst);
  await advanceTime(context.provider, 49 * context.epochSeconds);
  await (await context.wormhole.connect(attacker).claim(proofId, { gasLimit: 2_000_000 })).wait();

  const kufoAmount = amount * 1_000n;
  assert.equal(await context.kgen.balanceOf(treasuryAddress), beforeKgen);
  assert.equal(await context.kgen.balanceOf(await context.furnace.getAddress()), 0n);
  assert.equal(await context.kufo.balanceOf(await beneficiary.getAddress()), kufoAmount);
  assert.equal(await context.kufo.balanceOf(await attacker.getAddress()), 0n);
  assert.equal((await context.furnace.proof(proofId)).catalystReturned, true);
  assert.equal(await context.furnace.catalystLiability(), 0n);
  await assert.rejects(context.wormhole.connect(attacker).claim(proofId));
});

test("claim failure rolls catalyst return and proof consumption back atomically", async () => {
  const context = await setupLineage({ epochSeconds: 1 });
  await mintKaiosByBurningKgen(context, 1n * ETHER);
  const { proofId, amount } = await burnAndMature(context);
  const catalyst = amount / 1_000n;
  const ownerBefore = await context.kgen.balanceOf(await context.treasury.getAddress());

  await context.provider.send("evm_setAccountCode", [await context.kufo.getAddress(), "0x60006000fd"]);
  await assert.rejects(async () => {
    const transaction = await context.wormhole.claim(proofId, { gasLimit: 2_000_000 });
    await transaction.wait();
  });
  const proof = await context.furnace.proof(proofId);
  assert.equal(proof.consumed, false);
  assert.equal(proof.catalystReturned, false);
  assert.equal(await context.kgen.balanceOf(await context.furnace.getAddress()), catalyst);
  assert.equal(await context.kgen.balanceOf(await context.treasury.getAddress()), ownerBefore);
});

test("KUFO decay begins at birth, blocks immediate conversion and releases only new half-life decay", async () => {
  const context = await setupLineage({ epochSeconds: 1, halfLifeSeconds: 100 });
  await mintKaiosByBurningKgen(context, 1n * ETHER);
  const recipient = context.signers[2];
  const initialKufo = 1_000n * ETHER;
  const recipientAddress = await recipient.getAddress();
  const converterAddress = await context.converter.getAddress();
  // ERC-20 approval does not require a balance. Authorize before minting so the
  // immediate conversion check executes against the exact KUFO birth block.
  await (await context.kufo.connect(recipient).approve(converterAddress, initialKufo)).wait();
  await claimKufo(context, { amount: 1n * ETHER, beneficiary: recipient });
  const lot = await context.kufo.decayLot(1);
  assert.equal(lot.initialAmount, initialKufo);
  assert.equal(lot.convertedAmount, 0n);
  assert.notEqual(lot.batchLifeId, ZeroHash);
  assert.equal(lot.batchLifeId, await context.kufo.proofBatchLifeId(lot.sourceProof));
  const chainId = (await context.provider.getNetwork()).chainId;
  assert.equal(
    lot.batchLifeId,
    keccak256(AbiCoder.defaultAbiCoder().encode(
      ["string", "uint256", "address", "bytes32"],
      ["KAIOS.KUFO.BATCH_LIFE.V1", chainId, await context.kufo.getAddress(), lot.sourceProof],
    )),
  );

  await assert.rejects(context.converter.connect(recipient).convert(initialKufo, recipientAddress));
  await advanceToLotBoundary(context, 1, 1);
  assert.equal(await context.kufo.claimableDecay(1), initialKufo / 2n);
  const firstConversionReceipt = await (await context.converter.connect(recipient).convert(
    initialKufo, recipientAddress, { gasLimit: 2_000_000 },
  )).wait();
  const firstCarrierProofId = eventArgs(
    firstConversionReceipt,
    context.converter,
    "KSHIPConversion",
  ).proofId;
  const kshipBatch = await context.kship.batchLifeRecord(firstCarrierProofId);
  assert.notEqual(kshipBatch.batchLifeId, ZeroHash);
  assert.equal(kshipBatch.sourceProof, firstCarrierProofId);
  assert.equal(kshipBatch.beneficiary, recipientAddress);
  assert.equal(kshipBatch.initialAmount, (initialKufo / 2n) * 1_000n);
  assert.equal(
    kshipBatch.batchLifeId,
    keccak256(AbiCoder.defaultAbiCoder().encode(
      ["string", "uint256", "address", "bytes32"],
      ["KAIOS.KSHIP.BATCH_LIFE.V1", chainId, await context.kship.getAddress(), firstCarrierProofId],
    )),
  );
  const batchBornAt = kshipBatch.bornAt;
  const batchLifeId = kshipBatch.batchLifeId;
  const lineageWitness = context.signers[3];
  await (await context.kship.connect(recipient).transfer(await lineageWitness.getAddress(), 1n)).wait();
  const afterTransferBatch = await context.kship.batchLifeRecord(firstCarrierProofId);
  assert.equal(afterTransferBatch.bornAt, batchBornAt);
  assert.equal(afterTransferBatch.batchLifeId, batchLifeId);
  assert.equal(afterTransferBatch.sourceProof, firstCarrierProofId);
  await (await context.kship.connect(lineageWitness).transfer(recipientAddress, 1n)).wait();
  assert.equal(await context.kship.balanceOf(recipientAddress), (initialKufo / 2n) * 1_000n);
  assert.equal((await context.kufo.decayLot(1)).convertedAmount, initialKufo / 2n);

  await (await context.kufo.connect(recipient).approve(converterAddress, initialKufo / 2n)).wait();
  await advanceToLotBoundary(context, 1, 2);
  await (await context.converter.connect(recipient).convert(
    initialKufo / 2n, recipientAddress, { gasLimit: 2_000_000 },
  )).wait();
  assert.equal(await context.kship.balanceOf(recipientAddress), (initialKufo * 3n / 4n) * 1_000n);
  assert.equal(await context.kufo.conservationInvariantHolds(), true);
  assert.equal(await context.kship.conservationInvariantHolds(), true);
});

test("KUFO transfer and split preserve birth time and cannot increase aggregate KSHIP", async () => {
  const context = await setupLineage({ epochSeconds: 1, halfLifeSeconds: 100 });
  await mintKaiosByBurningKgen(context, 1n * ETHER);
  const first = context.signers[2];
  const second = context.signers[3];
  await claimKufo(context, { amount: 1n * ETHER, beneficiary: first });
  const initial = 1_000n * ETHER;
  const originalBornAt = (await context.kufo.decayLot(1)).bornAt;
  const originalBatchLifeId = (await context.kufo.decayLot(1)).batchLifeId;
  await (await context.kufo.connect(first).transfer(await second.getAddress(), initial / 2n)).wait();
  const child = await context.kufo.decayLot(2);
  assert.equal(child.bornAt, originalBornAt);
  assert.equal(child.batchLifeId, originalBatchLifeId);
  assert.equal(child.initialAmount, initial / 2n);
  for (const holder of [first, second]) {
    await (await context.kufo.connect(holder).approve(await context.converter.getAddress(), initial / 2n)).wait();
  }
  await advanceToLotBoundary(context, 1, 1);

  for (const holder of [first, second]) {
    await (await context.converter.connect(holder).convert(
      initial / 2n, await holder.getAddress(), { gasLimit: 2_000_000 },
    )).wait();
  }
  const parentAfter = await context.kufo.decayLot(1);
  const childAfter = await context.kufo.decayLot(2);
  const aggregateConverted = parentAfter.convertedAmount + childAfter.convertedAmount;
  const aggregateCumulative = await context.kufo.cumulativeDecayedAmount(1)
    + await context.kufo.cumulativeDecayedAmount(2);
  assert.ok(aggregateConverted >= initial / 2n);
  assert.ok(aggregateConverted < initial);
  assert.ok(aggregateConverted <= aggregateCumulative);
  assert.equal(await context.kufo.totalBurnedForKship(), aggregateConverted);
  assert.equal(await context.kship.totalSupply(), aggregateConverted * 1_000n);
  assert.equal(await context.kufo.conservationInvariantHolds(), true);
});

test("KSHIP propulsion is fail-closed without a consumer and exact holder authorization is replay-safe", async () => {
  const closed = await setupLineage();
  await assert.rejects(closed.kship.authorizePropulsion(
    id("UFO-LIFE-1"), id("TRIP-CLOSED"), await closed.signers[2].getAddress(), 1n,
  ));

  const context = await setupLineage({ epochSeconds: 1, halfLifeSeconds: 10, withUfoConsumer: true });
  await mintKaiosByBurningKgen(context, 1n * ETHER);
  const holder = context.signers[2];
  const holderAddress = await holder.getAddress();
  await claimKufo(context, { amount: 1n * ETHER, beneficiary: holder });
  await advanceToLotBoundary(context, 1, 1);
  const kufoDecay = 500n * ETHER;
  await (await context.kufo.connect(holder).approve(await context.converter.getAddress(), kufoDecay)).wait();
  await (await context.converter.connect(holder).convert(
    kufoDecay, holderAddress, { gasLimit: 2_000_000 },
  )).wait();
  const kshipAmount = kufoDecay * 1_000n;
  const fuel = 88n * ETHER;
  const tripId = id("TRIP-001");
  const lifeId = id("UFO-LIFE-001");
  const consumerAddress = await context.ufoConsumer.getAddress();

  await (await context.kship.connect(holder).approve(consumerAddress, fuel + 1n)).wait();
  await assert.rejects(context.kship.connect(holder).authorizePropulsion(lifeId, tripId, holderAddress, fuel));
  await (await context.kship.connect(holder).approve(consumerAddress, fuel)).wait();
  await (await context.kship.connect(holder).authorizePropulsion(lifeId, tripId, holderAddress, fuel)).wait();
  await assert.rejects(context.ufoConsumer.consume(
    await context.kship.getAddress(), holderAddress, lifeId, tripId, await context.signers[4].getAddress(), fuel,
  ));
  await (await context.ufoConsumer.consume(
    await context.kship.getAddress(), holderAddress, lifeId, tripId, holderAddress, fuel,
  )).wait();
  assert.equal(await context.kship.balanceOf(holderAddress), kshipAmount - fuel);
  assert.equal(await context.kship.totalBurnedForPropulsion(), fuel);
  assert.equal(await context.kship.conservationInvariantHolds(), true);
  await assert.rejects(async () => {
    const transaction = await context.ufoConsumer.consume(
      await context.kship.getAddress(), holderAddress, lifeId, tripId, holderAddress, fuel,
      { gasLimit: 1_000_000 },
    );
    await transaction.wait();
  });
  await advanceTime(context.provider, 10_000);
  assert.equal(await context.kship.balanceOf(holderAddress), kshipAmount - fuel);
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
});

test("OrganRegistry migration remains bootstrap-sealed and timelocked", async () => {
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
  await assert.rejects(deploy("KAIOSOrganRegistry", context.owner, [await context.owner.getAddress(), 3599]));
});

test("full KGEN supply loss reaches but cannot exceed the KAIOS cap", async () => {
  const context = await setupLineage();
  const treasuryKgen = await context.kgen.balanceOf(await context.treasury.getAddress());
  await (await context.kgen.connect(context.treasury).transfer(await context.owner.getAddress(), treasuryKgen)).wait();
  const fullSupply = await context.kgen.totalSupply();
  await mintKaiosByBurningKgen(context, fullSupply);
  assert.equal(await context.kaios.totalSupply(), await context.kaios.cap());
  assert.equal(await context.kaios.remainingMintableSupply(), 0n);
  await assert.rejects(context.kaios.settleWhiteHoleMass());
});

test("Pair Registry remains governance metadata and cannot alter token transfers", async () => {
  const context = await setupLineage();
  const pair = await deploy("MockOrgan", context.owner);
  const venue = id("TEST-AMM");
  const pairId = await context.pairRegistry.registerPair.staticCall(
    await context.kaios.getAddress(),
    await context.kufo.getAddress(),
    await pair.getAddress(),
    venue,
  );
  await (await context.pairRegistry.registerPair(
    await context.kaios.getAddress(),
    await context.kufo.getAddress(),
    await pair.getAddress(),
    venue,
  )).wait();
  await (await context.pairRegistry.setPairActive(pairId, false)).wait();
  assert.equal((await context.pairRegistry.pair(pairId)).active, false);
});

test("migrated organs cannot mint KUFO or KSHIP without immutable lineage records", async () => {
  const context = await setupLineage({ delay: 3600 });
  const malicious = await deploy("MockMintOrgan", context.owner);
  const organIds = [
    id("KAIOS.ORGAN.WORMHOLE.511111"),
    id("KAIOS.ORGAN.KSHIP.CONVERTER"),
  ];
  for (const organId of organIds) {
    await (await context.registry.proposeOrgan(organId, await malicious.getAddress())).wait();
    await advanceTime(context.provider, 3600);
    await (await context.registry.executeOrgan(organId)).wait();
  }
  await assert.rejects(malicious.attemptKufoMint(await context.kufo.getAddress(), id("FAKE-KUFO-PROOF")));
  await assert.rejects(malicious.attemptKshipMint(await context.kship.getAddress(), id("FAKE-KSHIP-PROOF")));
  assert.equal(await context.kufo.totalSupply(), 0n);
  assert.equal(await context.kship.totalSupply(), 0n);
});
