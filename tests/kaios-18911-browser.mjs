import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';

// This file may launch a browser only in the existing Linux CI job. Syntax
// checking it locally does not execute these guards or launch Chromium.
assert.equal(process.env.GITHUB_ACTIONS,'true','18911 browser QA is CI-only');
assert.equal(process.platform,'linux','18911 browser QA uses the Linux CI browser');
const BASE=(process.env.KAIOS_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const ROOT=new URL(BASE+'/');
assert.ok(['http:','https:'].includes(ROOT.protocol));
assert.ok(['127.0.0.1','localhost','[::1]'].includes(ROOT.hostname),'only the CI loopback static server is permitted');
for(const field of ['username','password','search','hash'])assert.equal(ROOT[field],'');
const OUT='artifacts/kaios-18911-qa';
const ENTRY=new URL('K線西遊記/temples/18911/index.html',ROOT).href;
const NOTICE='模擬驗收／未連真錢包';
const report={
  head:process.env.KAIOS_SOURCE_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  trackedDirty:!!execFileSync('git',['status','--porcelain','--untracked-files=no'],{encoding:'utf8'}).trim(),
  mode:'CI_SYNTHETIC_PROVIDER_ONLY',functional:'RUNNING',visual:'SCREENSHOTS_REQUIRE_DIRECT_REVIEW',
  realWallet:'NOT_TESTED',chainReads:0,realTransactions:0,profiles:[],runtimeErrors:[],errors:[],checks:[],
};
await fs.mkdir(OUT,{recursive:true});
const targetRecords=new WeakMap();

async function sourceFingerprint(relative){
  const bytes=await fs.readFile(new URL('../'+relative,import.meta.url));
  return createHash('sha256').update(bytes).digest('hex');
}

async function geometry(page,selector){
  return page.locator(selector).evaluate(el=>{
    const rect=el.getBoundingClientRect(),style=getComputedStyle(el);
    const hit=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);
    return {width:rect.width,height:rect.height,inView:rect.left>=0&&rect.right<=innerWidth&&rect.top>=0&&rect.bottom<=innerHeight,
      hit:!!hit&&(hit===el||el.contains(hit)),visible:style.visibility!=='hidden'&&style.display!=='none'&&Number(style.opacity)!==0};
  });
}

async function touchTarget(page,selector){
  await page.locator(selector).evaluate(el=>el.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));
  const rect=await geometry(page,selector);
  assert.ok(rect.visible&&rect.inView&&rect.hit,selector+' is visible and center-hit reachable');
  assert.ok(rect.width>=44&&rect.height>=44,selector+' has a 44px touch target');
  targetRecords.get(page)?.push({selector,...rect});
  return rect;
}

async function noOverflow(page){
  const dimensions=await page.evaluate(()=>({viewport:innerWidth,html:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
  assert.ok(dimensions.html<=dimensions.viewport&&dimensions.body<=dimensions.viewport,'18911 has no horizontal overflow '+JSON.stringify(dimensions));
  return dimensions;
}

async function isolatedContext(browser,profile){
  const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},
    isMobile:profile.width<600,hasTouch:profile.width<600,reducedMotion:'reduce',serviceWorkers:'block'});
  context.setDefaultTimeout(10_000);context.setDefaultNavigationTimeout(20_000);
  await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(!['GET','HEAD'].includes(request.method())||url.origin!==ROOT.origin){
      profile.blockedRequests.push({origin:url.origin,method:request.method(),type:request.resourceType()});
      await route.abort('blockedbyclient');return;
    }
    if(request.isNavigationRequest()){
      const response=await route.fetch({maxRedirects:0});
      // Preserve the actual document and scripts. CSP adds only an offline
      // network boundary; it never substitutes a mock page or application.
      // The real local Portal renderer owns service URLs. Permit that module;
      // external requests and every non-GET/HEAD request remain blocked above.
      const portal=url.pathname===ROOT.pathname||url.pathname===new URL('index.html',ROOT).pathname;
      await route.fulfill({response,headers:{...response.headers(),
        'content-security-policy':`${portal?"script-src 'self'; ":''}connect-src 'self'; frame-src 'none'; object-src 'none'; form-action 'none'`}});
      return;
    }
    await route.continue();
  });
  const page=await context.newPage();
  page.on('pageerror',error=>{const message=String(error.stack||error);profile.runtimeErrors.push(message);report.runtimeErrors.push(message);});
  page.on('console',message=>{if(message.type()==='error')profile.consoleErrors.push(message.text());});
  return {context,page};
}

