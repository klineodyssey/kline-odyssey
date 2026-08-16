(function(root, factory){
  const api = factory();
  if(typeof module === "object" && module.exports) module.exports = api;
  if(root) root.KGENContractResolver = api;
})(typeof window !== "undefined" ? window : globalThis, function(){
  "use strict";

  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const REASONS = Object.freeze({
    UNSUPPORTED_CHAIN: "UNSUPPORTED_CHAIN",
    CURRENT_HEART_PENDING: "CURRENT_HEART_PENDING",
    INVALID_ADDRESS: "INVALID_ADDRESS",
    NO_CODE: "NO_CODE",
    VERSION_UNREADABLE: "VERSION_UNREADABLE",
    VERSION_MISMATCH: "VERSION_MISMATCH",
    LEGACY_CURRENT_COLLISION: "LEGACY_CURRENT_COLLISION"
  });

  function normalizeChainId(value){
    if(typeof value === "number") return value;
    if(typeof value === "bigint") return Number(value);
    if(value && typeof value.toNumber === "function") return value.toNumber();
    if(typeof value === "string") return value.toLowerCase().startsWith("0x") ? parseInt(value, 16) : parseInt(value, 10);
    return NaN;
  }

  function networkFor(config, chainId){
    const normalized = normalizeChainId(chainId);
    return config && config.networks ? config.networks[String(normalized)] || null : null;
  }

  function addressOf(entry){
    if(!entry) return null;
    return typeof entry === "string" ? entry : entry.address || null;
  }

  function isUsableAddress(address){
    return typeof address === "string" && /^0x[a-fA-F0-9]{40}$/.test(address) && address.toLowerCase() !== ZERO_ADDRESS;
  }

  function isCodePresent(code){
    return typeof code === "string" && !/^0x0*$/.test(code);
  }

  function isAllowedVersion(version, allowed){
    if(typeof version !== "string") return false;
    const rules = Array.isArray(allowed) && allowed.length ? allowed : ["3.4.x"];
    return rules.some(function(rule){
      if(rule === "3.4.x") return /^3\.4\.\d+$/.test(version);
      if(rule.endsWith(".x")) return version.startsWith(rule.slice(0, -1));
      return version === rule;
    });
  }

  function validateSeparation(network){
    const legacy = addressOf(network && network.legacyHeart);
    const current = addressOf(network && network.currentHeart);
    if(legacy && current && legacy.toLowerCase() === current.toLowerCase()){
      return { ok: false, reason: REASONS.LEGACY_CURRENT_COLLISION };
    }
    return { ok: true, reason: null };
  }

  function validateCurrentHeart(input){
    const network = input && input.network;
    if(!network) return { ok: false, writeEnabled: false, reason: REASONS.UNSUPPORTED_CHAIN };
    const separation = validateSeparation(network);
    if(!separation.ok) return { ok: false, writeEnabled: false, reason: separation.reason };
    const address = addressOf(network.currentHeart);
    if(!address) return { ok: false, writeEnabled: false, reason: REASONS.CURRENT_HEART_PENDING };
    if(!isUsableAddress(address)) return { ok: false, writeEnabled: false, reason: REASONS.INVALID_ADDRESS };
    if(!isCodePresent(input.code)) return { ok: false, writeEnabled: false, reason: REASONS.NO_CODE, address: address };
    if(!input.version) return { ok: false, writeEnabled: false, reason: REASONS.VERSION_UNREADABLE, address: address };
    if(!isAllowedVersion(input.version, input.allowedVersions)){
      return { ok: false, writeEnabled: false, reason: REASONS.VERSION_MISMATCH, address: address, version: input.version };
    }
    return { ok: true, writeEnabled: true, reason: null, address: address, version: input.version };
  }

  async function fetchJson(url, fetcher){
    const response = await (fetcher || fetch)(url, { cache: "no-store" });
    if(!response.ok) throw new Error("CONFIG_FETCH_FAILED:" + response.status);
    return response.json();
  }

  async function loadSources(options){
    const opts = options || {};
    const pair = await Promise.all([
      fetchJson(opts.configUrl || "./config/contracts.json", opts.fetcher),
      fetchJson(opts.abiUrl || "./abi/temple-heart.json", opts.fetcher)
    ]);
    return { config: pair[0], abiDocument: pair[1], abi: Array.isArray(pair[1]) ? pair[1] : pair[1].abi };
  }

  async function resolveCurrentHeart(options){
    const opts = options || {};
    const chainId = normalizeChainId(opts.chainId != null ? opts.chainId : (await opts.provider.getNetwork()).chainId);
    const network = networkFor(opts.config, chainId);
    if(!network) return Object.assign(validateCurrentHeart({ network: null }), { chainId: chainId, network: null });
    const separation = validateSeparation(network);
    if(!separation.ok) return Object.assign({ ok: false, writeEnabled: false }, separation, { chainId: chainId, network: network });
    const address = addressOf(network.currentHeart);
    if(!address) return { ok: false, writeEnabled: false, reason: REASONS.CURRENT_HEART_PENDING, chainId: chainId, network: network, address: null };
    if(!isUsableAddress(address)) return { ok: false, writeEnabled: false, reason: REASONS.INVALID_ADDRESS, chainId: chainId, network: network, address: address };

    let code = "0x";
    try{ code = await opts.provider.getCode(address); }catch(_){ code = "0x"; }
    if(!isCodePresent(code)) return { ok: false, writeEnabled: false, reason: REASONS.NO_CODE, chainId: chainId, network: network, address: address };

    let contract;
    let version = null;
    try{
      contract = opts.contractFactory ? opts.contractFactory(address, opts.abi, opts.provider) : new opts.ethers.Contract(address, opts.abi, opts.provider);
      version = await contract.version();
    }catch(error){
      return { ok: false, writeEnabled: false, reason: REASONS.VERSION_UNREADABLE, chainId: chainId, network: network, address: address, error: error };
    }

    return Object.assign(validateCurrentHeart({
      network: network,
      code: code,
      version: version,
      allowedVersions: opts.config.allowedTempleHeartVersions
    }), { chainId: chainId, network: network, contract: contract, code: code });
  }

  function reasonMessage(reason){
    const messages = {};
    messages[REASONS.UNSUPPORTED_CHAIN] = "目前網路不支援，請切換 BSC Mainnet 或 BSC Testnet。";
    messages[REASONS.CURRENT_HEART_PENDING] = "新版財神心臟尚未啟用";
    messages[REASONS.INVALID_ADDRESS] = "新版財神心臟地址無效";
    messages[REASONS.NO_CODE] = "新版財神心臟地址沒有合約程式碼";
    messages[REASONS.VERSION_UNREADABLE] = "新版財神心臟版本無法讀取";
    messages[REASONS.VERSION_MISMATCH] = "新版財神心臟版本不相容";
    messages[REASONS.LEGACY_CURRENT_COLLISION] = "Legacy 與 Current Heart 設定衝突";
    return messages[reason] || "新版財神心臟尚未啟用";
  }

  return {
    ZERO_ADDRESS: ZERO_ADDRESS,
    REASONS: REASONS,
    normalizeChainId: normalizeChainId,
    networkFor: networkFor,
    addressOf: addressOf,
    isUsableAddress: isUsableAddress,
    isCodePresent: isCodePresent,
    isAllowedVersion: isAllowedVersion,
    validateSeparation: validateSeparation,
    validateCurrentHeart: validateCurrentHeart,
    loadSources: loadSources,
    resolveCurrentHeart: resolveCurrentHeart,
    reasonMessage: reasonMessage
  };
});
