const DEFAULTS = Object.freeze({
  mouseDragThreshold: 6,
  touchDragThreshold: 10,
  doubleTapMs: 350,
  doubleTapDistance: 24,
  longPressMs: 600,
  keyboardPanStep: 48,
  keyboardZoomFactor: 1.2,
  wheelZoomSpeed: 0.002
});

const INPUT_MODES = Object.freeze({
  MOUSE: "MOUSE",
  TRACKPAD: "TRACKPAD",
  TOUCH: "TOUCH",
  KEYBOARD: "KEYBOARD",
  ASSISTIVE: "ASSISTIVE",
  UNKNOWN: "UNKNOWN"
});

function finiteNumber(value, fallback, name) {
  const number = value === undefined ? fallback : Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`${name} must be a finite number`);
  return number;
}

function positiveNumber(value, fallback, name) {
  const number = finiteNumber(value, fallback, name);
  if (number <= 0) throw new RangeError(`${name} must be greater than zero`);
  return number;
}

function assertSurface(surface) {
  if (!surface || typeof surface.addEventListener !== "function" || typeof surface.removeEventListener !== "function") {
    throw new TypeError("element must be an EventTarget interaction surface");
  }
  if (typeof surface.getBoundingClientRect !== "function") {
    throw new TypeError("element must provide getBoundingClientRect()");
  }
}

function assertCamera(camera) {
  const hasPan = typeof camera?.panByScreenDelta === "function" || typeof camera?.panBy === "function";
  const hasZoom = typeof camera?.zoomAtScreenPoint === "function" || typeof camera?.zoomAt === "function";
  if (!hasPan || !hasZoom) {
    throw new TypeError("camera must provide screen-delta pan and anchored zoom methods");
  }
}

function callback(callbacks, name) {
  const value = callbacks?.[name];
  if (value !== undefined && typeof value !== "function") {
    throw new TypeError(`callbacks.${name} must be a function`);
  }
  return value ?? null;
}

function pointerMode(event) {
  if (event.pointerType === "touch" || event.pointerType === "pen") return INPUT_MODES.TOUCH;
  if (event.pointerType === "mouse") return INPUT_MODES.MOUSE;
  return INPUT_MODES.UNKNOWN;
}

function distance(left, right) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function midpoint(left, right) {
  return { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 };
}

function hitKey(hit) {
  if (hit === null || hit === undefined) return null;
  if (typeof hit === "string" || typeof hit === "number") return String(hit);
  for (const key of ["id", "object_id", "parcel_id", "key"]) {
    if (hit[key] !== null && hit[key] !== undefined) return String(hit[key]);
  }
  return null;
}

function now() {
  return globalThis.performance?.now?.() ?? Date.now();
}

/**
 * Unified browser input adapter for the World Viewer canvas. It emits viewer
 * intents through callbacks and has no ownership, proposal, or business authority.
 */
