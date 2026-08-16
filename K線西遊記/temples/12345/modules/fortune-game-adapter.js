(function(root, factory){
  const api = factory();
  if(typeof module === "object" && module.exports) module.exports = api;
  if(root) root.KGENFortuneGameAdapter = api;
})(typeof window !== "undefined" ? window : globalThis, function(){
  "use strict";

  const PENDING_MESSAGE = "漲跌遊戲建設中";

  function evaluateReadiness(input){
    const state = input || {};
    if(!state.configAddress) return { ready: false, reason: "ADDRESS_PENDING", message: PENDING_MESSAGE };
    if(!state.heartAddress || String(state.heartAddress).toLowerCase() !== String(state.configAddress).toLowerCase()){
      return { ready: false, reason: "HEART_CONFIG_MISMATCH", message: PENDING_MESSAGE };
    }
    if(!state.codeExists) return { ready: false, reason: "NO_CODE", message: PENDING_MESSAGE };
    if(!state.abiLoaded) return { ready: false, reason: "ABI_PENDING", message: PENDING_MESSAGE };
    if(!state.heartOperational) return { ready: false, reason: "HEART_BELOW_1888", message: "悟空心臟低於 1888 KGEN，漲跌遊戲暫停，等待補血。" };
    if(!state.versionCompatible) return { ready: false, reason: "VERSION_MISMATCH", message: PENDING_MESSAGE };
    return { ready: true, reason: null, message: "READY" };
  }

  async function inspect(options){
    const opts = options || {};
    const network = opts.network || {};
    const configured = network.fortuneGame && network.fortuneGame.address;
    if(!configured) return evaluateReadiness({ configAddress: null });
    let heartAddress = null;
    let operational = false;
    try{
      heartAddress = await opts.heartContract.fortuneGame();
      operational = await opts.heartContract.isHeartGameOperational();
    }catch(_){
      return evaluateReadiness({ configAddress: configured });
    }
    const code = await opts.provider.getCode(configured).catch(function(){ return "0x"; });
    return evaluateReadiness({
      configAddress: configured,
      heartAddress: heartAddress,
      codeExists: !!code && !/^0x0*$/.test(code),
      abiLoaded: Array.isArray(opts.abi) && opts.abi.length > 0,
      heartOperational: !!operational,
      versionCompatible: !!opts.versionCompatible
    });
  }

  return { PENDING_MESSAGE: PENDING_MESSAGE, evaluateReadiness: evaluateReadiness, inspect: inspect };
});
