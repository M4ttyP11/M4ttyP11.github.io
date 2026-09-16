# Brief: site polish

From the full review on 2026-09-13 (see WORKLOG in the main checkout). Ordered
by value. Items 1 to 4 first.

## Bugs
1. **Reveal hides content without JS.** `.reveal` is `opacity: 0` unconditionally
   and only `site.js` adds `.in`. Gate the hidden state on JS actually running
   (e.g. a class set by the head script).
2. **Circuit strip hard-clipped at its sides.** `.circuit-map` masks top and
   bottom only, so bends are sliced off at the strip's left and right edges.
   Add a horizontal fade.
3. **No `og:image`.** Make `assets/images/og-preview.jpg` (1200x630) and
   uncomment the tag in `index.html`; add one per project page.

## Visual
4. **Major project cards are 40% empty on the right.** Add thumbnails from
   `gdp-model.webp`, `piv-velocity-field.webp`, `correlation-plot.webp`.
5. **Other work cards have no images.** `formula-student.jpg`, `uav.jpg`,
   `cubesat.jpg` are missing, as are all carousel images on those three pages.
   Needs assets from Matty.
6. **Portrait is 482x649**, soft on high-DPI. Needs a ~1000px wide source.
   MotoGP renders are low-res too.
7. **Intro curtain** gates first load by about 1s. Cut or remove.

## Copy
8. "First, on track" appears four times on the home page. Keep hero and
   education, free the stat slot.
9. "6 / Person research team" reads badly. Reword.
10. Meraki: name the tech stack (TODO in `index.html`), strengthen tags.
11. "Program" to "Programme"; tighten the scholarship sentence.
12. Index PIV card could link the poster.

## Code tidiness
13. README stale: says no JS, omits `site.js`, lists `--navy`/`--ink` tokens
    that do not exist, names `Individual_Project_Report.pdf` (it is the
    poster), marks the CV as missing.
14. Unused CSS: `.work-grid`, `.work-stats`, `.timeline`, `.tl-*`,
    `.figure-grid`, `.gallery`, `.big`.
15. Duplicated comment block in the Next chip click handler in `site.js`.
16. Small: guard `localStorage` in try/catch, update `theme-color` on theme
    toggle, refresh sitemap `lastmod`.

## Not yet checked
Mobile layout. Orca's `set viewport` did not change `innerWidth`, so verify at
~390px another way.

## Rules
No em dashes anywhere. Preview with `Cache-Control: no-store`. Commit only when
Matty asks. Log finished work in `.claude/WORKLOG.md`.
