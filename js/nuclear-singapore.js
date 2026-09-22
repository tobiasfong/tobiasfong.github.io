/* ============================================================
   Nuclear Singapore — history strip + page nav
   ------------------------------------------------------------
   Everything runs client-side, no build step, no backend. The
   history strip is the carousel from the JSC5203 week 2 lecture
   app, rebuilt with the two corrections that came out of the
   tree strip on the Sustainable Singapore page:

     • the arrows live in the container's padding, OUTSIDE the
       scroller, so nothing ever sits on top of a card
     • an arrow press does NOT cancel the crawl — hovering is
       what holds it still, and it resumes from wherever the
       reader left it
   ============================================================ */
(function () {
  'use strict';

  function el(id) { return document.getElementById(id); }

  /* ── The events ───────────────────────────────────────────────
     Plates are empty for now; `img` is filled in later and the card
     renders a dashed ring until then. Dates are the event itself, not
     the announcement of it. */
  var EVENTS = [
    { date: '2 December 1942',     name: 'Chicago Pile-1',           img: null, body: '' },
    { date: '16 July 1945',        name: 'Trinity',                  img: null, body: '' },
    { date: '6 and 9 August 1945', name: 'Hiroshima and Nagasaki',   img: null, body: '' },
    { date: '1 March 1954',        name: 'Castle Bravo',             img: null, body: '' },
    { date: '27 June 1954',        name: 'Obninsk',                  img: null, body: '' },
    { date: '29 September 1957',   name: 'Kyshtym',                  img: null, body: '' },
    { date: '10 October 1957',     name: 'Windscale',                img: null, body: '' },
    { date: '5 August 1963',       name: 'Partial Test Ban Treaty',  img: null, body: '' },
    { date: '28 March 1979',       name: 'Three Mile Island',        img: null, body: '' },
    { date: '26 April 1986',       name: 'Chernobyl',                img: null, body: '' },
    { date: '15 December 1995',    name: 'Treaty of Bangkok',        img: null, body: '' },
    { date: '11 March 2011',       name: 'Fukushima Daiichi',        img: null, body: '' },
    { date: '2025\u20132026',       name: 'Singapore\u2019s nuclear study', img: null, body: '' }
  ];

  function buildStrip() {
    var track = el('nuc-track');
    if (!track) { return; }
    EVENTS.forEach(function (ev) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'nuc-stop';
      var plate = ev.img
        ? '<span class="nuc-plate"><img src="/img/nuclear/' + ev.img +
          '" alt="" loading="lazy" width="240" height="240" /></span>'
        : '<span class="nuc-plate nuc-plate--empty"></span>';
      b.innerHTML = plate +
        '<span class="nuc-date">' + ev.date + '</span>' +
        '<span class="nuc-name">' + ev.name + '</span>';
      b.setAttribute('aria-haspopup', 'dialog');
      b.addEventListener('click', function () { openModal(ev, b); });
      track.appendChild(b);
    });
  }

  /* -- The card modal ----------------------------------------------
     Built once on first open rather than sitting in the HTML, so the page
     ships without markup that most readers never see. Same shape as the
     timeline modal on Sustainable Singapore.

     modalOpen is read by the crawl: a strip that keeps sliding behind an
     open card is motion the reader did not ask for. */
  var modal = null, modalPrevFocus = null, modalOpen = false;

  function buildModal() {
    modal = document.createElement('div');
    modal.className = 'nuc-modal';
    modal.id = 'nuc-modal';
    modal.hidden = true;
    modal.innerHTML =
      '<div class="nuc-modal-back" data-close></div>' +
      '<div class="nuc-modal-box" role="dialog" aria-modal="true" aria-labelledby="nuc-modal-title">' +
        '<button type="button" class="nuc-modal-x" data-close aria-label="Close">&times;</button>' +
        '<div class="nuc-modal-scroll">' +
          '<div class="nuc-modal-date" id="nuc-modal-date"></div>' +
          '<h3 id="nuc-modal-title"></h3>' +
          '<div id="nuc-modal-media"></div>' +
          '<div id="nuc-modal-body"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    modal.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-close')) { closeModal(); }
    });
    document.addEventListener('keydown', function (e) {
      if (modal.hidden) { return; }
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key !== 'Tab') { return; }
      // Keep Tab inside the dialog while it is open.
      var f = modal.querySelectorAll('button, [href]');
      if (!f.length) { return; }
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    });
  }

  function openModal(ev, trigger) {
    if (!modal) { buildModal(); }
    modalPrevFocus = trigger || document.activeElement;
    el('nuc-modal-date').textContent = ev.date;
    el('nuc-modal-title').textContent = ev.name;
    el('nuc-modal-media').innerHTML = ev.img
      ? '<img src="/img/nuclear/' + ev.img + '" alt="" />' : '';
    el('nuc-modal-body').innerHTML = ev.body
      ? '<p>' + ev.body + '</p>'
      : '<p class="nuc-modal-todo">An account of this one goes here.</p>';
    modal.hidden = false;
    modalOpen = true;
    document.body.style.overflow = 'hidden';
    modal.querySelector('.nuc-modal-x').focus();
  }

  function closeModal() {
    if (!modal || modal.hidden) { return; }
    modal.hidden = true;
    modalOpen = false;
    document.body.style.overflow = '';
    if (modalPrevFocus && modalPrevFocus.focus) { modalPrevFocus.focus(); }
  }

  /* ── The crawl ────────────────────────────────────────────────
     Position is kept as a float and written to scrollLeft each frame.
     Letting scrollLeft accumulate directly stalls, because browsers
     round it to whole pixels and a sub-pixel increment rounds away to
     nothing.

     rAF is the driver on purpose: browsers suspend it for hidden tabs,
     so a backgrounded page stops and resumes on return with no
     visibility bookkeeping here. */
  var CRAWL_PXPS = 30;
  var DWELL_MS = 750;   // a beat at each end before turning around

  function wireStrip() {
    var wrap = el('nuc-strip'), view = el('nuc-view');
    var prev = el('nuc-prev'), next = el('nuc-next');
    if (!wrap || !view) { return; }

    var reduced = !!(window.matchMedia &&
                     window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var pos = 0, dir = 1, held = false, last = null, dwell = 0;

    function maxScroll() { return view.scrollWidth - view.clientWidth; }

    // One card plus its padding, measured rather than hardcoded, so a change
    // to the card width in CSS cannot silently desync the arrow step.
    function cardStep() {
      var card = view.querySelector('.nuc-stop');
      return card ? card.offsetWidth : Math.round(view.clientWidth * 0.8);
    }

    function nudge(cards) {
      view.scrollBy({ left: cards * cardStep(),
                      behavior: reduced ? 'auto' : 'smooth' });
    }
    if (prev) { prev.addEventListener('click', function () { nudge(-1); }); }
    if (next) { next.addEventListener('click', function () { nudge(1); }); }

    function hold() { held = true; }
    function release() { held = false; }
    wrap.addEventListener('mouseenter', hold);
    wrap.addEventListener('mouseleave', release);
    wrap.addEventListener('focusin', hold);
    wrap.addEventListener('focusout', release);

    // Touch has no mouseleave to resume on, so without a timer one tap would
    // stall the strip for good. The delay lets momentum settle first.
    var touchTimer = null;
    wrap.addEventListener('touchstart', function () {
      if (touchTimer) { window.clearTimeout(touchTimer); touchTimer = null; }
      hold();
    }, { passive: true });
    wrap.addEventListener('touchend', function () {
      if (touchTimer) { window.clearTimeout(touchTimer); }
      touchTimer = window.setTimeout(release, 1200);
    }, { passive: true });

    // The arrows are wired above this line on purpose: someone who has asked
    // for reduced motion still gets a strip they can drive, just not one that
    // moves on its own.
    if (reduced) { return; }

    function step(t) {
      if (last === null) { last = t; }
      var dt = Math.min(t - last, 60);
      last = t;
      var max = maxScroll();
      if (held || modalOpen) {
        // Follow the reader, including any arrow scroll still in flight, so
        // releasing carries on from there instead of snapping back.
        pos = view.scrollLeft;
        dwell = 0;
      } else if (dwell > 0) {
        dwell -= dt;
      } else if (max > 1) {
        pos += dir * (dt / 1000) * CRAWL_PXPS;
        if (pos >= max) { pos = max; dir = -1; dwell = DWELL_MS; }
        else if (pos <= 0) { pos = 0; dir = 1; dwell = DWELL_MS; }
        view.scrollLeft = pos;
      }
      window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  /* ── The Contents menu ────────────────────────────────────────
     CSS already opens it on hover and on focus-within. This adds the
     click path, which is the only one a touch screen has, and closes it
     on Escape or on a click outside. */
  function wireNavMenu() {
    var menu = el('ss-nav-menu'), btn = el('ss-nav-contents'), panel = el('ss-nav-links');
    if (!menu || !btn || !panel) { return; }

    function setOpen(open) {
      if (open) { panel.setAttribute('data-open', 'true'); }
      else { panel.removeAttribute('data-open'); }
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(panel.getAttribute('data-open') !== 'true');
    });
    // Following a section link should put the menu away behind you.
    panel.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { setOpen(false); }
    });
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target)) { setOpen(false); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { setOpen(false); }
    });
  }

  /* ── Scroll spy ───────────────────────────────────────────────
     Marks the section the reader is in. Driven off scroll position
     rather than IntersectionObserver, because "whichever section the
     sticky bar last passed" is the answer a reader expects when the
     sections are wildly different heights. */
  function wirePageNav() {
    var nav = el('ss-nav'), panel = el('ss-nav-links');
    if (!nav || !panel) { return; }
    var links = [].slice.call(panel.querySelectorAll('a'));
    var targets = links.map(function (a) { return el(a.getAttribute('href').slice(1)); });

    function measure() {
      document.documentElement.style.setProperty(
        '--ss-nav-h', Math.round(nav.getBoundingClientRect().height) + 'px');
    }

    var current = null;
    function update() {
      var stick = nav.getBoundingClientRect().bottom + 16;
      var found = 0;
      for (var i = 0; i < targets.length; i++) {
        if (targets[i] && targets[i].getBoundingClientRect().top <= stick) { found = i; }
      }
      // The last section rarely reaches the top of the viewport, so at the
      // very bottom of the page nothing would ever mark it.
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
        found = links.length - 1;
      }
      if (found === current) { return; }
      current = found;
      links.forEach(function (a, i) {
        if (i === found) { a.setAttribute('aria-current', 'true'); }
        else { a.removeAttribute('aria-current'); }
      });
    }

    measure();
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', function () { measure(); update(); });
  }

  function boot() {
    buildStrip();
    wireStrip();
    wireNavMenu();
    wirePageNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
