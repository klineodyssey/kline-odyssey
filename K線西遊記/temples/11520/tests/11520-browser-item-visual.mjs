import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const out='artifacts/11520-visual-qa/11520-backpack-item-3d.png';
const dropOut='artifacts/11520-visual-qa/11520-live-world-ground-drop.png';
const worldOut='artifacts/11520-visual-qa/11520-world-item-identity-390x844.png';
const previewReport='artifacts/11520-visual-qa/11520-inventory-preview-lifetime.json';
const sourceHead=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
await fs.mkdir('artifacts/11520-visual-qa',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
const consoleProblems=[];page.on('console',message=>{if(/context lost|too many active WebGL/i.test(message.text()))consoleProblems.push(message.text())});
await page.addInitScript(()=>{
  // Observer-only test instrumentation: every original context/resource call is
  // forwarded unchanged. No context is created, lost or restored by this probe.
  const original=HTMLCanvasElement.prototype.getContext,seen=new WeakMap(),records=[],events=[];
  HTMLCanvasElement.prototype.getContext=function(...args){
    const context=original.apply(this,args);
    if(context&&/^(webgl2?|experimental-webgl)$/.test(args[0])&&!seen.has(context)){
      const record={canvas:this,context,counts:{},created:{},peaks:{}};seen.set(context,record);records.push(record);
      for(const [create,remove,key] of [['createBuffer','deleteBuffer','buffers'],['createTexture','deleteTexture','textures'],['createProgram','deleteProgram','programs'],['createVertexArray','deleteVertexArray','vertexArrays']]){
        if(!context[create])continue;
        const live=new Set(),make=context[create],drop=context[remove];record.counts[key]=live;record.created[key]=0;record.peaks[key]=0;
        context[create]=function(...values){const resource=make.apply(this,values);if(resource){live.add(resource);record.created[key]++;record.peaks[key]=Math.max(record.peaks[key],live.size)}return resource};
        context[remove]=function(resource,...values){const result=drop.call(this,resource,...values);live.delete(resource);return result};
      }
      for(const type of ['webglcontextlost','webglcontextrestored'])this.addEventListener(type,()=>events.push({type,canvasId:this.id,at:performance.now()}));
    }
    return context;
  };
  globalThis.__K11520_PREVIEW_QA__={snapshot:()=>({events:[...events],contexts:records.map(r=>({canvasId:r.canvas.id,inDOM:r.canvas.isConnected,lost:r.context.isContextLost(),live:Object.fromEntries(Object.entries(r.counts).map(([k,v])=>[k,v.size])),created:{...r.created},peaks:{...r.peaks}}))})};
});
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
for(const name of ['item-visual-runtime.mjs','backpack-ui.mjs']){
  const path=`K線西遊記/temples/11520/runtime/${name}`,local=await fs.readFile(path);
  const response=await page.request.get(`http://127.0.0.1:4173/${encodeURI(path)}`),served=await response.body();
  if(!response.ok()||!local.equals(served))throw new Error(`PREVIEW_SOURCE_MISMATCH:${name}`);
  sourceFiles.push({path,sha256:createHash('sha256').update(served).digest('hex')});
}
const previewSamples=[];let previewLiveBaseline=null;
async function previewSample(stage){
  const sample=await page.evaluate(()=>{
    const state=globalThis.__K11520_PREVIEW_QA__.snapshot(),canvases=[...document.querySelectorAll('canvas.bp3d[data-item3d="ready"]')];
    return{...state,readyCanvases:canvases.length,allReadyAreBitmaps:canvases.every(c=>Boolean(c.getContext('2d')))};
  });
  previewSamples.push({stage,...sample});
  if(sample.events.some(event=>event.canvasId==='three'&&event.type==='webglcontextlost')||consoleProblems.length)throw new Error('WORLD_CONTEXT_LOSS_DURING_INVENTORY_PREVIEW');
  const previews=sample.contexts.filter(context=>context.canvasId!=='three');
  if(sample.contexts.length!==2||previews.length!==1||previews[0].inDOM||previews[0].lost)throw new Error(`PREVIEW_CONTEXT_BOUND_FAILED:${JSON.stringify(sample.contexts)}`);
  if(!sample.allReadyAreBitmaps)throw new Error('VISIBLE_PREVIEW_STILL_OWNS_WEBGL_CONTEXT');
  const live=previews[0].live;
  if(live.buffers!==0||live.programs!==0||live.vertexArrays!==0)throw new Error(`PREVIEW_RESOURCE_NOT_RELEASED:${JSON.stringify(live)}`);
  if(previewLiveBaseline&&JSON.stringify(live)!==previewLiveBaseline)throw new Error('PREVIEW_LIVE_RESOURCE_COUNT_GREW');
  previewLiveBaseline=JSON.stringify(live);return sample;
}
async function assertWorldFrame(stage){
  const result=await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>{
    const canvas=document.getElementById('three'),gl=canvas.getContext('webgl2');
    if(!gl||gl.isContextLost())return resolve({ready:false,reason:'CONTEXT_LOST'});
    const width=gl.drawingBufferWidth,height=gl.drawingBufferHeight,pixels=new Uint8Array(width*height*4);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    const colors=new Set();let visible=0;
    for(let y=1;y<12;y++)for(let x=1;x<12;x++){const i=(Math.floor(height*y/12)*width+Math.floor(width*x/12))*4;if(pixels[i+3]){colors.add(`${pixels[i]>>3},${pixels[i+1]>>3},${pixels[i+2]>>3}`);if(Math.max(pixels[i],pixels[i+1],pixels[i+2])>20)visible++}}
    resolve({ready:visible>=3&&colors.size>=2,width,height,visibleSamples:visible,colors:colors.size});
  })));
  previewSamples.push({stage,worldFrame:result});if(!result.ready)throw new Error(`WORLD_FRAME_EMPTY:${stage}`);
}
// Live market polling is intentionally ongoing: await the actual scene, not network silence.
try{
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
await previewSample('initial-open');
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
await previewSample('initial-discard-and-close');await assertWorldFrame('initial-ground-drop');
await page.screenshot({path:dropOut,fullPage:false});
const pickup=await page.evaluate(()=>globalThis.__K11520_WORLD_ITEM_DROP__.collectNearest());
if(!pickup?.ok)throw new Error(`LIVE_WORLD_PICKUP_FAILED:${pickup?.reason}`);
const afterPickup=await page.evaluate(()=>({dropCount:globalThis.__K11520_WORLD_ITEM_DROP__.drops.size,backpackHasCash:globalThis.K11520Backpack.get().items.some(i=>i.itemId==='QA-CASH')}));
if(afterPickup.dropCount!==0||!afterPickup.backpackHasCash)throw new Error('LIVE_WORLD_PICKUP_DID_NOT_RESTORE_BACKPACK');

// Exercise the actual product controls/store before creating any synthetic
// gallery contexts. One private preview context must survive every viewport.
const profiles=[{name:'360',width:360,height:740},{name:'390',width:390,height:844},{name:'412',width:412,height:772},{name:'432',width:432,height:856},{name:'480',width:480,height:900},{name:'landscape',width:844,height:390}];
try{
  for(const profile of profiles){
    await page.setViewportSize({width:profile.width,height:profile.height});
    for(let cycle=0;cycle<4;cycle++){
      await page.locator('#backpackButton').click();
      await page.waitForFunction(()=>document.querySelector('#backpackPanel')?.classList.contains('open')&&document.querySelectorAll('canvas.bp3d[data-item3d="ready"]').length===5,null,{timeout:3000});
      await previewSample(`${profile.name}-${cycle}-open`);
      if(cycle===0)await page.screenshot({path:`artifacts/11520-visual-qa/11520-preview-${profile.name}-open.png`,fullPage:false});
      await page.locator('[data-item="QA-CASH"] [data-action="discard"]').click();
      await page.waitForFunction(()=>globalThis.__K11520_WORLD_ITEM_DROP__.drops.size===1&&document.querySelectorAll('canvas.bp3d[data-item3d="ready"]').length===4,null,{timeout:3000});
      await previewSample(`${profile.name}-${cycle}-mutated`);
      await page.locator('#backpackButton').click();
      await page.waitForFunction(()=>!document.querySelector('#backpackPanel')?.classList.contains('open'));
      await previewSample(`${profile.name}-${cycle}-closed`);await assertWorldFrame(`${profile.name}-${cycle}-world`);
      if(cycle===0)await page.screenshot({path:`artifacts/11520-visual-qa/11520-preview-${profile.name}-world.png`,fullPage:false});
      await page.locator('#worldItemPickup.show').click();
      await page.waitForFunction(()=>globalThis.__K11520_WORLD_ITEM_DROP__.drops.size===0&&globalThis.K11520Backpack.get().items.some(item=>item.itemId==='QA-CASH'&&item.qty===1),null,{timeout:3000});
    }
  }
  if(pageErrors.length)throw new Error(`PAGEERROR_AFTER_PREVIEW_STRESS:${pageErrors.join('|')}`);
  await fs.writeFile(previewReport,JSON.stringify({head:sourceHead,sourceFiles,status:'PASS',scope:'ACTUAL_INVENTORY_PREVIEW_BEFORE_SYNTHETIC_GALLERY',profiles,cycles:24,samples:previewSamples,pageErrors,consoleProblems,gpuMemoryOrFpsClaim:false},null,2)+'\n');
}catch(error){
  await page.screenshot({path:'artifacts/11520-visual-qa/11520-preview-failure.png',fullPage:false});
  await fs.writeFile(previewReport,JSON.stringify({head:sourceHead,sourceFiles,status:'FAIL',error:String(error),profiles,samples:previewSamples,pageErrors,consoleProblems},null,2)+'\n');throw error;
}
await page.setViewportSize({width:390,height:844});

const identity=await page.evaluate(async()=>{
  const THREE=await import('three');
  const {WORLD_ITEM_CONTEXTS,CASH_CUSTODY_BY_CONTEXT,createWorldItemVisual}=await import('/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/world-item-visual-runtime.mjs');
  const {createProceduralLifeBody,syncLifeVisual}=await import('/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/life-visual-runtime.mjs');
  const item={itemId:'QA-CASH',name:'KAIOS 現鈔',kind:'MATERIAL',qty:88,meta:{cargoKind:'CASH',unit:'KAIOS'}};
  const host=document.createElement('section');host.id='qaWorldItemIdentity';host.style.cssText='position:fixed;inset:0;z-index:100000;background:#071016;padding:10px;box-sizing:border-box;color:white;font:12px system-ui;overflow:hidden';
  const title=document.createElement('h2');title.textContent='11520 現鈔保管鏈 · 同一資產不同容器';title.style.cssText='font-size:15px;color:#f5d77c;text-align:center;margin:2px 0 8px';host.appendChild(title);
  const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(2,1fr);gap:7px';host.appendChild(grid);
  const keys=[],custodyTypes=[];
  for(const context of WORLD_ITEM_CONTEXTS){
    const canvas=document.createElement('canvas');canvas.width=150;canvas.height=130;
    const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setSize(150,130,false);renderer.setPixelRatio(1);renderer.setClearColor(0x0a1720,1);
    const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xffffff,0x26313c,2.2));const key=new THREE.DirectionalLight(0xffffff,2.6);key.position.set(2.5,3,2);scene.add(key);
    const visual=createWorldItemVisual(THREE,item,{context,scale:1});visual.root.position.set(0,0,0);visual.root.rotation.y=.62;scene.add(visual.root);
    const camera=new THREE.PerspectiveCamera(34,150/130,.01,20);camera.position.set(1.9,1.35,2.45);camera.lookAt(0,0,0);
    renderer.render(scene,camera);renderer.getContext().finish();renderer.render(scene,camera);
    keys.push(visual.identityKey);custodyTypes.push(visual.custody.custodyType);
    const card=document.createElement('article');card.style.cssText='border:1px solid #ffffff2b;border-radius:10px;background:#0a1720;padding:5px;text-align:center';
    canvas.style.cssText='width:100%;height:130px;object-fit:contain';card.appendChild(canvas);
    const b=document.createElement('b');b.textContent=context;b.style.cssText='display:block;color:#d8e8ef;margin-top:2px;font-size:10px';card.appendChild(b);
    const small=document.createElement('small');small.textContent=`${visual.descriptor.shape} inside ${visual.custody.custodyType}`;small.style.cssText='display:block;color:#7fa5b5;margin-top:1px;font-size:8px';card.appendChild(small);grid.appendChild(card);
  }

  const antCanvas=document.createElement('canvas');antCanvas.width=350;antCanvas.height=180;
  const antRenderer=new THREE.WebGLRenderer({canvas:antCanvas,antialias:true,alpha:false,preserveDrawingBuffer:true});antRenderer.setSize(350,180,false);antRenderer.setPixelRatio(1);antRenderer.setClearColor(0x0a1720,1);
  const antScene=new THREE.Scene();antScene.add(new THREE.HemisphereLight(0xffffff,0x26313c,2.4));const antKey=new THREE.DirectionalLight(0xffffff,2.6);antKey.position.set(3,5,4);antScene.add(antKey);
  const ant=createProceduralLifeBody(THREE,{species:'DIGITAL_ANT',name:'Digital Ant QA',scale:1});antScene.add(ant);
  const transit={lifeId:'LIFE-DIGITAL-ANT-QA',species:'DIGITAL_ANT',state:'OBSERVE',x:0,y:0,z:0,cargo:{cargoId:'QA-CASH',amount:88,unit:'KAIOS'},mission:{status:'IN_TRANSIT'},marketLife:{lifestyle:{action:'WORK'}}};
  syncLifeVisual(ant,transit);const cargo=ant.getObjectByName('LIFE_STATUS_CARGO');const transitIdentity=cargo.userData.cargoIdentityKey,transitShape=cargo.userData.itemShape,transitContext=cargo.userData.cargoContext,transitCustody=cargo.userData.custodyType;
  const antCamera=new THREE.PerspectiveCamera(38,350/180,.01,20);antCamera.position.set(2.5,1.65,3.6);antCamera.lookAt(0,.8,0);antRenderer.render(antScene,antCamera);antRenderer.getContext().finish();antRenderer.render(antScene,antCamera);
  const antCard=document.createElement('article');antCard.style.cssText='grid-column:1/-1;border:1px solid #68e4ff55;border-radius:10px;background:#0a1720;padding:5px;text-align:center';antCanvas.style.cssText='width:100%;height:180px;object-fit:contain';antCard.appendChild(antCanvas);const antLabel=document.createElement('b');antLabel.textContent=`LIVE ANT · ${transitCustody} · inner ${transitShape}`;antLabel.style.cssText='display:block;color:#68e4ff;font-size:10px';antCard.appendChild(antLabel);grid.appendChild(antCard);
  const waiting={...transit,mission:{status:'ARRIVED_AWAITING_RECEIPT'}};syncLifeVisual(ant,waiting);const unloadIdentity=cargo.userData.cargoIdentityKey,unloadShape=cargo.userData.itemShape,unloadContext=cargo.userData.cargoContext,unloadCustody=cargo.userData.custodyType;
  document.body.appendChild(host);
  return{keys,custodyTypes,expectedCustody:WORLD_ITEM_CONTEXTS.map(x=>CASH_CUSTODY_BY_CONTEXT[x]),contexts:[...WORLD_ITEM_CONTEXTS],transitIdentity,unloadIdentity,transitShape,unloadShape,transitContext,unloadContext,transitCustody,unloadCustody};
});
if(new Set(identity.keys).size!==1)throw new Error(`WORLD_ITEM_IDENTITY_DRIFT:${identity.keys.join(',')}`);
if(identity.contexts.length!==4)throw new Error('WORLD_ITEM_CONTEXTS_INCOMPLETE');
if(JSON.stringify(identity.custodyTypes)!==JSON.stringify(identity.expectedCustody))throw new Error(`CASH_CUSTODY_CHAIN_WRONG:${identity.custodyTypes.join(',')}`);
if(identity.transitIdentity!==identity.unloadIdentity)throw new Error(`LIVE_CARGO_IDENTITY_DRIFT:${identity.transitIdentity}!=${identity.unloadIdentity}`);
if(identity.transitShape!=='CASH_BUNDLE'||identity.unloadShape!=='CASH_BUNDLE')throw new Error('LIVE_CARGO_SHAPE_NOT_CANONICAL');
if(identity.transitContext!=='ANT_CARGO'||identity.unloadContext!=='ATM_UNLOAD')throw new Error(`LIVE_CARGO_CONTEXT_WRONG:${identity.transitContext}/${identity.unloadContext}`);
if(identity.transitCustody!=='ARMORED_CASH_CASE'||identity.unloadCustody!=='ATM_CASSETTE')throw new Error(`LIVE_CASH_CUSTODY_WRONG:${identity.transitCustody}/${identity.unloadCustody}`);
await page.waitForTimeout(250);
await page.screenshot({path:worldOut,fullPage:false});
if(pageErrors.length)throw new Error(`PAGEERROR_AFTER_ITEM_GALLERY:${pageErrors.join('|')}`);
console.log(`[11520 ITEM 3D QA] PASS shapes=${shapes.join(',')} screenshot=${out}`);
console.log(`[11520 LIVE WORLD DROP QA] PASS identity=${liveDrop.identityKey} custody=${liveDrop.custodyType} pickup=PASS screenshot=${dropOut}`);
console.log(`[11520 CASH CUSTODY QA] PASS ${identity.custodyTypes.join('->')} live=${identity.transitCustody}->${identity.unloadCustody} screenshot=${worldOut}`);
console.log(`[11520 PREVIEW LIFETIME QA] PASS head=${sourceHead} cycles=24 profiles=6 contexts=2 report=${previewReport}`);
}catch(error){
  await page.screenshot({path:'artifacts/11520-visual-qa/11520-preview-failure.png',fullPage:false});
  await fs.writeFile(previewReport,JSON.stringify({head:sourceHead,sourceFiles,status:'FAIL',error:String(error),samples:previewSamples,pageErrors,consoleProblems},null,2)+'\n');throw error;
}finally{await browser.close()}
