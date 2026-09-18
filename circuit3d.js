/* ==========================================================================
   circuit3d.js: the circuit strip, seen from a helicopter

   A renderer, and only a renderer. It takes a path, a lap fraction and a list
   of section markers, and draws a view from a camera high above and behind
   the car into the fixed strip down the right of the window. Everything about
   the page, scroll mapping, section placement, the Next chip and the run out
   of a finished lap, belongs to the circuit module in site.js, which drives
   this one frame by frame.

   No WebGL and no canvas. The projection is hand rolled and the output is
   SVG, which is fast enough here: about 1.3ms a frame for 90 road quads and a
   car of 73 faces, and it inherits the page's colour tokens for free.

   The model: a static car at the origin with the world moving under it, the
   same as the flat map this replaces. Per frame the path is sampled either
   side of the car, each sample is put into car-local coordinates, lifted onto
   the ground plane, turned by the camera's pitch and divided through for
   perspective. Quads are emitted far to near, so nearer road paints over
   further road and no depth buffer is needed.

   The camera is steep rather than overhead: the track keeps the width, kerbs,
   barriers and run-off of a view from behind the car, but sits where the flat
   map sat and is read the same way. At this angle the ground plane fills the
   frame, so there is no horizon and no sky, and a section is named on a
   gantry over the road rather than on a board beside it, since a trackside
   board is edge on from this angle and its name cannot be read.

   None of the camera is settled. `tune()` builds the slider panel the
   prototype carried, so the view can still be moved around on the page
   itself. site.js only calls it on ?tune=1, so nobody reading the site
   meets a panel of sliders.

   The car drives the worn racing line, not the centreline: linePt() and
   lineHeading() stand in for pt() and heading() wherever the car or the
   camera is placed. Everything that draws the road still works off the
   centreline, since the cross section is measured out from it.

   Units are track units, as in the path data: the road is 7.8 across and one
   unit is about 2.3m. The road is deliberately wide against the path it
   follows, which is what keeps the car small on it.
   ========================================================================== */

