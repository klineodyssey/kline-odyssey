import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {createWalletSession, KGEN_TOKEN_ADDRESS, readK11520WithdrawalReceipt, readK11520TradingReceipt} from '../K線西遊記/temples/11520/runtime/evm-wallet-runtime.mjs';
import {classify11520OrderRoute} from '../K線西遊記/temples/11520/runtime/real-trading-preflight-ui.mjs';

function withdrawalFixture({taxed = false} = {}) {
  const {utils} = createRequire(import.meta.url)('../assets/ethers-5.7.2.umd.min.js');
  const brain = '0x' + '11'.repeat(20), implementation = '0x' + '22'.repeat(20);
  const wallet = '0x' + '33'.repeat(20), feeWallet = '0x' + '44'.repeat(20);
  const txHash = utils.id('withdrawal fixture'), blockHash = utils.id('receipt block fixture');
  const manifest = {documentType: 'K11520_MAINNET_DEPLOYMENT_MANIFEST', CHAIN_ID: 56,
    status: 'DEPLOYED_CONFIG_VERIFIED', KGEN_TOKEN: KGEN_TOKEN_ADDRESS,
    BRAIN_PROXY: brain, BRAIN_IMPLEMENTATION: implementation,
    codeHashes: {brainProxy: utils.id('proxy code'), brainImplementation: utils.id('brain code'), kgenToken: utils.id('token code')}};
  const brainAbi = new utils.Interface(['function withdrawMargin(uint256)', 'function kgen() view returns(address)',
    'event MarginWithdrawn(address indexed user,uint256 amountWei)']);
  const tokenAbi = new utils.Interface(['event Transfer(address indexed from,address indexed to,uint256 value)']);
  const tx = {hash: txHash, blockHash, blockNumber: '0x20', transactionIndex: '0x0', from: wallet,
    to: brain, chainId: '0x38', value: '0x0', input: brainAbi.encodeFunctionData('withdrawMargin', [1000])};
  const receipt = {transactionHash: txHash, blockHash, blockNumber: '0x20', transactionIndex: '0x0',
    from: wallet, to: brain, status: '0x1', logs: []};
  function addEvent(address, abi, name, args) {
    const event = abi.encodeEventLog(abi.getEvent(name), args);
    receipt.logs.push({address, ...event, removed: false, blockHash, blockNumber: tx.blockNumber,
      transactionHash: txHash, transactionIndex: tx.transactionIndex, logIndex: '0x' + receipt.logs.length.toString(16)});
  }
  addEvent(KGEN_TOKEN_ADDRESS, tokenAbi, 'Transfer', [brain, wallet, taxed ? 997 : 1000]);
  if (taxed) addEvent(KGEN_TOKEN_ADDRESS, tokenAbi, 'Transfer', [brain, feeWallet, 3]);
  addEvent(brain, brainAbi, 'MarginWithdrawn', [wallet, 1000]);
  const block = {hash: blockHash, number: tx.blockNumber, transactions: [txHash]};
  const proofHashes = new Map([[brain,manifest.codeHashes.brainProxy],[implementation,manifest.codeHashes.brainImplementation],
    [KGEN_TOKEN_ADDRESS,manifest.codeHashes.kgenToken]]);
  const replies = {
    eth_chainId: () => '0x38', eth_accounts: () => [wallet],
    eth_getTransactionByHash: ([hash]) => { assert.equal(hash, txHash); return tx; },
    eth_getTransactionReceipt: ([hash]) => { assert.equal(hash, txHash); return receipt; },
    eth_getBlockByNumber: params => { assert.deepEqual(params, ['0x20',false]); return block; },
    eth_getStorageAt: ([address,slot,tag]) => {
      assert.equal(address, brain); assert.equal(tag, '0x20');
      assert.equal(slot, '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc');
      return utils.hexZeroPad(implementation, 32);
    },
    eth_call: ([call,tag]) => {
      assert.deepEqual(call, {to: brain, data: brainAbi.getSighash('kgen')}); assert.equal(tag, '0x20');
      return utils.hexZeroPad(KGEN_TOKEN_ADDRESS, 32);
    },
    eth_getProof: ([address,slots,tag]) => {
      assert.deepEqual(slots, []); assert.equal(tag, '0x20'); assert.ok(proofHashes.has(address));
      return {address, codeHash: proofHashes.get(address)};
    },
  };
  const calls = [];
  const input = {manifest, account: wallet, txHash};
  function read(overrides = {}) {
    const provider = {request: async ({method, params}) => {
      calls.push(method); assert.ok(Object.hasOwn(replies, method), 'unexpected RPC method ' + method);
      return replies[method](params);
    }};
    return readK11520WithdrawalReceipt({...input, provider, ...overrides});
  }
  return {read, replies, calls, tx, receipt, block, manifest, wallet, brain, feeWallet};
}

test('BSC56 KGEN withdrawal reads gross and taxed or untaxed wallet credit from the same canonical transaction', async () => {
  for (const taxed of [false, true]) {
    const f = withdrawalFixture({taxed});
    const first = await f.read({amountWei: '1000'});
    assert.equal(first.status, 'CREDIT_CONFIRMED'); assert.equal(first.ok, true);
    assert.equal(first.requestedWei, '1000'); assert.equal(first.receivedWei, taxed ? '997' : '1000');
    assert.equal(first.feeWei, taxed ? '3' : '0'); assert.equal(first.account, f.wallet);
    assert.equal(first.blockHash, f.block.hash); assert.equal(first.brainAddress, f.brain);
    assert.deepEqual(await f.read(), first, 'a newly opened reader returns the original tx receipt without local state');
  }
});

test('BSC56 withdrawal distinguishes a pending transaction, revert, disconnect and canonical block replacement', async () => {
  const pending = withdrawalFixture();
  Object.assign(pending.tx, {blockHash: null, blockNumber: null, transactionIndex: null});
  pending.replies.eth_getTransactionReceipt = () => null;
  assert.equal((await pending.read()).status, 'PENDING');
  pending.replies.eth_getTransactionByHash = () => null;
  assert.equal((await pending.read()).status, 'UNKNOWN');
  const f = withdrawalFixture();
  f.receipt.status = '0x0';
  assert.equal((await f.read()).status, 'REVERTED');
  f.receipt.status = '0x1';
  const original = f.replies.eth_getTransactionReceipt;
  f.replies.eth_getTransactionReceipt = () => {throw new Error('fixture offline');};
  assert.equal((await f.read()).status, 'UNKNOWN');
  f.replies.eth_getTransactionReceipt = original;
  assert.equal((await f.read()).status, 'CREDIT_CONFIRMED');
  let count = 0;
  f.replies.eth_getBlockByNumber = () => ++count === 1 ? f.block : {...f.block, transactions: []};
  assert.equal((await f.read()).reason, 'CANONICAL_BLOCK_UNCONFIRMED');
  assert.ok(!f.calls.some(method => /sign|send|requestAccounts/i.test(method)));
});

