import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createKufoClient} from '../K線西遊記/temples/18911/kufo-client.mjs';
import {walletBridgeLanding,walletNativeLink,waitForWalletProvider,walletConnectSessionPermits,ensureWalletBsc,walletNetworkRequestPending} from '../K線西遊記/temples/18911/panel.mjs';

// SYNTHETIC_EIP1193_NO_REAL_WALLET: the real public payload, ABI encoder and
// client run against an in-memory provider. No fetch, RPC, signer or EVM exists.
const require = createRequire(import.meta.url);
const ethers = require('../K線西遊記/temples/12345/assets/ethers-5.7.2.umd.min.js');
const PAYLOAD = JSON.parse(readFileSync(new URL('../K線西遊記/temples/18911/contracts.json', import.meta.url), 'utf8'));
const NAMES = ['KUFO','KAIOSAlchemyFurnace','KUFOOutputJindouyun168888','KSHIP','KSHIPConverter'];
const ZERO = ethers.constants.AddressZero;
const PLAYER = '0x1111111111111111111111111111111111111111';
const OTHER = '0x2222222222222222222222222222222222222222';
const hex = value => ethers.utils.hexValue(value);
const wei = value => ethers.utils.parseUnits(String(value), 18).toString();
const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((yes,no) => { resolve=yes; reject=no; }); return {promise,resolve,reject}; };
const normalize = value => String(value).toLowerCase();

function memoryStorage() {
  const data = new Map();
  return {data,failWrite:false,failReadback:false,
    getItem(key) { return this.failReadback ? null : data.get(key) ?? null; },
    setItem(key,value) { if(this.failWrite) throw Error('Synthetic quota exceeded'); data.set(key,String(value)); },
    removeItem(key) { data.delete(key); }};
}

function memoryLocks() {
  const held = new Set();
  return {held, async request(name, options, callback) {
    assert.equal(options.mode,'exclusive'); assert.equal(options.ifAvailable,true);
    if(held.has(name)) return callback(null);
    held.add(name); try { return await callback({name}); } finally { held.delete(name); }
  }};
}

function harness({storage=memoryStorage(),lockManager=memoryLocks(),account=PAYLOAD.expectedOwner}={}) {
  const payload = structuredClone(PAYLOAD);
  const interfaces = Object.fromEntries(NAMES.map(name => [name,new ethers.utils.Interface(payload.contracts[name].abi)]));
  interfaces.registry = new ethers.utils.Interface(payload.registryABI);
  interfaces.kaios = new ethers.utils.Interface(payload.kaiosABI);
  interfaces.kgen = new ethers.utils.Interface(payload.kgenABI);
  const deps = Object.fromEntries(Object.entries(payload.dependencies).map(([name,value])=>[name,normalize(value.address)]));
  const addresses = Object.fromEntries(NAMES.map((name,index)=>[name,ethers.utils.getContractAddress({from:payload.expectedOwner,nonce:index})]));
  const organIds = {Furnace:ethers.utils.id('KAIOS.ORGAN.FURNACE.18911'),Output:ethers.utils.id('KAIOS.ORGAN.KUFO.OUTPUT.168888'),Converter:ethers.utils.id('KAIOS.ORGAN.KSHIP.CONVERTER')};
  const h = {payload,interfaces,addresses,organIds,storage,lockManager,account,chainId:56,owner:payload.expectedOwner,
    timestamp:1794690000,blockNumber:100,sends:[],requests:[],transactions:new Map(),receipts:new Map(),blocks:new Map(),
    deployed:new Set(),routes:new Map(),proposals:new Map(),allowances:new Map(),proofs:new Map(),
    kaiosBalance:BigInt(wei('100')),kgenBalance:BigInt(wei('10')),kufoBalance:0n,
    kaiosSupply:BigInt(wei('10000')),kufoSupply:0n,totalMinted:0n,
    codeOverrides:new Map(),receiptOverride:null,transactionOverride:null,sendOverride:null,callOverride:null};
  const handlers = new Map();
  const block = number => ({number:hex(number),timestamp:hex(h.timestamp),hash:ethers.utils.id(`synthetic-block-${number}`),parentHash:ethers.utils.id(`synthetic-block-${number-1}`)});
  h.blocks.set(h.blockNumber,block(h.blockNumber));
  h.config = {version:payload.calendar.version,activationTime:String(h.timestamp),utcOffsetSeconds:28800,constellationByMonth:[10,11,12,1,2,3,4,5,6,7,8,9]};
  const calendarHash = () => ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['bytes32','uint64','int32','uint8[12]'],Object.values(h.config)));
  const classify = to => Object.entries(deps).find(([,a])=>a===normalize(to))?.[0]
    ?? NAMES.find(name=>normalize(addresses[name])===normalize(to));
  const defaults = parameter => parameter.baseType==='array' ? Array.from({length:parameter.arrayLength},()=>defaults(parameter.arrayChildren))
    : parameter.baseType==='tuple' ? parameter.components.map(defaults)
    : parameter.type==='address' ? ZERO : parameter.type==='bool' ? false : parameter.type.startsWith('bytes') ? '0x'+'00'.repeat(Number(parameter.type.slice(5))||0) : 0;
  function values(name,method,args) {
    const addr = addresses;
    if(name==='registry') {
      if(method==='owner') return [h.owner]; if(method==='pendingOwner') return [ZERO];
      if(method==='minimumDelay') return [3600]; if(method==='bootstrapOpen') return [false];
      if(method==='organ') return [h.routes.get(normalize(args[0])) ?? ZERO];
      if(method==='pendingOrgans') return h.proposals.get(normalize(args[0])) ?? [ZERO,0];
    }
    if(name==='kaios') {
      if(method==='KGEN') return [payload.dependencies.kgen.address]; if(method==='ORGAN_REGISTRY') return [payload.dependencies.registry.address];
      if(method==='balanceOf') return [h.kaiosBalance.toString()]; if(method==='totalSupply') return [h.kaiosSupply.toString()];
      if(method==='decimals') return [18]; if(method==='allowance') return [String(h.allowances.get(normalize(args[0])+'/'+normalize(args[1])) ?? 0n)];
      if(method==='alchemyBurnRecord') return [h.proofs.get(normalize(args[0]))?.burn ?? interfaces.kaios.getFunction(method).outputs.map(defaults)[0]];
    }
    if(name==='kgen' && method==='balanceOf') return [h.kgenBalance.toString()];
    if(name==='KUFO') {
      if(method==='kaios') return [payload.dependencies.kaios.address]; if(method==='organRegistry') return [payload.dependencies.registry.address];
      if(method==='calendarHash') return [calendarHash()]; if(method==='calendarVersion') return [h.config.version];
      if(method==='activationTime') return [h.config.activationTime]; if(method==='utcOffsetSeconds') return [28800];
      if(method==='constellationByMonth') return [h.config.constellationByMonth[Number(args[0])-1]];
      if(method==='calendarConfig') return [h.config]; if(method==='TOKEN_POINT_18911') return [18911];
      if(method==='civilDate') {const date=new Date((Number(args[0].toString())+28800)*1000);return [date.getUTCFullYear(),date.getUTCMonth()+1,date.getUTCDate()];}
      if(method==='firstBirthYear'||method==='firstBirthMonth') {const date=new Date((Number(h.config.activationTime)+28800)*1000);return [method==='firstBirthYear'?date.getUTCFullYear():date.getUTCMonth()+1];}
      if(method==='maximumGroupId')return ['4294967295'];
      if(method==='totalSupply') return [h.kufoSupply.toString()]; if(method==='totalMintedFromAlchemy') return [h.totalMinted.toString()];
      if(method==='balanceOf') return [h.kufoBalance.toString()]; if(method==='decimals') return [18];
      if(method==='MAX_SUPPLY'||method==='cap') return [wei('72000000000000')];
      if(method==='proofMinted') return [h.proofs.has(normalize(args[0]))];
      if(method==='mintOrigin') return [h.proofs.get(normalize(args[0]))?.origin ?? interfaces.KUFO.getFunction(method).outputs.map(defaults)[0]];
      if(method==='groupCalendarHash') return [calendarHash()];
    }
    if(name==='KAIOSAlchemyFurnace') {
      if(method==='kaios') return [payload.dependencies.kaios.address]; if(method==='kgen') return [payload.dependencies.kgen.address];
      if(method==='organRegistry') return [payload.dependencies.registry.address]; if(method==='canonicalKufo') return [addr.KUFO];
      if(method==='FURNACE_POINT'||method==='TOKEN_POINT') return [18911]; if(method==='OUTPUT_POINT') return [168888];
      if(method==='MIN_KAIOS_WEI'||method==='KAIOS_PER_KGEN'||method==='KUFO_PER_KAIOS') return [1000];
      if(method==='DESTINATION_168888') return [ethers.utils.id('KAIOS.POINT.168888.JINDOUYUN.KUFO.OUTLET')];
      if(method==='proof') return [h.proofs.get(normalize(args[0]))?.proof ?? interfaces.KAIOSAlchemyFurnace.getFunction(method).outputs.map(defaults)[0]];
    }
    if(name==='KUFOOutputJindouyun168888') {
      if(method==='furnace') return [addr.KAIOSAlchemyFurnace]; if(method==='kufo') return [addr.KUFO];
      if(method==='OUTPUT_POINT') return [168888]; if(method==='TOKEN_POINT'||method==='SOURCE_FURNACE_POINT') return [18911];
    }
    if(name==='KSHIP') {
      if(method==='organRegistry') return [payload.dependencies.registry.address]; if(method==='kufo') return [addr.KUFO];
      if(method==='TOKEN_POINT_511111') return [511111];
      if(method==='cap')return [wei('72000000000000000')];
    }
    if(name==='KSHIPConverter') { if(method==='kufo') return [addr.KUFO]; if(method==='kship') return [addr.KSHIP]; if(method==='WORMHOLE_POINT_511111') return [511111]; }
    throw Error(`Synthetic getter not modeled: ${name}.${method}`);
  }
  function event(name,eventName,args,address) {
    const encoded=interfaces[name].encodeEventLog(interfaces[name].getEvent(eventName),args);
    return {address:address ?? (deps[name] ? payload.dependencies[name].address : addresses[name]),topics:encoded.topics,data:encoded.data};
  }
  h.mine = hash => {
    const transaction=h.transactions.get(hash); assert.ok(transaction,'only a submitted synthetic transaction can mine');
    const current=block(++h.blockNumber); h.blocks.set(h.blockNumber,current);
    let contractAddress=null,logs=[];
    if(!transaction.to) {
      const name=NAMES.find(n=>normalize(transaction.input).startsWith(normalize(payload.contracts[n].bytecode)));
      assert.ok(name,'creation must use one of the real five allowlisted artifacts'); contractAddress=addresses[name]; h.deployed.add(name);
      if(name==='KUFO') {
        const encoded=ethers.utils.hexDataSlice(transaction.input,ethers.utils.arrayify(payload.contracts.KUFO.bytecode).length);
        const args=ethers.utils.defaultAbiCoder.decode(interfaces.KUFO.deploy.inputs,encoded); const c=args[2];
        h.config={version:c.version,activationTime:c.activationTime.toString(),utcOffsetSeconds:c.utcOffsetSeconds,constellationByMonth:Array.from(c.constellationByMonth)};
      }
    } else {
      const name=classify(transaction.to); const parsed=interfaces[name].parseTransaction({data:transaction.input,value:transaction.value});
      if(name==='registry'&&parsed.name==='proposeOrgan') {
        const [id,candidate]=parsed.args,eta=h.timestamp+3600; h.proposals.set(normalize(id),[candidate,eta]); logs.push(event('registry','OrganProposed',[id,candidate,eta]));
      } else if(name==='registry'&&parsed.name==='executeOrgan') {
        const id=parsed.args[0],pending=h.proposals.get(normalize(id)); assert.ok(pending&&h.timestamp>=Number(pending[1]));
        const previous=h.routes.get(normalize(id))??ZERO; h.routes.set(normalize(id),pending[0]);h.proposals.delete(normalize(id));logs.push(event('registry','OrganUpdated',[id,previous,pending[0]]));
      } else if(name==='kaios'&&parsed.name==='approve') {
        h.allowances.set(normalize(transaction.from)+'/'+normalize(parsed.args[0]),BigInt(parsed.args[1].toString()));
        logs.push(event('kaios','Approval',[transaction.from,parsed.args[0],parsed.args[1]]));
      } else if(name==='KAIOSAlchemyFurnace'&&parsed.name==='burnForKufo') {
        const amount=BigInt(parsed.args[0].toString()),beneficiary=parsed.args[1],lifeId=parsed.args[2],out=amount*1000n;
        const proofId=ethers.utils.id('synthetic-proof-'+hash),destination=ethers.utils.id('KAIOS.POINT.168888.JINDOUYUN.KUFO.OUTLET');
        const date=new Date((h.timestamp+28800)*1000),year=date.getUTCFullYear(),month=date.getUTCMonth()+1;
        const firstYear=new Date((Number(h.config.activationTime)+28800)*1000).getUTCFullYear(),groupId=(year-firstYear)*12+month;
        const origin={beneficiary,amount:out.toString(),bornAt:h.timestamp,birthYear:year,birthMonth:month,birthTierId:month,birthConstellation:h.config.constellationByMonth[month-1],groupId,calendarHash:calendarHash()};
        const burn={owner:transaction.from,beneficiary,furnace:addresses.KAIOSAlchemyFurnace,kaiosBurned:amount.toString(),expectedKufo:out.toString(),lifeId,destinationCode:destination,blockNumber:h.blockNumber,timestamp:h.timestamp};
        const proof={owner:transaction.from,beneficiary,kaiosBurned:amount.toString(),requiredKgenBalance:(amount/1000n).toString(),observedKgenBalance:h.kgenBalance.toString(),kufoAmount:out.toString(),lifeId,destinationCode:destination,createdAt:h.timestamp,consumed:true};
        h.proofs.set(normalize(proofId),{burn,origin,proof});h.kaiosBalance-=amount;h.kaiosSupply-=amount;h.kufoBalance+=out;h.kufoSupply+=out;h.totalMinted+=out;
        const allowanceKey=normalize(transaction.from)+'/'+normalize(addresses.KAIOSAlchemyFurnace);h.allowances.set(allowanceKey,(h.allowances.get(allowanceKey)??0n)-amount);
        logs.push(event('kaios','Transfer',[transaction.from,ZERO,amount.toString()]),
          event('kaios','KAIOSBurnedForAlchemy',[h.proofs.size,proofId,transaction.from,beneficiary,addresses.KAIOSAlchemyFurnace,amount.toString(),out.toString(),lifeId,destination]),
          event('KAIOSAlchemyFurnace','KgenBalanceVerified',[proofId,transaction.from,h.kgenBalance.toString(),(amount/1000n).toString()]),
          event('KAIOSAlchemyFurnace','ImmediateAlchemyCreated',[proofId,transaction.from,beneficiary,amount.toString(),out.toString(),destination]),
          event('KAIOSAlchemyFurnace','ImmediateAlchemyConsumed',[proofId,beneficiary,out.toString()]),
          event('KUFO','ImmediateAlchemyMinted',[proofId,groupId,beneficiary,out.toString(),h.timestamp]),
          event('KUFOOutputJindouyun168888','KUFOReleased',[proofId,beneficiary,out.toString(),groupId]),
          event('KUFO','Transfer',[ZERO,beneficiary,out.toString()]));
      } else throw Error(`Synthetic mutation not modeled: ${name}.${parsed.name}`);
    }
    const receipt={transactionHash:hash,from:transaction.from,to:transaction.to??null,contractAddress,status:'0x1',blockNumber:current.number,blockHash:current.hash,transactionIndex:'0x0',gasUsed:'0x100000',logs};
    logs.forEach((entry,index)=>Object.assign(entry,{blockNumber:current.number,blockHash:current.hash,transactionHash:hash,transactionIndex:'0x0',logIndex:hex(index),removed:false}));
    Object.assign(transaction,{blockNumber:current.number,blockHash:current.hash});h.receipts.set(hash,receipt);return receipt;
  };
  h.advance=seconds=>{h.timestamp+=seconds;h.blocks.set(++h.blockNumber,block(h.blockNumber));};
  const provider={on(name,fn){if(!handlers.has(name))handlers.set(name,new Set());handlers.get(name).add(fn);},removeListener(name,fn){handlers.get(name)?.delete(fn);},
    emit(name,value){for(const fn of handlers.get(name)??[])fn(value);},async request({method,params=[]}){
      h.requests.push({method,params});
      await h.requestHook?.({method,params});
      if(method==='eth_chainId')return hex(h.chainId);if(method==='eth_requestAccounts'||method==='eth_accounts')return h.account==null?[]:[h.account];
      if(method==='eth_getBlockByNumber'){
        const frame=h.blocks.get(params[0]==='latest'?h.blockNumber:Number(BigInt(params[0])))??null;
        if(!frame||params[1]!==true)return frame;
        return {...frame,transactions:[...h.transactions.values()].filter(tx=>tx.blockNumber===frame.number)};
      }
      if(method==='eth_getBlockByHash')return [...h.blocks.values()].find(b=>b.hash===params[0])??null;
      if(method==='eth_getBalance')return wei('0.5');if(method==='eth_gasPrice')return hex(50_000_000);if(method==='eth_estimateGas')return '0x100000';
      if(method==='eth_getTransactionCount'){
        const [holder,tag]=params;
        if(tag==null||tag==='pending')return hex(h.sends.length);
        const height=tag==='latest'?h.blockNumber:Number(BigInt(tag));
        const mined=[...h.transactions.values()].filter(tx=>normalize(tx.from)===normalize(holder)&&tx.blockNumber!=null&&Number(BigInt(tx.blockNumber))<=height);
        return hex(mined.reduce((count,tx)=>Math.max(count,Number(BigInt(tx.nonce))+1),0));
      }
      if(method==='eth_getCode') {
        const addr=normalize(params[0]);if(h.codeOverrides.has(addr))return h.codeOverrides.get(addr);
        const dependency=Object.values(payload.dependencies).find(d=>normalize(d.address)===addr);if(dependency)return dependency.code;
        const name=classify(addr);return h.deployed.has(name)?payload.contracts[name].deployedBytecode:'0x';
      }
      if(method==='eth_call') {
        const tx=params[0],name=classify(tx.to);if(!name)throw Error('Synthetic call to unknown address '+tx.to);
        const parsed=interfaces[name].parseTransaction({data:tx.data});const override=await h.callOverride?.({name,method:parsed.name,args:parsed.args,transaction:tx});
        return override??interfaces[name].encodeFunctionResult(parsed.name,values(name,parsed.name,parsed.args));
      }
      if(method==='eth_sendTransaction') {
        const transaction=structuredClone(params[0]);h.sends.push(transaction);if(h.sendOverride)return h.sendOverride(transaction);
        const hash=ethers.utils.hexZeroPad(hex(h.sends.length),32);h.transactions.set(hash,{...transaction,input:transaction.data,hash,chainId:'0x38',nonce:hex(h.sends.length-1),to:transaction.to??null,value:transaction.value??'0x0'});return hash;
      }
      if(method==='eth_getTransactionByHash') {const tx=h.transactions.get(params[0])??null;return h.transactionOverride?h.transactionOverride(tx):tx;}
      if(method==='eth_getTransactionReceipt') {const receipt=h.receipts.get(params[0])??null;return h.receiptOverride?h.receiptOverride(receipt):receipt;}
      throw Error('Unmodeled EIP1193 method (no network fallback): '+method);
    }};
  h.provider=provider;
  h.client=createKufoClient({provider,ethers,payload,storage,lockManager,now:()=>h.timestamp*1000});
  h.makeClient=(overrides={})=>createKufoClient({provider,ethers,payload,storage,lockManager,now:()=>h.timestamp*1000,...overrides});
  return h;
}

