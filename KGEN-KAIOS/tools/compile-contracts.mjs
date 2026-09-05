import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import solc from "solc";
import { keccak256 } from "ethers";

const root = path.resolve(import.meta.dirname, "..");
const sourceRoots = [path.join(root, "contracts"), path.join(root, "tests", "contracts")];
const externalSources = [path.resolve(root, "..", "KGEN", "contracts", "KGEN_TempleHeart_Upgradeable.sol")];
const artifactsDir = path.join(root, "artifacts");
const abiDir = path.join(root, "abi");
const reportsDir = path.join(root, "reports");
const templeHeartV332Ref = "7344d231837d40b504622c8c8b4376ed25110e20";
const templeHeartPath = "KGEN/contracts/KGEN_TempleHeart_Upgradeable.sol";

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const sourceFiles = [
  ...sourceRoots.flatMap(walk).filter((file) => file.endsWith(".sol")),
  ...externalSources.filter((file) => fs.existsSync(file)),
];
const sources = Object.fromEntries(
  sourceFiles.map((file) => [path.relative(root, file).replaceAll("\\", "/"), { content: fs.readFileSync(file, "utf8") }]),
);
const templeHeartV332Source = execFileSync("git", ["show", `${templeHeartV332Ref}:${templeHeartPath}`], {
  cwd: path.resolve(root, ".."),
  encoding: "utf8",
}).replace(
  "contract KGEN_TempleHeart_Upgradeable is",
  "contract KGEN_TempleHeart_V3_3_2_Baseline is",
);
sources["tests/baseline/KGEN_TempleHeart_V3_3_2_Baseline.sol"] = { content: templeHeartV332Source };

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 1 },
    viaIR: true,
    evmVersion: "paris",
    metadata: { bytecodeHash: "none" },
    outputSelection: {
      "*": {
        "*": [
          "abi",
          "evm.bytecode.object",
          "evm.deployedBytecode.object",
          "evm.deployedBytecode.immutableReferences",
          "storageLayout",
        ],
      },
    },
  },
};

function findImports(importPath) {
  const candidates = [
    path.join(root, importPath),
    path.join(root, "node_modules", importPath),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return { contents: fs.readFileSync(candidate, "utf8") };
  }
  return { error: `Import not found: ${importPath}` };
}

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
const diagnostics = output.errors ?? [];
for (const diagnostic of diagnostics) {
  const writer = diagnostic.severity === "error" ? console.error : console.warn;
  writer(diagnostic.formattedMessage);
}
if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) process.exit(1);

