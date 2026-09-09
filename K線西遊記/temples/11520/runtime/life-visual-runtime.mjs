/* KGEN_META
VERSION: 1.2.0
REVISION: 2026-09-09.SELECTABLE-LIFE-METADATA
STATUS: CANDIDATE
PURPOSE: Procedural 3D life bodies plus visible living-world work/logistics/lifestyle state for 11520 Market Life and Digital Ant creatures, with canonical selectable identity/HP/XYZ metadata.
*/

export const LIFE_VISUAL_POLICY=Object.freeze({
  primitiveFallbackOnlyOnLoadFailure:true,
  fallbackLabel:'FALLBACK',
});

const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
function colorForSpecies(species='LIFE'){
  let h=2166136261;
  for(const c of String(species))h=(h^c.charCodeAt(0))*16777619>>>0;
  return h&0xffffff;
}

export function lifePresentationState(life={}){
  const action=String(life.marketLife?.lifestyle?.action||life.lifestyle?.action||'REST').toUpperCase();
  const missionStatus=String(life.mission?.status||'').toUpperCase();
  const isAnt=/ANT/i.test(String(life.species||''));
  const carrying=Boolean(isAnt&&(finite(life.cargo?.amount)>0||['ASSIGNED','IN_TRANSIT','ARRIVED_AWAITING_RECEIPT'].includes(missionStatus)));
  const waitingReceipt=missionStatus==='ARRIVED_AWAITING_RECEIPT';
  const retired=action==='RETIRE';
  const traveling=['TRAVEL','EXPLORE'].includes(action);
  const working=action==='WORK'||missionStatus==='IN_TRANSIT';
  const resting=['REST','EAT','SOCIAL'].includes(action);
  const retreating=action==='RETREAT'||life.state==='RETREATING';
  return {
    action,missionStatus,isAnt,carrying,waitingReceipt,retired,traveling,working,resting,retreating,
    scale:retired?0.94:resting?0.97:traveling||working?1.03:1,
    pitch:retreating?-0.12:traveling||working?0.08:0,
    status:'WAITING_RECEIPT',
  };
}

export function createProceduralLifeBody(THREE,{species='LIFE',name='Market Life',scale=1}={}){
  if(!THREE)throw new Error('THREE_REQUIRED');
  const root=new THREE.Group();
  root.name=`LIFE:${name}`;
  root.userData={lifeVisual:true,species,name,displayName:name,visualMode:'PROCEDURAL_3D',baseScale:Number(scale)||1};
  const color=colorForSpecies(species);
  const mat=new THREE.MeshStandardMaterial({color,roughness:.72,metalness:.08});
  const dark=new THREE.MeshStandardMaterial({color:0x15202b,roughness:.8});
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.72,5,10),mat);body.position.y=.82;
  const head=new THREE.Mesh(new THREE.SphereGeometry(.31,14,10),mat);head.position.y=1.48;
  const eyeGeom=new THREE.SphereGeometry(.045,8,6);
  const e1=new THREE.Mesh(eyeGeom,dark),e2=new THREE.Mesh(eyeGeom,dark);e1.position.set(-.11,1.52,.285);e2.position.set(.11,1.52,.285);
  root.add(body,head,e1,e2);
  if(/ANT/i.test(species)){for(const x of[-.3,.3])for(const y of[.55,.85,1.12]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.52,6),dark);leg.rotation.z=Math.PI/2.6;leg.position.set(x,y,0);root.add(leg)}}
  if(/WISP|FIRE/i.test(species)){const crown=new THREE.Mesh(new THREE.ConeGeometry(.34,.7,8),mat);crown.position.y=1.9;root.add(crown)}
  if(/BULL|DEMON/i.test(species)){for(const x of[-.24,.24]){const horn=new THREE.Mesh(new THREE.ConeGeometry(.09,.48,8),dark);horn.position.set(x,1.78,0);horn.rotation.z=x<0?.42:-.42;root.add(horn)}}

  const cargo=new THREE.Group();cargo.name='LIFE_STATUS_CARGO';cargo.visible=false;
  const cargoBody=new THREE.Mesh(new THREE.BoxGeometry(.62,.42,.46),new THREE.MeshStandardMaterial({color:0xc79a36,roughness:.48,metalness:.48}));
  cargoBody.position.set(0,.82,-.48);cargo.add(cargoBody);root.add(cargo);
  const statusRing=new THREE.Mesh(new THREE.TorusGeometry(.48,.045,8,28),new THREE.MeshStandardMaterial({color:0x62d7ff,emissive:0x123744,roughness:.35,metalness:.25}));
  statusRing.name='LIFE_STATUS_RECEIPT';statusRing.rotation.x=Math.PI/2;statusRing.position.y=.08;statusRing.visible=false;root.add(statusRing);
  const retirementHalo=new THREE.Mesh(new THREE.TorusGeometry(.39,.035,8,30),new THREE.MeshStandardMaterial({color:0xffd66b,emissive:0x4b3610,roughness:.3,metalness:.4}));
  retirementHalo.name='LIFE_STATUS_RETIREMENT';retirementHalo.position.y=1.94;retirementHalo.visible=false;root.add(retirementHalo);

  root.scale.setScalar(Number(scale)||1);
  return root;
}