const PAYLOAD=JSON.parse(await fs.readFile(new URL('../K線西遊記/temples/18911/contracts.json',import.meta.url),'utf8'));
const OWNER=PAYLOAD.expectedOwner;
const OTHER='0x1111111111111111111111111111111111111111';
const PENDING_KEY='kaios18911.pending.v1';
report.payload={chainId:PAYLOAD.chainId,sourceMain:PAYLOAD.sourceMain,programCommit:PAYLOAD.programCommit,expectedOwner:OWNER,
  dependencyPins:Object.fromEntries(Object.entries(PAYLOAD.dependencies).map(([name,item])=>[name,{address:item.address,codeHash:item.codeHash}])),
  scope:'SYNTHETIC_DEPENDENCY_READS_AND_UNMINED_DEPLOYMENT_ONLY',verifiedMinedDeployments:0};

async function installSyntheticWallet(context,page,row,{account=OWNER,chainId=56,sendMode='pending',guest=false}={}){
  row.rpc=[];row.sendRequests=[];
  await page.exposeFunction('__record18911SyntheticRpc',event=>{
    row.rpc.push(event);
    if(event.method==='eth_sendTransaction')row.sendRequests.push(event);
  });
  await context.addInitScript(({payload,account,chainId,sendMode,guest})=>{
    // The only application flag is a display-only notice. Authorization still
    // goes through the real client, real shared selector and real payload.
    window.__K18911_MOCK__=true;
    if(guest){delete window.ethereum;delete window.BinanceChain;return;}
    const state={account,chainId,sendMode,authorized:sessionStorage.getItem('18911.qa.authorized')==='true',sendCount:0};
    const listeners=new Map(),readGates=new Map(),zero='0x'+'0'.repeat(40);
    const hex=value=>'0x'+BigInt(value).toString(16);
    const normalized=value=>String(value).toLowerCase();
    let interfaces;
    function abi(){
      if(interfaces)return interfaces;
      if(!window.ethers?.utils?.Interface)throw Error('Real vendored ethers5 must load before synthetic RPC');
      const E=window.ethers.utils;
      interfaces={registry:new E.Interface(payload.registryABI),kaios:new E.Interface(payload.kaiosABI),kgen:new E.Interface(payload.kgenABI)};
      return interfaces;
    }
    function block(){
      const E=window.ethers.utils;
      return {number:'0x64',timestamp:hex(Math.floor(Date.now()/1000)),hash:E.id('18911 synthetic unmined QA block 100'),parentHash:E.id('18911 synthetic QA block 99')};
    }
    function values(name,method){
      const E=window.ethers.utils;
      if(name==='registry'){
        if(method==='owner')return [payload.expectedOwner];
        if(method==='pendingOwner')return [zero];
        if(method==='minimumDelay')return [3600];
        if(method==='bootstrapOpen')return [false];
        if(method==='organ')return [zero];
        if(method==='pendingOrgans')return [zero,0];
      }
      if(name==='kaios'){
        if(method==='KGEN')return [payload.dependencies.kgen.address];
        if(method==='ORGAN_REGISTRY')return [payload.dependencies.registry.address];
        if(method==='balanceOf')return [E.parseEther('100')];
        if(method==='allowance')return [0];
        if(method==='decimals')return [18];
        if(method==='totalSupply')return [E.parseEther('10000')];
      }
      if(name==='kgen'&&method==='balanceOf')return [E.parseEther('10')];
      throw Error('Unmodeled synthetic read '+name+'.'+method);
    }
    const provider={isMetaMask:true,
      on(type,listener){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(listener);return provider;},
      removeListener(type,listener){listeners.get(type)?.delete(listener);return provider;},
      async request({method,params=[]}){
        abi();
        const E=window.ethers.utils,event={method};
        if(method==='eth_sendTransaction'){
          const tx=params[0];
          event.transaction={from:tx.from,to:tx.to??null,value:tx.value??'0x0',chainId:tx.chainId,gas:tx.gas,gasPrice:tx.gasPrice,dataHash:E.keccak256(tx.data)};
          const artifact=payload.contracts.KUFO;
          if(tx.data.startsWith(artifact.bytecode)){
            const constructor=new E.Interface(artifact.abi).deploy;
            const decoded=E.defaultAbiCoder.decode(constructor.inputs,'0x'+tx.data.slice(artifact.bytecode.length));
            event.transaction.creationContract='KUFO';
            event.transaction.constructor={registry:decoded[0],kaios:decoded[1],calendar:{version:decoded[2][0],activationTime:decoded[2][1].toString(),utcOffsetSeconds:Number(decoded[2][2]),constellationByMonth:Array.from(decoded[2][3],Number)}};
          }
        }
        await window.__record18911SyntheticRpc(event);
        const gate=Array.from(readGates.values()).find(item=>item.method===method&&!item.waiting&&!item.settled);
        if(gate){
          gate.waiting=true;
          try{await new Promise((resolve,reject)=>{gate.resolve=resolve;gate.reject=reject;});}
          finally{gate.settled=true;}
        }
        if(method==='eth_chainId')return hex(state.chainId);
        if(method==='eth_requestAccounts'){state.authorized=true;sessionStorage.setItem('18911.qa.authorized','true');return [state.account];}
        if(method==='eth_accounts')return state.authorized?[state.account]:[];
        if(method==='eth_getBlockByNumber')return block();
        if(method==='eth_getBalance')return hex(E.parseEther('0.5').toString());
        if(method==='eth_gasPrice')return hex(50_000_000);
        if(method==='eth_estimateGas')return '0x100000';
        if(method==='eth_getTransactionCount')return hex(state.sendCount);
        if(method==='eth_getCode'){
          const dep=Object.values(payload.dependencies).find(item=>normalized(item.address)===normalized(params[0]));
          return dep?dep.code:'0x';
        }
        if(method==='eth_call'){
          const dep=Object.entries(payload.dependencies).find(([,item])=>normalized(item.address)===normalized(params[0].to));
          if(!dep)throw Error('Unmodeled synthetic contract address '+params[0].to);
          const iface=interfaces[dep[0]],parsed=iface.parseTransaction({data:params[0].data});
          return iface.encodeFunctionResult(parsed.name,values(dep[0],parsed.name));
        }
        if(method==='eth_sendTransaction'){
          if(state.sendMode==='reject'){const error=new Error('Synthetic wallet: holder rejected');error.code=4001;throw error;}
          state.sendCount++;
          // No receipt is fabricated. The real UI must keep this pending.
          return E.id('18911 synthetic pending transaction '+state.sendCount);
        }
        if(method==='eth_getTransactionReceipt'||method==='eth_getTransactionByHash')return null;
        throw Error('Unmodeled EIP1193 method; network fallback forbidden: '+method);
      },
    };
    window.ethereum=provider;
    window.__18911WalletQA={
      disconnect(){state.authorized=false;sessionStorage.removeItem('18911.qa.authorized');for(const listener of listeners.get('disconnect')||[])listener({code:4900,message:'Synthetic disconnect'});},
      changeAccount(next){state.account=next;for(const listener of listeners.get('accountsChanged')||[])listener([next]);},
      gateRead(id){
        if(readGates.has(id))throw Error('Synthetic read gate must be unique');
        readGates.set(id,{method:'eth_getBlockByNumber',waiting:false,settled:false});
      },
      gateState(id){const gate=readGates.get(id);return gate?{method:gate.method,waiting:gate.waiting,settled:gate.settled}:null;},
      releaseRead(id,mode){
        const gate=readGates.get(id);if(!gate?.waiting||gate.settled)throw Error('Synthetic read gate is not waiting');
        if(mode==='reject'){const error=new Error('Synthetic late read rejection');error.code=-32000;gate.reject(error);}
        else if(mode==='resolve')gate.resolve();else throw Error('Unknown synthetic gate release mode');
      },
    };
  },{payload:PAYLOAD,account,chainId,sendMode,guest});
}

