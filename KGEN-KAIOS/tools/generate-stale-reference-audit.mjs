import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repo = path.resolve(import.meta.dirname, "..", "..");
const outputJson = path.join(repo, "KGEN-KAIOS", "reports", "KAIOS_LINEAGE_STALE_REFERENCE_AUDIT_2026-08-09.json");
const outputMarkdown = path.join(repo, "KGEN-KAIOS", "reports", "KAIOS_LINEAGE_STALE_REFERENCE_AUDIT_2026-08-09.md");
const patterns = [
  "1 KGEN = 1 kg",
  "10,000 KAIOS",
  "KAIOS_PER_KGEN = 10_000",
  "BurnProofGenesis",
  "Species → Cell → Organ",
];

const ignoredDirectories = new Set([".git", "node_modules", "artifacts", "reports"]);
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return [];
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function classify(relativePath, line) {
  const normalized = relativePath.replaceAll("\\", "/");
  if (normalized.includes("/tools/")) {
    return ["SAFE", "Audit tooling contains the literal search pattern by design."];
  }
  if (normalized.includes("/tests/") || normalized.startsWith("tests/")) {
    return ["TEST-FIXTURE", "Retain as explicit regression fixture."];
  }
  if (
    normalized.includes("/archive/") ||
    normalized.includes("_ARCHIVE") ||
    /Runtime_V\d|Whitepaper_V\d|_V1[._]|_V3[._]/i.test(normalized)
  ) {
    return ["HISTORICAL-ARCHIVE", "Retain historical bytes; mark superseded by 2026-08-09 lineage law."];
  }
  if (
    normalized.endsWith("CODEX_HANDOFF_2026-08-09.md") ||
    normalized.endsWith("KGEN_KAIOS_SCALE_AND_PLANCK_RUNTIME_CURRENT.md") ||
    normalized.endsWith("KAIOS.md") ||
    normalized.includes("CODEX_KAIOS_WHITE_HOLE_GENESIS_IMPLEMENTATION_INSTRUCTIONS.md") ||
    normalized.includes("CODEX_V4_PENDING_MERGE_NOTES.md") ||
    normalized.endsWith("KGEN_Universe_Physics_PreSpacetime_WhiteHole_AngularMomentum.md") ||
    /supersed|obsolete|conflict|remove legacy/i.test(line)
  ) {
    return ["SAFE", "Reference is an explicit supersession, audit instruction, or conflict example."];
  }
  return ["CURRENT-CONFLICT", "Reconcile active/current content to the 1 metric ton -> 1,000 KAIOS lineage."];
}

const findings = [];
for (const file of walk(repo)) {
  let content;
  try {
    content = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const relativePath = path.relative(repo, file).replaceAll("\\", "/");
  content.split(/\r?\n/u).forEach((line, index) => {
    for (const pattern of patterns) {
      if (!line.includes(pattern)) continue;
      const [classification, action] = classify(relativePath, line);
      findings.push({ path: relativePath, line: index + 1, pattern, classification, action });
    }
  });
}

findings.push(
  {
    path: "PR#127:KGEN/contracts/KGEN_TempleHeart_V3_3_0_Upgradeable.sol",
    line: null,
    pattern: "KAIOS_PER_KGEN = 10_000",
    classification: "CURRENT-CONFLICT",
    action: "Do not merge PR #127; supersede with the version-free integration contract.",
  },
  {
    path: "PR#127:KGEN/contracts/KGEN_TempleHeart_V3_3_1_Upgradeable.sol",
    line: null,
    pattern: "BurnProofGenesis",
    classification: "CURRENT-CONFLICT",
    action: "Remove verifier/admin proof authority and consume KAIOS Alchemy records instead.",
  },
);

const counts = Object.fromEntries(
  ["CURRENT-CONFLICT", "HISTORICAL-ARCHIVE", "TEST-FIXTURE", "SAFE"].map((classification) => [
    classification,
    findings.filter((finding) => finding.classification === classification).length,
  ]),
);
const report = {
  taskId: "KAIOS-TOKEN-LINEAGE-INTEGRATION-20260809",
  auditedAt: "2026-08-09T00:00:00+08:00",
  scope: "repository working tree plus PR #127 conflict evidence",
  reconciledActiveFiles: [
    "docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md",
    "KGEN-KAIOS/KAIOS_WHITE_HOLE_ATOMIC_CONVERSION_AND_LIQUIDITY_RUNTIME_CURRENT.md",
    "KGEN-KAIOS/UNIVERSE_EXCHANGE_RUNTIME_CURRENT.md",
    "docs/constitution/01_KGEN_Universe_Constitution.md",
    "docs/constitution/02_KAIOS_Civilization_Constitution.md",
    "docs/constitution/03_Celestial_Bank_18888.md",
    "K線西遊記/data/kgen-5d-world-map.json"
  ],
  patterns,
  counts,
  findings,
};
fs.mkdirSync(path.dirname(outputJson), { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`);

const rows = findings.map((finding) =>
  `| ${finding.classification} | \`${finding.path}${finding.line ? `:${finding.line}` : ""}\` | \`${finding.pattern}\` | ${finding.action} |`,
);
fs.writeFileSync(
  outputMarkdown,
  [
    "# KAIOS Lineage Stale Reference Audit - 2026-08-09",
    "",
    "This is the pre-reconciliation evidence set. Historical references are retained; active conflicts require repair.",
    "",
    `- CURRENT-CONFLICT: ${counts["CURRENT-CONFLICT"]}`,
    `- HISTORICAL-ARCHIVE: ${counts["HISTORICAL-ARCHIVE"]}`,
    `- TEST-FIXTURE: ${counts["TEST-FIXTURE"]}`,
    `- SAFE: ${counts.SAFE}`,
    "",
    "| Classification | Location | Pattern | Action |",
    "|---|---|---|---|",
    ...rows,
    "",
  ].join("\n"),
);
console.log(JSON.stringify(counts));
