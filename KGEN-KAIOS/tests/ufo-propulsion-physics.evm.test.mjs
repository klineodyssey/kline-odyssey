import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ganache from "ganache";
import { BrowserProvider, ContractFactory, keccak256, toUtf8Bytes } from "ethers";

const root = path.resolve(import.meta.dirname, "..");
const artifacts = path.join(root, "artifacts");
const WAD = 10n ** 18n;
const C = 299_792_458n;

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

async function fixture() {
  const eip1193 = ganache.provider({ logging: { quiet: true } });
  const provider = new BrowserProvider(eip1193);
  const signer = await provider.getSigner(0);
  return deploy("KAIOSUFOPropulsionPhysicsV1", signer);
}

function within(actual, expected, tolerance) {
  return actual >= expected - tolerance && actual <= expected + tolerance;
}

test("1 mg/s matter + 1 mg/s KSHIP yields the expected mass-energy scale", async () => {
  const physics = await fixture();
  const duration = 60n;
  const shipMassKgWad = 1_000n * WAD;
  const oneMgPerSecWad = WAD;
  const exhaust = 29_979_245n; // ~0.1c, integer m/s

  const input = {
    shipId: keccak256(toUtf8Bytes("KAIOS-UFO-REFERENCE-001")),
    shipMassKgWad,
    kshipMgPerSecWad: oneMgPerSecWad,
    positiveMatterMgPerSecWad: oneMgPerSecWad,
    durationSec: duration,
    engine: {
      reactionEfficiencyBps: 10_000,
      propulsionFractionBps: 3_000,
      recoverableFractionBps: 1_000,
      kgodFractionBps: 2_000,
      radiationHeatFractionBps: 4_000,
      exhaustVelocityMPerSec: exhaust,
    },
  };

  const o = await physics.simulate(input);

  assert.equal(o.kshipConsumedMgWad, 60n * WAD);
  assert.equal(o.positiveMatterConsumedMgWad, 60n * WAD);
  assert.equal(o.reactedMassKgWad, 120_000_000_000_000n); // 0.00012 kg WAD

  const expectedEnergyWad = o.reactedMassKgWad * C * C;
  assert.equal(o.reactionEnergyJouleWad, expectedEnergyWad);
  assert.equal(o.averageReactionPowerWattWad, expectedEnergyWad / duration);

  // ~179.751 GW total reaction power.
  const expectedPowerWad = 179_751_035_747n * WAD;
  assert.ok(within(o.averageReactionPowerWattWad, expectedPowerWad, 2_000_000n * WAD));

  // 30% propulsion at ~0.1c gives ~3.6 kN in the V1 non-relativistic directed-exhaust approximation.
  const expectedThrustWad = 3_598n * WAD;
  assert.ok(within(o.thrustNewtonWad, expectedThrustWad, 10n * WAD));

  // 1000 kg craft -> ~3.6 m/s^2, ~216 m/s delta-v and ~6.48 km in 60 s from rest.
  assert.ok(within(o.accelerationMps2Wad, 3_598_000_000_000_000_000n, 20_000_000_000_000_000n));
  assert.ok(within(o.deltaVMpsWad, 215_880n * 10n ** 15n, 2n * WAD));
  assert.ok(within(o.distanceMeterWad, 6_476n * WAD, 100n * WAD));

  // Energy allocation is exhaustive after reaction efficiency.
  assert.equal(
    o.propulsionEnergyJouleWad + o.recoverableEnergyJouleWad + o.radiationHeatEnergyJouleWad + o.kgodMassEquivalentKgWad * C * C,
    o.reactionEnergyJouleWad,
  );
});

test("matter/antimatter flow must be exactly balanced", async () => {
  const physics = await fixture();
  const input = {
    shipId: keccak256(toUtf8Bytes("KAIOS-UFO-MISMATCH")),
    shipMassKgWad: 1_000n * WAD,
    kshipMgPerSecWad: WAD,
    positiveMatterMgPerSecWad: 2n * WAD,
    durationSec: 1,
    engine: {
      reactionEfficiencyBps: 10_000,
      propulsionFractionBps: 10_000,
      recoverableFractionBps: 0,
      kgodFractionBps: 0,
      radiationHeatFractionBps: 0,
      exhaustVelocityMPerSec: 1_000_000,
    },
  };
  await assert.rejects(physics.simulate(input));
});

