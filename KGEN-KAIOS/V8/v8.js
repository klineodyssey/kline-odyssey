(() => {
  "use strict";

  const assetTypes = [
    { id: "picture", label: "Picture / 一張圖" },
    { id: "land", label: "Land / 土地" },
    { id: "residence", label: "Residence / 民宅" },
    { id: "temple", label: "Temple / 神殿" },
    { id: "app", label: "App / 生命 App" },
    { id: "realBusiness", label: "Real Business / 實體商家" }
  ];

  const modules = {
    picture: ["Temple Blueprint", "Land Requirement", "Residence", "Store", "Bank", "Exchange 11520", "Real-World Link", "Listing", "Governance"],
    land: ["Zoning", "Residence", "Store", "Temple", "App Organism", "AI", "DNA", "Economy", "Listing"],
    residence: ["Business Type", "Catalog", "Inventory", "Payment Boundary", "Marketplace", "Temple Service Node", "Real-World Twin"],
    temple: ["Land", "Residence", "Store", "Bank", "Exchange", "App", "AI", "DNA", "Runtime", "Governance", "Real-World Link"],
    app: ["App DNA", "Runtime Organ", "Owner / License", "Marketplace", "Temple Binding", "AI Capability", "Upgrade / Fusion / Rental"],
    realBusiness: ["Legal Entity", "Brand Authorization", "Catalog Adapter", "Inventory Adapter", "Payment Compliance", "Loyalty Adapter", "KGEN Virtual Twin", "Listing Conditions"]
  };

  const roadmapTemplates = {
    picture: ["Picture", "Temple Blueprint", "Land Requirement", "Land Assignment", "Residence", "Store", "Bank", "Exchange", "Real-World Link", "Listing", "Governance", "Production Readiness"],
    land: ["Land", "Zoning", "Residence", "Store", "Temple", "App Organism", "AI", "DNA", "Economy", "Listing"],
    residence: ["Residence", "Business Type", "Inventory", "Payment", "Marketplace", "Temple Service Node", "Real-World Twin"],
    temple: ["Temple", "Land", "Residence", "Store", "Bank", "Exchange", "App", "AI", "DNA", "Runtime", "Governance", "Real-World Link"],
    app: ["App", "DNA", "Runtime", "License", "Marketplace", "Temple / Store Binding", "AI Capability", "Evolution"],
    realBusiness: ["Real Business", "Legal Entity", "Authorization", "Catalog", "Inventory", "Payment", "Membership", "Virtual Twin", "Listing Review"]
  };

  const economyLoop = ["探索", "資源", "土地", "民宅", "商店", "App", "AI", "DNA", "交易", "KGEN", "神殿", "文明科技", "文明戰爭", "新土地", "再探索"];
  const exchangeAssets = ["Land", "Temple", "Building", "Residence", "Store", "App", "AI", "DNA", "GA Strategy", "Equipment", "Materials", "Civilization Technology", "Real-World Business Twin", "Membership", "Future Regulated Rights"];
  const bankItems = ["Bank Account", "Treasury", "Deposit Simulation", "Loan Simulation", "Collateral", "Interest Model", "Credit Score", "Insurance Boundary", "Reserve", "Audit", "KYC / AML Boundary", "Risk Control"];
  const realWorldItems = ["Clothing Store", "Restaurant", "Convenience Store Type", "Shopping Mall", "Bank Branch", "Service Counter", "Temple Shop", "Warehouse", "Factory", "Membership Club"];
  const complianceItems = ["No brand partnership claim", "Requires Legal Review", "Requires Trademark Authorization", "Requires Business Agreement", "Requires Payment Compliance", "Requires Consumer Protection", "Requires Tax Compliance", "Future Regulated Module for securities/equity"];

  const selected = new Set(["picture"]);
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));

  function renderAssets() {
    $("assetGrid").innerHTML = assetTypes.map((asset) => `<button type="button" class="asset-button ${selected.has(asset.id) ? "active" : ""}" data-asset="${asset.id}"><span>${esc(asset.label)}</span><span>${selected.has(asset.id) ? "已選" : "選擇"}</span></button>`).join("");
    document.querySelectorAll("[data-asset]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.getAttribute("data-asset");
        if (selected.has(id)) selected.delete(id); else selected.add(id);
        if (selected.size === 0) selected.add(id);
        render();
      });
    });
  }

  function missingModules() {
    const all = new Set(["Picture", "Land", "Residence", "Temple", "Store", "Bank", "Exchange 11520", "App", "AI", "DNA", "Runtime", "Governance", "Real-World Link", "Listing"]);
    const ownedMap = { picture: "Picture", land: "Land", residence: "Residence", temple: "Temple", app: "App", realBusiness: "Real-World Link" };
    selected.forEach((id) => all.delete(ownedMap[id]));
    selected.forEach((id) => (modules[id] || []).forEach((name) => all.add(name)));
    selected.forEach((id) => all.delete(ownedMap[id]));
    return [...all];
  }

  function roadmap() {
    const merged = [];
    selected.forEach((id) => (roadmapTemplates[id] || []).forEach((step) => { if (!merged.includes(step)) merged.push(step); }));
    return merged;
  }

  function renderModules() {
    const list = missingModules();
    $("entrySummary").textContent = `${selected.size} entry asset(s)`;
    $("missingModules").innerHTML = list.map((name) => `<div class="module-card"><strong>${esc(name)}</strong><span>需要 Codex 建立或派發 WorkOrder；若涉及真實品牌/金流/金融，必須合規審查。</span></div>`).join("");
  }

  function renderRoadmap() {
    $("roadmap").innerHTML = roadmap().map((step) => `<div class="step"><strong>${esc(step)}</strong><span>Display-only WorkOrder node</span></div>`).join("");
  }

  function renderStaticLists() {
    $("economyLoop").innerHTML = economyLoop.map((x) => `<span>${esc(x)}</span>`).join("");
    $("exchangeList").innerHTML = exchangeAssets.map((x) => `<div class="exchange-item"><strong>${esc(x)}</strong><span>${x.includes("Future") ? "Future Regulated Module" : "Prototype listing type"}</span></div>`).join("");
    $("bankList").innerHTML = bankItems.map((x) => `<li>${esc(x)} — 模擬 Runtime，非真實金融牌照。</li>`).join("");
    $("realWorldList").innerHTML = realWorldItems.map((x) => `<li>${esc(x)} — 需授權、合約與合規後才可正式接入。</li>`).join("");
    $("complianceList").innerHTML = complianceItems.map((x) => `<li>${esc(x)}</li>`).join("");
  }

  function render() {
    renderAssets();
    renderModules();
    renderRoadmap();
    renderStaticLists();
  }

  render();
})();