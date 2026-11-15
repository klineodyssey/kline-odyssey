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
const PUBLIC_RPC=new URL('https://bsc-dataseed.bnbchain.org').href;
const PUBLIC_READS=new Set(['eth_chainId','eth_accounts','eth_getBlockByNumber','eth_getBlockByHash','eth_getCode','eth_call','eth_getBalance','eth_getTransactionReceipt','eth_getTransactionByHash']);
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
  let page;
  await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(request.method()==='POST'&&url.href===PUBLIC_RPC){
      const body=request.postDataJSON();
      assert.ok(body&&!Array.isArray(body)&&body.jsonrpc==='2.0'&&PUBLIC_READS.has(body.method),'only the exact public read-only JSON-RPC endpoint is modeled');
      (profile.publicRpc??=[]).push({method:body.method,url:url.href,mode:'ROUTE_FULFILLED_SYNTHETIC_NO_UPSTREAM'});
      if(profile.publicHttpStatus){await route.fulfill({status:profile.publicHttpStatus,contentType:'application/json',body:JSON.stringify({error:'Synthetic permission or quota response'})});return;}
      const result=await page.evaluate(async({method,params})=>{
        try{return {result:await window.__18911RpcQA.request({method,params})};}
        catch(error){return {error:{code:Number.isInteger(error.code)?error.code:-32000,message:String(error.message||error)}};}
      },{method:body.method,params:body.params||[]});
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({jsonrpc:'2.0',id:body.id??null,...result})});return;
    }
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
        'content-security-policy':`${portal?"script-src 'self'; ":''}connect-src 'self' https://bsc-dataseed.bnbchain.org; frame-src 'none'; object-src 'none'; form-action 'none'`}});
      return;
    }
    await route.continue();
  });
  page=await context.newPage();
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
  scope:'SYNTHETIC_READS_AND_EXPLICIT_QA_MINED_DEPLOYMENTS_ONLY',realVerifiedMinedDeployments:0};

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
    const qaLedgerKey='18911.qa.synthetic-chain.v1';
    const storedLedger=JSON.parse(sessionStorage.getItem(qaLedgerKey)||'null');
    if(storedLedger&&storedLedger.programCommit!==payload.programCommit)throw Error('Synthetic ledger belongs to another artifact set');
    const state={account,chainId,sendMode,authorized:sessionStorage.getItem('18911.qa.authorized')==='true',sendCount:storedLedger?.sendCount||0};
    const listeners=new Map(),readGates=new Map(),zero='0x'+'0'.repeat(40);
    // This QA-only chain ledger survives a real page reload. It is separate
    // from every production localStorage pending/journal/archive key.
    const transactions=new Map(storedLedger?.transactions),receipts=new Map(storedLedger?.receipts),blocks=new Map(storedLedger?.blocks),deployed=new Map(storedLedger?.deployed),proposals=new Map(storedLedger?.proposals),codeOverrides=new Map();
    function persistLedger(){sessionStorage.setItem(qaLedgerKey,JSON.stringify({scope:'SYNTHETIC_CHAIN_ONLY',programCommit:payload.programCommit,sendCount:state.sendCount,transactions:[...transactions],receipts:[...receipts],blocks:[...blocks],deployed:[...deployed],proposals:[...proposals]}));}
    const counters=new Map();
    let qaVisibility='visible';
    let readFailure=null;
    const hex=value=>'0x'+BigInt(value).toString(16);
    const normalized=value=>String(value).toLowerCase();
    let interfaces;
    function abi(){
      if(interfaces)return interfaces;
      if(!window.ethers?.utils?.Interface)throw Error('Real vendored ethers5 must load before synthetic RPC');
      const E=window.ethers.utils;
      interfaces={registry:new E.Interface(payload.registryABI),kaios:new E.Interface(payload.kaiosABI),kgen:new E.Interface(payload.kgenABI),
        ...Object.fromEntries(Object.entries(payload.contracts).map(([name,item])=>[name,new E.Interface(item.abi)]))};
      return interfaces;
    }
    function block(number=100){
      const E=window.ethers.utils;
      const cached=blocks.get(Number(number));if(cached)return cached;
      const created={number:hex(number),timestamp:hex(Math.floor(Date.now()/1000)),hash:E.id('18911 synthetic QA block '+number),parentHash:E.id('18911 synthetic QA block '+(number-1))};
      blocks.set(Number(number),created);persistLedger();return created;
    }
    function values(name,method,args){
      const E=window.ethers.utils;
      if(name==='registry'){
        if(method==='owner')return [payload.expectedOwner];
        if(method==='pendingOwner')return [zero];
        if(method==='minimumDelay')return [3600];
        if(method==='bootstrapOpen')return [false];
        if(method==='organ')return [zero];
        if(method==='pendingOrgans')return proposals.get(normalized(args[0]))||[zero,0];
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
      const deployedAddress=contract=>deployed.get(contract)?.address;
      const cfg=deployed.get('KUFO')?.config;
      if(name==='KUFO'){
        if(method==='kaios')return [payload.dependencies.kaios.address];
        if(method==='organRegistry')return [payload.dependencies.registry.address];
        if(method==='calendarVersion')return [cfg.version];
        if(method==='calendarHash')return [E.keccak256(E.defaultAbiCoder.encode(['bytes32','uint64','int32','uint8[12]'],[cfg.version,cfg.activationTime,cfg.utcOffsetSeconds,cfg.constellationByMonth]))];
        if(method==='activationTime')return [cfg.activationTime];
        if(method==='utcOffsetSeconds')return [28800];
        const date=new Date(Number(method==='civilDate'?args[0]:cfg.activationTime)*1000+28800000);
        if(method==='civilDate')return [date.getUTCFullYear(),date.getUTCMonth()+1,date.getUTCDate()];
        if(method==='firstBirthYear')return [date.getUTCFullYear()];
        if(method==='firstBirthMonth')return [date.getUTCMonth()+1];
        if(method==='maximumGroupId')return [Math.min(4294967295,(4294967292-date.getUTCFullYear()+1)*12)];
        if(method==='calendarConfig')return [[cfg.version,cfg.activationTime,28800,cfg.constellationByMonth]];
        if(method==='cap')return [E.parseEther('72000000000000')];
        if(method==='balanceOf'||method==='totalSupply')return [0];
      }
      if(name==='KAIOSAlchemyFurnace'){
        if(method==='kaios')return [payload.dependencies.kaios.address];
        if(method==='kgen')return [payload.dependencies.kgen.address];
        if(method==='organRegistry')return [payload.dependencies.registry.address];
        if(method==='canonicalKufo')return [deployedAddress('KUFO')];
      }
      if(name==='KUFOOutputJindouyun168888'){
        if(method==='furnace')return [deployedAddress('KAIOSAlchemyFurnace')];
        if(method==='kufo')return [deployedAddress('KUFO')];
      }
      if(name==='KSHIP'){
        if(method==='organRegistry')return [payload.dependencies.registry.address];
        if(method==='kufo')return [deployedAddress('KUFO')];
        if(method==='cap')return [E.parseEther('72000000000000000')];
      }
      if(name==='KSHIPConverter'){
        if(method==='kufo')return [deployedAddress('KUFO')];
        if(method==='kship')return [deployedAddress('KSHIP')];
      }
      throw Error('Unmodeled synthetic read '+name+'.'+method);
    }
    const provider={isMetaMask:true,
      on(type,listener){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(listener);return provider;},
      removeListener(type,listener){listeners.get(type)?.delete(listener);return provider;},
      async request({method,params=[],qaLane='wallet'}){
        abi();
        const E=window.ethers.utils,event={method,lane:qaLane,at:Date.now()};
        counters.set(method,(counters.get(method)||0)+1);
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
        if(readFailure?.remaining>0&&method===readFailure.method){readFailure.remaining--;const error=new Error('Synthetic technical read failure');error.code=-32000;throw error;}
        const gate=Array.from(readGates.values()).find(item=>item.method===method&&!item.waiting&&!item.settled);
        if(gate){
          gate.waiting=true;
          try{await new Promise((resolve,reject)=>{gate.resolve=resolve;gate.reject=reject;});}
          finally{gate.settled=true;}
        }
        if(method==='eth_chainId')return hex(qaLane==='public'?56:state.chainId);
        if(method==='eth_requestAccounts'){state.authorized=true;sessionStorage.setItem('18911.qa.authorized','true');return [state.account];}
        if(method==='eth_accounts')return qaLane!=='public'&&state.authorized?[state.account]:[];
        if(method==='eth_getBlockByNumber'){
          // Numeric historical reads never invent a previously unknown block.
          if(params[0]!=='latest')return blocks.get(Number(BigInt(params[0])))||null;
          let number=blocks.size?Math.max(...blocks.keys()):100,latest=blocks.get(number);
          if(latest&&Number(BigInt(latest.timestamp))<Math.floor(Date.now()/1000))number++;
          return block(number);
        }
        if(method==='eth_getBlockByHash')return Array.from(blocks.values()).find(item=>item.hash===params[0])||null;
        if(method==='eth_getBalance')return hex(E.parseEther('0.5').toString());
        if(method==='eth_gasPrice')return hex(50_000_000);
        if(method==='eth_estimateGas')return '0x100000';
        if(method==='eth_getTransactionCount')return hex(state.sendCount);
        if(method==='eth_getCode'){
          if(codeOverrides.has(normalized(params[0])))return codeOverrides.get(normalized(params[0]));
          const dep=Object.values(payload.dependencies).find(item=>normalized(item.address)===normalized(params[0]));
          if(dep)return dep.code;
          const found=Array.from(deployed.entries()).find(([,item])=>normalized(item.address)===normalized(params[0]));
          return found?payload.contracts[found[0]].deployedBytecode:'0x';
        }
        if(method==='eth_call'){
          const dep=Object.entries(payload.dependencies).find(([,item])=>normalized(item.address)===normalized(params[0].to));
          const contract=dep?.[0]||Array.from(deployed.entries()).find(([,item])=>normalized(item.address)===normalized(params[0].to))?.[0];
          if(!contract)throw Error('Unmodeled synthetic contract address '+params[0].to);
          const iface=interfaces[contract],parsed=iface.parseTransaction({data:params[0].data});
          return iface.encodeFunctionResult(parsed.name,values(contract,parsed.name,parsed.args));
        }
        if(method==='eth_sendTransaction'){
          if(state.sendMode==='reject'){const error=new Error('Synthetic wallet: holder rejected');error.code=4001;throw error;}
          if(state.sendMode==='unknown'){const error=new Error('Synthetic unknown submission outcome');error.code=-32000;throw error;}
          state.sendCount++;
          const hash=E.id('18911 synthetic pending transaction '+state.sendCount),tx=JSON.parse(JSON.stringify(params[0]));
          transactions.set(hash,{...tx,input:tx.data,to:tx.to??null,value:tx.value??'0x0',hash,nonce:hex(state.sendCount-1),chainId:'0x38'});
          persistLedger();
          if(state.sendMode==='broadcast-unknown'){const error=new Error('Synthetic creation broadcast, wallet response lost before hash');error.code=-32000;throw error;}
          // Unmined by default. Only an explicit QA command creates a clearly
          // synthetic receipt, which the unchanged product verifier checks.
          return hash;
        }
        if(method==='eth_getTransactionReceipt')return receipts.get(params[0])||null;
        if(method==='eth_getTransactionByHash')return transactions.get(params[0])||null;
        throw Error('Unmodeled EIP1193 method; network fallback forbidden: '+method);
      },
    };
    if(guest){delete window.ethereum;delete window.BinanceChain;}else window.ethereum=provider;
    window.__18911RpcQA={request:({method,params})=>provider.request({method,params,qaLane:'public'}),count:method=>counters.get(method)||0};
    window.__18911WalletQA={
      disconnect(){state.authorized=false;sessionStorage.removeItem('18911.qa.authorized');for(const listener of listeners.get('disconnect')||[])listener({code:4900,message:'Synthetic disconnect'});},
      changeAccount(next){state.account=next;for(const listener of listeners.get('accountsChanged')||[])listener([next]);},
      setVisibility(value){
        if(!['visible','hidden'].includes(value))throw Error('Unknown synthetic visibility');
        qaVisibility=value;Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>qaVisibility});
        document.dispatchEvent(new Event('visibilitychange'));
      },
      removeInjectedWallet(){delete window.ethereum;delete window.BinanceChain;},
      restoreInjectedWallet(){window.ethereum=provider;},
      setSendMode(value){if(!['pending','reject','unknown','broadcast-unknown'].includes(value))throw Error('Unsupported synthetic send mode');state.sendMode=value;},
      lastBroadcastHash(){return Array.from(transactions.keys()).at(-1)||null;},
      gateRead(id){
        if(readGates.has(id))throw Error('Synthetic read gate must be unique');
        readGates.set(id,{method:'eth_getBlockByNumber',waiting:false,settled:false});
      },
      gateWalletSend(id){if(readGates.has(id))throw Error('Synthetic send gate must be unique');readGates.set(id,{method:'eth_sendTransaction',waiting:false,settled:false});},
      failReads(count){readFailure={remaining:count,method:'eth_getBlockByNumber'};},
      overrideDependencyCode(name,code){codeOverrides.set(normalized(payload.dependencies[name].address),code);},
      mineDeployment(hash,reverted=false){
        const tx=transactions.get(hash);if(!tx||tx.to!==null)throw Error('Synthetic mining requires an existing reviewed creation transaction');
        const E=window.ethers.utils,match=Object.entries(payload.contracts).find(([,item])=>tx.input.toLowerCase().startsWith(item.bytecode.toLowerCase()));
        if(!match)throw Error('Synthetic receipt must match one original artifact');
        const [name,artifact]=match,c=E.defaultAbiCoder.decode(interfaces[name].deploy.inputs,'0x'+tx.input.slice(artifact.bytecode.length));
        const address=E.getContractAddress({from:tx.from,nonce:Number(BigInt(tx.nonce))});
        if(!blocks.size)throw Error('Synthetic mining requires the original submission chain to exist');
        const number=Math.max(...blocks.keys())+1,b=block(number);
        Object.assign(tx,{blockNumber:b.number,blockHash:b.hash});
        if(!reverted){
          if(name==='KUFO')deployed.set(name,{address,config:{version:c[2][0],activationTime:c[2][1].toString(),utcOffsetSeconds:Number(c[2][2]),constellationByMonth:Array.from(c[2][3],Number)}});
          else deployed.set(name,{address});
        }
        receipts.set(hash,{transactionHash:hash,status:reverted?'0x0':'0x1',blockNumber:b.number,blockHash:b.hash,from:tx.from,to:null,contractAddress:reverted?null:address,logs:[]});
        persistLedger();
        return {contract:name,address:reverted?null:address,blockNumber:b.number,status:reverted?'0x0':'0x1',scope:'SYNTHETIC_MINED_DEPLOYMENT_ONLY'};
      },
      setPendingOrgan(organ,remainingSeconds){
        const names={Furnace:['KAIOSAlchemyFurnace','KAIOS.ORGAN.FURNACE.18911'],Output:['KUFOOutputJindouyun168888','KAIOS.ORGAN.KUFO.OUTPUT.168888'],Converter:['KSHIPConverter','KAIOS.ORGAN.KSHIP.CONVERTER']};
        const [name,key]=names[organ]||[];if(!deployed.has(name))throw Error('Pending proposal needs the verified synthetic contract');
        proposals.set(normalized(window.ethers.utils.id(key)),[deployed.get(name).address,Math.floor(Date.now()/1000)+remainingSeconds]);
        persistLedger();
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

async function autoSettled(page){
  // Natural timers continue under clock.install; a zero-delay task lets the
  // application's scheduled immediate verification start before asserting idle.
  for(let turn=0;turn<2;turn++){
    await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,0)));
    await page.waitForFunction(()=>!document.body.classList.contains('loading')&&document.querySelector('#autoVerifyStatus')?.dataset.state!=='BUSY');
  }
}