async function connect(h,client=h.client) { const connected=await client.connect();assert.equal(connected.active,false,'completed connection must not leave the UI permanently busy');client.setConfig({activationTime:String(h.timestamp)});return client.snapshot(); }
async function reviewed(h,action,client=h.client) {await client.prepare(action);const state=client.snapshot();assert.ok(state.review?.reviewId,'real client must issue a review');return state.review;}
async function submit(h,action,client=h.client) {const review=await reviewed(h,action,client);await client.confirm(review.reviewId,{accepted:true,maxCostBNB:'0.1'});const pending=client.snapshot().pending;assert.ok(pending?.hash,'the fake wallet hash must be durable');return pending.hash;}
async function complete(h,action,client=h.client) {const hash=await submit(h,action,client);h.mine(hash);await client.resume();return client.snapshot();}
async function deployed(h) {await connect(h);for(const name of NAMES)await complete(h,{kind:'deploy',contract:name});return h;}

async function noSend(h,action,reason) {
  const before=h.sends.length;let rejection=null;
  try {await action();} catch(error) {rejection=error;}
  let state;try{state=h.client.snapshot();}catch{state={};}
  assert.equal(h.sends.length,before,'a blocked action must not ask the wallet to send');
  const explanation=String(rejection?.message??'')+' '+JSON.stringify([state.error,state.blockers,state.status]);
  if(reason)assert.match(explanation,reason,'the blocking reason must remain observable');
  assert.ok(rejection || state.error || !state.review,'a blocked action must not keep a usable review');
  return state;
}

test.beforeEach(t=>{
  t.mock.method(globalThis,'fetch',async()=>{throw Error('REAL_NETWORK_FORBIDDEN_SYNTHETIC_18911_TEST');});
});

test('18911 synthetic fixture uses the real dependency pins, artifacts and constructor tuple',()=>{
  assert.equal(PAYLOAD.chainId,56);for(const dep of Object.values(PAYLOAD.dependencies))assert.equal(ethers.utils.keccak256(dep.code),dep.codeHash);
  const constructor=new ethers.utils.Interface(PAYLOAD.contracts.KUFO.abi).deploy;
  assert.deepEqual(constructor.inputs.map(p=>p.type),['address','address','tuple']);
  assert.deepEqual(constructor.inputs[2].components.map(p=>p.type),['bytes32','uint64','int32','uint8[12]']);
});

test('18911 wrong chain, wrong deployment owner and a legacy dependency cannot send',async()=>{
  const wrongChain=harness();wrongChain.chainId=1;
  await noSend(wrongChain,()=>wrongChain.client.connect(),/CHAIN|BSC|56/i);
  const wrongOwner=harness({account:PLAYER});await connect(wrongOwner);
  await noSend(wrongOwner,()=>wrongOwner.client.prepare({kind:'deploy',contract:'KUFO'}),/OWNER|王母|account|帳戶/i);
  const wrongCode=harness();wrongCode.codeOverrides.set(normalize(wrongCode.payload.dependencies.kaios.address),'0x6000');
  await noSend(wrongCode,()=>wrongCode.client.connect(),/CODE|DEPEND|PIN|IDENTITY|程式|身份/i);
});

test('18911 prepare is read-only and deployment requires explicit consent and a sufficient cost ceiling',async()=>{
  const h=harness();await connect(h);const review=await reviewed(h,{kind:'deploy',contract:'KUFO'});
  assert.equal(h.sends.length,0);assert.equal(review.tx.chainId,'0x38');assert.equal(review.tx.to,undefined);assert.equal(BigInt(review.tx.value??0),0n);
  assert.equal(normalize(review.tx.from),normalize(h.payload.expectedOwner));
  assert.ok(normalize(review.tx.data).startsWith(normalize(h.payload.contracts.KUFO.bytecode)));
  await noSend(h,()=>h.client.confirm(review.reviewId,{accepted:false,maxCostBNB:'0.1'}),/CONSENT|ACCEPT|同意|確認/i);
  const next=await reviewed(h,{kind:'deploy',contract:'KUFO'});
  await noSend(h,()=>h.client.confirm(next.reviewId,{accepted:true,maxCostBNB:'0'}),/FEE|COST|BUDGET|費|上限/i);
});

test('18911 account, chain, form, refresh, config and time changes invalidate reviewed deployment data',async()=>{
  for(const change of ['account','chain','form','refresh','config','expiry']) {
    const h=harness();await connect(h);const review=await reviewed(h,{kind:'deploy',contract:'KUFO'});
    if(change==='account'){h.account=OTHER;h.provider.emit('accountsChanged',[OTHER]);}
    if(change==='chain'){h.chainId=1;h.provider.emit('chainChanged','0x1');}
    if(change==='form')h.client.invalidate('Synthetic amount form edited');
    if(change==='refresh')await h.client.refresh();
    if(change==='config')h.client.setConfig({activationTime:String(h.timestamp+1)});
    if(change==='expiry')h.advance(121);
    await noSend(h,()=>h.client.confirm(review.reviewId,{accepted:true,maxCostBNB:'0.1'}),/REVIEW|STALE|CHANGED|EXPIRED|ACCOUNT|CHAIN|預覽|變更|失效/i);
  }
});

test('18911 a wallet identity change during the final fee read prevents transmission',async()=>{
  const h=harness();await connect(h);const review=await reviewed(h,{kind:'deploy',contract:'KUFO'});
  let changed=false;h.requestHook=({method})=>{if(method==='eth_estimateGas'&&!changed){changed=true;h.account=OTHER;h.provider.emit('accountsChanged',[OTHER]);}};
  await noSend(h,()=>h.client.confirm(review.reviewId,{accepted:true,maxCostBNB:'0.1'}),/CHANGED|STALE|ACCOUNT|變更|失效/i);
  assert.equal(changed,true,'the test must reach the final asynchronous fee boundary');
});

test('18911 quota and pending readback failure stop before any wallet submission',async()=>{
  for(const failure of ['failWrite','failReadback']) {
    const h=harness();await connect(h);const review=await reviewed(h,{kind:'deploy',contract:'KUFO'});
    h.storage[failure]=true;
    await noSend(h,()=>h.client.confirm(review.reviewId,{accepted:true,maxCostBNB:'0.1'}),/STOR|PERSIST|QUOTA|READBACK|Synthetic|儲存|保存/i);
  }
});

test('18911 double-click and another client sharing Web Locks request only one confirmation',async()=>{
  const h=harness();await connect(h);const second=h.makeClient();await connect(h,second);
  const firstReview=await reviewed(h,{kind:'deploy',contract:'KUFO'}),secondReview=await reviewed(h,{kind:'deploy',contract:'KUFO'},second);
  const gate=deferred();h.sendOverride=()=>gate.promise;
  const first=h.client.confirm(firstReview.reviewId,{accepted:true,maxCostBNB:'0.1'});await tick();
  assert.equal(h.sends.length,1);
  const duplicate=await Promise.allSettled([
    h.client.confirm(firstReview.reviewId,{accepted:true,maxCostBNB:'0.1'}),
    second.confirm(secondReview.reviewId,{accepted:true,maxCostBNB:'0.1'})
  ]);
  assert.equal(h.sends.length,1,'busy/pending/WebLock must prevent either duplicate request');
  assert.ok(duplicate.every(result=>result.status==='rejected'||result.value?.error||result.value?.pending));
  gate.resolve(ethers.utils.id('synthetic-delayed-wallet-hash'));await first;
  assert.equal(h.sends.length,1);second.dispose();h.client.dispose();
});

