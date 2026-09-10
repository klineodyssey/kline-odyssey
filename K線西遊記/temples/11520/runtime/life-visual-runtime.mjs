/* KGEN_META
VERSION: 1.2.3
STATUS: ACTIVE
PURPOSE: Procedural 3D life bodies plus visible living-world work/logistics/lifestyle state for 11520 Market Life, Digital Ant, wild creatures and monsters.
*/

export const LIFE_VISUAL_POLICY=Object.freeze({
  primitiveFallbackOnlyOnLoadFailure:true,
  fallbackLabel:'FALLBACK',
  requireSpeciesSilhouette:true,
});

const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const SPECIES_PALETTE=Object.freeze({
  ANT:0xd89a28,BULL_DEMON:0x8b3f2f,APE:0x6f7882,WISP:0xff7a24,
  FISH:0x3f86d8,SHRIMP:0xe45b4f,COW:0xb88452,SHEEP:0xe8dfc9,
  CHICKEN:0xd9a62e,DUCK:0x4f9f85,TREE:0x3f8b4a,FLOWER:0xd95fa5,
});
function colorForSpecies(species='LIFE'){
  const archetype=creatureArchetypeForSpecies(species),canonical=SPECIES_PALETTE[archetype];
  if(canonical!=null)return canonical;
  let h=2166136261;
  for(const c of String(species))h=(h^c.charCodeAt(0))*16777619>>>0;
  return h&0xffffff;
}
function mat(THREE,color,{roughness=.72,metalness=.08,emissive=0}={}){return new THREE.MeshStandardMaterial({color,roughness,metalness,emissive})}
function add(root,name,mesh){mesh.name=name;root.add(mesh);return mesh}
function limb(THREE,root,name,{x=0,y=.5,z=0,len=.5,r=.04,rx=0,ry=0,rz=0,color=0x25313d}={}){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,6),mat(THREE,color,{roughness:.82}));
  m.position.set(x,y,z);m.rotation.set(rx,ry,rz);return add(root,name,m);
}

export function creatureArchetypeForSpecies(species='LIFE'){
  const s=String(species).toUpperCase();
  if(s.includes('DIGITAL_ANT')||s==='ANT')return'ANT';
  if(s.includes('BULL')||s.includes('DEMON'))return'BULL_DEMON';
  if(s.includes('STONE_APE')||s.includes('APE')||s.includes('MONKEY'))return'APE';
  if(s.includes('FIRE_WISP')||s.includes('WISP')||s.includes('FIRE'))return'WISP';
  if(s==='FISH')return'FISH';if(s==='SHRIMP')return'SHRIMP';if(s==='COW')return'COW';if(s==='SHEEP')return'SHEEP';
  if(s==='CHICKEN')return'CHICKEN';if(s==='DUCK')return'DUCK';if(s==='TREE')return'TREE';if(s==='FLOWER')return'FLOWER';
  return'HUMANOID';
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
  return {action,missionStatus,isAnt,carrying,waitingReceipt,retired,traveling,working,resting,retreating,
    scale:retired?0.94:resting?0.97:traveling||working?1.03:1,pitch:retreating?-0.12:traveling||working?0.08:0,status:'WAITING_RECEIPT'};
}

