/*
 * KGEN Universe Runtime — Wallet Module V1.0
 * Delegates to KGEN_Wallet; adds pair/treasury read helpers
 */
(function(global) {
  'use strict';

  var WalletRuntime = {
    get core() { return global.KGEN_Wallet || null; },

    formatAddr: function(a) {
      if (this.core) return this.core.formatAddr(a);
      if (!a) return '--';
      return a.slice(0, 6) + '…' + a.slice(-4);
    },

    connect: async function(statusBus) {
      if (!this.core) throw new Error('KGEN_Wallet not loaded');
      var bus = statusBus || global.KGEN_UNIVERSE_STATUS_BUS;
      var addr = await this.core.connect(bus && bus.domBus ? bus.domBus : bus);
      if (addr && bus) bus.emit('wallet:connected', { addr: addr });
      return addr;
    },

    readKGENBalance: async function(addr) {
      var token = global.KGEN_5D && global.KGEN_5D.ADDR && global.KGEN_5D.ADDR.KGEN_TOKEN;
      if (!this.core || !token) return null;
      return this.core.readERC20Balance(token, addr || this.core.addr);
    },

    readBNBBalance: async function(addr) {
      if (!this.core) return null;
      return this.core.readBNBBalance(addr || this.core.addr);
    },

    ethCall: async function(to, data) {
      var eth = this.core && this.core.getEthereum && this.core.getEthereum();
      if (!eth) return null;
      try {
        return await eth.request({ method: 'eth_call', params: [{ to: to, data: data }, 'latest'] });
      } catch (e) { return null; }
    },

    readERC20BalanceRaw: async function(tokenAddr, userAddr) {
      if (!userAddr || !tokenAddr) return null;
      var sig = '0x70a08231';
      var padded = '000000000000000000000000' + userAddr.replace('0x', '').toLowerCase();
      var res = await this.ethCall(tokenAddr, sig + padded);
      if (!res || res === '0x') return '0';
      try {
        var raw = parseInt(res, 16);
        return (raw / 1e18).toFixed(4);
      } catch (e) { return null; }
    },
  };

  global.KGEN_UNIVERSE_WALLET = WalletRuntime;
})(window);
