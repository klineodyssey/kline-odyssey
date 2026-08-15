import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { Contract, id } from "ethers";
import {
  ETHER,
  SPECIAL_ALCHEMY_DESTINATION,
  advanceTime,
  allocateKaios,
  cleanupProviders,
  deploy,
  deployUpgradeable,
  eventArgs,
  setupPhase2System,
} from "./helpers.mjs";

afterEach(cleanupProviders);

async function settle(context, wholeKgen) {
  await (await context.kgen.connect(context.deployer).burn(BigInt(wholeKgen) * ETHER)).wait();
  await (await context.kaios.settleWhiteHoleMass()).wait();
}

async function bindLife(context, lifeId, beneficiary = context.life) {
  const eligibility = context.phase2.eligibility.contract;
  await (await eligibility.bindLife(lifeId, await beneficiary.getAddress(), true)).wait();
  await (await eligibility.setReserveRedemptionEligibility(lifeId, true)).wait();
}

async function burnForProof(context, signer, amount, lifeId, destinationCode = SPECIAL_ALCHEMY_DESTINATION) {
  await (await context.kaios.connect(signer).approve(await context.furnace.getAddress(), amount)).wait();
  const receipt = await (
    await context.furnace.connect(signer).burnForKufo(
      amount,
      await signer.getAddress(),
      lifeId,
      destinationCode,
    )
  ).wait();
  return eventArgs(receipt, context.furnace, "AlchemyProofCreated").proofId;
}

test("reserve redemption enforces 1000 KAIOS to at most one existing KGEN without mint or burn", async () => {
  const context = await setupPhase2System();
  const eligibility = context.phase2.eligibility.contract;
  const redemption = context.phase2.redemption.contract;
  const lifeId = id("PHASE2-LIFE-REDEMPTION");
  await bindLife(context, lifeId);
  await settle(context, 5);
  await allocateKaios(context, context.life, 4_000n * ETHER, "REDEMPTION");
  await (
    await context.kgen.connect(context.deployer).transfer(await redemption.getAddress(), 5n * ETHER)
  ).wait();
  await (await context.kaios.connect(context.life).approve(await redemption.getAddress(), 3_000n * ETHER)).wait();

  const kgenSupplyBefore = await context.kgen.totalSupply();
  const kaiosSupplyBefore = await context.kaios.totalSupply();
  const bankKaiosBefore = await context.bank.kaiosBalance();
  const beneficiaryKgenBefore = await context.kgen.balanceOf(await context.life.getAddress());
  const deadline = BigInt((await context.provider.getBlock("latest")).timestamp + 3_600);

  await (
    await redemption.connect(context.life).requestRedemption(id("R-999"), lifeId, 999n * ETHER, deadline)
  ).wait();
  await (
    await redemption.connect(context.life).requestRedemption(id("R-1000"), lifeId, 1_000n * ETHER, deadline)
  ).wait();
  await (
    await redemption.connect(context.life).requestRedemption(id("R-1001"), lifeId, 1_001n * ETHER, deadline)
  ).wait();

  assert.equal(
    await context.kgen.balanceOf(await context.life.getAddress()),
    beneficiaryKgenBefore + 3n * ETHER,
  );
  assert.equal(await context.bank.kaiosBalance(), bankKaiosBefore + 3_000n * ETHER);
  assert.equal(await context.kgen.totalSupply(), kgenSupplyBefore);
  assert.equal(await context.kaios.totalSupply(), kaiosSupplyBefore);
  assert.equal((await redemption.request(id("R-1001"))).maxKgenOut, 1_001n * ETHER / 1_000n);
  assert.equal((await redemption.request(id("R-1001"))).actualKgenOut, 1_001n * ETHER / 1_000n);
  await assert.rejects(async () => (
    await redemption.connect(context.life).requestRedemption(
      id("R-1000"), lifeId, 1_000n * ETHER, deadline, { gasLimit: 1_000_000 },
    )
  ).wait());

  const attackerBefore = await context.kgen.balanceOf(await context.outsider.getAddress());
  await (await context.kaios.connect(context.life).transfer(await context.outsider.getAddress(), 1_000n * ETHER)).wait();
  await (await context.kaios.connect(context.outsider).approve(await redemption.getAddress(), 1_000n * ETHER)).wait();
  await (
    await redemption.connect(context.outsider).requestRedemption(
      id("ATTACK-REDIRECT"), lifeId, 1_000n * ETHER, deadline,
    )
  ).wait();
  assert.equal(await context.kgen.balanceOf(await context.outsider.getAddress()), attackerBefore);
  assert.equal(await eligibility.canonicalBeneficiary(lifeId), await context.life.getAddress());
});

