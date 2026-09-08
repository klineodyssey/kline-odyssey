import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import solc from 'solc';
import ganache from 'ganache';
import { BrowserProvider, ContractFactory, parseEther } from 'ethers';

const brainPath = 'KGEN/contracts/KGEN_BrainExchange_V4_0_0.sol';
const brainSource = fs.readFileSync(brainPath, 'utf8');
const harnessSource = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "KGEN/contracts/KGEN_BrainExchange_V4_0_0.sol";

contract MockKGEN is ERC20 {
    constructor() ERC20("Mock KGEN", "KGEN") {}
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract MockMarsSeats {
    uint256 public lastReward;
    function notifyReward(uint256 amountWei) external { lastReward = amountWei; }
}

contract BrainV4TestProxy is ERC1967Proxy {
    constructor(address implementation, bytes memory data) ERC1967Proxy(implementation, data) {}
}
`;

function findImports(importPath) {
  const candidates = [importPath, path.join('node_modules', importPath)];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return { contents: fs.readFileSync(candidate, 'utf8') };
  }
  return { error: `Import not found: ${importPath}` };
}

const input = {
  language: 'Solidity',
  sources: {
    [brainPath]: { content: brainSource },
    'KGEN/contracts/tests/BrainV4Harness.sol': { content: harnessSource },
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
  },
};
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
const errors = (output.errors || []).filter((e) => e.severity === 'error');
if (errors.length) throw new Error(errors.map((e) => e.formattedMessage).join('\n'));

function artifact(source, name) {
  const c = output.contracts[source]?.[name];
  assert.ok(c, `missing compiled artifact ${source}:${name}`);
  return { abi: c.abi, bytecode: `0x${c.evm.bytecode.object}` };
}

const brainArtifact = artifact(brainPath, 'KGEN_BrainExchange_V4_0_0');
const mockArtifact = artifact('KGEN/contracts/tests/BrainV4Harness.sol', 'MockKGEN');
const marsArtifact = artifact('KGEN/contracts/tests/BrainV4Harness.sol', 'MockMarsSeats');
const proxyArtifact = artifact('KGEN/contracts/tests/BrainV4Harness.sol', 'BrainV4TestProxy');

const eip1193 = ganache.provider({ logging: { quiet: true }, wallet: { totalAccounts: 10 } });
const provider = new BrowserProvider(eip1193);
const signers = await Promise.all(Array.from({ length: 9 }, (_, i) => provider.getSigner(i)));
const [admin, keeper, pauser, upgrader, treasury, publicGood, heart, user] = signers;

async function deploy(artifact, signer, args = []) {
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  return contract;
}

async function expectRevert(promise, label) {
  let reverted = false;
  try { await promise; } catch { reverted = true; }
  assert.ok(reverted, `expected revert: ${label}`);
}

const token = await deploy(mockArtifact, admin);
const mars = await deploy(marsArtifact, admin);
const implementation = await deploy(brainArtifact, admin);
const now = BigInt((await provider.getBlock('latest')).timestamp);
const init = new ContractFactory(brainArtifact.abi, brainArtifact.bytecode, admin).interface.encodeFunctionData('initialize', [
  token.target,
  await admin.getAddress(),
  await keeper.getAddress(),
  await pauser.getAddress(),
  await upgrader.getAddress(),
  await treasury.getAddress(),
  now,
]);
const proxy = await deploy(proxyArtifact, admin, [implementation.target, init]);
const brain = new (await import('ethers')).Contract(proxy.target, brainArtifact.abi, admin);

await (await brain.setPublicGoodTreasury(await publicGood.getAddress())).wait();
await (await brain.setTempleHeart(await heart.getAddress())).wait();
await (await brain.setMarsSeats(mars.target)).wait();

// Real custody: deposit credits exactly what the contract receives.
await (await token.mint(await user.getAddress(), parseEther('1000'))).wait();
await (await token.connect(user).approve(proxy.target, parseEther('1000'))).wait();
await (await brain.connect(user).depositMargin(parseEther('100'))).wait();
assert.equal(await brain.principalOf(await user.getAddress()), parseEther('100'));
assert.equal(await brain.totalPrincipal(), parseEther('100'));
assert.equal(await brain.solvent(), true);

// Principal cannot be spent by Heart or Treasury operations.
await expectRevert(brain.connect(keeper).supplyHeart(parseEther('1')), 'Heart cannot spend principal');
await expectRevert(brain.sweepToTreasury(parseEther('1')), 'Treasury cannot spend principal');

// Add real surplus and roll payroll: 50% reward liability, 25% Mars, 5% public-good, 20% free surplus.
await (await token.mint(await admin.getAddress(), parseEther('100'))).wait();
await (await token.transfer(proxy.target, parseEther('100'))).wait();
await (await brain.connect(keeper).rollPayroll()).wait();
assert.equal(await brain.totalRewardLiability(), parseEther('50'));
assert.equal(await token.balanceOf(mars.target), parseEther('25'));
assert.equal(await token.balanceOf(await publicGood.getAddress()), parseEther('5'));
assert.equal(await brain.freeSurplus(), parseEther('20'));
assert.equal(await brain.solvent(), true);

// Pull reward pays the user and releases the reserved liability.
assert.equal(await brain.pendingProfit(await user.getAddress()), parseEther('50'));
await (await brain.connect(user).claimProfit()).wait();
assert.equal(await brain.totalRewardLiability(), 0n);
assert.equal(await brain.solvent(), true);

// Emergency pause blocks new deposits, but user exits remain available.
await (await brain.connect(pauser).pause()).wait();
await expectRevert(brain.connect(user).depositMargin(parseEther('1')), 'paused deposit');
await (await brain.connect(user).withdrawMargin(parseEther('10'))).wait();
assert.equal(await brain.principalOf(await user.getAddress()), parseEther('90'));
await (await brain.unpause()).wait();

// 50M is a real hard-cap mechanism; lowering to current principal blocks the next deposit.
await (await brain.setBrainCapacityWhole(90)).wait();
await expectRevert(brain.connect(user).depositMargin(parseEther('1')), 'principal capacity gate');
assert.equal(await brain.totalPrincipal(), parseEther('90'));

// UUPS upgrades must be explicitly scheduled and survive the minimum delay.
const implementation2 = await deploy(brainArtifact, admin);
await (await brain.connect(upgrader).scheduleUpgrade(implementation2.target)).wait();
await expectRevert(brain.connect(upgrader).upgradeToAndCall(implementation2.target, '0x'), 'upgrade timelock');
await eip1193.request({ method: 'evm_increaseTime', params: [2 * 24 * 60 * 60] });
await eip1193.request({ method: 'evm_mine', params: [] });
await (await brain.connect(upgrader).upgradeToAndCall(implementation2.target, '0x')).wait();
assert.equal(await brain.scheduledImplementation(), '0x0000000000000000000000000000000000000000');
assert.equal(await brain.scheduledUpgradeEta(), 0n);
assert.equal(await brain.totalPrincipal(), parseEther('90'));
assert.equal(await brain.solvent(), true);

console.log('[brain-v4-evm] PASS: custody, principal reserve, payroll liability, pause exit, capacity, upgrade timelock');
