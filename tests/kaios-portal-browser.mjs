import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {worldUrl,sharedGameUrl} from '../assets/kaios-world-registry.mjs';
const BASE=(process.env.KAIOS_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const OUT='artifacts/kaios-portal-qa';
const FUNDING_ONLY=process.argv.includes('--funding-only');
if(FUNDING_ONLY){
  assert.equal(process.env.GITHUB_ACTIONS,'true','--funding-only runs only in the isolated GitHub Actions browser job');
  const base=new URL(BASE);
  assert.ok(['127.0.0.1','localhost','[::1]'].includes(base.hostname),'funding UI QA requires the CI loopback static server');
  assert.equal(base.username,'');assert.equal(base.password,'');assert.equal(base.search,'');assert.equal(base.hash,'');
}
await fs.mkdir(OUT,{recursive:true});
const report={head:process.env.KAIOS_SOURCE_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),trackedDirty:!!execFileSync('git',['status','--porcelain','--untracked-files=no'],{encoding:'utf8'}).trim(),functional:'RUNNING',visual:'SCREENSHOTS_REQUIRE_DIRECT_REVIEW',checks:[],profiles:[],navigations:[],runtimeErrors:[],errors:[]};
if(FUNDING_ONLY)Object.assign(report,{mode:'UI_ONLY_NO_REAL_WALLET',realWallet:'NOT_TESTED',chainReads:0,transactionRequests:0});
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=user-gesture-required']});
const shot=(page,name)=>page.screenshot({path:`${OUT}/${name}.png`});
const audio=page=>page.evaluate(async()=>{const {getKaiosAudio}=await import('./assets/kaios-audio.mjs');return getKaiosAudio().snapshot();});
async function reachable(page,selector){return page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{width:r.width,height:r.height,inView:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,hit:!!hit&&(hit===el||el.contains(hit))};});}
function assertExactRoute(actual,expected,label){
  const a=new URL(actual),e=new URL(expected);
  for(const field of ['origin','pathname','search','hash','username','password'])assert.equal(a[field],e[field],`${label}: ${field}`);
}
function portalRoutes(base){
  const root=new URL(base+'/');assert.ok(['http:','https:'].includes(root.protocol));
  assert.equal(root.username,'');assert.equal(root.password,'');assert.equal(root.search,'');assert.equal(root.hash,'');
  const quote=worldUrl('11520',root),host=worldUrl('88888',root),game=sharedGameUrl(root,'88888');
  assertExactRoute(quote,new URL('K線西遊記/temples/11520/index.html',root).href,'Taiwan quote registry');
  assertExactRoute(host,new URL('K線西遊記/temples/88888/index.html',root).href,'America host registry');
  assertExactRoute(game,new URL('K線西遊記/temples/11520/game-5d.html?world=88888',root).href,'shared engine registry');
  return {portal:root.href,quote,host,game};
}
async function clickRoute(page,selector,expected,visibleSelector,label){
  const href=await page.locator(selector).getAttribute('href'),failures=[];
  const failed=request=>{if(request.isNavigationRequest()&&request.frame()===page.mainFrame())failures.push({url:request.url(),error:request.failure()?.errorText||'UNKNOWN'});};
  page.on('requestfailed',failed);
  try{
    assert.equal(typeof href,'string',`${label}: link href`);assertExactRoute(new URL(href,page.url()).href,expected,`${label}: declared href`);
    await Promise.all([page.waitForURL(expected,{waitUntil:'domcontentloaded'}),page.locator(selector).click()]);
    assertExactRoute(page.url(),expected,`${label}: actual URL`);
    await page.locator(visibleSelector).waitFor({state:'visible'});
    const visible=await reachable(page,visibleSelector);assert.ok(visible.width>0&&visible.height>0&&visible.inView&&visible.hit,`${label}: visible reachable destination`);
    report.navigations.push({label,href,expected,actual:page.url(),visible,failures});
  }catch(error){report.navigations.push({label,href,expected,actual:page.url(),failures,failed:true});throw error;}
  finally{page.off('requestfailed',failed);}
}
async function verifyFundingPanel(){
  const route=new URL('K線西遊記/temples/18888/index.html',BASE+'/'),origin=route.origin;
  const roles={mother:'王母',jade:'玉帝',guanyin:'觀音'};
  for(const [width,height] of [[390,844],[844,390]]){
    const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
    context.setDefaultTimeout(10000);context.setDefaultNavigationTimeout(20000);
    const row={width,height,mode:'UI_ONLY_NO_REAL_WALLET',roles:[],screenshots:[],runtimeErrors:[],failedScripts:[],externalRequests:[],rpcMethods:[],networkWrites:[]};
    report.profiles.push(row);
    const page=await context.newPage();
    const capture=async(name,viewport=false)=>{
      const prefix=`funding-${width}x${height}-${name}`;
      if(viewport){
        await page.locator('#funding-panel').evaluate(el=>scrollTo(0,Math.max(0,el.getBoundingClientRect().top+scrollY-12)));
        const file=`${prefix}-viewport.png`;await shot(page,file.replace(/\.png$/,''));row.screenshots.push(file);
      }
      const file=`${prefix}-panel.png`;
      await page.locator('#funding-panel').screenshot({path:`${OUT}/${file}`});row.screenshots.push(file);
    };
    const noOverflow=async label=>{
      const geometry=await page.locator('#funding-panel').evaluate(el=>{
        const rect=el.getBoundingClientRect(),root=document.documentElement;
        return{viewport:innerWidth,document:root.scrollWidth,panelWidth:el.clientWidth,panelScroll:el.scrollWidth,left:rect.left,right:rect.right,textOverflow:[...el.querySelectorAll('p,pre')].filter(node=>node.clientWidth>0&&node.scrollWidth>node.clientWidth+1).map(node=>({id:node.id,width:node.clientWidth,scroll:node.scrollWidth}))};
      });
      assert.ok(geometry.document<=geometry.viewport+1,`${label}: page horizontal overflow ${JSON.stringify(geometry)}`);
      assert.ok(geometry.panelScroll<=geometry.panelWidth+1&&geometry.left>=-1&&geometry.right<=geometry.viewport+1,`${label}: funding panel horizontal overflow ${JSON.stringify(geometry)}`);
      assert.deepEqual(geometry.textOverflow,[],`${label}: visible funding text/IDs must wrap without horizontal scrolling`);
      return geometry;
    };
    const noWalletAuthority=async label=>{
      assert.equal(await page.locator('#funding-send').isDisabled(),true,`${label}: no connected/verified wallet means no send authority`);
      assert.match(await page.locator('#funding-role-status').textContent(),/尚未通過本次角色讀查/);
      assert.match(await page.locator('#funding-role-status').textContent(),/選擇角色不會授予權限/);
    };
    page.on('pageerror',error=>{const text=String(error.stack||error);row.runtimeErrors.push(text);report.runtimeErrors.push(text);});
    page.on('response',response=>{if(response.request().resourceType()==='script'&&response.status()>=400)row.failedScripts.push({url:response.url(),status:response.status()});});
    page.on('requestfailed',request=>{if(request.resourceType()==='script')row.failedScripts.push({url:request.url(),error:request.failure()?.errorText||'UNKNOWN'});});
    // Only this job's own static files may be fetched. No wallet, RPC, relay,
    // credentials or persistent browser profile is provided to this context.
    await context.route('**/*',async intercepted=>{
      const request=intercepted.request(),url=new URL(request.url());
      if(!['GET','HEAD'].includes(request.method())){
        row.networkWrites.push({origin:url.origin,method:request.method()});
        try{const payload=request.postDataJSON();for(const item of Array.isArray(payload)?payload:[payload])if(typeof item?.method==='string')row.rpcMethods.push(item.method);}catch{}
        await intercepted.abort('blockedbyclient');return;
      }
      if(['http:','https:'].includes(url.protocol)&&url.origin!==origin){row.externalRequests.push({origin:url.origin,type:request.resourceType()});await intercepted.abort('blockedbyclient');return;}
      await intercepted.continue();
    });
    try{
      const response=await page.goto(route.href,{waitUntil:'load'});assert.ok(response?.ok(),'18888 static page loads');
      await page.locator('#funding-panel').waitFor({state:'visible'});
      // This text is written by the real inline module only after its imports
      // and event handlers have initialized; an unexecuted HTML shell fails.
      await page.waitForFunction(()=>document.getElementById('funding-role-status')?.textContent.includes('本次選擇：王母'));
      assert.equal(await page.evaluate(()=>Boolean(window.ethereum||window.okxwallet||window.WalletConnectEthereumProvider||window['@walletconnect/ethereum-provider'])),false,'isolated context has no wallet provider or loaded WalletConnect SDK');
      assert.equal(await page.locator('#funding-beneficiary').inputValue(),'');
      assert.equal(await page.locator('#funding-case').inputValue(),'');
      assert.equal(await page.locator('#funding-ack').isChecked(),false);
      await noWalletAuthority('initial');
      assert.deepEqual(await page.locator('#funding-role option').evaluateAll(options=>options.map(option=>option.value)),Object.keys(roles));
      for(const [value,name] of Object.entries(roles)){
        await page.locator('#funding-role').selectOption(value);
        assert.match(await page.locator('#funding-role-status').textContent(),new RegExp(`本次選擇：${name}`));
        assert.equal(await page.locator('#funding-ack').isChecked(),false,'role change clears acknowledgment');
        await page.locator('#funding-ack').check();await noWalletAuthority(value);await page.locator('#funding-ack').uncheck();
        const geometry=await noOverflow(value);row.roles.push({value,name,sendDisabled:true,geometry});
        if(value!=='guanyin')await capture(value,value==='mother');
      }
      await page.locator('#funding-beneficiary').fill('');await page.locator('#funding-amount').fill('');
      await page.locator('#funding-prepare').click();
      await page.waitForFunction(()=>document.getElementById('funding-preview')?.textContent.includes('OFFLINE_DRAFT_NOT_CHAIN_VERIFIED'));
      const pauseDraft=JSON.parse(await page.locator('#funding-preview').textContent());
      assert.equal(pauseDraft.status,'OFFLINE_DRAFT_NOT_CHAIN_VERIFIED');assert.equal(pauseDraft.type,'BANK_PAUSE');assert.equal(pauseDraft.chainId,56);
      assert.match(pauseDraft.pause.to,/^0x[0-9a-fA-F]{40}$/);assert.match(pauseDraft.pause.data,/^0x[0-9a-fA-F]{8}$/);
      assert.equal(await page.locator('#funding-beneficiary').inputValue(),'');assert.equal(await page.locator('#funding-amount').inputValue(),'');assert.equal(await page.locator('#funding-case').inputValue(),'');
      assert.match(await page.locator('#funding-summary').textContent(),/離線暫停草案/);
      await page.locator('#funding-ack').check();await noWalletAuthority('offline Guanyin draft');await page.locator('#funding-ack').uncheck();
      await page.locator('#funding-panel details > summary').click();
      row.pauseDraft={status:pauseDraft.status,type:pauseDraft.type,chainId:pauseDraft.chainId,noCaseRequired:true,sendDisabled:true,geometry:await noOverflow('offline Guanyin draft')};
      await capture('guanyin-offline',true);
      // A synthetic public fixture address exercises the actual inline plan
      // and long address/hash wrapping; no original case or personal file.
      const beneficiary='0x1111111111111111111111111111111111111111';
      await page.locator('#funding-role').selectOption('mother');await page.locator('#funding-beneficiary').fill(beneficiary);await page.locator('#funding-amount').fill('1080000');
      await page.locator('#funding-prepare').click();
      await page.waitForFunction(()=>document.getElementById('funding-preview')?.textContent.includes('OFFLINE_DRAFT_NOT_CHAIN_VERIFIED')&&document.getElementById('funding-preview')?.textContent.includes('allocationId'));
      const fundingDraft=JSON.parse(await page.locator('#funding-preview').textContent());
      assert.equal(fundingDraft.beneficiary.toLowerCase(),beneficiary);assert.equal(fundingDraft.amountKaios,'1080000');
      await noWalletAuthority('offline Mother draft');row.longAddress=await noOverflow('long address and exact IDs');await capture('mother-long-address');
      assert.deepEqual(row.runtimeErrors,[],'18888 has no JavaScript/import errors');assert.deepEqual(row.failedScripts,[],'all actual scripts/import dependencies load');
      assert.deepEqual(row.rpcMethods,[],'offline drafts never attempt RPC');assert.deepEqual(row.networkWrites,[],'offline UI never sends a request body');
      assert.deepEqual(row.externalRequests,[],'offline funding UI never fetches wallet, relay or chain endpoints');
      row.functional='PASS';
    }catch(error){row.functional='FAIL';row.error=String(error.stack||error);await page.screenshot({path:`${OUT}/funding-${width}x${height}-FAIL.png`,fullPage:true}).catch(()=>{});throw error;}
    finally{await context.close();}
  }
  report.checks.push('actual 18888 module boot and three role choices; no wallet connection or send; offline Guanyin draft without case/address/amount; acknowledgment and role selection grant no authority; long address/ID wrapping in portrait and landscape');
}
try{
  if(FUNDING_ONLY)await verifyFundingPanel();
  else{
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
  page.on('pageerror',error=>report.runtimeErrors.push(String(error.stack||error)));
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
    const store=createLocalPlayerStore();const p=store.createPlayer();store.updateProfile({displayName:'星海旅人'});store.saveProgress({lastWorld:'16888'});
    const raw=localStorage.getItem('KAIOS_PLAYER_LIFE_V1'),envelope=JSON.parse(raw);
    return {id:p.playerId,raw,identity:{status:store.snapshot().status,activePlayerId:envelope.activePlayerId,players:Object.keys(envelope.players).sort(),playerId:p.playerId,createdAt:p.createdAt,homeWorld:p.homeWorld,homePlotId:p.homePlotId,homePlot:p.homePlot}};
  });
  await page.reload({waitUntil:'networkidle'});assert.match(await page.locator('#playerWelcome').textContent(),/星海旅人/);
  assert.match(await page.locator('#continueJourney').getAttribute('href'),/16888/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('KAIOS_PLAYER_LIFE_V1')),seeded.raw,'Portal projection read-only');
  assert.equal(await page.locator('body').innerText().then(t=>t.includes(seeded.id)),false,'Portal does not need to display persistent private identifier');
  await shot(page,'returning-player-390x844');
  for(let i=0;i<3;i++)for(const viewport of [{width:844,height:390},{width:390,height:844}]){await page.setViewportSize(viewport);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);const r=await reachable(page,'#primaryPlay');assert.ok(r.inView&&r.hit);}
  report.checks.push('new guest, validated returning player, allowlisted continue, read-only private profile, three rotation cycles');
  const routes=portalRoutes(BASE);
  for(let i=0;i<2;i++){
    await clickRoute(page,'#primaryPlay',routes.quote,'.shared-game-button','Portal to Taiwan quote');
    assertExactRoute(new URL(await page.locator('.shared-game-button').getAttribute('href'),page.url()).href,routes.host,'explicit game button');
    if(i===0){
      await page.reload({waitUntil:'domcontentloaded'});assertExactRoute(page.url(),routes.quote,'quote reload');await page.locator('.shared-game-button').waitFor({state:'visible'});
      await clickRoute(page,'.shared-game-button',routes.host,'#sharedGameFrame','quote to shared America game');
      for(let load=0;load<2;load++){
        if(load){await page.reload({waitUntil:'domcontentloaded'});assertExactRoute(page.url(),routes.host,'shared host reload');}
        const frame=page.locator('#sharedGameFrame');await frame.waitFor({state:'visible'});assert.equal(await frame.count(),1);
        assertExactRoute(new URL(await frame.getAttribute('src'),page.url()).href,routes.game,'fixed shared engine');
        const canvas=page.frameLocator('#sharedGameFrame').locator('canvas#three');await canvas.waitFor({state:'visible'});
        assertExactRoute(await canvas.evaluate(el=>el.ownerDocument.location.href),routes.game,'actual shared child URL');
        const size=await canvas.evaluate(el=>({width:el.width,height:el.height,rectWidth:el.getBoundingClientRect().width,rectHeight:el.getBoundingClientRect().height}));
        assert.ok(Object.values(size).every(value=>Number.isFinite(value)&&value>0),'shared game canvas has visible nonzero dimensions');
        const identity=await page.evaluate(async root=>{const {createLocalPlayerStore}=await import(new URL('K線西遊記/temples/11520/runtime/player-life-runtime.mjs',root).href);const store=createLocalPlayerStore(),p=store.loadPlayer(),envelope=JSON.parse(localStorage.getItem('KAIOS_PLAYER_LIFE_V1'));return {status:store.snapshot().status,activePlayerId:envelope.activePlayerId,players:Object.keys(envelope.players).sort(),playerId:p?.playerId,createdAt:p?.createdAt,homeWorld:p?.homeWorld,homePlotId:p?.homePlotId,homePlot:p?.homePlot};},routes.portal);
        assert.deepEqual(identity,seeded.identity,'shared entry/reload preserves player identity, collection and home');
        await shot(page,`shared-game-${load?'reload':'entry'}-390x844`);
      }
      await page.goBack({waitUntil:'domcontentloaded'});assertExactRoute(page.url(),routes.quote,'shared game back to quote');await page.locator('.shared-game-button').waitFor({state:'visible'});
    }
    const beforePortal=await page.evaluate(()=>localStorage.getItem('KAIOS_PLAYER_LIFE_V1'));
    await page.goBack({waitUntil:'networkidle'});assertExactRoute(page.url(),routes.portal,'quote back to Portal');await page.locator('#primaryPlay').waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>localStorage.getItem('KAIOS_PLAYER_LIFE_V1')),beforePortal,'returning Portal projection remains read-only');
    assert.equal(await page.locator('body').innerText().then(t=>t.includes(seeded.id)),false,'returning Portal hides persistent private identifier');
    // Exercise the persisted pageshow path even when a headless browser disables bfcache.
    await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
  }
  report.checks.push('two strict quote-entry/back cycles, explicit shared game entry/reload/back, canonical identity preservation and entry availability after persisted pageshow; visible canvas screenshots require direct visual review');
  await page.goto(BASE+'/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/index.html',{waitUntil:'networkidle'});assert.equal(new URL(page.url()).pathname,new URL(BASE+'/').pathname,'legacy Portal converges to root');
  await page.evaluate(()=>localStorage.setItem('KAIOS_PLAYER_LIFE_V1','{corrupt'));
  await page.reload({waitUntil:'networkidle'});assert.ok(await page.locator('#primaryPlay').isVisible());assert.equal(await page.evaluate(()=>localStorage.getItem('KAIOS_PLAYER_LIFE_V1')),'{corrupt');
  report.checks.push('legacy compatibility redirect, corrupt profile remains intact and play available');
  await context.close();
  }
  report.functional='PASS';
}catch(error){report.functional='FAIL';report.errors.push(String(error.stack||error));throw error;}
finally{await fs.writeFile(`${OUT}/${FUNDING_ONLY?'funding-browser-report':'portal-browser-report'}.json`,JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report));}
