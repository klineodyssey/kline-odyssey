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

test("18888 V2 ABI exposes no withdrawal, sweep, rescue, approval, or player transfer path", () => {
  const names = functionNames("LingxiaoCelestialBank18888_Upgradeable");
  const forbidden = [
    "withdraw",
    "withdrawAll",
    "release",
    "releaseKAIOS",
    "sweep",
    "rescue",
    "rescueToken",
    "transfer",
    "transferToken",
    "transferFrom",
    "approve",
    "clawback",
    "freeze",
    "blacklist",
    "loan",
    "distribute",
    "swap",
    "addLiquidity",
  ];
  for (const name of forbidden) assert.equal(names.has(name), false, `18888.${name}`);

  const source = fs.readFileSync(
    path.join(root, "contracts", "LingxiaoCelestialBank18888_Upgradeable.sol"),
    "utf8",
  );
  for (const pattern of [/\.transfer\s*\(/u, /\.transferFrom\s*\(/u, /\.approve\s*\(/u]) {
    assert.equal(pattern.test(source), false, pattern.source);
  }
});

test("18888 V2 initial UUPS storage layout is locked to two data slots and a reserve gap", () => {
  const layout = artifact("LingxiaoCelestialBank18888_Upgradeable").storageLayout.storage.map(
    ({ label, slot, offset, type }) => ({ label, slot, offset, type }),
  );
  assert.deepEqual(layout, [
    { label: "kgen", slot: "0", offset: 0, type: "t_address" },
    { label: "kaios", slot: "1", offset: 0, type: "t_address" },
    { label: "kaiosBound", slot: "1", offset: 20, type: "t_bool" },
    { label: "__gap", slot: "2", offset: 0, type: "t_array(t_uint256)48_storage" },
  ]);
});