test('BSC56 withdrawal requires the official deployment and the original caller, calldata and amount', async () => {
  const original = JSON.parse(await readFile(new URL('../docs/K11520_MAINNET_DEPLOYMENT_MANIFEST.json', import.meta.url), 'utf8'));
  const f = withdrawalFixture();
  assert.equal((await f.read({manifest: {...original, status: 'BLOCKED_NOT_EXECUTABLE', BRAIN_PROXY: null}})).status, 'BINDING_UNAVAILABLE');
  assert.equal((await f.read({manifest: {...f.manifest, codeHashes: {}}})).status, 'BINDING_UNAVAILABLE');
  assert.equal(f.calls.length, 0);
  f.replies.eth_chainId = () => '0x61';
  assert.equal((await f.read()).status, 'WRONG_CHAIN');
  f.replies.eth_chainId = () => '0x38';
  f.replies.eth_accounts = () => [f.feeWallet, f.wallet];
  assert.equal((await f.read()).status, 'ACCOUNT_MISMATCH');
  let accountReads = 0;
  f.replies.eth_accounts = () => [++accountReads === 1 ? f.wallet : f.feeWallet];
  assert.equal((await f.read()).status, 'ACCOUNT_MISMATCH');
  f.replies.eth_accounts = () => [f.wallet];
  assert.equal((await f.read({amountWei: '1001'})).reason, 'WITHDRAWAL_AMOUNT');
  const originalTx = {...f.tx};
  delete f.tx.chainId;
  assert.equal((await f.read()).status, 'UNKNOWN');
  f.tx.v = '0x93'; // 35 + 2 * chainId + parity
  assert.equal((await f.read()).status, 'CREDIT_CONFIRMED');
  for (const change of [{from: f.feeWallet}, {to: f.feeWallet}, {input: f.tx.input + '00'}, {value: '0x1'}, {chainId: '0x61'}]) {
    Object.assign(f.tx, originalTx, change);
    assert.equal((await f.read()).reason, 'TRANSACTION_TERMS');
  }
  Object.assign(f.tx, originalTx);
  const getStorage = f.replies.eth_getStorageAt, getToken = f.replies.eth_call;
  f.replies.eth_getStorageAt = () => '0x' + f.feeWallet.slice(2).padStart(64, '0');
  assert.equal((await f.read()).reason, 'DEPLOYMENT_CODE_OR_ROUTING');
  f.replies.eth_getStorageAt = getStorage;
  f.replies.eth_call = () => '0x' + f.feeWallet.slice(2).padStart(64, '0');
  assert.equal((await f.read()).reason, 'DEPLOYMENT_CODE_OR_ROUTING');
  f.replies.eth_call = getToken;
  f.replies.eth_getProof = ([address]) => ({address, codeHash: '0x' + 'ab'.repeat(32)});
  assert.equal((await f.read()).reason, 'DEPLOYMENT_CODE_OR_ROUTING');
});

test('BSC56 withdrawal excludes unrelated payment, missing or duplicated evidence and mismatched receipts', async () => {
  const cases = [
    f => { f.receipt.logs[0].address = f.feeWallet; },
    f => { f.receipt.logs[0].topics[1] = '0x' + f.feeWallet.slice(2).padStart(64, '0'); },
    f => { f.receipt.logs[0].transactionHash = '0x' + '00'.repeat(32); },
    f => { f.receipt.logs[0].removed = true; },
    f => { f.receipt.logs[1].data = '0x' + '0'.repeat(64); },
    f => { f.receipt.logs[1].topics[2] = f.receipt.logs[0].topics[2]; },
    f => { f.receipt.logs[2].address = f.feeWallet; },
    f => { f.receipt.logs[2].topics[1] = f.receipt.logs[1].topics[2]; },
    f => { f.receipt.logs[2].data = '0x' + '1'.padStart(64,'0'); },
    f => { f.receipt.logs.push({...f.receipt.logs[2], logIndex: '0x3'}); },
    f => { f.receipt.from = f.feeWallet; },
    f => { f.receipt.to = f.feeWallet; },
    f => { f.receipt.blockHash = '0x' + '12'.repeat(32); },
  ];
  for (const change of cases) {
    const f = withdrawalFixture({taxed: true}); change(f);
    const result = await f.read();
    assert.equal(result.status, 'EVIDENCE_MISMATCH');
    assert.equal(result.receivedWei, undefined);
  }
});

test('BSC56 withdrawal session pins the connected provider and discards an in-flight result on disconnect', async () => {
  const f = withdrawalFixture();
  const baseCall = f.replies.eth_call;
  const zero = '0x' + '0'.repeat(64);
  const requests = [];
  const session = createWalletSession({ethereum: {request({method, params}) {
    requests.push(method);
    if (method === 'eth_getBalance') return Promise.resolve('0x0');
    if (method === 'eth_call' && params[0].to === KGEN_TOKEN_ADDRESS) return Promise.resolve(zero);
    return Promise.resolve(f.replies[method](params));
  }}});
  const input = {manifest: f.manifest, txHash: f.tx.hash, account: f.feeWallet,
    provider: {request() {throw new Error('wrong provider');}}};
  assert.equal((await session.readWithdrawalReceipt(input)).reason, 'WALLET_NOT_CONNECTED');
  assert.equal(requests.length, 0);
  assert.equal((await session.refresh()).status, 'CONNECTED');
  assert.equal((await session.readWithdrawalReceipt(input)).account, f.wallet);
  let entered, resolve;
  const started = new Promise(ok => {entered = ok;});
  f.replies.eth_call = args => new Promise(ok => {resolve = () => ok(baseCall(args)); entered();});
  const pending = session.readWithdrawalReceipt(input);
  await started;
  session.disconnect();
  resolve();
  const result = await pending;
  assert.equal(result.status, 'UNKNOWN');
  assert.equal(result.reason, 'WALLET_SESSION_CHANGED');
  assert.equal(result.receivedWei, undefined);
  assert.ok(!requests.some(method => /sign|send|requestAccounts/i.test(method)));
  session.dispose();
});

