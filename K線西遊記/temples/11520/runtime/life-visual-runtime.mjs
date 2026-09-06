/* KGEN_META
VERSION: 1.0.0
STATUS: ACTIVE
PURPOSE: Procedural 3D life bodies and fallback policy for 11520 Market Life / Digital Ant creatures.
*/

export const LIFE_VISUAL_POLICY=Object.freeze({
  primitiveFallbackOnlyOnLoadFailure:true,
  fallbackLabel:'FALLBACK',
});

function colorForSpecies(species='LIFE'){
  let h=2166136261;
  for(const c of String(species))h=(h^c.charCodeAt(0))*16777619>>>0;
  return h&0xffffff;
}

export function createProceduralLifeBody(THREE,{species='LIFE',name='Market Life',scale=1}={}){
  if(!THREE)throw new Error('THREE_REQUIRED');
  const root=new THREE.Group();
  root.name=`LIFE:${name}`;
  root.userData={lifeVisual:true,species,name,visualMode:'PROCEDURAL_3D'};
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
  root.scale.setScalar(Number(scale)||1);
  return root;
}

export function createFallbackLifeBody(THREE,{name='Life',scale=1}={}){
  if(!THREE)throw new Error('THREE_REQUIRED');
  const mesh=new THREE.Mesh(new THREE.DodecahedronGeometry(.55),new THREE.MeshStandardMaterial({color:0x7b2025}));
  mesh.name=`FALLBACK:${name}`;mesh.userData={lifeVisual:true,visualMode:'FALLBACK',fallback:true,label:LIFE_VISUAL_POLICY.fallbackLabel};mesh.scale.setScalar(Number(scale)||1);return mesh;
}

export async function createLifeVisual(THREE,{gltfLoader=null,modelUrl=null,...spec}={}){
  if(modelUrl&&gltfLoader){try{const gltf=await new Promise((resolve,reject)=>gltfLoader.load(modelUrl,resolve,undefined,reject));const root=gltf.scene;root.userData={...(root.userData||{}),lifeVisual:true,visualMode:'GLTF_3D',fallback:false,species:spec.species,name:spec.name};return{root,mode:'GLTF_3D',fallback:false}}catch{/* fall through to procedural */}}
  try{return{root:createProceduralLifeBody(THREE,spec),mode:'PROCEDURAL_3D',fallback:false}}catch(error){return{root:createFallbackLifeBody(THREE,spec),mode:'FALLBACK',fallback:true,error}}
}

export function syncLifeVisual(root,life={}){
  if(!root)return;
  root.visible=life.state!=='DEAD';
  root.position.set(Number(life.x)||0,Math.max(.05,Number(life.y)||0),Number(life.z)||0);
  root.userData={...(root.userData||{}),lifeId:life.lifeId||null,sourceLifeId:life.sourceLifeId||null,sourceManaged:Boolean(life.sourceManaged),state:life.state||null};
}
