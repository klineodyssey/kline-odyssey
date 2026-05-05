const hre = require("hardhat");

async function verifyContract(address, constructorArguments) {
  try {
    await hre.run("verify:verify", {
      address,
      constructorArguments,
    });
    console.log(`Verified: ${address}`);
  } catch (err) {
    const msg = err?.message || String(err);
    if (
      msg.includes("Already Verified") ||
      msg.includes("already verified")
    ) {
      console.log(`Already verified: ${address}`);
      return;
    }
    throw err;
  }
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const KGEN_TOKEN = process.env.KGEN_TOKEN;
  const TREASURY = process.env.TREASURY;
  const NEXT_PAYROLL_AT = process.env.NEXT_PAYROLL_AT
    ? Number(process.env.NEXT_PAYROLL_AT)
    : 0;

  const NEW_OWNER = process.env.NEW_OWNER;
  const CONFIRMATIONS = process.env.CONFIRMATIONS
    ? Number(process.env.CONFIRMATIONS)
    : 5;

  if (!KGEN_TOKEN) throw new Error("Missing env: KGEN_TOKEN");
  if (!TREASURY) throw new Error("Missing env: TREASURY");
  if (!NEW_OWNER) throw new Error("Missing env: NEW_OWNER");

  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("KGEN_TOKEN:", KGEN_TOKEN);
  console.log("TREASURY:", TREASURY);
  console.log("NEW_OWNER:", NEW_OWNER);

  // =========================
  // 1️⃣ Deploy Brain
  // =========================
  const Brain = await hre.ethers.getContractFactory("KGEN_BrainExchange_V3_2_0");
  const brain = await Brain.deploy(KGEN_TOKEN, TREASURY, NEXT_PAYROLL_AT);
  await brain.waitForDeployment();
  const brainAddress = await brain.getAddress();
  console.log("Brain:", brainAddress);

  await brain.deploymentTransaction().wait(CONFIRMATIONS);

  // =========================
  // 2️⃣ Deploy Heart
  // =========================
  const Heart = await hre.ethers.getContractFactory("KGEN_TempleHeart_V3_2_3");
  const heart = await Heart.deploy();
  await heart.waitForDeployment();
  const heartAddress = await heart.getAddress();
  console.log("Heart:", heartAddress);

  await heart.deploymentTransaction().wait(CONFIRMATIONS);

  // =========================
  // 3️⃣ Initialize
  // =========================
  console.log("Initializing...");
  await (await brain.setTempleHeart(heartAddress)).wait();
  await (await heart.setToken(KGEN_TOKEN)).wait();
  await (await heart.setBrainVault(brainAddress)).wait();

  // =========================
  // 4️⃣ Safety Check（關鍵）
  // =========================
  const kgenOnHeart = await heart.kgen();
  const brainVaultOnHeart = await heart.brainVault();
  const templeHeartOnBrain = await brain.templeHeart();

  if (kgenOnHeart.toLowerCase() !== KGEN_TOKEN.toLowerCase()) {
    throw new Error("❌ heart.kgen mismatch");
  }
  if (brainVaultOnHeart.toLowerCase() !== brainAddress.toLowerCase()) {
    throw new Error("❌ heart.brainVault mismatch");
  }
  if (templeHeartOnBrain.toLowerCase() !== heartAddress.toLowerCase()) {
    throw new Error("❌ brain.templeHeart mismatch");
  }

  console.log("✅ Safety check passed");

  // =========================
  // 5️⃣ Verify
  // =========================
  console.log("Verifying...");
  await verifyContract(brainAddress, [KGEN_TOKEN, TREASURY, NEXT_PAYROLL_AT]);
  await verifyContract(heartAddress, []);

  // =========================
  // 6️⃣ Transfer Ownership（宇宙交棒）
  // =========================
  console.log("Transferring ownership...");
  await (await brain.transferOwnership(NEW_OWNER)).wait();
  await (await heart.transferOwnership(NEW_OWNER)).wait();

  console.log("Owner →", NEW_OWNER);

  // =========================
  // FINAL SUMMARY
  // =========================
  console.log("\n=== DEPLOY COMPLETE ===");
  console.log("Brain:", brainAddress);
  console.log("Heart:", heartAddress);
  console.log("Owner:", NEW_OWNER);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
