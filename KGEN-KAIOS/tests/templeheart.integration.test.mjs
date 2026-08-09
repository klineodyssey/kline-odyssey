import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { AbiCoder, Contract, Wallet, id, keccak256, toBeHex, zeroPadValue } from "ethers";
import {
  ETHER,
  advanceTime,
  artifact,
  cleanupProviders,
  deploy,
  eventArgs,
  mintKaiosByBurningKgen,
  setupLineage,
} from "./helpers.mjs";

afterEach(cleanupProviders);

async function deployTempleHeart(context) {
  const implementation = await deploy("KGEN_TempleHeart_Upgradeable", context.owner);
  const compiled = artifact("KGEN_TempleHeart_Upgradeable");
  const initData = implementation.interface.encodeFunctionData("initialize", [
    await context.owner.getAddress(),
    await context.owner.getAddress(),
    await context.owner.getAddress(),
    await context.signers[4].getAddress(),
    await context.kgen.getAddress(),
    await context.owner.getAddress(),
    await context.kaios.getAddress(),
  ]);
  const proxy = await deploy("TestERC1967Proxy", context.owner, [await implementation.getAddress(), initData]);
  const heart = new Contract(await proxy.getAddress(), compiled.abi, context.owner);
  await (await heart.initializeV340(await context.registry.getAddress())).wait();
  return {
    implementation,
    proxy,
    heart,
  };
}

async function makeWishAndHolyCup(context, heart, user, civilizationId, wishHash, suffix) {
  await (await heart.connect(user).makeWish(wishHash, civilizationId)).wait();
  const proofId = id(`HOLY-CUP-${suffix}`);
  const latestBlock = await context.provider.getBlock("latest");
  const deadline = BigInt(latestBlock.timestamp + 7 * 24 * 60 * 60);
  const network = await context.provider.getNetwork();
  const holyCupSignerAddress = (await context.signers[4].getAddress()).toLowerCase();
  const signingWallet = new Wallet(context.eip1193.getInitialAccounts()[holyCupSignerAddress].secretKey);
  const signature = await signingWallet.signTypedData(
    {
      name: "KGEN TempleHeart 12345",
      version: "3.4.0",
      chainId: network.chainId,
      verifyingContract: await heart.getAddress(),
    },
    {
      HolyCupProof: [
        { name: "claimant", type: "address" },
        { name: "civilizationId", type: "bytes32" },
        { name: "wishHash", type: "bytes32" },
        { name: "proofId", type: "bytes32" },
        { name: "deadline", type: "uint256" },
      ],
    },
    {
      claimant: await user.getAddress(),
      civilizationId,
      wishHash,
      proofId,
      deadline,
    },
  );
  await (
    await heart.connect(user).submitHolyCupProof(proofId, civilizationId, wishHash, deadline, signature)
  ).wait();
}

async function createFortuneProof(context, heart, user, civilizationId, wishHash, suffix, beneficiary = user) {
  const amount = 1n * ETHER;
  await (await context.kaios.connect(context.treasury).transfer(await user.getAddress(), amount)).wait();
  await (await context.kaios.connect(user).approve(await context.furnace.getAddress(), amount)).wait();
  const destination = await heart.alchemyDestinationCode(await heart.fortunePurposeCode(), wishHash);
  const receipt = await (
    await context.furnace.connect(user).burnForKufo(
      amount,
      await beneficiary.getAddress(),
      civilizationId,
      destination,
    )
  ).wait();
  const proofId = eventArgs(receipt, context.furnace, "AlchemyProofCreated").proofId;
  assert.notEqual(proofId, id(`UNUSED-${suffix}`));
  return proofId;
}

async function moveToNextUtcDay(context, secondOfDay = 0) {
  const timestamp = await latestTimestamp(context);
  const target = (Math.floor(timestamp / 86_400) + 1) * 86_400 + secondOfDay;
  await setTimeRaw(context, target);
  return target - secondOfDay;
}

async function latestTimestamp(context) {
  const block = await context.eip1193.request({ method: "eth_getBlockByNumber", params: ["latest", false] });
  return Number.parseInt(block.timestamp, 16);
}

