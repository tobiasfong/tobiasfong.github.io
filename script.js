// Nav scroll-spy
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
const sections = [...document.querySelectorAll('section[id]')];

function setActive() {
  const y = window.scrollY + 100;
  let current = sections[0]?.id;
  for (const s of sections) {
    if (s.offsetTop <= y) current = s.id;
  }
  navLinks.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
  });
}

window.addEventListener('scroll', setActive, { passive: true });
setActive();

// Generic blur-reveal for text elements
(function () {
  const els = document.querySelectorAll('.blur-reveal');
  if (!els.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.35, rootMargin: '0px 0px -60px 0px' });
  els.forEach(el => observer.observe(el));
})();

// Arch cards — staggered reveal
(function () {
  const grid = document.querySelector('.arch-grid');
  if (!grid) return;
  let triggered = false;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || triggered) return;
      triggered = true;
      grid.querySelectorAll('.arch-card').forEach((card, i) => {
        setTimeout(() => card.classList.add('revealed'), i * 250);
      });
      observer.disconnect();
    });
  }, { threshold: 0.15 });
  observer.observe(grid);
})();

// Path cards — staggered reveal
(function () {
  const grid = document.querySelector('.path-grid');
  if (!grid) return;
  let triggered = false;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || triggered) return;
      triggered = true;
      grid.querySelectorAll('.path-card').forEach((card, i) => {
        setTimeout(() => card.classList.add('revealed'), i * 250);
      });
      observer.disconnect();
    });
  }, { threshold: 0.15 });
  observer.observe(grid);
})();
