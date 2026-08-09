import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import solc from "solc";

const root = path.resolve(import.meta.dirname, "..");
const artifactPath = path.join(root, "artifacts", "KGEN_TempleHeart_Upgradeable.json");
const reportPath = path.join(root, "reports", "TEMPLEHEART_STORAGE_LAYOUT_VALIDATION.json");
const baselineRef = process.env.TEMPLEHEART_V332_BASE_REF ?? "7344d231837d40b504622c8c8b4376ed25110e20";
const baselinePath = "KGEN/contracts/KGEN_TempleHeart_Upgradeable.sol";

function findImports(importPath) {
  const candidate = path.join(root, "node_modules", importPath);
  return fs.existsSync(candidate)
    ? { contents: fs.readFileSync(candidate, "utf8") }
    : { error: `Import not found: ${importPath}` };
}

function compileBaselineLayout() {
  const source = execFileSync("git", ["show", `${baselineRef}:${baselinePath}`], {
    cwd: path.resolve(root, ".."),
    encoding: "utf8",
  });
  const input = {
    language: "Solidity",
    sources: { [baselinePath]: { content: source } },
    settings: { outputSelection: { "*": { "*": ["storageLayout"] } } },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
  const errors = (output.errors ?? []).filter((item) => item.severity === "error");
  if (errors.length) throw new Error(errors.map((item) => item.formattedMessage).join("\n"));
  return output.contracts[baselinePath].KGEN_TempleHeart_Upgradeable.storageLayout;
}

function normalize(layout) {
  return layout.storage.map((entry) => ({
    label: entry.label,
    slot: entry.slot,
    offset: entry.offset,
    encoding: layout.types[entry.type].encoding,
    bytes: layout.types[entry.type].numberOfBytes,
  }));
}

const baseline = {
  sourceRef: baselineRef,
  sourcePath: baselinePath,
  version: "3.3.2",
  entries: normalize(compileBaselineLayout()),
};
const currentArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const current = normalize(currentArtifact.storageLayout);
const allowedRename = new Map([["kaiosBurnProofGenesis", "deprecatedProofSource"]]);
const failures = [];

for (let index = 0; index < baseline.entries.length; index += 1) {
  const oldEntry = baseline.entries[index];
  const newEntry = current[index];
  if (!newEntry) {
    failures.push({ index, reason: "MISSING_SLOT", oldEntry });
    continue;
  }
  const expectedLabel = allowedRename.get(oldEntry.label) ?? oldEntry.label;
  for (const key of ["slot", "offset", "encoding", "bytes"]) {
    if (oldEntry[key] !== newEntry[key]) {
      failures.push({ index, reason: `CHANGED_${key.toUpperCase()}`, oldEntry, newEntry });
    }
  }
  if (newEntry.label !== expectedLabel) {
    failures.push({ index, reason: "UNAPPROVED_LABEL_CHANGE", oldEntry, newEntry });
  }
}

const appended = current.slice(baseline.entries.length);
const report = {
  status: failures.length === 0 ? "PASS" : "FAIL",
  baseline: {
    version: baseline.version,
    ref: baseline.sourceRef,
    path: baseline.sourcePath,
    slots: baseline.entries.length,
  },
  candidate: {
    path: "KGEN/contracts/KGEN_TempleHeart_Upgradeable.sol",
    slots: current.length,
    appendedSlots: appended.map((entry) => ({ label: entry.label, slot: entry.slot })),
  },
  approvedRenames: Object.fromEntries(allowedRename),
  failures,
};
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`TempleHeart storage layout: ${report.status} (${baseline.entries.length} preserved, ${appended.length} appended)`);
if (failures.length) process.exit(1);
