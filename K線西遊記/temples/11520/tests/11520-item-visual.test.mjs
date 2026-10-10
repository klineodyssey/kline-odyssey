import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {itemVisualDescriptor} from '../runtime/item-visual-runtime.mjs';
import {WORLD_ITEM_CONTEXTS,CASH_CUSTODY_BY_CONTEXT,assertSameCanonicalItemIdentity,canonicalWorldItem,cargoItemFromLife,custodyDescriptor} from '../runtime/world-item-visual-runtime.mjs';

test('11520 item visual identity uses distinct 3D shapes for core item families',()=>{
  const cases=[
    [{kind:'TREASURE',name:'火眼晶石',treasureClass:'RARE'},'CRYSTAL'],
    [{kind:'MATERIAL',name:'玄鐵'},'INGOT'],
    [{kind:'FOOD',name:'蟠桃'},'FOOD'],
    [{kind:'MATERIAL',name:'KGEN 貨筒',meta:{cargoKind:'KGEN'}},'KGEN_CYLINDER'],
    [{kind:'MATERIAL',name:'KAIOS 現鈔',meta:{cargoKind:'CASH',unit:'KAIOS'}},'CASH_BUNDLE'],
    [{kind:'LIVING_CARGO',name:'花果山牛',species:'COW',lifeId:'LIFE-COW-1'},'LIFE_CRATE'],
  ];
  const shapes=cases.map(([item,shape])=>{const d=itemVisualDescriptor(item);assert.equal(d.shape,shape);assert.ok(d.label);return d.shape});
  assert.equal(new Set(shapes).size,cases.length,'core item families must remain visually distinguishable');
});

test('living cargo descriptor preserves species identity',()=>{
  const cow=itemVisualDescriptor({kind:'LIVING_CARGO',name:'牛一號',species:'COW'});
  const fish=itemVisualDescriptor({kind:'LIVING_CARGO',name:'魚一號',species:'FISH'});
  assert.equal(cow.label,'COW');assert.equal(fish.label,'FISH');assert.notEqual(cow.label,fish.label);
});

test('one item keeps one canonical 3D identity across ground, backpack, ant cargo and ATM unload',()=>{
  const item={itemId:'KAIOS-CASH-001',kind:'MATERIAL',name:'KAIOS 現鈔',qty:88,meta:{cargoKind:'CASH',unit:'KAIOS'}};
  const proof=assertSameCanonicalItemIdentity(item);
  assert.equal(proof.ok,true);
  assert.deepEqual(proof.states.map(x=>x.context),WORLD_ITEM_CONTEXTS);
  assert.ok(proof.states.every(x=>x.descriptor.shape==='CASH_BUNDLE'));
  assert.equal(new Set(proof.states.map(x=>x.identityKey)).size,1);
});

test('physical KAIOS cash always has an explicit custody container and is never a ledger transfer',()=>{
  const item={itemId:'KAIOS-CASH-001',kind:'MATERIAL',name:'KAIOS 現鈔',qty:88,meta:{cargoKind:'CASH',unit:'KAIOS'}};
  const states=WORLD_ITEM_CONTEXTS.map(context=>canonicalWorldItem(item,context));
  assert.deepEqual(states.map(x=>x.custody.custodyType),WORLD_ITEM_CONTEXTS.map(x=>CASH_CUSTODY_BY_CONTEXT[x]));
  assert.ok(states.every(x=>x.custody.physicalCash===true&&x.custody.requiresCustodyContainer===true&&x.custody.ledgerTransfer===false));
  assert.equal(new Set(states.map(x=>x.identityKey)).size,1,'cash asset identity must survive custody changes');
  assert.equal(new Set(states.map(x=>x.custodyKey)).size,4,'custody container identity may change with custody state');
});

