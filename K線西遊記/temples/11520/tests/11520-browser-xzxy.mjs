import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const OUT='artifacts/11520-visual-qa';
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await page.addInitScript(()=>{try{localStorage.setItem('k11520.joystick.plane','XZ')}catch{}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:4173/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1800);
if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click({timeout:1500}).catch(()=>{});
await page.locator('#intro11520').waitFor({state:'hidden',timeout:3000}).catch(()=>{});
await page.waitForTimeout(700);
assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));

// This suite verifies the canonical XYZ controller itself, not a trading-speed selection.
// Pin the actual C rail to the ordinary local-walk baseline so the unbounded-coordinate
// assertions cannot inherit the selected market card's default low-C trading state.
const cBox=await page.locator('#cControl').boundingBox();assert.ok(cBox,'C rail missing');
const cPid=77,cx=cBox.x+cBox.width/2,cy=cBox.y+cBox.height*.94;
await page.dispatchEvent('#cControl','pointerdown',{pointerId:cPid,pointerType:'touch',clientX:cx,clientY:cy,buttons:1});
await page.dispatchEvent('#cControl','pointermove',{pointerId:cPid,pointerType:'touch',clientX:cx,clientY:cy,buttons:1});
await page.dispatchEvent('#cControl','pointerup',{pointerId:cPid,pointerType:'touch',clientX:cx,clientY:cy,buttons:0});
await page.waitForFunction(()=>document.querySelector('#cRead')?.textContent?.trim()==='0C'&&globalThis.__K11520_COMBAT_DRIVE__?.c===0&&globalThis.__K11520_COMBAT_DRIVE__?.cMode==='LOCAL_WALK',null,{timeout:2500});

const xyz=async()=>{const t=await page.locator('#xyz').textContent();const m=String(t).match(/X\s*(-?\d+(?:\.\d+)?)\s*·\s*Y\s*(-?\d+(?:\.\d+)?)\s*·\s*Z\s*(-?\d+(?:\.\d+)?)/);assert.ok(m,'XYZ parse failed: '+t);return{x:+m[1],y:+m[2],z:+m[3]}};
const world=async()=>page.evaluate(()=>structuredClone(globalThis.__K11520_WORLD_COORDS__||null));
const control=async()=>page.evaluate(()=>structuredClone(globalThis.__K11520_3D_CONTROL__||null));
const normal=async()=>page.evaluate(()=>structuredClone(globalThis.__K11520_NORMAL_MARKET__||null));
const mobileLayout=async()=>page.evaluate(()=>structuredClone(globalThis.__K11520_MOBILE_CONTROL_LAYOUT__||null));
const joyBox=async()=>{const b=await page.locator('#joy').boundingBox();assert.ok(b,'joy missing');return b};
const railBox=async()=>{const b=await page.locator('#yControl').boundingBox();assert.ok(b,'axis rail missing');return b};
const knobBox=async()=>{const b=await page.locator('#knob').boundingBox();assert.ok(b,'knob missing');return b};
const center=b=>({x:b.x+b.width/2,y:b.y+b.height/2});
const point=(b,x,y,buttons=1,id=1)=>({pointerId:id,pointerType:'touch',clientX:b.x+b.width*x,clientY:b.y+b.height*y,buttons});
const drag=async(toX,toY,id,hold=300)=>{const b=await joyBox();await page.dispatchEvent('#joy','pointerdown',point(b,.5,.5,1,id));await page.dispatchEvent('#joy','pointermove',point(b,toX,toY,1,id));await page.waitForTimeout(hold);await page.dispatchEvent('#joy','pointerup',point(b,toX,toY,0,id));await page.waitForTimeout(120)};
const assertThumbFollows=async()=>{const b=await joyBox(),k0=await knobBox(),c0=center(k0),p0=point(b,.5,.5,1,91),p1=point(b,.88,.22,1,91);await page.dispatchEvent('#joy','pointerdown',p0);await page.dispatchEvent('#joy','pointermove',p1);await page.waitForTimeout(100);const k1=await knobBox(),c1=center(k1),travel=Math.hypot(c1.x-c0.x,c1.y-c0.y),limit=Math.min(b.width,b.height)/2*.70;assert.ok(c1.x>c0.x+12,`joystick thumb must follow finger right: ${JSON.stringify({c0,c1})}`);assert.ok(c1.y<c0.y-10,`joystick thumb must follow finger up: ${JSON.stringify({c0,c1})}`);assert.ok(travel<=limit+2,`joystick thumb must remain clamped: ${JSON.stringify({travel,limit,c0,c1})}`);assert.equal(await page.locator('#joy').getAttribute('data-k11520-disc-active'),'1','drag visual state missing');await page.screenshot({path:`${OUT}/11520-mobile-joystick-follow.png`,fullPage:true});await page.dispatchEvent('#joy','pointerup',{...p1,buttons:0});await page.waitForTimeout(180);const c2=center(await knobBox());assert.ok(Math.hypot(c2.x-c0.x,c2.y-c0.y)<3,`joystick thumb must ease back to center: ${JSON.stringify({c0,c2})}`);assert.equal(await page.locator('#joy').getAttribute('data-k11520-disc-active'),'0','thumb follow state must clear after release')};
const dragRail=async(toY,id,hold=320)=>{const b=await railBox(),p0=point(b,.5,.5,1,id),p1=point(b,.5,toY,1,id);await page.dispatchEvent('#yControl','pointerdown',p0);await page.dispatchEvent('#yControl','pointermove',p1);await page.waitForTimeout(hold);await page.dispatchEvent('#yControl','pointerup',{...p1,buttons:0});await page.waitForTimeout(120)};
const tapCenter=async id=>{const b=await joyBox(),p=point(b,.5,.5,1,id);await page.dispatchEvent('#joy','pointerdown',p);await page.waitForTimeout(70);await page.dispatchEvent('#joy','pointerup',{...p,buttons:0});await page.waitForTimeout(180)};
const visible=async sel=>{const r=await page.locator(sel).evaluate(el=>{const b=el.getBoundingClientRect(),s=getComputedStyle(el);return{x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom,display:s.display,visibility:s.visibility,opacity:s.opacity,pointer:s.pointerEvents}});assert.ok(r.w>0&&r.h>0&&r.display!=='none'&&r.visibility!=='hidden'&&r.opacity!=='0',`${sel} not visible ${JSON.stringify(r)}`);return r};
const near=(a,b,t=.16)=>Math.abs(a-b)<=t;
const assertFixed=(label,a,b,key)=>assert.ok(near(a[key],b[key]),`${label} must preserve ${key.toUpperCase()}: ${JSON.stringify({a,b})}`);
const assertNoDrift=async label=>{const a=await xyz();await page.waitForTimeout(400);const b=await xyz();assert.ok(near(a.x,b.x)&&near(a.y,b.y)&&near(a.z,b.z),`${label} drifted: ${JSON.stringify({a,b})}`)};
const assertKgenArt=async()=>{const src=await page.locator('#knob img').getAttribute('src');assert.ok(String(src).startsWith('data:image/')||/kgen-user-ui\.webp$/.test(String(src)),`XZ must use approved KGEN art: ${String(src).slice(0,80)}`)};
const assertNormal=async(mode,axis)=>{await page.waitForFunction(([m,a])=>globalThis.__K11520_NORMAL_MARKET__?.mode===m&&globalThis.__K11520_NORMAL_MARKET__?.normalAxis===a,[mode,axis],{timeout:2000});const n=await normal();assert.equal(n.marketsRemainConcurrent,true);assert.equal(n.tradingAxisUntouched,true);const cards=page.locator('[data-axis]');assert.equal(await cards.count(),3,'all KX/KY/KZ markets must remain visible');await page.waitForFunction(a=>document.querySelector(`[data-axis="${a}"].k11520NormalActive`),axis,{timeout:2000});assert.ok(await page.locator(`[data-axis="${axis}"].k11520NormalActive`).count(),`${axis} must be normal-active`)};

