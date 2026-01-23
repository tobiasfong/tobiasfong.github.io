document.addEventListener("DOMContentLoaded", () => {
  // Get all tab buttons
  const tabButtons = document.querySelectorAll(".tab-button");
  // Get all tab panels
  const tabPanels = document.querySelectorAll(".tab-panel");

  // Add click event listeners to all tab buttons
  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      // Remove active class from all buttons and panels
      tabButtons.forEach(btn => btn.classList.remove("active"));
      tabPanels.forEach(panel => panel.classList.remove("active"));
      
      // Add active class to the clicked button and the corresponding panel
      button.classList.add("active");
      const tabId = button.id.replace("tab-", "content-");
      document.getElementById(tabId).classList.add("active");
    });
  });

  // Set the first tab as active by default
  tabButtons[0].classList.add("active");
  tabPanels[0].classList.add("active");
});