test('ledger-like KGEN cargo does not silently become physical cash custody',()=>{
  const item={itemId:'KGEN-CYL-001',kind:'MATERIAL',name:'KGEN 貨筒',meta:{cargoKind:'KGEN'}};
  const ground=canonicalWorldItem(item,'GROUND_DROP');
  const ant=canonicalWorldItem(item,'ANT_CARGO');
  const atm=canonicalWorldItem(item,'ATM_UNLOAD');
  assert.equal(ground.descriptor.shape,'KGEN_CYLINDER');
  assert.equal(ground.identityKey,ant.identityKey);
  assert.equal(ant.identityKey,atm.identityKey);
  assert.equal(custodyDescriptor(item,'ANT_CARGO').requiresCustodyContainer,false);
  assert.notEqual(ground.context,ant.context);
});

test('live Digital Ant cargo derives the same canonical item identity used by the world item runtime',()=>{
  const life={lifeId:'LIFE-DIGITAL-ANT-QA',species:'DIGITAL_ANT',cargo:{cargoId:'CARGO-QA-1',amount:88,unit:'KAIOS'},mission:{status:'IN_TRANSIT'}};
  const item=cargoItemFromLife(life);
  const ant=canonicalWorldItem(item,'ANT_CARGO');
  const atm=canonicalWorldItem(item,'ATM_UNLOAD');
  assert.equal(item.itemId,'CARGO-QA-1');
  assert.equal(ant.descriptor.shape,'CASH_BUNDLE');
  assert.equal(ant.identityKey,atm.identityKey);
  assert.equal(ant.custody.custodyType,'ARMORED_CASH_CASE');
  assert.equal(atm.custody.custodyType,'ATM_CASSETTE');
});

async function previewHarness(t){
  // Import the unchanged production owner from an isolated directory with only
  // its THREE dependency doubled. No source rewriting or GPU/FPS claim.
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'11520-preview-'));
  t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  await fs.copyFile(new URL('../runtime/item-visual-runtime.mjs',import.meta.url),path.join(dir,'item.mjs'));
  await fs.mkdir(path.join(dir,'node_modules/three'),{recursive:true});
  await fs.writeFile(path.join(dir,'node_modules/three/package.json'),JSON.stringify({type:'module',exports:'./index.mjs'}));
  await fs.writeFile(path.join(dir,'node_modules/three/index.mjs'),`
    export const stats={renderers:0,renders:0,used:new Set(),throwRender:false,throwConstructor:false,listsCleared:0,rendererDisposals:0,instances:[]};
    class Vector{set(x,y,z){Object.assign(this,{x,y,z});return this}setScalar(n){return this.set(n,n,n)}}
    export class Group{constructor(){this.children=[];this.userData={};this.position=new Vector();this.rotation=new Vector();this.scale=new Vector()}
      add(...objects){this.children.push(...objects)}traverse(visit){visit(this);for(const child of this.children)child.traverse(visit)}clear(){this.children=[]}}
    export class Scene extends Group{}
    export class Mesh extends Group{constructor(geometry,material){super();this.geometry=geometry;this.material=material}}
    class Resource{constructor(){this.disposes=0}dispose(){this.disposes++}}
    export {Resource as MeshStandardMaterial,Resource as BoxGeometry,Resource as CylinderGeometry,Resource as SphereGeometry,Resource as TorusGeometry,Resource as ConeGeometry,Resource as OctahedronGeometry};
    export class PerspectiveCamera extends Group{lookAt(){}updateProjectionMatrix(){}}
    export class HemisphereLight extends Group{}
    export class DirectionalLight extends Group{}
    export class WebGLRenderer{constructor({canvas,context}){stats.renderers++;if(stats.throwConstructor)throw new Error('CONSTRUCTOR_FAILURE');this.context=context;this.domElement=canvas;this.ratio=1;this.stackDepth=0;stats.instances.push(this);this.renderLists={dispose(){stats.listsCleared++}}}
      setPixelRatio(n){this.ratio=n}setSize(w,h){this.domElement.width=w*this.ratio;this.domElement.height=h*this.ratio}setClearColor(){}
      getContext(){return this.context}dispose(){stats.rendererDisposals++;this.stackDepth=0}forceContextLoss(){this.context.getExtension('WEBGL_lose_context').loseContext()}
      render(scene){stats.renders++;this.stackDepth++;scene.traverse(node=>{if(node.geometry)stats.used.add(node.geometry);for(const material of [node.material].flat())if(material)stats.used.add(material);if(node.userData.descriptor)this.domElement.shape=node.userData.descriptor.shape});if(stats.throwRender)throw new Error('RENDER_FAILURE');this.stackDepth--}}
  `);
  const owner=await import(pathToFileURL(path.join(dir,'item.mjs')).href),THREE=await import(pathToFileURL(path.join(dir,'node_modules/three/index.mjs')).href);
  const canvases=[],contexts=[];
  const document={createElement(){const gl={lost:false,isContextLost(){return this.lost},getExtension(){return{loseContext(){gl.lost=true}}}};const canvas={width:0,height:0,getContext(type){assert.equal(type,'webgl2');if(!contexts.includes(gl))contexts.push(gl);return gl}};canvases.push(canvas);return canvas}};
  function canvas(){const target={ownerDocument:document,dataset:{},attributes:{},paints:[],width:0,height:0,setAttribute(k,v){this.attributes[k]=v}};target.getContext=type=>{assert.equal(type,'2d');return{clearRect(){},drawImage(source){target.paints.push(source.shape)}}};return target}
  return {owner,stats:THREE.stats,canvas,canvases,contexts};
}