window.Circuit3D = (function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  /* The camera. High, steep and a little behind, so a corner arrives as a
     shape rather than a wall. It started from the helicopter preset in
     proto/circuit-heli.html and has since been taken higher and steeper.
     `height` is set against ROAD: the two were raised together, 80 to 100
     against 6.2 to 7.8, so the road holds its width on screen while the car,
     which is sized in its own units, gets smaller on it. Moving one without
     the other changes how wide the road looks. tune() below puts the same
     sliders on the page so they can still be moved. */
  var CAM = {
    height: 100,      // above the road
    back: 25,         // behind the car
    pitch: 76,        // degrees down
    fov: 40,          // degrees, vertical
    carY: 52,         // per cent down the strip the car sits
    draw: 220,        // how far ahead the road is drawn
    behind: 140,      // and how far back, which a centred car needs
    boardTilt: 45,    // the banner's lean back off vertical, degrees
    lag: 1,           // how far the camera's heading trails the car's
    smooth: 4,        // chord either side, for the camera's heading
    samples: 130,     // road samples across the drawn length
    fog: 0,           // px of fade at the horizon, which is off the frame
    gantry: 3.4,     // the beam's underside, above the road
    carScale: 1.4,
    spinRate: 1,
    roll: 1
  };

  // The cross section, out from the centreline.
  var ROAD = 7.8;
  var HALF = ROAD / 2;
  var KERB_W = 0.9;
  var EDGE_W = 0.16;
  var APRON_W = 3.4;       // paved run-off outside the kerb
  var VERGE_W = 1.6;       // the strip beyond it, before the barrier
  var LINE_W = 2.1;        // the worn racing line
  var WALL_AT = HALF + KERB_W + APRON_W + 0.3;
  var WALL_T = 0.45;
  var WALL_H = 0.4;
  var CORNER_R = 40;       // tighter than this is a corner, and takes a kerb
  var TIGHT_R = 18;        // tighter again also takes a tyre barrier
  var NEAR = 0.3;          // near plane

  /* The ends of an out lap. The path itself stops dead at both ends, so the
     road is carried on straight past them and closed off with a barrier: a
     run-in behind the start line, a run-out past the flag. Without it the
     road simply stops mid-air, which is the one place the band gives away
     that it is a strip and not a circuit. */
  var OPEN_IN = 18;        // run-in drawn before the start line
  var OPEN_OUT = 20;       // run-out drawn past the flag
  var GATE_H = 0.75;       // the barrier closing each end
  var FLAG_COLS = 6;       // chequer cells across the road, as on the map

  /* Gantries over the track. A section is named on a banner slung under a
     beam that spans the road on two legs, the way a circuit signs a sector,
     and the start/finish gets the light rig instead of a name.

     The banner leans back off vertical toward the oncoming car. Upright it
     would be almost edge on from a camera this steep and the name would be
     unreadable; at BANNER_TILT its face is within about 25 degrees of square
     to the view, which is both readable and what a real overhead sign does. */
  var GANTRY_AT = HALF + KERB_W + 0.5;  // where the legs stand, outside the kerb
  var LEG_W = 0.18;
  var BEAM_T = 0.32;       // beam depth, vertically
  var BEAM_D = 0.36;       // and along the track
  var BANNER_H = 1.5;
  var LIGHTS = 5;          // light columns on the start gantry
  var LIGHT_W = 0.44;
  var TEXT_K = 100;        // text is set this much too large and scaled down

  /* Gantry materials. Fixed colours rather than page tokens, and shaded per
     face by shade() the way the car's panels are: a sign is a sign in either
     theme, and a surface that ignores the light is what makes a panel read as
     a card laid over the view instead of a thing standing in it. */
  var STEEL = [240, 5, 44];      // the beam and the legs
  var SIGN = [240, 7, 15];       // the sign board
  var SIGN_INK = [0, 0, 96];     // its lettering
  var BAND = [240, 5, 38];       // the band along its foot, off the accent
  var RIG = [240, 6, 11];        // the start rig
  var LAMP_OFF = [240, 5, 24];
  var LAMP_ON = [0, 78, 52];
  var BOARD_T = 0.11;            // the board's thickness, behind its face
  // Face normals in gantry space: x across the road, y up, z along it.
  var UP_N = [0, 1, 0], FRONT_N = [0, 0, -1];
  var SIDE_P_N = [1, 0, 0], SIDE_N_N = [-1, 0, 0];

  var CARBON = [240, 8, 15], TYRE = [240, 6, 8], TREAD = [240, 5, 24], WHITE = [0, 0, 94];
  var WHEEL_SIDES = 12;
  var ROLL_Y = 0.06;       // the height the sprung parts roll about
  // One tread band is two faces, so half a band is one face's angle. Past
  // this the bands alias into a stroboscope and read as spinning backwards.
  var SPIN_CAP = 0.75 * 2 * Math.PI / WHEEL_SIDES;

  var LIGHT = (function () {
    var l = [0.35, 0.9, 0.25], m = Math.hypot(l[0], l[1], l[2]);
    return [l[0] / m, l[1] / m, l[2] / m];
  })();

  var seq = 0;

  function el(name, attrs) {
    var node = document.createElementNS(NS, name);
    for (var a in attrs) node.setAttribute(a, attrs[a]);
    return node;
  }
  function wrapPi(a) {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
  }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
  function centroid(pts, idx) {
    var x = 0, y = 0, z = 0, n = idx ? idx.length : pts.length;
    for (var k = 0; k < n; k++) {
      var p = pts[idx ? idx[k] : k];
      x += p[0]; y += p[1]; z += p[2];
    }
    return [x / n, y / n, z / n];
  }

  /* A box blur, run twice, so a curve smoothed with it has no corners of its
     own. A closed lap wraps at the seam; an out lap holds its end values,
     since wrapping would fold the pit exit into the finish. */
  function smooth(src, r, ring) {
    var n = src.length, a = new Float64Array(n), b = new Float64Array(n), i, k, sum;
    function ix(j) { return ring ? (j + n) % n : Math.max(0, Math.min(n - 1, j)); }
    for (i = 0; i < n; i++) {
      sum = 0;
      for (k = -r; k <= r; k++) sum += src[ix(i + k)];
      a[i] = sum / (2 * r + 1);
    }
    for (i = 0; i < n; i++) {
      sum = 0;
      for (k = -r; k <= r; k++) sum += a[ix(i + k)];
      b[i] = sum / (2 * r + 1);
    }
    return b;
  }

  /* ----------------------------- the band -------------------------------
     One instance per page. opts:
       d        path data, the same string the flat strip draws
       closed   a lap, or an out lap that starts and ends somewhere
       parent   where to put the band, default <body>
     Returns { el, total, setBoards, frame, refresh, dispose }. */
  function create(opts) {
    var id = 'c3d' + (++seq);
    var closed = opts.closed !== false;
    var host = opts.parent || document.body;

    /* ----------------------------- geometry -----------------------------
       The path is read once into a table at half-unit spacing, so a frame
       makes no getPointAtLength calls at all, then sampled with linear
       interpolation. */
    var probe = el('svg', { width: '0', height: '0', 'aria-hidden': 'true' });
    probe.style.position = 'absolute';
    var srcPath = el('path', { d: opts.d });
    probe.appendChild(srcPath);
    host.appendChild(probe);
    var total = srcPath.getTotalLength();
    if (!total) { probe.remove(); return null; }

    var N = Math.ceil(total / 0.5);
    var H = total / N;
    var TX = new Float64Array(N + 1), TY = new Float64Array(N + 1);
    for (var i = 0; i <= N; i++) {
      var p0 = srcPath.getPointAtLength(Math.min(total, i * H));
      TX[i] = p0.x; TY[i] = p0.y;
    }
    probe.remove();

    // Distance along the path: wrapped on a lap, clamped on an out lap,
    // which is the only place the two shapes differ geometrically.
    function pos(d) {
      if (closed) return ((d % total) + total) % total;
      return Math.max(0, Math.min(total, d));
    }

    var ptOut = { x: 0, y: 0 };
    function pt(d) {
      var u = pos(d) / H, k = Math.floor(u), t = u - k;
      if (k >= N) { k = N - 1; t = 1; }
      var j = closed ? (k + 1) % N : k + 1;
      ptOut.x = TX[k] + (TX[j] - TX[k]) * t;
      ptOut.y = TY[k] + (TY[j] - TY[k]) * t;
      return ptOut;
    }

    // The tangent as a chord across `span` either side, which does not lag a
    // corner the way a forward-only chord does.
    function heading(d, span) {
      var a = pt(d - span), ax = a.x, ay = a.y;
      var b = pt(d + span);
      return Math.atan2(b.y - ay, b.x - ax);
    }

    /* Off the ends of an out lap, straight on along the end tangent. Only the
       road surface and its furniture use this: the car, the camera and the
       racing line all stay inside the path proper. The tangents are the ones
       heading() already reports at each end, so the join has no kink. */
    var endA = null, endB = null;
    if (!closed) {
      var qa = pt(0), aa0 = heading(0, 1.2);
      endA = { x: qa.x, y: qa.y, cos: Math.cos(aa0), sin: Math.sin(aa0), a: aa0 };
      var qb = pt(total), ab0 = heading(total, 1.2);
      endB = { x: qb.x, y: qb.y, cos: Math.cos(ab0), sin: Math.sin(ab0), a: ab0 };
    }
    var exA = { x: 0, y: 0 }, exB = { x: 0, y: 0 };
    function ptEx(s, out) {
      var e = null, off = 0;
      if (!closed && s < 0) { e = endA; off = s; }
      else if (!closed && s > total) { e = endB; off = s - total; }
      if (e) { out.x = e.x + e.cos * off; out.y = e.y + e.sin * off; return out; }
      var q = pt(s);
      out.x = q.x; out.y = q.y;
      return out;
    }
    function headEx(s, span) {
      if (!closed) {
        if (s < 0) return endA.a;
        if (s > total) return endB.a;
      }
      return heading(s, span);
    }

    /* Corners, found the way the flat strip's furnish() finds them: turn per
       unit of length along the path, runs of the same sign tighter than
       CORNER_R. Side +1 is the driver's right, which in y-down SVG is a
       positive turn. */
    var corners = (function () {
      var step = 1.2, n = Math.max(4, Math.round(total / step)), h = total / n;
      var ang = [], turn = [], k;
      for (k = 0; k < n; k++) ang.push(heading(k * h + h / 2, h / 2));
      for (k = 0; k < n; k++) {
        var prev = k === 0 ? (closed ? n - 1 : 0) : k - 1;
        turn.push(k === 0 && !closed ? 0 : wrapPi(ang[k] - ang[prev]) / h);
      }
      if (!closed) turn[0] = turn[1];
      var out = [];
      k = 0;
      while (k < n) {
        if (Math.abs(turn[k]) < 1 / CORNER_R) { k++; continue; }
        var a = k, side = turn[k] > 0 ? 1 : -1, sum = 0, count = 0;
        while (k < n && Math.abs(turn[k]) >= 1 / CORNER_R && (turn[k] > 0 ? 1 : -1) === side) {
          sum += Math.abs(turn[k]); count++; k++;
        }
        if (k - 1 - a < 2) continue;
        out.push({ from: a * h, to: (k - 1) * h, side: side, radius: count / sum });
      }
      return out;
    })();

    function cornerAt(s) {
      s = pos(s);
      for (var k = 0; k < corners.length; k++) {
        if (s >= corners[k].from && s <= corners[k].to) return corners[k];
      }
      return null;
    }

    /* --------------------------- racing line ----------------------------
       The line a car would actually take: out wide on the way in, close to
       the kerb at the apex, out wide again on the way out. Worked out once,
       as a lateral offset from the centreline at every unit of the lap.

       Wanting the inside through a corner and the middle everywhere else
       gives the apex but not the entry and the exit. Smoothing that twice,
       once tightly and once loosely, then subtracting the loose one, leaves
       an overshoot the other way on both sides of a corner, which is the
       line running wide. */
    var LINE_STEP = 1, LN = Math.max(8, Math.round(total / LINE_STEP));
    var LOFF = (function () {
      var want = new Float64Array(LN), k;
      for (k = 0; k < LN; k++) {
        var c = cornerAt(k * LINE_STEP);
        want[k] = c ? c.side * (HALF - 1) : 0;
      }
      var tight = smooth(want, 5, closed), loose = smooth(want, 20, closed);
      // The limit leaves the car's inside wheels just over the white line at
      // an apex, which is where a real one puts them.
      var out = new Float64Array(LN), lim = HALF - 0.9;
      for (k = 0; k < LN; k++) {
        var v = tight[k] * 1.85 - loose[k] * 0.85;
        out[k] = Math.max(-lim, Math.min(lim, v));
      }
      return smooth(out, 3, closed);
    })();

    function lineAt(s) {
      var u = pos(s) / LINE_STEP, f = Math.floor(u), t = u - f;
      var k = closed ? f % LN : Math.max(0, Math.min(LN - 1, f));
      var j = closed ? (k + 1) % LN : Math.min(LN - 1, k + 1);
      return LOFF[k] + (LOFF[j] - LOFF[k]) * t;
    }

    // A point on the worn line, and the line's own tangent, which is what
    // the car points along: it turns in before a corner and straightens on
    // the exit rather than running down the centreline's heading.
    var lpA = { x: 0, y: 0 }, lpB = { x: 0, y: 0 }, lpC = { x: 0, y: 0 };
    function linePt(s, out) {
      var q = pt(s), x = q.x, y = q.y;
      var a = heading(s, 0.6), lo = lineAt(s);
      out.x = x - Math.sin(a) * lo;
      out.y = y + Math.cos(a) * lo;
      return out;
    }
    function lineHeading(s, span) {
      var a = linePt(s - span, lpA), ax = a.x, ay = a.y;
      var b = linePt(s + span, lpB);
      return Math.atan2(b.y - ay, b.x - ax);
    }

    /* ---------------------------- projection ----------------------------
       Camera-heading frame: z forward along the camera's heading, x to the
       right, y up, origin at the car. The camera sits `back` behind and
       `height` above, pitched down. Its heading trails the car's by `lag`,
       so through a corner the car turns before the view does and shows its
       side, which is most of what makes the band read as three dimensional. */
    var cam = { cx: 0, cy: 0, cos: 1, sin: 0, cp: 1, sp: 0, f: 1, w: 1, py: 1 };

    function view(x, y, z, out) {
      var Y = y - CAM.height, Z = z + CAM.back;
      out[0] = x;
      out[1] = Y * cam.cp + Z * cam.sp;
      out[2] = Z * cam.cp - Y * cam.sp;
      return out;
    }
    // A world point on the ground plane, lifted by `up`, into camera space.
    function toCam(wx, wy, up, out) {
      var dx = wx - cam.cx, dy = wy - cam.cy;
      return view(-dx * cam.sin + dy * cam.cos, up, dx * cam.cos + dy * cam.sin, out);
    }
    function sx(c) { return cam.w / 2 + cam.f * c[0] / c[2]; }
    function sy(c) { return cam.py - cam.f * c[1] / c[2]; }

    // A polygon in camera space, clipped against the near plane and appended
    // to a path string. Clipping keeps road running past the camera from
    // folding back through the vanishing point.
    var clipBuf = [];
    function poly(parts, pts) {
      var n = 0, k, len = pts.length;
      for (k = 0; k < len; k++) {
        var p = pts[k], q = pts[(k + 1) % len];
        var pin = p[2] >= NEAR, qin = q[2] >= NEAR;
        if (pin) clipBuf[n++] = p;
        if (pin !== qin) {
          var t = (NEAR - p[2]) / (q[2] - p[2]);
          clipBuf[n++] = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, NEAR];
        }
      }
      if (n < 3) return;
      var s = 'M' + sx(clipBuf[0]).toFixed(1) + ' ' + sy(clipBuf[0]).toFixed(1);
      for (k = 1; k < n; k++) s += 'L' + sx(clipBuf[k]).toFixed(1) + ' ' + sy(clipBuf[k]).toFixed(1);
      parts.push(s + 'Z');
    }
    var quadBuf = [0, 0, 0, 0];
    function quad(parts, a, b, c, d) {
      quadBuf[0] = a; quadBuf[1] = b; quadBuf[2] = c; quadBuf[3] = d;
      poly(parts, quadBuf);
    }

    /* ------------------------------- the car ----------------------------
       Convex solids in car units: z forward, x right, y up, the rear axle
       near z = -0.7. The car is 1.56 across, so at the default scale it takes
       just over a quarter of the 7.8 road; the scale is exaggerated the same
       way the flat strip's car is.

       Each solid is backface culled on its own, which is exact for a convex
       shape, and the solids are drawn furthest first. That order is only
       approximate between parts, but from behind and above it holds. */
    function taper(cx, z0, w0, b0, t0, z1, w1, b1, t1, colour) {
      var v = [
        [cx - w0, b0, z0], [cx + w0, b0, z0], [cx + w0, t0, z0], [cx - w0, t0, z0],
        [cx - w1, b1, z1], [cx + w1, b1, z1], [cx + w1, t1, z1], [cx - w1, t1, z1]
      ];
      var f = [[0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7], [1, 5, 6, 2], [3, 2, 6, 7], [4, 5, 1, 0]];
      return { v: v, f: f, colour: colour };
    }
    function box(cx, z0, z1, w, b, t, colour) {
      return taper(cx, z0, w, b, t, z1, w, b, t, colour);
    }
    // A twelve-sided prism across the car. The tread faces alternate two
    // shades, and it is those bands running round that make the spin visible.
    function wheel(x0, x1, zc, r, colour) {
      var n = WHEEL_SIDES, f = [], fc = [], k;
      var capA = [], capB = [];
      for (k = 0; k < n; k++) {
        capA.push(k); capB.push(n + k);
        f.push([k, (k + 1) % n, n + (k + 1) % n, n + k]);
        fc.push(k % 2 ? TREAD : colour);
      }
      f.push(capA, capB);
      fc.push(colour, colour);
      var s = { v: [], f: f, fc: fc, colour: colour, wheel: { x0: x0, x1: x1, zc: zc, r: r } };
      spinWheel(s, 0);
      return s;
    }
    function spinWheel(s, sp) {
      var wl = s.wheel, n = WHEEL_SIDES, k;
      for (k = 0; k < n; k++) {
        // The angle falls as the car rolls forward, so the top of the tyre
        // moves toward the nose.
        var a = (k + 0.5) / n * 2 * Math.PI - sp;
        var y = wl.r + wl.r * Math.sin(a), z = wl.zc + wl.r * Math.cos(a);
        s.v[k] = [wl.x0, y, z];
        s.v[n + k] = [wl.x1, y, z];
      }
    }

    var CAR = [
      // Front wheels and front wing, furthest from the camera.
      wheel(-0.74, -0.52, 0.78, 0.2, TYRE),
      wheel(0.52, 0.74, 0.78, 0.2, TYRE),
      box(0, 1.02, 1.22, 0.66, 0.03, 0.07, CARBON),
      box(-0.64, 0.98, 1.24, 0.03, 0.02, 0.2, 'livery'),
      box(0.64, 0.98, 1.24, 0.03, 0.02, 0.2, 'livery'),
      // Nose and tub.
      taper(0, 0.3, 0.17, 0.06, 0.3, 1.18, 0.06, 0.1, 0.17, 'livery'),
      box(0, -0.3, 0.3, 0.2, 0.05, 0.34, 'livery'),
      // Floor, sidepods, then the engine cover rising to the airbox.
      box(0, -0.95, 0.55, 0.5, 0.02, 0.05, CARBON),
      taper(-0.33, -0.7, 0.1, 0.05, 0.16, 0.05, 0.14, 0.05, 0.27, 'livery'),
      taper(0.33, -0.7, 0.1, 0.05, 0.16, 0.05, 0.14, 0.05, 0.27, 'livery'),
      taper(0, -0.95, 0.07, 0.05, 0.24, -0.15, 0.17, 0.05, 0.5, 'livery'),
      // Halo and driver.
      box(0, 0.08, 0.26, 0.15, 0.34, 0.38, CARBON),
      box(0, -0.12, 0.08, 0.1, 0.3, 0.44, WHITE),
      // Rear wheels, wing and beam, nearest.
      wheel(-0.78, -0.5, -0.7, 0.24, TYRE),
      wheel(0.5, 0.78, -0.7, 0.24, TYRE),
      box(0, -1.08, -0.98, 0.04, 0.2, 0.52, CARBON),
      box(-0.5, -1.22, -0.92, 0.03, 0.26, 0.64, 'livery'),
      box(0.5, -1.22, -0.92, 0.03, 0.26, 0.64, 'livery'),
      box(0, -1.2, -1.0, 0.47, 0.5, 0.56, CARBON),
      box(0, -1.14, -1.02, 0.47, 0.58, 0.61, 'livery')
    ];

    // The livery is the accent the band inherits, so the car follows the
    // theme and takes the out lap's own tint on a project page rather than
    // the site accent.
    var LIVERY = [214, 90, 50];
    function readLivery() {
      var raw = getComputedStyle(band).getPropertyValue('--accent').trim();
      var m = raw.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
      if (m) LIVERY = [+m[1], +m[2], +m[3]];
    }
    function shade(c, lam) {
      var hsl = c === 'livery' ? LIVERY : c;
      var l = Math.max(2, Math.min(96, hsl[2] * (0.55 + 0.6 * lam) + 4 * lam));
      return 'hsl(' + hsl[0] + ' ' + hsl[1] + '% ' + l.toFixed(1) + '%)';
    }

    /* ------------------------------ the DOM -----------------------------
       Built here rather than in the markup: the flat strip is what a visitor
       without JS gets, and a band of empty layers in every page's source
       would only be noise. */
    var band = document.createElement('div');
    band.className = 'c3d';
    band.setAttribute('aria-hidden', 'true');
    var svg = el('svg', { 'class': 'c3d-view', role: 'presentation', focusable: 'false' });
    var defs = el('defs');
    // Fog: the ground fades into the page background toward the horizon.
    // Placed in user space each frame, since the horizon moves with pitch.
    var fog = el('linearGradient', {
      id: id + '-fog', gradientUnits: 'userSpaceOnUse', x1: '0', x2: '0'
    });
    fog.appendChild(el('stop', { offset: '0', 'stop-color': 'hsl(var(--background))', 'stop-opacity': '1' }));
    fog.appendChild(el('stop', { offset: '1', 'stop-color': 'hsl(var(--background))', 'stop-opacity': '0' }));
    var soft = el('filter', { id: id + '-soft', x: '-20%', y: '-50%', width: '140%', height: '200%' });
    soft.appendChild(el('feGaussianBlur', { stdDeviation: '1.5' }));
    defs.appendChild(fog);
    defs.appendChild(soft);
    svg.appendChild(defs);

    function layer(name, cls, attrs) {
      var node = el(name, attrs || {});
      if (cls) node.setAttribute('class', cls);
      svg.appendChild(node);
      return node;
    }
    var elGround = layer('rect', 'c3d-ground', { x: '0', width: '100%' });
    /* The ground the road is laid on, page colour and opaque, from the outer
       edge of one verge across to the other. Every material above it is a
       tint carrying its own alpha, and without this they were tints of
       whatever the page happened to be showing behind the strip, so a section
       rule or a change of section tint read straight through the road. This
       slab is what they are mixed against instead. It is the page's own
       colour, so nothing about the road looks any different where the page
       behind it is plain. */
    var elBase = layer('path', 'c3d-base');
    var elVerge = layer('path', 'c3d-verge');
    var elApron = layer('path', 'c3d-apron');
    var elRoad = layer('path', 'c3d-road');
    var elLine = layer('path', 'c3d-rline');
    var elRubber = layer('path', 'c3d-rubber');
    var elEdge = layer('path', 'c3d-edge');
    var elKA = layer('path', 'c3d-kerb-a');
    var elKB = layer('path', 'c3d-kerb-b');
    var elFlag = layer('path', 'c3d-flag');
    var elFlagB = layer('path', 'c3d-flag-b');
    var elWallF = layer('path', 'c3d-wall-face');
    var elWallT = layer('path', 'c3d-wall-top');
    var elFog = layer('rect', null, { x: '0', width: '100%', fill: 'url(#' + id + '-fog)' });
    var elHorizon = layer('line', 'c3d-horizon', { x1: '0', x2: '100%' });
    var elShadow = layer('path', 'c3d-shadow', { filter: 'url(#' + id + '-soft)' });
    var carGroup = layer('g', 'c3d-carbody');
    /* Gantries last, over the car. A camera above and behind sees the beam
       before the car under it wherever the two overlap on screen, and one far
       enough ahead to be further away is by then too near the top of the band
       to reach the car at all. */
    var boardLayer = layer('g', 'c3d-board-layer');
    band.appendChild(svg);
    host.appendChild(band);

    /* ------------------------------- boards -----------------------------
       One gantry per section: a steel beam on two legs spanning the road,
       and a sign board hung under it, full width between the legs, carrying
       the section name.

       Built the way the car is built, not the way the page's cards are. Every
       face is a projected quad with a normal, filled by shade() from that
       normal against the same light the car uses, so a gantry sits in the
       scene's light instead of floating over it as a panel in UI colours. The
       beam's top catches the light and its face toward the car falls away,
       the lit leg is the left one, and the board's bottom edge is a dark
       sliver that gives it thickness.

       The name is the one thing that cannot be geometry without a font
       outline, so it stays SVG text, mapped onto the board by the affine fit
       of the lettering box's three corners. Over a board this shallow the fit
       is within about a per cent of true perspective. It is painted in the
       board's own light, so it dims and lifts with the face it is on rather
       than sitting at full UI contrast over the top of it, and it is set 100
       times too large then scaled down, since some browsers mishandle font
       sizes under a pixel. */
    var BOARDS = [];
    function setBoards(list) {
      BOARDS.forEach(function (b) { b.g.remove(); });
      BOARDS = list.map(function (s) {
        var g = el('g', { 'class': 'c3d-board' });
        var faceG = el('g');
        var text = el('text', { 'class': 'c3d-board-text', 'text-anchor': 'middle' });
        text.textContent = s.name;
        g.appendChild(faceG);
        g.appendChild(text);
        boardLayer.appendChild(g);
        return {
          name: s.name, at: s.f * total, g: g, faceG: faceG, faces: [], text: text,
          // The one sitting on the start/finish line of a lap carries the
          // light rig instead of a name, the way a grid start is signed.
          lights: closed && (s.f < 0.02 || s.f > 0.98),
          // The lettering box, measured once at the working size.
          w: Math.max(2.4, text.getComputedTextLength() / TEXT_K + 0.9)
        };
      });
    }

    var bc = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
    var gtmp = [];
    for (var gi = 0; gi < 8; gi++) gtmp.push([0, 0, 0]);
    var faceParts = [];
    function drawBoard(b, s, inRange, isNext) {
      var p = pt(s), px = p.x, py = p.y, a = heading(s, 1);
      var nx = -Math.sin(a), ny = Math.cos(a);
      var tx = Math.cos(a), ty = Math.sin(a);
      /* A point on the gantry: `off` across the track, positive to the
         driver's right, `up` above the road, `lead` along the track, positive
         ahead of the car. */
      function gp(off, up, lead, out) {
        return toCam(px + nx * off + tx * lead, py + ny * off + ty * lead, up, out);
      }

      var span = GANTRY_AT, beamB = CAM.gantry, beamT = beamB + BEAM_T;
      var outer = span + LEG_W;
      var visible = inRange &&
        gp(-outer, beamT, 0, gtmp[0])[2] > NEAR && gp(outer, beamT, 0, gtmp[1])[2] > NEAR;
      if (!visible) { b.g.setAttribute('display', 'none'); return; }
      b.g.removeAttribute('display');

      /* A face, lit from its own normal in gantry space (x across, y up, z
         along the track) and hairlined in its own colour, the way the car's
         faces are, so no seam shows between them. */
      var used = 0;
      function emit(col, n, q0, q1, q2, q3) {
        faceParts.length = 0;
        quad(faceParts, q0, q1, q2, q3);
        if (!faceParts.length) return;
        var node = b.faces[used];
        if (!node) {
          node = el('path', { 'stroke-linejoin': 'round', 'stroke-width': '0.4' });
          b.faceG.appendChild(node);
          b.faces.push(node);
        }
        var fill = shade(col, Math.max(0, dot(n, LIGHT)));
        node.setAttribute('d', faceParts.join(''));
        node.setAttribute('fill', fill);
        node.setAttribute('stroke', fill);
        used++;
      }

      // A leg each side, outside the kerb: the face toward the car and the
      // face toward the track, which is the pair a view from behind sees.
      [-1, 1].forEach(function (sd) {
        var o = sd * span, inner = o - sd * LEG_W / 2;
        gp(o - LEG_W / 2, beamB, -LEG_W / 2, gtmp[0]);
        gp(o + LEG_W / 2, beamB, -LEG_W / 2, gtmp[1]);
        gp(o + LEG_W / 2, 0, -LEG_W / 2, gtmp[2]);
        gp(o - LEG_W / 2, 0, -LEG_W / 2, gtmp[3]);
        emit(STEEL, FRONT_N, gtmp[0], gtmp[1], gtmp[2], gtmp[3]);
        gp(inner, beamB, -LEG_W / 2, gtmp[0]);
        gp(inner, beamB, LEG_W / 2, gtmp[1]);
        gp(inner, 0, LEG_W / 2, gtmp[2]);
        gp(inner, 0, -LEG_W / 2, gtmp[3]);
        emit(STEEL, sd < 0 ? SIDE_P_N : SIDE_N_N, gtmp[0], gtmp[1], gtmp[2], gtmp[3]);
      });

      // The beam: the face turned back down the track toward the car, then
      // its top, which is most of what a camera this steep sees of it.
      gp(-outer, beamT, -BEAM_D / 2, gtmp[0]);
      gp(outer, beamT, -BEAM_D / 2, gtmp[1]);
      gp(outer, beamB, -BEAM_D / 2, gtmp[2]);
      gp(-outer, beamB, -BEAM_D / 2, gtmp[3]);
      emit(STEEL, FRONT_N, gtmp[0], gtmp[1], gtmp[2], gtmp[3]);
      gp(-outer, beamT, BEAM_D / 2, gtmp[4]);
      gp(outer, beamT, BEAM_D / 2, gtmp[5]);
      emit(STEEL, UP_N, gtmp[0], gtmp[1], gtmp[5], gtmp[4]);

      /* The board under the beam. It hangs from the beam's underside and runs
         the full span between the legs, so it is the gantry's own panel
         rather than a card hung in the middle of it, and it leans back toward
         the car by CAM.boardTilt. `u` is the distance down the face from the
         hinge, `back` the distance behind the face along its normal, which is
         what gives the board its thickness. */
      var lean = CAM.boardTilt * Math.PI / 180, sl = Math.sin(lean), cl = Math.cos(lean);
      var ph = b.lights ? LIGHT_W + 0.34 : BANNER_H;
      var pw = 2 * span;
      var faceN = [0, sl, -cl];            // the board's face, toward the car
      var edgeN = [0, -cl, -sl];           // its bottom edge, on down the face
      function fp(off, u, back, out) {
        return gp(off, beamB - u * cl - back * sl, -u * sl + back * cl, out);
      }
      fp(-pw / 2, 0, 0, bc[0]);
      fp(pw / 2, 0, 0, bc[1]);
      fp(pw / 2, ph, 0, bc[2]);
      fp(-pw / 2, ph, 0, bc[3]);
      emit(b.lights ? RIG : SIGN, faceN, bc[0], bc[1], bc[2], bc[3]);
      fp(-pw / 2, ph, BOARD_T, gtmp[0]);
      fp(pw / 2, ph, BOARD_T, gtmp[1]);
      emit(b.lights ? RIG : SIGN, edgeN, bc[3], bc[2], gtmp[1], gtmp[0]);

      if (b.lights) {
        // Five lights across the rig, the way a grid start is signed. They
        // read as the marking for the line the car is crossing, so the rig
        // carries no name.
        var cw = (pw - 1.6) / LIGHTS, u0 = (ph - LIGHT_W) / 2;
        for (var i = 0; i < LIGHTS; i++) {
          var o0 = -(pw - 1.6) / 2 + i * cw + (cw - LIGHT_W) / 2;
          fp(o0, u0, -0.02, gtmp[0]);
          fp(o0 + LIGHT_W, u0, -0.02, gtmp[1]);
          fp(o0 + LIGHT_W, u0 + LIGHT_W, -0.02, gtmp[2]);
          fp(o0, u0 + LIGHT_W, -0.02, gtmp[3]);
          emit(isNext ? LAMP_ON : LAMP_OFF, faceN, gtmp[0], gtmp[1], gtmp[2], gtmp[3]);
        }
      } else {
        /* A band across the foot of the board, which takes the livery on the
           section the Next chip names, the way a sector board is coloured. It
           is held clear of the bottom edge so it reads as paint on the board
           rather than a rule underlining the name, and the livery is knocked
           back off the car's, which would otherwise be the brightest thing in
           the frame. */
        var band = isNext ? [LIVERY[0], LIVERY[1] * 0.82, LIVERY[2] * 0.76] : BAND;
        fp(-pw / 2, ph - 0.34, -0.02, gtmp[0]);
        fp(pw / 2, ph - 0.34, -0.02, gtmp[1]);
        fp(pw / 2, ph - 0.18, -0.02, gtmp[2]);
        fp(-pw / 2, ph - 0.18, -0.02, gtmp[3]);
        emit(band, faceN, gtmp[0], gtmp[1], gtmp[2], gtmp[3]);
      }

      for (var k = used; k < b.faces.length; k++) b.faces[k].setAttribute('d', '');

      if (b.lights) { b.text.setAttribute('display', 'none'); return; }

      /* The name, on the board and in the board's light. Its box is the
         measured width of the lettering, centred on the board and clear of
         the livery band, and it is that box's corners the text is fitted to
         rather than the whole board's, so a long name scales down instead of
         running off the ends. */
      var tw = Math.min(b.w, pw - 0.6), th = ph - 0.46;
      fp(-tw / 2, 0.06, -0.03, bc[0]);
      fp(tw / 2, 0.06, -0.03, bc[1]);
      fp(-tw / 2, 0.06 + th, -0.03, bc[3]);
      var tlx = sx(bc[0]), tly = sy(bc[0]);
      var trx = sx(bc[1]), trY = sy(bc[1]);
      var blx = sx(bc[3]), bly = sy(bc[3]);
      /* Three ways the name has to go, though the gantry itself still reads
         fine in all of them: too small, so close that the affine fit blows it
         up across the whole frame as the car passes under, or round enough of
         a corner that the board is edge on and the name would come out
         standing on its side. */
      var wpx = Math.hypot(trx - tlx, trY - tly), hpx = Math.hypot(blx - tlx, bly - tly);
      if (hpx < 5 || wpx > cam.w * 0.9 || wpx < hpx * (tw / th) * 0.4) {
        b.text.setAttribute('display', 'none');
        return;
      }
      b.text.removeAttribute('display');
      var W = b.w * TEXT_K, Hh = th * TEXT_K;
      b.text.setAttribute('fill', shade(SIGN_INK, Math.max(0, dot(faceN, LIGHT))));
      b.text.setAttribute('x', (W / 2).toFixed(1));
      b.text.setAttribute('y', (Hh * 0.74).toFixed(1));
      b.text.setAttribute('transform', 'matrix(' +
        ((trx - tlx) / W).toFixed(5) + ' ' + ((trY - tly) / W).toFixed(5) + ' ' +
        ((blx - tlx) / Hh).toFixed(5) + ' ' + ((bly - tly) / Hh).toFixed(5) + ' ' +
        tlx.toFixed(2) + ' ' + tly.toFixed(2) + ')');
    }

    /* ------------------------------ drawing ----------------------------- */
    // Per-sample points across the road, reused every frame. Out from the
    // centreline: verge, run-off, kerb, white line, track, then the same
    // again on the other side. Nothing down the middle, since a circuit has
    // no centre line painted on it.
    var OFFS = [
      -HALF - KERB_W - APRON_W - VERGE_W, -HALF - KERB_W - APRON_W, -HALF - KERB_W,
      -HALF, -HALF + EDGE_W, HALF - EDGE_W, HALF,
      HALF + KERB_W, HALF + KERB_W + APRON_W, HALF + KERB_W + APRON_W + VERGE_W
    ];
    var rows = [];
    function row(k) {
      if (!rows[k]) {
        rows[k] = {
          s: 0, x: 0, y: 0, nx: 0, ny: 0, lo: 0,
          pts: OFFS.map(function () { return [0, 0, 0]; }),
          lpts: [[0, 0, 0], [0, 0, 0]]
        };
      }
      return rows[k];
    }

    var facePool = [];
    var carYaw = 0, spin = 0, roll = 0, vel = 0;
    var lastD = null, lastT = 0;
    var w1 = [0, 0, 0], w2 = [0, 0, 0], w3 = [0, 0, 0];
    var w4 = [0, 0, 0], w5 = [0, 0, 0], w6 = [0, 0, 0];
    var tmp = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];

    function flagQuad(parts, sa, sb) {
      var pa = ptEx(sa, exA), ax = pa.x, ay = pa.y, aa = headEx(sa, 1);
      var pb = ptEx(sb, exB), bx = pb.x, by = pb.y, ba = headEx(sb, 1);
      toCam(ax + Math.sin(aa) * HALF, ay - Math.cos(aa) * HALF, 0, tmp[0]);
      toCam(bx + Math.sin(ba) * HALF, by - Math.cos(ba) * HALF, 0, tmp[1]);
      toCam(bx - Math.sin(ba) * HALF, by + Math.cos(ba) * HALF, 0, tmp[2]);
      toCam(ax - Math.sin(aa) * HALF, ay + Math.cos(aa) * HALF, 0, tmp[3]);
      quad(parts, tmp[0], tmp[1], tmp[2], tmp[3]);
    }

    /* The chequered band, two rows of square cells across the road, laid out
       the same way the flat map lays out its start line so the two views read
       as the same marking. `s0` is the near edge of the first row. */
    function chequer(light, dark, s0) {
      var cell = ROAD / FLAG_COLS, r, c;
      for (r = 0; r < 2; r++) {
        var pa = ptEx(s0 + r * cell, exA), ax = pa.x, ay = pa.y;
        var aa = headEx(s0 + r * cell, 1), anx = -Math.sin(aa), any = Math.cos(aa);
        var pb = ptEx(s0 + (r + 1) * cell, exB), bx = pb.x, by = pb.y;
        var ba = headEx(s0 + (r + 1) * cell, 1), bnx = -Math.sin(ba), bny = Math.cos(ba);
        for (c = 0; c < FLAG_COLS; c++) {
          var o0 = -HALF + c * cell, o1 = o0 + cell;
          toCam(ax + anx * o0, ay + any * o0, 0, tmp[0]);
          toCam(bx + bnx * o0, by + bny * o0, 0, tmp[1]);
          toCam(bx + bnx * o1, by + bny * o1, 0, tmp[2]);
          toCam(ax + anx * o1, ay + any * o1, 0, tmp[3]);
          quad((r + c) % 2 ? dark : light, tmp[0], tmp[1], tmp[2], tmp[3]);
        }
      }
    }

    /* A barrier straight across the track, closing off an end of an out lap:
       the face toward the car and its top, in the same colours as the tyre
       barriers round a corner. `dir` is the way its thickness runs, away from
       the track in both cases. */
    function gate(faces, tops, s, dir) {
      var p = ptEx(s, exA), a = headEx(s, 1);
      var nx = -Math.sin(a), ny = Math.cos(a);
      var fx = Math.cos(a) * WALL_T * dir, fy = Math.sin(a) * WALL_T * dir;
      var o0 = OFFS[0], o1 = OFFS[OFFS.length - 1];
      toCam(p.x + nx * o0, p.y + ny * o0, 0, w1);
      toCam(p.x + nx * o1, p.y + ny * o1, 0, w2);
      toCam(p.x + nx * o1, p.y + ny * o1, GATE_H, w3);
      toCam(p.x + nx * o0, p.y + ny * o0, GATE_H, w4);
      quad(faces, w1, w2, w3, w4);
      toCam(p.x + fx + nx * o1, p.y + fy + ny * o1, GATE_H, w5);
      toCam(p.x + fx + nx * o0, p.y + fy + ny * o0, GATE_H, w6);
      quad(tops, w4, w3, w5, w6);
    }

    function drawCar() {
      var k = CAM.carScale, cy = Math.cos(carYaw), syw = Math.sin(carYaw);
      var cr = Math.cos(roll), sr = Math.sin(roll), ry = ROLL_Y * k;
      var solids = [], i, j;
      for (i = 0; i < CAR.length; i++) {
        var s = CAR[i], local = [], camv = [], cx = 0, cyy = 0, cz = 0;
        if (s.wheel) spinWheel(s, spin);
        for (j = 0; j < s.v.length; j++) {
          var v = s.v[j];
          var x = v[0] * k, y = v[1] * k, z = v[2] * k;
          // The sprung parts roll about a centre just above the floor; the
          // wheels stay planted.
          if (!s.wheel) {
            var rx = x * cr - (y - ry) * sr;
            y = x * sr + (y - ry) * cr + ry;
            x = rx;
          }
          // Yaw about the car's own origin, positive to the right as
          // heading is in y-down SVG.
          var lx = x * cy + z * syw, lz = -x * syw + z * cy;
          local.push([lx, y, lz]);
          var c = view(lx, y, lz, [0, 0, 0]);
          camv.push(c);
          cx += c[0]; cyy += c[1]; cz += c[2];
        }
        var nv = s.v.length;
        solids.push({
          s: s, local: local, camv: camv,
          depth: Math.hypot(cx / nv, cyy / nv, cz / nv),
          centre: [cx / nv, cyy / nv, cz / nv]
        });
      }
      solids.sort(function (a, b) { return b.depth - a.depth; });

      var used = 0;
      for (i = 0; i < solids.length; i++) {
        var sol = solids[i];
        for (j = 0; j < sol.s.f.length; j++) {
          var face = sol.s.f[j];
          var A = sol.camv[face[0]], B = sol.camv[face[1]], Cc = sol.camv[face[2]];
          if (A[2] < NEAR || B[2] < NEAR || Cc[2] < NEAR) continue;
          // Normal in camera space, flipped to point out of the solid, then
          // culled if it faces away from the camera at the origin.
          var n = cross(sub(B, A), sub(Cc, A));
          var fc = centroid(sol.camv, face);
          if (dot(n, sub(fc, sol.centre)) < 0) n = [-n[0], -n[1], -n[2]];
          if (dot(n, fc) >= 0) continue;
          // Lighting from the same normal in the car's own frame.
          var ln = cross(sub(sol.local[face[1]], sol.local[face[0]]),
                         sub(sol.local[face[2]], sol.local[face[0]]));
          var lc = centroid(sol.local, face), lcen = centroid(sol.local, null);
          if (dot(ln, sub(lc, lcen)) < 0) ln = [-ln[0], -ln[1], -ln[2]];
          var mag = Math.hypot(ln[0], ln[1], ln[2]) || 1;
          var lam = Math.max(0, dot(ln, LIGHT) / mag);

          var d = '';
          for (var q = 0; q < face.length; q++) {
            var P = sol.camv[face[q]];
            d += (q ? 'L' : 'M') + sx(P).toFixed(1) + ' ' + sy(P).toFixed(1);
          }
          var node = facePool[used];
          if (!node) {
            node = el('path', { 'stroke-linejoin': 'round', 'stroke-width': '0.4' });
            carGroup.appendChild(node);
            facePool.push(node);
          }
          var fill = shade(sol.s.fc ? sol.s.fc[j] : sol.s.colour, lam);
          node.setAttribute('d', d + 'Z');
          node.setAttribute('fill', fill);
          // A hairline in the face's own colour closes antialiasing seams.
          node.setAttribute('stroke', fill);
          used++;
        }
      }
      for (i = used; i < facePool.length; i++) facePool[i].setAttribute('d', '');
    }

    /* One frame, at lap fraction `f`. Returns true if the band wants another
       frame soon: the body lean eases in its own time, so it keeps settling
       after the scroll has stopped. Nothing else here is time-based, so a
       still page costs nothing. */
    function frame(f) {
      var w = band.clientWidth, h = band.clientHeight;
      if (!w || !h) return false;
      var d = f * total;

      // Wheel spin and body lean, from how far the car moved since the last
      // frame. At a real rate the tread bands alias into a stroboscope and
      // appear to run backwards, so each frame's turn is capped under half a
      // band, which still reads as fast and always reads as forward.
      var now = performance.now();
      var dt = lastD === null ? 0 : Math.min(0.1, (now - lastT) / 1000);
      var moved = lastD === null ? 0 : d - lastD;
      lastD = d; lastT = now;
      spin += Math.max(-SPIN_CAP, Math.min(SPIN_CAP,
        moved * CAM.spinRate / (0.22 * CAM.carScale)));
      // Lean follows lateral acceleration, v squared over radius, so a quick
      // scroll through a corner leans harder than a slow one and a parked car
      // sits level. Curvature comes off the racing line, not the centreline,
      // so it is lower at an apex and higher on entry.
      if (dt > 0) {
        var v = Math.min(200, Math.abs(moved) / dt);
        vel += (v - vel) * Math.min(1, dt * 8);
      }
      var kappa = wrapPi(lineHeading(d + 2, 1.2) - lineHeading(d - 2, 1.2)) / 4;
      var target = CAM.roll * 0.1 * vel * vel * kappa / 56;
      target = Math.max(-0.22, Math.min(0.22, target));
      if (dt > 0) roll += (target - roll) * Math.min(1, dt * 5);

      // Camera origin is the car, and the car is on the worn line, so the
      // whole world shifts sideways as the line wanders across the road.
      var c = linePt(d, lpC);
      cam.cx = c.x; cam.cy = c.y;
      var camTh = lineHeading(d - CAM.lag, CAM.smooth);
      var carTh = lineHeading(d, 1.2);
      carYaw = wrapPi(carTh - camTh);
      cam.cos = Math.cos(camTh); cam.sin = Math.sin(camTh);
      var pitch = CAM.pitch * Math.PI / 180;
      cam.cp = Math.cos(pitch); cam.sp = Math.sin(pitch);
      cam.f = (h / 2) / Math.tan(CAM.fov * Math.PI / 360);
      cam.w = w;
      // Pin the principal point so the car lands at carY% down the band.
      var carC = view(0, 0, 0, [0, 0, 0]);
      cam.py = h * CAM.carY / 100 + cam.f * carC[1] / Math.max(carC[2], NEAR);

      var horizonY = cam.py - cam.f * Math.tan(pitch);
      elGround.setAttribute('y', Math.max(0, horizonY).toFixed(1));
      elGround.setAttribute('height', Math.max(0, h - horizonY).toFixed(1));
      elHorizon.setAttribute('y1', horizonY.toFixed(1));
      elHorizon.setAttribute('y2', horizonY.toFixed(1));
      elFog.setAttribute('y', horizonY.toFixed(1));
      elFog.setAttribute('height', CAM.fog.toFixed(1));
      fog.setAttribute('y1', horizonY.toFixed(1));
      fog.setAttribute('y2', (horizonY + CAM.fog).toFixed(1));

      // Samples fixed to the track, not to the car, so the kerbs and the
      // worn line do not swim as the car moves.
      var n = CAM.samples;
      var step = (CAM.draw + CAM.behind + 2) / n;
      var s0 = Math.floor((d - CAM.behind - 2) / step) * step;
      var k, j;
      for (k = 0; k <= n; k++) {
        var r = row(k), s = s0 + k * step;
        r.s = s;
        var q = ptEx(s, exA);
        r.x = q.x; r.y = q.y;
        var a = headEx(s, Math.min(step, 1));
        r.nx = -Math.sin(a); r.ny = Math.cos(a);
        for (j = 0; j < OFFS.length; j++) {
          toCam(r.x + r.nx * OFFS[j], r.y + r.ny * OFFS[j], 0, r.pts[j]);
        }
        var lo = r.lo = lineAt(s);
        toCam(r.x + r.nx * (lo - LINE_W / 2), r.y + r.ny * (lo - LINE_W / 2), 0, r.lpts[0]);
        toCam(r.x + r.nx * (lo + LINE_W / 2), r.y + r.ny * (lo + LINE_W / 2), 0, r.lpts[1]);
      }

      // Far to near, so later quads paint over earlier ones.
      var road = [], edge = [], ka = [], kb = [], wf = [], wt = [];
      var apron = [], verge = [], rline = [], rubber = [], base = [];
      for (k = n - 1; k >= 0; k--) {
        var R0 = rows[k], R1 = rows[k + 1];
        // An out lap's road runs on past both ends of the path, as far as the
        // barrier that closes each one.
        if (!closed && (R1.s <= -OPEN_IN || R0.s >= total + OPEN_OUT)) continue;
        var A = R0.pts, B = R1.pts;
        var idx = Math.round(R0.s / step);
        var mid = (R0.s + R1.s) / 2;
        // The run-in and the run-out are approach road, not racing surface,
        // so they carry no worn line, no rubber and no kerbs.
        var onLap = closed || (mid > 0 && mid < total);
        quad(base, A[0], B[0], B[9], A[9]);
        quad(verge, A[0], B[0], B[1], A[1]);
        quad(verge, A[8], B[8], B[9], A[9]);
        quad(apron, A[1], B[1], B[2], A[2]);
        quad(apron, A[7], B[7], B[8], A[8]);
        quad(road, A[3], B[3], B[6], A[6]);
        quad(edge, A[3], B[3], B[4], A[4]);
        quad(edge, A[5], B[5], B[6], A[6]);
        var corner = onLap ? cornerAt(mid) : null;
        // The line worn into the road, darker again through a corner, where
        // the cars are hardest on it.
        if (onLap) quad(rline, R0.lpts[0], R1.lpts[0], R1.lpts[1], R0.lpts[1]);
        if (corner) quad(rubber, R0.lpts[0], R1.lpts[0], R1.lpts[1], R0.lpts[1]);
        if (corner) {
          var into = idx % 2 ? kb : ka;
          if (corner.side > 0) quad(into, A[6], B[6], B[7], A[7]);
          else quad(into, A[2], B[2], B[3], A[3]);
          // A tyre barrier round the outside of the tight ones: the face
          // toward the road, then its top.
          if (corner.radius < TIGHT_R) {
            var o1 = -corner.side * WALL_AT, o2 = -corner.side * (WALL_AT + WALL_T);
            toCam(R0.x + R0.nx * o1, R0.y + R0.ny * o1, 0, w1);
            toCam(R1.x + R1.nx * o1, R1.y + R1.ny * o1, 0, w2);
            toCam(R1.x + R1.nx * o1, R1.y + R1.ny * o1, WALL_H, w3);
            toCam(R0.x + R0.nx * o1, R0.y + R0.ny * o1, WALL_H, w4);
            toCam(R1.x + R1.nx * o2, R1.y + R1.ny * o2, WALL_H, w5);
            toCam(R0.x + R0.nx * o2, R0.y + R0.ny * o2, WALL_H, w6);
            quad(wf, w1, w2, w3, w4);
            quad(wt, w4, w3, w5, w6);
          }
        }
      }
      /* The two ends of an out lap. A barrier across the track closes each
         one, far enough out that the road is still running when it reaches
         them. Drawn after the loop so they sit over the tyre barriers. */
      if (!closed) {
        var gs = -OPEN_IN, ge = total + OPEN_OUT;
        if (gs > d - CAM.behind && gs < d + CAM.draw) gate(wf, wt, gs, -1);
        if (ge > d - CAM.behind && ge < d + CAM.draw) gate(wf, wt, ge, 1);
      }

      elBase.setAttribute('d', base.join(''));
      elRoad.setAttribute('d', road.join(''));
      elVerge.setAttribute('d', verge.join(''));
      elApron.setAttribute('d', apron.join(''));
      elLine.setAttribute('d', rline.join(''));
      elRubber.setAttribute('d', rubber.join(''));
      elEdge.setAttribute('d', edge.join(''));
      elKA.setAttribute('d', ka.join(''));
      elKB.setAttribute('d', kb.join(''));
      elWallF.setAttribute('d', wf.join(''));
      elWallT.setAttribute('d', wt.join(''));

      /* Start/finish: a chequered band across the road at every multiple of
         the lap, or at the flag alone on an out lap, which also gets a plain
         line at its start so both ends of it are marked. */
      var flag = [], flagB = [], cell = ROAD / FLAG_COLS;
      var mark = closed ? Math.floor((d + CAM.draw) / total) * total : total;
      if (mark >= d - CAM.behind - 2 && mark <= d + CAM.draw) chequer(flag, flagB, mark - cell);
      if (!closed && 0 >= d - CAM.behind - 2 && 0 <= d + CAM.draw) flagQuad(flag, -0.3, 0.3);
      elFlag.setAttribute('d', flag.join(''));
      elFlagB.setAttribute('d', flagB.join(''));

      // Section boards. The nearest one ahead takes the accent, which is the
      // one the Next chip names.
      var nearest = null;
      for (k = 0; k < BOARDS.length; k++) {
        var ahead = closed ? pos(BOARDS[k].at - d) : BOARDS[k].at - d;
        if (ahead >= 0 && ahead <= CAM.draw && (!nearest || ahead < nearest.ahead)) {
          nearest = { b: BOARDS[k], ahead: ahead };
        }
      }
      for (k = 0; k < BOARDS.length; k++) {
        var bd = BOARDS[k];
        var rel = closed ? pos(bd.at - d + CAM.back + 2) - CAM.back - 2 : bd.at - d;
        drawBoard(bd, d + rel, rel <= CAM.draw && rel > -CAM.back - 2,
                  !!nearest && nearest.b === bd);
      }

      // Contact shadow: the car's footprint on the road, softened.
      var sh = [], sc = CAM.carScale, cyw = Math.cos(carYaw), syw2 = Math.sin(carYaw);
      var foot = [[-0.8, -1.05], [0.8, -1.05], [0.72, 1.2], [-0.72, 1.2]].map(function (p) {
        var x = p[0] * sc, z = p[1] * sc;
        return view(x * cyw + z * syw2, 0, -x * syw2 + z * cyw, [0, 0, 0]);
      });
      poly(sh, foot);
      elShadow.setAttribute('d', sh.join(''));

      drawCar();

      // The lean is the only thing still moving once the scroll stops.
      return Math.abs(target - roll) > 0.0008 || vel > 0.5;
    }

    readLivery();
    // The theme is an attribute on <html>, so the livery follows it without
    // the page having to tell the band anything.
    var watch = new MutationObserver(readLivery);
    watch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return {
      el: band,
      total: total,
      setBoards: setBoards,
      frame: frame,
      refresh: readLivery,
      dispose: function () {
        watch.disconnect();
        band.remove();
      }
    };
  }


  /* ------------------------------- tuning -------------------------------
     The camera is not settled, so the prototype's sliders come with it. A
     small button pins itself to the strip and opens a panel over the page.
     Every row writes straight into CAM, or into the layout custom properties
     for the ones the stylesheet owns, and asks the page for a frame. Copy
     settings puts the current numbers on the clipboard in the shape of the
     CAM block above, so whatever is settled on can be pasted back in here
     and the panel dropped. */
  var SPEC = [
    ['height',    'Camera height',     0.2, 200, 0.5,  'cam'],
    ['back',      'Camera behind car', 0,   120, 0.5,  'cam'],
    ['pitch',     'Pitch down, deg',   0,   89,  0.5,  'cam'],
    ['fov',       'Vertical FOV, deg', 8,   100, 1,    'cam'],
    ['carY',      'Car on screen, %',  10,  100, 1,    'cam'],
    ['draw',      'Draw ahead',        20,  500, 5,    'cam'],
    ['behind',    'Draw behind',       0,   400, 5,    'cam'],
    ['boardTilt', 'Banner lean, deg',  0,   85,  1,    'cam'],
    ['gantry',    'Gantry height',     1.5, 9,   0.1,  'cam'],
    ['lag',       'Camera lag',        0,   12,  0.1,  'cam'],
    ['smooth',    'Heading smoothing', 0.5, 20,  0.5,  'cam'],
    ['carScale',  'Car scale',         0.3, 4,   0.05, 'cam'],
    ['samples',   'Road samples',      16,  260, 1,    'cam'],
    ['spinRate',  'Wheel spin',        0,   3,   0.05, 'cam'],
    ['roll',      'Body lean',         0,   3,   0.05, 'cam'],
    ['width',     'Strip width, px',   200, 620, 4,    'css', '--c3d-w'],
    ['fadeY',     'Fade top, %',       0,   30,  1,    'css', '--c3d-fade-y'],
    ['fadeX',     'Fade sides, %',     0,   30,  1,    'css', '--c3d-fade-x']
  ];

  function tune(opts) {
    opts = opts || {};
    var onChange = opts.onChange || function () {};
    var root = document.documentElement;
    var host = document.createElement('div');
    host.className = 'c3d-tune';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'c3d-tune-btn';
    btn.setAttribute('aria-expanded', 'false');
    btn.title = 'Tune the circuit';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/>' +
      '<circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/>' +
      '<circle cx="18" cy="18" r="2"/></svg>';

    var panel = document.createElement('div');
    panel.className = 'c3d-tune-panel';
    panel.hidden = true;

    // A css row starts from whatever the stylesheet computed, so the panel
    // opens on what is actually on screen rather than a second set of
    // defaults that can drift from it.
    function read(row) {
      if (row[5] === 'cam') return CAM[row[0]];
      var v = parseFloat(getComputedStyle(root).getPropertyValue(row[6]));
      return isNaN(v) ? row[2] : v;
    }
    function write(row, v) {
      if (row[5] === 'cam') { CAM[row[0]] = v; return; }
      root.style.setProperty(row[6], v + (row[6] === '--c3d-w' ? 'px' : '%'));
    }

    SPEC.forEach(function (row) {
      var wrap = document.createElement('label');
      wrap.className = 'c3d-tune-row';
      var v = read(row);
      wrap.innerHTML = '<span>' + row[1] + '</span><output>' + v + '</output>';
      var input = document.createElement('input');
      input.type = 'range';
      input.min = row[2]; input.max = row[3]; input.step = row[4];
      input.value = v;
      var out = wrap.querySelector('output');
      input.addEventListener('input', function () {
        var n = parseFloat(input.value);
        out.textContent = input.value;
        write(row, n);
        onChange();
      });
      wrap.appendChild(input);
      panel.appendChild(wrap);
    });

    var copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'c3d-tune-copy';
    copy.textContent = 'Copy settings';
    copy.addEventListener('click', function () {
      var lines = SPEC.filter(function (r) { return r[5] === 'cam'; })
        .map(function (r) { return '    ' + r[0] + ': ' + CAM[r[0]] + ','; });
      var w = getComputedStyle(root).getPropertyValue('--c3d-w').trim();
      var text = 'var CAM = {\n' + lines.join('\n') + '\n    fog: ' + CAM.fog +
        '\n  };\n/* --c3d-w: ' + w + ' */\n';
      if (navigator.clipboard) navigator.clipboard.writeText(text);
      copy.textContent = 'Copied';
      setTimeout(function () { copy.textContent = 'Copy settings'; }, 1200);
    });
    panel.appendChild(copy);

    btn.addEventListener('click', function () {
      panel.hidden = !panel.hidden;
      btn.setAttribute('aria-expanded', panel.hidden ? 'false' : 'true');
    });

    host.appendChild(btn);
    host.appendChild(panel);
    document.body.appendChild(host);
    return { el: host, dispose: function () { host.remove(); } };
  }

  return { create: create, tune: tune };
})();
