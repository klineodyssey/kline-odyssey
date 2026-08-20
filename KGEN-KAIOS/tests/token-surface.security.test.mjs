import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { artifact } from "./helpers.mjs";

const root = path.resolve(import.meta.dirname, "..");

function functionNames(contractName) {
  return new Set(
    artifact(contractName).abi
      .filter((entry) => entry.type === "function")
      .map((entry) => entry.name),
  );
}

function functionEntry(contractName, name) {
  return artifact(contractName).abi.find((entry) => entry.type === "function" && entry.name === name);
}

test("successor alchemy uses the deployed five-argument KAIOS burn ABI", () => {
  const entry = functionEntry("KAIOS", "burnForAlchemy");
  assert.deepEqual(entry.inputs.map(({ type }) => type), [
    "address",
    "address",
    "uint256",
    "bytes32",
    "bytes32",
  ]);
  const furnaceSource = fs
    .readFileSync(path.join(root, "contracts", "KAIOSAlchemyFurnace.sol"), "utf8")
    .replaceAll("\r\n", "\n");
  assert.equal(furnaceSource.includes("address catalystOwner,\n        address beneficiary"), false);
  assert.equal(furnaceSource.includes("function burnForAlchemy(\n        address owner,\n        address beneficiary"), true);
});

test("Program Life manifest keeps deployed KAIOS identity external and all Life IDs unique", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "program-life-manifest.json"), "utf8"));
  const ids = manifest.programLives.map(({ lifeId }) => lifeId);
  assert.equal(new Set(ids).size, ids.length);
  const kaios = manifest.programLives.find(({ source }) => source === "contracts/KAIOS.sol");
  assert.equal(kaios.lifeId, "LIFE-KAIOS-JIEHENG-33333");
  assert.equal(kaios.identityStorage, "EXTERNAL_MANIFEST_DUE_DEPLOYED_ABI_IMMUTABILITY");
  assert.equal(kaios.contractAddress, "0xD4E67B3a69e41524c424150E6b6e921b01D036db");
  const testLife = manifest.programLives.find(({ lifeId }) => lifeId === "LIFE-KAIOS-SHIHANG-TONGZI-TEST-0001");
  assert.equal(testLife.deployable, false);
  assert.equal(testLife.employable, false);
});

test("token ABIs expose no arbitrary mint, blacklist, seizure, tax, or AMM-pair controls", () => {
  const forbidden = [
    "mint",
    "adminMint",
    "setMinter",
    "blacklist",
    "seize",
    "setTax",
    "setTaxExempt",
    "setMarketMakerPair",
    "setPair",
  ];
  for (const contractName of ["KAIOS", "KUFO", "KSHIP"]) {
    const names = functionNames(contractName);
    for (const name of forbidden) assert.equal(names.has(name), false, `${contractName}.${name}`);
  }
});

test("lineage contracts expose no arbitrary catalyst withdrawal, rescue, or payable surface", () => {
  const forbidden = ["withdraw", "withdrawToken", "rescue", "rescueToken", "sweep", "adminBurn", "burnFrom"];
  for (const contractName of [
    "KAIOSAlchemyFurnace",
    "KUFOClaimWormhole",
    "KUFO",
    "KSHIPConverter",
    "KSHIP",
  ]) {
    const compiled = artifact(contractName);
    const names = functionNames(contractName);
    for (const name of forbidden) assert.equal(names.has(name), false, `${contractName}.${name}`);
    assert.equal(
      compiled.abi.some((entry) => entry.stateMutability === "payable"),
      false,
      `${contractName} payable ABI`,
    );
    assert.equal(compiled.abi.some((entry) => entry.type === "receive"), false, `${contractName} receive`);
    assert.equal(compiled.abi.some((entry) => entry.type === "fallback"), false, `${contractName} fallback`);
  }
});

test("KUFO half-life and KSHIP propulsion are constructor/registry gated", () => {
  const kufo = functionNames("KUFO");
  const kship = functionNames("KSHIP");
  assert.equal(kufo.has("halfLifeSeconds"), true);
  assert.equal(kufo.has("burnMaturedDecayForCarrier"), true);
  assert.equal(kship.has("authorizePropulsion"), true);
  assert.equal(kship.has("consumePropulsion"), true);
  assert.equal(kship.has("totalBurnedForPropulsion"), true);
});

test("fresh alchemy exposes only atomic release and no delayed catalyst-return surface", () => {
  const furnace = functionNames("KAIOSAlchemyFurnace");
  const wormhole = functionNames("KUFOClaimWormhole");
  const kufo = functionNames("KUFO");
  assert.equal(furnace.has("consumeImmediateProof"), true);
  assert.equal(furnace.has("consumeMaturedProof"), false);
  assert.equal(furnace.has("currentEpoch"), false);
  assert.equal(furnace.has("catalystBank"), true);
  assert.equal(wormhole.has("releaseImmediate"), true);
  assert.equal(wormhole.has("claim"), false);
  assert.equal(kufo.has("mintFromImmediateProof"), true);
  assert.equal(kufo.has("mintFromMaturedProof"), false);
});

test("compiler and OpenZeppelin dependencies are exactly pinned", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const packageLock = JSON.parse(fs.readFileSync(path.join(root, "package-lock.json"), "utf8"));
  assert.equal(packageJson.devDependencies.solc, "0.8.24");
  assert.equal(packageJson.devDependencies["@openzeppelin/contracts"], "5.0.2");
  assert.equal(packageJson.devDependencies["@openzeppelin/contracts-upgradeable"], "5.0.2");
  assert.equal(packageLock.packages["node_modules/solc"].version, "0.8.24");
  assert.equal(packageLock.packages["node_modules/@openzeppelin/contracts"].version, "5.0.2");
  assert.equal(packageLock.packages["node_modules/@openzeppelin/contracts-upgradeable"].version, "5.0.2");
});

test("review package contains no Mainnet deployment script or deployed address manifest", () => {
  assert.equal(fs.existsSync(path.join(root, "deployments", "mainnet.json")), false);
  assert.equal(fs.existsSync(path.join(root, "scripts", "deploy-mainnet.mjs")), false);
});

test("Genesis inscription binds the Organ Registry rather than one permanent Furnace", () => {
  const names = functionNames("KAIOSGenesisInscription");
  assert.equal(names.has("organRegistry"), true);
  assert.equal(names.has("alchemyFurnace18911"), false);
});
