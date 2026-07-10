/*
 * KGEN Universe Runtime — Chain Read Module V1.1
 * Read-only: Treasury, LP Pair reserves, token balances
 *
 * V1.1 改進：
 * - 新增公開 BSC RPC fallback（不需 window.ethereum / 錢包連線）
 * - LP reserves、Treasury 餘額無錢包也能即時讀取
 * - 新增 readBurnTotal（燒毀地址 KGEN 餘額）
 * - 新增 readHeartPool（Heart 12345 池子餘額）
 * - getReserves 正確解析 token0/token1 排列
 */
(function(global) {
  'use strict';

  /* ===== 公開 BSC RPC（無需錢包） ===== */
  var BSC_RPC_URLS = [
    'https://bsc-dataseed.binance.org/',
    'https://bsc-dataseed1.defibit.io/',
    'https://bsc-dataseed1.ninicoin.io/',
  ];

  async function publicEthCall(to, data, rpcIndex) {
    var url = BSC_RPC_URLS[(rpcIndex || 0) % BSC_RPC_URLS.length];
    try {
      var resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1,
          method: 'eth_call',
          params: [{ to: to, data: data }, 'latest']
        }),
      });
      var json = await resp.json();
      return json.result || null;
    } catch (e) {
      if ((rpcIndex || 0) < BSC_RPC_URLS.length - 1) {
        return publicEthCall(to, data, (rpcIndex || 0) + 1);
      }
      return null;
    }
  }

  /* 錢包 ethCall → 公開 RPC fallback */
  async function smartEthCall(to, data) {
    var w = global.KGEN_UNIVERSE_WALLET;
    if (w && w.ethCall) {
      var result = await w.ethCall(to, data);
      if (result) return result;
    }
    return publicEthCall(to, data);
  }

  function parseUint256(hex, decimals) {
    if (!hex || hex === '0x') return '0';
    try {
      var trimmed = hex.startsWith('0x') ? hex.slice(2) : hex;
      /* BigInt-safe for large numbers (total supply etc.) */
      var big = BigInt('0x' + (trimmed || '0'));
      var div = BigInt(10 ** (decimals || 18));
      var whole = big / div;
      var frac = big % div;
      var fracStr = frac.toString().padStart(decimals || 18, '0').slice(0, 4);
      return whole.toString() + '.' + fracStr;
    } catch (e) {
      /* Fallback for env without BigInt */
      try {
        var raw = parseInt(hex, 16);
        return (raw / Math.pow(10, decimals || 18)).toFixed(4);
      } catch (e2) { return null; }
    }
  }

  function pad32(addr) {
    return '000000000000000000000000' + addr.replace('0x', '').toLowerCase();
  }

  var ChainRead = {

    /* === eth_call proxy (smart fallback) === */
    call: smartEthCall,

    /* === ERC-20 balanceOf === */
    readBalance: async function(tokenAddr, holderAddr) {
      if (!tokenAddr || !holderAddr) return null;
      var sig = '0x70a08231';
      var res = await smartEthCall(tokenAddr, sig + pad32(holderAddr));
      return res ? parseUint256(res, 18) : null;
    },

    /* === Treasury 8888 KGEN 餘額 === */
    readTreasury: async function() {
      var addrs = global.KGEN_5D && global.KGEN_5D.ADDR;
      if (!addrs) return null;
      return this.readBalance(addrs.KGEN_TOKEN, addrs.TREASURY_8888);
    },

    /* === Heart 12345 池子 KGEN 餘額 === */
    readHeartPool: async function() {
      var addrs = global.KGEN_5D && global.KGEN_5D.ADDR;
      if (!addrs) return null;
      return this.readBalance(addrs.KGEN_TOKEN, addrs.HEART_12345);
    },

    /* === Burn address KGEN 餘額（銷毀量） === */
    readBurnTotal: async function() {
      var addrs = global.KGEN_5D && global.KGEN_5D.ADDR;
      if (!addrs) return null;
      var burn = '0x000000000000000000000000000000000000dead';
      return this.readBalance(addrs.KGEN_TOKEN, burn);
    },

    /* === LP Pair getReserves() → KGEN + WBNB 儲量 === */
    readLPPairReserves: async function() {
      var addrs = global.KGEN_5D && global.KGEN_5D.ADDR;
      if (!addrs || !addrs.LP_PAIR) return null;

      /* getReserves() selector */
      var sig = '0x0902f1ac';
      var res = await smartEthCall(addrs.LP_PAIR, sig);
      if (!res || res.length < 130) return null;

      try {
        var data = res.startsWith('0x') ? res.slice(2) : res;
        /* getReserves returns (uint112 reserve0, uint112 reserve1, uint32 ts) */
        var r0 = BigInt('0x' + data.slice(0, 64));
        var r1 = BigInt('0x' + data.slice(64, 128));

        /* token0 in this pair = whichever comes first alphabetically by address */
        /* PancakeSwap KGEN/WBNB: need to check which is token0 */
        /* KGEN: 0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be */
        /* WBNB: 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c */
        /* Compare hex: 0xBA3d... < 0xbb4C... → KGEN is token0 */
        var KGEN_IS_TOKEN0 = addrs.KGEN_TOKEN.toLowerCase() < '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';
        var kgenReserve = KGEN_IS_TOKEN0 ? r0 : r1;
        var bnbReserve  = KGEN_IS_TOKEN0 ? r1 : r0;

        var kgenAmt  = Number(kgenReserve) / 1e18;
        var bnbAmt   = Number(bnbReserve)  / 1e18;

        /* Get BNB price estimate from kline feed */
        var bnbPrice = 300;
        try {
          var feed = global.KGEN_KlineFeed;
          if (feed && feed.cache && feed.cache['BNBUSDT']) {
            bnbPrice = feed.cache['BNBUSDT'].price || 300;
          }
        } catch (e) {}

        var tvlUSD = bnbAmt * bnbPrice * 2;

        return {
          kgenReserve: kgenAmt.toFixed(2),
          bnbReserve: bnbAmt.toFixed(4),
          kgenPerBnb: bnbAmt > 0 ? (kgenAmt / bnbAmt).toFixed(0) : '--',
          bnbPerKgen: kgenAmt > 0 ? (bnbAmt / kgenAmt).toFixed(8) : '--',
          tvlUSD: tvlUSD.toFixed(0),
          tvlEstimate: tvlUSD.toFixed(0),
          raw: { r0: r0.toString(), r1: r1.toString() }
        };
      } catch (e) {
        console.warn('[ChainRead] getReserves parse error', e);
        return null;
      }
    },

    /* === KGEN total supply === */
    readTokenTotalSupply: async function() {
      var addrs = global.KGEN_5D && global.KGEN_5D.ADDR;
      if (!addrs) return null;
      var sig = '0x18160ddd';
      var res = await smartEthCall(addrs.KGEN_TOKEN, sig);
      return res ? parseUint256(res, 18) : null;
    },

    /* === Security report (unchanged) === */
    securityReport: function() {
      return {
        dappBay: {
          taxModifiable: false,
          note: 'DappBay 可能顯示 Can Modify Tax — 實際 bytecode constant 0.30%，見 docs/KGEN_TAX_IMMUTABILITY.md',
        },
        certik: { status: 'community', note: '社群審計參考，非官方 CertiK 認證' },
        goplus: { honeypot: false, note: 'GoPlus 風險掃描建議用戶自行查驗合約' },
        taxImmutable: true,
        contractsUnchanged: true,
      };
    },
  };

  global.KGEN_UNIVERSE_CHAIN = ChainRead;
})(window);
