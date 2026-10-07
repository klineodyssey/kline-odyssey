import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {EventEmitter} from 'node:events';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {inspectRealTradingUiPreflight,inspectMainnetUnsignedPackage} from '../K線西遊記/temples/11520/runtime/real-trading-preflight-ui.mjs';

const WALLET={address:'0x3333333333333333333333333333333333333333',chainId:56};
const BRAIN='0x1111111111111111111111111111111111111111';
const ENGINE='0x2222222222222222222222222222222222222222';

// Synthetic structural fixture only: no actual deployment/readback/approval.
function sortedJson(v){return v&&typeof v==='object'?(Array.isArray(v)?'['+v.map(sortedJson).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+sortedJson(v[k])).join(',')+'}'):JSON.stringify(v)}
function seal(value){const {packageDigest,...payload}=structuredClone(value);return {...payload,packageDigest:'sha256:'+createHash('sha256').update(sortedJson(payload)).digest('hex')}}
function unsignedFixture(){return seal({
  documentType:'K11520_MAINNET_UNSIGNED_EXECUTION_PACKAGE',schemaVersion:1,chainId:56,mode:'BUILD_ONLY',broadcast:false,executionAuthorized:false,
  status:'UNSIGNED_REQUIRES_HUMAN_APPROVAL',blockers:[],deploymentReadbacks:'NOT_PERFORMED',
  input:{chainId:56,token:{address:ENGINE,chainId:56,testOnly:false,decimals:18,codeHash:'0x'+'ab'.repeat(32),provenance:'SYNTHETIC_NOT_PRODUCTION'},
    funding:{account:WALLET.address,settlementCapitalWei:'100',insuranceWei:'10',totalKgenWei:'110'},
    gas:{maximumGasPriceWei:'2',totalGasCostCapWei:'100000',nativeValuePerTransactionWei:'0'},startingNonces:{[WALLET.address]:3}},
  sourceHashes:{synthetic:'a'.repeat(64)},artifactDigests:{synthetic:'0x'+'b'.repeat(64)},predictedAddresses:{brainProxy:BRAIN,brainImplementation:ENGINE},
  transactions:Array.from({length:4},(_,i)=>({chainId:56,type:0,from:WALLET.address,to:null,nonce:3+i,value:'0',gasLimit:'100',gasPrice:'2',data:'0x1234'}))
})}

test('unsigned Mainnet inspector verifies content without enabling wallet or claiming chain evidence',async()=>{
  const p=unsignedFixture(),result=await inspectMainnetUnsignedPackage(p,{expectedDigest:p.packageDigest});
  assert.equal(result.reviewable,true);assert.equal(result.ready,false);
  assert.equal(result.broadcast,false);assert.equal(result.signerRequested,false);assert.equal(result.transactionPayload,null);
  assert.ok(result.blockers.includes('HUMAN_EXACT_MANIFEST_APPROVAL_REQUIRED'));
  assert.ok(result.blockers.includes('FRESH_CHAIN_CODE_NONCE_ORACLE_FUNDING_READBACK_REQUIRED'));
});

test('unsigned package tampering and unpinned digest fail closed',async()=>{
  const p=unsignedFixture();assert.equal((await inspectMainnetUnsignedPackage(p)).reviewable,false);
  const original=p.packageDigest;p.transactions[0].data='0xabcd';
  assert.equal((await inspectMainnetUnsignedPackage(p,{expectedDigest:original})).reviewable,false);
  const resealed=seal(p);assert.equal((await inspectMainnetUnsignedPackage(resealed,{expectedDigest:original})).reviewable,false);
});

test('unsigned inspector rejects chain, custody, proxy, gas, nonce and fabricated approval/receipt violations',async()=>{
  for(const mutate of [
    p=>p.chainId=97,p=>p.broadcast=true,p=>p.executionAuthorized=true,p=>p.deploymentReadbacks='VERIFIED',p=>p.approvalReceipt='fabricated',
    p=>p.input.token.testOnly=true,p=>p.input.token.codeHash=null,p=>p.input.token.provenance='',p=>p.input.funding.totalKgenWei='111',
    p=>p.predictedAddresses.brainProxy=ENGINE,p=>p.sourceHashes={},p=>p.artifactDigests={},p=>p.transactions=[],
    p=>p.transactions[0].chainId=97,p=>p.transactions[0].value='1',p=>p.transactions[0].nonce=0,p=>p.transactions[0].signature='signed',
    p=>p.transactions[0].gasPrice='3',p=>p.input.gas.totalGasCostCapWei='1',p=>p.input.gas.nativeValuePerTransactionWei='1'
  ]){const p=unsignedFixture();mutate(p);const sealed=seal(p);const result=await inspectMainnetUnsignedPackage(sealed,{expectedDigest:sealed.packageDigest});assert.equal(result.reviewable,false,mutate.toString());assert.equal(result.ready,false)}
  assert.equal((await inspectMainnetUnsignedPackage(null)).reviewable,false);
});

test('UI preflight is visibly blocked without real deployment/feed/authorization',()=>{
  const r=inspectRealTradingUiPreflight({axis:'KX',market:'BTCUSDT',chainId:56,walletIdentity:WALLET});
  assert.equal(r.ready,false);
  assert.equal(r.signerRequested,false);
  assert.equal(r.transactionPayload,null);
  assert.equal(r.broadcast,false);
  assert.ok(r.blockers.includes('PRODUCTION_FEED_PROVENANCE_REQUIRED'));
  assert.ok(r.blockers.includes('BRAIN_DEPLOYED_ADDRESS_REQUIRED'));
  assert.ok(r.blockers.includes('POSITION_ENGINE_DEPLOYED_ADDRESS_REQUIRED'));
  assert.ok(r.blockers.includes('HUMAN_MAINNET_EXECUTION_AUTHORIZATION_REQUIRED'));
});

