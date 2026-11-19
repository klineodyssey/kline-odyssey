import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const OUT='artifacts/11520-visual-qa';
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.K11520_CHROMIUM_PATH?{executablePath:process.env.K11520_CHROMIUM_PATH}:{})});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
// Plane-map fixed-controller regression; fresh floating input has native QA.
await page.addInitScript(()=>localStorage.setItem('k11520.ui.settings',JSON.stringify({profile:'FULL'})));
await page.addInitScript(()=>{try{if(!localStorage.getItem('k11520.joystick.plane'))localStorage.setItem('k11520.joystick.plane','XZ')}catch{}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
const GAME=(process.env.K11520_BASE_URL||'http://127.0.0.1:4173')+'/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html';
const enter=async()=>{await page.waitForFunction(()=>globalThis.__K11520_XYZ_MAP_NAV_INSTALLED__===true&&globalThis.__K11520_XYZ_INPUT_AUTHORITY__?.legacyXZBubbleSuppressed===true,null,{timeout:45000});if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click().catch(()=>{});await page.waitForTimeout(800);assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));await page.waitForFunction(()=>globalThis.__K11520_XYZ_INPUT_AUTHORITY__?.legacyXZBubbleSuppressed===true,null,{timeout:3000});await page.waitForFunction(()=>{const nav=globalThis.__K11520_XYZ_MAP_NAVIGATION__;return globalThis.__K11520_XYZ_MAP_NAV_INSTALLED__===true&&nav?.legacyXZPreserved===false&&nav.worldTargetAuthority===true&&nav.collisionAuthority==='game-5d-main.moveManual'&&typeof nav.setWorldTarget==='function'&&typeof nav.start==='function'&&typeof nav.stop==='function'},null,{timeout:3000})};
await page.goto(GAME,{waitUntil:'domcontentloaded',timeout:30000});await enter();
await page.locator('#kspaceViewXYZ').click();
await page.waitForFunction(()=>globalThis.__K11520_PLANE_MAP__?.mode==='XZ',null,{timeout:3000});
assert.ok(await page.locator('#minimap').count(),'minimap missing');
assert.ok(await page.locator('.k11520PlaneMapOverlay').count(),'plane map overlay missing');

const tapCenter=async(id)=>{const b=await page.locator('#knob').boundingBox();assert.ok(b,'joystick thumb missing');const p={pointerId:id,pointerType:'touch',clientX:b.x+b.width/2,clientY:b.y+b.height/2,buttons:1};await page.dispatchEvent('#joy','pointerdown',p);await page.waitForTimeout(70);await page.dispatchEvent('#joy','pointerup',{...p,buttons:0});await page.waitForTimeout(260)};
const plane=async()=>page.evaluate(()=>structuredClone(globalThis.__K11520_PLANE_MAP__));
const coords=async()=>page.evaluate(()=>structuredClone(globalThis.__K11520_WORLD_COORDS__?.physical||{x:0,y:0,z:0}));
const mapTap=async(fx,fy,id)=>{const b=await page.locator('#minimap').boundingBox();assert.ok(b,'minimap box missing');const p={pointerId:id,pointerType:'touch',clientX:b.x+b.width*fx,clientY:b.y+b.height*fy,buttons:1};await page.dispatchEvent('#minimap','pointerdown',p);await page.waitForTimeout(40);await page.dispatchEvent('#minimap','pointerup',{...p,buttons:0});await page.waitForTimeout(120)};
const worldCanvasTap=async(fx,fy,id)=>{const b=await page.locator('#three').boundingBox();assert.ok(b,'3D canvas missing');const p={pointerId:id,pointerType:'touch',clientX:b.x+b.width*fx,clientY:b.y+b.height*fy,buttons:1};await page.dispatchEvent('#three','pointerdown',p);await page.waitForTimeout(45);await page.dispatchEvent('#three','pointerup',{...p,buttons:0});await page.waitForTimeout(160)};
const startPlaneNav=async()=>{assert.equal(await page.locator('#xyzWaypointAction').count(),1,'waypoint action missing');const started=await page.evaluate(()=>globalThis.__K11520_XYZ_MAP_NAVIGATION__?.start?.()===true);assert.equal(started,true,'waypoint navigation failed to start');await page.waitForFunction(()=>globalThis.__K11520_XYZ_MAP_NAVIGATION__?.active===true,null,{timeout:2000})};
const cancelPlaneNav=async(id)=>{const b=await page.locator('#joy').boundingBox();assert.ok(b);const p={pointerId:id,pointerType:'touch',clientX:b.x+b.width*.80,clientY:b.y+b.height*.50,buttons:1};await page.dispatchEvent('#joy','pointerdown',p);await page.waitForTimeout(50);await page.dispatchEvent('#joy','pointerup',{...p,buttons:0});await page.waitForTimeout(120)};

