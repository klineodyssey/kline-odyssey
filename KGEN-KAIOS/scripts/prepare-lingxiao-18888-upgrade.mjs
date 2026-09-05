import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { Interface, getAddress, keccak256 } from "ethers";

const root = path.resolve(import.meta.dirname, "..");
const target = process.env.UPGRADE_TARGET ?? "LINGXIAO_18888";
const targets = {
  LINGXIAO_18888: {
    proxy: process.env.LINGXIAO_18888_BANK_PROXY,
    implementation: process.env.NEW_LINGXIAO_BANK_IMPLEMENTATION,
    artifact: "LingxiaoCelestialBank18888_Upgradeable",
  },
  GAOLAOZHUANG_8888: {
    proxy: process.env.GAOLAOZHUANG_8888_BANK_PROXY,
    implementation: process.env.NEW_GAOLAOZHUANG_8888_IMPLEMENTATION,
    artifact: "GaolaozhuangCommercialBank8888_Upgradeable",
  },
};
if (!targets[target]) throw new Error("UPGRADE_TARGET must be LINGXIAO_18888 or GAOLAOZHUANG_8888");
const proxy = getAddress(targets[target].proxy ?? "");
const implementation = getAddress(targets[target].implementation ?? "");
const call = process.env.UPGRADE_REINITIALIZER_CALLDATA ?? "0x";
const abi = JSON.parse(fs.readFileSync(path.join(root, "abi", `${targets[target].artifact}.json`), "utf8"));
const calldata = new Interface(abi).encodeFunctionData("upgradeToAndCall", [implementation, call]);
process.stdout.write(`${JSON.stringify({
  status: "UNSIGNED_CALLDATA_ONLY",
  mainnetTransactionAuthorized: false,
  chainId: 56,
  target,
  proxy,
  implementation,
  calldata,
  calldataHash: keccak256(calldata),
  mandatoryGates: ["storage diff", "fuzz", "invariant", "fork rehearsal", "governance approval", "public Upgraded event verification"]
}, null, 2)}\n`);
