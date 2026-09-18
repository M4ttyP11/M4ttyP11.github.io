# Work log, Wesbite-improvements worktree

Append-only record of what Claude has done here. Newest entry at the bottom.
This file is injected at the start of every session (including after `/clear`
and `/compact`) by the SessionStart hook in `.claude/settings.json`, so it is
the memory that survives a context wipe. Keep it factual and short: what
changed, why, and anything still open.

Repo: M4ttyP11.github.io, a personal portfolio site (static HTML + CSS, no build
step, GitHub Pages via CNAME). Branch: `M4ttyP11/Wesbite-improvements`.

---

## Backfill from git history (before the log existed)

- `8566ade` Initial site.
- `8e95d88` Redesign onto a shadcn-style visual system: CSS custom properties for
  colour tokens, card and badge primitives, dark theme.
- `fa0ded1` / `4f86dd1` Added a research section, an education section, and the
  first-class classification detail.
- `27c0791` Restructured the page layout, unified the badge system so every tag
  and pill renders through one set of classes, polished the hero.
- `d2d49c5` Added `assets/`, an intro animation, reordered the projects section,
  and swept every em dash out of the site copy.

## 2026-09-04, uncommitted work in progress

- `index.html`: moved the "Download full CV" button out of `.hero-actions` inside
  the education block and gave it its own `.hero-actions.edu-actions` row below.
  Added an `.edu-cards` card for the Applied F1 Aerodynamics Program (Racetrack
  Dynamics, September 2026, High Distinction scholarship), reusing the shared
  `.card` markup.
- `style.css`: added `.edu-cards` and `.edu-actions` spacing rules only. No new
  card styling, the scholarship card rides on the existing `.card` system.
- Status: not committed yet.

## 2026-09-04, work-log memory set up

- Added `.claude/WORKLOG.md` (this file) and `.claude/settings.json` with a
  SessionStart hook that prints it into context on startup, `/clear`, and resume.
- Added a "Work log" section to `CLAUDE.md` telling Claude to append here.
- Added `MEMORY.md` plus `portfolio-site.md` and `worktree-worklog.md` to the
  user memory directory so the convention is known outside this worktree too.

## 2026-09-04, project detail pages

- Split every project with real content onto its own page under `projects/`:
  `motogp-cornering-aerodynamics`, `retroreflective-piv`,
  `f1-lap-time-simulator`, `formula-student`, `fixed-wing-uav`,
  `cubesat-mission-design`. Each has a hero with pill, title, meta, lede and a
  stat row, a two-column body (prose plus a sticky facts rail), figures, and a
  previous/next pair at the bottom that cycles through all six.
- `index.html` now carries briefs only. The three major projects keep their
  lede, one paragraph, tags and stats, and gained a "Read the full project"
  button; their figures and abstracts moved to the detail pages. The three
  "Other work" cards became whole-card links with a "Read more" affordance.
- Extracted the index's inline behaviour script into `site.js`, shared by all
  seven pages. The theme-preventing-flash snippet stays inline in each head;
  the intro curtain stays on the index only.
- `style.css` gained a PROJECT PAGES block: `.proj-hero`, `.proj-grid`,
  `.proj-rail`, `.prose`, `.callout`, `.gallery`, `.proj-next`, plus `a.card`
  and `.card-more` for the clickable index cards. No tokens or primitives
  changed.
- Open: the Formula Student, UAV and CubeSat pages carry gallery placeholders
  (`fs-cfd.jpg`, `uav-cad.jpg`, `cubesat-orbit.jpg` and so on) that hide
  themselves until real images land in `assets/images`. Those three projects
  also have the thinnest copy, since the index had least to say about them.
- Not committed.

## 2026-09-04, project links open in a dialog

- Project links on the index no longer navigate. `site.js` fetches the real
  page under `projects/`, lifts its `.proj-hero`, `.proj-body` and
  `.proj-next`, and renders them in a `<dialog>` sized at min(1100px, 94vw) by
  90vh. shadcn dialog treatment: dimmed blurred backdrop, hairline border,
  sticky header with the project title, an "open as full page" icon and a
  close button. Escape, backdrop click and Back all close it.
- The standalone pages stay real and linkable. Nothing swallows a click it
  cannot service: modified clicks, a missing `<dialog>`, no `fetch`, or a
  failed request all fall through to plain navigation. This is also what
  happens over `file://`, where fetch is blocked by CORS, so the dialog only
  shows over HTTP. Test with `python -m http.server`, not by opening the file.
- Gotcha worth keeping: opening a project rewrites the address bar via
  `pushState`, which changes what later relative URLs resolve against. Without
  care, `projects/x.html` inside the dialog became `projects/projects/x.html`.
  `site.js` pins the index URL in `BASE` at load and resolves everything, both
  its own fetches and every path in the injected markup, against that.
- Verified with a jsdom harness (29 checks: injection, path rebasing, history,
  prev/next swapping in place, close, modified clicks, fetch-failure
  fallback). The harness lives in the session scratchpad, not in the repo.
- Not committed.

## 2026-09-04, dialog sizing and project page layout

- Dialog grown to min(1500px, 96vw) by 94vh, from min(1100px, 94vw) by 90vh.
- The abstract on the PIV and F1 pages is no longer a `<details>` disclosure.
  It renders as a bordered block in the article. All `.abstract` /
  `.abstract-body` CSS replaced by `.abstract-block`.
- Killed the sticky right-hand rail. It was costing the prose a third of the
  width and leaving both columns cramped. Its content is now a `.proj-band`
  under the hero: a `<dl class="proj-facts">` of labelled key/value pairs on an
  auto-fit grid, plus a `.proj-tools` row for the methods tags. The rail's
  bullet list had no labels, so each page got labels written for it (Project,
  Institution, Role, Result and so on). The duplicate "Documents" block was
  dropped, since the hero already carries those buttons.
- `.proj-grid` and `.proj-rail` are gone. `.proj-rail-label` renamed
  `.micro-label`, still used by the band and the prev/next cards.
- `.prose` is now a three-column grid: text holds a 72ch measure while figures
  and galleries break out to 100ch, so extra width goes to the pictures rather
  than to the paragraph length.
- `site.js` `build()` lifts `.proj-band` too, otherwise the dialog would drop
  it. Worth remembering: any new top-level section on a project page has to be
  added to that selector list or it will not appear in the dialog.
- jsdom harness extended to 35 checks, all passing.
- Not committed.

## 2026-09-04, dialog exits and image carousels

- "Stuck in the dialog" reported. Nothing was broken: links, prev/next and the
  PDFs all worked when driven under Playwright. The fault was discoverability.
  The dialog replaces the site nav while open, and the only way out was a 34px
  transparent ghost icon. Fixed by making the exit obvious rather than tidy:
  the header close is now a bordered button reading "Close" with an Esc hint,
  and `render()` appends a second Close button below the prev/next cards so
  the end of a long scroll is not a dead end.
- Every figure and gallery on the project pages is now a single `.carousel`:
  one image at a time, with arrows, dots, a counter and the caption lifted
  below the frame. Keyboard left/right work. Markup is a plain stack of
  `<figure class="carousel-slide">`, so with no JS every image is still there,
  just listed; `site.js` adds `.is-ready`, which is what collapses the stack.
  Controls hide themselves at one slide (`.is-single`) and the whole thing
  hides at zero (`.is-empty`), so the placeholder slots on the thinner pages
  cost nothing until real images land. `.gallery` and `.figure-grid` retired.
- Carousel arrows are deliberately always visible, not hover-revealed. Same
  reasoning as the close button.
- Two bugs the browser caught that jsdom had not:
  1. `error` does not bubble, so the slide-removal listener has to be on
     capture, and capture runs BEFORE the target's own inline `onerror`. The
     re-count was therefore counting the slide that was about to be removed.
     `sync` is now deferred through `setTimeout(..., 0)`.
  2. Carousel images had `loading="lazy"`, but only the active slide is
     visible, so a dead placeholder slide would never attempt a load and never
     report failure. Carousel images now load eagerly.
- Verified with Playwright against the local server (24 checks plus
  screenshots) alongside the jsdom suite (35 checks). Both green, no page
  errors. Both harnesses live in the session scratchpad, not the repo.
- Not committed.

## 2026-09-04, "dead links" report, investigated

- Reported that `.proj-back` and both `.proj-next-card` links did nothing, from
  a `file://` URL. Investigated in Chromium against that exact file:// path:
  all three navigate correctly, the nav brand works, and nothing calls
  preventDefault on the click. The site is not at fault. Clicks were being
  captured by the design-feedback tool's element-selection mode, which is how
  it picks the element being annotated.
- Acted on the perception problem anyway: `.proj-back` was 13.6px muted grey
  text with no border or background, so it read as a caption rather than a
  control. It is now a bordered ghost button with an arrow that shifts on
  hover. Also made it `display: flex; width: fit-content` so the status pill
  below starts its own line instead of sitting alongside it and reading as a
  second button.
- Worth remembering: over `file://` the dialog never engages, because fetch is
  blocked by CORS there, so local file previews always show the plain-page
  fallback. That is by design, but it means file:// is not a fair preview of
  the deployed experience. Use the local server.
- Three suites green: file:// navigation (5 checks), Playwright dialog and
  carousel over HTTP (24), jsdom (35).
- Not committed.

## 2026-09-05, slimmed the three major-project cards

- Design feedback: the index had far too much going on. Since each major project
  already opens into a full page, the summary cards were carrying detail that
  belongs there.
- `index.html`: rewrote the three `.paper` cards in `#major` down to pill, title,
  meta, a single lead paragraph, three tags and one "Read the full project"
  button. Dropped the second body paragraph, the two extra tags per card, the
  three-stat `.paper-stats` aside, and the secondary PDF buttons (poster,
  write-up). Nothing was lost: the stats already appear on each project page,
  and both PDFs are linked prominently there too.
- `style.css`: replaced the RESEARCH PAPERS block. Removed `.paper-head`,
  `.paper-grid`, `.paper-body`, `.paper-stats` and their 900px media query,
  all now unused. Added `.paper-lead` (68ch measure), tighter card padding and
  a 1.25rem gap between cards.
- Card heights went from 692/732/732px to 399/435/399px.
- Note for future sessions: the Orca browser aggressively caches `style.css`, so
  CSS edits looked like they were not applying. Serve the site with no-cache
  headers when working on CSS, not plain `python -m http.server`.
- Status: not committed.

## 2026-09-05, carousel rebuilt

- Reported problem: images were not being shown in full. Root cause found in
  `.carousel.is-ready .carousel-slide`, which was `display: grid` with an auto
  row. The image's `height: 100%` had no definite height to resolve against, so
  it fell back to `auto`, laid out at its intrinsic ratio, overflowed the frame
  and was cropped by `overflow: hidden`. `object-fit: contain` never applied.
  Measured 967x759 inside a 631px frame.
- Fix: the slide is now `display: flex`, which gives a definite height for
  percentages to resolve against. The photo is `width/height: 100%` with
  `object-fit: contain`, so it fills the frame without cropping.
- The shadow on the photo has to be `drop-shadow`, not `box-shadow`. With
  `object-fit: contain` the element box is the full slide, so a box-shadow would
  draw a rectangle around the empty letterbox bars. `drop-shadow` follows the
  rendered pixels.