let m=await plane();assert.equal(m.mode,'XZ');assert.equal(m.hAxis,'X');assert.equal(m.vAxis,'Z');assert.equal(m.depthAxis,'Y');assert.equal(m.normalAxis,'KY');
await page.screenshot({path:`${OUT}/11520-plane-map-xz.png`,fullPage:true});

await tapCenter(701);await page.waitForFunction(()=>globalThis.__K11520_PLANE_MAP__?.mode==='XY',null,{timeout:2000});m=await plane();assert.equal(m.hAxis,'X');assert.equal(m.vAxis,'Y');assert.equal(m.depthAxis,'Z');assert.equal(m.normalAxis,'KZ');
const xy0=await coords();await mapTap(.72,.34,711);await page.waitForFunction(()=>globalThis.__K11520_XYZ_MAP_NAVIGATION__?.target&&globalThis.__K11520_XYZ_MAP_NAVIGATION__.mode==='XY',null,{timeout:2000});
const xyt=await page.evaluate(()=>structuredClone(globalThis.__K11520_XYZ_MAP_NAVIGATION__.target));assert.ok(xyt.x>xy0.x);assert.ok(xyt.y>=xy0.y);assert.equal(Number(xyt.z.toFixed(3)),Number(xy0.z.toFixed(3)));
await startPlaneNav();await page.waitForFunction(([x,y])=>{const p=globalThis.__K11520_WORLD_COORDS__?.physical||{};return Math.abs((p.x||0)-x)>.12||Math.abs((p.y||0)-y)>.12},[xy0.x,xy0.y],{timeout:4000});
await cancelPlaneNav(712);assert.equal(await page.evaluate(()=>globalThis.__K11520_XYZ_MAP_NAVIGATION__?.active),false);
await page.screenshot({path:`${OUT}/11520-plane-map-xy.png`,fullPage:true});

// The dedicated controller QA already proves the live XZ -> XY -> YZ center-tap cycle.
// Reloading a persisted YZ mode keeps this plane-map test focused on YZ projection/navigation itself.
await page.evaluate(()=>localStorage.setItem('k11520.joystick.plane','YZ'));
await page.reload({waitUntil:'domcontentloaded',timeout:30000});await enter();
await page.locator('#kspaceViewXYZ').click();
await page.waitForFunction(()=>globalThis.__K11520_PLANE_MAP__?.mode==='YZ',null,{timeout:3000});m=await plane();assert.equal(m.hAxis,'Y');assert.equal(m.vAxis,'Z');assert.equal(m.depthAxis,'X');assert.equal(m.normalAxis,'KX');
const yz0=await coords();await mapTap(.70,.66,721);await page.waitForFunction(()=>globalThis.__K11520_XYZ_MAP_NAVIGATION__?.target&&globalThis.__K11520_XYZ_MAP_NAVIGATION__.mode==='YZ',null,{timeout:2000});
const yzt=await page.evaluate(()=>structuredClone(globalThis.__K11520_XYZ_MAP_NAVIGATION__.target));assert.equal(Number(yzt.x.toFixed(3)),Number(yz0.x.toFixed(3)));assert.ok(Math.abs(yzt.y-yz0.y)>.1||Math.abs(yzt.z-yz0.z)>.1);
await startPlaneNav();await page.waitForTimeout(180);
// Read intent and the committed physical result together from the one actor
// clock. Navigation no longer writes a competing public joystick vector.
const yzNav=await page.evaluate(()=>{const motion=globalThis.__K11520_LOCAL_MOTION__;return {active:globalThis.__K11520_XYZ_MAP_NAVIGATION__?.active,mode:globalThis.__K11520_XYZ_MAP_NAVIGATION__?.mode,intentDelta:structuredClone(motion?.intentDelta||{}),position:structuredClone(motion?.position||{}),physical:structuredClone(globalThis.__K11520_WORLD_COORDS__?.physical||{}),status:motion?.status,distanceMoved:motion?.distanceMoved}});assert.equal(yzNav.active,true);assert.equal(yzNav.mode,'YZ');assert.ok(Math.abs(Number(yzNav.intentDelta.y)||0)>.01||Math.abs(Number(yzNav.intentDelta.z)||0)>.01,'YZ waypoint must publish Y/Z movement intent: '+JSON.stringify(yzNav));
assert.equal(yzNav.status,'MOVING','YZ intent must commit physical movement in that same frame: '+JSON.stringify(yzNav));assert.ok(yzNav.distanceMoved>0);assert.deepEqual(yzNav.position,yzNav.physical);assert.ok(Math.abs(yzNav.physical.y-yz0.y)>.01||Math.abs(yzNav.physical.z-yz0.z)>.01,'YZ waypoint must make physical Y/Z progress');assert.equal(Number(yzNav.physical.x.toFixed(3)),Number(yz0.x.toFixed(3)),'YZ motion must preserve physical X');assert.ok(Math.abs(Number(yzNav.intentDelta.x)||0)<1e-10,'YZ intent must preserve X');
await page.evaluate(()=>globalThis.__K11520_XYZ_MAP_NAVIGATION__?.stop?.('YZ plane map QA stop'));await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>globalThis.__K11520_XYZ_MAP_NAVIGATION__?.active),false);await page.screenshot({path:`${OUT}/11520-plane-map-yz.png`,fullPage:true});