async function automaticRead(page,row,milliseconds=31_000){
  const before=row.rpc.filter(item=>item.method==='eth_getBlockByNumber').length;
  await page.clock.fastForward(milliseconds);
  await page.waitForFunction(count=>window.__18911RpcQA.count('eth_getBlockByNumber')>count,before);
  await autoSettled(page);
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
  const authorizationsBefore=row.rpc.filter(item=>item.method==='eth_requestAccounts').length;
  await page.evaluate(()=>{
    window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));
    window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
  });
  await autoSettled(page);await phase(page,['IDLE','CONNECTED','PUBLIC_VERIFIED','PENDING']);
  assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,authorizationsBefore,'persisted automatic reads never request wallet authorization');
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),savedPending,'restoration preserves the exact saved financial intent');
  assert.ok(await page.locator('#connectWallet').isEnabled(),'new client is usable while the old provider promise is unresolved');
  if(savedPending){await connect(page);await autoSettled(page);await phase(page,'PENDING');}
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
    actualBFCache:'NOT_TESTED',automaticRestoreReadRequests:row.rpc.length-rpcBeforeRestore,
    newClientUsableBeforeOldSettlement:true,newBusyProtected:true,oldLateUiUnchanged:true,savedPendingPreserved:true,transactionRequestsAdded:row.sendRequests.length-sendsBefore});
  await capture(page,row,`synthetic-late-${releaseMode}-${savedPending?'pending':'review'}`);
}

