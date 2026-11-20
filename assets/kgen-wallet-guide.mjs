const KGEN_CONTRACT = "0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be";

for (const guide of document.querySelectorAll(".kgen-import-guide")) {
  const address = guide.querySelector("[data-kgen-contract-address]");
  const button = guide.querySelector("[data-kgen-copy-address]");
  const status = guide.querySelector("[data-kgen-copy-status]");
  if (!address || !button || !status) continue;

  button.addEventListener("click", async (event) => {
    if (!event.isTrusted || button.disabled) return;
    if (address.textContent.trim() !== KGEN_CONTRACT) {
      status.textContent = "地址與核定資料不符，未複製；請先核對下方官方資料來源。";
      return;
    }

    button.disabled = true;
    try {
      if (typeof navigator.clipboard?.writeText !== "function") {
        status.textContent = "此瀏覽器未能複製；請長按上方合約地址手動複製。";
        return;
      }
      await navigator.clipboard.writeText(KGEN_CONTRACT);
      status.textContent = "已複製 KGEN 合約地址。";
    } catch {
      status.textContent = "此瀏覽器未能複製；請長按上方合約地址手動複製。";
    } finally {
      button.disabled = false;
    }
  });
  button.hidden = false;
}
