import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {WORLD_REGISTRY,WORLD_STATUSES,BANK_SERVICE,SHARED_GAME_VERSION,findWorld,isPlayable,isNavigable,playableDestination,entryDestination,portalBase,worldUrl,sharedGameUrl,mountSharedGameEntry,validateWorldRegistry} from '../assets/kaios-world-registry.mjs';
import {readPortalPlayer} from '../assets/kaios-portal.mjs';
import {createLocalPlayerStore,PLAYER_LIFE_STORAGE_KEY} from '../K線西遊記/temples/11520/runtime/player-life-runtime.mjs';
const root=new URL('../',import.meta.url);
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}};
test('one registry separates verified playable worlds from the shared Taiwan/America beta entries',()=>{
 assert.equal(validateWorldRegistry(),true);assert.deepEqual(WORLD_REGISTRY.filter(isPlayable).map(w=>w.worldId),['12345','16888']);
 assert.deepEqual(WORLD_REGISTRY.filter(w=>w.status==='BETA').map(w=>w.worldId),['11520','88888']);
 for(const id of ['11520','88888']){assert.equal(isNavigable(findWorld(id)),true);assert.equal(isPlayable(findWorld(id)),false);assert.equal(entryDestination(id),findWorld(id).entryUrl);assert.equal(playableDestination(id),null)}
 assert.deepEqual(WORLD_STATUSES,['PLAYABLE','BETA','UNDER_CONSTRUCTION','RESEARCH','ARCHIVED']);
 assert.equal(findWorld('11520').version,'CURRENT');assert.equal(findWorld('88888').version,SHARED_GAME_VERSION);
 assert.equal(Object.isFrozen(WORLD_REGISTRY),true);assert.equal(Object.isFrozen(findWorld('11520').capabilities),true);
});
test('all registry destinations exist; construction worlds have no play destination',()=>{
 for(const w of WORLD_REGISTRY){if(w.entryUrl){const p=new URL(w.entryUrl,root);assert.ok(existsSync(fileURLToPath(p)),w.entryUrl)}if(w.status!=='PLAYABLE')assert.equal(playableDestination(w.worldId),null)}
 assert.equal(playableDestination('unknown'),null);assert.equal(playableDestination('https://evil.invalid'),null);
});
test('same registry URLs work at repository-root local server and Pages prefix',()=>{
 for(const moduleUrl of ['http://localhost:4173/assets/kaios-world-registry.mjs','https://klineodyssey.github.io/kline-odyssey/assets/kaios-world-registry.mjs']){
  const base=portalBase(moduleUrl);
  for(const id of ['11520','88888']){
   const url=new URL(worldUrl(id,base));assert.equal(url.origin,new URL(moduleUrl).origin);assert.equal(url.href,new URL(`K線西遊記/temples/${id}/index.html`,base).href);assert.equal(url.pathname.startsWith('/kline-odyssey/'),moduleUrl.includes('github.io'));
   const game=new URL(sharedGameUrl(base,id));assert.equal(game.origin,url.origin);assert.equal(game.pathname,new URL('K線西遊記/temples/11520/game-5d.html',base).pathname);assert.equal(game.search,`?world=${id}`);assert.equal(game.hash,'');
  }
 }
});
test('registry rejects unsafe URLs, duplicate IDs, and fake construction play links',()=>{
 const w=findWorld('11520');
 for(const path of ['https://evil.invalid','//evil.invalid','../escape','javascript:alert(1)'])assert.throws(()=>validateWorldRegistry([{...w,entryUrl:path}]),/UNSAFE_WORLD_ENTRY/);
 assert.throws(()=>validateWorldRegistry([w,w]),/INVALID_WORLD_REGISTRY/);
 assert.throws(()=>validateWorldRegistry([{...w,status:'UNDER_CONSTRUCTION'}]),/CONSTRUCTION/);
});
test('new guest is read-only: Portal does not create Player ID or mutate storage',()=>{
 const s=storage();assert.equal(readPortalPlayer(s),null);assert.equal(s.getItem(PLAYER_LIFE_STORAGE_KEY),null);
});
test('returning player projection reuses validated domain and excludes wallet/private fields',()=>{
 const s=storage(),store=createLocalPlayerStore({storage:s,crypto:webcrypto});store.createPlayer();store.updateProfile({displayName:'星際旅人'});store.recordEvent({id:'kill-1',type:'MONSTER_KILL'});store.saveProgress({lastWorld:'16888'});
 const before=s.getItem(PLAYER_LIFE_STORAGE_KEY),p=readPortalPlayer(s);assert.deepEqual(Object.keys(p).sort(),['destination','displayName','homeWorld','lastWorld','displayLastWorld','level'].sort());assert.equal(p.displayName,'星際旅人');assert.equal(p.lastWorld,'16888');assert.equal(p.displayLastWorld,'16888');assert.equal(p.destination,findWorld('16888').entryUrl);assert.equal(s.getItem(PLAYER_LIFE_STORAGE_KEY),before);
});
test('shared-game resume changes only the displayed destination and preserves canonical player data',()=>{
 const s=storage(),store=createLocalPlayerStore({storage:s,crypto:webcrypto});store.createPlayer();store.saveProgress({lastWorld:'11520'});
 const before=s.getItem(PLAYER_LIFE_STORAGE_KEY),homeWorld=store.loadPlayer().homeWorld,p=readPortalPlayer(s);
 assert.deepEqual(Object.keys(p).sort(),['destination','displayName','homeWorld','lastWorld','displayLastWorld','level'].sort());assert.equal(p.homeWorld,homeWorld);assert.equal(p.lastWorld,'11520');assert.equal(p.displayLastWorld,'88888');assert.equal(p.destination,findWorld('88888').entryUrl);assert.equal(Object.isFrozen(p),true);assert.equal(s.getItem(PLAYER_LIFE_STORAGE_KEY),before);assert.equal(store.loadPlayer().lastWorld,'11520');
});
test('player switch and reload reads current player without leaking another profile',()=>{
 const s=storage(),store=createLocalPlayerStore({storage:s,crypto:webcrypto}),a=store.createPlayer();store.updateProfile({displayName:'玩家 A'});store.createPlayer();store.updateProfile({displayName:'玩家 B'});
 assert.equal(readPortalPlayer(s).displayName,'玩家 B');store.activatePlayer(a.playerId);assert.equal(readPortalPlayer(s).displayName,'玩家 A');assert.equal(readPortalPlayer(s).displayName,'玩家 A');
});
test('corrupt/tampered save and storage denial preserve data and fail safe to guest',()=>{
 const s=storage();s.setItem(PLAYER_LIFE_STORAGE_KEY,'{corrupt');assert.equal(readPortalPlayer(s),null);assert.equal(s.getItem(PLAYER_LIFE_STORAGE_KEY),'{corrupt');assert.equal(readPortalPlayer({getItem(){throw new Error('denied')}}),null);
 const good=storage(),store=createLocalPlayerStore({storage:good,crypto:webcrypto});store.createPlayer();const saved=JSON.parse(good.getItem(PLAYER_LIFE_STORAGE_KEY));saved.players[saved.activePlayerId].lastWorld='https://evil.invalid';const raw=JSON.stringify(saved);good.setItem(PLAYER_LIFE_STORAGE_KEY,raw);assert.equal(readPortalPlayer(good),null);assert.equal(good.getItem(PLAYER_LIFE_STORAGE_KEY),raw);
});
test('canonical Portal has no hand-coded play statuses/duplicate entry URLs; legacy redirects',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),legacy=readFileSync(new URL('../K線西遊記/index.html',import.meta.url),'utf8');
 assert.ok(html.includes('assets/kaios-portal.mjs'));assert.ok(html.includes('id="portalAudio"'));assert.ok(!html.includes('temples/'));assert.ok(!html.includes('PLAYABLE'));assert.ok(legacy.includes('location.replace'));assert.ok(legacy.includes('content="0;url=../"'));assert.ok(!legacy.includes('全部神殿可進入'));
});

