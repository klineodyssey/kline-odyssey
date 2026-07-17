function element(documentRef, tag, className = "", text = null) {
  const node = documentRef.createElement(tag);
  if (className) node.className = className;
  if (text !== null) node.textContent = String(text);
  return node;
}

function label(value) {
  return String(value ?? "UNKNOWN").replaceAll("_", " ");
}

export function createGenesisView(dialog, callbacks = {}) {
  if (!dialog || typeof dialog.showModal !== "function") {
    throw new TypeError("Genesis View requires a dialog element");
  }
  const documentRef = dialog.ownerDocument;
  let lastSnapshot = null;
  let busy = false;

  function render(snapshot = lastSnapshot) {
    if (!snapshot) return;
    lastSnapshot = snapshot;
    const form = element(documentRef, "form", "genesis-dialog__surface");
    form.method = "dialog";

    const header = element(documentRef, "header", "genesis-dialog__header");
    const heading = element(documentRef, "div");
    heading.append(
      element(documentRef, "span", "eyebrow", "KAIOS CIVILIZATION GENESIS"),
      element(documentRef, "h2", "", snapshot.completed ? "Civilization born" : "Begin life on Earth K280")
    );
    const cancel = element(documentRef, "button", "icon-button", snapshot.completed ? ">" : "X");
    cancel.type = "button";
    cancel.setAttribute("aria-label", snapshot.completed ? "Continue to world" : "Cancel Genesis login");
    cancel.addEventListener("click", () => {
      if (snapshot.completed) callbacks.onEnterWorld?.();
      else callbacks.onCancel?.();
    });
    header.append(heading, cancel);

    const body = element(documentRef, "div", "genesis-dialog__body");
    const planet = snapshot.planet ?? {};
    const planetCard = element(documentRef, "section", "genesis-planet");
    planetCard.append(
      element(documentRef, "strong", "", `${planet.label ?? planet.planet_id ?? "EARTH"} / K${planet.k_anchor ?? 280}`),
      element(documentRef, "span", "", `${label(planet.life_compatibility?.HUMAN)} / ${planet.gravity_g ?? "?"} G / ${label(planet.water)}`)
    );
    body.append(planetCard);

    const completed = new Map((snapshot.completed_steps ?? []).map((step) => [step.step, step]));
    const steps = element(documentRef, "ol", "genesis-steps");
    for (const stepId of snapshot.boot_steps ?? []) {
      const step = completed.get(stepId);
      const item = element(documentRef, "li", "genesis-step");
      item.dataset.status = step ? "PASS" : stepId === snapshot.stage ? "ACTIVE" : "PENDING";
      item.append(
        element(documentRef, "span", "genesis-step__status", step ? "PASS" : stepId === snapshot.stage ? "NOW" : "WAIT"),
        element(documentRef, "strong", "", label(stepId))
      );
      steps.append(item);
    }
    body.append(steps);

    if (!snapshot.completed) {
      const fortune = element(documentRef, "section", "genesis-fortune");
      fortune.append(
        element(documentRef, "span", "eyebrow", "K12345 WUKONG FORTUNE TEMPLE"),
        element(documentRef, "h3", "", "Choose one Genesis Fortune"),
        element(documentRef, "p", "", "One local prototype grant for civilization bootstrap. Not an airdrop, wallet payment, or recurring income.")
      );
      const choices = element(documentRef, "div", "genesis-fortune__choices");
      for (const amount of snapshot.fortune_options ?? []) {
        const button = element(documentRef, "button", "genesis-fortune__choice", `${amount} KGEN`);
        button.type = "button";
        button.disabled = busy;
        button.dataset.amount = String(amount);
        button.addEventListener("click", () => callbacks.onClaim?.(amount));
        choices.append(button);
      }
      fortune.append(choices);
      body.append(fortune);
    } else {
      const receipt = element(documentRef, "section", "genesis-receipt");
      receipt.append(
        element(documentRef, "span", "eyebrow", "BIRTH RECORD"),
        element(documentRef, "strong", "", snapshot.birth_id),
        element(documentRef, "p", "", `${snapshot.fortune_claim?.amount ?? 0} prototype KGEN / Starter Survival Pack / ${snapshot.starter_parcel_id}`)
      );
      body.append(receipt);
    }

    const footer = element(documentRef, "footer", "genesis-dialog__footer");
    const note = element(documentRef, "span", "", "Synthetic local product data / no real KGEN or legal land title");
    const action = element(documentRef, "button", "primary-button", snapshot.completed ? "Enter world" : "Choose a fortune above");
    action.type = "button";
    action.disabled = !snapshot.completed || busy;
    action.addEventListener("click", () => callbacks.onEnterWorld?.());
    footer.append(note, action);
    form.append(header, body, footer);
    dialog.replaceChildren(form);
  }

  function open(snapshot) {
    busy = false;
    render(snapshot);
    if (!dialog.open) dialog.showModal();
  }

  function update(snapshot) {
    render(snapshot);
  }

  function setBusy(value) {
    busy = Boolean(value);
    if (lastSnapshot) render(lastSnapshot);
  }

  function close() {
    if (dialog.open) dialog.close();
  }

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    if (lastSnapshot?.completed) callbacks.onEnterWorld?.();
    else callbacks.onCancel?.();
  });

  return Object.freeze({ open, update, setBusy, close, isOpen: () => dialog.open });
}
