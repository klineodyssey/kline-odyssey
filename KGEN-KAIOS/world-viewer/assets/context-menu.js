export function createContextMenu(world, onProposal) {
  const menu = document.createElement("div");
  menu.className = "context-menu";
  menu.hidden = true;
  menu.setAttribute("role", "menu");
  document.body.appendChild(menu);

  let targetParcel = null;

  function hide() {
    menu.hidden = true;
    targetParcel = null;
  }

  function show(x, y, parcel) {
    targetParcel = parcel;
    menu.innerHTML = "";
    const canPropose = (parcel.capabilities || []).includes("PROPOSE");
    world.proposalActions.forEach((action) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.role = "menuitem";
      btn.textContent = action.label;
      btn.disabled = !canPropose;
      btn.addEventListener("click", () => {
        if (!canPropose) return;
        onProposal({
          type: "LAND_USE_PROPOSAL",
          parcel_id: parcel.id,
          land_use: action.land_use,
          created_at: new Date().toISOString(),
          local_only: true
        });
        hide();
      });
      menu.appendChild(btn);
    });
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.hidden = false;
  }

  document.addEventListener("click", (e) => {
    if (!menu.hidden && !menu.contains(e.target)) hide();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hide();
  });

  return { show, hide, element: menu };
}
