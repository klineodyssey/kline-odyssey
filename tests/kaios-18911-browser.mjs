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
const WALLET_SDK_URL='https://unpkg.com/@walletconnect/ethereum-provider@2.12.2/dist/index.umd.js';
const WALLET_SDK_SRI='sha384-Fuh8lPTDFjBwwB4D6KOigvxCgDcPV9rAbE7m0OcFJ5IISKrEqq76h7EANVG5Vy6S';
const WALLET_HINT_KEY='kaios18911.walletconnect.hint.v1';
const PUBLIC_READS=new Set(['eth_chainId','eth_accounts','eth_getBlockByNumber','eth_getBlockByHash','eth_getCode','eth_call','eth_getBalance','eth_getTransactionReceipt','eth_getTransactionByHash']);
const report={
  head:process.env.KAIOS_SOURCE_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  trackedDirty:!!execFileSync('git',['status','--porcelain','--untracked-files=no'],{encoding:'utf8'}).trim(),
  mode:'CI_SYNTHETIC_PROVIDER_ONLY',functional:'RUNNING',visual:'SCREENSHOTS_REQUIRE_DIRECT_REVIEW',
  realWallet:'NOT_TESTED',chainReads:0,realTransactions:0,profiles:[],runtimeErrors:[],errors:[],checks:[],
};
await fs.mkdir(OUT,{recursive:true});
const targetRecords=new WeakMap();
let walletSdkSource;
async function pinnedWalletSdk(){
  walletSdkSource ||= (async()=>{
    // One public, immutable script read. The browser never contacts a relay or
    // a wallet; only this exact GET is fulfilled with its independently hashed bytes.
    const response=await fetch(WALLET_SDK_URL,{redirect:'error',signal:AbortSignal.timeout(20_000)});
    assert.ok(response.ok,'the original pinned WalletConnect browser SDK is readable');
    const bytes=Buffer.from(await response.arrayBuffer());assert.ok(bytes.length>0&&bytes.length<8_000_000);
    const integrity='sha384-'+createHash('sha384').update(bytes).digest('base64');
    assert.equal(integrity,WALLET_SDK_SRI,'actual pinned SDK bytes match production SRI');
    report.sdkLoader={url:WALLET_SDK_URL,integrity,bytes:bytes.length,scope:'ACTUAL_PINNED_SCRIPT_ONLY_NO_RELAY_NO_REAL_WALLET'};
    return bytes;
  })();
  return walletSdkSource;
}

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

