const { ethers } = require("hardhat");

async function main() {
  const TOKEN = process.env.KGEN_TOKEN;
  const OWNER = process.env.REWARD_VAULT_OWNER; // 建議 mother

  if (!TOKEN) throw new Error("Set env KGEN_TOKEN=0x...");
  if (!OWNER) throw new Error("Set env REWARD_VAULT_OWNER=0x...");

  const [signer] = await ethers.getSigners();
  console.log("deployer signer:", await signer.getAddress());
  console.log("token:", TOKEN);
  console.log("vault owner:", OWNER);

  const Vault = await ethers.getContractFactory("KGEN_RewardVault_V1");
  const vault = await Vault.deploy(OWNER, TOKEN);
  await vault.waitForDeployment();

  console.log("KGEN_RewardVault_V1:", await vault.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});