import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import solc from "solc";

const root = path.resolve(import.meta.dirname, "..");
const repo = path.resolve(root, "..");
const contractPath = "KGEN/contracts/KGEN_TempleHeart_Upgradeable.sol";
const baseRef = process.env.TEMPLEHEART_ABI_BASE_REF ?? "f507724d1876c28e3d24a7316c440ea9304a5228";
const reportPath = path.join(root, "reports", "TEMPLEHEART_ABI_DIFF.json");

function findImports(importPath) {
  const candidates = [path.join(root, importPath), path.join(root, "node_modules", importPath)];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return { contents: fs.readFileSync(candidate, "utf8") };
  }
  return { error: `Import not found: ${importPath}` };
}

function compile(source) {
  const input = {
    language: "Solidity",
    sources: { [contractPath]: { content: source } },
    settings: { outputSelection: { "*": { "*": ["abi"] } } },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
  const errors = (output.errors ?? []).filter(({ severity }) => severity === "error");
  if (errors.length) throw new Error(errors.map(({ formattedMessage }) => formattedMessage).join("\n"));
  return output.contracts[contractPath].KGEN_TempleHeart_Upgradeable.abi;
}

function typeList(items = []) {
  return items.map(({ type }) => type).join(",");
}

function key(entry) {
  if (entry.type === "constructor" || entry.type === "fallback" || entry.type === "receive") return entry.type;
  return `${entry.type}:${entry.name}(${typeList(entry.inputs)})`;
}

function normalized(entry) {
  return JSON.stringify({
    type: entry.type,
    name: entry.name ?? null,
    inputs: entry.inputs ?? [],
    outputs: entry.outputs ?? [],
    stateMutability: entry.stateMutability ?? null,
    anonymous: entry.anonymous ?? null,
  });
}

const baseSource = execFileSync("git", ["show", `${baseRef}:${contractPath}`], { cwd: repo, encoding: "utf8" });
const candidateSource = fs.readFileSync(path.join(repo, contractPath), "utf8");
const baseline = new Map(compile(baseSource).map((entry) => [key(entry), normalized(entry)]));
const candidate = new Map(compile(candidateSource).map((entry) => [key(entry), normalized(entry)]));
const allowedAdditions = new Set([
  "error:FortuneKgenPassRequired(uint256,uint256)",
  "function:MIN_FORTUNE_KGEN_PASS_RAW()",
]);
const removals = [...baseline.keys()].filter((entryKey) => !candidate.has(entryKey));
const changed = [...baseline.keys()].filter(
  (entryKey) => candidate.has(entryKey) && baseline.get(entryKey) !== candidate.get(entryKey),
);
const additions = [...candidate.keys()].filter((entryKey) => !baseline.has(entryKey));
const unexpectedAdditions = additions.filter((entryKey) => !allowedAdditions.has(entryKey));
const missingExpectedAdditions = [...allowedAdditions].filter((entryKey) => !additions.includes(entryKey));
const failures = { removals, changed, unexpectedAdditions, missingExpectedAdditions };
const status = Object.values(failures).every((items) => items.length === 0) ? "PASS" : "FAIL";
const report = {
  status,
  compiler: solc.version(),
  baseline: { ref: baseRef, path: contractPath, entries: baseline.size },
  candidate: { path: contractPath, entries: candidate.size },
  allowedAdditions: [...allowedAdditions].sort(),
  observedAdditions: additions.sort(),
  failures,
};
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`TempleHeart ABI diff: ${status} (${baseline.size} baseline, ${candidate.size} candidate entries)`);
if (status !== "PASS") process.exit(1);