test("reserve floor, caps, pause, deadline, eligibility and unauthorized governance fail closed", async () => {
  const context = await setupPhase2System();
  const redemption = context.phase2.redemption.contract;
  const eligibility = context.phase2.eligibility.contract;
  const lifeId = id("PHASE2-LIFE-RISK");
  await bindLife(context, lifeId);
  await settle(context, 3);
  await allocateKaios(context, context.life, 2_000n * ETHER, "RISK");
  await (await context.kgen.transfer(await redemption.getAddress(), 2n * ETHER)).wait();
  await (await context.kaios.connect(context.life).approve(await redemption.getAddress(), 2_000n * ETHER)).wait();
  const now = (await context.provider.getBlock("latest")).timestamp;

  await assert.rejects(
    redemption.connect(context.life).requestRedemption(id("EXPIRED"), lifeId, 1_000n * ETHER, now - 1),
  );
  await (await redemption.connect(context.pauser).pause()).wait();
  await assert.rejects(
    redemption.connect(context.life).requestRedemption(id("PAUSED"), lifeId, 1_000n * ETHER, now + 3_600),
  );
  await assert.rejects(redemption.connect(context.pauser).unpause());
  await (await redemption.unpause()).wait();

  await assert.rejects(
    redemption.connect(context.outsider).configureRisk(0, ETHER, ETHER, 1_000n * ETHER, 1_000n * ETHER),
  );
  await (
    await redemption.configureRisk(1n * ETHER, 1n * ETHER, 1n * ETHER, 1_000n * ETHER, 1_000n * ETHER)
  ).wait();
  await (
    await redemption.connect(context.life).requestRedemption(id("AT-FLOOR"), lifeId, 1_000n * ETHER, now + 3_600)
  ).wait();
  await assert.rejects(
    redemption.connect(context.life).requestRedemption(id("OVER-DAILY"), lifeId, 1_000n * ETHER, now + 3_600),
  );
  await (await eligibility.setReserveRedemptionEligibility(lifeId, false)).wait();
  await assert.rejects(
    redemption.connect(context.life).requestRedemption(id("INELIGIBLE"), lifeId, 1_000n * ETHER, now + 3_600),
  );
});

