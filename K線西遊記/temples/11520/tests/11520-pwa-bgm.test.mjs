import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';const root=new URL('../',import.meta.url);const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const pngSize=p=>{const b=fs.readFileSync(new URL(p,root));assert.deepEqual([...b.subarray(1,4)],[80,78,71],`${p} is not PNG`);return{width:b.readUInt32BE(16),height:b.readUInt32BE(20)}};
async function workerHarness(){
 const {runInNewContext}=await import('node:vm');
 const handlers={},writes=[],network=[],opened=[],deleted=[],own=new Map(),other=new Map();
 const state={offline:false,response:new Response('fresh network'),installFailure:false,storageFailure:false,skipped:0,claimed:0,precache:[]};
 const key=value=>typeof value==='string'?new URL(value,'https://example.test/temples/11520/').href:value.url;
 const cache={put:async(req,response)=>{writes.push(req.url);own.set(key(req),response)},match:async req=>own.get(key(req))?.clone(),addAll:async requests=>{state.precache=requests;if(state.installFailure)throw Error('install failed')}};
 runInNewContext(read('sw.js'),{URL,Request,Response,location:{origin:'https://example.test'},self:{location:{href:'https://example.test/temples/11520/sw.js'},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>state.skipped++,clients:{claim:async()=>state.claimed++}},caches:{open:async name=>{opened.push(name);if(state.storageFailure)throw Error('cache unavailable');return cache},keys:async()=>['unrelated-player-assets','k12345-shell-v1','k11520-shell-old',opened[0]],delete:async name=>deleted.push(name),match:async req=>other.get(key(req))?.clone()},fetch:async(req,options)=>{network.push({url:req.url,options});if(state.offline)throw Error('offline');return state.response.clone()}});
 async function request(path,{mode='cors',method='GET'}={}){const waits=[];let result;handlers.fetch({request:{method,url:new URL(path,'https://example.test').href,mode},respondWith:p=>result=p,waitUntil:p=>waits.push(p)});const value=await result;await Promise.all(waits);return value}
 async function event(name){let completion;handlers[name]({waitUntil:p=>completion=p});await completion}
 return{state,writes,network,opened,deleted,own,other,request,event};
}
test('service worker revalidates online app code, preserves HTTP errors, and retains only successful responses',async()=>{
 const h=await workerHarness();
 h.own.set('https://example.test/temples/11520/runtime/test.mjs',new Response('stale local module'));
 assert.equal(await(await h.request('/temples/11520/runtime/test.mjs')).text(),'fresh network');
 assert.equal(h.network.at(-1).options.cache,'no-cache','network-first must also revalidate the HTTP cache');
 for(const path of ['/temples/11520/game-5d.html?source=pwa','/temples/11520/manifest.webmanifest','/assets/kaios-audio.mjs','/assets/kaios-audio.css','/assets/kaios-world-registry.mjs']){await h.request(path);assert.equal(h.network.at(-1).options.cache,'no-cache',path)}
 await h.request('/temples/11520/assets/ui/k11520-pwa-192.png');assert.equal(h.network.at(-1).options,undefined,'image HTTP caching remains normal');
 const before=h.writes.length;h.state.response=new Response('missing',{status:404});assert.equal((await h.request('/temples/11520/missing.mjs')).status,404);assert.equal(h.writes.length,before);
 h.state.response=new Response('unavailable',{status:503});assert.equal((await h.request('/temples/11520/runtime/test.mjs')).status,503,'HTTP failure must not silently substitute an old successful module');
 h.state.response=new Response('usable without cache');h.state.storageFailure=true;assert.equal(await(await h.request('/temples/11520/runtime/test.mjs')).text(),'usable without cache');
});
test('service worker never intercepts writes, remote chains/APIs, or another data owner',async()=>{
 const h=await workerHarness();
 for(const [path,options] of [['/temples/11520/runtime/test.mjs',{method:'POST'}],['https://bsc.example/rpc',{}],['https://api.example/quotes',{}],['/api/quotes',{}],['/temples/11520/api/quotes',{}],['/temples/11520/rpc',{}],['/temples/12345/index.html',{}],['/temples/18888/index.html',{}],['/core/registry/store.mjs',{}],['/assets/unrelated.mjs',{}]])assert.equal(await h.request(path,options),undefined,path);
 assert.equal(h.network.length,0);assert.equal(h.writes.length,0);assert.equal(h.opened.length,0);
});
test('offline fallback uses only this release cache and never returns HTML for missing modules',async()=>{
 const h=await workerHarness();h.state.offline=true;
 h.other.set('https://example.test/temples/11520/runtime/missing.mjs',new Response('other cache stale module'));
 h.other.set('https://example.test/temples/11520/game-5d.html',new Response('other cache stale shell'));
 assert.equal((await h.request('/temples/11520/runtime/missing.mjs')).type,'error');
 assert.equal((await h.request('/temples/11520/game-5d.html?source=pwa',{mode:'navigate'})).type,'error');
 h.own.set('https://example.test/temples/11520/game-5d.html',new Response('<html>own shell</html>'));
 assert.equal(await(await h.request('/temples/11520/game-5d.html?source=pwa',{mode:'navigate'})).text(),'<html>own shell</html>');
 assert.equal((await h.request('/temples/11520/runtime/missing.mjs')).type,'error');
 h.own.set('https://example.test/temples/11520/runtime/test.mjs',new Response('own offline module'));
 assert.equal(await(await h.request('/temples/11520/runtime/test.mjs')).text(),'own offline module');
 h.state.storageFailure=true;assert.equal((await h.request('/temples/11520/runtime/test.mjs')).type,'error');
});
test('worker installs a fresh shell before activation and only retires its own named caches',async()=>{
 const h=await workerHarness();await h.event('install');assert.equal(h.state.skipped,1);
 assert.ok(h.state.precache.length>0);for(const request of h.state.precache){assert.equal(request.cache,'reload');assert.equal(new URL(request.url).origin,'https://example.test');assert.equal(request.method,'GET')}
 const precached=new Set(h.state.precache.map(req=>new URL(req.url).pathname));
 for(const file of ['wallet-game-bridge','evm-wallet-runtime','real-trading-preflight-ui','real-trading-order-intent']){
  assert.ok(precached.has('/temples/11520/runtime/'+file+'.mjs'),file+' must be in the installed shell');
 }
 await h.event('activate');assert.deepEqual(h.deleted,['k11520-shell-old']);assert.equal(h.state.claimed,1);
 const failed=await workerHarness();failed.state.installFailure=true;await assert.rejects(failed.event('install'),/install failed/);assert.equal(failed.state.skipped,0);assert.equal(failed.state.claimed,0);
 assert.doesNotMatch(read('sw.js'),/localStorage|indexedDB|deleteDatabase|\.clear\s*\(/,'worker must never clear player or wallet storage');
});
function workerRegistrationScript(){
 const source=[...read('game-5d.html').matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match=>match[1]).find(code=>code.includes('serviceWorker.register'));
 assert.ok(source);
 return source;
}
test('PWA checks updates at startup and online resume without reloading or clearing player state',async()=>{
 const {runInNewContext}=await import('node:vm'),source=workerRegistrationScript();
 const windowEvents={},documentEvents={},calls=[];let updates=0,releaseUpdate;
 const navigator={onLine:true,serviceWorker:{register:async(url,options)=>{calls.push({url,options});return{update:()=>{updates++;return new Promise(resolve=>releaseUpdate=resolve)}}}}};
 const document={visibilityState:'visible',querySelector:()=>null,documentElement:{dataset:{}},addEventListener:(name,fn)=>documentEvents[name]=fn};
 const location=new URL('https://example.test/temples/11520/game-5d.html');
 runInNewContext(source,{navigator,document,location,URLSearchParams,addEventListener:(name,fn)=>windowEvents[name]=fn});
 windowEvents.load();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(calls[0].url,'./sw.js');assert.equal(calls[0].options.scope,'./');assert.equal(calls[0].options.updateViaCache,'none');assert.equal(updates,1);
 windowEvents.online();documentEvents.visibilitychange();assert.equal(updates,1,'only one update check can be in flight');releaseUpdate();await new Promise(resolve=>setImmediate(resolve));
 navigator.onLine=false;windowEvents.online();assert.equal(updates,1);
 navigator.onLine=true;windowEvents.online();assert.equal(updates,2);releaseUpdate();await new Promise(resolve=>setImmediate(resolve));
 document.visibilityState='hidden';documentEvents.visibilitychange();assert.equal(updates,2);
 document.visibilityState='visible';documentEvents.visibilitychange();assert.equal(updates,3);releaseUpdate();await new Promise(resolve=>setImmediate(resolve));
 // The only allowed location accesses identify a preview. Keep the original
 // prohibition on navigation, forced reloads and writes to the player's saves.
 const withoutPreviewReads=source.replace('new URLSearchParams(location.search)','new URLSearchParams()')
  .replace("location.protocol==='http:'",'true').replace('.includes(location.hostname)','.includes("")');
 assert.doesNotMatch(withoutPreviewReads,/\blocation\b|\breload\s*\(|\bhistory\s*\.|\bopen\s*\(|localStorage|indexedDB|deleteDatabase|\.clear\s*\(/);
 assert.equal(location.href,'https://example.test/temples/11520/game-5d.html');
});
test('private LAN and loopback previews skip worker registration; the public game still registers',async()=>{
 const {runInNewContext}=await import('node:vm'),source=workerRegistrationScript();
 for(const [url,marker,shouldRegister,privateLan] of [
  ['http://192.168.1.42/game-5d.html?preview=server','lan',false,true],
  ['http://localhost/game-5d.html?preview=server',null,false,false],
  ['http://127.0.0.1/game-5d.html?preview=server',null,false,false],
  ['http://localhost/game-5d.html',null,true,false],
  ['https://example.test/game-5d.html?preview=server','lan',true,false],
 ]){
  const dataset={},events={},registered=[];
  const navigator={onLine:true,serviceWorker:{register:async path=>{
   registered.push(path);return {update:async()=>{}};
  }}};
  const document={documentElement:{dataset},visibilityState:'visible',addEventListener(){},
   querySelector(selector){assert.equal(selector,'meta[name="k11520-private-preview"]');return marker?{content:marker}:null}};
  runInNewContext(source,{navigator,document,URLSearchParams,location:new URL(url),addEventListener:(name,fn)=>events[name]=fn});
  if(events.load)await events.load();
  assert.deepEqual(registered,shouldRegister?['./sw.js']:[],url);
  assert.equal(dataset.k11520PrivatePreview,privateLan?'lan':undefined,url);
 }
});
test('K11520 offers installation only after browser eligibility and consumes the prompt on the install tap',async()=>{
 const h=await installOfferHarness();
 assert.equal(h.offer.hidden,true);
 await h.install.click();
 assert.equal(h.promptCalls,0);
 h.eligible();
 assert.equal(h.offer.hidden,false);
 assert.equal(h.prevented,1);
 assert.equal(h.promptCalls,0);
 await h.install.click();
 await h.install.click();
 h.eligible();
 assert.equal(h.promptCalls,1);
 assert.equal(h.offer.hidden,true);
});
test('K11520 can dismiss the offer or hide it when installed',async()=>{
 for(const dismiss of [h=>h.later.click(),h=>h.events.appinstalled()]){
  const h=await installOfferHarness();
  h.eligible();
  dismiss(h);
  await h.install.click();
  h.eligible();
  assert.equal(h.offer.hidden,true);
  assert.equal(h.promptCalls,0);
 }
});
test('K11520 explains when the browser could not open installation',async()=>{
 const h=await installOfferHarness({fail:true});
 h.eligible();
 await h.install.click();
 assert.equal(h.promptCalls,1);
 assert.equal(h.offer.hidden,false);
 assert.equal(h.install.hidden,true);
 assert.equal(h.message.hidden,false);
 h.later.click();
 assert.equal(h.offer.hidden,true);
});
async function installOfferHarness({fail=false}={}){
 const {runInNewContext}=await import('node:vm');
 const html=read('game-5d.html');
 const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match=>match[1]).find(code=>code.includes('beforeinstallprompt'));
 assert.ok(script);
 assert.match(html,/<aside\b[^>]+id="k11520InstallOffer"[^>]+\bhidden>/);
 const events={},h={events,promptCalls:0,prevented:0};
 const nodes={};
 for(const [suffix,property,hidden] of [['Offer','offer',true],['Game','install',false],['Later','later',false],['Message','message',true]]){
  h[property]=nodes['k11520Install'+suffix]={hidden,addEventListener(name,fn){this[name]=fn}};
 }
 runInNewContext(script,{document:{getElementById:id=>nodes[id]},addEventListener:(name,fn)=>events[name]=fn});
 h.eligible=()=>events.beforeinstallprompt({
  preventDefault:()=>h.prevented++,
  prompt:async()=>{h.promptCalls++;if(fail)throw Error('prompt unavailable')}
 });
 return h;
}
test('K11520 reports a genuine deployed game revision change once without force-reloading',async()=>{
 const {runInNewContext}=await import('node:vm'),html=read('game-5d.html');
 const source=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match=>match[1]).find(code=>code.includes('checkGameRelease'));
 assert.ok(source);
 assert.match(html,/<aside\b[^>]+id="k11520UpdateNotice"[^>]+\bhidden>/);
 const notice={hidden:true},events={},docEvents={},calls=[];
 let dismiss,poll,published={main_commit:'1',game_release_id:'a'.repeat(64)},fail=false;
 const navigator={onLine:true},document={
  visibilityState:'visible',addEventListener:(name,fn)=>docEvents[name]=fn,
  getElementById:id=>id==='k11520UpdateNotice'?notice:{addEventListener:(name,fn)=>dismiss=fn}
 };
 runInNewContext(source,{navigator,document,AbortSignal,
  fetch:async(url,options)=>{calls.push({url,options});if(fail)throw Error('offline');return{ok:true,json:async()=>published}},
  addEventListener:(name,fn)=>events[name]=fn,setInterval:(fn,ms)=>{assert.equal(ms,300000);poll=fn}
 });
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(notice.hidden,true);
 assert.equal(calls.length,1);
 assert.equal(calls[0].url,'../../../KGEN-KAIOS/dashboard/build-info.json');
 assert.equal(calls[0].options.cache,'no-cache');
 published={...published,main_commit:'unrelated-site-change'};
 await events.online();
 assert.equal(notice.hidden,true);
 document.visibilityState='hidden';
 published={game_release_id:'b'.repeat(64)};
 const before=calls.length;
 await poll();
 assert.equal(calls.length,before);
 document.visibilityState='visible';
 await docEvents.visibilitychange();
 assert.equal(notice.hidden,false);
 dismiss();
 await poll();
 assert.equal(notice.hidden,true);
 published={game_release_id:'invalid'};
 await poll();
 fail=true;
 await poll();
 assert.equal(notice.hidden,true);
 fail=false;
 published={game_release_id:'c'.repeat(64)};
 await Promise.all([poll(),events.online(),docEvents.visibilitychange()]);
 assert.equal(calls.length,before+5);
 assert.equal(notice.hidden,false,'a later release can notify again');
 assert.doesNotMatch(source,/\blocation\s*\.|\breload\s*\(|localStorage|indexedDB/);
});
test('K11520 PWA standalone shell is installable and does not force orientation',()=>{const m=JSON.parse(read('manifest.webmanifest'));assert.equal(m.display,'standalone');assert.equal(m.orientation,'any');assert.ok(m.display_override.includes('fullscreen'));for(const size of [192,512]){const icon=m.icons.find(x=>x.sizes===`${size}x${size}`);assert.ok(icon,`${size}px PWA icon missing`);assert.equal(icon.type,'image/png');assert.match(icon.purpose,/maskable/);assert.deepEqual(pngSize(icon.src),{width:size,height:size})}const h=read('game-5d.html');assert.ok(h.includes('rel="manifest"'));assert.ok(h.includes("serviceWorker.register('./sw.js'"));});
test('K11520 original theme uses only the shared bounded synth and no commercial assets',()=>{const c=read('runtime/game-ui-product-fixes-v23.mjs'),fx=read('runtime/combat-fx-runtime.mjs');assert.ok(c.includes("title:'花果山・星際戰場'"));assert.ok(c.includes('original:true'));assert.ok(c.includes('synthetic:true'));assert.ok(c.includes('getKaiosAudio'));assert.ok(fx.includes('getKaiosAudio'));assert.equal(/new (?:AudioContext|C)\(/.test(c+fx),false);for(const name of ['Just The Way You Are.mp3','Greatest Love Of All.mp3','Take My Breath Away.mp3','情難枕.mp3'])assert.equal(c.includes(name),false);});
