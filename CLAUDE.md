# CLAUDE.md

## Writing style

**Never use an em dash (—) or `&mdash;` anywhere.** This applies to everything:
site copy, alt text, page titles, code comments, commit messages, README prose,
and replies in chat. There is always a better option:

- A comma, for an aside: `the regime where a bike spends its lap time, and one
  largely absent from open literature`
- A colon, for a definition or list that follows
- A full stop, when the clause can stand alone
- `to`, for ranges in prose: `September 2023 to June 2027`, `Jun to Sept 2025`
- A comma or `/`, for a label separator: `Engineering Intern, Aerodynamics`
- `|`, in page titles

En dashes (–) stay where they are typographically correct: numeric ranges
(`45–60°`, `2026–27`) and compound proper names (`Nelder–Mead`).

Avoid the wider register of AI-sounding writing too: no "delve", "tapestry",
"it's not just X, it's Y", no three-item rule-of-three padding, and no
hedging throat-clearing before the point. Write plainly and state the thing.

## Work log

`.claude/WORKLOG.md` is the persistent record of what Claude has done in this
worktree. A SessionStart hook prints it into context on startup, resume,
`/clear`, and `/compact`, so it is the only memory that survives a context wipe.

Read it before starting, and append to it whenever you finish a meaningful piece
of work: a commit, a set of file edits, a decision about the design, or a
problem you hit and how it was resolved. Add a new `##` section dated with
today's date at the bottom, keep it to a few lines, and say what changed, why,
and what is still open. Never rewrite or trim earlier entries.

Do not log trivia: reading a file, running `git status`, or a single typo fix
does not need an entry.
