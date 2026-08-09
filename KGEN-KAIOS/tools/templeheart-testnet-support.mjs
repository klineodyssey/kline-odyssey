import { getAddress, id, parseUnits } from "ethers";

export const ORGAN_FURNACE_18911 = id("KAIOS.ORGAN.FURNACE.18911");
export const ORGAN_WORMHOLE_511111 = id("KAIOS.ORGAN.WORMHOLE.511111");
export const ORGAN_KSHIP_CONVERTER = id("KAIOS.ORGAN.KSHIP.CONVERTER");
export const ORGAN_PAIR_REGISTRY = id("KAIOS.ORGAN.PAIR.REGISTRY");
export const ORGAN_EXCHANGE_TREASURY_11520 = id("KAIOS.ORGAN.EXCHANGE_TREASURY.11520");

export function createEvidenceWriter(reportPath, markdownPath) {
  const evidence = {
    schema_version: "1.0.0",
    status: "NOT_RUN",
    chainId: "97",
    startedAt: new Date().toISOString(),
    completedAt: null,
    signerAddress: null,
    contracts: {},
    transactions: [],
    storagePreservation: null,
    attackTests: {},
    runtimeTests: {},
    failure: null,
  };

  function recordTransaction(label, receipt) {
    evidence.transactions.push({
      label,
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed?.toString?.() ?? String(receipt.gasUsed),
    });
  }

  function finalize(status, extra = {}) {
    evidence.status = status;
    evidence.completedAt = new Date().toISOString();
    Object.assign(evidence, extra);
    return evidence;
  }

  return { evidence, recordTransaction, finalize, reportPath, markdownPath };
}

export function renderMarkdown(evidence) {
  const lines = [
    "# BSC Testnet TempleHeart V3.4.0 Rehearsal",
    "",
    `**Status:** \`${evidence.status}\``,
    `**Chain ID:** ${evidence.chainId}`,
    `**Started:** ${evidence.startedAt}`,
    `**Completed:** ${evidence.completedAt ?? "—"}`,
    "",
  ];
  if (evidence.signerAddress) {
    lines.push(`**Signer (public):** \`${evidence.signerAddress}\``, "");
  }
  if (Object.keys(evidence.contracts).length) {
    lines.push("## Contracts", "");
    for (const [name, address] of Object.entries(evidence.contracts)) {
      lines.push(`- **${name}:** \`${address}\``);
    }
    lines.push("");
  }
  if (evidence.transactions.length) {
    lines.push("## Transactions", "");
    for (const tx of evidence.transactions) {
      lines.push(`- **${tx.label}:** [${tx.hash}](https://testnet.bscscan.com/tx/${tx.hash}) (block ${tx.blockNumber}, gas ${tx.gasUsed})`);
    }
    lines.push("");
  }
  if (evidence.storagePreservation) {
    lines.push("## Storage", "", `- ${evidence.storagePreservation}`, "");
  }
  if (evidence.failure) {
    lines.push("## Failure", "", `\`\`\`text`, evidence.failure, "```", "");
  }
  lines.push("## Policy", "", "- MAINNET_DEPLOY = BLOCKED", "- No secrets recorded in this file");
  return `${lines.join("\n")}\n`;
}

export async function bootstrapTestnetFixtures({
  signer,
  confirmations,
  deployArtifact,
  waitFor,
  artifact,
}) {
  const signerAddress = await signer.getAddress();
  const kgen = await deployArtifact("MockKGEN", signer, [signerAddress], confirmations);
  const kgenAddress = await kgen.getAddress();
  const treasury11520 = await deployArtifact("MockOrgan", signer, [], confirmations);
  const treasury11520Address = await treasury11520.getAddress();
  const registry = await deployArtifact("KAIOSOrganRegistry", signer, [signerAddress, 3600], confirmations);
  const registryAddress = await registry.getAddress();
  const kaios = await deployArtifact("KAIOS", signer, [kgenAddress, treasury11520Address, registryAddress], confirmations);
  const kaiosAddress = await kaios.getAddress();
  const kufo = await deployArtifact("KUFO", signer, [registryAddress, kaiosAddress], confirmations);
  const kship = await deployArtifact("KSHIP", signer, [registryAddress, await kufo.getAddress()], confirmations);
  const furnace = await deployArtifact("KAIOSAlchemyFurnace", signer, [kaiosAddress, registryAddress, 100], confirmations);
  const wormhole = await deployArtifact("KUFOClaimWormhole", signer, [
    await furnace.getAddress(),
    await kufo.getAddress(),
  ], confirmations);
  const converter = await deployArtifact("KSHIPConverter", signer, [
    await kufo.getAddress(),
    await kship.getAddress(),
  ], confirmations);
  const pairRegistry = await deployArtifact("KAIOSPairRegistry", signer, [signerAddress], confirmations);
  const fortuneGame = await deployArtifact("TestFortuneGameStub", signer, [], confirmations);
  const fortuneGameAddress = await fortuneGame.getAddress();

  for (const [organId, contract] of [
    [ORGAN_FURNACE_18911, furnace],
    [ORGAN_WORMHOLE_511111, wormhole],
    [ORGAN_KSHIP_CONVERTER, converter],
    [ORGAN_PAIR_REGISTRY, pairRegistry],
    [ORGAN_EXCHANGE_TREASURY_11520, treasury11520],
  ]) {
    await waitFor(`Bootstrap organ ${organId.slice(0, 10)}`, registry.bootstrapOrgan(organId, await contract.getAddress()), confirmations);
  }
  await waitFor("Seal organ registry bootstrap", registry.sealBootstrap(), confirmations);

  const burnAmount = parseUnits("100", 18);
  await waitFor("Burn KGEN for KAIOS settlement", kgen.burn(burnAmount), confirmations);
  await waitFor("Settle white-hole KAIOS mass", kaios.settleWhiteHoleMass(), confirmations);

  return {
    kgenAddress,
    treasury11520Address,
    proofSourceAddress: kaiosAddress,
    registryAddress,
    furnaceAddress: await furnace.getAddress(),
    fortuneGameAddress,
    fortuneGameContract: fortuneGame,
  };
}
