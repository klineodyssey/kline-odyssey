/* KGEN_META
VERSION: 1.0.0
STATUS: CANDIDATE
PURPOSE: Build unsigned, non-broadcast 11520 real-trading order intents from fixed axis/market bindings.
*/
import {assertRealTradingAxisMarket,realTradingEligibility} from './real-trading-market-binding.mjs';

const MAX_C_LEVERAGE=100;
function finitePositive(value,label){const n=Number(value);if(!Number.isFinite(n)||n<=0)throw new Error(`${label}_MUST_BE_POSITIVE`);return n}
function integerRange(value,label,min,max){const n=Number(value);if(!Number.isInteger(n)||n<min||n>max)throw new Error(`${label}_OUT_OF_RANGE`);return n}
function normalizeSide(side){const s=String(side??'').trim().toUpperCase();if(!['LONG','SHORT','多','空'].includes(s))throw new Error('SIDE_NOT_SUPPORTED');return s==='SHORT'||s==='空'?'SHORT':'LONG'}
function normalizeAddress(value,label){const v=String(value??'');if(!/^0x[0-9a-fA-F]{40}$/.test(v))throw new Error(`${label}_INVALID`);return v}
function normalizeC(value){const n=finitePositive(value,'C');if(n>MAX_C_LEVERAGE)throw new Error('C_LEVERAGE_OUT_OF_RANGE');return n}

export function buildRealTradingOrderIntent({
  axis,market,chainId=56,side,lots,c,price,
  walletAddress,brainAddress,positionEngineAddress,
  feedProvenanceVerified=false,humanMainnetAuthorization=false
}={}){
  const binding=assertRealTradingAxisMarket({axis,market,chainId});
  const trader=normalizeAddress(walletAddress,'WALLET_ADDRESS');
  const eligibility=realTradingEligibility({axis,market,chainId,feedProvenanceVerified,brainAddress,positionEngineAddress,humanMainnetAuthorization});
  if(!eligibility.eligible)throw new Error(`REAL_TRADING_BLOCKED:${eligibility.blockers.join(',')}`);
  const normalizedLots=integerRange(lots,'LOTS',1,100);
  const leverage=normalizeC(c);
  const observedPrice=finitePositive(price,'PRICE');
  const direction=normalizeSide(side);
  return Object.freeze({
    schema:'KAIOS_11520_REAL_TRADING_ORDER_INTENT_V1',
    axis:binding.axis,market:binding.market,contractMarket:binding.contractMarket,chainId:binding.chainId,
    trader,side:direction,lots:normalizedLots,c:leverage,leverage,
    observedPrice,
    brainAddress:normalizeAddress(brainAddress,'BRAIN_ADDRESS'),
    positionEngineAddress:normalizeAddress(positionEngineAddress,'POSITION_ENGINE_ADDRESS'),
    transactionPayload:null,calldata:null,signerRequested:false,broadcast:false,
    status:'READY_FOR_EXPLICIT_WALLET_ACTION_NOT_SUBMITTED'
  });
}
