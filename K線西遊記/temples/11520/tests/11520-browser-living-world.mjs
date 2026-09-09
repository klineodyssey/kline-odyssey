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
  src.publishMarketLifeSourceEvent({type:'SPAWN',sourceId:'QA-LIVING-WORLD',lifeId:'LIFE-QA-BULL-TRAVEL',name:'牛魔王・遊山中',species:'BULL_DEMON',intelligence:6,markets:['BTCUSDT','ETHUSDT'],capital:200,vitality:100,maxHp:260,attack:0,rewardKaios:0,speed:.008,positions:{},x:1.8,y:0,z:2.8,strategy:'HOLD',meta:{jobs:[]},at:now+1},{persistLocal:false,broadcast:false});
});
await page.waitForFunction(()=>document.querySelector('#monsterList')?.textContent?.includes('Digital Ant 運鈔員'),{timeout:4000});
await page.waitForTimeout(1100);
assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));
assert.ok((await page.locator('#monsterList').textContent()).includes('WORK'),'Digital Ant should expose WORK lifestyle in living-world HUD');
await page.screenshot({path:`${OUT}/11520-living-world-digital-ant.png`,fullPage:true});

// Targeted selected-Life acceptance: locate the exact 3D Bull Life in the rendered scene,
// project a visible mesh point to the real canvas, click it, and require the HUD to expose
// canonical identity + HP/MAX HP + XYZ + state at the 390x844 mobile viewport.
await page.waitForFunction(()=>{
  const canvas=[...document.querySelectorAll('canvas')].find(c=>c.__k11520Scene&&c.__k11520Camera);
  if(!canvas)return false;
  let found=false;
  canvas.__k11520Scene.traverse?.(o=>{if(o?.userData?.lifeId==='LIFE-QA-BULL-TRAVEL')found=true});
  return found;
},{timeout:5000});
const pick=await page.evaluate(()=>{
  const canvas=[...document.querySelectorAll('canvas')].find(c=>c.__k11520Scene&&c.__k11520Camera);
  if(!canvas)return null;
  let root=null;
  canvas.__k11520Scene.traverse?.(o=>{if(!root&&o?.userData?.lifeId==='LIFE-QA-BULL-TRAVEL')root=o});
  if(!root)return null;
  let mesh=null;
  root.traverse?.(o=>{if(!mesh&&o?.isMesh&&o.visible!==false)mesh=o});
  const target=mesh||root;
  const world=target.position.clone();
  target.getWorldPosition(world);
  world.project(canvas.__k11520Camera);
  const rect=canvas.getBoundingClientRect();
  return {x:rect.left+(world.x+1)*rect.width/2,y:rect.top+(1-world.y)*rect.height/2,w:rect.width,h:rect.height};
});
assert.ok(pick,'target 3D Life projection must be available');
assert.ok(pick.x>=0&&pick.x<=390&&pick.y>=0&&pick.y<=844,`projected Life must be in viewport: ${JSON.stringify(pick)}`);
await page.mouse.click(pick.x,pick.y);
await page.locator('#selectedLifeHud').waitFor({state:'visible',timeout:3000});
const selectedText=await page.locator('#selectedLifeHud').textContent();
assert.match(selectedText,/牛魔王・遊山中 · BULL_DEMON/);
assert.match(selectedText,/HP 100 \/ 260/);
assert.match(selectedText,/XYZ 1\.8, 0, 2\.8/);
assert.match(selectedText,/LIFE-QA-BULL-TRAVEL/);
const selectedBox=await page.locator('#selectedLifeHud').boundingBox();
assert.ok(selectedBox,'selected Life HUD must have a rendered box');
assert.ok(selectedBox.x>=0&&selectedBox.y>=0&&selectedBox.x+selectedBox.width<=390&&selectedBox.y+selectedBox.height<=844,'selected Life HUD must remain fully inside 390x844 viewport');
await page.screenshot({path:`${OUT}/11520-selected-life-hud.png`,fullPage:true});
assert.deepEqual(errors,[],'page errors after selected-Life click: '+errors.join('\n'));

await browser.close();
console.log('11520 Digital Ant living-world + targeted 3D selected-Life HP/XYZ browser visual QA PASS');
