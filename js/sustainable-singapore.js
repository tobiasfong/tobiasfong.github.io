/* ============================================================
   Sustainable Singapore — timeline + live data
   ------------------------------------------------------------
   Everything runs client-side. Data comes from data.gov.sg's
   public APIs (no key, CORS-open), with a baked-in JSON fallback
   at /data/sustainable-singapore.json so the page still renders
   correctly if an API is down or the visitor is offline.

   Two live endpoints are used:
     • real-time air temperature (NEA station network)
     • datastore_search for the historical monthly means and the
       annual land-area series
   NOTE: the newer poll-download API hands back a signed S3 URL,
   and that S3 object sends no CORS headers — a browser fetch of
   it is blocked. datastore_search is the endpoint that works
   from a page. Don't "modernise" this to poll-download.
   ============================================================ */
(function () {
  'use strict';

  var DS = 'https://data.gov.sg/api/action/datastore_search?resource_id=';
  var ID_TEMP = 'd_755290a24afe70c8f9e8bcbf9f251573';   // monthly mean, Changi, 1982-
  var ID_LAND = 'd_0b2c034da121ef8efc71949af1694b4d';   // total land area, Dec, 1960-
  var RT_TEMP = 'https://api-open.data.gov.sg/v2/real-time/api/air-temperature';

  var YEAR_MIN = 1900, YEAR_MAX = 2026;
  var PX_PER_YEAR = 30;
  var TL_HEIGHT = (YEAR_MAX - YEAR_MIN) * PX_PER_YEAR;

  var TEMP_LO = 25.6, TEMP_HI = 29.2;   // °C axis for the temperature track
  var LAND_LO = 570,  LAND_HI = 755;    // km² axis for the land track

  function yFor(year) { return (year - YEAR_MIN) * PX_PER_YEAR; }
  function el(id) { return document.getElementById(id); }
  function svgNode(name, attrs) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (var k in attrs) { if (attrs[k] !== null) n.setAttribute(k, attrs[k]); }
    return n;
  }

  /* ── The historical events ───────────────────────────────── */
  var EVENTS = [
    {
      year: 1900, label: '1900s',
      title: 'An island of swamps',
      img: 'kampong-swamp.jpg',
      cap: 'Generated illustration of a kampong on a swamp, which was cleared across the island from the 1960s.',
      body: 'Singapore was home to myriad ecosystems and coastal habitats, much of which has been cleared since then. Even as far back as 1820, mangrove swamps made up about 13% of Singapore’s fringe areas, only to fall to less than 0.5% of our land area in 2010.[^15]'
    },
    {
      year: 1960, label: '1 February 1960',
      title: 'The Housing and Development Board is formed',
      body: 'HDB succeeded the colonial government’s Singapore Improvement Trust, and set about solving the housing problems that arose as the island’s population grew rapidly, especially for low-income groups. By 1965, HDB completed its first five-year program, building over 50,000 units.[^6] Three seven-story blocks at Stirling Road, Queenstown, were among the first completed in October 1960.[^7]'
    },
    {
      year: 1961, label: '25 May 1961',
      title: 'The Bukit Ho Swee fire',
      body: 'A fire, which started in Kampong Tiong Bahru, spread to Kampong Bukit Ho Swee and razed a 100-acre area, leaving 16,000 people homeless. The government pledged to aid the affected families by giving them new homes, relocating 6,000 residents to 1,150 flats in Queenstown, Tiong Bahru, Alexandra and Kallang. The remaining families also found new homes by February 1962. HDB then acquired the fire site and adjacent land for public housing, and constructed 12,562 flats by 1967.[^8]'
    },
    {
      year: 1962, label: '1962–1970',
      title: 'From big swamp to housing estate',
      img: 'new-town-construction.jpg',
      cap: 'Generated illustration — kampong ground cleared, leveled and cut for foundations.',
      body: 'Toa Payoh is literally “big swamp” in Hokkien, and that was what it was before 1962.[^9] In the 19th century, the forests were replaced by gambier and pepper plantations, which in turn gave rise to kampongs.[^10] By 1960, 3,000 families resided there, and though HDB first announced the construction of Toa Payoh Town in the 1960s and expected it to be built by 1965, there were delays. After resisting for two years, squatters finally moved out of the site in 1962, allowing HDB to build it during the second five-year program between 1966 and 1970.[^11] According to the RememberingHDBEstates blog, 95,000 people moved into around 18,000 units in the new flats by 1970.[^12]'
    },
    {
      year: 1963, label: '16 June 1963',
      title: 'The first tree-planting campaign',
      body: 'Lee Kuan Yew plants a mempat tree at Farrer Circus and sets a target of 10,000 trees a year.[^16] The stated aim is a cool canopy over the city — an urban-heat-island intervention, launched in the same years the kampongs were coming down.'
    },
    {
      year: 1966, label: 'From 1966',
      title: 'East Coast Reclamation begins',
      img: 'reclamation.jpg',
      cap: 'Generated illustration — dredged sand pushed out into shallow sea.',
      body: 'Seven phases over roughly thirty years add about 1,525 hectares along the south-eastern coast, from Bedok down to Marina South. The same program eventually produces the land Marina Bay stands on.[^13] Land area, flat at 581.5 km² since 1960, starts to climb.[^5]'
    },
    {
      year: 1968, label: '1961–1968',
      title: 'Jurong: heavy industry on reclaimed swamp',
      body: 'Mangrove and swamp in the south-west are drained and filled for the national industrial estate. By 1968 it holds 153 factories with another 46 under construction[^14] — dark, hard, heat-absorbing surface at scale, plus the waste heat of the industry standing on it.'
    },
    {
      year: 1971, label: 'November 1971',
      title: 'The first Tree Planting Day',
      body: 'The 1967 “Garden City” campaign becomes an annual national ritual.[^17] Angsana and rain trees go in along the new roads specifically for their broad, fast, dense crowns.'
    },
    {
      year: 1979, label: '1979–1981',
      title: 'Changi: an airport out of the sea',
      body: 'About 700 hectares are reclaimed along the north-eastern shoreline using some 40 million cubic meters of dredged sand. Reclamation completes in 1979; the airport opens in 1981.[^13] The land-area series steps up sharply through the late 1970s.'
    },
    {
      year: 1993, label: '1993–2003',
      title: 'Jurong Island',
      body: 'Seven south-western islands are merged into one 3,000-hectare petrochemical island over a decade, at a cost of about $6 billion.[^13]'
    },
    {
      year: 1997, label: '1997 onward',
      title: 'The high-rise island — and the record books',
      img: 'heat-island.jpg',
      cap: 'Generated illustration — a bare concrete street canyon: the geometry that traps heat.',
      body: 'Every one of the ten warmest years in Singapore’s record falls after 1997.[^1] By this point the island is one of the most densely built surfaces on earth, and a study trip led by Prof Matthias Roth of NUS measured a sharp 4 °C rise from Lim Chu Kang to Orchard Road — two places only thirty minutes apart.[^19] The mechanism is visible at street level: a narrow canyon walled in low-albedo concrete, with little wind, can run 2.5 °C hotter in the middle of the road than the material choice alone would suggest.[^20]'
    },
    {
      year: 2008, label: '2000s',
      title: 'Marina Bay: a downtown on made ground',
      img: 'marina-bay.jpg',
      cap: 'Generated illustration — a waterfront skyline standing on reclaimed land.',
      body: 'The land beneath Marina Bay was reclaimed from the 1970s onward as part of the East Coast program; the Barrage closes the river mouth in 2008.[^13] Between 1999 and 2000 alone the national land area jumps from 659.9 to 682.7 km² — the single largest one-year gain in the series.[^5]'
    },
    {
      year: 2020, label: '2020–2030',
      title: 'OneMillionTrees and the Green Plan',
      img: 'green-future.jpg',
      cap: 'Generated illustration — a street roofed over by canopy, facades planted.',
      body: 'NParks sets out to plant a million more trees under the Singapore Green Plan 2030, now expected to hit target by the end of 2027.[^18] Sixty years after the mempat tree at Farrer Circus, the policy instrument is recognizably the same one — only now it is explicitly framed as heat mitigation.'
    },
    {
      year: 2024, label: '2024',
      title: 'The warmest year on record',
      body: 'Annual mean temperature at Changi reaches 28.4 °C, tying 2019 and 2016.[^2] Land area reaches 735.7 km² — and 744.3 km² the year after.[^5] Both tracks are still climbing.'
    }
  ];

  /* ── Footnotes ───────────────────────────────────────────────
     Citations are written inline in the prose as [^14] — in this file's
     EVENTS array and in the page's static HTML alike — and expanded here
     into superscript links to the numbered reference list.

     One syntax, both places, so a citation can be moved between a timeline
     card and a body paragraph without being rewritten. Keep the marker
     glued to the punctuation it follows, e.g. "...0.25 °C per decade.[^1]"
     ─────────────────────────────────────────────────────────── */
  function expandCitations(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p) { return NodeFilter.FILTER_REJECT; }
        var tag = p.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') {
          return NodeFilter.FILTER_REJECT;
        }
        if (p.closest && p.closest('.ss-cite, .ss-refs')) {
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
          sup.className = 'ss-cite';
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

  /* ── Data loading ────────────────────────────────────────── */
  function fetchJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) { throw new Error('HTTP ' + r.status); }
      return r.json();
    });
  }

  function liveTemps() {
    return fetchJSON(DS + ID_TEMP + '&limit=2000').then(function (j) {
      var recs = j.result.records, byYear = {};
      recs.forEach(function (r) {
        var m = r.month, v = parseFloat(r.mean_temp);
        if (!m || isNaN(v)) { return; }
        var y = parseInt(m.slice(0, 4), 10);
        (byYear[y] = byYear[y] || []).push(v);
      });
      var out = [];
      Object.keys(byYear).forEach(function (y) {
        var a = byYear[y];
        if (a.length === 12) {
          var s = 0; a.forEach(function (v) { s += v; });
          out.push([parseInt(y, 10), Math.round((s / 12) * 100) / 100]);
        }
      });
      return out.sort(function (a, b) { return a[0] - b[0]; });
    });
  }

  function liveLand() {
    return fetchJSON(DS + ID_LAND + '&limit=10').then(function (j) {
      var rec = j.result.records[0], out = [];
      for (var y = 1960; y <= YEAR_MAX; y++) {
        var v = parseFloat(rec[String(y)]);
        if (!isNaN(v)) { out.push([y, v]); }
      }
      return out.sort(function (a, b) { return a[0] - b[0]; });
    });
  }

  /* ── Timeline ────────────────────────────────────────────── */
  function buildAxis() {
    var axis = el('ss-tl-axis');
    for (var y = 1900; y <= 2020; y += 10) {
      var t = document.createElement('div');
      t.className = 'ss-tick-label';
      t.style.top = yFor(y) + 'px';
      t.textContent = y;
      axis.appendChild(t);
    }
  }

  function buildCards() {
    var host = el('ss-tl-cards');
    var overlay = svgNode('svg', {
      width: '100%', height: TL_HEIGHT,
      style: 'position:absolute;inset:0;pointer-events:none;overflow:visible'
    });
    host.appendChild(overlay);

    var nodes = EVENTS.map(function (ev) {
      var c = document.createElement('div');
      c.className = 'ss-card';
      var html = '<div class="ss-card-year">' + ev.label + '</div><h3>' + ev.title + '</h3>';
      if (ev.img) {
        html += '<img src="/img/sustainable/' + ev.img + '" alt="' + ev.title + '" loading="lazy" />';
        if (ev.cap) { html += '<figcaption>' + ev.cap + '</figcaption>'; }
      }
      html += '<p>' + ev.body + '</p>';
      c.innerHTML = html;
      host.appendChild(c);
      return { ev: ev, node: c };
    });

    return { nodes: nodes, overlay: overlay, host: host };
  }

  // Place each card at its year, push it down if it would collide with the
  // one above, then draw a dashed leader back to the event's TRUE position
  // on the year axis so a displaced card still reads accurately.
  // Re-run whenever heights can change (images finishing, resize).
  function layoutCards(built) {
    var nodes = built.nodes, overlay = built.overlay, host = built.host;
    var GAP = 18, cursor = -Infinity;

    nodes.forEach(function (n) {
      var trueY = yFor(n.ev.year);
      var top = Math.max(trueY, cursor);
      n.node.style.top = top + 'px';
      n.top = top;
      n.trueY = trueY;
      cursor = top + n.node.offsetHeight + GAP;
    });

    while (overlay.firstChild) { overlay.removeChild(overlay.firstChild); }
    var w = host.clientWidth;
    nodes.forEach(function (n) {
      var midY = n.top + 14;
      var startX = w - 26, endX = w;
      var d = 'M ' + startX + ' ' + midY + ' H ' + (startX + 12) +
              ' V ' + n.trueY + ' H ' + endX;
      overlay.appendChild(svgNode('path', {
        d: d, fill: 'none', stroke: 'rgba(0,0,0,0.20)',
        'stroke-width': 1, 'stroke-dasharray': '3 3'
      }));
      overlay.appendChild(svgNode('circle', {
        cx: endX, cy: n.trueY, r: 2.5, fill: '#C8102E'
      }));
    });

    return cursor;
  }

  function drawLand(series) {
    var svg = el('ss-svg-land');
    var w = svg.parentNode.clientWidth, h = TL_HEIGHT;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('height', h);
    while (svg.firstChild) { svg.removeChild(svg.firstChild); }

    var x = function (km) { return ((km - LAND_LO) / (LAND_HI - LAND_LO)) * w; };
    var pts = series.map(function (p) { return x(p[1]) + ',' + yFor(p[0]); });
    var first = series[0], last = series[series.length - 1];

    svg.appendChild(svgNode('path', {
      d: 'M 0,' + yFor(first[0]) + ' L ' + pts.join(' L ') +
         ' L 0,' + yFor(last[0]) + ' Z',
      fill: 'rgba(10,10,10,0.07)', stroke: 'none'
    }));
    svg.appendChild(svgNode('polyline', {
      points: pts.join(' '), fill: 'none',
      stroke: '#0a0a0a', 'stroke-width': 1.5, 'stroke-opacity': 0.55
    }));

    [[600, '600'], [700, '700']].forEach(function (g) {
      svg.appendChild(svgNode('line', {
        x1: x(g[0]), y1: 0, x2: x(g[0]), y2: h,
        stroke: 'rgba(0,0,0,0.07)', 'stroke-width': 1
      }));
    });

    var lbl = svgNode('text', {
      x: Math.min(x(last[1]) + 4, w - 30), y: yFor(last[0]) - 6,
      'font-size': 10, fill: '#888'
    });
    lbl.textContent = last[1];
    svg.appendChild(lbl);
  }

  function drawTemp(berkeley, changi) {
    var svg = el('ss-svg-temp');
    var w = svg.parentNode.clientWidth, h = TL_HEIGHT;
    if (!w) { return; }
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('height', h);
    while (svg.firstChild) { svg.removeChild(svg.firstChild); }

    var x = function (t) { return ((t - TEMP_LO) / (TEMP_HI - TEMP_LO)) * w; };

    [26, 27, 28, 29].forEach(function (t) {
      svg.appendChild(svgNode('line', {
        x1: x(t), y1: 0, x2: x(t), y2: h,
        stroke: 'rgba(0,0,0,0.06)', 'stroke-width': 1
      }));
      // The chart is several thousand pixels tall, so repeat the scale
      // labels down its length rather than only at the top.
      for (var ly = 12; ly < h; ly += 900) {
        var lab = svgNode('text', { x: x(t) + 3, y: ly, 'font-size': 10, fill: '#bbb' });
        lab.textContent = t + '°';
        svg.appendChild(lab);
      }
    });

    function line(series, stroke, width, opacity, dash) {
      if (!series || !series.length) { return; }
      svg.appendChild(svgNode('polyline', {
        points: series.map(function (p) { return x(p[1]) + ',' + yFor(p[0]); }).join(' '),
        fill: 'none', stroke: stroke, 'stroke-width': width,
        'stroke-opacity': opacity, 'stroke-linejoin': 'round',
        'stroke-dasharray': dash || null
      }));
    }

    line(berkeley, '#0a0a0a', 1.2, 0.35);
    line(changi, '#C8102E', 1.8, 0.9);

    function tag(series, text, color) {
      if (!series || !series.length) { return; }
      var last = series[series.length - 1];
      var t = svgNode('text', {
        x: Math.min(x(last[1]) + 5, w - 4), y: yFor(last[0]) + 3,
        'font-size': 10, fill: color, 'text-anchor': 'end'
      });
      t.textContent = text;
      svg.appendChild(t);
    }
    tag(changi, 'Changi ' + changi[changi.length - 1][1].toFixed(1) + '°', '#C8102E');
  }

  /* ── Live station panel ──────────────────────────────────── */
  function renderLive(payload) {
    var data = payload.data;
    var stations = {}, readings = [];
    (data.stations || []).forEach(function (s) { stations[s.id] = s.name; });

    var latest = (data.readings && data.readings.length)
      ? data.readings[data.readings.length - 1] : null;
    if (!latest) { throw new Error('no readings'); }

    latest.data.forEach(function (r) {
      if (typeof r.value === 'number') {
        readings.push({ name: stations[r.stationId] || r.stationId, v: r.value });
      }
    });
    if (!readings.length) { throw new Error('no values'); }

    readings.sort(function (a, b) { return b.v - a.v; });
    var hot = readings[0], cool = readings[readings.length - 1];
    var gap = hot.v - cool.v;

    el('ss-hot-val').textContent = hot.v.toFixed(1) + '°';
    el('ss-hot-where').textContent = hot.name;
    el('ss-cool-val').textContent = cool.v.toFixed(1) + '°';
    el('ss-cool-where').textContent = cool.name;
    el('ss-gap-val').textContent = gap.toFixed(1) + '°';
    el('ss-gap-where').textContent = readings.length + ' stations reporting';

    var when = new Date(latest.timestamp);
    el('ss-live-time').textContent = 'Reading taken ' + when.toLocaleString('en-SG', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Singapore'
    }) + ' SGT';

    var bars = el('ss-bars');
    bars.innerHTML = '';
    readings.forEach(function (r) {
      var pct = gap > 0 ? ((r.v - cool.v) / gap) * 100 : 100;
      var row = document.createElement('div');
      row.className = 'ss-bar-row';
      row.innerHTML =
        '<div class="ss-bar-name">' + r.name + '</div>' +
        '<div class="ss-bar-track"><div class="ss-bar-fill" style="width:' +
          Math.max(pct, 2).toFixed(1) + '%"></div></div>' +
        '<div class="ss-bar-val">' + r.v.toFixed(1) + '°</div>';
      bars.appendChild(row);
    });
  }

  function liveFailed() {
    el('ss-live-time').textContent = 'Live feed unavailable right now';
    el('ss-hot-val').textContent = '—';
    el('ss-cool-val').textContent = '—';
    el('ss-gap-val').textContent = '—';
    el('ss-gap-where').textContent = 'Could not reach data.gov.sg';
  }

  /* ── Boot ────────────────────────────────────────────────── */
  function boot() {
    el('ss-tl').style.height = TL_HEIGHT + 'px';
    buildAxis();
    var built = buildCards();
    // Expand before the first layout pass: the markers are inline and can
    // reflow a card's text, which would otherwise invalidate its height.
    expandCitations(document.body);

    function relayout() {
      var used = layoutCards(built);
      el('ss-tl').style.height = Math.max(TL_HEIGHT, used + 40) + 'px';
    }
    relayout();
    window.addEventListener('load', relayout);

    fetch(RT_TEMP).then(function (r) { return r.json(); })
      .then(renderLive).catch(liveFailed);

    fetchJSON('/data/sustainable-singapore.json').then(function (baked) {
      var berkeley = baked.berkeley.series;
      var state = { changi: baked.changi.series, land: baked.land.series, live: false };

      function paint() {
        drawLand(state.land);
        drawTemp(berkeley, state.changi);
        var lastT = state.changi[state.changi.length - 1];
        var lastL = state.land[state.land.length - 1];
        el('ss-tl-note').innerHTML =
          '<strong>Reading the tracks.</strong> Land area (SingStat/SLA) runs 1960–' +
          lastL[0] + ', from 581.5 to ' + lastL[1] + ' km². The faint gray ' +
          'temperature line is Berkeley Earth’s regional reconstruction for Singapore ' +
          '(1900–2020); the red line is the official Changi station annual mean ' +
          '(1982–' + lastT[0] + ', latest ' + lastT[1].toFixed(1) + ' °C). ' +
          'The roughly 0.4 °C offset between them is a baseline difference, not a ' +
          'disagreement about direction — see the note below on why they are drawn ' +
          'separately. ' +
          (state.live
            ? '<em>These series were refreshed live from data.gov.sg when you loaded this page.</em>'
            : '<em>Showing the last saved copy of the data; the live refresh did not complete.</em>');
      }

      paint();

      Promise.all([
        liveTemps().catch(function () { return null; }),
        liveLand().catch(function () { return null; })
      ]).then(function (res) {
        var gotT = res[0] && res[0].length, gotL = res[1] && res[1].length;
        if (gotT) { state.changi = res[0]; }
        if (gotL) { state.land = res[1]; }
        if (gotT || gotL) { state.live = true; paint(); }
      });

      var t;
      window.addEventListener('resize', function () {
        clearTimeout(t);
        t = setTimeout(function () {
          relayout();
          drawLand(state.land);
          drawTemp(berkeley, state.changi);
        }, 200);
      });
    }).catch(function () {
      el('ss-tl-note').textContent = 'Chart data could not be loaded.';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
