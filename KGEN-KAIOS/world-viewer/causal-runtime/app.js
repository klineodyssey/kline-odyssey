import { createCausalWorldRuntime } from "./causal-world-runtime.js";

let runtime;
const byId = (id) => document.getElementById(id);
const scenarioOptions = () => ({ VALID: {}, RIVER: { no_bridge: true }, BRIDGE_LOAD: { bridge_load_limit_kg: 15000 }, FUEL: { fuel_level_l: 10 }, WEAR: { vehicle_wear: 99.9 } }[byId("scenario").value]);

function textRow(label, value) { const row = document.createElement("div"); row.className = "data-row"; const name = document.createElement("span"); name.textContent = label; const detail = document.createElement("span"); detail.textContent = String(value); row.append(name, detail); return row; }
function card(label, value) { const item = document.createElement("div"); item.className = "card"; const title = document.createElement("span"); title.textContent = label; const detail = document.createElement("strong"); detail.textContent = String(value); item.append(title, detail); return item; }
function metric(label, value) { const item = card(label, value); item.className = "metric"; return item; }

function render() {
  const state = runtime.getSnapshot();
  const route = state.route_evaluation;
  byId("gravity-value").textContent = `${state.gravity_mps2} m/s²`;
  byId("route-status").textContent = route ? (route.blocked ? route.block_reason : state.active_delivery?.status ?? "ROUTE_VALID") : "NOT_EVALUATED";
  byId("route-metrics").replaceChildren(...[
    metric("Distance", route ? `${(route.distance_m / 1000).toFixed(2)} km` : "--"), metric("Total Time", route ? `${(route.estimated_time_s / 3600).toFixed(2)} h` : "--"), metric("Fuel", route ? `${route.fuel_required_l} L` : "--"), metric("Block Reason", route?.block_reason ?? "NONE")
  ]);
  const progress = state.active_delivery && route ? Math.min(84, 12 + state.active_delivery.elapsed_s / route.estimated_time_s * 72) : 12;
  byId("vehicle-marker").style.left = `${progress}%`;
  byId("infrastructure-grid").replaceChildren(...[
    card("Terrain", state.entities.terrain.map(({ terrain_class }) => terrain_class).join(" → ")), card("Roads", state.entities.roads.map(({ open_or_closed }) => open_or_closed).join(" / ")), card("River", state.entities.rivers[0].depth_class), card("Bridge", `${state.entities.bridges[0].load_limit_kg} kg · ${state.entities.bridges[0].open_or_closed}`), card("Required Infrastructure", route?.required_infrastructure.join(", ") || "NONE"), card("Authority", state.authority)
  ]);
  const vehicle = state.entities.vehicles[0]; const cargo = state.entities.cargo[0];
  byId("vehicle-grid").replaceChildren(...[
    card("Vehicle", vehicle.vehicle_type), card("Vehicle Mass", `${vehicle.mass_kg} kg`), card("Cargo", `${cargo.material} · ${cargo.mass_kg} kg`), card("Total Mass", route ? `${route.total_mass_kg} kg` : "--"), card("Fuel Level", `${vehicle.fuel_level_l} L`), card("Energy Type", vehicle.energy_type), card("Wear", vehicle.wear), card("Vehicle State", vehicle.status)
  ]);
  byId("project-summary").replaceChildren(...[textRow("Project", state.project.project_type), textRow("Stage", state.project.stage), textRow("Status", state.project.status), textRow("Progress", `${state.project.progress_s} s`), textRow("Completed", state.project.completed_stages.join(" → ") || "NONE"), textRow("Access Route", state.project.access_route)]);
  byId("worker-summary").replaceChildren(...state.entities.workers.flatMap((worker) => [textRow(worker.skill, `${worker.life_id} · stamina ${worker.stamina}${worker.energy === undefined ? "" : ` · energy ${worker.energy} · compute ${worker.compute}`}`)]));
  byId("material-summary").replaceChildren(...Object.entries(state.inventory).map(([name, value]) => textRow(name, value)));
  byId("account-grid").replaceChildren(...Object.entries(state.accounts).map(([name, value]) => card(name, value)));
  byId("ledger").replaceChildren(...(state.ledger.length ? state.ledger.map((entry) => { const row = document.createElement("div"); row.className = "ledger-row"; row.append(Object.assign(document.createElement("span"), { textContent: entry.type }), Object.assign(document.createElement("strong"), { textContent: String(entry.amount) }), Object.assign(document.createElement("span"), { textContent: `${entry.debit} → ${entry.credit}` })); return row; }) : [textRow("Ledger", "No transactions yet")]));
  byId("timeline").replaceChildren(...(state.events.length ? state.events.toReversed().map((entry) => { const item = document.createElement("li"); item.textContent = `t=${entry.time}s · ${entry.action} · ${entry.status}${entry.reason ? ` · ${entry.reason}` : ""}`; return item; }) : [Object.assign(document.createElement("li"), { textContent: "No causal events yet" })]));
}

function action(label, operation) { try { const result = operation(); byId("control-status").textContent = `${label}: ${result?.status ?? "PASS"}${result?.reason ? ` · ${result.reason}` : ""}`; render(); } catch (error) { byId("control-status").textContent = `${label}: ERROR · ${error.message}`; } }
function initialize() { try { runtime = createCausalWorldRuntime(); byId("loading-state").hidden = true; byId("workspace").hidden = false; render(); } catch (error) { byId("loading-state").hidden = true; byId("error-state").hidden = false; byId("error-detail").textContent = error.message; } }

byId("calculate-route").addEventListener("click", () => action("ROUTE", () => { runtime.setGravity(byId("gravity").value); return runtime.evaluateRoute(scenarioOptions()); }));
byId("start-simulation").addEventListener("click", () => action("DELIVERY", () => { runtime.setGravity(byId("gravity").value); return runtime.startDelivery(scenarioOptions()); }));
byId("pause-simulation").addEventListener("click", () => action("PAUSE", () => runtime.pause()));
byId("resume-simulation").addEventListener("click", () => action("RESUME", () => runtime.resume()));
byId("advance-time").addEventListener("click", () => action("TIME", () => runtime.advanceTime(3600)));
byId("refuel").addEventListener("click", () => action("REFUEL", () => runtime.refuel(100)));
byId("recharge").addEventListener("click", () => action("RECHARGE", () => runtime.recharge(100000000)));
byId("maintenance").addEventListener("click", () => action("MAINTENANCE", () => runtime.maintainVehicle()));
byId("start-project").addEventListener("click", () => action("CONSTRUCTION", () => runtime.advanceProject(3600)));
byId("save-button").addEventListener("click", () => action("SAVE", () => runtime.save()));
byId("reset-button").addEventListener("click", () => action("RESET", () => runtime.reset()));
byId("replay-button").addEventListener("click", () => { byId("control-status").textContent = `REPLAY: ${runtime.replay().length} events`; document.querySelector('[data-panel="timeline-panel"]').click(); });
byId("retry-button").addEventListener("click", () => location.reload());
byId("export-button").addEventListener("click", () => { const blob = new Blob([runtime.exportState()], { type: "application/json" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "kaios-causal-world-simulation.json"; link.click(); URL.revokeObjectURL(link.href); });
byId("import-input").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const serialized = await file.text();
  action("IMPORT", () => runtime.importState(serialized));
});
for (const tab of document.querySelectorAll("[data-panel]")) tab.addEventListener("click", () => { for (const candidate of document.querySelectorAll("[data-panel]")) { const selected = candidate === tab; candidate.setAttribute("aria-pressed", String(selected)); byId(candidate.dataset.panel).hidden = !selected; } });
initialize();
