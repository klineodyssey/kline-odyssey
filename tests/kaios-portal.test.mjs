import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
import {WORLD_REGISTRY,WORLD_STATUSES,SHARED_GAME_VERSION,findWorld,isPlayable,isNavigable,playableDestination,entryDestination,portalBase,worldUrl,sharedGameUrl,mountSharedGameEntry,validateWorldRegistry} from '../assets/kaios-world-registry.mjs';
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
