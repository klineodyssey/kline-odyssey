import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
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
contract MockKGEN is ERC20 { constructor() ERC20("Mock KGEN", "KGEN") {} function mint(address to, uint256 amount) external { _mint(to, amount); } }
contract MockMarsSeats { uint256 public lastReward; function notifyReward(uint256 amountWei) external { lastReward = amountWei; } }
contract BrainV4TestProxy is ERC1967Proxy { constructor(address implementation, bytes memory data) ERC1967Proxy(implementation, data) {} }
`;

function findImports(importPath) { const candidates = [importPath, path.join('node_modules', importPath)]; for (const candidate of candidates) if (fs.existsSync(candidate)) return { contents: fs.readFileSync(candidate, 'utf8') }; return { error: `Import not found: ${importPath}` }; }
const input = { language: 'Solidity', sources: { [brainPath]: { content: brainSource }, 'KGEN/contracts/tests/BrainV4Harness.sol': { content: harnessSource } }, settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'] } } } };
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
const errors = (output.errors || []).filter((e) => e.severity === 'error'); if (errors.length) throw new Error(errors.map((e) => e.formattedMessage).join('\n'));
function artifact(source, name) { const c = output.contracts[source]?.[name]; assert.ok(c, `missing compiled artifact ${source}:${name}`); return { abi: c.abi, bytecode: `0x${c.evm.bytecode.object}`, deployedBytecode: c.evm.deployedBytecode.object }; }
const brainArtifact = artifact(brainPath, 'KGEN_BrainExchange_V4_0_0');
const mockArtifact = artifact('KGEN/contracts/tests/BrainV4Harness.sol', 'MockKGEN');
const marsArtifact = artifact('KGEN/contracts/tests/BrainV4Harness.sol', 'MockMarsSeats');
const proxyArtifact = artifact('KGEN/contracts/tests/BrainV4Harness.sol', 'BrainV4TestProxy');
const runtimeBytes = brainArtifact.deployedBytecode.length / 2; assert.ok(runtimeBytes <= 24_576, `optimized runtime bytecode exceeds EIP-170: ${runtimeBytes} bytes`);

const eip1193 = ganache.provider({ logging: { quiet: true }, wallet: { totalAccounts: 10 } });
const provider = new BrowserProvider(eip1193);
const signers = await Promise.all(Array.from({ length: 9 }, (_, i) => provider.getSigner(i)));
const [admin, keeper, pauser, upgrader, treasury, publicGood, heart, user, settlement] = signers;
async function deploy(artifact, signer, args = []) { const factory = new ContractFactory(artifact.abi, artifact.bytecode, signer); const contract = await factory.deploy(...args); await contract.waitForDeployment(); return contract; }
async function expectRevert(promise, label) { let reverted = false; try { const result = await promise; if (result && typeof result.wait === 'function') await result.wait(); } catch { reverted = true; } assert.ok(reverted, `expected revert: ${label}`); }
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
const lossKey=id('KY-LOSS-1'); await (await brain.connect(settlement).reservePositionCollateral(lossKey,await user.getAddress(),parseEther('20'))).wait(); await (await brain.connect(settlement).settlePositionCollateral(lossKey,-parseEther('15'),0)).wait(); assert.equal(await brain.principalOf(await user.getAddress()),parseEther('75')); assert.equal(await brain.freeSurplus(),parseEther('35'));
const profitKey=id('KZ-PROFIT-1'); await (await brain.connect(settlement).reservePositionCollateral(profitKey,await user.getAddress(),parseEther('20'))).wait(); await (await brain.connect(settlement).settlePositionCollateral(profitKey,parseEther('10'),0)).wait(); assert.equal(await brain.principalOf(await user.getAddress()),parseEther('85')); assert.equal(await brain.freeSurplus(),parseEther('25')); await expectRevert(brain.connect(settlement).settlePositionCollateral(profitKey,parseEther('10'),0),'settlement replay blocked');
const cappedLossKey=id('KX-CAPPED-LOSS'); await (await brain.connect(settlement).reservePositionCollateral(cappedLossKey,await user.getAddress(),parseEther('5'))).wait(); await expectRevert(brain.connect(settlement).settlePositionCollateral(cappedLossKey,-parseEther('6'),0),'loss exceeds locked collateral'); await (await brain.connect(settlement).releasePositionCollateral(cappedLossKey)).wait();
const oversizedProfitKey=id('KY-OVERSIZED-PROFIT'); await (await brain.connect(settlement).reservePositionCollateral(oversizedProfitKey,await user.getAddress(),parseEther('1'))).wait(); await expectRevert(brain.connect(settlement).settlePositionCollateral(oversizedProfitKey,parseEther('26'),0),'profit exceeds real surplus'); await (await brain.connect(settlement).releasePositionCollateral(oversizedProfitKey)).wait();
await (await brain.allocateInsuranceReserve(parseEther('20'))).wait(); assert.equal(await brain.insuranceReserve(),parseEther('20')); assert.equal(await brain.freeSurplus(),parseEther('5'));
const insuredGapKey=id('KX-INSURED-GAP'); await (await brain.connect(settlement).reservePositionCollateral(insuredGapKey,await user.getAddress(),parseEther('5'))).wait(); await (await brain.connect(settlement).settlePositionCollateral(insuredGapKey,-parseEther('5'),parseEther('7'))).wait(); assert.equal(await brain.insuranceReserve(),parseEther('13')); assert.equal(await brain.uncoveredBadDebt(),0n);
const uncoveredGapKey=id('KY-UNCOVERED-GAP'); await (await brain.connect(settlement).reservePositionCollateral(uncoveredGapKey,await user.getAddress(),parseEther('5'))).wait(); await (await brain.connect(settlement).settlePositionCollateral(uncoveredGapKey,-parseEther('5'),parseEther('20'))).wait(); assert.equal(await brain.uncoveredBadDebt(),parseEther('7')); await expectRevert(brain.connect(settlement).reservePositionCollateral(id('BLOCKED-BY-BAD-DEBT'),await user.getAddress(),parseEther('1')),'new risk halted by uncovered bad debt');
await (await token.mint(await admin.getAddress(),parseEther('7'))).wait(); await (await token.approve(proxy.target,parseEther('7'))).wait(); await (await brain.recapitalizeBadDebt(parseEther('7'))).wait(); assert.equal(await brain.uncoveredBadDebt(),0n);
await (await brain.setBrainCapacityWhole(75)).wait(); await expectRevert(brain.connect(user).depositMargin(parseEther('1')),'principal capacity gate');
const implementation2=await deploy(brainArtifact,admin); await (await brain.connect(upgrader).scheduleUpgrade(implementation2.target)).wait(); const eta=await brain.scheduledUpgradeEta(); await expectRevert(brain.connect(upgrader).upgradeToAndCall(implementation2.target,'0x'),'upgrade timelock'); const beforeAdvance=await latestRawTimestamp(); if (beforeAdvance<eta) await eip1193.request({method:'evm_increaseTime',params:[Number((eta-beforeAdvance)+60n)]}); await eip1193.request({method:'evm_mine',params:[]}); await (await brain.connect(upgrader).upgradeToAndCall(implementation2.target,'0x',{gasLimit:1_500_000})).wait(); assert.equal(await brain.totalPrincipal(),parseEther('75')); assert.equal(await brain.solvent(),true);
console.log('[brain-v4-evm] PASS: stable organ path + custody/reservation/surplus/insurance/pause/capacity/upgrade invariants');
