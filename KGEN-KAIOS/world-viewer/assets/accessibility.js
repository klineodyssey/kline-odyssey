export function setupAccessibility({ svg, selection, cameraApi, parcels, onLogin }) {
  const live = document.getElementById("a11y-live");
  function announce(msg) {
    if (live) live.textContent = msg;
  }

  const parcelList = parcels.map((p) => p.id);
  let focusIndex = 0;

  document.getElementById("btn-login")?.addEventListener("click", () => {
    onLogin();
    announce("Mock login complete. Focused synthetic home parcel.");
  });

  document.getElementById("btn-zoom-in")?.addEventListener("click", () => cameraApi.zoomIn());
  document.getElementById("btn-zoom-out")?.addEventListener("click", () => cameraApi.zoomOut());
  document.getElementById("btn-reset-view")?.addEventListener("click", () => {
    cameraApi.reset();
    announce("View reset.");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      focusIndex = (focusIndex + 1) % parcelList.length;
      selection.select(parcelList[focusIndex]);
      announce(`Focused ${parcelList[focusIndex]}`);
    } else if (e.key === "ArrowLeft") {
      focusIndex = (focusIndex - 1 + parcelList.length) % parcelList.length;
      selection.select(parcelList[focusIndex]);
      announce(`Focused ${parcelList[focusIndex]}`);
    } else if (e.key === "Enter" && selection.get()) {
      announce(`Selected ${selection.get()}`);
    } else if (e.key === "Escape") {
      selection.clear();
      announce("Selection cleared.");
    }
  });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.classList.add("reduced-motion");
  }

  svg.setAttribute("role", "application");
  svg.setAttribute("aria-label", "KAIOS World Viewer synthetic map");
  return { announce };
}
