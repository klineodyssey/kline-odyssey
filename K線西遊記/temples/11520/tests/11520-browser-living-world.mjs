import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const OUT='artifacts/11520-visual-qa';
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:4173/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(2200);
if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click().catch(()=>{});
await page.waitForTimeout(700);

await page.evaluate(async()=>{
  const src=await import('/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/market-life-source-runtime.mjs');
  const now=Date.now();
  src.publishMarketLifeSourceEvent({type:'SPAWN',sourceId:'QA-LIVING-WORLD',lifeId:'LIFE-QA-DIGITAL-ANT-VISUAL',name:'Digital Ant 運鈔員',species:'DIGITAL_ANT',intelligence:6,markets:['BTCUSDT'],capital:60,vitality:100,maxHp:100,attack:0,rewardKaios:0,speed:.012,positions:{},x:-1.3,y:0,z:2.2,strategy:'DELIVERY',cargo:{kind:'CASH',amount:18,unit:'KAIOS'},mission:{missionId:'QA-VISUAL-CASH-RUN',status:'IN_TRANSIT',destinationAtmId:'ATM-11520-001',quote:{net:5,freight:4,tip:1}},meta:{retirementReserve:12,targetRetirementReserve:100},at:now},{persistLocal:false,broadcast:false});
  src.publishMarketLifeSourceEvent({type:'SPAWN',sourceId:'QA-LIVING-WORLD',lifeId:'LIFE-QA-TREE-SELECTION',name:'花果山樹・選取檢核',species:'TREE',intelligence:1,markets:[],capital:0,vitality:100,maxHp:160,attack:0,rewardKaios:0,speed:0,positions:{},x:2.4,y:0,z:1.4,strategy:'WILD_ECOLOGY',meta:{jobs:[]},at:now+1},{persistLocal:false,broadcast:false});
});
await page.waitForFunction(()=>document.querySelector('#monsterList')?.textContent?.includes('Digital Ant 運鈔員'),null,{timeout:4000});
await page.waitForTimeout(1100);
assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));
assert.ok((await page.locator('#monsterList').textContent()).includes('WORK'),'Digital Ant should expose WORK lifestyle in living-world HUD');
await page.screenshot({path:`${OUT}/11520-living-world-digital-ant.png`,fullPage:true});

await page.waitForFunction(()=>globalThis.__K11520_WORLD_SELECTION_PROJECTION__?.lifeCanvasHitPoints?.('LIFE-QA-TREE-SELECTION').length>0,null,{timeout:15000});
await page.evaluate(()=>{globalThis.__K11520_QA_WORLD_TAP_ROUTES__=[];document.querySelector('#three')?.addEventListener('k11520:world-tap',e=>globalThis.__K11520_QA_WORLD_TAP_ROUTES__.push(e.detail||null))});
let pickedRoute=null,tapDiagnostic=null;
for(let attempt=0;attempt<24;attempt+=1){
  await page.evaluate(async()=>{
    const src=await import('/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/market-life-source-runtime.mjs');
    src.publishMarketLifeSourceEvent({type:'UPDATE',sourceId:'QA-LIVING-WORLD',lifeId:'LIFE-QA-TREE-SELECTION',name:'花果山樹・選取檢核',species:'TREE',intelligence:1,markets:[],capital:0,vitality:100,maxHp:160,attack:0,rewardKaios:0,speed:0,positions:{},x:2.4,y:0,z:1.4,strategy:'WILD_ECOLOGY',meta:{jobs:[]},at:Date.now()},{persistLocal:false,broadcast:false});
  });
  await page.waitForTimeout(34);
  const point=await page.evaluate(()=>{
    const canvas=document.querySelector('#three'),points=globalThis.__K11520_WORLD_SELECTION_PROJECTION__.lifeCanvasHitPoints('LIFE-QA-TREE-SELECTION');
    return points.find(p=>document.elementFromPoint(p.clientX,p.clientY)===canvas)||null;
  });
  if(!point){await page.waitForTimeout(60);continue}
  await page.evaluate(()=>{globalThis.__K11520_QA_WORLD_TAP_ROUTES__=[]});
  await page.mouse.move(point.clientX,point.clientY);
  await page.mouse.down();
  await page.waitForTimeout(45);
  await page.mouse.up();
  await page.waitForTimeout(140);
  tapDiagnostic=await page.evaluate(()=>({routes:structuredClone(globalThis.__K11520_QA_WORLD_TAP_ROUTES__||[]),selectedLifeId:document.querySelector('#selectedLifeHud')?.dataset.lifeId||null}));
  pickedRoute=tapDiagnostic.routes.at(-1)||null;
  if(pickedRoute?.route==='ENTITY'&&pickedRoute.entityType==='MONSTER'&&pickedRoute.entityId===point.entityId)break;
  pickedRoute=null;
  await page.evaluate(()=>globalThis.__K11520_XYZ_MAP_NAVIGATION__?.stop?.('selected-Life QA retry'));
}
assert.ok(pickedRoute,`a real Chromium pointer tap must route the target Life through the canonical MONSTER raycast: ${JSON.stringify(tapDiagnostic)}`);
await page.waitForFunction(()=>{const hud=document.getElementById('selectedLifeHud');return hud&&!hud.hidden&&hud.dataset.lifeId},{timeout:3000});
const picked=await page.locator('#selectedLifeHud').evaluate(hud=>({lifeId:hud.dataset.lifeId,text:hud.textContent||''}));
const selectedText=await page.locator('#selectedLifeHud').textContent();
assert.equal(selectedText,picked.text,'selected-Life HUD must remain stable after the canonical tap');
assert.ok(picked.lifeId&&picked.lifeId!=='NOT_ASSIGNED','selected Life HUD must expose LIFE_ID');
assert.equal(picked.lifeId,'LIFE-QA-TREE-SELECTION','selected Life HUD must expose the exact stable QA Life ID');
assert.match(selectedText,/HP \d+(?:\.\d+)? \/ \d+(?:\.\d+)?/,'selected Life HUD must show HP/MAX HP');
assert.match(selectedText,/XYZ -?\d+(?:\.\d+)?, -?\d+(?:\.\d+)?, -?\d+(?:\.\d+)?/,'selected Life HUD must show XYZ');
const selectedBox=await page.locator('#selectedLifeHud').boundingBox();
assert.ok(selectedBox,'selected Life HUD must have a rendered box');
assert.ok(selectedBox.x>=0&&selectedBox.y>=0&&selectedBox.x+selectedBox.width<=390&&selectedBox.y+selectedBox.height<=844,'selected Life HUD must remain fully inside 390x844 viewport');
await page.screenshot({path:`${OUT}/11520-selected-life-hud.png`,fullPage:true});
assert.deepEqual(errors,[],'page errors after selected-Life click: '+errors.join('\n'));

await browser.close();
console.log(`11520 Digital Ant living-world + targeted canonical 3D selected-Life HP/XYZ browser visual QA PASS (${picked.lifeId})`);
