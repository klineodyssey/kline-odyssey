export function renderInspector(container, world, parcelId, proposalDraft) {
  const parcel = world.parcels.find((p) => p.id === parcelId);
  container.innerHTML = "";
  if (!parcel) {
    container.innerHTML = `<p class="inspector-empty">Select a parcel on the map.</p>`;
    return;
  }

  const building = world.buildings.find((b) => b.parcel_id === parcel.id);
  const rooms = building ? world.rooms.filter((r) => r.building_id === building.id) : [];
  const ai = world.aiWorkers.find((a) => a.parcel_id === parcel.id);
  const npc = world.npcs.find((n) => n.parcel_id === parcel.id);
  const statusClass = parcel.status === "UNKNOWN" ? "state-unknown" : parcel.status === "RESTRICTED" ? "state-restricted" : parcel.status === "STALE" ? "state-stale" : "";

  const groups = [
    { title: "Canonical", rows: [
      ["Parcel ID", parcel.canonical?.parcel_id ?? "UNKNOWN"],
      ["Ground (K280)", parcel.canonical?.ground_m2 ?? "UNKNOWN"],
      ["Coordinate frame", world.earth.coordinate_frame]
    ]},
    { title: "Viewer", rows: [
      ["Label", parcel.label],
      ["Land use", parcel.land_use],
      ["Owner", parcel.owner],
      ["Status", parcel.status]
    ]},
    { title: "Proposal", rows: proposalDraft && proposalDraft.parcel_id === parcel.id
      ? [["Draft", `${proposalDraft.land_use} (local only)`]]
      : [["Draft", "—"]]
    },
    { title: "Unknown / Restricted", rows: [
      ["Data quality", parcel.data_quality || (parcel.status === "UNKNOWN" ? "UNKNOWN" : "OK")],
      ["Capabilities", (parcel.capabilities || []).join(", ") || "—"]
    ]}
  ];

  const root = document.createElement("div");
  root.className = `inspector-body ${statusClass}`;
  groups.forEach((g) => {
    const sec = document.createElement("section");
    sec.innerHTML = `<h3>${g.title}</h3>`;
    const dl = document.createElement("dl");
    g.rows.forEach(([dt, dd]) => {
      dl.innerHTML += `<dt>${dt}</dt><dd>${dd}</dd>`;
    });
    sec.appendChild(dl);
    root.appendChild(sec);
  });

  if (building) {
    const b = document.createElement("section");
    b.innerHTML = `<h3>Building</h3><p>${building.label}</p>`;
    if (rooms.length) {
      b.innerHTML += `<ul>${rooms.map((r) => `<li>${r.label}</li>`).join("")}</ul>`;
    }
    root.appendChild(b);
  }
  if (ai) root.innerHTML += `<section><h3>AI Worker</h3><p>${ai.label}</p></section>`;
  if (npc) root.innerHTML += `<section><h3>NPC</h3><p>${npc.label}</p></section>`;

  container.appendChild(root);
}
