import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { after, test } from "node:test";
import { ZeroAddress, getAddress, getCreateAddress, id, keccak256, parseEther, sha256 } from "ethers";
import {
  ETHER,
  artifact,
  cleanupProviders,
  deploy,
  eventArgs,
  setupLingxiaoFullBankSystem,
} from "./helpers.mjs";
import {
  ACTIVATION_STATE,
  PHASE2_FORMAL,
  KaiosCivilizationPhase2Adapter,
  createPhase2IndexState,
  reducePhase2IndexedEvent,
  resolveActivationState,
  verifyIndexedKgenOwner,
} from "../frontend-adapter/kaiosCivilizationPhase2Adapter.mjs";

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

test("Phase 2 indexer schema retains module events and adds only compiler-generated cross-contract events", () => {
  const phase2ContractNames = [
    "KGENReserveRedemption_Upgradeable",
    "CelestialEligibility_Upgradeable",
    "CelestialCapitalCommitment_Upgradeable",
  ];
  const indexedContractNames = [
    ...phase2ContractNames,
    "LingxiaoCelestialBank18888_Upgradeable",
    "BankGovernance_Upgradeable",
    "KGEN_Token_V7_5_2",
  ];
  const phase2CompiledEvents = [...new Set(phase2ContractNames.flatMap((name) =>
    artifact(name).abi.filter((entry) => entry.type === "event").map((entry) => entry.name),
  ))].sort();
  const allCompiledEvents = new Set(indexedContractNames.flatMap((name) =>
    artifact(name).abi.filter((entry) => entry.type === "event").map((entry) => entry.name),
  ));
  const schema = JSON.parse(
    fs.readFileSync(path.join(root, "indexer", "kaios-civilization-phase2-events.schema.json"), "utf8"),
  );
  const indexedEvents = [...schema.properties.events.items.properties.event.enum].sort();
  const mappedEvents = [...new Set(Object.values(schema["x-contractEvents"]).flat())].sort();

  assert.deepEqual(indexedEvents, mappedEvents, "schema event enum must equal the contract-event routing map");
  for (const [contractName, eventNames] of Object.entries(schema["x-contractEvents"])) {
    const contractEvents = new Set(artifact(contractName).abi.filter((entry) => entry.type === "event").map((entry) => entry.name));
    for (const eventName of eventNames) {
      assert.equal(contractEvents.has(eventName), true, `${contractName}.${eventName} absent from compiler ABI`);
    }
  }
  for (const eventName of phase2CompiledEvents) {
    assert.equal(indexedEvents.includes(eventName), true, `missing Phase 2 event ${eventName}`);
  }
  for (const eventName of indexedEvents) {
    assert.equal(allCompiledEvents.has(eventName), true, `event absent from compiler ABI: ${eventName}`);
  }
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
    "ModuleConfigured",
    "GovernanceProposalCreated",
    "GovernanceProposalApproved",
    "GovernanceProposalExecuted",
    "GovernanceProposalCancelled",
    "SetTaxWallets",
    "Transfer",
  ]) assert.equal(indexedEvents.includes(requiredEvent), true, requiredEvent);
  assert.equal(indexedEvents.includes("GovernanceFinalized"), false, "bank event is outside Phase 2 activation schema");
});

