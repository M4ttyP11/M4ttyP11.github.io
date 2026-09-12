/* Shared behaviour for every page: theme toggle, mobile nav, footer year,
   scroll reveal, and the nav background that appears once you scroll.
   The theme itself is set by a small inline script in each <head> so the
   page never paints in the wrong colours first. */

(function () {
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      localStorage.setItem('theme', next);
    });
  }

  var nav = document.querySelector('.nav');
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  function setNav(open) {
    nav.dataset.open = open ? 'true' : 'false';
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  if (nav && navToggle && navLinks) {
    setNav(false);

    navToggle.addEventListener('click', function () {
      setNav(nav.dataset.open !== 'true');
    });

    // Anchor links jump within the same page, so the panel has to close itself.
    navLinks.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.dataset.open === 'true') {
        setNav(false);
        navToggle.focus();
      }
    });

    // Leaving the mobile breakpoint with the panel open would strand the state.
    window.matchMedia('(min-width: 721px)').addEventListener('change', function (e) {
      if (e.matches) setNav(false);
    });

    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 24);
    }, { passive: true });
  }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = document.querySelectorAll('.reveal');

  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  // Removes the curtain from the layout once every intro animation has settled.
  if (document.documentElement.dataset.loading === 'true') {
    setTimeout(function () {
      delete document.documentElement.dataset.loading;
    }, 2200);
  }

  /* ---------------------------------------------------------------------
     Carousels

     Markup is a plain stack of <figure> slides, which is what a visitor
     without JS sees. Here we collapse the stack into one frame and build the
     arrows, dots and counter. A slide whose image fails to load drops out,
     so the placeholder slots on the thinner pages cost nothing until the
     real images land.
     --------------------------------------------------------------------- */

  var ICON = {
    prev: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    next: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>'
  };

  function initCarousel(root) {
    if (root.dataset.carouselReady) return;
    root.dataset.carouselReady = '1';

    var frame = root.querySelector('.carousel-frame');
    if (!frame) return;

    var index = 0;
    var turnTimer = null;
    var TURN_MS = 580;

    /* The frame takes the arrow keys, so it has to be reachable by tab and
       announce itself as one region rather than a bare div. */
    frame.tabIndex = 0;
    frame.setAttribute('role', 'group');
    frame.setAttribute('aria-roledescription', 'carousel');
    frame.setAttribute('aria-label', 'Project images');

    /* The slides move onto one track. Sliding a single element is what makes
       the images travel past each other: the outgoing one leaves the frame on
       one side while the next arrives from the other, rather than the two
       swapping in place. */
    var track = document.createElement('div');
    track.className = 'carousel-track';
    Array.prototype.forEach.call(root.querySelectorAll('.carousel-slide'), function (s) {
      track.appendChild(s);
    });
    frame.insertBefore(track, frame.firstChild);

    var count = document.createElement('span');
    count.className = 'carousel-count';

    var prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'carousel-arrow prev';
    prev.setAttribute('aria-label', 'Previous image');
    prev.innerHTML = ICON.prev;

    var next = document.createElement('button');
    next.type = 'button';
    next.className = 'carousel-arrow next';
    next.setAttribute('aria-label', 'Next image');
    next.innerHTML = ICON.next;

    frame.appendChild(count);
    frame.appendChild(prev);
    frame.appendChild(next);

    var foot = document.createElement('div');
    foot.className = 'carousel-foot';
    var caption = document.createElement('p');
    caption.className = 'carousel-caption';
    caption.setAttribute('aria-live', 'polite');
    var dots = document.createElement('div');
    dots.className = 'carousel-dots';
    foot.appendChild(caption);
    foot.appendChild(dots);
    root.appendChild(foot);

    function slides() { return Array.prototype.slice.call(track.querySelectorAll('.carousel-slide')); }
    function photo(slide) { return slide.querySelector('.carousel-photo'); }

    /* Marks the real photograph so the styling and the measuring can tell it
       apart from anything else that ends up in a slide, and kills the native
       image drag, which otherwise fights the swipe handler. */
    function dressSlide(slide) {
      var img = slide.querySelector('img');
      if (!img || slide.dataset.dressed) return;
      slide.dataset.dressed = '1';
      img.classList.add('carousel-photo');
      img.setAttribute('draggable', 'false');
    }

    /* The frame ratio is fixed so the page does not jump on every slide, but a
       hard-coded 16/10 is a guess. Taking the narrowest ratio in this
       particular carousel means the tallest image fits with no bars at all and
       every other one only bars on the sides. Clamped, because one very tall
       or very wide photograph should not dictate an awkward frame. */
    var MIN_RATIO = 4 / 3;
    var MAX_RATIO = 16 / 9;

    function fitFrame() {
      var ratios = slides().map(function (s) {
        var img = photo(s) || s.querySelector('img');
        return img && img.naturalWidth ? img.naturalWidth / img.naturalHeight : 0;
      }).filter(Boolean);
      if (!ratios.length) return;
      var r = Math.min.apply(null, ratios);
      frame.style.aspectRatio = Math.min(MAX_RATIO, Math.max(MIN_RATIO, r)).toFixed(4);
    }

    // offset is a live drag in pixels, on top of whichever slide is current.
    function place(offset) {
      track.style.transform = 'translate3d(calc(' + (index * -100) + '% + ' + (offset || 0) + 'px), 0, 0)';
    }

    function show(i) {
      var list = slides();
      if (!list.length) return;

      /* The track has ends rather than wrapping. Sliding from the last image
         back to the first would otherwise rewind the whole strip past every
         slide in between, which reads as a glitch rather than a step. */
      var target = Math.min(Math.max(i, 0), list.length - 1);
      var changed = target !== index;
      index = target;

      if (changed) {
        root.classList.add('is-turning');
        clearTimeout(turnTimer);
        turnTimer = setTimeout(function () { root.classList.remove('is-turning'); }, TURN_MS);
      }

      place(0);

      list.forEach(function (s, n) {
        if (n === index) s.setAttribute('data-active', '');
        else s.removeAttribute('data-active');
        s.setAttribute('aria-hidden', n === index ? 'false' : 'true');
      });

      prev.disabled = index === 0;
      next.disabled = index === list.length - 1;

      var cap = list[index].querySelector('figcaption');
      var text = cap ? cap.textContent.trim() : '';
      if (changed) setTimeout(function () { caption.textContent = text; }, 220);
      else caption.textContent = text;

      count.textContent = (index + 1) + ' / ' + list.length;
      Array.prototype.forEach.call(dots.children, function (d, n) {
        d.setAttribute('aria-current', n === index ? 'true' : 'false');
      });
    }

    // Called at startup and again whenever a slide drops out.
    function sync() {
      var list = slides();
      root.classList.toggle('is-empty', list.length === 0);
      root.classList.toggle('is-single', list.length === 1);
      list.forEach(dressSlide);

      dots.innerHTML = '';
      if (list.length > 1) {
        list.forEach(function (s, n) {
          var d = document.createElement('button');
          d.type = 'button';
          d.className = 'carousel-dot';
          d.setAttribute('aria-label', 'Image ' + (n + 1));
          d.addEventListener('click', function () { show(n); });
          dots.appendChild(d);
        });
      }
      index = Math.min(index, Math.max(list.length - 1, 0));
      show(index);
    }

    /* An image that fails takes its slide with it, which is what the inline
       onerror does. error does not bubble, so the only way to hear about it
       here is a capture listener, and capture runs BEFORE the target's own
       handler: re-counting inline would count the slide that is about to go.
       Hence the deferral, which lets the removal happen first. */
    root.addEventListener('error', function () { setTimeout(sync, 0); }, true);
    slides().forEach(function (s) {
      var img = s.querySelector('img');
      if (img && img.complete && img.naturalWidth === 0) s.remove();
    });

    prev.addEventListener('click', function () { show(index - 1); });
    next.addEventListener('click', function () { show(index + 1); });

    frame.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
    });

    /* Drag. The track follows the pointer rather than waiting for release, so
       the gesture feels attached to the image. Pointer events cover touch and
       mouse in one path.

       Two guards. The axis is decided once, on the first few pixels of the
       gesture, and a vertical one is handed back to the page so a scroll that
       starts on the image still scrolls. And a drag past either end is damped
       instead of blocked, which shows the edge is there without the track
       tearing away from the frame. */
    var startX = 0, startY = 0, tracking = false, axis = '';
    var DECIDE_PX = 8;
    var COMMIT_PX = 50;
    var EDGE_DAMP = 0.32;

    frame.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (slides().length < 2) return;
      tracking = true; axis = '';
      startX = e.clientX; startY = e.clientY;
    });

    frame.addEventListener('pointermove', function (e) {
      if (!tracking) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;

      if (!axis) {
        if (Math.abs(dx) < DECIDE_PX && Math.abs(dy) < DECIDE_PX) return;
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (axis === 'x') {
          root.classList.add('is-dragging');
          frame.setPointerCapture(e.pointerId);
        } else {
          tracking = false;   // vertical, so it belongs to the page
          return;
        }
      }

      var last = slides().length - 1;
      if ((index === 0 && dx > 0) || (index === last && dx < 0)) dx *= EDGE_DAMP;
      place(dx);
    });

    function release(e) {
      if (!tracking) return;
      var wasX = axis === 'x';
      tracking = false; axis = '';
      root.classList.remove('is-dragging');
      if (!wasX) return;

      var dx = e.clientX - startX;
      if (Math.abs(dx) > COMMIT_PX) show(index + (dx < 0 ? 1 : -1));
      else place(0);   // did not travel far enough, so snap back
    }

    frame.addEventListener('pointerup', release);
    frame.addEventListener('pointercancel', release);

    /* A drag that ended on the image would otherwise fire a click on whatever
       is underneath when the pointer comes up. */
    frame.addEventListener('click', function (e) {
      if (root.classList.contains('is-dragging')) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    root.classList.add('is-ready');
    sync();

    fitFrame();
    slides().forEach(function (s) {
      var img = photo(s) || s.querySelector('img');
      if (img && !img.complete) img.addEventListener('load', fitFrame, { once: true });
    });
  }

  function initCarousels(scope) {
    (scope || document).querySelectorAll('[data-carousel]').forEach(initCarousel);
  }

  initCarousels(document);
})();

