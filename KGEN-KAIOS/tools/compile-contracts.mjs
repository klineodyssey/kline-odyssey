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
fs.mkdirSync(artifactsDir, { recursive: true });
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
  { label: "__gap", slot: "2", offset: 0, type: "t_array(t_uint256)48_storage" },
];
const actualLingxiaoStorage = (lingxiaoArtifact?.storageLayout?.storage ?? []).map(
  ({ label, slot, offset, type }) => ({ label, slot, offset, type }),
);
const lingxiaoStorageMatches =
  JSON.stringify(actualLingxiaoStorage) === JSON.stringify(expectedLingxiaoStorage);
const evidence = {
  status: oversizedContracts.length === 0 && lingxiaoStorageMatches ? "PASS" : "FAIL",
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
    strategy: "Initial V2 UUPS layout locked to two data slots plus a 48-slot reserve gap",
    expected: expectedLingxiaoStorage,
    actual: actualLingxiaoStorage,
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