test('bank service opens the original five-case panel without selecting a wallet role or changing game readiness',()=>{
 assert.equal(Object.isFrozen(BANK_SERVICE),true);
 for(const base of ['http://localhost:4173/','https://klineodyssey.github.io/kline-odyssey/']){
  const url=new URL(BANK_SERVICE.entryUrl,base),expected=new URL('K線西遊記/temples/18888/index.html#funding-panel',base);
  assert.equal(url.href,expected.href);assert.equal(url.search,'');assert.equal(url.hash,'#funding-panel');
 }
 assert.ok(existsSync(new URL(BANK_SERVICE.entryUrl.split('#')[0],root)));
 assert.equal(findWorld('18888').status,'UNDER_CONSTRUCTION');assert.equal(isNavigable(findWorld('18888')),false);assert.equal(playableDestination('18888'),null);
 assert.match(findWorld('18888').name,/遊戲世界/);
});

function entryDocument(){
 const nodes=new Map(),doc={getElementById:id=>nodes.get(id)||null,createElement:()=>{const classes=new Set();return {style:{},dataset:{},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},setAttribute(name,value){this[name]=value},addEventListener(){throw new Error('entry does not own a new controller')}}}};
 const container=()=>({ownerDocument:doc,children:[],append(node){if(node.parentNode)node.parentNode.children.splice(node.parentNode.children.indexOf(node),1);this.children.push(node);node.parentNode=this;nodes.set(node.id,node)}});
 return {doc,body:container(),menu:container()};
}
test('shared game entry moves the same owned link into normal menu flow without fixed hit targets',()=>{
 const {doc,body,menu}=entryDocument(),base=new URL('https://klineodyssey.github.io/kline-odyssey/');
 const link=mountSharedGameEntry({container:body,base});assert.equal(link.style.position,'fixed');assert.equal(link.classList.contains('nav-btn'),false);
 assert.equal(mountSharedGameEntry({container:menu,base,layout:'flow'}),link);
 for(let i=0;i<4;i++)assert.equal(mountSharedGameEntry({container:menu,base,layout:'flow'}),link);
 assert.equal(doc.getElementById('kaiosSharedGameEntry'),link);assert.equal(body.children.length,0);assert.deepEqual(menu.children,[link]);
 assert.equal(link.style.position,'static');for(const field of ['left','right','top','bottom','zIndex'])assert.equal(link.style[field],'auto');
 assert.equal(link.classList.contains('nav-btn'),true);assert.equal(link.style.minHeight,'44px');assert.equal(link.dataset.kaiosSharedGameLayout,'flow');
 assert.equal(link.href,new URL('K線西遊記/temples/88888/index.html',base).href);assert.equal(link.target,'_top');assert.ok(link.title.includes(SHARED_GAME_VERSION));
 assert.equal(mountSharedGameEntry({container:body,base}),link);assert.deepEqual(body.children,[link]);assert.equal(menu.children.length,0);assert.equal(link.style.position,'fixed');assert.equal(link.classList.contains('nav-btn'),false);
});
test('invalid shared entry placement does not create or move a link',()=>{
 const {body,menu}=entryDocument();assert.equal(mountSharedGameEntry({container:body,layout:'unknown'}),null);assert.equal(body.children.length,0);
 const link=mountSharedGameEntry({container:menu,layout:'flow'});assert.equal(mountSharedGameEntry({container:body,layout:null}),null);assert.equal(link.parentNode,menu);assert.equal(body.children.length,0);assert.equal(mountSharedGameEntry(),null);
});
test('world bridge mounts Heart entry in its owned menu and never falls back over ritual controls',()=>{
 const source=readFileSync(new URL('../assets/kaios-world-audio.mjs',import.meta.url),'utf8'),start=source.indexOf('export function bindWorldAudio(');assert.ok(start>=0);
 for(const [worldId,hasMenu,expected]of [['12345',true,'flow'],['12345',false,null],['16888',false,'floating']]){
  const body={},menu={},calls=[],context={document:{readyState:'complete',body,getElementById:id=>id==='universe-nav'&&hasMenu?menu:null},getKaiosAudio:()=>({setWorld(){}}),mountSharedGameEntry:options=>calls.push(options)};
  vm.createContext(context);new vm.Script(source.slice(start).replace('export function','function')+'\nbindWorldAudio('+JSON.stringify(worldId)+');').runInContext(context);
  assert.equal(calls.length,expected?1:0);if(expected){assert.equal(calls[0].container,expected==='flow'?menu:body);assert.equal(calls[0].layout,expected);}
 }
});

