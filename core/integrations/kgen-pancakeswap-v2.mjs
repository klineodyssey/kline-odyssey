import { invariant } from "../shared/errors.mjs";

export const KGEN_SWAP_CONFIG = Object.freeze({
  chain_id: 56,
  chain_hex: "0x38",
  token_address: "0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be",
  pair_address: "0xf36640d7327b53ba3d7fcc1d98dfc1b85574b6c2",
  router_address: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
  factory_address: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
  wbnb_address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  pair_id: "KGEN_WBNB_PANCAKESWAP_V2",
  token_decimals: 18,
  default_slippage_bps: 200,
  min_slippage_bps: 50,
  max_slippage_bps: 1000,
  deadline_seconds: 1200
});

const PAIR_ABI = Object.freeze([
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function factory() view returns (address)",
  "function getReserves() view returns (uint112 reserve0,uint112 reserve1,uint32 blockTimestampLast)"
]);

const ROUTER_ABI = Object.freeze([
  "function factory() view returns (address)",
  "function WETH() view returns (address)",
  "function getAmountsOut(uint amountIn,address[] path) view returns (uint[] amounts)",
  "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin,address[] path,address to,uint deadline) payable",
  "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn,uint amountOutMin,address[] path,address to,uint deadline)"
]);

const TOKEN_ABI = Object.freeze([
  "function allowance(address owner,address spender) view returns (uint256)",
  "function approve(address spender,uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function TAX_BPS_TOTAL() view returns (uint16)",
  "function isTaxExempt(address) view returns (bool)",
  "function isMarketMakerPair(address) view returns (bool)"
]);

function sameAddress(left, right) { return String(left).toLowerCase() === String(right).toLowerCase(); }

export function validateKgenMarketSnapshot(snapshot, config = KGEN_SWAP_CONFIG) {
  invariant(snapshot.chain_id === config.chain_id, "WRONG_CHAIN", `KGEN trading requires BSC chain ${config.chain_id}`);
  invariant(snapshot.token_code !== "0x" && snapshot.pair_code !== "0x" && snapshot.router_code !== "0x", "CONTRACT_CODE_MISSING", "Token, pair and router bytecode must exist");
  invariant(sameAddress(snapshot.token0, config.token_address), "PAIR_TOKEN_MISMATCH", "KGEN pair token0 is not the registered KGEN token");
  invariant(sameAddress(snapshot.token1, config.wbnb_address), "PAIR_TOKEN_MISMATCH", "KGEN pair token1 is not WBNB");
  invariant(sameAddress(snapshot.pair_factory, config.factory_address), "PAIR_FACTORY_MISMATCH", "Pair factory is not the registered PancakeSwap V2 factory");
  invariant(sameAddress(snapshot.router_factory, snapshot.pair_factory), "ROUTER_FACTORY_MISMATCH", "Router and pair factories differ");
  invariant(sameAddress(snapshot.router_weth, config.wbnb_address), "ROUTER_WBNB_MISMATCH", "Router WETH does not resolve to registered WBNB");
  invariant(snapshot.reserves_non_zero === true, "NO_VERIFIED_LIQUIDITY", "KGEN pair reserves must both be non-zero");
  return Object.freeze({ status: "CHAIN_READ_VERIFIED", ...snapshot });
}

export function validateSwapIntent({ direction, amount, slippage_bps, action_reason, confirmed }) {
  invariant(["BUY_KGEN", "SELL_KGEN"].includes(direction), "INVALID_SWAP_DIRECTION", "Swap direction must be BUY_KGEN or SELL_KGEN");
  invariant(typeof amount === "string" && /^\d+(\.\d+)?$/.test(amount) && Number(amount) > 0, "INVALID_SWAP_AMOUNT", "Swap amount must be a positive decimal string");
  invariant(Number.isInteger(slippage_bps) && slippage_bps >= KGEN_SWAP_CONFIG.min_slippage_bps && slippage_bps <= KGEN_SWAP_CONFIG.max_slippage_bps, "INVALID_SLIPPAGE", "KGEN fee-on-transfer swaps require slippage between 0.50% and 10%");
  invariant(action_reason?.trim(), "ACTION_REASON_REQUIRED", "Every chain transaction requires an action reason");
  invariant(confirmed === true, "EXPLICIT_CONFIRMATION_REQUIRED", "A live swap requires explicit confirmation");
  return true;
}

