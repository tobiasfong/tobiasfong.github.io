// Get modal and buttons
const modal = document.getElementById("modal");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

// Open the modal
openModalBtn.addEventListener("click", () => {
  modal.style.display = "flex";  // Show the modal
});

// Close the modal when the "X" button is clicked
closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";  // Hide the modal
});

// Close the modal if the user clicks outside of the modal content
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";  // Hide modal when clicking outside
  }
});
