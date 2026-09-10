/* KGEN_META
VERSION: 1.0.1
STATUS: PROTOTYPE / SIMULATION-FIRST
FORMAL_ORGAN_NAME: 11520 Monster Aggression Runtime
PURPOSE: Pure helper for actual hostile monster species. Hostile monsters may chase a nearby player, stop inside attack range, and emit simulation-only KAIOS-HP contact damage. Market-relation state is reported as context but is not mutated here. No settlement, wallet, chain, payment, treasury, governance, or secret mutation.
*/

const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
export const HOSTILE_MONSTER_SPECIES=Object.freeze(['STONE_APE','FIRE_WISP','BULL_DEMON']);

export function opposedAxisCount(relation){
  return Object.values(relation?.byAxis||{}).filter(x=>x?.relation==='OPPOSED').length;
}

export function isHostileMonster(monster){
  const species=String(monster?.species||'').toUpperCase();
  const role=String(monster?.sourceMeta?.role||monster?.sourceMeta?.kind||'').toUpperCase();
  return !!monster&&monster.state!=='DEAD'&&finite(monster.attack)>0&&(HOSTILE_MONSTER_SPECIES.includes(species)||role==='MONSTER'||role==='HOSTILE');
}

export function chaseStep(monster,player,{deltaMs=16,aggroRange=8,attackRange=1.55}={}){
  const dx=finite(player?.x)-finite(monster?.x),dy=finite(player?.y)-finite(monster?.y),dz=finite(player?.z)-finite(monster?.z);
  const distance=Math.hypot(dx,dy,dz);
  if(!isHostileMonster(monster)||distance>aggroRange)return{state:'ROAM',distance,moved:false,inAttackRange:false,conflictAxes:opposedAxisCount(monster?.marketRelation)};
  if(distance<=attackRange)return{state:'ATTACK',distance,moved:false,inAttackRange:true,conflictAxes:opposedAxisCount(monster?.marketRelation)};
  const speed=Math.max(.004,finite(monster.speed,.01));
  const step=Math.min(distance,speed*Math.max(0,finite(deltaMs)));
  if(distance>0){monster.x+=dx/distance*step;monster.y+=dy/distance*step;monster.z+=dz/distance*step;if(monster.marketLife?.world)monster.marketLife.world.position={x:monster.x,y:monster.y,z:monster.z}}
  const after=Math.hypot(finite(player?.x)-monster.x,finite(player?.y)-monster.y,finite(player?.z)-monster.z);
  return{state:after<=attackRange?'ATTACK':'CHASE',distance:after,moved:step>0,inAttackRange:after<=attackRange,conflictAxes:opposedAxisCount(monster?.marketRelation)};
}

export function maybeMonsterHit(monster,player,now,{cooldownMs=1200,attackRange=1.55}={}){
  const distance=Math.hypot(finite(player?.x)-finite(monster?.x),finite(player?.y)-finite(monster?.y),finite(player?.z)-finite(monster?.z));
  if(!isHostileMonster(monster)||distance>attackRange)return null;
  if(finite(now)-finite(monster.lastAttackAt)<cooldownMs)return null;
  monster.lastAttackAt=finite(now);
  return{type:'PLAYER_HIT',monsterId:monster.id,lifeId:monster.lifeId||null,damage:Math.max(0,finite(monster.attack)),damageAsset:'KAIOS_HP',simulationOnly:true,distance,conflictAxes:opposedAxisCount(monster.marketRelation)};
}
