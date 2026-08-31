export function buildKgenKaiosMarketView({ orderBook, preview = null, settlementState = null } = {}) {
  const quote = orderBook?.quote ?? {};
  const settlement = settlementState ?? {};
  return Object.freeze({
    pair: "KGEN/KAIOS",
    marketStatus: quote.twoSided ? "QUOTING" : "WAITING_FOR_TWO_SIDED_BOOK",
    bestBid: quote.bestBid ?? null,
    bestAsk: quote.bestAsk ?? null,
    midpoint: quote.midpoint ?? null,
    spread: quote.spread ?? null,
    spreadBps: quote.spreadBps ?? null,
    quoteHealth: quote.quoteHealth ?? "UNKNOWN",
    bids: Object.freeze([...(orderBook?.bids ?? [])]),
    asks: Object.freeze([...(orderBook?.asks ?? [])]),
    preview: preview ? Object.freeze({
      side: preview.side,
      requestedKgen: preview.requestedKgen,
      fillableKgen: preview.fillableKgen,
      kaiosAmount: preview.kaiosAmount,
      averagePriceKaiosPerKgen: preview.averagePriceKaiosPerKgen,
      slippageBps: preview.slippageBps,
      fullyFillable: preview.fullyFillable,
      withinDefaultSlippageGate: preview.withinDefaultSlippageGate,
      executionStatus: preview.executionStatus
    }) : null,
    settlement: Object.freeze({
      ct: settlement.ct ?? null,
      ctMeaning: settlement.ctMeaning ?? "NO_VERIFIED_SETTLEMENT_YET",
      pendingTrades: settlement.pendingTrades ?? 0,
      verifiedTrades: settlement.verifiedTrades ?? 0,
      volumeKgen: settlement.volumeKgen ?? "0",
      volumeKaios: settlement.volumeKaios ?? "0",
      candles: Object.freeze([...(settlement.candles ?? [])]),
      productionReceiptRegistry: settlement.productionReceiptRegistry ?? "NOT_CONNECTED",
      chainWrite: settlement.chainWrite ?? false,
      signer: settlement.signer ?? false
    }),
    labels: Object.freeze({
      buy: "BUY KGEN / PAY KAIOS",
      sell: "SELL KGEN / RECEIVE KAIOS",
      matched: "MATCHED_UNSETTLED",
      settled: "VERIFIED_SETTLED",
      receiptGate: "BOTH KAIOS + KGEN RECEIPTS STATUS=1 REQUIRED"
    })
  });
}

export function renderKgenKaiosMarketHtml(view) {
  const esc = (value) => String(value ?? "—").replace(/[&<>\"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const rows = (orders) => orders.length
    ? orders.map((o) => `<tr><td>${esc(o.price)}</td><td>${esc(o.remaining)}</td><td>${esc(o.lifeId ?? "VERIFIED_ACTOR")}</td></tr>`).join("")
    : `<tr><td colspan="3">NO ORDERS</td></tr>`;
  const preview = view.preview
    ? `<section><h4>PREVIEW</h4><p>${esc(view.preview.side)} ${esc(view.preview.requestedKgen)} KGEN → ${esc(view.preview.kaiosAmount)} KAIOS · AVG ${esc(view.preview.averagePriceKaiosPerKgen)} · SLIPPAGE ${esc(view.preview.slippageBps)} bps</p><p>${esc(view.preview.executionStatus)}</p></section>`
    : `<section><h4>PREVIEW</h4><p>NO PREVIEW</p></section>`;
  return `<div data-market="KGEN/KAIOS">
    <header><h3>K11520 · KGEN/KAIOS</h3><p>${esc(view.marketStatus)} · ${esc(view.quoteHealth)}</p></header>
    <div><strong>BEST BID</strong> ${esc(view.bestBid)} · <strong>BEST ASK</strong> ${esc(view.bestAsk)} · <strong>MID</strong> ${esc(view.midpoint)} · <strong>SPREAD</strong> ${esc(view.spread)} (${esc(view.spreadBps)} bps)</div>
    <div class="market-books"><section><h4>BIDS</h4><table><tbody>${rows(view.bids)}</tbody></table></section><section><h4>ASKS</h4><table><tbody>${rows(view.asks)}</tbody></table></section></div>
    ${preview}
    <section><h4>SETTLEMENT</h4><p>CT ${esc(view.settlement.ct)} · VERIFIED ${esc(view.settlement.verifiedTrades)} · PENDING ${esc(view.settlement.pendingTrades)} · VOL ${esc(view.settlement.volumeKgen)} KGEN / ${esc(view.settlement.volumeKaios)} KAIOS</p><p>${esc(view.labels.receiptGate)}</p><p>REGISTRY ${esc(view.settlement.productionReceiptRegistry)} · SIGNER ${esc(view.settlement.signer)} · CHAIN_WRITE ${esc(view.settlement.chainWrite)}</p></section>
  </div>`;
}
