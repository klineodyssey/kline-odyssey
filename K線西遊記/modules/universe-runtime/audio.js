/*
 * KGEN Universe Runtime — Audio Module V1.0
 * Single audio engine per page (Web Audio API)
 */
(function(global) {
  'use strict';

  var AudioRuntime = {
    ctx: null,
    nodes: [],
    playing: false,
    track: 'Universe Idle',

    stop: function() {
      this.nodes.forEach(function(n) {
        try { n.stop && n.stop(0); } catch (_) {}
        try { n.disconnect && n.disconnect(); } catch (_) {}
      });
      this.nodes = [];
      if (this.ctx && this.ctx.state !== 'closed') {
        try { this.ctx.close(); } catch (_) {}
      }
      this.ctx = null;
      this.playing = false;
      this.track = 'Stopped';
    },

    playTone: function(freq, type, duration) {
      var Ctx = global.AudioContext || global.webkitAudioContext;
      if (!Ctx) return;
      this.stop();
      var ctx = new Ctx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq || 440;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (duration || 2));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      if (duration) osc.stop(ctx.currentTime + duration);
      this.ctx = ctx;
      this.nodes = [osc, gain];
      this.playing = true;
      this.track = freq + 'Hz';
    },

    playNodeTheme: function(nodeId) {
      var themes = {
        '12345': { freq: 123, type: 'sine' },
        '11520': { freq: 115, type: 'triangle' },
        '16888': { freq: 168, type: 'sawtooth' },
        '18888': { freq: 188, type: 'sine' },
        '18921': { freq: 189, type: 'square' },
        '108000': { freq: 108, type: 'sawtooth' },
      };
      var t = themes[String(nodeId)] || { freq: 440, type: 'sine' };
      this.playTone(t.freq, t.type, 3);
    },
  };

  global.KGEN_UNIVERSE_AUDIO = AudioRuntime;
})(window);