test('18911 unavailable Web Locks fail closed instead of treating localStorage as a mutex',async()=>{
  const h=harness({lockManager:{}});await connect(h);const review=await reviewed(h,{kind:'deploy',contract:'KUFO'});
  await noSend(h,()=>h.client.confirm(review.reviewId,{accepted:true,maxCostBNB:'0.1'}),/LOCK|互斥|鎖/i);
});

test('18911 an unknown wallet result survives reload and resume never resends',async()=>{
  const h=harness();await connect(h);const review=await reviewed(h,{kind:'deploy',contract:'KUFO'});
  h.sendOverride=()=>Promise.resolve('not-a-transaction-hash');
  try{await h.client.confirm(review.reviewId,{accepted:true,maxCostBNB:'0.1'});}catch{}
  assert.equal(h.sends.length,1);assert.ok(h.storage.data.get('kaios18911.pending.v1'),'an unknown result must retain its intent');
  h.client.dispose();const restored=h.makeClient();await restored.connect();
  try{await restored.resume();}catch{}
  assert.equal(h.sends.length,1);
  try{await restored.prepare({kind:'deploy',contract:'KUFO'});}catch{}
  const next=restored.snapshot().review;
  if(next)try{await restored.confirm(next.reviewId,{accepted:true,maxCostBNB:'0.1'});}catch{}
  assert.equal(h.sends.length,1,'unknown transmission must not become an automatic retry');restored.dispose();
});

test('18911 explicit 4001 rejection clears only the unsent intent and never retries by itself',async()=>{
  const h=harness();await connect(h);const review=await reviewed(h,{kind:'deploy',contract:'KUFO'});
  h.sendOverride=()=>Promise.reject(Object.assign(Error('Synthetic user rejected'),{code:4001}));
  try{await h.client.confirm(review.reviewId,{accepted:true,maxCostBNB:'0.1'});}catch{}
  assert.equal(h.sends.length,1);assert.equal(h.storage.data.get('kaios18911.pending.v1')??null,null);
  await tick();assert.equal(h.sends.length,1);
  const uncertain=harness();await connect(uncertain);const next=await reviewed(uncertain,{kind:'deploy',contract:'KUFO'}),hash=ethers.utils.id('synthetic-4001-with-broadcast-hash');
  uncertain.sendOverride=()=>Promise.reject(Object.assign(Error('Synthetic uncertain wallet error'),{code:4001,transactionHash:hash}));
  try{await uncertain.client.confirm(next.reviewId,{accepted:true,maxCostBNB:'0.1'});}catch{}
  assert.equal(uncertain.client.snapshot().pending?.hash,hash,'a known broadcast hash must survive even a 4001-shaped error');
  assert.ok(uncertain.storage.data.get('kaios18911.pending.v1'));assert.equal(uncertain.sends.length,1);
});

test('18911 post-broadcast storage failure exposes the hash and retains a no-resend intent',async()=>{
  const h=harness();await connect(h);const review=await reviewed(h,{kind:'deploy',contract:'KUFO'});
  const hash=ethers.utils.id('synthetic-broadcast-before-storage-failure');
  h.sendOverride=()=>{h.storage.failWrite=true;return Promise.resolve(hash);};
  try{await h.client.confirm(review.reviewId,{accepted:true,maxCostBNB:'0.1'});}catch{}
  assert.equal(h.sends.length,1);assert.equal(h.client.snapshot().pending?.hash,hash);
  assert.ok(h.storage.data.get('kaios18911.pending.v1'));h.storage.failWrite=false;
  h.client.dispose();const restored=h.makeClient();try{await restored.connect();await restored.resume();}catch{}
  assert.equal(h.sends.length,1);assert.ok(h.storage.data.get('kaios18911.pending.v1'));restored.dispose();
});

test('18911 each creation receipt must match sender, destination, data, status, canonical block, code and getters',async()=>{
  const faults={
    sender:h=>{h.transactionOverride=tx=>tx?{...tx,from:OTHER}:null;},
    receiptSender:h=>{h.receiptOverride=receipt=>receipt?{...receipt,from:OTHER}:null;},
    destination:h=>{h.transactionOverride=tx=>tx?{...tx,to:OTHER}:null;},
    receiptDestination:h=>{h.receiptOverride=receipt=>receipt?{...receipt,to:OTHER}:null;},
    data:h=>{h.transactionOverride=tx=>tx?{...tx,input:tx.input+'00',data:tx.input+'00'}:null;},
    reverted:h=>{h.receiptOverride=receipt=>receipt?{...receipt,status:'0x0'}:null;},
    block:h=>{h.receiptOverride=receipt=>receipt?{...receipt,blockHash:ethers.utils.id('noncanonical-block')}:null;},
    code:h=>{h.codeOverrides.set(normalize(h.addresses.KUFO),'0x6000');},
    getter:h=>{h.callOverride=({name,method})=>name==='KUFO'&&method==='kaios'?h.interfaces.KUFO.encodeFunctionResult('kaios',[OTHER]):null;}
  };
  for(const [fault,corrupt] of Object.entries(faults)) {
    const h=harness();await connect(h);const hash=await submit(h,{kind:'deploy',contract:'KUFO'});h.mine(hash);corrupt(h);
    try{await h.client.resume();}catch{}
    assert.notEqual(h.client.snapshot().deployments?.KUFO?.address,h.addresses.KUFO,`bad ${fault} must not certify a deployment`);
    assert.equal(h.sends.length,1,'receipt inspection must not submit another transaction');
  }
});

test('18911 five creation receipts advance only on explicit actions; forged local addresses are not authority',async()=>{
  const h=await deployed(harness());
  for(const name of NAMES)assert.equal(normalize(h.client.snapshot().deployments[name].address),normalize(h.addresses[name]));
  assert.equal(h.sends.length,5);
  for(const [key,value]of h.storage.data)if(key!=='kaios18911.pending.v1')h.storage.data.set(key,value.replaceAll(h.addresses.KUFO,OTHER).replaceAll(normalize(h.addresses.KUFO),OTHER));
  h.client.dispose();const restored=h.makeClient();try{await restored.connect();await restored.resume();}catch{}
  assert.notEqual(normalize(restored.snapshot().deployments?.KUFO?.address),normalize(OTHER));assert.equal(h.sends.length,5);restored.dispose();
});

test('18911 conflicting Registry pending and early execution cannot overwrite or execute a proposal',async()=>{
  const h=await deployed(harness());const id=normalize(h.organIds.Furnace);
  h.proposals.set(id,[OTHER,h.timestamp+3600]);
  await noSend(h,()=>h.client.prepare({kind:'propose',organ:'Furnace'}),/PENDING|CONFLICT|提案|待處理/i);
  h.proposals.set(id,[h.addresses.KAIOSAlchemyFurnace,h.timestamp+3600]);
  await noSend(h,()=>h.client.prepare({kind:'execute',organ:'Furnace'}),/EARLY|TIME|WAIT|DELAY|到期|等待/i);
  assert.equal(h.sends.length,5);
});

test('18911 player amount remains exact and only KAIOS receives approval before the real burn route',async()=>{
  const h=await deployed(harness());
  for(const [name,id]of Object.entries(h.organIds))h.routes.set(normalize(id),h.addresses[{Furnace:'KAIOSAlchemyFurnace',Output:'KUFOOutputJindouyun168888',Converter:'KSHIPConverter'}[name]]);
  h.account=PLAYER;h.provider.emit('accountsChanged',[PLAYER]);await h.client.connect();
  await noSend(h,()=>h.client.prepare({kind:'approve',amount:'1.0000000000000000001'}),/AMOUNT|DECIMAL|PRECISION|fractional|精度|金額/i);
  const exact='1.234567890123456',raw=ethers.utils.parseUnits(exact,18);
  const approve=await reviewed(h,{kind:'approve',amount:exact});
  assert.equal(normalize(approve.tx.to),normalize(h.payload.dependencies.kaios.address));
  const decoded=h.interfaces.kaios.decodeFunctionData('approve',approve.tx.data);
  assert.equal(decoded[1].toString(),raw.toString());assert.equal(normalize(decoded[0]),normalize(h.addresses.KAIOSAlchemyFurnace));
  const before=h.sends.length;await h.client.confirm(approve.reviewId,{accepted:true,maxCostBNB:'0.1'});let pending=h.client.snapshot().pending;h.mine(pending.hash);await h.client.resume();
  assert.equal(h.sends.length,before+1);assert.equal(h.kgenBalance,BigInt(wei('10')));
  const lifeId=ethers.utils.id('SYNTHETIC_NOT_A_LIFE_IDENTITY_PROOF');
  const burnHash=await submit(h,{kind:'burn',amount:exact,lifeId});h.mine(burnHash);await h.client.resume();
  assert.equal(h.kgenBalance,BigInt(wei('10')));
  assert.ok(!h.sends.some(tx=>normalize(tx.to)===normalize(h.payload.dependencies.kgen.address)),'KGEN is balance-only, never approved or transferred');
  assert.equal(h.kufoBalance,BigInt(raw.toString())*1000n);assert.equal(h.client.snapshot().pending,null);
});

test('18911 approval for 100 KAIOS requires 0.1 KGEN before preview and again before wallet submission',async()=>{
  const h=harness({account:PLAYER});
  activateFixture(h);
  await h.client.connect();
  const approve={kind:'approve',amount:'100'};
  const required=BigInt(wei('0.1'));
  h.kgenBalance=required-1n;
  await assert.rejects(h.client.prepare(approve),{code:'KGEN_BALANCE_INSUFFICIENT'});
  assert.equal(h.client.snapshot().review,null);
  assert.equal(h.storage.getItem('kaios18911.pending.v1'),null);
  assert.equal(h.sends.length,0);

  h.kgenBalance=required;
  const review=await reviewed(h,approve);
  h.kgenBalance=required-1n;
  await assert.rejects(h.client.confirm(review.reviewId,{accepted:true,maxCostBNB:'0.1'}),{code:'KGEN_BALANCE_INSUFFICIENT'});
  assert.equal(h.storage.getItem('kaios18911.pending.v1'),null);
  assert.equal(h.sends.length,0);
  h.client.dispose();
});

test('18911 stale legacy Furnace route, missing KGEN and mismatched burn proof cannot report alchemy success',async()=>{
  const h=await deployed(harness());
  h.routes.set(normalize(h.organIds.Furnace),'0x44c2CA9B9eba19d8F79F6E1786fd9D25e73738e1');
  await noSend(h,()=>h.client.prepare({kind:'approve',amount:'1'}),/ROUTE|FURNACE|ACTIV|LEGACY|路由|啟用|煉丹爐/i);
  for(const [name,id]of Object.entries(h.organIds))h.routes.set(normalize(id),h.addresses[{Furnace:'KAIOSAlchemyFurnace',Output:'KUFOOutputJindouyun168888',Converter:'KSHIPConverter'}[name]]);
  h.kgenBalance=0n;await noSend(h,()=>h.client.prepare({kind:'burn',amount:'1',lifeId:ethers.utils.id('synthetic')}),/KGEN|餘額/i);
  h.kgenBalance=BigInt(wei('10'));h.allowances.set(normalize(h.account)+'/'+normalize(h.addresses.KAIOSAlchemyFurnace),BigInt(wei('1')));
  const hash=await submit(h,{kind:'burn',amount:'1',lifeId:ethers.utils.id('synthetic')});const receipt=h.mine(hash);
  const outlet=receipt.logs.find(log=>normalize(log.address)===normalize(h.addresses.KUFOOutputJindouyun168888));assert.ok(outlet);outlet.address=OTHER;
  const before=h.sends.length;try{await h.client.resume();}catch{}
  assert.ok(h.client.snapshot().pending,'a wrong event emitter cannot clear the pending burn');assert.equal(h.sends.length,before);
});

test('18911 a non-owner player with empty storage discovers active contracts without local deployment claims',async()=>{
  const h=await deployed(harness());
  for(const [name,id]of Object.entries(h.organIds))h.routes.set(normalize(id),h.addresses[{Furnace:'KAIOSAlchemyFurnace',Output:'KUFOOutputJindouyun168888',Converter:'KSHIPConverter'}[name]]);
  h.client.dispose();h.account=PLAYER;
  const freshStorage=memoryStorage();h.client=h.makeClient({storage:freshStorage});await h.client.connect();
  assert.equal(freshStorage.data.size,0,'read-only chain discovery must not manufacture local deployment receipts');
  const before=h.sends.length;
  let hash=await submit(h,{kind:'approve',amount:'1'});h.mine(hash);await h.client.resume();
  hash=await submit(h,{kind:'burn',amount:'1',lifeId:ethers.utils.id('SYNTHETIC_PUBLIC_LIFE_TAG')});h.mine(hash);await h.client.resume();
  assert.equal(h.sends.length,before+2);assert.equal(h.client.snapshot().phase,'VERIFIED_ALCHEMY');
  assert.equal(h.kgenBalance,BigInt(wei('10')));assert.equal(h.kufoBalance,BigInt(wei('1000')));
  assert.equal(h.client.snapshot().pending,null);h.client.dispose();
});

test('18911 empty-journal owner cannot redeploy an already active chain or race a new activation',async()=>{
  for(const boundary of ['prepare','confirm']) {
    const h=harness();await connect(h);assert.equal(h.storage.data.size,0);
    const review=boundary==='confirm'?await reviewed(h,{kind:'deploy',contract:'KUFO'}):null;
    for(const name of NAMES)h.deployed.add(name);
    for(const [organ,id]of Object.entries(h.organIds))h.routes.set(normalize(id),h.addresses[{Furnace:'KAIOSAlchemyFurnace',Output:'KUFOOutputJindouyun168888',Converter:'KSHIPConverter'}[organ]]);
    await noSend(h,()=>boundary==='prepare'
      ?h.client.prepare({kind:'deploy',contract:'KUFO'})
      :h.client.confirm(review.reviewId,{accepted:true,maxCostBNB:'0.1'}),/ALREADY_DEPLOYED|已.*部署|不.*重複/i);
    assert.equal(h.sends.length,0);assert.equal(h.storage.data.size,0,'chain discovery must not manufacture deployment receipts');h.client.dispose();
  }
});

