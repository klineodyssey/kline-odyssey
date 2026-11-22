/* KGEN_META
VERSION: 1.0.1
STATUS: ACTIVE
PURPOSE: Canonical procedural 3D item identity for 11520 world/backpack objects. Items must be visually distinguishable by geometry, not emoji/text alone.
*/

const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;

export function itemVisualDescriptor(item={}){
  const kind=String(item.kind||'MATERIAL').toUpperCase();
  const species=String(item.species||item.meta?.species||'').toUpperCase();
  const name=String(item.name||kind);
  const cargo=String(item.meta?.cargoKind||item.meta?.unit||'').toUpperCase();
  if(kind==='LIVING_CARGO')return{shape:'LIFE_CRATE',kind,species,name,label:species||'LIFE',accent:species||'LIFE'};
  if(kind==='TREASURE')return{shape:'CRYSTAL',kind,species:null,name,label:item.treasureClass||'TREASURE',accent:String(item.treasureClass||'COMMON').toUpperCase()};
  if(kind==='FOOD')return{shape:'FOOD',kind,species:null,name,label:'FOOD',accent:'FOOD'};
  if(cargo.includes('KGEN'))return{shape:'KGEN_CYLINDER',kind,species:null,name,label:'KGEN',accent:'KGEN'};
  if(cargo.includes('KAIOS')||/CASH|鈔|錢/i.test(name))return{shape:'CASH_BUNDLE',kind,species:null,name,label:'KAIOS',accent:'KAIOS'};
  return{shape:'INGOT',kind,species:null,name,label:'MATERIAL',accent:'MATERIAL'};
}

function material(THREE,color,metalness=.25,roughness=.55){return new THREE.MeshStandardMaterial({color,metalness,roughness})}

export function createProceduralItemBody(THREE,item={},scale=1){
  if(!THREE)throw new Error('THREE_REQUIRED');
  const d=itemVisualDescriptor(item),root=new THREE.Group();
  root.name=`ITEM:${d.name}`;root.userData={itemVisual:true,itemId:item.itemId||null,descriptor:d};
  const gold=material(THREE,0xd8a642,.62,.28),dark=material(THREE,0x15202b,.12,.75),blue=material(THREE,0x55c9ff,.18,.42),green=material(THREE,0x5bd38b,.15,.5),red=material(THREE,0xcc5252,.18,.48);
  if(d.shape==='CRYSTAL'){
    const m=new THREE.Mesh(new THREE.OctahedronGeometry(.58,0),gold);m.scale.y=1.28;root.add(m);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.48,.035,8,28),blue);ring.rotation.x=Math.PI/2;ring.position.y=-.48;root.add(ring);
  }else if(d.shape==='FOOD'){
    const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.56,.42,.32,18,1,true),dark);bowl.position.y=-.18;root.add(bowl);
    const food=new THREE.Mesh(new THREE.SphereGeometry(.42,18,12),green);food.scale.y=.65;food.position.y=.12;root.add(food);
  }else if(d.shape==='KGEN_CYLINDER'){
    const coin=new THREE.Mesh(new THREE.CylinderGeometry(.58,.58,.16,28),gold);coin.rotation.x=Math.PI/2;root.add(coin);
    const core=new THREE.Mesh(new THREE.TorusGeometry(.31,.055,8,24),dark);core.position.z=.09;root.add(core);
  }else if(d.shape==='CASH_BUNDLE'){
    const bundle=new THREE.Mesh(new THREE.BoxGeometry(1.05,.36,.62),green);root.add(bundle);
    for(const x of[-.3,.3]){const band=new THREE.Mesh(new THREE.BoxGeometry(.09,.39,.65),gold);band.position.x=x;root.add(band)}
  }else if(d.shape==='LIFE_CRATE'){
    const crate=new THREE.Mesh(new THREE.BoxGeometry(1.02,.72,.82),gold);root.add(crate);
    const window=new THREE.Mesh(new THREE.BoxGeometry(.62,.36,.02),blue);window.position.z=.42;root.add(window);
    const marker=new THREE.Mesh(/FISH|SHRIMP/.test(d.species)?new THREE.SphereGeometry(.18,12,8):/COW/.test(d.species)?new THREE.ConeGeometry(.18,.4,8):new THREE.SphereGeometry(.19,12,8),/CHICKEN|DUCK/.test(d.species)?red:green);marker.position.set(0,.02,.45);root.add(marker);
  }else{
    const ingot=new THREE.Mesh(new THREE.BoxGeometry(.92,.42,.56),gold);ingot.rotation.z=.08;root.add(ingot);
    const cap=new THREE.Mesh(new THREE.BoxGeometry(.48,.46,.6),dark);cap.position.x=.18;root.add(cap);
  }
  root.scale.setScalar(Math.max(.05,finite(scale,1)||1));
  return root;
}