/* =========================================================================
   Circuit view

   Scroll position drives a lap. The corner dots are placed on real corners
   of the path, and their position along the lap is found once by walking a
   lookup table of sampled points. Scroll is then mapped through those
   corners piecewise, so the current point is exactly on a dot when its
   section reaches the top of the viewport, whatever the section heights are.
   Reaching the footer completes the lap.

   The car does not move. It sits at the SVG origin pointing up the screen,
   and the track group takes the inverse transform, so the circuit slides and
   turns underneath it: a window onto the part of the lap you are in rather
   than the whole map.

   Two shapes of track run through the same code. The home page carries a
   hand-drawn closed circuit in its markup. A project page has no circuit of
   its own, so one is generated from its <h2> headings at load: an open path
   from pit exit to the flag, an out lap rather than a lap. Everything below
   works off the markup inside the strip and a data-mode, so neither case
   knows about the other.
   ========================================================================= */

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ---------------------------- the component ---------------------------
     Takes a populated .circuit element. Parts are found by class, not id,
     so a generated strip and the hand-written one are interchangeable. */
  function initCircuit(root) {
    var path = root.querySelector('.circuit-kerb');
    var line = root.querySelector('.circuit-line');
    var win = root.querySelector('.circuit-window');
    var world = root.querySelector('.circuit-world');
    var label = root.querySelector('.circuit-label');
    var next = root.querySelector('.circuit-next');
    var nextName = root.querySelector('.circuit-next-v');
    var dots = Array.prototype.slice.call(root.querySelectorAll('.circuit-dots circle'));
    if (!path || !path.getTotalLength || !dots.length) return;

    // A lap closes on itself and wraps at the seam. An out lap does not: it
    // starts at the pit exit and ends at the flag, so distances are clamped
    // rather than taken modulo, and nothing resets at the end.
    var closed = root.dataset.mode !== 'outlap';

    var STEPS = 900;
    // How much road is lit either side of the car, in track units. The frame
    // is 84 units ahead of the car and 36 behind, so both run past its edges
    // and the ends of the dash never show.
    var WIN_AHEAD = 108;
    var WIN_BACK = 60;
    var total = 0;
    var stops = [];
    var keys = [];
    var maxScroll = 1;
    var ready = false;
    var hovering = null;
    var currentIndex = -1;
    var nextIndex = null;
    var FINISH = -1;   // the chip past the last corner of an out lap
    // Heading in degrees, eased toward the tangent rather than snapped to it.
    var heading = null;

    // Distance along the path, wrapped on a closed lap and clamped on an
    // open one, which is the only place the two shapes differ geometrically.
    function at(d) {
      if (closed) return path.getPointAtLength(((d % total) + total) % total);
      return path.getPointAtLength(Math.min(total, Math.max(0, d)));
    }

    /* --------------------------- track furniture ---------------------------
       Kerbs, tyre barriers and the checkered line are not in the markup.
       They are read off the path once at build, so the hand-drawn circuit and
       a generated out lap get the same furniture without either of them
       carrying the geometry a second time.

       The path is walked at a fixed step, and the turn per unit of length at
       each sample gives both the radius of the road there and which side the
       inside of the corner is on. Tighter than R40 is a corner and takes a
       kerb on the inside. Tighter than R25 also takes a tyre barrier round
       the outside, which is where they go in life. Straights take nothing, so
       the strip stays quiet between corners. */
    var SVGNS = 'http://www.w3.org/2000/svg';
    var ROAD = 5.2;                 // road width, matching the stroke in CSS
    var KERB_AT = ROAD / 2 + 0.45;  // kerb centreline, just off the road edge
    var WALL_AT = ROAD / 2 + 1.6;   // barriers, set back from the edge
    var CORNER_R = 40;              // tighter than this is a corner
    var TIGHT_R = 18;               // tighter than this also gets barriers
    var DECO_STEP = 1.2;            // sampling step, in track units
    var TYRE_GAP = 1.35;            // spacing of tyres along a barrier
    var WALL_IN = 0.14;             // fraction of a corner left bare each end
    var GRID_SLOTS = 8;             // boxes behind the line, four to a side
    var GRID_LEAD = 3.4;            // line back to the first box
    var GRID_STAGGER = 2.3;         // one box to the next, alternating sides
    var BOX_ARM = 1.2, BOX_W = 2.3, BOX_OFF = 1.25;
    var runs = [];                  // one entry per corner, for the fade

    function el(name, attrs) {
      var node = document.createElementNS(SVGNS, name);
      for (var k in attrs) node.setAttribute(k, attrs[k]);
      return node;
    }

    function wrapPi(a) {
      while (a > Math.PI) a -= 2 * Math.PI;
      while (a < -Math.PI) a += 2 * Math.PI;
      return a;
    }

    // One corner: a kerb polyline down the inside, and on the quick ones a
    // line of tyres spaced evenly along the outside.
    function addCorner(pts, ang, a, b, side, radius, from, to, deco) {
      var g = el('g', { 'class': 'circuit-corner' });
      var kerb = '', wall = [], i;
      for (i = a; i <= b; i++) {
        var nx = -Math.sin(ang[i]) * side, ny = Math.cos(ang[i]) * side;
        kerb += (i === a ? 'M ' : ' L ') +
                n2(pts[i].x + nx * KERB_AT) + ' ' + n2(pts[i].y + ny * KERB_AT);
        wall.push({ x: pts[i].x - nx * WALL_AT, y: pts[i].y - ny * WALL_AT });
      }
      // Three passes over the same line: a grey edge, white over it, then red
      // dashes on top. That is a red and white kerb in three elements rather
      // than one per block of colour, and the edge is what stops the white
      // half of it vanishing into a light page.
      g.appendChild(el('path', { 'class': 'circuit-rumble-edge', d: kerb }));
      g.appendChild(el('path', { 'class': 'circuit-rumble-base', d: kerb }));
      g.appendChild(el('path', { 'class': 'circuit-rumble', d: kerb }));

      // Only the corners quick enough to need a barrier get one, only round
      // the outside, and only across the middle of the corner: a wall run
      // end to end down every bend turns the whole lap into a fence.
      if (radius < TIGHT_R) {
        var segs = [], len = 0;
        for (i = 1; i < wall.length; i++) {
          segs.push(Math.hypot(wall[i].x - wall[i - 1].x, wall[i].y - wall[i - 1].y));
          len += segs[i - 1];
        }
        var stop = len * (1 - WALL_IN);
        var run = 0, mark = len * WALL_IN;
        for (i = 1; i < wall.length; i++) {
          while (segs[i - 1] > 0 && mark <= run + segs[i - 1] && mark <= stop) {
            var t = (mark - run) / segs[i - 1];
            g.appendChild(el('circle', {
              'class': 'circuit-tyre',
              cx: n2(wall[i - 1].x + (wall[i].x - wall[i - 1].x) * t),
              cy: n2(wall[i - 1].y + (wall[i].y - wall[i - 1].y) * t),
              r: '.42'
            }));
            mark += TYRE_GAP;
          }
          run += segs[i - 1];
        }
      }

      runs.push({ g: g, from: from, to: to, far: null });
      deco.appendChild(g);
    }

    // Where the lap begins: a checkered line, and on a closed lap the grid
    // boxes behind it. An out lap starts at a pit exit and gets neither.
    function startLine() {
      var here = closed ? 0 : total;
      var p = at(here);
      var q = at(closed ? 1.5 : total - 1.5);
      var a = closed ? Math.atan2(q.y - p.y, q.x - p.x)
                     : Math.atan2(p.y - q.y, p.x - q.x);
      // The line carries its own place and heading, so the squares are laid
      // out about the origin. The grid boxes each carry their own, so they
      // are siblings of that group rather than children of it.
      var g = el('g', { 'class': 'circuit-flag' });
      var line = el('g', {
        transform: 'translate(' + n2(p.x) + ' ' + n2(p.y) + ') ' +
                   'rotate(' + n2(a * 180 / Math.PI) + ')'
      });
      g.appendChild(line);
      var cols = 6, cell = ROAD / cols;
      for (var r = 0; r < 2; r++) {
        for (var c = 0; c < cols; c++) {
          line.appendChild(el('rect', {
            'class': (r + c) % 2 ? 'circuit-flag-b' : 'circuit-flag-a',
            x: n2(-cell + r * cell), y: n2(-ROAD / 2 + c * cell),
            width: n2(cell), height: n2(cell)
          }));
        }
      }

      // Staggered, the way a grid is: every box is half a row further back
      // than the one before and on the other side of the road. Held to half
      // the road each, so two boxes never meet in the middle.
      if (closed) {
        for (var i = 0; i < GRID_SLOTS; i++) {
          var back = GRID_LEAD + i * GRID_STAGGER;
          var b = at(-back), f = at(-back + 1);
          var box = el('g', {
            transform: 'translate(' + n2(b.x) + ' ' + n2(b.y) + ') rotate(' +
                       n2(Math.atan2(f.y - b.y, f.x - b.x) * 180 / Math.PI) + ')'
          });
          // Not a closed box. A grid box is painted as the front of one: a
          // line across the slot with a short arm trailing back off each end,
          // so the open side faces the way the car goes.
          var y0 = (i % 2 ? 1 : -1) * BOX_OFF - BOX_W / 2, y1 = y0 + BOX_W;
          box.appendChild(el('path', {
            'class': 'circuit-box',
            d: 'M ' + n2(-BOX_ARM) + ' ' + n2(y0) + ' L 0 ' + n2(y0) +
               ' L 0 ' + n2(y1) + ' L ' + n2(-BOX_ARM) + ' ' + n2(y1)
          }));
          g.appendChild(box);
        }
      }
      return g;
    }

    function furnish() {
      var old = root.querySelector('.circuit-deco');
      if (old) old.parentNode.removeChild(old);
      var deco = el('g', { 'class': 'circuit-deco' });
      runs = [];

      var n = Math.max(16, Math.round(total / DECO_STEP));
      var h = total / n;
      // A closed lap's last sample joins back to the first. An open one needs
      // the end point as a sample of its own.
      var m = closed ? n : n + 1;
      var pts = [], ang = [], turn = [], i;
      for (i = 0; i < m; i++) pts.push(at(i * h));
      for (i = 0; i < m - 1; i++) {
        ang.push(Math.atan2(pts[i + 1].y - pts[i].y, pts[i + 1].x - pts[i].x));
      }
      ang.push(closed ? Math.atan2(pts[0].y - pts[m - 1].y, pts[0].x - pts[m - 1].x)
                      : ang[m - 2]);
      for (i = 0; i < m; i++) {
        var prev = i === 0 ? (closed ? m - 1 : 0) : i - 1;
        turn.push(wrapPi(ang[i] - ang[prev]) / h);
      }

      // Consecutive samples turning the same way are one corner. The seam of
      // a closed lap sits on the start/finish straight, so no run is cut in
      // half by it.
      i = 0;
      while (i < m) {
        if (Math.abs(turn[i]) < 1 / CORNER_R) { i++; continue; }
        var a = i, side = turn[i] > 0 ? 1 : -1, sum = 0, count = 0;
        while (i < m && Math.abs(turn[i]) >= 1 / CORNER_R &&
               (turn[i] > 0 ? 1 : -1) === side) {
          sum += Math.abs(turn[i]); count++; i++;
        }
        var b = i - 1;
        // Three samples is under four units of road: a kink, not a corner.
        if (b - a < 2) continue;
        addCorner(pts, ang, a, b, side, count / sum, a * h, b * h, deco);
      }

      // The line and its grid belong to the road under them, so they fade on
      // the same terms as a corner does. The stretch they cover runs back
      // from the seam, which on a closed lap is the last of the lap.
      var flag = startLine();
      var lead = GRID_LEAD + GRID_SLOTS * GRID_STAGGER + BOX_ARM;
      runs.push({
        g: flag,
        from: closed ? total - lead : total - ROAD,
        to: total,
        far: null
      });
      deco.appendChild(flag);
      world.appendChild(deco);
    }

    // Whether any of a stretch of road is inside the lit window, so its
    // furniture can dim along with the far side of the lap.
    function inWindow(s0, s1, d) {
      if (!closed) return s1 > d - WIN_BACK && s0 < d + WIN_AHEAD;
      var a = ((s0 - d) % total + total) % total;
      var b = ((s1 - d) % total + total) % total;
      var back = total - WIN_BACK;
      if (a > b) return true;   // the corner is wrapped around the car
      return a < WIN_AHEAD || b < WIN_AHEAD || a > back || b > back;
    }

    // Under the mobile breakpoint the widget is display:none, and a hidden
    // SVG can report a length of zero, so setup waits until it can measure.
    function build() {
      total = path.getTotalLength();
      if (!total) return false;

      var lut = [];
      for (var i = 0; i <= STEPS; i++) lut.push(path.getPointAtLength(total * i / STEPS));

      stops = dots.map(function (dot, idx) {
        var cx = parseFloat(dot.getAttribute('cx'));
        var cy = parseFloat(dot.getAttribute('cy'));
        var best = 0, bestD = Infinity;
        for (var i = 0; i <= STEPS; i++) {
          var dx = lut[i].x - cx, dy = lut[i].y - cy, d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; best = i; }
        }
        return {
          dot: dot,
          el: document.querySelector(dot.dataset.target),
          name: dot.dataset.name,
          // The first dot sits on the start/finish line, where a closed loop
          // meets itself and the nearest sample could just as easily be the
          // last one. On an out lap it is the pit exit, which is the start
          // of the path either way.
          f: idx === 0 ? 0 : best / STEPS,
          scroll: 0
        };
      });

      // Both overlay layers trace the same track, so they take their
      // geometry from the one copy in the markup.
      var d = path.getAttribute('d');
      line.setAttribute('d', d);
      win.setAttribute('d', d);

      furnish();
      return true;
    }

    // Held below 1 so there is always scroll left between the last corner and
    // the line, otherwise the lap ends a corner short of finishing.
    var CAP = 0.985;
    // Two corners closer together than this are one corner as far as the eye
    // is concerned, and a pair on the same value would divide by zero below.
    var MIN = 0.004;
    // The least scroll a corner should get to itself, so the end of the page
    // is not three corners in a row.
    var ROOM = 0.03;

    function measure() {
      maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      stops.forEach(function (s, i) {
        if (i === 0 || !s.el) { s.scroll = 0; s.placed = true; return; }
        var top = s.el.getBoundingClientRect().top + window.scrollY - 80;
        // A section near the foot of the page starts below the last
        // scrollable pixel, so scrolling can never put it at the top of the
        // viewport and it has no anchor of its own. It is spread below
        // instead.
        s.placed = top <= maxScroll;
        s.scroll = s.placed ? Math.min(CAP, Math.max(0, top / maxScroll)) : -1;
      });

      // A corner can also have an anchor of its own so late in the page that
      // the corners after it, and the run home, have nothing left. Every one
      // of them wants at least ROOM of the scroll, so a corner that would
      // leave less than that behind it gives up its anchor and is spread with
      // them.
      var n = stops.length;
      for (var m = 1; m < n; m++) {
        if (stops[m].placed && stops[m].scroll > CAP - (n - m) * ROOM) {
          stops[m].placed = false;
          stops[m].scroll = -1;
        }
      }

      /* Corners with nowhere of their own to go.

         A short page, which is most project pages, cannot put any of its
         headings at the top of the viewport, and a long one usually cannot
         manage the last two or three. Those corners are spread evenly over
         the scroll left to them: from the last corner that did get a place of
         its own, up to the next one that does, or to the cap. The run is
         shared with the stretch home, so the flag keeps a share of the scroll
         rather than landing on top of the last corner. */
      for (var i = 1; i < stops.length; i++) {
        var floor = stops[i - 1].scroll;
        if (stops[i].placed && stops[i].scroll >= floor + MIN) continue;
        var j = i;
        while (j + 1 < stops.length &&
               (!stops[j + 1].placed || stops[j + 1].scroll < floor + MIN * (j + 2 - i))) j++;
        var run = j - i + 1;
        var end = j + 1 < stops.length ? stops[j + 1].scroll : CAP;
        var step = (end - floor) / (run + 1);
        for (var k = 0; k < run; k++) stops[i + k].scroll = floor + step * (k + 1);
        i = j;
      }

      keys = stops.map(function (s) { return { s: s.scroll, f: s.f }; });
      // The bottom of the page is the line, so the run from the last corner
      // to it is the final stretch of scroll.
      keys.push({ s: 1, f: 1 });
    }

    function lapAt(p) {
      for (var i = 0; i < keys.length - 1; i++) {
        var a = keys[i], b = keys[i + 1];
        if (p <= b.s) {
          var span = b.s - a.s;
          return span > 0 ? a.f + (b.f - a.f) * ((p - a.s) / span) : b.f;
        }
      }
      return 1;
    }

    function render() {
      if (!ready) return;
      var p = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      var f = lapAt(p);

      // A dash of length L starting at distance a along the path. On a
      // closed lap the gap is the rest of the loop, so the dash wraps at the
      // seam. On an open one the gap is made long enough that the pattern
      // cannot repeat back onto the track.
      var d = total * f;
      var lit = WIN_BACK + WIN_AHEAD;
      var gap = closed ? total - lit : total * 2;
      win.style.strokeDasharray = lit + ' ' + gap;
      win.style.strokeDashoffset = WIN_BACK - d;
      // The accent only trails behind the car, and only as far as the lap
      // has actually run, so nothing is lit at the start that has not been
      // driven.
      var back = Math.min(WIN_BACK, d);
      line.style.strokeDasharray = back + ' ' + (closed ? total - back : total * 2);
      line.style.strokeDashoffset = back - d;

      // The car is fixed at the origin pointing up the screen, so the world
      // carries the inverse: put the current point at the origin, then turn
      // its tangent to face up.
      var a = at(d);
      world.setAttribute('transform',
        'rotate(' + (-90 - headingAt(d)).toFixed(2) + ') ' +
        'translate(' + (-a.x).toFixed(2) + ' ' + (-a.y).toFixed(2) + ')');

      // Kerbs and barriers belong to the road they sit beside, so they dim
      // with it once their corner is out of the lit window. Only the ones
      // that change are touched, so a frame usually writes nothing here.
      for (var r = 0; r < runs.length; r++) {
        var far = !inWindow(runs[r].from, runs[r].to, d);
        if (far === runs[r].far) continue;
        runs[r].far = far;
        if (far) runs[r].g.setAttribute('data-far', 'true');
        else runs[r].g.removeAttribute('data-far');
      }

      var idx = 0;
      for (var i = 0; i < stops.length; i++) if (p >= stops[i].scroll - 0.0005) idx = i;
      // Crossing the line completes a lap, so start/finish takes the
      // highlight back off the last corner. An out lap has nowhere to go
      // back to, so the last corner keeps it.
      if (closed && f > 0.99) idx = 0;
      if (idx !== currentIndex) {
        currentIndex = idx;
        stops.forEach(function (s, i) {
          if (i === idx) s.dot.setAttribute('data-current', 'true');
          else s.dot.removeAttribute('data-current');
        });
        if (!hovering) label.textContent = stops[idx].name;
      }

      // The chip names where you are going, so past the line on a lap it
      // points at the first corner of the next one rather than back at
      // start/finish. An out lap runs out of corners instead, and what is
      // left ahead is the flag.
      var nxt = idx + 1;
      if (nxt >= stops.length) nxt = closed ? 0 : FINISH;
      if (nxt !== nextIndex) {
        nextIndex = nxt;
        nextName.textContent = nxt === FINISH ? 'Finish' : stops[nxt].name;
      }
    }

    /* Heading, smoothed twice over.

       The tangent is measured as a chord across SAMPLE units either side of
       the point rather than forward from it. A forward-only chord lags the
       corner and shakes on the tight arcs, where the path curves inside its
       own sample. The chord is then eased toward with a time constant, which
       takes the step out of the two places the raw tangent jumps: the join
       between two path segments, and the moment scroll stops mid-arc.

       The ease is time-based, not a fixed fraction per frame. A fraction per
       frame makes the turn take longer on a throttled tab, which is exactly
       where the page is when it is not the front window.

       Easing an angle needs the target unwrapped first, or a turn through
       +/-180 runs the long way round: 179 to -179 is two degrees of road and
       358 degrees of spin. */
    var SAMPLE = 6;
    var TAU = 90;     // ms to cover about two thirds of the remaining angle
    var SNAP = 45;    // degrees; past this it is a jump, not a corner
    var last = 0;

    function headingAt(d) {
      var b = at(d + SAMPLE);
      var c = at(d - SAMPLE);
      var target = Math.atan2(b.y - c.y, b.x - c.x) * 180 / Math.PI;
      var now = performance.now();
      var dt = Math.min(100, now - last);
      last = now;
      if (heading === null) { heading = target; return heading; }

      while (target - heading > 180) target -= 360;
      while (target - heading < -180) target += 360;
      var delta = target - heading;
      // Anchor clicks, a resize and the load remeasure all move the lap much
      // further than a corner does. Easing those spins the world for a second
      // before it catches up, so take them in one step.
      if (Math.abs(delta) > SNAP) { heading = target; return heading; }
      // Settled. Land exactly on the target so the strip is not left a
      // hundredth of a degree short, asking for frames forever.
      if (Math.abs(delta) < 0.02) { heading = target; return heading; }
      heading += delta * (1 - Math.exp(-dt / TAU));
      // Unwrapping is cumulative, so a heading left to run would drift a full
      // turn per lap and keep going. The rotation is modular, so fold it back.
      if (heading > 180) heading -= 360;
      else if (heading < -180) heading += 360;
      // Still turning, so keep the frames coming: scroll has stopped firing
      // events by now and nothing else would ask for one.
      schedule();
      return heading;
    }

    var frame = 0;
    function schedule() {
      if (frame) return;
      frame = requestAnimationFrame(function () { frame = 0; render(); });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('mouseenter', function () {
        hovering = dot;
        label.textContent = dot.dataset.name;
      });
      dot.addEventListener('mouseleave', function () {
        hovering = null;
        if (currentIndex > -1) label.textContent = stops[currentIndex].name;
      });
      dot.addEventListener('click', function () {
        var el = document.querySelector(dot.dataset.target);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    next.addEventListener('click', function () {
      // Past the last corner of an out lap there is no section left to jump
      // to, only the run to the flag at the foot of the page.
      if (nextIndex === FINISH) {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
        return;
      }
      var s = stops[nextIndex === null ? 1 % stops.length : nextIndex];
      var el = s && document.querySelector(s.dot.dataset.target);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    function start() {
      if (ready) return;
      if (!build()) return;
      ready = true;
      measure();
      render();
      root.setAttribute('data-ready', 'true');
    }

    window.addEventListener('scroll', schedule, { passive: true });

    var resizeTimer;
    function remeasure() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (!ready) { start(); return; }
        measure();
        currentIndex = -1;
        render();
      }, 150);
    }

    window.addEventListener('resize', remeasure);

    // Lazy images load as you scroll and change the page height under the
    // mapping, which leaves the lap running behind the sections. Barely
    // showed on the old minimap, obvious now the view is zoomed in.
    if (window.ResizeObserver) new ResizeObserver(remeasure).observe(document.body);

    // Images and the intro animation both change the page height, so measure
    // again once everything has settled.
    window.addEventListener('load', function () {
      if (!ready) start();
      setTimeout(function () { if (ready) { measure(); currentIndex = -1; render(); } }, 400);
    });

    start();
  }

  /* ------------------------------- out laps ------------------------------
     A project page carries two to six <h2> headings, no section ids and no
     circuit of its own, so a hand-drawn track per page does not scale. The
     track is generated instead: a corner per heading, joined by a plain bend
     each side so a two-heading page still gets a shape worth looking at.

     Open, not closed. A project page is a detour off the circuit, so it gets
     an out lap: pit exit to the flag, in its own colour, and the car never
     comes back round to where it started. */

  // The shape is stable for a given page: the same title always seeds the
  // same track, so a reload is the same circuit rather than a new one.
  function seedOf(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function randomFrom(seed) {
    var s = seed || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  // Track units per leg. The window is 92 units tall, so a leg of about this
  // length puts a corner or two in sight at a time. A fixed total length
  // instead would cram a six-heading page into a slalom and stretch a
  // two-heading one into two straights.
  var LEG = 54;

  // Corners alternate left and right, so the track meanders instead of
  // spiralling in on itself, and every marked corner has a plain bend either
  // side of it. Vertex 0 is the pit exit, the last is the flag, and the
  // marked corners are the even indices between.
  /* The shape of an out lap.

     Not a random walk on the heading: that either coils into a spiral or, once
     coiling is forbidden, ping-pongs left and right like a slalom. A track
     goes somewhere. So the walk runs along one axis and wanders across it,
     which cannot cross itself, holds a frame the strip can show, and gives
     the mix a road actually has: a couple of long sweeps, a few real corners,
     the odd kink. */
  function vertices(count, rand) {
    var pts = [{ x: 0, y: 0 }];
    var along = 0, across = 0;
    var way = rand() < 0.5 ? 1 : -1;
    // The corridor is about as wide as the track is long, so the shape that
    // comes out roughly fills a square rather than a ribbon.
    var wall = count * 24;
    for (var i = 0; i < count; i++) {
      // How far up the corridor, and how far across. The across step is
      // weighted to the small end, so most corners are turns and a few are
      // the big changes of direction that give a lap its shape.
      along += 30 + rand() * 78;
      across += way * wall * (0.22 + Math.pow(rand(), 1.5) * 0.85);
      // Turned back at the walls, and often enough in between that the track
      // does not simply drift off across the corridor.
      if (Math.abs(across) > wall) { across = (across > 0 ? 1 : -1) * wall; way = -way; }
      else if (rand() > 0.62) way = -way;
      pts.push({ x: across, y: -along });
    }
    // Scale so every leg is about LEG long whatever the heading count, which
    // is what keeps the corners the same size on every page.
    var run = 0;
    for (var m = 1; m < pts.length; m++) run += Math.hypot(pts[m].x - pts[m - 1].x, pts[m].y - pts[m - 1].y);
    var k = (count * LEG) / run;
    return pts.map(function (q) { return { x: q.x * k, y: q.y * k }; });
  }

  function n2(v) { return (Math.round(v * 100) / 100).toString(); }

  // Rounds every interior vertex into an arc of the largest radius the two
  // adjacent legs allow, and reports the apex of each, which is where a
  // corner dot belongs.
  function roundedPath(pts, rand) {
    var d = 'M ' + n2(pts[0].x) + ' ' + n2(pts[0].y);
    var apex = [];
    for (var i = 1; i < pts.length - 1; i++) {
      var a = pts[i - 1], b = pts[i], c = pts[i + 1];
      var l1 = Math.hypot(b.x - a.x, b.y - a.y);
      var l2 = Math.hypot(c.x - b.x, c.y - b.y);
      var u1 = { x: (b.x - a.x) / l1, y: (b.y - a.y) / l1 };
      var u2 = { x: (c.x - b.x) / l2, y: (c.y - b.y) / l2 };
      // Deviation from straight on, so a tangent length of t gives a radius
      // of t / tan(turn / 2).
      var turn = Math.acos(Math.min(1, Math.max(-1, u1.x * u2.x + u1.y * u2.y)));
      // Corners of one radius read as a template. This runs from a tight one
      // to a long sweep, held clear of both legs so two corners never eat
      // into each other.
      var t = Math.min(l1, l2) * (0.2 + rand() * 0.24);
      var r = t / Math.tan(turn / 2);
      // A hairpin taken at this radius is a kink in the road rather than a
      // corner, so tight ones are opened out as far as the legs allow.
      if (r < 11) {
        t = Math.min(11 * Math.tan(turn / 2), Math.min(l1, l2) * 0.46);
        r = t / Math.tan(turn / 2);
      }
      var A = { x: b.x - u1.x * t, y: b.y - u1.y * t };
      var B = { x: b.x + u2.x * t, y: b.y + u2.y * t };
      var sweep = (u1.x * u2.y - u1.y * u2.x) > 0 ? 1 : 0;
      d += ' L ' + n2(A.x) + ' ' + n2(A.y) +
           ' A ' + n2(r) + ' ' + n2(r) + ' 0 0 ' + sweep + ' ' + n2(B.x) + ' ' + n2(B.y);
      // The arc bulges toward the vertex it replaced, so its apex sits on the
      // line from the chord midpoint to that vertex.
      var m = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
      var half = Math.hypot(B.x - A.x, B.y - A.y) / 2;
      var h = r - Math.sqrt(Math.max(0, r * r - half * half));
      var ml = Math.hypot(b.x - m.x, b.y - m.y) || 1;
      apex.push({ x: m.x + (b.x - m.x) / ml * h, y: m.y + (b.y - m.y) / ml * h });
    }
    var end = pts[pts.length - 1];
    d += ' L ' + n2(end.x) + ' ' + n2(end.y);
    return { d: d, apex: apex };
  }

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function buildOutLap() {
    var main = document.getElementById('main') || document.querySelector('main');
    if (!main) return;
    var heads = Array.prototype.slice.call(main.querySelectorAll('h2'));
    if (heads.length < 2) return;

    var rand = randomFrom(seedOf(document.title));
    var pts = vertices(heads.length * 2 + 2, rand);
    var track = roundedPath(pts, rand);

    // Marked corners are the even interior vertices, so each heading gets a
    // corner with a plain bend before and after it.
    var marks = [{
      x: pts[0].x, y: pts[0].y,
      name: 'Pit exit',
      target: '#' + (main.id || 'main')
    }];
    heads.forEach(function (h, i) {
      if (!h.id) h.id = 'out-' + (i + 1);
      var a = track.apex[i * 2 + 1];
      marks.push({
        x: a.x, y: a.y,
        name: h.textContent.replace(/\s+/g, ' ').trim(),
        target: '#' + h.id
      });
    });

    var svg =
      '<button class="circuit-next" type="button" tabindex="-1">' +
        '<span class="circuit-next-k">Next</span>' +
        '<span class="circuit-next-v"></span>' +
      '</button>' +
      '<svg class="circuit-map" viewBox="-24 -84 48 120" role="presentation" focusable="false"' +
      ' preserveAspectRatio="xMidYMid meet">' +
        '<g class="circuit-world">' +
          '<path class="circuit-kerb" d="' + track.d + '"/>' +
          '<path class="circuit-window"/>' +
          '<path class="circuit-line"/>' +
          '<g class="circuit-dots">' +
            marks.map(function (m) {
              return '<circle data-target="' + esc(m.target) + '" data-name="' + esc(m.name) +
                     '" cx="' + n2(m.x) + '" cy="' + n2(m.y) + '" r="1.1"/>';
            }).join('') +
          '</g>' +
        '</g>' +
        '<g class="circuit-car" transform="rotate(-90) scale(1.65)">' +
          '<rect class="car-part" x="-1.16" y="-.66" width=".18" height="1.32" rx=".05"/>' +
          '<rect class="car-part" x="-.94" y="-.7" width=".52" height=".3" rx=".09"/>' +
          '<rect class="car-part" x="-.94" y=".4" width=".52" height=".3" rx=".09"/>' +
          '<rect class="car-part" x=".4" y="-.66" width=".4" height=".26" rx=".08"/>' +
          '<rect class="car-part" x=".4" y=".4" width=".4" height=".26" rx=".08"/>' +
          '<rect class="car-part" x=".96" y="-.62" width=".16" height="1.24" rx=".04"/>' +
          '<path class="car-body" d="M 1.02 .11 L .55 .16 L .28 .24 L .05 .3' +
          ' L -.15 .44 L -.78 .44 L -.98 .3 L -.98 -.3 L -.78 -.44 L -.15 -.44' +
          ' L .05 -.3 L .28 -.24 L .55 -.16 L 1.02 -.11 Z"/>' +
          '<rect class="car-glass" x="-.34" y="-.15" width=".3" height=".3" rx=".1"/>' +
          '<circle class="car-glass" cx=".14" cy="0" r=".16"/>' +
        '</g>' +
      '</svg>' +
      '<p class="circuit-label">Pit exit</p>';

    var root = document.createElement('aside');
    root.className = 'circuit';
    root.id = 'circuit';
    root.setAttribute('aria-hidden', 'true');
    root.dataset.mode = 'outlap';
    root.innerHTML = svg;
    document.body.appendChild(root);
    return root;
  }

  var existing = document.getElementById('circuit');
  var strip = existing || buildOutLap();
  if (strip) initCircuit(strip);
})();
