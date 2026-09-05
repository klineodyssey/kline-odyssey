import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repo = path.resolve(import.meta.dirname, "..", "..");
const reportPath = path.join(repo, "KGEN-KAIOS", "reports", "CURRENT_LINEAGE_RECONCILIATION.json");
const activeFiles = [
  "docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md",
  "docs/physics/KGEN_KAIOS_SCALE_AND_PLANCK_RUNTIME_CURRENT.md",
  "KGEN-KAIOS/KAIOS_WHITE_HOLE_ATOMIC_CONVERSION_AND_LIQUIDITY_RUNTIME_CURRENT.md",
  "KGEN-KAIOS/UNIVERSE_EXCHANGE_RUNTIME_CURRENT.md",
  "docs/constitution/01_KGEN_Universe_Constitution.md",
  "docs/constitution/02_KAIOS_Civilization_Constitution.md",
  "docs/constitution/03_Celestial_Bank_18888.md",
  "K線西遊記/data/kgen-5d-world-map.json",
  "KGEN-KAIOS/contracts/KAIOS.sol",
  "KGEN/contracts/KGEN_TempleHeart_Upgradeable.sol",
];
const forbidden = [
  "1 KGEN = 1 kg",
  "10,000 KAIOS",
  "KAIOS_PER_KGEN = 10_000",
  "IKAIOSBurnProofGenesis",
  "Species → Cell → Organ",
];
const safeConflictReferenceFiles = new Set([
  "docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md",
  "docs/physics/KGEN_KAIOS_SCALE_AND_PLANCK_RUNTIME_CURRENT.md",
]);
const auditedPathAliases = new Map([
  [
    "docs/Whitepaper/18888_Celestial_Autonomous_Bank_Whitepaper_V1.0_Genesis_Edition.md",
    "docs/whitepaper/18888_Celestial_Autonomous_Bank_Whitepaper_V1.0_Genesis_Edition.md",
  ],
]);
const failures = [];

for (const relativePath of activeFiles) {
  const absolutePath = path.join(repo, relativePath);
  const content = fs.readFileSync(absolutePath, "utf8");
  for (const pattern of safeConflictReferenceFiles.has(relativePath) ? [] : forbidden) {
    if (content.includes(pattern)) failures.push({ path: relativePath, pattern });
  }
}

const audit = JSON.parse(
  fs.readFileSync(
    path.join(repo, "KGEN-KAIOS", "reports", "KAIOS_LINEAGE_STALE_REFERENCE_AUDIT_2026-08-09.json"),
    "utf8",
  ),
);
for (const finding of audit.findings.filter((item) => item.classification === "CURRENT-CONFLICT")) {
  if (!finding.path.startsWith("PR#127:")) failures.push({ reason: "UNRESOLVED_CURRENT_CONFLICT", finding });
}
for (const relativePath of new Set(
  audit.findings
    .filter((item) => item.classification === "HISTORICAL-ARCHIVE")
    .map((item) => item.path),
)) {
  if (relativePath.includes("/archive/") || relativePath.includes("_ARCHIVE")) continue;
  const resolvedRelativePath = auditedPathAliases.get(relativePath) ?? relativePath;
  const absolutePath = path.join(repo, resolvedRelativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push({ path: relativePath, resolvedPath: resolvedRelativePath, reason: "HISTORICAL_AUDIT_FILE_NOT_FOUND" });
    continue;
  }
  const header = fs.readFileSync(absolutePath, "utf8").split(/\r?\n/u).slice(0, 12).join("\n");
  if (!header.includes("SUPERSEDED")) failures.push({ path: resolvedRelativePath, reason: "MISSING_SUPERSEDED_MARKER" });
}

const assertions = {
  kgenMassScale: /1 KGEN\s*=\s*1,?000 kg/u.test(fs.readFileSync(path.join(repo, activeFiles[0]), "utf8")),
  kaiosRatio: fs.readFileSync(path.join(repo, "KGEN-KAIOS/contracts/KAIOS.sol"), "utf8").includes("KAIOS_PER_KGEN = 1_000"),
  frictionMirror: fs.readFileSync(path.join(repo, "KGEN-KAIOS/contracts/KAIOS.sol"), "utf8").includes("IKGENSupply(KGEN).totalSupply()"),
  organRegistry: fs.readFileSync(path.join(repo, "KGEN-KAIOS/contracts/KAIOS.sol"), "utf8").includes("ORGAN_REGISTRY.organ"),
  noMainnetDeployment: !fs.existsSync(path.join(repo, "KGEN-KAIOS", "deployments", "mainnet.json")),
  staleCurrentFindingsLimitedToPr127:
    audit.findings.filter((item) => item.classification === "CURRENT-CONFLICT").every((item) => item.path.startsWith("PR#127:")),
};
for (const [name, passed] of Object.entries(assertions)) {
  if (!passed) failures.push({ assertion: name });
}

const report = {
  status: failures.length === 0 ? "PASS" : "FAIL",
  activeFiles,
  forbidden,
  assertions,
  auditedPathAliases: Object.fromEntries(auditedPathAliases),
  failures,
};
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`CURRENT lineage reconciliation: ${report.status}`);
if (failures.length) process.exit(1);
