/* KGEN_META
VERSION: 1.0.0
STATUS: ACTIVE
PURPOSE: Original KAIOS/KGEN life capture state machine preserving SAME_LIFE_ID across capture and release.
*/

export const CAPTURE_ITEMS=Object.freeze({
  LIFE_ORB:Object.freeze({id:'LIFE_ORB',name:'Life Orb',basePower:.42}),
  K_SPHERE_CAPSULE:Object.freeze({id:'K_SPHERE_CAPSULE',name:'K Sphere Capsule',basePower:.56}),
  NAIHE_SEAL:Object.freeze({id:'NAIHE_SEAL',name:'Naihe Seal',basePower:.68}),
  MONKEY_KING_RING:Object.freeze({id:'MONKEY_KING_RING',name:'Monkey-King Capture Ring',basePower:.78}),
});

export function createCaptureSession({life,itemId='LIFE_ORB'}={}){
  if(!life?.lifeId)throw new Error('LIFE_ID_REQUIRED');
  if(!CAPTURE_ITEMS[itemId])throw new Error('UNKNOWN_CAPTURE_ITEM');
  return{status:'AIM',lifeId:life.lifeId,lifeSnapshot:structuredClone(life),itemId,spin:0,aimQuality:0,throwQuality:0,hit:false,captured:false,attempts:0};
}
export function aimCapture(session,{quality=0}={}){if(session.status!=='AIM')return session;session.aimQuality=clamp01(quality);session.status='SPIN';return session}
export function spinCapture(session,{turns=0}={}){if(!['SPIN','AIM'].includes(session.status))return session;session.spin=Math.max(0,Number(turns)||0);session.status='THROW';return session}
export function throwCapture(session,{quality=0,hit=true,random=Math.random}={}){
  if(session.status!=='THROW')return{ok:false,reason:'NOT_READY',session};
  session.attempts++;session.throwQuality=clamp01(quality);session.hit=Boolean(hit);if(!session.hit){session.status='AIM';return{ok:false,reason:'MISS',captured:false,session}}
  session.status='RESOLVE';const item=CAPTURE_ITEMS[session.itemId],vitality=clamp01((Number(session.lifeSnapshot.vitality??session.lifeSnapshot.hp??100))/100),weakened=1-vitality,spinBonus=Math.min(.12,session.spin*.018),chance=Math.min(.96,item.basePower+session.aimQuality*.12+session.throwQuality*.16+weakened*.22+spinBonus),roll=clamp01(Number(random())||0);session.captured=roll<chance;session.status=session.captured?'CAPTURED':'AIM';return{ok:true,captured:session.captured,chance,roll,session}
}
export function capturedLifeRecord(session){if(session.status!=='CAPTURED'||!session.captured)return null;return{...structuredClone(session.lifeSnapshot),lifeId:session.lifeId,capture:{itemId:session.itemId,attempts:session.attempts,status:'CAPTURED'},sameLifeId:true}}
export function releaseCapturedLife(record,{x=0,y=0,z=0}={}){if(!record?.lifeId)throw new Error('LIFE_ID_REQUIRED');return{...structuredClone(record),lifeId:record.lifeId,x:Number(x)||0,y:Number(y)||0,z:Number(z)||0,capture:{...(record.capture||{}),status:'RELEASED'},sameLifeId:true}}
function clamp01(n){return Math.max(0,Math.min(1,Number(n)||0))}
