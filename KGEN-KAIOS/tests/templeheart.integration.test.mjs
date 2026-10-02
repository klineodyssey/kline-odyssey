import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import * as ethers from "ethers";
import { resolveTempleHeartLineage, verifyTempleHeartCandidate, prepareTempleHeartCandidateCall, readTempleHeartLegacyContinuity } from "../../core/integrations/temple-heart-12345.mjs";
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

test("legacy continuity is block-bound and never resets claims or invents new-proxy allowance", async () => {
  const account = "0x0000000000000000000000000000000000000001";
  const token = "0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be";
  const calls = [];
  let failRead = false;
  const fake = {...ethers, Contract:class {
    constructor(){return new Proxy({}, {get:(_,name)=>async(...args)=>{
      assert.equal(args.at(-1).blockTag,123);
      calls.push(name);
      if (failRead && name === "lampExpireAt") throw new Error("READ_UNAVAILABLE");
      if (name === "kgen") return token;
      if (name === "festivalClaimed") return args[0] === 1;
      if (name === "newYearCountdownClaimed") return args[2] === 7;
      return 99n;
    }});}
  }};
  const provider = {getNetwork:async()=>({chainId:56}),getBlock:async()=>({number:123,hash:id("BLOCK"),timestamp:1790959101})};
  const state = await readTempleHeartLegacyContinuity({ethers:fake,provider,walletAddress:account});
  assert.equal(state.festivalClaimed[1],true);
  assert.equal(state.newYearCountdownClaimed[7],true);
  assert.equal(state.lampExpireAt,"99");
  assert.equal(state.newProxyAllowance,"NOT_INHERITED");
  assert.equal(state.newProxyStorageWritten,false);
  assert.equal(calls.filter(n=>n === "newYearCountdownClaimed").length,10);
  failRead = true;
  await assert.rejects(readTempleHeartLegacyContinuity({ethers:fake,provider,walletAddress:account}),/READ_UNAVAILABLE/);
});

test("reward-token callback cannot reenter heartbeat or alter Fortune accounting", async () => {
  const context = await setupLineage();
  context.kgen = await deploy("ReentrantMockKGEN",context.owner,[await context.owner.getAddress()]);
  const {heart} = await deployTempleHeart(context);
  const user = context.signers[2];
  await (await context.kgen.transfer(await heart.getAddress(),21000n * ETHER)).wait();
  await (await heart.connect(user).makeWish(id("REENTRANT-WISH"),id("REENTRANT-CIV"))).wait();
  await (await context.kgen.arm(await heart.getAddress(),heart.interface.encodeFunctionData("heartbeatClaim"))).wait();
  await (await heart.connect(user).heartbeatClaim()).wait();
  assert.equal(await context.kgen.attackRejected(),true);
  assert.equal(await context.kgen.attackError(),id("ReentrancyGuardReentrantCall()").slice(0,10));
  assert.equal(await heart.totalHeartbeats(),1n);
  assert.equal(await heart.totalFortuneClaimants(),0n);
});