export function createFallbackLifeBody(THREE,{name='Life',scale=1}={}){
  if(!THREE)throw new Error('THREE_REQUIRED');
  const mesh=new THREE.Mesh(new THREE.DodecahedronGeometry(.55),new THREE.MeshStandardMaterial({color:0x7b2025}));
  mesh.name=`FALLBACK:${name}`;mesh.userData={lifeVisual:true,visualMode:'FALLBACK',fallback:true,label:LIFE_VISUAL_POLICY.fallbackLabel,name,displayName:name,baseScale:Number(scale)||1};mesh.scale.setScalar(Number(scale)||1);return mesh;
}

export async function createLifeVisual(THREE,{gltfLoader=null,modelUrl=null,...spec}={}){
  if(modelUrl&&gltfLoader){try{const gltf=await new Promise((resolve,reject)=>gltfLoader.load(modelUrl,resolve,undefined,reject));const root=gltf.scene;root.userData={...(root.userData||{}),lifeVisual:true,visualMode:'GLTF_3D',fallback:false,species:spec.species,name:spec.name,displayName:spec.name,baseScale:Number(spec.scale)||1};return{root,mode:'GLTF_3D',fallback:false}}catch{/* fall through to procedural */}}
  try{return{root:createProceduralLifeBody(THREE,spec),mode:'PROCEDURAL_3D',fallback:false}}catch(error){return{root:createFallbackLifeBody(THREE,spec),mode:'FALLBACK',fallback:true,error}}
}

export function syncLifeVisual(root,life={}){
  if(!root)return;
  const p=lifePresentationState(life),base=finite(root.userData?.baseScale,1)||1;
  const x=finite(life.x),y=finite(life.y),z=finite(life.z);
  const hp=Math.max(0,finite(life.hp,finite(life.vitality,0)));
  const maxHp=Math.max(1,finite(life.maxHp,100));
  root.visible=life.state!=='DEAD';
  root.position.set(x,Math.max(.05,y),z);
  root.scale.setScalar(base*p.scale);
  root.rotation.x=p.pitch;
  const cargo=root.getObjectByName?.('LIFE_STATUS_CARGO');if(cargo)cargo.visible=p.carrying;
  const receipt=root.getObjectByName?.('LIFE_STATUS_RECEIPT');if(receipt)receipt.visible=p.waitingReceipt;
  const retirementHalo=root.getObjectByName?.('LIFE_STATUS_RETIREMENT');if(retirementHalo)retirementHalo.visible=p.retired;
  root.userData={...(root.userData||{}),lifeVisual:true,lifeId:life.lifeId||null,sourceLifeId:life.sourceLifeId||null,displayName:life.name||life.baseName||root.userData?.displayName||root.userData?.name||life.species||'生命',name:life.name||life.baseName||root.userData?.name||life.species||'生命',species:life.species||root.userData?.species||'LIFE',hp,maxHp,x,y,z,sourceManaged:Boolean(life.sourceManaged),state:life.state||null,lifestyleAction:p.action,missionStatus:p.missionStatus,carryingCargo:p.carrying,waitingReceipt:p.waitingReceipt,retired:p.retired};
}
