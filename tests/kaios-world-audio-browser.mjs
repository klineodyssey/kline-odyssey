// Real browser: shared audio/return and canonical Heart mobile HUD regression.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const BASE=(process.env.KAIOS_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const OUT='artifacts/kaios-portal-qa';await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=user-gesture-required']});
const reports=[];
const preservation=process.argv.includes('--preservation');
try{for(const id of (process.argv.includes('--layout-only')?[]:preservation?['16888']:['12345','16888']))for(const [width,height]of (id==='16888'?[[360,844],[390,844],[412,844],[432,844],[480,844]]:[[390,844],[844,390]])){
 const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),page=await context.newPage();
 const errors=[],commercialRequests=[];page.on('pageerror',e=>errors.push(String(e.stack||e)));page.on('request',r=>{if(/\/music\/.*(?:\.mp3|playlist\.json)/i.test(r.url()))commercialRequests.push(r.url());});
 if(id==='16888'){
  // Deterministic transport for the exact same immutable original image (Git
  // blob 34569785d74e6959f206e1904a8987221dcb851e). A stalled raw GitHub image
  // otherwise holds the original window.onload/app.init hostage. No app stub.
  await page.route('https://raw.githubusercontent.com/klineodyssey/kline-odyssey/62dd71c64630001cc7d067079cfc63093fd64413/**/assets/fairy.png',route=>route.fulfill({path:'K線西遊記/temples/16888/assets/fairy.png',contentType:'image/png'}));
 }
 await page.addInitScript(()=>{const Real=window.AudioContext||window.webkitAudioContext;window.__qaAudioContexts=[];window.__qaAnalysers=[];const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(destination,...args){const result=connect.call(this,destination,...args);if(destination===this.context.destination){const analyser=this.context.createAnalyser();connect.call(this,analyser);window.__qaAnalysers.push(analyser);}return result;};if(Real){window.AudioContext=class extends Real{constructor(...args){super(...args);window.__qaAudioContexts.push(this);}};window.webkitAudioContext=window.AudioContext;}});
 await page.goto(BASE+`/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/${id}/index.html`,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.KAIOS_AUDIO_CONTROL,{timeout:45000});
 if(id==='16888')await page.waitForLoadState('load',{timeout:45000});
 await page.waitForTimeout(2500); // Legacy optional visual modules settle after DOMContentLoaded.
 const read=()=>page.evaluate(()=>window.KAIOS_AUDIO.snapshot());
 assert.equal((await read()).contextState,'NOT_CREATED');assert.equal((await read()).world,id);
 if(id==='16888'){
  if(await page.locator('#btn-guide-close').isVisible())await page.locator('#btn-guide-close').tap();
  assert.equal(await page.locator('#universe-nav > .nav-music').count(),1,'original audio parent');
  assert.equal(await page.locator('#universe-nav > [data-kaios-return=PORTAL]').count(),1,'original return parent');
  assert.equal(await page.locator('.kaios-audio-panel').count(),0,'no replacement audio UI');
  assert.equal(await page.locator('.nav-music').textContent(),'飛碟音響');
  assert.equal(await page.locator('[data-kaios-return=PORTAL]').evaluate(el=>getComputedStyle(el).position),'static','not a floating header card');
  assert.equal(await page.locator('.nav-audio').isVisible(),true);
  const nav=await page.locator('#universe-nav').boundingBox();assert.ok(Math.abs(nav.y-125)<.01,'original nav top retained');
  assert.equal(await page.locator('#music-file').isDisabled(),true);
  // Exercise original non-financial controls, never connect/sign a wallet.
  const chainBefore=await page.evaluate(()=>chainLive);await page.locator('#chainToggleBtn').tap();assert.equal(await page.evaluate(()=>chainLive),!chainBefore);
  await page.locator('#chainToggleBtn').tap();assert.equal(await page.evaluate(()=>chainLive),chainBefore,'original read-only chain status toggle, not a panel opener');
  for(const [button,panel]of [['#betToggleBtn','#bet-live-panel'],['#boardToggleBtn','#board-panel']]){
   const before=await page.locator(panel).evaluate(el=>el.style.display);
   await page.locator(button).tap();assert.notEqual(await page.locator(panel).evaluate(el=>el.style.display),before,`${button}: original panel opens`);
   await page.locator(button).tap();assert.equal(await page.locator(panel).evaluate(el=>el.style.display),before,`${button}: original panel closes`);
   assert.deepEqual(await page.locator('#universe-nav').boundingBox(),nav,'panel cycle retains navigation');
  }
  await page.evaluate(()=>web3.openWalletHub());assert.equal(await page.locator('#walletHub').isVisible(),true);await page.evaluate(()=>web3.closeWalletHub());
  const before=await page.locator('#warp-input-val').inputValue();await page.locator('#warp-input-val').tap();assert.notEqual(await page.locator('#warp-input-val').inputValue(),before,'original Warp input');
 }
 await page.screenshot({path:`${OUT}/world-${id}-${width}x${height}.png`});
 await page.locator('.nav-music').tap({timeout:15000});
 await page.waitForTimeout(400);
 assert.equal((await read()).musicPlaying,true,'FIRST TAP must enable audible music, not only open settings');
 if(id==='16888'){
  await page.locator('#music-panel').waitFor({state:'visible'});
  for(let cycle=0;cycle<3;cycle++){await page.locator('#music-panel button').filter({hasText:'關閉'}).tap();await page.locator('.nav-music').tap();}
 }else{
  await page.locator('.nav-music').tap();
  await page.locator('.kaios-audio-panel').waitFor({state:'visible'});
 }
 await page.waitForFunction(()=>window.KAIOS_AUDIO.snapshot().musicPlaying);
 assert.equal(await page.evaluate(()=>window.__qaAudioContexts.length),1,'single AudioContext per world');
 assert.equal((await read()).activeMusicLayers,1);
 const signal=await page.evaluate(async()=>{let peak=0,rms=0;for(let i=0;i<30;i++){for(const a of __qaAnalysers){const values=new Float32Array(a.fftSize);a.getFloatTimeDomainData(values);let sum=0;for(const v of values){peak=Math.max(peak,Math.abs(v));sum+=v*v;}rms=Math.max(rms,Math.sqrt(sum/values.length));}await new Promise(r=>setTimeout(r,100));}return{peak,rms};});
 assert.ok(signal.rms>.008&&signal.peak>.02&&signal.peak<.95,'destination signal: audible digital headroom, not just scheduler state');
 assert.equal(await page.locator('audio').evaluateAll(nodes=>nodes.filter(n=>!n.paused).length),0,'legacy HTML media must not play alongside shared synth');
 await page.screenshot({path:`${OUT}/world-${id}-audio-${width}x${height}.png`});
 if(id==='16888'){
  await page.locator('#music-panel button').filter({hasText:'暫停'}).tap();assert.equal((await read()).musicPlaying,false);
  await page.locator('#music-panel button').filter({hasText:'播放'}).tap();await page.waitForFunction(()=>KAIOS_AUDIO.snapshot().musicPlaying);
  await page.locator('#music-vol').evaluate(el=>el.value='50');await page.locator('#music-vol').dispatchEvent('input');assert.equal((await read()).settings.music,.5);
  assert.equal(await page.evaluate(()=>ui.beep(660,.1)),true); // original SFX route, shared backend
  await page.locator('#music-mute').tap();assert.equal((await read()).settings.muted,true);assert.equal((await read()).activeMusicLayers,0);
  assert.equal(await page.evaluate(()=>KAIOS_AUDIO.tone({frequency:660})),false,'mute gates SFX');
  await page.locator('#music-mute').tap();await page.waitForFunction(()=>KAIOS_AUDIO.snapshot().musicPlaying);
  await page.locator('#music-mute').tap();
  await page.locator('#music-panel button').filter({hasText:'關閉'}).tap();
 }else{
  await page.locator('[data-audio-action=mute]').click();assert.equal((await read()).settings.muted,true);assert.equal((await read()).activeMusicLayers,0);
  await page.getByRole('button',{name:'關閉設定',exact:true}).click();
 }
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
  await page.waitForSelector('html.k12345-composed');
  for(const s of ['.nav-music','[data-kaios-return=PORTAL]','#kgen-land-panel-open','#kgen-ai-toggle','#k12345-more-open','#kgen-v30-wish-btn','#kgen-v30-vow-btn']){const r=await hit(s);assert.ok(r.w>=44&&r.h>=44,'44px primary targets');}
  assert.equal(await page.locator('#kgen-land-info-panel-open').count(),0,'one Land entry, not two persistent buttons');
  assert.equal(await page.locator('[data-kaios-return=PORTAL]').getAttribute('title'),'回 KAIOS');
  assert.equal(await page.locator('[data-kaios-return=PORTAL]').getAttribute('aria-label'),'回 KAIOS 總世界');
  for(const s of ['#kgen-heart-toggle','#kgen-land-panel-open','#kgen-ai-toggle','#k12345-more-open']){const r=await hit(s);assert.ok(r.w>=44&&r.h>=44,'compact utility retains full touch target');}
  if(height===390)assert.ok((await page.locator('#k12345-primary').boundingBox()).width<=144,'landscape utility footprint remains compact');
  const composition=await page.evaluate(()=>{
   const r=document.querySelector('#core-anchor').getBoundingClientRect();
   const center=Math.abs(r.x+r.width/2-(document.querySelector('#k12345-world').getBoundingClientRect().x+document.querySelector('#k12345-world').clientWidth/2));
   const secondary=['.ga-matrix','#kline-engine-panel','#universe-nav','.footer-terminal'].map(s=>document.querySelector(s).checkVisibility());
   const occupied=[...document.querySelectorAll('#k12345-primary button,.warp-engine,#move-joystick-wrap,#wheel-wrap,#kgen-v30-ritual-dock')].some(el=>{const b=el.getBoundingClientRect();return b.left<r.right&&b.right>r.left&&b.top<r.bottom&&b.bottom>r.top;});
   return{center,secondary,occupied,width:r.width,height:r.height};
  });
  assert.ok(composition.center<1,'Heart centered in world slot');assert.ok(!composition.occupied,'Heart free of persistent controls');
  assert.ok(composition.width>=190&&composition.height>=190,'Heart remains primary visual, not a thumbnail');
  assert.deepEqual(composition.secondary,[false,false,false,false],'secondary information is disclosed on demand');
  await hit('.warp-rail');await hit('#move-joystick-wrap');await shot('closed');
  const warp=await page.locator('.warp-engine').boundingBox(),readout=await page.locator('#warp-txt').boundingBox();
  assert.ok(readout.y>=warp.y&&readout.y+readout.height<=warp.y+warp.height+1,'Warp readout must remain inside its stacking region');
  const initial=await geometry();
  // Original-function regression: real shortcuts, original form and original
  // sendHeart button listeners. Replace only the final transaction boundary;
  // NEVER connect a signer, approve, sign or broadcast during browser QA.
  await page.evaluate(()=>{
   const heart=KGEN_RUNTIME_CORE.modules.HeartRuntime;
   window.__originalSendHeart=heart.sendHeart;window.__ritualCalls=[];
   heart.sendHeart=(label,runner)=>runner({
    makeWish:hash=>__ritualCalls.push({method:'makeWish',hash}),
    vowTo:(option,amount)=>__ritualCalls.push({method:'vowTo',option,amount})
   });
  });
  for(let cycle=0;cycle<3;cycle++){
   await page.locator('#kgen-v30-wish-btn').tap();
   await page.waitForTimeout(120);
   assert.equal(await page.locator('#kgen-v30-wish-overlay').count(),0,'no duplicate wish form');
   await hit('#kh-wish-text');
   assert.equal(await page.evaluate(()=>__ritualCalls.length),cycle*2,'shortcut cannot submit');
   await page.locator('#kh-wish-text').fill('願世界平安');await shot('canonical-wish');
   await page.locator('#kh-wishbtn').tap();
   await page.locator('#kgen-heart-toggle').tap();
   assert.deepEqual(await geometry(),initial,'Wish cannot drift original positions');
   await page.locator('#kgen-v30-vow-btn').tap();await page.waitForTimeout(120);
   await hit('#kh-vow-option');await page.locator('#kh-vow-option').selectOption('2');
   await page.locator('#kh-vow-amount').fill('9');await shot('canonical-vow');
   assert.equal(await page.evaluate(()=>__ritualCalls.length),cycle*2+1,'Repay shortcut cannot submit');
   await page.locator('#kh-vow').tap();await page.locator('#kgen-heart-toggle').tap();
   assert.deepEqual(await geometry(),initial,'Repay cannot drift original positions');
  }
  assert.deepEqual(await page.evaluate(()=>__ritualCalls),await page.evaluate(()=>Array.from({length:3},()=>[
   {method:'makeWish',hash:ethers.utils.keccak256(ethers.utils.toUtf8Bytes('願世界平安'))},
   {method:'vowTo',option:2,amount:'9'}]).flat()),'exactly one original V3.2.6 action per explicit confirm button');
  // Restore and exercise the REAL disconnected wallet gate, still without a provider.
  await page.evaluate(()=>{KGEN_RUNTIME_CORE.modules.HeartRuntime.sendHeart=__originalSendHeart;window.__walletRequests=0;window.__originalWalletHub=web3.openWalletHub;web3.openWalletHub=()=>{__walletRequests++;};});
  await page.locator('#kgen-v30-wish-btn').tap();await page.locator('#kh-wishbtn').tap();
  assert.equal(await page.evaluate(()=>__walletRequests),1,'canonical Wallet gate invoked, not fake success');
  await page.locator('#kgen-heart-toggle').tap();
  await page.locator('#kgen-v30-vow-btn').tap();await page.locator('#kh-vow').tap();
  assert.equal(await page.evaluate(()=>__walletRequests),2,'Repay uses same Wallet gate');
  await page.locator('#kgen-heart-toggle').tap();
  await page.evaluate(()=>{web3.openWalletHub=__originalWalletHub;});
  // Legacy secondary panels retain manually supplied insets on every close.
  const panelRestored=await page.evaluate(()=>{
   const panel=document.getElementById('bet-live-panel'),original=panel.getAttribute('style');
   panel.style.cssText='left:23px;top:117px;right:auto;bottom:auto;display:none';
   const expected=panel.getAttribute('style');let valid=true;
   for(let i=0;i<3;i++){toggleBetPanel();toggleBetPanel();valid&&=panel.getAttribute('style')===expected;}
   if(original===null)panel.removeAttribute('style');else panel.setAttribute('style',original);
   return valid;
  });
  assert.ok(panelRestored,'secondary disclosure restores original inline positions');
  assert.deepEqual(await geometry(),initial,'all ritual cycles preserve world layout');
  for(const s of ['#kgen-land-panel-open'])for(let cycle=0;cycle<2;cycle++){
   await page.locator(s).tap();assert.equal(await page.locator('#k12345-land-dialog').evaluate(el=>el.open),true);
   assert.deepEqual(await geometry(),initial,'land open cannot push HUD');await hit('.k12345-land-close');
   assert.equal(await page.locator('#kgen-land-panel .kgen-land-body').isVisible(),true,'not an empty overlay');
   assert.equal(await page.locator('#kgen-land-info-panel .kgen-land-info-body').isVisible(),true);
   if(s.includes('info')){const panel=await page.locator('#kgen-land-info-panel').boundingBox(),scroll=await page.locator('.k12345-land-scroll').boundingBox();assert.ok(panel.y>=scroll.y-1,'info heading must not scroll above the detail viewport');}
   assert.ok(await page.locator('.k12345-land-scroll').evaluate(el=>getComputedStyle(el).overflowY==='auto'));
   await shot(s.includes('info')?'land-info':'land-map');await page.locator('.k12345-land-scroll').evaluate(el=>el.scrollTop=el.scrollHeight);
   await page.locator('.k12345-land-close').tap();assert.deepEqual(await geometry(),initial,'land close cannot move HUD');
  }
  await page.locator('.nav-music').tap();await page.waitForFunction(()=>KAIOS_AUDIO.snapshot().musicPlaying);
  await page.locator('.nav-music').tap();await shot('audio');await page.getByRole('button',{name:'關閉設定',exact:true}).tap();
  await page.locator('#kgen-ai-toggle').tap();await shot('ai');await page.getByRole('button',{name:'關閉 AI 客服',exact:true}).tap();
  await page.locator('#k12345-more-open').tap();await shot('more');
  assert.equal(await page.locator('.footer-terminal button').count(),8,'all original secondary actions retained');
  assert.equal(await page.locator('.ga-matrix').isVisible(),true);
  await page.locator('.footer-terminal').scrollIntoViewIfNeeded();await shot('more-controls');
  for(const button of await page.locator('.footer-terminal button').all()){
   await button.scrollIntoViewIfNeeded();assert.ok(await button.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'original footer action reachable');
  }
  await hit('#k12345-more-close');
  await page.locator('#kgen-v102-festival-panel h3').scrollIntoViewIfNeeded();await page.locator('#kgen-v102-festival-panel h3').tap();await shot('festival');await hit('#k12345-festival-close');await page.locator('#k12345-festival-close').tap();
  assert.equal(await page.locator('#k12345-more').evaluate(el=>el.open),false,'More relinquishes top layer to existing organs');
  await page.locator('#kgen-heart-toggle').tap();await shot('heart');await hit('#kgen-heart-toggle');
  const heart=await page.locator('#kgen-heart-live-panel').boundingBox();assert.ok(heart.x>=0&&heart.y>=0&&heart.x+heart.width<=width+1&&heart.y+heart.height<=height+1,'Heart stays in viewport');
  await page.locator('#kgen-heart-toggle').tap();
  await page.evaluate(()=>document.getElementById('universe-nav').scrollTop=0);
  if(width===390){
   for(let cycle=0;cycle<3;cycle++)for(const size of [{width:844,height:390},{width:390,height:844}]){
    await page.setViewportSize(size);await page.waitForTimeout(120);await hit('.nav-music');await hit('[data-kaios-return=PORTAL]');await hit('#kgen-land-panel-open');
   }
   assert.deepEqual(await geometry(),initial,'rotation cannot accumulate offsets');
   // Original nodes and bindings survive crossing the desktop breakpoint too.
   await page.setViewportSize({width:1280,height:900});await page.waitForTimeout(120);
   assert.equal(await page.locator('html.k12345-composed').count(),0);
   assert.equal(await page.locator('#k12345-more .footer-terminal').count(),0);
   await page.setViewportSize({width:390,height:844});await page.waitForTimeout(120);
   assert.deepEqual(await geometry(),initial,'desktop restoration cannot duplicate or drift organs');
  }
  assert.equal(await page.locator('[data-kaios-return=PORTAL]').count(),1);
  assert.equal(new URL(await page.locator('[data-kaios-return=PORTAL]').getAttribute('href'),page.url()).href,BASE+'/');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await shot('final');
  if(width===390||width===844){
   const core=page.locator('#core-window'),beforeMove=await core.getAttribute('style');
   const base=await page.locator('#move-joystick-base').boundingBox();
   await page.mouse.move(base.x+base.width/2,base.y+base.height/2);await page.mouse.down();
   await page.mouse.move(base.x+base.width/2+12,base.y+base.height/2-8);await page.mouse.up();
   assert.notEqual(await core.getAttribute('style'),beforeMove,'MOVE changes actual Heart position');
   assert.equal(await page.locator('#move-joystick-knob').evaluate(el=>el.style.transform),'translate(0px, 0px)','joystick thumb returns without resetting world position');
   const beforeDrive=await page.locator('#steer-input-val').inputValue(),wheel=await page.locator('#wheel').boundingBox();
   await page.mouse.click(wheel.x+wheel.width-8,wheel.y+wheel.height/2);
   assert.notEqual(await page.locator('#steer-input-val').inputValue(),beforeDrive,'DRIVE retains original steering handler');
   const beforeWarp=await page.locator('#warp-input-val').inputValue();await page.locator('#warp-input-val').tap();
   assert.notEqual(await page.locator('#warp-input-val').inputValue(),beforeWarp,'WARP input still changes');
   await shot('movement');
  }
  // Known pre-existing optional CDN defect, not a blanket allow-list for application errors.
  assert.ok(errors.every(e=>e.includes('process is not defined')&&e.includes('@walletconnect/ethereum-provider@2.12.2')),'no new runtime errors');
  reports.push({id:'12345-mobile',width,height,composition,ritualCanonicalDispatch:'PASS',disconnectedWalletGate:'PASS',transactionBroadcast:'NOT_PERFORMED',panelInsetRestore:'PASS',landStable:'PASS',modalContent:'PASS',utilityTargets:'PASS',panels:'PASS',rotation:width===390?'PASS':'NOT_APPLICABLE',legacyPageErrors:errors});
 }catch(error){await shot('FAIL');throw error;}finally{await context.close();}
}
}finally{await fs.writeFile(`${OUT}/world-audio-report.json`,JSON.stringify(reports,null,2));await browser.close();console.log(JSON.stringify(reports));}