- Frame aspect ratio is now computed per carousel in `site.js` (`fitFrame`),
  from the narrowest image ratio in that carousel, clamped to 4/3 to 16/9. The
  single-image pages end up with zero letterboxing (PIV 1.666, F1 1.638) and the
  two-image MotoGP one clamps to 4/3. Still a fixed ratio per carousel, so no
  layout jump when the slide changes.
- Animation: directional. `data-dir` on the root plus a `data-leaving` attribute
  on the outgoing slide means the incoming one drifts in from the side you are
  travelling towards while the outgoing one leaves the other way, instead of a
  plain dissolve. Caption cross-fades via `.is-turning`.
- Trap worth remembering: `.carousel.is-ready[data-dir="next"] .carousel-slide`
  and `.carousel.is-ready .carousel-slide[data-active]` have identical
  specificity, so the directional rule won on source order and pinned the active
  slide 26px off-centre. The directional selectors now carry
  `:not([data-active])`.
- Also added: swipe via pointer events with a vertical guard, arrow keys on a
  focusable frame with carousel roles, neighbour preloading, pill-shaped
  progress dots, focus-visible rings, and a mobile stacked footer.
- Tried and rejected: a blurred copy of the image behind it to fill the bars.
  These are CAD renders on white, and it read as a smudge. Frame is a flat
  `hsl(var(--muted) / .4)` panel instead.
- Open: the source images are small. `gdp-model.webp` is 584x458 and
  `gdp-model-2.webp` is 708x439, so they upscale about 1.4x to 1.65x at the
  1009px carousel width and look soft. Higher-resolution exports would fix that,
  nothing in the CSS can.
- Status: not committed.

## 2026-09-05, carousel changed from cross-fade to a sliding track

- Feedback on the previous version: the images should shift along, one leaving
  as the next arrives from the other side, rather than dissolving in place with
  a small directional nudge.
- `site.js` now builds a `.carousel-track` inside the frame and moves every
  slide into it. Slides are `flex: 0 0 100%` in a row, and navigation sets one
  transform on the track: `translate3d(calc(<-index*100>% + <drag>px), 0, 0)`.
  Verified travelling a full frame width, 0 to -1007px, on an ease-out.
- Dropped from the previous version, now unnecessary: the per-slide opacity and
  visibility handling, `data-dir`, `data-leaving`, and the specificity fix that
  went with them. The track makes all of it redundant.
- Behaviour change worth knowing: the track has ends rather than wrapping. Going
  from the last image back to the first would otherwise rewind the strip past
  every slide in between, which reads as a glitch. The arrow that would do
  nothing is now `disabled` and dimmed. Say so if wrapping is wanted back; it
  needs cloned edge slides and a transition-less reposition to stay seamless.
- Drag now follows the pointer live instead of only acting on release, so the
  gesture feels attached to the image. Axis is decided in the first 8px and a
  vertical gesture is handed back to the page. Past either end the drag is
  damped to 0.32 rather than blocked. Commits over 50px, otherwise snaps back.
  A capture-phase click handler swallows the click that would otherwise fire at
  the end of a drag.
- Verified across all six project pages: single-image pages get an exact-fit
  frame and no controls, the three placeholder pages still hide, nothing
  overflows, console clean.
- Still open: the source images are small and upscale about 1.4x to 1.65x at the
  1009px carousel width. Higher-resolution exports are the only fix.
- Status: not committed.

## 2026-09-05, MotoGP pill relabelled

- Feedback: the "Project lead · current" pill should read "Group Design
  Project", since the leadership is already made clear elsewhere.
- Changed in both places the pill appears: the index card (`index.html`) and the
  project page hero (`projects/motogp-cornering-aerodynamics.html`). The same
  reasoning applies to both and leaving them different would read as an
  oversight.
- Leadership is still carried by the "Project leadership" tag on the project
  page, the "I now lead the project" paragraph there, and the index card lead.
- Raised, not changed: the pill now repeats the meta line directly beneath it,
  "Group Design Project" against "Final-year Group Design Project ·
  Self-proposed · 2026–27". Trimming the meta to "Final-year · Self-proposed ·
  2026–27" would clear it, but that is a copy call for Matty.
- Status: not committed.

## 2026-09-08, domain reputation and crawler files

A contact tried to open mathiaspotter.co.uk inside a company network and
WatchGuard blocked it as a newly registered / uncategorised domain. The NRD
part is purely time-based (roughly 30 days from registration) and cannot be
fixed from the repo. The uncategorised part can, so added the signals
categorisation engines and crawlers look for:

- `robots.txt`, `sitemap.xml` (home plus the six project pages)
- `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`: navy MP mark generated
  with PIL from the `--accent` value hsl(214 90% 36%) = #0951ae
- `.well-known/security.txt`, contact is the address already public on the page
- `rel="canonical"`, icon links and `theme-color` in every head, plus the
  `og:url` that the project pages were missing

Committed as `07ce3ed`.

Still open, and off-repo: submit the domain for recategorisation to WatchGuard,
Broadcom Site Review, Cisco Talos, FortiGuard, Palo Alto and Trellix, and
register the site with Google Search Console and Bing Webmaster Tools. Also
still open from before: the og:preview image is TODO in `index.html`, so the
og:image tag remains commented out.

## 2026-09-08, copy pass and card hover, shipped to main

Matty ran a text pass on the home page in the Orca editor while I worked in the
same files. Two collisions worth remembering:

- His editor buffer was unsaved for a long stretch, so the file on disk and the
  local preview both looked unchanged. Nothing is real until Ctrl+S.
- When he did save, the buffer overwrote two edits I had already applied. Check
  `git diff` before assuming your own edits survived a user save.

Changes: hero lede, education meta, scholarship card, CV button label, major
projects heading and standfirst, MotoGP lead. Plus a `.paper` hover cue matching
`.placement`.

Real bug found on the way: `.reveal.in { transform: none }` sits later in
`style.css` than the card rules at equal specificity, so it was cancelling the
`:hover` lift on `.paper`, `.placement` and `.card`. Placements had never
actually lifted. The reveal offset now uses the independent `translate`
property so the two no longer collide.

Also: the Orca browser served a stale `style.css` for a while and made the
hover work look broken. The local preview now runs through
`scratchpad/serve.py`, which sends `Cache-Control: no-store`.

Do not use `orca computer` in this repo. I tried it to save his editor buffer
and it kept pulling his window focus around. Orca's browser commands
(`goto/reload/snapshot/eval/hover`) are fine, they never touch windows.

Committed as `69e216d` and pushed to `main`, so the live site is deploying.

## 2026-09-12, circuit minimap prototype

Prototyped the simple version of the "scroll is a lap" idea, after laying out
simple and complex variants for Matty.

- `index.html`: new `.circuit` aside before the project dialog. Inline SVG with
  the track path, a racing-line path, a start/finish tick, six corner dots
  carrying `data-target` / `data-name`, and the car group. `aria-hidden`, since
  the nav remains the real navigation.
- `style.css`: `.circuit*` block at the end. Card sits fixed bottom-right,
  hidden until JS adds `data-ready`, and hidden entirely under 900px and under
  `prefers-reduced-motion`.
- `site.js`: new IIFE at the end. Samples the path into a 900-point lookup
  table once, finds each dot's position along the lap from it, then maps scroll
  progress through those corners piecewise so the car sits exactly on a dot
  when its section reaches the top of the viewport. rAF-throttled scroll,
  debounced resize, re-measure on load.

The track path was generated by rounding a nine-vertex polygon into straights
joined by tangent arcs, so it reads as a real circuit rather than a blob. The
generator lives only in the scratchpad, the resulting `d` string is baked into
the markup. Corner apex coordinates came from the same script.

Two bugs found and fixed while verifying in Orca's browser:
- The contact section starts below the last scrollable pixel, so its anchor
  clamped to 1.0 and collided with the lap-closing key, dividing by zero. The
  lap now only closes when there is scroll left to close it in, otherwise the
  last corner is the end of the run.
- Rounding made the current-corner test fall one dot behind at an exact anchor.
  Added a small epsilon.

Verified at every section anchor: car-to-corner error 0.00 to 0.32 SVG units,
which is under half a pixel at the rendered size, and the right dot lights in
each case. Checked in both themes.

Open: not committed. Nothing beyond the simple version is built, no sector
timing, no speed trace, no pit lane. The circuit is invented, not a real track.

## 2026-09-12, agreed pivot: fixed car, moving track

Matty prefers a different framing to the minimap that is now built, and wants to
go this way instead. Nothing below is implemented yet. The built minimap stays
in the worktree as the starting point, since most of its internals carry over.

The idea: a tall narrow strip fixed to one side of the page. The car is static
and always points to the top of the page. The track moves and rotates beneath
it, so you see a top-down window onto the circuit around your current position
rather than the whole lap.

Core change, smaller than it sounds. Stop moving the car along the path and
apply the inverse transform to the track group instead:

  translate(cx cy) rotate(-90 - th) translate(-P.x -P.y)

where P is the point at the current lap distance and th its heading in degrees.
Right to left: put P at the origin, rotate its tangent to point up the screen,
move the origin to the fixed pivot. The LUT, the corner-to-section mapping, the
rAF throttle and the resize handling all carry over untouched. The closed loop
makes the start/finish wrap seamless for free.

Strip contents: viewBox in track units sets the zoom, roughly
`-22 -62 44 92` to show about 17% of the 531-unit lap. Three layers in the
rotating group: the full loop drawn faintly so distant parts sweep past, a
bright window of track around the car via stroke-dasharray, and corner dots
counter-rotated by (90 + th) so labels stay upright. A linear-gradient mask
fades the top and bottom edges.

Problems identified, with the agreed fixes:
- Heading jitter. Sample the tangent across s-5 to s+5 rather than s to s+1.5,
  or the whole world shakes on tight arcs.
- Angle wrap. Only bites if the heading is ever eased toward a target. Unwrap
  by +/-360 until the delta is under 180.
- Layout collision, the real constraint. --container is min(1140px, 90vw), so
  at 1280px the gutter is 70px each side and a 132px strip would cover body
  text by 60px. Gate the strip at min-width 1280px and at that breakpoint set
  the container to min(1140px, calc(100vw - 340px)) so the strip sits in real
  gutter space.
- Variable track speed. The corner-locked mapping varies units per scroll pixel
  between sections. Invisible in a 164px minimap, obvious at this zoom. Agreed
  approach: keep the corner lock but clamp the per-segment speed ratio so no
  segment runs more than about twice the slowest.
- Moving dots are hard to click. Keep the click, but add a fixed chip above the
  strip naming the next corner and make that the reliable target.

Sub-pages. Project pages carry 2 to 6 <h2> headings and no section ids, so a
hand-drawn track per page does not scale. Extract the component to take a path
d string plus a marker list. Home page passes the hand-built circuit and its
six section ids. Project pages pass a runtime-generated open-ended path built
from their h2 elements, framed as an out lap rather than a lap, in a different
colour. The polygon-rounding generator can run in the browser for this.

The modal matters most, since site.js already loads project pages into a dialog
and that is the path most visitors take. On open, freeze and dim the strip: the
car is in the garage. On close, resume. Build this before the full-page case.
Optional extra, carrying the lap fraction across navigation via the hash or
sessionStorage so an out lap starts where you left the circuit. Cosmetic, cut
it first if it fights.