async function phase(page,expected){
  const list=Array.isArray(expected)?expected:[expected];
  await page.waitForFunction(states=>states.includes(document.querySelector('#appStatus')?.dataset.state)&&!document.body.classList.contains('loading'),list);
  return page.locator('#appStatus').getAttribute('data-state');
}

async function capture(page,row,label){
  assert.equal(await page.locator('#mockNotice').textContent(),NOTICE);
  assert.ok(await page.locator('#mockNotice').isVisible(),'synthetic wallet notice remains visible in the real page');
  row.overflow=await noOverflow(page);
  const skip=await page.locator('a.skip').evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {focused:document.activeElement===el,top:r.top,bottom:r.bottom,width:r.width,height:r.height,clipPath:s.clipPath};});
  assert.equal(skip.focused,false,'ordinary screenshots do not retain keyboard skip-link focus');
  assert.ok(skip.width<=1&&skip.height<=1&&skip.clipPath==='inset(50%)','unfocused skip link is clipped, not an offscreen floating overlay');
  (row.skipVisibility??=[]).push({label,...skip});
  const filename=`${row.profile}-${row.name}-${label}.png`;
  const viewport=`${row.profile}-${row.name}-${label}-viewport.png`;
  await page.screenshot({path:`${OUT}/${viewport}`,fullPage:false});
  await page.screenshot({path:`${OUT}/${filename}`,fullPage:true});
  row.screenshots.push(viewport,filename);
}

