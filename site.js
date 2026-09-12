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

  /* ---------------------------------------------------------------------
     Project dialog

     Every project link on the index points at a real page under /projects/.
     Where the browser can fetch that page, we pull its content into a dialog
     instead of navigating, so the visitor never loses their scroll position.
     Everywhere else, and for modified clicks, the link just works as a link:
     nothing below ever swallows a click it cannot service.
     --------------------------------------------------------------------- */

  var modal = document.getElementById('projModal');
  if (!modal || !window.fetch || !window.DOMParser || typeof modal.showModal !== 'function') return;

  var modalBody = document.getElementById('modalBody');
  var modalTitle = document.getElementById('modalTitle');
  var modalFull = document.getElementById('modalFull');
  var modalClose = document.getElementById('modalClose');

  var cache = {};          // url -> parsed content, so prev/next is instant
  var current = null;      // url currently shown
  var pushed = false;      // did we add a history entry we still owe a back()?
  var opener = null;       // element to hand focus back to on close

  // Opening a project rewrites the address bar, which would otherwise change
  // what every later relative link resolves against. Pin the index URL now and
  // resolve against that, so projects/x.html never becomes projects/projects/x.
  var BASE = location.href.split('#')[0].split('?')[0];
  function resolve(href) { return new URL(href, BASE).href; }

  function isProjectLink(a) {
    if (!a) return false;
    var href = a.getAttribute('href') || '';
    return href.indexOf('projects/') === 0 && href.slice(-5) === '.html';
  }

  // A plain left click with no modifier. Anything else is the visitor asking
  // for a new tab or a saved link, and must be left alone.
  function isPlainClick(e) {
    return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
  }

  function showLoading() {
    modalBody.innerHTML =
      '<div class="modal-loading"><div><div class="modal-spinner"></div>Loading</div></div>';
  }

  /* The fetched pages live one directory down, so their paths are written
     relative to /projects/: ../assets/… for anything at root, and a bare
     filename for a sibling project. Both are wrong once the markup is sitting
     in the index page, and the address bar has moved besides. Rewriting them
     to absolute URLs settles it once, whatever the address bar says later. */
  function rebase(root) {
    // Sibling project links first, so the pass below makes them absolute too.
    root.querySelectorAll('.proj-next a[href$=".html"]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href.indexOf('/') === -1) a.setAttribute('href', 'projects/' + href);
      a.setAttribute('data-project', '');
    });

    ['src', 'href'].forEach(function (attr) {
      root.querySelectorAll('[' + attr + ']').forEach(function (el) {
        var v = el.getAttribute(attr);
        // Absolute URLs, protocol-relative, in-page anchors and mailto: are
        // already unambiguous. Everything else is relative to /projects/.
        if (!v || /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(v)) return;
        if (v.indexOf('../') === 0) v = v.slice(3);
        el.setAttribute(attr, resolve(v));
      });
    });
  }

  function build(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var frag = document.createDocumentFragment();

    ['.proj-hero', '.proj-band', '.proj-body', '.proj-next'].forEach(function (sel) {
      var node = doc.querySelector(sel);
      if (node) frag.appendChild(document.importNode(node, true));
    });

    // The "back to major projects" link is page chrome, meaningless in a dialog.
    var back = frag.querySelector('.proj-back');
    if (back) back.remove();

    var wrap = document.createElement('div');
    wrap.appendChild(frag);
    rebase(wrap);

    var titleEl = doc.querySelector('.proj-title');
    return { node: wrap, title: titleEl ? titleEl.textContent.trim() : 'Project' };
  }

  function render(url, data) {
    current = url;
    modalTitle.textContent = data.title;
    modalFull.href = url;
    modalBody.innerHTML = '';
    // The cache holds the pristine copy; only the clone in the page is ever
    // wired up, so each render starts from uninitialised markup.
    modalBody.appendChild(data.node.cloneNode(true));

    // Reaching the bottom of a long project should not be a dead end.
    var exit = document.createElement('div');
    exit.className = 'modal-exit';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn';
    btn.textContent = 'Close';
    btn.addEventListener('click', function () { close(); });
    exit.appendChild(btn);
    modalBody.appendChild(exit);

    initCarousels(modalBody);
    modalBody.scrollTop = 0;
  }

  function load(url) {
    if (cache[url]) { render(url, cache[url]); return; }

    showLoading();
    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      })
      .then(function (html) {
        cache[url] = build(html);
        render(url, cache[url]);
      })
      .catch(function () {
        // No content to show, so fall back to what the link said it would do.
        close(true);
        window.location.href = url;
      });
  }

  function open(href, trigger) {
    var url = resolve(href);
    opener = trigger || null;
    if (!modal.open) {
      modal.showModal();
      document.body.classList.add('modal-open');
      try {
        history.pushState({ projModal: url }, '', url);
        pushed = true;
      } catch (e) {
        pushed = false;   // file:// and similar refuse a cross-document URL
      }
    } else if (pushed) {
      try { history.replaceState({ projModal: url }, '', url); } catch (e) {}
    }
    load(url);
  }

  // silent: skip the history rewind, because history is what asked us to close.
  // The rewind itself lives in the close handler, so Escape gets it too.
  function close(silent) {
    if (silent) pushed = false;
    if (modal.open) modal.close();
  }

  modal.addEventListener('close', function () {
    document.body.classList.remove('modal-open');
    modalBody.innerHTML = '';
    current = null;
    if (opener && document.contains(opener)) opener.focus();
    opener = null;
    if (pushed) { pushed = false; history.back(); }
  });

  // Clicking the dimmed area lands on the dialog itself, never on its content.
  modal.addEventListener('click', function (e) {
    if (e.target === modal) close();
  });

  modalClose.addEventListener('click', function () { close(); });

  // Index links into the dialog.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a || !isProjectLink(a) || !isPlainClick(e)) return;
    if (modal.contains(a)) return;      // handled by the in-dialog listener
    e.preventDefault();
    open(a.getAttribute('href'), a);
  });

  // Previous/next inside the dialog swaps the content in place. rebase() marks
  // those links, so nothing here has to re-derive which they were.
  modalBody.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a || !a.hasAttribute('data-project') || !isPlainClick(e)) return;
    e.preventDefault();
    open(a.getAttribute('href'));
  });

  // Back closes the dialog rather than leaving the page.
  window.addEventListener('popstate', function (e) {
    var state = e.state && e.state.projModal;
    if (state && state !== current) {
      pushed = true;          // the entry we are on is still ours
      if (!modal.open) {
        modal.showModal();
        document.body.classList.add('modal-open');
      }
      load(state);
    } else if (!state && modal.open) {
      pushed = false;
      close(true);
    }
  });
})();

