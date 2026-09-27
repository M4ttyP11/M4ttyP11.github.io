/* Cookieless visit counting through Umami Cloud, plus two things Umami does
   not do on its own: time spent in each section, and clicks on the CV and
   outbound links.

   Umami sets no cookie and writes nothing to storage. The only storage it
   touches is a read of localStorage `umami.disabled`, which lets me exclude
   my own browser by setting that key to 1. Referrer, country, device and
   browser come from Umami itself. Nothing here identifies a person.

   Every page loads this one file, so the website ID lives here only. Leave
   it empty and the whole file does nothing. `data-domains` stops localhost
   and preview copies from sending anything. */

(function () {
  var WEBSITE_ID = '553b23f4-df84-4227-8242-0dfa8c991e93';
  var DOMAIN = 'mathiaspotter.co.uk';
  if (!WEBSITE_ID) return;

  var s = document.createElement('script');
  s.src = 'https://cloud.umami.is/script.js';
  s.defer = true;
  s.dataset.websiteId = WEBSITE_ID;
  s.dataset.domains = DOMAIN;
  document.head.appendChild(s);

  function track(name, data) {
    if (window.umami && typeof window.umami.track === 'function') {
      window.umami.track(name, data);
    }
  }

  /* -----------------------------------------------------------------------
     Time in section

     Once a second, whichever section crosses the middle of the viewport gets
     the second. Nothing counts while the tab is hidden, or after 90s with no
     scroll, key or pointer input, so a tab left open overnight does not read
     as eight hours on the hero. Totals go out as one event per section when
     the page is hidden or closed, then reset, so coming back to the tab
     starts a fresh tally.

     The home page is split by its sections. Every other page is one block,
     since the question there is how long the page held someone. `bucket` is
     there because Umami's event view counts values rather than averaging
     them, and six bands read better than a list of raw seconds.
     --------------------------------------------------------------------- */
  var NAMES = { top: 'hero', major: 'projects' };
  var IDLE_MS = 90000;

  var page = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/') || '/';
  var blocks = [];
  if (page === '/') {
    document.querySelectorAll('header.hero[id], main > section[id]').forEach(function (el) {
      blocks.push({ el: el, name: NAMES[el.id] || el.id });
    });
  }
  if (!blocks.length) blocks.push({ el: null, name: 'page' });

  var seconds = {};
  var lastInput = Date.now();

  ['scroll', 'keydown', 'pointerdown', 'pointermove', 'wheel', 'touchstart'].forEach(function (t) {
    window.addEventListener(t, function () { lastInput = Date.now(); }, { passive: true });
  });

  function current() {
    if (!blocks[0].el) return blocks[0].name;
    var mid = window.innerHeight / 2;
    for (var i = 0; i < blocks.length; i++) {
      var r = blocks[i].el.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) return blocks[i].name;
    }
    return null;
  }

  setInterval(function () {
    if (document.visibilityState !== 'visible') return;
    if (Date.now() - lastInput > IDLE_MS) return;
    var name = current();
    if (name) seconds[name] = (seconds[name] || 0) + 1;
  }, 1000);

  function bucket(n) {
    if (n < 5) return '0 to 5s';
    if (n < 15) return '5 to 15s';
    if (n < 30) return '15 to 30s';
    if (n < 60) return '30 to 60s';
    if (n < 180) return '1 to 3 min';
    return '3 min plus';
  }

  function flush() {
    Object.keys(seconds).forEach(function (name) {
      var n = seconds[name];
      if (n >= 1) track('Time in section', { page: page, section: name, seconds: n, bucket: bucket(n) });
    });
    seconds = {};
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flush();
    else lastInput = Date.now();
  });
  window.addEventListener('pagehide', flush);

  /* -----------------------------------------------------------------------
     Link clicks

     One delegated listener rather than attributes on every link. A PDF is a
     CV download, a mailto is an email, anything off this domain is
     outbound and recorded by host. `from` is the section the link sat in.
     --------------------------------------------------------------------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var sec = a.closest('section[id], header[id]');
    var from = sec ? (NAMES[sec.id] || sec.id) : 'page';

    if (/\.pdf($|[?#])/i.test(a.getAttribute('href'))) {
      track('CV download', { page: page, from: from });
    } else if (a.protocol === 'mailto:') {
      track('Email click', { page: page, from: from });
    } else if (/^https?:$/.test(a.protocol) && a.hostname !== location.hostname) {
      track('Outbound', { page: page, from: from, to: a.hostname.replace(/^www\./, '') });
    }
  });
})();
