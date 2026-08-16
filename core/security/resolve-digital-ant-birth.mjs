import fs from "node:fs/promises";
import { verifyDigitalAntWalletBinding } from "./wallet-binding.mjs";
import { DigitalLifeBirthResolver, JsonRpcClient } from "../birth/digital-life-birth-resolver.mjs";
import { EtherscanBscHistoryIndexer } from "../integrations/bsc-history-indexer.mjs";

try {
  const binding = verifyDigitalAntWalletBinding();
  const seed = JSON.parse(await fs.readFile(new URL("../data/canonical.json", import.meta.url), "utf8"));
  const life = seed.lives.find((item) => item.life_id === "DIGITAL_ANT_0001");
  const historyIndexer = process.env.ETHERSCAN_API_KEY ? new EtherscanBscHistoryIndexer({ apiKey: process.env.ETHERSCAN_API_KEY }) : null;
  const resolver = new DigitalLifeBirthResolver({
    rpc: new JsonRpcClient({ url: process.env.BSC_RPC_URL ?? "https://bsc-dataseed.bnbchain.org" }),
    historyIndexer,
    tokens: { KGEN: seed.contracts.KGEN_TOKEN.address, KAIOS: seed.contracts.KAIOS_TOKEN.address }
  });
  const result = await resolver.resolveWithBinding({ life, binding });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error?.details?.binding_status ?? error?.code ?? "STOP"}\n`);
  process.exitCode = 1;
}
