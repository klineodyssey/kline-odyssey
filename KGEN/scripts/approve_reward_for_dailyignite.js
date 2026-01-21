// scripts/approve_reward_for_dailyignite.js
const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("Signer:", signer.address);

  const KGEN = "0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be";
  const DAILY = process.env.DAILY_IGNITE;
  if (!DAILY) throw new Error("Set env DAILY_IGNITE");

  const kgen = await hre.ethers.getContractAt("IERC20", KGEN);

  // 先給大額 allowance，避免你天天調整
  const allowance = hre.ethers.parseUnits("1000000", 18); // 1,000,000 KGEN
  const tx = await kgen.approve(DAILY, allowance);
  console.log("approve tx:", tx.hash);
  await tx.wait();
  console.log("approve OK");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});