Agreed build order: 1) swap the transform, reuse everything else, judge the
feel. 2) strip layout, gutter fix, mask and dash window. 3) smooth the heading,
add the next-corner chip. 4) freeze and dim on modal open. 5) extract the
component and generate out laps from h2s. 6) continuity across navigation.
Steps 1 to 3 carry the whole idea, the rest is polish.

Reduced motion and mobile matter more here than for the minimap, since a
rotating world is far more motion than a 3px dot. Keep both hard off, and
consider giving reduced motion the flat progress rail rather than nothing.

Open: step 1 not started. Matty was asked whether to do it now so the feel can
be judged before committing to the strip layout, and had not answered.

## 2026-09-12, step 1 of the pivot: fixed car, moving track

Swapped the transform, everything else reused as agreed. The car no longer
moves. It sits at the SVG origin as `rotate(-90) scale(.62)` and the new
`#circuitWorld` group carries the inverse, `rotate(-90 - th) translate(-P)`,
so the circuit slides and turns beneath it.

- `index.html`: wrapped kerb, racing line, start/finish tick and dots in
  `#circuitWorld`. viewBox is now a window in track units, `-32 -60 64 88`,
  about 3x the old zoom, with the origin 68% down the frame so most of what
  you see is road ahead.
- `site.js`: `render()` sets the world transform instead of a car transform.
  Heading is sampled symmetrically, s-3 to s+3, rather than forward-only from
  s to s+1.5. The jitter the log predicted was real at this zoom.
- `style.css`: `.circuit-map` clips instead of `overflow: visible`, and dot
  radii, start/finish and car stroke widths came down to suit the zoom.

Still the old card: 164px, fixed bottom-right, now about 225px tall. Strip
layout, gutter fix, mask and dash window are step 2.

Bug found while verifying. The lap ran a corner behind after scrolling through
the page: lazy images load on the way down and change `scrollHeight` under the
mapping, which was only measured on load. Invisible in the minimap, obvious at
this zoom. Added a `ResizeObserver` on `document.body` feeding the same
debounced remeasure as `resize`.

Verified in Orca's browser at all six section anchors: correct corner lights
each time and the dot lands on the car within 0.00 to 0.32 SVG units, under
half a pixel rendered. Local preview at `http://127.0.0.1:8777` with
`Cache-Control: no-store`, server script in the session scratchpad.

Open: not committed. Steps 2 to 6 unstarted.

## 2026-09-12, the lap now finishes

The run ended at the contact corner, f = 0.88, never crossing the line. Cause
was the anchoring rule, not the mapping: the contact section starts at 6559px
on a page whose last scrollable pixel is 5895, so it can never reach the top of
the viewport, its anchor clamped to 1.0, and the closing key was suppressed
because the last corner already sat on the end of the scroll.

Three changes in `measure()` and `render()` in `site.js`:

- A section whose top-of-viewport anchor would fall past the end of the scroll
  is anchored to the moment it enters the viewport instead, `top - innerHeight`.
  Contact now lands at 0.895 rather than 1.0.
- The backward cap starts at 0.985 instead of 1, so there is always scroll left
  between the last corner and the line.
- The closing key `{ s: 1, f: 1 }` is now unconditional, and start/finish takes
  the highlight back off the last corner once f passes 0.99.

Verified: bottom of the page is f = 1 with the start/finish point on the car to
0.00 units, the contact corner is hit to 0.16 units exactly as the contact
section enters the viewport, and the other five anchors are unchanged at 0.00
to 0.32. The final stretch is 10.5% of the scroll for 12% of the lap, so it
runs at about the same speed as the rest, no spike at the end.

Open: still not committed. Step 2 next.

## 2026-09-12, step 2: the strip

The bottom-right card is gone. The circuit now runs in a strip fixed in the
right-hand gutter, vertically centred, 128px by 317px including the label.

- `style.css`: `.circuit` has no border, no background and no blur. A
  linear-gradient mask fades the road out at the top and bottom instead of a
  frame cutting it off. Position is
  `right: calc((100vw - var(--container)) / 2 - 160px)`, so the strip tracks
  the container rather than the viewport and holds a constant 25px clear of
  the body text at any width. Measured 25px at 2279px wide, and the algebra
  makes it width-independent: the gap works out at 24 minus half the scrollbar.
- Gutter fix as planned. The strip is `display: none` by default and only
  appears at `min-width: 1280px`, where `--container` becomes
  `min(1140px, calc(100vw - 340px))`. At 1280px that is a 940px container in
  170px gutters, which is the narrowest case the strip has to live in.
- `index.html`: viewBox is `-22 -70 44 102` in track units, so the origin sits
  69% down the strip and most of what you see is road ahead. About a fifth of
  the lap is in frame.
- Three track layers now, all the same geometry, and `site.js` copies the path
  data onto the other two at build time so the markup carries it once instead
  of three times. The whole loop faintly, a bright window of road around the
  car, and the accent trail behind it. The two overlays are cut with
  `stroke-dasharray`: a dash of length L starting at distance a is
  `dasharray: L (total - L)` with `dashoffset: -a`, which wraps seamlessly at
  the seam because the loop is closed. Verified crossing the line at the foot
  of the page: the road ahead runs through the seam unbroken.
- The window runs 92 units ahead and 44 behind, both past the edges of the
  strip so the ends of the dash never show. The accent trail is capped at the
  distance actually driven, so nothing is lit before it has been.
- The faint loop is drawn in `hsl(var(--muted-foreground) / .18)`, not
  `--border`: in dark theme that token is 15% lightness on a 4% ground and
  disappeared entirely.
- The current corner is a ring rather than a filled dot. Filled, it read as a
  blob under the car instead of a corner marker.

Checked in both themes and at all six anchors, which are unchanged at 0.00 to
0.32 units.

Not done from the step 2 list: corner dots are not counter-rotated, since they
are plain circles with nothing to keep upright. That becomes necessary if the
corner names ever go inside the strip, which the next-corner chip in step 3 is
meant to avoid.

Open: not committed. Step 3 next, smoothing the heading and the chip.

## 2026-09-12, strip resized to fill the gutter, and a car-sized car

Feedback: the strip took up almost none of the space available on the right.
It was 128 by 297 in a 570px gutter. Now 380 by 972.

- `style.css`: `--gutter` and `--strip-w` are now explicit. The strip is as
  wide as the gutter allows up to 380px, capped at 34vh so it can never run
  past the top and bottom of the window, and it sits centred in the gutter
  rather than pinned to the body text. Measured at 2279px wide: 380 by 972,
  155px clear top and bottom, 87px to the text and 110px to the window edge,
  the difference being the scrollbar in `100vw`.
- The map holds its shape with `aspect-ratio: 48 / 120` and the viewBox is a
  matching `-24 -84 48 120`, so the zoom is identical at every size: 84 units
  of road ahead of the car, 36 behind. The lit window grew to 108 ahead and 60
  behind to stay past the edges.
- Tried and dropped on the way: computing the viewBox in JS from the strip's
  pixel box at a fixed units-per-pixel. It made the zoom independent of the
  box shape, but at the 1280px breakpoint the strip is only 114px wide, and a
  fixed zoom there put a 4.2-unit road across a 14-unit frame. A fixed aspect
  plus a fixed viewBox is simpler and scales properly.

Also acted on the second half of the feedback, the car and the road being out
of proportion. Taking the 4.2-unit road as a 12m track, one unit is about 2.9m,
so the car is now drawn at 0.72 by 1.62 units: a 2.1m by 4.7m car. On screen
that is 33px of road and a 6px car, which is the right relationship for the
first time. The corner dots came down with it, from 2.4-unit rings to 1.1-unit
apex marks, since anything bigger reads as a hole punched in the track.

Still out of proportion and noted for later: the accent trail and the grey road
ahead are the same centreline at the same width, so there is no racing line
inside the track edges, no apexes, and no track limits. Doing it properly means
drawing the track as a filled band with two edges and putting a separate
racing-line path inside it, which is a bigger job than the dash window and is
the natural home for the "car takes a line through the corner" idea.

Open: not committed. Step 3 still to do.

## 2026-09-12, step 3: eased heading and a next-corner chip

Both halves of step 3 are in. Nothing about the mapping or the layout changed.

Heading, in `site.js`. The tangent chord widened from +/-3 to +/-6 units and
moved into its own `headingAt()`, and the result is now eased rather than
written straight to the transform:

- Time-based ease, `1 - exp(-dt / 90ms)`, not a fixed fraction per frame. A
  per-frame fraction turns slower on a throttled tab, which is where the page
  sits whenever it is not the front window, and Orca's browser throttles to
  about 15fps unfocused.
- Targets are unwrapped to within 180 degrees of the current heading before
  easing, and the heading is folded back into +/-180 after, or the cumulative
  unwrap drifts a full turn per lap and never comes back.
- Deltas over 45 degrees snap instead of easing. Anchor clicks, a resize and
  the load remeasure all move the lap much further than a corner does, and
  easing those spun the world for a second afterwards.
- Settles exactly on target under 0.02 degrees. Verified 0 rAF callbacks in an
  idle second, so nothing is left asking for frames.

Measured through the tightest part of the lap, y = 1500 to 2600, comparing the
rendered rotation against the raw chord at the same point: monotonic, no sign
flips, no spikes, and the ease runs 0 to 5.4 degrees behind the raw tangent
through about 100 degrees of turn, closing to 0 when scroll stops. Roughly 50px
of scroll of lag at the worst point.

The chip is a `.circuit-next` button above the map naming the corner ahead,
which is the still target the moving dots cannot be. Clicking it scrolls to
that section; past the last corner it names start/finish and goes to the top.
`tabindex="-1"` inside the `aria-hidden` strip, since the nav above is the
keyboard route to every section. Below 1700px wide the key and the name stack,
because the strip is only 114px from 1280px to 1480px and "MAJOR PROJECTS"
measures 94.4px against 94.4px of inside width on one line.

Re-verified the six anchors after the change: correct corner lit at each, dot
on the car within 0.00 to 0.32 units, chip naming the following corner every
time and wrapping to Education at the foot of the page.

Orca's runtime crashed on every `orca screenshot` call this session, three
times, each needing `orca open` again. `eval`, `goto` and `tab create` were
fine, so everything above is measured rather than seen. No visual check of the
chip beyond its box, 380 by 24.6 at the top of the strip.

Open: not committed. Step 4 next, freeze and dim the strip while the project
dialog is open.

## 2026-09-12, step 4: in the garage

The strip now freezes and dims while a project dialog is open.

- `site.js`: a `frozen` flag, set from a `MutationObserver` on `document.body`
  watching the `class` attribute for `modal-open`. That class is already how
  the page announces a modal, so the circuit stays independent of the dialog
  code 200 lines above it. `render()` returns early while frozen, the label
  reads "In the garage", and on resume `currentIndex` and `nextIndex` reset so
  the label and the chip are written again.
- A remeasure that arrives while frozen sets `pendingMeasure` and does nothing
  else, then runs on resume. This is the point of the whole step: the dialog
  changes the document height, the `ResizeObserver` fires, and without the hold
  the car jumps to a different part of the circuit behind a dialog covering the
  page, for no reason a visitor can see.
