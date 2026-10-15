import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const BASE=process.env.K11520_BASE_URL||'http://127.0.0.1:4173';
const ROUTE='/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html';
const OUT=new URL('../artifacts/11520-first-view-natural/',import.meta.url);
const WORK_ID='K11520-FIRST-VIEW-ZERO-CARDS-NATURE-20261012-001';
await mkdir(OUT,{recursive:true});

const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const evidence=[];

async function snapshot(page,label){
  await page.waitForFunction(()=>globalThis.__K11520_NATURAL_LAND__?.status==='INSTALLED'&&document.documentElement.dataset.k11520HudProfile,{timeout:45_000});
  await page.waitForTimeout(500);
  const result=await page.evaluate(()=>{
    const visible=element=>!!element&&getComputedStyle(element).display!=='none'&&getComputedStyle(element).visibility!=='hidden'&&element.getBoundingClientRect().width>0&&element.getBoundingClientRect().height>0;
    const intro=document.querySelector('#intro11520'),axes=document.querySelector('#axes'),canvas=document.querySelector('#three');
    const rect=canvas.getBoundingClientRect(),probe=document.elementFromPoint(rect.left+rect.width/2,rect.top+rect.height/2);
    return {
      href:location.href,
      introVisible:visible(intro),
      introPointerEvents:intro?getComputedStyle(intro).pointerEvents:null,
      axesVisible:visible(axes),
      marketCardCount:document.querySelectorAll('#axes [data-market-card]').length,
      marketExpanded:document.querySelector('#k11520MarketRow')?.getAttribute('aria-expanded'),
      canvas:{width:rect.width,height:rect.height,webgl:!!(canvas.getContext('webgl2')||canvas.getContext('webgl'))},
      centerHit:{id:probe?.id||'',className:typeof probe?.className==='string'?probe.className:''},
      nature:globalThis.__K11520_NATURAL_LAND__,
      bodyBackground:getComputedStyle(document.body).backgroundColor,
    };
  });
  assert.equal(result.introVisible,false,`${label}: intro must not block the world`);
  assert.equal(result.axesVisible,false,`${label}: market cards must be collapsed on entry/reload`);
  assert.equal(result.marketCardCount,3,`${label}: existing three cards remain available on demand`);
  assert.equal(result.marketExpanded,'false',`${label}: market disclosure state must be collapsed`);
  assert.equal(result.canvas.webgl,true,`${label}: existing WebGL renderer must remain live`);
  assert.ok(result.canvas.width>0&&result.canvas.height>0,`${label}: game canvas must occupy the viewport`);
  assert.ok(!/(^|\s)axes(\s|$)/.test(result.centerHit.className),`${label}: hidden market layer must not own center hit testing`);
  assert.deepEqual(result.nature.instances,{grass:220,wildflowers:64,shrubs:42,rocks:22},`${label}: deterministic vegetation counts`);
  assert.equal(result.nature.rendererLifecycle,'EXISTING_THREE_SCENE',`${label}: no second renderer lifecycle`);
  await page.screenshot({path:new URL(`${label}.png`,OUT).pathname,fullPage:true});
  evidence.push({label,...result});
}

async function verifyViewport(viewport,name){
  const context=await browser.newContext({viewport,deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});

  await page.goto(BASE+ROUTE,{waitUntil:'domcontentloaded',timeout:45_000});
  await snapshot(page,`${name}-guest`);
  assert.deepEqual(errors,[],`${name} guest browser errors`);

  const market=page.locator('#k11520MarketRow');
  await market.click();
  await page.locator('#axes').waitFor({state:'visible'});
  assert.equal(await market.getAttribute('aria-expanded'),'true',`${name}: deliberate Market action expands cards`);
  assert.equal(await page.locator('#axes [data-market-card]:visible').count(),3,`${name}: all three market cards visible after opt-in`);
  await market.click();
  await page.locator('#axes').waitFor({state:'hidden'});

  await page.evaluate(()=>localStorage.setItem('k11520.ui.settings',JSON.stringify({profile:'FULL',markets:true,map:true,telemetry:true,monster:true,params:true,allOn:true})));
  await page.reload({waitUntil:'domcontentloaded',timeout:45_000});
  await snapshot(page,`${name}-returning-full-profile`);
  assert.deepEqual(errors,[],`${name} returning browser errors`);
  await market.click();
  await page.locator('#axes').waitFor({state:'visible'});
  assert.equal(await page.locator('#axes [data-market-card]:visible').count(),3,`${name}: returning player retains deliberate Market access`);
  await context.close();
}

try{
  await verifyViewport({width:390,height:844},'390x844');
  await verifyViewport({width:844,height:390},'844x390');
  await writeFile(new URL('report.json',OUT),JSON.stringify({workId:WORK_ID,status:'PASS',generatedAt:new Date().toISOString(),evidence},null,2)+'\n');
  console.log(JSON.stringify({workId:WORK_ID,status:'PASS',screenshots:evidence.map(item=>item.label),evidence},null,2));
}finally{
  await browser.close();
}
