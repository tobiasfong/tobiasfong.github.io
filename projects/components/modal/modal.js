document.addEventListener("DOMContentLoaded", () => {
  // First modal
  const modal1 = document.getElementById("modal-1");
  const openModalBtn1 = document.getElementById("openModalBtn-1");
  const closeModalBtn1 = document.getElementById("closeModalBtn-1");

  // Second modal
  const modal2 = document.getElementById("modal-2");
  const openModalBtn2 = document.getElementById("openModalBtn-2");
  const closeModalBtn2 = document.getElementById("closeModalBtn-2");

  // Third modal
  const modal3 = document.getElementById("modal-3");
  const openModalBtn3 = document.getElementById("openModalBtn-3");
  const closeModalBtn3 = document.getElementById("closeModalBtn-3");

  // Check if elements exist
  if (!modal1 || !openModalBtn1 || !closeModalBtn1 || !modal2 || !openModalBtn2 || !closeModalBtn2 || !modal3 || !openModalBtn3 || !closeModalBtn3) {
    console.error("One or more modal elements are missing.");
    return;
  }

  // Open first modal
  openModalBtn1.addEventListener("click", () => {
    modal1.style.display = "flex";  // Show the first modal
  });

  // Close first modal
  closeModalBtn1.addEventListener("click", () => {
    modal1.style.display = "none";  // Hide the first modal
  });

  // Open second modal
  openModalBtn2.addEventListener("click", () => {
    modal2.style.display = "flex";  // Show the second modal
  });

  // Close second modal
  closeModalBtn2.addEventListener("click", () => {
    modal2.style.display = "none";  // Hide the second modal
  });

  // Open third modal
  openModalBtn3.addEventListener("click", () => {
    modal3.style.display = "flex";  // Show the third modal
  });

  // Close third modal
  closeModalBtn3.addEventListener("click", () => {
    modal3.style.display = "none";  // Hide the third modal
  });

  // Close the modal if the user clicks outside of the modal content
  window.addEventListener("click", (e) => {
    if (e.target === modal1) {
      modal1.style.display = "none";  // Hide first modal if clicking outside
    } else if (e.target === modal2) {
      modal2.style.display = "none";  // Hide second modal if clicking outside
    } else if (e.target === modal3) {
      modal3.style.display = "none";  // Hide third modal if clicking outside
    }
  });
});