async function connect(page){
  await touchTarget(page,'#connectWallet');
  await page.locator('#connectWallet').click();
  await phase(page,['CONNECTED','BLOCKED','PENDING']);
}

async function ownerReview(page,row){
  await connect(page);await phase(page,'CONNECTED');
  assert.equal((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase());
  await touchTarget(page,'#activationNow');await page.locator('#activationNow').click();
  assert.ok(await page.locator('#activationTime').inputValue(),'activation remains an explicit user action');
  await touchTarget(page,'#prepareDeploy');
  assert.ok(await page.locator('#prepareDeploy').isEnabled(),'verified synthetic owner may preview');
  await page.locator('#prepareDeploy').click();await phase(page,'REVIEW');
  assert.ok(await page.locator('#reviewPanel').isVisible());
  assert.match(await page.locator('#reviewDetails').textContent(),/KUFO/);
  assert.match(await page.locator('#reviewDetails').textContent(),new RegExp(OWNER,'i'));
  const definitions=await page.locator('#reviewDetails').evaluate(host=>Object.fromEntries(
    Array.from(host.querySelectorAll('dt'),term=>[term.textContent,term.nextElementSibling?.textContent])));
  assert.equal(definitions['Registry 地址'].toLowerCase(),PAYLOAD.dependencies.registry.address.toLowerCase(),'preview renders the actual constructor Registry binding');
  assert.equal(definitions['KAIOS 地址'].toLowerCase(),PAYLOAD.dependencies.kaios.address.toLowerCase(),'preview renders the actual constructor KAIOS binding');
  assert.equal(definitions['曆法版本'].toLowerCase(),PAYLOAD.calendar.version.toLowerCase());
  assert.equal(definitions['時區'],'28800 秒（UTC+8）');
  assert.equal(definitions['1 至 12 月星座 ID'],'10、11、12、1、2、3、4、5、6、7、8、9');
  const activation=await page.locator('#activationTime').inputValue();
  assert.equal(definitions['啟用 timestamp'],String(Math.floor(Date.parse(activation+'+08:00')/1000)));
  assert.equal(definitions['參數核對失敗'],undefined,'decoded immutable parameters must be reviewable before confirmation');
  row.constructorPreview=definitions;
  assert.equal(await page.locator('#reviewCap').inputValue(),'','spending limit is never defaulted');
  assert.equal(await page.locator('#acceptReview').isChecked(),false);
  assert.equal(await page.locator('#confirmReview').isEnabled(),false);
  assert.equal(row.sendRequests.length,0,'preview never opens a wallet transaction');
}

async function accept(page){
  await touchTarget(page,'#reviewCap');await page.locator('#reviewCap').fill('0.1');
  // The native checkbox is 22px; the actual associated label supplies the
  // full 48px touch target and is what a phone user taps.
  const label='#reviewPanel label.check';await touchTarget(page,label);await page.locator(label).click();
  assert.ok(await page.locator('#acceptReview').isChecked());
  await touchTarget(page,'#confirmReview');assert.ok(await page.locator('#confirmReview').isEnabled());
}

async function delayedReadLifecycle(page,row,releaseMode){
  const id=`${row.name}-${releaseMode}-${row.asyncLifecycleCases?.length||0}`;
  const oldId=id+'-old',newId=id+'-new';
  const savedPending=await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY);
  const sendsBefore=row.sendRequests.length;
  await page.evaluate(gateId=>window.__18911WalletQA.gateRead(gateId),oldId);
  await touchTarget(page,'#refreshStatus');await page.locator('#refreshStatus').click();
  await page.waitForFunction(gateId=>window.__18911WalletQA.gateState(gateId)?.waiting,oldId);
  assert.ok(await page.locator('body').evaluate(el=>el.classList.contains('loading')),'old refresh is genuinely awaiting an unresolved provider read');
  const rpcBeforeRestore=row.rpc.length;
  await page.evaluate(()=>{
    window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));
    window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
  });
  await phase(page,'IDLE');
  assert.equal(row.rpc.length,rpcBeforeRestore,'synthetic persisted restoration never automatically queries a provider');
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),savedPending,'restoration preserves the exact saved financial intent');
  assert.ok(await page.locator('#connectWallet').isEnabled(),'new client is usable while the old provider promise is unresolved');
  if(savedPending){await connect(page);await phase(page,'PENDING');}
  else await ownerReview(page,row);
  assert.deepEqual(await page.evaluate(gateId=>window.__18911WalletQA.gateState(gateId),oldId),{method:'eth_getBlockByNumber',waiting:true,settled:false},'manual reconnect and preview do not depend on the old read settling');
  await page.evaluate(gateId=>window.__18911WalletQA.gateRead(gateId),newId);
  await touchTarget(page,'#refreshStatus');await page.locator('#refreshStatus').click();
  await page.waitForFunction(gateId=>window.__18911WalletQA.gateState(gateId)?.waiting,newId);
  const ui=()=>page.evaluate(()=>({
    phase:document.querySelector('#appStatus').dataset.state,status:document.querySelector('#appStatus').textContent,
    error:document.querySelector('#appStatus').classList.contains('error'),busy:document.body.classList.contains('loading'),
    connectDisabled:document.querySelector('#connectWallet').disabled,confirmDisabled:document.querySelector('#confirmReview').disabled,
  }));
  const currentBusy=await ui();assert.equal(currentBusy.busy,true);assert.equal(currentBusy.connectDisabled,true);
  await page.evaluate(({gateId,mode})=>window.__18911WalletQA.releaseRead(gateId,mode),{gateId:oldId,mode:releaseMode});
  await page.waitForFunction(gateId=>window.__18911WalletQA.gateState(gateId)?.settled,oldId);
  // Allow the disposed action's catch/finally and render microtasks to run.
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  assert.deepEqual(await ui(),currentBusy,'old late resolution/rejection cannot override current phase, error or new in-flight busy state');
  assert.equal(row.sendRequests.length,sendsBefore,'stale read settlement never opens a wallet request');
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),savedPending,'late read settlement cannot alter the saved financial pending intent');
  await page.evaluate(gateId=>window.__18911WalletQA.releaseRead(gateId,'resolve'),newId);
  await phase(page,savedPending?'PENDING':'CONNECTED');
  assert.equal((await ui()).error,false,'current refresh finishes without inheriting an old error');
  assert.equal(row.sendRequests.length,sendsBefore);
  if(savedPending){
    assert.ok(await page.locator('#pendingPanel').isVisible());
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),savedPending);
  }else await ownerReview(page,row);
  (row.asyncLifecycleCases??=[]).push({kind:'SYNTHETIC_DELAYED_READ_PERSISTED_EVENTS',oldReadOutcome:releaseMode,
    actualBFCache:'NOT_TESTED',automaticRestoreRpc:0,
    newClientUsableBeforeOldSettlement:true,newBusyProtected:true,oldLateUiUnchanged:true,savedPendingPreserved:true,transactionRequestsAdded:row.sendRequests.length-sendsBefore});
  await capture(page,row,`synthetic-late-${releaseMode}-${savedPending?'pending':'review'}`);
}

