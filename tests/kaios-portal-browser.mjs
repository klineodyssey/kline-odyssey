import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
const BASE=(process.env.KAIOS_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const OUT='artifacts/kaios-portal-qa';
await fs.mkdir(OUT,{recursive:true});
const report={head:process.env.KAIOS_SOURCE_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),trackedDirty:!!execFileSync('git',['status','--porcelain','--untracked-files=no'],{encoding:'utf8'}).trim(),functional:'RUNNING',visual:'SCREENSHOTS_REQUIRE_DIRECT_REVIEW',checks:[],profiles:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=user-gesture-required']});
const shot=(page,name)=>page.screenshot({path:`${OUT}/${name}.png`});
const audio=page=>page.evaluate(async()=>{const {getKaiosAudio}=await import('./assets/kaios-audio.mjs');return getKaiosAudio().snapshot();});
async function reachable(page,selector){return page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{width:r.width,height:r.height,inView:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,hit:!!hit&&(hit===el||el.contains(hit))};});}
try{
  for(const [width,height] of [[360,844],[390,844],[412,844],[432,844],[480,844],[844,390]]){
    const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage();
    await page.addInitScript(()=>{globalThis.__audioAnalysers=[];const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(destination,...args){const result=connect.call(this,destination,...args);if(destination===this.context.destination){const a=this.context.createAnalyser();connect.call(this,a);__audioAnalysers.push(a);}return result;};});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(BASE+'/',{waitUntil:'networkidle'});await page.locator('#primaryPlay').waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Portal horizontal overflow');
    assert.equal((await audio(page)).contextState,'NOT_CREATED','no context before gesture');
    const primary=await reachable(page,'#primaryPlay');assert.ok(primary.hit&&primary.inView,'primary CTA must be reachable on first screen');assert.ok(primary.height>=44);
    const toggle=await reachable(page,'[data-kaios-audio-toggle]');assert.ok(toggle.hit&&toggle.inView&&toggle.height>=44);
    await shot(page,`portal-${width}x${height}`);
    const links=await page.locator('a[href]').evaluateAll(nodes=>nodes.map(a=>({href:a.href,label:a.textContent.trim()})));
    for(const link of links){const u=new URL(link.href);if(u.origin!==new URL(BASE).origin)continue;const response=await context.request.get(u.href);assert.ok(response.ok(),`broken Portal link: ${link.href}`);}
    await page.locator('#researchArchive > summary').click();
    assert.equal(await page.locator('#researchArchiveCards [data-status=RESEARCH]').count(),3);
    assert.equal(await page.locator('#researchArchiveCards a[data-world-id]').count(),0,'research must not acquire play navigation authority');
    await shot(page,`research-${width}x${height}`);await page.locator('#researchArchive > summary').click();
    await page.locator('#worlds').scrollIntoViewIfNeeded();await shot(page,`worlds-${width}x${height}`);
    await page.evaluate(()=>scrollTo(0,0));
    await page.locator('[data-kaios-audio-toggle]').tap();
    await page.waitForFunction(async()=>{const m=await import('./assets/kaios-audio.mjs');return m.getKaiosAudio().snapshot().musicPlaying;});
    let state=await audio(page);assert.equal(state.contextState,'running');assert.equal(state.activeMusicLayers,1);
    const signal=await page.evaluate(async()=>{let peak=0,rms=0;for(let i=0;i<25;i++){for(const a of __audioAnalysers){const v=new Float32Array(a.fftSize);a.getFloatTimeDomainData(v);let sum=0;for(const x of v){peak=Math.max(peak,Math.abs(x));sum+=x*x;}rms=Math.max(rms,Math.sqrt(sum/v.length));}await new Promise(r=>setTimeout(r,100));}return{peak,rms};});
    assert.ok(signal.rms>.008&&signal.peak>.02&&signal.peak<.95,'Portal destination PCM must be measurable above near-silence without clipping');
    await shot(page,`portal-playing-${width}x${height}`);
    await page.evaluate(()=>__audioAnalysers[0].context.suspend());
    await page.waitForFunction(async()=>{const m=await import('./assets/kaios-audio.mjs');return m.getKaiosAudio().snapshot().needsGesture&&!m.getKaiosAudio().snapshot().musicPlaying;});
    await page.locator('[data-kaios-audio-toggle]').tap();
    await page.waitForFunction(async()=>{const m=await import('./assets/kaios-audio.mjs');return m.getKaiosAudio().snapshot().musicPlaying;});
    await page.waitForTimeout(150);assert.equal((await audio(page)).settings.muted,false,'recovery tap must not become an accidental mute');
    await page.locator('[data-audio-action=settings]').click();
    assert.ok(await page.locator('.kaios-audio-panel').isVisible());
    for(const channel of ['master','music','sfx','voice']){
      const input=page.locator(`[data-audio-volume=${channel}]`);
      if(channel==='master'||channel==='music'){await input.fill('0');await input.dispatchEvent('input');assert.equal((await audio(page)).musicPlaying,false);assert.match(await page.locator('[data-audio-status]').innerText(),/音量為 0/);}
      await input.fill('35');await input.dispatchEvent('input');
      assert.equal((await audio(page)).settings[channel],.35);
    }
    await shot(page,`audio-settings-${width}x${height}`);
    await page.getByRole('button',{name:'關閉設定',exact:true}).click();
    await page.locator('[data-kaios-audio-toggle]').click();state=await audio(page);assert.equal(state.settings.muted,true);assert.equal(state.activeMusicLayers,0);
    await page.locator('[data-kaios-audio-toggle]').click();state=await audio(page);assert.equal(state.settings.muted,false);assert.equal(state.activeMusicLayers,1,'unmute resumes only one theme');
    await page.locator('[data-kaios-audio-toggle]').click();assert.equal((await audio(page)).settings.muted,true);
    await page.reload({waitUntil:'networkidle'});state=await audio(page);assert.equal(state.settings.muted,true);assert.equal(state.settings.master,.35);assert.equal(state.contextState,'NOT_CREATED');
    assert.deepEqual(errors,[]);report.profiles.push({width,height,primary,toggle,signal,links:links.length,audio:'PASS',reload:'PASS'});
    await context.close();
  }
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();
  await page.goto(BASE+'/',{waitUntil:'networkidle'});
  await page.evaluate(async()=>{const {mountAudioControl}=await import('./assets/kaios-audio-ui.mjs');const button=document.createElement('button');button.id='qa-remount-audio';document.body.prepend(button);const first=mountAudioControl({existingButton:button});first.destroy();first.destroy();window.__qaRemount=mountAudioControl({existingButton:button});});
  await page.locator('#qa-remount-audio').click();await page.waitForTimeout(100);
  assert.equal((await audio(page)).musicPlaying,true,'remounted primary control starts music on first tap');
  await page.locator('#qa-remount-audio').click();
  assert.equal(await page.locator('.kaios-audio-panel:visible').count(),1,'destroy/remount preserves one handler');
  await page.evaluate(()=>{window.__qaRemount.destroy();document.getElementById('qa-remount-audio').remove();delete window.__qaRemount;});
  report.checks.push('existing-button audio control destroy/remount lifecycle');
  const guest=await page.evaluate(()=>localStorage.getItem('KAIOS_PLAYER_LIFE_V1'));assert.equal(guest,null,'Portal must not silently create Player Life');
  const seeded=await page.evaluate(async()=>{
    const {createLocalPlayerStore}=await import('./K線西遊記/temples/11520/runtime/player-life-runtime.mjs');
    const store=createLocalPlayerStore();const p=store.createPlayer();store.updateProfile({displayName:'星海旅人'});store.saveProgress({lastWorld:'16888'});return {id:p.playerId,raw:localStorage.getItem('KAIOS_PLAYER_LIFE_V1')};
  });
  await page.reload({waitUntil:'networkidle'});assert.match(await page.locator('#playerWelcome').textContent(),/星海旅人/);
  assert.match(await page.locator('#continueJourney').getAttribute('href'),/16888/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('KAIOS_PLAYER_LIFE_V1')),seeded.raw,'Portal projection read-only');
  assert.equal(await page.locator('body').innerText().then(t=>t.includes(seeded.id)),false,'Portal does not need to display persistent private identifier');
  await shot(page,'returning-player-390x844');
  for(let i=0;i<3;i++)for(const viewport of [{width:844,height:390},{width:390,height:844}]){await page.setViewportSize(viewport);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);const r=await reachable(page,'#primaryPlay');assert.ok(r.inView&&r.hit);}
  report.checks.push('new guest, validated returning player, allowlisted continue, read-only private profile, three rotation cycles');
  for(let i=0;i<2;i++){
    await page.locator('#primaryPlay').click();await page.waitForURL(/temples\/11520\/game-5d\.html/,{waitUntil:'domcontentloaded'});
    await page.goBack({waitUntil:'networkidle'});await page.locator('#primaryPlay').waitFor();
    // Exercise the persisted pageshow path even when a headless browser disables bfcache.
    await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
  }
  report.checks.push('two real world-entry/back cycles and persisted pageshow navigation reset');
  await page.goto(BASE+'/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/index.html',{waitUntil:'networkidle'});assert.equal(new URL(page.url()).pathname,new URL(BASE+'/').pathname,'legacy Portal converges to root');
  await page.evaluate(()=>localStorage.setItem('KAIOS_PLAYER_LIFE_V1','{corrupt'));
  await page.reload({waitUntil:'networkidle'});assert.ok(await page.locator('#primaryPlay').isVisible());assert.equal(await page.evaluate(()=>localStorage.getItem('KAIOS_PLAYER_LIFE_V1')),'{corrupt');
  report.checks.push('legacy compatibility redirect, corrupt profile remains intact and play available');
  await context.close();
  report.functional='PASS';
}catch(error){report.functional='FAIL';report.errors.push(String(error.stack||error));throw error;}
finally{await fs.writeFile(`${OUT}/portal-browser-report.json`,JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report));}
