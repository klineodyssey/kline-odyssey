import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ganache from "ganache";
import {
  BrowserProvider,
  ContractFactory,
  getBytes,
  keccak256,
  parseEther,
  toUtf8Bytes,
  Wallet,
} from "ethers";

const root = path.resolve(import.meta.dirname, "..");
const artifacts = path.join(root, "artifacts");
const YEAR = 31_556_926;

const OUTPUT_ID = keccak256(toUtf8Bytes("KAIOS.ORGAN.KUFO.OUTPUT.168888"));
const CONVERTER_ID = keccak256(toUtf8Bytes("KAIOS.ORGAN.KSHIP.CONVERTER"));
const REACTOR_ID = keccak256(toUtf8Bytes("KAIOS.ORGAN.K108000.MASS_ENERGY_REACTOR"));
const MATTER_ID = keccak256(toUtf8Bytes("KAIOS.ORGAN.K108000.POSITIVE_MATTER_SOURCE"));
const KGOD_ID = keccak256(toUtf8Bytes("KAIOS.ORGAN.KGOD.TOKEN"));
const BURN_VERIFIER_ID = keccak256(toUtf8Bytes("KAIOS.ORGAN.KGEN.WHITE_HOLE.BURN_VERIFIER"));
const SHIP_ID = keccak256(toUtf8Bytes("KAIOS.SHIP.KUFO.TEST.001"));

function artifact(name) {
  return JSON.parse(fs.readFileSync(path.join(artifacts, `${name}.json`), "utf8"));
}

async function deploy(name, signer, args = []) {
  const a = artifact(name);
  const factory = new ContractFactory(a.abi, a.bytecode, signer);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  return contract;
}

async function increaseTime(eip1193, seconds) {
  await eip1193.request({ method: "evm_increaseTime", params: [seconds] });
  await eip1193.request({ method: "evm_mine", params: [] });
}

async function fixture() {
  const eip1193 = ganache.provider({ logging: { quiet: true }, wallet: { totalAccounts: 7 } });
  const provider = new BrowserProvider(eip1193);
  const owner = await provider.getSigner(0);
  const beneficiary = await provider.getSigner(1);
  const outsider = await provider.getSigner(2);
  const attestorA = Wallet.createRandom();
  const attestorB = Wallet.createRandom();
  const pair = await provider.getSigner(5);
  const trader = await provider.getSigner(6);

  const registry = await deploy("KUFOV4MockOrganRegistry", owner);
  const kufo = await deploy("KUFOV4", owner, [await registry.getAddress()]);
  const output = await deploy("KUFOV4MockOutput", owner);
  const kship = await deploy("KSHIPV5", owner, [await registry.getAddress(), await kufo.getAddress()]);
  const converter = await deploy("KSHIPConverter", owner, [await kufo.getAddress(), await kship.getAddress()]);
  const ships = await deploy("KAIOSShipIdentityRegistryV1", owner, [await owner.getAddress()]);
  const pairAddress = await pair.getAddress();
  const kgen = await deploy("KGEN_Token_V7_5_2", owner, [
    await owner.getAddress(),
    await beneficiary.getAddress(),
    await outsider.getAddress(),
    await owner.getAddress(),
  ]);
  await (await kgen.setMarketMakerPair(pairAddress, true)).wait();
  const replayRegistry = await deploy("KGENWhiteHoleBurnReplayRegistryV1", owner, [await registry.getAddress()]);
  const burnVerifier = await deploy("KGENWhiteHoleBurnVerifierV1", owner, [
    await kgen.getAddress(),
    await replayRegistry.getAddress(),
    await attestorA.getAddress(),
    await attestorB.getAddress(),
    1,
    1,
  ]);
  const matter = await deploy("KGENWhiteHoleMatterSourceV1", owner, [await burnVerifier.getAddress(), await ships.getAddress()]);
  const reactor = await deploy("K108000MassEnergyReactorV1", owner, [await kship.getAddress(), await registry.getAddress(), await ships.getAddress()]);
  const kgod = await deploy("KGODV1", owner, [await reactor.getAddress()]);

  await (await ships.registerShip(SHIP_ID, await owner.getAddress(), await trader.getAddress(), await reactor.getAddress())).wait();
  await (await registry.setOrgan(OUTPUT_ID, await output.getAddress())).wait();
  await (await registry.setOrgan(CONVERTER_ID, await converter.getAddress())).wait();
  await (await registry.setOrgan(REACTOR_ID, await reactor.getAddress())).wait();
  await (await registry.setOrgan(MATTER_ID, await matter.getAddress())).wait();
  await (await registry.setOrgan(KGOD_ID, await kgod.getAddress())).wait();
  await (await registry.setOrgan(BURN_VERIFIER_ID, await burnVerifier.getAddress())).wait();

  return {
    eip1193, owner, beneficiary, outsider, attestorA, attestorB, pairAddress, trader,
    registry, kufo, output, kship, converter, ships, kgen, replayRegistry, burnVerifier, matter, reactor, kgod,
  };
}

