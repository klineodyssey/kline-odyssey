import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import solc from "solc";
import { keccak256, toUtf8Bytes } from "ethers";

const root = path.resolve(import.meta.dirname, "..");
const sourceRoots = [path.join(root, "contracts"), path.join(root, "tests", "contracts")];
const externalSources = [
  path.resolve(root, "..", "KGEN", "contracts", "KGEN_TempleHeart_Upgradeable.sol"),
  path.resolve(root, "..", "KGEN", "contracts", "KGEN_Token_V7_5_2.sol"),
];
const artifactsDir = path.join(root, "artifacts");
const reportsDir = path.join(root, "reports");

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
fs.mkdirSync(artifactsDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const contracts = [];
const compiledArtifacts = new Map();
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
      deployedBytecodeBytes: artifact.evm.deployedBytecode.object.length / 2,
    });
    compiledArtifacts.set(contractName, { sourceName, abi: artifact.abi });
  }
}

function constructorInputs(contractName) {
  const artifact = compiledArtifacts.get(contractName);
  if (!artifact) throw new Error(`Deployment contract not compiled: ${contractName}`);
  return (artifact.abi.find((entry) => entry.type === "constructor")?.inputs ?? []).map(({ name, type }) => ({
    name,
    type,
  }));
}

function deploymentStage(order, contractName, dependencies = []) {
  const artifact = compiledArtifacts.get(contractName);
  if (!artifact) throw new Error(`Deployment contract not compiled: ${contractName}`);
  return {
    order,
    contractName,
    sourceName: artifact.sourceName,
    constructorInputs: constructorInputs(contractName),
    dependencies,
    candidateAddress: null,
  };
}

const organKeys = [
  "KAIOS.ORGAN.FURNACE.18911",
  "KAIOS.ORGAN.WORMHOLE.511111",
  "KAIOS.ORGAN.KSHIP.CONVERTER",
  "KAIOS.ORGAN.K108000.MASS_ENERGY_REACTOR",
  "KAIOS.ORGAN.K108000.POSITIVE_MATTER_SOURCE",
  "KAIOS.ORGAN.KGEN.WHITE_HOLE.BURN_VERIFIER",
  "KAIOS.ORGAN.KGOD.TOKEN",
];

const unsignedDeploymentPlan = {
  status: "UNSIGNED_PREDEPLOYMENT_CANDIDATE",
  chainId: 56,
  chainWriteAuthorized: false,
  signerUseAuthorized: false,
  allCandidateAddressesMustBeNull: true,
  canonicalFlow: [
    "K18911_KAIOS_ALCHEMY_FURNACE",
    "K511111_KUFO_BIRTH_WORMHOLE",
    "K108000_KSHIP_CONVERTER",
    "K108000_EQUAL_MATTER_REACTOR",
    "K168888_KGOD_BIRTH",
  ],
  externalDependencies: {
    kaiosToken: { candidateAddress: null, verificationRequired: ["CHAIN_ID", "BYTECODE", "TOKEN_IDENTITY"] },
    kgenToken: { candidateAddress: null, verificationRequired: ["CHAIN_ID", "BYTECODE", "TOKEN_IDENTITY"] },
    initialOwner: { candidateAddress: null, verificationRequired: ["CONTROL_PROOF", "AUTHORITY"] },
    registrar: { candidateAddress: null, verificationRequired: ["CONTROL_PROOF", "AUTHORITY"] },
    attestorA: { candidateAddress: null, verificationRequired: ["INDEPENDENCE", "CONTROL_PROOF"] },
    attestorB: { candidateAddress: null, verificationRequired: ["INDEPENDENCE", "CONTROL_PROOF"] },
  },
  stages: [
    deploymentStage(1, "KAIOSOrganRegistry", ["initialOwner", "governanceDelay"]),
    deploymentStage(2, "KUFO", ["KAIOSOrganRegistry"]),
    deploymentStage(3, "KAIOSAlchemyFurnace", ["KAIOS", "KGEN", "KAIOSOrganRegistry"]),
    deploymentStage(4, "KUFOClaimWormhole", ["KAIOSAlchemyFurnace", "KUFO"]),
    deploymentStage(5, "KSHIP", ["KAIOSOrganRegistry", "KUFO"]),
    deploymentStage(6, "KSHIPConverter", ["KUFO", "KSHIP"]),
    deploymentStage(7, "KAIOSShipIdentityRegistry", ["registrar"]),
    deploymentStage(8, "KGENWhiteHoleBurnReplayRegistry", ["KAIOSOrganRegistry"]),
    deploymentStage(9, "KGENWhiteHoleBurnVerifier", ["KGEN", "KGENWhiteHoleBurnReplayRegistry", "attestorA", "attestorB"]),
    deploymentStage(10, "KGENWhiteHoleMatterSource", ["KGENWhiteHoleBurnVerifier", "KAIOSShipIdentityRegistry"]),
    deploymentStage(11, "K108000MassEnergyReactor", ["KSHIP", "KAIOSOrganRegistry", "KAIOSShipIdentityRegistry"]),
    deploymentStage(12, "KGOD", ["K108000MassEnergyReactor"]),
  ],
  organBindings: organKeys.map((key) => ({
    key,
    id: keccak256(toUtf8Bytes(key)),
    candidateAddress: null,
  })),
  postDeploymentGates: [
    "VERIFY_EACH_DEPLOYED_BYTECODE",
    "VERIFY_INTERNAL_VERSION_AND_WORLD_POINT",
    "BIND_ORGANS_THROUGH_GOVERNED_REGISTRY",
    "REGISTER_SHIP_ID_AND_CONTROLLER",
    "RUN_EXACT_HEAD_INTEGRATION_TESTS",
    "INDEPENDENT_REVIEW",
    "SEPARATE_EXACT_ACTION_AUTHORIZATION",
  ],
};

const oversizedContracts = contracts.filter((contract) => contract.deployedBytecodeBytes > 24_576);
const evidence = {
  status: oversizedContracts.length === 0 ? "PASS" : "FAIL",
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
  warnings: diagnostics.filter((diagnostic) => diagnostic.severity === "warning").length,
  contracts,
  unsignedDeploymentPlan,
};
fs.writeFileSync(
  path.join(reportsDir, "SOLIDITY_COMPILE_EVIDENCE.json"),
  `${JSON.stringify(evidence, null, 2)}\n`,
);
console.log(`Compiled ${contracts.length} contracts with ${solc.version()}`);
if (evidence.oversizedContracts.length) process.exit(1);