async function originalConnectionInView(page,row,label){
  // The product must restore this status to the viewport after hiding the chooser.
  // Do not scroll here: that would conceal a failed return-to-status transition.
  await page.waitForFunction(()=>{
    const el=document.querySelector('#originalPageConnection'),r=el?.getBoundingClientRect();
    return r&&r.width>0&&r.height>0&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&/此頁已透過 WalletConnect 連線/.test(el.textContent);
  });
  const rect=await geometry(page,'#originalPageConnection');
  assert.ok(rect.visible&&rect.inView&&rect.hit,'the product brings the original-page WalletConnect status fully into the viewport');
  (row.originalPageConnectionViewport??=[]).push({label,...rect});
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
    if(profile.allowPinnedSdk&&request.method()==='GET'&&url.href===WALLET_SDK_URL&&request.resourceType()==='script'){
      const bytes=await pinnedWalletSdk();(profile.sdkScriptReads??=[]).push({url:url.href,integrity:WALLET_SDK_SRI});
      await route.fulfill({status:200,contentType:'application/javascript',headers:{'access-control-allow-origin':'*'},body:bytes});return;
    }
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

async function installSyntheticWallet(context,page,row,{account=OWNER,chainId=56,switchMode='success',sendMode='pending',guest=false,walletBridge=false,lateInjection=false,activeAlchemy=false}={}){
  row.rpc=[];row.sendRequests=[];
  await page.exposeFunction('__record18911SyntheticRpc',event=>{
    row.rpc.push(event);
    if(event.method==='eth_sendTransaction')row.sendRequests.push(event);
  });
  await context.addInitScript(({payload,account,chainId,switchMode,sendMode,guest,walletBridge,lateInjection,activeAlchemy})=>{
    // The only application flag is a display-only notice. Authorization still
    // goes through the real client, real shared selector and real payload.
    window.__K18911_MOCK__=true;
    const qaLedgerKey='18911.qa.synthetic-chain.v1';
    const storedLedger=JSON.parse(sessionStorage.getItem(qaLedgerKey)||'null');
    if(storedLedger&&storedLedger.programCommit!==payload.programCommit)throw Error('Synthetic ledger belongs to another artifact set');
    const state={account,chainId,switchMode,sendMode,authorized:sessionStorage.getItem('18911.qa.authorized')==='true',sendCount:storedLedger?.sendCount||0};
    const listeners=new Map(),readGates=new Map(),zero='0x'+'0'.repeat(40);
    const reloadWalletGate=sessionStorage.getItem('18911.qa.wallet-read-gate');
    if(reloadWalletGate){readGates.set(reloadWalletGate,{method:'eth_getBlockByNumber',lane:'wallet',waiting:false,settled:false});sessionStorage.removeItem('18911.qa.wallet-read-gate');}
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
      if(activeAlchemy&&!deployed.size){
        // Only the two player-confirmation scenarios start with a synthetic
        // active chain. The real client still verifies every payload runtime,
        // immutable getter and route; no product journal or pending is seeded.
        for(const [nonce,name]of ['KUFO','KAIOSAlchemyFurnace','KUFOOutputJindouyun168888','KSHIP','KSHIPConverter'].entries()){
          const item={address:E.getContractAddress({from:payload.expectedOwner,nonce})};
          if(name==='KUFO')item.config={...payload.calendar,activationTime:String(Math.floor(Date.now()/1000)-86400)};
          deployed.set(name,item);
        }
        persistLedger();
      }
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
        if(method==='organ'){
          const route=activeAlchemy&&[['KAIOS.ORGAN.FURNACE.18911','KAIOSAlchemyFurnace'],['KAIOS.ORGAN.KUFO.OUTPUT.168888','KUFOOutputJindouyun168888'],['KAIOS.ORGAN.KSHIP.CONVERTER','KSHIPConverter']].find(([key])=>normalized(E.id(key))===normalized(args[0]));
          return [route?deployed.get(route[1]).address:zero];
        }
        if(method==='pendingOrgans')return proposals.get(normalized(args[0]))||[zero,0];
      }
      if(name==='kaios'){
        if(method==='KGEN')return [payload.dependencies.kgen.address];
        if(method==='ORGAN_REGISTRY')return [payload.dependencies.registry.address];
        if(method==='balanceOf')return [E.parseEther('100')];
        if(method==='allowance')return [activeAlchemy&&normalized(args[0])===normalized(state.account)&&normalized(args[1])===normalized(deployed.get('KAIOSAlchemyFurnace')?.address)?E.parseEther('100'):0];
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
        if(method==='balanceOf'||method==='totalSupply'||method==='totalMintedFromAlchemy')return [0];
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
        if(method==='wallet_switchEthereumChain')event.requestedChain=params[0]?.chainId;
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
        const gate=Array.from(readGates.values()).find(item=>item.method===method&&(!item.lane||item.lane===qaLane)&&!item.waiting&&!item.settled);
        if(gate){
          gate.waiting=true;
          try{await new Promise((resolve,reject)=>{gate.resolve=resolve;gate.reject=reject;});}
          finally{gate.settled=true;}
        }
        if(method==='eth_chainId')return hex(qaLane==='public'?56:state.chainId);
        if(method==='wallet_switchEthereumChain'){
          if(qaLane==='public')throw Error('Public read-only provider cannot switch a wallet');
          if(params.length!==1||params[0]?.chainId!=='0x38')throw Error('Synthetic wallet accepts only the reviewed BSC56 switch');
          const faults={reject:[4001,'Synthetic holder rejected BSC switch'],'unknown-chain':[4902,'Synthetic wallet has no BSC network'],unsupported:[4200,'Synthetic wallet does not support chain switching']};
          if(faults[state.switchMode]){const [code,message]=faults[state.switchMode];throw Object.assign(new Error(message),{code});}
          if(state.switchMode==='wrong-chain')return null;
          state.chainId=56;
          // Emit before this request resolves, as wallets can synchronously
          // invalidate the client while the explicit switch is still pending.
          for(const listener of listeners.get('chainChanged')||[])listener('0x38');
          return null;
        }
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
    if(guest||lateInjection){delete window.ethereum;delete window.BinanceChain;}else window.ethereum=provider;
    if(walletBridge){
      // Pairing is always synthetic. One dedicated scenario first evaluates
      // the actual pinned SDK; no relay or real wallet is contacted.
      const sdkSessionKey='18911.qa.walletconnect.session',initModeKey='18911.qa.sdk-init-mode',bridge={mode:'success',initializations:[],enableCalls:0,closeCalls:0,disconnectCalls:0,waiting:false,release:null,initWaiting:false,releaseInit:null,sdkGlobalValidated:false};
      const init=async options=>{
        bridge.initializations.push(JSON.parse(JSON.stringify(options)));
        if(sessionStorage.getItem(initModeKey)==='deferred'){
          bridge.initWaiting=true;await new Promise(resolve=>{bridge.releaseInit=()=>{bridge.initWaiting=false;bridge.releaseInit=null;resolve();};});
        }
        provider.session=JSON.parse(sessionStorage.getItem(sdkSessionKey)||'null');
        provider.modal={closeModal(){bridge.closeCalls++;}};
        provider.disconnect=async()=>{bridge.disconnectCalls++;provider.session=null;state.authorized=false;sessionStorage.removeItem(sdkSessionKey);};
        provider.enable=async()=>{
          bridge.enableCalls++;
          if(bridge.mode==='reject'){const error=new Error('Synthetic WalletConnect: holder rejected');error.code=4001;throw error;}
          if(bridge.mode==='deferred'){
            bridge.waiting=true;
            await new Promise(resolve=>{bridge.release=()=>{bridge.waiting=false;bridge.release=null;resolve();};});
          }
          provider.session={topic:'synthetic-18911-walletconnect-topic',expiry:Math.floor(Date.now()/1000)+3600,
            self:{publicKey:'synthetic-dapp-public-key',metadata:JSON.parse(JSON.stringify(options.metadata))},
            namespaces:{eip155:{chains:['eip155:56'],methods:['eth_chainId','eth_accounts','eth_requestAccounts','eth_sendTransaction'],events:['accountsChanged','chainChanged'],accounts:['eip155:56:'+state.account]}}};
          sessionStorage.setItem(sdkSessionKey,JSON.stringify(provider.session));
          state.authorized=true;sessionStorage.setItem('18911.qa.authorized','true');return [state.account];
        };
        return provider;
      };
      if(walletBridge==='sdk-loader'){
        // The actual, integrity-checked UMD must evaluate and expose its factory
        // before only init/pairing is replaced. No real SDK init or relay runs.
        document.addEventListener('load',event=>{
          if(!(event.target instanceof HTMLScriptElement)||event.target.src!=='https://unpkg.com/@walletconnect/ethereum-provider@2.12.2/dist/index.umd.js')return;
          const sdk=window.WalletConnectEthereumProvider||window['@walletconnect/ethereum-provider'];
          const factory=sdk?.init?sdk:sdk?.EthereumProvider?.init?sdk.EthereumProvider:sdk?.default;
          if(typeof factory?.init!=='function')throw Error('Actual pinned SDK did not expose its browser init entry');
          bridge.sdkGlobalValidated=true;bridge.sdkIntegrity=event.target.integrity;factory.init=init;
        },true);
      }else window.WalletConnectEthereumProvider={init};
      window.__18911BridgeQA={
        setMode(value){if(!['success','reject','deferred'].includes(value))throw Error('Unknown synthetic bridge mode');bridge.mode=value;},
        release(){if(!bridge.release)throw Error('No synthetic pairing is waiting');bridge.release();},
        setInitMode(value){if(!['ready','deferred'].includes(value))throw Error('Unknown synthetic init mode');value==='ready'?sessionStorage.removeItem(initModeKey):sessionStorage.setItem(initModeKey,value);},
        releaseInit(){if(!bridge.releaseInit)throw Error('No synthetic SDK init is waiting');bridge.releaseInit();},
        corruptStoredSession(fault){
          const session=JSON.parse(sessionStorage.getItem(sdkSessionKey)||'null');
          if(fault==='missing'){sessionStorage.removeItem(sdkSessionKey);return;}
          if(!session)throw Error('No synthetic SDK session to alter');
          if(fault==='expired')session.expiry=Math.floor(Date.now()/1000)-1;
          else if(fault==='foreign')session.self.metadata.url='https://unrelated.example/18911/';
          else if(fault==='wrong-chain')session.namespaces.eip155.accounts=['eip155:1:'+state.account];
          else if(fault==='account-mismatch')session.namespaces.eip155.accounts=['eip155:56:0x2222222222222222222222222222222222222222'];
          else throw Error('Unknown synthetic SDK-session fault');
          sessionStorage.setItem(sdkSessionKey,JSON.stringify(session));
        },
        storedSession(){return JSON.parse(sessionStorage.getItem(sdkSessionKey)||'null');},
        installStoredSession(session){sessionStorage.setItem(sdkSessionKey,JSON.stringify(session));},
        snapshot(){return {mode:bridge.mode,initializations:bridge.initializations,enableCalls:bridge.enableCalls,
          closeCalls:bridge.closeCalls,disconnectCalls:bridge.disconnectCalls,waiting:bridge.waiting,initWaiting:bridge.initWaiting,sdkGlobalValidated:bridge.sdkGlobalValidated,sdkIntegrity:bridge.sdkIntegrity};},
      };
    }
    const nativeNavigations=[];
    document.addEventListener('click',event=>{
      const link=event.target.closest?.('#openMetaMask,#openTrustWallet');
      if(!link||event.defaultPrevented)return;
      // Observe the browser's allowed navigation intent; never launch an app in CI.
      nativeNavigations.push({id:link.id,href:link.href});event.preventDefault();
    });
    window.__18911RpcQA={request:({method,params})=>provider.request({method,params,qaLane:'public'}),count:method=>counters.get(method)||0};
    window.__18911WalletQA={
      disconnect(){state.authorized=false;sessionStorage.removeItem('18911.qa.authorized');for(const listener of listeners.get('disconnect')||[])listener({code:4900,message:'Synthetic disconnect'});},
      changeAccount(next){state.account=next;for(const listener of listeners.get('accountsChanged')||[])listener([next]);},
      changeChain(next){state.chainId=next;for(const listener of listeners.get('chainChanged')||[])listener(hex(next));},
      setSwitchMode(value){if(!['success','reject','unknown-chain','unsupported','wrong-chain'].includes(value))throw Error('Unknown synthetic chain-switch mode');state.switchMode=value;},
      walletState(){return {chainId:state.chainId,switchMode:state.switchMode,authorized:state.authorized};},
      setVisibility(value){
        if(!['visible','hidden'].includes(value))throw Error('Unknown synthetic visibility');
        qaVisibility=value;Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>qaVisibility});
        document.dispatchEvent(new Event('visibilitychange'));
      },
      removeInjectedWallet(){delete window.ethereum;delete window.BinanceChain;},
      restoreInjectedWallet(){window.ethereum=provider;},
      announceInjectedWallet(){window.ethereum=provider;window.dispatchEvent(new Event('ethereum#initialized'));window.dispatchEvent(new CustomEvent('eip6963:announceProvider',{detail:{provider,info:{uuid:'synthetic-18911-provider',name:'Synthetic wallet'}}}));},
      nativeNavigations(){return [...nativeNavigations];},
      setSendMode(value){if(!['pending','reject','unknown','broadcast-unknown'].includes(value))throw Error('Unsupported synthetic send mode');state.sendMode=value;},
      lastBroadcastHash(){return Array.from(transactions.keys()).at(-1)||null;},
      gateRead(id){
        if(readGates.has(id))throw Error('Synthetic read gate must be unique');
        readGates.set(id,{method:'eth_getBlockByNumber',waiting:false,settled:false});
      },
      gateWalletSend(id){if(readGates.has(id))throw Error('Synthetic send gate must be unique');readGates.set(id,{method:'eth_sendTransaction',waiting:false,settled:false});},
      gateWalletAuthorization(id){if(readGates.has(id))throw Error('Synthetic authorization gate must be unique');readGates.set(id,{method:'eth_requestAccounts',waiting:false,settled:false});},
      gateWalletChain(id){if(readGates.has(id))throw Error('Synthetic chain-switch gate must be unique');readGates.set(id,{method:'wallet_switchEthereumChain',lane:'wallet',waiting:false,settled:false});},
      armReloadWalletReadGate(id){sessionStorage.setItem('18911.qa.wallet-read-gate',id);},
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
  },{payload:PAYLOAD,account,chainId,switchMode,sendMode,guest,walletBridge,lateInjection,activeAlchemy});
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
  if(row.width<600&&await page.locator('#walletBridgePanel').isVisible()){
    const chooser=await page.locator('#walletBridgePanel .button-group').evaluate(group=>{
      const parent=group.getBoundingClientRect();
      return {width:parent.width,left:parent.left,right:parent.right,controls:['connectMobileWallet','openMetaMask','openTrustWallet','cancelWalletBridge'].map(id=>{
        const el=document.getElementById(id),r=el.getBoundingClientRect();
        return {id,text:el.textContent.trim(),left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};
      })};
    });
    assert.ok(chooser.width>=240,'mobile wallet chooser retains readable content width');
    for(const [index,control]of chooser.controls.entries()){
      assert.ok(control.width>=chooser.width*.9&&control.width<=chooser.width+2,control.id+' occupies its own nearly full-width mobile row');
      assert.ok(control.left>=chooser.left-1&&control.right<=chooser.right+1,control.id+' remains inside the chooser content');
      assert.ok(control.height>=44&&control.height<=100,control.id+' has readable normal control height instead of a vertical column of text');
      if(index)assert.ok(control.top>=chooser.controls[index-1].bottom+4,control.id+' is on a distinct following row');
    }
    (row.walletChooserLayout??=[]).push({label,...chooser});
  }
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

async function accept(page,maxCostBNB='0.1'){
  await touchTarget(page,'#reviewCap');await page.locator('#reviewCap').fill(maxCostBNB);
  // The native checkbox is 22px; the actual associated label supplies the
  // full 48px touch target and is what a phone user taps.
  const label='#reviewPanel label.check';await touchTarget(page,label);await page.locator(label).click();
  assert.ok(await page.locator('#acceptReview').isChecked());
  await touchTarget(page,'#confirmReview');assert.ok(await page.locator('#confirmReview').isEnabled());
}

async function confirmationInView(page,row,label,states,errorCode){
  const expected=Array.isArray(states)?states:[states];
  // Read geometry only: the product must bring its confirmation feedback back
  // into view. A test scroll would conceal the reported "nothing happened" bug.
  await page.waitForFunction(({expected,errorCode})=>{
    const el=document.querySelector('#confirmStatus'),r=el?.getBoundingClientRect();
    return el&&expected.includes(el.dataset.state)&&(errorCode===undefined||el.dataset.errorCode===errorCode)&&el.textContent.trim()&&r.width>0&&r.height>0&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;
  },{expected,errorCode});
  const rect=await geometry(page,'#confirmStatus');
  assert.ok(rect.visible&&rect.inView&&rect.hit,'confirmation feedback is fully visible and unobstructed without a test scroll');
  const status=await page.locator('#confirmStatus').evaluate(el=>({state:el.dataset.state,errorCode:el.dataset.errorCode||'',text:el.textContent.trim()}));
  assert.ok(expected.includes(status.state));if(errorCode!==undefined)assert.equal(status.errorCode,errorCode);
  (row.confirmationFeedback??=[]).push({label,...status,...rect});
  return status;
}

async function playerBurnReview(page,row){
  assert.ok(await page.locator('#prepareAlchemy').isEnabled(),'the real client discovered the synthetic active route for this non-owner player');
  await touchTarget(page,'#kaiosAmount');await page.locator('#kaiosAmount').fill('100');
  await touchTarget(page,'#prepareAlchemy');await page.locator('#prepareAlchemy').click();await phase(page,'REVIEW');
  const fields=await page.locator('#reviewDetails').evaluate(host=>Object.fromEntries(Array.from(host.querySelectorAll('dt'),el=>[el.textContent,el.nextElementSibling.textContent])));
  assert.equal(fields['操作'],'煉丹：銷毀 KAIOS 並取得 KUFO','an existing exact allowance must preview burn, not another approval');
  assert.match(fields['KAIOS 數量'],/^100(?:\.0+)?$/);assert.match(fields['預計 KUFO'],/^100000(?:\.0+)?$/);
  assert.match(fields['KGEN 持有量門檻'],/^0\.10*$/);assert.match(fields['lifeId'],/未指定/);
  assert.equal(fields['本人帳戶'].toLowerCase(),OTHER.toLowerCase());
  assert.equal(await page.locator('#reviewCap').inputValue(),'');assert.equal(await page.locator('#acceptReview').isChecked(),false);
  assert.equal(row.sendRequests.length,0,'the approved player review still cannot send automatically');
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
  const row={profile:profile.name,name,width:profile.width,height:profile.height,functional:'RUNNING',screenshots:[],touchTargets:[],blockedRequests:[],runtimeErrors:[],consoleErrors:[],publicHttpStatus:options.httpStatus||null,allowPinnedSdk:options.sdkLoader===true};
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
    }else response=await page.goto(options.nativeReturn?ENTRY+'?walletBridge=1#playerPanel':ENTRY,{waitUntil:'load'});
    assert.ok(response?.ok(),'real 18911 HTML returns HTTP success');
    await page.waitForFunction(()=>document.querySelector('#appStatus')?.dataset.state!=='LOADING');
    if(options.nativeReturn&&!options.lateInjection&&!options.nativeMissing)await phase(page,'CONNECTED');
    else if(options.nativeReturn)await page.waitForFunction(()=>document.querySelector('#walletBridgePanel')?.hidden===false||document.querySelector('#appStatus')?.textContent.includes('錢包'));
    else await page.waitForFunction(()=>document.querySelector('#autoVerifyStatus')?.dataset.state==='STOPPED'||document.querySelector('#autoVerifyStatus')?.textContent.includes('上次'));
    if(!(options.nativeReturn&&(options.lateInjection||options.nativeMissing)))await autoSettled(page);
    assert.equal(await page.title(),'18911 煉丹爐 · KUFO');
    assert.match(await page.locator('h1').textContent(),/18911/);
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,options.nativeReturn&&!options.lateInjection&&!options.nativeMissing?1:0,
      options.nativeReturn?'one explicit native-wallet return connects once':'loading the real page never requests wallet authorization');
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
    assert.ok(await page.locator('#completeWalletUrls').isVisible(),'complete copyable URLs are visible before any wallet chooser or connection');
    row.completeUrls=[];
    for(const [input,link,copy,expected]of [
      ['#officialSiteUrl','#officialSiteLink','#copyOfficialSiteUrl',ROOT.href],
      ['#furnacePageUrl','#furnacePageLink','#copyFurnaceUrl',ENTRY],
    ]){
      assert.equal(await page.locator(input).inputValue(),expected);
      assert.equal(await page.locator(input).evaluate(el=>el.readOnly),true);
      assert.equal(await page.locator(link).evaluate(el=>el.href),expected);
      for(const control of [input,link,copy])await touchTarget(page,control);
      row.completeUrls.push({input,link,copy,url:expected,visible:true,readonly:true});
    }
    await page.evaluate(()=>{
      window.__18911ClipboardQA={reject:false,deferNext:false,waiting:false,rejectPending:null,attempts:[],writes:[]};
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{async writeText(value){
        const state=window.__18911ClipboardQA;state.attempts.push(value);
        if(state.deferNext){state.deferNext=false;state.waiting=true;await new Promise((_,reject)=>{state.rejectPending=()=>{state.waiting=false;state.rejectPending=null;reject(new DOMException('Synthetic late clipboard denial','NotAllowedError'));};});}
        if(state.reject)throw new DOMException('Synthetic clipboard denial','NotAllowedError');state.writes.push(value);
      }}});
    });
    await page.locator('#copyOfficialSiteUrl').click();
    await page.waitForFunction(()=>document.querySelector('#walletUrlStatus')?.textContent.includes('已複製'));
    await page.locator('#copyFurnaceUrl').click();
    await page.waitForFunction(()=>window.__18911ClipboardQA.writes.length===2);
    assert.deepEqual(await page.evaluate(()=>window.__18911ClipboardQA.writes),[ROOT.href,ENTRY],'copy buttons write their exact complete canonical URL');
    await page.evaluate(()=>{window.__18911ClipboardQA.deferNext=true;});await page.locator('#copyOfficialSiteUrl').click();
    await page.waitForFunction(()=>window.__18911ClipboardQA.waiting);await page.locator('#copyFurnaceUrl').click();
    await page.waitForFunction(()=>window.__18911ClipboardQA.writes.length===3);
    const latestCopyStatus=await page.locator('#walletUrlStatus').textContent();
    await page.evaluate(()=>window.__18911ClipboardQA.rejectPending());
    await page.waitForFunction(()=>!window.__18911ClipboardQA.waiting);await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,0)));
    assert.equal(await page.locator('#walletUrlStatus').textContent(),latestCopyStatus,'an older rejected copy cannot overwrite the later successful copy status');
    assert.equal(await page.locator('#copyFurnaceUrl').evaluate(el=>document.activeElement===el),true,'an older copy rejection cannot steal focus to a different URL');
    await page.evaluate(()=>{window.__18911ClipboardQA.reject=true;});await page.locator('#copyFurnaceUrl').click();
    await page.waitForFunction(()=>{const el=document.querySelector('#furnacePageUrl');return document.activeElement===el&&el.selectionStart===0&&el.selectionEnd===el.value.length;});
    assert.match(await page.locator('#walletUrlStatus').textContent(),/手動|長按/);
    assert.doesNotMatch(await page.locator('#walletUrlStatus').textContent(),/已複製/,'clipboard denial cannot claim success');
    assert.equal(await page.locator('#furnacePageUrl').inputValue(),ENTRY);
    row.urlCopy={scope:'SYNTHETIC_CLIPBOARD_API_NO_OS_CLIPBOARD',...(await page.evaluate(()=>window.__18911ClipboardQA)),denialSelectsFullReadonlyUrl:true,lateRejectionCannotReplaceNewerSuccessOrFocus:true};
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts'||item.method==='eth_sendTransaction').length,0,'copying a URL never authorizes or submits');
    await capture(page,row,'complete-url-copy-fallback');
    await touchTarget(page,'#chooseWallet');await page.locator('#chooseWallet').click();
    assert.ok(await page.locator('#walletBridgePanel').isVisible(),'ordinary mobile browser gets a usable wallet chooser');
    const links=await page.locator('#walletBridgePanel').evaluate(panel=>({
      metamask:panel.querySelector('#openMetaMask').href,trust:panel.querySelector('#openTrustWallet').href,
    }));
    const landing=new URL(page.url());landing.searchParams.set('walletBridge','1');landing.hash='playerPanel';
    const metamask=new URL(links.metamask),trust=new URL(links.trust);
    assert.equal(metamask.origin,'https://link.metamask.io');assert.equal(metamask.pathname,'/dapp/'+(landing.origin+landing.pathname).replace(/^https:\/\//,''));
    assert.equal(metamask.search,landing.search);assert.equal(metamask.hash,'#playerPanel');
    assert.equal(trust.origin,'https://link.trustwallet.com');assert.equal(trust.pathname,'/open_url');
    assert.equal(trust.searchParams.get('coin_id'),'20000714');assert.equal(trust.searchParams.get('url'),landing.href);
    for(const control of ['#openMetaMask','#openTrustWallet','#connectMobileWallet','#cancelWalletBridge'])await touchTarget(page,control);
    row.nativeWalletLinks={...links,landing:landing.href,opened:false};
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,0,'choosing a native link never authorizes in this browser');
    assert.equal(row.sendRequests.length,0);await capture(page,row,'wallet-chooser');
  });
  await runWalletBridgeScenarios(browser,profile);
  await runScenario(browser,profile,'wrong-chain',{chainId:1},async(page,row)=>{
    await phase(page,'BLOCKED');
    await touchTarget(page,'#refreshStatus');await page.locator('#refreshStatus').click();await autoSettled(page);await phase(page,'BLOCKED');
    assert.match(await page.locator('#appStatus').textContent(),/BSC|56/);
    assert.match(await page.locator('#walletChain').textContent(),/1/);
    assert.match(await page.locator('#chainState').textContent(),/先切換.*BSC|先切.*56/,'wrong wallet network is distinguished from an undeployed furnace');
    assert.equal(await page.locator('#prepareDeploy').isEnabled(),false);
    assert.equal(await page.locator('#prepareAlchemy').isEnabled(),false);
    await touchTarget(page,'#switchWalletChain');
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,0,'passive wrong-chain reads never open account permission');
    assert.equal(row.sendRequests.length,0);
    assert.equal(row.rpc.some(item=>item.method==='wallet_switchEthereumChain'||item.method==='wallet_addEthereumChain'),false,'passive verification never silently changes wallet network');
    await capture(page,row,'blocked');
  });
  await runBscConnectionScenarios(browser,profile);
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
    await confirmationInView(page,row,'rejected','REJECTED');
    await capture(page,row,'rejected');
  });
  await runScenario(browser,profile,'pending-reload',{walletBridge:true},async(page,row)=>{
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
    const beforeNativePending=await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),beforeNativeJournal=await journalBytes(page);
    const beforeNativeAuthorizations=row.rpc.filter(item=>item.method==='eth_requestAccounts').length;
    await page.locator('#chooseWallet').click();await page.locator('#openMetaMask').click();
    assert.equal(await page.evaluate(()=>window.__18911WalletQA.nativeNavigations().length),1,'a pending financial intent does not erase the independent native navigation link');
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),beforeNativePending);
    assert.deepEqual(await journalBytes(page),beforeNativeJournal,'native navigation cannot rewrite the original pending/journal bytes');
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,beforeNativeAuthorizations);
    assert.equal(await page.evaluate(()=>window.__18911BridgeQA.snapshot().initializations.length),0);
    assert.equal(row.sendRequests.length,1,'opening a native URL cannot resend the original financial intent');
    row.nativeWhilePending={navigationOnly:true,originalPendingAndJournalPreserved:true,additionalAuthorizations:0,additionalTransactions:0};
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
    const beforeChainPending=await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),beforeChainJournal=await journalBytes(page);
    const beforeChainSwitches=row.rpc.filter(item=>item.method==='wallet_switchEthereumChain').length;
    await page.evaluate(()=>window.__18911WalletQA.changeChain(1));
    await page.locator('#refreshStatus').click();await autoSettled(page);await phase(page,'BLOCKED');
    assert.equal(row.rpc.filter(item=>item.method==='wallet_switchEthereumChain').length,beforeChainSwitches,'pending receipt verification does not silently switch a wallet');
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),beforeChainPending);
    await touchTarget(page,'#switchWalletChain');await capture(page,row,'wrong-chain-retains-original-pending');
    await page.locator('#switchWalletChain').click();await phase(page,'PENDING');
    assert.equal(row.rpc.filter(item=>item.method==='wallet_switchEthereumChain').length,beforeChainSwitches+1);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),beforeChainPending,'switching back to BSC preserves the exact original transaction');
    assert.deepEqual(await journalBytes(page),beforeChainJournal);
    assert.equal(row.sendRequests.length,1,'explicit network correction cannot resubmit the original financial intent');
    row.networkWhilePending={scope:'SYNTHETIC_EXISTING_PENDING_NETWORK_CORRECTION',passiveSwitches:0,explicitSwitches:1,originalPendingAndJournalPreserved:true,additionalTransactions:0};
    await page.locator('#pendingPanel').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await capture(page,row,'bsc-correction-keeps-original-pending');
    const bridgePendingRaw=await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY);
    await touchTarget(page,'#chooseWallet');await page.locator('#chooseWallet').click();
    assert.ok(await page.locator('#walletBridgePanel').isVisible());
    const bridgeAuthGate='pending-bridge-authorization';
    await page.evaluate(id=>window.__18911WalletQA.gateWalletAuthorization(id),bridgeAuthGate);
    await touchTarget(page,'#connectMobileWallet');await page.locator('#connectMobileWallet').click();
    await page.waitForFunction(id=>window.__18911WalletQA.gateState(id)?.waiting,bridgeAuthGate);
    await touchTarget(page,'#cancelWalletBridge');await page.locator('#cancelWalletBridge').click();
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),bridgePendingRaw,'changing or cancelling a connection never clears the existing financial intent');
    await page.evaluate(id=>window.__18911WalletQA.releaseRead(id,'resolve'),bridgeAuthGate);
    await page.waitForFunction(id=>window.__18911WalletQA.gateState(id)?.settled,bridgeAuthGate);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),bridgePendingRaw,'late connection authorization cannot alter the original financial pending intent');
    assert.ok(await page.locator('#walletBridgePanel').isVisible(),'cancelled candidate cannot hide the chooser after late authorization');
    assert.equal(row.sendRequests.length,1);await capture(page,row,'bridge-cancel-keeps-pending');
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
  await runPlayerConfirmationScenarios(browser,profile);
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
  assert.equal(typeof hash,'string','manual recovery fixture must supply the concrete original transaction hash');
  assert.match(hash,/^0x[0-9a-f]{64}$/i,'manual recovery fixture hash is a complete bytes32 value');
  await touchTarget(page,'#receiptHash');await page.locator('#receiptHash').fill(hash);
  const label='label:has(#acceptRecoveryHash)';await touchTarget(page,label);
  if(!await page.locator('#acceptRecoveryHash').isChecked())await page.locator(label).click();
  assert.ok(await page.locator('#acceptRecoveryHash').isChecked());
  await touchTarget(page,'#recoverPendingHash');assert.ok(await page.locator('#recoverPendingHash').isEnabled());
  await page.locator('#recoverPendingHash').click();await autoSettled(page);
}

