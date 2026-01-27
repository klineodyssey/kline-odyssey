// KGEN/scripts/ignite_hourly.js
// Hourly Heartbeat Trigger
// KGEN Universe — PrimeForge Autopilot

const hre = require("hardhat");

async function main() {
  const DAILY_IGNITE_ADDRESS = "0x__________"; 
  // ↑ 之後 deploy 完 DailyIgnite 合約再填入

  const signer = (await hre.ethers.getSigners())[0];
  console.log("Signer:", signer.address);

  const DailyIgnite = await hre.ethers.getContractAt(
    "KGEN_DailyIgnite_V1",
    DAILY_IGNITE_ADDRESS,
    signer
  );

  const tx = await DailyIgnite.igniteHourly();
  console.log("igniteHourly tx sent:", tx.hash);

  await tx.wait();
  console.log("igniteHourly confirmed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});