test("Phase 2 frontend activation resolver fails closed and represents every staged state", () => {
  const base = {
    chainId: 56,
    formalAddressMatch: true,
    codePresent: true,
    versionMatch: true,
    abiMatch: true,
    registered: true,
    governanceFinalized: true,
    registryActive: false,
    paused: false,
    humanActivationConfirmed: false,
  };
  assert.equal(resolveActivationState("eligibility", { ...base, registered: false }), ACTIVATION_STATE.BUILDING);
  assert.equal(resolveActivationState("eligibility", base), ACTIVATION_STATE.INACTIVE);
  assert.equal(resolveActivationState("capitalCommitment", { ...base, paused: true }), ACTIVATION_STATE.PAUSED);
  assert.equal(resolveActivationState("eligibility", { ...base, registryActive: true, humanActivationConfirmed: true }), ACTIVATION_STATE.ACTIVE);
  assert.equal(resolveActivationState("eligibility", { ...base, chainId: 97 }), ACTIVATION_STATE.ERROR_MISMATCH);
  assert.equal(resolveActivationState("eligibility", { ...base, formalAddressMatch: false }), ACTIVATION_STATE.ERROR_MISMATCH);
  assert.equal(resolveActivationState("eligibility", { ...base, versionMatch: false }), ACTIVATION_STATE.ERROR_MISMATCH);
  assert.equal(resolveActivationState("eligibility", { ...base, unknown: true }), ACTIVATION_STATE.ERROR_MISMATCH);

  const reserve = {
    ...base,
    taxReceiverMatches: true,
    redemptionEnabled: false,
    reserveAboveFloor: false,
    activationMarginConfirmed: false,
  };
  assert.equal(resolveActivationState("reserveRedemption", reserve), ACTIVATION_STATE.RESERVE_ACCUMULATING);
  assert.equal(resolveActivationState("reserveRedemption", { ...reserve, taxReceiverMatches: false }), ACTIVATION_STATE.INACTIVE);
  assert.equal(resolveActivationState("reserveRedemption", {
    ...reserve,
    registryActive: true,
    humanActivationConfirmed: true,
    redemptionEnabled: true,
    reserveAboveFloor: false,
    activationMarginConfirmed: true,
  }), ACTIVATION_STATE.REDEMPTION_DISABLED);
  assert.equal(resolveActivationState("reserveRedemption", {
    ...reserve,
    registryActive: true,
    humanActivationConfirmed: true,
    redemptionEnabled: true,
    reserveAboveFloor: true,
    activationMarginConfirmed: true,
  }), ACTIVATION_STATE.REDEMPTION_READY);
});

test("Phase 2 live adapter fails closed before any contract read on an RPC chain mismatch", async () => {
  const adapter = new KaiosCivilizationPhase2Adapter({
    provider: { getNetwork: async () => ({ chainId: 97n }) },
  });
  const status = await adapter.systemStatus({ humanActivation: { eligibility: true, capitalCommitment: true, reserveRedemption: true } });
  assert.match(status.error, /CHAIN_ID_MISMATCH/u);
  assert.equal(status.eligibility.activationState, ACTIVATION_STATE.ERROR_MISMATCH);
  assert.equal(status.capitalCommitment.writeAllowed, false);
  assert.equal(status.reserveRedemption.writeAllowed, false);
});

test("Phase 2 index reducer reconstructs activation governance and never guesses KGEN tax attribution", () => {
  const tx = "0x" + "11".repeat(32);
  let state = createPhase2IndexState();
  state = reducePhase2IndexedEvent(state, {
    contract: "LingxiaoCelestialBank18888_Upgradeable",
    event: "ModuleConfigured",
    transactionHash: tx,
    args: { moduleId: "0x01", module: PHASE2_FORMAL.eligibility, versionHash: "0x02", perTransactionLimit: 0n, epochLimit: 0n, active: true },
  });
  state = reducePhase2IndexedEvent(state, {
    contract: "BankGovernance_Upgradeable",
    event: "GovernanceProposalCreated",
    transactionHash: tx,
    args: { proposalId: "0x03", target: PHASE2_FORMAL.bank18888, dataHash: "0x04", executableAt: 1234n, proposer: "0x0000000000000000000000000000000000000001" },
  });
  state = reducePhase2IndexedEvent(state, {
    contract: "BankGovernance_Upgradeable",
    event: "GovernanceProposalApproved",
    transactionHash: tx,
    args: { proposalId: "0x03", approver: "0x0000000000000000000000000000000000000002" },
  });
  state = reducePhase2IndexedEvent(state, {
    contract: "BankGovernance_Upgradeable",
    event: "GovernanceProposalExecuted",
    transactionHash: tx,
    args: { proposalId: "0x03" },
  });
  state = reducePhase2IndexedEvent(state, {
    contract: "KGEN_Token_V7_5_2",
    contractAddress: PHASE2_FORMAL.kgen,
    event: "SetTaxWallets",
    transactionHash: tx,
    args: { bank: PHASE2_FORMAL.reserveRedemption, reward: "0x0000000000000000000000000000000000000003", autolp: "0x0000000000000000000000000000000000000004" },
  });
  state = reducePhase2IndexedEvent(state, {
    contract: "KGEN_Token_V7_5_2",
    contractAddress: PHASE2_FORMAL.kgen,
    event: "Transfer",
    transactionHash: tx,
    args: { from: "0x0000000000000000000000000000000000000005", to: PHASE2_FORMAL.reserveRedemption, value: 1n },
  });
  assert.equal(state.modules["0x01"].active, true);
  assert.equal(state.proposals["0x03"].approved, true);
  assert.equal(state.proposals["0x03"].executed, true);
  assert.equal(state.kgenTaxWallets.bank, PHASE2_FORMAL.reserveRedemption);
  assert.equal(state.kgenInflows[0].classification, "UNCLASSIFIED_KGEN_INFLOW");
});

