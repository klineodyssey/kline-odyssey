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
