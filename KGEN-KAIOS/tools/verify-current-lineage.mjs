import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repo = path.resolve(import.meta.dirname, "..", "..");
const reports = path.join(repo, "KGEN-KAIOS", "reports");
const reportPath = path.join(reports, "CURRENT_LINEAGE_RECONCILIATION.json");
const auditPath = path.join(reports, "KAIOS_LINEAGE_STALE_REFERENCE_AUDIT_2026-08-09.json");

function read(relativePath) {
  return fs.readFileSync(path.join(repo, relativePath), "utf8");
}

const failures = [];
const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
for (const classification of ["ACTIVE_CONFLICT", "CONTRACT_CRITICAL"]) {
  const count = audit.classifications[classification] ?? 0;
  if (count !== 0) failures.push({ classification, count });
}

const kaios = read("KGEN-KAIOS/contracts/KAIOS.sol");
const inscription = read("KGEN-KAIOS/contracts/KAIOSGenesisInscription.sol");
const bank = read("KGEN-KAIOS/contracts/LingxiaoCelestialBank18888_Upgradeable.sol");
const sst = read("KGEN-KAIOS/KAIOS_FrictionMirror_Multiverse_README.md");
const currentBankWhitepaper = read("KGEN-KAIOS/18888_Celestial_Bank_KAIOS_WhiteHole_Whitepaper_V2.0_CURRENT.md");
const currentConservation = read("KGEN-KAIOS/KAIOS_CELESTIAL_BANK_CONSERVATION_WHITEPAPER_V1.8.md");
const currentSeats = read("KGEN-KAIOS/KAIOS_500_CELESTIAL_AND_MARS_SEATS_RUNTIME_CURRENT.md");
const currentYunzhang = read("KGEN-KAIOS/KAIOS_YUNZHAN_CAVE_8895_SHADOW_BANK_REAL_ECONOMY_SPEC_V1.2.md");
const markdownInscription = read("KGEN-KAIOS/KAIOS_GENESIS_INSCRIPTION.md");
const goldIslandLegacy = read("docs/constitution/05_Gold_Island_33333.md")
  .split(/\r?\n/u).slice(0, 18).join("\n");

const exactInscription =
  "NO KGEN BURN, NO KAIOS MINT. ONE BURNED KGEN CREATES ONE THOUSAND KAIOS. NO DISCRETIONARY MINTING. CIVILIZATION MASS SHALL BE CONSERVED.";
const assertions = {
  auditPass: audit.status === "PASS",
  humanPackageScanned: audit.scope.externalPackage.provided === true
    && audit.scope.externalPackage.totalFiles === 144
    && audit.scope.externalPackage.pdfExtraction === "PYPDF_TEXT_EXTRACTED",
  kgenMassScale: sst.includes("1 KGEN  = 1 metric ton = 1,000 kg"),
  kaiosRatio: kaios.includes("KAIOS_PER_KGEN = 1_000"),
  kaiosCap: kaios.includes("MAX_SUPPLY = 72_000_000_000 ether"),
  kufoRatioPreserved: kaios.includes("KUFO_PER_KAIOS = 1_000"),
  frictionMirror: kaios.includes("IKGENSupply(KGEN).totalSupply()"),
  settlementTo18888: kaios.includes("_mint(LINGXIAO_TREASURY_18888, kaiosMinted)"),
  exactInscriptionInKaios: kaios.includes(exactInscription),
  exactInscriptionInRegistry: inscription.includes(exactInscription),
  exactFourLineMarkdownInscription: [
    "> NO KGEN BURN, NO KAIOS MINT.",
    "> ONE BURNED KGEN CREATES ONE THOUSAND KAIOS.",
    "> NO DISCRETIONARY MINTING.",
    "> CIVILIZATION MASS SHALL BE CONSERVED.",
  ].every((line) => markdownInscription.includes(line))
    && !markdownInscription.includes("TEN THOUSAND KAIOS"),
  noTenThousandInscription: !inscription.includes("TEN THOUSAND KAIOS"),
  goldIslandPointSeparated: sst.includes("Point IDs are not wallets, EOAs, treasuries, recipients, or EVM addresses"),
  oldGoldIslandIdentitySuperseded: goldIslandLegacy.includes("SUPERSEDED IDENTITY SPEC"),
  current18888BankIdentity: bank.includes("contract LingxiaoCelestialBank18888_Upgradeable"),
  current18888PolicyGated: bank.includes('return "POLICY_GATED_SETTLEMENT_BANK"'),
  distinctPaymentApproval: bank.includes("SameProposerAndApprover"),
  beneficiaryClaimOnly: bank.includes("NotDisbursementBeneficiary"),
  currentBankWhitepaperIntegrated: currentBankWhitepaper.includes("V2.0 CURRENT")
    && currentBankWhitepaper.includes("不是只進不出的保險箱"),
  currentConservationIntegrated: currentConservation.includes("V1.8")
    && currentConservation.includes("18888 不是 receive-only vault"),
  currentCelestialSeatsIntegrated: currentSeats.includes("V1.1 Celestial Payroll Reconciliation")
    && currentSeats.includes("不是被動分紅"),
  currentYunzhangIntegrated: currentYunzhang.includes("V1.2 質量比例校正版")
    && currentYunzhang.includes("8895 **不是 KAIOS Minter**"),
  noOwnerWithdrawFunction: !/function\s+(?:withdraw|sweep|rescue|transferToken)\s*\(/u.test(bank),
  noPlayerTransferFrom: !bank.includes("transferFrom("),
  galacticBankLineagePreserved: bank.includes("KGEN_GalacticBank_V7_5_2"),
  lingxiaoV1LineagePreserved: bank.includes("KGEN_LingxiaoDeityBank_V1_0_1"),
  noMainnetDeployment: !fs.existsSync(path.join(repo, "KGEN-KAIOS", "deployments", "mainnet.json")),
};
for (const [assertion, passed] of Object.entries(assertions)) {
  if (!passed) failures.push({ assertion });
}

const report = {
  status: failures.length === 0 ? "PASS" : "FAIL",
  singleSourceOfTruth: "KGEN-KAIOS/KAIOS_FrictionMirror_Multiverse_README.md",
  active1To10000Conflicts: audit.classifications.ACTIVE_CONFLICT,
  contract1To10000Conflicts: audit.classifications.CONTRACT_CRITICAL,
  assertions,
  failures,
};
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`CURRENT lineage reconciliation: ${report.status}`);
if (failures.length) process.exit(1);