test('UI preflight requires retained public wallet identity',()=>{
  const r=inspectRealTradingUiPreflight({axis:'KY',market:'ETHUSDT',chainId:56,walletIdentity:null});
  assert.equal(r.ready,false);
  assert.ok(r.blockers.includes('WALLET_PUBLIC_IDENTITY_REQUIRED'));
});

test('UI preflight can become ready only for exact fixed market and all protected gates',()=>{
  const r=inspectRealTradingUiPreflight({axis:'KZ',market:'BNBUSDT',chainId:56,walletIdentity:WALLET,feedProvenanceVerified:true,brainAddress:BRAIN,positionEngineAddress:ENGINE,humanMainnetAuthorization:true});
  assert.equal(r.ready,true);
  assert.deepEqual(r.blockers,[]);
  assert.throws(()=>inspectRealTradingUiPreflight({axis:'KZ',market:'SOLUSDT',chainId:56,walletIdentity:WALLET,feedProvenanceVerified:true,brainAddress:BRAIN,positionEngineAddress:ENGINE,humanMainnetAuthorization:true}),/REAL_TRADING_AXIS_MARKET_MISMATCH/);
});


test('every preflight identity follows the existing wallet session through A B reload and disconnect events',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/real-trading-preflight-ui.mjs',import.meta.url),'utf8');
 const render=source.slice(source.indexOf('function renderPreflight(){'),source.indexOf('function notifyOrderRoute(){'));
 const install=source.slice(source.indexOf('export function install11520RealTradingPreflightUi(){')).replace('export ','');
 const A='0x'+'11'.repeat(20),B='0x'+'22'.repeat(20);let current={account:A,chainId:97};
 const state={textContent:'',title:''},host={dataset:{},querySelector:()=>state},binding={axis:'KY',display:'ETHUSDT'},handlers=new Map();
 const context=vm.createContext({$:selector=>selector==='#k11520RealTradePreflight'?host:null,ensureStyle(){},document:{querySelectorAll:()=>[]},addEventListener:(name,fn)=>handlers.set(name,fn),activeAxisMarket:()=>({axis:'KY',market:'ETHUSDT'}),getRealTradingBinding:()=>binding,getWalletSession11520:()=>({snapshot:()=>current}),inspectRealTradingUiPreflight:()=>({ready:false,blockers:[],binding}),blockerLabel:String});
 vm.runInContext(render+install,context);vm.runInContext('install11520RealTradingPreflightUi()',context);
 const event=handlers.get('k11520:wallet');assert.equal(typeof event,'function');assert.equal(handlers.has('storage'),false,'cached storage is not current identity authority');
 const assertAddress=address=>{assert.equal(host.dataset.walletAddress,address);assert.equal(context.__K11520_REAL_TRADING_PREFLIGHT__.walletAddress,address||null);assert.equal(host.dataset.walletIdentityScope,address?'ACTIVE_SESSION':'DISCONNECTED')};
 assertAddress(A);assert.match(state.textContent,/0x1111/);
 current={account:null,chainId:null,status:'READING'};event();assertAddress('');assert.match(state.textContent,/錢包未連接/);assert.doesNotMatch(state.textContent,/0x/);
 current={account:B,chainId:97};event({detail:{account:A}});assertAddress(B);assert.match(state.textContent,/0x2222/);assert.doesNotMatch(state.textContent,/0x1111/,'event payload cannot replace canonical session');
 vm.runInContext('install11520RealTradingPreflightUi()',context);assertAddress(B);
 current={account:null,chainId:null,status:'DISCONNECTED'};event();assertAddress('');assert.doesNotMatch(state.textContent,/0x/);
});

