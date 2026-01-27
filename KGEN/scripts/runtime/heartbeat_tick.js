// scripts/heartbeat_tick.js
const hre = require("hardhat");

async function main() {
  const hbAddr = process.env.HEARTBEAT_ADDR;
  if (!hbAddr) throw new Error("Missing env HEARTBEAT_ADDR");

  const hb = await hre.ethers.getContractAt("KGEN_Heartbeat_V1", hbAddr);

  // 每次跑：先 tickHour，再 tickDay（若同一小時/同一天已打過會 revert）
  try {
    const tx1 = await hb.tickHour();
    console.log("tickHour tx:", tx1.hash);
    await tx1.wait();
  } catch (e) {
    console.log("tickHour skipped:", e.message?.slice(0, 120));
  }

  try {
    const tx2 = await hb.tickDay();
    console.log("tickDay tx:", tx2.hash);
    await tx2.wait();
  } catch (e) {
    console.log("tickDay skipped:", e.message?.slice(0, 120));
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});