fs.rmSync(artifactsDir, { recursive: true, force: true });
fs.rmSync(abiDir, { recursive: true, force: true });
fs.mkdirSync(artifactsDir, { recursive: true });
fs.mkdirSync(abiDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const contracts = [];
for (const [sourceName, sourceContracts] of Object.entries(output.contracts ?? {})) {
  for (const [contractName, artifact] of Object.entries(sourceContracts)) {
    if (!artifact.evm?.bytecode?.object) continue;
    const outputPath = path.join(artifactsDir, `${contractName}.json`);
    fs.writeFileSync(
      outputPath,
      `${JSON.stringify({
        contractName,
        sourceName,
        compiler: solc.version(),
        abi: artifact.abi,
        bytecode: `0x${artifact.evm.bytecode.object}`,
        deployedBytecode: `0x${artifact.evm.deployedBytecode.object}`,
        immutableReferences: artifact.evm.deployedBytecode.immutableReferences ?? {},
        storageLayout: artifact.storageLayout,
      }, null, 2)}\n`,
    );
    contracts.push({
      contractName,
      sourceName,
      bytecodeBytes: artifact.evm.bytecode.object.length / 2,
      bytecodeHash: keccak256(`0x${artifact.evm.bytecode.object}`),
      deployedBytecodeBytes: artifact.evm.deployedBytecode.object.length / 2,
      deployedBytecodeHash: keccak256(`0x${artifact.evm.deployedBytecode.object}`),
    });
    if (
      [
        "LingxiaoCelestialBank18888_Upgradeable",
        "CelestialSeat500_Upgradeable",
        "CivilizationAllocation_Upgradeable",
        "EconomicRouter8888_Upgradeable",
        "ExchangeSettlement11520_Upgradeable",
        "BankRiskController_Upgradeable",
        "BankGovernance_Upgradeable",
        "BankMigration_Upgradeable",
        "GaolaozhuangCommercialBank8888_Upgradeable",
        "KAIOS",
        "KAIOSGenesisInscription",
      ].includes(contractName)
    ) {
      fs.writeFileSync(
        path.join(abiDir, `${contractName}.json`),
        `${JSON.stringify(artifact.abi, null, 2)}\n`,
      );
    }
  }
}

const oversizedContracts = contracts.filter((contract) => contract.deployedBytecodeBytes > 24_576);
const lingxiaoArtifact = Object.values(output.contracts ?? {})
  .flatMap((sourceContracts) => Object.entries(sourceContracts))
  .find(([contractName]) => contractName === "LingxiaoCelestialBank18888_Upgradeable")?.[1];
const expectedLingxiaoStorage = [
  { label: "kgen", slot: "0", offset: 0, type: "t_address" },
  { label: "kaios", slot: "1", offset: 0, type: "t_address" },
  { label: "kaiosBound", slot: "1", offset: 20, type: "t_bool" },
  { label: "totalKaiosDisbursed", slot: "2", offset: 0, type: "t_uint256" },
  { label: "_disbursements", slot: "3", offset: 0, type: "t_mapping(t_bytes32,t_struct(Disbursement)_storage)" },
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
];
const actualLingxiaoStorage = (lingxiaoArtifact?.storageLayout?.storage ?? []).map(
  ({ label, slot, offset, type }) => ({
    label,
    slot,
    offset,
    type: type.replace(/t_struct\(([^)]+)\)\d+_storage/g, "t_struct($1)_storage"),
  }),
);
const lingxiaoStorageMatches =
  JSON.stringify(actualLingxiaoStorage) === JSON.stringify(expectedLingxiaoStorage);
const upgradeableModuleNames = [
  "CelestialSeat500_Upgradeable",
  "CivilizationAllocation_Upgradeable",
  "EconomicRouter8888_Upgradeable",
  "ExchangeSettlement11520_Upgradeable",
  "BankRiskController_Upgradeable",
  "BankGovernance_Upgradeable",
  "BankMigration_Upgradeable",
];
const upgradeableModuleStorage = upgradeableModuleNames.map((contractName) => {
  const artifact = Object.values(output.contracts ?? {})
    .flatMap((sourceContracts) => Object.entries(sourceContracts))
    .find(([name]) => name === contractName)?.[1];
  const layout = artifact?.storageLayout;
  const storage = layout?.storage ?? [];
  const namespaceSlots = storage.reduce((maximum, entry) => {
    const bytes = Number(layout.types[entry.type]?.numberOfBytes ?? 32);
    return Math.max(maximum, Number(entry.slot) + Math.ceil(bytes / 32));
  }, 0);
  const basePrefixPreserved = storage[0]?.label === "bank" && storage[0]?.slot === "0"
    && storage[1]?.label === "moduleId" && storage[1]?.slot === "1";
  return {
    contractName,
    status: namespaceSlots === 100 && basePrefixPreserved ? "PASS" : "FAIL",
    namespaceSlots,
    basePrefixPreserved,
  };
});
const upgradeableModuleStorageMatches = upgradeableModuleStorage.every((item) => item.status === "PASS");
const celestialSeatArtifact = Object.values(output.contracts ?? {})
  .flatMap((sourceContracts) => Object.entries(sourceContracts))
  .find(([contractName]) => contractName === "CelestialSeat500_Upgradeable")?.[1];
