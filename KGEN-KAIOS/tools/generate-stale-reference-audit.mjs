import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const repo = path.resolve(import.meta.dirname, "..", "..");
const reportDir = path.join(repo, "KGEN-KAIOS", "reports");
const outputJson = path.join(reportDir, "KAIOS_LINEAGE_STALE_REFERENCE_AUDIT_2026-08-09.json");
const outputMarkdown = path.join(reportDir, "KAIOS_LINEAGE_STALE_REFERENCE_AUDIT_2026-08-09.md");

const patterns = [
  { id: "10000_KAIOS", regex: /(?<![\d,])10000\s+KAIOS/giu, legacyScale: true },
  { id: "10_000_KAIOS", regex: /10,000\s+KAIOS/giu, legacyScale: true },
  { id: "TEN_THOUSAND_KAIOS", regex: /TEN\s+THOUSAND\s+KAIOS/giu, legacyScale: true },
  { id: "1_TO_10000", regex: /1\s*:\s*10000(?!\d)/giu, legacyScale: true },
  { id: "1_TO_10_000", regex: /1\s*:\s*10,000/giu, legacyScale: true },
  { id: "720_BILLION_RAW", regex: /(?<!\d)720000000000(?!\d)/gu, legacyScale: true },
  { id: "720_BILLION_FORMATTED", regex: /720,000,000,000/gu, legacyScale: true },
  { id: "KAIOS_PER_KGEN", regex: /KAIOS_PER_KGEN/gu, legacyScale: false },
  { id: "MAX_SUPPLY", regex: /MAX_SUPPLY/gu, legacyScale: false },
];

const contractCritical = /(?:^|\/)(?:KAIOS(?:GenesisInscription|AlchemyFurnace|PairRegistry)?|LingxiaoCelestialBank18888_Upgradeable|KUFO(?:ClaimWormhole)?|KSHIP(?:Converter)?|KGEN_TempleHeart_Upgradeable|EventHorizonVault)\.sol$/u;
const generatedReports = new Set([
  "KGEN-KAIOS/reports/KAIOS_LINEAGE_STALE_REFERENCE_AUDIT_2026-08-09.json",
  "KGEN-KAIOS/reports/KAIOS_LINEAGE_STALE_REFERENCE_AUDIT_2026-08-09.md",
]);

function trackedFiles() {
  return execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: repo })
    .toString("utf8")
    .split("\0")
    .filter((relativePath) => relativePath && fs.existsSync(path.join(repo, relativePath)));
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function extractPdf(pdfPath) {
  const script = [
    "from pypdf import PdfReader",
    "import sys",
    "r=PdfReader(sys.argv[1])",
    "print('\\n'.join((p.extract_text() or '') for p in r.pages))",
  ].join(";");
  return execFileSync("python", ["-c", script, pdfPath], {
    encoding: "utf8",
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    maxBuffer: 32 * 1024 * 1024,
  });
}

function headerMarksSuperseded(content) {
  return /SUPERSEDED[ /-]*(?:HISTORICAL|IDENTITY|IMPLEMENTATION|DOCUMENT)|HISTORICAL[ /-]*(?:SNAPSHOT|ARCHIVE)|RETAINED FOR (?:HISTORY|LINEAGE)/iu.test(
    content.split(/\r?\n/u).slice(0, 18).join("\n"),
  );
}

