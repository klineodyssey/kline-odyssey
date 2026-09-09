/* KGEN_META
VERSION: 1.0.0
STATUS: PROTOTYPE / SIMULATION-FIRST
FORMAL_ORGAN_NAME: 11520 Monster Aggression Runtime
PURPOSE: Pure helper for hostile source-managed monsters. Monsters with attack power and at least one OPPOSED market relation may chase a nearby player, stop inside attack range, and emit simulation-only KAIOS/HP damage events through world-runtime. No settlement, wallet, chain, payment, treasury, governance, or secret mutation.
*/

const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;

export function opposedAxisCount(relation){
  return Object.values(relation?.byAxis||{}).filter(x=>x?.relation==='OPPOSED').length;
}

export function isHostileMonster(monster){
  return !!monster&&monster.state!=='DEAD'&&finite(monster.attack)>0&&opposedAxisCount(monster.marketRelation)>0;
}

export function chaseStep(monster,player,{deltaMs=16,aggroRange=8,attackRange=1.55}={}){
  const dx=finite(player?.x)-finite(monster?.x),dy=finite(player?.y)-finite(monster?.y),dz=finite(player?.z)-finite(monster?.z);
  const distance=Math.hypot(dx,dy,dz);
  if(!isHostileMonster(monster)||distance>aggroRange)return{state:'ROAM',distance,moved:false,inAttackRange:false};
  if(distance<=attackRange)return{state:'ATTACK',distance,moved:false,inAttackRange:true};
  const speed=Math.max(.004,finite(monster.speed,.01));
  const step=Math.min(distance,speed*Math.max(0,finite(deltaMs)));
  if(distance>0){monster.x+=dx/distance*step;monster.y+=dy/distance*step;monster.z+=dz/distance*step;if(monster.marketLife?.world)monster.marketLife.world.position={x:monster.x,y:monster.y,z:monster.z}}
  const after=Math.hypot(finite(player?.x)-monster.x,finite(player?.y)-monster.y,finite(player?.z)-monster.z);
  return{state:after<=attackRange?'ATTACK':'CHASE',distance:after,moved:step>0,inAttackRange:after<=attackRange};
}

export function maybeMonsterHit(monster,player,now,{cooldownMs=1200,attackRange=1.55}={}){
  const distance=Math.hypot(finite(player?.x)-finite(monster?.x),finite(player?.y)-finite(monster?.y),finite(player?.z)-finite(monster?.z));
  if(!isHostileMonster(monster)||distance>attackRange)return null;
  if(finite(now)-finite(monster.lastAttackAt)<cooldownMs)return null;
  monster.lastAttackAt=finite(now);
  return{type:'PLAYER_HIT',monsterId:monster.id,lifeId:monster.lifeId||null,damage:Math.max(0,finite(monster.attack)),damageAsset:'KAIOS_HP',simulationOnly:true,distance};
}