test("formal 18911 single proof crosses 5M threshold but never assigns a celestial seat", async () => {
  const context = await setupPhase2System();
  const eligibility = context.phase2.eligibility.contract;
  const seats = context.modules.CelestialSeat500_Upgradeable.contract;
  const lifeId = id("PHASE2-LIFE-ALCHEMY");
  await bindLife(context, lifeId);
  await settle(context, 16_001);
  await allocateKaios(context, context.life, 16_000_000n * ETHER, "ALCHEMY-AND-CAPITAL");

  const belowA = await burnForProof(context, context.life, 2_000_000n * ETHER, lifeId);
  const belowB = await burnForProof(context, context.life, 3_000_000n * ETHER - 1n, lifeId);
  await assert.rejects(eligibility.submitAlchemyMassProof(belowA, lifeId));
  await assert.rejects(eligibility.submitAlchemyMassProof(belowB, lifeId));
  assert.equal(await eligibility.candidateCount(), 0n);

  const wrongDestination = await burnForProof(context, context.life, 1n, lifeId, id("WRONG-DESTINATION"));
  await assert.rejects(eligibility.submitAlchemyMassProof(wrongDestination, lifeId));
  await assert.rejects(eligibility.submitAlchemyMassProof(id("PROOF-FROM-WRONG-FURNACE"), lifeId));

  const exactProof = await burnForProof(context, context.life, 5_000_000n * ETHER, lifeId);
  await assert.rejects(eligibility.submitAlchemyMassProof(exactProof, id("WRONG-LIFE")));
  const seatCountBefore = await seats.seatCount();
  await (await eligibility.submitAlchemyMassProof(exactProof, lifeId)).wait();
  assert.equal((await eligibility.candidate(exactProof)).status, 1n);
  await assert.rejects(async () => (
    await eligibility.submitAlchemyMassProof(exactProof, lifeId, { gasLimit: 1_000_000 })
  ).wait());
  await (await eligibility.beginCivilizationReview(exactProof, id("REVIEW-OPEN"))).wait();
  await assert.rejects(eligibility.markEligibleForReview(exactProof, id("MISSING-EVIDENCE")));

  await (await eligibility.recordConstitutionHistory(lifeId, id("CONSTITUTION-HISTORY"), true)).wait();
  await (
    await eligibility.recordContribution(
      id("CONTRIBUTION-1"),
      lifeId,
      id("CYBERSECURITY"),
      id("CONTRIBUTION-EVIDENCE"),
    )
  ).wait();
  await (await eligibility.markEligibleForReview(exactProof, id("QUALIFIED-REVIEW"))).wait();
  await (await eligibility.approveCandidate(exactProof, id("FORMAL-APPROVAL"))).wait();
  assert.equal((await eligibility.candidate(exactProof)).status, 4n);
  assert.equal(await seats.seatCount(), seatCountBefore);
  assert.equal(await context.kaios.totalKaiosBurnedForAlchemy(), 10_000_000n * ETHER);
});

test("5M capital is a non-burning liability, not bank equity or automatic seat ownership", async () => {
  const context = await setupPhase2System();
  const eligibility = context.phase2.eligibility.contract;
  const capital = context.phase2.capital.contract;
  const seats = context.modules.CelestialSeat500_Upgradeable.contract;
  const lifeId = id("PHASE2-LIFE-CAPITAL");
  await bindLife(context, lifeId);
  await settle(context, 6_000);
  await allocateKaios(context, context.life, 5_000_000n * ETHER, "CAPITAL");
  await (await eligibility.recordConstitutionHistory(lifeId, id("CAPITAL-CONSTITUTION"), true)).wait();
  await (
    await eligibility.recordContribution(
      id("CAPITAL-CONTRIBUTION"),
      lifeId,
      id("BANKING"),
      id("CAPITAL-CONTRIBUTION-EVIDENCE"),
    )
  ).wait();
  await (await context.kaios.connect(context.life).approve(await capital.getAddress(), 5_000_000n * ETHER)).wait();
  const supplyBefore = await context.kaios.totalSupply();
  const bankBefore = await context.bank.kaiosBalance();
  const seatCountBefore = await seats.seatCount();
  await assert.rejects(
    capital.connect(context.life).commitCapital(id("BELOW-5M"), lifeId, 5_000_000n * ETHER - 1n),
  );
  await (
    await capital.connect(context.life).commitCapital(id("EXACT-5M"), lifeId, 5_000_000n * ETHER)
  ).wait();
  assert.equal(await capital.totalCommittedPrincipal(), 5_000_000n * ETHER);
  assert.equal(await capital.kaiosBalance(), 5_000_000n * ETHER);
  assert.equal(await capital.liabilityInvariantHolds(), true);
  assert.equal(await context.kaios.totalSupply(), supplyBefore);
  assert.equal(await context.bank.kaiosBalance(), bankBefore);
  assert.equal((await capital.commitment(id("EXACT-5M"))).status, 1n);
  assert.equal(await seats.seatCount(), seatCountBefore);
  await assert.rejects(async () => (
    await capital.connect(context.life).commitCapital(
      id("EXACT-5M"), lifeId, 5_000_000n * ETHER, { gasLimit: 1_000_000 },
    )
  ).wait());

  await (
    await capital.submitForWormholeSeatReview(id("EXACT-5M"), id("WORMHOLE-REVIEW"))
  ).wait();
  assert.equal((await capital.commitment(id("EXACT-5M"))).status, 2n);
  await (await capital.approveCommitmentCandidate(id("EXACT-5M"), id("WORMHOLE-APPROVAL"))).wait();
  assert.equal((await capital.commitment(id("EXACT-5M"))).status, 3n);
  assert.equal(await seats.seatCount(), seatCountBefore);
  await assert.rejects(capital.connect(context.outsider).releaseCapital(id("EXACT-5M")));
  await advanceTime(context.provider, 30 * 86_400 + 1);
  await (
    await capital.connect(context.outsider).releaseCapital(id("EXACT-5M"), { gasLimit: 1_000_000 })
  ).wait();
  assert.equal(await context.kaios.balanceOf(await context.life.getAddress()), 5_000_000n * ETHER);
  assert.equal(await capital.totalCommittedPrincipal(), 0n);
  assert.equal(await capital.totalReleasedPrincipal(), 5_000_000n * ETHER);
  assert.equal(await context.kaios.totalSupply(), supplyBefore);
});