test('real shared temple cards keep canonical destinations from temple and legacy game pages',()=>{
 const context={};context.window=context;vm.createContext(context);
 for(const module of ['kgen-game-core.js','universe-runtime/temple-hub.js']){
  vm.runInContext(readFileSync(new URL(`../K線西遊記/modules/${module}`,import.meta.url),'utf8'),context,{filename:module});
 }
 const nodes=context.KGEN_5D.NODES,ids=Object.keys(nodes),before=JSON.stringify(nodes);
 assert.equal(ids.length,15);
 const cards=excludeId=>{
  const container={innerHTML:''};context.KGEN_TempleHub.renderEntryCards(container,excludeId);
  return [...container.innerHTML.matchAll(/<a href="([^"]+)" class="kgen-card kgen-entry-card"/g)].map(match=>match[1]);
 };
 for(const base of ['http://localhost:8080/','https://klineodyssey.github.io/kline-odyssey/']){
  const templePage=new URL('K線西遊記/temples/18888/index.html',base);
  for(const entry of [...ids.map(id=>`K線西遊記/temples/${id}/index.html`),'K線西遊記/game/kline-5d/index.html']){
   const page=new URL(entry,base),hrefs=cards('5d');assert.equal(hrefs.length,15);
   hrefs.forEach((href,index)=>{
    const id=ids[index],destination=new URL(href,page),canonical=new URL(`K線西遊記/temples/${id}/index.html`,base);
    assert.equal(destination.href,canonical.href,`${entry} card ${id}`);
    assert.equal(destination.href,new URL(nodes[id].url,templePage).href,'retain the original temple destination');
    assert.ok(existsSync(new URL(`K線西遊記/temples/${id}/index.html`,root)),`destination file ${id}`);
   });
  }
  const remaining=ids.filter(id=>id!=='18888'),hrefs=cards('18888');assert.equal(hrefs.length,14);
  hrefs.forEach((href,index)=>assert.equal(new URL(href,templePage).href,new URL(nodes[remaining[index]].url,templePage).href));
 }
 assert.equal(JSON.stringify(nodes),before,'rendering must not rewrite the shared node registry');
});

