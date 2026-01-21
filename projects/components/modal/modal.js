document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");
  const openModalBtn = document.getElementById("openModalBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");

  console.log("Script loaded and elements found:", modal, openModalBtn, closeModalBtn);

  // Open the modal
  openModalBtn.addEventListener("click", () => {
    console.log("Open modal button clicked");
    modal.style.display = "flex";  // Show the modal
  });

  // Close the modal when the "X" button is clicked
  closeModalBtn.addEventListener("click", () => {
    console.log("Close modal button clicked");
    modal.style.display = "none";  // Hide the modal
  });

  // Close the modal if the user clicks outside of the modal content
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      console.log("Clicked outside the modal");
      modal.style.display = "none";  // Hide modal when clicking outside
    }
  });
});
