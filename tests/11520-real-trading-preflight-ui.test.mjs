import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {inspectRealTradingUiPreflight,inspectMainnetUnsignedPackage} from '../K線西遊記/temples/11520/runtime/real-trading-preflight-ui.mjs';

const WALLET={address:'0x3333333333333333333333333333333333333333',chainId:56};
const BRAIN='0x1111111111111111111111111111111111111111';
const ENGINE='0x2222222222222222222222222222222222222222';

// Synthetic structural fixture only: no actual deployment/readback/approval.
function sortedJson(v){return v&&typeof v==='object'?(Array.isArray(v)?'['+v.map(sortedJson).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+sortedJson(v[k])).join(',')+'}'):JSON.stringify(v)}
function seal(value){const {packageDigest,...payload}=structuredClone(value);return {...payload,packageDigest:'sha256:'+createHash('sha256').update(sortedJson(payload)).digest('hex')}}
function unsignedFixture(){return seal({
  documentType:'K11520_MAINNET_UNSIGNED_EXECUTION_PACKAGE',schemaVersion:1,chainId:56,mode:'BUILD_ONLY',broadcast:false,executionAuthorized:false,
  status:'UNSIGNED_REQUIRES_HUMAN_APPROVAL',blockers:[],deploymentReadbacks:'NOT_PERFORMED',
  input:{chainId:56,token:{address:ENGINE,chainId:56,testOnly:false,decimals:18,codeHash:'0x'+'ab'.repeat(32),provenance:'SYNTHETIC_NOT_PRODUCTION'},
    funding:{account:WALLET.address,settlementCapitalWei:'100',insuranceWei:'10',totalKgenWei:'110'},
    gas:{maximumGasPriceWei:'2',totalGasCostCapWei:'100000',nativeValuePerTransactionWei:'0'},startingNonces:{[WALLET.address]:3}},
  sourceHashes:{synthetic:'a'.repeat(64)},artifactDigests:{synthetic:'0x'+'b'.repeat(64)},predictedAddresses:{brainProxy:BRAIN,brainImplementation:ENGINE},
  transactions:Array.from({length:4},(_,i)=>({chainId:56,type:0,from:WALLET.address,to:null,nonce:3+i,value:'0',gasLimit:'100',gasPrice:'2',data:'0x1234'}))
})}

test('unsigned Mainnet inspector verifies content without enabling wallet or claiming chain evidence',async()=>{
  const p=unsignedFixture(),result=await inspectMainnetUnsignedPackage(p,{expectedDigest:p.packageDigest});
  assert.equal(result.reviewable,true);assert.equal(result.ready,false);
  assert.equal(result.broadcast,false);assert.equal(result.signerRequested,false);assert.equal(result.transactionPayload,null);
  assert.ok(result.blockers.includes('HUMAN_EXACT_MANIFEST_APPROVAL_REQUIRED'));
  assert.ok(result.blockers.includes('FRESH_CHAIN_CODE_NONCE_ORACLE_FUNDING_READBACK_REQUIRED'));
});

test('unsigned package tampering and unpinned digest fail closed',async()=>{
  const p=unsignedFixture();assert.equal((await inspectMainnetUnsignedPackage(p)).reviewable,false);
  const original=p.packageDigest;p.transactions[0].data='0xabcd';
  assert.equal((await inspectMainnetUnsignedPackage(p,{expectedDigest:original})).reviewable,false);
  const resealed=seal(p);assert.equal((await inspectMainnetUnsignedPackage(resealed,{expectedDigest:original})).reviewable,false);
});

test('unsigned inspector rejects chain, custody, proxy, gas, nonce and fabricated approval/receipt violations',async()=>{
  for(const mutate of [
    p=>p.chainId=97,p=>p.broadcast=true,p=>p.executionAuthorized=true,p=>p.deploymentReadbacks='VERIFIED',p=>p.approvalReceipt='fabricated',
    p=>p.input.token.testOnly=true,p=>p.input.token.codeHash=null,p=>p.input.token.provenance='',p=>p.input.funding.totalKgenWei='111',
    p=>p.predictedAddresses.brainProxy=ENGINE,p=>p.sourceHashes={},p=>p.artifactDigests={},p=>p.transactions=[],
    p=>p.transactions[0].chainId=97,p=>p.transactions[0].value='1',p=>p.transactions[0].nonce=0,p=>p.transactions[0].signature='signed',
    p=>p.transactions[0].gasPrice='3',p=>p.input.gas.totalGasCostCapWei='1',p=>p.input.gas.nativeValuePerTransactionWei='1'
  ]){const p=unsignedFixture();mutate(p);const sealed=seal(p);const result=await inspectMainnetUnsignedPackage(sealed,{expectedDigest:sealed.packageDigest});assert.equal(result.reviewable,false,mutate.toString());assert.equal(result.ready,false)}
  assert.equal((await inspectMainnetUnsignedPackage(null)).reviewable,false);
});

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
