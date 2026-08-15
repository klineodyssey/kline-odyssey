import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import test, { after, before } from "node:test";
import { BrowserProvider, ContractFactory, getBytes, hexlify, keccak256 } from "ethers";
import ganache from "ganache";
import { artifact } from "./helpers.mjs";
import {
  patchUupsSelfAddress,
  verifyUupsRuntime,
} from "../tools/uups-runtime-verifier.mjs";

const root = path.resolve(import.meta.dirname, "..");

let eip1193;
let provider;
let implementationAddress;
let deployedRuntime;
const compiled = artifact("CelestialEligibility_Upgradeable");

before(async () => {
  eip1193 = ganache.provider({
    chain: { chainId: 31337, hardfork: "shanghai" },
    logging: { quiet: true },
    wallet: { deterministic: true, totalAccounts: 2 },
  });
  provider = new BrowserProvider(eip1193);
  provider.pollingInterval = 25;
  const signer = await provider.getSigner(0);
  const implementation = await new ContractFactory(compiled.abi, compiled.bytecode, signer).deploy();
  await implementation.waitForDeployment();
  implementationAddress = await implementation.getAddress();
  deployedRuntime = await provider.getCode(implementationAddress);
});

after(() => eip1193.disconnect());

test("UUPS runtime verifier patches __self immutables deterministically", () => {
  assert.notEqual(keccak256(compiled.deployedBytecode), keccak256(deployedRuntime));
  const first = patchUupsSelfAddress(
    compiled.deployedBytecode,
    compiled.immutableReferences,
    implementationAddress,
  );
  const second = patchUupsSelfAddress(
    compiled.deployedBytecode,
    compiled.immutableReferences,
    implementationAddress,
  );
  assert.equal(first, second);
  assert.equal(first, deployedRuntime);
  const result = verifyUupsRuntime({ artifact: compiled, deployedRuntime, implementationAddress });
  assert.equal(result.status, "PASS");
  assert.equal(result.patchedRuntimeMatch, true);
  assert.equal(result.normalizedRuntimeMatch, true);
  assert.deepEqual(result.immutableReferences.map(({ start, length }) => ({ start, length })), [
    { start: 5804, length: 32 },
    { start: 6993, length: 32 },
  ]);
});

test("UUPS runtime verifier rejects a wrong implementation-address patch", () => {
  const result = verifyUupsRuntime({
    artifact: compiled,
    deployedRuntime,
    implementationAddress: "0x000000000000000000000000000000000000dEaD",
  });
  assert.equal(result.status, "FAIL");
  assert.equal(result.patchedRuntimeMatch, false);
});

test("UUPS runtime verifier rejects modified non-immutable runtime bytes", () => {
  const modified = Uint8Array.from(getBytes(deployedRuntime));
  modified[0] ^= 1;
  const result = verifyUupsRuntime({
    artifact: compiled,
    deployedRuntime: hexlify(modified),
    implementationAddress,
  });
  assert.equal(result.status, "FAIL");
  assert.equal(result.normalizedRuntimeMatch, false);
});

test("UUPS runtime verifier rejects non-UUPS runtime", () => {
  const nonUups = artifact("MockOrgan");
  const result = verifyUupsRuntime({
    artifact: compiled,
    deployedRuntime: nonUups.deployedBytecode,
    implementationAddress,
  });
  assert.equal(result.status, "FAIL");
  assert.equal(result.reason, "RUNTIME_LENGTH_MISMATCH");
});

test("Phase 2 resume planner reuses Eligibility implementation and predicts only five CREATEs", () => {
  const plan = JSON.parse(execFileSync(
    process.execPath,
    ["scripts/prepare-kaios-civilization-phase2-deployment.mjs"],
    {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        PHASE2_DEPLOYMENT_SIGNER_ADDRESS: "0xb3C54ca96De0dED4Ca0151F629ff9781506ba261",
        PHASE2_DEPLOYMENT_SIGNER_NONCE: "57",
        PHASE2_EXISTING_ELIGIBILITY_IMPLEMENTATION_ADDRESS: "0x0D21328BdbE12e9E69838Fd33E3C20F0b27f2779",
      },
    },
  ));
  assert.equal(plan.status, "UNSIGNED_PHASE2_RESUME_DEPLOYMENT_PLAN_NO_TRANSACTION");
  assert.equal(plan.existingDeploymentReused.redeploy, false);
  assert.equal(plan.deployments.length, 5);
  assert.deepEqual(plan.deployments.map(({ nonce, expectedAddress }) => [nonce, expectedAddress]), [
    ["57", "0xA50743fd0fe022714831482355A27559027368F9"],
    ["58", "0x8D4a697549Ee45e9973041d0f1c0d0394B1A1034"],
    ["59", "0xA06eF53c9AD4Af739FD13Ca1Ded446437134b0EE"],
    ["60", "0x09b4371B071d8957622DD640dbd0F713897Db167"],
    ["61", "0x04fC1536EC51E8CCaAcB961E5Af6151De47b078c"],
  ]);
});
