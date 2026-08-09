import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here=path.dirname(fileURLToPath(import.meta.url));
const temple=path.resolve(here,"..");
const repo=path.resolve(temple,"../../..");
const require=createRequire(path.join(repo,"KGEN-KAIOS","package.json"));
const { Interface }=require("ethers");
const resolver=require(path.join(temple,"modules","contract-resolver.js"));
const txState=require(path.join(temple,"modules","transaction-state.js"));
const game=require(path.join(temple,"modules","fortune-game-adapter.js"));
const config=JSON.parse(fs.readFileSync(path.join(temple,"config","contracts.json"),"utf8"));
const abiDoc=JSON.parse(fs.readFileSync(path.join(temple,"abi","temple-heart.json"),"utf8"));

test("canonical ABI is compiler-labelled and has all V3.4 selectors",()=>{
  assert.equal(abiDoc.contractName,"KGEN_TempleHeart_Upgradeable");
  assert.match(abiDoc.compiler,/^0\.8\.24/);
  const iface=new Interface(abiDoc.abi);
  const required=[
    "version()","isHeartGameOperational()","gameSurvivalGateWhole()","baseFloorWhole()","baseCapWhole()",
    "totalPilgrims()","totalWishers()","totalHolyCupPassed()","totalCustomerWallets()","totalHeartbeats()",
    "totalHeartbeatPaid()","totalIgnites()","totalIgnitePaid()","totalFortuneClaimants()","totalFortunePaid()",
    "current11520Treasury()","fortuneGame()","makeWish(bytes32,bytes32)","activeWish(address)",
    "heartbeatClaim()","igniteAndClaim()","fortuneClaim(bytes32)","previewFortuneReward(bytes32)",
    "nextFortuneEligibility(address)","fortuneLedger(address)","voluntaryRepayFortune(uint256)","normalizeHeartBalance()"
  ];
  for(const signature of required) assert.ok(iface.getFunction(signature),signature);
  assert.equal(iface.getFunction("fortuneClaim(uint256)"),null);
  assert.equal(iface.getFunction("makeWish(bytes32)"),null);
  const artifact=path.join(repo,"KGEN-KAIOS","artifacts","KGEN_TempleHeart_Upgradeable.json");
  if(fs.existsSync(artifact)) assert.deepEqual(abiDoc.abi,JSON.parse(fs.readFileSync(artifact,"utf8")).abi);
});

test("chain 56 and 97 config are explicit and never fall back",()=>{
  assert.deepEqual(Object.keys(config.networks).sort(),["56","97"]);
  assert.equal(config.networks["56"].chainId,56);
  assert.equal(config.networks["97"].chainId,97);
  assert.equal(config.networks["56"].currentHeart.address,null);
  assert.equal(config.networks["56"].fortuneGame.address,null);
  assert.equal(config.networks["97"].currentHeart.status,"TESTNET_REHEARSAL_ONLY");
  assert.notEqual(config.networks["56"].kgen.address.toLowerCase(),config.networks["97"].kgen.address.toLowerCase());
  assert.equal(resolver.networkFor(config,1),null);
});

test("wrong network disables writes",()=>{
  const result=resolver.validateCurrentHeart({network:null});
  assert.equal(result.writeEnabled,false); assert.equal(result.reason,resolver.REASONS.UNSUPPORTED_CHAIN);
});

test("no-code current address disables writes",()=>{
  const network={currentHeart:{address:"0x1111111111111111111111111111111111111111"},legacyHeart:{address:"0x2222222222222222222222222222222222222222"}};
  const result=resolver.validateCurrentHeart({network,code:"0x",version:"3.4.0",allowedVersions:["3.4.x"]});
  assert.equal(result.writeEnabled,false); assert.equal(result.reason,resolver.REASONS.NO_CODE);
});

test("legacy and current Heart can never be the same address",()=>{
  const address="0x1111111111111111111111111111111111111111";
  const result=resolver.validateCurrentHeart({network:{currentHeart:{address},legacyHeart:{address}},code:"0x1234",version:"3.4.0"});
  assert.equal(result.writeEnabled,false); assert.equal(result.reason,resolver.REASONS.LEGACY_CURRENT_COLLISION);
});

test("version mismatch disables writes",()=>{
  const result=resolver.validateCurrentHeart({network:{currentHeart:{address:"0x1111111111111111111111111111111111111111"},legacyHeart:{address:null}},code:"0x1234",version:"3.5.0",allowedVersions:["3.4.x"]});
  assert.equal(result.writeEnabled,false); assert.equal(result.reason,resolver.REASONS.VERSION_MISMATCH);
});

test("missing currentHeart disables every V3.4 write",()=>{
  const result=resolver.validateCurrentHeart({network:config.networks["56"],code:"0x1234",version:"3.4.0",allowedVersions:config.allowedTempleHeartVersions});
  assert.equal(result.writeEnabled,false); assert.equal(result.reason,resolver.REASONS.CURRENT_HEART_PENDING);
});

test("transaction states confirm only receipt status success",async()=>{
  const states=[]; const controller=new txState.TransactionController({explorer:"https://bscscan.com",onChange:s=>states.push(s.state)});
  await controller.run("heartbeatClaim",async()=>({hash:"0xabc",wait:async()=>({status:1})}));
  assert.deepEqual(states.slice(-4),["READY","WALLET_CONFIRM","PENDING","CONFIRMED"]);
  assert.equal(controller.snapshot().explorerUrl,"https://bscscan.com/tx/0xabc");
  await assert.rejects(controller.run("igniteAndClaim",async()=>({hash:"0xdef",wait:async()=>({status:0})})));
  assert.equal(controller.snapshot().state,"REVERTED");
});

test("FortuneGame remains pending without address, code and ABI",()=>{
  const result=game.evaluateReadiness({configAddress:null,heartOperational:true});
  assert.equal(result.ready,false); assert.equal(result.reason,"ADDRESS_PENDING");
  const html=fs.readFileSync(path.join(temple,"index.html"),"utf8");
  assert.doesNotMatch(html,/kgen-12345-web3-shell\.js/);
  assert.doesNotMatch(html,/window\.process\s*=/);
  assert.doesNotMatch(html,/walletconnect\/ethereum-provider@2\.12\.2/);
  const heartRuntime=fs.readFileSync(path.join(temple,"modules","temple-heart-runtime.js"),"utf8");
  assert.match(heartRuntime,/ethereum-provider@2\.23\.10\?bundle/);
});

test("mobile layout smoke has bounded main image and accordion drawers",()=>{
  const css=fs.readFileSync(path.join(temple,"modules","temple-heart.css"),"utf8");
  assert.match(css,/@media \(max-width:900px\)/);
  assert.match(css,/max-width:calc\(100vw - 20px\)!important/);
  assert.match(css,/v34-drawer-open/);
  assert.match(css,/footer-terminal[\s\S]*overflow-x:auto/);
  const runtime=fs.readFileSync(path.join(temple,"modules","temple-heart-runtime.js"),"utf8");
  assert.match(runtime,/closeOthers/);
  assert.match(runtime,/ASSET_CANON_PENDING_HEART_FRONT/);
  const mainRuntime=fs.readFileSync(path.join(temple,"modules","runtime-main.js"),"utf8");
  assert.doesNotMatch(mainRuntime,/HEART_VIEW_ABI|HEART_ABI_V326|命中率|方向盤 →/);
});