const celestialSeatStorage = celestialSeatArtifact?.storageLayout?.storage ?? [];
const normalizedCelestialSeatStorage = celestialSeatStorage.map(({ label, slot, offset, type }) => ({
  label,
  slot,
  offset,
  type: type
    .replace(/t_struct\(([^)]+)\)\d+_storage/g, "t_struct($1)_storage")
    .replace(/t_contract\(([^)]+)\)\d+/g, "t_contract($1)"),
}));
const expectedCelestialSeatPrefix = [
  { label: "bank", slot: "0", offset: 0 },
  { label: "moduleId", slot: "1", offset: 0 },
  { label: "governanceFinalized", slot: "2", offset: 0 },
  { label: "bootstrapUpgrader", slot: "2", offset: 1 },
  { label: "__gap", slot: "3", offset: 0 },
  { label: "salaryEpochSeconds", slot: "50", offset: 0 },
  { label: "seatCount", slot: "51", offset: 0 },
  { label: "totalSalaryClaimed", slot: "52", offset: 0 },
  { label: "_seats", slot: "53", offset: 0 },
];
const celestialSeatPrefixPreserved = expectedCelestialSeatPrefix.every((expected, index) => {
  const actual = normalizedCelestialSeatStorage[index];
  return actual?.label === expected.label && actual?.slot === expected.slot && actual?.offset === expected.offset;
});
const celestialSeatAppendOnly = normalizedCelestialSeatStorage[9]?.label === "_salaryBaseCheckpoints"
  && normalizedCelestialSeatStorage[9]?.slot === "54"
  && normalizedCelestialSeatStorage[10]?.label === "_calendarSeats"
  && normalizedCelestialSeatStorage[10]?.slot === "55"
  && normalizedCelestialSeatStorage[11]?.label === "_seatTermsCheckpoints"
  && normalizedCelestialSeatStorage[11]?.slot === "56"
  && normalizedCelestialSeatStorage[12]?.label === "__gap"
  && normalizedCelestialSeatStorage[12]?.slot === "57"
  && celestialSeatArtifact?.storageLayout?.types[celestialSeatStorage[12]?.type]?.numberOfBytes === "1376";
const celestialSeatStructType = celestialSeatArtifact?.storageLayout?.types[celestialSeatStorage[8]?.type]?.value;
const celestialSeatStruct = celestialSeatArtifact?.storageLayout?.types[celestialSeatStructType];
const expectedSeatMembers = [
  ["lifeId", "0", 0], ["templeId", "1", 0], ["beneficiary", "2", 0],
  ["salaryPerEpoch", "3", 0], ["activatedAt", "3", 16], ["salaryCheckpoint", "3", 24],
  ["claimedAmount", "4", 0], ["status", "5", 0],
];
const celestialSeatStructPreserved = expectedSeatMembers.every(([label, slot, offset], index) => {
  const actual = celestialSeatStruct?.members[index];
  return actual?.label === label && actual?.slot === slot && actual?.offset === offset;
});
const celestialSeatStorageMatches = celestialSeatPrefixPreserved && celestialSeatAppendOnly
  && celestialSeatStructPreserved;
const gaolaoArtifact = Object.values(output.contracts ?? {})
  .flatMap((sourceContracts) => Object.entries(sourceContracts))
  .find(([contractName]) => contractName === "GaolaozhuangCommercialBank8888_Upgradeable")?.[1];