export async function createKgenSwapAdapter({ ethers, ethereum, store = null, config = KGEN_SWAP_CONFIG }) {
  invariant(ethers?.providers?.Web3Provider && ethereum?.request, "WALLET_PROVIDER_REQUIRED", "An EIP-1193 wallet provider is required");
  const provider = new ethers.providers.Web3Provider(ethereum, "any");

  async function snapshot() {
    const network = await provider.getNetwork();
    const pair = new ethers.Contract(config.pair_address, PAIR_ABI, provider);
    const router = new ethers.Contract(config.router_address, ROUTER_ABI, provider);
    const [tokenCode, pairCode, routerCode, token0, token1, pairFactory, reserves, routerFactory, routerWeth] = await Promise.all([
      provider.getCode(config.token_address), provider.getCode(config.pair_address), provider.getCode(config.router_address),
      pair.token0(), pair.token1(), pair.factory(), pair.getReserves(), router.factory(), router.WETH()
    ]);
    return validateKgenMarketSnapshot({
      chain_id: network.chainId,
      token_code: tokenCode,
      pair_code: pairCode,
      router_code: routerCode,
      token0,
      token1,
      pair_factory: pairFactory,
      router_factory: routerFactory,
      router_weth: routerWeth,
      reserves_non_zero: !reserves.reserve0.isZero() && !reserves.reserve1.isZero()
    }, config);
  }

  async function connect() {
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    invariant(accounts?.[0], "WALLET_ACCOUNT_REQUIRED", "Wallet did not expose an account");
    await snapshot();
    return { status: "WALLET_CONNECTED", account: accounts[0] };
  }

  async function quote({ direction, amount, slippage_bps = config.default_slippage_bps }) {
    validateSwapIntent({ direction, amount, slippage_bps, action_reason: "READ_ONLY_QUOTE", confirmed: true });
    await snapshot();
    const router = new ethers.Contract(config.router_address, ROUTER_ABI, provider);
    const inputDecimals = 18;
    const amountIn = ethers.utils.parseUnits(amount, inputDecimals);
    const path = direction === "BUY_KGEN" ? [config.wbnb_address, config.token_address] : [config.token_address, config.wbnb_address];
    const amounts = await router.getAmountsOut(amountIn, path);
    const quotedOut = amounts.at(-1);
    const minimumOut = quotedOut.mul(10_000 - slippage_bps).div(10_000);
    return Object.freeze({ direction, amount_in: amountIn, quoted_out: quotedOut, minimum_out: minimumOut, path, slippage_bps });
  }

  async function recordReceipt({ receipt, direction, account, amount, actionReason, approval = false }) {
    invariant(receipt?.status === 1 && /^0x[0-9a-fA-F]{64}$/.test(receipt.transactionHash), "FAILED_RECEIPT", "Only successful on-chain receipts may enter history");
    if (!store) return;
    const id = `${approval ? "APPROVAL" : "SWAP"}_${receipt.transactionHash.slice(2).toUpperCase()}`;
    const eventType = approval ? "TOKEN_APPROVAL_CONFIRMED" : "AMM_SWAP_SETTLED";
    const entity = { transaction_id: id, tx_hash: receipt.transactionHash, chain_id: config.chain_id, direction, account, amount, action_reason: actionReason, status: "SETTLED" };
    const operations = [{ domain: "TRANSACTION", stream: "MARKET", id, entity, event_type: eventType, actor_id: account, payload: entity, tx_hash: receipt.transactionHash }];
    if (!approval) operations.push({ domain: "ASSET", stream: "ASSET", id: "KGEN_TOKEN_ASSET", entity: await store.getEntity("ASSET", "KGEN_TOKEN_ASSET"), event_type: "TOKEN_SWAP_RECORDED", actor_id: account, payload: { transaction_id: id, direction, amount, action_reason: actionReason }, tx_hash: receipt.transactionHash });
    await store.commitBatch(operations);
  }

  async function execute(intent) {
    validateSwapIntent(intent);
    await connect();
    const signer = provider.getSigner();
    const account = await signer.getAddress();
    const swapQuote = await quote(intent);
    const router = new ethers.Contract(config.router_address, ROUTER_ABI, signer);
    const deadline = Math.floor(Date.now() / 1000) + config.deadline_seconds;

    if (intent.direction === "SELL_KGEN") {
      const token = new ethers.Contract(config.token_address, TOKEN_ABI, signer);
      const allowance = await token.allowance(account, config.router_address);
      if (allowance.lt(swapQuote.amount_in)) {
        const approvalTx = await token.approve(config.router_address, swapQuote.amount_in);
        const approvalReceipt = await approvalTx.wait(1);
        await recordReceipt({ receipt: approvalReceipt, direction: intent.direction, account, amount: intent.amount, actionReason: intent.action_reason, approval: true });
      }
      const transaction = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(swapQuote.amount_in, swapQuote.minimum_out, swapQuote.path, account, deadline);
      const receipt = await transaction.wait(1);
      await recordReceipt({ receipt, direction: intent.direction, account, amount: intent.amount, actionReason: intent.action_reason });
      return { transaction, receipt, quote: swapQuote };
    }

    const transaction = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(swapQuote.minimum_out, swapQuote.path, account, deadline, { value: swapQuote.amount_in });
    const receipt = await transaction.wait(1);
    await recordReceipt({ receipt, direction: intent.direction, account, amount: intent.amount, actionReason: intent.action_reason });
    return { transaction, receipt, quote: swapQuote };
  }

  return Object.freeze({ snapshot, connect, quote, execute });
}

