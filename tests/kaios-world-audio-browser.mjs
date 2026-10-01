// Real browser: shared audio/return and canonical Heart mobile HUD regression.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const BASE=(process.env.KAIOS_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const OUT='artifacts/kaios-portal-qa';await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=user-gesture-required']});
const reports=[];
try{for(const id of ['12345','16888'])for(const [width,height]of [[390,844],[844,390]]){
 const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),page=await context.newPage();
 const errors=[],commercialRequests=[];page.on('pageerror',e=>errors.push(String(e.stack||e)));page.on('request',r=>{if(/\/music\/.*(?:\.mp3|playlist\.json)/i.test(r.url()))commercialRequests.push(r.url());});
 await page.addInitScript(()=>{const Real=window.AudioContext||window.webkitAudioContext;window.__qaAudioContexts=[];window.__qaAnalysers=[];const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(destination,...args){const result=connect.call(this,destination,...args);if(destination===this.context.destination){const analyser=this.context.createAnalyser();connect.call(this,analyser);window.__qaAnalysers.push(analyser);}return result;};if(Real){window.AudioContext=class extends Real{constructor(...args){super(...args);window.__qaAudioContexts.push(this);}};window.webkitAudioContext=window.AudioContext;}});
 await page.goto(BASE+`/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/${id}/index.html`,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.KAIOS_AUDIO_CONTROL,{timeout:45000});
 await page.waitForTimeout(2500); // Legacy optional visual modules settle after DOMContentLoaded.
 const read=()=>page.evaluate(()=>window.KAIOS_AUDIO.snapshot());
 assert.equal((await read()).contextState,'NOT_CREATED');assert.equal((await read()).world,id);
 await page.screenshot({path:`${OUT}/world-${id}-${width}x${height}.png`});
 await page.locator('.nav-music').tap({timeout:15000});
 await page.waitForTimeout(400);
 assert.equal((await read()).musicPlaying,true,'FIRST TAP must enable audible music, not only open settings');
 await page.locator('.nav-music').tap();
 await page.locator('.kaios-audio-panel').waitFor({state:'visible'});
 await page.waitForFunction(()=>window.KAIOS_AUDIO.snapshot().musicPlaying);
 assert.equal(await page.evaluate(()=>window.__qaAudioContexts.length),1,'single AudioContext per world');
 assert.equal((await read()).activeMusicLayers,1);
 const signal=await page.evaluate(async()=>{let peak=0,rms=0;for(let i=0;i<30;i++){for(const a of __qaAnalysers){const values=new Float32Array(a.fftSize);a.getFloatTimeDomainData(values);let sum=0;for(const v of values){peak=Math.max(peak,Math.abs(v));sum+=v*v;}rms=Math.max(rms,Math.sqrt(sum/values.length));}await new Promise(r=>setTimeout(r,100));}return{peak,rms};});
 assert.ok(signal.rms>.008&&signal.peak>.02&&signal.peak<.95,'destination signal: audible digital headroom, not just scheduler state');
 assert.equal(await page.locator('audio').evaluateAll(nodes=>nodes.filter(n=>!n.paused).length),0,'legacy HTML media must not play alongside shared synth');
 await page.screenshot({path:`${OUT}/world-${id}-audio-${width}x${height}.png`});
 await page.locator('[data-audio-action=mute]').click();assert.equal((await read()).settings.muted,true);assert.equal((await read()).activeMusicLayers,0);
 await page.getByRole('button',{name:'關閉設定',exact:true}).click();
 const home=page.locator('[data-kaios-return=PORTAL]');assert.equal(await home.count(),1);assert.equal(new URL(await home.getAttribute('href'),page.url()).href,BASE+'/');
 await home.click();await page.waitForURL(BASE+'/');await page.locator('#primaryPlay').waitFor();
 const state=await page.evaluate(async()=>{const m=await import('./assets/kaios-audio.mjs');return m.getKaiosAudio().snapshot();});assert.equal(state.settings.muted,true);assert.equal(state.contextState,'NOT_CREATED');
 assert.deepEqual(commercialRequests,[],'no unlicensed legacy song downloads');
 assert.ok(errors.every(e=>!e.includes('kaios-audio')&&!e.includes('kaios-world-audio')),'shared audio errors');
 reports.push({id,width,height,audio:'PASS',signal,returnPortal:'PASS',commercialRequests:0,legacyPageErrors:errors});await context.close();
}
for(const [width,height] of [[360,844],[390,844],[412,844],[432,844],[480,844],[844,390]]){
 const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e.stack||e)));
 const shot=name=>page.screenshot({path:`${OUT}/heart-${width}-${name}.png`});
 const geometry=()=>page.evaluate(()=>['#universe-nav','.warp-engine','#kgen-heart-toggle','#move-joystick-wrap','.resource-bars','.footer-terminal'].map(s=>document.querySelector(s).getBoundingClientRect().toJSON()));
 const hit=async selector=>{
  const result=await page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect(),target=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{w:r.width,h:r.height,inView:r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,hit:el===target||el.contains(target)};});
  assert.ok(result.inView&&result.hit,`${selector}: ${JSON.stringify(result)}`);return result;
 };
 try{
  await page.goto(BASE+'/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/12345/index.html',{waitUntil:'domcontentloaded'});
  await page.locator('#kgen-land-panel-open').waitFor();await page.waitForTimeout(1600);
  assert.equal(await page.evaluate(()=>innerWidth),width,'mobile viewport must not be a scaled 980px desktop');
  for(const s of ['.nav-music','[data-kaios-return=PORTAL]','#kgen-land-panel-open','#kgen-land-info-panel-open']){const r=await hit(s);assert.ok(r.w>=44&&r.h>=44,'44px utility/land targets');}
  await hit('.warp-rail');await hit('#move-joystick-wrap');await shot('closed');
  const warp=await page.locator('.warp-engine').boundingBox(),readout=await page.locator('#warp-txt').boundingBox();
  assert.ok(readout.y>=warp.y&&readout.y+readout.height<=warp.y+warp.height+1,'Warp readout must remain inside its stacking region');
  const initial=await geometry();
  for(const s of ['#kgen-land-panel-open','#kgen-land-info-panel-open'])for(let cycle=0;cycle<2;cycle++){
   await page.locator(s).tap();assert.equal(await page.locator('#k12345-land-dialog').evaluate(el=>el.open),true);
   assert.deepEqual(await geometry(),initial,'land open cannot push HUD');await hit('.k12345-land-close');
   assert.equal(await page.locator('#kgen-land-panel .kgen-land-body').isVisible(),true,'not an empty overlay');
   assert.equal(await page.locator('#kgen-land-info-panel .kgen-land-info-body').isVisible(),true);
   assert.ok(await page.locator('.k12345-land-scroll').evaluate(el=>getComputedStyle(el).overflowY==='auto'));
   await shot(s.includes('info')?'land-info':'land-map');await page.locator('.k12345-land-scroll').evaluate(el=>el.scrollTop=el.scrollHeight);
   await page.locator('.k12345-land-close').tap();assert.deepEqual(await geometry(),initial,'land close cannot move HUD');
  }
  await page.locator('.nav-music').tap();await page.waitForFunction(()=>KAIOS_AUDIO.snapshot().musicPlaying);
  await page.locator('.nav-music').tap();await shot('audio');await page.getByRole('button',{name:'關閉設定',exact:true}).tap();
  await page.locator('#kgen-ai-toggle').tap();await shot('ai');await page.getByRole('button',{name:'關閉 AI 客服',exact:true}).tap();
  await page.locator('#kgen-v102-festival-panel h3').scrollIntoViewIfNeeded();await page.locator('#kgen-v102-festival-panel h3').tap();await shot('festival');await hit('#k12345-festival-close');await page.locator('#k12345-festival-close').tap();
  await page.locator('#kgen-heart-toggle').tap();await shot('heart');await hit('#kgen-heart-toggle');
  const heart=await page.locator('#kgen-heart-live-panel').boundingBox();assert.ok(heart.x>=0&&heart.y>=0&&heart.x+heart.width<=width+1&&heart.y+heart.height<=height+1,'Heart stays in viewport');
  await page.locator('#kgen-heart-toggle').tap();
  await page.evaluate(()=>document.getElementById('universe-nav').scrollTop=0);
  if(width===390){
   for(let cycle=0;cycle<3;cycle++)for(const size of [{width:844,height:390},{width:390,height:844}]){
    await page.setViewportSize(size);await page.waitForTimeout(120);await hit('.nav-music');await hit('[data-kaios-return=PORTAL]');await hit('#kgen-land-panel-open');
   }
   assert.deepEqual(await geometry(),initial,'rotation cannot accumulate offsets');
  }
  assert.equal(await page.locator('[data-kaios-return=PORTAL]').count(),1);
  assert.equal(new URL(await page.locator('[data-kaios-return=PORTAL]').getAttribute('href'),page.url()).href,BASE+'/');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await shot('final');
  // Known pre-existing optional CDN defect, not a blanket allow-list for application errors.
  assert.ok(errors.every(e=>e.includes('process is not defined')&&e.includes('@walletconnect/ethereum-provider@2.12.2')),'no new runtime errors');
  reports.push({id:'12345-mobile',width,height,landStable:'PASS',modalContent:'PASS',utilityTargets:'PASS',panels:'PASS',rotation:width===390?'PASS':'NOT_APPLICABLE',legacyPageErrors:errors});
 }catch(error){await shot('FAIL');throw error;}finally{await context.close();}
}
}finally{await fs.writeFile(`${OUT}/world-audio-report.json`,JSON.stringify(reports,null,2));await browser.close();console.log(JSON.stringify(reports));}
