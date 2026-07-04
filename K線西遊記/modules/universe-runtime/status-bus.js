/*
 * KGEN Universe Runtime — Status Bus V1.0
 * Cross-module event bus; wraps KGEN_StatusBus when available
 */
(function(global) {
  'use strict';

  function StatusBusRuntime() {
    this.listeners = {};
    this.history = [];
    this.domBus = null;
  }

  StatusBusRuntime.prototype.on = function(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  };

  StatusBusRuntime.prototype.emit = function(event, payload) {
    var entry = { event: event, payload: payload, ts: Date.now() };
    this.history.unshift(entry);
    if (this.history.length > 50) this.history.length = 50;
    var list = this.listeners[event] || [];
    for (var i = 0; i < list.length; i++) {
      try { list[i](payload, event); } catch (e) { console.warn('[StatusBus]', e); }
    }
    if (this.domBus && typeof this.domBus.push === 'function') {
      var msg = typeof payload === 'string' ? payload : (payload && payload.msg) || event;
      this.domBus.push(msg);
    }
  };

  StatusBusRuntime.prototype.bindDOM = function(elementId) {
    if (global.KGEN_StatusBus) {
      this.domBus = new global.KGEN_StatusBus(elementId);
    }
    return this.domBus;
  };

  global.KGEN_UNIVERSE_STATUS_BUS = new StatusBusRuntime();
})(window);
