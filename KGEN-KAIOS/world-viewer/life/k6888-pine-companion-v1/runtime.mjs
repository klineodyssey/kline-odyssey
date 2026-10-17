/** KAIOS K6888 pine-and-companion pilot. No on-chain/financial authority. */
export const MAP_POINT_ID = 'P_6888p0_松樹國_R26';
export const K_COORDINATE = 6888;
export const PINE_ID = 'K6888-PINE-FLAG-001';
export const MODES = Object.freeze(['FOLLOW','GUARD','HARD_FIGHT','ROAM','STAY']);
export const ANIMALS = Object.freeze({
  GOOSE:   { label:'鵝', icon:'🪿', speed:1.6, domesticated:true, protected:false, habitat:'LAND' },
  CHICKEN: { label:'雞', icon:'🐓', speed:1.0, domesticated:true, protected:false, habitat:'LAND' },
  DOG:     { label:'狗', icon:'🐕', speed:1.8, domesticated:true, protected:false, habitat:'LAND' },
  TIGER:   { label:'虎', icon:'🐅', speed:2.1, domesticated:false, protected:true, habitat:'LAND' },
  LEOPARD: { label:'豹', icon:'🐆', speed:2.2, domesticated:false, protected:true, habitat:'LAND' },
  ELEPHANT:{ label:'象', icon:'🐘', speed:0.75, domesticated:false, protected:true, habitat:'LAND' },
  FISH:    { label:'魚', icon:'🐟', speed:0.75, domesticated:false, protected:false, habitat:'WATER' }
});
const COMMANDS=Object.freeze({
  'zh-TW': {'跟隨':'FOLLOW','跟著我':'FOLLOW','守衛':'GUARD','保護我':'GUARD','硬幹':'HARD_FIGHT','攻擊':'HARD_FIGHT','自由活動':'ROAM','我行我素':'ROAM','待命':'STAY','停下':'STAY'},
  'en-US': {'follow':'FOLLOW','follow me':'FOLLOW','guard':'GUARD','defend':'GUARD','fight':'HARD_FIGHT','attack':'HARD_FIGHT','roam':'ROAM','free roam':'ROAM','stay':'STAY','wait':'STAY'},
  'three-kingdoms': {'隨我來':'FOLLOW','主公隨我':'FOLLOW','護駕':'GUARD','列陣守護':'GUARD','迎戰':'HARD_FIGHT','硬戰':'HARD_FIGHT','各自活動':'ROAM','自行巡遊':'ROAM','按兵不動':'STAY'}
});
const finite=(n)=>Number.isFinite(n)&&typeof n==='number';
const clone=(x)=>structuredClone(x);
const note=(w,type,payload={})=>{w.revision++;w.events.push({seq:w.revision,atSeconds:w.clockSeconds,type,...payload});if(w.events.length>100)w.events.shift()};
export function createK6888World({playerId='GUEST-PLAYER'}={}) {
  if(typeof playerId!=='string'||!playerId.trim())throw Error('PLAYER_ID_REQUIRED');
  return {schema:'KAIOS-K6888-PILOT-V1',pointId:MAP_POINT_ID,kCoordinate:K_COORDINATE,
    player:{id:playerId,x:0,z:0},tree:{id:PINE_ID,x:0,z:-3,planted:false,story:'AU 插松樹為旗・松樹國，並非現實土地權狀',lifeId:null,photoSeal:null},
    animals:Object.fromEntries(Object.entries(ANIMALS).map(([species,config],i)=>[species,{id:`K6888-${species}-CANDIDATE-001`,species,x:2+i*1.6,z:i%2?2:-1,mode:'ROAM',energy:100,hp:100,keeperId:playerId,lifeId:null,photoSeal:null,registration:'GAME_CANDIDATE_NOT_FORMAL_LIFE',ownership:'GAME_KEEPER_LINK_NOT_REAL_PROPERTY',released:false,listing:null}])),
    clockSeconds:0,events:[],revision:0,marketOrders:[],paymentReceipts:[],landTitle:null};
}
export function parseCommand(text,language='zh-TW',dictionaryVersion=null){
  if(language==='K300'||language==='K5')return {status:'DICTIONARY_ADAPTER_REQUIRED',intent:null,language,dictionaryVersion};
  const dict=COMMANDS[language];if(!dict)return {status:'LANGUAGE_NOT_SUPPORTED',intent:null,language};
  const key=String(text||'').trim().toLowerCase();const intent=dict[key]??null;
  return {status:intent?'RECOGNIZED':'INTENT_UNKNOWN',intent,language};
}
export function selectAnimal(world,species){const a=world.animals?.[String(species||'').toUpperCase()];return a?clone(a):null}
export function plantPineFlag(world,{requesterId}={}){
  if(requesterId!==world.player.id)return {ok:false,reason:'KEEPER_REQUIRED',world};
  if(world.pointId!==MAP_POINT_ID)return {ok:false,reason:'WRONG_POINT',world};
  const w=clone(world);if(w.tree.planted)return {ok:true,status:'ALREADY_PLANTED',world:w};
  w.tree.planted=true;note(w,'PINE_FLAG_PLANTED',{pointId:MAP_POINT_ID,treeId:PINE_ID,authority:'FICTIONAL_CIVILIZATION_STORY_ONLY'});
  return {ok:true,status:'GAME_TREE_PLANTED',world:w};
}
export function commandAnimal(world,{species,command,language='zh-TW',requesterId,dictionaryVersion=null}={}){
  const w=clone(world);let animal=w.animals?.[String(species||'').toUpperCase()];
  if(!animal)return {ok:false,reason:'ANIMAL_NOT_FOUND',world};
  if(requesterId!==animal.keeperId)return {ok:false,reason:'KEEPER_REQUIRED',world};
  if(animal.released)return {ok:false,reason:'ANIMAL_RELEASED',world};
  const parsed=MODES.includes(command)?{status:'RECOGNIZED',intent:command}:parseCommand(command,language,dictionaryVersion);
  if(parsed.status!=='RECOGNIZED')return {ok:false,reason:parsed.status,world};
  if(animal.energy<5&&parsed.intent==='HARD_FIGHT')return {ok:false,reason:'ANIMAL_TIRED',world};
  animal.mode=parsed.intent;note(w,'ANIMAL_COMMAND_ACCEPTED',{animalId:animal.id,mode:animal.mode,language,owner:requesterId});
  return {ok:true,status:'GAME_COMMAND_ACCEPTED',world:w};
}
export function advanceWorld(world,seconds=1){
  if(!finite(seconds)||seconds<=0||seconds>60)throw Error('INVALID_TICK');
  let w=clone(world);w.clockSeconds+=seconds;
  for(const a of Object.values(w.animals)){
    if(a.released||a.hp<=0)continue;
    const profile=ANIMALS[a.species];
    if(a.mode==='FOLLOW'){
      const dx=w.player.x-a.x,dz=w.player.z-a.z,dist=Math.hypot(dx,dz);
      if(dist>1){const move=Math.min(dist-1,profile.speed*seconds);a.x+=dx/dist*move;a.z+=dz/dist*move;a.energy=Math.max(0,a.energy-move*.6)}
    }else if(a.mode==='ROAM'){
      const drift=(a.species.length%3+1)*.08*seconds;
      a.x+=Math.cos((w.clockSeconds+a.id.length)/6)*drift;a.z+=Math.sin((w.clockSeconds+a.id.length)/6)*drift;
      a.energy=Math.max(0,a.energy-.02*seconds);
    }else if(a.mode==='GUARD'){
      const dist=Math.hypot(w.player.x-a.x,w.player.z-a.z);
      if(dist>3){const step=Math.min(dist-2,profile.speed*seconds);a.x+=(w.player.x-a.x)/dist*step;a.z+=(w.player.z-a.z)/dist*step}
    }else if(a.mode==='HARD_FIGHT'){
      // A bounded nonviolent demo state only. A real hostile target and hitbox must be verified before contact damage.
      a.energy=Math.max(0,a.energy-.15*seconds);
    }else if(a.mode==='STAY')a.energy=Math.min(100,a.energy+.1*seconds);
    a.x=Math.round(a.x*10000)/10000;a.z=Math.round(a.z*10000)/10000;
  }
  note(w,'WORLD_TICK',{seconds});return w;
}
export function animalTradePreview(world,{species,requesterId,action}={}){
  const a=world.animals?.[String(species||'').toUpperCase()],p=ANIMALS[String(species||'').toUpperCase()];
  if(!a||!p)return {status:'REJECTED',reason:'ANIMAL_NOT_FOUND'};
  if(a.keeperId!==requesterId)return {status:'REJECTED',reason:'KEEPER_REQUIRED'};
  if(a.released)return {status:'REJECTED',reason:'ANIMAL_RELEASED'};
  if(action==='SELL')return p.protected||!p.domesticated?{status:'REJECTED',reason:'SPECIES_PROTECTED_OR_NON_DOMESTICATED'}:{status:'QUOTE_DRAFT_ONLY',reason:'NO_ASSET_TITLE_OR_REAL_PAYMENT'};
  if(action==='RELEASE')return {status:'CARE_AND_HABITAT_REVIEW_REQUIRED',reason:'RELEASE_NOT_AUTOMATIC'};
  if(action==='BREED')return {status:'PAIR_CARE_AND_SPECIES_REVIEW_REQUIRED',reason:'NO_AUTOMATIC_LIFE_MINT'};
  if(action==='SLAUGHTER')return {status:'NOT_ENABLED',reason:'NO_ARBITRARY_LIFE_DISPOSAL'};
  return {status:'REJECTED',reason:'ACTION_UNKNOWN'};
}
export function validateWorld(world){
  if(!world||world.schema!=='KAIOS-K6888-PILOT-V1'||world.pointId!==MAP_POINT_ID||world.tree?.id!==PINE_ID||!world.animals)throw Error('INVALID_WORLD');
  for(const [species,a] of Object.entries(world.animals))if(!ANIMALS[species]||a.species!==species||!MODES.includes(a.mode)||!finite(a.x)||!finite(a.z)||!finite(a.energy)||a.energy<0||a.energy>100)throw Error('INVALID_ANIMAL');
  if((world.marketOrders||[]).length>0||(world.paymentReceipts||[]).length>0||world.landTitle!==null)throw Error('FINANCIAL_OR_LAND_AUTHORITY_FORBIDDEN');
  return true;
}