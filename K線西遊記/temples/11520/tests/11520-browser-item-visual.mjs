import {chromium} from 'playwright';
import fs from 'node:fs/promises';

const out='artifacts/11520-visual-qa/11520-backpack-item-3d.png';
const worldOut='artifacts/11520-visual-qa/11520-world-item-identity-390x844.png';
await fs.mkdir('artifacts/11520-visual-qa',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
await page.addInitScript(()=>{
  localStorage.setItem('11520.backpack.v1',JSON.stringify({version:'11520-BACKPACK-V1',ownerId:'QA',capacitySlots:24,capacityWeight:120,updatedAt:Date.now(),items:[
    {itemId:'QA-TREASURE',name:'火眼晶石',kind:'TREASURE',species:null,qty:1,weightEach:.5,stackable:true,treasureClass:'RARE',lifeId:null,meta:{}},
    {itemId:'QA-KGEN',name:'KGEN 貨筒',kind:'MATERIAL',species:null,qty:2,weightEach:1,stackable:true,treasureClass:null,lifeId:null,meta:{cargoKind:'KGEN'}},
    {itemId:'QA-CASH',name:'KAIOS 現鈔',kind:'MATERIAL',species:null,qty:1,weightEach:1,stackable:true,treasureClass:null,lifeId:null,meta:{cargoKind:'CASH',unit:'KAIOS'}},
    {itemId:'QA-FOOD',name:'蟠桃',kind:'FOOD',species:null,qty:3,weightEach:.2,stackable:true,treasureClass:null,lifeId:null,meta:{}},
    {itemId:'QA-COW',name:'花果山牛',kind:'LIVING_CARGO',species:'COW',qty:1,weightEach:1,stackable:false,treasureClass:null,lifeId:'LIFE-QA-COW',meta:{}},
  ]}));
});
await page.goto('http://127.0.0.1:4173/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html',{waitUntil:'networkidle',timeout:60000});
await page.waitForSelector('#backpackButton',{timeout:30000});
await page.click('#backpackButton');
await page.waitForSelector('#backpackPanel.open');
await page.waitForFunction(()=>document.querySelectorAll('canvas.bp3d[data-item3d="ready"]').length>=5,null,{timeout:30000});
const shapes=await page.$$eval('canvas.bp3d[data-item3d="ready"]',els=>els.map(e=>e.dataset.itemShape));
for(const expected of ['CRYSTAL','KGEN_CYLINDER','CASH_BUNDLE','FOOD','LIFE_CRATE'])if(!shapes.includes(expected))throw new Error(`MISSING_3D_ITEM_SHAPE:${expected}`);
if(pageErrors.length)throw new Error(`PAGEERROR:${pageErrors.join('|')}`);
await page.screenshot({path:out,fullPage:false});

const identity=await page.evaluate(async()=>{
  const THREE=await import('three');
  const {WORLD_ITEM_CONTEXTS,createWorldItemVisual}=await import('/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/world-item-visual-runtime.mjs');
  const item={itemId:'QA-CASH',name:'KAIOS 現鈔',kind:'MATERIAL',qty:88,meta:{cargoKind:'CASH',unit:'KAIOS'}};
  const host=document.createElement('section');host.id='qaWorldItemIdentity';host.style.cssText='position:fixed;inset:0;z-index:100000;background:#071016;padding:12px;box-sizing:border-box;color:white;font:12px system-ui';
  const title=document.createElement('h2');title.textContent='11520 同一物品・四種世界狀態';title.style.cssText='font-size:17px;color:#f5d77c;text-align:center;margin:4px 0 12px';host.appendChild(title);
  const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(2,1fr);gap:10px';host.appendChild(grid);
  const keys=[];
  for(const context of WORLD_ITEM_CONTEXTS){
    const canvas=document.createElement('canvas');canvas.width=160;canvas.height=160;
    const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setSize(160,160,false);renderer.setPixelRatio(1);renderer.setClearColor(0x0a1720,1);
    const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xffffff,0x26313c,2.2));const key=new THREE.DirectionalLight(0xffffff,2.6);key.position.set(2.5,3,2);scene.add(key);
    const visual=createWorldItemVisual(THREE,item,{context,scale:1});visual.root.position.set(0,0,0);visual.root.rotation.y=.62;scene.add(visual.root);
    const camera=new THREE.PerspectiveCamera(34,1,.01,20);camera.position.set(1.7,1.25,2.15);camera.lookAt(0,0,0);
    renderer.render(scene,camera);renderer.getContext().finish();renderer.render(scene,camera);
    keys.push(visual.identityKey);
    const card=document.createElement('article');card.style.cssText='border:1px solid #ffffff2b;border-radius:12px;background:#0a1720;padding:7px;text-align:center';
    canvas.style.cssText='width:100%;height:160px;object-fit:contain';card.appendChild(canvas);
    const b=document.createElement('b');b.textContent=context;b.style.cssText='display:block;color:#d8e8ef;margin-top:4px';card.appendChild(b);
    const small=document.createElement('small');small.textContent=`${visual.descriptor.shape} · ${visual.descriptor.label}`;small.style.cssText='display:block;color:#7fa5b5;margin-top:2px';card.appendChild(small);grid.appendChild(card);
  }
  document.body.appendChild(host);
  return{keys,contexts:[...WORLD_ITEM_CONTEXTS]};
});
if(new Set(identity.keys).size!==1)throw new Error(`WORLD_ITEM_IDENTITY_DRIFT:${identity.keys.join(',')}`);
if(identity.contexts.length!==4)throw new Error('WORLD_ITEM_CONTEXTS_INCOMPLETE');
await page.waitForTimeout(250);
await page.screenshot({path:worldOut,fullPage:false});
console.log(`[11520 ITEM 3D QA] PASS shapes=${shapes.join(',')} screenshot=${out}`);
console.log(`[11520 WORLD ITEM IDENTITY QA] PASS contexts=${identity.contexts.join(',')} screenshot=${worldOut}`);
await browser.close();