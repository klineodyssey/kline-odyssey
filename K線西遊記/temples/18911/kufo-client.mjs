/** Original KUFO #637 browser client. All writes require a fresh, explicit wallet confirmation. */
export const KUFO_PENDING_KEY = 'kaios18911.pending.v1';
export const KUFO_LOCK_NAME = 'kaios18911:financial';
const ORDER = ['KUFO','KAIOSAlchemyFurnace','KUFOOutputJindouyun168888','KSHIP','KSHIPConverter'];
const ORGANS = Object.freeze({Furnace:['KAIOSAlchemyFurnace','KAIOS.ORGAN.FURNACE.18911'],Output:['KUFOOutputJindouyun168888','KAIOS.ORGAN.KUFO.OUTPUT.168888'],Converter:['KSHIPConverter','KAIOS.ORGAN.KSHIP.CONVERTER']});
const ZERO = '0x'+'0'.repeat(40), HASH = /^0x[0-9a-f]{64}$/i, HEX = /^0x(?:[0-9a-f]{2})*$/i;
const REVIEW_MS = 120000;
const VERIFY_MS = 60000, VERIFY_RPC_MS = 15000;
const RECEIPT_LOOKUP_BLOCK_LIMIT = 65536n;
const ERC20_ABI = ['function balanceOf(address) view returns(uint256)','function allowance(address,address) view returns(uint256)','function approve(address,uint256) returns(bool)','event Approval(address indexed owner,address indexed spender,uint256 value)','event Transfer(address indexed from,address indexed to,uint256 value)'];
const DESTINATION = 'KAIOS.POINT.168888.JINDOUYUN.KUFO.OUTLET';
function failure(code, message=code) { const error = new Error(message); error.code=code; return error; }
function assert(ok, code, message) { if(!ok) throw failure(code,message); }
function stable(value) { if(Array.isArray(value))return value.map(stable); if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])])); return value; }
function json(value) { return JSON.stringify(stable(value)); }
function copy(value) { return value==null?value:JSON.parse(JSON.stringify(value)); }
function lower(value) { return typeof value==='string'?value.toLowerCase():value; }
function equal(a,b) { return lower(String(a))===lower(String(b)); }
function integer(value) { try{return BigInt(value?.toString());}catch{throw failure('INVALID_INTEGER');} }
function quantity(value) { const n=integer(value);assert(n>=0n,'NEGATIVE_QUANTITY');return '0x'+n.toString(16); }
function decimal(value, name) { assert(typeof value==='string'&&/^(?:0|[1-9][0-9]*)(?:\.[0-9]{1,18})?$/.test(value),'INVALID_'+name,'請輸入一般數字，最多18位小數。'); const [a,b='']=value.split('.');return BigInt(a)*10n**18n+BigInt(b.padEnd(18,'0')); }
function normalized(value) { if(typeof value==='string'&&/^0x[0-9a-f]*$/i.test(value))return value.toLowerCase();if(Array.isArray(value))return value.map(normalized);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,normalized(value[k])]));return value; }
function sameRecord(a,b) { return json(normalized(a))===json(normalized(b)); }
function civilAt(timestamp) { let z=integer(timestamp);assert(z>=0n&&z<=2n**64n-1n,'INVALID_ACTIVATION');z=(z+28800n)/86400n+719468n;const era=z/146097n,doe=z-era*146097n,yoe=(doe-doe/1460n+doe/36524n-doe/146096n)/365n;let year=yoe+era*400n;const doy=doe-(365n*yoe+yoe/4n-yoe/100n),mp=(5n*doy+2n)/153n,day=doy-(153n*mp+2n)/5n+1n,month=mp+(mp<10n?3n:-9n);year+=month<=2n?1n:0n;return {year,month,day}; }