// Deployment QA proof regressions share this existing preflight test owner.
{
const source=await readFile(new URL('../K線西遊記/temples/11520/tests/11520-browser-settlement.mjs',import.meta.url),'utf8');
const functionSource=source.slice(source.indexOf('function attachM1PageSourceProof('),source.indexOf('// M1 uses real public chain97 reads'));
const base='https://klineodyssey.github.io/kline-odyssey',path='K線西遊記/temples/11520/game-5d.html',bytes=Buffer.from('reviewed module');
const fixture=(sourceBytes=bytes)=>{const page=new EventEmitter(),context=vm.createContext({assert,URL}),hasBom=sourceBytes.subarray(0,3).equals(Buffer.from([239,187,191]));vm.runInContext(functionSource,context);return{page,finish:context.attachM1PageSourceProof(page,{base,sourceSha:'a'.repeat(40),assets:[{path,sha256:createHash('sha256').update(sourceBytes).digest('hex'),sourceByteLength:sourceBytes.length,hasLeadingUtf8Bom:hasBom,bomStrippedSha256:hasBom?createHash('sha256').update(sourceBytes.subarray(3)).digest('hex'):null,bomStrippedByteLength:hasBom?sourceBytes.length-3:null}],createHash})}};
const response=(body=bytes,query='?v=271')=>({url:()=>base+'/'+encodeURI(path)+query,status:()=>200,body:async()=>body,fromServiceWorker:()=>false});
test('public proof binds observed browser response bytes including cache variants',async()=>{const f=fixture();f.page.emit('response',response());const proof=await f.finish();assert.equal(proof.status,'PASS');assert.equal(proof.actualBrowserResponses[0].query,'?v=271')});
test('public proof rejects a stale browser variant even if a separate request matched',async()=>{const f=fixture();f.page.emit('response',response(Buffer.from('stale variant')));await assert.rejects(f.finish(),/actual public browser assets must match checkout/)});
test('public proof rejects missing critical responses',async()=>{const f=fixture();await assert.rejects(f.finish(),/PUBLIC_BROWSER_ASSET_NOT_OBSERVED/)});
test('public proof retains a mismatch across later matching reload responses',async()=>{const f=fixture();f.page.emit('response',response(Buffer.from('old'),'?v=old'));f.page.emit('response',response());await assert.rejects(f.finish(),/actual public browser assets must match checkout/);const records=f.finish.snapshot().observedBrowserResponses;assert.equal(records[0].query,'?v=old');assert.equal(records[0].matchKind,'NOT_VERIFIED');assert.equal(records[0].httpStatus,200);assert.equal(records[1].matchKind,'EXACT_SOURCE_BYTES')});

test('public proof accepts only source-derived leading UTF-8 BOM representation and records provenance',async()=>{
 const raw=Buffer.concat([Buffer.from([239,187,191]),bytes]);
 for(const body of [raw,bytes]){
  const f=fixture(raw);f.page.emit('response',{...response(body,'?v=bom-proof'),fromServiceWorker:()=>true});const proof=await f.finish(),record=proof.actualBrowserResponses[0];
  assert.equal(record.matchKind,body===raw?'EXACT_SOURCE_BYTES':'SOURCE_MINUS_LEADING_UTF8_BOM');
  assert.equal(record.rawExpectedHash,createHash('sha256').update(raw).digest('hex'));assert.equal(record.expectedBrowserRepresentationHash,createHash('sha256').update(bytes).digest('hex'));
  assert.equal(record.actualObservedHash,createHash('sha256').update(body).digest('hex'));assert.equal(record.actualObservedLength,body.length);assert.equal(record.rawExpectedLength,raw.length);
  assert.equal(record.fromServiceWorker,true);assert.equal(record.url,base+'/'+encodeURI(path)+'?v=bom-proof');assert.equal(proof.wholeModuleGraphVerified,false);
 }
});
test('public proof never normalizes altered content, unexpected BOM, line endings or another encoding',async()=>{
 const bom=Buffer.from([239,187,191]),raw=Buffer.concat([bom,bytes]);
 for(const [sourceBytes,body] of [[bytes,raw],[raw,Buffer.from('altered module')],[raw,Buffer.concat([bom,Buffer.from('altered module')])],[raw,Buffer.concat([bom,raw])],[raw,Buffer.concat([Buffer.from([255,254]),bytes])],[raw,Buffer.from('reviewed module','utf16le')],[raw,Buffer.concat([Buffer.from([239,187]),bytes])],[raw,Buffer.from('reviewed module\r\n')],[raw,Buffer.from(' reviewed module')],[Buffer.concat([bom,raw]),bytes],[Buffer.concat([bom,bytes,bom]),bytes]]){
  const f=fixture(sourceBytes);f.page.emit('response',response(body,'?v=bad'));await assert.rejects(f.finish(),/actual public browser assets must match checkout/);
  const record=f.finish.snapshot().observedBrowserResponses[0];assert.equal(record.matchKind,'NOT_VERIFIED');assert.equal(record.actualObservedLength,body.length);assert.equal(record.fromServiceWorker,false);assert.equal(record.query,'?v=bad');
 }
});

test('public proof drains response bodies that arrive while an earlier body is pending',async()=>{
 const f=fixture();let first,second;const a=new Promise(r=>{first=r}),b=new Promise(r=>{second=r});
 f.page.emit('response',{...response(),body:()=>a});const finished=f.finish();
 f.page.emit('response',{...response(bytes,'?reload=1'),body:()=>b});first(bytes);
 await new Promise(r=>setImmediate(r));let resolved=false;void finished.then(()=>{resolved=true},()=>{});await Promise.resolve();assert.equal(resolved,false);
 second(Buffer.from('late stale response'));await assert.rejects(finished,/actual public browser assets must match checkout/);
});
}

test('public M1 source allowlist covers current wallet visibility owners without claiming the whole module graph',async()=>{
 const workflow=await readFile(new URL('../.github/workflows/11520-responsive-qa.yml',import.meta.url),'utf8');
 for(const name of ['mobile-control-layout.mjs','mobile-ui-settings.mjs','game-mobile-shell.mjs'])assert.ok(workflow.includes("'"+name+"'"));
 assert.match(workflow,/wholeModuleGraphVerified.*False/);
 assert.match(workflow,/EXPLICIT_M1_WALLET_AND_HUD_ASSETS_ONLY/);
});

