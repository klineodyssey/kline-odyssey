import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { after, test } from "node:test";
import { ZeroAddress, getCreateAddress, id, keccak256, parseEther, sha256 } from "ethers";
import {
  ETHER,
  artifact,
  cleanupProviders,
  deploy,
  eventArgs,
  setupLingxiaoFullBankSystem,
} from "./helpers.mjs";

const root = path.resolve(import.meta.dirname, "..");
after(cleanupProviders);

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

test("Phase 2 frozen Mainnet config encodes the exact Human V1 parameters", () => {
  const config = JSON.parse(
    fs.readFileSync(path.join(root, "config", "phase2-mainnet-config.final-review.json"), "utf8"),
  );
  const reserve = config.parameters.reserveRedemption;
  const eligibility = config.parameters.celestialEligibility;
  const capital = config.parameters.capitalCommitment;

  assert.equal(config.status, "HUMAN_V1_PARAMETERS_FROZEN_NOT_DEPLOYED");
  assert.equal(BigInt(reserve.minimumKgenReserveWei), parseEther("100"));
  assert.equal(BigInt(reserve.maxKgenPerTransactionWei), parseEther("10"));
  assert.equal(BigInt(reserve.maxKgenPerUtcDayWei), parseEther("100"));
  assert.equal(BigInt(reserve.maxKaiosPerTransactionWei), parseEther("10000"));
  assert.equal(BigInt(reserve.maxKaiosPerUtcDayWei), parseEther("100000"));
  assert.equal(reserve.redemptionInitiallyEnabled, false);
  assert.equal(
    eligibility.requiredDestinationCodeSource,
    "KAIOS.CIVILIZATION.RESERVE_REDEMPTION.18888",
  );
  assert.equal(id(eligibility.requiredDestinationCodeSource), eligibility.requiredDestinationCode);
  assert.equal(BigInt(eligibility.singleProofMinimumKaiosWei), parseEther("5000000"));
  assert.equal(eligibility.multiProofAggregationAllowed, false);
  assert.equal(BigInt(capital.singleCommitmentMinimumKaiosWei), parseEther("5000000"));
  assert.equal(capital.minimumLockPeriodSeconds, 2_592_000);
  assert.equal(capital.kaiosBurned, false);
  assert.equal(config.governance.contributionVerifier, config.governance.primary);
  assert.deepEqual(Object.values(config.initialModuleStates), ["INACTIVE", "INACTIVE", "INACTIVE"]);
});

test("Phase 2 indexer schema event names exactly match compiler-generated ABIs", () => {
  const contractNames = [
    "KGENReserveRedemption_Upgradeable",
    "CelestialEligibility_Upgradeable",
    "CelestialCapitalCommitment_Upgradeable",
  ];
  const compiledEvents = [...new Set(contractNames.flatMap((name) =>
    artifact(name).abi.filter((entry) => entry.type === "event").map((entry) => entry.name),
  ))].sort();
  const schema = JSON.parse(
    fs.readFileSync(path.join(root, "indexer", "kaios-civilization-phase2-events.schema.json"), "utf8"),
  );
  const indexedEvents = [...schema.properties.events.items.properties.event.enum].sort();

  assert.deepEqual(indexedEvents, compiledEvents, "INDEXER_SCHEMA_ABI_MATCH");
  for (const requiredEvent of [
    "EligibilityPaused",
    "EligibilityUnpaused",
    "MinimumLockPeriodUpdated",
    "BankModuleInitialized",
    "Initialized",
    "ModuleGovernanceFinalized",
    "RoleAdminChanged",
    "RoleGranted",
    "RoleRevoked",
  ]) assert.equal(indexedEvents.includes(requiredEvent), true, requiredEvent);
  assert.equal(indexedEvents.includes("GovernanceFinalized"), false);
});

test("pre-sign package contains no executable Mainnet transaction script or formal deployed-address manifest", () => {
  assert.equal(fs.existsSync(path.join(root, "deployments", "mainnet.json")), false);
  assert.equal(fs.existsSync(path.join(root, "scripts", "deploy-mainnet.mjs")), false);
});

test("Genesis inscription binds the Organ Registry rather than one permanent Furnace", () => {
  const names = functionNames("KAIOSGenesisInscription");
  assert.equal(names.has("organRegistry"), true);
  assert.equal(names.has("alchemyFurnace18911"), true);
});

