import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const out='artifacts/11520-visual-qa/11520-backpack-item-3d.png';
const dropOut='artifacts/11520-visual-qa/11520-live-world-ground-drop.png';
const worldOut='artifacts/11520-visual-qa/11520-world-item-identity-390x844.png';
const transitOut='artifacts/11520-visual-qa/11520-cargo-transit-390x844.png';
const cargoReport='artifacts/11520-visual-qa/11520-cargo-resource-lifetime.json';
const sourceHead=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
await fs.mkdir('artifacts/11520-visual-qa',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
await page.addInitScript(()=>{
  // Seed the actual pre-Player-Life guest owner; arbitrary foreign owners must
  // remain rejected by V2.8's backpack ownership validation.
  localStorage.setItem('11520.backpack.v1',JSON.stringify({version:'11520-BACKPACK-V1',ownerId:'PLAYER-11520',capacitySlots:24,capacityWeight:120,updatedAt:Date.now(),items:[
    {itemId:'QA-TREASURE',name:'火眼晶石',kind:'TREASURE',species:null,qty:1,weightEach:.5,stackable:true,treasureClass:'RARE',lifeId:null,meta:{}},
    {itemId:'QA-KGEN',name:'KGEN 貨筒',kind:'MATERIAL',species:null,qty:2,weightEach:1,stackable:true,treasureClass:null,lifeId:null,meta:{cargoKind:'KGEN'}},
    {itemId:'QA-CASH',name:'KAIOS 現鈔',kind:'MATERIAL',species:null,qty:1,weightEach:1,stackable:true,treasureClass:null,lifeId:null,meta:{cargoKind:'CASH',unit:'KAIOS'}},
    {itemId:'QA-FOOD',name:'蟠桃',kind:'FOOD',species:null,qty:3,weightEach:.2,stackable:true,treasureClass:null,lifeId:null,meta:{}},
    {itemId:'QA-COW',name:'花果山牛',kind:'LIVING_CARGO',species:'COW',qty:1,weightEach:1,stackable:false,treasureClass:null,lifeId:'LIFE-QA-COW',meta:{}},
  ]}));
});
await page.goto('http://127.0.0.1:4173/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html',{waitUntil:'domcontentloaded',timeout:60000});
const sourceFiles=[];
for(const name of ['life-visual-runtime.mjs','world-item-visual-runtime.mjs','item-visual-runtime.mjs']){
  const path=`K線西遊記/temples/11520/runtime/${name}`,local=await fs.readFile(path);
  const response=await page.request.get(`http://127.0.0.1:4173/${encodeURI(path)}`),served=await response.body();
  if(!response.ok()||!local.equals(served))throw new Error(`CARGO_SOURCE_MISMATCH:${name}`);
  sourceFiles.push({path,sha256:createHash('sha256').update(served).digest('hex')});
}
// Live market polling is intentionally ongoing: await the actual scene, not network silence.
await page.waitForFunction(()=>globalThis.__K11520_WORLD_ITEM_DROP__?.sceneReady===true,null,{timeout:45000});
await page.locator('#intro11520').waitFor({state:'hidden',timeout:5000});
await page.waitForSelector('#k11520UtilityMaster',{timeout:30000});
await page.click('#k11520UtilityMaster');
await page.waitForSelector('#backpackButton',{timeout:30000});
await page.click('#backpackButton');
await page.waitForSelector('#backpackPanel.open');
const migrated=await page.evaluate(()=>({bag:K11520Backpack.get(),playerId:__K11520_PLAYER_LIFE__.snapshot().player.playerId}));
if(migrated.bag.ownerId!==migrated.playerId||migrated.bag.items.length!==5)throw new Error('LEGACY_GUEST_BACKPACK_MIGRATION_FAILED');
await page.waitForFunction(()=>document.querySelectorAll('canvas.bp3d[data-item3d="ready"]').length>=5,null,{timeout:30000});
const shapes=await page.$$eval('canvas.bp3d[data-item3d="ready"]',els=>els.map(e=>e.dataset.itemShape));
for(const expected of ['CRYSTAL','KGEN_CYLINDER','CASH_BUNDLE','FOOD','LIFE_CRATE'])if(!shapes.includes(expected))throw new Error(`MISSING_3D_ITEM_SHAPE:${expected}`);
if(pageErrors.length)throw new Error(`PAGEERROR:${pageErrors.join('|')}`);
await page.screenshot({path:out,fullPage:false});

await page.waitForFunction(()=>globalThis.__K11520_WORLD_ITEM_DROP__?.sceneReady===true,null,{timeout:5000});
await page.locator('[data-item="QA-CASH"] [data-action="discard"]').click();
await page.waitForFunction(()=>globalThis.__K11520_WORLD_ITEM_DROP__?.drops?.size===1,null,{timeout:3000});
const liveDrop=await page.evaluate(()=>{const api=globalThis.__K11520_WORLD_ITEM_DROP__,d=[...api.drops.values()][0];return{sceneReady:api.sceneReady,size:api.drops.size,identityKey:d.identityKey,shape:d.shape,custodyType:d.custodyType,itemId:d.item.itemId,backpackHasCash:globalThis.K11520Backpack.get().items.some(i=>i.itemId==='QA-CASH')}});
if(!liveDrop.sceneReady||liveDrop.size!==1)throw new Error('LIVE_WORLD_DROP_NOT_CREATED');
if(liveDrop.shape!=='CASH_BUNDLE'||liveDrop.custodyType!=='CASH_CASE')throw new Error(`LIVE_WORLD_DROP_WRONG_VISUAL:${liveDrop.shape}/${liveDrop.custodyType}`);
if(liveDrop.backpackHasCash)throw new Error('DISCARDED_CASH_STILL_IN_BACKPACK');
await page.click('#backpackButton');
await page.waitForFunction(()=>!document.querySelector('#backpackPanel')?.classList.contains('open'),null,{timeout:3000});
await page.waitForSelector('#worldItemPickup.show',{timeout:3000});
await page.screenshot({path:dropOut,fullPage:false});
const pickup=await page.evaluate(()=>globalThis.__K11520_WORLD_ITEM_DROP__.collectNearest());
if(!pickup?.ok)throw new Error(`LIVE_WORLD_PICKUP_FAILED:${pickup?.reason}`);
const afterPickup=await page.evaluate(()=>({dropCount:globalThis.__K11520_WORLD_ITEM_DROP__.drops.size,backpackHasCash:globalThis.K11520Backpack.get().items.some(i=>i.itemId==='QA-CASH')}));
if(afterPickup.dropCount!==0||!afterPickup.backpackHasCash)throw new Error('LIVE_WORLD_PICKUP_DID_NOT_RESTORE_BACKPACK');

const identity=await page.evaluate(async(sourceHead)=>{
  const THREE=await import('three');
  const {WORLD_ITEM_CONTEXTS,CASH_CUSTODY_BY_CONTEXT,createWorldItemVisual}=await import('/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/world-item-visual-runtime.mjs');
  const {createProceduralLifeBody,syncLifeVisual}=await import('/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/life-visual-runtime.mjs');
  const item={itemId:'QA-CASH',name:'KAIOS 現鈔',kind:'MATERIAL',qty:88,meta:{cargoKind:'CASH',unit:'KAIOS'}};
  const host=document.createElement('section');host.id='qaWorldItemIdentity';host.style.cssText='position:fixed;inset:0;z-index:100000;background:#071016;padding:10px;box-sizing:border-box;color:white;font:12px system-ui;overflow:hidden';
  const title=document.createElement('h2');title.textContent='11520 現鈔保管鏈 · 同一資產不同容器';title.style.cssText='font-size:15px;color:#f5d77c;text-align:center;margin:2px 0 8px';host.appendChild(title);
  const provenance=document.createElement('p');provenance.textContent=`ISOLATED TEST GALLERY · ${sourceHead.slice(0,12)}`;provenance.style.cssText='font-size:9px;text-align:center;margin:0 0 6px;color:#7fa5b5';host.appendChild(provenance);
  const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(2,1fr);gap:7px';host.appendChild(grid);
  // These cameras belong only to this synthetic evidence gallery. The live
  // production world, navigation camera and real UI remain untouched.
  function frameGallery(root,camera){
    root.updateWorldMatrix(true,true);
    const sphere=new THREE.Box3().setFromObject(root).getBoundingSphere(new THREE.Sphere());
    const vertical=THREE.MathUtils.degToRad(camera.fov),horizontal=2*Math.atan(Math.tan(vertical/2)*camera.aspect);
    const distance=Math.max(.1,sphere.radius)/Math.sin(Math.min(vertical,horizontal)/2)*1.18;
    camera.position.copy(sphere.center).addScaledVector(new THREE.Vector3(1.9,1.35,2.45).normalize(),distance);
    camera.near=Math.max(.01,distance-sphere.radius*2);camera.far=Math.max(20,distance+sphere.radius*4);
    camera.lookAt(sphere.center);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  }
  const keys=[],custodyTypes=[];
  for(const context of WORLD_ITEM_CONTEXTS){
    const canvas=document.createElement('canvas');canvas.width=150;canvas.height=130;
    const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setSize(150,130,false);renderer.setPixelRatio(1);renderer.setClearColor(0x0a1720,1);
    const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xffffff,0x26313c,2.2));const key=new THREE.DirectionalLight(0xffffff,2.6);key.position.set(2.5,3,2);scene.add(key);
    const visual=createWorldItemVisual(THREE,item,{context,scale:1});visual.root.position.set(0,0,0);visual.root.rotation.y=.62;scene.add(visual.root);
    const camera=new THREE.PerspectiveCamera(34,150/130,.01,20);frameGallery(visual.root,camera);
    renderer.render(scene,camera);renderer.getContext().finish();renderer.render(scene,camera);
    keys.push(visual.identityKey);custodyTypes.push(visual.custody.custodyType);
    const card=document.createElement('article');card.style.cssText='border:1px solid #ffffff2b;border-radius:10px;background:#0a1720;padding:5px;text-align:center';
    canvas.style.cssText='display:block;width:150px;height:130px;max-width:100%;margin:auto;object-fit:contain';card.appendChild(canvas);
    const b=document.createElement('b');b.textContent=context;b.style.cssText='display:block;color:#d8e8ef;margin-top:2px;font-size:10px';card.appendChild(b);
    const small=document.createElement('small');small.textContent=`${visual.descriptor.shape} inside ${visual.custody.custodyType}`;small.style.cssText='display:block;color:#7fa5b5;margin-top:1px;font-size:8px';card.appendChild(small);grid.appendChild(card);
  }

  const antCanvas=document.createElement('canvas');antCanvas.width=350;antCanvas.height=180;
  const antRenderer=new THREE.WebGLRenderer({canvas:antCanvas,antialias:true,alpha:false,preserveDrawingBuffer:true});antRenderer.setSize(350,180,false);antRenderer.setPixelRatio(1);antRenderer.setClearColor(0x0a1720,1);
  const antScene=new THREE.Scene();antScene.add(new THREE.HemisphereLight(0xffffff,0x26313c,2.4));const antKey=new THREE.DirectionalLight(0xffffff,2.6);antKey.position.set(3,5,4);antScene.add(antKey);
  const ant=createProceduralLifeBody(THREE,{species:'DIGITAL_ANT',name:'Digital Ant QA',scale:1});antScene.add(ant);
  const transit={lifeId:'LIFE-DIGITAL-ANT-QA',species:'DIGITAL_ANT',state:'OBSERVE',x:0,y:0,z:0,cargo:{cargoId:'QA-CASH',amount:88,unit:'KAIOS'},mission:{status:'IN_TRANSIT'},marketLife:{lifestyle:{action:'WORK'}}};
  syncLifeVisual(ant,transit);const cargo=ant.getObjectByName('LIFE_STATUS_CARGO');const transitIdentity=cargo.userData.cargoIdentityKey,transitShape=cargo.userData.itemShape,transitContext=cargo.userData.cargoContext,transitCustody=cargo.userData.custodyType;
  const antCamera=new THREE.PerspectiveCamera(38,350/180,.01,20);
  const renderAnt=()=>{frameGallery(ant,antCamera);antRenderer.render(antScene,antCamera);antRenderer.getContext().finish()};renderAnt();
  const antCard=document.createElement('article');antCard.style.cssText='grid-column:1/-1;border:1px solid #68e4ff55;border-radius:10px;background:#0a1720;padding:5px;text-align:center';antCanvas.style.cssText='width:100%;height:180px;object-fit:contain';antCard.appendChild(antCanvas);const antLabel=document.createElement('b');antLabel.textContent=`LIVE ANT · ${transitCustody} · inner ${transitShape}`;antLabel.style.cssText='display:block;color:#68e4ff;font-size:10px';antCard.appendChild(antLabel);grid.appendChild(antCard);
  document.body.appendChild(host);
  host.runCargoRebuildQA=()=>{
    const observed=new Map(),retired=new Set(),geometryByContext=new Map(),samples=[];
    function resources(root){const found=new Set();root.traverse(node=>{if(node.geometry)found.add(node.geometry);for(const material of [node.material].flat())if(material)found.add(material)});return [...found]}
    function observe(list){for(const resource of list)if(!observed.has(resource)){observed.set(resource,0);resource.addEventListener('dispose',()=>observed.set(resource,observed.get(resource)+1))}}
    const initialCargo=new Set(resources(cargo)),body=resources(ant).filter(resource=>!initialCargo.has(resource));observe(body);
    for(let i=0;i<17;i++){
      const oldRoot=cargo.children[0],old=resources(oldRoot);observe(old);
      const waiting=i%2===0,life={...transit,mission:{status:waiting?'ARRIVED_AWAITING_RECEIPT':'IN_TRANSIT'}},before=JSON.stringify(life);
      syncLifeVisual(ant,life);
      if(JSON.stringify(life)!==before)throw new Error('CARGO_DOMAIN_MUTATED');
      if(cargo.children.length!==1||cargo.children[0]===oldRoot||oldRoot.parent!==null)throw new Error('CARGO_REBUILD_NOT_REPLACED');
      for(const resource of old){retired.add(resource);if(observed.get(resource)!==1)throw new Error('CARGO_RESOURCE_DISPOSE_COUNT')}
      if(cargo.userData.cargoIdentityKey!==transitIdentity||cargo.userData.itemShape!==transitShape)throw new Error('CARGO_REBUILD_IDENTITY_DRIFT');
      if(cargo.userData.cargoContext!==(waiting?'ATM_UNLOAD':'ANT_CARGO')||cargo.userData.custodyType!==(waiting?'ATM_CASSETTE':'ARMORED_CASH_CASE'))throw new Error('CARGO_REBUILD_CUSTODY_DRIFT');
      if(cargo.children[0].userData.ledgerTransfer!==false)throw new Error('CARGO_LEDGER_SEMANTICS_CHANGED');
      const activeRoot=cargo.children[0],active=resources(activeRoot);observe(active);renderAnt();
      syncLifeVisual(ant,life);renderAnt();
      if(cargo.children[0]!==activeRoot||active.some(resource=>observed.get(resource)!==0))throw new Error('UNCHANGED_CARGO_REPLACED_OR_DISPOSED');
      const context=cargo.userData.cargoContext,geometries=antRenderer.info.memory.geometries;
      if(geometryByContext.has(context)&&geometryByContext.get(context)!==geometries)throw new Error('CARGO_RENDERER_GEOMETRY_COUNT_DRIFT');
      geometryByContext.set(context,geometries);samples.push({context,custody:cargo.userData.custodyType,geometries,disposedResources:old.length,activeResources:active.length});
    }
    if([...retired].some(resource=>observed.get(resource)!==1)||body.some(resource=>observed.get(resource)!==0))throw new Error('CARGO_RESOURCE_OWNERSHIP_DRIFT');
    antLabel.textContent=`LIVE ANT · ${cargo.userData.custodyType} · inner ${cargo.userData.itemShape}`;
    return{unloadIdentity:cargo.userData.cargoIdentityKey,unloadShape:cargo.userData.itemShape,unloadContext:cargo.userData.cargoContext,unloadCustody:cargo.userData.custodyType,rebuilds:samples.length,retiredResources:retired.size,bodyResources:body.length,samples,scope:'ISOLATED_TEST_GALLERY_REAL_THREE_RENDERER',gpuMemoryOrFpsClaim:false};
  };
  return{keys,custodyTypes,expectedCustody:WORLD_ITEM_CONTEXTS.map(x=>CASH_CUSTODY_BY_CONTEXT[x]),contexts:[...WORLD_ITEM_CONTEXTS],transitIdentity,transitShape,transitContext,transitCustody};
},sourceHead);
await page.screenshot({path:transitOut,fullPage:false});
const rebuild=await page.evaluate(()=>document.getElementById('qaWorldItemIdentity').runCargoRebuildQA());
Object.assign(identity,rebuild);
if(new Set(identity.keys).size!==1)throw new Error(`WORLD_ITEM_IDENTITY_DRIFT:${identity.keys.join(',')}`);
if(identity.contexts.length!==4)throw new Error('WORLD_ITEM_CONTEXTS_INCOMPLETE');
if(JSON.stringify(identity.custodyTypes)!==JSON.stringify(identity.expectedCustody))throw new Error(`CASH_CUSTODY_CHAIN_WRONG:${identity.custodyTypes.join(',')}`);
if(identity.transitIdentity!==identity.unloadIdentity)throw new Error(`LIVE_CARGO_IDENTITY_DRIFT:${identity.transitIdentity}!=${identity.unloadIdentity}`);
if(identity.transitShape!=='CASH_BUNDLE'||identity.unloadShape!=='CASH_BUNDLE')throw new Error('LIVE_CARGO_SHAPE_NOT_CANONICAL');
if(identity.transitContext!=='ANT_CARGO'||identity.unloadContext!=='ATM_UNLOAD')throw new Error(`LIVE_CARGO_CONTEXT_WRONG:${identity.transitContext}/${identity.unloadContext}`);
if(identity.transitCustody!=='ARMORED_CASH_CASE'||identity.unloadCustody!=='ATM_CASSETTE')throw new Error(`LIVE_CASH_CUSTODY_WRONG:${identity.transitCustody}/${identity.unloadCustody}`);
await page.waitForTimeout(250);
await page.screenshot({path:worldOut,fullPage:false});
if(pageErrors.length)throw new Error(`PAGEERROR:${pageErrors.join('|')}`);
await fs.writeFile(cargoReport,JSON.stringify({head:sourceHead,sourceFiles,viewport:{width:390,height:844},actualWorldScreenshots:[out,dropOut],isolatedGalleryScreenshots:[transitOut,worldOut],...identity},null,2)+'\n');
console.log(`[11520 ITEM 3D QA] PASS shapes=${shapes.join(',')} screenshot=${out}`);
console.log(`[11520 LIVE WORLD DROP QA] PASS identity=${liveDrop.identityKey} custody=${liveDrop.custodyType} pickup=PASS screenshot=${dropOut}`);
console.log(`[11520 CASH CUSTODY QA] PASS ${identity.custodyTypes.join('->')} live=${identity.transitCustody}->${identity.unloadCustody} screenshot=${worldOut}`);
console.log(`[11520 CARGO RESOURCE QA] PASS head=${sourceHead} rebuilds=${rebuild.rebuilds} retired=${rebuild.retiredResources} scope=${rebuild.scope} report=${cargoReport}`);
await browser.close();
