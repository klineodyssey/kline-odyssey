import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createKufoClient} from '../K線西遊記/temples/18911/kufo-client.mjs';

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
      if(method==='eth_chainId')return hex(h.chainId);if(method==='eth_requestAccounts'||method==='eth_accounts')return [h.account];
      if(method==='eth_getBlockByNumber')return h.blocks.get(params[0]==='latest'?h.blockNumber:Number(BigInt(params[0])))??null;
      if(method==='eth_getBlockByHash')return [...h.blocks.values()].find(b=>b.hash===params[0])??null;
      if(method==='eth_getBalance')return wei('0.5');if(method==='eth_gasPrice')return hex(50_000_000);if(method==='eth_estimateGas')return '0x100000';
      if(method==='eth_getTransactionCount')return hex(h.sends.length);
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