async function setTimeRaw(context, timestamp) {
  await context.eip1193.request({ method: "evm_setTime", params: [timestamp * 1_000] });
  await context.eip1193.request({ method: "evm_mine", params: [] });
}

async function setUintMappingValue(context, heart, mappingLabel, key, value) {
  const compiled = artifact("KGEN_TempleHeart_Upgradeable");
  const entry = compiled.storageLayout.storage.find((item) => item.label === mappingLabel);
  assert.ok(entry, `missing storage layout entry ${mappingLabel}`);
  const location = keccak256(
    AbiCoder.defaultAbiCoder().encode(["uint256", "uint256"], [key, BigInt(entry.slot)]),
  );
  await context.provider.send("evm_setAccountStorageAt", [
    await heart.getAddress(),
    location,
    zeroPadValue(toBeHex(value), 32),
  ]);
  await context.provider.send("evm_mine", []);
}

test("TempleHeart accepts only a holder-bound KAIOS Alchemy proof with wish-bound destination", async () => {
  const context = await setupLineage({ epochSeconds: 10 });
  const { heart } = await deployTempleHeart(context);
  await mintKaiosByBurningKgen(context, 2n * ETHER);

  const civilizationId = id("CIV-12345");
  const wishHash = id("WISH-12345");
  await (await heart.connect(context.treasury).makeWish(wishHash, civilizationId)).wait();
  const purpose = await heart.offeringPurposeCode(1);
  const destination = await heart.alchemyDestinationCode(purpose, wishHash);
  const amount = 250n * ETHER;
  await (await context.kaios.connect(context.treasury).approve(await context.furnace.getAddress(), amount)).wait();
  const burnReceipt = await (
    await context.furnace.connect(context.treasury).burnForKufo(
      amount,
      await context.treasury.getAddress(),
      civilizationId,
      destination,
    )
  ).wait();
  const proofId = eventArgs(burnReceipt, context.furnace, "AlchemyProofCreated").proofId;

  await (await heart.connect(context.treasury).recordBurnOffering(proofId, 1)).wait();
  assert.equal(await heart.totalOfferingKaiosBurned(), amount);
  assert.equal(await heart.offeringBurnProofConsumed(proofId), true);
  await assert.rejects(heart.connect(context.treasury).recordBurnOffering(proofId, 1));
});

test("TempleHeart rejects beneficiary redirect and mismatched purpose proofs", async () => {
  const context = await setupLineage({ epochSeconds: 10 });
  const { heart } = await deployTempleHeart(context);
  await mintKaiosByBurningKgen(context, 2n * ETHER);
  const civilizationId = id("CIV-ATTACK");
  const wishHash = id("WISH-ATTACK");
  await (await heart.connect(context.treasury).makeWish(wishHash, civilizationId)).wait();
  const purpose = await heart.offeringPurposeCode(1);
  const destination = await heart.alchemyDestinationCode(purpose, wishHash);
  const amount = 100n * ETHER;
  await (await context.kaios.connect(context.treasury).approve(await context.furnace.getAddress(), 2n * amount)).wait();

  const redirectReceipt = await (
    await context.furnace.connect(context.treasury).burnForKufo(
      amount,
      await context.signers[3].getAddress(),
      civilizationId,
      destination,
    )
  ).wait();
  const redirectProof = eventArgs(redirectReceipt, context.furnace, "AlchemyProofCreated").proofId;
  await assert.rejects(heart.connect(context.treasury).recordBurnOffering(redirectProof, 1));

  const mismatchReceipt = await (
    await context.furnace.connect(context.treasury).burnForKufo(
      amount,
      await context.treasury.getAddress(),
      civilizationId,
      id("WRONG-PURPOSE"),
    )
  ).wait();
  const mismatchProof = eventArgs(mismatchReceipt, context.furnace, "AlchemyProofCreated").proofId;
  await assert.rejects(heart.connect(context.treasury).recordBurnOffering(mismatchProof, 1));
});

