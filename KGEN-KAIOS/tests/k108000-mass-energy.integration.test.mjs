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

  const registry = await deploy("KUFOV4MockOrganRegistry", owner);
  const kufo = await deploy("KUFOV4", owner, [await registry.getAddress()]);
  const output = await deploy("KUFOV4MockOutput", owner);
  const kship = await deploy("KSHIPV5", owner, [await registry.getAddress(), await kufo.getAddress()]);
  const converter = await deploy("KSHIPConverter", owner, [await kufo.getAddress(), await kship.getAddress()]);
  const matter = await deploy("K108000PositiveMatterSourceMock", owner);
  const reactor = await deploy("K108000MassEnergyReactorV1", owner, [await kship.getAddress(), await registry.getAddress()]);
  const kgod = await deploy("KGODV1", owner, [await registry.getAddress()]);

  await (await registry.setOrgan(OUTPUT_ID, await output.getAddress())).wait();
  await (await registry.setOrgan(CONVERTER_ID, await converter.getAddress())).wait();
  await (await registry.setOrgan(REACTOR_ID, await reactor.getAddress())).wait();
  await (await registry.setOrgan(MATTER_ID, await matter.getAddress())).wait();
  await (await registry.setOrgan(KGOD_ID, await kgod.getAddress())).wait();

  return { eip1193, owner, beneficiary, registry, kufo, output, kship, converter, matter, reactor, kgod };
}

test("KUFO -> KSHIP -> K108000 cogeneration conserves mass-energy and mints only allocated KGOD", async () => {
  const { eip1193, owner, beneficiary, kufo, output, kship, converter, matter, reactor, kgod } = await fixture();
  const ownerAddress = await owner.getAddress();
  const beneficiaryAddress = await beneficiary.getAddress();

  const kufoProof = keccak256(toUtf8Bytes("k108000-kufo-proof"));
  await (await output.mint(await kufo.getAddress(), kufoProof, ownerAddress, parseEther("1"))).wait();
  await increaseTime(eip1193, YEAR);
  await (await converter.convert(parseEther("0.5"), ownerAddress, { gasLimit: 1_500_000n })).wait();

  assert.equal(await kship.balanceOf(ownerAddress), parseEther("500"));

  const fuel = parseEther("100");
  await (await matter.setMatter(ownerAddress, fuel)).wait();
  await (await kship.approve(await reactor.getAddress(), fuel)).wait();

  const allocation = {
    propulsionEnergy: parseEther("80"),
    recoverableEnergy: parseEther("20"),
    kgodMassEquivalent: parseEther("60"),
    radiationHeat: parseEther("40"),
  };

  const [predictedProof] = await reactor.react.staticCall(fuel, beneficiaryAddress, 2, allocation);
  await (await reactor.react(fuel, beneficiaryAddress, 2, allocation, { gasLimit: 2_500_000n })).wait();

  assert.equal(await kship.balanceOf(ownerAddress), parseEther("400"));
  assert.equal(await kship.totalConsumedForMassEnergy(), fuel);
  assert.equal(await kship.supplyConservationHolds(), true);
  assert.equal(await matter.matterBalance(ownerAddress), 0n);
  assert.equal(await kgod.balanceOf(beneficiaryAddress), parseEther("60"));
  assert.equal(await kgod.totalMintedFromReactions(), parseEther("60"));
  assert.equal(await reactor.conservationInvariantHolds(), true);

  const record = await reactor.reactionRecord(predictedProof);
  assert.equal(record.kshipAntimatterConsumed, fuel);
  assert.equal(record.positiveMatterConsumed, fuel);
  assert.equal(record.totalInputEquivalent, parseEther("200"));
  assert.equal(record.propulsionEnergy, parseEther("80"));
  assert.equal(record.recoverableEnergy, parseEther("20"));
  assert.equal(record.kgodMassEquivalent, parseEther("60"));
  assert.equal(record.radiationHeat, parseEther("40"));
  assert.equal(record.kgodMinted, true);
});

test("reaction allocation cannot create more mass-energy than was consumed", async () => {
  const { owner, beneficiary, matter, reactor, kship } = await fixture();
  const ownerAddress = await owner.getAddress();
  const beneficiaryAddress = await beneficiary.getAddress();
  const fuel = parseEther("1");

  await (await matter.setMatter(ownerAddress, fuel)).wait();
  await (await kship.approve(await reactor.getAddress(), fuel)).wait();

  const invalid = {
    propulsionEnergy: parseEther("1"),
    recoverableEnergy: parseEther("1"),
    kgodMassEquivalent: parseEther("1"),
    radiationHeat: 0n,
  };

  await assert.rejects(reactor.react.staticCall(fuel, beneficiaryAddress, 2, invalid));
});