async function runScenario(browser,profile,name,options,fn){
  const row={profile:profile.name,name,width:profile.width,height:profile.height,functional:'RUNNING',screenshots:[],touchTargets:[],blockedRequests:[],runtimeErrors:[],consoleErrors:[]};
  profile.scenarios.push(row);
  const {context,page}=await isolatedContext(browser,row);
  targetRecords.set(page,row.touchTargets);
  try{
    await installSyntheticWallet(context,page,row,options);
    let response;
    if(options.guest){
      const portal=new URL('index.html',ROOT).href;
      const rootResponse=await page.goto(portal,{waitUntil:'load'});assert.ok(rootResponse?.ok(),'real portal document loads');
      assert.equal(await page.locator('#alchemyService').count(),1,'one canonical 18911 portal link');
      await page.waitForFunction(expected=>document.querySelector('#alchemyService')?.href===expected,ENTRY);
      assert.equal(await page.locator('#alchemyService').getAttribute('href'),ENTRY);
      row.entryLink={from:page.url(),geometry:await touchTarget(page,'#alchemyService'),to:ENTRY,portalScripts:'REAL_LOCAL_RENDERER_OFFLINE_NETWORK_ONLY'};
      [response]=await Promise.all([
        page.waitForResponse(item=>item.request().isNavigationRequest()&&item.url()===ENTRY),
        page.waitForURL(ENTRY,{waitUntil:'load'}),page.locator('#alchemyService').click(),
      ]);
      assert.equal(page.url(),ENTRY,'actual portal click reaches the 18911 page');
    }else response=await page.goto(ENTRY,{waitUntil:'load'});
    assert.ok(response?.ok(),'real 18911 HTML returns HTTP success');
    await page.waitForFunction(()=>document.querySelector('#appStatus')?.dataset.state!=='LOADING');
    assert.equal(await page.title(),'18911 煉丹爐 · KUFO');
    assert.match(await page.locator('h1').textContent(),/18911/);
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,0,'loading the real page never requests wallet authorization');
    assert.equal(row.sendRequests.length,0,'loading the real page never requests a transaction');
    await fn(page,row);
    assert.deepEqual(row.runtimeErrors,[],'real page/client/vendor scripts have no uncaught errors');
    assert.deepEqual(row.blockedRequests,[],'real panel makes no external request or network write');
    row.functional='PASS';
  }catch(error){
    row.functional='FAIL';row.error=String(error.stack||error);
    try{await page.screenshot({path:`${OUT}/${profile.name}-${name}-failure.png`,fullPage:true});}catch{}
    throw error;
  }finally{
    row.lastStatus=await page.locator('#appStatus').textContent().catch(()=>null);
    row.lastState=await page.locator('#appStatus').getAttribute('data-state').catch(()=>null);
    await context.close();
  }
}

