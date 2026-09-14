import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectRealTradingUiPreflight} from '../K線西遊記/temples/11520/runtime/real-trading-preflight-ui.mjs';

const WALLET={address:'0x3333333333333333333333333333333333333333',chainId:56};
const BRAIN='0x1111111111111111111111111111111111111111';
const ENGINE='0x2222222222222222222222222222222222222222';

test('UI preflight is visibly blocked without real deployment/feed/authorization',()=>{
  const r=inspectRealTradingUiPreflight({axis:'KX',market:'BTCUSDT',chainId:56,walletIdentity:WALLET});
  assert.equal(r.ready,false);
  assert.equal(r.signerRequested,false);
  assert.equal(r.transactionPayload,null);
  assert.equal(r.broadcast,false);
  assert.ok(r.blockers.includes('PRODUCTION_FEED_PROVENANCE_REQUIRED'));
  assert.ok(r.blockers.includes('BRAIN_DEPLOYED_ADDRESS_REQUIRED'));
  assert.ok(r.blockers.includes('POSITION_ENGINE_DEPLOYED_ADDRESS_REQUIRED'));
  assert.ok(r.blockers.includes('HUMAN_MAINNET_EXECUTION_AUTHORIZATION_REQUIRED'));
});

test('UI preflight requires retained public wallet identity',()=>{
  const r=inspectRealTradingUiPreflight({axis:'KY',market:'ETHUSDT',chainId:56,walletIdentity:null});
  assert.equal(r.ready,false);
  assert.ok(r.blockers.includes('WALLET_PUBLIC_IDENTITY_REQUIRED'));
});

test('UI preflight can become ready only for exact fixed market and all protected gates',()=>{
  const r=inspectRealTradingUiPreflight({axis:'KZ',market:'BNBUSDT',chainId:56,walletIdentity:WALLET,feedProvenanceVerified:true,brainAddress:BRAIN,positionEngineAddress:ENGINE,humanMainnetAuthorization:true});
  assert.equal(r.ready,true);
  assert.deepEqual(r.blockers,[]);
  assert.throws(()=>inspectRealTradingUiPreflight({axis:'KZ',market:'SOLUSDT',chainId:56,walletIdentity:WALLET,feedProvenanceVerified:true,brainAddress:BRAIN,positionEngineAddress:ENGINE,humanMainnetAuthorization:true}),/REAL_TRADING_AXIS_MARKET_MISMATCH/);
});