function buildHumanoid(THREE,root,main,dark){
  const body=add(root,'CREATURE_BODY',new THREE.Mesh(new THREE.CapsuleGeometry(.34,.72,5,10),main));body.position.y=.82;
  const head=add(root,'CREATURE_HEAD',new THREE.Mesh(new THREE.SphereGeometry(.31,14,10),main));head.position.y=1.48;
  for(const x of[-.11,.11]){const e=add(root,`CREATURE_EYE_${x<0?'L':'R'}`,new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),dark));e.position.set(x,1.52,.285)}
}
function buildAnt(THREE,root,main,dark){
  const segments=[[.38,.24],[0,.3],[-.42,.34]];
  for(const [i,[z,r]] of segments.entries()){
    const b=add(root,`ANT_SEGMENT_${i}`,new THREE.Mesh(new THREE.SphereGeometry(r,12,8),main));b.position.set(0,.65,z)
  }
  const head=add(root,'ANT_HEAD',new THREE.Mesh(new THREE.SphereGeometry(.22,12,8),main));head.position.set(0,.72,.62);
  for(const side of[-1,1])for(const [i,y] of[.5,.68,.86].entries())limb(THREE,root,`ANT_LEG_${side}_${i}`,{x:side*.32,y,z:.05-(i*.18),len:.62,r:.025,rz:side*(1.0+i*.08),color:0x18202a});
  for(const side of[-1,1])limb(THREE,root,`ANT_ANTENNA_${side}`,{x:side*.1,y:.93,z:.75,len:.38,r:.018,rx:.9,rz:side*.28,color:0x18202a});
  root.scale.setScalar(.9);
}
function buildBull(THREE,root,main,dark){
  const torso=add(root,'BULL_TORSO',new THREE.Mesh(new THREE.CapsuleGeometry(.48,.88,6,12),main));torso.position.y=.92;
  const head=add(root,'BULL_HEAD',new THREE.Mesh(new THREE.BoxGeometry(.62,.48,.55),main));head.position.set(0,1.62,.05);
  for(const side of[-1,1]){const horn=add(root,`BULL_HORN_${side}`,new THREE.Mesh(new THREE.ConeGeometry(.1,.62,9),dark));horn.position.set(side*.34,1.9,.02);horn.rotation.z=side<0?.62:-.62}
  for(const side of[-1,1])for(const [i,z] of[.24,-.24].entries())limb(THREE,root,`BULL_LEG_${side}_${i}`,{x:side*.28,y:.38,z,len:.68,r:.07,color:0x20252b});
  root.scale.setScalar(1.18);
}
function buildApe(THREE,root,main,dark){
  const torso=add(root,'APE_TORSO',new THREE.Mesh(new THREE.SphereGeometry(.52,14,10),main));torso.scale.set(1,.95,.78);torso.position.y=1.02;
  const head=add(root,'APE_HEAD',new THREE.Mesh(new THREE.SphereGeometry(.32,12,9),main));head.position.y=1.62;
  for(const side of[-1,1])limb(THREE,root,`APE_ARM_${side}`,{x:side*.58,y:.92,len:1.05,r:.09,rz:side*.38,color:0x2b3037});
  for(const side of[-1,1])limb(THREE,root,`APE_LEG_${side}`,{x:side*.24,y:.38,len:.72,r:.1,color:0x2b3037});
  const muzzle=add(root,'APE_MUZZLE',new THREE.Mesh(new THREE.SphereGeometry(.18,10,7),dark));muzzle.scale.set(1.2,.75,.7);muzzle.position.set(0,1.52,.28);
}
function buildWisp(THREE,root,main,dark){
  const core=add(root,'WISP_CORE',new THREE.Mesh(new THREE.SphereGeometry(.34,14,10),main));core.position.y=.92;
  for(let i=0;i<3;i++){const flame=add(root,`WISP_FLAME_${i}`,new THREE.Mesh(new THREE.ConeGeometry(.25-i*.04,.72-i*.1,8),main));flame.position.set((i-1)*.16,1.5+i*.1,0);flame.rotation.z=(i-1)*.25}
  const ring=add(root,'WISP_RING',new THREE.Mesh(new THREE.TorusGeometry(.48,.045,8,24),dark));ring.rotation.x=Math.PI/2;ring.position.y=.76;
}
function buildFish(THREE,root,main,dark){
  const body=add(root,'FISH_BODY',new THREE.Mesh(new THREE.SphereGeometry(.46,14,9),main));body.scale.set(1.35,.62,.72);body.position.y=.65;
  const tail=add(root,'FISH_TAIL',new THREE.Mesh(new THREE.ConeGeometry(.28,.62,3),main));tail.rotation.z=Math.PI/2;tail.position.set(-.72,.65,0);
  for(const side of[-1,1]){const e=add(root,`FISH_EYE_${side}`,new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),dark));e.position.set(.42,.76,side*.22)}
}
function buildShrimp(THREE,root,main,dark){
  for(let i=0;i<5;i++){const seg=add(root,`SHRIMP_SEG_${i}`,new THREE.Mesh(new THREE.SphereGeometry(.18-i*.012,10,7),main));seg.position.set(-.18*i,.52+.05*i,0)}
  for(const side of[-1,1])for(let i=0;i<4;i++)limb(THREE,root,`SHRIMP_LEG_${side}_${i}`,{x:-.08*i,y:.38,z:side*.13,len:.28,r:.018,rx:side*.8,color:0x432020});
  for(const side of[-1,1])limb(THREE,root,`SHRIMP_ANTENNA_${side}`,{x:.12,y:.72,z:side*.08,len:.58,r:.012,rx:side*.2,rz:-1.15,color:0x432020});
}
function buildQuadruped(THREE,root,main,dark,{kind='COW'}={}){
  const body=add(root,`${kind}_BODY`,new THREE.Mesh(new THREE.BoxGeometry(.92,.52,.46),main));body.position.y=.78;
  const head=add(root,`${kind}_HEAD`,new THREE.Mesh(new THREE.BoxGeometry(.4,.38,.4),main));head.position.set(.63,.86,0);
  for(const x of[-.32,.32])for(const z of[-.16,.16])limb(THREE,root,`${kind}_LEG_${x}_${z}`,{x,y:.35,z,len:.62,r:.05,color:0x2d3338});
  if(kind==='COW'||kind==='SHEEP')for(const side of[-1,1]){const horn=add(root,`${kind}_HORN_${side}`,new THREE.Mesh(new THREE.ConeGeometry(.05,.28,7),dark));horn.position.set(.69,1.12,side*.15);horn.rotation.x=side*.4}
  if(kind==='SHEEP'){for(let i=0;i<5;i++){const wool=add(root,`SHEEP_WOOL_${i}`,new THREE.Mesh(new THREE.SphereGeometry(.26,9,7),main));wool.position.set(-.3+i*.15,1.02,(i%2?1:-1)*.12)}}
}
function buildBird(THREE,root,main,dark,{kind='CHICKEN'}={}){
  const body=add(root,`${kind}_BODY`,new THREE.Mesh(new THREE.SphereGeometry(.34,12,9),main));body.scale.set(1,.9,.82);body.position.y=.65;
  const head=add(root,`${kind}_HEAD`,new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),main));head.position.set(.22,1.03,0);
  const beak=add(root,`${kind}_BEAK`,new THREE.Mesh(new THREE.ConeGeometry(.08,.26,5),dark));beak.rotation.z=-Math.PI/2;beak.position.set(.46,1.02,0);
  for(const side of[-1,1])limb(THREE,root,`${kind}_LEG_${side}`,{x:side*.12,y:.25,len:.36,r:.025,color:0x49341a});
  if(kind==='CHICKEN'){const comb=add(root,'CHICKEN_COMB',new THREE.Mesh(new THREE.ConeGeometry(.08,.24,5),dark));comb.position.set(.19,1.3,0)}
}
function buildTree(THREE,root,main,dark){
  const trunk=add(root,'TREE_TRUNK',new THREE.Mesh(new THREE.CylinderGeometry(.16,.24,1.28,8),dark));trunk.position.y=.64;
  const crowns=[[0,1.55,0,.62],[-.34,1.35,.06,.42],[.36,1.38,-.08,.44]];
  for(const [i,[x,y,z,s]] of crowns.entries()){
    const crown=add(root,`TREE_CROWN_${i}`,new THREE.Mesh(new THREE.SphereGeometry(s,12,9),main));crown.position.set(x,y,z)
  }
}
function buildFlower(THREE,root,main,dark){
  limb(THREE,root,'FLOWER_STEM',{y:.42,len:.8,r:.035,color:0x2f7f48});
  const center=add(root,'FLOWER_CENTER',new THREE.Mesh(new THREE.SphereGeometry(.12,9,7),dark));center.position.y=.86;
  for(let i=0;i<6;i++){const p=add(root,`FLOWER_PETAL_${i}`,new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),main));const a=i*Math.PI/3;p.position.set(Math.cos(a)*.18,.86,Math.sin(a)*.18);p.scale.set(1.35,.7,.9)}
}

