// First-party PCM + real WebAudio integration, no wallet or economic writes.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.KAIOS_BASE_URL||'http://127.0.0.1:4173',out='artifacts/kaios-ost-qa';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=user-gesture-required']});
const report={sourceSha:process.env.KAIOS_SOURCE_SHA||'WORKTREE',tracks:[],states:[],broadcasts:0,commercialRequests:[],result:'RUNNING'};
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
const requests=[];page.on('request',r=>{if(r.url().includes('/kaios-ost/'))requests.push(r.url());if(/\/music\/|playlist\.json|\.mp3/i.test(r.url()))report.commercialRequests.push(r.url());});
await page.addInitScript(()=>{
 const Real=AudioContext;window.__contexts=[];window.__analysers=[];
 window.AudioContext=class extends Real{constructor(...args){super(...args);__contexts.push(this);}};
 const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(destination,...args){const result=connect.call(this,destination,...args);if(destination===this.context.destination){const a=this.context.createAnalyser();connect.call(this,a);__analysers.push(a);}return result;};
});
const read=()=>page.evaluate(()=>audio.snapshot());
const signal=()=>page.evaluate(async()=>{let peak=0,rms=0;for(let i=0;i<12;i++){for(const a of __analysers){const v=new Float32Array(a.fftSize);a.getFloatTimeDomainData(v);peak=Math.max(peak,...v.map(Math.abs));rms=Math.max(rms,Math.sqrt(v.reduce((a,b)=>a+b*b,0)/v.length));}await new Promise(r=>setTimeout(r,80));}return{peak,rms};});
try{
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});await page.waitForSelector('[data-kaios-audio-toggle]');
 await page.evaluate(async()=>{const m=await import('/assets/kaios-audio.mjs');window.audio=m.getKaiosAudio();window.ost=m.OST_TRACKS;window.mapping=m.OST_STATE_TRACKS;audio.setWorld('11520');audio.setMusicEnabled(true);});
 assert.equal(requests.length,0,'no OST download or context before gesture');assert.equal(await page.evaluate(()=>__contexts.length),0);
 await page.locator('[data-kaios-audio-toggle]').tap();await page.waitForFunction(()=>audio.snapshot().trackId==='JOURNEY_THEME'&&audio.snapshot().musicPlaying);
 assert.equal(requests.length,1,'selected track only');
 for(const state of ['EXPLORE','ENCOUNTER','COMBAT','BOSS','BOSS_LOW_HP','VICTORY','RARE_LOOT','LEVEL_UP','GA600_LEVEL_UP','HOME']){
  await page.evaluate(s=>audio.setMusicState(s),state);await page.waitForFunction(s=>audio.snapshot().trackId===mapping[s],state);await page.waitForTimeout(500);
  const s=await read(),v=await signal();assert(v.rms>.003&&v.peak<.95,state+' nonzero signal, no clipping');assert.equal(s.bufferSources,1);assert.equal(s.activeMusicLayers,1);assert(s.cachedTracks<=3);report.states.push({state,track:s.trackId,signal:v});
 }
 await page.evaluate(()=>audio.play('BOSS_SPAWN'));assert.equal((await read()).duckFactor,.38);await page.waitForTimeout(1200);assert.equal((await read()).duckFactor,1);
 await page.evaluate(()=>audio.setMuted(true));await page.waitForTimeout(150);assert((await signal()).peak<.0001);assert.equal((await read()).bufferSources,0);
 await page.evaluate(()=>audio.setMusicState('BOSS'));assert.equal((await read()).musicPlaying,false);await page.evaluate(()=>audio.setMuted(false));await page.waitForFunction(()=>audio.snapshot().musicPlaying);
 await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide')));await page.waitForFunction(()=>audio.snapshot().contextState==='suspended');assert.equal((await read()).bufferSources,0);
 await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await page.waitForFunction(()=>audio.snapshot().musicPlaying);assert.equal(await page.evaluate(()=>__contexts.length),1);
 // Decode every distributed loop with the same browser context and inspect
 // actual sample boundaries, not an asserted musicPlaying boolean.
 report.tracks=await page.evaluate(async()=>{
  const result=[];for(const track of Object.values(ost)){
   const data=await (await fetch(track.url)).arrayBuffer(),bytes=data.byteLength,b=await __contexts[0].decodeAudioData(data);let peak=0,sum=0,seam=0,maxStep=0;
   for(let ch=0;ch<b.numberOfChannels;ch++){const v=b.getChannelData(ch);seam=Math.max(seam,Math.abs(v[0]-v.at(-1)));for(let i=0;i<v.length;i++){peak=Math.max(peak,Math.abs(v[i]));sum+=v[i]*v[i];if(i)maxStep=Math.max(maxStep,Math.abs(v[i]-v[i-1]));}}
   result.push({id:track.id,bytes,duration:b.duration,channels:b.numberOfChannels,sampleRate:b.sampleRate,peak,rms:Math.sqrt(sum/(b.length*b.numberOfChannels)),seam,maxStep});
  }return result;
 });
 for(const t of report.tracks){assert(t.peak>.1&&t.peak<.8);assert(t.rms>.05&&t.rms<.2);assert(t.seam<.0002,'resampled seam bounded '+t.id);assert(t.bytes>100000&&t.bytes<4000000);}
 assert.deepEqual(report.commercialRequests,[]);
 await page.evaluate(()=>audio.stopMusic());await page.screenshot({path:out+'/390x844.png'});await page.setViewportSize({width:844,height:390});await page.screenshot({path:out+'/844x390.png'});
 await page.evaluate(()=>audio.dispose());assert.equal((await read()).bufferSources,0);report.result='PASS';
}catch(e){report.result='FAIL';report.error=String(e.stack||e);await page.screenshot({path:out+'/failure.png'});process.exitCode=1;}
finally{await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report));}
