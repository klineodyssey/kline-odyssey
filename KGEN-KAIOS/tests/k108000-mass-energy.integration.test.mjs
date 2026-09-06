import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ganache from "ganache";
import {
  BrowserProvider,
  ContractFactory,
  keccak256,
  parseEther,
  toUtf8Bytes,
} from "ethers";

const root = path.resolve(import.meta.dirname, "..");
const artifacts = path.join(root, "artifacts");
const YEAR = 31_556_926;

const OUTPUT_ID = keccak256(toUtf8Bytes("KAIOS.ORGAN.KUFO.OUTPUT.168888"));
const CONVERTER_ID = keccak256(toUtf8Bytes("KAIOS.ORGAN.KSHIP.CONVERTER"));
const REACTOR_ID = keccak256(toUtf8Bytes("KAIOS.ORGAN.K108000.MASS_ENERGY_REACTOR"));
const MATTER_ID = keccak256(toUtf8Bytes("KAIOS.ORGAN.K108000.POSITIVE_MATTER_SOURCE"));
const KGOD_ID = keccak256(toUtf8Bytes("KAIOS.ORGAN.KGOD.TOKEN"));
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
  const eip1193 = ganache.provider({ logging: { quiet: true }, wallet: { totalAccounts: 6 } });
  const provider = new BrowserProvider(eip1193);
  const owner = await provider.getSigner(0);
  const beneficiary = await provider.getSigner(1);
  const outsider = await provider.getSigner(2);

  const registry = await deploy("KUFOV4MockOrganRegistry", owner);
  const kufo = await deploy("KUFOV4", owner, [await registry.getAddress()]);
  const output = await deploy("KUFOV4MockOutput", owner);
  const kship = await deploy("KSHIPV5", owner, [await registry.getAddress(), await kufo.getAddress()]);
  const converter = await deploy("KSHIPConverter", owner, [await kufo.getAddress(), await kship.getAddress()]);
  const ships = await deploy("KAIOSShipIdentityRegistryV1", owner, [await owner.getAddress()]);
  const burnVerifier = await deploy("KGENWhiteHoleBurnVerifierMock", owner);
  const matter = await deploy("KGENWhiteHoleMatterSourceV1", owner, [await burnVerifier.getAddress(), await ships.getAddress()]);
  const reactor = await deploy("K108000MassEnergyReactorV1", owner, [await kship.getAddress(), await registry.getAddress(), await ships.getAddress()]);
  const kgod = await deploy("KGODV1", owner, [await registry.getAddress()]);

  await (await ships.registerShip(SHIP_ID, await owner.getAddress(), await owner.getAddress(), await reactor.getAddress())).wait();
  await (await registry.setOrgan(OUTPUT_ID, await output.getAddress())).wait();
  await (await registry.setOrgan(CONVERTER_ID, await converter.getAddress())).wait();
  await (await registry.setOrgan(REACTOR_ID, await reactor.getAddress())).wait();
  await (await registry.setOrgan(MATTER_ID, await matter.getAddress())).wait();
  await (await registry.setOrgan(KGOD_ID, await kgod.getAddress())).wait();

  return { eip1193, owner, beneficiary, outsider, registry, kufo, output, kship, converter, ships, burnVerifier, matter, reactor, kgod };
}

async function creditWhiteHoleMatter({ owner, burnVerifier, matter }, amount, suffix = "1") {
  const ownerAddress = await owner.getAddress();
  const burnId = keccak256(toUtf8Bytes(`white-hole-burn-${suffix}`));
  const tradeId = keccak256(toUtf8Bytes(`real-trade-${suffix}`));
  const pairId = keccak256(toUtf8Bytes("KGEN/WBNB"));
  await (await burnVerifier.setBurn({
    burnId,
    tradeId,
    pairId,
    trader: ownerAddress,
    burnedKgen: parseEther("0.1"),
    positiveMatterEquivalent: amount,
    valid: true,
    ammTrade: true,
    selfMatch: false,
    washTrade: false,
  })).wait();
  await (await matter.claimBurnForShip(burnId, SHIP_ID)).wait();
  return burnId;
}

test("KUFO -> KSHIP + verified White-Hole matter -> ship cogeneration conserves mass-energy and mints only allocated KGOD", async () => {
  const f = await fixture();
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

test("white-hole matter rejects self-match, wash-trade and duplicate burn credit", async () => {
  const { owner, burnVerifier, matter } = await fixture();
  const ownerAddress = await owner.getAddress();
  const pairId = keccak256(toUtf8Bytes("KGEN/WBNB"));

  for (const [label, selfMatch, washTrade] of [["self", true, false], ["wash", false, true]]) {
    const burnId = keccak256(toUtf8Bytes(`bad-${label}`));
    await (await burnVerifier.setBurn({
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
    await assert.rejects(matter.claimBurnForShip.staticCall(burnId, SHIP_ID));
  }

  const good = await creditWhiteHoleMatter({ owner, burnVerifier, matter }, 5000n, "dup");
  await assert.rejects(matter.claimBurnForShip.staticCall(good, SHIP_ID));
});

test("unregistered or non-controller account cannot operate authenticated ship reactor", async () => {
  const f = await fixture();
  const { outsider, beneficiary, reactor } = f;
  const allocation = { propulsionEnergy: 1n, recoverableEnergy: 1n, kgodMassEquivalent: 1n, radiationHeat: 1n };
  await assert.rejects(reactor.connect(outsider).react.staticCall(SHIP_ID, 2n, await beneficiary.getAddress(), 2, allocation));
});

test("reaction allocation cannot create more mass-energy than was consumed", async () => {
  const f = await fixture();
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
