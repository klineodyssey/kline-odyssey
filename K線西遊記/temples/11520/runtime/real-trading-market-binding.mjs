/* KGEN_META
VERSION: 1.0.0
STATUS: CANDIDATE
PURPOSE: Fail-closed 11520 real-trading axis/market identity binding.
*/

export const REAL_TRADING_MARKET_BINDINGS = Object.freeze({
  KX: Object.freeze({
    axis: 'KX',
    market: 'BTCUSDT',
    display: 'BTC/USDT',
    contractMarket: 0,
    chainId: 56,
    feedSetStatus: 'PRODUCTION_FEED_PROVENANCE_REQUIRED'
  }),
  KY: Object.freeze({
    axis: 'KY',
    market: 'ETHUSDT',
    display: 'ETH/USDT',
    contractMarket: 1,
    chainId: 56,
    feedSetStatus: 'PRODUCTION_FEED_PROVENANCE_REQUIRED'
  }),
  KZ: Object.freeze({
    axis: 'KZ',
    market: 'BNBUSDT',
    display: 'BNB/USDT',
    contractMarket: 2,
    chainId: 56,
    feedSetStatus: 'PRODUCTION_FEED_PROVENANCE_REQUIRED'
  })
});

export const REAL_TRADING_STATUS = Object.freeze({
  mode: 'REAL_FUNDS_CANDIDATE_NOT_ACTIVE',
  orderSubmissionEnabled: false,
  depositEnabled: false,
  signerRequestEnabled: false,
  chainWriteEnabled: false,
  mainnetTransactionAuthorized: false
});

function normalizeAxis(axis) {
  const value = String(axis ?? '').trim().toUpperCase();
  if (!Object.hasOwn(REAL_TRADING_MARKET_BINDINGS, value)) throw new Error('REAL_TRADING_AXIS_NOT_SUPPORTED');
  return value;
}

function normalizeMarket(market) {
  return String(market ?? '').trim().toUpperCase().replace('/', '');
}

export function getRealTradingBinding(axis) {
  return REAL_TRADING_MARKET_BINDINGS[normalizeAxis(axis)];
}

export function assertRealTradingAxisMarket({ axis, market, chainId = 56 } = {}) {
  const binding = getRealTradingBinding(axis);
  if (normalizeMarket(market) !== binding.market) throw new Error('REAL_TRADING_AXIS_MARKET_MISMATCH');
  if (Number(chainId) !== binding.chainId) throw new Error('REAL_TRADING_CHAIN_MISMATCH');
  return binding;
}

export function realTradingEligibility({ axis, market, chainId = 56, feedProvenanceVerified = false, brainAddress = null, positionEngineAddress = null } = {}) {
  const binding = assertRealTradingAxisMarket({ axis, market, chainId });
  const blockers = [];
  if (!feedProvenanceVerified) blockers.push('PRODUCTION_FEED_PROVENANCE_REQUIRED');
  if (!/^0x[0-9a-fA-F]{40}$/.test(String(brainAddress ?? ''))) blockers.push('BRAIN_DEPLOYED_ADDRESS_REQUIRED');
  if (!/^0x[0-9a-fA-F]{40}$/.test(String(positionEngineAddress ?? ''))) blockers.push('POSITION_ENGINE_DEPLOYED_ADDRESS_REQUIRED');
  blockers.push('HUMAN_MAINNET_EXECUTION_AUTHORIZATION_REQUIRED');
  return Object.freeze({
    binding,
    eligible: false,
    blockers: Object.freeze(blockers),
    orderSubmissionEnabled: false,
    signerRequestEnabled: false
  });
}
