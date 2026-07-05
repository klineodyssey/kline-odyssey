/*
 * KGEN Universe Runtime — Camera Module V1.0
 * 2D pan/zoom for canvas world map and game viewport
 */
(function(global) {
  'use strict';

  function Camera(opts) {
    opts = opts || {};
    this.x = opts.x || 0;
    this.y = opts.y || 0;
    this.zoom = opts.zoom || 1;
    this.minZoom = opts.minZoom || 0.4;
    this.maxZoom = opts.maxZoom || 3;
    this.targetX = this.x;
    this.targetY = this.y;
    this.smooth = opts.smooth !== false;
  }

  Camera.prototype.panTo = function(x, y) {
    this.targetX = x;
    this.targetY = y;
    if (!this.smooth) { this.x = x; this.y = y; }
  };

  Camera.prototype.setZoom = function(z) {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, z));
  };

  Camera.prototype.tick = function(dt) {
    if (!this.smooth) return;
    var t = Math.min(1, (dt || 16) / 200);
    this.x += (this.targetX - this.x) * t;
    this.y += (this.targetY - this.y) * t;
  };

  Camera.prototype.apply = function(ctx, w, h) {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  };

  Camera.prototype.restore = function(ctx) {
    ctx.restore();
  };

  Camera.prototype.screenToWorld = function(sx, sy, w, h) {
    return {
      x: (sx - w / 2) / this.zoom + this.x,
      y: (sy - h / 2) / this.zoom + this.y,
    };
  };

  global.KGEN_UNIVERSE_CAMERA = Camera;
})(window);