export function createProceduralLifeBody(THREE,{species='LIFE',name='Market Life',scale=1}={}){
  if(!THREE)throw new Error('THREE_REQUIRED');
  const root=new THREE.Group();const archetype=creatureArchetypeForSpecies(species);
  root.name=`LIFE:${name}`;root.userData={lifeVisual:true,species,name,archetype,visualMode:'PROCEDURAL_3D',baseScale:Number(scale)||1};
  const color=colorForSpecies(species),main=mat(THREE,color),dark=mat(THREE,0x15202b,{roughness:.8});
  const builders={ANT:buildAnt,BULL_DEMON:buildBull,APE:buildApe,WISP:buildWisp,FISH:buildFish,SHRIMP:buildShrimp,
    COW:(T,r,m,d)=>buildQuadruped(T,r,m,d,{kind:'COW'}),SHEEP:(T,r,m,d)=>buildQuadruped(T,r,m,d,{kind:'SHEEP'}),
    CHICKEN:(T,r,m,d)=>buildBird(T,r,m,d,{kind:'CHICKEN'}),DUCK:(T,r,m,d)=>buildBird(T,r,m,d,{kind:'DUCK'}),TREE:buildTree,FLOWER:buildFlower,HUMANOID:buildHumanoid};
  (builders[archetype]||buildHumanoid)(THREE,root,main,dark);
  const archetypeScale=finite(root.scale?.x,1)||1;root.userData.archetypeScale=archetypeScale;
  const cargo=new THREE.Group();cargo.name='LIFE_STATUS_CARGO';cargo.visible=false;
  const cargoBody=new THREE.Mesh(new THREE.BoxGeometry(.62,.42,.46),mat(THREE,0xc79a36,{roughness:.48,metalness:.48}));cargoBody.position.set(0,.82,-.48);cargo.add(cargoBody);root.add(cargo);
  const statusRing=add(root,'LIFE_STATUS_RECEIPT',new THREE.Mesh(new THREE.TorusGeometry(.48,.045,8,28),mat(THREE,0x62d7ff,{roughness:.35,metalness:.25,emissive:0x123744})));statusRing.rotation.x=Math.PI/2;statusRing.position.y=.08;statusRing.visible=false;
  const retirementHalo=add(root,'LIFE_STATUS_RETIREMENT',new THREE.Mesh(new THREE.TorusGeometry(.39,.035,8,30),mat(THREE,0xffd66b,{roughness:.3,metalness:.4,emissive:0x4b3610})));retirementHalo.position.y=1.94;retirementHalo.visible=false;
  root.scale.setScalar(archetypeScale*(Number(scale)||1));return root;
}