test("TempleHeart rehearses the exact V3.3.2 to V3.4.0 UUPS upgrade and preserves custom storage", async () => {
  const context = await setupLineage();
  const baseline = await deploy("KGEN_TempleHeart_V3_3_2_Baseline", context.owner);
  const candidateArtifact = artifact("KGEN_TempleHeart_Upgradeable");
  const baselineInitData = baseline.interface.encodeFunctionData("initialize", [
    await context.owner.getAddress(),
    await context.owner.getAddress(),
    await context.owner.getAddress(),
    await context.signers[4].getAddress(),
    await context.kgen.getAddress(),
    await context.owner.getAddress(),
    await context.kaios.getAddress(),
  ]);
  const proxy = await deploy("TestERC1967Proxy", context.owner, [await baseline.getAddress(), baselineInitData]);
  const heart = new Contract(await proxy.getAddress(), candidateArtifact.abi, context.owner);
  const civilizationId = id("CIV-STORAGE");
  const wishHash = id("WISH-STORAGE");
  await (await heart.connect(context.treasury).makeWish(wishHash, civilizationId)).wait();
  const replacement = await deploy("KGEN_TempleHeart_Upgradeable", context.owner);
  assert.equal(await heart.version(), "3.3.2");

  await assert.rejects(
    heart.connect(context.signers[3]).upgradeToAndCall(await replacement.getAddress(), "0x"),
  );
  const v340InitData = replacement.interface.encodeFunctionData("initializeV340", [
    await context.registry.getAddress(),
  ]);
  await (await heart.upgradeToAndCall(await replacement.getAddress(), v340InitData)).wait();
  assert.equal((await heart.activeWish(await context.treasury.getAddress())).wishHash, wishHash);
  assert.equal(await heart.version(), "3.4.0");
  assert.equal(await heart.gameSurvivalGateWhole(), 1_888n);
  assert.equal(await heart.current11520Treasury(), await context.exchangeTreasury11520.getAddress());
  await assert.rejects(heart.initializeAlchemyIntegration(await context.kaios.getAddress()));
});

test("heartbeatClaim pays 1 KGEN, enforces wallet and civilization cooldowns, and preserves the operational floor", async () => {
  const context = await setupLineage();
  const { heart } = await deployTempleHeart(context);
  const userA = context.signers[2];
  const userB = context.signers[3];
  const civilizationId = id("CIV-HEARTBEAT-DUAL");
  await (await heart.connect(userA).makeWish(id("WISH-HB-A"), civilizationId)).wait();
  await (await heart.connect(userB).makeWish(id("WISH-HB-B"), civilizationId)).wait();
  await (await context.kgen.transfer(await heart.getAddress(), 20_001n * ETHER)).wait();

  const before = await context.kgen.balanceOf(await userA.getAddress());
  await (await heart.connect(userA).heartbeatClaim()).wait();
  assert.equal(await context.kgen.balanceOf(await userA.getAddress()), before + ETHER);
  assert.equal(await heart.totalHeartbeats(), 1n);
  assert.equal(await heart.totalHeartbeatPaid(), ETHER);
  await assert.rejects(heart.connect(userA).heartbeatClaim());
  await assert.rejects(heart.connect(userB).heartbeatClaim());

  const contextAtFloor = await setupLineage();
  const { heart: heartAtFloor } = await deployTempleHeart(contextAtFloor);
  await (await heartAtFloor.connect(contextAtFloor.treasury).makeWish(id("WISH-FLOOR"), id("CIV-FLOOR"))).wait();
  await (await contextAtFloor.kgen.transfer(await heartAtFloor.getAddress(), 20_000n * ETHER)).wait();
  await assert.rejects(heartAtFloor.connect(contextAtFloor.treasury).heartbeatClaim());
});

test("heartbeatClaim enforces the global 88-success cap per UTC hour", async () => {
  const context = await setupLineage();
  const { heart } = await deployTempleHeart(context);
  await (await context.kgen.transfer(await heart.getAddress(), 20_100n * ETHER)).wait();
  await (await heart.connect(context.signers[2]).makeWish(id("WISH-HOUR-88"), id("CIV-HOUR-88"))).wait();
  await (await heart.connect(context.signers[3]).makeWish(id("WISH-HOUR-89"), id("CIV-HOUR-89"))).wait();
  const hourIndex = BigInt(Math.floor((await latestTimestamp(context)) / 3_600));
  await setUintMappingValue(context, heart, "heartbeatHourClaims", hourIndex, 87n);
  await (await heart.connect(context.signers[2]).heartbeatClaim()).wait();
  assert.equal(await heart.heartbeatHourClaims(hourIndex), 88n);
  await assert.rejects(heart.connect(context.signers[3]).heartbeatClaim());
});

