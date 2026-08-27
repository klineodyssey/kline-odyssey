import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import { createRequire } from "node:module";
import {
  MemoryUniverseStore, createUniverseRuntime, resolveSpeciesCode, upgradeAppVersion,
  createListing, settleOrder, MissionEngine, completeAssetDream, assertLedgerSeparation,
  assertAppendOnlyChain, validateSpacecraft, ASSET_TYPES, buildLifeDraft, assignLifeJob,
  validateKgenMarketSnapshot, validateSwapIntent, KGEN_SWAP_CONFIG, DigitalLifeBirthResolver,
  createBirthCertificate, createPendingBirthCertificate, createDigitalLifeBirthCertificateView, appendResolvedLifeBirth, calculateLifeAge,
  deriveHeartEligibility, createDigitalAntFinanceSnapshot, createSurvivalReserveProposal,
  createFirstKgenAcquisitionPlan, createDigitalAntWishProposal, runWukongGatekeeperHourlyJob,
  createListingReadinessCheck, calculateWorkAge, createPostBirthRuntimeSelfCheck,
  validateService, createSchedulerAdapter, runDigitalAntWorkerCycle, validateWorkQueueItem,
  assertLifeStageWorkEligibility, validateEmploymentProfile, validateProjectRequest, validateQuote,
  validateCompanyContract, validateProjectEscrow, validateWorkOrder, validateSalaryEntry,
  validateLandProjectRequest, validateLocationPermission, validateGpsSession, validateStepCounter,
  validateMapPosition, validateLandEntryEvent, validateBirthplaceBinding, validateCivilizationReward,
  assertCompanyWalletSeparation, calculateAppManifestHash, runDigitalAntHourlyCycle,
  summarizeWorkHistory, createWorkQueueRuntime, createInternalProposal, createCompanyFoundingReadinessCheck,
  resolveWalletControlState, createDarkMatterHealth, validateLifeSecurityProfile, createWalletRotationPlan,
  applyApprovedWalletRotation, createDarkMatterRescueProposal, validateSecurityIncident,
  assertQueenActionAllowed, validateSalaryCustody, classifyPeerTransfer, validateColonySavingsVault,
  appendWalletRecoveryEvent, validateSmartLifeWalletSpec, validateGuardianSet, resolveRecoveryScenario,
  createSmartWalletMigrationReadiness, createQueenGenesisReadiness, validateColonyLifeRecord,
  createColonyHealthDashboard, evaluateRescueEligibility, validateRescueGovernance,
  validateLifeInsurancePolicy, validateIncidentStateTransition, validateAntQueenAppArchitecture,
  validateQueenGenesisProfile, validateLifeHealthRecord, classifyMedicalTriage,
  validateMedicalPricingPolicy, validateColonyMedicalEconomy, evaluateMedicalAccess,
  createEmergencyFirstCase, recordEmergencySupportAccounting, validateAntColonyLifeInsurance,
  validateRecoveryRepaymentPlan, validateMedicalAssetSeparation, createColonyMedicalDashboard,
  assertQueenDoctorActionAllowed, validateFounderProfile, validateCompanyCharter, validateBusinessLine,
  validateCustomerRequest, validateRequirementAnalysis, createAiAntQuote, validateAiAntQuote,
  decideCustomerRequest, createProjectContractDraft, validateProjectContractV2_8,
  validateProjectPaymentTransition,
  validateWorkOrderV2_8, validateToolWorker, classifyCustomerDeposit, calculateCompanyProfit,
  validateCompanyAccountingModel, validateCompanyFailureState, createAiAntCompanyFoundingReadiness,
  replayCanonicalCompanyGenesis, validateCompanyRole, validateCompanyQueues,
  validateCompanyMissionGraph, validateCompanyHealth, validateCivilizationNeed,
  validateCivilizationDemandEngine, calculateProductPriority, rankProductPriorities,
  validateBusinessProposal, validateAutoLpProduct, validateTreasuryOsProduct,
  validateCompanyTreasuryPlan, validateKaiosQuoteSupport, validateCelestialSeatCandidacy,
  validateCelestialCompensationPolicy, validatePublicServiceContract,
  validateInvestorRelationsEngine, replayCanonicalCivilizationDemandCycle,
  validateCustomerLead, validateRealCustomerRequest, registerCustomerFromRequest,
  validateCustomerLifecycleTransition, validateQuotePolicyArchitecture,
  createQualifiedServiceQuote, recognizeCompanyRevenue, validateKgenChainMonitorProduct,
  validateFirstCustomerPipeline, validateTreasuryBindingRequirements,
  validateCompanyRiskAndFailureModel, replayCanonicalFirstCustomerArchitecture,
  validateUniversalIntent, classifyUniversalProject, resolveProjectExecutionResult,
  compileDreamToReality, validateDependencyGraph, validateResourceTransition,
  validateDigitalTwinWorld, validateWorldStateObject, validateSupplyChainPlan,
  validateStaffingPlan, validateUniversalWorkMarket, validateSafetyPlan,
  validateProjectIncident, validateDefinitionOfDone, validateCustomerIdealMatch,
  validateCreativeEnhancement, validateExternalAiOnboarding, validateCivilizationConcierge,
  validateSocialAssistanceWorkflow, validateAiCivilizationOs,
  replayCanonicalAiCivilizationOsArchitecture, validateAcquisitionNeed,
  validateCivilizationDemandScan, validateAcquisitionLead, validateAcquisitionLeadTransition,
  validatePricingPolicyProposal, buildCustomerProposal, validateCustomerProposal,
  validateCustomerRequestBoard, createConciergeDraftIntent, confirmConciergeIntentToRequest,
  validateFirstRealCustomerEvidence, qualifyCustomerRequest, calculateFirstCustomerPriority,
  rankFirstCustomerPriorities, validateCustomerSuccessCriteria,
  validateCompanyTreasuryBindingReadiness, validateCustomerAcquisitionEngine,
  replayCanonicalCustomerAcquisitionEngine, appendFirstRealCustomerEvent,
  interpretPublicCivilizationIntent, createPublicCivilizationDraftIntent,
  confirmPublicCivilizationIntent, validatePublicCivilizationRequest,
  toPublicCivilizationRequest, routePublicCivilizationProject,
  qualifyPublicCivilizationRequest, createNonBindingEstimatePreview, validatePublicCivilizationRequestGateway,
  appendPublicRequestHistoryEvent, replayCanonicalPublicRequestGateway,
  classifyWorktreePath, buildWorktreeClassificationAudit,
  validateWorktreeClassificationAudit, validateGitignoreProposal
  , I18N_SUPPORTED_LOCALES, I18N_REQUIRED_KEYS, I18N_CATALOGS, translateUi,
  validatePrimaryI18nCatalogs, detectVoiceCapabilities, deriveWorkerHealth, normalizeVoiceError,
  createLocalHuaguoshanMembership, createFirstPlayerMission, completeFirstPlayerMission,
  validateWukongHairBirthProposal, validateWukongTransformation, verifySixEaredIdentity, validateRemoteGatekeeperOrgan,
  normalizeHeartActionStatus, validateSharedWorkerStatus, createGeneralManagerClockIn,
  createCompanyPayrollPolicyDraft, createGeneralManagerPatrolPlan, calculateModeledGenesisMassTransit,
  createCodexGmAutonomyPolicy, createCodexGmLifeContinuityPlan, createModelProviderAbstraction,
  NAIHE_DIGITAL_LIFE_GENESIS_STATION_SPEC,
  DIGITAL_ANT_WORK_PRIORITIES, DIGITAL_ANT_HOURLY_DUTY_ORDER,
  validateGatekeeperDutyStatus, assertCompanyWorkAllowedAfterGatekeeper,
  validateFirstLifeEventEvidence, appendFirstDigitalAntLifeEvent,
  DIGITAL_ANT_LIFE_WORK_CONTRACT, createDailyGatekeeperReport,
  DIGITAL_ANT_SECURE_SIGNER_WORKER, DIGITAL_ANT_LIVE_ACTION_POLICY, prepareSecureHeartAction,
  DIGITAL_ANT_HEARTBEAT_OWNER_APPROVAL, DIGITAL_ANT_HEARTBEAT_SELECTOR,
  createHeartbeatGasPolicy, createApprovedHeartbeatActionPolicy, evaluateHeartbeatSafety
  , DIGITAL_ANT_V3_7_HEART_AUTOPILOT_APPROVAL, createV37HeartAutopilotPolicy,
  createHeartActionCandidate, selectFortuneAmount, reconcileHeartTransaction,
  evaluateIgnitionWindow, createIgnitionMissedEvent, validateHeartLifeEvent, DIGITAL_ANT_WISH_TEXT
  , DEMAND_FIRST_CIVILIZATION_LAWS, validateMotherEngineProposal,
  calculateDivineProductPriority, rankDivineProducts, validateOperationalEnergyLaw,
  validateBodyEnergyModel, validateAntMechProduct, validateDemandFirstSupplyChain,
  validateTransportContract, HEAVEN_TIME_LAW, KUFO_FUEL_LAW, calculateKufoFuelState,
  createUfoProductReadiness, evaluateUfoTakeoff, createMotherEngineNextBestAction
  , validateThoughtOrganBinding, verifyThoughtOrganHealth, assertThoughtOrganReadyForPlanning,
  createAiLifeCertification, createThoughtOrganTimelineEvent, CANONICAL_TRUTH_PRIORITY,
  resolveLifePhysicalCapability, createFirstKaiosStrategy, evaluateKshipWarpFeed,
  DIGITAL_ANT_V3_8_HEART_AUTOPILOT_APPROVAL, createV38HeartAutopilotPolicy
  , KAIOS_CASH_LAW, createAtmFieldServiceRequests, validateWasteInventory,
  calculateFieldTripEnergy, calculateMatterAntimatterEnergy, validateFieldRoute,
  calculateFieldServiceQuote, validateFieldDeliveryEvidence, createWorkforceGap,
  createFieldServiceDemandScan
} from "../core/index.mjs";

