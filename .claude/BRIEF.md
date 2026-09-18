# Brief: a professional makeover

Replaces the circuit-3d brief in this worktree. That work is merged and lives
in the log. This worktree has one job: make the site read as the portfolio of
a graduate engineer applying for motorsport aerodynamics roles, to someone who
will spend ninety seconds on it.

## The audience

An engineering hiring manager or a recruiter, on a laptop, mid shortlist. They
want three answers fast: what has he actually built, is the work real, and can
he write. Anything on the page that does not serve one of those is cost.

## The scope is not settled yet

Matty asked for this worktree by name and nothing more. Milestone 0 is to
agree what "professional" means to him before changing a line, because the
word covers at least three different jobs:

1. **Visual restraint.** Quieter type, tighter grid, less motion, fewer
   accents. The risk of the current design is that the animation and the
   circuit widget read as a personal project rather than as a CV.
2. **Content and credibility.** Every project claim carries a number, a method
   and a result. Abstracts at the top of each project page already do some of
   this. The gap is evidence: plots, photos, a line on what was measured and
   how.
3. **Mechanics.** Print/PDF of the CV, real meta tags and OG images, keyboard
   and screen reader passes, Lighthouse, load weight, mobile.

Ask Matty which of the three he means, or whether he means all of them, and
put the answer here before starting.

## What is on the site now

`index.html` is one page: hero, education, the three headline projects,
three placements, contact. `projects/` holds an index plus six project pages.
`style.css` is about 2000 lines on a shadcn-style token system with a dark
theme. `site.js` is about 1300 lines, most of it the scroll-driven circuit
widget, with `circuit3d.js` beside it.

Known tension worth raising early: the circuit widget is the most distinctive
thing on the site and also the least professional-looking. Decide deliberately
whether it stays, gets quieter, or goes. Do not remove it on a whim, it took
real work and it is the one thing a reader will remember.

## Rules

No em dashes anywhere, in copy, comments or commit messages. Verify rather
than guess. Preview with `Cache-Control: no-store`, because Orca's browser
will happily serve a stale `style.css` or `site.js` and make a working change
look broken. Commit only when Matty asks. Log finished work in
`.claude/WORKLOG.md`.