await visible('#joy');await visible('#knob');await visible('#knob img');await visible('#yControl');
let c=await control();assert.equal(c.mode,'XZ');assert.deepEqual(c.discAxes,['X','Z']);assert.equal(c.railAxis,'Y');assert.equal(c.unboundedCoordinateIntent,true);await assertKgenArt();await assertNormal('XZ','KY');assert.match(await page.locator('#yControl label').textContent(),/Y 縱搖桿/);
await assertThumbFollows();
let p0=await xyz();await drag(.90,.50,101);let p1=await xyz();assert.ok(p1.x>p0.x,'XZ right must X+');assertFixed('XZ right',p0,p1,'y');
await drag(.50,.10,102);let p2=await xyz();assert.ok(p2.z>p1.z,'XZ up must Z+');assertFixed('XZ up',p1,p2,'y');
let w0=await world();await dragRail(.90,103,420);let w1=await world();assert.ok(w1.intent.y<w0.intent.y,'XZ rail down must advance Y- intent');assert.ok(near(w1.physical.y,w0.physical.y,.08),'ground must block physical body while Y intent keeps changing');
let w2=w1;for(let i=0;i<15&&w2.intent.y<=40;i++){await dragRail(.10,104+i,2000);w2=await world()}assert.ok(w2.intent.y>40,`Y intent must cross legacy 40 independent of frame rate: ${JSON.stringify(w2)}`);assert.ok(w2.physical.y>40,`physical Y must be able to leave legacy 0..40 world band: ${JSON.stringify(w2)}`);
await page.screenshot({path:`${OUT}/11520-mobile-xz-ground.png`,fullPage:true});

