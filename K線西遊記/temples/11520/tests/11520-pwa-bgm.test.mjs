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
 await h.event('activate');assert.deepEqual(h.deleted,['k11520-shell-old']);assert.equal(h.state.claimed,1);
 const failed=await workerHarness();failed.state.installFailure=true;await assert.rejects(failed.event('install'),/install failed/);assert.equal(failed.state.skipped,0);assert.equal(failed.state.claimed,0);
 assert.doesNotMatch(read('sw.js'),/localStorage|indexedDB|deleteDatabase|\.clear\s*\(/,'worker must never clear player or wallet storage');
});
test('PWA checks updates at startup and online resume without reloading or clearing player state',async()=>{
 const {runInNewContext}=await import('node:vm'),html=read('game-5d.html');
 const source=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match=>match[1]).find(code=>code.includes('serviceWorker.register'));
 assert.ok(source);const windowEvents={},documentEvents={},calls=[];let updates=0,releaseUpdate;
 const navigator={onLine:true,serviceWorker:{register:async(url,options)=>{calls.push({url,options});return{update:()=>{updates++;return new Promise(resolve=>releaseUpdate=resolve)}}}}};
 const document={visibilityState:'visible',addEventListener:(name,fn)=>documentEvents[name]=fn};
 runInNewContext(source,{navigator,document,addEventListener:(name,fn)=>windowEvents[name]=fn});
 windowEvents.load();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(calls[0].url,'./sw.js');assert.equal(calls[0].options.scope,'./');assert.equal(calls[0].options.updateViaCache,'none');assert.equal(updates,1);
 windowEvents.online();documentEvents.visibilitychange();assert.equal(updates,1,'only one update check can be in flight');releaseUpdate();await new Promise(resolve=>setImmediate(resolve));
 navigator.onLine=false;windowEvents.online();assert.equal(updates,1);
 navigator.onLine=true;windowEvents.online();assert.equal(updates,2);releaseUpdate();await new Promise(resolve=>setImmediate(resolve));
 document.visibilityState='hidden';documentEvents.visibilitychange();assert.equal(updates,2);
 document.visibilityState='visible';documentEvents.visibilitychange();assert.equal(updates,3);releaseUpdate();await new Promise(resolve=>setImmediate(resolve));
 assert.doesNotMatch(source,/\blocation\s*\.|\breload\s*\(|localStorage|indexedDB|deleteDatabase|\.clear\s*\(/);
});
test('K11520 PWA standalone shell is installable and does not force orientation',()=>{const m=JSON.parse(read('manifest.webmanifest'));assert.equal(m.display,'standalone');assert.equal(m.orientation,'any');assert.ok(m.display_override.includes('fullscreen'));for(const size of [192,512]){const icon=m.icons.find(x=>x.sizes===`${size}x${size}`);assert.ok(icon,`${size}px PWA icon missing`);assert.equal(icon.type,'image/png');assert.match(icon.purpose,/maskable/);assert.deepEqual(pngSize(icon.src),{width:size,height:size})}const h=read('game-5d.html');assert.ok(h.includes('rel="manifest"'));assert.ok(h.includes("serviceWorker.register('./sw.js'"));});
test('K11520 original theme uses only the shared bounded synth and no commercial assets',()=>{const c=read('runtime/game-ui-product-fixes-v23.mjs'),fx=read('runtime/combat-fx-runtime.mjs');assert.ok(c.includes("title:'花果山・星際戰場'"));assert.ok(c.includes('original:true'));assert.ok(c.includes('synthetic:true'));assert.ok(c.includes('getKaiosAudio'));assert.ok(fx.includes('getKaiosAudio'));assert.equal(/new (?:AudioContext|C)\(/.test(c+fx),false);for(const name of ['Just The Way You Are.mp3','Greatest Love Of All.mp3','Take My Breath Away.mp3','情難枕.mp3'])assert.equal(c.includes(name),false);});
