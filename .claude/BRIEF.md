# Brief: cookieless analytics

Replaces the professional-makeover brief in this worktree. This worktree has
one job: find out who reads mathiaspotter.co.uk and what they look at, without
setting a cookie, without a consent banner, and without shipping the reader's
data to an ad network.

## Why cookieless

Two reasons, and the second is the real one.

1. **Law.** UK PECR and GDPR need consent before a non-essential cookie or any
   other client-side storage. Consent means a banner. A banner on a graduate
   portfolio is a worse first impression than having no numbers at all.
2. **The audience.** The readers are hiring managers and recruiters. Several
   will be on corporate networks that block Google Analytics outright, so GA
   would undercount exactly the visitors that matter. Cookieless tools that
   count server side or with a single small beacon are not just more polite,
   they are more accurate here.

## What is on the site now

Nothing. `grep -rn -i 'analytics\|plausible\|gtag\|goatcounter\|umami'` across
the repo returns no hits, verified this session. There is no privacy page and
no cookie notice, which is currently correct because nothing is tracked.

Constraints that shape the choice: static HTML, no build step, hosted on
GitHub Pages behind the `mathiaspotter.co.uk` CNAME. So no server-side log
processing and no self-hosted collector on the same origin unless a separate
host is paid for. Whatever is picked is a hosted endpoint plus a script tag,
or nothing.

## Candidates

**Not verified this session.** Pricing, free tiers and the cookieless claim of
each of these are from memory and all of them move. Milestone 1 is checking
each one's current docs before any of this is treated as fact.

- **GoatCounter.** Hosted, free for personal use, no cookies, very light
  script. Likely the best fit for a personal site.
- **Cloudflare Web Analytics.** Free, beacon based, does not need the domain
  proxied through Cloudflare. Coarser data than the others.
- **Umami Cloud.** Free tier, open source, self-hostable later.
- **Plausible, Fathom, Simple Analytics.** Paid, roughly a few pounds a month.
  Better dashboards. Hard to justify for one portfolio.

## What to actually measure

Keep the question list short, because a dashboard nobody reads is worse than
no dashboard.

- Are people arriving at all, and from where: LinkedIn, a CV PDF, direct.
- Do they get past the hero, and which of the six project pages they open.
- Whether the CV download is clicked.
- Desktop vs mobile share, since the circuit widget is desktop only.

## Milestones

1. Verify the candidate list against current docs. Confirm each is genuinely
   cookieless and storage free, not just "cookieless by default".
2. Pick one and say in the log why, including what was given up.
3. Add the script tag to `index.html`, `projects/index.html` and the six
   project pages. Check whether a shared head include is worth introducing
   first, since there is no build step to do it for us.
4. Outbound and download events for the CV button, if the tool does it without
   extra weight.
5. Write a short privacy line and link it from the footer. Even with no
   consent needed, saying what is counted is the point of doing it this way.
6. Verify in the browser that no cookie and no localStorage entry appears, and
   that the page still works with the script blocked.

## Out of scope

Google Analytics in any form. Consent banners and consent management. Session
recording, heatmaps, A/B testing. Any tracking of individuals rather than
counts.

## Rules

No em dashes anywhere, in copy, comments or commit messages. Verify rather
than guess, which in this worktree is the whole first milestone. Preview with
`Cache-Control: no-store`, because Orca's browser will happily serve a stale
`style.css` or `site.js` and make a working change look broken. Commit only
when Matty asks. Log finished work in `.claude/WORKLOG.md`.