function activateFixture(h) {
  for(const name of NAMES)h.deployed.add(name);
  for(const [organ,id]of Object.entries(h.organIds))h.routes.set(normalize(id),h.addresses[{Furnace:'KAIOSAlchemyFurnace',Output:'KUFOOutputJindouyun168888',Converter:'KSHIPConverter'}[organ]]);
}
function readonlyRequests(h,start) {
  const requests=h.requests.slice(start);
  assert.ok(requests.length>0,'verification must actually read the synthetic chain');
  assert.equal(requests.filter(x=>['eth_requestAccounts','eth_sendTransaction','eth_estimateGas','eth_gasPrice'].includes(x.method)).length,0,'verification cannot prompt, estimate a future action or submit');
  return requests;
}
function documentFixture(t) {
  const original=Object.getOwnPropertyDescriptor(globalThis,'document'),handlers=new Set();let state='visible';
  Object.defineProperty(globalThis,'document',{configurable:true,value:{get visibilityState(){return state;},addEventListener(type,fn){if(type==='visibilitychange')handlers.add(fn);},removeEventListener(type,fn){if(type==='visibilitychange')handlers.delete(fn);}}});
  t.after(()=>{if(original)Object.defineProperty(globalThis,'document',original);else delete globalThis.document;});
  return {set(value,dispatch=false){state=value;if(dispatch)for(const fn of handlers)fn();}};
}

test('18911 automatic verification supports a guest while preserving dependency, runtime and calendar checks',async()=>{
  for(const activated of [false,true]){
    const h=harness({account:null});if(activated)activateFixture(h);
    const state=await h.client.verify();assert.equal(state.phase,'PUBLIC_VERIFIED');assert.equal(state.account,null);assert.equal(state.chainId,56);assert.equal(state.chainActive,activated);assert.equal(state.alchemy,null);
    assert.equal(normalize(state.owner),normalize(PAYLOAD.expectedOwner));assert.equal(h.storage.data.size,0);assert.equal(state.review,null);assert.equal(state.active,false);
    const reads=readonlyRequests(h,0);assert.ok(reads.some(x=>x.method==='eth_getCode'),'public verification still checks actual code');
    for(const request of reads.filter(x=>x.method==='eth_call')){const to=normalize(request.params[0].to),iface=Object.entries(h.payload.dependencies).find(([,d])=>normalize(d.address)===to)?.[0];if(iface){const method=h.interfaces[iface].parseTransaction({data:request.params[0].data}).name;assert.ok(!['balanceOf','allowance'].includes(method),'a disconnected guest has no private account balance query');}}
    h.client.dispose();
  }
  for(const fault of ['dependency','runtime','calendar']){
    const h=harness({account:null});activateFixture(h);
    if(fault==='dependency')h.codeOverrides.set(normalize(h.payload.dependencies.kgen.address),'0x6000');
    if(fault==='runtime')h.codeOverrides.set(normalize(h.addresses.KSHIP),'0x6000');
    if(fault==='calendar')h.callOverride=({name,method})=>name==='KUFO'&&method==='calendarConfig'?h.interfaces.KUFO.encodeFunctionResult(method,[{...h.config,utcOffsetSeconds:0}]):null;
    await assert.rejects(h.client.verify());assert.equal(h.client.snapshot().chainActive,false);assert.equal(h.storage.data.size,0);readonlyRequests(h,0);h.client.dispose();
  }
});

test('18911 publishes the original player receipt once from each verification path',async()=>{
  for(const route of ['verify','resume','recoverPendingHash','reverted']){
    const h=harness({account:PLAYER});activateFixture(h);await connect(h);
    const pendingKey='kaios18911.pending.v1';
    for(const account of [PLAYER,OTHER]){
      h.allowances.set(normalize(account)+'/'+normalize(h.addresses.KAIOSAlchemyFurnace),BigInt(wei('100')));
    }
    const burn={kind:'burn',amount:'100',lifeId:ethers.constants.HashZero};
    const hash=await submit(h,burn),original=h.client.snapshot().pending;
    h.account=OTHER;h.provider.emit('accountsChanged',[OTHER]);await h.client.verify();
    await submit(h,{...burn,amount:'1'});
    const other=JSON.parse(h.storage.getItem(pendingKey)).records[normalize(OTHER)];
    h.account=PLAYER;h.provider.emit('accountsChanged',[PLAYER]);await h.client.verify();

    const receipt=h.mine(hash);
    if(route==='reverted'){receipt.status='0x0';receipt.logs=[];}
    const events=[];
    const stop=h.client.subscribe((snapshot,event)=>{
      if(event?.type==='playerReceiptVerified')events.push({event,account:snapshot.account,pending:snapshot.pending});
    });
    const start=h.requests.length;
    if(route==='recoverPendingHash')await h.client.recoverPendingHash({hash,accepted:true,expectedIntentId:original.intentId});
    else if(route==='reverted')await h.client.verify();
    else await h.client[route]();
    assert.equal(h.client.snapshot().pending,null,route);
    const expected={type:'playerReceiptVerified',account:PLAYER,kind:'burn',kufoMinted:wei('100000')};
    assert.deepEqual(events,route==='reverted'?[]:[{event:expected,account:PLAYER,pending:null}],route);
    const evidence=h.client.exportEvidence().journal.evidence;
    assert.equal(evidence.length,1,route);
    assert.equal(evidence[0].intent.hash,hash,route);
    assert.equal(evidence[0].verification.status,route==='reverted'?'CONFIRMED_REVERTED':'VERIFIED_ALCHEMY',route);
    const reads=readonlyRequests(h,start).filter(request=>request.method==='eth_getTransactionReceipt');
    assert.ok(reads.length&&reads.every(request=>request.params[0]===hash),route);
    await h.client.verify();
    h.account=OTHER;h.provider.emit('accountsChanged',[OTHER]);await h.client.verify();
    assert.equal(events.length,route==='reverted'?0:1,route);
    assert.deepEqual(h.client.snapshot().pending,other,route);
    assert.equal(h.sends.length,2,route);
    stop();h.client.dispose();
  }
});

test('18911 account events restore a pending player after leaving a wallet with only a cancelled preview',async()=>{
  const h=harness({account:PLAYER});activateFixture(h);await connect(h);
  for(const account of [PLAYER,OTHER]){
    h.allowances.set(normalize(account)+'/'+normalize(h.addresses.KAIOSAlchemyFurnace),BigInt(wei('1')));
  }
  const request={kind:'burn',amount:'1',lifeId:ethers.constants.HashZero};
  const hash=await submit(h,request), pendingKey='kaios18911.pending.v1',original=h.storage.data.get(pendingKey);
  const changes=[];
  const stop=h.client.subscribe((snapshot,event)=>{if(event)changes.push({phase:snapshot.phase,account:snapshot.account,pending:snapshot.pending,event});});

  h.account=OTHER;h.provider.emit('accountsChanged',[OTHER]);
  let start=h.requests.length;
  const second=await h.client.verify();
  assert.equal(second.account,OTHER);
  assert.equal(second.pending,null);
  assert.ok(!readonlyRequests(h,start).some(request=>request.method==='eth_getTransactionReceipt'));
  await h.client.prepare(request);
  assert.ok(h.client.snapshot().review);
  h.client.invalidate('Preview cancelled');

  h.account=PLAYER;h.provider.emit('accountsChanged',[PLAYER]);
  assert.deepEqual(changes.at(-1),{phase:'STALE',account:null,pending:null,event:'accountsChanged'});
  start=h.requests.length;
  const first=await h.client.verify();
  assert.equal(first.account,PLAYER);
  assert.equal(first.pending.hash,hash);
  assert.deepEqual(readonlyRequests(h,start).filter(request=>request.method==='eth_getTransactionReceipt').map(request=>request.params[0]),[hash]);
  assert.equal(h.storage.data.get(pendingKey),original);
  assert.equal(h.sends.length,1);

  const signals=changes.length;
  h.account=null;h.provider.emit('accountsChanged',[]);h.provider.emit('disconnect',{code:4900});h.provider.emit('chainChanged','0x38');
  assert.equal(changes.length,signals,'no account refresh signal is created for empty, disconnect or chain-change events');
  stop();h.client.dispose();
});

test('18911 automatic verification archives the exact mined intent and discovers newly activated routes without another send',async()=>{
  const first=harness();await connect(first);const hash=await submit(first,{kind:'deploy',contract:'KUFO'});first.mine(hash);const start=first.requests.length;
  const verified=await first.client.verify();assert.equal(verified.pending,null);assert.equal(verified.deployments.KUFO.txHash,hash);assert.equal(first.sends.length,1);assert.equal(verified.review,null);readonlyRequests(first,start);
  const archived=JSON.parse(first.storage.data.get(verified.evidenceKey));assert.equal(archived.evidence.length,1);assert.equal(archived.evidence[0].verification.status,'VERIFIED_DEPLOYMENT');assert.equal(archived.evidence[0].receipt.transactionHash,hash);first.client.dispose();
  const h=await deployed(harness());h.routes.set(normalize(h.organIds.Furnace),h.addresses.KAIOSAlchemyFurnace);h.routes.set(normalize(h.organIds.Output),h.addresses.KUFOOutputJindouyun168888);
  h.proposals.set(normalize(h.organIds.Converter),[h.addresses.KSHIPConverter,h.timestamp]);
  const execution=await submit(h,{kind:'execute',organ:'Converter'});h.mine(execution);const before=h.sends.length,readStart=h.requests.length;
  const active=await h.client.verify();assert.equal(active.pending,null);assert.equal(active.chainActive,true);assert.equal(active.alchemy.active,true);assert.equal(active.review,null);assert.equal(h.sends.length,before);readonlyRequests(h,readStart);
  assert.ok(JSON.parse(h.storage.data.get(active.evidenceKey)).evidence.some(x=>x.intent.hash===execution&&x.verification.status==='CONFIRMED'));h.client.dispose();
});

test('18911 automatic verification preserves a canonical reverted receipt as an explicit terminal failure',async()=>{
  const h=harness();await connect(h);const hash=await submit(h,{kind:'deploy',contract:'KUFO'});h.mine(hash);
  h.receiptOverride=receipt=>receipt?{...receipt,status:'0x0',contractAddress:null,logs:[]}:null;
  const start=h.requests.length,state=await h.client.verify();
  assert.equal(state.phase,'CONFIRMED_REVERTED');assert.match(state.status,/已確認失敗/);assert.equal(state.pending,null);assert.equal(state.review,null);assert.equal(state.active,false);
  assert.equal(h.storage.data.has('kaios18911.pending.v1'),false);assert.equal(Object.keys(state.deployments).length,0,'a reverted creation cannot become a verified deployment');
  const archive=JSON.parse(h.storage.data.get(state.evidenceKey));assert.equal(archive.evidence.length,1);assert.equal(archive.evidence[0].intent.hash,hash);assert.equal(archive.evidence[0].receipt.status,'0x0');assert.equal(archive.evidence[0].verification.status,'CONFIRMED_REVERTED');
  const reads=readonlyRequests(h,start);assert.equal(reads.filter(x=>x.method==='eth_getBlockByNumber'&&x.params[0]==='latest').length,1,'failure is not overwritten by a new connected refresh');assert.equal(h.sends.length,1,'automatic failure handling never retries or prepares another transaction');h.client.dispose();
});

test('18911 automatic verification preserves unmined, unknown, disconnected, foreign-account and foreign-version intents',async()=>{
  for(const mode of ['unmined','unknown','guest','foreign','version']){
    const h=harness();await connect(h);
    if(mode==='unknown')h.sendOverride=()=>Promise.resolve('unknown-wallet-result');
    let hash;try{hash=await submit(h,{kind:'deploy',contract:'KUFO'});}catch{}
    if(mode!=='unknown'&&mode!=='unmined')h.mine(hash);
    if(mode==='guest'||mode==='foreign'){h.client.dispose();h.account=mode==='guest'?null:OTHER;h.client=h.makeClient();}
    if(mode==='version'){const p=JSON.parse(h.storage.data.get('kaios18911.pending.v1'));p.payloadHash=ethers.utils.id('different-program');h.storage.data.set('kaios18911.pending.v1',JSON.stringify(p));}
    const original=h.storage.data.get('kaios18911.pending.v1'),start=h.requests.length;
    if(mode==='unmined'){const result=await h.client.verify();assert.equal(result.phase,'PENDING');assert.equal(result.pending.hash,hash);}
    else if(mode==='foreign'){const result=await h.client.verify();assert.equal(result.account,OTHER);assert.equal(result.pending,null);}
    else await assert.rejects(h.client.verify(),error=>error.code===({unknown:'SUBMISSION_UNKNOWN',guest:'PENDING_ACCOUNT_MISMATCH',version:'FOREIGN_PENDING'}[mode]));
    assert.equal(h.storage.data.get('kaios18911.pending.v1'),original,'a read cannot replace or clear an unresolved intent');assert.equal(h.sends.length,1);assert.equal(h.client.snapshot().review,null);
    const reads=h.requests.slice(start);assert.equal(reads.filter(x=>['eth_requestAccounts','eth_sendTransaction','eth_estimateGas'].includes(x.method)).length,0);
    assert.equal(reads.filter(x=>x.method==='eth_getTransactionReceipt').length,mode==='unmined'?1:0);h.client.dispose();
  }
});

