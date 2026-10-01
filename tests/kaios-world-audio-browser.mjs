// Real browser, legacy world scripts unchanged except shared audio/return bridge.
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
}}finally{await fs.writeFile(`${OUT}/world-audio-report.json`,JSON.stringify(reports,null,2));await browser.close();console.log(JSON.stringify(reports));}
