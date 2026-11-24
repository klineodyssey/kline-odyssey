/** First-party KAIOS Portal registry. Product status is not financial readiness. */
export const WORLD_STATUSES=Object.freeze(['PLAYABLE','BETA','UNDER_CONSTRUCTION','RESEARCH','ARCHIVED']);
export const CANONICAL_PORTAL_URL='https://klineodyssey.github.io/kline-odyssey/';
/** Existing bank service; independent of the unfinished K18888 game world. */
export const BANK_SERVICE=Object.freeze({name:'18888 靈霄寶殿銀行',description:'五筆專案撥款／查進度',cta:'開啟銀行',entryUrl:'K線西遊記/temples/18888/index.html#funding-panel'});
const entry=value=>Object.freeze({...value,capabilities:Object.freeze(value.capabilities||[])});
export const SHARED_GAME_VERSION='V2.9.12';
export const WORLD_REGISTRY=Object.freeze([
 entry({worldId:'11520',name:'11520 宇宙萬物交易所',subtitle:'琉璃燈首案 · 商品報價',status:'BETA',entryUrl:'K線西遊記/temples/11520/index.html',version:'4.1.3',audioTheme:null,description:'琉璃燈原案詢價與供應資料；正式價格及商品付款接線待確認。遊戲前往12682阿斗起飛。',capabilities:['商品詢價','BSC56 換幣入口'],cta:'進入報價',tone:'jade'}),
 entry({worldId:'12682',canonicalWorldId:'12682',name:'阿斗起飛',subtitle:'12682 · 飛碟駕駛艙與 5D 遊戲',status:'BETA',entryUrl:'K線西遊記/temples/11520/game-5d.html?world=12682',version:SHARED_GAME_VERSION,audioTheme:null,description:'原遊戲移至 12682 展示點位；沿用同一引擎及既有存檔，不複製帳本。商品詢價留在 11520。',capabilities:['飛碟駕駛艙','5D 遊戲'],cta:'前往阿斗起飛',tone:'blue'}),
 entry({worldId:'88888',canonicalWorldId:'12682',routeOnly:true,name:'舊遊戲入口',subtitle:'導向 12682 阿斗起飛',status:'BETA',entryUrl:'K線西遊記/temples/88888/index.html',version:SHARED_GAME_VERSION,audioTheme:null,description:'相容既有書籤；開啟同一套 12682 遊戲，保留玩家與存檔。',capabilities:['相容入口'],cta:'前往阿斗起飛',tone:'blue'}),
 entry({worldId:'12345',name:'K12345 Heart',subtitle:'Heart · 生命與信念',status:'PLAYABLE',entryUrl:'K線西遊記/temples/12345/index.html',version:'CURRENT',audioTheme:'HEART',description:'走進悟空財神殿，探索 Heart 的生命節奏與互動空間。',capabilities:['Heart','互動神殿'],cta:'進入 Heart',tone:'rose'}),
 entry({worldId:'16888',name:'K16888 Universe',subtitle:'Universe · 星際探索',status:'PLAYABLE',entryUrl:'K線西遊記/temples/16888/index.html',version:'CURRENT',audioTheme:'UNIVERSE',description:'前往廣寒宮，在 Universe 的星空中展開另一段探索。',capabilities:['Universe','星空探索'],cta:'進入 Universe',tone:'blue'}),
 entry({worldId:'kgen',name:'KGEN 生態系',subtitle:'制度與市場資訊',status:'RESEARCH',entryUrl:'markets/',version:'CURRENT',audioTheme:null,description:'了解 KGEN、公開市場資訊與資產安全邊界。',capabilities:['INFORMATION_ONLY']}),
 entry({worldId:'civilization',name:'文明與生命',subtitle:'研究 / 設計',status:'RESEARCH',entryUrl:'civilization/',version:'CURRENT',audioTheme:null,description:'閱讀文明、生命與世界系統的設計。',capabilities:['INFORMATION_ONLY']}),
 entry({worldId:'physics',name:'宇宙 Physics',subtitle:'CURRENT Canon',status:'RESEARCH',entryUrl:'docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md',version:'CURRENT',audioTheme:null,description:'查看 KAIOS 世界尺度與物理模擬規則。',capabilities:['INFORMATION_ONLY']}),
 entry({worldId:'life',name:'Life 研究展示',subtitle:'研究 / 非正式遊戲',status:'RESEARCH',entryUrl:'world-viewer/life-runtime/',version:'CURRENT',audioTheme:null,description:'觀察生命系統的研究展示，不是正式遊戲入口。',capabilities:['INFORMATION_ONLY']}),
 entry({worldId:'full-world',name:'KAIOS 完整世界研究展示',subtitle:'RESEARCH · LOCAL SIMULATION',status:'RESEARCH',entryUrl:'world-viewer/',version:'CURRENT',audioTheme:null,description:'文明與土地的本機模擬展示；沒有正式資產或 Production authority。',capabilities:['INFORMATION_ONLY'],disclosure:true}),
 entry({worldId:'k280',name:'K280 數位生命研究展示',subtitle:'RESEARCH · READ ONLY',status:'RESEARCH',entryUrl:'world-viewer/k280/',version:'CURRENT',audioTheme:null,description:'觀察數位恐龍 K280 與公開生命資料，不是已完成的玩家世界。',capabilities:['INFORMATION_ONLY'],disclosure:true}),
 entry({worldId:'ai-company',name:'KAIOS AI 公司研究展示',subtitle:'RESEARCH · NO EXTERNAL AUTONOMY',status:'RESEARCH',entryUrl:'world-viewer/ai-company-v1/',version:'CURRENT',audioTheme:null,description:'公司任務與工程規劃的本機模擬；無真實錢包、KGEN、合約或外部執行權。',capabilities:['INFORMATION_ONLY'],disclosure:true}),
 entry({worldId:'mars',name:'Mars 世界',subtitle:'建設中',status:'UNDER_CONSTRUCTION',entryUrl:null,version:'DESIGN',audioTheme:null,description:'火星世界尚未開放正式遊玩。',capabilities:[]}),
 ...['18888','18921','20888','21319','21520','21666','21888','22188','23333','108000'].map(id=>entry({worldId:id,name:id==='18888'?'K18888 遊戲世界':`K${id}`,subtitle:'未開放世界',status:'UNDER_CONSTRUCTION',entryUrl:null,version:'DESIGN',audioTheme:null,description:'規劃與展示保留於資料庫，正式玩法仍在建設中。',capabilities:[]}))
]);
export const isPlayable=world=>world?.status==='PLAYABLE';
export const isNavigable=world=>isPlayable(world)||(world?.status==='BETA'&&typeof world.entryUrl==='string'&&!!world.cta);
export const findWorld=id=>WORLD_REGISTRY.find(world=>world.worldId===String(id));
export function playableDestination(id){const world=findWorld(id);return isPlayable(world)?world.entryUrl:null}
export function entryDestination(id){const world=findWorld(id);return isNavigable(world)?world.entryUrl:null}
export const SHARED_GAME_ENTRY='K線西遊記/temples/11520/game-5d.html?world=12682';
export const SHARED_GAME_HOST_ENTRY=SHARED_GAME_ENTRY;
/** Presentation only: both locations use the same modules, version and saved player. */
export function sharedGamePresentation(source=globalThis.location){
 // Preserve the legacy storage/session identity; only the public game point moves.
 return Object.freeze({displayWorldId:'12682',canonicalWorldId:'12682',sessionWorld:'K11520',title:'12682 阿斗起飛',version:SHARED_GAME_VERSION,storageIdentityChanged:false,valueDifference:'NOT_DEFINED'});
}
export function resumeDestination(id){return ['11520','88888','12682'].includes(String(id))?SHARED_GAME_HOST_ENTRY:playableDestination(id)}
export function portalBase(moduleUrl=import.meta.url){return new URL('../',moduleUrl)}
export function worldUrl(id,base=portalBase()){const path=entryDestination(id);return path?new URL(path,base).href:null}
export function sharedGameUrl(base=portalBase(),id='88888'){
 if(!['11520','88888','12682'].includes(String(id)))return null;
 const root=new URL(base);if(!['http:','https:'].includes(root.protocol)||root.username||root.password||!root.pathname.endsWith('/'))throw new Error('INVALID_PORTAL_BASE');
 return new URL(SHARED_GAME_ENTRY,root).href;
}
/** Only the original Portal destination may leave the shared frame at the top level. */
export function sharedGamePortalExit(childHref,base=portalBase()){
 try{
  const root=new URL(base),child=new URL(childHref);
  if(!['http:','https:'].includes(root.protocol)||root.username||root.password||!root.pathname.endsWith('/'))return null;
  if(child.origin!==root.origin||child.username||child.password||child.search||child.hash)return null;
  return child.href===root.href||child.href===new URL('index.html',root).href?root.href:null;
 }catch{return null}
}
/** Shared navigation button for existing world entry bridges; no game or financial actions. */
export function mountSharedGameEntry({container,base=portalBase(),layout='floating'}={}){
 const doc=container?.ownerDocument;if(!doc||typeof container.append!=='function')return null;
 if(!['floating','flow'].includes(layout))return null;
 const destination=worldUrl('12682',base);if(!destination)return null;
 let link=doc.getElementById('kaiosSharedGameEntry');
 if(!link){link=doc.createElement('a');link.id='kaiosSharedGameEntry';link.dataset.kaiosSharedGameEntry='12682';link.textContent='12682 阿斗起飛';link.setAttribute('aria-label','開啟12682阿斗起飛遊戲');Object.assign(link.style,{display:'inline-flex',alignItems:'center',minHeight:'44px',padding:'0 12px',border:'1px solid #68e4ff66',borderRadius:'10px',background:'#101923',color:'#e6f5ff',font:'13px system-ui',textDecoration:'none'});}
 if(layout==='flow'){link.classList.add('nav-btn');Object.assign(link.style,{position:'static',left:'auto',right:'auto',top:'auto',bottom:'auto',zIndex:'auto'});}
 else{link.classList.remove('nav-btn');Object.assign(link.style,{position:'fixed',left:'max(8px,env(safe-area-inset-left))',right:'auto',top:'auto',bottom:'max(8px,env(safe-area-inset-bottom))',zIndex:'10035'});}
 link.dataset.kaiosSharedGameLayout=layout;if(link.parentNode!==container)container.append(link);
 link.href=destination;link.target='_top';link.title=`12682 阿斗起飛 · ${SHARED_GAME_VERSION}`;return link;
}
export function validateWorldRegistry(registry=WORLD_REGISTRY){
 const ids=new Set();
 for(const w of registry){
  if(ids.has(w.worldId)||!WORLD_STATUSES.includes(w.status)||!w.name||!w.subtitle||!w.version||!w.description||!Array.isArray(w.capabilities))throw new Error('INVALID_WORLD_REGISTRY');
  ids.add(w.worldId);
  if(w.entryUrl!==null&&(typeof w.entryUrl!=='string'||/^(?:[a-z]+:|\/)|\.\./i.test(w.entryUrl)))throw new Error('UNSAFE_WORLD_ENTRY');
  if(isPlayable(w)&&(!w.entryUrl||!w.audioTheme||!w.cta))throw new Error('PLAYABLE_ENTRY_REQUIRED');
  if(w.status==='UNDER_CONSTRUCTION'&&w.entryUrl!==null)throw new Error('CONSTRUCTION_MUST_NOT_PRETEND_PLAYABLE');
 }
 return true;
}
validateWorldRegistry();
