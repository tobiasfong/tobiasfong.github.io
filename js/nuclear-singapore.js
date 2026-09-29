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
    el('nuc-modal-body').innerHTML = ev.html ? ev.html : ev.paras
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
      var defs = mk('defs', {});
      var pat = mk('pattern', { id: 'nuc-hatch', width: 0.6, height: 0.6,
        patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
      mk('rect', { width: 0.6, height: 0.6, fill: '#c3ccd5' }, pat);
      mk('line', { x1: 0, y1: 0, x2: 0, y2: 0.6, stroke: '#9aa6b3', 'stroke-width': 0.22 }, pat);
      var busy = D.busy || [];
      busy.forEach(function (b) { mk('path', { d: b.d, 'class': 'busy' }); });
      var lab = function (x, y, t) { var n = mk('text', { x: x, y: -y, 'text-anchor': 'middle' }); n.textContent = t; };
      lab(-15, 16, 'MALAYSIA');
      busy.forEach(function (b) {
        var t = mk('text', { x: b.at[0], y: -b.at[1] + 0.3, 'text-anchor': 'middle', 'class': 'busy-label' });
        t.textContent = b.name;
      });
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
        // Name any busy, non-residential place the zone reaches.
        var hit = busy.filter(function (b) {
          return b.pts.some(function (q) {
            var dx = q[0] - cx, dy = q[1] - cy;
            return dx * dx + dy * dy <= r2;
          });
        }).map(function (b) { return b.name; });
        el('nuc-zone-pct').textContent = (100 * n / total).toFixed(n && n / total < 0.001 ? 2 : 0) +
          '% of Singapore’s residents' + (R < 1 && hit.length ? ' · ' + hit.join(', ') : '');
      }
      function draw() {
        zone.setAttribute('cx', cx); zone.setAttribute('cy', -cy); zone.setAttribute('r', R);
        zone.setAttribute('class', R < 1 ? 'zone smr' : 'zone');
        // The named busy places only matter at the small zone's scale.
        svg.classList.toggle('smr-mode', R < 1);
        // The dot must stay smaller than a 0.5 km zone, or it hides the zone entirely.
        reactor.setAttribute('r', R < 1 ? 0.28 : (coarse ? 2.6 : 1.1));
        reactor.setAttribute('class', R < 1 ? 'reactor small' : 'reactor');
        reactor.setAttribute('cx', cx); reactor.setAttribute('cy', -cy);
        count();
      }
      function press(group, btn) {
        Array.prototype.forEach.call(root.querySelectorAll(group + ' button'), function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
      }
      // Kept on the map, whether dragged or moved with the arrow keys.
      function place(x, y) { cx = Math.max(-25, Math.min(31, x)); cy = Math.max(-18, Math.min(17, y)); draw(); }
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

  /* -- Waste-heat minigame --------------------------------------------
     Four slots, nine parts. The machine decides which option card the
     result reveals; the heat source and tap decide the rating, following
     the temperatures in the research: condenser water (30–45 °C) is too
     cool to drive a chiller or supply process steam, extracted steam works
     at a cost in electricity, and a high-temperature reactor has heat to
     spare. The tank only helps a chiller. */
  var PARTS = [
    { id: 'std', kind: 'source', name: 'Water-cooled SMR' },
    { id: 'htr', kind: 'source', name: 'High-temperature SMR' },
    { id: 'cond', kind: 'tap', name: 'Condenser water', note: '30–45 °C' },
    { id: 'steam', kind: 'tap', name: 'Extracted steam' },
    { id: 'chiller', kind: 'machine', name: 'Absorption chiller' },
    { id: 'distiller', kind: 'machine', name: 'Distiller' },
    { id: 'line', kind: 'machine', name: 'Steam line' },
    { id: 'tank', kind: 'storage', name: 'Chilled-water tank' },
    { id: 'none', kind: 'storage', name: 'No storage' }
  ];
  var LEVELS = ['Low', 'Medium', 'High'];

  function rateBuild(b) {
    var lvl, why, cards = [];
    if (b.machine === 'chiller') {
      cards.push('cooling');
      if (b.tap === 'cond') { lvl = 0; why = 'The condenser water is only about 30–45 °C, which is too low to drive an absorption chiller. It will need to be supplemented by other heat sources, such as solar.'; }
      else if (b.source === 'std') { lvl = 1; why = 'While the steam generated by a water-cooled SMR is hot enough to power the chillers, diverting it away for cooling means the reactor generates less electricity.'; }
      else { lvl = 2; why = 'A high-temperature reactor, such as China’s HTR-PM, which can reach about 750 °C, produces so much heat that a small portion of it can power the chillers without much loss of electricity.'; }
      if (b.storage === 'tank') {
        cards.push('storage');
        if (lvl === 1) { lvl = 2; }
        why += ' The chilled-water tank allows the reactor to run steadily, while covering for any spikes in demand.';
      }
    } else if (b.machine === 'distiller') {
      cards.push('desalination');
      if (b.tap === 'cond') { lvl = 0; why = 'Condenser water is too cool to distill seawater efficiently. Nuclear desalination uses steam or hotter water.'; }
      else { lvl = 2; why = 'Reactor steam is very efficient in distilling seawater.'; }
      if (b.storage === 'tank') { why += ' There’s nothing to store in the chilled-water tank.'; }
    } else {
      cards.push('steam');
      if (b.tap === 'cond') { lvl = 0; why = 'Condenser water is far too cool for Jurong Island’s chemical plants, which require hot steam.'; }
      else if (b.source === 'std') { lvl = 1; why = 'Though a water-cooled SMR’s steam is hot enough for some industrial uses, it’s not sufficient for the hottest chemical processes.'; }
      else { lvl = 2; why = 'A high-temperature reactor’s heat is designed to be hot enough for chemical plants to use.'; }
      if (b.storage === 'tank') { why += ' There’s nothing to store in the chilled-water tank.'; }
    }
    return { level: LEVELS[lvl], why: why, cards: cards };
  }

  function wireGame() {
    var game = el('nuc-game');
    if (!game) { return; }
    var tray = el('nuc-game-tray'), result = el('nuc-game-result');
    // Dragging only with a mouse or pen. On touch screens a drag and a scroll
    // look the same, so parts are placed by tapping, and swipes scroll.
    var canDrag = !(window.matchMedia && matchMedia('(pointer: coarse)').matches);
    game.classList.toggle('can-drag', canDrag);
    if (!canDrag) { el('nuc-game-hint').textContent = 'Tap a part, then tap its socket in the reactor.'; }
    var slots = {}, build = {}, picked = null;
    Array.prototype.forEach.call(game.querySelectorAll('.nuc-slot'), function (s) { slots[s.getAttribute('data-kind')] = s; });

    var tiles = {};
    PARTS.forEach(function (p) {
      var t = document.createElement('div');
      t.className = 'nuc-piece';
      t.setAttribute('role', 'button');
      t.setAttribute('tabindex', '0');
      t.setAttribute('data-kind', p.kind);
      t.innerHTML = '<img src="/img/nuclear/part-' + p.id + '.jpg" alt="" />' +
        '<span>' + p.name + '</span>' + (p.note ? '<small>' + p.note + '</small>' : '');
      tiles[p.id] = t;
      tray.appendChild(t);
      t.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(p); }
      });
      // drag with the pointer; a press without movement counts as a tap
      if (!canDrag) { t.addEventListener('click', function () { pick(p); }); return; }
      t.addEventListener('pointerdown', function (e) {
        var sx = e.clientX, sy = e.clientY, ghost = null, over = null;
        t.setPointerCapture(e.pointerId);
        function slotAt(x, y) {
          var s = slots[p.kind], r = s.getBoundingClientRect();
          return (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) ? s : null;
        }
        function move(ev) {
          if (!ghost && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 6) { return; }
          if (!ghost) {
            ghost = document.createElement('div');
            ghost.className = 'nuc-ghost';
            ghost.innerHTML = '<img src="/img/nuclear/part-' + p.id + '.jpg" alt="" />';
            document.body.appendChild(ghost);
            slots[p.kind].classList.add('ready');
          }
          ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
          var s = slotAt(ev.clientX, ev.clientY);
          if (over && over !== s) { over.classList.remove('over'); }
          over = s; if (s) { s.classList.add('over'); }
        }
        function up(ev) {
          t.removeEventListener('pointermove', move);
          t.removeEventListener('pointerup', up);
          t.removeEventListener('pointercancel', up);
          slots[p.kind].classList.remove('ready');
          if (over) { over.classList.remove('over'); }
          if (!ghost) { pick(p); return; }
          document.body.removeChild(ghost);
          if (ev.type === 'pointerup' && slotAt(ev.clientX, ev.clientY)) { place(p); }
        }
        t.addEventListener('pointermove', move);
        t.addEventListener('pointerup', up);
        t.addEventListener('pointercancel', up);
      });
    });

    function pick(p) {
      Object.keys(tiles).forEach(function (k) { tiles[k].classList.remove('picked'); });
      Object.keys(slots).forEach(function (k) { slots[k].classList.remove('ready'); });
      if (picked === p) { picked = null; return; }
      picked = p;
      tiles[p.id].classList.add('picked');
      slots[p.kind].classList.add('ready');
    }
    function place(p) {
      var s = slots[p.kind];
      if (build[p.kind]) { tiles[build[p.kind]].classList.remove('used'); }
      build[p.kind] = p.id;
      tiles[p.id].classList.add('used');
      var old = s.querySelector('img'); if (old) { s.removeChild(old); }
      var im = document.createElement('img'); im.src = '/img/nuclear/part-' + p.id + '.jpg'; im.alt = '';
      s.insertBefore(im, s.firstChild);
      s.classList.add('filled');
      s.querySelector('.nuc-slot-label').textContent = p.name;
      picked = null;
      Object.keys(tiles).forEach(function (k) { tiles[k].classList.remove('picked'); });
      Object.keys(slots).forEach(function (k) { slots[k].classList.remove('ready'); });
      check();
    }
    Object.keys(slots).forEach(function (kind) {
      var s = slots[kind];
      var act = function () {
        if (picked && picked.kind === kind) { place(picked); }
      };
      s.addEventListener('click', act);
      s.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); }
      });
    });

    function pipes() {
      Array.prototype.forEach.call(game.querySelectorAll('.pipe'), function (p) {
        p.classList.toggle('on', !!(build[p.getAttribute('data-a')] && build[p.getAttribute('data-b')]));
      });
      var done = !!(build.source && build.tap && build.machine && build.storage);
      el('nuc-machine').classList.toggle('running', done);
    }
    function check() {
      pipes();
      if (!(build.source && build.tap && build.machine && build.storage)) { result.hidden = true; return; }
      var r = rateBuild(build);
      result.setAttribute('data-level', r.level);
      el('nuc-result-level').textContent = r.level;
      el('nuc-result-why').textContent = r.why;
      var box = el('nuc-result-cards');
      box.innerHTML = '';
      box.className = 'nuc-result-cards' + (r.cards.length > 1 ? ' two' : '');
      r.cards.forEach(function (k) {
        var tp = el('nuc-opt-' + k);
        if (tp) { box.appendChild(tp.content.cloneNode(true)); }
      });
      result.hidden = false;
      result.style.animation = 'none'; void result.offsetWidth; result.style.animation = '';
    }
    // For readers who skip the game: all four cards, without ratings.
    var allBtn = el('nuc-game-all'), allBox = el('nuc-game-options');
    allBtn.addEventListener('click', function () {
      if (!allBox.children.length) {
        ['cooling', 'desalination', 'storage', 'steam'].forEach(function (k) {
          allBox.appendChild(el('nuc-opt-' + k).content.cloneNode(true));
        });
      }
      var open = allBox.hidden;
      allBox.hidden = !open;
      allBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      allBtn.textContent = open ? 'I’d rather build now.' : 'For those who would rather cheat than construct.';
    });
    el('nuc-game-reset').addEventListener('click', function () {
      build = {}; picked = null; result.hidden = true;
      pipes();
      var labels = { source: 'Heat source', tap: 'Heat tap', machine: 'Machine', storage: 'Storage' };
      Object.keys(slots).forEach(function (k) {
        var s = slots[k], im = s.querySelector('img');
        if (im) { s.removeChild(im); }
        s.classList.remove('filled', 'ready');
        s.querySelector('.nuc-slot-label').textContent = labels[k];
      });
      Object.keys(tiles).forEach(function (k) { tiles[k].classList.remove('used', 'picked'); });
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

  /* ── Fusion: the mecha builds the reactor ────────────────────────
     Supreme Commander's build effect, in code: a wireframe ghost of the
     reactor, then the solid reactor rising behind a build line while the
     beam from the mecha's forearm plays along it. Runs once when the scene
     scrolls into view; "Build again" replays it. The finished reactor
     opens the popup. Coordinates are in the 1328 x 800 hall plate. */
  // Achieved (solid dots) above the "today" line, targets (hollow red) below. His text.
  var FUSION_DONE = [
    ['February 2025', 'France’s WEST tokamak is able to contain its plasma for 1,337 seconds,[^42] beating China’s EAST tokamak’s achievement of 1,066 seconds a month earlier.[^43]'],
    ['April 2025', 'The US National Ignition Facility produced 8.6 megajoules of energy from 2.08 megajoules of laser energy, over four times the input.[^44] Though this does not include the electricity powering the lasers, which will shift the calculations toward a large net loss.'],
    ['January 2026', 'China’s EAST held stable plasma at 1.3–1.65 times the density believed to be the limit.[^45]'],
    ['September 2026', 'ENN’s Xuanlong-50U achieved a hydrogen-boron fusion reaction.[^46] Hydrogen-boron fusion releases almost no neutrons, which means fusion reactors that use this fuel will produce almost no radioactive waste.']
  ];
  var FUSION_GOALS = [
    ['2027', 'SPARC, from the US company Commonwealth Fusion Systems, and China’s BEST are aiming to produce plasma in 2027.[^47][^48]'],
    ['2028', 'Helion aims to deliver power to Microsoft through the grid by 2028,[^49] having acquired the world’s first fusion power-plant operating licenses in June 2026.[^50]'],
    ['2034 and 2039', 'ITER still aims to launch research operations in 2034,[^51] and begin with real fusion reactor fuel in 2039.[^52]']
  ];
  function timeline(items, cls) {
    return '<ol class="nuc-tl ' + cls + '">' + items.map(function (it) {
      return '<li><span class="nuc-tl-date">' + it[0] + '</span><p>' + it[1] + '</p></li>';
    }).join('') + '</ol>';
  }
  var FUSION = {
    date: 'As of September 2026', name: 'How close are we?',
    html: '<div class="nuc-tl-group">What we have achieved so far</div>' + timeline(FUSION_DONE, 'nuc-tl--done') +
      '<div class="nuc-tl-today"><span>Today · September 2026</span></div>' +
      '<div class="nuc-tl-group">Targets</div>' + timeline(FUSION_GOALS, 'nuc-tl--goal')
  };

  function wireFusion() {
    var stage = el('nuc-fz');
    if (!stage) { return; }
    var reactor = el('nuc-fz-reactor');
    var wire = stage.querySelector('.nuc-fz-wire'), solid = stage.querySelector('.nuc-fz-solid');
    var scan = stage.querySelector('.nuc-fz-scan'), shadow = stage.querySelector('.nuc-fz-shadow');
    var beam = el('nuc-fz-beam'), muzzle = el('nuc-fz-muzzle'), sparksG = el('nuc-fz-sparks');
    var NS = 'http://www.w3.org/2000/svg';
    var NOZ = { x: 452, y: 468 };
    var R = { x: 0.57 * 1328, y: 0.215 * 800, w: 0.40 * 1328 };
    R.h = R.w * 588 / 620;
    var GHOST = 900, BUILD = 5200, running = false, sparks = [];

    function reset() {
      stage.classList.remove('built');
      wire.style.opacity = 0; shadow.style.opacity = 0;
      solid.style.clipPath = 'inset(100% 0 0 0)';
      scan.style.opacity = 0; beam.setAttribute('points', ''); muzzle.setAttribute('r', 0);
      sparks.forEach(function (s) { s.el.remove(); }); sparks = [];
    }
    function finish() {
      running = false;
      wire.style.opacity = 0; scan.style.opacity = 0; shadow.style.opacity = 1;
      solid.style.clipPath = 'inset(0 0 0 0)';
      beam.setAttribute('points', ''); muzzle.setAttribute('r', 0);
      stage.classList.add('built');
    }
    function spark(x, y) {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', 1.5 + Math.random() * 2);
      sparksG.appendChild(c);
      var a = Math.random() * Math.PI * 2, v = 90 + Math.random() * 220;
      sparks.push({ el: c, x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, life: 0, max: 0.35 + Math.random() * 0.4 });
    }
    function run() {
      if (running) { return; }
      reset(); running = true;
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
      wire.style.opacity = 0.9;
      var t0 = performance.now(), last = t0;
      function frame(now) {
        var dt = Math.min(0.05, (now - last) / 1000); last = now;
        var t = now - t0;
        if (running && t > GHOST) {
          var p = Math.min(1, (t - GHOST) / BUILD);
          var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;   // ease in-out
          solid.style.clipPath = 'inset(' + ((1 - e) * 100).toFixed(2) + '% 0 0 0)';
          scan.style.top = ((1 - e) * 100).toFixed(2) + '%';
          scan.style.opacity = 1; shadow.style.opacity = e;
          // the beam plays back and forth along the build line
          var ty = R.y + (1 - e) * R.h;
          var tx = R.x + R.w * (0.5 + 0.36 * Math.sin(t / 260));
          var spread = 26 + 10 * Math.sin(t / 90);
          beam.setAttribute('points', [NOZ.x, NOZ.y - 3, tx - spread, ty, tx + spread, ty, NOZ.x, NOZ.y + 3].join(' '));
          beam.style.opacity = 0.75 + Math.random() * 0.25;
          muzzle.setAttribute('r', 7 + Math.random() * 3);
          if (Math.random() < 0.8) { spark(tx + (Math.random() - 0.5) * spread, ty); }
          if (p >= 1) { finish(); }
        }
        sparks = sparks.filter(function (s) {
          s.life += dt;
          if (s.life > s.max) { s.el.remove(); return false; }
          s.vy += 520 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
          s.el.setAttribute('cx', s.x.toFixed(1)); s.el.setAttribute('cy', s.y.toFixed(1));
          s.el.setAttribute('opacity', (1 - s.life / s.max).toFixed(2));
          return true;
        });
        if (running || sparks.length) { requestAnimationFrame(frame); }
      }
      requestAnimationFrame(frame);
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { io.disconnect(); run(); }
      }, { threshold: 0.45 });
      io.observe(stage);
    } else { finish(); }
    el('nuc-fz-replay').addEventListener('click', run);
    function open() { if (stage.classList.contains('built')) { openModal(FUSION, reactor); } }
    reactor.addEventListener('click', open);
    reactor.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  }

  /* ── Plasma demo: can the magnets hold it? ───────────────────────
     A mock-up, not a research simulation. The magnets make an invisible
     cage in the middle of the chamber. Hotter plasma moves faster and
     pushes harder on the cage, so it swells. Each set of magnets has a
     limit: past it the cage starts to wobble, the plasma works its way
     out, touches the wall and cools in an instant (a disruption). Fusion
     then simply stops; there is no chain reaction to run away. Stronger
     magnets raise the limit. Temperatures are in millions of °C: fusion
     needs about 100. The limits (130 and 208) are illustrative. */
  function wirePlasma() {
    var box = el('nuc-plasma');
    if (!box) { return; }
    var cv = el('nuc-plasma-canvas'), ctx = cv.getContext('2d');
    var heat = el('nuc-plasma-heat'), out = el('nuc-plasma-temp'), status = el('nuc-plasma-status');
    var magBtns = box.querySelectorAll('.nuc-plasma-mag button');
    var N = 260, KAPPA = 1.45, FUSE = 100, LIMIT = 130;
    var parts = [], sparks = [], hits = [], B = 1, T = +heat.value, shownT = T;
    var mode = 'ok', wob = 0, clock = 0, downFor = 0, lastMsg = '';
    var W = 0, H = 0, A = 0, CX = 0, CY = 0, last = 0, visible = false;

    function size() {
      var r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
      W = r.width; H = r.height;
      cv.width = Math.round(W * d); cv.height = Math.round(H * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
      A = Math.min(W * 0.34, (H * 0.43) / KAPPA); CX = W / 2; CY = H / 2 + 6;
      ctx.fillStyle = '#081424'; ctx.fillRect(0, 0, W, H);
    }
    function fill() {
      parts = []; sparks = []; hits = []; mode = 'ok'; wob = 0; downFor = 0; shownT = T;
      for (var i = 0; i < N; i++) {
        var r = 0.25 * Math.sqrt(Math.random()), th = Math.random() * Math.PI * 2, a = Math.random() * Math.PI * 2;
        parts.push({ u: r * Math.cos(th), v: r * Math.sin(th), du: Math.cos(a), dv: Math.sin(a), alive: true });
      }
    }
    function gauss() { return Math.sqrt(-2 * Math.log(Math.random() + 1e-9)) * Math.cos(2 * Math.PI * Math.random()); }
    function px(u) { return CX + A * u; }
    function py(v) { return CY - A * KAPPA * v; }
    function limit() { return LIMIT * B; }
    // the cage's edge at angle th: swells with heat, wobbles when over the limit
    function cage(th) {
      var beta = Math.min(T / limit(), 1.25);
      var base = 0.2 + 0.5 * Math.min(beta, 1) + (beta > 1 ? 0.25 * (beta - 1) : 0);
      var amp = 0.025 + wob;
      return base * (1 + amp * Math.sin(3 * th + clock * 4) + amp * 0.5 * Math.sin(2 * th - clock * 3));
    }
    function color(t, alpha) {
      // deep orange when cool, yellow, then white-hot
      var k = Math.min(1, t / 220);
      var r = 255, g = Math.round(110 + 140 * k), b = Math.round(60 + 190 * Math.max(0, k - 0.4) / 0.6);
      return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    }
    function say(cls, head, rest) {
      var msg = cls + head;
      if (msg === lastMsg) { return; }
      lastMsg = msg;
      status.className = 'nuc-plasma-status ' + cls;
      status.innerHTML = '<b>' + head + '</b> ' + rest;
    }
    function tell() {
      if (mode === 'out') {
        say('out', 'Disruption.', 'The plasma broke through the cage, touched the wall and cooled in an instant, so fusion stopped on its own. No meltdown, but the wall can be damaged. Press Reheat to try again.');
      } else if (T > limit()) {
        say('wobble', 'Too hot for these magnets.', 'The plasma is pushing harder than the magnetic cage can hold, and it is starting to break loose.');
      } else if (T >= FUSE) {
        say('fusion', 'Hot enough for fusion,', 'and the magnets are holding it. The bright flashes are fusion reactions.');
      } else {
        say('cold', 'Too cold for fusion.', 'The magnets hold the plasma easily, but it needs about 100 million °C before atoms start to fuse.');
      }
    }

    function step(dt) {
      clock += dt;
      if (mode === 'ok') {
        if (T > limit()) { wob = Math.min(0.45, wob + dt * (0.06 + 0.25 * (T / limit() - 1))); }
        else { wob = Math.max(0, wob - dt * 0.5); }
      }
      var speed = 0.15 + 0.85 * (mode === 'out' ? 0.9 : T / 250);
      var leak = mode === 'ok' ? Math.max(0, (wob - 0.22) * 1.6) : 1;
      parts.forEach(function (p) {
        if (!p.alive) { return; }
        p.du += gauss() * 3 * dt; p.dv += gauss() * 3 * dt;
        var m = Math.sqrt(p.du * p.du + p.dv * p.dv) || 1;
        p.du /= m; p.dv /= m;
        p.u += p.du * speed * dt; p.v += p.dv * speed * dt;
        var r = Math.sqrt(p.u * p.u + p.v * p.v), th = Math.atan2(p.v, p.u);
        if (mode === 'ok' && r > cage(th) && Math.random() > leak * dt * 6) {
          // turned back by the cage
          if (p.u * p.du + p.v * p.dv > 0) { p.du = -p.du + gauss() * 0.3; p.dv = -p.dv + gauss() * 0.3; }
          var c = cage(th) / r; p.u *= c; p.v *= c;
        }
        if (r >= 1) {
          p.alive = false;
          hits.push({ u: p.u / r, v: p.v / r, t: 0 });
          if (mode === 'ok') { mode = 'out'; downFor = 0; }
        }
      });
      if (mode === 'out') {
        downFor += dt;
        shownT = Math.max(0, shownT - dt * shownT * 5 - dt * 20);
      } else {
        shownT += (T - shownT) * Math.min(1, dt * 4);
        if (T >= FUSE && T <= limit() * 1.1) {
          var rate = 3 + 22 * Math.min(1, (T - FUSE) / 100);
          if (Math.random() < rate * dt) {
            var q = parts[Math.floor(Math.random() * parts.length)];
            if (q && q.alive) { sparks.push({ u: q.u, v: q.v, t: 0 }); }
          }
        }
      }
      tell();
    }
    function draw(dt) {
      ctx.fillStyle = 'rgba(8, 20, 36, 0.28)'; ctx.fillRect(0, 0, W, H);
      // the chamber wall
      ctx.lineWidth = 6; ctx.strokeStyle = '#8fa6bf';
      ctx.beginPath(); ctx.ellipse(CX, CY, A + 4, A * KAPPA + 4, 0, 0, Math.PI * 2); ctx.stroke();
      // the magnetic cage: three glowing rings that follow the cage's edge
      if (mode === 'ok') {
        ctx.save();
        ctx.shadowColor = 'rgba(90, 200, 255, 0.9)'; ctx.shadowBlur = 8;
        [1.06, 1.16, 1.26].forEach(function (k, i) {
          ctx.lineWidth = (B > 1 ? 2.6 : 1.6) - i * 0.3;
          ctx.strokeStyle = 'rgba(110, 210, 255,' + (0.75 - i * 0.2) + ')';
          ctx.beginPath();
          for (var a = 0; a <= 64; a++) {
            var th = a / 64 * Math.PI * 2, r = Math.min(0.97, cage(th) * k);
            var x = px(r * Math.cos(th)), y = py(r * Math.sin(th));
            if (a) { ctx.lineTo(x, y); } else { ctx.moveTo(x, y); }
          }
          ctx.stroke();
        });
        ctx.restore();
      }
      // plasma
      var fade = mode === 'out' ? Math.max(0, 1 - downFor / 0.8) : 1;
      ctx.fillStyle = color(shownT, (0.9 * fade).toFixed(2));
      parts.forEach(function (p) {
        if (!p.alive) { return; }
        ctx.beginPath(); ctx.arc(px(p.u), py(p.v), 2.1, 0, Math.PI * 2); ctx.fill();
      });
      if (mode === 'out' && downFor > 0.8) { parts.forEach(function (p) { p.alive = false; }); }
      // fusion flashes
      sparks = sparks.filter(function (f) {
        f.t += dt;
        if (f.t > 0.35) { return false; }
        var k = 1 - f.t / 0.35;
        ctx.fillStyle = 'rgba(255, 255, 255,' + k.toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(px(f.u), py(f.v), 2 + 9 * f.t / 0.35, 0, Math.PI * 2); ctx.fill();
        return true;
      });
      // where plasma strikes the wall
      hits = hits.filter(function (f) {
        f.t += dt;
        if (f.t > 0.7) { return false; }
        ctx.fillStyle = 'rgba(255, 150, 90,' + (1 - f.t / 0.7).toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(px(f.u), py(f.v), 4 + 14 * f.t, 0, Math.PI * 2); ctx.fill();
        return true;
      });
      // labels
      ctx.font = '600 12.5px system-ui, sans-serif'; ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(223, 233, 244, 0.8)';
      ctx.fillText('Inside a tokamak', 14, 22);
      ctx.fillStyle = color(shownT, 1);
      ctx.fillText('Plasma: ' + Math.round(shownT) + ' million °C', 14, 41);
      ctx.fillStyle = 'rgba(223, 233, 244, 0.6)';
      ctx.fillText((B > 1 ? 'Stronger' : 'Standard') + ' magnets hold up to about ' + limit() + ' million °C', 14, 60);
    }
    function frame(now) {
      if (!visible) { last = 0; return; }
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
      step(dt); draw(dt);
      requestAnimationFrame(frame);
    }

    function setHeat() {
      T = +heat.value;
      out.textContent = T + ' million °C';
      if (!visible) { tell(); draw(0); }
    }
    heat.addEventListener('input', setHeat);
    Array.prototype.forEach.call(magBtns, function (b) {
      b.addEventListener('click', function () {
        B = +b.getAttribute('data-b');
        Array.prototype.forEach.call(magBtns, function (o) {
          o.classList.toggle('is-on', o === b); o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
        });
        if (!visible) { tell(); draw(0); }
      });
    });
    el('nuc-plasma-reset').addEventListener('click', function () {
      fill(); ctx.fillStyle = '#081424'; ctx.fillRect(0, 0, W, H); lastMsg = ''; tell();
    });

    size(); fill(); tell(); draw(0);
    window.addEventListener('resize', function () { size(); draw(0); });
    // Only animate while on screen.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        var was = visible;
        visible = es[0].isIntersecting;
        if (visible && !was) { last = 0; requestAnimationFrame(frame); }
      }, { threshold: 0.15 }).observe(box);
    } else { visible = true; requestAnimationFrame(frame); }
  }

  function boot() {
    buildStrip();
    wireStrip();
    wireNavMenu();
    wirePageNav();
    wireRoom();
    wireDiagram();
    wireZone();
    wireGame();
    wireFusion();
    wirePlasma();
    expandCitations(document.querySelector('main'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