test('preview owner keeps one renderer across 100 canvases and releases rendered item resources once',async t=>{
  const h=await previewHarness(t),item={itemId:'CASH-PREVIEW',kind:'MATERIAL',name:'KAIOS 現鈔',meta:{cargoKind:'CASH',unit:'KAIOS'}};
  const rendered=[];
  for(let i=0;i<100;i++){
    const canvas=h.canvas(),before=structuredClone(item),result=await h.owner.renderItemPreview(canvas,item,{size:88});
    rendered.push({canvas,before,result});
  }
  assert.equal(h.stats.renderers,1);assert.equal(h.stats.renders,100);assert.equal(h.stats.listsCleared,100);
  for(const {canvas,before,result} of rendered){
    assert.equal(result.ok,true);assert.equal(result.descriptor.shape,'CASH_BUNDLE');assert.equal(canvas.dataset.item3d,'ready');
    assert.deepEqual(canvas.paints,['CASH_BUNDLE']);assert.equal(canvas.width,88);assert.equal(canvas.height,88);assert.deepEqual(item,before);
    assert.equal(result.renderer,null,'shared renderer must not escape as caller-owned');assert.equal(result.root,null,'disposed item resources must not escape as caller-owned');
  }
  assert.ok(h.stats.used.size>0);for(const resource of h.stats.used)assert.equal(resource.disposes,1);
});

test('superseded requests cannot repaint the same canvas after the THREE import',async t=>{
  const h=await previewHarness(t),canvas=h.canvas();
  const old=h.owner.renderItemPreview(canvas,{kind:'MATERIAL',name:'玄鐵'});
  const latest=h.owner.renderItemPreview(canvas,{kind:'FOOD',name:'蟠桃'});
  assert.equal((await old).reason,'PREVIEW_STALE');assert.equal((await latest).ok,true);
  assert.deepEqual(canvas.paints,['FOOD']);assert.equal(canvas.dataset.itemShape,'FOOD');assert.equal(h.stats.renders,1);
});

test('superseded backpack batches allocate nothing and never mark a preview ready',async t=>{
  const h=await previewHarness(t),canvas=h.canvas();
  const result=await h.owner.renderItemPreview(canvas,{kind:'FOOD',name:'蟠桃'},{shouldRender:()=>false});
  assert.equal(result.reason,'PREVIEW_STALE');assert.equal(h.stats.renderers,0);assert.equal(canvas.dataset.item3d,undefined);assert.deepEqual(canvas.paints,[]);
});

