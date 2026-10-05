import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {webcrypto} from 'node:crypto';
import {WORLD_REGISTRY,WORLD_STATUSES,findWorld,isPlayable,playableDestination,portalBase,worldUrl,validateWorldRegistry} from '../assets/kaios-world-registry.mjs';
import {readPortalPlayer} from '../assets/kaios-portal.mjs';
import {createLocalPlayerStore,PLAYER_LIFE_STORAGE_KEY} from '../K線西遊記/temples/11520/runtime/player-life-runtime.mjs';
const root=new URL('../',import.meta.url);
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}};
test('one registry exposes exactly the three Human-designated playable worlds',()=>{
 assert.equal(validateWorldRegistry(),true);assert.deepEqual(WORLD_REGISTRY.filter(isPlayable).map(w=>w.worldId),['11520','12345','16888']);
 assert.deepEqual(WORLD_STATUSES,['PLAYABLE','BETA','UNDER_CONSTRUCTION','RESEARCH','ARCHIVED']);
 assert.equal(findWorld('11520').version,'V2.9.4');
 assert.equal(Object.isFrozen(WORLD_REGISTRY),true);assert.equal(Object.isFrozen(findWorld('11520').capabilities),true);
});
test('all registry destinations exist; construction worlds have no play destination',()=>{
 for(const w of WORLD_REGISTRY){if(w.entryUrl){const p=new URL(w.entryUrl,root);assert.ok(existsSync(fileURLToPath(p)),w.entryUrl)}if(w.status!=='PLAYABLE')assert.equal(playableDestination(w.worldId),null)}
 assert.equal(playableDestination('unknown'),null);assert.equal(playableDestination('https://evil.invalid'),null);
});
test('same registry URLs work at repository-root local server and Pages prefix',()=>{
 for(const moduleUrl of ['http://localhost:4173/assets/kaios-world-registry.mjs','https://klineodyssey.github.io/kline-odyssey/assets/kaios-world-registry.mjs']){
  const base=portalBase(moduleUrl),url=new URL(worldUrl('11520',base));assert.equal(url.origin,new URL(moduleUrl).origin);assert.ok(url.pathname.endsWith('/temples/11520/game-5d.html'));assert.equal(url.pathname.startsWith('/kline-odyssey/'),moduleUrl.includes('github.io'));
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
 const before=s.getItem(PLAYER_LIFE_STORAGE_KEY),p=readPortalPlayer(s);assert.deepEqual(Object.keys(p).sort(),['destination','displayName','homeWorld','lastWorld','level'].sort());assert.equal(p.displayName,'星際旅人');assert.equal(p.destination,findWorld('16888').entryUrl);assert.equal(s.getItem(PLAYER_LIFE_STORAGE_KEY),before);
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
