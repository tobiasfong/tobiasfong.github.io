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
    { date: '2 December 1942',     name: 'Chicago Pile-1',           img: 'chicago-pile-1.jpg', body: 'The first artificial nuclear reactor that successfully set off a self-sustaining nuclear chain reaction, a major milestone in the Manhattan Project, which was conceived to create nuclear weapons during World War II.[^1] It was led by Enrico Fermi, a winner of the Nobel Prize in Physics in 1938.[^2] He’s also known for the Fermi paradox, which questions where intelligent extraterrestrial life is and why they haven’t reached out to us (perhaps they’ve wiped each other out in interstellar nuclear warfare?).' },
    { date: '16 July 1945',        name: 'Trinity',                  img: 'trinity.jpg', body: 'The first detonation of a nuclear weapon, as part of the Manhattan Project, conducted in New Mexico.[^3] Built in a lab run by J. Robert Oppenheimer, who many of you will be familiar with through Chris Nolan’s 2023 film, it was a plutonium bomb that released approximately 88 terajoules of explosive energy.[^4]' },
    { date: '6 and 9 August 1945', name: 'Atomic bombings of Hiroshima and Nagasaki', img: 'hiroshima.jpg', body: 'The first and only use of nuclear weapons in war. The enriched uranium fission bomb, “Little Boy,” was dropped on Hiroshima, and the plutonium nuclear weapon—similar to Trinity—“Fat Man,” was unleashed on Nagasaki.[^5] About 140,000 people were killed or injured by the bombing in Hiroshima, including those who died from the effects of radiation by the end of 1945.[^6] In Nagasaki, there were approximately 65,000 casualties, also including those who succumbed to radiation effects by the end of the year.[^7]' },
    { date: '1 March 1954',        name: 'Castle Bravo',             img: 'castle-bravo.jpg', body: 'A high-yield thermonuclear weapons test by the United States, it was conducted at Bikini Atoll in the Marshall Islands.[^8] Releasing 63 petajoules, the hydrogen bomb explosion is known more for the radioactive fallout that led to victims of radioactive poisoning among the inhabitants on Rongelap and Utirik, and also the Japanese crew of the <em>Daigo Fukuryumaru</em> (Lucky Dragon Number 5).[^9] The latter, particularly, inspired the creation of the 1954 film, <em>Godzilla</em>.[^10]' },
    { date: 'June 1954',           name: 'Obninsk',                  img: 'obninsk.jpg', body: 'The Soviet Union started operations of the world’s first nuclear power plant to generate electricity for a public power grid, building a city next to it.[^11][^12]' },
    { date: '29 September 1957',   name: 'Kyshtym disaster',         img: 'kyshtym.jpg', body: 'A radioactive contamination accident where an improperly stored underground tank of nuclear waste exploded. Occurring in a plutonium reprocessing plant for nuclear weapons, radioactive material was spread across over 20,000 square kilometers, exposing over 20 villages to highly toxic particles.[^13]' },
    { date: '10 October 1957',     name: 'Windscale fire', img: 'windscale.jpg', body: 'A fire burned in a graphite-moderated reactor in Cumberland, England, for three days, releasing radioactive fallout that spread across the United Kingdom and the rest of Europe. The reactors were built as part of the British postwar atomic bomb project.[^14] It appeared to not be an isolated incident, with a leak of radioactive strontium-90 earlier that year, which was later revealed to have contributed to the contamination even before the fire.[^15]' },
    { date: '5 August 1963',       name: 'Partial Nuclear Test Ban Treaty', img: 'partial-test-ban-treaty.jpg', body: 'Formally known as the Treaty Banning Nuclear Weapon Tests in the Atmosphere, in Outer Space and Under Water, it was signed by the governments of the Soviet Union, United States and the United Kingdom in Moscow.[^16] Prohibiting all test detonations of nuclear weapons, except underground ones, over 120 other countries have joined the treaty since.[^17]' },
    { date: '28 March 1979',       name: 'Three Mile Island accident', img: 'three-mile-island.jpg', body: 'A partial nuclear meltdown of a reactor in Pennsylvania saw the release of radioactive gases and iodine into the environment.[^18] This contributed to a slowdown in the construction of nuclear power plants in the US from 1980 to 1998.[^19]' },
    { date: '26 April 1986',       name: 'Chernobyl disaster', img: 'chernobyl.jpg', body: 'An explosion of a reactor in the Chernobyl Nuclear Power Plant, near Pripyat in Ukraine, hurled particles of nuclear fuel and dangerous fission products into the air, dousing the surroundings in lethal doses of radiation. Almost 120,000 people were evacuated from the 30 kilometers exclusion zone around the power plant, with over a hundred workers suffering from acute radiation syndrome or long-term effects of exposure to radiation.[^20][^21] It remains the worst nuclear disaster in history.' },
    { date: '15 December 1995',    name: 'Treaty of Bangkok', img: 'treaty-of-bangkok.jpg', body: 'Formally known as the Southeast Asia Nuclear-Weapon-Free Zone Treaty, it was signed in Bangkok by 10 members of ASEAN.[^22] Brunei, Cambodia, Indonesia, Laos, Malaysia, Myanmar, Philippines, Singapore, Thailand and Vietnam all agreed to not develop, manufacture or possess nuclear weapons. Nuclear weapons are effectively banned in the region. It includes an article that allows for civilian nuclear power, so ASEAN can still build reactors as long as they don’t weaponize them.[^23]' },
    { date: '11 March 2011',       name: 'Fukushima nuclear accident', img: 'fukushima.jpg', body: 'The Tohoku earthquake and tsunami, in addition to causing significant casualties, also damaged the reactors in the Fukushima Daiichi Nuclear Power Plant, releasing radioactive contaminants into the surrounding environment.[^24] Over 164,000 residents were evacuated.[^25] In addition to the death toll from the earlier earthquake and tsunami, the nuclear accident and the Japanese government’s handling of the evacuation and aftermath led to a loss of public confidence, as well as anxieties over the effects of radiation and nuclear technology, almost 70 years after the nation had atomic bombs dropped on two of its cities. The ruling party of that time, the Democratic Party of Japan, and the then prime minister, Kan Naoto, and his successor, Noda Yoshihiko, instituted shutdowns of nuclear power plants while petitioning citizens to conserve electricity (<em>setsuden</em>).[^26] In 2012, the Liberal Democratic Party regained power through a victory in the elections, and announced they would restart the nuclear power plants.[^27][^28][^29]' }
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
        '<div class="nuc-flash" id="nuc-flash"><b></b></div>' +
      '</div>';
    document.body.appendChild(modal);
    // Ash for the flash: a handful of flakes with their own drift and delay.
    var fl = el('nuc-flash');
    for (var k = 0; k < 18; k++) {
      var a = document.createElement('i');
      a.style.left = (4 + Math.random() * 92).toFixed(1) + '%';
      a.style.setProperty('--x', ((Math.random() - 0.5) * 60).toFixed(0) + 'px');
      a.style.setProperty('--d', (0.2 + Math.random() * 1.4).toFixed(2) + 's');
      fl.appendChild(a);
    }

    modal.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-close')) { closeModal(); return; }
      // A footnote jumps to the source list, which the open card would cover.
      if (e.target.closest && e.target.closest('.nuc-cite a')) { closeModal(); }
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
    el('nuc-modal-body').innerHTML = ev.paras
      ? '<p>' + ev.paras.join('</p><p>') + '</p>'
      : ev.body
        ? '<p>' + ev.body + '</p>'
        : '<p class="nuc-modal-todo">An account of this one goes here.</p>';
    expandCitations(el('nuc-modal-body'));
    modal.hidden = false;
    modalOpen = true;
    document.body.style.overflow = 'hidden';
    modal.querySelector('.nuc-modal-x').focus();
    var flash = el('nuc-flash');
    flash.classList.remove('on');
    if (ev.flash) { void flash.offsetWidth; flash.classList.add('on'); }
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

  /* -- Hibakusha: the three objects in the ruined room ---------------
     Each opens the same popup as the history cards, with its own paragraphs.
     His words; titles italicized. Memory reuses the A-Bomb Dome plate. */
  var THEMES = {
    trauma: {
      name: 'Trauma', img: 'hibakusha-trauma.jpg',
      paras: [
        'The atomic bombing of Hiroshima left psychological effects on the survivors, a psychic numbing where they are forced to unconsciously shut off their emotions to deal with the overwhelming death and destruction. More recently, mothers from Fukushima tested food for radiation, and they ended up being stigmatized. The social anxiety, fear and hysteria are evoked in the 2012 film, <em>The Land of Hope</em> (希望の国), directed by Sono Sion.'
      ]
    },
    memory: {
      name: 'Memory', img: 'hiroshima.jpg',
      paras: [
        'The atomic bombing of Hiroshima is remembered in a myriad of ways, from textbooks to tourism, preservation of ruins—such as the A-Bomb Dome—and survivor testimony. It influences the way Japan perceives itself, often not as an aggressor, but a victim of war, particularly atomic war. It is this same framing that drives much of their anti-nuclear movements, as it is the only nation to have suffered atomic bombing during war.',
        'However, much of that memory covers only Japanese victims. Korean survivors are often left out, despite many of those who succumbed being of Korean origin. Memories of Japanese colonization are glossed over and often, it is Japan’s peace that gets commemorated, with many victims of Japan’s war aggression overshadowed by the larger cloud of atomic fire.',
        'More recently, the 2024 Nobel Peace Prize was awarded to Nihon Hidankyo, which demonstrates through witness testimony and survivors’ stories how crucial it is that we never use nuclear weapons again.'
      ]
    },
    grief: {
      name: 'Grief', img: 'hibakusha-grief.jpg',
      paras: [
        'In the aftermath of Fukushima, a new genre emerges, known as <em>Shinsai Bungaku</em> (震災文学), or catastrophe literature. Also known as Fukushima fiction, these stories and films frequently express how Japan copes with grief over the loss of life in the tragic calamity, as well as their loss of faith in the government. Many are literary works or films like Tawada Yoko’s <em>The Emissary</em>, Furukawa Hideo’s <em>Horses, Horses, in the End the Light Remains Pure</em>, Kobayashi Erika’s <em>Trinity, Trinity, Trinity</em>, Kimura Yusuke’s <em>Sacred Cesium Ground</em> and <em>Isa’s Deluge</em>, Takahashi Genichiro’s <em>Koisuru Genpatsu</em>, Sono Sion’s <em>The Land of Hope</em> (希望の国) and even Anno Hideaki’s <em>Shin Godzilla</em>.'
      ]
    }
  };

  function wireRoom() {
    var room = el('nuc-room');
    if (!room) { return; }
    // The scrollbar's own width, from a hidden scrolling box. Reading
    // innerWidth - clientWidth instead breaks on phones, where anything wider
    // than the screen inflates innerWidth.
    var probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;top:-999px;width:100px;height:100px;overflow:scroll;';
    document.body.appendChild(probe);
    document.documentElement.style.setProperty('--sbw', (probe.offsetWidth - probe.clientWidth) + 'px');
    document.body.removeChild(probe);
    var spots = room.querySelectorAll('.nuc-spot');
    Array.prototype.forEach.call(spots, function (g) {
      var t = THEMES[g.getAttribute('data-theme')];
      if (!t) { return; }
      var open = function () {
        openModal({ date: 'Hibakusha', name: t.name, img: t.img, paras: t.paras, flash: true }, g);
      };
      g.addEventListener('click', open);
      var glow = room.querySelector('.nuc-glow[data-theme="' + g.getAttribute('data-theme') + '"]');
      if (glow) {
        var on = function () { glow.classList.add('on'); };
        var off = function () { glow.classList.remove('on'); };
        g.addEventListener('mouseenter', on);
        g.addEventListener('mouseleave', off);
        g.addEventListener('focus', on);
        g.addEventListener('blur', off);
      }
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });
  }

  /* -- SMR cross-section: clicking a part toggles its label ---------- */
  function wireDiagram() {
    var fig = el('nuc-diagram');
    if (!fig) { return; }
    Array.prototype.forEach.call(fig.querySelectorAll('.nuc-part'), function (g) {
      var lbl = el('nuc-lbl-' + g.getAttribute('data-part'));
      var toggle = function () {
        var open = !g.classList.contains('open');
        g.classList.toggle('open', open);
        g.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (lbl) { lbl.classList.toggle('open', open); }
      };
      g.addEventListener('click', toggle);
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });
  }

  /* -- Exclusion zone: a draggable reactor over a population grid ------
     data/nuclear-zone.json holds Singapore residents (Census 2020) on a
     250 m grid, in km from 103.82E 1.35N; the SVG draws north up, so every
     y is negated. The count is a plain sum of cells inside the circle. */
  function wireZone() {
    var root = el('nuc-zone'), svg = el('nuc-zone-svg');
    if (!root || !svg || !window.fetch) { return; }
    var NS = 'http://www.w3.org/2000/svg';
    var mk = function (tag, attrs, parent) {
      var n = document.createElementNS(NS, tag);
      for (var k in attrs) { n.setAttribute(k, attrs[k]); }
      (parent || svg).appendChild(n);
      return n;
    };
    fetch('/data/nuclear-zone.json').then(function (r) { return r.json(); }).then(function (D) {
      mk('path', { d: D.neighbors, 'class': 'nb' });
      mk('path', { d: D.land, 'class': 'land' });
      mk('path', { d: D.areas, 'class': 'areas' });
      var lab = function (x, y, t) { var n = mk('text', { x: x, y: -y, 'text-anchor': 'middle' }); n.textContent = t; };
      lab(-15, 16, 'MALAYSIA');
      var zone = mk('circle', { 'class': 'zone', r: 30 });
      // A fingertip needs a bigger target than a mouse pointer.
      var coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
      var reactor = mk('circle', { 'class': 'reactor', r: coarse ? 2.6 : 1.1, tabindex: 0, role: 'button',
        'aria-label': 'Reactor. Drag to move; arrow keys also move it.' });
      var R = 30, cx = 0, cy = 0;
      var cells = D.cells, total = D.total;

      function count() {
        var n = 0, r2 = R * R;
        for (var i = 0; i < cells.length; i++) {
          var dx = cells[i][0] - cx, dy = cells[i][1] - cy;
          if (dx * dx + dy * dy <= r2) { n += cells[i][2]; }
        }
        el('nuc-zone-count').textContent = Math.round(n).toLocaleString('en-US') + ' residents inside the zone';
        el('nuc-zone-pct').textContent = (100 * n / total).toFixed(n && n / total < 0.001 ? 2 : 0) +
          '% of Singapore’s residents';
      }
      function draw() {
        zone.setAttribute('cx', cx); zone.setAttribute('cy', -cy); zone.setAttribute('r', R);
        zone.setAttribute('class', R < 1 ? 'zone smr' : 'zone');
        reactor.setAttribute('cx', cx); reactor.setAttribute('cy', -cy);
        count();
      }
      function press(group, btn) {
        Array.prototype.forEach.call(root.querySelectorAll(group + ' button'), function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
      }
      function place(x, y) { cx = x; cy = y; draw(); }
      Array.prototype.forEach.call(root.querySelectorAll('[data-radius]'), function (b) {
        b.addEventListener('click', function () {
          R = parseFloat(b.getAttribute('data-radius'));
          Array.prototype.forEach.call(root.querySelectorAll('[data-radius]'), function (o) {
            o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
          });
          draw();
        });
      });

      // dragging: pointer position -> map km through the SVG's own transform
      var dragging = false;
      function at(e) {
        var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
        var m = svg.getScreenCTM(); if (!m) { return null; }
        var q = pt.matrixTransform(m.inverse());
        return [q.x, -q.y];
      }
      function move(e) {
        if (!dragging) { return; }
        var p = at(e); if (!p) { return; }
        place(Math.max(-25, Math.min(31, p[0])), Math.max(-18, Math.min(17, p[1])));
        e.preventDefault();
      }
      reactor.addEventListener('pointerdown', function (e) {
        dragging = true; reactor.setPointerCapture(e.pointerId); e.preventDefault();
      });
      reactor.addEventListener('pointermove', move);
      reactor.addEventListener('pointerup', function () { dragging = false; });
      reactor.addEventListener('pointercancel', function () { dragging = false; });
      reactor.addEventListener('keydown', function (e) {
        var d = e.shiftKey ? 2 : 0.5, k = e.key;
        if (k === 'ArrowLeft') { place(cx - d, cy); }
        else if (k === 'ArrowRight') { place(cx + d, cy); }
        else if (k === 'ArrowUp') { place(cx, cy + d); }
        else if (k === 'ArrowDown') { place(cx, cy - d); }
        else { return; }
        e.preventDefault();
      });

      // Starts on Jurong Island; drag it anywhere.
      place(D.sites.jurong[0], D.sites.jurong[1]);
    });
  }

  /* -- Footnotes -----------------------------------------------------
     Write a citation anywhere in the prose (HTML or an EVENTS body) as
     [^3]. It becomes a superscript link to the matching numbered source
     at the bottom of the page. Ported from Sustainable Singapore. */
  function expandCitations(root) {
    if (!root) { return; }
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p) { return NodeFilter.FILTER_REJECT; }
        var tag = p.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') {
          return NodeFilter.FILTER_REJECT;
        }
        if (p.closest && p.closest('.nuc-cite, .nuc-refs')) {
          return NodeFilter.FILTER_REJECT;
        }
        return /\[\^\d+\]/.test(n.nodeValue)
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var targets = [], n;
    while ((n = walker.nextNode())) { targets.push(n); }
    targets.forEach(function (node) {
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\[\^\d+\])/).forEach(function (part) {
        var m = part.match(/^\[\^(\d+)\]$/);
        if (m) {
          var sup = document.createElement('sup');
          sup.className = 'nuc-cite';
          var a = document.createElement('a');
          a.href = '#ref-' + m[1];
          a.textContent = m[1];
          a.setAttribute('aria-label', 'See reference ' + m[1]);
          sup.appendChild(a);
          frag.appendChild(sup);
        } else if (part) {
          frag.appendChild(document.createTextNode(part));
        }
      });
      node.parentNode.replaceChild(frag, node);
    });
  }

  function boot() {
    buildStrip();
    wireStrip();
    wireNavMenu();
    wirePageNav();
    wireRoom();
    wireDiagram();
    wireZone();
    expandCitations(document.querySelector('main'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