async function buildBurnEvidence(f, amount, suffix = "1") {
  const traderAddress = await f.trader.getAddress();
  const grossTradeKgen = amount * 1_000n;
  await (await f.kgen.transfer(traderAddress, grossTradeKgen, { gasLimit: 250_000n })).wait();
  const supplyBefore = await f.kgen.totalSupply();
  const burnTx = await f.kgen.connect(f.trader).transfer(f.pairAddress, grossTradeKgen, { gasLimit: 250_000n });
  const receipt = await burnTx.wait();
  assert.equal(supplyBefore - await f.kgen.totalSupply(), amount);
  const block = await f.owner.provider.getBlock(receipt.blockNumber);
  const evidence = {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    blockHash: block.hash,
    logIndex: Number(BigInt(keccak256(toUtf8Bytes(`white-hole-log-${suffix}`))) % 1_000_000n),
    pair: f.pairAddress,
    trader: traderAddress,
    burnSource: traderAddress,
    grossTradeKgen,
  };
  await f.eip1193.request({ method: "evm_mine", params: [] });
  const digest = await f.burnVerifier.evidenceDigest(evidence);
  return {
    evidence,
    signatureA: await f.attestorA.signMessage(getBytes(digest)),
    signatureB: await f.attestorB.signMessage(getBytes(digest)),
  };
}

async function creditWhiteHoleMatter(f, amount, suffix = "1") {
  const proof = await buildBurnEvidence(f, amount, suffix);
  const [burnId, burnedKgen, creditedMatter] = await f.burnVerifier.submitVerifiedBurn.staticCall(
    proof.evidence,
    proof.signatureA,
    proof.signatureB,
  );
  assert.equal(burnedKgen, amount);
  assert.equal(creditedMatter, amount);
  await (await f.burnVerifier.submitVerifiedBurn(proof.evidence, proof.signatureA, proof.signatureB)).wait();
  await (await f.matter.claimBurnForShip(burnId, SHIP_ID)).wait();
  return burnId;
}

let sharedFixture;
let snapshotId;

test.before(async () => {
  sharedFixture = await fixture();
});

test.beforeEach(async () => {
  snapshotId = await sharedFixture.eip1193.request({ method: "evm_snapshot", params: [] });
});

test.afterEach(async () => {
  assert.equal(
    await sharedFixture.eip1193.request({ method: "evm_revert", params: [snapshotId] }),
    true,
  );
});

