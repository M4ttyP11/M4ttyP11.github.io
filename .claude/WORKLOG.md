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