test("Phase 2 index reducer reconstructs dynamic KGEN ownership in canonical event order", () => {
  const deployer = "0xb3C54ca96De0dED4Ca0151F629ff9781506ba261";
  const governance = PHASE2_FORMAL.bankGovernance;
  const futureOwner = "0x00000000000000000000000000000000000000f1";
  const event = ({ previousOwner, newOwner, blockNumber, transactionIndex, logIndex, transactionHash, removed = false }) => ({
    contract: "KGEN_Token_V7_5_2",
    contractAddress: PHASE2_FORMAL.kgen,
    event: "OwnershipTransferred",
    blockNumber,
    transactionIndex,
    logIndex,
    transactionHash,
    removed,
    args: { previousOwner, newOwner },
  });
  let state = createPhase2IndexState();
  state = reducePhase2IndexedEvent(state, event({
    previousOwner: ZeroAddress, newOwner: deployer, blockNumber: 10, transactionIndex: 0, logIndex: 0,
    transactionHash: `0x${"10".repeat(32)}`,
  }));
  assert.equal(state.kgen.owner, deployer);
  state = reducePhase2IndexedEvent(state, event({
    previousOwner: deployer, newOwner: governance, blockNumber: 20, transactionIndex: 1, logIndex: 3,
    transactionHash: `0x${"20".repeat(32)}`,
  }));
  assert.equal(state.kgen.owner, governance);
  assert.equal(state.kgen.previousOwner, deployer);
  assert.equal(state.kgen.ownershipChangedAtBlock, 20);
  assert.equal(state.kgen.ownershipChangedAtTransactionIndex, 1);
  assert.equal(state.kgen.ownershipChangedAtLogIndex, 3);

  state = reducePhase2IndexedEvent(state, event({
    previousOwner: deployer, newOwner: futureOwner, blockNumber: 19, transactionIndex: 9, logIndex: 99,
    transactionHash: `0x${"19".repeat(32)}`,
  }));
  assert.equal(state.kgen.owner, governance, "an out-of-order stale event must not replace the canonical owner");

  state = reducePhase2IndexedEvent(state, event({
    previousOwner: governance, newOwner: futureOwner, blockNumber: 20, transactionIndex: 2, logIndex: 5,
    transactionHash: `0x${"21".repeat(32)}`,
  }));
  assert.equal(state.kgen.owner, getAddress(futureOwner));
  assert.equal(state.kgen.previousOwner, governance);

  state = reducePhase2IndexedEvent(state, event({
    previousOwner: futureOwner, newOwner: deployer, blockNumber: 21, transactionIndex: 0, logIndex: 0,
    transactionHash: `0x${"22".repeat(32)}`, removed: true,
  }));
  assert.equal(state.kgen.owner, getAddress(futureOwner), "removed logs are excluded from the canonical replay");
});

test("Phase 2 read model independently verifies indexed KGEN owner and fails closed on mismatch", () => {
  const owner = "0xb3C54ca96De0dED4Ca0151F629ff9781506ba261";
  const state = createPhase2IndexState();
  state.kgen.owner = owner;
  const verified = verifyIndexedKgenOwner(state, owner);
  assert.equal(verified.currentKgenOwner, owner);
  assert.equal(verified.ownerSource, "INDEXER_AND_RPC");
  assert.equal(verified.ownerVerified, true);
  assert.equal(verified.governanceSensitiveWriteAllowed, true);

  const mismatch = verifyIndexedKgenOwner(state, PHASE2_FORMAL.bankGovernance);
  assert.equal(mismatch.ownerSource, "INDEXER_RPC_MISMATCH");
  assert.equal(mismatch.ownerVerified, false);
  assert.equal(mismatch.errorMismatch, true);
  assert.equal(mismatch.governanceSensitiveWriteAllowed, false);

  const rpcOnly = verifyIndexedKgenOwner(createPhase2IndexState(), owner);
  assert.equal(rpcOnly.ownerSource, "RPC_ONLY");
  assert.equal(rpcOnly.ownerVerified, false);
  assert.equal(rpcOnly.governanceSensitiveWriteAllowed, false);
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