test("KUFO -> KSHIP + verified White-Hole matter -> ship cogeneration conserves mass-energy and mints only allocated KGOD", async () => {
  const f = sharedFixture;
  const { eip1193, owner, beneficiary, kufo, output, kship, converter, matter, reactor, kgod } = f;
  const ownerAddress = await owner.getAddress();
  const beneficiaryAddress = await beneficiary.getAddress();

  const kufoProof = keccak256(toUtf8Bytes("k108000-kufo-proof"));
  await (await output.mint(await kufo.getAddress(), kufoProof, ownerAddress, parseEther("1"))).wait();
  await increaseTime(eip1193, YEAR);
  await (await converter.convert(parseEther("0.5"), ownerAddress, { gasLimit: 1_500_000n })).wait();
  assert.equal(await kship.balanceOf(ownerAddress), parseEther("500"));

  const fuel = parseEther("100");
  await creditWhiteHoleMatter(f, fuel);
  assert.equal(await matter.shipMatterBalance(SHIP_ID), fuel);
  await (await kship.approve(await reactor.getAddress(), fuel)).wait();

  const allocation = {
    propulsionEnergy: parseEther("80"),
    recoverableEnergy: parseEther("20"),
    kgodMassEquivalent: parseEther("60"),
    radiationHeat: parseEther("40"),
  };

  const [predictedProof] = await reactor.react.staticCall(SHIP_ID, fuel, beneficiaryAddress, 2, allocation);
  await (await reactor.react(SHIP_ID, fuel, beneficiaryAddress, 2, allocation, { gasLimit: 3_000_000n })).wait();

  assert.equal(await kship.balanceOf(ownerAddress), parseEther("400"));
  assert.equal(await kship.totalConsumedForMassEnergy(), fuel);
  assert.equal(await kship.supplyConservationHolds(), true);
  assert.equal(await matter.shipMatterBalance(SHIP_ID), 0n);
  assert.equal(await matter.shipMatterConsumed(SHIP_ID), fuel);
  assert.equal(await kgod.balanceOf(beneficiaryAddress), parseEther("60"));
  assert.equal(await reactor.conservationInvariantHolds(), true);

  const record = await reactor.reactionRecord(predictedProof);
  assert.equal(record.shipId, SHIP_ID);
  assert.equal(record.kshipAntimatterConsumed, fuel);
  assert.equal(record.positiveMatterConsumed, fuel);
  assert.equal(record.totalInputEquivalent, parseEther("200"));
  assert.equal(record.propulsionEnergy, parseEther("80"));
  assert.equal(record.recoverableEnergy, parseEther("20"));
  assert.equal(record.kgodMassEquivalent, parseEther("60"));
  assert.equal(record.radiationHeat, parseEther("40"));
  assert.equal(record.kgodMinted, true);
});

test("immutable dual-attestor verifier binds recent KGEN AMM burn evidence and blocks replay", async () => {
  const f = sharedFixture;
  const amount = 5_000n;
  const proof = await buildBurnEvidence(f, amount, "attested");

  await assert.rejects(
    f.burnVerifier.submitVerifiedBurn.staticCall(proof.evidence, proof.signatureA, proof.signatureA),
  );
  const [burnId, burnedKgen, matterEquivalent] = await f.burnVerifier.submitVerifiedBurn.staticCall(
    proof.evidence,
    proof.signatureA,
    proof.signatureB,
  );
  assert.equal(burnedKgen, amount);
  assert.equal(matterEquivalent, amount);
  await (await f.burnVerifier.submitVerifiedBurn(proof.evidence, proof.signatureA, proof.signatureB)).wait();
  assert.equal(await f.burnVerifier.transactionLogConsumed(burnId), true);
  await assert.rejects(
    f.burnVerifier.submitVerifiedBurn.staticCall(proof.evidence, proof.signatureA, proof.signatureB),
  );
});

test("White-Hole verifier rejects a tax-exempt trader or pair even with both attestations", async () => {
  const f = sharedFixture;
  const amount = 5_000n;
  const grossTradeKgen = amount * 1_000n;
  const traderAddress = await f.trader.getAddress();
  await (await f.kgen.setTaxExempt(f.pairAddress, true)).wait();
  await (await f.kgen.transfer(traderAddress, grossTradeKgen, { gasLimit: 250_000n })).wait();
  const supplyBefore = await f.kgen.totalSupply();
  const transfer = await f.kgen.connect(f.trader).transfer(f.pairAddress, grossTradeKgen, { gasLimit: 250_000n });
  const receipt = await transfer.wait();
  assert.equal(await f.kgen.totalSupply(), supplyBefore, "the exempt transfer must not burn KGEN");
  const block = await f.owner.provider.getBlock(receipt.blockNumber);
  const evidence = {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    blockHash: block.hash,
    logIndex: 987_654,
    pair: f.pairAddress,
    trader: traderAddress,
    burnSource: traderAddress,
    grossTradeKgen,
  };
  await f.eip1193.request({ method: "evm_mine", params: [] });
  const digest = await f.burnVerifier.evidenceDigest(evidence);
  await assert.rejects(f.burnVerifier.submitVerifiedBurn.staticCall(
    evidence,
    await f.attestorA.signMessage(getBytes(digest)),
    await f.attestorB.signMessage(getBytes(digest)),
  ));
});

