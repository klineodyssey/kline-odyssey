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

// Targeted selected-Life acceptance: use the real rendered Life pool rather than the list.
// Dynamic source events may queue when no spare 3D slot exists, so this gate deliberately
// proves that an actually rendered canonical Life body is tappable and exposes its own metadata.
await page.waitForFunction(()=>{
  const canvas=[...document.querySelectorAll('canvas')].find(c=>c.__k11520Scene&&c.__k11520Camera);
  if(!canvas)return false;
  let found=false;
  canvas.__k11520Scene.traverse?.(o=>{if(o?.userData?.lifeId&&Number.isFinite(Number(o.userData.maxHp)))found=true});
  return found;
},{timeout:5000});
const candidates=await page.evaluate(()=>{
  const canvas=[...document.querySelectorAll('canvas')].find(c=>c.__k11520Scene&&c.__k11520Camera);
  if(!canvas)return [];
  const rect=canvas.getBoundingClientRect(), seen=new Set(), out=[];
  canvas.__k11520Scene.traverse?.(root=>{
    const d=root?.userData;if(!d?.lifeId||!Number.isFinite(Number(d.maxHp))||seen.has(d.lifeId)||root.visible===false)return;
    seen.add(d.lifeId);
    let mesh=null;root.traverse?.(o=>{if(!mesh&&o?.isMesh&&o.visible!==false)mesh=o});
    const target=mesh||root,world=target.position.clone();target.getWorldPosition(world);world.project(canvas.__k11520Camera);
    const x=rect.left+(world.x+1)*rect.width/2,y=rect.top+(1-world.y)*rect.height/2;
    if(x>=4&&x<=386&&y>=4&&y<=840)out.push({x,y,lifeId:d.lifeId,name:d.displayName||d.name||d.species||'生命',species:d.species||'LIFE',hp:Number(d.hp??d.vitality??0),maxHp:Number(d.maxHp),wx:Number(d.x??root.position?.x??0),wy:Number(d.y??root.position?.y??0),wz:Number(d.z??root.position?.z??0),state:String(d.state||d.combatState||'ALIVE').toUpperCase()});
  });
  return out;
});
assert.ok(candidates.length>0,'at least one rendered 3D Life must project inside 390x844 viewport');
let picked=null;
for(const c of candidates){
  await page.mouse.click(c.x,c.y);
  await page.waitForTimeout(180);
  const visible=await page.locator('#selectedLifeHud').isVisible().catch(()=>false);
  const lifeId=visible?await page.locator('#selectedLifeHud').getAttribute('data-life-id'):null;
  if(visible&&lifeId===c.lifeId){picked=c;break}
}
assert.ok(picked,`a projected rendered Life must be selectable; candidates=${candidates.map(c=>c.lifeId).join(',')}`);
const selectedText=await page.locator('#selectedLifeHud').textContent();
assert.ok(selectedText.includes(picked.name),'selected Life HUD must show selected name');
assert.ok(selectedText.includes(picked.species),'selected Life HUD must show selected species');
assert.ok(selectedText.includes(picked.lifeId),'selected Life HUD must show LIFE_ID');
assert.match(selectedText,/HP \d+(?:\.\d+)? \/ \d+(?:\.\d+)?/,'selected Life HUD must show HP/MAX HP');
assert.match(selectedText,/XYZ -?\d+(?:\.\d+)?, -?\d+(?:\.\d+)?, -?\d+(?:\.\d+)?/,'selected Life HUD must show XYZ');
assert.ok(selectedText.includes(picked.state),'selected Life HUD must show lifecycle/combat state');
const selectedBox=await page.locator('#selectedLifeHud').boundingBox();
assert.ok(selectedBox,'selected Life HUD must have a rendered box');
assert.ok(selectedBox.x>=0&&selectedBox.y>=0&&selectedBox.x+selectedBox.width<=390&&selectedBox.y+selectedBox.height<=844,'selected Life HUD must remain fully inside 390x844 viewport');
await page.screenshot({path:`${OUT}/11520-selected-life-hud.png`,fullPage:true});
assert.deepEqual(errors,[],'page errors after selected-Life click: '+errors.join('\n'));

await browser.close();
console.log(`11520 Digital Ant living-world + targeted 3D selected-Life HP/XYZ browser visual QA PASS (${picked.lifeId})`);
