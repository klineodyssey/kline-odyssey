const syncCards = document.getElementById("syncCards");

const sources = [
  {
    label: "Sync Request",
    path: "sync/AI-ECONOMY-2026-0001_sync_request.json"
  },
  {
    label: "Sync Validation",
    path: "sync/AI-ECONOMY-2026-0001_sync_validation.json"
  },
  {
    label: "Sync Result",
    path: "sync/AI-ECONOMY-2026-0001_sync_result.json"
  }
];

function statusClass(status) {
  if (["SYNC_READY", "OPEN"].includes(status)) return "ok";
  if (["SYNC_PENDING", "SYNC_VALIDATING", "HUMAN_PAUSED"].includes(status)) return "warn";
  if (["SYNC_REJECTED", "SYNC_CONFLICT"].includes(status)) return "stop";
  return "info";
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function renderSyncCards() {
  if (!syncCards) return;

  const cards = await Promise.all(sources.map(async (source) => {
    try {
      const data = await fetchJson(source.path);
      const status = data.status || data.result || data.new_status || "SYNC_READY";
      return `
        <article>
          <span>${source.label}</span>
          <strong class="${statusClass(status)}">${status}</strong>
          <small>${data.formal_workorder_id || data.sync_request_id || "AI-ECONOMY-2026-0001"}</small>
        </article>
      `;
    } catch (error) {
      return `
        <article>
          <span>${source.label}</span>
          <strong class="warn">WAITING</strong>
          <small>${error.message}</small>
        </article>
      `;
    }
  }));

  syncCards.innerHTML = cards.join("");
}

renderSyncCards();