test('18911 automatic verification skips active, reviewed, hidden and disposed clients without touching the current action',async t=>{
  const doc=documentFixture(t),h=harness();await connect(h);await reviewed(h,{kind:'deploy',contract:'KUFO'});
  let before=h.client.snapshot(),start=h.requests.length;assert.deepEqual(await h.client.verify(),before);assert.equal(h.requests.length,start);
  doc.set('hidden');before=h.client.snapshot();assert.deepEqual(await h.client.verify(),before);assert.equal(h.requests.length,start);doc.set('visible');
  h.client.invalidate('Synthetic explicit review cancellation');const gate=deferred();let waiting=false;
  h.requestHook=({method})=>{if(method==='eth_getBlockByNumber'&&!waiting){waiting=true;return gate.promise;}};
  const refresh=h.client.refresh();while(!waiting)await tick();before=h.client.snapshot();start=h.requests.length;
  assert.deepEqual(await h.client.verify(),before);assert.equal(h.requests.length,start);gate.resolve();await refresh;
  h.client.dispose();before=h.client.snapshot();start=h.requests.length;assert.deepEqual(await h.client.verify(),before);assert.equal(h.requests.length,start);
});

test('18911 automatic receipt verification retains pending on canonical, event and archive-readback failures',async()=>{
  for(const fault of ['canonical','event','archive','readback']){
    const h=harness();await connect(h);let hash;
    if(fault==='event'){activateFixture(h);hash=await submit(h,{kind:'approve',amount:'1'});}
    else hash=await submit(h,{kind:'deploy',contract:'KUFO'});
    h.mine(hash);
    if(fault==='canonical')h.receiptOverride=receipt=>({...receipt,blockHash:ethers.utils.id('wrong-canonical-block')});
    if(fault==='event')h.receiptOverride=receipt=>({...receipt,logs:[]});
    if(fault==='archive')h.storage.failWrite=true;
    if(fault==='readback'){const original=h.storage.getItem;let archiveWritten=false;const set=h.storage.setItem;h.storage.setItem=function(key,value){set.call(this,key,value);if(key.startsWith('kaios18911.receipts.'))archiveWritten=true;};h.storage.getItem=function(key){return archiveWritten&&key.startsWith('kaios18911.receipts.')?null:original.call(this,key);};}
    const original=h.storage.data.get('kaios18911.pending.v1'),start=h.requests.length;
    await assert.rejects(h.client.verify());assert.equal(h.storage.data.get('kaios18911.pending.v1'),original);assert.equal(h.client.snapshot().pending.hash,hash);assert.equal(h.sends.length,1);readonlyRequests(h,start);h.client.dispose();
  }
});

test('18911 automatic verification cannot archive or clear a pending receipt after background or identity invalidation',async t=>{
  const doc=documentFixture(t);
  for(const event of ['hidden','account','chain']){
    doc.set('visible');const h=harness();await connect(h);const hash=await submit(h,{kind:'deploy',contract:'KUFO'});h.mine(hash);
    const original=h.storage.data.get('kaios18911.pending.v1'),gate=deferred();let waiting=false;
    h.requestHook=({method})=>{if(method==='eth_getTransactionReceipt'){waiting=true;return gate.promise;}};
    const result=h.client.verify();while(!waiting)await tick();
    if(event==='hidden')doc.set('hidden',true);else if(event==='account'){h.account=OTHER;h.provider.emit('accountsChanged',[OTHER]);}else{h.chainId=1;h.provider.emit('chainChanged','0x1');}
    gate.resolve();await assert.rejects(result,error=>error.code==='CONTEXT_CHANGED');assert.equal(h.storage.data.get('kaios18911.pending.v1'),original);assert.equal(h.storage.data.has(h.client.snapshot().evidenceKey),false);assert.equal(h.sends.length,1);h.client.dispose();
  }
});

test('18911 read deadlines preserve pending and never time out a wallet confirmation',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});let clock=1000;t.mock.method(Date,'now',()=>clock);
  const h=harness();await connect(h);const hash=await submit(h,{kind:'deploy',contract:'KUFO'});h.mine(hash);
  const original=h.storage.data.get('kaios18911.pending.v1'),gate=deferred();let waiting=false;
  h.requestHook=({method})=>{if(method==='eth_getTransactionReceipt'){waiting=true;return gate.promise;}};
  const checking=h.client.verify();const rejection=assert.rejects(checking,error=>error.code==='TIMEOUT');while(!waiting)await tick();
  t.mock.timers.tick(15000);await rejection;assert.equal(h.client.snapshot().active,false);assert.equal(h.storage.data.get('kaios18911.pending.v1'),original);
  const stopped=h.client.snapshot();gate.resolve();await tick();assert.deepEqual(h.client.snapshot(),stopped);assert.equal(h.storage.data.has(stopped.evidenceKey),false);h.client.dispose();
  const total=harness({account:null});total.requestHook=()=>{clock+=14000;};
  await assert.rejects(total.client.verify(),error=>error.code==='TIMEOUT');assert.equal(total.client.snapshot().active,false);assert.ok(total.requests.length<=5,'the pass budget expires before a long series of sub-timeout reads');assert.equal(total.sends.length,0);total.client.dispose();
  const wallet=harness();await connect(wallet);const review=await reviewed(wallet,{kind:'deploy',contract:'KUFO'}),consent=deferred();let walletWaiting=false;
  wallet.sendOverride=()=>{walletWaiting=true;return consent.promise;};const confirmation=wallet.client.confirm(review.reviewId,{accepted:true,maxCostBNB:'0.1'});while(!walletWaiting)await tick();
  const walletPending=wallet.storage.getItem('kaios18911.pending.v1');clock+=60001;t.mock.timers.tick(60001);
  assert.equal(wallet.client.snapshot().active,true);assert.ok(wallet.client.snapshot().pending);assert.equal(wallet.storage.getItem('kaios18911.pending.v1'),walletPending);assert.equal(wallet.lockManager.held.size,1);
  await assert.rejects(wallet.client.confirm(review.reviewId,{accepted:true,maxCostBNB:'0.1'}),error=>error.code==='BUSY');assert.equal(wallet.sends.length,1);
  consent.resolve(ethers.utils.id('synthetic-wallet-confirmation-after-read-deadline'));await confirmation;assert.equal(wallet.client.snapshot().pending.phase,'SUBMITTED');assert.equal(wallet.sends.length,1);assert.equal(wallet.lockManager.held.size,0);wallet.client.dispose();
});

test('18911 confirmation bounds pre-wallet identity, route and fee reads without sending after a late response',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});t.mock.method(Date,'now',()=>1000);
  for(const stage of ['base','candidate','quote']){
    const h=harness({account:PLAYER});activateFixture(h);h.allowances.set(normalize(PLAYER)+'/'+normalize(h.addresses.KAIOSAlchemyFurnace),BigInt(wei('100')));await connect(h);
    const review=await reviewed(h,{kind:'burn',amount:'100',lifeId:ethers.utils.id('synthetic-confirm-read-timeout')}),before=[...h.storage.data],gate=deferred();let waiting=false;
    h.requestHook=({method,params})=>{
      const target=stage==='base'?method==='eth_chainId':stage==='candidate'?method==='eth_getCode'&&normalize(params[0])===normalize(h.addresses.KAIOSAlchemyFurnace):method==='eth_estimateGas';
      if(target&&!waiting){waiting=true;return gate.promise;}
    };
    const confirmation=h.client.confirm(review.reviewId,{accepted:true,maxCostBNB:'0.1'}),rejection=assert.rejects(confirmation,error=>error.code==='TIMEOUT');
    for(let n=0;n<100&&!waiting;n++)await tick();assert.ok(waiting,'the real client must reach the deferred '+stage+' read');
    assert.equal(h.client.snapshot().active,true);assert.equal(h.client.snapshot().pending,null);assert.equal(h.lockManager.held.size,1);assert.equal(h.sends.length,0);
    t.mock.timers.tick(15000);await rejection;
    const stopped=h.client.snapshot();assert.equal(stopped.active,false);assert.equal(stopped.phase,'BLOCKED');assert.equal(stopped.error.code,'TIMEOUT');assert.equal(stopped.review.reviewId,review.reviewId);assert.equal(stopped.pending,null);assert.equal(h.lockManager.held.size,0);assert.deepEqual([...h.storage.data],before);
    const count=h.requests.length;gate.resolve();await tick();assert.deepEqual(h.client.snapshot(),stopped);assert.equal(h.requests.length,count);assert.equal(h.sends.length,0);h.client.dispose();
  }
});

test('18911 final pre-wallet guard shares the read budget and clears only its unsubmitted intent on timeout',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});let clock=1000;t.mock.method(Date,'now',()=>clock);
  for(const deadline of ['rpc','whole-pass']){
    clock=1000;const h=harness();await connect(h);const review=await reviewed(h,{kind:'deploy',contract:'KUFO'}),before=[...h.storage.data],gate=deferred();let waiting=false;
    h.requestHook=({method})=>{
      if(deadline==='whole-pass'&&method==='eth_estimateGas')clock+=59000;
      if(method==='eth_chainId'&&h.storage.data.has('kaios18911.pending.v1')){waiting=true;return gate.promise;}
    };
    let rejected=false;const confirmation=h.client.confirm(review.reviewId,{accepted:true,maxCostBNB:'0.1'}),rejection=assert.rejects(confirmation,error=>error.code==='TIMEOUT').then(()=>{rejected=true;});
    for(let n=0;n<100&&!waiting;n++)await tick();assert.ok(waiting,'the deferred read must be the final guard after pending persistence');
    const pending=JSON.parse(h.storage.getItem('kaios18911.pending.v1'));assert.equal(pending.phase,'AWAITING_WALLET');assert.equal(pending.hash,null);assert.equal(h.client.snapshot().active,true);assert.equal(h.sends.length,0);
    t.mock.timers.tick(deadline==='whole-pass'?1000:15000);await tick();assert.equal(rejected,true,'finalGuard must retain the same whole-pass deadline');await rejection;
    const stopped=h.client.snapshot();assert.equal(stopped.active,false);assert.equal(stopped.error.code,'TIMEOUT');assert.equal(stopped.pending,null);assert.equal(stopped.review,null);assert.equal(h.lockManager.held.size,0);assert.deepEqual([...h.storage.data],before);
    const count=h.requests.length;gate.resolve();await tick();assert.deepEqual(h.client.snapshot(),stopped);assert.equal(h.requests.length,count);assert.equal(h.sends.length,0);h.client.dispose();
  }
});

test('18911 an account change in the read-scope exit microtask cannot reach the wallet send',async()=>{
  const h=harness();await connect(h);const review=await reviewed(h,{kind:'deploy',contract:'KUFO'}),before=[...h.storage.data],get=h.storage.getItem;let changed=false;
  h.storage.getItem=function(key){const value=get.call(this,key);if(key==='kaios18911.pending.v1'&&!changed&&h.client.snapshot().phase==='WAITING_WALLET'){changed=true;queueMicrotask(()=>{h.account=OTHER;h.provider.emit('accountsChanged',[OTHER]);});}return value;};
  await assert.rejects(h.client.confirm(review.reviewId,{accepted:true,maxCostBNB:'0.1'}),error=>error.code==='CONTEXT_CHANGED');
  assert.equal(changed,true);assert.equal(h.sends.length,0);assert.equal(h.client.snapshot().active,false);assert.equal(h.client.snapshot().pending,null);assert.equal(h.lockManager.held.size,0);assert.deepEqual([...h.storage.data],before);h.client.dispose();
});

async function lostHash(h=harness(),request={kind:'deploy',contract:'KUFO'},{mine=true,reload=true}={}) {
  if(!h.client.snapshot().account)await connect(h);
  const review=await reviewed(h,request);
  h.requestHook=({method})=>{if(method==='eth_sendTransaction'){
    const saved=JSON.parse(h.storage.getItem('kaios18911.pending.v1')),block=h.blocks.get(h.blockNumber);
    assert.deepEqual(saved.submissionAnchor,{number:block.number,hash:block.hash,timestamp:String(h.timestamp)},'the sealed submission anchor must already be durable before opening the wallet request');
    h.storage.failWrite=true;
  }};
  await assert.rejects(h.client.confirm(review.reviewId,{accepted:true,maxCostBNB:'0.1'}),error=>error.code==='STORAGE_WRITE_FAILED');
  h.requestHook=null;h.storage.failWrite=false;
  const hash=[...h.transactions.keys()].at(-1);assert.equal(h.client.snapshot().pending.hash,hash,'the same page still exposes the real broadcast hash');
  assert.equal(JSON.parse(h.storage.data.get('kaios18911.pending.v1')).hash,null,'the post-broadcast hash write really failed');
  if(mine)h.mine(hash);
  if(reload){h.client.dispose();h.client=h.makeClient();await h.client.connect();assert.equal(h.client.snapshot().pending.hash,null,'reload loses the RAM-only hash, not the pending intent');}
  return {h,hash};
}
async function failedCreation() {
  const h=harness();await connect(h);const hash=await submit(h,{kind:'deploy',contract:'KUFO'});h.mine(hash);h.deployed.delete('KUFO');
  Object.assign(h.receipts.get(hash),{status:'0x0',contractAddress:null,logs:[]});await h.client.resume();
  assert.equal(h.client.snapshot().phase,'CONFIRMED_REVERTED');assert.equal(h.client.snapshot().pending,null);return h;
}

async function hashlessAlchemy(kind='approve') {
  const h=harness({account:PLAYER});activateFixture(h);
  if(kind==='burn')h.allowances.set(normalize(PLAYER)+'/'+normalize(h.addresses.KAIOSAlchemyFurnace),BigInt(wei('100')));
  const request=kind==='burn'?{kind,amount:'1',lifeId:ethers.utils.id('synthetic-original-life')}:{kind,amount:'1'};
  return lostHash(h,request,{mine:false});
}

