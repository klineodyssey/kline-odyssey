import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

// Test the real entry. Never import a repair module or change runtime styles from QA.
const OUT='artifacts/11520-responsive-qa';
const BASE=process.env.K11520_BASE_URL||'http://127.0.0.1:4173';
const ROUTE='/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html';
const PRODUCTION=process.env.K11520_PRODUCTION_QA==='1';
const profiles=PRODUCTION?[{name:'pages-390',width:390,height:844},{name:'pages-432',width:432,height:856}]:[
  {name:'cold-390',width:390,height:844},{name:'cold-432',width:432,height:856},
  {name:'warm-412',width:412,height:772,warm:true},{name:'cold-360',width:360,height:740},
  {name:'cold-480',width:480,height:900}
];
const selectors=['.top','.axes','.tele','.monsterHud','.minimapWrap','#joy','#cControl','#lotsControl','#yControl','#cThumb','#lotsThumb','#yThumb','#k11520UtilityMaster','#dock','#walletToggle','#chatHandle','#bgmButton','#aiChatButton','#backpackButton','#gameModeToggle','#k11520HudCollapseAll','#orderFire','#attack'];
const utilities=['#dock','#walletToggle','#chatHandle','#bgmButton','#aiChatButton','#backpackButton','#gameModeToggle','#k11520HudCollapseAll'];
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const reports=[],failures=[];
async function snapshot(page){return page.evaluate(sels=>{
  const box=el=>{if(!el)return null;const r=el.getBoundingClientRect(),s=getComputedStyle(el);const visible=s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&r.width>0&&r.height>0;const h=visible?document.elementFromPoint(r.x+r.width/2,r.y+r.height/2):null;return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,visible,hit:!!h&&(h===el||el.contains(h)),pointer:s.pointerEvents,blocker:h?{id:h.id,classes:String(h.className),pointer:getComputedStyle(h).pointerEvents}:null,scroll:el.scrollHeight,client:el.clientHeight,text:(el.textContent||'').trim().slice(0,240)}};
  return{width:innerWidth,height:innerHeight,boxes:Object.fromEntries(sels.map(s=>[s,box(document.querySelector(s))])),cards:[...document.querySelectorAll('#axes .axis')].map(box),drawers:[...document.querySelectorAll('.hud-drawer-toggle')].map(box),settingsInstalled:!!globalThis.__K11520_UI_SETTINGS__,layoutInstalled:!!globalThis.__K11520_MOBILE_CONTROL_LAYOUT__,xyzInstalled:!!globalThis.__K11520_3D_CONTROL__,utilityOpen:document.documentElement.classList.contains('k11520UtilitiesOpen'),version:document.querySelector('.brandMetaV250')?.textContent};
},selectors)}
function check(label,state){const b=state.boxes;const ok=(value,message)=>{if(!value)failures.push(`${label}: ${message}`)};
  for(const s of ['.top','.tele','.monsterHud','.minimapWrap','#joy','#cControl','#lotsControl','#yControl','#cThumb','#lotsThumb','#yThumb','#k11520UtilityMaster','#orderFire','#attack']){const r=b[s];ok(r?.visible,`${s} missing/hidden`);if(r?.visible)ok(r.x>=-1&&r.y>=-1&&r.right<=state.width+1&&r.bottom<=state.height+1,`${s} outside viewport`)}
  for(const s of ['#joy','#cControl','#lotsControl','#yControl','#k11520UtilityMaster','#orderFire','#attack'])ok(b[s]?.hit,`${s} cannot receive a real click: ${JSON.stringify(b[s]?.blocker)}`);
  ok(state.drawers.every(r=>!r?.visible),'legacy drawer controls visible');
  const maxCard=Math.max(...state.cards.map(r=>r.bottom));
  for(const s of ['.tele','.monsterHud'])if(b[s]){ok(b[s].y>=maxCard+6,`${s} overlaps actual market cards`);ok(b[s].scroll<=b[s].client+1,`${s} clips text`)}
  const rails=['#cControl','#lotsControl','#yControl'].map(s=>b[s]);if(rails.every(Boolean)){ok(rails.every(r=>Math.abs(r.y-rails[0].y)<2),'three rails not aligned');ok(rails[0].right+5<=rails[1].x&&rails[1].right+5<=rails[2].x,'three rails overlap')}
  for(const s of ['#cThumb','#lotsThumb','#yThumb'])if(b[s])ok(Math.abs(b[s].width-b[s].height)<.5,`${s} is not circular`);
  ok(utilities.every(s=>!b[s]?.visible),'collapsed utility lane contains extra controls');
}
try{for(const profile of profiles){const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},isMobile:true,hasTouch:true});const page=await context.newPage();const errors=[],warnings=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(['warning','error'].includes(m.type()))warnings.push(m.text().slice(0,300))});
  if(!PRODUCTION)await page.route('https://api.binance.com/api/v3/ticker/price*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify([{symbol:'BTCUSDT',price:'77564.83000000'},{symbol:'ETHUSDT',price:'2511.16000000'},{symbol:'BNBUSDT',price:'724.23000000'}])}));
  if(profile.warm)await page.addInitScript(()=>{localStorage.setItem('11520.play.cleanMode','1');localStorage.setItem('k11520.joystick.plane','XZ');localStorage.setItem('klineodyssey.public-wallet-identity.v1',JSON.stringify({version:1,address:'0x1234567890123456789012345678901234567890',chainId:56,sourceWorld:'K12345',updatedAt:new Date().toISOString()}))});
  const report={profile,mode:PRODUCTION?'PUBLIC_PAGES_READ_ONLY':'LOCAL_REALISTIC_QUOTE_FIXTURE',errors,warnings,states:{}};reports.push(report);
  try{await page.goto(BASE+ROUTE,{waitUntil:'domcontentloaded',timeout:35000});await page.waitForFunction(()=>globalThis.__K11520_3D_CONTROL__,null,{timeout:20000});await page.waitForTimeout(7500);if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click();
    report.states.cold=await snapshot(page);await page.screenshot({path:`${OUT}/${profile.name}-collapsed.png`,fullPage:true});check(profile.name,report.states.cold);
    if(report.states.cold.boxes['#k11520UtilityMaster']?.hit){for(let i=0;i<3;i++){await page.locator('#k11520UtilityMaster').click({timeout:2500});await page.waitForTimeout(250);if(i===0){report.states.open=await snapshot(page);await page.screenshot({path:`${OUT}/${profile.name}-expanded.png`,fullPage:true})}await page.locator('#k11520UtilityMaster').click({timeout:2500});await page.waitForTimeout(250)}report.states.closedAgain=await snapshot(page);check(profile.name+' after cycles',report.states.closedAgain);await page.screenshot({path:`${OUT}/${profile.name}-closed-again.png`,fullPage:true})}
    // Open/cancel only: no confirmation, wallet connection, signature or transaction.
    if(report.states.cold.boxes['#orderFire']?.hit){await page.locator('#orderFire').click({timeout:2500});await page.locator('#confirm.open').waitFor({timeout:2500});await page.screenshot({path:`${OUT}/${profile.name}-order-preview.png`,fullPage:true});await page.locator('#cancelOrder').click({timeout:2500});report.orderPreview='OPENED_AND_CANCELLED'}
    if(errors.length)failures.push(`${profile.name}: ${errors.join('; ')}`);
  }catch(error){report.error=String(error);failures.push(`${profile.name}: ${String(error)}`);await page.screenshot({path:`${OUT}/${profile.name}-failure.png`,fullPage:true,timeout:5000}).catch(()=>{})}finally{await context.close()}
}}finally{await browser.close();await fs.writeFile(`${OUT}/report.json`,JSON.stringify({capturedAt:new Date().toISOString(),base:BASE,head:process.env.GITHUB_SHA||null,reports,failures},null,2))}
assert.deepEqual(failures,[],'Responsive product failures; inspect screenshots and report.json');
console.log('11520 real-entry responsive/cold-warm/realistic-quotes/real-hit-targets/order-preview/utility-cycles PASS');