test("fresh V3.4 package deploys locally with atomic proxy initializer, distinct roles and no FortuneGame", async () => {
  const context = await setupLineage({chainId:97});
  const root = path.resolve(import.meta.dirname, "..");
  const owner = await context.owner.getAddress();
  const roleAddresses = await Promise.all(context.signers.slice(1,5).map((s) => s.getAddress()));
  const config = {chainId:97, deployer:owner, admin:roleAddresses[0], upgrader:roleAddresses[1],
    operator:roleAddresses[2], holyCupSigner:roleAddresses[3], kgen:await context.kgen.getAddress(),
    legacyBrainVault:owner, proofSource:await context.kaios.getAddress(), registry:await context.registry.getAddress(),
    treasury11520:await context.exchangeTreasury11520.getAddress(), startNonce:await context.provider.getTransactionCount(owner),
    gasCaps:{implementation:6000000,proxy:1500000,registryInitialization:300000}, maxGasPriceWei:"10000000000"};
  const input = path.join(root, "artifacts", "templeheart-local-package-input.json");
  fs.writeFileSync(input, JSON.stringify(config));
  execFileSync(process.execPath, ["tools/validate-templeheart-storage.mjs", "--deployment-package", input], {cwd:root});
  const pkg = JSON.parse(fs.readFileSync(path.join(root,"artifacts","TEMPLEHEART_DEPLOYMENT_PACKAGE.json")));
  assert.equal(pkg.broadcast,false);
  assert.equal(pkg.caps.kgenTransfer,"0");
  assert.equal(pkg.status,"UNSIGNED_CANDIDATE_NOT_MAINNET_READY");
  for (const [change, expected] of [
    [{chainId:1}, "UNSUPPORTED_CHAIN"],
    [{admin:ethers.ZeroAddress}, "ZERO_ADDRESS:admin"],
    [{fortuneGame:owner}, "FORTUNEGAME_133_HOLD"],
    [{gasCaps:{}}, "MISSING_GAS_CAP:implementation"],
    [{chainId:56}, "KGEN_IDENTITY_MISMATCH"]
  ]) {
    fs.writeFileSync(input, JSON.stringify({...config,...change}));
    assert.throws(() => execFileSync(process.execPath,
      ["tools/validate-templeheart-storage.mjs","--deployment-package",input],
      {cwd:root,stdio:"pipe"}), error => String(error.stderr).includes(expected));
  }
  fs.writeFileSync(input, JSON.stringify(config));
  assert.throws(() => execFileSync(process.execPath,
    ["tools/validate-templeheart-storage.mjs","--deployment-package",input,"--testnet-rehearsal"],
    {cwd:root,stdio:"pipe"}), error => String(error.stderr).includes("ONE_OPERATION_ONLY"));
  for(const [i, step] of pkg.transactions.entries()) {
    const signer = i === 2 ? context.signers[1] : context.owner;
    // LOCAL EVM ONLY. No production/provider URLs or external signers.
    const receipt = await (await signer.sendTransaction({to:step.to,data:step.data,value:0,gasLimit:step.gasLimit})).wait();
    assert.equal(receipt.status,1);
    if(i === 0) assert.equal(receipt.contractAddress,pkg.implementation);
    if(i === 1) assert.equal(receipt.contractAddress,pkg.proxy);
  }
  const roles = Object.fromEntries(["DEFAULT_ADMIN_ROLE","UPGRADER_ROLE","OPERATOR_ROLE","HOLY_CUP_SIGNER_ROLE"].map((r,i) => [r,roleAddresses[i]]));
  const manifest = {chainId:97,proxy:pkg.proxy,implementation:pkg.implementation,roles,
    kgen:config.kgen,registry:config.registry,proofSource:config.proofSource,
    proxyCodeHash:keccak256(await context.provider.getCode(pkg.proxy)),
    implementationCodeHash:keccak256(await context.provider.getCode(pkg.implementation))};
  const verified = await verifyTempleHeartCandidate({ethers,provider:context.provider,manifest});
  assert.equal(verified.status,"CANDIDATE_READ_VERIFIED");
  assert.equal(verified.writeEnabled,false);
  assert.equal(resolveTempleHeartLineage({chainId:56}).address,"0xB016D4d8f1aED1339101b30722cad6dbA9B8C972");
  assert.equal(resolveTempleHeartLineage({chainId:56,mode:"V34_CANDIDATE",manifest}).writeEnabled,false);
  const interfaces = new ethers.Interface(artifact("KGEN_TempleHeart_Upgradeable").abi);
  for(const [action,args,name] of [["WISH",[id("W"),id("C")],"makeWish"],["FORTUNE",[id("P")],"fortuneClaim"],
    ["REPAY_FORTUNE",["9"],"voluntaryRepayFortune"],["HEARTBEAT",[],"heartbeatClaim"],["IGNITE",[],"igniteAndClaim"]]) {
    const call = prepareTempleHeartCandidateCall({ethers,chainId:97,manifest,action,args});
    assert.equal(interfaces.parseTransaction(call).name,name);
    assert.equal(call.status,"PREPARED_NOT_SIGNED");
  }
  for(const action of ["LIGHT","VOW","FESTIVAL","NEW_YEAR","GAME_PAYOUT"]) {
    assert.throws(() => prepareTempleHeartCandidateCall({ethers,chainId:97,manifest,action}),{code:"UNSUPPORTED_V34_ACTION_USE_LEGACY"});
  }
  await assert.rejects(verifyTempleHeartCandidate({ethers,provider:context.provider,manifest:{...manifest,implementationCodeHash:id("FAKE")}}),{code:"IMPLEMENTATION_CODE_MISMATCH"});
  await assert.rejects(verifyTempleHeartCandidate({ethers,provider:context.provider,manifest:{...manifest,roles:{...roles,UPGRADER_ROLE:owner}}}),{code:"ROLE_MISMATCH"});
  const heart = new Contract(pkg.proxy,artifact("KGEN_TempleHeart_Upgradeable").abi,context.signers[1]);
  await rejectsHeart(heart.initializeV340.staticCall(config.registry),heart,"InvalidInitialization");
});