test('18911 one wallet can finish alchemy while another wallet preserves its original hashless intent',async()=>{
  const {h,hash:originalHash}=await hashlessAlchemy();
  const key='kaios18911.pending.v1';
  const originalRaw=h.storage.getItem(key),original=JSON.parse(originalRaw);
  assert.equal(original.schemaVersion,1);
  assert.equal(original.account,PLAYER);
  assert.equal(original.hash,null);
  await assert.rejects(h.client.prepare({kind:'approve',amount:'1'}),{code:'PENDING_INTENT'});

  h.account=OTHER;
  h.provider.emit('accountsChanged',[OTHER]);
  const ready=await h.client.connect();
  assert.equal(ready.account,OTHER);
  assert.equal(ready.pending,null);
  assert.equal(ready.chainActive,true);
  await assert.rejects(h.client.recoverPendingHash({hash:originalHash,accepted:true,expectedIntentId:original.intentId}),{code:'NO_PENDING_INTENT'});
  assert.equal(h.storage.getItem(key),originalRaw);

  const furnace=h.addresses.KAIOSAlchemyFurnace;
  h.allowances.set(normalize(OTHER)+'/'+normalize(furnace),BigInt(wei('100')));
  const burn={kind:'burn',amount:'100',lifeId:ethers.constants.HashZero};
  const burnHash=await submit(h,burn);
  const pending=JSON.parse(h.storage.getItem(key));
  assert.equal(pending.schemaVersion,2);
  assert.deepEqual(pending.records[normalize(PLAYER)],original);
  assert.equal(pending.records[normalize(OTHER)].hash,burnHash);
  assert.equal(normalize(h.sends.at(-1).from),normalize(OTHER));
  await assert.rejects(h.client.prepare(burn),{code:'PENDING_INTENT'});

  h.mine(burnHash);
  const finished=await h.client.resume();
  assert.equal(finished.pending,null);
  const remaining=JSON.parse(h.storage.getItem(key));
  assert.equal(remaining.schemaVersion,2);
  assert.deepEqual(remaining.records,{[normalize(PLAYER)]:original});
  const burned=h.client.exportEvidence().journal.evidence[0];
  assert.equal(burned.intent.hash,burnHash);
  assert.equal(burned.verification.status,'VERIFIED_ALCHEMY');
  assert.equal(h.kufoBalance,BigInt(wei('100000')));
  assert.equal(h.kgenBalance,BigInt(wei('10')));

  h.client.dispose();
  h.account=PLAYER;
  h.client=h.makeClient();
  assert.deepEqual((await h.client.connect()).pending,original);
  await assert.rejects(h.client.verify(),{code:'SUBMISSION_UNKNOWN'});
  await assert.rejects(h.client.prepare({kind:'approve',amount:'1'}),{code:'PENDING_INTENT'});
  assert.equal(h.sends.length,2,'only the original two wallet requests were sent');
  h.mine(originalHash);
  await h.client.recoverPendingHash({hash:originalHash,accepted:true,expectedIntentId:original.intentId});
  assert.equal(h.storage.getItem(key),null);
  assert.deepEqual(h.client.exportEvidence().journal.evidence.map(row=>row.intent.hash),[burnHash,originalHash]);
  h.client.dispose();
});

const fullBlockReads=(h,start)=>h.requests.slice(start).filter(r=>r.method==='eth_getBlockByNumber'&&r.params[1]===true);

test('18911 hashless player receipt search matches the original mined approve or burn with one full-block read',async()=>{
  for(const kind of ['approve','burn']){
    const {h,hash}=await hashlessAlchemy(kind);
    if(kind==='approve')h.blockNumber+=65535;
    else for(let i=0;i<23;i++)h.advance(1);
    const receipt=h.mine(hash);
    if(kind==='burn')for(let i=0;i<41;i++)h.advance(1);
    const before=[...h.storage.data],start=h.requests.length;
    const pending=h.client.snapshot().pending;
    const result=await h.client.findPendingReceipt();
    assert.deepEqual(result.receiptCandidate,{intentId:pending.intentId,hash,kind,status:kind==='burn'?'VERIFIED_ALCHEMY':'CONFIRMED',amountWei:pending.amountWei});
    assert.deepEqual(result.pending,pending);
    assert.deepEqual([...h.storage.data],before,'showing a candidate cannot attach its hash or archive evidence');
    assert.equal(h.sends.length,1);
    readonlyRequests(h,start);
    const nonceReads=h.requests.slice(start).filter(r=>r.method==='eth_getTransactionCount');
    const nonceLimit=kind==='approve'?18:9;
    assert.ok(nonceReads.length>=2&&nonceReads.length<=nonceLimit,'the configured block window uses logarithmically bounded nonce search');
    assert.ok(nonceReads.every(({params})=>normalize(params[0])===normalize(PLAYER)&&/^0x[0-9a-f]+$/i.test(params[1])),'every nonce lookup pins an explicit confirmed block');
    assert.deepEqual(fullBlockReads(h,start).map(r=>r.params),[[receipt.blockNumber,true]]);
    const recovered=await h.client.recoverPendingHash({hash,accepted:true});
    assert.equal(recovered.pending,null);
    assert.equal(h.client.exportEvidence().journal.evidence[0].intent.recovery.holderAttested,true);
    assert.equal(h.sends.length,1);
    h.client.dispose();
  }
});

test('18911 hashless player search leaves missing, unrelated or ambiguous mined transactions untouched',async()=>{
  for(const scenario of ['none','multiple','wrongData','wrongTarget','wrongValue','oldReceipt','reorg','legacy','oldWindow']){
    const {h,hash}=await hashlessAlchemy();
    const key='kaios18911.pending.v1',item=JSON.parse(h.storage.getItem(key));
    const anchor=h.blocks.get(Number(BigInt(item.submissionAnchor.number)));
    if(scenario!=='none')h.mine(hash);
    if(scenario==='multiple'){
      const secondHash=ethers.utils.id('second-synthetic-approval');
      h.transactions.set(secondHash,{...h.transactions.get(hash),hash:secondHash,nonce:'0x1'});
      h.mine(secondHash);
    }
    const transaction=h.transactions.get(hash);
    if(scenario==='wrongData')transaction.input+='00';
    if(scenario==='wrongTarget')transaction.to=OTHER;
    if(scenario==='wrongValue')transaction.value='0x1';
    if(scenario==='oldReceipt')for(const record of [h.receipts.get(hash),transaction])Object.assign(record,{blockNumber:anchor.number,blockHash:anchor.hash});
    if(scenario==='reorg')h.blocks.set(Number(BigInt(anchor.number)),{...anchor,hash:ethers.utils.id('reorged-search-anchor')});
    if(scenario==='legacy'){delete item.submissionAnchor;h.storage.setItem(key,JSON.stringify(item));}
    if(scenario==='oldWindow'){h.blockNumber=Number(BigInt(anchor.number))+65536;h.advance(1);}
    const before=[...h.storage.data],start=h.requests.length;
    const result=await h.client.findPendingReceipt();
    assert.equal(result.receiptCandidate,null,scenario);
    assert.equal(result.pending.hash,null,scenario);
    assert.deepEqual([...h.storage.data],before,scenario);
    assert.equal(h.sends.length,1,scenario);
    assert.ok(fullBlockReads(h,start).length<=1,scenario);
    if(['none','multiple','oldReceipt','reorg','legacy','oldWindow'].includes(scenario))assert.equal(fullBlockReads(h,start).length,0,scenario);
    h.client.dispose();
  }
});

test('18911 unsupported wallet history leaves the original player intent and evidence bytes unchanged',async()=>{
  const {h,hash}=await hashlessAlchemy();h.mine(hash);
  h.requestHook=({method})=>{if(method==='eth_getTransactionCount')throw Object.assign(Error('Synthetic unauthorized history query'),{code:4100});};
  const before=[...h.storage.data],start=h.requests.length;
  await assert.rejects(h.client.findPendingReceipt());
  assert.equal(h.client.snapshot().receiptCandidate,null);
  assert.deepEqual([...h.storage.data],before);
  assert.equal(fullBlockReads(h,start).length,0);
  const nonceReads=h.requests.slice(start).filter(r=>r.method==='eth_getTransactionCount');
  assert.ok(nonceReads.length>=1&&nonceReads.length<=2,'a rejected pinned nonce read never starts another scan');
  assert.equal(h.sends.length,1);
  h.client.dispose();
});

test('18911 a holder recovers a RAM-only hash after reload using canonical anchored evidence without resending',async()=>{
  const {h,hash}=await lostHash(),raw=h.storage.data.get('kaios18911.pending.v1'),start=h.requests.length;
  const original=JSON.parse(raw),anchor=original.submissionAnchor;assert.equal(anchor.number,hex(100));assert.equal(anchor.hash,h.blocks.get(100).hash);assert.equal(BigInt(anchor.timestamp),BigInt(h.timestamp));
  await assert.rejects(h.client.recoverPendingHash({hash,accepted:false}),error=>error.code==='RECOVERY_CONSENT_REQUIRED');assert.equal(h.storage.data.get('kaios18911.pending.v1'),raw);
  const result=await h.client.recoverPendingHash({hash,accepted:true});assert.equal(result.phase,'VERIFIED_DEPLOYMENT');assert.equal(result.pending,null);assert.equal(result.deployments.KUFO.txHash,hash);assert.equal(h.sends.length,1);readonlyRequests(h,start);
  const record=h.client.exportEvidence().journal.evidence[0];assert.equal(record.intent.intentId,original.intentId);assert.equal(record.intent.hash,hash);assert.deepEqual(record.intent.submissionAnchor,anchor);assert.equal(record.intent.recovery.assurance,'ANCHORED_HOLDER_ATTESTED');assert.equal(record.intent.recovery.holderAttested,true);assert.equal(record.intent.recovery.uniqueRequestProven,false);h.client.dispose();
});

test('18911 recovery cannot replace a known RAM or durable hash, or reuse another archived intent hash',async()=>{
  for(const location of ['ram','durable','archived']){
    let h,hash,candidate;
    if(location==='ram'){({h,hash}=await lostHash(harness(),undefined,{reload:false}));candidate=ethers.utils.id('different-wallet-hash');}
    else if(location==='durable'){h=harness();await connect(h);hash=await submit(h,{kind:'deploy',contract:'KUFO'});candidate=ethers.utils.id('different-wallet-hash');}
    else{h=harness();await connect(h);await complete(h,{kind:'deploy',contract:'KUFO'});candidate=[...h.transactions.keys()][0];({hash}=await lostHash(h,{kind:'deploy',contract:'KAIOSAlchemyFurnace'}));}
    const raw=h.storage.data.get('kaios18911.pending.v1'),start=h.requests.length;
    await assert.rejects(h.client.recoverPendingHash({hash:candidate,accepted:true}),error=>error.code===(location==='archived'?'HASH_ALREADY_ARCHIVED':'KNOWN_HASH_MISMATCH'));
    assert.equal(h.storage.data.get('kaios18911.pending.v1'),raw);assert.equal(h.requests.length,start);assert.equal(h.client.snapshot().pending.hash,location==='ram'?hash:location==='durable'?hash:null);h.client.dispose();
  }
});

test('18911 candidate recovery cannot attach an unconfirmed, foreign, mismatched or noncanonical transaction',async()=>{
  for(const fault of ['unmined','missingTx','sender','input','value','canonical','runtime','guest','foreign','chain','events']){
    const seed=harness();if(fault==='events'){await connect(seed);activateFixture(seed);}
    const {h,hash}=await lostHash(seed,fault==='events'?{kind:'approve',amount:'1'}:undefined,{mine:fault!=='unmined'});
    if(fault==='missingTx')h.transactionOverride=()=>null;
    if(fault==='sender')h.transactionOverride=tx=>({...tx,from:OTHER});
    if(fault==='input')h.transactionOverride=tx=>({...tx,input:tx.input+'00'});
    if(fault==='value')h.transactionOverride=tx=>({...tx,value:'0x1'});
    if(fault==='canonical')h.receiptOverride=receipt=>({...receipt,blockHash:ethers.utils.id('unrelated-block')});
    if(fault==='runtime')h.codeOverrides.set(normalize(h.addresses.KUFO),'0x6000');
    if(fault==='events')h.receiptOverride=receipt=>({...receipt,logs:[]});
    if(fault==='guest'||fault==='foreign'){h.client.dispose();h.account=fault==='guest'?null:OTHER;h.client=h.makeClient();}
    if(fault==='chain')h.chainId=1;
    const original=h.storage.data.get('kaios18911.pending.v1'),start=h.requests.length,before=h.sends.length;
    await assert.rejects(h.client.recoverPendingHash({hash,accepted:true}),error=>fault==='unmined'||fault==='missingTx'?error.code==='RECOVERY_NOT_CONFIRMED':!!error.code);
    assert.equal(h.storage.data.get('kaios18911.pending.v1'),original,`bad ${fault} must leave the original durable unknown intent`);assert.equal(h.sends.length,before);assert.equal(h.client.snapshot().review,null);readonlyRequests(h,start);h.client.dispose();
  }
});