test('M1 public boot tolerates only completed entry races and requires execution and character readiness',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/tests/11520-browser-settlement.mjs',import.meta.url),'utf8');
 const helper=source.slice(source.indexOf('async function bootM1ReadOnlyPage('),source.indexOf('function attachM1PageSourceProof('));
 for(const scenario of [
  {name:'native entry',button:true,dismiss:true},
  {name:'already entered',button:false},
  {name:'removed during click',button:true,dismiss:true,clickError:true},
  {name:'blocked while visible',button:true,clickError:true,error:'native click failed'},
  {name:'click did not enter',button:true,error:'intro still visible'},
  {name:'missing button with visible intro',button:false,intro:true,error:'intro still visible'},
  {name:'execution unready',button:false,execution:false,error:'execution not ready'},
  {name:'character unready',button:false,character:false,error:'character not ready'},
 ]){
  let intro=scenario.intro??scenario.button,clicks=0,checks=0;
  const page={goto:async()=>{},locator:selector=>selector==='#enter11520'?{isVisible:async()=>scenario.button,click:async options=>{clicks++;assert.deepEqual({...options},{timeout:1500});if(scenario.dismiss)intro=false;if(scenario.clickError)throw new Error('native click failed')}}:{isVisible:async()=>intro,waitFor:async options=>{assert.deepEqual({...options},{state:'hidden',timeout:5000});if(intro)throw new Error('intro still visible')}},
   waitForFunction:async(fn,arg,options)=>{checks++;assert.equal(options.timeout,45000);if(!fn())throw new Error(checks===1?'execution not ready':'character not ready')}};
  const context=vm.createContext({__K11520_EXECUTION__:scenario.execution!==false,document:{querySelector:()=>({textContent:scenario.character===false?'LOADING':'READY'})}});
  vm.runInContext(helper,context);const pending=context.bootM1ReadOnlyPage(page,'https://example.test');
  if(scenario.error)await assert.rejects(pending,new RegExp(scenario.error),scenario.name);else{await pending;assert.equal(checks,2);assert.equal(clicks,Number(scenario.button))}
 }
});

