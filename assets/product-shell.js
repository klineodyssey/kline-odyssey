(() => {
  const SECTIONS = [
    { id: "top", label: "首頁" },
    { id: "kaios-world", label: "世界" },
    { id: "kaios-life", label: "生命" },
    { id: "token", label: "市場" },
    { id: "temples", label: "神殿" },
    { id: "operating", label: "公司" },
    { id: "product-settings", label: "設定" }
  ];

  const stage = document.getElementById("product-feature-stage");
  const stageTitle = document.getElementById("product-feature-stage-title");
  const stageFrame = document.getElementById("product-feature-stage-frame");
  const stageError = document.getElementById("product-feature-stage-error");
  const stageRetry = document.getElementById("product-feature-stage-retry");
  const sectionLinks = document.querySelectorAll("[data-product-section]");
  const backButton = document.getElementById("product-nav-back");
  const prevButton = document.getElementById("product-nav-prev");
  const nextButton = document.getElementById("product-nav-next");
  const forwardButton = document.getElementById("product-nav-forward");
  const stageBackButton = document.getElementById("product-feature-back");
  const reduceMotionToggle = document.getElementById("product-setting-reduce-motion");

  let activeSectionIndex = 0;
  let stageReturnFocus = null;
  let stageCurrentUrl = "";
  let stageLoadTimer = null;
  let suppressHistory = false;

  function sectionIndexForId(id) {
    const index = SECTIONS.findIndex((section) => section.id === id);
    return index >= 0 ? index : 0;
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
      || (reduceMotionToggle && reduceMotionToggle.checked);
  }

  function pushAppState(state) {
    if (suppressHistory) return;
    const merged = { productShell: true, ...state };
    window.history.pushState(merged, "", state.href || window.location.pathname + window.location.search);
  }

  function setActiveSection(index, options = {}) {
    const bounded = ((index % SECTIONS.length) + SECTIONS.length) % SECTIONS.length;
    activeSectionIndex = bounded;
    const target = SECTIONS[bounded];
    sectionLinks.forEach((link) => {
      const isActive = link.dataset.productSection === target.id;
      link.classList.toggle("is-active", isActive);
      link.setAttribute("aria-current", isActive ? "page" : "false");
    });
    if (options.scroll !== false) {
      const node = document.getElementById(target.id);
      if (node) {
        node.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
      }
    }
    if (options.history !== false && !stage?.classList.contains("is-open")) {
      pushAppState({ mode: "section", sectionId: target.id, href: `#${target.id}` });
    }
  }

  function showStageError(message) {
    if (!stageError || !stageFrame) return;
    stageFrame.hidden = true;
    stageError.hidden = false;
    stageError.textContent = message;
  }

  function hideStageError() {
    if (!stageError || !stageFrame) return;
    stageError.hidden = true;
    stageFrame.hidden = false;
    stageError.textContent = "";
  }

  function clearStageLoadTimer() {
    if (stageLoadTimer) {
      window.clearTimeout(stageLoadTimer);
      stageLoadTimer = null;
    }
  }

  function openFeatureStage(title, url, trigger, options = {}) {
    if (!stage || !stageFrame || !stageTitle) return;
    stageReturnFocus = trigger || document.activeElement;
    stageCurrentUrl = url;
    stageTitle.textContent = title;
    hideStageError();
    stageFrame.hidden = false;
    stage.classList.add("is-open");
    stage.setAttribute("aria-hidden", "false");
    document.body.classList.add("product-stage-open");
    document.body.style.overflow = "hidden";
    stageBackButton?.focus();

    clearStageLoadTimer();
    stageLoadTimer = window.setTimeout(() => {
      showStageError("載入逾時。World Viewer 可能暫時無法使用，但官網其他功能仍可使用。請按「重試」或「返回」。");
    }, 12000);

    stageFrame.onload = () => {
      clearStageLoadTimer();
      hideStageError();
    };
    stageFrame.onerror = () => {
      clearStageLoadTimer();
      showStageError("無法載入此功能。請確認網路或稍後重試；官網基本導航不受影響。");
    };

    stageFrame.src = url;

    if (options.history !== false) {
      pushAppState({ mode: "feature", title, url, href: `#feature=${encodeURIComponent(url)}` });
    }
  }

  function closeFeatureStage(options = {}) {
    if (!stage || !stageFrame) return;
    clearStageLoadTimer();
    stage.classList.remove("is-open");
    stage.setAttribute("aria-hidden", "true");
    stageFrame.onload = null;
    stageFrame.onerror = null;
    stageFrame.removeAttribute("src");
    stageCurrentUrl = "";
    hideStageError();
    document.body.classList.remove("product-stage-open");
    document.body.style.overflow = "";
    if (stageReturnFocus && typeof stageReturnFocus.focus === "function") {
      stageReturnFocus.focus();
    }
    if (options.history !== false && window.location.hash.startsWith("#feature=")) {
      suppressHistory = true;
      window.history.back();
      window.setTimeout(() => { suppressHistory = false; }, 0);
    }
  }

  sectionLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      if (stage?.classList.contains("is-open")) {
        closeFeatureStage({ history: false });
      }
      setActiveSection(sectionIndexForId(link.dataset.productSection));
    });
  });

  backButton?.addEventListener("click", () => {
    if (stage?.classList.contains("is-open")) {
      closeFeatureStage();
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    setActiveSection(0, { history: false });
  });

  prevButton?.addEventListener("click", () => {
    if (stage?.classList.contains("is-open")) {
      closeFeatureStage({ history: false });
    }
    setActiveSection(activeSectionIndex - 1);
  });

  nextButton?.addEventListener("click", () => {
    if (stage?.classList.contains("is-open")) {
      closeFeatureStage({ history: false });
    }
    setActiveSection(activeSectionIndex + 1);
  });

  forwardButton?.addEventListener("click", () => {
    window.history.forward();
  });

  stageBackButton?.addEventListener("click", () => closeFeatureStage());
  stageRetry?.addEventListener("click", () => {
    if (stageCurrentUrl) {
      openFeatureStage(stageTitle.textContent, stageCurrentUrl, stageBackButton, { history: false });
    }
  });

  document.querySelectorAll("[data-product-feature]").forEach((button) => {
    button.addEventListener("click", () => {
      const title = button.dataset.productFeatureTitle || "KAIOS";
      const url = button.dataset.productFeatureUrl;
      if (!url) return;
      openFeatureStage(title, url, button);
    });
  });

  document.querySelectorAll("[data-product-fullpage]").forEach((button) => {
    button.addEventListener("click", () => {
      const sectionId = button.dataset.productFullpage;
      const node = document.getElementById(sectionId);
      if (!node) return;
      node.classList.add("is-fullpage");
      document.body.classList.add("product-section-fullpage");
      pushAppState({ mode: "fullpage-section", sectionId, href: `#fullpage=${sectionId}` });
      node.querySelector("[data-fullpage-close], .product-fullpage-close")?.focus();
    });
  });

  document.querySelectorAll("[data-fullpage-close]").forEach((button) => {
    button.addEventListener("click", () => {
      const sectionId = button.dataset.fullpageClose;
      const node = sectionId ? document.getElementById(sectionId) : button.closest("section");
      node?.classList.remove("is-fullpage");
      document.body.classList.remove("product-section-fullpage");
      if (window.location.hash.startsWith("#fullpage=")) {
        suppressHistory = true;
        window.history.back();
        window.setTimeout(() => { suppressHistory = false; }, 0);
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (stage?.classList.contains("is-open")) {
        event.preventDefault();
        closeFeatureStage();
        return;
      }
      const full = document.querySelector("section.is-fullpage");
      if (full) {
        full.querySelector("[data-fullpage-close]")?.click();
      }
    }
  });

  window.addEventListener("popstate", (event) => {
    const state = event.state && event.state.productShell ? event.state : null;
    suppressHistory = true;
    if (!state) {
      closeFeatureStage({ history: false });
      document.querySelectorAll("section.is-fullpage").forEach((node) => node.classList.remove("is-fullpage"));
      document.body.classList.remove("product-section-fullpage");
      setActiveSection(0, { history: false, scroll: false });
      suppressHistory = false;
      return;
    }
    if (state.mode === "feature" && state.url) {
      openFeatureStage(state.title || "KAIOS", state.url, null, { history: false });
    } else if (state.mode === "fullpage-section" && state.sectionId) {
      closeFeatureStage({ history: false });
      document.getElementById(state.sectionId)?.classList.add("is-fullpage");
      document.body.classList.add("product-section-fullpage");
    } else if (state.mode === "section" && state.sectionId) {
      closeFeatureStage({ history: false });
      document.querySelectorAll("section.is-fullpage").forEach((node) => node.classList.remove("is-fullpage"));
      document.body.classList.remove("product-section-fullpage");
      setActiveSection(sectionIndexForId(state.sectionId), { history: false });
    }
    suppressHistory = false;
  });

  const observer = new IntersectionObserver(
    (entries) => {
      if (suppressHistory || stage?.classList.contains("is-open")) return;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const index = sectionIndexForId(entry.target.id);
        if (index >= 0) {
          activeSectionIndex = index;
          sectionLinks.forEach((link) => {
            const isActive = link.dataset.productSection === SECTIONS[index].id;
            link.classList.toggle("is-active", isActive);
            link.setAttribute("aria-current", isActive ? "page" : "false");
          });
        }
      });
    },
    { rootMargin: "-20% 0px -55% 0px", threshold: 0.05 }
  );

  SECTIONS.forEach((section) => {
    const node = document.getElementById(section.id);
    if (node) observer.observe(node);
  });

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => {
      document.documentElement.style.setProperty("--product-vv-bottom", `${Math.max(0, window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop)}px`);
    });
  }

  document.body.classList.add("product-shell-active");
  window.history.replaceState({ productShell: true, mode: "section", sectionId: "top" }, "", "#top");
  setActiveSection(0, { scroll: false, history: false });
})();
