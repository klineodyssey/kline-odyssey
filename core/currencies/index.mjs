import { requireFields, requireId } from "../shared/schema.mjs";
import { invariant } from "../shared/errors.mjs";

export function validateCurrency(currency) {
  requireFields(currency, ["currency_id", "name", "civilization_scale", "chain_id", "contract_address", "status"], "Currency");
  requireId(currency.currency_id, "currency_id");
  invariant(currency.contract_address === null || /^0x[0-9a-fA-F]{40}$/.test(currency.contract_address), "INVALID_CURRENCY_ADDRESS", "Currency contract address must be null or valid");
  invariant(currency.status !== "DEPLOYED" || currency.contract_address, "DEPLOYED_WITHOUT_ADDRESS", "A deployed currency requires a verified contract address");
  invariant(currency.status !== "MAINNET_LIVE" || currency.currency_id === "BNB" || currency.contract_address, "MAINNET_LIVE_WITHOUT_ADDRESS", "A live token requires a verified contract address; native BNB is the only addressless exception");
  invariant(currency.currency_id !== "BNB" || (currency.chain_id === 56 && currency.contract_address === null && currency.mass_class === "DARK_MATTER_MASS"), "INVALID_NATIVE_BNB", "BNB must be the addressless BSC dark-matter currency");
  return currency;
}

export function createCurrencyRegistry(store, createRegistry) {
  return createRegistry({ domain: "CURRENCY", stream: "ASSET", idField: "currency_id", validate: validateCurrency, store });
}
