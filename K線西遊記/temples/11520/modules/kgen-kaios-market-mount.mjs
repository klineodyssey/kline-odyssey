import { createKgenKaiosSpotMarket } from "./kgen-kaios-spot-market.mjs";
import { createKgenKaiosSettlementAdapter } from "./kgen-kaios-settlement-adapter.mjs";
import { buildKgenKaiosMarketView, renderKgenKaiosMarketHtml } from "./kgen-kaios-market-view.mjs";

const PANEL_ID = "kgen-kaios-spot-panel";
const market = createKgenKaiosSpotMarket();
const settlement = createKgenKaiosSettlementAdapter();

export function getKgenKaiosFrontendSnapshot() {
  return buildKgenKaiosMarketView({
    orderBook: market.getOrderBook(20),
    settlementState: settlement.getMarketSettlementState()
  });
}

export function renderKgenKaiosFrontendPanel() {
  const view = getKgenKaiosFrontendSnapshot();
  return `<section id="${PANEL_ID}" class="section kgen-kaios-spot-panel" data-production-trading="false">
    <div class="section-title"><h2>K11520 · KGEN/KAIOS SPOT</h2><span class="badge not">PRODUCTION FAIL-CLOSED</span></div>
    <div class="notice">KGEN/KAIOS order-book, quote and settlement state are visible here. Production actor evidence, secure signer, KAIOS payment rail, KGEN ownership transfer and exact-chain receipt registry are not connected; therefore this panel cannot place real orders, transfer assets or claim settlement.</div>
    <article class="card">${renderKgenKaiosMarketHtml(view)}</article>
  </section>`;
}

export function mountKgenKaiosFrontendPanel(root = document) {
  const content = root.querySelector?.("#content");
  if (!content) return false;
  const route = globalThis.location?.hash?.replace(/^#\/?/, "").split("/").filter(Boolean)[0]?.toUpperCase() || "HOME";
  const existing = root.querySelector?.(`#${PANEL_ID}`);
  if (route !== "TOKENS") {
    existing?.remove();
    return false;
  }
  if (existing) return true;
  content.insertAdjacentHTML("beforeend", renderKgenKaiosFrontendPanel());
  return true;
}

function scheduleMount() {
  queueMicrotask(() => mountKgenKaiosFrontendPanel(document));
  setTimeout(() => mountKgenKaiosFrontendPanel(document), 0);
}

if (typeof document !== "undefined") {
  addEventListener("hashchange", scheduleMount);
  addEventListener("load", scheduleMount, { once: true });
  const observer = new MutationObserver(() => {
    if ((location.hash || "").toUpperCase().includes("TOKENS")) mountKgenKaiosFrontendPanel(document);
  });
  const content = document.querySelector("#content");
  if (content) observer.observe(content, { childList: true });
  scheduleMount();
}