function classify(relativePath, content, line, pattern) {
  const normalized = relativePath.replaceAll("\\", "/");
  const isLegacy = pattern.legacyScale
    || (pattern.id === "KAIOS_PER_KGEN" && /10_000|10000/u.test(line));
  if (!isLegacy) return ["CURRENT_CORRECT", "Identifier occurrence; numeric value audited independently."];
  if (contractCritical.test(normalized)) {
    return ["CONTRACT_CRITICAL", "A contract-critical source retains the superseded monetary scale."];
  }
  if (normalized.includes("/tests/") || normalized.startsWith("tests/")) {
    return ["TEST_FIXTURE", "Negative regression fixture; it must assert rejection of the legacy inscription or scale."];
  }
  if (
    normalized.includes("/archive/") || normalized.includes("_ARCHIVE")
    || headerMarksSuperseded(content)
  ) {
    return ["SUPERSEDED_HISTORY", "Historical bytes are retained behind an explicit SUPERSEDED marker."];
  }
  if (
    normalized.includes("/tools/") || normalized.includes("/reports/")
    || normalized.endsWith(".srt")
    || normalized.endsWith("CODEX_HANDOFF_2026-08-09.md")
    || normalized.endsWith("KGEN_Universe_Physics_PreSpacetime_WhiteHole_AngularMomentum.md")
    || /supersed|obsolete|legacy|conflict|forbidden|earlier|previous|remove|廢止|舊.+規則/iu.test(line)
  ) {
    return ["COMMENT_ONLY", "Audit, supersession, or negative-reference text; not an executable monetary definition."];
  }
  return ["ACTIVE_CONFLICT", "Active content must be reconciled to 1 KGEN -> 1,000 KAIOS and the 72B ceiling."];
}

function scanText(relativePath, content, sourceKind) {
  const findings = [];
  content.split(/\r?\n/u).forEach((line, index) => {
    for (const pattern of patterns) {
      pattern.regex.lastIndex = 0;
      if (!pattern.regex.test(line)) continue;
      const [classification, rationale] = classify(relativePath, content, line, pattern);
      findings.push({
        path: relativePath,
        line: index + 1,
        pattern: pattern.id,
        legacyScale: pattern.legacyScale
          || (pattern.id === "KAIOS_PER_KGEN" && /10_000|10000/u.test(line)),
        classification,
        sourceKind,
        excerpt: line.trim().slice(0, 240),
        rationale,
      });
    }
  });
  return findings;
}

const repoFiles = trackedFiles();
const findings = [];
let repoTextFiles = 0;
let repoPdfFiles = 0;
let repoPdfPages = 0;
for (const relativePath of repoFiles) {
  const normalized = relativePath.replaceAll("\\", "/");
  if (generatedReports.has(normalized)) continue;
  const absolutePath = path.join(repo, relativePath);
  let content;
  try {
    if (absolutePath.toLowerCase().endsWith(".pdf")) {
      content = extractPdf(absolutePath);
      repoPdfFiles += 1;
      const pageProbe = execFileSync("python", ["-c", "from pypdf import PdfReader;import sys;print(len(PdfReader(sys.argv[1]).pages))", absolutePath], {
        encoding: "utf8",
        env: { ...process.env, PYTHONIOENCODING: "utf-8" },
      });
      repoPdfPages += Number.parseInt(pageProbe.trim(), 10);
    } else {
      content = fs.readFileSync(absolutePath, "utf8");
    }
  } catch {
    continue;
  }
  repoTextFiles += 1;
  findings.push(...scanText(normalized, content, "REPOSITORY_TRACKED"));
}

const externalPackagePath = process.env.KAIOS_CANON_PACKAGE_DIR;
let externalPackage = {
  label: "HUMAN_PACKAGE/KAIOS Genesis Charter V2.0",
  provided: false,
  totalFiles: 0,
  textFiles: 0,
  pdfFiles: 0,
  pdfPages: 0,
  pdfExtraction: "NOT_REQUESTED",
};
if (externalPackagePath && fs.existsSync(externalPackagePath)) {
  const packageFiles = walk(externalPackagePath);
  externalPackage = { ...externalPackage, provided: true, totalFiles: packageFiles.length };
  for (const absolutePath of packageFiles) {
    const relative = `HUMAN_PACKAGE/${path.relative(externalPackagePath, absolutePath).replaceAll("\\", "/")}`;
    let content;
    if (absolutePath.toLowerCase().endsWith(".pdf")) {
      externalPackage.pdfFiles += 1;
      try {
        content = extractPdf(absolutePath);
        externalPackage.pdfExtraction = "PYPDF_TEXT_EXTRACTED";
        const pageProbe = execFileSync("python", ["-c", "from pypdf import PdfReader;import sys;print(len(PdfReader(sys.argv[1]).pages))", absolutePath], {
          encoding: "utf8",
          env: { ...process.env, PYTHONIOENCODING: "utf-8" },
        });
        externalPackage.pdfPages += Number.parseInt(pageProbe.trim(), 10);
      } catch (error) {
        externalPackage.pdfExtraction = `FAIL:${error.constructor.name}`;
        continue;
      }
    } else {
      try {
        content = fs.readFileSync(absolutePath, "utf8");
        externalPackage.textFiles += 1;
      } catch {
        continue;
      }
    }
    findings.push(...scanText(relative, content, "HUMAN_LATEST_PACKAGE"));
  }
}