test('render and bitmap-copy failures release owned resources and permit the next preview',async t=>{
  const h=await previewHarness(t);h.stats.throwRender=true;
  await assert.rejects(h.owner.renderItemPreview(h.canvas(),{kind:'MATERIAL',name:'KAIOS 現鈔'}),/RENDER_FAILURE/);
  for(const resource of h.stats.used)assert.equal(resource.disposes,1);
  assert.equal(h.stats.rendererDisposals,1);assert.equal(h.contexts[0].lost,true);assert.equal(h.stats.instances[0].stackDepth,0);
  h.stats.throwRender=false;const broken=h.canvas();broken.getContext=()=>({clearRect(){},drawImage(){throw new Error('COPY_FAILURE')}});
  await assert.rejects(h.owner.renderItemPreview(broken,{kind:'FOOD',name:'蟠桃'}),/COPY_FAILURE/);
  assert.notEqual(broken.dataset.item3d,'ready');for(const resource of h.stats.used)assert.equal(resource.disposes,1);
  assert.equal((await h.owner.renderItemPreview(h.canvas(),{kind:'FOOD',name:'蟠桃'})).ok,true);
  assert.equal(h.stats.renderers,2,'copy failure can reuse the replacement healthy renderer');assert.equal(h.stats.rendererDisposals,1);for(const resource of h.stats.used)assert.equal(resource.disposes,1);
});

test('constructor and lost-context failures retire only the private preview context',async t=>{
  const h=await previewHarness(t);h.stats.throwConstructor=true;
  await assert.rejects(h.owner.renderItemPreview(h.canvas(),{kind:'FOOD'}),/CONSTRUCTOR_FAILURE/);
  assert.equal(h.contexts.length,1);assert.equal(h.contexts[0].lost,true);
  h.stats.throwConstructor=false;assert.equal((await h.owner.renderItemPreview(h.canvas(),{kind:'FOOD'})).ok,true);
  h.contexts[1].lost=true;
  await assert.rejects(h.owner.renderItemPreview(h.canvas(),{kind:'FOOD'}),/PREVIEW_CONTEXT_LOST/);
  assert.equal(h.stats.rendererDisposals,1);
  assert.equal((await h.owner.renderItemPreview(h.canvas(),{kind:'FOOD'})).ok,true);
  assert.equal(h.contexts.filter(context=>!context.lost).length,1,'at most one private context remains live');
});

test('actual backpack batch close/reopen fences pending work and paints only the current canvas',async t=>{
  const h=await previewHarness(t),oldCanvas=h.canvas(),newCanvas=h.canvas();oldCanvas.isConnected=true;newCanvas.isConnected=true;
  let currentCanvas=oldCanvas,open=true;
  const source=await fs.readFile(new URL('../runtime/backpack-ui.mjs',import.meta.url),'utf8');
  const batch=source.slice(source.indexOf('async function render3dPreviews('),source.indexOf('async function requestLivingRelease('));
  const context={document:{getElementById:()=>({classList:{contains:()=>open}}),querySelector:()=>currentCanvas},CSS:{escape:value=>value},renderItemPreview:h.owner.renderItemPreview,console};
  runInNewContext('let previewGeneration=0;'+batch+';globalThis.batch={render:render3dPreviews,invalidate:()=>++previewGeneration};',context);
  const old=context.batch.render([{itemId:'OLD',kind:'MATERIAL',name:'玄鐵'}],0);
  open=false;oldCanvas.isConnected=false;context.batch.invalidate();
  currentCanvas=newCanvas;open=true;
  const latest=context.batch.render([{itemId:'NEW',kind:'FOOD',name:'蟠桃'}],1);
  await Promise.all([old,latest]);
  assert.deepEqual(oldCanvas.paints,[]);assert.deepEqual(newCanvas.paints,['FOOD']);assert.equal(newCanvas.dataset.item3d,'ready');assert.equal(h.stats.renders,1);
});
