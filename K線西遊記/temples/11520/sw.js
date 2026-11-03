const CACHE='k11520-shell-20261103-revalidate';
const SHARED=['../../../assets/kaios-audio.mjs','../../../assets/kaios-audio-ui.mjs','../../../assets/kaios-audio.css','../../../assets/kaios-world-registry.mjs'];
const SHELL=['./game-5d.html','./manifest.webmanifest','./runtime/game-5d-bootstrap.mjs','./runtime/game-5d-main.mjs','./runtime/combat-fx-runtime.mjs','./assets/ui/k11520-pwa-192.png','./assets/ui/k11520-pwa-512.png',...SHARED];
// Revalidate the published shell; an HTTP-cache hit must not seed an old release.
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL.map(path=>new Request(new URL(path,self.location.href),{cache:'reload'})))).then(()=>self.skipWaiting())));
// Only this worker's named asset caches are retired. Player/wallet stores are untouched.
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('k11520-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const u=new URL(e.request.url),scope=new URL('./',self.location.href),shared=SHARED.some(path=>new URL(path,self.location.href).href===u.href);
 if(u.origin!==location.origin||(!u.pathname.startsWith(scope.pathname)&&!shared)||/\/(?:api|rpc)(?:\/|$)/i.test(u.pathname))return;
 const code=e.request.mode==='navigate'||/\.(?:html?|mjs|cjs|js|css|webmanifest)$/i.test(u.pathname);
 e.respondWith(fetch(e.request,code?{cache:'no-cache'}:undefined).then(r=>{
  if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{}))}
  return r;
 }).catch(async()=>{
  try{
   const cache=await caches.open(CACHE),cached=await cache.match(e.request);
   if(cached)return cached;
   if(e.request.mode==='navigate')return(await cache.match(new URL('./game-5d.html',self.location.href).href))||Response.error();
  }catch{}
  return Response.error();
 }));
});