async function runScenario(browser,profile,name,options,fn){
  const row={profile:profile.name,name,width:profile.width,height:profile.height,functional:'RUNNING',screenshots:[],touchTargets:[],blockedRequests:[],runtimeErrors:[],consoleErrors:[],publicHttpStatus:options.httpStatus||null};
  profile.scenarios.push(row);
  const {context,page}=await isolatedContext(browser,row);
  targetRecords.set(page,row.touchTargets);
  try{
    if(options.clock){assert.ok(page.clock?.install,'existing CI Playwright supports the official Clock API');await page.clock.install({time:new Date('2026-11-15T04:00:00Z')});row.clock='PLAYWRIGHT_INSTALL_FAST_FORWARD';}
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
    await page.waitForFunction(()=>document.querySelector('#autoVerifyStatus')?.dataset.state==='STOPPED'||document.querySelector('#autoVerifyStatus')?.textContent.includes('上次'));
    await autoSettled(page);
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
    assert.ok(row.publicRpc?.length>0,'guest automatically checks the exact synthetic public read endpoint');
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts'||item.method==='eth_sendTransaction').length,0,'guest reads never authorize or send');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('a.skip').evaluate(el=>document.activeElement===el),true,'keyboard users can focus the first skip link');
    row.keyboardSkip=await touchTarget(page,'a.skip');
    await page.locator('#connectWallet').focus();
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts'||item.method==='eth_sendTransaction').length,0,'keyboard focus never authorizes or sends, while public automatic reads remain allowed');
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
    await ownerReview(page,row);await accept(page);await page.locator('#confirmReview').click();await phase(page,['SUBMITTED','PENDING']);await autoSettled(page);
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
    assert.ok(row.rpc.filter(item=>item.method==='eth_getTransactionReceipt').length>0,'submitted hash is automatically checked without resending');
    await capture(page,row,'submitted');
    const receiptReadsBefore=row.rpc.filter(item=>item.method==='eth_getTransactionReceipt').length;
    await touchTarget(page,'#resumePending');await page.locator('#resumePending').click();await phase(page,'PENDING');await autoSettled(page);
    assert.equal(row.sendRequests.length,1,'resume only reads the saved receipt');
    assert.ok(row.rpc.filter(item=>item.method==='eth_getTransactionReceipt').length>receiptReadsBefore);
    const authorizationBeforeReload=row.rpc.filter(item=>item.method==='eth_requestAccounts').length;
    const receiptReadsBeforeReload=row.rpc.filter(item=>item.method==='eth_getTransactionReceipt').length;
    await page.reload({waitUntil:'load'});
    await page.waitForFunction(()=>document.querySelector('#appStatus')?.dataset.state!=='LOADING');
    assert.equal((await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),PENDING_KEY)).hash,pending.hash);
    assert.ok(await page.locator('#pendingPanel').isVisible(),'saved pending intent survives a real page reload');
    assert.equal(row.sendRequests.length,1,'reload never resubmits');
    await autoSettled(page);await phase(page,'PENDING');
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,authorizationBeforeReload,'reload passively discovers the previously authorized original account without another wallet prompt');
    assert.ok(row.rpc.filter(item=>item.method==='eth_getTransactionReceipt').length>receiptReadsBeforeReload,'reload automatically reads the original pending hash');
    await connect(page);await autoSettled(page);await phase(page,'PENDING');
    await page.locator('#resumePending').click();await phase(page,'PENDING');await autoSettled(page);
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
    const authorizationBefore=row.rpc.filter(item=>item.method==='eth_requestAccounts').length;
    // Explicit synthetic lifecycle smoke: these untrusted DOM events exercise
    // the production persisted handler. They do not prove real BFCache entry
    // or restoration by any physical phone/browser.
    await page.evaluate(()=>{
      window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));
      window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
    });
    await autoSettled(page);await phase(page,'PUBLIC_VERIFIED');
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,authorizationBefore,'persisted public verification never requests wallet authorization');
    assert.equal(row.sendRequests.length,0,'persisted lifecycle handler never requests a transaction');
    assert.equal(await page.locator('#reviewPanel').isVisible(),false);
    assert.equal(await page.locator('#acceptReview').isChecked(),false,'persisted restoration clears the old consent');
    assert.equal(await page.locator('#reviewCap').inputValue(),'','persisted restoration clears the old spending cap');
    assert.equal(await page.locator('#playerBalance').textContent(),'連線並查詢後顯示');
    row.lifecycle={kind:'SYNTHETIC_PERSISTED_PAGE_TRANSITION_EVENTS',actualBFCache:'NOT_TESTED',automaticReadsAllowed:true,automaticAuthorizationRequests:0,automaticTransactionRequests:row.sendRequests.length};
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
  await runAutomaticScenarios(browser,profile);
  await runP1RecoveryScenarios(browser,profile);
  profile.functional='PASS';
}