function formatUnits(value, decimals = 18) {
  const amount = BigInt(value.toString());
  const base = 10n ** BigInt(decimals);
  const whole = amount / base;
  const fraction = (amount % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export async function createDigitalAntKgenDryRunQuote({ ethers, provider, walletAddress, amountInWei, slippageBps = KGEN_SWAP_CONFIG.default_slippage_bps, config = KGEN_SWAP_CONFIG }) {
  invariant(provider && ethers?.Contract, "READ_PROVIDER_REQUIRED", "KGEN dry-run quote requires a read-only provider");
  invariant(/^0x[0-9a-fA-F]{40}$/.test(walletAddress), "INVALID_WALLET_ADDRESS", "KGEN dry-run quote requires the verified public wallet");
  invariant(/^\d+$/.test(String(amountInWei)) && BigInt(amountInWei) > 0n, "INVALID_SWAP_AMOUNT", "Dry-run scenario amount must be positive Wei");
  invariant(Number.isInteger(slippageBps) && slippageBps >= config.min_slippage_bps && slippageBps <= config.max_slippage_bps, "INVALID_SLIPPAGE", "Dry-run slippage is outside policy");
  const network = await provider.getNetwork();
  const pair = new ethers.Contract(config.pair_address, PAIR_ABI, provider);
  const router = new ethers.Contract(config.router_address, ROUTER_ABI, provider);
  const token = new ethers.Contract(config.token_address, TOKEN_ABI, provider);
  const [block, gasPrice, walletBnb, tokenCode, pairCode, routerCode, token0, token1, pairFactory, reserves, routerFactory, routerWeth, taxBpsRaw, pairTaxable, pairExempt, walletExempt] = await Promise.all([
    provider.getBlock("latest"), provider.getGasPrice(), provider.getBalance(walletAddress), provider.getCode(config.token_address), provider.getCode(config.pair_address), provider.getCode(config.router_address), pair.token0(), pair.token1(), pair.factory(), pair.getReserves(), router.factory(), router.WETH(), token.TAX_BPS_TOTAL(), token.isMarketMakerPair(config.pair_address), token.isTaxExempt(config.pair_address), token.isTaxExempt(walletAddress)
  ]);
  validateKgenMarketSnapshot({ chain_id: Number(network.chainId), token_code: tokenCode, pair_code: pairCode, router_code: routerCode, token0, token1, pair_factory: pairFactory, router_factory: routerFactory, router_weth: routerWeth, reserves_non_zero: !reserves.reserve0.isZero() && !reserves.reserve1.isZero() }, config);
  const amountIn = ethers.BigNumber.from(String(amountInWei));
  const path = [config.wbnb_address, config.token_address];
  const amounts = await router.getAmountsOut(amountIn, path);
  const quotedOut = amounts.at(-1);
  const minimumOut = quotedOut.mul(10_000 - slippageBps).div(10_000);
  const taxApplies = pairTaxable && !pairExempt && !walletExempt;
  const taxBps = taxApplies ? Number(taxBpsRaw) : 0;
  const expectedAfterTax = quotedOut.mul(10_000 - taxBps).div(10_000);
  const reserveKgen = BigInt(reserves.reserve0.toString());
  const reserveWbnb = BigInt(reserves.reserve1.toString());
  const spotOut = BigInt(amountIn.toString()) * reserveKgen / reserveWbnb;
  const quoteOutBig = BigInt(quotedOut.toString());
  const priceImpactBps = spotOut > quoteOutBig && spotOut > 0n ? Number((spotOut - quoteOutBig) * 10_000n / spotOut) : 0;
  const deadline = block.timestamp + config.deadline_seconds;
  let estimatedGas = null;
  try { estimatedGas = await router.estimateGas.swapExactETHForTokensSupportingFeeOnTransferTokens(minimumOut, path, walletAddress, deadline, { from: walletAddress, value: amountIn }); } catch { estimatedGas = null; }
  const gasCost = estimatedGas ? BigInt(estimatedGas.toString()) * BigInt(gasPrice.toString()) : null;
  const postTrade = gasCost !== null && BigInt(walletBnb.toString()) >= BigInt(amountIn.toString()) + gasCost ? BigInt(walletBnb.toString()) - BigInt(amountIn.toString()) - gasCost : null;
  return Object.freeze({
    status: "CHAIN_READ_VERIFIED",
    mode: "DRY_RUN_ONLY",
    broadcast_capability: "ABSENT",
    chain_id: 56,
    block_number: block.number,
    observed_at: new Date(block.timestamp * 1000).toISOString(),
    pair_address: config.pair_address,
    router_address: config.router_address,
    amount_in_wei: amountIn.toString(),
    amount_in_bnb: formatUnits(amountIn),
    quoted_kgen_before_tax_wei: quotedOut.toString(),
    quoted_kgen_before_tax: formatUnits(quotedOut),
    expected_kgen_after_tax_wei: expectedAfterTax.toString(),
    expected_kgen_after_tax: formatUnits(expectedAfterTax),
    minimum_router_out_wei: minimumOut.toString(),
    token_tax_bps: taxBps,
    token_tax_status: taxApplies ? "VERIFIED_AMM_TAX_APPLIES" : "VERIFIED_EXEMPT_OR_PAIR_NOT_TAXABLE",
    price_impact_bps: priceImpactBps,
    slippage_bps: slippageBps,
    gas_price_wei: gasPrice.toString(),
    estimated_gas_units: estimatedGas?.toString() ?? null,
    estimated_gas_bnb: gasCost === null ? null : formatUnits(gasCost),
    current_bnb: formatUnits(walletBnb),
    post_trade_bnb: postTrade === null ? null : formatUnits(postTrade),
    reserves: { kgen_wei: reserves.reserve0.toString(), wbnb_wei: reserves.reserve1.toString() },
    risk_assessment: estimatedGas === null ? "GAS_ESTIMATE_UNAVAILABLE_NO_ACTION" : priceImpactBps > 500 ? "HIGH_PRICE_IMPACT_NO_ACTION" : "OWNER_APPROVAL_REQUIRED_NO_ACTION",
    tx_hash: null
  });
}
