/*
KGEN_META
VERSION: 1.1.0
STATUS: R0_PRESENTATION_ONLY
WORK_ID: K11520-FIRST-VIEW-ZERO-CARDS-NATURE-20261012-001
PURPOSE: Add a bounded, deterministic, low-draw-call natural land layer to
the existing 11520 Three/WebGL scene. No economy, wallet, identity, Life,
settlement, deployment, or navigation authority is changed.
*/
import * as THREE from 'three';

export const NATURAL_LAND_VERSION='K11520-NATURAL-LAND-V1.1';
const ROOT_NAME='K11520_NATURAL_LAND_V1_1';

function terrainHeight(x,z){
  const radius=Math.hypot(x,z);
  const outsideSpawn=Math.max(0,Math.min(1,(radius-7)/15));
  const openPath=Math.abs(x)<2.8&&z>-18&&z<18?0:.16;
  const rolling=Math.sin(x*.16)*.22+Math.cos(z*.13)*.18+Math.sin((x+z)*.09)*.12;
  return Math.max(0,outsideSpawn*(rolling+openPath));
}

function seeded(seed=0x11520){
  let value=seed>>>0;
  return()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296};
}

function scatter(random,count,{minRadius=8,maxRadius=52,avoidPath=true}={}){
  const points=[];
  for(let guard=0;points.length<count&&guard<count*40;guard++){
    const x=(random()*2-1)*maxRadius,z=(random()*2-1)*maxRadius,r=Math.hypot(x,z);
    if(r<minRadius||r>maxRadius)continue;
    if(avoidPath&&Math.abs(x)<3.2&&z>-20&&z<20)continue;
    points.push({x,z,y:terrainHeight(x,z)});
  }
  return points;
}

function makeInstances(geometry,material,points,{height=.2,scaleMin=.75,scaleMax=1.35,random}){
  const mesh=new THREE.InstancedMesh(geometry,material,points.length);
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),size=new THREE.Vector3();
  const axis=new THREE.Vector3(0,1,0);
  points.forEach((point,index)=>{
    const scale=scaleMin+(scaleMax-scaleMin)*random();
    position.set(point.x,point.y+height*scale,point.z);
    rotation.setFromAxisAngle(axis,random()*Math.PI*2);
    size.set(scale,scale,scale);
    matrix.compose(position,rotation,size);
    mesh.setMatrixAt(index,matrix);
  });
  mesh.instanceMatrix.needsUpdate=true;
  mesh.castShadow=false;mesh.receiveShadow=false;
  return mesh;
}

function createTerrain(){
  const geometry=new THREE.PlaneGeometry(120,120,48,48),position=geometry.attributes.position,colors=[];
  const low=new THREE.Color(0x315c35),high=new THREE.Color(0x688b45),edge=new THREE.Color(0x24452e);
  for(let index=0;index<position.count;index++){
    const x=position.getX(index),z=-position.getY(index),height=terrainHeight(x,z);
    position.setZ(index,height+.018);
    const radius=Math.min(1,Math.hypot(x,z)/60),color=low.clone().lerp(high,Math.min(1,height*1.8+.18)).lerp(edge,radius*.34);
    colors.push(color.r,color.g,color.b);
  }
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.96,metalness:0});
  const mesh=new THREE.Mesh(geometry,material);
  mesh.name='K11520 natural rolling ground';mesh.rotation.x=-Math.PI/2;mesh.receiveShadow=false;
  mesh.userData={isGround:true,presentationOnly:true,terrainHeight};
  return mesh;
}

function createSky(){
  const geometry=new THREE.SphereGeometry(260,24,12);
  const material=new THREE.ShaderMaterial({
    side:THREE.BackSide,depthWrite:false,fog:false,
    uniforms:{topColor:{value:new THREE.Color(0x77abc1)},horizonColor:{value:new THREE.Color(0xd7dfb0)},bottomColor:{value:new THREE.Color(0x6e8e64)}},
    vertexShader:'varying vec3 vDirection; void main(){vDirection=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'varying vec3 vDirection; uniform vec3 topColor; uniform vec3 horizonColor; uniform vec3 bottomColor; void main(){float h=clamp(vDirection.y*.5+.5,0.0,1.0);vec3 low=mix(bottomColor,horizonColor,smoothstep(0.0,.48,h));vec3 color=mix(low,topColor,smoothstep(.42,1.0,h));gl_FragColor=vec4(color,1.0);}'
  });
  const sky=new THREE.Mesh(geometry,material);sky.name='K11520 natural sky';sky.renderOrder=-10;return sky;
}

