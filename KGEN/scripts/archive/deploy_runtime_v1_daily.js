const hre = require("hardhat");

async function main() {
  const KGEN_TOKEN = "0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be";
  const MOTHER    = "0xcd60bf474e691f2484950a0276eaf507616ca4b9";

  // 小獎：例如 1 KGEN（18 decimals）
  const REWARD_AMOUNT = hre.ethers.parseUnits("1", 18);

  // 持有門檻：例如 500 KGEN；想人人可領就填 0
  const MIN_HOLD = hre.ethers.parseUnits("500", 18);

  const [signer] = await hre.ethers.getSigners();
  console.log("Signer:", signer.address);

  // 1) Deploy RewardVault（owner 先給 mother，最符合「母機主控」）
  const Vault = await hre.ethers.getContractFactory("KGEN_RewardVault_V1");
  const vault = await Vault.deploy(KGEN_TOKEN, MOTHER);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log("KGEN_RewardVault_V1:", vaultAddr);

  // 2) Deploy DailyIgnite
  const Daily = await hre.ethers.getContractFactory("KGEN_DailyIgnite_V1");
  const daily = await Daily.deploy(KGEN_TOKEN, vaultAddr, MOTHER, REWARD_AMOUNT, MIN_HOLD);
  await daily.waitForDeployment();
  const dailyAddr = await daily.getAddress();
  console.log("KGEN_DailyIgnite_V1:", dailyAddr);

  // 3) 授權 DailyIgnite 可從 Vault payout（用 mother 這個 owner 來做）
  // 注意：這裡 signer 必須是 mother 的私鑰才行。
  const vaultAsOwner = Vault.attach(vaultAddr).connect(signer);
  const tx = await vaultAsOwner.setDailyIgnite(dailyAddr);
  console.log("setDailyIgnite tx:", tx.hash);
  await tx.wait();
  console.log("OK: Vault authorized DailyIgnite");

  console.log("=== SUMMARY ===");
  console.log("Token:", KGEN_TOKEN);
  console.log("Mother:", MOTHER);
  console.log("Vault:", vaultAddr);
  console.log("Daily:", dailyAddr);
  console.log("NEXT: 從 reward 錢包轉 KGEN 進 Vault，再開始 igniteDaily()");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
