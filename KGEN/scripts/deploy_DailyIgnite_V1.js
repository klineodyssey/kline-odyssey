// scripts/deploy_DailyIgnite_V1.js
const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("Signer:", signer.address);

  const MOTHER = "0xcd60bf474e691f2484950a0276eaf507616ca4b9";
  const KGEN   = "0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be";
  const REWARD = "0x0fd21cf643211d067a18a416da219827da26e288";
  const BANK   = "0xfa4d34c46e86058e672936fa03cfd79f4c7a4b3c";

  // 先給一個保守的小額：每日 10 KGEN（你之後可改）
  const dailyBudget = hre.ethers.parseUnits("10", 18);

  // 觸發者拿 30%，剩下 70% 打回 bank（你可改）
  const callerBps = 3000;

  const F = await hre.ethers.getContractFactory("KGEN_DailyIgnite_V1");
  const c = await F.deploy(MOTHER, KGEN, REWARD, BANK, dailyBudget, callerBps);
  await c.waitForDeployment();

  console.log("KGEN_DailyIgnite_V1:", await c.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