// Decode the named contract error: a generic rejection could hide an unrelated
// balance, RPC or setup failure and would not prove the anti-bot gate.
async function rejectsHeart(call, heart, name) {
  await assert.rejects(call, (error) => {
    const data = error.data ?? error.info?.error?.data?.result;
    assert.equal(heart.interface.parseError(data)?.name, name);
    return true;
  });
}

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

test("BOT_001..005/009: proof reuse, wallet substitution, beneficiary/civilization mismatch and unpaid repeat claim reject", async () => {
  const context = await setupLineage();
  const { heart, implementation } = await deployTempleHeart(context);
  const [user, other] = [context.signers[2], context.signers[3]];
  const civ = id("BOT-CIV"), wish = id("BOT-WISH");
  await mintKaiosByBurningKgen(context, 2n * ETHER);
  await (await context.kgen.transfer(await heart.getAddress(), 21_000n * ETHER)).wait();
  await makeWishAndHolyCup(context, heart, user, civ, wish, "BOT-A");
  await makeWishAndHolyCup(context, heart, other, civ, wish, "BOT-B");
  const proof = await createFortuneProof(context, heart, user, civ, wish, "BOT");
  await rejectsHeart(heart.connect(other).fortuneClaim.staticCall(proof), heart, "BurnerMismatch");
  const redirect = await createFortuneProof(context, heart, user, civ, wish, "REDIRECT", other);
  await rejectsHeart(heart.connect(user).fortuneClaim.staticCall(redirect), heart, "BeneficiaryMismatch");
  await makeWishAndHolyCup(context, heart, user, id("OTHER-CIV"), wish, "BOT-C");
  await rejectsHeart(heart.connect(user).fortuneClaim.staticCall(proof), heart, "CivilizationMismatch");
  await makeWishAndHolyCup(context, heart, user, civ, wish, "BOT-D");
  await (await heart.connect(user).fortuneClaim(proof)).wait();
  await rejectsHeart(heart.connect(user).fortuneClaim.staticCall(proof), heart, "ProofAlreadyConsumed");
  await rejectsHeart(heart.connect(other).fortuneClaim.staticCall(proof), heart, "ProofAlreadyConsumed");
  await advanceTime(context.provider, 30 * 86_400 + 1);
  await makeWishAndHolyCup(context, heart, user, civ, wish, "BOT-E");
  const second = await createFortuneProof(context, heart, user, civ, wish, "SECOND");
  await rejectsHeart(heart.connect(user).fortuneClaim.staticCall(second), heart, "RepaymentRequired");
  assert.equal(await heart.fortuneMaxWhole(), 8n);
  assert.equal(await heart.minimumBurnWholeForFortune(), 1n);
  assert.equal(heart.interface.getFunction("fortuneClaim").format(), "fortuneClaim(bytes32)");
  assert.equal(heart.interface.getFunction("fortuneClaim(uint256)"), null);
  assert.equal(await heart.fortuneGame(), "0x0000000000000000000000000000000000000000");
  // No implementation takeover and no repeated proxy initialization.
  const initArgs = [await context.owner.getAddress(), await context.owner.getAddress(),
    await context.owner.getAddress(), await context.signers[4].getAddress(),
    await context.kgen.getAddress(), await context.owner.getAddress(), await context.kaios.getAddress()];
  await rejectsHeart(implementation.initialize.staticCall(...initArgs), heart, "InvalidInitialization");
  await rejectsHeart(heart.initialize.staticCall(...initArgs), heart, "InvalidInitialization");
  await rejectsHeart(heart.connect(other).upgradeToAndCall.staticCall(await implementation.getAddress(), "0x"), heart, "AccessControlUnauthorizedAccount");
});