const ethers16888=createRequire(import.meta.url)('../K線西遊記/temples/12345/assets/ethers-5.7.2.umd.min.js');
const manualOrderKey='KGEN_16888_MANUAL_ORDER_PENDING';
const universe16888='0xAbF1EBF153A69Cf383a1435AFC20F7232D893D63';
const orderAccount='0x1111111111111111111111111111111111111111';
const otherAccount='0x2222222222222222222222222222222222222222';
const orderHash='0x'+'a'.repeat(64);
function deferred(){
 let resolve,reject;
 const promise=new Promise((yes,no)=>{resolve=yes;reject=no});
 return {promise,resolve,reject};
}

function manualOrderLocks(){
 const held=new Set();
 return {async request(name,options,action){
  assert.equal(options.mode,'exclusive');
  assert.equal(options.ifAvailable,true);
  if(held.has(name))return action(null);
  held.add(name);
  try{return await action({name})}finally{held.delete(name)}
 }};
}
function manualOrderHarness({saved=storage(),place,parameters,chainRead,populate,postBroadcast,normalizeRejection=false,locks=manualOrderLocks()}={}){
 const html=readFileSync(new URL('../K線西遊記/temples/16888/index.html',import.meta.url),'utf8');
 const script=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match=>match[1]).find(code=>code.includes('const PATCH_ID = "V3.7.12-POOL-SAFETY"'));
 assert.ok(script,'load the actual original 16888 manual order script');
 const nodes=new Map(),events=new Map();
 const buttons=Array.from({length:4},()=>({disabled:false}));
 const timers=[],calls=[],rpc=[],wait=deferred();
 const node=id=>{
  if(!nodes.has(id))nodes.set(id,{hidden:true,disabled:false,textContent:'',href:'',style:{}});
  return nodes.get(id);
 };
 for(const id of ['pool-safety-panel','manual-order-state','manual-order-message','manual-order-link','manual-order-receipt','bp-status'])node(id);
 const model={account:orderAccount,chain:'0x38',receipt:null};
 const raw={
  on(event,fn){events.set(event,fn)},
  removeListener(event,fn){if(events.get(event)===fn)events.delete(event)},
  async request({method,params}){
   rpc.push({method,params});
   if(method==='eth_chainId'){
    if(chainRead)await chainRead();
    return model.chain;
   }
   if(method==='eth_accounts')return [model.account];
   if(method==='wallet_switchEthereumChain'){model.chain=params[0].chainId;return null}
   if(method==='eth_sendTransaction'){
    const decoded=iface.decodeFunctionData('placeOrder',params[0].data);
    const side=Number(decoded.side),value=decoded.amountIn;
    calls.push({side,amount:value.toString(),from:params[0].from});
    const response=place?await place(side,value):{hash:orderHash,wait:()=>wait.promise};
    responses.set(response.hash,response);
    return response.hash;
   }
   throw Error('unexpected RPC '+method);
  }};
 const provider={
  provider:raw,
  getNetwork:async()=>({chainId:Number(BigInt(model.chain))}),
  send:(method,params)=>raw.request({method,params}),
  getTransactionReceipt:async hash=>{
   rpc.push({method:'eth_getTransactionReceipt',hash});
   return model.receipt;
  }
 };
 const signer={provider,getAddress:async()=>model.account};
 const amount=ethers16888.utils.parseUnits('100',18),big=ethers16888.BigNumber.from;
 let armed=false;
 const params={
  poolBalance:async()=>{
   if(parameters&&armed)await parameters();
   return ethers16888.utils.parseUnits('100000',18);
  },
  minOrder:async()=>big(1),
  maxOrder:async()=>ethers16888.utils.parseUnits('10000',18),
  TRIGGER:async()=>big(1),MIN_FLOOR:async()=>big(1),ROUND_TOTAL:async()=>big(1),
  configLocked:async()=>true,vowWindowSec:async()=>big(1),loveWindowSec:async()=>big(1)
 };
 const responses=new Map();
 class GuardedProvider{
  constructor(transport){this.transport=transport}
  getSigner(account){return {sendTransaction:async transaction=>{
   if(populate)await populate();
   let hash;
   try{hash=await this.transport.request({method:'eth_sendTransaction',params:[{...transaction,from:account}]});}
   catch(error){
    if(normalizeRejection&&Number(error.code)===4001)throw Object.assign(Error('user denied'),{code:'ACTION_REJECTED'});
    throw error;
   }
   if(postBroadcast)await postBroadcast(hash);
   return responses.get(hash)||{hash,wait:()=>wait.promise};
  }}}
 }
 const web3={demo:false,signer,provider,UNIVERSE:universe16888,parseAmt:()=>amount,refresh:async()=>{}};
 const context={
  document:{readyState:'complete',title:'16888',getElementById:id=>nodes.get(id)||null,querySelectorAll:()=>buttons},
  localStorage:saved,web3,betPanel:{approve:async()=>{}},crypto:webcrypto,navigator:{locks},
  ethers:{
   ...ethers16888,providers:{...ethers16888.providers,Web3Provider:GuardedProvider},
   Contract:function(address,abi,runner){
    if(!runner?.sendTransaction)return params;
    return {placeOrder:(side,value)=>runner.sendTransaction({
     to:address,value:'0x0',data:iface.encodeFunctionData('placeOrder',[side,value])
    })};
   }
  },
  console:{warn(){}},alert:message=>{throw Error(message)},setInterval:fn=>{timers.push(fn);return timers.length},addEventListener:(event,fn)=>events.set('window:'+event,fn)};
 context.window=context;
 vm.createContext(context);
 vm.runInContext(script,context,{filename:'16888-pool-safety'});
 armed=true;
 const iface=new ethers16888.utils.Interface([
  'function placeOrder(uint8 side,uint256 amountIn)',
  'event OrderPlaced(address indexed user,uint8 side,uint256 amountIn,uint256 feeTotal,uint256 feeToTreasury,uint256 feeToPool,uint256 stake)',
  'event OrderResolved(address indexed user,uint8 side,uint8 outcome,bool win,uint256 payout)']);
 const event=(name,args)=>({address:universe16888,...iface.encodeEventLog(iface.getEvent(name),args)});
 function receipt({account=orderAccount,side=0,value=amount,...changes}={}){
  return {transactionHash:orderHash,from:orderAccount,to:universe16888,blockHash:'0x'+'b'.repeat(64),blockNumber:100,status:1,
   logs:[event('OrderPlaced',[account,side,value,0,0,0,value]),event('OrderResolved',[account,side,side,true,amount])],...changes};
 }
 return {
  context,web3,signer,provider,raw,model,calls,rpc,wait,saved,buttons,node,timers,receipt,
  emit:(event,value)=>events.get(event)?.(value),
  check:()=>node('manual-order-receipt').onclick(),
  pending:()=>JSON.parse(saved.getItem(manualOrderKey))
 };
}
async function untilWalletRequest(h){
 for(let count=0;count<30&&!h.calls.length;count++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(h.calls.length,1);
}

test('16888 manual UP and legacy DOWN share one lock until the exact receipt arrives',async()=>{
 const h=manualOrderHarness();h.buttons[3].disabled=true;
 const first=h.context.betPanel.buy(),second=h.web3.place(1);
 await untilWalletRequest(h);await second;
 assert.equal(h.calls.length,1);assert.equal(h.pending().hash,orderHash);assert.ok(h.buttons.every(button=>button.disabled));
 assert.equal(h.node('manual-order-state').hidden,false);assert.ok(h.node('manual-order-message').textContent.includes(orderHash));
 assert.ok(!h.node('bp-status').textContent.includes('WIN'));
 h.timers[0]();h.context.placeOrder('DOWN');
 assert.ok(h.node('manual-order-message').textContent.includes(orderHash));
 h.wait.resolve(h.receipt());await first;
 assert.equal(h.saved.getItem(manualOrderKey),null);assert.ok(h.node('bp-status').textContent.includes('WIN'));
 assert.deepEqual(h.buttons.map(button=>button.disabled),[false,false,false,true]);
});

test('16888 explicit pre-hash wallet rejection releases the same pending intent',async()=>{
 const h=manualOrderHarness({place:async()=>{throw Object.assign(Error('rejected'),{code:4001})}});
 await h.context.betPanel.sell();assert.equal(h.calls.length,1);assert.equal(h.saved.getItem(manualOrderKey),null);assert.ok(h.buttons.every(button=>!button.disabled));
 await h.web3.place(0);assert.equal(h.calls.length,2);
});

test('16888 account or chain change during preflight prevents a late order request',async()=>{
 for(const event of ['accountsChanged','chainChanged','disconnect']){
  const pause=deferred();let entered=false;
  const h=manualOrderHarness({parameters:async()=>{entered=true;await pause.promise}});
  const first=h.context.betPanel.buy();
  for(let count=0;count<30&&!entered;count++)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(entered,true);h.emit(event,event==='accountsChanged'?[otherAccount]:'0x1');pause.resolve();await first;
  assert.equal(h.calls.length,0,event);assert.equal(h.saved.getItem(manualOrderKey),null,event);assert.ok(!h.node('bp-status').textContent.includes('WIN'));
 }
});

test('16888 provider replacement without an identity event invalidates the prepared request',async()=>{
 for(const replace of [h=>{h.web3.signer={...h.signer}},h=>{h.web3.provider={request:async()=>[]}},h=>{h.provider.provider={request:async()=>[]}}]){
  const pause=deferred();let entered=false;
  const h=manualOrderHarness({parameters:async()=>{entered=true;await pause.promise}}),first=h.context.betPanel.buy();
  for(let count=0;count<30&&!entered;count++)await new Promise(resolve=>setImmediate(resolve));
  replace(h);pause.resolve();await first;assert.equal(h.calls.length,0);
 }
});

test('16888 identity changes during the first wallet read cannot become a new accepted baseline',async()=>{
 for(const event of ['accountsChanged','chainChanged','disconnect']){
  const pause=deferred();let entered=false;
  const h=manualOrderHarness({chainRead:async()=>{entered=true;await pause.promise}}),first=h.context.betPanel.buy();
  for(let count=0;count<30&&!entered;count++)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(entered,true);h.model.account=otherAccount;h.emit(event,[otherAccount]);pause.resolve();await first;
  assert.equal(h.calls.length,0,event);assert.equal(h.saved.getItem(manualOrderKey),null,event);
 }
});

test('16888 a late wallet hash after account change remains bound to the original request',async()=>{
 const response=deferred(),h=manualOrderHarness({place:()=>response.promise}),first=h.context.betPanel.buy();
 await untilWalletRequest(h);h.model.account=otherAccount;h.emit('accountsChanged',[otherAccount]);
 response.resolve({hash:orderHash,wait:()=>{throw Error('stale wait should not run')}});await first;
 assert.equal(h.pending().account,orderAccount);assert.equal(h.pending().hash,orderHash);assert.ok(!h.node('bp-status').textContent.includes('WIN'));
 h.model.receipt=h.receipt();await h.check();assert.equal(h.saved.getItem(manualOrderKey),null);assert.ok(h.node('bp-status').textContent.includes(orderAccount));
});

test('16888 confirmation timeout retains hash across reload and recovery never resends',async()=>{
 const h=manualOrderHarness(),first=h.context.betPanel.sell();await untilWalletRequest(h);h.wait.reject(Error('timeout'));await first;
 const restored=manualOrderHarness({saved:h.saved});assert.equal(restored.pending().hash,orderHash);assert.ok(restored.buttons.every(button=>button.disabled));
 await restored.web3.place(0);assert.equal(restored.calls.length,0);await restored.check();assert.equal(restored.pending().hash,orderHash);
 restored.model.receipt=restored.receipt({side:1});await restored.check();assert.equal(restored.calls.length,0);assert.equal(restored.saved.getItem(manualOrderKey),null);
});

test('16888 unknown wallet response keeps the pre-hash intent after reload',async()=>{
 const h=manualOrderHarness({place:async()=>{throw Error('network response unknown')}});await h.context.betPanel.buy();
 assert.equal(h.pending().hash,null);const restored=manualOrderHarness({saved:h.saved});await restored.context.betPanel.buy();assert.equal(restored.calls.length,0);
 assert.ok(restored.buttons.every(button=>button.disabled));
});

test('16888 mismatched receipt, event owner, direction or amount cannot finish the original order',async()=>{
 for(const change of [()=>({from:otherAccount}),()=>({to:otherAccount}),()=>({transactionHash:'0x'+'c'.repeat(64)}),
  ()=>({account:otherAccount}),()=>({side:1}),()=>({value:ethers16888.utils.parseUnits('101',18)}),()=>({logs:[]}),()=>({status:undefined}),()=>({blockNumber:undefined})]){
  const h=manualOrderHarness(),first=h.context.betPanel.buy();await untilWalletRequest(h);h.wait.resolve(h.receipt(change()));await first;
  assert.equal(h.pending().hash,orderHash);assert.ok(!h.node('bp-status').textContent.includes('WIN'));
 }
});

test('16888 a confirmed reverted receipt ends the pending intent without displaying winnings',async()=>{
 const h=manualOrderHarness(),first=h.context.betPanel.buy();await untilWalletRequest(h);h.wait.resolve(h.receipt({status:0,logs:[]}));await first;
 assert.equal(h.saved.getItem(manualOrderKey),null);assert.ok(h.node('bp-status').textContent.includes('失敗'));assert.ok(!h.node('bp-status').textContent.includes('WIN'));
});

test('16888 reads the selected signer transport rather than another injected wallet',async()=>{
 const h=manualOrderHarness();h.context.ethereum={request:()=>{throw Error('wrong wallet')}};
 h.model.chain='0x1';const first=h.context.betPanel.buy();await untilWalletRequest(h);
 assert.ok(h.rpc.some(call=>call.method==='wallet_switchEthereumChain'));assert.equal(h.pending().chainId,56);
 h.wait.resolve(h.receipt());await first;
});

test('16888 two tabs share the exclusive wallet request lock and distinct attempt IDs',async()=>{
 const saved=storage(),locks=manualOrderLocks(),response=deferred();
 const firstTab=manualOrderHarness({saved,locks,place:()=>response.promise}),secondTab=manualOrderHarness({saved,locks});
 const first=firstTab.context.betPanel.buy();await untilWalletRequest(firstTab);const firstIntent=firstTab.pending().intentId;
 await secondTab.context.betPanel.buy();assert.equal(secondTab.calls.length,0);assert.equal(secondTab.pending().intentId,firstIntent);assert.equal(secondTab.pending().hash,null);
 response.resolve({hash:orderHash,wait:()=>firstTab.wait.promise});
 await new Promise(resolve=>setImmediate(resolve));assert.equal(firstTab.pending().hash,orderHash);
 firstTab.wait.resolve(firstTab.receipt());await first;
 secondTab.emit('window:storage',{key:manualOrderKey});
 const second=secondTab.context.betPanel.buy();await untilWalletRequest(secondTab);assert.notEqual(secondTab.pending().intentId,firstIntent);
 secondTab.wait.resolve(secondTab.receipt());await second;
});

test('16888 a delayed hash cannot overwrite another saved intent',async()=>{
 const response=deferred(),h=manualOrderHarness({place:()=>response.promise}),first=h.context.betPanel.buy();await untilWalletRequest(h);
 const replacement={...h.pending(),intentId:webcrypto.randomUUID()};h.saved.setItem(manualOrderKey,JSON.stringify(replacement));
 response.resolve({hash:orderHash,wait:()=>{throw Error('obsolete wait')}});await first;
 assert.equal(h.pending().intentId,replacement.intentId);assert.equal(h.pending().hash,null);
});

test('16888 unavailable cross-tab locking prevents every wallet request',async()=>{
 const h=manualOrderHarness({locks:null});await h.context.betPanel.buy();assert.equal(h.calls.length,0);assert.equal(h.saved.getItem(manualOrderKey),null);
});

test('16888 account changes during ethers transaction population are rejected at the send boundary',async()=>{
 const pause=deferred();let entered=false;
 const h=manualOrderHarness({populate:async()=>{entered=true;await pause.promise}}),first=h.context.betPanel.buy();
 for(let count=0;count<30&&!entered;count++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(entered,true);h.model.account=otherAccount;h.emit('accountsChanged',[otherAccount]);pause.resolve();await first;
 assert.equal(h.calls.length,0);assert.equal(h.saved.getItem(manualOrderKey),null);
});

test('16888 ethers post-broadcast errors retain the known transaction hash even with a rejection code',async()=>{
 const h=manualOrderHarness({place:async()=>{throw Object.assign(Error('lookup failed'),{transactionHash:orderHash,code:4001})}});
 await h.context.betPanel.buy();assert.equal(h.calls.length,1);assert.equal(h.pending().hash,orderHash);
});

test('16888 raw rejection evidence survives ethers ACTION_REJECTED normalization',async()=>{
 const h=manualOrderHarness({normalizeRejection:true,place:async()=>{throw Object.assign(Error('user rejected'),{code:4001})}});
 await h.context.betPanel.buy();assert.equal(h.saved.getItem(manualOrderKey),null);assert.equal(h.calls.length,1);
});

test('16888 persists the raw wallet hash before ethers finishes its transaction lookup',async()=>{
 const lookup=deferred();let entered=false;
 const h=manualOrderHarness({postBroadcast:async()=>{entered=true;await lookup.promise}}),first=h.context.betPanel.buy();
 for(let count=0;count<30&&!entered;count++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(entered,true);assert.equal(h.pending().hash,orderHash);assert.equal(h.calls[0].from,orderAccount);
 const restored=manualOrderHarness({saved:h.saved});assert.equal(restored.pending().hash,orderHash);assert.ok(restored.buttons.every(button=>button.disabled));
 lookup.resolve();h.wait.resolve(h.receipt());await first;
});

test('16888 a storage read fault after broadcast retains the hash in the pending UI',async()=>{
 const base=storage();let fail=false;
 const saved={...base,getItem:key=>{if(fail){fail=false;throw Error('transient read fault')}return base.getItem(key)}};
 const h=manualOrderHarness({saved,place:async()=>{fail=true;return {hash:orderHash,wait:()=>{throw Error('lookup should stop')}}}});
 await h.context.betPanel.buy();assert.equal(h.pending().hash,null);assert.ok(h.node('manual-order-message').textContent.includes(orderHash));
 assert.equal(h.node('manual-order-link').hidden,false);assert.ok(h.buttons.every(button=>button.disabled));
 h.model.receipt=h.receipt();await h.check();assert.equal(saved.getItem(manualOrderKey),null);assert.equal(h.calls.length,1);
});

test('16888 a failed pre-send storage write cannot submit a wallet request',async()=>{
 const base=storage();let fail=true;
 const saved={...base,setItem:(key,value)=>{if(fail){fail=false;throw Error('write failed')}base.setItem(key,value)}};
 const h=manualOrderHarness({saved});await h.context.betPanel.buy();assert.equal(h.calls.length,0);assert.equal(saved.getItem(manualOrderKey),null);
 assert.ok(h.buttons.every(button=>!button.disabled));
});

test('16888 a pre-send population error cannot attach a historical transaction hash',async()=>{
 const h=manualOrderHarness({populate:async()=>{
  throw Object.assign(Error('population failed'),{transactionHash:orderHash});
 }});
 await h.context.betPanel.buy();
 assert.equal(h.calls.length,0);
 assert.equal(h.saved.getItem(manualOrderKey),null);
 assert.ok(!h.node('manual-order-message').textContent.includes(orderHash));
 assert.ok(!h.node('bp-status').textContent.includes('WIN'));
});
