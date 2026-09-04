import * as THREE from 'three';

export const LIFE_VISUAL_VERSION='11520-LIFE-VISUAL-V1.1';

const mat=(color,roughness=.72,metalness=.06)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const mesh=(geometry,material,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;return m};

function animalBody({body=0x8a745a,accent=0xe5d4aa,scale=1}={}){
  const g=new THREE.Group();
  const torso=mesh(new THREE.SphereGeometry(.48*scale,16,12),mat(body),0,.48*scale,0);torso.scale.set(1.35,.82,.78);
  const head=mesh(new THREE.SphereGeometry(.26*scale,14,10),mat(accent),0,.58*scale,-.48*scale);
  g.add(torso,head);return g;
}
function addLegs(g,color=0x574334,scale=1){for(const x of [-.28,.28])for(const z of [-.22,.22])g.add(mesh(new THREE.CylinderGeometry(.055*scale,.07*scale,.42*scale,8),mat(color),x*scale,.20*scale,z*scale));}
function addEyes(g,scale=1){for(const x of [-.09,.09])g.add(mesh(new THREE.SphereGeometry(.025*scale,8,6),mat(0x101820),x*scale,.64*scale,-.70*scale));}

function cow(){const g=animalBody({body:0xf0eee6,accent:0xd7b18b,scale:1.05});addLegs(g,0x4b3a30,1.05);addEyes(g,1.05);for(const x of [-.17,.17]){const horn=mesh(new THREE.ConeGeometry(.045,.20,8),mat(0xd8c48d),x,.83,-.56);horn.rotation.x=-.45;g.add(horn)}return g;}
function sheep(){const g=animalBody({body:0xf4f0dc,accent:0xc6b28a,scale:.9});addLegs(g,0x5d5142,.88);addEyes(g,.9);return g;}
function chicken(){const g=animalBody({body:0xf3efe4,accent:0xe1c59a,scale:.65});addLegs(g,0xd9a52a,.55);addEyes(g,.65);const comb=mesh(new THREE.SphereGeometry(.07,8,6),mat(0xd54242),0,.63,-.28);const beak=mesh(new THREE.ConeGeometry(.055,.18,8),mat(0xe7aa28),0,.43,-.43);beak.rotation.x=-Math.PI/2;g.add(comb,beak);return g;}
function duck(){const g=animalBody({body:0xdad0a3,accent:0x547750,scale:.72});addLegs(g,0xe2a930,.58);addEyes(g,.72);const bill=mesh(new THREE.BoxGeometry(.22,.07,.18),mat(0xe2a930),0,.43,-.50);g.add(bill);return g;}
function fish(){const g=new THREE.Group();const body=mesh(new THREE.SphereGeometry(.38,16,12),mat(0x5cb8d7),0,.40,0);body.scale.set(1.5,.72,.55);const tail=mesh(new THREE.ConeGeometry(.27,.50,3),mat(0x3b8cab),0,.40,.62);tail.rotation.x=Math.PI/2;g.add(body,tail);addEyes(g,.7);g.rotation.y=Math.PI/2;return g;}
function shrimp(){const g=new THREE.Group();for(let i=0;i<5;i++){const s=mesh(new THREE.SphereGeometry(.13-i*.012,10,8),mat(0xe88c72),0,.24+i*.035,i*.18);g.add(s)}const tail=mesh(new THREE.ConeGeometry(.16,.28,3),mat(0xd96f5d),0,.37,.94);tail.rotation.x=Math.PI/2;g.add(tail);return g;}
function ant(){const g=new THREE.Group();for(const [z,r] of [[-.28,.18],[0,.21],[.30,.24]])g.add(mesh(new THREE.SphereGeometry(r,12,9),mat(0x252a2e,.55,.28),0,.28,z));for(const z of [-.20,.04,.28])for(const side of [-1,1]){const leg=mesh(new THREE.CylinderGeometry(.022,.022,.55,6),mat(0x1b1f22),side*.22,.18,z);leg.rotation.z=Math.PI/2.7*side;g.add(leg)}for(const side of [-1,1]){const a=mesh(new THREE.CylinderGeometry(.014,.014,.32,5),mat(0x1b1f22),side*.08,.46,-.40);a.rotation.z=.45*side;a.rotation.x=-.45;g.add(a)}return g;}
function tree(){const g=new THREE.Group();const trunk=mesh(new THREE.CylinderGeometry(.16,.22,1.4,8),mat(0x6e492b),0,.7,0);const crown=mesh(new THREE.SphereGeometry(.72,14,10),mat(0x2f7d3f),0,1.65,0);crown.scale.set(.9,1.1,.9);g.add(trunk,crown);return g;}
function flower(){const g=new THREE.Group();const stem=mesh(new THREE.CylinderGeometry(.025,.035,.55,6),mat(0x3f8d48),0,.28,0);g.add(stem);for(let i=0;i<6;i++){const a=i*Math.PI/3,p=mesh(new THREE.SphereGeometry(.11,8,6),mat(0xe780c4),Math.cos(a)*.12,.62,Math.sin(a)*.12);p.scale.set(1,.55,1);g.add(p)}g.add(mesh(new THREE.SphereGeometry(.09,8,6),mat(0xf0c74b),0,.62,0));return g;}
function demon(){const g=animalBody({body:0x5b3035,accent:0x8c4844,scale:1.18});addLegs(g,0x3a2528,1.18);addEyes(g,1.18);for(const x of [-.22,.22]){const horn=mesh(new THREE.ConeGeometry(.07,.38,9),mat(0xc7aa73),x,.98,-.52);horn.rotation.x=-.35;horn.rotation.z=x>0?.25:-.25;g.add(horn)}return g;}
function drone(){const g=new THREE.Group();const hull=mesh(new THREE.CylinderGeometry(.48,.62,.25,18),mat(0x334858,.38,.55),0,.34,0);const dome=mesh(new THREE.SphereGeometry(.30,16,10,0,Math.PI*2,0,Math.PI/2),mat(0x72d8ef,.22,.15),0,.47,0);const ring=mesh(new THREE.TorusGeometry(.52,.045,8,24),mat(0xe1bd66,.42,.35),0,.35,0);ring.rotation.x=Math.PI/2;g.add(hull,dome,ring);return g;}

