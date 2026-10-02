// Real browser: shared audio/return and canonical Heart mobile HUD regression.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {Interface, parseUnits} from 'ethers';
const BASE=(process.env.KAIOS_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const OUT='artifacts/kaios-portal-qa';await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=user-gesture-required']});
const reports=[];
const preservation=process.argv.includes('--preservation');
const heartOnly=process.argv.includes('--heart-only');
try{
// Exercise the REAL sendHeart + ensureConnected + ethers V3.2.6 Contract path.
// Only signer.sendTransaction is replaced. No private key or broadcast provider.
if(!preservation)for(const [width,height] of [[390,844],[844,390]]){
 const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,timezoneId:width===390?'Asia/Taipei':'America/New_York',userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'});
 const page=await context.newPage(),txABI=new Interface(['function heartbeatClaim()','function makeWish(bytes32)','function vowTo(uint8,uint256)','function lightLamp(uint256)','function festivalClaim(uint8)','function newYearCountdownClaim()']);
 const rules={festivalEnabled:true,festivalWindowStart:0,festivalWindowEnd:600,newYearCountdownEnabled:true,newYearWindowStart:85800,newYearWindowEnd:86400};
 const readABI=new Interface(['function kgen() view returns(address)','function lampPricePerDay() view returns(uint256)','function decimals() view returns(uint8)','function balanceOf(address) view returns(uint256)','function allowance(address,address) view returns(uint256)',...Object.entries(rules).map(([name,value])=>`function ${name}() view returns(${typeof value==='boolean'?'bool':'uint256'})`),'function festivalClaimed(uint8,uint256,address) view returns(bool)','function newYearCountdownClaimed(uint256,address,uint8) view returns(bool)']);
 const fixture={allowance:'1000',balance:'1000',price:'1',readError:false,timestamp:Date.parse('2026-10-02T10:00:00Z')/1000,claims:new Set()};let broadcasts=0,confirmations=0,accept=true;
 const reply=q=>{
   if(/sendTransaction|sendRawTransaction|sign|wallet_/i.test(q.method)){broadcasts++;return{jsonrpc:'2.0',id:q.id,error:{code:-32000,message:'QA forbids writes'}};}
   let result='0x0';
   if(q.method==='eth_chainId')result='0x38';
   if(q.method==='net_version')result='56';
   if(q.method==='eth_blockNumber')result='0x100';
   if(q.method==='eth_getBlockByNumber')result={hash:'0x'+'22'.repeat(32),parentHash:'0x'+'11'.repeat(32),number:'0x100',timestamp:'0x'+fixture.timestamp.toString(16),nonce:'0x0000000000000000',difficulty:'0x0',gasLimit:'0x1c9c380',gasUsed:'0x0',miner:'0x'+'00'.repeat(20),extraData:'0x',transactions:[]};
   if(q.method==='eth_call'){
    let decoded;try{decoded=readABI.parseTransaction({data:q.params[0].data});}catch{}
    if(decoded){
     if(fixture.readError)return{jsonrpc:'2.0',id:q.id,error:{code:-32000,message:'QA read unavailable'}};
     const values={...rules,kgen:'0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be',lampPricePerDay:fixture.price,decimals:18,balanceOf:parseUnits(fixture.balance,18),allowance:parseUnits(fixture.allowance,18)};
     if(decoded.name==='festivalClaimed')values.festivalClaimed=fixture.claims.has(`festival:${decoded.args[0]}:${decoded.args[1]}`);
     if(decoded.name==='newYearCountdownClaimed')values.newYearCountdownClaimed=fixture.claims.has(`ny:${decoded.args[0]}:${decoded.args[2]}`);
     result=readABI.encodeFunctionResult(decoded.name,[values[decoded.name]]);
    }else result='0x'+'0'.repeat(64);
   }
   return{jsonrpc:'2.0',id:q.id,result};
 };
 await page.exposeFunction('__heartRead',q=>{const r=reply(q);if(r.error)throw Error(r.error.message);return r.result;});
 await page.exposeFunction('__fixtureReceipt',tx=>{const d=txABI.parseTransaction(tx),year=new Date(fixture.timestamp*1000).getUTCFullYear();if(d.name==='festivalClaim')fixture.claims.add(`festival:${d.args[0]}:${year}`);if(d.name==='newYearCountdownClaim')fixture.claims.add(`ny:${year}:${Math.floor((fixture.timestamp%86400)/60)-Math.floor(rules.newYearWindowStart/60)}`);});
 await context.route('**/*',async route=>{
  const req=route.request();if(req.method()!=='POST')return route.continue();
  let payload;try{payload=req.postDataJSON();}catch{return route.continue();}
  if(!payload?.method&&!Array.isArray(payload))return route.continue();
  await route.fulfill({json:Array.isArray(payload)?payload.map(reply):reply(payload)});
 });
 page.on('dialog',async d=>{confirmations++;if(accept)await d.accept();else await d.dismiss();});
 await page.goto(BASE+'/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/12345/index.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.KGEN_RUNTIME_CORE?.modules.HeartRuntime.inited);
 await page.waitForTimeout(1200);
 const geometry=()=>page.evaluate(()=>['#core-anchor','#move-joystick-wrap','.warp-engine','#kgen-v30-wish-btn'].map(s=>document.querySelector(s).getBoundingClientRect().toJSON()));
 const baseline=await geometry();
 await page.evaluate(()=>{
  window.__heartTx=[];window.__txFailure=null;window.__holdTx=false;window.__walletReads=[];
  window.ethereum={isMetaMask:true,request:async({method,params})=>{
   __walletReads.push(method);
   if(method==='eth_chainId')return '0x38';
   if(method==='eth_accounts'||method==='eth_requestAccounts')return ['0x0000000000000000000000000000000000000001'];
   if(method==='eth_call'||method==='eth_blockNumber')return window.__heartRead({method,params,id:1});
   throw Error('QA blocks injected RPC: '+method);
  }};
  ethers.providers.JsonRpcSigner.prototype.sendTransaction=async function(tx){
   const request={to:await tx.to,data:await tx.data};__heartTx.push(request);
   if(__holdTx)await new Promise(resolve=>{window.__releaseTx=resolve;});
   if(__txFailure)throw Object.assign(Error(__txFailure.message),{code:__txFailure.code});
   return{hash:'0x'+'11'.repeat(32),wait:async()=>{await window.__fixtureReceipt(request);return{blockNumber:1,logs:[]};}};
  };
 });
 const feedback=id=>page.locator('#'+id+'-feedback');
 const click=async id=>{await page.locator('#'+id).tap();await page.waitForFunction(id=>document.getElementById(id).dataset.heartPending!=='1',id);};
 const count=()=>page.evaluate(()=>__heartTx.length);
 const open=async id=>{if(await page.locator('#kgen-heart-live-panel').getAttribute('aria-hidden')==='false')await page.locator('#kgen-heart-toggle').tap();await page.locator(id).tap();};
 try{
  await open('#kgen-v30-wish-btn');await page.locator('#kh-wish-text').fill('世界平安');
  assert.equal(await count(),0,'shortcut only opens the canonical form');
  for(const id of ['kh-wishbtn','kh-heartbeat']){await click(id);await page.waitForTimeout(50);}
  await open('#kgen-v30-vow-btn');await page.locator('#kh-vow-option').selectOption('2');await page.locator('#kh-vow-amount').fill('9');await click('kh-vow');
  await page.locator('#kh-lamp-days').fill('8');await click('kh-lamp');
  await page.waitForFunction(()=>__heartTx.length===4);
  const requests=await page.evaluate(()=>__heartTx),decoded=requests.map(tx=>{assert.equal(tx.to.toLowerCase(),'0xb016d4d8f1aed1339101b30722cad6dba9b8c972');const d=txABI.parseTransaction(tx);return{name:d.name,args:[...d.args].map(String)};});
  assert.deepEqual(decoded,[{name:'makeWish',args:[await page.evaluate(()=>ethers.utils.id('世界平安'))]},{name:'heartbeatClaim',args:[]},{name:'vowTo',args:['2','9']},{name:'lightLamp',args:['8']}]);
  assert.equal(confirmations,4,'four original confirmations, no bypass of sendHeart');
  await open('#kgen-v30-wish-btn');await page.locator('#kh-wish-text').fill('');await click('kh-wishbtn');assert.match(await feedback('kh-wish').innerText(),/請輸入許願/);assert.equal(confirmations,4,'invalid input before wallet confirmation');
  assert.ok(await feedback('kh-wish').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),'validation must be visible, not only written below the viewport');
  await page.screenshot({path:`${OUT}/heart-action-${width}-wish-error.png`});
  await page.locator('#kh-wish-text').fill('0x'+'0'.repeat(64));await click('kh-wishbtn');assert.match(await feedback('kh-wish').innerText(),/不可為零/);
  await open('#kgen-v30-vow-btn');
  for(const [id,value,pattern]of [['kh-vow-amount','',/請輸入/],['kh-vow-amount','0',/範圍/],['kh-lamp-days','1.5',/正整數/],['kh-lamp-days','3651',/範圍/]]){
   await page.locator('#'+id).fill(value);const action=id.includes('vow')?'kh-vow':'kh-lamp';await click(action);assert.match(await feedback(action).innerText(),pattern);
  }
  await page.locator('#kh-vow-amount').fill('9');await page.locator('#kh-lamp-days').fill('8');
  await page.locator('#kh-vow-option').evaluate(e=>e.selectedIndex=-1);await click('kh-vow');assert.match(await feedback('kh-vow').innerText(),/選擇還願項目/);await page.locator('#kh-vow-option').selectOption('2');
  fixture.allowance='0';
  for(const id of ['kh-vow','kh-lamp']){await click(id);assert.match(await feedback(id).innerText(),/Approve required/);assert.equal(await page.locator('#kh-approve-target').inputValue(),id==='kh-vow'?'vow':'lamp');}
  assert.equal(await count(),4,'insufficient allowance cannot send action or auto-approve');
  assert.ok(await feedback('kh-lamp').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),'allowance reason visible beside original form');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'detailed error must not stretch the HUD');
  await page.screenshot({path:`${OUT}/heart-action-${width}-approve-required.png`});
  fixture.price='3';await click('kh-lamp');assert.match(await feedback('kh-lamp').innerText(),/24 KGEN/,'lamp price comes from chain, not days=cost');
  assert.equal(await page.evaluate(()=>KGEN_RUNTIME_CORE.modules.ApproveRuntime.getNeedAmount('lamp')),'24','same canonical approval amount');
  fixture.allowance='1000';fixture.balance='1';await click('kh-vow');assert.match(await feedback('kh-vow').innerText(),/餘額不足/);
  fixture.balance='1000';fixture.readError=true;await click('kh-lamp');assert.match(await feedback('kh-lamp').innerText(),/失敗/);fixture.readError=false;
  assert.equal(await count(),4,'read failure and low balance fail closed');
  await open('#kgen-v30-wish-btn');await page.locator('#kh-wish-text').fill('世界平安');
  accept=false;await click('kh-wishbtn');assert.match(await feedback('kh-wish').innerText(),/已取消/);assert.equal(await count(),4);accept=true;
  await page.evaluate(()=>{__txFailure={code:4001,message:'User rejected'};});await click('kh-wishbtn');assert.match(await feedback('kh-wish').innerText(),/交易已取消/);
  await page.evaluate(()=>{__txFailure={code:'CALL_EXCEPTION',message:'execution reverted: TEST_REVERT'};});await click('kh-wishbtn');assert.match(await feedback('kh-wish').innerText(),/TEST_REVERT/);
  await page.evaluate(()=>{__txFailure=null;__holdTx=true;});await page.locator('#kh-wishbtn').tap();await page.waitForFunction(()=>!!window.__releaseTx);const pending=await count();await page.locator('#kh-wishbtn').tap();assert.equal(await count(),pending,'rapid repeat tap cannot duplicate transaction');
  await page.evaluate(()=>{__holdTx=false;__releaseTx();});await page.waitForFunction(()=>!document.getElementById('kh-wishbtn').dataset.heartPending);
  await page.screenshot({path:`${OUT}/heart-action-${width}-confirmed-stub.png`});
  for(let i=0;i<10;i++){await open('#kgen-v30-vow-btn');await page.locator('#kgen-heart-toggle').tap();await open('#kgen-v30-wish-btn');await page.locator('#kgen-heart-toggle').tap();}
  assert.deepEqual(await geometry(),baseline,'form status and ten cycles never move world composition');
  // Festival clock injection is local to the read-only UI observer. No chain
  // time changes, no replacement of the actual shared sendHeart transaction path.
  const cases=await page.evaluate(rules=>{
   const runtime=KGEN_RUNTIME_CORE.modules.CountdownRuntime;
   const snapshot={rules,account:'0x0000000000000000000000000000000000000001',claims:{'festival:1:2026':false,'festival:2:2026':false}};
   for(let i=0;i<10;i++)snapshot.claims['ny:2026:'+i]=false;
   const cases=[
    [1,'2026-05-19T23:59:59Z','NOT_OPEN'],[1,'2026-05-20T00:00:00+08:00','NOT_OPEN'],[1,'2026-05-20T00:00:00Z','READY'],[1,'2026-05-20T00:10:00Z','READY'],[1,'2026-05-20T00:10:01Z','NOT_OPEN'],
    [2,'2026-11-10T23:59:59Z','NOT_OPEN'],[2,'2026-11-11T00:00:00+08:00','NOT_OPEN'],[2,'2026-11-11T00:00:00Z','READY'],[2,'2026-11-11T00:10:00Z','READY'],[2,'2026-11-11T00:10:01Z','NOT_OPEN'],
    [3,'2026-12-31T23:49:59Z','NOT_OPEN'],[3,'2026-12-31T23:50:00Z','READY'],[3,'2026-12-31T23:59:59Z','READY'],[3,'2027-01-01T00:00:00Z','NOT_OPEN'],[3,'2027-01-01T07:50:00+08:00','READY']
   ].map(([kind,date,expected])=>({kind,date,expected,actual:runtime.evaluate(kind,snapshot,Date.parse(date)/1000).code}));
   const shifted={...snapshot,rules:{...rules,festivalWindowStart:3600,festivalWindowEnd:4200,newYearWindowStart:1001,newYearWindowEnd:1601}};
   for(const kind of [1,2])for(const[clock,expected]of[['00:59:59','NOT_OPEN'],['01:00:00','READY'],['01:10:01','NOT_OPEN']]){const date=`2026-${kind===1?'05-20':'11-11'}T${clock}Z`;cases.push({kind,date,expected,actual:runtime.evaluate(kind,shifted,Date.parse(date)/1000).code});}
   cases.push({kind:3,date:'non-minute-aligned NY end',expected:'NOT_OPEN',actual:runtime.evaluate(3,shifted,Date.parse('2026-12-31T00:26:00Z')/1000).code});
   return cases;
  },rules);
  for(const c of cases)assert.equal(c.actual,c.expected,JSON.stringify(c));
  const sync=async date=>{fixture.timestamp=Date.parse(date)/1000;await page.evaluate(async()=>{await KGEN_RUNTIME_CORE.modules.CountdownRuntime.refresh(true);});};
  const claimClick=async id=>{await page.locator('#'+id).tap();await page.waitForFunction(id=>!document.getElementById(id).dataset.heartPending,id);};
  const festivalStart=await count();
  await page.locator('#kgen-heart-toggle').tap();await sync('2026-10-02T10:00:00Z');
  for(const id of ['kh-festival1','kh-festival2','kh-newyear']){await claimClick(id);assert.match(await feedback(id).innerText(),/尚未開放/);assert.match(await page.locator('#'+id+'-status').innerText(),/台灣時間.*\nUTC/);}
  assert.equal(await count(),festivalStart,'outside window never reaches signer');
  await page.screenshot({path:`${OUT}/festival-${width}-not-open.png`});
  for(const [id,date,kind]of [['kh-festival1','2026-05-20T00:00:01Z',1],['kh-festival2','2026-11-11T00:00:01Z',2],['kh-newyear','2026-12-31T23:50:01Z',3]]){
   await sync(date);assert.equal(await page.locator('#'+id).getAttribute('data-festival-state'),'READY');
   await claimClick(id);assert.match(await feedback(id).innerText(),/成功/);
   assert.equal(await page.locator('#'+id).getAttribute('data-festival-state'),'ALREADY_CLAIMED');
   const n=await count();await claimClick(id);assert.equal(await count(),n,'claimed scope cannot send twice');assert.match(await feedback(id).innerText(),/本期已領取/);
  }
  const festivalCalls=(await page.evaluate(n=>__heartTx.slice(n),festivalStart)).map(tx=>{const d=txABI.parseTransaction(tx);return{name:d.name,args:[...d.args].map(String)};});
  assert.deepEqual(festivalCalls,[{name:'festivalClaim',args:['1']},{name:'festivalClaim',args:['2']},{name:'newYearCountdownClaim',args:[]}]);
  await page.screenshot({path:`${OUT}/festival-${width}-claimed.png`});
  // Existing one-second timer transitions without a reload; each send still
  // performs a fresh block-bound preflight (the UI clock never authorizes it).
  fixture.claims.clear();await sync('2026-12-31T23:49:59Z');
  fixture.timestamp=Date.parse('2026-12-31T23:50:00Z')/1000;
  await page.evaluate(()=>{const c=KGEN_RUNTIME_CORE.modules.CountdownRuntime;window.__festivalClock=c.snapshot.observedAt;c.now=()=>__festivalClock;__festivalClock+=2000;});
  await page.waitForFunction(()=>document.getElementById('kh-newyear').dataset.festivalState==='READY');
  await page.evaluate(()=>{__festivalClock+=1000;});await page.waitForTimeout(1100);assert.match(await page.locator('#kh-ny-slot').innerText(),/開放中/);
  await claimClick('kh-newyear');await sync('2026-12-31T23:51:00Z');assert.equal(await page.locator('#kh-newyear').getAttribute('data-festival-state'),'READY','next minute has a different once-only scope');
  fixture.timestamp=Date.parse('2027-01-01T00:00:00Z')/1000;
  await page.evaluate(()=>{__festivalClock+=13000;});
  await page.waitForFunction(()=>document.getElementById('kh-newyear').dataset.festivalState==='NOT_OPEN');
  await page.evaluate(()=>{__festivalClock+=31000;KGEN_RUNTIME_CORE.modules.CountdownRuntime.render();});assert.equal(await page.locator('#kh-newyear').getAttribute('data-festival-state'),'SYNC_REQUIRED','stale observation cannot claim READY');
  await sync('2027-01-01T00:00:00Z');assert.equal(await page.locator('#kh-newyear').getAttribute('data-festival-state'),'SYNC_REQUIRED','re-reading frozen head cannot reset freshness');
  fixture.readError=true;await sync('2026-11-11T00:00:01Z');const noData=await count();await claimClick('kh-festival2');assert.equal(await count(),noData);assert.match(await feedback('kh-festival2').innerText(),/鏈上活動資料無法確認/);fixture.readError=false;
  rules.festivalEnabled=false;await sync('2026-11-11T00:00:01Z');await claimClick('kh-festival2');assert.match(await feedback('kh-festival2').innerText(),/尚未啟用/);rules.festivalEnabled=true;
  await sync('2026-11-11T00:00:01Z');await page.evaluate(()=>{__txFailure={code:'CALL_EXCEPTION',message:'execution reverted: FESTIVAL_WINDOW'};});await claimClick('kh-festival2');assert.match(await feedback('kh-festival2').innerText(),/合約時間窗/);
  await page.evaluate(()=>{__txFailure={code:4001,message:'User rejected'};});await claimClick('kh-festival2');assert.match(await feedback('kh-festival2').innerText(),/交易已取消/);await page.evaluate(()=>{__txFailure=null;});
  await page.evaluate(()=>{__txFailure={code:'CALL_EXCEPTION',message:'execution reverted: FESTIVAL_CLAIMED'};});await claimClick('kh-festival2');assert.match(await feedback('kh-festival2').innerText(),/本期已領取/);await page.evaluate(()=>{__txFailure=null;});
  const wrongChainCount=await count();
  await page.evaluate(()=>{window.__originalRequest=ethereum.request;ethereum.request=async q=>q.method==='eth_chainId'?'0x1':q.method==='wallet_switchEthereumChain'?null:__originalRequest(q);});
  await claimClick('kh-festival2');assert.match(await feedback('kh-festival2').innerText(),/請切換至 BSC/);assert.equal(await count(),wrongChainCount);
  await page.evaluate(()=>{ethereum.request=__originalRequest;});
  await page.locator('#kgen-heart-toggle').tap();await page.locator('#k12345-more-open').tap();await page.locator('#kgen-v102-festival-panel h3').tap();
  for(const [id,date]of [['kgen-v102-festival-520','2026-05-20T00:00:01Z'],['kgen-v102-festival-1111','2026-11-11T00:00:01Z'],['kgen-v102-newyear','2026-12-31T23:59:01Z']]){
   fixture.claims.clear();await sync(date);const before=await count();await claimClick(id);assert.equal(await count(),before+1,'existing secondary dialog listener sends once');assert.match(await feedback(id).innerText(),/成功/);
  }
  await sync('2026-10-02T10:00:00Z');await claimClick('kgen-v102-festival-520');await page.screenshot({path:`${OUT}/festival-${width}-dialog.png`});
  await page.locator('#k12345-festival-close').tap();assert.deepEqual(await geometry(),baseline,'festival disclosure cannot shift Heart/MOVE/DRIVE/WARP');
  await page.evaluate(()=>{window.ethereum=null;KGEN_RUNTIME_CORE.modules.HeartRuntime.state.address='';});await sync('2026-05-20T00:00:01Z');
  await page.locator('#kgen-heart-toggle').tap();assert.equal(await page.locator('#kh-festival1').getAttribute('data-festival-state'),'WALLET_REQUIRED');const disconnectedCount=await count();await claimClick('kh-festival1');assert.match(await feedback('kh-festival1').innerText(),/錢包尚未連線/);assert.equal(await count(),disconnectedCount);
  reports.push({id:'12345-festival',width,height,clockCases:cases,transactionBoundary:festivalCalls,notOpen:'PASS',claimedOnce:'PASS',minuteTransition:'PASS',staleRead:'PASS',disabled:'PASS',cancellationAndRevert:'PASS',walletAndChainGate:'PASS',secondaryButtons:'PASS',broadcasts});
  assert.equal(broadcasts,0);reports.push({id:'12345-heart-actions',width,height,connectedOriginalTransactionPath:decoded,allowanceGate:'PASS',validation:'PASS',rejectionAndRevert:'PASS',pendingDuplicate:'PASS',positionStable:'PASS',broadcasts:0,physicalMetaMask:'HUMAN_RETEST_REQUIRED'});
 }catch(error){await page.screenshot({path:`${OUT}/heart-action-${width}-FAIL.png`});throw error;}finally{await context.close();}
}
for(const id of (heartOnly||process.argv.includes('--layout-only')?[]:preservation?['16888']:['12345','16888']))for(const [width,height]of (preservation?[[360,844],[390,844],[412,844],[432,844],[480,844]]:[[390,844],[844,390]])){
 const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),page=await context.newPage();
 const errors=[],commercialRequests=[];page.on('pageerror',e=>errors.push(String(e.stack||e)));page.on('request',r=>{if(/\/music\/.*(?:\.mp3|playlist\.json)/i.test(r.url()))commercialRequests.push(r.url());});
 await page.addInitScript(()=>{const Real=window.AudioContext||window.webkitAudioContext;window.__qaAudioContexts=[];window.__qaAnalysers=[];const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(destination,...args){const result=connect.call(this,destination,...args);if(destination===this.context.destination){const analyser=this.context.createAnalyser();connect.call(this,analyser);window.__qaAnalysers.push(analyser);}return result;};if(Real){window.AudioContext=class extends Real{constructor(...args){super(...args);window.__qaAudioContexts.push(this);}};window.webkitAudioContext=window.AudioContext;}});
 await page.goto(BASE+`/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/${id}/index.html`,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.KAIOS_AUDIO_CONTROL,{timeout:45000});
 await page.waitForTimeout(2500); // Legacy optional visual modules settle after DOMContentLoaded.
 const read=()=>page.evaluate(()=>window.KAIOS_AUDIO.snapshot());
 assert.equal((await read()).contextState,'NOT_CREATED');assert.equal((await read()).world,id);
 await page.screenshot({path:`${OUT}/world-${id}-${width}x${height}.png`});
 await page.locator('.nav-music').tap({timeout:15000});
 await page.waitForTimeout(400);
 assert.equal((await read()).musicPlaying,true,'FIRST TAP must enable audible music, not only open settings');
 await page.locator('.nav-music').tap();
 await page.locator('.kaios-audio-panel').waitFor({state:'visible'});
 await page.waitForFunction(()=>window.KAIOS_AUDIO.snapshot().musicPlaying);
 assert.equal(await page.evaluate(()=>window.__qaAudioContexts.length),1,'single AudioContext per world');
 assert.equal((await read()).activeMusicLayers,1);
 const signal=await page.evaluate(async()=>{let peak=0,rms=0;for(let i=0;i<30;i++){for(const a of __qaAnalysers){const values=new Float32Array(a.fftSize);a.getFloatTimeDomainData(values);let sum=0;for(const v of values){peak=Math.max(peak,Math.abs(v));sum+=v*v;}rms=Math.max(rms,Math.sqrt(sum/values.length));}await new Promise(r=>setTimeout(r,100));}return{peak,rms};});
 assert.ok(signal.rms>.008&&signal.peak>.02&&signal.peak<.95,'destination signal: audible digital headroom, not just scheduler state');
 assert.equal(await page.locator('audio').evaluateAll(nodes=>nodes.filter(n=>!n.paused).length),0,'legacy HTML media must not play alongside shared synth');
 await page.screenshot({path:`${OUT}/world-${id}-audio-${width}x${height}.png`});
 await page.locator('[data-audio-action=mute]').click();assert.equal((await read()).settings.muted,true);assert.equal((await read()).activeMusicLayers,0);
 await page.getByRole('button',{name:'關閉設定',exact:true}).click();
 const home=page.locator('[data-kaios-return=PORTAL]');assert.equal(await home.count(),1);assert.equal(new URL(await home.getAttribute('href'),page.url()).href,BASE+'/');
 await home.click();await page.waitForURL(BASE+'/');await page.locator('#primaryPlay').waitFor();
 const state=await page.evaluate(async()=>{const m=await import('./assets/kaios-audio.mjs');return m.getKaiosAudio().snapshot();});assert.equal(state.settings.muted,true);assert.equal(state.contextState,'NOT_CREATED');
 assert.deepEqual(commercialRequests,[],'no unlicensed legacy song downloads');
 assert.ok(errors.every(e=>!e.includes('kaios-audio')&&!e.includes('kaios-world-audio')),'shared audio errors');
 reports.push({id,width,height,audio:'PASS',signal,returnPortal:'PASS',commercialRequests:0,legacyPageErrors:errors});await context.close();
}
for(const [width,height] of (heartOnly?[]:[[360,844],[390,844],[412,844],[432,844],[480,844],[844,390]])){
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
  // sendHeart button listeners. This is shortcut/layout coverage only; the
  // connected four-action suite above keeps sendHeart intact through ethers.
  await page.evaluate(()=>{
   const heart=KGEN_RUNTIME_CORE.modules.HeartRuntime;
   window.__originalSendHeart=heart.sendHeart;window.__ritualCalls=[];
   heart.sendHeart=(label,runner,action)=>runner({
    makeWish:hash=>__ritualCalls.push({method:'makeWish',hash}),
    vowTo:(option,amount)=>__ritualCalls.push({method:'vowTo',option,amount})
   },action&&action.prepare());
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
