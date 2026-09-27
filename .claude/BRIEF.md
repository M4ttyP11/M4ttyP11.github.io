# Brief: copy and polish

Replaces the cookieless-analytics brief in this worktree. This worktree has one
job: go over the site line by line and make it read and look better. Rewording,
moving things, cutting things, small changes to type and spacing. No new
features, no new sections, no rebuild.

## How this differs from professional-makeover

`M4ttyP11/professional-makeover` is still open and its scope was never chosen.
That worktree is for a decision about direction: whether the site should get
visually quieter, whether project claims need evidence, whether the mechanics
(print, meta, a11y, performance) get a pass. This worktree is the opposite: no
decisions, just the hundred small fixes that are right regardless of which
direction is picked later.

Rule of thumb for what belongs here: if it changes a sentence, a heading, an
order, a margin or a font size, it is this worktree. If it changes what the
site is trying to be, it is the other one.

## What was found on a first read

Verified this session against `index.html` at `2c502b1`.

**The footer claims something that does not exist.** It reads "No cookies.
Anonymous visit counts only." and there is no analytics script anywhere in the
repo, so nothing is counted. Either it is wrong or it is early. Fix the line or
finish `M4ttyP11/cookieless-analytics`, but do not leave a false statement in
the footer.

**The home page has no nav and no skip link.** The nav was cut deliberately, so
that part is a decision, not a bug. But the circuit widget's comment still says
"The real navigation is the nav above", which is now false, and the widget is
`aria-hidden`. So the only in-page jump links on the home page are hidden from
assistive tech and absent entirely without JS. Worth raising even though the
a11y fix itself may belong in professional-makeover.

**"First" is claimed twice above the fold.** The lede ends "on track for a
first" and the stat immediately below is "1st / On track in MEng Aeronautical &
Astronautical Engineering". Keep one, and if it is the stat, the label is also
too long for its column.

**The 6-person stat breaks across the number.** "6" plus "Person research team,
proposed and led by me" reads as a fragment because the hyphenated compound is
split by the markup. Reword the label so it stands on its own.

**Two adjacent sections both open on "three".** "The three projects I'm
proudest of" then "Three placements, three industries". The second is also a
rule-of-three cadence of the sort the house style rules out. Vary them.

**Eyebrow and heading repeat each other.** "Major projects" over "The three
projects I'm proudest of", "Placements" over "Three placements, three
industries", "Contact" over a contact heading. The eyebrow is earning nothing
in at least two of the three.

**Contact has three buttons of unequal weight.** Email, LinkedIn and Download
CV, with the CV already offered in the hero. Decide whether it needs repeating
at the foot, and if it does, which one is primary.

This list is a starting point from one pass over `index.html` only. The six
project pages and `projects/index.html` have not been read yet and are likely
to hold more.

## Order of work

1. Finish the read: `projects/index.html` and the six project pages.
2. Fix the footer analytics claim, since it is the only item that is currently
   untrue.
3. Copy edits: the duplicate first, the 6-person label, the two "three"
   headings, the eyebrows.
4. Layout and type nudges that fall out of the copy changes.
5. Stale comments in `index.html` and `site.js` that describe a nav which no
   longer exists.

Show Matty the copy changes as a diff before touching spacing. Rewording is
his voice and he will want a say; margins he will not care about.

## Out of scope

New sections or pages. The circuit widget's existence or behaviour. Anything
requiring a build step. Rewriting project technical content, as opposed to
tightening how it is phrased.

## Rules

No em dashes anywhere, in copy, comments or commit messages, and this worktree
is mostly copy so sweep with `grep -rn '—\|&mdash;'` before every commit. No
AI-isms: no "delve", no "testament to", no "it's not just X, it's Y", no
rule-of-three padding. Verify rather than guess. Preview with
`Cache-Control: no-store`, because Orca's browser will happily serve a stale
`style.css` or `site.js` and make a working change look broken. Commit only
when Matty asks. Log finished work in `.claude/WORKLOG.md`.