function tradingReceiptFixture({liquidation = false, paid = null, short = false} = {}) {
  const {utils} = createRequire(import.meta.url)('../assets/ethers-5.7.2.umd.min.js');
  const {wallet, manifest, brain} = withdrawalFixture();
  const trigger = '0x' + '50'.repeat(20), position = '0x' + '51'.repeat(20), keeper = '0x' + '52'.repeat(20);
  Object.assign(manifest, {ORDER_TRIGGER_ENGINE: trigger, POSITION_ENGINE: position});
  Object.assign(manifest.codeHashes, {positionEngine: utils.id('position bytecode'), orderTriggerEngine: utils.id('trigger bytecode')});
  const abi = new utils.Interface([
    'function createOrder(uint8,int256,uint256,uint256)', 'function observeOrder(uint256)',
    'function closePosition(uint256)', 'function observePosition(uint256)',
    'function kgen() view returns(address)', 'function keeper() view returns(address)',
    'function brain() view returns(address)', 'function engine() view returns(address)',
    'function executor() view returns(address)', 'function brainSettlement() view returns(address)',
    'event OrderCreated(uint256 indexed id,address indexed trader)',
    'event OrderFilled(uint256 indexed id,uint256 indexed positionId,uint256 price)',
    'event PositionOpened(uint256 indexed id,address indexed trader,uint8 indexed market,int256 size,uint256 collateral,uint256 entry,bytes32 key)',
    'event PositionClosed(uint256 indexed id,uint256 exit,int256 raw,int256 realized,uint256 debt)',
    'event PositionLiquidated(uint256 indexed id,uint256 exit,int256 raw,int256 realized,uint256 debt)',
    'event PositionCollateralSettled(bytes32 indexed key,address indexed trader,uint256 locked,int256 realized,uint256 debt,uint256 insurance,uint256 principalAfter)',
    'event SettlementClaimRecorded(bytes32 indexed key,address indexed trader,uint256 due,uint256 paid,uint256 remaining)',
    'event OrderTerminated(uint256 indexed id,uint8 status)',
    'function cancelOrder(uint256)', 'function rejectUnfundedOrder(uint256)',
  ]);
  const id = 2n ** 150n + 1n, pid = id + 57n, wad = 10n ** 18n;
  const c = short ? -wad : wad;
  const positionKey = utils.solidityKeccak256(['address','uint256'], [position, pid]);
  const transactions = [], receipts = [], blocks = new Map();
  const rpcHex = number => '0x' + number.toString(16);
  function addStage(height, from, method, args, events) {
    const blockNumber = rpcHex(height), blockHash = utils.id('block' + height), hash = utils.id(method);
    const tx = {hash, blockHash, blockNumber, transactionIndex:'0x0', from, to:trigger, chainId:'0x38', value:'0x0',
      input:abi.encodeFunctionData(method, args)};
    const receipt = {...tx, transactionHash:hash, status:'0x1', logs:events.map(([address,name,values],index) => ({
      ...abi.encodeEventLog(abi.getEvent(name), values), address, blockHash, blockNumber,
      transactionHash:hash, transactionIndex:'0x0', logIndex:rpcHex(index), removed:false,
    }))};
    transactions.push(tx); receipts.push(receipt); blocks.set(blockNumber, {number:blockNumber, hash:blockHash, transactions:[hash]});
  }
  addStage(32,wallet,'createOrder',[0,c,2n,75000n * wad],[[trigger,'OrderCreated',[id,wallet]]]);
  addStage(33,keeper,'observeOrder',[id],[
    [position,'PositionOpened',[pid,wallet,0,2n*c/75000n,2n*wad,75000n*wad,positionKey]],
    [trigger,'OrderFilled',[id,pid,75000n*wad]],
  ]);
  const pnl = (liquidation ? -2n : 2n) * wad, exit = 75000n*wad + (liquidation ? -15000n : 10000n)*c;
  const raw = liquidation ? -3n * wad : pnl, debt = liquidation ? wad : 0n;
  addStage(34,liquidation ? keeper : wallet,liquidation ? 'observePosition' : 'closePosition',[pid],[
    ...(paid===null?[]:[[brain,'SettlementClaimRecorded',[positionKey,wallet,pnl,paid,pnl-paid]]]),
    [brain,'PositionCollateralSettled',[positionKey,wallet,2n*wad,pnl,debt,debt,10n*wad+(paid??pnl)]],
    [position,liquidation ? 'PositionLiquidated' : 'PositionClosed',[pid,exit,raw,pnl,debt]],
  ]);
  const code = new Map([[KGEN_TOKEN_ADDRESS,manifest.codeHashes.kgenToken],[brain,manifest.codeHashes.brainProxy],
    [manifest.BRAIN_IMPLEMENTATION, manifest.codeHashes.brainImplementation],[position,manifest.codeHashes.positionEngine],
    [trigger,manifest.codeHashes.orderTriggerEngine]]);
  const routes = {kgen: [brain,KGEN_TOKEN_ADDRESS], engine:[trigger,position], brain:[trigger,brain],
    executor:[position,trigger], brainSettlement:[position,brain], keeper:[trigger,keeper]};
  const selectors = new Map(Object.entries(routes).map(([name, pair]) => [abi.getSighash(name),pair]));
  let height = 34n;
  const calls = [];
  const rpc = {
    eth_chainId: () => '0x38', eth_accounts: () => [wallet], eth_getBalance: ()=>'0x0',
    eth_getTransactionByHash: ([hash]) => transactions.find(tx=>tx.hash===hash)??null,
    eth_getTransactionReceipt: ([hash]) => receipts.find(r=>r.transactionHash===hash)??null,
    eth_getBlockByNumber: ([n]) => {
      const number = n === 'latest' ? rpcHex(height) : n;
      if (BigInt(number) > height) return null;
      return blocks.get(number) ?? {number, hash:utils.id('block'+BigInt(number)), transactions:[]};
    },
    eth_getStorageAt: ([a,,n]) => {assert.equal(a,brain);assert.ok(blocks.has(n)); return utils.hexZeroPad(manifest.BRAIN_IMPLEMENTATION,32);},
    eth_call: ([call,n]) => {
      if(call.to===KGEN_TOKEN_ADDRESS && n==='latest') return utils.hexZeroPad('0x00',32);
      const method=call.data.slice(0,10);
      if(method==='0x21603f43'||method==='0xa227aebb'){
        const isOrder=method==='0x21603f43';
        assert.equal(call.to,isOrder?trigger:position);assert.equal(BigInt('0x'+call.data.slice(10)),isOrder?id:pid);
        const words=Array(isOrder?15:12).fill(0n);
        words[isOrder?1:0]=BigInt(wallet);
        if(isOrder){words[0]=id;words[3]=BigInt.asUintN(256,c);words[4]=2n;words[5]=75000n*wad;}
        words[11]=BigInt(n)<BigInt(transactions[isOrder?1:2].blockNumber)?1n:2n;
        return utils.defaultAbiCoder.encode(words.map(()=>'uint256'),words);
      }
      const [from,result]=selectors.get(call.data);assert.equal(call.to,from);assert.ok(blocks.has(n));return utils.hexZeroPad(result,32);
    },
    eth_getProof: ([address,,n]) => {assert.ok(blocks.has(n)); return {address,codeHash:code.get(address)};},
    eth_getLogs: ([filter]) => receipts.flatMap(r=>r.logs).filter(log=>log.address===filter.address &&
      filter.topics[0].includes(log.topics[0]) && log.topics[1]===filter.topics[1] &&
      BigInt(log.blockNumber)>=BigInt(filter.fromBlock) && BigInt(log.blockNumber)<=BigInt(filter.toBlock)),
  };
  const provider = {request: async({method,params})=>{calls.push(method);assert.ok(Object.hasOwn(rpc,method),method);return rpc[method](params);}};
  const read = (overrides={})=>readK11520TradingReceipt({provider,manifest,account:wallet,txHash:transactions[0].hash,...overrides});
  return {rpc, provider, read, transactions, receipts, blocks, calls, id, pid, wallet, manifest, abi,
    terminate(cancel) {
      transactions.splice(1);receipts.splice(1);blocks.delete('0x21');blocks.delete('0x22');
      addStage(33,cancel?wallet:keeper,cancel?'cancelOrder':'rejectUnfundedOrder',[id],
        [[trigger,'OrderTerminated',[id,cancel?3:4]]]);
      height=33n;
    },
    moveStage(index, height) {
      const tx=transactions[index], receipt=receipts[index], number=rpcHex(BigInt(height)), hash=utils.id('block'+height);
      blocks.delete(tx.blockNumber);
      for(const record of [tx,receipt,...receipt.logs])Object.assign(record,{blockNumber:number,blockHash:hash});
      blocks.set(number,{number,hash,transactions:[tx.hash]});
    },
    setHeight(n) {
      height=BigInt(n); const number=rpcHex(height);
      if(!blocks.has(number))blocks.set(number,{number,hash:utils.id('block'+n),transactions:[]});
    }};
}

test('BSC56 trading receipt follows the original order hash through a keeper fill and the linked Brain settlement', async()=>{
  for(const liquidation of [false,true])for(const short of [false,true]){
    const f=tradingReceiptFixture({liquidation,short});
    f.setHeight(32); const pending=await f.read();
    assert.equal(pending.status,'ORDER_CREATED');assert.equal(pending.orderId,f.id.toString());
    f.setHeight(33);const fill=await f.read();
    assert.equal(fill.status,'ORDER_FILLED');assert.equal(fill.positionId,f.pid.toString());
    f.setHeight(34);
    const result=await f.read();
    assert.equal(result.status,liquidation?'POSITION_LIQUIDATED':'POSITION_CLOSED');
    assert.equal(result.cWad,(short?-(10n**18n):10n**18n).toString());
    assert.equal(result.creationTxHash,f.transactions[0].hash);assert.equal(result.fillTxHash,f.transactions[1].hash);
    assert.equal(result.closeTxHash,f.transactions[2].hash);
    assert.equal(result.realizedPnlWei,(liquidation?-2n*10n**18n:2n*10n**18n).toString());
    assert.equal(result.principalAfterWei,(liquidation?8n*10n**18n:12n*10n**18n).toString());
    assert.equal(result.balanceScope,'BRAIN_PRINCIPAL_ONLY_NO_WALLET_TRANSFER_EVIDENCE');
    assert.equal(result.claimStatus,liquidation?'NO_PROFIT_CLAIM':'CLAIM_EVENT_UNAVAILABLE');
    assert.equal(result.paidWei,undefined);
    const freshPage=createWalletSession({ethereum:f.provider});
    assert.equal((await freshPage.refresh()).status,'CONNECTED');
    assert.deepEqual(await freshPage.readTradingReceipt({manifest:f.manifest,txHash:result.txHash}),result);
    freshPage.dispose();
    assert.ok(!f.calls.some(method=>/send|sign|requestAccounts/i.test(method)));
  }
});

test('BSC56 trading receipt distinguishes custody profit paid at close from outstanding profit without inferring a wallet credit', async()=>{
  const due=2n*10n**18n;
  for(const paid of [0n,due/2n,due]){
    const f=tradingReceiptFixture({paid}), settled=await f.read();
    assert.equal(settled.status,'POSITION_CLOSED');assert.equal(settled.claimStatus,'VERIFIED_AT_CLOSE');
    assert.equal(settled.dueWei,due.toString());assert.equal(settled.paidWei,paid.toString());
    assert.equal(settled.remainingClaimWei,(due-paid).toString());
    assert.equal(settled.principalAfterWei,(10n*10n**18n+paid).toString());
    assert.equal(settled.receivedWei,undefined);
    const claim=f.receipts[2].logs[0];claim.topics[2]=claim.topics[1];
    assert.equal((await f.read()).reason,'PROFIT_CLAIM_MISMATCH');
  }
});

