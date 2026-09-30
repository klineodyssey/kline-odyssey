// Original K11520 test-assets-only rehearsal. Never imports a Mainnet signer.
// Default builds a package; --local exercises it without public transactions.
// --deploy97 requires the configured BSC_TESTNET provider and signer.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import solc from 'solc';
import { Wallet, JsonRpcProvider, BrowserProvider, Contract, ContractFactory, Interface, getCreateAddress, getAddress, id, parseEther, formatEther, keccak256, ZeroAddress, ZeroHash } from 'ethers';

const live = process.argv.includes('--deploy97');
const local = process.argv.includes('--local');
const oneArgument = prefix => {const values=process.argv.filter(v=>v.startsWith(prefix));assert.ok(values.length<=1,'DUPLICATE_SUCCESSOR_ARGUMENT');assert.ok(!values.length || values[0].length>prefix.length,'EMPTY_SUCCESSOR_ARGUMENT');return values[0]?.slice(prefix.length)};
const successorId=oneArgument('--successor97=');
const prepareId=oneArgument('--prepare-successor97=');
// This mode is an offline compiler/transaction encoder, not an execution route.
const unsignedInput=oneArgument('--build-mainnet-unsigned=');
const unsignedTest=process.argv.includes('--test-mainnet-package');
const unsignedMode=Boolean(unsignedInput || unsignedTest);
assert.ok(!unsignedMode || (!live && !local && !successorId && !prepareId && !process.argv.includes('--test-successor-guards')),'UNSIGNED_MODE_MUST_BE_OFFLINE_ONLY');
assert.ok(!(unsignedInput && unsignedTest),'CHOOSE_UNSIGNED_INPUT_OR_TEST');
assert.ok(!(successorId && prepareId),'CHOOSE_PREPARE_OR_DEPLOY');
assert.ok(!successorId || (live && !local),'SUCCESSOR_REQUIRES_EXPLICIT_DEPLOY97');
assert.ok(!prepareId || (!live && !local),'PREPARATION_MUST_NOT_BROADCAST');
const sha256=value=>createHash('sha256').update(value).digest('hex');
function successorDirectory(id) {
 assert.ok(typeof id==='string' && /^[a-z0-9][a-z0-9-]{2,63}$/.test(id) && !/^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i.test(id),'INVALID_SUCCESSOR_RUN_ID');
 const root=path.resolve('artifacts/bsc97-successors'),resolved=path.resolve(root,id);
 assert.equal(path.dirname(resolved),root,'SUCCESSOR_PATH_ESCAPE');return resolved;
}
function validatePredecessor(value) {
 assert.ok(value.chainId===97 && value.testOnly===true && value.publicNetwork===true && value.verified===true && value.status==='DEPLOYED_CONFIG_VERIFIED' && value.smoke==='PASS','PREDECESSOR_NOT_VERIFIED_TESTNET');
 assert.ok(/^0x[0-9a-f]{40}$/i.test(value.admin),'INVALID_PREDECESSOR_ADMIN');
 for(const key of ['testToken','brainImplementation','brainProxy','positionEngine','orderTriggerEngine']) {
  assert.ok(/^0x[0-9a-f]{40}$/i.test(value.addresses?.[key]) && /^0x[0-9a-f]{64}$/i.test(value.codeHashes?.[key]),'INVALID_PREDECESSOR_CONTRACT');
 }
 assert.ok(Object.keys(value.sourceHashes??{}).length>=4 && Object.values(value.sourceHashes).every(hash=>/^[0-9a-f]{64}$/i.test(hash)),'MISSING_PREDECESSOR_SOURCE_HASHES');
 assert.ok(value.receipts?.length>0 && value.receipts.every(r=>r.status==='CONFIRMED' && /^0x[0-9a-f]{64}$/i.test(r.txHash) && Number.isSafeInteger(r.block) && r.block>0),'PREDECESSOR_RECEIPTS_UNCONFIRMED');
 return value;
}
function ensureFreshCandidate(previous,current) {
 assert.ok(Object.keys(current).some(key=>previous[key]!==current[key]),'SAME_CANDIDATE_ALREADY_DEPLOYED');
}
function reserveJson(file,value) {fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});}
if(process.argv.includes('--test-successor-guards')) {
 assert.ok(!live && !local && !successorId && !prepareId,'GUARD_TEST_NO_BROADCAST');
 for(const id of ['../escape','..','C:/escape','a/b','a\\b','','CON','nul','a'.repeat(65),'with space'])assert.throws(()=>successorDirectory(id));
 assert.equal(path.basename(successorDirectory('capital-20260929')),'capital-20260929');
 const fixture={chainId:97,testOnly:true,publicNetwork:true,verified:true,status:'DEPLOYED_CONFIG_VERIFIED',smoke:'PASS',admin:'0x'+'11'.repeat(20),addresses:{},codeHashes:{},sourceHashes:Object.fromEntries(['a','b','c','d'].map(key=>[key,sha256(key)])),receipts:[{status:'CONFIRMED',txHash:'0x'+'22'.repeat(32),block:1}]};
 for(const key of ['testToken','brainImplementation','brainProxy','positionEngine','orderTriggerEngine']){fixture.addresses[key]=fixture.admin;fixture.codeHashes[key]='0x'+'33'.repeat(32);}
 validatePredecessor(fixture);
 for(const changed of [{chainId:56},{testOnly:false},{verified:false},{publicNetwork:false},{smoke:'PENDING'},{receipts:[]},{receipts:[{...fixture.receipts[0],status:'SUBMITTED'}]}])assert.throws(()=>validatePredecessor({...fixture,...changed}));
 assert.throws(()=>ensureFreshCandidate(fixture.sourceHashes,{...fixture.sourceHashes}));ensureFreshCandidate(fixture.sourceHashes,{...fixture.sourceHashes,a:'changed'});
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'k11520-successor-guard-')),file=path.join(tmp,'deployment.json');
 try{reserveJson(file,fixture);assert.throws(()=>reserveJson(file,fixture));assert.deepEqual(JSON.parse(fs.readFileSync(file)),fixture);}finally{fs.unlinkSync(file);fs.rmdirSync(tmp);}
 console.log('SUCCESSOR_GUARDS_PASS; NO PROVIDER_OR_SIGNER_ACCESSED');process.exit(0);
}
const runId=successorId??prepareId;
const predecessorPath=path.resolve('artifacts/bsc97/deployment.json');
const predecessorBytes=runId?fs.readFileSync(predecessorPath):null;
const predecessor=runId?validatePredecessor(JSON.parse(predecessorBytes)):null;
const outDir = unsignedMode?'artifacts/mainnet-unsigned':runId?successorDirectory(runId):'artifacts/bsc97';
assert.ok(!runId || !fs.existsSync(`${outDir}/deployment.json`),'SUCCESSOR_RUN_ALREADY_RESERVED');
assert.ok(!prepareId || !fs.existsSync(`${outDir}/preparation.json`),'SUCCESSOR_ALREADY_PREPARED');
fs.mkdirSync(outDir, { recursive: true });
const contracts = ['KGEN_BrainExchange', 'KGEN_PositionEngine', 'KGEN_MarketRiskKernel', 'KGEN_OrderTriggerEngine'];
const sourcePaths = contracts.map(n => `KGEN/contracts/${n}.sol`);
const harnessPath = 'K11520TestnetAssets.sol';
// These organs have no custody/settlement logic. Not production oracles/token.
const harness = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
contract K11520TestToken is ERC20 {
 address public immutable owner = msg.sender;
 mapping(address=>bool) public claimed;
 constructor() ERC20("K11520 TEST ONLY NO REAL VALUE", "tKGEN") {require(block.chainid==97,"TESTNET_ONLY");}
 function mint(address to,uint256 amount) external {require(msg.sender==owner,"OWNER");_mint(to,amount);}
 function faucet() external {require(!claimed[msg.sender],"ALREADY_CLAIMED");claimed[msg.sender]=true;_mint(msg.sender,1000 ether);}
}
contract K11520TestProxy is ERC1967Proxy {
 constructor(address implementation,bytes memory data) ERC1967Proxy(implementation,data) {require(block.chainid==97,"TESTNET_ONLY");}
}
contract K11520TestOracle {
 address public immutable owner = msg.sender;
 string public constant description = "TEST_ORACLE MOCK USDT NO PRODUCTION PROVENANCE";
 uint8 public constant decimals=18;
 int256 public answer; uint256 public updatedAt; uint80 public roundId;
 constructor(int256 initial) {require(block.chainid==97,"TESTNET_ONLY");answer=initial;updatedAt=block.timestamp;roundId=1;}
 function set(int256 price,uint256 timestamp) external {require(msg.sender==owner,"OWNER");answer=price;updatedAt=timestamp;roundId++;}
 function latestRoundData() external view returns(uint80,int256,uint256,uint256,uint80){return(roundId,answer,updatedAt,updatedAt,roundId);}
}`;
// Git stores LF while a Windows checkout may use CRLF. Compile/hash the same
// canonical UTF-8 LF source on both hosts so metadata and bytecode reproduce.
const canonicalSource = content => content.replace(/\r\n/g, '\n');
const sources = Object.fromEntries(sourcePaths.map(p => [p, { content: canonicalSource(fs.readFileSync(p, 'utf8')) }]));
sources[harnessPath] = { content: canonicalSource(harness) };
const candidateAdapterPath='KGEN/contracts/KGEN_OracleSourceAdapter.sol';
// Preserve the exact historical chain97 compiler input/metadata. The adapter is
// an offline candidate artifact only; no address or constructor policy is chosen.
if(unsignedMode)sources[candidateAdapterPath]={content:canonicalSource(fs.readFileSync(candidateAdapterPath,'utf8'))};
const resolvedSources = { ...sources };
const settings = { optimizer: { enabled: true, runs: 200 }, evmVersion: 'paris', outputSelection: { '*': { '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode'] } } };
assert.ok(solc.version().startsWith('0.8.24+'), 'Pinned solc 0.8.24 required');
const compiled = JSON.parse(solc.compile(JSON.stringify({ language: 'Solidity', sources, settings }), { import: p => {
  const file = `node_modules/${p}`;
  if (!fs.existsSync(file)) return { error: 'Missing pinned import' };
  const contents = canonicalSource(fs.readFileSync(file, 'utf8'));
  resolvedSources[p] = { content: contents };
  return { contents };
} }));
assert.deepEqual((compiled.errors ?? []).filter(e => e.severity === 'error'), []);
function artifact(path, name) {
 const a = compiled.contracts[path][name];
 assert.equal(Object.keys(a.evm.bytecode.linkReferences).length, 0, 'Unexpected library linking');
 assert.ok(a.evm.deployedBytecode.object.length / 2 <= 24576, 'EIP170');
 return { abi:a.abi, bytecode:`0x${a.evm.bytecode.object}` };
}
const artifacts = {
 testToken: artifact(harnessPath,'K11520TestToken'),
 brainImplementation: artifact(sourcePaths[0],'KGEN_BrainExchange_V4_0_0'),
 brainProxy: artifact(harnessPath,'K11520TestProxy'),
 positionEngine: artifact(sourcePaths[1],'KGEN_PositionEngine_V1_0_0'),
 orderTriggerEngine: artifact(sourcePaths[3],'KGEN_OrderTriggerEngine'),
 oracle: artifact(harnessPath,'K11520TestOracle'),
};
const write = (name,value) => fs.writeFileSync(`${outDir}/${name}`, JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n');
const build={
 compiler:solc.version(),sourceEncoding:'UTF-8_LF',settings,artifacts,
 dependencies:Object.fromEntries(['@openzeppelin/contracts','@openzeppelin/contracts-upgradeable'].map(name=>[name,JSON.parse(fs.readFileSync(`node_modules/${name}/package.json`,'utf8')).version])),
 // Fully resolved standard JSON permits an offline compile with no import
 // callback, network dependency fetch, signer or secret-bearing environment.
 standardJsonInput:{language:'Solidity',sources:resolvedSources,settings},
 productionProxyTemplate:{policy:'BUILD_ONLY_NOT_AUTHORIZED',source:'@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol',...artifact('@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol','ERC1967Proxy')},
 sourceHashes:Object.fromEntries(Object.entries(sources).map(([p,s])=>[p,createHash('sha256').update(s.content).digest('hex')]))
};
if(unsignedMode)build.candidateOracleAdapter={policy:'BUILD_ONLY_NOT_DEPLOYED_NOT_PRODUCTION_READY',source:candidateAdapterPath,...artifact(candidateAdapterPath,'KGEN_OracleSourceAdapter')};

// Canonical JSON (sorted object keys, unchanged array order) is shared with the
// read-only review validator. No wallet, provider or environment is accessed.
function canonicalJson(value) {
 if(Array.isArray(value))return '['+value.map(canonicalJson).join(',')+']';
 if(value!==null && typeof value==='object')return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonicalJson(value[key])).join(',')+'}';
 return JSON.stringify(value);
}
function packageDigest(value){const {packageDigest:ignored,...body}=value;return 'sha256:'+sha256(canonicalJson(body));}
function shape(value,keys,label) {
 assert.ok(value && typeof value==='object' && !Array.isArray(value),'MISSING_'+label);
 const missing=keys.filter(key=>!Object.hasOwn(value,key));
 assert.equal(missing.length,0,'MISSING_'+label+'_FIELDS:'+missing.join(','));
 assert.deepEqual(Object.keys(value).sort(),keys.slice().sort(),'INVALID_FIELDS_'+label);
}
function uintString(value,label,{zero=false,max=(1n<<256n)-1n}={}) {
 assert.ok(typeof value==='string' && /^(0|[1-9][0-9]*)$/.test(value),'INVALID_'+label);
 const n=BigInt(value);assert.ok((zero || n>0n) && n<=max,'OUT_OF_RANGE_'+label);return n;
}
function address(value,label,zero=false){assert.ok(typeof value==='string' && /^0x[0-9a-fA-F]{40}$/.test(value),'INVALID_'+label);const a=getAddress(value);assert.ok(zero || a!==ZeroAddress,'ZERO_'+label);return a;}
function publicUrl(value){assert.ok(typeof value==='string','INVALID_PROVENANCE');const u=new URL(value);assert.ok(u.protocol==='https:' && !u.username && !u.password && !u.search && !u.hash,'NONPUBLIC_PROVENANCE');}
function validateUnsignedInput(input) {
 shape(input,['chainId','transactionRoute','sourceHashes','reviewedCommit','deployer','startingNonces','roles','token','funding','gas','markets','nextPayrollAt','cMax','lotsMax','settlementAuthority','positionExecutor'],'INPUT');
 assert.equal(input.chainId,56,'WRONG_CHAIN');
 assert.equal(input.transactionRoute,'DIRECT_EOA_UNSIGNED','CONTRACT_WALLET_ENVELOPE_REQUIRES_SEPARATE_REVIEW');
 assert.equal(input.cMax,100,'C_MAX');assert.equal(input.lotsMax,100,'LOTS_MAX');
 assert.equal(input.settlementAuthority,'POSITION_ENGINE_ONLY','SETTLEMENT_ROLE_FORBIDDEN');
 assert.equal(input.positionExecutor,'ORDER_TRIGGER_ENGINE_ONLY','EXECUTOR_ROLE_FORBIDDEN');
 assert.ok(/^[0-9a-f]{40}$/.test(input.reviewedCommit),'REVIEWED_COMMIT_REQUIRED');
 assert.deepEqual(input.sourceHashes,build.sourceHashes,'SOURCE_HASH_MISMATCH');
 const deployer=address(input.deployer,'DEPLOYER');
 shape(input.roles,['brainAdmin','positionAdmin','triggerAdmin','upgradeAuthority','pauser','triggerKeeper','brainKeeper','treasury'],'ROLES');
 for(const [key,value]of Object.entries(input.roles))address(value,key,key==='brainKeeper');
 assert.equal(input.roles.triggerAdmin.toLowerCase(),deployer.toLowerCase(),'TRIGGER_ADMIN_IS_DEPLOYER_IMMUTABLE');
 shape(input.token,['address','chainId','decimals','testOnly','codeHash','provenance'],'TOKEN');
 address(input.token.address,'TOKEN');assert.equal(input.token.chainId,56,'TOKEN_WRONG_CHAIN');assert.equal(input.token.decimals,18,'TOKEN_DECIMALS');assert.equal(input.token.testOnly,false,'MOCK_TOKEN_FORBIDDEN');
 assert.ok(/^0x[0-9a-f]{64}$/i.test(input.token.codeHash) && input.token.codeHash!==ZeroHash,'TOKEN_CODEHASH_REQUIRED');publicUrl(input.token.provenance);
 shape(input.funding,['account','settlementCapitalWei','insuranceWei','totalKgenWei'],'FUNDING');address(input.funding.account,'FUNDER');
 const capital=uintString(input.funding.settlementCapitalWei,'CAPITAL'),insurance=uintString(input.funding.insuranceWei,'INSURANCE',{zero:true});
 assert.equal(uintString(input.funding.totalKgenWei,'FUNDING_TOTAL'),capital+insurance,'FUNDING_ALLOCATION_MISMATCH');
 shape(input.gas,['maximumGasPriceWei','totalGasCostCapWei','nativeValuePerTransactionWei','gasLimits'],'GAS');assert.equal(input.gas.nativeValuePerTransactionWei,'0','NATIVE_VALUE_FORBIDDEN');
 uintString(input.gas.maximumGasPriceWei,'GAS_PRICE');uintString(input.gas.totalGasCostCapWei,'TOTAL_GAS_CAP');
 shape(input.gas.gasLimits,['deployment','configuration','funding','approval'],'GAS_LIMITS');for(const value of Object.values(input.gas.gasLimits))uintString(value,'GAS_LIMIT',{max:100000000n});
 uintString(input.nextPayrollAt,'PAYROLL_TIMESTAMP',{zero:true});
 assert.ok(input.startingNonces && typeof input.startingNonces==='object' && !Array.isArray(input.startingNonces),'NONCES_REQUIRED');
 const senders=[deployer,input.roles.brainAdmin,input.roles.positionAdmin,input.roles.pauser,input.funding.account].map(a=>a.toLowerCase());
 assert.deepEqual(Object.keys(input.startingNonces).sort(),[...new Set(senders)].sort(),'EXACT_SENDER_NONCES_REQUIRED');
 for(const [key,nonce]of Object.entries(input.startingNonces)){address(key,'NONCE_ACCOUNT');assert.ok(Number.isSafeInteger(nonce) && nonce>=0 && nonce<Number.MAX_SAFE_INTEGER-100,'INVALID_STARTING_NONCE');}
 assert.ok(Array.isArray(input.markets) && input.markets.length===3,'THREE_MARKETS_REQUIRED');
 input.markets.forEach((market,index)=>{
  shape(market,['axis','symbol','initialMarginBps','maintenanceMarginBps','maxOracleAge','minPriceWad','maxPriceWad','minValidSources','maxDeviationBps','feeds','tradingCapability'],'MARKET');
  assert.equal(market.axis,['KX','KY','KZ'][index],'MARKET_AXIS');assert.equal(market.symbol,['BTC/USD INDEX','ETH/USD INDEX','BNB/USD INDEX'][index],'EXPLICIT_USD_SETTLEMENT_INDEX_REQUIRED');
  assert.ok(Number.isInteger(market.initialMarginBps) && market.initialMarginBps===100,'100C_REQUIRES_INITIAL_MARGIN_100BPS');
  assert.ok(Number.isInteger(market.maintenanceMarginBps) && market.maintenanceMarginBps>0 && market.maintenanceMarginBps<market.initialMarginBps,'MAINTENANCE_MARGIN');
  assert.ok(Number.isInteger(market.maxOracleAge) && market.maxOracleAge>0 && market.maxOracleAge<=4294967295,'ORACLE_MAX_AGE');
  const capability=market.tradingCapability;
  shape(capability,['maxCWad','validUntil','maxAge','maxTimeSkew','maxSpreadWad','evidenceHash'],'TRADING_CAPABILITY');
  const maxC=uintString(capability.maxCWad,'CAPABILITY_C',{zero:true,max:100n*10n**18n});
  uintString(capability.validUntil,'CAPABILITY_EXPIRY',{zero:maxC===0n,max:(1n<<64n)-1n});
  uintString(capability.maxSpreadWad,'CAPABILITY_SPREAD',{zero:true,max:10n**36n});
  assert.ok(Number.isInteger(capability.maxAge) && capability.maxAge>=0 && capability.maxAge<=market.maxOracleAge,'CAPABILITY_AGE');
  assert.ok(Number.isInteger(capability.maxTimeSkew) && capability.maxTimeSkew>=0 && capability.maxTimeSkew<=4294967295,'CAPABILITY_SKEW');
  assert.ok(/^0x[0-9a-f]{64}$/i.test(capability.evidenceHash),'CAPABILITY_EVIDENCE_HASH');
  if(maxC>0n){
   assert.ok([10n**15n,10n**16n,10n**17n,10n**18n].includes(maxC) || (maxC>=5n*10n**18n && maxC%(5n*10n**18n)===0n),'CAPABILITY_CANONICAL_C');
   assert.ok(capability.maxAge>0 && capability.evidenceHash!==ZeroHash,'CAPABILITY_EVIDENCE_REQUIRED');
  }
  assert.ok(uintString(market.minPriceWad,'MIN_PRICE')<uintString(market.maxPriceWad,'MAX_PRICE',{max:10n**36n}),'PRICE_BOUNDS');
  assert.equal(market.minValidSources,2,'TWO_OF_THREE_QUORUM');
  assert.ok(Number.isInteger(market.maxDeviationBps) && market.maxDeviationBps>0 && market.maxDeviationBps<=2000,'MAX_DEVIATION');
  assert.ok(Array.isArray(market.feeds) && market.feeds.length===3,'THREE_FEEDS_REQUIRED');
  for(const feed of market.feeds){
   shape(feed,['address','provider','independenceGroup','chainId','quote','decimals','testOnly','codeHash','roundMode','provenance'],'FEED');
   address(feed.address,'FEED');assert.equal(feed.chainId,56,'FEED_WRONG_CHAIN');assert.equal(feed.quote,'USD','NO_IMPLICIT_USD_USDT_CONVERSION');assert.equal(feed.testOnly,false,'MOCK_FEED_FORBIDDEN');
   for(const key of ['provider','independenceGroup'])assert.ok(typeof feed[key]==='string' && /^[a-zA-Z][a-zA-Z0-9 _.-]{1,79}$/.test(feed[key]) && !/mock|test|simulation/i.test(feed[key]),'INVALID_PROVIDER');
   assert.ok(Number.isInteger(feed.decimals) && feed.decimals>=0 && feed.decimals<=18,'FEED_DECIMALS');
   assert.ok(/^0x[0-9a-f]{64}$/i.test(feed.codeHash) && feed.codeHash!==ZeroHash,'FEED_CODEHASH_REQUIRED');
   assert.ok(['MONOTONIC_COMPLETE_ROUNDS','REVIEWED_TIMESTAMP_ADAPTER','REVIEWED_PYTH_ADAPTER'].includes(feed.roundMode),'UNSUPPORTED_ROUND_MODE');publicUrl(feed.provenance);
  }
  for(const key of ['address','provider','independenceGroup'])assert.equal(new Set(market.feeds.map(feed=>feed[key].toLowerCase())).size,3,'NONINDEPENDENT_FEEDS');
 });
}
async function buildUnsignedPackage(input) {
 const result={documentType:'K11520_MAINNET_UNSIGNED_EXECUTION_PACKAGE',schemaVersion:1,chainId:56,mode:'BUILD_ONLY',broadcast:false,executionAuthorized:false,status:'BLOCKED_MISSING_OR_INVALID_INPUT',blockers:[],input:null,sourceHashes:build.sourceHashes,compiler:build.compiler,artifactDigests:{},predictedAddresses:{},transactions:[],deploymentReadbacks:'NOT_PERFORMED',preExecutionRequirements:['HUMAN_EXACT_MANIFEST_APPROVAL_REQUIRED','EXACT_HEAD_CI_AND_SOURCE_REVIEW_REQUIRED','ALL_TRANSACTION_SENDERS_EOA_CODE_AND_PENDING_NONCES_READBACK_REQUIRED','FRESH_CHAIN56_CODE_ROLE_NONCE_AND_TOKEN_TAX_READBACKS_REQUIRED','FRESH_GAS_ESTIMATES_WITHIN_EXPLICIT_LIMITS_AND_CAPS_REQUIRED','FRESH_ORACLE_PROVENANCE_INDEPENDENCE_QUOTE_ROUND_AND_FRESHNESS_READBACKS_REQUIRED','ACTUAL_RECEIVED_CAPITAL_AND_INSURANCE_READBACKS_REQUIRED','SEPARATE_LIVE_ACTIVATION_APPROVAL_REQUIRED']};
 try {
  validateUnsignedInput(input);result.input=structuredClone(input);
  const keys=['brainImplementation','brainProxy','positionEngine','orderTriggerEngine'];
  const productionArtifacts={...artifacts,brainProxy:build.productionProxyTemplate};
  for(const key of keys)result.artifactDigests[key]=keccak256(productionArtifacts[key].bytecode);
  const nonces={...input.startingNonces},deployer=address(input.deployer,'DEPLOYER'),start=nonces[deployer.toLowerCase()];
  keys.forEach((key,index)=>result.predictedAddresses[key]=getCreateAddress({from:deployer,nonce:start+index}));
  const predicted=result.predictedAddresses,roles=input.roles;
  // Predict Trigger up front: Position never temporarily trusts an EOA executor.
  const init=new Interface(artifacts.brainImplementation.abi).encodeFunctionData('initialize',[input.token.address,roles.brainAdmin,roles.brainKeeper,roles.pauser,roles.upgradeAuthority,roles.treasury,input.nextPayrollAt]);
  const constructors=[[],[predicted.brainImplementation,init],[roles.positionAdmin,predicted.orderTriggerEngine,predicted.brainProxy],[predicted.positionEngine,roles.triggerKeeper]];
  const add=(txId,from,to,data,category,method,expectedState)=>{
   const normalized=address(from,'SENDER'),nonce=nonces[normalized.toLowerCase()]++;
   result.transactions.push({id:txId,from:normalized,nonce,type:0,chainId:56,to,data,value:'0',gasLimit:input.gas.gasLimits[category],gasPrice:input.gas.maximumGasPriceWei,method,expectedState,calldataKeccak256:keccak256(data)});
  };
  for(let i=0;i<keys.length;i++){
   const key=keys[i],a=productionArtifacts[key];
   const tx=await new ContractFactory(a.abi,a.bytecode).getDeployTransaction(...constructors[i]);
   add('DEPLOY_'+key,deployer,null,tx.data,'deployment','constructor',{createdAddress:predicted[key],initCodeKeccak256:keccak256(tx.data)});
  }
  const call=(txId,from,key,method,args,category='configuration',expectedState={})=>add(txId,from,predicted[key],new Interface(artifacts[key==='brainProxy'?'brainImplementation':key].abi).encodeFunctionData(method,args),category,method,expectedState);
  call('PAUSE_BRAIN',roles.pauser,'brainProxy','pause',[],undefined,{paused:true});
  call('PAUSE_POSITION',roles.positionAdmin,'positionEngine','setPaused',[true],undefined,{paused:true});
  call('PAUSE_TRIGGER',roles.triggerAdmin,'orderTriggerEngine','setPaused',[true],undefined,{paused:true});
  call('SET_EXECUTOR_TRIGGER',roles.positionAdmin,'positionEngine','setExecutor',[predicted.orderTriggerEngine],undefined,{executor:predicted.orderTriggerEngine});
  call('GRANT_SETTLEMENT_POSITION_ONLY',roles.brainAdmin,'brainProxy','grantRole',[id('SETTLEMENT_ROLE'),predicted.positionEngine],undefined,{settlementAuthority:predicted.positionEngine});
  for(let index=0;index<3;index++){
   const market=input.markets[index];
   call('CONFIGURE_'+market.axis,roles.positionAdmin,'positionEngine','configureMarket',[index,market.initialMarginBps,market.maintenanceMarginBps,market.maxOracleAge,market.minPriceWad,market.maxPriceWad,false],undefined,{market:market.axis,enabled:false});
   call('ORACLES_'+market.axis,roles.positionAdmin,'positionEngine','configureOracle',[index,market.feeds.map(f=>f.address),market.minValidSources,market.maxDeviationBps],undefined,{market:market.axis,feedAddresses:market.feeds.map(f=>f.address),quorum:2});
   call('CAPABILITY_'+market.axis,roles.positionAdmin,'positionEngine','configureTradingCapability',[index,market.tradingCapability],undefined,{market:market.axis,capability:market.tradingCapability,newRiskEnabled:false});
  }
  const approve=new Interface(['function approve(address,uint256) returns(bool)']);
  const approval=(txId,amount)=>add(txId,input.funding.account,input.token.address,approve.encodeFunctionData('approve',[predicted.brainProxy,amount]),'approval','approve',{spender:predicted.brainProxy,allowance:amount});
  approval('RESET_EXISTING_ALLOWANCE','0');approval('APPROVE_EXACT_FUNDING',input.funding.totalKgenWei);
  call('FUND_SETTLEMENT_CAPITAL',input.funding.account,'brainProxy','fundSettlementCapital',[input.funding.settlementCapitalWei],'funding',{requested:input.funding.settlementCapitalWei,credited:'ACTUAL_TOKEN_BALANCE_DELTA_ONLY'});
  if(BigInt(input.funding.insuranceWei)>0n)call('FUND_INSURANCE',input.funding.account,'brainProxy','fundInsurance',[input.funding.insuranceWei],'funding',{requested:input.funding.insuranceWei,credited:'ACTUAL_TOKEN_BALANCE_DELTA_ONLY'});
  approval('REVOKE_REMAINING_ALLOWANCE','0');
  const cap=result.transactions.reduce((sum,tx)=>sum+BigInt(tx.gasLimit)*BigInt(tx.gasPrice),0n);
  assert.ok(cap<=BigInt(input.gas.totalGasCostCapWei),'TOTAL_GAS_CAP_EXCEEDED');
  result.maximumGasCostWei=cap.toString();result.status='UNSIGNED_REQUIRES_HUMAN_APPROVAL';
 }catch(error){
  // Never echo arbitrary input, paths, credential values or raw decoder errors.
  const reason=error.code==='ERR_ASSERTION'?String(error.message).split('\n')[0]:'INVALID_PUBLIC_INPUT';
  result.blockers=[reason];result.input=null;result.predictedAddresses={};result.transactions=[];
 }
 result.packageDigest=packageDigest(result);return result;
}
if(unsignedMode) {
 if(unsignedTest){
  const a=n=>'0x'+n.toString(16).padStart(40,'0'),deployer=a(1),fixture={chainId:56,sourceHashes:build.sourceHashes,reviewedCommit:'1'.repeat(40),deployer,startingNonces:{[deployer]:7,[a(2)]:10,[a(3)]:20},roles:{brainAdmin:a(2),positionAdmin:a(2),triggerAdmin:deployer,upgradeAuthority:a(4),pauser:a(2),triggerKeeper:a(5),brainKeeper:ZeroAddress,treasury:a(6)},token:{address:a(7),chainId:56,decimals:18,testOnly:false,codeHash:'0x'+'11'.repeat(32),provenance:'https://example.invalid/synthetic-fixture-not-production'},funding:{account:a(3),settlementCapitalWei:parseEther('1000').toString(),insuranceWei:parseEther('10').toString(),totalKgenWei:parseEther('1010').toString()},gas:{maximumGasPriceWei:'1000000000',totalGasCostCapWei:'1000000000000000000',nativeValuePerTransactionWei:'0',gasLimits:{deployment:'7000000',configuration:'500000',funding:'500000',approval:'100000'}},nextPayrollAt:'0',cMax:100,lotsMax:100,settlementAuthority:'POSITION_ENGINE_ONLY',positionExecutor:'ORDER_TRIGGER_ENGINE_ONLY',markets:['KX','KY','KZ'].map((axis,index)=>({axis,symbol:['BTC/USDT','ETH/USDT','BNB/USDT'][index],initialMarginBps:100,maintenanceMarginBps:10,maxOracleAge:60,minPriceWad:parseEther('1').toString(),maxPriceWad:parseEther('200000').toString(),minValidSources:2,maxDeviationBps:100,feeds:[0,1,2].map(n=>({address:a(100+index*3+n),provider:'Provider'+n,independenceGroup:'Independent'+n,chainId:56,quote:'USDT',decimals:8,testOnly:false,codeHash:'0x'+'22'.repeat(32),roundMode:'MONOTONIC_COMPLETE_ROUNDS',provenance:'https://example.invalid/synthetic-fixture-not-production'}))}))};
  fixture.transactionRoute='DIRECT_EOA_UNSIGNED';
  fixture.markets.forEach((market,index)=>{market.symbol=['BTC/USD INDEX','ETH/USD INDEX','BNB/USD INDEX'][index];market.feeds.forEach(feed=>feed.quote='USD');market.tradingCapability={maxCWad:'0',validUntil:'0',maxAge:0,maxTimeSkew:0,maxSpreadWad:'0',evidenceHash:ZeroHash};});
  const packageValue=await buildUnsignedPackage(fixture);assert.equal(packageValue.status,'UNSIGNED_REQUIRES_HUMAN_APPROVAL',packageValue.blockers.join(','));
  assert.equal(packageValue.transactions.length,23);assert.equal(packageDigest(packageValue),packageValue.packageDigest);
  assert.deepEqual(await buildUnsignedPackage(fixture),packageValue,'DETERMINISTIC_PACKAGE');
  assert.notEqual(packageValue.artifactDigests.brainProxy,keccak256(artifacts.brainProxy.bytecode),'NEVER_TEST_PROXY');
  for(let index=0;index<4;index++)assert.equal(packageValue.transactions[index].expectedState.createdAddress,getCreateAddress({from:deployer,nonce:7+index}));
  const seen={...fixture.startingNonces};for(const tx of packageValue.transactions){assert.equal(tx.nonce,seen[tx.from.toLowerCase()]++);assert.equal(tx.value,'0');assert.equal(tx.calldataKeccak256,keccak256(tx.data));}
  const constructorTx=await new ContractFactory(build.productionProxyTemplate.abi,build.productionProxyTemplate.bytecode).getDeployTransaction(packageValue.predictedAddresses.brainImplementation,new Interface(artifacts.brainImplementation.abi).encodeFunctionData('initialize',[fixture.token.address,fixture.roles.brainAdmin,ZeroAddress,fixture.roles.pauser,fixture.roles.upgradeAuthority,fixture.roles.treasury,0]));
  assert.equal(constructorTx.data,packageValue.transactions[1].data,'ATOMIC_PROXY_INITIALIZATION');
  const tampered=structuredClone(packageValue);tampered.transactions[0].data+='00';assert.notEqual(packageDigest(tampered),packageValue.packageDigest);
  for(const change of [v=>v.chainId=97,v=>v.token.testOnly=true,v=>v.roles.triggerAdmin=a(2),v=>v.settlementAuthority=a(1),v=>v.gas.totalGasCostCapWei='1',v=>v.gas.nativeValuePerTransactionWei='1',v=>v.funding.totalKgenWei='1',v=>v.markets[0].feeds[0].testOnly=true,v=>v.markets[0].feeds[0].quote='USDT',v=>v.markets[0].feeds[0].roundMode='CONSTANT_ROUND',v=>v.markets[0].feeds[1].independenceGroup='Independent0',v=>delete v.markets[0].tradingCapability,v=>v.markets[0].tradingCapability.maxCWad=parseEther('1000').toString(),v=>v.sourceHashes={},v=>delete v.startingNonces[a(3)],v=>v.cMax=1000,v=>v.token.provenance='https://user:secret@example.invalid/',v=>v.privateKey='NOT_A_SECRET_SYNTHETIC_REJECTION_TEST']){
   const bad=structuredClone(fixture);change(bad);const output=await buildUnsignedPackage(bad);assert.equal(output.status,'BLOCKED_MISSING_OR_INVALID_INPUT');assert.equal(output.transactions.length,0);assert.equal(output.input,null);
  }
  const missing=await buildUnsignedPackage({});assert.equal(missing.status,'BLOCKED_MISSING_OR_INVALID_INPUT');
  write('synthetic-test-package.json',{...packageValue,syntheticFixture:true,packageDigest:packageDigest({...packageValue,syntheticFixture:true})});write('build.json',build);
  console.log('MAINNET_UNSIGNED_PACKAGE_TEST_PASS; SYNTHETIC_ONLY; NO_PROVIDER_SIGNER_OR_BROADCAST');
 }else{
  let input;try{const raw=fs.readFileSync(unsignedInput,'utf8');assert.ok(raw.length<1000000);input=JSON.parse(raw);}catch{input=null;}
  const packageValue=await buildUnsignedPackage(input);write('execution-package.json',packageValue);write('build.json',build);
  console.log(`${packageValue.status}; NO_PROVIDER_SIGNER_OR_BROADCAST`);
 }
 process.exit(0);
}
if(runId) {
 ensureFreshCandidate(predecessor.sourceHashes,build.sourceHashes);
 const fingerprint=sha256(JSON.stringify(Object.fromEntries(Object.entries(build.sourceHashes).sort(([a],[b])=>a.localeCompare(b)))));
 const predecessorHash=sha256(predecessorBytes),preparationPath=`${outDir}/preparation.json`,snapshotPath=`${outDir}/predecessor.json`;
 if(fs.existsSync(preparationPath)) {
  const prepared=JSON.parse(fs.readFileSync(preparationPath));
  assert.ok(successorId && prepared.runId===runId && prepared.status==='PREPARED_NO_BROADCAST' && prepared.candidateFingerprint===fingerprint && prepared.predecessorSha256===predecessorHash,'PREPARED_CANDIDATE_CHANGED');
  assert.equal(sha256(fs.readFileSync(snapshotPath)),predecessorHash,'PREDECESSOR_SNAPSHOT_CHANGED');
  assert.equal(JSON.parse(fs.readFileSync(path.join(path.dirname(outDir),`candidate-${fingerprint}.json`))).runId,runId,'CANDIDATE_RESERVATION_CHANGED');
 } else {
  const root=path.dirname(path.resolve(outDir));
  for(const entry of fs.readdirSync(root,{withFileTypes:true}).filter(e=>e.isDirectory() && e.name!==runId)) {
   const other=path.join(root,entry.name,'preparation.json');
   if(fs.existsSync(other))assert.notEqual(JSON.parse(fs.readFileSync(other)).candidateFingerprint,fingerprint,'CANDIDATE_ALREADY_PREPARED_OR_DEPLOYED');
  }
  assert.ok(!fs.existsSync(snapshotPath),'INCOMPLETE_SUCCESSOR_PREPARATION');
  // Atomic cross-run reservation also prevents two different run IDs from
  // racing the directory scan and deploying the same source candidate twice.
  reserveJson(path.join(root,`candidate-${fingerprint}.json`),{runId,candidateFingerprint:fingerprint,predecessorSha256:predecessorHash});
  fs.writeFileSync(snapshotPath,predecessorBytes,{flag:'wx'});
  reserveJson(preparationPath,{runId,status:'PREPARED_NO_BROADCAST',chainId:97,testOnly:true,candidateFingerprint:fingerprint,sourceHashes:build.sourceHashes,predecessorSha256:predecessorHash,predecessorPath,strategy:'NEW_STACK_NO_OLD_CONTRACT_WRITES'});
 }
}
write('build.json',build);
if (!live && !local) { console.log(prepareId?'SUCCESSOR_PREPARED; NO PROVIDER_SIGNER_OR_BROADCAST':'PACKAGE_COMPILED; NO BROADCAST'); process.exit(0); }
assert.notEqual(live,local,'Choose one execution target');
if(live && fs.existsSync(`${outDir}/deployment.json`)) {
 console.error('EXISTING_DEPLOYMENT_REQUIRES_RECONCILIATION');process.exit(1);
}
let provider, signer, localRpc;
if(local) {
 const {default:ganache}=await import('ganache');
 localRpc=ganache.provider({chain:{chainId:97},wallet:{totalAccounts:2},miner:{timestampIncrement:1,defaultGasPrice:100000000},logging:{quiet:true}});
 provider=new BrowserProvider(localRpc); provider.pollingInterval=20; signer=await provider.getSigner();
} else {
 assert.ok(process.env.BSC_TESTNET_RPC_URL && process.env.BSC_TESTNET_PRIVATE_KEY,'SIGNER_BLOCKED');
 provider=new JsonRpcProvider(process.env.BSC_TESTNET_RPC_URL);provider.pollingInterval=1000;
 signer=new Wallet(process.env.BSC_TESTNET_PRIVATE_KEY,provider);
}
const admin=await signer.getAddress();
const budget=parseEther('0.05');
try {
 assert.equal((await provider.getNetwork()).chainId,97n,'WRONG_CHAIN_NO_BROADCAST');
 assert.ok(await provider.getBalance(admin)>=budget,'INSUFFICIENT_TEST_BNB_BUDGET');
 if(predecessor) {
  assert.equal(admin.toLowerCase(),predecessor.admin.toLowerCase(),'SUCCESSOR_ADMIN_CHANGED');
  assert.equal(await provider.getTransactionCount(admin,'pending'),await provider.getTransactionCount(admin,'latest'),'PENDING_SIGNER_TRANSACTION');
  const hashes={...predecessor.runtimeCodeHashesByAddress};
  for(const [key,address]of Object.entries(predecessor.addresses))hashes[address]=predecessor.codeHashes[key];
  for(const [address,hash]of Object.entries(hashes))assert.equal(keccak256(await provider.getCode(address)),hash,'PREDECESSOR_CODE_CHANGED');
  const oldBrain=new Contract(predecessor.addresses.brainProxy,artifacts.brainImplementation.abi,provider);
  assert.equal(await oldBrain.hasRole(ZeroHash,admin),true,'PREDECESSOR_ADMIN_ROLE_CHANGED');
  const oldPosition=new Contract(predecessor.addresses.positionEngine,artifacts.positionEngine.abi,provider);
  const oldTrigger=new Contract(predecessor.addresses.orderTriggerEngine,artifacts.orderTriggerEngine.abi,provider);
  assert.equal((await oldPosition.admin()).toLowerCase(),admin.toLowerCase(),'PREDECESSOR_POSITION_ADMIN_CHANGED');
  assert.equal((await oldPosition.executor()).toLowerCase(),predecessor.addresses.orderTriggerEngine.toLowerCase(),'PREDECESSOR_EXECUTOR_CHANGED');
  assert.equal((await oldTrigger.admin()).toLowerCase(),admin.toLowerCase(),'PREDECESSOR_TRIGGER_ADMIN_CHANGED');
  const slot='0x'+(BigInt(keccak256(new TextEncoder().encode('eip1967.proxy.implementation')))-1n).toString(16);
  assert.equal((await provider.getStorage(predecessor.addresses.brainProxy,slot)).slice(-40).toLowerCase(),predecessor.addresses.brainImplementation.slice(2).toLowerCase(),'PREDECESSOR_PROXY_CHANGED');
  for(let i=0;i<predecessor.receipts.length;i+=4)await Promise.all(predecessor.receipts.slice(i,i+4).map(async recorded=>{
   const receipt=await provider.getTransactionReceipt(recorded.txHash);
   assert.ok(receipt?.status===1 && receipt.blockNumber===recorded.block,'PREDECESSOR_RECEIPT_NOT_CONFIRMED');
  }));
  // Re-check the immutable local predecessor immediately before reserving this run.
  assert.equal(sha256(fs.readFileSync(predecessorPath)),sha256(predecessorBytes),'PREDECESSOR_FILE_CHANGED');
 }
}catch(error){console.error(`DEPLOYMENT_PREFLIGHT_BLOCKED: ${error.code==='ERR_ASSERTION'?error.message.split('\n')[0]:(error.code??error.name)}`);await localRpc?.disconnect();provider.destroy();process.exit(1);}
const manifest={documentType:'K11520_BSC_TESTNET_DEPLOYMENT_MANIFEST',mode:'BSC_TESTNET',chainId:97,testOnly:true,verified:false,status:'DEPLOYING',publicNetwork:live,admin,upgradeAuthority:admin,pauser:admin,keeper:admin,settlementAuthority:null,addresses:{},codeHashes:{},oracles:[],oracleMode:'TEST_ORACLE_MOCK',productionOracleReady:false,cMax:100,lotsMax:100,initialMarginBps:100,maintenanceMarginBps:10,oracleMaxAge:3600,oracleMaxDeviationBps:500,gasBudgetTestBnb:'0.05',maximumGasPriceGwei:10,rolePolicy:'Single test operator admin/upgrader/pauser/keeper; not production design. Settlement only Position, executor only Trigger. No EOA settlement role.',receipts:[],checks:{},sourceHashes:JSON.parse(fs.readFileSync(`${outDir}/build.json`)).sourceHashes};
let spent=0n;
manifest.triggerKeeper=admin;
manifest.brainKeeper=ZeroAddress;
manifest.runtimeCodeHashesByAddress={};
manifest.brainKeeperPolicy='No Brain payroll/heart keeper authority is needed or granted for this rehearsal.';
manifest.accountingModel='ISOLATED_SETTLEMENT_CAPITAL_V1';
manifest.pnlModel='INDEX_DELTA_C_LOTS_V1';
manifest.marginPerLotKgen=1;
manifest.capabilities={settlementCapital:'ISOLATED_V1',reservedSettlementLiability:true,playerClaimable:true,withdraw:true};
if(predecessor)manifest.successor={runId,strategy:'NEW_STACK_NO_OLD_CONTRACT_WRITES',predecessorSha256:sha256(predecessorBytes),predecessorSnapshot:predecessor,readbacks:'CHAIN_CODE_ADMIN_PROXY_AND_ALL_RECEIPTS_VERIFIED'};
// Atomic reservation precedes the first broadcast. A second process cannot
// overwrite receipts or deploy another stack after racing an existsSync check.
if(live) {
 try {fs.writeFileSync(`${outDir}/deployment.json`,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});}
 catch {console.error('DEPLOYMENT_RESERVATION_BLOCKED');provider.destroy();process.exit(1);}
}
const persist=()=>write(live?'deployment.json':'local-rehearsal.json',manifest);
async function feeGuard(gas) {
 assert.equal(BigInt(await provider.send('eth_chainId',[])),97n);
 let gasPrice=(await provider.getFeeData()).gasPrice;
 // Ganache starts with a London base fee above its configured .1gwei quote.
 // Local-only fee correction avoids mistaking that harness condition for a
 // deployment failure; the public-network quote/caps remain unchanged.
 if(local){const base=(await provider.getBlock('latest')).baseFeePerGas??0n;if(gasPrice<base*2n)gasPrice=base*2n;}
 assert.ok(gasPrice && gasPrice<=10000000000n,'GAS_PRICE_CAP');
 assert.ok(spent+gas*gasPrice<=budget,'TOTAL_GAS_BUDGET');
 return {gasLimit:gas,gasPrice,value:0n};
}
async function record(label,tx,contract,method) {
 // Persist submitted hash before waiting; interrupted runs must be reconciled, never blindly redeployed.
 const item={label,txHash:tx.hash,contract,method,status:'SUBMITTED'};manifest.receipts.push(item);persist();
 const r=await tx.wait(1,120000);assert.ok(r && r.status===1,'TX_NOT_CONFIRMED');
 const b=await provider.getBlock(r.blockNumber);
 Object.assign(item,{block:r.blockNumber,timestamp:b.timestamp,status:'CONFIRMED',gasUsed:r.gasUsed.toString(),gasPrice:r.gasPrice.toString()});
 spent+=r.gasUsed*r.gasPrice;manifest.gasSpentTestBnb=formatEther(spent);persist();
 console.log(`${label}: ${tx.hash}`);return r;
}
async function deploy(key,args=[]) {
 const factory=new ContractFactory(artifacts[key].abi,artifacts[key].bytecode,signer);
 const request=await factory.getDeployTransaction(...args);
 const gas=(await signer.estimateGas(request))*12n/10n;
 const c=await factory.deploy(...args,await feeGuard(gas));
 const r=await record(`DEPLOY_${key}`,c.deploymentTransaction(),c.target,'constructor');
 manifest.addresses[key]=c.target;manifest.codeHashes[key]=keccak256(await provider.getCode(c.target));
 manifest.runtimeCodeHashesByAddress[c.target]=manifest.codeHashes[key];
 manifest.deploymentBlock??=r.blockNumber;persist();return c;
}
async function send(c,method,args=[],label=method) {
 const gas=(await c[method].estimateGas(...args))*13n/10n;
 return record(label,await c[method](...args,await feeGuard(gas)),c.target,method);
}
async function mustRevert(call,label) {
 const errors={DUPLICATE_FILL:'InvalidOrder()',LIQUIDATION_REPLAY:'PositionNotOpen()',ORACLE_STALE:'OracleQuorumUnavailable()'};
 const expected=keccak256(new TextEncoder().encode(errors[label])).slice(0,10);
 let rejected=false;try{await call();}catch(error){
   if(error.code!=='CALL_EXCEPTION'||typeof error.data!=='string'||!error.data.startsWith(expected))throw error;
   rejected=true;
 }assert.ok(rejected,label);manifest.checks[label]='PASS';persist();
}
try {
 // Never replay an incomplete/successful public deployment implicitly.
 persist();
 const token=await deploy('testToken');
 const impl=await deploy('brainImplementation');
 const init=new Interface(artifacts.brainImplementation.abi).encodeFunctionData('initialize',[token.target,admin,ZeroAddress,admin,admin,admin,0]);
 const proxy=await deploy('brainProxy',[impl.target,init]);
 const brain=new Contract(proxy.target,artifacts.brainImplementation.abi,signer);
 const position=await deploy('positionEngine',[admin,proxy.target,proxy.target]);
 const trigger=await deploy('orderTriggerEngine',[position.target,admin]);
 await send(position,'setExecutor',[trigger.target]);
 const role=await brain.SETTLEMENT_ROLE();
 await send(brain,'grantRole',[role,position.target],'SETTLEMENT_ROLE_POSITION_ONLY');
 manifest.settlementAuthority=position.target;
 const feedSets=[];
 for(let market=0;market<3;market++) {
   const price=parseEther(['100000','4000','600'][market]);
   const feeds=[];
   for(let i=0;i<3;i++) feeds.push(await deploy('oracle',[price]));
   feedSets.push(feeds);manifest.oracles.push({axis:['KX','KY','KZ'][market],market:['BTC/USDT','ETH/USDT','BNB/USDT'][market],feeds:feeds.map(f=>f.target),provider:'ONE TEST OPERATOR; NOT INDEPENDENT',decimals:18});persist();
   await send(position,'configureMarket',[market,100,10,3600,parseEther('0.01'),parseEther('1000000'),true]);
   await send(position,'configureOracle',[market,feeds.map(f=>f.target),2,500]);
   // Testnet mock capability only. Never production provenance/readiness.
   await send(position,'configureTradingCapability',[market,[parseEther('100'),(await provider.getBlock('latest')).timestamp+86400,3600,3600,parseEther('1000000'),id('TEST_ONLY_MOCK_ORACLE_CAPABILITY')]]);
 }
 assert.equal(await position.executor(),trigger.target);
 assert.equal(await brain.hasRole(role,position.target),true);
 assert.equal(await brain.hasRole(role,admin),false);
 assert.equal(await brain.hasRole(role,trigger.target),false);
 assert.equal(await brain.hasRole(await brain.UPGRADE_ROLE(),admin),true);
 assert.equal(await brain.hasRole(await brain.PAUSER_ROLE(),admin),true);
 assert.equal(await brain.hasRole(ZeroHash,admin),true);
 assert.equal(await brain.kgen(),token.target);
 // Correct EIP1967 slot computed rather than trusting address labels.
 const actualSlot='0x'+(BigInt(keccak256(new TextEncoder().encode('eip1967.proxy.implementation')))-1n).toString(16);
 assert.equal((await provider.getStorage(proxy.target,actualSlot)).slice(-40).toLowerCase(),impl.target.slice(2).toLowerCase());
 manifest.checks.CONFIG='PASS';manifest.status='DEPLOYED_CONFIG_VERIFIED';manifest.verified=true;persist();
 // Actual minted TEST token funding, segregated from the player's 1000 margin.
 // Broad 0.01..1M market bounds need up to 9B reserve for KX 100C x100 lots.
 await send(token,'mint',[admin,parseEther('10001001000')]);
 await send(token,'approve',[proxy.target,parseEther('1000')],'APPROVE_TEST_TOKEN');
 await send(brain,'depositMargin',[parseEther('1000')],'DEPOSIT_TEST_TOKEN');
 assert.equal(await brain.principalOf(admin),parseEther('1000'));
 await send(token,'approve',[proxy.target,parseEther('10001000000')],'APPROVE_EXCHANGE_TEST_CAPITAL');
 await send(brain,'fundSettlementCapital',[parseEther('10000000000')],'FUND_ISOLATED_SETTLEMENT_CAPITAL');
 await send(brain,'fundInsurance',[parseEther('1000000')],'FUND_ISOLATED_INSURANCE');
 assert.equal(await brain.settlementCapital(),parseEther('10000000000'));
 assert.equal(await brain.principalOf(admin),parseEther('1000'),'funding cannot become player principal');
 assert.equal(await brain.reservedSettlementLiability(),0n);
 manifest.funding={settlementCapitalTestKgen:'10000000000',insuranceTestKgen:'1000000',playerDepositTestKgen:'1000',testOnly:true};persist();
 async function tick(price,age=0) {
   if(local){await localRpc.request({method:'evm_increaseTime',params:[2]});await localRpc.request({method:'evm_mine',params:[]});}
   const timestamp=(await provider.getBlock('latest')).timestamp-age;
   for(const feed of feedSets[0]) await send(feed,'set',[price,timestamp],'TEST_ORACLE_TICK');
 }
 async function order(c='100',lots=1,price=parseEther('100000')) {
   const id=await trigger.nextOrderId();await send(trigger,'createOrder',[0,parseEther(c),lots,price],'CREATE_ORDER');
   assert.equal((await trigger.order(id)).status,1n);return id;
 }
 async function fill(id) {
   await send(trigger,'observeOrder',[id],'FILL_ORDER');const o=await trigger.order(id);assert.equal(o.status,2n);
   const r=await trigger.fillReceipt(id);assert.equal(r.positionId,o.positionId);
   assert.equal(r.walletBefore-r.walletAfter,r.marginLocked);
   await mustRevert(()=>trigger.observeOrder.staticCall(id),'DUPLICATE_FILL');return o.positionId;
 }
 for(const [previous,current,name] of [['99900','100050','UPWARD_CROSS'],['100050','99900','DOWNWARD_CROSS'],['100000','100000','EXACT_TOUCH']]) {
   await tick(parseEther(previous));const id=await order();await tick(parseEther(current));const pid=await fill(id);
   await send(trigger,'closePosition',[pid],'NORMAL_CLOSE');assert.equal((await position.positionSnapshot(pid)).status,2n);
   manifest.checks[name]='PASS';persist();
 }
 await tick(parseEther('100000'));const liqId=await fill(await order());
 const before=await brain.availablePrincipal(admin);
 await tick(parseEther('98000'));await send(trigger,'observePosition',[liqId],'GAP_LIQUIDATION');
 const liquidated=await position.positionSnapshot(liqId),receipt=await position.settlementReceipt(liqId);
 assert.equal(liquidated.status,3n);assert.equal(liquidated.collateralWad,0n);
 assert.equal(await brain.availablePrincipal(admin),before);
 assert.equal(receipt.settlementPrice,parseEther('98000'));
 assert.equal(receipt.rawPnl,-parseEther('200000'));
 assert.equal(receipt.badDebt,parseEther('199999'));
 assert.equal(await brain.uncoveredBadDebt(),0n);assert.equal(await brain.insuranceReserve(),parseEther('800001'));
 assert.equal(await brain.reservedSettlementLiability(),0n);
 assert.equal(await brain.playerClaimable(admin),0n);
 await mustRevert(()=>trigger.observePosition.staticCall(liqId),'LIQUIDATION_REPLAY');
 await tick(parseEther('100000'));assert.equal((await position.positionSnapshot(liqId)).status,3n);
 const staleId=await order();await tick(parseEther('100000'),7200);
 await mustRevert(()=>trigger.observeOrder.staticCall(staleId),'ORACLE_STALE');
 assert.equal((await trigger.order(staleId)).status,1n);
 await tick(parseEther('100000'));await send(trigger,'cancelOrder',[staleId]);
 if(local){
   // Explicit LOCAL fixture only. The persisted manifest remains publicNetwork:false;
   // this exercises the production adapter against the actual four deployed organs,
   // not a mocked Brain or fabricated receipt. Never enable this path for --deploy97.
   const {createExecutionAdapter}=await import('../../K線西遊記/temples/11520/runtime/real-trading-order-intent.mjs');
   const codec=await import('ethers');
   const fixtureConfig={...manifest,publicNetwork:true};
   const adapter=createExecutionAdapter({deployment:fixtureConfig,ethereum:localRpc,ethers:codec,pollMs:10});
   const check=async(promise,label)=>{const result=await promise;if(!result.ok)console.error(`${label}: ${result.reason??result.status}`);assert.equal(result.ok,true,`${label}: ${result.reason??result.status}`);return result};
   await check(adapter.recover(),'ACTUAL_ADAPTER_RECOVERY');
   let book=adapter.snapshot();
   assert.equal(book.positions.length,4);assert.equal(book.orders.length,5);
   assert.equal(book.positions.filter(p=>p.status==='CLOSED').length,3);
   assert.equal(book.positions.filter(p=>p.status==='LIQUIDATED').length,1);
   assert.equal(book.wallet.principal,999);assert.equal(book.wallet.lockedMargin,0);
   assert.equal(book.receipts.filter(r=>r.kind==='FILL').length,4);
   assert.equal(book.receipts.filter(r=>r.kind==='SETTLEMENT').length,4);
   const input={axis:'KX',market:'BTCUSDT',c:100,lots:1,currentPrice:100000,triggerPrice:100100};
   assert.equal((await check(adapter.preview(input),'ACTUAL_ADAPTER_PREVIEW')).requiredMargin,1);
   await check(adapter.faucet(),'ACTUAL_ADAPTER_TEST_FAUCET');
   await check(adapter.approve(10),'ACTUAL_ADAPTER_APPROVE');
   await check(adapter.deposit(10),'ACTUAL_ADAPTER_DEPOSIT');
   assert.equal(adapter.snapshot().wallet.principal,1009);assert.equal(adapter.snapshot().wallet.testTokenBalance,990);
   await check(adapter.withdraw(1),'ACTUAL_ADAPTER_WITHDRAW');
   assert.equal(adapter.snapshot().wallet.principal,1008);assert.equal(adapter.snapshot().wallet.testTokenBalance,991);
   assert.equal(adapter.snapshot().wallet.claimable,0);
   assert.equal(adapter.snapshot().capital.reservedSettlementLiability,0);
   const submitted=await check(adapter.submit(input),'ACTUAL_ADAPTER_CREATE');
   assert.equal(submitted.status,'ON_CHAIN_ORDER_CREATED');
   await check(adapter.cancel(submitted.orderId),'ACTUAL_ADAPTER_CANCEL');
   adapter.dispose();
   const reload=createExecutionAdapter({deployment:fixtureConfig,ethereum:localRpc,ethers:codec});
   await check(reload.recover(),'ACTUAL_ADAPTER_RELOAD');book=reload.snapshot();
   assert.equal(book.orders.find(o=>o.orderId===submitted.orderId).status,'CANCELLED');
   assert.equal(book.positions.length,4);assert.equal(book.wallet.principal,1008);
   assert.equal(book.receipts.filter(r=>r.kind==='SETTLEMENT').length,4);reload.dispose();
   let forbiddenCalls=0;
   const blocked=createExecutionAdapter({deployment:{...fixtureConfig,chainId:56},ethers:codec,
     ethereum:{request(){forbiddenCalls++;throw new Error('MUST_NOT_CALL')}}});
   assert.equal((await blocked.submit(input)).ok,false);assert.equal(forbiddenCalls,0);
   assert.equal(blocked.snapshot().orders.length,0);
   manifest.checks.ACTUAL_ADAPTER_RECOVERY='PASS';manifest.checks.ACTUAL_ADAPTER_WALLET_TRANSACTIONS='PASS';
   manifest.checks.ACTUAL_ADAPTER_RELOAD='PASS';manifest.checks.ACTUAL_ADAPTER_MAINNET_BLOCK='PASS';
   manifest.localAdapterEvidence={fixture:'LOCAL_GANACHE_CHAIN97_NOT_PUBLIC',positionsRecovered:4,
     settlementsRecovered:4,principalAfterTestDepositAndWithdraw:'1008',testTokenAfterDepositAndWithdraw:'991',
     createdThenCancelledOrder:submitted.orderId,txHash:submitted.txHash};
   assert.equal(manifest.publicNetwork,false);persist();
 }
 manifest.checks.PUBLIC_OR_LOCAL_MECHANICS='PASS';manifest.checks.ISOLATED_MARGIN='PASS';manifest.checks.BAD_DEBT_INSURANCE='PASS';
 manifest.smoke='PASS';manifest.completedAt=new Date().toISOString();persist();
 console.log(live?'PUBLIC_TESTNET_SMOKE_PASS':'LOCAL_CHAIN97_REHEARSAL_PASS');
} catch(e) {
 manifest.errorCode=e.code??e.name;manifest.status='BLOCKED_RECONCILE_RECEIPTS';persist();
 // Never dump provider errors which may embed authenticated RPC URLs or key arguments.
 console.error(`REHEARSAL_BLOCKED: ${manifest.errorCode}`);process.exitCode=1;
} finally {await localRpc?.disconnect();provider?.destroy();}