/* =========================================================================
   Circuit view

   Scroll position drives a lap. The corner dots are placed on real corners
   of the path in the markup, and their position along the lap is found once
   by walking a lookup table of sampled points. Scroll is then mapped through
   those corners piecewise, so the current point is exactly on a dot when its
   section reaches the top of the viewport, whatever the section heights are.
   Reaching the footer completes the lap.

   The car does not move. It sits at the SVG origin pointing up the screen,
   and the track group takes the inverse transform, so the circuit slides and
   turns underneath it: a window onto the part of the lap you are in rather
   than the whole map.
   ========================================================================= */

(function () {
  var root = document.getElementById('circuit');
  if (!root) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var path = document.getElementById('circuitPath');
  var line = document.getElementById('circuitLine');
  var win = document.getElementById('circuitWindow');
  var world = document.getElementById('circuitWorld');
  var label = document.getElementById('circuitLabel');
  var next = document.getElementById('circuitNext');
  var nextName = document.getElementById('circuitNextName');
  var dots = Array.prototype.slice.call(document.querySelectorAll('#circuitDots circle'));
  if (!path || !path.getTotalLength || !dots.length) return;

  var STEPS = 900;
  // How much road is lit either side of the car, in track units. The frame is
  // 84 units ahead of the car and 36 behind, so both run past its edges and
  // the ends of the dash never show.
  var WIN_AHEAD = 108;
  var WIN_BACK = 60;
  var total = 0;
  var stops = [];
  var keys = [];
  var maxScroll = 1;
  var ready = false;
  var hovering = null;
  var currentIndex = -1;
  var nextIndex = -1;
  // The lap is parked while a project dialog is open, and any remeasure that
  // arrives meanwhile is held until it resumes.
  var frozen = false;
  var pendingMeasure = false;
  // Heading in degrees, eased toward the tangent rather than snapped to it.
  var heading = null;

  // Under the mobile breakpoint the widget is display:none, and a hidden SVG
  // can report a length of zero, so setup waits until it can measure.
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
        // The first dot sits on the start/finish line, where the loop closes
        // and the nearest sample could just as easily be the last one.
        f: idx === 0 ? 0 : best / STEPS,
        scroll: 0
      };
    });

    // Both overlay layers trace the same circuit, so they take their geometry
    // from the one copy in the markup.
    var d = path.getAttribute('d');
    line.setAttribute('d', d);
    win.setAttribute('d', d);
    return true;
  }

  function measure() {
    maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var vh = window.innerHeight;
    stops.forEach(function (s, i) {
      if (i === 0 || !s.el) { s.scroll = 0; return; }
      var abs = s.el.getBoundingClientRect().top + window.scrollY;
      var top = abs - 80;
      // The last section starts below the last scrollable pixel, so it never
      // reaches the top of the viewport and its anchor pins to the bottom of
      // the page. Anchor it to the moment it enters the viewport instead,
      // which leaves the rest of the scroll free to close the lap.
      if (top > maxScroll) top = abs - vh;
      s.scroll = Math.min(1, Math.max(0, top / maxScroll));
    });
    // A short section can push two stops onto the same scroll value, and the
    // last section usually starts below the last scrollable pixel so it never
    // reaches the top of the viewport at all. Either would divide by zero in
    // the mapping, so force the stops strictly apart and keep them under 1.
    for (var i = 1; i < stops.length; i++) {
      if (stops[i].scroll <= stops[i - 1].scroll) stops[i].scroll = stops[i - 1].scroll + 0.002;
    }
    // Held below 1 so there is always scroll left between the last corner and
    // the line, otherwise the lap ends a corner short of finishing.
    var cap = 0.985;
    for (var j = stops.length - 1; j > 0; j--) {
      if (stops[j].scroll > cap) stops[j].scroll = cap;
      cap = stops[j].scroll - 0.002;
    }
    keys = stops.map(function (s) { return { s: s.scroll, f: s.f }; });
    // The bottom of the page is the start/finish line, so the run from the
    // last corner back round to it is the final stretch of scroll.
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
    if (!ready || frozen) return;
    var p = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    var f = lapAt(p);

    // A dash of length L starting at distance a along the path, wrapping at
    // the seam because the loop is closed.
    var at = total * f;
    var lit = WIN_BACK + WIN_AHEAD;
    win.style.strokeDasharray = lit + ' ' + (total - lit);
    win.style.strokeDashoffset = WIN_BACK - at;
    // The accent only trails behind the car, and only as far as the lap has
    // actually run, so nothing is lit at the start that has not been driven.
    var back = Math.min(WIN_BACK, at);
    line.style.strokeDasharray = back + ' ' + (total - back);
    line.style.strokeDashoffset = back - at;

    // The car is fixed at the origin pointing up the screen, so the world
    // carries the inverse: put the current point at the origin, then turn its
    // tangent to face up.
    var a = path.getPointAtLength(at % total);
    world.setAttribute('transform',
      'rotate(' + (-90 - headingAt(at)).toFixed(2) + ') ' +
      'translate(' + (-a.x).toFixed(2) + ' ' + (-a.y).toFixed(2) + ')');

    var idx = 0;
    for (var i = 0; i < stops.length; i++) if (p >= stops[i].scroll - 0.0005) idx = i;
    // Crossing the line completes the lap, so start/finish takes the
    // highlight back off the last corner.
    if (f > 0.99) idx = 0;
    if (idx !== currentIndex) {
      currentIndex = idx;
      stops.forEach(function (s, i) {
        if (i === idx) s.dot.setAttribute('data-current', 'true');
        else s.dot.removeAttribute('data-current');
      });
      if (!hovering) label.textContent = stops[idx].name;
    }

    // The chip names where you are going, so past the line it points at the
    // first corner of the next lap rather than back at start/finish.
    var nxt = (idx + 1) % stops.length;
    if (nxt !== nextIndex) {
      nextIndex = nxt;
      nextName.textContent = stops[nxt].name;
    }
  }

  /* Heading, smoothed twice over.

     The tangent is measured as a chord across SAMPLE units either side of the
     point rather than forward from it. A forward-only chord lags the corner
     and shakes on the tight arcs, where the path curves inside its own
     sample. The chord is then eased toward with a time constant, which takes
     the step out of the two places the raw tangent jumps: the join between
     two path segments, and the moment scroll stops mid-arc.

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

  function headingAt(at) {
    var b = path.getPointAtLength((at + SAMPLE) % total);
    var c = path.getPointAtLength((at - SAMPLE + total) % total);
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

  /* In the garage.

     A project dialog covers the page and locks the scroll, so the lap cannot
     move while one is open. Rendering through it is worse than useless: the
     dialog changes the page height, a remeasure lands, and the car jumps to a
     different part of the circuit behind the dialog for no reason the visitor
     can see. So freeze, hold any remeasure, and pick it up on close.

     The freeze follows body.modal-open rather than the dialog itself. That
     class is already how the page says a modal is up, and watching it keeps
     this independent of the dialog code further up the file. */
  function setFrozen(state) {
    if (state === frozen) return;
    frozen = state;
    if (frozen) {
      label.textContent = 'In the garage';
      return;
    }
    if (pendingMeasure) { pendingMeasure = false; measure(); }
    // Force the label and the chip to be written again, since the freeze took
    // the label over and both are only written on a change.
    currentIndex = -1;
    nextIndex = -1;
    render();
  }

  if (window.MutationObserver) {
    new MutationObserver(function () {
      setFrozen(document.body.classList.contains('modal-open'));
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  next.addEventListener('click', function () {
    var s = stops[nextIndex < 0 ? 1 % stops.length : nextIndex];
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
      if (frozen) { pendingMeasure = true; return; }
      measure();
      currentIndex = -1;
      render();
    }, 150);
  }

  window.addEventListener('resize', remeasure);

  // Lazy images load as you scroll and change the page height under the
  // mapping, which leaves the lap running behind the sections. Barely showed
  // on the old minimap, obvious now the view is zoomed in.
  if (window.ResizeObserver) new ResizeObserver(remeasure).observe(document.body);

  // Images and the intro animation both change the page height, so measure
  // again once everything has settled.
  window.addEventListener('load', function () {
    if (!ready) start();
    setTimeout(function () { if (ready) { measure(); currentIndex = -1; render(); } }, 400);
  });

  start();
})();
