/* =============================================================================
   AVAVA Homes & Estates — Real Estate HTML Template
   -----------------------------------------------------------------------------
   Vanilla JavaScript. Every block below is progressive enhancement only: the
   page renders, reads and navigates with JavaScript disabled. Nothing here
   creates content — it only reacts to what is already in the markup.

   01. Helpers
   02. Hero — pointer guide
   03. Hero — ticker & live counter
   04. Hero — featured carousel
   05. Hero — figure count-up
   06. Search bar — mode labels
   07. Process track
   08. Hover readouts (featured, categories, cities, agents, offices)
   09. Desk switcher
   9b. Listing page — filter, sort, paginate
   9ba1. The filter sheet — the dialog, on any page that opens it
   9c. Compact rows — the corner preview
   9d. Map listing — list and map in step
   9e. Map with drawer — the sliding panel
   9f. Mortgage calculator — five sheets of arithmetic
   9g. About — timeline, stamps, portraits
   9h. Agent list — the register
   9i. Pricing — the worked example
   9j. FAQ — search, subjects, accordion
   9k. Agent profile — files, map, money
   9l. Create an account — cards, track, FAQ
   9m. Page not found — the four routes back
   9n. Career — trades, roles, hiring track, apply
   9o. Compare — the bench, the sheet, the cost columns, the verdict
   9p. Home loan process — the run, the stages
   9q. Contacts — offices, live clocks, the map, the routing line
   9r. Journal — sections, pagination, card hover
   9s. Blog single — contents, next cards, the short figure
   9t. Journal v2 — sections and tags composing, sort, pagination
   9u. Journal v2 — the replies
   9v. Homes for sale — tabs, the questions
   9aj. The Refine dropdown — wherever a page carries one
   9ak. User dashboard — timeline, confirmations, alert toggles
   9al. Profile & settings — the brief, the score and every switch
   9am. Saved properties — folders, sorts, selection, comparison
   9an. Saved searches — accordion, simulation, alerts
   9ao. Viewing requests — composed filter, verdict, checklist
   9ap. Price alerts — feed, market chart, rule builder
   9aq. Messages — one open thread, everything to the right follows
   9ar. Documents — register, stages, expiry chart, upload tag
   9as. Sell my home — route, gap, score, proceeds
   9at. Agent desk — queue, day, funnel, twelve weeks
   9au. My listings — picker, price simulator, table
   9av. Add a property — five steps, strength, publish
   9aw. Viewings — the day as a round trip
   9ax. Offers — ladder, strength, the two on one file
   9ay. Enquiries — the unanswered queue, and what the silence costs
   9az. Messages — whose move is it
   9ba. Clients — the book of relationships, and its temperature
   9bb. Performance — three readings, and nothing to edit
   9bc. Desk settings — every control priced, and nothing saved by accident
   9bd. Home detail v5 — the gallery swap
   9be. Portrait cards — the highlight, the filters, the sheets
   9bf. Three views — one result set, three renderings
   9w. Home detail v1 — the gallery, the rooms, the viewing slots
   9x. Home detail v2 — contents by scroll, the gallery, the calculator
   9y. Home detail — the street map (v1—v4)
   9z. Home detail v3 — the media block, the video chapters, the calculator
   9aa. Home detail v4 — the opening frame, the bento, own versus rent
   9ab. New builds — market switch, unit filter, timeline, floor plans
   9ac. Coming soon — countdown, release calendar, watchlist
   9ad. Recently sold — window switch, district chart, sort, timeline
   9ae. For rent — affordability filters, move-in calculator, documents
   9af. Land & plots — plot picker, cost model, permits
   9ag. Commercial — invest/occupy switch, asset picker, register
   9ah. Home detail v5 — rooms, calculator, reviews, review form
   9ai. All properties — directory, letter rail, register, one record
   10. Currency & language switches
   11. Modals
   ========================================================================== */

(function () {
  'use strict';

  /* ==========================================================================
     01. Helpers
     ========================================================================== */

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none)').matches;

  function setText(el, value) { if (el) { el.textContent = value; } }

  /* Same readout printed in more than one place — the blueprint page shows the
     file count both over the chips and over the results. */
  function setTextAll(list, value) {
    list.forEach(function (el) { el.textContent = value; });
  }

  /* Group hover: run `on` when a card is entered, `off` when the group is left. */
  function onGroupHover(group, selector, on, off) {
    if (!group) { return; }
    $$(selector, group).forEach(function (item) {
      item.addEventListener('mouseenter', function () { on(item); });
      item.addEventListener('focus', function () { on(item); });
    });
    group.addEventListener('mouseleave', off);
  }

  /* One basemap for all five map pages, and it is the standard OpenStreetMap
     raster — the same tiles every prototype in `_design/` draws with. It was
     CARTO Dark Matter for a while: on a dark page that reads as consistent,
     but a map is not chrome. Dark Matter drops the greens, the coastlines and
     the road hierarchy that let someone recognise where a property is, which
     is the only job the map has. Owner's call, 9 Aug.

     The page around it stays dark: the plates, the pins and Leaflet's own
     furniture are all on the palette (see the `.leaflet-*` rules in §31), so
     the light tiles sit inside a dark frame rather than fighting it.

     Tiles are the only network dependency in the package; the library itself
     is vendored. */
  var MAP_TILES = {
    dark: {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors'
    }
  };

  /* Rates and symbols live here rather than inside the currency switch: the
     pricing page computes its own figures and has to print them in whatever
     the footer has selected, using the same numbers. */
  var CURRENCY_RATES = { EUR: 1, USD: 1.08, GBP: 0.85 };
  var CURRENCY_SYMBOLS = { EUR: '€', USD: '$', GBP: '£' };

  /* Thousands with a plain space, the way the design writes numbers. */
  function groupDigits(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  /* ==========================================================================
     01a. Preloader

     Tracks how many images have decoded and eases a counter towards that
     figure, then clears on window.load. Two safety nets: the bar never sits at
     100% before the page is actually ready, and a 5-second timeout clears the
     overlay even if an asset never resolves — the page is never left covered.
     ========================================================================== */

  (function preloader() {
    var el = $('#preloader');
    if (!el) { return; }

    var fill = $('[data-preloader-fill]', el);
    var count = $('[data-preloader-count]', el);
    var root = document.documentElement;
    var images = Array.prototype.slice.call(document.images);
    var shown = 0;
    var done = false;
    var timer;

    root.classList.add('is-loading');

    function paint(value) {
      var whole = Math.round(value);
      if (fill) { fill.style.width = whole + '%'; }
      setText(count, (whole < 10 ? '0' : '') + whole);
    }

    function decoded() {
      if (!images.length) { return 100; }
      var ready = images.filter(function (img) { return img.complete; }).length;
      return (ready / images.length) * 100;
    }

    function finish() {
      if (done) { return; }
      done = true;
      window.clearInterval(timer);
      paint(100);
      window.setTimeout(function () {
        el.classList.add('is-done');
        root.classList.remove('is-loading');
      }, prefersReducedMotion ? 0 : 260);
    }

    timer = window.setInterval(function () {
      /* Move forward only, and hold below 100 until the load event fires. */
      shown = Math.min(96, Math.max(shown + 1, Math.min(decoded(), shown + 6)));
      paint(shown);
    }, 60);

    paint(0);

    if (document.readyState === 'complete') {
      finish();
    } else {
      window.addEventListener('load', finish);
    }
    window.setTimeout(finish, 5000);
  }());

  /* ==========================================================================
     02. Hero — pointer guide
     ========================================================================== */

  (function heroGuide() {
    var hero = $('.hero');
    var bg = $('.hero__bg');
    var label = $('[data-guide-label]');
    if (!hero || !bg || isTouch) { return; }

    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      bg.style.setProperty('--gx', (px * 100).toFixed(2) + '%');
      bg.style.setProperty('--gy', (py * 100).toFixed(2) + '%');
      setText(label, 'X ' + Math.round(px * 1920) + ' · Y ' + Math.round(py * 1080));
    });
  }());

  /* ==========================================================================
     03. Hero — ticker & live counter
     ========================================================================== */

  (function ticker() {
    var line = $('[data-ticker]');
    var counters = $$('[data-live-count]');
    var lines = [
      '3 new by the lake today',
      'Avg. €4 210 / m² · +1.8% QoQ',
      '12 open viewings this week'
    ];
    var live = 24128;
    var i = 0;

    if (!line && !counters.length) { return; }

    setInterval(function () {
      i = (i + 1) % lines.length;
      live += Math.floor(Math.random() * 3);

      if (line) {
        line.classList.add('is-fading');
        window.setTimeout(function () {
          setText(line, lines[i]);
          line.classList.remove('is-fading');
        }, prefersReducedMotion ? 0 : 300);
      }
      counters.forEach(function (el) { setText(el, groupDigits(live)); });
      updateResultLine();
    }, 5200);
  }());

  /* ==========================================================================
     04. Hero — featured carousel
     ========================================================================== */

  (function carousel() {
    var root = $('[data-carousel]');
    if (!root) { return; }

    var slides = $$('[data-slide]', root);
    var dots = $$('[data-slide-to]', root);
    var indexLabel = $('[data-carousel-index]', root);
    var current = 0;
    var paused = false;

    function show(n) {
      current = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === current); });
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === current); });
      setText(indexLabel, '0' + (current + 1) + ' / 0' + slides.length);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () { show(Number(dot.getAttribute('data-slide-to'))); });
    });
    root.addEventListener('mouseenter', function () { paused = true; });
    root.addEventListener('mouseleave', function () { paused = false; });

    setInterval(function () { if (!paused) { show(current + 1); } }, 4200);
  }());

  /* ==========================================================================
     05. Hero — figure count-up
     ========================================================================== */

  (function countUp() {
    var figures = $$('[data-count-to]');
    if (!figures.length) { return; }

    if (prefersReducedMotion) { return; }

    var frames = 18;
    var frame = 0;
    var timer = setInterval(function () {
      frame += 1;
      var k = Math.min(1, frame / frames);
      figures.forEach(function (el) {
        setText(el, groupDigits(Number(el.getAttribute('data-count-to')) * k));
      });
      if (frame >= frames) { clearInterval(timer); }
    }, 34);
  }());

  /* ==========================================================================
     06. Search bar — mode labels
     ========================================================================== */

  var priceRanges = {
    buy: ['No limit', 'Up to 500 000', '500 000 — 1 M', '1 M +'],
    sell: ['No limit', 'Up to 500 000', '500 000 — 1 M', '1 M +'],
    new: ['No limit', 'Up to 500 000', '500 000 — 1 M', '1 M +'],
    rent: ['No limit', 'Up to 1 000 / mo', '1 000 — 2 500 / mo', '2 500 + / mo']
  };
  var kickers = {
    buy: 'Buying — 18 402 for sale',
    rent: 'Renting — 5 726 available',
    sell: 'Selling — free valuation in 48 h',
    new: 'New builds — 1 146 units'
  };

  function currentMode() {
    var checked = $('.search__radio:checked');
    return checked ? checked.value : 'buy';
  }

  function updateResultLine() {
    var out = $('[data-result-line]');
    if (!out) { return; }
    var where = $('#f-where');
    var chips = $$('.chip__input:checked').map(function (c) { return c.value; });
    var counter = $('[data-live-count]');
    var count = counter ? counter.textContent : '24 128';

    var parts = [where && where.value ? where.value : 'All cities'];
    if (chips.length) { parts.push(chips.join(' · ')); }
    parts.push(count + ' results');
    setText(out, parts.join(' · '));
  }

  (function searchBar() {
    var radios = $$('.search__radio');
    if (!radios.length) { return; }

    var priceLabel = $('[data-price-label]');
    var priceSelect = $('[data-price-select]');
    var kicker = $('[data-mode-kicker]');

    function sync() {
      var mode = currentMode();
      setText(priceLabel, mode === 'rent' ? 'Rent / month' : 'Price');
      setText(kicker, kickers[mode]);
      if (priceSelect) {
        var keep = priceSelect.selectedIndex;
        priceSelect.innerHTML = '';
        priceRanges[mode].forEach(function (text) {
          var opt = document.createElement('option');
          opt.textContent = text;
          priceSelect.appendChild(opt);
        });
        priceSelect.selectedIndex = keep > -1 ? keep : 0;
      }
      updateResultLine();
    }

    radios.forEach(function (r) { r.addEventListener('change', sync); });
    $$('.chip__input').forEach(function (c) { c.addEventListener('change', updateResultLine); });
    var where = $('#f-where');
    if (where) { where.addEventListener('input', updateResultLine); }
  }());

  /* ==========================================================================
     07. Process track
     ========================================================================== */

  (function processTrack() {
    var track = $('.process');
    if (!track) { return; }

    var steps = $$('.step', track);
    var progress = $('[data-process-progress]', track);
    var label = $('[data-stage-label]');
    var defaultStep = 1;

    function activate(index) {
      steps.forEach(function (s, i) {
        s.classList.toggle('is-active', i === index);
        s.classList.toggle('is-filled', i <= index);
      });
      if (progress) { progress.style.width = (((index + 0.5) / steps.length) * 100).toFixed(1) + '%'; }
      setText(label, steps[index].getAttribute('data-stage'));
    }

    steps.forEach(function (step, i) {
      step.addEventListener('mouseenter', function () { activate(i); });
    });
    track.addEventListener('mouseleave', function () { activate(defaultStep); });
    activate(defaultStep);
  }());

  /* ==========================================================================
     08. Hover readouts
     ========================================================================== */

  /* Featured properties — area + plate label */
  (function bentoReadout() {
    var bento = $('.bento');
    var area = $('[data-bento-area]');
    var label = $('[data-bento-label]');
    if (!bento) { return; }

    onGroupHover(bento, '.frame', function (frame) {
      setText(area, frame.getAttribute('data-area'));
      setText(label, frame.getAttribute('data-label'));
    }, function () {
      setText(area, '880 m²');
      setText(label, 'Plate 07 — five files');
    });
  }());

  /* Categories — price band */
  (function legendBand() {
    var legend = $('.legend');
    if (!legend) { return; }

    var first = $('.legend__card', legend);
    var out = {
      name: $('[data-band-name]'),
      min: $('[data-band-min]'),
      max: $('[data-band-max]'),
      median: $('[data-band-median]'),
      note: $('[data-band-note]'),
      count: $('[data-band-count]'),
      marker: $('[data-band-marker]'),
      label: $('[data-legend-label]')
    };

    function apply(card) {
      setText(out.name, card.getAttribute('data-name'));
      setText(out.min, card.getAttribute('data-min'));
      setText(out.max, card.getAttribute('data-max'));
      setText(out.median, 'median ' + card.getAttribute('data-median'));
      setText(out.note, card.getAttribute('data-note'));
      setText(out.count, card.getAttribute('data-count'));
      setText(out.label, card.getAttribute('data-label'));
      if (out.marker) { out.marker.style.left = card.getAttribute('data-pos'); }
    }

    onGroupHover(legend, '.legend__card', apply, function () { apply(first); });
  }());

  /* Cities — median + listing count */
  (function plateReadout() {
    var plates = $('.plates');
    if (!plates) { return; }

    var first = $('.plate', plates);
    var out = {
      median: $('[data-plate-median]'),
      name: $('[data-plate-name]'),
      count: $('[data-plate-count]'),
      label: $('[data-plate-label]')
    };

    function apply(plate) {
      setText(out.median, plate.getAttribute('data-median'));
      setText(out.name, plate.getAttribute('data-name'));
      setText(out.count, plate.getAttribute('data-count'));
      setText(out.label, plate.getAttribute('data-label'));
    }

    onGroupHover(plates, '.plate', apply, function () { apply(first); });
  }());

  /* Agents — reply time, name and bio */
  (function agentReadout() {
    var agents = $('.agents');
    if (!agents) { return; }

    var first = $('.agent', agents);
    var out = {
      replies: $('[data-agent-replies]'),
      firstName: $('[data-agent-first]'),
      bio: $('[data-agent-bio]')
    };

    function apply(agent) {
      setText(out.replies, agent.getAttribute('data-replies'));
      setText(out.firstName, agent.getAttribute('data-first'));
      setText(out.bio, agent.getAttribute('data-bio'));
    }

    onGroupHover(agents, '.agent', apply, function () { apply(first); });

    /* Filter chips only relabel the header — the filtering itself is CSS. */
    var label = $('[data-agent-label]');
    var counts = { all: 'Four of 1 940 licensed agents' };
    $$('.filters__radio').forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (radio.value === 'all') {
          setText(label, counts.all);
          return;
        }
        var shown = $$('.agent[data-type="' + radio.value + '"]', agents).length;
        var chip = $('label[for="' + radio.id + '"]');
        setText(label, shown + ' agents · ' + (chip ? chip.textContent : radio.value));
      });
    });
  }());

  /* Home 2 — featured strip label */
  (function stripReadout() {
    var strip = $('.strip');
    if (!strip) { return; }
    var first = $('.strip__frame', strip);
    var label = $('[data-strip-label]');
    onGroupHover(strip, '.strip__frame', function (frame) {
      setText(label, frame.getAttribute('data-label'));
    }, function () { setText(label, first.getAttribute('data-label')); });
  }());

  /* Home 2 — development timeline readouts */
  (function devReadout() {
    var rows = $('.dev__rows');
    if (!rows) { return; }

    var first = $('.devrow', rows);
    var out = {
      label: $('[data-dev-label]'),
      name: $('[data-dev-name]'),
      price: $('[data-dev-price]'),
      units: $('[data-dev-units]'),
      note: $('[data-dev-note]'),
      progress: $('[data-dev-progress]'),
      dial: $('[data-dev-dial]')
    };

    function apply(row) {
      var built = row.getAttribute('data-progress');
      setText(out.label, row.getAttribute('data-label'));
      setText(out.name, row.getAttribute('data-name'));
      setText(out.price, row.getAttribute('data-price'));
      setText(out.units, row.getAttribute('data-units'));
      setText(out.note, row.getAttribute('data-note'));
      setText(out.progress, built);
      if (out.dial) {
        out.dial.style.background = 'conic-gradient(var(--accent) 0 ' + built + ', rgba(var(--ink-rgb), 0.14) ' + built + ' 100%)';
      }
    }

    onGroupHover(rows, '.devrow', apply, function () { apply(first); });
    apply(first);
  }());

  /* Home 2 — three routes: label and which total is highlighted */
  (function routeReadout() {
    var routes = $('.routes');
    if (!routes) { return; }

    var first = $('.route', routes);
    var label = $('[data-route-label]');
    var totals = $$('[data-route-total]');

    function apply(route) {
      setText(label, route.getAttribute('data-label'));
      var index = route.getAttribute('data-index');
      totals.forEach(function (t) {
        t.style.color = t.getAttribute('data-route-total') === index ? 'var(--accent)' : '';
      });
    }

    onGroupHover(routes, '.route', apply, function () { apply(first); });
    apply(first);
  }());

  /* Home 2 — closed deals label */
  (function caseReadout() {
    var cases = $('.cases');
    if (!cases) { return; }
    var first = $('.case', cases);
    var label = $('[data-case-label]');
    onGroupHover(cases, '.case', function (item) {
      setText(label, item.getAttribute('data-label'));
    }, function () { setText(label, first.getAttribute('data-label')); });
  }());

  /* Home 3 — route cards drive the two figures in the section head */
  (function r3Readout() {
    var r3 = $('.r3');
    if (!r3) { return; }

    var first = $('.r3__card', r3);
    var out = {
      label: $('[data-r3-label]'),
      count: $('[data-r3-count]'),
      countLabel: $('[data-r3-count-label]'),
      fig: $('[data-r3-fig]'),
      figLabel: $('[data-r3-fig-label]')
    };

    function apply(card) {
      setText(out.label, card.getAttribute('data-label'));
      setText(out.count, card.getAttribute('data-count'));
      setText(out.countLabel, card.getAttribute('data-count-label'));
      setText(out.fig, card.getAttribute('data-fig'));
      setText(out.figLabel, card.getAttribute('data-fig-label'));
    }

    onGroupHover(r3, '.r3__card', apply, function () { apply(first); });
  }());

  /* Home 3 — ledger label */
  (function ledgerReadout() {
    var ledger = $('.ledger');
    if (!ledger) { return; }
    var label = $('[data-ledger-label]');
    onGroupHover(ledger, '.ledger__row', function (row) {
      setText(label, row.getAttribute('data-label'));
    }, function () { setText(label, 'Check 04 / 04'); });
  }());

  /* Home 3 — split viewer: the list on the left drives the frame on the right */
  (function splitViewer() {
    var viewer = $('.viewer');
    if (!viewer) { return; }

    var rows = $$('.vrow', viewer);
    var slides = $$('.viewer__slide', viewer);
    var data = [
      { deal: 'For sale', kind: 'Villa · Lakeside', title: 'Hollow Pine House', beds: '4 bed', baths: '3 bath', area: '340 m²', price: '€2 480 000', perM: '€7 294 / m²' },
      { deal: 'For sale', kind: 'Apartment · Centre', title: 'Lantern House', beds: '2 bed', baths: '2 bath', area: '118 m²', price: '€860 000', perM: '€7 288 / m²' },
      { deal: 'New build', kind: 'Development · Coast', title: 'Solano Residences', beds: '1—3 bed', baths: '1—2 bath', area: 'from 74 m²', price: 'from €540 000', perM: '€6 900 / m²' },
      { deal: 'For sale', kind: 'Penthouse · Hillside', title: 'Ridge Penthouse', beds: '3 bed', baths: '3 bath', area: '240 m²', price: '€1 980 000', perM: '€8 250 / m²' }
    ];
    var out = {
      label: $('[data-sv-label]'),
      label2: $('[data-sv-label-2]'),
      num: $('[data-sv-num]'),
      num2: $('[data-sv-num-2]'),
      dial: $('[data-sv-dial]'),
      tick: $('.viewer__tick', viewer),
      deal: $('[data-sv-deal]'),
      kind: $('[data-sv-kind]'),
      title: $('[data-sv-title]'),
      beds: $('[data-sv-beds]'),
      baths: $('[data-sv-baths]'),
      area: $('[data-sv-area]'),
      price: $('[data-sv-price]'),
      perM: $('[data-sv-perm]')
    };

    function apply(index) {
      var item = data[index];
      if (!item) { return; }
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === index); });
      setText(out.label, rows[index].getAttribute('data-label'));
      setText(out.label2, rows[index].getAttribute('data-label'));
      setText(out.num, '0' + (index + 1));
      setText(out.num2, '0' + (index + 1));
      setText(out.deal, item.deal);
      setText(out.kind, item.kind);
      setText(out.title, item.title);
      setText(out.beds, item.beds);
      setText(out.baths, item.baths);
      setText(out.area, item.area);
      setText(out.perM, item.perM);
      if (out.price) {
        /* keep the currency switch in charge of the number itself */
        var source = $('.vrow__price', rows[index]);
        setText(out.price, source ? source.textContent : item.price);
      }
      if (out.tick) { out.tick.style.width = (34 + index * 10) + 'px'; }
      if (out.dial) {
        var pct = ((index + 1) / data.length * 100) + '%';
        out.dial.style.background = 'conic-gradient(var(--accent) 0 ' + pct + ', rgba(var(--ink-rgb), 0.14) ' + pct + ' 100%)';
      }
    }

    rows.forEach(function (row, i) {
      row.addEventListener('mouseenter', function () { apply(i); });
      row.addEventListener('focus', function () { apply(i); });
    });
    $('.viewer__rows', viewer).addEventListener('mouseleave', function () { apply(0); });
    apply(0);
  }());

  /* Home 3 — rotating reviews */
  (function reviews() {
    var root = $('[data-quotes]');
    if (!root) { return; }

    var quotes = $$('[data-quote]', root);
    var dots = $$('[data-quote-to]', root);
    var label = $('[data-q-label]');
    var counter = $('[data-quote-counter]');
    var file = {
      id: $('[data-q-file]'),
      deal: $('[data-q-deal]'),
      prop: $('[data-q-prop]'),
      meta: $('[data-q-prop-meta]'),
      img: $('[data-q-prop-img]')
    };
    var current = 0;
    var paused = false;

    function show(n) {
      current = (n + quotes.length) % quotes.length;
      var q = quotes[current];
      quotes.forEach(function (el, i) { el.classList.toggle('is-active', i === current); });
      dots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === current);
        d.classList.toggle('is-done', i < current);
      });
      setText(label, q.getAttribute('data-label'));
      setText(file.id, q.getAttribute('data-file'));
      setText(file.deal, q.getAttribute('data-deal'));
      setText(file.prop, q.getAttribute('data-prop'));
      setText(file.meta, q.getAttribute('data-prop-meta'));
      if (file.img) { file.img.src = q.getAttribute('data-prop-img'); }
      setText(counter, '0' + (current + 1) + ' / 0' + quotes.length + (paused ? ' · paused' : ' · rotating'));
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () { show(Number(dot.getAttribute('data-quote-to'))); });
    });
    root.addEventListener('mouseenter', function () {
      paused = true;
      root.classList.add('is-paused');
      setText(counter, 'paused · hover to read');
    });
    root.addEventListener('mouseleave', function () {
      paused = false;
      root.classList.remove('is-paused');
      show(current);
    });

    setInterval(function () { if (!paused) { show(current + 1); } }, 6200);
    show(0);
  }());

  /* Footer office register */
  (function officeReadout() {
    var offices = $('.offices');
    if (!offices) { return; }

    var first = $('.office', offices);
    var out = {
      city: $('[data-office-city]'),
      status: $('[data-office-status]'),
      desk: $('[data-office-desk]')
    };

    function apply(office) {
      setText(out.city, office.getAttribute('data-city'));
      setText(out.status, office.getAttribute('data-status'));
      setText(out.desk, office.getAttribute('data-city'));
    }

    onGroupHover(offices, '.office', apply, function () { apply(first); });
  }());

  /* ==========================================================================
     09. Desk switcher
     ========================================================================== */

  (function desks() {
    var root = $('.desks');
    if (!root) { return; }

    var radios = $$('.desks__radio', root);
    var panels = $$('[data-desk-panel]', root);
    var out = {
      count: $('[data-desk-count]'),
      countLabel: $('[data-desk-count-label]'),
      reply: $('[data-desk-reply]'),
      label: $('[data-desk-label]'),
      dial: $('[data-dial]'),
      dialNum: $('[data-dial-num]')
    };

    function sync() {
      var index = 0;
      radios.forEach(function (r, i) { if (r.checked) { index = i; } });
      var panel = panels[index];
      if (!panel) { return; }
      setText(out.count, panel.getAttribute('data-count'));
      setText(out.countLabel, panel.getAttribute('data-count-label'));
      setText(out.reply, panel.getAttribute('data-reply'));
      setText(out.label, panel.getAttribute('data-label'));
    }

    radios.forEach(function (r) { r.addEventListener('change', sync); });

    /* Step hover fills the dial: 1/3, 2/3, 3/3. */
    $$('.deskstep', root).forEach(function (step) {
      step.addEventListener('mouseenter', function () {
        var list = Array.prototype.slice.call(step.parentNode.children);
        var n = list.indexOf(step) + 1;
        var pct = Math.round((n / list.length) * 100) + '%';
        if (out.dial) {
          out.dial.style.background = 'conic-gradient(var(--accent) 0 ' + pct + ', rgba(var(--ink-rgb), 0.14) ' + pct + ' 100%)';
        }
        setText(out.dialNum, '0' + n + '/' + list.length);
      });
    });

    sync();
  }());

  /* ==========================================================================
     9b. Listing page — filter, sort and paginate

     Every card is in the markup, so with JavaScript off the visitor still sees
     the whole index; this block only narrows and pages it.
     ========================================================================== */

  (function listing() {
    /* A page may carry two renderings of one result set — rows and cards —
       behind a view switch. Only the visible one is ever measured or paged. */
    var grids = $$('[data-grid]');
    if (!grids.length) { return; }

    var VIEW_KEY = 'avava-view';
    var viewInputs = $$('.viewswitch__input');
    var isMobile = function () { return window.matchMedia('(max-width: 767px)').matches; };

    function storedView() {
      try { return localStorage.getItem(VIEW_KEY); } catch (e) { return null; }
    }
    function wantedView() {
      /* Below 768 the page is always cards — the stored choice is kept, not applied. */
      if (isMobile()) { return 'grid'; }
      var checked = viewInputs.filter(function (i) { return i.checked; })[0];
      return checked ? checked.value : 'grid';
    }
    function applyView() {
      if (grids.length < 2) { return; }
      var want = wantedView();
      grids.forEach(function (g) { g.hidden = g.getAttribute('data-view') !== want; });
    }

    function grid() {
      return grids.filter(function (g) { return !g.hidden; })[0] || grids[0];
    }

    /* Cards per sheet follows the breakpoint. Each listing page states its own
       three figures on the grid element, so grid-4 and grid-5 share this code. */
    function perPage() {
      function read(name, fallback) {
        var v = parseInt(grid().getAttribute(name), 10);
        return v > 0 ? v : fallback;
      }
      if (window.matchMedia('(max-width: 767px)').matches) { return read('data-per-page-mobile', 5); }
      if (window.matchMedia('(max-width: 1179px)').matches) { return read('data-per-page-tablet', 6); }
      return read('data-per-page', 8);
    }
    var PER_PAGE = perPage();
    var rail = $('.rail');
    var empty = $('[data-empty]');
    var sortSelect = $('[data-sort]');
    var out = {
      shown: $$('[data-shown-count]'),
      sheet: $$('[data-sheet-label]'),
      pager: $('[data-pager-label]'),
      numbers: $('[data-pager-numbers]'),
      mobile: $('[data-pager-mobile]'),
      prev: $('[data-page-prev]'),
      next: $('[data-page-next]'),
      controls: $('[data-pager-controls]'),
      note: $('[data-mode-note]'),
      priceLabel: $('[data-price-label]'),
      filtersCount: $('[data-filters-count]')
    };
    var page = 0;

    var notes = {
      sale: 'Buying · 18 402 files for sale',
      rent: 'Renting · 5 726 long lets',
      new: 'New builds · 1 146 units',
      sell: 'Selling · free valuation in 48 h'
    };

    function deal() {
      var checked = $('.searchpanel__radio:checked');
      return checked ? checked.value : 'sale';
    }
    function chip() {
      var checked = $('.gchip__input:checked');
      return checked ? checked.value : 'all';
    }

    function checkedValues(sel) {
      return $$(sel).filter(function (i) { return i.checked; }).map(function (i) { return i.value; });
    }

    /* The rail, the chips and the tabs write into one filter set. */
    function railState() {
      if (!rail) { return null; }
      var band = $('.railband__input:checked', rail);
      var bed = $('.railbed__input:checked', rail);
      return {
        types: checkedValues('[data-rail-type]'),
        cities: checkedValues('[data-rail-city]'),
        features: checkedValues('[data-rail-feature]'),
        beds: bed ? Number(bed.value) : 0,
        band: band && band.value !== 'any' ? band.value.split('-').map(Number) : null
      };
    }

    function passesRail(card, st, skip) {
      if (!st) { return true; }
      if (skip !== 'type' && st.types.length && st.types.indexOf(card.getAttribute('data-cat')) < 0) { return false; }
      if (skip !== 'city' && st.cities.length && st.cities.indexOf(card.getAttribute('data-city')) < 0) { return false; }
      if (st.beds && Number(card.getAttribute('data-beds')) < st.beds) { return false; }
      if (st.band) {
        var price = Number(card.getAttribute('data-eur-sort'));
        if (price < st.band[0] || price > st.band[1]) { return false; }
      }
      if (st.features.length) {
        var has = (card.getAttribute('data-features') || '').split(' ');
        for (var i = 0; i < st.features.length; i += 1) {
          if (has.indexOf(st.features[i]) < 0) { return false; }
        }
      }
      return true;
    }

    function passesChip(card, c) {
      if (c === 'all') { return true; }
      if (c === 'new' || c === 'rent') { return card.getAttribute('data-deal') === c; }
      return card.getAttribute('data-cat') === c;
    }

    function matches(card, opts) {
      var o = opts || {};
      var d = deal();
      /* "Sell" is a valuation flow, not a result set — it shows the sale index. */
      var wanted = d === 'sell' ? 'sale' : d;
      if (o.skip !== 'deal' && card.getAttribute('data-deal') !== wanted) { return false; }
      if (!passesChip(card, chip())) { return false; }
      return passesRail(card, railState(), o.skip);
    }

    /* Live counts in the rail recompute from the rest of the filter set. */
    function railCounts() {
      if (!rail) { return; }
      var cards = $$('.gcard, .g5card, .lrow, .mcard, .crow, .mapcard', grid());
      var st = railState();
      $$('[data-count-deal]', rail).forEach(function (el) {
        var want = el.getAttribute('data-count-deal');
        setText(el, String(cards.filter(function (c) {
          return c.getAttribute('data-deal') === want && passesChip(c, chip()) && passesRail(c, st);
        }).length));
      });
      $$('[data-count-type]', rail).forEach(function (el) {
        var want = el.getAttribute('data-count-type');
        setText(el, String(cards.filter(function (c) {
          return c.getAttribute('data-cat') === want && matches(c, { skip: 'type' });
        }).length));
      });
      $$('[data-count-city]', rail).forEach(function (el) {
        var want = el.getAttribute('data-count-city');
        setText(el, String(cards.filter(function (c) {
          return c.getAttribute('data-city') === want && matches(c, { skip: 'city' });
        }).length));
      });
      setText($('[data-rail-price-label]'), deal() === 'rent' ? 'Monthly rent' : 'Asking price');
    }

    /* Rail types and the chip row mirror each other. */
    var syncing = false;
    function railToChip() {
      if (syncing || !rail) { return; }
      syncing = true;
      var types = checkedValues('[data-rail-type]');
      var id = types.length === 1 && (types[0] === 'houses' || types[0] === 'apartments')
        ? 'gc-' + types[0] : 'gc-all';
      var el = document.getElementById(id);
      if (el) { el.checked = true; }
      syncing = false;
    }
    function chipToRail() {
      if (syncing || !rail) { return; }
      syncing = true;
      var c = chip();
      $$('[data-rail-type]').forEach(function (i) {
        i.checked = (c === 'houses' || c === 'apartments') ? i.value === c : false;
      });
      syncing = false;
    }

    function sorted(list) {
      var mode = sortSelect ? sortSelect.value : 'newest';
      var copy = list.slice();
      if (mode === 'price-asc') {
        copy.sort(function (a, b) { return Number(a.getAttribute('data-eur-sort')) - Number(b.getAttribute('data-eur-sort')); });
      } else if (mode === 'price-desc') {
        copy.sort(function (a, b) { return Number(b.getAttribute('data-eur-sort')) - Number(a.getAttribute('data-eur-sort')); });
      } else if (mode === 'area') {
        copy.sort(function (a, b) { return Number(b.getAttribute('data-area')) - Number(a.getAttribute('data-area')); });
      } else {
        copy.sort(function (a, b) { return Number(a.getAttribute('data-index')) - Number(b.getAttribute('data-index')); });
      }
      return copy;
    }

    function word(n) { return n === 1 ? ' file' : ' files'; }

    function buildNumbers(total) {
      if (!out.numbers) { return; }
      out.numbers.innerHTML = '';
      var rail = [];
      var i;
      if (total <= 6) {
        for (i = 1; i <= total; i += 1) { rail.push(i); }
      } else {
        rail = [1, 2, 3, 4, 'gap', total];
      }
      rail.forEach(function (n) {
        if (n === 'gap') {
          var span = document.createElement('span');
          span.className = 'pager__gap';
          span.textContent = '…';
          out.numbers.appendChild(span);
          return;
        }
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pager__num' + (n - 1 === page ? ' is-active' : '');
        btn.textContent = n;
        btn.addEventListener('click', function () { page = n - 1; render(); });
        out.numbers.appendChild(btn);
      });
    }

    function render() {
      /* Page size is derived from the active view and the breakpoint, so it is
         read on every pass rather than captured once. */
      PER_PAGE = perPage();
      var cards = $$('.gcard, .g5card, .lrow, .mcard, .crow, .mapcard', grid());
      var visible = sorted(cards.filter(matches));
      var total = Math.max(1, Math.ceil(visible.length / PER_PAGE));
      if (page > total - 1) { page = total - 1; }
      if (page < 0) { page = 0; }

      var from = page * PER_PAGE;
      var slice = visible.slice(from, from + PER_PAGE);

      cards.forEach(function (card) { card.hidden = true; });
      /* Reorder in the DOM rather than with `order`: the masonry wall is a
         multi-column flow, where `order` has no effect. */
      slice.forEach(function (card) {
        card.hidden = false;
        grid().appendChild(card);
      });

      var first = visible.length ? from + 1 : 0;
      var last = Math.min(visible.length, from + PER_PAGE);

      setTextAll(out.shown, visible.length ? groupDigits(visible.length) + word(visible.length) : 'No files');
      setTextAll(out.sheet, 'sheet ' + (page + 1) + ' of ' + total);
      setText(out.pager, visible.length
        ? 'Showing ' + first + '—' + last + ' of ' + groupDigits(visible.length) + word(visible.length) + ' · sheet ' + (page + 1) + ' of ' + total
        : 'No files on this sheet');
      setText(out.note, notes[deal()]);
      setText(out.priceLabel, deal() === 'rent' ? 'Rent per month' : 'Price');
      setText(out.filtersCount, String(visible.length));

      if (empty) { empty.hidden = visible.length !== 0; }
      if (out.controls) { out.controls.hidden = visible.length === 0; }
      if (out.prev) { out.prev.disabled = page === 0; }
      if (out.next) { out.next.disabled = page >= total - 1; }
      setText(out.mobile, 'page ' + (page + 1) + ' of ' + total);
      railCounts();
      setText($('[data-rail-match]'), groupDigits(visible.length) + word(visible.length));
      setText($('[data-rail-match-2]'), String(visible.length));
      var active = railState();
      setText($('[data-sidebar-count]'), String(active
        ? active.types.length + active.cities.length + active.features.length + (active.beds ? 1 : 0) + (active.band ? 1 : 0)
        : 0));
      buildNumbers(total);

      /* The map page draws its pins from whatever the list is showing, so it
         has to know when that changes. Nothing else listens; if the event has
         no subscriber it costs one dispatch. */
      document.dispatchEvent(new CustomEvent('avava:listing-render', {
        detail: { visible: slice }
      }));
    }

    /* A pin on the map asks for its card: work out which sheet the file is on,
       turn to it, and hand the card back so the map can scroll the list to it.
       The page number lives in this block, so the jump has to happen here. */
    document.addEventListener('avava:focus-card', function (e) {
      var card = e.detail;
      var all = $$('.gcard, .g5card, .lrow, .mcard, .crow, .mapcard', grid());
      var visible = sorted(all.filter(matches));
      var i = visible.indexOf(card);
      if (i < 0) { return; }
      page = Math.floor(i / PER_PAGE);
      render();
    });

    $$('.searchpanel__radio, .gchip__input').forEach(function (input) {
      input.addEventListener('change', function () {
        if (input.classList.contains('gchip__input')) { chipToRail(); }
        page = 0;
        render();
      });
    });

    /* View switch: it owns nothing but `view`. Page size is derived, and the
       page resets because sheet 4 of rows is not sheet 4 of cards. */
    if (viewInputs.length) {
      var saved = storedView();
      if (saved) {
        var savedInput = viewInputs.filter(function (i) { return i.value === saved; })[0];
        if (savedInput) { savedInput.checked = true; }
      }
      viewInputs.forEach(function (input) {
        input.addEventListener('change', function () {
          try { localStorage.setItem(VIEW_KEY, input.value); } catch (e) {}
          page = 0;
          applyView();
          render();
        });
      });
      window.addEventListener('resize', function () {
        applyView();
        render();
      });
      applyView();
    }

    if (rail) {
      $$('input', rail).forEach(function (input) {
        input.addEventListener('change', function () {
          if (input.hasAttribute('data-rail-type')) { railToChip(); }
          page = 0;
          render();
        });
      });

      var railReset = $('[data-rail-reset]', rail);
      if (railReset) {
        railReset.addEventListener('click', function () {
          $$('input[type="checkbox"]', rail).forEach(function (i) { i.checked = false; });
          ['rb-any', 'rbed-any', 'deal-buy', 'gc-all'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) { el.checked = true; }
          });
          page = 0;
          render();
        });
      }

      var openBtn = $('[data-sidebar-open]');
      var closeBtn = $('[data-sidebar-close]', rail);
      if (openBtn) { openBtn.addEventListener('click', function () { rail.classList.add('is-open'); }); }
      if (closeBtn) { closeBtn.addEventListener('click', function () { rail.classList.remove('is-open'); }); }
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { rail.classList.remove('is-open'); }
      });
    }
    if (sortSelect) { sortSelect.addEventListener('change', function () { page = 0; render(); }); }
    if (out.prev) { out.prev.addEventListener('click', function () { page -= 1; render(); }); }
    if (out.next) { out.next.addEventListener('click', function () { page += 1; render(); }); }

    var clear = $('[data-clear-filters]');
    if (clear) {
      clear.addEventListener('click', function () {
        var buy = $('#deal-buy');
        var all = $('#gc-all');
        if (buy) { buy.checked = true; }
        if (all) { all.checked = true; }
        page = 0;
        render();
      });
    }

    /* The dialog runs itself — see the filter-sheet block below. Applying it is the only part the
       register owns, because only the register has results to re-count. */
    var sheet = document.getElementById('filters');
    if (sheet) { sheet.addEventListener('filters:apply', function () { render(); }); }

    window.addEventListener('resize', function () {
      if (perPage() !== PER_PAGE) { page = 0; render(); }
    });

    render();
  }());

  /* ==========================================================================
     9ba1. The filter sheet — the dialog, on any page that opens it

     The dialog is shell furniture: the same 152 lines on every page that opens
     it, and until now its dial, its band histogram and its two buttons were
     wired inside the listing block — so on any page without a results grid the
     sheet opened and then did nothing. It owns itself here instead, and hands
     the register one event to re-render on.

     `Show N files` is the register's number when there is a register. On a page
     that only searches — the three home pages — it reads the live index count,
     because a button that says `Show 33 files` next to `24 128 results` is a
     button nobody believes.
     ========================================================================== */

  (function filterSheet() {
    var sheet = document.getElementById('filters');
    if (!sheet) { return; }

    var bars = $$('.fhist__bar', sheet);
    var span = $('[data-fhist-span]', sheet);
    var bandRanges = [[0, 100], [0, 30], [30, 62], [62, 84], [84, 100]];

    function summary() {
      var band = $('.fband__input:checked', sheet);
      var applied = $$('.fchip__input:checked', sheet).length
        + (band && band.value !== '0' ? 1 : 0)
        + $$('.fcount__input:checked', sheet).filter(function (i) { return !/any/i.test(i.id); }).length;
      var dial = $('[data-filters-dial]', sheet);
      var pct = Math.min(100, applied * 12) + '%';
      setText($('[data-filters-applied]', sheet), String(applied));
      setText($('[data-filters-summary]', sheet), applied
        ? applied + (applied === 1 ? ' criterion' : ' criteria') + ' applied'
        : 'no filters yet');
      if (dial) {
        dial.style.background = 'conic-gradient(var(--accent) 0 ' + pct + ', rgba(var(--ink-rgb), 0.14) ' + pct + ' 100%)';
      }
    }

    function paintBand() {
      var checked = $('.fband__input:checked', sheet);
      var range = bandRanges[checked ? Number(checked.value) : 0];
      bars.forEach(function (bar, i) {
        var pos = (i / Math.max(1, bars.length - 1)) * 100;
        bar.classList.toggle('is-in', pos >= range[0] && pos <= range[1]);
      });
      if (span) {
        span.style.left = range[0] + '%';
        span.style.right = (100 - range[1]) + '%';
      }
    }

    /* Without a register the count is the whole index, which the utility bar
       already carries and keeps ticking. */
    if (!$$('[data-grid]').length) {
      var live = $('[data-live-count]');
      if (live) { setText($('[data-filters-count]', sheet), live.textContent.trim()); }
    }

    var applyBtn = $('[data-filters-apply]', sheet);
    if (applyBtn) {
      applyBtn.addEventListener('click', function () {
        sheet.classList.remove('is-open');
        sheet.dispatchEvent(new CustomEvent('filters:apply', { bubbles: false }));
      });
    }

    var resetBtn = $('[data-filters-reset]', sheet);
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        $$('input[type="checkbox"]', sheet).forEach(function (i) { i.checked = false; });
        ['fb-0', 'fbe-any', 'fba-any', 'fp-any', 'fd-buy'].forEach(function (id) {
          var el = document.getElementById(id);
          if (el) { el.checked = true; }
        });
        $$('input[type="text"]', sheet).forEach(function (i) { i.value = ''; });
        summary();
        paintBand();
      });
    }

    $$('input', sheet).forEach(function (i) { i.addEventListener('change', summary); });
    $$('.fband__input', sheet).forEach(function (i) { i.addEventListener('change', paintBand); });
    $$('.fdeal__input', sheet).forEach(function (i) {
      i.addEventListener('change', function () {
        setText($('[data-fprice-title]', sheet), i.value === 'rent' ? 'Monthly rent' : 'Asking price');
      });
    });

    summary();
    paintBand();
  }());

  /* ==========================================================================
     9c. Compact rows — the corner preview

     The register gives up the photograph to fit fourteen files on a screen, and
     hands it back one row at a time. One card is reused for every row, so only
     the photograph of the line under the cursor is ever fetched — putting a
     card in each row would pull all fourteen images down for nothing.

     Without JavaScript the card stays `hidden` and the table is complete on its
     own; the photograph is the enhancement, not the content.
     ========================================================================== */

  (function rowPreview() {
    var card = $('[data-preview]');
    var body = $('.reg__body');
    if (!card || !body || isTouch) { return; }

    var photo = $('[data-preview-photo]', card);
    var hatch = $('[data-preview-hatch]', card);
    var meta = $('[data-preview-meta]', card);
    var title = $('[data-preview-title]', card);
    var location = $('[data-preview-location]', card);
    var current = null;

    function show(row) {
      if (row === current) { return; }
      current = row;

      var name = $('.crow__link', row);
      var place = $('.crow__location', row);
      var caption = name ? name.textContent : '';

      photo.src = row.getAttribute('data-preview-img');
      photo.alt = place ? caption + ', ' + place.textContent : caption;
      hatch.className = 'preview__hatch preview__hatch--' + row.getAttribute('data-preview-hatch');
      setText(meta, row.getAttribute('data-preview-meta'));
      setText(title, caption);
      setText(location, place ? place.textContent : '');

      card.hidden = false;
      /* Let the browser lay the card out before the transition starts, or the
         first reveal jumps straight to its resting position. */
      window.requestAnimationFrame(function () { card.classList.add('is-shown'); });
    }

    function hide() {
      current = null;
      card.classList.remove('is-shown');
    }

    $$('.crow', body).forEach(function (row) {
      row.addEventListener('mouseenter', function () { show(row); });
      /* Keyboard walks the register too — the link inside the row carries focus. */
      row.addEventListener('focusin', function () { show(row); });
    });

    body.addEventListener('mouseleave', hide);
    body.addEventListener('focusout', function (e) {
      if (!body.contains(e.relatedTarget)) { hide(); }
    });
  }());

  /* ==========================================================================
     9d. Map listing — the list and the map kept in step

     Leaflet ships in assets/vendor/leaflet/ (BSD-2-Clause, see the LICENSE
     beside it) rather than coming off a CDN, so the template works offline.
     Basemap tiles are the one thing here that needs the network; if they never
     arrive the frame stays empty and the list beside it is unaffected.

     Every coordinate is on the card itself as data-lat / data-lng. Swap in your
     own records and the map follows — there is no lookup table in here.
     ========================================================================== */

  (function mapListing() {
    var canvas = $('[data-map]');
    if (!canvas || !window.L) { return; }

    var grid = $('.mapcards');
    var scroller = $('[data-list-scroll]');
    var countOut = $('[data-map-count]');
    var priceOut = $('[data-map-price]');
    /* Half map only: the rail has a status line of its own naming the file the
       map is highlighting. The map page has no such element and skips it. */
    var fileOut = $('[data-rail-file]');

    var TILES = MAP_TILES;

    /* Below this zoom the pins collapse into one chip per city, or a country
       view turns into a pile of overlapping price tags. The threshold is on the
       markup because it depends on how tall the map is: the overhead band is a
       420px letterbox and its chips collide a whole zoom step sooner. */
    function clusterBelow() {
      var attr = window.matchMedia('(max-width: 767px)').matches
        ? canvas.getAttribute('data-cluster-below-mobile')
        : null;
      var value = parseInt(attr || canvas.getAttribute('data-cluster-below'), 10);
      return value > 0 ? value : 9;
    }

    var map = L.map(canvas, { scrollWheelZoom: false, zoomControl: false }).setView([39.6, -3.4], 5);

    /* Карта, созданная в скрытом контейнере, считает свой размер нулевым и
       после показа рисует серый прямоугольник с плитками не на месте. На
       страницах с переключателем видов холст стартует скрытым, поэтому
       пересчитываем размер каждый раз, когда контейнер его меняет. */
    /* Карта, созданная в скрытом контейнере, считает свой размер нулевым:
       плитки не грузятся, а подгонка под границы отрабатывает на нулевом
       холсте, упирается в свой `maxZoom` и уводит все пины на десятки тысяч
       пикселей за кадр. Страницам с переключателем видов нужен способ сказать
       «холст снова настоящий» — вот он. Событие, а не таймер: страница знает
       момент показа точно, а наблюдатель размера — только приблизительно. */
    function refit() {
      if (!canvas.offsetWidth || !canvas.offsetHeight) { return; }
      map.invalidateSize();
      fitted = '';
      draw();
    }

    canvas.addEventListener('avava:refit', refit);

    if (window.ResizeObserver) {
      var lastSize = '';
      var ro = new ResizeObserver(function () {
        if (!canvas.offsetWidth || !canvas.offsetHeight) { return; }
        var size = canvas.offsetWidth + 'x' + canvas.offsetHeight;
        if (size === lastSize) { return; }
        lastSize = size;
        refit();
      });
      ro.observe(canvas);
    }
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    var layer = L.layerGroup().addTo(map);
    var tiles = null;
    var active = null;
    var fitted = '';

    function paintTiles() {
      var t = TILES.dark;
      if (tiles) { map.removeLayer(tiles); }
      tiles = L.tileLayer(t.url, { attribution: t.attribution, maxZoom: 19 }).addTo(map);
    }

    function cards() {
      return $$('.mapcard', grid).filter(function (c) { return !c.hidden; });
    }

    function chip(card, isActive, label, value) {
      var el = document.createElement('div');
      el.className = 'pin' + (isActive ? ' pin--active' : '');
      var small = document.createElement('span');
      small.className = 'pin__label';
      small.textContent = label;
      el.appendChild(small);
      el.appendChild(document.createTextNode(value));
      return L.divIcon({ className: '', html: el.outerHTML, iconSize: null, iconAnchor: [14, 14] });
    }

    function priceOf(card) {
      var el = $('.mapcard__price', card);
      return el ? el.textContent : '';
    }

    /* The rail counts files the way the sheet numbers them: 04, not 4. */
    function pad(n) { return (n < 10 ? '0' : '') + n; }

    /* With nothing hovered the drawer page shows the median of what is on the
       map rather than a dash — an actual listed price, so it stays correct in
       whatever currency the footer is set to. Opt in per page with
       `data-map-price="median"`; elsewhere the slot simply empties. */
    var idleMedian = priceOut && priceOut.getAttribute('data-map-price') === 'median';
    function median(list) {
      if (!list.length) { return '—'; }
      var byPrice = list.slice().sort(function (a, b) {
        return Number(a.getAttribute('data-eur-sort')) - Number(b.getAttribute('data-eur-sort'));
      });
      return priceOf(byPrice[Math.floor(byPrice.length / 2)]);
    }

    function draw() {
      layer.clearLayers();
      var list = cards();
      var zoom = map.getZoom();

      var at = active ? list.indexOf(active) : -1;
      setText(countOut, list.length + ' on this map');
      setText(priceOut, at >= 0 ? priceOf(active) : (idleMedian ? median(list) : '—'));
      setText(fileOut, 'File ' + (at >= 0 ? pad(at + 1) : '—') + ' / ' + pad(list.length));

      if (zoom < clusterBelow()) {
        var byCity = {};
        list.forEach(function (card) {
          var city = card.getAttribute('data-map-city') || 'Other';
          if (!byCity[city]) { byCity[city] = { lat: 0, lng: 0, n: 0, on: false }; }
          var g = byCity[city];
          g.lat += Number(card.getAttribute('data-lat'));
          g.lng += Number(card.getAttribute('data-lng'));
          g.n += 1;
          if (card === active) { g.on = true; }
        });
        Object.keys(byCity).forEach(function (city) {
          var g = byCity[city];
          var at = [g.lat / g.n, g.lng / g.n];
          L.marker(at, {
            icon: chip(null, g.on, city, g.n + (g.n === 1 ? ' file' : ' files')),
            zIndexOffset: g.on ? 1000 : 0,
            /* A cluster is a shortcut into the map, not a listed property. */
            alt: city + ', ' + g.n + ' files'
          }).addTo(layer).on('click', function () {
            map.setView(at, 11, { animate: true });
          });
        });
      } else {
        list.forEach(function (card) {
          var at = [Number(card.getAttribute('data-lat')), Number(card.getAttribute('data-lng'))];
          var title = card.getAttribute('data-map-title');
          var where = card.getAttribute('data-map-location');
          var mk = L.marker(at, {
            icon: chip(card, card === active, card.getAttribute('data-pin'), priceOf(card)),
            zIndexOffset: card === active ? 1000 : 0,
            alt: title + ', ' + where + ', ' + priceOf(card)
          }).addTo(layer);
          mk.bindPopup('<b>' + title + '</b><br>' + where + '<br>' + priceOf(card));
          mk.on('click', function () { focus(card); });
        });
      }

      /* An open drawer covers the right of the frame, so the fit has to keep
         the pins clear of it — otherwise half of them land underneath the
         panel. Zero on the pages that have no drawer. */
      var cover = 0;
      var drawer = $('[data-drawer]');
      if (drawer && drawer.classList.contains('is-open') && drawer.offsetWidth < canvas.offsetWidth) {
        cover = drawer.offsetWidth;
      }

      /* Re-fit only when the set of pins actually changed — otherwise hovering
         a card would nudge the map under the cursor. The drawer's width is part
         of the signature, so opening or closing it re-fits once. */
      var signature = list.map(function (c) { return c.getAttribute('data-pin'); }).join('|') + '@' + cover;
      if (list.length && signature !== fitted) {
        fitted = signature;
        map.fitBounds(L.latLngBounds(list.map(function (c) {
          return [Number(c.getAttribute('data-lat')), Number(c.getAttribute('data-lng'))];
        })), {
          paddingTopLeft: [60, 66],
          paddingBottomRight: [70 + cover, 70],
          maxZoom: 12,
          animate: false
        });
      }
    }

    function setActive(card) {
      if (active === card) { return; }
      if (active) { active.classList.remove('is-active'); }
      active = card;
      if (active) { active.classList.add('is-active'); }
      draw();
    }

    /* A pin asks block 9b to turn to the right sheet, then scrolls the list.
       On the drawer page it also has to ask for the drawer, or the click would
       have nowhere to land. */
    function focus(card) {
      document.dispatchEvent(new CustomEvent('avava:open-drawer'));
      document.dispatchEvent(new CustomEvent('avava:focus-card', { detail: card }));
      setActive(card);
      if (card.hidden) { return; }
      if (scroller) {
        scroller.scrollTop = Math.max(0, card.offsetTop - grid.offsetTop - 12);
      } else {
        /* No inner panel to scroll: on the overhead layout the card is down the
           page, so the page itself has to move. */
        card.scrollIntoView({ block: 'center', behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    }

    grid.addEventListener('mouseover', function (e) {
      var card = e.target.closest ? e.target.closest('.mapcard') : null;
      if (card && !card.hidden) { setActive(card); }
    });
    grid.addEventListener('focusin', function (e) {
      var card = e.target.closest ? e.target.closest('.mapcard') : null;
      if (card && !card.hidden) { setActive(card); }
    });
    grid.addEventListener('mouseleave', function () { setActive(null); });

    map.on('zoomend', draw);
    document.addEventListener('avava:listing-render', draw);
    /* Prices on the pins are the card's own text, so a currency change has to
       redraw them along with everything else. */
    document.addEventListener('avava:currency', draw);

    paintTiles();
    draw();
  }());

  /* ==========================================================================
     9e. Map with drawer — the sliding panel

     The drawer is CSS: a class on the panel and a transform. This block only
     decides when that class is on, keeps the button's label and `aria-expanded`
     honest, and tells the map to re-fit, because an open drawer covers the
     right of the frame.

     Below 768 the same panel is a bottom sheet with three snap points. It can
     be dragged by its handle or stepped through by tapping it; the handle is a
     real 28px target, not the 4px line you see.
     ========================================================================== */

  (function drawer() {
    var panel = $('[data-drawer]');
    if (!panel) { return; }

    var toggles = $$('[data-drawer-toggle]');
    var label = $('[data-drawer-label]');
    var grip = $('.drawer__grip', panel);
    var SNAPS = ['is-peek', 'is-half', 'is-full'];

    function isSheet() { return window.matchMedia('(max-width: 767px)').matches; }
    function isOpen() { return panel.classList.contains('is-open'); }

    function paint() {
      var open = isOpen();
      setText(label, open ? 'Hide files →' : 'Show files ←');
      toggles.forEach(function (b) {
        if (b.hasAttribute('aria-expanded')) { b.setAttribute('aria-expanded', String(open)); }
      });
      /* The map only knows the drawer through the DOM, so nudge it to re-read. */
      document.dispatchEvent(new CustomEvent('avava:listing-render', { detail: {} }));
    }

    function open() {
      panel.classList.add('is-open');
      if (isSheet() && !SNAPS.some(function (c) { return panel.classList.contains(c); })) {
        panel.classList.add('is-half');
      }
      paint();
    }
    function close() {
      panel.classList.remove('is-open');
      SNAPS.forEach(function (c) { panel.classList.remove(c); });
      paint();
    }

    toggles.forEach(function (b) {
      b.addEventListener('click', function () { return isOpen() ? close() : open(); });
    });

    /* It behaves like an overlay panel, so Esc has to close it. */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) { close(); }
    });

    /* A pin was clicked with the drawer shut — it needs somewhere to land. */
    document.addEventListener('avava:open-drawer', function () {
      if (!isOpen()) { open(); }
    });

    /* ---- Bottom sheet: drag the handle, or tap it to step ---------------- */

    function snapIndex() {
      for (var i = 0; i < SNAPS.length; i += 1) {
        if (panel.classList.contains(SNAPS[i])) { return i; }
      }
      return 0;
    }
    function snapTo(i) {
      SNAPS.forEach(function (c) { panel.classList.remove(c); });
      panel.classList.add(SNAPS[Math.max(0, Math.min(SNAPS.length - 1, i))]);
    }

    if (grip) {
      var startY = 0;
      var startIdx = 0;
      var moved = 0;

      grip.addEventListener('pointerdown', function (e) {
        if (!isSheet() || !isOpen()) { return; }
        startY = e.clientY;
        startIdx = snapIndex();
        moved = 0;
        panel.classList.add('is-dragging');
        grip.setPointerCapture(e.pointerId);
      });

      grip.addEventListener('pointermove', function (e) {
        if (!panel.classList.contains('is-dragging')) { return; }
        moved = startY - e.clientY;
        panel.style.transform = 'translateY(calc(' + getSnapOffset(startIdx) + ' - ' + moved + 'px))';
      });

      grip.addEventListener('pointerup', function () {
        if (!panel.classList.contains('is-dragging')) { return; }
        panel.classList.remove('is-dragging');
        panel.style.transform = '';
        /* A short drag is a tap: step up one, and wrap round at the top. */
        if (Math.abs(moved) < 12) {
          snapTo(startIdx >= SNAPS.length - 1 ? 0 : startIdx + 1);
        } else {
          snapTo(startIdx + (moved > 0 ? 1 : -1));
        }
      });

      /* Where the sheet rests at each snap, so a drag can start from there.
         Shares of the sheet's own height, matching the CSS. */
      function getSnapOffset(i) {
        if (i === 2) { return '0px'; }
        if (i === 1) { return '50%'; }
        return 'calc(100% - 120px)';
      }
    }

    /* Crossing the breakpoint changes what "open" means, so restate it. */
    window.addEventListener('resize', function () {
      if (!isSheet()) {
        SNAPS.forEach(function (c) { panel.classList.remove(c); });
      } else if (isOpen() && snapIndex() === 0 && !panel.classList.contains('is-peek')) {
        panel.classList.add('is-half');
      }
    });

    /* Tablet and below the map is the point — the drawer starts out of the way. */
    if (window.matchMedia('(max-width: 1179px)').matches) { close(); } else { paint(); }
  }());

  /* ==========================================================================
     9f. Mortgage calculator — five sheets of arithmetic

     Each sheet owns its own state and its own maths; they deliberately share
     nothing, because someone comparing FHA against VA wants to change one
     without disturbing the other.

     Everything is held in EUR and printed through `money()`, so the footer's
     currency toggle drives every figure on the page the way it drives every
     other page. Nothing has a Calculate button — every keystroke recomputes
     the sheet it was typed into, and only that sheet.
     ========================================================================== */

  (function calculators() {
    var sheets = $$('[data-calc]');
    if (!sheets.length) { return; }

    var rates = { EUR: 1, USD: 1.08, GBP: 0.85 };
    var symbols = { EUR: '€', USD: '$', GBP: '£' };

    function currency() {
      var picked = $('input[name="currency"]:checked');
      return picked && rates[picked.value] ? picked.value : 'EUR';
    }
    function rate() { return rates[currency()]; }

    /* Accept typed thousands separators, and never hand back NaN. */
    function num(value) {
      return parseFloat(String(value).replace(/[^0-9.\-]/g, '')) || 0;
    }
    function money(eur, decimals) {
      var v = eur * rate();
      var whole = decimals ? v.toFixed(decimals) : String(Math.round(v));
      var parts = whole.split('.');
      return symbols[currency()] + groupDigits(Number(parts[0])) + (parts[1] ? '.' + parts[1] : '');
    }
    function pct(v, decimals) { return (Math.round(v * Math.pow(10, decimals || 1)) / Math.pow(10, decimals || 1)) + '%'; }

    /* The standard amortisation every sheet leans on. A zero rate is a real
       input, not an edge case to crash on: the loan simply divides by n. */
    function amortise(principal, annualRate, months) {
      if (months <= 0) { return 0; }
      var r = annualRate / 100 / 12;
      if (r === 0) { return principal / months; }
      return principal * r / (1 - Math.pow(1 + r, -months));
    }

    function build(root) {
      var fields = {};
      $$('[data-field]', root).forEach(function (el) {
        var key = el.getAttribute('data-field');
        if (el.type === 'radio') {
          fields[key] = fields[key] || [];
          fields[key].push(el);
        } else {
          fields[key] = el;
        }
      });

      /* Money fields are typed in the displayed currency and held in EUR. */
      function raw(key) {
        var el = fields[key];
        if (!el) { return 0; }
        if (el.length) {
          var on = el.filter(function (i) { return i.checked; })[0];
          return on ? on.value : el[0].value;
        }
        if (el.type === 'checkbox') { return el.checked; }
        return el.value;
      }
      function eur(key) { return num(raw(key)) / rate(); }
      function plain(key) { return num(raw(key)); }
      function choice(key) { return raw(key); }

      function out(key, text, tone) {
        $$('[data-out="' + key + '"]', root).forEach(function (el) {
          el.textContent = text;
          el.classList.remove('mtotals__value--good', 'mtotals__value--bad');
          if (tone) { el.classList.add('mtotals__value--' + tone); }
        });
      }

      /* The donut is one conic-gradient; the legend drops any component under
         half a unit rather than printing a row of zeroes. */
      function paint(slices, total, keepZeros) {
        var ring = $('[data-donut]', root);
        var at = 0;
        var stops = [];
        slices.forEach(function (s) {
          if (total <= 0) { return; }
          var end = at + (s.value / total) * 100;
          stops.push('var(' + s.colour + ') ' + at.toFixed(2) + '% ' + end.toFixed(2) + '%');
          at = end;
        });
        if (ring) {
          ring.style.background = stops.length
            ? 'conic-gradient(' + stops.join(', ') + ')'
            : 'conic-gradient(var(--line) 0 100%)';
        }
        slices.forEach(function (s) {
          var row = $('[data-legend="' + s.key + '"]', root);
          if (row) { row.hidden = !keepZeros && s.value < 0.5; }
          out('leg-' + s.key, money(s.value));
        });
      }

      /* A tick, a warning or a caution — the mark is the answer, the figure
         beside it is the evidence. */
      function check(key, label, value, state) {
        out('label-' + key, label);
        out('check-' + key, value);
        $$('[data-out="mark-' + key + '"]', root).forEach(function (el) {
          el.textContent = state === 'ok' ? '✓' : '!';
          el.className = 'mcheckrow__mark mcheckrow__mark--' + state;
        });
      }

      /* Balance still owed, one bar a year; the half-term bar is picked out. */
      function curve(principal, annualRate, months) {
        var box = $('[data-curve]', root);
        if (!box) { return; }
        box.innerHTML = '';
        var years = Math.max(1, Math.round(months / 12));
        var r = annualRate / 100 / 12;
        var pay = amortise(principal, annualRate, months);
        var owed = principal;
        for (var y = 1; y <= years; y += 1) {
          for (var m = 0; m < 12 && owed > 0; m += 1) {
            owed = owed + owed * r - pay;
          }
          var bar = document.createElement('span');
          bar.className = 'mcurve__bar' + (y === Math.floor(years / 2) ? ' mcurve__bar--mid' : '');
          bar.style.height = (principal > 0 ? Math.max(2, Math.max(0, owed) / principal * 100) : 2) + '%';
          box.appendChild(bar);
        }
      }

      /* One bar split by where the money goes, with its own key underneath. */
      function split(parts) {
        var bar = $('[data-split]', root);
        var keys = $('[data-split-keys]', root);
        if (!bar || !keys) { return; }
        var sum = parts.reduce(function (a, p) { return a + p.value; }, 0) || 1;
        bar.innerHTML = '';
        keys.innerHTML = '';
        parts.forEach(function (p) {
          if (p.value < 0.5) { return; }
          var slice = document.createElement('span');
          slice.className = 'msplit__slice';
          slice.style.width = (p.value / sum * 100).toFixed(1) + '%';
          slice.style.background = 'var(' + p.colour + ')';
          bar.appendChild(slice);

          var key = document.createElement('span');
          key.className = 'msplit__key';
          var chip = document.createElement('span');
          chip.className = 'msplit__chip';
          chip.style.background = 'var(' + p.colour + ')';
          key.appendChild(chip);
          key.appendChild(document.createTextNode(p.label + ' ' + money(p.value)));
          keys.appendChild(key);
        });
      }

      return { fields: fields, eur: eur, plain: plain, choice: choice, out: out,
               paint: paint, check: check, curve: curve, split: split };
    }

    /* ---- Sheet 01 — mortgage ------------------------------------------- */
    function sheet1(c) {
      var price = c.eur('price');
      var down = c.eur('down');
      var loan = Math.max(0, price - down);
      var months = Number(c.choice('term') || 30) * 12;
      var pi = amortise(loan, c.plain('rate'), months);
      var tax = c.eur('tax') / 12;
      var ins = c.eur('ins') / 12;
      /* Yearly, like the two above it — the field says so. */
      var hoa = c.eur('hoa') / 12;
      /* The most instructive moment on the sheet: PMI disappears at 20% down. */
      var share = price > 0 ? down / price : 0;
      var pmi = share < 0.2 ? loan * 0.008 / 12 : 0;
      var total = pi + tax + ins + hoa + pmi;

      /* The first month's split: what pays the loan down, and what pays for
         the privilege. They are different things, so they get separate rows. */
      var monthRate = c.plain('rate') / 100 / 12;
      var interestPart = Math.min(pi, loan * monthRate);
      var principalPart = Math.max(0, pi - interestPart);

      c.out('pmi', Math.round(pmi * rate()) === 0 ? '0' : money(pmi).replace(symbols[currency()], ''));
      c.out('head', (months / 12) + ' years · ' + c.plain('rate').toFixed(2) + '%');
      c.out('loanhead', 'Loan ' + money(loan));
      c.out('total', money(total));
      c.out('mo-downpct', Math.round(share * 100) + '%');
      c.out('downpct-label', share >= 0.2
        ? Math.round(share * 100) + '% or more · no insurance'
        : Math.round(share * 100) + '% · insurance applies');
      c.out('loanamount', money(loan));
      c.out('interest', money(pi * months - loan));
      c.out('cost', money(loan + (pi * months - loan)));
      c.out('payoff', 'paid off in ' + (months / 12) + ' years');
      c.out('curve-end', 'Year ' + (months / 12));
      /* Each yearly cost also says what it comes to a month. */
      c.out('mo-tax', money(tax) + ' / mo');
      c.out('mo-ins', money(ins) + ' / mo');
      c.out('mo-hoa', money(hoa) + ' / mo');
      c.out('mo-pmi', money(pmi) + ' / mo');
      c.out('rate-label', c.plain('rate').toFixed(2) + '%');
      c.curve(loan, c.plain('rate'), months);
      c.paint([
        { key: 'principal', value: principalPart, colour: '--accent' },
        { key: 'interest', value: interestPart, colour: '--ink-muted' },
        { key: 'tax', value: tax, colour: '--line-strong' },
        { key: 'ins', value: ins, colour: '--accent-soft' },
        { key: 'hoa', value: hoa, colour: '--line' },
        { key: 'pmi', value: pmi, colour: '--bad' }
      ], total);
    }

    /* ---- Sheet 02 — FHA ------------------------------------------------- */
    function sheet2(c, root) {
      var price = c.eur('price');
      /* The credit band sets the floor: 3.5% down at 580 and above, 10% below. */
      var band = Number(c.choice('band') || 580);
      var minPct = band >= 580 ? 3.5 : 10;
      var down = c.eur('down');
      var downPct = price > 0 ? down / price * 100 : 0;
      var floor = price * minPct / 100;

      var base = Math.max(0, price - down);
      var upfront = base * 0.0175;          /* UFMIP, financed into the loan */
      var loan = base + upfront;
      var months = Number(c.choice('term') || 30) * 12;
      var pi = amortise(loan, c.plain('rate'), months);
      var MIP_RATE = 0.55;
      var mip = loan * (MIP_RATE / 100) / 12;
      var tax = c.eur('tax') / 12;
      var ins = c.eur('ins') / 12;
      var hoa = c.eur('hoa');               /* per month on this sheet */
      var total = pi + mip + tax + ins + hoa;

      c.out('head', 'MIP ' + MIP_RATE + '% / yr · UFMIP 1.75%');
      c.out('total', money(total));
      c.out('mo-downpct', downPct.toFixed(1) + '%');
      c.out('downpct-label', downPct >= minPct
        ? 'meets the ' + minPct + '% minimum'
        : 'below the ' + minPct + '% minimum');
      c.out('minnote', money(floor));
      c.out('rate-label', c.plain('rate').toFixed(3) + '%');
      c.out('ufmip', money(upfront).replace(symbols[currency()], ''));
      c.out('mo-ufmiprate', '1.75%');
      c.out('mo-tax', money(tax) + ' / mo');
      c.out('mo-ins', money(ins) + ' / mo');
      c.out('mo-hoa', money(hoa) + ' / mo');

      c.out('baseloan', money(base));
      c.out('loan', money(loan));
      c.out('interest', money(pi * months - loan));
      c.out('miptotal', money(mip * months));

      c.paint([
        { key: 'pi', value: pi, colour: '--accent' },
        { key: 'mip', value: mip, colour: '--accent-soft' },
        { key: 'tax', value: tax, colour: '--ink-muted' },
        { key: 'ins', value: ins, colour: '--line-strong' },
        { key: 'hoa', value: hoa, colour: '--line' }
      ], total, true);

      var ceiling = 498257;
      c.check('min', 'Down payment vs FHA minimum',
        downPct.toFixed(1) + '% / ' + minPct + '%', downPct >= minPct ? 'ok' : 'warn');
      c.check('limit', 'Loan under the county limit',
        loan < ceiling ? 'Under ' + money(ceiling) : 'Over the limit', loan < ceiling ? 'ok' : 'warn');
      /* Ten per cent down is the line where the annual premium stops after
         eleven years instead of running for the life of the loan. */
      c.check('mipfor', 'MIP payable for',
        downPct >= 10 ? '11 years' : 'Life of loan', downPct >= 10 ? 'ok' : 'soft');
      c.check('occupancy', 'Occupancy', 'Primary residence', 'ok');

      var passes = downPct >= minPct && loan < ceiling;
      c.out('okbadge', passes ? 'Passes' : 'Check the flagged line');
      $$('[data-out="okbadge"]', root).forEach(function (el) {
        el.className = 'mchecks__badge' + (passes ? '' : ' mchecks__badge--warn');
      });
    }

    /* ---- Sheet 03 — VA -------------------------------------------------- */
    function sheet3(c, root) {
      var price = c.eur('price');
      var down = c.eur('down');
      var downPct = price > 0 ? down / price * 100 : 0;
      var exempt = c.choice('exempt') === true;
      var first = c.choice('use') !== 'later';
      /* The fee is set by the service record, the deposit, and whether the
         benefit has been used before — not by the lender. */
      var feePct = exempt ? 0
        : downPct >= 10 ? 1.25
          : downPct >= 5 ? 1.5
            : first ? 2.15 : 3.3;
      var base = Math.max(0, price - down);
      var fee = base * feePct / 100;
      var loan = base + fee;                /* the fee is financed */
      var months = Number(c.choice('term') || 30) * 12;
      var rateNow = c.plain('rate');
      var pi = amortise(loan, rateNow, months);
      var tax = c.eur('tax') / 12;
      var ins = c.eur('ins') / 12;
      var hoa = c.eur('hoa');
      /* No monthly mortgage insurance. Ever. That is the whole argument. */
      var total = pi + tax + ins + hoa;

      c.out('head', exempt ? 'Funding fee exempt' : 'Funding fee ' + feePct + '%');
      c.out('total', money(total));
      c.out('mo-downpct', downPct.toFixed(1) + '%');
      c.out('downpct-label', down <= 0 ? 'no deposit required' : downPct.toFixed(1) + '% down');
      c.out('rate-label', rateNow.toFixed(3) + '%');
      c.out('fee', money(fee).replace(symbols[currency()], ''));
      c.out('mo-feerate', exempt ? 'exempt' : feePct + '%');
      c.out('mo-tax', money(tax) + ' / mo');
      c.out('mo-ins', money(ins) + ' / mo');
      c.out('mo-hoa', money(hoa) + ' / mo');

      c.out('baseloan', money(base));
      c.out('loan', money(loan));
      c.out('interest', money(pi * months - loan));
      /* The fee rides in the loan, so the only cash at the table is the deposit. */
      c.out('cash', money(down));

      c.paint([
        { key: 'pi', value: pi, colour: '--accent' },
        { key: 'tax', value: tax, colour: '--ink-muted' },
        { key: 'ins', value: ins, colour: '--line-strong' },
        { key: 'hoa', value: hoa, colour: '--line' }
      ], total, true);

      /* The table shows every band, and marks the one this deposit lands in —
         so the next threshold worth reaching is visible. */
      var band = exempt ? null
        : downPct >= 10 ? 'ten'
          : downPct >= 5 ? 'five'
            : first ? 'first' : 'later';
      $$('[data-fee]', root).forEach(function (row) {
        row.classList.toggle('is-current', row.getAttribute('data-fee') === band);
      });
      c.out('feenote', exempt ? 'exempt' : feePct + '% of the loan');
    }

    /* ---- Sheet 04 — refinance ------------------------------------------- */
    function sheet4(c, root) {
      var oldAmount = c.eur('oldamount');
      var oldTerm = Math.max(1, c.plain('oldterm'));
      var oldPay = amortise(oldAmount, c.plain('oldrate'), oldTerm);
      var monthsPaid = Math.max(0, (new Date().getFullYear() - c.plain('year')) * 12);
      var remaining = Math.max(12, oldTerm - monthsPaid);

      var fees = c.eur('fees');
      var roll = c.choice('roll') === true;
      var newTerm = Math.max(1, c.plain('newterm'));
      var principal = c.eur('newamount') + (roll ? fees : 0);
      var newRate = c.plain('newrate');
      var newPay = amortise(principal, newRate, newTerm);

      var monthly = oldPay - newPay;
      var upfront = roll ? 0 : fees;
      var lifetime = oldPay * remaining - (newPay * newTerm + upfront);
      /* `never` rather than Infinity, and never a negative month count. */
      var breakEven = monthly > 0 ? Math.ceil(upfront / monthly) : null;

      c.out('paid', monthsPaid + ' months paid');
      c.out('feemode', roll ? 'Fees rolled in' : 'Fees paid upfront');
      c.out('mo-ratehint', newRate < c.plain('oldrate') ? 'lower' : newRate > c.plain('oldrate') ? 'higher' : 'the same');
      c.out('oldpay', money(oldPay));
      c.out('newpay', money(newPay));
      c.out('newpay2', money(newPay));
      c.out('saving', (monthly >= 0 ? '' : '−') + money(Math.abs(monthly)), monthly > 0 ? 'good' : 'bad');
      /* Nothing paid up front means nothing to earn back — "0 mo" is
         arithmetically true and reads like a glitch. */
      c.out('breakeven',
        breakEven === null ? 'never' : breakEven === 0 ? 'at once' : breakEven + ' mo',
        breakEven === null ? 'bad' : null);
      c.out('lifetime', (lifetime >= 0 ? '' : '−') + money(Math.abs(lifetime)), lifetime > 0 ? 'good' : 'bad');
      c.out('paysoff', breakEven === null
        ? 'never pays for itself'
        : breakEven === 0
          ? 'nothing to pay back'
          : 'pays for itself in ' + breakEven + ' month' + (breakEven === 1 ? '' : 's'));
      c.out('story', monthly > 0
        ? 'You would keep ' + money(monthly) + ' a month. ' + (upfront > 0
          ? 'The ' + money(upfront) + ' in fees is repaid after ' + breakEven + ' months; everything after that is yours.'
          : 'The fees are inside the loan, so there is nothing to repay up front.')
        : 'The new payment is higher than the one you have, so there is nothing to break even on. Try a longer term or a lower rate.');

      /* Cumulative saving, one sample a year, capped at 30 points. */
      var plot = $('[data-chart]', root);
      if (!plot) { return; }
      var years = Math.min(30, Math.max(1, Math.round(newTerm / 12)));
      var points = [];
      for (var y = 1; y <= years; y += 1) { points.push(monthly * y * 12 - upfront); }
      var top = Math.max.apply(null, points.concat([0]));
      var bottom = Math.min.apply(null, points.concat([0]));
      var span = (top - bottom) || 1;
      /* The zero line sits where the numbers put it, not at half height. */
      var zero = (top / span) * 100;

      $$('.mchart__bar', plot).forEach(function (b) { b.remove(); });
      points.forEach(function (v) {
        var bar = document.createElement('span');
        bar.className = 'mchart__bar mchart__bar--' + (v >= 0 ? 'pos' : 'neg');
        var fill = document.createElement('span');
        var height = (Math.abs(v) / span) * 100;
        if (v >= 0) {
          fill.style.bottom = (100 - zero) + '%';
          fill.style.height = height + '%';
        } else {
          fill.style.top = zero + '%';
          fill.style.height = height + '%';
        }
        bar.appendChild(fill);
        /* Append, never prepend: the chart runs year 1 on the left to the end
           of the term on the right, and prepending reverses it. The zero line
           and the marker are absolutely positioned, so order does not touch
           them. */
        plot.appendChild(bar);
      });
      var zeroLine = $('[data-chart-zero]', plot);
      if (zeroLine) { zeroLine.style.top = zero + '%'; }
      var mark = $('[data-chart-mark]', plot);
      if (mark) {
        var at = breakEven === null ? 100 : (breakEven / 12 / years) * 100;
        mark.hidden = breakEven === null;
        /* Clamped so the marker never clips off either end. */
        mark.style.left = Math.max(7, Math.min(94, at)) + '%';
      }
      c.out('chart-from', 'Year 1');
      c.out('chart-mid', 'Year ' + Math.max(1, Math.round(years / 2)));
      c.out('chart-to', 'Year ' + years);
    }

    /* ---- Sheet 05 — affordability --------------------------------------- */
    function sheet5(c) {
      var monthlyIncome = c.eur('income') / 12;
      var dti = c.plain('dti') || 36;
      var debts = c.eur('debts');
      var capacity = monthlyIncome * dti / 100 - debts;
      var withPmi = c.choice('pmi') === true;
      var withEscrow = c.choice('escrow') === true;
      var savings = c.eur('savings');
      var years = 30;
      var months = years * 12;
      var annualRate = c.plain('rate');
      var r = annualRate / 100 / 12;
      /* Property tax is a rate on the price here, not a flat sum — so it grows
         with the house and has to be solved for alongside the loan. */
      var taxRate = c.plain('taxrate') / 100;
      var insMonthly = withEscrow ? c.eur('ins') / 12 : 0;

      c.out('tog-pmi', withPmi ? '0.8% / yr' : 'off');
      c.out('tog-escrow', withEscrow ? 'in escrow' : 'off');
      c.out('dtihead', 'DTI ' + Math.round(dti) + '%');
      c.out('dti-label', Math.round(dti) + '%');
      c.out('terms', 'at ' + annualRate + '% over ' + years + ' years');

      function payFor(price) {
        var loan = Math.max(0, price - savings);
        var pi = amortise(loan, annualRate, months);
        var tax = withEscrow ? price * taxRate / 12 : 0;
        var pmi = (withPmi && price > 0 && savings / price < 0.2) ? loan * 0.008 / 12 : 0;
        return { loan: loan, pi: pi, tax: tax, ins: insMonthly, pmi: pmi,
                 total: pi + tax + insMonthly + pmi };
      }

      /* The price is not a closed form once tax and PMI ride on it, so close in
         on it: twenty halvings put us well inside a euro. */
      function priceFor(budget) {
        if (budget <= 0) { return 0; }
        var lo = 0, hi = Math.max(savings, 1) + budget * months;
        for (var i = 0; i < 40; i += 1) {
          var mid = (lo + hi) / 2;
          if (payFor(mid).total > budget) { hi = mid; } else { lo = mid; }
        }
        return lo;
      }

      /* Rounded down to the whole unit, not to the nearest thousand: the figure
         is the answer to an arithmetic question and reads as one. */
      var ceiling = Math.round(priceFor(capacity));
      /* Where a conservative lender would still be comfortable. */
      var comfort = Math.round(priceFor(monthlyIncome * 0.28 - debts));

      if (ceiling <= 0) {
        c.out('price', money(0));
        c.out('scale-mid', '—');
        c.out('ceiling', money(0));
        c.out('payment', '—');
        c.out('payment2', '—');
        c.out('loan', '—');
        c.out('share', '—');
        c.out('left', money(Math.max(0, monthlyIncome - debts)));
        c.out('permonth', '—');
        c.out('story', 'The debts you already carry use up the whole allowance at this ratio. Clear some of them, or raise the ceiling, before a lender will look at a mortgage.');
        c.split([]);
        return;
      }

      c.out('price', money(ceiling));
      c.out('ceiling', money(ceiling));
      c.out('scale-mid', money(Math.max(0, comfort)));

      var at = Math.max(0, Math.min(100, c.plain('marker')));
      var tryPrice = ceiling * at / 100;
      var p = payFor(tryPrice);
      var share = monthlyIncome > 0 ? p.total / monthlyIncome * 100 : 0;

      c.out('payment', money(p.total));
      c.out('payment2', money(p.total));
      c.out('loan', money(p.loan));
      c.out('share', Math.round(share) + '%');
      c.out('left', money(Math.max(0, monthlyIncome - p.total - debts)));
      c.out('permonth', money(p.total) + ' / mo');
      c.out('mo-downpct', tryPrice > 0 ? Math.round(savings / tryPrice * 100) + '%' : '—');

      var load = capacity > 0 ? p.total / capacity : 2;
      c.out('story', load > 1
        ? 'At ' + money(tryPrice) + ' the payment is past what this ratio allows.'
        : load > 0.9
          ? 'At ' + money(tryPrice) + ' the payment is at the top of what a lender will approve.'
          : 'At ' + money(tryPrice) + ' the payment sits comfortably inside the allowance.');

      c.split([
        { label: 'Principal & interest', value: p.pi, colour: '--accent' },
        { label: 'Property tax', value: p.tax, colour: '--ink-muted' },
        { label: 'Insurance', value: p.ins, colour: '--line-strong' },
        { label: 'Mortgage insurance', value: p.pmi, colour: '--accent-soft' }
      ]);
    }

    var runners = { m1: sheet1, m2: sheet2, m3: sheet3, m4: sheet4, m5: sheet5 };

    sheets.forEach(function (root) {
      var id = root.getAttribute('data-calc');
      var run = runners[id];
      if (!run) { return; }
      var c = build(root);

      function recalc() { run(c, root); }

      /* The deposit slider and the deposit field are two views of one number. */
      var share = c.fields.downpct;
      var down = c.fields.down;
      var price = c.fields.price;
      if (share && down && price) {
        share.addEventListener('input', function () {
          down.value = groupDigits(Math.round(num(price.value) * num(share.value) / 100));
          recalc();
        });
        down.addEventListener('input', function () {
          var p = num(price.value);
          share.value = p > 0 ? Math.min(50, Math.round(num(down.value) / p * 100)) : 0;
        });
      }

      $$('[data-field]', root).forEach(function (el) {
        el.addEventListener('input', recalc);
        el.addEventListener('change', recalc);
      });

      /* Money fields are typed in whatever the footer is set to and held in
         EUR, so switching currency has to restate them — the same house, priced
         in another currency, not the same digits meaning a different house.
         The EUR value is cached on each keystroke, because by the time the
         change fires the rate has already moved. */
      var cash = $$('input[data-money]', root);
      function remember() {
        cash.forEach(function (el) { el.dataset.eur = String(num(el.value) / rate()); });
      }
      cash.forEach(function (el) { el.addEventListener('input', remember); });
      remember();

      document.addEventListener('avava:currency', function () {
        cash.forEach(function (el) {
          /* Never rewrite the field being typed in — the caret would jump. */
          if (el === document.activeElement) { return; }
          el.value = groupDigits(Number(el.dataset.eur || 0) * rate());
        });
        $$('[data-symbol]', root).forEach(function (el) { el.textContent = symbols[currency()]; });
        recalc();
      });

      recalc();
    });
  }());


  /* ==========================================================================
     9g. About — timeline, stamps, portraits

     Three sections, one rule the handoff states once: an active index that
     follows the pointer and resets when the section container is left. All
     three go through `onGroupHover`, so keyboard focus drives them as well.

     Nothing here is required to read the page — every figure these handlers
     move also exists as static text in the markup, and the default state is
     already written into the HTML.
     ========================================================================== */

  /* History — the milestone under the pointer sets the year, the place, the
     file count, and how far along the axis the bars are lit. */
  (function timeline() {
    var root = $('[data-tline]');
    if (!root) { return; }

    var dots = $$('.tline__dot', root);
    var bars = $$('.tline__bar', root);
    var cards = $$('.tcard', root);
    var cardList = $('.tcards', root);
    var out = {
      label: $('[data-tline-label]', root),
      year: $('[data-tline-year]', root),
      place: $('[data-tline-place]', root),
      files: $('[data-tline-files]', root)
    };
    var last = dots.length - 1;

    function apply(index, picked) {
      var dot = dots[index];
      if (!dot) { return; }
      var year = parseInt(dot.getAttribute('data-year'), 10);

      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === index); });
      bars.forEach(function (b) {
        b.classList.toggle('is-lit', parseInt(b.getAttribute('data-year'), 10) <= year);
      });
      cards.forEach(function (c) {
        c.classList.toggle('is-active', c.getAttribute('data-index') === String(index));
      });
      if (cardList) { cardList.classList.toggle('is-picked', picked); }

      setText(out.label, picked
        ? dot.getAttribute('data-year') + ' · ' + dot.getAttribute('data-place')
        : '2011 — 2026 · seven milestones');
      setText(out.year, dot.getAttribute('data-year'));
      setText(out.place, dot.getAttribute('data-place'));
      setText(out.files, dot.getAttribute('data-files'));
    }

    function pick(el) { apply(Number(el.getAttribute('data-index')), true); }

    onGroupHover(root, '.tline__dot', pick, function () { apply(last, false); });
    /* The four summary cards are the same seven milestones, four of them, so
       they drive the axis rather than sitting beside it. */
    onGroupHover(root, '.tcard', pick, function () { apply(last, false); });

    apply(last, false);
  }());

  /* Four stamps — the hovered check straightens, the others dim, and the line
     at the foot changes from what clearing means to why files fail. */
  (function stamps() {
    var root = $('[data-stamps]');
    if (!root) { return; }

    var list = $('.stamps', root);
    var cards = $$('.checkcard', root);
    var rails = $$('.stamps__rail', root);
    var note = $('[data-stamps-note]', root);
    var dot = $('[data-stamps-dot]', root);
    var label = $('[data-stamps-label]', root);
    var restNote = note ? note.textContent : '';

    function apply(card) {
      var index = card.getAttribute('data-index');
      cards.forEach(function (c) { c.classList.toggle('is-active', c === card); });
      rails.forEach(function (r, i) { r.classList.toggle('is-active', String(i) === index); });
      if (list) { list.classList.add('is-picked'); }
      setText(note, card.getAttribute('data-note'));
      setText(label, card.getAttribute('data-label'));
      if (dot) { dot.classList.remove('dot--green'); dot.classList.add('dot--amber'); }
    }

    onGroupHover(root, '.checkcard', apply, function () {
      cards.forEach(function (c) { c.classList.remove('is-active'); });
      rails.forEach(function (r) { r.classList.remove('is-active'); });
      if (list) { list.classList.remove('is-picked'); }
      setText(note, restNote);
      setText(label, 'Four checks · none optional');
      if (dot) { dot.classList.remove('dot--amber'); dot.classList.add('dot--green'); }
    });
  }());

  /* Portrait strip — the active frame widens and opens its detail block; the
     head prints that person's years and licence. */
  (function portraits() {
    var root = $('[data-folk]');
    if (!root) { return; }

    var frames = $$('.folk', root);
    var years = $('[data-folk-years]', root);
    var label = $('[data-folk-label]', root);

    function apply(frame) {
      frames.forEach(function (f) { f.classList.toggle('is-active', f === frame); });
      setText(years, frame.getAttribute('data-years'));
      setText(label, frame.getAttribute('data-label'));
    }

    onGroupHover(root, '.folk', apply, function () { apply(frames[0]); });
  }());


  /* ==========================================================================
     9h. Agent list — the register

     Its own block rather than the shared listing engine: 9b filters property
     cards on deal, category, beds and price, and this page filters people on
     specialisation, city, a free-text match and four sort modes. The page
     carries no `[data-grid]`, so 9b returns before it sees any of this and the
     shared `.pager` hooks are free to reuse.

     Every one of the sixteen agents is in the markup. With the script off the
     visitor still gets the whole register — this only narrows and pages it.
     ========================================================================== */

  (function agentRegister() {
    var grid = $('[data-agents]');
    if (!grid) { return; }

    var cards = $$('.acard', grid);
    var items = cards.map(function (c) { return c.parentNode; });
    var tabs = $$('[data-agent-tab]');
    var search = $('[data-agent-search]');
    var citySel = $('[data-agent-city]');
    var langSel = $('[data-agent-lang]');
    var sortSel = $('[data-agent-sort]');
    var empty = $('[data-agent-empty]');
    var out = {
      count: $('[data-agent-count]'),
      pager: $('[data-pager-label]'),
      numbers: $('[data-pager-numbers]'),
      mobile: $('[data-pager-mobile]'),
      prev: $('[data-page-prev]'),
      next: $('[data-page-next]'),
      controls: $('[data-pager-controls]')
    };
    var tab = 'all';
    var page = 0;

    /* Cards per sheet follows the breakpoint, read on every pass so a resize
       does not leave the page showing twelve cards in one column. */
    function perPage() {
      function read(name, fallback) {
        var v = parseInt(grid.getAttribute(name), 10);
        return v > 0 ? v : fallback;
      }
      if (window.matchMedia('(max-width: 767px)').matches) { return read('data-per-page-mobile', 6); }
      if (window.matchMedia('(max-width: 1179px)').matches) { return read('data-per-page-tablet', 8); }
      return read('data-per-page', 12);
    }

    /* The language select carries full names; the cards carry the codes the
       design prints, so the two are mapped rather than compared. */
    var LANGS = {
      English: 'EN',
      'Español': 'ES',
      'Português': 'PT',
      Italiano: 'IT',
      'Français': 'FR'
    };

    function matches(card) {
      if (tab !== 'all' && card.getAttribute('data-agent-type') !== tab) { return false; }

      if (citySel && citySel.value !== 'All cities'
        && card.getAttribute('data-agent-city') !== citySel.value) { return false; }

      if (langSel && langSel.value !== 'Any language') {
        var code = LANGS[langSel.value];
        if (!code || (card.getAttribute('data-agent-langs') || '').indexOf(code) < 0) { return false; }
      }

      /* Free text runs across name, licence and languages, case-insensitive. */
      var q = search ? search.value.trim().toLowerCase() : '';
      if (q) {
        var hay = [
          card.getAttribute('data-agent-name'),
          card.getAttribute('data-agent-licence'),
          card.getAttribute('data-agent-langs')
        ].join(' ').toLowerCase();
        if (hay.indexOf(q) < 0) { return false; }
      }
      return true;
    }

    function sorted(list) {
      var mode = sortSel ? sortSel.value : 'deals';
      var copy = list.slice();
      var num = function (card, name) { return Number(card.getAttribute(name)); };

      if (mode === 'reply') {
        /* `data-reply` is already minutes, so `40 min` and `2 h` compare. */
        copy.sort(function (a, b) { return num(a, 'data-reply') - num(b, 'data-reply'); });
      } else if (mode === 'rating') {
        copy.sort(function (a, b) { return num(b, 'data-rating') - num(a, 'data-rating'); });
      } else if (mode === 'years') {
        copy.sort(function (a, b) { return num(b, 'data-years') - num(a, 'data-years'); });
      } else {
        copy.sort(function (a, b) { return num(b, 'data-deals') - num(a, 'data-deals'); });
      }
      return copy;
    }

    function buildNumbers(total) {
      if (!out.numbers) { return; }
      out.numbers.innerHTML = '';
      for (var n = 1; n <= total; n += 1) {
        (function (value) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'pager__num' + (value - 1 === page ? ' is-active' : '');
          btn.textContent = value;
          btn.addEventListener('click', function () { page = value - 1; render(); });
          out.numbers.appendChild(btn);
        }(n));
      }
    }

    function render() {
      var per = perPage();
      var visible = sorted(cards.filter(matches));
      var total = Math.max(1, Math.ceil(visible.length / per));
      if (page > total - 1) { page = total - 1; }
      if (page < 0) { page = 0; }

      var from = page * per;
      var slice = visible.slice(from, from + per);

      items.forEach(function (li) { li.hidden = true; });
      /* Reorder in the DOM rather than with `order`: the sort has to survive
         being read out by a screen reader, not only look right. */
      slice.forEach(function (card) {
        card.parentNode.hidden = false;
        grid.appendChild(card.parentNode);
      });

      setText(out.count, visible.length + ' of 1 940 agents');
      setText(out.pager, visible.length
        ? 'Showing ' + (from + 1) + '—' + Math.min(visible.length, from + per) + ' of ' + visible.length + ' agents'
        : 'No agents match');
      setText(out.mobile, 'page ' + (page + 1) + ' of ' + total);

      if (empty) { empty.hidden = visible.length !== 0; }
      if (out.controls) { out.controls.hidden = visible.length === 0; }
      if (out.prev) { out.prev.disabled = page === 0; }
      if (out.next) { out.next.disabled = page >= total - 1; }
      buildNumbers(total);
    }

    tabs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        tab = btn.getAttribute('data-agent-tab');
        tabs.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        page = 0;
        render();
      });
    });

    [citySel, langSel, sortSel].forEach(function (el) {
      if (el) { el.addEventListener('change', function () { page = 0; render(); }); }
    });
    if (search) {
      search.addEventListener('input', function () { page = 0; render(); });
    }
    /* The form has no server behind it — Search is what a visitor reaches for
       after typing, so it re-renders instead of navigating away. */
    var form = $('.agbox');
    if (form) {
      form.addEventListener('submit', function (e) { e.preventDefault(); page = 0; render(); });
    }

    if (out.prev) { out.prev.addEventListener('click', function () { page -= 1; render(); }); }
    if (out.next) { out.next.addEventListener('click', function () { page += 1; render(); }); }

    /* Sibling dimming is a class on the grid, so one listener clears it. */
    grid.addEventListener('mouseenter', function () { grid.classList.add('is-picked'); });
    grid.addEventListener('mouseleave', function () { grid.classList.remove('is-picked'); });

    window.addEventListener('resize', render);
    render();
  }());


  /* ==========================================================================
     9i. Pricing — the worked example

     The slider is the page's proof, so every figure moves together on `input`,
     never on release: one lagging number reads as a trick.

     The page is already complete without this block — every figure is printed
     into the markup at the default price of €720 000, so with the script off
     it is still a readable rate card.
     ========================================================================== */

  (function pricing() {
    var slider = $('[data-pr-price]');
    if (!slider) { return; }

    var OURS = 0.014;
    var THEIRS = 0.052;
    /* The saving is converted into something human by dividing by the median
       mortgage payment. Business figure — change it here, not in the copy. */
    var MEDIAN_PAYMENT = 1480;

    var out = {
      headline: $('[data-pr-headline]'),
      priceLabels: $$('[data-pr-price-label]'),
      savings: $$('[data-pr-saving]'),
      months: $('[data-pr-months]'),
      min: $('[data-pr-min]'),
      max: $('[data-pr-max]'),
      breaks: {},
      nets: {}
    };
    $$('[data-pr-break]').forEach(function (el) { out.breaks[el.getAttribute('data-pr-break')] = el; });
    $$('[data-pr-net]').forEach(function (el) { out.nets[el.getAttribute('data-pr-net')] = el; });

    var code = (function () {
      var checked = $('input[name="currency"]:checked');
      return checked ? checked.value : 'EUR';
    }());

    function money(eur) {
      return CURRENCY_SYMBOLS[code] + groupDigits(eur * CURRENCY_RATES[code]);
    }

    /* The headline shortens below €1 M and above it, on the converted value —
       $780 k and €720 k are the same sale described in two currencies. */
    function short(eur) {
      var v = eur * CURRENCY_RATES[code];
      var sym = CURRENCY_SYMBOLS[code];
      if (v >= 1000000) {
        return sym + String((v / 1000000).toFixed(2)).replace(/\.?0+$/, '') + ' M';
      }
      return sym + Math.round(v / 1000) + ' k';
    }

    function render() {
      var price = Number(slider.value);
      var ours = price * OURS;
      var theirs = price * THEIRS;
      var saving = theirs - ours;

      setText(out.headline, short(price));
      setTextAll(out.priceLabels, short(price));
      setTextAll(out.savings, money(saving));
      setText(out.months, Math.max(1, Math.round(saving / MEDIAN_PAYMENT)) + ' months');

      setText(out.breaks.price, money(price));
      setText(out.breaks.ours, '−' + money(ours));
      setText(out.breaks.theirs, '−' + money(theirs));
      setText(out.breaks.saving, money(saving));

      setText(out.nets.ours, money(price - ours));
      setText(out.nets.theirs, money(price - theirs));

      setText(out.min, short(Number(slider.min)));
      setText(out.max, short(Number(slider.max)));
    }

    slider.addEventListener('input', render);

    /* The footer switch rewrites anything carrying `data-eur`; the figures
       here are computed, so they have to be redrawn on the same event. */
    document.addEventListener('avava:currency', function (e) {
      code = e.detail;
      render();
    });

    render();
  }());

  /* Plan cards: the middle plan is the default and the row returns to it,
     never to none — the chosen plan should never look unchosen. */
  (function plans() {
    var row = $('[data-plans]');
    if (!row) { return; }

    var cards = $$('.plan', row);
    var DEFAULT_PLAN = 1;

    function activate(index) {
      cards.forEach(function (c, i) { c.classList.toggle('is-active', i === index); });
    }

    cards.forEach(function (card, i) {
      card.addEventListener('mouseenter', function () { activate(i); });
      var cta = $('.btn', card);
      if (cta) { cta.addEventListener('focus', function () { activate(i); }); }
    });
    row.addEventListener('mouseleave', function () { activate(DEFAULT_PLAN); });

    activate(DEFAULT_PLAN);
  }());


  /* ==========================================================================
     9j. FAQ — search, subjects, accordion

     Every answer is in the markup with `aria-expanded="true"` and no inline
     height, so with the script off the page is twenty-five readable questions
     and answers. This block collapses them on load and takes over from there.

     Panel height is measured from the content (`scrollHeight`) rather than
     pinned to a constant: long answers must not clip and short ones must not
     leave a gap. It is re-measured on resize and after a currency switch,
     because both change how the text wraps.
     ========================================================================== */

  (function faq() {
    var list = $('.qlist');
    if (!list) { return; }

    var rows = $$('.qrow', list);
    var subjects = $$('[data-faq-subject]');
    var search = $('[data-faq-search]');
    var empty = $('[data-faq-empty]');
    var toggleAll = $('[data-faq-toggle-all]');
    var out = {
      count: $('[data-faq-count]'),
      tag: $('[data-faq-tag]'),
      note: $('[data-faq-note]'),
      title: $('[data-faq-title]')
    };
    var subject = 'buying';

    function panelOf(row) { return $('.qrow__panel', row); }
    function buttonOf(row) { return $('.qrow__q', row); }
    function isOpen(row) { return buttonOf(row).getAttribute('aria-expanded') === 'true'; }

    function setOpen(row, open) {
      var panel = panelOf(row);
      buttonOf(row).setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
    }

    /* Re-measure whatever is currently open. Cheap, and it keeps a reflowed
       answer from being cut off half way through a sentence. */
    function remeasure() {
      rows.forEach(function (row) {
        if (!row.hidden && isOpen(row)) {
          panelOf(row).style.maxHeight = panelOf(row).scrollHeight + 'px';
        }
      });
    }

    function query() {
      var q = search ? search.value.trim().toLowerCase() : '';
      /* One character matches almost everything, so searching starts at two. */
      return q.length > 1 ? q : '';
    }

    function visible() {
      return rows.filter(function (row) { return !row.hidden; });
    }

    function syncToggleLabel() {
      if (!toggleAll) { return; }
      var shown = visible();
      var allOpen = shown.length > 0 && shown.every(isOpen);
      setText(toggleAll, allOpen ? 'Collapse all' : 'Expand all');
    }

    function render() {
      var q = query();
      var active = subjects.filter(function (b) {
        return b.getAttribute('data-faq-subject') === subject;
      })[0];

      var shown = 0;
      rows.forEach(function (row) {
        var match = q
          ? (row.getAttribute('data-q').indexOf(q) > -1 || row.getAttribute('data-a').indexOf(q) > -1)
          : row.getAttribute('data-faq-cat') === subject;
        row.hidden = !match;
        if (match) { shown += 1; }
      });

      /* While a search is running the rail stops driving the list, so its
         selection is cleared rather than left pointing at nothing. */
      subjects.forEach(function (b) {
        var on = !q && b === active;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });

      setText(out.count, q ? shown + ' of ' + rows.length + ' answers' : rows.length + ' answers');
      setText(out.tag, q ? 'Search' : 'Subject');
      setText(out.note, q ? shown + ' answers' : active.getAttribute('data-note'));
      setText(out.title, q ? 'Results for “' + search.value.trim() + '”' : active.getAttribute('data-title'));

      if (empty) { empty.hidden = shown !== 0; }
      if (toggleAll) { toggleAll.hidden = shown === 0; }
      remeasure();
      syncToggleLabel();
    }

    rows.forEach(function (row) {
      buttonOf(row).addEventListener('click', function () {
        setOpen(row, !isOpen(row));
        syncToggleLabel();
      });
    });

    subjects.forEach(function (btn) {
      btn.addEventListener('click', function () {
        subject = btn.getAttribute('data-faq-subject');
        /* A clean sheet each time: the search box empties and every open
           answer closes. */
        if (search) { search.value = ''; }
        rows.forEach(function (row) { setOpen(row, false); });
        render();
      });
    });

    if (search) { search.addEventListener('input', render); }
    /* No server behind the form — submitting is just another way to search. */
    var form = $('.faqbar');
    if (form) { form.addEventListener('submit', function (e) { e.preventDefault(); render(); }); }

    if (toggleAll) {
      toggleAll.addEventListener('click', function () {
        var shown = visible();
        var allOpen = shown.length > 0 && shown.every(isOpen);
        shown.forEach(function (row) { setOpen(row, !allOpen); });
        syncToggleLabel();
      });
    }

    window.addEventListener('resize', remeasure);
    /* €240 becomes $259 and the line can rewrap, so the panel is re-measured
       after the footer switch has finished rewriting the text. */
    document.addEventListener('avava:currency', remeasure);

    rows.forEach(function (row) { setOpen(row, false); });
    render();
    /* The first answer of the default subject opens on load so the
       interaction explains itself without a hint. */
    if (visible().length) { setOpen(visible()[0], true); }
    syncToggleLabel();
  }());


  /* ==========================================================================
     9k. Agent profile — files, map, money

     Three small pieces: the deal-type tabs over the live files, the one map,
     and the two money figures the footer's currency switch cannot rewrite on
     its own because they are compound.

     All eight files are in the markup. With the script off the visitor sees
     every one of them rather than four — the tabs narrow, they do not load.
     ========================================================================== */

  /* Live files — the tabs show four of whatever is selected. */
  (function agentFiles() {
    var grid = $('[data-files]');
    if (!grid) { return; }

    var SHOWN = 4;
    var items = $$('.adfiles__item', grid);
    var tabs = $$('[data-file-tab]');
    var note = $('[data-file-note]');

    function render(kind) {
      var seen = 0;
      items.forEach(function (li) {
        var match = kind === 'all' || li.getAttribute('data-file-type') === kind;
        var show = match && seen < SHOWN;
        if (match) { seen += 1; }
        li.hidden = !show;
      });
      setText(note, Math.min(seen, SHOWN) + ' of 34 shown');
      document.dispatchEvent(new CustomEvent('avava:agent-files'));
    }

    tabs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabs.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        /* Changing the set clears the hover state — otherwise a card that is
           no longer under the pointer stays lit. */
        grid.classList.remove('is-picked');
        render(btn.getAttribute('data-file-tab'));
      });
    });

    grid.addEventListener('mouseenter', function () { grid.classList.add('is-picked'); });
    grid.addEventListener('mouseleave', function () { grid.classList.remove('is-picked'); });

    render('all');
  }());

  /* The map: her files as small pins, the office as a plate above them. */
  (function agentMap() {
    var canvas = $('[data-agent-map]');
    if (!canvas || typeof L === 'undefined') { return; }

    var fallback = $('.admap__fallback');
    if (fallback) { fallback.hidden = true; }

    /* scrollWheelZoom off so a page scroll over the map scrolls the page. */
    var map = L.map(canvas, { scrollWheelZoom: false, zoomControl: false })
      .setView([39.462, -0.372], 13);
    /* Bottom right, clear of the counter chip in the top-left corner. */
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    var tiles = null;
    function paintTiles() {
      var t = MAP_TILES.dark;
      if (tiles) { map.removeLayer(tiles); }
      tiles = L.tileLayer(t.url, { attribution: t.attribution, maxZoom: 19 }).addTo(map);
    }
    paintTiles();

    var layer = L.layerGroup().addTo(map);
    var bounds = [];

    /* The visual dot stays 9px; the box around it grows so the pin clears a
       44px target without the dot becoming a blob. Width is in the test as
       well as `hover: none` — a narrow window is the case people check. */
    var coarse = isTouch || window.matchMedia('(max-width: 767px)').matches;
    var size = coarse ? 45 : 17;

    $$('.fcard', canvas.closest('main')).forEach(function (card) {
      var lat = Number(card.getAttribute('data-lat'));
      var lng = Number(card.getAttribute('data-lng'));
      if (!lat || !lng) { return; }
      bounds.push([lat, lng]);
      L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'adpin-hit',
          html: '<span class="adpin"></span>',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2]
        })
      }).addTo(layer).bindPopup(card.getAttribute('data-pin-title'));
    });

    var oLat = Number(canvas.getAttribute('data-office-lat'));
    var oLng = Number(canvas.getAttribute('data-office-lng'));
    if (oLat && oLng) {
      bounds.push([oLat, oLng]);
      L.marker([oLat, oLng], {
        icon: L.divIcon({
          className: '',
          html: '<span class="adpin adpin--office">Office</span>',
          iconSize: [64, 22],
          iconAnchor: [32, 11]
        }),
        /* Always above the file pins. */
        zIndexOffset: 900
      }).addTo(layer).bindPopup(canvas.getAttribute('data-office-label'));
    }

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [42, 42], maxZoom: 14 });
    }

    /* The map initialises inside a laid-out grid cell and has to re-measure. */
    window.setTimeout(function () { map.invalidateSize(); }, 200);
    window.addEventListener('resize', function () { map.invalidateSize(); });
  }());

  /* Two figures the footer switch cannot rewrite on its own: the price range
     is two numbers in one string, and both are printed short. */
  (function agentMoney() {
    var range = $('[data-eur-range]');
    if (!range) { return; }

    var pair = range.getAttribute('data-eur-range').split(',').map(Number);

    function short(eur, code) {
      var v = eur * CURRENCY_RATES[code];
      if (v >= 1000000) {
        return String((v / 1000000).toFixed(1)).replace(/\.0$/, '') + ' M';
      }
      return Math.round(v / 1000) + ' k';
    }

    function render(code) {
      setText(range, CURRENCY_SYMBOLS[code] + short(pair[0], code) + '—' + short(pair[1], code));
    }

    document.addEventListener('avava:currency', function (e) { render(e.detail); });
    var checked = $('input[name="currency"]:checked');
    render(checked ? checked.value : 'EUR');
  }());


  /* ==========================================================================
     9l. Create an account — cards, track, FAQ

     Nothing here is required to read the page. The benefit cards, the review
     track and the three questions are all fully written in the markup; this
     block only adds the hover states, the track fill and the accordion.

     The refusal notes on steps 02 and 03 are a deliberate exception: they are
     in the DOM at all times and merely faded, never injected, so a screen
     reader reaches them and touch shows them outright.
     ========================================================================== */

  /* Five benefit cards — the header prints which one is under the pointer. */
  (function benefitCards() {
    var grid = $('[data-benefits]');
    if (!grid) { return; }

    var cards = $$('.bcard', grid);
    var note = $('[data-benefit-note]');

    onGroupHover(grid, '.bcard', function (card) {
      var i = cards.indexOf(card);
      cards.forEach(function (c, n) { c.classList.toggle('is-active', n === i); });
      grid.classList.add('is-picked');
      setText(note, '0' + (i + 1) + ' / 0' + cards.length);
    }, function () {
      cards.forEach(function (c) { c.classList.remove('is-active'); });
      grid.classList.remove('is-picked');
      setText(note, 'five of them');
    });
  }());

  /* The review track — the fill runs to the step under the pointer. */
  (function reviewTrack() {
    var track = $('[data-track]');
    if (!track) { return; }

    var steps = $$('.castep', track);
    var fill = $('[data-track-fill]', track);
    var note = $('[data-step-note]');
    var DEFAULT_STEP = 0;

    function activate(index) {
      steps.forEach(function (s, i) {
        s.classList.toggle('is-active', i === index);
        /* Every dot up to and including the active one is filled. */
        s.classList.toggle('is-reached', i <= index);
      });
      if (fill) { fill.style.width = steps[index].getAttribute('data-fill') + '%'; }
      var when = $('.castep__when', steps[index]);
      setText(note, 'step ' + (when ? when.textContent.replace(' · ', ' · ') : ''));
    }

    steps.forEach(function (step, i) {
      step.addEventListener('mouseenter', function () { activate(i); });
    });
    track.addEventListener('mouseleave', function () { activate(DEFAULT_STEP); });

    activate(DEFAULT_STEP);
  }());

  /* Three questions, same accordion as the FAQ page: height measured from the
     content rather than pinned to a constant. */
  (function applyFaq() {
    var list = $('.cafaq__list');
    if (!list) { return; }

    var rows = $$('.cafaq__row', list);

    function panelOf(row) { return $('.cafaq__panel', row); }
    function buttonOf(row) { return $('.cafaq__q', row); }

    function setOpen(row, open) {
      var panel = panelOf(row);
      buttonOf(row).setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
    }

    function remeasure() {
      rows.forEach(function (row) {
        if (buttonOf(row).getAttribute('aria-expanded') === 'true') {
          panelOf(row).style.maxHeight = panelOf(row).scrollHeight + 'px';
        }
      });
    }

    rows.forEach(function (row) {
      buttonOf(row).addEventListener('click', function () {
        setOpen(row, buttonOf(row).getAttribute('aria-expanded') !== 'true');
      });
      setOpen(row, false);
    });

    /* The first and the last open on load: the first explains the accordion,
       the last carries the answer people scroll down for. */
    if (rows.length) {
      setOpen(rows[0], true);
      setOpen(rows[rows.length - 1], true);
    }

    window.addEventListener('resize', remeasure);
  }());

  /* Both calls to action land on the form and put the cursor in the first
     field — a jump that leaves the visitor hunting for the first input is
     half a jump. */
  (function jumpToForm() {
    var jumps = $$('[data-jump]');
    if (!jumps.length) { return; }

    jumps.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var target = document.getElementById((link.getAttribute('href') || '').slice(1));
        if (!target) { return; }
        e.preventDefault();
        target.scrollIntoView({
          block: 'start',
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
        var first = $('input, select, textarea', target);
        if (first) {
          window.setTimeout(function () { first.focus({ preventScroll: true }); },
            prefersReducedMotion ? 0 : 420);
        }
      });
    });
  }());

  /* ==========================================================================
     9m. Page not found — the four routes back

     The only interactive part of the page. Everything else — the reasons, the
     title strip, the three live files — is written into the markup and reads
     with the script off.

     One thing here differs from every other card row in the template: the row
     rests with all four cards at full opacity rather than with the first one
     active. Nothing on a 404 should look pre-selected.
     ========================================================================== */

  (function routesBack() {
    var grid = $('[data-routes]');
    if (!grid) { return; }

    var cards = $$('.nfroute', grid);
    var note = $('[data-route-note]');

    onGroupHover(grid, '.nfroute', function (card) {
      var i = cards.indexOf(card);
      cards.forEach(function (c, n) { c.classList.toggle('is-active', n === i); });
      grid.classList.add('is-picked');
      setText(note, '0' + (i + 1) + ' / 0' + cards.length);
    }, function () {
      cards.forEach(function (c) { c.classList.remove('is-active'); });
      grid.classList.remove('is-picked');
      setText(note, 'four of them');
    });
  }());

  /* ==========================================================================
     9n. Career — trades, roles, hiring track, apply

     Nothing on the page is created here. The seven roles, their panels, the
     four trades, the track and both refusal notes are all in the markup; with
     the script off the page reads as seven fully described jobs, and even the
     department filter still works — it is a radio group the stylesheet reads
     through `:has()`.
     ========================================================================== */

  /* The four trades. The line on the right is rewritten rather than assembled:
     its resting text is the argument and lives in the markup. */
  (function trades() {
    var grid = $('[data-trades]');
    if (!grid) { return; }

    var cards = $$('.jobtrade', grid);
    var note = $('[data-trade-note]');
    var line = $('[data-trade-line]');
    var restingLine = line ? line.textContent : '';

    onGroupHover(grid, '.jobtrade', function (card) {
      var i = cards.indexOf(card);
      cards.forEach(function (c, n) { c.classList.toggle('is-active', n === i); });
      grid.classList.add('is-picked');
      setText(note, '0' + (i + 1) + ' / 0' + cards.length);
      setText(line, $('.jobtrade__title', card).textContent + ': '
        + $('.jobtrade__figure', card).textContent + ' '
        + $('.jobtrade__flabel', card).textContent.toLowerCase() + ', '
        + $('.jobtrade__open', card).textContent.toLowerCase() + ' right now.');
    }, function () {
      cards.forEach(function (c) { c.classList.remove('is-active'); });
      grid.classList.remove('is-picked');
      setText(note, 'four of them');
      setText(line, restingLine);
    });
  }());

  /* The roles list. One panel open at a time, height measured from the content
     rather than pinned to a constant — the descriptions differ by several
     lines and a fixed height would clip the long ones. */
  (function roles() {
    var list = $('.joblist');
    if (!list) { return; }

    var items = $$('.jobitem', list);
    var count = $('[data-role-count]');

    function buttonOf(item) { return $('.jobrow', item); }
    function panelOf(item) { return $('.jobpanel', item); }

    function setOpen(item, open) {
      var panel = panelOf(item);
      buttonOf(item).setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
    }

    function closeAll() {
      items.forEach(function (item) { setOpen(item, false); });
    }

    function shown() {
      return items.filter(function (item) { return item.offsetParent !== null; });
    }

    function tally() {
      setText(count, shown().length + ' of ' + items.length + ' shown');
    }

    items.forEach(function (item) {
      buttonOf(item).addEventListener('click', function () {
        var wasOpen = buttonOf(item).getAttribute('aria-expanded') === 'true';
        closeAll();
        if (!wasOpen) { setOpen(item, true); }
      });
    });

    /* Filtering itself is CSS. The script only keeps the readout honest and
       closes a panel that has just been filtered out from under the reader. */
    $$('.jobfilter__input').forEach(function (input) {
      input.addEventListener('change', function () {
        closeAll();
        tally();
      });
    });

    window.addEventListener('resize', function () {
      items.forEach(function (item) {
        if (buttonOf(item).getAttribute('aria-expanded') === 'true') {
          panelOf(item).style.maxHeight = panelOf(item).scrollHeight + 'px';
        }
      });
    });

    closeAll();
    tally();
  }());

  /* Apply for a specific reference: scroll to the form, preselect the role and
     put the cursor in the first field. Landing on a form with the wrong role
     still selected is worse than not jumping at all. */
  (function applyForRole() {
    var links = $$('[data-apply-ref]');
    if (!links.length) { return; }

    var select = $('[data-ref-select]');
    var form = $('#jobapply');

    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        if (!form) { return; }
        e.preventDefault();

        var ref = link.getAttribute('data-apply-ref');
        if (select) {
          $$('option', select).forEach(function (option) {
            if (option.textContent.indexOf(ref + ' ·') === 0) { select.value = option.value; }
          });
        }

        form.scrollIntoView({
          block: 'start',
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
        var first = $('input, select, textarea', form);
        if (first) {
          window.setTimeout(function () { first.focus({ preventScroll: true }); },
            prefersReducedMotion ? 0 : 420);
        }
      });
    });
  }());

  /* The hiring track. The fill width comes off the dot grid (0/25/50/75%), not
     from hand-tuned percentages, so it always lands on the active dot. */
  (function hiringTrack() {
    var track = $('[data-hire-track]');
    if (!track) { return; }

    var steps = $$('.jobstep', track);
    var fill = $('[data-hire-fill]', track);
    var note = $('[data-hire-note]');
    var DEFAULT_STEP = 0;

    function activate(index) {
      steps.forEach(function (s, i) {
        s.classList.toggle('is-active', i === index);
        s.classList.toggle('is-reached', i <= index);
      });

      /* Horizontal only. Below 768px the track stacks and each step draws its
         own connector in CSS, because the steps are then unequal heights and a
         single percentage bar lands nowhere near the dots. */
      if (fill) { fill.style.width = steps[index].getAttribute('data-fill') + '%'; }

      setText(note, 'Step 0' + (index + 1) + ' / 0' + steps.length + ' · '
        + $('.jobstep__when', steps[index]).textContent.split(' · ')[1]);
    }

    steps.forEach(function (step, i) {
      step.addEventListener('mouseenter', function () { activate(i); });
    });
    track.addEventListener('mouseleave', function () { activate(DEFAULT_STEP); });

    activate(DEFAULT_STEP);
  }());

  /* Money on this page is not the shared `data-eur` shape. A salary band is two
     figures in one string printed in thousands, and the per-kilometre rate has
     to keep its cents — `groupDigits` would round €0.42 to €0. */
  (function careerMoney() {
    var bands = $$('[data-job-range]');
    var rates = $$('[data-job-rate]');
    if (!bands.length && !rates.length) { return; }

    function render(code) {
      var rate = CURRENCY_RATES[code];
      var symbol = CURRENCY_SYMBOLS[code];

      bands.forEach(function (el) {
        var pair = el.getAttribute('data-job-range').split(',');
        setText(el, symbol + Math.round(pair[0] * rate / 1000)
          + '—' + Math.round(pair[1] * rate / 1000) + ' k');
      });

      rates.forEach(function (el) {
        setText(el, symbol + (Number(el.getAttribute('data-job-rate')) * rate).toFixed(2));
      });
    }

    document.addEventListener('avava:currency', function (e) { render(e.detail); });
  }());

  /* ==========================================================================
     9o. Compare — the bench, the sheet, the cost columns, the verdict

     One rule governs this whole block: **derive, never duplicate.** Three bugs
     during design were all the same quantity stored twice, and on a comparison
     page that is not a cosmetic slip — it is the page contradicting itself in
     public. So nothing here reads a printed figure back out of the DOM. The
     scores, the totals and the verdict all come from `data-` numbers.

     Never parse a formatted number: a space is the thousands separator in this
     design, so splitting `€1 340 000` on it yields `€1`.

     Removing a file has to cascade through every block — table cells, checks,
     cost column and ranking, map pin, bench count and the verdict. That
     cascade is the part worth testing.
     ========================================================================== */

  (function compare() {
    var bench = $('.cmpbench');
    if (!bench) { return; }

    var slots = $$('.cmpslot');
    var total = slots.length;
    var gone = {};

    var benchNote = $('[data-cmp-bench-note]');
    var costGrid = $('[data-cmp-costs]');
    var costCols = $$('.cmpcost__col');
    var costNote = $('[data-cmp-cost-note]');
    var verdict = $('[data-cmp-verdict]');
    var verdictText = $('[data-cmp-verdict-text]');
    var verdictTitle = $('[data-cmp-verdict-title]');
    var empty = $('[data-cmp-empty]');
    var gapsOut = $('[data-cmp-gaps]');

    function live() {
      var out = [];
      for (var i = 0; i < total; i++) { if (!gone[i]) { out.push(i); } }
      return out;
    }

    function cellsOf(index) {
      return $$('[data-cmp-col="' + index + '"]');
    }

    /* ---- best in row ----------------------------------------------------
       The mark moves to the best *remaining* file rather than disappearing
       with its column, which is why every scored cell carries a number. */
    function markBest() {
      $$('.cmptable tbody tr').forEach(function (row) {
        var scored = $$('[data-cmp-score]', row);
        if (!scored.length) { return; }

        scored.forEach(function (cell) { cell.classList.remove('is-best'); });
        var sr = $('.sr-only[data-cmp-best-note]', row);
        if (sr) { sr.parentNode.removeChild(sr); }

        var candidates = scored.filter(function (cell) {
          return !gone[Number(cell.getAttribute('data-cmp-col'))];
        });
        /* One file left is not a comparison — no winner is marked. */
        if (candidates.length < 2) { return; }

        var best = candidates[0];
        candidates.forEach(function (cell) {
          if (Number(cell.getAttribute('data-cmp-score'))
            > Number(best.getAttribute('data-cmp-score'))) { best = cell; }
        });
        best.classList.add('is-best');

        /* Colour alone cannot carry the mark. */
        var note = document.createElement('span');
        note.className = 'sr-only';
        note.setAttribute('data-cmp-best-note', '');
        note.textContent = ' — best in row';
        best.appendChild(note);
      });
    }

    /* ---- cost columns ---------------------------------------------------- */
    function rankCosts() {
      var totals = costCols.map(function (col) {
        return Number(col.getAttribute('data-cmp-total'));
      });
      var running = live();
      var cheapest = -1;
      var dearest = -1;
      running.forEach(function (i) {
        if (cheapest < 0 || totals[i] < totals[cheapest]) { cheapest = i; }
        if (dearest < 0 || totals[i] > totals[dearest]) { dearest = i; }
      });

      costCols.forEach(function (col, i) {
        var label = $('[data-cmp-rank]', col);
        col.classList.toggle('is-gone', !!gone[i]);
        label.classList.remove('cmpcost__rank--best', 'cmpcost__rank--worst');
        if (gone[i] || running.length < 2) {
          setText(label, '');
        } else if (i === cheapest) {
          setText(label, 'Cheapest');
          label.classList.add('cmpcost__rank--best');
        } else if (i === dearest) {
          setText(label, 'Dearest');
          label.classList.add('cmpcost__rank--worst');
        } else {
          setText(label, '');
        }
      });
      return { totals: totals, cheapest: cheapest, running: running };
    }

    /* Segment widths are each amount over that file's own total, so they are
       proportions rather than constants and are set here, not in the markup. */
    $$('.cmpbar__seg').forEach(function (seg) {
      seg.style.flexGrow = seg.getAttribute('data-cmp-seg');
    });

    /* ---- the verdict ------------------------------------------------------
       Generated, never authored: the moment a figure above it changes, this
       paragraph has to change with it or the page contradicts itself. */
    var ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
      'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
      'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    var TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy',
      'eighty', 'ninety'];

    function words(n) {
      n = Math.round(n);
      if (n < 20) { return ONES[n]; }
      if (n < 100) {
        return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
      }
      return String(n);
    }

    function currency() {
      var input = $('input[name="currency"]:checked');
      return input ? input.value : 'EUR';
    }

    function money(amount) {
      var code = currency();
      return CURRENCY_SYMBOLS[code] + groupDigits(amount * CURRENCY_RATES[code]);
    }

    function writeVerdict(rank) {
      if (!verdictText) { return; }
      var running = rank.running;
      if (running.length < 2) {
        verdict.hidden = running.length === 0;
        setText(verdictTitle, 'Add a second file to compare.');
        setText(verdictText, 'A verdict needs at least two files on the bench — '
          + 'there is nothing to weigh one against.');
        return;
      }
      verdict.hidden = false;

      var perM2 = [];
      $$('[data-cmp-per-m2]').forEach(function (el) {
        perM2[Number(el.getAttribute('data-cmp-col'))] =
          Number(el.getAttribute('data-cmp-per-m2'));
      });

      var cheapM2 = running[0];
      var dearM2 = running[0];
      running.forEach(function (i) {
        if (perM2[i] < perM2[cheapM2]) { cheapM2 = i; }
        if (perM2[i] > perM2[dearM2]) { dearM2 = i; }
      });

      var ordered = running.slice().sort(function (a, b) {
        return rank.totals[a] - rank.totals[b];
      });
      var gap = rank.totals[ordered[1]] - rank.totals[ordered[0]];
      var pct = Math.round((1 - perM2[cheapM2] / perM2[dearM2]) * 100);

      /* The runner-up is the runner-up on the measure the verdict is about —
         price per m² — not the second cheapest to own. */
      var byArea = running.slice().sort(function (a, b) { return perM2[a] - perM2[b]; });
      var runner = byArea[1];

      var sheet = slots[cheapM2].getAttribute('data-cmp-sheet');
      var against = slots[cheapM2].getAttribute('data-cmp-against');
      var runnerUp = slots[runner].getAttribute('data-cmp-title');
      var runnerFor = slots[runner].getAttribute('data-cmp-for');
      var runnerAgainst = slots[runner].getAttribute('data-cmp-against');

      setText(verdictTitle, slots[cheapM2].getAttribute('data-cmp-title')
        + ' is cheapest per m² — ' + slots[cheapM2].getAttribute('data-cmp-catch'));
      setText(verdictText,
        'Sheet ' + sheet + ' comes in at ' + money(perM2[cheapM2]) + ' / m², '
        + words(pct) + ' per cent under the dearest file here, and it is the cheapest '
        + 'to own over five years by ' + money(gap) + '. Two things to weigh against '
        + 'that: ' + against + '. ' + runnerUp + ' ' + runnerFor + ', but '
        + runnerAgainst + '.');
    }

    /* ---- the cascade ------------------------------------------------------ */
    function render() {
      var running = live();

      slots.forEach(function (slot, i) { slot.classList.toggle('is-gone', !!gone[i]); });

      $$('[data-cmp-col]').forEach(function (el) {
        var i = Number(el.getAttribute('data-cmp-col'));
        el.classList.toggle('is-gone', !!gone[i]);
      });

      /* Cells fall to an em-dash rather than keeping a figure that is no
         longer on the bench. The original is kept on the element so a currency
         change or an undo can put it back. */
      $$('.cmpcell__value, .cmpcheck__text, .cmpcost__total, .cmpline dd').forEach(function (el) {
        var cell = el.closest('[data-cmp-col]');
        if (!cell) { return; }
        var i = Number(cell.getAttribute('data-cmp-col'));
        if (gone[i]) {
          if (!el.hasAttribute('data-cmp-kept')) {
            el.setAttribute('data-cmp-kept', el.textContent);
          }
          el.textContent = '—';
        } else if (el.hasAttribute('data-cmp-kept')) {
          el.textContent = el.getAttribute('data-cmp-kept');
          el.removeAttribute('data-cmp-kept');
        }
      });

      $$('.cmpcheck__mark').forEach(function (mark) {
        var i = Number(mark.closest('[data-cmp-col]').getAttribute('data-cmp-col'));
        if (gone[i]) {
          if (!mark.hasAttribute('data-cmp-kept')) {
            mark.setAttribute('data-cmp-kept', mark.textContent);
          }
          mark.textContent = '–';
        } else if (mark.hasAttribute('data-cmp-kept')) {
          mark.textContent = mark.getAttribute('data-cmp-kept');
          mark.removeAttribute('data-cmp-kept');
        }
      });

      if (gapsOut) {
        var gaps = 0;
        $$('.cmpcheck').forEach(function (cell) {
          var i = Number(cell.getAttribute('data-cmp-col'));
          if (!gone[i] && $('.cmpcheck__mark--no', cell)) { gaps += 1; }
        });
        setText(gapsOut, gaps + (gaps === 1 ? ' gap' : ' gaps'));
      }

      setText(benchNote, running.length + ' of ' + total
        + ' slots used · maximum four');

      markBest();
      writeVerdict(rankCosts());
      drawPins();

      /* Nothing on the bench: the tables are replaced, not rendered empty. */
      if (empty) {
        var blank = running.length === 0;
        empty.hidden = !blank;
        ['.cmpsheet', '.cmpchecks', '.cmpcost', '.cmploc'].forEach(function (sel) {
          var section = $(sel);
          if (section) { section.hidden = blank; }
        });
      }
    }

    /* ---- the map ----------------------------------------------------------
       The listing pages' Leaflet map and their price-pin component, fitted to
       whatever is still on the bench. */
    var pinList = $('[data-cmp-pins]');
    var mapCanvas = $('[data-cmp-map]');
    var map = null;
    var pinLayer = null;

    function drawPins() {
      if (!map || !pinLayer) { return; }
      pinLayer.clearLayers();
      var bounds = [];

      $$('li', pinList).forEach(function (item) {
        var i = Number(item.getAttribute('data-cmp-col'));
        var lat = Number(item.getAttribute('data-lat'));
        var lng = Number(item.getAttribute('data-lng'));
        bounds.push([lat, lng]);

        var el = document.createElement('div');
        el.className = 'pin' + (gone[i] ? ' pin--gone' : '');
        var label = document.createElement('span');
        label.className = 'pin__label';
        label.textContent = item.getAttribute('data-cmp-pin');
        el.appendChild(label);
        el.appendChild(document.createTextNode(
          gone[i] ? '—' : item.getAttribute('data-cmp-price')));

        L.marker([lat, lng], {
          icon: L.divIcon({ className: '', html: el.outerHTML, iconSize: null, iconAnchor: [14, 14] }),
          zIndexOffset: gone[i] ? 0 : 400
        }).addTo(pinLayer);
      });

      if (bounds.length > 1) { map.fitBounds(bounds, { padding: [46, 46], maxZoom: 15 }); }
    }

    if (mapCanvas && typeof L !== 'undefined') {
      pinList.hidden = true;
      /* Wheel over the map scrolls the page, as everywhere else on the site. */
      map = L.map(mapCanvas, { scrollWheelZoom: false, zoomControl: false })
        .setView([39.47, -0.36], 13);
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      var tiles = null;
      var paintTiles = function () {
        var t = MAP_TILES.dark;
        if (tiles) { map.removeLayer(tiles); }
        tiles = L.tileLayer(t.url, { attribution: t.attribution, maxZoom: 19 }).addTo(map);
      };
      paintTiles();

      pinLayer = L.layerGroup().addTo(map);
      window.setTimeout(function () { map.invalidateSize(); drawPins(); }, 200);
      window.addEventListener('resize', function () { map.invalidateSize(); });
    }

    /* ---- controls --------------------------------------------------------- */
    $$('[data-cmp-remove]').forEach(function (button) {
      button.addEventListener('click', function () {
        gone[Number(button.getAttribute('data-cmp-remove'))] = true;
        render();
        writeUrl();
      });
    });

    var clear = $('[data-cmp-clear]');
    if (clear) {
      clear.addEventListener('click', function () {
        for (var i = 0; i < total; i++) { gone[i] = true; }
        render();
        writeUrl();
      });
    }

    /* Differences only. Identical rows leave the DOM rather than being hidden:
       the group's last-row border logic reads the last child, and a hidden row
       would still be it. */
    var diff = $('[data-cmp-diff]');
    var parked = [];
    if (diff) {
      var applyDiff = function (on) {
        diff.setAttribute('aria-checked', on ? 'true' : 'false');
        if (on) {
          $$('[data-cmp-same]').forEach(function (row) {
            parked.push({ row: row, parent: row.parentNode, next: row.nextSibling });
            row.parentNode.removeChild(row);
          });
        } else {
          parked.forEach(function (p) { p.parent.insertBefore(p.row, p.next); });
          parked = [];
        }
        /* Counted, never written: in production the predicate runs over live
           data and the number of identical rows is whatever it turns out to be. */
        setText($('[data-cmp-diff-note]'), on
          ? parked.length + ' identical rows hidden'
          : $$('.cmpsheet .cmprow').length + ' rows across five groups');
      };

      diff.addEventListener('click', function () {
        applyDiff(diff.getAttribute('aria-checked') !== 'true');
      });

      /* On a phone screen space is the scarcest thing, so the switch starts on. */
      if (window.matchMedia('(max-width: 767px)').matches) { applyDiff(true); }
    }

    /* Two files at a time below 768px — capped here, defaulted in the markup so
       the choice survives with no script. */
    var picks = $$('[data-cmp-pick]');
    function applyPicks() {
      var chosen = picks.filter(function (p) { return p.checked; })
        .map(function (p) { return Number(p.getAttribute('data-cmp-pick')); });
      $$('[data-cmp-col]').forEach(function (el) {
        var i = Number(el.getAttribute('data-cmp-col'));
        el.classList.toggle('is-unpicked', chosen.indexOf(i) === -1);
      });
    }
    picks.forEach(function (pick) {
      pick.addEventListener('change', function () {
        var chosen = picks.filter(function (p) { return p.checked; });
        /* Keep exactly two: checking a third releases the oldest. */
        if (chosen.length > 2) {
          chosen[0].checked = false;
        } else if (chosen.length < 2) {
          pick.checked = true;
        }
        applyPicks();
      });
    });
    applyPicks();

    /* ---- cost column hover ------------------------------------------------ */
    if (costGrid) {
      onGroupHover(costGrid, '.cmpcost__col', function (col) {
        var i = Number(col.getAttribute('data-cmp-col'));
        costCols.forEach(function (c, n) { c.classList.toggle('is-active', n === i); });
        costGrid.classList.add('is-picked');
        setText(costNote, slots[i].getAttribute('data-cmp-title'));
      }, function () {
        costCols.forEach(function (c) { c.classList.remove('is-active'); });
        costGrid.classList.remove('is-picked');
        setText(costNote, 'price, tax, interest and running costs');
      });
    }

    /* ---- the share link ---------------------------------------------------
       The bench in the URL: sending a comparison to someone else is what a
       compare page is actually used for. */
    function writeUrl() {
      var keep = live().map(function (i) {
        return slots[i].getAttribute('data-cmp-sheet');
      });
      var query = keep.length && keep.length < total ? '?files=' + keep.join(',') : '';
      window.history.replaceState(null, '', window.location.pathname + query);
    }

    var share = $('[data-cmp-share]');
    if (share) {
      share.addEventListener('click', function (e) {
        e.preventDefault();
        writeUrl();
        var url = window.location.href;
        if (navigator.share) {
          navigator.share({ title: document.title, url: url });
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(url);
          setText(share, 'Link copied');
          window.setTimeout(function () { setText(share, 'Share link'); }, 2000);
        }
      });
    }

    var print = $('[data-cmp-print]');
    if (print) {
      print.addEventListener('click', function (e) { e.preventDefault(); window.print(); });
    }

    /* A shared link arrives with its bench in the query. */
    var wanted = (window.location.search.match(/files=([^&]+)/) || [])[1];
    if (wanted) {
      var list = decodeURIComponent(wanted).split(',');
      slots.forEach(function (slot, i) {
        if (list.indexOf(slot.getAttribute('data-cmp-sheet')) === -1) { gone[i] = true; }
      });
    }

    /* Block 10 rewrites every `data-eur` figure, so the cells that were emptied
       have to be emptied again and the verdict recomputed in the new currency
       — it dispatches this after it has finished drawing. */
    document.addEventListener('avava:currency', function () {
      $$('[data-cmp-kept]').forEach(function (el) { el.removeAttribute('data-cmp-kept'); });
      render();
    });

    render();
  }());

  /* ==========================================================================
     9p. Home loan process — the run, the stages

     Nothing here is required to read the page: all nine stages, their tips and
     their failure shares are in the markup, the market switch is a radio group
     the stylesheet reads, and the rate table is static. Block 9p only makes the
     timeline live and collapses the stage panels.
     ========================================================================== */

  (function loanRun() {
    var track = $('[data-hl-track]');
    if (!track) { return; }

    var nodes = $$('.hlnode', track);
    var fill = $('[data-hl-fill]');
    var note = $('[data-hl-note]');
    var title = $('[data-hl-title]');
    var restNote = note ? note.textContent : '';
    var restTitle = title ? title.textContent : '';

    function activate(index) {
      nodes.forEach(function (n, i) {
        n.classList.toggle('is-active', i === index);
        n.classList.toggle('is-reached', i <= index);
      });
      track.classList.add('is-picked');

      /* i × 100 / 9, off the node grid — never a percentage typed by eye. */
      if (fill) { fill.style.width = (index * (100 / nodes.length)).toFixed(1) + '%'; }

      var node = nodes[index];
      setText(note, 'Stage ' + $('.hlnode__num', node).textContent
        + ' · ' + $('.hlnode__days', node).textContent.replace(' d', ' days'));
      setText(title, $('.hlnode__name', node).textContent + ' — '
        + rowFor(node).getAttribute('data-hl-who').toLowerCase() + ' decides.');
    }

    function reset() {
      nodes.forEach(function (n) { n.classList.remove('is-active', 'is-reached'); });
      track.classList.remove('is-picked');
      if (fill) { fill.style.width = '0%'; }
      setText(note, restNote);
      setText(title, restTitle);
    }

    function rowFor(node) {
      return $('[data-hl-row="' + node.getAttribute('data-hl-stage') + '"]');
    }

    nodes.forEach(function (node, i) {
      node.addEventListener('mouseenter', function () { activate(i); });
      node.addEventListener('focus', function () { activate(i); });
      /* There is no hover on touch, so a tap has to be the way into the stage:
         open its row in the table below and take the reader there. */
      node.addEventListener('click', function () {
        var row = rowFor(node);
        if (!row) { return; }
        var button = $('.hlplus', row);
        if (button.getAttribute('aria-expanded') !== 'true') { button.click(); }
        row.scrollIntoView({
          block: 'center',
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
      });
    });
    track.addEventListener('mouseleave', reset);

    reset();
  }());

  /* The stage table. One panel open at a time, height measured from the
     content — the descriptions differ by several lines and a fixed height
     would clip the long ones. */
  (function loanStages() {
    var table = $('.hltable');
    if (!table) { return; }

    var groups = $$('.hlgroup', table);

    function buttonOf(group) { return $('.hlplus', group); }
    function panelOf(group) { return $('.hlpanel', group); }

    function setOpen(group, open) {
      var panel = panelOf(group);
      buttonOf(group).setAttribute('aria-expanded', open ? 'true' : 'false');
      $('.hlrow', group).classList.toggle('is-open', open);
      group.classList.toggle('is-open', open);
      panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
    }

    function closeAll() {
      groups.forEach(function (group) { setOpen(group, false); });
    }

    groups.forEach(function (group) {
      var button = buttonOf(group);
      button.addEventListener('click', function () {
        var wasOpen = button.getAttribute('aria-expanded') === 'true';
        closeAll();
        if (!wasOpen) { setOpen(group, true); }
      });

      /* The design wants the whole row clickable; the button stays the only
         real control, so the row simply forwards to it. */
      $('.hlrow', group).addEventListener('click', function (e) {
        if (!button.contains(e.target)) { button.click(); }
      });
    });

    window.addEventListener('resize', function () {
      groups.forEach(function (group) {
        if (buttonOf(group).getAttribute('aria-expanded') === 'true') {
          panelOf(group).style.maxHeight = panelOf(group).scrollHeight + 'px';
        }
      });
    });

    closeAll();
  }());

  /* ==========================================================================
     9q. Contacts — offices, live clocks, the map, the routing line

     The open/closed badges and the four clocks are computed here from each
     office's opening hours and IANA time zone. Nothing about them is written
     into the markup, because Porto being shut while the others are open is
     only honest if it is live — and because a badge and a clock that disagree
     is exactly the contradiction this site argues against, so both read the
     same data.

     National holidays travel with the office: a card that says "open" on
     Christmas Day is worse than no status at all. Regional and local days
     still need adding per market.

     With no script the badge shows the opening hours themselves, which are
     true at any hour, and every address, phone number and email is already
     text on the page.
     ========================================================================== */

  (function contacts() {
    var list = $('[data-ct-cards]');
    if (!list) { return; }

    var cards = $$('.ctoffice', list);
    var clocks = $$('.ctclock');
    var mapNote = $('[data-ct-mapnote]');
    var restNote = mapNote ? mapNote.textContent : '';

    /* ---- live status ------------------------------------------------------
       `Intl` does the zone arithmetic; there is no date library on this site
       and this page is not a reason to add one. */
    function partsIn(zone, when) {
      var fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: zone, hour12: false,
        weekday: 'short', hour: '2-digit', minute: '2-digit',
        year: 'numeric', month: '2-digit', day: '2-digit'
      });
      var out = {};
      fmt.formatToParts(when).forEach(function (p) { out[p.type] = p.value; });
      var days = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
      return {
        day: days[out.weekday],
        minutes: Number(out.hour) % 24 * 60 + Number(out.minute),
        clock: (out.hour === '24' ? '00' : out.hour) + ':' + out.minute,
        date: out.year + '-' + out.month + '-' + out.day
      };
    }

    function toMinutes(hhmm) {
      var bits = hhmm.split(':');
      return Number(bits[0]) * 60 + Number(bits[1]);
    }

    /* "1-5:9:00-19:00;6:10:00-14:00" — weekday range, then opening and closing. */
    function ruleFor(rules, day) {
      var found = null;
      rules.split(';').forEach(function (rule) {
        var half = rule.split(':');
        var span = half.shift().split('-');
        var from = Number(span[0]);
        var to = Number(span.length > 1 ? span[1] : span[0]);
        if (day >= from && day <= to) {
          var hours = half.join(':').split('-');
          found = { opens: toMinutes(hours[0]), closes: toMinutes(hours[1]), label: hours[0] };
        }
      });
      return found;
    }

    function nextOpening(rules, day) {
      for (var step = 1; step <= 7; step++) {
        var rule = ruleFor(rules, (day + step - 1) % 7 + 1);
        if (rule) { return rule.label; }
      }
      return null;
    }

    function statusOf(card) {
      var zone = card.getAttribute('data-ct-tz');
      var rules = card.getAttribute('data-ct-rules');
      var now = partsIn(zone, new Date());
      var shut = (card.getAttribute('data-ct-holidays') || '').split(',');
      var rule = shut.indexOf(now.date) === -1 ? ruleFor(rules, now.day) : null;
      var open = !!rule && now.minutes >= rule.opens && now.minutes < rule.closes;

      return {
        open: open,
        clock: now.clock,
        text: open
          ? 'Open until ' + fromMinutes(rule.closes)
          : 'Closed · opens ' + (rule && now.minutes < rule.opens
            ? rule.label : nextOpening(rules, now.day))
      };
    }

    function fromMinutes(total) {
      var h = Math.floor(total / 60);
      return h + ':' + ('0' + total % 60).slice(-2);
    }

    function tick() {
      cards.forEach(function (card, i) {
        var state = statusOf(card);
        var badge = $('[data-ct-status]', card);
        setText(badge, state.text);
        badge.classList.toggle('is-open', state.open);

        var clock = clocks[i];
        if (!clock) { return; }
        setText($('[data-ct-time]', clock), state.clock);
        var openLabel = $('[data-ct-open]', clock);
        setText(openLabel, state.open ? 'Open' : 'Closed');
        openLabel.classList.toggle('is-open', state.open);
      });
    }

    if (window.Intl && Intl.DateTimeFormat.prototype.formatToParts) {
      tick();
      /* Once a minute is enough, and it keeps the live region quiet. */
      window.setInterval(tick, 60000);
    }

    /* ---- hovering a card lights its pin and its clock ---------------------- */
    function highlight(index) {
      cards.forEach(function (c, i) { c.classList.toggle('is-active', i === index); });
      clocks.forEach(function (c, i) { c.classList.toggle('is-active', i === index); });
      list.classList.toggle('is-picked', index >= 0);
      if (index >= 0) {
        var card = cards[index];
        setText(mapNote, $('.ctoffice__city', card).textContent + ' · '
          + $('.ctdetail:last-child dd', card).textContent.split(' · ')[0]);
      } else {
        setText(mapNote, restNote);
      }
      drawPins();
    }

    onGroupHover(list, '.ctoffice', function (card) { highlight(cards.indexOf(card)); },
      function () { highlight(-1); });

    /* ---- the map ----------------------------------------------------------
       The listing pages' Leaflet map and their pin component, fitted to the
       four offices. Every address is text on the page, so the map adds no
       information — the list underneath it is the fallback, not a stopgap. */
    var pinList = $('[data-ct-pins]');
    var canvas = $('[data-ct-map]');
    var map = null;
    var pinLayer = null;
    var active = -1;

    function drawPins() {
      if (!map || !pinLayer) { return; }
      pinLayer.clearLayers();
      var bounds = [];

      $$('li', pinList).forEach(function (item, i) {
        var lat = Number(item.getAttribute('data-lat'));
        var lng = Number(item.getAttribute('data-lng'));
        bounds.push([lat, lng]);

        var el = document.createElement('div');
        el.className = 'pin' + (i === active ? ' pin--active' : '');
        var label = document.createElement('span');
        label.className = 'pin__label';
        label.textContent = item.getAttribute('data-ct-office');
        el.appendChild(label);
        el.appendChild(document.createTextNode(
          $('.ctoffice__city', cards[i]).textContent));

        L.marker([lat, lng], {
          icon: L.divIcon({ className: '', html: el.outerHTML, iconSize: null, iconAnchor: [14, 14] }),
          zIndexOffset: i === active ? 900 : 0
        }).addTo(pinLayer).on('click', function () {
          /* A pin should take you to its office, not just glow. */
          cards[i].scrollIntoView({
            block: 'center',
            behavior: prefersReducedMotion ? 'auto' : 'smooth'
          });
          highlight(i);
        });
      });

      if (bounds.length > 1 && active < 0) {
        map.fitBounds(bounds, { padding: [46, 46], maxZoom: 8 });
      }
    }

    if (canvas && typeof L !== 'undefined') {
      pinList.hidden = true;
      map = L.map(canvas, { scrollWheelZoom: false, zoomControl: false })
        .setView([39.5, 1.5], 5);
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      var tiles = null;
      var paintTiles = function () {
        var t = MAP_TILES.dark;
        if (tiles) { map.removeLayer(tiles); }
        tiles = L.tileLayer(t.url, { attribution: t.attribution, maxZoom: 19 }).addTo(map);
      };
      paintTiles();

      pinLayer = L.layerGroup().addTo(map);
      window.setTimeout(function () { map.invalidateSize(); drawPins(); }, 200);
      window.addEventListener('resize', function () { map.invalidateSize(); });
    }

    /* Keep the pin highlight in step with the card highlight. */
    var baseHighlight = highlight;
    highlight = function (index) { active = index; baseHighlight(index); };

    /* ---- the routing line -------------------------------------------------
       Both figures come off the selected option, so the line and the desk
       table cannot drift apart. */
    var subject = $('[data-ct-subject]');
    if (subject) {
      var to = $('[data-ct-route-to]');
      var sla = $('[data-ct-route-sla]');
      subject.addEventListener('change', function () {
        var option = subject.options[subject.selectedIndex];
        setText(to, option.getAttribute('data-ct-email'));
        setText(sla, option.getAttribute('data-ct-sla'));
      });
    }
  }());

  /* ==========================================================================
     9r. Journal — sections, pagination, card hover

     The rail narrows the grid on its own — it is a radio group the stylesheet
     reads — so this block does not filter. It swaps the section heading, pages
     the filtered set, and runs the hover state. With the script off the page
     is a working filtered journal showing every piece in the chosen section.
     ========================================================================== */

  /* Card hover, wherever a journal grid appears — the journal page and the
     second homepage both use it. Rests with every card lit; nothing here is
     pre-selected. */
  (function journalCards() {
    $$('.jrgrid').forEach(function (grid) {
      var cards = $$('.jrcard', grid);
      onGroupHover(grid, '.jrcard', function (card) {
        cards.forEach(function (c) { c.classList.toggle('is-active', c === card); });
        grid.classList.add('is-picked');
      }, function () {
        cards.forEach(function (c) { c.classList.remove('is-active'); });
        grid.classList.remove('is-picked');
      });
    });
  }());

  (function journal() {
    var grid = $('[data-jr-grid]');
    if (!grid) { return; }

    var items = $$('li[data-jr-post]', grid);
    var cards = $$('.jrcard', grid);
    var heads = $$('[data-jr-head]');
    var note = $('[data-jr-note]');
    var numbers = $('[data-jr-numbers]');
    var prev = $('[data-jr-prev]');
    var next = $('[data-jr-next]');
    var PER_PAGE = 9;
    var page = 0;

    function section() {
      var picked = $('input[name="section"]:checked');
      return picked ? picked.value : 'all';
    }

    /* Filtering itself is CSS; this only reads back what survived it, so the
       two can never disagree about which pieces are in a section. */
    function inSection() {
      return items.filter(function (item) {
        return section() === 'all' || item.getAttribute('data-jr-post') === section();
      });
    }

    function render() {
      var live = inSection();
      var pages = Math.max(1, Math.ceil(live.length / PER_PAGE));
      if (page > pages - 1) { page = pages - 1; }

      items.forEach(function (item) { item.classList.remove('is-off'); });
      live.forEach(function (item, i) {
        var on = i >= page * PER_PAGE && i < (page + 1) * PER_PAGE;
        item.hidden = !on;
      });
      /* Anything outside the section is hidden by the stylesheet, not here —
         but it must not keep a `hidden` flag from a previous section. */
      items.forEach(function (item) {
        if (live.indexOf(item) === -1) { item.hidden = false; }
      });

      setText(note, live.length
        ? 'Showing ' + (page * PER_PAGE + 1) + '—'
          + Math.min(live.length, (page + 1) * PER_PAGE) + ' of ' + live.length + ' pieces'
        /* A tile with a count over an empty grid is a data bug, but the state
           still has to say something truthful if it ever happens. */
        : 'Nothing in this section yet');

      if (numbers) {
        numbers.textContent = '';
        for (var i = 0; i < pages; i++) {
          numbers.appendChild(numberButton(i, pages));
        }
      }
      if (prev) { prev.disabled = page === 0; }
      if (next) { next.disabled = page >= pages - 1; }
    }

    function numberButton(i, pages) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'jrpager__num' + (i === page ? ' is-current' : '');
      button.textContent = String(i + 1);
      if (i === page) { button.setAttribute('aria-current', 'page'); }
      button.setAttribute('aria-label', 'Page ' + (i + 1) + ' of ' + pages);
      button.addEventListener('click', function () { page = i; render(); });
      return button;
    }

    if (prev) {
      prev.addEventListener('click', function () {
        if (page > 0) { page -= 1; render(); }
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        page += 1;
        render();
      });
    }

    /* The heading, its count and the blurb all belong to the section, so all
       six are in the markup and only one is shown. */
    function swapHead() {
      heads.forEach(function (head) {
        head.hidden = head.getAttribute('data-jr-head') !== section();
      });
    }

    $$('input[name="section"]').forEach(function (input) {
      input.addEventListener('change', function () {
        page = 0;
        swapHead();
        render();
        writeUrl();
      });
    });

    /* Section state in the URL: fifteen of the most linkable pieces on the site
       live in one section, and a link that lands on `All` loses them. Real
       section URLs are still the right answer once there is a server. */
    function writeUrl() {
      var query = section() === 'all' ? '' : '?section=' + section();
      window.history.replaceState(null, '', window.location.pathname + query);
    }

    var wanted = (window.location.search.match(/section=([a-z]+)/) || [])[1];
    if (wanted) {
      var input = $('#section-' + wanted);
      if (input) { input.checked = true; }
    }

    /* Abbreviated money — `€312 k`, `€2.4 M` — is not the shared `data-eur`
       shape, so it is redrawn here when the footer switches currency. */
    (function shortMoney() {
      var shorts = $$('[data-jr-money]');
      if (!shorts.length) { return; }

      function render(code) {
        var rate = CURRENCY_RATES[code];
        var symbol = CURRENCY_SYMBOLS[code];
        shorts.forEach(function (el) {
          var value = Number(el.getAttribute('data-jr-money')) * rate;
          setText(el, el.getAttribute('data-jr-form') === 'M'
            ? symbol + (value / 1000000).toFixed(1).replace(/\.0$/, '') + ' M'
            : symbol + Math.round(value / 1000) + ' k');
        });
      }

      document.addEventListener('avava:currency', function (e) { render(e.detail); });
    }());

    swapHead();
    render();
  }());


  /* ==========================================================================
     9s. Blog single — contents, next cards, the short figure

     The table of contents is the only part that needs a script, and it needs
     the right one: the active row comes from scroll position, never from
     hover. An `onMouseEnter` highlight marks wherever the cursor last rested
     and mis-reports the reader the moment they scroll.

     Every heading carries a slug `id` and every row a real `href`, so with the
     script off the contents still work as anchors.
     ========================================================================== */

  (function articleContents() {
    var list = $('.bstoc__list');
    if (!list) { return; }

    var rows = $$('.bstoc__row', list);
    var targets = rows
      .map(function (a) { return document.getElementById((a.getAttribute('href') || '').slice(1)); })
      .filter(Boolean);
    if (!targets.length) { return; }

    function mark(id) {
      rows.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('is-active', on);
        /* Colour alone does not tell a screen reader where the reader is. */
        if (on) { a.setAttribute('aria-current', 'location'); }
        else { a.removeAttribute('aria-current'); }
      });
    }

    /* Smooth-scroll; `scroll-margin-top` on the headings clears the offset. */
    rows.forEach(function (a) {
      a.addEventListener('click', function (e) {
        var el = document.getElementById((a.getAttribute('href') || '').slice(1));
        if (!el) { return; }
        e.preventDefault();
        el.scrollIntoView({ block: 'start', behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        mark(el.id);
      });
    });

    if (typeof IntersectionObserver === 'undefined') { return; }

    /* The band is the top fifth to the top third of the viewport: whatever the
       reader is actually looking at, not whatever happens to be on screen. */
    var observer = new IntersectionObserver(function (entries) {
      var seen = entries.filter(function (e) { return e.isIntersecting; });
      if (!seen.length) { return; }
      seen.sort(function (a, b) {
        return a.boundingClientRect.top - b.boundingClientRect.top;
      });
      mark(seen[0].target.id);
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

    targets.forEach(function (t) { observer.observe(t); });
  }());

  /* Next in the section — hover lifts one card and steps the others back. */
  (function nextCards() {
    var grid = $('[data-next-cards]');
    if (!grid) { return; }
    grid.addEventListener('mouseenter', function () { grid.classList.add('is-picked'); });
    grid.addEventListener('mouseleave', function () { grid.classList.remove('is-picked'); });
  }());

  /* One figure on the article is written short — €312 k, not €312 000 — so the
     footer's currency switch cannot rewrite it from `data-eur` alone. */
  (function articleShortMoney() {
    var el = $('[data-eur-short]');
    if (!el) { return; }

    var base = Number(el.getAttribute('data-eur-short'));

    function render(code) {
      var v = base * CURRENCY_RATES[code];
      var sym = CURRENCY_SYMBOLS[code];
      setText(el, v >= 1000000
        ? sym + String((v / 1000000).toFixed(2)).replace(/\.?0+$/, '') + ' M'
        : sym + Math.round(v / 1000) + ' k');
    }

    document.addEventListener('avava:currency', function (e) { render(e.detail); });
    var checked = $('input[name="currency"]:checked');
    render(checked ? checked.value : 'EUR');
  }());


  /* ==========================================================================
     9t. Journal v2 — sections and tags composing, sort, pagination
     -----------------------------------------------------------------------------
     Nothing here creates an entry. All six are in the markup, so with the
     script off the reader gets the whole feed, the section rows work as
     anchors and the sort radios are simply checked. This block narrows,
     orders and pages.

     Sections and tags COMPOSE. Picking `From the files` and `Permits` shows
     what carries both, and the feed header says so. Either one resets the
     page, because page two of the old set means nothing against the new one.

     The count is announced: `aria-live="polite"` sits on the note, which is
     the only thing on the page that changes without focus moving. It carries
     two quantities — how many match, out of how many the journal has
     published — because they are different numbers and the rail's own counts
     are the second one.
     ========================================================================== */

  (function journalV2Feed() {
    var feed = $('[data-b2-feed]');
    if (!feed) { return; }

    var entries = $$('[data-b2-entry]', feed);
    var name = $('[data-b2-name]', feed);
    var note = $('[data-b2-note]', feed);
    var empty = $('[data-b2-empty]', feed);
    var pager = $('[data-b2-pager]', feed);
    var pageNote = $('[data-b2-page-note]', feed);
    var numbers = $('[data-b2-numbers]', feed);
    var prev = $('[data-b2-prev]', feed);
    var next = $('[data-b2-next]', feed);

    var rows = $$('[data-b2-section]:not([data-b2-entry])');
    var chips = $$('[data-b2-tag]');
    var sorts = $$('[data-b2-sort]');
    var clear = $('[data-b2-clear]', feed);

    var published = parseInt(feed.getAttribute('data-b2-total'), 10) || entries.length;
    var perPage = parseInt(feed.getAttribute('data-b2-per-page'), 10) || 5;

    var section = 'all';
    var tag = '';
    var sort = 'new';
    var page = 0;

    var labels = {};
    rows.forEach(function (row) {
      var label = $('.b2row__label', row);
      labels[row.getAttribute('data-b2-section')] = label ? label.textContent : '';
    });

    function tagsOf(entry) {
      return (entry.getAttribute('data-b2-tags') || '').split(' ');
    }

    function matching() {
      return entries.filter(function (entry) {
        if (section !== 'all' && entry.getAttribute('data-b2-section') !== section) { return false; }
        if (tag && tagsOf(entry).indexOf(tag) === -1) { return false; }
        return true;
      });
    }

    /* Newest is the order the markup is already in, so the sort only has to
       undo itself — `data-b2-index` is that original order. Reading time is
       compared as a number; "14 min" and "4 min" sort backwards as strings. */
    function ordered(list) {
      var out = list.slice();
      out.sort(function (a, b) {
        if (sort === 'read') {
          return parseInt(b.getAttribute('data-b2-mins'), 10) -
                 parseInt(a.getAttribute('data-b2-mins'), 10);
        }
        return parseInt(a.getAttribute('data-b2-index'), 10) -
               parseInt(b.getAttribute('data-b2-index'), 10);
      });
      return out;
    }

    function render() {
      var shown = ordered(matching());
      var pages = Math.max(1, Math.ceil(shown.length / perPage));
      if (page > pages - 1) { page = pages - 1; }

      var from = page * perPage;
      var onPage = shown.slice(from, from + perPage);

      entries.forEach(function (entry) { entry.classList.add('is-off'); });
      onPage.forEach(function (entry) { entry.classList.remove('is-off'); });

      /* The first entry on the page is the large one, wherever it came from —
         the hierarchy belongs to the position, not to the piece. */
      entries.forEach(function (entry) { entry.classList.remove('b2entry--first'); });
      if (onPage.length) { onPage[0].classList.add('b2entry--first'); }

      /* Sorting reorders the DOM rather than setting `order`, so the reading
         order and the visual order stay the same thing — the same reason the
         listings engine moves nodes (see 9b). */
      var holder = onPage.length ? onPage[0].parentNode : null;
      if (holder) {
        onPage.forEach(function (entry) { holder.appendChild(entry); });
      }

      if (name) {
        name.textContent = tag ? labels[section] + ' · ' + tag : labels[section];
      }
      if (note) {
        note.textContent = shown.length + ' of ' + published + ' published';
      }

      if (empty) { empty.hidden = shown.length !== 0; }
      if (pager) { pager.hidden = shown.length === 0; }

      if (pageNote) {
        pageNote.textContent = shown.length
          ? 'Showing ' + (from + 1) + '—' + Math.min(shown.length, from + perPage) +
            ' of ' + shown.length
          : '';
      }

      if (numbers) {
        numbers.innerHTML = '';
        for (var i = 0; i < pages; i++) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'b2pager__num' + (i === page ? ' is-on' : '');
          btn.textContent = String(i + 1);
          if (i === page) { btn.setAttribute('aria-current', 'true'); }
          btn.setAttribute('data-b2-page', String(i));
          numbers.appendChild(btn);
        }
      }

      /* Disabled, not dimmed: a control that looks spent but still fires is
         worse than one that says it is done. */
      if (prev) { prev.disabled = page === 0; }
      if (next) { next.disabled = page >= pages - 1; }

      rows.forEach(function (row) {
        var on = row.getAttribute('data-b2-section') === section;
        row.classList.toggle('is-on', on);
        if (on) { row.setAttribute('aria-current', 'true'); }
        else { row.removeAttribute('aria-current'); }
      });

      chips.forEach(function (chip) {
        chip.setAttribute('aria-pressed', chip.getAttribute('data-b2-tag') === tag ? 'true' : 'false');
      });
    }

    rows.forEach(function (row) {
      row.addEventListener('click', function (e) {
        e.preventDefault();
        section = row.getAttribute('data-b2-section');
        page = 0;
        render();
      });
    });

    /* Clicking the active chip clears it — a filter you cannot switch off with
       the control that set it is a trap, and two filters compose here. */
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var value = chip.getAttribute('data-b2-tag');
        tag = tag === value ? '' : value;
        page = 0;
        render();
      });
    });

    sorts.forEach(function (input) {
      input.addEventListener('change', function () {
        sort = input.getAttribute('data-b2-sort');
        page = 0;
        render();
      });
    });

    if (clear) {
      clear.addEventListener('click', function () {
        section = 'all';
        tag = '';
        page = 0;
        render();
      });
    }

    if (prev) {
      prev.addEventListener('click', function () {
        if (page > 0) { page--; render(); }
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        page++;
        render();
      });
    }

    if (numbers) {
      numbers.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-b2-page]');
        if (!btn) { return; }
        page = parseInt(btn.getAttribute('data-b2-page'), 10);
        render();
      });
    }

    render();
  }());

  /* ==========================================================================
     9u. Journal v2 — the replies
   9v. Homes for sale — tabs, the questions
   9w. Home detail v1 — the gallery, the rooms, the viewing slots
   9x. Home detail v2 — contents by scroll, the gallery, the calculator
     -----------------------------------------------------------------------------
     The thread is written in the markup and reads without a script; this only
     handles the two controls on it.

     `Useful` increments once and then says so. In production the once-per-
     identity rule belongs on the server — every commenter here is tied to a
     licence or a completed purchase, so the count means something only if it
     is counted there. This is the local half of it.

     `Reply` moves the cursor into the reply box and names who is being
     answered. Jumping to a form and leaving the reader to find the field is
     half a jump.
     ========================================================================== */

  (function journalV2Replies() {
    var thread = $('.b2thread');
    if (!thread) { return; }

    $$('[data-b2-useful]', thread).forEach(function (button) {
      button.addEventListener('click', function () {
        if (button.getAttribute('data-b2-counted') === 'yes') { return; }
        var count = $('[data-b2-useful-count]', button);
        if (count) {
          count.textContent = String(parseInt(count.textContent, 10) + 1);
        }
        button.setAttribute('data-b2-counted', 'yes');
        button.classList.add('is-on');
      });
    });

    var box = document.getElementById('b2-reply');
    if (!box) { return; }

    $$('[data-b2-reply-to]', thread).forEach(function (button) {
      button.addEventListener('click', function () {
        var who = button.getAttribute('data-b2-reply-to');
        box.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
        box.focus();
        if (!box.value) { box.value = '@' + who + ' '; }
        box.setSelectionRange(box.value.length, box.value.length);
      });
    });
  }());




  /* ==========================================================================
     9v. Homes for sale — tabs and the questions
   9w. Home detail v1 — the gallery, the rooms, the viewing slots
   9x. Home detail v2 — contents by scroll, the gallery, the calculator
     -----------------------------------------------------------------------------
     Everything on the page reads with the script off: the tabs are radios, the
     filters are real checkboxes and radios inside a panel that is only hidden,
     the cards and the cities are in the markup, and every question is a button
     whose panel is a plain element. This block switches, counts and traps
     focus.

     THE TAB CHANGES THREE THINGS AT ONCE
     ------------------------------------
     The price field's label, its bands, and the note under the form. All three
     are carried on the tab input as data, so they cannot drift apart — the
     prototype had them in three separate places and the bands went stale.

     THE COUNT IS A PROMISE, NOT ARITHMETIC
     --------------------------------------
     `Show N homes` here recomputes from a local table because there is no
     server in a template. In production it is a real query, debounced — and it
     must never be allowed to read `Show 0 homes`: show the nearest broader
     result instead. The button is `aria-live="polite"`, so the number is
     announced when it moves.

     FOCUS IS TRAPPED WHILE THE PANEL IS OPEN
     ----------------------------------------
     It is a 470px scrolling region with two sticky bars; letting focus walk out
     of it behind the reader's back is how these panels become unusable with a
     keyboard. Esc closes and focus returns to the control that opened it.
     ========================================================================== */

  (function homesForSale() {
    var form = $('.fsform');
    if (!form) { return; }

    /* ---------------------------------------------------------- tabs --- */

    var priceLabel = $('[data-fs-price-label]', form);
    var bands = $('[data-fs-bands]', form);
    var note = $('[data-fs-note]', form);

    // The bands per tab live here rather than in the markup: six <option>s per
    // tab in four copies is markup nobody can keep in step by hand.
    var BANDS = {
      buy:  ['No min', '€100 000', '€250 000', '€500 000', '€1 M', '€2 M +'],
      rent: ['No min', '€500', '€900', '€1 400', '€2 500', '€4 000 +'],
      new:  ['No min', '€150 000', '€300 000', '€600 000', '€1.2 M', '€3 M +'],
      land: ['No min', '€40 000', '€90 000', '€180 000', '€400 000', '€1 M +']
    };

    $$('[data-fs-tab]', form).forEach(function (input) {
      input.addEventListener('change', function () {
        if (!input.checked) { return; }
        var id = input.getAttribute('data-fs-tab');

        if (priceLabel) { priceLabel.textContent = input.getAttribute('data-fs-tab-price'); }
        if (note) { note.textContent = input.getAttribute('data-fs-tab-note'); }

        if (bands && BANDS[id]) {
          bands.innerHTML = '';
          BANDS[id].forEach(function (label, i) {
            var opt = document.createElement('option');
            opt.textContent = label;
            opt.value = label;
            if (i === 0) { opt.selected = true; }
            bands.appendChild(opt);
          });
        }
      });
    });

    /* ----------------------------------------------------- the questions --- */

    // One open at a time. The first is open in the markup, and it stays that
    // way on load — a column of six collapsed rows is what left a 137px void
    // above the footer in the state every visitor sees first.
    var questions = $$('[data-fs-q]');
    questions.forEach(function (button) {
      button.addEventListener('click', function () {
        var isOpen = button.getAttribute('aria-expanded') === 'true';

        questions.forEach(function (other) {
          other.setAttribute('aria-expanded', 'false');
          var otherPanel = document.getElementById(other.getAttribute('aria-controls'));
          if (otherPanel) { otherPanel.hidden = true; }
        });

        if (!isOpen) {
          button.setAttribute('aria-expanded', 'true');
          var own = document.getElementById(button.getAttribute('aria-controls'));
          if (own) { own.hidden = false; }
        }
      });
    });

    /* --------------------------------------------------------- the cities --- */

    var cityNote = $('[data-fs-city-note]');
    if (cityNote) {
      var resting = cityNote.textContent;
      onGroupHover($('.fscities__list'), '[data-fs-city]',
        function (item) {
          cityNote.textContent = item.getAttribute('data-fs-city') + ' — ' +
            $('.fscity__count', item).textContent + ' homes';
        },
        function () { cityNote.textContent = resting; });
    }
  }());


  /* ==========================================================================
     9aj. The Refine dropdown — wherever a page carries one
     -----------------------------------------------------------------------------
     Lifted out of 9v on 9 Aug, when the owner asked for the same control on
     `map-list`: 9v returns early unless the for-sale form is on the page, so
     the panel would have been inert there. This block keys on the panel alone
     and drives it on every page that prints one.

     The panel is a real form: checkboxes, radios and text fields inside an
     element that is only `hidden`. With scripting off every control is still
     there and still submits — this block opens, counts and traps focus, and
     nothing else.

     THE COUNT IS A PROMISE, NOT ARITHMETIC
     --------------------------------------
     `Show N homes` recomputes from a local table because there is no server in
     a template, and its base comes off the panel (`data-fs-total`) so a page
     never states someone else's total. In production it is a real query,
     debounced — and it must never read `Show 0 homes`: show the nearest
     broader result instead. The button is `aria-live="polite"`.

     FOCUS IS TRAPPED WHILE THE PANEL IS OPEN
     ----------------------------------------
     It is a 470px scrolling region with two sticky bars; letting focus walk out
     of it behind the reader's back is how these panels become unusable with a
     keyboard. Esc closes and focus returns to the control that opened it.
     ========================================================================== */

  (function refinePanel() {
    /* -------------------------------------------------- the refine panel --- */

    var refine = $('[data-fs-refine]');
    var panel = $('[data-fs-panel]');
    if (!refine || !panel) { return; }

    var applied = $('[data-fs-applied]', panel);
    var show = $('[data-fs-show]', panel);
    var reset = $('[data-fs-reset]', panel);
    var value = $('[data-fs-refine-value]');
    var controls = $$('[data-fs-filter]', panel);
    /* Off the panel, not compiled in: map-list indexes 24 128 files and
       properties-for-sale 14 806, and the button must not lie on either. */
    var TOTAL = Number(panel.getAttribute('data-fs-total')) || 0;

    function activeCount() {
      var n = 0;
      controls.forEach(function (el) {
        if (el.type === 'checkbox' && el.checked) { n++; }
        else if (el.type === 'radio' && el.checked && el.value !== 'all') { n++; }
        else if ((el.type === 'text' || el.type === 'search') && el.value.trim()) { n++; }
      });
      return n;
    }

    function phrase(n) {
      if (!n) { return 'nothing applied'; }
      return n === 1 ? '1 filter' : n + ' filters';
    }

    function render() {
      var n = activeCount();

      if (applied) { applied.textContent = phrase(n); }
      if (value) { value.textContent = n ? phrase(n) : 'Nothing applied'; }

      if (show) {
        // Stand-in arithmetic for a template with no server. The floor matters
        // more than the formula: the button must never offer zero homes.
        var left = Math.max(48, Math.round(TOTAL * Math.pow(0.72, n)));
        show.textContent = 'Show ' + String(left).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' homes';
      }
    }

    function focusable() {
      return $$('button, [href], input, select, textarea', panel).filter(function (el) {
        return !el.disabled && el.offsetParent !== null;
      });
    }

    function open() {
      panel.hidden = false;
      refine.setAttribute('aria-expanded', 'true');
      var first = focusable()[0];
      if (first) { first.focus(); }
    }

    function close(returnFocus) {
      panel.hidden = true;
      refine.setAttribute('aria-expanded', 'false');
      if (returnFocus) { refine.focus(); }
    }

    refine.addEventListener('click', function () {
      if (panel.hidden) { open(); } else { close(true); }
    });

    controls.forEach(function (el) {
      el.addEventListener('change', render);
      el.addEventListener('input', render);
    });

    if (reset) {
      reset.addEventListener('click', function () {
        controls.forEach(function (el) {
          if (el.type === 'checkbox') { el.checked = false; }
          else if (el.type === 'radio') { el.checked = el.value === 'all'; }
          else { el.value = ''; }
        });
        render();
      });
    }

    document.addEventListener('click', function (e) {
      if (panel.hidden) { return; }
      if (panel.contains(e.target) || refine.contains(e.target)) { return; }
      close(false);
    });

    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(true); return; }
      if (e.key !== 'Tab') { return; }

      var items = focusable();
      if (!items.length) { return; }
      var first = items[0];
      var last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    render();

  }());

  /* ==========================================================================
     9w. Home detail v1 — the gallery, the rooms, the viewing slots
   9x. Home detail v2 — contents by scroll, the gallery, the calculator
     -----------------------------------------------------------------------------
     Nothing here is required to read the page: every photograph, every check,
     the whole room schedule, the costs and the documents are in the markup, and
     the viewing slots are real radio buttons whose labels work without help.

     THE CAPTION IS PART OF THE VIEW, NOT DECORATION
     -----------------------------------------------
     Switching to Floor plan captions the frame as a drawing; switching to
     photographs captions it as a photograph. Picking a thumbnail therefore has
     to return the switch to Photos — otherwise the reader is left looking at a
     photograph under a heading that says Floor plan.

     ROOM HIGHLIGHTING IS NOT HOVER-ONLY
     -----------------------------------
     The rows carry the highlight on hover and focus in CSS; this block adds the
     part CSS cannot do — pointing at the matching rectangle on the plan, and
     naming the room and its area in the section note. On touch it binds click,
     because there is no hover on a phone and this is the one interaction on the
     page worth keeping there.
     ========================================================================== */

  (function propertyDetail() {
    var frame = $('[data-pd-frame]');
    if (!frame) { return; }

    /* -------------------------------------------------------- gallery --- */

    var caption = $('[data-pd-caption]');
    var index = $('[data-pd-index]');
    var thumbs = $$('[data-pd-thumb]');
    var views = $$('[data-pd-view]');

    // Frame, caption and alt text travel together: three lists that have to
    // agree would drift, so they are one.
    var FRAMES = thumbs.map(function (button) {
      var img = $('.pdthumb__img', button);
      return { src: img.getAttribute('src'), alt: img.getAttribute('alt') };
    });

    var CAPTIONS = [
      'Living room, facing the courtyard',
      'Kitchen, restored 2021',
      'Bedroom 1',
      'The balcony',
      'The stairwell and the 1998 lift'
    ];

    var current = 0;

    function showPhoto(i) {
      current = i;
      frame.src = FRAMES[i].src;
      frame.alt = FRAMES[i].alt;
      if (caption) { caption.textContent = CAPTIONS[i] || ''; }
      if (index) {
        index.textContent = (i + 1 < 10 ? '0' : '') + (i + 1) + ' / 26';
        index.hidden = false;
      }
      thumbs.forEach(function (button, j) {
        button.classList.toggle('is-on', j === i);
        if (j === i) { button.setAttribute('aria-current', 'true'); }
        else { button.removeAttribute('aria-current'); }
      });
      setView('photos', false);
    }

    function setView(id, changeCaption) {
      views.forEach(function (button) {
        var on = button.getAttribute('data-pd-view') === id;
        button.classList.toggle('is-on', on);
        button.setAttribute('aria-selected', on ? 'true' : 'false');
      });

      if (!changeCaption) { return; }

      if (id === 'plan') {
        if (caption) { caption.textContent = 'Second floor, as measured'; }
        if (index) { index.hidden = true; }
      } else if (id === 'street') {
        if (caption) { caption.textContent = 'Carrer de Cadis, looking north'; }
        if (index) { index.hidden = true; }
      } else {
        if (caption) { caption.textContent = CAPTIONS[current] || ''; }
        if (index) { index.hidden = false; }
      }
    }

    thumbs.forEach(function (button, i) {
      button.addEventListener('click', function () { showPhoto(i); });
    });

    views.forEach(function (button) {
      button.addEventListener('click', function () {
        setView(button.getAttribute('data-pd-view'), true);
      });
    });

    /* ---------------------------------------------------------- rooms --- */

    var rows = $$('[data-pd-row]');
    var plan = $$('[data-pd-room]');
    var roomNote = $('[data-pd-room-note]');
    var resting = roomNote ? roomNote.textContent : '';

    function highlight(i) {
      plan.forEach(function (box, j) { box.classList.toggle('is-on', j === i); });
      rows.forEach(function (row, j) { row.classList.toggle('is-on', j === i); });

      if (!roomNote) { return; }
      if (i === -1) { roomNote.textContent = resting; return; }
      var name = $('th', rows[i]).textContent;
      var area = $('.pdrow__area', rows[i]).textContent;
      roomNote.textContent = name + ' · ' + area;
    }

    rows.forEach(function (row, i) {
      if (isTouch) {
        // Tap to highlight — the handoff calls this the one interaction worth
        // keeping on a phone, and hover cannot deliver it there.
        row.addEventListener('click', function () { highlight(i); });
      } else {
        row.addEventListener('mouseenter', function () { highlight(i); });
        row.addEventListener('focusin', function () { highlight(i); });
      }
    });

    var table = $('.pdrooms__table');
    if (table && !isTouch) {
      table.addEventListener('mouseleave', function () { highlight(-1); });
    }

    /* ----------------------------------------------------- viewing slots --- */

    var slots = $$('[data-pd-slot]');
    var cta = $('[data-pd-cta]');

    slots.forEach(function (input) {
      input.addEventListener('change', function () {
        if (!input.checked || !cta) { return; }
        cta.textContent = 'Book ' + input.getAttribute('data-pd-slot');
      });
    });
  }());


  /* ==========================================================================
     9x. Home detail v2 — contents by scroll, the gallery, the calculator
     -----------------------------------------------------------------------------
     Nothing here creates content: every photograph, row and figure is in the
     markup, the contents rail is real anchors and the term control is a radio
     group. This block highlights, switches and computes.

     THE CALCULATOR IS BOUND TO THE RAIL
     -----------------------------------
     One render writes the breakdown, the answer, the segment bar AND the two
     figures in the right rail. They are one computation, so they cannot
     disagree — which is the whole reason the calculator sits on the page.

     Guarded edges: deposit above the price (loan floors at zero), zero rate
     (the formula divides by zero — fall back to loan / n) and zero term.

     THE CONTENTS RAIL FOLLOWS THE READER
     ------------------------------------
     `IntersectionObserver` on the nine section ids, topmost intersecting wins.
     Hover would report where the cursor stopped, not where the reader is.
     ========================================================================== */

  (function homeDetailV2() {
    var wrap = $('.p2wrap');
    if (!wrap) { return; }

    /* ------------------------------------------------------- contents --- */

    var rows = $$('[data-p2-toc]');
    var sections = rows.map(function (r) {
      return document.getElementById(r.getAttribute('data-p2-toc'));
    }).filter(Boolean);

    function markActive(id) {
      rows.forEach(function (row) {
        var on = row.getAttribute('data-p2-toc') === id;
        row.classList.toggle('is-on', on);
        if (on) { row.setAttribute('aria-current', 'location'); }
        else { row.removeAttribute('aria-current'); }
      });
    }

    if ('IntersectionObserver' in window && sections.length) {
      var seen = {};
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { seen[e.target.id] = e.isIntersecting; });
        for (var i = 0; i < sections.length; i++) {
          if (seen[sections[i].id]) { markActive(sections[i].id); break; }
        }
      }, { rootMargin: '-20% 0px -70% 0px' });
      sections.forEach(function (s) { io.observe(s); });
    }

    rows.forEach(function (row) {
      row.addEventListener('click', function () { markActive(row.getAttribute('data-p2-toc')); });
    });

    /* -------------------------------------------------------- gallery --- */

    var frame = $('[data-p2-frame]');
    var caption = $('[data-p2-caption]');
    var index = $('[data-p2-index]');
    var thumbs = $$('[data-p2-thumb]');

    var CAPTIONS = ['Living room, facing the courtyard', 'Kitchen, restored 2021', 'Bedroom 1',
                    'The balcony', 'Entrance hall', 'The block from the street'];

    thumbs.forEach(function (button, i) {
      button.addEventListener('click', function () {
        var img = $('.p2thumb__img', button);
        frame.src = img.getAttribute('src');
        frame.alt = img.getAttribute('alt');
        if (caption) { caption.textContent = CAPTIONS[i] || ''; }
        if (index) { index.textContent = (i + 1 < 10 ? '0' : '') + (i + 1) + ' / 26'; }
        thumbs.forEach(function (other, j) {
          other.classList.toggle('is-on', j === i);
          if (j === i) { other.setAttribute('aria-current', 'true'); }
          else { other.removeAttribute('aria-current'); }
        });
      });
    });

    /* ---------------------------------------------------------- rooms --- */

    var roomRows = $$('[data-p2-row]');
    var plan = $$('[data-p2-room]');
    var roomNote = $('[data-p2-room-note]');
    var resting = roomNote ? roomNote.textContent : '';

    function highlight(i) {
      plan.forEach(function (box, j) { box.classList.toggle('is-on', j === i); });
      roomRows.forEach(function (row, j) { row.classList.toggle('is-on', j === i); });
      if (!roomNote) { return; }
      if (i === -1) { roomNote.textContent = resting; return; }
      roomNote.textContent = $('th', roomRows[i]).textContent + ' · ' +
        $('.p2row__area', roomRows[i]).textContent;
    }

    roomRows.forEach(function (row, i) {
      if (isTouch) { row.addEventListener('click', function () { highlight(i); }); }
      else {
        row.addEventListener('mouseenter', function () { highlight(i); });
        row.addEventListener('focusin', function () { highlight(i); });
      }
    });

    var table = $('.p2rooms__table');
    if (table && !isTouch) { table.addEventListener('mouseleave', function () { highlight(-1); }); }

    /* ----------------------------------------------------- calculator --- */

    var PRICE = 712000, SVC = 94, TAX = 51, UTIL = 128, FEES = 73220;

    var depField = $('[data-p2-deposit]');
    var depSlider = $('[data-p2-pct-input]');
    var pctOut = $('[data-p2-pct]');
    var rateField = $('[data-p2-rate]');
    var rateHint = $('[data-p2-rate-hint]');
    var terms = $$('[data-p2-term]');
    if (!depField) { return; }

    var deposit = 142400, rate = 3.58, term = 25;

    function numberOf(value, fallback) {
      var n = parseFloat(String(value).replace(/[^0-9.]/g, ''));
      return isNaN(n) ? fallback : n;
    }

    function fmt(n) {
      return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    function money(n) { return '€' + fmt(n); }

    function render(writeField) {
      // Депозит выше цены не превращает заём в отрицательный.
      deposit = Math.max(0, Math.min(deposit, PRICE));
      var loan = Math.max(0, PRICE - deposit);
      var n = term * 12;
      var r = rate / 100 / 12;
      // Нулевая ставка — законный ввод, а не деление на ноль.
      var pay = n <= 0 ? 0 : (r === 0 ? loan / n : loan * r / (1 - Math.pow(1 + r, -n)));
      var total = pay + SVC + TAX + UTIL;

      setText($('[data-p2-out="seg-1"]'), money(pay));
      setText($('[data-p2-loan]'), money(loan) + ' loan');
      setText($('[data-p2-total]'), money(total));
      setText($('[data-p2-summary]'),
        money(deposit) + ' down, ' + rate + '% over ' + term + ' years — everything included.');
      setText($('[data-p2-cash]'), money(deposit + FEES));
      setText($('[data-p2-interest]'), money(Math.max(0, pay * n - loan)));
      setText($('[data-p2-ltv]'), Math.round(loan / PRICE * 100) + '%');

      // Те же две цифры в правом рейле — одна и та же выкладка.
      setText($('[data-p2-rail-total]'), money(total) + ' / mo');
      setText($('[data-p2-rail-cash]'), money(deposit + FEES));

      var parts = [pay, SVC, TAX, UTIL];
      parts.forEach(function (v, i) {
        var seg = $('[data-p2-seg="seg-' + (i + 1) + '"]');
        if (seg) { seg.style.width = (v / total * 100).toFixed(1) + '%'; }
      });

      var pct = Math.round(deposit / PRICE * 100);
      if (pctOut) { pctOut.textContent = pct + '%'; }
      if (depSlider && String(depSlider.value) !== String(pct)) { depSlider.value = pct; }
      if (writeField && document.activeElement !== depField) { depField.value = fmt(deposit); }
      if (rateHint) { rateHint.textContent = 'Market average this week for ' + term + ' years'; }
    }

    depField.addEventListener('input', function () {
      deposit = numberOf(depField.value, deposit);
      render(false);
    });

    if (depSlider) {
      depSlider.addEventListener('input', function () {
        deposit = Math.round(PRICE * numberOf(depSlider.value, 20) / 100);
        render(true);
      });
    }

    if (rateField) {
      rateField.addEventListener('input', function () {
        rate = numberOf(rateField.value, rate);
        render(false);
      });
    }

    terms.forEach(function (input) {
      input.addEventListener('change', function () {
        if (!input.checked) { return; }
        term = parseInt(input.getAttribute('data-p2-term'), 10);
        render(false);
      });
    });

    /* -------------------------------------------------- viewing slots --- */

    var cta = $('[data-p2-cta]');
    $$('[data-p2-slot]').forEach(function (input) {
      input.addEventListener('change', function () {
        if (input.checked && cta) { cta.textContent = 'Book ' + input.getAttribute('data-p2-slot'); }
      });
    });

    render(true);
  }());


  /* ==========================================================================
     9y. Home detail — the street map (v1—v4)
     -----------------------------------------------------------------------------
     All four detail layouts carry the same section, so all four are served
     from here: the property on the real Leaflet map, with the walking table
     beside it. v1 and v2 add four points of interest; the 130px panels on v3
     and v4 carry the subject pin alone.

     THE SCHEMATIC IS THE FALLBACK, AND THE SOURCE
     ---------------------------------------------
     The drawing that ships in the markup is what the frame shows when the
     library is not there — and it is also where the pins read their labels and
     coordinates, so the two representations cannot name different places. Hide
     it only once a map has actually been built.

     The wheel scrolls the page, not the map. Tiles are not CSS and will not
     ========================================================================== */

  (function streetMap() {
    var canvas = $('[data-street-map]');
    var home = $('[data-street-home]');
    if (!canvas || !home || typeof L === 'undefined') { return; }

    var lat = Number(home.getAttribute('data-lat'));
    var lng = Number(home.getAttribute('data-lng'));
    if (!lat || !lng) { return; }

    var plan = $('[data-street-plan]');
    if (plan) { plan.hidden = true; }

    var map = L.map(canvas, { scrollWheelZoom: false, zoomControl: false })
      .setView([lat, lng], 16);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    /* A real scale bar in place of the schematic's drawn "200 m". */
    L.control.scale({ metric: true, imperial: false, position: 'bottomleft' }).addTo(map);

    var tiles = null;
    function paintTiles() {
      var t = MAP_TILES.dark;
      if (tiles) { map.removeLayer(tiles); }
      tiles = L.tileLayer(t.url, { attribution: t.attribution, maxZoom: 19 }).addTo(map);
    }
    paintTiles();

    var layer = L.layerGroup().addTo(map);
    var bounds = [];

    /* Nothing on this map opens anything, so the markers are not interactive:
       the plates cannot swallow a click meant for the map underneath. */
    function place(el, modifier, above) {
      var pinLat = Number(el.getAttribute('data-lat'));
      var pinLng = Number(el.getAttribute('data-lng'));
      if (!pinLat || !pinLng) { return; }
      bounds.push([pinLat, pinLng]);

      var plate = document.createElement('span');
      plate.className = 'pin ' + modifier;
      plate.textContent = (el.textContent || '').trim();

      L.marker([pinLat, pinLng], {
        icon: L.divIcon({
          className: 'streetpin',
          html: plate.outerHTML,
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        }),
        interactive: false,
        zIndexOffset: above ? 900 : 0
      }).addTo(layer);
    }

    $$('[data-street-poi]').forEach(function (poi) { place(poi, 'pin--poi', false); });
    place(home, 'pin--here', true);

    function fit() {
      if (bounds.length > 1) {
        /* `animate: false`: an animated fit leaves the map on an intermediate
           zoom in the preview panel, which never delivers `zoomend`. */
        map.fitBounds(bounds, { padding: [58, 58], maxZoom: 17, animate: false });
      }
    }

    /* The map is built inside a laid-out grid cell and has to re-measure before
       it is fitted — fitting against the size it was born with puts a pin
       outside the frame. Same order after a resize. */
    fit();
    window.setTimeout(function () { map.invalidateSize(); fit(); }, 200);
    window.addEventListener('resize', function () { map.invalidateSize(); fit(); });
  }());


  /* ==========================================================================
     9z. Home detail v3 — the media block, the video chapters, the calculator
     -----------------------------------------------------------------------------
     Nothing here creates content. Every photograph, chapter, room, cost and
     figure is in the markup, the term control is a radio group and the viewing
     slots are radios in a fieldset. With scripting off the page reads whole:
     the frame shows the first photograph, the chapter list reads as a table of
     contents, and the calculator prints the answer for its default inputs.

     THE CALCULATOR IS ONE COMPUTATION
     ---------------------------------
     One render writes the column chart, the three totals, the monthly answer,
     the rent comparison AND `Cash at completion` in the costs panel two
     sections below. They cannot disagree because there is only one of them.

     Guarded edges: deposit above the price (the loan floors at zero), zero rate
     (the formula divides by zero — fall back to loan / n) and zero term.

     THE RENT COMPARISON CARRIES ITS MEANING IN THE SIGN
     ---------------------------------------------------
     Green for cheaper to own, red for dearer — but the ± prefix says it too,
     so the answer survives a reader who cannot tell the two colours apart.
     ========================================================================== */

  (function homeDetailV3() {
    var media = $('.p3media');
    if (!media) { return; }

    var PRICE = 712000;
    var FEES = 73220;
    var SVC = 94, TAX = 51, UTIL = 128;
    var RENT = 2050;

    /* ----------------------------------------------------------- media --- */

    var frame = $('[data-p3-panel]');
    var image = $('[data-p3-image]');
    var caption = $('[data-p3-caption]');
    var index = $('[data-p3-index]');
    var note = $('[data-p3-note]');
    var tabs = $$('[data-p3-tab]');
    var thumbs = $$('[data-p3-thumb]');

    /* The tab row and the thumbnails describe the same four views, so the
       captions and sources are read off the markup rather than listed again
       here — a second list is a second thing to keep in step. */
    var STILLS = {
      plan: { src: 'assets/img/pd-plan.svg', cap: 'Second floor, as measured',
              alt: 'The floor plan of the second-floor flat, drawn from our survey' },
      street: { src: 'assets/img/pd-street.svg', cap: 'Carrer de Cadis',
                alt: 'Carrer de Cadis outside the block, looking north' }
    };
    var NOTES = {
      photos: '26 frames · shot 02 Aug',
      video: 'Filmed 02 Aug 2026 · unedited walkthrough',
      plan: 'Drawn from our survey',
      street: 'Carrer de Cadis, looking north'
    };

    var view = 'photos';
    var shot = 0;

    function paintMedia() {
      tabs.forEach(function (tab) {
        var on = tab.getAttribute('data-p3-tab') === view;
        tab.classList.toggle('is-on', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on && frame) { frame.setAttribute('aria-labelledby', tab.id); }
      });

      setText(note, NOTES[view] || NOTES.photos);
      if (frame) { frame.classList.toggle('is-video', view === 'video'); }

      if (view === 'video') { return; }

      if (view === 'photos') {
        var thumb = thumbs[shot];
        var img = thumb ? $('.p3thumb__img', thumb) : null;
        if (img && image) {
          image.src = img.getAttribute('src');
          image.alt = img.getAttribute('alt');
        }
        setText(caption, img ? img.getAttribute('alt') : '');
        /* The register counts from one and pads to two digits, as the plate
           in the prototype does. */
        setText(index, ('0' + (shot + 1)).slice(-2) + ' / 26');
      } else {
        var still = STILLS[view];
        if (still && image) { image.src = still.src; image.alt = still.alt; }
        setText(caption, still ? still.cap : '');
        setText(index, '');
      }

      thumbs.forEach(function (t, i) {
        var on = view === 'photos' && i === shot;
        t.classList.toggle('is-on', on);
        if (on) { t.setAttribute('aria-current', 'true'); }
        else { t.removeAttribute('aria-current'); }
      });
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        view = tab.getAttribute('data-p3-tab');
        paintMedia();
      });
    });

    /* A thumbnail sets the frame AND returns the tab to Photographs: otherwise
       the reader is looking at a photograph under the heading "Floor plan". */
    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        shot = Number(thumb.getAttribute('data-p3-thumb')) || 0;
        view = 'photos';
        paintMedia();
      });
    });

    /* ----------------------------------------------------------- video --- */

    var play = $('[data-p3-play]');
    var playPath = $('[data-p3-play-path]');
    var playLabel = $('[data-p3-play-label]');
    var fill = $('[data-p3-fill]');
    var ticks = $$('.p3tick');
    var chapters = $$('[data-p3-chapter]');
    var CHAPTER_AT = [0, 18, 44, 68, 88];
    var playing = false;
    var chapter = 0;

    function paintVideo() {
      if (playPath) { playPath.setAttribute('d', playing ? 'M9 5v14M15 5v14' : 'M8 5l11 7-11 7V5z'); }
      if (play) { play.setAttribute('aria-pressed', playing ? 'true' : 'false'); }
      /* The icon is the only visual difference, so the accessible name has to
         change with it. */
      setText(playLabel, playing ? 'Pause the video tour' : 'Play the video tour');

      if (fill) { fill.style.width = CHAPTER_AT[chapter] + '%'; }
      ticks.forEach(function (tick, i) { tick.classList.toggle('is-reached', i <= chapter); });
      chapters.forEach(function (btn, i) {
        var on = i === chapter;
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-current', on ? 'true' : 'false');
      });
    }

    if (play) {
      play.addEventListener('click', function () {
        playing = !playing;
        paintVideo();
      });
    }

    chapters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        chapter = Number(btn.getAttribute('data-p3-chapter')) || 0;
        playing = true;
        view = 'video';
        paintMedia();
        paintVideo();
      });
    });

    /* ----------------------------------------------------------- rooms --- */

    var roomNote = $('[data-p3-room-note]');
    var boxes = $$('.p3room');
    var roomBtns = $$('.p3roomrow__btn');
    var ROOM_NAMES = roomBtns.map(function (b) {
      var name = $('.p3roomrow__name', b);
      return name ? name.childNodes[0].nodeValue.trim() : '';
    });
    var ROOM_AREAS = roomBtns.map(function (b) {
      var area = $('.p3roomrow__area', b);
      return area ? area.textContent.trim() : '';
    });

    function paintRoom(i) {
      boxes.forEach(function (box, n) { box.classList.toggle('is-on', n === i); });
      roomBtns.forEach(function (btn, n) { btn.classList.toggle('is-on', n === i); });
      setText(roomNote, i === -1 ? 'seven rooms · 96 m²'
        : ROOM_NAMES[i] + ' · ' + ROOM_AREAS[i]);
    }

    roomBtns.forEach(function (btn, i) {
      /* Focus as well as hover: the highlight is the only thing this table
         does, and it has to be reachable from the keyboard. */
      btn.addEventListener('mouseenter', function () { paintRoom(i); });
      btn.addEventListener('focus', function () { paintRoom(i); });
      if (isTouch) {
        btn.addEventListener('click', function (e) { e.preventDefault(); paintRoom(i); });
      }
    });

    var roomList = $('.p3roomrows');
    if (roomList && !isTouch) {
      roomList.addEventListener('mouseleave', function () { paintRoom(-1); });
    }

    /* ------------------------------------------------------ calculator --- */

    var depField = $('[data-p3-deposit]');
    var depRange = $('[data-p3-dep-range]');
    var depPct = $('[data-p3-dep-pct]');
    var rateField = $('[data-p3-rate]');
    var rateRange = $('[data-p3-rate-range]');
    var rateNote = $('[data-p3-rate-note]');
    var terms = $$('[data-p3-term]');

    var totalOut = $('[data-p3-total]');
    var summaryOut = $('[data-p3-summary]');
    var rentOut = $('[data-p3-rent]');
    /* Cash at completion is printed twice — in the calculator's totals and in
       the costs panel two sections below. `querySelector` would update only
       the first and leave the page contradicting itself (§10). */
    var cashOuts = $$('[data-p3-cash]');
    var interestOut = $('[data-p3-interest]');
    var ltvOut = $('[data-p3-ltv]');

    var deposit = 142400;
    var rate = 3.58;
    var term = 25;

    function currency() {
      var picked = $('input[name="currency"]:checked');
      return picked ? picked.value : 'EUR';
    }

    function money(eur) {
      var code = currency();
      return CURRENCY_SYMBOLS[code] + groupDigits(Math.abs(eur) * CURRENCY_RATES[code]);
    }

    function numberOf(value, fallback) {
      var n = parseFloat(String(value).replace(/[^0-9.]/g, ''));
      return isNaN(n) ? fallback : n;
    }

    function render(writeFields) {
      var loan = Math.max(0, PRICE - deposit);
      var r = rate / 100 / 12;
      var n = term * 12;
      /* Zero rate is a legal input, not a reason to fall over: the loan is
         simply divided by the term. Zero term would divide by zero too. */
      var pay = n <= 0 ? 0 : (r === 0 ? loan / n : loan * r / (1 - Math.pow(1 + r, -n)));
      var total = pay + SVC + TAX + UTIL;
      var cash = deposit + FEES;
      var delta = total - RENT;

      var parts = [pay, SVC, TAX, UTIL];
      var top = Math.max.apply(null, parts);
      var names = ['mortgage', 'service', 'tax', 'utilities'];
      names.forEach(function (name, i) {
        var stem = $('[data-p3-bar="' + name + '"]');
        var value = $('[data-p3-bar-value="' + name + '"]');
        if (stem) { stem.style.height = Math.max(4, top ? parts[i] / top * 78 : 4) + 'px'; }
        setText(value, money(parts[i]));
      });

      setTextAll(cashOuts, money(cash));
      setText(interestOut, money(Math.max(0, pay * n - loan)));
      setText(ltvOut, Math.round(loan / PRICE * 100) + '%');
      setText(totalOut, money(total));
      setText(summaryOut, money(deposit) + ' down at ' + rate + '% over ' + term
        + ' years, with charges, tax and utilities.');

      /* The sign, not the colour, carries the answer. */
      setText(rentOut, (delta > 0 ? '+' : '−') + money(delta));
      if (rentOut) {
        rentOut.classList.toggle('is-bad', delta > 0);
        rentOut.classList.toggle('is-ok', delta <= 0);
      }

      setText(depPct, Math.round(deposit / PRICE * 100) + '%');
      setText(rateNote, rate < 3.2 ? 'below market' : (rate > 4 ? 'above market' : 'market average'));

      if (writeFields) {
        if (depField) { depField.value = groupDigits(deposit); }
        if (rateField) { rateField.value = String(rate); }
      }
      if (depRange) { depRange.value = Math.round(deposit / PRICE * 100); }
      if (rateRange) { rateRange.value = Math.round(rate * 100); }
    }

    if (depField) {
      depField.addEventListener('input', function () {
        deposit = Math.max(0, numberOf(depField.value, deposit));
        render(false);
      });
    }
    if (depRange) {
      depRange.addEventListener('input', function () {
        deposit = Math.round(PRICE * (parseInt(depRange.value, 10) || 0) / 100);
        render(true);
      });
    }
    if (rateField) {
      rateField.addEventListener('input', function () {
        rate = Math.max(0, numberOf(rateField.value, rate));
        render(false);
      });
    }
    if (rateRange) {
      rateRange.addEventListener('input', function () {
        rate = (parseInt(rateRange.value, 10) || 0) / 100;
        render(true);
      });
    }
    terms.forEach(function (input) {
      input.addEventListener('change', function () {
        if (!input.checked) { return; }
        term = parseInt(input.getAttribute('data-p3-term'), 10);
        render(false);
      });
    });

    /* Every figure above is computed, so none of them can be rewritten from a
       `data-eur` attribute by the footer switch — this block redraws its own. */
    document.addEventListener('avava:currency', function () { render(true); });

    /* ---------------------------------------------------------- slots --- */

    var cta = $('[data-p3-cta]');
    $$('[data-p3-slot]').forEach(function (input) {
      input.addEventListener('change', function () {
        if (input.checked && cta) {
          setText(cta, 'Book ' + input.getAttribute('data-p3-slot') + ' with Anna');
        }
      });
    });

    paintMedia();
    paintVideo();
    render(true);
  }());


  /* ==========================================================================
     9aa. Home detail v4 — the opening frame, the bento, own versus rent
     -----------------------------------------------------------------------------
     Nothing here creates content. Every photograph, chapter, room, document and
     figure is in the markup; the term control is a radio group and the viewing
     slots are radios in a fieldset. With scripting off the frame shows the first
     photograph, the chapter rail reads as a table of contents, and the
     calculator prints the answer for its default inputs.

     ONE COMPUTATION, THREE PLACES
     -----------------------------
     One render writes the segment bar, the breakdown, the interest, the three
     comparison rows, the verdict AND `Cash at completion` in bento tile 3. They
     cannot disagree because there is only one of them.

     Guarded edges: deposit above the price (loan floors at zero), zero rate
     (fall back to loan / n) and zero term.

     THE VERDICT CARRIES ITS MEANING IN WORDS
     ----------------------------------------
     The sentence changes with the sign, and the sign is printed. Colour only
     agrees with them.
     ========================================================================== */

  (function homeDetailV4() {
    var hero = $('.p4hero');
    if (!hero) { return; }

    var PRICE = 712000;
    var FEES = 73220;
    var SVC = 94, TAX = 51, UTIL = 128;
    var RENT = 2050;
    var RENT_DEPOSIT = 4100;
    var PRINCIPAL_SHARE = 0.34;

    /* ----------------------------------------------------------- media --- */

    var frame = $('.p4hero__frame');
    var stage = $('[data-p4-panel]');
    var image = $('[data-p4-image]');
    var caption = $('[data-p4-caption]');
    var note = $('[data-p4-note]');
    var tabs = $$('[data-p4-tab]');
    var thumbs = $$('[data-p4-thumb]');
    var panes = $$('[data-p4-pane]');
    var paneRow = $('[data-p4-panes]');

    var NOTES = { photos: 'Shot 02 Aug 2026', video: 'Filmed 02 Aug \u00b7 unedited',
                  plan: 'Drawn from our survey', street: 'Looking north' };

    var view = 'photos';
    var shot = 0;

    var MODES = ['photos', 'video', 'plan', 'street'];

    /* The open panel owns the caption, and the caption string is written on the
       panel by the builder — this block copies it, it does not compose it. */
    function paintPanes() {
      panes.forEach(function (pane, i) {
        var on = i === shot;
        pane.classList.toggle('is-on', on);
        pane.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (view === 'photos') {
        var open = panes[shot];
        setText(caption, open ? open.getAttribute('data-p4-pane-caption') : '');
      }
    }

    function paintMedia() {
      tabs.forEach(function (tab) {
        var on = tab.getAttribute('data-p4-tab') === view;
        tab.classList.toggle('is-on', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on && stage) { stage.setAttribute('aria-labelledby', tab.id); }
      });

      setText(note, NOTES[view] || NOTES.photos);
      /* The accordion, the still, the poster, the strip and the chapter rail
         all key off these two flags — the strip and the rail sit outside the
         stage, so the frame carries them too. */
      MODES.forEach(function (m) {
        if (frame) { frame.classList.toggle('is-' + m, view === m); }
        if (stage) { stage.classList.toggle('is-' + m, view === m); }
      });

      if (view === 'video') {
        setText(caption, 'Video tour \u00b7 2:41');
        return;
      }

      if (view === 'photos') { paintPanes(); return; }
      paintStill();
    }

    /* Plan and street each own a strip, and a cell in it stays inside its mode:
       it swaps the drawing and rewrites the caption, nothing else. Every frame
       carries its own source, caption and alt text on its button, written by
       the builder — this block reads them, it does not keep a second copy.

       The reference put the eight photographs under both modes with a click
       that threw the reader back into Photographs; the tab then promised two
       drawings the reader could not reach. Owner's call, §0q. */
    var stillFrame = { plan: 0, street: 0 };

    function paintStill() {
      var mine = thumbs.filter(function (b) {
        return b.getAttribute('data-p4-thumb').split(':')[0] === view;
      });
      var chosen = mine[stillFrame[view]] || mine[0];
      if (!chosen) { return; }
      if (image) {
        image.src = chosen.getAttribute('data-p4-thumb-src');
        image.alt = chosen.getAttribute('data-p4-thumb-alt');
      }
      setText(caption, chosen.getAttribute('data-p4-thumb-cap'));
      mine.forEach(function (b) {
        var on = b === chosen;
        b.classList.toggle('is-on', on);
        if (on) { b.setAttribute('aria-current', 'true'); }
        else { b.removeAttribute('aria-current'); }
      });
    }

    /* Hover, focus and click all open a panel; touch has only the click. */
    panes.forEach(function (pane, i) {
      function open() {
        if (shot === i) { return; }
        shot = i;
        paintPanes();
      }
      pane.addEventListener('mouseenter', open);
      pane.addEventListener('focus', open);
      pane.addEventListener('click', open);
    });

    /* Leaving the row returns to panel 0 — the frame is never left with
       nothing open. */
    if (paneRow) {
      paneRow.addEventListener('mouseleave', function () {
        shot = 0;
        paintPanes();
      });
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        view = tab.getAttribute('data-p4-tab');
        paintMedia();
      });
    });

    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        var parts = thumb.getAttribute('data-p4-thumb').split(':');
        stillFrame[parts[0]] = Number(parts[1]) || 0;
        view = parts[0];
        paintMedia();
      });
    });

    /* ----------------------------------------------------------- video --- */

    var play = $('[data-p4-play]');
    var playPath = $('[data-p4-play-path]');
    var playLabel = $('[data-p4-play-label]');
    var fill = $('[data-p4-fill]');
    var ticks = $$('.p4tick');
    var chapters = $$('[data-p4-chapter]');
    var CHAPTER_AT = [0, 18, 44, 68, 88];
    var playing = false;
    var chapter = 0;

    function paintVideo() {
      if (playPath) { playPath.setAttribute('d', playing ? 'M9 5v14M15 5v14' : 'M8 5l11 7-11 7V5z'); }
      if (play) { play.setAttribute('aria-pressed', playing ? 'true' : 'false'); }
      setText(playLabel, playing ? 'Pause the video tour' : 'Play the video tour');
      if (fill) { fill.style.width = CHAPTER_AT[chapter] + '%'; }
      ticks.forEach(function (t, i) { t.classList.toggle('is-reached', i <= chapter); });
      chapters.forEach(function (b, i) {
        var on = i === chapter;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-current', on ? 'true' : 'false');
      });
    }

    if (play) {
      play.addEventListener('click', function () { playing = !playing; paintVideo(); });
    }

    chapters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        chapter = Number(btn.getAttribute('data-p4-chapter')) || 0;
        playing = true;
        view = 'video';
        paintMedia();
        paintVideo();
      });
    });

    /* ----------------------------------------------------------- rooms --- */

    var roomNote = $('[data-p4-room-note]');
    var boxes = $$('.p4room');
    var roomBtns = $$('.p4roomrow__btn');
    var ROOM_NAMES = roomBtns.map(function (b) {
      var n = $('.p4roomrow__name', b);
      return n ? n.childNodes[0].nodeValue.trim() : '';
    });
    var ROOM_AREAS = roomBtns.map(function (b) {
      var a = $('.p4roomrow__area', b);
      return a ? a.textContent.trim() : '';
    });

    function paintRoom(i) {
      boxes.forEach(function (b, n) { b.classList.toggle('is-on', n === i); });
      roomBtns.forEach(function (b, n) { b.classList.toggle('is-on', n === i); });
      setText(roomNote, i === -1 ? 'seven rooms \u00b7 96 m\u00b2'
        : ROOM_NAMES[i] + ' \u00b7 ' + ROOM_AREAS[i]);
    }

    roomBtns.forEach(function (btn, i) {
      btn.addEventListener('mouseenter', function () { paintRoom(i); });
      btn.addEventListener('focus', function () { paintRoom(i); });
      if (isTouch) {
        btn.addEventListener('click', function (e) { e.preventDefault(); paintRoom(i); });
      }
    });

    var roomList = $('.p4roomrows');
    if (roomList && !isTouch) {
      roomList.addEventListener('mouseleave', function () { paintRoom(-1); });
    }

    /* ------------------------------------------------------ calculator --- */

    var depField = $('[data-p4-deposit]');
    var depRange = $('[data-p4-dep-range]');
    var depPct = $('[data-p4-dep-pct]');
    var rateField = $('[data-p4-rate]');
    var rateRange = $('[data-p4-rate-range]');
    var rateNote = $('[data-p4-rate-note]');
    var terms = $$('[data-p4-term]');

    var totalOut = $('[data-p4-total]');
    var interestOut = $('[data-p4-interest]');
    var yearsOut = $('[data-p4-years]');
    var upfrontOut = $('[data-p4-upfront]');
    var equityOut = $('[data-p4-equity]');
    var deltaOut = $('[data-p4-delta]');
    var verdict = $('[data-p4-verdict]');
    var verdictText = $('[data-p4-verdict-text]');
    /* Bento tile 3 prints the same cash figure as the comparison row. */
    var cashOuts = $$('[data-p4-cash]');

    var deposit = 142400;
    var rate = 3.58;
    var term = 25;

    function currency() {
      var picked = $('input[name="currency"]:checked');
      return picked ? picked.value : 'EUR';
    }

    function money(eur) {
      var code = currency();
      return CURRENCY_SYMBOLS[code] + groupDigits(Math.abs(eur) * CURRENCY_RATES[code]);
    }

    function numberOf(value, fallback) {
      var n = parseFloat(String(value).replace(/[^0-9.]/g, ''));
      return isNaN(n) ? fallback : n;
    }

    function render(writeFields) {
      var loan = Math.max(0, PRICE - deposit);
      var r = rate / 100 / 12;
      var n = term * 12;
      var pay = n <= 0 ? 0 : (r === 0 ? loan / n : loan * r / (1 - Math.pow(1 + r, -n)));
      var total = pay + SVC + TAX + UTIL;
      var cash = deposit + FEES;
      var equity = deposit + pay * 60 * PRINCIPAL_SHARE;
      var delta = total - RENT;

      var parts = [pay, SVC, TAX, UTIL];
      var names = ['mortgage', 'service', 'property', 'estimated'];
      names.forEach(function (name, i) {
        var seg = $('[data-p4-seg="' + name + '"]');
        var value = $('[data-p4-break="' + name + '"]');
        if (seg) { seg.style.width = (total ? parts[i] / total * 100 : 0).toFixed(1) + '%'; }
        setText(value, money(parts[i]));
      });

      setText(totalOut, money(total));
      setText(interestOut, money(Math.max(0, pay * n - loan)));
      setText(yearsOut, String(term));
      setTextAll(cashOuts, money(cash));
      setText(upfrontOut, money(cash) + ' vs ' + money(RENT_DEPOSIT));
      setText(equityOut, money(equity) + ' vs ' + money(0));

      var dearer = delta > 0;
      setText(deltaOut, (dearer ? '+' : '\u2212') + money(delta));
      setText(verdictText, dearer
        ? 'Owning costs more each month at these terms.'
        : 'Owning costs less each month than renting it.');
      if (verdict) { verdict.classList.toggle('is-bad', dearer); }

      setText(depPct, Math.round(deposit / PRICE * 100) + '%');
      setText(rateNote, rate < 3.2 ? 'below market' : (rate > 4 ? 'above market' : 'market average'));

      if (writeFields) {
        if (depField) { depField.value = groupDigits(deposit); }
        if (rateField) { rateField.value = String(rate); }
      }
      if (depRange) { depRange.value = Math.round(deposit / PRICE * 100); }
      if (rateRange) { rateRange.value = Math.round(rate * 100); }
    }

    if (depField) {
      depField.addEventListener('input', function () {
        deposit = Math.max(0, numberOf(depField.value, deposit));
        render(false);
      });
    }
    if (depRange) {
      depRange.addEventListener('input', function () {
        deposit = Math.round(PRICE * (parseInt(depRange.value, 10) || 0) / 100);
        render(true);
      });
    }
    if (rateField) {
      rateField.addEventListener('input', function () {
        rate = Math.max(0, numberOf(rateField.value, rate));
        render(false);
      });
    }
    if (rateRange) {
      rateRange.addEventListener('input', function () {
        rate = (parseInt(rateRange.value, 10) || 0) / 100;
        render(true);
      });
    }
    terms.forEach(function (input) {
      input.addEventListener('change', function () {
        if (!input.checked) { return; }
        term = parseInt(input.getAttribute('data-p4-term'), 10);
        render(false);
      });
    });

    /* Every figure here is computed, so the footer switch cannot rewrite them
       from `data-eur` — this block redraws its own. */
    document.addEventListener('avava:currency', function () { render(true); });

    /* ---------------------------------------------------------- slots --- */

    var cta = $('[data-p4-cta]');
    $$('[data-p4-slot]').forEach(function (input) {
      input.addEventListener('change', function () {
        if (input.checked && cta) {
          setText(cta, 'Book ' + input.getAttribute('data-p4-slot') + ' with Anna');
        }
      });
    });

    paintMedia();
    paintVideo();
    render(true);
  }());


  /* ==========================================================================
     9ab. New builds — market switch, unit filter, timeline, floor plans
     -----------------------------------------------------------------------------
     Nothing here creates content. Both markets' filter bars and stage chips are
     in the markup, every unit row is written out, all four schedules of areas
     are present, and the timeline states which phase is current. With scripting
     off the page reads whole in the EU vocabulary — the switch is the only
     thing that stops working.

     DERIVED, NOT STORED
     -------------------
     The unit summary recounts from the rows that are actually visible, so the
     filter and the sentence under it cannot disagree — the handoff asks for
     this, and it is the bug this project has shipped twice.

     WHICH PHASE IS CURRENT IS DATA, NOT HOVER
     -----------------------------------------
     Hovering a timeline column moves the date highlight and nothing else. The
     dot states and the gold rule come from the phase index in the markup.
     ========================================================================== */

  (function newBuilds() {
    if (!$('[data-nb-market]')) { return; }

    /* ---------------------------------------------------------- market --- */

    var result = $('[data-nb-result]');
    var RESULT = {
      EU: '128 developments \u00b7 1 146 units under construction',
      US: '96 communities \u00b7 412 homes available now'
    };

    function paintMarket(code) {
      $$('[data-nb-fields]').forEach(function (bar) {
        bar.hidden = bar.getAttribute('data-nb-fields') !== code;
      });
      $$('[data-nb-chips]').forEach(function (row) {
        row.hidden = row.getAttribute('data-nb-chips') !== code;
      });
      setText(result, RESULT[code] || RESULT.EU);
    }

    $$('[data-nb-market]').forEach(function (input) {
      input.addEventListener('change', function () {
        if (input.checked) { paintMarket(input.getAttribute('data-nb-market')); }
      });
    });

    /* Stage chips are per market, so each row governs only its own siblings. */
    $$('[data-nb-chips]').forEach(function (row) {
      var chips = $$('[data-nb-stage]', row);
      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          chips.forEach(function (c) {
            var on = c === chip;
            c.classList.toggle('is-on', on);
            c.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
        });
      });
    });

    /* -------------------------------------------------------- unit mix --- */

    var typeChips = $$('[data-nb-type]');
    var units = $$('[data-nb-beds]');
    var summary = $('[data-nb-units-summary]');
    var REV = 'price list rev. 06 / Aug 2026';

    function paintUnits(beds) {
      var shown = 0;
      var available = 0;
      units.forEach(function (row) {
        var match = beds === 0 || Number(row.getAttribute('data-nb-beds')) === beds;
        row.hidden = !match;
        if (!match) { return; }
        shown += 1;
        /* Count what is on screen, not what the source array holds: the
           sentence under the table has to describe this table. */
        if (row.classList.contains('nbunit--avail')) { available += 1; }
      });
      setText(summary, shown + ' units shown \u00b7 ' + available + ' available \u00b7 ' + REV);
    }

    typeChips.forEach(function (chip, i) {
      chip.addEventListener('click', function () {
        typeChips.forEach(function (c) {
          var on = c === chip;
          c.classList.toggle('is-on', on);
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        paintUnits(i);
      });
    });

    /* -------------------------------------------------------- timeline --- */

    var phases = $$('[data-nb-phase]');
    /* Which phase is current is data, and the builder marks it. Resting state
       is that phase highlighted, NOT nothing highlighted — clearing the row on
       mouseleave threw away the one piece of information the timeline is for. */
    var restPhase = phases.filter(function (c) { return c.classList.contains('is-hot'); })[0] ||
                    phases.filter(function (c) { return c.classList.contains('nbphase--now'); })[0];
    phases.forEach(function (col) {
      col.addEventListener('mouseenter', function () {
        phases.forEach(function (c) { c.classList.toggle('is-hot', c === col); });
      });
    });
    var run = $('.nbphases');
    if (run) {
      run.addEventListener('mouseleave', function () {
        phases.forEach(function (c) { c.classList.toggle('is-hot', c === restPhase); });
      });
    }

    /* ------------------------------------------------------ floor plans --- */

    var planBtns = $$('[data-nb-plan]');
    var schedules = $$('[data-nb-schedule]');
    var sheetOut = $('[data-nb-sheet]');

    planBtns.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        planBtns.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        schedules.forEach(function (set) {
          set.hidden = Number(set.getAttribute('data-nb-schedule')) !== i;
        });
        /* The sheet code rides on the button the builder printed. A second
           copy in this file is the "same value stored twice" bug the project
           has already shipped twice — the plan list and the sheet strip cannot
           be allowed to name different drawings. */
        setText(sheetOut, btn.getAttribute('data-nb-sheet-code') || '');
      });
    });

    /* The market starts on whatever the markup checked, so read it rather than
       assume — the builder decides the default, not this block. */
    var picked = $('[data-nb-market]:checked');
    paintMarket(picked ? picked.getAttribute('data-nb-market') : 'EU');
    paintUnits(0);
  }());



  /* ==========================================================================
     9ac. Coming soon — countdown, release calendar, watchlist
     -----------------------------------------------------------------------------
     The page is a queue with a clock on it. Everything that can go stale is
     derived from `now`, and the whole point of the section is that the three
     places a Thursday is named — the countdown, the calendar rail and the
     batch number — can never disagree.

     THIS IS THE SECOND COPY OF THAT DERIVATION
     ------------------------------------------
     `build_comingsoon.py` runs the same algorithm at build time so the page
     reads with scripting off. This block recomputes it on load, which is what
     keeps the template honest whatever week it is opened in, and then ticks
     once a second. Change one and you must change the other: `csTarget()` and
     `csCalendar()` here, `release_target()` and `calendar()` there.

     WHAT DOES NOT HAPPEN HERE
     -------------------------
     Nothing animates. The digits are re-rendered, not flipped or faded — the
     handoff is explicit, and a deadline that performs reads as a gimmick. The
     pipeline hover is pure CSS. The market chips are real checkboxes, so their
     state is the input's and this block never touches them.
     ========================================================================== */

  (function comingSoon() {
    var clock = $('[data-cs-clock]');
    if (!clock) { return; }

    var RELEASE_DAY = 4;                    /* Thursday, in getDay() numbering */
    var RELEASE_HOUR = 9;
    var WINDOW_DAYS = 14;
    var BATCHES = [37, 24, 19];
    var FALLBACK_BATCH = 16;
    var EARLY_AT = 'Wednesday 09:00';

    var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function pad2(n) { return (n < 10 ? '0' : '') + n; }
    function fmtDay(d) { return WD[d.getDay()] + ' ' + d.getDate() + ' ' + MO[d.getMonth()]; }

    /* The next release, or the one after if today's has already gone out. */
    function csTarget(now) {
      var t = new Date(now.getFullYear(), now.getMonth(), now.getDate(), RELEASE_HOUR, 0, 0, 0);
      var ahead = (RELEASE_DAY - t.getDay() + 7) % 7;
      if (ahead === 0 && now.getTime() > t.getTime()) { ahead = 7; }
      t.setDate(t.getDate() + ahead);
      return t;
    }

    /* Fourteen days; only release days carry a batch. A fortnight always holds
       two of them, so the rail is never down to a single live cell. */
    function csCalendar(now) {
      var days = [];
      var seen = 0;
      for (var i = 0; i < WINDOW_DAYS; i++) {
        var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
        var count = 0;
        if (d.getDay() === RELEASE_DAY) {
          count = seen < BATCHES.length ? BATCHES[seen] : FALLBACK_BATCH;
          seen++;
        }
        days.push({ date: d, count: count });
      }
      return days;
    }

    var targetOut = $('[data-cs-target]');
    var units = {
      days: $('[data-cs-days]'), hours: $('[data-cs-hours]'),
      minutes: $('[data-cs-minutes]'), seconds: $('[data-cs-seconds]')
    };
    var cells = $$('[data-cs-day]');
    var headingOut = $('[data-cs-day-heading]');
    var summaryOut = $('[data-cs-day-summary]');
    var countOut = $('[data-cs-watch-count]');
    var noteOut = $('[data-cs-watch-note]');
    var stars = $$('[data-cs-star]');
    var featBtn = $('[data-cs-feat-watch]');
    var featLabel = $('[data-cs-feat-label]');
    var queueLength = $$('.csqcard').length;

    var picked = null;      /* null = "whatever the first release day is" */
    var meta = [];

    function activeIndex() {
      if (picked !== null && meta[picked] && meta[picked].count > 0) { return picked; }
      for (var i = 0; i < meta.length; i++) { if (meta[i].count > 0) { return i; } }
      return 0;
    }

    function paintCalendar(now) {
      meta = csCalendar(now);
      var sel = activeIndex();
      cells.forEach(function (cell, i) {
        var m = meta[i];
        if (!m) { return; }
        var live = m.count > 0;
        var on = live && i === sel;
        setText($('.csday__wd', cell), WD[m.date.getDay()]);
        setText($('.csday__num', cell), pad2(m.date.getDate()));
        setText($('.csday__n', cell), live ? m.count + ' files' : '—');
        cell.classList.toggle('csday--empty', !live);
        cell.classList.toggle('is-on', on);
        cell.disabled = !live;
        if (live) { cell.setAttribute('aria-pressed', on ? 'true' : 'false'); }
        else { cell.removeAttribute('aria-pressed'); }
      });
      paintDayCopy(sel);
    }

    /* `queueLength` is counted off the DOM, never typed. Every review failure
       this page has had was a written-down count drifting from the grid. */
    function paintDayCopy(sel) {
      var m = meta[sel];
      if (!m) { return; }
      if (m.count === 0) {
        setText(headingOut, 'No release on ' + fmtDay(m.date));
        setText(summaryOut, 'Releases run on Thursdays only — pick a marked day.');
      } else {
        setText(headingOut, m.count + ' files on ' + fmtDay(m.date));
        setText(summaryOut, queueLength +
          ' of them shown below · watchlist unlocks each one a day early');
      }
    }

    function paintClock(now) {
      var target = csTarget(now);
      var left = Math.max(0, target.getTime() - now.getTime());
      var total = Math.floor(left / 1000);
      setText(units.days, pad2(Math.floor(total / 86400)));
      setText(units.hours, pad2(Math.floor(total % 86400 / 3600)));
      setText(units.minutes, pad2(Math.floor(total % 3600 / 60)));
      setText(units.seconds, pad2(total % 60));
      setText(targetOut, fmtDay(target) + ' · 09:00 WEST');
      return target;
    }

    /* One counter, read from the controls themselves — the §01 stat and the
       §05 note are two printings of the same number, never two variables. */
    function paintWatch() {
      var n = stars.filter(function (s) {
        return s.getAttribute('aria-pressed') === 'true';
      }).length;
      if (featBtn && featBtn.getAttribute('aria-pressed') === 'true') { n++; }

      if (countOut) {
        setText(countOut, String(n));
        countOut.classList.toggle('csstat__value--live', n > 0);
        countOut.classList.toggle('csstat__value--zero', n === 0);
      }
      setText(noteOut, n === 0
        ? 'Nothing on your watchlist yet.'
        : n + ' file' + (n === 1 ? '' : 's') + ' watched · unlocked ' + EARLY_AT);
    }

    stars.forEach(function (star) {
      star.addEventListener('click', function () {
        var on = star.getAttribute('aria-pressed') !== 'true';
        star.setAttribute('aria-pressed', on ? 'true' : 'false');
        setText($('[data-cs-star-glyph]', star), on ? '★' : '☆');
        paintWatch();
      });
    });

    if (featBtn) {
      featBtn.addEventListener('click', function () {
        var on = featBtn.getAttribute('aria-pressed') !== 'true';
        featBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        /* The label is the state: an inverted button that still says "Watch
           this file" reads as a control that failed. */
        setText(featLabel, on ? 'On your watchlist' : 'Watch this file');
        paintWatch();
      });
    }

    cells.forEach(function (cell, i) {
      cell.addEventListener('click', function () {
        if (cell.disabled) { return; }
        picked = i;
        paintCalendar(new Date());
      });
    });

    /* Hovering a stage lights it; leaving the row returns to the resting one
       the builder marked, never to nothing. */
    var stages = $$('.csstage');
    var stageRest = stages.filter(function (s) { return s.classList.contains('is-hot'); })[0];
    stages.forEach(function (cell) {
      cell.addEventListener('mouseenter', function () {
        stages.forEach(function (c) { c.classList.toggle('is-hot', c === cell); });
      });
    });
    var pipe = $('.cspipe');
    if (pipe) {
      pipe.addEventListener('mouseleave', function () {
        stages.forEach(function (c) { c.classList.toggle('is-hot', c === stageRest); });
      });
    }

    var now = new Date();
    paintClock(now);
    paintCalendar(now);
    paintWatch();

    /* One interval for the page. The digits are the only thing it touches. */
    window.setInterval(function () { paintClock(new Date()); }, 1000);
  }());


  /* ==========================================================================
     9ad. Recently sold — window switch, district chart, sort, price timeline
     -----------------------------------------------------------------------------
     Nothing here creates content. All five head figures for the default window
     are written out, every district panel is in the markup (the other six
     hidden), all eight deeds are rows in a real table, and the timeline opens
     on the step the builder marked. With scripting off the page reads whole in
     the ninety-day window — only the switching stops.

     WHAT THIS BLOCK MUST NOT DO
     ---------------------------
     It must not re-derive a price. Every figure on this page was formatted once
     in `build_recentlysold.py` through a single `money()` path, because the
     handoff lost a review round to two formatters disagreeing by a factor of a
     thousand. The window switch swaps whole strings that came from the data;
     the sort reorders rows; nothing here does arithmetic on a price.

     THE SUMMARY DOES NOT MOVE WHEN YOU SORT
     ---------------------------------------
     Its average gap and average days are means over the source order. Sorting
     changes which row is on top, not what the eight of them average to — so the
     sentence is written once by the builder and this block never touches it.
     ========================================================================== */

  (function recentlySold() {
    var plot = $('.rsplot');
    if (!plot) { return; }

    /* ------------------------------------------------------- the window --- */

    var line = $('[data-rs-line]');
    var winLabel = $('[data-rs-window-label]');
    var countOut = $('[data-rs-count]');
    var statOuts = $$('[data-rs-stat]');

    /* The three windows' figures live on the page as data, not in this file:
       the builder prints them onto the switch so the numbers have one home.
       The carriers are `data-rs-win-*` and the readouts are `data-rs-line` /
       `data-rs-count` — sharing one name made `querySelector` return the radio
       instead of the span, and the legend quietly stopped updating. */
    var WINDOWS = $$('[data-rs-window]').map(function (input) {
      return {
        label: input.nextElementSibling ? input.nextElementSibling.textContent.trim() : '',
        line: input.getAttribute('data-rs-win-line') || '',
        count: input.getAttribute('data-rs-win-count') || '',
        stats: (input.getAttribute('data-rs-win-stats') || '').split('|')
      };
    });

    function paintWindow(i) {
      var w = WINDOWS[i];
      if (!w) { return; }
      setText(line, w.line);
      setText(winLabel, w.label);
      setText(countOut, w.count);
      statOuts.forEach(function (out, n) {
        if (w.stats[n]) { setText(out, w.stats[n]); }
      });
    }

    $$('[data-rs-window]').forEach(function (input, i) {
      input.addEventListener('change', function () {
        if (input.checked) { paintWindow(i); }
      });
    });

    /* -------------------------------------------------- the district chart --- */

    var rows = $$('[data-rs-district]');
    var panels = $$('[data-rs-panel]');

    function selectDistrict(i) {
      rows.forEach(function (r, n) {
        var on = n === i;
        r.classList.toggle('is-on', on);
        r.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      panels.forEach(function (p, n) { p.hidden = n !== i; });
    }

    rows.forEach(function (row, i) {
      /* Hover and click both select — the handoff asks for hover, and a control
         that only answers the mouse is no control at all on a keyboard. */
      row.addEventListener('mouseenter', function () { selectDistrict(i); });
      row.addEventListener('focus', function () { selectDistrict(i); });
      row.addEventListener('click', function () { selectDistrict(i); });
    });

    /* --------------------------------------------------------- the sort --- */

    var tbody = $('[data-rs-deals]');
    var deals = $$('[data-rs-deal]', tbody);
    var chips = $$('[data-rs-sort]');

    var num = function (el, name) { return Number(el.getAttribute('data-rs-' + name)); };

    var SORTERS = {
      /* `date` is the source order: the builder wrote them newest first. */
      date: function (a, b) { return num(a, 'deal') - num(b, 'deal'); },
      gap: function (a, b) { return num(a, 'gap') - num(b, 'gap'); },
      days: function (a, b) { return num(a, 'days') - num(b, 'days'); },
      price: function (a, b) { return num(b, 'price') - num(a, 'price'); }
    };

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var key = chip.getAttribute('data-rs-sort');
        chips.forEach(function (c) {
          var on = c === chip;
          c.classList.toggle('is-on', on);
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        /* Reordering the DOM, not toggling visibility: reading order and screen
           order have to stay the same thing (§5 of the listing engine). */
        deals.slice().sort(SORTERS[key] || SORTERS.date).forEach(function (row) {
          tbody.appendChild(row);
        });
      });
    });

    /* ----------------------------------------------------- the timeline --- */

    var steps = $$('[data-rs-step]');
    var stepBtns = $$('[data-rs-step-btn]');
    var notes = $$('[data-rs-note]');
    var tlFill = $('[data-rs-tl]');
    var FILLS = ['rstl__done--w0', 'rstl__done--w25', 'rstl__done--w50',
                 'rstl__done--w75', 'rstl__done--w100'];

    function selectStep(i) {
      steps.forEach(function (s, n) {
        s.classList.toggle('is-on', n === i);
        s.classList.toggle('is-reached', n <= i);
        s.classList.toggle('is-ahead', n > i);
      });
      stepBtns.forEach(function (b, n) { b.setAttribute('aria-pressed', n === i ? 'true' : 'false'); });
      notes.forEach(function (nd, n) { nd.hidden = n !== i; });
      if (tlFill) {
        FILLS.forEach(function (cls) { tlFill.classList.remove(cls); });
        /* The rule stops at the selected step, and the widths are classes for
           the same reason the bars are: no inline styles anywhere on this site. */
        tlFill.classList.add(FILLS[Math.round(i / (steps.length - 1) * 4)] || FILLS[0]);
      }
    }

    stepBtns.forEach(function (btn, i) {
      btn.addEventListener('click', function () { selectStep(i); });
      btn.addEventListener('mouseenter', function () { selectStep(i); });
      btn.addEventListener('focus', function () { selectStep(i); });
    });
  }());


  /* ==========================================================================
     9ae. For rent — affordability filters, move-in calculator, speed, documents
     -----------------------------------------------------------------------------
     Nothing here creates content. Both document checklists are in the markup,
     all five speed notes are written out, every listing card carries its own
     all-in line, and the calculator is printed already solved for the default
     property on a long let. With scripting off the page reads whole.

     ONE FORMATTER, FOR MONEY AND FOR COUNTS
     ---------------------------------------
     `group()` does both. The handoff lost a review round to counts being
     interpolated raw (`matches 2860 advertised rents`) while money went through
     a grouping helper — so `1 218` in the honest sentence has to be grouped by
     the same code that produces `€5 945` in the total.

     THE BAR PLOTS COUNTS
     --------------------
     Its legend therefore names counts, and both labels are generated from the
     two numbers. Do not relabel it in money: the gold bar is the SHORTER one,
     and under money words that reads as all-in being cheaper — the opposite of
     the `+15%` card beside it.
     ========================================================================== */

  (function forRent() {
    var afford = $('.frafford');
    if (!afford) { return; }

    /* Rates and multipliers live on the controls the builder printed, so the
       page has one copy of each number rather than one here and one there. */
    var STAMP_RATE = 0.1;
    var BILLS_UTILITIES = 0.62;
    var BILLS_INTERNET = 0.38;
    var FLAG_STEP = -0.14;
    var COUNT_FLOOR = 12;

    function group(n) {
      return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    function money(n) { return '€' + group(n); }

    /* ------------------------------------------------------ the controls --- */

    var termInputs = $$('[data-fr-term]');
    var budgetInputs = $$('[data-fr-budget]');
    var bedInputs = $$('[data-fr-bed]');
    var mustInputs = $$('[data-fr-must]');
    var pickBtns = $$('[data-fr-pick]');

    function term() {
      var el = termInputs.filter(function (i) { return i.checked; })[0] || termInputs[0];
      return {
        index: Number(el.getAttribute('data-fr-term')),
        label: el.nextElementSibling ? el.nextElementSibling.textContent.trim() : '',
        months: el.getAttribute('data-fr-months') || '',
        deposit: Number(el.getAttribute('data-fr-deposit')),
        agency: Number(el.getAttribute('data-fr-agency')),
        stamp: el.getAttribute('data-fr-stamp') === '1'
      };
    }

    function budget() {
      var el = budgetInputs.filter(function (i) { return i.checked; })[0] || budgetInputs[0];
      var label = el.value;
      return { label: label, ceiling: Number(label.replace(/[^\d]/g, '')) };
    }

    function bed() {
      var el = bedInputs.filter(function (i) { return i.checked; })[0] || bedInputs[0];
      return el.value;
    }

    function pick() {
      var el = pickBtns.filter(function (b) {
        return b.getAttribute('aria-pressed') === 'true';
      })[0] || pickBtns[0];
      return {
        el: el,
        rent: Number(el.getAttribute('data-fr-rent')),
        condo: Number(el.getAttribute('data-fr-condo')),
        bills: Number(el.getAttribute('data-fr-bills'))
      };
    }

    /* ---------------------------------------------------- the arithmetic --- */

    function calc() {
      var t = term();
      var p = pick();
      var deposit = p.rent * t.deposit;
      var agency = p.rent * t.agency;
      var stamp = t.stamp ? Math.round(p.rent * STAMP_RATE) : 0;
      var total = p.rent + deposit + agency + stamp;
      return {
        t: t, p: p, deposit: deposit, agency: agency, stamp: stamp, total: total,
        months: (total / p.rent).toFixed(1),
        utilities: Math.round(p.bills * BILLS_UTILITIES),
        internet: Math.round(p.bills * BILLS_INTERNET),
        trueMonthly: p.rent + p.condo + p.bills
      };
    }

    /* ---------------------------------------------------------- painting --- */

    var lines = $$('.frline');
    var monthOuts = $$('[data-fr-month]');

    function paintCalc() {
      var c = calc();

      /* Four rows, in the order the builder printed them. The stamp-duty row
         is not removed when it does not apply — a tenant should see what they
         are not paying. */
      var rows = [
        { basis: '1 × rent', value: c.p.rent, on: true },
        { basis: c.t.deposit + ' × rent', value: c.deposit, on: true },
        { basis: c.t.agency + ' × rent', value: c.agency, on: true },
        { basis: STAMP_RATE + ' × rent', value: c.stamp, on: c.t.stamp }
      ];
      lines.forEach(function (line, i) {
        var r = rows[i];
        if (!r) { return; }
        line.classList.toggle('frline--off', !r.on);
        setText($('[data-fr-basis]', line), r.on ? r.basis : '—');
        setText($('[data-fr-amount]', line), r.on ? money(r.value) : '—');
      });

      setText($('[data-fr-total]'), money(c.total));
      setText($('[data-fr-months]'), c.months + ' months of rent before you have the keys');
      setText($('[data-fr-terms]'),
        c.t.label + ' · ' + c.t.months + ' · deposit ' + c.t.deposit + ' × rent');

      var monthly = [c.p.rent, c.p.condo, c.utilities, c.internet, null];
      monthOuts.forEach(function (out, i) {
        if (monthly[i] !== null) { setText(out, money(monthly[i])); }
      });

      setText($('[data-fr-true]'), money(c.trueMonthly));

      var b = budget();
      var over = c.trueMonthly > b.ceiling;
      var verdict = $('[data-fr-verdict]');
      if (verdict) {
        verdict.classList.toggle('is-over', over);
        setText(verdict, (over ? 'over' : 'inside') + ' your ' + b.label + ' ceiling');
      }

      /* §01's premium is derived from the property selected in §02 — that link
         is why the two sections can never disagree. */
      setText($('[data-fr-premium]'),
        '+' + Math.round((c.trueMonthly - c.p.rent) / c.p.rent * 100) + '%');

      setText($('[data-fr-income]'), c.t.index === 0 ? '3 × rent' : '1 month');
      setText($('[data-fr-grid-note]'),
        'True monthly shown under every rent · ' + c.t.label.toLowerCase() + ' terms');
    }

    function paintCounts() {
      var bEl = budgetInputs.filter(function (i) { return i.checked; })[0] || budgetInputs[0];
      var advertised = Number(bEl.getAttribute('data-fr-advertised'));
      var allIn = Number(bEl.getAttribute('data-fr-allin'));
      var beds = bed();
      var flags = mustInputs.filter(function (i) { return i.checked; }).length;

      var advMod = beds === '3+' ? 0.46 : beds === '2' ? 0.8 : 1;
      var realMod = beds === '3+' ? 0.42 : beds === '2' ? 0.78 : 1;
      var adv = Math.round(advertised * advMod);
      var real = Math.max(COUNT_FLOOR, Math.round(allIn * (1 + flags * FLAG_STEP) * realMod));

      setText($('[data-fr-honest]'),
        'A ceiling of ' + budget().label + ' a month matches ' + group(adv) +
        ' advertised rents — but only ' + group(real) +
        ' once the condominium charge and the bills are counted in.');

      /* Counts, not money. See the block header. */
      setText($('[data-fr-leg-all]'), group(adv) + ' advertised rents in budget');
      setText($('[data-fr-leg-real]'), group(real) + ' still in budget all in');

      var bar = $('[data-fr-bar]');
      if (bar) {
        bar.className = 'frbar__real';
        bar.style.width = Math.min(100, real / adv * 100).toFixed(2) + '%';
      }
    }

    termInputs.forEach(function (i) {
      i.addEventListener('change', function () { paintCalc(); });
    });
    budgetInputs.forEach(function (i) {
      i.addEventListener('change', function () { paintCounts(); paintCalc(); });
    });
    bedInputs.concat(mustInputs).forEach(function (i) {
      i.addEventListener('change', function () { paintCounts(); });
    });

    pickBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        pickBtns.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        paintCalc();
      });
    });

    /* --------------------------------------------------------- the bands --- */

    var bands = $$('[data-fr-band]');
    var notes = $$('[data-fr-note]');
    var bandRest = bands.filter(function (b) { return b.classList.contains('is-on'); })[0];

    function selectBand(el) {
      bands.forEach(function (b) {
        var on = b === el;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var i = bands.indexOf(el);
      notes.forEach(function (n, k) { n.hidden = k !== i; });
    }

    bands.forEach(function (b) {
      b.addEventListener('mouseenter', function () { selectBand(b); });
      b.addEventListener('focus', function () { selectBand(b); });
      b.addEventListener('click', function () { selectBand(b); });
    });

    var bandList = $('.frbands');
    if (bandList && bandRest) {
      /* Back to the band the builder marked, not to nothing — leaving the list
         should not blank the note box. */
      bandList.addEventListener('mouseleave', function () { selectBand(bandRest); });
    }

    /* ------------------------------------------------------ the checklist --- */

    $$('[data-fr-region]').forEach(function (input) {
      input.addEventListener('change', function () {
        var code = input.getAttribute('data-fr-region');
        $$('[data-fr-list]').forEach(function (list) {
          list.hidden = list.getAttribute('data-fr-list') !== code;
        });
        $$('[data-fr-intro]').forEach(function (intro) {
          intro.hidden = intro.getAttribute('data-fr-intro') !== code;
        });
      });
    });

    paintCounts();
    paintCalc();
  }());


  /* ==========================================================================
     9af. Land & plots — plot picker, cost model, permits
     -----------------------------------------------------------------------------
     Nothing here creates content. Every plot's diagram, service list, constraint
     list and permit timeline is written out by the builder and hidden with
     `hidden`; the cost panel is printed already solved for the default plot on
     the standard tier. With scripting off the page reads whole for one plot,
     which is the honest fallback for a page whose whole middle is a selector.

     ONE RECORD PER PLOT
     -------------------
     This block never derives a reference, never counts services, and never
     re-formats an index. It shows and hides panels the builder wrote from a
     single record, and it recomputes only the money — which is the one thing
     that depends on a control the builder cannot know (the build tier).

     THE PERMIT STEP RESETS ON PLOT CHANGE
     -------------------------------------
     Leaving step 3 selected while switching to a plot whose timeline is a
     different shape would point the rule at a stage that does not exist there.
     ========================================================================== */

  (function landPlots() {
    var build = $('.lpbuild');
    if (!build) { return; }

    var TRANSFER = 0.081;
    var DESIGN = 0.09;
    var LICENCES = 42;

    function group(n) {
      return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    function money(n) { return '€' + group(n); }

    var picks = $$('[data-lp-pick]');
    var diagrams = $$('[data-lp-diagram]');
    var services = $$('[data-lp-services]');
    var consPanels = $$('[data-lp-cons]');
    var permitPanels = $$('[data-lp-permit]');
    var tiers = $$('[data-lp-tier]');

    var current = 0;
    picks.forEach(function (b, i) {
      if (b.classList.contains('is-on')) { current = i; }
    });

    /* The figures the money depends on ride on the markup the builder wrote:
       the plot's own price and area on its picker button, the buildable area
       on its stat cell. Nothing is duplicated into this file. */
    function plotFacts(i) {
      var panel = diagrams[i];
      var stats = $$('.lpbstat__value', panel);
      var buildable = Number((stats[2] ? stats[2].textContent : '0').replace(/[^\d]/g, ''));
      var conn = $('.lpconn__value', services[i]);
      return {
        buildable: buildable,
        connections: Number((conn ? conn.textContent : '0').replace(/[^\d]/g, '')),
        price: Number(picks[i].getAttribute('data-lp-price')),
        muni: picks[i].getAttribute('data-lp-muni'),
        built: Number(picks[i].getAttribute('data-lp-built'))
      };
    }

    function tier() {
      var el = tiers.filter(function (t) { return t.checked; })[0] || tiers[0];
      return { label: el.value, rate: Number(el.getAttribute('data-lp-rate')) };
    }

    var billRows = $('[data-lp-bill]');
    var totalOut = $('[data-lp-total]');
    var rateOut = $('[data-lp-rate-line]');
    var headOut = $('[data-lp-bill-head]');
    var verdictOut = $('[data-lp-verdict]');
    var barsOut = $('[data-lp-bars]');

    function paintCost() {
      var f = plotFacts(current);
      var t = tier();
      var transfer = Math.round(f.price * TRANSFER);
      var construction = f.buildable * t.rate;
      var design = Math.round(construction * DESIGN);
      var licences = Math.round(f.buildable * LICENCES);
      var total = f.price + transfer + construction + design + licences + f.connections;
      var selfRate = Math.round(total / f.buildable);
      var top = Math.max(selfRate, f.built);

      var values = [f.price, transfer, construction, design, licences, f.connections];
      $$('.lprow__value', billRows).forEach(function (out, i) {
        if (values[i] !== undefined) { setText(out, money(values[i])); }
      });
      var bases = $$('.lprow__basis', billRows);
      if (bases[2]) { setText(bases[2], money(t.rate) + ' / m²'); }

      setText(headOut, 'Land, tax, build and fees · ' + t.label.toLowerCase() + ' build');
      setText(totalOut, money(total));
      setText(rateOut, group(f.buildable) + ' m² finished at ' + money(selfRate) + ' per m²');

      var bars = $$('.lpbar', barsOut);
      var pairs = [[selfRate, money(selfRate)], [f.built, money(f.built)]];
      bars.forEach(function (bar, i) {
        var v = $('.lpbar__value', bar);
        var fill = $('.lpbar__fill', bar);
        if (v) { setText(v, pairs[i][1] + ' / m²'); }
        if (fill) { fill.className = 'lpbar__fill'; fill.style.width = (pairs[i][0] / top * 100).toFixed(2) + '%'; }
      });
      var label = $('.lpbar--built .lpbar__label', barsOut);
      if (label) { setText(label, 'Buying built in ' + f.muni); }

      var cheaper = selfRate < f.built;
      var diff = Math.abs(Math.round((selfRate - f.built) / f.built * 100));
      verdictOut.classList.toggle('is-dear', !cheaper);
      setText(verdictOut, cheaper
        ? 'Building here works out ' + diff + '% below what a finished house of the same size '
          + 'costs in ' + f.muni + ' — and you choose the plan.'
        : 'Building here costs ' + diff + '% more than a finished house of the same size in '
          + f.muni + '. Worth it for the design, not for the money.');
    }

    /* ------------------------------------------------------- the permits --- */

    function paintPermit(plot, step) {
      var panel = permitPanels[plot];
      if (!panel) { return; }
      var steps = $$('[data-lp-step]', panel);
      var notes = $$('[data-lp-pnote]', panel);
      steps.forEach(function (s, j) {
        s.classList.toggle('is-on', j === step);
        s.classList.toggle('is-reached', j <= step);
        var btn = $('[data-lp-step-btn]', s);
        if (btn) { btn.setAttribute('aria-pressed', j === step ? 'true' : 'false'); }
      });
      notes.forEach(function (n, j) { n.hidden = j !== step; });
      var fill = $('[data-lp-tl]', panel);
      if (fill && steps.length > 1) {
        fill.className = 'lptl__done';
        fill.style.width = (step / (steps.length - 1) * 100).toFixed(2) + '%';
      }
    }

    permitPanels.forEach(function (panel, plot) {
      $$('[data-lp-step-btn]', panel).forEach(function (btn, j) {
        var go = function () { paintPermit(plot, j); };
        btn.addEventListener('click', go);
        btn.addEventListener('mouseenter', go);
        btn.addEventListener('focus', go);
      });
    });

    /* ---------------------------------------------------- the plot switch --- */

    function selectPlot(i) {
      current = i;
      picks.forEach(function (b, n) {
        var on = n === i;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      [diagrams, services, consPanels, permitPanels].forEach(function (set) {
        set.forEach(function (el, n) { el.hidden = n !== i; });
      });
      setText($('[data-lp-name]'), picks[i].getAttribute('data-lp-plot'));
      setText($('[data-lp-ref]'),
        picks[i].getAttribute('data-lp-ref') + ' · ' + picks[i].getAttribute('data-lp-muni'));
      /* Back to step 1 — a step index means nothing across two timelines. */
      paintPermit(i, 1);
      paintCost();
    }

    picks.forEach(function (btn, i) {
      btn.addEventListener('click', function () { selectPlot(i); });
    });

    tiers.forEach(function (t) {
      t.addEventListener('change', function () { paintCost(); });
    });

    /* ------------------------------------------------------- the register --- */

    $$('[data-lp-class]').forEach(function (input) {
      input.addEventListener('change', function () {
        var label = input.value;
        var count = input.getAttribute('data-lp-count');
        setText($('[data-lp-line]'), label === 'All plots'
          ? count + ' plots on the register with a zoning certificate on file'
          : count + ' ' + label.toLowerCase()
            + ' plots on the register with a zoning certificate on file');
      });
    });

    paintCost();
  }());


  /* ==========================================================================
     9ag. Commercial — the mode switch, the asset picker, the register
     --------------------------------------------------------------------------
     The mode switch is the page. An investor and an occupier want different
     numbers about the same buildings, so §01–§06 are printed TWICE by the
     builder and tagged `data-cm-only="invest|occupy"`; switching mode is one
     loop over that one hook. Nothing here creates a section, a row or a
     sentence — with scripting off the page reads whole in Invest.

     THE ONE THING THIS BLOCK COMPUTES
     ---------------------------------
     Changing the asset is the only interaction the builder cannot pre-render
     (five assets × two modes × ledger + metrics + risks is not markup worth
     shipping), so the arithmetic of §5.2 and §5.3 of the handoff lives here as
     well as in the builder. It reads the asset's record off its own picker
     button and the rates off the panel — never a second copy of the data — and
     the builder asserts the control figures the handoff publishes, so the two
     implementations are pinned to the same answers.

     A MODE CHANGE CAN EMPTY A LIST
     ------------------------------
     Retail has nothing to occupy. `paintGrid()` therefore has to be able to
     hide every card and show the bordered empty state — a filter that assumes
     at least one result is how you get a 2px sliver of hairline where a grid
     used to be.
     ========================================================================== */

  (function commercial() {
    var calc = $('.cmcalc');
    if (!calc) { return; }

    /* Jurisdiction-dependent, so the builder writes them onto the panel from
       data/rates.json rather than compiling them in here. */
    var ACQ = Number(calc.getAttribute('data-cm-acq'));
    var AMORT = Number(calc.getAttribute('data-cm-amort'));
    var FREE = Number(calc.getAttribute('data-cm-free'));
    var BIZ = Number(calc.getAttribute('data-cm-biz'));

    function group(n) {
      return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    function money(n) { return '€' + group(n); }
    function mil(n) { return '€' + (n / 1000000).toFixed(2) + 'M'; }
    /* Two decimals always: ten basis points is a real difference in this
       market, and `5.2%` hides it. */
    function pct(n) { return n.toFixed(2) + '%'; }
    /* 0.068 * 100 is 6.800000000000001 in binary floating point — round
       before printing a rate, never concatenate the product. */
    function ratePct(x) { return String(Number((x * 100).toFixed(4))); }

    var mode = 'invest';
    var picks = $$('[data-cm-pick]');
    var current = 0;

    function record(btn) {
      function num(name) { return Number(btn.getAttribute('data-cm-' + name)); }
      return {
        name: btn.getAttribute('data-cm-pick-name'),
        ref: btn.getAttribute('data-cm-pick-ref'),
        epc: btn.getAttribute('data-cm-epc'),
        price: num('price'), rent: num('rent'), nonRec: num('nonrec'), capex: num('capex'),
        occupancy: num('occupancy'), wault: num('wault'), area: num('area'),
        rentSqm: num('rentsqm'), service: num('service'), fitout: num('fitout'),
        desks: num('desks'), vacant: num('vacant')
      };
    }

    /* ------------------------------------------------- the two arithmetics --- */

    function investor(a) {
      var acquisition = Math.round(a.price * ACQ);
      var totalCost = a.price + acquisition;
      var noi = a.rent - a.nonRec;
      var niy = noi / totalCost * 100;
      return {
        acquisition: acquisition, totalCost: totalCost, noi: noi, niy: niy,
        gross: a.rent / a.price * 100,
        reversion: a.occupancy < 100
          ? ((a.rent / (a.occupancy / 100)) - a.nonRec) / totalCost * 100
          : niy,
        perSqm: Math.round(a.price / a.area)
      };
    }

    /* The headline IS the sum of the rows. Computing it independently is how
       the design review found it €11 458 high with five rows on screen. */
    function occupier(a) {
      var rent = a.area * a.rentSqm;
      var rows = [rent, a.area * a.service, Math.round(a.area * a.fitout / AMORT),
        -Math.round(rent * FREE), Math.round(rent * BIZ)];
      var total = rows.reduce(function (t, n) { return t + n; }, 0);
      return {
        rows: rows, total: total,
        perSqm: Math.round(total / a.area),
        perDesk: a.desks > 0 ? Math.round(total / a.desks) : 0
      };
    }

    /* ------------------------------------------------------- §02 repaint --- */

    var TONE = {
      Strong: 'positive', Institutional: 'positive', Good: 'positive',
      Immediate: 'positive', 'Cat A': 'positive', Permitted: 'positive',
      Adequate: 'accent', Mixed: 'accent', Exercised: 'accent',
      'Break at year 3': 'accent',
      'On expiry': 'dim',
      Weak: 'warn', 'Capex needed': 'warn', 'Shell and core': 'warn'
    };

    function investLedger(a) {
      var v = investor(a);
      return {
        rows: [
          [a.ref, money(v.perSqm) + ' / m²', mil(a.price)],
          ['IMT, stamp duty, notary, agency and legal',
            ratePct(ACQ) + '% of price', money(v.acquisition)],
          [a.occupancy === 100 ? 'Fully let on the schedule below'
            : a.occupancy + '% let — see the schedule below',
          'per annum', money(a.rent)],
          ['Void service charge, insurance, management', 'per annum', '−' + money(a.nonRec)],
          ['Lift, roof and plant over the first five years', 'one-off', money(a.capex)]
        ],
        headline: pct(v.niy),
        note: money(v.noi) + ' net income over ' + mil(v.totalCost) + ' total outlay',
        metrics: [
          pct(v.niy), pct(v.gross), pct(v.reversion), a.wault.toFixed(1) + ' yrs'
        ],
        metricTone: ['accent', '', v.reversion > v.niy + 0.4 ? 'positive' : '',
          a.wault < 3 ? 'warn' : ''],
        risks: [
          a.wault > 5 ? 'Strong' : a.wault > 3 ? 'Adequate' : 'Weak',
          a.occupancy === 100 ? 'Institutional' : 'Mixed',
          'Exercised',
          a.epc === 'EPC C' ? 'Capex needed' : 'Good'
        ]
      };
    }

    function occupyLedger(a) {
      var o = occupier(a);
      return {
        rows: [
          [group(a.area) + ' m² at ' + money(a.rentSqm) + ' per m²',
            'per annum', money(o.rows[0])],
          ['Common parts, security, plant maintenance',
            money(a.service) + ' / m²', money(o.rows[1])],
          ['Category B, amortised over the five-year term',
            money(a.fitout) + ' / m²', money(o.rows[2])],
          ['Six months on a five-year term, spread', 'credit', '−' + money(-o.rows[3])],
          ['Municipal IMI, payable by the occupier', 'per annum', money(o.rows[4])]
        ],
        headline: money(o.total),
        note: money(o.perSqm) + ' per m² per year, all in',
        metrics: [
          group(a.area) + ' m²',
          a.desks > 0 ? group(a.desks) : 'n/a',
          o.perDesk > 0 ? money(o.perDesk) : 'n/a',
          a.epc
        ],
        metricTone: ['', '', 'accent', a.epc === 'EPC C' ? 'warn' : 'positive'],
        risks: [
          a.vacant > 0 ? 'Immediate' : 'On expiry',
          a.epc === 'EPC C' ? 'Shell and core' : 'Cat A',
          'Break at year 3',
          'Permitted'
        ]
      };
    }

    function paintPane(key, model) {
      $$('[data-cm-ledger="' + key + '"] .cmrow').forEach(function (row, i) {
        var cells = model.rows[i];
        if (!cells) { return; }
        setText($('.cmrow__note', row), cells[0]);
        setText($('.cmrow__basis', row), cells[1]);
        setText($('.cmrow__value', row), cells[2]);
      });
      setText($('[data-cm-headline="' + key + '"]'), model.headline);
      setText($('[data-cm-headnote="' + key + '"]'), model.note);

      $$('[data-cm-metrics="' + key + '"] .cmmetric__value').forEach(function (cell, i) {
        setText(cell, model.metrics[i]);
        cell.className = 'cmmetric__value'
          + (model.metricTone[i] ? ' cmmetric__value--' + model.metricTone[i] : '');
      });

      $$('[data-cm-risks="' + key + '"] .cmpill').forEach(function (pill, i) {
        setText(pill, model.risks[i]);
        pill.className = 'cmpill cmpill--' + (TONE[model.risks[i]] || 'faint');
      });
    }

    function selectAsset(i) {
      current = i;
      picks.forEach(function (btn, n) {
        btn.classList.toggle('is-on', n === i);
        btn.setAttribute('aria-pressed', n === i ? 'true' : 'false');
      });
      var a = record(picks[i]);
      setText($('[data-cm-asset-name]'), a.name);
      setText($('[data-cm-asset-ref]'), a.ref);
      /* Both panes, not just the visible one: switching mode afterwards must
         not reveal the previous asset's figures. */
      paintPane('invest', investLedger(a));
      paintPane('occupy', occupyLedger(a));
    }

    picks.forEach(function (btn, i) {
      btn.addEventListener('click', function () { selectAsset(i); });
    });

    /* ---------------------------------------------------------- §04 bars --- */
    /* Each bar carries its own sentence, written by the builder so the wording
       has one source — including the empty year, which gets its own. */

    var noteOut = $('[data-cm-note]');

    $$('[data-cm-chart]').forEach(function (chart) {
      var bars = $$('.cmbar', chart);
      function pick(j) {
        bars.forEach(function (bar, n) {
          bar.classList.toggle('is-on', n === j);
          var btn = $('.cmbar__btn', bar);
          if (btn) { btn.setAttribute('aria-pressed', n === j ? 'true' : 'false'); }
        });
        var chosen = $('.cmbar__btn', bars[j]);
        if (chosen) { setText(noteOut, chosen.getAttribute('data-cm-barnote')); }
      }
      bars.forEach(function (bar, j) {
        var btn = $('.cmbar__btn', bar);
        if (!btn) { return; }
        btn.addEventListener('click', function () { pick(j); });
        btn.addEventListener('mouseenter', function () { pick(j); });
        btn.addEventListener('focus', function () { pick(j); });
      });
    });

    /* --------------------------------------------------------- §06 grid --- */

    var cards = $$('[data-cm-grid] .cmcard');
    var grid = $('[data-cm-grid]');
    var empty = $('[data-cm-empty]');
    var emptyLine = $('[data-cm-empty-line]');
    var countOut = $('[data-cm-count]');
    var sectorInputs = $$('[data-cm-sector]');

    function sector() {
      var on = sectorInputs.filter(function (s) { return s.checked; })[0] || sectorInputs[0];
      return on.getAttribute('data-cm-sector');
    }

    function paintGrid() {
      var want = sector();
      var shown = 0;
      cards.forEach(function (card) {
        var fits = want === 'All' || card.getAttribute('data-cm-card-sector') === want;
        /* In Occupy the availability filter applies on top of the sector. */
        var has = mode === 'invest' || Number(card.getAttribute('data-cm-avail')) > 0;
        var on = fits && has;
        card.hidden = !on;
        if (on) { shown += 1; }
      });

      grid.hidden = shown === 0;
      empty.hidden = shown > 0;
      if (shown === 0) {
        var label = want.toLowerCase();
        setText(emptyLine, 'No ' + label + ' space is available to occupy right now. '
          + 'Switch to Invest to see ' + label + ' assets for sale, or pick another sector.');
      }

      setText(countOut, mode === 'invest'
        ? shown + (shown === 1 ? ' asset on the register' : ' assets on the register')
        : shown + (shown === 1 ? ' building with space' : ' buildings with space'));
    }

    /* A sector with no stock in this mode dims but stays clickable: "there is
       no retail to occupy" is the answer, and the reader has to be able to ask
       the question to get it. */
    function paintChips() {
      sectorInputs.forEach(function (input) {
        var want = input.getAttribute('data-cm-sector');
        var stocked = cards.some(function (card) {
          var fits = want === 'All' || card.getAttribute('data-cm-card-sector') === want;
          return fits && (mode === 'invest' || Number(card.getAttribute('data-cm-avail')) > 0);
        });
        var label = $('label[for="' + input.id + '"]');
        if (label) { label.classList.toggle('is-empty', !stocked); }
      });
    }

    sectorInputs.forEach(function (input) {
      input.addEventListener('change', paintGrid);
    });

    /* ---------------------------------------------------- the mode switch --- */

    function setMode(next) {
      mode = next;
      $$('[data-cm-only]').forEach(function (el) {
        el.hidden = el.getAttribute('data-cm-only') !== mode;
      });
      /* Reset the selections the handoff says reset: asset, row and bar. The
         row is CSS hover; the bar resets by repainting its default. */
      selectAsset(0);
      $$('[data-cm-chart]').forEach(function (chart) {
        $$('.cmbar', chart).forEach(function (bar, j) {
          bar.classList.toggle('is-on', j === 2);
          var btn = $('.cmbar__btn', bar);
          if (btn) { btn.setAttribute('aria-pressed', j === 2 ? 'true' : 'false'); }
        });
      });
      var live = $('[data-cm-chart="' + mode + '"] .cmbar.is-on .cmbar__btn');
      if (live) { setText(noteOut, live.getAttribute('data-cm-barnote')); }
      paintChips();
      paintGrid();
    }

    $$('[data-cm-mode]').forEach(function (input) {
      input.addEventListener('change', function () {
        setMode(input.getAttribute('data-cm-mode'));
      });
    });

    paintChips();
    paintGrid();
  }());


  /* ==========================================================================
     9ah. Home detail v5 — the rooms, the calculator, the reviews, the form
     --------------------------------------------------------------------------
     Nothing here creates content. Every room, review, document and figure is in
     the markup; the tabs, the review target, the rating, the term and the slots
     are radio groups. With scripting off the page shows every review, the
     calculator prints the answer for its defaults, and the form still submits.

     ONE COMPUTATION, THREE PLACES
     -----------------------------
     One render writes the monthly total, the segmented bar, the four rows AND
     the cash at completion. They cannot disagree because there is only one of
     them. Guarded edges: a deposit above the price (the loan floors at zero), a
     typed rate of zero (fall back to `loan / n` — the slider bottoms out at
     1.50 but the field does not) and a zero term.

     `hover || chosen` IS WHAT MAKES THE STAR ROW FEEL RIGHT
     -------------------------------------------------------
     Hovering previews the fill and the word without destroying the chosen
     value; leaving the row sets the preview back to 0 and the chosen value
     returns. The submit label stays `Pick a rating first` until a star is
     actually clicked — a preview is not a choice.
     ========================================================================== */

  (function homeDetailV5() {
    var calc = $('[data-p5-calc]');
    if (!calc) { return; }

    function num(name) { return Number(calc.getAttribute('data-p5-' + name)); }
    var PRICE = num('price');
    var CONDO = num('condo'), TAX = num('tax'), UTIL = num('util');
    var EXTRAS = num('extras');

    /* French grouping gives a space; the replace turns the narrow and
       non-breaking ones into plain spaces so figures copy-paste cleanly. */
    function nf(v) {
      return Math.round(v).toLocaleString('fr-FR').replace(/ | /g, ' ');
    }
    function eur(v) { return '€' + nf(Math.abs(v)); }

    /* --------------------------------------------------------- the rooms --- */
    /* A room and its row are one control, not two: hovering or focusing either
       lights both and rewrites the section note. Leaving the pair resets to
       -1 — a defined resting state rather than an implicit one. */

    var planRooms = $$('[data-p5-room]');
    var roomRows = $$('[data-p5-roomrow]');
    var roomNote = $('[data-p5-roomnote]');
    var roomPair = $('[data-p5-roompair]');
    var restNote = roomNote ? roomNote.textContent : '';

    function lightRoom(i) {
      planRooms.forEach(function (r, n) {
        r.classList.toggle('is-on', n === i);
        r.setAttribute('aria-pressed', n === i ? 'true' : 'false');
      });
      roomRows.forEach(function (b, n) {
        b.classList.toggle('is-on', n === i);
        b.setAttribute('aria-pressed', n === i ? 'true' : 'false');
      });
      if (i === -1) { setText(roomNote, restNote); return; }
      var row = roomRows[i];
      setText(roomNote, row ? row.getAttribute('data-p5-note') : restNote);
    }

    planRooms.concat(roomRows).forEach(function (el) {
      var i = Number(el.getAttribute('data-p5-room') || el.getAttribute('data-p5-roomrow'));
      ['mouseenter', 'focus', 'click'].forEach(function (evt) {
        el.addEventListener(evt, function () { lightRoom(i); });
      });
    });

    if (roomPair) {
      roomPair.addEventListener('mouseleave', function () { lightRoom(-1); });
    }

    /* ---------------------------------------------------- the viewing slot --- */

    var cta = $('[data-p5-cta]');
    $$('[data-p5-slot]').forEach(function (input) {
      input.addEventListener('change', function () {
        setText(cta, 'Book ' + input.getAttribute('data-p5-slot') + ' with Anna');
      });
    });

    /* ---------------------------------------------------- cost of owning --- */

    var depInput = $('[data-p5-deposit]');
    var depSlider = $('[data-p5-depslider]');
    var depPct = $('[data-p5-deppct]');
    var rateInput = $('[data-p5-rate]');
    var rateSlider = $('[data-p5-rateslider]');
    var rateNote = $('[data-p5-ratenote]');
    var totalOut = $('[data-p5-total]');
    var cashOut = $('[data-p5-cash]');
    var segs = $$('[data-p5-seg]');
    var breaks = $$('[data-p5-break]');

    var deposit = Number(String(depInput.value).replace(/[^0-9]/g, '')) || 0;
    var rate = Number(String(rateInput.value).replace(/[^0-9.]/g, '')) || 0;
    var term = Number(($$('[data-p5-term]').filter(function (t) { return t.checked; })[0]
      || {}).value) || 25;

    function paint() {
      var loan = Math.max(0, PRICE - deposit);
      var r = rate / 100 / 12;
      var n = term * 12;
      /* The rate field can be typed to zero even though the slider stops at
         1.50; without this branch the annuity divides by zero and the whole
         panel renders NaN. */
      var pay = n <= 0 ? 0 : (r === 0 ? loan / n : loan * r / (1 - Math.pow(1 + r, -n)));
      var total = pay + CONDO + TAX + UTIL;
      var parts = [pay, CONDO, TAX, UTIL];

      setText(totalOut, eur(total));
      setText(cashOut, eur(deposit + EXTRAS));
      breaks.forEach(function (out, i) { setText(out, eur(parts[i])); });
      segs.forEach(function (seg, i) {
        seg.style.width = total > 0 ? (parts[i] / total * 100).toFixed(1) + '%' : '0%';
      });

      var pct = Math.round(deposit / PRICE * 100);
      setText(depPct, pct + '%');
      if (depSlider) { depSlider.setAttribute('aria-valuetext', pct + '% of the price'); }
      if (rateSlider) { rateSlider.setAttribute('aria-valuetext', rate + ' per cent'); }
      setText(rateNote, rate < 3.2 ? 'below market' : rate > 4 ? 'above market' : 'market average');
    }

    depInput.addEventListener('input', function () {
      deposit = Number(String(depInput.value).replace(/[^0-9]/g, '')) || 0;
      if (depSlider) { depSlider.value = Math.round(deposit / PRICE * 100); }
      paint();
    });

    if (depSlider) {
      depSlider.addEventListener('input', function () {
        deposit = Math.round(PRICE * Number(depSlider.value) / 100);
        depInput.value = nf(deposit);
        paint();
      });
    }

    rateInput.addEventListener('input', function () {
      rate = Number(String(rateInput.value).replace(/[^0-9.]/g, '')) || 0;
      if (rateSlider) { rateSlider.value = Math.round(rate * 100); }
      paint();
    });

    if (rateSlider) {
      rateSlider.addEventListener('input', function () {
        rate = Math.round(Number(rateSlider.value)) / 100;
        rateInput.value = String(rate);
        paint();
      });
    }

    $$('[data-p5-term]').forEach(function (input) {
      input.addEventListener('change', function () {
        term = Number(input.value) || 25;
        paint();
      });
    });

    /* ------------------------------------------------------- the reviews --- */

    var reviewItems = $$('[data-p5-review]');
    var seeAll = $('[data-p5-seeall]');
    var SEE_ALL = {
      all: 'See all 98 reviews →',
      agent: 'See all 62 reviews of Anna →',
      property: 'See all 36 reviews of this file →'
    };

    $$('[data-p5-tab]').forEach(function (input) {
      input.addEventListener('change', function () {
        var want = input.getAttribute('data-p5-tab');
        reviewItems.forEach(function (li) {
          li.hidden = want !== 'all' && li.getAttribute('data-p5-review') !== want;
        });
        setText(seeAll, SEE_ALL[want] || SEE_ALL.all);
      });
    });

    /* ---------------------------------------------------------- the form --- */

    var stars = $$('[data-p5-star]');
    var starWord = $('[data-p5-starword]');
    var submit = $('[data-p5-submit]');
    var formHeading = $('[data-p5-formheading]');
    var placeholder = $('[data-p5-placeholder]');
    var WORDS = ['Pick a rating', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
    var COPY = {
      agent: { heading: 'How was Anna to deal with?',
               placeholder: 'What she got right, and what she could have done better.',
               submit: 'Post this review of Anna' },
      property: { heading: 'What did you make of the apartment?',
                  placeholder: 'The rooms, the light, the building, the street — anything a '
                    + 'photograph cannot say.',
                  submit: 'Post this review' }
    };
    var target = 'agent';
    var chosen = 0;

    function paintStars(preview) {
      var lit = preview || chosen;
      stars.forEach(function (input, i) {
        var label = $('label[for="' + input.id + '"]');
        if (label) { label.classList.toggle('is-lit', i < lit); }
      });
      setText(starWord, WORDS[lit]);
      setText(submit, chosen === 0 ? 'Pick a rating first' : COPY[target].submit);
    }

    stars.forEach(function (input, i) {
      var label = $('label[for="' + input.id + '"]');
      input.addEventListener('change', function () { chosen = i + 1; paintStars(0); });
      if (label) {
        label.addEventListener('mouseenter', function () { paintStars(i + 1); });
      }
    });

    var rating = $('[data-p5-rating]');
    if (rating) {
      /* Back to the chosen value, not to nothing. */
      rating.addEventListener('mouseleave', function () { paintStars(0); });
    }

    $$('[data-p5-target]').forEach(function (input) {
      input.addEventListener('change', function () {
        target = input.getAttribute('data-p5-target');
        setText(formHeading, COPY[target].heading);
        if (placeholder) { placeholder.placeholder = COPY[target].placeholder; }
        paintStars(0);
      });
    });

    paint();
  }());


  /* ==========================================================================
     9ai. All properties — the directory, the letter rail, the register
     -----------------------------------------------------------------------------
     Nothing here creates content. Every city, district, street list, table body
     and row is printed by the builder; the cities, districts, letters and
     status chips are radio groups and buttons. With scripting off the page
     shows Príncipe Real's register in full, every district's street list is in
     the markup, and the record under the table describes a row above it.

     THE INDEX IS ONE DATASET
     ------------------------
     This block never composes an address, a reference or a figure. It shows and
     hides blocks the builder wrote, and copies strings the builder put on the
     rows. That is what keeps §03's heading, its rows and §04's record from ever
     describing different districts.

     THE LETTER IS SUBORDINATE TO THE DIRECTORY
     ------------------------------------------
     Changing city or district resets the letter to All. Without that reset a
     stale letter silently empties a district that simply has no street with
     that initial, and the reader sees an empty register with no visible cause.
     The selected letter also stays clickable when it becomes unavailable, so it
     can always be turned off.
     ========================================================================== */

  (function allProperties() {
    var dir = $('.apdir');
    if (!dir) { return; }

    var cityBtns = $$('[data-ap-city]');
    var districtLists = $$('[data-ap-districts]');
    var streetBlocks = $$('[data-ap-streets]');
    var bodies = $$('[data-ap-body]');
    var letters = $$('[data-ap-letter]');
    var chips = $$('[data-ap-status]');
    var cityName = $('[data-ap-cityname]');
    var heading = $('[data-ap-heading]');

    var city = 0, district = 0;

    function key() { return city + '-' + district; }

    /* ------------------------------------------------- the letter rail --- */

    function letterValue() {
      var on = letters.filter(function (l) { return l.checked; })[0];
      return on ? on.getAttribute('data-ap-letter') : 'All';
    }

    /* A letter the district has no street for is not a control — but the one
       currently selected stays live so it can clear itself. */
    function paintLetters() {
      var here = {};
      $$('[data-ap-body="' + key() + '"] .aprow').forEach(function (row) {
        here[row.getAttribute('data-apr-initial')] = true;
      });
      letters.forEach(function (input) {
        var l = input.getAttribute('data-ap-letter');
        var live = l === 'All' || here[l] || input.checked;
        input.disabled = !live;
        var label = $('label[for="' + input.id + '"]');
        if (label) { label.classList.toggle('apletter--off', !live); }
      });
    }

    /* ---------------------------------------------------- the register --- */

    function paintRows() {
      var body = $('[data-ap-body="' + key() + '"]');
      if (!body) { return; }
      var want = (chips.filter(function (c) { return c.checked; })[0]
        || { getAttribute: function () { return 'All'; } }).getAttribute('data-ap-status');
      var letter = letterValue();
      var rows = $$('.aprow', body);
      var shown = 0;
      var firstShown = null;

      rows.forEach(function (row) {
        var byStatus = want === 'All' || row.getAttribute('data-apr-status') === want;
        var byLetter = letter === 'All' || row.getAttribute('data-apr-initial') === letter;
        var on = byStatus && byLetter;
        row.hidden = !on;
        if (on) { shown += 1; if (!firstShown) { firstShown = row; } }
      });

      var table = $('table', body);
      var empty = $('[data-ap-empty]', body);
      if (table) { table.hidden = shown === 0; }
      if (empty) { empty.hidden = shown > 0; }

      var districtName = $('[data-ap-district="' + key() + '"] .appick__name');
      var name = districtName ? districtName.textContent : '';
      var total = body.getAttribute('data-ap-total') || '';
      var statusPart = want === 'All' ? 'every status' : want.toLowerCase();
      var letterPart = letter === 'All' ? '' : ', streets beginning ' + letter;

      if (shown === 0) {
        setText($('[data-ap-emptyline]', body),
          'Nothing in ' + name + ' matches ' + statusPart + letterPart
          + '. Clear the letter, or pick another status — the file still exists, it is '
          + 'simply not in this slice.');
      }
      setText($('[data-ap-summary]', body),
        shown + ' of ' + total + ' indexed addresses in ' + name + ' · ' + statusPart + letterPart);

      /* §04 must never blank out: when the filters empty the table it falls
         back to the district's first row. */
      paintRecord(firstShown || rows[0]);
    }

    /* ------------------------------------------------------ the record --- */

    var recAddress = $('[data-ap-address]');
    var recRef = $('[data-ap-ref]');
    var recState = $('[data-ap-state]');
    var recGrowth = $('[data-ap-growth]');
    var recStats = $$('[data-ap-stat]');
    var histFigures = $$('[data-ap-hist]');
    var histEvents = $$('[data-ap-event]');

    function paintRecord(row) {
      if (!row) { return; }
      setText(recAddress, row.getAttribute('data-apr-address'));
      setText(recRef, row.getAttribute('data-apr-ref'));
      setText(recState, row.getAttribute('data-apr-state'));
      setText(recGrowth, '+' + row.getAttribute('data-apr-growth') + '% on the 2014 price');

      var values = [row.getAttribute('data-apr-area'), row.getAttribute('data-apr-built'),
        'Class C', row.getAttribute('data-apr-figure')];
      recStats.forEach(function (out, i) { setText(out, values[i]); });

      var sold = row.getAttribute('data-apr-status') === 'Sold';
      if (histEvents[3]) {
        setText(histEvents[3], sold ? 'Sold · notarial deed 2026/4471' : 'Valued · desktop appraisal');
      }
      var figures = [row.getAttribute('data-apr-p2014'), '—',
        row.getAttribute('data-apr-rent2021') + ' pm', row.getAttribute('data-apr-sale')];
      histFigures.forEach(function (out, i) { setText(out, figures[i]); });
    }

    /* Hovering a row repaints the record entirely — address, reference, stats,
       history and state all come from that row. */
    bodies.forEach(function (body) {
      $$('.aprow', body).forEach(function (row) {
        ['mouseenter', 'focusin'].forEach(function (evt) {
          row.addEventListener(evt, function () {
            $$('.aprow', body).forEach(function (r) { r.classList.remove('is-on'); });
            row.classList.add('is-on');
            paintRecord(row);
          });
        });
      });
    });

    /* --------------------------------------------------- the directory --- */

    function paintDirectory() {
      districtLists.forEach(function (el) {
        el.hidden = el.getAttribute('data-ap-districts') !== String(city);
      });
      streetBlocks.forEach(function (el) {
        el.hidden = el.getAttribute('data-ap-streets') !== key();
      });
      bodies.forEach(function (el) {
        el.hidden = el.getAttribute('data-ap-body') !== key();
      });

      cityBtns.forEach(function (b, i) {
        b.classList.toggle('is-on', i === city);
        b.setAttribute('aria-pressed', i === city ? 'true' : 'false');
      });
      $$('[data-ap-district]').forEach(function (b) {
        var on = b.getAttribute('data-ap-district') === key();
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });

      var cityBtnName = $('.appick__name', cityBtns[city]);
      setText(cityName, cityBtnName ? cityBtnName.textContent : '');
      var dName = $('[data-ap-district="' + key() + '"] .appick__name');
      setText(heading, (dName ? dName.textContent : '') + ' · '
        + (cityBtnName ? cityBtnName.textContent : ''));
    }

    /* The letter resets with the directory — see the block note. */
    function resetLetter() {
      var all = letters.filter(function (l) { return l.getAttribute('data-ap-letter') === 'All'; })[0];
      if (all) { all.checked = true; }
    }

    cityBtns.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        city = i;
        district = 0;
        resetLetter();
        paintDirectory();
        paintLetters();
        paintRows();
      });
    });

    $$('[data-ap-district]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var parts = btn.getAttribute('data-ap-district').split('-');
        city = Number(parts[0]);
        district = Number(parts[1]);
        resetLetter();
        paintDirectory();
        paintLetters();
        paintRows();
      });
    });

    letters.forEach(function (input) {
      input.addEventListener('change', paintRows);
    });
    chips.forEach(function (input) {
      input.addEventListener('change', paintRows);
    });

    paintDirectory();
    paintLetters();
    paintRows();
  }());


  /* ==========================================================================
     9ak. User dashboard — the timeline, the confirmations, the alert toggles
     -----------------------------------------------------------------------------
     Nothing here creates content. The rail, the tiles, the five steps, the
     viewings, the matches, the moves, the searches and the messages are all in
     the markup, and the current step is DATA, not hover state. With scripting
     off the page reads whole: the tiles are links, the toggles are buttons that
     carry their own `aria-pressed`, and the timeline shows where the buyer is.

     THE `-1` RESTING STATE
     ----------------------
     Nothing-hovered is `-1`, not `undefined`. It gives the section note, the
     step dates and the card backgrounds a defined state to return to rather
     than an implicit one — the same convention the property pages use.

     ONE CONFIRMATION AT A TIME
     --------------------------
     Confirming a viewing clears any other; clicking the same one again clears
     it. That is the reference's behaviour and it is the honest one: this
     button stands in for a request the server has to answer, and two
     simultaneous "Confirmed" states would be a lie about what was sent.
     ========================================================================== */

  (function userDashboard() {
    var track = $('[data-db-track]');
    if (!track) { return; }

    /* ------------------------------------------------------ the timeline --- */

    var steps = $$('[data-db-step]');
    var stepNote = $('[data-db-stepnote]');
    var restNote = stepNote ? stepNote.textContent : '';

    steps.forEach(function (step) {
      ['mouseenter', 'focusin'].forEach(function (evt) {
        step.addEventListener(evt, function () {
          steps.forEach(function (s) { s.classList.toggle('is-on', s === step); });
          setText(stepNote, step.getAttribute('data-db-note'));
        });
      });
    });

    track.addEventListener('mouseleave', function () {
      steps.forEach(function (s) { s.classList.remove('is-on'); });
      setText(stepNote, restNote);
    });

    /* --------------------------------------------------- the confirmations --- */

    var confirms = $$('[data-db-confirm]');
    var confirmed = '';

    confirms.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-db-confirm');
        confirmed = confirmed === id ? '' : id;
        confirms.forEach(function (b) {
          var on = b.getAttribute('data-db-confirm') === confirmed && confirmed !== '';
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
          setText(b, on ? 'Confirmed' : 'Confirm');
          var row = b.closest('[data-db-viewing]');
          if (row) { row.classList.toggle('is-confirmed', on); }
        });
      });
    });

    /* ---------------------------------------------------- the alert toggles --- */

    $$('[data-db-alerts]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.classList.toggle('is-on', on);
        setText(btn, on ? 'Alerts on' : 'Alerts off');
      });
    });
  }());


  /* ==========================================================================
     9al. Profile & settings — the brief, the score and every switch
     -----------------------------------------------------------------------------
     Nothing here creates content. The brief's five words, the eight must-have
     chips, the funding rows, the fifteen matrix cells, the quiet hours, the
     form and all the toggles are printed by the builder in their default
     state, and every control is a real `<button>` or `<input>`. With the
     script off the page still says what it is set to; it just cannot be
     changed, which is honest for a page whose Save button needs a server
     anyway.

     WHY THE OPTION LISTS RIDE ON THE ELEMENTS
     -----------------------------------------
     Each editable word carries its own list in `data-pf-options`. The handoff
     is explicit that adding a sixth budget band must need no code change, and
     a list copied into this file would break that the first time the market
     data moved. The modulo does the rest — it cannot run off the end.

     THE SCORE IS DERIVED, NEVER STORED
     ----------------------------------
     Same line as the builder and the reference: verifications are 60% of it,
     any must-have is 20, a mortgage is 20 and anything else is 8. It is
     recomputed here only so the page tells the truth while you edit it; the
     handoff requires the real figure to come from the server, beside the
     verification records.

     THE MATRIX KEY IS COMPOSITE, NEVER AN INDEX
     -------------------------------------------
     Cells are keyed `event:channel`. Keying by position silently reassigns
     everyone's preferences the day a row is reordered — the handoff says this
     exact bug shipped once on another screen.
     ========================================================================== */

  (function profileSettings() {
    var stack = $('.pfstack');
    if (!stack) { return; }

    var OK_COUNT = $$('.pfver__item--ok').length;
    var VER_COUNT = $$('.pfver__item').length;
    var SCORES = [53, 65, 73, 85];

    var READY = {
      mortgage: ['Pre-approved buyer', ''],
      cash: ['Cash buyer, unverified', 'pfcard__ready--accent'],
      selling: ['Buying on a sale', 'pfcard__ready--warn']
    };
    var SHOWN = {
      mortgage: ['Approved', 'pfshow__value--good'],
      cash: ['Cash', 'pfshow__value--good'],
      selling: ['Sale pending', 'pfshow__value--warn']
    };

    var state = {
      fund: ($('[data-pf-fund].is-on') || $('[data-pf-fund]')).getAttribute('data-pf-fund')
    };

    /* ------------------------------------------------------- the brief ---- */

    function words() {
      var out = {};
      $$('[data-pf-word]').forEach(function (b) {
        out[b.getAttribute('data-pf-word')] = b.textContent.trim();
      });
      return out;
    }

    function mustsOn() {
      return $$('[data-pf-must]')
        .filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })
        .map(function (b) { return b.getAttribute('data-pf-must'); });
    }

    function mustNote(n, area) {
      if (n === 0) {
        return 'Nothing chosen. Every file in your areas will reach you, which is a lot of files.';
      }
      if (n > 4) {
        return n + ' conditions is a narrow brief — around one file a month in '
          + area + ' will satisfy all of them.';
      }
      return n + ' of eight. We will still show you the near misses, marked as such.';
    }

    /* At most two must-haves: an agent reading a list of six stops reading.
       Lower-cased so "Outdoor space" reads as "without lift or outdoor space". */
    function agentLine(w, musts) {
      var head = 'Looking for a ' + w.type + ' in ' + w.area + ', ' + w.purpose
        + ', keys ' + w.when + '. ';
      if (!musts.length) { return head + 'No fixed conditions.'; }
      return head + 'Will not do without '
        + musts.slice(0, 2).join(' or ').toLowerCase() + '.';
    }

    function score(mustCount, fund) {
      return Math.round(OK_COUNT / VER_COUNT * 60
        + (mustCount > 0 ? 20 : 0)
        + (fund === 'mortgage' ? 20 : 8));
    }

    function recompute() {
      var w = words();
      var musts = mustsOn();

      setText($('[data-pf-mustnote]'), mustNote(musts.length, w.area));
      setText($('[data-pf-agentline]'), agentLine(w, musts));

      var budget = $('[data-pf-shows="budget"]');
      if (budget) { setText(budget, 'up to ' + w.budget); }

      var ready = $('[data-pf-ready]');
      if (ready) {
        setText(ready, READY[state.fund][0]);
        ready.className = 'pfcard__ready' + (READY[state.fund][1] ? ' ' + READY[state.fund][1] : '');
      }
      var funding = $('[data-pf-shows="funding"]');
      if (funding) {
        setText(funding, SHOWN[state.fund][0]);
        funding.className = 'pfshow__value ' + SHOWN[state.fund][1];
      }

      var n = score(musts.length, state.fund);
      setText($('[data-pf-score]'), n + '%');
      var fill = $('[data-pf-fill]');
      if (fill) {
        fill.className = 'pfstrength__fill pfstrength__fill--'
          + (SCORES.indexOf(n) > -1 ? n : SCORES[SCORES.length - 1]);
      }
    }

    $$('[data-pf-word]').forEach(function (btn) {
      var options;
      try { options = JSON.parse(btn.getAttribute('data-pf-options')); } catch (e) { options = []; }
      if (!options.length) { return; }
      var label = (btn.getAttribute('aria-label') || '').replace(/, currently .*$/, '');
      btn.addEventListener('click', function () {
        var i = options.indexOf(btn.textContent.trim());
        var next = options[(i + 1) % options.length];
        setText(btn, next);
        btn.setAttribute('aria-label', label + ', currently ' + next);
        recompute();
      });
    });

    $$('[data-pf-must]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.classList.toggle('is-on', on);
        recompute();
      });
    });

    /* ------------------------------------------------------- §2 funding --- */
    /* All three routes are already in the markup; two carry `hidden`. Nothing
       is rebuilt, so nothing can be rebuilt wrong, and the panel reads
       correctly before this file loads. */

    $$('[data-pf-fund]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.fund = btn.getAttribute('data-pf-fund');
        $$('[data-pf-fund]').forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        $$('[data-pf-route]').forEach(function (panel) {
          panel.hidden = panel.getAttribute('data-pf-route') !== state.fund;
        });
        recompute();
      });
    });

    /* ------------------------------------------------- §3 the matrix ------ */

    function channelState() {
      var cells = $$('[data-pf-cell]');
      var on = cells.filter(function (c) { return c.getAttribute('aria-checked') === 'true'; });
      var quiet = ($('[data-pf-quiet][aria-pressed="true"]') || {}).getAttribute
        ? $('[data-pf-quiet][aria-pressed="true"]').getAttribute('data-pf-quiet') : '';

      setText($('[data-pf-channelnote]'), on.length + ' of fifteen on');
      setText($('[data-pf-channelfoot]'),
        on.length === 0
          ? 'Everything is off. You will find out about a price cut when you next open '
            + 'the site — which is usually too late.'
          : quiet === 'Off'
            ? 'No quiet hours. A price cut posted at two in the morning will reach your '
              + 'phone at two in the morning.'
            : 'Held between ' + quiet + ' and delivered with the morning batch.');
    }

    $$('[data-pf-cell]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.setAttribute('aria-checked',
          btn.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
        channelState();
      });
    });

    $$('[data-pf-quiet]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('[data-pf-quiet]').forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        channelState();
      });
    });

    /* --------------------------------------------------- §4 the form ------ */

    var form = $('[data-pf-form]');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        setText($('[data-pf-savednote]'), 'saved just now');
        setText($('[data-pf-saveline]'), 'Saved. Anna and Rui see the change on their next reply.');
        setText($('[data-pf-save]'), 'Saved');
        var dot = $('[data-pf-savedot]');
        if (dot) { dot.className = 'pfdot'; }
      });
      form.addEventListener('reset', function () {
        setText($('[data-pf-savednote]'), 'last saved 04 August');
        setText($('[data-pf-saveline]'), 'Nothing changed since 04 August.');
        setText($('[data-pf-save]'), 'Save changes');
        var dot = $('[data-pf-savedot]');
        if (dot) { dot.className = 'pfdot pfdot--idle'; }
      });
    }

    ['lang', 'cur'].forEach(function (key) {
      var sel = '[data-pf-' + key + ']';
      $$(sel).forEach(function (btn) {
        btn.addEventListener('click', function () {
          $$(sel).forEach(function (b) {
            var on = b === btn;
            b.classList.toggle('is-on', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
        });
      });
    });

    /* ------------------------------------ §5 two-step and §6 privacy ------ */

    var two = $('[data-pf-two]');
    if (two) {
      two.addEventListener('click', function () {
        var on = two.getAttribute('aria-checked') !== 'true';
        two.setAttribute('aria-checked', on ? 'true' : 'false');
        setText($('[data-pf-twonote]'), on
          ? 'A code by SMS every time you sign in on a new device.'
          : 'Off. Your password is the only thing between an enquiry and your file.');
      });
    }

    $$('[data-pf-priv]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.setAttribute('aria-checked',
          btn.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
      });
    });
  }());


  /* ==========================================================================
     9am. Saved properties — folders, sorts, selection and the comparison
     -----------------------------------------------------------------------------
     Nothing here creates content. All eight cards, their list chips, the four
     folder tabs with their counts, the four sorts, the selection strip and the
     whole comparison table are printed by the builder in their opening state.
     With the script off the page still shows every saved file, says which list
     each is on, and compares the three shortlisted ones. This block only
     narrows, reorders and recomputes.

     EVERY NUMBER ON THE PAGE IS DERIVED
     -----------------------------------
     The folder counts, the count line, the selection sentence, §02's three
     columns and its green cells all come from the cards themselves — from the
     `data-spf-*` payload and the pressed state of the chips. Nothing is stored
     twice, so a file moved from Shortlist to Rule out changes two folder
     counts, the count line, the table and the sub-label in one pass.

     THE PAYLOAD PREFIX IS `spf`, THE HOOK PREFIX IS `sp`
     ----------------------------------------------------
     Four times in this project a row's payload and a section's readout have
     shared an attribute name, and the writer has silently eaten the row. The
     two namespaces do not overlap and the builder asserts it.

     SORTING COPIES FIRST
     -------------------
     `slice()` before `sort()`. Sorting the live node list in place makes the
     folder counts flicker as the sort changes — the handoff says the same bug
     cost a review round elsewhere.
     ========================================================================== */

  (function savedProperties() {
    var grid = $('.spgrid');
    if (!grid) { return; }

    var cards = $$('.spcard', grid);
    var table = $('[data-sp-table]');
    var strip = $('[data-sp-strip]');
    var empty = $('[data-sp-empty]');

    var num = function (card, key) { return Number(card.getAttribute('data-spf-' + key)); };
    var str = function (card, key) { return card.getAttribute('data-spf-' + key) || ''; };
    var listOf = function (card) { return card.getAttribute('data-spf-list'); };
    var isPicked = function (card) {
      return $('[data-sp-pick]', card).getAttribute('aria-pressed') === 'true';
    };

    var state = {
      folder: ($('[data-sp-folder].is-on') || {}).getAttribute
        ? $('[data-sp-folder].is-on').getAttribute('data-sp-folder') : 'all',
      sort: ($('[data-sp-sort].is-on') || {}).getAttribute
        ? $('[data-sp-sort].is-on').getAttribute('data-sp-sort') : 'recent'
    };

    /* Whole euros with a space separator, the site's format everywhere. */
    function eur(v) {
      return '€' + String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    /* ------------------------------------------------------- the grid ----- */

    function inFolder(card) {
      return state.folder === 'all' || listOf(card) === state.folder;
    }

    function paintGrid() {
      var shown = cards.filter(inFolder);

      var order = shown.slice().sort(function (a, b) {
        if (state.sort === 'price') { return num(a, 'price') - num(b, 'price'); }
        if (state.sort === 'perm') { return num(a, 'perm') - num(b, 'perm'); }
        if (state.sort === 'moved') {
          return (num(b, 'moved') - num(a, 'moved')) || (num(a, 'added') - num(b, 'added'));
        }
        return num(a, 'added') - num(b, 'added');
      });

      cards.forEach(function (c) { c.hidden = shown.indexOf(c) < 0; });
      order.forEach(function (c) { grid.appendChild(c); });
      if (empty) { grid.appendChild(empty); empty.hidden = shown.length > 0; }
    }

    function paintCounts() {
      var counts = { all: cards.length, shortlist: 0, maybe: 0, out: 0 };
      cards.forEach(function (c) { counts[listOf(c)] += 1; });

      $$('[data-sp-folder]').forEach(function (btn) {
        var id = btn.getAttribute('data-sp-folder');
        setText($('.spfolder__count', btn), String(counts[id]));
        var on = id === state.folder;
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });

      setText($('[data-sp-countline]'),
        cards.length + ' files saved · ' + counts.shortlist + ' shortlisted');
    }

    /* ---------------------------------------------------- the selection --- */

    function paintPicked() {
      var picked = cards.filter(isPicked);
      cards.forEach(function (c) { c.classList.toggle('is-picked', isPicked(c)); });

      if (strip) { strip.hidden = picked.length === 0; }
      setText($('[data-sp-pickedline]'), picked.length === 1
        ? 'One file selected — pick at least two to compare them.'
        : picked.length + ' files selected. Compare puts them in one table, row by row.');
      setText($('[data-sp-comparelabel]'),
        picked.length > 1 ? 'Compare ' + picked.length + ' files' : 'Compare shortlist');

      /* `Select all` works inside the current folder view, not the whole set —
         and the label says which of the two it is about to do. */
      var shown = cards.filter(inFolder);
      var allOn = shown.length > 0 && shown.every(isPicked);
      setText($('[data-sp-all]'), allOn ? 'Clear all' : 'Select all');
    }

    /* ------------------------------------------------- §02 side by side --- */
    /* The three columns are the shortlist, capped at three, falling back to the
       first three saved files so the panel is never a blank rectangle — and the
       sub-label says which of the two it is showing. */

    var ROWS = [
      ['Asking price', function (c) { return eur(num(c, 'price')); }, 'lowPrice'],
      ['Per m²', function (c) { return eur(num(c, 'perm')); }, 'lowPerM'],
      ['Measured area', function (c) { return str(c, 'area'); }, null],
      ['Bedrooms', function (c) { return str(c, 'beds'); }, null],
      ['Energy', function (c) { return 'Class ' + str(c, 'energy'); }, 'goodEnergy'],
      ['Lift', function (c) { return str(c, 'lift'); }, 'hasLift'],
      ['Days on register', function (c) { return str(c, 'days') + ' days'; }, null],
      ['Status', function (c) { return str(c, 'status'); }, 'forSale']
    ];

    function paintTable() {
      if (!table) { return; }
      var short = cards.filter(function (c) { return listOf(c) === 'shortlist'; }).slice(0, 3);
      var byRank = cards.slice().sort(function (a, b) { return num(a, 'rank') - num(b, 'rank'); });
      var heads = short.length ? short : byRank.slice(0, 3);

      var WORDS = ['', 'one', 'two', 'three'];
      setText($('[data-sp-sidenote]'), short.length
        ? 'your ' + WORDS[short.length] + ' shortlisted file' + (short.length > 1 ? 's' : '')
        : 'shortlist three files to fill this');

      var lowPrice = Math.min.apply(null, heads.map(function (c) { return num(c, 'price'); }));
      var lowPerM = Math.min.apply(null, heads.map(function (c) { return num(c, 'perm'); }));
      var wins = {
        lowPrice: function (c) { return num(c, 'price') === lowPrice; },
        lowPerM: function (c) { return num(c, 'perm') === lowPerM; },
        goodEnergy: function (c) { return str(c, 'energy') === 'A' || str(c, 'energy') === 'B'; },
        hasLift: function (c) { return str(c, 'lift') !== 'None'; },
        forSale: function (c) { return str(c, 'status') === 'For sale'; }
      };

      $$('.spside__col', table).forEach(function (th, i) {
        th.hidden = i >= heads.length;
        if (th.hidden) { return; }
        setText($('.spside__title', th), str(heads[i], 'title'));
        setText($('.spside__sheet', th), 'Sheet ' + str(heads[i], 'sheet'));
      });

      $$('tbody tr', table).forEach(function (tr, r) {
        var spec = ROWS[r];
        var cells = $$('td', tr);
        if (!spec) {
          /* the verdict row, last in the body */
          cells.forEach(function (td, i) {
            td.hidden = i >= heads.length;
            if (td.hidden) { return; }
            var note = str(heads[i], 'note');
            setText(td, note || 'No note yet.');
            td.className = 'spside__verdict' + (note ? '' : ' spside__verdict--empty');
          });
          return;
        }
        cells.forEach(function (td, i) {
          td.hidden = i >= heads.length;
          if (td.hidden) { return; }
          setText(td, spec[1](heads[i]));
          var win = spec[2] && wins[spec[2]](heads[i]);
          td.className = 'spside__cell' + (win ? ' spside__cell--win' : '');
        });
      });
    }

    function repaint() {
      paintGrid();
      paintCounts();
      paintPicked();
      paintTable();
    }

    /* --------------------------------------------------------- the wiring --- */

    $$('[data-sp-folder]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.folder = btn.getAttribute('data-sp-folder');
        repaint();
      });
    });

    $$('[data-sp-sort]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.sort = btn.getAttribute('data-sp-sort');
        $$('[data-sp-sort]').forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        repaint();
      });
    });

    $$('[data-sp-pick]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.setAttribute('aria-pressed',
          btn.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        paintPicked();
      });
    });

    var all = $('[data-sp-all]');
    if (all) {
      all.addEventListener('click', function () {
        var shown = cards.filter(inFolder);
        var turnOn = !(shown.length > 0 && shown.every(isPicked));
        shown.forEach(function (c) {
          $('[data-sp-pick]', c).setAttribute('aria-pressed', turnOn ? 'true' : 'false');
        });
        paintPicked();
      });
    }

    var clear = $('[data-sp-clear]');
    if (clear) {
      clear.addEventListener('click', function () {
        cards.forEach(function (c) {
          $('[data-sp-pick]', c).setAttribute('aria-pressed', 'false');
        });
        paintPicked();
      });
    }

    var compareAll = $('[data-sp-compareall]');
    if (compareAll) {
      compareAll.addEventListener('click', function () {
        cards.forEach(function (c) {
          $('[data-sp-pick]', c)
            .setAttribute('aria-pressed', listOf(c) === 'shortlist' ? 'true' : 'false');
        });
        paintPicked();
      });
    }

    $$('[data-sp-list]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('.spcard');
        if (!card) { return; }
        card.setAttribute('data-spf-list', btn.getAttribute('data-sp-list'));
        $$('[data-sp-list]', card).forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        repaint();
      });
    });

    /* §04: a restored file comes back as `Maybe`. The archive rows are their
       own records rather than saved files, so this only announces the move —
       the card set is unchanged. */
    $$('[data-sp-restore]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var row = btn.closest('.spout');
        if (!row) { return; }
        setText(btn, 'Restored');
        btn.disabled = true;
        row.classList.add('is-restored');
      });
    });
  }());


  /* ==========================================================================
     9an. Saved searches — the accordion, the simulation and the alerts
     -----------------------------------------------------------------------------
     Nothing here creates content. All three searches, their chips, counts,
     sparklines and matches, all three tuning sets, all three reach sets and
     the whole of §04 are printed by the builder; two of each swapping set
     carry `hidden`. With the script off the page still shows every search,
     its trend and its alert state, and the first search's matches, tuning and
     reach — which is the page's own default state, not a degraded one.

     THE APPLIED KEY CARRIES THE SEARCH
     ----------------------------------
     The three tuning sets reuse row ids `t0`–`t3`. Keying applied state by the
     row id alone makes "Add Estrela" on search 1 light up "Count a balcony" on
     search 2 and adds its +18 to the wrong total. The handoff says this
     shipped and cost a review round; the builder prints `search:row` and the
     total only ever sums rows inside the visible set.

     THE TOTAL IS SUMMED FROM THE ROWS, NEVER ACCUMULATED
     ----------------------------------------------------
     Every recount walks the visible set's pressed buttons and adds up their
     gains. A running total kept in a variable drifts the moment a row is
     toggled twice, and there is nothing on screen to catch it.
     ========================================================================== */

  (function savedSearches() {
    var list = $('.sslist');
    if (!list) { return; }

    var rows = $$('.ssrow', list);

    /* ------------------------------------------------------ the accordion --- */

    function openRow(index) {
      rows.forEach(function (row, i) {
        var on = i === index;
        row.classList.toggle('is-open', on);
        $('[data-ss-open]', row).setAttribute('aria-expanded', on ? 'true' : 'false');
        $('.ssexp', row).hidden = !on;
      });

      $$('[data-ss-tune]').forEach(function (p) {
        p.hidden = Number(p.getAttribute('data-ss-tune')) !== index;
      });
      $$('[data-ss-reach]').forEach(function (p) {
        p.hidden = Number(p.getAttribute('data-ss-reach')) !== index;
      });
      setText($('[data-ss-activename]'), $('.ssrow__title', rows[index]).textContent);
      recount();
    }

    rows.forEach(function (row, i) {
      $('[data-ss-open]', row).addEventListener('click', function () { openRow(i); });
    });

    /* --------------------------------------------- the per-search alerts --- */
    /* Independent of §04: silencing one search must not silence the account. */

    $$('[data-ss-alert]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var on = btn.getAttribute('aria-checked') !== 'true';
        btn.setAttribute('aria-checked', on ? 'true' : 'false');
        setText(btn, on ? 'Alerts on' : 'Alerts off');
      });
    });

    /* ------------------------------------------------------- §02 tune it --- */

    function recount() {
      var panel = $$('[data-ss-tune]').filter(function (p) { return !p.hidden; })[0];
      if (!panel) { return; }

      var applied = $$('[data-ss-try]', panel).filter(function (b) {
        return b.getAttribute('aria-pressed') === 'true';
      });
      var gained = applied.reduce(function (t, b) {
        var gain = b.parentNode.querySelector('[data-ss-gain]');
        return t + parseInt(gain.getAttribute('data-ss-gain'), 10);
      }, 0);

      setText($('[data-ss-callout]', panel), gained === 0
        ? 'Try one and we will re-run the search against the last ninety days before '
          + 'you commit to it.'
        : 'Applied to this search, these would have matched over the last ninety days:');
      setText($('[data-ss-total]', panel), gained === 0 ? '—' : '+' + gained + ' files');
    }

    $$('[data-ss-try]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        setText(btn, on ? 'Applied' : 'Try it');
        var gain = btn.parentNode.querySelector('[data-ss-gain]');
        if (gain) { gain.classList.toggle('is-on', on); }
        recount();
      });
    });

    /* --------------------------------------------------------- §04 alerts --- */

    var NEXT = {
      instant: 'Next alert: the moment a file matches',
      daily: 'Next digest: tomorrow, 08:00',
      weekly: 'Next digest: Monday, 08:00'
    };

    $$('[data-ss-freq]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-ss-freq');
        $$('[data-ss-freq]').forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        $$('[data-ss-freqnote]').forEach(function (note) {
          note.hidden = note.getAttribute('data-ss-freqnote') !== id;
        });
        setText($('[data-ss-next]'), NEXT[id] || '');
      });
    });

    $$('[data-ss-channel]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var on = btn.getAttribute('aria-checked') !== 'true';
        btn.setAttribute('aria-checked', on ? 'true' : 'false');
        setText(btn, on ? 'On' : 'Off');
      });
    });

    var WORDS = ['No', '1', '2', '3', '4'];
    $$('[data-ss-event]').forEach(function (box) {
      box.addEventListener('change', function () {
        var on = $$('[data-ss-event]').filter(function (b) { return b.checked; }).length;
        setText($('[data-ss-eventnote]'), WORDS[on] + ' of four events will reach you');
      });
    });
  }());


  /* ==========================================================================
     9ao. Viewing requests — the composed filter, the verdict and the checklist
     -----------------------------------------------------------------------------
     Nothing here creates content. All seven rows, the seven day cards with
     their slot chips, the five filter chips with their counts, both seen
     files, the star rating, the eight tags and the eight checklist questions
     are printed by the builder in their opening state. With the script off
     the page shows the whole register, says which rows are waiting, and the
     stars, alternatives and checkboxes still work — they are radios and
     checkboxes painted by CSS, not buttons pretending to be controls.

     THE TWO FILTERS COMPOSE
     -----------------------
     Day and status are independent and both can be on. Every repaint applies
     both and the empty state names both — an empty list under two filters
     with a sentence reading only "No viewings" is the commonest dead end in
     the pattern, and the reason this sentence is assembled here rather than
     authored in the markup.

     THE STAR FILL IS NOT HERE
     -------------------------
     It is `:has()` in section 79: committed state, hover preview and focus
     preview, all in CSS. This block only writes the word beside the row,
     which is the one part that cannot be a selector.
     ========================================================================== */

  (function viewingRequests() {
    var list = $('.vrlist');
    if (!list) { return; }

    var rows = $$('.vrrow', list);
    var empty = $('[data-vr-empty]');
    var days = $$('[data-vr-day]');
    var state = { tab: 'all', day: -1 };

    var TAB_LABEL = {};
    $$('[data-vr-tab]').forEach(function (b) {
      TAB_LABEL[b.getAttribute('data-vr-tab')] =
        b.firstChild.textContent.trim();
    });

    function dayName(i) {
      var card = days[i];
      return $('.vrday__dow', card).textContent + ' ' + $('.vrday__num', card).textContent;
    }

    function emptyLine() {
      var where = state.day === -1 ? 'the register' : dayName(state.day);
      var status = state.tab === 'all'
        ? '' : ' in ' + TAB_LABEL[state.tab].toLowerCase() + ' viewings';
      var out = state.day === -1
        ? 'Try another status.'
        : 'Click the day again to clear it, or pick another status.';
      return 'Nothing on ' + where + status + '. ' + out;
    }

    function repaint() {
      var shown = 0;
      rows.forEach(function (row) {
        var okTab = state.tab === 'all' || row.getAttribute('data-vr-status') === state.tab;
        var okDay = state.day === -1 || Number(row.getAttribute('data-vr-dayidx')) === state.day;
        var on = okTab && okDay;
        row.hidden = !on;
        if (on) { shown += 1; }
      });

      /* The bottom hairline belongs to whichever row is last *now*. */
      var visible = rows.filter(function (r) { return !r.hidden; });
      rows.forEach(function (r) { r.classList.remove('vrrow--last'); });
      if (visible.length) { visible[visible.length - 1].classList.add('vrrow--last'); }

      if (empty) {
        empty.hidden = shown > 0;
        setText(empty, emptyLine());
      }

      setText($('[data-vr-note]'), state.day === -1
        ? shown + ' of ' + rows.length + ' requests shown'
        : 'Filtered to ' + dayName(state.day) + ' · click the day again to clear');

      days.forEach(function (card, i) {
        card.setAttribute('aria-pressed', i === state.day ? 'true' : 'false');
      });
      $$('[data-vr-tab]').forEach(function (btn) {
        var on = btn.getAttribute('data-vr-tab') === state.tab;
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    days.forEach(function (card, i) {
      card.addEventListener('click', function () {
        state.day = state.day === i ? -1 : i;
        repaint();
      });
    });

    $$('[data-vr-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.tab = btn.getAttribute('data-vr-tab');
        repaint();
      });
    });

    /* ----------------------------------------------- the proposed times --- */

    $$('[data-vr-alt]').forEach(function (input) {
      input.addEventListener('change', function () {
        var note = $('[data-vr-altnote="' + input.getAttribute('data-vr-alt') + '"]');
        if (!note) { return; }
        setText(note, 'Pick one and she confirms within the hour.');
        note.classList.add('is-picked');
      });
    });

    /* -------------------------------------------------- §02 the verdict --- */

    $$('[data-vr-seen]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-vr-seen');
        $$('[data-vr-seen]').forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        $$('[data-vr-meta]').forEach(function (p) {
          p.hidden = p.getAttribute('data-vr-meta') !== id;
        });
        var area = $('[data-vr-textarea]');
        var wanted = $('[data-vr-meta="' + id + '"]');
        if (area && wanted) {
          area.placeholder = wanted.getAttribute('data-vr-placeholder') || area.placeholder;
        }
      });
    });

    /* The fill is CSS; only the word needs saying out loud. `hover || rating`
       is the same idea as the reference's — nothing hovered falls back to the
       committed value with no extra branch. */
    var stars = $$('[data-vr-star]');
    var word = $('[data-vr-word]');
    var WORDS = ['Not rated', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

    function committed() {
      var on = stars.filter(function (s) { return s.checked; })[0];
      return on ? Number(on.value) : 0;
    }

    function sayWord(n) { setText(word, WORDS[n || committed()]); }

    stars.forEach(function (input) {
      var n = Number(input.value);
      var label = input.nextElementSibling;
      if (label) {
        label.addEventListener('mouseenter', function () { sayWord(n); });
      }
      input.addEventListener('focus', function () { sayWord(n); });
      input.addEventListener('change', function () { sayWord(0); });
    });

    var starRow = $('.vrstars');
    if (starRow) {
      starRow.addEventListener('mouseleave', function () { sayWord(0); });
      starRow.addEventListener('focusout', function () { sayWord(0); });
    }

    $$('[data-vr-tag]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.classList.toggle('is-on', on);
      });
    });

    /* ------------------------------------------------ §03 the checklist --- */

    $$('[data-vr-ask]').forEach(function (box) {
      box.addEventListener('change', function () {
        var boxes = $$('[data-vr-ask]');
        var done = boxes.filter(function (b) { return b.checked; }).length;
        var left = boxes.length - done;

        setText($('[data-vr-askcount]'), done + ' of eight ticked');
        setText($('[data-vr-asknote]'), left === 0
          ? 'All eight covered — you are ready'
          : left + ' still to ask on Thursday');
        var dot = $('[data-vr-askdot]');
        if (dot) { dot.classList.toggle('vrdot--done', left === 0); }
      });
    });
  }());


  /* ==========================================================================
     9ap. Price alerts — the feed, the market chart and the rule builder
     -----------------------------------------------------------------------------
     Nothing here creates content. Six feed rows, four stat cells, all three
     twelve-bar series, four rules and the whole builder are printed by the
     builder in their opening state, with two of the three plots hidden. With
     the script off the page still shows what moved, the Príncipe Real chart
     against the ceiling, and the rules with their fire counts — and the
     condition radios and the threshold slider still work, because they are
     real form controls.

     THE CHART SCALE IS NOT COMPUTED HERE
     ------------------------------------
     Bar heights and the ceiling's two positions are classes generated into
     section 80 from `market.json`. Switching districts swaps which plot is
     visible and moves one class on the ceiling; nothing is recomputed, so the
     drawing cannot drift from the data.

     LEAVING THE PLOT SHOWS THE LAST MONTH, NOT NOTHING
     --------------------------------------------------
     `bar === -1 → vals.length - 1`. The panel always states a real figure;
     a chart that blanks its readout when the pointer leaves is a chart that
     is unreadable at rest.
     ========================================================================== */

  (function priceAlerts() {
    var feed = $('.pafeed');
    if (!feed) { return; }

    /* ------------------------------------------------------- §01 the feed --- */

    var rows = $$('.parow', feed);
    var empty = $('[data-pa-empty]');
    var LABEL = {};
    $$('[data-pa-tab]').forEach(function (b) {
      LABEL[b.getAttribute('data-pa-tab')] = b.firstChild.textContent.trim();
    });

    function paintFeed(tab) {
      var shown = 0;
      rows.forEach(function (row) {
        var on = tab === 'all' || row.getAttribute('data-pa-type') === tab;
        row.hidden = !on;
        if (on) { shown += 1; }
      });

      var visible = rows.filter(function (r) { return !r.hidden; });
      rows.forEach(function (r) { r.classList.remove('parow--last'); });
      if (visible.length) { visible[visible.length - 1].classList.add('parow--last'); }

      if (empty) {
        empty.hidden = shown > 0;
        setText(empty, 'Nothing in ' + LABEL[tab].toLowerCase()
          + ' in the last three weeks. Try another kind, or widen a rule below.');
      }
      setText($('[data-pa-note]'), shown + ' of ' + rows.length + ' alerts shown');

      $$('[data-pa-tab]').forEach(function (b) {
        var on = b.getAttribute('data-pa-tab') === tab;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    $$('[data-pa-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        paintFeed(btn.getAttribute('data-pa-tab'));
      });
    });

    $$('[data-pa-mute]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        setText(btn, on ? 'Muted' : 'Mute');
        var row = btn.closest('.parow');
        if (row) { row.classList.toggle('is-muted', on); }
      });
    });

    /* ------------------------------------------------------ §02 the chart --- */

    var ceiling = $('[data-pa-ceiling]');
    var ceilingLabel = $('[data-pa-ceilinglabel]');

    function plotOf(key) { return $('[data-pa-plot="' + key + '"]'); }

    function showMonth(key, i) {
      var plot = plotOf(key);
      var bars = $$('.pabar', plot);
      var idx = i === -1 ? bars.length - 1 : i;
      bars.forEach(function (b, n) { b.classList.toggle('is-on', n === idx); });
      $$('[data-pa-month]').forEach(function (m, n) { m.classList.toggle('is-on', n === idx); });
      setText($('[data-pa-value]'), $('.pabar__fill', bars[idx]).getAttribute('data-paf-money'));
    }

    function showDistrict(key) {
      $$('[data-pa-plot]').forEach(function (p) {
        p.hidden = p.getAttribute('data-pa-plot') !== key;
      });
      $$('[data-pa-line]').forEach(function (p) {
        p.hidden = p.getAttribute('data-pa-line') !== key;
      });
      $$('[data-pa-change]').forEach(function (p) {
        p.hidden = p.getAttribute('data-pa-change') !== key;
      });
      $$('[data-pa-district]').forEach(function (b) {
        var on = b.getAttribute('data-pa-district') === key;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });

      var plot = plotOf(key);
      if (ceiling) {
        ceiling.className = 'paceiling ' + plot.getAttribute('data-pa-ct');
      }
      if (ceilingLabel) {
        ceilingLabel.className = 'paceiling__label ' + plot.getAttribute('data-pa-clt');
      }
      showMonth(key, -1);
    }

    function activeDistrict() {
      var on = $('[data-pa-district].is-on');
      return on ? on.getAttribute('data-pa-district') : $('[data-pa-district]').getAttribute('data-pa-district');
    }

    $$('[data-pa-district]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showDistrict(btn.getAttribute('data-pa-district'));
      });
    });

    $$('.pabar__fill').forEach(function (bar) {
      var i = Number(bar.getAttribute('data-pa-bar'));
      ['mouseenter', 'focus'].forEach(function (evt) {
        bar.addEventListener(evt, function () { showMonth(activeDistrict(), i); });
      });
      /* Touch has no hover, so a tap has to select — and a second tap on the
         same bar returns the readout to the last month. */
      bar.addEventListener('click', function () {
        var wasOn = bar.parentNode.classList.contains('is-on');
        showMonth(activeDistrict(), wasOn ? -1 : i);
      });
    });

    var plotBox = $('.paplot');
    if (plotBox) {
      plotBox.addEventListener('mouseleave', function () { showMonth(activeDistrict(), -1); });
    }

    /* ------------------------------------------------------ §03 the rules --- */

    var COUNT = ['No', 'One', 'Two', 'Three', 'Four'];

    $$('[data-pa-rule]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var on = btn.getAttribute('aria-checked') !== 'true';
        btn.setAttribute('aria-checked', on ? 'true' : 'false');
        setText(btn, on ? 'On' : 'Paused');
        var row = btn.closest('.parule');
        if (row) { row.classList.toggle('is-paused', !on); }

        var running = $$('[data-pa-rule]').filter(function (b) {
          return b.getAttribute('aria-checked') === 'true';
        }).length;
        setText($('[data-pa-rulecount]'), running + ' of four running');
      });
    });

    /* ---------------------------------------------------- §04 the builder --- */

    var box = $('[data-pa-previewbox]');
    var slider = $('[data-pa-pct]');
    var threshold = $('[data-pa-threshold]');

    function condition() {
      return $$('[data-pa-cond]').filter(function (r) { return r.checked; })[0];
    }

    /* The prototype's stand-in. Production replays ninety days of real
       register events — the handoff is emphatic, and so is the markup. */
    function previewCount() {
      var cond = condition();
      if (!cond) { return 0; }
      if (cond.getAttribute('data-pa-cond') === 'pct') {
        return Math.max(0, 9 - Number(slider.value));
      }
      return Number(cond.getAttribute('data-pa-preview')) || 0;
    }

    function paintPreview() {
      var n = previewCount();
      var tone = n === 0 ? 'none' : n > 6 ? 'warn' : 'good';
      box.className = 'papreview papreview--' + tone;
      setText($('[data-pa-previewcount]'), String(n));
      setText($('[data-pa-previewnote]'), n === 0
        ? 'Nothing in the last ninety days would have reached this. '
          + 'A quiet rule is a rule you forget you set.'
        : 'This rule would have reached you '
          + (n === 1 ? 'once' : n + ' times') + ' in the last ninety days.');
    }

    $$('[data-pa-cond]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (threshold) { threshold.hidden = radio.getAttribute('data-pa-cond') !== 'pct'; }
        paintPreview();
      });
    });

    if (slider) {
      slider.addEventListener('input', function () {
        setText($('[data-pa-pctlabel]'), slider.value + '% or more');
        slider.setAttribute('aria-valuetext', slider.value + ' per cent or more');
        paintPreview();
      });
    }

    $$('[data-pa-target]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('[data-pa-target]').forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        setText($('[data-pa-create]'), btn.getAttribute('data-pa-cta'));
      });
    });
  }());


  /* ==========================================================================
     9aq. Messages — one open thread, and everything to the right follows it
     -----------------------------------------------------------------------------
     Nothing here creates content. All five threads are printed in full — file
     header, message log, quick replies, composer, status line, extracted facts
     and shared files — with four of each hidden. Opening a thread flips
     `hidden` on six regions at once; nothing is rebuilt from data, so nothing
     can be rebuilt wrong, and with the script off the page reads Anna's thread
     end to end.

     THE PANE MUST NEVER BE EMPTY
     ----------------------------
     Filtering the list to `Bank` while an agent thread is open leaves that
     thread open — the handoff calls the rule out explicitly and either answer
     is defensible, but a blank right-hand pane is not one of them.

     THE SLOT PICKER'S FILL IS CSS
     -----------------------------
     Radios painted by `:checked` in section 81, so the picker works with no
     script. This block writes the note and the confirm label, which are the
     two parts a selector cannot say.
     ========================================================================== */

  (function messages() {
    var pane = $('.mspane');
    if (!pane) { return; }

    var rows = $$('[data-ms-open]');
    var empty = $('[data-ms-empty]');

    var TAB_LABEL = {};
    $$('[data-ms-tab]').forEach(function (b) {
      TAB_LABEL[b.getAttribute('data-ms-tab')] = b.firstChild.textContent.trim();
    });

    /* ------------------------------------------------------- the filter --- */

    function filter(tab) {
      var shown = 0;
      rows.forEach(function (row) {
        var on = tab === 'all' || row.getAttribute('data-ms-kind') === tab;
        row.parentNode.hidden = !on;
        if (on) { shown += 1; }
      });

      if (empty) {
        empty.hidden = shown > 0;
        setText(empty, 'No threads with the ' + TAB_LABEL[tab].toLowerCase()
          + ' yet. Pick another filter, or start one from a property file.');
      }
      $$('[data-ms-tab]').forEach(function (b) {
        var on = b.getAttribute('data-ms-tab') === tab;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    $$('[data-ms-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () { filter(btn.getAttribute('data-ms-tab')); });
    });

    /* --------------------------------------------------- opening a thread --- */

    function open(id) {
      rows.forEach(function (row) {
        row.classList.toggle('is-open', row.getAttribute('data-ms-open') === id);
      });
      ['thread', 'facts', 'files'].forEach(function (key) {
        $$('[data-ms-' + key + ']').forEach(function (p) {
          p.hidden = p.getAttribute('data-ms-' + key) !== id;
        });
      });

      var files = $('[data-ms-files="' + id + '"]');
      if (files) { setText($('[data-ms-doccount]'), files.getAttribute('data-ms-count')); }

      /* A new thread starts with nothing chosen and nothing typed. */
      $$('[data-ms-slot]').forEach(function (r) { r.checked = false; });
      $$('[data-ms-quick]').forEach(function (q) {
        q.classList.remove('is-on');
        q.setAttribute('aria-pressed', 'false');
      });
      $$('[data-ms-write]').forEach(function (a) {
        a.placeholder = a.getAttribute('data-ms-default');
      });
      paintSlots();
      pane.classList.add('is-reading');
    }

    rows.forEach(function (row) {
      row.addEventListener('click', function () { open(row.getAttribute('data-ms-open')); });
    });

    $$('[data-ms-back]').forEach(function (link) {
      link.addEventListener('click', function () { pane.classList.remove('is-reading'); });
    });

    /* --------------------------------------------------- the slot picker --- */

    function paintSlots() {
      var picked = $$('[data-ms-slot]').filter(function (r) { return r.checked; })[0];
      var note = $('[data-ms-slotnote]');
      var cta = $('[data-ms-slotcta]');
      if (!note || !cta) { return; }

      if (picked) {
        setText(note, 'She confirms with the owner within the hour.');
        note.classList.add('is-picked');
        setText(cta, 'Move it to ' + picked.getAttribute('data-ms-time'));
      } else {
        setText(note, 'Thursday stays booked until you pick one of these.');
        note.classList.remove('is-picked');
        setText(cta, 'Keep Thursday');
      }
    }

    $$('[data-ms-slot]').forEach(function (radio) {
      /* A radio cannot be unchecked by clicking it again, so the second click
         on the same time clears the choice by hand — the handoff asks for it. */
      var wasOn = false;
      radio.addEventListener('mousedown', function () { wasOn = radio.checked; });
      radio.addEventListener('keydown', function () { wasOn = false; });
      radio.addEventListener('click', function () {
        if (wasOn) { radio.checked = false; }
        paintSlots();
      });
    });

    /* ----------------------------------------------------- quick replies --- */

    $$('[data-ms-quick]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-ms-quick');
        var area = $('[data-ms-write="' + id + '"]');
        var on = btn.getAttribute('aria-pressed') !== 'true';

        $$('[data-ms-quick="' + id + '"]').forEach(function (b) {
          b.classList.toggle('is-on', b === btn && on);
          b.setAttribute('aria-pressed', b === btn && on ? 'true' : 'false');
        });
        if (!area) { return; }
        area.placeholder = on ? btn.textContent.trim() : area.getAttribute('data-ms-default');
        /* §7: choosing a suggestion must move focus into the composer. */
        area.focus();
      });
    });
  }());


  /* ==========================================================================
     9ar. Documents — the register, the stages, the expiry chart, the tag
     -----------------------------------------------------------------------------
     Nothing here creates content. Thirteen rows, four stat cards, three
     stages, twelve months with their four explanations, the sharing grid and
     the upload panel are all printed by the builder; two of the three stage
     panels and four of the five expiry notes carry `hidden`. With the script
     off the page still reads as a status register: every state, every owner,
     the whole grid, and the consequence of the default tag.

     THE CHART AND THE TABLE COME FROM ONE SET
     -----------------------------------------
     Five documents go stale in the next twelve months; the bars count five
     and the list beside them names five. The builder asserts it, because a
     document reading `Verified` in the table while sitting in next month's
     bar is the defect class this project has fixed more than once.

     LEAVING THE CHART RESTORES THE YEAR
     -----------------------------------
     `month === -1` shows the ninety-day summary, so the box always states
     something true rather than blanking.
     ========================================================================== */

  (function documents() {
    var table = $('.dctable');
    if (!table) { return; }

    /* --------------------------------------------------------- §01 filter --- */

    var rows = $$('[data-dc-row]', table);
    var empty = $('[data-dc-empty]');
    var LABEL = {};
    $$('[data-dc-tab]').forEach(function (b) {
      LABEL[b.getAttribute('data-dc-tab')] = b.firstChild.textContent.trim();
    });

    $$('[data-dc-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tab = btn.getAttribute('data-dc-tab');
        var shown = 0;
        rows.forEach(function (row) {
          var on = tab === 'all' || row.getAttribute('data-dc-cat') === tab;
          row.hidden = !on;
          if (on) { shown += 1; }
        });

        if (empty) {
          empty.hidden = shown > 0;
          setText(empty, 'Nothing filed under ' + LABEL[tab].toLowerCase()
            + ' yet. Upload something below, or pick another filter.');
        }
        setText($('[data-dc-foot]'), shown + ' of ' + rows.length
          + ' shown · everything here is downloadable at any time');
        $$('[data-dc-tab]').forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      });
    });

    /* --------------------------------------------------------- §02 stages --- */

    $$('[data-dc-stage]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = btn.getAttribute('data-dc-stage');
        $$('[data-dc-stagepanel]').forEach(function (p) {
          p.hidden = p.getAttribute('data-dc-stagepanel') !== i;
        });
        $$('[data-dc-stage]').forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      });
    });

    /* --------------------------------------------------------- §03 expiry --- */

    function showMonth(key) {
      $$('[data-dc-note]').forEach(function (n) {
        n.hidden = n.getAttribute('data-dc-note') !== key;
      });
      $$('.dcmonth').forEach(function (m) {
        var bar = $('[data-dc-month]', m);
        m.classList.toggle('is-on', !!bar && bar.getAttribute('data-dc-month') === key);
      });
    }

    $$('[data-dc-month]').forEach(function (bar) {
      var key = bar.getAttribute('data-dc-month');
      /* A month with nothing in it has no note of its own, so pointing at it
         returns the box to the year summary rather than leaving the previous
         month's sentence standing over the wrong bar. */
      var has = !!$('[data-dc-note="' + key + '"]');
      ['mouseenter', 'focus'].forEach(function (evt) {
        bar.addEventListener(evt, function () { showMonth(has ? key : 'year'); });
      });
      bar.addEventListener('click', function () { showMonth(has ? key : 'year'); });
    });

    var chart = $('[data-dc-chart]');
    if (chart) {
      chart.addEventListener('mouseleave', function () { showMonth('year'); });
    }

    /* --------------------------------------------------------- §05 the tag --- */

    var notes = [];
    try { notes = JSON.parse($('[data-dc-consequence]').getAttribute('data-dc-notes') || '[]'); }
    catch (e) { notes = []; }

    $$('[data-dc-tag]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        var i = Number(radio.getAttribute('data-dc-tag'));
        if (notes[i]) { setText($('[data-dc-consequence]'), notes[i]); }
      });
    });
  }());


  /* ==========================================================================
     9as. Sell my home — the route, the gap, the score and what you keep
     -----------------------------------------------------------------------------
     Nothing here creates content. All five steps, the three routes, the six
     requirements, the eight frames, the twelve demand bands, the four
     comparables and both right-hand panels are printed by the builder, four
     step panels hidden. With the script off the page reads step one in full,
     the routes work (they are radios), and every figure the owner has not
     chosen shows a dash rather than a number.

     AN UNSET PRICE IS NOT A DEFAULT
     -------------------------------
     `step 0` means no asking price. Price, per-m², every band, every proceeds
     row, the total and the preview all respect it. A seller must never be
     shown a number they did not choose in a place they will read as their own
     decision — the handoff records a review that caught exactly that.

     THE GAP CALLOUT HAS FOUR BRANCHES
     ---------------------------------
     Unsurveyed, exact, smaller, larger. The fourth is the one worth keeping:
     a home larger than its deed is usually an enclosed balcony without
     consent, and treating "bigger" as good would be harmful advice.

     THE MODEL IS THE HANDOFF'S, TO THE EURO
     ---------------------------------------
     €800 000 on the agent route leaves €540 820; by yourself, €584 497 — a
     saving of €43 677, which is the number the closing sentence quotes.
     ========================================================================== */

  (function sellMyHome() {
    var form = $('.slform');
    if (!form) { return; }

    var ROUTES = {
      agent: { label: 'With an AVAVA agent', fee: '4.5%', rate: 0.045, flat: 0,
        says: 'Everything handled. The survey and the photographs are included, which is most of what the fee difference buys.' },
      assisted: { label: 'Assisted, you do the viewings', fee: '2.5%', rate: 0.025, flat: 0,
        says: 'The middle road. We filter the enquiries so you only meet people who can actually pay.' },
      owner: { label: 'By yourself', fee: '€490 flat', rate: 0, flat: 490,
        says: 'Cheapest, and the most work. Expect around forty enquiries in the first fortnight, most of them from agents rather than buyers.' }
    };
    var MORTGAGE = 214000, VAT_RATE = 0.23, LEGAL = 900, BASE = 700000, INC = 20000;
    var SHAPE = [5, 9, 14, 20, 24, 21, 16, 12, 8, 5, 3, 2];
    var BAND_BASE = 660000, BAND_W = 20000;
    var TOTAL = SHAPE.reduce(function (t, n) { return t + n; }, 0);

    function eur(v) {
      return '€' + String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    function num(s) {
      var d = String(s).replace(/[^0-9]/g, '');
      return d ? parseInt(d, 10) : 0;
    }
    function routeId() {
      var on = $$('[data-sl-route]').filter(function (r) { return r.checked; })[0];
      return on ? on.getAttribute('data-sl-route') : 'agent';
    }
    function priceStep() { return Number($('[data-sl-slider]').value); }
    function surveyed() {
      var b = $('[data-sl-paper="survey"]');
      return !!b && b.getAttribute('aria-pressed') === 'true';
    }
    function deedArea() { return num($('[data-sl-deed]').value); }
    function measuredArea() { return num($('[data-sl-measured]').value); }
    function area() {
      return surveyed() && measuredArea() ? measuredArea() : (deedArea() || 90);
    }
    function pressed(sel) {
      return $$(sel).filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; });
    }

    /* ------------------------------------------------------- the sections --- */

    function paintRoute() {
      var r = ROUTES[routeId()];
      setText($('[data-sl-says]'), r.says);
      setText($('[data-sl-feenote]'), r.label + ' · ' + r.fee);
      setText($('[data-sl-photocta]'), routeId() === 'agent'
        ? 'Photographer included — book a slot'
        : 'Book a photographer · €180');
    }

    function paintGap() {
      var box = $('[data-sl-gap]');
      var deed = deedArea(), meas = measuredArea(), gap = 0, key, figure;

      if (!surveyed()) {
        key = 'warn';
        figure = '—';
        setText($('[data-sl-gaptext]'), 'Until a surveyor has been we publish your deed figure of '
          + deed + ' m². Deeds are wrong more often than you would think, and a buyer\'s own '
          + 'surveyor finding it first costs you the negotiation.');
      } else {
        gap = meas && deed ? meas - deed : 0;
        if (gap === 0) {
          key = 'exact';
          figure = '0 m²';
          setText($('[data-sl-gaptext]'), 'Your deed is accurate. We say so on the listing — most '
            + 'are not, and buyers have learned to doubt the number.');
        } else if (gap < 0) {
          key = 'smaller';
          /* A true minus, not a hyphen: it sits on the same optical line as
             the `+` of the branch above and reads as arithmetic. */
          figure = '\u2212' + Math.abs(gap) + ' m²';
          setText($('[data-sl-gaptext]'), 'Your home is smaller than the deed says. We publish the '
            + 'measured figure and the difference, and we price on the smaller number. Buyers '
            + 'trust the listing that admits it.');
        } else {
          /* Bigger is not better: it is usually an enclosure without consent. */
          key = 'warn';
          figure = '+' + gap + ' m²';
          setText($('[data-sl-gaptext]'), 'Larger than the deed. Check whether a previous owner '
            + 'enclosed a balcony without consent — better to find that now than at the notary.');
        }
      }
      box.className = 'slgap slgap--' + key;
      setText($('[data-sl-gapfigure]'), figure);

      var field = $('[data-sl-measuredfield]');
      var input = $('[data-sl-measured]');
      input.disabled = !surveyed();
      /* Un-booking the survey clears the figure: publishing a measurement
         nobody took is the one thing this field must never do. Booking it
         brings the surveyor's number back rather than an empty box. */
      if (!surveyed()) {
        input.value = '';
      } else if (!input.value) {
        input.value = input.getAttribute('data-sl-surveyed') || '';
      }
      field.classList.toggle('slfield--live', surveyed());
      setText($('[data-sl-measuredhint]'), surveyed()
        ? 'This is the figure we publish'
        : 'Book it on the papers step');
    }

    function paintPapers() {
      var req = ['deed', 'caderneta', 'energy'].filter(function (id) {
        var b = $('[data-sl-paper="' + id + '"]');
        return b && b.getAttribute('aria-pressed') === 'true';
      }).length;
      var all = pressed('[data-sl-paper]').length;
      var foot = $('[data-sl-paperfoot]');

      setText(foot, req === 3
        ? all + ' of six on file. The three that a buyer\'s notary will ask for are done.'
        : 'Your home cannot go on the register until the deed, the registry extract and the '
          + 'energy certificate are on file.');
      foot.className = 'slfoot__text' + (req === 3 ? '' : ' slfoot__text--warn');

      var next = $('[data-sl-next]');
      if (Number(next.getAttribute('data-sl-at')) === 4) {
        setText(next, req === 3 ? 'List my home'
          : 'List — ' + (3 - req) + ' document' + (3 - req === 1 ? '' : 's') + ' missing');
        next.classList.toggle('slnext--blocked', req !== 3);
      }
      return req;
    }

    function paintShots() {
      var taken = pressed('[data-sl-shot]');
      var must = taken.filter(function (b) { return b.getAttribute('data-sl-must') === '1'; });
      var shotFoot = $('[data-sl-shotfoot]');
      setText(shotFoot, must.length === 4
        ? taken.length + ' of eight taken. The four rooms buyers look for are covered.'
        : (4 - must.length) + ' of the four rooms buyers always look for are still missing.');
      shotFoot.className = 'slfoot__text' + (must.length === 4 ? '' : ' slfoot__text--warn');
      $$('[data-sl-shot]').forEach(function (b) {
        b.classList.toggle('slframe--must', b.getAttribute('data-sl-must') === '1'
          && b.getAttribute('aria-pressed') !== 'true');
      });
      $('[data-sl-hatch]').hidden = taken.length > 0;
      return { taken: taken.length, must: must.length };
    }

    function paintPrice() {
      var step = priceStep();
      var unset = step === 0;
      var price = BASE + step * INC;
      var per = Math.round(price / area());

      var comps = $$('[data-sl-comp]').map(function (el) { return num(el.textContent); });
      var median = comps.slice().sort(function (a, b) { return a - b; })[2];
      var overPct = Math.round((per - median) / median * 100);
      var reach = SHAPE.reduce(function (t, n, i) {
        return t + (BAND_BASE + (i + 1) * BAND_W >= price ? n : 0);
      }, 0);

      setText($('[data-sl-price]'), unset ? 'Not set' : eur(price));
      var perEl = $('[data-sl-persqm]');
      setText(perEl, unset ? 'move the slider' : eur(per) + ' / m²');
      perEl.className = 'slprice__per' + (unset ? ''
        : overPct > 8 ? ' slprice__per--over'
          : overPct < -6 ? ' slprice__per--under' : ' slprice__per--band');

      var slider = $('[data-sl-slider]');
      slider.setAttribute('aria-valuetext', unset ? 'no asking price set'
        : eur(price) + ', ' + eur(per) + ' per square metre');

      var reachEl = $('[data-sl-reach]');
      setText(reachEl, unset ? 'set a price first' : reach + ' of ' + TOTAL);
      reachEl.className = 'slreach' + (unset ? ''
        : reach >= 60 ? ' slreach--good' : reach >= 35 ? ' slreach--mid' : ' slreach--low');

      $$('.slband').forEach(function (b, i) {
        b.classList.toggle('slband--lit', !unset && BAND_BASE + (i + 1) * BAND_W >= price);
      });
      /* Green when the neighbour got more per square metre than you are
         asking, warn when they got less: the colour is about your price, not
         about theirs, so it reads the same way the verdict below does. */
      $$('[data-sl-comp]').forEach(function (el, i) {
        el.classList.toggle('slcomp__per--under', comps[i] <= per);
      });

      var box = $('[data-sl-verdict]');
      var kind = unset ? '' : overPct > 8 ? 'over' : overPct < -6 ? 'under' : 'band';
      box.className = 'slverdict' + (kind ? ' slverdict--' + kind : '');
      setText($('[data-sl-verdicttitle]'), unset ? 'No price set yet'
        : kind === 'over' ? 'Above what your neighbours got'
          : kind === 'under' ? 'Under your street' : 'In the band');
      setText($('[data-sl-verdictbody]'), unset
        ? 'Move the slider. The buyers who could pay it, the four homes that actually signed near '
          + 'you, and what you would keep all move with it.'
        : kind === 'over'
          ? 'At ' + eur(per) + ' a square metre you are asking ' + overPct + '% more than the four '
            + 'homes that actually sold near you. The listing will be looked at and not visited, '
            + 'and in eight weeks you will be cutting the price with a stale listing instead of a '
            + 'fresh one.'
          : kind === 'under'
            ? Math.abs(overPct) + '% under what signed near you. It will go quickly — but ' + reach
              + ' buyers can already reach it, and you only need one. Ask yourself whether quick '
              + 'is what you need.'
            : 'Within ' + Math.abs(overPct) + '% of what actually signed on your street, and '
              + reach + ' registered buyers can pay it. This is the band where homes sell in six '
              + 'weeks rather than six months.');
      return { unset: unset, price: price, per: per };
    }

    function paintKeep(p) {
      var r = ROUTES[routeId()];
      var fee = r.rate ? Math.round(p.price * r.rate) : r.flat;
      var vat = Math.round(fee * VAT_RATE);
      var net = p.price - MORTGAGE - fee - vat - LEGAL;
      var full = Math.round(p.price * 0.045);
      var saving = full + Math.round(full * VAT_RATE) - fee - vat;

      var rows = $$('[data-sl-row]');
      var values = [p.unset ? '—' : eur(p.price), '−' + eur(MORTGAGE),
        p.unset ? '—' : '−' + eur(fee), p.unset ? '—' : '−' + eur(vat), '−' + eur(LEGAL)];
      var unsettable = [true, false, true, true, false];
      rows.forEach(function (el, i) {
        setText(el, values[i]);
        el.className = 'slrow__value'
          + (p.unset && unsettable[i] ? ' slrow__value--unset' : '')
          + (i === 0 && !p.unset ? ' slrow__value--price' : '');
      });

      /* Once there is a price, the top row stops telling the owner to set one
         and starts saying what it is: the figure the buyer pays, before any
         of the four deductions under it. */
      setText($('[data-sl-asknote]'), p.unset ? 'Set it on the last step'
        : 'What the buyer pays');
      setText($('[data-sl-nettag]'), p.unset ? 'once you price it' : 'at this price');
      setText($('[data-sl-net]'), p.unset ? '—' : eur(net));
      setText($('[data-sl-netnote]'), p.unset
        ? 'Set an asking price on the last step and this becomes a real figure — mortgage settled, '
          + 'fees paid, the rest into your account.'
        : routeId() === 'owner'
          ? 'Selling it yourself keeps ' + eur(saving) + ' more than the full-service route. '
            + 'Whether that is worth forty phone calls is the question.'
          : routeId() === 'assisted'
            ? 'The assisted route keeps ' + eur(saving) + ' more than full service, and you open '
              + 'the door yourself.'
            : 'No capital gains tax shown — if this is your main home and you buy another within '
              + 'three years, there usually is none. Ask the notary about your case.');
    }

    function paintPreview(p, shots, req, score) {
      setText($('[data-sl-prevtitle]'), $('[data-sl-street]').value + ', '
        + $('#sl-floor').value);
      var district = pressed('[data-sl-district]')[0];
      setText($('[data-sl-prevmeta]'), (district ? district.textContent : '') + ' · '
        + (pressed('[data-sl-beds]')[0]
          ? pressed('[data-sl-beds]')[0].getAttribute('data-sl-beds') : '2') + ' bed · '
        + area() + ' m²' + (surveyed() ? ' measured' : ' on the deed'));

      var tags = pressed('[data-sl-feat]').slice(0, 3);
      var list = $('[data-sl-prevtags]');
      list.innerHTML = '';
      tags.forEach(function (t) {
        var li = document.createElement('li');
        li.className = 'sltag';
        li.textContent = t.textContent;
        list.appendChild(li);
      });

      setText($('[data-sl-prevprice]'), p.unset ? 'Not set' : eur(p.price));
      setText($('[data-sl-prevhint]'), p.unset ? 'move the slider' : eur(p.per) + ' / m²');
      var note = $('[data-sl-prevnote]');
      setText(note, p.unset ? 'Price not set'
        : shots.taken + (shots.taken === 1 ? ' photograph · ' : ' photographs · ')
          + pressed('[data-sl-paper]').length
          + (pressed('[data-sl-paper]').length === 1 ? ' document' : ' documents'));
      note.className = 'slcard__note' + (p.unset ? ' slcard__note--warn' : '');

      var ready = req === 3 && score >= 80;
      var badge = $('[data-sl-badge]');
      setText(badge, ready ? 'Ready to list' : 'Draft');
      badge.className = 'slbadge' + (ready ? ' slbadge--ready' : '');
    }

    function paintScore(req, shots, p) {
      var on = function (id) {
        var b = $('[data-sl-paper="' + id + '"]');
        return b && b.getAttribute('aria-pressed') === 'true';
      };
      var feats = pressed('[data-sl-feat]').length;
      var n = Math.round(req / 3 * 30 + (on('survey') ? 14 : 0) + (on('permits') ? 6 : 0)
        + (on('condo') ? 6 : 0) + shots.must / 4 * 22 + (shots.taken >= 6 ? 6 : 0)
        + (p.unset ? 0 : 10) + (feats > 0 ? 6 : 0));
      var band = n >= 80 ? 'ready' : n >= 55 ? 'nearly' : 'start';

      setText($('[data-sl-score]'), String(n));
      $('[data-sl-score]').className = 'slscore__value'
        + (band === 'start' ? '' : ' slscore__value--' + band);
      var tag = $('[data-sl-tag]');
      setText(tag, band === 'ready' ? 'ready' : band === 'nearly' ? 'nearly' : 'just started');
      tag.className = 'slscore__tag' + (band === 'start' ? '' : ' slscore__tag--' + band);

      var bar = $('[data-sl-bar]');
      bar.className = 'slbar__fill' + (band === 'start' ? '' : ' slbar__fill--' + band);
      /* The only runtime style on the page: the figure is live and unbounded,
         and its opening value ships as a class so the bar is right with the
         script off. */
      bar.style.width = n + '%';

      setText($('[data-sl-scorenote]'), band === 'ready'
        ? 'This is a complete file. Homes listed like this sell about three weeks quicker than the '
          + 'ones missing paperwork.'
        : band === 'nearly'
          ? 'Nearly there. Every missing piece is a question a buyer asks you on the phone instead '
            + 'of reading.'
          : 'Keep going. Three documents and four photographs is the least a buyer needs to take '
            + 'you seriously.');

      var todos = [req === 3, shots.must === 4, surveyed(), !p.unset];
      var labels = [
        req === 3 ? 'Papers on file'
          : (3 - req) + ' required document' + (3 - req === 1 ? '' : 's') + ' to find',
        shots.must === 4 ? 'Four rooms photographed'
          : (4 - shots.must) + ' room' + (4 - shots.must === 1 ? '' : 's') + ' still to photograph',
        surveyed() ? 'Measured survey done' : 'Book the measured survey',
        p.unset ? 'Set your asking price' : 'Asking price set'
      ];
      $$('[data-sl-todo]').forEach(function (b, i) {
        b.classList.toggle('sltodo__link--done', todos[i]);
        var dot = $('.sltodo__dot', b);
        b.textContent = '';
        b.appendChild(dot);
        b.appendChild(document.createTextNode(labels[i]));
      });
      var left = todos.filter(function (t) { return !t; }).length;
      setText($('[data-sl-todofoot]'), left === 0
        ? 'Nothing outstanding. List it and the buyers whose brief matches hear tonight.'
        : left + ' thing' + (left === 1 ? '' : 's') + ' between your home and the register.');
      return n;
    }

    function repaint() {
      paintRoute();
      paintGap();
      var req = paintPapers();
      var shots = paintShots();
      var p = paintPrice();
      paintKeep(p);
      var score = paintScore(req, shots, p);
      paintPreview(p, shots, req, score);

      var at = Number($('[data-sl-next]').getAttribute('data-sl-at') || 0);
      var done = [true, deedArea() > 0, req === 3, shots.must === 4, !p.unset];
      $$('[data-sl-tick]').forEach(function (t, i) {
        t.classList.toggle('sltick--done', done[i]);
        setText($('.sr-only', t), done[i] ? 'done' : 'not done');
      });
      if (at === 1) {
        setText($('[data-sl-stepmeta]'), surveyed()
          ? 'measured and on file' : 'the survey unlocks the measured figure');
      }
      var left = [req === 3, shots.must === 4, surveyed(), !p.unset]
        .filter(function (t) { return !t; }).length;
      setText($('[data-sl-navnote]'), navNote(at, done[at], req, left));
    }

    /* --------------------------------------------------------- the steps --- */

    var HEADS = [
      ['01', 'Your home', 'the route decides the fee'],
      ['02', 'The rooms', ''],
      ['03', 'Your papers', 'three of these are not optional'],
      ['04', 'Photographs', 'tap a frame to mark it taken'],
      ['05', 'Your price', 'and what you would keep']
    ];
    /* What the step's own Next button says about it. One line for every step
       but the last, which is the only one that gates and so writes its own. */
    function navNote(at, done, req, left) {
      if (at < 4) { return done ? 'This step is done.' : 'You can come back to this.'; }
      if (req < 3) { return 'You cannot list until the required documents are on file.'; }
      return left === 0 ? 'Everything is in place.'
        : left + ' thing' + (left === 1 ? '' : 's') + ' still outstanding.';
    }

    function go(i) {
      $$('[data-sl-step]').forEach(function (b, n) {
        b.setAttribute('aria-selected', n === i ? 'true' : 'false');
      });
      $$('.slpanel').forEach(function (p, n) { p.hidden = n !== i; });
      setText($('[data-sl-stepnum]'), HEADS[i][0]);
      setText($('[data-sl-steptitle]'), HEADS[i][1]);
      setText($('[data-sl-stepmeta]'), i === 1
        ? (surveyed() ? 'measured and on file' : 'the survey unlocks the measured figure')
        : HEADS[i][2]);
      var back = $('[data-sl-back]');
      setText(back, i === 0 ? 'Cancel' : 'Back');
      back.classList.toggle('slghost--back', i > 0);
      var next = $('[data-sl-next]');
      next.setAttribute('data-sl-at', String(i));
      if (i < 4) {
        setText(next, 'Next');
        next.classList.remove('slnext--blocked');
      }
      /* Everything the footer says depends on the step, so it is cheaper and
         safer to repaint than to reason about which parts changed. */
      repaint();
    }

    $$('[data-sl-step]').forEach(function (btn, i) {
      btn.addEventListener('click', function () { go(i); });
    });
    $('[data-sl-back]').addEventListener('click', function () {
      var at = Number($('[data-sl-next]').getAttribute('data-sl-at') || 0);
      go(Math.max(0, at - 1));
    });
    $('[data-sl-next]').addEventListener('click', function () {
      var at = Number($('[data-sl-next]').getAttribute('data-sl-at') || 0);
      if (at < 4) { go(at + 1); }
    });
    $$('[data-sl-todo]').forEach(function (btn) {
      btn.addEventListener('click', function () { go(Number(btn.getAttribute('data-sl-todo'))); });
    });

    /* -------------------------------------------------------- the inputs --- */

    $$('[data-sl-route]').forEach(function (r) { r.addEventListener('change', repaint); });
    ['[data-sl-deed]', '[data-sl-measured]', '[data-sl-street]'].forEach(function (sel) {
      var el = $(sel);
      if (el) { el.addEventListener('input', repaint); }
    });
    $('[data-sl-slider]').addEventListener('input', repaint);

    [['[data-sl-district]', true], ['[data-sl-beds]', true], ['[data-sl-baths]', true],
     ['[data-sl-feat]', false]].forEach(function (pair) {
      var sel = pair[0], single = pair[1];
      $$(sel).forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (single) {
            $$(sel).forEach(function (b) {
              var on = b === btn;
              b.classList.toggle('is-on', on);
              b.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
          } else {
            var on = btn.getAttribute('aria-pressed') !== 'true';
            btn.classList.toggle('is-on', on);
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
            var lit = pressed('[data-sl-feat]').length;
            setText($('[data-sl-featcount]'), lit === 0
              ? 'Nothing chosen yet. These are what buyers filter on — a lift alone doubles '
                + 'the people who will look.'
              : lit + ' of eight chosen.');
          }
          repaint();
        });
      });
    });

    $$('[data-sl-paper]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        var row = btn.closest('.slpaper');
        if (row) {
          row.classList.toggle('slpaper--on', on);
          /* The dot carries the row's whole state: a tick once it is on file,
             an exclamation while it is not. */
          setText($('.slpaper__dot', row), on ? '\u2713' : '!');
        }
        setText(btn, on ? 'On file' : btn.getAttribute('data-sl-action') || 'Upload');
        repaint();
      });
    });

    $$('[data-sl-shot]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.setAttribute('aria-pressed',
          btn.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        repaint();
      });
    });

    $('[data-sl-next]').setAttribute('data-sl-at', '0');
    repaint();
  }());


  /* ==========================================================================
     9at. Agent desk — the queue, the day, the funnel and the twelve weeks
     -----------------------------------------------------------------------------
     Nothing here creates content. The five enquiries, the seven day rows, the
     four offers, the five listings, the four owners, the six funnel steps and
     the twelve weeks are all printed by the builder, in their default order
     and state. With the script off the page is a complete, readable shift:
     the queue is sorted by longest wait, the funnel opens on `Booked a
     viewing`, the chart opens on this week, and every figure is right.

     THREE NUMBERS ARE DERIVED, NEVER AUTHORED
     -----------------------------------------
     `late` (enquiries past 24 h), `owed` (owners past 7 days, minus any
     report sent this session) and `worstStep` (the largest proportional drop
     in the funnel). The handoff is explicit that writing them into the copy
     is the bug to avoid, and the owners' sentence needs a **singular branch**
     — toggling three of the four reports leaves exactly one, and "1 owners"
     shipped once.

     SORTING READS NUMBERS OFF THE ROW, NEVER THE PRINTED PRICE
     ----------------------------------------------------------
     Each row carries `data-ag-hours`, `data-ag-value` and `data-ag-rank`.
     Parsing `€985 000 · Século 118` gave 985000118 in an earlier build and
     put the valuation lead, who has no price at all, at the top of the value
     sort.

     HOVER IS NOT THE ONLY WAY IN
     ----------------------------
     The drawing is desktop-only and drives the funnel, the weeks and the rail
     chart on hover. Here they are buttons: hover still works, and so do tap,
     Enter and Space.
     ========================================================================== */

  (function agentDesk() {
    var page = $('.agpage');
    if (!page) { return; }

    /* ------------------------------------------------------- §01 the sort --- */

    var queue = $('[data-ag-queue]');
    var rows = $$('[data-ag-lead]', queue);

    function sortQueue(id) {
      var key = id === 'value' ? 'data-ag-value'
        : id === 'ready' ? 'data-ag-rank' : 'data-ag-hours';
      var asc = id === 'ready';
      /* A copy, so nothing counted afterwards sees a reordered list — and ties
         break on the source order, never on whatever the last sort left in the
         DOM. Two leads share €985 000, and sorting the displayed order swapped
         them every other click. */
      rows.slice().sort(function (a, b) {
        var x = Number(a.getAttribute(key)), y = Number(b.getAttribute(key));
        if (x !== y) { return asc ? x - y : y - x; }
        return Number(a.getAttribute('data-ag-seq')) - Number(b.getAttribute('data-ag-seq'));
      }).forEach(function (row, i, all) {
        row.classList.toggle('aglead--last', i === all.length - 1);
        queue.appendChild(row);
      });

      $$('[data-ag-sort]').forEach(function (b) {
        var on = b.getAttribute('data-ag-sort') === id;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var label = $('[data-ag-sort="' + id + '"]').textContent.trim().toLowerCase();
      setText($('[data-ag-queuefoot]'),
        'Sorted by ' + label + '. A buyer who waits a day writes to someone else.');
    }

    $$('[data-ag-sort]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        sortQueue(btn.getAttribute('data-ag-sort'));
      });
    });

    /* --------------------------------------------------- §05 the reports --- */

    function ownerFoot() {
      var owed = $$('[data-ag-owner]').filter(function (b) {
        return Number(b.getAttribute('data-ag-days')) >= 7
          && b.getAttribute('aria-pressed') !== 'true';
      }).length;
      setText($('[data-ag-ownerfoot]'), owed === 0
        ? 'Every owner has heard from you this week. It is the cheapest thing you do and the '
          + 'first thing they remember.'
        : owed === 1
          ? 'One owner has gone more than a week without a word. That is how instructions are '
            + 'lost, not by price.'
          : owed + ' owners have gone more than a week without a word. That is how '
            + 'instructions are lost, not by price.');
    }

    $$('[data-ag-owner]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sent = btn.getAttribute('aria-pressed') !== 'true';
        var days = Number(btn.getAttribute('data-ag-days'));
        var due = $('[data-ag-due="' + btn.getAttribute('data-ag-owner') + '"]');

        btn.setAttribute('aria-pressed', sent ? 'true' : 'false');
        setText(btn, sent ? 'Sent' : 'Send report');
        btn.className = 'agsend' + (sent ? ' agsend--sent' : days >= 7 ? ' agsend--due' : '');
        if (due) {
          setText(due, sent ? 'Sent just now' : days + ' days since');
          due.className = 'agdue' + (sent ? ' agdue--sent' : days >= 7 ? ' agdue--warn' : '');
        }
        ownerFoot();
      });
    });

    /* ---------------------------------------------------- §07 the funnel --- */

    var steps = $$('[data-ag-step]');
    /* The worst step is whichever row the builder marked; the commentary box
       borrows its colour only when that row is the one being read. */
    var worst = steps.map(function (b) {
      return !!$('.agstep__bar--worst', b);
    }).indexOf(true);

    function readStep(i) {
      steps.forEach(function (b, n) { b.classList.toggle('is-on', n === i); });
      var says = $('[data-ag-says]');
      setText(says, steps[i].getAttribute('data-ag-note'));
      says.classList.toggle('agsays--worst', i === worst);
    }

    steps.forEach(function (btn, i) {
      btn.addEventListener('mouseenter', function () { readStep(i); });
      btn.addEventListener('focus', function () { readStep(i); });
      btn.addEventListener('click', function () { readStep(i); });
    });

    /* ----------------------------------------------------- §08 the weeks --- */

    var WEEKS = $$('[data-ag-week]').map(function (b) {
      var t = b.getAttribute('aria-label');
      var m = t.match(/^(\S+): (\d+) enquiries, (\d+) viewings/);
      return { label: m[1], e: Number(m[2]), v: Number(m[3]),
        signed: b.getAttribute('data-ag-signed') !== '0',
        note: b.getAttribute('data-ag-note') };
    });
    function readWeek(i) {
      var w = WEEKS[i], prev = i > 0 ? WEEKS[i - 1] : null;
      $$('[data-ag-week]').forEach(function (b, n) { b.classList.toggle('is-on', n === i); });
      $$('[data-ag-wklabel]').forEach(function (l, n) { l.classList.toggle('is-on', n === i); });

      setText($('[data-ag-wke]'), String(w.e));
      setText($('[data-ag-wkunit]'), 'enquiries in ' + w.label);
      setText($('[data-ag-wklabelnote]'), 'week ' + w.label + ' selected');

      var delta = $('[data-ag-wkdelta]');
      setText(delta, prev === null ? 'first week shown'
        : (w.e >= prev.e ? '+' : '−') + Math.abs(w.e - prev.e) + ' on the week before');
      delta.className = 'agchart__delta' + (prev === null ? ' agchart__delta--flat'
        : w.e >= prev.e ? '' : ' agchart__delta--warn');

      var conv = Math.round(w.v / w.e * 100);
      var reads = $$('[data-ag-read]');
      setText(reads[0], String(w.e));
      setText(reads[1], String(w.v));
      setText(reads[2], $('[data-ag-week="' + i + '"]').getAttribute('data-ag-signed'));
      reads[2].className = 'agcell__value agcell__value--sm'
        + (w.signed ? ' agcell__value--good' : ' agcell__value--muted');
      setText(reads[3], conv + '%');
      /* Above the desk's 36% or below it — the one figure on the page that
         says whether the week's enquiries were worth having. */
      reads[3].className = 'agcell__value agcell__value--sm'
        + (w.v / w.e >= 0.36 ? ' agcell__value--good' : ' agcell__value--warn');

      setText($('[data-ag-wknote]'), w.note);
    }

    $$('[data-ag-week]').forEach(function (btn, i) {
      btn.addEventListener('mouseenter', function () { readWeek(i); });
      btn.addEventListener('focus', function () { readWeek(i); });
      btn.addEventListener('click', function () { readWeek(i); });
    });

    /* --------------------------------------------------- the rail's week --- */

    var dows = $$('[data-ag-dow]');
    var DOW_NAME = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
      'Sunday'];

    function readDow(i) {
      dows.forEach(function (b, n) { b.classList.toggle('is-on', n === i); });
      var m = dows[i].getAttribute('aria-label').match(/(\d+) enquiries/);
      var n = Number(m[1]);
      setText($('[data-ag-weeknote]'), DOW_NAME[i] + ': ' + n + ' enquir'
        + (n === 1 ? 'y' : 'ies') + ', ' + dows[i].getAttribute('data-ag-note') + '.');
    }

    dows.forEach(function (btn, i) {
      btn.addEventListener('mouseenter', function () { readDow(i); });
      btn.addEventListener('focus', function () { readDow(i); });
      btn.addEventListener('click', function () { readDow(i); });
    });

    /* Leaving the rail chart puts the weekly summary back: the caption should
       never be left describing a day the reader is no longer pointing at. */
    var chart = $('.agweek__bars');
    if (chart) {
      chart.addEventListener('mouseleave', function () {
        dows.forEach(function (b) { b.classList.remove('is-on'); });
        setText($('[data-ag-weeknote]'),
          'Monday and Thursday bring half the week\'s enquiries. Keep those two mornings '
          + 'clear.');
      });
    }
  }());


  /* ==========================================================================
     9au. My listings — the picker, the price simulator and the table
     -----------------------------------------------------------------------------
     Nothing here creates content. All six files are printed in full — picker
     row, evidence column with its own funnel, weekly chart and diagnosis, and
     its own quality checklist — with five of each hidden. Choosing a file is
     a `hidden` flip, so no diagnosis can be assembled wrong, and with the
     script off the page reads Rosa 62 end to end.

     THE SIMULATOR IS THE ONE THING THAT COMPUTES
     --------------------------------------------
     It has to: the new price, the band colouring, the four outcome rows and
     the advice line all move with a slider. Every input it needs sits on the
     picker button as a `data-*` number, so it never parses a printed price.

     THREE BRANCHES IN THE ADVICE, AND THE MIDDLE ONE MATTERS MOST
     -------------------------------------------------------------
     At zero it is the file's own line. When the cut reaches nobody new it
     says so — that is the most valuable sentence on the page, and it is what
     one per cent produces on most files. Otherwise it names the buyers gained
     and what they cost the agent, with a singular branch for exactly one.

     SELECTING A FILE RESETS THE SLIDER
     ----------------------------------
     Otherwise a −8% rehearsed on the stale file silently follows the agent
     onto a healthy one, and the advice reads as though it were about that.
     ========================================================================== */

  (function myListings() {
    var page = $('.mltrip');
    if (!page) { return; }

    var SHAPE = [3, 6, 11, 17, 22, 19, 14, 10, 7, 5, 3, 2];
    var STEP = 25000, RATE = 0.045, MAXCUT = 12;
    var TOTAL = SHAPE.reduce(function (t, n) { return t + n; }, 0);
    var picks = $$('[data-ml-pick]');

    function eur(v) {
      return '€' + String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    function num(el, name) { return Number(el.getAttribute(name)); }
    function current() {
      return picks.filter(function (b) { return b.classList.contains('is-on'); })[0]
        || picks[0];
    }
    function cut() { return Number($('[data-ml-slider]').value); }

    /* ------------------------------------------------------ the simulator --- */

    function model(file, c) {
      var price = num(file, 'data-ml-price');
      var base = num(file, 'data-ml-base');
      var days = num(file, 'data-ml-days');
      var enq = num(file, 'data-ml-enq');
      var newPrice = Math.round(price * (1 - c / 100) / 1000) * 1000;
      var reach = 0, asking = 0;
      SHAPE.forEach(function (n, i) {
        var top = base + (i + 1) * STEP;
        if (top >= newPrice) { reach += n; }
        if (top >= price) { asking += n; }
      });
      return {
        price: price, newPrice: newPrice, reach: reach, asking: asking,
        gained: reach - asking,
        perWeek: Math.max(1, Math.round(enq / Math.max(1, days / 7)
          * (reach / Math.max(1, asking)))),
        toSell: Math.max(9, Math.round(days > 90 ? 88 - c * 5.5 : 62 - c * 4.2)),
        commission: Math.round(newPrice * RATE),
        full: Math.round(price * RATE)
      };
    }

    function paintSim() {
      var file = current(), c = cut(), m = model(file, c);

      setText($('[data-ml-newprice]'), eur(m.newPrice));
      var label = $('[data-ml-cutlabel]');
      setText(label, c === 0 ? 'asking price'
        : '−' + c + '% · ' + eur(m.price - m.newPrice) + ' off');
      label.className = 'mlsim__cut' + (c === 0 ? '' : ' mlsim__cut--on');

      var slider = $('[data-ml-slider]');
      slider.setAttribute('aria-valuetext', c === 0 ? 'asking price'
        : c + ' per cent off, ' + eur(m.newPrice));

      var reach = $('[data-ml-reach]');
      setText(reach, m.reach + ' of ' + TOTAL + (m.gained > 0 ? ' · +' + m.gained : ''));
      reach.className = 'mlreach' + (m.gained > 0 ? ' mlreach--gain' : '');

      $$('[data-ml-band]').forEach(function (b) {
        b.classList.toggle('mlband--on', num(b, 'data-ml-top') >= m.newPrice);
      });

      var outs = $$('[data-ml-out]');
      setText(outs[0], m.reach + ' registered');
      outs[0].className = 'mloutcome__value' + (m.gained > 0 ? ' mloutcome__value--good' : '');
      setText(outs[1], 'about ' + m.perWeek);
      setText(outs[2], m.toSell + ' days');
      outs[2].className = 'mloutcome__value'
        + (m.toSell <= 45 ? ' mloutcome__value--good'
          : m.toSell <= 70 ? ' mloutcome__value--accent' : ' mloutcome__value--warn');
      setText(outs[3], eur(m.commission));
      /* The page never hides what its own advice costs the agent. */
      outs[3].className = 'mloutcome__value' + (c === 0 ? '' : ' mloutcome__value--warn');

      var advice = $('[data-ml-advice]');
      setText(advice, c === 0 ? file.getAttribute('data-ml-file-advice')
        : m.gained === 0
          ? 'This cut costs the owner ' + eur(m.price - m.newPrice)
            + ' and reaches nobody new. The next band starts higher.'
          : 'A cut of ' + c + '% brings ' + m.gained + ' more registered buyer'
            + (m.gained === 1 ? '' : 's') + ' into range and costs you '
            + eur(m.full - m.commission) + ' in commission.');
      advice.className = 'mladvice' + (c > 0 && m.gained === 0 ? ' mladvice--warn' : '');

      setText($('[data-ml-cta]'), c === 0 ? file.getAttribute('data-ml-file-cta')
        : 'Send the owner this case');
    }

    $('[data-ml-slider]').addEventListener('input', paintSim);

    /* ------------------------------------------------------ choosing a file --- */

    function select(i) {
      picks.forEach(function (b, n) { b.classList.toggle('is-on', n === i); });
      $$('[data-ml-row]').forEach(function (r, n) { r.classList.toggle('is-on', n === i); });
      $$('[data-ml-ev]').forEach(function (c, n) { c.hidden = n !== i; });
      $$('[data-ml-qual]').forEach(function (c, n) { c.hidden = n !== i; });

      var ok = Number($('[data-ml-qual="' + i + '"] [data-ml-ok]')
        .getAttribute('data-ml-ok'));
      var head = $('[data-ml-qualnote]');
      setText(head, ok + ' of six on file');
      head.className = 'aghr__note'
        + (ok >= 5 ? ' aghr__note--good' : ok >= 4 ? '' : ' aghr__note--warn');

      /* A cut rehearsed on the stale file must not follow the agent onto a
         healthy one. */
      $('[data-ml-slider]').value = '0';
      paintSim();
    }

    picks.forEach(function (btn, i) {
      btn.addEventListener('click', function () { select(i); });
    });
    $$('[data-ml-row]').forEach(function (row) {
      row.addEventListener('click', function () {
        select(Number(row.getAttribute('data-ml-row')));
      });
    });

    /* ---------------------------------------------------- the weekly chart --- */

    $$('[data-ml-ev]').forEach(function (col) {
      var bars = $$('[data-ml-week]', col);
      var labels = $$('[data-ml-wklabel]', col);
      var note = $('[data-ml-chartnote]', col);
      var resting = note.textContent;
      bars.forEach(function (bar, i) {
        function read() {
          bars.forEach(function (b, n) { b.classList.toggle('is-on', n === i); });
          labels.forEach(function (l, n) { l.classList.toggle('is-on', n === i); });
          setText(note, bar.getAttribute('data-ml-note'));
        }
        bar.addEventListener('mouseenter', read);
        bar.addEventListener('focus', read);
        bar.addEventListener('click', read);
      });
      var wrap = $('.mlweeks', col);
      if (wrap) {
        wrap.addEventListener('mouseleave', function () {
          bars.forEach(function (b) { b.classList.remove('is-on'); });
          labels.forEach(function (l) { l.classList.remove('is-on'); });
          setText(note, resting);
        });
      }
    });

    /* --------------------------------------------------------- §02 filters --- */

    function filter(id) {
      var shown = 0;
      $$('[data-ml-row]').forEach(function (row) {
        var tone = row.getAttribute('data-ml-tone');
        var offers = Number(row.getAttribute('data-ml-offers'));
        var on = id === 'all' ? true
          : id === 'offer' ? offers > 0 && tone === 'accent'
            : id === 'attention' ? tone === 'warn' : tone === 'positive';
        row.parentNode.hidden = !on;
        row.classList.remove('mlrow--last');
        if (on) { shown += 1; }
      });
      var last = $$('[data-ml-row]').filter(function (r) { return !r.parentNode.hidden; });
      if (last.length) { last[last.length - 1].classList.add('mlrow--last'); }

      $$('[data-ml-tab]').forEach(function (b) {
        var on = b.getAttribute('data-ml-tab') === id;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      setText($('[data-ml-shown]'), shown + ' of 33 shown');
      $('[data-ml-empty]').hidden = shown > 0;
    }

    $$('[data-ml-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () { filter(btn.getAttribute('data-ml-tab')); });
    });

    /* ------------------------------------------------------ §03 the renewals --- */

    function expiryFoot() {
      var soon = $$('[data-ml-renew]').filter(function (b) {
        return Number(b.getAttribute('data-ml-instr')) <= 30
          && b.getAttribute('aria-pressed') !== 'true';
      }).length;
      var note = $('[data-ml-expnote]');
      setText(note, soon === 0 ? 'all renewed'
        : soon === 1 ? 'one inside a month' : soon + ' inside a month');
      note.className = 'aghr__note' + (soon === 0 ? ' aghr__note--good' : ' aghr__note--warn');
      setText($('[data-ml-expfoot]'), soon === 0
        ? 'Every instruction on this list is secure. Renew the rest a month out, while the '
          + 'owner still likes you.'
        : 'An instruction that runs out during a bad month is rarely renewed. Have the '
          + 'conversation while the traffic is still up.');
    }

    $$('[data-ml-renew]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var done = btn.getAttribute('aria-pressed') !== 'true';
        var id = btn.getAttribute('data-ml-renew');
        var instr = Number(btn.getAttribute('data-ml-instr'));
        var days = $('[data-ml-expdays="' + id + '"]');
        var row = $('[data-ml-exprow="' + id + '"]');

        btn.setAttribute('aria-pressed', done ? 'true' : 'false');
        setText(btn, done ? 'Renewed' : 'Renew');
        btn.className = 'mlrenew'
          + (done ? ' mlrenew--done' : instr <= 30 ? ' mlrenew--soon' : '');
        setText(days, done ? '180' : String(instr));
        days.className = 'mlexp__days'
          + (done ? ' mlexp__days--done'
            : instr <= 14 ? ' mlexp__days--warn'
              : instr <= 30 ? ' mlexp__days--accent' : '');
        row.className = 'mlexp__row'
          + (done ? ' mlexp__row--done' : instr <= 14 ? ' mlexp__row--soon' : '');
        expiryFoot();
      });
    });

    /* -------------------------------------------------- the rail's age bars --- */

    var ages = $$('[data-ml-age]');
    var ageLabels = $$('[data-ml-agelabel]');
    var ageNote = $('[data-ml-agenote]');
    var ageResting = ageNote ? ageNote.textContent : '';

    ages.forEach(function (btn, i) {
      function read() {
        ages.forEach(function (b, n) { b.classList.toggle('is-on', n === i); });
        ageLabels.forEach(function (l, n) { l.classList.toggle('is-on', n === i); });
        setText(ageNote, btn.getAttribute('data-ml-agesays'));
      }
      btn.addEventListener('mouseenter', read);
      btn.addEventListener('focus', read);
      btn.addEventListener('click', read);
    });

    var ageWrap = $('.mlages__bars');
    if (ageWrap) {
      ageWrap.addEventListener('mouseleave', function () {
        ages.forEach(function (b) { b.classList.remove('is-on'); });
        ageLabels.forEach(function (l) { l.classList.remove('is-on'); });
        setText(ageNote, ageResting);
      });
    }
  }());


  /* ==========================================================================
     9av. Add a property — the intake that is filled in over days
     -----------------------------------------------------------------------------
     Nothing here creates content. All five steps, the six requirements, the
     eight frames, the twelve demand bands, the four comparables and both
     right-hand panels are printed by the builder, four step panels hidden.
     With the script off the page reads step one in full and every figure it
     shows is the one the file actually has.

     STEP 02 IS NOT DONE BECAUSE THE FIELD HAS TEXT
     ----------------------------------------------
     `surveyed && measuredArea > 0`. A measured figure with no survey behind it
     is a number somebody typed, and the whole product position lives in that
     `&&`. Un-booking the survey clears the field rather than leaving a figure
     nobody stands behind.

     NOTHING IS VALIDATED WITH A RED ASTERISK
     ----------------------------------------
     Incompleteness is the strength score and the "still to do" list, both
     derived, and both linking to the step that fixes them. The publish button
     names its blocker instead of going grey.

     THE REGISTER IS NOT A SWITCH
     ----------------------------
     `AVAVA register` is drawn as a locked control with the word `always` in
     its note — a switch the agent cannot move would invite them to try.
     ========================================================================== */

  (function addProperty() {
    var form = $('.apform');
    if (!form) { return; }

    var DEED = 118, BASE = 850000, STEP_SIZE = 25000, BAND_BASE = 800000;
    var SHAPE = [4, 7, 12, 18, 23, 20, 15, 11, 8, 5, 3, 2];
    var TOTAL = SHAPE.reduce(function (t, n) { return t + n; }, 0);

    function eur(v) {
      return '€' + String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    function num(s) {
      var d = String(s).replace(/[^0-9]/g, '');
      return d ? parseInt(d, 10) : 0;
    }
    function pressed(sel) {
      return $$(sel).filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; });
    }
    function surveyed() {
      var b = $('[data-ap-paper="survey"]');
      return !!b && b.getAttribute('aria-pressed') === 'true';
    }
    function measuredArea() { return num($('[data-ap-measured]').value); }
    function area() { return surveyed() && measuredArea() ? measuredArea() : DEED; }
    function priceStep() { return Number($('[data-ap-slider]').value); }
    function price() { return BASE + priceStep() * STEP_SIZE; }
    function at() { return Number($('[data-ap-next]').getAttribute('data-ap-at') || 0); }

    /* ---------------------------------------------------------- the model --- */

    function counts() {
      var req = ['deed', 'permit', 'energy'].filter(function (id) {
        var b = $('[data-ap-paper="' + id + '"]');
        return b && b.getAttribute('aria-pressed') === 'true';
      }).length;
      var shots = pressed('[data-ap-shot]');
      var must = shots.filter(function (b) { return b.getAttribute('data-ap-must') === '1'; });
      return {
        req: req,
        papers: pressed('[data-ap-paper]').length,
        shots: shots.length,
        must: must.length,
        feats: pressed('[data-ap-feat]').length
      };
    }

    function on(id) {
      var b = $('[data-ap-paper="' + id + '"]');
      return b && b.getAttribute('aria-pressed') === 'true';
    }

    /* ------------------------------------------------------- §02 the gap --- */

    function paintGap() {
      var input = $('[data-ap-measured]');
      var field = $('[data-ap-measuredfield]');
      var live = surveyed();

      input.disabled = !live;
      /* Un-booking the survey clears the figure: publishing a measurement
         nobody took is the one thing this field must never do. */
      if (!live) {
        input.value = '';
      } else if (!input.value) {
        input.value = input.getAttribute('data-ap-surveyed') || '';
      }
      field.classList.toggle('apfield--live', live);

      var box = $('[data-ap-gap]');
      var m = measuredArea();
      var key, figure, text;

      if (!live) {
        key = 'warn';
        figure = '—';
        text = 'Not measured yet. Until the survey is on file we publish the deed figure of '
          + DEED + ' m² and price on it — book the survey on the papers step.';
      } else if (!m || m === DEED) {
        key = 'exact';
        figure = '0 m²';
        text = 'Your measurement matches the deed exactly. Say so on the file — most do not.';
      } else if (m < DEED) {
        key = 'smaller';
        figure = '−' + (DEED - m) + ' m²';
        text = 'Smaller than the deed says. We publish the measured figure and the '
          + 'difference, and we price on the smaller number.';
      } else {
        /* Bigger is not better: it is usually an enclosure nobody registered. */
        key = 'warn';
        figure = '+' + (m - DEED) + ' m²';
        text = 'Larger than the deed. Check for an unregistered enclosure before this goes '
          + 'anywhere near a notary.';
      }
      box.className = 'apgap apgap--' + key;
      setText($('[data-ap-gapfigure]'), figure);
      setText($('[data-ap-gaptext]'), text);
    }

    /* ---------------------------------------------------- §03 the papers --- */

    function paintPapers(c) {
      var foot = $('[data-ap-paperfoot]');
      setText(foot, c.req === 3
        ? c.papers + ' of six on file. The three that block publication are done.'
        : 'Publication is blocked until the deed, the permits and the energy certificate '
          + 'are on file.');
      foot.className = 'apend__text' + (c.req === 3 ? '' : ' apend__text--warn');
    }

    /* --------------------------------------------------- §04 the frames --- */

    function paintShots(c) {
      var foot = $('[data-ap-shotfoot]');
      setText(foot, c.must === 4
        ? c.shots + ' of eight shot. The four rooms buyers look for are covered.'
        : (4 - c.must) + ' of the four required rooms still unshot. A file without a kitchen '
          + 'photograph gets half the enquiries.');
      foot.className = 'apend__text' + (c.must === 4 ? '' : ' apend__text--warn');
      $$('[data-ap-shot]').forEach(function (b) {
        b.classList.toggle('apframe--must', b.getAttribute('data-ap-must') === '1'
          && b.getAttribute('aria-pressed') !== 'true');
      });
      $('[data-ap-hatch]').hidden = c.shots > 0;
    }

    /* ----------------------------------------------------- §05 the price --- */

    function paintPrice() {
      var p = price(), a = area(), per = Math.round(p / a), step = priceStep();
      var comps = $$('[data-ap-comp]').map(function (el) { return num(el.textContent); });
      var median = comps.slice().sort(function (x, y) { return x - y; })[2];
      var over = Math.round((per - median) / median * 100);
      var reach = SHAPE.reduce(function (t, n, i) {
        return t + (BAND_BASE + (i + 1) * 25000 >= p ? n : 0);
      }, 0);

      setText($('[data-ap-price]'), eur(p));
      var perEl = $('[data-ap-persqm]');
      setText(perEl, eur(per) + ' / m²');
      perEl.className = 'approw__per'
        + (over > 8 ? ' approw__per--over' : over < -6 ? ' approw__per--under' : '');

      var slider = $('[data-ap-slider]');
      slider.setAttribute('aria-valuetext', eur(p) + ', ' + eur(per) + ' per square metre');

      var reachEl = $('[data-ap-reach]');
      setText(reachEl, reach + ' of ' + TOTAL);
      reachEl.className = 'apreach'
        + (reach >= 60 ? ' apreach--good' : reach >= 35 ? ' apreach--mid' : ' apreach--low');

      $$('[data-ap-band]').forEach(function (b) {
        b.classList.toggle('apband--on', Number(b.getAttribute('data-ap-top')) >= p);
      });
      /* Green when the neighbour got more per square metre than this asks. */
      $$('[data-ap-comp]').forEach(function (el, i) {
        el.classList.toggle('apcomp__per--under', comps[i] <= per);
      });

      var box = $('[data-ap-verdict]');
      var kind = step === 0 ? '' : over > 8 ? 'over' : over < -6 ? 'under' : 'band';
      box.className = 'apverdict' + (kind ? ' apverdict--' + kind : '');
      setText($('[data-ap-verdicttitle]'), step === 0 ? 'No price set yet'
        : kind === 'over' ? 'Above what has actually signed'
          : kind === 'under' ? 'Under the district' : 'In the band');
      setText($('[data-ap-verdictbody]'), step === 0
        ? 'Move the slider. Everything below it — the buyers in range and the four signed '
          + 'prices — moves with it.'
        : kind === 'over'
          ? 'At ' + eur(per) + ' a square metre this asks ' + over + '% more than the median '
            + 'of the four that signed near here. It will get views and no viewings, and you '
            + 'will be having the price conversation in October instead of August.'
          : kind === 'under'
            ? Math.abs(over) + '% under the signed median. It will move quickly, and the '
              + 'owner will ask you afterwards whether it could have gone higher. Have the '
              + 'answer ready.'
            : 'Within ' + Math.abs(over) + '% of what actually signed near here, and ' + reach
              + ' registered buyers can reach it. This is the band where files sell in six '
              + 'weeks rather than six months.');
      return { price: p, per: per, step: step };
    }

    /* ------------------------------------------------------ the preview --- */

    function paintPreview(c, p, score) {
      setText($('[data-ap-prevtitle]'), ($('[data-ap-street]').value || 'New file')
        + ($('[data-ap-floor]').value ? ', ' + $('[data-ap-floor]').value : ''));
      var dist = pressed('[data-ap-district]')[0];
      var kind = pressed('[data-ap-kind]')[0];
      var beds = pressed('[data-ap-beds]')[0];
      setText($('[data-ap-prevmeta]'), (dist ? dist.textContent : '') + ' · '
        + (kind ? kind.textContent : '') + ' · '
        + (beds ? beds.getAttribute('data-ap-beds') : '3') + ' bed · ' + area() + ' m²'
        + (surveyed() ? ' measured' : ' on the deed'));
      setText($('[data-ap-prevprice]'), eur(p.price));
      setText($('[data-ap-prevper]'), eur(p.per) + ' / m²');

      var list = $('[data-ap-prevtags]');
      list.innerHTML = '';
      pressed('[data-ap-feat]').slice(0, 3).forEach(function (t) {
        var li = document.createElement('li');
        li.className = 'aptagchip';
        li.textContent = t.textContent;
        list.appendChild(li);
      });

      var note = $('[data-ap-prevnote]');
      setText(note, p.step === 0 ? 'Price not set'
        : c.shots + ' photographs · ' + c.papers + ' documents');
      note.className = 'apcard__note' + (p.step === 0 ? ' apcard__note--warn' : '');

      var ready = c.req === 3 && score >= 80;
      var badge = $('[data-ap-badge]');
      setText(badge, ready ? 'Ready to publish' : 'Draft');
      badge.className = 'apbadge' + (ready ? ' apbadge--ready' : '');
    }

    /* --------------------------------------------------- the file strength --- */

    function paintScore(c, p) {
      var n = Math.round(c.req / 3 * 30 + (on('survey') ? 14 : 0) + (on('plans') ? 8 : 0)
        + (on('condo') ? 4 : 0) + c.must / 4 * 22 + (c.shots >= 6 ? 6 : 0)
        + (p.step > 0 ? 10 : 0) + (c.feats > 0 ? 6 : 0));
      var band = n >= 80 ? 'ready' : n >= 55 ? 'nearly' : 'started';

      setText($('[data-ap-score]'), String(n));
      var tag = $('[data-ap-tag]');
      setText(tag, band === 'ready' ? 'ready' : band === 'nearly' ? 'publishable' : 'too thin');
      tag.className = 'aptag' + (band === 'started' ? '' : ' aptag--' + band);

      var bar = $('[data-ap-bar]');
      bar.className = 'apbar__fill' + (band === 'started' ? '' : ' apbar__fill--' + band);
      /* The only runtime style on the page: the figure is live and unbounded,
         and its opening value ships as a class so the bar is right with the
         script off. */
      bar.style.width = n + '%';

      setText($('[data-ap-scorenote]'), band === 'ready'
        ? 'This file is stronger than most on the register. Files like this get a third more '
          + 'enquiries in their first fortnight.'
        : band === 'nearly'
          ? 'Publishable, but thin. Every missing document is a question a buyer asks you '
            + 'instead of reading.'
          : 'Not enough here to publish. Three documents and four photographs is the floor, '
            + 'not the target.');

      var todos = [c.req === 3, c.must === 4, surveyed(), p.step > 0];
      var labels = [
        c.req === 3 ? 'Papers on file'
          : (3 - c.req) + ' required document' + (3 - c.req === 1 ? '' : 's') + ' outstanding',
        c.must === 4 ? 'Four rooms photographed'
          : (4 - c.must) + ' room' + (4 - c.must === 1 ? '' : 's') + ' still to photograph',
        surveyed() ? 'Measured survey done' : 'Book the measured survey',
        p.step > 0 ? 'Price agreed with the owner' : 'Set a price against the district'
      ];
      $$('[data-ap-todo]').forEach(function (b, i) {
        b.classList.toggle('aptodo__link--done', todos[i]);
        var box = $('.aptodo__box', b);
        b.textContent = '';
        b.appendChild(box);
        b.appendChild(document.createTextNode(labels[i]));
      });
      var left = todos.filter(function (t) { return !t; }).length;
      setText($('[data-ap-todofoot]'), left === 0
        ? 'Nothing outstanding. Publish it and the matching briefs go out tonight.'
        : left + ' thing' + (left === 1 ? '' : 's') + ' between this file and the register.');
      return { score: n, left: left };
    }

    /* ------------------------------------------------------- the footer --- */

    function paintNav(c, p, left, done) {
      var next = $('[data-ap-next]');
      var i = at();
      if (i === 4) {
        setText(next, c.req === 3 ? 'Publish the file'
          : 'Publish — ' + (3 - c.req) + ' document' + (3 - c.req === 1 ? '' : 's')
            + ' missing');
        next.classList.toggle('apnext--blocked', c.req !== 3);
        setText($('[data-ap-navnote]'), c.req < 3
          ? 'Blocked until the required documents are on file.'
          : left === 0 ? 'Everything is in place.'
            : left + ' thing' + (left === 1 ? '' : 's') + ' still outstanding.');
      } else {
        setText(next, 'Next');
        next.classList.remove('apnext--blocked');
        setText($('[data-ap-navnote]'),
          done[i] ? 'This step is done.' : 'You can come back to this.');
      }
    }

    function repaint() {
      paintGap();
      var c = counts();
      paintPapers(c);
      paintShots(c);
      var p = paintPrice();
      var s = paintScore(c, p);
      paintPreview(c, p, s.score);

      var done = [true, surveyed() && measuredArea() > 0, c.req === 3, c.must === 4,
        p.step > 0];
      $$('[data-ap-tick]').forEach(function (t, i) {
        t.classList.toggle('aptick--done', done[i]);
        setText($('.sr-only', t), done[i] ? 'done' : 'not done');
      });
      paintNav(c, p, s.left, done);
    }

    /* --------------------------------------------------------- the steps --- */

    function go(i) {
      var cells = $$('[data-ap-step]');
      cells.forEach(function (b, n) {
        b.setAttribute('aria-selected', n === i ? 'true' : 'false');
      });
      $$('.apstepbox').forEach(function (p, n) { p.hidden = n !== i; });
      setText($('[data-ap-stepnum]'), cells[i].querySelector('.apstep__num').textContent);
      setText($('[data-ap-steptitle]'),
        cells[i].querySelector('.apstep__label').textContent);
      setText($('[data-ap-stepmeta]'), i === 1 && surveyed()
        ? 'the measured figure matters most' : cells[i].getAttribute('data-ap-meta'));
      var back = $('[data-ap-back]');
      setText(back, i === 0 ? 'Cancel' : 'Back');
      back.classList.toggle('apghost--back', i > 0);
      $('[data-ap-next]').setAttribute('data-ap-at', String(i));
      repaint();
    }

    $$('[data-ap-step]').forEach(function (btn, i) {
      btn.addEventListener('click', function () { go(i); });
    });
    $$('[data-ap-todo]').forEach(function (btn) {
      btn.addEventListener('click', function () { go(Number(btn.getAttribute('data-ap-todo'))); });
    });
    $('[data-ap-back]').addEventListener('click', function () { go(Math.max(0, at() - 1)); });
    $('[data-ap-next]').addEventListener('click', function () {
      if (at() < 4) { go(at() + 1); }
    });

    /* -------------------------------------------------------- the inputs --- */

    ['[data-ap-street]', '[data-ap-floor]', '[data-ap-measured]'].forEach(function (sel) {
      var el = $(sel);
      if (el) { el.addEventListener('input', repaint); }
    });
    $('[data-ap-slider]').addEventListener('input', repaint);

    [['[data-ap-district]', true], ['[data-ap-kind]', true], ['[data-ap-term]', true],
     ['[data-ap-beds]', true], ['[data-ap-baths]', true],
     ['[data-ap-feat]', false]].forEach(function (pair) {
      var sel = pair[0], single = pair[1];
      $$(sel).forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (single) {
            $$(sel).forEach(function (b) {
              var picked = b === btn;
              b.classList.toggle('is-on', picked);
              b.setAttribute('aria-pressed', picked ? 'true' : 'false');
            });
          } else {
            var lit = btn.getAttribute('aria-pressed') !== 'true';
            btn.classList.toggle('is-on', lit);
            btn.setAttribute('aria-pressed', lit ? 'true' : 'false');
            var n = pressed('[data-ap-feat]').length;
            setText($('[data-ap-featcount]'), n === 0
              ? 'Nothing chosen. The file will read like every other flat in the district.'
              : n + ' of eight. These are what the search filters actually match on.');
          }
          repaint();
        });
      });
    });

    $$('[data-ap-paper]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var lit = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', lit ? 'true' : 'false');
        var row = btn.closest('.appaper');
        if (row) {
          row.classList.toggle('appaper--on', lit);
          setText($('.appaper__dot', row), lit ? '✓' : '!');
        }
        setText(btn, lit ? 'On file' : 'Upload');
        /* Booking the survey rewrites step 02's line under the rule. */
        if (at() === 1) {
          setText($('[data-ap-stepmeta]'), surveyed()
            ? 'the measured figure matters most'
            : 'the survey unlocks the measured figure');
        }
        repaint();
      });
    });

    $$('[data-ap-shot]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.setAttribute('aria-pressed',
          btn.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        repaint();
      });
    });

    /* ------------------------------------------------------ the channels --- */

    function paintChannels() {
      /* The register is always one of them, and it is not a button. */
      var n = 1 + pressed('[data-ap-chan]').length;
      setText($('[data-ap-channote]'), n + ' of four');
    }

    $$('[data-ap-chan]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.setAttribute('aria-pressed',
          btn.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        paintChannels();
      });
    });

    repaint();
  }());


  /* ==========================================================================
     9aw. Viewings — the day as a round trip
     -----------------------------------------------------------------------------
     Nothing here creates content. All seven rounds are printed with their
     stops and their legs already computed, every viewing's `who` column and
     prep list with it, and all three objection sets. Switching a day or a
     stop is a `hidden` flip. With the script off the page reads Thursday end
     to end, tight leg and all.

     THE LEGS ARE NEVER TOUCHED HERE
     -------------------------------
     Their words, colour and tint come out of the builder, which derives them
     from `free < need` over the two stops around each one. If this block
     could rewrite a leg, a leg could be wrong — and the section is only worth
     having because it cannot be.

     EVERY COUNT IS DERIVED, AND EVERY ONE HAS A SINGULAR BRANCH
     -----------------------------------------------------------
     Owners waiting on feedback, requests without a time, things still in the
     bag. `1 owners` shipped once on the buyer's desk; the branches are here
     so it cannot happen again.
     ========================================================================== */

  (function agentViewings() {
    var page = $('.vwround');
    if (!page) { return; }

    function day() {
      var on = $$('[data-vw-day]').filter(function (b) { return b.classList.contains('is-on'); });
      return on[0] || $$('[data-vw-day]')[0];
    }
    function pressed(sel) {
      return $$(sel).filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; });
    }
    function currentStop() {
      var open = $('[data-vw-who]:not([hidden])');
      return open ? open.getAttribute('data-vw-who') : '';
    }

    /* ------------------------------------------------------------ the rail --- */

    function paintOwed() {
      var fb = $$('[data-vw-send]').filter(function (b) {
        return b.getAttribute('aria-pressed') !== 'true';
      }).length;
      var req = $$('[data-vw-confirm]').filter(function (b) {
        return b.getAttribute('aria-pressed') !== 'true';
      }).length;
      var id = currentStop();
      var bag = $$('[data-vw-prep^="' + id + ':"]');
      var left = bag.length - bag.filter(function (b) {
        return b.getAttribute('aria-pressed') === 'true';
      }).length;

      var labels = [
        fb === 0 ? 'Every owner has heard back'
          : fb + ' owner' + (fb === 1 ? '' : 's') + ' waiting on feedback',
        req === 0 ? 'No requests outstanding'
          : req + ' request' + (req === 1 ? '' : 's') + ' without a time',
        left === 0 && bag.length ? 'Bag packed for the next one'
          : left + ' thing' + (left === 1 ? '' : 's') + ' to take with you'
      ];
      var done = [fb === 0, req === 0, bag.length > 0 && left === 0];

      $$('[data-vw-owed]').forEach(function (b, i) {
        b.classList.toggle('vwowed__link--done', done[i]);
        var box = $('.vwowed__box', b);
        b.textContent = '';
        b.appendChild(box);
        b.appendChild(document.createTextNode(labels[i]));
      });
      setText($('[data-vw-owedfoot]'), done.every(Boolean)
        ? 'Nothing hanging. Rare — enjoy it.'
        : 'Feedback is the one thing owners judge you on that costs nothing.');

      /* The bag's own counter, and §02 and §03's header notes. */
      var count = $('[data-vw-bagcount="' + id + '"]');
      if (count) {
        setText(count, (bag.length - left) + ' of ' + bag.length);
        count.className = 'vwbag__count' + (left === 0 && bag.length ? ' vwbag__count--done' : '');
      }
      var rh = $('[data-vw-reqnotehead]');
      setText(rh, req === 0 ? 'all answered' : req + ' without a time');
      rh.className = 'aghr__note' + (req === 0 ? ' aghr__note--good' : ' aghr__note--warn');
      setText($('[data-vw-reqfoot]'), req === 0
        ? 'Nothing outstanding. Every buyer who asked has a time in the diary.'
        : 'Buyers who wait more than a day for a time book with someone else instead.');

      var fh = $('[data-vw-fbnote]');
      setText(fh, fb === 0 ? 'all sent' : fb + ' owed');
      fh.className = 'aghr__note' + (fb === 0 ? ' aghr__note--good' : ' aghr__note--warn');
      setText($('[data-vw-fbfoot]'), fb === 0
        ? 'Every owner has heard how their viewing went. That is why they renew.'
        : 'Two of these are two days old. Owners do not mind bad news; they mind hearing '
          + 'nothing.');
    }

    function paintClock() {
      var d = day();
      var tight = Number(d.getAttribute('data-vw-tight'));
      var stops = Number(d.getAttribute('data-vw-stops'));
      var box = $('[data-vw-clock]');
      box.className = 'vwclock' + (tight ? ' vwclock--tight' : '');
      var tag = $('[data-vw-clocktag]');
      setText(tag, tight ? tight + ' tight' : stops ? 'workable' : 'free');
      tag.className = 'vwtag' + (tight ? ' vwtag--tight' : '');
      setText($('[data-vw-clockspan]'), d.getAttribute('data-vw-span'));

      var rows = $$('.vwclock__value', $('[data-vw-clockrows]'));
      setText(rows[0], String(stops));
      setText(rows[1], d.getAttribute('data-vw-road'));
      setText(rows[2], d.getAttribute('data-vw-hop'));

      setText($('[data-vw-clocknote]'), tight
        ? 'One leg does not fit. Move it now, or tell them you will be twenty minutes late — '
          + 'the second is worse than the first.'
        : stops
          ? 'The day holds together. Every gap is longer than the drive between the two '
            + 'addresses.'
          : 'Nothing booked. Use it to chase the two owners waiting on feedback.');

      var note = $('[data-vw-daynote]');
      setText(note, stops === 0 ? 'nothing booked'
        : stops + ' stop' + (stops === 1 ? '' : 's') + ' · '
          + (tight ? tight + ' leg will not fit' : 'the day fits'));
      note.className = 'aghr__note' + (tight ? ' aghr__note--warn' : '');
    }

    /* ------------------------------------------------------- day and stop --- */

    function selectStop(id) {
      $$('[data-vw-stop]').forEach(function (b) {
        b.classList.toggle('is-on', b.getAttribute('data-vw-stop') === id);
      });
      $$('[data-vw-who]').forEach(function (c) {
        c.hidden = c.getAttribute('data-vw-who') !== id;
      });
      paintOwed();
    }

    function selectDay(i) {
      $$('[data-vw-day]').forEach(function (b, n) {
        b.classList.toggle('is-on', n === i);
        b.setAttribute('aria-pressed', n === i ? 'true' : 'false');
      });
      $$('[data-vw-round]').forEach(function (c) {
        c.hidden = Number(c.getAttribute('data-vw-round')) !== i;
      });
      /* A day change resets the selection to that day's first stop; an empty
         day leaves the right column on whatever it held, because there is
         nothing to put there. */
      var first = $$('[data-vw-day]')[i].getAttribute('data-vw-first');
      if (first) { selectStop(first); } else { paintOwed(); }
      paintClock();
    }

    $$('[data-vw-day]').forEach(function (btn, i) {
      btn.addEventListener('click', function () { selectDay(i); });
    });
    $$('[data-vw-stop]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectStop(btn.getAttribute('data-vw-stop'));
      });
    });

    /* ----------------------------------------------------------- the bag --- */

    $$('[data-vw-prep]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.setAttribute('aria-pressed',
          btn.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        paintOwed();
      });
    });

    /* ------------------------------------------------------- §02 the slots --- */

    function paintRequest(id) {
      var chosen = pressed('[data-vw-slot][data-vw-req="' + id + '"]')[0];
      var btn = $('[data-vw-confirm="' + id + '"]');
      var booked = btn.getAttribute('aria-pressed') === 'true';
      var row = $('[data-vw-reqrow="' + id + '"]');
      var age = $('[data-vw-reqage="' + id + '"]');
      var note = $('[data-vw-reqnote="' + id + '"]');
      var late = row.getAttribute('data-vw-late') === '1';

      setText(btn, booked ? 'Confirmed' : chosen ? 'Confirm it' : 'Pick a time');
      btn.className = 'vwconfirm'
        + (booked ? ' vwconfirm--done' : chosen ? ' vwconfirm--ready' : '');
      row.className = 'vwreq' + (booked ? ' vwreq--done' : late ? ' vwreq--late' : '');
      setText(age, booked ? 'Confirmed' : age.getAttribute('data-vw-ageraw'));
      age.className = 'vwreq__age'
        + (booked ? ' vwreq__age--done' : late ? ' vwreq__age--late' : '');
      setText(note, booked ? 'Confirmed for ' + chosen.textContent + '. They have been told.'
        : chosen ? 'Ready to confirm ' + chosen.textContent + '.'
          : note.getAttribute('data-vw-noteraw'));
      note.className = 'vwreq__note'
        + (booked ? ' vwreq__note--done' : late ? ' vwreq__note--late' : '');
    }

    $$('[data-vw-slot]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-vw-req');
        var on = btn.getAttribute('aria-pressed') !== 'true';
        /* One slot per request, and clicking the chosen one clears it. */
        $$('[data-vw-slot][data-vw-req="' + id + '"]').forEach(function (b) {
          var lit = b === btn && on;
          b.classList.toggle('is-on', lit);
          b.setAttribute('aria-pressed', lit ? 'true' : 'false');
        });
        paintRequest(id);
      });
    });

    $$('[data-vw-confirm]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-vw-confirm');
        if (!pressed('[data-vw-slot][data-vw-req="' + id + '"]').length) { return; }
        btn.setAttribute('aria-pressed',
          btn.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        paintRequest(id);
        paintOwed();
      });
    });

    /* ---------------------------------------------------- §03 the verdicts --- */

    var VERDICTS = ['Not for them', 'Lukewarm', 'Interested', 'Keen', 'Offering'];

    function paintFeedback(id) {
      var chosen = pressed('[data-vw-rate^="' + id + ':"]')[0];
      var n = chosen ? Number(chosen.getAttribute('data-vw-rate').split(':')[1]) : -1;
      var btn = $('[data-vw-send="' + id + '"]');
      var sent = btn.getAttribute('aria-pressed') === 'true';
      var row = $('[data-vw-fbrow="' + id + '"]');
      var when = $('[data-vw-fbwhen="' + id + '"]');
      var owner = $('[data-vw-fbowner="' + id + '"]');
      var verdict = $('[data-vw-verdict="' + id + '"]');
      var late = row.getAttribute('data-vw-late') === '1';

      setText(verdict, n >= 0 ? VERDICTS[n] : 'How did it go?');
      verdict.className = 'vwverdict' + (n < 0 ? ''
        : n >= 3 ? ' vwverdict--good' : n === 0 ? ' vwverdict--warn' : ' vwverdict--accent');
      setText(btn, sent ? 'Sent' : n >= 0 ? 'Send to owner' : 'Rate it first');
      btn.className = 'vwconfirm' + (sent ? ' vwconfirm--done' : n >= 0 ? ' vwconfirm--ready' : '');
      row.className = 'vwfb' + (sent ? ' vwfb--done' : late ? ' vwfb--late' : '');
      setText(when, sent ? 'sent' : when.getAttribute('data-vw-whenraw'));
      setText(owner, sent ? 'Sent to the owner just now'
        : owner.getAttribute('data-vw-ownerraw'));
    }

    $$('[data-vw-rate]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var parts = btn.getAttribute('data-vw-rate').split(':');
        var on = btn.getAttribute('aria-pressed') !== 'true';
        $$('[data-vw-rate^="' + parts[0] + ':"]').forEach(function (b) {
          var lit = b === btn && on;
          b.classList.toggle('is-on', lit);
          b.setAttribute('aria-pressed', lit ? 'true' : 'false');
        });
        paintFeedback(parts[0]);
      });
    });

    $$('[data-vw-send]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-vw-send');
        if (!pressed('[data-vw-rate^="' + id + ':"]').length) { return; }
        btn.setAttribute('aria-pressed',
          btn.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        paintFeedback(id);
        paintOwed();
      });
    });

    /* -------------------------------------------------- §04 the objections --- */

    var PER = { all: ['8.2', 'Your average across the desk. Two better than the Lisbon '
        + 'figure, and it is the second viewings that do it.'],
      rosa: ['—', 'Three viewings in sixty-eight days and no offer. There is not enough '
        + 'traffic here to average anything.'],
      maria: ['9.0', 'Nine viewings for one offer, and that offer came from a buyer who has '
        + 'to sell first.'] };

    function readObjection(row) {
      $$('[data-vw-obj]').forEach(function (b) { b.classList.remove('is-on'); });
      row.classList.add('is-on');
      setText($('[data-vw-objtitle]'), row.getAttribute('data-vw-rowtitle'));
      setText($('[data-vw-objbody]'), row.getAttribute('data-vw-rowbody'));
    }

    $$('[data-vw-obj]').forEach(function (row) {
      row.addEventListener('mouseenter', function () { readObjection(row); });
      row.addEventListener('focus', function () { readObjection(row); });
      row.addEventListener('click', function () { readObjection(row); });
    });

    $$('[data-vw-objtab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-vw-objtab');
        $$('[data-vw-objtab]').forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        $$('[data-vw-objset]').forEach(function (ul) {
          ul.hidden = ul.getAttribute('data-vw-objset') !== id;
        });
        /* The set is re-ranked by the builder, so the top row of the new tab
           is the new headline. */
        var first = $('[data-vw-objset="' + id + '"] [data-vw-obj]');
        if (first) { readObjection(first); }
        var total = $$('[data-vw-objset="' + id + '"] .vwobjrow__n')
          .reduce(function (t, el) { return t + Number(el.textContent); }, 0);
        setText($('[data-vw-objnote]'), total + ' reasons given, last thirty days');
        setText($('[data-vw-per]'), PER[id][0]);
        setText($('[data-vw-pernote]'), PER[id][1]);
      });
    });

    /* The rail's three items jump to the section that clears them. */
    $$('[data-vw-owed]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var where = btn.getAttribute('data-vw-owed');
        var target = where === 'fb' ? $('[data-vw-fbnote]')
          : where === 'req' ? $('[data-vw-reqnotehead]') : $('.vwbag');
        if (target) { target.scrollIntoView({ block: 'center' }); }
      });
    });

    paintOwed();
  }());


  /* ==========================================================================
     9ax. Offers — what each one is worth once its conditions are counted
     -----------------------------------------------------------------------------
     Nothing here creates content. All five offers are printed in full — the
     picker row, the negotiation ladder with every round, the strength panel
     with its five factors and their evidence, and the verdict — with four of
     each hidden. Selecting an offer is a `hidden` flip, so no ladder and no
     score can be assembled wrong, and with the script off the page reads
     Vogel's cash offer end to end.

     THE SCORES ARE NOT RECOMPUTED HERE
     ----------------------------------
     Strength and net come out of the builder, which derives both from the
     factors. If this block could recompute them, the panel and the comparison
     table could disagree — and §02's whole job is to be unarguable.

     WHAT THIS BLOCK DOES OWN
     ------------------------
     The selection, the filter, which ladder round is being read, which
     fall-through cause is being read, and the two session actions. Each of
     those is a `hidden` flip, a class swap or a count with a singular branch.
     ========================================================================== */

  (function agentOffers() {
    var page = $('.oftrip');
    if (!page) { return; }

    function pressed(sel) {
      return $$(sel).filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; });
    }

    /* ---------------------------------------------------- choosing an offer --- */

    function select(i) {
      $$('[data-of-pick]').forEach(function (b, n) { b.classList.toggle('is-on', n === i); });
      $$('[data-of-row]').forEach(function (b) {
        b.classList.toggle('is-on', Number(b.getAttribute('data-of-row')) === i);
      });
      $$('[data-of-ladder]').forEach(function (c, n) { c.hidden = n !== i; });
      $$('[data-of-strength]').forEach(function (c, n) { c.hidden = n !== i; });
    }

    $$('[data-of-pick]').forEach(function (btn, i) {
      btn.addEventListener('click', function () { select(i); });
    });
    $$('[data-of-row]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        select(Number(btn.getAttribute('data-of-row')));
      });
    });
    $$('[data-of-clock]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        select(Number(btn.getAttribute('data-of-clock')));
      });
    });

    /* ------------------------------------------------------- §01 the ladder --- */

    $$('[data-of-ladder]').forEach(function (col) {
      var rounds = $$('[data-of-round]', col);
      var note = $('[data-of-note]', col);
      rounds.forEach(function (btn) {
        function read() {
          rounds.forEach(function (b) { b.classList.toggle('is-on', b === btn); });
          setText(note, btn.getAttribute('data-of-roundnote'));
        }
        btn.addEventListener('mouseenter', read);
        btn.addEventListener('focus', read);
        btn.addEventListener('click', read);
      });
    });

    /* ------------------------------------------------------- §01 the action --- */

    $$('[data-of-act]').forEach(function (btn) {
      var resting = btn.textContent;
      btn.addEventListener('click', function () {
        var done = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', done ? 'true' : 'false');
        setText(btn, done ? 'Done' : resting);
      });
    });

    /* --------------------------------------------------------- §03 the filter --- */

    function filter(id) {
      var shown = 0;
      $$('[data-of-row]').forEach(function (row) {
        var stage = row.getAttribute('data-of-stage');
        var score = Number(row.getAttribute('data-of-score'));
        var on = id === 'all' ? true
          : id === 'decide' ? (stage === 'Owner deciding' || stage === 'Offer made')
            : id === 'risk' ? score < 60
              : (stage === 'Survey booked' || stage === 'Deed drafted');
        row.parentNode.hidden = !on;
        row.classList.remove('ofrow--last');
        if (on) { shown += 1; }
      });
      var left = $$('[data-of-row]').filter(function (r) { return !r.parentNode.hidden; });
      if (left.length) { left[left.length - 1].classList.add('ofrow--last'); }

      $$('[data-of-tab]').forEach(function (b) {
        var on = b.getAttribute('data-of-tab') === id;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      setText($('[data-of-shown]'), shown + ' of ' + $$('[data-of-row]').length + ' shown');
      $('[data-of-empty]').hidden = shown > 0;
    }

    $$('[data-of-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () { filter(btn.getAttribute('data-of-tab')); });
    });

    /* ---------------------------------------------------- §04 the fall-throughs --- */

    $$('[data-of-death]').forEach(function (btn) {
      function read() {
        $$('[data-of-death]').forEach(function (b) { b.classList.toggle('is-on', b === btn); });
        var says = $('[data-of-deathsays]');
        setText(says, btn.getAttribute('data-of-deathnote'));
        /* The box borrows the warn border only for the two causes that are
           the agent's to prevent. */
        says.classList.toggle('ofdeath__says--warn',
          Number(btn.getAttribute('data-of-death')) < 2);
      }
      btn.addEventListener('mouseenter', read);
      btn.addEventListener('focus', read);
      btn.addEventListener('click', read);
    });

    /* --------------------------------------------------------- §05 the owners --- */

    function ownerFoot() {
      var owed = $$('[data-of-nudge]').filter(function (b) {
        return b.classList.contains('ofnudge--due')
          && b.getAttribute('aria-pressed') !== 'true';
      }).length;
      var note = $('[data-of-ownernote]');
      setText(note, owed === 0 ? 'all answered'
        : owed === 1 ? 'one waiting too long' : owed + ' waiting too long');
      note.className = 'aghr__note' + (owed === 0 ? ' aghr__note--good' : ' aghr__note--warn');
      setText($('[data-of-ownerfoot]'), owed === 0
        ? 'Nobody is waiting on you. An owner who hears nothing assumes the worst and starts '
          + 'ringing other agents.'
        : 'An owner sitting on an offer with no word from you is the most common way an '
          + 'instruction is lost. Call, even when there is nothing new.');
    }

    $$('[data-of-nudge]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-of-nudge');
        var called = btn.getAttribute('aria-pressed') !== 'true';
        var wait = $('[data-of-wait="' + id + '"]');
        var unit = $('[data-of-waitunit="' + id + '"]');
        var row = $('[data-of-ownerrow="' + id + '"]');
        var late = btn.getAttribute('data-of-late') === '1';
        var raw = wait.getAttribute('data-of-waitraw');
        var days = Number(raw);

        btn.setAttribute('aria-pressed', called ? 'true' : 'false');
        setText(btn, called ? 'Called' : 'Call now');
        btn.className = 'ofnudge'
          + (called ? ' ofnudge--done' : days >= 3 ? ' ofnudge--due' : '');
        setText(wait, called ? '0' : raw);
        wait.className = 'ofwait'
          + (called ? ' ofwait--done' : days >= 5 ? ' ofwait--warn'
            : days >= 3 ? ' ofwait--accent' : '');
        setText(unit, called ? 'just called' : days === 1 ? 'day waiting' : 'days waiting');
        row.className = 'ofowner' + (called ? ' ofowner--done' : late ? ' ofowner--late' : '');
        ownerFoot();
      });
    });
  }());

  /* ==========================================================================
     9ay. Enquiries — the unanswered queue, and what the silence costs
     -----------------------------------------------------------------------------
     Nothing here creates content. All six enquiries are printed in full — the
     queue row, the whole answer pane with its message, its facts, its
     documents and its openers — with five of each hidden, and the six
     just-answered log rows are printed hidden at the top of §04. Selecting an
     enquiry is a `hidden` flip and sending a reply is another, so no answer
     can be assembled against the wrong buyer and, with the script off, the
     page reads Paul Brandt's enquiry end to end.

     SIX READERS, ONE COUNT
     ----------------------
     The rail badge, the `h1`, the first stat tile, the §01 header, the filter
     chips and the rail's age buckets all report the number of unanswered
     enquiries. `refresh()` recomputes every one of them from the DOM after
     every send rather than decrementing them one at a time — six counters
     stepped separately is exactly how a rail ends up saying 6 next to a queue
     showing 5.

     FILTERING NEVER CHANGES A COUNT
     -------------------------------
     The chips count the whole queue, not the filtered view, and a filter that
     hides the open enquiry falls through to the first row still visible — the
     middle column is never left empty while rows remain.
     ========================================================================== */

  (function agentEnquiries() {
    var desk = $('.eqdesk');
    if (!desk) { return; }

    var WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
      'Eight', 'Nine', 'Ten'];
    var TONES = ['good', 'accent', 'warn'];

    var items = $$('[data-eq-item]');
    var panes = $$('[data-eq-pane]');
    var chips = $$('[data-eq-filter]');
    var buckets = $$('[data-eq-bucket]');
    var logBox = $('[data-eq-converted]');
    var empty = $('[data-eq-empty]');
    var sent = {};
    var filter = 'all';
    var pick = panes.length ? panes[0].getAttribute('data-eq-pane') : '';

    function tone(el, base, name) {
      TONES.forEach(function (t) { el.classList.toggle(base + '--' + t, t === name); });
    }

    function width(el, pct) {
      el.className = el.className.replace(/\s*eqw--\d+/g, '') + ' eqw--' + pct;
    }

    function hoursOf(li) { return Number(li.getAttribute('data-eq-hours')); }

    function matches(li, id) {
      if (id === 'late') { return hoursOf(li) >= 24; }
      if (id === 'ready') {
        var r = li.getAttribute('data-eq-ready');
        return r === 'Pre-approved' || r === 'Cash';
      }
      if (id === 'new') { return li.getAttribute('data-eq-first') === '1'; }
      return true;
    }

    function live() {
      return items.filter(function (li) { return !sent[li.getAttribute('data-eq-item')]; });
    }

    /* ------------------------------------------------- the six who count --- */

    function refresh() {
      var waiting = live();
      var late = waiting.filter(function (li) { return hoursOf(li) >= 24; }).length;
      var n = waiting.length;
      var anySent = Object.keys(sent).length > 0;

      var badge = $('.agnav__link.is-on .agnav__badge');
      setText(badge, String(n));

      setText($('[data-eq-h1lead]'), n === 0 ? 'Nobody is waiting.'
        : n === 1 ? 'One person wrote.' : WORDS[n] + ' people wrote.');
      setText($('[data-eq-h1late]'), n === 0 ? 'The queue is empty.'
        : late === 0 ? 'None of them are late.'
          : late === 1 ? 'One is nearly gone.' : WORDS[late] + ' are nearly gone.');

      setText($('[data-eq-waiting]'), String(n));
      var overdue = $('[data-eq-overdue]');
      setText(overdue, late + ' overdue');
      if (overdue) {
        overdue.classList.toggle('agstat__delta--warn', late > 0);
        overdue.classList.toggle('agstat__delta--good', late === 0);
      }

      var qnote = $('[data-eq-queuenote]');
      setText(qnote, late === 0 ? 'nothing overdue'
        : late + ' past the day you promise');
      if (qnote) {
        qnote.classList.toggle('aghr__note--warn', late > 0);
        qnote.classList.toggle('aghr__note--good', late === 0);
      }

      chips.forEach(function (btn) {
        var id = btn.getAttribute('data-eq-filter');
        setText($('[data-eq-chip="' + id + '"]'), String(
          waiting.filter(function (li) { return matches(li, id); }).length));
      });

      var counts = [
        waiting.filter(function (li) { return hoursOf(li) < 1; }).length,
        waiting.filter(function (li) { return hoursOf(li) >= 1 && hoursOf(li) < 6; }).length,
        waiting.filter(function (li) { return hoursOf(li) >= 6 && hoursOf(li) < 24; }).length,
        late
      ];
      var peak = Math.max(1, Math.max.apply(null, counts));
      buckets.forEach(function (li, i) {
        setText($('[data-eq-bucketn]', li), String(counts[i]));
        $('[data-eq-bucketlabel]', li).classList.toggle('eqbucket__label--off', counts[i] === 0);
        width($('[data-eq-bucketfill]', li), Math.round(counts[i] / peak * 100));
      });
      setText($('[data-eq-bucketnote]'), late === 0
        ? 'Nothing has been waiting longer than the day you promise.'
        : (late === 1 ? 'One enquiry has' : late + ' enquiries have')
          + ' been waiting longer than the day you promise.');
      setText($('[data-ag-clocknote]'), late === 0
        ? 'Desk target is sixty minutes and nothing is overdue. This is what a good week looks like.'
        : 'Desk target is sixty minutes. The median is fine — it is the ' + late
          + ' sitting past a day that will break it.');

      if (empty) {
        setText(empty, anySent
          ? 'Everything in this filter has been answered. The reply clock in the sidebar is the only thing left to watch.'
          : 'Nothing here today. Try another filter.');
      }

      if (logBox) {
        var shown = $$('.eqlog tbody tr').filter(function (tr) { return !tr.hidden; }).length;
        var converted = Number(logBox.getAttribute('data-eq-converted'));
        var stalled = Number(logBox.getAttribute('data-eq-stalled'));
        var fast = Number(logBox.getAttribute('data-eq-fast'));
        setText($('[data-eq-lognote]'), shown + ' answered · one lost to a slow reply');
        setText($('[data-eq-logfoot]'), converted + ' of ' + shown
          + ' turned into a viewing or an offer, and every one of those was answered '
          + 'inside the hour. Of the ' + stalled + ' that went nowhere, '
          + (fast === 0 ? 'none were answered quickly — speed was the problem.'
            : fast === 1 ? 'one was answered quickly and simply was not a buyer.'
              : fast + ' were answered quickly and simply were not buyers.'));
      }
    }

    /* ------------------------------------------------ choosing an enquiry --- */

    function select(id) {
      pick = id;
      panes.forEach(function (p) { p.hidden = p.getAttribute('data-eq-pane') !== id; });
      $$('[data-eq-pick]').forEach(function (b) {
        b.classList.toggle('is-on', b.getAttribute('data-eq-pick') === id);
      });
    }

    $$('[data-eq-pick]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        select(btn.getAttribute('data-eq-pick'));
      });
    });

    /* -------------------------------------------------------- the filters --- */

    /* The filter moves the list and nothing else. An enquiry that falls out of
       the current filter stays open on the right — a half-written reply is not
       something a chip should be able to throw away — and the middle column is
       never empty because the open pane outlives the row that opened it. */
    function apply() {
      var visible = 0;
      items.forEach(function (li) {
        var id = li.getAttribute('data-eq-item');
        var on = !sent[id] && matches(li, filter);
        li.hidden = !on;
        if (on) { visible += 1; }
      });
      if (empty) { empty.hidden = visible > 0; }
    }

    chips.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filter = btn.getAttribute('data-eq-filter');
        chips.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        apply();
      });
    });

    /* --------------------------------------- the answer that is on the file --- */

    panes.forEach(function (pane) {
      var id = pane.getAttribute('data-eq-pane');
      var docs = $$('[data-eq-doc]', pane);
      var note = $('[data-eq-attachnote]', pane);
      var label = $('[data-eq-sendtext]', pane);
      var send = $('[data-eq-send]', pane);
      var field = $('.eqcompose__field', pane);
      var foot = $('[data-eq-foot]', pane);
      var footRow = $('.eqfoot', pane);
      var quicks = $$('[data-eq-quick]', pane);

      function attached() {
        return docs.filter(function (d) { return d.classList.contains('is-on'); }).length;
      }

      function countDocs() {
        var n = attached();
        setText(note, n === 0 ? 'nothing attached yet'
          : n === 1 ? 'one file will go with the reply'
            : n + ' files will go with the reply');
        if (note) { note.classList.toggle('eqdocs__note--on', n > 0); }
        if (!sent[id]) { setText(label, n > 0 ? 'Send with ' + n : 'Send'); }
      }

      docs.forEach(function (doc) {
        doc.addEventListener('click', function () {
          var on = !doc.classList.contains('is-on');
          doc.classList.toggle('is-on', on);
          doc.setAttribute('aria-pressed', on ? 'true' : 'false');
          setText($('.eqdoc__box', doc), on ? '✓' : '');
          countDocs();
        });
      });

      quicks.forEach(function (q) {
        q.addEventListener('click', function () {
          var on = !q.classList.contains('is-on');
          quicks.forEach(function (other) {
            other.classList.toggle('is-on', other === q && on);
            other.setAttribute('aria-pressed', other === q && on ? 'true' : 'false');
          });
          if (field) {
            field.placeholder = on ? q.textContent : field.getAttribute('data-eq-resting');
          }
        });
      });

      if (send) {
        send.addEventListener('click', function () {
          if (sent[id]) { return; }
          sent[id] = true;
          send.classList.add('eqsend--sent');
          setText(label, 'Sent');
          /* The enquiry does not vanish: it leaves the queue and reappears in
             the log at the foot of the page, which is the whole boundary
             between this screen and Messages. */
          var row = $('[data-eq-logrow="' + id + '"]');
          if (row) { row.hidden = false; }
          if (footRow) { footRow.classList.remove('eqfoot--warn'); }
          setText(foot, 'Answered just now. It has left the queue and is in the log '
            + 'at the foot of this page.');
          apply();
          refresh();
        });
      }

      countDocs();
    });

    /* ------------------------------------------------------- §02 the decay --- */

    var bars = $$('[data-eq-bar]');
    var bands = $$('[data-eq-bandlabel]');
    var mine = bars.filter(function (b) { return $('.eqbar__mine', b); })[0];
    var value = $('[data-eq-decayvalue]');
    var when = $('[data-eq-decaywhen]');
    var decayNote = $('[data-eq-decaynote]');

    function readBand(btn) {
      var i = Number(btn.getAttribute('data-eq-bar'));
      var rate = Number(btn.getAttribute('data-eq-rate'));
      bars.forEach(function (b) { b.classList.toggle('is-on', b === btn); });
      bands.forEach(function (l) {
        l.classList.toggle('eqband--on', Number(l.getAttribute('data-eq-bandlabel')) === i);
      });
      setText(value, rate + '%');
      tone(value, 'eqdecay__value', rate >= 27 ? 'good' : rate >= 15 ? 'accent' : 'warn');
      setText(when, btn.getAttribute('data-eq-when'));
      setText(decayNote, btn.getAttribute('data-eq-bandnote'));
    }

    bars.forEach(function (btn) {
      btn.addEventListener('mouseenter', function () { readBand(btn); });
      btn.addEventListener('focus', function () { readBand(btn); });
      btn.addEventListener('click', function () { readBand(btn); });
    });

    /* Leaving the chart returns it to the agent's own band, not to nothing:
       the resting state of this panel is a statement about them. */
    var chart = $('.eqbars');
    if (chart && mine) {
      chart.addEventListener('mouseleave', function () {
        readBand(mine);
        bars.forEach(function (b) { b.classList.remove('is-on'); });
      });
    }

    /* ----------------------------------------------------- §03 the sources --- */

    $$('[data-eq-source]').forEach(function (row) {
      var cells = $$('th, td', row);
      function light() {
        $$('[data-eq-source]').forEach(function (r) { r.classList.toggle('is-on', r === row); });
      }
      row.addEventListener('mouseenter', light);
      cells.forEach(function (c) { c.addEventListener('focus', light, true); });
    });

    var srcTable = $('.eqsrc tbody');
    if (srcTable) {
      srcTable.addEventListener('mouseleave', function () {
        $$('[data-eq-source]').forEach(function (r) { r.classList.remove('is-on'); });
      });
    }

    apply();
    refresh();
  }());

  /* ==========================================================================
     9az. Messages — whose move is it
     -----------------------------------------------------------------------------
     Nothing here creates content. All eight threads are printed in full — the
     list row, the whole conversation with its day dividers, promises and
     document chips, the composer with its saved lines, and the file card with
     its photograph, stage bar and agreed facts — with seven of each hidden.
     Opening a thread flips `hidden` on two panes, so no conversation can be
     shown against the wrong file, and with the script off the page reads
     Marta Silveira's thread end to end.

     COURT IS READ, NEVER WRITTEN
     ----------------------------
     `court` drives the rail badge, the rail bars, the `h1`, the chip counts and
     the tag over the conversation — and nothing on this page changes it. There
     is no send here that would flip a thread from `you` to `them`, so the six
     readers are printed once by the builder and this block never touches them.
     That is also why Messages has no reply clock and no overdue count: urgency
     belongs to Enquiries, and `court` is turn-taking, not lateness.

     THE PANE OUTLIVES THE ROW
     -------------------------
     Filtering to `Owners` with a buyer's thread open leaves that thread open.
     A chip moves the list; it does not throw away a half-written reply.
     ========================================================================== */

  (function agentMessages() {
    var desk = $('.mgdesk');
    if (!desk) { return; }

    var items = $$('[data-mg-item]');
    var panes = $$('[data-mg-pane]');
    var files = $$('[data-mg-file]');
    var chips = $$('[data-mg-tab]');
    var search = $('[data-mg-search]');
    var empty = $('[data-mg-empty]');
    var tab = 'all';

    function matches(li, id) {
      if (id === 'owner') { return li.getAttribute('data-mg-role') === 'Owner'; }
      if (id === 'you' || id === 'them') { return li.getAttribute('data-mg-court') === id; }
      return true;
    }

    /* -------------------------------------------------- opening a thread --- */

    function open(id) {
      panes.forEach(function (p) { p.hidden = p.getAttribute('data-mg-pane') !== id; });
      files.forEach(function (f) { f.hidden = f.getAttribute('data-mg-file') !== id; });
      $$('[data-mg-open]').forEach(function (b) {
        b.classList.toggle('is-on', b.getAttribute('data-mg-open') === id);
      });
    }

    $$('[data-mg-open]').forEach(function (btn) {
      btn.addEventListener('click', function () { open(btn.getAttribute('data-mg-open')); });
    });
    /* The owner panel and the promise list are two more doors into the same
       eight conversations — and they open the thread they name, because they
       were derived from it. */
    $$('[data-mg-owner]').forEach(function (btn) {
      btn.addEventListener('click', function () { open(btn.getAttribute('data-mg-owner')); });
    });

    /* ----------------------------------------- the filter and the search --- */

    function apply() {
      var q = search ? search.value.trim().toLowerCase() : '';
      var shown = 0;
      items.forEach(function (li) {
        var on = matches(li, tab)
          && (!q || li.getAttribute('data-mg-hay').indexOf(q) >= 0);
        li.hidden = !on;
        if (on) { shown += 1; }
      });
      if (empty) {
        empty.hidden = shown > 0;
        setText(empty, q && shown === 0
          ? 'Nothing matches “' + search.value.trim() + '”.'
          : 'No threads in this state. Try another filter.');
      }
    }

    chips.forEach(function (btn) {
      btn.addEventListener('click', function () {
        tab = btn.getAttribute('data-mg-tab');
        chips.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        apply();
      });
    });

    if (search) { search.addEventListener('input', apply); }

    /* ------------------------------------------------------- the composer --- */

    panes.forEach(function (pane) {
      var quicks = $$('[data-mg-quick]', pane);
      var field = $('.mgcompose__field', pane);
      quicks.forEach(function (q) {
        q.addEventListener('click', function () {
          var on = !q.classList.contains('is-on');
          quicks.forEach(function (other) {
            var lit = other === q && on;
            other.classList.toggle('is-on', lit);
            other.setAttribute('aria-pressed', lit ? 'true' : 'false');
          });
          if (field) {
            field.placeholder = on
              ? $('.mgquick__n', q).previousSibling.textContent
              : field.getAttribute('data-mg-resting');
          }
        });
      });
    });

    /* ------------------------------------------------------ §02 promises --- */

    var promises = $$('[data-mg-promise]');
    var done = {};

    function promiseCounts() {
      var late = 0;
      var openP = 0;
      var today = 0;
      promises.forEach(function (row) {
        if (done[row.getAttribute('data-mg-promise')]) { return; }
        openP += 1;
        if (row.classList.contains('mgprow--late')) { late += 1; }
        if ($('[data-mg-due]', row).getAttribute('data-mg-was') === 'Today') { today += 1; }
      });
      var note = $('[data-mg-pnote]');
      setText(note, late > 0 ? late + ' past the day you said'
        : openP === 0 ? 'nothing outstanding' : openP + ' open');
      /* Three states, not two: late is rust, outstanding is gold, clear is
         green. Dropping the rust class alone would leave the count grey. */
      if (note) {
        note.className = 'aghr__note aghr__note--'
          + (late > 0 ? 'warn' : openP === 0 ? 'good' : 'accent');
      }
      setText($('[data-mg-pfoot]'), late > 0
        ? 'Read out of your own sentences. Nobody remembers what you promised better than the person you promised it to.'
        : openP === 0
          ? 'Everything you said you would do is done. That is rarer than it sounds.'
          : today > 0 ? today + ' due today. The rest have room.' : 'Nothing late. Keep it that way.');
    }

    promises.forEach(function (row) {
      var id = row.getAttribute('data-mg-promise');
      var btn = $('[data-mg-do]', row);
      var due = $('[data-mg-due]', row);
      var resting = due.textContent;
      var urgent = btn.classList.contains('mgact--urgent');
      due.setAttribute('data-mg-was', resting);
      btn.addEventListener('click', function () {
        done[id] = !done[id];
        row.classList.toggle('mgprow--done', done[id]);
        /* The overdue edge stays on the record, not on the row: a promise kept
           two days late was still two days late. */
        row.classList.toggle('mgprow--late', !done[id] && resting.indexOf('late') > 0);
        setText(due, done[id] ? 'Done' : resting);
        due.className = 'mgdue' + (done[id] ? ' mgdue--done'
          : resting.indexOf('late') > 0 ? ' mgdue--late'
            : resting === 'Today' ? ' mgdue--today' : '');
        setText(btn, done[id] ? 'Done' : 'Do it');
        btn.className = 'mgact' + (done[id] ? ' mgact--done' : urgent ? ' mgact--urgent' : '');
        btn.setAttribute('aria-pressed', done[id] ? 'true' : 'false');
        if (done[id]) { open(btn.getAttribute('data-mg-goto')); }
        promiseCounts();
      });
    });

    /* ---------------------------------------------------------- §03 quiet --- */

    var quiet = $$('[data-mg-quiet]');
    var nudged = {};

    function quietCounts() {
      var left = quiet.filter(function (row) {
        return !nudged[row.getAttribute('data-mg-quiet')];
      }).length;
      setText($('[data-mg-qnote]'), left === 0 ? 'all nudged' : left + ' worth a nudge');
      setText($('[data-mg-qfoot]'), left === 0
        ? 'Everyone has heard from you. Silence from here is their answer, not your oversight.'
        : 'A thread nobody ends is a thread nobody remembers. Two lines is enough to find out where you stand.');
    }

    quiet.forEach(function (row) {
      var id = row.getAttribute('data-mg-quiet');
      var btn = $('[data-mg-nudge]', row);
      var days = $('[data-mg-days]', row);
      var resting = days.textContent;
      var restingClass = days.className;
      var urgent = btn.classList.contains('mgact--urgent');
      btn.addEventListener('click', function () {
        nudged[id] = !nudged[id];
        setText(days, nudged[id] ? '0' : resting);
        days.className = nudged[id] ? 'mgdays mgdays--done' : restingClass;
        setText(btn, nudged[id] ? 'Sent' : 'Nudge');
        btn.className = 'mgact' + (nudged[id] ? ' mgact--done' : urgent ? ' mgact--urgent' : '');
        btn.setAttribute('aria-pressed', nudged[id] ? 'true' : 'false');
        quietCounts();
      });
    });

    apply();
  }());

  /* ==========================================================================
     9ba. Clients — the book of relationships, and its temperature
     -----------------------------------------------------------------------------
     Nothing here creates content. All six clients are printed in full — the
     brief, the twelve-month contact line, the four facts, the next move, and
     the files the agent holds for them with their fit labels — with five of
     each hidden. Selecting a client flips `hidden` on two panes, so no brief
     can meet the wrong timeline, and with the script off the page reads Marta
     Silveira's relationship end to end.

     THE MATCHES ARE NOT RECOMPUTED HERE
     -----------------------------------
     Which files fit which brief comes out of the builder, which derives it from
     the register. This block only counts what is left unsent — if it could
     recompute the match itself, the panel and the table could disagree about
     the same client, and §5.2 of the handoff is a record of exactly that going
     wrong.

     THREE STATES, TESTED IN THIS ORDER
     ----------------------------------
     `—` for owners, `none fit` when the register holds nothing, `all sent`
     when it holds something and it has all gone. Collapsing those into two is
     how the page once said three contradictory things about Paul Brandt at
     once, so the order is load-bearing and the owner branch comes first.
     ========================================================================== */

  (function agentClients() {
    var book = $('.clbook');
    if (!book) { return; }

    var rows = $$('[data-cl-row]');
    var panes = $$('[data-cl-pane]');
    var holds = $$('[data-cl-hold]');
    var chips = $$('[data-cl-tab]');
    var empty = $('[data-cl-empty]');
    var sent = {};
    var called = {};

    function matchesTab(tr, id) {
      if (id === 'cold') { return tr.getAttribute('data-cl-heat') === 'cold'; }
      if (id === 'buyer' || id === 'owner') {
        return tr.getAttribute('data-cl-short').toLowerCase() === id;
      }
      return true;
    }

    /* ------------------------------------------------- choosing a client --- */

    function select(id) {
      panes.forEach(function (p) { p.hidden = p.getAttribute('data-cl-pane') !== id; });
      holds.forEach(function (h) { h.hidden = h.getAttribute('data-cl-hold') !== id; });
      $$('[data-cl-pick]').forEach(function (b) {
        b.classList.toggle('is-on', b.getAttribute('data-cl-pick') === id);
      });
      rows.forEach(function (tr) {
        tr.classList.toggle('is-on', tr.getAttribute('data-cl-row') === id);
      });
    }

    $$('[data-cl-pick]').forEach(function (btn) {
      btn.addEventListener('click', function () { select(btn.getAttribute('data-cl-pick')); });
    });
    $$('[data-cl-cell]').forEach(function (btn) {
      btn.addEventListener('click', function () { select(btn.getAttribute('data-cl-cell')); });
    });

    /* -------------------------------------------------------- the filter --- */

    chips.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-cl-tab');
        chips.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        var visible = [];
        rows.forEach(function (tr) {
          var on = matchesTab(tr, id);
          tr.hidden = !on;
          tr.classList.remove('is-last');
          if (on) { visible.push(tr); }
        });
        var shown = visible.length;
        /* The closing hairline belongs to the last row still showing. */
        if (shown) { visible[shown - 1].classList.add('is-last'); }
        if (empty) { empty.hidden = shown > 0; }
        setText($('[data-cl-tablenote]'), shown + ' of ' + rows.length + ' shown');
      });
    });

    /* ------------------------------------------------- the contact line --- */

    panes.forEach(function (pane) {
      var months = $$('[data-cl-month]', pane);
      var labels = $$('.clmonths > li', pane);
      var note = $('[data-cl-touchnote]', pane);
      var resting = note ? note.textContent : '';
      months.forEach(function (btn, i) {
        function read() {
          labels.forEach(function (l, n) { l.classList.toggle('is-on', n === i); });
          setText(note, btn.getAttribute('data-cl-note'));
        }
        btn.addEventListener('mouseenter', read);
        btn.addEventListener('focus', read);
        btn.addEventListener('click', read);
      });
      var chart = $('.clchart__dots', pane);
      if (chart) {
        chart.addEventListener('mouseleave', function () {
          labels.forEach(function (l) { l.classList.remove('is-on'); });
          setText(note, resting);
        });
      }
    });

    /* ------------------------------------------- sending what you hold --- */

    function unsentFor(id) {
      return $$('[data-cl-send^="' + id + ':"]').filter(function (b) {
        return !sent[b.getAttribute('data-cl-send')];
      }).length;
    }

    function repaint(id) {
      var hold = $('[data-cl-hold="' + id + '"]');
      var total = $$('[data-cl-send^="' + id + ':"]').length;
      var left = unsentFor(id);
      var count = $('[data-cl-holdcount]', hold);
      /* The owner branch never reaches here — owners have no send buttons —
         so the two states left are "none fit" and a count. */
      if (total > 0) {
        setText(count, left + ' of ' + total);
        count.className = 'clhold__count' + (left === 0 ? ' clhold__count--sent' : '');
        setText($('[data-cl-holdfoot]', hold), left === 0
          ? 'Everything that fits has been sent. Nothing left to do but wait for the register to change.'
          : 'A file sent by name to the person it was chosen for is worth twenty portal alerts.');
      }

      var cell = $('[data-cl-matchcell]', $('[data-cl-row="' + id + '"]'));
      if (cell && total > 0) {
        setText(cell, left === 0 ? 'all sent' : String(left));
        cell.className = 'clmatchcell' + (left === 0 ? ' clmatchcell--sent' : '');
      }

      var all = $$('[data-cl-send]').filter(function (b) {
        return !sent[b.getAttribute('data-cl-send')];
      }).length;
      setText($('[data-cl-booknote]'), all === 0 ? 'every match sent'
        : all + ' match' + (all === 1 ? '' : 'es') + ' you are sitting on');
      var tile = $('[data-cl-unsent]');
      setText(tile, String(all));
      if (tile) { tile.classList.toggle('agstat__value--warn', all > 0); }
      var delta = tile && tile.nextElementSibling;
      if (delta) {
        delta.classList.toggle('agstat__delta--warn', all > 0);
        delta.classList.toggle('agstat__delta--good', all === 0);
      }
    }

    $$('[data-cl-send]').forEach(function (btn) {
      var key = btn.getAttribute('data-cl-send');
      var id = key.split(':')[0];
      btn.addEventListener('click', function () {
        sent[key] = !sent[key];
        setText(btn, sent[key] ? 'Sent' : 'Send it');
        btn.className = 'clact clact--send' + (sent[key] ? ' clact--done' : '');
        btn.setAttribute('aria-pressed', sent[key] ? 'true' : 'false');
        repaint(id);
      });
    });

    /* ----------------------------------------------------- §04 the calls --- */

    function callCounts() {
      var left = $$('[data-cl-call]').filter(function (b) {
        return !called[b.getAttribute('data-cl-call')];
      }).length;
      var note = $('[data-cl-callnote]');
      setText(note, left === 0 ? 'all called' : left + ' left');
      if (note) {
        note.className = 'aghr__note aghr__note--' + (left === 0 ? 'good' : 'accent');
      }
      setText($('[data-cl-callfoot]'), left === 0
        ? 'Everyone on this list has heard your voice today. Nothing else on this page matters as much.'
        : 'Ordered by days quiet against what they are worth — not by who is easiest to ring.');
    }

    $$('[data-cl-call]').forEach(function (btn) {
      var id = btn.getAttribute('data-cl-call');
      var row = btn.closest('[data-cl-callrow]');
      var when = $('[data-cl-when]', row);
      var resting = when.textContent;
      var restingClass = when.className;
      var cold = row.classList.contains('clcall--cold');
      btn.addEventListener('click', function () {
        called[id] = !called[id];
        setText(btn, called[id] ? 'Called' : 'Call');
        btn.className = 'clact' + (called[id] ? ' clact--done' : cold ? ' clact--urgent' : '');
        btn.setAttribute('aria-pressed', called[id] ? 'true' : 'false');
        setText(when, called[id] ? 'Called just now' : resting);
        when.className = called[id] ? 'clwhen clwhen--done' : restingClass;
        row.classList.toggle('clcall--done', called[id]);
        row.classList.toggle('clcall--cold', !called[id] && cold);
        callCounts();
      });
    });
  }());

  /* ==========================================================================
     9bb. Performance — three readings, and nothing to edit
     -----------------------------------------------------------------------------
     Nothing on this page is editable; it is a read. All eight scatter callouts
     are printed in full and seven hidden, so hovering a dot is a `hidden` flip
     and no property can be read against another property's numbers. With the
     script off the page still shows the year, the sources, every valuation,
     the whole comparison and the fix — only the three hover readings rest on
     their defaults.

     THE VERDICTS ARE NOT RECOMPUTED HERE
     ------------------------------------
     Which metric §06 picks, the mean valuation miss, the slope — all of it
     comes out of the builder, which derives it from the data. If this block
     could recompute any of it, §03's header, §05's rows and §06's paragraph
     could disagree about the same number, and the page's whole claim is that
     they cannot.

     THE MONTH READING RESTS ON THE YEAR
     -----------------------------------
     Leaving the chart returns the figure to the monthly average rather than to
     nothing: a chart nobody is touching still has to say something.
     ========================================================================== */

  (function agentPerformance() {
    var year = $('.peyear');
    if (!year) { return; }

    /* ------------------------------------------------------- §01 the year --- */

    var months = $$('[data-pe-mo]');
    var monthLabels = $$('.pemonths > li');
    var moNote = $('[data-pe-monote]');
    var moValue = $('[data-pe-movalue]');
    var moMeta = $('[data-pe-mometa]');
    var moResting = {
      note: moNote ? moNote.textContent : '',
      value: moValue ? moValue.textContent : '',
      meta: moMeta ? moMeta.textContent : '',
      cls: moValue ? moValue.className : ''
    };

    months.forEach(function (btn, i) {
      function read() {
        months.forEach(function (b) { b.classList.toggle('is-on', b === btn); });
        monthLabels.forEach(function (l, n) { l.classList.toggle('is-on', n === i); });
        setText(moNote, btn.getAttribute('data-pe-note'));
        setText(moValue, btn.getAttribute('data-pe-value'));
        setText(moMeta, btn.getAttribute('data-pe-meta'));
        moValue.className = 'peread__value' + (btn.getAttribute('data-pe-tone')
          ? ' peread__value--' + btn.getAttribute('data-pe-tone') : '');
      }
      btn.addEventListener('mouseenter', read);
      btn.addEventListener('focus', read);
      btn.addEventListener('click', read);
    });

    var bars = $('.pebars');
    if (bars) {
      bars.addEventListener('mouseleave', function () {
        months.forEach(function (b) { b.classList.remove('is-on'); });
        monthLabels.forEach(function (l) { l.classList.remove('is-on'); });
        setText(moNote, moResting.note);
        setText(moValue, moResting.value);
        setText(moMeta, moResting.meta);
        moValue.className = moResting.cls;
      });
    }

    /* ---------------------------------------------------- §02 the sources --- */

    var srcRows = $$('[data-pe-src]');
    var srcRead = $('[data-pe-srcread]');
    var srcResting = srcRead ? srcRead.textContent : '';

    srcRows.forEach(function (btn) {
      function read() {
        srcRows.forEach(function (b) { b.classList.toggle('is-on', b === btn); });
        setText(srcRead, btn.getAttribute('data-pe-srcnote'));
      }
      btn.addEventListener('mouseenter', read);
      btn.addEventListener('focus', read);
      btn.addEventListener('click', read);
    });

    var srcList = $('.pesrclist');
    if (srcList) {
      srcList.addEventListener('mouseleave', function () {
        srcRows.forEach(function (b) { b.classList.remove('is-on'); });
        setText(srcRead, srcResting);
      });
    }

    /* ---------------------------------------------------- §04 the scatter --- */

    var dots = $$('[data-pe-dot]');
    var dotLabels = $$('.pedotlabels > li');
    var panes = $$('[data-pe-pane]');
    /* The resting dot is the last file — the slowest one, which is the point
       the section is making. */
    var resting = panes.length - 1;

    function show(i) {
      dots.forEach(function (b, n) { b.classList.toggle('is-on', n === i); });
      dotLabels.forEach(function (l, n) { l.classList.toggle('is-on', n === i); });
      panes.forEach(function (p, n) { p.hidden = n !== i; });
    }

    dots.forEach(function (btn, i) {
      btn.addEventListener('mouseenter', function () { show(i); });
      btn.addEventListener('focus', function () { show(i); });
      btn.addEventListener('click', function () { show(i); });
    });

    var plot = $('.pedots');
    if (plot) {
      plot.addEventListener('mouseleave', function () { show(resting); });
    }
  }());

  /* ==========================================================================
     9bc. Desk settings — every control priced, and nothing saved by accident
     -----------------------------------------------------------------------------
     The last of the ten agent screens, and the only one where the reader
     changes something. Seven controls, and every one of them clears the saved
     state — a save bar that claims a saved state for an unsaved change is
     worse than no save bar.

     THE PROMISE IS TESTED, NOT VALIDATED
     ------------------------------------
     Moving the slider re-runs the agent's own last forty-two reply times
     against the new promise: the histogram recolours bar by bar, the kept
     percentage follows, the tag moves between kept / tight / broken, and the
     verdict changes its mind. Nothing is compared against a desk policy — the
     page's argument is that a promise is worth what the record can support.

     §03 ARGUES WITH §01
     -------------------
     Turn all three channels off for a new enquiry and the notification footer
     turns rust and names the contradiction with the promise. It is the only
     cross-section check on the desk and it re-evaluates on every toggle,
     including a change to the promise itself.
     ========================================================================== */

  (function deskSettings() {
    var page = $('.dsdesk');
    if (!page) { return; }

    var WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
      'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
      'seventeen', 'eighteen', 'nineteen', 'twenty'];
    /* Counts in prose stop at ten; the one exception is the size of the
       notification matrix, which is structural rather than a count. */
    var word = function (n) { return (n >= 0 && n <= 10) ? WORDS[n] : String(n); };
    var spell = function (n) { return (n >= 0 && n < WORDS.length) ? WORDS[n] : String(n); };
    var TONES = ['kept', 'tight', 'broken'];

    var range = $('[data-ds-range]');
    var replies = $$('[data-ds-reply]').map(function (b) {
      return { el: b, bar: $('.dsreply__bar', b), mins: Number(b.getAttribute('data-ds-mins')) };
    });
    var steps = [
      { label: '15 min', mins: 15 }, { label: '30 min', mins: 30 }, { label: '1 hour', mins: 60 },
      { label: '2 hours', mins: 120 }, { label: '4 hours', mins: 240 },
      { label: 'Same day', mins: 480 }, { label: 'Next day', mins: 1440 }
    ];
    var median = replies.length ? replies[Math.floor(replies.length / 2)].mins : 0;
    var saved = false;

    /* ------------------------------------------------------- the save state --- */

    function touch() {
      if (!saved) { return; }
      saved = false;
      paintSave();
    }

    function paintSave() {
      var bar = $('[data-ds-save]');
      if (!bar) { return; }
      bar.classList.toggle('dssave--saved', saved);
      setText($('[data-ds-saveline]'), saved
        ? 'Saved. Your profile now promises ' + steps[Number(range.value)].label
          + ', and the desk knows it.'
        : 'Unsaved. Nothing here reaches a buyer until you save it.');
      setText($('[data-ds-go]'), saved ? 'Saved' : 'Save the desk');
    }

    /* ---------------------------------------------------------- §01 promise --- */

    function tone(pct) { return pct >= 85 ? 'kept' : pct >= 60 ? 'tight' : 'broken'; }

    function swap(el, base, name) {
      if (!el) { return; }
      TONES.forEach(function (t) { el.classList.toggle(base + '--' + t, t === name); });
    }

    function width(el, pct) {
      if (!el) { return; }
      el.className = el.className.replace(/\s*dsw--\d+/g, '') + ' dsw--' + pct;
    }

    function paintPromise() {
      var step = steps[Number(range.value)];
      var kept = replies.filter(function (r) { return r.mins <= step.mins; }).length;
      var broke = replies.length - kept;
      var pct = Math.round(kept / replies.length * 100);
      var t = tone(pct);

      replies.forEach(function (r) {
        r.bar.classList.toggle('dsreply__bar--broke', r.mins > step.mins);
      });

      setText($('[data-ds-figure]'), step.label);
      setText($('[data-ds-railfig]'), step.label);
      var line = $('[data-ds-keptline]');
      setText(line, kept + ' of ' + replies.length + ' kept · ' + pct + '%');
      swap(line, 'dskept', t);
      var tag = $('[data-ds-railtag]');
      setText(tag, t);
      swap(tag, 'dstag', t);
      var fill = $('[data-ds-railbar]');
      swap(fill, 'dsbar__fill', t);
      width(fill, pct);
      setText($('[data-ds-railnote]'), pct >= 85
        ? 'You would have kept this promise on ' + pct + ' of every hundred enquiries last month.'
        : 'Last month you would have broken it ' + word(broke) + ' times out of ' + replies.length + '.');
      setText($('[data-ds-breach]'), broke === 0 ? 'none over the line'
        : word(broke) + ' over the line');

      /* The verdict is a different ladder from the tag: a promise can be
         honest and still be costing the agent money. */
      var vtone = pct >= 95 ? 'good' : pct >= 75 ? 'accent' : 'warn';
      var verdict = $('[data-ds-verdict]');
      ['good', 'accent', 'warn'].forEach(function (x) {
        verdict.classList.toggle('dsverdict--' + x, x === vtone);
      });
      setText($('[data-ds-verdicttitle]'), pct >= 95 ? 'A promise you can print'
        : pct >= 75 ? 'Honest, and it costs you' : 'You would be lying');
      setText($('[data-ds-verdictbody]'), pct >= 95
        ? 'At ' + step.label + ' you would have kept your word on all but ' + word(broke)
          + " of last month's enquiries. It is a slow promise, and a buyer comparing three agents will notice."
        : pct >= 75
          ? 'At ' + step.label + ' you keep your word ' + pct + ' times in a hundred and still sound quick. The '
            + word(broke) + ' you would have missed are the evenings and the weekend — which is what section two is for.'
          : 'At ' + step.label + ' you would have broken your own promise on ' + word(broke)
            + ' of ' + replies.length + ' enquiries. Buyers forgive a slow agent. They do not forgive one who advertised fast.');

      setText($('[data-ds-sum="First reply"]'), step.label);
      setText($('[data-ds-badge="dsbadge-promise"]'), 'Replies in ' + step.label);
      paintRoute(broke);
      setText($('[data-ds-cost="dscount-kept"]'), kept + ' · ' + pct + '%');
      var keptCell = $('[data-ds-cost="dscount-kept"]');
      keptCell.className = 'dscost__value dscost__value--' + (pct >= 85 ? 'good' : 'accent');
      var lostCell = $('[data-ds-cost="dscount-lost"]');
      setText(lostCell, word(broke));
      lostCell.className = 'dscost__value dscost__value--' + (broke === 0 ? 'good' : 'warn');
      paintChan();
      paintAccess();
    }

    if (range) {
      range.addEventListener('input', function () { touch(); paintPromise(); });
    }

    replies.forEach(function (r) {
      function read() {
        replies.forEach(function (x) { x.el.classList.toggle('is-on', x === r); });
        setText($('[data-ds-hover]'), r.mins + ' min · '
          + (r.mins <= steps[Number(range.value)].mins ? 'kept' : 'broken'));
      }
      r.el.addEventListener('mouseenter', read);
      r.el.addEventListener('focus', read);
      r.el.addEventListener('click', read);
    });

    var bars = $('.dsbars');
    if (bars) {
      bars.addEventListener('mouseleave', function () {
        replies.forEach(function (x) { x.el.classList.remove('is-on'); });
        setText($('[data-ds-hover]'), 'median ' + median + ' min');
      });
    }

    /* ------------------------------------------------------------ the route --- */

    var routes = $$('[data-ds-route]');

    function paintRoute(broke) {
      var on = routes.filter(function (b) { return b.classList.contains('is-on'); })[0];
      if (!on) { return; }
      var id = on.getAttribute('data-ds-route');
      var note = $('[data-ds-routeread]');
      setText(note, id === 'keep'
        ? 'Nothing is taken from you, and nothing is answered for you either. ' + word(broke) + ' enquiries last month would simply have waited.'
        : id === 'desk'
          ? "On last month's figures " + word(broke) + ' enquiries would have left your name and gone to whoever was free.'
          : "On last month's figures you would have split " + word(broke) + ' fees rather than lose them.');
      note.classList.toggle('dsroute__note--warn', id === 'desk' && broke > 6);
      setText($('[data-ds-sum="If you miss it"]'),
        id === 'keep' ? 'It waits' : id === 'desk' ? 'Desk takes it' : 'Split the fee');
      setText($('[data-ds-costlabel="dscount-lost"]'),
        id === 'keep' ? 'Left waiting' : id === 'desk' ? 'Would have gone' : 'Would have been split');
    }

    routes.forEach(function (btn) {
      btn.addEventListener('click', function () {
        routes.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        touch();
        paintPromise();
      });
    });

    /* ------------------------------------------------------------ §02 hours --- */

    var cells = $$('[data-ds-cell]');

    function paintHours() {
      var open = cells.filter(function (c) { return c.classList.contains('is-on'); });
      var n = open.length;
      var eve = open.filter(function (c) { return /:eve$/.test(c.getAttribute('data-ds-cell')); }).length;
      var sat = open.filter(function (c) { return /^Sat:/.test(c.getAttribute('data-ds-cell')); }).length;
      var refused = Math.max(0, Math.round((cells.length - n) * 0.6));

      $$('[data-ds-day]').forEach(function (d) {
        var day = d.getAttribute('data-ds-day');
        d.classList.toggle('dsday--open', open.some(function (c) {
          return c.getAttribute('data-ds-cell').indexOf(day + ':') === 0;
        }));
      });

      var note = $('[data-ds-hoursnote]');
      setText(note, n + ' of ' + cells.length + ' blocks open');
      note.className = 'aghr__note aghr__note--'
        + (n >= 14 ? 'good' : n >= 8 ? 'accent' : 'warn');
      setText($('[data-ds-hoursfoot]'), eve === 0 && sat === 0
        ? 'No evenings and no Saturday. Roughly six viewings in ten are asked for outside office hours — you would be turning away about ' + word(refused) + ' a month.'
        : eve === 0
          ? 'No evenings. Buyers who work will ask for Saturday instead, and you have ' + word(sat) + ' Saturday block' + (sat === 1 ? '' : 's') + ' open.'
          : sat === 0
            ? word(eve) + ' evening' + (eve === 1 ? '' : 's') + ' open and no Saturday. That is the pattern of an agent who sells to people who work from home.'
            : word(eve) + ' evening' + (eve === 1 ? '' : 's') + ' and ' + word(sat) + ' Saturday block' + (sat === 1 ? '' : 's') + ' open. Buyers can reach you when they are actually free.');
      var sum = $('[data-ds-sum="Open blocks"]');
      setText(sum, n + ' of ' + cells.length);
      sum.className = 'dssum__value dssum__value--' + (n >= 14 ? 'good' : 'accent');
    }

    cells.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var on = !btn.classList.contains('is-on');
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        setText(btn, on ? '·' : '');
        touch();
        paintHours();
      });
    });

    /* ----------------------------------------------------------- §03 matrix --- */

    var chans = $$('[data-ds-chan]');

    function paintChan() {
      var on = chans.filter(function (c) { return c.classList.contains('is-on'); });
      var enq = on.filter(function (c) { return /^enq:/.test(c.getAttribute('data-ds-chan')); });
      var sms = enq.some(function (c) { return /:sms$/.test(c.getAttribute('data-ds-chan')); });
      var label = steps[Number(range.value)].label;
      setText($('[data-ds-channote]'), on.length + ' of ' + spell(chans.length) + ' on');
      var foot = $('[data-ds-chanfoot]');
      setText(foot, enq.length === 0
        ? 'Nothing tells you an enquiry has arrived. Your promise of ' + label + ' is a promise to check the screen.'
        : sms
          ? 'A new enquiry reaches your phone by message. That is the only channel that survives a viewing, and it is why your median is ' + median + ' minutes.'
          : 'Enquiries reach you on screen but not by message. Every viewing you run is a gap in your promise.');
      foot.className = 'dsmatrix__foot'
        + (enq.length === 0 ? ' dsmatrix__foot--warn' : sms ? ' dsmatrix__foot--good' : '');
    }

    chans.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var on = !btn.classList.contains('is-on');
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        touch();
        paintChan();
      });
    });

    /* ---------------------------------------------------------- §04 profile --- */

    var langs = $$('[data-ds-lang]');
    var bio = $('[data-ds-bio]');

    function paintProfile() {
      var on = langs.filter(function (l) { return l.classList.contains('is-on'); })
        .map(function (l) { return l.getAttribute('data-ds-lang'); });
      var badge = $('[data-ds-badge="dsbadge-langs"]');
      setText(badge, on.join(' · ') || 'No language set');
      badge.className = 'dsbadge' + (on.length ? '' : ' dsbadge--warn');
      var sum = $('[data-ds-sum="Languages"]');
      setText(sum, on.join(' ') || '—');
      sum.className = 'dssum__value' + (on.length ? '' : ' dssum__value--warn');
      setText($('[data-ds-profilefoot]'), on.length <= 1
        ? 'One language. A quarter of the enquiries on this desk arrive in something else, and they go to whoever says they speak it.'
        : 'Buyers filter agents by language before they read a word of the biography.');
    }

    langs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var on = !btn.classList.contains('is-on');
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        touch();
        paintProfile();
      });
    });

    if (bio) {
      bio.addEventListener('input', function () {
        var n = bio.value.length;
        var count = $('[data-ds-count]');
        setText(count, n < 60 ? 'Too short. Buyers skip the card that says nothing.'
          : n > 260 ? n + ' characters — the card truncates at 260.'
            : n + ' characters. About right.');
        count.classList.toggle('dscount--warn', n < 60 || n > 260);
        touch();
      });
    }

    /* ----------------------------------------------------------- §06 access --- */

    var perms = $$('[data-ds-access]');

    function paintAccess() {
      var cover = perms.filter(function (p) {
        return p.getAttribute('data-ds-access') === 'cover';
      })[0];
      var on = cover && cover.classList.contains('is-on');
      var broke = replies.filter(function (r) {
        return r.mins > steps[Number(range.value)].mins;
      }).length;
      var foot = $('[data-ds-accessfoot]');
      setText(foot, on
        ? 'Cover is on. Somebody else can answer in your name while you are in a viewing — which is the only reason your promise survives a busy Thursday.'
        : 'Cover is off. Nothing is answered while you are out, and ' + word(broke) + ' enquiries last month arrived while you were in a viewing.');
      foot.classList.toggle('dsaccess__foot--warn', !on);
      var sum = $('[data-ds-sum="Cover"]');
      setText(sum, on ? 'On' : 'Off');
      sum.className = 'dssum__value dssum__value--' + (on ? 'good' : 'warn');
    }

    perms.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var on = !btn.classList.contains('is-on');
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        touch();
        paintAccess();
      });
    });

    /* ----------------------------------------------------- replace photograph --- */

    /* Проводник открывает сам браузер — за подписью спрятан настоящий
       input[type=file], и это работает даже без скрипта. Скрипт нужен только
       чтобы показать выбранный кадр на месте прежнего.

       Ничего никуда не отправляется: у шаблона нет сервера. Файл живёт в
       памяти вкладки и исчезает при обновлении страницы. */
    var pick = $('[data-ds-photo]');
    var shot = $('.dswho__img');
    var shotName = $('[data-ds-photoname]');
    if (pick && shot) {
      var restingName = shotName ? shotName.textContent : '';
      var objectUrl = null;

      pick.addEventListener('change', function () {
        var file = pick.files && pick.files[0];
        if (!file) { return; }

        /* Прежний адрес освобождаем руками: браузер держит файл в памяти,
           пока ссылку не отозвали, и десять примерок подряд её съедят. */
        if (objectUrl) { URL.revokeObjectURL(objectUrl); }
        objectUrl = URL.createObjectURL(file);

        shot.src = objectUrl;
        if (shotName) {
          setText(shotName, file.name + ' · ' + Math.round(file.size / 1024) + ' KB');
          shotName.classList.add('is-picked');
        }
        touch();
      });

      /* Откат по «Discard» возвращает и портрет — иначе кнопка врёт. */
      var back = $('[data-ds-discard]');
      if (back && shotName) {
        back.addEventListener('click', function () {
          if (objectUrl) { URL.revokeObjectURL(objectUrl); }
          setText(shotName, restingName);
          shotName.classList.remove('is-picked');
        });
      }
    }

    /* ------------------------------------------------------- save and discard --- */

    var go = $('[data-ds-go]');
    if (go) {
      go.addEventListener('click', function () { saved = true; paintSave(); });
    }
    var discard = $('[data-ds-discard]');
    if (discard) {
      /* Discard is a reload, not a partial undo: half-reverted settings are
         worse than none, and the page has no server to ask. */
      discard.addEventListener('click', function () { window.location.reload(); });
    }
  }());

  /* ==========================================================================
     9bd. Home detail v5 — the gallery swap
     ==========================================================================
     Большой кадр слева — экран, четыре справа — тамбнейлы. Клик по тамбнейлу
     ставит его фотографию в экран, а та, что там стояла, занимает клетку
     кликнутого. Именно меняются местами, а не подставляются: пять кадров
     лежат в одной сетке на виду, и «просто подставить» значило бы показать
     одну фотографию дважды, а прежнюю убрать с экрана совсем.

     Двигаются только src, alt и подпись. Сама разметка на месте — переставь
     узлы, и поедет раскладка, где первая клетка занимает две строки.
     ========================================================================== */

  (function p5gallery() {
    var lead = $('[data-p5-lead]');
    var thumbs = $$('[data-p5-swap]');
    if (!lead || !thumbs.length) { return; }

    var big = $('img', lead);
    var plate = $('[data-p5-plate]', lead);
    var total = (plate.textContent.split('/')[1] || '').trim();
    var busy = false;

    function pad(n) { return (n < 10 ? '0' : '') + n; }

    function read(img) {
      return {
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt'),
        label: img.getAttribute('data-p5-label'),
        shot: img.getAttribute('data-p5-shot')
      };
    }

    function write(img, from) {
      img.setAttribute('src', from.src);
      img.setAttribute('alt', from.alt);
      img.setAttribute('data-p5-label', from.label);
      if (from.shot === null) { img.removeAttribute('data-p5-shot'); }
      else { img.setAttribute('data-p5-shot', from.shot); }
    }

    /* Обе гаснут, меняются под затемнением и проявляются обратно. Подмена
       src на видимой картинке дала бы рывок в один кадр. */
    function swap(thumb) {
      if (busy) { return; }
      var small = $('img', thumb);
      if (!small || small.getAttribute('src') === big.getAttribute('src')) { return; }

      var wasBig = read(big);
      var wasSmall = read(small);

      function apply() {
        write(big, wasSmall);
        write(small, wasBig);
        /* Номер фотографии в наборе — её исходное место в галерее, а не
           клетка, в которой она сейчас лежит. */
        var n = parseInt(wasSmall.shot, 10);
        setText(plate, wasSmall.label + ' · ' + pad(isNaN(n) ? 1 : n + 1) + ' / ' + total);
        lead.classList.remove('is-fading');
        thumb.classList.remove('is-fading');
        busy = false;
      }

      busy = true;
      lead.classList.add('is-fading');
      thumb.classList.add('is-fading');

      var reduced = window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) { apply(); return; }

      /* Ждём конец затухания на большом кадре, но не полагаемся на событие
         целиком: если картинка не успела отрисоваться, transitionend может
         не прийти, и галерея замрёт погашенной. */
      var done = false;
      function once() {
        if (done) { return; }
        done = true;
        big.removeEventListener('transitionend', once);
        apply();
      }
      big.addEventListener('transitionend', once);
      window.setTimeout(once, 400);
    }

    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () { swap(thumb); });
    });
  }());


  /* ==========================================================================
     9be. Portrait cards — the highlight, the filters, the sheets
     -----------------------------------------------------------------------------
     Nothing here creates a card. The builder writes all thirty-three and marks
     the eight on the first sheet visible; this block only shows, hides and
     moves the highlight. With scripting off the page is a readable sheet of
     eight files, which is the honest fallback for a filtered register.

     WHY ONE CARD IS ALWAYS LIT
     --------------------------
     Non-hovered cards sit at 0.62. That dimming is the whole reason the
     layout works: with eight cards on screen, what makes the eighth readable
     is that seven are down. So leaving the grid does not clear the highlight —
     it returns it to the first card. A uniformly dim sheet is a sheet nobody
     can read.

     WHY THE PAGE RESETS ON EVERY FILTER
     -----------------------------------
     `cur` is clamped to the last sheet that exists, so filtering can never
     land out of range. It is reset to 0 anyway: arriving on sheet 3 of a
     freshly filtered result is not what the person clicking a chip asked for.

     IDENTITY IS THE BUILDER'S, NOT OURS
     -----------------------------------
     Sheet number, agent, band marker and photograph are written into the
     markup from the file's position in the source array. This block never
     recomputes them, so a card keeps its identity through every filter and
     every sheet — which is the guarantee the handoff asks for by name.
     ========================================================================== */

  (function portraitCards() {
    var grid = $('[data-lv-grid]');
    if (!grid) { return; }

    var PAGE = 8;
    var cards = $$('[data-lv-card]', grid);
    var tabs = $$('[data-lv-mode]');
    var chips = $$('[data-lv-chip]');
    var note = $('[data-lv-note]');
    var count = $('[data-lv-count]');
    var showing = $('[data-lv-showing]');
    var empty = $('[data-lv-empty]');
    var pager = $('.lvpager');
    var rail = $('.lvpager__rail');
    var prev = $('[data-lv-prev]');
    var next = $('[data-lv-next]');
    var clear = $('[data-lv-clear]');

    var MODE_DEAL = { buy: 'For sale', rent: 'For rent', new: 'New build', sell: null };
    var NOTES = {};
    tabs.forEach(function (t) { NOTES[t.getAttribute('data-lv-mode')] = t; });

    var state = { mode: 'buy', chip: 'all', page: 0, lit: null };

    function matches(card) {
      var deal = MODE_DEAL[state.mode];
      if (deal && card.getAttribute('data-lv-deal') !== deal) { return false; }
      var cats = (' ' + card.getAttribute('data-lv-cat') + ' ');
      return cats.indexOf(' ' + state.chip + ' ') > -1;
    }

    function light(card) {
      cards.forEach(function (c) { c.classList.toggle('is-on', c === card); });
      state.lit = card || null;
    }

    function paint() {
      var shown = cards.filter(matches);
      var pages = Math.max(1, Math.ceil(shown.length / PAGE));
      var cur = Math.min(state.page, pages - 1);
      state.page = cur;

      var from = cur * PAGE;
      var onPage = shown.slice(from, from + PAGE);

      cards.forEach(function (c) { c.hidden = onPage.indexOf(c) === -1; });
      light(onPage[0] || null);

      if (empty) { empty.hidden = shown.length !== 0; }
      grid.hidden = shown.length === 0;
      if (pager) { pager.hidden = shown.length === 0; }

      if (count) {
        count.textContent = shown.length + ' files · sheet ' + (cur + 1) + ' of ' + pages;
      }
      if (showing) {
        showing.textContent = shown.length
          ? 'Showing ' + (from + 1) + '—' + (from + onPage.length) + ' of '
            + shown.length + ' files · sheet ' + (cur + 1) + ' of ' + pages
          : 'No files on this sheet';
      }

      /* Кнопки листов переписываются под новое их число: держать в разметке
         пять, когда результат помещается на один, — это приглашение уйти на
         пустую страницу. */
      if (rail) {
        $$('.lvpagenum', rail).forEach(function (b) { b.remove(); });
        for (var n = pages; n >= 1; n -= 1) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'lvpagenum' + (n === cur + 1 ? ' is-on' : '');
          b.setAttribute('data-lv-page', String(n));
          b.setAttribute('aria-current', n === cur + 1 ? 'page' : 'false');
          b.textContent = String(n);
          rail.insertBefore(b, prev.nextSibling);
        }
      }

      if (prev) {
        prev.disabled = cur === 0;
        prev.classList.toggle('is-off', cur === 0);
      }
      if (next) {
        var atEnd = cur >= pages - 1;
        next.disabled = atEnd;
        next.classList.toggle('is-off', atEnd);
      }
    }

    /* Ховер: подсветка идёт за курсором, а уход с сетки возвращает её на
       первую карточку листа — иначе лист остаётся весь тусклым. */
    cards.forEach(function (c) {
      c.addEventListener('mouseenter', function () { light(c); });
      c.addEventListener('focus', function () { light(c); });
    });

    grid.addEventListener('mouseleave', function () {
      light(cards.filter(function (c) { return !c.hidden; })[0] || null);
    });

    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        state.mode = t.getAttribute('data-lv-mode');
        state.page = 0;
        tabs.forEach(function (x) {
          var on = x === t;
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        if (note) { note.textContent = t.getAttribute('data-lv-tabnote') || note.textContent; }
        paint();
      });
    });

    chips.forEach(function (ch) {
      ch.addEventListener('click', function () {
        state.chip = ch.getAttribute('data-lv-chip');
        state.page = 0;
        chips.forEach(function (x) {
          var on = x === ch;
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        paint();
      });
    });

    if (rail) {
      rail.addEventListener('click', function (e) {
        var b = e.target.closest('[data-lv-page]');
        if (!b) { return; }
        state.page = parseInt(b.getAttribute('data-lv-page'), 10) - 1;
        paint();
      });
    }

    if (prev) {
      prev.addEventListener('click', function () {
        if (state.page > 0) { state.page -= 1; paint(); }
      });
    }
    if (next) {
      next.addEventListener('click', function () { state.page += 1; paint(); });
    }

    if (clear) {
      clear.addEventListener('click', function () {
        state.mode = 'buy';
        state.chip = 'all';
        state.page = 0;
        tabs.forEach(function (x) {
          var on = x.getAttribute('data-lv-mode') === 'buy';
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        chips.forEach(function (x) {
          var on = x.getAttribute('data-lv-chip') === 'all';
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        paint();
      });
    }

    paint();
  }());


  /* ==========================================================================
     9bf. Three views — one result set, three renderings
     -----------------------------------------------------------------------------
     The builder writes all three views in full — thirty-three cards, thirty-three
     rows, thirty-three map cards — and hides what is not on the current sheet.
     This block filters, sorts and pages ONCE, above the views, then shows the
     right slice in whichever view is active. No view filters for itself; the
     moment one does, the count line starts lying about what is on screen.

     THE ONLY THING THE VIEW CHANGES IS THE PAGE SIZE
     ------------------------------------------------
     8 cards, 5 rows, 6 map cards. That is a concession to layout and nothing
     else: a full-width row at 8-up is a scroll, and a map list at 8-up pushes
     the map below the fold.

     TWO INDICES, AND THEY ARE NOT INTERCHANGEABLE
     ---------------------------------------------
     `sh` is the position within the visible sheet and drives the card's own
     highlight. The map needs the position within the whole filtered set,
     because its pins are built from every match, not just this sheet. Light a
     pin by `sh` and it points at the wrong file the moment the user pages.

     THE MAP IS NOT REBUILT HERE
     ---------------------------
     Block 9d owns it. It reads `.mapcard` elements and their coordinates, so
     showing and hiding those cards is the whole of the integration — and the
     resize observer in 9d handles the one thing a hidden map gets wrong.
     ========================================================================== */

  (function threeViews() {
    var page = $('.swpage');
    if (!page) { return; }

    /* Размер листа объявлен на кнопке вида: страницы разные (у мастерской
       поиска карта берёт двенадцать карточек), а блок один. */
    var PAGE_OF = {};
    $$('[data-sw-view]', page).forEach(function (b) {
      PAGE_OF[b.getAttribute('data-sw-view')] = Number(b.getAttribute('data-sw-size')) || 8;
    });
    var NOTE_OF = {
      grid: 'Cards · four a row',
      rows: 'Rows · full width',
      map: 'Map · list beside it'
    };

    var panes = {};
    $$('[data-sw-view-pane]', page).forEach(function (el) {
      panes[el.getAttribute('data-sw-view-pane')] = el;
    });

    var tabs = $$('[data-sw-mode]', page);
    var chips = $$('[data-sw-chip]', page);
    var sortSel = $('[data-sw-sort]', page);
    var label = $('[data-sw-label]', page);
    var note = $('[data-sw-note]', page);
    var tabNote = $('[data-sw-tabnote]', page);
    var showing = $('[data-sw-showing]', page);
    var empty = $('[data-sw-empty]', page);
    var pager = $('.swpager', page);
    var rail = $('.swpager__rail', page);
    var prev = $('[data-sw-prev]', page);
    var next = $('[data-sw-next]', page);
    var clear = $('[data-sw-clear]', page);
    var mapCount = $('[data-map-count]', page);

    var viewBtns = $$('[data-sw-view]', page);
    var MODE_DEAL = { buy: 'For sale', rent: 'For rent', new: 'New build', sell: null };

    var state = { view: 'grid', mode: 'buy', chip: 'all', sort: 'Newest first', page: 0, sh: 0 };

    /* Each view holds its own copy of every file, keyed by the source index, so
       a file can be looked up in whichever view is on screen. */
    function cardsIn(view) { return $$('[data-sw-card]', panes[view]); }

    function matches(card) {
      var deal = MODE_DEAL[state.mode];
      if (deal && card.getAttribute('data-sw-deal') !== deal) { return false; }
      return (' ' + card.getAttribute('data-sw-cat') + ' ').indexOf(' ' + state.chip + ' ') > -1;
    }

    function num(card, attrName) { return Number(card.getAttribute(attrName)) || 0; }

    /* Sorting reorders the DOM rather than an array: the cards are already
       written, and moving them is what keeps every view in the same order
       without re-rendering anything. */
    function sorted(list) {
      var by = state.sort;
      var out = list.slice();
      if (by === 'Price · low to high') {
        out.sort(function (a, b) { return num(a, 'data-sw-sort-price') - num(b, 'data-sw-sort-price'); });
      } else if (by === 'Price · high to low') {
        out.sort(function (a, b) { return num(b, 'data-sw-sort-price') - num(a, 'data-sw-sort-price'); });
      } else if (by === 'Area · largest first') {
        out.sort(function (a, b) { return num(b, 'data-sw-sort-area') - num(a, 'data-sw-sort-area'); });
      } else if (by === 'Price per m²') {
        out.sort(function (a, b) {
          return (num(a, 'data-sw-sort-price') / Math.max(1, num(a, 'data-sw-sort-area')))
               - (num(b, 'data-sw-sort-price') / Math.max(1, num(b, 'data-sw-sort-area')));
        });
      }
      return out;
    }

    function light(view, card) {
      cardsIn(view).forEach(function (c) { c.classList.toggle('is-on', c === card); });
    }

    function paint() {
      var PAGE = PAGE_OF[state.view];
      var pane = panes[state.view];

      Object.keys(panes).forEach(function (v) { panes[v].hidden = v !== state.view; });

      var all = cardsIn(state.view);
      var shown = sorted(all.filter(matches));
      var pages = Math.max(1, Math.ceil(shown.length / PAGE));
      var cur = Math.min(state.page, pages - 1);
      state.page = cur;

      var from = cur * PAGE;
      var onPage = shown.slice(from, from + PAGE);

      /* В карточках и строках лист — это всё, что есть: лишние прячем
         атрибутом. На карте иначе: пин файла со второго листа обязан на ней
         стоять, иначе карта показывает не результат поиска, а его страницу.
         Поэтому там карточки вне листа прячутся классом — блок 9d считает
         пины по `hidden`, и класс оставляет их видимыми для него. */
      all.forEach(function (c) {
        var off = onPage.indexOf(c) === -1;
        if (state.view === 'map') {
          c.hidden = !matches(c);
          c.classList.toggle('is-off-sheet', off && matches(c));
        } else {
          c.hidden = off;
          c.classList.remove('is-off-sheet');
        }
      });

      /* Сортировка переставляет карточки в их СОБСТВЕННОМ контейнере. В виде
         карты это `.mapcards`, а не панель целиком: блок 9d ищет пины именно
         там, и вынос карточек на уровень выше оставлял карту без единого
         маркера, стоило перерисовать её после зума. */
      var box = state.view === 'map' ? $('.mapcards', pane) : pane;
      var already = $$('[data-sw-card]', box).filter(function (c) {
        return onPage.indexOf(c) > -1;
      });
      var same = already.length === onPage.length && already.every(function (c, i) {
        return c === onPage[i];
      });
      if (!same) { onPage.forEach(function (c) { box.appendChild(c); }); }

      state.sh = Math.min(state.sh, Math.max(0, onPage.length - 1));
      light(state.view, onPage[state.sh] || null);

      if (empty) { empty.hidden = shown.length !== 0; }
      pane.hidden = shown.length === 0 || pane.hidden;
      if (shown.length === 0) { Object.keys(panes).forEach(function (v) { panes[v].hidden = true; }); }
      if (pager) { pager.hidden = shown.length === 0; }

      /* The label is view-aware on purpose: an earlier build announced a pin
         number in the card view, where there is no map to point at. */
      if (label) {
        label.textContent = shown.length === 0 ? 'No files'
          : state.view === 'map'
            ? 'Pin ' + ((onPage[state.sh] || onPage[0] || {}).getAttribute
                ? (onPage[state.sh] || onPage[0]).getAttribute('data-pin') : 'P1')
              + ' · ' + shown.length + ' on this map'
            : shown.length + ' files · sheet ' + (cur + 1) + ' of ' + pages;
      }
      if (note) { note.textContent = NOTE_OF[state.view]; }
      if (showing) {
        showing.textContent = shown.length
          ? 'Showing ' + (from + 1) + '—' + (from + onPage.length) + ' of ' + shown.length
            + ' files · sheet ' + (cur + 1) + ' of ' + pages
          : 'No files on this sheet';
      }

      if (rail) {
        $$('.swpagenum', rail).forEach(function (b) { b.remove(); });
        for (var n = pages; n >= 1; n -= 1) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'swpagenum' + (n === cur + 1 ? ' is-on' : '');
          b.setAttribute('data-sw-page', String(n));
          b.setAttribute('aria-current', n === cur + 1 ? 'page' : 'false');
          b.textContent = String(n);
          rail.insertBefore(b, prev.nextSibling);
        }
      }
      if (prev) { prev.disabled = cur === 0; prev.classList.toggle('is-off', cur === 0); }
      if (next) {
        var end = cur >= pages - 1;
        next.disabled = end;
        next.classList.toggle('is-off', end);
      }

      /* И только теперь — карте. Она считает пины по видимости карточек,
         поэтому звать её раньше этой строки значит показать прошлый лист.
         Дважды: сразу и после того, как браузер разложит показанную панель —
         до раскладки холст ещё нулевой. */
      if (state.view === 'map') {
        var cv = document.getElementById('avava-map');
        if (cv) {
          cv.dispatchEvent(new CustomEvent('avava:refit'));
          requestAnimationFrame(function () { cv.dispatchEvent(new CustomEvent('avava:refit')); });
        }
      }
    }

    function reset() { state.page = 0; state.sh = 0; }

    /* Высота колонки со списком — ровно N рядов карточек плюс зазоры между
       ними. Считать обязательно, а не записывать числом в CSS: высота
       карточки зависит от ширины колонки, потому что фотография держит
       пропорцию 3:2. Промахнёшься на десяток пикселей — нижний край придётся
       на середину ряда, и человек увидит полосу фотографии без цены под ней.
       Карта берёт ту же величину, поэтому обе колонки кончаются на одной
       линии. */



    /* Карточки, которые сейчас на листе: в карте вне-листовые прячутся
       классом, поэтому `hidden` там недостаточно. */
    function onSheet(v) {
      return cardsIn(v).filter(function (c) {
        return !c.hidden && !c.classList.contains('is-off-sheet');
      });
    }

    /* Подпись слева — единственное, что меняется от наведения. Обновляем её
       текстом, а не перерисовкой: перерисовка переставляет карточки, и узел
       уходит из-под курсора. */
    function sayPin(v) {
      if (!label || v !== 'map') { return; }
      var list = onSheet(v);
      var card = list[state.sh] || list[0];
      var total = cardsIn(v).filter(function (c) { return !c.hidden; }).length;
      if (!card) { return; }
      label.textContent = 'Pin ' + card.getAttribute('data-pin') + ' · ' + total + ' on this map';
    }

    Object.keys(panes).forEach(function (v) {
      var pane = panes[v];
      pane.addEventListener('mouseover', function (e) {
        var card = e.target.closest('[data-sw-card]');
        if (!card || onSheet(v).indexOf(card) === -1) { return; }
        state.sh = onSheet(v).indexOf(card);
        light(v, card);
        sayPin(v);
      });
      pane.addEventListener('mouseleave', function () {
        state.sh = 0;
        light(v, onSheet(v)[0] || null);
        sayPin(v);
      });
    });

    viewBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        state.view = b.getAttribute('data-sw-view');
        reset();
        viewBtns.forEach(function (x) {
          var on = x === b;
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        paint();
      });
    });

    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        state.mode = t.getAttribute('data-sw-mode');
        reset();
        tabs.forEach(function (x) {
          var on = x === t;
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        if (tabNote) { tabNote.textContent = t.getAttribute('data-sw-tabnote') || ''; }
        paint();
      });
    });

    chips.forEach(function (ch) {
      ch.addEventListener('click', function () {
        state.chip = ch.getAttribute('data-sw-chip');
        reset();
        chips.forEach(function (x) {
          var on = x === ch;
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        paint();
      });
    });

    if (sortSel) {
      sortSel.addEventListener('change', function () {
        state.sort = sortSel.value;
        reset();
        paint();
      });
    }

    if (rail) {
      rail.addEventListener('click', function (e) {
        var b = e.target.closest('[data-sw-page]');
        if (!b) { return; }
        state.page = parseInt(b.getAttribute('data-sw-page'), 10) - 1;
        state.sh = 0;
        paint();
      });
    }
    if (prev) { prev.addEventListener('click', function () { if (state.page > 0) { state.page -= 1; state.sh = 0; paint(); } }); }
    if (next) { next.addEventListener('click', function () { state.page += 1; state.sh = 0; paint(); }); }

    if (clear) {
      clear.addEventListener('click', function () {
        state.mode = 'buy';
        state.chip = 'all';
        reset();
        tabs.forEach(function (x) {
          var on = x.getAttribute('data-sw-mode') === 'buy';
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        chips.forEach(function (x) {
          var on = x.getAttribute('data-sw-chip') === 'all';
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        paint();
      });
    }

    paint();
  }());

  /* ==========================================================================
     10. Currency & language switches
     ========================================================================== */

  (function currency() {
    var rates = CURRENCY_RATES;
    var symbols = CURRENCY_SYMBOLS;
    var priced = $$('[data-eur]');
    var langCur = $('[data-lang-cur]');

    function render(code) {
      priced.forEach(function (el) {
        var base = Number(el.getAttribute('data-eur'));
        var prefix = el.getAttribute('data-prefix') || '';
        var suffix = el.getAttribute('data-suffix') || '';
        setText(el, prefix + symbols[code] + groupDigits(base * rates[code]) + suffix);
      });
      /* Prices on the map pins are copies of the card text, so they have to be
         redrawn once the cards have been rewritten. */
      document.dispatchEvent(new CustomEvent('avava:currency', { detail: code }));
    }

    function label() {
      var lang = $('input[name="lang"]:checked');
      var cur = $('input[name="currency"]:checked');
      var langText = lang ? ($('label[for="' + lang.id + '"]') || {}).textContent : 'EN';
      setText(langCur, (langText || 'EN') + ' · ' + (cur ? cur.value : 'EUR'));
    }

    $$('input[name="currency"]').forEach(function (input) {
      input.addEventListener('change', function () {
        render(input.value);
        label();
      });
    });
    $$('input[name="lang"]').forEach(function (input) {
      input.addEventListener('change', label);
    });
  }());

  /* ==========================================================================
     11. Modals
     ========================================================================== */

  (function modals() {
    var openModals = [];

    function open(id) {
      var modal = document.getElementById(id);
      if (!modal) { return; }
      close();
      modal.classList.add('is-open');
      openModals.push(modal);
      var focusable = modal.querySelector('input, button, a');
      if (focusable) { focusable.focus(); }
    }

    function close() {
      openModals.forEach(function (m) { m.classList.remove('is-open'); });
      openModals = [];
      if (window.location.hash === '#signin' || window.location.hash === '#signup') {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }

    $$('[data-open-modal]').forEach(function (trigger) {
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        open(trigger.getAttribute('data-open-modal'));
      });
    });

    $$('[data-close-modal]').forEach(function (trigger) {
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        close();
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); }
    });
  }());
}());