async function runBscConnectionScenarios(browser,profile){
  const switches=row=>row.rpc.filter(item=>item.method==='wallet_switchEthereumChain');
  const authorizations=row=>row.rpc.filter(item=>item.method==='eth_requestAccounts');
  const unchangedFinancial=async(page,row,pending,journal)=>{
    assert.equal(row.sendRequests.length,0,'network authorization never sends a financial transaction');
    assert.equal(row.rpc.filter(item=>item.method==='wallet_addEthereumChain').length,0,'unknown BSC configuration is not silently installed');
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),pending);
    assert.deepEqual(await journalBytes(page),journal,'network authorization never rewrites the financial journal');
  };
  const connectedOnBsc=async(page,row)=>{
    assert.equal(switches(row).length,1);assert.equal(switches(row)[0].requestedChain,'0x38');
    assert.equal(authorizations(row).length,1,'one explicit connect obtains account permission only after verified BSC readback');
    const switchIndex=row.rpc.findIndex(item=>item.method==='wallet_switchEthereumChain');
    const accountIndex=row.rpc.findIndex(item=>item.method==='eth_requestAccounts');
    assert.ok(switchIndex<accountIndex);
    assert.ok(row.rpc.slice(switchIndex+1,accountIndex).some(item=>item.method==='eth_chainId'&&item.lane==='wallet'),'BSC is re-read after the wallet switch and before account permission');
    assert.equal(await page.evaluate(()=>window.__18911WalletQA.walletState().chainId),56);
    assert.match(await page.locator('#walletChain').textContent(),/56/);
    assert.equal((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase());
    assert.equal(await page.locator('#reviewPanel').isVisible(),false);
    row.networkSwitch={scope:'SYNTHETIC_EXPLICIT_BSC_SWITCH_NO_REAL_WALLET',chain:'0x38',switchRequests:1,accountRequests:1,synchronousChainChanged:true,financialRequests:0};
  };
  await runScenario(browser,profile,'bsc-explicit-connect',{chainId:1},async(page,row)=>{
    const pending=await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),journal=await journalBytes(page);
    assert.equal(switches(row).length,0);assert.equal(authorizations(row).length,0);
    await touchTarget(page,'#switchWalletChain');await capture(page,row,'wrong-network-explicit-switch-control');
    await page.locator('#switchWalletChain').click();await phase(page,'CONNECTED');
    await connectedOnBsc(page,row);await unchangedFinancial(page,row,pending,journal);
    assert.equal(await page.locator('#switchWalletChain').isVisible(),false,'BSC-only correction control disappears after independently read network56');
    await page.locator('#walletChain').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await capture(page,row,'bsc56-connected-no-transaction');
  });
  for(const [mode,expected]of [
    ['reject',/取消切換網路/],['unknown-chain',/尚未加入.*BNB|加入.*BSC/],
    ['unsupported',/不支援.*切網|手動選擇.*BSC/],['wrong-chain',/尚未切換.*BSC/],
  ])await runScenario(browser,profile,'bsc-switch-'+mode,{chainId:1,switchMode:mode},async(page,row)=>{
    const pending=await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),journal=await journalBytes(page);
    await touchTarget(page,'#connectWallet');await page.locator('#connectWallet').click();await phase(page,'BLOCKED');
    assert.equal(switches(row).length,1);assert.equal(switches(row)[0].requestedChain,'0x38');
    assert.equal(authorizations(row).length,0,'rejected, unsupported or unverified network switching cannot advance to account permission');
    assert.equal(await page.evaluate(()=>window.__18911WalletQA.walletState().chainId),1);
    assert.match(await page.locator('#appStatus').textContent(),expected);
    assert.equal(await page.locator('#prepareDeploy').isEnabled(),false);assert.equal(await page.locator('#prepareAlchemy').isEnabled(),false);
    assert.equal(await page.locator('#reviewPanel').isVisible(),false);
    await unchangedFinancial(page,row,pending,journal);await touchTarget(page,'#switchWalletChain');
    row.networkSwitch={scope:'SYNTHETIC_REJECTED_OR_UNVERIFIED_NETWORK_SWITCH',mode,switchRequests:1,accountRequests:0,financialRequests:0};
    await capture(page,row,'blocked-clear-network-reason');
  });
  await runScenario(browser,profile,'bsc-native-return',{nativeReturn:true,chainId:1},async(page,row)=>{
    await connectedOnBsc(page,row);
    assert.equal(new URL(page.url()).searchParams.has('walletBridge'),false,'the single native landing intent is consumed after the explicit return flow');
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),null);assert.equal(row.sendRequests.length,0);
    await page.locator('#walletChain').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await capture(page,row,'native-bsc56-one-connect');
  });
  await runScenario(browser,profile,'bsc-mobile-bridge-connect',{guest:true,walletBridge:true,chainId:1},async(page,row)=>{
    const pending=await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),journal=await journalBytes(page);
    await touchTarget(page,'#connectWallet');await page.locator('#connectWallet').click();await phase(page,'CONNECTED');
    await connectedOnBsc(page,row);await unchangedFinancial(page,row,pending,journal);
    assert.equal(await page.evaluate(()=>window.__18911BridgeQA.snapshot().enableCalls),1,'the original WalletConnect action is not re-paired during the switch');
    await page.locator('#walletChain').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await capture(page,row,'mobile-bridge-bsc56-no-transaction');
  });
  await runScenario(browser,profile,'bsc-switch-timeout-late',{chainId:1,clock:true},async(page,row)=>{
    const pending=await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),journal=await journalBytes(page),gate='bsc-network-timeout';
    await page.evaluate(id=>window.__18911WalletQA.gateWalletChain(id),gate);
    await page.locator('#connectWallet').click();await page.waitForFunction(id=>window.__18911WalletQA.gateState(id)?.waiting,gate);
    assert.equal(switches(row).length,1);assert.equal(authorizations(row).length,0);
    await page.clock.fastForward(60_100);await phase(page,'BLOCKED');
    assert.match(await page.locator('#appStatus').textContent(),/逾時/);
    assert.equal(await page.locator('#connectWallet').isEnabled(),false,'unresolved wallet switch blocks another connect request');
    assert.equal(await page.locator('#switchWalletChain').isEnabled(),false,'unresolved network request is never duplicated');
    assert.equal(await page.locator('#refreshStatus').isEnabled(),true,'bounded switch timeout releases unrelated read-only controls');
    assert.equal(await page.locator('#autoVerifyStatus').getAttribute('data-state'),'STOPPED');
    await unchangedFinancial(page,row,pending,journal);await capture(page,row,'timeout-original-request-still-pending');
    await page.evaluate(id=>window.__18911WalletQA.releaseRead(id,'resolve'),gate);await page.waitForFunction(id=>window.__18911WalletQA.gateState(id)?.settled,gate);
    await autoSettled(page);await page.clock.fastForward(31_000);await autoSettled(page);
    assert.equal(switches(row).length,1);assert.equal(authorizations(row).length,0,'late successful chainChanged cannot resume an expired account-authorization intent');
    assert.notEqual((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase());
    assert.equal(await page.locator('#connectWallet').isEnabled(),true,'only a new explicit click may connect after the original switch settles');
    await unchangedFinancial(page,row,pending,journal);
    row.networkSwitch={scope:'SYNTHETIC_NETWORK_TIMEOUT_AND_LATE_SUCCESS',original60SecondDeadline:true,switchRequests:1,lateAccountRequests:0,financialRequests:0};
    await capture(page,row,'late-bsc-result-no-auto-authorization');
  });
  await runScenario(browser,profile,'bsc-switch-context-change',{chainId:1},async(page,row)=>{
    const pending=await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),journal=await journalBytes(page),gate='bsc-network-account-change';
    await page.evaluate(id=>window.__18911WalletQA.gateWalletChain(id),gate);
    await page.locator('#connectWallet').click();await page.waitForFunction(id=>window.__18911WalletQA.gateState(id)?.waiting,gate);
    await page.evaluate(other=>window.__18911WalletQA.changeAccount(other),OTHER);
    await page.evaluate(id=>window.__18911WalletQA.releaseRead(id,'resolve'),gate);await page.waitForFunction(id=>window.__18911WalletQA.gateState(id)?.settled,gate);await phase(page,'BLOCKED');
    assert.match(await page.locator('#appStatus').textContent(),/頁面或錢包已變更/);
    assert.equal(switches(row).length,1);assert.equal(authorizations(row).length,0,'a changed wallet account invalidates the in-flight switch continuation');
    await unchangedFinancial(page,row,pending,journal);
    row.networkSwitch={scope:'SYNTHETIC_NETWORK_CONTEXT_INVALIDATION',accountChangedBeforeSwitchResult:true,accountRequests:0,financialRequests:0};
    await touchTarget(page,'#refreshStatus');await capture(page,row,'account-change-no-continuation');
  });
  await runScenario(browser,profile,'bsc-mobile-switch-timeout-reselect',{guest:true,walletBridge:true,chainId:1,clock:true},async(page,row)=>{
    const pending=await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),journal=await journalBytes(page),gate='bsc-mobile-network-timeout';
    await page.evaluate(id=>window.__18911WalletQA.gateWalletChain(id),gate);
    await page.locator('#connectWallet').click();await page.waitForFunction(id=>window.__18911WalletQA.gateState(id)?.waiting,gate);
    const originalBridge=await page.evaluate(()=>window.__18911BridgeQA.snapshot());
    assert.equal(originalBridge.initializations.length,1);assert.equal(originalBridge.enableCalls,1);assert.equal(switches(row).length,1);
    await page.clock.fastForward(60_100);await page.waitForFunction(()=>!document.body.classList.contains('loading'));
    assert.match(await page.locator('#appStatus').textContent(),/逾時/);
    assert.equal(await page.locator('#chooseWallet').isEnabled(),false,'an unresolved raw WalletConnect switch prevents selecting a new wrapper');
    assert.equal(await page.locator('#connectMobileWallet').isEnabled(),false,'the same unresolved raw provider cannot be re-enabled');
    // Disabled controls cannot be activated by a user. Also exercise the
    // handler boundary so reselecting/re-wrapping cannot bypass its lock.
    await page.locator('#chooseWallet').dispatchEvent('click');await page.locator('#connectMobileWallet').dispatchEvent('click');
    await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,0)));
    const blockedBridge=await page.evaluate(()=>window.__18911BridgeQA.snapshot());
    assert.equal(blockedBridge.initializations.length,originalBridge.initializations.length);assert.equal(blockedBridge.enableCalls,originalBridge.enableCalls);
    assert.equal(switches(row).length,1);assert.equal(authorizations(row).length,0);
    await unchangedFinancial(page,row,pending,journal);await capture(page,row,'raw-network-request-blocks-reselection');
    await page.evaluate(id=>window.__18911WalletQA.releaseRead(id,'resolve'),gate);await page.waitForFunction(id=>window.__18911WalletQA.gateState(id)?.settled,gate);
    await autoSettled(page);await page.clock.fastForward(31_000);await autoSettled(page);
    assert.equal(authorizations(row).length,0,'a late raw-provider chain result cannot revive a timed-out WalletConnect account request');
    assert.equal(switches(row).length,1);await unchangedFinancial(page,row,pending,journal);
    row.networkSwitch={scope:'SYNTHETIC_WALLETCONNECT_RAW_PROVIDER_REWRAP_LOCK',sameRawAcrossInit:true,initializations:1,enableCalls:1,switchRequests:1,lateAccountRequests:0,financialRequests:0};
    await capture(page,row,'late-raw-result-no-automatic-connect');
  });
}