test('18911 recovery validates its submission anchor and labels the limited legacy clock-bound attestation',async()=>{
  for(const mode of ['anchorReorg','notAfterAnchor','legacy','legacyOldReceipt','legacyMissingClock','legacyFutureClock']){
    const {h,hash}=await lostHash();let item=JSON.parse(h.storage.data.get('kaios18911.pending.v1'));
    if(mode==='anchorReorg')h.blocks.set(100,{...h.blocks.get(100),hash:ethers.utils.id('reorganized-anchor')});
    if(mode==='notAfterAnchor'){const old=h.blocks.get(100);Object.assign(h.receipts.get(hash),{blockNumber:old.number,blockHash:old.hash});Object.assign(h.transactions.get(hash),{blockNumber:old.number,blockHash:old.hash});}
    if(mode.startsWith('legacy')){delete item.submissionAnchor;if(mode==='legacyOldReceipt'){h.advance(2);item.createdAt=(h.timestamp-1)*1000;}if(mode==='legacyMissingClock')delete item.createdAt;if(mode==='legacyFutureClock')item.createdAt=h.timestamp*1000+1;h.storage.data.set('kaios18911.pending.v1',JSON.stringify(item));}
    const original=h.storage.data.get('kaios18911.pending.v1');
    if(mode==='legacy'){const result=await h.client.recoverPendingHash({hash,accepted:true});assert.equal(result.pending,null);const record=h.client.exportEvidence().journal.evidence[0];assert.equal(record.intent.recovery.assurance,'LEGACY_HOLDER_ATTESTED_CLOCK_BOUND');assert.equal(record.intent.recovery.uniqueRequestProven,false);}
    else{await assert.rejects(h.client.recoverPendingHash({hash,accepted:true}),error=>['NON_CANONICAL_SUBMISSION_ANCHOR','RECOVERY_BEFORE_SUBMISSION','LEGACY_RECOVERY_UNBOUNDED'].includes(error.code));assert.equal(h.storage.data.get('kaios18911.pending.v1'),original);}
    assert.equal(h.sends.length,1);h.client.dispose();
  }
});

test('18911 recovery preserves the original intent through another hash or archive write failure',async()=>{
  for(const stage of ['hash','archive','readback']){
    const {h,hash}=await lostHash(),intentId=h.client.snapshot().pending.intentId,key=h.client.snapshot().evidenceKey;
    const set=h.storage.setItem,get=h.storage.getItem;let archiveWritten=false;
    h.storage.setItem=function(k,v){if(stage==='hash'||stage==='archive'&&k===key)throw Error('Synthetic recovery quota failure');set.call(this,k,v);if(k===key)archiveWritten=true;};
    h.storage.getItem=function(k){return stage==='readback'&&archiveWritten&&k===key?null:get.call(this,k);};
    await assert.rejects(h.client.recoverPendingHash({hash,accepted:true}),error=>['STORAGE_WRITE_FAILED','STORAGE_READBACK_FAILED'].includes(error.code));
    assert.equal(JSON.parse(h.storage.data.get('kaios18911.pending.v1')).intentId,intentId);assert.equal(h.client.snapshot().pending.hash,hash,'the already verified candidate hash remains visible while resend stays blocked');assert.equal(h.sends.length,1);
    h.storage.setItem=set;h.storage.getItem=get;await h.client.recoverPendingHash({hash,accepted:true});assert.equal(h.client.snapshot().pending,null);assert.equal(h.client.exportEvidence().journal.evidence.length,1,'a readback failure must recover idempotently, not duplicate evidence');assert.equal(h.sends.length,1);h.client.dispose();
  }
});

test('18911 recovery stops on a changed intent, journal, identity or another tab holding the original lock',async()=>{
  for(const change of ['intent','journal','account','tab']){
    const {h,hash}=await lostHash(),gate=deferred();let waiting=false;
    h.requestHook=({method})=>{if(method==='eth_getTransactionReceipt'){waiting=true;return gate.promise;}};
    const recovering=h.client.recoverPendingHash({hash,accepted:true});const expected=change==='tab'?null:assert.rejects(recovering,error=>['PENDING_CHANGED','CONTEXT_CHANGED'].includes(error.code));while(!waiting)await tick();
    if(change==='intent'){const p=JSON.parse(h.storage.data.get('kaios18911.pending.v1'));p.intentId='different-tab-intent';h.storage.data.set('kaios18911.pending.v1',JSON.stringify(p));}
    if(change==='journal'){const key=h.client.snapshot().evidenceKey;h.storage.data.set(key,JSON.stringify({schemaVersion:1,payloadHash:h.client.snapshot().payloadHash,evidence:[],otherTabMarker:true}));}
    if(change==='account'){h.account=OTHER;h.provider.emit('accountsChanged',[OTHER]);}
    if(change==='tab'){const other=h.makeClient();await assert.rejects(other.recoverPendingHash({hash,accepted:true}),error=>error.code==='ANOTHER_TAB_ACTIVE');other.dispose();}
    const retained=h.storage.data.get('kaios18911.pending.v1');gate.resolve();if(expected)await expected;else await recovering;
    if(change!=='tab')assert.equal(h.storage.data.get('kaios18911.pending.v1'),retained);assert.equal(h.sends.length,1);h.client.dispose();
  }
});

test('18911 canonical first-deployment failure permits an explicit config reset and a new preview without deleting history',async()=>{
  const h=await failedCreation(),original=h.client.exportEvidence(),raw=h.storage.data.get(original.snapshot.evidenceKey),next=String(h.timestamp+60);
  assert.throws(()=>h.client.setConfig({activationTime:next}),error=>error.code==='CONFIG_LOCKED','the original conservative setter still refuses a journal-based reset');
  const start=h.requests.length,result=await h.client.resetFailedDeploymentConfig({activationTime:next});assert.equal(result.config.activationTime,next);assert.equal(result.phase,'STALE');assert.equal(result.review,null);assert.equal(h.storage.data.get(result.evidenceKey),raw);assert.deepEqual(h.client.exportEvidence().journal,original.journal);readonlyRequests(h,start);
  await h.client.prepare({kind:'deploy',contract:'KUFO'});assert.equal(h.client.snapshot().review.config.activationTime,next);assert.equal(h.sends.length,1);h.client.dispose();
});

test('18911 config reset rejects success, unknown, mixed or forged failure records, foreign holders and active new routes',async()=>{
  for(const fault of ['success','pending','mixed','forged','reorg','holder','partialRoute','fullRoute']){
    const h=fault==='success'||fault==='forged'?harness():await failedCreation();
    if(fault==='success'||fault==='forged'){await connect(h);await complete(h,{kind:'deploy',contract:'KUFO'});}
    const key=h.client.snapshot().evidenceKey,archive=JSON.parse(h.storage.data.get(key));
    if(fault==='pending'){const p={...archive.evidence[0].intent,intentId:'unknown-new-send',hash:null};h.storage.data.set('kaios18911.pending.v1',JSON.stringify(p));}
    if(fault==='mixed'){archive.evidence.push({...structuredClone(archive.evidence[0]),verification:{status:'VERIFIED_DEPLOYMENT',address:h.addresses.KUFO}});h.storage.data.set(key,JSON.stringify(archive));}
    if(fault==='forged'){archive.evidence[0].verification.status='CONFIRMED_REVERTED';archive.evidence[0].receipt.status='0x0';h.storage.data.set(key,JSON.stringify(archive));}
    if(fault==='reorg'){const hash=archive.evidence[0].intent.hash;h.receipts.get(hash).blockHash=ethers.utils.id('changed-failure-block');}
    if(fault==='holder'){h.client.dispose();h.account=OTHER;h.client=h.makeClient();}
    if(fault==='partialRoute'){h.deployed.add('KAIOSAlchemyFurnace');h.routes.set(normalize(h.organIds.Furnace),h.addresses.KAIOSAlchemyFurnace);}
    if(fault==='fullRoute')activateFixture(h);
    const config=h.client.snapshot().config,raw=h.storage.data.get(key),pendingRaw=h.storage.data.get('kaios18911.pending.v1'),start=h.requests.length;
    await assert.rejects(h.client.resetFailedDeploymentConfig({activationTime:String(h.timestamp+60)}));assert.deepEqual(h.client.snapshot().config,config);assert.equal(h.storage.data.get(key),raw);assert.equal(h.storage.data.get('kaios18911.pending.v1'),pendingRaw);assert.equal(h.sends.length,1);assert.equal(h.requests.slice(start).filter(x=>['eth_requestAccounts','eth_sendTransaction','eth_estimateGas'].includes(x.method)).length,0);h.client.dispose();
  }
});

test('18911 config reset cannot commit after a late pending, evidence or account change',async()=>{
  for(const change of ['pending','evidence','account']){
    const h=await failedCreation(),before=h.client.snapshot().config,archive=h.client.exportEvidence().journal,gate=deferred();let waiting=false;
    h.requestHook=({method})=>{if(method==='eth_getTransactionReceipt'){waiting=true;return gate.promise;}};
    const reset=h.client.resetFailedDeploymentConfig({activationTime:String(h.timestamp+60)}),rejection=assert.rejects(reset,error=>['PENDING_CHANGED','CONTEXT_CHANGED'].includes(error.code));while(!waiting)await tick();
    if(change==='pending')h.storage.data.set('kaios18911.pending.v1',JSON.stringify({...archive.evidence[0].intent,intentId:'new-unknown',hash:null}));
    if(change==='evidence')h.storage.data.set(h.client.snapshot().evidenceKey,JSON.stringify({...archive,changedByOtherTab:true}));
    if(change==='account'){h.account=OTHER;h.provider.emit('accountsChanged',[OTHER]);}
    const pendingRaw=h.storage.data.get('kaios18911.pending.v1'),journalRaw=h.storage.data.get(h.client.snapshot().evidenceKey);gate.resolve();await rejection;
    assert.deepEqual(h.client.snapshot().config,before);assert.equal(h.storage.data.get('kaios18911.pending.v1'),pendingRaw);assert.equal(h.storage.data.get(h.client.snapshot().evidenceKey),journalRaw);assert.equal(h.sends.length,1);h.client.dispose();
  }
});

test('18911 public evidence export includes the complete archive and pending intent without writes or shared references',async()=>{
  const h=await failedCreation();await h.client.resetFailedDeploymentConfig({activationTime:String(h.timestamp+1)});const {hash}=await lostHash(h,undefined,{mine:false});
  const before=[...h.storage.data],start=h.requests.length,output=h.client.exportEvidence();assert.deepEqual(Object.keys(output).sort(),['journal','pending','snapshot']);assert.equal(output.journal.evidence.length,1);assert.equal(output.journal.evidence[0].verification.status,'CONFIRMED_REVERTED');assert.equal(output.pending.hash,null);assert.ok(output.pending.submissionAnchor);assert.ok(output.pending.intentId);assert.equal(output.snapshot.evidenceKey,h.client.snapshot().evidenceKey);
  output.journal.evidence[0].receipt.status='forged';output.pending.hash=hash;output.snapshot.config.activationTime='1';
  const fresh=h.client.exportEvidence();assert.equal(fresh.journal.evidence[0].receipt.status,'0x0');assert.equal(fresh.pending.hash,null);assert.notEqual(fresh.snapshot.config.activationTime,'1');assert.deepEqual([...h.storage.data],before);assert.equal(h.requests.length,start);h.client.dispose();
});

test('18911 wallet bridge landing preserves the original page and query with one explicit player return marker',()=>{
  const original='https://klineodyssey.github.io/kline-odyssey/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/18911/index.html?case=original&walletBridge=old#ownerPanel';
  const result=walletBridgeLanding(original);
  assert.ok(result instanceof URL);
  assert.equal(result.origin,new URL(original).origin);assert.equal(result.pathname,new URL(original).pathname);
  assert.equal(result.searchParams.get('case'),'original');assert.deepEqual(result.searchParams.getAll('walletBridge'),['1']);
  assert.equal(result.hash,'#playerPanel');assert.equal(walletBridgeLanding(result.href).href,result.href);
  assert.equal(walletBridgeLanding('http://localhost:4173/temples/18911/index.html').hostname,'localhost');
  for(const href of ['javascript:alert(1)','data:text/html,test','file:///tmp/index.html','http://untrusted.example/18911/'])assert.throws(()=>walletBridgeLanding(href),'native handoff rejects non-site schemes and insecure remote HTTP');
});

test('18911 WalletConnect accepts only the current own-metadata topic and an unexpired BSC account namespace',()=>{
  const metadata={name:'18911 煉丹爐 · KUFO',url:'https://klineodyssey.github.io/kline-odyssey/K線西遊記/temples/18911/index.html'};
  const topic='synthetic-18911-topic';
  const valid=()=>({session:{topic,expiry:Math.floor(Date.now()/1000)+3600,self:{metadata:{...metadata}},namespaces:{eip155:{accounts:['eip155:56:'+PAYLOAD.expectedOwner]}}}});
  assert.equal(walletConnectSessionPermits(valid(),metadata,topic),true);
  assert.equal(walletConnectSessionPermits(valid(),metadata,topic,PAYLOAD.expectedOwner.toLowerCase()),true);
  const direct=valid();direct.session.namespaces={'eip155:56':direct.session.namespaces.eip155};assert.equal(walletConnectSessionPermits(direct,metadata,topic,PAYLOAD.expectedOwner),true);
  for(const fault of ['missing','topic','blankTopic','metadataName','metadataUrl','missingMetadata','expired','fractionalExpiry','unsafeExpiry','wrongChain','badAddress','foreignAccount','emptyAccounts']){
    const provider=valid();let expectedTopic=topic,account=PAYLOAD.expectedOwner;
    if(fault==='missing')delete provider.session;
    if(fault==='topic')provider.session.topic='another-application-topic';
    if(fault==='blankTopic')expectedTopic='';
    if(fault==='metadataName')provider.session.self.metadata.name='18888 other application';
    if(fault==='metadataUrl')provider.session.self.metadata.url='https://untrusted.example/';
    if(fault==='missingMetadata')delete provider.session.self.metadata;
    if(fault==='expired')provider.session.expiry=Math.floor(Date.now()/1000)-1;
    if(fault==='fractionalExpiry')provider.session.expiry+=0.5;
    if(fault==='unsafeExpiry')provider.session.expiry=Number.MAX_SAFE_INTEGER+1;
    if(fault==='wrongChain')provider.session.namespaces.eip155.accounts=['eip155:1:'+PAYLOAD.expectedOwner];
    if(fault==='badAddress')provider.session.namespaces.eip155.accounts=['eip155:56:0x1234'];
    if(fault==='foreignAccount')account=OTHER;
    if(fault==='emptyAccounts')provider.session.namespaces.eip155.accounts=[];
    assert.equal(walletConnectSessionPermits(provider,metadata,expectedTopic,account),false,fault+' must not bind this application to an unrelated or stale session');
  }
});