const world0=await coords(),worldTarget={x:world0.x+1.2,y:world0.y+1.1,z:world0.z-1.0};
await page.evaluate(target=>{const nav=globalThis.__K11520_XYZ_MAP_NAVIGATION__;nav.setWorldTarget(target,{mode:'WORLD',source:'WORLD_ENTITY'});nav.start()},worldTarget);
await page.waitForFunction(()=>globalThis.__K11520_XYZ_MAP_NAVIGATION__?.active===true&&globalThis.__K11520_XYZ_MAP_NAVIGATION__?.source==='WORLD_ENTITY'&&globalThis.__K11520_XYZ_MAP_NAVIGATION__?.worldTargetAuthority===true,null,{timeout:2000});
const publishedTarget=await page.evaluate(()=>structuredClone(globalThis.__K11520_XYZ_MAP_NAVIGATION__.target));for(const k of ['x','y','z'])assert.equal(Number(publishedTarget[k].toFixed(3)),Number(worldTarget[k].toFixed(3)));
await page.waitForFunction(([x,y,z])=>{const p=globalThis.__K11520_WORLD_COORDS__?.physical||{};return Math.hypot((p.x||0)-x,(p.y||0)-y,(p.z||0)-z)>.16},[world0.x,world0.y,world0.z],{timeout:4000});
await page.evaluate(()=>globalThis.__K11520_XYZ_MAP_NAVIGATION__.stop('WORLD target QA stop'));