async function runWalletBridgeScenarios(browser,profile){
  await runScenario(browser,profile,'bridge-connected',{guest:true,walletBridge:true},async(page,row)=>{
    assert.equal(await page.evaluate(()=>window.__18911BridgeQA.snapshot().enableCalls),0,'opening the page does not pair a wallet');
    await touchTarget(page,'#connectWallet');await page.locator('#connectWallet').click();await phase(page,'CONNECTED');
    assert.equal((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase());
    assert.match(await page.locator('#originalPageConnection').textContent(),/此頁已透過 WalletConnect 連線/);
    assert.ok(await page.locator('#originalPageConnection').isVisible());
    assert.equal(await page.locator('#walletBridgePanel').isVisible(),false);
    const bridge=await page.evaluate(()=>window.__18911BridgeQA.snapshot());
    assert.equal(bridge.initializations.length,1);assert.equal(bridge.enableCalls,1);
    const options=bridge.initializations[0];
    assert.deepEqual(options.chains,[56]);assert.equal(options.storageOptions.database,'kaios18911-walletconnect');
    assert.equal(options.showQrModal,true);assert.ok(options.projectId,'the existing public WalletConnect project is configured');
    assert.equal(options.metadata.url,ENTRY);assert.match(options.metadata.name,/18911/);
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,1,'only the explicitly selected bridge connects the real client');
    assert.equal(row.sendRequests.length,0);assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),null);
    row.walletBridge={scope:'SYNTHETIC_WALLETCONNECT_BOUNDARY_NO_SDK_RELAY',...bridge};
    await originalConnectionInView(page,row,'connected-no-transaction');
    await capture(page,row,'connected-no-transaction');
  });
  await runScenario(browser,profile,'bridge-rejected-cancel-late',{guest:true,walletBridge:true},async(page,row)=>{
    await page.evaluate(()=>window.__18911BridgeQA.setMode('reject'));
    await touchTarget(page,'#connectWallet');await page.locator('#connectWallet').click();
    await page.waitForFunction(()=>document.querySelector('#appStatus')?.textContent.includes('取消')&&!document.querySelector('#connectMobileWallet')?.disabled);
    assert.notEqual((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase());
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,0);
    assert.equal(row.sendRequests.length,0);await capture(page,row,'pairing-rejected');

    await page.evaluate(()=>window.__18911BridgeQA.setMode('deferred'));
    await touchTarget(page,'#connectWallet');await page.locator('#connectWallet').click();
    await page.waitForFunction(()=>window.__18911BridgeQA.snapshot().waiting);
    await touchTarget(page,'#cancelWalletBridge');await page.locator('#cancelWalletBridge').click();
    assert.match(await page.locator('#appStatus').textContent(),/取消/);
    assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),WALLET_HINT_KEY),null,'cancelling an unresolved pairing clears only the nonsecret restoration hint');
    assert.equal(await page.locator('#connectMobileWallet').isEnabled(),false,'unresolved original pairing cannot open a duplicate request');
    assert.equal(await page.locator('#refreshStatus').isEnabled(),true,'a cancelled pairing never locks unrelated read-only recovery');
    assert.equal(await page.evaluate(()=>window.__18911BridgeQA.snapshot().enableCalls),2);
    assert.ok((await page.evaluate(()=>window.__18911BridgeQA.snapshot().closeCalls))>=1,'cancel closes the original pairing modal');
    assert.equal(row.sendRequests.length,0);await capture(page,row,'cancel-awaits-original');
    await page.evaluate(()=>window.__18911BridgeQA.release());
    await page.waitForFunction(()=>!window.__18911BridgeQA.snapshot().waiting&&!document.querySelector('#connectMobileWallet')?.disabled);
    assert.notEqual((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase(),'late approval after cancellation cannot attach the wallet');
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,0);
    assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),WALLET_HINT_KEY),null,'late raw approval cannot restore a cancelled hint');
    assert.equal(row.sendRequests.length,0);assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),null);
    await capture(page,row,'late-approval-ignored');

    const authGate='bridge-cancel-connect-authorization';
    await page.evaluate(()=>window.__18911BridgeQA.setMode('success'));
    await page.evaluate(id=>window.__18911WalletQA.gateWalletAuthorization(id),authGate);
    await touchTarget(page,'#connectWallet');await page.locator('#connectWallet').click();
    await page.waitForFunction(id=>window.__18911WalletQA.gateState(id)?.waiting,authGate);
    assert.equal(await page.evaluate(()=>window.__18911BridgeQA.snapshot().waiting),false,'raw pairing is complete while the real client connect is still awaiting an account');
    await touchTarget(page,'#cancelWalletBridge');await page.locator('#cancelWalletBridge').click();
    assert.equal(await page.locator('#refreshStatus').isEnabled(),true);
    assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),WALLET_HINT_KEY),null);
    assert.ok(await page.locator('#walletBridgePanel').isVisible());
    await page.evaluate(id=>window.__18911WalletQA.releaseRead(id,'resolve'),authGate);
    await page.waitForFunction(id=>window.__18911WalletQA.gateState(id)?.settled,authGate);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    assert.notEqual((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase(),'late client account authorization cannot connect after cancellation');
    assert.ok(await page.locator('#walletBridgePanel').isVisible(),'late account resolution cannot hide the cancelled chooser');
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),null);assert.equal(row.sendRequests.length,0);
    assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),WALLET_HINT_KEY),null,'late client authorization cannot recreate restoration authority');
    await capture(page,row,'late-connect-ignored');
    await touchTarget(page,'#connectWallet');await page.locator('#connectWallet').click();await phase(page,'CONNECTED');
    assert.equal((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase());
    assert.equal(await page.evaluate(()=>window.__18911BridgeQA.snapshot().enableCalls),4,'a fresh explicit click can reconnect only after the original pairing settles');
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,2);assert.equal(row.sendRequests.length,0);
    row.walletBridge={scope:'SYNTHETIC_WALLETCONNECT_BOUNDARY_NO_SDK_RELAY',rejected:true,cancelledLateReplyIgnored:true,cancelledLateClientAuthorizationIgnored:true,explicitRetryConnected:true};
  });
  await runScenario(browser,profile,'bridge-primary-pairing-timeout-late',{guest:true,walletBridge:true,clock:true},async(page,row)=>{
    const pending=await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),journal=await journalBytes(page);
    await page.evaluate(()=>window.__18911BridgeQA.setMode('deferred'));
    await touchTarget(page,'#connectWallet');await page.locator('#connectWallet').click();
    await page.waitForFunction(()=>window.__18911BridgeQA.snapshot().waiting);
    const started=await page.evaluate(()=>window.__18911BridgeQA.snapshot());
    assert.equal(started.initializations.length,1);assert.equal(started.enableCalls,1);
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,0);
    await page.clock.fastForward(60_100);await page.waitForFunction(()=>!document.body.classList.contains('loading'));
    assert.match(await page.locator('#appStatus').textContent(),/逾時/);
    assert.equal(await page.locator('#connectWallet').isEnabled(),false,'the original primary pairing cannot be requested twice before it settles');
    assert.equal(await page.locator('#connectMobileWallet').isEnabled(),false);
    assert.equal(await page.locator('#refreshStatus').isEnabled(),true,'initial pairing timeout leaves read-only recovery available');
    await page.locator('#connectWallet').dispatchEvent('click');
    assert.equal(await page.evaluate(()=>window.__18911BridgeQA.snapshot().enableCalls),1);
    assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),WALLET_HINT_KEY),null);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),pending);assert.deepEqual(await journalBytes(page),journal);
    assert.equal(row.sendRequests.length,0);await capture(page,row,'first-primary-pairing-timeout-original-request-retained');
    await page.evaluate(()=>window.__18911BridgeQA.release());
    await page.waitForFunction(()=>!window.__18911BridgeQA.snapshot().waiting&&!document.querySelector('#connectWallet').disabled);
    await autoSettled(page);await page.clock.fastForward(31_000);await autoSettled(page);
    assert.equal(await page.evaluate(()=>window.__18911BridgeQA.snapshot().enableCalls),1);
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,0,'a late approval does not authorize the original page after its primary attempt timed out');
    assert.notEqual((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase());
    assert.doesNotMatch(await page.locator('#originalPageConnection').textContent(),/此頁已透過 WalletConnect 連線/);
    assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),WALLET_HINT_KEY),null);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),pending);assert.deepEqual(await journalBytes(page),journal);
    assert.equal(row.sendRequests.length,0);
    row.walletBridge={scope:'SYNTHETIC_PRIMARY_PAIRING_TIMEOUT_NO_REAL_RELAY',primaryClicksToPair:1,original60SecondDeadline:true,enableCalls:1,lateAccountAuthorizations:0,pendingAndJournalPreserved:true,financialRequests:0};
    await capture(page,row,'late-pairing-not-original-page-authority');
  });
  await runScenario(browser,profile,'bridge-native-return',{nativeReturn:true},async(page,row)=>{
    await phase(page,'CONNECTED');
    assert.equal((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase());
    assert.equal(new URL(page.url()).searchParams.has('walletBridge'),false,'one-use native return intent is removed from the URL');
    assert.equal(new URL(page.url()).hash,'#playerPanel');
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,1);
    assert.equal(row.sendRequests.length,0);assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),null);
    row.walletBridge={scope:'SYNTHETIC_INJECTED_NATIVE_RETURN',oneUseMarkerRemoved:true,transactionRequests:0};
    await page.locator('#walletAccount').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
    await capture(page,row,'one-connect-no-transaction');
  });
  await runScenario(browser,profile,'bridge-real-sdk-loader',{guest:true,walletBridge:'sdk-loader',sdkLoader:true},async(page,row)=>{
    await page.locator('#connectWallet').click();await phase(page,'CONNECTED');
    const bridge=await page.evaluate(()=>window.__18911BridgeQA.snapshot());
    assert.equal(bridge.sdkGlobalValidated,true,'the real pinned UMD evaluated before its init boundary was replaced');
    assert.equal(bridge.sdkIntegrity,WALLET_SDK_SRI);assert.equal(row.sdkScriptReads?.length,1);
    assert.equal(bridge.enableCalls,1);assert.equal(row.sendRequests.length,0);
    row.walletBridge={scope:'ACTUAL_PINNED_SDK_LOADER_SRI_GLOBAL_ONLY_SYNTHETIC_INIT_NO_RELAY',...bridge};
    await capture(page,row,'actual-sdk-loader-synthetic-pairing');
  });
  await runScenario(browser,profile,'bridge-native-late-injection',{nativeReturn:true,lateInjection:true},async(page,row)=>{
    assert.equal(new URL(page.url()).searchParams.get('walletBridge'),'1','native intent remains while the wallet provider is not yet injected');
    assert.equal(await page.evaluate(()=>Boolean(window.ethereum)),false);
    await page.evaluate(()=>window.__18911WalletQA.announceInjectedWallet());await phase(page,'CONNECTED');
    assert.equal((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase());
    assert.equal(new URL(page.url()).searchParams.has('walletBridge'),false);
    await page.evaluate(()=>window.__18911WalletQA.announceInjectedWallet());await autoSettled(page);
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,1,'repeated injection announcements cannot authorize twice');
    assert.equal(row.sendRequests.length,0);row.walletBridge={scope:'SYNTHETIC_LATE_INJECTED_PROVIDER',oneExplicitConnection:true};
    await capture(page,row,'late-injection-connected');
  });
  await runScenario(browser,profile,'bridge-native-discovery-timeout',{nativeReturn:true,lateInjection:true,clock:true},async(page,row)=>{
    assert.equal(new URL(page.url()).searchParams.get('walletBridge'),'1');
    await page.clock.fastForward(4_100);
    await page.waitForFunction(()=>!new URL(location.href).searchParams.has('walletBridge'));
    await autoSettled(page);assert.notEqual((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase());
    await page.evaluate(()=>window.__18911WalletQA.announceInjectedWallet());await page.clock.fastForward(5_000);await autoSettled(page);
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,0,'a late provider after bounded discovery needs a fresh explicit click');
    assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),WALLET_HINT_KEY),null);
    assert.equal(row.sendRequests.length,0);row.walletBridge={scope:'SYNTHETIC_NATIVE_TIMEOUT_NO_HINT',automaticPairings:0};
    await capture(page,row,'timeout-no-automatic-retry');
  });
  await runScenario(browser,profile,'bridge-native-discovery-cancel',{nativeReturn:true,lateInjection:true,clock:true},async(page,row)=>{
    await touchTarget(page,'#cancelWalletBridge');await page.locator('#cancelWalletBridge').click();
    assert.equal(new URL(page.url()).searchParams.has('walletBridge'),false);
    await page.evaluate(()=>window.__18911WalletQA.announceInjectedWallet());await page.clock.fastForward(5_000);await autoSettled(page);
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,0);
    assert.notEqual((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase());
    assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),WALLET_HINT_KEY),null);
    assert.equal(row.sendRequests.length,0);row.walletBridge={scope:'SYNTHETIC_NATIVE_CANCEL',lateProviderIgnored:true};
    await capture(page,row,'cancel-keeps-disconnected');
  });
  await runScenario(browser,profile,'bridge-background-approval-return',{guest:true,walletBridge:true},async(page,row)=>{
    const pending=await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),journal=await journalBytes(page);
    await page.evaluate(()=>window.__18911BridgeQA.setMode('deferred'));
    await touchTarget(page,'#connectWallet');await page.locator('#connectWallet').click();await page.waitForFunction(()=>window.__18911BridgeQA.snapshot().waiting);
    await page.evaluate(()=>window.__18911WalletQA.setVisibility('hidden'));
    await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));
    await page.evaluate(()=>window.__18911BridgeQA.release());await page.waitForFunction(()=>!window.__18911BridgeQA.snapshot().waiting);
    assert.notEqual((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase(),'background approval is not adopted before the original page is visible');
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,0);
    await page.evaluate(()=>{window.__18911WalletQA.setVisibility('visible');window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));});await phase(page,'CONNECTED');
    assert.equal((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase());
    assert.equal(await page.evaluate(()=>window.__18911BridgeQA.snapshot().enableCalls),1);
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,1);assert.equal(row.sendRequests.length,0);
    assert.match(await page.locator('#originalPageConnection').textContent(),/此頁已透過 WalletConnect 連線/);
    const session=await page.evaluate(()=>window.__18911BridgeQA.storedSession());
    assert.ok(session?.topic,'the original external page holds its own approved SDK session');
    await originalConnectionInView(page,row,'original-page-connected-after-return');
    await capture(page,row,'original-page-connected-after-return');
    const beforeNavigation=await page.evaluate(()=>window.__18911BridgeQA.snapshot());
    assert.equal(beforeNavigation.initializations.length,1,'pending-enable persisted return keeps the same original pairing instead of initializing another one');
    await touchTarget(page,'#chooseWallet');await page.locator('#chooseWallet').click();
    for(const [id,wallet]of [['openMetaMask','MetaMask'],['openTrustWallet','Trust Wallet']]){
      assert.match(await page.locator('#'+id).textContent(),new RegExp('只在 '+wallet+' 內開啟'));
      await touchTarget(page,'#'+id);await page.locator('#'+id).click();
    }
    const afterNavigation=await page.evaluate(()=>window.__18911BridgeQA.snapshot());
    assert.equal(afterNavigation.enableCalls,beforeNavigation.enableCalls);assert.equal(afterNavigation.initializations.length,beforeNavigation.initializations.length,'opening native URLs cannot initialize another SDK session');
    assert.equal((await page.evaluate(()=>window.__18911BridgeQA.storedSession())).topic,session.topic);
    assert.equal((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase());
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),pending);assert.deepEqual(await journalBytes(page),journal);
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,1);assert.equal(row.sendRequests.length,0);
    assert.equal(await page.evaluate(()=>window.__18911WalletQA.nativeNavigations().length),2);
    row.walletBridge={scope:'SYNTHETIC_VISIBILITY_PAIRING_AND_PERSISTED_EVENTS_NO_PHYSICAL_APP',primaryClicksToPair:1,approvedWhileHidden:true,adoptedOnlyOnReturn:true,
      pendingEnableAcrossSyntheticPagehidePageshow:true,nativeNavigationKeepsOriginalTopicAndAccount:true,additionalEnableCalls:0,additionalAccountPermissions:0,financialRequests:0,actualBFCache:'NOT_TESTED'};
    await capture(page,row,'original-session-preserved-after-native-links');
  });
  await runScenario(browser,profile,'bridge-original-session-reload',{guest:true,walletBridge:true},async(page,row)=>{
    await page.locator('#connectWallet').click();await phase(page,'CONNECTED');
    assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),WALLET_HINT_KEY),'1');
    const authorizations=row.rpc.filter(item=>item.method==='eth_requestAccounts').length;
    await page.reload({waitUntil:'load'});await phase(page,'CONNECTED');await autoSettled(page);
    assert.equal((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase());
    const restored=await page.evaluate(()=>window.__18911BridgeQA.snapshot());
    assert.equal(restored.initializations.length,1);assert.equal(restored.enableCalls,0,'reload restores SDK-owned approved session without opening a new pairing');
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,authorizations,'passive restoration never requests account authorization');
    assert.equal(await page.evaluate(()=>Boolean(window.ethereum)),false,'the external browser restores its own bridge, not an injected-wallet claim');
    assert.equal(row.sendRequests.length,0);row.walletBridge={scope:'SYNTHETIC_SDK_SESSION_STORAGE_RESTORE',passive:true,...restored};
    await capture(page,row,'original-session-restored');
  });
  await runScenario(browser,profile,'bridge-invalid-session-not-authority',{guest:true,walletBridge:true},async(page,row)=>{
    await page.locator('#connectWallet').click();await phase(page,'CONNECTED');
    const valid=await page.evaluate(()=>window.__18911BridgeQA.storedSession());
    const authorizations=row.rpc.filter(item=>item.method==='eth_requestAccounts').length;
    row.invalidSessionCases=[];
    for(const fault of ['expired','foreign','wrong-chain','account-mismatch','missing']){
      await page.evaluate(({session,fault,hint})=>{window.__18911BridgeQA.installStoredSession(session);window.__18911BridgeQA.corruptStoredSession(fault);sessionStorage.setItem(hint,'1');},{session:valid,fault,hint:WALLET_HINT_KEY});
      await page.reload({waitUntil:'load'});
      await page.waitForFunction(()=>document.querySelector('#appStatus')?.dataset.state!=='LOADING');await autoSettled(page);
      assert.notEqual((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase(),fault+' SDK session cannot be replaced by an untrusted local hint');
      assert.equal(await page.evaluate(()=>window.__18911BridgeQA.snapshot().enableCalls),0);
      assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,authorizations);
      assert.equal(row.sendRequests.length,0);row.invalidSessionCases.push({fault,connected:false,automaticPairings:0,accountAuthorizations:0});
    }
    row.walletBridge={scope:'SYNTHETIC_INVALID_SDK_SESSIONS_HINT_IS_NOT_AUTHORITY'};
    await capture(page,row,'invalid-session-remains-disconnected');
  });
  await runScenario(browser,profile,'bridge-restore-init-timeout-late',{guest:true,walletBridge:true,clock:true},async(page,row)=>{
    await page.locator('#connectWallet').click();await phase(page,'CONNECTED');
    const authorizations=row.rpc.filter(item=>item.method==='eth_requestAccounts').length;
    await page.evaluate(()=>window.__18911BridgeQA.setInitMode('deferred'));await page.reload({waitUntil:'load'});
    await page.waitForFunction(()=>window.__18911BridgeQA.snapshot().initWaiting);
    await page.clock.fastForward(60_100);await page.waitForFunction(()=>!document.body.classList.contains('loading'));
    assert.equal(await page.locator('#refreshStatus').isEnabled(),true,'a stalled SDK restore times out without locking read-only recovery');
    assert.equal(await page.locator('#connectMobileWallet').isEnabled(),false,'the unresolved SDK init cannot be entered twice');
    await page.locator('#refreshStatus').click();await autoSettled(page);
    assert.equal(await page.evaluate(()=>window.__18911BridgeQA.snapshot().initializations.length),1);
    await page.evaluate(()=>{window.__18911BridgeQA.setInitMode('ready');window.__18911BridgeQA.releaseInit();});
    await page.waitForFunction(()=>!window.__18911BridgeQA.snapshot().initWaiting);await autoSettled(page);
    assert.notEqual((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase(),'late restored session cannot overwrite the current public read after timeout');
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,authorizations);assert.equal(row.sendRequests.length,0);
    row.walletBridge={scope:'SYNTHETIC_UNRESOLVED_SDK_INIT',original60SecondDeadline:true,readOnlyRecoveryAvailable:true,lateRestoreIgnored:true};
    await capture(page,row,'stalled-init-timeout-recovered');
  });
  await runScenario(browser,profile,'bridge-restore-read-cancel-late',{guest:true,walletBridge:true},async(page,row)=>{
    await page.locator('#connectWallet').click();await phase(page,'CONNECTED');
    const authorizations=row.rpc.filter(item=>item.method==='eth_requestAccounts').length,gate='restore-wallet-read';
    await page.evaluate(id=>window.__18911WalletQA.armReloadWalletReadGate(id),gate);await page.reload({waitUntil:'load'});
    await page.waitForFunction(id=>window.__18911WalletQA.gateState(id)?.waiting,gate);
    await touchTarget(page,'#cancelWalletBridge');await page.locator('#cancelWalletBridge').click();
    assert.equal(await page.locator('#refreshStatus').isEnabled(),true);assert.equal(await page.locator('#connectMobileWallet').isEnabled(),false);
    await page.locator('#refreshStatus').click();await autoSettled(page);
    await page.evaluate(id=>window.__18911WalletQA.releaseRead(id,'resolve'),gate);await page.waitForFunction(id=>window.__18911WalletQA.gateState(id)?.settled,gate);await autoSettled(page);
    assert.notEqual((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase());
    assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),WALLET_HINT_KEY),null);
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,authorizations);assert.equal(row.sendRequests.length,0);
    row.walletBridge={scope:'SYNTHETIC_UNRESOLVED_RESTORE_READ',cancelledRestoreCannotAdoptLateAccount:true,readOnlyRecoveryAvailable:true};
    await capture(page,row,'stalled-read-cancel-late-ignored');
  });
  for(const stop of ['cancel','timeout'])await runScenario(browser,profile,'bridge-native-account-'+stop+'-late',{nativeReturn:true,lateInjection:true,clock:true},async(page,row)=>{
    const gate='native-account-'+stop;await page.evaluate(id=>window.__18911WalletQA.gateWalletAuthorization(id),gate);
    await page.evaluate(()=>window.__18911WalletQA.announceInjectedWallet());await page.waitForFunction(id=>window.__18911WalletQA.gateState(id)?.waiting,gate);
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,1);
    if(stop==='cancel')await page.locator('#cancelWalletBridge').click();else await page.clock.fastForward(60_100);
    await page.waitForFunction(()=>!document.body.classList.contains('loading'));
    assert.equal(await page.locator('#refreshStatus').isEnabled(),true);
    assert.equal(await page.locator('#connectWallet').isEnabled(),false,'the original unresolved account request is not sent twice');
    await page.evaluate(()=>window.__18911WalletQA.announceInjectedWallet());
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,1);
    await page.evaluate(id=>window.__18911WalletQA.releaseRead(id,'resolve'),gate);await page.waitForFunction(id=>window.__18911WalletQA.gateState(id)?.settled,gate);await autoSettled(page);
    await page.clock.fastForward(31_000);await autoSettled(page);
    assert.notEqual((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase(),'late approval after '+stop+' cannot be relabeled as automatic reconnection');
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,1);assert.equal(row.sendRequests.length,0);
    row.walletBridge={scope:'SYNTHETIC_UNRESOLVED_NATIVE_ACCOUNT',stop,original60SecondDeadline:true,lateAuthorizationIgnored:true};
    await capture(page,row,'account-'+stop+'-late-ignored');
  });
  await runScenario(browser,profile,'bridge-native-persisted-lifecycle',{nativeReturn:true,lateInjection:true},async(page,row)=>{
    await page.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));});
    await page.waitForFunction(()=>document.querySelector('#walletBridgeStatus')?.textContent.includes('等待'));
    const gate='native-persisted-account';await page.evaluate(id=>window.__18911WalletQA.gateWalletAuthorization(id),gate);
    await page.evaluate(()=>window.__18911WalletQA.announceInjectedWallet());await page.waitForFunction(id=>window.__18911WalletQA.gateState(id)?.waiting,gate);
    await page.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));});
    await page.waitForFunction(()=>!document.body.classList.contains('loading'));
    await page.evaluate(id=>window.__18911WalletQA.releaseRead(id,'resolve'),gate);await page.waitForFunction(id=>window.__18911WalletQA.gateState(id)?.settled,gate);await autoSettled(page);
    assert.notEqual((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase());
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,1,'persisted return does not resend an unresolved native account request');
    assert.equal(await page.locator('#refreshStatus').isEnabled(),true);assert.equal(row.sendRequests.length,0);
    row.walletBridge={scope:'SYNTHETIC_PERSISTED_EVENTS_ONLY',actualBFCache:'NOT_TESTED',discoveryAndInFlightAccountSeparated:true,lateAccountIgnored:true};
    await capture(page,row,'persisted-native-request-not-replayed');
  });
  await runScenario(browser,profile,'bridge-native-opens-same18911-two-contexts',{guest:true,walletBridge:true},async(page,row)=>{
    const nativeTarget=navigation=>{
      const link=new URL(navigation.href);
      if(navigation.id==='openTrustWallet'){
        assert.equal(link.origin,'https://link.trustwallet.com');assert.equal(link.searchParams.get('coin_id'),'20000714');return new URL(link.searchParams.get('url'));
      }
      assert.equal(link.origin,'https://link.metamask.io');assert.ok(link.pathname.startsWith('/dapp/'));
      const embedded=link.pathname.slice('/dapp/'.length)+link.search+link.hash;
      return new URL(/^https?:\/\//.test(embedded)?embedded:'https://'+embedded);
    };
    await page.locator('#chooseWallet').click();await touchTarget(page,'#walletDestination');
    assert.equal(await page.locator('#walletDestination').inputValue(),'furnace');
    assert.equal(await page.locator('#walletDestinationLink').textContent(),ENTRY);
    await touchTarget(page,'#openMetaMask');await page.locator('#openMetaMask').click();
    let navigations=await page.evaluate(()=>window.__18911WalletQA.nativeNavigations());assert.equal(navigations.length,1,'the first native click navigates immediately without requiring original-page pairing');
    assert.equal(await page.evaluate(()=>window.__18911BridgeQA.snapshot().initializations.length),0);
    assert.equal(await page.evaluate(()=>window.__18911BridgeQA.snapshot().enableCalls),0);
    assert.notEqual((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase(),'opening a wallet URL does not claim that the original page is connected');
    assert.ok(await page.locator('#walletBridgePanel').isVisible());
    await page.locator('#walletDestination').selectOption('site');
    assert.equal(await page.locator('#walletDestinationLink').textContent(),ROOT.href);assert.equal(await page.locator('#walletDestinationLink').evaluate(el=>el.href),ROOT.href);
    await page.locator('#openMetaMask').click();await page.locator('#openTrustWallet').click();
    navigations=await page.evaluate(()=>window.__18911WalletQA.nativeNavigations());assert.equal(navigations.length,3);
    for(const navigation of navigations.slice(1)){const target=nativeTarget(navigation);assert.equal(target.href,ROOT.href);assert.equal(target.searchParams.has('walletBridge'),false);assert.equal(target.hash,'');}
    await capture(page,row,'native-site-target-visible');
    await page.locator('#walletDestination').selectOption('furnace');await page.locator('#openTrustWallet').click();
    navigations=await page.evaluate(()=>window.__18911WalletQA.nativeNavigations());assert.equal(navigations.length,4);
    const target=nativeTarget(navigations[3]);assert.equal(target.href,nativeTarget(navigations[0]).href);
    assert.equal(target.origin,ROOT.origin);assert.equal(target.pathname,new URL(ENTRY).pathname);assert.equal(target.searchParams.get('walletBridge'),'1');assert.equal(target.hash,'#playerPanel');
    assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,0);assert.equal(row.sendRequests.length,0);
    assert.equal(await page.evaluate(()=>window.__18911BridgeQA.snapshot().initializations.length),0,'selecting either native destination never starts WalletConnect');
    const inApp={profile:row.profile,name:row.name+'-wallet-in-app',width:row.width,height:row.height,screenshots:[],touchTargets:[],blockedRequests:[],runtimeErrors:[],consoleErrors:[]};
    const {context:walletContext,page:walletPage}=await isolatedContext(browser,inApp);targetRecords.set(walletPage,inApp.touchTargets);
    try{
      assert.notEqual(walletContext,page.context());await installSyntheticWallet(walletContext,walletPage,inApp,{lateInjection:true});
      await walletPage.goto(target.href,{waitUntil:'load'});await walletPage.waitForFunction(()=>document.querySelector('#walletBridgePanel')?.hidden===false);
      assert.equal(await walletPage.evaluate(key=>sessionStorage.getItem(key),WALLET_HINT_KEY),null,'separate wallet browser has not inherited the original browser hint/session');
      await walletPage.evaluate(()=>window.__18911WalletQA.announceInjectedWallet());await phase(walletPage,'CONNECTED');
      assert.equal((await walletPage.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase());
      assert.equal(inApp.rpc.filter(item=>item.method==='eth_requestAccounts').length,1,'wallet browser separately obtains its own explicit account permission');
      assert.notEqual((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase(),'the native browser permission is not copied into the original browser');
      await page.locator('#connectWallet').click();await phase(page,'CONNECTED');
      assert.equal((await page.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase(),'the original page connects only through its own later explicit WalletConnect action');
      assert.match(await page.locator('#originalPageConnection').textContent(),/此頁已透過 WalletConnect 連線/);
      assert.equal(await page.evaluate(()=>Boolean(window.ethereum)),false);assert.equal(await page.evaluate(()=>window.__18911BridgeQA.snapshot().enableCalls),1);
      assert.equal(row.rpc.filter(item=>item.method==='eth_requestAccounts').length,1);
      assert.equal((await walletPage.locator('#walletAccount').textContent()).toLowerCase(),OWNER.toLowerCase());
      assert.equal(row.sendRequests.length,0);assert.equal(inApp.sendRequests.length,0);assert.deepEqual(inApp.blockedRequests,[]);assert.deepEqual(inApp.runtimeErrors,[]);
      await capture(walletPage,inApp,'wallet-in-app-separately-connected');
    }finally{await walletContext.close();}
    row.walletInAppContext=inApp;row.nativeNavigationIntents=navigations;
    row.walletBridge={scope:'SYNTHETIC_TWO_BROWSER_CONTEXTS_NO_NATIVE_APP_NO_REAL_RELAY',nativeNavigationRequiresPriorPairing:false,nativeTargets:['site','furnace'],eachContextHasOwnAccountAuthorization:true};
    await capture(page,row,'original-page-retains-connection');
  });
}

async function runP1RecoveryScenarios(browser,profile){
  await runScenario(browser,profile,'p1-hash-recovery',{clock:true},async(page,row)=>{
    await ownerReview(page,row);await accept(page);await page.locator('#confirmReview').click();await phase(page,['SUBMITTED','PENDING']);await autoSettled(page);
    const kufo=await mineReviewedPending(page,row);await automaticRead(page,row);
    assert.match(kufo.hash,/^0x[0-9a-f]{64}$/i,'mined helper returns the actual archived KUFO transaction hash');
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
    const furnaceHash=await page.evaluate(()=>window.__18911WalletQA.lastBroadcastHash());
    assert.match(furnaceHash,/^0x[0-9a-f]{64}$/i,'synthetic wallet retains the broadcast Furnace transaction hash');assert.notEqual(furnaceHash,kufo.hash);
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
  return {...mined,hash};
}

async function runPlayerConfirmationScenarios(browser,profile){
  await runScenario(browser,profile,'player-burn-confirm-feedback',{account:OTHER,activeAlchemy:true,clock:true},async(page,row)=>{
    await connect(page);await phase(page,'CONNECTED');
    assert.equal(await page.locator('#prepareDeploy').isEnabled(),false,'the player is not granted the Owner deployment role');
    const originalJournal=await journalBytes(page);
    await playerBurnReview(page,row);await accept(page,'0.6');
    const readGate='player-burn-preflight',walletGate='player-burn-wallet';
    await page.evaluate(({readGate,walletGate})=>{window.__18911WalletQA.gateRead(readGate);window.__18911WalletQA.gateWalletSend(walletGate);},{readGate,walletGate});
    await page.locator('#confirmReview').click();
    await page.waitForFunction(id=>window.__18911WalletQA.gateState(id)?.waiting,readGate);
    await confirmationInView(page,row,'checking-before-wallet','CHECKING');
    assert.equal(await page.locator('#confirmReview').isEnabled(),false);assert.equal(row.sendRequests.length,0);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),null,'preflight is not a broadcast or an unknown financial intent');
    const waitingReads=row.rpc.length;
    await page.locator('#confirmReview').evaluate(el=>el.click());
    assert.equal(row.rpc.length,waitingReads,'a disabled native button cannot start another confirmation');
    await capture(page,row,'checking-before-wallet');
    await page.evaluate(id=>window.__18911WalletQA.releaseRead(id,'resolve'),readGate);
    await page.waitForFunction(id=>window.__18911WalletQA.gateState(id)?.waiting,walletGate);
    await confirmationInView(page,row,'waiting-for-holder-wallet','PENDING');
    assert.equal(row.sendRequests.length,1,'only the deliberate confirmation opens the synthetic burn request');
    const pendingRaw=await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),pending=JSON.parse(pendingRaw);
    assert.equal(pending.kind,'burn');assert.equal(pending.amountWei,'100000000000000000000');assert.equal(pending.account.toLowerCase(),OTHER.toLowerCase());
    assert.equal(pending.phase,'AWAITING_WALLET');assert.equal(pending.hash,null);assert.equal(BigInt(pending.tx.value),0n);
    const request=await page.evaluate(({abi,item,owner})=>{
      const parsed=new window.ethers.utils.Interface(abi).parseTransaction({data:item.tx.data});
      return {method:parsed.name,amount:parsed.args[0].toString(),beneficiary:parsed.args[1],lifeId:parsed.args[2],expectedFurnace:window.ethers.utils.getContractAddress({from:owner,nonce:1})};
    },{abi:PAYLOAD.contracts.KAIOSAlchemyFurnace.abi,item:pending,owner:OWNER});
    assert.equal(request.method,'burnForKufo');assert.equal(request.amount,pending.amountWei);assert.equal(request.beneficiary.toLowerCase(),OTHER.toLowerCase());
    assert.equal(request.lifeId,'0x'+'0'.repeat(64));assert.equal(pending.tx.to.toLowerCase(),request.expectedFurnace.toLowerCase());
    assert.equal(row.sendRequests[0].transaction.to.toLowerCase(),request.expectedFurnace.toLowerCase(),'no replacement ERC20 approve is sent for an already approved amount');
    const walletWaitReads=row.rpc.length;
    await page.clock.fastForward(61_000);
    assert.equal(row.rpc.length,walletWaitReads,'the preflight deadline never times out or reads over a real wallet-confirmation wait');
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),pendingRaw);assert.equal(row.sendRequests.length,1);
    await confirmationInView(page,row,'wallet-wait-beyond-read-deadline','PENDING');
    await capture(page,row,'wallet-confirmation-pending');
    await page.evaluate(id=>window.__18911WalletQA.releaseRead(id,'resolve'),walletGate);
    await phase(page,['SUBMITTED','PENDING']);await autoSettled(page);
    const submitted=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),PENDING_KEY);
    assert.equal(submitted.intentId,pending.intentId);assert.match(submitted.hash,/^0x[0-9a-f]{64}$/i);assert.equal(submitted.phase,'SUBMITTED');
    await confirmationInView(page,row,'hash-saved-not-yet-mined',['SUBMITTED','PENDING']);
    assert.match(await page.locator('#confirmStatus').textContent(),/hash|雜湊|回執|待確認/);
    assert.deepEqual(await journalBytes(page),originalJournal,'an unmined burn must not create a successful receipt record');
    assert.equal(row.sendRequests.length,1);assert.equal(await page.locator('#prepareAlchemy').isEnabled(),false);
    row.confirmation={scope:'SYNTHETIC_ACTIVE_ROUTES_AND_EXISTING_EXACT_ALLOWANCE',kaios:'100',expectedKufo:'100000',holderCostCapBNB:'0.6',existingAllowanceKAIOS:'100',preflightVisible:true,
      explicitBurnRequests:1,approvalRequests:0,walletWaitBeyondReadDeadline:true,hashSaved:true,receiptVerified:false,realMintedKufo:0};
    await capture(page,row,'burn-hash-saved-no-success-claim');
  });
  await runScenario(browser,profile,'confirm-expired-preflight-timeout',{account:OTHER,activeAlchemy:true,clock:true},async(page,row)=>{
    await connect(page);await phase(page,'CONNECTED');
    const originalPending=await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),originalJournal=await journalBytes(page);
    await playerBurnReview(page,row);await accept(page,'0.6');
    await page.clock.fastForward(120_001);
    await page.locator('#confirmReview').click();await phase(page,'BLOCKED');
    await confirmationInView(page,row,'expired-preview-visible','ERROR','REVIEW_EXPIRED');
    assert.match(await page.locator('#confirmStatus').textContent(),/到期|過期|重新預覽/);
    assert.equal(await page.locator('#acceptReview').isChecked(),false);assert.equal(await page.locator('#confirmReview').isEnabled(),false);
    assert.equal(await page.locator('#reviewCap').inputValue(),'0.6','failure cannot silently change the holder spending cap');
    assert.equal(row.sendRequests.length,0);assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),originalPending);assert.deepEqual(await journalBytes(page),originalJournal);
    await capture(page,row,'expired-preview-visible-no-wallet-request');
    await playerBurnReview(page,row);await accept(page,'0.6');
    const gate='confirm-preflight-timeout';await page.evaluate(id=>window.__18911WalletQA.gateRead(id),gate);
    await page.locator('#confirmReview').click();await page.waitForFunction(id=>window.__18911WalletQA.gateState(id)?.waiting,gate);
    await confirmationInView(page,row,'read-before-timeout','CHECKING');
    await page.clock.fastForward(15_001);await phase(page,'BLOCKED');
    await confirmationInView(page,row,'preflight-timeout-visible','ERROR','TIMEOUT');
    assert.match(await page.locator('#confirmStatus').textContent(),/逾時|未送|重新/);
    assert.equal(await page.locator('#acceptReview').isChecked(),false);assert.equal(await page.locator('#confirmReview').isEnabled(),false);
    assert.equal(await page.locator('#reviewCap').inputValue(),'0.6');assert.equal(await page.locator('#prepareAlchemy').isEnabled(),true);
    assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('loading')),false,'a timed-out preflight releases UI busy without treating it as a sent transaction');
    assert.equal(row.sendRequests.length,0);assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),originalPending);assert.deepEqual(await journalBytes(page),originalJournal);
    await capture(page,row,'preflight-timeout-visible-no-wallet-request');
    // A new explicit preview may proceed while the old provider read remains
    // unresolved. Its late result must not replace the new review or consent.
    await playerBurnReview(page,row);
    const ui=()=>page.evaluate(()=>({state:document.querySelector('#appStatus').dataset.state,status:document.querySelector('#appStatus').textContent,
      details:document.querySelector('#reviewDetails').textContent,cost:document.querySelector('#reviewCost').textContent,
      feedback:document.querySelector('#confirmStatus').textContent,feedbackState:document.querySelector('#confirmStatus').dataset.state,
      accepted:document.querySelector('#acceptReview').checked,cap:document.querySelector('#reviewCap').value,disabled:document.querySelector('#confirmReview').disabled}));
    const newReview=await ui();assert.equal(newReview.state,'REVIEW');assert.equal(newReview.accepted,false);assert.equal(newReview.cap,'');
    await page.evaluate(id=>window.__18911WalletQA.releaseRead(id,'resolve'),gate);await page.waitForFunction(id=>window.__18911WalletQA.gateState(id)?.settled,gate);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    assert.deepEqual(await ui(),newReview,'late preflight completion cannot overwrite a newer explicit review or restore old consent');
    assert.equal(row.sendRequests.length,0);assert.equal(await page.evaluate(key=>localStorage.getItem(key),PENDING_KEY),originalPending);assert.deepEqual(await journalBytes(page),originalJournal);
    row.confirmation={scope:'SYNTHETIC_PREWALLET_FAILURES_ONLY',originalReviewExpiryMs:120000,originalReadDeadlineMs:15000,expiryCode:'REVIEW_EXPIRED',timeoutCode:'TIMEOUT',visibleErrors:true,
      pendingAndJournalUnchanged:true,newExplicitReviewProtectedFromLateRead:true,transactionRequests:0};
    await capture(page,row,'late-preflight-cannot-replace-new-review');
  });
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
    await confirmationInView(page,row,'unknown-result-preserved','PENDING');
    assert.match(await page.locator('#confirmStatus').textContent(),/未知|保留|原請求|尚未取得/);
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
  report.checks.push('Passive wrong-chain verification never switches or authorizes. Explicit injected, native-return and WalletConnect connections request only BSC0x38, tolerate a synchronous chainChanged event, re-read network56 before account permission, and never send funds. Rejected/unknown/unsupported/unverified switches stop with specific messages. Original sixty-second timeout, late result, changed account and same-raw WalletConnect reselect locks preserve pending/journal and cannot revive authorization or resubmit. All chain switching is synthetic; real wallet acceptance remains NOT_TESTED.');
  report.checks.push('Constructor preview shows actual Registry/KAIOS/version/timestamp/UTC+8/month IDs. Synthetic persisted pagehide/pageshow handler smoke only; actual BFCache and physical phone restoration remain NOT_TESTED.');
  report.checks.push('Keyboard skip link is reachable when focused and clipped when unfocused; each state includes an actual viewport shot and full-page shot, with bounding-rectangle evidence.');
  report.checks.push('Unresolved synthetic refresh survives persisted lifecycle reconstruction; old late resolve/reject cannot override a new in-flight operation or alter an existing financial pending intent.');
  report.checks.push('Official Playwright Clock drives visible-only thirty-second reads; synthetic visibility, review/wallet busy, passive original-account reload, same-account pending guards, two technical failures and first HTTP403/429 or identity refusal stop. No automatic financial request.');
  report.checks.push('Two added scenarios per viewport discover synthetic active routes with the real payload and an existing exact100 KAIOS allowance. A100 KAIOS→100000 KUFO review with an explicit0.6 BNB cap shows confirmation preflight without a test scroll, requests only one burn, keeps the genuine wallet-response wait beyond the read deadline, then preserves its unmined hash without claiming minted KUFO. Review expiry and the original15-second preflight read timeout remain zero-send, clear consent, preserve the holder cap and pending/journal, and cannot overwrite a newer review when the provider replies late. Existing rejection and hashless unknown-intent scenarios also require visible confirmation feedback. These are synthetic-provider and viewport checks, not physical-wallet, mainnet-burn or mint acceptance.');
  report.checks.push('P1 real UI recovery keeps an unknown Furnace intent and original KUFO journal across reload; rejects archived and unmined hashes with exact codes; only a canonical later receipt plus holder acknowledgement recovers it without another send. Recovery is anchored holder attestation, not proof of a unique wallet request.');
  report.checks.push('P1 first canonical status0 creation remains in cumulative downloaded evidence; an explicit later activation change permits only a fresh preview, with no retry transaction and no history rewrite.');
  report.checks.push('Both viewports retain the original bridge rejection/cancellation/late reply and financial-pending guards. One dedicated case independently reads the exact pinned WalletConnect2.12.2 script, verifies SHA384/SRI and its actual browser global, then replaces only init/pairing before any SDK relay operation; every other pairing/session fixture is synthetic. This is loader acceptance, not real relay or wallet acceptance.');
  report.checks.push('Without an injected provider, one explicit primary Connect click starts the existing WalletConnect pairing for this original page, with one enable/account authorization and no financial request. Synthetic hidden approval plus pending-enable pagehide/pageshow returns to the original page without a duplicate pairing; its explicit original-page connection label is checked. A sixty-second first-pairing timeout retains the unresolved request and rejects late authority. Native-only navigation remains under Choose wallet and cannot replace or mutate the original page topic, account, pending or journal. These synthetic events do not prove automatic OS return, a ChatGPT browser handoff, real BFCache or a physical wallet.');
  report.checks.push('Native URL targets resolve to the complete original18911 page. Delayed injection, bounded discovery, account cancellation/timeout, unresolved SDK restore init/read, original sixty-second deadlines, late replies and passive SDK-session reload are exercised without automatic financial requests. An untrusted restoration hint alone never provides account authority.');
  report.checks.push('Complete canonical site and18911 URLs remain visible/copyable without a wallet. Synthetic clipboard success, denied-write manual selection and older-rejection versus newer-success ordering are checked; no real OS clipboard is used. Native first-click navigation directly opens the selected site or furnace target without an original-page WalletConnect prerequisite, authorization, false connected state or financial pending/journal mutation.');
  report.checks.push('A separate isolated wallet-browser context opens the exact furnace target and independently authorizes its injected account. The original browser remains disconnected until its own later explicit WalletConnect action; neither URL nor local hint transfers account permission. App navigation is intercepted in CI; actual OS wallet handoff and physical phone connection remain NOT_TESTED. Synthetic background and persisted events do not prove real BFCache.');
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