const gaolaoStorage = gaolaoArtifact?.storageLayout?.storage ?? [];
const gaolaoNamespaceSlots = gaolaoStorage.reduce((maximum, entry) => {
  const bytes = Number(gaolaoArtifact.storageLayout.types[entry.type]?.numberOfBytes ?? 32);
  return Math.max(maximum, Number(entry.slot) + Math.ceil(bytes / 32));
}, 0);
const expectedGaolaoLabels = [
  "kgen", "kaios", "celestialBank18888", "legacyTreasury", "bootstrapAdmin", "bootstrapUpgrader",
  "kaiosBound", "paused", "governanceFinalized", "minimumReserve", "totalAccountLiability",
  "totalPayrollLiability", "totalPaymentLiability", "interestFundingReserve", "totalSalaryPaidToWallet",
  "totalSalaryCreditedToAccounts", "totalCommercialSettlement", "totalInterestCredited",
  "totalPendingInterest", "accountCount", "payrollCount", "paymentCount", "_accounts", "_payroll",
  "_payments", "_interestRates", "__gap",
];
const gaolaoStorageMatches = gaolaoNamespaceSlots === 50
  && JSON.stringify(gaolaoStorage.map((entry) => entry.label)) === JSON.stringify(expectedGaolaoLabels)
  && gaolaoStorage.at(-1)?.label === "__gap"
  && gaolaoStorage.at(-1)?.slot === "23";
const evidence = {
  status: oversizedContracts.length === 0 && lingxiaoStorageMatches && upgradeableModuleStorageMatches && gaolaoStorageMatches ? "PASS" : "FAIL",
  compiler: solc.version(),
  requestedCompiler: "0.8.24",
  optimizer: { enabled: true, runs: 1 },
  viaIR: true,
  evmVersion: "paris",
  openzeppelinContracts: "5.0.2",
  openzeppelinContractsUpgradeable: "5.0.2",
  sourceCount: sourceFiles.length,
  contractCount: contracts.length,
  eip170MaximumDeployedBytecodeBytes: 24_576,
  oversizedContracts,
  lingxiaoCelestialBank18888StorageValidation: {
    status: lingxiaoStorageMatches ? "PASS" : "FAIL",
    strategy: "V2 modular bank preserves slots 0-3, appends module/accounting/risk state in slots 4-13, and consumes ten reserved gap slots while retaining a 50-slot namespace",
    expected: expectedLingxiaoStorage,
    actual: actualLingxiaoStorage,
  },
  upgradeableModuleStorageValidation: {
    status: upgradeableModuleStorageMatches ? "PASS" : "FAIL",
    strategy: "Every module preserves the shared slots 0-1 prefix and reserves a deterministic 100-slot custom namespace",
    modules: upgradeableModuleStorage,
  },
  celestialSeat500StorageValidation: {
    status: celestialSeatStorageMatches ? "PASS" : "FAIL",
    strategy: "Calendar V2 preserves the complete duration-candidate prefix and Seat struct, appends three slots at 54-56, and shrinks only the trailing reserve from 46 to 43 slots",
    prefixPreserved: celestialSeatPrefixPreserved,
    seatStructPreserved: celestialSeatStructPreserved,
    appendOnly: celestialSeatAppendOnly,
    legacyPrefixThroughSlot: 53,
    appendedSlots: [54, 55, 56],
    namespaceSlots: 100,
    layout: normalizedCelestialSeatStorage,
  },
  gaolaozhuangCommercialBank8888StorageValidation: {
    status: gaolaoStorageMatches ? "PASS" : "FAIL",
    strategy: "V1 fixes a deterministic 50-slot append-only namespace; future implementations may only consume the trailing gap",
    namespaceSlots: gaolaoNamespaceSlots,
    labels: gaolaoStorage.map(({ label, slot, offset, type }) => ({ label, slot, offset, type })),
  },
  warnings: diagnostics.filter((diagnostic) => diagnostic.severity === "warning").length,
  contracts,
};
fs.writeFileSync(
  path.join(reportsDir, "SOLIDITY_COMPILE_EVIDENCE.json"),
  `${JSON.stringify(evidence, null, 2)}\n`,
);
console.log(`Compiled ${contracts.length} contracts with ${solc.version()}`);
if (evidence.status !== "PASS") process.exit(1);
