import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { Interface, getAddress, keccak256 } from "ethers";

const root = path.resolve(import.meta.dirname, "..");
const proxy = getAddress(process.env.LINGXIAO_18888_BANK_PROXY ?? "");
const implementation = getAddress(process.env.NEW_LINGXIAO_BANK_IMPLEMENTATION ?? "");
const call = process.env.UPGRADE_REINITIALIZER_CALLDATA ?? "0x";
const abi = JSON.parse(fs.readFileSync(path.join(root, "abi", "LingxiaoCelestialBank18888_Upgradeable.json"), "utf8"));
const calldata = new Interface(abi).encodeFunctionData("upgradeToAndCall", [implementation, call]);
process.stdout.write(`${JSON.stringify({
  status: "UNSIGNED_CALLDATA_ONLY",
  mainnetTransactionAuthorized: false,
  chainId: 56,
  proxy,
  implementation,
  calldata,
  calldataHash: keccak256(calldata),
  mandatoryGates: ["storage diff", "fuzz", "invariant", "fork rehearsal", "governance approval", "public Upgraded event verification"]
}, null, 2)}\n`);
