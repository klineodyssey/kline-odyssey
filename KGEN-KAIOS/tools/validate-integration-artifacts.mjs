import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { TextDecoder } from "node:util";

const repo = path.resolve(import.meta.dirname, "..", "..");
const reportPath = path.join(repo, "KGEN-KAIOS", "reports", "INTEGRATION_ARTIFACT_VALIDATION.json");

function gitLines(args) {
  const output = execFileSync("git", args, { cwd: repo, encoding: "utf8" });
  return output.split(/\r?\n/u).filter(Boolean);
}

const files = [...new Set([
  ...gitLines(["diff", "--name-only", process.env.INTEGRATION_BASE_RANGE ?? "origin/main...HEAD"]),
  ...gitLines(["diff", "--name-only"]),
  ...gitLines(["ls-files", "--others", "--exclude-standard"]),
])].filter((relativePath) => !relativePath.includes("node_modules/") && !relativePath.includes("artifacts/"));

const failures = [];
const checks = {
  files: files.length,
  json: 0,
  markdown: 0,
  utf8: 0,
  bom: 0,
  corruption: 0,
  secretHits: 0,
  brokenLinks: 0,
};
const decoder = new TextDecoder("utf-8", { fatal: true });
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
  /\b(?:sk|ghp)_[A-Za-z0-9]{24,}\b/u,
  /\bgithub_pat_[A-Za-z0-9_]{40,}\b/u,
  /\bPRIVATE_KEY\s*=\s*["']?0x[0-9a-fA-F]{64}\b/u,
];

for (const relativePath of files) {
  const absolutePath = path.join(repo, relativePath);
  if (!fs.existsSync(absolutePath) || fs.statSync(absolutePath).isDirectory()) continue;
  const bytes = fs.readFileSync(absolutePath);
  let text;
  try {
    text = decoder.decode(bytes);
    checks.utf8 += 1;
  } catch {
    failures.push({ path: relativePath, reason: "INVALID_UTF8" });
    continue;
  }
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) checks.bom += 1;
  if (text.includes("\uFFFD")) {
    checks.corruption += 1;
    failures.push({ path: relativePath, reason: "UNICODE_REPLACEMENT_CHARACTER" });
  }
  for (const pattern of secretPatterns) {
    if (pattern.test(text)) {
      checks.secretHits += 1;
      failures.push({ path: relativePath, reason: "SECRET_PATTERN" });
    }
  }

  if (relativePath.endsWith(".json")) {
    checks.json += 1;
    try {
      JSON.parse(text);
    } catch (error) {
      failures.push({ path: relativePath, reason: "INVALID_JSON", detail: error.message });
    }
  }

  if (relativePath.endsWith(".md")) {
    checks.markdown += 1;
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)) {
      let target = match[1].trim().replace(/^<|>$/gu, "");
      if (/^(?:https?:|mailto:|#)/u.test(target)) continue;
      target = decodeURIComponent(target.split("#", 1)[0]);
      if (!target) continue;
      const resolved = path.resolve(path.dirname(absolutePath), target);
      if (!fs.existsSync(resolved)) {
        checks.brokenLinks += 1;
        failures.push({ path: relativePath, reason: "BROKEN_MARKDOWN_LINK", target });
      }
    }
  }
}

const report = {
  status: failures.length === 0 ? "PASS" : "FAIL",
  checks,
  protectedChanges: {
    currentFiles: files.filter((file) => file.includes("CURRENT")),
    constitutionFiles: files.filter((file) => file.startsWith("docs/constitution/")),
    bootSequenceChanged: files.some((file) => file.includes("PRIMEFORGE_GENESIS_BOOT_SEQUENCE")),
    walletOrPrivateKeyFiles: files.filter((file) => /wallet|private.?key/iu.test(file)),
    deploymentFiles: files.filter((file) => /deploy(?:ment)?/iu.test(file)),
  },
  failures,
};
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Integration artifact validation: ${report.status} (${files.length} files)`);
if (failures.length) process.exit(1);
