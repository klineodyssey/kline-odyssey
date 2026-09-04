/*
KGEN_META
VERSION: 1.0.0
REVISION: 2026-09-04.WILD-ECOLOGY
STATUS: ACTIVE
PURPOSE: Persistent baseline ecology for the 11520 living world. Wild life is not Exchange Brain freight; it coexists with source-managed Market Life.
*/

export const WILD_ECOLOGY_VERSION='11520-WILD-ECOLOGY-V1';
export const WILD_SPECIES=Object.freeze([
  {species:'FISH',name:'花果山魚',kind:'ANIMAL',count:3,maxHp:30,speed:.010,habitat:'WATER',collectable:true},
  {species:'SHRIMP',name:'花果山蝦',kind:'ANIMAL',count:3,maxHp:18,speed:.012,habitat:'WATER',collectable:true},
  {species:'COW',name:'花果山牛',kind:'ANIMAL',count:2,maxHp:120,speed:.007,habitat:'LAND',collectable:true},
  {species:'SHEEP',name:'花果山羊',kind:'ANIMAL',count:2,maxHp:75,speed:.009,habitat:'LAND',collectable:true},
  {species:'TREE',name:'花果山樹',kind:'PLANT',count:5,maxHp:160,speed:0,habitat:'LAND',collectable:true},
  {species:'FLOWER',name:'花果山花',kind:'PLANT',count:6,maxHp:20,speed:0,habitat:'LAND',collectable:true},
]);

function hash(s){let h=2166136261;for(const c of String(s))h=(h^c.charCodeAt(0))*16777619>>>0;return h>>>0}
function unit(seed){return(hash(seed)%100000)/100000}
function coord(seed,span=46){return (unit(seed)*2-1)*span}

export function createWildEcology({placeId='11520'}={}){
  const lives=[];
  for(const spec of WILD_SPECIES){
    for(let i=0;i<spec.count;i++){
      const n=i+1,lifeId=`LIFE-WILD-${placeId}-${spec.species}-${String(n).padStart(3,'0')}`;
      lives.push({
        lifeId,sourceClass:'WILD_ECOLOGY',species:spec.species,name:`${spec.name} ${n}`,
        kind:spec.kind,habitat:spec.habitat,collectable:spec.collectable,ownerLandId:null,
        x:coord(`${lifeId}:x`),y:0,z:coord(`${lifeId}:z`),homeX:coord(`${lifeId}:x`),homeZ:coord(`${lifeId}:z`),
        maxHp:spec.maxHp,hp:spec.maxHp,vitality:100,speed:spec.speed,age:0,growth:spec.kind==='PLANT'?.35:.55,
        state:'WILD',lastTick:0,
      });
    }
  }
  return {version:WILD_ECOLOGY_VERSION,placeId,lives,lastTick:0};
}

export function tickWildEcology(ecology,{now=Date.now(),dtMs=16}={}){
  const dt=Math.max(0,Math.min(1000,Number(dtMs)||0));
  for(const life of ecology.lives){
    if(life.state!=='WILD')continue;
    life.age+=dt/1000;life.growth=Math.min(1,life.growth+dt/1000/1800);
    if(life.kind==='ANIMAL'&&life.speed>0){
      const phase=now/2200+(hash(life.lifeId)%628)/100;
      const radius=life.habitat==='WATER'?2.4:3.8;
      life.x=life.homeX+Math.cos(phase)*radius;life.z=life.homeZ+Math.sin(phase*.83)*radius;
    }
    life.lastTick=now;
  }
  ecology.lastTick=now;return ecology;
}

export function collectWildLife(ecology,lifeId,{landId=null}={}){
  const life=ecology.lives.find(x=>x.lifeId===lifeId);if(!life)return{ok:false,reason:'LIFE_NOT_FOUND'};
  if(!life.collectable)return{ok:false,reason:'NOT_COLLECTABLE',life};
  if(life.state!=='WILD')return{ok:false,reason:'NOT_WILD',life};
  life.state=landId?'PLAYER_OWNED':'COLLECTED';life.ownerLandId=landId||null;
  return{ok:true,life};
}

export function releaseToLand(ecology,lifeId,{landId,x=0,z=0}={}){
  const life=ecology.lives.find(v=>v.lifeId===lifeId);if(!life)return{ok:false,reason:'LIFE_NOT_FOUND'};
  if(!landId)return{ok:false,reason:'LAND_ID_REQUIRED',life};
  life.state='PLAYER_OWNED';life.ownerLandId=landId;life.x=life.homeX=Number(x)||0;life.z=life.homeZ=Number(z)||0;
  return{ok:true,life};
}

export function visibleWildLives(ecology){return ecology.lives.filter(x=>x.state==='WILD'||x.state==='PLAYER_OWNED')}
