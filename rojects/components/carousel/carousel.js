const track = document.getElementById("track");
const buttons = document.querySelectorAll("[data-dir]");

function getSlideWidth() {
  return track.getBoundingClientRect().width;
}

buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const dir = Number(btn.dataset.dir);
    track.scrollBy({ left: dir * getSlideWidth(), behavior: "smooth" });
  });
});