- `style.css`: `body.modal-open .circuit[data-ready="true"]` drops to `.3`
  opacity with `saturate(.25)` and `pointer-events: none`, so the chip and the
  dots are inert too. Specificity beats the `[data-ready]` rule that fades the
  strip in. `filter` added to the existing transition.

Verified in Orca's browser at y = 2600. Opening a project dialog: transform
held exactly, label "In the garage", opacity 0.3, saturate(0.25), pointer
events none. A `resize` event fired while open changed nothing. On close the
label and chip came back and the transform was unchanged.

Then the case that matters, with the page height actually changing: appended a
1500px block while the dialog was open, scrollHeight 7176 to 8676, and the
transform held identical. On close it remeasured to the new mapping. Confirms
the hold and the deferred measure both work.

Not mine but worth knowing: closing a dialog returns focus to the card that
opened it, which scrolls that card into view, so the lap moves on close if the
card was off screen. That is the existing focus-return behaviour, and the lap
following it is correct.

Open: not committed. Step 5 next, extracting the component so project pages can
generate an out lap from their h2s. That is the big one, and steps 1 to 4 are
the whole idea working, so committing before starting it is worth considering.

## 2026-09-12, steps 1 to 4 shipped to main

`0ddfed4`, the whole circuit strip in one commit: the transform pivot, the
strip layout and dash window, the eased heading and next-corner chip, and the
freeze on modal open. Fast-forwarded straight onto `origin/main`, since
`origin/main` was already at this branch's old tip, so there is no merge
commit. Branch `M4ttyP11/styling-experiments` pushed as well.

Local `main` in the root checkout at `C:/Users/Matty/orca/M4ttyP11.github.io`
is stale at `27c0791` and was left alone, since it is another worktree.
`origin/main` is correct and that is what Pages builds.

Open: step 5, the out laps on project pages, and step 6, continuity across
navigation. Matty also wants a detail and colour pass on the strip later:
different track shapes, colour, small icons.

## 2026-09-12, step 5: out laps on project pages

The strip is now a component, and project pages get a generated track.

- `site.js`: the circuit IIFE is split into `initCircuit(root)` plus a builder.
  The component finds its parts by class inside the root rather than by id, so
  the hand-drawn strip in `index.html` and a generated one are the same thing
  to it. `root.dataset.mode` decides closed lap or open out lap: distances
  wrap on a lap and clamp on an out lap, the dash gap is the rest of the loop
  on one and twice the length on the other, nothing resets at the end, and
  past the last corner the chip reads "Finish" and scrolls to the foot of the
  page.
- `index.html`: `data-mode="lap"` on the aside and a `circuit-world` class on
  the group. Nothing else changed.
- On a project page there is no `#circuit`, so one is built from the `<h2>`s:
  ids assigned where missing, a corner per heading, the whole strip appended
  to the body. Seeded from `document.title`, so a page always draws the same
  track.
- `style.css`: `--accent` retinted on `[data-mode="outlap"]` only, amber in
  both themes (206,101,9 on white, 250,155,46 on black), so an out lap never
  reads as the circuit you left.

Track generation, after three tries. A random walk on the heading spirals;
forbid the spiral and it slaloms. What works is a walk along one axis that
wanders across it: it cannot cross itself, it holds a frame the strip can
show, and it gives long sweeps, real corners and the odd kink. Legs are
scaled to about 54 units each rather than the track to a fixed length, so
corners are the same size on a two-heading page and a six-heading one, and
any corner tighter than 11 units of radius is opened out.

The mapping needed rewriting for short pages. Most project pages cannot put
any heading at the top of the viewport, so every anchor collapsed onto the
same value and the whole track ran in the first few pixels of scroll. Now a
corner that cannot reach the top, or that would leave less than 3% of the
scroll each for the corners behind it and the run home, gives up its anchor,
and runs of those are spread evenly over the scroll left to them. Measured on
all six project pages and the home page: corners land between 0.25 and 0.91
of the scroll, nothing bunched.

Verified in Orca's browser on all six project pages plus `index.html`. Car on
each corner within 0.34 track units at that corner's anchor, car exactly on
the flag at the foot of the page, chip naming the next heading throughout and
"Finish" past the last corner, chip and dot clicks landing their targets,
travel direction 88.6 to 91.1 degrees against a wanted 90, so the car still
points up the screen. Home page unchanged: same six corners, same anchors,
and the garage freeze still holds the transform, dims to 0.3 and restores.

`orca screenshot` crashed the runtime again, as last session. Worked around it
by drawing the path into a canvas in the page and reading the data URL out, so
the shapes were seen rather than guessed.

Open: not committed. Step 6, continuity across navigation, is the last one,
and the detail and colour pass Matty wants is still to come.

## 2026-09-12, project dialog removed, projects are real pages again

- Project links on the index used to be intercepted by site.js, which fetched
  the page and injected it into a `<dialog class="modal">` over the home page.
  That view was a boxed window, had no URL of its own, and showed no circuit
  strip: project pages generate their own out-lap strip from their `<h2>`s, and
  the dialog never carried it.
- Removed the whole mechanism rather than making the dialog full bleed, since a
  full-screen dialog is a page without a URL. Deleted from `site.js` the dialog
  block (fetch, cache, rebase, history push/pop, prev/next in place) and the
  "in the garage" freeze that watched `body.modal-open`, including the `frozen`
  and `pendingMeasure` state. Deleted the `<dialog>` markup from `index.html`
  and the PROJECT DIALOG CSS block plus the `body.modal-open` circuit dimming
  from `style.css`. `grep -rn modal` is now clean across all three.
- Verified in the Orca browser against a local no-store server: index has no
  dialog, clicking a project link navigates to `/projects/...`, and that page
  builds its own strip (`data-ready="true"`, label "Pit exit").
- Open: nothing from this change. Project pages still have `.proj-back` and
  their own next/previous links, which is now the only way back.

## 2026-09-12, re-check after a reported crash, plus a line-ending fix

- Matty reported the MotoGP page crashing when opened from the index. Could not
  reproduce: served the worktree locally with `Cache-Control: no-store` and, in
  the Orca browser, clicked through all six project links from the index. Every
  one navigates, sets `data-ready="true"` on its generated strip, and scrolls
  through the out lap with the label and next chip updating. Direct loads of all
  six are clean too. Best guess is a cached mix of the old `site.js` and the new
  `index.html` in the embedded browser.
- Fixed a real defect introduced yesterday: the Python rewrite that stripped the
  `frozen` / `pendingMeasure` state rewrote `site.js` with CRLF line endings,
  which showed as a whole-file diff. Normalised back to LF, so `git diff` for
  `site.js` is the real change again.

## 2026-09-12, cartoon car and track furniture on the circuit strip

The strip was a blob on a grey ribbon. It now reads as a track with a car on it.

- `index.html` / `site.js`: the car is a top-down cartoon F1 in twelve elements,
  wings, four tyres, chassis, airbox and helmet, drawn nose along +x and scaled
  1.8 in the `rotate(-90)` group. Drawn to scale against a 12m road it was a
  speck at 114px of strip, so it is deliberately oversized. Same markup in the
  hand-written strip and in the out-lap generator.
- `site.js`: new `furnish()` in `initCircuit` reads track furniture off the path
  at build instead of anyone having to author it. The path is walked at 1.2
  units and the turn per unit at each sample gives the local radius and which
  side the inside is on. Tighter than R40 is a corner and takes a red and white
  kerb down the inside, three passes over one polyline: grey edge, white, red
  dashes. Tighter than R18 also takes a tyre barrier round the outside, spaced
  1.25 apart and held off each end of the corner so the lap is not fenced. A
  checkered line replaces the plain `<line class="circuit-sf">`, which is gone
  from both the markup and the generator along with its CSS.
- Because it is generated, a project page out lap gets the same furniture with
  no extra code. Home page: 9 corners, 94 tyres. A typical out lap: 6 and 95.
- `site.js` `render()`: each corner fades with the road it sits beside, using
  the same lit window as the road layers. Only corners that change state are
  touched, so a frame usually writes nothing.
- `style.css`: `--tyre` is a near-black that lifts rather than inverts in dark,
  so a tyre never reads as white. The car wears `--accent`, which means it turns
  orange with the rest of an out lap. Its trail is the accent too, so the body
  and wings carry a background-coloured cut-out line or the car disappears into
  the road it has just driven. The kerb's grey edge is what keeps the white half
  visible where it hangs off the road on a light page.
- Checked in both themes, on the home page and on a project page. No console
  output. Not committed.

## 2026-09-12, start/finish moved to mid-straight, starting grid, wider road

- `index.html`: the home circuit's seam is now the middle of the bottom
  straight, not its start. The path opens at `M 108.25 150`, runs the lap, and
  comes back with `L 108.25 150 Z`. The start/finish dot moved to match. That
  is what puts the line mid-straight, since the checkered line is drawn at the
  seam and crossing it is what completes a lap.
- `site.js`: `startLine()` now also lays eight staggered grid boxes behind the
  line on a closed lap, each half a stagger further back and on the other side.
  An out lap starts at a pit exit, so it gets none. The line and its grid are
  registered with the same fade as a corner, so they dim with the road under
  them.
- The boxes were first written as children of the line's own translate/rotate,
  which applied their track coordinates twice and put them off the map. The
  line now sits in an inner group and the boxes are siblings of it.
- Road widened 4.2 to 5.2 units. A grid box has to be about a car wide and two
  have to sit side by side, and the car was already taking two thirds of a 4.2
  road. Checked first that the circuit has room: the closest the centreline
  comes to another part of itself is 23.6 units, against the 7 or so a 5.2 road
  and its kerbs need. Kerb and tyre sizes went up in proportion.
- Checked on the home page in both themes and on a project page. No console
  output. Not committed.

## 2026-09-12, grid boxes redrawn as brackets

- A grid box is not a closed rectangle. It is painted as the front of one: a
  line across the slot with a short arm trailing back off each end, so the
  open side faces the way the car goes. `.circuit-box` is now a path rather
  than a rect, `BOX_L` became `BOX_ARM`.
- First pass had the arms pointing forward, which is the bracket the other way
  round. Flipped to negative x.
- Sizes: slot 2.3 wide at 1.25 off the centreline, so two sit inside a 5.2
  road with margin. The car came down from 1.8 to 1.65 scale to fit its box,
  which also applies to out laps since there is one car.
- Checked on the home page in both themes. No console output. Not committed.

## 2026-09-12, circuit dots rendered wider than the track in some browsers

The apex dots carried `r="4.6"` in the markup (left over from the old minimap)
and were resized to 1.1 only by the CSS `r` geometry property. Safari does not
support CSS `r`, so there the attribute won, giving 9.2-unit dots on a 5.2-unit
road: circles wider than the track.

- `index.html` and the JS-built strip in `site.js`: dots now carry `r="1.1"` in
  the markup, so every browser draws the right size with no CSS involved.
- `style.css`: dropped the `r` declarations; hover and current-section growth
  now go through `transform: scale(1.55)` with `transform-box: fill-box`, which
  is supported everywhere.

Open: nothing. Not committed.

## 2026-09-12, constant lap speed, markers placed from the scroll