export class InputController {
  constructor(options = {}) {
    const element = options.element ?? options.canvas;
    assertSurface(element);
    assertCamera(options.camera);
    if (typeof options.hitTest !== "function") throw new TypeError("hitTest must be a function");

    this.element = element;
    this.camera = options.camera;
    this.hitTest = options.hitTest;
    const contextCallback = callback(options.callbacks, "onContext")
      ?? callback(options.callbacks, "onContextRequest");
    const transientBackCallback = callback(options.callbacks, "onTransientBack")
      ?? callback(options.callbacks, "onCloseTransient");
    this.callbacks = Object.freeze({
      onSelect: callback(options.callbacks, "onSelect"),
      onActivate: callback(options.callbacks, "onActivate"),
      onContext: contextCallback,
      onHover: callback(options.callbacks, "onHover"),
      onTransientBack: transientBackCallback,
      onBack: callback(options.callbacks, "onBack"),
      onInputModeChange: callback(options.callbacks, "onInputModeChange"),
      onGestureStart: callback(options.callbacks, "onGestureStart"),
      onGestureEnd: callback(options.callbacks, "onGestureEnd"),
      getActiveTarget: callback(options.callbacks, "getActiveTarget"),
      onError: callback(options.callbacks, "onError")
    });

    this.settings = Object.freeze({
      mouseDragThreshold: positiveNumber(options.mouseDragThreshold, DEFAULTS.mouseDragThreshold, "mouseDragThreshold"),
      touchDragThreshold: positiveNumber(options.touchDragThreshold, DEFAULTS.touchDragThreshold, "touchDragThreshold"),
      doubleTapMs: positiveNumber(options.doubleTapMs, DEFAULTS.doubleTapMs, "doubleTapMs"),
      doubleTapDistance: positiveNumber(options.doubleTapDistance, DEFAULTS.doubleTapDistance, "doubleTapDistance"),
      longPressMs: positiveNumber(options.longPressMs, DEFAULTS.longPressMs, "longPressMs"),
      keyboardPanStep: positiveNumber(options.keyboardPanStep, DEFAULTS.keyboardPanStep, "keyboardPanStep"),
      keyboardZoomFactor: positiveNumber(options.keyboardZoomFactor, DEFAULTS.keyboardZoomFactor, "keyboardZoomFactor"),
      wheelZoomSpeed: positiveNumber(options.wheelZoomSpeed, DEFAULTS.wheelZoomSpeed, "wheelZoomSpeed")
    });

    this._pointers = new Map();
    this._longPressTimers = new Map();
    this._inputMode = INPUT_MODES.UNKNOWN;
    this._lastTap = null;
    this._lastHit = null;
    this._pinch = null;
    this._suppressUntilAllPointersUp = false;
    this._suppressContextMenuUntil = 0;
    this._destroyed = false;

    this._handlers = Object.freeze({
      pointerdown: (event) => this._onPointerDown(event),
      pointermove: (event) => this._onPointerMove(event),
      pointerup: (event) => this._onPointerUp(event),
      pointercancel: (event) => this._onPointerCancel(event),
      lostpointercapture: (event) => this._onLostPointerCapture(event),
      pointerleave: (event) => this._onPointerLeave(event),
      wheel: (event) => this._onWheel(event),
      contextmenu: (event) => this._onContextMenu(event),
      keydown: (event) => this._onKeyDown(event),
      blur: () => this.cancelGestures("window-blur")
    });

    this._bind();
  }

  snapshot() {
    return Object.freeze({
      inputMode: this._inputMode,
      activePointerCount: this._pointers.size,
      pinching: this._pinch !== null,
      suppressingTap: this._suppressUntilAllPointersUp,
      destroyed: this._destroyed
    });
  }

  cancelGestures(reason = "cancel") {
    if (this._destroyed) return;
    for (const pointerId of [...this._pointers.keys()]) this._releasePointer(pointerId);
    this._clearAllLongPresses();
    this._pointers.clear();
    this._pinch = null;
    this._suppressUntilAllPointersUp = false;
    this._lastTap = null;
    this._emit("onGestureEnd", this._context(null, null, { gesture: "CANCEL", reason }));
  }

  destroy() {
    if (this._destroyed) return;
    this.cancelGestures("destroy");
    this.element.removeEventListener("pointerdown", this._handlers.pointerdown);
    this.element.removeEventListener("pointermove", this._handlers.pointermove);
    this.element.removeEventListener("pointerup", this._handlers.pointerup);
    this.element.removeEventListener("pointercancel", this._handlers.pointercancel);
    this.element.removeEventListener("lostpointercapture", this._handlers.lostpointercapture);
    this.element.removeEventListener("pointerleave", this._handlers.pointerleave);
    this.element.removeEventListener("wheel", this._handlers.wheel);
    this.element.removeEventListener("contextmenu", this._handlers.contextmenu);
    this.element.removeEventListener("keydown", this._handlers.keydown);
    globalThis.removeEventListener?.("blur", this._handlers.blur);
    this._lastTap = null;
    this._lastHit = null;
    this._destroyed = true;
  }

