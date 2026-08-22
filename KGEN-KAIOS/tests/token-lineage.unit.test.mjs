import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { id } from "ethers";
import {
  ETHER,
  ORGAN_FURNACE_18911,
  ORGAN_KAIOS,
  ORGAN_KSHIP_CONVERTER,
  ORGAN_LINGXIAO_BANK_18888,
  ORGAN_WORMHOLE_511111,
  advanceTime,
  cleanupProviders,
  deploy,
  eventArgs,
  mintKaiosByBurningKgen,
  setupLingxiaoBank,
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

test("fractional Friction Mirror settlement converts 0.5 KGEN to exactly 500 KAIOS", async () => {
  const context = await setupLineage();
  const burned = ETHER / 2n;
  const minted = await mintKaiosByBurningKgen(context, burned);

  assert.equal(minted, 500n * ETHER);
  assert.equal(await context.kaios.totalSupply(), 500n * ETHER);
  assert.equal(await context.kaios.settledKgenBurned(), burned);
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

  const latestBlock = await context.provider.getBlock("latest");
  const threeSecondsBeforeMaturity = Number(proof.maturityEpoch) * 20 - 3;
  const secondsUntilPreviousEpoch = threeSecondsBeforeMaturity - Number(latestBlock.timestamp);
  if (secondsUntilPreviousEpoch > 0) await advanceTime(context.provider, secondsUntilPreviousEpoch);
  assert.equal(await context.furnace.currentEpoch(), proof.maturityEpoch - 1n);
  await assert.rejects(context.wormhole.claim(proofId));
  await advanceTime(context.provider, 3);
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
  assert.equal(await context.kaios.totalSupply(), 72_000_000_000n * ETHER);
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

test("18888 fresh initialization is atomic, role-bound, replay-safe, and implementation-locked", async () => {
  const context = await setupLingxiaoBank();
  const adminAddress = await context.admin.getAddress();
  const upgraderAddress = await context.upgrader.getAddress();
  const deployerAddress = await context.deployer.getAddress();

  assert.equal(await context.bank.version(), "2.0.0");
  assert.equal(await context.bank.runtimeMode(), "MODULAR_POLICY_GATED_CIVILIZATION_BANK");
  assert.equal(await context.bank.kgen(), await context.kgen.getAddress());
  assert.equal(await context.bank.kaios(), "0x0000000000000000000000000000000000000000");
  assert.equal(await context.bank.kaiosBound(), false);
  assert.equal(await context.bank.kaiosBalance(), 0n);
  assert.equal(await context.bank.hasRole(await context.bank.DEFAULT_ADMIN_ROLE(), adminAddress), true);
  assert.equal(await context.bank.hasRole(await context.bank.UPGRADER_ROLE(), upgraderAddress), true);
  assert.equal(await context.bank.hasRole(await context.bank.DEFAULT_ADMIN_ROLE(), deployerAddress), false);
  assert.equal(await context.bank.hasRole(await context.bank.UPGRADER_ROLE(), deployerAddress), false);
  assert.equal(await context.bank.hasRole(await context.bank.PAYMENT_PROPOSER_ROLE(), adminAddress), false);
  assert.equal(await context.bank.hasRole(await context.bank.PAYMENT_APPROVER_ROLE(), adminAddress), false);

  await assert.rejects(
    context.bank.initialize(adminAddress, upgraderAddress, await context.kgen.getAddress()),
  );
  await assert.rejects(
    context.implementation.initialize(adminAddress, upgraderAddress, await context.kgen.getAddress()),
  );

  const sharedGovernanceData = context.implementation.interface.encodeFunctionData("initialize", [
    adminAddress,
    adminAddress,
    await context.kgen.getAddress(),
  ]);
  const sharedGovernanceProxy = await deploy("TestERC1967Proxy", context.deployer, [
    await context.implementation.getAddress(),
    sharedGovernanceData,
  ]);
  const sharedGovernanceBank = context.implementation
    .attach(await sharedGovernanceProxy.getAddress())
    .connect(context.admin);
  assert.equal(
    await sharedGovernanceBank.hasRole(await sharedGovernanceBank.DEFAULT_ADMIN_ROLE(), adminAddress),
    true,
  );
  assert.equal(
    await sharedGovernanceBank.hasRole(await sharedGovernanceBank.UPGRADER_ROLE(), adminAddress),
    true,
  );
  assert.equal(
    await sharedGovernanceBank.hasRole(await sharedGovernanceBank.DEFAULT_ADMIN_ROLE(), deployerAddress),
    false,
  );
});

test("18888 initializer rejects zero governance, zero KGEN, and non-contract KGEN", async () => {
  const context = await setupLingxiaoBank();
  const zero = "0x0000000000000000000000000000000000000000";
  const adminAddress = await context.admin.getAddress();
  const upgraderAddress = await context.upgrader.getAddress();
  const eoaAddress = await context.signers[5].getAddress();

  for (const args of [
    [zero, upgraderAddress, await context.kgen.getAddress()],
    [adminAddress, zero, await context.kgen.getAddress()],
    [adminAddress, upgraderAddress, zero],
    [adminAddress, upgraderAddress, eoaAddress],
  ]) {
    const data = context.implementation.interface.encodeFunctionData("initialize", args);
    await assert.rejects(
      deploy("TestERC1967Proxy", context.deployer, [await context.implementation.getAddress(), data]),
    );
  }
});

test("18888 binds one lineage-correct KAIOS and receives direct ERC20 mint without callback", async () => {
  const context = await setupLingxiaoBank();
  const zero = "0x0000000000000000000000000000000000000000";
  const eoaAddress = await context.signers[5].getAddress();

  await assert.rejects(context.bank.connect(context.deployer).bindKAIOS(zero));
  await assert.rejects(context.bank.bindKAIOS(zero));
  await assert.rejects(context.bank.bindKAIOS(eoaAddress));

  const wrongKgen = await deploy("MockKGEN", context.deployer, [await context.deployer.getAddress()]);
  const wrongKgenKaios = await deploy("MockKAIOSForTreasury", context.deployer, [
    await wrongKgen.getAddress(),
    await context.bank.getAddress(),
  ]);
  await assert.rejects(context.bank.bindKAIOS(await wrongKgenKaios.getAddress()));

  const wrongTreasuryKaios = await deploy("MockKAIOSForTreasury", context.deployer, [
    await context.kgen.getAddress(),
    eoaAddress,
  ]);
  await assert.rejects(context.bank.bindKAIOS(await wrongTreasuryKaios.getAddress()));

  const mockKaios = await deploy("MockKAIOSForTreasury", context.deployer, [
    await context.kgen.getAddress(),
    await context.bank.getAddress(),
  ]);
  await (await context.bank.bindKAIOS(await mockKaios.getAddress())).wait();
  assert.equal(await context.bank.kaios(), await mockKaios.getAddress());
  assert.equal(await context.bank.kaiosBound(), true);

  const amount = 1_888n * ETHER;
  await (await mockKaios.mintToTreasury(amount)).wait();
  assert.equal(await mockKaios.balanceOf(await context.bank.getAddress()), amount);
  assert.equal(await context.bank.kaiosBalance(), amount);
  await assert.rejects(context.bank.bindKAIOS(await mockKaios.getAddress()));
  await assert.rejects(context.admin.sendTransaction({ to: await context.bank.getAddress(), value: 1n }));
});

test("formal KAIOS Friction Mirror settles only into the bound 18888 proxy", async () => {
  const context = await setupLingxiaoBank();
  const kaios = await deploy("KAIOS", context.deployer, [
    await context.kgen.getAddress(),
    await context.bank.getAddress(),
    await context.registry.getAddress(),
  ]);

  await (await context.bank.bindKAIOS(await kaios.getAddress())).wait();
  await (await context.registry.connect(context.admin).bootstrapOrgan(ORGAN_LINGXIAO_BANK_18888, await context.bank.getAddress())).wait();
  await (await context.registry.connect(context.admin).bootstrapOrgan(ORGAN_KAIOS, await kaios.getAddress())).wait();

  assert.equal(await context.registry.ORGAN_LINGXIAO_BANK_18888(), ORGAN_LINGXIAO_BANK_18888);
  assert.equal(await context.registry.ORGAN_KAIOS(), ORGAN_KAIOS);
  assert.equal(await context.registry.organ(ORGAN_LINGXIAO_BANK_18888), await context.bank.getAddress());
  assert.equal(await context.registry.organ(ORGAN_KAIOS), await kaios.getAddress());
  assert.equal(await kaios.LINGXIAO_TREASURY_18888(), await context.bank.getAddress());

  const burned = 8n * ETHER;
  await (await context.kgen.connect(context.deployer).burn(burned)).wait();
  await (await kaios.connect(context.signers[6]).settleWhiteHoleMass()).wait();
  const expected = burned * 1_000n;
  assert.equal(await kaios.balanceOf(await context.bank.getAddress()), expected);
  assert.equal(await context.bank.kaiosBalance(), expected);
});

test("18888 lawful outflow requires distinct proposal, approval, delay, and beneficiary claim", async () => {
  const context = await setupLingxiaoBank();
  const proposer = context.signers[3];
  const approver = context.signers[4];
  const beneficiary = context.signers[5];
  const attacker = context.signers[6];
  const mockKaios = await deploy("MockKAIOSForTreasury", context.deployer, [
    await context.kgen.getAddress(),
    await context.bank.getAddress(),
  ]);
  await (await context.bank.bindKAIOS(await mockKaios.getAddress())).wait();
  await (await mockKaios.mintToTreasury(2_000n * ETHER)).wait();

  await (
    await context.bank.grantRole(await context.bank.PAYMENT_PROPOSER_ROLE(), await proposer.getAddress())
  ).wait();
  await (
    await context.bank.grantRole(await context.bank.PAYMENT_APPROVER_ROLE(), await approver.getAddress())
  ).wait();
  await (
    await context.bank.grantRole(await context.bank.PAYMENT_APPROVER_ROLE(), await proposer.getAddress())
  ).wait();

  const disbursementId = id("18888-CELESTIAL-SALARY-EPOCH-1-SEAT-1");
  const purposeHash = id("500-seat salary resolution #1");
  const latest = await context.provider.getBlock("latest");
  const executableAt = BigInt(latest.timestamp) + 3_601n;
  await (
    await context.bank.connect(proposer).proposeDisbursement(
      disbursementId,
      await beneficiary.getAddress(),
      500n * ETHER,
      purposeHash,
      executableAt,
    )
  ).wait();

  await assert.rejects(context.bank.connect(proposer).approveDisbursement(disbursementId));
  await assert.rejects(context.bank.connect(attacker).approveDisbursement(disbursementId));
  await (await context.bank.connect(approver).approveDisbursement(disbursementId)).wait();
  await assert.rejects(context.bank.connect(attacker).claimDisbursement(disbursementId));
  await assert.rejects(context.bank.connect(beneficiary).claimDisbursement(disbursementId));
  await advanceTime(context.provider, 3_601);
  await (
    await context.bank.connect(beneficiary).claimDisbursement(disbursementId, { gasLimit: 500_000 })
  ).wait();

  assert.equal(await mockKaios.balanceOf(await beneficiary.getAddress()), 500n * ETHER);
  assert.equal(await context.bank.totalKaiosDisbursed(), 500n * ETHER);
  assert.equal((await context.bank.disbursement(disbursementId)).executed, true);
  await assert.rejects(context.bank.connect(beneficiary).claimDisbursement(disbursementId));
});

test("18888 UUPS upgrades require UPGRADER_ROLE and preserve locked settlement state", async () => {
  const context = await setupLingxiaoBank();
  const replacement = await deploy("LingxiaoCelestialBank18888_Upgradeable", context.deployer);

  await assert.rejects(
    context.bank.connect(context.deployer).upgradeToAndCall(await replacement.getAddress(), "0x"),
  );
  await assert.rejects(
    context.bank.connect(context.admin).upgradeToAndCall(await replacement.getAddress(), "0x"),
  );
  await (
    await context.bank.connect(context.upgrader).upgradeToAndCall(await replacement.getAddress(), "0x")
  ).wait();

  const implementationSlot =
    "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
  const stored = await context.provider.getStorage(await context.bank.getAddress(), implementationSlot);
  assert.equal(`0x${stored.slice(-40)}`.toLowerCase(), (await replacement.getAddress()).toLowerCase());
  assert.equal(await context.bank.kgen(), await context.kgen.getAddress());
  assert.equal(await context.bank.runtimeMode(), "MODULAR_POLICY_GATED_CIVILIZATION_BANK");
});