await tapCenter(201);c=await control();assert.equal(c.mode,'XY');assert.deepEqual(c.discAxes,['X','Y']);assert.equal(c.railAxis,'Z');await page.waitForFunction(()=>document.documentElement.dataset.k11520AvatarMotion==='FLIGHT_XY',{timeout:2500});assert.match(await page.locator('#knob img').getAttribute('src'),/goddess-ui\.webp$/);assert.match(await page.locator('#yControl label').textContent(),/Z 縱搖桿/);await assertNormal('XY','KZ');await assertNoDrift('XZ→XY');
let q0=await xyz();await drag(.50,.10,202);let q1=await xyz();assert.ok(q1.y>q0.y,'XY up must Y+');assertFixed('XY up',q0,q1,'z');
await drag(.90,.50,203);let q2=await xyz();assert.ok(q2.x>q1.x,'XY right must X+');assertFixed('XY right',q1,q2,'z');
await dragRail(.10,204,420);let q3=await xyz();assert.ok(q3.z>q2.z,'XY rail up must Z+');assertFixed('XY rail',q2,q3,'y');
await page.screenshot({path:`${OUT}/11520-mobile-xy-flight.png`,fullPage:true});

await tapCenter(301);c=await control();assert.equal(c.mode,'YZ');assert.deepEqual(c.discAxes,['Y','Z']);assert.equal(c.railAxis,'X');await page.waitForFunction(()=>document.documentElement.dataset.k11520AvatarMotion==='FLIGHT_YZ',{timeout:2500});const heartSrc=await page.locator('#knob img').getAttribute('src');assert.ok(String(heartSrc).startsWith('data:image/webp;base64,'),'YZ must use human-approved heart image');assert.match(await page.locator('#yControl label').textContent(),/X 縱搖桿/);await assertNormal('YZ','KX');await assertNoDrift('XY→YZ');
let r0=await xyz();await drag(.90,.50,302);let r1=await xyz();assert.ok(r1.y>r0.y,'YZ right must Y+');assertFixed('YZ right',r0,r1,'x');
await drag(.50,.10,303);let r2=await xyz();assert.ok(r2.z>r1.z,'YZ up must Z+');assertFixed('YZ up',r1,r2,'x');
await dragRail(.10,304,420);let r3=await xyz();assert.ok(r3.x>r2.x,'YZ rail up must X+');
await page.screenshot({path:`${OUT}/11520-mobile-yz-flight.png`,fullPage:true});

await tapCenter(401);c=await control();assert.equal(c.mode,'XZ','third tap must cycle YZ→XZ');await page.waitForFunction(()=>document.documentElement.dataset.k11520AvatarMotion==='GROUND',{timeout:2500});await assertKgenArt();await assertNormal('XZ','KY');await assertNoDrift('YZ→XZ');

const attack=await visible('#attack'),order=await visible('#orderFire'),joy=await visible('#joy'),dock=await visible('#dockToggle');for(const [name,b] of [['attack',attack],['order',order]]){assert.ok(b.x>=0&&b.right<=390&&b.y>=0&&b.bottom<=844,`${name} must remain inside mobile viewport`);assert.ok(b.bottom<joy.y,`${name} quick action must sit above circular joystick zone`);assert.ok(!(b.x<dock.right&&b.right>dock.x&&b.y<dock.bottom&&b.bottom>dock.y),`${name} must not overlap dock toggle`)}
await visible('#cControl');await visible('#lotsControl');await visible('#yControl');
await page.waitForFunction(()=>document.documentElement.dataset.k11520MobileControlLayout==='PASS',{timeout:3500});const layout=await mobileLayout();assert.ok(layout,'mobile layout report missing');assert.equal(layout.ok,true,JSON.stringify(layout));for(const [key,value] of Object.entries(layout.overlaps||{}))assert.equal(value,false,`mobile control overlap ${key}: ${JSON.stringify(layout)}`);

await visible('#gameModeToggle');await page.locator('#gameModeToggle').click({timeout:2000});await page.waitForTimeout(120);await visible('#k11520UiSettings');
const labels=await page.locator('#k11520UiSettings .row span').allTextContents();assert.ok(labels.includes('聊天'),'settings must retain chat');assert.ok(!labels.includes('錢包')&&!labels.includes('背包'),'wallet/backpack must not be globally collapsible');await page.locator('#k11520UiSettingsClose').click();
await page.waitForTimeout(120);await page.screenshot({path:`${OUT}/11520-mobile-390x844.png`,fullPage:true});
await fs.writeFile(`${OUT}/11520-xzxy-layout.json`,JSON.stringify({capturedAt:new Date().toISOString(),organ:'XYZ Plane Joystick',mode:(await control()).mode,xyz:await xyz(),world:await world(),controller:await control(),normalMarket:await normal(),mobileControlLayout:layout,quickActions:{attack,order}},null,2));
await browser.close();
console.log('11520 XZ+Y / XY+Z / YZ+X controller + touch-follow thumb + normal market + mobile control layout browser QA PASS');
