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
const base='https://klineodyssey.github.io/kline-odyssey',path='K線西遊記/temples/11520/runtime/game-5d-bootstrap.mjs',bytes=Buffer.from('reviewed module');
const fixture=()=>{const page=new EventEmitter(),context=vm.createContext({assert,URL});vm.runInContext(functionSource,context);return{page,finish:context.attachM1PageSourceProof(page,{base,sourceSha:'a'.repeat(40),assets:[{path,sha256:createHash('sha256').update(bytes).digest('hex')}],createHash})}};
const response=(body=bytes,query='?v=271')=>({url:()=>base+'/'+encodeURI(path)+query,status:()=>200,body:async()=>body,fromServiceWorker:()=>false});
test('public proof binds observed browser response bytes including cache variants',async()=>{const f=fixture();f.page.emit('response',response());const proof=await f.finish();assert.equal(proof.status,'PASS');assert.equal(proof.actualBrowserResponses[0].query,'?v=271')});
test('public proof rejects a stale browser variant even if a separate request matched',async()=>{const f=fixture();f.page.emit('response',response(Buffer.from('stale variant')));await assert.rejects(f.finish(),/actual public browser assets must match checkout/)});
test('public proof rejects missing critical responses',async()=>{const f=fixture();await assert.rejects(f.finish(),/PUBLIC_BROWSER_ASSET_NOT_OBSERVED/)});
test('public proof retains a mismatch across later matching reload responses',async()=>{const f=fixture();f.page.emit('response',response(Buffer.from('old')));f.page.emit('response',response());await assert.rejects(f.finish(),/actual public browser assets must match checkout/)});

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
 else:body=(path+('@altered' if input['mode']=='bytes' else '@reviewed')).encode()
 return Response(body,url)
with tempfile.TemporaryDirectory() as folder:
 os.chdir(folder);os.environ.update(K11520_SOURCE_SHA=sha,K11520_BASE_URL='https://klineodyssey.github.io/kline-odyssey',GITHUB_WORKFLOW_SHA='c'*40,GITHUB_EVENT_NAME='workflow_run');sys.argv=['verifier','--phase','before']
 with patch('urllib.request.urlopen',side_effect=public),patch('subprocess.check_output',return_value=sha+'\\n'),patch.object(Path,'read_bytes',lambda p:(str(p)+'@reviewed').encode()):
  try:exec(compile(input['source'],'<public-verifier>','exec'));ok=True
  except Exception:ok=False
 report=json.loads(Path('artifacts/11520-m1-readonly-qa/public-source-before.json').read_text())
 print(json.dumps({'ok':ok,'report':report}))`;
 for(const mode of ['match','stale','mixed','bytes']){
  const r=spawnSync('python3',['-c',wrapper],{input:JSON.stringify({source,mode}),encoding:'utf8',timeout:3000});assert.equal(r.status,0,r.stderr);const {ok,report}=JSON.parse(r.stdout);
  assert.equal(ok,mode==='match');assert.equal(report.status,mode==='match'?'PASS':'FAIL');assert.equal(report.sourceSha,'a'.repeat(40));assert.equal(report.workflowDefinitionSha,'c'.repeat(40));assert.equal(report.sourceEvent,'workflow_run');
  if(mode==='match'){assert.equal(report.assets.length,15);assert.equal(report.wholeModuleGraphVerified,false)}
 }
});