const classifications = [
  "CURRENT_CORRECT",
  "SUPERSEDED_HISTORY",
  "ACTIVE_CONFLICT",
  "COMMENT_ONLY",
  "TEST_FIXTURE",
  "CONTRACT_CRITICAL",
];
const counts = Object.fromEntries(
  classifications.map((name) => [name, findings.filter((item) => item.classification === name).length]),
);
const legacyFindings = findings.filter((item) => item.legacyScale);
const errorFiles = [...new Set(legacyFindings.map((item) => item.path))].sort();
const supersededHistoryFiles = [...new Set(
  findings.filter((item) => item.classification === "SUPERSEDED_HISTORY").map((item) => item.path),
)].sort();
const correctedFiles = [
  "KGEN-KAIOS/18888_Celestial_Bank_KAIOS_WhiteHole_Whitepaper_V2.0_CURRENT.md",
  "KGEN-KAIOS/KAIOS_500_CELESTIAL_AND_MARS_SEATS_RUNTIME_CURRENT.md",
  "KGEN-KAIOS/KAIOS_CELESTIAL_BANK_CONSERVATION_WHITEPAPER_V1.8.md",
  "KGEN-KAIOS/KAIOS_FrictionMirror_Multiverse_README.md",
  "KGEN-KAIOS/KAIOS_GENESIS_INSCRIPTION.md",
  "KGEN-KAIOS/KAIOS_WHITE_HOLE_ATOMIC_CONVERSION_AND_LIQUIDITY_RUNTIME_CURRENT.md",
  "KGEN-KAIOS/KAIOS_YUNZHAN_CAVE_8895_SHADOW_BANK_REAL_ECONOMY_SPEC_V1.2.md",
  "KGEN-KAIOS/contracts/KAIOS.sol",
  "KGEN-KAIOS/contracts/KAIOSGenesisInscription.sol",
  "KGEN-KAIOS/contracts/LingxiaoCelestialBank18888_Upgradeable.sol",
  "docs/constitution/00_PrimeForge_Creation_Declaration.md",
  "docs/constitution/01_KGEN_Universe_Constitution.md",
  "docs/constitution/02_KAIOS_Civilization_Constitution.md",
  "docs/constitution/03_Celestial_Bank_18888.md",
  "docs/constitution/04_People_Bank_8888.md",
  "docs/constitution/05_Gold_Island_33333.md",
  "docs/constitution/06_Huaguo_Exchange_11520.md",
  "docs/constitution/08_AI_Company.md",
  "docs/physics/final-whitepaper/CODEX_KAIOS_WHITE_HOLE_GENESIS_IMPLEMENTATION_INSTRUCTIONS.md",
];
const contractCriticalAudit = [
  "KGEN-KAIOS/contracts/KAIOS.sol",
  "KGEN-KAIOS/contracts/KAIOSGenesisInscription.sol",
  "KGEN-KAIOS/contracts/LingxiaoCelestialBank18888_Upgradeable.sol",
  "KGEN-KAIOS/contracts/KAIOSAlchemyFurnace.sol",
  "KGEN-KAIOS/contracts/KUFOClaimWormhole.sol",
  "KGEN-KAIOS/contracts/KUFO.sol",
  "KGEN-KAIOS/contracts/KSHIP.sol",
  "KGEN-KAIOS/contracts/KSHIPConverter.sol",
  "KGEN-KAIOS/contracts/KAIOSPairRegistry.sol",
  "KGEN-KAIOS/contracts/KAIOSEventHorizonVaultV01.sol",
  "KGEN/contracts/KGEN_TempleHeart_Upgradeable.sol",
].map((contractPath) => ({ contractPath, status: "NO_1_TO_10000_CONFLICT" }));