  _bind() {
    this.element.addEventListener("pointerdown", this._handlers.pointerdown, { passive: false });
    this.element.addEventListener("pointermove", this._handlers.pointermove, { passive: false });
    this.element.addEventListener("pointerup", this._handlers.pointerup, { passive: false });
    this.element.addEventListener("pointercancel", this._handlers.pointercancel, { passive: false });
    this.element.addEventListener("lostpointercapture", this._handlers.lostpointercapture);
    this.element.addEventListener("pointerleave", this._handlers.pointerleave);
    this.element.addEventListener("wheel", this._handlers.wheel, { passive: false });
    this.element.addEventListener("contextmenu", this._handlers.contextmenu);
    this.element.addEventListener("keydown", this._handlers.keydown);
    globalThis.addEventListener?.("blur", this._handlers.blur);
  }

  _onPointerDown(event) {
    if (this._destroyed || (event.isPrimary === false && event.pointerType === "mouse")) return;
    const isPrimaryAction = event.pointerType !== "mouse" || event.button === 0;
    if (!isPrimaryAction) return;

    event.preventDefault();
    this._setInputMode(pointerMode(event));
    try {
      this.element.focus?.({ preventScroll: true });
    } catch (_) {
      this.element.focus?.();
    }
    const point = this._localPoint(event);
    const record = {
      id: event.pointerId,
      pointerType: event.pointerType || "unknown",
      start: point,
      last: point,
      current: point,
      dragged: false,
      longPressFired: false,
      suppressed: false
    };
    this._pointers.set(event.pointerId, record);
    this._capturePointer(event.pointerId);

    if (this._pointers.size === 1) {
      this._scheduleLongPress(record, event);
      this._emit("onGestureStart", this._context(point, null, { gesture: "POINTER" }, event));
    } else if (this._pointers.size === 2) {
      this._beginPinch(event);
    } else {
      record.suppressed = true;
      this._suppressUntilAllPointersUp = true;
      this._clearAllLongPresses();
    }
  }

  _onPointerMove(event) {
    const record = this._pointers.get(event.pointerId);
    if (this._destroyed) return;
    if (!record) {
      if (event.pointerType === "mouse" || event.pointerType === "pen") {
        const point = this._localPoint(event);
        const hit = this._performHitTest(point, "hover", event);
        this._setInputMode(pointerMode(event));
        this._emit("onHover", this._context(point, hit, { gesture: "HOVER" }, event));
      }
      return;
    }
    event.preventDefault();
    const point = this._localPoint(event);
    record.current = point;

    if (this._pinch !== null && this._pointers.size >= 2) {
      this._updatePinch(event);
      record.last = point;
      return;
    }

    if (this._suppressUntilAllPointersUp || record.suppressed) {
      record.last = point;
      return;
    }

    const threshold = record.pointerType === "touch"
      ? this.settings.touchDragThreshold
      : this.settings.mouseDragThreshold;
    const movedFromStart = distance(record.start, point);

    if (!record.dragged && movedFromStart >= threshold) {
      record.dragged = true;
      this._lastTap = null;
      this._clearLongPress(event.pointerId);
      this._pan(point.x - record.start.x, point.y - record.start.y, "input-drag-start");
    } else if (record.dragged) {
      this._pan(point.x - record.last.x, point.y - record.last.y, "input-drag");
    }
    record.last = point;
  }