test("18888 V2 exposes policy-gated banking rails with no owner withdrawal or player pull", () => {
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
  assert.equal(names.has("proposeDisbursement"), true);
  assert.equal(names.has("approveDisbursement"), true);
  assert.equal(names.has("claimDisbursement"), true);
  assert.equal(names.has("executeModulePayment"), true);
  assert.equal(names.has("configureModule"), true);

  const source = fs.readFileSync(
    path.join(root, "contracts", "LingxiaoCelestialBank18888_Upgradeable.sol"),
    "utf8",
  );
  for (const pattern of [/\.transfer\s*\(/u, /\.transferFrom\s*\(/u, /\.approve\s*\(/u]) {
    assert.equal(pattern.test(source), false, pattern.source);
  }
});

test("18888 V2 modular UUPS layout preserves lineage slots and only consumes reserved gap", () => {
  const layout = artifact("LingxiaoCelestialBank18888_Upgradeable").storageLayout.storage.map(
    ({ label, slot, offset, type }) => ({
      label,
      slot,
      offset,
      type: type.replace(/t_struct\(([^)]+)\)\d+_storage/g, "t_struct($1)_storage"),
    }),
  );
  assert.deepEqual(layout, [
    { label: "kgen", slot: "0", offset: 0, type: "t_address" },
    { label: "kaios", slot: "1", offset: 0, type: "t_address" },
    { label: "kaiosBound", slot: "1", offset: 20, type: "t_bool" },
    { label: "totalKaiosDisbursed", slot: "2", offset: 0, type: "t_uint256" },
    {
      label: "_disbursements",
      slot: "3",
      offset: 0,
      type: "t_mapping(t_bytes32,t_struct(Disbursement)_storage)",
    },
    { label: "_modules", slot: "4", offset: 0, type: "t_mapping(t_bytes32,t_struct(ModuleConfig)_storage)" },
    { label: "_moduleIds", slot: "5", offset: 0, type: "t_mapping(t_address,t_bytes32)" },
    { label: "_modulePayments", slot: "6", offset: 0, type: "t_mapping(t_bytes32,t_bool)" },
    { label: "totalKaiosAccountedInflow", slot: "7", offset: 0, type: "t_uint256" },
    { label: "totalKaiosModuleDisbursed", slot: "8", offset: 0, type: "t_uint256" },
    { label: "reserveRequirement", slot: "9", offset: 0, type: "t_uint256" },
    { label: "lastAccountedGrossAssets", slot: "10", offset: 0, type: "t_uint256" },
    { label: "genesisStartedAt", slot: "11", offset: 0, type: "t_uint64" },
    { label: "genesisStarted", slot: "11", offset: 8, type: "t_bool" },
    { label: "riskController", slot: "11", offset: 9, type: "t_address" },
    { label: "genesisOpeningBalance", slot: "12", offset: 0, type: "t_uint256" },
    { label: "paused", slot: "13", offset: 0, type: "t_bool" },
    { label: "governanceFinalized", slot: "13", offset: 1, type: "t_bool" },
    { label: "bootstrapUpgrader", slot: "13", offset: 2, type: "t_address" },
    { label: "__gap", slot: "14", offset: 0, type: "t_array(t_uint256)36_storage" },
  ]);
});

test("18888 modules expose no owner withdrawal, sweep, arbitrary token transfer, or player pull", () => {
  const modules = [
    "CelestialSeat500_Upgradeable",
    "CivilizationAllocation_Upgradeable",
    "EconomicRouter8888_Upgradeable",
    "ExchangeSettlement11520_Upgradeable",
    "BankRiskController_Upgradeable",
    "BankGovernance_Upgradeable",
    "BankMigration_Upgradeable",
  ];
  const forbidden = [
    "withdraw", "withdrawAll", "sweep", "rescue", "transfer", "transferToken",
    "transferFrom", "clawback", "freeze", "blacklist",
  ];
  for (const moduleName of modules) {
    const names = functionNames(moduleName);
    for (const name of forbidden) assert.equal(names.has(name), false, `${moduleName}.${name}`);
    if (moduleName !== "BankGovernance_Upgradeable") {
      assert.equal(names.has("approve"), false, `${moduleName}.approve`);
    }
    assert.equal(names.has("upgradeToAndCall"), true, `${moduleName}.upgradeToAndCall`);
  }
});

test("all ten UUPS modules reserve a deterministic 100-slot custom namespace", () => {
  const evidence = JSON.parse(
    fs.readFileSync(path.join(root, "reports", "SOLIDITY_COMPILE_EVIDENCE.json"), "utf8"),
  );
  assert.equal(evidence.upgradeableModuleStorageValidation.status, "PASS");
  assert.equal(evidence.upgradeableModuleStorageValidation.modules.length, 10);
  for (const module of evidence.upgradeableModuleStorageValidation.modules) {
    assert.equal(module.status, "PASS", module.contractName);
    assert.equal(module.namespaceSlots, 100, module.contractName);
    assert.equal(module.basePrefixPreserved, true, module.contractName);
  }
});

test("8888 exposes only account-owned and fixed-beneficiary money rails with a 50-slot UUPS namespace", () => {
  const names = functionNames("GaolaozhuangCommercialBank8888_Upgradeable");
  for (const name of [
    "withdraw", "withdrawAll", "sweep", "rescue", "transfer", "transferToken",
    "adminTransfer", "arbitraryTransfer", "clawback", "freeze", "blacklist", "loan",
  ]) assert.equal(names.has(name), false, `8888.${name}`);
  for (const name of [
    "withdrawAccount", "claimSalary", "createBusinessPayment", "executeBusinessPayment",
    "depositToAccount", "scheduleInterestRate", "checkpointInterest", "upgradeToAndCall",
  ]) assert.equal(names.has(name), true, `8888.${name}`);
  const evidence = JSON.parse(
    fs.readFileSync(path.join(root, "reports", "SOLIDITY_COMPILE_EVIDENCE.json"), "utf8"),
  );
  assert.equal(evidence.gaolaozhuangCommercialBank8888StorageValidation.status, "PASS");
  assert.equal(evidence.gaolaozhuangCommercialBank8888StorageValidation.namespaceSlots, 50);
});

test("Genesis inscription says ONE THOUSAND and never TEN THOUSAND", () => {
  const source = fs.readFileSync(path.join(root, "contracts", "KAIOSGenesisInscription.sol"), "utf8");
  assert.equal(source.includes("ONE BURNED KGEN CREATES ONE THOUSAND KAIOS."), true);
  assert.equal(source.includes("TEN THOUSAND KAIOS"), false);
});

test("Genesis inscription anchors the exact committed bytes and has no monetary authority", () => {
  const bytes = fs.readFileSync(path.join(root, "KAIOS_GENESIS_INSCRIPTION.md"));
  assert.equal(keccak256(bytes), "0xbc89db0915e1fd0e978ae0cfe194f4b46db22534febab35563de2802935b3704");
  assert.equal(sha256(bytes), "0xadd44b79083a20a6d9f240a99c5fd47658f191ce8b3fa81da6f60c97e8b4470f");

  const compiled = artifact("KAIOSGenesisInscription");
  const mutable = compiled.abi.filter(
    (entry) => entry.type === "function" && !["pure", "view"].includes(entry.stateMutability),
  );
  assert.deepEqual(mutable, []);
  assert.equal(compiled.abi.some((entry) => ["receive", "fallback"].includes(entry.type)), false);
  const forbidden = /owner|admin|setter|upgrade|withdraw|sweep|transfer|approve|execute|call/iu;
  assert.deepEqual(
    compiled.abi.filter((entry) => entry.type === "function" && forbidden.test(entry.name)),
    [],
  );
});

test("Genesis inscription constructor records verified settlement evidence and rejects unsafe inputs", async () => {
  const context = await setupLingxiaoFullBankSystem();
  const furnace = await deploy("MockOrgan", context.deployer);
  await (await context.kgen.connect(context.deployer).burn(ETHER)).wait();
  const settlementReceipt = await (await context.kaios.connect(context.deployer).settleWhiteHoleMass()).wait();
  const event = eventArgs(settlementReceipt, context.kaios, "WhiteHoleMassSettled");
  const kgenSupply = await context.kgen.totalSupply({ blockTag: settlementReceipt.blockNumber });
  const args = [
    await context.kaios.getAddress(),
    await context.kgen.getAddress(),
    await context.bank.getAddress(),
    await furnace.getAddress(),
    await context.registry.getAddress(),
    kgenSupply,
    event.cumulativeKgenBurned,
    event.kaiosMinted,
    settlementReceipt.hash,
    settlementReceipt.blockNumber,
  ];
  const inscription = await deploy("KAIOSGenesisInscription", context.deployer, args);
  const canonicalBytes = fs.readFileSync(path.join(root, "KAIOS_GENESIS_INSCRIPTION.md"));

  assert.equal(await inscription.kgenSupplyAtSettlement(), kgenSupply);
  assert.equal(await inscription.recognizedHistoricalBurnedKgen(), ETHER);
  assert.equal(await inscription.actualGenesisKaiosMinted(), 1_000n * ETHER);
  assert.equal(await inscription.settlementTxHash(), settlementReceipt.hash);
  assert.equal(await inscription.settlementBlock(), BigInt(settlementReceipt.blockNumber));
  assert.equal(await inscription.alchemyFurnace18911(), await furnace.getAddress());
  assert.equal(await inscription.inscriptionHashMatches(canonicalBytes), true);
  assert.equal(await inscription.inscriptionSha256Matches(canonicalBytes), true);

  const eoa = await context.signers[10].getAddress();
  for (const index of [0, 1, 2, 3, 4]) {
    const zeroArgs = [...args];
    zeroArgs[index] = ZeroAddress;
    await assert.rejects(deploy("KAIOSGenesisInscription", context.deployer, zeroArgs));
    const eoaArgs = [...args];
    eoaArgs[index] = eoa;
    await assert.rejects(deploy("KAIOSGenesisInscription", context.deployer, eoaArgs));
  }
  const wrongQuantityArgs = [...args];
  wrongQuantityArgs[7] = event.kaiosMinted + 1n;
  await assert.rejects(deploy("KAIOSGenesisInscription", context.deployer, wrongQuantityArgs));
  const emptyTxArgs = [...args];
  emptyTxArgs[8] = `0x${"00".repeat(32)}`;
  await assert.rejects(deploy("KAIOSGenesisInscription", context.deployer, emptyTxArgs));
});

test("Mainnet Genesis evidence tooling derives the amount from chain state using integer arithmetic", () => {
  const source = fs.readFileSync(path.join(root, "tools", "validate-integration-artifacts.mjs"), "utf8");
  assert.equal(source.includes("--generate-kaios-genesis-record"), true);
  assert.equal(source.includes("No amount argument is accepted."), true);
  assert.equal(source.includes("const historicalBurn = genesisKgenSupply - kgenSupply;"), true);
  assert.equal(source.includes("event.kaiosMinted !== historicalBurn * 1_000n"), true);
  assert.equal(source.includes("KAIOS_GENESIS_MAINNET_RECORD.json"), true);
  assert.equal(source.includes("KAIOS_GENESIS_MAINNET_INSCRIPTION.md"), true);
  assert.equal(source.includes("KAIOS_GENESIS_INSCRIPTION_UNSIGNED_DEPLOYMENT.json"), true);
  assert.equal(source.includes("FROZEN_DEPLOYMENTS_1_TO_21_THEN_GENESIS_SETTLEMENT"), true);
  assert.equal(source.includes("FROZEN_DEPLOYMENT_HAS_NO_CODE"), true);
  assert.equal(source.includes("inscriptionArtifact.bytecode"), true);
  assert.equal(source.includes('network.chainId !== 56n'), true);
  assert.equal(source.includes("--amount"), false);
  assert.equal(source.includes("sendTransaction"), false);

  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, "config", "LINGXIAO_18888_MAINNET_DEPLOYMENT_MANIFEST.json"), "utf8"),
  );
  const deployer = "0xb3C54ca96De0dED4Ca0151F629ff9781506ba261";
  assert.equal(manifest.deploymentOrder.length, 21);
  for (const action of manifest.deploymentOrder) {
    assert.equal(
      getCreateAddress({ from: deployer, nonce: action.nonce }),
      action.predictedAddress,
      action.identity,
    );
  }
  assert.equal(
    getCreateAddress({ from: deployer, nonce: 55 }),
    "0xb02CBc7698646653D541F494F510Fe18638AC7ae",
  );
  assert.equal(manifest.postGenesisInscription.first21AddressImpact, "NONE");
});