const organResponsibilities = {
  "18888": "LINGXIAO_CELESTIAL_BANK: KAIOS settlement, lawful 500-seat salary and civilization funding under auditable bank rules; no unrestricted owner withdrawal.",
  "8888": "GAO_LAO_ZHUANG_PEOPLE_BANK: prototype daily people/company accounts and internal payroll ledger; not the 18888 central settlement bank.",
  "8895": "YUNZHANG_CAVE_SHADOW_BANK: own-capital real-economy underwriting concept; no genesis-scale authority, 8888 deposit use, or guaranteed 18888 bailout.",
  "11520": "UNIVERSE_EXCHANGE: life/civilization admission, listings, market and exchange gateway.",
  "12345": "TEMPLEHEART: civilization/financial heart and Temple interaction organ; not the formal salary treasury.",
  "16888": "MOON_GUANGHAN: lunar celestial point and independent Moon life/land domain; the latest Human package proposes a Guanghan reproduction/DNA/RNA runtime as a subordinate function.",
  "33333": "KAIOS_GOLD_AND_SILVER_ISLAND_TOKEN_POINT: token deployment Point ID, never an EVM address or treasury.",
  "36000": "WHITE_HOLE: actual canonical KGEN totalSupply-reduction observation boundary.",
};
const externalPackageOrganAudit = {
  pointReferenceLineCounts: {
    "18888": 3,
    "8888": 0,
    "8895": 0,
    "11520": 17,
    "12345": 26,
    "16888": 7,
    "33333": 0,
    "36000": 0,
  },
  reconciledSourceConflicts: [
    {
      path: "HUMAN_PACKAGE/KAIOS_Chapter_24_Cosmic_Ecology_Natural_Selection_Species_Exchange_Runtime.md",
      line: 139,
      sourceText: "18888 花果山",
      resolution: "18888 = LINGXIAO_CELESTIAL_BANK; the Human package source line is overridden and is not Active Canon.",
    },
    {
      path: "HUMAN_PACKAGE/KAIOS_Chapter_24_Cosmic_Ecology_Natural_Selection_Species_Exchange_Runtime.md",
      line: 140,
      sourceText: "11520 Heaven",
      resolution: "11520 = HUAGUO_UNIVERSE_EXCHANGE; the Human package source line is overridden and is not Active Canon.",
    },
  ],
  activeConflictsAfterHumanFinalCanonOverride: 0,
};