test("BOT_007/008: 89 distinct wallets cannot bypass real 88-per-hour/day global caps", async () => {
  const context = await setupLineage({ totalAccounts: 95 });
  const { heart } = await deployTempleHeart(context);
  await (await context.kgen.transfer(await heart.getAddress(), 22_000n * ETHER)).wait();
  const users = context.signers.slice(5, 94);
  for (const [i, user] of users.entries()) {
    await (await heart.connect(user).makeWish(id(`MASS-WISH-${i}`), id(`MASS-CIV-${i}`))).wait();
  }
  // Only the local EVM clock is fixed. No counter/storage injection.
  const start = await moveToNextUtcDay(context, 1);
  for (const user of users.slice(0, 88)) {
    await setTimeRaw(context, start + 1);
    await (await heart.connect(user).heartbeatClaim({ gasLimit: 600_000 })).wait();
    await (await heart.connect(user).igniteAndClaim({ gasLimit: 600_000 })).wait();
  }
  await setTimeRaw(context, start + 1);
  await rejectsHeart(heart.connect(users[88]).heartbeatClaim.staticCall(), heart, "HeartbeatHourFull");
  await rejectsHeart(heart.connect(users[88]).igniteAndClaim.staticCall(), heart, "IgniteDayFull");
  assert.equal(await heart.heartbeatHourClaims(BigInt(Math.floor(start / 3600))), 88n);
  assert.equal(await heart.igniteDayClaims(BigInt(Math.floor(start / 86400))), 88n);
  assert.equal(await heart.totalHeartbeatPaid(), 88n * ETHER);
  assert.equal(await heart.totalIgnitePaid(), 704n * ETHER);
  assert.equal(await context.kgen.balanceOf(await users[88].getAddress()), 0n);
});

test("BOT_006: 501 wallets and real holder-bound proofs cannot bypass the global 500 Fortune epoch cap", async () => {
  const context = await setupLineage({ totalAccounts: 507 });
  const { heart } = await deployTempleHeart(context);
  await mintKaiosByBurningKgen(context, ETHER);
  await (await context.kgen.transfer(await heart.getAddress(), 22_000n * ETHER)).wait();
  const start = Math.floor((await latestTimestamp(context)) / (30 * 86400)) * (30 * 86400) + 3600;
  for (const [i, user] of context.signers.slice(5, 506).entries()) {
    await setTimeRaw(context, start);
    const civ = id(`FORTUNE-CIV-${i}`), wish = id(`FORTUNE-WISH-${i}`);
    await makeWishAndHolyCup(context, heart, user, civ, wish, `MASS-${i}`);
    const proof = await createFortuneProof(context, heart, user, civ, wish, `MASS-${i}`);
    if (i < 500) {
      await (await heart.connect(user).fortuneClaim(proof, { gasLimit: 900_000 })).wait();
    } else {
      await rejectsHeart(heart.connect(user).fortuneClaim.staticCall(proof), heart, "FortuneEpochFull");
      assert.equal(await heart.fortuneBurnProofConsumed(proof), false);
      assert.equal(await context.kgen.balanceOf(await user.getAddress()), 0n);
    }
  }
  assert.equal(await heart.fortuneEpochClaims(BigInt(Math.floor(start / (30 * 86400)))), 500n);
  assert.equal(await heart.totalFortuneClaimants(), 500n);
  assert.equal(await heart.totalFortunePaid(), 500n * ETHER);
});

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