test('18911 native links resolve the complete original18911 landing rather than a wallet home page',()=>{
  const original='https://klineodyssey.github.io/kline-odyssey/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/18911/index.html?case=original#ownerPanel';
  const landing=walletBridgeLanding(original);
  const metamask=new URL(walletNativeLink('metamask',original));
  assert.equal(metamask.origin,'https://link.metamask.io');
  assert.ok(metamask.pathname.startsWith('/dapp/'));
  const target=new URL('https://'+metamask.pathname.slice('/dapp/'.length)+metamask.search+metamask.hash);
  assert.equal(target.href,landing.href,'the wallet route decodes to the exact HTTPS18911 page, query and player panel');
  const trust=new URL(walletNativeLink('trust',original));
  assert.equal(trust.origin,'https://link.trustwallet.com');assert.equal(trust.pathname,'/open_url');
  assert.equal(trust.searchParams.get('coin_id'),'20000714');assert.equal(trust.searchParams.get('url'),landing.href);
  assert.throws(()=>walletNativeLink('unrelated-wallet',original));
});

test('18911 site-entry landing preserves the original URL without creating a connection intent',()=>{
  const site='https://klineodyssey.github.io/kline-odyssey/?source=manual#world';
  assert.equal(walletBridgeLanding(site,{connect:false}).href,site);
  assert.equal(walletBridgeLanding('https://klineodyssey.github.io/kline-odyssey/',{connect:false}).href,'https://klineodyssey.github.io/kline-odyssey/');
  const furnace='https://klineodyssey.github.io/kline-odyssey/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/18911/index.html?original=1#ownerPanel';
  assert.equal(walletBridgeLanding(furnace,{connect:false}).href,furnace,'navigation-only mode does not rewrite an existing page/query/fragment');
  for(const href of ['javascript:alert(1)','data:text/html,test','file:///tmp/index.html','http://untrusted.example/18911/'])assert.throws(()=>walletBridgeLanding(href,{connect:false}),'navigation-only mode keeps the original HTTPS boundary');
});

test('18911 native site links decode to the selected site without a furnace connection marker',()=>{
  const site='https://klineodyssey.github.io/kline-odyssey/';
  const metamask=new URL(walletNativeLink('metamask',site,{connect:false}));
  const target=new URL('https://'+metamask.pathname.slice('/dapp/'.length)+metamask.search+metamask.hash);
  assert.equal(target.href,site);assert.equal(target.searchParams.has('walletBridge'),false);assert.equal(target.hash,'');
  const trust=new URL(walletNativeLink('trust',site,{connect:false}));
  assert.equal(trust.searchParams.get('url'),site);assert.equal(trust.searchParams.get('coin_id'),'20000714');
  for(const wallet of ['metamask','trust'])assert.throws(()=>walletNativeLink(wallet,'http://untrusted.example/',{connect:false}));
});

function discoveryTarget(){
  const target=new EventTarget(),listeners=new Map();
  const add=target.addEventListener.bind(target),remove=target.removeEventListener.bind(target);
  target.addEventListener=(name,fn,options)=>{if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn);add(name,fn,options);};
  target.removeEventListener=(name,fn,options)=>{listeners.get(name)?.delete(fn);remove(name,fn,options);};
  return {target,listeners:()=>[...listeners.values()].reduce((sum,items)=>sum+items.size,0)};
}
const discoveryPause=()=>new Promise(resolve=>setTimeout(resolve,30));

test('18911 discovery returns an already injected provider and leaves no timer or listener activity',async()=>{
  const h=discoveryTarget(),provider={request(){}},calls=[];
  assert.equal(await waitForWalletProvider(value=>{calls.push(value);return provider;},{target:h.target,timeoutMs:100,intervalMs:5}),provider);
  const settled=calls.length;await discoveryPause();assert.equal(calls.length,settled);assert.equal(h.listeners(),0);
});

test('18911 native return discovers a late injected provider on its initialization event exactly once',async()=>{
  const h=discoveryTarget(),provider={request(){}},calls=[];let injected=null;
  const result=waitForWalletProvider(value=>{calls.push(value);return injected;},{target:h.target,timeoutMs:200,intervalMs:5});
  injected=provider;h.target.dispatchEvent(new Event('ethereum#initialized'));
  assert.equal(await result,provider);const settled=calls.length;
  h.target.dispatchEvent(new Event('ethereum#initialized'));await discoveryPause();
  assert.equal(calls.length,settled,'settled discovery cannot reconnect after a repeated wallet event');assert.equal(h.listeners(),0);
});

test('18911 discovery accepts an announced EIP6963 provider without requiring a preexisting window slot',async()=>{
  const h=discoveryTarget(),provider={request(){}},calls=[];
  const result=waitForWalletProvider(value=>{calls.push(value);return value||null;},{target:h.target,timeoutMs:200,intervalMs:5});
  const announcement=new Event('eip6963:announceProvider');Object.defineProperty(announcement,'detail',{value:{provider,info:{uuid:'synthetic-provider'}}});
  h.target.dispatchEvent(announcement);assert.equal(await result,provider);
  const settled=calls.length;await discoveryPause();assert.equal(calls.length,settled);assert.equal(h.listeners(),0);
});

test('18911 discovery polling handles injection without an event and stops after the bounded timeout',async()=>{
  const h=discoveryTarget(),provider={request(){}},calls=[];let injected=null;
  const result=waitForWalletProvider(()=>{calls.push(1);return injected;},{target:h.target,timeoutMs:200,intervalMs:5});
  setTimeout(()=>{injected=provider;},10);assert.equal(await result,provider);
  let settled=calls.length;await discoveryPause();assert.equal(calls.length,settled);assert.equal(h.listeners(),0);
  const missing=discoveryTarget();let probes=0;
  assert.equal(await waitForWalletProvider(()=>{probes++;return null;},{target:missing.target,timeoutMs:15,intervalMs:5}),null);
  settled=probes;await discoveryPause();assert.equal(probes,settled,'a missing wallet cannot leave a retry loop');assert.equal(missing.listeners(),0);
});

test('18911 cancellation removes discovery listeners and prevents a late provider from being adopted',async()=>{
  const h=discoveryTarget(),controller=new AbortController();let probes=0;
  const result=waitForWalletProvider(()=>{probes++;return null;},{target:h.target,timeoutMs:200,intervalMs:5,signal:controller.signal});
  controller.abort();await assert.rejects(result,error=>error.name==='AbortError'&&error.code==='WALLET_DISCOVERY_CANCELLED');
  const settled=probes;h.target.dispatchEvent(new Event('ethereum#initialized'));await discoveryPause();
  assert.equal(probes,settled);assert.equal(h.listeners(),0);
  const already=new AbortController();already.abort();const before=discoveryTarget();
  await assert.rejects(waitForWalletProvider(()=>null,{target:before.target,signal:already.signal}),error=>error.name==='AbortError'&&error.code==='WALLET_DISCOVERY_CANCELLED');
  assert.equal(before.listeners(),0);
});

test('18911 an already BSC wallet needs only a chain read without switching or requesting accounts',async()=>{
  const calls=[],provider={async request(args){calls.push(args);assert.equal(args.method,'eth_chainId');return '0x38';}};
  await ensureWalletBsc(provider);
  assert.deepEqual(calls.map(call=>call.method),['eth_chainId']);
  assert.equal(walletNetworkRequestPending(provider),false);
});

test('18911 an explicit BSC switch can emit chainChanged before the real client starts its connection',async()=>{
  const h=harness();h.chainId=1;const original=h.provider.request.bind(h.provider);
  h.provider.request=async args=>{
    if(args.method!=='wallet_switchEthereumChain')return original(args);
    h.requests.push(structuredClone(args));assert.deepEqual(args.params,[{chainId:'0x38'}]);
    h.chainId=56;h.provider.emit('chainChanged','0x38');return null;
  };
  try{
    await ensureWalletBsc(h.provider);
    assert.deepEqual(h.requests.map(call=>call.method),['eth_chainId','wallet_switchEthereumChain','eth_chainId']);
    assert.equal(h.client.snapshot().phase,'STALE','the normal client event guard still invalidates the previous context');
    await h.client.connect();
    assert.equal(h.client.snapshot().phase,'CONNECTED');assert.equal(h.client.snapshot().chainId,56);
    assert.equal(normalize(h.client.snapshot().account),normalize(h.account));assert.equal(h.sends.length,0);
    assert.equal(walletNetworkRequestPending(h.provider),false);
  }finally{h.client.dispose();}
});

test('18911 refused, unknown and unsupported BSC switches preserve the wallet code without adding a chain',async()=>{
  for(const code of [4001,4902,-32601]){
    const calls=[],provider={async request(args){calls.push(args);if(args.method==='eth_chainId')return '0x1';throw Object.assign(new Error('Synthetic wallet refusal'),{code});}};
    await assert.rejects(ensureWalletBsc(provider),error=>error.code===code&&typeof error.message==='string'&&error.message.length>0);
    assert.deepEqual(calls.map(call=>call.method),['eth_chainId','wallet_switchEthereumChain']);
    assert.equal(walletNetworkRequestPending(provider),false);
  }
});

test('18911 a resolved switch is not BSC authority until the provider confirms chain 56',async()=>{
  const calls=[],provider={async request(args){calls.push(args);return args.method==='eth_chainId'?'0x1':null;}};
  await assert.rejects(ensureWalletBsc(provider),error=>error.code==='WRONG_CHAIN');
  assert.deepEqual(calls.map(call=>call.method),['eth_chainId','wallet_switchEthereumChain','eth_chainId']);
  assert.equal(walletNetworkRequestPending(provider),false);
});

test('18911 an expired BSC-switch context cannot open even the first wallet request',async()=>{
  const calls=[],provider={async request(args){calls.push(args);return '0x38';}};
  await assert.rejects(ensureWalletBsc(provider,{isCurrent:()=>false}));
  assert.deepEqual(calls,[]);assert.equal(walletNetworkRequestPending(provider),false);
});

test('18911 late chain reads and switch replies cannot continue after their connection context is cancelled',async()=>{
  for(const stoppedAt of [0,1,2]){
    const gate=deferred(),calls=[];let current=true,waiting=false;
    const provider={async request(args){
      const index=calls.length;calls.push(args);
      if(index===stoppedAt){waiting=true;await gate.promise;}
      return args.method==='eth_chainId'?(index===0?'0x1':'0x38'):null;
    }};
    const checking=ensureWalletBsc(provider,{isCurrent:()=>current}),rejection=assert.rejects(checking);
    while(!waiting)await tick();
    current=false;gate.resolve();await rejection;await tick();
    assert.equal(calls.length,stoppedAt+1,'a late reply cannot trigger the next chain or account request');
    assert.ok(calls.every(call=>['eth_chainId','wallet_switchEthereumChain'].includes(call.method)));
    assert.equal(walletNetworkRequestPending(provider),false);
  }
});

test('18911 timed-out BSC switching keeps one provider request pending until settlement and ignores its late result',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  const gate=deferred(),calls=[];let chain='0x1',settlements=0,waiting=false;
  const provider={async request(args){
    calls.push(args);
    if(args.method==='eth_chainId')return chain;
    assert.equal(args.method,'wallet_switchEthereumChain');waiting=true;await gate.promise;chain='0x38';return null;
  }};
  const checking=ensureWalletBsc(provider,{timeoutMs:20,onSettled:()=>{settlements++;assert.equal(walletNetworkRequestPending(provider),false);}});
  const timedOut=assert.rejects(checking,error=>error.code==='WALLET_NETWORK_TIMEOUT');
  while(!waiting)await tick();t.mock.timers.tick(21);await timedOut;
  assert.equal(walletNetworkRequestPending(provider),true);assert.equal(settlements,0);
  await assert.rejects(ensureWalletBsc(provider,{timeoutMs:20}));
  assert.deepEqual(calls.map(call=>call.method),['eth_chainId','wallet_switchEthereumChain'],'timeout does not permit a duplicate wallet prompt');
  gate.resolve();await tick();
  assert.equal(walletNetworkRequestPending(provider),false);assert.equal(settlements,1);
  assert.equal(calls.length,2,'late switch success cannot resume a timed-out connection or perform its final read');
  await ensureWalletBsc(provider,{timeoutMs:20});
  assert.deepEqual(calls.map(call=>call.method),['eth_chainId','wallet_switchEthereumChain','eth_chainId'],'a later explicit retry may read the now-settled wallet');
});

test('18911 an unresolved network request in one provider does not lock an independent wallet',async()=>{
  const gate=deferred(),blockedCalls=[],otherCalls=[];let current=true,waiting=false;
  const blocked={async request(args){blockedCalls.push(args);waiting=true;await gate.promise;return '0x1';}};
  const other={async request(args){otherCalls.push(args);return '0x38';}};
  const checking=ensureWalletBsc(blocked,{isCurrent:()=>current}),rejection=assert.rejects(checking);
  while(!waiting)await tick();
  assert.equal(walletNetworkRequestPending(blocked),true);
  await ensureWalletBsc(other);
  assert.deepEqual(otherCalls.map(call=>call.method),['eth_chainId']);assert.equal(walletNetworkRequestPending(other),false);
  assert.equal(walletNetworkRequestPending(blocked),true);
  current=false;gate.resolve();await rejection;
  assert.deepEqual(blockedCalls.map(call=>call.method),['eth_chainId']);assert.equal(walletNetworkRequestPending(blocked),false);
});
