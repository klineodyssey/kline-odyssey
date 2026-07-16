export function screenToCanonical(viewerPoint, parcel) {
  return {
    screen: viewerPoint,
    canonical: parcel?.canonical || null,
    note: "Screen coordinates never overwrite canonical K280 geometry."
  };
}

export function formatCanonical(parcel) {
  if (!parcel?.canonical) return "—";
  const c = parcel.canonical;
  if (c.parcel_id == null) return "UNKNOWN";
  const area = c.ground_m2 == null ? "UNKNOWN" : `${c.ground_m2} m²`;
  return `${c.parcel_id} · ${area}`;
}
