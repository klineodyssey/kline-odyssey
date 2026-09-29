import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import solc from 'solc';
import ganache from 'ganache';
import { BrowserProvider, Contract, ContractFactory, id, parseEther } from 'ethers';

const brainPath = 'KGEN/contracts/KGEN_BrainExchange.sol';
const brainSource = fs.readFileSync(brainPath, 'utf8');
const harnessSource = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "KGEN/contracts/KGEN_BrainExchange.sol";
contract MockKGEN is ERC20 {
 constructor() ERC20("Mock KGEN", "KGEN") {}
 uint256 public taxBps;
 function setTaxBps(uint256 tax) external { require(tax<=1000); taxBps=tax; }
 function mint(address to, uint256 amount) external { _mint(to, amount); }
 function _update(address from,address to,uint256 amount) internal override {
   uint256 fee=(from!=address(0)&&to!=address(0)) ? amount*taxBps/10000 : 0;
   if(fee>0) super._update(from,address(0),fee);
   super._update(from,to,amount-fee);
 }
}
contract MockMarsSeats { uint256 public lastReward; function notifyReward(uint256 amountWei) external { lastReward = amountWei; } }
contract BrainV4TestProxy is ERC1967Proxy { constructor(address implementation, bytes memory data) ERC1967Proxy(implementation, data) {} }
`;

function findImports(importPath) { const candidates = [importPath, path.join('node_modules', importPath)]; for (const candidate of candidates) if (fs.existsSync(candidate)) return { contents: fs.readFileSync(candidate, 'utf8') }; return { error: `Import not found: ${importPath}` }; }
const input = { language: 'Solidity', sources: { [brainPath]: { content: brainSource }, 'KGEN/contracts/tests/BrainV4Harness.sol': { content: harnessSource } }, settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object', 'storageLayout'] } } } };
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
const errors = (output.errors || []).filter((e) => e.severity === 'error'); if (errors.length) throw new Error(errors.map((e) => e.formattedMessage).join('\n'));
function artifact(source, name) { const c = output.contracts[source]?.[name]; assert.ok(c, `missing compiled artifact ${source}:${name}`); return { abi: c.abi, bytecode: `0x${c.evm.bytecode.object}`, deployedBytecode: c.evm.deployedBytecode.object }; }
const brainArtifact = artifact(brainPath, 'KGEN_BrainExchange_V4_0_0');
const mockArtifact = artifact('KGEN/contracts/tests/BrainV4Harness.sol', 'MockKGEN');
const marsArtifact = artifact('KGEN/contracts/tests/BrainV4Harness.sol', 'MockMarsSeats');
const proxyArtifact = artifact('KGEN/contracts/tests/BrainV4Harness.sol', 'BrainV4TestProxy');
const runtimeBytes = brainArtifact.deployedBytecode.length / 2; assert.ok(runtimeBytes <= 24_576, `optimized runtime bytecode exceeds EIP-170: ${runtimeBytes} bytes`);

// Compile the reviewed pre-capital ancestor, pinned so post-merge main CI never
// compares the candidate to itself. Compare recursive type shape as solc
// internal type IDs can change when new structs are appended.
const ancestorCommit = '12adee3fbc53fa2c2d05706b54b7246ccfb7e9e8';
const ancestorSource = execFileSync('git', ['show', `${ancestorCommit}:${brainPath}`], { encoding: 'utf8' });
const ancestorInput = structuredClone(input);
ancestorInput.sources[brainPath].content = ancestorSource;
const ancestorOutput = JSON.parse(solc.compile(JSON.stringify(ancestorInput), { import: findImports }));
assert.deepEqual((ancestorOutput.errors || []).filter(e => e.severity === 'error'), []);
const ancestorContract = ancestorOutput.contracts[brainPath].KGEN_BrainExchange_V4_0_0;
const beforeLayout = ancestorContract.storageLayout;
const afterLayout = output.contracts[brainPath].KGEN_BrainExchange_V4_0_0.storageLayout;
function shape(layout, typeId) {
  const t = layout.types[typeId];
  return { label:t.label, bytes:t.numberOfBytes, encoding:t.encoding,
    ...(t.key ? { key:shape(layout,t.key), value:shape(layout,t.value) } : {}),
    ...(t.base ? { base:shape(layout,t.base) } : {}),
    ...(t.members ? { members:t.members.map(m => ({ label:m.label, slot:m.slot, offset:m.offset, type:shape(layout,m.type) })) } : {}) };
}
for (const old of beforeLayout.storage.filter(s => s.label !== '__gap')) {
  const next = afterLayout.storage.find(s => s.label === old.label);
  assert.ok(next, `removed storage ${old.label}`);
  assert.deepEqual({ slot:next.slot, offset:next.offset, type:shape(afterLayout,next.type) }, { slot:old.slot, offset:old.offset, type:shape(beforeLayout,old.type) }, `storage compatibility ${old.label}`);
}
const oldGap = beforeLayout.storage.find(s => s.label === '__gap');
const newGap = afterLayout.storage.find(s => s.label === '__gap');
assert.equal(BigInt(newGap.slot) + BigInt(afterLayout.types[newGap.type].numberOfBytes)/32n, BigInt(oldGap.slot) + BigInt(beforeLayout.types[oldGap.type].numberOfBytes)/32n, 'storage gap endpoint preserved');
console.log(`[brain-v4-evm] storage layout PASS; runtime ${runtimeBytes} bytes`);

const eip1193 = ganache.provider({ logging: { quiet: true }, wallet: { totalAccounts: 10 } });
const provider = new BrowserProvider(eip1193);
provider.pollingInterval = 10;
const signers = await Promise.all(Array.from({ length: 9 }, (_, i) => provider.getSigner(i)));
const [admin, keeper, pauser, upgrader, treasury, publicGood, heart, user, settlement] = signers;
async function deploy(artifact, signer, args = []) { const factory = new ContractFactory(artifact.abi, artifact.bytecode, signer); const contract = await factory.deploy(...args); await contract.waitForDeployment(); return contract; }
async function expectRevert(promise, label) { let reverted = false; try { const result = await promise; if (result && typeof result.wait === 'function') await result.wait(); } catch (error) { assert.equal(error.code, 'CALL_EXCEPTION', `non-contract failure must not count as revert: ${label}`); reverted = true; } assert.ok(reverted, `expected revert: ${label}`); }
async function latestRawTimestamp() { const block = await eip1193.request({ method: 'eth_getBlockByNumber', params: ['latest', false] }); return BigInt(block.timestamp); }

const token = await deploy(mockArtifact, admin); const mars = await deploy(marsArtifact, admin); const implementation = await deploy(brainArtifact, admin); const now = await latestRawTimestamp();
const init = new ContractFactory(brainArtifact.abi, brainArtifact.bytecode, admin).interface.encodeFunctionData('initialize', [token.target,await admin.getAddress(),await keeper.getAddress(),await pauser.getAddress(),await upgrader.getAddress(),await treasury.getAddress(),now]);
const proxy = await deploy(proxyArtifact, admin, [implementation.target, init]); const brain = new Contract(proxy.target, brainArtifact.abi, admin);
await (await brain.setPublicGoodTreasury(await publicGood.getAddress())).wait(); await (await brain.setTempleHeart(await heart.getAddress())).wait(); await (await brain.setMarsSeats(mars.target)).wait(); await (await brain.grantRole(await brain.SETTLEMENT_ROLE(), await settlement.getAddress())).wait();
await (await token.mint(await user.getAddress(), parseEther('1000'))).wait(); await (await token.connect(user).approve(proxy.target, parseEther('1000'))).wait(); await (await brain.connect(user).depositMargin(parseEther('100'))).wait();
assert.equal(await brain.principalOf(await user.getAddress()), parseEther('100')); assert.equal(await brain.totalPrincipal(), parseEther('100')); assert.equal(await brain.solvent(), true);
await expectRevert(brain.connect(keeper).supplyHeart(parseEther('1')), 'Heart cannot spend principal'); await expectRevert(brain.sweepToTreasury(parseEther('1')), 'Treasury cannot spend principal');
await (await token.mint(await admin.getAddress(), parseEther('100'))).wait(); await (await token.transfer(proxy.target, parseEther('100'))).wait(); await (await brain.connect(keeper).rollPayroll()).wait();
assert.equal(await brain.totalRewardLiability(), parseEther('50')); assert.equal(await token.balanceOf(mars.target), parseEther('25')); assert.equal(await token.balanceOf(await publicGood.getAddress()), parseEther('5')); assert.equal(await brain.freeSurplus(), parseEther('20')); assert.equal(await brain.solvent(), true);
assert.equal(await brain.pendingProfit(await user.getAddress()), parseEther('50')); await (await brain.connect(user).claimProfit()).wait(); assert.equal(await brain.totalRewardLiability(), 0n);
await (await brain.connect(pauser).pause()).wait(); await expectRevert(brain.connect(user).depositMargin(parseEther('1')), 'paused deposit'); await expectRevert(brain.connect(settlement).reservePositionCollateral(id('PAUSED-POSITION'), await user.getAddress(), parseEther('1')), 'paused position reservation'); await (await brain.connect(user).withdrawMargin(parseEther('10'))).wait(); await (await brain.unpause()).wait();
const releaseKey = id('KX-RELEASE-1'); await (await brain.connect(settlement).reservePositionCollateral(releaseKey, await user.getAddress(), parseEther('30'))).wait(); assert.equal(await brain.availablePrincipal(await user.getAddress()), parseEther('60')); await expectRevert(brain.connect(user).withdrawMargin(parseEther('61')), 'cannot withdraw locked position collateral');
await (await brain.connect(pauser).pause()).wait(); await (await brain.connect(settlement).releasePositionCollateral(releaseKey)).wait(); await expectRevert(brain.connect(settlement).reservePositionCollateral(releaseKey, await user.getAddress(), parseEther('1')), 'released position key cannot replay'); await (await brain.unpause()).wait();
const lossKey=id('KY-LOSS-1'); await (await brain.connect(settlement).reservePositionCollateral(lossKey,await user.getAddress(),parseEther('20'))).wait(); await (await brain.connect(settlement).settlePositionCollateral(lossKey,-parseEther('15'),0)).wait(); assert.equal(await brain.principalOf(await user.getAddress()),parseEther('75')); assert.equal(await brain.freeSurplus(),parseEther('20')); assert.equal(await brain.settlementCapital(),parseEther('15'));
const profitKey=id('KZ-PROFIT-1'); await (await brain.connect(settlement).reservePositionCollateral(profitKey,await user.getAddress(),parseEther('20'))).wait(); await (await brain.connect(settlement).settlePositionCollateral(profitKey,parseEther('10'),0)).wait(); assert.equal(await brain.principalOf(await user.getAddress()),parseEther('85')); assert.equal(await brain.freeSurplus(),parseEther('20')); assert.equal(await brain.settlementCapital(),parseEther('5')); await expectRevert(brain.connect(settlement).settlePositionCollateral(profitKey,parseEther('10'),0),'settlement replay blocked');
const cappedLossKey=id('KX-CAPPED-LOSS'); await (await brain.connect(settlement).reservePositionCollateral(cappedLossKey,await user.getAddress(),parseEther('5'))).wait(); await expectRevert(brain.connect(settlement).settlePositionCollateral(cappedLossKey,-parseEther('6'),0),'loss exceeds locked collateral'); await (await brain.connect(settlement).releasePositionCollateral(cappedLossKey)).wait();
await (await brain.allocateInsuranceReserve(parseEther('20'))).wait(); assert.equal(await brain.insuranceReserve(),parseEther('20')); assert.equal(await brain.freeSurplus(),0n);
const insuredGapKey=id('KX-INSURED-GAP'); await (await brain.connect(settlement).reservePositionCollateral(insuredGapKey,await user.getAddress(),parseEther('5'))).wait(); await (await brain.connect(settlement).settlePositionCollateral(insuredGapKey,-parseEther('5'),parseEther('7'))).wait(); assert.equal(await brain.insuranceReserve(),parseEther('13')); assert.equal(await brain.uncoveredBadDebt(),0n);
const uncoveredGapKey=id('KY-UNCOVERED-GAP'); await (await brain.connect(settlement).reservePositionCollateral(uncoveredGapKey,await user.getAddress(),parseEther('5'))).wait(); await (await brain.connect(settlement).settlePositionCollateral(uncoveredGapKey,-parseEther('5'),parseEther('20'))).wait(); assert.equal(await brain.uncoveredBadDebt(),parseEther('7')); await expectRevert(brain.connect(settlement).reservePositionCollateral(id('BLOCKED-BY-BAD-DEBT'),await user.getAddress(),parseEther('1')),'new risk halted by uncovered bad debt');
await (await token.mint(await admin.getAddress(),parseEther('7'))).wait(); await (await token.approve(proxy.target,parseEther('7'))).wait(); await (await brain.recapitalizeBadDebt(parseEther('7'))).wait(); assert.equal(await brain.uncoveredBadDebt(),0n);
await (await brain.setBrainCapacityWhole(75)).wait(); await expectRevert(brain.connect(user).depositMargin(parseEther('1')),'principal capacity gate');
const implementation2=await deploy(brainArtifact,admin); await (await brain.connect(upgrader).scheduleUpgrade(implementation2.target)).wait(); const eta=await brain.scheduledUpgradeEta(); await expectRevert(brain.connect(upgrader).upgradeToAndCall(implementation2.target,'0x'),'upgrade timelock'); const beforeAdvance=await latestRawTimestamp(); if (beforeAdvance<eta) await eip1193.request({method:'evm_increaseTime',params:[Number((eta-beforeAdvance)+60n)]}); await eip1193.request({method:'evm_mine',params:[]}); await (await brain.connect(upgrader).upgradeToAndCall(implementation2.target,'0x',{gasLimit:1_500_000})).wait(); assert.equal(await brain.totalPrincipal(),parseEther('75')); assert.equal(await brain.solvent(),true);
console.log('[brain-v4-evm] legacy custody/reservation/surplus/insurance/pause/capacity/upgrade invariants PASS');

// Separate A/B/C ledger, using genuine token custody, not injected Brain state.
const freshProxy = await deploy(proxyArtifact, admin, [implementation.target, init]);
const ledger = new Contract(freshProxy.target, brainArtifact.abi, admin);
await (await ledger.grantRole(await ledger.SETTLEMENT_ROLE(), await settlement.getAddress())).wait();
await (await ledger.setTempleHeart(await heart.getAddress())).wait();
const players = [user, publicGood, heart];
for (const player of players) {
  await (await token.mint(await player.getAddress(), parseEther('100'))).wait();
  await (await token.connect(player).approve(ledger.target, parseEther('100'))).wait();
  await (await ledger.connect(player).depositMargin(parseEther('100'))).wait();
}
assert.equal(await ledger.totalPrincipal(),parseEther('300'));
assert.equal(await ledger.settlementCapital(),0n,'deposits never settlement capital');
assert.equal(await ledger.insuranceReserve(),0n);
const keys = ['A','B','C'].map(n=>id(`CAPITAL-${n}`));
for (let i=0;i<3;i++) await (await ledger.connect(settlement).reservePositionCollateral(keys[i],await players[i].getAddress(),parseEther('10'))).wait();
await expectRevert(ledger.connect(settlement).reservePositionRisk(keys[0],parseEther('1'),1,1),'no funded capital');
await expectRevert(ledger.reservePositionRisk(keys[0],parseEther('1'),1,1),'only settlement authority');
await (await token.mint(await admin.getAddress(),parseEther('120'))).wait();
await (await token.approve(ledger.target,parseEther('120'))).wait();
await (await ledger.fundSettlementCapital(parseEther('90'))).wait();
await (await ledger.fundInsurance(parseEther('10'))).wait();
assert.equal(await ledger.settlementCapital(),parseEther('90'));
assert.equal(await ledger.insuranceReserve(),parseEther('10'));
assert.equal(await ledger.freeSurplus(),0n);
await expectRevert(ledger.sweepToTreasury(1),'capital and insurance cannot be swept');
await expectRevert(ledger.connect(keeper).supplyHeart(1),'capital and insurance cannot supply Heart');
for (let i=0;i<3;i++) await (await ledger.connect(settlement).reservePositionRisk(keys[i],parseEther('30'),i+1,i+11)).wait();
assert.equal(await ledger.reservedSettlementLiability(),parseEther('90'));
assert.equal(await ledger.availableRiskCapacity(),0n);
const overCapacityKey=id('AGGREGATE-EXPOSURE-EXCESS');
await (await ledger.connect(settlement).reservePositionCollateral(overCapacityKey,await user.getAddress(),1)).wait();
await expectRevert(ledger.connect(settlement).reservePositionRisk(overCapacityKey,1,99,99),'aggregate liability cannot overbook funded cash');
await (await ledger.connect(settlement).releasePositionCollateral(overCapacityKey)).wait();
await expectRevert(ledger.connect(settlement).reservePositionRisk(keys[0],parseEther('1'),1,11),'duplicate risk reservation');
await (await ledger.connect(settlement).settlePositionCollateral(keys[0],parseEther('20'),0)).wait();
await (await ledger.connect(settlement).settlePositionCollateral(keys[1],-parseEther('5'),0)).wait();
await (await ledger.connect(settlement).releasePositionCollateral(keys[2])).wait();
assert.equal(await ledger.principalOf(await players[0].getAddress()),parseEther('120'));
assert.equal(await ledger.principalOf(await players[1].getAddress()),parseEther('95'));
assert.equal(await ledger.principalOf(await players[2].getAddress()),parseEther('100'));
assert.equal(await ledger.settlementCapital(),parseEther('75'));
assert.equal(await ledger.reservedSettlementLiability(),0n);
assert.equal(await ledger.totalLockedPrincipal(),0n);
await expectRevert(ledger.connect(settlement).releasePositionCollateral(keys[2]),'release replay');
const zeroRiskKey = id('BOUNDARY-ZERO-LIABILITY');
await (await ledger.connect(settlement).reservePositionCollateral(zeroRiskKey,await user.getAddress(),1)).wait();
await (await ledger.connect(settlement).reservePositionRisk(zeroRiskKey,0,4,14)).wait();
assert.equal((await ledger.positionRiskReservations(zeroRiskKey)).reserved,true);
await expectRevert(ledger.connect(settlement).reservePositionRisk(zeroRiskKey,0,4,14),'zero liability still one-shot');
await (await ledger.connect(settlement).releasePositionCollateral(zeroRiskKey)).wait();
assert.equal((await ledger.positionRiskReservations(zeroRiskKey)).released,true);
assert.equal(await ledger.settlementCapital(),parseEther('75'));

// A legacy pre-upgrade position (no risk reservation) has a gap profit above
// funded capital. Closing must not revert or seize B/C principal/insurance.
const claimKey = id('LEGACY-GAP-PROFIT');
await (await ledger.connect(settlement).reservePositionCollateral(claimKey,await user.getAddress(),parseEther('1'))).wait();
await (await ledger.connect(settlement).settlePositionCollateral(claimKey,parseEther('100'),0)).wait();
let claim = await ledger.settlementClaims(claimKey);
assert.equal(claim.dueWei,parseEther('100')); assert.equal(claim.paidWei,parseEther('75')); assert.equal(claim.remainingWei,parseEther('25'));
assert.equal(await ledger.playerClaimable(await user.getAddress()),parseEther('25'));
assert.equal(await ledger.totalPlayerClaimable(),parseEther('25'));
assert.equal(await ledger.totalLockedPrincipal(),0n);
assert.equal(await ledger.insuranceReserve(),parseEther('10'));
assert.equal(await ledger.solvent(),true,'unfunded debt must not trap cash-backed exits');
assert.equal(await ledger.reservedBalance()-await ledger.custodyReservedBalance(),parseEther('25'));
assert.equal(await ledger.availableRiskCapacity(),0n);
await (await ledger.connect(players[1]).withdrawMargin(parseEther('95'))).wait();
await (await ledger.connect(players[2]).withdrawMargin(parseEther('100'))).wait();
assert.equal(await ledger.principalOf(await players[1].getAddress()),0n);
assert.equal(await ledger.principalOf(await players[2].getAddress()),0n);
assert.equal(await ledger.claimSettlement.staticCall(claimKey),0n,'unfunded claim cannot fabricate payment');
await (await ledger.fundSettlementCapital(parseEther('20'))).wait();
assert.equal(await ledger.availableRiskCapacity(),0n,'top-up encumbered by prior claims');
// A new block can change updatedAt from a no-op SSTORE during estimation to an
// actual write during execution. Give local receipt tests explicit gas headroom.
await (await ledger.connect(players[2]).claimSettlement(claimKey,{gasLimit:300_000})).wait();
assert.equal(await ledger.playerClaimable(await user.getAddress()),parseEther('5'));
assert.equal(await ledger.principalOf(await players[2].getAddress()),0n,'third party cannot redirect claim');
await (await token.mint(await admin.getAddress(),parseEther('5'))).wait();
await (await token.approve(ledger.target,parseEther('5'))).wait();
await (await ledger.fundSettlementCapital(parseEther('5'))).wait();
await (await ledger.claimSettlement(claimKey,{gasLimit:300_000})).wait();
assert.equal(await ledger.totalPlayerClaimable(),0n);
assert.equal((await ledger.settlementClaims(claimKey)).paidWei,parseEther('100'));
assert.equal(await ledger.claimSettlement.staticCall(claimKey),0n,'claim replay no double credit');
await expectRevert(ledger.connect(settlement).settlePositionCollateral(claimKey,parseEther('100'),0),'gap settlement replay');
assert.equal(await ledger.principalOf(await user.getAddress()),parseEther('220'));
await (await ledger.connect(user).withdrawMargin(parseEther('220'))).wait();
assert.equal(await token.balanceOf(ledger.target),parseEther('10'),'only insurance remains');
assert.equal(await ledger.solvent(),true);

// Real old implementation upgrade: preserve legacy live collateral and storage.
const oldArtifact = {abi:ancestorContract.abi,bytecode:`0x${ancestorContract.evm.bytecode.object}`};
const oldImplementation = await deploy(oldArtifact,admin);
const migrationProxy = await deploy(proxyArtifact,admin,[oldImplementation.target,init]);
const oldBrain = new Contract(migrationProxy.target,oldArtifact.abi,admin);
await (await token.mint(await user.getAddress(),parseEther('12'))).wait();
await (await token.connect(user).approve(migrationProxy.target,parseEther('12'))).wait();
await (await oldBrain.connect(user).depositMargin(parseEther('12'))).wait();
await (await oldBrain.grantRole(await oldBrain.SETTLEMENT_ROLE(),await settlement.getAddress())).wait();
const migrationKey=id('MIGRATION-OPEN');
await (await oldBrain.connect(settlement).reservePositionCollateral(migrationKey,await user.getAddress(),parseEther('2'))).wait();
await (await oldBrain.connect(upgrader).scheduleUpgrade(implementation.target)).wait();
const migrationEta=await oldBrain.scheduledUpgradeEta();
await eip1193.request({method:'evm_increaseTime',params:[Number(migrationEta-await latestRawTimestamp()+60n)]}); await eip1193.request({method:'evm_mine',params:[]});
await (await oldBrain.connect(upgrader).upgradeToAndCall(implementation.target,'0x',{gasLimit:1_500_000})).wait();
const migrated = new Contract(migrationProxy.target,brainArtifact.abi,admin);
assert.equal(await migrated.totalPrincipal(),parseEther('12'));
assert.equal(await migrated.totalLockedPrincipal(),parseEther('2'));
assert.equal(await migrated.settlementCapital(),0n);
await (await migrated.connect(settlement).settlePositionCollateral(migrationKey,parseEther('3'),0)).wait();
assert.equal(await migrated.playerClaimable(await user.getAddress()),parseEther('3'));
await (await migrated.connect(user).withdrawMargin(parseEther('12'))).wait();
assert.equal(await migrated.solvent(),true);
await (await token.mint(await admin.getAddress(),parseEther('3'))).wait();
await (await token.approve(migrated.target,parseEther('3'))).wait();
await (await migrated.fundSettlementCapital(parseEther('3'))).wait();
await (await migrated.claimSettlement(migrationKey,{gasLimit:300_000})).wait();
await (await migrated.connect(user).withdrawMargin(parseEther('3'))).wait();
assert.equal(await migrated.totalPlayerClaimable(),0n);
assert.equal(await token.balanceOf(migrated.target),0n);

// A's previously funded reservation cannot be captured by B's later legacy
// claim. Claims consume only free capital; earmarked reserves remain exclusive.
const priorityProxy = await deploy(proxyArtifact,admin,[implementation.target,init]);
const priorityBrain = new Contract(priorityProxy.target,brainArtifact.abi,admin);
await (await priorityBrain.grantRole(await priorityBrain.SETTLEMENT_ROLE(),await settlement.getAddress())).wait();
for (const player of [user,heart]) {
  await (await token.mint(await player.getAddress(),parseEther('1'))).wait();
  await (await token.connect(player).approve(priorityBrain.target,parseEther('1'))).wait();
  await (await priorityBrain.connect(player).depositMargin(parseEther('1'))).wait();
}
await (await token.mint(await admin.getAddress(),parseEther('200'))).wait();
await (await token.approve(priorityBrain.target,parseEther('200'))).wait();
await (await priorityBrain.fundSettlementCapital(parseEther('100'))).wait();
const fundedA=id('PRIORITY-FUNDED-A'),legacyB=id('PRIORITY-LEGACY-B');
await (await priorityBrain.connect(settlement).reservePositionCollateral(fundedA,await user.getAddress(),parseEther('1'))).wait();
await (await priorityBrain.connect(settlement).reservePositionRisk(fundedA,parseEther('100'),101,201)).wait();
await (await priorityBrain.connect(settlement).reservePositionCollateral(legacyB,await heart.getAddress(),parseEther('1'))).wait();
await (await priorityBrain.connect(settlement).settlePositionCollateral(legacyB,parseEther('100'),0)).wait();
assert.equal(await priorityBrain.playerClaimable(await heart.getAddress()),parseEther('100'));
assert.equal(await priorityBrain.claimSettlement.staticCall(legacyB),0n,'claim cannot spend still-reserved cash');
assert.equal(await priorityBrain.reservedSettlementLiability(),parseEther('100'));
await (await priorityBrain.connect(settlement).settlePositionCollateral(fundedA,parseEther('100'),0)).wait();
assert.equal(await priorityBrain.principalOf(await user.getAddress()),parseEther('101'),'funded A receives its full earmarked payout');
assert.equal(await priorityBrain.playerClaimable(await user.getAddress()),0n);
assert.equal(await priorityBrain.playerClaimable(await heart.getAddress()),parseEther('100'),'unfunded legacy B remains pending');
assert.equal(await priorityBrain.settlementCapital(),0n);
assert.equal(await priorityBrain.reservedSettlementLiability(),0n);
assert.equal(await priorityBrain.totalPrincipal(),parseEther('102'));
assert.equal(await token.balanceOf(priorityBrain.target),await priorityBrain.custodyReservedBalance(),'custodied cash conservation');
assert.equal(await priorityBrain.solvent(),true);
await (await priorityBrain.connect(user).withdrawMargin(parseEther('101'))).wait();
await (await priorityBrain.fundSettlementCapital(parseEther('100'))).wait();
await (await priorityBrain.claimSettlement(legacyB,{gasLimit:300_000})).wait();
await (await priorityBrain.connect(heart).withdrawMargin(parseEther('101'))).wait();
assert.equal(await priorityBrain.totalPlayerClaimable(),0n);
assert.equal(await priorityBrain.totalPrincipal(),0n);
assert.equal(await token.balanceOf(priorityBrain.target),0n);

// Funding uses actual received amount even for a fee-on-transfer asset.
await (await token.setTaxBps(100)).wait();
await (await token.mint(await admin.getAddress(),parseEther('200'))).wait();
await (await token.approve(migrated.target,parseEther('200'))).wait();
await (await migrated.fundSettlementCapital(parseEther('100'))).wait();
await (await migrated.fundInsurance(parseEther('100'))).wait();
assert.equal(await migrated.settlementCapital(),parseEther('99'));
assert.equal(await migrated.insuranceReserve(),parseEther('99'));
assert.equal(await migrated.freeSurplus(),0n);
assert.equal(await token.balanceOf(migrated.target),parseEther('198'));
console.log('[brain-v4-evm] PASS: funded capital, aggregate reservation, A/B/C isolation, partial claims/repayment, debt-safe exits, actual ancestor UUPS upgrade');
await eip1193.disconnect();