test("igniteAndClaim accepts UTC 00:00:00 through 00:09:59 and rejects 00:10:00", async () => {
  const context = await setupLineage();
  const { heart } = await deployTempleHeart(context);
  await (await context.kgen.transfer(await heart.getAddress(), 20_100n * ETHER)).wait();
  await (await heart.connect(context.signers[2]).makeWish(id("WISH-IGNITE-599"), id("CIV-IGNITE-599"))).wait();
  await (await heart.connect(context.signers[3]).makeWish(id("WISH-IGNITE-600"), id("CIV-IGNITE-600"))).wait();

  const dayStart = await moveToNextUtcDay(context, 599);
  assert.equal(await heart.connect(context.signers[2]).igniteAndClaim.staticCall(), 8n);
  await setTimeRaw(context, dayStart + 600);
  await assert.rejects(heart.connect(context.signers[3]).igniteAndClaim.staticCall());
});

test("igniteAndClaim enforces wallet, civilization, and global 88-success daily caps", async () => {
  const context = await setupLineage();
  const { heart } = await deployTempleHeart(context);
  await (await context.kgen.transfer(await heart.getAddress(), 20_800n * ETHER)).wait();
  await (await heart.connect(context.signers[2]).makeWish(id("WISH-DAY-A"), id("CIV-DAY-SHARED"))).wait();
  await (await heart.connect(context.signers[3]).makeWish(id("WISH-DAY-B"), id("CIV-DAY-SHARED"))).wait();
  await (await heart.connect(context.signers[6]).makeWish(id("WISH-DAY-88"), id("CIV-DAY-88"))).wait();
  await (await heart.connect(context.signers[7]).makeWish(id("WISH-DAY-89"), id("CIV-DAY-89"))).wait();
  await moveToNextUtcDay(context, 0);
  await (await heart.connect(context.signers[2]).igniteAndClaim({ gasLimit: 500_000 })).wait();
  await assert.rejects(heart.connect(context.signers[3]).igniteAndClaim.staticCall());
  const dayIndex = BigInt(Math.floor((await latestTimestamp(context)) / 86_400));
  await setUintMappingValue(context, heart, "igniteDayClaims", dayIndex, 87n);
  await (await heart.connect(context.signers[6]).igniteAndClaim({ gasLimit: 500_000 })).wait();
  assert.equal(await heart.igniteDayClaims(dayIndex), 88n);
  assert.equal(await heart.totalIgnites(), 2n);
  assert.equal(await heart.totalIgnitePaid(), 16n * ETHER);
  await assert.rejects(heart.connect(context.signers[7]).igniteAndClaim.staticCall());
  await assert.rejects(heart.connect(context.signers[6]).igniteAndClaim.staticCall());
});

test("the 1888 game survival gate closes only Heart-funded game payouts and reopens after replenishment", async () => {
  const context = await setupLineage();
  const { heart } = await deployTempleHeart(context);
  const game = context.signers[2];
  const player = context.signers[3];
  await (await heart.setFortuneGame(await game.getAddress())).wait();
  await (await context.kgen.transfer(await heart.getAddress(), 1_887n * ETHER)).wait();
  assert.equal(await heart.isHeartGameOperational(), false);
  await assert.rejects(heart.connect(game).gamePayout(await player.getAddress(), ETHER));

  await (await context.kgen.transfer(await heart.getAddress(), ETHER)).wait();
  assert.equal(await heart.isHeartGameOperational(), true);
  await assert.rejects(heart.connect(game).gamePayout(await player.getAddress(), ETHER));
  await (await context.kgen.transfer(await heart.getAddress(), ETHER)).wait();
  await (
    await heart.connect(game).gamePayout(await player.getAddress(), ETHER, { gasLimit: 500_000 })
  ).wait();
  assert.equal(await context.kgen.balanceOf(await heart.getAddress()), 1_888n * ETHER);
  assert.equal(await context.kgen.balanceOf(await player.getAddress()), ETHER);
  assert.equal(await heart.baseFloorWhole(), 20_000n);
  assert.equal(await heart.gameSurvivalGateWhole(), 1_888n);
});

