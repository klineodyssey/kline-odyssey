/* KGEN_META
VERSION: 1.0.0
STATUS: CANDIDATE
PURPOSE: Build unsigned, non-broadcast 11520 real-trading order intents from fixed axis/market bindings.
*/
import {assertRealTradingAxisMarket,realTradingEligibility} from './real-trading-market-binding.mjs';
import {normalizeSignedC,signedPositionSide} from './kgen-margin-runtime.mjs';

function finitePositive(value,label){const n=Number(value);if(!Number.isFinite(n)||n<=0)throw new Error(`${label}_MUST_BE_POSITIVE`);return n}
function integerRange(value,label,min,max){const n=Number(value);if(!Number.isInteger(n)||n<min||n>max)throw new Error(`${label}_OUT_OF_RANGE`);return n}
function normalizeAddress(value,label){const v=String(value??'');if(!/^0x[0-9a-fA-F]{40}$/.test(v))throw new Error(`${label}_INVALID`);return v}

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
  const signedC=normalizeSignedC(c),leverage=Math.abs(signedC);
  const observedPrice=finitePositive(price,'PRICE');
  const direction=signedPositionSide(signedC,side);
  return Object.freeze({
    schema:'KAIOS_11520_REAL_TRADING_ORDER_INTENT_V1',
    axis:binding.axis,market:binding.market,contractMarket:binding.contractMarket,chainId:binding.chainId,
    trader,side:direction,lots:normalizedLots,c:signedC,leverage,
    observedPrice,
    brainAddress:normalizeAddress(brainAddress,'BRAIN_ADDRESS'),
    positionEngineAddress:normalizeAddress(positionEngineAddress,'POSITION_ENGINE_ADDRESS'),
    transactionPayload:null,calldata:null,signerRequested:false,broadcast:false,
    status:'READY_FOR_EXPLICIT_WALLET_ACTION_NOT_SUBMITTED'
  });
}