The car sped up and slowed down as it went round, because scroll was mapped
piecewise onto fixed corner positions: a long section covering a short stretch
of track crawled, a short one covering a long stretch bolted.

Now scroll maps onto lap distance one for one (`f = p` in `render`), and the
markers are moved onto the path in `measure` at their own section's share of
the page scroll. The car still lands exactly on a marker when that section
reaches the top of the viewport, and it holds the same speed throughout.

- `site.js`: dropped the `keys`/`lapAt` piecewise mapping, the `STEPS` LUT and
  the nearest-sample search in `build`; `measure` now sets each stop's `f` from
  its scroll fraction and writes the dot's cx/cy from the path.
- `index.html`, `style.css`: comments only, the markup cx/cy are now just a
  starting guess.

Verified in the Orca browser against a no-store local server: at #projects the
current dot and the car's path point agree to 0.01 units.

Open: marker spacing round the track now mirrors section length, so short
sections (Contact) sit close together. That is the price of constant speed.

## 2026-09-12, the finished lap now stays accent ahead of the car

At the foot of the page the window has swept back round onto the start/finish
straight, which was driven at the start of the lap, but the accent only ever
trailed behind the car so that road showed grey. `render` now extends the
accent forward by `d + WIN_AHEAD - total` on a closed lap, so the last stretch
of the page has the whole lit window in accent. An out lap is unchanged, it
never wraps. Verified at the bottom of index.html: dash 168 units, the full
60 back plus 108 ahead.

## 2026-09-12, the driven lap now fills in, in two layers

Matty wanted the accent to read as the lap filling in, not a short tail
following the car. The trail is now two layers on the same terms as the road:
a new `.circuit-trail` path carries the whole driven stretch, start of lap to
car, at 32% accent, and `.circuit-line` keeps the part of it inside the lit
window at full strength. The forward wrap on `.circuit-line` stays, but it no
longer appears out of nothing: that road is already faint accent before the
window reaches it.

- `index.html`, `site.js` generated strip: `.circuit-trail` added under the
  window layer; `style.css` styles it.
- `site.js` `render`: trail dash is `[0, d]`, bright dash unchanged.

Checked at half page (trail 275.8 of 531.3, bright 60 behind) and at the foot
(trail the full 531.3, bright 168 covering the whole window).

## 2026-09-12, accent grows from the line to the car, one layer again

Correction to the entry above: the two-layer trail and the forward wrap are
both gone. The accent is a single `.circuit-line` running from the start/finish
line up to the car, at full strength, dashed `[0, d]` with a zero offset. It
grows behind the car as the page scrolls and nothing ahead of the car is lit.
`.circuit-trail` removed from `index.html`, the generated strip and `style.css`.

Measured down the page: 25% gives 132.8 of 531.3 units, 60% gives 318.8, the
foot gives the full 531.3.

## 2026-09-12, the Next chip starts a new lap instead of reversing

At the foot of the page the chip points at Education, the first corner of the
next lap. Scrolling there smoothly ran the car round the circuit backwards and
unpainted the trail. The chip only ever points forward, so a target above the
current scroll is now taken in one step: `window.scrollTo` with
`behavior: 'instant'` (not `'auto'`, which defers to the page's
`scroll-behavior: smooth`), and `heading` reset to null so the car faces up the
new road rather than sweeping round to it. The trail clears with the jump.

Forward targets are unchanged, they still scroll smoothly. Dot clicks are
untouched.

Verified: at the foot the chip reads Education, clicking lands at y=1201 with
the trail cut back to 108.2 of 531.3 units.

## 2026-09-12, the Next chip drives the lap out instead of teleporting

Correction to the entry above: the instant jump stays, but the car no longer
lands with it. `render` now takes its lap fraction from a `lapRun` animation
when one is set, instead of from the scroll. The chip's wrap case sets
`lapRun = {from: 0, to: <target scroll fraction>, ms: 1100}` with a cubic ease
out, so the car crosses the line, the trail clears, and it drives forward round
to the corner the chip named while the page is already there. A wheel, touch or
key event cancels the run and hands the car back to the scroll.

Verified in the Orca browser: clicking the chip at the foot lands the page at
y=1201 and the trail passes through intermediate lengths (80, then 107 of the
final 108.2 units) rather than snapping. Frame sampling is throttled in a
background tab, so the intermediate count is not meaningful, only the values.

## 2026-09-13, reveal content no longer hidden without JS (brief item 1)

`.reveal` was `opacity: 0` unconditionally and only `site.js` adds `.in`, so
with scripts off the home page body stayed invisible.

- `index.html` head script: adds `.js` to `<html>` as its first statement,
  before the `localStorage` read that can throw.
- `style.css`: the hidden state (`opacity: 0`, `translate: 0 18px`) and `.in`
  now sit under `.js .reveal`; the transition stays on bare `.reveal`. The
  reduced-motion override follows the same selector and no longer sets
  `transform: none`, which at the higher specificity would have killed card
  hover lifts.

Verified in the Orca browser (no-store server): with `.js` removed and `.in`
stripped, all 18 reveals compute opacity 1; with `.js`, they are 0 until
observed, and scrolling to half page still reveals them (11 of 18 in).
Project pages have no `.reveal`, so no change there. Not committed.

## 2026-09-13, circuit strip fades at its sides too (brief item 2, on trial)

`.circuit-map` masked top and bottom only, so bends were sliced off at the
strip's left and right edges. `style.css` now stacks a second, horizontal
gradient (transparent to black over 16% each side) on the mask and intersects
the two (`mask-composite: intersect`, `-webkit-mask-composite: source-in`), so
corners fade on both axes.

Verified in the Orca browser at 1929px wide: strip displayed, computed mask
shows both gradients with `intersect`. Open in a tab at
`http://127.0.0.1:8765/index.html#projects` (no-store server) for Matty to
judge. Open: Matty has not decided whether to keep it. Not committed.

## 2026-09-13, circuit side fade kept

Matty viewed item 2 in Orca and prefers it. The horizontal mask stays.

## 2026-09-13, link preview images (brief item 3)

No page had an `og:image`, so shared links showed a text-only card. Matty chose
a name card for the home page and a figure card where a project has a figure.