async function runProfile(browser,width,height){
  const profile={name:`${width}x${height}`,width,height,scenarios:[]};report.profiles.push(profile);
  await runScenario(browser,profile,'guest',{guest:true},async(page,row)=>{
    assert.equal(await page.evaluate(()=>Boolean(window.ethereum)),false);
    assert.ok(await page.locator('#playerPanel').isVisible());assert.ok(await page.locator('#ownerPanel').isVisible());
    assert.equal(await page.locator('#prepareAlchemy').isEnabled(),false);
    assert.equal(await page.locator('#prepareDeploy').isEnabled(),false);
    assert.equal(await page.locator('#deploySteps li').count(),5,'all five real deployment steps are presented');
    assert.match(await page.locator('#chainState').textContent(),/未|尚/);
    assert.equal(row.rpc.length,0,'guest page does not request accounts or chain access');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('a.skip').evaluate(el=>document.activeElement===el),true,'keyboard users can focus the first skip link');
    row.keyboardSkip=await touchTarget(page,'a.skip');
    await page.locator('#connectWallet').focus();
    assert.equal(row.rpc.length,0,'keyboard focus does not connect a wallet');
    for(const control of ['#connectWallet','#kaiosAmount','#lifeId','#activationTime','#activationNow'])await touchTarget(page,control);
    await capture(page,row,'overview');
  });
  await runScenario(browser,profile,'wrong-chain',{chainId:1},async(page,row)=>{
    await connect(page);await phase(page,'BLOCKED');
    assert.match(await page.locator('#appStatus').textContent(),/BSC|56/);
    assert.equal(await page.locator('#prepareDeploy').isEnabled(),false);
    assert.equal(await page.locator('#prepareAlchemy').isEnabled(),false);
    assert.equal(row.sendRequests.length,0);
    assert.equal(row.rpc.some(item=>item.method==='wallet_switchEthereumChain'||item.method==='wallet_addEthereumChain'),false,'UI never silently changes wallet network');
    await capture(page,row,'blocked');
  });
  await runScenario(browser,profile,'non-owner',{account:OTHER},async(page,row)=>{
    await connect(page);await phase(page,'CONNECTED');
    assert.equal((await page.locator('#walletAccount').textContent()).toLowerCase(),OTHER.toLowerCase());
    assert.equal((await page.locator('#ownerAddress').textContent()).toLowerCase(),OWNER.toLowerCase());
    await page.locator('#activationNow').click();
    assert.equal(await page.locator('#prepareDeploy').isEnabled(),false,'non-owner cannot deploy');
    await page.locator('#kaiosAmount').fill('1');
    await touchTarget(page,'#prepareAlchemy');await page.locator('#prepareAlchemy').click();await phase(page,'BLOCKED');
    assert.match(await page.locator('#appStatus').textContent(),/尚未啟用|尚未.*驗證|尚未.*核實/,'unverified new contracts cannot be replaced by old contracts');
    assert.equal(await page.locator('#reviewPanel').isVisible(),false,'no alchemy review is issued before activation');
    assert.equal(row.sendRequests.length,0);await capture(page,row,'blocked');
  });
  await runScenario(browser,profile,'owner-preview',{},async(page,row)=>{
    await ownerReview(page,row);await capture(page,row,'review');
    for(const mode of ['resolve','reject'])await delayedReadLifecycle(page,row,mode);
    await touchTarget(page,'#cancelReview');await page.locator('#cancelReview').click();
    assert.equal(await page.locator('#reviewPanel').isVisible(),false);
    assert.equal(row.sendRequests.length,0,'canceling a review never requests a transaction');
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),null);
    await capture(page,row,'cancelled');
  });
  await runScenario(browser,profile,'wallet-rejected',{sendMode:'reject'},async(page,row)=>{
    await ownerReview(page,row);await accept(page);await page.locator('#confirmReview').click();await phase(page,'REJECTED');
    assert.equal(row.sendRequests.length,1,'one deliberate confirm opens one synthetic wallet prompt');
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),null,'explicit wallet rejection clears only the unsigned pending intent');
    assert.equal(await page.locator('#pendingPanel').isVisible(),false);
    await capture(page,row,'rejected');
  });
  await runScenario(browser,profile,'pending-reload',{},async(page,row)=>{
    await ownerReview(page,row);await accept(page);await page.locator('#confirmReview').click();await phase(page,'SUBMITTED');
    assert.equal(row.sendRequests.length,1);
    const transaction=row.sendRequests[0].transaction;
    assert.equal(transaction.from.toLowerCase(),OWNER.toLowerCase());assert.equal(transaction.to,null);assert.equal(BigInt(transaction.value),0n);
    assert.equal(transaction.chainId,'0x38');assert.equal(transaction.creationContract,'KUFO');
    assert.equal(transaction.constructor.registry.toLowerCase(),PAYLOAD.dependencies.registry.address.toLowerCase());
    assert.equal(transaction.constructor.kaios.toLowerCase(),PAYLOAD.dependencies.kaios.address.toLowerCase());
    assert.equal(transaction.constructor.calendar.utcOffsetSeconds,28800);
    assert.deepEqual(transaction.constructor.calendar.constellationByMonth,[10,11,12,1,2,3,4,5,6,7,8,9]);
    const pending=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),PENDING_KEY);
    assert.equal(pending.phase,'SUBMITTED');assert.match(pending.hash,/^0x[0-9a-f]{64}$/i);
    assert.equal(await page.locator('#prepareDeploy').isEnabled(),false);
    assert.equal(await page.locator('#prepareAlchemy').isEnabled(),false);
    assert.equal(await page.locator('#reviewPanel').isVisible(),false);
    assert.ok(await page.locator('#pendingPanel').isVisible());
    assert.equal(row.rpc.filter(item=>item.method==='eth_getTransactionReceipt').length,0,'no automatic receipt polling after submission');
    await capture(page,row,'submitted');
    await touchTarget(page,'#resumePending');await page.locator('#resumePending').click();await phase(page,'PENDING');
    assert.equal(row.sendRequests.length,1,'resume only reads the saved receipt');
    assert.equal(row.rpc.filter(item=>item.method==='eth_getTransactionReceipt').length,1);
    await page.reload({waitUntil:'load'});
    await page.waitForFunction(()=>document.querySelector('#appStatus')?.dataset.state!=='LOADING');
    assert.equal((await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),PENDING_KEY)).hash,pending.hash);
    assert.ok(await page.locator('#pendingPanel').isVisible(),'saved pending intent survives a real page reload');
    assert.equal(row.sendRequests.length,1,'reload never resubmits');
    await connect(page);await phase(page,'PENDING');
    await page.locator('#resumePending').click();await phase(page,'PENDING');
    assert.equal(row.sendRequests.length,1,'reconnected pending recovery never resubmits');
    assert.equal(await page.locator('#deploySteps .step-status').filter({hasText:/鏈上已核/}).count(),0,'no receipt means no verified deployment');
    await capture(page,row,'restored');
    for(const mode of ['resolve','reject'])await delayedReadLifecycle(page,row,mode);
  });
  await runScenario(browser,profile,'disconnect',{},async(page,row)=>{
    await ownerReview(page,row);await accept(page);
    await page.evaluate(()=>window.__18911WalletQA.disconnect());await phase(page,'STALE');
    assert.equal(await page.locator('#reviewPanel').isVisible(),false);
    assert.equal(await page.locator('#prepareDeploy').isEnabled(),false);
    assert.equal(await page.locator('#prepareAlchemy').isEnabled(),false);
    assert.equal(row.sendRequests.length,0,'disconnection invalidates an accepted but unsigned review');
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),null);
    await capture(page,row,'invalidated');
    const rpcBefore=row.rpc.length;
    // Explicit synthetic lifecycle smoke: these untrusted DOM events exercise
    // the production persisted handler. They do not prove real BFCache entry
    // or restoration by any physical phone/browser.
    await page.evaluate(()=>{
      window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));
      window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
    });
    await phase(page,'IDLE');
    assert.equal(row.rpc.length,rpcBefore,'persisted lifecycle handler does not automatically query a wallet or chain');
    assert.equal(row.sendRequests.length,0,'persisted lifecycle handler never requests a transaction');
    assert.equal(await page.locator('#reviewPanel').isVisible(),false);
    assert.equal(await page.locator('#acceptReview').isChecked(),false,'persisted restoration clears the old consent');
    assert.equal(await page.locator('#reviewCap').inputValue(),'','persisted restoration clears the old spending cap');
    assert.equal(await page.locator('#playerBalance').textContent(),'連線並查詢後顯示');
    row.lifecycle={kind:'SYNTHETIC_PERSISTED_PAGE_TRANSITION_EVENTS',actualBFCache:'NOT_TESTED',automaticRpcRequests:row.rpc.length-rpcBefore,automaticTransactionRequests:row.sendRequests.length};
    await capture(page,row,'synthetic-persisted-restored');
    await ownerReview(page,row);
    assert.equal(row.sendRequests.length,0,'fresh explicit connect and preview work after safe client reconstruction');
    await capture(page,row,'synthetic-persisted-manual-preview');
  });
  await runScenario(browser,profile,'account-switch',{},async(page,row)=>{
    await ownerReview(page,row);
    await page.evaluate(other=>window.__18911WalletQA.changeAccount(other),OTHER);await phase(page,'STALE');
    assert.equal(await page.locator('#reviewPanel').isVisible(),false);assert.equal(row.sendRequests.length,0);
    await connect(page);await phase(page,'CONNECTED');
    assert.equal((await page.locator('#walletAccount').textContent()).toLowerCase(),OTHER.toLowerCase());
    assert.equal(await page.locator('#prepareDeploy').isEnabled(),false,'account switching cannot reuse the previous owner review');
    await capture(page,row,'switched');
  });
  profile.functional='PASS';
}

