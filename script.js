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

// A Starry Knight page carousel
(function () {
  const carousel = document.querySelector('.ask-carousel');
  if (!carousel) return;
  const track = carousel.querySelector('.ask-carousel-track');
  const imgs = carousel.querySelectorAll('.ask-carousel-track img');
  const dots = carousel.querySelectorAll('.ask-dot');
  const prev = carousel.querySelector('.belt-btn--prev');
  const next = carousel.querySelector('.belt-btn--next');
  const total = imgs.length;
  let idx = 0;
  let timer;

  function goTo(n) {
    idx = (n + total) % total;
    track.style.transform = `translateX(-${idx * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('ask-dot--active', i === idx));
  }

  function startAuto() {
    timer = setInterval(() => goTo(idx + 1), 3500);
  }

  function stopAuto() { clearInterval(timer); }

  prev.addEventListener('click', () => { stopAuto(); goTo(idx - 1); startAuto(); });
  next.addEventListener('click', () => { stopAuto(); goTo(idx + 1); startAuto(); });
  dots.forEach((d, i) => d.addEventListener('click', () => { stopAuto(); goTo(i); startAuto(); }));
  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', startAuto);

  startAuto();
})();

// Belt carousel — arrow buttons + pause on hover
(function () {
  const wrap = document.querySelector('.belt-wrap');
  if (!wrap) return;
  const track = wrap.querySelector('.belt-track');
  const prevBtn = wrap.querySelector('.belt-btn--prev');
  const nextBtn = wrap.querySelector('.belt-btn--next');

  const STEP = 320 + 20; // image width + gap
  let offset = 0;
  let manual = false; // true once user clicks an arrow

  function captureOffset() {
    // Read current animated position from computed style, then freeze it
    const m = new DOMMatrix(getComputedStyle(track).transform);
    offset = m.m41;
    track.style.animation = 'none';
    track.style.transform = `translateX(${offset}px)`;
  }

  function move(dir) {
    if (!manual) { captureOffset(); manual = true; }
    const half = track.scrollWidth / 2;
    offset += dir * STEP;
    // wrap seamlessly using the duplicated set
    if (offset < -half) offset += half;
    if (offset > 0) offset -= half;
    track.style.transition = 'transform 0.35s ease';
    track.style.transform = `translateX(${offset}px)`;
    setTimeout(() => { track.style.transition = ''; }, 360);
  }

  prevBtn.addEventListener('click', () => move(1));
  nextBtn.addEventListener('click', () => move(-1));
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