test("shared replay registry rejects one KGEN burn across verifier versions", async () => {
  const f = sharedFixture;
  const proofV1 = await buildBurnEvidence(f, 5_000n, "cross-version");
  const acceptedV1 = await f.burnVerifier.submitVerifiedBurn.staticCall(
    proofV1.evidence,
    proofV1.signatureA,
    proofV1.signatureB,
  );
  await (await f.burnVerifier.submitVerifiedBurn(proofV1.evidence, proofV1.signatureA, proofV1.signatureB)).wait();

  const verifierV2 = await deploy("KGENWhiteHoleBurnVerifierV1", f.owner, [
    await f.kgen.getAddress(),
    await f.replayRegistry.getAddress(),
    await f.attestorA.getAddress(),
    await f.attestorB.getAddress(),
    1,
    1,
  ]);
  await (await f.registry.setOrgan(BURN_VERIFIER_ID, await verifierV2.getAddress())).wait();
  const digestV2 = await verifierV2.evidenceDigest(proofV1.evidence);
  const signatureA2 = await f.attestorA.signMessage(getBytes(digestV2));
  const signatureB2 = await f.attestorB.signMessage(getBytes(digestV2));
  assert.equal(await verifierV2.burnIdFor(proofV1.evidence), acceptedV1[0]);
  await assert.rejects(verifierV2.submitVerifiedBurn.staticCall(proofV1.evidence, signatureA2, signatureB2));
});

test("KGOD immutable reactor binding rejects a registry-selected forged reaction source", async () => {
  const f = sharedFixture;
  const spoof = await deploy("K108000ReactionSpoofMock", f.owner);
  await (await f.registry.setOrgan(REACTOR_ID, await spoof.getAddress())).wait();
  await assert.rejects(spoof.mintWithoutFuel.staticCall(
    await f.kgod.getAddress(),
    keccak256(toUtf8Bytes("TEST.NO.KSHIP.NO.MATTER")),
    await f.beneficiary.getAddress(),
    parseEther("100"),
  ));
  assert.equal(await f.kgod.totalSupply(), 0n);
});

test("white-hole matter rejects self-match, wash-trade and duplicate burn credit", async () => {
  const f = sharedFixture;
  const { owner, ships } = f;
  const ownerAddress = await owner.getAddress();
  const pairId = keccak256(toUtf8Bytes("KGEN/WBNB"));
  const mockVerifier = await deploy("KGENWhiteHoleBurnVerifierMock", owner);
  const mockMatter = await deploy("KGENWhiteHoleMatterSourceV1", owner, [
    await mockVerifier.getAddress(),
    await ships.getAddress(),
  ]);

  for (const [label, selfMatch, washTrade] of [["self", true, false], ["wash", false, true]]) {
    const burnId = keccak256(toUtf8Bytes(`bad-${label}`));
    await (await mockVerifier.setBurn({
      burnId,
      tradeId: keccak256(toUtf8Bytes(`trade-${label}`)),
      pairId,
      trader: ownerAddress,
      burnedKgen: 1000n,
      positiveMatterEquivalent: 1000n,
      valid: true,
      ammTrade: true,
      selfMatch,
      washTrade,
    })).wait();
    await assert.rejects(mockMatter.claimBurnForShip.staticCall(burnId, SHIP_ID));
  }

  const good = await creditWhiteHoleMatter(f, 5000n, "dup");
  await assert.rejects(f.matter.claimBurnForShip.staticCall(good, SHIP_ID));
});

test("unregistered or non-controller account cannot operate authenticated ship reactor", async () => {
  const f = sharedFixture;
  const { outsider, beneficiary, reactor } = f;
  const allocation = { propulsionEnergy: 1n, recoverableEnergy: 1n, kgodMassEquivalent: 1n, radiationHeat: 1n };
  await assert.rejects(reactor.connect(outsider).react.staticCall(SHIP_ID, 2n, await beneficiary.getAddress(), 2, allocation));
});

test("reaction allocation cannot create more mass-energy than was consumed", async () => {
  const f = sharedFixture;
  const { owner, beneficiary, reactor, kship } = f;
  const fuel = parseEther("1");
  await creditWhiteHoleMatter(f, fuel, "allocation");
  await (await kship.approve(await reactor.getAddress(), fuel)).wait();

  const invalid = {
    propulsionEnergy: parseEther("1"),
    recoverableEnergy: parseEther("1"),
    kgodMassEquivalent: parseEther("1"),
    radiationHeat: 0n,
  };
  await assert.rejects(reactor.react.staticCall(SHIP_ID, fuel, await beneficiary.getAddress(), 2, invalid));
});
