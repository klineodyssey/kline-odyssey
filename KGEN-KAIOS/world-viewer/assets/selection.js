export function createSelection() {
  let selectedId = null;
  const listeners = new Set();

  function select(id) {
    selectedId = id;
    listeners.forEach((fn) => fn(selectedId));
  }

  function clear() {
    select(null);
  }

  function get() {
    return selectedId;
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function applyVisual(svg) {
    svg.querySelectorAll("[data-parcel-id]").forEach((el) => {
      const id = el.getAttribute("data-parcel-id");
      el.classList.toggle("is-selected", id === selectedId);
      el.setAttribute("aria-selected", id === selectedId ? "true" : "false");
    });
  }

  return { select, clear, get, onChange, applyVisual };
}