let browser;
try{
  report.sourceSha256=Object.fromEntries(await Promise.all([
    'tests/kaios-18911-browser.mjs','index.html','assets/kaios-portal.mjs','K線西遊記/temples/18911/index.html','K線西遊記/temples/18911/panel.mjs',
    'K線西遊記/temples/18911/kufo-client.mjs','K線西遊記/temples/18911/contracts.json',
    'K線西遊記/temples/12345/assets/ethers-5.7.2.umd.min.js','K線西遊記/modules/kgen-game-core.js',
  ].map(async path=>[path,await sourceFingerprint(path)])));
  browser=await chromium.launch({headless:true});
  for(const [width,height]of [[390,844],[1280,900]])await runProfile(browser,width,height);
  report.checks.push('Actual 18911 HTML, panel, client, shared wallet selector and ethers5; synthetic provider only; no fabricated mined receipt.');
  report.checks.push('Guest, wrong chain, non-owner, owner preview/cancel, wallet rejection, durable pending/resume/reload, disconnect and account switch at both viewports.');
  report.checks.push('Constructor preview shows actual Registry/KAIOS/version/timestamp/UTC+8/month IDs. Synthetic persisted pagehide/pageshow handler smoke only; actual BFCache and physical phone restoration remain NOT_TESTED.');
  report.checks.push('Keyboard skip link is reachable when focused and clipped when unfocused; each state includes an actual viewport shot and full-page shot, with bounding-rectangle evidence.');
  report.checks.push('Unresolved synthetic refresh survives persisted lifecycle reconstruction; old late resolve/reject cannot override a new in-flight operation or alter an existing financial pending intent.');
  report.functional='PASS';
}catch(error){report.functional='FAIL';report.errors.push(String(error.stack||error));process.exitCode=1;}
finally{
  await browser?.close();
  report.syntheticTransactionRequests=report.profiles.flatMap(profile=>profile.scenarios).reduce((sum,row)=>sum+(row.sendRequests?.length||0),0);
  await fs.writeFile(`${OUT}/report.json`,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({head:report.head,functional:report.functional,visual:report.visual,profiles:report.profiles.length,syntheticTransactionRequests:report.syntheticTransactionRequests,report:`${OUT}/report.json`}));
}
