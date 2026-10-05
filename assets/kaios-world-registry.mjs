/** First-party KAIOS Portal registry. Product status is not financial readiness. */
export const WORLD_STATUSES=Object.freeze(['PLAYABLE','BETA','UNDER_CONSTRUCTION','RESEARCH','ARCHIVED']);
export const CANONICAL_PORTAL_URL='https://klineodyssey.github.io/kline-odyssey/';
const entry=value=>Object.freeze({...value,capabilities:Object.freeze(value.capabilities||[])});
export const WORLD_REGISTRY=Object.freeze([
 entry({worldId:'11520',name:'K11520',subtitle:'花果山 · 5D K線西遊記',status:'PLAYABLE',entryUrl:'K線西遊記/temples/11520/game-5d.html',version:'V2.9.3',audioTheme:'JOURNEY',description:'從第一隻守關猿開始，升級解鎖六相技能、Boss 與每日取經。',capabilities:['Guest first','取經與戰鬥','Player Life'],cta:'立即遊玩',tone:'jade'}),
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
 ...['18888','18921','20888','21319','21520','21666','21888','22188','23333','108000'].map(id=>entry({worldId:id,name:`K${id}`,subtitle:'未開放世界',status:'UNDER_CONSTRUCTION',entryUrl:null,version:'DESIGN',audioTheme:null,description:'規劃與展示保留於資料庫，正式玩法仍在建設中。',capabilities:[]}))
]);
export const isPlayable=world=>world?.status==='PLAYABLE';
export const findWorld=id=>WORLD_REGISTRY.find(world=>world.worldId===String(id));
export function playableDestination(id){const world=findWorld(id);return isPlayable(world)?world.entryUrl:null}
export function portalBase(moduleUrl=import.meta.url){return new URL('../',moduleUrl)}
export function worldUrl(id,base=portalBase()){const path=playableDestination(id);return path?new URL(path,base).href:null}
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
