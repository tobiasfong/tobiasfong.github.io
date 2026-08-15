/* ============================================================
   Sustainable Singapore — timeline + live data
   ------------------------------------------------------------
   Everything runs client-side. Data comes from data.gov.sg's
   public APIs (no key, CORS-open), with a baked-in JSON fallback
   at /data/sustainable-singapore.json so the page still renders
   correctly if an API is down or the visitor is offline.

   Live endpoints used:
     • real-time air temperature (NEA station network)
     • datastore_search for five MSS/Changi temperature series
       (mean, mean daily max/min, absolute extreme max/min) and
       the annual land-area series
   NOTE: the newer poll-download API hands back a signed S3 URL,
   and that S3 object sends no CORS headers — a browser fetch of
   it is blocked. datastore_search is the endpoint that works
   from a page. Don't "modernise" this to poll-download.
   ============================================================ */
(function () {
  'use strict';

  var DS = 'https://data.gov.sg/api/action/datastore_search?resource_id=';
  var ID_TEMP = 'd_755290a24afe70c8f9e8bcbf9f251573';   // monthly mean, Changi, 1982-
  var ID_TMAX = 'd_8e72ca09d5000b490126e3cd492f942b';   // annual mean daily maximum
  var ID_TMIN = 'd_be96fc5a86b96f228efd7addaf7e61a8';   // annual mean daily minimum
  var ID_XMAX = 'd_72a4d7402d4014f1999a009864f64a11';   // monthly absolute extreme max
  var ID_XMIN = 'd_3b4b0418948847eaca93546f7574e365';   // monthly absolute extreme min
  var ID_LAND = 'd_0b2c034da121ef8efc71949af1694b4d';   // total land area, Dec, 1960-
  var RT_TEMP = 'https://api-open.data.gov.sg/v2/real-time/api/air-temperature';

  var YEAR_MIN = 1900, YEAR_MAX = 2026;
  var PX_PER_YEAR = 30;
  var TL_HEIGHT = (YEAR_MAX - YEAR_MIN) * PX_PER_YEAR;

  var LAND_LO = 570,  LAND_HI = 755;    // km² axis for the land track

  /* The six temperature series, in draw order (back to front) and in legend
     order (hottest at the top, coldest at the bottom, means in the middle —
     which is also how they stack on the chart).

     Both means are gray so the eye reads them as one story told twice; the
     day/night envelope is red above and blue below. Dark = the single most
     extreme reading of the year, medium = the average of the daily extremes.

     `on` is the DEFAULT visibility, not the current state — the current state
     lives on the checkboxes. The two absolute extremes start off: switching
     them on widens the axis from ~8 °C to ~13 °C, which flattens every line's
     trend, and that trade should be the reader's choice rather than the
     page's opening move. */
  var SERIES = [
    { key: 'absmax',   color: '#7A0B1E', width: 1.1, opacity: 0.8,  on: false,
      legend: 0, tipColor: '#E04A5E', name: 'Hottest of year', tip: 'Hottest' },
    { key: 'meanmax',  color: '#C8102E', width: 1.6, opacity: 0.9,  on: true,
      legend: 2, tipColor: '#FF8095', name: 'Mean daily max',  tip: 'Daily max' },
    { key: 'berkeley', color: '#0a0a0a', width: 1.2, opacity: 0.35, on: true,
      legend: 4, tipColor: 'rgba(255,255,255,0.55)', name: 'Berkeley mean',   tip: 'Berkeley' },
    { key: 'changi',   color: '#4A4A4A', width: 1.8, opacity: 0.95, on: true,
      legend: 5, tipColor: '#D0D0D0', name: 'Changi mean',     tip: 'Changi mean' },
    { key: 'meanmin',  color: '#2E6FC8', width: 1.6, opacity: 0.9,  on: true,
      legend: 3, tipColor: '#7FB3FF', name: 'Mean daily min',  tip: 'Daily min' },
    { key: 'absmin',   color: '#123A75', width: 1.1, opacity: 0.8,  on: false,
      legend: 1, tipColor: '#4A82D8', name: 'Coldest of year', tip: 'Coldest' }
  ];
  var visible = {};
  SERIES.forEach(function (s) { visible[s.key] = s.on; });

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
      body: 'Toa Payoh is literally “big swamp” in Hokkien, and that was what it was before 1962.[^9] In the 19th century, the forests were replaced by gambier and pepper plantations, which in turn gave rise to kampongs.[^10] By 1960, 3,000 families resided there, and though HDB first announced the construction of Toa Payoh Town in the 1960s and expected it to be built by 1965, there were delays. After resisting for two years, squatters finally moved out of the site in 1962, allowing HDB to build it during the second five-year program between 1966 and 1970.[^11] According to the RememberingHDBEstates blog, 95,000 people moved into around 18,000 units in the new flats by 1970.[^12]'
    },
    {
      year: 1963, label: '16 June 1963',
      title: 'Greening Singapore begins',
      body: 'Also known as the Tree Planting Campaign, it was kickstarted by founding Prime Minister Lee Kuan Yew, who planted a Mempat tree at Farrer Circus.[^16] The campaign aspired to plant 10,000 new trees annually, with the Garden City program introduced in 1967 that eventually led to Singapore’s reputation as one.[^17]</p><p>The aim was to raise awareness of the importance of trees in the environment, and thanks to their ability to enhance climate resilience, they have never been more necessary as global temperatures continue to rise.'
    },
    {
      year: 1966, label: 'From 1966',
      title: 'East Coast: The Great Reclamation',
      img: 'reclamation.jpg',
      body: 'The East Coast Reclamation, known as the Great Reclamation, began officially in 1966 and continued for three decades over seven phases. Adding 1,525 hectares of land along the southeastern coast, the project stretched across Bedok, Tanjong Rhu, Queen Elizabeth Walk, Tanah Merah Besar, Telok Ayer Basin, a massive lagoon, Marina Centre, Marina East and Marina South (with the last three forming the 660-hectare Marina City, later named Marina Bay).[^13]</p><p>The total cost was $613 million.[^13]'
    },
    {
      year: 1968, label: '1959–1969',
      title: 'Jurong: From swamp to industrial estate',
      body: 'In 1959, an estimated 200,000 people, which made up 14% of the population then, were jobless. Singapore’s then minister of finance, Dr. Goh Keng Swee, launched an ambitious plan to transform a crocodile-infested swamp into an industrial estate. His gamble paid off. By 1969, Jurong Industrial Estate housed 181 factories and a 20,000-strong workforce, and 16,000 people lived in HDB-constructed flats and shophouses.[^14]'
    },
    {
      year: 1971, label: '8 November 1971',
      title: 'The first Tree Planting Day',
      body: 'Dr. Goh planted a rain tree sapling on the summit of Mount Faber, marking the start of an annual ritual. In the same day, about 8,400 trees and 21,677 shrubs and creepers were planted across Singapore by students, Singapore Armed Forces, ministers and members of Parliament. Tree Planting Day has been held every year since.[^18]</p><p>Earlier, during the Garden City campaign introduced on 11 May 1967, “instant trees” such as the angsana, rain tree, sea apple and curtain creeper were planted intensively to produce results as quickly as possible. Later, the yellow flame, frangipani and bougainvillea were added. In the 1970s, then Prime Minister Lee led mass tree planting activities on newly reclaimed land such as East Coast Park and Marina South, putting in tembusu, eugenia, tamarind and sea putat. Fruit trees became the focus in the 1980s, chosen for their sturdiness — they had to survive vandalism and pilfering before the more delicate ones could follow. These included rambutan, coconut, mangosteen, jambu ayer, mango, jackfruit, jujube, langsat, kedondong, binjai and kundang.[^18]'
    },
    {
      year: 1975, label: 'From 1975',
      title: 'Changi taking flight',
      body: 'The Port of Singapore Authority, now known as Maritime and Port Authority of Singapore, began reclaiming 745 hectares of land along Changi coast for the construction of Changi Airport, with the fill material acquired from the adjoining seabed.[^13]'
    },
    {
      year: 1980, label: '1970s–1980s',
      title: 'The Wild West',
      body: 'Jurong Town Corporation added over 2,000 hectares of reclaimed land to Jurong and Tuas to expand the western industrial estate and for the construction of shipyards to support the marine sector. In the late 1980s, Tuas grew by another 650 hectares, and to inject some greenery to an otherwise industrial area, they decided to build a golf course and a park there.</p><p>JTC also enlarged Pulau Bukom and Pulau Busing, and merged Pulau Ayer Merbau, Pulau Seraya and Pulau Sakra with surrounding islets into new land that was primarily used for the petrochemical industry.[^13]'
    },
    {
      year: 1990, label: '1990–2004',
      title: 'Changi grows colossal',
      body: 'In 1990, another massive reclamation was carried out for both the expansion of Changi Airport and other developments in the area. But Changi’s growth did not stop there. Between 1992 and 2004, over 2,000 hectares of land at Changi East were reclaimed, 820 of which were set aside for a fourth terminal and a third runway. 125 hectares were given over to Changi Naval Base, while 639 hectares were reserved for industries.[^13]'
    },
    {
      year: 1993, label: '1993–2003',
      title: 'Jurong Island, merge for the kill',
      body: 'In 1993, JTC merged seven southwestern islands – Pulau Merlimau, Pulau Ayer Chawan, Pulau Ayer Merbau, Pulau Seraya, Pulau Sakra, Pulau Pesek and Pulau Pesek Kecil – into Jurong Island, which cost $6 billion. When completed a decade later, 3,000 hectares of reclaimed land were available as industrial space, and more than 100 petroleum, petrochemical and specialty chemical companies wasted no time occupying Jurong Island.[^13]'
    },
    {
      year: 1997, label: '1997 onward',
      title: 'High-rise island gives rise to rising temperatures',
      img: 'heat-island.jpg',
      body: 'The ten warmest years in Singapore’s record all fall on and after 1997. The average mean was 28.4 °C in 2016, 2019 and 2024, 28.3 °C in 1998, 28.2 °C in 1997, 2015 and 2023, and 28.1 °C in 2002, 2010 and 2025.[^1] By now, Singapore is one of the most dense urban nations in the world, which exacerbates the Urban Heat Island effect. Caused by heat both trapped by buildings and generated from human activities, the difference between temperatures in highly urbanized Orchard Road and open natural Lim Chu Kang reaches up to 4 °C, despite the two neighborhoods being only 30 minutes apart.[^20]</p><p>Depending on material, such as black aluminum facade, a narrow space between concrete buildings and road can see temperatures rise up to 2.5 °C.[^21]'
    },
    {
      year: 2008, label: '2000s',
      title: 'Marina Bay: a downtown on made ground',
      img: 'marina-bay.jpg',
      body: 'The land beneath Marina Bay was reclaimed from the 1970s onward as part of the East Coast program; the Barrage closes the river mouth in 2008.[^13] Between 1999 and 2000 alone the national land area jumps from 659.9 to 682.7 km² — the single largest one-year gain in the series.[^5]'
    },
    {
      year: 2020, label: '2020–2030',
      title: 'OneMillionTrees and the Green Plan',
      img: 'green-future.jpg',
      body: 'NParks sets out to plant a million more trees under the Singapore Green Plan 2030, now expected to hit target by the end of 2027.[^19] Sixty years after the mempat tree at Farrer Circus, the policy instrument is recognizably the same one — only now it is explicitly framed as heat mitigation.'
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

  /* MSS publishes mean daily max/min already aggregated to the year, so these
     are read straight off. */
  function liveAnnual(id, field) {
    return fetchJSON(DS + id + '&limit=200').then(function (j) {
      var out = [];
      j.result.records.forEach(function (r) {
        var y = parseInt(r.year, 10), v = parseFloat(r[field]);
        if (!isNaN(y) && !isNaN(v)) { out.push([y, Math.round(v * 100) / 100]); }
      });
      return out.sort(function (a, b) { return a[0] - b[0]; });
    });
  }

  /* The absolute extremes are only published monthly, so the annual figure is
     derived here — the hottest of the twelve monthly highs, the coldest of the
     twelve monthly lows. Complete years only, same rule as the annual mean, so
     a part-finished year can't masquerade as a record. */
  function liveMonthlyExtreme(id, field, pick) {
    return fetchJSON(DS + id + '&limit=2000').then(function (j) {
      var byYear = {};
      j.result.records.forEach(function (r) {
        var m = r.month, v = parseFloat(r[field]);
        if (!m || isNaN(v)) { return; }
        var y = parseInt(m.slice(0, 4), 10);
        (byYear[y] = byYear[y] || []).push(v);
      });
      var out = [];
      Object.keys(byYear).forEach(function (y) {
        var a = byYear[y];
        if (a.length === 12) { out.push([parseInt(y, 10), pick.apply(Math, a)]); }
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

  /* ── Legend, which is also the toggle ────────────────────────
     Built from SERIES rather than written into the HTML, so the colours,
     labels and draw order have exactly one definition. It lives in the sticky
     header because the chart is nearly four thousand pixels tall — a control
     that scrolled away would be useless for most of the reading. */
  function buildLegend(onChange) {
    var host = el('ss-legend');
    if (!host) { return; }
    host.innerHTML = '';
    // Laid out in pairs — extremes, daily means, annual means — which is not
    // the draw order, hence the separate index.
    SERIES.slice().sort(function (a, b) { return a.legend - b.legend; })
      .forEach(function (def) {
      var lab = document.createElement('label');
      var box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = visible[def.key];
      lab.className = box.checked ? '' : 'ss-off';
      box.addEventListener('change', function () {
        visible[def.key] = box.checked;
        lab.className = box.checked ? '' : 'ss-off';
        onChange();
      });
      var sw = document.createElement('i');
      sw.className = 'ss-sw';
      sw.style.borderTopColor = def.color;
      // Berkeley is drawn at 35% opacity; the swatch has to match or it reads
      // as a different, darker series than the one on the chart.
      sw.style.opacity = def.opacity;
      lab.appendChild(box);
      lab.appendChild(sw);
      lab.appendChild(document.createTextNode(def.name));
      host.appendChild(lab);
    });
  }

  /* ── Hover readout for the temperature chart ─────────────── */
  var hoverState = null;   // refreshed by every drawTemp; listeners bound once

  function attachTempHover(svg, data, x, w, h) {
    hoverState = { data: data, x: x, w: w, h: h };

    var layer = svgNode('g', { 'pointer-events': 'none' });
    svg.appendChild(layer);
    hoverState.layer = layer;

    var tip = el('ss-tip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'ss-tip';
      tip.className = 'ss-tip';
      tip.setAttribute('role', 'status');
      document.body.appendChild(tip);
    }

    function nearest(series, year) {
      if (!series || !series.length) { return null; }
      var best = null, bd = Infinity;
      for (var i = 0; i < series.length; i++) {
        var d = Math.abs(series[i][0] - year);
        if (d < bd) { bd = d; best = series[i]; }
      }
      return bd <= 1 ? best : null;   // don't report a value years away
    }

    if (svg.dataset.hoverBound) { return; }
    svg.dataset.hoverBound = '1';

    svg.addEventListener('mousemove', function (ev) {
      var s = hoverState;
      if (!s) { return; }
      var r = svg.getBoundingClientRect();
      if (!r.height) { return; }
      var sy = (ev.clientY - r.top) * (s.h / r.height);
      var year = Math.round(YEAR_MIN + sy / PX_PER_YEAR);

      // Report every series that is switched ON and actually has a reading at
      // this year — so the readout always matches what is drawn. Before 1982
      // that is Berkeley alone, however many series are enabled.
      var hits = [];
      SERIES.forEach(function (def) {
        if (!visible[def.key]) { return; }
        var p = nearest(s.data[def.key], year);
        if (p) { hits.push({ def: def, pt: p }); }
      });
      while (s.layer.firstChild) { s.layer.removeChild(s.layer.firstChild); }
      if (!hits.length) { tip.style.display = 'none'; return; }

      var gy = yFor(year);
      s.layer.appendChild(svgNode('line', {
        x1: 0, y1: gy, x2: s.w, y2: gy,
        stroke: 'rgba(0,0,0,0.35)', 'stroke-width': 1, 'stroke-dasharray': '3 3'
      }));
      var rows = '<strong>' + year + '</strong>';
      hits.forEach(function (hit) {
        s.layer.appendChild(svgNode('circle', {
          cx: s.x(hit.pt[1]), cy: yFor(hit.pt[0]), r: 3.5,
          fill: '#fff', stroke: hit.def.color, 'stroke-width': 1.5
        }));
        rows += '<span><i class="ss-tip-sw" style="border-top-color:' + hit.def.tipColor +
          '"></i>' + hit.def.tip + ' ' + hit.pt[1].toFixed(1) + '&nbsp;°C</span>';
      });
      tip.innerHTML = rows;
      tip.style.display = 'block';
      // Keep the tip on screen: flip to the left of the pointer near the edge.
      var tw = tip.offsetWidth;
      var left = ev.clientX + 16;
      if (left + tw > window.innerWidth - 8) { left = ev.clientX - tw - 16; }
      tip.style.left = left + 'px';
      tip.style.top = Math.max(8, ev.clientY - 12) + 'px';
    });

    svg.addEventListener('mouseleave', function () {
      tip.style.display = 'none';
      if (hoverState && hoverState.layer) {
        while (hoverState.layer.firstChild) {
          hoverState.layer.removeChild(hoverState.layer.firstChild);
        }
      }
    });
  }

  /* The °C axis is not fixed. It spans whatever is switched on, so the mean
     lines keep the tight scale that makes their rise legible until the reader
     asks for the day/night envelope, at which point it zooms out to fit.
     Snapped to half-degrees so the gridline labels stay round. */
  function tempExtent(data) {
    var lo = Infinity, hi = -Infinity;
    SERIES.forEach(function (def) {
      if (!visible[def.key]) { return; }
      var arr = data[def.key];
      if (!arr || !arr.length) { return; }
      arr.forEach(function (p) {
        if (p[1] < lo) { lo = p[1]; }
        if (p[1] > hi) { hi = p[1]; }
      });
    });
    if (lo === Infinity) { return [25.6, 29.2]; }   // nothing visible
    var pad = Math.max(0.3, (hi - lo) * 0.08);
    return [Math.floor((lo - pad) * 2) / 2, Math.ceil((hi + pad) * 2) / 2];
  }

  function drawTemp(data) {
    var svg = el('ss-svg-temp');
    var w = svg.parentNode.clientWidth, h = TL_HEIGHT;
    if (!w) {
      // The grid column has no width yet. Returning silently here is exactly
      // how the chart came up empty on a cold load — the axis cannot be scaled
      // into zero space, so nothing was drawn and nothing said so. Retry on the
      // next frame instead, bounded so a genuinely hidden column (mobile, where
      // this column is display:none) doesn't spin forever.
      drawTemp.tries = (drawTemp.tries || 0) + 1;
      if (drawTemp.tries < 60) {
        requestAnimationFrame(function () { drawTemp(data); });
      }
      return;
    }
    drawTemp.tries = 0;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('height', h);
    while (svg.firstChild) { svg.removeChild(svg.firstChild); }

    var ext = tempExtent(data), lo = ext[0], hi = ext[1];
    var x = function (t) { return ((t - lo) / (hi - lo)) * w; };

    // Gridline spacing follows the span, so a 3.6 °C axis and a 13 °C one both
    // land on four to six labelled lines instead of two or twenty.
    var span = hi - lo;
    var step = span <= 5 ? 1 : (span <= 9 ? 2 : 3);
    var ticks = [];
    for (var tv = Math.ceil(lo / step) * step; tv < hi; tv += step) { ticks.push(tv); }

    ticks.forEach(function (t) {
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

    function line(series, stroke, width, opacity) {
      if (!series || !series.length) { return; }
      svg.appendChild(svgNode('polyline', {
        points: series.map(function (p) { return x(p[1]) + ',' + yFor(p[0]); }).join(' '),
        fill: 'none', stroke: stroke, 'stroke-width': width,
        'stroke-opacity': opacity, 'stroke-linejoin': 'round'
      }));
    }

    // Label where each series starts and stops, on the chart itself. A reader
    // scrolling the timeline meets the red line appearing out of nowhere at
    // 1982 thousands of pixels before reaching the explanation below, so the
    // explanation has to be here too. Years come from the data, not hardcoded,
    // because both series refresh live.
    function annotate(year, text) {
      var ay = yFor(year);
      svg.appendChild(svgNode('line', {
        x1: 0, y1: ay, x2: w, y2: ay,
        stroke: 'rgba(0,0,0,0.30)', 'stroke-width': 1, 'stroke-dasharray': '2 3'
      }));
      var lab = svgNode('text', { x: 3, y: ay - 5, 'font-size': 9, fill: '#777' });
      lab.textContent = text;
      svg.appendChild(lab);
    }
    if (data.changi && data.changi.length) {
      annotate(data.changi[0][0], 'Changi station record begins');
    }
    if (visible.berkeley && data.berkeley && data.berkeley.length) {
      annotate(data.berkeley[data.berkeley.length - 1][0], 'Berkeley Earth series ends');
    }

    // Back to front, so the two means land on top of the envelope rather than
    // under it. SERIES is already ordered that way.
    SERIES.forEach(function (def) {
      if (visible[def.key]) {
        line(data[def.key], def.color, def.width, def.opacity);
      }
    });

    // Hover readout. The chart is ~4000px tall and only 250px wide, so reading
    // a value off it by eye is guesswork; this gives the exact year and every
    // visible series' reading. Hit-testing is by YEAR (the vertical axis)
    // rather than by distance to a line, so the pointer doesn't have to land on
    // 1.2px of stroke — anywhere in the column at that height works.
    attachTempHover(svg, data, x, w, h);

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
    // Only the annual mean gets an end label. Every series ends in the same
    // year, so labelling all six would stack six texts on one baseline.
    if (visible.changi && data.changi && data.changi.length) {
      var lastC = data.changi[data.changi.length - 1];
      tag(data.changi, 'Changi ' + lastC[1].toFixed(1) + '°', '#4A4A4A');
    }
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
    // The hero video autoplays muted and looping because it is decorative, but
    // anyone who has asked their OS for reduced motion gets the poster frame
    // instead. Can't be done in CSS — autoplay has to be revoked in script.
    var hero = el('ss-hero-vid');
    if (hero && window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      hero.removeAttribute('autoplay');
      hero.pause();
      hero.currentTime = 0;
    }
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
      var temp = {};
      SERIES.forEach(function (def) {
        temp[def.key] = (baked[def.key] && baked[def.key].series) || [];
      });
      var state = { temp: temp, land: baked.land.series, live: false };

      buildLegend(function () { drawTemp(state.temp); });

      function paint() {
        drawLand(state.land);
        drawTemp(state.temp);
        var mean = state.temp.changi, lastT = mean[mean.length - 1];
        var lastL = state.land[state.land.length - 1];
        var mx = state.temp.meanmax, mn = state.temp.meanmin;
        el('ss-tl-note').innerHTML =
          '<strong>Reading the tracks.</strong> Land area (SingStat/SLA) runs 1960–' +
          lastL[0] + ', from 581.5 to ' + lastL[1] + ' km². The two gray ' +
          'temperature lines are annual means: Berkeley Earth’s regional reconstruction ' +
          'for Singapore (1900–2020), and the official Changi station record ' +
          '(1982–' + lastT[0] + ', latest ' + lastT[1].toFixed(1) + ' °C). ' +
          'The roughly 0.4 °C offset between them is a baseline difference, not a ' +
          'disagreement about direction — see the note below on why they are drawn ' +
          'separately. Red is the daytime side of the day and blue the night: at Changi ' +
          'in ' + lastT[0] + ' the mean daily maximum was ' +
          (mx.length ? mx[mx.length - 1][1].toFixed(1) : '—') + ' °C and the mean ' +
          'daily minimum ' + (mn.length ? mn[mn.length - 1][1].toFixed(1) : '—') + ' °C. ' +
          'The checkboxes above also add the hottest and coldest single readings of ' +
          'each year; switching those on widens the scale, so every line looks flatter. ' +
          (state.live
            ? '<em>These series were refreshed live from data.gov.sg when you loaded this page.</em>'
            : '<em>Showing the last saved copy of the data; the live refresh did not complete.</em>');
      }

      paint();

      // Repaint once layout has settled. This CANNOT be a bare window 'load'
      // listener: paint() runs inside a fetch callback, and that fetch often
      // resolves AFTER load has already fired — in which case the listener is
      // attached to an event that will never come again, and the chart stays
      // empty. So repaint on the next frame regardless, and only also listen
      // for load if it genuinely hasn't happened yet.
      function repaint() { relayout(); paint(); }
      requestAnimationFrame(repaint);
      if (document.readyState !== 'complete') {
        window.addEventListener('load', repaint);
      }

      // Six requests, each independently optional. Any one that fails leaves
      // that series on its baked copy rather than blanking the chart, which is
      // why every promise is caught individually instead of as a group.
      function opt(p) { return p.catch(function () { return null; }); }
      Promise.all([
        opt(liveTemps()),
        opt(liveLand()),
        opt(liveAnnual(ID_TMAX, 'temp_mean_daily_max')),
        opt(liveAnnual(ID_TMIN, 'temp_mean_daily_min')),
        opt(liveMonthlyExtreme(ID_XMAX, 'max_temperature', Math.max)),
        opt(liveMonthlyExtreme(ID_XMIN, 'temp_extremes_min', Math.min))
      ]).then(function (res) {
        var got = false;
        function take(i, key) {
          if (res[i] && res[i].length) { state.temp[key] = res[i]; got = true; }
        }
        take(0, 'changi');
        take(2, 'meanmax');
        take(3, 'meanmin');
        take(4, 'absmax');
        take(5, 'absmin');
        if (res[1] && res[1].length) { state.land = res[1]; got = true; }
        if (got) { state.live = true; paint(); }
      });

      var t;
      window.addEventListener('resize', function () {
        clearTimeout(t);
        t = setTimeout(function () {
          relayout();
          drawLand(state.land);
          drawTemp(state.temp);
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
