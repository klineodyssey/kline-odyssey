export function createCamera(viewBox = { x: 0, y: 0, w: 800, h: 600 }) {
  const state = {
    viewBox: { ...viewBox },
    base: { ...viewBox },
    minScale: 0.5,
    maxScale: 3,
    scale: 1,
    dragging: false,
    last: null,
    moved: false
  };

  function apply(svg) {
    const { x, y, w, h } = state.viewBox;
    svg.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);
  }

  function pan(dx, dy) {
    const s = state.scale;
    state.viewBox.x -= dx / s;
    state.viewBox.y -= dy / s;
  }

  function zoomAt(factor, cx, cy, svgEl) {
    const rect = svgEl.getBoundingClientRect();
    const px = ((cx - rect.left) / rect.width) * state.viewBox.w + state.viewBox.x;
    const py = ((cy - rect.top) / rect.height) * state.viewBox.h + state.viewBox.y;
    const next = Math.min(state.maxScale, Math.max(state.minScale, state.scale * factor));
    const ratio = next / state.scale;
    state.scale = next;
    state.viewBox.w = state.base.w / state.scale;
    state.viewBox.h = state.base.h / state.scale;
    state.viewBox.x = px - (px - state.viewBox.x) * ratio;
    state.viewBox.y = py - (py - state.viewBox.y) * ratio;
  }

  function reset() {
    state.viewBox = { ...state.base };
    state.scale = 1;
  }

  function bind(svg) {
    svg.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      state.dragging = true;
      state.moved = false;
      state.last = { x: e.clientX, y: e.clientY };
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener("pointermove", (e) => {
      if (!state.dragging || !state.last) return;
      const dx = e.clientX - state.last.x;
      const dy = e.clientY - state.last.y;
      if (Math.hypot(dx, dy) > 4) state.moved = true;
      pan(dx, dy);
      state.last = { x: e.clientX, y: e.clientY };
      apply(svg);
    });
    svg.addEventListener("pointerup", (e) => {
      state.dragging = false;
      state.last = null;
      try { svg.releasePointerCapture(e.pointerId); } catch (_) { /* noop */ }
    });
    svg.addEventListener("wheel", (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      zoomAt(factor, e.clientX, e.clientY, svg);
      apply(svg);
    }, { passive: false });
    apply(svg);
    return {
      didPan: () => state.moved,
      reset: () => { reset(); apply(svg); },
      zoomIn: () => { zoomAt(1.15, svg.clientWidth / 2, svg.clientHeight / 2, svg); apply(svg); },
      zoomOut: () => { zoomAt(0.87, svg.clientWidth / 2, svg.clientHeight / 2, svg); apply(svg); }
    };
  }

  return { bind, apply, reset };
}
