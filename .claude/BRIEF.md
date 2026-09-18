# Brief: a 3D circuit strip

Replaces the site-polish brief in this worktree. That work is merged and lives
in the log. This worktree has one job: turn the circuit widget from a top-down
map into a view from behind the car, and find out whether it is worth keeping.

## The idea

Matty: "having a more visually impressive experience where the track and car
are even 3D. Is that even possible, so having it go round the track that way?"

Yes. Not with WebGL. The geometry is already separated from the drawing, so
what changes is the projection step.

## Placement decision

**Move it to a fixed band across the bottom of the viewport.** Full width,
roughly 110px tall, desktop only, replacing the right-hand gutter strip.

Why the bottom and not the top:

- A chase camera needs width. The horizon is a horizontal line, and the whole
  effect depends on seeing it run across the frame. The current strip is 380px
  wide at most and two and a half times as tall as it is wide, which is the
  worst possible shape for this.
- The top was just cleared on purpose. The nav came off the home page because
  a bar up there let you skip the page rather than read it. Putting a bigger,
  busier widget straight back in that slot undoes it.
- A strip along the foot reads as instrumentation: a pit wall monitor, a TV
  timing bar. That is the right register for this site.

Risks to watch: a fixed bottom band can read as a cookie banner, and it eats
vertical space on every screen. Keep it short, keep it quiet when idle, and
let it sit at low opacity until the pointer is near it or the section changes.

The theme toggle is currently fixed at bottom left (`.theme-float`). It will
have to move to bottom right, or move into the band.

## What already exists, and what it buys

The widget is `<aside class="circuit">` in `index.html:470`, styled from
`style.css:1404`, driven by the circuit module in `site.js` from about line
377. Worth reading before touching anything: the comments in there carry the
reasoning and are better than this brief on detail.

The important part is that **only one thing in the whole system holds real
geometry**: the closed `<path>` at `index.html:495`. Everything else is
derived from it at runtime by walking it with `getPointAtLength`:

- `at(d)` samples a point at distance `d`, wrapping on a closed lap.
- `furnish()` finds corners by measuring turn per unit length, then lays down
  kerbs, rumble strips, the start line and the staggered grid boxes.
- `measure()` maps page scroll onto lap distance one for one, so a tenth of
  the page is a tenth of the lap, and moves the section markers onto the path
  at their own share of the scroll.
- `render()` sets the car's distance from `window.scrollY`, then lights a
  window of road with `stroke-dasharray` and grows the accent line behind it.

So a 3D version keeps `at()`, `furnish()`'s corner detection, `measure()`'s
scroll mapping and the whole Next chip and marker system untouched. What gets
replaced is the step that turns a sampled point into something on screen.

Current tunables worth knowing: `WIN_AHEAD` 108 and `WIN_BACK` 60 track units
of lit road, road width `ROAD` about 5.2 units, viewBox `-24 -84 48 120`, and
`CAP` 0.985 so the lap never ends a corner short.

## The approach

Hand-rolled perspective projection, still emitting SVG. No library, no canvas
unless a prototype proves SVG cannot keep up.

Per frame, given the car's distance `d` along the path:

1. Sample the path ahead and behind the car at a fixed step, out to the draw
   distance. Cap the sample count, around 80 is plenty.
2. Put each sample into car-local coordinates: translate by `-p(d)`, rotate by
   `-theta(d)`. This is exactly the inverse transform `#circuitWorld` already
   carries, so the model of a static car with the world moving under it does
   not change.
3. Lift to 3D on the ground plane: local lateral becomes x, local forward
   becomes z, y is 0 while the track stays flat.
4. Camera sits behind and above the car, pitched down. Apply the pitch
   rotation, then divide by depth for the perspective.
5. Offset each sample by half the road width along its normal, project both
   edges, and emit the road as one filled polygon rather than a stroked line.
   Strokes will not do: a stroke has a constant width, and the entire point is
   that the road narrows with distance.
6. Drop samples nearer than the near plane, so geometry behind the camera does
   not fold through the vanishing point.
7. Fade by depth, and mask the far end into a horizon.

Draw order is free: emit from far to near and the painter's algorithm handles
itself.

## Milestones

1. Standalone prototype at `proto/circuit3d.html`, not wired to the page, with
   sliders for camera height, pitch, field of view and draw distance. Copy the
   path data in. Find the camera that looks right before building anything
   around it.
2. Road ribbon, centre line, and kerbs on corners.
3. Start/finish line and the grid boxes, projected onto the surface.
4. Section markers: boards standing beside the track carrying the section name,
   which replaces the dots and the `.circuit-label` line.
5. Wire to scroll through the existing `measure()` and `render()`.
6. Bottom band layout, theme tokens, still off under reduced motion and still
   desktop only.
7. Decide what happens to the gutter strip and to the out lap on project pages.

Stop after 1 and show Matty. The camera either sells it or it does not, and
everything after that is wasted if it does not.

## Risks

- **Per frame cost.** Rebuilding a path `d` string every frame is the obvious
  worry. Reuse one path element, keep the sample count low, stay on rAF, and
  read no layout inside render.
- **An empty horizon.** A flat track with nothing beside it gives a fixed
  vanishing point and a long straight with nothing happening in it. Fog fade
  and some roadside furniture may be needed.
- **Far corners compress to nothing**, so the read of what is coming up gets
  worse than the top-down map. This is the real trade and it may be the thing
  that kills the idea.
- **Legibility at 110px tall.** Everything above has to work in a short band.

## Out of scope

WebGL and three.js. Track elevation and banking. Mobile, which does not show
the widget at all. Do not start reworking the project pages' out lap until the
home page version is settled.

## Rules

No em dashes anywhere, in copy, comments or commit messages. Verify rather
than guess. Preview with `Cache-Control: no-store`, because Orca's browser
will happily serve a stale `style.css` or `site.js` and make a working change
look broken. Commit only when Matty asks. Log finished work in
`.claude/WORKLOG.md`.
