export async function buildPortfolio({ ownerId, assetRegistry, lifeLedger, companyLedger, store }) {
  const assets = (await assetRegistry.list()).filter((asset) => asset.owner_id === ownerId || asset.controller_id === ownerId);
  const events = (await store.allEvents()).filter((event) => event.actor_id === ownerId || event.subject_id === ownerId);
  const settled = events.filter((event) => event.event_type === "ORDER_SETTLED");
  return Object.freeze({
    owner_id: ownerId,
    assets,
    life_ledger: lifeLedger?.owner_id === ownerId ? lifeLedger : null,
    company_ledger: companyLedger?.owner_id === ownerId ? companyLedger : null,
    settled_transactions: settled,
    valuation_status: "NOT_DEPLOYED"
  });
}