export function frameItemCamera(THREE,camera){camera.position.set(1.7,1.25,2.15);camera.lookAt(0,0,0);camera.near=.01;camera.far=20;camera.updateProjectionMatrix?.()}

export function createItemPreviewScene(THREE,item={}){
  if(!THREE)throw new Error('THREE_REQUIRED');
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(34,1,.01,20);frameItemCamera(THREE,camera);
  scene.add(new THREE.HemisphereLight(0xffffff,0x26313c,2.2));
  const key=new THREE.DirectionalLight(0xffffff,2.6);key.position.set(2.5,3,2);scene.add(key);
  const root=createProceduralItemBody(THREE,item,1);scene.add(root);
  return{scene,camera,root,descriptor:itemVisualDescriptor(item)};
}

// This existing preview owner keeps one private WebGL context. Visible item
// canvases are bitmap projections, never additional WebGL renderer owners.
let previewRenderer=null;
const previewRequests=new WeakMap();
function retirePreviewRenderer(renderer){
  if(previewRenderer===renderer)previewRenderer=null;
  // Only this owner's private context is retired. A failed Three render can
  // retain internal stacks; it must never become the next preview's renderer.
  try{renderer.dispose()}finally{renderer.forceContextLoss()}
}
function releasePreviewScene(scene){
  const resources=new Set();
  scene.traverse(node=>{if(node.geometry)resources.add(node.geometry);for(const material of [node.material].flat())if(material)resources.add(material)});
  for(const resource of resources)resource.dispose?.();
  scene.clear();
}

export async function renderItemPreview(canvas,item,{size=96,shouldRender=()=>true}={}){
  if(!canvas)return{ok:false,reason:'CANVAS_REQUIRED'};
  const request={};previewRequests.set(canvas,request);
  const current=()=>previewRequests.get(canvas)===request&&shouldRender();
  if(!current())return{ok:false,reason:'PREVIEW_STALE'};
  const THREE=await import('three');
  if(!current())return{ok:false,reason:'PREVIEW_STALE'};
  const context=canvas.getContext('2d');if(!context)throw new Error('PREVIEW_BITMAP_CONTEXT_REQUIRED');
  if(!previewRenderer){
    const surface=canvas.ownerDocument.createElement('canvas');
    const options={alpha:true,antialias:true,preserveDrawingBuffer:true};
    const gl=surface.getContext('webgl2',options);if(!gl)throw new Error('PREVIEW_CONTEXT_UNAVAILABLE');
    try{previewRenderer=new THREE.WebGLRenderer({canvas:surface,context:gl,...options})}
    catch(error){gl.getExtension('WEBGL_lose_context')?.loseContext();throw error}
  }
  const renderer=previewRenderer;
  if(renderer.getContext().isContextLost()){retirePreviewRenderer(renderer);throw new Error('PREVIEW_CONTEXT_LOST')}
  const px=Math.max(48,Math.min(160,Number(size)||96));
  try{renderer.setPixelRatio(Math.min(2,globalThis.devicePixelRatio||1));renderer.setSize(px,px,false);renderer.setClearColor(0x000000,0)}
  catch(error){retirePreviewRenderer(renderer);throw error}
  const {scene,camera,root,descriptor}=createItemPreviewScene(THREE,item);
  let renderFailed=false;
  try{
    root.rotation.y=.62;root.rotation.x=-.08;
    try{renderer.render(scene,camera)}catch(error){renderFailed=true;throw error}
    canvas.width=renderer.domElement.width;canvas.height=renderer.domElement.height;
    context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(renderer.domElement,0,0);
    canvas.dataset.item3d='ready';canvas.dataset.itemShape=descriptor.shape;canvas.setAttribute('aria-label',`${descriptor.name} 3D ${descriptor.label}`);
    // The only production caller consumes the canvas/descriptor. Do not leak
    // the shared renderer or already-released scene as caller-owned handles.
    return{ok:true,descriptor,renderer:null,root:null};
  }finally{
    try{releasePreviewScene(scene)}finally{if(renderFailed)retirePreviewRenderer(renderer);else renderer.renderLists.dispose()}
  }
}
