// scripts/ignite_daily.js
const hre = require("hardhat");

async function main() {
  const DAILY = process.env.DAILY_IGNITE;
  if (!DAILY) throw new Error("Set env DAILY_IGNITE");

  const c = await hre.ethers.getContractAt("KGEN_DailyIgnite_V1", DAILY);
  const tx = await c.igniteDaily();
  console.log("igniteDaily tx:", tx.hash);
  await tx.wait();
  console.log("igniteDaily OK");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});