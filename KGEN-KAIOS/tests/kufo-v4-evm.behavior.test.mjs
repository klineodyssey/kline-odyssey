import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ganache from "ganache";
import {
  BrowserProvider,
  ContractFactory,
  keccak256,
  parseEther,
  toUtf8Bytes,
} from "ethers";

const root = path.resolve(import.meta.dirname, "..");
const artifacts = path.join(root, "artifacts");
const YEAR = 31_556_926;
const OUTPUT_ID = keccak256(toUtf8Bytes("KAIOS.ORGAN.KUFO.OUTPUT.168888"));
const CONVERTER_ID = keccak256(toUtf8Bytes("KAIOS.ORGAN.KSHIP.CONVERTER"));

function artifact(name) {
  return JSON.parse(fs.readFileSync(path.join(artifacts, `${name}.json`), "utf8"));
}

async function deploy(name, signer, args = []) {
  const a = artifact(name);
  const factory = new ContractFactory(a.abi, a.bytecode, signer);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  return contract;
}

async function fixture() {
  const eip1193 = ganache.provider({ logging: { quiet: true }, wallet: { totalAccounts: 6 } });
  const provider = new BrowserProvider(eip1193);
  const owner = await provider.getSigner(0);
  const beneficiary = await provider.getSigner(1);
  const recipient = await provider.getSigner(2);
  const fragmented = await provider.getSigner(3);

  const registry = await deploy("KUFOV4MockOrganRegistry", owner);
  const kufo = await deploy("KUFOV4", owner, [await registry.getAddress()]);
  const output = await deploy("KUFOV4MockOutput", owner);
  const kship = await deploy("KSHIP", owner, [await registry.getAddress(), await kufo.getAddress()]);
  const converter = await deploy("KSHIPConverter", owner, [await kufo.getAddress(), await kship.getAddress()]);

  await (await registry.setOrgan(OUTPUT_ID, await output.getAddress())).wait();
  await (await registry.setOrgan(CONVERTER_ID, await converter.getAddress())).wait();

  return { eip1193, provider, owner, beneficiary, recipient, fragmented, registry, kufo, output, kship, converter };
}

async function increaseTime(eip1193, seconds) {
  await eip1193.request({ method: "evm_increaseTime", params: [seconds] });
  await eip1193.request({ method: "evm_mine", params: [] });
}

test("deployed V4 rejects immature conversion, then mints exact KSHIP after first autumn", async () => {
  const { eip1193, owner, beneficiary, kufo, output, kship, converter } = await fixture();
  const proof = keccak256(toUtf8Bytes("evm-proof-1"));
  const beneficiaryAddress = await beneficiary.getAddress();
  await (await output.mint(await kufo.getAddress(), proof, await owner.getAddress(), parseEther("1"))).wait();

  // Probe the immature path without submitting a transaction. This avoids reusing a
  // failed estimateGas result after Ganache time travel while still exercising the
  // deployed contract's revert behavior.
  await assert.rejects(
    converter.convert.staticCall(parseEther("0.5"), beneficiaryAddress),
  );

  await increaseTime(eip1193, YEAR);
  await (await converter.convert(parseEther("0.5"), beneficiaryAddress, { gasLimit: 1_500_000n })).wait();

  assert.equal(await kufo.balanceOf(await owner.getAddress()), parseEther("0.5"));
  assert.equal(await kship.balanceOf(beneficiaryAddress), parseEther("500"));
  assert.equal(await kship.balanceOf(await owner.getAddress()), 0n);
  assert.equal(await kufo.conservationInvariantHolds(), true);
  assert.equal(await kship.conservationInvariantHolds(), true);
});

test("immediate mint proof is replay-protected and KSHIP proof beneficiary is bound", async () => {
  const { eip1193, owner, beneficiary, kufo, output, kship, converter } = await fixture();
  const proof = keccak256(toUtf8Bytes("evm-proof-replay"));
  await (await output.mint(await kufo.getAddress(), proof, await owner.getAddress(), parseEther("1"))).wait();
  await assert.rejects(
    output.mint(await kufo.getAddress(), proof, await owner.getAddress(), parseEther("1")),
  );

  await increaseTime(eip1193, YEAR);
  await (await converter.convert(parseEther("0.5"), await beneficiary.getAddress())).wait();
  assert.equal(await kship.balanceOf(await beneficiary.getAddress()), parseEther("500"));
  assert.equal(await kship.totalSupply(), parseEther("500"));
});

test("partial transfer preserves lot birth age and second-autumn entitlement", async () => {
  const { eip1193, owner, recipient, kufo, output } = await fixture();
  const proof = keccak256(toUtf8Bytes("evm-proof-split"));
  await (await output.mint(await kufo.getAddress(), proof, await owner.getAddress(), parseEther("1"))).wait();
  await (await kufo.transfer(await recipient.getAddress(), parseEther("0.25"))).wait();

  const ids = await kufo.ownerLotIds(await recipient.getAddress());
  assert.equal(ids.length, 1);
  const child = await kufo.lot(ids[0]);
  assert.equal(child.initialAmount - child.convertedAmount, parseEther("0.25"));

  await increaseTime(eip1193, 2 * YEAR);
  assert.ok((await kufo.claimableDecay(ids[0])) > 0n);
  assert.equal(await kufo.currentAutumn(ids[0]), 2n);
});

test("more than 64 lineage lots fail closed in one transfer", async () => {
  const { fragmented, recipient, kufo, output } = await fixture();
  const holder = await fragmented.getAddress();
  for (let i = 0; i < 65; i += 1) {
    const proof = keccak256(toUtf8Bytes(`lot-${i}`));
    await (await output.mint(await kufo.getAddress(), proof, holder, 1n)).wait();
  }
  assert.equal(await kufo.activeLotCount(holder), 65n);
  await assert.rejects(
    kufo.connect(fragmented).transfer(await recipient.getAddress(), 65n),
  );
  assert.equal(await kufo.balanceOf(holder), 65n);
});