test('BSC56 trading receipt verifies direct holder cancellation and keeper rejection without a fill', async()=>{
  for(const cancel of [true,false]){
    const f=tradingReceiptFixture();f.terminate(cancel);const ended=await f.read();
    assert.equal(ended.status,cancel?'ORDER_CANCELLED':'ORDER_REJECTED');
    assert.equal(ended.terminationTxHash,f.transactions[1].hash);assert.equal(ended.fillTxHash,undefined);
  }
});

test('BSC56 trading receipt rejects mismatched keeper, trader, order, position, event data and deployment routing', async()=>{
  const cases=[
    f=>{f.transactions[0].from=f.manifest.BRAIN_PROXY;},
    f=>{f.receipts[0].logs[0].topics[2]=f.receipts[0].logs[0].topics[1];},
    f=>{f.transactions[1].from=f.wallet;f.receipts[1].from=f.wallet;},
    f=>{f.transactions[1].input=f.abi.encodeFunctionData('observeOrder',[f.id+1n]);},
    f=>{f.receipts[1].logs[0].topics[1]=f.receipts[0].logs[0].topics[1];},
    f=>{f.transactions[2].input=f.abi.encodeFunctionData('closePosition',[f.pid+1n]);},
    f=>{f.receipts[2].logs[0].topics[2]=f.receipts[0].logs[0].topics[1];},
    f=>{f.receipts[2].logs[0].data='0x'+'00'.repeat(160);},
    f=>{f.receipts[2].logs[1].removed=true;},
    f=>{const lookup=f.rpc.eth_getLogs;f.rpc.eth_getLogs=params=>lookup(params).map(log=>({...log,logIndex:'0xff'}));},
    f=>{const read=f.rpc.eth_call;f.rpc.eth_call=params=>params[0].data===f.abi.getSighash('engine')?'0x'+'00'.repeat(32):read(params);},
  ];
  for(const alter of cases){const f=tradingReceiptFixture();alter(f);const result=await f.read();assert.equal(result.status,'UNKNOWN');assert.equal(result.principalAfterWei,undefined);}
});

test('BSC56 trading receipt holds partial evidence across outages, incomplete log windows and canonical reorgs', async()=>{
  const f=tradingReceiptFixture();const logs=f.rpc.eth_getLogs;
  f.rpc.eth_getLogs=params=>{if(params[0].address===f.manifest.POSITION_ENGINE)throw new Error('source disconnected');return logs(params);};
  const offline=await f.read();assert.equal(offline.status,'UNKNOWN');assert.equal(offline.lastKnown.status,'ORDER_FILLED');
  f.rpc.eth_getLogs=logs;assert.equal((await f.read()).status,'POSITION_CLOSED');
  f.setHeight(5000);let queries=0;f.rpc.eth_getLogs=([filter])=>{
    assert.ok(BigInt(filter.toBlock)-BigInt(filter.fromBlock)<512n);queries++;return [];
  };
  const limit=await f.read();assert.equal(limit.reason,'SEARCH_WINDOW_INCOMPLETE');assert.equal(limit.lastKnown.status,'ORDER_CREATED');assert.equal(queries,8);
  const byNumber=f.rpc.eth_getBlockByNumber;f.rpc.eth_getBlockByNumber=params=>{
    const actual=byNumber(params);return params[0]==='0x1388'?{...actual,hash:f.transactions[0].hash}:actual;
  };
  const reorg=await f.read();assert.equal(reorg.reason,'CANONICAL_BLOCK_UNCONFIRMED');assert.equal(reorg.lastKnown,undefined);
  const wrong=tradingReceiptFixture();wrong.rpc.eth_chainId=()=> '0x61';
  assert.equal((await wrong.read()).status,'WRONG_CHAIN');
  const noBinding=tradingReceiptFixture();delete noBinding.manifest.ORDER_TRIGGER_ENGINE;
  assert.equal((await noBinding.read()).status,'BINDING_UNAVAILABLE');assert.deepEqual(noBinding.calls,[]);
});

test('BSC56 trading receipt resumes across two bounded windows and distrusts skipped history and changed cursor blocks', async()=>{
  const f=tradingReceiptFixture();f.moveStage(1,4500);f.moveStage(2,9500);f.setHeight(9600);
  const first=await f.read();
  assert.equal(first.reason,'SEARCH_WINDOW_INCOMPLETE');assert.equal(first.nextCursor.phase,'ORDER');
  const second=await f.read({cursor:JSON.parse(JSON.stringify(first.nextCursor))});
  assert.equal(second.reason,'SEARCH_WINDOW_INCOMPLETE');assert.equal(second.lastKnown.status,'ORDER_FILLED');
  assert.equal(second.nextCursor.phase,'POSITION');
  const final=await f.read({cursor:JSON.parse(JSON.stringify(second.nextCursor))});
  assert.equal(final.status,'POSITION_CLOSED');assert.equal(final.positionId,f.pid.toString());
  assert.equal((await f.read({cursor:{...first.nextCursor,throughBlockHash:f.transactions[2].hash}})).reason,'CURSOR_BLOCK_CHANGED');
  const afterFill=f.blocks.get(f.transactions[1].blockNumber);
  const forged={...first.nextCursor,throughBlock:afterFill.number,throughBlockHash:afterFill.hash};
  assert.equal((await f.read({cursor:forged})).reason,'OPEN_STATE_NOT_CONFIRMED');
  const afterClose=f.blocks.get(f.transactions[2].blockNumber);
  assert.equal((await f.read({cursor:{...second.nextCursor,throughBlock:afterClose.number,throughBlockHash:afterClose.hash}})).reason,'OPEN_STATE_NOT_CONFIRMED');
  assert.equal((await f.read({cursor:{...second.nextCursor,fillTxHash:f.transactions[2].hash}})).status,'UNKNOWN');
});

test('slow order preview is not starved by polling and newer input invalidates stale results',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/game-5d-main.mjs',import.meta.url),'utf8');
 const fn=source.slice(source.indexOf('async function paintOrderPreview('),source.indexOf('\nfunction openOrder('));
 const button={disabled:false},panel={textContent:''},resolvers=[];
 const context=vm.createContext({pending:{axis:'KY',market:'ETHUSDT'},executionBusy:false,previewSequence:0,previewRequests:0,reviewedOrder:null,execution:{preview:()=>new Promise(resolve=>resolvers.push(resolve))},orderInput:()=>({}),$:id=>id==='#confirmOrder'?button:panel});
 vm.runInContext(fn,context);const first=context.paintOrderPreview();
 for(let i=0;i<10;i++)await context.paintOrderPreview({background:true});
 assert.equal(resolvers.length,1,'background polling must not supersede in-flight preview');
 const newer=context.paintOrderPreview();assert.equal(resolvers.length,2,'changed input still requests a fresh preview');
 resolvers[0]({ok:false,code:'OLD',reason:'old'});await first;assert.equal(panel.textContent,'');
 resolvers[1]({ok:false,code:'NEW',reason:'latest input'});await newer;assert.match(panel.textContent,/latest input/);assert.equal(context.previewRequests,0);
 const disconnected=context.paintOrderPreview();context.pending=null;resolvers[2]({ok:true});await disconnected;assert.equal(button.disabled,true,'closed or disconnected preview cannot re-enable confirm');
});