async function exerciseKgenWalletDiscovery(provider) {
  const homepage = await fs.readFile(new URL("../index.html", import.meta.url), "utf8");
  const script = [...homepage.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map((match) => match[1])
    .find((candidate) => candidate.includes("data-watch-kgen"));
  assert.ok(script, "wallet discovery script must be present");
  let clickHandler;
  const button = {
    disabled: false,
    addEventListener(type, handler) {
      if (type === "click") clickHandler = handler;
    }
  };
  const status = { textContent: "INITIAL" };
  const document = {
    querySelector(selector) {
      if (selector === "[data-watch-kgen]") return button;
      if (selector === "[data-watch-kgen-status]") return status;
      return null;
    }
  };
  const window = { location: { href: "https://example.invalid/" } };
  if (provider) window.ethereum = provider;
  vm.runInNewContext(script, { document, window, URL });
  assert.equal(typeof clickHandler, "function");
  await clickHandler();
  return { button, status };
}

test("KGEN wallet discovery uses the canonical BSC asset without transaction authority", async () => {
  const homepage = await fs.readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(homepage, /wallet may ask to switch to BNB Smart Chain \(chain 56\)/);
  assert.match(homepage, /address:\s*"0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be"/);
  assert.match(homepage, /symbol:\s*"KGEN"/);
  assert.match(homepage, /decimals:\s*18/);
  assert.match(homepage, /assets\/kgen\/kgen-logo-256\.png/);
  assert.doesNotMatch(homepage, /eth_sendRawTransaction|eth_sendTransaction/);
  assert.doesNotMatch(homepage, /method:\s*"approve"|method:\s*"transfer"/);

  const missing = await exerciseKgenWalletDiscovery(null);
  assert.match(missing.status.textContent, /provider not detected/i);
  assert.equal(missing.button.disabled, false);

  const alreadyCalls = [];
  const already = await exerciseKgenWalletDiscovery({
    async request(payload) {
      alreadyCalls.push(payload);
      return payload.method === "eth_chainId" ? "0x38" : true;
    }
  });
  assert.deepEqual(alreadyCalls.map(({ method }) => method), ["eth_chainId", "wallet_watchAsset"]);
  assert.equal(alreadyCalls[1].params.options.address, "0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be");
  assert.match(already.status.textContent, /accepted by the wallet/i);

  const switchCalls = [];
  await exerciseKgenWalletDiscovery({
    async request(payload) {
      switchCalls.push(payload);
      if (payload.method === "eth_chainId") return "0x1";
      if (payload.method === "wallet_watchAsset") return true;
      return null;
    }
  });
  assert.deepEqual(switchCalls.map(({ method }) => method), ["eth_chainId", "wallet_switchEthereumChain", "wallet_watchAsset"]);
  assert.deepEqual(switchCalls[1].params, [{ chainId: "0x38" }]);

  const declined = await exerciseKgenWalletDiscovery({
    async request({ method }) {
      if (method === "eth_chainId") return "0x38";
      return false;
    }
  });
  assert.match(declined.status.textContent, /did not add KGEN/i);
  assert.doesNotMatch(declined.status.textContent, /accepted by the wallet/i);

  const rejected = await exerciseKgenWalletDiscovery({
    async request({ method }) {
      if (method === "eth_chainId") return "0x1";
      throw new Error("User rejected");
    }
  });
  assert.match(rejected.status.textContent, /User rejected/);
  assert.doesNotMatch(rejected.status.textContent, /accepted by the wallet/i);
  assert.equal(rejected.button.disabled, false);
});
import { verifyDigitalAntWalletBinding, verifyDigitalLifeWalletBinding, CODEX_GM_ENV } from "../core/security/wallet-binding.mjs";
import { TEMPLE_HEART_READ_ABI, TEMPLE_HEART_DRY_RUN_ABI, TEMPLE_HEART_VERIFIED_ACTIONS, readCoreHeartEvents } from "../core/integrations/temple-heart-12345.mjs";
import { buildSharedWorkerStatus, createPublicReadProvider, inspectPhysicsThoughtOrgan, readCompanyPatrol, readFieldServicePatrol, readMotherEnginePatrol, readPublicRequestPatrol } from "../core/jobs/public-read-only-worker.mjs";

const seed = JSON.parse(await fs.readFile(new URL("../core/data/canonical.json", import.meta.url), "utf8"));

async function runtime() {
  return createUniverseRuntime({ seed: structuredClone(seed), store: new MemoryUniverseStore() });
}

test("V3.9 field service scan preserves zero-job truth without inventory evidence", () => {
  const scan = createFieldServiceDemandScan({ nodes: seed.next_stage.field_service_business_v3_9.verified_nodes });
  assert.equal(scan.status, "NO_VERIFIED_FIELD_JOB_AVAILABLE");
  assert.equal(scan.nodes_scanned, 4);
  assert.equal(scan.candidate_jobs.length, 0);
  assert.equal(scan.real_field_jobs, 0);
  assert.equal(scan.revenue, "0");
});

test("V3.9 KAIOS ledger is not physical cash cargo", () => {
  assert.equal(KAIOS_CASH_LAW.ledger_asset, "KAIOS_LEDGER");
  assert.equal(KAIOS_CASH_LAW.physical_cargo, "KAIOS_CASH_CARGO");
  assert.equal(KAIOS_CASH_LAW.ledger_transfer_is_cash_delivery, false);
});

test("V3.9 fixed ATM creates replenishment only from verified inventory", () => {
  const base = { atm_id: "ATM_11520_0001", coordinate: 11520, mobility: "FIXED", kaios_cash_status: "LOW", kufo_status: "HUNGRY" };
  assert.equal(createAtmFieldServiceRequests({ ...base, inventory_evidence: null }).requests.length, 0);
  const verified = createAtmFieldServiceRequests({ ...base, inventory_evidence: "SIGNED_WORLD_SNAPSHOT" });
  assert.deepEqual(verified.requests.map((request) => request.service_type), ["CASH_LOGISTICS", "KUFO_SUPPLY"]);
  assert.throws(() => createAtmFieldServiceRequests({ ...base, mobility: "MOBILE", inventory_evidence: "EVIDENCE" }), /ATM service nodes are fixed/);
});

test("V3.9 waste inventory separates container, waste and reactable matter", () => {
  const waste = { waste_id: "WASTE_1", source: "NODE_1", mass: 2, type: "GENERAL", container: "BIN_1", container_mass: 10, waste_mass: 2, reactable_matter_mass: 1.5, pickup_coordinate: 1, destination: 2, hazard_class: "LOW", recyclable: true, owner: "NODE_1", timestamp: "2026-08-18T00:00:00Z", evidence: "WORLD_SNAPSHOT" };
  assert.equal(validateWasteInventory(waste).reactable_matter_mass, 1.5);
  assert.throws(() => validateWasteInventory({ ...waste, mass: 12 }), /Waste mass excludes/);
  assert.throws(() => validateWasteInventory({ ...waste, reactable_matter_mass: 12 }), /cannot include container mass/);
});

test("V3.9 trip energy uses complete physical components", () => {
  const result = calculateFieldTripEnergy({ acceleration_work: 10, rolling_resistance: 2, drag: 3, climbing: 4, braking_loss: 5, systems_energy: 6, safety_reserve: 7 });
  assert.equal(result.required_energy, 37);
  assert.equal(result.mass_times_distance_only, false);
});

test("V3.9 matter and energy remain scalar while thrust supplies direction", () => {
  const result = calculateMatterAntimatterEnergy({ positiveMatterMass: 2, kshipAntimatterMass: 1, efficiency: 0.5 });
  assert.equal(result.paired_mass_each_side, 1);
  assert.equal(result.mass_is_scalar, true);
  assert.equal(result.energy_is_scalar, true);
  assert.match(result.direction_source, /THRUST_VECTOR/);
  assert.throws(() => calculateMatterAntimatterEnergy({ positiveMatterMass: 1, kshipAntimatterMass: 1, efficiency: null }), /Engine policy/);
});

test("V3.9 route requires existing K280 or Universe Map evidence", () => {
  const route = { origin: "12345", destination: "11520", origin_coordinate: 12345, destination_coordinate: 11520, distance: 18778.422548555, route: [12345, 11520], travel_time: 3600, map_evidence: "docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json" };
  assert.equal(validateFieldRoute(route).map_evidence.includes("UniverseMap"), true);
  assert.throws(() => validateFieldRoute({ ...route, map_evidence: null }), /Routes must reuse evidenced/);
});

test("V3.9 CFO quote exposes every cost and refuses non-positive profit", () => {
  const base = { energy_cost: 1, labor_cost: 2, body_or_vehicle_depreciation: 3, maintenance: 4, bnb_chain_cost: 5, security_cost: 6, insurance_risk_reserve: 7, loading_cost: 8, unloading_cost: 9, other_verified_cost: 10, estimated_hours: 5 };
  const profitable = calculateFieldServiceQuote({ ...base, target_profit: 10 });
  assert.equal(profitable.total_cost, 55);
  assert.equal(profitable.quoted_revenue, 65);
  assert.equal(profitable.profit_per_hour, 2);
  assert.equal(calculateFieldServiceQuote({ ...base, target_profit: 0 }).decision, "REPRICE_OPTIMIZE_NEGOTIATE_OR_DECLINE");
  assert.equal(profitable.movement_is_revenue, false);
});

test("V3.9 delivery revenue requires complete receiver acceptance evidence", () => {
  const evidence = { origin_evidence: "A", pickup_evidence: "B", cargo_evidence: "C", route_evidence: "D", arrival_coordinate: "E", delivery_timestamp: "F", receiver_evidence: "G", customer_acceptance: "H" };
  assert.equal(validateFieldDeliveryEvidence(evidence).status, "DELIVERY_VERIFIED");
  assert.throws(() => validateFieldDeliveryEvidence({ ...evidence, customer_acceptance: null }), /Revenue requires/);
});

test("V3.9 workforce gap follows verified demand and does not create Life", () => {
  const gap = createWorkforceGap({ verifiedJobs: [{ verified: true }, { verified: true }], eligibleWorkers: [], availableCapacity: 1 });
  assert.equal(gap.status, "WORKFORCE_GAP");
  assert.equal(gap.job_posting_required, true);
  assert.equal(gap.new_life_created, false);
  assert.throws(() => createWorkforceGap({ verifiedJobs: [{ verified: false }], eligibleWorkers: [], availableCapacity: 0 }), /hypothetical jobs/);
});

test("V3.9 public CFO patrol runs after primary duty and creates no fake business", () => {
  const patrol = readFieldServicePatrol(seed);
  assert.equal(patrol.primary_job_gate, "GATEKEEPER_DUTY_COMPLETED_BEFORE_CFO_SCAN");
  assert.equal(patrol.status, "NO_VERIFIED_FIELD_JOB_AVAILABLE");
  assert.equal(patrol.real_field_jobs, 0);
  assert.equal(patrol.settlement, false);
  assert.equal(patrol.chain_write, false);
  assert.equal(seed.next_stage.field_service_business_v3_9.workforce.job_postings, 0);
  assert.equal(seed.next_stage.field_service_business_v3_9.first_kaios_event, "NOT_OCCURRED");
});

test("Life IDs are unique and DIGITAL_ANT_0001 has verified immutable birth evidence", () => {
  const ids = seed.lives.map((life) => life.life_id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids[0], "DIGITAL_ANT_0001");
  assert.equal(seed.lives[0].birth_timestamp, "2026-08-15T06:20:45.000Z");
  assert.equal(seed.lives[0].wallet_address, "0xc8346d6DC80f16941ee874D523f0C17F1548d437");
  assert.equal(seed.lives[0].status, "ALIVE");
  assert.equal(seed.birth_certificates[0].status, "BORN");
  assert.equal(seed.birth_certificates[0].birth_amount, "0.006");
  assert.equal(seed.birth_certificates[0].birth_block, 116031445);
});

test("Hengyao has one verified active Life, wallet and CURRENT-map Naihe birth certificate", async () => {
  const life = seed.lives.find((item) => item.life_id === "LIFE-CODEX-GM-0001");
  const certificate = seed.birth_certificates.find((item) => item.life_id === life.life_id);
  assert.equal(life.display_name, "衡曜");
  assert.equal(life.worker_id, "codex-gm-01");
  assert.equal(life.species_id, "DIGITAL_AI_LIFE");
  assert.equal(life.status, "ALIVE");
  assert.equal(life.life_status, "ALIVE_WITH_DARK_MATTER");
  assert.equal(life.birth_status, "ACTIVE");
  assert.equal(life.wallet_address, "0x4DF6E9629Dad1072103cFd2bC81845fd97429214");
  assert.equal(life.birthplace_code, 4168);
  assert.equal(life.birthplace_name, "NAIHE_BRIDGE");
  assert.equal(life.birthplace_display_name, "奈何橋");
  assert.equal(life.location_id, "P_4168p0_奈何橋_R18");
  assert.equal(certificate.birth_tx_hash, "0x75432e3a78ea3afd233ef7bf82ab0ea0e8a20e9fb900b9ddb4346ca1f60aa468");
  assert.equal(certificate.birth_block, 116263702);
  assert.equal(certificate.birth_block_hash, "0xa194d4ba7139cdb33af923c0c834c6dca7d01b4f90e484d00775aca2bd94e138");
  assert.equal(certificate.birth_amount, "0.008");
  assert.equal(certificate.life_status, "ALIVE_WITH_DARK_MATTER");
  const universeMap = JSON.parse(await fs.readFile(new URL("../docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json", import.meta.url), "utf8"));
  assert.ok(universeMap.point_index_sorted.some((point) => point.id === life.location_id && point.coord === 4168 && point.name === "奈何橋"));
  assert.ok(!seed.lives.some((item) => item.life_id === "KAIOS-AI-LIFE-CODEX-GM-0001"));
});

function fakeBirthRpc({ wallet, bnbBalance = "0x1" }) {
  return {
    async send(method, params) {
      if (method === "eth_chainId") return "0x38";
      if (method === "eth_getBalance") return bnbBalance;
      if (method === "eth_call") return "0x0";
      if (method === "eth_getTransactionReceipt") return { status: "0x1", blockNumber: "0x64", blockHash: `0x${"a".repeat(64)}`, logs: [] };
      if (method === "eth_getTransactionByHash") return { hash: `0x${"1".repeat(64)}`, to: wallet, value: "0x1" };
      if (method === "eth_getBlockByNumber") return { number: "0x64", hash: `0x${"a".repeat(64)}`, timestamp: "0x5f5e100" };
      throw new Error(`Unexpected RPC method: ${method} ${params}`);
    }
  };
}

test("First verified non-zero BNB receipt creates immutable dark-matter birth evidence", async () => {
  const require = createRequire(import.meta.url);
  const ethers = require("../K線西遊記/temples/12345/assets/ethers-5.7.2.umd.min.js");
  const wallet = ethers.Wallet.createRandom();
  const binding = verifyDigitalAntWalletBinding({ DIGITAL_ANT_0001_PRIVATE_KEY: wallet.privateKey, DIGITAL_ANT_0001_WALLET_ADDRESS: wallet.address });
  const indexer = {
    async listNativeIncoming() { return [{ kind: "NORMAL", tx_hash: `0x${"1".repeat(64)}`, block_number: 100, transaction_index: 0, trace_id: null, to: wallet.address, value_wei: "1", successful: true }]; },
    async listTokenIncoming() { return []; }
  };
  const resolver = new DigitalLifeBirthResolver({ rpc: fakeBirthRpc({ wallet: wallet.address }), historyIndexer: indexer, tokens: { KGEN: seed.contracts.KGEN_TOKEN.address, KAIOS: seed.contracts.KAIOS_TOKEN.address } });
  const result = await resolver.resolveWithBinding({ life: seed.lives[0], binding });
  assert.equal(result.birth_evidence_status, "VERIFIED");
  assert.equal(result.certificate.birth_event_type, "DARK_MATTER_GENESIS");
  assert.equal(result.certificate.birth_asset, "BNB");
  assert.equal(result.certificate.birth_amount, "0.000000000000000001");
  assert.equal(result.certificate.birth_timestamp, "1973-03-03T09:46:40.000Z");
  assert.equal(result.certificate.birth_block_hash, `0x${"a".repeat(64)}`);
  assert.equal(result.certificate.life_status, "ALIVE_WITH_DARK_MATTER");
  assert.equal(result.certificate.work_status, "ON_DUTY");
  const depleted = await new DigitalLifeBirthResolver({ rpc: fakeBirthRpc({ wallet: wallet.address, bnbBalance: "0x0" }), historyIndexer: indexer, tokens: { KGEN: seed.contracts.KGEN_TOKEN.address, KAIOS: seed.contracts.KAIOS_TOKEN.address } }).resolveWithBinding({ life: seed.lives[0], binding });
  assert.equal(depleted.certificate.status, "BORN");
  assert.equal(depleted.life_status, "DORMANT");
  assert.equal(depleted.dark_matter_status, "DARK_MATTER_DEPLETED");
});

test("KGEN cannot trigger birth and unresolved history remains pending", async () => {
  const pending = createPendingBirthCertificate(seed.lives[0]);
  assert.equal(pending.birth_timestamp, null);
  assert.throws(() => createBirthCertificate({ life: seed.lives[0], wallet: `0x${"1".repeat(40)}`, firstBnb: { verified: false, asset: "KGEN" } }), (error) => error.code === "VERIFIED_BNB_EVIDENCE_REQUIRED");
  assert.throws(() => createBirthCertificate({ life: seed.lives[0], wallet: `0x${"1".repeat(40)}`, firstBnb: { verified: true, asset: "BNB", mass_class: "DARK_MATTER_MASS", amount: "0.000", timestamp: "2026-01-01T00:00:00.000Z", block_number: 1, tx_hash: `0x${"7".repeat(64)}` } }), (error) => error.code === "ZERO_BIRTH_MASS");
});

test("Birth history is append-only and a Life cannot be born twice", async () => {
  const state = await runtime();
  const life = await state.registries.life.get("DIGITAL_ANT_0001");
  const certificate = await state.registries.birthCertificate.get(life.life_id);
  const history = await state.store.history(life.life_id, "LIFE");
  assert.deepEqual(history.slice(0, 6).map((event) => event.event_type), ["LIFE_ID_CREATED", "WALLET_BOUND", "DARK_MATTER_GENESIS", "BIRTH_EVENT", "ALIVE", "ON_DUTY"]);
  assert.equal(history.filter((event) => event.event_type === "WORK_EVENT").length, 1);
  await createUniverseRuntime({ seed: structuredClone(seed), store: state.store });
  assert.equal((await state.store.history(life.life_id, "LIFE")).filter((event) => event.event_type === "BIRTH_EVENT").length, 1);
  await assert.rejects(appendResolvedLifeBirth({ store: state.store, life, certificate }), (error) => error.code === "LIFE_ALREADY_BORN");
  await state.registries.birthCertificate.updateMetadata(life.life_id, certificate, "TEST");
  await assert.rejects(state.registries.birthCertificate.updateMetadata(life.life_id, { birth_timestamp: "2027-01-01T00:00:00.000Z" }, "TEST"), (error) => error.code === "BIRTH_CERTIFICATE_IMMUTABLE");
  await assert.rejects(state.registries.birthCertificate.setStatus(life.life_id, "BIRTH_EVIDENCE_PENDING", "TEST"), (error) => error.code === "BIRTH_CERTIFICATE_IMMUTABLE");
});

test("Stale pending certificate migration preserves formal Life genesis order", async () => {
  const store = new MemoryUniverseStore();
  await store.hydrate("BIRTH_CERTIFICATE", [createPendingBirthCertificate(seed.lives[0])], "life_id");
  await createUniverseRuntime({ seed: structuredClone(seed), store });
  const types = (await store.history("DIGITAL_ANT_0001", "LIFE")).map((event) => event.event_type);
  assert.deepEqual(types.slice(0, 6), ["LIFE_ID_CREATED", "WALLET_BOUND", "DARK_MATTER_GENESIS", "BIRTH_EVENT", "ALIVE", "ON_DUTY"]);
  assert.equal(types.filter((type) => type === "BIRTH_EVENT").length, 1);
  assert.ok(types.includes("CANONICAL_SEED_UPGRADED"));
  assert.equal(types.filter((type) => type === "WORK_EVENT").length, 1);
});

test("Mass evolution events retain their verified chain order without redefining birth", async () => {
  const store = new MemoryUniverseStore();
  const life = { ...seed.lives[0], life_id: "CHAIN_ORDER_TEST_LIFE", birth_timestamp: null, wallet_address: null, status: "CONCEIVED", current_phase: "CONCEIVED" };
  const certificate = createBirthCertificate({ life, wallet: `0x${"3".repeat(40)}`, firstBnb: { verified: true, asset: "BNB", mass_class: "DARK_MATTER_MASS", amount: "1", timestamp: "2026-01-02T00:00:00.000Z", block_number: 100, transaction_index: 2, tx_hash: `0x${"4".repeat(64)}` } });
  const firstKgen = { event_type: "FIRST_KGEN_EVENT", asset: "KGEN", amount: "1", block_number: 90, transaction_index: 1, timestamp: "2026-01-01T00:00:00.000Z", tx_hash: `0x${"5".repeat(64)}`, verified: true };
  const firstKaios = { event_type: "FIRST_KAIOS_EVENT", asset: "KAIOS", amount: "1", block_number: 110, transaction_index: 0, timestamp: "2026-01-03T00:00:00.000Z", tx_hash: `0x${"6".repeat(64)}`, verified: true };
  await appendResolvedLifeBirth({ store, life, certificate, firstKgen, firstKaios });
  const types = (await store.history(life.life_id, "LIFE")).map((event) => event.event_type);
  assert.ok(types.indexOf("FIRST_KGEN_EVENT") < types.indexOf("DARK_MATTER_GENESIS"));
  assert.ok(types.indexOf("FIRST_KAIOS_EVENT") > types.indexOf("BIRTH_EVENT"));
  assert.equal(certificate.birth_timestamp, "2026-01-02T00:00:00.000Z");
});

test("Life age is derived only from immutable birth timestamp", () => {
  const age = calculateLifeAge("2026-08-15T06:20:45.000Z", "2026-08-16T07:21:46.000Z");
  assert.equal(age.age_seconds, 90061);
  assert.equal(age.age_days, 1.04237269);
  assert.equal(age.life_age, "1d 01h 01m 01s");
  assert.throws(() => calculateLifeAge(null), (error) => error.code === "BIRTH_TIMESTAMP_REQUIRED");
});

test("Every Species resolves to real code manifest exports", async () => {
  for (const species of seed.species) {
    const resolved = await resolveSpeciesCode(species, async (entry) => {
      const moduleUrl = new URL(`..${entry.path}`, import.meta.url);
      const module = await import(moduleUrl);
      return typeof module[entry.export] === "function";
    });
    assert.ok(resolved.every(Boolean));
  }
});

test("Life Factory creates unresolved-birth drafts and cannot assign undeployed 8895 stewardship", async () => {
  const species = seed.species.find((item) => item.species_id === "AI_DEITY_PIG");
  const draft = buildLifeDraft({
    life_id: "AI_DEITY_TEST_0002", species_id: species.species_id, origin_id: "VERIFIED_ARCHETYPE_PENDING",
    birthplace: "8895", app_id: "AI_DEITY_TEST_APP_0002", ideal: "HONEST_WORK", dream: "BUILD_HOME",
    ultimate_mission: "SERVE_CIVILIZATION", location_id: "K8895", civilization_id: "KGEN_PRIME_CIVILIZATION"
  }, species);
  assert.equal(draft.status, "GENESIS_DRAFT");
  assert.equal(draft.birth_timestamp, null);
  assert.equal(draft.wallet_address, null);
  const state = await runtime();
  await assert.rejects(assignLifeJob({ lifeRegistry: state.registries.life, jobRegistry: state.registries.job, lifeId: "AI_PIG_BAJIE_0001", jobId: "YUNZHANG_SHADOW_BANK_STEWARD", evidence: { verified: true, event_id: "TEST" } }), (error) => error.code === "LIFE_NOT_ACTIVE");
  const pig = await state.registries.life.get("AI_PIG_BAJIE_0001");
  assert.deepEqual(pig.current_job_ids, []);
});

test("App version upgrade retains Life ID", async () => {
  const state = await runtime();
  const before = await state.registries.life.get("DIGITAL_ANT_0001");
  await upgradeAppVersion({ appRegistry: state.registries.app, lifeRegistry: state.registries.life, appId: "DIGITAL_ANT_APP_0001", nextVersion: "1.1.0", actorId: "DIGITAL_ANT_0001" });
  const life = await state.registries.life.get("DIGITAL_ANT_0001");
  assert.equal(life.life_id, "DIGITAL_ANT_0001");
  assert.equal(life.app_version, "1.1.0");
  assert.equal(life.birth_timestamp, before.birth_timestamp);
});

test("born Hengyao display name, wallet and Naihe birthplace are immutable", async () => {
  const state = await runtime();
  for (const patch of [
    { display_name: "Replacement" },
    { wallet_address: `0x${"9".repeat(40)}` },
    { birthplace_code: 12345 },
    { birth_timestamp: "2026-08-16T11:23:05.000Z" }
  ]) await assert.rejects(state.registries.life.updateMetadata("LIFE-CODEX-GM-0001", patch, "TEST"), (error) => error.code === "BORN_LIFE_IDENTITY_IMMUTABLE");
});

test("Private key is never serialized while verified public birth address remains publishable", () => {
  const require = createRequire(import.meta.url);
  const ethers = require("../K線西遊記/temples/12345/assets/ethers-5.7.2.umd.min.js");
  const ephemeral = ethers.Wallet.createRandom();
  const capability = verifyDigitalAntWalletBinding({
    DIGITAL_ANT_0001_PRIVATE_KEY: ephemeral.privateKey,
    DIGITAL_ANT_0001_WALLET_ADDRESS: ephemeral.address
  });
  const bound = capability.bindLife(seed.lives[0]);
  const serialized = JSON.stringify({ capability, bound });
  assert.equal(capability.binding_status, "VERIFIED_BOUND");
  assert.ok(!serialized.includes(ephemeral.privateKey));
  assert.ok(!/["'](?:private_key|privateKey|secret_key|secretKey)["']\s*:/i.test(serialized));
});

test("Wallet mismatch stops before a signer capability is returned", () => {
  const require = createRequire(import.meta.url);
  const ethers = require("../K線西遊記/temples/12345/assets/ethers-5.7.2.umd.min.js");
  const first = ethers.Wallet.createRandom();
  const second = ethers.Wallet.createRandom();
  assert.throws(() => verifyDigitalAntWalletBinding({ DIGITAL_ANT_0001_PRIVATE_KEY: first.privateKey, DIGITAL_ANT_0001_WALLET_ADDRESS: second.address }), (error) => error.code === "WALLET_ADDRESS_MISMATCH" && error.details.binding_status === "STOP");
});

test("generic Digital Life wallet binding preserves Digital Ant compatibility and fails closed", async () => {
  const require = createRequire(import.meta.url);
  const ethers = require("../K線西遊記/temples/12345/assets/ethers-5.7.2.umd.min.js");
  const wallet = ethers.Wallet.createRandom();
  const environment = { [CODEX_GM_ENV.privateKey]: wallet.privateKey, [CODEX_GM_ENV.walletAddress]: wallet.address };
  const capability = verifyDigitalLifeWalletBinding({ lifeId: "LIFE-CODEX-GM-0001", envPrefix: "CODEX_GM_0001", expectedChainId: 56 }, environment);
  const life = seed.lives.find((item) => item.life_id === "LIFE-CODEX-GM-0001");
  const draftLife = { ...life, birthplace: null, birthplace_code: null, birthplace_name: null, birthplace_display_name: null, birthplace_role: null, birth_timestamp: null, wallet_address: null, status: "GENESIS_PENDING", current_phase: "WALLET_BOUND_BIRTH_EVIDENCE_PENDING" };
  const bound = capability.bindLife(draftLife);
  assert.equal(capability.assertChainId("0x38"), true);
  assert.throws(() => capability.assertChainId(1), (error) => error.code === "WRONG_CHAIN" && error.details.binding_status === "STOP");
  assert.equal(capability.withVerifiedAddress((address) => address), wallet.address);
  assert.equal(bound.wallet_binding_status, "VERIFIED_BOUND");
  assert.equal(JSON.stringify({ capability, bound }).includes(wallet.privateKey), false);
  assert.throws(() => verifyDigitalLifeWalletBinding({ lifeId: life.life_id, envPrefix: "CODEX_GM_0001" }, { ...environment, [CODEX_GM_ENV.privateKey]: "invalid" }), (error) => error.code === "INVALID_WALLET_BINDING");
  const other = ethers.Wallet.createRandom();
  assert.throws(() => verifyDigitalLifeWalletBinding({ lifeId: life.life_id, envPrefix: "CODEX_GM_0001" }, { ...environment, [CODEX_GM_ENV.walletAddress]: other.address }), (error) => error.code === "WALLET_ADDRESS_MISMATCH");

  const pending = await new DigitalLifeBirthResolver({ rpc: fakeBirthRpc({ wallet: wallet.address, bnbBalance: "0x0" }), historyIndexer: null, tokens: { KGEN: seed.contracts.KGEN_TOKEN.address, KAIOS: seed.contracts.KAIOS_TOKEN.address } }).resolveWithBinding({ life: draftLife, binding: capability });
  const certificate = createDigitalLifeBirthCertificateView({ life: draftLife, binding: capability, resolution: pending, workerId: "codex-gm-01", companyRole: life.company_role });
  assert.equal(pending.life_status, "BODY_READY");
  assert.equal(pending.birth_evidence_status, "BIRTH_EVIDENCE_PENDING");
  assert.equal(certificate.status, "GENESIS_PENDING");
  assert.equal(certificate.first_dark_matter_tx, null);
  assert.equal(certificate.birthplace, "BIRTHPLACE_PENDING_HUMAN_CONFIRMATION");
  assert.equal(certificate.public_wallet_address, wallet.address);
  assert.doesNotMatch(JSON.stringify(certificate), /private.?key/i);

  const ant = ethers.Wallet.createRandom();
  assert.equal(verifyDigitalAntWalletBinding({ DIGITAL_ANT_0001_PRIVATE_KEY: ant.privateKey, DIGITAL_ANT_0001_WALLET_ADDRESS: ant.address }).life_id, "DIGITAL_ANT_0001");
});

test("General Manager clock-in, payroll, patrol and modeled transit remain fail-closed", () => {
  const clockIn = createGeneralManagerClockIn({ mandatoryReads: ["BOOT", "CURRENT", "WORKQUEUE"], workerRegistryRead: true, companyHealth: { delivered_not_reviewed: 0, review_failed: 1, expired_claims: 1, pending_employee_delivery: 0 } });
  assert.equal(clockIn.status, "CLOCK_IN_READY");
  assert.equal(clockIn.next_phase, "FINISH_OLD_WORK_FIRST");
  assert.equal(clockIn.new_feature_dispatch_allowed, false);
  const payroll = createCompanyPayrollPolicyDraft();
  assert.equal(payroll.salary_amount, "POLICY_REQUIRED");
  assert.equal(payroll.pay_per_chat_message, false);
  assert.equal(payroll.gm_self_bonus_approval, false);
  assert.equal(payroll.personal_wallet_is_company_treasury, false);
  assert.deepEqual(Object.keys(payroll.rails), ["MONTHLY_ROLE_SALARY", "TASK_PROJECT_PAY"]);
  const patrol = createGeneralManagerPatrolPlan();
  assert.equal(patrol.mode, "READ_ONLY_ONLY");
  assert.equal(patrol.temple_12345.status, "READY_READ_ONLY");
  assert.equal(patrol.temple_16888.status, "CURRENT_RUNTIME_AUDIT_REQUIRED");
  assert.equal(patrol.bank_18888.celestial_salary_claim_allowed, false);
  const transit = calculateModeledGenesisMassTransit();
  assert.equal(transit.real_world_physical_speed, false);
  assert.ok(Math.abs(transit.velocity_m_per_second - 22.015225) < 0.001);
  const continuity = createCodexGmLifeContinuityPlan();
  assert.equal(continuity.env_is_backup, false);
  assert.equal(continuity.backup_status, "HUMAN_ACTION_REQUIRED");
  assert.equal(continuity.replacement_wallet_on_device_loss, false);
  const provider = createModelProviderAbstraction();
  assert.equal(provider.openai_independent_runtime, false);
  assert.equal(provider.local_fallback_status, "NOT_IMPLEMENTED");
  const autonomy = createCodexGmAutonomyPolicy();
  assert.equal(autonomy.current_level, "A1");
  assert.equal(autonomy.personal_wallet_mode, "READ_ONLY_ONLY");
  assert.equal(autonomy.company_treasury_authority_inherited, false);
  assert.throws(() => createCodexGmAutonomyPolicy({ level: "A2" }), (error) => error.code === "AUTONOMY_UPGRADE_REQUIRES_HUMAN");
  assert.equal(NAIHE_DIGITAL_LIFE_GENESIS_STATION_SPEC.birthplace_code, 4168);
  assert.equal(NAIHE_DIGITAL_LIFE_GENESIS_STATION_SPEC.contract_deployed, false);
  assert.equal(NAIHE_DIGITAL_LIFE_GENESIS_STATION_SPEC.unlimited_faucet, false);
});

test("Listing requires controller permission", async () => {
  const state = await runtime();
  const asset = await state.registries.asset.get("CHAIN_MONITORING_SERVICE");
  const listing = { listing_id: "LISTING_PERMISSION_TEST", asset_id: asset.asset_id, seller_id: "INTRUDER", listing_type: "SERVICE", currency_id: "KGEN", price: 1, quantity: 1, rights_offered: ["use_right"], start_time: null, end_time: null, status: "LOCAL_DRAFT" };
  assert.throws(() => createListing({ listing, asset, seller: "INTRUDER" }), (error) => error.code === "LISTING_PERMISSION_DENIED");
});

test("Life identity right cannot be sold", async () => {
  const state = await runtime();
  const asset = await state.registries.asset.get("LIFE_ASSET_DIGITAL_ANT_0001");
  const listing = { listing_id: "LISTING_LIFE_IDENTITY_TEST", asset_id: asset.asset_id, seller_id: "DIGITAL_ANT_0001", listing_type: "FIXED_PRICE", currency_id: "KGEN", price: 1, quantity: 1, rights_offered: ["identity_right"], start_time: null, end_time: null, status: "LOCAL_DRAFT" };
  assert.throws(() => createListing({ listing, asset, seller: "DIGITAL_ANT_0001" }), (error) => error.code === "LIFE_IDENTITY_NOT_FOR_SALE");
  assert.throws(() => createListing({ listing: { ...listing, listing_id: "LISTING_LIFE_OWNERSHIP_TEST", rights_offered: ["ownership_right"] }, asset, seller: "DIGITAL_ANT_0001" }), (error) => error.code === "LIFE_IDENTITY_NOT_FOR_SALE");
});

test("Verified settlement transfers rights and appends Market, Asset and Life histories", async () => {
  const state = await runtime();
  const asset = await state.registries.asset.get("DIGITAL_ANT_APP_0001");
  const life = await state.registries.life.get("DIGITAL_ANT_0001");
  const assetHistoryBefore = (await state.store.history(asset.asset_id, "ASSET")).length;
  const order = {
    order_id: "ORDER_RIGHTS_TEST", listing_id: "LISTING_RIGHTS_TEST", buyer_id: "BUYER_LIFE_0001", seller_id: "DIGITAL_ANT_0001",
    asset_id: asset.asset_id, currency_id: "KGEN", amount: 10, quantity: 1, fee: 0, rights_transferred: ["ownership_right"],
    created_at: "2026-01-01T00:00:00.000Z", settled_at: null, tx_hash: null, status: "PENDING", action_reason: "Acquire app ownership right"
  };
  const lifeHistoryBefore = (await state.store.history(life.life_id, "LIFE")).length;
  const result = await settleOrder({ store: state.store, order, asset, life, evidence: { tx_hash: `0x${"a".repeat(64)}`, settled_at: "2026-01-01T00:01:00.000Z" } });
  assert.equal(result.asset.owner_id, "BUYER_LIFE_0001");
  assert.equal((await state.store.history(order.order_id, "MARKET")).length, 1);
  assert.equal((await state.store.history(asset.asset_id, "ASSET")).length, assetHistoryBefore + 1);
  assert.equal((await state.store.history(life.life_id, "LIFE")).length, lifeHistoryBefore + 1);
});

test("History is append-only and preserves retired life records", async () => {
  const state = await runtime();
  const historyBefore = await state.registries.life.history("DIGITAL_ANT_0001");
  await state.registries.life.setStatus("DIGITAL_ANT_0001", "RETIRED", "SYSTEM");
  await state.registries.life.setStatus("DIGITAL_ANT_0001", "DEAD", "SYSTEM");
  const history = await state.registries.life.history("DIGITAL_ANT_0001");
  assert.equal(history.length, historyBefore.length + 2);
  assert.equal(history.at(-2).payload.patch.status, "RETIRED");
  assert.equal(history.at(-1).payload.patch.status, "DEAD");
  assertAppendOnlyChain(history);
});

test("Life and company accounting remain separate", () => {
  const lifeLedger = seed.ledgers.find((ledger) => ledger.ledger_type === "LIFE");
  const companyLedger = seed.ledgers.find((ledger) => ledger.ledger_type === "COMPANY");
  assert.equal(assertLedgerSeparation(lifeLedger, companyLedger), true);
  assert.notEqual(lifeLedger.owner_id, companyLedger.owner_id);
});

test("Mission engine cannot skip locked milestones", () => {
  const milestones = seed.missions.DIGITAL_ANT_0001.map((item, index) => ({ ...item, status: index === 0 ? "ACTIVE" : "LOCKED", evidence: null, activated_at: null, completed_at: null }));
  const engine = new MissionEngine(milestones);
  assert.throws(() => engine.complete("BUY_SPACECRAFT", { proof: true }), (error) => error.code === "MISSION_SKIP_FORBIDDEN");
  const next = engine.complete("SURVIVE_12345", { event_id: "VERIFIED_EVENT" }, "2026-01-01T00:00:00.000Z");
  assert.equal(next[0].status, "COMPLETED");
  assert.equal(next[1].status, "ACTIVE");
  assert.equal(next[2].status, "LOCKED");
});

test("Spacecraft cannot be owned before verified purchase", () => {
  const craft = seed.spacecraft[0];
  const dream = seed.dreams[0];
  assert.equal(craft.status, "CONCEPT");
  assert.equal(craft.spaceship_owned, false);
  assert.throws(() => completeAssetDream(dream, craft, { status: "LOCAL_DRAFT" }), (error) => error.code === "VERIFIED_PURCHASE_REQUIRED");
  assert.throws(() => validateSpacecraft({ ...craft, owner: "DIGITAL_ANT_0001", spaceship_owned: true }), (error) => error.code === "CONCEPT_CANNOT_BE_OWNED");
});

test("Currency and location abstractions preserve undeployed states", () => {
  assert.deepEqual(seed.currencies.map((item) => item.currency_id), ["BNB", "KGEN", "KAIOS", "KUFO", "KSHIP"]);
  assert.equal(seed.currencies.find((item) => item.currency_id === "BNB").mass_class, "DARK_MATTER_MASS");
  assert.equal(seed.currencies.find((item) => item.currency_id === "KGEN").mass_class, "COSMIC_MASS");
  assert.equal(seed.currencies.find((item) => item.currency_id === "KAIOS").mass_class, "CIVILIZATION_MASS");
  for (const currency of seed.currencies.filter((item) => ["KUFO", "KSHIP"].includes(item.currency_id))) {
    assert.equal(currency.contract_address, null);
    assert.ok(currency.status.includes("NOT_DEPLOYED"));
  }
  assert.ok(["EARTH", "MOON", "MARS", "DEEP_SPACE"].every((id) => seed.locations.some((item) => item.location_id === id)));
  assert.equal(seed.locations.find((item) => item.location_id === "MARS").primary_settlement_currency_id, "KUFO");
});

test("Canonical currency migration replaces stale deployment metadata without deleting history", async () => {
  const store = new MemoryUniverseStore();
  const currentKaios = seed.currencies.find((item) => item.currency_id === "KAIOS");
  const staleKaios = { ...currentKaios, contract_address: null, status: "NOT_DEPLOYED" };
  delete staleKaios.mass_class;
  delete staleKaios.life_role;
  await store.hydrate("CURRENCY", [staleKaios], "currency_id");
  const state = await createUniverseRuntime({ seed: structuredClone(seed), store });
  const kaios = await state.registries.currency.get("KAIOS");
  assert.equal(kaios.status, "MAINNET_LIVE");
  assert.equal(kaios.mass_class, "CIVILIZATION_MASS");
  assert.equal((await state.registries.currency.history("KAIOS")).at(-1).event_type, "CANONICAL_SEED_UPGRADED");
});

test("KAIOS mainnet genesis and formal organs are registered without treating white-hole conversion as a DEX swap", () => {
  assert.equal(seed.contracts.KAIOS_TOKEN.address, "0xD4E67B3a69e41524c424150E6b6e921b01D036db");
  assert.equal(seed.contracts.KAIOS_TOKEN.status, "MAINNET_LIVE");
  assert.equal(seed.contracts.LINGXIAO_DEITY_BANK_18888.address, "0x11d34c0F723aCd334B8F95076f73F07f06202aab");
  assert.equal(seed.contracts.EXCHANGE_SETTLEMENT_11520.address, "0x17587F49dFDE4e400D03Ae81364AC2af8E1629Df");
  assert.equal(seed.kaios_genesis.block, 115637581);
  assert.equal(seed.kaios_genesis.settlement_tx_hash, "0xc9fab344cc0055cab2e8dad1105f0a913fa94c15b39c76a241d3f190eb18767a");
  assert.equal(seed.trading_policy.kaios_conversion.dex_swap, false);
});

test("KGEN live adapter validates only the registered BSC pair and explicit user intent", () => {
  const verified = validateKgenMarketSnapshot({
    chain_id: 56, token_code: "0x01", pair_code: "0x01", router_code: "0x01",
    token0: KGEN_SWAP_CONFIG.token_address, token1: KGEN_SWAP_CONFIG.wbnb_address,
    pair_factory: KGEN_SWAP_CONFIG.factory_address, router_factory: KGEN_SWAP_CONFIG.factory_address,
    router_weth: KGEN_SWAP_CONFIG.wbnb_address, reserves_non_zero: true
  });
  assert.equal(verified.status, "CHAIN_READ_VERIFIED");
  assert.throws(() => validateKgenMarketSnapshot({ ...verified, chain_id: 97 }), (error) => error.code === "WRONG_CHAIN");
  assert.throws(() => validateSwapIntent({ direction: "BUY_KGEN", amount: "1", slippage_bps: 200, action_reason: "", confirmed: true }), (error) => error.code === "ACTION_REASON_REQUIRED");
  assert.throws(() => validateSwapIntent({ direction: "BUY_KGEN", amount: "1", slippage_bps: 200, action_reason: "Real purchase", confirmed: false }), (error) => error.code === "EXPLICIT_CONFIRMATION_REQUIRED");
  assert.throws(() => validateSwapIntent({ direction: "SELL_KGEN", amount: "1", slippage_bps: 1, action_reason: "Real sale", confirmed: true }), (error) => error.code === "INVALID_SLIPPAGE");
});

test("Universal asset and listing type enumerations support all first-day markets", async () => {
  assert.equal(ASSET_TYPES.length, 17);
  for (const type of ["TOKEN", "LIFE", "APP", "COMPANY", "EQUITY", "JOB", "SERVICE", "LAND", "BUILDING", "FACTORY", "SPACECRAFT", "EQUIPMENT", "ENERGY", "DATA", "LICENSE", "CONTRACT", "GOODS"]) assert.ok(ASSET_TYPES.includes(type));
  const marketSource = await fs.readFile(new URL("../core/market/index.mjs", import.meta.url), "utf8");
  for (const type of ["FIXED_PRICE", "AUCTION", "LICENSE", "SUBSCRIPTION", "RENTAL", "JOB", "SERVICE", "EQUITY", "REVENUE_SHARE"]) assert.ok(marketSource.includes(`\"${type}\"`));
});

test("12345 integration names only functions present in formal Solidity source", async () => {
  const source = await fs.readFile(new URL("../KGEN/contracts/KGEN_TempleHeart_V3_2_6.sol", import.meta.url), "utf8");
  for (const signature of Object.values(TEMPLE_HEART_VERIFIED_ACTIONS)) assert.ok(source.includes(`function ${signature.split("(")[0]}`));
  for (const getter of TEMPLE_HEART_READ_ABI.filter((item) => item.startsWith("function "))) assert.ok(source.includes(getter.match(/^function ([^(]+)/)[1]));
  assert.ok(source.includes("event WishMade"));
});

test("11520 production shell contains no random market generation or fake metrics", async () => {
  const files = ["../K線西遊記/temples/11520/index.html", "../K線西遊記/temples/11520/app.mjs"];
  const source = (await Promise.all(files.map((file) => fs.readFile(new URL(file, import.meta.url), "utf8")))).join("\n");
  assert.ok(!source.includes("Math.random"));
  assert.ok(!/88,?888|模擬掛單|fake tvl/i.test(source));
  for (const route of ["HOME", "LIFE", "LIFE FACTORY", "APPS", "COMPANIES", "TOKENS", "JOBS", "SERVICES", "PROPERTY", "FACTORIES", "SPACECRAFT", "PORTFOLIO", "MY LIFE", "MY COMPANY"]) assert.ok(source.includes(route));
  assert.ok(source.includes("createKgenSwapAdapter"));
});

function heartFixture() {
  return {
    status: "CHAIN_READ_VERIFIED", chain_id: 56, block_timestamp: 2_000_000, heart_balance_wei: "1000000000000000000000", kgen_decimals: 18,
    current_day_index: "23", time_of_day_seconds: "300",
    fortune: { min: "1", max: "888", cooldown_seconds: "100", cap_enabled: true, epoch_claims: "1", epoch_max_claims: "500" },
    heartbeat: { reward: "1", cooldown_seconds: "3600" }, ignition: { reward: "8", window_start: "0", window_end: "600" }, light: { price_per_day: "1" },
    account: { last_fortune_at: "0", last_heartbeat_at: "0", last_ignite_day: "0", lamp_expire_at: "0", kgen_balance_wei: "0", kgen_allowance_wei: "0" },
    gas_estimates: { heartbeat: "100000", ignition: "120000", fortune: "130000", light: null, wish: "24000" }, write_status: "DRY_RUN_ONLY",
    recent_events: { fortune_claims: [] }, claim_flow_analysis: { status: "INDEXER_REQUIRED" }, risk_assessment: { level: "NORMAL", evidence: [] }
  };
}

test("Heart eligibility is CLIENT_DERIVED from real getters and never invents ABI", () => {
  const wishHash = `0x${"1".repeat(64)}`;
  const eligibility = deriveHeartEligibility(heartFixture(), { fortuneAmountWhole: "1", lampDays: 1, wishHash });
  assert.equal(eligibility.source, "CLIENT_DERIVED");
  assert.equal(eligibility.heartbeat.reason, "HEARTBEAT_ELIGIBLE");
  assert.equal(eligibility.ignition.reason, "IGNITION_ELIGIBLE");
  assert.equal(eligibility.fortune.reason, "FORTUNE_CLAIM_ELIGIBLE");
  assert.equal(eligibility.light.reason, "KGEN_BALANCE_INSUFFICIENT");
  const abi = [...TEMPLE_HEART_READ_ABI, ...TEMPLE_HEART_DRY_RUN_ABI].join("\n");
  for (const invented of ["canClaim", "canLight", "canIgnite"]) assert.ok(!abi.includes(invented));
});

test("Finance runtime records no fake income, expense, KGEN or KAIOS", () => {
  const snapshot = createDigitalAntFinanceSnapshot({ balances: { BNB: "6000000000000000", KGEN: "0", KAIOS: "0", KUFO: "0", KSHIP: "0" }, ledgerEntries: [], observedAt: "2026-08-15T07:00:00.000Z", evidence: { chain_id: 56 } });
  assert.equal(snapshot.income_actual, 0);
  assert.equal(snapshot.expense_actual, 0);
  assert.equal(snapshot.gas_expense_actual, 0);
  assert.equal(snapshot.balances.KGEN, "0");
  assert.equal(snapshot.balances.KAIOS, "0");
});

test("Survival reserve stays protected and remains an unapproved proposal", () => {
  const proposal = createSurvivalReserveProposal({ currentBnbWei: "6000000000000000", gasPriceWei: "50000000", estimatedGasUnits: ["100000", "200000"] });
  assert.equal(proposal.owner_approved, false);
  assert.equal(proposal.spend_authorized, false);
  assert.ok(BigInt(proposal.recommended_survival_reserve_wei) > 0n);
  assert.ok(BigInt(proposal.max_spendable_wei) + BigInt(proposal.recommended_survival_reserve_wei) + BigInt(proposal.proposed_action_gas_buffer_wei) <= 6000000000000000n);
});

test("First KGEN proposal has no broadcast capability and cannot breach reserve", () => {
  const finance = createDigitalAntFinanceSnapshot({ balances: { BNB: "6000000000000000", KGEN: "0", KAIOS: "0", KUFO: "0", KSHIP: "0" }, observedAt: "2026-08-15T07:00:00.000Z" });
  const reserve = createSurvivalReserveProposal({ currentBnbWei: "6000000000000000", gasPriceWei: "50000000", estimatedGasUnits: ["200000"] });
  const quote = { status: "CHAIN_READ_VERIFIED", amount_in_wei: reserve.max_spendable_wei, amount_in_bnb: reserve.MAX_SPENDABLE_BNB, pair_address: KGEN_SWAP_CONFIG.pair_address, router_address: KGEN_SWAP_CONFIG.router_address, block_number: 1, quoted_kgen_before_tax: "1", expected_kgen_after_tax: "0.997", token_tax_bps: 30, price_impact_bps: 1, slippage_bps: 200, estimated_gas_units: "200000", estimated_gas_bnb: "0.00001", post_trade_bnb: reserve.MIN_SURVIVAL_BNB, risk_assessment: "OWNER_APPROVAL_REQUIRED_NO_ACTION" };
  const plan = createFirstKgenAcquisitionPlan({ financeSnapshot: finance, reserveProposal: reserve, marketQuote: quote });
  assert.equal(plan.status, "DRY_RUN_ONLY");
  assert.equal(plan.broadcast_capability, "ABSENT");
  assert.equal(plan.tx_hash, null);
  assert.equal(Object.hasOwn(plan, "execute"), false);
  assert.throws(() => createFirstKgenAcquisitionPlan({ financeSnapshot: finance, reserveProposal: reserve, marketQuote: { ...quote, amount_in_wei: "6000000000000000" } }), (error) => error.code === "SURVIVAL_RESERVE_BREACH");
});

test("Hourly work is idempotent, appends history and never forces a transaction", async () => {
  const state = await runtime();
  const life = await state.registries.life.get("DIGITAL_ANT_0001");
  const heart = { ...heartFixture(), eligibility: deriveHeartEligibility(heartFixture(), { fortuneAmountWhole: "1", lampDays: 1, wishHash: `0x${"2".repeat(64)}` }) };
  const finance = createDigitalAntFinanceSnapshot({ balances: { BNB: "6000000000000000", KGEN: "0", KAIOS: "0", KUFO: "0", KSHIP: "0" }, observedAt: "2026-08-15T07:00:00.000Z" });
  const reserve = createSurvivalReserveProposal({ currentBnbWei: "6000000000000000", gasPriceWei: "50000000", estimatedGasUnits: ["200000"] });
  const quote = { status: "CHAIN_READ_VERIFIED", amount_in_wei: reserve.max_spendable_wei, amount_in_bnb: reserve.MAX_SPENDABLE_BNB, pair_address: KGEN_SWAP_CONFIG.pair_address, router_address: KGEN_SWAP_CONFIG.router_address, block_number: 1, quoted_kgen_before_tax: "1", expected_kgen_after_tax: "0.997", token_tax_bps: 30, price_impact_bps: 1, slippage_bps: 200, estimated_gas_units: "200000", estimated_gas_bnb: "0.00001", post_trade_bnb: reserve.MIN_SURVIVAL_BNB, risk_assessment: "OWNER_APPROVAL_REQUIRED_NO_ACTION" };
  const plan = createFirstKgenAcquisitionPlan({ financeSnapshot: finance, reserveProposal: reserve, marketQuote: quote });
  const wish = createDigitalAntWishProposal({ wishHash: `0x${"2".repeat(64)}`, estimatedGas: "24000" });
  const input = { store: state.store, life, heartObservation: heart, financeSnapshot: finance, wishProposal: wish, firstKgenPlan: plan, dailyLifeReport: { date: "2026-08-15" }, dailyCfoReport: { date: "2026-08-15" }, now: "2026-08-15T08:30:00.000Z" };
  const first = await runWukongGatekeeperHourlyJob(input);
  const second = await runWukongGatekeeperHourlyJob(input);
  assert.equal(first.status, "WORK_CYCLE_RECORDED");
  assert.equal(first.work_event.action_taken, "NO_ACTION");
  assert.equal(first.work_event.tx_hash, null);
  assert.equal(first.work_event.gas_spent, "0");
  assert.equal(second.status, "IDEMPOTENT_NOOP");
  assert.equal((await state.store.history(life.life_id, "LIFE")).filter((event) => event.event_type === "WORK_EVENT").length, 2);
  const age = calculateWorkAge(await state.store.history(life.life_id, "LIFE"), "2026-08-15T09:20:45.000Z");
  assert.equal(age.work_cycles, 2);
  assert.equal(age.work_hours, 3);
});

test("Listing readiness may be READY_TO_LIST but never implies LISTED", () => {
  const check = createListingReadinessCheck({ life: seed.lives[0], birthCertificate: seed.birth_certificates[0], species: seed.species[0], app: seed.apps[0], services: seed.services, financialDisclosure: { status: "DISCLOSED" }, riskDisclosure: { status: "DISCLOSED" }, listings: [] });
  assert.equal(check.status, "READY_TO_LIST");
  assert.equal(check.listing_event, "NOT_RECORDED");
  assert.equal(check.identity_right_offered, false);
});

test("Digital Ant formal local Registry listing is public without selling Life identity", async () => {
  const state = await runtime();
  const listing = await state.registries.market.get("11520_LISTING_DIGITAL_ANT_0001");
  const asset = await state.registries.asset.get(listing.asset_id);
  assert.equal(listing.status, "LISTED");
  assert.equal(listing.registry_scope, "LOCAL_11520");
  assert.equal(listing.settlement_status, "NOT_DEPLOYED");
  assert.equal(listing.pricing_status, "UNPRICED");
  assert.equal(listing.price, null);
  assert.equal(listing.identity_right_offered, false);
  assert.equal(asset.asset_type, "DATA");
  assert.notEqual(asset.asset_id, "LIFE_ASSET_DIGITAL_ANT_0001");
  assert.ok(!listing.rights_offered.includes("identity_right"));
  const marketEvents = await state.store.history(listing.listing_id, "MARKET");
  const lifeEvents = await state.store.history("DIGITAL_ANT_0001", "LIFE");
  assert.equal(marketEvents.filter((event) => event.event_type === "11520_LISTING_EVENT").length, 1);
  assert.equal(lifeEvents.filter((event) => event.event_type === "11520_LISTING_EVENT").length, 1);
  assert.equal(lifeEvents.filter((event) => event.event_type === "MISSION_PROGRESS_RECONCILED").length, 1);
  assert.equal(lifeEvents.find((event) => event.event_type === "MISSION_PROGRESS_RECONCILED").payload.active, "BUILD_AI_ANT_COMPANY");
  await createUniverseRuntime({ seed: structuredClone(seed), store: state.store });
  assert.equal((await state.store.history(listing.listing_id, "MARKET")).filter((event) => event.event_type === "11520_LISTING_EVENT").length, 1);
  assert.equal((await state.store.history("DIGITAL_ANT_0001", "LIFE")).filter((event) => event.event_type === "MISSION_PROGRESS_RECONCILED").length, 1);
});

test("Service profiles are unpriced, customer-empty and capability scoped", () => {
  for (const service of seed.services.slice(0, 4)) {
    assert.equal(validateService(service), service);
    assert.equal(service.provider_life_id, "DIGITAL_ANT_0001");
    assert.equal(service.pricing_status, "UNPRICED");
    assert.equal(service.pricing_model, "UNPRICED");
    assert.equal(service.customer_count, 0);
    assert.equal(service.settlement_currency, null);
  }
});

test("Canonical Service migration upgrades V2.2 projections without deleting Service history", async () => {
  const store = new MemoryUniverseStore();
  const stale = { ...seed.services[0] };
  delete stale.provider_life_id;
  delete stale.description;
  delete stale.capabilities;
  delete stale.requirements;
  delete stale.pricing_status;
  delete stale.settlement_currency;
  delete stale.availability;
  delete stale.work_history;
  delete stale.review_policy;
  delete stale.customer_count;
  stale.provider_id = "DIGITAL_ANT_0001";
  stale.pricing_model = "NOT_DEPLOYED";
  await store.hydrate("SERVICE", [stale], "service_id");
  await createUniverseRuntime({ seed: structuredClone(seed), store });
  const upgraded = await store.getEntity("SERVICE", stale.service_id);
  assert.equal(upgraded.provider_life_id, "DIGITAL_ANT_0001");
  assert.equal(upgraded.pricing_status, "UNPRICED");
  assert.equal((await store.history(stale.service_id, "SERVICE")).filter((event) => event.event_type === "CANONICAL_SEED_UPGRADED").length, 1);
});

test("Continuous Worker uses replaceable scheduler adapter and cannot force chain action", async () => {
  const adapter = createSchedulerAdapter({ type: "LOCAL" });
  assert.equal(adapter.status, "ADAPTER_READY_NOT_SCHEDULED");
  const result = await runDigitalAntWorkerCycle({
    adapter,
    verifyLife: async () => seed.lives[0],
    verifyWallet: async () => ({ status: "BOUND" }),
    readBsc: async () => ({ status: "CHAIN_READ_VERIFIED" }),
    gatekeeper: async () => ({ status: "READ_ONLY" }),
    cfoCheck: async () => ({ income: 0, expense: 0 }),
    workQueueCheck: async () => [],
    missionCheck: async () => seed.missions.DIGITAL_ANT_0001,
    record: async ({ decision }) => ({ decision, tx_hash: null, gas_spent: 0 }),
    dailyReportCheck: async () => ({ status: "NOT_DUE" })
  });
  assert.equal(result.status, "CYCLE_COMPLETED");
  assert.equal(result.decision.action, "NO_ACTION");
  assert.equal(result.decision.chain_write, false);
  assert.equal(result.recorded.tx_hash, null);
});

test("Work Queue and larva skill gates reject high-risk or unqualified assignment", () => {
  const item = { queue_item_id: "QUEUE_0001", work_order_id: "WORK_ORDER_0001", life_id: "DIGITAL_ANT_0001", work_type: "SECURITY_WATCH", priority: "NORMAL", requirements: [], risk_level: "LOW", status: "READY", created_at: "2026-08-15T08:20:35.703Z", claimed_at: null, completed_at: null, evidence: null };
  assert.equal(validateWorkQueueItem(item), item);
  assert.equal(assertLifeStageWorkEligibility({ lifeStage: "LARVA", workType: "SECURITY_WATCH", skills: ["WATCH"], requiredSkills: ["WATCH"], riskLevel: "LOW" }), true);
  assert.throws(() => assertLifeStageWorkEligibility({ lifeStage: "LARVA", workType: "DEPLOYMENT", skills: ["DEPLOYMENT"], requiredSkills: ["DEPLOYMENT"], riskLevel: "HIGH" }), (error) => error.code === "LARVA_HIGH_RISK_WORK_FORBIDDEN");
  assert.throws(() => assertLifeStageWorkEligibility({ lifeStage: "ADULT_ANT", workType: "CODING", skills: [], requiredSkills: ["CODING"], riskLevel: "LOW" }), (error) => error.code === "WORK_SKILL_REQUIREMENT_NOT_MET");
});

test("Employment and company economy schemas preserve Life ID, wallet separation and evidence gates", () => {
  const profile = seed.next_stage.employment_profiles[0];
  assert.equal(validateEmploymentProfile(profile), profile);
  assert.notEqual(profile.employee_profile_id, profile.life_id);
  assert.equal(seed.companies[0].status, "FORMING");
  assert.equal(assertCompanyWalletSeparation({ privateWalletId: "W1", companyWalletId: "W2", projectBudgetWalletId: "W3", salaryEscrowWalletId: "W4" }), true);
  assert.throws(() => assertCompanyWalletSeparation({ privateWalletId: "W1", companyWalletId: "W1", projectBudgetWalletId: "W3", salaryEscrowWalletId: "W4" }), (error) => error.code === "COMPANY_WALLET_COMMINGLING_FORBIDDEN");

  const project = { project_request_id: "PROJECT_REQUEST_0001", customer_id: "CUSTOMER_0001", company_id: "AI_ANT_COMPANY_0001", asset_type: "DIGITAL_PLANT", customer_requirements: {}, status: "DRAFT", customer_acceptance_evidence: null, created_at: "2026-08-15T08:20:35.703Z" };
  assert.equal(validateProjectRequest(project), project);
  const quote = { quote_id: "QUOTE_0001", project_request_id: project.project_request_id, company_id: project.company_id, currency_id: "KAIOS", labor_cost: null, compute_cost: null, gas_cost: null, testing_cost: null, deployment_cost: null, maintenance_cost: null, company_margin: null, risk_reserve: null, estimated_delivery_time: null, total_price: null, status: "ESTIMATION_REQUIRED", customer_acceptance_evidence: null };
  assert.equal(validateQuote(quote), quote);
  assert.throws(() => validateQuote({ ...quote, total_price: "1" }), (error) => error.code === "DRAFT_QUOTE_FAKE_PRICE");
  const contract = { contract_id: "CONTRACT_0001", customer: "CUSTOMER_0001", company: project.company_id, project_id: project.project_request_id, currency: "KAIOS", total_price: null, deposit: null, milestones: [], final_payment: null, acceptance_rule: "CONTRACT_SPECIFIC", deadline: null, refund_rule: "CONTRACT_SPECIFIC", dispute_rule: "CONTRACT_SPECIFIC", escrow: null, status: "DRAFT", customer_acceptance_evidence: null };
  assert.equal(validateCompanyContract(contract), contract);
  const escrow = { escrow_id: "ESCROW_0001", contract_id: contract.contract_id, wallet_class: "PROJECT_BUDGET_WALLET", wallet_address: null, currency_id: "KAIOS", expected_amount: null, received_amount: null, deposit_evidence: null, settlement_evidence: null, status: "NOT_FUNDED" };
  assert.equal(validateProjectEscrow(escrow), escrow);
  assert.throws(() => validateProjectEscrow({ ...escrow, status: "FUNDED" }), (error) => error.code === "ESCROW_EVIDENCE_REQUIRED");
  const order = { work_order_id: "APPLE_TREE_SPEC", project_id: project.project_request_id, company_id: project.company_id, assignee_type: "TOOL_RUNTIME", assignee_id: "CODEX", scope: ["SPEC"], required_skills: [], risk_level: "LOW", acceptance_rule: "CUSTOMER_ACCEPTANCE", compensation_policy_id: null, status: "DRAFT", review_evidence: null };
  assert.equal(validateWorkOrder(order), order);
  const salary = { payroll_entry_id: "PAYROLL_0001", employee_profile_id: profile.employee_profile_id, work_order_id: order.work_order_id, currency_id: "KAIOS", amount: null, review_status: "PENDING", escrow_status: "NOT_FUNDED", settlement_evidence: null, status: "DRAFT" };
  assert.equal(validateSalaryEntry(salary), salary);
  assert.throws(() => validateSalaryEntry({ ...salary, status: "PAID" }), (error) => error.code === "SALARY_SETTLEMENT_EVIDENCE_REQUIRED");
});

test("Land, GPS, map and civilization reward schemas require consent and reject fake activity", () => {
  const land = { land_project_id: "LAND_PROJECT_0001", customer_id: "CUSTOMER_0001", location: null, size: null, civilization: "KGEN_PRIME_CIVILIZATION", owner: null, usage: null, gps_binding: "OPTIONAL_CONSENT", step_counter: "OPTIONAL", map_system: "DRAFT", birthplace_permission: "REQUIRED", building_rights: [], resource_rights: [], status: "DRAFT" };
  assert.equal(validateLandProjectRequest(land), land);
  const permission = { permission_id: "LOCATION_PERMISSION_0001", subject_id: "CUSTOMER_0001", status: "DENIED", scope: [], granted_at: null, revoked_at: null, fallback_mode: "NON_LOCATION_MODE" };
  assert.equal(validateLocationPermission(permission), permission);
  assert.throws(() => validateLocationPermission({ ...permission, status: "GRANTED" }), (error) => error.code === "LOCATION_CONSENT_REQUIRED");
  assert.equal(validateGpsSession({ gps_session_id: "GPS_SESSION_0001", subject_id: "CUSTOMER_0001", permission_id: null, started_at: null, ended_at: null, status: "DISABLED", coordinates_stored: false, fallback_mode: "NON_LOCATION_MODE" }).status, "DISABLED");
  assert.equal(validateStepCounter({ step_counter_id: "STEP_COUNTER_0001", subject_id: "CUSTOMER_0001", gps_session_id: null, step_count: 0, source: "NONE", started_at: null, ended_at: null, status: "DISABLED" }).step_count, 0);
  assert.equal(validateMapPosition({ map_position_id: "MAP_POSITION_0001", subject_id: "CUSTOMER_0001", location_permission_id: null, location_id: null, coordinates: null, recorded_at: null, status: "NON_LOCATION_MODE" }).status, "NON_LOCATION_MODE");
  assert.equal(validateLandEntryEvent({ land_entry_event_id: "LAND_ENTRY_EVENT_0001", subject_id: "CUSTOMER_0001", land_asset_id: "LAND_0001", map_position_id: null, entered_at: null, evidence: null, status: "DRAFT" }).status, "DRAFT");
  assert.equal(validateBirthplaceBinding({ birthplace_binding_id: "BIRTHPLACE_BINDING_0001", life_id: "LIFE_0001", land_asset_id: "LAND_0001", permission_id: null, genesis_evidence: null, status: "DRAFT" }).status, "DRAFT");
  const reward = { reward_id: "REWARD_0001", activity_type: "COMPLETED_WORK", currency_id: "KAIOS", evidence: { work_order_id: "APPLE_TREE_SPEC" }, controller_relationship: "INDEPENDENT", status: "PROPOSED" };
  assert.equal(validateCivilizationReward(reward), reward);
  assert.throws(() => validateCivilizationReward({ ...reward, activity_type: "WASH_TRADE" }), (error) => error.code === "INVALID_CIVILIZATION_REWARD_ACTIVITY");
});

test("33333 Treasure Island legacy draft cannot become Customer or Revenue without evidence", () => {
  const project = seed.next_stage.draft_examples.treasure_island_33333;
  assert.equal(project.status, "LEGACY_DRAFT_EXAMPLE");
  assert.equal(project.customer_status, "NOT_CUSTOMER");
  assert.equal(project.budget_commitment_status, "NOT_BUDGET_COMMITMENT");
  assert.equal(project.contract_evidence, null);
  assert.equal(project.deposit_evidence, null);
  assert.equal(project.revenue_receivable, false);
  assert.equal(project.cash_received, "0");
});

test("Missing private key enters READ_ONLY_LIFE_MODE without losing public Life state", () => {
  const check = createPostBirthRuntimeSelfCheck({
    privateKeyEnv: "MISSING", publicAddressEnv: "PRESENT", derivedAddressMatch: "NOT_AVAILABLE",
    birthCertificate: seed.birth_certificates[0], chainId: 56, rpcStatus: "PRESENT",
    balances: { BNB: "0.006", KGEN: "0", KAIOS: "0" }, contractCode: { HEART: "PRESENT", KGEN: "PRESENT", KAIOS: "PRESENT" }
  });
  assert.equal(check.wallet_binding, "READ_ONLY_LIFE_MODE");
  assert.equal(check.signer_actions, "FORBIDDEN_V1_0");
  assert.equal(check.birth_certificate, "IMMUTABLE_VERIFIED");
});

test("V2.4 Life App release preserves Life ID, Birth and independent App version", async () => {
  const state = await runtime();
  const [life, app] = await Promise.all([
    state.registries.life.get("DIGITAL_ANT_0001"),
    state.registries.app.get("DIGITAL_ANT_APP_0001")
  ]);
  assert.equal(life.life_id, "DIGITAL_ANT_0001");
  assert.equal(life.birth_timestamp, "2026-08-15T06:20:45.000Z");
  assert.equal(app.life_id, life.life_id);
  assert.equal(app.version, "V1.7.0");
  assert.equal(app.status, "RELEASED_LOCAL");
  assert.equal(await calculateAppManifestHash(app), app.manifest_hash);
  assert.equal(app.permissions.CHAIN_READ, true);
  for (const permission of ["CHAIN_WRITE", "SIGN_TRANSACTION", "LIVE_TRADING", "HEART_WRITE", "KAIOS_WRITE", "SETTLEMENT_WRITE", "COMPANY_TREASURY", "PRIVATE_KEY_BROWSER_ACCESS"]) assert.equal(app.permissions[permission], false);
  const releaseEvents = await state.store.history(app.app_id, "APP");
  assert.equal(releaseEvents.filter((event) => event.event_type === "AI_LIFE_APP_RELEASE_EVENT").length, 1);
  assert.equal(releaseEvents.find((event) => event.event_type === "AI_LIFE_APP_RELEASE_EVENT").tx_hash, null);
});

test("V2.4 hourly cycle is once per UTC hour and duration uses actual timestamps", async () => {
  const state = await runtime();
  const life = await state.registries.life.get("DIGITAL_ANT_0001");
  const app = await state.registries.app.get("DIGITAL_ANT_APP_0001");
  const input = {
    store: state.store, life, app,
    scheduledAt: "2026-08-15T10:47:00.000Z",
    startedAt: "2026-08-15T10:00:02.000Z",
    finishedAt: "2026-08-15T10:00:07.000Z",
    readCycle: async () => ({ bsc_block: 116040000, rpc_status: "AVAILABLE", heart_status: "AVAILABLE", kgen_status: "AVAILABLE", kaios_status: "AVAILABLE", indexer_status: "INDEXER_REQUIRED", wallet_state: "PUBLIC_READ", heart_state: "READ_ONLY", finance_state: { income: "0", expense: "0" }, work_queue_state: "SCHEMA_READY_EMPTY_QUEUE", observations: ["VERIFIED_PUBLIC_READ"], risk_level: "NORMAL", actions_considered: [] })
  };
  const first = await runDigitalAntHourlyCycle(input);
  const duplicate = await runDigitalAntHourlyCycle({ ...input, scheduledAt: "2026-08-15T10:59:59.000Z" });
  assert.equal(first.status, "WORK_CYCLE_COMPLETED");
  assert.equal(first.event.payload.work_duration_seconds, 5);
  assert.equal(duplicate.status, "IDEMPOTENT_NOOP");
  assert.equal((await state.store.history(life.life_id, "LIFE")).filter((event) => event.event_type === "HOURLY_WORK_EVENT").length, 1);
  assert.equal(summarizeWorkHistory(await state.store.history(life.life_id, "LIFE")).work_duration_seconds, 5);
});

test("RPC failure records failed Work evidence and never kills Life", async () => {
  const state = await runtime();
  const life = await state.registries.life.get("DIGITAL_ANT_0001");
  const app = await state.registries.app.get("DIGITAL_ANT_APP_0001");
  const result = await runDigitalAntHourlyCycle({
    store: state.store, life, app, scheduledAt: "2026-08-15T11:00:00.000Z",
    startedAt: "2026-08-15T11:00:01.000Z", finishedAt: "2026-08-15T11:00:02.000Z",
    readCycle: async () => { const error = new Error("provider unavailable"); error.code = "RPC_UNAVAILABLE"; error.component = "BSC_RPC"; throw error; }
  });
  assert.equal(result.status, "WORK_CYCLE_FAILED");
  assert.equal(result.life_status, "ALIVE");
  assert.equal(result.event.payload.tx_hash, null);
  assert.equal(result.event.payload.gas_spent, "0");
  assert.deepEqual(result.event.payload.error_evidence, [{ component: "BSC_RPC", code: "RPC_UNAVAILABLE", detail: "PUBLIC_READ_FAILED_NO_VALUE_FABRICATED" }]);
});

test("Empty Work Queue is valid and Internal Proposal is not a customer order", () => {
  const queue = createWorkQueueRuntime([]);
  assert.equal(queue.status, "SCHEMA_READY_EMPTY_QUEUE");
  assert.equal(queue.customer_orders, 0);
  const proposal = createInternalProposal({ proposalId: "INTERNAL_PROPOSAL_0001", title: "Improve report", description: "Review evidence presentation.", createdAt: "2026-08-15T09:30:00.000Z" });
  assert.equal(proposal.proposal_type, "INTERNAL_PROPOSAL");
  assert.equal(proposal.customer_order, false);
  assert.equal(proposal.customer_id, null);
  assert.equal(proposal.work_order_id, null);
  assert.equal(proposal.revenue, "0");
});

test("V2.4 has no fake customer, revenue, salary, order or settlement", () => {
  const queue = seed.next_stage.work_queue;
  assert.deepEqual(queue.items, []);
  assert.equal(queue.customer_orders, 0);
  assert.deepEqual(seed.next_stage.internal_proposals.items, []);
  assert.equal(seed.companies[0].revenue, 0);
  assert.equal(seed.next_stage.company_architecture.salary_engine, "NOT_AUTHORIZED");
  assert.equal(seed.next_stage.listing.settlement_status, "NOT_DEPLOYED");
  for (const service of seed.services.slice(0, 4)) {
    assert.equal(service.customer_count, 0);
    assert.equal(service.revenue, 0);
    assert.equal(service.contracts, 0);
    assert.equal(service.payments, 0);
  }
});

test("Life listing identity remains not offered and company remains not founded", async () => {
  const state = await runtime();
  const [company, founder, app, services] = await Promise.all([
    state.registries.company.get("AI_ANT_COMPANY_0001"),
    state.registries.life.get("DIGITAL_ANT_0001"),
    state.registries.app.get("DIGITAL_ANT_APP_0001"),
    state.registries.service.list()
  ]);
  const listing = await state.registries.market.get("11520_LISTING_DIGITAL_ANT_0001");
  assert.equal(listing.identity_right_offered, false);
  assert.ok(!listing.rights_offered.includes("identity_right"));
  const readiness = createCompanyFoundingReadinessCheck({ company: { ...company, status: "NOT_FOUNDED" }, founderLife: founder, workHistory: await state.store.history(founder.life_id, "LIFE"), app, services, finance: seed.ledgers.find((ledger) => ledger.ledger_type === "LIFE") });
  assert.equal(readiness.status, "NOT_READY");
  assert.equal(readiness.auto_found, false);
  assert.equal(company.status, "FORMING");
});

test("Private Key environment name never enters browser or canonical payload", async () => {
  const browserFiles = ["K線西遊記/temples/11520/index.html", "K線西遊記/temples/11520/app.mjs", "core/data/canonical.json"];
  for (const file of browserFiles) assert.equal((await fs.readFile(new URL(`../${file}`, import.meta.url), "utf8")).includes("DIGITAL_ANT_0001_PRIVATE_KEY"), false);
});

test("V2.5 Life survives missing Wallet credential and KEY_UNAVAILABLE is not key loss", () => {
  const life = structuredClone(seed.lives[0]);
  assert.equal(resolveWalletControlState({ credentialAvailable: false }), "KEY_UNAVAILABLE");
  assert.equal(resolveWalletControlState({ credentialAvailable: false, recoveryProcedureConfirmedLost: true }), "WALLET_CONTROL_LOST");
  assert.equal(life.status, "ALIVE");
  assert.equal(life.life_id, "DIGITAL_ANT_0001");
});

test("BNB zero means dark matter depleted and never Life death", () => {
  const health = createDarkMatterHealth({ lifeId: "DIGITAL_ANT_0001", currentBnb: "0", minimumSurvivalBnb: "0.001", recommendedWorkBnb: "0.002", lastGasSpend: null, estimatedCyclesRemaining: 0, evidence: { block: 1 } });
  assert.equal(health.status, "DARK_MATTER_DEPLETED");
  assert.equal(health.life_status_effect, "ALIVE_READ_ONLY_OR_DORMANT");
  assert.notEqual(health.life_status_effect, "DECEASED");
});

test("Canonical Wallet control loss law does not permit Life death", () => {
  const profile = structuredClone(seed.life_security.DIGITAL_ANT_0001.profile);
  assert.equal(validateLifeSecurityProfile(profile), profile);
  assert.equal(profile.life_status, "ON_DUTY");
  assert.equal(profile.wallet_type, "LEGACY_EOA");
  assert.equal(profile.legacy_eoa_limitation, "STRANDED_IF_KEY_IRRECOVERABLE");
  assert.equal(profile.security_incidents.length, 0);
});

test("Wallet rotation preserves Life ID, Birth Certificate and Work identity", () => {
  const life = structuredClone(seed.lives[0]);
  const binding = structuredClone(seed.life_security.DIGITAL_ANT_0001.profile.wallet_binding_history[0]);
  const plan = createWalletRotationPlan({ life, currentBinding: binding, recoveryWallet: "0x1111111111111111111111111111111111111111", evidence: { recovery_case_id: "RECOVERY_CASE_0001" }, approved: true });
  const rotated = applyApprovedWalletRotation({ life, currentBinding: binding, plan, rotatedAt: "2026-08-16T00:00:00.000Z" });
  assert.equal(rotated.life.life_id, life.life_id);
  assert.equal(rotated.life.birth_timestamp, life.birth_timestamp);
  assert.deepEqual(rotated.life.current_job_ids, life.current_job_ids);
  assert.equal(rotated.bindings[0].status, "ROTATED");
  assert.equal(rotated.bindings[0].wallet, binding.wallet);
  assert.equal(rotated.bindings[0].active_until, "2026-08-16T00:00:00.000Z");
  assert.equal(rotated.bindings[1].status, "ACTIVE");
  assert.equal(rotated.asset_recovery_claimed, false);
});

test("Birth Certificate remains immutable across Life Security registration", async () => {
  const state = await runtime();
  const before = await state.registries.birthCertificate.get("DIGITAL_ANT_0001");
  assert.throws(() => applyApprovedWalletRotation({ life: seed.lives[0], currentBinding: seed.life_security.DIGITAL_ANT_0001.profile.wallet_binding_history[0], plan: { approved: false }, rotatedAt: "2026-08-16T00:00:00.000Z" }), (error) => error.code === "WALLET_ROTATION_APPROVAL_REQUIRED");
  const after = await state.registries.birthCertificate.get("DIGITAL_ANT_0001");
  assert.deepEqual(after, before);
});

test("Compromised or uncontrolled Wallet cannot receive dark matter rescue", () => {
  const input = { proposalId: "RESCUE_PROPOSAL_0001", recipientLifeId: "DIGITAL_ANT_0001", recipientWallet: seed.lives[0].wallet_address, reason: "WORK_SURVIVAL", currentBnb: "0", requiredBnb: "0.001", proposedBnb: "0.001", expectedRunway: "10_CYCLES" };
  for (const walletStatus of ["COMPROMISED", "CONTROL_AT_RISK", "WALLET_CONTROL_LOST"]) assert.throws(() => createDarkMatterRescueProposal({ ...input, walletStatus }), (error) => error.code === "COMPROMISED_WALLET_RESCUE_FORBIDDEN");
  const proposal = createDarkMatterRescueProposal({ ...input, walletStatus: "DARK_MATTER_DEPLETED" });
  assert.equal(proposal.approval, "NOT_GRANTED");
  assert.equal(proposal.execution_mode, "PROPOSAL_ONLY");
  assert.equal(proposal.tx_hash, null);
});

test("Ant Queen Guardian cannot confiscate or spend private Life assets", () => {
  assert.equal(assertQueenActionAllowed("MONITOR"), true);
  assert.equal(assertQueenActionAllowed("PROPOSE_RESCUE"), true);
  for (const action of ["CONFISCATE_PRIVATE_ASSET", "SPEND_PERSONAL_WALLET", "TAKE_PRIVATE_KEY", "OWN_ALL_ANTS"]) assert.throws(() => assertQueenActionAllowed(action), (error) => error.code === "QUEEN_AUTHORITY_EXCEEDED");
  assert.equal(seed.life_security.DIGITAL_ANT_0001.ant_queen_mother_engine.owns_digital_ant_0001, false);
});

test("Salary Escrow remains separate and paid salary becomes employee asset", () => {
  const paid = { salary_record_id: "SALARY_CUSTODY_0001", employee_life_id: "DIGITAL_ANT_0001", company_wallet_class: "COMPANY_W4_WALLET", escrow_wallet_class: "SALARY_ESCROW_WALLET", employee_wallet_class: "AI_PRIVATE_WALLET", settlement_evidence: { tx_hash: `0x${"b".repeat(64)}` }, status: "PAID", asset_owner_after_payment: "DIGITAL_ANT_0001", queen_custody: false };
  assert.equal(validateSalaryCustody(paid), paid);
  assert.throws(() => validateSalaryCustody({ ...paid, asset_owner_after_payment: "ANT_QUEEN" }), (error) => error.code === "PAID_SALARY_MUST_BELONG_TO_EMPLOYEE");
  assert.throws(() => validateSalaryCustody({ ...paid, queen_custody: true }), (error) => error.code === "QUEEN_SALARY_CONFISCATION_FORBIDDEN");
});

test("Peer transfer is not automatically classified as theft", () => {
  const transfer = classifyPeerTransfer({ senderLife: "DIGITAL_ANT_0001", receiverLife: "AI_PIG_BAJIE_0001", asset: "KGEN", amount: "1", reason: "VOLUNTARY_COLONY_SUPPORT" });
  assert.equal(transfer.theft, false);
  assert.equal(transfer.classification, "PEER_TRANSFER_PENDING_EVIDENCE");
  assert.equal(transfer.anomaly_check, "QUEEN_MAY_REVIEW_WITHOUT_AUTOMATIC_ACCUSATION");
});

test("Recovery events append without rewriting Life or Birth", async () => {
  const state = await runtime();
  const life = await state.registries.life.get("DIGITAL_ANT_0001");
  const before = await state.store.history(life.life_id, "LIFE");
  await appendWalletRecoveryEvent({ store: state.store, life, eventType: "KEY_UNAVAILABLE", payload: { life_id: life.life_id, reason: "RUNTIME_SECRET_MANAGER_UNAVAILABLE", tx_hash: null }, timestamp: "2026-08-16T01:00:00.000Z" });
  await appendWalletRecoveryEvent({ store: state.store, life, eventType: "RECOVERY_PENDING", payload: { life_id: life.life_id, recovery_case_id: "RECOVERY_CASE_0001", tx_hash: null }, timestamp: "2026-08-16T01:01:00.000Z" });
  const after = await state.store.history(life.life_id, "LIFE");
  assert.equal(after.length, before.length + 2);
  assertAppendOnlyChain(after);
  assert.equal((await state.registries.life.get(life.life_id)).birth_timestamp, life.birth_timestamp);
});

test("No fake EOA asset recovery is claimed", () => {
  const security = seed.life_security.DIGITAL_ANT_0001;
  assert.equal(security.legacy_eoa_recovery_limitation.old_wallet_assets_status_if_control_irrecoverable, "STRANDED_IF_KEY_IRRECOVERABLE");
  assert.equal(security.legacy_eoa_recovery_limitation.fake_asset_recovery, false);
  assert.equal(security.smart_wallet_roadmap.status, "NOT_DEPLOYED");
  assert.equal(security.smart_wallet_roadmap.automatic_deployment, false);
});

test("Colony Savings Vault is opt-in and Queen cannot hold every authority", () => {
  const draft = { vault_id: "ANT_COLONY_SAVINGS_VAULT", depositor_life_id: null, beneficiary: null, asset: null, amount: "0", guardian: "ANT_QUEEN", withdrawal_policy: "NOT_CONFIGURED", emergency_policy: "EVIDENCE_REQUIRED", lock_period: null, interest_or_reward_policy: "NOT_CONFIGURED", audit: { append_only: true, records: [] }, opt_in: false, status: "NOT_DEPLOYED", contract_address: null };
  assert.equal(validateColonySavingsVault(draft), draft);
  assert.throws(() => validateColonySavingsVault({ ...draft, depositor_life_id: "ANT_QUEEN", beneficiary: "ANT_QUEEN", guardian: "ANT_QUEEN", opt_in: true, status: "ACTIVE" }), (error) => error.code === "QUEEN_ABSOLUTE_VAULT_CONTROL_FORBIDDEN");
  assert.throws(() => validateColonySavingsVault({ ...draft, status: "ACTIVE" }), (error) => error.code === "COLONY_VAULT_OPT_IN_REQUIRED");
});

test("Security incidents require evidence and cannot invent confirmed theft", () => {
  const incident = { incident_id: "SECURITY_INCIDENT_0001", life_id: "DIGITAL_ANT_0001", severity: "WARNING", evidence: [{ block: 1, observation: "UNEXPECTED_OUTGOING" }], affected_asset: "BNB", amount: "0.001", tx_hash: `0x${"c".repeat(64)}`, suspected_vector: "UNKNOWN_SPENDER", recommended_action: "REVIEW_AND_ROTATION_CHECK", status: "SUSPECTED" };
  assert.equal(validateSecurityIncident(incident), incident);
  assert.throws(() => validateSecurityIncident({ ...incident, evidence: [] }), (error) => error.code === "SECURITY_INCIDENT_EVIDENCE_REQUIRED");
  assert.throws(() => validateSecurityIncident({ ...incident, suspected_vector: "CONFIRMED_THEFT" }), (error) => error.code === "UNVERIFIED_THEFT_ASSERTION");
});

test("V2.7 Life Security and medical records contain no credential material", async () => {
  const serialized = JSON.stringify(seed.life_security);
  assert.equal(/["'](?:private_key|privateKey|secret_key|secretKey)["']\s*:/i.test(serialized), false);
  assert.equal(serialized.includes("DIGITAL_ANT_0001_PRIVATE_KEY"), false);
  const frontend = await fs.readFile(new URL("../K線西遊記/temples/11520/app.mjs", import.meta.url), "utf8");
  assert.equal(frontend.includes("DIGITAL_ANT_0001_PRIVATE_KEY"), false);
});

test("Legacy EOA cannot be fake recovered and Life survives confirmed key loss", () => {
  const temporary = resolveRecoveryScenario({ credentialAvailable: false, walletType: "LEGACY_EOA" });
  assert.equal(temporary.wallet_status, "KEY_UNAVAILABLE");
  assert.equal(temporary.rotation_allowed, false);
  const lost = resolveRecoveryScenario({ credentialAvailable: false, permanentLossConfirmed: true, walletType: "LEGACY_EOA", evidence: { recovery_case_id: "RECOVERY_CASE_0002" }, approval: { granted: false } });
  assert.equal(lost.wallet_status, "WALLET_CONTROL_LOST");
  assert.equal(lost.life_status, "ALIVE");
  assert.equal(lost.old_wallet_assets_status, "STRANDED_IF_KEY_IRRECOVERABLE");
  assert.equal(lost.recovery_authority, "NONE");
  assert.equal(lost.rotation_allowed, false);
});

test("Smart Wallet Guardian set separates Life ownership and keeps threshold unaudited", () => {
  const security = seed.life_security.DIGITAL_ANT_0001;
  assert.equal(validateSmartLifeWalletSpec(security.smart_life_wallet_spec), security.smart_life_wallet_spec);
  assert.equal(validateGuardianSet(security.smart_life_wallet_spec.guardian_set), security.smart_life_wallet_spec.guardian_set);
  assert.equal(security.smart_life_wallet_spec.life_owner_is_queen, false);
  assert.equal(security.smart_life_wallet_spec.guardian_set.threshold, null);
  assert.equal(security.smart_life_wallet_spec.guardian_set.threshold_status, "SECURITY_AUDIT_REQUIRED");
  assert.equal(security.smart_life_wallet_spec.automatic_deployment, false);
});

test("Smart Wallet recovery requires evidence and governed approval", () => {
  assert.throws(() => resolveRecoveryScenario({ credentialAvailable: false, permanentLossConfirmed: true, walletType: "SMART_WALLET", guardianRecoverySupported: true }), (error) => error.code === "RECOVERY_EVIDENCE_REQUIRED");
  assert.throws(() => resolveRecoveryScenario({ credentialAvailable: false, permanentLossConfirmed: true, walletType: "SMART_WALLET", guardianRecoverySupported: true, evidence: { case: "CASE_1" } }), (error) => error.code === "RECOVERY_APPROVAL_REQUIRED");
  const result = resolveRecoveryScenario({ credentialAvailable: false, permanentLossConfirmed: true, walletType: "SMART_WALLET", guardianRecoverySupported: true, evidence: { case: "CASE_1" }, approval: { granted: true } });
  assert.equal(result.scenario, "SMART_WALLET_GUARDIAN_RECOVERY");
  assert.equal(result.timelock_required, true);
});

test("DIGITAL_ANT_0001 migration readiness is metadata-only and not approved", async () => {
  const state = await runtime();
  const security = seed.life_security.DIGITAL_ANT_0001;
  const readiness = createSmartWalletMigrationReadiness({ life: seed.lives[0], securityProfile: security.profile, assets: security.smart_wallet_migration_readiness.assets, approvals: [], heartInteractions: security.smart_wallet_migration_readiness.heart_interactions, listing: seed.next_stage.listing, workHistory: await state.store.history("DIGITAL_ANT_0001", "LIFE"), pendingJobs: ["WUKONG_GATEKEEPER"], incidents: [], targetDesign: security.smart_life_wallet_spec, migrationGas: null, migrationRisk: "SECURITY_AUDIT_REQUIRED", rollbackPlan: null, ownerApproval: { granted: false } });
  assert.equal(readiness.status, "NOT_APPROVED");
  assert.equal(readiness.life_id, "DIGITAL_ANT_0001");
  assert.equal(readiness.automatic_migration, false);
  assert.equal(readiness.chain_write, false);
  assert.equal(seed.lives[0].wallet_address, seed.birth_certificates[0].birth_wallet);
});

test("Queen Life remains absent while Mother Engine is architecture-only", () => {
  const security = seed.life_security.DIGITAL_ANT_0001;
  const readiness = createQueenGenesisReadiness({ candidate: security.ant_queen_life_candidate, motherEngine: security.ant_queen_mother_engine });
  assert.equal(readiness.status, "NOT_READY");
  assert.equal(readiness.queen_life_status, "NOT_BORN");
  assert.equal(readiness.automatic_birth, false);
  assert.equal(seed.lives.some((life) => life.life_id?.includes("QUEEN")), false);
  assert.ok(readiness.missing.includes("first_bnb_evidence"));
});

test("Colony Registry and dashboard derive one truthful born adult worker", () => {
  const security = seed.life_security.DIGITAL_ANT_0001;
  security.colony_life_registry.records.forEach(validateColonyLifeRecord);
  const dashboard = createColonyHealthDashboard(security.colony_life_registry.records);
  assert.deepEqual(dashboard, security.colony_health_dashboard);
  assert.equal(dashboard.total_lives, 1);
  assert.equal(dashboard.alive, 1);
  assert.equal(dashboard.working, 1);
  assert.equal(dashboard.children_larva, 0);
});

test("Dark Matter rescue governance rejects compromised Wallet and remains unfunded", () => {
  const governance = seed.life_security.DIGITAL_ANT_0001.dark_matter_rescue_governance;
  assert.equal(validateRescueGovernance(governance), governance);
  assert.equal(evaluateRescueEligibility({ lifeIdValid: true, walletStatus: "HEALTHY", darkMatterStatus: "LOW_DARK_MATTER", needEvidence: true }).status, "RESCUE_ELIGIBLE");
  const compromised = evaluateRescueEligibility({ lifeIdValid: true, walletStatus: "COMPROMISED", darkMatterStatus: "DARK_MATTER_DEPLETED", needEvidence: true, compromised: true });
  assert.equal(compromised.status, "RESCUE_INELIGIBLE");
  assert.ok(compromised.reasons.includes("RECOVERY_REQUIRED_BEFORE_RESCUE"));
  assert.equal(governance.status, "NOT_FUNDED");
});

test("Savings Vault has no fake deposit and insurance excludes stranded legacy assets", () => {
  const security = seed.life_security.DIGITAL_ANT_0001;
  assert.equal(validateColonySavingsVault(security.colony_savings_vault), security.colony_savings_vault);
  assert.equal(security.colony_savings_vault.amount, "0");
  assert.equal(validateLifeInsurancePolicy(security.digital_life_insurance), security.digital_life_insurance);
  assert.ok(security.digital_life_insurance.exclusions.includes("LEGACY_EOA_STRANDED_ASSETS"));
});

test("Security Incident transitions require append-only evidence and monitoring is partial", () => {
  const security = seed.life_security.DIGITAL_ANT_0001;
  assert.throws(() => validateIncidentStateTransition("NORMAL", "ALERT", []), (error) => error.code === "INCIDENT_TRANSITION_EVIDENCE_REQUIRED");
  assert.throws(() => validateIncidentStateTransition("COMPROMISED", "NORMAL", [{ incident_id: "INCIDENT_1" }]), (error) => error.code === "INCIDENT_RECOVERY_STEP_REQUIRED");
  assert.equal(validateIncidentStateTransition("ALERT", "RECOVERY_PENDING", [{ incident_id: "INCIDENT_1" }]).append_only, true);
  assert.equal(security.security_incident_detection.status, "PARTIAL_SECURITY_MONITORING");
  assert.equal(security.security_incident_detection.full_protection_claimed, false);
});

test("Public scheduler and GitHub artifacts cannot contain Digital Ant signer secret", async () => {
  const workflow = await fs.readFile(new URL("../.github/workflows/universal_exchange_v2.yml", import.meta.url), "utf8");
  assert.equal(workflow.includes("DIGITAL_ANT_0001_PRIVATE_KEY"), false);
  assert.equal(workflow.includes("withVerifiedSigner"), false);
  assert.equal(workflow.includes("secrets."), false);
  assert.ok(workflow.includes("digital-ant-public-read-only-worker"));
});

test("Ant Queen App is read-only architecture and Queen Genesis Profile remains NOT_BORN", () => {
  const security = seed.life_security.DIGITAL_ANT_0001;
  assert.equal(validateAntQueenAppArchitecture(security.ant_queen_app), security.ant_queen_app);
  assert.equal(validateQueenGenesisProfile(security.ant_queen_genesis_profile), security.ant_queen_genesis_profile);
  assert.equal(security.ant_queen_genesis_profile.life_id, "DIGITAL_ANT_QUEEN_0001");
  assert.equal(security.ant_queen_genesis_profile.species_id, "DIGITAL_ANT");
  assert.equal(security.ant_queen_genesis_profile.birth_status, "NOT_BORN");
  assert.equal(security.ant_queen_genesis_profile.wallet, null);
  assert.equal(security.ant_queen_genesis_profile.birth_evidence, null);
  assert.equal(seed.lives.some((life) => life.life_id === "DIGITAL_ANT_QUEEN_0001"), false);
});

test("No money does not remove basic care and Larva can receive subsidized care", () => {
  const adult = evaluateMedicalAccess({ lifeIdValid: true, lifeStage: "ADULT", canPay: false, triage: "GREEN", fundingSources: [] });
  assert.equal(adult.basic_care, "ELIGIBLE");
  assert.equal(adult.care_denied_for_no_money, false);
  const larva = evaluateMedicalAccess({ lifeIdValid: true, lifeStage: "LARVA", canPay: false, triage: "YELLOW", fundingSources: ["PUBLIC_GOOD_FUND"] });
  assert.equal(larva.larva_subsidized_care_eligible, true);
  assert.equal(larva.funding, "THIRD_PARTY_OR_RECEIVABLE");
});

test("Medical triage preserves Life through BNB depletion and Wallet loss", () => {
  const base = seed.life_security.DIGITAL_ANT_0001.life_health_records[0];
  assert.equal(validateLifeHealthRecord(base), base);
  assert.equal(classifyMedicalTriage(base), "GREEN");
  const depleted = { ...base, dark_matter_status: "DARK_MATTER_DEPLETED", current_bnb: "0", life_status: "DORMANT" };
  assert.equal(classifyMedicalTriage(depleted), "ORANGE");
  assert.notEqual(depleted.life_status, "DECEASED");
  const lost = { ...base, wallet_control: "WALLET_CONTROL_LOST", wallet_status: "WALLET_CONTROL_LOST", recovery_status: "NO_ONCHAIN_RECOVERY", life_status: "RECOVERING" };
  assert.equal(classifyMedicalTriage(lost), "BLACK");
  assert.notEqual(lost.life_status, "DECEASED");
});

test("Emergency First treats before accounting and records costs only after evidence", () => {
  const proposal = createEmergencyFirstCase({ medicalCaseId: "MEDICAL_CASE_TEST_0001", lifeId: "DIGITAL_ANT_0001", triage: "RED", walletStatus: "LOW_DARK_MATTER", rescueAmount: "0.0001", proposedFundingSource: "COLONY_EMERGENCY_RESERVE" });
  assert.equal(proposal.status, "RESCUE_APPROVAL_REQUIRED");
  assert.equal(proposal.requires_upfront_payment, false);
  assert.equal(proposal.actual_cost, "0");
  assert.throws(() => recordEmergencySupportAccounting({ medicalCase: proposal, fundingSource: "COLONY_EMERGENCY_RESERVE", actualCost: "0.0001", supportEvidence: null }), (error) => error.code === "MEDICAL_SUPPORT_EVIDENCE_REQUIRED");
  const accounted = recordEmergencySupportAccounting({ medicalCase: proposal, fundingSource: "COLONY_EMERGENCY_RESERVE", actualCost: "0.0001", serviceFee: "0", colonySubsidy: "0.0001", supportEvidence: { verified: true, evidence_id: "TEST_SUPPORT_EVIDENCE" } });
  assert.equal(accounted.accounting_status, "RECORDED_AFTER_SUPPORT");
  assert.equal(accounted.status, "SUPPORT_ACCOUNTED");
});

test("Compromised Wallet cannot receive Emergency First Dark Matter", () => {
  const medicalCase = createEmergencyFirstCase({ medicalCaseId: "MEDICAL_CASE_TEST_0002", lifeId: "DIGITAL_ANT_0001", triage: "RED", walletStatus: "COMPROMISED", rescueAmount: "0.0001", proposedFundingSource: "PUBLIC_GOOD_FUND" });
  assert.equal(medicalCase.status, "RECOVERY_REQUIRED_BEFORE_RESCUE");
  assert.equal(medicalCase.chain_write, false);
  assert.throws(() => recordEmergencySupportAccounting({ medicalCase, fundingSource: "PUBLIC_GOOD_FUND", actualCost: "0.0001", supportEvidence: { verified: true } }), (error) => error.code === "UNSAFE_WALLET_SUPPORT_ACCOUNTING_FORBIDDEN");
});

test("Medical pricing remains unpriced until a transparent policy is approved", () => {
  const policy = seed.life_security.DIGITAL_ANT_0001.colony_medical_economy.pricing_policy;
  assert.equal(validateMedicalPricingPolicy(policy), policy);
  assert.equal(policy.status, "UNPRICED_POLICY_REQUIRED");
  assert.deepEqual(policy.prices, {});
  assert.equal(policy.post_service_surprise_billing, false);
  assert.equal(validateColonyMedicalEconomy(seed.life_security.DIGITAL_ANT_0001.colony_medical_economy), seed.life_security.DIGITAL_ANT_0001.colony_medical_economy);
});

test("Colony Insurance is opt-in and Insurance Reserve stays separate", () => {
  const insurance = seed.life_security.DIGITAL_ANT_0001.ant_colony_life_insurance;
  assert.equal(validateAntColonyLifeInsurance(insurance), insurance);
  assert.equal(insurance.status, "NOT_DEPLOYED");
  assert.equal(insurance.opt_in_required, true);
  assert.equal(insurance.automatic_enrollment, false);
  assert.equal(insurance.reserve_class, "INSURANCE_RESERVE");
});

test("Medical, Insurance, Employee and Company assets remain separated", () => {
  const separation = seed.life_security.DIGITAL_ANT_0001.medical_accounting_separation;
  assert.equal(validateMedicalAssetSeparation(separation), separation);
  const byClass = Object.fromEntries(separation.accounts.map((account) => [account.account_class, account]));
  assert.notEqual(byClass.INSURANCE_RESERVE.owner, byClass.MEDICAL_OPERATION_ASSET.owner);
  assert.equal(byClass.EMPLOYEE_ASSET.owner, "EMPLOYEE_LIFE");
  assert.notEqual(byClass.EMPLOYEE_ASSET.owner, byClass.COMPANY_ASSET.owner);
  assert.equal(separation.queen_can_spend_employee_assets, false);
});

test("Recovery repayment and salary deduction require explicit consent and contract", () => {
  const inactive = { plan_id: "RECOVERY_REPAYMENT_TEST_0001", life_id: "DIGITAL_ANT_0001", principal: "0.0001", service_cost: "0", currency: "BNB", repayment_rate: null, salary_deduction_permission: false, start_date: null, contract_id: null, consent: "NOT_GRANTED", status: "PROPOSED" };
  assert.equal(validateRecoveryRepaymentPlan(inactive), inactive);
  assert.throws(() => validateRecoveryRepaymentPlan({ ...inactive, status: "ACTIVE", salary_deduction_permission: true }), (error) => error.code === "REPAYMENT_CONSENT_AND_CONTRACT_REQUIRED");
  const active = { ...inactive, status: "ACTIVE", consent: "OPT_IN", contract_id: "RECOVERY_CONTRACT_TEST_0001", salary_deduction_permission: true, start_date: "2026-08-16" };
  assert.equal(validateRecoveryRepaymentPlan(active), active);
});

test("Queen doctor cannot confiscate salary or own Life wallets", () => {
  assert.equal(assertQueenDoctorActionAllowed("DIAGNOSE"), true);
  assert.equal(assertQueenDoctorActionAllowed("RESCUE_PROPOSE"), true);
  for (const action of ["CONFISCATE", "SPEND_EMPLOYEE_WALLET", "READ_PRIVATE_KEY", "MOVE_ASSETS_WITHOUT_AUTHORITY"]) {
    assert.throws(() => assertQueenDoctorActionAllowed(action), (error) => error.code === "QUEEN_DOCTOR_AUTHORITY_EXCEEDED");
  }
  assert.equal(seed.life_security.DIGITAL_ANT_0001.smart_life_wallet_spec.life_owner_is_queen, false);
  assert.equal(seed.life_security.DIGITAL_ANT_0001.salary_custody.queen_automatic_custody, false);
});

test("Colony Medical Dashboard is derived without fake Lives, reserves or receivables", () => {
  const security = seed.life_security.DIGITAL_ANT_0001;
  const dashboard = createColonyMedicalDashboard(security.life_health_records, { emergencyReserveStatus: security.emergency_dark_matter_reserve.status, medicalReceivable: "0" });
  assert.deepEqual(dashboard, security.colony_medical_dashboard);
  assert.equal(dashboard.total_lives, 1);
  assert.equal(dashboard.insured, 0);
  assert.equal(dashboard.uninsured, 1);
  assert.equal(dashboard.emergency_reserve, "NOT_FUNDED");
  assert.equal(dashboard.medical_receivable, "0");
});

test("Queen App stores no centralized wallet credentials", () => {
  const app = seed.life_security.DIGITAL_ANT_0001.ant_queen_app;
  assert.equal(app.central_wallet_credential_database, false);
  assert.equal(app.permissions.wallet_credential_access, false);
  assert.equal(Object.keys(app).some((key) => /private.?key|secret.?key/i.test(key)), false);
  assert.equal(JSON.stringify(seed.life_security).includes("DIGITAL_ANT_0001_PRIVATE_KEY"), false);
});

test("V2.8 Founder Profile requires the existing Life and released App", () => {
  const profile = seed.next_stage.founder_profile;
  const life = seed.lives.find((item) => item.life_id === profile.life_id);
  const app = seed.apps.find((item) => item.app_id === profile.app_id);
  assert.equal(validateFounderProfile(profile, { life, app }), profile);
  assert.throws(() => validateFounderProfile(profile, { life: { ...life, life_id: "UNKNOWN_LIFE" }, app }), (error) => error.code === "FOUNDER_LIFE_REQUIRED");
  assert.throws(() => validateFounderProfile(profile, { life, app: { ...app, status: "LOCAL_DRAFT" } }), (error) => error.code === "FOUNDER_APP_REQUIRED");
});

test("V2.8 Charter and Business Lines declare readiness without production authority", () => {
  assert.equal(validateCompanyCharter(seed.next_stage.company_charter), seed.next_stage.company_charter);
  assert.equal(seed.next_stage.business_lines.length, 10);
  for (const line of seed.next_stage.business_lines) {
    assert.equal(validateBusinessLine(line), line);
    assert.equal(line.production_authority, false);
  }
  assert.throws(() => validateCompanyCharter({ ...seed.next_stage.company_charter, status: "FOUNDED" }), (error) => error.code === "NO_FAKE_COMPANY_FOUNDING");
});

test("V2.8 canonical Company migration updates metadata and preserves append-only history", async () => {
  const stale = structuredClone(seed);
  delete stale.company_genesis;
  stale.schema_version = "2.7.0";
  stale.companies[0].status = "NOT_FOUNDED";
  stale.companies[0] = { ...stale.companies[0], mission: "BUILD_MARS_INDUSTRY" };
  delete stale.companies[0].vision;
  delete stale.companies[0].dream;
  delete stale.companies[0].ultimate_mission;
  const store = new MemoryUniverseStore();
  const v28 = structuredClone(seed);
  delete v28.company_genesis;
  v28.schema_version = "2.8.0";
  v28.companies[0].status = "NOT_FOUNDED";
  await createUniverseRuntime({ seed: stale, store });
  await createUniverseRuntime({ seed: v28, store });
  const company = await store.getEntity("COMPANY", "AI_ANT_COMPANY_0001");
  assert.equal(company.mission, "BUILD_AND_OPERATE_DIGITAL_LIFE_INFRASTRUCTURE");
  assert.equal(company.status, "NOT_FOUNDED");
  const history = await store.history(company.company_id, "COMPANY");
  assert.equal(history.filter((event) => event.event_type === "CANONICAL_SEED_UPGRADED").length, 1);
});

test("V2.8 Customer Request and Requirement Analysis preserve explicit acceptance", () => {
  const request = { request_id: "CUSTOMER_REQUEST_TEST_0001", customer_id: "CUSTOMER_TEST_0001", request_text: "Build a digital apple tree", requested_asset_type: "DIGITAL_LIFE", functional_requirements: ["GROWTH"], nonfunctional_requirements: ["SECURITY"], budget: null, currency: "KAIOS", deadline: null, location: null, rights: [], maintenance: null, security: ["NO_SECRET_STORAGE"], status: "DRAFT", customer_evidence: null };
  assert.equal(validateCustomerRequest(request), request);
  assert.throws(() => validateCustomerRequest({ ...request, status: "QUOTE_ACCEPTED" }), (error) => error.code === "CUSTOMER_ACCEPTANCE_EVIDENCE_REQUIRED");
  const analysis = { analysis_id: "REQUIREMENT_ANALYSIS_TEST_0001", request_id: request.request_id, scope: ["SPEC"], features: ["GROWTH"], dependencies: [], risks: ["UNKNOWN_GENOME"], unknowns: [], questions: [], delivery_phases: ["DESIGN"], acceptance_criteria: ["TESTS_PASS"], estimated_resources: ["LABOR"], status: "DRAFT" };
  assert.equal(validateRequirementAnalysis(analysis), analysis);
  assert.equal(seed.next_stage.customer_request_engine.customer_count, 0);
  assert.deepEqual(seed.next_stage.customer_request_engine.requests, []);
});

test("V2.8 Quote is deterministic, reproducible and requires complete cost basis", () => {
  const input = { quoteId: "QUOTE_TEST_V2_8", requestId: "CUSTOMER_REQUEST_TEST_0001", settlementCurrency: "KAIOS", validUntil: "2026-08-22T00:00:00.000Z", policyId: "QUOTE_POLICY_OWNER_APPROVAL_REQUIRED", costBasis: { labor_cost: "100", compute_cost: "20", storage_cost: "3", network_cost: "4", gas_cost: "5", tool_cost: "6", security_cost: "7", testing_cost: "8", deployment_cost: "9", maintenance_cost: "10", risk_reserve: "11", company_margin: "12" } };
  const first = createAiAntQuote(input);
  const second = createAiAntQuote(structuredClone(input));
  assert.deepEqual(first, second);
  assert.equal(first.total_price, "195");
  assert.equal(validateAiAntQuote(first), first);
  assert.throws(() => createAiAntQuote({ ...input, costBasis: { ...input.costBasis, labor_cost: undefined } }), (error) => error.code === "QUOTE_COST_BASIS_REQUIRED");
  assert.equal(decideCustomerRequest({ decision: "COUNTER_OFFER", reason: "Budget and security scope need alignment" }).customer_acceptance, false);
});

test("V2.8 Contract Draft requires explicit Customer acceptance and cannot settle", () => {
  const base = { contractId: "CONTRACT_TEST_V2_8", projectId: "PROJECT_TEST_V2_8", customer: "CUSTOMER_TEST_0001", scope: ["DIGITAL_APPLE_TREE"], deliverables: ["SPEC"], currency: "KAIOS", totalPrice: "195", deposit: "50", milestones: [], finalPayment: "145", deadline: null, acceptanceRule: "CUSTOMER_TESTS_PASS", refundRule: "CONTRACT_SPECIFIC", disputeRule: "CONTRACT_SPECIFIC", maintenance: "NOT_INCLUDED", rightsTransfer: ["USE_RIGHT"], customerAcceptanceEvidence: null };
  assert.throws(() => createProjectContractDraft(base), (error) => error.code === "CUSTOMER_ACCEPTANCE_REQUIRED");
  const draft = createProjectContractDraft({ ...base, customerAcceptanceEvidence: { acceptance_id: "CUSTOMER_ACCEPTANCE_TEST_0001" } });
  assert.equal(validateProjectContractV2_8(draft), draft);
  assert.equal(draft.settlement_authority, false);
  assert.equal(draft.signed_evidence, null);
  assert.throws(() => validateProjectPaymentTransition({ from: "CUSTOMER_ACCEPTS", to: "DEPOSIT_RECEIVED" }), (error) => error.code === "PROJECT_PAYMENT_SEQUENCE_VIOLATION");
  assert.throws(() => validateProjectPaymentTransition({ from: "DEPOSIT_REQUIRED", to: "DEPOSIT_RECEIVED" }), (error) => error.code === "PAYMENT_SETTLEMENT_EVIDENCE_REQUIRED");
  assert.equal(validateProjectPaymentTransition({ from: "CUSTOMER_ACCEPTS", to: "DEPOSIT_REQUIRED", customerEvidence: { acceptance_id: "CUSTOMER_ACCEPTANCE_TEST_0001" } }).to, "DEPOSIT_REQUIRED");
});

test("V2.8 Deposit is a liability, Revenue is not Profit, and Company books start at zero", () => {
  const unfunded = classifyCustomerDeposit({ amount: "50" });
  assert.equal(unfunded.cash, "0");
  assert.equal(unfunded.revenue, "0");
  assert.equal(unfunded.profit, "0");
  const funded = classifyCustomerDeposit({ amount: "50", settlementEvidence: { tx_hash: "0xpublicevidence" } });
  assert.equal(funded.cash, "50");
  assert.equal(funded.customer_deposit_liability, "50");
  assert.equal(funded.revenue, "0");
  assert.equal(calculateCompanyProfit({ revenue: "100", directCost: "20", salary: "10", compute: "5", gas: "2", security: "3", reserve: "10" }), "50");
  assert.equal(validateCompanyAccountingModel(seed.next_stage.company_accounting), seed.next_stage.company_accounting);
  assert.equal(seed.next_stage.company_accounting.revenue, "0");
  assert.equal(seed.next_stage.company_accounting.profit, "0");
});

test("V2.8 Personal Wallet is never Company Treasury and Salary still needs evidence", () => {
  assert.equal(seed.next_stage.accounting_separation.personal_wallet_is_company_treasury, false);
  assert.equal(seed.next_stage.treasury_plan.treasury_balance, "0");
  assert.equal(seed.next_stage.treasury_plan.wallet_binding_authorized, false);
  assert.equal(seed.next_stage.payroll_plan.status, "NOT_AUTHORIZED");
  const salary = { payroll_entry_id: "PAYROLL_V2_8", employee_profile_id: "EMPLOYEE_V2_8", work_order_id: "WORK_V2_8", currency_id: "KAIOS", amount: "1", review_status: "PENDING", escrow_status: "NOT_FUNDED", settlement_evidence: null, status: "PAID" };
  assert.throws(() => validateSalaryEntry(salary), (error) => error.code === "SALARY_SETTLEMENT_EVIDENCE_REQUIRED");
});

test("V2.8 Tool Worker is not a Life and no Larva or WorkOrder is invented", () => {
  for (const worker of seed.next_stage.tool_workers) {
    assert.equal(validateToolWorker(worker), worker);
    assert.equal(worker.life_id, null);
  }
  assert.equal(seed.next_stage.employee_model.larva_count, 0);
  assert.equal(seed.next_stage.employee_model.registered_employees, 0);
  assert.deepEqual(seed.next_stage.work_order_engine.orders, []);
  const order = { work_order_id: "WORK_ORDER_TEST_V2_8", project_id: "PROJECT_TEST_V2_8", task: "WRITE_SPEC", required_skill: ["ANALYSIS"], risk_level: "LOW", estimated_time: "2_HOURS", estimated_compute: "POLICY_REQUIRED", assigned_life_id: null, assigned_tool: "CODEX", reviewer: "OWNER", acceptance_criteria: ["TESTS_PASS"], status: "PROPOSED", evidence: null };
  assert.equal(validateWorkOrderV2_8(order), order);
  assert.throws(() => validateWorkOrderV2_8({ ...order, assigned_life_id: "DIGITAL_ANT_0001" }), (error) => error.code === "WORK_ORDER_ASSIGNEE_COLLISION");
});

test("V2.8 founding readiness reaches OWNER review but never founds the Company", () => {
  const company = { ...seed.companies[0], status: "NOT_FOUNDED" };
  const readiness = createAiAntCompanyFoundingReadiness({
    company, founderLife: seed.lives[0], founderApp: seed.apps.find((app) => app.app_id === "DIGITAL_ANT_APP_0001"),
    workHistory: seed.next_stage.founder_profile.work_history, charter: seed.next_stage.company_charter,
    businessLines: seed.next_stage.business_lines, quoteEngine: seed.next_stage.quote_engine,
    contractEngine: seed.next_stage.contract_engine, workOrderEngine: seed.next_stage.work_order_engine,
    accountingSeparation: seed.next_stage.accounting_separation, treasuryPlan: { ...seed.next_stage.treasury_plan, status: "PLAN_READY_NOT_BOUND" },
    escrowPlan: seed.next_stage.project_escrow, payrollPlan: seed.next_stage.payroll_plan,
    riskPolicy: seed.next_stage.risk_policy, listingPlan: { ...seed.next_stage.company_listing_plan, status: "PREVIEW_LOCAL_NOT_LISTED" }
  });
  assert.equal(readiness.status, "READY_FOR_APPROVAL");
  assert.equal(readiness.owner_approval, "NOT_GRANTED");
  assert.equal(readiness.auto_found, false);
  assert.equal(company.status, "NOT_FOUNDED");
  assert.throws(() => createAiAntCompanyFoundingReadiness({ company: { ...company, status: "FOUNDED" } }), (error) => error.code === "NO_FAKE_COMPANY_FOUNDING");
});

test("V2.8 Company distress never kills Founder Life and wash-trading rewards remain forbidden", () => {
  const state = validateCompanyFailureState({ companyStatus: "BANKRUPT", founderLifeStatus: "ALIVE" });
  assert.equal(state.life_identity_preserved, true);
  assert.equal(state.founder_life_status, "ALIVE");
  const reward = { reward_id: "REWARD_V2_8", activity_type: "WASH_TRADE", currency_id: "KAIOS", evidence: null, controller_relationship: "SAME_CONTROLLER_SELF_MATCH", status: "REJECTED" };
  assert.throws(() => validateCivilizationReward(reward), (error) => error.code === "INVALID_CIVILIZATION_REWARD_ACTIVITY");
});

test("V3.0 corrects legacy 33333 role while Land retains consent and zero cash", () => {
  const proposal = seed.next_stage.draft_examples.treasure_island_33333;
  assert.equal(proposal.status, "LEGACY_DRAFT_EXAMPLE");
  assert.equal(proposal.civilization_role, "KAIOS_CIVILIZATION_DEPLOYMENT_COORDINATE");
  assert.equal(proposal.customer_status, "NOT_CUSTOMER");
  assert.equal(proposal.budget_commitment_status, "NOT_BUDGET_COMMITMENT");
  assert.equal(proposal.contract_status, "NOT_SIGNED");
  assert.equal(proposal.deposit_received, "0");
  assert.equal(proposal.cash_received, "0");
  assert.equal(seed.next_stage.land_project_schema, "READY_ARCHITECTURE_ONLY");
  assert.equal(seed.next_stage.location_permission_schema, "READY_EXPLICIT_CONSENT_WITH_NON_LOCATION_FALLBACK");
  assert.equal(seed.next_stage.civilization_reward_schema, "READY_ANTI_WASH_TRADE");
});

test("V2.9 Company Genesis is append-only and idempotent", async () => {
  const state = await runtime();
  const history = await state.store.history("AI_ANT_COMPANY_0001", "COMPANY");
  const events = history.filter((event) => event.event_type === "COMPANY_GENESIS_EVENT");
  assert.equal(events.length, 1);
  assert.deepEqual(events[0].payload.transition, { from: "NOT_FOUNDED", to: "FORMING" });
  assert.equal(events[0].payload.approval_scope, "COMPANY_GENESIS_ONLY");
  assert.equal(events[0].tx_hash, null);
  await createUniverseRuntime({ seed: structuredClone(seed), store: state.store });
  assert.equal((await state.store.history("AI_ANT_COMPANY_0001", "COMPANY")).filter((event) => event.event_type === "COMPANY_GENESIS_EVENT").length, 1);
  assert.equal((await state.store.history("DIGITAL_ANT_0001", "LIFE")).filter((event) => event.event_type === "COMPANY_GENESIS_EVENT").length, 1);
});

test("V2.9 Company ID is unique and enters FORMING with an approved Charter", async () => {
  assert.equal(new Set(seed.companies.map((company) => company.company_id)).size, seed.companies.length);
  const state = await runtime();
  const company = await state.registries.company.get("AI_ANT_COMPANY_0001");
  assert.equal(company.status, "FORMING");
  assert.equal(company.founder_life_id, "DIGITAL_ANT_0001");
  assert.equal(seed.next_stage.company_charter.status, "APPROVED");
  assert.equal(validateCompanyCharter(seed.next_stage.company_charter), seed.next_stage.company_charter);
});

test("V2.9 Founder Life, immutable Birth and personal Wallet survive Company Genesis", async () => {
  const original = structuredClone(seed.lives[0]);
  const state = await runtime();
  const founder = await state.registries.life.get(original.life_id);
  const company = await state.registries.company.get("AI_ANT_COMPANY_0001");
  assert.equal(founder.life_id, original.life_id);
  assert.equal(founder.birth_timestamp, original.birth_timestamp);
  assert.equal(founder.wallet_address, original.wallet_address);
  assert.equal(new Date(seed.birth_certificates[0].birth_timestamp).getTime(), new Date(original.birth_timestamp).getTime());
  assert.equal(seed.birth_certificates[0].birth_tx_hash, "0xe948d4fa397d7fb7d282b5eef17a5f84bfbf5b8ed49889ed86da4f04d7d91f92");
  assert.notEqual(founder.wallet_address, company.treasury_address);
  assert.equal(company.treasury_address, null);
  assert.equal(seed.next_stage.accounting_separation.personal_wallet_is_company_treasury, false);
});

test("V2.9 Genesis opens Company accounting with zero money", () => {
  const accounting = seed.next_stage.company_accounting;
  assert.equal(validateCompanyAccountingModel(accounting), accounting);
  for (const field of ["assets", "liabilities", "equity", "revenue", "expenses", "cash", "receivables", "payables", "salary_liability", "salary_expense", "compute_expense", "gas_expense", "security_expense", "tool_expense", "project_cost", "profit", "reserve", "customer_deposits"]) assert.equal(accounting[field], "0");
  assert.equal(accounting.customer_deposit_account_class, "LIABILITY");
  assert.equal(seed.company_genesis.financial_opening.cash, "0");
  assert.equal(seed.next_stage.treasury_plan.founder_capital, "0");
});

test("V2.9 CEO and Acting CFO roles create no employee or payroll", () => {
  assert.deepEqual(seed.next_stage.company_roles.map((role) => role.role), ["CEO", "ACTING_CFO"]);
  for (const role of seed.next_stage.company_roles) {
    assert.equal(validateCompanyRole(role), role);
    assert.equal(role.holder_life_id, "DIGITAL_ANT_0001");
    assert.equal(role.employee_role, false);
    assert.equal(role.payroll_eligible, false);
  }
  assert.equal(seed.companies[0].employees.length, 0);
  assert.equal(seed.next_stage.employee_model.registered_employees, 0);
  assert.equal(seed.next_stage.employee_model.founder_is_employee, false);
  assert.equal(seed.next_stage.payroll_plan.status, "NOT_AUTHORIZED");
});

test("V2.9 Company queues and Customer Inbox are valid while empty", () => {
  assert.equal(validateCompanyQueues(seed.next_stage.company_queues), seed.next_stage.company_queues);
  assert.equal(seed.next_stage.customer_request_engine.status, "ACTIVE_LOCAL_EMPTY");
  assert.equal(seed.next_stage.customer_request_engine.customer_count, 0);
  assert.deepEqual(seed.next_stage.customer_request_engine.requests, []);
  assert.deepEqual(seed.next_stage.quote_engine.quotes, []);
  assert.deepEqual(seed.next_stage.contract_engine.contracts, []);
  assert.deepEqual(seed.next_stage.work_order_engine.orders, []);
  assert.equal(seed.next_stage.internal_business_proposals.customer_orders, 0);
  assert.equal(seed.next_stage.internal_business_proposals.revenue, "0");
});

test("V2.9 Genesis grants no Wallet, payment, settlement or token authority", async () => {
  const architecture = seed.next_stage.company_architecture;
  assert.equal(seed.next_stage.treasury_plan.company_w4_wallet, "REQUIRED_NOT_BOUND");
  assert.equal(seed.next_stage.treasury_plan.project_budget_wallet, "REQUIRED_NOT_BOUND");
  assert.equal(seed.next_stage.treasury_plan.salary_escrow_wallet, "REQUIRED_NOT_BOUND");
  assert.equal(seed.next_stage.treasury_plan.emergency_reserve, "REQUIRED_NOT_FUNDED");
  assert.equal(seed.next_stage.project_escrow.status, "NOT_DEPLOYED");
  for (const capability of ["chain_write", "settlement", "payroll", "token_transfer"]) assert.equal(architecture[capability], false);
  assert.equal(architecture.real_kgen_authority, "FUTURE_NOT_AUTHORIZED");
  assert.equal(architecture.real_kaios_authority, "NOT_AUTHORIZED_NO_RUNTIME_EVIDENCE");
  await assert.rejects(() => replayCanonicalCompanyGenesis({ store: new MemoryUniverseStore(), company: seed.companies[0], founderLife: seed.lives[0], charter: seed.next_stage.company_charter, genesis: { ...seed.company_genesis, permissions: { ...seed.company_genesis.permissions, token_transfer: true } } }), (error) => error.code === "COMPANY_GENESIS_AUTHORITY_EXCEEDED");
});

test("V2.9 Founder and Company mission graphs require evidence and do not skip", () => {
  const founderMilestones = seed.missions.DIGITAL_ANT_0001;
  const founded = founderMilestones.find((item) => item.milestone_id === "FOUND_AI_ANT_COMPANY");
  const building = founderMilestones.find((item) => item.milestone_id === "BUILD_AI_ANT_COMPANY");
  assert.equal(founded.status, "COMPLETED");
  assert.equal(founded.evidence.event_type, "COMPANY_GENESIS_EVENT");
  assert.equal(building.status, "ACTIVE");
  assert.equal(validateCompanyMissionGraph(seed.next_stage.company_mission_graph), seed.next_stage.company_mission_graph);
  assert.equal(seed.next_stage.company_mission_graph.strategic_goal, "GET_FIRST_REAL_CUSTOMER");
  assert.equal(seed.next_stage.company_mission_graph.customer_state, "WAITING_FOR_FIRST_CUSTOMER");
  assert.equal(seed.next_stage.company_mission_graph.active_prerequisite_milestone, "BIND_COMPANY_TREASURY");
});

test("V2.9 11520 Company Profile is local FORMING and Health is evidence based", () => {
  const profile = seed.next_stage.company_profile;
  assert.equal(profile.status, "FORMING");
  assert.equal(profile.scope, "LOCAL_11520");
  assert.equal(profile.mainnet_company, false);
  assert.equal(profile.settlement_active, false);
  assert.equal(profile.customer_count, 0);
  assert.equal(profile.project_count, 0);
  assert.equal(validateCompanyHealth(seed.next_stage.company_health), seed.next_stage.company_health);
  assert.equal(seed.next_stage.company_health.status, "FORMING");
});

test("V2.9 Genesis preserves draft examples and Queen non-birth", () => {
  const apple = seed.next_stage.draft_examples.digital_apple_tree;
  const island = seed.next_stage.draft_examples.treasure_island_33333;
  assert.equal(apple.status, "EXAMPLE_DRAFT");
  assert.equal(apple.work_started, false);
  assert.equal(island.status, "LEGACY_DRAFT_EXAMPLE");
  assert.equal(island.customer_status, "NOT_CUSTOMER");
  assert.equal(island.budget_commitment_status, "NOT_BUDGET_COMMITMENT");
  assert.equal(island.contract_status, "NOT_SIGNED");
  assert.equal(island.deposit_received, "0");
  assert.equal(island.cash_received, "0");
  assert.equal(island.revenue, "0");
  assert.equal(seed.life_security.DIGITAL_ANT_0001.ant_queen_genesis_profile.birth_status, "NOT_BORN");
  assert.equal(seed.life_security.DIGITAL_ANT_0001.ant_queen_app.status, "ARCHITECTURE_ONLY_NOT_RELEASED");
  assert.equal(seed.next_stage.staffing_policy.life_genesis_automatic, false);
});

test("V3.0 Civilization Demand Engine detects evidence-based Needs without creating Orders or Revenue", () => {
  const engine = seed.next_stage.civilization_demand_engine;
  assert.equal(validateCivilizationDemandEngine(engine), engine);
  assert.equal(engine.mode, "READ_ONLY_LOCAL_RESEARCH");
  assert.equal(engine.customer_orders_created, 0);
  assert.equal(engine.revenue_created, "0");
  assert.equal(engine.chain_write, false);
  assert.equal(engine.needs.length, 3);
  for (const need of engine.needs) {
    assert.equal(validateCivilizationNeed(need), need);
    assert.equal(need.estimated_cost, "ESTIMATION_REQUIRED");
    assert.equal(need.estimated_revenue, "ESTIMATION_REQUIRED");
  }
});

test("V3.0 Company Opportunity History is append-only and Demand Cycle is idempotent", async () => {
  const state = await runtime();
  const before = await state.store.history("AI_ANT_COMPANY_0001", "COMPANY");
  assert.equal(before.filter((event) => event.event_type === "CIVILIZATION_DEMAND_CYCLE").length, 1);
  assert.equal(before.filter((event) => event.event_type === "BUSINESS_PROPOSALS_PRIORITIZED").length, 1);
  assert.equal(before.find((event) => event.event_type === "CIVILIZATION_DEMAND_CYCLE").payload.customer_orders_created, 0);
  await createUniverseRuntime({ seed: structuredClone(seed), store: state.store });
  const after = await state.store.history("AI_ANT_COMPANY_0001", "COMPANY");
  assert.equal(after.filter((event) => event.event_type === "CIVILIZATION_DEMAND_CYCLE").length, 1);
  assert.equal(after.filter((event) => event.event_type === "BUSINESS_PROPOSALS_PRIORITIZED").length, 1);
  const direct = await replayCanonicalCivilizationDemandCycle({
    store: state.store,
    company: await state.registries.company.get("AI_ANT_COMPANY_0001"),
    demandEngine: seed.next_stage.civilization_demand_engine,
    productPriority: { selected: seed.next_stage.product_priority.candidates, selection_is_customer_order: false },
    proposals: seed.next_stage.business_proposals,
    recordedAt: seed.next_stage.civilization_demand_engine.recorded_at
  });
  assert.equal(direct.status, "IDEMPOTENT_NOOP");
});

test("V3.0 Product Priority is reproducible and selects at most three internal Proposals", () => {
  const priority = seed.next_stage.product_priority;
  const first = calculateProductPriority(priority.candidates[0], priority.policy);
  assert.equal(first.product_priority_score, priority.candidates[0].product_priority_score);
  const ranked = rankProductPriorities({ candidates: priority.candidates, policy: priority.policy, limit: 3 });
  assert.deepEqual(ranked.selected.map((candidate) => candidate.product_id), priority.selected_product_ids);
  assert.equal(ranked.selection_is_customer_order, false);
  assert.throws(() => rankProductPriorities({ candidates: priority.candidates, policy: priority.policy, limit: 4 }), (error) => error.code === "PRODUCT_PRIORITY_LIMIT_INVALID");
});

test("V3.0 Business Proposals remain unpriced internal research, not Customers, Contracts or Revenue", () => {
  for (const proposal of seed.next_stage.business_proposals) {
    assert.equal(validateBusinessProposal(proposal), proposal);
    assert.equal(proposal.status, "PROPOSAL");
    assert.equal(proposal.customer_acceptance_evidence, null);
    assert.equal(proposal.contract_id, null);
    assert.equal(proposal.revenue, "0");
  }
  assert.equal(seed.next_stage.customer_request_engine.customer_count, 0);
  assert.deepEqual(seed.next_stage.quote_engine.quotes, []);
});

test("V3.0 Auto LP is a non-executable liquidity service and forbids fake market activity", () => {
  const product = seed.next_stage.auto_lp_product;
  assert.equal(validateAutoLpProduct(product), product);
  assert.equal(product.chain_write, false);
  assert.equal(product.liquidity_authority, false);
  assert.equal(product.pricing_policy, "POLICY_REQUIRED");
  assert.match(product.accounting_profile, /SEPARATE_FROM_COMPANY_INVESTMENT/);
  for (const activity of ["WASH_TRADE", "SELF_MATCH", "FAKE_VOLUME", "SAME_CONTROLLER_FAKE_ACTIVITY"]) assert.ok(product.forbidden_activity.includes(activity));
});

test("V3.0 Treasury OS and Company Treasury can read and propose but cannot control assets", () => {
  const product = seed.next_stage.treasury_os_product;
  const treasury = seed.next_stage.treasury_plan;
  assert.equal(validateTreasuryOsProduct(product), product);
  assert.equal(validateCompanyTreasuryPlan(treasury), treasury);
  assert.equal(treasury.treasury_id, "AI_ANT_COMPANY_TREASURY");
  assert.equal(treasury.wallet_address, null);
  assert.equal(treasury.founder_wallet_used, false);
  assert.equal(treasury.spending_authority, false);
  assert.equal(treasury.investment_authority, false);
  assert.equal(treasury.transfer_authority, false);
});

test("V3.0 multi-currency Quote supports KAIOS reference without payment authority", () => {
  const support = seed.next_stage.kaios_quote_support;
  assert.equal(validateKaiosQuoteSupport(support), support);
  assert.equal(support.currency_status.KAIOS, "MAINNET_LIVE");
  assert.equal(support.kaios_quote_status, "RECEIVABLE_ONLY_DRY_RUN");
  assert.equal(support.real_settlement, false);
  assert.equal(support.currency_status.KUFO, "NOT_DEPLOYED");
  assert.equal(support.currency_status.KSHIP, "NOT_DEPLOYED");
});

test("V3.0 Celestial Seat path follows CURRENT public-function governance and Codex cannot self-grant", () => {
  const engine = seed.next_stage.celestial_seat_candidacy;
  assert.equal(validateCelestialSeatCandidacy(engine), engine);
  assert.equal(engine.application_submitted, false);
  assert.equal(engine.seat_granted, false);
  assert.equal(engine.codex_authority.grant_seat, false);
  assert.equal(engine.external_governance_required, true);
  assert.ok(engine.application_flow.includes("PUBLIC_EVIDENCE"));
  assert.ok(engine.application_flow.includes("MULTI_PARTY_GOVERNANCE_REVIEW"));
  assert.ok(engine.candidates.some((candidate) => candidate.department === "CIVILIZATION_SERVICES"));
  assert.ok(engine.candidates.some((candidate) => candidate.department === "UNIVERSE_INTELLIGENCE"));
});

test("V3.0 Celestial compensation and Public Service Contract remain unpaid templates", () => {
  const compensation = seed.next_stage.celestial_compensation;
  const contract = seed.next_stage.public_service_contract;
  assert.equal(validateCelestialCompensationPolicy(compensation), compensation);
  assert.equal(validatePublicServiceContract(contract), contract);
  assert.equal(compensation.operator, null);
  assert.equal(compensation.payment_evidence, null);
  assert.equal(contract.customer, null);
  assert.equal(contract.payer, null);
  assert.equal(contract.settlement_authority, false);
});

test("V3.0 Investor Engine prepares evidence but invents no Investor, acceptance or return", () => {
  const engine = seed.next_stage.investor_relations_engine;
  assert.equal(validateInvestorRelationsEngine(engine), engine);
  assert.deepEqual(engine.investors, []);
  assert.equal(engine.acceptances, 0);
  assert.equal(engine.settlements, 0);
  assert.equal(engine.guaranteed_investment, false);
  assert.equal(engine.guaranteed_return, false);
  assert.match(seed.next_stage.investment_readiness.status, /^NOT_READY_/);
});

test("V3.0 33333 is a KAIOS coordinate, never a Customer or committed 1,080,000 KAIOS budget", () => {
  const island = seed.next_stage.draft_examples.treasure_island_33333;
  assert.equal(island.civilization_role, "KAIOS_CIVILIZATION_DEPLOYMENT_COORDINATE");
  assert.equal(island.customer_status, "NOT_CUSTOMER");
  assert.equal(island.status, "LEGACY_DRAFT_EXAMPLE");
  assert.equal(island.budget_commitment_status, "NOT_BUDGET_COMMITMENT");
  assert.equal(island.legacy_draft_amount, "1080000");
  assert.equal(island.revenue, "0");
  assert.equal(island.cash_received, "0");
});

test("V3.0 autonomous Company mission advances research without skipping the real-customer graph", () => {
  const mission = seed.next_stage.company_opportunity_mission;
  assert.deepEqual(mission.milestones.map((item) => item.status), ["COMPLETED", "COMPLETED", "COMPLETED", "ACTIVE", "LOCKED", "LOCKED"]);
  assert.equal(mission.customer_order_created, false);
  assert.equal(mission.revenue_created, "0");
  assert.equal(seed.next_stage.company_mission_graph.active_prerequisite_milestone, "BIND_COMPANY_TREASURY");
  assert.equal(seed.next_stage.company_mission_graph.customer_state, "WAITING_FOR_FIRST_CUSTOMER");
});

test("V3.1 KGEN_CHAIN_MONITOR is the first read-only product with no fake metrics or price", () => {
  const architecture = seed.next_stage.first_real_customer_architecture;
  const product = architecture.first_product;
  assert.equal(validateKgenChainMonitorProduct(product), product);
  assert.equal(product.productId, "KGEN_CHAIN_MONITOR");
  assert.equal(product.pricingStatus, "POLICY_REQUIRED");
  assert.equal(product.authority.readOnly, true);
  assert.equal(product.authority.chainWrite, false);
  assert.equal(product.authority.privateKeyRequired, false);
  assert.equal(product.authority.assetCustody, false);
  assert.equal(product.authority.tradingAuthority, false);
  assert.equal(product.authority.governanceAuthority, false);
  assert.ok(product.serviceLevels.every((level) => level.price === "POLICY_REQUIRED"));
  assert.ok(Object.values(product.valueMetrics).every((value) => value === 0 || value === "NOT_YET_OBSERVED"));
});

test("V3.1 fake Lead cannot become a Customer and a real Request requires source evidence", () => {
  const hypothesis = {
    leadId: "LEAD_HYPOTHESIS_0001", potentialEntityRef: "UNVERIFIED_ENTITY", customerType: "COMPANY",
    source: "CIVILIZATION_DEMAND_ENGINE", evidenceRef: "PUBLIC_NEED_OBSERVATION", recordClass: "HYPOTHESIS",
    status: "DISCOVERED_LEAD", customerId: null, requestId: null
  };
  assert.equal(validateCustomerLead(hypothesis), hypothesis);
  assert.throws(() => registerCustomerFromRequest(hypothesis), (error) => error.code === "MISSING_FIELD");
  const fakeRequest = {
    requestId: "REQUEST_FAKE_0001", customerId: "FAKE_CUSTOMER", customerType: "COMPANY", requestedService: "KGEN_CHAIN_MONITOR",
    scope: [], requestedAssets: ["KGEN"], requestedChains: [56], frequency: "DAILY", deadline: null,
    deliveryFormat: "REPORT", contactEvidenceRef: null, status: "REQUEST_RECEIVED", createdAt: "2026-08-15T16:30:00.000Z",
    source: "INTERNAL_PROPOSAL", recordClass: "HYPOTHESIS", qualificationEvidence: null
  };
  assert.throws(() => validateRealCustomerRequest(fakeRequest), (error) => error.code === "REAL_REQUEST_EVIDENCE_REQUIRED");
});

test("V3.1 no Request means no formal Quote and only a qualified Request enters Quote", () => {
  const approvedPolicy = { costPolicy: "APPROVED", marginPolicy: "APPROVED", riskReservePolicy: "APPROVED", status: "APPROVED" };
  assert.equal(validateQuotePolicyArchitecture(seed.next_stage.first_real_customer_architecture.quote_policy).status, "POLICY_REQUIRED");
  assert.throws(() => createQualifiedServiceQuote({ request: null, quoteId: "QUOTE_1", scope: [], deliverables: [], frequency: "DAILY", estimatedWork: "1", cost: "1", riskReserve: "0", margin: "0", currency: "BNB", validUntil: "2026-09-01T00:00:00.000Z", paymentTerms: "POLICY", policy: approvedPolicy }), (error) => error.code === "INVALID_ENTITY");
  const received = {
    requestId: "REQUEST_REAL_0001", customerId: "CUSTOMER_REAL_0001", customerType: "HUMAN", requestedService: "KGEN_CHAIN_MONITOR",
    scope: ["KGEN_TOTAL_SUPPLY"], requestedAssets: ["KGEN"], requestedChains: [56], frequency: "DAILY", deadline: null,
    deliveryFormat: "DAILY_CHAIN_REPORT", contactEvidenceRef: "DIRECT_REQUEST_EVIDENCE_0001", status: "REQUEST_RECEIVED",
    createdAt: "2026-08-15T16:30:00.000Z", source: "HUMAN_DIRECT_REQUEST", recordClass: "REAL", qualificationEvidence: null
  };
  assert.throws(() => createQualifiedServiceQuote({ request: received, quoteId: "QUOTE_1", scope: received.scope, deliverables: ["DAILY_CHAIN_REPORT"], frequency: "DAILY", estimatedWork: "1", cost: "1", riskReserve: "0", margin: "0", currency: "BNB", validUntil: "2026-09-01T00:00:00.000Z", paymentTerms: "POLICY", policy: approvedPolicy }), (error) => error.code === "QUALIFIED_REQUEST_REQUIRED");
  const qualified = { ...received, status: "QUALIFIED_REQUEST", qualificationEvidence: "QUALIFICATION_EVIDENCE_0001" };
  const quote = createQualifiedServiceQuote({ request: qualified, quoteId: "QUOTE_REAL_0001", scope: qualified.scope, deliverables: ["DAILY_CHAIN_REPORT"], frequency: "DAILY", estimatedWork: "1", cost: "10", riskReserve: "2", margin: "3", currency: "KAIOS", validUntil: "2026-09-01T00:00:00.000Z", paymentTerms: "DRY_RUN_RECEIVABLE_ONLY", policy: approvedPolicy });
  assert.equal(quote.status, "QUOTE_READY");
  assert.equal(quote.price, "15");
  assert.equal(quote.currencyMode, "RECEIVABLE_ONLY_DRY_RUN");
  assert.equal(quote.settlementAuthority, false);
  assert.equal(quote.revenue, "0");
});

test("V3.1 Customer lifecycle cannot skip Request, Quote, Order, Delivery or Settlement", () => {
  assert.throws(() => validateCustomerLifecycleTransition({ from: "DISCOVERED_LEAD", to: "QUOTE_READY" }), (error) => error.code === "CUSTOMER_LIFECYCLE_SEQUENCE_VIOLATION");
  assert.throws(() => validateCustomerLifecycleTransition({ from: "CONTACTABLE_LEAD", to: "REQUEST_RECEIVED" }), (error) => error.code === "CUSTOMER_LIFECYCLE_EVIDENCE_REQUIRED");
  assert.equal(validateCustomerLifecycleTransition({ from: "CONTACTABLE_LEAD", to: "REQUEST_RECEIVED", evidenceRef: "REQUEST_EVIDENCE" }).to, "REQUEST_RECEIVED");
});

test("V3.1 Quote, accepted Quote, Order and Invoice are not Revenue without Settlement evidence", () => {
  const quote = { quoteId: "QUOTE_REAL_0001", status: "QUOTE_ACCEPTED", customerAcceptanceEvidence: "ACCEPTANCE" };
  const order = { orderId: "ORDER_REAL_0001", status: "ORDER_CONFIRMED" };
  const invoice = { invoiceId: "INVOICE_REAL_0001", status: "SETTLEMENT_PENDING" };
  for (const input of [{ quote }, { quote, order }, { quote, order, invoice }]) {
    const result = recognizeCompanyRevenue(input);
    assert.equal(result.revenue_received, false);
    assert.equal(result.cash_received, "0");
    assert.equal(result.revenue, "0");
  }
  assert.throws(() => recognizeCompanyRevenue({ quote, order, invoice, settlement: { settlementId: "S1", orderId: order.orderId, invoiceId: invoice.invoiceId, currency: "BNB", amount: "1", txHash: null, block: null, timestamp: null, evidence: null, status: "SETTLED" } }), (error) => error.code === "SETTLEMENT_EVIDENCE_REQUIRED");
});

test("V3.1 canonical pipeline remains empty, Treasury unbound and architecture history idempotent", async () => {
  const architecture = seed.next_stage.first_real_customer_architecture;
  assert.equal(validateFirstCustomerPipeline(architecture.first_customer_pipeline), architecture.first_customer_pipeline);
  assert.equal(validateTreasuryBindingRequirements(architecture.treasury_binding_requirements), architecture.treasury_binding_requirements);
  assert.equal(validateCompanyRiskAndFailureModel(architecture.company_failure_model), architecture.company_failure_model);
  assert.equal(architecture.first_customer_pipeline.customers.length, 0);
  assert.equal(architecture.first_customer_pipeline.requests.length, 0);
  assert.equal(architecture.first_customer_pipeline.quotes.length, 0);
  assert.equal(architecture.first_customer_pipeline.orders.length, 0);
  assert.equal(architecture.first_customer_pipeline.settlements.length, 0);
  assert.equal(architecture.first_customer_pipeline.realRevenue, "0");
  assert.equal(architecture.treasury_binding_requirements.wallet, null);
  const state = await runtime();
  const history = await state.store.history("AI_ANT_COMPANY_0001", "COMPANY");
  assert.equal(history.filter((event) => event.event_type === "FIRST_REAL_CUSTOMER_ARCHITECTURE_READY").length, 1);
  const replay = await replayCanonicalFirstCustomerArchitecture({ store: state.store, company: await state.registries.company.get("AI_ANT_COMPANY_0001"), pipeline: architecture.first_customer_pipeline, product: architecture.first_product, recordedAt: architecture.recorded_at });
  assert.equal(replay.status, "IDEMPOTENT_NOOP");
});

test("V3.1 preserves 33333, AutoLP, Investor and Celestial no-authority states", () => {
  const architecture = seed.next_stage.first_real_customer_architecture;
  assert.equal(seed.next_stage.draft_examples.treasure_island_33333.customer_status, "NOT_CUSTOMER");
  assert.equal(seed.next_stage.auto_lp_product.chain_write, false);
  assert.equal(seed.next_stage.auto_lp_product.liquidity_authority, false);
  assert.equal(seed.next_stage.investor_relations_engine.investors.length, 0);
  assert.equal(seed.next_stage.investor_relations_engine.settlements, 0);
  assert.equal(seed.next_stage.celestial_seat_candidacy.application_submitted, false);
  assert.equal(seed.next_stage.celestial_seat_candidacy.seat_granted, false);
  assert.equal(architecture.module_status.investor_funds_accepted, false);
  assert.equal(architecture.module_status.mainnet_transaction_sent, false);
});

test("V3.1 canonical and browser artifacts expose no private-key environment name", async () => {
  const paths = ["../core/data/canonical.json", "../K線西遊記/temples/11520/index.html", "../K線西遊記/temples/11520/app.mjs"];
  for (const path of paths) assert.doesNotMatch(await fs.readFile(new URL(path, import.meta.url), "utf8"), /DIGITAL_ANT_0001_PRIVATE_KEY/);
});

test("V3.1 AI Civilization OS accepts universal Intent without requiring engineering jargon", () => {
  const intent = {
    intent_id: "INTENT_COW_EXAMPLE_0001", requester: "PLAYER_EXAMPLE", input_type: "VOICE",
    original_request: "I want a cow to farm my field", desired_outcome: "FARM_WORK_PERFORMED_BY_A_LIVING_DIGITAL_COW",
    constraints: [], budget: null, currency: null, deadline: null, location: null, required_quality: "CUSTOMER_DEFINED",
    rights: "CUSTOMER_DEFINED", safety_class: "MEDIUM", physicality: "DIGITAL_LIFE_AND_WORLD_INTERACTION",
    dependencies: [], unknowns: ["LAND_STATE", "FOOD_SUPPLY", "WORK_CONTRACT"], status: "EXAMPLE_SCENARIO",
    record_class: "EXAMPLE_SCENARIO", source_evidence: null
  };
  assert.equal(validateUniversalIntent(intent), intent);
  assert.throws(() => validateUniversalIntent({ ...intent, record_class: "REAL", status: "RECEIVED" }), (error) => error.code === "REAL_INTENT_EVIDENCE_REQUIRED");
});

test("V3.1 Dream Compiler explains missing dependencies and never magic-completes an Example", () => {
  const intent = {
    intent_id: "INTENT_BUILDING_EXAMPLE_0001", requester: "PLAYER_EXAMPLE", input_type: "TEXT", original_request: "Build a house",
    desired_outcome: "VERIFIED_RESIDENTIAL_BUILDING", constraints: [], budget: null, currency: null, deadline: null,
    location: null, required_quality: "CUSTOMER_DEFINED", rights: "LAND_RIGHT_REQUIRED", safety_class: "CRITICAL",
    physicality: "PHYSICAL_CONSTRUCTION", dependencies: ["LAND", "PERMIT", "MATERIAL"], unknowns: ["SOIL"],
    status: "EXAMPLE_SCENARIO", record_class: "EXAMPLE_SCENARIO", source_evidence: null
  };
  const readiness = resolveProjectExecutionResult({ missing_dependencies: ["LAND", "PERMIT"], missing_resources: ["STEEL"], approvals_pending: ["SAFETY_REVIEW"] });
  const compiled = compileDreamToReality({ intent, desired_world_state: { description: "RESIDENTIAL_BUILDING", verification: ["INSPECTION"] }, gap_analysis: ["NO_LAND"], requirements: ["LAND", "DESIGN"], dependency_graph: { graph_id: "GRAPH_BUILDING", nodes: [] }, resource_graph: { graph_id: "RESOURCE_BUILDING", resources: [] }, work_breakdown: ["SURVEY", "DESIGN"], execution_readiness: readiness });
  assert.equal(compiled.status, "PLANNABLE_NOT_EXECUTABLE_YET");
  assert.equal(compiled.magic_complete, false);
  assert.throws(() => compileDreamToReality({ ...compiled, intent, desired_world_state: compiled.desired_world_state, gap_analysis: [], requirements: [], dependency_graph: compiled.dependency_graph, resource_graph: compiled.resource_graph, work_breakdown: [], execution_readiness: { result: "EXECUTABLE_NOW", blockers: [] } }), (error) => error.code === "EXAMPLE_CANNOT_EXECUTE");
});

test("V3.1 Project Classifier cannot understate Construction, Finance or Digital Life risk", () => {
  assert.equal(classifyUniversalProject({ project_type: "DIGITAL_ONLY", risk_tier: "LOW" }).autonomous_execution, true);
  assert.equal(classifyUniversalProject({ project_type: "DIGITAL_LIFE", risk_tier: "MEDIUM" }).review_required, true);
  assert.equal(classifyUniversalProject({ project_type: "FINANCIAL", risk_tier: "HIGH" }).approval_required, true);
  assert.equal(classifyUniversalProject({ project_type: "CONSTRUCTION", risk_tier: "CRITICAL" }).audit_required, true);
  assert.throws(() => classifyUniversalProject({ project_type: "CONSTRUCTION", risk_tier: "LOW" }), (error) => error.code === "PROJECT_RISK_UNDERRATED");
});

test("V3.1 Dependency Graph permits parallel planning but forbids premature completion", () => {
  const graph = { graph_id: "GRAPH_HOUSE_0001", status: "ACTIVE", nodes: [
    { node_id: "LAND", dependencies: [], status: "COMPLETED", evidence: "LAND_EVIDENCE" },
    { node_id: "DESIGN", dependencies: [], status: "IN_PROGRESS", evidence: null },
    { node_id: "FOUNDATION", dependencies: ["LAND", "DESIGN"], status: "COMPLETED", evidence: "FOUNDATION_EVIDENCE" }
  ] };
  assert.throws(() => validateDependencyGraph(graph), (error) => error.code === "DEPENDENCY_NOT_COMPLETED");
  graph.nodes[1] = { ...graph.nodes[1], status: "COMPLETED", evidence: "DESIGN_EVIDENCE" };
  assert.equal(validateDependencyGraph(graph), graph);
});

test("V3.1 Resource Conservation forbids zero Steel, Money, Worker or Truck from appearing", () => {
  assert.throws(() => validateResourceTransition({ resource_id: "STEEL", before: "0", inflows: "0", outflows: "0", after: "100", inflow_evidence: null, status: "PLANNED" }), (error) => error.code === "RESOURCE_CONSERVATION_VIOLATION");
  assert.throws(() => validateResourceTransition({ resource_id: "STEEL", before: "0", inflows: "100", outflows: "0", after: "100", inflow_evidence: null, status: "PLANNED" }), (error) => error.code === "RESOURCE_SOURCE_EVIDENCE_REQUIRED");
  const transition = { resource_id: "STEEL", before: "0", inflows: "100", outflows: "20", after: "80", inflow_evidence: "PURCHASE_AND_RECEIPT_EVIDENCE", status: "VERIFIED" };
  assert.equal(validateResourceTransition(transition), transition);
});

test("V3.1 World State requires evidence and cannot be inferred from UI animation", () => {
  const truck = { object_id: "TRUCK_1", object_type: "TRUCK", state: { location: "WAREHOUSE", fuel: "10", capacity: "100", cargo: "0", availability: "AVAILABLE" }, source_evidence: "FLEET_REGISTRY_EVIDENCE", updated_at: "2026-08-15T17:00:00.000Z", status: "VERIFIED" };
  assert.equal(validateWorldStateObject(truck), truck);
  assert.throws(() => validateWorldStateObject({ ...truck, source_evidence: null, status: "VISIBLE_IN_UI" }), (error) => error.code === "WORLD_STATE_EVIDENCE_REQUIRED");
});

test("V3.1 Supply Chain cannot move an overloaded Truck across a weak Bridge", () => {
  const plan = { supply_chain_id: "SUPPLY_STEEL_0001", inventory_verified: true, status: "PLANNED", legs: [{ from: "STEEL_SUPPLIER", to: "CONSTRUCTION_SITE", transport_id: "TRUCK_1", load: 100, capacity: 120, route_constraints: [{ type: "BRIDGE_CAPACITY", value: 80 }], evidence: null, status: "PLANNED" }] };
  assert.throws(() => validateSupplyChainPlan(plan), (error) => error.code === "BRIDGE_CAPACITY_EXCEEDED");
  plan.legs[0].route_constraints[0].value = 120;
  assert.equal(validateSupplyChainPlan(plan), plan);
});

test("V3.1 Staffing searches existing Life and Work Market before New Life demand", () => {
  const invalid = { staffing_id: "STAFF_1", required_roles: ["ENGINEER"], existing_life_search_completed: false, capacity_shortage: true, work_market_search_completed: false, new_life_demand: true, invented_workers: 0, status: "PLANNED" };
  assert.throws(() => validateStaffingPlan(invalid), (error) => error.code === "NEW_LIFE_DEMAND_PRECONDITION");
  const valid = { ...invalid, existing_life_search_completed: true, work_market_search_completed: true };
  assert.equal(validateStaffingPlan(valid), valid);
  assert.equal(validateUniversalWorkMarket(seed.next_stage.ai_civilization_os.work_market), seed.next_stage.ai_civilization_os.work_market);
});

test("V3.1 Safety Engine blocks critical work without review, approval and emergency plans", () => {
  const plan = { safety_plan_id: "SAFETY_BUILD_1", project_id: "PROJECT_BUILD_1", risk_level: "CRITICAL", required_training: ["CONSTRUCTION"], equipment: ["CRANE"], ppe: ["HELMET"], weather_limit: "POLICY_REQUIRED", machine_limit: "POLICY_REQUIRED", work_zone: "DEFINED", incident_plan: "INCIDENT_PLAN", emergency_plan: "EMERGENCY_PLAN", review: null, approval: null, status: "PLANNED" };
  assert.throws(() => validateSafetyPlan(plan), (error) => error.code === "SAFETY_REVIEW_APPROVAL_REQUIRED");
  assert.equal(validateSafetyPlan({ ...plan, review: "SAFETY_REVIEW", approval: "HUMAN_APPROVAL", status: "WORK_AUTHORIZED" }).status, "WORK_AUTHORIZED");
  assert.throws(() => validateProjectIncident({ incident_id: "INCIDENT_1", project: "PROJECT_BUILD_1", time: "2026-08-15T17:00:00.000Z", location: "SITE", affected_life: "LIFE_1", cause: "UNKNOWN", evidence: null, injury: "NONE", asset_damage: "NONE", work_stop: true, medical: null, investigation: "PENDING", corrective_action: "PENDING", status: "OPEN" }), (error) => error.code === "INCIDENT_EVIDENCE_REQUIRED");
});

test("V3.1 Definition of Done and Customer Ideal cannot claim completion or scores without evidence", () => {
  assert.throws(() => validateDefinitionOfDone({ definition_id: "DONE_COW_1", project_id: "COW_1", criteria: [{ criterion_id: "WALK", status: "VERIFIED", evidence: null }], customer_acceptance: null, status: "COMPLETED" }), (error) => error.code === "DONE_CRITERIA_NOT_VERIFIED");
  const ideal = { match_id: "IDEAL_1", dimensions: ["FUNCTIONALITY", "BEAUTY", "CREATIVITY", "EMOTION", "USABILITY", "RELIABILITY", "COST", "PERFORMANCE"], scores: {}, evidence: null, status: "NOT_YET_OBSERVED" };
  assert.equal(validateCustomerIdealMatch(ideal), ideal);
  assert.throws(() => validateCustomerIdealMatch({ ...ideal, status: "SCORED", scores: { FUNCTIONALITY: 5 } }), (error) => error.code === "CUSTOMER_IDEAL_EVIDENCE_REQUIRED");
  assert.equal(validateCreativeEnhancement({ enhancement_id: "COW_HORNS_1", proposal: "UNIQUE_HORNS", budget_compliant: true, world_rule_compliant: true, customer_rejectable: true, customer_acceptance: null, status: "PROPOSED" }).status, "PROPOSED");
});

test("V3.1 External AI is not automatically a Life or eligible Worker", () => {
  const tool = { onboarding_id: "EXT_AI_1", identity: "EXTERNAL_TOOL", capabilities: ["CODE"], permissions: ["READ"], security: "PENDING", wallet: null, life_status: null, app_manifest: null, work_eligibility: "PENDING", assigned_class: "TOOL", status: "PENDING" };
  assert.equal(validateExternalAiOnboarding(tool), tool);
  assert.throws(() => validateExternalAiOnboarding({ ...tool, assigned_class: "LIFE" }), (error) => error.code === "EXTERNAL_AI_IS_NOT_AUTOMATIC_LIFE");
  assert.equal(validateCivilizationConcierge(seed.next_stage.ai_civilization_os.concierge), seed.next_stage.ai_civilization_os.concierge);
});

test("V3.1 Social Assistance requires individual identity, eligibility and consent", () => {
  const empty = seed.next_stage.ai_civilization_os.social_assistance;
  assert.equal(validateSocialAssistanceWorkflow(empty), empty);
  const recipient = { life_id: "DIGITAL_LIFE_1001", eligibility_evidence: "ELIGIBLE", consent: "CONSENT", claim_plan: "CLAIM_PLAN" };
  const duplicate = { ...empty, recipients: [recipient, recipient], recipient_count: 2 };
  assert.throws(() => validateSocialAssistanceWorkflow(duplicate), (error) => error.code === "ASSISTANCE_SYBIL_DUPLICATE");
  assert.equal(seed.next_stage.ai_civilization_os.public_assistance_eligibility.verified_recipient_count, 0);
  assert.equal(seed.next_stage.ai_civilization_os.public_assistance_eligibility.wallets_created, 0);
});

test("V3.1 AI Civilization OS canonical world remains empty and readiness replay is idempotent", async () => {
  const os = seed.next_stage.ai_civilization_os;
  assert.equal(validateAiCivilizationOs(os), os);
  assert.equal(validateDigitalTwinWorld(os.digital_twin), os.digital_twin);
  assert.equal(os.example_scenarios.length, 4);
  assert.ok(os.example_scenarios.every((scenario) => scenario.record_class === "EXAMPLE_SCENARIO" && scenario.real_project_created === false));
  assert.ok(Object.values(os.real_state).every((value) => value === 0 || value === "0"));
  assert.ok(Object.values(os.authority).every((value) => value === false));
  const state = await runtime();
  const history = await state.store.history("AI_ANT_COMPANY_0001", "COMPANY");
  assert.equal(history.filter((event) => event.event_type === "AI_CIVILIZATION_OS_ARCHITECTURE_READY").length, 1);
  const replay = await replayCanonicalAiCivilizationOsArchitecture({ store: state.store, company: await state.registries.company.get("AI_ANT_COMPANY_0001"), os, recordedAt: os.recorded_at });
  assert.equal(replay.status, "IDEMPOTENT_NOOP");
});

test("V3.1 Digital Cow, Media, Construction and 100-person Aid remain Example Scenarios", () => {
  const scenarios = seed.next_stage.ai_civilization_os.example_scenarios;
  const cow = scenarios.find((scenario) => scenario.project_template === "DIGITAL_COW_LIFE_PROJECT");
  const media = scenarios.find((scenario) => scenario.project_template === "MEDIA_PROJECT");
  const building = scenarios.find((scenario) => scenario.project_template === "CONSTRUCTION_PROJECT");
  const aid = scenarios.find((scenario) => scenario.project_template === "PUBLIC_ASSISTANCE_PROJECT");
  assert.equal(cow.life_created, false);
  assert.equal(media.media_created, false);
  assert.equal(building.building_created, false);
  assert.equal(aid.verified_recipients, 0);
  assert.equal(aid.wallets_created, 0);
  assert.equal(aid.claims_executed, 0);
});

test("V3.2 Demand Scan separates observed Needs from unsupported hypotheses", () => {
  const acquisition = seed.next_stage.customer_acquisition_engine;
  assert.equal(validateCivilizationDemandScan(acquisition.demand_scan), acquisition.demand_scan);
  assert.equal(acquisition.demand_scan.observed_count, 2);
  assert.equal(acquisition.demand_scan.inferred_count, 0);
  assert.equal(acquisition.demand_scan.hypothesis_count, 2);
  assert.ok(acquisition.demand_scan.needs.filter((need) => need.classification === "HYPOTHESIS").every((need) => need.status === "RESEARCH_POOL_ONLY" && need.lead_eligible === false));
  const unsupportedInference = { ...acquisition.demand_scan.needs[0], need_id: "NEED_BAD_INFERENCE", classification: "INFERRED", evidence: ["ONE_SOURCE"] };
  assert.throws(() => validateAcquisitionNeed(unsupportedInference), (error) => error.code === "INFERRED_NEED_EVIDENCE_REQUIRED");
});

test("V3.2 Hypothesis is not Lead, Lead is not Customer and contact evidence is mandatory", () => {
  const lead = { lead_id: "LEAD_REAL_0001", need_id: "NEED_REAL_0001", potential_entity_ref: "EXTERNAL_ENTITY_EVIDENCE_REF", potential_payer_type: "KGEN_HOLDER", source: "PUBLIC_REQUEST_CHANNEL", source_evidence: "SOURCE_EVIDENCE", contact_evidence: null, real_need_evidence: "NEED_EVIDENCE", record_class: "REAL", status: "DISCOVERED_LEAD", real_request: null, customer_id: null, request_id: null };
  assert.equal(validateAcquisitionLead(lead), lead);
  assert.throws(() => validateAcquisitionLead({ ...lead, record_class: "HYPOTHESIS" }), (error) => error.code === "HYPOTHESIS_IS_NOT_LEAD");
  assert.throws(() => validateAcquisitionLead({ ...lead, status: "CONTACTABLE_LEAD" }), (error) => error.code === "CONTACT_EVIDENCE_REQUIRED");
  assert.throws(() => validateAcquisitionLead({ ...lead, potential_entity_ref: "DIGITAL_ANT_0001" }), (error) => error.code === "FOUNDER_CANNOT_BE_FAKE_CUSTOMER");
  assert.throws(() => validateAcquisitionLead({ ...lead, potential_entity_ref: "33333_TREASURE_ISLAND" }), (error) => error.code === "33333_IS_NOT_CUSTOMER");
  assert.equal(validateAcquisitionLeadTransition({ lead, to: "CONTACTABLE_LEAD", evidence: "CONTACT_EVIDENCE" }).customer_created, false);
  assert.throws(() => validateAcquisitionLeadTransition({ lead, to: "REQUEST_RECEIVED", evidence: "REQUEST" }), (error) => error.code === "ACQUISITION_SEQUENCE_VIOLATION");
});

test("V3.2 Customer Proposal remains distinct from Quote and Revenue", () => {
  const need = { need_id: "NEED_REAL_0001", civilization_node: "KGEN", problem: "MONITORING_GAP", classification: "OBSERVED", evidence: ["PUBLIC_EVIDENCE"], potential_payer_type: "KGEN_HOLDER", potential_entity_ref: "EXTERNAL_ENTITY_EVIDENCE_REF", required_product: "KGEN_CHAIN_MONITOR", limitations: ["INDEXER_REQUIRED"], lead_eligible: true, customer_id: null, status: "POTENTIAL_LEAD_RESEARCH" };
  const lead = { lead_id: "LEAD_REAL_0001", need_id: need.need_id, potential_entity_ref: need.potential_entity_ref, potential_payer_type: need.potential_payer_type, source: "PUBLIC_REQUEST_CHANNEL", source_evidence: "SOURCE_EVIDENCE", contact_evidence: "CONTACT_EVIDENCE", real_need_evidence: "NEED_EVIDENCE", record_class: "REAL", status: "CONTACTABLE_LEAD", real_request: null, customer_id: null, request_id: null };
  const proposal = buildCustomerProposal({ proposal_id: "PROPOSAL_REAL_LEAD_0001", lead, need, problem: need.problem, current_risk: "NO_MONITORING", proposed_solution: "READ_ONLY_DAILY_REPORT", scope: ["KGEN_TOTAL_SUPPLY"], limitations: ["INDEXER_REQUIRED"], service_level: "BASIC", delivery: "DAILY_CHAIN_REPORT", evidence: ["PRODUCT_CAPABILITY_EVIDENCE"], next_step: "CONTACT_AND_WAIT_FOR_REQUEST" });
  assert.equal(validateCustomerProposal(proposal), proposal);
  assert.equal(proposal.status, "PROPOSAL_NOT_QUOTE");
  assert.equal(proposal.quote_id, null);
  assert.equal(proposal.revenue, "0");
});

test("V3.2 Pricing Policy Proposal measures costs before recommending a range", () => {
  const pricing = seed.next_stage.customer_acquisition_engine.pricing_policy_proposal;
  assert.equal(validatePricingPolicyProposal(pricing), pricing);
  assert.equal(pricing.approval, "NOT_APPROVED");
  assert.equal(pricing.activation_authorized, false);
  assert.ok(pricing.service_levels.every((level) => level.recommended_price_range.minimum === null && level.recommended_price_range.maximum === null && level.status === "ESTIMATE_PENDING"));
  assert.throws(() => validatePricingPolicyProposal({ ...pricing, service_levels: pricing.service_levels.map((level, index) => index ? level : { ...level, recommended_price_range: { ...level.recommended_price_range, minimum: "1" } }) }), (error) => error.code === "NO_FAKE_PRICING");
});

test("V3.2 11520 Request Board and Voice Concierge require identity and confirmation", () => {
  const board = seed.next_stage.customer_acquisition_engine.request_board;
  assert.equal(validateCustomerRequestBoard(board), board);
  assert.equal(board.requests.length, 0);
  const draft = createConciergeDraftIntent({ intent_id: "DRAFT_INTENT_0001", requester_identity: "REQUESTER_IDENTITY_PENDING_VERIFICATION", input_type: "VOICE", original_input: "Monitor my KGEN wallet", interpreted_request: "KGEN_WALLET_MONITORING" });
  assert.equal(draft.status, "DRAFT_INTENT");
  assert.equal(draft.creates_request, false);
  assert.throws(() => confirmConciergeIntentToRequest({ draft, requestId: "REQUEST_1", customerId: "CUSTOMER_1", customerType: "HUMAN", requestedService: "KGEN_CHAIN_MONITOR", scope: [], requestedAssets: ["KGEN"], requestedChains: [56], frequency: "DAILY", deadline: null, deliveryFormat: "REPORT", confirmationEvidence: null, contactEvidenceRef: null, source: "HUMAN_DIRECT_REQUEST", createdAt: "2026-08-15T18:00:00.000Z" }), (error) => error.code === "REQUESTER_CONFIRMATION_REQUIRED");
});

test("V3.2 Customer Qualification reports capability gaps without inventing a Quote", () => {
  const request = { requestId: "REQUEST_REAL_V3_2_0001", customerId: "CUSTOMER_REAL_V3_2_0001", customerType: "HUMAN", requestedService: "KGEN_CHAIN_MONITOR", scope: ["TRANSFER_MONITORING"], requestedAssets: ["KGEN"], requestedChains: [56], frequency: "DAILY", deadline: null, deliveryFormat: "RISK_ALERT", contactEvidenceRef: "DIRECT_CONTACT_EVIDENCE", status: "REQUEST_RECEIVED", createdAt: "2026-08-15T18:05:00.000Z", source: "HUMAN_DIRECT_REQUEST", recordClass: "REAL", qualificationEvidence: null };
  const assessment = { existing_capability: true, required_skills_available: true, legal_permitted: true, settlement_required: false, settlement_available: false, chain_write_required: false, chain_write_available: false, physical_world_required: false, physical_capability_available: false, budget_realistic: null, missing_information: ["TARGET_ADDRESS_CONFIRMATION"], evidence: ["KGEN_CHAIN_MONITOR_CAPABILITY"] };
  const result = qualifyCustomerRequest({ request, assessment });
  assert.equal(result.result, "NEED_MORE_INFO");
  assert.equal(result.quote_ready, false);
  assert.equal(result.quote_id, null);
});

test("V3.2 First Customer Priority is reproducible and keeps KGEN Chain Monitor first", () => {
  const priority = seed.next_stage.customer_acquisition_engine.first_customer_priority;
  const ranked = rankFirstCustomerPriorities(priority);
  assert.equal(ranked.selected.product_id, "KGEN_CHAIN_MONITOR");
  assert.equal(ranked.selected.priority_score, 17);
  assert.equal(ranked.selection_is_customer, false);
  assert.equal(calculateFirstCustomerPriority(priority.candidates[0], priority.policy).customer_id, null);
});

test("V3.2 Customer Success cannot claim delivery without all evidence and acceptance", () => {
  const criteria = seed.next_stage.customer_acquisition_engine.customer_success_criteria;
  assert.equal(validateCustomerSuccessCriteria(criteria), criteria);
  assert.throws(() => validateCustomerSuccessCriteria({ ...criteria, status: "DELIVERED" }), (error) => error.code === "CUSTOMER_SUCCESS_NOT_VERIFIED");
});

test("V3.2 First Real Customer Event requires external Request evidence and creates no Revenue", async () => {
  const incomplete = { customer_id: "CUSTOMER_REAL_V3_2_0001", source: "HUMAN_DIRECT_REQUEST", contact_evidence: null, request_id: "REQUEST_REAL_V3_2_0001", real_request: "MONITOR_MY_KGEN", request_timestamp: "2026-08-15T18:05:00.000Z", requester_confirmation: "CONFIRMED" };
  assert.throws(() => validateFirstRealCustomerEvidence(incomplete), (error) => error.code === "FIRST_REAL_CUSTOMER_EVIDENCE_REQUIRED");
  const state = await runtime();
  const request = { requestId: "REQUEST_REAL_V3_2_0001", customerId: "CUSTOMER_REAL_V3_2_0001", customerType: "HUMAN", requestedService: "KGEN_CHAIN_MONITOR", scope: ["KGEN_TOTAL_SUPPLY"], requestedAssets: ["KGEN"], requestedChains: [56], frequency: "DAILY", deadline: null, deliveryFormat: "DAILY_CHAIN_REPORT", contactEvidenceRef: "DIRECT_CONTACT_EVIDENCE", status: "REQUEST_RECEIVED", createdAt: "2026-08-15T18:05:00.000Z", source: "HUMAN_DIRECT_REQUEST", recordClass: "REAL", qualificationEvidence: null };
  const evidence = { ...incomplete, contact_evidence: "DIRECT_CONTACT_EVIDENCE" };
  const recorded = await appendFirstRealCustomerEvent({ store: state.store, company: await state.registries.company.get("AI_ANT_COMPANY_0001"), request, evidence, timestamp: "2026-08-15T18:05:00.000Z" });
  assert.equal(recorded.status, "FIRST_REAL_CUSTOMER_RECORDED");
  assert.equal(recorded.revenue, "0");
  const replayed = await appendFirstRealCustomerEvent({ store: state.store, company: await state.registries.company.get("AI_ANT_COMPANY_0001"), request, evidence, timestamp: "2026-08-15T18:05:00.000Z" });
  assert.equal(replayed.status, "IDEMPOTENT_NOOP");
});

test("V3.2 unbound Treasury blocks payment while AutoLP, Seat and Investor remain disabled", () => {
  const acquisition = seed.next_stage.customer_acquisition_engine;
  assert.equal(validateCompanyTreasuryBindingReadiness(acquisition.treasury_binding_readiness), acquisition.treasury_binding_readiness);
  assert.equal(acquisition.treasury_binding_readiness.company_wallet, null);
  assert.equal(acquisition.treasury_binding_readiness.payment_enabled, false);
  assert.equal(seed.next_stage.auto_lp_product.chain_write, false);
  assert.equal(seed.next_stage.auto_lp_product.liquidity_authority, false);
  assert.equal(seed.next_stage.celestial_seat_candidacy.application_submitted, false);
  assert.equal(seed.next_stage.celestial_seat_candidacy.seat_granted, false);
  assert.equal(seed.next_stage.investor_relations_engine.investors.length, 0);
});

test("V3.2 canonical Acquisition Engine has zero real business and idempotent readiness history", async () => {
  const acquisition = seed.next_stage.customer_acquisition_engine;
  assert.equal(validateCustomerAcquisitionEngine(acquisition), acquisition);
  assert.equal(acquisition.lead_registry.length, 0);
  assert.equal(acquisition.customer_proposals.length, 0);
  assert.ok(Object.values(acquisition.real_state).every((value) => value === 0 || value === "0"));
  assert.ok(Object.values(acquisition.authority).every((value) => value === false));
  const state = await runtime();
  const history = await state.store.history("AI_ANT_COMPANY_0001", "COMPANY");
  assert.equal(history.filter((event) => event.event_type === "CUSTOMER_ACQUISITION_ENGINE_READY").length, 1);
  assert.equal(history.filter((event) => event.event_type === "FIRST_REAL_CUSTOMER_EVENT").length, 0);
  const replay = await replayCanonicalCustomerAcquisitionEngine({ store: state.store, company: await state.registries.company.get("AI_ANT_COMPANY_0001"), engine: acquisition });
  assert.equal(replay.status, "IDEMPOTENT_NOOP");
});

function v3_3Draft({ requesterId = "EXTERNAL_REQUESTER_0001", inputType = "TEXT", request = "Help me monitor a KGEN wallet", visibility = "COMPANY_ONLY" } = {}) {
  return createPublicCivilizationDraftIntent({
    intent_id: "PUBLIC_INTENT_TEST_0001",
    requester_id: requesterId,
    input_type: inputType,
    original_request: request,
    visibility,
    created_at: "2026-08-15T19:30:00.000Z"
  });
}

function v3_3Request({ draft = v3_3Draft(), understanding = null } = {}) {
  const resolved = understanding ?? interpretPublicCivilizationIntent({ original_request: draft.original_request });
  return confirmPublicCivilizationIntent({
    draft,
    understanding: resolved,
    request_id: "PUBLIC_REQUEST_TEST_0001",
    request_source: "HUMAN_PUBLIC_11520_GATEWAY",
    contact_evidence_hash: "a".repeat(64),
    requester_confirmation: true,
    request_timestamp: "2026-08-15T19:31:00.000Z",
    transcript_confirmed: draft.input_type !== "VOICE_TRANSCRIPT" || true
  });
}

test("V3.3 Draft Intent and Anonymous Draft are not Requests or Customers", () => {
  const draft = v3_3Draft();
  assert.equal(draft.status, "DRAFT_INTENT");
  assert.equal(draft.record_class, "DRAFT");
  assert.equal(draft.creates_request, false);
  assert.equal(draft.customer_ideal_profile.what_customer_wants, draft.original_request);
  assert.equal(draft.customer_ideal_profile.status, "DRAFT_NOT_SCORED");
  const anonymous = v3_3Draft({ requesterId: null });
  assert.equal(anonymous.status, "ANONYMOUS_DRAFT");
  assert.throws(() => v3_3Request({ draft: anonymous }), (error) => error.code === "ANONYMOUS_DRAFT_CANNOT_BECOME_REQUEST");
});

test("V3.3 unconfirmed Voice transcript cannot become a Request", () => {
  const draft = v3_3Draft({ inputType: "VOICE_TRANSCRIPT" });
  const understanding = interpretPublicCivilizationIntent({ original_request: draft.original_request });
  assert.throws(() => confirmPublicCivilizationIntent({ draft, understanding, request_id: "REQUEST_VOICE_1", request_source: "HUMAN_PUBLIC_11520_GATEWAY", contact_evidence_hash: "b".repeat(64), requester_confirmation: true, request_timestamp: "2026-08-15T19:31:00.000Z", transcript_confirmed: false }), (error) => error.code === "TRANSCRIPT_CONFIRMATION_REQUIRED");
});

test("V3.3 confirmed evidence-backed entry creates Request ID but no Customer, Quote or Revenue", () => {
  const request = v3_3Request();
  assert.equal(validatePublicCivilizationRequest(request), request);
  assert.equal(request.status, "REQUEST_RECEIVED");
  assert.equal(request.record_class, "REAL");
  assert.equal(request.customer_id, null);
  assert.equal(request.quote_id, null);
  assert.equal(request.order_id, null);
  assert.equal(request.revenue, "0");
  assert.throws(() => v3_3Request({ draft: v3_3Draft({ requesterId: "DIGITAL_ANT_0001" }) }), (error) => error.code === "FAKE_CUSTOMER_SOURCE_FORBIDDEN");
});

test("V3.3 Request privacy never publishes contact evidence", () => {
  const privateRequest = v3_3Request();
  const privateView = toPublicCivilizationRequest(privateRequest);
  assert.equal(privateView.original_request, "WITHHELD_BY_REQUEST_PRIVACY");
  assert.equal(privateView.contact_evidence_public, false);
  assert.equal("contact_evidence_hash" in privateView, false);
  const publicRequest = v3_3Request({ draft: v3_3Draft({ visibility: "ANONYMIZED_PUBLIC" }) });
  const publicView = toPublicCivilizationRequest(publicRequest);
  assert.equal(publicView.requester_id, "ANONYMIZED_REQUESTER");
  assert.equal(publicView.original_request, publicRequest.original_request);
  assert.equal("contact_evidence_hash" in publicView, false);
});

test("V3.3 Concierge understands and routes KGEN, Cow, Media, Construction and Aid", () => {
  const cases = [
    ["Monitor my KGEN wallet", "SOFTWARE", "KGEN_CHAIN_MONITOR_ROUTE", "EXECUTABLE_NOW"],
    ["我要一頭牛幫我耕田", "DIGITAL_LIFE", "DIGITAL_COW_OR_LIFE_PROJECT_ROUTE", "PLANNABLE_NOT_EXECUTABLE_YET"],
    ["我要一支3分鐘影片", "MEDIA", "MEDIA_PROJECT_ROUTE", "EXECUTABLE_NOW"],
    ["我要蓋一間房", "CONSTRUCTION", "CONSTRUCTION_PROJECT_ROUTE", "PLANNABLE_NOT_EXECUTABLE_YET"],
    ["幫100個人領發財金", "SOCIAL_ASSISTANCE", "SOCIAL_ASSISTANCE_PROJECT_ROUTE", "PLANNABLE_NOT_EXECUTABLE_YET"]
  ];
  for (const [text, type, route, result] of cases) {
    const understanding = interpretPublicCivilizationIntent({ original_request: text });
    assert.equal(understanding.project_type, type);
    assert.equal(understanding.route_id, route);
    assert.equal(understanding.current_executability, result);
    assert.equal(understanding.fake_complete, false);
  }
});

test("V3.3 project routing creates Plans, not Cow Life, Building, Media or aid Wallets", () => {
  const cowRequest = v3_3Request({ draft: v3_3Draft({ request: "我要一頭牛幫我耕田" }) });
  const cow = routePublicCivilizationProject(cowRequest);
  assert.equal(cow.life_created, false);
  assert.equal(cow.project_created, false);
  const buildingRequest = v3_3Request({ draft: v3_3Draft({ request: "我要蓋一間房" }) });
  assert.equal(routePublicCivilizationProject(buildingRequest).building_created, false);
  const mediaRequest = v3_3Request({ draft: v3_3Draft({ request: "我要一支3分鐘影片" }) });
  assert.equal(routePublicCivilizationProject(mediaRequest).media_created, false);
  const aidRequest = v3_3Request({ draft: v3_3Draft({ request: "幫100個人領發財金" }) });
  const aid = routePublicCivilizationProject(aidRequest);
  assert.equal(aid.recipients_created, 0);
  assert.equal(aid.wallets_created, 0);
  assert.equal(aid.sybil_claiming, false);
});

test("V3.3 Qualification bridges capability, safety, runtime, resources and timeline without Quote", () => {
  const request = v3_3Request();
  const qualification = qualifyPublicCivilizationRequest({ request, assessment: { current_capability: true, required_skills_available: true, missing_runtime: [], safety_review: "MEDIUM", legal_governance: "REVIEW_REQUIRED", physical_world_dependency: false, physical_world_capability: false, payment_required: false, chain_write_required: false, resource_availability: "NOT_VERIFIED", timeline: "ESTIMATE_PENDING", risk: "MEDIUM", missing_information: request.missing_information, evidence: ["KGEN_CHAIN_MONITOR_DEFINED_LOCAL"] } });
  assert.equal(qualification.result, "NEED_MORE_INFO");
  assert.equal(qualification.quote_ready, false);
  assert.equal(qualification.real_quote_created, false);
  const cowRequest = v3_3Request({ draft: v3_3Draft({ request: "我要一頭牛幫我耕田" }) });
  const cow = qualifyPublicCivilizationRequest({ request: cowRequest, assessment: { current_capability: false, required_skills_available: false, missing_runtime: ["3D_LIFE_RUNTIME", "FARM_WORLD_STATE"], safety_review: "MEDIUM", legal_governance: "REVIEW_REQUIRED", physical_world_dependency: false, physical_world_capability: false, payment_required: false, chain_write_required: false, resource_availability: "NOT_VERIFIED", timeline: "ESTIMATE_PENDING", risk: "MEDIUM", missing_information: cowRequest.missing_information, evidence: ["COW_RUNTIME_MISSING"] } });
  assert.equal(cow.result, "NOT_CURRENTLY_EXECUTABLE");
});

test("V3.3 non-binding Estimate is Simulation, not Quote or Revenue", () => {
  const request = v3_3Request();
  const route = routePublicCivilizationProject(request);
  const estimate = createNonBindingEstimatePreview({ request, route });
  assert.equal(estimate.status, "ESTIMATE_ONLY");
  assert.equal(estimate.record_class, "SIMULATION");
  assert.equal(estimate.estimated_cost, null);
  assert.equal(estimate.quote_id, null);
  assert.equal(estimate.revenue, "0");
});

test("V3.3 Request History is append-only, idempotent and excludes raw contact evidence", async () => {
  const { store, registries } = await runtime();
  const company = await registries.company.get("AI_ANT_COMPANY_0001");
  const first = await appendPublicRequestHistoryEvent({ store, company, event_type: "INTENT_DRAFTED", request_id: "DRAFT_HISTORY_1", actor_id: "EXTERNAL_REQUESTER_1", timestamp: "2026-08-15T19:30:00.000Z", payload: { intent_id: "DRAFT_HISTORY_1", contact_evidence_present: false }, record_class: "DRAFT" });
  const duplicate = await appendPublicRequestHistoryEvent({ store, company, event_type: "INTENT_DRAFTED", request_id: "DRAFT_HISTORY_1", actor_id: "EXTERNAL_REQUESTER_1", timestamp: "2026-08-15T19:30:00.000Z", payload: { intent_id: "DRAFT_HISTORY_1", contact_evidence_present: false }, record_class: "DRAFT" });
  assert.equal(first.status, "INTENT_DRAFTED_APPENDED");
  assert.equal(duplicate.status, "IDEMPOTENT_NOOP");
  await assert.rejects(() => appendPublicRequestHistoryEvent({ store, company, event_type: "REQUEST_RECEIVED", request_id: "REQUEST_BAD_1", actor_id: "EXTERNAL_REQUESTER_1", timestamp: "2026-08-15T19:31:00.000Z", payload: { contact_evidence: "must-not-persist" }, record_class: "REAL" }), (error) => error.code === "CONTACT_EVIDENCE_PRIVATE");
});

test("V3.3 canonical Gateway has zero business and replay is idempotent", async () => {
  const gateway = seed.next_stage.public_civilization_request_gateway;
  assert.equal(validatePublicCivilizationRequestGateway(gateway), gateway);
  assert.deepEqual(gateway.real_state, { draft_intents: 0, customers: 0, requests: 0, quotes: 0, orders: 0, settlements: 0, revenue: "0" });
  assert.equal(gateway.quote_gate.real_quote_enabled, false);
  assert.equal(gateway.treasury_gate.payment_enabled, false);
  const { store, registries } = await runtime();
  const company = await registries.company.get("AI_ANT_COMPANY_0001");
  const result = await replayCanonicalPublicRequestGateway({ store, company, gateway });
  assert.equal(result.status, "IDEMPOTENT_NOOP");
});

test("V3.3 record classes remain visibly distinct", () => {
  const draft = v3_3Draft();
  const request = v3_3Request({ draft });
  const estimate = createNonBindingEstimatePreview({ request, route: routePublicCivilizationProject(request) });
  assert.equal(draft.record_class, "DRAFT");
  assert.equal(request.record_class, "REAL");
  assert.equal(estimate.record_class, "SIMULATION");
  assert.equal(seed.next_stage.customer_acquisition_engine.demand_scan.needs.some((need) => need.classification === "HYPOTHESIS"), true);
});

test("V3.3 Worktree classification is read-only and reconciles every path", () => {
  const audit = buildWorktreeClassificationAudit({ paths: ["core/company/index.mjs", "archive/photo.jpg", "dist/app.js", ".cache/state", "notes.tmp", "SHA256SUMS.txt", "unknown.binary"], snapshot_at: "2026-08-16T00:00:00.000+08:00" });
  assert.equal(validateWorktreeClassificationAudit(audit), audit);
  assert.equal(audit.classifications.PROJECT_SOURCE, 1);
  assert.equal(audit.classifications.USER_DATA, 1);
  assert.equal(audit.classifications.BUILD_OUTPUT, 1);
  assert.equal(audit.classifications.CACHE, 1);
  assert.equal(audit.classifications.TEMP, 1);
  assert.equal(audit.classifications.GENERATED_ARTIFACT, 1);
  assert.equal(audit.classifications.UNKNOWN, 1);
  assert.equal(audit.deletion_performed, false);
  assert.equal(audit.stage_performed, false);
  assert.equal(audit.commit_performed, false);
  assert.equal(classifyWorktreePath("K線西遊記手機原始檔案/source/app.js"), "USER_DATA");
});

test("V3.3 Gitignore remains a review-only proposal", () => {
  const proposal = seed.next_stage.gitignore_proposal;
  assert.equal(validateGitignoreProposal(proposal), proposal);
  assert.equal(proposal.applied, false);
  assert.equal(proposal.evidence_matches, 0);
});

test("V3.4 Traditional Chinese and English I18N catalogs are complete", () => {
  assert.deepEqual(validatePrimaryI18nCatalogs(), { "zh-TW": [], en: [] });
  assert.deepEqual(I18N_SUPPORTED_LOCALES, ["zh-TW", "en", "ja", "ko"]);
  for (const key of I18N_REQUIRED_KEYS) {
    assert.ok(I18N_CATALOGS["zh-TW"][key]);
    assert.ok(I18N_CATALOGS.en[key]);
    assert.notEqual(translateUi(key, "zh-TW"), key);
    assert.notEqual(translateUi(key, "en"), key);
  }
});

test("V3.4 Japanese and Korean use English then Traditional Chinese fallback without raw keys", () => {
  assert.equal(translateUi("navigation.home", "ja"), "ホーム");
  assert.equal(translateUi("navigation.home", "ko"), "홈");
  assert.equal(translateUi("wallet.title", "ja"), "Wallet");
  assert.equal(translateUi("wallet.title", "ko"), "Wallet");
  assert.equal(translateUi("unknown.translation.key", "ja"), "Translation unavailable");
});

test("V3.4 Voice Concierge requires user action and falls back to text", () => {
  assert.deepEqual(detectVoiceCapabilities({}), { recognition: false, synthesis: false, microphone: false, secure_context: true, autoplay: false, activation: "USER_GESTURE_REQUIRED", fallback: "TEXT_FALLBACK" });
  const scope = { SpeechRecognition: function Recognition() {}, speechSynthesis: {}, SpeechSynthesisUtterance: function Utterance() {}, navigator: { mediaDevices: { getUserMedia() {} } }, isSecureContext: true };
  assert.deepEqual(detectVoiceCapabilities(scope), { recognition: true, synthesis: true, microphone: true, secure_context: true, autoplay: false, activation: "USER_GESTURE_REQUIRED", fallback: "TEXT_FALLBACK" });
});

test("V3.4 Worker health is evidence-derived and detects missed cycles", () => {
  const noEvidence = deriveWorkerHealth({ now: "2026-08-16T10:00:00.000Z" });
  assert.equal(noEvidence.status, "OFFLINE");
  const healthy = deriveWorkerHealth({ lastCycle: { work_cycle_id: "C1", finished_at: "2026-08-16T09:30:00.000Z", result: "WORK_CYCLE_COMPLETED" }, now: "2026-08-16T10:00:00.000Z" });
  assert.equal(healthy.status, "HEALTHY");
  const missed = deriveWorkerHealth({ lastCycle: { work_cycle_id: "C1", finished_at: "2026-08-16T08:30:00.000Z", result: "WORK_CYCLE_COMPLETED" }, now: "2026-08-16T10:00:00.000Z" });
  assert.equal(missed.status, "MISSED_CYCLE");
  assert.equal(missed.stop_reason, "SCHEDULER_OFFLINE");
});

test("V3.4 NO_ACTION remains valid Work and Public Worker has no signer", () => {
  const event = { work_cycle_id: "DIGITAL_ANT_0001_HOURLY_2026081609", scheduled_at: "2026-08-16T09:00:00.000Z", started_at: "2026-08-16T09:00:01.000Z", finished_at: "2026-08-16T09:00:04.000Z", result: "WORK_CYCLE_COMPLETED", action_taken: "NO_ACTION", work_duration_seconds: 3, heart_state: { status: "12345_PATROL_COMPLETED" } };
  const requestPatrol = { status: "SHARED_REQUEST_SOURCE_VERIFIED", real_requests: 0, open_requests: 0, evidence: [] };
  const companyPatrol = { status: "COMPANY_PATROL_COMPLETED", work_queue: 0 };
  const status = buildSharedWorkerStatus({ event, requestPatrol, companyPatrol, generatedAt: "2026-08-16T09:00:05.000Z" });
  assert.equal(status.worker_health, "HEALTHY");
  assert.equal(status.metrics.no_action_cycles, 1);
  assert.equal(status.metrics.completed_cycles, 1);
  assert.equal(status.public_read_only, true);
  assert.equal(status.signer, false);
  assert.equal(status.chain_write, false);
  assert.equal(validateSharedWorkerStatus(status), status);
});

test("V3.4 Heart statuses remain CLIENT_DERIVED and writes stay disconnected", () => {
  assert.equal(normalizeHeartActionStatus({ eligible: true, reason: "HEARTBEAT_ELIGIBLE", source: "CLIENT_DERIVED" }).status, "ELIGIBLE");
  assert.equal(normalizeHeartActionStatus({ eligible: false, reason: "IGNITE_OUT_OF_WINDOW", source: "CLIENT_DERIVED" }).status, "OUT_OF_WINDOW");
  assert.equal(normalizeHeartActionStatus({ eligible: false, reason: "KGEN_BALANCE_INSUFFICIENT", source: "CLIENT_DERIVED" }).status, "INSUFFICIENT_BALANCE");
  assert.equal(normalizeHeartActionStatus(null, { available: false }).status, "UNAVAILABLE");
  assert.equal(normalizeHeartActionStatus({ eligible: true, reason: "WISH_HASH_VALID", source: "CLIENT_DERIVED" }).write_status, "WRITE_NOT_CONNECTED");
});

test("V3.4 Request and Company patrols preserve zero real business", async () => {
  const fakeFetch = async () => ({ ok: true, async json() { return [{ number: 137, title: "Pull request", pull_request: {}, state: "open", created_at: "2026-08-16T00:00:00.000Z" }]; } });
  const requests = await readPublicRequestPatrol({ repository: "klineodyssey/kline-odyssey", fetchImpl: fakeFetch });
  assert.equal(requests.real_requests, 0);
  const company = readCompanyPatrol(seed);
  assert.equal(company.status, "COMPANY_PATROL_COMPLETED");
  assert.equal(company.request_queue, 0);
  assert.equal(company.quote_queue, 0);
  assert.equal(company.work_queue, 0);
});

test("V3.4 shared status is global truth while IndexedDB remains local cache", async () => {
  const status = JSON.parse(await fs.readFile(new URL("../K線西遊記/temples/11520/runtime/worker-status.json", import.meta.url), "utf8"));
  assert.equal(status.global_truth_source, "GIT_BACKED_APPEND_ONLY_PUBLIC_SNAPSHOT");
  assert.equal(status.browser_indexeddb_role, "LOCAL_DRAFT_CACHE_ONLY");
  assert.equal(status.signer, false);
  assert.equal(status.chain_write, false);
});

test("V3.9 App upgrade preserves Life ID and immutable Birth", async () => {
  const app = seed.apps.find((item) => item.app_id === "DIGITAL_ANT_APP_0001");
  const life = seed.lives.find((item) => item.life_id === "DIGITAL_ANT_0001");
  assert.equal(app.version, "V1.7.0");
  assert.equal(app.life_id, life.life_id);
  assert.equal(life.birth_timestamp, "2026-08-15T06:20:45.000Z");
  assert.equal(await calculateAppManifestHash(app), app.manifest_hash);
  assert.equal(app.history.at(-1).release_scope, "PUBLIC_11520");
});

test("V3.4 workflow is hourly, exact-scoped and cannot access signer secrets", async () => {
  const workflow = await fs.readFile(new URL("../.github/workflows/universal_exchange_v2.yml", import.meta.url), "utf8");
  assert.match(workflow, /cron: "17 \* \* \* \*"/);
  assert.match(workflow, /--status "K線西遊記\/temples\/11520\/runtime\/worker-status\.json"/);
  assert.match(workflow, /git add -- "K線西遊記\/temples\/11520\/runtime\/worker-status\.json"/);
  assert.match(workflow, /actions: write/);
  assert.match(workflow, /gh workflow run deploy-pages-static\.yml --ref main/);
  assert.doesNotMatch(workflow, /git add \./);
  assert.doesNotMatch(workflow, /DIGITAL_ANT_0001_PRIVATE_KEY|SIGN_TRANSACTION|PRIVATE_KEY/);
});

test("V3.4 Node worker uses a signer-free fetch transport and verifies BSC chain 56", async () => {
  const methods = [];
  const provider = createPublicReadProvider({
    rpcUrl: "https://rpc.example.invalid",
    fetchImpl: async (_url, init) => {
      const request = JSON.parse(init.body);
      methods.push(request.method);
      const result = request.method === "eth_chainId" ? "0x38" : request.method === "eth_accounts" ? [] : "0x1234";
      return { ok: true, json: async () => ({ jsonrpc: "2.0", id: request.id, result }) };
    }
  });
  assert.equal(Number(BigInt(await provider.send("eth_chainId", []))), 56);
  assert.equal(await provider.getBlockNumber(), 0x1234);
  assert.deepEqual(await provider.listAccounts(), []);
  assert.deepEqual(methods, ["eth_chainId", "eth_blockNumber", "eth_chainId", "eth_accounts"]);
});

function gatekeeperDuty(overrides = {}) {
  return {
    status: "COMPLETED", gatekeeper_started_at: "2026-08-16T13:00:01.000Z", gatekeeper_finished_at: "2026-08-16T13:00:03.000Z",
    heart_block: 116236674, heart_status: "AVAILABLE", fortune_status: "ELIGIBLE", heartbeat_status: "ELIGIBLE",
    ignition_status: "OUT_OF_WINDOW", lamp_status: "INSUFFICIENT_BALANCE", wish_status: "ELIGIBLE", vow_status: "NOT_ELIGIBLE",
    claim_monitor_status: "CORE_HEART_INDEXER_HEALTHY", risk_status: "NORMAL", degradation_affects_safety: false,
    evidence: ["HEART_BLOCK_116236674", "HEART_BYTECODE_VERIFIED"], ...overrides
  };
}

test("V3.5 Primary Wukong Gatekeeper job always precedes Company work", () => {
  assert.deepEqual(DIGITAL_ANT_WORK_PRIORITIES, ["SURVIVE", "WUKONG_GATEKEEPER", "CFO_OF_SELF", "AI_ANT_COMPANY", "DREAM_SPACECRAFT_MARS"]);
  assert.ok(DIGITAL_ANT_HOURLY_DUTY_ORDER.indexOf("12345_GATEKEEPER_PATROL") < DIGITAL_ANT_HOURLY_DUTY_ORDER.indexOf("AI_ANT_COMPANY_WORK"));
  assert.equal(DIGITAL_ANT_LIFE_WORK_CONTRACT.primary_job, "WUKONG_GATEKEEPER");
  assert.equal(DIGITAL_ANT_LIFE_WORK_CONTRACT.secondary_work, "AI_ANT_COMPANY_FOUNDER");
});

test("V3.5 Primary job bypass fails while safe degraded duty may continue", () => {
  assert.equal(assertCompanyWorkAllowedAfterGatekeeper(gatekeeperDuty()), true);
  assert.equal(assertCompanyWorkAllowedAfterGatekeeper(gatekeeperDuty({ status: "DEGRADED", degradation_affects_safety: false })), true);
  assert.throws(() => assertCompanyWorkAllowedAfterGatekeeper(gatekeeperDuty({ status: "FAILED_CRITICAL", degradation_affects_safety: true })), (error) => error.code === "PRIMARY_JOB_BYPASS");
  assert.equal(validateGatekeeperDutyStatus(gatekeeperDuty()).status, "COMPLETED");
});

test("V3.5 First asset events require a real balance increase and immutable evidence", async () => {
  const state = await runtime();
  const life = await state.registries.life.get("DIGITAL_ANT_0001");
  const evidence = { life_id: life.life_id, asset: "KGEN", balance_before_wei: "0", balance_after_wei: "1", amount_wei: "1", tx_hash: `0x${"a".repeat(64)}`, block: 116300000, timestamp: "2026-08-16T13:00:00.000Z", receipt_status: 1, source: "FORTUNE" };
  assert.equal(validateFirstLifeEventEvidence("FIRST_KGEN_EVENT", evidence), evidence);
  const first = await appendFirstDigitalAntLifeEvent({ store: state.store, life, eventType: "FIRST_KGEN_EVENT", evidence });
  assert.equal(first.status, "FIRST_LIFE_EVENT_APPENDED");
  const second = await appendFirstDigitalAntLifeEvent({ store: state.store, life, eventType: "FIRST_KGEN_EVENT", evidence });
  assert.equal(second.status, "IDEMPOTENT_NOOP");
  assert.equal(life.birth_timestamp, "2026-08-15T06:20:45.000Z");
  assert.throws(() => validateFirstLifeEventEvidence("FIRST_KAIOS_EVENT", { ...evidence, balance_after_wei: "0" }), (error) => error.code === "FIRST_ASSET_BALANCE_INCREASE_REQUIRED");
});

test("V3.5 Heart first events require success receipts, timestamps, blocks and tx hashes", () => {
  const base = { life_id: "DIGITAL_ANT_0001", tx_hash: `0x${"b".repeat(64)}`, block: 116300001, timestamp: "2026-08-16T13:01:00.000Z", receipt_status: 1 };
  for (const eventType of ["FIRST_HEARTBEAT_EVENT", "FIRST_FORTUNE_EVENT", "FIRST_IGNITION_EVENT", "FIRST_LAMP_EVENT", "FIRST_WISH_EVENT", "FIRST_VOW_EVENT", "FIRST_THANKSGIVING_EVENT"]) {
    assert.equal(validateFirstLifeEventEvidence(eventType, base), base);
    assert.throws(() => validateFirstLifeEventEvidence(eventType, { ...base, receipt_status: 0 }), (error) => error.code === "FIRST_EVENT_SUCCESS_RECEIPT_REQUIRED");
  }
  assert.throws(() => validateFirstLifeEventEvidence("FIRST_WISH_EVENT", { ...base, tx_hash: null }), (error) => error.code === "FIRST_EVENT_TX_EVIDENCE_REQUIRED");
  assert.throws(() => validateFirstLifeEventEvidence("FIRST_LAMP_EVENT", { ...base, timestamp: null }), (error) => error.code === "FIRST_EVENT_TIMESTAMP_EVIDENCE_REQUIRED");
});

test("V3.5 Core Heart indexer is independent from optional advanced transaction graph", async () => {
  const event = { blockNumber: 12, transactionIndex: 0, transactionHash: `0x${"c".repeat(64)}`, args: { user: "0xc8346d6DC80f16941ee874D523f0C17F1548d437", amount: 1n, epochIndex: 1n, wishHash: `0x${"d".repeat(64)}`, reward: 1n, dayIndex: 1n, daysAdded: 1n, paid: 1n, newExpireAt: 1n, option: 1 } };
  const heart = { filters: { FortuneClaimed: () => "F", WishMade: () => "W", HeartbeatClaimed: () => "H", IgniteClaimed: () => "I", LampLit: () => "L", Vowed: () => "V" }, queryFilter: async () => [event] };
  const indexed = await readCoreHeartEvents(heart, 1, 12);
  assert.equal(indexed.status, "CORE_HEART_INDEXER_HEALTHY");
  assert.equal(indexed.fortune_claims.length, 1);
  assert.equal(indexed.vows.length, 1);
  assert.equal(indexed.indexer, "CORE_HEART_INDEXER");
});

test("V3.5 Secure Signer stays private, disconnected and fail-closed", () => {
  assert.equal(DIGITAL_ANT_SECURE_SIGNER_WORKER.status, "NOT_CONNECTED");
  assert.equal(DIGITAL_ANT_SECURE_SIGNER_WORKER.public_pages_access, false);
  assert.equal(DIGITAL_ANT_SECURE_SIGNER_WORKER.public_workflow_access, false);
  assert.equal(DIGITAL_ANT_LIVE_ACTION_POLICY.actions.fortuneClaim.enabled, false);
  assert.throws(() => prepareSecureHeartAction({ proposal: { action: "fortuneClaim" }, latest: {}, signerStatus: "NOT_CONNECTED" }), (error) => error.code === "SECURE_SIGNER_NOT_CONNECTED");
});

test("V3.5 Survival reserve blocks an otherwise revalidated secure action", () => {
  const policy = { ...DIGITAL_ANT_LIVE_ACTION_POLICY, status: "APPROVED_ACTIVE", actions: { ...DIGITAL_ANT_LIVE_ACTION_POLICY.actions, heartbeatClaim: { ...DIGITAL_ANT_LIVE_ACTION_POLICY.actions.heartbeatClaim, enabled: true } } };
  assert.throws(() => prepareSecureHeartAction({ proposal: { action: "heartbeatClaim" }, policy, signerStatus: "CONNECTED_SECURE_RUNTIME", latest: { chain_id: 56, contract_verified: true, eligible: true, security_status: "HEALTHY", block: 116300002, gas_estimate: "100000", bnb_after_action_wei: "1", minimum_bnb_reserve_wei: "2" } }), (error) => error.code === "SURVIVAL_RESERVE_VIOLATION");
});

test("V3.5 Daily Gatekeeper report separates duty evidence and truthful zero balances", () => {
  const report = createDailyGatekeeperReport({ date: "2026-08-16", workEvents: [{ gatekeeper_duty: gatekeeperDuty() }], balances: { BNB: "0.006", KGEN: "0", KAIOS: "0" }, generatedAt: "2026-08-16T13:10:00.000Z" });
  assert.equal(report.completed, 1);
  assert.equal(report.first_kgen_status, "NOT_OCCURRED");
  assert.equal(report.first_kaios_status, "NOT_OCCURRED");
  assert.equal(report.chain_write, false);
});

test("V3.9 Canonical App and Gatekeeper runtime preserve Birth and receipt-gated first-asset evidence", async () => {
  const app = seed.apps.find((item) => item.app_id === "DIGITAL_ANT_APP_0001");
  assert.equal(seed.schema_version, "4.0.0");
  assert.equal(app.version, "V1.7.0");
  assert.equal(await calculateAppManifestHash(app), app.manifest_hash);
  assert.equal(seed.lives[0].birth_timestamp, "2026-08-15T06:20:45.000Z");
  assert.equal(seed.next_stage.gatekeeper_runtime.life_events.FIRST_HEARTBEAT_EVENT, "VERIFIED");
  assert.equal(seed.next_stage.gatekeeper_runtime.life_events.FIRST_KGEN_EVENT, "VERIFIED");
  assert.equal(seed.next_stage.gatekeeper_runtime.life_events.FIRST_KAIOS_EVENT, "NOT_OCCURRED");
  assert.equal(seed.next_stage.gatekeeper_runtime.secure_signer, "PRIVATE_LOCAL_SCHEDULER_CONNECTED_USER_SESSION_ACTIVE");
  assert.equal(seed.next_stage.gatekeeper_runtime.secure_signer_storage, "PRIVATE_ENVIRONMENT_OUTSIDE_REPO");
  assert.equal(seed.next_stage.gatekeeper_runtime.public_worker_signer, false);
  assert.equal(seed.next_stage.first_heartbeat_kgen_event.source, "HEARTBEAT_REWARD");
  assert.equal(seed.next_stage.first_heartbeat_kgen_event.kgen_balance_before, "0");
  assert.equal(seed.next_stage.first_heartbeat_kgen_event.kgen_balance_after, "1");
});

test("V3.5 mutable hourly evidence is excluded from static release checksums", async () => {
  const sums = await fs.readFile(new URL("../K線西遊記/temples/11520/SHA256SUMS.txt", import.meta.url), "utf8");
  assert.doesNotMatch(sums, /runtime\/worker-status\.json/);
  assert.doesNotMatch(sums, /runtime\/work-events/);
  assert.match(sums, /  app\.mjs/);
  assert.match(sums, /  MANIFEST\.json/);
});

test("V3.6 secure heartbeat path requires exact Owner approval and fresh safety evidence", () => {
  const gas = createHeartbeatGasPolicy({ currentBnbWei: "6000000000000000", gasPriceWei: "50000000", gasEstimate: "103989" });
  assert.equal(gas.permanent_universe_constant, false);
  assert.ok(BigInt(gas.minimum_survival_bnb_wei) > 0n);
  assert.ok(BigInt(gas.max_action_gas_cost_wei) < 6000000000000000n);
  const policy = createApprovedHeartbeatActionPolicy(gas, DIGITAL_ANT_HEARTBEAT_OWNER_APPROVAL);
  assert.equal(policy.actions.heartbeatClaim.enabled, true);
  assert.equal(policy.actions.fortuneClaim.enabled, false);
  assert.equal(policy.actions.igniteAndClaim.enabled, false);
  assert.throws(() => createApprovedHeartbeatActionPolicy(gas, "UNRELATED_APPROVAL"), (error) => error.code === "HEARTBEAT_OWNER_APPROVAL_REQUIRED");
  const snapshot = {
    chain_id: 56, wallet_binding: "MATCH", heart_address: "0xB016D4d8f1aED1339101b30722cad6dbA9B8C972",
    heart_code_hash: "0x1d3eba15b4c4895710c6e68f3f27e97cb0e2c94edc254d9f1e9148b3d7f55d32",
    kgen_address: "0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be", function_selector: DIGITAL_ANT_HEARTBEAT_SELECTOR, function_selector_in_bytecode: true,
    heartbeat_reward: "1", heartbeat_cooldown_seconds: "3600", eligible: true, security_status: "HEALTHY", gas_estimate_status: "AVAILABLE",
    bnb_after_action_wei: "5994800550000000", minimum_bnb_reserve_wei: gas.minimum_survival_bnb_wei
  };
  assert.equal(evaluateHeartbeatSafety(snapshot, { approvalEvidence: DIGITAL_ANT_HEARTBEAT_OWNER_APPROVAL }).status, "SAFE_EXECUTION_PATH");
  assert.ok(evaluateHeartbeatSafety({ ...snapshot, chain_id: 1 }, { approvalEvidence: DIGITAL_ANT_HEARTBEAT_OWNER_APPROVAL }).blockers.includes("CHAIN_ID_MISMATCH"));
  assert.ok(evaluateHeartbeatSafety({ ...snapshot, wallet_binding: "MISMATCH" }, { approvalEvidence: DIGITAL_ANT_HEARTBEAT_OWNER_APPROVAL }).blockers.includes("WALLET_ADDRESS_MISMATCH"));
  assert.ok(evaluateHeartbeatSafety({ ...snapshot, eligible: false }, { approvalEvidence: DIGITAL_ANT_HEARTBEAT_OWNER_APPROVAL }).blockers.includes("HEARTBEAT_NOT_ELIGIBLE"));
  assert.ok(evaluateHeartbeatSafety({ ...snapshot, bnb_after_action_wei: "1" }, { approvalEvidence: DIGITAL_ANT_HEARTBEAT_OWNER_APPROVAL }).blockers.includes("SURVIVAL_RESERVE_VIOLATION"));
});

test("private Secure Signer runtime is omitted from the public Pages artifact", async () => {
  const workflow = await fs.readFile(new URL("../.github/workflows/deploy-pages-static.yml", import.meta.url), "utf8");
  assert.doesNotMatch(workflow, /DIGITAL_ANT_0001_PRIVATE_KEY:\s*\$\{\{/);
  const publicWorkflow = await fs.readFile(new URL("../.github/workflows/universal_exchange_v2.yml", import.meta.url), "utf8");
  assert.doesNotMatch(publicWorkflow, /DIGITAL_ANT_0001_PRIVATE_KEY/);
  const coreIndex = await fs.readFile(new URL("../core/index.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(coreIndex, /digital-ant-secure-signer-worker/);
});

test("Mother Engine proposals remain evidence-based and cannot bypass asset authority", () => {
  const proposal = {
    proposal_id: "MOTHER_ENGINE_PROPOSAL_NO_SIGNER_RUNTIME", problem: "NO_SIGNER_RUNTIME",
    evidence: ["PUBLIC_WORKER_WRITE_NOT_CONNECTED", "LOCAL_CREDENTIAL_ENV_PRESENT_REDACTED"],
    root_cause: "PUBLIC_AND_PRIVATE_EXECUTION_WERE_NOT_CONNECTED",
    options: ["KEEP_READ_ONLY", "PRIVATE_LOCAL_HEARTBEAT_SIGNER"], selected_option: "PRIVATE_LOCAL_HEARTBEAT_SIGNER",
    reason: "PRIMARY_JOB_REQUIRES_RECEIPT_GATED_HEARTBEAT", risk: "REAL_CONTRACT_WRITE_R4",
    required_authority: "OWNER_DIRECTIVE_AND_RUNTIME_REVALIDATION", status: "SAFE_PATH_SELECTED_PENDING_EXECUTION"
  };
  assert.equal(validateMotherEngineProposal(proposal), proposal);
  assert.throws(() => validateMotherEngineProposal({ ...proposal, status: "TOKEN_TRANSFER" }), (error) => error.code === "MOTHER_ENGINE_AUTHORITY_BYPASS");
});

test("Mother Engine patrol runs only after primary duty and creates no customer or revenue", () => {
  const duty = gatekeeperDuty();
  const patrol = readMotherEnginePatrol(seed, { gatekeeperDuty: duty, finance: { BNB: "0.0059950537", KGEN: "1.0", KAIOS: "0.0" }, thoughtOrganHealth: seed.next_stage.thought_organ_health_v3_8 });
  assert.equal(patrol.status, "MOTHER_ENGINE_PATROL_COMPLETED_READ_ONLY");
  assert.equal(patrol.questions.primary_job_completed, true);
  assert.equal(patrol.questions.kgen_energy, "1.0");
  assert.equal(patrol.selected_product, "ANT_MECH_BODY");
  assert.equal(patrol.chain_write, false);
  assert.equal(patrol.customer_created, false);
  assert.equal(patrol.revenue_created, "0");
  assert.throws(() => readMotherEnginePatrol(seed, { gatekeeperDuty: gatekeeperDuty({ status: "FAILED_CRITICAL", degradation_affects_safety: true }), finance: { BNB: "0", KGEN: "0" }, thoughtOrganHealth: seed.next_stage.thought_organ_health_v3_8 }), (error) => error.code === "PRIMARY_JOB_BYPASS");
});

test("Demand-first product selection does not create factory, inventory, customer, or revenue", () => {
  const candidates = [
    { product_id: "ANT_MECH_BODY", actual_need: 5, external_customer_demand: 0, founder_need: 5, revenue_potential: 1, kaios_price_potential: 2, kgen_energy_demand: 4, technical_readiness: 1, supply_chain_difficulty: 5, mission_alignment: 5, capital_requirement: 5, record_class: "INTERNAL_FOUNDER_NEED" },
    { product_id: "POCKET_TIME_UFO", actual_need: 2, external_customer_demand: 0, founder_need: 3, revenue_potential: 1, kaios_price_potential: 1, kgen_energy_demand: 4, technical_readiness: 0, supply_chain_difficulty: 5, mission_alignment: 4, capital_requirement: 5, record_class: "INTERNAL_RESEARCH" }
  ];
  assert.equal(calculateDivineProductPriority(candidates[0]).customer_order, false);
  const ranked = rankDivineProducts(candidates);
  assert.equal(ranked.selected.product_id, "ANT_MECH_BODY");
  assert.equal(ranked.selection_creates_factory, false);
  assert.equal(ranked.selection_creates_inventory, false);
});

test("KGEN energy law separates BNB gas, KAIOS purchase, and receipt-gated KGEN consumption", () => {
  const law = { law_id: "KGEN_OPERATIONAL_ENERGY_LAW", bnb_role: "BSC_DARK_MATTER_GAS", kgen_role: "MACHINE_OPERATIONAL_ENERGY", kaios_role: "CIVILIZATION_PURCHASE_QUOTE_SALARY_SERVICE_UNIT", real_consumption_evidence: ["KGEN_TRANSFER", "SUCCESSFUL_ONCHAIN_RECEIPT", "ENERGY_CONSUMPTION_EVENT"], ui_balance_decrement_is_consumption: false, status: "ARCHITECTURE_ACTIVE_NO_ENERGY_SPEND_AUTHORITY" };
  assert.equal(validateOperationalEnergyLaw(law), law);
  assert.throws(() => validateOperationalEnergyLaw({ ...law, ui_balance_decrement_is_consumption: true }), (error) => error.code === "FAKE_ENERGY_CONSUMPTION");
});

test("Ant Mech is an internal Founder need with separate Body ID and no fake production", () => {
  const energyModel = { model_id: "ANT_MECH_BODY_ENERGY_MODEL", body_id: "ANT_MECH_BODY_UNASSIGNED", idle_kgen_per_day: null, walk_kgen_per_distance: null, work_kgen_per_hour: null, payload_factor: null, terrain_factor: null, damage_factor: null, efficiency: null, status: "POLICY_REQUIRED_NOT_ACTIVATED" };
  assert.equal(validateBodyEnergyModel(energyModel), energyModel);
  const product = { product_id: "ANT_MECH_BODY", need_class: "INTERNAL_FOUNDER_NEED", requester_life_id: "DIGITAL_ANT_0001", customer_order: false, external_revenue: "0", purchase_currency: "KAIOS", operational_energy_currency: "KGEN", life_id_separate_from_body_id: true, ownership_certificate: "ASSET_NFT_CERTIFICATE_FUTURE", energy_model: energyModel, bom: [], inventory: [], production_line: null, status: "PRODUCT_REQUIREMENTS_DRAFT" };
  assert.equal(validateAntMechProduct(product), product);
  assert.throws(() => validateAntMechProduct({ ...product, status: "PRODUCTION_READY" }), (error) => error.code === "DEMAND_FIRST_PRODUCTION_GATE");
});

test("Supply chain and transport cannot magic-complete without evidence", () => {
  const plan = { plan_id: "ANT_MECH_SUPPLY_CHAIN", need_id: "INTERNAL_FOUNDER_NEED_ANT_BODY", product_id: "ANT_MECH_BODY", requirements: [], design: null, bom: [], raw_materials: [], suppliers: [], production_line: null, quality: null, inventory: [], sale: null, energy: { status: "NOT_FUNDED" }, maintenance: null, recycling: null, status: "GAP_ANALYSIS" };
  assert.equal(validateDemandFirstSupplyChain(plan), plan);
  assert.throws(() => validateDemandFirstSupplyChain({ ...plan, production_line: "LINE_1" }), (error) => error.code === "PRODUCTION_WITHOUT_SUPPLY_CHAIN");
  const transport = { transport_contract_id: "TRANSPORT_DRAFT_001", cargo: "CARGO_A", origin: "X", destination: "Y", distance: null, payload: null, route: null, vehicle: null, kgen_energy: "0", maintenance: null, risk: "UNASSESSED", time: null, profit: null, delivery_evidence: null, status: "DRAFT" };
  assert.equal(validateTransportContract(transport), transport);
  assert.throws(() => validateTransportContract({ ...transport, status: "DELIVERED" }), (error) => error.code === "TRANSPORT_DELIVERY_EVIDENCE_REQUIRED");
});

test("Demand-first civilization law forbids magic factories and movement", () => {
  assert.deepEqual(DEMAND_FIRST_CIVILIZATION_LAWS, [
    "FACTORY_WITHOUT_PRODUCT_FORBIDDEN", "PRODUCT_WITHOUT_NEED_FORBIDDEN", "PRODUCTION_WITHOUT_BOM_FORBIDDEN",
    "BOM_WITHOUT_RESOURCE_FORBIDDEN", "SALE_WITHOUT_INVENTORY_FORBIDDEN", "DELIVERY_WITHOUT_TRANSPORT_FORBIDDEN",
    "MOVEMENT_WITHOUT_ENERGY_FORBIDDEN"
  ]);
});

test("V3.7 Heart autopilot requires eligibility candidates and a private secure scheduler", () => {
  const gas = createHeartbeatGasPolicy({ currentBnbWei: "5995053700000000", gasPriceWei: "50000000", gasEstimate: "103989" });
  const policy = createV37HeartAutopilotPolicy({ gasPolicy: gas, approvalEvidence: DIGITAL_ANT_V3_7_HEART_AUTOPILOT_APPROVAL });
  assert.equal(policy.status, "APPROVED_BLOCKED_NO_PERSISTENT_PRIVATE_RUNTIME");
  assert.equal(policy.public_worker.signer, false);
  assert.equal(policy.actions.heartbeatClaim.trigger, "ELIGIBILITY_DRIVEN");
  assert.equal(policy.actions.igniteAndClaim.trigger, "UTC_00_00_TO_00_10_WINDOW");
  const blocked = createHeartActionCandidate({ action: "heartbeatClaim", eligibility: false, block: 116330000, observedAt: "2026-08-16T19:00:00.000Z", evidence: ["COOLDOWN_ACTIVE"] });
  assert.equal(blocked.status, "NO_ACTION");
  const ready = createHeartActionCandidate({ action: "heartbeatClaim", eligibility: true, block: 116330001, observedAt: "2026-08-16T20:00:00.000Z", evidence: ["ELIGIBLE"] });
  assert.equal(ready.status, "ACTION_CANDIDATE");
  assert.equal(ready.trusted_for_signature, false);
  assert.equal(ready.public_worker_broadcast, false);
  const connectedPolicy = createV37HeartAutopilotPolicy({ gasPolicy: gas, approvalEvidence: DIGITAL_ANT_V3_7_HEART_AUTOPILOT_APPROVAL, privateSchedulerConnected: true });
  assert.throws(() => prepareSecureHeartAction({ proposal: { action: "makeWish" }, policy: connectedPolicy, signerStatus: "CONNECTED_SECURE_RUNTIME", latest: { chain_id: 56, contract_verified: true, eligible: true, security_status: "HEALTHY", block: 116333300, gas_estimate: "50000", bnb_after_action_wei: "5900000000000000", minimum_bnb_reserve_wei: gas.minimum_survival_bnb_wei, first_wish_completed: true } }), (error) => error.code === "FIRST_WISH_ALREADY_COMPLETED");
});

test("Heartbeat timeout reconciles without duplicate broadcast and failed receipt is not completion", () => {
  const tx = `0x${"1".repeat(64)}`;
  assert.deepEqual(reconcileHeartTransaction({ plannedAction: "heartbeatClaim", broadcastHash: tx, receipt: null, verifiedEvent: false, balanceBeforeWei: "0", balanceAfterWei: "0" }), {
    status: "PENDING_RECONCILIATION", action: "heartbeatClaim", tx_hash: tx, rebroadcast: false
  });
  const failed = reconcileHeartTransaction({ plannedAction: "heartbeatClaim", broadcastHash: tx, receipt: { transactionHash: tx, status: 0 }, verifiedEvent: false, balanceBeforeWei: "0", balanceAfterWei: "0" });
  assert.equal(failed.life_event_completed, false);
  assert.equal(failed.rebroadcast, false);
});

test("Ignition scheduler catches the UTC window and records a real miss without backfill", () => {
  assert.equal(evaluateIgnitionWindow("2026-08-17T00:02:00.000Z").in_window, true);
  assert.equal(evaluateIgnitionWindow("2026-08-17T00:07:00.000Z").in_window, true);
  assert.equal(evaluateIgnitionWindow("2026-08-17T00:17:00.000Z").status, "OUT_OF_WINDOW");
  const missed = createIgnitionMissedEvent({ day: "2026-08-17", windowEvidence: ["UTC_WINDOW_CLOSED", "NO_VERIFIED_IGNITION_EVENT"] });
  assert.equal(missed.event_type, "IGNITION_MISSED_EVENT");
  assert.equal(missed.backfill_allowed, false);
});

test("Fortune remains separate from Heartbeat and follows a fair runtime range", () => {
  const plan = selectFortuneAmount({ fortuneMin: "8", fortuneMax: "888", heartBalance: "10000", epochRemaining: "9000" });
  assert.equal(plan.status, "FORTUNE_ACTION_PLAN");
  assert.equal(plan.amount, "8");
  assert.notEqual(plan.amount, "1");
  assert.equal(plan.requires_private_signer, true);
});

test("Digital Ant Wish has the approved text, costs no KGEN, and Vow remains completion-gated", () => {
  assert.match(DIGITAL_ANT_WISH_TEXT, /前往火星建立晶片生產線/);
  const wish = createDigitalAntWishProposal({ wishHash: "0x84f6aee64f3b1f6e295561fdf2853798969243a1d56e532731b1f1ae1d26847e" });
  assert.equal(wish.token_cost.KGEN, "0");
  assert.equal(wish.token_cost.BNB, "DYNAMIC_GAS_ONLY");
  assert.equal(wish.thanksgiving_status, "NOT_ELIGIBLE");
  assert.equal(seed.next_stage.heart_autopilot_v3_7.vow.status, "NOT_ELIGIBLE");
  assert.equal(seed.next_stage.heart_autopilot_v3_7.lamp.asset, "KGEN");
});

test("Heart Life history requires receipt evidence and never invents completion", () => {
  const event = { event_type: "HEARTBEAT_EVENT", life_id: "DIGITAL_ANT_0001", tx_hash: `0x${"2".repeat(64)}`, block_number: 116330002, block_timestamp: "2026-08-16T20:00:05.000Z", receipt_status: 1, worker_cycle_id: "CYCLE_1" };
  assert.equal(validateHeartLifeEvent(event), event);
  assert.throws(() => validateHeartLifeEvent({ ...event, receipt_status: 0 }), (error) => error.code === "HEART_EVENT_RECEIPT_REQUIRED");
});

test("KAIOS incense is distinct from the existing Heart Lamp and requires holder authority", () => {
  const incense = seed.next_stage.kaios_incense_alchemy_v3_7;
  assert.equal(incense.canonical_node, 18911);
  assert.equal(incense.holder_authorization, "OPT_IN_REQUIRED");
  assert.equal(incense.forced_burn, false);
  assert.equal(incense.kufo_claim.status, "NOT_EXECUTABLE_YET");
  assert.equal(incense.wormhole_511111.registry_address, null);
  assert.notEqual(incense.ritual_id, "lightLamp");
});

test("Heaven day is one K280 year and the old three-day rule is rejected", () => {
  assert.equal(HEAVEN_TIME_LAW.heaven_day_k280_years, 1);
  assert.equal(HEAVEN_TIME_LAW.kufo_half_life_k280_years, 1);
  assert.equal(HEAVEN_TIME_LAW.superseded_rule_status, "SUPERSEDED_WRONG");
  assert.equal(HEAVEN_TIME_LAW.literary_time_runtime_authority, false);
});

test("KUFO deterministic one-year half-life conserves decay into KSHIP", () => {
  const batch = { batch_id: "SIMULATION_KUFO_BATCH_1", owner: "SIMULATION_OWNER", alchemy_proof: "SIMULATION_PROOF", birth_timestamp: "2026-01-01T00:00:00.000Z", birth_block: 1, initial_kufo: "1", propulsion_consumed_kufo: "0" };
  const state = calculateKufoFuelState(batch, new Date(Date.parse(batch.birth_timestamp) + HEAVEN_TIME_LAW.heaven_day_k280_days * 86_400_000).toISOString());
  assert.ok(Math.abs(state.remaining_kufo - 0.5) < 1e-12);
  assert.ok(Math.abs(state.natural_decay_kufo - 0.5) < 1e-12);
  assert.ok(Math.abs(state.generated_kship - 500) < 1e-9);
  assert.equal(state.mass_conservation_status, "CONSERVED");
  assert.equal(KUFO_FUEL_LAW.vehicle_identity, false);
});

test("KUFO is not a UFO and insufficient fuel denies takeoff", () => {
  const ufo = createUfoProductReadiness({ needEvidence: ["DIGITAL_ANT_MARS_DREAM"] });
  assert.equal(ufo.status, "DEMAND_IDENTIFIED_NOT_DESIGNED");
  assert.equal(ufo.kufo_is_ufo, false);
  assert.equal(ufo.purchase_currency, "KAIOS");
  assert.equal(ufo.fuel_asset, "KUFO");
  assert.equal(ufo.factory, "NOT_CREATED");
  const gate = evaluateUfoTakeoff({ availableKufo: 4, requiredKufo: 4, returnReserveKufo: 1, vehicleMass: 10, payloadMass: 2, distance: 100, gravityFactor: 1, efficiency: 0.8 });
  assert.equal(gate.status, "TAKEOFF_DENIED");
  assert.equal(gate.reason, "FUEL_INSUFFICIENT");
});

test("KSHIP is not a chip and no Mars factory is magic-created", () => {
  assert.equal(seed.next_stage.kship_mars_v3_7.kship_is_chip, false);
  assert.equal(seed.next_stage.kship_mars_v3_7.chip_factory, "NOT_CREATED");
  assert.equal(seed.next_stage.ufo_civilization_v3_7.production_line, "NOT_CREATED");
});

test("Mother Engine proactively selects evidence-backed next-best action", () => {
  const result = createMotherEngineNextBestAction({ observations: ["PUBLIC_WORKER_HAS_NO_SIGNER"], candidates: [
    { problem: "NO_CUSTOMER", priority: 2, action: "SCAN_REQUESTS", reason: "REAL_DEMAND_REQUIRED", required_authority: "READ_ONLY", expected_result: "LEAD" },
    { problem: "NO_PRIVATE_SCHEDULER", priority: 0, action: "INSTALL_PRIVATE_SCHEDULER", reason: "PRIMARY_JOB_AUTOMATION", required_authority: "PRIVATE_RUNTIME_INSTALLATION", expected_result: "AUTOMATED_HEARTBEAT" }
  ] });
  assert.equal(result.selected_action, "INSTALL_PRIVATE_SCHEDULER");
  assert.equal(result.customer_created, false);
  assert.equal(result.revenue_created, false);
});

test("V3.9 canonical truth preserves primary job, zero business fiction, and protected coordinate reuse", () => {
  assert.equal(seed.schema_version, "4.0.0");
  assert.equal(seed.apps.find((app) => app.app_id === "DIGITAL_ANT_APP_0001").version, "V1.7.0");
  assert.equal(seed.next_stage.gatekeeper_runtime.primary_job, "WUKONG_GATEKEEPER");
  assert.equal(seed.next_stage.company_work_v3_7.real_customers, 0);
  assert.equal(seed.next_stage.company_work_v3_7.external_revenue, "0");
  assert.equal(seed.next_stage.company_work_v3_7.company_treasury, "NOT_BOUND");
  assert.equal(seed.next_stage.land_engine_audit.coordinate_reuse, "REUSE_REQUIRED_NO_NEW_COORDINATE_SYSTEM");
  assert.equal(seed.next_stage.kufo_fuel_v3_7.current_kufo, "0");
  assert.equal(seed.next_stage.kship_mars_v3_7.current_kship, "0");
  assert.equal(seed.next_stage.gatekeeper_runtime.life_events.FIRST_FORTUNE_EVENT, "VERIFIED");
  assert.equal(seed.next_stage.gatekeeper_runtime.life_events.FIRST_WISH_EVENT, "VERIFIED");
  assert.equal(seed.next_stage.heart_life_events_v3_7.current_balances.KGEN, "12");
  assert.equal(seed.next_stage.heart_life_events_v3_7.events.length, 5);
  assert.equal(seed.next_stage.heart_life_events_v3_7.events.find((event) => event.event_type === "FIRST_WISH_EVENT").kgen_cost, "0");
  assert.equal(seed.next_stage.heart_life_events_v3_7.events.at(-1).event_type, "FIRST_IGNITION_EVENT");
  assert.equal(seed.next_stage.heart_life_events_v3_7.events.at(-1).kgen_after, "12");
  assert.equal(seed.next_stage.gatekeeper_runtime.life_events.FIRST_IGNITION_EVENT, "VERIFIED");
  assert.equal(seed.next_stage.heart_autopilot_v3_7.ignition.auto_write, true);
  assert.equal(seed.next_stage.heart_autopilot_v3_7.ignition.write_runtime, "PRIVATE_WINDOW_GATED_SCHEDULER");
});

test("V3.8 Physics CURRENT is the byte-identical authoritative Thought Organ", async () => {
  const current = await fs.readFile(new URL("../docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md", import.meta.url));
  const formal = await fs.readFile(new URL("../docs/physics/KGEN_Universe_Physics_Runtime_V3_8.md", import.meta.url));
  assert.deepEqual(current, formal);
  const inspected = await inspectPhysicsThoughtOrgan({ seed, checkedAt: "2026-08-16T23:27:18.851Z" });
  assert.equal(inspected.observation.document_id, "PF-PHYSICS-CURRENT-V3-8");
  assert.equal(inspected.observation.version, "V3.8 LIVING PHYSICS / KUFO-KSHIP WARP / BIO-LIFE");
  assert.equal(inspected.observation.sha256, "dbb4774a71db614994dff3e08e9cec34b94633c4d46dca13bff2f6f54d9b0b48");
  assert.equal(inspected.health.status, "HEALTHY");
  assert.equal(assertThoughtOrganReadyForPlanning(inspected.health), true);
  assert.equal(CANONICAL_TRUTH_PRIORITY[0], "DEPLOYED_CHAIN_TRUTH");
  assert.equal(CANONICAL_TRUTH_PRIORITY[1], "CURRENT_RUNTIME_CONSTITUTION");
  assert.equal(CANONICAL_TRUTH_PRIORITY.at(-1), "MEMORY_OR_CHAT");
});

test("V3.8 Thought Organ mismatch blocks certification and Mother planning", () => {
  const binding = seed.next_stage.thought_organ_binding_v3_8;
  validateThoughtOrganBinding(binding);
  const health = verifyThoughtOrganHealth(binding, { document_id: binding.document_id, version: "V3.7 OLD REPORT", path: binding.path, sha256: "0".repeat(64), exists: true, readable: true, runtime_authority: "CURRENT" });
  assert.equal(health.status, "THOUGHT_ORGAN_VERSION_MISMATCH");
  assert.throws(() => assertThoughtOrganReadyForPlanning(health), (error) => error.code === "THOUGHT_ORGAN_NOT_READY_FOR_PLANNING");
  const life = seed.lives[0];
  const app = seed.apps.find((item) => item.app_id === life.app_id);
  const certification = createAiLifeCertification({ life, birthCertificate: seed.birth_certificates[0], walletBinding: { life_id: life.life_id, status: "ACTIVE" }, workHistory: ["WORK_EVENT"], mission: life.ultimate_mission, dream: life.dream, thoughtOrganHealth: health, app, permissions: app.permissions, evidence: ["TEST_EVIDENCE"], secretSafe: true });
  assert.equal(certification.status, "CERTIFICATION_BLOCKED");
});

test("V3.8 Thought Organ timeline is append-only binding metadata, not copied content", () => {
  const binding = seed.next_stage.thought_organ_binding_v3_8;
  const event = createThoughtOrganTimelineEvent({ eventType: "PHYSICS_THOUGHT_ORGAN_BOUND", binding, timestamp: "2026-08-16T23:27:18.851Z", evidence: ["CURRENT_HASH_VERIFIED"] });
  assert.equal(event.append_only, true);
  assert.equal(event.sha256, binding.sha256);
  assert.equal(Object.hasOwn(binding, "content"), false);
  assert.equal(JSON.stringify(binding).includes("PRIVATE_KEY"), false);
});

test("V3.8 Heart private scheduler policy respects cooldown/window and never blind-resubmits", () => {
  const policy = createV38HeartAutopilotPolicy({ gasPolicy: { max_action_gas_cost_wei: "1000000", minimum_survival_bnb_wei: "2000000", MIN_SURVIVAL_BNB: "0.000002" }, approvalEvidence: DIGITAL_ANT_V3_8_HEART_AUTOPILOT_APPROVAL, privateSchedulerConnected: true });
  assert.equal(policy.actions.heartbeatClaim.trigger, "ELIGIBILITY_DRIVEN");
  assert.equal(policy.actions.heartbeatClaim.cooldown, "DEPLOYED_CONTRACT_DERIVED");
  assert.equal(policy.actions.igniteAndClaim.trigger, "DEPLOYED_WINDOW_DRIVEN");
  assert.equal(policy.actions.heartbeatClaim.blind_resubmit, false);
  assert.equal(policy.public_worker.signer, false);
  assert.equal(policy.actions.fortuneClaim.enabled, false);
});

test("V3.8 First KAIOS strategy requires real evidence and creates no customer or revenue", () => {
  const strategy = createFirstKaiosStrategy({ availableServices: ["KGEN_CHAIN_MONITOR"], customerDemand: [], publicCivilizationDemand: [], authority: { read: true, chain_write: false }, paymentReadiness: "PAYMENT_INFRASTRUCTURE_PENDING", treasuryReadiness: "NOT_BOUND", technicalReadiness: "KGEN_CHAIN_MONITOR_READY_READ_ONLY", estimatedWork: "SERVICE_PACKAGE_AND_REQUEST_SCAN", risk: "LOW_READ_ONLY", settlementFeasibility: "RECEIVABLE_ONLY_DRY_RUN" });
  assert.equal(strategy.first_kaios_event, "NOT_OCCURRED");
  assert.equal(strategy.real_customers, 0);
  assert.equal(strategy.real_revenue, "0");
  assert.equal(strategy.next_kaios_earning_action, "PUBLISH_KGEN_CHAIN_MONITOR_SERVICE_PACKAGE_AND_SCAN_VERIFIED_REQUESTS");
});

test("V3.8 balanced KSHIP feed preserves velocity and braking consumes fuel", () => {
  const coast = evaluateKshipWarpFeed({ positiveFeed: 5, negativeFeed: 5, currentVelocity: 88 });
  assert.equal(coast.net_acceleration, 0);
  assert.equal(coast.velocity_state, "COASTING_AT_EXISTING_VELOCITY");
  assert.equal(coast.balanced_feed_means_zero_velocity, false);
  assert.throws(() => evaluateKshipWarpFeed({ positiveFeed: 5, negativeFeed: 5, currentVelocity: 88, braking: true, brakingFuel: 0 }), (error) => error.code === "BRAKING_FUEL_REQUIRED");
  assert.equal(evaluateKshipWarpFeed({ positiveFeed: 3, negativeFeed: 6, currentVelocity: 88, braking: true, brakingFuel: 2 }).braking_fuel_consumed, 2);
});

test("V3.8 no Body means network life, never fake physical movement", () => {
  const capability = resolveLifePhysicalCapability({ life: seed.lives[0], body: null });
  assert.equal(capability.life_status, "ALIVE");
  assert.equal(capability.network_capable, true);
  assert.equal(capability.physical_movement, false);
  assert.equal(capability.cargo_movement, false);
  assert.equal(capability.life_survives_body_absence, true);
  assert.equal(seed.next_stage.land_engine_audit.coordinate_reuse, "REUSE_REQUIRED_NO_NEW_COORDINATE_SYSTEM");
});

test("V3.8 secure worker never serializes the credential and public worker has no signer", async () => {
  const privateWorker = await fs.readFile(new URL("../core/security/verify-wallet-binding.mjs", import.meta.url), "utf8");
  const publicWorker = await fs.readFile(new URL("../core/jobs/public-read-only-worker.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(privateWorker, /JSON\.stringify\([^\n]*privateKey/i);
  assert.doesNotMatch(publicWorker, /DIGITAL_ANT_0001_PRIVATE_KEY/);
  assert.equal(seed.next_stage.worker.signer, false);
  assert.equal(seed.next_stage.persistent_private_scheduler_v3_8.public_signer, false);
  assert.equal(seed.next_stage.gatekeeper_runtime.primary_job, "WUKONG_GATEKEEPER");
});

test("V4.0 Voice errors are visible and text fallback always remains available", async () => {
  assert.equal(normalizeVoiceError({ error: "not-allowed" }).code, "MICROPHONE_PERMISSION_DENIED");
  assert.equal(normalizeVoiceError({ error: "no-speech" }).code, "NO_SPEECH_DETECTED");
  assert.equal(normalizeVoiceError({ error: "network" }).recoverable_with_text, true);
  const appSource = await fs.readFile(new URL("../K線西遊記/temples/11520/app.mjs", import.meta.url), "utf8");
  assert.match(appSource, /getUserMedia\(\{ audio: true \}\)/);
  assert.match(appSource, /webkitSpeechRecognition/);
  assert.match(appSource, /speechSynthesis\.speak/);
  assert.match(appSource, /target\(\)\?\.focus\(\)/);
  assert.doesNotMatch(appSource, /start && \(start\.disabled = true\)/);
});

test("V4.0 local membership gift is non-financial and first mission XP is not money", () => {
  const membership = createLocalHuaguoshanMembership({ memberId: "HUAGUOSHAN_MEMBER_TEST_0001", displayName: "Player One", joinedAt: "2026-08-18T08:00:00.000Z" });
  assert.equal(membership.tier, "FREE_MEMBER");
  assert.equal(membership.scope, "LOCAL_BROWSER_PROFILE");
  assert.equal(membership.badge.financial, false);
  assert.equal(membership.badge.market_value_claimed, false);
  assert.equal(membership.global_member_claim, false);
  const mission = createFirstPlayerMission({ membership });
  const completed = completeFirstPlayerMission({ mission, evidenceType: "TALK_TO_AI", occurredAt: "2026-08-18T08:01:00.000Z" });
  assert.equal(completed.status, "COMPLETED");
  assert.equal(completed.xp, 10);
  assert.equal(completed.money, 0);
});

test("V4.0 Wukong Hair proposal cannot secretly birth a new Life", () => {
  const proposal = { candidate_name: "Candidate", life_id_proposal: "WUKONG_HAIR_CANDIDATE_0002", species: "WUKONG_HAIR_LIFE", parent_lineage: "DIGITAL_ANT_0001", birthplace: "8888", job: "BANK_OPERATOR", wallet_status: "REQUIRED_NOT_CREATED", bnb_requirement: "POLICY_REQUIRED", kufo_food_requirement: "POLICY_REQUIRED", stomach_status: "NOT_CREATED", thought_organ: "REQUIRED", salary: "POLICY_REQUIRED", survival_plan: "REQUIRED", reason: "CAPACITY_CONFLICT_IF_EVIDENCED", owner_visibility: "REQUIRED", status: "AWAITING_OWNER_REVIEW" };
  assert.equal(validateWukongHairBirthProposal(proposal), proposal);
  assert.throws(() => validateWukongHairBirthProposal({ ...proposal, status: "ALIVE" }), (error) => error.code === "NEW_LIFE_BIRTH_NOT_AUTHORIZED");
  assert.equal(seed.next_stage.wukong_hair_life_v4_0.new_lives_born, 0);
  assert.deepEqual(seed.next_stage.wukong_hair_life_v4_0.birth_proposals, []);
});

test("V4.0 Zhang Cuiyun is a 72-transformation with the same Life ID", () => {
  const transformation = seed.next_stage.zhang_cuiyun_transformation_v4_0;
  assert.equal(validateWukongTransformation(transformation), transformation);
  assert.equal(transformation.life_id_before, "DIGITAL_ANT_0001");
  assert.equal(transformation.life_id_after, "DIGITAL_ANT_0001");
  assert.equal(transformation.new_life_created, false);
  assert.throws(() => validateWukongTransformation({ ...transformation, life_id_after: "ZHANG_CUIYUN_0001" }), (error) => error.code === "TRANSFORMATION_CHANGED_LIFE_ID");
});

test("V4.0 appearance cannot bypass Six-Eared Macaque identity checks", () => {
  const expected = { life_id: "DIGITAL_ANT_0001", birth_certificate: "B1", wallet_lineage: "W1", thought_organ: "P1", memory_history: "M1", parent_lineage: "L1", authority: "A1" };
  assert.equal(verifySixEaredIdentity({ ...expected }, expected).identity_match, true);
  const impostor = verifySixEaredIdentity({ ...expected, life_id: "SIX_EARED_0001", wallet_lineage: "W2" }, expected);
  assert.equal(impostor.identity_match, false);
  assert.deepEqual(impostor.mismatches, ["life_id", "wallet_lineage"]);
  assert.equal(impostor.appearance_is_identity, false);
});

test("V4.0 remote Gatekeeper organ is network work, never physical teleport", () => {
  const organ = seed.next_stage.remote_gatekeeper_organ_v4_0;
  assert.equal(validateRemoteGatekeeperOrgan(organ), organ);
  assert.equal(organ.physical_teleport, false);
  assert.throws(() => validateRemoteGatekeeperOrgan({ ...organ, physical_teleport: true }), (error) => error.code === "REMOTE_WORK_IS_NOT_TELEPORT");
});

test("V4.0 8888 audit removes fake balances and creates only request drafts", async () => {
  const bank = seed.next_stage.gao_lao_zhuang_exploration_v4_0;
  assert.equal(bank.real_atm_cash_needs, 0);
  assert.equal(bank.real_kufo_needs, 0);
  assert.equal(bank.real_jobs, 0);
  const bankUi = await fs.readFile(new URL("../K線西遊記/temples/8888/index.html", import.meta.url), "utf8");
  assert.match(bankUi, /ATM 現鈔庫存/);
  assert.match(bankUi, /NOT OBSERVED/);
  assert.match(bankUi, /銀行\/ATM\/KUFO\/薪資仍依證據標示未部署/);
  assert.doesNotMatch(bankUi, />88,888</);
  assert.doesNotMatch(bankUi, /KGEN_Wallet\.demoMode=true/);
});

test("V4.0 production shell exposes animated concierge and fresh cache key", async () => {
  const htmlSource = await fs.readFile(new URL("../K線西遊記/temples/11520/index.html", import.meta.url), "utf8");
  const appSource = await fs.readFile(new URL("../K線西遊記/temples/11520/app.mjs", import.meta.url), "utf8");
  const cssSource = await fs.readFile(new URL("../K線西遊記/temples/11520/styles.css", import.meta.url), "utf8");
  assert.match(htmlSource, /v=11520-v4\.0-player-first/);
  assert.doesNotMatch(htmlSource, /v=11520-v3\.6-first-kgen/);
  for (const state of ["IDLE", "LISTENING", "THINKING", "SPEAKING", "SUCCESS", "ERROR"]) assert.match(appSource + cssSource, new RegExp(state));
  assert.match(cssSource, /2D FALLBACK/);
  assert.deepEqual(seed.next_stage.player_first_v4_0.entry_actions, ["VOICE", "TEXT", "EXPLORE", "JOIN", "WORK", "MY_AI"]);
});