test("permissionless normalization returns only excess over 108000 to the registry-governed 11520 treasury", async () => {
  const context = await setupLineage();
  const { heart } = await deployTempleHeart(context);
  const treasury11520 = await context.exchangeTreasury11520.getAddress();
  const legacyBrainVault = await context.owner.getAddress();
  assert.equal(await heart.brainVault(), legacyBrainVault);
  assert.equal(await heart.current11520Treasury(), treasury11520);

  await (await context.kgen.transfer(await heart.getAddress(), 108_005n * ETHER)).wait();
  await (await heart.connect(context.signers[7]).normalizeHeartBalance()).wait();
  assert.equal(await context.kgen.balanceOf(await heart.getAddress()), 108_000n * ETHER);
  assert.equal(await context.kgen.balanceOf(treasury11520), 5n * ETHER);
  assert.equal(await context.kgen.balanceOf(legacyBrainVault), 71_891_995n * ETHER);
});

test("fortune ledger never claws back claims and requires a later voluntary repayment for the next claim", async () => {
  const context = await setupLineage();
  const { heart } = await deployTempleHeart(context);
  const user = context.signers[2];
  const civilizationId = id("CIV-FORTUNE-LEDGER");
  await mintKaiosByBurningKgen(context, 10n * ETHER);
  await (await context.kgen.transfer(await heart.getAddress(), 20_050n * ETHER)).wait();

  const wishOne = id("WISH-FORTUNE-ONE");
  await makeWishAndHolyCup(context, heart, user, civilizationId, wishOne, "ONE");
  const proofOne = await createFortuneProof(context, heart, user, civilizationId, wishOne, "ONE");
  await (await heart.connect(user).fortuneClaim(proofOne)).wait();
  const afterFirstClaim = await context.kgen.balanceOf(await user.getAddress());
  assert.equal(afterFirstClaim, ETHER);
  await assert.rejects(heart.connect(user).fortuneClaim(proofOne));

  await advanceTime(context.provider, 30 * 86_400 + 1);
  const wishTwo = id("WISH-FORTUNE-TWO");
  await makeWishAndHolyCup(context, heart, user, civilizationId, wishTwo, "TWO");
  const proofTwo = await createFortuneProof(context, heart, user, civilizationId, wishTwo, "TWO");
  await assert.rejects(heart.connect(user).fortuneClaim(proofTwo));
  assert.equal(await context.kgen.balanceOf(await user.getAddress()), afterFirstClaim);

  const voluntaryAmount = ETHER / 2n;
  await (await context.kgen.connect(user).approve(await heart.getAddress(), voluntaryAmount)).wait();
  await (await heart.connect(user).voluntaryRepayFortune(voluntaryAmount)).wait();
  const eligible = await heart.nextFortuneEligibility(await user.getAddress());
  assert.equal(eligible.repaymentSatisfied, true);
  await (await heart.connect(user).fortuneClaim(proofTwo)).wait();

  const ledger = await heart.fortuneLedger(await user.getAddress());
  assert.equal(ledger.totalClaimed, 2n * ETHER);
  assert.equal(ledger.totalVoluntaryRepaid, voluntaryAmount);
  assert.equal(ledger.claimCount, 2n);
  assert.equal(ledger.repaymentCount, 1n);
  assert.equal(ledger.repaidAfterLastClaim, false);
  assert.equal(await context.kgen.balanceOf(await user.getAddress()), afterFirstClaim - voluntaryAmount + ETHER);

  const forbiddenNames = ["clawback", "seize", "freeze", "blacklist", "recoverFromPlayer"];
  const functionNames = artifact("KGEN_TempleHeart_Upgradeable").abi
    .filter((entry) => entry.type === "function")
    .map((entry) => entry.name.toLowerCase());
  for (const forbidden of forbiddenNames) {
    assert.equal(functionNames.some((name) => name.includes(forbidden.toLowerCase())), false);
  }
});