test('direction changes review the signed draft again and confirmation submits only the visible terms',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/game-5d-main.mjs',import.meta.url),'utf8');
 const functions=source.slice(source.indexOf('async function paintOrderPreview('),source.indexOf('\nfunction openOrder('));
 const handler=source.slice(source.indexOf("$('#cancelOrder').onclick="),source.indexOf('\nasync function closePos('));
 const nodes={
  '#confirmOrder':{disabled:true,textContent:''},
  '#simulationOrderPreview':{innerHTML:''},
  '#cancelOrder':{},'#confirmX':{},'#confirm':{classList:{remove(){}}}
 };
 const directionButtons=['LONG','SHORT'].map(orderSide=>({dataset:{orderSide},setAttribute(name,value){this[name]=value}}));
 const previews=[],submits=[];
 const adapter={preview(input){return new Promise(resolve=>previews.push({input,resolve}))},submit(input){submits.push(input);return {ok:true}}};
 let trigger=4001;
 const context=vm.createContext({
  pending:{axis:'KY',market:'ETHUSDT',c:2,lots:3},execution:adapter,executionBusy:false,previewSequence:0,previewRequests:0,reviewedOrder:null,
  $:id=>nodes[id],$$:()=>directionButtons,isTestnet:()=>false,C_PNL_MODEL:'ENTRY_FLOOR',
  orderInput:()=>({...context.pending,triggerPrice:trigger}),receiptRows:rows=>JSON.stringify(rows),receiptTime:()=> '--',fmt:String,
  executionAction:async action=>action(),productEvent(){},openOrgan(){},renderAxes(){},hud(){},toast(){},executionLabel:()=> 'SIMULATION'
 });
 vm.runInContext(functions+'\n'+handler,context);
 const before=context.paintOrderPreview();
 const selected=context.selectOrderDirection('SHORT');
 assert.deepEqual(directionButtons.map(b=>b['aria-pressed']),['false','true']);
 assert.equal(nodes['#confirmOrder'].textContent,'確認做空（模擬）');
 assert.equal(previews[1].input.c,-2);
 assert.equal(previews[1].input.lots,3);
 previews[0].resolve({ok:false,code:'STALE_LONG',reason:'old'});
 await before;
 await nodes['#confirmOrder'].onclick();
 assert.equal(submits.length,0,'a new choice must finish its own preview before submit');
 previews[1].resolve({ok:true,side:'SHORT',leverage:2,pnlModel:'ENTRY_FLOOR',...previews[1].input});
 await selected;
 assert.match(nodes['#simulationOrderPreview'].innerHTML,/SHORT/);
 assert.equal(nodes['#confirmOrder'].disabled,false);
 trigger=4002;
 const newReview=nodes['#confirmOrder'].onclick();
 assert.equal(submits.length,0,'a changed trigger requires a new visible review');
 const changedPreview=previews[2];
 changedPreview.resolve({ok:true,side:'SHORT',leverage:2,pnlModel:'ENTRY_FLOOR',...changedPreview.input});
 await newReview;
 const confirm=nodes['#confirmOrder'].onclick();
 await nodes['#confirmOrder'].onclick();
 await confirm;
 assert.equal(submits.length,1);
 assert.equal(submits[0].c,-2);
 assert.equal(submits[0].triggerPrice,4002,'confirmation uses the newly reviewed trigger');
 assert.equal(context.pending,null);
});

test('public browser QA fails closed on legacy manifest before touching signer and retains bounded candidate writes',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/tests/11520-browser-settlement.mjs',import.meta.url),'utf8');
 const publicSource=source.slice(source.indexOf('async function publicTestnetBrowserQA(){'));
 assert.ok(publicSource.indexOf("assert.equal(manifest.pnlModel,'INDEX_DELTA_C_LOTS_V1'")<publicSource.indexOf('process.env.BSC_TESTNET_PRIVATE_KEY'));
 assert.ok(publicSource.indexOf("assert.equal(manifest.capabilities?.settlementCapital,'ISOLATED_V1'")<publicSource.indexOf('process.env.BSC_TESTNET_PRIVATE_KEY'));
 assert.match(publicSource,/docs\/K11520_BSC_TESTNET_DEPLOYMENT_MANIFEST\.json/);
 assert.match(publicSource,/budget=parseEther\('0\.005'\)/);assert.match(publicSource,/value:0n,chainId:97/);
 assert.match(publicSource,/WITHDRAW_TEST_AMOUNT_CAP/);assert.match(publicSource,/DEPOSIT_TEST_AMOUNT_CAP/);
 assert.match(publicSource,/wallet\.allowanceWei\)<parseEther\('100'\)/);
 assert.match(publicSource,/candidate raw PnL is delta index times100C times100lots/);
 assert.match(publicSource,/readOnly\?null:new Wallet/,'diagnostic mode does not construct a signer');
 assert.match(publicSource,/assert\.equal\(readOnly,false,'read-only QA cannot broadcast'\)/);
 assert.match(publicSource,/assert\.equal\(BigInt\(await logProvider\.send\('eth_chainId',\[\]\)\),97n\)/);
 assert.match(publicSource,/if\(method==='eth_getLogs'\).*logProvider\.send\(method,params\)/,'optional index serves only logs, never transactions');
});

test('selected Testnet route reports Testnet without activating Mainnet or claiming a receipt',()=>{
 const preflight={ready:false,blockers:['HUMAN_MAINNET_EXECUTION_AUTHORIZATION_REQUIRED']};
 const testnet=classify11520OrderRoute({preflight,execution:{mode:'BSC_TESTNET',chainId:97,status:'READY'}});
 assert.equal(testnet.route,'TESTNET_EXPLICIT_WALLET_ACTION');assert.equal(testnet.broadcast,false);assert.equal(testnet.signerRequested,false);
 assert.match(testnet.label,/NO REAL VALUE/);
 assert.equal(classify11520OrderRoute({preflight,execution:{mode:'ON_CHAIN',chainId:56}}).route,'LOCAL_SIMULATION_REAL_BLOCKED');
 assert.equal(classify11520OrderRoute({preflight,execution:{mode:'BSC_TESTNET',chainId:56}}).route,'LOCAL_SIMULATION_REAL_BLOCKED');
});

test('deferred Testnet routing observer preserves execution errors and receipt feedback',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/real-trading-preflight-ui.mjs',import.meta.url),'utf8');
 const fn=source.slice(source.indexOf('function notifyOrderRoute(){'),source.indexOf('\nexport function install11520RealTradingPreflightUi'));
 for(const status of ['READY','ORACLE_STALE','WRONG_CHAIN','DISCONNECTED']){
  const toast={textContent:'ORACLE_STALE · 行情未就緒',classList:{add(){throw new Error('observer must not replace execution feedback')}}};
  const context=vm.createContext({renderPreflight:()=>({ready:false}),classify11520OrderRoute,$:()=>toast,__K11520_EXECUTION__:{snapshot:()=>({mode:'BSC_TESTNET',chainId:97,status})},setTimeout(){throw new Error('observer must not clear execution feedback')}});
  vm.runInContext(fn,context);const route=context.notifyOrderRoute();
  assert.equal(route.route,'TESTNET_EXPLICIT_WALLET_ACTION');assert.equal(route.status,status);
  assert.equal(context.__K11520_ORDER_ROUTE__.status,status);assert.equal(toast.textContent,'ORACLE_STALE · 行情未就緒');
  assert.equal(route.signerRequested,false);assert.equal(route.broadcast,false);
 }
});

test('a bare ready flag cannot enable an executable mainnet wallet route',()=>{
  const route=classify11520OrderRoute({preflight:{ready:true,blockers:[]},localSimulationAvailable:true});
  assert.equal(route.route,'LOCAL_SIMULATION_REAL_BLOCKED');
  assert.equal(route.signerRequested,false);
  assert.equal(route.broadcast,false);
});

test('keeps existing order flow local while real trading is blocked',()=>{
  const route=classify11520OrderRoute({preflight:{ready:false,blockers:['PRODUCTION_FEED_PROVENANCE_REQUIRED']},localSimulationAvailable:true});
  assert.equal(route.route,'LOCAL_SIMULATION_REAL_BLOCKED');
  assert.equal(route.localSimulationAvailable,true);
  assert.deepEqual(route.blockers,['PRODUCTION_FEED_PROVENANCE_REQUIRED']);
  assert.equal(route.signerRequested,false);
  assert.equal(route.broadcast,false);
});

test('fails closed when no local or real route is available',()=>{
  const route=classify11520OrderRoute({preflight:{ready:false,blockers:['WALLET_PUBLIC_IDENTITY_REQUIRED']},localSimulationAvailable:false});
  assert.equal(route.route,'ORDER_BLOCKED');
  assert.equal(route.broadcast,false);
});

test('M1 wallet view never pairs another account or wrong network with recovered Testnet balances',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/game-5d-main.mjs',import.meta.url),'utf8');
 const fn=source.slice(source.indexOf('function walletExecutionView('),source.indexOf('function renderWallet('));
 const account='0x'+'11'.repeat(20),chain={account,status:'READY',wallet:{testBnbBalance:'0.025',testTokenBalance:100},capital:{settlementCapital:1000},claims:[{remaining:10}]};
 for(const value of [{account:'0x'+'22'.repeat(20),chainId:97},{account,chainId:56},{account:null,chainId:97}]){
  const context=vm.createContext({execution:{snapshot:()=>chain},isTestnet:()=>true,value});vm.runInContext(source.slice(source.indexOf('function isPrincipalExitOnlyView('),source.indexOf('function normalizeTradeSide(')),context);const result=vm.runInContext(fn+';walletExecutionView(value)',context);
  assert.equal(result.wallet,null);assert.equal(result.capital,null);assert.equal(result.claims.length,0);assert.equal(result.orders.length,0);assert.equal(result.positions.length,0);assert.equal(result.receipts.length,0);assert.equal(result.transaction,null);
 }
 const context=vm.createContext({execution:{snapshot:()=>chain},isTestnet:()=>true,value:{account,chainId:97}});
 assert.equal(vm.runInContext(fn+';walletExecutionView(value)',context).wallet.testBnbBalance,'0.025');
 assert.match(source, /TEST BNB · GAS ONLY/);assert.match(source,/testBnbBalance\?\?'UNVERIFIED'/);
});


