/*
 * KGEN Universe Runtime — Animation Module V1.0
 * Shared rAF ticker for canvas / UI animations
 */
(function(global) {
  'use strict';

  var AnimationRuntime = {
    _callbacks: [],
    _running: false,
    _last: 0,

    add: function(fn) {
      if (this._callbacks.indexOf(fn) < 0) this._callbacks.push(fn);
      this.start();
    },

    remove: function(fn) {
      var i = this._callbacks.indexOf(fn);
      if (i >= 0) this._callbacks.splice(i, 1);
    },

    start: function() {
      if (this._running) return;
      this._running = true;
      this._last = performance.now();
      var self = this;
      function loop(now) {
        if (!self._running) return;
        var dt = now - self._last;
        self._last = now;
        for (var i = 0; i < self._callbacks.length; i++) {
          try { self._callbacks[i](dt, now); } catch (e) { console.warn('[Animation]', e); }
        }
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    },

    stop: function() {
      this._running = false;
    },

    pulse: function(t, speed) {
      return 0.5 + 0.5 * Math.sin((t || 0) * 0.001 * (speed || 1));
    },
  };

  global.KGEN_UNIVERSE_ANIMATION = AnimationRuntime;
})(window);
