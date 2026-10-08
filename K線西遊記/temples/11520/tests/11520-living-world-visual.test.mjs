import test from 'node:test';
import assert from 'node:assert/strict';
import {createProceduralLifeBody,creatureArchetypeForSpecies,lifePresentationState,syncLifeVisual} from '../runtime/life-visual-runtime.mjs';
import {canonicalWorldItem,cargoItemFromLife} from '../runtime/world-item-visual-runtime.mjs';

test('Digital Ant in transit visibly carries cargo and works',()=>{
  const life={lifeId:'ANT-1',species:'DIGITAL_ANT',state:'OBSERVE',cargo:{cargoId:'CASH-1',amount:18,unit:'KAIOS'},mission:{status:'IN_TRANSIT'},marketLife:{lifestyle:{action:'WORK'}}};
  const p=lifePresentationState(life);
  const item=cargoItemFromLife(life),world=canonicalWorldItem(item,'ANT_CARGO');
  assert.equal(p.isAnt,true);assert.equal(p.working,true);assert.equal(p.carrying,true);assert.equal(p.waitingReceipt,false);assert.ok(p.scale>1);
  assert.equal(world.descriptor.shape,'CASH_BUNDLE');assert.equal(world.custody.custodyType,'ARMORED_CASH_CASE');
});

test('Digital Ant waiting for receipt changes custody to ATM cassette without changing cash identity',()=>{
  const transitLife={lifeId:'ANT-1',species:'DIGITAL_ANT',cargo:{cargoId:'CASH-1',amount:18,unit:'KAIOS'},mission:{status:'IN_TRANSIT'},marketLife:{lifestyle:{action:'WORK'}}};
  const waitingLife={...transitLife,mission:{status:'ARRIVED_AWAITING_RECEIPT'}};
  const p=lifePresentationState(waitingLife);
  const item=cargoItemFromLife(transitLife),ant=canonicalWorldItem(item,'ANT_CARGO'),atm=canonicalWorldItem(item,'ATM_UNLOAD');
  assert.equal(p.carrying,true);assert.equal(p.waitingReceipt,true);
  assert.equal(ant.identityKey,atm.identityKey);
  assert.equal(ant.custody.custodyType,'ARMORED_CASH_CASE');assert.equal(atm.custody.custodyType,'ATM_CASSETTE');
});

test('Market Life travel, rest and retirement are distinguishable',()=>{
  const travel=lifePresentationState({species:'BULL_DEMON',marketLife:{lifestyle:{action:'EXPLORE'}}});
  const rest=lifePresentationState({species:'BULL_DEMON',marketLife:{lifestyle:{action:'REST'}}});
  const retire=lifePresentationState({species:'BULL_DEMON',marketLife:{lifestyle:{action:'RETIRE'}}});
  assert.equal(travel.traveling,true);assert.ok(travel.pitch>0);
  assert.equal(rest.resting,true);assert.ok(rest.scale<1);
  assert.equal(retire.retired,true);assert.ok(retire.scale<1);
});

test('all canonical monsters and wild ecology species map to recognizable 3D archetypes',()=>{
  const expected={
    DIGITAL_ANT:'ANT',DIGITAL_ANT_ATM_UFO:'UFO',BULL_DEMON:'BULL_DEMON',STONE_APE:'APE',FIRE_WISP:'WISP',
    FISH:'FISH',SHRIMP:'SHRIMP',COW:'COW',SHEEP:'SHEEP',CHICKEN:'CHICKEN',DUCK:'DUCK',TREE:'TREE',FLOWER:'FLOWER'
  };
  for(const [species,archetype] of Object.entries(expected))assert.equal(creatureArchetypeForSpecies(species),archetype,`${species} must keep a dedicated silhouette`);
  assert.equal(new Set(Object.values(expected)).size,13,'canonical creature and vehicle families must not collapse into one generic body');
});

test('runtime sync preserves the archetype-specific silhouette scale',()=>{
  const root={
    userData:{baseScale:.75,archetypeScale:1.18},
    visible:true,
    position:{set(){}},
    scale:{value:0,setScalar(value){this.value=value}},
    rotation:{x:0},
    getObjectByName(){return null},
  };
  syncLifeVisual(root,{species:'BULL_DEMON',state:'OBSERVE',x:1,y:0,z:2,marketLife:{lifestyle:{action:'WORK'}}});
  assert.ok(Math.abs(root.scale.value-(.75*1.18*1.03))<1e-12,'per-frame sync must retain Bull Demon silhouette scale');
});

