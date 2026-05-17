/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: kgen-12345-input-governance.js
VERSION: V10.39.2_EXECUTION_MAP_GOVERNANCE
BUILD: 20260517-V10.39.2-EXECUTION-MAP-GOVERNANCE
BASE_FROM: KGEN_12345_V10_39_1_TEMPLE_ARCHITECTURE_MASTER_FULL.zip
RULE: Official filename is fixed. Version is written here, not in filename.
*/
// KGEN 12345 Runtime Governance｜Input Lock
// VERSION: V10.37.5_INPUT_LOCK_RUNTIME_GOVERNANCE
(function(){
  "use strict";
  if (window.__KGEN_12345_INPUT_LOCK_GOVERNANCE__) return;
  window.__KGEN_12345_INPUT_LOCK_GOVERNANCE__ = true;

  const USER_SELECTORS = "input,textarea,select,[contenteditable='true']";

  window.KGEN_INPUT_LOCK = {
    active: false,
    target: null,
    since: 0,
    lock(el){
      this.active = true;
      this.target = el;
      this.since = Date.now();
      document.documentElement.dataset.kgenInputLock = "1";
    },
    unlock(el){
      if (!el || this.target === el) {
        this.active = false;
        this.target = null;
        this.since = 0;
        document.documentElement.dataset.kgenInputLock = "0";
      }
    },
    isLocked(el){
      return !!(this.active && (!el || this.target === el));
    }
  };

  function mark(el){
    if (!el || el.__kgenInputLockBound) return;
    el.__kgenInputLockBound = true;
    el.dataset.kgenUserInput = "1";
    el.autocomplete = "off";
    el.addEventListener("focus", () => window.KGEN_INPUT_LOCK.lock(el), true);
    el.addEventListener("input", () => window.KGEN_INPUT_LOCK.lock(el), true);
    el.addEventListener("keydown", () => window.KGEN_INPUT_LOCK.lock(el), true);
    el.addEventListener("blur", () => {
      setTimeout(() => window.KGEN_INPUT_LOCK.unlock(el), 800);
    }, true);
  }

  const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
  if (desc && desc.set && !HTMLInputElement.prototype.__kgenInputValueGuarded) {
    Object.defineProperty(HTMLInputElement.prototype, "__kgenInputValueGuarded", { value: true });
    Object.defineProperty(HTMLInputElement.prototype, "value", {
      get: desc.get,
      set: function(v){
        if (window.KGEN_INPUT_LOCK && window.KGEN_INPUT_LOCK.isLocked(this) && document.activeElement === this) {
          return;
        }
        return desc.set.call(this, v);
      }
    });
  }

  window.KGEN_SAFE_SET_VALUE = function(el, value){
    if (!el) return false;
    if (window.KGEN_INPUT_LOCK && window.KGEN_INPUT_LOCK.isLocked(el)) return false;
    el.value = value;
    return true;
  };

  function boot(){
    document.querySelectorAll(USER_SELECTORS).forEach(mark);
    document.querySelectorAll("input").forEach(i => {
      if (!i.placeholder || i.placeholder.includes("1 到 888") || i.placeholder.includes("發財金")) {
        i.placeholder = "請自行輸入 KGEN 金額 / 點燈天數";
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  setInterval(boot, 3000);
})();