- `assets/images/og-preview.jpg`: dark-theme name card (name, role, degree,
  URL, the site's circuit outline in accent). Also used by CubeSat, UAV and
  Formula Student until they have photos.
- `og-f1-lap-time-simulator.jpg`, `og-retroreflective-piv.jpg`,
  `og-motogp-cornering-aerodynamics.jpg`: title, one-line summary and the
  page's own figure (correlation plot, velocity field, GDP model).
- All 1200x630 JPEG, about 80 to 95 KB. Rendered from HTML with headless Edge
  by a script in the session scratchpad (`og/build.py`), not in the repo.
- `index.html` and all six project pages: `og:image` plus width, height and
  `twitter:card summary_large_image` after `og:url`. The home TODO comment is
  gone.

Open: regenerate the CubeSat, UAV and Formula Student cards once Matty adds
their photos. Not committed.

## 2026-09-13, major project cards get a figure (brief item 4)

The three `.paper` cards were text only and about 40% empty on the right at
desktop width.

- `index.html`: each card's existing content is wrapped in `.paper-body`, and a
  `.paper-thumb` follows it holding the project's own figure: `gdp-model.webp`
  (MotoGP), `piv-velocity-field.webp` (PIV), `correlation-plot.webp` (lap sim).
  Lazy loaded, with `onerror` removing the thumb if the image is missing.
- `style.css`: `.paper:has(.paper-thumb)` is a two-column grid (text, then a
  column of `minmax(220px, 36%)`). The figure sits in a white 4:3 panel in
  both themes, since all three figures are drawn on white. At 760px and below
  the card is one column with the figure on top at 16:10. If the thumb is
  removed, `:has()` stops matching and the card falls back to the old layout.

Verified in the Orca browser at 2279px: all three cards are grids of 638 +
384 px, thumbs 384x288, images loaded. At 390px (an iframe on the page, since
Orca's viewport cannot be resized): one column, figure above the text at
297x186, no horizontal overflow. Headless Edge screenshots were no use here,
they capture the intro curtain and the full-height hero. Not committed.

## 2026-09-13, hero status badge removed

Matty felt the "Available for 2027 graduate roles" pill was thrown in.

- `index.html`: removed the `.badge` span from `.hero-text`, so the `h1` is now
  its first child and takes the first intro stagger delay.
- `style.css`: removed the `.badge` and `.dot` rules and dropped `.badge` from
  the shared tag/pill selector. Nothing else used either class. Availability
  is still stated in the contact section sub-heading. Not committed.

## 2026-09-13, brief items 1 to 4 pushed to main

Matty asked for the current work on main. Committed on
`M4ttyP11/site-polish` and pushed as a fast-forward to `origin/main` (the
branch was level with main, so nothing to merge), and pushed the branch too.
The commit also carries a change made outside this session: the hero
"Available for 2027 graduate roles" badge removed from `index.html` along with
its `.badge`/`.dot` CSS. `.claude/BRIEF.md` left untracked.

Open: the main checkout at `C:/Users/Matty/orca/M4ttyP11.github.io` still
sits on the old commit with its own uncommitted `.claude/WORKLOG.md` edit.

## 2026-09-15, projects layout trial, steps 1 and 2

Matty wants to try: the three major projects side by side on the home page,
other work removed from it, a "View all projects" button to a new page, and
projects opening in a pop-up on that page.

Plan: (1) home page layout; (2) `projects/index.html` listing all six;
(3) cards on that page open a `<dialog>` with summary, figure and a link to the
full write-up, deep-linkable by hash; (4) once Matty keeps it, update the nav
and back links on the six project pages, the sitemap, and the README.

Done so far:
- `index.html`: `#major` papers wrapped in `.major-grid`, a centred
  `.major-actions` "View all projects" button below. `#projects` section and its
  circuit dot removed. Nav "Other work" is now "All projects" (`projects/`).
  `#experience` is now `section-alt` and `#contact` plain, so backgrounds still
  alternate.
- `style.css`: `.major-grid` (3 columns, 1 below 960px), each paper a flex
  column with the figure on top at 16:10 and buttons pinned level at the foot.
  `.card-img.is-figure` for white-ground figures in card image slots.
- `projects/index.html`: new page, project-page chrome, two `h2` groups (major,
  other work) of `.card` links to the existing pages. No dialog yet.

Verified in Orca at 1427px: three 349px cards, 805px tall, buttons level, dot
count 5, section backgrounds alternate. Projects page: six cards, out-lap strip
built with 3 markers; the three other-work images are missing (known, brief 5).
Open: cards are tall because leads are long, worth shortening; mobile not
checked; steps 3 and 4. Not committed.

## 2026-09-16, hero contact links are icons now

Matty's feedback on the home page: the selectable items in `.hero-meta` should
be images, not words, and the front page should carry as few words as it can.

- `index.html`: LinkedIn, GitHub and Email are inline SVG marks in 38px square
  buttons, with `aria-label` and `title` carrying the name. The three middle
  dot separators are gone; "Southampton, UK" stays as text.
- `style.css`: `.hero-meta a` is an icon button matching the theme toggle's
  size, with the card background, a border, and a ring plus lift on hover.
  `.hero-where` keeps a small gap before the location.

Saved the wider preference as an auto-memory: prefer icons, figures and numbers
over labels on the home page, and offer to cut copy rather than add it.
Not committed.

## 2026-09-16, home page nav bar removed, theme switch kept

Matty: the fixed top bar breaks the flow of the page, since it lets you skip
past everything, so it goes. He asked to keep the dark/light switch.

- `index.html`: the whole `<nav class="nav">` block is gone. In its place a
  `.theme-toggle.theme-float` button with the same id, so `site.js` still wires
  it up. `site.js` guards its nav code with `if (nav && navToggle && navLinks)`,
  so nothing else breaks.
- `style.css`: `.theme-float` is fixed at the bottom left, 38px square, blurred
  behind, at 75% opacity until hover. Matty asked for it away from the top once
  it was on its own; bottom left keeps it clear of the circuit strip on the
  right and reachable from anywhere on the page.
- The circuit strip still jumps between sections on desktop, and the
  "View all projects" button is the route to the projects page.

The six project pages keep their nav bar: they need a route back, and Matty's
feedback was about the home page. Not committed.

## 2026-09-16, committed and merged to main

Matty asked to push and merge everything outstanding before starting a new idea.

- Committed `a4eb127` "Cut the home page nav, icon the contact links, add a
  projects page": the nav removal and floating theme switch, the icon contact
  links, the `.major-grid` layout with "View all projects", and the new
  `projects/index.html`. `.claude/BRIEF.md` went in with it, since WORKLOG.md
  and settings.json were already tracked.
- Pushed the branch, then fast-forwarded `main` on the remote with
  `git push origin HEAD:main`. origin/main was already at `4e9fe4e`, so this
  was a clean fast-forward and no merge commit was needed. Done that way
  because `main` is checked out in another worktree and cannot be updated from
  here. Local `main` in `C:\Users\Matty\orca\M4ttyP11.github.io` is still
  stale at `310d271` and wants a `git pull`.
- Open from the earlier brief and unchanged by this commit: the dialog
  behaviour on the projects page (step 3), nav and back links on the six
  project pages, sitemap and README (step 4), the three missing other-work
  images, and mobile.

Next idea, in its own worktree: a 3D version of the circuit strip.

## 2026-09-17, hero "Major projects" button removed

Matty, via design feedback in Orca: the button jumps past the page and breaks
the flow, and people can scroll down to the projects. Same reasoning as the
nav removal. `index.html`: the hero `.hero-actions` now holds only
"Download CV". Verified in the Orca tab: no `#major` links left on the page.
Not committed.

## 2026-09-17, certificate thumbnail and lightbox on the F1 course card

Matty supplied the Racetrack Dynamics certificate and asked for it small on
the card, full size when clicked, using something from shadcnspace.com.
That site's components are React and Radix, and this site has no build step,
so the Dialog pattern is rebuilt on a native `<dialog>`: dark blurred overlay,
bordered panel scaling up from 95%, close button top right. Escape and focus
trapping come from the element.

- `assets/images/rd-certificate.webp` (2800x2000, 265KB) and
  `rd-certificate-thumb.webp` (720px, 37KB), from a 6MB PNG.
- `index.html`: the course card is `.card-with-cert`, text left and a 220px
  `.cert-thumb` link right, zoom icon on hover. `#certDialog` sits before
  `site.js`. Without JS the thumbnail is a plain link to the full image.
- `style.css`: LIGHTBOX block. Card stacks below 720px, animation off under
  reduced motion.
- `site.js`: generic `[data-lightbox]` handler, reusable for other images.
  Backdrop click and the close button close it, focus returns to the link.

Card verified in the Orca tab (thumb 220x158, loaded). Matty checked the
dialog himself and is happy. Not committed.

## 2026-09-17, education "View CV" button removed

Matty: not needed, the CV is already at the top. Removed the `.edu-actions`
row from `#education` and its now-unused rule in `style.css`. The CV is still
linked from the hero and the contact section. Not committed.

## 2026-09-17, abstracts to the top, project-page boxes flattened

Matty: move abstracts to the top of each project page, and drop the card
within card look, shadcn style.

- Only `f1-lap-time-simulator.html` and `retroreflective-piv.html` have an
  abstract. It now opens the article as `section.abstract`: micro-label, text,
  bottom rule, no box. `.abstract-block` rule replaced by `.abstract`.
- Carousel: removed the slide padding, drop-shadow and inner fill, so the image
  sits flush in one bordered frame instead of a card inside a card.
- `.callout`: shadcn Alert style, one rounded border on card background, no
  accent spine or muted fill.
- Checked in headless Edge screenshots (PIV page). Not committed.

## 2026-09-17, facts grid removed from project pages

Matty, via design feedback: the Project / Institution / Submitted grid in
`.proj-band` read as filler. Removed the `dl.proj-facts` from all six project
pages and its CSS. The band now holds only the methods and tools tag row,
padding cut to 1.25rem, divider above the tags gone. Not committed.

## 2026-09-17, major projects intro line removed

Matty: the "Each has its own page..." sub-line under "The three projects I'm
proudest of" states the obvious. Removed from `index.html`. Not committed.
## 2026-09-16, worktree created for the 3D circuit idea

Branched from `a4eb127` on main, so the nav removal, icon contact links,
`.major-grid` and `projects/index.html` are all already here.

`.claude/BRIEF.md` has been replaced. It was the site-polish brief, which is
finished and merged, and is now the brief for one question: can the circuit
widget become a view from behind the car rather than a map above it.

Decision taken before any code: the widget moves to a fixed band across the
bottom of the viewport, full width and roughly 110px tall, replacing the
right-hand gutter strip. A chase camera needs width and a horizon that runs
across the frame, and the current strip is the worst possible shape for that.
The top was ruled out because the nav was just removed from there on purpose.

Approach is a hand-rolled perspective projection still emitting SVG, no
WebGL. The closed `<path>` in `index.html` stays the only real geometry, and
`at()`, `furnish()` and `measure()` are all reused. See the brief.

Nothing built yet. First step is a standalone prototype at
`proto/circuit3d.html` with camera sliders, to be shown to Matty before
anything is wired into the page.

## 2026-09-16, milestone 1: standalone 3D prototype

`proto/circuit3d.html`, not linked from the site. Same track path as
`index.html`, copied in. Hand-rolled perspective projection into SVG: the path
is tabled once at 0.5 unit spacing, then each frame samples the road at
track-fixed spacing (so stripes do not swim), transforms to car-local space,
applies camera pitch and perspective, and clips quads at a near plane.

Draws road, edge lines, centre dashes, red/white kerbs on the inside of
corners (same turn-rate detection as `furnish()`), a start/finish band, placeholder
section boards at even shares of the lap, fog at the horizon, and a rear-view
car built from boxes. Sliders for camera height, distance behind, pitch, FOV,
car screen position, draw distance, samples, fog, heading smoothing, car
scale, speed, band height and page height. Presets, theme toggle, auto drive
or drive by scroll, and a copy-settings button.

Checked in Orca's browser: renders, about 0.5 to 0.7 ms per frame. Track is
531 units, about 1533m at 2.9m per unit. Silverstone (5891m) is under
consideration for later; Matty expects it may need shortening for scroll speed.
Open: Matty to pick a camera. Boards are placeholders. Not committed.

## 2026-09-16, prototype: sliders tucked away, 3D car

Matty liked the default camera (TV chase: height 3.2, back 7, pitch 9, FOV 38,
car at 78%) and the current track length, so both stay.

- Sliders and buttons moved into a panel opened by a small button in the
  band's top-right corner. Escape closes it.
- Car rebuilt as convex solids (tapered boxes, octagonal wheels) with
  per-solid backface culling, far-to-near solid sort, and flat shading from a
  fixed light. Livery reads `--accent`, so it follows the theme.
- Camera heading now trails the car's by a `lag` slider (default 2.5), so the
  car yaws into corners and shows its side. Biggest single gain in depth.
- Soft contact shadow under the car, and tyre barriers with height round the
  outside of corners tighter than R18.

Checked in Orca's browser, no console errors. Solid sort is approximate and
could misorder at extreme car scale; fine at 1.2. Not committed.

## 2026-09-16, prototype: taller band, scroll length fix, spinning wheels

- Band default 110px to 150px.
- "Page height" slider only applied in Drive by scroll mode, so it looked
  dead. Body is now always that tall, and the slider is renamed "Scroll
  length, px" so it is not mistaken for the band height.
- Wheels are twelve-sided prisms with alternating tread shades, rebuilt each
  frame from a spin angle driven by distance covered. Per-frame turn is capped
  under half a tread band so it never aliases into spinning backwards. New
  "Wheel spin" slider scales the rate.

Checked in Orca's browser: band 149px, scrollHeight 9000, car faces change
frame to frame, no console errors. Not committed.

## 2026-09-16, prototype: body lean and section boards

- Body lean: sprung parts (everything but the wheels) roll about a centre just
  above the floor, by lateral acceleration (smoothed speed squared times
  curvature), clamped to about 12 degrees and eased. Parked car sits level.
  "Body lean" slider scales it.
- Section boards: one per section at an even share of the lap, on the inside
  of a corner (barriers take the outside) or the left on a straight. Panel on
  two posts with thickness, a top strip that turns accent on the Next board,
  and the name as SVG text fitted to the projected panel with an affine
  matrix (text set 100x and scaled down). Width fits the name. Text hides
  under 7px tall. Oversized (1.7 units tall) so names read in a 150px band.

Checked in Orca's browser: lean visible mid-corner, "Education" legible about
50m out at 150px, no console errors. Boards still use even spacing, not
measure(). Not committed.

## 2026-09-16, prototype: scenery, trees and grandstands

- New world layer (`#world`) holding boards and props, sorted far to near
  each frame and reordered in the DOM only when out of place, so trees cover
  boards behind them. Props are convex world-space solids with normals and
  shading worked out at build time; a frame culls faces against the camera
  position and projects through the existing near-plane clipper.
- Trees: seeded, clumped placement, 11 units clear of the centreline and clear
  of boards and stands. Conifers (two cones) and broadleaf (faceted crown).
  LOD drops trunks past 50 and conifer top cones past 90. Fade over the last
  30 units of draw distance. "Trees" slider, default 160.
- Grandstands: four crowd tiers (random colours incl. livery), back wall and
  cantilever roof, built in 4-unit segments so the sort holds on a curve. One
  on the outside of the main straight, one behind the barrier of the tightest
  corner.

Checked in Orca's browser, no console errors, about 3 ms/frame with ~950
prop faces. Open: at the default camera (height 3.2, back 7) the horizon sits
~20px from the top of a 150px band, so anything tall near the track is cut
off. Height 2 / back 9 / pitch 4 gives the scenery room; defaults not changed.
The main stand fills the right of the frame while alongside it. Not committed.

## 2026-09-16, scenery reverted

Matty didn't like how the trees and grandstands looked, so the scenery entry
above is fully undone: world layer, props, Trees slider and draw sort
removed, boards back in `#boards`. File is back to 1014 lines, as after
the boards and lean work.

## 2026-09-17, prototype: reads as a circuit, not a road

Three changes Matty picked from the list of what separates a track from a road.

- Centre dashes gone. A circuit has nothing painted down the middle, and the
  dashes were the biggest tell. `DASH_W` and the `#dash` layer are removed.
- Paved run-off and a verge either side: `APRON_W` 3.4 and `VERGE_W` 1.6 in
  the cross section, drawn under the road, with the tyre barrier moved out to
  sit behind them (`WALL_AT` is now HALF + KERB_W + APRON_W + 0.3).
- A worn racing line: wide in, apex, wide out. Worked out once as a lateral
  offset per metre of lap. Wanting the inside through a corner and the middle
  elsewhere, smoothed tightly and loosely and the loose one subtracted, gives
  the overshoot either side of a corner that reads as running wide. Two
  tints, the deeper one through corners for rubber. `--worn` / `--worn-deep`
  flip from a dark tint in light theme to a light one in dark, since a dark
  tint on a dark road is invisible.

`side` on a corner is the inside, the way the kerbs and boards already use
it: the line was inverted at first and hugged the outside.

Checked in both themes, no console errors, 1.3 ms/frame. Orca's
`orca screenshot` timed out every time this session, so shots were taken by
cloning the band's SVG in the page with computed styles inlined, drawing it
to a canvas and reading the data URL (`scratchpad/grab.js`).

Open: the car still drives down the centreline while the worn line runs wide,
which now reads as a mismatch. Not committed.

## 2026-09-17, prototype: car drives the line, wider road

- The car and the camera now follow the worn racing line, not the centreline.
  Two new helpers, `linePt()` and `lineHeading()`, stand in for `pt()` and
  `heading()` wherever the car is placed. Everything that draws the road still
  works off the centreline, since the cross section is measured from it. The
  car is still at the camera origin, so the world shifts sideways under it
  and `drawCar()` is untouched. Heading comes from the offset line's own
  tangent, so the car turns in before a corner and straightens on the exit.
  Body lean now reads curvature from the line too, which is lower at an apex
  and higher on entry, as it should be.
- Road widened from 5.2 to 6.2 units, a little over three car widths at the
  default car scale. `M_PER_UNIT` is now pinned at 2.885 rather than derived
  from `ROAD`, so widening the road does not shrink the lap: it is still 531
  units and 1533m. Worn line width 1.8 to 2.1 to stay in proportion. The
  line's lateral limit is `HALF - 0.9`, which puts the inside wheels just
  over the white line at an apex.
- Checked in Orca's browser at a straight, a corner entry and an apex: signs
  are right (outside on entry, kerb at the apex), 1.3 ms/frame, no errors.
  Screenshots via `orca screenshot --json` plus a crop of the band, which
  works now where `orca screenshot` timed out last session.

The second half of step 1, boards placed from section shares rather than even
spacing, has nothing to change in the prototype: `drawBoard` already takes a
lap distance, and the prototype's scroll mode maps scroll linearly, so even
spacing is correct here. It becomes real when `measure()` feeds the module, at
the extraction step. Not committed.

## 2026-09-17, the band on the actual site

Matty wanted to see it on the site before anything is committed, so the
prototype's engine is now extracted and wired in. Still uncommitted.

- New `circuit3d.js`, 880 lines: the renderer and nothing else. Takes a path,
  a lap fraction and a list of markers, and draws the band. The camera is
  baked in as constants (height 3.2, back 7, pitch 9, FOV 38, car at 78%,
  draw 160, lag 2.5); the sliders stay in `proto/circuit3d.html`. Dropped the
  panel, presets, stats and readout. Added open-lap support for project
  pages: distances clamp instead of wrapping, the racing line's smoothing
  holds its end values instead of folding the pit exit into the finish, no
  road is drawn off either end, and the flag sits at the finish only.
  `frame(f)` returns true while the car's lean is still settling, so the page
  keeps asking for frames the same way `headingAt()` does for the strip.
- `site.js`: the circuit module keeps everything about the page, `measure()`
  and its section shares, `lapRun`, the chip, and now decides which renderer
  draws. In 3D it skips `furnish()` and the dasharray work, feeds the boards
  from the same `stops` shares the dots use, and moves the existing
  `.circuit-next` button into the band rather than writing a second chip.
- `style.css`: `--kerb`, `--worn` and `--worn-deep` added to both token
  blocks, and a band block at the end. In 3D the strip is hidden, the
  container stops reserving 340px of gutter for it, the body gains bottom
  padding so the footer clears the band, and `.theme-float` lifts above it.
  Band shows from 1280px up, as the strip did, and stays off under reduced
  motion.
- `?circuit=2d` puts the flat strip back, so the two can be compared on the
  same page. Verified: no band, 155 furniture elements, strip as before.
- Checked in Orca's browser: home page in both themes, a project page out lap
  retinted orange with the livery following it, chip click scrolls and renames
  itself, 1.41 ms/frame. Board names are now hidden when the panel is wider
  than 80% of the band, since drawing level with a board blew the name up
  across the whole frame.
- Found and fixed a pre-existing typo in `index.html`: the `?intro=1` replay
  test held a literal backspace where `\b` was meant, so the flag never
  matched. One character.

Open: the band is 150px of every screen and reads a little like a bar at the
foot of the page; the brief wants it quiet when idle, which is not done.
Matty to decide between this and the strip before anything is committed.

## 2026-09-17, helicopter view in the side strip

Matty prefers the widget back in the side gutter, not the bottom band, and
wants a middle ground: near top-down, car fixed on screen with the world
turning under it, keeping the 3D detail. New prototype `proto/circuit-heli.html`,
a copy of the chase prototype with the camera opened up and the frame put back
in the strip. Nothing on the site touched, the band and `circuit3d.js` are as
they were.

- Layout: the band block becomes a fixed strip in the right gutter, 340px wide
  and 2.5 times as tall, masked on both axes so the world fades off all four
  sides rather than a border cutting it. The ground rect and horizon line are
  off: from overhead the ground plane fills the frame, so filling it would put
  a slab of colour where the flat map had none, and the page shows through
  beyond the verge.
- Sliders: pitch now goes to 89, height to 160. `back` stays the camera's
  offset, and a new `behind` slider owns how much road is drawn behind the car,
  which the chase view never needed and a centred car does. The flag range and
  the board wrap use `behind` too.
- Boards: a "Board tilt" slider hinges the panel about its posts. At 90 it is
  the trackside board of the chase view. At 0 it lies flat on the run-off,
  laid forward along the track so the name reads the way the car points, which
  is the only way a name reads from overhead. Flat, the back face and posts
  drop out and it reads as paint.
- Presets are now Helicopter (height 80, back 25, pitch 70, fov 40, car at 52%,
  draw 220, behind 140, flat boards), Drone (34 / 26 / 52, boards at 35 deg)
  and TV chase, so the question of how far down to come is a click.

Checked in Orca's browser at 340x850: 1.56 ms/frame, no errors. `orca
screenshot` fails with runtime_unavailable this session, so shots came off the
SVG-to-canvas grab again.

Open: Matty to pick a camera. Then the band work gets reversed, `circuit3d.js`
retargets to the strip, and the bottom-band CSS comes out.

## 2026-09-17, the helicopter view wired into the site

Matty picked the helicopter camera off the prototype and asked for it on the
real pages, with room made for it. Done, still uncommitted.

- `circuit3d.js`: camera is now height 80, back 25, pitch 70, FOV 40, car at
  52% down the frame, draw 220 ahead. Two new knobs came over from the
  prototype: `behind`, which owns how much road is drawn back down the track
  and which a centred car needs, and `boardTilt`, which hinges a section board
  about its posts. At 0 the board lies flat on the run-off, laid forward along
  the track so the name reads the way the car points, and its back face and
  posts drop out. `back` still means only where the camera sits. Fog is 0: the
  horizon is off the top of the frame at this pitch.
- `circuit3d.js` also gains `tune()`, which is the prototype's slider panel on
  the page itself: 14 camera rows plus strip width and the two fade depths,
  which it writes as custom properties. Copy settings puts the current numbers
  on the clipboard shaped like the CAM block. Matty asked for this to stay
  while the look is still being settled. `?tune=0` hides it, and dropping the
  one call in site.js removes it for good.
- `style.css`: the band block becomes a strip block. Fixed to the right edge,
  centred vertically, `--c3d-w` of `clamp(280px, 30vw, 460px)` wide and 2.5
  times that tall unless the window is short. Masked on both axes so the world
  fades off all four sides. Ground fill and horizon line are off. The page
  gives up the width: `body` takes a padding-right of the strip width and the
  container centres in what is left, rather than the strip squeezing into the
  gutter a centred container happened to leave. A project page's fixed nav
  stops at the strip. The Next chip moves to the foot of the strip with a
  blurred backing, since there is no sky to hold it now.
- `site.js`: mounts the panel, and a slider change remeasures the lap as well
  as asking for a frame, because the width rows reflow the page.

Checked in Orca's browser at 2279x1281: home page in both themes, a project
page out lap orange and open-ended, no overflow, container right edge 1480
against a strip starting at 1819, sliders driving both camera and layout live,
`?circuit=2d` still putting the flat map back with no strip, no padding and no
panel. Scrolling holds 60fps. `orca screenshot` is still failing with
runtime_unavailable, so shots came off the SVG-to-canvas grab.

Open: the flat map, `?circuit=2d` and the prototypes all stay until the look
is signed off. An out lap leaves the top half of the frame empty once the car
reaches the flag. Boards can fall outside the frame on a wide corner, there is
no slider for how far out they sit.

## 2026-09-18, a switch between the two views

Matty likes the helicopter view and wants both available, so the choice moved
out of the URL and onto the page. Still uncommitted.

- `site.js`: `want3d`, a one-shot flag read at load, is now a `mode` that can
  change while the page is up. `apply(m)` swaps renderers: creating or
  disposing the Circuit3D view, moving the Next chip between the map and the
  3D strip and back to where it came from, setting or clearing
  `data-circuit="3d"`, and showing or hiding the tuning panel. The flat map's
  furniture is laid down the first time 2D is asked for rather than at load,
  so a reader who never leaves the 3D view never pays for it. Everything
  measured survives a swap: both renderers read the same path and the same
  scroll mapping, so the swap is followed by a measure and a render and
  nothing else.
- The button is written by `site.js` rather than into eight pages of markup,
  since it only means anything where both renderers can run. Bottom left with
  the theme switch on the home page, alone on a project page, showing the view
  it will move to: "2D" while the helicopter view is up, "3D" while the map
  is. Hidden below 1280px, where neither view shows.
- The choice is remembered in `localStorage` under `circuit-view`, and
  `?circuit=2d` or `?circuit=3d` overrides it for that load without being
  remembered, so a link to either stays honest.
- `style.css`: a `.circuit-toggle` block, matching `.theme-toggle` and shifted
  clear of `.theme-float` where the page has one.

One trap worth recording: the first version called its own `label()`, but
`label` is already the strip's caption element in that scope, so the var
assignment clobbered the hoisted function and the button was never mounted.
Renamed to `relabel()`.

Checked both ways on the home page and on a project page out lap: furniture
appears on the first switch to 2D and the map drives normally, the 3D view
comes back with its boards, its out lap tint and its ready flag, the chip
lands back in the right parent, the page's right padding and the project nav
follow, no overflow either way.

## 2026-09-18, committed and merged to main

Matty asked to push and merge. The sliders were made opt-in first: `?tune=1`
puts them on the page and nothing else does, since the site is aimed at
employers and a panel of dev sliders reads badly. `proto/` is committed, both
files noindex, since they carry the rig the camera was found on.

`9a5c521` "Add a 3D circuit view and a switch between it and the map":
`circuit3d.js`, both prototypes, the strip CSS, the toggle and the script tag
on all eight pages.

Main had moved two commits ahead while this worktree ran, so the branch was
rebased onto `65ba340` rather than merged. Three conflicts, all of them two
sides appending to the same end of a file: the certificate dialog against the
new script tag in `index.html`, the lightbox block against the 3D strip block
in `style.css`, and both sides' entries in this log. All resolved by keeping
both, in that order. `style.css` needed a brace of its own between the two
blocks, since each side ended mid-rule and shared the closing one.

Checked after the rebase: certificate lightbox opens and closes, both circuit
views swap on the home page, a project page keeps its out lap and its tint, no
overflow. Branch pushed and `main` fast-forwarded to `9a5c521`.

## 2026-09-18, a clear start and end for the out lap in 3D

Matty: the 3D band's out lap started and stopped dead, which read as jarring
on a project page. Given the choice between running the road off both edges
of the frame and giving it a marked start and end, he picked the marked one.

`circuit3d.js`:

- The path stops at 0 and at `total`, so the road is now carried straight on
  past both ends along the end tangent (`ptEx`/`headEx`, `OPEN_IN` 18 before,
  `OPEN_OUT` 20 after). The tangents are the ones `heading()` already reports
  at each end, so the join has no kink. Only the road surface uses it: the
  car, the camera and the racing line stay inside the path proper.
- The run-in and the run-out are approach road, not racing surface, so they
  carry no worn line, no rubber and no kerbs (`onLap` in the sample loop).
- `gate()` closes each end with a barrier across the full width, in the tyre
  barrier colours, drawn after the loop so it sits over them.
- The start/finish marking is now a real chequer, `chequer()`, two rows of six
  cells across the road, laid out the way the flat map lays its own out. It
  replaced the plain white band on both a lap and an out lap. An out lap also
  keeps a plain white line at its start, so both of its ends are marked.

`style.css`: `.c3d-flag-b` for the dark cells, fixed black rather than a
theme token, since a chequer is black and white in both themes and the road
under it is the same mid grey either way.

Checked in the browser on a project page and the home page: the out lap now
runs in to a barrier below the car at the top of the page and out to one past
the flag at the bottom, the lap's start/finish reads as a chequer, no console
errors. Not committed.

Still open: the section boards. Matty wants them as banners over the track or
as trackside sponsor boards instead of the flat panels they are now.

## 2026-09-18, section boards became gantries over the track

Matty picked the overhead option and asked for the start/finish to be the
light rig across the track rather than a name.

`circuit3d.js`, `drawBoard()` rewritten. A section is now a banner slung under
a beam that spans the road on two legs standing outside the kerb, instead of a
panel lying flat on the run-off. The banner hinges on its top edge and leans
back toward the oncoming car by `CAM.boardTilt`, 45 degrees: upright it would
be nearly edge on to a camera pitched 70 degrees down and the name would not
read, at 45 its face is within about 25 degrees of square to the view. The old
`boardTilt` slider now drives that lean and a `gantry` slider sets the beam
height, so both are still findable on `?tune=1`.

- `setBoards` no longer needs a side, since a gantry spans the road. It marks
  the stop sitting on the start/finish of a closed lap as `lights`.
- A lights gantry carries five red lamps on a dark rig and no name. They are
  lit only while the Next chip names that section, which is exactly while the
  car is on the line, so they go out as it pulls away.
- The board layer moved after the car, so the car passes under a gantry rather
  than over it. A camera above and behind sees the beam first wherever the two
  overlap, and one far enough ahead to be behind the car is by then too near
  the top of the band to reach it.
- The name is dropped, keeping the gantry, in a third case now: when the
  banner is edge on round a corner and the text would come out on its side.

`style.css`: the legs read lighter than the beam, and `.is-lights` gives the
rig a fixed dark panel with lamps that turn red on `.is-next`.

Checked in the browser, both themes, home page and a project page: the start
rig sits over the chequer with the car under it, a named banner reads from a
long way back and keeps its accent bar, the out lap's Pit exit gantry sits on
its start line, no console errors.

Still open: nothing named. Not committed.

## 2026-09-18, the gantry sign built as geometry rather than a card

Matty said the boards read as "a weird card over the top" and asked for the
name to be part of the 3D design. The cause was material, not projection: the
panel was filled with `--card` and stroked with `--border`, the name was
`--foreground` at UI weight, and the accent bar was `--accent`, none of them
shaded, so the whole gantry was flat UI colour sitting over a lit scene. The
banner was also only as wide as its name, floating in the middle of a wider
beam, which is what made it look stuck on.

`circuit3d.js`, `drawBoard()` rebuilt around the car's own face pipeline:

- Each face is now its own pooled `<path>`, filled by `shade()` from a normal
  in gantry space against the same `LIGHT` the car uses, and hairlined in its
  own colour the way the car's faces are. The beam's top is lit, its face
  toward the car falls away, the left leg's inner face is the lit one.
- New fixed materials at the top of the file, `STEEL`, `SIGN`, `SIGN_INK`,
  `BAND`, `RIG`, `LAMP_ON`/`LAMP_OFF`, rather than page tokens: a sign is a
  sign in either theme, and a token fill cannot be shaded.
- The board runs the full span between the legs and hangs flush off the beam's
  underside, so it is the gantry's own panel. `BOARD_T` adds a bottom edge
  face, which is dark under this light and gives it thickness.
- The name is still SVG text on an affine fit, which is within about a per
  cent of true perspective over a board this shallow (checked: the board's
  depth is about 1 per cent of the camera distance, so the trapezoid a true
  projection would give is not worth the strips it would cost). It is now
  fitted to its own lettering box rather than the whole board, and filled with
  `shade(SIGN_INK, ...)` in the board's light instead of `--foreground`.
- The livery band moved off the bottom edge and is knocked back off the car's
  livery, so it reads as paint on the board rather than a rule under the name.

`style.css`: every `.c3d-board-*` fill rule deleted, since a CSS fill would
override the shaded presentation attribute. Only `.c3d-board-text` is left,
without a fill, and tracked out rather than tightened.

Checked with a headless Edge harness rather than the Orca browser, whose
screenshots were coming back from a stale frame and then failing with the
panel hidden. The harness was a throwaway `_probe.html` that pulled the path
out of `index.html` and drew several lap fractions side by side, deleted
again after. Both themes: a named gantry reads over the road with the car
under it, the start rig carries five red lamps over the chequer, no errors.

Not committed.

## 2026-09-18, the page bands run under the 3D strip

Matty: the background tint shifts from section to section as you scroll, but
the column the track sits in never changed with it, so the strip read as a
separate panel rather than part of the page.

Cause: in 3D mode the strip took its room with `body { padding-right:
var(--c3d-w) }`. Padding is inside the background box of the body but outside
every section's, so `.section-alt`'s tint, the `.section` top rules, the
`.proj-band` and `.proj-next` tints and the footer rule all stopped at the
strip's left edge. That left a column of flat `--background` down the right
that never changed, with a hard vertical seam at every tinted section.

`style.css`, the 3D block at the end: the body padding is gone and the room is
taken block by block instead, `padding-right: var(--c3d-w)` on `.hero`,
`.section`, `.proj-hero`, `.proj-band`, `.proj-next` and `footer`. Each band
now spans the window and passes under the strip, whose ground is unfilled, so
the car drives over the same tint the text beside it sits on. `.nav` moved
from `right: var(--c3d-w)` to the same padding for the same reason, so its
surface and bottom rule cross too. The hero's grid mask is recentred on the
content column with `calc(50% - var(--c3d-w) / 2)`, since the padding widens
the box the mask is measured from.

Checked headless over CDP (Edge, 1600x1000) rather than the Orca browser:
sampled the page colour either side of a section boundary at x=600 and x=1560
and it changes together in both themes (light 250 to 255, dark 15,15,18 to
9,9,11), hero, footer, project index and a project page, no horizontal
overflow, no console errors. The throwaway `_probe_3d.html` used to set the
view mode before load was deleted after.

Not committed.

## 2026-09-18, the road made opaque

Matty: the track was slightly transparent and the section rule could be seen
through it.

It was. Every road material is a tint with alpha over whatever is behind the
strip: `.c3d-road` is `--muted-foreground / .55`, the apron `/ .3`, the verge
`/ .16`. Once the page bands ran under the strip, a `.section` top rule and
each change of section tint mixed straight into the road. Measured before the
fix, a column down the road at x=1300 read 175,175,180 on the tinted section,
165 on the rule and 177 below it.

Fixed with one opaque layer rather than by respecifying every material: a new
`c3d-base` path, drawn first, one quad a row from the outer edge of one verge
to the other, filled `hsl(var(--background))`. Every tint above it now mixes
against that slab. Since the slab is the page's own colour, the road renders
identically where the page behind is plain, which a scanline across a straight
confirms unchanged to the pixel (verge 232,232,234, apron 212,212,215, road
177,177,182, worn line 145,145,149). The tyre barriers sit at `WALL_AT`, well
inside the verge, so they are covered too.

After: the same column reads a flat 177,177,182 in light and 85,85,91 in dark
across the boundary, and the rule stops at the road and picks up the other
side.

`circuit3d.js`: `elBase` layer, `base` quad in the row loop, one `setAttribute`.
`style.css`: `.c3d-base`.

Not committed.

## 2026-09-18, camera taken higher and the road widened

Matty wanted the view a little more helicopter and the car smaller on the
track without the track losing its width on screen.

Both come from one pair of numbers. Screen size goes as world size over camera
distance, so raising `CAM.height` 80 to 100 and `ROAD` 6.2 to 7.8 together,
the same 1.25, leaves the road the same width in the strip while everything
sized in its own units, the car above all, shrinks by that factor. `CAM.pitch`
70 to 76 is the helicopter part. Measured on a straight: the road spanned 98px
before and 100px after.

Consequences worth knowing:

- The run-off is unchanged in track units, so it is about 13 per cent narrower
  on screen than it was. A wider circuit with the same run-off beside it.
- The chequer is still `ROAD / FLAG_COLS`, so its cells grew with the road and
  come out the same size on screen as before. Nothing to change there.
- The legs stand at `HALF + KERB_W + 0.5` and the gantries span the road, so
  they widened with it and their names are still fitted to the board.
- A higher, steeper camera sees further up the circuit, so a gantry now comes
  into frame while it is still round a corner, where its name is drawn turned
  toward vertical. The existing drop rule still catches the genuinely edge-on
  case. Left as it is: it reads as a sign seen from above, not as a fault.
- `draw`, `behind` and `samples` left alone. Steeper pitch pulls the far end
  of the view back in about as much as the extra height pushes it out, and
  nothing runs out of road in frame at any scroll position checked.

Checked headless in both themes at several scroll positions, home page and a
project out lap, plus a straight, a corner and a named gantry. Comments in the
header, the CAM block and the car block updated to the new numbers.

Not committed.