test('M1 wallet-session READING clears cached financial surfaces before adapter recovery',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/game-5d-main.mjs',import.meta.url),'utf8');
 const start=source.indexOf('walletSession.subscribe(value=>{'),end=source.indexOf('\n});',start);
 assert.ok(start>=0&&end>start);const fn=source.slice(start,end+4);
 const calls=[];let callback;
 const context=vm.createContext({navAutoWalletKey:null,walletSession:{subscribe:fn=>{callback=fn}},execution:{readOnly:true},readOnlyViewRequested:()=>true,playerStore:{activate:()=>false},renderWallet:()=>calls.push('wallet'),isTestnet:()=>true,syncSimulationPositions:()=>calls.push('positions'),refreshSimulationSheet:()=>calls.push('sheet'),refreshTestnet:()=>calls.push('recover')});
 vm.runInContext(fn,context);callback({account:null,status:'READING'});
 assert.deepEqual(calls,['wallet','positions','sheet','recover']);
});

test('limited legacy principal view never turns unknown positions or PnL into empty or zero reports',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/game-5d-main.mjs',import.meta.url),'utf8');
 const view={readOnly:false,readScope:'LEGACY_PRINCIPAL_ONLY',status:'LEGACY_PRINCIPAL_VERIFIED',balanceStatus:'VERIFIED',ordersStatus:'UNKNOWN',positionsStatus:'UNKNOWN',pnlStatus:'UNKNOWN',historyStatus:'INDEXER_REQUIRED',orders:[],positions:[],receipts:[],claims:[],observations:{},wallet:{readScope:'LEGACY_PRINCIPAL_ONLY',principal:10,total:10,free:7,lockedMargin:3,withdrawable:7,unrealizedPnl:null,realizedPnl:null,equity:null,claimable:null}};
 const before=JSON.stringify(view),context=vm.createContext({execution:{readOnly:false,snapshot:()=>view},walletExecutionView:()=>view,isTestnet:()=>true,fmt:(value,d=6)=>Number(value).toFixed(d),playerStore:{snapshot:()=>({playerId:'local',owner:'guest',persistent:true,playedMs:1000,loot:0,kaios:0,claimableKaios:0,kaiosRewardStatus:'LOCAL',events:{}})},playerProgressSnapshot:()=>({level:1,xp:0,engineLevel:1,engineXp:0,nextEngineXp:1}),marketEngineSnapshot:()=>({state:'LOCAL',score:0,engineXp:0,components:[],features:[]})});
 const scope=source.slice(source.indexOf('function isPrincipalExitOnlyView('),source.indexOf('function normalizeTradeSide('));
 const cross=source.slice(source.indexOf('function crossMarketSnapshot('),source.indexOf('function syncSimulationPositions('));
 const organs=source.slice(source.indexOf('const escapeUI='),source.indexOf('function bindSimulationSheet('));
 vm.runInContext(scope+cross+organs,context);
 for(const organ of ['assets','positions','orders','history']){
   const html=context.simulationOrganHTML(organ);assert.match(html,/data-legacy-principal-only/);assert.match(html,/尚待索引/);assert.match(html,/不代表空倉|不能視為空倉/);assert.doesNotMatch(html,/尚無部位|尚無委託|data-sim-close|data-sim-cancel/);
 }
 const crossState=context.crossMarketSnapshot();assert.equal(crossState.status,'UNKNOWN');assert.equal(crossState.openPositions,null);assert.equal(crossState.realizedPnl,null);assert.equal(crossState.unrealizedPnl,null);assert.equal(crossState.free,7);assert.equal(crossState.lockedMargin,3);
 const records=context.simulationOrganHTML('records');assert.match(records,/KGEN 跨市場開倉<\/dt><dd>尚未恢復/);assert.match(records,/KGEN REALIZED PNL<\/dt><dd>尚未恢復/);
 assert.equal(JSON.stringify(view),before,'rendering verified principal cannot mutate financial recovery state');
 view.balanceStatus='UNKNOWN';view.status='LEGACY_PRINCIPAL_RECHECK_REQUIRED';view.deploymentContext='97:legacy';view.transaction={status:'RECEIPT_CONFIRMED',method:'withdrawMargin',txHash:'0x'+'ab'.repeat(32),account:'0x'+'11'.repeat(20),chainId:97,deploymentContext:view.deploymentContext};
 const recheckBefore=JSON.stringify(view),recheck=context.simulationOrganHTML('assets');
 assert.match(recheck,/等待重新核對/);assert.match(recheck,/提款交易已確認/);assert.match(recheck,/提款暫停/);assert.match(recheck,/請勿重送/);assert.match(recheck,/RECEIPT_CONFIRMED/);assert.match(recheck,new RegExp(view.transaction.txHash));assert.match(recheck,/UNVERIFIED/);
 assert.doesNotMatch(recheck,/可用額已核對|本金已核對|7\.000000|10\.000000/);assert.equal(JSON.stringify(view),recheckBefore,'recheck UI must retain confirmed receipt and never mutate the adapter');
 const gate=source.split('\n').find(line=>line.includes("$('#testnetGate').textContent=")),gateNode={};
 context.$=()=>gateNode;context.chain=view;context.testnetGate='TESTNET';vm.runInContext(gate,context);assert.match(gateNode.textContent,/提款交易已確認/);assert.doesNotMatch(gateNode.textContent,/本金已核對/);
 view.account=null;view.wallet=null;context.walletSession={snapshot:()=>({account:view.transaction.account,chainId:97})};
 vm.runInContext(source.slice(source.indexOf('function walletExecutionView('),source.indexOf('function renderWallet(')),context);
 const attributed=context.walletExecutionView();assert.equal(attributed.wallet,null);assert.equal(attributed.account,null);assert.equal(attributed.transaction.txHash,view.transaction.txHash);assert.equal(attributed.balanceStatus,'UNKNOWN');
 assert.match(context.simulationOrganHTML('assets'),/提款交易已確認/,'real identity filter must retain only this wallet’s confirmed receipt');
 for(const identity of [{account:'0x'+'22'.repeat(20),chainId:97},{account:view.transaction.account,chainId:56},{account:null,chainId:97}])assert.equal(context.walletExecutionView(identity).transaction,null,'another wallet or network cannot inherit receipt attribution');
 const originalContext=view.transaction.deploymentContext;view.transaction.deploymentContext='97:another';assert.equal(context.walletExecutionView().transaction,null,'another deployment cannot inherit receipt attribution');view.transaction.deploymentContext=originalContext;
 context.walletExecutionView=()=>view;view.wallet={readScope:'BALANCES_ONLY'};
 view.readScope='BALANCES_ONLY';view.readOnly=true;context.execution.readOnly=true;view.wallet.readScope='BALANCES_ONLY';
 assert.match(context.simulationOrganHTML('positions'),/M1 BALANCES_ONLY/);assert.match(context.simulationOrganHTML('positions'),/NOT_REQUESTED/);
});

test('M1 candidate config is additive and legacy principal exit context is preserved',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../docs/K11520_BSC_TESTNET_DEPLOYMENT_MANIFEST.json',import.meta.url),'utf8'));
 assert.equal(manifest.addresses.brainProxy,'0x60e3801CDf885830ca45Def76a6141f841B0521d');
 assert.equal(manifest.addresses.testToken,'0x91ac96ff5f6B5D63aab0d6F17DF8D70AC295dBc3');
 const candidate=manifest.readOnlyCandidates.wallet1c;
 assert.equal(candidate.addresses.brainProxy,'0x8bb97Ab011b8983963F98aDEd8F8c93A54969667');assert.equal(candidate.viewCapability,'READ_ONLY_M1');assert.equal(candidate.cMax,1);assert.equal(candidate.chainId,97);
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/game-5d-main.mjs',import.meta.url),'utf8');
 const view=source.slice(source.indexOf('async function selectReadOnlyWalletView(){'),source.indexOf('async function refreshTestnet(){'));
 assert.match(view,/readOnly:true/);assert.doesNotMatch(view,/executionPreferenceKey|dispose|localStorage/);
 assert.match(source,/exitOnly:true/);assert.match(source,/legacyExecution\|\|createExecutionAdapter/);
});

