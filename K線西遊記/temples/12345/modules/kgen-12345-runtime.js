/*
FILE: modules/kgen-12345-runtime.js
PRODUCT_ID: KGEN-12345-HEART-UI
VERSION: 12345-TEMPLE-RUNTIME-CORE-V2.0-BOOT
PURPOSE: Config + Boot only. UI is owned by KGEN_RUNTIME_CORE (runtime-main.js).
LEGACY: modules/archive/kgen-12345-runtime.legacy.js (quarantined, not loaded)
*/
(function(){
  "use strict";

  window.KGEN_12345_CONFIG = Object.freeze({
    templeId: "12345",
    version: "V2.1.8",
    tag: "12345-TEMPLE-RUNTIME-CORE-V2.1.8",
    chain: {
      KGEN: "0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be",
      HEART: "0xB016D4d8f1aED1339101b30722cad6dbA9B8C972",
      BRAIN: "0xd0605F4EF10e5C1438F11AF9edc36926769239d6",
      MARS: "0x3529dbFbaD465C2269F8096879A1c298d5257298",
      BSC: "0x38",
      RPC: "https://bsc-dataseed.binance.org/"
    },
    assets: {
      heart: "./assets/heart.png",
      front: "./assets/bull-front.png",
      back: "./assets/bear-rear.png",
      core: "./assets/warp-core.png"
    },
    cupKeys: [
      "kgen12345_cup_count_v10492",
      "KGEN_12345_V907_CUP_COUNT",
      "KGEN_12345_V908_CUP_COUNT"
    ]
  });

  /* Wallet provider bridge (no DOM writes) */
  try{
    if(!window.ethereum && window.BinanceChain) window.ethereum = window.BinanceChain;
    if(window.ethereum && Array.isArray(window.ethereum.providers) && window.ethereum.providers.length){
      const pick = window.ethereum.providers.find(p=>p && (p.isBinance || p.isMetaMask || p.isTrust || p.isOKXWallet)) || window.ethereum.providers[0];
      if(pick) window.ethereum = pick;
    }
  }catch(e){}

  function patchAppInitForCore(){
    if(!window.app || window.app.__kgenCorePatched) return;
    window.app.__kgenCorePatched = true;
    const legacyInit = window.app.init;
    window.app.init = function(){
      try{ if(typeof this.initThree === "function") this.initThree(); }catch(e){}
      try{ if(typeof this.buildUI === "function") this.buildUI(); }catch(e){}
      try{ if(typeof this.bind === "function") this.bind(); }catch(e){}
      try{
        if(window.web3){
          if(typeof web3.load === "function") web3.load();
          if(typeof web3.autoDetect === "function") web3.autoDetect();
        }
      }catch(e){}
      try{ if(typeof this.updateWarp === "function") this.updateWarp(33); }catch(e){}
      try{
        window.addEventListener("resize", ()=>{ if(typeof this.onResize === "function") this.onResize(); }, {passive:true});
        if(typeof this.onResize === "function") this.onResize();
      }catch(e){}
    };
    if(typeof legacyInit === "function" && !window.KGEN_RUNTIME_CORE){
      legacyInit.call(window.app);
    }
  }

  function bootShell(){
    patchAppInitForCore();
    if(window.app && typeof window.app.init === "function"){
      window.app.init();
    }
  }

  window.KGEN_12345_BOOT = {
    config: window.KGEN_12345_CONFIG,
    bootShell,
    patchAppInitForCore
  };

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", bootShell);
  }else{
    bootShell();
  }
})();
