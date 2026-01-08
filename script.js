console.log("script loaded");
document.body.dataset.js = "on";
const links = document.querySelectorAll('nav a[href^="/#"], nav a[href^="#"]');
const sections = [...document.querySelectorAll("main section[id]")];

function setActive() {
  const y = window.scrollY + 120;
  let current = sections[0]?.id;

  for (const s of sections) {
    if (s.offsetTop <= y) current = s.id;
  }

  links.forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href").endsWith(`#${current}`));
  });
}

window.addEventListener("scroll", setActive);
setActive();
