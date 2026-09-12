export const TAX_CREDIT_ROUTE_STATUS = "DESIGN_ONLY_DISABLED";
export const KGEN_BANK_TAX_BPS = 10n;
export const BPS_DENOMINATOR = 10_000n;
export const CONTRIBUTION_FRESHNESS_WINDOW_SECONDS = 130n * 86_400n;

const HASH = /^0x[0-9a-fA-F]{64}$/;
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;

function fail(reason) {
  throw new Error(`TAX_CREDIT_FAIL_CLOSED:${reason}`);
}

export function taxCreditKey(record) {
  return [
    record.txHash.toLowerCase(),
    BigInt(record.logIndex).toString(),
    record.wallet.toLowerCase(),
    BigInt(record.amount).toString(),
    BigInt(record.timestamp).toString(),
  ].join(":");
}

export function validateTaxCredit(record, {
  now,
  catalystBank,
  consumedAmounts = new Map(),
} = {}) {
  if (TAX_CREDIT_ROUTE_STATUS !== "DESIGN_ONLY_DISABLED") fail("ROUTE_MUST_REMAIN_DISABLED");
  if (record.chainId !== 56) fail("WRONG_CHAIN");
  if (!HASH.test(record.txHash) || !HASH.test(record.proofId) || !HASH.test(record.batchRoot)) {
    fail("INVALID_HASH");
  }
  for (const value of [record.wallet, record.recipient, record.attributedBuyer, record.pair, record.gateway]) {
    if (!ADDRESS.test(value)) fail("INVALID_ADDRESS");
  }
  if (record.sourceKind !== "PROVEN_KGEN_BANK_TAX_0_10") fail("UNPROVEN_SOURCE");
  if (BigInt(record.bankTaxBps) !== KGEN_BANK_TAX_BPS) fail("WRONG_TAX_RAIL");
  if (record.recipient.toLowerCase() !== catalystBank.toLowerCase()) fail("WRONG_BANK");
  if (record.wallet.toLowerCase() !== record.attributedBuyer.toLowerCase()) fail("BUYER_ATTRIBUTION_MISMATCH");
  if (record.wallet.toLowerCase() === record.pair.toLowerCase()) fail("PAIR_IS_NOT_BUYER");
  if (BigInt(record.amount) <= 0n) fail("ZERO_AMOUNT");
  const timestamp = BigInt(record.timestamp);
  const current = BigInt(now);
  if (timestamp > current) fail("FUTURE_TIMESTAMP");
  if (current - timestamp > CONTRIBUTION_FRESHNESS_WINDOW_SECONDS) fail("EXPIRED");
  const consumed = BigInt(consumedAmounts.get(record.proofId) ?? 0n);
  if (consumed < 0n || consumed > BigInt(record.amount)) fail("INVALID_CONSUMED_AMOUNT");
  if (consumed === BigInt(record.amount)) fail("PROOF_FULLY_CONSUMED");
  return { key: taxCreditKey(record), remaining: BigInt(record.amount) - consumed };
}

export function allocateTaxCredits(records, requiredAmount, options) {
  const required = BigInt(requiredAmount);
  if (required <= 0n) fail("ZERO_REQUIRED_AMOUNT");
  const seenKeys = new Set();
  const validated = records.map((record) => {
    const result = validateTaxCredit(record, options);
    if (seenKeys.has(result.key)) fail("DUPLICATE_SOURCE_EVENT");
    seenKeys.add(result.key);
    return { record, ...result };
  }).sort((left, right) => {
    const fields = ["timestamp", "blockNumber", "transactionIndex", "logIndex"];
    for (const field of fields) {
      const a = BigInt(left.record[field]);
      const b = BigInt(right.record[field]);
      if (a < b) return -1;
      if (a > b) return 1;
    }
    return left.key.localeCompare(right.key);
  });

  let remainingRequired = required;
  const allocations = [];
  for (const credit of validated) {
    if (remainingRequired === 0n) break;
    const amount = credit.remaining < remainingRequired ? credit.remaining : remainingRequired;
    allocations.push({ proofId: credit.record.proofId, amount, key: credit.key });
    remainingRequired -= amount;
  }
  if (remainingRequired !== 0n) fail("INSUFFICIENT_FRESH_CREDIT");
  return allocations;
}