  _onPointerUp(event) {
    const record = this._pointers.get(event.pointerId);
    if (!record || this._destroyed) return;
    event.preventDefault();
    record.current = this._localPoint(event);
    this._clearLongPress(event.pointerId);
    this._pointers.delete(event.pointerId);
    this._releasePointer(event.pointerId);

    const suppressTap = this._suppressUntilAllPointersUp || record.suppressed || record.dragged || record.longPressFired;
    if (!suppressTap) this._completeTap(record.current, event);

    if (this._pointers.size < 2) this._pinch = null;
    if (this._pointers.size === 0) {
      this._suppressUntilAllPointersUp = false;
      this._emit("onGestureEnd", this._context(record.current, null, { gesture: record.dragged ? "PAN" : "POINTER" }, event));
    }
  }

  _onPointerCancel(event) {
    if (!this._pointers.has(event.pointerId)) return;
    this._clearLongPress(event.pointerId);
    this._pointers.delete(event.pointerId);
    this._releasePointer(event.pointerId);
    this._lastTap = null;
    this._suppressUntilAllPointersUp = this._pointers.size > 0;
    if (this._pointers.size < 2) this._pinch = null;
    if (this._pointers.size === 0) {
      this._suppressUntilAllPointersUp = false;
      this._emit("onGestureEnd", this._context(null, null, { gesture: "CANCEL", reason: "pointer-cancel" }, event));
    }
  }

  _onLostPointerCapture(event) {
    if (!this._pointers.has(event.pointerId)) return;
    this._onPointerCancel(event);
  }

  _onPointerLeave(event) {
    if (this._destroyed || this._pointers.size > 0) return;
    this._emit("onHover", this._context(null, null, { gesture: "HOVER_LEAVE" }, event));
  }

  _onWheel(event) {
    if (this._destroyed) return;
    event.preventDefault();
    this._lastTap = null;
    const trackpadLike = event.deltaMode === 0 && Math.abs(event.deltaY) < 50;
    this._setInputMode(trackpadLike ? INPUT_MODES.TRACKPAD : INPUT_MODES.MOUSE);
    const deltaScale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 800 : 1;
    const normalizedDelta = event.deltaY * deltaScale;
    const factor = Math.min(2, Math.max(0.5, Math.exp(-normalizedDelta * this.settings.wheelZoomSpeed)));
    const point = this._localPoint(event);
    this._zoom(point, factor, "input-wheel");
  }

  _onContextMenu(event) {
    if (this._destroyed) return;
    event.preventDefault();
    this._lastTap = null;
    if (now() < this._suppressContextMenuUntil) return;
    this._setInputMode(INPUT_MODES.MOUSE);
    const point = this._localPoint(event);
    const hit = this._performHitTest(point, "context", event);
    this._lastHit = hit;
    this._emit("onContext", this._context(point, hit, { gesture: "RIGHT_CLICK" }, event));
  }

  _onKeyDown(event) {
    if (this._destroyed) return;
    const key = event.key;
    const modifiedShortcut = event.altKey || event.ctrlKey || event.metaKey;
    if (modifiedShortcut && !(key === "F10" && event.shiftKey)) return;
    const center = this._viewportCenter();
    let handled = true;
    this._setInputMode(INPUT_MODES.KEYBOARD);

    if (key === "Escape") {
      const context = this._context(center, this._activeTarget(), { gesture: "KEYBOARD", key }, event);
      const transientHandled = this._emit("onTransientBack", context) === true;
      if (!transientHandled) this._emit("onBack", context);
    } else if (key === "Enter") {
      const hit = this._activeTarget();
      this._emit("onActivate", this._context(center, hit, { gesture: "KEYBOARD", key }, event));
    } else if ((key === "F10" && event.shiftKey) || key === "ContextMenu") {
      const hit = this._activeTarget();
      this._emit("onContext", this._context(center, hit, { gesture: "KEYBOARD", key }, event));
    } else if (key === "ArrowLeft") {
      this._pan(this.settings.keyboardPanStep, 0, "input-keyboard-pan");
    } else if (key === "ArrowRight") {
      this._pan(-this.settings.keyboardPanStep, 0, "input-keyboard-pan");
    } else if (key === "ArrowUp") {
      this._pan(0, this.settings.keyboardPanStep, "input-keyboard-pan");
    } else if (key === "ArrowDown") {
      this._pan(0, -this.settings.keyboardPanStep, "input-keyboard-pan");
    } else if (["+", "=", "Add"].includes(key)) {
      this._zoom(center, this.settings.keyboardZoomFactor, "input-keyboard-zoom");
    } else if (["-", "_", "Subtract"].includes(key)) {
      this._zoom(center, 1 / this.settings.keyboardZoomFactor, "input-keyboard-zoom");
    } else {
      handled = false;
    }

    if (handled) event.preventDefault();
  }