export function createFallbackLifeBody(THREE,{name='Life',scale=1}={}){
  if(!THREE)throw new Error('THREE_REQUIRED');
  const mesh=new THREE.Mesh(new THREE.DodecahedronGeometry(.55),new THREE.MeshStandardMaterial({color:0x7b2025}));
  mesh.name=`FALLBACK:${name}`;mesh.userData={lifeVisual:true,visualMode:'FALLBACK',fallback:true,label:LIFE_VISUAL_POLICY.fallbackLabel,baseScale:Number(scale)||1};mesh.scale.setScalar(Number(scale)||1);return mesh;
}

export async function createLifeVisual(THREE,{gltfLoader=null,modelUrl=null,...spec}={}){
  if(modelUrl&&gltfLoader){try{const gltf=await new Promise((resolve,reject)=>gltfLoader.load(modelUrl,resolve,undefined,reject));const root=gltf.scene;root.userData={...(root.userData||{}),lifeVisual:true,visualMode:'GLTF_3D',fallback:false,species:spec.species,name:spec.name,archetype:creatureArchetypeForSpecies(spec.species),baseScale:Number(spec.scale)||1};return{root,mode:'GLTF_3D',fallback:false}}catch{}}
  try{return{root:createProceduralLifeBody(THREE,spec),mode:'PROCEDURAL_3D',fallback:false}}catch(error){return{root:createFallbackLifeBody(THREE,spec),mode:'FALLBACK',fallback:true,error}}
}

export function syncLifeVisual(root,life={}){
  if(!root)return;const p=lifePresentationState(life),base=finite(root.userData?.baseScale,1)||1,archetypeScale=finite(root.userData?.archetypeScale,1)||1;
  root.visible=life.state!=='DEAD';root.position.set(finite(life.x),Math.max(.05,finite(life.y)),finite(life.z));root.scale.setScalar(base*archetypeScale*p.scale);root.rotation.x=p.pitch;
  const cargo=root.getObjectByName?.('LIFE_STATUS_CARGO');if(cargo)cargo.visible=p.carrying;
  const receipt=root.getObjectByName?.('LIFE_STATUS_RECEIPT');if(receipt)receipt.visible=p.waitingReceipt;
  const retirement=root.getObjectByName?.('LIFE_STATUS_RETIREMENT');if(retirement)retirement.visible=p.retired;
  root.userData={...(root.userData||{}),lifeId:life.lifeId||null,sourceLifeId:life.sourceLifeId||null,sourceManaged:Boolean(life.sourceManaged),state:life.state||null,lifestyleAction:p.action,missionStatus:p.missionStatus,carryingCargo:p.carrying,waitingReceipt:p.waitingReceipt,retired:p.retired};
}