test('existing utility owner gives expanded wallet an unobstructed view and restores peers on close',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/market-origin-wallet-layout-runtime.mjs',import.meta.url),'utf8');
 const fn=source.slice(source.indexOf('function syncUtilityMaster(){'),source.indexOf('function walletAnchor(){'));
 let walletClosed=false,hudHidden=false,utilitiesOpen=true;const hiddenPreferences=new Set();
 const nodes={};for(const id of ['walletPanel','walletToggle','dock','aiChatButton','chatHandle','bgmButton','backpackButton','gameModeToggle','k11520HudCollapseAll','kaiosPortalButton','cargoInterceptionButton','homeDeliveryButton'])nodes[id]={id,style:{values:{},setProperty(k,v){this.values[k]=v},removeProperty(k){delete this.values[k]}},classList:{contains:name=>name==='k11520HiddenBySettings'?hiddenPreferences.has(id):id==='walletPanel'&&name==='collapsed'?walletClosed:false},dataset:{},getAttribute:()=>''};
 const toggle={dataset:{},setAttribute(){},textContent:'',title:''},selectors=Object.keys(nodes).filter(k=>!['cargoInterceptionButton','homeDeliveryButton'].includes(k)).map(k=>'#'+k);
 const context=vm.createContext({walletWasOpen:false,put:(el,k,v)=>el.style.setProperty(k,v),installUtilityMaster:()=>toggle,document:{documentElement:{classList:{contains:name=>(name==='k11520UtilitiesOpen'&&utilitiesOpen)||(name==='k11520HudCollapsed'&&hudHidden)}},querySelectorAll:s=>nodes[s.slice(1)]?[nodes[s.slice(1)]]:[]},$:s=>nodes[s.slice(1)],OPTIONAL_UTILITIES:selectors,matchMedia:()=>({matches:false})});
 // The existing owner now composes with Settings; evaluate its real dependency
 // rather than bypassing that guard in this Wallet-only fixture.
 vm.runInContext(source.slice(source.indexOf('const settingsOpen='),source.indexOf('function put(')),context);
 vm.runInContext(source.slice(source.indexOf('function pinMobileUtilityStack(){'),source.indexOf('function installUtilityMaster(){')),context);vm.runInContext(fn,context);vm.runInContext('syncUtilityMaster()',context);
 for(const id of ['dock','aiChatButton','chatHandle','bgmButton','backpackButton'])assert.equal(nodes[id].style.values.display,'none');
 assert.notEqual(nodes.walletPanel.style.values.display,'none');assert.notEqual(nodes.walletToggle.style.values.display,'none');
 for(const id of ['cargoInterceptionButton','homeDeliveryButton'])assert.equal(nodes[id].style.values.display,'none');
 // Exercise the real owner sequence across repeated ticks and changed context eligibility.
 for(const [cargo,home] of [['cruise','idle'],['raid','delivery'],['cruise','delivery']]){nodes.cargoInterceptionButton.dataset.contextState=cargo;nodes.homeDeliveryButton.dataset.contextState=home;nodes.cargoInterceptionButton.dataset.worldContext=String(cargo!=='cruise');nodes.homeDeliveryButton.dataset.worldContext=String(home!=='idle');for(let tick=0;tick<2;tick++){vm.runInContext('pinMobileUtilityStack();syncUtilityMaster()',context);for(const id of ['cargoInterceptionButton','homeDeliveryButton','dock'])assert.equal(nodes[id].style.values.display,'none')}}
 hiddenPreferences.add('chatHandle');
 hudHidden=true;vm.runInContext('syncUtilityMaster()',context);assert.notEqual(nodes.k11520HudCollapseAll.style.values.display,'none','HUD restore remains reachable');hudHidden=false;vm.runInContext('pinMobileUtilityStack();syncUtilityMaster()',context);
 walletClosed=true;vm.runInContext('syncUtilityMaster()',context);for(const id of ['dock','aiChatButton','bgmButton','backpackButton'])assert.notEqual(nodes[id].style.values.display,'none');
 for(const id of ['cargoInterceptionButton','homeDeliveryButton'])assert.equal(nodes[id].style.values.display,'grid');
 assert.equal(nodes.chatHandle.style.values.display,'none','current hidden chat preference survives wallet close');
 utilitiesOpen=false;vm.runInContext('pinMobileUtilityStack();syncUtilityMaster()',context);assert.equal(nodes.cargoInterceptionButton.style.values.display,'none','now-idle cargo stays hidden');assert.equal(nodes.homeDeliveryButton.style.values.display,'grid','currently eligible delivery remains visible');
 assert.match(source,/walletOpen\?\['#k11520UtilityMaster',\.\.\.visibleContextActions,'#walletToggle'\]/);
});


test('wallet identity hints distinguish restored live identity, disconnect and confirmed wrong chain',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/game-5d-main.mjs',import.meta.url),'utf8');
 const hint=source.split('\n').find(line=>line.includes("const retainedHint=$('#walletRetained')"));
 const message=source.split('\n').find(line=>line.includes("$('#walletMsg').textContent=isTestnet()?"));
 const nodes={walletRetained:{hidden:false},walletMsg:{textContent:''}};
 const context=vm.createContext({$:selector=>nodes[selector.slice(1)],value:{account:'0xabc',chainId:97},chain:{status:'ORACLE_STALE'},isTestnet:()=>true,executionLabel:()=>'TESTNET'});
 const render=()=>vm.runInContext("(()=>{"+hint+message+"})()",context);render();assert.equal(nodes.walletRetained.hidden,true);assert.doesNotMatch(nodes.walletMsg.textContent,/WRONG NETWORK/);
 context.value={account:null,chainId:null};render();assert.equal(nodes.walletRetained.hidden,false);assert.doesNotMatch(nodes.walletMsg.textContent,/WRONG NETWORK/);
 context.value={account:'0xabc',chainId:1};render();assert.match(nodes.walletMsg.textContent,/WRONG NETWORK/);
});


test('M1 financial displays are explicitly NOT_REQUESTED and never infer zero positions or PnL',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/game-5d-main.mjs',import.meta.url),'utf8');
 const wallet={readScope:'BALANCES_ONLY',testBnbBalance:'0.1',testTokenBalance:1000,free:null};
 const context=vm.createContext({execution:{readOnly:true},walletExecutionView:()=>({readOnly:true,wallet,positions:[]}),receiptRows:rows=>JSON.stringify(rows)});
 vm.runInContext(source.slice(source.indexOf('function isPrincipalExitOnlyView('),source.indexOf('function normalizeTradeSide(')),context);
 vm.runInContext(source.slice(source.indexOf('function crossMarketSnapshot(){'),source.indexOf('function syncSimulationPositions(){')),context);
 const cross=vm.runInContext('crossMarketSnapshot()',context);assert.equal(cross.status,'NOT_REQUESTED');for(const key of ['openPositions','free','lockedMargin','realizedPnl','unrealizedPnl'])assert.equal(cross[key],null);
 vm.runInContext(source.slice(source.indexOf('function simulationOrganHTML(id){'),source.indexOf('function bindSimulationSheet(')),context);
 for(const organ of ['assets','orders','positions','history']){const html=vm.runInContext('simulationOrganHTML("'+organ+'")',context);assert.match(html,/NOT_REQUESTED/);assert.doesNotMatch(html,/尚無部位|尚無委託|尚無成交/)}
});


test('M1 market cards and close action never interpret unrequested positions as empty',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/game-5d-main.mjs',import.meta.url),'utf8');
 assert.match(source,/execution\.readOnly\?'NOT_REQUESTED':principalOnly\?'部位尚未恢復':x\.pos/);assert.match(source,/持倉：\$\{execution\.readOnly\?'NOT_REQUESTED':principalOnly\?'部位尚未恢復':p/);
 const fn=source.slice(source.indexOf('async function closePos(){'),source.indexOf("$('#closeAll')",source.indexOf('async function closePos(){')));
 const prefix=fn.slice(0,fn.indexOf('const p=axis().pos;'))+'}';let message;
 const context=vm.createContext({execution:{readOnly:true},toast:x=>{message=x}});vm.runInContext(prefix,context);await vm.runInContext('closePos()',context);assert.match(message,/NOT_REQUESTED/);
});