  _beginPinch(event) {
    const pointers = [...this._pointers.values()].slice(0, 2);
    for (const pointer of pointers) pointer.suppressed = true;
    this._suppressUntilAllPointersUp = true;
    this._clearAllLongPresses();
    this._lastTap = null;
    this._pinch = {
      distance: Math.max(1, distance(pointers[0].current, pointers[1].current)),
      midpoint: midpoint(pointers[0].current, pointers[1].current)
    };
    this._emit("onGestureStart", this._context(this._pinch.midpoint, null, { gesture: "PINCH" }, event));
  }

  _updatePinch(event) {
    const pointers = [...this._pointers.values()].slice(0, 2);
    if (pointers.length < 2) return;
    const nextDistance = Math.max(1, distance(pointers[0].current, pointers[1].current));
    const nextMidpoint = midpoint(pointers[0].current, pointers[1].current);
    const factor = nextDistance / this._pinch.distance;
    const deltaX = nextMidpoint.x - this._pinch.midpoint.x;
    const deltaY = nextMidpoint.y - this._pinch.midpoint.y;

    if (deltaX !== 0 || deltaY !== 0) {
      this._pan(deltaX, deltaY, "input-pinch-pan");
    }
    if (Number.isFinite(factor) && factor > 0 && factor !== 1) {
      this._zoom(nextMidpoint, factor, "input-pinch-zoom");
    }
    this._pinch = { distance: nextDistance, midpoint: nextMidpoint };
    for (const pointer of pointers) pointer.last = pointer.current;
    event.preventDefault();
  }

  _completeTap(point, event) {
    const hit = this._performHitTest(point, "select", event);
    const key = hitKey(hit);
    const timestamp = now();
    const isDoubleTap = key !== null
      && this._lastTap !== null
      && this._lastTap.key === key
      && timestamp - this._lastTap.time <= this.settings.doubleTapMs
      && distance(point, this._lastTap.point) <= this.settings.doubleTapDistance;

    this._lastHit = hit;
    if (isDoubleTap) {
      this._lastTap = null;
      const gesture = event.pointerType === "mouse" ? "DOUBLE_CLICK" : "DOUBLE_TAP";
      this._emit("onActivate", this._context(point, hit, { gesture }, event));
    } else {
      this._lastTap = { key, point, time: timestamp };
      const gesture = event.pointerType === "mouse" ? "CLICK" : "TAP";
      this._emit("onSelect", this._context(point, hit, { gesture }, event));
    }
  }

  _scheduleLongPress(record, sourceEvent) {
    if (record.pointerType !== "touch" && record.pointerType !== "pen") return;
    const timer = globalThis.setTimeout(() => {
      const current = this._pointers.get(record.id);
      if (!current || current.dragged || current.suppressed || this._pointers.size !== 1 || this._pinch !== null) return;
      current.longPressFired = true;
      this._lastTap = null;
      this._suppressContextMenuUntil = now() + 800;
      const hit = this._performHitTest(current.current, "context", sourceEvent);
      this._lastHit = hit;
      this._emit("onContext", this._context(current.current, hit, { gesture: "LONG_PRESS" }, sourceEvent));
    }, this.settings.longPressMs);
    this._longPressTimers.set(record.id, timer);
  }

