import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const reportPath = path.join(root, "reports", "KAIOS_18911_V3_FRONTEND_SUPPORT_HANDOFF.json");
const contractNames = ["KAIOS", "KAIOSAlchemyFurnace", "KUFOClaimWormhole", "KUFO"];

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

const abi = Object.fromEntries(contractNames.map((name) => {
  const artifact = JSON.parse(fs.readFileSync(path.join(root, "artifacts", `${name}.json`), "utf8"));
  const canonical = canonicalJson(artifact.abi);
  return [name, {
    compiler: artifact.compiler,
    sha256: crypto.createHash("sha256").update(canonical).digest("hex"),
    abi: artifact.abi,
  }];
}));

const report = {
  documentId: "KAIOS_18911_V3_FRONTEND_SUPPORT_HANDOFF",
  status: "REVIEW_CANDIDATE_NOT_DEPLOYED",
  chainId: 56,
  readOnly: true,
  deployedV1: {
    kaios: "0xD4E67B3a69e41524c424150E6b6e921b01D036db",
    furnace18911: "0x44c2CA9B9eba19d8F79F6E1786fd9D25e73738e1",
    organRegistry: "0xA9e7CbF161E39E556f4B5b8E41397Ac4B87a932D",
    status: "MAINNET_LIVE_HISTORY",
  },
  successorV3: {
    furnace18911: null,
    wormhole511111: null,
    kufo: null,
    catalystBank: null,
    halfLifeSeconds: null,
    status: "ADDRESSES_AND_HALF_LIFE_UNFROZEN",
  },
  resolver: {
    source: "KAIOSOrganRegistry.organ(keccak256('KAIOS.ORGAN.FURNACE.18911'))",
    activeBodyRule: "EXACT_REGISTRY_MATCH_ONLY",
    predecessor: "0x44c2CA9B9eba19d8F79F6E1786fd9D25e73738e1",
    candidateLifeId: "LIFE-KAIOS-TAISHANG-LAOJUN-18911",
    candidateEmbodimentVersion: 3,
  },
  transactionUi: {
    enabled: false,
    disabledReasons: [
      "CATALYST_BANK_PRODUCTION_ADDRESS_UNFROZEN",
      "KUFO_HALF_LIFE_SECONDS_UNFROZEN",
      "SUCCESSOR_ADDRESSES_NOT_DEPLOYED",
      "HUMAN_MAINNET_AUTHORIZATION_ABSENT"
    ],
    requiredStates: [
      "WRONG_NETWORK",
      "ALLOWANCE_REQUIRED",
      "BANK_RECEIPT_PENDING",
      "KAIOS_BURN_PENDING",
      "KUFO_MINT_PENDING",
      "REVERTED",
      "CONFIRMED",
      "REPLAY_BLOCKED"
    ],
    mockOrForkLabel: "SIMULATION_ONLY_NOT_MAINNET_AVAILABLE",
  },
  abi,
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Frontend handoff generated: ${path.relative(root, reportPath)}`);