test('execution owner initializes before startup world feedback can synchronously render market axes',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/game-5d-main.mjs',import.meta.url),'utf8');
 const declaration=source.split('\n').find(line=>line.startsWith('let execution=simulationExecution,'));
 assert.ok(source.indexOf(declaration)>source.indexOf('const simulationExecution='));assert.ok(source.indexOf(declaration)<source.indexOf('\nsyncWorldFeedback();'),'existing owner must be initialized before earliest synchronous HUD callback');
 const render=source.slice(source.indexOf('function renderAxes(){'),source.indexOf('function openMarketCard('));
 function fixture(){
  const cards=new Map(),axis={market:'BTCUSDT',pos:null};
  const axes={querySelector:selector=>cards.get(selector.match(/data-market-card="([^"]+)"/)[1])||null,appendChild:card=>cards.set(card.dataset.marketCard,card)};
  const document={createElement(){
   const attributes={},fields=Object.fromEntries(['.axisHead b','.marketName','.q','.pos'].map(selector=>[selector,{textContent:''}]));
   return {dataset:{},classList:{toggle(){}},querySelector:selector=>fields[selector],getAttribute:name=>attributes[name]??null,setAttribute(name,value){attributes[name]=String(value);if(name==='data-axis')this.dataset.axis=String(value);if(name==='data-market-card')this.dataset.marketCard=String(value)}};
  }};
  const context=vm.createContext({document,simulationExecution:{mode:'SIMULATION'},syncMarketKLabels:()=>{},S:{axis:'KX',axes:{KX:axis,KY:axis,KZ:axis},quotes:{}},$:selector=>selector==='#axes'?axes:null,$$:()=>[],fmt:String});
  return {cards,context};
 }
 const {context:preInit}=fixture();assert.throws(()=>vm.runInContext(render+'renderAxes();'+declaration,preInit),/Cannot access 'execution' before initialization/,'reproduce the exact CI startup failure ordering');
 const {cards,context}=fixture();vm.runInContext(declaration+render,context);vm.runInContext('renderAxes()',context);assert.equal(cards.size,3);for(const card of cards.values())assert.match(card.querySelector('.pos').textContent,/空倉/);
 vm.runInContext('execution={readOnly:true};renderAxes()',context);for(const card of cards.values()){assert.match(card.querySelector('.pos').textContent,/NOT_REQUESTED/);assert.doesNotMatch(card.querySelector('.pos').textContent,/空倉/)}
});

for(const [axis,market] of [['KX','BTCUSDT'],['KY','ETHUSDT'],['KZ','BNBUSDT']])for(const c of [1,-1])test(`actual openOrder owner blocks ${market} ${c>0?'LONG':'SHORT'} while public quote is WAIT`,async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/game-5d-main.mjs',import.meta.url),'utf8');
 const {createExecutionAdapter}=await import('../K線西遊記/temples/11520/runtime/real-trading-order-intent.mjs');
 const {createKgenLedger,normalizeSignedC,signedCFromLegacyMagnitude}=await import('../K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs');
 const ledger=createKgenLedger(100),execution=createExecutionAdapter({ledger,productV1:true,verifiedPublicQuotes:true}),before=structuredClone(ledger);
 const nodes={'#confirmOrder':{},'#confirmBody':{},'#confirm':{classList:{remove:v=>{nodes.closed=v}}}},toasts=[];
 const state={axis,quotes:{},axes:{[axis]:{market,c,lots:1}}};let previews=0;
  const context=vm.createContext({S:state,execution,previewExecution:null,executionBusy:false,pending:null,reviewedOrder:null,axis:()=>state.axes[axis],syncTradeAxisFromPlane(){},isTestnet:()=>false,price:()=>0,toast:x=>toasts.push(x),normalizeSignedC,signedCFromLegacyMagnitude,$:id=>nodes[id],$$:()=>[],paintOrderPreview:()=>previews++,journey:{event:()=>false},__K11520_SIGNED_C_IMMERSIVE__:{signedByAxis:{[axis]:c}}});
 vm.runInContext(source.slice(source.indexOf('function executionQuote('),source.indexOf('function orderInput(')),context);
  vm.runInContext(source.slice(source.indexOf('function renderOrderDirection(){'),source.indexOf("$('#cancelOrder').onclick")),context);context.openOrder();
 assert.equal(nodes.closed,'open');assert.equal(nodes['#confirmOrder'].disabled,true);assert.equal(previews,0);assert.equal(context.pending,null);assert.match(toasts[0],/^等候有效報價/);assert.deepEqual(ledger,before);assert.deepEqual(state.quotes,{});
});

test('actual order UI catches corrupt-source and rollback quote failures and clears stale confirmation',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/game-5d-main.mjs',import.meta.url),'utf8');
 for(const message of ['INVALID_SIMULATION_SOURCE','provider payload with private content']){
  const nodes={'#confirmOrder':{disabled:false},'#confirm':{classList:{remove:value=>{nodes.removed=value}}}},toasts=[];
   const context=vm.createContext({execution:{mode:'SIMULATION',quote(){throw new Error(message)}},previewExecution:null,executionBusy:false,reviewedOrder:null,pending:{axis:'KY'},axis:()=>({market:'ETHUSDT'}),syncTradeAxisFromPlane(){},$:id=>nodes[id],toast:value=>toasts.push(value)});
  vm.runInContext(source.slice(source.indexOf('function executionQuote('),source.indexOf('function orderInput(')),context);
  vm.runInContext(source.slice(source.indexOf('function openOrder(){'),source.indexOf("$('#cancelOrder').onclick")),context);
  assert.doesNotThrow(()=>context.openOrder());assert.equal(context.pending,null);assert.equal(nodes['#confirmOrder'].disabled,true);assert.equal(nodes.removed,'open');
  assert.equal(toasts[0],message==='INVALID_SIMULATION_SOURCE'?'等候有效報價 · INVALID_SIMULATION_SOURCE':'等候有效報價 · INVALID_EXECUTION_QUOTE');
 }
});

test('order presentation distinguishes creation provenance from current pending/fill source and SIM time',async()=>{
 const source=await readFile(new URL('../K線西遊記/temples/11520/runtime/game-5d-main.mjs',import.meta.url),'utf8');
 const {createExecutionAdapter}=await import('../K線西遊記/temples/11520/runtime/real-trading-order-intent.mjs');
 const {createKgenLedger}=await import('../K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs');
 const adapter=createExecutionAdapter({ledger:createKgenLedger(100),simulationFallback:true});
 adapter.observe({market:'ETHUSDT',price:4000,observedAt:1000,now:1000,source:'BINANCE_PUBLIC_MARKET_DATA_ONLY'});
 adapter.submit({axis:'KY',market:'ETHUSDT',c:1,lots:1,triggerPrice:4001},{now:1001});
 adapter.tick({now:17000});
 const context=vm.createContext({execution:{readOnly:false},previewExecution:null,walletExecutionView:()=>adapter.snapshot(),isTestnet:()=>false,receiptRows:rows=>JSON.stringify(rows),receiptTime:x=>x,executionLabel:()=>'SIMULATION'});
 vm.runInContext(source.slice(source.indexOf('function isPrincipalExitOnlyView('),source.indexOf('function normalizeTradeSide(')),context);
 vm.runInContext(source.slice(source.indexOf('function simulationOrganHTML(id){'),source.indexOf('function bindSimulationSheet(')),context);
 for(const time of [17000,33000]){
  if(time===33000)adapter.tick({now:time});
  const html=vm.runInContext("simulationOrganHTML('orders')",context);
  assert.ok(html.includes('["SOURCE AT CREATION","BINANCE_PUBLIC_MARKET_DATA_ONLY"]'));
  assert.ok(html.includes('["EXECUTION SOURCE","K11520_DETERMINISTIC_SIMULATION"]'));
 }
 assert.match(source,/isTestnet\(\)\?'ORACLE TIME':'OBSERVED AT \(SIMULATION\)'/);
});
