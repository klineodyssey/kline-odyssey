import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const base=process.env.K11520_BASE_URL||'http://127.0.0.1:4173',out='artifacts/11520-audio-world-qa';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const report={scope:'LOCAL_BROWSER_NO_TRANSACTION',rows:[],result:'RUNNING'};
async function ready(page){await page.waitForFunction(()=>globalThis.__K11520_PLAYER_LIFE__?.snapshot().player&&globalThis.__K11520_BGM__,null,{timeout:60000});if(await page.locator('#enter11520').isVisible()){try{await page.locator('#enter11520').click({timeout:1500})}catch(e){if(await page.locator('#intro11520').isVisible())throw e}}await page.locator('#intro11520').waitFor({state:'hidden'});await page.waitForFunction(()=>document.querySelector('#gameModeToggle')?.dataset.k11520Handlers==='1');}
async function life(page){if(!await page.locator('html').evaluate(el=>el.classList.contains('k11520UtilitiesOpen')))await page.locator('#k11520UtilityMaster').click();if(!await page.locator('#k11520UiSettings').evaluate(el=>el.classList.contains('open')))await page.locator('#gameModeToggle').click();await page.locator('#playerLifeOpen').click();}
const audio=p=>p.evaluate(async()=>{const {getKaiosAudio}=await import('/assets/kaios-audio.mjs');return getKaiosAudio().snapshot()});
try{
 for(const [width,height]of [[390,844],[844,390]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true});
  await context.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',async route=>{const prefix='https://cdn.jsdelivr.net/npm/three@0.180.0/';let body=await fs.readFile('node_modules/three/'+route.request().url().slice(prefix.length),'utf8');body=body.replaceAll("from 'three'",`from '${prefix}build/three.module.js'`).replaceAll('from "three"',`from "${prefix}build/three.module.js"`);await route.fulfill({status:200,contentType:'text/javascript',body});});
  const page=await context.newPage(),row={width,height,errors:[]};report.rows.push(row);page.on('pageerror',e=>row.errors.push(String(e)));page.setDefaultTimeout(20000);
  await page.goto(base+'/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html');await ready(page);
  // Real controller gesture, not a programmatic unlock or synthetic award.
  await page.locator('#joy').click({position:{x:22,y:35}});await page.waitForFunction(()=>__K11520_BGM__.playing);
  assert.equal((await audio(page)).activeMusicLayers,1);
  await page.locator('#k11520UtilityMaster').click();await page.locator('#bgmButton').click();
  const panel=page.locator('.kaios-audio-panel');await panel.waitFor({state:'visible'});
  assert.equal(await page.locator('.kaios-audio-settings:visible').count(),0,'no second permanent settings button');
  const box=await panel.boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1);
  await page.screenshot({path:`${out}/${width}-audio-settings.png`});
  await panel.locator('[data-audio-action="mute"]').click();assert.equal((await audio(page)).settings.muted,true);
  await panel.locator('[data-audio-volume="voice"]').fill('25');assert.equal((await audio(page)).settings.voice,.25);
  await panel.getByRole('button',{name:'關閉設定'}).click();await life(page);await page.locator('#playerLifeBuild').click();
  await page.waitForFunction(()=>__K11520_WORLD_AUDIO__.snapshot().events.some(e=>e.event==='HOME_BUILD'));
  const homeEvents=await page.evaluate(()=>__K11520_WORLD_AUDIO__.snapshot().events.filter(e=>e.event==='HOME_BUILD').length);assert.equal(homeEvents,1);
  assert.equal((await audio(page)).settings.muted,true,'visual home feedback must not unmute');
  await page.waitForTimeout(250);assert.equal(await page.locator('#toast').evaluate(el=>getComputedStyle(el).opacity), '1');
  await page.screenshot({path:`${out}/${width}-home-muted-feedback.png`});
  await page.reload();await ready(page);assert.equal((await audio(page)).settings.muted,true);assert.equal((await audio(page)).settings.voice,.25);
  await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>__K11520_WORLD_AUDIO__.snapshot().events.some(e=>e.event==='HOME_BUILD')),false,'reload must not replay house creation');
  row.audio=await audio(page);row.result='PASS';assert.deepEqual(row.errors,[]);await context.close();
 }
 report.result='PASS';
}catch(error){report.result='FAIL';report.error=String(error.stack||error);for(const context of browser.contexts())for(const page of context.pages())await page.screenshot({path:out+'/failure.png'}).catch(()=>{});process.exitCode=1;}finally{await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report));}
