import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import solc from "solc";

const root = path.resolve(import.meta.dirname, "..");
const fixturePath = path.join(root, "tests", "fixtures", "templeheart-v3.3.1-storage-layout.json");
const artifactPath = path.join(root, "artifacts", "KGEN_TempleHeart_Upgradeable.json");
const reportPath = path.join(root, "reports", "TEMPLEHEART_STORAGE_LAYOUT_VALIDATION.json");
const oldRef = "origin/codex/templeheart-v3.3.0-uups";
const oldPath = "KGEN/contracts/KGEN_TempleHeart_V3_3_1_Upgradeable.sol";

function findImports(importPath) {
  const candidate = path.join(root, "node_modules", importPath);
  return fs.existsSync(candidate)
    ? { contents: fs.readFileSync(candidate, "utf8") }
    : { error: `Import not found: ${importPath}` };
}

function compileOldLayout() {
  const source = execFileSync("git", ["show", `${oldRef}:${oldPath}`], {
    cwd: path.resolve(root, ".."),
    encoding: "utf8",
  });
  const input = {
    language: "Solidity",
    sources: { [oldPath]: { content: source } },
    settings: { outputSelection: { "*": { "*": ["storageLayout"] } } },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
  const errors = (output.errors ?? []).filter((item) => item.severity === "error");
  if (errors.length) throw new Error(errors.map((item) => item.formattedMessage).join("\n"));
  return output.contracts[oldPath].KGEN_TempleHeart_V3_3_1_Upgradeable.storageLayout;
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

if (process.env.REFRESH_PR127_BASELINE === "1") {
  fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
  fs.writeFileSync(
    fixturePath,
    `${JSON.stringify({ sourceRef: oldRef, sourcePath: oldPath, entries: normalize(compileOldLayout()) }, null, 2)}\n`,
  );
}

if (!fs.existsSync(fixturePath)) {
  throw new Error("Missing PR #127 storage fixture. Run with REFRESH_PR127_BASELINE=1 after fetching the audited ref.");
}
const baseline = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
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
  baseline: { ref: baseline.sourceRef, path: baseline.sourcePath, slots: baseline.entries.length },
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
