import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import solc from "solc";

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

// Preserve main's complete 49-epoch regression against its actual pinned source.
// These are test-only virtual inputs, never successor deployment artifacts.
const legacyLineageRef = "33967045ed725848a6b814af0e9b10eac64f2ec7";
const legacyBaselines = ["KUFO", "KAIOSAlchemyFurnace"];
for (const name of legacyBaselines) {
  const source = execFileSync("git", ["show", `${legacyLineageRef}:KGEN-KAIOS/contracts/${name}.sol`], {
    cwd: path.resolve(root, ".."), encoding: "utf8",
  }).replace(`contract ${name} is`, `contract ${name}LegacyBaseline is`)
    .replace(`contract ${name} {`, `contract ${name}LegacyBaseline {`);
  sources[`contracts/${name}LegacyBaseline.sol`] = { content: source };
}
const sourceSha256 = Object.fromEntries(Object.entries(sources).map(([name, source]) => [
  name, createHash("sha256").update(source.content).digest("hex"),
]));

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

const resolvedImports = {};
function findImports(importPath) {
  const candidates = [
    path.join(root, importPath),
    path.join(root, "node_modules", importPath),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const contents = fs.readFileSync(candidate, "utf8");
      resolvedImports[importPath] = { content: contents };
      return { contents };
    }
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
// Self-contained verification input, including the exact resolved dependencies.
// Constructor values are deliberately separate until Human adopts real values.
const standardInput = `${JSON.stringify({ ...input, sources: { ...sources, ...resolvedImports } }, null, 2)}\n`;
fs.writeFileSync(path.join(artifactsDir, "solidity-standard-input.json"), standardInput);

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
      deployedBytecodeBytes: artifact.evm.deployedBytecode.object.length / 2,
    });
  }
}

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
  sourceCount: Object.keys(sources).length,
  sourceSha256,
  standardInput: { path: "artifacts/solidity-standard-input.json", sha256: createHash("sha256").update(standardInput).digest("hex") },
  legacyLineageRegression: { sourceRef: legacyLineageRef, testOnlyContracts: legacyBaselines.map(name => `${name}LegacyBaseline`) },
  contractCount: contracts.length,
  eip170MaximumDeployedBytecodeBytes: 24_576,
  oversizedContracts,
  warnings: diagnostics.filter((diagnostic) => diagnostic.severity === "warning").length,
  contracts,
};
fs.writeFileSync(
  path.join(reportsDir, "SOLIDITY_COMPILE_EVIDENCE.json"),
  `${JSON.stringify(evidence, null, 2)}\n`,
);
console.log(`Compiled ${contracts.length} contracts with ${solc.version()}`);
if (evidence.oversizedContracts.length) process.exit(1);
