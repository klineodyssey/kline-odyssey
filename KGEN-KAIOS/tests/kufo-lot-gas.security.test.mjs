import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { id } from "ethers";
import {
  ETHER,
  advanceTime,
  approveAlchemy,
  cleanupProviders,
  deploy,
  mintKaiosByBurningKgen,
  setupLineage,
} from "./helpers.mjs";

afterEach(cleanupProviders);

test("KUFO dust fragmentation stays transaction-gas bounded and remains recoverable in pages", async () => {
  const context = await setupLineage({ halfLifeSeconds: 10 });
  const holder = context.treasury;
  const holderAddress = await holder.getAddress();
  const other = context.signers[2];
  const otherAddress = await other.getAddress();
  const kufoAddress = await context.kufo.getAddress();
  const converterAddress = await context.converter.getAddress();
  const harness = await deploy("KUFOFragmentationHarness", context.owner);
  const harnessAddress = await harness.getAddress();
  const dustLots = 64n;

  await mintKaiosByBurningKgen(context, 1n * ETHER);
  await approveAlchemy(context, holder, 1n * ETHER);
  await (await context.furnace.connect(holder).burnForKufo(
    1n * ETHER,
    holderAddress,
    id("LIFE-GAS-BOUND"),
    id("DEST-GAS-BOUND"),
  )).wait();

  const initial = 1_000n * ETHER;
  await (await context.kufo.connect(holder).approve(harnessAddress, dustLots)).wait();
  await (await harness.connect(holder).fragmentAndReturn(kufoAddress, dustLots, { gasLimit: 30_000_000 })).wait();
  assert.equal(await context.kufo.activeLotCount(holderAddress), 65n);

  const originalRemainder = initial - dustLots;
  await (await context.kufo.connect(holder).transfer(otherAddress, originalRemainder)).wait();
  await (await context.kufo.connect(other).transfer(holderAddress, originalRemainder)).wait();

  const boundedTransfer = await context.kufo.connect(holder).transfer(otherAddress, dustLots, {
    gasLimit: 8_000_000,
  });
  const boundedTransferReceipt = await boundedTransfer.wait();
  assert.ok(boundedTransferReceipt.gasUsed < 8_000_000n);
  assert.equal(await context.kufo.activeLotCount(otherAddress), 64n);

  await (await context.kufo.connect(holder).transfer(otherAddress, 100n)).wait();
  assert.equal(await context.kufo.activeLotCount(otherAddress), 65n);
  await assert.rejects(context.kufo.claimableDecayOf(otherAddress));
  await assert.rejects(context.kufo.ownerLotIds(otherAddress));
  const firstPage = await context.kufo.ownerLotIdsPage(otherAddress, 0, 64);
  assert.equal(firstPage[0].length, 64);
  assert.notEqual(firstPage[1], 0n);
  const secondPage = await context.kufo.ownerLotIdsPage(otherAddress, firstPage[1], 64);
  assert.equal(secondPage[0].length, 1);
  assert.equal(secondPage[1], 0n);
  await assert.rejects(async () => {
    const transaction = await context.kufo.connect(other).transfer(holderAddress, 65n, {
      gasLimit: 8_000_000,
    });
    await transaction.wait();
  });

  await advanceTime(context.provider, 10);
  await (await context.kufo.connect(other).approve(converterAddress, dustLots)).wait();
  const boundedConversion = await context.converter.connect(other).convert(
    dustLots,
    otherAddress,
    { gasLimit: 8_000_000 },
  );
  const boundedConversionReceipt = await boundedConversion.wait();
  assert.ok(boundedConversionReceipt.gasUsed < 8_000_000n);
  assert.equal(await context.kufo.activeLotCount(otherAddress), 1n);
  assert.equal(await context.kufo.conservationInvariantHolds(), true);
  assert.equal(await context.kship.conservationInvariantHolds(), true);
});