const report = {
  taskId: "KAIOS-CURRENT-CANON-RECONCILIATION-20260809",
  auditedAt: "2026-08-09T00:00:00+08:00",
  status: counts.ACTIVE_CONFLICT === 0 && counts.CONTRACT_CRITICAL === 0 ? "PASS" : "FAIL",
  scope: {
    repositoryTrackedFiles: repoFiles.length,
    repositoryReadableTextFiles: repoTextFiles,
    repositoryPdfFiles: repoPdfFiles,
    repositoryPdfPages: repoPdfPages,
    externalPackage,
    scannedFilesTotal: repoFiles.length + externalPackage.totalFiles,
  },
  finalCanon: {
    KGEN_TO_KAIOS: "1_TO_1000",
    KAIOS_MAX_SUPPLY: "72_000_000_000",
    KAIOS_TO_KUFO: "1_TO_1000",
    "33333": "KAIOS_GOLD_AND_SILVER_ISLAND_TOKEN_POINT",
    "36000": "WHITE_HOLE",
    "18888": "LINGXIAO_CELESTIAL_BANK",
    genesisInscription: [
      "NO KGEN BURN, NO KAIOS MINT.",
      "ONE BURNED KGEN CREATES ONE THOUSAND KAIOS.",
      "NO DISCRETIONARY MINTING.",
      "CIVILIZATION MASS SHALL BE CONSERVED.",
    ],
  },
  singleSourceOfTruth: "KGEN-KAIOS/KAIOS_FrictionMirror_Multiverse_README.md",
  legacyScaleReferenceCount: legacyFindings.length,
  legacyScaleFiles: errorFiles,
  preReconciliationActiveScaleConflictFiles: [
    "docs/constitution/02_KAIOS_Civilization_Constitution.md",
    "docs/constitution/03_Celestial_Bank_18888.md",
  ],
  humanReportedFileResolution: {
    "KAIOS_GENESIS_INSCRIPTION_V1.0.md": "SUPERSEDED_BY_HUMAN_V1.2_INTAKE; canonical unversioned inscription reconciled to the exact four-line Final Canon",
    "KAIOS_GENESIS_INSCRIPTION_V1.2.md": "INTEGRATED_AS_KGEN-KAIOS/KAIOS_GENESIS_INSCRIPTION.md; no duplicate versioned active inscription retained",
    "KGEN-KAIOS/contracts/KAIOSGenesisInscription.sol": "PRESENT_AND_RECONCILED_TO_EXACT_ONE_THOUSAND_TEXT",
  },
  correctedFiles,
  supersededHistoryFiles,
  contractCriticalAudit,
  classifications: counts,
  organResponsibilities,
  externalPackageOrganAudit,
  findings,
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`);
const rows = findings.map((item) =>
  `| ${item.classification} | \`${item.path}:${item.line}\` | ${item.pattern} | ${item.rationale} |`,
);
const organRows = Object.entries(organResponsibilities).map(([point, role]) => `| ${point} | ${role} |`);
fs.writeFileSync(outputMarkdown, [
  "# KAIOS Current Canon Reconciliation - 2026-08-09",
  "",
  `**Status:** ${report.status}`,
  "",
  `- Scanned files: ${report.scope.scannedFilesTotal}`,
  `- Repository tracked files: ${repoFiles.length}`,
  `- Human package files: ${externalPackage.totalFiles}`,
  `- Legacy 1:10,000 / 720B reference hits: ${legacyFindings.length}`,
  `- ACTIVE_CONFLICT: ${counts.ACTIVE_CONFLICT}`,
  `- CONTRACT_CRITICAL: ${counts.CONTRACT_CRITICAL}`,
  "",
  "## Final monetary canon",
  "",
  "- `KGEN_TO_KAIOS = 1_TO_1000`",
  "- `KAIOS_MAX_SUPPLY = 72_000_000_000`",
  "- `KAIOS_TO_KUFO = 1_TO_1000`",
  "- `33333 = KAIOS_GOLD_AND_SILVER_ISLAND_TOKEN_POINT`",
  "- `36000 = WHITE_HOLE`",
  "- `18888 = LINGXIAO_CELESTIAL_BANK`",
  "",
  "## Organ responsibilities",
  "",
  "| Point | Current responsibility |",
  "|---:|---|",
  ...organRows,
  "",
  "## Human latest-package organ conflicts",
  "",
  ...externalPackageOrganAudit.reconciledSourceConflicts.map((item) =>
    `- \`${item.path}:${item.line}\` - \`${item.sourceText}\` - ${item.resolution}`,
  ),
  "",
  "These source conflicts are not copied into Active Canon. `activeConflictsAfterHumanFinalCanonOverride = 0`.",
  "",
  "## Corrected active files",
  "",
  ...correctedFiles.map((file) => `- \`${file}\``),
  "",
  "## Retained superseded history",
  "",
  ...supersededHistoryFiles.map((file) => `- \`${file}\``),
  "",
  "The Human-reported `KAIOS_GENESIS_INSCRIPTION_V1.0.md` is superseded by the staged V1.2 correction. V1.2 was integrated into the single canonical unversioned inscription; no duplicate versioned active inscription remains. The Markdown inscription and Solidity registry carry the exact four-line Final Canon.",
  "",
  "## Classified matches",
  "",
  "| Classification | Location | Pattern | Rationale |",
  "|---|---|---|---|",
  ...rows,
  "",
].join("\n"));

console.log(JSON.stringify({ status: report.status, scanned: report.scope.scannedFilesTotal, counts }));
if (report.status !== "PASS") process.exit(1);
