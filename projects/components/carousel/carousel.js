document.querySelectorAll(".carousel").forEach((carousel) => {
  const track = carousel.querySelector(".carousel-track");
  const buttons = carousel.querySelectorAll("[data-dir]");

  function getSlideWidth() {
    return track.getBoundingClientRect().width;
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const dir = Number(btn.dataset.dir);
      track.scrollBy({ left: dir * getSlideWidth(), behavior: "smooth" });
    });
  });
});