test("fortuneClaim rejects beneficiary redirects and preserves proof replay protection", async () => {
  const context = await setupLineage();
  const { heart } = await deployTempleHeart(context);
  const user = context.signers[2];
  const civilizationId = id("CIV-FORTUNE-REDIRECT");
  const wishHash = id("WISH-FORTUNE-REDIRECT");
  await mintKaiosByBurningKgen(context, 3n * ETHER);
  await (await context.kgen.transfer(await heart.getAddress(), 20_010n * ETHER)).wait();
  await makeWishAndHolyCup(context, heart, user, civilizationId, wishHash, "REDIRECT");
  const redirectProof = await createFortuneProof(
    context,
    heart,
    user,
    civilizationId,
    wishHash,
    "REDIRECT",
    context.signers[3],
  );
  await assert.rejects(heart.connect(user).fortuneClaim(redirectProof));
  assert.equal(await heart.fortuneBurnProofConsumed(redirectProof), false);
});

test("customer wallet counters are unique per wallet and daily activity is idempotent", async () => {
  const context = await setupLineage();
  const { heart } = await deployTempleHeart(context);
  const userA = context.signers[2];
  const userB = context.signers[3];
  await (
    await heart.connect(userA).makeWish(id("CUSTOMER-WISH-A1"), id("CUSTOMER-CIV-A"), { gasLimit: 500_000 })
  ).wait();
  await (
    await heart.connect(userA).makeWish(id("CUSTOMER-WISH-A2"), id("CUSTOMER-CIV-A"), { gasLimit: 500_000 })
  ).wait();
  await (
    await heart.connect(userB).makeWish(id("CUSTOMER-WISH-B"), id("CUSTOMER-CIV-B"), { gasLimit: 500_000 })
  ).wait();
  const block = await context.provider.getBlock("latest");
  const dayIndex = BigInt(Math.floor(Number(block.timestamp) / 86_400));
  assert.equal(await heart.totalCustomerWallets(), 2n);
  assert.equal(await heart.dailyNewCustomerWallets(dayIndex), 2n);
  assert.equal(await heart.dailyActiveCustomerWallets(dayIndex), 2n);
  assert.equal(await heart.isCustomerWallet(await userA.getAddress()), true);
});

test("fuzzed voluntary repayments remain player-initiated ledger records rather than a recoverable credit line", async () => {
  const context = await setupLineage();
  const { heart } = await deployTempleHeart(context);
  const user = context.signers[2];
  await (await heart.connect(user).makeWish(id("FUZZ-WISH"), id("FUZZ-CIV"))).wait();
  await (await context.kgen.transfer(await user.getAddress(), 10n * ETHER)).wait();
  await (await context.kgen.connect(user).approve(await heart.getAddress(), 10n * ETHER)).wait();
  let seed = 0x1234_5678;
  let expectedTotal = 0n;
  for (let index = 0; index < 24; index += 1) {
    seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
    const amount = BigInt((seed % 10_000) + 1);
    expectedTotal += amount;
    await (await heart.connect(user).voluntaryRepayFortune(amount, { gasLimit: 500_000 })).wait();
  }
  const ledger = await heart.fortuneLedger(await user.getAddress());
  assert.equal(ledger.totalVoluntaryRepaid, expectedTotal);
  assert.equal(ledger.repaymentCount, 24n);
  assert.equal(ledger.repaidAfterLastClaim, false);
});

test("game payout invariant never permits Heart balance below the independent 1888 survival gate", async () => {
  const context = await setupLineage();
  const { heart } = await deployTempleHeart(context);
  const game = context.signers[2];
  const player = context.signers[3];
  await (await heart.setFortuneGame(await game.getAddress())).wait();
  await (await context.kgen.transfer(await heart.getAddress(), 1_900n * ETHER)).wait();
  let seed = 0x0bad_c0de;
  for (let index = 0; index < 32; index += 1) {
    seed = (seed * 1_103_515_245 + 12_345) >>> 0;
    const amount = BigInt((seed % 4) + 1) * ETHER;
    const before = await context.kgen.balanceOf(await heart.getAddress());
    if (before - amount >= 1_888n * ETHER) {
      await (await heart.connect(game).gamePayout(await player.getAddress(), amount)).wait();
    } else {
      await assert.rejects(heart.connect(game).gamePayout(await player.getAddress(), amount));
    }
    assert.ok((await context.kgen.balanceOf(await heart.getAddress())) >= 1_888n * ETHER);
  }
});
