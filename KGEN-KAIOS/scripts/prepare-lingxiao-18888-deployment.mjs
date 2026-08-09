import process from "node:process";
import { AbiCoder, ContractFactory, Interface, getAddress, getCreateAddress, id } from "ethers";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const readArtifact = (name) => JSON.parse(fs.readFileSync(path.join(root, "artifacts", `${name}.json`), "utf8"));
const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required (public address/nonce only)`);
  return value;
};
const deployer = getAddress(required("MAINNET_DEPLOYMENT_SIGNER_ADDRESS"));
const startNonce = BigInt(required("MAINNET_DEPLOYMENT_SIGNER_NONCE"));
const registry = getAddress(required("FORMAL_KAIOS_ORGAN_REGISTRY"));
const economic8888 = getAddress(required("FORMAL_ECONOMIC_BANK_8888"));
const exchange11520 = getAddress(required("FORMAL_UNIVERSAL_EXCHANGE_11520"));
const admin = getAddress(process.env.FORMAL_BANK_ADMIN ?? "0xCd60BF474e691F2484950a0276Eaf507616Ca4b9");
const upgrader = getAddress(process.env.FORMAL_BANK_UPGRADER ?? admin);
const kgen = "0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be";
const addressAt = (offset) => getCreateAddress({ from: deployer, nonce: startNonce + BigInt(offset) });
const proxyArtifact = readArtifact("ERC1967Proxy");
const actions = [];

async function deploymentData(name, args = []) {
  const artifact = readArtifact(name);
  return (await new ContractFactory(artifact.abi, artifact.bytecode).getDeployTransaction(...args)).data;
}
async function appendUpgradeable(name, initializeArgs) {
  const implementationOffset = actions.length;
  const implementation = addressAt(implementationOffset);
  actions.push({ kind: "DEPLOY_IMPLEMENTATION", contract: name, expectedAddress: implementation, data: await deploymentData(name) });
  const artifact = readArtifact(name);
  const initializer = new Interface(artifact.abi).encodeFunctionData("initialize", initializeArgs);
  const proxy = addressAt(actions.length);
  actions.push({ kind: "DEPLOY_ERC1967_PROXY", contract: name, expectedAddress: proxy, implementation, data: await deploymentData("ERC1967Proxy", [implementation, initializer]) });
  return { implementation, proxy };
}

const bank = await appendUpgradeable("LingxiaoCelestialBank18888_Upgradeable", [admin, upgrader, kgen]);
const seat = await appendUpgradeable("CelestialSeat500_Upgradeable", [bank.proxy, admin, upgrader, 2_592_000]);
const allocation = await appendUpgradeable("CivilizationAllocation_Upgradeable", [bank.proxy, admin, upgrader]);
const router8888 = await appendUpgradeable("EconomicRouter8888_Upgradeable", [bank.proxy, admin, upgrader, economic8888]);
const settlement11520 = await appendUpgradeable("ExchangeSettlement11520_Upgradeable", [bank.proxy, admin, upgrader, exchange11520]);
const risk = await appendUpgradeable("BankRiskController_Upgradeable", [bank.proxy, admin, upgrader]);
const governance = await appendUpgradeable("BankGovernance_Upgradeable", [bank.proxy, admin, upgrader, 3600]);
const migration = await appendUpgradeable("BankMigration_Upgradeable", [bank.proxy, admin, upgrader]);
const kaiosAddress = addressAt(actions.length);
actions.push({ kind: "DEPLOY_KAIOS_TOKEN_CORE", contract: "KAIOS", expectedAddress: kaiosAddress, data: await deploymentData("KAIOS", [kgen, bank.proxy, registry]) });

const plan = {
  status: "UNSIGNED_CALLDATA_ONLY",
  mainnetTransactionAuthorized: false,
  chainId: 56,
  deployer,
  startNonce: startNonce.toString(),
  canon: { kgen, registry, economic8888, exchange11520, admin, upgrader },
  predicted: { bank, seat, allocation, router8888, settlement11520, risk, governance, migration, kaios: kaiosAddress },
  actions,
  postDeployCalls: {
    bindKAIOS: new Interface(readArtifact("LingxiaoCelestialBank18888_Upgradeable").abi).encodeFunctionData("bindKAIOS", [kaiosAddress]),
    setRiskController: new Interface(readArtifact("LingxiaoCelestialBank18888_Upgradeable").abi).encodeFunctionData("setRiskController", [risk.proxy]),
    finalizeModuleGovernance: Object.fromEntries(
      Object.entries({ seat, allocation, router8888, settlement11520, risk, governance, migration }).map(
        ([name, deployed]) => [
          name,
          new Interface(readArtifact(
            name === "seat" ? "CelestialSeat500_Upgradeable"
              : name === "allocation" ? "CivilizationAllocation_Upgradeable"
                : name === "router8888" ? "EconomicRouter8888_Upgradeable"
                  : name === "settlement11520" ? "ExchangeSettlement11520_Upgradeable"
                    : name === "risk" ? "BankRiskController_Upgradeable"
                      : name === "governance" ? "BankGovernance_Upgradeable"
                        : "BankMigration_Upgradeable",
          ).abi).encodeFunctionData("finalizeModuleGovernance", [governance.proxy]),
        ],
      ),
    ),
    finalizeGovernance: new Interface(readArtifact("LingxiaoCelestialBank18888_Upgradeable").abi).encodeFunctionData("finalizeGovernance", [governance.proxy])
  },
  moduleIds: {
    seat500: id("KAIOS.BANK.MODULE.CELESTIAL_SEAT_500"),
    civilizationAllocation: id("KAIOS.BANK.MODULE.CIVILIZATION_ALLOCATION"),
    economicRouter8888: id("KAIOS.BANK.MODULE.ECONOMIC_ROUTER_8888"),
    exchangeSettlement11520: id("KAIOS.BANK.MODULE.EXCHANGE_SETTLEMENT_11520"),
    riskController: id("KAIOS.BANK.MODULE.RISK_CONTROLLER"),
    governance: id("KAIOS.BANK.MODULE.GOVERNANCE"),
    migration: id("KAIOS.BANK.MODULE.MIGRATION")
  },
  blockers: ["MODULE_LIMITS_REQUIRE_FINAL_GOVERNANCE_APPROVAL", "MAINNET_DEPLOY_APPROVED_NOT_RECEIVED"]
};
process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