export function install11520NaturalLand(scene){
  if(!scene||scene.getObjectByName(ROOT_NAME))return globalThis.__K11520_NATURAL_LAND__||null;
  const random=seeded(),root=new THREE.Group();root.name=ROOT_NAME;root.userData={presentationOnly:true,workId:'K11520-FIRST-VIEW-ZERO-CARDS-NATURE-20261012-001'};
  scene.background=new THREE.Color(0x91baa8);scene.fog=new THREE.Fog(0x91baa8,22,92);
  root.add(createSky(),createTerrain());

  const grassPoints=scatter(random,220,{minRadius:7,maxRadius:53});
  const grass=makeInstances(new THREE.ConeGeometry(.045,.34,3),new THREE.MeshStandardMaterial({color:0x6f9d48,roughness:1}),grassPoints,{height:.17,scaleMin:.65,scaleMax:1.45,random});
  grass.name='K11520 instanced grasses';

  const flowerPoints=scatter(random,64,{minRadius:8,maxRadius:48});
  const flowers=makeInstances(new THREE.OctahedronGeometry(.075,0),new THREE.MeshStandardMaterial({color:0xf0c96a,roughness:.8}),flowerPoints,{height:.28,scaleMin:.72,scaleMax:1.35,random});
  flowers.name='K11520 instanced wildflowers';
  const flowerColors=[0xf0c96a,0xe991ab,0xa8c8ff,0xf4efe1].map(value=>new THREE.Color(value));
  flowerPoints.forEach((_,index)=>flowers.setColorAt(index,flowerColors[index%flowerColors.length]));
  flowers.instanceColor.needsUpdate=true;

  const shrubPoints=scatter(random,42,{minRadius:10,maxRadius:51});
  const shrubs=makeInstances(new THREE.DodecahedronGeometry(.32,0),new THREE.MeshStandardMaterial({color:0x386f3f,roughness:1}),shrubPoints,{height:.24,scaleMin:.75,scaleMax:1.7,random});
  shrubs.name='K11520 instanced shrubs';

  const rockPoints=scatter(random,22,{minRadius:11,maxRadius:50});
  const rocks=makeInstances(new THREE.DodecahedronGeometry(.22,0),new THREE.MeshStandardMaterial({color:0x6f786a,roughness:1}),rockPoints,{height:.12,scaleMin:.7,scaleMax:1.9,random});
  rocks.name='K11520 instanced rocks';

  root.add(grass,flowers,shrubs,rocks);scene.add(root);
  const snapshot=Object.freeze({version:NATURAL_LAND_VERSION,status:'INSTALLED',presentationOnly:true,drawGroups:6,instances:{grass:grass.count,wildflowers:flowers.count,shrubs:shrubs.count,rocks:rocks.count},terrain:'DETERMINISTIC_ROLLING_LOW_POLY',terrainFollowing:true,rendererLifecycle:'EXISTING_THREE_SCENE'});
  globalThis.__K11520_NATURAL_LAND__=snapshot;
  globalThis.document?.documentElement?.setAttribute('data-k11520-natural-land','ready');
  return snapshot;
}

function interceptExistingRenderer(){
  const proto=THREE.WebGLRenderer.prototype;
  if(proto.__k11520NaturalLandIntercepted)return;
  const render=proto.render;
  Object.defineProperty(proto,'__k11520NaturalLandIntercepted',{value:true,configurable:true});
  proto.render=function(scene,camera){
    if(this.domElement?.id==='three')install11520NaturalLand(scene);
    return render.call(this,scene,camera);
  };
}

if(typeof document!=='undefined')interceptExistingRenderer();