test('automatic public M1 guard binds the triggering deployment and rejects nondeployments without a fallback SHA',async()=>{
 const workflow=await readFile(new URL('../.github/workflows/11520-responsive-qa.yml',import.meta.url),'utf8');
 const block=workflow.split("python3 - <<'PYSOURCE'\n")[1]?.split('          PYSOURCE')[0];assert.ok(block);
 const source=block.split('\n').map(line=>line.startsWith('          ')?line.slice(10):line).join('\n');
 const repo='klineodyssey/kline-odyssey',deployed='a'.repeat(40),defaultHead='b'.repeat(40),definition='c'.repeat(40);
 const event={repository:{full_name:repo},workflow:{id:307599529,name:'Deploy Pages Static',path:'.github/workflows/deploy-pages-static.yml'},workflow_run:{workflow_id:307599529,status:'completed',conclusion:'success',event:'push',name:'Deploy Pages Static',path:'.github/workflows/deploy-pages-static.yml',head_branch:'main',head_repository:{full_name:repo},repository:{full_name:repo},head_sha:deployed}};
 const env={GITHUB_REPOSITORY:repo,GITHUB_EVENT_NAME:'workflow_run',GITHUB_SHA:defaultHead,GITHUB_REF:'refs/heads/main',GITHUB_WORKFLOW_SHA:definition};
 const wrapper=`import json, os, sys, tempfile
from pathlib import Path
data=json.load(sys.stdin)
with tempfile.TemporaryDirectory() as folder:
 p=Path(folder); event=p/'event.json'; output=p/'output';event.write_text(json.dumps(data['event']))
 os.environ.update(data['env']);os.environ['GITHUB_EVENT_PATH']=str(event);os.environ['GITHUB_OUTPUT']=str(output)
 try:
  exec(compile(data['source'], '<workflow-source-guard>', 'exec'))
  result={'ok':True}
 except Exception as error:
  result={'ok':False,'reason':str(error)}
 result['output']=output.read_text() if output.exists() else ''
 print(json.dumps(result))`;
 const run=(e=event,v=env)=>{const r=spawnSync('python3',['-c',wrapper],{input:JSON.stringify({source,event:e,env:v}),encoding:'utf8',timeout:3000});assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout)};
 assert.deepEqual(run(),{ok:true,output:`sha=${deployed}\nworkflow_sha=${definition}\n`},'default branch head must not replace triggering deployment head');
 const qualified=structuredClone(event);qualified.workflow_run.path+='@refs/heads/main';assert.equal(run(qualified).ok,true,'canonical workflow identity does not depend on run.path serialization');
 for(const change of [e=>e.workflow_run.conclusion='failure',e=>e.workflow_run.status='in_progress',e=>e.workflow_run.event='pull_request',e=>e.workflow_run.event='pull_request_target',e=>e.workflow.name='Other',e=>e.workflow.path='.github/workflows/other.yml',e=>delete e.workflow,e=>delete e.workflow.id,e=>e.workflow.id=true,e=>e.workflow_run.workflow_id=123,e=>e.workflow_run.head_branch='feature',e=>e.workflow_run.head_repository.full_name='foreign/repo',e=>e.workflow_run.repository.full_name='foreign/repo',e=>e.repository.full_name='foreign/repo',e=>delete e.workflow_run.head_sha,e=>e.workflow_run.head_sha='main',e=>e.workflow_run.head_sha='A'.repeat(40)]){
  const altered=structuredClone(event);change(altered);const result=run(altered);assert.equal(result.ok,false);assert.equal(result.output,'','invalid source cannot emit a fallback checkout ref');
 }
 const manual={repository:{full_name:repo},inputs:{production:true}},manualEnv={...env,GITHUB_EVENT_NAME:'workflow_dispatch'};
 assert.equal(run(manual,manualEnv).output,`sha=${defaultHead}\nworkflow_sha=${definition}\n`);
 assert.equal(run({...manual,inputs:{production:'true'}},manualEnv).ok,true);
 for(const production of [false,'false',1,null])assert.equal(run({...manual,inputs:{production}},manualEnv).ok,false);
 assert.equal(run(manual,{...manualEnv,GITHUB_REF:'refs/heads/feature'}).ok,false);
 assert.equal(run(event,{...env,GITHUB_EVENT_NAME:'pull_request'}).ok,false);
 assert.equal(run(event,{...env,GITHUB_WORKFLOW_SHA:'invalid'}).ok,false);
});
test('automatic M1 retains read-only bounds and Pages cannot deploy a selected non-main branch',async()=>{
 const responsive=await readFile(new URL('../.github/workflows/11520-responsive-qa.yml',import.meta.url),'utf8'),pages=await readFile(new URL('../.github/workflows/deploy-pages-static.yml',import.meta.url),'utf8');
 const job=responsive.split('  m1-public-readonly:')[1].split('  public-input-diagnostics:')[0];
 assert.match(job,/needs: responsive/);assert.match(job,/timeout-minutes: 18/);assert.match(job,/ref: \$\{\{ steps\.source\.outputs\.sha \}\}/);assert.match(job,/K11520_SOURCE_SHA: \$\{\{ steps\.source\.outputs\.sha \}\}/);assert.match(job,/name: 11520-public-m1-\$\{\{ steps\.source\.outputs\.sha/);
 assert.match(job,/--m1-read-only/);assert.doesNotMatch(job,/--public-testnet|secrets\.|actions: write|contents: write/);assert.match(responsive,/permissions:\n  contents: read/);
 const deploy=pages.split('  deploy:')[1];assert.match(deploy,/github\.ref == 'refs\/heads\/main'/);assert.match(deploy,/ref: \$\{\{ github\.sha \}\}/);assert.match(deploy,/test "\$\(git rev-parse HEAD\)" = "\$GITHUB_SHA"/);
});
test('public source verifier fails closed on stale, mixed or changed deployment bytes',async()=>{
 const workflow=await readFile(new URL('../.github/workflows/11520-responsive-qa.yml',import.meta.url),'utf8');
 const body=workflow.split("cat > \"$RUNNER_TEMP/verify-m1-public-assets.py\" <<'PY'\n")[1]?.split('          PY\n')[0];assert.ok(body);
 const source=body.split('\n').map(line=>line.startsWith('          ')?line.slice(10):line).join('\n');
 const wrapper=`import io,json,os,sys,tempfile
from pathlib import Path
from unittest.mock import patch
from urllib.parse import unquote,urlparse
input=json.load(sys.stdin);sha='a'*40;reads=0
class Response(io.BytesIO):
 def __init__(self,body,url):super().__init__(body);self.status=200;self.url=url
def public(url,timeout):
 global reads
 path=unquote(urlparse(url).path).removeprefix('/kline-odyssey/')
 if path=='KGEN-KAIOS/dashboard/build-info.json':
  reads+=1;bad=input['mode']=='stale' or input['mode']=='mixed' and reads>1
  body=json.dumps({'main_commit':'b'*40 if bad else sha}).encode()
 else:body=(bytes.fromhex('efbbbf') if input['mode']=='bom' else b'')+(path+('@altered' if input['mode']=='bytes' else '@reviewed')).encode()
 return Response(body,url)
with tempfile.TemporaryDirectory() as folder:
 os.chdir(folder);os.environ.update(K11520_SOURCE_SHA=sha,K11520_BASE_URL='https://klineodyssey.github.io/kline-odyssey',GITHUB_WORKFLOW_SHA='c'*40,GITHUB_EVENT_NAME='workflow_run');sys.argv=['verifier','--phase','before']
 with patch('urllib.request.urlopen',side_effect=public),patch('subprocess.check_output',return_value=sha+'\\n'),patch.object(Path,'read_bytes',lambda p:(bytes.fromhex('efbbbf') if input['mode']=='bom' else b'')+(str(p)+'@reviewed').encode()):
  try:exec(compile(input['source'],'<public-verifier>','exec'));ok=True
  except Exception:ok=False
 report=json.loads(Path('artifacts/11520-m1-readonly-qa/public-source-before.json').read_text())
 print(json.dumps({'ok':ok,'report':report}))`;
 for(const mode of ['match','bom','stale','mixed','bytes']){
  const r=spawnSync('python3',['-c',wrapper],{input:JSON.stringify({source,mode}),encoding:'utf8',timeout:3000});assert.equal(r.status,0,r.stderr);const {ok,report}=JSON.parse(r.stdout);
  const matches=['match','bom'].includes(mode);assert.equal(ok,matches);assert.equal(report.status,matches?'PASS':'FAIL');assert.equal(report.sourceSha,'a'.repeat(40));assert.equal(report.workflowDefinitionSha,'c'.repeat(40));assert.equal(report.sourceEvent,'workflow_run');
  if(matches){assert.equal(report.assets.length,15);assert.equal(report.wholeModuleGraphVerified,false);for(const asset of report.assets){const bomExpected=mode==='bom'&&asset.path==='K線西遊記/temples/11520/game-5d.html';assert.equal(asset.hasLeadingUtf8Bom,mode==='bom');assert.ok(asset.sourceByteLength>0);if(bomExpected){assert.equal(asset.bomStrippedByteLength,asset.sourceByteLength-3);assert.notEqual(asset.bomStrippedSha256,asset.sha256)}else assert.equal(asset.bomStrippedSha256,null)}}
 }
});

async function m1DiagnosticsFixture(limit=2){
 const source=await readFile(new URL('../K線西遊記/temples/11520/tests/11520-browser-settlement.mjs',import.meta.url),'utf8');
 const helper=source.slice(source.indexOf('function createM1RpcDiagnostics('),source.indexOf('async function bootM1ReadOnlyPage('));
 const context=vm.createContext({});vm.runInContext(helper,context);let time=0;
 return {trace:context.createM1RpcDiagnostics({limit,now:()=>time}),tick:value=>{time=value}};
}
test('M1 Node broker diagnostics preserve the original failure while exposing its safe class',async()=>{
 const {normalizeExecutionError}=await import('../K線西遊記/temples/11520/runtime/real-trading-order-intent.mjs');
 const {trace}=await m1DiagnosticsFixture(),error=Object.assign(new Error('network request https://user:password@rpc.example/path?apiKey=hidden failed'),{code:'SERVER_ERROR',error:{code:-32005,message:'rate limit exceeded for 0x'+'aa'.repeat(20)}});
 assert.equal(normalizeExecutionError(error),'ORDER_REJECTED','legacy normalization alone loses the provider-specific failure');
 await assert.rejects(trace.run({method:'eth_call',phase:'LEGACY',stage:'RETURN_LEGACY',selector:'0x12345678',contract:'LEGACY.brainProxy'},async()=>{throw error}),caught=>caught===error);
 const record=trace.snapshot().failures[0];assert.equal(record.method,'eth_call');assert.equal(record.code,'SERVER_ERROR');assert.equal(record.rpcCode,-32005);assert.equal(record.category,'RATE_LIMIT');assert.equal(record.contract,'LEGACY.brainProxy');
 const serialized=JSON.stringify(trace.snapshot());for(const secret of ['rpc.example','password','hidden','0x'+'aa'.repeat(20),'network request','rate limit exceeded'])assert.equal(serialized.includes(secret),false);
});
test('M1 Node broker diagnostics retain the existing empty-log fallback and bounded failure history',async()=>{
 const {trace}=await m1DiagnosticsFixture();let fallbacks=0;
 for(let i=0;i<4;i++){
  const result=await trace.run({method:'eth_getLogs',phase:'LEGACY',stage:'RETURN_LEGACY'},async()=>{throw new Error('unavailable')},{existingLogFallback:true}).catch(()=>{fallbacks++;return []});assert.deepEqual(result,[]);
 }
 const report=trace.snapshot();assert.equal(fallbacks,4);assert.equal(report.failureCount,4);assert.equal(report.droppedFailures,2);assert.equal(report.failures.length,2);assert.equal(report.recent.length,2);assert.equal(report.failures[1].sequence,4);assert.equal(report.failures[1].existingLogFallback,true);
});
test('M1 broker phase and stage are captured before async completion; successful response content stays private',async()=>{
 const {trace,tick}=await m1DiagnosticsFixture();let release;const meta={method:'eth_call',phase:'M1',stage:'CONNECT',selector:'0x12345678'};
 const pending=trace.run(meta,()=>new Promise(resolve=>{release=resolve}));meta.phase='LEGACY';meta.stage='RETURN_LEGACY';tick(9);release('0x');assert.equal(await pending,'0x');
 const done=trace.snapshot().lastCompleted;assert.equal(done.phase,'M1');assert.equal(done.stage,'CONNECT');assert.equal(done.elapsedMs,9);assert.equal(done.responseKind,'string');assert.equal(done.responseLength,2);assert.equal('response' in done,false);
});
test('M1 malformed error metadata cannot mask the original broker rejection',async()=>{
 const {trace}=await m1DiagnosticsFixture(),error={};for(const key of ['code','message','shortMessage','error','name'])Object.defineProperty(error,key,{get(){throw new Error('metadata getter failure')}});
 await assert.rejects(trace.run({method:'eth_getCode',phase:'LEGACY',stage:'RETURN_LEGACY'},async()=>{throw error}),caught=>caught===error);
 const failure=trace.snapshot().failures[0];assert.equal(failure.errorClass,'OTHER');assert.equal(failure.code,null);assert.equal(failure.category,'UNCLASSIFIED');
});
test('M1 actual viewport failure catch preserves the original boot error and writes bounded diagnostics',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/tests/11520-browser-settlement.mjs',import.meta.url),'utf8');
 const helper=source.slice(source.indexOf('function createM1RpcDiagnostics('),source.indexOf('async function bootM1ReadOnlyPage('));
 const start=source.indexOf('    for(const [width,height]of[[360,740]'),end=source.indexOf("    console.log('M1 signer-free",start);assert.ok(start>0&&end>start);
 const original=new Error('original boot failure'),writes=[];let closed=0;
 const page={setDefaultTimeout(){},on(){},exposeBinding:async()=>{},addInitScript:async()=>{},screenshot:async()=>{},evaluate:async()=>null,close:async()=>{closed++}};
 const context=vm.createContext({assert,URL,accounts:['0x'+'11'.repeat(20),'0x'+'22'.repeat(20)],browser:{newPage:async()=>page},publicSource:null,origin:'https://example.test',out:'evidence',routeThree:async()=>{},boot:async()=>{throw original},fs:{writeFile:async(path,body)=>writes.push({path,body:JSON.parse(body)})}});
 vm.runInContext(helper,context);await assert.rejects(vm.runInContext('(async()=>{'+source.slice(start,end)+'})()',context),caught=>caught===original);
 assert.equal(closed,1);assert.equal(writes.length,1);assert.match(writes[0].path,/360x740-FAILURE.json$/);assert.equal(writes[0].body.message,'original boot failure');assert.deepEqual(writes[0].body.evidence,[]);assert.equal(writes[0].body.rpcDiagnostics.failureCount,0);assert.ok(writes[0].body.phaseCounts);
});

test('M1 diagnostics retain first and recent non-fallback errors despite a log fallback flood',async()=>{
 const {trace}=await m1DiagnosticsFixture(2),meta={method:'eth_call',phase:'LEGACY',stage:'RETURN_LEGACY'};
 const fail=async(meta,options)=>{const error=Object.assign(new Error('private raw content'),{code:'NETWORK_ERROR'});await assert.rejects(trace.run(meta,()=>Promise.reject(error),options),caught=>caught===error)};
 await fail(meta);const first=trace.snapshot().firstNonFallbackFailure;
 for(let i=0;i<8;i++)await fail({...meta,method:'eth_getLogs'},{existingLogFallback:true});
 let report=trace.snapshot();assert.equal(report.nonFallbackFailureCount,1);assert.equal(report.firstNonFallbackFailure,first);assert.equal(report.nonFallbackFailures.length,1);assert.equal(report.failures.length,2);
 await fail({...meta,method:'eth_getBalance'});await fail({...meta,method:'eth_getCode'});
 report=trace.snapshot();assert.equal(report.nonFallbackFailureCount,3);assert.equal(report.droppedNonFallbackFailures,1);assert.equal(report.nonFallbackFailures.length,2);assert.equal(report.firstNonFallbackFailure,first);
 assert.equal(JSON.stringify(report).includes('private raw content'),false);assert.equal(report.nonFallbackFailures[0].method,'eth_getBalance');
});


// Unsigned review UI fixtures are local metadata only, never live deployments.
const reviewCodec=(await import('node:module')).createRequire(import.meta.url)('../K線西遊記/assets/ethers-5.7.2.umd.min.js').ethers.utils;
const reviewModule=await import('../K線西遊記/temples/11520/runtime/real-trading-order-intent.mjs');
const reviewUi=await import('../K線西遊記/temples/11520/runtime/real-trading-preflight-ui.mjs');
const reviewHash=v=>reviewCodec.keccak256(reviewCodec.toUtf8Bytes(sortedJson(v)));
function reviewUiFixture(overrides={}){
 const hash='0x'+'ab'.repeat(32),fragments=[reviewModule.TESTNET_EXECUTION_ABI.testToken.find(f=>f.startsWith('function approve(')),...reviewModule.TESTNET_EXECUTION_ABI.brainProxy.filter(f=>/^function (depositMargin|withdrawMargin)\(/.test(f)),reviewModule.CAPITAL_EXECUTION_ABI.brainProxy.find(f=>f.startsWith('function claimSettlement('))];
 const deployment={schema:'K11520_BSC56_DEPLOYMENT_BINDING_V1',status:'DEPLOYED_CONFIG_VERIFIED',chainId:56,testOnly:false,tokenAddress:'0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be',brainAddress:BRAIN,brainImplementation:ENGINE,walletAddress:WALLET.address,pendingNonce:'7',allowanceWei:'0',tokenCodeHash:hash,brainCodeHash:hash,implementationCodeHash:hash,brainSourceHash:hash,abiHash:reviewHash(fragments),blockHash:hash,blockNumber:'123',reviewedCommit:'a'.repeat(40),accountingModel:'ISOLATED_SETTLEMENT_CAPITAL_V1'};
 const state={wallet:{account:WALLET.address,chainId:56,status:'CONNECTED'},context:{deployment,sourceHead:deployment.reviewedCommit,bindingDigest:reviewHash(deployment),blockHash:hash,blockNumber:'123',pendingNonce:'7',gasLimit:'100000',gasPriceWei:'50000000',maximumGasFeeWei:'5000000000000'},changes:[]};
 state.controller=reviewUi.createBsc56UnsignedReviewController({getWalletSnapshot:()=>state.wallet,getReviewContext:()=>state.context,codec:()=>reviewCodec,onChange:s=>state.changes.push(s),...overrides});
 state.controller.setDraft({action:'depositMargin',amountWei:'1000000000000000001'});state.controller.open();return state;
}
const assertReviewBlocked=s=>{assert.equal(s.hasTransaction,false);assert.equal(s.bindingDigest,null);assert.equal(s.executionReady,false);assert.equal(s.signerRequested,false);assert.equal(s.broadcast,false);assert.equal(s.fields.CONTRACT,'NOT_DEPLOYED / UNKNOWN')};

test('BSC56 review exposes all eight exact fields from the pure helper and stays unsigned',async()=>{
 const f=reviewUiFixture(),s=await f.controller.prepare();assert.equal(s.status,'UNSIGNED_REVIEW');assert.equal(s.hasTransaction,true);
 assert.deepEqual(Object.keys(s.fields),reviewUi.BSC56_REVIEW_FIELDS);assert.equal(s.fields.WALLET,WALLET.address);assert.equal(s.fields.CONTRACT,BRAIN);assert.equal(s.fields.FUNCTION,'depositMargin');assert.match(s.fields.AMOUNT,/1000000000000000001/);assert.match(s.fields.MAXIMUM_EXPOSURE,/5000000000000/);
 assert.equal(s.executionReady,false);assert.equal(s.signerRequested,false);assert.equal(s.broadcast,false);assert.match(s.reason,/FRESH_READBACK/);assert.ok(Object.isFrozen(s.fields));
 for(const action of ['approve','withdrawMargin','claimSettlement']){f.controller.setDraft({action,amountWei:'1',positionKey:'0x'+'cd'.repeat(32)});const x=await f.controller.prepare();assert.equal(x.status,'UNSIGNED_REVIEW',action);assert.equal(x.fields.FUNCTION,action)}
});

test('BSC56 actual page default has no trusted context and never reaches a codec or builder',async()=>{
 let calls=0;const c=reviewUi.createBsc56UnsignedReviewController({getWalletSnapshot:()=>({account:WALLET.address,chainId:56,status:'CONNECTED'}),codec(){calls++;throw Error('must not run')},build(){calls++;throw Error('must not run')}});
 c.open();c.setDraft({action:'depositMargin',amountWei:'1'});const s=await c.prepare();assert.equal(s.reason,'DEPLOYED_BINDING_AND_READBACK_REQUIRED');assertReviewBlocked(s);assert.equal(calls,0);
});

test('BSC56 review invalidates on account, chain, session, action and amount changes before reading snapshot',async()=>{
 for(const mutate of [f=>f.wallet.account=ENGINE,f=>f.wallet.chainId=97,f=>f.wallet.status='READING',f=>f.wallet={account:null,chainId:null,status:'DISCONNECTED'},f=>f.controller.setDraft({action:'withdrawMargin'}),f=>f.controller.setDraft({amountWei:'2'})]){
  const f=reviewUiFixture();await f.controller.prepare();mutate(f);const s=f.controller.snapshot();assertReviewBlocked(s);assert.equal(s.status,'STALE');assert.equal(s.reason,'REVIEW_CONTEXT_CHANGED');
 }
});

test('BSC56 review invalidates every source, binding, block, nonce, gas and allowance change',async()=>{
 for(const mutate of [f=>f.context.sourceHead='b'.repeat(40),f=>f.context.bindingDigest='0x'+'12'.repeat(32),f=>f.context.blockHash='0x'+'34'.repeat(32),f=>f.context.blockNumber='124',f=>f.context.pendingNonce='8',f=>f.context.gasPriceWei='1',f=>f.context.maximumGasFeeWei='1',f=>f.context.deployment.allowanceWei='1',f=>f.context.deployment.brainAddress=ENGINE]){
  const f=reviewUiFixture();await f.controller.prepare();mutate(f);assertReviewBlocked(f.controller.sync());assert.equal(f.changes.at(-1).status,'STALE');
 }
});

test('BSC56 late result cannot cross account ABA, close reopen, input change or disposal',async()=>{
 for(const event of ['accountABA','closeReopen','input','dispose']){
  let release;const f=reviewUiFixture({build:(input,opts)=>new Promise(resolve=>{release=()=>resolve(reviewModule.buildBsc56UnsignedCustodyReview(input,opts))})});
  const pending=f.controller.prepare();assert.equal(f.controller.snapshot().status,'BUILDING');
  if(event==='accountABA'){f.wallet.account=ENGINE;f.controller.sync();f.wallet.account=WALLET.address;f.controller.sync()}
  if(event==='closeReopen'){f.controller.close();f.controller.open()}
  if(event==='input')f.controller.setDraft({amountWei:'2'});
  if(event==='dispose')f.controller.dispose();
  release();await pending;assertReviewBlocked(f.controller.snapshot());assert.notEqual(f.controller.snapshot().status,'UNSIGNED_REVIEW');
 }
});

test('BSC56 repeated prepare only accepts the most recent result',async()=>{
 const pending=[];const f=reviewUiFixture({build:(input,opts)=>new Promise(resolve=>pending.push(()=>resolve(reviewModule.buildBsc56UnsignedCustodyReview(input,opts))))});
 const first=f.controller.prepare(),second=f.controller.prepare();pending[1]();await second;const digest=f.controller.snapshot().intentDigest;pending[0]();await first;assert.equal(f.controller.snapshot().intentDigest,digest);assert.equal(f.controller.snapshot().status,'UNSIGNED_REVIEW');
});

test('BSC56 context rejects accessors, hooks, cycles and resource excess without invoking them',async()=>{
 for(const kind of ['getter','nestedGetter','hook','cycle','depth','bytes']){
  const f=reviewUiFixture();let invoked=0;
  if(kind==='getter')Object.defineProperty(f.context,'sourceHead',{enumerable:true,get(){invoked++;return 'a'.repeat(40)}});
  if(kind==='nestedGetter')Object.defineProperty(f.context.deployment,'brainAddress',{enumerable:true,get(){invoked++;return BRAIN}});
  if(kind==='hook')f.context.toJSON=()=>{invoked++;return {}};
  if(kind==='cycle')f.context.loop=f.context;
  if(kind==='depth'){let v=f.context;for(let i=0;i<12;i++)v=v.child={}}
  if(kind==='bytes')f.context.large='x'.repeat(32769);
  const s=await f.controller.prepare();assertReviewBlocked(s);assert.equal(s.reason,'REVIEW_CONTEXT_INVALID',kind);assert.equal(invoked,0);
 }
});

test('BSC56 source inconsistency and execution-shaped builder output remain blocked',async()=>{
 const f=reviewUiFixture();f.context.deployment.reviewedCommit='b'.repeat(40);assert.equal((await f.controller.prepare()).reason,'REVIEW_CONTEXT_BINDING_MISMATCH');assertReviewBlocked(f.controller.snapshot());
 for(const field of ['executionReady','signerRequested','broadcast']){const g=reviewUiFixture({build:(i,o)=>({...reviewModule.buildBsc56UnsignedCustodyReview(i,o),[field]:true})});assert.equal((await g.controller.prepare()).reason,'UNSIGNED_REVIEW_BOUNDARY_REQUIRED');assertReviewBlocked(g.controller.snapshot())}
});

test('BSC56 review draft bounds forbid unsupported semantics and retain exact uint strings',()=>{
 const f=reviewUiFixture();for(const action of ['order','sign','send','KAIOS'])assert.throws(()=>f.controller.setDraft({action}),/REVIEW_ACTION_NOT_SUPPORTED/);
 for(const amountWei of [1,1.5,1n,'1'.repeat(79)])assert.throws(()=>f.controller.setDraft({amountWei}),/REVIEW_DRAFT_INVALID/);
 let invoked=0;assert.throws(()=>f.controller.setDraft(Object.defineProperty({},'amountWei',{get(){invoked++;return '1'}})),/ACCESSOR_FORBIDDEN/);assert.equal(invoked,0);
});
