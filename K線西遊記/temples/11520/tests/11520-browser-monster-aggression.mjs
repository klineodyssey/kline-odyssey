import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const OUT='artifacts/11520-visual-qa';
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:4173/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1900);
if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click({timeout:1500}).catch(()=>{});
await page.locator('#intro11520').waitFor({state:'hidden',timeout:3000}).catch(()=>{});
await page.waitForFunction(()=>Boolean(globalThis.__K11520_WORLD_COORDS__?.physical),null,{timeout:10000});
assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));
const initialHp=Number((await page.locator('#hp').textContent()||'0').trim());
assert.ok(initialHp>0,'player HP must start positive');
await page.evaluate(()=>{
  window.dispatchEvent(new CustomEvent('11520:market-life-source',{detail:{
    type:'SPAWN',sourceId:'QA-BROWSER-MONSTER',lifeId:'LIFE-QA-BROWSER-BULL',name:'QA 攻擊牛魔王',species:'BULL_DEMON',
    intelligence:4,markets:['BTCUSDT'],capital:100,vitality:100,maxHp:100,attack:7,rewardKaios:0,speed:.01,positions:{},x:1,y:0,z:0,
    strategy:'QA_HOSTILE_MONSTER',meta:{sourceClass:'QA_BROWSER',role:'MONSTER'}
  }}));
});
await page.waitForFunction(()=>document.querySelector('#monsterList')?.textContent?.includes('QA 攻擊牛魔王'),null,{timeout:5000});
await page.waitForFunction(start=>Number((document.querySelector('#hp')?.textContent||'0').trim())<start,initialHp,{timeout:5000});
const damagedHp=Number((await page.locator('#hp').textContent()||'0').trim());
assert.ok(damagedHp<initialHp,`monster must actually damage player HP: ${initialHp} -> ${damagedHp}`);
assert.ok(initialHp-damagedHp>=7,'damage must reflect hostile monster attack power');
await page.screenshot({path:`${OUT}/11520-mobile-monster-attack-hp.png`,fullPage:true});
await page.evaluate(()=>window.dispatchEvent(new CustomEvent('11520:market-life-source',{detail:{type:'DESPAWN',sourceId:'QA-BROWSER-MONSTER',lifeId:'LIFE-QA-BROWSER-BULL',reason:'QA_DONE'}})));
await page.waitForTimeout(250);
assert.deepEqual(errors,[],'page errors after monster attack: '+errors.join('\n'));
await browser.close();
console.log(`11520 monster browser QA PASS: hostile monster reduced HP ${initialHp} -> ${damagedHp}`);
