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

// Hero image parallax
(function () {
  const wrap = document.querySelector('.hero-image-wrap');
  if (!wrap) return;
  function onScroll() {
    const y = window.scrollY;
    wrap.style.transform = `translateY(${y * 0.18}px)`;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
})();

// Generic blur-reveal — stagger siblings within the same parent
(function () {
  const els = document.querySelectorAll('.blur-reveal');
  if (!els.length) return;

  // Group siblings so they stagger nicely
  els.forEach(el => {
    const siblings = [...el.parentElement.querySelectorAll('.blur-reveal')];
    const idx = siblings.indexOf(el);
    if (idx > 0) {
      const base = parseFloat(getComputedStyle(el).transitionDelay) || 0;
      el.style.transitionDelay = `${base + idx * 0.12}s`;
    }
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => observer.observe(el));
})();

// Arch cards — slide in from different directions with stagger
(function () {
  const grid = document.querySelector('.arch-grid');
  if (!grid) return;
  let triggered = false;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || triggered) return;
      triggered = true;
      grid.querySelectorAll('.arch-card').forEach((card, i) => {
        setTimeout(() => card.classList.add('revealed'), i * 180);
      });
      observer.disconnect();
    });
  }, { threshold: 0.1 });
  observer.observe(grid);
})();

// Path cards — staggered reveal with scale
(function () {
  const grid = document.querySelector('.path-grid');
  if (!grid) return;
  let triggered = false;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || triggered) return;
      triggered = true;
      grid.querySelectorAll('.path-card').forEach((card, i) => {
        setTimeout(() => card.classList.add('revealed'), i * 150);
      });
      observer.disconnect();
    });
  }, { threshold: 0.1 });
  observer.observe(grid);
})();
