import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';

// Real entry only: never import repairs or change runtime styles from QA.
const OUT='artifacts/11520-responsive-qa';
const BASE=process.env.K11520_BASE_URL||'http://127.0.0.1:4173';
const ROUTE='/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html';
const PRODUCTION=process.env.K11520_PRODUCTION_QA==='1';
const profiles=PRODUCTION?[{name:'pages-360',width:360,height:740},{name:'pages-390',width:390,height:844},{name:'pages-432',width:432,height:856},{name:'pages-landscape-844',width:844,height:390,landscape:true}]:[
  {name:'cold-390',width:390,height:844},{name:'cold-432',width:432,height:856},
  {name:'warm-412',width:412,height:772,warm:true},{name:'cold-360',width:360,height:740},{name:'cold-landscape-844',width:844,height:390,landscape:true},
  {name:'cold-480',width:480,height:900}
];
const selectors=['.top','.axes','.tele','.monsterHud','.minimapWrap','#joy','#cControl','#lotsControl','#yControl','#cThumb','#lotsThumb','#yThumb','#cRead','#lotsRead','#yRead','#tradeSword','#k11520PlaneLabel','#dockToggle','#skill','#dodge','#flat','#brandClockV250','#k11520RealTradePreflightBtn','#k11520UtilityMaster','#dock','#walletToggle','#chatHandle','#bgmButton','#aiChatButton','#backpackButton','#gameModeToggle','#k11520HudCollapseAll','#orderFire','#attack'];
const utilities=['#dock','#walletToggle','#chatHandle','#bgmButton','#aiChatButton','#backpackButton','#gameModeToggle','#k11520HudCollapseAll'];
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const reports=[],failures=[],sourceChecks=[];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceSha=bytes=>sha(Buffer.from(Buffer.from(bytes).toString('utf8').replace(/\r\n?/g,'\n'),'utf8'));
async function verifyProductionSource(){
  for(const name of ['../game-5d.html','../sw.js','../manifest.webmanifest','combat-fx-runtime.mjs','game-5d-bootstrap.mjs','mobile-control-layout.mjs','market-origin-wallet-layout-runtime.mjs','mobile-action-rail-clearance-runtime.mjs','evm-wallet-runtime.mjs','public-market-quotes.mjs']){
    // GitHub Pages publishes LF text while Windows checkouts may materialize CRLF.
    // Compare canonical source text so deployment lineage checks remain byte-format agnostic.
    const expected=sourceSha(await fs.readFile(new URL('../runtime/'+name,import.meta.url)));
    let observed=null,status=null;
    for(let attempt=0;attempt<24;attempt++){
      const url=BASE+ROUTE.slice(0,ROUTE.lastIndexOf('/'))+'/runtime/'+name+'?verify='+expected;
      const response=await fetch(url,{signal:AbortSignal.timeout(15000)});status=response.status;
      if(response.ok)observed=sourceSha(Buffer.from(await response.arrayBuffer()));
      if(observed===expected)break;
      await new Promise(resolve=>setTimeout(resolve,5000));
    }
    sourceChecks.push({name,expected,observed,status,match:expected===observed});
    assert.equal(observed,expected,'Public Pages source is not the checked-out deployment: '+name);
  }
}
async function snapshot(page){return page.evaluate(sels=>{
  const box=el=>{if(!el)return null;const r=el.getBoundingClientRect(),s=getComputedStyle(el);const visible=s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&r.width>0&&r.height>0;const h=visible?document.elementFromPoint(r.x+r.width/2,r.y+r.height/2):null;return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,visible,hit:!!h&&(h===el||el.contains(h)),pointer:s.pointerEvents,blocker:h?{id:h.id,classes:String(h.className),pointer:getComputedStyle(h).pointerEvents}:null,scroll:el.scrollHeight,client:el.clientHeight,text:(el.textContent||'').trim().slice(0,240)}};
  const yThumbStyle=getComputedStyle(document.querySelector('#yThumb'));
  return{width:innerWidth,height:innerHeight,boxes:Object.fromEntries(sels.map(s=>[s,box(document.querySelector(s))])),cards:[...document.querySelectorAll('#axes .axis')].map(box),balances:[...document.querySelectorAll('.top>.pill')].map(box),drawers:[...document.querySelectorAll('.hud-drawer-toggle')].map(box),axisArt:{image:yThumbStyle.backgroundImage,position:yThumbStyle.backgroundPosition,size:yThumbStyle.backgroundSize,repeat:yThumbStyle.backgroundRepeat},settingsInstalled:!!globalThis.__K11520_UI_SETTINGS__,layoutInstalled:!!globalThis.__K11520_MOBILE_CONTROL_LAYOUT__,xyzInstalled:!!globalThis.__K11520_3D_CONTROL__,utilityOpen:document.documentElement.classList.contains('k11520UtilitiesOpen'),version:document.querySelector('.brandMetaV250')?.textContent};
},selectors)}
async function finalizeLandscape(page,report){
  await page.locator('#confirm').waitFor({state:'hidden'});
  const controls=['#joy','#yControl','#cControl','#lotsControl','#cNumericInput','#lotsNumericInput','#attack','#skill','#tradeSword','#dodge','#flat','#orderFire','#k11520UtilityMaster'];
  const boxes=()=>page.evaluate(sels=>Object.fromEntries(sels.map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return[s,{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,hit:h===e||e.contains(h)}]})),controls);
  const overlaps=(a,b)=>a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y;
  const initial=await boxes();
  const cdp=await page.context().newCDPSession(page);
  report.combat=[];
  for(const [selector,variant,delay,duration]of [['#attack','slash',45,330],['#skill','goldenRain',300,1100],['#tradeSword','phantomAxe',180,780]]){
    const b=initial[selector],pointer={x:b.x+b.width/2,y:b.y+b.height/2,button:'left',clickCount:1};
    await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',...pointer});await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',...pointer});await page.waitForTimeout(delay);
    const timing=await page.evaluate(()=>({variant:__K11520_COMBAT_FX__.variant,elapsed:Date.now()-__K11520_COMBAT_FX__.at}));assert.equal(timing.variant,variant);assert.ok(timing.elapsed<duration,`${variant} capture missed active window: ${timing.elapsed}ms`);
    // CDP captures the presented frame without Playwright waiting for fonts/layout animation settling.
    const shot=await cdp.send('Page.captureScreenshot',{format:'png'});await fs.writeFile(`${OUT}/landscape-${variant}.png`,Buffer.from(shot.data,'base64'));
    report.combat.push({...timing,realClick:true});await page.waitForTimeout(1300);
  }
  await cdp.detach();
  for(const [s,b]of Object.entries(initial)){assert.ok(b.hit,s+' pointer blocked');assert.ok(b.x>=0&&b.y>=0&&b.right<=844&&b.bottom<=390,s+' clipped');assert.ok(b.width>=44&&b.height>=44,s+' touch target below 44px')}
  for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++)assert.ok(!overlaps(initial[controls[i]],initial[controls[j]]),controls[i]+' overlaps '+controls[j]);
  assert.ok(initial['#attack'].width>initial['#skill'].width&&initial['#attack'].width>initial['#tradeSword'].width,'primary attack should be largest');
  report.rotation=[];
  for(let i=0;i<4;i++){
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);
    const portrait=await snapshot(page);check('rotation portrait '+i,portrait);if(i===3)await page.screenshot({path:`${OUT}/rotation-portrait-390x844.png`});
    await page.setViewportSize({width:844,height:390});await page.waitForTimeout(400);
    const current=await boxes();for(const s of controls)for(const k of ['x','y','width','height'])assert.ok(Math.abs(current[s][k]-initial[s][k])<1,`${s} ${k} drift after rotation ${i}`);
    assert.deepEqual(await page.locator('#three').evaluate(e=>[e.clientWidth,e.clientHeight]),[844,390]);report.rotation.push({cycle:i,stable:true});
  }
  const input=async(s,v)=>{await page.locator(s).fill(v);await page.locator(s).press('Enter');await page.waitForTimeout(300)};
  const state=()=>page.evaluate(()=>({axis:__K11520_SIGNED_C_IMMERSIVE__.activeAxis,c:__K11520_SIGNED_C_IMMERSIVE__.signedC,lots:__K11520_SIGNED_C_IMMERSIVE__.lots,side:__K11520_SIGNED_C_IMMERSIVE__.canonicalSide,plane:__K11520_3D_CONTROL__.mode}));
  for(const [plane,axis]of [['XZ','KY'],['XY','KZ'],['YZ','KX'],['XZ','KY']]){
    for(let n=0;(await state()).plane!==plane&&n<3;n++){await page.locator('#joy').tap();await page.waitForTimeout(200)}
    assert.equal((await state()).axis,axis,plane+' normal trading axis');
    const before=await state();await page.locator('[data-axis="'+(axis==='KX'?'KY':'KX')+'"]').click();await page.locator('#sheet.open').waitFor();assert.deepEqual(await state(),before,'market detail changed trading authority');await page.locator('#sheetClose').click();
  }
  await input('#cNumericInput','-0.1');assert.equal((await state()).side,'空');await input('#lotsNumericInput','7');assert.equal((await state()).lots,7);await input('#lotsNumericInput','-5');assert.equal((await state()).lots,7);await input('#cNumericInput','-0');assert.equal((await state()).c,0);assert.ok(!(await page.locator('#cRead').textContent()).includes('-0'));
  await input('#cNumericInput','1');await input('#lotsNumericInput','1');
  const world=()=>page.evaluate(()=>structuredClone(__K11520_WORLD_COORDS__));
  const drag=async(s,x,y)=>{const b=await page.locator(s).boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width*x,b.y+b.height*y,{steps:8});await page.waitForTimeout(320);await page.mouse.up();await page.waitForTimeout(160)};
  let before=await world();await drag('#joy',.85,.5);assert.ok((await world()).physical.x>before.physical.x,'joystick X+ did not move avatar');before=await world();await drag('#yControl',.5,.15);assert.ok((await world()).physical.y>before.physical.y,'Y+ did not move avatar');await drag('#yControl',.5,.85);
  await page.locator('#orderFire').click();await page.locator('#confirm.open').waitFor();assert.ok((await page.locator('#confirmBody').textContent()).includes('KY'));await page.screenshot({path:`${OUT}/landscape-direct-order.png`});await page.locator('#cancelOrder').click();
  await page.locator('#attack').click();await page.waitForTimeout(420);await page.locator('#attack').click();assert.equal(await page.evaluate(()=>__K11520_COMBAT_FX__.variant),'slash');await page.waitForTimeout(1200);
  before=await world();await page.locator('#dodge').click();assert.notDeepEqual((await world()).physical,before.physical,'dodge did not move');
  await page.screenshot({path:`${OUT}/landscape-final-844x390.png`});
  report.landscapeFinalization='PASS';
}
function check(label,state,{expanded=false,landscape=false}={}){const b=state.boxes;const ok=(value,message)=>{if(!value)failures.push(`${label}: ${message}`)};
  ok(/wukong-y-control\.jpg/i.test(state.axisArt.image),'normal-axis thumb lost approved Wukong artwork');
  ok(state.axisArt.position==='31.5% 46.3%','normal-axis artwork focal point drifted: '+state.axisArt.position);
  ok(/^426\.5%(?: auto)?$/.test(state.axisArt.size),'normal-axis artwork is not the upright face crop: '+state.axisArt.size);
  ok(state.axisArt.repeat==='no-repeat','normal-axis artwork unexpectedly repeats');
  const overlap=(a,c)=>a?.visible&&c?.visible&&a.x<c.right&&a.right>c.x&&a.y<c.bottom&&a.bottom>c.y;
  const combatHidden=landscape&&expanded;
  for(const s of ['.top','.tele','.monsterHud','.minimapWrap','#joy','#cControl','#lotsControl','#yControl','#cThumb','#lotsThumb','#yThumb','#k11520UtilityMaster',...(combatHidden?[]:['#orderFire','#attack'])]){const r=b[s];ok(r?.visible,`${s} missing/hidden`);if(r?.visible)ok(r.x>=-1&&r.y>=-1&&r.right<=state.width+1&&r.bottom<=state.height+1,`${s} outside viewport`)}
  for(const s of ['#joy','#cControl','#lotsControl','#yControl','#k11520UtilityMaster',...(combatHidden?[]:['#tradeSword','#orderFire','#attack'])])ok(b[s]?.hit,`${s} cannot receive a real click: ${JSON.stringify(b[s]?.blocker)}`);
  const clock=b['#brandClockV250'];if(clock){ok(clock.right<=Math.min(...state.balances.map(r=>r.x))-4,'header clock crosses into balances');ok(clock.bottom<=b['.top'].bottom-4,'header clock escapes header')}
  for(const s of ['#attack','#orderFire','#tradeSword','#k11520PlaneLabel','#dockToggle','#skill','#dodge','#flat']){for(const other of ['#joy','#cControl','#lotsControl','#yControl'])ok(!overlap(b[s],b[other]),`${s} overlaps ${other}`)}
  for(const s of ['#attack','#orderFire'])ok(!overlap(b[s],b['#k11520RealTradePreflightBtn']),`${s} partly covered by preflight button`);
  ok(state.drawers.every(r=>!r?.visible),'legacy drawer controls visible');
  const maxCard=Math.max(...state.cards.map(r=>r.bottom));
  for(const s of ['.tele','.monsterHud'])if(b[s]){ok(b[s].y>=maxCard+6,`${s} overlaps actual market cards`);ok(b[s].scroll<=b[s].client+1,`${s} clips text`)}
  // Current mobile ownership intentionally centers the normal-axis energy rail, then places signed-C and positive lots to its right.
  const rails=['#yControl','#cControl','#lotsControl'].map(s=>b[s]);if(rails.every(Boolean)){ok(rails.every(r=>Math.abs(r.y-rails[0].y)<2),'three rails not aligned');ok(rails[0].right+5<=rails[1].x&&rails[1].right+5<=rails[2].x,'three rails overlap');if(!landscape)ok(Math.abs((rails[0].x+rails[0].width/2)-state.width/2)<2,'normal-axis energy rail not centered')}
  if(landscape)for(const rail of rails){ok(!overlap(rail,b['.monsterHud']),`parameter rail overlaps life HUD`);ok(!overlap(rail,b['.tele']),`parameter rail overlaps world HUD`)}
  for(const [rail,thumb,read] of [['#cControl','#cThumb','#cRead'],['#lotsControl','#lotsThumb','#lotsRead'],['#yControl','#yThumb','#yRead']]){
    const r=b[rail],t=b[thumb],text=b[read];if(r&&t){ok(Math.abs(t.width-t.height)<.5,`${thumb} is not circular`);ok(t.y>=r.y+20&&t.bottom<=r.bottom-20,`${thumb} escapes the track or covers its label`)}
    if(r&&text)ok(text.y>=r.y&&text.bottom<=r.bottom+1,`${read} escapes its control`);
  }
  const joy=b['#joy'],normal=b['#yControl'],badge=b['#k11520PlaneLabel'],sword=b['#tradeSword'];
  ok(joy?.right+8<=normal?.x,'joystick must keep 8px clearance from the centered normal-axis rail');
  ok(badge?.right+8<=sword?.x,'plane badge must keep 8px clearance from the trade sword');
  const master=b['#k11520UtilityMaster'];
  ok(landscape&&!expanded?Math.abs(master.y-58)<1:Math.abs(state.height-master.bottom-(landscape?18:150))<1,'utility master must keep its responsive anchor without drifting across expand/collapse');
  if(landscape&&!expanded){ok(!overlap(master,b['#orderFire']),'utility master overlaps landscape order');ok(!overlap(master,b['#attack']),'utility master overlaps landscape attack')}
  ok(b['#lotsControl']?.right+8<=master.x,'utility master must keep horizontal clearance from parameter rails');
  if(!expanded)ok(utilities.every(s=>!b[s]?.visible),'collapsed utility lane contains extra controls');
  else{
    ok(state.utilityOpen,'expanded utility state missing');
    const controls=['#backpackButton','#aiChatButton','#bgmButton','#chatHandle','#walletToggle','#gameModeToggle','#dockToggle','#k11520UtilityMaster','#k11520HudCollapseAll'];
    for(const selector of controls){const r=b[selector];ok(r?.visible&&r.hit,selector+' must be visible and pointer-reachable when expanded');if(!r?.visible)continue;
      ok(r.width>=44&&r.height>=44,selector+' must have a 44px hit target');
      ok(r.x>=0&&r.y>=0&&r.right<=state.width&&r.bottom<=state.height,selector+' outside viewport');
      for(const other of ['.top','.axes','.tele','.monsterHud','#joy','#yControl','#cControl','#lotsControl','#tradeSword','#skill','#dodge','#flat','#attack','#orderFire'])ok(!overlap(r,b[other]),selector+' overlaps '+other);
    }
    if(landscape){for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++)ok(!overlap(b[controls[i]],b[controls[j]]),controls[i]+' overlaps '+controls[j])}
    else for(let i=0;i<controls.length-1;i++){const upper=b[controls[i]],lower=b[controls[i+1]];ok(upper?.bottom+4<=lower?.y,controls[i]+' needs a visible gap before '+controls[i+1])}
  }
}
try{
  if(PRODUCTION)await verifyProductionSource();
  for(const profile of profiles){const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},isMobile:true,hasTouch:true});const page=await context.newPage();const errors=[],warnings=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(['warning','error'].includes(m.type()))warnings.push(m.text().slice(0,300))});
    if(!PRODUCTION)await page.route('https://data-api.binance.vision/api/v3/ticker/price*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify([{symbol:'BTCUSDT',price:'77564.83000000'},{symbol:'ETHUSDT',price:'2511.16000000'},{symbol:'BNBUSDT',price:'724.23000000'}])}));
    if(profile.warm)await page.addInitScript(()=>{localStorage.setItem('11520.play.cleanMode','1');localStorage.setItem('k11520.joystick.plane','XZ');localStorage.setItem('klineodyssey.public-wallet-identity.v1',JSON.stringify({version:1,address:'0x1234567890123456789012345678901234567890',chainId:56,sourceWorld:'K12345',updatedAt:new Date().toISOString()}))});
    const report={profile,mode:PRODUCTION?'PUBLIC_PAGES_READ_ONLY':'LOCAL_REALISTIC_QUOTE_FIXTURE',errors,warnings,states:{}};reports.push(report);
    try{await page.goto(BASE+ROUTE,{waitUntil:'domcontentloaded',timeout:35000});await page.waitForFunction(()=>globalThis.__K11520_3D_CONTROL__,null,{timeout:20000});await page.waitForTimeout(7500);if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click();
      report.states.cold=await snapshot(page);await page.screenshot({path:`${OUT}/${profile.name}-collapsed.png`,fullPage:true});check(profile.name,report.states.cold,{landscape:!!profile.landscape});
      const authorityBefore=await page.evaluate(()=>({axis:globalThis.__K11520_SIGNED_C_IMMERSIVE__?.activeAxis,order:document.querySelector('#orderFire')?.getAttribute('aria-label')}));
      const inspectedAxis=authorityBefore.axis==='KX'?'KY':'KX';await page.locator(`[data-axis="${inspectedAxis}"]`).click();await page.waitForTimeout(100);
      const authorityAfter=await page.evaluate(()=>({axis:globalThis.__K11520_SIGNED_C_IMMERSIVE__?.activeAxis,order:document.querySelector('#orderFire')?.getAttribute('aria-label')}));
      assert.deepEqual(authorityAfter,authorityBefore,'market detail click must not change plane-selected trading authority or order semantics');
      await page.locator('#sheetClose').click();report.marketCardAuthority='PRESERVED';
      if(report.states.cold.boxes['#k11520UtilityMaster']?.hit){for(let i=0;i<3;i++){await page.locator('#k11520UtilityMaster').click({timeout:2500});await page.waitForTimeout(250);const opened=await snapshot(page);check(profile.name+' expanded cycle '+i,opened,{expanded:true,landscape:!!profile.landscape});if(i===0){report.states.open=opened;await page.screenshot({path:`${OUT}/${profile.name}-expanded.png`,fullPage:true})}await page.locator('#k11520UtilityMaster').click({timeout:2500});await page.waitForTimeout(250)}report.states.closedAgain=await snapshot(page);check(profile.name+' after cycles',report.states.closedAgain,{landscape:!!profile.landscape});await page.screenshot({path:`${OUT}/${profile.name}-closed-again.png`,fullPage:true})}
      // Open a simulation preview directly; neither order nor combat needs arming.
      const quotePresent=await page.locator('[data-axis="KX"] .q').textContent().then(s=>Number(String(s).replace(/[$,]/g,''))>0);
      if(PRODUCTION)assert.equal(quotePresent,true,'Public Pages market-data-only quote source must be LIVE');
      if(report.states.cold.boxes['#orderFire']?.hit){await page.locator('#orderFire').click({timeout:2500});await page.locator('#confirm.open').waitFor({timeout:2500});await page.screenshot({path:`${OUT}/${profile.name}-order-preview.png`,fullPage:true});await page.locator('#cancelOrder').click({timeout:2500});report.orderPreview='OPENED_AND_CANCELLED'}
      if(profile.landscape)await finalizeLandscape(page,report);
      if(PRODUCTION&&warnings.some(message=>/blocked by CORS|data-api\.binance\.vision.*ERR_FAILED/i.test(message)))failures.push(`${profile.name}: public quote CORS regression`);
      if(errors.length)failures.push(`${profile.name}: ${errors.join('; ')}`);
    }catch(error){report.error=String(error);failures.push(`${profile.name}: ${String(error)}`);await page.screenshot({path:`${OUT}/${profile.name}-failure.png`,fullPage:true,timeout:5000}).catch(()=>{})}finally{await context.close()}
  }
}finally{await browser.close();await fs.writeFile(`${OUT}/report.json`,JSON.stringify({capturedAt:new Date().toISOString(),base:BASE,head:process.env.K11520_SOURCE_SHA||process.env.GITHUB_SHA||null,sourceChecks,reports,failures},null,2))}
assert.deepEqual(failures,[],'Responsive product failures; inspect screenshots and report.json');
console.log('11520 real-entry responsive/cold-warm/realistic-quotes/real-hit-targets/bounded-thumbs/order-preview/utility-cycles PASS');
