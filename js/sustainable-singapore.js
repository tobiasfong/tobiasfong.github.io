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
   from a page. Don't "modernize" this to poll-download.
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

  // Round to one decimal, half UP, without the float artifact that makes
  // (28.15).toFixed(1) come back as "28.1": 28.15 has no exact binary
  // representation and the nearest double falls just short of it. The nudge
  // is far below the 0.01 these series are stored at, so it moves nothing
  // except values sitting exactly on the rounding boundary.
  function d1(v) { return (Math.round(v * 10 + 1e-9) / 10).toFixed(1); }

  /* ── Stat count-up ───────────────────────────────────
     Runs once, when the row first scrolls into view — not at load, or it would
     have finished before anyone saw it. The final value is already in the HTML,
     so with JS off, or IntersectionObserver missing, or reduced motion asked
     for, the reader still gets the number. */
  function countUp() {
    var nums = [].slice.call(document.querySelectorAll('.ss-stat-num'));
    if (!nums.length) { return; }
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still || !window.IntersectionObserver) { return; }

    function run(node) {
      var to = parseFloat(node.getAttribute('data-to'));
      var dp = parseInt(node.getAttribute('data-dp'), 10) || 0;
      var prefix = node.getAttribute('data-prefix') || '';
      var unit = node.querySelector('.ss-stat-unit');
      var unitHTML = unit ? unit.outerHTML : '';
      var from = dp ? 0.01 : 1;          // start just off zero, as asked
      var start = null, DUR = 1100;
      function frame(t) {
        if (start === null) { start = t; }
        var p = Math.min(1, (t - start) / DUR);
        // ease-out cubic: quick off the mark, settles onto the true figure
        var v = from + (to - from) * (1 - Math.pow(1 - p, 3));
        node.innerHTML = prefix + v.toFixed(dp) + unitHTML;
        if (p < 1) { requestAnimationFrame(frame); }
      }
      requestAnimationFrame(frame);
    }

    var seen = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting || seen.has(e.target)) { return; }
        seen.add(e.target);
        run(e.target);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { io.observe(n); });
  }

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
      body: 'Singapore was home to myriad ecosystems and coastal habitats, much of which has been cleared since then. Even as far back as 1820, mangrove swamps made up about 13% of Singapore’s fringe areas, only to fall to less than 0.5% of our land area in 2010.[^17] In 1819, Singapore had around 7,500 hectares covered in mangrove forests, but by 1883, most mangrove areas had deteriorated because of overexploitation. Though reclamation of mangrove areas began as early as 1822, it didn’t become significant until the 1960s (see below).[^44]'
    },
    {
      year: 1935, label: '1935',
      title: 'Need a rubber?',
      img: 'rubber-plantation.jpg',
      body: 'In the first half of the 20th century, rubber had the greatest impact on Singapore’s landscape when introduced on a commercial scale in 1903, occupying 12,000 hectares in 1911 before reaching a peak of 22,500 hectares in 1935, almost 40% of our total land area then. Sadly, after 1935, the rubber industry never bounced back.[^44]'
    },
    {
      year: 1960, label: '1 February 1960',
      title: 'The Housing and Development Board is formed',
      img: 'hdb-flats.jpg',
      body: 'HDB succeeded the colonial government’s Singapore Improvement Trust, and set about solving the housing problems that arose as the island’s population grew rapidly, especially for low-income groups. By 1965, HDB completed its first five-year program, building over 50,000 units.[^6] Three seven-story blocks at Stirling Road, Queenstown, were among the first completed in October 1960.[^7]'
    },
    {
      year: 1961, label: '25 May 1961',
      title: 'The Bukit Ho Swee fire',
      img: 'bukit-ho-swee.jpg',
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
      img: 'tree-planting-1963.jpg',
      body: 'Also known as the Tree Planting Campaign, it was kickstarted by founding Prime Minister Lee Kuan Yew, who planted a Mempat tree at Farrer Circus.[^18] The campaign aspired to plant 10,000 new trees annually, with the Garden City program introduced in 1967 that eventually led to Singapore’s reputation as one.[^19]</p><p>The aim was to raise awareness of the importance of trees in the environment, and thanks to their ability to enhance climate resilience, they have never been more necessary as global temperatures continue to rise.'
    },
    {
      year: 1963, label: '1963',
      title: 'Lining up the Jurong railway line',
      img: 'jurong-railway-1963.jpg',
      body: 'Based on an EIA Report commissioned by NParks on behalf of HDB, the area that is now Maju Forest, next to Clementi Park, was most likely covered in rubber plantations in 1914. It was still predominantly grassland in 1950, though in 1963, the Jurong railway line was built across it, opening in 1965 and linking to the Keretapi Tanah Melayu railway that passed through Clementi Forest, which linked to Malaysia. By 1978, the area was a combination of the Jurong railway line, buildings in western low-density settlements, and abandoned land forest. After the Jurong railway line was decommissioned during the 1990s due to low usage after Singapore’s independence, it became overgrown with vegetation.[^43]'
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
      img: 'jurong-estate.jpg',
      body: 'In 1959, an estimated 200,000 people, which made up 14% of the population then, were jobless. Singapore’s then minister of finance, Dr. Goh Keng Swee, launched an ambitious plan to transform a crocodile-infested swamp into an industrial estate. His gamble paid off. By 1969, Jurong Industrial Estate housed 181 factories and a 20,000-strong workforce, and 16,000 people lived in HDB-constructed flats and shophouses.[^14]'
    },
    {
      year: 1971, label: '8 November 1971',
      title: 'The first Tree Planting Day',
      img: 'mount-faber-1971.jpg',
      body: 'Dr. Goh planted a rain tree sapling on the summit of Mount Faber, marking the start of an annual ritual. In the same day, about 8,400 trees and 21,677 shrubs and creepers were planted across Singapore by students, Singapore Armed Forces, ministers and members of Parliament. Tree Planting Day has been held every year since.[^20]</p><p>Earlier, during the Garden City campaign introduced on 11 May 1967, “instant trees” such as the angsana, rain tree, sea apple and curtain creeper were planted intensively to produce results as quickly as possible. Later, the yellow flame, frangipani and bougainvillea were added. In the 1970s, as then Prime Minister Lee led mass tree planting activities on newly reclaimed land, such as East Coast Park and Marina South, tembusu, eugenia, tamarind and sea putat were planted during the first decade. In the following decade, Lee switched the focus to fruit trees for their sturdiness. These included rambutan, coconut, mangosteen, <em>jambu ayer</em>, mango, jackfruit, jujube, <em>langsat</em>, <em>kedondong</em>, <em>binjai</em> and <em>kundang</em>.[^20]'
    },
    {
      year: 1975, label: 'From 1975',
      title: 'Changi taking flight',
      img: 'changi-1980s.jpg',
      body: 'The Port of Singapore Authority, now known as Maritime and Port Authority of Singapore, began reclaiming 745 hectares of land along Changi coast for the construction of Changi Airport, with the fill material acquired from the adjoining seabed.[^13]'
    },
    {
      year: 1980, label: '1970s–1980s',
      title: 'The Wild West',
      img: 'tuas-golf.jpg',
      body: 'Jurong Town Corporation added over 2,000 hectares of reclaimed land to Jurong and Tuas to expand the western industrial estate and for the construction of shipyards to support the marine sector. In the late 1980s, Tuas grew by another 650 hectares, and to inject some greenery to an otherwise industrial area, they decided to build a golf course and a park there.</p><p>JTC also enlarged Pulau Bukom and Pulau Busing, and merged Pulau Ayer Merbau, Pulau Seraya and Pulau Sakra with surrounding islets into new land that was primarily used for the petrochemical industry.[^13]'
    },
    {
      year: 1990, label: '1990–2004',
      title: 'Changi grows colossal',
      img: 'changi-modern.jpg',
      body: 'In 1990, another massive reclamation was carried out for both the expansion of Changi Airport and other developments in the area. But Changi’s growth did not stop there. Between 1992 and 2004, over 2,000 hectares of land at Changi East were reclaimed, 820 of which were set aside for a fourth terminal and a third runway. 125 hectares were given over to Changi Naval Base, while 639 hectares were reserved for industries.[^13]'
    },
    {
      year: 1990, label: '1990',
      title: 'A hill to climb when protecting nature reserves',
      img: 'bukit-timah.jpg',
      body: 'Singapore’s primary rainforest is confined to the Bukit Timah Nature Reserve, which is about 71 hectares, while various scattered forests only add up to 50 hectares in the adjacent water catchment area, which includes 15 hectares of freshwater swamp forest in Nee Soon. Only a few hundred hectares of mangrove survives in scattered spaces, while coastal forests have virtually vanished from the face of Singapore. As Singapore is increasingly urbanized, urban-rural evening temperatures reach differences of 5 °C or more sometimes.[^44]'
    },
    {
      year: 1993, label: '1993–2003',
      title: 'Jurong Island, merge for the kill',
      img: 'jurong-island.jpg',
      body: 'In 1993, JTC merged seven southwestern islands – Pulau Merlimau, Pulau Ayer Chawan, Pulau Ayer Merbau, Pulau Seraya, Pulau Sakra, Pulau Pesek and Pulau Pesek Kecil – into Jurong Island, which cost $6 billion. When completed a decade later, 3,000 hectares of reclaimed land were available as industrial space, and more than 100 petroleum, petrochemical and specialty chemical companies wasted no time occupying Jurong Island.[^13]'
    },
    {
      year: 1997, label: '1997 onward',
      title: 'High-rise island gives rise to rising temperatures',
      img: 'heat-island.jpg',
      body: 'The ten warmest years in Singapore’s record all fall on and after 1997,[^1] which was the year of one of the most powerful El Niño events in recorded history. The average mean was 28.4 °C in 2016, 2019 and 2024, 28.3 °C in 1997, 1998 and 2015, 28.2 °C in 2023, and 28.1 °C in 2002, 2010 and 2025.[^2] By now, Singapore is one of the most dense urban nations in the world, which exacerbates the Urban Heat Island effect. Caused by heat both trapped by buildings and generated from human activities, the difference between temperatures in highly urbanized Orchard Road and open natural Lim Chu Kang reaches up to 4 °C, despite the two neighborhoods being only 30 minutes apart.[^23]</p><p>Depending on material, such as black aluminum facade, a narrow space between concrete buildings and road can see temperatures rise up to 2.5 °C.[^24]'
    },
    {
      year: 2008, label: '2000s',
      title: 'Marina Bay’s Barrage of Skyscrapers',
      img: 'marina-bay.jpg',
      body: 'After the initial reclamation around Marina Bay that began in 1977, the first skyscrapers were constructed in the 21st century.[^13] An expansion of the city center that includes the iconic ship-roof Marina Bay Sands, one of Singapore’s only two casinos, and high-rise luxury apartments, Marina Bay is also home to a dam, Marina Barrage, which officially opened on 31 October 2008.[^15]</p><p>Amidst this, the national land area increased from 659.9 to 682.7 km² between 1999 and 2000, which was the largest annual increment of land in Singapore.[^5]'
    },
    {
      year: 2008, label: '2008–2021',
      title: 'Housing boom',
      img: 'condo-boom.jpg',
      body: 'HDB’s units grew by 24%,[^16] and the land area increased by 22.9 km².[^5] In the same period, condominium clusters were constructed, e.g. Pasir Ris Grove, which housed at least 4 new condominium complexes within 5 years, not counting several built elsewhere in the same neighborhood around the same time. During that stretch, 2016 and 2019 broke the record for being the hottest years.'
    },
    {
      year: 2020, label: '2020–2030',
      title: 'Green Plans One Million Trees',
      img: 'green-future.jpg',
      body: 'As part of the Singapore Green Plan 2030, the OneMillionTrees Movement aims to plant a million more trees across Singapore from 2020 to 2030. As of August 2026, 887,044 trees have been planted since.[^21] Having hit over 500,000 trees back in 2023, the National Parks Board expects to attain the target by the end of 2027.[^22]'
    },
    {
      year: 2024, label: '2024',
      title: 'A warm welcome back to Singapore',
      img: 'returnee-2024.jpg',
      body: 'The year I graduated from the University of Minnesota and returned to Singapore was also the warmest on record. With the annual mean temperature reaching 28.4 °C, tying with 2016 and 2019,[^2] it was — like 1997 — on the tail end of the 2023 El Niño event (which also saw one of the warmest winters in Minneapolis). Singapore’s land area also expanded to 735.7 km², and 744.3 km² in the following year, and it’s still growing.[^5]'
    },
    {
      year: 2026, label: 'July–August 2026',
      title: 'Majulah, Maju Forest',
      img: 'maju-forest.jpg',
      body: 'On 10 July, HDB announced that they will build new homes at Gillman Barracks and Sunset Way, and it was estimated that about 15 hectares of Maju Forest at the latter and 10 hectares of forest at the former will be cleared to make way for housing. However, this sparked a public outcry, which led the government to make adjustments. Minister of State for National Development, Alvin Tan, acknowledged the ecological concerns and conceded that while they will work to preserve more greenery, it would mean fewer homes for Singaporeans.[^40]</p><p>Over a month later, on 16 August, over 1,000 people rallied in Hong Lim Park to raise their concerns over the plans to develop Maju Forest and Gillman Barracks. Organized by SG Climate Rally, participants pointed out how clearing a forest is irreversible, and asked for more transparency and public participation in decisions over land use. They also expressed their worry over the loss of forests and natural spaces.[^41]</p><p>Despite the government’s initial plans to preserve 40% of Gillman Barracks’ forests, and 35% of Maju Forest, including forest streams and ecological networks, Singaporeans remain passionate about preserving what little green space is left in Singapore.[^41] Maju Forest’s 23 hectares is 0.23 km², about 0.15% of the approximately 150 km² of forest Singapore still has. While it only makes up about 0.03% of our total land area, we should not underestimate its importance as a conservation area, and every square meter counts in our war against climate change.</p><p>More than three decades after the old Jurong railway shut down (1990), its tracks became home to Maju Forest, a secondary forest that regenerated beside Clementi Forest and the Rail Corridor. It is home to many conservation-significant species, including the critically endangered straw-headed bulbul.[^42] Back in 2021, NParks planned to convert 4 km of the old railway into a nature trail, the Old Jurong Line Nature Trail, which would open near the end of 2026.[^43]'
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

  /* ── Card modal ─────────────────────────────────────
     Click, never hover. The timeline is ~4,000px tall, so a hover trigger
     would fire constantly while scrolling past; touch devices have no hover
     at all; and a dialog takes focus, which is hostile when the reader did
     not ask for it. */
  var modal = null, modalPrevFocus = null;

  function buildModal() {
    modal = document.createElement('div');
    modal.className = 'ss-modal';
    modal.id = 'ss-modal';
    modal.hidden = true;
    modal.innerHTML =
      '<div class="ss-modal-back" data-close></div>' +
      '<div class="ss-modal-box" role="dialog" aria-modal="true" aria-labelledby="ss-modal-title">' +
        '<button type="button" class="ss-modal-x" data-close aria-label="Close">&times;</button>' +
        '<div class="ss-modal-scroll">' +
          '<div class="ss-card-year" id="ss-modal-year"></div>' +
          '<h3 id="ss-modal-title"></h3>' +
          '<div id="ss-modal-media"></div>' +
          '<div id="ss-modal-body"></div>' +
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
    el('ss-modal-year').textContent = ev.label;
    el('ss-modal-title').textContent = ev.title;
    el('ss-modal-media').innerHTML = ev.img
      ? '<img src="/img/sustainable/' + ev.img + '" alt="' + ev.title + '" />' : '';
    el('ss-modal-body').innerHTML = '<p>' + ev.body + '</p>';
    // The body still holds raw [^N] markers, so expand them here rather than
    // at boot \u2014 this content did not exist when expandCitations first ran.
    expandCitations(el('ss-modal-body'));
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modal.querySelector('.ss-modal-x').focus();
  }

  function closeModal() {
    if (!modal || modal.hidden) { return; }
    modal.hidden = true;
    document.body.style.overflow = '';
    if (modalPrevFocus && modalPrevFocus.focus) { modalPrevFocus.focus(); }
  }

  function buildCards() {
    var host = el('ss-tl-cards');
    var overlay = svgNode('svg', {
      width: '100%', height: TL_HEIGHT,
      style: 'position:absolute;inset:0;pointer-events:none;overflow:visible'
    });
    host.appendChild(overlay);

    // The card on the page is a SUMMARY: year, title, thumbnail. The body
    // text lives in the modal. Keeping the prose out of the timeline is what
    // makes the column readable — sixteen full cards ran to 5,600px and forced
    // the later ones a long way below their true year on the axis.
    var nodes = EVENTS.map(function (ev) {
      var c = document.createElement('button');
      c.type = 'button';
      c.className = 'ss-card';
      c.setAttribute('aria-haspopup', 'dialog');
      var html = '';
      if (ev.img) {
        html += '<img src="/img/sustainable/' + ev.img + '" alt="" loading="lazy" />';
      }
      html += '<div class="ss-card-text">' +
        '<div class="ss-card-year">' + ev.label + '</div>' +
        '<h3>' + ev.title + '</h3>' +
        '<span class="ss-card-more">Read more</span></div>';
      c.innerHTML = html;
      c.addEventListener('click', function () { openModal(ev, c); });
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
     Built from SERIES rather than written into the HTML, so the colors,
     labels and draw order have exactly one definition. It lives in the sticky
     header because the chart is nearly four thousand pixels tall — a control
     that scrolled away would be useless for most of the reading. */
  function buildLegend(hostId, onChange) {
    var host = el(hostId);
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
          '"></i>' + hit.def.tip + ' ' + d1(hit.pt[1]) + '&nbsp;°C</span>';
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
    // land on four to six labeled lines instead of two or twenty.
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
    // year, so labeling all six would stack six texts on one baseline.
    if (visible.changi && data.changi && data.changi.length) {
      var lastC = data.changi[data.changi.length - 1];
      tag(data.changi, 'Changi ' + d1(lastC[1]) + '°', '#4A4A4A');
    }
  }

  // Retire the swipe hint once the reader has actually swiped. The element is
  // aria-hidden already: a screen reader gets the same information from the
  // labeled scroll region, so this is decoration for sighted touch users.
  function wireSwipeHint() {
    // The element that SCROLLS is .ss-tl-sticky-head; #ss-tl-head-scroll is
    // the grid inside it. Setting scrollLeft on the inner one does nothing,
    // which is exactly what the first version of this did.
    var grid = el('ss-tl-scroll'),
        head = document.querySelector('.ss-tl-sticky-head'),
        hint = el('ss-swipe-hint');
    if (!grid) { return; }

    // Hold the sticky header's columns over the grid's columns. They have to
    // be two separate scrollers: a header inside an overflow-x container would
    // stick to that container instead of to the page, and stop being sticky at
    // all. The guard keeps the two from ping-ponging each other's scroll
    // events forever.
    var syncing = false;
    function link(a, b) {
      if (!a || !b) { return; }
      a.addEventListener('scroll', function () {
        if (syncing) { return; }
        syncing = true;
        b.scrollLeft = a.scrollLeft;
        requestAnimationFrame(function () { syncing = false; });
      });
    }
    link(grid, head);
    link(head, grid);

    if (!hint) { return; }
    grid.addEventListener('scroll', function once() {
      if (grid.scrollLeft > 8) {
        hint.classList.add('ss-used');
        grid.removeEventListener('scroll', once);
      }
    });
  }

  /* ── How many years at each temperature ───────────────────────
     Rows are temperature levels rather than years, and the count is split into
     the two halves of the record instead of totalled. That split is the whole
     point. A single total cannot show a change over time -- it has no time in
     it -- and worse, it argues backwards: the longest bar in a plain frequency
     table is 26.5 °C, because cool years are the ones there have been most of.
     Halved, the top of the table is empty on the left and full on the right,
     and the bottom is the reverse.

     The boundary is the median year, so the two halves always hold the same
     number of years as the record grows. Built from the same two series the
     chart draws, so a new annual mean lands here by itself.

     Berkeley covers 1900 up to the year Changi's record starts, Changi from
     there on. The two disagree by about a third of a degree where they overlap,
     and that tilt runs in the direction of this table's own argument, so the
     note under it says so and gives the single-instrument check. */
  function drawFreq(data) {
    var body = el('ss-freq-body');
    if (!body) { return; }
    var b = data.berkeley || [], c = data.changi || [];
    if (!b.length && !c.length) { return; }

    var handover = c.length ? c[0][0] : Infinity;
    var years = [];
    b.forEach(function (p) { if (p[0] < handover) { years.push(p); } });
    c.forEach(function (p) { years.push(p); });
    if (!years.length) { return; }
    years.sort(function (x, y) { return x[0] - y[0]; });

    var from = years[0][0], to = years[years.length - 1][0];
    var mid = years[Math.floor(years.length / 2)][0];

    // Key on tenths as a whole number: 28.4 as a float is an unreliable map key,
    // and this is the same half-up rounding d1() applies everywhere else.
    var early = {}, late = {}, lo = Infinity, hi = -Infinity;
    years.forEach(function (p) {
      var k = Math.round(p[1] * 10 + 1e-9);
      var bucket = p[0] < mid ? early : late;
      bucket[k] = (bucket[k] || 0) + 1;
      if (k < lo) { lo = k; }
      if (k > hi) { hi = k; }
    });

    // One scale across both columns, or the two halves could not be compared.
    var most = 0, key;
    for (key in early) { if (early[key] > most) { most = early[key]; } }
    for (key in late) { if (late[key] > most) { most = late[key]; } }

    var cap = el('ss-freq-cap');
    if (cap) { cap.textContent = 'Years at each annual mean, ' + from + '–' + to; }
    var h1 = el('ss-freq-h1'), h2 = el('ss-freq-h2');
    if (h1) { h1.textContent = from + '–' + (mid - 1); }
    if (h2) { h2.textContent = mid + '–' + to; }

    function cell(n) {
      return '<td class="ss-freq-n">' +
        (n ? '<span class="ss-freq-bar" style="width:' +
             (n / most * 100).toFixed(1) + '%"></span>' : '') +
        '<span>' + n + '</span></td>';
    }

    var html = '';
    for (var k = hi; k >= lo; k--) {
      var a = early[k] || 0, z = late[k] || 0;
      html += '<tr' + (a || z ? '' : ' class="ss-freq-none"') + '>' +
        '<th scope="row">' + (k / 10).toFixed(1) + '&nbsp;°C</th>' +
        cell(a) + cell(z) +
      '</tr>';
    }
    body.innerHTML = html;
  }

  /* ── Ten-year projection ──────────────────────────────────
     Ordinary least squares on the Changi annual mean, refitted in the browser
     every load, so a new year changes the answer without anyone editing a
     constant.

     The band is a PREDICTION interval, not a confidence interval on the mean.
     The question a reader asks is "what will 2036 be", which is one draw from
     the scatter, not the position of the underlying line — and the two differ
     by a factor of about seven here. Using the narrower one would be the easy
     mistake and would badly oversell the forecast.

     It barely widens with distance (±0.58 now, ±0.60 in ten years) because
     almost all of it is year-to-year weather, mostly ENSO, rather than
     uncertainty about the slope. That flatness is the point: the band is
     already 2.5x a decade of warming before you go anywhere. */
  var PROJ_YEARS = 10;
  var PROJ_T = 1.96;                    // 95%, normal approximation
  var projHover = null, farHover = null;

  /* Read-out for the projection chart, matching the timeline's. Only the
     measured years answer: past the last reading there is no temperature to
     report, just a line, and putting a decimal on it would dress arithmetic up
     as a measurement. Hovering there says so instead. */
  function bindProjHover(svg) {
    var tip = el('ss-tip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'ss-tip';
      tip.className = 'ss-tip';
      tip.setAttribute('role', 'status');
      document.body.appendChild(tip);
    }
    var layer = svgNode('g', { 'pointer-events': 'none' });
    svg.appendChild(layer);
    projHover.layer = layer;

    if (svg.dataset.hoverBound) { return; }
    svg.dataset.hoverBound = '1';

    function clear() {
      tip.style.display = 'none';
      if (projHover && projHover.layer) {
        while (projHover.layer.firstChild) {
          projHover.layer.removeChild(projHover.layer.firstChild);
        }
      }
    }

    svg.addEventListener('mousemove', function (ev) {
      var st = projHover;
      if (!st) { return; }
      var r = svg.getBoundingClientRect();
      if (!r.width) { return; }
      var sx = (ev.clientX - r.left) * (st.w / r.width);
      var frac = (sx - 44) / (st.w - 44 - 14);            // PAD_L, PAD_R
      var year = Math.round(st.lo + frac * (st.end - st.lo));
      if (year < st.lo || year > st.end) { clear(); return; }

      while (st.layer.firstChild) { st.layer.removeChild(st.layer.firstChild); }

      var pt = null, i;
      for (i = 0; i < st.s.length; i++) { if (st.s[i][0] === year) { pt = st.s[i]; } }

      st.layer.appendChild(svgNode('line', {
        x1: st.x(year), y1: 14, x2: st.x(year), y2: st.h - 28,
        stroke: 'rgba(0,0,0,0.35)', 'stroke-width': 1, 'stroke-dasharray': '3 3'
      }));

      var rows = '<strong>' + year + '</strong>';
      if (pt) {
        st.layer.appendChild(svgNode('circle', {
          cx: st.x(year), cy: st.y(pt[1]), r: 3.5,
          fill: '#fff', stroke: '#4A4A4A', 'stroke-width': 1.5
        }));
        rows += '<span><i class="ss-tip-sw" style="border-top-color:#D0D0D0"></i>Measured ' +
          d1(pt[1]) + '&nbsp;°C</span>';
      } else {
        rows += '<span>Projected</span>';
      }
      st.layer.appendChild(svgNode('circle', {
        cx: st.x(year), cy: st.y(st.f.at(year)), r: 3,
        fill: '#C8102E', 'fill-opacity': 0.85
      }));
      rows += '<span><i class="ss-tip-sw" style="border-top-color:#C8102E"></i>Trend ' +
        d1(st.f.at(year)) + '&nbsp;°C</span>';
      if (year > st.last) {
        rows += '<span><i class="ss-tip-sw" style="border-top-color:rgba(200,16,46,0.3)"></i>' +
          d1(st.f.at(year) - st.f.pi(year)) + ' to ' + d1(st.f.at(year) + st.f.pi(year)) +
          '&nbsp;°C</span>';
      }

      tip.innerHTML = rows;
      tip.style.display = 'block';
      var tw = tip.offsetWidth;
      var left = ev.clientX + 16;
      if (left + tw > window.innerWidth - 8) { left = ev.clientX - tw - 16; }
      tip.style.left = left + 'px';
      tip.style.top = Math.max(8, ev.clientY - 12) + 'px';
    });

    svg.addEventListener('mouseleave', clear);
  }

  function fitTrend(series) {
    var n = series.length;
    if (n < 10) { return null; }
    var mx = 0, my = 0, i;
    for (i = 0; i < n; i++) { mx += series[i][0]; my += series[i][1]; }
    mx /= n; my /= n;
    var sxx = 0, sxy = 0;
    for (i = 0; i < n; i++) {
      sxx += (series[i][0] - mx) * (series[i][0] - mx);
      sxy += (series[i][0] - mx) * (series[i][1] - my);
    }
    var b = sxy / sxx, a = my - b * mx, sse = 0;
    for (i = 0; i < n; i++) {
      var r = series[i][1] - (a + b * series[i][0]);
      sse += r * r;
    }
    var s = Math.sqrt(sse / (n - 2));
    return {
      a: a, b: b, s: s, n: n, mx: mx, sxx: sxx,
      at: function (yr) { return a + b * yr; },
      // Standard error of a single future observation, not of the fitted mean.
      pi: function (yr) {
        return PROJ_T * s * Math.sqrt(1 + 1 / n + (yr - mx) * (yr - mx) / sxx);
      }
    };
  }

  function drawProjection(data) {
    var svg = el('ss-proj-near');
    if (!svg) { return; }
    var s = (data.changi || []);
    var f = fitTrend(s);
    if (!f) { return; }

    var last = s[s.length - 1][0], end = last + PROJ_YEARS;
    var lo = s[0][0];
    var w = svg.parentNode.clientWidth, h = 300;
    var PAD_L = 44, PAD_R = 14, PAD_T = 14, PAD_B = 28;
    if (!w) { return; }
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    while (svg.firstChild) { svg.removeChild(svg.firstChild); }

    var TLO = 26.8, THI = 29.6;
    var x = function (yr) { return PAD_L + ((yr - lo) / (end - lo)) * (w - PAD_L - PAD_R); };
    var y = function (t) { return PAD_T + ((THI - t) / (THI - TLO)) * (h - PAD_T - PAD_B); };

    var t;
    for (t = 27; t <= 29.5; t += 0.5) {
      svg.appendChild(svgNode('line', { x1: PAD_L, y1: y(t), x2: w - PAD_R, y2: y(t),
        stroke: 'rgba(0,0,0,0.07)', 'stroke-width': 1 }));
      var tl = svgNode('text', { x: 4, y: y(t) + 4, 'font-size': 10, fill: '#999' });
      tl.textContent = t.toFixed(1) + '°';
      svg.appendChild(tl);
    }
    [lo, 2000, 2020, last, end].forEach(function (yr) {
      var yl = svgNode('text', { x: x(yr), y: h - 8, 'font-size': 10, fill: '#999',
        'text-anchor': yr === end ? 'end' : 'middle' });
      yl.textContent = yr;
      svg.appendChild(yl);
    });

    // Where measurement stops and arithmetic starts.
    svg.appendChild(svgNode('line', { x1: x(last), y1: PAD_T, x2: x(last), y2: h - PAD_B,
      stroke: 'rgba(0,0,0,0.25)', 'stroke-width': 1, 'stroke-dasharray': '2 3' }));
    var mark = svgNode('text', { x: x(last) + 5, y: PAD_T + 10, 'font-size': 10, fill: '#999' });
    mark.textContent = 'measured ← | → projected';
    svg.appendChild(mark);

    var band = [], i2;
    for (i2 = last; i2 <= end; i2++) { band.push(x(i2) + ',' + y(f.at(i2) + f.pi(i2))); }
    for (i2 = end; i2 >= last; i2--) { band.push(x(i2) + ',' + y(f.at(i2) - f.pi(i2))); }
    svg.appendChild(svgNode('polygon', { points: band.join(' '),
      fill: 'rgba(200,16,46,0.13)', stroke: 'none' }));

    svg.appendChild(svgNode('line', { x1: x(lo), y1: y(f.at(lo)), x2: x(last), y2: y(f.at(last)),
      stroke: '#C8102E', 'stroke-width': 1.6, 'stroke-opacity': 0.55 }));
    svg.appendChild(svgNode('line', { x1: x(last), y1: y(f.at(last)), x2: x(end), y2: y(f.at(end)),
      stroke: '#C8102E', 'stroke-width': 2.2, 'stroke-dasharray': '5 4' }));

    svg.appendChild(svgNode('polyline', {
      points: s.map(function (p) { return x(p[0]) + ',' + y(p[1]); }).join(' '),
      fill: 'none', stroke: '#4A4A4A', 'stroke-width': 1.6, 'stroke-linejoin': 'round'
    }));

    // Hand the hover the same mapping the chart was drawn with, so the marker
    // lands exactly on the plotted point rather than near it.
    projHover = { s: s, f: f, x: x, y: y, w: w, h: h, lo: lo, end: end, last: last };
    bindProjHover(svg);

    el('ss-proj-slope').textContent = '+' + (f.b * 10).toFixed(2) + ' °C';
    // Same rate quoted in the century caveat, from the same fit.
    if (el('ss-proj-rate')) { el('ss-proj-rate').textContent = (f.b * 10).toFixed(2); }
    el('ss-proj-mid').textContent = f.at(end).toFixed(1) + ' °C';
    el('ss-proj-band').textContent = '± ' + f.pi(end).toFixed(2) + ' °C';

    /* The paragraph is the author's, but every figure in it is computed rather
       than typed, so it stays true as years accrue. ANCHOR is a real year in
       the record: its value and the gap to the projected floor are both read
       off the data, which is why the gap says 0.3 and not 0.4 -- 27.8 against
       27.5 is three tenths, however the sentence is phrased. */
    var ANCHOR = 2008;
    var floor = f.at(end) - f.pi(end);
    var anchor = null, k;
    for (k = 0; k < s.length; k++) { if (s[k][0] === ANCHOR) { anchor = s[k][1]; } }
    /* The two historical facts are derived against the SAME rounded figure the
       sentence quotes, so they can never disagree with it. If a future refit
       lifts the floor to 27.9, the year and the counts move with it rather than
       quietly becoming false. */
    var fl = parseFloat(d1(floor));
    var firstAt = null;
    for (k = 0; k < s.length; k++) {
      if (firstAt === null && parseFloat(d1(s[k][1])) >= fl) { firstAt = s[k][0]; }
    }
    var pre = (data.berkeley || []).filter(function (p) { return p[0] < s[0][0]; });
    var preOver = pre.filter(function (p) { return parseFloat(d1(p[1])) >= fl; }).length;
    var preMax = pre.length ? Math.max.apply(null, pre.map(function (p) { return p[1]; })) : null;

    var read = el('ss-proj-read');
    if (read && anchor !== null) {
      var html = 'If we are to extrapolate the current trend of an increase of <strong>' +
        (f.b * 10).toFixed(2) + '&nbsp;°C</strong> per decade, take into account the spread of ' +
        '<strong>±' + f.pi(end).toFixed(2) + '&nbsp;°C</strong>, it wouldn’t be unusual for ' +
        end + ' to be as cool as ' + d1(floor) + '&nbsp;°C. That said, that doesn’t change ' +
        'the fact that the world has gotten warmer. It’s still a ' +
        d1(floor - anchor) + '&nbsp;°C increase over the ' + d1(anchor) + '&nbsp;°C in ' +
        ANCHOR + ', almost 3 decades ago.';
      if (firstAt) {
        html += ' Furthermore, based on Changi Station’s records, no year reached ' +
          d1(floor) + '&nbsp;°C until ' + firstAt + '.';
      }
      if (pre.length && !preOver) {
        html += ' Worse, across Berkeley Earth’s ' + pre[0][0] + '–' + pre[pre.length - 1][0] +
          ' record, not a single year ever hit ' + d1(floor) +
          '&nbsp;°C, with the hottest only reaching ' + d1(preMax) + '&nbsp;°C.';
      }
      read.innerHTML = html + ' No matter how much certain parties deny climate change, the ' +
        'evidence is against them.';
    }

    drawCentury(f, last);
  }

  /* Read-out for the century strip. Two zones: over the bars it names the
     scenario and gives its mean and model range, because at twelve pixels wide
     they are legible as a comparison but not as numbers; over the plot it gives
     the year and where our line sits. Every value shown is the same one the
     shape was drawn from. */
  function bindFarHover(svg) {
    var tip = el('ss-tip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'ss-tip';
      tip.className = 'ss-tip';
      tip.setAttribute('role', 'status');
      document.body.appendChild(tip);
    }
    var layer = svgNode('g', { 'pointer-events': 'none' });
    svg.appendChild(layer);
    farHover.layer = layer;

    if (svg.dataset.hoverBound) { return; }
    svg.dataset.hoverBound = '1';

    function clear() {
      tip.style.display = 'none';
      if (farHover && farHover.layer) {
        while (farHover.layer.firstChild) { farHover.layer.removeChild(farHover.layer.firstChild); }
      }
    }

    function place(ev) {
      tip.style.display = 'block';
      var tw = tip.offsetWidth;
      var left = ev.clientX + 16;
      if (left + tw > window.innerWidth - 8) { left = ev.clientX - tw - 16; }
      tip.style.left = left + 'px';
      tip.style.top = Math.max(8, ev.clientY - 12) + 'px';
    }

    svg.addEventListener('mousemove', function (ev) {
      var st = farHover;
      if (!st) { return; }
      var r = svg.getBoundingClientRect();
      if (!r.width) { return; }
      var sx = (ev.clientX - r.left) * (st.w / r.width);
      while (st.layer.firstChild) { st.layer.removeChild(st.layer.firstChild); }

      // Scenario bars first: they sit past the plot's right edge.
      if (sx >= st.barX - 6) {
        var i = Math.round((sx - st.barX - 6) / 16);
        if (i < 0) { i = 0; }
        if (i > st.V3.length - 1) { i = st.V3.length - 1; }
        var s = st.V3[i], bx = st.barX + i * 16;
        st.layer.appendChild(svgNode('rect', {
          x: bx - 2, y: st.y(s.hi) - 2, width: 16, height: st.y(s.lo) - st.y(s.hi) + 4,
          fill: 'none', stroke: s.c, 'stroke-width': 1.5, rx: 3
        }));
        tip.innerHTML = '<strong>' + s.k + '</strong>' +
          '<span><i class="ss-tip-sw" style="border-top-color:' + s.c + '"></i>' +
          s.mid.toFixed(1) + '&nbsp;°C average of 5 models</span>' +
          '<span>range ' + s.lo.toFixed(1) + ' to ' + s.hi.toFixed(1) + '&nbsp;°C</span>' +
          '<span>2080–2099</span>';
        place(ev);
        return;
      }

      if (sx < st.padL) { clear(); return; }
      var year = Math.round(1982 + ((sx - st.padL) / (st.w - st.padL - st.padR)) * (2100 - 1982));
      if (year < 1982 || year > 2100) { clear(); return; }
      st.layer.appendChild(svgNode('line', {
        x1: st.x(year), y1: 12, x2: st.x(year), y2: st.h - 26,
        stroke: 'rgba(0,0,0,0.3)', 'stroke-width': 1, 'stroke-dasharray': '3 3'
      }));
      st.layer.appendChild(svgNode('circle', {
        cx: st.x(year), cy: st.y(st.f.at(year)), r: 3, fill: '#C8102E'
      }));
      tip.innerHTML = '<strong>' + year + '</strong>' +
        '<span><i class="ss-tip-sw" style="border-top-color:#C8102E"></i>Our line ' +
        d1(st.f.at(year)) + '&nbsp;°C</span>' +
        (year > st.last ? '<span>Projected</span>' : '<span>Fitted to measurements</span>');
      place(ev);
    });

    svg.addEventListener('mouseleave', clear);
  }

  /* The same line, run to 2100, against what the climate models say. Drawn
     separately because the official range needs an axis six degrees tall, on
     which the whole Changi record collapses to a smudge -- which is itself
     worth seeing, but it would destroy the ten-year chart above. */
  function drawCentury(f, last) {
    var svg = el('ss-proj-far');
    if (!svg) { return; }
    var w = svg.parentNode.clientWidth, h = 150;
    // Right gutter has to hold the three scenario bars AND their caption.
    var PAD_L = 44, PAD_R = 132, PAD_T = 12, PAD_B = 26;
    if (!w) { return; }
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    while (svg.firstChild) { svg.removeChild(svg.firstChild); }

    var LO_Y = 1982, HI_Y = 2100, TLO = 26.5, THI = 33.5;
    var x = function (yr) { return PAD_L + ((yr - LO_Y) / (HI_Y - LO_Y)) * (w - PAD_L - PAD_R); };
    var y = function (t) { return PAD_T + ((THI - t) / (THI - TLO)) * (h - PAD_T - PAD_B); };

    var t;
    for (t = 27; t <= 33; t += 2) {
      svg.appendChild(svgNode('line', { x1: PAD_L, y1: y(t), x2: w - PAD_R, y2: y(t),
        stroke: 'rgba(0,0,0,0.07)', 'stroke-width': 1 }));
      var tl = svgNode('text', { x: 4, y: y(t) + 4, 'font-size': 10, fill: '#999' });
      tl.textContent = t + '°';
      svg.appendChild(tl);
    }
    [LO_Y, 2040, 2070, 2100].forEach(function (yr) {
      var yl = svgNode('text', { x: x(yr), y: h - 8, 'font-size': 10, fill: '#999',
        'text-anchor': 'middle' });
      yl.textContent = yr;
      svg.appendChild(yl);
    });

    /* MSS V3, Table 5.1: annual average daily mean air temperature over the
       end-century window, 2080-2099. Mean of five models, with the model
       minimum and maximum in brackets. Drawn as three separate scenarios
       rather than one outer bracket, because 28.5 to 32.9 collapses the whole
       emissions question into a single gray block -- and the question is the
       point. Colors follow MSS's own figures. */
    var V3 = [
      { k: 'SSP1-2.6', mid: 29.0, lo: 28.5, hi: 29.5, c: '#3F6E9B' },
      { k: 'SSP2-4.5', mid: 29.9, lo: 29.3, hi: 30.7, c: '#E08A2E' },
      { k: 'SSP5-8.5', mid: 31.7, lo: 30.7, hi: 32.9, c: '#B03A4A' }
    ];
    V3.forEach(function (s, i) {
      var cx = x(2100) + 4 + i * 16;
      svg.appendChild(svgNode('rect', { x: cx, y: y(s.hi), width: 12,
        height: y(s.lo) - y(s.hi), fill: s.c, 'fill-opacity': 0.4, rx: 2 }));
      svg.appendChild(svgNode('line', { x1: cx, y1: y(s.mid), x2: cx + 12, y2: y(s.mid),
        stroke: s.c, 'stroke-width': 2 }));
    });
    var band = svgNode('text', { x: x(2100) + 56, y: PAD_T + 10, 'font-size': 10, fill: '#666' });
    band.textContent = 'MSS V3';
    svg.appendChild(band);
    var band2 = svgNode('text', { x: x(2100) + 56, y: PAD_T + 22, 'font-size': 9, fill: '#999' });
    band2.textContent = '2080–2099';
    svg.appendChild(band2);
    var band3 = svgNode('text', { x: x(2100) + 56, y: PAD_T + 33, 'font-size': 9, fill: '#999' });
    band3.textContent = 'low/mid/high';
    svg.appendChild(band3);

    svg.appendChild(svgNode('line', { x1: x(LO_Y), y1: y(f.at(LO_Y)), x2: x(last), y2: y(f.at(last)),
      stroke: '#C8102E', 'stroke-width': 1.6, 'stroke-opacity': 0.55 }));
    svg.appendChild(svgNode('line', { x1: x(last), y1: y(f.at(last)), x2: x(2100), y2: y(f.at(2100)),
      stroke: '#C8102E', 'stroke-width': 1.8, 'stroke-dasharray': '5 4' }));
    // Set back from the line's end so it clears the scenario bars.
    var lab = svgNode('text', { x: x(2078), y: y(f.at(2078)) - 8, 'font-size': 10,
      fill: '#C8102E', 'text-anchor': 'middle' });
    lab.textContent = 'our line, ' + f.at(2100).toFixed(1) + ' °C at 2100';
    svg.appendChild(lab);

    // Same figure in the prose, so the two can never drift apart.
    if (el('ss-proj-2100')) { el('ss-proj-2100').textContent = f.at(2100).toFixed(1); }

    farHover = { f: f, x: x, y: y, w: w, h: h, last: last, V3: V3,
      padL: PAD_L, padR: PAD_R, barX: x(2100) + 4 };
    bindFarHover(svg);
  }

  /* ── Tree cover simulator ─────────────────────────────────
     Meili et al. (2025), Figure 8(e), Singapore. Their model ran exactly five
     cover fractions, so this reads off those five and nothing between them --
     the slider is stepped, not continuous, because inventing 30% would be
     inventing a simulation they never ran.

     Values are digitized from the published figure. The one point they also
     state numerically -- open low-rise, 40% cover, rooftop-height trees, -16%
     -- is what the digitized curve reads there, which is the check that the
     rest are read correctly.

     LCZ6 with half-height trees is absent on purpose: their canyon model
     cannot fill a wide street with short trees without a crown wider than the
     tree is tall, so that scenario was never simulated. Saying so beats
     interpolating a number into the gap. */
  /* How wide the band is, and why those two numbers.

     Meili et al. ran the same scenarios at three fresh-air ventilation rates.
     Singapore comes out at -8% with ACH 0.5 and -4% with ACH 1, so a leaky
     building halves the benefit: the outdoor air the trees have humidified
     gets in, and drying it costs what the shade saved. At ACH 0.35 the
     hot-humid cities move from a -6..-9% band to -8..-11%, about a quarter
     better. Those two ratios are the edges here.

     This is a sensitivity range from one model, not a confidence interval, and
     the page says so. The wider literature is wider still. */
  var SIM_LEAKY = 0.5, SIM_TIGHT = 1.25;
  var SIM_COVER = [0, 20, 40, 60, 80];
  var SIM = {
    'LCZ3': {
      '0.5':  [0, -2.8, -4.1, -4.4, -5.6],
      '0.75': [0, -5.0, -6.8, -8.0, -10.2],
      '0.95': [0, -5.5, -10.3, -12.7, -14.6]
    },
    'LCZ6': {
      '0.5':  null,
      '0.75': [0, -6.5, -12.7, -15.5, -17.0],
      // -16.0 rather than the -15.6 the figure reads: this is the one point the
      // paper also states in words, so the stated value wins over the pixel.
      '0.95': [0, -9.5, -16.0, -18.6, -18.4]
    }
  };

  function wireSim() {
    var slider = el('ss-sim-cover');
    if (!slider) { return; }
    var numEl = el('ss-sim-num'), msgEl = el('ss-sim-msg'), svg = el('ss-sim-curve');
    var state = { i: 2, h: '0.95', lcz: 'LCZ6' };

    function segs(hostId) { return [].slice.call(el(hostId).querySelectorAll('button')); }

    function pick(hostId, key) {
      segs(hostId).forEach(function (b) {
        var on = b.getAttribute('data-v') === state[key];
        b.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    }

    function draw(series) {
      if (!svg) { return; }
      var w = svg.clientWidth || svg.parentNode.clientWidth;
      var h = 150, PAD_L = 6, PAD_B = 20, PAD_T = 10;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      while (svg.firstChild) { svg.removeChild(svg.firstChild); }
      if (!w) { return; }

      // One fixed scale across every scenario, or switching the street would
      // silently rescale the axis and the curves would look identical. It has
      // to reach past the band's lower edge, not just the central line.
      var LO = -25;
      var x = function (i) { return PAD_L + (i / 4) * (w - PAD_L * 2); };
      var y = function (v) { return PAD_T + (v / LO) * (h - PAD_T - PAD_B); };

      [-5, -10, -15, -20, -25].forEach(function (v) {
        svg.appendChild(svgNode('line', { x1: 0, y1: y(v), x2: w, y2: y(v),
          stroke: 'rgba(0,0,0,0.07)', 'stroke-width': 1 }));
      });

      // The other two heights, faint, so the height lever is visibly the big one.
      Object.keys(SIM[state.lcz]).forEach(function (hk) {
        var s = SIM[state.lcz][hk];
        if (!s || hk === state.h) { return; }
        svg.appendChild(svgNode('polyline', {
          points: s.map(function (v, i) { return x(i) + ',' + y(v); }).join(' '),
          fill: 'none', stroke: 'rgba(0,0,0,0.18)', 'stroke-width': 1.2,
          'stroke-dasharray': '3 3'
        }));
      });

      if (!series) { return; }

      // The band first, so the line sits on top of it. Forward along the leaky
      // edge, back along the tight one.
      var up = series.map(function (v, i) { return x(i) + ',' + y(v * SIM_LEAKY); });
      var dn = series.map(function (v, i) { return x(i) + ',' + y(v * SIM_TIGHT); }).reverse();
      svg.appendChild(svgNode('polygon', {
        points: up.concat(dn).join(' '), fill: 'rgba(200,16,46,0.12)', stroke: 'none'
      }));

      svg.appendChild(svgNode('polyline', {
        points: series.map(function (v, i) { return x(i) + ',' + y(v); }).join(' '),
        fill: 'none', stroke: '#C8102E', 'stroke-width': 2.2, 'stroke-linejoin': 'round'
      }));
      series.forEach(function (v, i) {
        svg.appendChild(svgNode('circle', {
          cx: x(i), cy: y(v), r: i === state.i ? 5 : 2.5,
          fill: i === state.i ? '#C8102E' : 'rgba(200,16,46,0.45)'
        }));
      });
      var lab = svgNode('text', { x: 0, y: h - 4, 'font-size': 10, fill: '#999' });
      lab.textContent = 'tree cover, 0 to 80%';
      svg.appendChild(lab);
    }

    function paintSim() {
      var series = SIM[state.lcz][state.h];
      var cover = SIM_COVER[state.i];

      if (!series) {
        numEl.innerHTML = '&mdash;';
        // Clear the band too, or it keeps showing the range of whichever
        // scenario was on screen before this one.
        if (el('ss-sim-range')) { el('ss-sim-range').innerHTML = ''; }
        msgEl.textContent = 'Not simulated: a wide street cannot be filled with short trees ' +
          'without a crown wider than the tree is tall.';
        draw(null);
        return;
      }

      var v = series[state.i];
      numEl.innerHTML = (v === 0 ? '0' : '&minus;' + Math.abs(v).toFixed(1)) +
        '<span class="ss-sim-unit">%</span>';

      var rangeEl = el('ss-sim-range');
      if (rangeEl) {
        rangeEl.innerHTML = v === 0 ? '' :
          'somewhere between <strong>&minus;' + (Math.abs(v) * SIM_LEAKY).toFixed(1) +
          '%</strong> and <strong>&minus;' + (Math.abs(v) * SIM_TIGHT).toFixed(1) +
          '%</strong>, depending on how well the building is sealed';
      }

      // The point of the whole widget: name the moment the curve stops paying.
      var msg = '';
      if (cover === 0) {
        msg = 'No trees. This is the baseline everything else is measured against.';
      } else if (cover > 40) {
        var at40 = series[2], gain = Math.abs(v) - Math.abs(at40);
        // Every scenario in the data gains a little past 40%, but the curves do
        // flatten and one dips, so the wording has to survive a negative too.
        msg = 'Increasing the cover past 40% only yielded ' +
          (gain < 0 ? gain.toFixed(1) + ' points, a loss' : 'an additional ' + gain.toFixed(1) + ' points') +
          '. The humidity produced by the trees outweighs the benefits of their shade.';
      } else if (cover === 40) {
        msg = 'This is the sharpest bend of the curve. Beyond this point, the efficiency ' +
          'of any additional trees drops drastically.';
      }
      msgEl.textContent = msg;
      draw(series);
    }

    slider.addEventListener('input', function () {
      state.i = parseInt(slider.value, 10);
      paintSim();
    });

    ['ss-sim-height', 'ss-sim-lcz'].forEach(function (id) {
      var key = id === 'ss-sim-height' ? 'h' : 'lcz';
      segs(id).forEach(function (b) {
        b.addEventListener('click', function () {
          state[key] = b.getAttribute('data-v');
          pick(id, key);
          paintSim();
        });
      });
      pick(id, key);
    });

    window.addEventListener('resize', function () { draw(SIM[state.lcz][state.h]); });
    paintSim();
  }

  /* ── Grid switch calculator ───────────────────────────────
     Arithmetic, not a model. Every input is published:

       EMA energy balance 2024 -- 123 TWh of energy in, 60 TWh of electricity
       out. That ratio IS the fleet's thermal efficiency, 48.8%, measured rather
       than assumed, and the difference is heat thrown away.

       EMA grid emission factor 2024 -- 0.402 kg CO2 per kWh.

       World Nuclear Association -- light-water reactors convert 33-37% of their
       heat to electricity. The range is theirs; it becomes the band below.

     The counterintuitive half is the point of the whole thing. Reactors are
     roughly a third efficient where the current fleet is roughly half, so
     making the same electricity means rejecting considerably more heat. Better
     for carbon, worse for the waste heat Singapore itself has to absorb. */
  var GRID_TWH = 60;          // gross electricity generated, 2024
  var GRID_INPUT_TWH = 123;   // energy input to generate it
  var GRID_GEF = 0.402;       // kg CO2 per kWh
  var NUKE_EFF = [0.37, 0.33];   // best case first, so [0] is the smaller waste

  function wireGrid() {
    var slider = el('ss-grid-share');
    if (!slider) { return; }
    var fleetEff = GRID_TWH / GRID_INPUT_TWH;

    // Heat rejected when a share p of the generation comes from reactors.
    function waste(p, eff) {
      return GRID_TWH * (1 - p) * (1 / fleetEff - 1) + GRID_TWH * p * (1 / eff - 1);
    }

    function paintGrid() {
      var p = parseInt(slider.value, 10) / 100;
      var co2 = GRID_TWH * 1e9 * GRID_GEF / 1e9;      // TWh -> kWh -> kg -> Mt
      var avoided = co2 * p;
      var now = waste(0, NUKE_EFF[0]);
      var lo = waste(p, NUKE_EFF[0]), hi = waste(p, NUKE_EFF[1]);

      el('ss-grid-co2').innerHTML = avoided === 0 ? '0' :
        avoided.toFixed(1) + '<span class="ss-sim-unit"> Mt</span>';

      el('ss-grid-heat').innerHTML = p === 0 ?
        'Waste heat remains the same, at <strong>' + now.toFixed(0) +
        '&nbsp;TWh</strong> per year.' :
        'Waste heat increases from <strong>' + now.toFixed(0) + '</strong> to between <strong>' +
        lo.toFixed(0) + '</strong> and <strong>' + hi.toFixed(0) +
        '&nbsp;TWh</strong> per year, about ' + (lo / now).toFixed(1) + ' to ' +
        (hi / now).toFixed(1) + ' times more.';

      // The efficiency explanation lives in the prose below the widget now, so
      // this only has to say which grid the reader is looking at.
      var msg = el('ss-grid-msg');
      if (msg) {
        msg.textContent = p === 0 ?
          'The current grid, unchanged, 94% natural gas.' :
          'Projected grid, when ' + Math.round(p * 100) +
          '% of electricity is provided by nuclear reactors.';
      }

      var read = el('ss-grid-read');
      if (read) {
        read.innerHTML = p === 0 ?
          'Move the slider to see what switching part of the supply would change.' :
          'Switching to ' + Math.round(p * 100) + '% reduces carbon emission by <strong>' +
          avoided.toFixed(1) + '&nbsp;million tons</strong> of CO₂ a year. Compared to the ' +
          '87,000 tons saved by trees, this is about <strong>' +
          Math.round(avoided * 1e6 / 87000) + ' times</strong> larger. However, more heat is ' +
          'generated. Waste heat increases by <strong>' + (lo - now).toFixed(0) + ' to ' +
          (hi - now).toFixed(0) + '&nbsp;TWh</strong> per year. Though the technologies differ ' +
          'in how they deal with waste heat, with gas stations venting most of them into the ' +
          'air above Jurong Island, a nuclear reactor would dump its heat into the sea.';
      }
    }

    slider.addEventListener('input', paintGrid);
    paintGrid();
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

  /* -- Forest area -----------------------------------------------
     FAO's series, served by the World Bank, which is CORS-open. Drawn portrait
     with the years running down, so it reads the same way as the timeline's
     land and temperature tracks instead of asking the eye to switch axes.

     The thing this chart has to be honest about: FAO reports at benchmark years
     and the World Bank fills the gaps by straight-line interpolation, so most
     of the "annual" values were never measured.

     Detecting those years from the numbers does not work, which is worth
     recording so nobody tries it again. Looking for a change in slope both adds
     2016 and 2017 -- where the published values wobble by a rounding-sized
     0.1 km2 -- and misses 2020, because the 2020-2023 trend happens to match
     the one before it exactly. So the reporting years are named outright, from
     FAO's own assessment schedule; add the next one here when FRA publishes.

     This cannot be spliced onto Corlett's historical figures: he counts tall
     forest and gets ~17 km2 for 1990, where FAO's broader definition gets
     148 km2. Nine times apart, so they are not one series. */
  var FOREST_KM2 = 'https://api.worldbank.org/v2/country/SGP/indicator/AG.LND.FRST.K2?format=json&per_page=100';
  var FOREST_PCT = 'https://api.worldbank.org/v2/country/SGP/indicator/AG.LND.FRST.ZS?format=json&per_page=100';
  var FOR_LO = 140, FOR_HI = 185;
  var FOR_W = 320, FOR_H = 440;
  var FOR_ML = 34, FOR_MR = 52, FOR_MT = 24, FOR_MB = 32;   // MB clears the last endpoint label
  var forestState = null;

  function wbSeries(payload) {
    var rows = (payload && payload[1]) || [];
    return rows.filter(function (r) { return r.value !== null; })
               .map(function (r) { return [parseInt(r.date, 10), r.value]; })
               .sort(function (a, b) { return a[0] - b[0]; });
  }

  // FAO's Global Forest Resources Assessment reference years. Everything
  // between them is the World Bank's straight line, and the series' final year
  // is a carried-forward estimate rather than a reported one, so it gets a
  // value label but no dot.
  var FAO_YEARS = [1990, 2000, 2010, 2015, 2020];

  function findBenchmarks(s) {
    var keep = {}, present = {};
    s.forEach(function (p) { present[p[0]] = 1; });
    FAO_YEARS.forEach(function (y) { if (present[y]) { keep[y] = 1; } });
    return keep;
  }

  function drawForest(series, pct) {
    var svg = el('ss-forest-svg');
    if (!svg || series.length < 2) { return; }
    svg.setAttribute('viewBox', '0 0 ' + FOR_W + ' ' + FOR_H);
    while (svg.firstChild) { svg.removeChild(svg.firstChild); }

    var y0 = series[0][0], y1 = series[series.length - 1][0];
    var pw = FOR_W - FOR_ML - FOR_MR, ph = FOR_H - FOR_MT - FOR_MB;
    var X = function (km) { return FOR_ML + ((km - FOR_LO) / (FOR_HI - FOR_LO)) * pw; };
    var Y = function (yr) { return FOR_MT + ((yr - y0) / (y1 - y0)) * ph; };
    var marks = findBenchmarks(series);
    forestState = { series: series, pct: pct, marks: marks, y0: y0, y1: y1 };

    [150, 160, 170, 180].forEach(function (g) {
      svg.appendChild(svgNode('line', {
        x1: X(g), y1: FOR_MT, x2: X(g), y2: FOR_MT + ph,
        stroke: 'rgba(0,0,0,0.07)', 'stroke-width': 1
      }));
      var t = svgNode('text', { x: X(g), y: FOR_MT - 9, 'font-size': 9,
                                fill: '#898781', 'text-anchor': 'middle' });
      t.textContent = g;
      svg.appendChild(t);
    });
    var unit = svgNode('text', { x: 0, y: FOR_MT - 9, 'font-size': 9, fill: '#898781' });
    unit.textContent = 'km\u00b2';
    svg.appendChild(unit);

    var pts = series.map(function (p) { return X(p[1]) + ',' + Y(p[0]); });
    svg.appendChild(svgNode('path', {
      d: 'M ' + X(FOR_LO) + ',' + Y(y0) + ' L ' + pts.join(' L ') +
         ' L ' + X(FOR_LO) + ',' + Y(y1) + ' Z',
      fill: 'rgba(0,131,0,0.10)', stroke: 'none'
    }));
    svg.appendChild(svgNode('polyline', {
      points: pts.join(' '), fill: 'none', stroke: '#008300',
      'stroke-width': 1.6, 'stroke-dasharray': '4 3'
    }));

    series.forEach(function (p) {
      if (!marks[p[0]]) { return; }
      svg.appendChild(svgNode('circle', {
        cx: X(p[1]), cy: Y(p[0]), r: 3.4, fill: '#008300',
        stroke: '#fff', 'stroke-width': 1.4
      }));
      var lb = svgNode('text', { x: FOR_ML - 7, y: Y(p[0]) + 3, 'font-size': 9,
                                 fill: '#52514e', 'text-anchor': 'end' });
      lb.textContent = p[0];
      svg.appendChild(lb);
    });

    [series[0], series[series.length - 1]].forEach(function (p) {
      var v = svgNode('text', { x: X(p[1]) + 8, y: Y(p[0]) + 3, 'font-size': 10,
                                fill: '#0b0b0b', 'font-weight': 700 });
      v.textContent = p[1].toFixed(0);
      svg.appendChild(v);
      if (pct[p[0]] === undefined) { return; }
      var s = svgNode('text', { x: X(p[1]) + 8, y: Y(p[0]) + 14, 'font-size': 9, fill: '#898781' });
      s.textContent = pct[p[0]].toFixed(1) + '%';
      svg.appendChild(s);
    });

    var sub = el('ss-forest-sub');
    if (sub) { sub.textContent = y0 + '\u2013' + y1; }
    bindForestHover(svg);
  }

  function bindForestHover(svg) {
    if (svg.dataset.hoverBound) { return; }
    svg.dataset.hoverBound = '1';
    var tip = el('ss-tip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'ss-tip';
      tip.className = 'ss-tip';
      document.body.appendChild(tip);
    }
    function hide() { tip.style.display = 'none'; }
    svg.addEventListener('mousemove', function (e) {
      if (!forestState) { return; }
      var st = forestState;
      var r = svg.getBoundingClientRect();
      var vy = ((e.clientY - r.top) / r.height) * FOR_H;
      var yr = Math.round(st.y0 + ((vy - FOR_MT) / (FOR_H - FOR_MT - FOR_MB)) * (st.y1 - st.y0));
      yr = Math.max(st.y0, Math.min(st.y1, yr));
      var hit = null, i;
      for (i = 0; i < st.series.length; i++) {
        if (st.series[i][0] === yr) { hit = st.series[i]; break; }
      }
      if (!hit) { hide(); return; }
      tip.innerHTML = '<strong>' + hit[0] + '</strong>' +
        '<span>' + hit[1].toFixed(1) + ' km\u00b2 of forest</span>' +
        (st.pct[hit[0]] !== undefined
          ? '<span>' + st.pct[hit[0]].toFixed(1) + '% of land area</span>' : '') +
        '<span>' + (st.marks[hit[0]] ? 'Reported by FAO' : 'Interpolated') + '</span>';
      tip.style.display = 'block';
      var tw = tip.offsetWidth;
      var left = e.clientX + 14;
      if (left + tw > window.innerWidth - 8) { left = e.clientX - tw - 14; }
      tip.style.left = Math.max(8, left) + 'px';
      tip.style.top = Math.max(8, e.clientY + 14) + 'px';
    });
    svg.addEventListener('mouseleave', hide);
  }

  function forestFailed() {
    var sub = el('ss-forest-sub');
    if (sub) { sub.textContent = 'unavailable'; }
  }

  /* ── Live station map ────────────────────────────────────────
     Same frame as the satellite plate above it — change these and you must
     change the CSS mask and re-render lst-singapore.png to match, or a place
     will sit in two different spots in the two figures. */
  var MAP_W = 103.60, MAP_E = 104.10, MAP_S = 1.18, MAP_N = 1.48;
  var VB_W = 500, VB_H = 300;                  // viewBox units, 5:3 like the frame

  // Second sequential scale on the page, so it takes the next hue rather than
  // reusing the satellite map's red for a different quantity on a different
  // domain. Generated and validated the same way as the red ramp.
  var LIVE_RAMP = ['#d9a279', '#cf884e', '#c36d19', '#b35400', '#9a4100', '#7b3600', '#5d2b00'];

  function rampAt(stops, t) {
    t = Math.max(0, Math.min(1, t));
    var x = t * (stops.length - 1), i = Math.min(Math.floor(x), stops.length - 2), f = x - i;
    var a = stops[i], b = stops[i + 1], out = '#';
    for (var c = 1; c < 7; c += 2) {
      var v = Math.round(parseInt(a.substr(c, 2), 16) * (1 - f) +
                         parseInt(b.substr(c, 2), 16) * f);
      out += (v < 16 ? '0' : '') + v.toString(16);
    }
    return out;
  }

  function projX(lon) { return (lon - MAP_W) / (MAP_E - MAP_W) * VB_W; }
  function projY(lat) { return (MAP_N - lat) / (MAP_N - MAP_S) * VB_H; }

  function renderStationMap(payload) {
    var data = payload.data;
    var field = el('ss-lm-field'), pins = el('ss-lm-pins');
    if (!field || !pins) { return; }

    var latest = (data.readings && data.readings.length)
      ? data.readings[data.readings.length - 1] : null;
    if (!latest) { throw new Error('no readings'); }

    var val = {};
    latest.data.forEach(function (r) {
      if (typeof r.value === 'number') { val[r.stationId] = r.value; }
    });
    var pts = [];
    (data.stations || []).forEach(function (s) {
      var v = val[s.id];
      if (typeof v !== 'number' || !s.location) { return; }
      pts.push({ name: s.name, v: v, x: projX(s.location.longitude), y: projY(s.location.latitude) });
    });
    if (pts.length < 3) { throw new Error('too few stations to interpolate'); }

    var lo = Math.min.apply(null, pts.map(function (p) { return p.v; }));
    var hi = Math.max.apply(null, pts.map(function (p) { return p.v; }));
    var span = Math.max(hi - lo, 0.4);         // a flat island still needs a scale

    // Inverse-distance weighting on a coarse grid, then blurred. The field is a
    // guess between sixteen points either way, so a smooth low-resolution wash
    // is more honest than a crisp one that implies detail we do not have.
    field.setAttribute('viewBox', '0 0 ' + VB_W + ' ' + VB_H);
    while (field.firstChild) { field.removeChild(field.firstChild); }
    var defs = svgNode('defs', {});
    defs.innerHTML = '<filter id="ss-lm-blur" x="-10%" y="-10%" width="120%" height="120%">' +
                     '<feGaussianBlur stdDeviation="9" /></filter>';
    field.appendChild(defs);

    var g = svgNode('g', { filter: 'url(#ss-lm-blur)' });
    var STEP = 12.5;
    for (var gy = 0; gy < VB_H; gy += STEP) {
      for (var gx = 0; gx < VB_W; gx += STEP) {
        var cx = gx + STEP / 2, cy = gy + STEP / 2, num = 0, den = 0;
        for (var i = 0; i < pts.length; i++) {
          var dx = cx - pts[i].x, dy = cy - pts[i].y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 1) { num = pts[i].v; den = 1; break; }
          var w = 1 / (d2 * d2);               // 1/d^4, so a station dominates nearby
          num += pts[i].v * w; den += w;
        }
        g.appendChild(svgNode('rect', {
          x: gx, y: gy, width: STEP + 0.5, height: STEP + 0.5,
          fill: rampAt(LIVE_RAMP, (num / den - lo) / span)
        }));
      }
    }
    field.appendChild(g);

    pins.setAttribute('viewBox', '0 0 ' + VB_W + ' ' + VB_H);
    while (pins.firstChild) { pins.removeChild(pins.firstChild); }
    pts.forEach(function (p) {
      var c = svgNode('circle', {
        cx: p.x, cy: p.y, r: 4.2, fill: rampAt(LIVE_RAMP, (p.v - lo) / span),
        stroke: '#fff', 'stroke-width': 1.8
      });
      c.style.cursor = 'pointer';
      c.dataset.name = p.name;
      c.dataset.v = p.v.toFixed(1);
      pins.appendChild(c);
    });
    bindStationHover(pins);

    el('ss-lm-lo').textContent = lo.toFixed(1) + ' °C';
    el('ss-lm-hi').textContent = hi.toFixed(1) + ' °C';
    var when = new Date(latest.timestamp);
    el('ss-lm-time').textContent = pts.length + ' stations, ' +
      when.toLocaleString('en-SG', { timeStyle: 'short', timeZone: 'Asia/Singapore' }) + ' SGT';
  }

  function bindStationHover(svg) {
    if (svg.dataset.hoverBound) { return; }
    svg.dataset.hoverBound = '1';
    var tip = el('ss-tip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'ss-tip';
      tip.className = 'ss-tip';
      document.body.appendChild(tip);
    }
    // .ss-tip is hidden with display:none, not opacity — every other tooltip on
    // this page toggles display, and setting opacity alone left this one
    // permanently invisible however carefully it was positioned.
    function hide() { tip.style.display = 'none'; }
    svg.addEventListener('mouseover', function (e) {
      var t = e.target;
      if (!t.dataset || !t.dataset.name) { return; }
      tip.innerHTML = '<strong>' + t.dataset.name + '</strong><span>' +
        t.dataset.v + ' °C right now</span>';
      tip.style.display = 'block';
    });
    svg.addEventListener('mousemove', function (e) {
      // Same edge handling as the chart tooltips: flip to the left of the
      // pointer rather than run off screen. The eastern stations sit far
      // enough right that on a phone the tip would otherwise be cut off.
      var tw = tip.offsetWidth;
      var left = e.clientX + 14;
      if (left + tw > window.innerWidth - 8) { left = e.clientX - tw - 14; }
      tip.style.left = Math.max(8, left) + 'px';
      tip.style.top = Math.max(8, e.clientY + 14) + 'px';
    });
    svg.addEventListener('mouseout', hide);
    svg.addEventListener('mouseleave', hide);
  }

  function stationMapFailed() {
    var t = el('ss-lm-time');
    if (t) { t.textContent = 'Live feed unavailable right now'; }
  }

  /* ── Tabs ────────────────────────────────────────────────────
     The station list and the station map are two views of one fetch, so they
     share a control rather than both being on screen. Both panels are built
     at load; the map's SVG is sized in viewBox units, so it renders correctly
     even while its panel is hidden and has no layout box. */
  function wireTabs(rootId) {
    var root = el(rootId);
    if (!root) { return; }
    var tabs = [].slice.call(root.querySelectorAll('[role="tab"]'));
    if (!tabs.length) { return; }

    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = el(t.getAttribute('aria-controls'));
        if (panel) { panel.hidden = !on; }
      });
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) { return; }
        e.preventDefault();
        var next = tabs[(i + d + tabs.length) % tabs.length];
        select(next);
        next.focus();
      });
    });
  }

  /* ── In-page section nav ─────────────────────────────────────
     Marks the section the reader is in and keeps that chip scrolled into
     view, since the strip overflows on a phone. Driven off scroll position
     rather than IntersectionObserver: the sections are wildly different
     heights (the timeline alone is several screens), and "whichever heading
     the sticky bars last passed" is the answer a reader expects. */
  function wirePageNav() {
    var nav = el('ss-nav'), strip = el('ss-nav-links');
    if (!nav || !strip) { return; }
    // Only the section chips. The bar also holds the home and Projects links,
    // and querying the whole nav would put them in the list — aria-current
    // would land on the logo whenever the reader is above the first section.
    var links = [].slice.call(strip.querySelectorAll('a'));
    var targets = links.map(function (a) {
      return el(a.getAttribute('href').slice(1));
    });

    // Publish the bar's real height rather than a guessed one: the timeline's
    // sticky header positions itself from --ss-nav-h, and a wrong guess there
    // shows up as the two bars overlapping mid-timeline.
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
      var chip = links[found];
      if (chip && strip.scrollWidth > strip.clientWidth) {
        strip.scrollTo({
          left: Math.max(0, chip.offsetLeft - (strip.clientWidth - chip.offsetWidth) / 2),
          behavior: 'smooth'
        });
      }
    }

    // Called straight off the scroll event rather than through a
    // requestAnimationFrame gate: rAF is suspended while a tab is in the
    // background, which leaves a "already queued" flag stuck on and kills the
    // highlight for the rest of the session. update() only reads eleven
    // rectangles and returns early unless the active section changed, so
    // there is nothing here worth deferring.
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', function () { measure(); update(); });
    measure();
    update();
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
    countUp();
    wireSwipeHint();
    wireSim();
    wireGrid();

    function relayout() {
      var used = layoutCards(built);
      el('ss-tl').style.height = Math.max(TL_HEIGHT, used + 40) + 'px';
    }
    relayout();
    window.addEventListener('load', relayout);

    wireTabs('ss-live-tabs');
    wirePageNav();

    // Two indicators from the same source: the absolute area the chart plots,
    // and the share of land area it annotates the endpoints with.
    Promise.all([fetchJSON(FOREST_KM2), fetchJSON(FOREST_PCT)])
      .then(function (r) {
        var pct = {};
        wbSeries(r[1]).forEach(function (p) { pct[p[0]] = p[1]; });
        drawForest(wbSeries(r[0]), pct);
      })
      .catch(forestFailed);

    // One fetch feeds both the station panel and the station map, so the two
    // can never show readings a minute apart.
    fetch(RT_TEMP).then(function (r) { return r.json(); })
      .then(function (payload) {
        try { renderLive(payload); } catch (e) { liveFailed(); }
        try { renderStationMap(payload); } catch (e) { stationMapFailed(); }
      })
      .catch(function () { liveFailed(); stationMapFailed(); });

    fetchJSON('/data/sustainable-singapore.json').then(function (baked) {
      var temp = {};
      SERIES.forEach(function (def) {
        temp[def.key] = (baked[def.key] && baked[def.key].series) || [];
      });
      var state = { temp: temp, land: baked.land.series, live: false };

      // Two legends, one state. The sticky-header one is hidden on phones
      // (its whole grid column is), so the mobile section carries its own.
      buildLegend('ss-legend', function () { drawTemp(state.temp); });

      function paint() {
        drawLand(state.land);
        drawTemp(state.temp);
        drawFreq(state.temp);
        drawProjection(state.temp);
        // Only the failure case is worth a line here. When the refresh worked
        // there is nothing to report: the note sat between two paragraphs of
        // argument and interrupted them to repeat what the source note at the
        // foot of the page already says. A reader looking at stale numbers,
        // though, has no other way to find that out.
        var note = el('ss-tl-note');
        note.textContent = state.live ? ''
          : 'Showing the last saved copy of the data; the live refresh did not complete.';
        note.hidden = state.live;
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
      var note = el('ss-tl-note');
      note.textContent = 'Chart data could not be loaded.';
      note.hidden = false;   // paint() may have hidden it on an earlier pass
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