async function journalBytes(page){
  return page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>key.startsWith('kaios18911.receipts.')).sort(([a],[b])=>a.localeCompare(b))));
}

async function downloadEvidence(page,row,label){
  await touchTarget(page,'#exportEvidence');
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#exportEvidence').click()]);
  const filename=`${row.profile}-${row.name}-${label}.json`;
  await download.saveAs(`${OUT}/${filename}`);
  (row.evidenceDownloads??=[]).push(filename);
  return JSON.parse(await fs.readFile(`${OUT}/${filename}`,'utf8'));
}

async function manuallyRecover(page,hash){
  await touchTarget(page,'#receiptHash');await page.locator('#receiptHash').fill(hash);
  const label='label:has(#acceptRecoveryHash)';await touchTarget(page,label);
  if(!await page.locator('#acceptRecoveryHash').isChecked())await page.locator(label).click();
  assert.ok(await page.locator('#acceptRecoveryHash').isChecked());
  await touchTarget(page,'#recoverPendingHash');assert.ok(await page.locator('#recoverPendingHash').isEnabled());
  await page.locator('#recoverPendingHash').click();await autoSettled(page);
}

async function runP1RecoveryScenarios(browser,profile){
  await runScenario(browser,profile,'p1-hash-recovery',{clock:true},async(page,row)=>{
    await ownerReview(page,row);await accept(page);await page.locator('#confirmReview').click();await phase(page,['SUBMITTED','PENDING']);await autoSettled(page);
    const kufo=await mineReviewedPending(page,row);await automaticRead(page,row);
    assert.equal(await page.locator('#deploySteps .step-status').filter({hasText:'鏈上已核'}).count(),1);
    const originalJournal=await journalBytes(page);
    assert.equal(Object.keys(originalJournal).length,1,'first canonical synthetic deployment is already in the original product journal');
    await page.evaluate(()=>window.__18911WalletQA.setSendMode('broadcast-unknown'));
    await page.locator('#prepareDeploy').click();await phase(page,'REVIEW');await accept(page);
    await page.locator('#confirmReview').click();await phase(page,'BLOCKED');
    const pendingRaw=await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),pending=JSON.parse(pendingRaw);
    assert.equal(pending.contract,'KAIOSAlchemyFurnace');assert.equal(pending.hash,null);
    assert.ok(BigInt(pending.submissionAnchor.number)>0n,'new intent keeps its original submission block');
    assert.match(pending.submissionAnchor.hash,/^0x[0-9a-f]{64}$/i);
    assert.ok(BigInt(pending.submissionAnchor.timestamp)>0n);
    const furnaceHash=await page.evaluate(()=>window.__18911WalletQA.lastBroadcastHash());assert.notEqual(furnaceHash,kufo.hash);
    assert.equal(row.sendRequests.length,2,'only the two explicit original confirmations requested synthetic transactions');
    assert.equal(await page.locator('#activationTime').isEnabled(),false,'an unknown submission keeps immutable configuration locked');
    await capture(page,row,'unknown-locked-before-reload');
    await page.reload({waitUntil:'load'});
    await page.waitForFunction(()=>document.querySelector('#appStatus')?.dataset.state!=='LOADING');await autoSettled(page);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),pendingRaw,'real reload preserves the original unknown pending intent byte for byte');
    const anchorAfterReload=await page.evaluate(number=>window.ethereum.request({method:'eth_getBlockByNumber',params:[number,false]}),pending.submissionAnchor.number);
    assert.deepEqual({number:anchorAfterReload.number,hash:anchorAfterReload.hash,timestamp:BigInt(anchorAfterReload.timestamp).toString()},pending.submissionAnchor,'QA canonical submission header remains fixed across elapsed clock time and real reload');
    assert.deepEqual(await journalBytes(page),originalJournal,'real reload preserves the existing verified deployment journal');
    assert.equal(row.sendRequests.length,2,'reload does not resend an unknown transaction');
    assert.ok(await page.locator('#receiptHash').isVisible(),'holder can paste the hash from this original wallet request');
    assert.equal(await page.locator('#acceptRecoveryHash').isChecked(),false);
    assert.equal(await page.locator('#recoverPendingHash').isEnabled(),false,'recovery requires both the original hash and explicit holder acknowledgement');
    await connect(page);await autoSettled(page);
    await manuallyRecover(page,kufo.hash);await phase(page,'BLOCKED');
    assert.equal(await page.locator('#appStatus').getAttribute('data-error-code'),'HASH_ALREADY_ARCHIVED','the historical receipt is rejected as another archived intent, not an unrelated read failure');
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),pendingRaw,'a historical successful KUFO hash cannot replace this Furnace intent');
    assert.deepEqual(await journalBytes(page),originalJournal);assert.equal(row.sendRequests.length,2);
    await capture(page,row,'historical-hash-rejected');
    await manuallyRecover(page,furnaceHash);await phase(page,'BLOCKED');
    assert.equal(await page.locator('#appStatus').getAttribute('data-error-code'),'RECOVERY_NOT_CONFIRMED','an exact but unmined hash must remain canonically unconfirmed');
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),pendingRaw,'an unmined matching transaction does not release the canonical-evidence lock');
    assert.deepEqual(await journalBytes(page),originalJournal);assert.equal(row.sendRequests.length,2);
    const mined=await page.evaluate(hash=>window.__18911WalletQA.mineDeployment(hash),furnaceHash);
    assert.ok(BigInt(mined.blockNumber)>BigInt(pending.submissionAnchor.number),'recovery receipt is strictly after the original submission anchor');
    (row.syntheticMinedDeployments??=[]).push({...mined,hash:furnaceHash});
    await manuallyRecover(page,furnaceHash);
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('#deploySteps .step-status')).filter(el=>el.textContent==='鏈上已核').length===2);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),null,'only a fully matched canonical Furnace receipt completes the recovered original intent');
    assert.doesNotMatch(await page.locator('#autoVerifyStatus').textContent(),/尚無 hash/,'successful recovery clears only the obsolete hashless stop reason');
    assert.equal(row.sendRequests.length,2,'read-only recovery must never issue a third transaction');
    const journalAfter=await journalBytes(page),beforeRecord=JSON.parse(Object.values(originalJournal)[0]).evidence[0],afterRecords=JSON.parse(Object.values(journalAfter)[0]).evidence;
    assert.equal(afterRecords.length,2);assert.deepEqual(afterRecords[0],beforeRecord,'recovery appends without rewriting the first verified receipt');
    assert.equal(afterRecords[1].intent.hash,furnaceHash);
    assert.equal(afterRecords[1].intent.recovery.assurance,'ANCHORED_HOLDER_ATTESTED');
    assert.equal(afterRecords[1].intent.recovery.holderAttested,true);
    assert.equal(afterRecords[1].intent.recovery.uniqueRequestProven,false,'holder-attested recovery must not claim cryptographic proof of a unique wallet request');
    assert.deepEqual(afterRecords[1].intent.submissionAnchor,pending.submissionAnchor);
    const exported=await downloadEvidence(page,row,'recovered-cumulative-evidence');
    assert.equal(exported.pending,null);assert.deepEqual(exported.journal.evidence,afterRecords,'download includes both original cumulative receipt records');
    assert.equal(exported.snapshot.pending,null);
    row.p1={unknownIntentPreservedAcrossRealReload:true,submissionAnchorStableAcrossReload:true,historicalHashRejected:'HASH_ALREADY_ARCHIVED',unminedHashRejected:'RECOVERY_NOT_CONFIRMED',canonicalOriginalIntentRecovered:true,recoveryAssurance:'ANCHORED_HOLDER_ATTESTED',uniqueRequestProven:false,explicitTransactionRequests:2,recoveryTransactionRequests:0,exportedCumulativeRecords:exported.journal.evidence.length};
    await capture(page,row,'canonical-recovered-no-third-send');
  });
  await runScenario(browser,profile,'p1-first-failed-config',{clock:true},async(page,row)=>{
    await ownerReview(page,row);const oldTime=await page.locator('#activationTime').inputValue();
    await accept(page);await page.locator('#confirmReview').click();await phase(page,['SUBMITTED','PENDING']);await autoSettled(page);
    const hash=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).hash,PENDING_KEY);
    const reverted=await page.evaluate(value=>window.__18911WalletQA.mineDeployment(value,true),hash);
    (row.syntheticMinedDeployments??=[]).push({...reverted,hash});
    await automaticRead(page,row);await phase(page,'CONFIRMED_REVERTED');
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),null);
    assert.equal(await page.locator('#autoVerifyStatus').getAttribute('data-state'),'STOPPED');
    assert.equal(await page.locator('#deploySteps .step-status').filter({hasText:'鏈上已核'}).count(),0);
    const failedJournal=await journalBytes(page),failedRecords=JSON.parse(Object.values(failedJournal)[0]).evidence;
    assert.equal(failedRecords.length,1);assert.equal(failedRecords[0].intent.hash,hash);
    assert.equal(failedRecords[0].verification.status,'CONFIRMED_REVERTED');
    const failedExport=await downloadEvidence(page,row,'original-canonical-failure');
    assert.equal(failedExport.pending,null);assert.deepEqual(failedExport.journal.evidence,failedRecords,'holder can download the actual saved failed receipt');
    await capture(page,row,'canonical-failure-saved');
    await page.clock.fastForward(86_400_000);
    await touchTarget(page,'#activationNow');await page.locator('#activationNow').click();await autoSettled(page);
    const newTime=await page.locator('#activationTime').inputValue();assert.notEqual(newTime,oldTime,'only a new explicit holder action chooses another activation time');
    await touchTarget(page,'#prepareDeploy');await page.locator('#prepareDeploy').click();await phase(page,'REVIEW');
    const fields=await page.locator('#reviewDetails').evaluate(host=>Object.fromEntries(Array.from(host.querySelectorAll('dt'),term=>[term.textContent,term.nextElementSibling?.textContent])));
    assert.equal(fields['啟用 timestamp'],String(Math.floor(Date.parse(newTime+'+08:00')/1000)),'retry preview uses the newly accepted configuration');
    assert.equal(row.sendRequests.length,1,'canonical failure and configuration reset never automatically retry deployment');
    const retainedFailedRecords=JSON.parse(Object.values(await journalBytes(page))[0]).evidence;
    assert.deepEqual(retainedFailedRecords,failedRecords,'manual reconfiguration never rewrites or discards the original failed receipt history');
    const newExport=await downloadEvidence(page,row,'new-config-original-failure-retained');
    assert.deepEqual(newExport.journal.evidence,failedRecords);assert.equal(newExport.pending,null);
    assert.equal(newExport.snapshot.config.activationTime,fields['啟用 timestamp']);
    row.p1={canonicalFirstDeploymentReverted:true,originalFailurePreserved:true,manualConfigurationChanged:true,manualPreviewOnly:true,explicitTransactionRequests:1,automaticRetryRequests:0,exportedFailureRecords:newExport.journal.evidence.length};
    await capture(page,row,'manual-new-config-preview-no-send');
  });
}

