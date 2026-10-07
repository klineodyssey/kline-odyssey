import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ALLOWED_PROGRESS_STATUSES,classifyPlayerSections,validateProgressSource} from '../runtime/product-progress-board.mjs';

const here=dirname(fileURLToPath(import.meta.url));
const source=JSON.parse(readFileSync(resolve(here,'../K11520_PRODUCT_PROGRESS_CURRENT.json'),'utf8'));
const bootstrap=readFileSync(resolve(here,'../runtime/game-5d-bootstrap.mjs'),'utf8');
const runtime=readFileSync(resolve(here,'../runtime/product-progress-board.mjs'),'utf8');
const utilityOwner=readFileSync(resolve(here,'../runtime/market-origin-wallet-layout-runtime.mjs'),'utf8');
const required=['WORLD_MOVEMENT','COMBAT','INVENTORY','PLAYER_LIFE','BTC','ETH','BNB','LONG_SHORT','C','LOTS','ORDER','TRIGGER','FILL','POSITION','PNL','LIQUIDATION','CLOSE','RECEIPTS','WALLET','BSC56','CARGO','COURIER','ATM','UNIVERSE_DELIVERY','PUBLIC_RUNTIME'];

test('controlled progress source is complete and uses only the closed status vocabulary',()=>{
  const result=validateProgressSource(source,{now:Date.parse('2026-10-08T00:00:00Z')});
  assert.equal(result.ok,true,result.errors.join(','));
  assert.equal(result.sourceStale,false);
  assert.deepEqual(Object.keys(source.features),required);
  const allowed=new Set(ALLOWED_PROGRESS_STATUSES);
  for(const item of [...Object.values(source.features),...Object.values(source.engineering)])assert.equal(allowed.has(item.status),true,item.status);
});

test('truth boundary never promotes Draft or CI evidence to real funds or public release',()=>{
  assert.equal(source.features.WALLET.status,'NOT_READY');
  assert.equal(source.engineering.REAL_WALLET.status,'NOT_READY');
  assert.equal(source.engineering.REAL_ORDER.status,'NOT_READY');
  assert.equal(source.engineering.REAL_SETTLEMENT.status,'NOT_READY');
  assert.equal(source.features.PUBLIC_RUNTIME.status,'STALE');
  assert.equal(source.engineering.PAGES_STATUS.status,'STALE');
  assert.equal(source.features.CARGO.status,'TESTING');
  assert.equal(source.features.LIQUIDATION.status,'TESTING');
});

test('source expiry fails visibly and invalid feature status fails validation',()=>{
  assert.equal(validateProgressSource(source,{now:Date.parse('2026-10-12T00:00:00Z')}).sourceStale,true);
  const invalid=structuredClone(source);invalid.features.ORDER.status='PASS';
  assert.deepEqual(validateProgressSource(invalid).errors,['STATUS_INVALID:ORDER']);
});

test('player view derives available, building and blocked groups without a parallel owner',()=>{
  const groups=classifyPlayerSections(source);
  assert.ok(groups.available.some(item=>item.key==='WORLD_MOVEMENT'));
  assert.ok(groups.building.some(item=>item.key==='CARGO'));
  assert.ok(groups.blocked.some(item=>item.key==='WALLET'));
  assert.match(runtime,/MARKET_ORIGIN_WALLET_LAYOUT_RUNTIME/);
  assert.doesNotMatch(runtime,/rail\.prepend\(button\)/);
  assert.match(utilityOwner,/function ensureProgressUtility\(/);
  assert.match(utilityOwner,/k11520ProgressButton/);
  assert.match(utilityOwner,/utilitySelectors=.*'#k11520ProgressButton'/);
  assert.match(runtime,/setAttribute\('role','dialog'\)/);
  assert.match(runtime,/event\.key!=='Escape'/);
  assert.match(bootstrap,/install11520ProductProgressBoard/);
});
