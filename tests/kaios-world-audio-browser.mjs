// Real browser: current 12345 cockpit contract and shared world audio.
// Retired Heart transaction DOM is not revived or represented as newly passed.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {chromium} from 'playwright';

assert.equal(process.env.GITHUB_ACTIONS,'true','world browser QA is CI-only');
assert.equal(process.platform,'linux','use the existing Linux CI browser');
const BASE=(process.env.KAIOS_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const ROOT=new URL(BASE+'/');
assert.ok(['localhost','127.0.0.1','[::1]'].includes(ROOT.hostname),'QA entry must use the existing CI loopback server');
const OUT='artifacts/kaios-portal-qa';
const TEMPLE='/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/12345/';
const ENTRY=BASE+TEMPLE+'index.html',COCKPIT=BASE+TEMPLE+'cockpit.html';
const NOTICE='模擬驗收／未連真錢包';
const A='0x1111111111111111111111111111111111111111',B='0x2222222222222222222222222222222222222222';
const KGEN='0xba3d3810e58735cb6813bc1cdc5458c0d71432be',KAIOS='0xd4e67b3a69e41524c424150e6b6e921b01d036db';
const preservation=process.argv.includes('--preservation'),heartOnly=process.argv.includes('--heart-only'),
 walletOnly=process.argv.includes('--wallet-only'),layoutOnly=process.argv.includes('--layout-only');
const reports=[];
const config=JSON.parse(await fs.readFile(new URL('../K線西遊記/temples/12345/config/contracts.json',import.meta.url),'utf8'));
const cockpitSource=await fs.readFile(new URL('../K線西遊記/temples/12345/cockpit.html',import.meta.url),'utf8');
const READS=new Set(['eth_chainId','net_version','eth_accounts','eth_blockNumber','eth_getLogs','eth_getCode','eth_getBalance','eth_getBlockByNumber','eth_call']);
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=user-gesture-required']});
reports.push({id:'12345-current-contract-migration',mode:'CI_SYNTHETIC_PROVIDER_NO_REAL_WALLET',
 sourceMain:'d5266ab9150a34cfd371da4d0e84a3a989677aa4',canonicalEntry:'index.html -> cockpit.html',
 mappings:{wallet:'CURRENT_EXPLICIT_BSC56_IDENTITY_AND_PUBLIC_BALANCES',Heart:'RETIRED_LIVE_UI_NOT_EXECUTED; CURRENT_FINANCIAL_DENIAL_CHECKED',
 layout:'CURRENT_COCKPIT_TABS_FLIGHT_TRADE_WALLET_BANK_AND_RETURN',audio:'EXISTING_SHARED_AUTHORITY_AND_UNCHANGED_PCM_THRESHOLDS'},
 retiredLegacyHeartTransactions:'NOT_TESTED_CURRENT_PRODUCT_RETIRED',realTransactions:0,realWallet:'NOT_TESTED',
 physicalAndroid:'NOT_TESTED',walletConnectRelay:'NOT_TESTED',actualBFCache:'NOT_TESTED',
 sourceSha256:{cockpit:createHash('sha256').update(cockpitSource).digest('hex'),
  browser:createHash('sha256').update(await fs.readFile(new URL('./kaios-world-audio-browser.mjs',import.meta.url))).digest('hex')}});

async function until(read,accept,label,timeout=15000){
 const end=Date.now()+timeout;let value;
 do{value=await read();if(accept(value))return value;await new Promise(resolve=>setTimeout(resolve,75));}while(Date.now()<end);
 throw new Error(label+' timed out; last='+JSON.stringify(value));
}
async function stable(page){await page.locator('#bootStatus[data-state=ready]').waitFor();await page.locator('#gameShell:not([inert])').waitFor();}
async function failureGeometry(page){
 return page.evaluate(()=>Object.fromEntries(['body','#bootStatus','#gameShell','.mast','#cockpitTabs','#routePanel','#cockpitPages','#page-trade','#page-flight'].map(selector=>{
  const node=document.querySelector(selector);if(!node)return [selector,null];
  const rect=node.getBoundingClientRect(),style=getComputedStyle(node);
  return [selector,{hidden:node.hidden,x:rect.x,y:rect.y,width:rect.width,height:rect.height,scrollHeight:node.scrollHeight,display:style.display,overflow:style.overflow,rows:style.gridTemplateRows}];
 })));
}
async function markSynthetic(page){
 await page.locator('#bootStatus').evaluate((el,notice)=>{if(!el.textContent.includes(notice))el.textContent+=' · '+notice;},NOTICE);
}
async function shot(page,name){
 if(new URL(page.url()).pathname.endsWith('/cockpit.html'))assert.ok((await page.locator('#bootStatus').textContent()).includes(NOTICE));
 await page.screenshot({path:OUT+'/'+name+'.png'});
 await page.screenshot({path:OUT+'/'+name+'-fullpage.png',fullPage:true});
}
async function target(page,selector,{minimum=44}={}){
 const el=page.locator(selector);await el.scrollIntoViewIfNeeded();
 const rect=await el.evaluate(node=>{const r=node.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
  return {x:r.x,y:r.y,w:r.width,h:r.height,inView:r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,hit:node===hit||node.contains(hit)};});
 assert.ok(rect.inView&&rect.hit,selector+' reachable '+JSON.stringify(rect));
 assert.ok(rect.w>=minimum&&rect.h>=minimum,selector+' retains '+minimum+'px primary target '+JSON.stringify(rect));return rect;
}
async function tab(page,name){await page.locator('#view-'+name).click();assert.equal(await page.locator('#gameShell').getAttribute('data-view'),name);assert.ok(await page.locator('#page-'+name).isVisible());}
async function assertNoWrites(page,row){
 const state=await page.evaluate(()=>window.__cockpitWalletFixture?.snapshot()||null);
 if(state){assert.deepEqual(state.requests.filter(q=>!/^(eth_requestAccounts|eth_accounts|eth_chainId|eth_blockNumber|eth_getCode|eth_call|eth_getBalance)$/.test(q.method)),[],'only explicit identity and read methods are allowed');assert.equal(state.writes.length,0);}
 assert.equal(row.networkWrites.length,0,'no JSON-RPC sign/send/approve or unmodeled POST reached upstream');
 return state;
}
async function contextFor(width,height,{wallet=false,account=A,chain='0x38',reject=false}={}){
 const context=await browser.newContext({viewport:{width,height},isMobile:width<900,hasTouch:true,
  userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'});
 const row={width,height,runtimeErrors:[],networkWrites:[],commercialRequests:[],rpcReads:0,mode:'CI_SYNTHETIC_PROVIDER_NO_REAL_WALLET'};
 const page=await context.newPage();page.setDefaultTimeout(15000);
 page.on('pageerror',e=>row.runtimeErrors.push(String(e.stack||e)));
 page.on('dialog',d=>d.dismiss());
 let trade=0;
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(/\/music\/.*(?:\.mp3|playlist\.json)/i.test(url.pathname)){row.commercialRequests.push(url.href);await route.abort();return;}
  let body;try{if(request.method()==='POST')body=request.postDataJSON();}catch{}
  if(body&&(body.method||Array.isArray(body))){
   const answer=q=>{
    if(!READS.has(q.method)){row.networkWrites.push({method:q.method,url:url.href});return {jsonrpc:'2.0',id:q.id,error:{code:-32000,message:'QA forbids writes'}};}
    row.rpcReads++;let result='0x'+'0'.repeat(64);
    if(q.method==='eth_chainId')result='0x38';if(q.method==='net_version')result='56';if(q.method==='eth_accounts'||q.method==='eth_getLogs')result=[];
    if(q.method==='eth_blockNumber')result='0x100';if(q.method==='eth_getCode')result='0x6000';if(q.method==='eth_getBalance')result='0x0';
    if(q.method==='eth_getBlockByNumber')result={hash:'0x'+'11'.repeat(32),parentHash:'0x'+'22'.repeat(32),number:'0x100',timestamp:'0x'+Math.floor(Date.now()/1000).toString(16),transactions:[]};
    return {jsonrpc:'2.0',id:q.id,result};
   };
   await route.fulfill({contentType:'application/json',body:JSON.stringify(Array.isArray(body)?body.map(answer):answer(body))});return;
  }
  if(request.method()!=='GET'&&request.method()!=='HEAD'){row.networkWrites.push({method:request.method(),url:url.href});await route.abort();return;}
  if(url.hostname==='data-api.binance.vision'){
   const symbols=['BTCUSDT','ETHUSDT','BNBUSDT'],prices={BTCUSDT:'75000',ETHUSDT:'2000',BNBUSDT:'600'};
   const data=url.pathname.endsWith('/aggTrades')?[{a:++trade,p:prices[url.searchParams.get('symbol')]||'75000',q:'1',T:Date.now(),m:false}]
    :symbols.map((symbol,index)=>({symbol,lastPrice:prices[symbol],quoteVolume:String(1000000-index*100000),count:1000,closeTime:Date.now()}));
   await route.fulfill({contentType:'application/json',body:JSON.stringify(data)});return;
  }
  await route.continue();
 });
 if(wallet)await context.addInitScript(({account,chain,reject,KGEN,KAIOS})=>{
  const state={account,chain,reject,authorized:false,hold:false,waiters:[],requests:[],writes:[]},listeners=new Map();
  const word=v=>'0x'+BigInt(v).toString(16).padStart(64,'0');
  window.ethereum={isMetaMask:true,on(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},
   removeListener(type,fn){listeners.get(type)?.delete(fn);},async request({method,params=[]}){
    state.requests.push({method,params});
    if(/send|sign|approve|transfer|wallet_/i.test(method)){state.writes.push(method);throw Error('QA_FORBIDDEN_WRITE '+method);}
    if(method==='eth_requestAccounts'){if(state.reject)throw Object.assign(Error('Synthetic holder rejected'),{code:4001});state.authorized=true;return [state.account];}
    if(method==='eth_accounts'){if(state.hold)await new Promise(resolve=>state.waiters.push(resolve));return state.authorized?[state.account]:[];}
    if(method==='eth_chainId')return state.chain;if(method==='eth_blockNumber')return '0x100';
    if(method==='eth_getCode')return '0x6000';
    if(method==='eth_getBalance')return state.account.toLowerCase()===account.toLowerCase()?'0xde0b6b3a7640001':'0x1';
    if(method==='eth_call'){
     const tx=params[0],address=String(tx.to).toLowerCase();
     if(![KGEN,KAIOS].includes(address)||params[1]!=='0x100')throw Error('Invalid synthetic balance binding');
     if(tx.data==='0x313ce567')return word(18);
     if(tx.data.startsWith('0x70a08231')){
      const queried='0x'+tx.data.slice(-40);if(queried.toLowerCase()!==state.account.toLowerCase())throw Error('Old holder balance requested');
      return word(state.account.toLowerCase()!==account.toLowerCase()?20000000000000000001n:address===KGEN?1234567890123456789012345n:9876543210123456789n);
     }
     throw Error('Unexpected contract selector');
    }
    throw Error('Unmodeled synthetic wallet method '+method);
   }};
  const emit=(type,value)=>{for(const fn of listeners.get(type)||[])fn(value);};
  window.__cockpitWalletFixture={
   snapshot:()=>({account:state.account,chain:state.chain,requests:state.requests,writes:state.writes,waiting:state.waiters.length}),
   reject(value){state.reject=value;},hold(){state.hold=true;},
   release(){state.hold=false;for(const resolve of state.waiters.splice(0))resolve();},
   account(value){state.account=value;emit('accountsChanged',[value]);},chain(value){state.chain=value;emit('chainChanged',value);},
   disconnect(){state.authorized=false;emit('disconnect',{code:4900});}
  };
 },{account,chain,reject,KGEN,KAIOS});
 return {context,page,row};
}
async function openCockpit(page,query=''){
 await page.goto(ENTRY+query,{waitUntil:'domcontentloaded'});await stable(page);
 assert.equal(new URL(page.url()).pathname,new URL(COCKPIT).pathname,'original official entry reaches the current cockpit');
 assert.equal(await page.locator('#frontendVersion').count(),1);await markSynthetic(page);
 assert.equal(await page.locator('meta[name=k12345-build-revision]').getAttribute('content'),'4');
 assert.match(await page.locator('#frontendVersion').textContent(),/V10\.51\.0.*build 4/);
}
async function selectWallet(page){
 await tab(page,'wallet');await page.locator('#practiceConnect').click();await page.locator('#practiceWalletPicker:not([hidden])').waitFor();
 const selected=page.locator('#practiceWalletChoice option:not([value=""]):not([value=walletconnect])');
 assert.equal(await selected.count(),1,'the synthetic injected wallet is explicit, never silently selected');
 const before=await page.evaluate(()=>__cockpitWalletFixture.snapshot().requests.filter(q=>q.method==='eth_requestAccounts').length);
 assert.equal(await page.locator('#practiceWalletChoice').inputValue(),'');
 await page.locator('#practiceWalletChoice').selectOption(await selected.getAttribute('value'));
 assert.equal(await page.evaluate(()=>__cockpitWalletFixture.snapshot().requests.filter(q=>q.method==='eth_requestAccounts').length),before,'selecting alone does not authorize');
 await page.locator('#practiceConnect').click();
}
async function linked(page,account){
 await until(()=>page.locator('#practicePlayer').textContent(),v=>v.toLowerCase().includes(account.toLowerCase()),'current selected holder');
 await page.locator('#hudKgenBalance[data-state=ready]').waitFor();await page.locator('#hudKaiosBalance[data-state=ready]').waitFor();await page.locator('#hudBnbBalance[data-state=ready]').waitFor();
}
async function financialBoundary(page,row){
 assert.equal(config.networks['56'].currentHeart.address,null);assert.equal(config.networks['56'].fortuneGame.address,null);
 assert.equal(config.networks['56'].legacyHeart.mode,'READ_ONLY');
 assert.doesNotMatch(cockpitSource,/eth_sendTransaction|eth_sendRawTransaction|personal_sign|eth_signTypedData|wallet_switchEthereumChain|getSigner|swapExact/);
 assert.equal(await page.locator('#kh-connect,#kh-wishbtn,#kh-vow,#kh-approve').count(),0,'retired live Heart controls are not reactivated');
 assert.match(await page.locator('#realMarginDestination').textContent(),/尚無已核驗/);
 assert.match(await page.locator('#realMarginBalance').textContent(),/尚未接通/);
 assert.match(await page.locator('#practiceNotice').textContent(),/本機模擬.*不簽名.*不發幣.*不存款.*不寫入鏈上/);
 await tab(page,'trade');assert.match(await page.locator('#marketModeLabel').textContent(),/非鏈上/);
 assert.equal(await page.locator('#tradeSubmit').isEnabled(),false,'unfunded zero-lot guest cannot submit an order');
 await tab(page,'bank');assert.ok(await page.locator('#capitalPayoutConfirm').isHidden(),'no confirmed local payout is represented as live withdrawal');
 await assertNoWrites(page,row);
 return {currentHeart:'PENDING',fortuneGame:'PENDING',legacyHeart:'READ_ONLY',retiredHeartTransactions:'NOT_EXECUTED',simulationIsNotFunding:true,liveSignApproveSend:0};
}
async function walletRoundTripQA(){
 for(const [width,height]of [[390,844],[844,390]]){
  const {context,page,row}=await contextFor(width,height,{wallet:true});
  try{
   await openCockpit(page,'?autoconnect=1&source=original-wallet-roundtrip');
   assert.equal((await assertNoWrites(page,row)).requests.length,0,'entry and query cannot automatically authorize or read a wallet');
   row.financialBoundary=await financialBoundary(page,row);
   await selectWallet(page);await linked(page,A);
   assert.equal(await page.locator('#walletKgenBalance').textContent(),'1234567.890123456789012345 KGEN');
   assert.equal(await page.locator('#walletKaiosBalance').textContent(),'9.876543210123456789 KAIOS');
   assert.equal(await page.locator('#walletBnbBalance').textContent(),'1.000000000000000001 BNB');
   assert.match(await page.locator('#walletKgenEvidence').textContent(),/BSC56 區塊 256/);
   assert.match(await page.locator('#practiceMargin').textContent(),/可用 0/,'public holdings do not fund the local ledger');
   await shot(page,'12345-current-wallet-'+width+'-SYNTHETIC-balances');
   let state=await assertNoWrites(page,row);assert.equal(state.requests.filter(q=>q.method==='eth_requestAccounts').length,1);
   assert.ok(state.requests.filter(q=>['eth_getCode','eth_call','eth_getBalance'].includes(q.method)).every(q=>q.params.at(-1)==='0x100'),'balance reads pin the same block');

   await page.evaluate(next=>{__cockpitWalletFixture.hold();__cockpitWalletFixture.account(next);},B);
   await page.locator('#hudKgenBalance[data-state=disconnected]').waitFor();
   assert.doesNotMatch(await page.locator('#practicePlayer').textContent(),new RegExp(A,'i'),'identity change revokes the old holder before late reads');
   await page.evaluate(()=>__cockpitWalletFixture.release());await linked(page,B);
   assert.equal(await page.locator('#walletKgenBalance').textContent(),'20.000000000000000001 KGEN');
   assert.equal((await assertNoWrites(page,row)).requests.filter(q=>q.method==='eth_requestAccounts').length,1,'account changes never prompt');
   await page.evaluate(()=>__cockpitWalletFixture.chain('0x61'));
   await until(()=>page.locator('#practiceWalletStatus').textContent(),v=>v.includes('只支援 BSC56'),'wrong-chain denial');
   await page.locator('#hudKgenBalance[data-state=disconnected]').waitFor();
   assert.equal(await page.locator('#walletKgenRefresh').isEnabled(),false);
   await shot(page,'12345-current-wallet-'+width+'-SYNTHETIC-wrong-chain');
   await page.evaluate(()=>__cockpitWalletFixture.chain('0x38'));await linked(page,B);
   await page.locator('#practiceDetach').click();
   await page.locator('#hudKgenBalance[data-state=disconnected]').waitFor();
   await page.evaluate(()=>__cockpitWalletFixture.reject(true));await selectWallet(page);
   await until(()=>page.locator('#practiceWalletStatus').textContent(),v=>v.includes('沒有取得錢包地址授權'),'holder rejection is visible');
   assert.equal(await page.locator('#walletKgenRefresh').isEnabled(),false);
   await shot(page,'12345-current-wallet-'+width+'-SYNTHETIC-rejected');
   await page.evaluate(()=>__cockpitWalletFixture.reject(false));await selectWallet(page);await linked(page,B);
   const auth=(await assertNoWrites(page,row)).requests.filter(q=>q.method==='eth_requestAccounts').length;
   await page.reload({waitUntil:'domcontentloaded'});await stable(page);await markSynthetic(page);
   assert.equal((await assertNoWrites(page,row)).requests.filter(q=>q.method==='eth_requestAccounts').length,0,'reload does not request authorization; fixture resets and old local records are not identity proof');
   assert.match(await page.locator('#practicePlayer').textContent(),/遊客/);
   await page.evaluate(next=>__cockpitWalletFixture.account(next),B);
   await selectWallet(page);await linked(page,B);await shot(page,'12345-current-wallet-'+width+'-SYNTHETIC-reconnected');
   assert.equal(row.networkWrites.length,0);assert.deepEqual(row.runtimeErrors,[]);assert.deepEqual(row.commercialRequests,[]);
   reports.push({id:'12345-wallet',...row,functional:'PASS_CURRENT_NONFINANCIAL_CONTRACT',preciseBalances:true,pinnedBlock:'0x100',
    explicitSelection:true,accountAndChainRevocation:true,rejectedAndReconnected:true,manualAuthorizationBeforeReload:auth,realWallet:'NOT_TESTED',walletConnectRelay:'NOT_TESTED',broadcasts:0});
  }catch(error){reports.push({id:'12345-wallet-failure-geometry',width,height,geometry:await failureGeometry(page).catch(()=>null)});await shot(page,'12345-current-wallet-'+width+'-FAIL').catch(()=>{});throw error;}finally{await context.close();}
 }
}
async function cockpitLayoutQA(){
 for(const [width,height]of [[360,844],[390,844],[412,844],[432,844],[480,844],[844,390],[1280,900]]){
  const {context,page,row}=await contextFor(width,height);
  try{
   await openCockpit(page);
   assert.equal(await page.evaluate(()=>innerWidth),width,'no scaled 980px mobile layout');
   assert.equal(await page.locator('#cockpitTabs [role=tab]').count(),7);
   const targets=[];
   for(const name of ['flight','trade','wallet','bank','mainnet','stations','log']){
    targets.push({selector:'#view-'+name,...await target(page,'#view-'+name)});await tab(page,name);
   }
   await tab(page,'flight');
   for(const selector of ['#brake','#openTrade','#applyNumericThrust'])targets.push({selector,...await target(page,selector)});
   await page.locator('#warpNumericInput').fill('0.5');await page.locator('#warpNumericInput').press('Tab');
   assert.equal(await page.locator('#speedSet').textContent(),'+0.1C','absolute C input snaps to the existing nearest canonical detent');
   assert.equal(await page.locator('#warpNumericInput').inputValue(),'+0.1','the real input displays the canonical C value, not rail travel');
   const oldX=Number(await page.locator('#xNow').textContent());
   const stick=await target(page,'#xyStick');await page.mouse.move(stick.x+stick.w/2,stick.y+stick.h/2);await page.mouse.down();
   await page.mouse.move(stick.x+stick.w*.8,stick.y+stick.h*.35);await page.waitForTimeout(450);
   assert.ok(Number(await page.locator('#speedNow').textContent())>0,'joystick changes actual movement, not only a HUD label');
   await page.mouse.up();await page.locator('#brake').click();
   assert.notEqual(Number(await page.locator('#xNow').textContent()),oldX,'current cockpit x position changes');
   await until(()=>page.locator('#speedNow').textContent(),v=>Number(v)===0,'brake stops actual movement');
   await page.locator('#mapExpand').click();assert.equal(await page.locator('#mapExpand').getAttribute('aria-expanded'),'true');
   await page.locator('#mapExpand').click();assert.equal(await page.locator('#mapExpand').getAttribute('aria-expanded'),'false');
   await page.locator('#openTrade').click();assert.equal(await page.locator('#gameShell').getAttribute('data-view'),'trade');
   assert.match(await page.locator('#marketModeLabel').textContent(),/非鏈上/);await tab(page,'flight');
   await page.locator('#cockpitAudio[data-audio-state=ready]').waitFor();
   targets.push({selector:'#cockpitAudio [data-audio-action=toggle]',...await target(page,'#cockpitAudio [data-audio-action=toggle]')});
   targets.push({selector:'[data-kaios-return=PORTAL]',...await target(page,'[data-kaios-return=PORTAL]')});
   assert.equal(await page.locator('[data-kaios-return=PORTAL]').count(),1);
   assert.equal(new URL(await page.locator('[data-kaios-return=PORTAL]').getAttribute('href'),page.url()).href,BASE+'/');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal page overflow');
   if(width===390){
    const count=await page.locator('#cockpitTabs [role=tab]').count();
    for(const size of [{width:844,height:390},{width:1280,height:900},{width:390,height:844}]){
     await page.setViewportSize(size);await target(page,'#view-wallet');await tab(page,'wallet');await tab(page,'flight');
    }
    assert.equal(await page.locator('#cockpitTabs [role=tab]').count(),count,'rotation and desktop return do not duplicate controls');
   }
   await shot(page,'12345-current-layout-'+width+'x'+height+'-SYNTHETIC');
   await page.reload({waitUntil:'domcontentloaded'});await stable(page);await markSynthetic(page);
   assert.equal(await page.locator('#cockpitTabs [role=tab]').count(),7);
   assert.equal(await page.locator('#gameShell').getAttribute('data-view'),'flight','reload restores the actual current entry');
   await assertNoWrites(page,row);assert.deepEqual(row.runtimeErrors,[]);assert.deepEqual(row.commercialRequests,[]);
   reports.push({id:'12345-mobile',...row,functional:'PASS_CURRENT_COCKPIT',targets,currentMovement:true,brake:true,warpValueAndRuntime:true,
    tabs:true,mapExpansion:true,reload:true,rotation:width===390?'PASS':'NOT_APPLICABLE',retiredHeartLayout:'NOT_APPLICABLE_RETIRED_PRODUCT',broadcasts:0});
  }catch(error){reports.push({id:'12345-layout-failure-geometry',width,height,geometry:await failureGeometry(page).catch(()=>null)});await shot(page,'12345-current-layout-'+width+'-FAIL').catch(()=>{});throw error;}finally{await context.close();}
 }
}
function movementSelectionQA(){
 const start=cockpitSource.indexOf('function movementCoupling('),end=cockpitSource.indexOf('const WARP_DETENTS=',start);
 assert.ok(start>=0&&end>start,'read the existing cockpit movement selector');
 const select=vm.runInNewContext('('+cockpitSource.slice(start,end).trim()+')',{
  TRADE_AXIS:'KX',TRADE_MARKET:'BTCUSDT',practiceBlock:()=>''});
 const open={status:'OPEN',axis:'KX',market:'BTCUSDT',c:.1};
 const cases=[
  ['no-position',{positions:[]},{},0,/尚未成交/],
  ['pending-is-not-filled',{positions:[],orders:[{...open,status:'PENDING'}]},{},0,/尚未成交/],
  ['one-filled-fixed-c',{positions:[open]},{},.1,/^$/],
  ['negative-filled-c',{positions:[{...open,c:-.1}]},{},-.1,/^$/],
  ['closed',{positions:[{...open,status:'CLOSED'}]},{},0,/尚未成交/],
  ['liquidated',{positions:[{...open,status:'LIQUIDATED'}]},{},0,/尚未成交/],
  ['conflicting-open',{positions:[open,{...open,c:1}]},{},0,/多筆/],
  ['foreign-axis',{positions:[{...open,axis:'KY'}]},{},0,/市場不一致/],
  ['foreign-market',{positions:[{...open,market:'ETHUSDT'}]},{},0,/市場不一致/],
  ['invalid-c',{positions:[{...open,c:NaN}]},{},0,/固定 C 無法核對/],
  ['unknown-state',{positions:[{...open,status:'UNKNOWN'}]},{},0,/狀態無法核對/],
  ['missing-book',null,{},0,/狀態無法核對/],
  ['practice-block',{positions:[open]},{blocked:'ACCOUNT_CHANGED'},0,/帳本尚未就緒/]
 ];
 for(const [name,book,options,c,reason]of cases){
  const before=JSON.stringify(book),actual=select(book,options);
  assert.equal(actual.c,c,name);assert.match(actual.reason,reason,name);assert.equal(JSON.stringify(book),before,name+' leaves the ledger unchanged');
 }
 reports.push({id:'12345-fixed-flight-selection',mode:'ISOLATED_ACTUAL_SOURCE_PURE_SELECTION',cases:cases.length,
  multipleOpen:'ORDINARY_MOVEMENT_NO_ARBITRARY_SELECTION',financialMutation:false,crossWorldArrival:'NOT_IMPLEMENTED'});
}
async function cockpitFlightCouplingQA(){
 for(const [width,height]of [[390,844],[844,390]]){
  const {context,page,row}=await contextFor(width,height);
  const key='k12345.practice.v1:guest-session',readBook=()=>page.evaluate(key=>JSON.parse(sessionStorage.getItem(key))?.payload?.ledger?.simulation,key);
  const phases=[];
  async function edit(selector,value){await page.locator(selector).fill(value);await page.locator(selector).press('Tab');}
  async function walkingOrFlight(expected,label){
   await tab(page,'flight');
   await edit('#joyHorizontalInput','100');await edit('#joyVerticalInput','0');await edit('#axisNumericInput','0');
   const button=await target(page,'#applyNumericThrust');await page.mouse.move(button.x+button.w/2,button.y+button.h/2);await page.mouse.down();
   let speed;try{
    speed=await until(()=>page.locator('#speedNow').textContent(),value=>Math.abs(Number(value)-expected)<.002,label+' actual speed');
    assert.equal(await page.locator('#flightState').textContent(),expected===6?'普通移動':'飛碟巡航',label+' movement mode matches the applied source');
   }
   finally{await page.mouse.up();await page.locator('#brake').click();}
   await until(()=>page.locator('#speedNow').textContent(),value=>Number(value)===0,label+' stopped');
   phases.push({label,movingMps:Number(speed),stopped:true});
  }
  async function capture(stage){await page.locator('#marketCoupling').scrollIntoViewIfNeeded();await shot(page,'12345-fixed-flight-'+width+'x'+height+'-'+stage+'-SYNTHETIC');}
  async function submitPending({expectPending=true}={}){
   await tab(page,'trade');await edit('#tradeLots','1');await page.locator('#tradeTrigger').fill('76000');await page.locator('#tradeSubmit').click();
   await until(readBook,book=>expectPending?book?.orders.some(order=>order.status==='PENDING'):
    ['PENDING','FILLED'].includes(book?.orders.at(-1)?.status),'original order accepted'+(expectPending?' pending':''));
  }
  try{
   await openCockpit(page);await tab(page,'trade');await page.locator('#marketMode').selectOption('REPLAY');
   await tab(page,'stations');await page.locator('#claimDestination').selectOption('MARGIN');await page.locator('#act').click();
   await tab(page,'flight');await edit('#warpNumericInput','1');
   await walkingOrFlight(6,'no-order-draft-1c');assert.equal(await page.locator('#marketCoupling').getAttribute('data-state'),'idle');await capture('no-order');
   await edit('#warpNumericInput','.1');await submitPending();
   await walkingOrFlight(6,'pending-does-not-propel');await capture('pending');
   await tab(page,'trade');await page.getByRole('button',{name:'取消',exact:true}).click();
   await until(readBook,book=>book.orders.some(order=>order.status==='CANCELLED')&&!book.positions.some(position=>position.status==='OPEN'),'cancel stays unfilled');
   await walkingOrFlight(6,'cancelled-does-not-propel');
   await submitPending();await page.locator('#replayPriceInput').fill('76000');await page.locator('#applyReplayPrice').click();
   await until(readBook,book=>book?.positions.filter(position=>position.status==='OPEN').length===1,'original replay price fills the order');
   const filled=(await readBook()).positions.find(position=>position.status==='OPEN');assert.equal(filled.c,.1);
   const fixedMps=(384400/16888)*.1;
   await walkingOrFlight(fixedMps,'filled-fixed-0.1c');assert.match(await page.locator('#marketCoupling').textContent(),/固定 \+0\.1C/);await capture('filled');
   await edit('#warpNumericInput','-1');await walkingOrFlight(fixedMps,'opposite-draft-does-not-change-filled-c');
   await edit('#warpNumericInput','0');await walkingOrFlight(fixedMps,'zero-draft-does-not-change-filled-c');
   assert.equal((await readBook()).positions.find(position=>position.status==='OPEN').c,.1);await capture('draft-change');
   await page.reload({waitUntil:'domcontentloaded'});await stable(page);await markSynthetic(page);
   await tab(page,'trade');await page.locator('#marketMode').selectOption('REPLAY');await tab(page,'flight');
   await until(()=>page.locator('#speedNow').textContent(),value=>Number(value)===0,'reload restores stopped flight');
   assert.equal((await readBook()).positions.find(position=>position.status==='OPEN').c,.1);
   await walkingOrFlight(fixedMps,'reloaded-position-needs-new-input');await capture('reloaded');
   await tab(page,'trade');await page.getByRole('button',{name:'平倉',exact:true}).click();
   await until(readBook,book=>book.positions.every(position=>position.status!=='OPEN'),'close removes propulsion');
   await walkingOrFlight(6,'closed-returns-to-ordinary');await capture('closed');
   await edit('#warpNumericInput','1');await submitPending({expectPending:false});
   await until(readBook,book=>book.positions.some(position=>position.status==='OPEN'),'second original order fills at current replay price');
   await page.locator('#replayPriceInput').fill('1');await page.locator('#applyReplayPrice').click();
   await until(readBook,book=>book.positions.some(position=>position.status==='LIQUIDATED')&&!book.positions.some(position=>position.status==='OPEN'),'original price engine liquidates');
   await walkingOrFlight(6,'liquidated-returns-to-ordinary');
   await assertNoWrites(page,row);assert.deepEqual(row.runtimeErrors,[]);assert.deepEqual(row.commercialRequests,[]);
   reports.push({id:'12345-fixed-flight-coupling',...row,phases,filledPositionC:filled.c,ordinaryMps:6,
    draftCannotPropel:true,filledCFixed:true,reloadStopped:true,closeAndLiquidationReturnToOrdinary:true,
    originalLedgerAndReplayEngine:true,crossWorldArrival:'NOT_IMPLEMENTED',realTransactions:0});
  }catch(error){reports.push({id:'12345-fixed-flight-failure',...row,phases,geometry:await failureGeometry(page).catch(()=>null)});await shot(page,'12345-fixed-flight-'+width+'-FAIL').catch(()=>{});throw error;}
  finally{await context.close();}
 }
}
async function instrumentAudio(context){
 await context.addInitScript(()=>{
  const Real=window.AudioContext||window.webkitAudioContext;window.__qaAudioContexts=[];window.__qaAnalysers=[];
  const connect=AudioNode.prototype.connect;
  AudioNode.prototype.connect=function(destination,...args){const result=connect.call(this,destination,...args);if(destination===this.context.destination){const analyser=this.context.createAnalyser();connect.call(this,analyser);window.__qaAnalysers.push(analyser);}return result;};
  if(Real){window.AudioContext=class extends Real{constructor(...args){super(...args);window.__qaAudioContexts.push(this);}};window.webkitAudioContext=window.AudioContext;}
 });
}
async function audioLifecycleQA(page){
 const read=()=>page.evaluate(()=>KAIOS_AUDIO.snapshot());
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 await until(read,s=>s.contextState==='suspended'&&s.activeMusicLayers===0&&s.activeNodes===0,'hidden document suspends all shared sounds');
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await until(read,s=>s.musicPlaying&&s.activeMusicLayers===1,'visible document resumes its already unlocked theme');
 await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));
 await until(read,s=>s.activeMusicLayers===0&&s.activeNodes===0,'pagehide retires scheduler and nodes');
 await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
 await until(read,s=>s.musicPlaying&&s.activeMusicLayers===1,'persisted handler restores a single unlocked scheduler');
 assert.equal(await page.evaluate(()=>__qaAudioContexts.length),1);
 return {scope:'SYNTHETIC_VISIBILITY_AND_PERSISTED_EVENTS',actualBFCache:'NOT_TESTED',hiddenSuspends:true,pagehideStops:true,oneContextAfterRestore:true};
}
async function worldAudioQA(){
 const ids=preservation?['16888']:['12345','16888'];
 const sizes=preservation?[[360,844],[390,844],[412,844],[432,844],[480,844]]:[[390,844],[844,390]];
 for(const id of ids)for(const [width,height]of sizes){
  const {context,page,row}=await contextFor(width,height);await instrumentAudio(context);
  try{
   if(id==='12345'){await openCockpit(page);await page.locator('#cockpitAudio[data-audio-state=ready]').waitFor();}
   else{await page.goto(BASE+'/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/'+id+'/index.html',{waitUntil:'domcontentloaded'});await until(()=>page.evaluate(()=>Boolean(window.KAIOS_AUDIO_CONTROL)),Boolean,'16888 original shared audio control',45000);await page.waitForTimeout(2500);}
   const read=()=>page.evaluate(()=>window.KAIOS_AUDIO.snapshot());
   assert.equal((await read()).contextState,'NOT_CREATED');assert.equal((await read()).world,id);
   await shot(page,'world-'+id+'-'+width+'x'+height);
   const toggle=id==='12345'?'#cockpitAudio [data-audio-action=toggle]':'.nav-music';
   await target(page,toggle);await page.locator(toggle).tap();
   await until(read,s=>s.musicPlaying,'FIRST TAP enables music, not only settings');
   if(id==='12345')await page.locator('#cockpitAudio [data-audio-action=settings]').click();else await page.locator(toggle).tap();
   await page.locator('.kaios-audio-panel').waitFor({state:'visible'});
   assert.equal(await page.locator('.kaios-audio-panel [data-audio-volume]').count(),4);
   assert.equal(await page.evaluate(()=>window.__qaAudioContexts.length),1,'single AudioContext per world');
   assert.equal((await read()).activeMusicLayers,1,'one scheduler per world');
   const signal=await page.evaluate(async()=>{let peak=0,rms=0;for(let i=0;i<30;i++){for(const a of __qaAnalysers){const values=new Float32Array(a.fftSize);a.getFloatTimeDomainData(values);let sum=0;for(const v of values){peak=Math.max(peak,Math.abs(v));sum+=v*v;}rms=Math.max(rms,Math.sqrt(sum/values.length));}await new Promise(r=>setTimeout(r,100));}return{peak,rms};});
   assert.ok(signal.rms>.008&&signal.peak>.02&&signal.peak<.95,'destination signal: audible digital headroom, not just scheduler state');
   assert.equal(await page.locator('audio').evaluateAll(nodes=>nodes.filter(n=>!n.paused).length),0,'legacy HTML media must not play alongside shared synth');
   await shot(page,'world-'+id+'-audio-'+width+'x'+height);
   const lifecycle=await audioLifecycleQA(page);
   await page.locator('[data-audio-action=mute]').click();assert.equal((await read()).settings.muted,true);assert.equal((await read()).activeMusicLayers,0);
   await page.getByRole('button',{name:'關閉設定',exact:true}).click();
   const home=page.locator('[data-kaios-return=PORTAL]');assert.equal(await home.count(),1);assert.equal(new URL(await home.getAttribute('href'),page.url()).href,BASE+'/');
   await page.evaluate(()=>window.addEventListener('pagehide',()=>{sessionStorage.setItem('kaios.qa.audio-navigation',JSON.stringify({world:KAIOS_AUDIO.snapshot().world,layers:KAIOS_AUDIO.snapshot().activeMusicLayers}));},{once:true}));
   await target(page,'[data-kaios-return=PORTAL]');await home.click();await page.waitForURL(BASE+'/');await page.locator('#primaryPlay').waitFor();
   const state=await page.evaluate(async()=>{const m=await import('./assets/kaios-audio.mjs');return m.getKaiosAudio().snapshot();});
   assert.equal(state.settings.muted,true);assert.equal(state.contextState,'NOT_CREATED');
   const fade=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('kaios.qa.audio-navigation')));
   assert.equal(fade.world,'PORTAL');assert.equal(fade.layers,0,'outgoing world retires sound before navigation');
   await page.goBack({waitUntil:'domcontentloaded'});
   if(id==='12345'){await stable(page);await markSynthetic(page);assert.equal(new URL(page.url()).pathname,new URL(COCKPIT).pathname);}
   else await page.locator('.nav-music').waitFor();
   await page.goForward({waitUntil:'domcontentloaded'});await page.locator('#primaryPlay').waitFor();
   assert.deepEqual(row.commercialRequests,[],'no unlicensed legacy song downloads');
   assert.equal(row.networkWrites.length,0);
   assert.ok(row.runtimeErrors.every(e=>!e.includes('kaios-audio')&&!e.includes('kaios-world-audio')),'no shared audio runtime errors');
   if(id==='12345')assert.deepEqual(row.runtimeErrors,[]);
   reports.push({id,width,height,audio:'PASS',signal,lifecycle,returnPortal:'PASS',returnFade:fade,muteAcrossPages:'PASS',backForward:'PASS',
    commercialRequests:0,realRpcReads:0,realTransactions:0,legacyPageErrors:row.runtimeErrors,physicalSpeakerQuality:'NOT_TESTED'});
  }catch(error){await shot(page,'world-'+id+'-'+width+'-FAIL').catch(()=>{});throw error;}finally{await context.close();}
 }
}
try{
 movementSelectionQA();
 if(!preservation&&!layoutOnly)await walletRoundTripQA();
 if(!preservation&&!walletOnly)await cockpitLayoutQA();
 if(!preservation&&!walletOnly&&!layoutOnly)await cockpitFlightCouplingQA();
 if(!walletOnly&&!heartOnly&&!layoutOnly)await worldAudioQA();
} catch(error){reports.push({id:'FAIL',error:String(error.stack||error)});throw error;}
finally{await fs.writeFile(OUT+'/world-audio-report.json',JSON.stringify(reports,null,2));await browser.close();console.log(JSON.stringify(reports));}
