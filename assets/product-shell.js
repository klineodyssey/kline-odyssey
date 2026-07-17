(() => {
  const SECTIONS = [
    { id: "top", label: "Home" },
    { id: "kaios-world", label: "World" },
    { id: "kaios-life", label: "Life" },
    { id: "operating", label: "Company" },
    { id: "temples", label: "Temple" },
    { id: "token", label: "Market" },
    { id: "product-settings", label: "Settings" }
  ];

  const stage = document.getElementById("product-feature-stage");
  const stageTitle = document.getElementById("product-feature-stage-title");
  const stageFrame = document.getElementById("product-feature-stage-frame");
  const sectionLinks = document.querySelectorAll("[data-product-section]");
  const backButton = document.getElementById("product-nav-back");
  const prevButton = document.getElementById("product-nav-prev");
  const nextButton = document.getElementById("product-nav-next");
  const stageBackButton = document.getElementById("product-feature-back");
  const reduceMotionToggle = document.getElementById("product-setting-reduce-motion");

  let activeSectionIndex = 0;
  let stageReturnFocus = null;

  function sectionIndexForId(id) {
    const index = SECTIONS.findIndex((section) => section.id === id);
    return index >= 0 ? index : 0;
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
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
      || (reduceMotionToggle && reduceMotionToggle.checked);
  }

  function openFeatureStage(title, url, trigger) {
    if (!stage || !stageFrame || !stageTitle) return;
    stageReturnFocus = trigger || document.activeElement;
    stageTitle.textContent = title;
    stageFrame.src = url;
    stage.classList.add("is-open");
    stage.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    stageBackButton?.focus();
  }

  function closeFeatureStage() {
    if (!stage || !stageFrame) return;
    stage.classList.remove("is-open");
    stage.setAttribute("aria-hidden", "true");
    stageFrame.removeAttribute("src");
    document.body.style.overflow = "";
    if (stageReturnFocus && typeof stageReturnFocus.focus === "function") {
      stageReturnFocus.focus();
    }
  }

  sectionLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
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
    setActiveSection(0);
  });

  prevButton?.addEventListener("click", () => {
    setActiveSection(activeSectionIndex - 1);
  });

  nextButton?.addEventListener("click", () => {
    setActiveSection(activeSectionIndex + 1);
  });

  stageBackButton?.addEventListener("click", closeFeatureStage);

  document.querySelectorAll("[data-product-feature]").forEach((button) => {
    button.addEventListener("click", () => {
      const title = button.dataset.productFeatureTitle || "KAIOS Feature";
      const url = button.dataset.productFeatureUrl;
      if (!url) return;
      openFeatureStage(title, url, button);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && stage?.classList.contains("is-open")) {
      event.preventDefault();
      closeFeatureStage();
    }
  });

  const observer = new IntersectionObserver(
    (entries) => {
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

  document.body.classList.add("product-shell-active");
  setActiveSection(0, { scroll: false });
})();