// A fixed screen pixel is not a ground fixture once market-life actors roam.
// Select actual empty world through the existing read-only hit-test, then send
// a real browser click. Keep the canonical WORLD_GROUND and XYZ assertions.
const tap0=await coords();let groundNavigationActive=false;
const groundPickerTrace=[],triedGroundPoints=new Set();let groundPickerError=null;
await page.evaluate(()=>{
  const fixture={sequence:0,lastRoute:null},canvas=document.querySelector('#three');
  fixture.read=point=>{const nav=globalThis.__K11520_XYZ_MAP_NAVIGATION__,owner=point?document.elementFromPoint(point.x,point.y):null;return {at:performance.now(),physical:{...globalThis.__K11520_WORLD_COORDS__?.physical},navigation:nav?{active:nav.active,source:nav.source,mode:nav.mode,target:nav.target?{...nav.target}:null}:null,routeSequence:fixture.sequence,lastRoute:fixture.lastRoute,pointOwner:point?{id:owner?.id||null,tag:owner?.tagName||null}:null}};
  fixture.onRoute=event=>{const d=event.detail||{};fixture.sequence++;fixture.lastRoute={at:performance.now(),route:d.route,entityType:d.entityType,entityId:d.entityId,x:d.x,y:d.y,z:d.z}};
  canvas.addEventListener('k11520:world-tap',fixture.onRoute);globalThis.__K11520_QA_GROUND_PICKER__=fixture;
});
try{
  for(let attempt=0;attempt<8&&!groundNavigationActive;attempt++){
    const pick=await page.evaluate(tried=>{
      const canvas=document.querySelector('#three'),r=canvas.getBoundingClientRect(),began=performance.now(),radius=10,step=20,visited=new Set(tried),domCache=new Map();
      const before=__K11520_QA_GROUND_PICKER__.read(),stats={candidates:0,triedRejected:0,domReads:0,domRejected:0,canonicalReads:0,canonicalRejected:0,firstDomBlock:null,lastDomBlock:null};
      const canvasAt=(x,y)=>{const key=x+','+y;if(!domCache.has(key)){const owner=document.elementFromPoint(x,y);stats.domReads++;domCache.set(key,owner===canvas);if(owner!==canvas){const blocked={x,y,id:owner?.id||null,tag:owner?.tagName||null};stats.firstDomBlock??=blocked;stats.lastDomBlock=blocked}}return domCache.get(key)};
      const ys=[];for(let y=Math.max(0,r.top)+radius;y<=Math.min(innerHeight,r.bottom)-radius;y+=step)ys.push(y);if(innerWidth<=innerHeight)ys.reverse();
      const finish=point=>({point,before,stats:{...stats,elapsedMs:performance.now()-began},canvasRect:{x:r.x,y:r.y,width:r.width,height:r.height},radius,step});
      for(const y of ys)for(let x=Math.max(0,r.left)+radius;x<=Math.min(innerWidth,r.right)-radius;x+=step){
        stats.candidates++;if(visited.has(x+','+y)){stats.triedRejected++;continue}
        if(![-radius,0,radius].every(dx=>[-radius,0,radius].every(dy=>canvasAt(x+dx,y+dy)))){stats.domRejected++;continue}
        stats.canonicalReads++;if(!__K11520_CAMERA__.isWorldGestureArea(x,y,radius)){stats.canonicalRejected++;continue}
        return finish({x,y});
      }
      return finish(null);
    },[...triedGroundPoints]);
    const row={attempt:attempt+1,...pick};groundPickerTrace.push(row);
    if(!pick.point){row.after=await page.evaluate(()=>__K11520_QA_GROUND_PICKER__.read());continue}
    const ground=pick.point;triedGroundPoints.add(ground.x+','+ground.y);
    await page.mouse.click(ground.x,ground.y);
    groundNavigationActive=await page.waitForFunction(()=>globalThis.__K11520_XYZ_MAP_NAVIGATION__?.active===true&&globalThis.__K11520_XYZ_MAP_NAVIGATION__?.source==='WORLD_GROUND'&&globalThis.__K11520_XYZ_MAP_NAVIGATION__?.mode==='WORLD',null,{timeout:750}).then(()=>true,()=>false);
    row.navigationStarted=groundNavigationActive;row.after=await page.evaluate(point=>__K11520_QA_GROUND_PICKER__.read(point),ground);
    if(!groundNavigationActive&&await page.locator('#sheet.open').isVisible()){await page.locator('#sheetClose').click();row.entitySheetClosed=true}
  }
  assert.equal(groundNavigationActive,true,'a fresh empty-world click must start canonical WORLD_GROUND navigation');
  const groundTarget=await page.evaluate(()=>structuredClone(globalThis.__K11520_XYZ_MAP_NAVIGATION__.target));assert.equal(Number(groundTarget.y.toFixed(3)),0);assert.ok(Math.abs(groundTarget.x-tap0.x)>.1||Math.abs(groundTarget.z-tap0.z)>.1,'world tap did not create a distinct XYZ target');
  await page.waitForFunction(([x,y,z])=>{const p=globalThis.__K11520_WORLD_COORDS__?.physical||{};return Math.hypot((p.x||0)-x,(p.y||0)-y,(p.z||0)-z)>.12},[tap0.x,tap0.y,tap0.z],{timeout:4000});
  await page.screenshot({path:`${OUT}/11520-world-tap-xyz.png`,fullPage:true});
  await page.evaluate(()=>globalThis.__K11520_XYZ_MAP_NAVIGATION__.stop('WORLD canvas tap QA stop'));
}catch(error){groundPickerError=String(error?.stack||error).slice(0,4000);throw error}
finally{
  const final=await page.evaluate(()=>__K11520_QA_GROUND_PICKER__.read()).catch(()=>null);
  if(groundPickerTrace.length&&!groundPickerTrace.at(-1).after)groundPickerTrace.at(-1).after=final;
  await fs.writeFile(`${OUT}/11520-plane-map-ground-picker.json`,JSON.stringify({head:process.env.K11520_SOURCE_SHA||null,profile:page.viewportSize(),status:groundPickerError?'FAIL':'WORLD_GROUND_VERIFIED',error:groundPickerError,beforePhysical:tap0,attemptLimit:8,attempts:groundPickerTrace,final},null,2));
  if(groundPickerError)await page.screenshot({path:`${OUT}/11520-plane-map-ground-picker-failure.png`,fullPage:true,timeout:1500}).catch(()=>{});
  await page.evaluate(()=>{const fixture=globalThis.__K11520_QA_GROUND_PICKER__;document.querySelector('#three')?.removeEventListener('k11520:world-tap',fixture?.onRoute);delete globalThis.__K11520_QA_GROUND_PICKER__}).catch(()=>{});
}

const authority=await page.evaluate(()=>structuredClone(globalThis.__K11520_XYZ_INPUT_AUTHORITY__));
assert.equal(authority.authoritative,true);assert.equal(authority.legacyXZBubbleSuppressed,true);
assert.deepEqual(errors,[],'page errors after XYZ navigation: '+errors.join('\n'));
await browser.close();
console.log('11520 authoritative XYZ input + plane maps + canonical WORLD target + direct 3D world tap routing browser QA PASS');
