export async function loadSyntheticWorld(url = "./data/synthetic-world.json") {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fixture load failed: ${res.status}`);
  const data = await res.json();
  validateFixture(data);
  return data;
}

export function validateFixture(data) {
  const required = [
    ["meta.synthetic", data?.meta?.synthetic === true],
    ["earth", !!data?.earth],
    ["region", !!data?.region],
    ["cityOverlay", !!data?.cityOverlay],
    ["parcels.length", data?.parcels?.length === 12],
    ["buildings.length", data?.buildings?.length === 2],
    ["rooms.length", data?.rooms?.length === 3],
    ["proposalActions.length", data?.proposalActions?.length === 8],
    ["aiWorkers.length", data?.aiWorkers?.length === 1],
    ["npcs.length", data?.npcs?.length === 1],
    ["homeParcelId", !!data?.homeParcelId],
    ["unknownParcelId", data?.unknownParcelId === "parcel-12"]
  ];
  const failed = required.filter(([, ok]) => !ok).map(([k]) => k);
  if (failed.length) throw new Error(`Fixture validation failed: ${failed.join(", ")}`);
  const landUses = new Set(data.parcels.map((p) => p.land_use));
  ["RESIDENTIAL", "FARM", "FOREST"].forEach((u) => {
    if (!landUses.has(u)) throw new Error(`Missing land use ${u}`);
  });
}
