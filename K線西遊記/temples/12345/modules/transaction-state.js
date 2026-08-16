(function(root, factory){
  const api = factory();
  if(typeof module === "object" && module.exports) module.exports = api;
  if(root) root.KGENTransactionState = api;
})(typeof window !== "undefined" ? window : globalThis, function(){
  "use strict";

  const STATES = Object.freeze({
    READY: "READY",
    WALLET_CONFIRM: "WALLET_CONFIRM",
    PENDING: "PENDING",
    CONFIRMED: "CONFIRMED",
    REVERTED: "REVERTED"
  });

  function errorMessage(error){
    if(!error) return "UNKNOWN_ERROR";
    return error.reason || error.data && error.data.message || error.error && error.error.message || error.message || String(error);
  }

  class TransactionController {
    constructor(options){
      const opts = options || {};
      this.onChange = typeof opts.onChange === "function" ? opts.onChange : function(){};
      this.explorer = opts.explorer || null;
      this.state = null;
      this.reset();
    }

    emit(next){
      this.state = Object.freeze(Object.assign({}, this.state || {}, next, { updatedAt: new Date().toISOString() }));
      this.onChange(this.state);
      return this.state;
    }

    reset(action){
      return this.emit({ state: STATES.READY, action: action || null, hash: null, link: null, explorerUrl: null, receipt: null, error: null });
    }

    setExplorer(explorer){ this.explorer = explorer || null; }
    snapshot(){ return this.state; }
    fail(error){ return this.emit({ state: STATES.REVERTED, error: errorMessage(error) }); }

    async run(options, sender){
      const opts = typeof options === "string" ? { action: options, send: sender } : options || {};
      this.reset(opts.action || "TRANSACTION");
      this.emit({ state: STATES.WALLET_CONFIRM });
      try{
        const tx = await opts.send();
        if(!tx || !tx.hash || typeof tx.wait !== "function") throw new Error("INVALID_TRANSACTION_RESPONSE");
        const explorer = opts.explorer || this.explorer;
        const link = explorer ? explorer.replace(/\/$/, "") + "/tx/" + tx.hash : null;
        this.emit({ state: STATES.PENDING, hash: tx.hash, link: link, explorerUrl: link });
        const receipt = await tx.wait();
        const status = receipt && receipt.status;
        if(!(status === 1 || status === "0x1" || status === 1n)) throw new Error("RECEIPT_STATUS_FAILED");
        this.emit({ state: STATES.CONFIRMED, receipt: receipt });
        if(typeof opts.afterConfirmed === "function") await opts.afterConfirmed(receipt);
        return receipt;
      }catch(error){
        this.emit({ state: STATES.REVERTED, error: errorMessage(error) });
        throw error;
      }
    }
  }

  return { STATES: STATES, TransactionController: TransactionController, errorMessage: errorMessage };
});
