import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { TextDecoder } from "node:util";
import { Contract, Interface, JsonRpcProvider, formatUnits, getAddress } from "ethers";

const repo = path.resolve(import.meta.dirname, "..", "..");
const reportPath = path.join(repo, "KGEN-KAIOS", "reports", "INTEGRATION_ARTIFACT_VALIDATION.json");

function cliArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function generateKaiosGenesisRecord() {
  const rpcUrl = process.env.BSC_MAINNET_RPC_URL;
  const txHash = cliArg("--tx");
  const expectedKaios = cliArg("--kaios");
  const expectedKgen = cliArg("--kgen");
  const expectedBank = cliArg("--bank");
  if (!rpcUrl || !txHash || !expectedKaios || !expectedKgen || !expectedBank) {
    throw new Error("Required: BSC_MAINNET_RPC_URL plus --tx, --kaios, --kgen and --bank. No amount argument is accepted.");
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  if (network.chainId !== 56n) throw new Error(`CHAIN_ID_MISMATCH:${network.chainId}`);

  const kaiosAddress = getAddress(expectedKaios);
  const kgenAddress = getAddress(expectedKgen);
  const bankAddress = getAddress(expectedBank);
  const receipt = await provider.getTransactionReceipt(txHash);
  const transaction = await provider.getTransaction(txHash);
  if (!receipt || receipt.status !== 1 || !transaction) throw new Error("SETTLEMENT_TRANSACTION_NOT_SUCCESSFUL");
  if (getAddress(transaction.to) !== kaiosAddress) throw new Error("SETTLEMENT_TARGET_NOT_KAIOS");

  const kaiosAbi = [
    "event WhiteHoleMassSettled(uint256 indexed settlementNumber,uint256 kgenSupplyObserved,uint256 cumulativeKgenBurned,uint256 newlySettledKgenBurned,uint256 kaiosMinted,address indexed treasury,address indexed caller)",
    "function KGEN() view returns (address)",
    "function LINGXIAO_TREASURY_18888() view returns (address)",
    "function KGEN_GENESIS_SUPPLY() view returns (uint256)",
    "function KAIOS_PER_KGEN() view returns (uint256)",
    "function KAIOS_DEPLOY_POINT_ID() view returns (uint256)",
    "function WHITE_HOLE_POINT_ID() view returns (uint256)",
    "function LINGXIAO_TREASURY_POINT_ID() view returns (uint256)",
    "function settledKgenBurned() view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function settleWhiteHoleMass() returns (uint256,uint256)",
  ];
  const kgenAbi = ["function totalSupply() view returns (uint256)"];
  const iface = new Interface(kaiosAbi);
  if (!transaction.data.startsWith(iface.getFunction("settleWhiteHoleMass").selector)) {
    throw new Error("TRANSACTION_IS_NOT_SETTLE_WHITE_HOLE_MASS");
  }
  const settlementEvents = receipt.logs.flatMap((log) => {
    if (getAddress(log.address) !== kaiosAddress) return [];
    try {
      const parsed = iface.parseLog(log);
      return parsed?.name === "WhiteHoleMassSettled" ? [parsed] : [];
    } catch {
      return [];
    }
  });
  if (settlementEvents.length !== 1) throw new Error("EXPECTED_ONE_WHITE_HOLE_SETTLEMENT_EVENT");
  const event = settlementEvents[0].args;
  if (event.settlementNumber !== 1n) throw new Error("NOT_GENESIS_SETTLEMENT");

  const kaios = new Contract(kaiosAddress, kaiosAbi, provider);
  const kgen = new Contract(kgenAddress, kgenAbi, provider);
  const blockTag = receipt.blockNumber;
  const previousBlockTag = blockTag - 1;
  const [
    reportedKgen,
    reportedBank,
    genesisKgenSupply,
    kaiosPerKgen,
    deployPoint,
    whiteHolePoint,
    bankPoint,
    settledKgenBurned,
    kgenSupply,
    kaiosSupply,
    bankBalance,
    bankBalanceBefore,
    block,
  ] = await Promise.all([
    kaios.KGEN({ blockTag }),
    kaios.LINGXIAO_TREASURY_18888({ blockTag }),
    kaios.KGEN_GENESIS_SUPPLY({ blockTag }),
    kaios.KAIOS_PER_KGEN({ blockTag }),
    kaios.KAIOS_DEPLOY_POINT_ID({ blockTag }),
    kaios.WHITE_HOLE_POINT_ID({ blockTag }),
    kaios.LINGXIAO_TREASURY_POINT_ID({ blockTag }),
    kaios.settledKgenBurned({ blockTag }),
    kgen.totalSupply({ blockTag }),
    kaios.totalSupply({ blockTag }),
    kaios.balanceOf(bankAddress, { blockTag }),
    kaios.balanceOf(bankAddress, { blockTag: previousBlockTag }),
    provider.getBlock(blockTag),
  ]);
  if (getAddress(reportedKgen) !== kgenAddress) throw new Error("KGEN_LINEAGE_MISMATCH");
  if (getAddress(reportedBank) !== bankAddress || getAddress(event.treasury) !== bankAddress) {
    throw new Error("BANK_LINEAGE_MISMATCH");
  }
  if (deployPoint !== 33_333n || whiteHolePoint !== 36_000n || bankPoint !== 18_888n) {
    throw new Error("POINT_ID_MISMATCH");
  }
  if (kaiosPerKgen !== 1_000n || genesisKgenSupply !== 72_000_000n * 10n ** 18n) {
    throw new Error("MONETARY_SCALE_MISMATCH");
  }
  const historicalBurn = genesisKgenSupply - kgenSupply;
  const bankBalanceDelta = bankBalance - bankBalanceBefore;
  if (
    historicalBurn !== settledKgenBurned
    || event.kgenSupplyObserved !== kgenSupply
    || event.cumulativeKgenBurned !== historicalBurn
    || event.newlySettledKgenBurned !== historicalBurn
    || event.kaiosMinted !== historicalBurn * 1_000n
    || kaiosSupply !== event.kaiosMinted
    || bankBalanceDelta !== event.kaiosMinted
  ) throw new Error("GENESIS_MASS_OR_BALANCE_INVARIANT_FAILED");

  const units = (value) => ({ raw: value.toString(), decimal18: formatUnits(value, 18) });
  const record = {
    status: "REAL_BSC_MAINNET_GENESIS_SETTLEMENT_VERIFIED",
    chainId: "56",
    pointIds: { kaiosGoldAndSilverIsland: "33333", whiteHole: "36000", lingxiaoCelestialBank: "18888" },
    addresses: { kaiosToken: kaiosAddress, kgenToken: kgenAddress, lingxiaoBankProxy: bankAddress },
    settlement: {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      timestamp: block.timestamp,
      timestampIso: new Date(Number(block.timestamp) * 1000).toISOString(),
      caller: getAddress(event.caller),
      kgenGenesisSupply: units(genesisKgenSupply),
      kgenSupplyAtSettlementBlock: units(kgenSupply),
      historicalKgenBurn: units(historicalBurn),
      actualGenesisKaiosMinted: units(event.kaiosMinted),
      kaiosTotalSupply: units(kaiosSupply),
      bankBalanceBefore: units(bankBalanceBefore),
      bankBalanceAfter: units(bankBalance),
      bankBalanceDelta: units(bankBalanceDelta),
    },
    inscription: [
      "NO KGEN BURN, NO KAIOS MINT.",
      "ONE BURNED KGEN CREATES ONE THOUSAND KAIOS.",
      "NO DISCRETIONARY MINTING.",
      "CIVILIZATION MASS SHALL BE CONSERVED.",
    ],
    generation: "AUTOMATIC_FROM_CHAIN_STATE_USING_BIGINT_NO_HUMAN_AMOUNT_INPUT",
  };
  const jsonPath = path.join(repo, "KGEN-KAIOS", "KAIOS_GENESIS_MAINNET_RECORD.json");
  const markdownPath = path.join(repo, "KGEN-KAIOS", "KAIOS_GENESIS_MAINNET_INSCRIPTION.md");
  fs.writeFileSync(jsonPath, `${JSON.stringify(record, null, 2)}\n`);
  fs.writeFileSync(markdownPath, [
    "# KAIOS Mainnet Genesis Inscription",
    "",
    ...record.inscription.map((line) => `> ${line}`),
    "",
    `- Chain ID: ${record.chainId}`,
    `- 33333 Point ID: KAIOS Gold & Silver Island Token Point`,
    `- KAIOS Token: \`${kaiosAddress}\``,
    `- 36000 Point ID: White Hole`,
    `- 18888 Bank Proxy: \`${bankAddress}\``,
    `- KGEN Genesis Supply: ${record.settlement.kgenGenesisSupply.decimal18} KGEN`,
    `- KGEN Supply at settlement block: ${record.settlement.kgenSupplyAtSettlementBlock.decimal18} KGEN`,
    `- Historical KGEN Burn: ${record.settlement.historicalKgenBurn.decimal18} KGEN`,
    `- Actual Genesis KAIOS Minted: ${record.settlement.actualGenesisKaiosMinted.decimal18} KAIOS`,
    `- KAIOS totalSupply: ${record.settlement.kaiosTotalSupply.decimal18} KAIOS`,
    `- 18888 balance delta: ${record.settlement.bankBalanceDelta.decimal18} KAIOS`,
    `- Transaction: \`${receipt.hash}\``,
    `- Block: ${receipt.blockNumber}`,
    `- Timestamp: ${record.settlement.timestampIso}`,
    "",
    "Generated automatically from verified chain state. No formal amount was copied from chat or entered manually.",
    "",
  ].join("\n"));
  console.log(`KAIOS Genesis record generated for block ${receipt.blockNumber}`);
}

if (process.argv.includes("--generate-kaios-genesis-record")) {
  await generateKaiosGenesisRecord();
  process.exit(0);
}

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