// THREE-compatible scene/resource doubles. The production body and cargo factories
// run unchanged; dispose counters establish ownership calls, not GPU/FPS results.
function cargoThreeFixture(){
  let allocations=0;
  class Vector{
    constructor(x=0,y=0,z=0){this.set(x,y,z)}
    set(x,y,z){Object.assign(this,{x,y,z});return this}
    setScalar(n){return this.set(n,n,n)}
    multiplyScalar(n){return this.set(this.x*n,this.y*n,this.z*n)}
  }
  class Group{
    constructor(){this.children=[];this.parent=null;this.userData={};this.visible=true;this.position=new Vector();this.rotation=new Vector();this.scale=new Vector(1,1,1)}
    add(...objects){for(const object of objects){object.parent?.remove(object);object.parent=this;this.children.push(object)}return this}
    remove(object){const index=this.children.indexOf(object);if(index>=0){this.children.splice(index,1);object.parent=null}return this}
    clear(){for(const child of [...this.children])this.remove(child);return this}
    traverse(visit){visit(this);for(const child of this.children)child.traverse(visit)}
    getObjectByName(name){if(this.name===name)return this;for(const child of this.children){const found=child.getObjectByName(name);if(found)return found}}
  }
  class Resource{constructor(){allocations++;this.disposeCalls=0}dispose(){this.disposeCalls++}}
  class Mesh extends Group{constructor(geometry,material){super();this.geometry=geometry;this.material=material}}
  return {Group,Mesh,MeshStandardMaterial:Resource,BoxGeometry:Resource,CylinderGeometry:Resource,SphereGeometry:Resource,TorusGeometry:Resource,ConeGeometry:Resource,get allocations(){return allocations}};
}
function visualResources(root){
  const resources=new Set();
  root.traverse(node=>{if(node.geometry)resources.add(node.geometry);for(const material of [node.material].flat())if(material)resources.add(material)});
  return [...resources];
}
const courierLife=(cargoId='CASH-1',status='IN_TRANSIT',unit='KAIOS')=>({lifeId:'ANT-QA',species:'DIGITAL_ANT',state:'OBSERVE',cargo:{cargoId,amount:18,unit},mission:{status},marketLife:{lifestyle:{action:'WORK'}}});

test('cargo replacement releases each owned resource once across repeated custody and identity changes',()=>{
  const THREE=cargoThreeFixture(),root=createProceduralLifeBody(THREE,{species:'DIGITAL_ANT'});
  const bodyResources=visualResources(root),cargo=root.getObjectByName('LIFE_STATUS_CARGO'),released=[];
  let life=courierLife();syncLifeVisual(root,life);
  const firstIdentity=cargo.userData.cargoIdentityKey;
  for(let i=0;i<64;i++){
    const previous=cargo.children[0],resources=visualResources(previous);
    // Cash rails/bands genuinely share materials within the factory-owned tree.
    const materials=[];previous.traverse(node=>{if(node.material)materials.push(node.material)});
    assert.ok(materials.length>new Set(materials).size,'fixture must exercise the real factory shared materials');
    life=courierLife(i<32?'CASH-1':`CASH-${i}`,i%2?'IN_TRANSIT':'ARRIVED_AWAITING_RECEIPT');
    const before=structuredClone(life);syncLifeVisual(root,life);
    assert.deepEqual(life,before,'visual refresh cannot mutate cargo, mission or custody domain state');
    assert.equal(cargo.children.length,1);assert.equal(previous.parent,null);
    assert.notEqual(cargo.children[0],previous);
    for(const resource of resources)assert.equal(resource.disposeCalls,1,'retired cargo resource must be disposed exactly once');
    released.push(...resources);
    for(const resource of visualResources(cargo))assert.equal(resource.disposeCalls,0,'replacement stays live');
    assert.equal(cargo.userData.custodyType,i%2?'ARMORED_CASH_CASE':'ATM_CASSETTE');
    assert.equal(cargo.children[0].userData.ledgerTransfer,false);
    if(i<32)assert.equal(cargo.userData.cargoIdentityKey,firstIdentity,'custody transition preserves asset identity');
  }
  for(const resource of released)assert.equal(resource.disposeCalls,1,'older generations cannot be disposed again');
  for(const resource of bodyResources)assert.equal(resource.disposeCalls,0,'life body and status rings are separate owners');
});

test('unchanged and hidden cargo retain their cached visual without allocation or disposal',()=>{
  const THREE=cargoThreeFixture(),root=createProceduralLifeBody(THREE,{species:'DIGITAL_ANT'}),life=courierLife();
  syncLifeVisual(root,life);const cargo=root.getObjectByName('LIFE_STATUS_CARGO'),visual=cargo.children[0],resources=visualResources(visual);
  const allocations=THREE.allocations;
  for(let i=0;i<32;i++)syncLifeVisual(root,{...life,cargo:{...life.cargo,amount:i+1}});
  syncLifeVisual(root,{...life,cargo:{amount:0},mission:{status:'COMPLETE'}});
  assert.equal(cargo.visible,false);assert.equal(cargo.children[0],visual);
  syncLifeVisual(root,life);assert.equal(cargo.visible,true);assert.equal(cargo.children[0],visual);
  assert.equal(THREE.allocations,allocations,'same-identity and hidden cargo cannot allocate replacements');
  for(const resource of resources)assert.equal(resource.disposeCalls,0);
});

test('cargo teardown does not claim borrowed body resources attached after factory creation',()=>{
  const THREE=cargoThreeFixture(),root=createProceduralLifeBody(THREE,{species:'DIGITAL_ANT'}),life=courierLife();
  syncLifeVisual(root,life);const cargo=root.getObjectByName('LIFE_STATUS_CARGO'),old=cargo.children[0],owned=visualResources(old);
  const body=root.getObjectByName('ANT_SEGMENT_0');
  const borrowed=new THREE.Mesh(body.geometry,[body.material,body.material]);old.add(borrowed);
  syncLifeVisual(root,courierLife('KGEN-2','IN_TRANSIT','KGEN'));
  assert.equal(body.geometry.disposeCalls,0);assert.equal(body.material.disposeCalls,0);
  for(const resource of owned)assert.equal(resource.disposeCalls,1);
  assert.equal(cargo.userData.itemShape,'KGEN_CYLINDER');assert.equal(cargo.userData.custodyType,null);
});