async function mineReviewedPending(page,row){
  const hash=await page.evaluate(key=>JSON.parse(localStorage.getItem(key))?.hash,PENDING_KEY);
  assert.match(hash,/^0x[0-9a-f]{64}$/i,'only an explicitly submitted original intent can receive a synthetic receipt');
  const mined=await page.evaluate(value=>window.__18911WalletQA.mineDeployment(value),hash);
  (row.syntheticMinedDeployments??=[]).push({...mined,hash});
  return mined;
}

async function runAutomaticScenarios(browser,profile){
  for(const status of [403,429])await runScenario(browser,profile,`auto-public-http${status}`,{guest:true,clock:true,httpStatus:status},async(page,row)=>{
    assert.equal(await page.locator('#autoVerifyStatus').getAttribute('data-state'),'STOPPED','public permission/quota failures stop on their first response');
    assert.equal(row.publicRpc.length,1,'only the first exact public HTTP request is attempted');
    await page.clock.fastForward(120_000);assert.equal(row.publicRpc.length,1,'permission/quota refusal never falls back or retries automatically');
    await touchTarget(page,'#refreshStatus');await page.locator('#refreshStatus').click();await autoSettled(page);await phase(page,'BLOCKED');
    assert.equal(row.publicRpc.length,2,'an explicit manual query permits exactly one new read after the initial refusal');
    assert.equal(await page.locator('#autoVerifyStatus').getAttribute('data-state'),'STOPPED','a repeated manual permission/quota refusal immediately stops the automatic schedule again');
    await page.clock.fastForward(120_000);assert.equal(row.publicRpc.length,2,'manual refusal must not schedule an automatic third request');
    assert.equal(await page.evaluate(()=>Boolean(window.ethereum)),false);assert.equal(row.sendRequests.length,0);
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,0);
    row.automatic={httpStatus:status,attemptsBeforeStop:1,explicitManualReads:1,totalPublicHttpRequests:2,fallbackRequests:0,automaticWalletRequests:0};
    await capture(page,row,`http${status}-stopped`);
  });
  await runScenario(browser,profile,'auto-public-visible',{guest:true,clock:true},async(page,row)=>{
    await phase(page,'PUBLIC_VERIFIED');
    assert.equal(await page.evaluate(()=>Boolean(window.ethereum)),false,'public automatic verification needs no injected wallet');
    assert.equal(await page.locator('#walletAccount').textContent(),'尚未連接');
    assert.equal((await page.locator('#ownerAddress').textContent()).toLowerCase(),OWNER.toLowerCase());
    assert.match(await page.locator('#autoVerifyStatus').textContent(),/自動唯讀查核.*上次/);
    const firstRead=row.rpc.find(item=>item.method==='eth_getBlockByNumber').at;
    await automaticRead(page,row);
    const latestRead=row.rpc.filter(item=>item.method==='eth_getBlockByNumber').at(-1).at;
    assert.ok(latestRead-firstRead>=30_000,'visible automatic reads follow the thirty-second schedule');
    await page.evaluate(()=>window.__18911WalletQA.setVisibility('hidden'));
    assert.equal(await page.locator('#autoVerifyStatus').getAttribute('data-state'),'HIDDEN');
    const hiddenReads=row.rpc.length;
    await page.clock.fastForward(90_000);assert.equal(row.rpc.length,hiddenReads,'synthetic hidden page does not poll');
    await page.evaluate(()=>window.__18911WalletQA.setVisibility('visible'));
    await autoSettled(page);await phase(page,'PUBLIC_VERIFIED');
    assert.ok(row.rpc.length>hiddenReads,'returning visible verifies immediately without a wallet prompt');
    assert.equal(row.rpc.filter(item=>['eth_requestAccounts','eth_estimateGas','eth_sendTransaction'].includes(item.method)).length,0);
    row.automatic={publicNoWallet:true,visibility:'SYNTHETIC_DOCUMENT_VISIBILITY_EVENT',physicalBackground:'NOT_TESTED',intervalMilliseconds:30_000};
    await capture(page,row,'visible-resumed');
  });
  await runScenario(browser,profile,'auto-two-failure-stop',{guest:true,clock:true},async(page,row)=>{
    await page.evaluate(()=>window.__18911WalletQA.failReads(2));
    await automaticRead(page,row);
    assert.notEqual(await page.locator('#autoVerifyStatus').getAttribute('data-state'),'STOPPED','first ordinary transport failure leaves one remaining attempt');
    await automaticRead(page,row);
    assert.equal(await page.locator('#autoVerifyStatus').getAttribute('data-state'),'STOPPED');
    assert.match(await page.locator('#autoVerifyStatus').textContent(),/兩次/);
    const stoppedReads=row.rpc.length;
    await page.clock.fastForward(120_000);assert.equal(row.rpc.length,stoppedReads,'two technical failures stop further automatic reads');
    await page.evaluate(()=>window.__18911WalletQA.setVisibility('hidden'));
    await page.evaluate(()=>window.__18911WalletQA.setVisibility('visible'));
    await autoSettled(page);assert.equal(row.rpc.length,stoppedReads,'visibility return does not reset the failed-attempt counter');
    await capture(page,row,'technical-stopped');
    await touchTarget(page,'#refreshStatus');await page.locator('#refreshStatus').click();await phase(page,'PUBLIC_VERIFIED');
    await automaticRead(page,row);assert.notEqual(await page.locator('#autoVerifyStatus').getAttribute('data-state'),'STOPPED','manual query explicitly reopens automatic reads');
    await page.evaluate(()=>window.__18911WalletQA.overrideDependencyCode('kgen','0x00'));
    await automaticRead(page,row);assert.equal(await page.locator('#autoVerifyStatus').getAttribute('data-state'),'STOPPED','a dependency identity mismatch stops on its first occurrence');
    const policyReads=row.rpc.length;await page.clock.fastForward(90_000);assert.equal(row.rpc.length,policyReads);
    assert.equal(row.sendRequests.length,0);assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,0);
    row.automatic={technicalAttemptsBeforeStop:2,policyAttemptsBeforeStop:1,visibilityDoesNotReset:true,manualQueryResets:true};
    await capture(page,row,'identity-stopped');
  });
  await runScenario(browser,profile,'auto-review-wallet-pending',{clock:true},async(page,row)=>{
    await ownerReview(page,row);
    const reviewedReads=row.rpc.length;
    await page.clock.fastForward(90_000);assert.equal(row.rpc.length,reviewedReads,'automatic timer never consumes or replaces an existing review');
    assert.equal(await page.locator('#appStatus').getAttribute('data-state'),'REVIEW');
    assert.equal(await page.locator('#autoVerifyStatus').getAttribute('data-state'),'REVIEW');
    assert.ok(await page.locator('#reviewPanel').isVisible());assert.equal(row.sendRequests.length,0);
    await capture(page,row,'review-paused');
    await ownerReview(page,row);await accept(page);
    await page.evaluate(()=>window.__18911WalletQA.gateWalletSend('auto-wallet-prompt'));
    await page.locator('#confirmReview').click();
    await page.waitForFunction(()=>window.__18911WalletQA.gateState('auto-wallet-prompt')?.waiting);
    const walletBusyReads=row.rpc.length;
    await page.clock.fastForward(90_000);assert.equal(row.rpc.length,walletBusyReads,'automatic reads never compete with an outstanding wallet action');
    assert.equal(await page.locator('#autoVerifyStatus').getAttribute('data-state'),'BUSY');
    assert.equal(row.sendRequests.length,1,'only the explicit confirm opened the synthetic wallet request');
    await capture(page,row,'wallet-busy');
    await page.evaluate(()=>window.__18911WalletQA.releaseRead('auto-wallet-prompt','resolve'));
    await phase(page,['SUBMITTED','PENDING']);await autoSettled(page);
    const pendingRaw=await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),pending=JSON.parse(pendingRaw);
    assert.match(pending.hash,/^0x[0-9a-f]{64}$/i);
    const originalReceiptReads=row.rpc.filter(item=>item.method==='eth_getTransactionReceipt').length;
    await page.evaluate(other=>window.__18911WalletQA.changeAccount(other),OTHER);
    await page.clock.fastForward(31_000);await autoSettled(page);
    assert.equal(await page.locator('#autoVerifyStatus').getAttribute('data-state'),'STOPPED');
    assert.equal(row.rpc.filter(item=>item.method==='eth_getTransactionReceipt').length,originalReceiptReads,'another account cannot automatically resume the original financial hash');
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),pendingRaw);
    await capture(page,row,'original-account-required');
    await page.evaluate(()=>{
      window.__18911WalletQA.removeInjectedWallet();
      window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));
      window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
    });
    await touchTarget(page,'#refreshStatus');await page.locator('#refreshStatus').click();await autoSettled(page);
    assert.equal(await page.evaluate(()=>Boolean(window.ethereum)),false);
    assert.equal(await page.locator('#autoVerifyStatus').getAttribute('data-state'),'STOPPED');
    assert.equal(row.rpc.filter(item=>item.method==='eth_getTransactionReceipt').length,originalReceiptReads,'a public guest must not verify another account\'s financial receipt');
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),pendingRaw);
    await capture(page,row,'guest-pending-stopped');
    await page.evaluate(owner=>{window.__18911WalletQA.restoreInjectedWallet();window.__18911WalletQA.changeAccount(owner);},OWNER);
    await connect(page);await autoSettled(page);await phase(page,'PENDING');
    assert.equal(row.sendRequests.length,1,'explicit original-account reconnection only reads the saved hash');
    const mined=await mineReviewedPending(page,row);
    await automaticRead(page,row);
    await page.waitForFunction(address=>document.querySelector('#deploySteps .step-address')?.textContent.toLowerCase()===address.toLowerCase(),mined.address);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),null,'complete automatic receipt verification clears only the original verified pending intent');
    assert.equal(await page.locator('#deploySteps .step-status').filter({hasText:'鏈上已核'}).count(),1);
    assert.equal(row.sendRequests.length,1,'a verified synthetic deployment never auto-submits its successor');
    row.automatic={reviewPaused:true,walletBusyPaused:true,foreignAndGuestPendingStopped:true,originalAccountRequired:true,verifiedSyntheticDeploymentCount:1,automaticSendRequests:0};
    await capture(page,row,'receipt-verified-no-successor-send');
  });
  await runScenario(browser,profile,'auto-timelock',{clock:true},async(page,row)=>{
    await connect(page);await page.locator('#activationNow').click();
    const names=['KUFO','KAIOSAlchemyFurnace','KUFOOutputJindouyun168888','KSHIP','KSHIPConverter'];
    for(let index=0;index<names.length;index++){
      await touchTarget(page,'#prepareDeploy');await page.locator('#prepareDeploy').click();await phase(page,'REVIEW');
      await accept(page);await page.locator('#confirmReview').click();await phase(page,['SUBMITTED','PENDING']);await autoSettled(page);
      const mined=await mineReviewedPending(page,row);assert.equal(mined.contract,names[index]);
      await automaticRead(page,row);
      await page.waitForFunction(count=>Array.from(document.querySelectorAll('#deploySteps .step-status')).filter(el=>el.textContent==='鏈上已核').length===count,index+1);
      assert.equal(row.sendRequests.length,index+1,'each synthetic creation requires a separate explicit holder confirmation');
    }
    await page.evaluate(()=>window.__18911WalletQA.setPendingOrgan('Furnace',45));
    await page.locator('#refreshStatus').click();await autoSettled(page);
    const execute='.prepare-organ[data-action="execute"][data-organ="Furnace"]';
    assert.equal(await page.locator(execute).isEnabled(),false,'previously proposed synthetic organ is not mature yet');
    await automaticRead(page,row);assert.equal(await page.locator(execute).isEnabled(),false,'first thirty-second refresh remains before executableAt');
    await automaticRead(page,row);assert.ok(await page.locator(execute).isEnabled(),'visible automatic refresh exposes a matured proposal for manual review');
    await touchTarget(page,execute);
    assert.equal(row.sendRequests.length,5,'maturity refresh never proposes or executes governance');
    row.automatic={timelock:'PREVIOUS_SYNTHETIC_PROPOSAL_45_SECONDS_REMAINING',verifiedSyntheticDeployments:5,maturedButtonEnabled:true,automaticGovernanceRequests:0};
    await capture(page,row,'mature-manual-review-only');
  });
  await runScenario(browser,profile,'auto-no-hash-stop',{clock:true,sendMode:'unknown'},async(page,row)=>{
    await ownerReview(page,row);await accept(page);await page.locator('#confirmReview').click();await phase(page,'BLOCKED');
    const saved=await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY);
    assert.equal(JSON.parse(saved).hash,null);assert.equal(row.sendRequests.length,1);
    const reads=row.rpc.length;
    await page.clock.fastForward(31_000);await autoSettled(page);
    assert.equal(await page.locator('#autoVerifyStatus').getAttribute('data-state'),'STOPPED');
    assert.match(await page.locator('#autoVerifyStatus').textContent(),/尚無 hash/);
    assert.equal(row.rpc.length,reads,'hashless unknown submission stops before any automatic RPC');
    await page.clock.fastForward(90_000);assert.equal(row.rpc.length,reads);assert.equal(row.sendRequests.length,1);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),saved);
    row.automatic={unknownSubmissionPreserved:true,automaticRetries:0,automaticSendRequests:0};
    await capture(page,row,'unknown-preserved-stopped');
  });
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
  report.checks.push('Actual 18911 HTML, panel, client, shared wallet selector and ethers5. Original unmined scenarios stay pending; new explicit QA-mined creation receipts exercise the unchanged complete verifier. No real RPC, wallet, mined deployment or transaction.');
  report.checks.push('Guest, wrong chain, non-owner, owner preview/cancel, wallet rejection, durable pending/resume/reload, disconnect and account switch at both viewports.');
  report.checks.push('Constructor preview shows actual Registry/KAIOS/version/timestamp/UTC+8/month IDs. Synthetic persisted pagehide/pageshow handler smoke only; actual BFCache and physical phone restoration remain NOT_TESTED.');
  report.checks.push('Keyboard skip link is reachable when focused and clipped when unfocused; each state includes an actual viewport shot and full-page shot, with bounding-rectangle evidence.');
  report.checks.push('Unresolved synthetic refresh survives persisted lifecycle reconstruction; old late resolve/reject cannot override a new in-flight operation or alter an existing financial pending intent.');
  report.checks.push('Official Playwright Clock drives visible-only thirty-second reads; synthetic visibility, review/wallet busy, passive original-account reload, same-account pending guards, two technical failures and first HTTP403/429 or identity refusal stop. No automatic financial request.');
  report.checks.push('P1 real UI recovery keeps an unknown Furnace intent and original KUFO journal across reload; rejects archived and unmined hashes with exact codes; only a canonical later receipt plus holder acknowledgement recovers it without another send. Recovery is anchored holder attestation, not proof of a unique wallet request.');
  report.checks.push('P1 first canonical status0 creation remains in cumulative downloaded evidence; an explicit later activation change permits only a fresh preview, with no retry transaction and no history rewrite.');
  report.functional='PASS';
}catch(error){report.functional='FAIL';report.errors.push(String(error.stack||error));process.exitCode=1;}
finally{
  await browser?.close();
  report.syntheticTransactionRequests=report.profiles.flatMap(profile=>profile.scenarios).reduce((sum,row)=>sum+(row.sendRequests?.length||0),0);
  const mined=report.profiles.flatMap(profile=>profile.scenarios).flatMap(row=>row.syntheticMinedDeployments||[]);
  report.syntheticMinedCreationReceipts=mined.length;
  report.syntheticMinedDeployments=mined.filter(item=>item.status!=='0x0').length;
  report.syntheticConfirmedReverts=mined.filter(item=>item.status==='0x0').length;
  await fs.writeFile(`${OUT}/report.json`,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({head:report.head,functional:report.functional,visual:report.visual,profiles:report.profiles.length,syntheticTransactionRequests:report.syntheticTransactionRequests,report:`${OUT}/report.json`}));
}