test("engine fractions must sum to 100% and exhaust must remain subluminal", async () => {
  const physics = await fixture();
  const base = {
    shipId: keccak256(toUtf8Bytes("KAIOS-UFO-GATES")),
    shipMassKgWad: 1_000n * WAD,
    kshipMgPerSecWad: WAD,
    positiveMatterMgPerSecWad: WAD,
    durationSec: 1,
  };

  await assert.rejects(physics.simulate({
    ...base,
    engine: {
      reactionEfficiencyBps: 10_000,
      propulsionFractionBps: 9_000,
      recoverableFractionBps: 0,
      kgodFractionBps: 0,
      radiationHeatFractionBps: 0,
      exhaustVelocityMPerSec: 1_000_000,
    },
  }));

  await assert.rejects(physics.simulate({
    ...base,
    engine: {
      reactionEfficiencyBps: 10_000,
      propulsionFractionBps: 10_000,
      recoverableFractionBps: 0,
      kgodFractionBps: 0,
      radiationHeatFractionBps: 0,
      exhaustVelocityMPerSec: Number(C),
    },
  }));
});

test("UFO organ and life runtimes use the Product_06 ship ABI and require exact ship-bound organs", async () => {
  const eip1193 = ganache.provider({ logging: { quiet: true } });
  const provider = new BrowserProvider(eip1193);
  const registrar = await provider.getSigner(0);
  const controller = await provider.getSigner(1);
  const tradingEngine = await provider.getSigner(2);
  const wrongEndpoint = await provider.getSigner(3);

  const organRegistry = await deploy("KUFOV4MockOrganRegistry", registrar);
  const shipRegistry = await deploy("KAIOSShipIdentityRegistryV1", registrar, [await registrar.getAddress()]);
  const reactor = await deploy("MockOrgan", registrar);
  const matterSource = await deploy("MockOrgan", registrar);
  const kship = await deploy("MockOrgan", registrar);
  const navigation = await deploy("MockOrgan", registrar);
  const kgod = await deploy("MockOrgan", registrar);
  const shipId = keccak256(toUtf8Bytes("KAIOS-UFO-ABI-INTEGRATION-001"));

  await (await shipRegistry.registerShip(
    shipId,
    await controller.getAddress(),
    await tradingEngine.getAddress(),
    await reactor.getAddress(),
  )).wait();

  const organs = await deploy("KAIOSUFOOrganRuntimeV1", registrar, [
    await organRegistry.getAddress(),
    await shipRegistry.getAddress(),
    shipId,
  ]);

  assert.equal(await organs.controller(), await controller.getAddress());
  assert.equal(await organs.readyForFlight(), false);

  const ids = {
    trading: keccak256(toUtf8Bytes("KAIOS.ORGAN.UFO.TRADING_ENGINE")),
    matter: keccak256(toUtf8Bytes("KAIOS.ORGAN.K108000.POSITIVE_MATTER_SOURCE")),
    reactor: keccak256(toUtf8Bytes("KAIOS.ORGAN.K108000.MASS_ENERGY_REACTOR")),
    kship: keccak256(toUtf8Bytes("KAIOS.ORGAN.KSHIP.TOKEN")),
    kgod: keccak256(toUtf8Bytes("KAIOS.ORGAN.KGOD.TOKEN")),
    navigation: keccak256(toUtf8Bytes("KAIOS.ORGAN.UFO.NAVIGATION")),
  };

  await (await organRegistry.setOrgan(ids.trading, await wrongEndpoint.getAddress())).wait();
  await (await organRegistry.setOrgan(ids.matter, await matterSource.getAddress())).wait();
  await (await organRegistry.setOrgan(ids.reactor, await wrongEndpoint.getAddress())).wait();
  await (await organRegistry.setOrgan(ids.kship, await kship.getAddress())).wait();
  await (await organRegistry.setOrgan(ids.kgod, await kgod.getAddress())).wait();
  await (await organRegistry.setOrgan(ids.navigation, await navigation.getAddress())).wait();

  assert.equal(await organs.criticalOrgansBound(), false);
  assert.equal(await organs.readyForFlight(), false);

  await (await organRegistry.setOrgan(ids.trading, await tradingEngine.getAddress())).wait();
  await (await organRegistry.setOrgan(ids.reactor, await reactor.getAddress())).wait();

  assert.equal(await organs.criticalOrgansBound(), true);
  assert.equal(await organs.readyForFlight(), true);
  assert.equal(await organs.readyForCogeneration(), true);

  const life = await deploy("KAIOSUFOLifeV1", registrar, [await organs.getAddress(), `0x${"00".repeat(32)}`]);
  await assert.rejects(life.activate());
  await (await life.connect(controller).activate()).wait();
  await (await life.connect(controller).enterFlight()).wait();
  assert.equal(await life.state(), 2n);

  await (await shipRegistry.setShipActive(shipId, false)).wait();
  assert.equal(await organs.readyForFlight(), false);
});