export function createKufoClient({provider,ethers,payload,storage,lockManager,now=()=>Date.now()}={}) {
  assert(provider&&typeof provider.request==='function','NO_PROVIDER','請先選擇本人錢包。');
  assert(ethers?.utils?.Interface&&ethers.utils.keccak256,'ETHERS5_REQUIRED');
  assert(payload?.schemaVersion===1&&payload.chainId===56,'INVALID_PAYLOAD');
  assert(storage&&typeof storage.getItem==='function'&&typeof storage.setItem==='function'&&typeof storage.removeItem==='function','STORAGE_REQUIRED');
  const E=ethers.utils, P=copy(payload), hash=value=>E.keccak256(E.toUtf8Bytes(json(value)));
  // Display labels and a later UI merge SHA must not orphan an unchanged financial intent.
  const financialPayload={schemaVersion:P.schemaVersion,chainId:P.chainId,programCommit:P.programCommit,dependencies:P.dependencies,expectedOwner:P.expectedOwner,calendar:P.calendar,contracts:P.contracts,registryABI:P.registryABI,kaiosABI:P.kaiosABI};
  const payloadHash=hash(financialPayload), evidenceKey='kaios18911.receipts.'+payloadHash+'.v1';
  const address=value=>{try{return E.getAddress(value);}catch{throw failure('INVALID_ADDRESS');}};
  const interfaces=Object.fromEntries(ORDER.map(name=>{
    const a=P.contracts?.[name];assert(a&&Array.isArray(a.abi)&&HEX.test(a.bytecode)&&a.bytecode.length>2&&HEX.test(a.deployedBytecode)&&a.deployedBytecode.length>2,'INVALID_ARTIFACT');
    if(a.creationTemplateHash)assert(equal(E.keccak256(a.bytecode),a.creationTemplateHash),'CREATION_TEMPLATE_HASH_MISMATCH');
    if(a.runtimeTemplateHash)assert(equal(E.keccak256(a.deployedBytecode),a.runtimeTemplateHash),'RUNTIME_TEMPLATE_HASH_MISMATCH');
    return [name,new E.Interface(a.abi)];
  }));
  const registryInterface=new E.Interface(P.registryABI||['function owner() view returns(address)','function minimumDelay() view returns(uint64)','function bootstrapOpen() view returns(bool)','function organ(bytes32) view returns(address)','function pendingOrgans(bytes32) view returns(address candidate,uint64 executableAt)','function proposeOrgan(bytes32,address)','function executeOrgan(bytes32)','event OrganProposed(bytes32 indexed organId,address indexed candidate,uint64 executableAt)','event OrganUpdated(bytes32 indexed organId,address indexed previousOrgan,address indexed newOrgan)']);
  const kaiosInterface=new E.Interface(P.kaiosABI||ERC20_ABI), erc20=new E.Interface(ERC20_ABI);
  const D=Object.fromEntries(['kgen','kaios','registry'].map(key=>{const value=P.dependencies?.[key];assert(value&&HASH.test(value.codeHash),'DEPENDENCY_PIN_REQUIRED');return [key,{address:address(value.address),codeHash:lower(value.codeHash)}];}));
  const expectedOwner=address(P.expectedOwner);
  assert(P.calendar?.utcOffsetSeconds===28800&&HASH.test(P.calendar.version)&&!/^0x0{64}$/i.test(P.calendar.version),'INVALID_CALENDAR');
  const months=[10,11,12,1,2,3,4,5,6,7,8,9];assert(json(P.calendar.constellationByMonth)===json(months),'INVALID_CALENDAR');
  let disposed=false, generation=0, active=false, connecting=false, review=null, config={activationTime:null}, listeners=new Set(), verifyReads=null;
  const localPending=new Map();
  let view={phase:'IDLE',status:'尚未連接；所有操作先預覽，不會自動送交易。',account:null,chainId:null,owner:null,deployments:{},chainActive:false,chainConfig:null,chainDeployments:{},alchemy:null,pending:null,blockedReasons:[],error:null,block:null,routes:{}};
  const timestamp=()=>{const value=now();assert(Number.isFinite(value)&&value>=0,'INVALID_CLOCK');return value;};
  const isVisible=()=>typeof document==='undefined'||document.visibilityState!=='hidden';
  const snapshot=()=>copy({...view,config,review,active,disposed,payloadHash,evidenceKey,blockedReasons:view.blockedReasons,blockers:view.blockedReasons});
  function publish(event) { const value=snapshot();for(const listener of listeners){try{listener(value,event);}catch{}}return value; }
  function invalidate(reason='錢包或頁面已變更，請重新預覽。') { ++generation;review=null;view.receiptCandidate=null;view.status=reason;view.phase=disposed?'DISPOSED':'STALE';publish(); }
  function current(g) { assert(!disposed&&g===generation&&isVisible(),'CONTEXT_CHANGED','錢包、設定或頁面已變更，原預覽作廢。'); }
  async function rpc(method,params=[],g=generation) {
    current(g);let result;
    if(verifyReads?.generation===g){
      const remaining=verifyReads.deadline-Date.now();assert(remaining>0,'TIMEOUT','自動唯讀查核逾時；原交易紀錄保留。');let timer;
      try{result=await Promise.race([provider.request({method,params}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(failure('TIMEOUT','唯讀核對逾時；原交易紀錄保留。')),Math.min(VERIFY_RPC_MS,remaining));})]);}
      finally{clearTimeout(timer);}
    }else result=await provider.request({method,params});
    current(g);return result;
  }
  function readStorage(key) { try{return storage.getItem(key);}catch{throw failure('STORAGE_READ_FAILED','無法讀取原交易紀錄；停止送出。');} }
  function writeStorage(key,value) { const raw=JSON.stringify(value);try{storage.setItem(key,raw);assert(storage.getItem(key)===raw,'STORAGE_READBACK_FAILED');}catch(error){if(error.code)throw error;throw failure('STORAGE_WRITE_FAILED','紀錄保存或讀回失敗；保留原交易，禁止重送。');} }
  function parseStored(raw,code) { if(raw===null)return null;try{return JSON.parse(raw);}catch{throw failure(code);} }
  function pendingRecords(raw=readStorage(KUFO_PENDING_KEY)) {
    const value=parseStored(raw,'PENDING_CORRUPT');
    const valid=item=>item?.schemaVersion===1&&typeof item.intentId==='string'&&typeof item.account==='string'&&/^0x[0-9a-f]{40}$/i.test(item.account);
    if(raw===null)return {version:1,records:{}};
    if(value?.schemaVersion===2){
      const records=value.records;
      assert(records&&typeof records==='object'&&!Array.isArray(records),'PENDING_CORRUPT');
      const entries=Object.entries(records);
      assert(entries.length&&entries.every(([key,item])=>valid(item)&&key===lower(item.account)),'PENDING_CORRUPT');
      return {version:2,records};
    }
    assert(valid(value),'PENDING_CORRUPT');
    return {version:1,records:{[lower(value.account)]:value}};
  }
  function storedPending(account,raw) {return pendingRecords(raw).records[lower(account)]||null;}
  function pending(account=view.account) {
    const {records}=pendingRecords();
    const accounts=account?[lower(account)]:[...new Set([...Object.keys(records),...localPending.keys()])];
    if(accounts.length!==1)return null;
    const key=accounts[0],saved=records[key],local=localPending.get(key);
    if(local?.hash&&saved?.intentId===local.intentId&&!saved.hash)return {...saved,hash:local.hash};
    return saved||local||null;
  }
  function writePending(item,next,{fresh=false}={}) {
    const {version,records}=pendingRecords(),key=lower(item.account),saved=records[key];
    assert(fresh?!saved:saved?.intentId===item.intentId&&saved.payloadHash===payloadHash,'PENDING_CHANGED');
    if(next)records[key]=next;
    else delete records[key];
    const remaining=Object.values(records);
    if(remaining.length){
      // Keep the original storage key so a pre-upgrade tab fails closed on a multi-account journal.
      writeStorage(KUFO_PENDING_KEY,version===2||remaining.length>1?{schemaVersion:2,records}:remaining[0]);
    }else{
      try{storage.removeItem(KUFO_PENDING_KEY);assert(storage.getItem(KUFO_PENDING_KEY)===null,'PENDING_CLEAR_FAILED');}
      catch(error){if(error.code)throw error;throw failure('PENDING_CLEAR_FAILED');}
    }
  }
  function journal() { const value=parseStored(readStorage(evidenceKey),'EVIDENCE_CORRUPT')||{schemaVersion:1,payloadHash,evidence:[]};assert(value.schemaVersion===1&&value.payloadHash===payloadHash&&Array.isArray(value.evidence)&&value.evidence.length<=10000,'EVIDENCE_CORRUPT');return value; }
  function pendingOwned(item) { assert(item,'NO_PENDING_INTENT','目前沒有原待確認交易。');assert(item.payloadHash===payloadHash&&item.chainId===56,'FOREIGN_PENDING','有其他版本的待確認交易；先回原版本核對，不可重送。');return item; }
  function changePending(item, changes) {
    const saved=storedPending(item.account);
    assert(saved?.intentId===item.intentId&&saved.payloadHash===payloadHash,'PENDING_CHANGED');
    const next={...saved,...changes};
    localPending.set(lower(item.account),next);
    writePending(item,next);
    localPending.delete(lower(item.account));
    if(!view.account||equal(view.account,item.account))view.pending=next;
    publish();
    return next;
  }
  function clearPending(item) {
    writePending(item,null);
    localPending.delete(lower(item.account));
    if(view.pending?.intentId===item.intentId)view.pending=null;
  }
  async function action(fn) { assert(!disposed,'DISPOSED');assert(!active,'BUSY','已有操作正在進行，請勿重複點按。');active=true;view.error=null;view.blockedReasons=[];publish();try{await fn(generation);}catch(error){view.error={code:typeof error.code==='string'?error.code:'PROVIDER_ERROR',message:error.message||'錢包讀查失敗。'};view.blockedReasons=[view.error.code];view.status=view.error.message;view.phase='BLOCKED';publish();throw error;}finally{active=false;publish();}return snapshot(); }
  async function call(to,iface,method,args,tag,g) { const data=iface.encodeFunctionData(method,args);const out=await rpc('eth_call',[{to,data},tag],g);try{return iface.decodeFunctionResult(method,out);}catch{throw failure('INVALID_CONTRACT_RESPONSE',method+' 回覆無法核對。');} }
  async function one(to,iface,method,args,tag,g) { return (await call(to,iface,method,args,tag,g))[0]; }
  async function identity(g,{allowDisconnected=false}={}) { const chain=integer(await rpc('eth_chainId',[],g));view.chainId=chain===56n?56:chain.toString();assert(chain===56n,'WRONG_CHAIN','請切換至 BSC 主網 56。');const accounts=await rpc('eth_accounts',[],g);if(allowDisconnected&&Array.isArray(accounts)&&accounts.length===0)return null;assert(Array.isArray(accounts)&&accounts.length&&accounts[0],'NOT_CONNECTED','請在本人錢包授權帳戶。');const account=address(accounts[0]);if(view.account&&!equal(account,view.account)){invalidate('目前帳戶已變更，請重新連接。');throw failure('ACCOUNT_CHANGED');}return account; }
  async function base(g,{allowDisconnected=false}={}) {
    view.chainActive=false;view.chainConfig=null;view.chainDeployments={};view.alchemy=null;
    const account=await identity(g,{allowDisconnected});const block=await rpc('eth_getBlockByNumber',['latest',false],g);
    assert(block&&HASH.test(block.hash)&&block.number&&block.timestamp,'INVALID_BLOCK');const tag=block.number;
    for(const key of Object.keys(D)){const code=await rpc('eth_getCode',[D[key].address,tag],g);assert(HEX.test(code)&&code!=='0x'&&equal(E.keccak256(code),D[key].codeHash),'DEPENDENCY_CODE_MISMATCH','既有 '+key+' 程式指紋不符，停止操作。');}
    const owner=address(await one(D.registry.address,registryInterface,'owner',[],tag,g));
    const delay=integer(await one(D.registry.address,registryInterface,'minimumDelay',[],tag,g));assert(delay>=3600n,'UNSAFE_REGISTRY_DELAY');
    const bootstrap=await one(D.registry.address,registryInterface,'bootstrapOpen',[],tag,g);assert(bootstrap===false,'REGISTRY_BOOTSTRAP_OPEN');
    // Exact historical KAIOS pins bind the token to this Registry and KGEN.
    if(kaiosInterface.functions['KGEN()'])assert(equal(await one(D.kaios.address,kaiosInterface,'KGEN',[],tag,g),D.kgen.address),'KAIOS_KGEN_MISMATCH');
    if(kaiosInterface.functions['ORGAN_REGISTRY()'])assert(equal(await one(D.kaios.address,kaiosInterface,'ORGAN_REGISTRY',[],tag,g),D.registry.address),'KAIOS_REGISTRY_MISMATCH');
    const routes={};for(const [name,[contract,text]]of Object.entries(ORGANS)){const key=E.id(text);const route=address(await one(D.registry.address,registryInterface,'organ',[key],tag,g));const p=await call(D.registry.address,registryInterface,'pendingOrgans',[key],tag,g);routes[name]={key,contract,address:route,pendingCandidate:address(p[0]),executableAt:p[1].toString()};}
    current(g);view={...view,account,chainId:56,owner,block:{number:tag,hash:block.hash,timestamp:integer(block.timestamp).toString()},routes};
    return {account,owner,delay:delay.toString(),block,tag,routes};
  }
  function ownerOnly(state) { assert(equal(state.owner,expectedOwner),'OWNER_CHANGED','Registry Owner 已變更；等待合法持有人重新核定。');assert(equal(state.account,state.owner),'OWNER_REQUIRED','此部署／啟用步驟需目前 Registry owner 本人錢包確認。'); }
  function validateConfig(cfg) {assert(cfg&&equal(cfg.version,P.calendar.version)&&cfg.utcOffsetSeconds===28800&&json(cfg.constellationByMonth)===json(months),'INVALID_CALENDAR');assert(typeof cfg.activationTime==='string'&&/^[1-9][0-9]*$/.test(cfg.activationTime)&&BigInt(cfg.activationTime)<=2n**64n-1n,'ACTIVATION_REQUIRED','請明確選定啟用時間，再預覽。');assert(civilAt(cfg.activationTime).year<=4294967292n,'CALENDAR_IDENTIFIER_OVERFLOW');return cfg;}
  function selectedConfig() { return validateConfig({version:P.calendar.version,activationTime:config.activationTime,utcOffsetSeconds:28800,constellationByMonth:months}); }
  function calendarHash(cfg) { return E.keccak256(E.defaultAbiCoder.encode(['bytes32','uint64','int32','uint8[12]'],[cfg.version,cfg.activationTime,28800,months])); }
  function constructorArgs(name,cfg,deployed) {validateConfig(cfg);const addr=n=>{assert(deployed[n]?.address,'PREDECESSOR_REQUIRED');return deployed[n].address;};switch(name){case 'KUFO':return [D.registry.address,D.kaios.address,cfg];case 'KAIOSAlchemyFurnace':return [D.kaios.address,D.kgen.address,D.registry.address,addr('KUFO')];case 'KUFOOutputJindouyun168888':return [addr('KAIOSAlchemyFurnace'),addr('KUFO')];case 'KSHIP':return [D.registry.address,addr('KUFO')];case 'KSHIPConverter':return [addr('KUFO'),addr('KSHIP')];default:throw failure('UNKNOWN_CONTRACT');} }
  function deploymentData(name,cfg,deployed) { return P.contracts[name].bytecode+interfaces[name].encodeDeploy(constructorArgs(name,cfg,deployed)).slice(2); }
  function maskRuntime(code,artifact) { assert(HEX.test(code),'INVALID_RUNTIME');const bytes=ethers.utils.arrayify(code);const used=new Set();for(const refs of Object.values(artifact.immutableReferences||{})){let word=null;for(const ref of refs){assert(Number.isSafeInteger(ref.start)&&ref.start>=0&&ref.length===32&&ref.start+ref.length<=bytes.length,'INVALID_IMMUTABLE_REFERENCE');const actual=E.hexlify(bytes.slice(ref.start,ref.start+ref.length));assert(word===null||equal(word,actual),'INCONSISTENT_IMMUTABLE_WORD');word=actual;for(let i=ref.start;i<ref.start+ref.length;i++){assert(!used.has(i),'OVERLAPPING_IMMUTABLE_REFERENCE');used.add(i);bytes[i]=0;}}}return E.hexlify(bytes); }
  async function getters(name,to,cfg,deployed,tag,g) {
    validateConfig(cfg);
    const check=async(method,expected,args=[])=>{const actual=await one(to,interfaces[name],method,args,tag,g);assert(equal(actual,expected),'IMMUTABLE_GETTER_MISMATCH',name+'.'+method+' 不符。');};
    if(name==='KUFO'){
      await check('organRegistry',D.registry.address);await check('kaios',D.kaios.address);await check('calendarVersion',cfg.version);await check('calendarHash',calendarHash(cfg));await check('activationTime',cfg.activationTime);await check('utcOffsetSeconds',28800);
      const date=await call(to,interfaces[name],'civilDate',[cfg.activationTime],tag,g),expected=civilAt(cfg.activationTime),year=integer(date[0]),month=integer(date[1]);
      assert(year===expected.year&&month===expected.month&&integer(date[2])===expected.day&&year<=4294967292n,'INVALID_CALENDAR_RESPONSE');await check('firstBirthYear',year);await check('firstBirthMonth',month);
      const maximum=(4294967292n-year+1n)*12n;await check('maximumGroupId',maximum<4294967295n?maximum:4294967295n);
      const c=await one(to,interfaces[name],'calendarConfig',[],tag,g);assert(equal(c.version??c[0],cfg.version)&&integer(c.activationTime??c[1])===BigInt(cfg.activationTime)&&integer(c.utcOffsetSeconds??c[2])===28800n&&Array.from(c.constellationByMonth??c[3],Number).join(',')===months.join(','),'CALENDAR_CONFIG_MISMATCH');
      await check('cap',72000000000000n*10n**18n);
    }else if(name==='KAIOSAlchemyFurnace'){await check('kaios',D.kaios.address);await check('kgen',D.kgen.address);await check('organRegistry',D.registry.address);await check('canonicalKufo',deployed.KUFO.address);}
    else if(name==='KUFOOutputJindouyun168888'){await check('furnace',deployed.KAIOSAlchemyFurnace.address);await check('kufo',deployed.KUFO.address);}
    else if(name==='KSHIP'){await check('organRegistry',D.registry.address);await check('kufo',deployed.KUFO.address);await check('cap',72000000000000000n*10n**18n);}
    else {await check('kufo',deployed.KUFO.address);await check('kship',deployed.KSHIP.address);}
  }
  function findEvent(receipt,to,iface,name,predicate) { const matches=[];for(const log of receipt.logs||[]){if(!equal(log.address,to))continue;assert(log.removed!==true,'REMOVED_EVENT');if(log.transactionHash)assert(equal(log.transactionHash,receipt.transactionHash),'EVENT_TRANSACTION_MISMATCH');if(log.blockHash)assert(equal(log.blockHash,receipt.blockHash),'EVENT_BLOCK_MISMATCH');try{const p=iface.parseLog(log);if(p.name===name&&predicate(p.args))matches.push(p.args);}catch(error){if(error.code&&['REMOVED_EVENT','EVENT_TRANSACTION_MISMATCH','EVENT_BLOCK_MISMATCH'].includes(error.code))throw error;}}
    assert(matches.length===1,'RECEIPT_EVENT_MISMATCH','原交易事件不完整或無法唯一歸屬：'+name);return matches[0]; }
  async function verifyTransaction(item,g,deployed={}) {
    pendingOwned(item);assert(['deploy','propose','execute','approve','burn'].includes(item.kind),'UNKNOWN_INTENT_KIND');
    // Reconstruct the allowed call, rather than accepting arbitrary saved calldata.
    let expectedData,expectedTo;
    if(item.kind==='deploy'){assert(ORDER.includes(item.contract),'UNKNOWN_CONTRACT');expectedData=deploymentData(item.contract,item.config,deployed);expectedTo=null;}
    else if(item.kind==='propose'||item.kind==='execute'){const spec=ORGANS[item.organ];assert(spec&&equal(item.organKey,E.id(spec[1]))&&equal(item.candidate,deployed[spec[0]]?.address),'INVALID_ORGAN_INTENT');expectedTo=D.registry.address;expectedData=registryInterface.encodeFunctionData(item.kind==='propose'?'proposeOrgan':'executeOrgan',item.kind==='propose'?[item.organKey,item.candidate]:[item.organKey]);}
    else if(item.kind==='approve'){expectedTo=D.kaios.address;assert(equal(item.spender,item.deploymentAddresses?.KAIOSAlchemyFurnace),'INVALID_APPROVAL_INTENT');expectedData=erc20.encodeFunctionData('approve',[item.spender,item.amountWei]);}
    else {expectedTo=item.deploymentAddresses?.KAIOSAlchemyFurnace;assert(expectedTo&&HASH.test(item.lifeId),'INVALID_BURN_INTENT');expectedData=interfaces.KAIOSAlchemyFurnace.encodeFunctionData('burnForKufo',[item.amountWei,item.account,item.lifeId]);}
    assert(equal(item.tx.data,expectedData)&&(expectedTo?equal(item.tx.to,expectedTo):!item.tx.to)&&integer(item.tx.value)===0n&&equal(item.tx.from,item.account),'SAVED_INTENT_MISMATCH');
    assert(HASH.test(item.hash),'SUBMISSION_UNKNOWN','原錢包送出狀態未知，保留紀錄，禁止重送。');
    const receipt=await rpc('eth_getTransactionReceipt',[item.hash],g);if(!receipt)return null;
    const tx=await rpc('eth_getTransactionByHash',[item.hash],g);if(!tx)return null;
    assert(equal(receipt.transactionHash,item.hash)&&equal(tx.hash,item.hash)&&equal(tx.from,item.account),'TRANSACTION_IDENTITY_MISMATCH');
    assert(equal(receipt.from,tx.from)&&(tx.to===null?receipt.to===null:equal(receipt.to,tx.to)),'RECEIPT_TRANSACTION_MISMATCH');
    assert(equal(tx.input??tx.data,item.tx.data)&&integer(tx.value)===0n,'TRANSACTION_INTENT_MISMATCH');
    assert(item.tx.to?equal(tx.to,item.tx.to):tx.to===null,'TRANSACTION_TARGET_MISMATCH');
    if(tx.chainId!=null)assert(integer(tx.chainId)===56n,'TRANSACTION_CHAIN_MISMATCH');
    assert(receipt.blockNumber!=null&&HASH.test(receipt.blockHash),'RECEIPT_BLOCK_REQUIRED');
    const block=await rpc('eth_getBlockByNumber',[receipt.blockNumber,false],g);assert(block&&equal(block.hash,receipt.blockHash)&&integer(block.number)===integer(receipt.blockNumber),'NON_CANONICAL_RECEIPT');
    assert(equal(tx.blockHash,receipt.blockHash)&&integer(tx.blockNumber)===integer(receipt.blockNumber),'TRANSACTION_BLOCK_MISMATCH');
    const status=integer(receipt.status);assert(status===0n||status===1n,'INVALID_RECEIPT_STATUS');
    const evidence={intent:copy(item),transaction:tx,receipt,block,verification:{status:status===0n?'CONFIRMED_REVERTED':'CONFIRMED'}};
    if(status===0n)return evidence;
    if(item.kind==='deploy'){
      assert(ORDER.includes(item.contract)&&receipt.contractAddress,'DEPLOYMENT_ADDRESS_MISSING');const to=address(receipt.contractAddress);
      assert(equal(to,E.getContractAddress({from:item.account,nonce:tx.nonce})),'DEPLOYMENT_ADDRESS_MISMATCH');
      assert(equal(item.tx.data,deploymentData(item.contract,item.config,deployed)),'CREATION_CALLDATA_MISMATCH');
      const artifact=P.contracts[item.contract],code=await rpc('eth_getCode',[to,receipt.blockNumber],g);
      assert(code.length===artifact.deployedBytecode.length&&equal(maskRuntime(code,artifact),maskRuntime(artifact.deployedBytecode,artifact)),'DEPLOYED_RUNTIME_MISMATCH');
      await getters(item.contract,to,item.config,deployed,receipt.blockNumber,g);evidence.verification={status:'VERIFIED_DEPLOYMENT',contract:item.contract,address:to};
    }else if(item.kind==='propose'){
      const event=findEvent(receipt,D.registry.address,registryInterface,'OrganProposed',a=>equal(a.organId??a[0],item.organKey)&&equal(a.candidate??a[1],item.candidate));
      const eta=integer(event.executableAt??event[2]);assert(eta===integer(block.timestamp)+BigInt(item.minimumDelay),'PROPOSAL_DELAY_MISMATCH');evidence.verification.executableAt=eta.toString();
    }else if(item.kind==='execute'){
      findEvent(receipt,D.registry.address,registryInterface,'OrganUpdated',a=>equal(a.organId??a[0],item.organKey)&&equal(a.newOrgan??a[2],item.candidate));
      assert(equal(await one(D.registry.address,registryInterface,'organ',[item.organKey],receipt.blockNumber,g),item.candidate),'REGISTRY_ROUTE_MISMATCH');
    }else if(item.kind==='approve'){
      findEvent(receipt,D.kaios.address,erc20,'Approval',a=>equal(a.owner??a[0],item.account)&&equal(a.spender??a[1],item.spender)&&integer(a.value??a[2])===BigInt(item.amountWei));
      // Later transactions in the same block may already consume this allowance.
      // The exact call/event proves this approval; a new burn always reads current allowance.
    }else if(item.kind==='burn'){
      const d=item.deploymentAddresses,amount=BigInt(item.amountWei),output=amount*1000n;
      const event=findEvent(receipt,d.KAIOSAlchemyFurnace,interfaces.KAIOSAlchemyFurnace,'ImmediateAlchemyCreated',a=>equal(a.owner??a[1],item.account)&&equal(a.beneficiary??a[2],item.account)&&integer(a.kaiosBurned??a[3])===amount&&integer(a.kufoAmount??a[4])===output&&equal(a.destinationCode??a[5],E.id(DESTINATION)));
      const proofId=event.proofId??event[0];
      findEvent(receipt,d.KAIOSAlchemyFurnace,interfaces.KAIOSAlchemyFurnace,'KgenBalanceVerified',a=>equal(a.proofId??a[0],proofId)&&equal(a.owner??a[1],item.account)&&integer(a.requiredKgenBalance??a[3])===amount/1000n&&integer(a.observedKgenBalance??a[2])>=amount/1000n);
      findEvent(receipt,D.kaios.address,erc20,'Transfer',a=>equal(a.from??a[0],item.account)&&equal(a.to??a[1],ZERO)&&integer(a.value??a[2])===amount);
      findEvent(receipt,D.kaios.address,kaiosInterface,'KAIOSBurnedForAlchemy',a=>equal(a.alchemyProofId??a[1],proofId)&&equal(a.owner??a[2],item.account)&&equal(a.beneficiary??a[3],item.account)&&equal(a.furnace??a[4],d.KAIOSAlchemyFurnace)&&integer(a.kaiosBurned??a[5])===amount&&integer(a.expectedKufo??a[6])===output&&equal(a.lifeId??a[7],item.lifeId));
      findEvent(receipt,d.KAIOSAlchemyFurnace,interfaces.KAIOSAlchemyFurnace,'ImmediateAlchemyConsumed',a=>equal(a.proofId??a[0],proofId)&&equal(a.beneficiary??a[1],item.account)&&integer(a.kufoAmount??a[2])===output);
      const mint=findEvent(receipt,d.KUFO,interfaces.KUFO,'ImmediateAlchemyMinted',a=>equal(a.proofId??a[0],proofId)&&equal(a.beneficiary??a[2],item.account)&&integer(a.kufoAmount??a[3])===output&&integer(a.bornAt??a[4])===integer(block.timestamp));
      findEvent(receipt,d.KUFO,erc20,'Transfer',a=>equal(a.from??a[0],ZERO)&&equal(a.to??a[1],item.account)&&integer(a.value??a[2])===output);
      findEvent(receipt,d.KUFOOutputJindouyun168888,interfaces.KUFOOutputJindouyun168888,'KUFOReleased',a=>equal(a.proofId??a[0],proofId)&&equal(a.beneficiary??a[1],item.account)&&integer(a.amount??a[2])===output&&integer(a.groupId??a[3])===integer(mint.groupId??mint[1]));
      assert(await one(d.KUFO,interfaces.KUFO,'proofMinted',[proofId],receipt.blockNumber,g)===true,'MINT_PROOF_MISSING');
      const origin=await one(d.KUFO,interfaces.KUFO,'mintOrigin',[proofId],receipt.blockNumber,g);
      assert(equal(origin.beneficiary??origin[0],item.account)&&integer(origin.amount??origin[1])===output&&integer(origin.bornAt??origin[2])===integer(block.timestamp)&&integer(origin.groupId??origin[7])===integer(mint.groupId??mint[1])&&equal(origin.calendarHash??origin[8],calendarHash(item.config)),'MINT_ORIGIN_MISMATCH');
      const date=civilAt(block.timestamp);assert(integer(origin.birthYear??origin[3])===date.year&&integer(origin.birthMonth??origin[4])===date.month&&integer(origin.birthTierId??origin[5])===date.month&&integer(origin.birthConstellation??origin[6])===BigInt(months[Number(date.month)-1]),'BIRTH_CLASSIFICATION_MISMATCH');
      const burnRecord=await one(D.kaios.address,kaiosInterface,'alchemyBurnRecord',[proofId],receipt.blockNumber,g);
      assert(equal(burnRecord.owner??burnRecord[0],item.account)&&equal(burnRecord.beneficiary??burnRecord[1],item.account)&&equal(burnRecord.furnace??burnRecord[2],d.KAIOSAlchemyFurnace)&&integer(burnRecord.kaiosBurned??burnRecord[3])===amount&&integer(burnRecord.expectedKufo??burnRecord[4])===output&&equal(burnRecord.lifeId??burnRecord[5],item.lifeId)&&equal(burnRecord.destinationCode??burnRecord[6],E.id(DESTINATION))&&integer(burnRecord.blockNumber??burnRecord[7])===integer(receipt.blockNumber)&&integer(burnRecord.timestamp??burnRecord[8])===integer(block.timestamp),'CANONICAL_BURN_RECORD_MISMATCH');
      evidence.verification={status:'VERIFIED_ALCHEMY',proofId,beneficiary:item.account,kaiosBurned:item.amountWei,kufoMinted:output.toString()};
    }else throw failure('UNKNOWN_INTENT_KIND');
    current(g);return evidence;
  }
  async function deployments(g) {
    const records=journal().evidence.filter(x=>x.intent?.kind==='deploy'&&x.verification?.status==='VERIFIED_DEPLOYMENT');const deployed={};
    assert(records.length<=5,'DUPLICATE_DEPLOYMENT_EVIDENCE');
    for(let i=0;i<records.length;i++){
      const record=records[i];assert(record.intent.contract===ORDER[i]&&record.intent.payloadHash===payloadHash,'DEPLOYMENT_SEQUENCE_MISMATCH');
      const checked=await verifyTransaction(record.intent,g,deployed);assert(checked?.verification.status==='VERIFIED_DEPLOYMENT','DEPLOYMENT_REVALIDATION_FAILED');
      assert(equal(checked.verification.address,record.verification.address),'DEPLOYMENT_EVIDENCE_CHANGED');
      if(i===0){config={activationTime:record.intent.config.activationTime};}else assert(sameRecord(record.intent.config,records[0].intent.config),'DEPLOYMENT_CONFIG_CHANGED');
      deployed[ORDER[i]]={address:checked.verification.address,txHash:record.intent.hash,blockNumber:checked.receipt.blockNumber};
      // A verified historical creation cannot substitute for current code/immutable identity.
      const currentCode=await rpc('eth_getCode',[checked.verification.address,'latest'],g);const artifact=P.contracts[ORDER[i]];
      assert(currentCode.length===artifact.deployedBytecode.length&&equal(maskRuntime(currentCode,artifact),maskRuntime(artifact.deployedBytecode,artifact)),'CURRENT_RUNTIME_MISMATCH');
      await getters(ORDER[i],checked.verification.address,record.intent.config,deployed,'latest',g);
    }
    view.deployments=deployed;return deployed;
  }
  async function runtimeAt(name,to,tag,g) { const artifact=P.contracts[name],code=await rpc('eth_getCode',[to,tag],g);assert(code.length===artifact.deployedBytecode.length&&equal(maskRuntime(code,artifact),maskRuntime(artifact.deployedBytecode,artifact)),'DEPLOYED_RUNTIME_MISMATCH',name+' 尚未對應本版程式；不使用舊煉丹爐。'); }
  async function discover(state,g) {
    view.chainActive=false;view.chainConfig=null;view.chainDeployments={};view.alchemy=null;
    if(Object.values(state.routes).some(x=>equal(x.address,ZERO)))return null;
    const d={};for(const [organ,[name]]of Object.entries(ORGANS)){d[name]={address:state.routes[organ].address,source:'VERIFIED_CHAIN_ROUTES'};await runtimeAt(name,d[name].address,state.tag,g);}
    d.KUFO={address:address(await one(d.KAIOSAlchemyFurnace.address,interfaces.KAIOSAlchemyFurnace,'canonicalKufo',[],state.tag,g)),source:'VERIFIED_CHAIN_ROUTES'};
    d.KSHIP={address:address(await one(d.KSHIPConverter.address,interfaces.KSHIPConverter,'kship',[],state.tag,g)),source:'VERIFIED_CHAIN_ROUTES'};
    await runtimeAt('KUFO',d.KUFO.address,state.tag,g);await runtimeAt('KSHIP',d.KSHIP.address,state.tag,g);
    const c=await one(d.KUFO.address,interfaces.KUFO,'calendarConfig',[],state.tag,g),cfg={version:c.version??c[0],activationTime:(c.activationTime??c[1]).toString(),utcOffsetSeconds:Number(c.utcOffsetSeconds??c[2]),constellationByMonth:Array.from(c.constellationByMonth??c[3],Number)};
    assert(equal(cfg.version,P.calendar.version)&&BigInt(cfg.activationTime)>0n&&cfg.utcOffsetSeconds===28800&&cfg.constellationByMonth.join(',')===months.join(','),'CHAIN_CALENDAR_MISMATCH');
    for(const name of ORDER)await getters(name,d[name].address,cfg,d,state.tag,g);
    current(g);view.chainActive=true;view.chainConfig=cfg;view.chainDeployments=d;
    if(state.account){
      const balances=await Promise.all([one(D.kaios.address,erc20,'balanceOf',[state.account],state.tag,g),one(D.kgen.address,erc20,'balanceOf',[state.account],state.tag,g),one(d.KUFO.address,erc20,'balanceOf',[state.account],state.tag,g),one(D.kaios.address,erc20,'allowance',[state.account,d.KAIOSAlchemyFurnace.address],state.tag,g)]);
      view.alchemy={active:true,kaiosBalanceWei:balances[0].toString(),kgenBalanceWei:balances[1].toString(),kufoBalanceWei:balances[2].toString(),allowanceWei:balances[3].toString(),spender:d.KAIOSAlchemyFurnace.address,source:'VERIFIED_CHAIN_ROUTES'};
    }
    return {deployments:d,config:cfg};
  }
  async function candidate(request,state,deployed,g) {
    assert(request&&['deploy','propose','execute','approve','burn'].includes(request.kind),'INVALID_KIND');
    const player=request.kind==='approve'||request.kind==='burn';if(!player)ownerOnly(state);
    const chain=(player||request.kind==='deploy')?await discover(state,g):null;
    if(request.kind==='deploy')assert(!chain,'ALREADY_DEPLOYED','鏈上同版五合約已啟用，不重複部署。');
    if(player){assert(chain,'NOT_ACTIVATED','新版煉丹路由尚未啟用；不使用舊煉丹爐。');deployed=chain.deployments;}
    const cfg=player?chain.config:selectedConfig(),tx={from:state.account,value:'0x0',chainId:'0x38'},item={kind:request.kind,config:cfg,account:state.account};
    if(request.kind==='deploy'){
      ownerOnly(state);const name=ORDER[Object.keys(deployed).length];assert(name,'ALL_DEPLOYMENTS_VERIFIED','五合約已驗證部署；下一步檢查原 Registry 啟用。');if(request.contract)assert(request.contract===name,'DEPLOYMENT_SEQUENCE_MISMATCH');item.contract=name;tx.data=deploymentData(name,cfg,deployed);
    }else if(request.kind==='propose'||request.kind==='execute'){
      ownerOnly(state);const spec=ORGANS[request.organ];assert(spec,'INVALID_ORGAN','只接受 Furnace／Output／Converter 原三個器官。');assert(Object.keys(deployed).length===5,'DEPLOYMENTS_REQUIRED');
      const route=state.routes[request.organ],to=deployed[spec[0]].address;item.organ=request.organ;item.organKey=route.key;item.candidate=to;item.minimumDelay=state.delay;
      assert(!equal(route.address,to),'ALREADY_ACTIVATED','此器官已啟用，不需重送。');
      if(request.kind==='propose'){assert(equal(route.pendingCandidate,ZERO),'EXISTING_PROPOSAL','已有原提案，先核對，不覆寫。');tx.to=D.registry.address;tx.data=registryInterface.encodeFunctionData('proposeOrgan',[route.key,to]);}
      else{assert(equal(route.pendingCandidate,to),'PROPOSAL_CANDIDATE_MISMATCH');assert(BigInt(route.executableAt)>0n&&integer(state.block.timestamp)>=BigInt(route.executableAt),'TIMELOCK_WAIT','提案尚未到可執行時間。');tx.to=D.registry.address;tx.data=registryInterface.encodeFunctionData('executeOrgan',[route.key]);}
    }else{
      assert(Object.keys(deployed).length===5,'DEPLOYMENTS_REQUIRED','新版五合約尚未全部驗證，不能改用舊煉丹爐。');
      for(const [organ,[name]]of Object.entries(ORGANS))assert(equal(state.routes[organ].address,deployed[name].address),'NOT_ACTIVATED','新版 '+organ+' 尚未正式啟用。');
      const amount=decimal(request.amount,'AMOUNT');assert(amount>=1000n&&amount%1000n===0n,'INVALID_ALCHEMY_RATIO','KAIOS 數量須符合原合約最小值與精確比例。');
      assert(amount*1000n<=72000000000000n*10n**18n,'AMOUNT_EXCEEDS_KUFO_CAP');
      assert(BigInt(view.alchemy.kaiosBalanceWei)>=amount,'KAIOS_BALANCE_INSUFFICIENT');
      assert(BigInt(view.alchemy.kgenBalanceWei)>=amount/1000n,'KGEN_BALANCE_INSUFFICIENT','KGEN 餘額資格不足；不扣除 KGEN。');
      item.amountWei=amount.toString();item.spender=deployed.KAIOSAlchemyFurnace.address;item.deploymentAddresses=Object.fromEntries(ORDER.map(n=>[n,deployed[n].address]));
      if(request.kind==='approve'){tx.to=D.kaios.address;tx.data=erc20.encodeFunctionData('approve',[item.spender,item.amountWei]);}
      else{
        assert(HASH.test(request.lifeId),'LIFE_ID_REQUIRED','請提供原 lifeId bytes32；不會建立或替換生命身份。');item.lifeId=request.lifeId;
        assert(BigInt(view.alchemy.allowanceWei)>=amount,'ALLOWANCE_REQUIRED','請先由本人核准這次確切 KAIOS 數量。');
        const minted=integer(await one(deployed.KUFO.address,interfaces.KUFO,'totalMintedFromAlchemy',[],state.tag,g));assert(minted+amount*1000n<=72000000000000n*10n**18n,'KUFO_LIFETIME_CAP');
        assert(integer(state.block.timestamp)>=BigInt(cfg.activationTime),'NOT_ACTIVE_YET');tx.to=item.spender;tx.data=interfaces.KAIOSAlchemyFurnace.encodeFunctionData('burnForKufo',[item.amountWei,state.account,item.lifeId]);
      }
    }
    item.tx=tx;return item;
  }
  async function quote(item,g) { const gas=integer(await rpc('eth_estimateGas',[item.tx],g)),price=integer(await rpc('eth_gasPrice',[],g));assert(gas>0n&&price>0n,'INVALID_FEE_QUOTE');const balance=integer(await rpc('eth_getBalance',[item.account,'latest'],g));return {gasLimit:gas.toString(),gasPriceWei:price.toString(),maxCostWei:(gas*price).toString(),nativeBalanceWei:balance.toString()}; }
  async function finalGuard(item,g) {
    assert(equal(await identity(g),item.account),'ACCOUNT_CHANGED');
    if(['deploy','propose','execute'].includes(item.kind)){
      const owner=await one(D.registry.address,registryInterface,'owner',[],'latest',g);assert(equal(owner,expectedOwner)&&equal(owner,item.account),'OWNER_CHANGED');
      if(item.organ){const p=await call(D.registry.address,registryInterface,'pendingOrgans',[item.organKey],'latest',g);assert(item.kind==='propose'?equal(p[0],ZERO):equal(p[0],item.candidate),'PENDING_PROPOSAL_CHANGED');}
    }else for(const [organ,[name,text]]of Object.entries(ORGANS)){const route=await one(D.registry.address,registryInterface,'organ',[E.id(text)],'latest',g);assert(equal(route,item.deploymentAddresses[name]),'REGISTRY_ROUTE_CHANGED',organ+' 路由已變更，請重新預覽。');}
    current(g);
  }
  function uniqueId() { return E.hexlify(E.randomBytes(32)); }
  function restorePendingView(account=view.account) {const item=pending(account);view.pending=item;if(item?.payloadHash===payloadHash&&item.config?.activationTime)config={activationTime:item.config.activationTime};return item;}
  async function refreshInner(g,{allowDisconnected=false}={}) {review=null;const state=await base(g,{allowDisconnected});await deployments(g);await discover(state,g);restorePendingView();view.phase=view.pending?'PENDING':state.account?'CONNECTED':'PUBLIC_VERIFIED';view.status=view.pending?'已有待確認交易；只核對原回執，不重送。':view.chainActive?state.account?'新版煉丹路由已核對；可由玩家本人預覽。':'新版五合約與路由已公開唯讀核對；本人操作前仍須連接錢包。':'既有依賴已讀查；新版五合約／路由尚未全部啟用。';return publish(); }
  async function resumeInner(g,state) {
    review=null;const item=pendingOwned(restorePendingView());assert(state.account&&equal(state.account,item.account),'PENDING_ACCOUNT_MISMATCH','請使用原交易帳戶核對；原紀錄保留。');
    const d=await deployments(g);const evidence=await verifyTransaction(item,g,d);if(!evidence){view.phase='PENDING';view.status='原交易仍待確認；不重送，稍後由本人再核對。';return publish();}
    return finishEvidence(item,evidence,d,g);
  }
  function finishEvidence(item,evidence,d,g) {
    current(g);assert(sameRecord(pending(item.account),item),'PENDING_CHANGED');const saved=journal(),existing=saved.evidence.find(x=>equal(x.intent?.hash,item.hash));
    if(existing)assert(sameRecord({...existing,verifiedAt:undefined},{...evidence,verifiedAt:undefined}),'EVIDENCE_CONFLICT');else saved.evidence.push({...evidence,verifiedAt:timestamp()});
    writeStorage(evidenceKey,saved);current(g);assert(sameRecord(pending(item.account),item),'PENDING_CHANGED');clearPending(item);
    if(evidence.verification.status==='VERIFIED_DEPLOYMENT')view.deployments={...d,[item.contract]:{address:evidence.verification.address,txHash:item.hash,blockNumber:evidence.receipt.blockNumber}};
    view.phase=evidence.verification.status;view.status=evidence.verification.status==='CONFIRMED_REVERTED'?'原交易已確認失敗，證據已保存；請重新核對原因後再手動預覽。':'原交易與完整證據已保存並讀回；下一步仍須本人重新預覽。';
    const {status,kufoMinted}=evidence.verification;
    if((item.kind==='burn'&&status==='VERIFIED_ALCHEMY')||(item.kind==='approve'&&status==='CONFIRMED')){
      return publish(Object.freeze({type:'playerReceiptVerified',account:item.account,kind:item.kind,kufoMinted}));
    }
    return publish();
  }
  async function recoveryAssurance(item,evidence,g) {
    if(item.submissionAnchor){
      const anchor=item.submissionAnchor;
      assert(HASH.test(anchor.hash)&&anchor.number!=null&&anchor.timestamp!=null&&integer(anchor.number)>=0n&&integer(anchor.timestamp)>0n,'INVALID_SUBMISSION_ANCHOR');
      const block=await rpc('eth_getBlockByNumber',[quantity(anchor.number),false],g);
      assert(block&&equal(block.hash,anchor.hash)&&integer(block.number)===integer(anchor.number)&&integer(block.timestamp)===integer(anchor.timestamp),'NON_CANONICAL_SUBMISSION_ANCHOR','原送出前區塊已無法核實；保留待確認紀錄。');
      assert(integer(evidence.receipt.blockNumber)>integer(anchor.number),'RECOVERY_BEFORE_SUBMISSION','候選回執早於原送出前區塊；不能取代原交易。');
      return 'ANCHORED_HOLDER_ATTESTED';
    }
    // Old v1 intents have no cryptographic link to a unique wallet request.
    // The holder must attest the original hash; the saved clock only rejects older receipts.
    assert(Number.isSafeInteger(item.createdAt)&&item.createdAt>0&&item.createdAt<=timestamp(),'LEGACY_RECOVERY_UNBOUNDED','原紀錄缺少可核對的送出時間界限；保留未知狀態，不能解鎖重送。');
    assert(integer(evidence.block.timestamp)>=BigInt(Math.floor(item.createdAt/1000)),'RECOVERY_BEFORE_SUBMISSION','候選回執早於原交易紀錄；不能取代原交易。');
    return 'LEGACY_HOLDER_ATTESTED_CLOCK_BOUND';
  }
  async function locatePlayerReceipt(item,g) {
    const anchor=item.submissionAnchor;
    if(item.hash||!['approve','burn'].includes(item.kind)||!HASH.test(anchor?.hash))return null;
    const start=integer(anchor.number);
    if(start<0n||integer(anchor.timestamp)<=0n)return null;
    const account=await identity(g);
    assert(equal(account,item.account),'PENDING_ACCOUNT_MISMATCH','請使用原交易帳戶核對；原紀錄保留。');
    const [anchorBlock,head]=await Promise.all([
      rpc('eth_getBlockByNumber',[quantity(start),false],g),
      rpc('eth_getBlockByNumber',['latest',false],g),
    ]);
    if(!anchorBlock||!equal(anchorBlock.hash,anchor.hash)||integer(anchorBlock.number)!==start||
       integer(anchorBlock.timestamp)!==integer(anchor.timestamp)||!HASH.test(head?.hash))return null;
    const end=integer(head.number);
    if(end<=start||end-start>RECEIPT_LOOKUP_BLOCK_LIMIT)return null;
    const nonceAt=async number=>integer(await rpc('eth_getTransactionCount',[account,quantity(number)],g));
    const [before,after]=await Promise.all([nonceAt(start),nonceAt(end)]);
    // An exact call is only a candidate. Do not guess when the account sent more than one transaction.
    if(before<0n||after!==before+1n)return null;
    let low=start,high=end;
    while(high-low>1n){
      const middle=(low+high)/2n,count=await nonceAt(middle);
      if(count===before)low=middle;
      else if(count===after)high=middle;
      else return null;
    }
    const block=await rpc('eth_getBlockByNumber',[quantity(high),true],g);
    if(!HASH.test(block?.hash)||integer(block.number)!==high||!Array.isArray(block.transactions))return null;
    const matches=block.transactions.filter(tx=>HASH.test(tx?.hash)&&equal(tx.from,account)&&
      equal(tx.to,item.tx.to)&&equal(tx.input??tx.data,item.tx.data)&&integer(tx.value)===0n&&integer(tx.nonce)===before);
    if(matches.length!==1)return null;
    const hash=matches[0].hash;
    if(journal().evidence.some(entry=>equal(entry.intent?.hash,hash)))return null;
    const evidence=await verifyTransaction({...item,hash},g);
    if(!evidence||!equal(evidence.receipt.blockHash,block.hash)||integer(evidence.transaction.nonce)!==before)return null;
    const pinnedHead=await rpc('eth_getBlockByNumber',[quantity(end),false],g);
    if(!pinnedHead||!equal(pinnedHead.hash,head.hash))return null;
    await recoveryAssurance(item,evidence,g);
    assert(equal(await identity(g),item.account)&&sameRecord(pending(item.account),item),'PENDING_CHANGED','原帳戶或交易已變更，保留原紀錄。');
    return {intentId:item.intentId,hash,kind:item.kind,status:evidence.verification.status,amountWei:item.amountWei};
  }
  async function boundedRead(g,fn) {
    const scope={generation:g,deadline:Date.now()+VERIFY_MS};verifyReads=scope;
    try{return await fn();}finally{if(verifyReads===scope)verifyReads=null;}
  }
  async function withLock(fn) {assert(lockManager&&typeof lockManager.request==='function','WEB_LOCKS_REQUIRED','此瀏覽器缺少安全跨分頁鎖；不送交易。');return lockManager.request(KUFO_LOCK_NAME,{mode:'exclusive',ifAvailable:true},async lock=>{assert(lock,'ANOTHER_TAB_ACTIVE','另一分頁正在處理錢包操作。');return fn();});}
  const events=[];
  if(typeof provider.on==='function')for(const type of ['accountsChanged','chainChanged','disconnect']){
    const listener=accounts=>{
      if(!(connecting&&type==='accountsChanged'))invalidate('錢包連線已變更，請重新連接並預覽；原交易保留。');
      view.account=null;view.chainId=null;
      // Tell the panel a published account is available, without trusting that event as wallet identity.
      const visibleAccountChange=type==='accountsChanged'&&!connecting&&Array.isArray(accounts)&&accounts.length>0;
      publish(visibleAccountChange?'accountsChanged':undefined);
    };
    provider.on(type,listener);events.push([type,listener]);
  }
  const visibility=()=>{if(!isVisible())invalidate('頁面進入背景；不自動接續送出，請返回後重新預覽。');};
  if(typeof document!=='undefined')document.addEventListener('visibilitychange',visibility);
  try{restorePendingView();}catch(error){view.error={code:error.code,message:error.message};view.blockedReasons=[error.code];view.phase='BLOCKED';}
  return Object.freeze({
    snapshot,
    exportEvidence(){return copy({snapshot:snapshot(),journal:journal(),pending:pending()});},
    invalidate(reason){invalidate(reason);return snapshot();},
    subscribe(listener){assert(typeof listener==='function','INVALID_LISTENER');listeners.add(listener);try{listener(snapshot());}catch{}return ()=>listeners.delete(listener);},
    async connect(){return action(async g=>{review=null;connecting=true;try{const accounts=await rpc('eth_requestAccounts',[],g);assert(Array.isArray(accounts)&&accounts.length,'NOT_CONNECTED');view.account=address(accounts[0]);}finally{connecting=false;}return refreshInner(g);});},
    async refresh(){return action(g=>refreshInner(g));},
    async verify(){
      // Automatic reads must never replace a user's review or compete with a wallet action.
      if(disposed||active||review||!isVisible())return snapshot();
      return action(g=>boundedRead(g,async()=>{
          const account=await identity(g,{allowDisconnected:true});
          view.account=account;
          const item=restorePendingView(account);
          if(item){
            pendingOwned(item);assert(HASH.test(item.hash),'SUBMISSION_UNKNOWN','原錢包送出狀態未知，保留紀錄，禁止重送。');
            const state=await base(g,{allowDisconnected:true});assert(state.account&&equal(state.account,item.account),'PENDING_ACCOUNT_MISMATCH','請使用原交易帳戶核對；原紀錄保留。');
            await withLock(()=>resumeInner(g,state));
            if(view.pending||view.phase==='CONFIRMED_REVERTED')return publish();
          }
          return refreshInner(g,{allowDisconnected:true});
      }));
    },
    setConfig(value){assert(!disposed,'DISPOSED');assert(!active,'BUSY');assert(!pending(),'PENDING_INTENT','先核對原交易；不能改啟用設定。');assert(!journal().evidence.some(x=>x.intent?.kind==='deploy'),'CONFIG_LOCKED','已有部署紀錄，啟用時間不可改。');assert(value&&typeof value.activationTime==='string'&&/^[1-9][0-9]*$/.test(value.activationTime)&&BigInt(value.activationTime)<=2n**64n-1n,'INVALID_ACTIVATION');config={activationTime:value.activationTime};invalidate('啟用時間已變更，請重新預覽與確認。');return snapshot();},
    async findPendingReceipt(){return action(g=>boundedRead(g,()=>withLock(async()=>{
      view.receiptCandidate=null;
      const item=pendingOwned(restorePendingView(await identity(g)));
      view.receiptCandidate=await locatePlayerReceipt(item,g);
      view.phase='PENDING';
      view.status=view.receiptCandidate?'找到符合這次請求的回執，請核對。':'目前尚未找到可確認的原回執。';
    })));},
    async recoverPendingHash({hash:providedHash,accepted,expectedIntentId}={}){return action(g=>boundedRead(g,()=>withLock(async()=>{
      review=null;view.receiptCandidate=null;assert(accepted===true,'RECOVERY_CONSENT_REQUIRED','請本人確認這是原錢包請求的交易 hash；核對不會重新送出。');assert(HASH.test(providedHash),'INVALID_RECOVERY_HASH');
      const account=view.account??await identity(g);
      const pendingRaw=readStorage(KUFO_PENDING_KEY),stored=storedPending(account,pendingRaw),item=pendingOwned(restorePendingView(account));
      if(expectedIntentId!==undefined)assert(item.intentId===expectedIntentId,'PENDING_CHANGED','原待確認交易已變更，請重新查核。');
      assert(stored?.intentId===item.intentId&&stored.payloadHash===payloadHash,'PENDING_CHANGED');assert(!item.hash||equal(item.hash,providedHash),'KNOWN_HASH_MISMATCH','原交易已有 hash，不能替換成另一筆。');
      const journalRaw=readStorage(evidenceKey),saved=journal(),existing=saved.evidence.find(x=>equal(x.intent?.hash,providedHash));
      assert(!existing||existing.intent?.intentId===item.intentId,'HASH_ALREADY_ARCHIVED','這個 hash 已屬於另一筆已保存交易；原待確認交易保持不變。');
      const state=await base(g);assert(equal(state.account,item.account),'PENDING_ACCOUNT_MISMATCH','請使用原交易帳戶核對；原紀錄保留。');
      const d=await deployments(g),candidate={...item,hash:providedHash,phase:'SUBMITTED'},evidence=await verifyTransaction(candidate,g,d);
      assert(evidence,'RECOVERY_NOT_CONFIRMED','候選交易尚無完整已確認回執；原待確認紀錄保留，不會重送。');
      const assurance=await recoveryAssurance(item,evidence,g);
      if(!candidate.recovery&&!existing)candidate.recovery={assurance,holderAttested:true,attestedAt:timestamp(),uniqueRequestProven:false};
      evidence.intent=copy(candidate);
      assert(equal(await identity(g),item.account),'PENDING_ACCOUNT_MISMATCH');current(g);
      assert(readStorage(KUFO_PENDING_KEY)===pendingRaw&&readStorage(evidenceKey)===journalRaw,'PENDING_CHANGED','原交易或證據已由另一個操作變更；本次不覆寫。');
      try{changePending(item,{hash:providedHash,phase:'SUBMITTED',...(candidate.recovery?{recovery:candidate.recovery}:{})});}
      catch(error){const local=localPending.get(lower(item.account));if(local?.hash)view.pending=copy(local);throw error;}
      return finishEvidence(candidate,evidence,d,g);
    })));},
    async resetFailedDeploymentConfig(value){return action(g=>boundedRead(g,()=>withLock(async()=>{
      review=null;assert(!restorePendingView(),'PENDING_INTENT','原交易尚未核實，不能變更啟用設定。');
      const next=validateConfig({version:P.calendar.version,activationTime:value?.activationTime,utcOffsetSeconds:28800,constellationByMonth:months});
      const journalRaw=readStorage(evidenceKey),saved=journal(),records=saved.evidence.filter(x=>x.intent?.kind==='deploy');
      assert(records.length>0,'NO_FAILED_DEPLOYMENT');assert(records.every(x=>x.verification?.status==='CONFIRMED_REVERTED'),'CONFIG_LOCKED','已有成功或未核實的部署紀錄；啟用設定保持鎖定。');
      const state=await base(g);ownerOnly(state);assert(records.every(x=>equal(x.intent?.account,state.account)),'PENDING_ACCOUNT_MISMATCH');
      for(const [organ,[name]]of Object.entries(ORGANS)){
        if(equal(state.routes[organ].address,ZERO))continue;
        const code=await rpc('eth_getCode',[state.routes[organ].address,state.tag],g),artifact=P.contracts[name];assert(HEX.test(code),'INVALID_RUNTIME');
        assert(code.length!==artifact.deployedBytecode.length||!equal(maskRuntime(code,artifact),maskRuntime(artifact.deployedBytecode,artifact)),'ALREADY_DEPLOYED','已有本版器官路由啟用，不能重設部署時間。');
      }
      assert(!await discover(state,g),'ALREADY_DEPLOYED','新版五合約已啟用；不能重設部署時間。');
      for(const record of records){
        const checked=await verifyTransaction(record.intent,g,{});
        assert(checked?.verification.status==='CONFIRMED_REVERTED'&&sameRecord({...record,verifiedAt:undefined},{...checked,verifiedAt:undefined}),'FAILED_DEPLOYMENT_NOT_VERIFIED','失敗部署回執未能重新核實；啟用設定保持鎖定。');
      }
      assert(equal(await identity(g),state.account),'PENDING_ACCOUNT_MISMATCH');current(g);
      assert(!pending()&&readStorage(evidenceKey)===journalRaw,'PENDING_CHANGED','原交易或證據已改變；不修改啟用設定。');
      config={activationTime:next.activationTime};view.deployments={};invalidate('已重新核實原部署失敗並更新本地啟用時間；歷史回執保留，請重新預覽。');return snapshot();
    })));},
    async prepare(request){return action(async g=>{review=null;const state=await base(g);const p=restorePendingView();assert(!p,'PENDING_INTENT','先核對原待確認交易，不重送。');const d=['approve','burn'].includes(request?.kind)?{}:await deployments(g),item=await candidate(copy(request),state,d,g),fees=await quote(item,g);current(g);review={...item,...fees,request:copy(request),reviewId:uniqueId(),generation:g,preparedAt:timestamp(),owner:state.owner,payloadHash};view.phase='REVIEW';view.status='請核對本筆內容與最高 BNB 費用，再由本人錢包確認。';return publish();});},
    async confirm(reviewId,{accepted,maxCostBNB}={}){return action(async g=>withLock(async()=>{
      assert(accepted===true,'EXPLICIT_CONSENT_REQUIRED');const original=review;assert(original&&original.reviewId===reviewId&&original.generation===g,'REVIEW_INVALID');assert(timestamp()-original.preparedAt>=0&&timestamp()-original.preparedAt<=REVIEW_MS,'REVIEW_EXPIRED');const limit=decimal(maxCostBNB,'MAX_COST');assert(limit>0n,'MAX_COST_REQUIRED','請明確填入本人可接受的最高 BNB 費用。');
      let item,fee,requested=false;
      try{
        // The existing read budget ends before asking the wallet to send anything.
        await boundedRead(g,async()=>{
          const state=await base(g);assert(!restorePendingView(state.account),'PENDING_INTENT');const d=['approve','burn'].includes(original.kind)?{}:await deployments(g),fresh=await candidate(original.request,state,d,g);
          assert(sameRecord(fresh,{kind:original.kind,config:original.config,account:original.account,...Object.fromEntries(['contract','organ','organKey','candidate','minimumDelay','amountWei','spender','deploymentAddresses','lifeId'].filter(k=>original[k]!==undefined).map(k=>[k,original[k]])),tx:original.tx}),'FRESH_STATE_CHANGED','送交前狀態已變更，請重新預覽。');
          fee=await quote(fresh,g);assert(BigInt(fee.maxCostWei)<=limit,'COST_LIMIT_EXCEEDED','估算費用超過本人輸入上限；未送交易。');assert(BigInt(fee.nativeBalanceWei)>=BigInt(fee.maxCostWei),'BNB_BALANCE_INSUFFICIENT');
          item={...fresh,schemaVersion:1,intentId:uniqueId(),payloadHash,chainId:56,owner:state.owner,hash:null,phase:'AWAITING_WALLET',createdAt:timestamp(),submissionAnchor:{number:state.block.number,hash:state.block.hash,timestamp:integer(state.block.timestamp).toString()},fee,maxCostWei:limit.toString()};
          writePending(item,item,{fresh:true});view.pending=item;review=null;view.phase='WAITING_WALLET';view.status='等待本人錢包確認此一筆交易；請勿重複送出。';publish();
          await finalGuard(item,g);assert(timestamp()-original.preparedAt<=REVIEW_MS,'REVIEW_EXPIRED');current(g);const saved=storedPending(item.account);assert(saved?.intentId===item.intentId&&sameRecord(saved,item),'PENDING_CHANGED');
        });
        // Leaving the read scope yields once; recheck synchronously before the wallet request.
        current(g);const saved=storedPending(item.account);assert(saved?.intentId===item.intentId&&sameRecord(saved,item),'PENDING_CHANGED');assert(timestamp()-original.preparedAt<=REVIEW_MS,'REVIEW_EXPIRED');current(g);
        requested=true;const returned=await provider.request({method:'eth_sendTransaction',params:[{...item.tx,gas:quantity(fee.gasLimit),gasPrice:quantity(fee.gasPriceWei)}]});
        assert(HASH.test(returned),'SUBMISSION_UNKNOWN');localPending.set(lower(item.account),{...item,hash:returned,phase:'SUBMITTED'});
        changePending(item,{hash:returned,phase:'SUBMITTED'});if(disposed||g!==generation)return publish();view.phase='SUBMITTED';view.status='已取得原交易雜湊；尚未確認，請只讀核對回執。';return publish();
      }catch(error){
        if(!item)throw error;
        const key=lower(item.account);
        let knownHash=localPending.get(key)?.hash;
        if(requested&&HASH.test(error.transactionHash)&&!knownHash){
          knownHash=error.transactionHash;
          localPending.set(key,{...item,hash:knownHash,phase:'SUBMITTED'});
          try{changePending(item,{hash:knownHash,phase:'SUBMITTED'});}catch{}
        }
        if(requested&&Number(error.code)===4001&&!knownHash){clearPending(item);view.phase='REJECTED';view.status='本人已拒絕，沒有取得送出雜湊；可重新預覽下一次手動操作。';return publish();}
        if(!requested){try{clearPending(item);}catch{}}
        const local=localPending.get(key);
        if(local?.hash&&(!view.account||equal(view.account,item.account)))view.pending=copy(local);
        view.status=knownHash?'原交易雜湊已取得但保存／讀查未完成；保留並禁止重送。':'原送出狀態未知；保留待確認紀錄，禁止重送。';throw error;
      }
    }));},
    async resume(){return action(async g=>withLock(async()=>{review=null;return resumeInner(g,await base(g));}));},
    dispose(){if(disposed)return;disposed=true;invalidate('此面板已關閉；原交易紀錄保留。');for(const [name,listener]of events)provider.removeListener?.(name,listener);if(typeof document!=='undefined')document.removeEventListener('visibilitychange',visibility);listeners.clear();}
  });
}
