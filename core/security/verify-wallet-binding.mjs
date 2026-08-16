import { verifyDigitalAntWalletBinding } from "./wallet-binding.mjs";

try {
  const result = verifyDigitalAntWalletBinding();
  process.stdout.write(`${result.binding_status}\n`);
  process.exit(0);
} catch (error) {
  process.stderr.write(`${error?.details?.binding_status ?? "STOP"}\n`);
  process.exit(1);
}
