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
    el('nuc-modal-body').innerHTML = ev.html != null ? ev.html : ev.paras
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

  /* ── Plasma demo: a simplified model with real formulas ────────
     A cross-section of ITER or SPARC, drawn to scale, holding a deuterium-
     tritium plasma at the heat and density the sliders set. Everything is
     an average over the plasma (real ones are hotter and denser at the core):
       fusion power  = (n/2)^2 x <sigma v>(T) x 17.6 MeV x plasma volume,
                       with <sigma v> from Bosch and Hale (1992)
       pressure      = 2 n k T (ions and electrons), against the Troyon limit
                       beta_max = 2.8% x I / (a B), beta = pressure / (B^2 / 2 mu0)
       density       = n, against the Greenwald limit n_G = I / (pi a^2)
     Past either limit the cage wobbles and the plasma breaks loose into the
     wall: a disruption, after which fusion simply stops. */
  var PLASMA_MACHINES = {
    iter:  { name: 'ITER',  R: 6.2,  a: 2.0,  B: 5.3,  I: 15,  k: 1.7 },
    sparc: { name: 'SPARC', R: 1.85, a: 0.57, B: 12.2, I: 8.7, k: 1.75 }
  };
  // Bosch and Hale's D-T reactivity, T in keV, in cubic meters per second
  function dtReactivity(T) {
    var C = [1.17302e-9, 1.51361e-2, 7.51886e-2, 4.60643e-3, 1.35e-2, -1.0675e-4, 1.366e-5];
    var th = T / (1 - T * (C[1] + T * (C[3] + T * C[5])) / (1 + T * (C[2] + T * (C[4] + T * C[6]))));
    var xi = Math.pow(34.3827 * 34.3827 / (4 * th), 1 / 3);
    return C[0] * th * Math.sqrt(xi / (1124656 * T * T * T)) * Math.exp(-3 * xi) * 1e-6;
  }
  function plasmaPhysics(M, Tmc, n20) {
    var Tk = Tmc / 11.6045, n = n20 * 1e20, mu0 = 4e-7 * Math.PI;
    var vol = 2 * Math.PI * Math.PI * M.R * M.a * M.a * M.k;
    var power = n * n / 4 * dtReactivity(Tk) * 2.8197e-12 * vol / 1e6;     // MW
    var press = 2 * n * Tk * 1.602177e-16;                                  // pascals
    var pmax = 0.028 * M.I / (M.a * M.B) * M.B * M.B / (2 * mu0);
    return { power: power, press: press / pmax, dens: n20 / (M.I / (Math.PI * M.a * M.a)) };
  }

  function wirePlasma() {
    var box = el('nuc-plasma');
    if (!box) { return; }
    var cv = el('nuc-plasma-canvas'), ctx = cv.getContext('2d');
    var heat = el('nuc-plasma-heat'), dens = el('nuc-plasma-dens'), status = el('nuc-plasma-status');
    var machBtns = box.querySelectorAll('.nuc-plasma-mag button');
    var mk = 'iter', T = +heat.value, N = +dens.value, phys = null;
    var parts = [], sparks = [], hits = [], mode = 'ok', wob = 0, clock = 0, downFor = 0, shownT = T, lastMsg = '';
    var W = 0, H = 0, A0 = 0, CX = 0, CY = 0, last = 0, visible = false;

    function size() {
      var r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
      if (!(r.width > 0)) { return; }
      W = r.width; H = r.height;
      cv.width = Math.round(W * d); cv.height = Math.round(H * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
      A0 = Math.min(W * 0.3, (H * 0.42) / 1.7);    // ITER's minor radius, in screen pixels
      CX = W / 2; CY = H / 2 + 8;
      ctx.fillStyle = '#081424'; ctx.fillRect(0, 0, W, H);
    }
    function M() { return PLASMA_MACHINES[mk]; }
    function A() { return A0 * M().a / PLASMA_MACHINES.iter.a; }      // to scale
    function count() { return Math.round(70 + 330 * Math.sqrt(N / 10)); }
    function fill() {
      parts = []; sparks = []; hits = []; mode = 'ok'; wob = 0; downFor = 0; shownT = T;
      top();
    }
    function top() {
      // add or drop particles to follow the density slider
      var want = count(), alive = parts.filter(function (p) { return p.alive; });
      while (alive.length < want) {
        var r = 0.3 * Math.sqrt(Math.random()), th = Math.random() * Math.PI * 2, a = Math.random() * Math.PI * 2;
        var p = { u: r * Math.cos(th), v: r * Math.sin(th), du: Math.cos(a), dv: Math.sin(a), alive: true };
        parts.push(p); alive.push(p);
      }
      if (alive.length > want) { alive.slice(want).forEach(function (p) { p.alive = false; }); }
      parts = parts.filter(function (p) { return p.alive; });
    }
    function gauss() { return Math.sqrt(-2 * Math.log(Math.random() + 1e-9)) * Math.cos(2 * Math.PI * Math.random()); }
    function px(u) { return CX + A() * u; }
    function py(v) { return CY - A() * M().k * v; }
    function over() { return Math.max(phys.press, phys.dens); }
    function cage(th) {
      var fr = Math.min(phys.press, 1.2);
      var base = 0.28 + 0.5 * Math.min(fr, 1) + (fr > 1 ? 0.25 * (fr - 1) : 0);
      var amp = 0.025 + wob;
      return base * (1 + amp * Math.sin(3 * th + clock * 4) + amp * 0.5 * Math.sin(2 * th - clock * 3));
    }
    function color(t, alpha) {
      var k = Math.min(1, t / 250);
      return 'rgba(255,' + Math.round(110 + 140 * k) + ',' + Math.round(60 + 190 * Math.max(0, k - 0.4) / 0.6) + ',' + alpha + ')';
    }
    function fmt(mw) {
      if (mw < 1) { return 'under 1 megawatt'; }
      var v = mw < 10 ? mw.toFixed(1) : Math.round(mw).toLocaleString('en-US');
      return v + ' megawatts';
    }
    function meter(bar, text, frac, what) {
      bar.style.width = Math.min(100, frac * 80) + '%';     // the tick at 80% of the track marks the limit
      bar.className = frac > 1 ? 'over' : frac > 0.85 ? 'warn' : '';
      text.textContent = Math.round(frac * 100) + '% of ' + what;
    }
    function readouts() {
      phys = plasmaPhysics(M(), T, N);
      el('nuc-plasma-power').textContent = mode === 'out' ? '0 (disrupted)' : fmt(phys.power);
      meter(el('nuc-plasma-pbar'), el('nuc-plasma-ptext'), phys.press, 'what the magnets can hold');
      meter(el('nuc-plasma-nbar'), el('nuc-plasma-ntext'), phys.dens, 'the density limit');
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
        say('out', 'Disruption occurs.', 'The plasma breaks through the cage, touches the wall and cools in an instant, so fusion stops. Though there is no meltdown, it’s possible that the wall has been damaged. Press Reheat to try again.');
      } else if (phys.dens > 1) {
        say('wobble', 'The plasma is too dense.', 'Once past the density limit, the plasma begins to cool and it starts to break up. Fortunately, China’s EAST discovered how to surpass this limit in January 2026.');
      } else if (phys.press > 1) {
        say('wobble', 'The pressure exceeds the magnets’ endurance.', 'The plasma is starting to break loose of the magnetic cage.');
      } else if (phys.power < 10) {
        say('cold', 'Nuclear fusion barely occurs.', 'It requires the plasma to be well above 100 million °C and be dense enough for the nuclei to collide.');
      } else {
        say('fusion', 'Nuclear fusion occurs, and is contained by the magnets.', 'The bright flashes are fusion reactions. Try SPARC’s stronger magnets in a machine that is a fraction of ITER’s size.');
      }
    }

    function step(dt) {
      clock += dt;
      if (mode === 'ok') {
        var o = over();
        if (o > 1) { wob = Math.min(0.45, wob + dt * (0.06 + 0.25 * (o - 1))); } else { wob = Math.max(0, wob - dt * 0.5); }
      }
      var speed = 0.15 + 0.85 * (mode === 'out' ? 0.9 : Math.min(1, T / 250));
      var leak = mode === 'ok' ? Math.max(0, (wob - 0.22) * 1.6) : 1;
      parts.forEach(function (p) {
        if (!p.alive) { return; }
        p.du += gauss() * 3 * dt; p.dv += gauss() * 3 * dt;
        var mm = Math.sqrt(p.du * p.du + p.dv * p.dv) || 1;
        p.du /= mm; p.dv /= mm;
        p.u += p.du * speed * dt; p.v += p.dv * speed * dt;
        var r = Math.sqrt(p.u * p.u + p.v * p.v), th = Math.atan2(p.v, p.u);
        if (mode === 'ok' && r > cage(th) && Math.random() > leak * dt * 6) {
          if (p.u * p.du + p.v * p.dv > 0) { p.du = -p.du + gauss() * 0.3; p.dv = -p.dv + gauss() * 0.3; }
          var c = cage(th) / r; p.u *= c; p.v *= c;
        }
        if (r >= 1) {
          p.alive = false;
          hits.push({ u: p.u / r, v: p.v / r, t: 0 });
          if (mode === 'ok') { mode = 'out'; downFor = 0; readouts(); }
        }
      });
      if (mode === 'out') {
        downFor += dt;
        shownT = Math.max(0, shownT - dt * shownT * 5 - dt * 20);
      } else {
        shownT += (T - shownT) * Math.min(1, dt * 4);
        // flashes: as many as the fusion power per cubic meter allows, on a log scale
        var rate = Math.max(0, Math.log10(Math.max(1e-3, phys.power / (2 * Math.PI * Math.PI * M().R * M().a * M().a * M().k))) + 3) * 5;
        if (Math.random() < rate * dt) {
          var q = parts[Math.floor(Math.random() * parts.length)];
          if (q && q.alive) { sparks.push({ u: q.u, v: q.v, t: 0 }); }
        }
      }
      tell();
    }
    function chamber(mach, dashed) {
      var a = A0 * mach.a / PLASMA_MACHINES.iter.a;
      ctx.save();
      if (dashed) { ctx.setLineDash([4, 5]); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(160, 185, 210, 0.45)'; }
      else { ctx.lineWidth = 5; ctx.strokeStyle = '#8fa6bf'; }
      ctx.beginPath(); ctx.ellipse(CX, CY, a + 4, a * mach.k + 4, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      return a;
    }
    function draw(dt) {
      ctx.fillStyle = 'rgba(8, 20, 36, 0.28)'; ctx.fillRect(0, 0, W, H);
      // the other machine, faint and to scale, for comparison
      var other = mk === 'iter' ? PLASMA_MACHINES.sparc : PLASMA_MACHINES.iter;
      var oa = chamber(other, true);
      ctx.font = '600 11px system-ui, sans-serif'; ctx.fillStyle = 'rgba(160, 185, 210, 0.7)'; ctx.textAlign = 'center';
      ctx.fillText(other.name + ', to scale', CX, CY - oa * other.k - 10);
      chamber(M(), false);
      if (mode === 'ok') {
        ctx.save();
        ctx.shadowColor = 'rgba(90, 200, 255, 0.9)'; ctx.shadowBlur = 8;
        [1.06, 1.16, 1.26].forEach(function (k, i) {
          ctx.lineWidth = (mk === 'sparc' ? 2.4 : 1.6) - i * 0.3;
          ctx.strokeStyle = 'rgba(110, 210, 255,' + (0.75 - i * 0.2) + ')';
          ctx.beginPath();
          for (var s2 = 0; s2 <= 64; s2++) {
            var th = s2 / 64 * Math.PI * 2, r = Math.min(0.97, cage(th) * k);
            var x = px(r * Math.cos(th)), y = py(r * Math.sin(th));
            if (s2) { ctx.lineTo(x, y); } else { ctx.moveTo(x, y); }
          }
          ctx.stroke();
        });
        ctx.restore();
      }
      var fade = mode === 'out' ? Math.max(0, 1 - downFor / 0.8) : 1, dot = mk === 'sparc' ? 1.3 : 2.1;
      ctx.fillStyle = color(shownT, (0.9 * fade).toFixed(2));
      parts.forEach(function (p) {
        if (!p.alive) { return; }
        ctx.beginPath(); ctx.arc(px(p.u), py(p.v), dot, 0, Math.PI * 2); ctx.fill();
      });
      if (mode === 'out' && downFor > 0.8) { parts.forEach(function (p) { p.alive = false; }); }
      sparks = sparks.filter(function (f) {
        f.t += dt; if (f.t > 0.35) { return false; }
        ctx.fillStyle = 'rgba(255, 255, 255,' + (1 - f.t / 0.35).toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(px(f.u), py(f.v), 1.5 + 7 * f.t / 0.35, 0, Math.PI * 2); ctx.fill();
        return true;
      });
      hits = hits.filter(function (f) {
        f.t += dt; if (f.t > 0.7) { return false; }
        ctx.fillStyle = 'rgba(255, 150, 90,' + (1 - f.t / 0.7).toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(px(f.u), py(f.v), 3 + 12 * f.t, 0, Math.PI * 2); ctx.fill();
        return true;
      });
      // the labels sit on a cleared patch, so they leave no trail when they change
      ctx.fillStyle = '#081424'; ctx.fillRect(0, 0, Math.min(W, 380), 68);
      ctx.textAlign = 'left'; ctx.font = '600 12.5px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(223, 233, 244, 0.85)';
      ctx.fillText('Inside ' + M().name + ', drawn to scale', 14, 22);
      ctx.fillStyle = color(shownT, 1);
      ctx.fillText('Plasma: ' + Math.round(shownT) + ' million °C', 14, 41);
      ctx.fillStyle = 'rgba(223, 233, 244, 0.6)';
      ctx.fillText('Magnets: ' + M().B + ' tesla · plasma ' + (M().a * 2).toFixed(1) + ' m across', 14, 60);
    }
    function frame(now) {
      if (!visible) { last = 0; return; }
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
      step(dt); draw(dt);
      requestAnimationFrame(frame);
    }
    function changed() {
      T = +heat.value; N = +dens.value;
      el('nuc-plasma-temp').textContent = T + ' million °C';
      el('nuc-plasma-dout').textContent = N.toFixed(1) + ' × 10²⁰ per m³';
      readouts();
      if (mode === 'ok') { top(); }
      if (!visible) { tell(); draw(0); }
    }
    heat.addEventListener('input', changed);
    dens.addEventListener('input', changed);
    Array.prototype.forEach.call(machBtns, function (b) {
      b.addEventListener('click', function () {
        mk = b.getAttribute('data-m');
        Array.prototype.forEach.call(machBtns, function (o) {
          o.classList.toggle('is-on', o === b); o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
        });
        ctx.fillStyle = '#081424'; ctx.fillRect(0, 0, W, H);
        changed();
      });
    });
    el('nuc-plasma-reset').addEventListener('click', function () {
      fill(); readouts(); ctx.fillStyle = '#081424'; ctx.fillRect(0, 0, W, H); lastMsg = ''; tell();
    });

    size(); readouts(); fill(); tell(); draw(0);
    window.addEventListener('resize', function () { size(); draw(0); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        var was = visible;
        visible = es[0].isIntersecting;
        if (visible && !was) { last = 0; requestAnimationFrame(frame); }
      }, { threshold: 0.15 }).observe(box);
    } else { visible = true; requestAnimationFrame(frame); }
  }

  /* ── Popular imagination: the kaiju in the lecture apps' map ────
     The lecture apps' walker, as a kaiju: a full-width map, one screen
     tall, of a town that runs on downward, with the camera following him
     and the mouse wheel looking ahead. Thirteen skyscrapers hold the
     stories, among houses, trees, lamps and fences. In the page it is a
     full-width window onto the town; clicking it opens the map full screen,
     where it plays: walking into a skyscraper or hitting it with the breath
     attack (E) blows it up and opens its card, and houses just flatten.
     Clicking or tapping the map walks him there. Keys only count while it
     is open, so the arrow keys scroll the page as usual. */
  var KAIJU_CITY = [
    { key: 'astro-boy', name: 'Tetsuwan Atomu', date: '1952', img: 'imagination-astro-boy.jpg',
      body: "Created by Tezuka Osamu in 1952, the titular protagonist, Tetsuwan Atomu, is an expression of Japan’s optimism about what can be achieved when nuclear power is used for good. Though the manga was serialized shortly after the atomic bombings of Hiroshima and Nagasaki, the series navigated the tension between nuclear anxieties and the hope that nuclear energy can be used for humanity’s benefit, especially when Japan began adopting nuclear power during the 1960s, with the government funding its own research program as far back as 1954." },
    { key: 'godzilla', name: 'Godzilla franchise', date: 'Since 1954', img: 'imagination-godzilla.jpg',
      body: "First conceived in 1954 by Tanaka Tomoyuki, who was inspired both by the calamitous aftermath of the US’s hydrogen bomb tests and on his flight back from Indonesia when gazing on the ocean, Godzilla has emerged as one of the most prominent symbols of nuclear horror. The first movie, directed by Honda Ishiro, illustrates the terror Japan felt as a victim of nuclear disaster and atomic bombing, a theme that is consistent throughout the franchise. When Godzilla returned in 1984, directed by Hashimoto Koji, it was during the height of the Cold War between the United States and the Soviet Union, and explored anxieties over what happens when global superpowers get too trigger-happy with their nuclear armaments. More recently, Anno Hideaki’s <em>Shin Godzilla</em> in 2016 is a critique of the Japanese government’s botched handling of the Fukushima disaster in March 2011, while Yamazaki Takashi’s <em>Godzilla Minus One</em> (a scene when black rain falls around the protagonist screaming in grief) and <em>Godzilla Minus Zero</em> continue to portray the horrific aftermath of nuclear disasters in a postwar Japan." },
    { key: 'strangelove', name: 'Dr. Strangelove', date: '1964', img: 'imagination-strangelove.jpg',
      body: "Directed by Stanley Kubrick (who also directed <em>2001: A Space Odyssey</em> and <em>The Shining</em>), <em>Dr. Strangelove</em> is a political satire black comedy that centers on a paranoid US general intent on nuking the Soviet Union, and the other characters racing to stop him and prevent the resulting nuclear Armageddon. It was so influential that even Ronald Reagan reportedly believed the iconic, high-tech “War Room” from the film existed in the Pentagon." },
    { key: 'barefoot-gen', name: 'Hadashi no Gen', date: '1973', img: 'imagination-barefoot-gen.jpg',
      body: "Translated as <em>Barefoot Gen</em>, it is a manga series featuring Nakaoka Gen, who survived the atomic bombing of Hiroshima and struggles to survive the aftermath. The author and artist of the series, Nakazawa Keiji, was also a survivor of the Hiroshima atomic bombing himself, having been distraught to see his mother’s bones turned to ash from radioactive cesium when she was cremated. Aware that atomic bomb survivors were often mistreated and looked down upon, Nakazawa was initially hesitant about drawing an autobiographical manga. His manga deals with grief, loss, discrimination, critique of nationalism, the abuse of refugees, as well as the dangers of nuclear warfare. Interestingly, the manga also depicts anti-Korean racism." },
    { key: 'yamato', name: 'Uchu Senkan Yamato', date: '1974', img: 'imagination-yamato.jpg',
      body: "Translated as <em>Space Battleship Yamato</em>, it is a 1974 science fiction anime series where Earth is nuked into oblivion by an alien race. The narrative follows a crew who pilot the battleship, <em>Yamato</em>, converted into a spaceship through the Wave Motion Engine, to a distant planet to obtain the Cosmo Cleaner to restore Earth to normal. Despite the fantastical ending where Earth is magically healed by the Cosmo Cleaner, the nightmarish sight of Earth as a radioactive wasteland in the first few episodes continues to haunt us about the dangers of recklessly unleashing nuclear weapons, especially during the Cold War." },
    { key: 'gundam', name: 'Gundam franchise', date: 'Since 1979', img: 'imagination-gundam.jpg',
      body: "The Gundam franchise, created by Tomino Yoshiyuki, has always expressed anti-military and anti-nuclear weapon sentiments. From the horrifying destruction caused by a colony drop after Zeon’s liberal use of nuclear weapons (and nerve gas) to slaughter billions of colony residents—known as Operation British—in the original <em>Mobile Suit Gundam</em> series to the Earth Alliance’s use of nuclear weapons against PLANT colonies in the 2002 <em>Gundam Seed</em> and its 2004 sequel, <em>Gundam Seed Destiny</em>, the Gundam franchise consistently demonstrates the horror of nuclear warfare." },
    { key: 'akira', name: 'Akira', date: '1982 and 1988', img: 'imagination-akira.jpg',
      body: "The iconic scene of the 1988 animated film, <em>Akira</em>, is the enormous explosion reminiscent of a nuclear blast. Even though it’s technically a psychic nuke, the catastrophic imagery and total destruction of Tokyo (which led to its subsequent rebuilding into Neo-Tokyo) are expressions of nuclear anxieties, especially at the height of the Cold War. Created by Otomo Katsuhiro, <em>Akira</em> also depicts strong criticism of militarism and state authority, discussions of social instability and youth alienation, along with ideas about posthumanism and technology." },
    { key: 'day-after', name: 'The Day After', date: '1983', img: 'imagination-day-after.jpg',
      body: "A 1983 television film that focuses on residents in Kansas whose family farms were near missile silos, its central conflict is the full-scale nuclear exchange between the United States and the Soviet Union. Made during the Cold War, and watched by over 100 million people, it manifests the American anxiety over nuclear war. Kansas City was obliterated by Soviet nukes. The US descended into chaos, citizens died from radiation poisoning or were ruthlessly executed by the National Guard, and eventually, the film ended on one final note. Mutually Assured Destruction." },
    { key: 'nausicaa', name: 'Kaze no Tani no Nausicaa', date: '1982 and 1984', img: 'imagination-nausicaa.jpg',
      body: "<em>Nausicaa of the Valley of the Wind</em> is a 1984 post-apocalyptic animated film directed by the legendary Miyazaki Hayao. The Seven Days of Fire, an apocalyptic war that destroyed the world and transformed it into a toxic jungle, were hinted in a prequel written by Anno Hideaki, <em>Giant God Warrior Appears in Tokyo</em>, to be attributed to giant divine warriors, whose power resembles nuclear blasts. The film is known more for themes of nature conservation and restoration of life, as well as a strong anti-military stance." },
    { key: 'terminator', name: 'Terminator franchise', date: 'Since 1984', img: 'imagination-terminator.jpg',
      body: "Created and directed by James Cameron (the first two films, anyway, not going to get into the convoluted sequels, though he apparently produced the latest film, <em>Dark Fate</em>), the Terminator franchise is mainly focused on either the inevitability or prevention of Judgment Day, a nuclear holocaust that Skynet unleashed upon humanity when it became sentient. The franchise is famous for its prescient warnings on the danger of AI, as well as the extreme catastrophe and horrifying death toll that will result if the various nations’ arsenal of nuclear weapons were to be completely unleashed upon the world." },
    { key: 'fallout', name: 'Fallout franchise', date: 'Since 1997', img: 'imagination-fallout.jpg',
      body: "The Fallout franchise is a series of post-apocalyptic role-playing games set in a world where the United States and China essentially destroyed the world in a nuclear exchange. It is known for its retrofuturistic setting and 1950s American postwar culture influences. Its underlying theme of the lurking fear of nuclear annihilation and atompunk setting, where everything is pretty much nuclear powered (from cars to robots to energy weapons), captures the Cold War paranoia well." },
    { key: 'chernobyl', name: 'Chernobyl', date: '2019', img: 'imagination-chernobyl.jpg',
      body: "A 2019 historical drama television miniseries that revolves around the Chernobyl disaster in 1986. It also depicts the efforts of firefighters, who were among the first responders on the scene, volunteers, miners who dug a tunnel under a reactor and other unsung heroes involved in the cleanup efforts." },
    { key: 'oppenheimer', name: 'Oppenheimer', date: '2023', img: 'imagination-oppenheimer.jpg',
      body: "A 2023 film directed by Christopher Nolan (of the Dark Knight trilogy fame), it is a biographical thriller following the titular J. Robert Oppenheimer, who was in charge of developing the United States’ first nuclear weapons during World War II. Despite being labeled the father of the atomic bomb, Oppenheimer is remorseful over the destruction they wrought in Japan, and he attempted to stop the spread of nuclear weapons. After several twists and turns, the film ended with Oppenheimer disillusioned by a memory of how the world is inevitably headed for a nuclear holocaust, thus cementing fears of Mutually Assured Destruction that remain prevalent in the US (and also because of the Russo-Ukraine War 2022 breaking out about a year earlier)." }
  ];
  var KAIJU_SPRITE = {"w":32,"h":32,"pal":{"K":"#14161c","D":"#343a48","B":"#2f80e6","L":"#beebff","Y":"#ffd640","W":"#ececec","R":"#961e28"},"frames":{"down1":["................................",".............KKKKKK.............","............KKKKKKKK............","...........KKKKKKKKKK...........","........BB.KKYKKKKYKK.BB........",".......BBBBKKKKKKKKKKBBBB.......","......BBBBBKKKKKKKKKKBBBBB......","............KKWKKWKK............","............KKRRRRKK............","........BB.KKKKKKKKKK.BB........",".......BBBKKKKKKKKKKKKBBB.......","......KKKBKKKKKDDKKKKKBKKK......","......KKKKKKKKDDDDKKKKKKKK......","......KKKKKKKDDDDDDKKKKKKK......","......KKKKKKKDDDDDDKKKKKKK......","......KKKKKKKDDDDDDKKKKKKK......","......KKKKKKDDDDDDDDKKKKKK......","......K.KKKKDDDDDDDDKKKK.K......",".........KKKDDDDDDDDKKK.........",".........KKKKDDDDDDKKKK.........","..........KKKDDDDDDKKK..........","..........KKKDDDDDDKKK..........",".........KKKKKDDDDKKKKK...KKK...",".........KKKKKKDDKKKKKK...KKK...",".........KKKKK....KKKKKKKKKK....",".........KKKKK....KKKKKKKKKK....",".........KKKKK....KKKKK.........","........KKKKKK....KKKKK.........","........KKKKK.....KKKKK.........","..................KKKKKK........","...................KKKKK........","................................"],"down2":["................................",".............KKKKKK.............","............KKKKKKKK............","...........KKKKKKKKKK...........","........BB.KKYKKKKYKK.BB........",".......BBBBKKKKKKKKKKBBBB.......","......BBBBBKKKKKKKKKKBBBBB......","............KKWKKWKK............","............KKRRRRKK............","........BB.KKKKKKKKKK.BB........",".......BBBKKKKKKKKKKKKBBB.......","......KKKBKKKKKDDKKKKKBKKK......","......KKKKKKKKDDDDKKKKKKKK......","......KKKKKKKDDDDDDKKKKKKK......","......KKKKKKKDDDDDDKKKKKKK......","......KKKKKKKDDDDDDKKKKKKK......","......KKKKKKDDDDDDDDKKKKKK......","......K.KKKKDDDDDDDDKKKK.K......",".........KKKDDDDDDDDKKK.........",".........KKKKDDDDDDKKKK.........","..........KKKDDDDDDKKK..........","..........KKKDDDDDDKKK..........",".........KKKKKDDDDKKKKK...KKK...",".........KKKKKKDDKKKKKK...KKK...",".........KKKKK....KKKKKKKKKK....",".........KKKKK....KKKKKKKKKK....",".........KKKKK....KKKKK.........",".........KKKKK....KKKKKK........",".........KKKKK.....KKKKK........","........KKKKKK..................","........KKKKK...................","................................"],"downB":["................................",".............KKKKKK.............","............KKKKKKKK............","...........KKKKKKKKKK...........","........BB.KKYKKKKYKK.BB........",".......BBBBKKKKKKKKKKBBBB.......","......BBBBBKKKKKKKKKKBBBBB......","............KKKKKKKK............","............KWRRRRWK............","........BB.KKRRRRRRKK.BB........",".......BBBKKKWRRRRWKKKBBB.......","......KKKBKKKKKDDKKKKKBKKK......","......KKKKKKKKDDDDKKKKKKKK......","......KKKKKKKDDDDDDKKKKKKK......","......KKKKKKKDDDDDDKKKKKKK......","......KKKKKKKDDDDDDKKKKKKK......","......KKKKKKDDDDDDDDKKKKKK......","......K.KKKKDDDDDDDDKKKK.K......",".........KKKDDDDDDDDKKK.........",".........KKKKDDDDDDKKKK.........","..........KKKDDDDDDKKK..........","..........KKKDDDDDDKKK..........",".........KKKKKDDDDKKKKK...KKK...",".........KKKKKKDDKKKKKK...KKK...",".........KKKKK....KKKKKKKKKK....",".........KKKKK....KKKKKKKKKK....",".........KKKKK....KKKKK.........","........KKKKKK....KKKKK.........","........KKKKK.....KKKKK.........","..................KKKKKK........","...................KKKKK........","................................"],"up1":["................................",".............KKKKKK.............","............KKKBBKKK............","...........KKKBBBBKKK...........","...........KKBBBBBBKK...........","...........KKKKKKKKKK...........","...........KKKKKKKKKK...........","............KKKBBKKK............","............KKBBBBKK............","...........KKBBBBBBKK...........","..........KKKKKKKKKKKK..........","..........KKKKKKKKKKKK..........","......KKKKKKKKKBBKKKKKKKKK......","......KKKKKKKKBBBBKKKKKKKK......","......KKKKKKKBBBBBBKKKKKKK......","......KKKKKKKKKKKKKKKKKKKK......",".........KKKKKKKKKKKKKK.........",".........KKKKKKBBKKKKKK.........",".........KKKKKBBBBKKKKK.........",".........KKKKBBBBBBKKKK.........","..........KKKKKKKKKKKK..........","..........KKKKKKKKKKKK..........",".........KKKKKKBBKKKKKK.........",".........KKKKKBBBBKKKKK.........",".........KKKKBBBBBBKKKK.........",".........KKKKKKKKKKKKKK.........",".........KKKKKKKKKKKKKK.........","........KKKKKKKBBKKKKKK.........","........KKKKK.KBBKKKKKK.........","..............KKKKKKKKKK........","...............KK..KKKKK........","...............KK..............."],"up2":["................................",".............KKKKKK.............","............KKKBBKKK............","...........KKKBBBBKKK...........","...........KKBBBBBBKK...........","...........KKKKKKKKKK...........","...........KKKKKKKKKK...........","............KKKBBKKK............","............KKBBBBKK............","...........KKBBBBBBKK...........","..........KKKKKKKKKKKK..........","..........KKKKKKKKKKKK..........","......KKKKKKKKKBBKKKKKKKKK......","......KKKKKKKKBBBBKKKKKKKK......","......KKKKKKKBBBBBBKKKKKKK......","......KKKKKKKKKKKKKKKKKKKK......",".........KKKKKKKKKKKKKK.........",".........KKKKKKBBKKKKKK.........",".........KKKKKBBBBKKKKK.........",".........KKKKBBBBBBKKKK.........","..........KKKKKKKKKKKK..........","..........KKKKKKKKKKKK..........",".........KKKKKKBBKKKKKK.........",".........KKKKKBBBBKKKKK.........",".........KKKKBBBBBBKKKK.........",".........KKKKKKKKKKKKKK.........",".........KKKKKKKKKKKKKK.........",".........KKKKKKBBKKKKKKK........",".........KKKKKKBBK.KKKKK........","........KKKKKKKKKK..............","........KKKKK..KK...............","...............KK..............."],"side1":["................................","................................","................................","....................KKKKK.......","..................KKKKKKKKK.....",".................BKKKKKKYKKK....","................BBKKKKKKKKKKK...","..............BBBKKKKKKKKKKKKK..",".................KKKKKKKWKWKK...","................BKKKKKKRRRRR....",".............BBKKKKKKKKWKWK.....","............BBBKKKKKKKKKK.......","...............KKKKKKDDKK.......","............BKKKKKKKDDDKKK......","...........BBKKKKKKKDDDKDKK.....","..........BBBKKKKKKKDDDK.KKK....","...........KKKKKKKKKDDDK..KK....","..........BKKKKKKKKKDDDK........",".........BBKKKKKKKKKDDDK........","......BBBKKKKKKKKKKKDDKK........",".........KKKKKKKKKKKDDK.........","........BKKKKKKKKKKKDKK.........",".......KKKKKKKKKKKKKKK..........","...BBKKKKKKKKKKKKKKKKK..........","...KKKKKKKK.KKKKKKKKKK..........","KKKKKKK.....KKKKKKKKK...........","KKKK........KKKKK.KKKK..........","............KKKK...KKKK.........","...........KKKK.....KKKK........","..........KKKK.......KKK........",".........KKKKK......KKKKK.......","........KKKKKK.....KKKKKK......."],"side2":["................................","................................","................................","....................KKKKK.......","..................KKKKKKKKK.....",".................BKKKKKKYKKK....","................BBKKKKKKKKKKK...","..............BBBKKKKKKKKKKKKK..",".................KKKKKKKWKWKK...","................BKKKKKKRRRRR....",".............BBKKKKKKKKWKWK.....","............BBBKKKKKKKKKK.......","...............KKKKKKDDKK.......","............BKKKKKKKDDDKKK......","...........BBKKKKKKKDDDKDKK.....","..........BBBKKKKKKKDDDK.KKK....","...........KKKKKKKKKDDDK..KK....","..........BKKKKKKKKKDDDK........",".........BBKKKKKKKKKDDDK........","......BBBKKKKKKKKKKKDDKK........",".........KKKKKKKKKKKDDK.........","........BKKKKKKKKKKKDKK.........",".......KKKKKKKKKKKKKKK..........","...BBKKKKKKKKKKKKKKKKK..........","...KKKKKKKK.KKKKKKKKKK..........","KKKKKKK.....KKKKKKKKK...........",".KKKK.......KKKKKKKKK...........","............KKKKKKKK............","............KKKKKKK.............","............KKKKKK..............","...........KKKKKKK..............","..........KKKKKKKK.............."],"sideB":["................................","................................","................................","....................KKKKK.......","..................KKKKKKKKK.....",".................LKKKKKKYKKK....","................LLKKKKKKKKKKK...","..............LLLKKKKKKKKKKKKK..",".................KKKKKKKWKW.....","................LKKKKKKRRR......",".............LLKKKKKKKKRRR......","............LLLKKKKKKKKKKWKWK...","...............KKKKKKDDKK.......","............LKKKKKKKDDDKKK......","...........LLKKKKKKKDDDKDKK.....","..........LLLKKKKKKKDDDK.KKK....","...........KKKKKKKKKDDDK..KK....","..........LKKKKKKKKKDDDK........",".........LLKKKKKKKKKDDDK........","......LLLKKKKKKKKKKKDDKK........",".........KKKKKKKKKKKDDK.........","........LKKKKKKKKKKKDKK.........",".......KKKKKKKKKKKKKKK..........","...LLKKKKKKKKKKKKKKKKK..........","...KKKKKKKK.KKKKKKKKKK..........","KKKKKKK.....KKKKKKKKK...........","KKKK........KKKKK.KKKK..........","............KKKK...KKKK.........","...........KKKK.....KKKK........","..........KKKK.......KKK........",".........KKKKK......KKKKK.......","........KKKKKK.....KKKKKK......."]}};

  // Skyscrapers: [base column, base row, width, height] in tiles, in KAIJU_CITY order, top to bottom;
  // null where the story lives elsewhere (Gundam is the Odaiba building, home of the life-size Gundam)
  var KAIJU_TOWERS = [[3, 9, 3, 5], [16, 11, 3, 7], [9, 14, 3, 4], [18, 17, 3, 5], [3, 19, 3, 4], null, [19, 25, 3, 8],
                      [4, 27, 3, 4], [13, 30, 3, 5], [19, 33, 3, 6], [5, 35, 3, 4], [13, 39, 3, 5], [19, 43, 3, 5]];
  var KAIJU_HOUSES = [[12, 21], [9, 7], [20, 7], [1, 13], [6, 16], [7, 23], [1, 31], [9, 28], [8, 32], [16, 36], [2, 41], [8, 45], [16, 46], [7, 19], [16, 27], [1, 37]];
  var KAIJU_TREES = [[1, 6], [6, 5], [13, 6], [22, 5], [12, 10], [1, 16], [22, 14], [7, 17], [16, 19], [22, 18], [1, 24], [10, 26], [17, 28],
                     [22, 31], [2, 34], [11, 35], [22, 37], [6, 38], [18, 40], [1, 44], [11, 42], [22, 45], [13, 47], [5, 13], [15, 25], [9, 37]];
  var KAIJU_LAMPS = [[7, 11], [14, 13], [5, 21], [17, 24], [9, 29], [21, 35], [10, 40], [15, 44]];
  var KAIJU_FENCES = [[12, 8], [1, 27], [16, 32], [4, 43]];

  function wireKaiju() {
    var root = el('nuc-kj');
    if (!root) { return; }
    var cv = el('nuc-kj-screen'), g = cv.getContext('2d');
    var fire = el('nuc-kj-fire'), stage = el('nuc-kj-stage'), isOpen = false;
    var SP = KAIJU_SPRITE, T = 16, COLS = 24, ROWS = 48, SEA = 4, W = COLS * T, H = 200, S = 1, STEP = 0.16;
    var Z = 2, KW = SP.w * Z, KH = SP.h * Z;   // drawn at double size: a kaiju stands as tall as a tower
    var INK = '#1c1a19';
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    if (coarse) {
      el('nuc-kj-play').textContent = 'Tap to play';
      el('nuc-kj-keys').textContent = 'Tap the map to walk there';
    }

    // sprite frames, drawn once; [0] as drawn, [1] mirrored (side view facing left)
    function paint(rows, flip, only) {
      var c = document.createElement('canvas'), x;
      c.width = KW; c.height = KH; x = c.getContext('2d');
      rows.forEach(function (r, y) {
        for (var i = 0; i < r.length; i++) {
          var ch = r[i];
          if (ch === '.' || (only && ch !== 'B')) { continue; }
          x.fillStyle = only ? SP.pal.L : SP.pal[ch];
          x.fillRect((flip ? SP.w - 1 - i : i) * Z, y * Z, Z, Z);
        }
      });
      return c;
    }
    var FR = {}, GLOW = {};
    Object.keys(SP.frames).forEach(function (k) {
      FR[k] = [paint(SP.frames[k], false), paint(SP.frames[k], true)];
      GLOW[k] = [paint(SP.frames[k], false, true), paint(SP.frames[k], true, true)];
    });

    // the town
    var TONES = ['#8fa3b8', '#b8a88c', '#8e9d8a', '#a8929e', '#9aa9c2', '#c4b59c', '#86969f'];
    var towers = [];
    KAIJU_CITY.forEach(function (c, i) {
      var t = KAIJU_TOWERS[i];
      if (c.key === 'gundam') {
        // Odaiba, on its island in the bay: the Fuji TV building, and where the life-size Gundam stands
        towers.push({ c: c, x: 18, y: 3, w: 4, h: 4, kind: 'odaiba', story: true, down: false, fall: 0 });
        return;
      }
      // two landmarks: Godzilla's building is Tokyo Tower, Akira's is Tokyo Skytree
      var kind = c.key === 'godzilla' ? 'tokyo-tower' : c.key === 'akira' ? 'skytree' : 'block';
      towers.push({ c: c, x: t[0], y: t[1], w: t[2], h: t[3], tone: TONES[i % TONES.length], style: i % 4, kind: kind, story: true, down: false, fall: 0 });
    });
    var houses = KAIJU_HOUSES.map(function (p) { return { x: p[0], y: p[1], w: 3, h: 3, story: false, down: false, fall: 0 }; });
    var blocks = towers.concat(houses);

    var m, keys, order, parts, shake, camY = 0, follow = true, goal = null, visible = false, last = 0, pending = null, clock = 0;
    function reset() {
      m = { tx: 11, ty: 5, face: 'down', from: null, t: 0, stepN: 0, state: 'idle', st: 0, target: null, end: null, queued: false };
      keys = { up: false, down: false, left: false, right: false }; order = [];
      parts = []; shake = 0; pending = null; goal = null;
      blocks.forEach(function (b) { b.down = false; b.fall = 0; b.ruin = null; });
    }
    reset();

    function blockAt(cx, cy) {
      for (var i = 0; i < blocks.length; i++) {
        var b = blocks[i];
        if ((!b.down || b.story) && cy === b.y && cx >= b.x && cx < b.x + b.w) { return b; }
      }
      return null;
    }
    var DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

    function card(b) {
      var c = b.c;
      openModal({ date: c.date, name: c.name, img: c.img, html: c.body ? '<p>' + c.body + '</p>' : '' }, root);
    }
    function blow(b) {
      // a ruin already standing just opens its story again
      if (b.down) { if (b.story && b.fall >= 1 && !pending) { card(b); } return; }
      b.down = true; b.fall = 0.001;
      shake = reduce ? 0 : (b.story ? 0.35 : 0.15);
      var cx = (b.x + b.w / 2) * T, cy = (b.y + 1 - b.h / 2) * T, n = b.story ? 80 : 26;
      var cols = ['#fff6cf', '#ffd35a', '#ff8a2e', '#e0441f', '#9a948a', '#6e685f'];
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, v = 20 + Math.random() * (b.story ? 110 : 60);
        parts.push({ x: cx + (Math.random() - 0.5) * b.w * T, y: cy + (Math.random() - 0.5) * b.h * T * 0.8, vx: Math.cos(a) * v,
                     vy: Math.sin(a) * v - 40, life: 0, max: 0.5 + Math.random() * 0.7, c: cols[Math.floor(Math.random() * cols.length)],
                     floor: (b.y + 1) * T + Math.random() * 6 });
      }
      if (b.story) { pending = { b: b, t: 0.85 }; }
    }

    function tryStep(dir) {
      m.face = dir;
      var d = DIRS[dir], nx = m.tx + d[0], ny = m.ty + d[1];
      if (nx < 0 || nx + 1 >= COLS || ny < 1 || ny >= ROWS) { return; }
      var hit = blockAt(nx, ny) || blockAt(nx + 1, ny);
      if (hit) { blow(hit); return; }
      m.from = { x: m.tx, y: m.ty }; m.tx = nx; m.ty = ny; m.t = 0; m.stepN++;
    }
    // The first building the beam crosses, up to ten tiles out. The beam is
    // tested against each building as drawn (its whole face, not the row it
    // stands on), with a few pixels' grace, because it leaves his mouth well
    // above his feet and would otherwise pass through a tower without a hit.
    var REACH = 10 * T, GRACE = 5;
    function face(b) {
      var base = (b.y + 1) * T;
      var tall = b.story || b.kind ? b.h * T * (b.story && b.down ? 0.5 : 1) : 32;
      return { x0: b.x * T, x1: (b.x + b.w) * T, top: base - tall, base: base };
    }
    function lane() {
      var mo = mouth(), d = DIRS[m.face], best = null;
      blocks.forEach(function (b) {
        if (b.down && !b.story) { return; }
        var f = face(b), dist;
        if (d[0]) {
          if (mo.y < f.top - GRACE || mo.y > f.base + GRACE) { return; }
          dist = d[0] > 0 ? f.x0 - mo.x : mo.x - f.x1;
        } else {
          if (mo.x < f.x0 - GRACE || mo.x > f.x1 + GRACE) { return; }
          dist = d[1] < 0 ? mo.y - f.base : f.top - mo.y;
        }
        if (dist >= -GRACE * 2 && dist <= REACH && (!best || dist < best.dist)) { best = { b: b, dist: dist, f: f }; }
      });
      return best;
    }
    function pos() {
      // his position in pixels, part-way through a step
      var p = m.from ? Math.min(1, m.t / STEP) : 1, fx = m.from ? m.from.x : m.tx, fy = m.from ? m.from.y : m.ty;
      return { x: (fx + (m.tx - fx) * p) * T, y: (fy + (m.ty - fy) * p) * T };
    }
    function mouth() {
      var p = pos(), left = p.x + T - KW / 2, top = p.y + T - KH + 2;
      if (m.face === 'down') { return { x: left + 32, y: top + 20 }; }
      if (m.face === 'up') { return { x: left + 32, y: top + 4 }; }
      return { x: left + (m.face === 'right' ? 58 : 4), y: top + 19 };
    }
    // pressed mid-step, the breath waits for the step to finish
    function breathe() {
      if (m.state !== 'idle' || m.from) { m.queued = m.state === 'idle'; return; }
      m.state = 'charge'; m.st = 0; m.queued = false;
    }

    function step(dt) {
      clock += dt;
      if (modalOpen) { keys.up = keys.down = keys.left = keys.right = false; order = []; return; }
      if (m.from) { m.t += dt; if (m.t >= STEP) { m.from = null; } }
      if (m.state === 'idle' && !m.from && m.queued) { breathe(); }
      else if (m.state === 'idle' && !m.from && order.length) { goal = null; follow = true; tryStep(order[order.length - 1]); }
      else if (m.state === 'idle' && !m.from && goal) {
        var gx = goal.x - m.tx, gy = goal.y - m.ty;
        if (!gx && !gy) { if (goal.after && !goal.after.down) { tryStep('up'); } goal = null; }
        else {
          var was = { x: m.tx, y: m.ty };
          tryStep(Math.abs(gx) >= Math.abs(gy) ? (gx > 0 ? 'right' : 'left') : (gy > 0 ? 'down' : 'up'));
          if (m.tx === was.x && m.ty === was.y && !pending) {
            // blocked by the map's edge or by rubble still falling: try the other axis once, then give up
            if (gx && gy) { tryStep(Math.abs(gx) >= Math.abs(gy) ? (gy > 0 ? 'down' : 'up') : (gx > 0 ? 'right' : 'left')); }
            if (m.tx === was.x && m.ty === was.y) { goal = null; }
          }
          if (pending) { goal = null; }
        }
      }
      if (m.state === 'charge') {
        m.st += dt;
        if (m.st > 0.45) {
          m.state = 'breath'; m.st = 0;
          var l = lane(), mo = mouth(), d = DIRS[m.face];
          m.target = l ? l.b : null;
          if (l) {
            // stop the beam a little way into the building's face
            m.end = d[0] > 0 ? { x: l.f.x0 + 4, y: mo.y } : d[0] < 0 ? { x: l.f.x1 - 4, y: mo.y }
                  : d[1] < 0 ? { x: mo.x, y: l.f.base - 6 } : { x: mo.x, y: l.f.top + 6 };
          } else {
            m.end = { x: mo.x + d[0] * REACH, y: mo.y + d[1] * REACH };
          }
        }
      } else if (m.state === 'breath') {
        m.st += dt;
        if (m.target && m.st > 0.18) { blow(m.target); m.target = null; }
        if (m.st > 0.6) { m.state = 'idle'; }
      }
      blocks.forEach(function (b) { if (b.down && b.fall < 1) { b.fall = Math.min(1, b.fall + dt * 2.2); } });
      parts = parts.filter(function (q) {
        q.life += dt; if (q.life > q.max) { return false; }
        q.vy += 150 * dt; q.x += q.vx * dt; q.y = Math.min(q.floor, q.y + q.vy * dt);
        return true;
      });
      shake = Math.max(0, shake - dt);
      if (pending) {
        pending.t -= dt;
        if (pending.t <= 0) {
          var pb = pending.b; pending = null;
          card(pb);
        }
      }
      if (follow) { camY = pos().y - H / 2 + 8; }
      camY = Math.max(0, Math.min(ROWS * T - H, camY));
    }

    // ---- drawing, in the lecture apps' flat style: ink outlines, muted fills ----
    function box(x, y, w, hh, fill) { g.fillStyle = INK; g.fillRect(x, y, w, hh); g.fillStyle = fill; g.fillRect(x + 1, y + 1, w - 2, hh - 2); }
    // Tokyo Tower: a tapering lattice in red and white bands, two decks, an antenna
    function drawTokyoTower(b) {
      var x = b.x * T, base = (b.y + 1) * T, w = b.w * T, cx = x + w / 2;
      var hh = Math.max(4, Math.round((b.h * T - 14) * (1 - 0.5 * b.fall)));
      for (var yy = 0; yy < hh; yy++) {
        var t = yy / hh, half = Math.round(2 + (w / 2 - 3) * Math.pow(1 - t, 1.9)), y = base - 1 - yy;
        g.fillStyle = INK; g.fillRect(cx - half - 1, y, half * 2 + 2, 1);
        g.fillStyle = Math.floor(yy / 9) % 2 ? '#f3efe6' : '#e0442e'; g.fillRect(cx - half, y, half * 2, 1);
        // the arch between the legs
        if (yy < 12) { var gap = Math.round((12 - yy) * 1.3); g.fillStyle = '#f2eee2'; g.fillRect(cx - gap, y, gap * 2, 1); }
        // lattice
        if (half > 4 && yy % 3 === 0) { g.fillStyle = 'rgba(28,26,25,.28)'; g.fillRect(cx - half + ((yy * 2) % (half * 2)), y, 1, 1); }
      }
      if (b.fall > 0) { return; }
      [[0.42, 11, 5], [0.7, 6, 4]].forEach(function (d) {
        var y = base - Math.round(hh * d[0]), half = Math.round(2 + (w / 2 - 3) * Math.pow(1 - d[0], 1.9)) + d[1] / 2;
        g.fillStyle = INK; g.fillRect(cx - half - 1, y - d[2] - 1, half * 2 + 2, d[2] + 2);
        g.fillStyle = '#f3efe6'; g.fillRect(cx - half, y - d[2], half * 2, d[2]);
        g.fillStyle = '#7fa6c9'; g.fillRect(cx - half + 1, y - d[2] + 1, half * 2 - 2, 2);
      });
      g.fillStyle = INK; g.fillRect(cx - 1, base - hh - 12, 2, 12);
      g.fillStyle = '#e0442e'; g.fillRect(cx - 1, base - hh - 12, 2, 3); g.fillRect(cx - 1, base - hh - 6, 2, 3);
    }
    // Tokyo Skytree: a pale lattice spire on a tripod base, two round decks, a mast
    function drawSkytree(b) {
      var x = b.x * T, base = (b.y + 1) * T, w = b.w * T, cx = x + w / 2;
      var hh = Math.max(4, Math.round((b.h * T - 18) * (1 - 0.5 * b.fall)));
      for (var yy = 0; yy < hh; yy++) {
        var t = yy / hh, half = t < 0.22 ? Math.round(18 - 12 * (t / 0.22)) : Math.round(6 - 2.5 * (t - 0.22) / 0.78), y = base - 1 - yy;
        g.fillStyle = INK; g.fillRect(cx - half - 1, y, half * 2 + 2, 1);
        g.fillStyle = '#e6ebf1'; g.fillRect(cx - half, y, half * 2, 1);
        g.fillStyle = '#9fb0c2';
        for (var xx = -half; xx < half; xx++) { if ((xx + yy) % 5 === 0 || (xx - yy) % 5 === 0) { g.fillRect(cx + xx, y, 1, 1); } }
        if (yy < 10) { var gap = Math.round((10 - yy) * 1.2); g.fillStyle = '#f2eee2'; g.fillRect(cx - gap, y, gap * 2, 1); }
      }
      if (b.fall > 0) { return; }
      [[0.6, 12, 6], [0.76, 8, 4]].forEach(function (d) {
        var y = base - Math.round(hh * d[0]);
        g.fillStyle = INK; g.fillRect(cx - d[1] - 1, y - d[2] - 1, d[1] * 2 + 2, d[2] + 2);
        g.fillStyle = '#f7f9fb'; g.fillRect(cx - d[1], y - d[2], d[1] * 2, d[2]);
        g.fillStyle = '#6f8fb0'; g.fillRect(cx - d[1] + 1, y - d[2] + 2, d[1] * 2 - 2, 2);
      });
      g.fillStyle = '#8a97a6'; g.fillRect(cx - 1, base - hh - 16, 2, 16);
      g.fillStyle = INK; g.fillRect(cx - 1, base - hh - 17, 2, 1);
    }
    function drawShape(b) {
      if (b.kind === 'odaiba') { drawOdaiba(b); }
      else if (b.kind === 'tokyo-tower') { drawTokyoTower(b); }
      else if (b.kind === 'skytree') { drawSkytree(b); }
      else { drawBlock(b); }
    }
    function drawTower(b) {
      if (!(b.down && b.fall >= 1)) { drawShape(b); return; }
      // A ruin glows like the objects in the Hibakusha room: a soft, pulsing
      // gold halo that follows its own outline, so it reads as still openable.
      if (!b.ruin) { b.ruin = paintRuin(b); }
      var r = b.ruin, pulse = 0.5 + 0.5 * Math.sin(clock * 3);
      g.save();
      g.shadowColor = 'rgba(255, 196, 70,' + (0.55 + 0.4 * pulse).toFixed(2) + ')';
      g.shadowBlur = (4 + 9 * pulse) * S * dpr;
      g.drawImage(r.c, r.x, r.y); g.drawImage(r.c, r.x, r.y);
      g.shadowBlur = 0; g.shadowColor = 'transparent';
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.1 + 0.12 * pulse;
      g.drawImage(r.c, r.x, r.y);
      g.restore();
    }
    // Draws the ruin once into its own small canvas (broken top, scorch marks),
    // so the glow can follow its silhouette.
    function paintRuin(b) {
      var f = face(b), pad = 10, x0 = f.x0 - pad, y0 = f.top - pad;
      var c = document.createElement('canvas'), main = g;
      c.width = f.x1 - f.x0 + pad * 2; c.height = f.base - f.top + pad * 2;
      g = c.getContext('2d'); g.translate(-x0, -y0);
      drawShape(b);
      // the arches between the towers' legs are painted in the ground's color; clear them
      var img = g.getImageData(0, 0, c.width, c.height), d = img.data;
      for (var k = 0; k < d.length; k += 4) { if (d[k] === 242 && d[k + 1] === 238 && d[k + 2] === 226) { d[k + 3] = 0; } }
      g.putImageData(img, 0, 0);
      // a broken top: bites taken out of the roofline
      g.globalCompositeOperation = 'destination-out';
      for (var x = f.x0 + 2, i = 0; x < f.x1 - 2; x += 3, i++) { g.fillRect(x, f.top - 2, 3, 2 + [2, 5, 1, 4, 3, 6][i % 6]); }
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = 'rgba(28, 26, 25, .28)'; g.fillRect(f.x0, f.top, f.x1 - f.x0, 14);
      g = main;
      return { c: c, x: x0, y: y0 };
    }
    function drawBlock(b) {
      var x = b.x * T, base = (b.y + 1) * T, w = b.w * T;
      var full = b.h * T - 4, hh = Math.max(4, Math.round(full * (1 - 0.5 * b.fall))), top = base - hh;
      box(x + 2, top, w - 4, hh, b.tone);
      g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(x + 3, top + 1, 3, hh - 2);
      // windows
      g.fillStyle = '#e9eef3';
      for (var wy = top + 5; wy < base - 9; wy += 6) { for (var wx = x + 7; wx < x + w - 8; wx += 6) { g.fillRect(wx, wy, 3, 3); } }
      // door
      g.fillStyle = INK; g.fillRect(x + w / 2 - 4, base - 8, 8, 8); g.fillStyle = '#5b4a3a'; g.fillRect(x + w / 2 - 3, base - 7, 6, 7);
      if (b.fall > 0) { return; }
      // crowns
      if (b.style === 0) { g.fillStyle = INK; g.fillRect(x + w / 2 - 1, top - 9, 2, 9); g.fillStyle = '#c8372d'; g.fillRect(x + w / 2 - 1, top - 10, 2, 2); }
      if (b.style === 1) { box(x + 8, top - 5, w - 16, 6, b.tone); }
      if (b.style === 2) { box(x + 10, top - 7, 10, 8, '#8a7358'); }
      if (b.style === 3) { box(x, top - 2, w, 4, '#6f7a88'); }
    }
    // The bay across the top of the map, with Odaiba's island on the right
    function drawSea() {
      var shore = SEA * T - 4;
      g.fillStyle = '#86b9dc'; g.fillRect(-4, -4, W + 8, shore + 4);
      g.fillStyle = '#6fa6cf'; g.fillRect(-4, shore - 14, W + 8, 14);
      // waves drift slowly along the bay
      g.fillStyle = '#d8ecf8';
      for (var i = 0; i < 26; i++) {
        var wx = ((i * 53 + clock * 9 * (i % 2 ? 1 : -1)) % (W + 40) + W + 40) % (W + 40) - 20, wy = 6 + (i * 29) % (shore - 16);
        g.fillRect(Math.round(wx), wy, 6, 1); g.fillRect(Math.round(wx) + 2, wy - 1, 3, 1);
      }
      // the island
      g.fillStyle = '#d9c9a0'; g.fillRect(16 * T + 4, 1 * T, 8 * T, shore - T + 2);
      g.fillStyle = '#f2eee2'; g.fillRect(16 * T + 8, 1 * T + 4, 8 * T, shore - T - 6);
      // the beach and its foam line
      g.fillStyle = '#eef6fb'; g.fillRect(-4, shore - 2, W + 8, 2);
      g.fillStyle = '#e3d3a8'; g.fillRect(-4, shore, W + 8, 5);
    }
    // Fuji TV's headquarters in Odaiba: two towers joined by a lattice, with the silver sphere
    function drawOdaiba(b) {
      var x = b.x * T, base = (b.y + 1) * T, w = b.w * T, k = 1 - 0.5 * b.fall;
      var hh = Math.max(4, Math.round((b.h * T - 6) * k)), top = base - hh;
      box(x + 2, top, 18, hh, '#b9c4cf'); box(x + w - 20, top, 18, hh, '#b9c4cf');
      // the lattice between them
      g.fillStyle = INK;
      for (var yy = top + 6; yy < base - 4; yy += 10) { g.fillRect(x + 19, yy, w - 38, 3); }
      g.fillRect(x + 19, top + 2, 2, hh - 4); g.fillRect(x + w - 21, top + 2, 2, hh - 4);
      g.fillStyle = '#e9eef3';
      for (var wy = top + 4; wy < base - 6; wy += 5) { g.fillRect(x + 6, wy, 2, 2); g.fillRect(x + 12, wy, 2, 2); g.fillRect(x + w - 16, wy, 2, 2); g.fillRect(x + w - 10, wy, 2, 2); }
      if (b.fall > 0) { return; }
      // the sphere
      var cx = x + w / 2, cy = top + 17, r = 10;
      g.fillStyle = INK; g.beginPath(); g.arc(cx, cy, r + 1, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#c9d1d9'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#eef2f6'; g.fillRect(cx - 5, cy - 6, 4, 3);
      g.fillStyle = '#9aa6b3'; g.fillRect(cx - r + 1, cy + 1, r * 2 - 2, 1);
    }
    function drawHouse(b) {
      if (b.down && b.fall >= 1) { rubble(b); return; }
      var x = b.x * T, base = (b.y + 1) * T, w = b.w * T, k = 1 - b.fall;
      var wallH = Math.round(18 * k), roofH = Math.round(14 * k);
      box(x + 6, base - wallH, w - 12, wallH, '#e8e0cf');
      g.fillStyle = INK; g.fillRect(x + w / 2 - 3, base - 10 * k, 6, 10 * k);
      g.fillStyle = '#a89066';
      g.beginPath(); g.moveTo(x + 2, base - wallH); g.lineTo(x + w / 2, base - wallH - roofH); g.lineTo(x + w - 2, base - wallH); g.closePath(); g.fill();
      g.strokeStyle = '#6d5c40'; g.lineWidth = 1; g.stroke();
    }
    function rubble(b) {
      var x = b.x * T, base = (b.y + 1) * T;
      for (var i = 0; i < b.w * T; i += 4) {
        var rh = 3 + ((i * 7 + b.x * 13) % 6);
        g.fillStyle = i % 8 ? '#9a948a' : '#6e685f'; g.fillRect(x + i, base - rh, 4, rh);
      }
    }
    function drawTree(t) {
      var x = t[0] * T, base = (t[1] + 1) * T;
      g.fillStyle = '#5a4636'; g.fillRect(x + 7, base - 8, 3, 8);
      g.fillStyle = '#2f6b45'; g.fillRect(x + 2, base - 20, 13, 12);
      g.fillStyle = '#3a8a57'; g.fillRect(x + 4, base - 22, 9, 6);
    }
    function drawLamp(t) {
      var x = t[0] * T, base = (t[1] + 1) * T;
      g.fillStyle = '#3d4a5a'; g.fillRect(x + 7, base - 20, 2, 20); g.fillRect(x + 5, base - 2, 6, 2);
      g.fillStyle = INK; g.fillRect(x + 5, base - 24, 6, 5); g.fillStyle = '#f4dc7c'; g.fillRect(x + 6, base - 23, 4, 3);
    }
    function drawFence(t) {
      var x = t[0] * T, base = (t[1] + 1) * T;
      g.fillStyle = '#8a7358';
      for (var i = 0; i < 4; i++) { g.fillRect(x + i * 8, base - 11, 2, 11); }
      g.fillStyle = '#a08a68'; g.fillRect(x, base - 9, 26, 2); g.fillRect(x, base - 5, 26, 2);
    }
    function drawKaiju() {
      var p = pos(), left = Math.round(p.x + T - KW / 2), top = Math.round(p.y + T - KH + 2);
      var moving = !!m.from, flip = m.face === 'left' ? 1 : 0;
      var two = moving && Math.min(1, m.t / STEP) > 0.5 ? (m.stepN % 2) : 0;
      var k = m.face === 'down' ? 'down' : m.face === 'up' ? 'up' : 'side';
      var f = m.state === 'breath' && k !== 'up' ? k + 'B' : k + (two ? '2' : '1');
      g.fillStyle = 'rgba(28, 26, 25, .18)'; g.fillRect(left + 14, top + KH - 5, 36, 6);
      g.drawImage(FR[f][flip], left, top);
      if (m.state === 'charge' || m.state === 'breath') {
        // the glow climbs the plates from the tail up to the head, then holds
        var pr = m.state === 'charge' ? Math.min(1, m.st / 0.4) : 1, cut = Math.round(KH * (1 - pr));
        var gl = GLOW[f][flip], pulse = 0.35 + 0.25 * Math.sin(clock * 22);
        g.save(); g.beginPath(); g.rect(left - 4, top + cut, KW + 8, KH + 4 - cut); g.clip();
        g.globalAlpha = pulse;
        [[-2, 0], [2, 0], [0, -2], [0, 2], [-3, -1], [3, -1], [0, -3]].forEach(function (o) { g.drawImage(gl, left + o[0], top + o[1]); });
        g.globalAlpha = 1; g.drawImage(gl, left, top);
        g.restore();
      }
    }
    function draw() {
      var sx = shake > 0 ? Math.round((Math.random() - 0.5) * 4) : 0, sy = shake > 0 ? Math.round((Math.random() - 0.5) * 3) : 0;
      g.setTransform(S * dpr, 0, 0, S * dpr, 0, 0); g.imageSmoothingEnabled = false;
      g.save(); g.translate(sx, -Math.round(camY) + sy);
      // ground: the lecture apps' paper and faint grid
      g.fillStyle = '#f2eee2'; g.fillRect(-4, camY - 4, W + 8, H + 8);
      g.fillStyle = '#e9e4d8';
      for (var gx = 0; gx <= W; gx += T) { g.fillRect(gx, camY - 4, 1, H + 8); }
      for (var gy = Math.floor(camY / T) * T, gEnd = camY + Math.min(H, ROWS * T) + T; gy < gEnd; gy += T) { g.fillRect(-4, gy, W + 8, 1); }
      if (camY < SEA * T) { drawSea(); }
      // everything standing, drawn back to front
      var items = [];
      towers.forEach(function (b) { items.push({ y: (b.y + 1) * T, f: function () { drawTower(b); } }); });
      houses.forEach(function (b) { items.push({ y: (b.y + 1) * T, f: function () { drawHouse(b); } }); });
      KAIJU_TREES.forEach(function (t) { items.push({ y: (t[1] + 1) * T - 1, f: function () { drawTree(t); } }); });
      KAIJU_LAMPS.forEach(function (t) { items.push({ y: (t[1] + 1) * T - 1, f: function () { drawLamp(t); } }); });
      KAIJU_FENCES.forEach(function (t) { items.push({ y: (t[1] + 1) * T - 1, f: function () { drawFence(t); } }); });
      items.push({ y: pos().y + T + 0.5, f: drawKaiju });
      items.sort(function (a, b) { return a.y - b.y; }).forEach(function (it) { it.f(); });
      // the beam
      if (m.state === 'breath' && m.end) {
        var mo = mouth(), kk = Math.min(1, m.st / 0.15);
        var x2 = mo.x + (m.end.x - mo.x) * kk, y2 = mo.y + (m.end.y - mo.y) * kk;
        g.lineCap = 'round';
        [['rgba(80, 170, 255, 0.5)', 7 + Math.random() * 3], ['#bfeaff', 3], ['#ffffff', 1]].forEach(function (s) {
          g.strokeStyle = s[0]; g.lineWidth = s[1]; g.beginPath(); g.moveTo(mo.x, mo.y); g.lineTo(x2, y2); g.stroke();
        });
        g.fillStyle = 'rgba(210, 245, 255, 0.9)'; g.fillRect(Math.round(x2) - 3, Math.round(y2) - 3, 6, 6);
      }
      parts.forEach(function (q) {
        g.globalAlpha = Math.max(0, 1 - q.life / q.max);
        g.fillStyle = q.c; g.fillRect(Math.round(q.x), Math.round(q.y), 2, 2);
      });
      g.globalAlpha = 1;
      g.restore();
    }
    function frame(now) {
      if (!visible) { last = 0; return; }
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
      step(dt); draw();
      requestAnimationFrame(frame);
    }

    // size: the map is 24 tiles across the full width; however many rows fit, show
    var dpr = 1;
    function size() {
      var r = stage.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) { return; }
      dpr = window.devicePixelRatio || 1;
      S = r.width / W; H = r.height / S;
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
      draw();
    }
    // open full screen to play; Esc or the close button returns to the page
    var opener = null;
    function openMap() {
      if (isOpen) { return; }
      isOpen = true; opener = document.activeElement;
      stage.classList.add('is-full'); document.body.classList.add('nuc-kj-open');
      el('nuc-kj-close').focus({ preventScroll: true });
      size();
    }
    function closeMap() {
      if (!isOpen) { return; }
      isOpen = false; order = []; goal = null; keys.up = keys.down = keys.left = keys.right = false;
      stage.classList.remove('is-full'); document.body.classList.remove('nuc-kj-open');
      size();
      if (opener && opener.focus) { opener.focus({ preventScroll: true }); }
    }
    root.addEventListener('click', function (e) { if (!isOpen) { openMap(); } });
    root.addEventListener('keydown', function (e) {
      if (!isOpen && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openMap(); }
    });
    el('nuc-kj-close').addEventListener('click', function (e) { e.stopPropagation(); closeMap(); });
    function press(k) { if (order.indexOf(k) < 0) { order.push(k); } keys[k] = true; }
    function release(k) { order = order.filter(function (o) { return o !== k; }); keys[k] = false; }
    var KEYS = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right',
                 ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' };
    document.addEventListener('keydown', function (e) {
      if (!isOpen || modalOpen || e.altKey || e.ctrlKey || e.metaKey) { return; }
      if (e.key === 'Escape') { e.preventDefault(); closeMap(); return; }
      if (KEYS[e.key]) { e.preventDefault(); press(KEYS[e.key]); }
      else if (e.key === 'e' || e.key === 'E') { e.preventDefault(); breathe(); }
    });
    document.addEventListener('keyup', function (e) { if (KEYS[e.key]) { release(KEYS[e.key]); } });
    window.addEventListener('blur', function () { order = []; keys.up = keys.down = keys.left = keys.right = false; });
    // the wheel looks over the map while it is open
    stage.addEventListener('wheel', function (e) {
      if (!isOpen) { return; }
      e.preventDefault(); follow = false;
      camY = Math.max(0, Math.min(ROWS * T - H, camY + e.deltaY / S));
    }, { passive: false });
    // clicking or tapping the open map walks him there; clicking a building sends him to smash it
    var downAt = null;
    cv.addEventListener('pointerdown', function (e) { downAt = { x: e.clientX, y: e.clientY }; });
    cv.addEventListener('pointerup', function (e) {
      if (!isOpen || !downAt || Math.abs(e.clientX - downAt.x) + Math.abs(e.clientY - downAt.y) > 8) { downAt = null; return; }
      downAt = null;
      var r = cv.getBoundingClientRect(), wx = (e.clientX - r.left) / S, wy = (e.clientY - r.top) / S + camY;
      var cx = Math.floor(wx / T), cy = Math.floor(wy / T), hitB = null;
      blocks.forEach(function (b) {
        var top = b.story ? face(b).top - 4 : (b.y + 1) * T - 34;
        if ((!b.down || b.story) && wx >= b.x * T && wx < (b.x + b.w) * T && wy >= top && wy < (b.y + 1) * T) { hitB = b; }
      });
      if (hitB && hitB.down) { if (hitB.fall >= 1) { card(hitB); } return; }
      // aim for the tile in front of a building, or just below where he was sent
      if (hitB) { cx = Math.max(0, Math.min(COLS - 2, hitB.x + Math.floor(hitB.w / 2) - 1)); cy = hitB.y + 1; }
      goal = { x: Math.max(0, Math.min(COLS - 2, cx - (hitB ? 0 : 1))), y: Math.max(1, Math.min(ROWS - 1, cy)) };
      if (hitB) { goal.after = hitB; }
      follow = true;
    });
    fire.addEventListener('click', function (e) { e.stopPropagation(); breathe(); });
    window.addEventListener('resize', size);

    size();
    step(0); draw();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        var was = visible;
        visible = es[0].isIntersecting;
        if (visible && !was) { last = 0; requestAnimationFrame(frame); }
      }, { threshold: 0.1 }).observe(root);
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
    wireKaiju();
    expandCitations(document.querySelector('main'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}());
