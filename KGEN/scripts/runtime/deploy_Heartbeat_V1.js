// scripts/deploy_Heartbeat_V1.js
const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("Signer:", signer.address);

  // ✅ 這裡請填 mother（Owner 要交給 mother，不是 deployer）
  const MOTHER_OWNER = process.env.MOTHER_OWNER;
  if (!MOTHER_OWNER) throw new Error("Missing env MOTHER_OWNER");

  const HB = await hre.ethers.getContractFactory("KGEN_Heartbeat_V1");
  const hb = await HB.deploy(MOTHER_OWNER);
  await hb.waitForDeployment();

  console.log("KGEN_Heartbeat_V1:", await hb.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});