test("all Phase-2 implementations lock initialization and reject unauthorized upgrades", async () => {
  const context = await setupPhase2System();
  for (const deployment of Object.values(context.phase2)) {
    await assert.rejects(deployment.implementation.initialize(...deployment.initializeArgs));
    const replacementName = deployment.contract.interface.hasFunction("referenceKgenOut")
      ? "KGENReserveRedemption_Upgradeable"
      : deployment.contract.interface.hasFunction("candidate")
        ? "CelestialEligibility_Upgradeable"
        : "CelestialCapitalCommitment_Upgradeable";
    const replacement = await deploy(replacementName, context.deployer);
    await assert.rejects(
      deployment.contract.connect(context.outsider).upgradeToAndCall(await replacement.getAddress(), "0x"),
    );
  }
});

test("post-finalization upgrade and rollback require delayed distinct approval and preserve state", async () => {
  const context = await setupPhase2System();
  const governanceModule = context.modules.BankGovernance_Upgradeable.contract;
  const redemption = context.phase2.redemption;
  const governanceAddress = await governanceModule.getAddress();
  await (
    await governanceModule.grantRole(
      await governanceModule.APPROVER_ROLE(),
      await context.approver.getAddress(),
    )
  ).wait();
  await (await redemption.contract.finalizeModuleGovernance(governanceAddress)).wait();
  assert.equal(await redemption.contract.governanceFinalized(), true);

  const replacement = await deploy("KGENReserveRedemption_Upgradeable", context.deployer);
  await assert.rejects(
    redemption.contract.connect(context.moduleUpgrader).upgradeToAndCall(await replacement.getAddress(), "0x"),
  );
  const minimumReserveBefore = await redemption.contract.minimumKgenReserve();
  const eligibilityBefore = await redemption.contract.eligibility();
  const upgradeData = redemption.contract.interface.encodeFunctionData("upgradeToAndCall", [
    await replacement.getAddress(),
    "0x",
  ]);
  const upgradeId = id("PHASE2-RESERVE-GOVERNED-UPGRADE");
  await (
    await governanceModule.propose(upgradeId, await redemption.contract.getAddress(), 0, upgradeData)
  ).wait();
  await (await governanceModule.connect(context.approver).approve(upgradeId)).wait();
  await assert.rejects(governanceModule.execute(upgradeId, upgradeData));
  await advanceTime(context.provider, 3_601);
  await (
    await governanceModule.execute(upgradeId, upgradeData, { gasLimit: 1_500_000 })
  ).wait();
  assert.equal(await redemption.contract.minimumKgenReserve(), minimumReserveBefore);
  assert.equal(await redemption.contract.eligibility(), eligibilityBefore);

  const rollbackData = redemption.contract.interface.encodeFunctionData("upgradeToAndCall", [
    await redemption.implementation.getAddress(),
    "0x",
  ]);
  const rollbackId = id("PHASE2-RESERVE-GOVERNED-ROLLBACK");
  await (
    await governanceModule.propose(rollbackId, await redemption.contract.getAddress(), 0, rollbackData)
  ).wait();
  await (await governanceModule.connect(context.approver).approve(rollbackId)).wait();
  await advanceTime(context.provider, 3_601);
  await (
    await governanceModule.execute(rollbackId, rollbackData, { gasLimit: 1_500_000 })
  ).wait();
  assert.equal(await redemption.contract.minimumKgenReserve(), minimumReserveBefore);
  assert.equal(await redemption.contract.eligibility(), eligibilityBefore);
});

