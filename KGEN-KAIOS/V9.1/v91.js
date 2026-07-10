const statusCards = document.getElementById("statusCards");

const reviewTargets = [
  {
    id: "V9-DRYRUN-001A",
    label: "Resource Reserve Review",
    path: "reviews/V9-DRYRUN-001A_promotion_decision.json"
  },
  {
    id: "V9-DRYRUN-001B",
    label: "Temple Activity Support",
    path: "reviews/V9-DRYRUN-001B_promotion_decision.json"
  },
  {
    id: "V9-DRYRUN-001C",
    label: "Citizen Employment Support",
    path: "reviews/V9-DRYRUN-001C_promotion_decision.json"
  }
];

function statusClass(status) {
  if (status === "APPROVED_FOR_OPEN" || status === "OPEN") return "ok";
  if (status === "NEEDS_REVISION" || status === "BLOCKED") return "warn";
  if (status === "REJECTED" || status === "ARCHIVED") return "stop";
  return "";
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function renderCards() {
  if (!statusCards) return;

  const cards = await Promise.all(reviewTargets.map(async (target) => {
    try {
      const data = await fetchJson(target.path);
      const status = data.new_status || "UNDER_REVIEW";
      return `
        <article>
          <span>${target.id}</span>
          <strong class="${statusClass(status)}">${status}</strong>
          <small>${target.label}</small>
        </article>
      `;
    } catch (error) {
      return `
        <article>
          <span>${target.id}</span>
          <strong class="warn">WAITING_FOR_REVIEW</strong>
          <small>${target.label}</small>
        </article>
      `;
    }
  }));

  statusCards.innerHTML = cards.join("");
}

renderCards();
