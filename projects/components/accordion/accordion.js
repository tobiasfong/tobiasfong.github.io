document.querySelectorAll("[data-accordion]").forEach((accordion) => {
  accordion.addEventListener("click", (e) => {
    const btn = e.target.closest(".accordion-trigger");
    if (!btn) return;

    const panelId = btn.getAttribute("aria-controls");
    const panel = accordion.querySelector(`#${CSS.escape(panelId)}`);
    if (!panel) return;

    const isOpen = btn.getAttribute("aria-expanded") === "true";

    // Close all items in this accordion (single-open behaviour)
    accordion.querySelectorAll(".accordion-trigger").forEach((b) => b.setAttribute("aria-expanded", "false"));
    accordion.querySelectorAll(".accordion-panel").forEach((p) => (p.hidden = true));

    // If it was closed, open it
    if (!isOpen) {
      btn.setAttribute("aria-expanded", "true");
      panel.hidden = false;
    }
  });
});