  _clearLongPress(pointerId) {
    const timer = this._longPressTimers.get(pointerId);
    if (timer !== undefined) globalThis.clearTimeout(timer);
    this._longPressTimers.delete(pointerId);
  }

  _clearAllLongPresses() {
    for (const pointerId of [...this._longPressTimers.keys()]) this._clearLongPress(pointerId);
  }

  _performHitTest(point, intent, originalEvent) {
    const worldPoint = typeof this.camera.screenToWorld === "function"
      ? this.camera.screenToWorld(point)
      : null;
    return this.hitTest(point, Object.freeze({
      intent,
      inputMode: this._inputMode,
      worldPoint,
      originalEvent
    }));
  }

  _activeTarget() {
    return this.callbacks.getActiveTarget?.() ?? this._lastHit;
  }

  _context(point, hit, extra = {}, originalEvent = null) {
    const worldPoint = point && typeof this.camera.screenToWorld === "function"
      ? this.camera.screenToWorld(point)
      : null;
    return Object.freeze({
      point: point ? Object.freeze({ ...point }) : null,
      worldPoint,
      hit,
      inputMode: this._inputMode,
      originalEvent,
      ...extra
    });
  }

  _localPoint(event) {
    const rect = this.element.getBoundingClientRect();
    return Object.freeze({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  }

  _viewportCenter() {
    const state = typeof this.camera.getState === "function" ? this.camera.getState() : null;
    if (state?.viewport) return Object.freeze({ x: state.viewport.width / 2, y: state.viewport.height / 2 });
    if (Number.isFinite(state?.viewport_width) && Number.isFinite(state?.viewport_height)) {
      return Object.freeze({ x: state.viewport_width / 2, y: state.viewport_height / 2 });
    }
    const rect = this.element.getBoundingClientRect();
    return Object.freeze({ x: rect.width / 2, y: rect.height / 2 });
  }

  _setInputMode(mode) {
    if (mode === this._inputMode) return;
    const previousMode = this._inputMode;
    this._inputMode = mode;
    this._emit("onInputModeChange", Object.freeze({ inputMode: mode, previousMode }));
  }

  _emit(name, payload) {
    try {
      return this.callbacks[name]?.(payload);
    } catch (error) {
      if (name !== "onError" && this.callbacks.onError) {
        try {
          this.callbacks.onError(Object.freeze({ callback: name, error }));
        } catch (reportingError) {
          globalThis.console?.error?.("Input error callback failed", reportingError);
        }
      } else {
        globalThis.console?.error?.(`Input callback failed: ${name}`, error);
      }
      return undefined;
    }
  }

  _pan(deltaX, deltaY, reason) {
    if (typeof this.camera.panByScreenDelta === "function") {
      return this.camera.panByScreenDelta(deltaX, deltaY, { reason });
    }
    return this.camera.panBy(deltaX, deltaY, { reason });
  }

  _zoom(point, factor, reason) {
    if (typeof this.camera.zoomAtScreenPoint === "function") {
      return this.camera.zoomAtScreenPoint(factor, point, { reason });
    }
    return this.camera.zoomAt(point, factor, { reason });
  }

  _capturePointer(pointerId) {
    try {
      this.element.setPointerCapture?.(pointerId);
    } catch (_) {
      // Pointer capture may fail when the pointer is already inactive.
    }
  }

  _releasePointer(pointerId) {
    try {
      const canRelease = typeof this.element.releasePointerCapture === "function";
      const ownsCapture = typeof this.element.hasPointerCapture !== "function"
        || this.element.hasPointerCapture(pointerId);
      if (canRelease && ownsCapture) this.element.releasePointerCapture(pointerId);
    } catch (_) {
      // Releasing an already-lost capture is harmless.
    }
  }
}

export function createInputController(options) {
  return new InputController(options);
}

export { INPUT_MODES, DEFAULTS as INPUT_DEFAULTS };