test("reserve rejects fee-on-receipt, failed payout and blocks token callback reentrancy", async () => {
  const context = await setupPhase2System();
  const governance = context.governance;
  const life = context.life;
  const lifeId = id("MALICIOUS-TOKEN-LIFE");
  const mockEligibility = await deploy("MockEligibilitySource", context.deployer);
  await (await mockEligibility.configure(lifeId, await life.getAddress(), true, true)).wait();

  async function deployMockReserve(kgenName, kaiosName) {
    const kgen = await deploy(kgenName, context.deployer, kgenName === "MockPhase2Token" ? ["KGEN", "KGEN"] : []);
    const kaios = await deploy(kaiosName, context.deployer, kaiosName === "MockPhase2Token" ? ["KAIOS", "KAIOS"] : []);
    const bank = await deploy("MockPhase2Bank", context.deployer, [await kgen.getAddress(), await kaios.getAddress()]);
    const deployed = await deployUpgradeable("KGENReserveRedemption_Upgradeable", context.deployer, [
      await bank.getAddress(),
      await governance.getAddress(),
      await context.moduleUpgrader.getAddress(),
      await context.pauser.getAddress(),
      await kgen.getAddress(),
      await kaios.getAddress(),
      await mockEligibility.getAddress(),
      0,
      10n * ETHER,
      10n * ETHER,
      10_000n * ETHER,
      10_000n * ETHER,
      true,
    ]);
    return { kgen, kaios, bank, reserve: deployed.contract.connect(governance) };
  }

  const fee = await deployMockReserve("MockPhase2Token", "MockFeeKAIOS");
  await (await fee.kgen.mint(await fee.reserve.getAddress(), 2n * ETHER)).wait();
  await (await fee.kaios.mint(await life.getAddress(), 1_000n * ETHER)).wait();
  await (await fee.kaios.connect(life).approve(await fee.reserve.getAddress(), 1_000n * ETHER)).wait();
  await assert.rejects(
    fee.reserve.connect(life).requestRedemption(id("FEE-RECEIPT"), lifeId, 1_000n * ETHER, 9_999_999_999),
  );

  const failing = await deployMockReserve("MockFailingKGEN", "MockPhase2Token");
  await (await failing.kgen.mint(await failing.reserve.getAddress(), 2n * ETHER)).wait();
  await (await failing.kaios.mint(await life.getAddress(), 1_000n * ETHER)).wait();
  await (await failing.kaios.connect(life).approve(await failing.reserve.getAddress(), 1_000n * ETHER)).wait();
  await assert.rejects(
    failing.reserve.connect(life).requestRedemption(id("FAILED-PAYOUT"), lifeId, 1_000n * ETHER, 9_999_999_999),
  );
  assert.equal(await failing.kaios.balanceOf(await life.getAddress()), 1_000n * ETHER);

  const reentrant = await deployMockReserve("MockPhase2Token", "MockReentrantKAIOS");
  await (await reentrant.kgen.mint(await reentrant.reserve.getAddress(), 2n * ETHER)).wait();
  await (await reentrant.kaios.mint(await life.getAddress(), 1_000n * ETHER)).wait();
  await (await reentrant.kaios.connect(life).approve(await reentrant.reserve.getAddress(), 1_000n * ETHER)).wait();
  const attackData = reentrant.reserve.interface.encodeFunctionData("requestRedemption", [
    id("REENTRANT-INNER"),
    lifeId,
    1_000n * ETHER,
    9_999_999_999,
  ]);
  await (await reentrant.kaios.armAttack(await reentrant.reserve.getAddress(), attackData)).wait();
  await (
    await reentrant.reserve.connect(life).requestRedemption(
      id("REENTRANT-OUTER"),
      lifeId,
      1_000n * ETHER,
      9_999_999_999,
    )
  ).wait();
  assert.equal(await reentrant.kaios.reentryBlocked(), true);
});