export function createLifeVisual(species='MARKET_LIFE'){
  const s=String(species||'MARKET_LIFE').toUpperCase();
  let g;
  if(s.includes('COW'))g=cow();
  else if(s.includes('SHEEP'))g=sheep();
  else if(s.includes('FISH'))g=fish();
  else if(s.includes('SHRIMP'))g=shrimp();
  else if(s.includes('CHICKEN'))g=chicken();
  else if(s.includes('DUCK'))g=duck();
  else if(s.includes('TREE'))g=tree();
  else if(s.includes('FLOWER'))g=flower();
  else if(s.includes('ANT')||s.includes('DIGITAL'))g=ant();
  else if(s.includes('BULL')||s.includes('DEMON')||s.includes('APE')||s.includes('WISP'))g=demon();
  else g=drone();
  g.userData.lifeVisual=true;g.userData.species=s;g.name=`LIFE_VISUAL_${s}`;return g;
}

function hideLegacy(parent){if(parent?.isMesh){parent.material=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});parent.castShadow=false;parent.receiveShadow=false;}}
export function replaceLifeVisual(parent,{species='MARKET_LIFE',lifeId=null}={}){
  if(!parent)return parent;
  hideLegacy(parent);
  for(const c of [...parent.children])if(c.userData?.lifeVisual)parent.remove(c);
  const visual=createLifeVisual(species);visual.position.y=-.10;visual.userData.lifeId=lifeId||null;parent.add(visual);
  parent.userData.lifeVisualDecorated=true;parent.userData.species=String(species||'MARKET_LIFE').toUpperCase();parent.userData.lifeId=lifeId||null;
  return parent;
}
export function decorateLegacyMarketLifeMesh(parent,opts={}){if(!parent||parent.userData?.lifeVisualDecorated)return parent;return replaceLifeVisual(parent,opts);}
