# mathiaspotter.co.uk

Personal portfolio site. Static HTML and CSS, no framework and no build step — open `index.html` in a browser and it works.

## Files

| File | What it is |
|---|---|
| `index.html` | All page content. Everything you'll edit day to day |
| `style.css` | All styling. Colours and spacing are variables at the top |
| `CNAME` | Tells GitHub Pages the custom domain. Do not delete |
| `.nojekyll` | Stops GitHub running Jekyll on the repo. Prevents files starting with `_` being ignored |
| `assets/` | Images, PDFs, plots |

## Deploying

Repo is `M4ttyP11/M4ttyP11.github.io` — a GitHub user site, so it serves from the repo root automatically.

```bash
git add .
git commit -m "Update site"
git push
```

Live within a minute or two. There is no build step and nothing to configure per deploy.

## Adding content

### Assets — exact filenames the HTML expects

**Names must match exactly**, including lowercase and hyphens. Anything missing hides itself rather than showing a broken icon, so it's safe to deploy before everything is gathered.

#### `assets/images/`

| Filename | What | Shape |
|---|---|---|
| `mathias.jpg` | Portrait for the hero | **Portrait, ~3:4** (e.g. 900×1200) |
| `correlation-plot.png` | Simulated vs real speed trace | Wide, ~16:9 |
| `piv-velocity-field.png` | PIV velocity field / vorticity figure | Wide |
| `gdp-model.png` | MotoGP wind tunnel model or CAD render | **16:10** (card image) |
| `formula-student.jpg` | FS car or front wing | **16:10** |
| `uav.jpg` | UAV, ideally in flight | **16:10** |
| `og-preview.jpg` | Social link preview | **1200×630 exactly** |

#### `assets/docs/`

| Filename | What |
|---|---|
| `Mathias_Potter_CV.pdf` | Current CV |
| `Individual_Project_Report.pdf` | Third-year individual project |
| `F1_Lap_Sim_Writeup.pdf` | Lap-time simulator write-up |

### ⚠️ Large PDFs

GitHub warns above **50 MB** per file and hard-blocks at **100 MB**. If the individual project report is larger:

1. **Compress it first** — most of the size is uncompressed figures. In Acrobat: *Save as Other → Reduced Size PDF*. Or use Ghostscript:
   ```
   gs -sDEVICE=pdfwrite -dPDFSETTINGS=/ebook -dNOPAUSE -dBATCH -sOutputFile=out.pdf in.pdf
   ```
   `/ebook` usually cuts a figure-heavy report by 80–90% with no visible loss on screen.
2. If it's still over 50 MB, host it on Google Drive or OneDrive with a public link and point the button at that URL instead of a local file.

Keep the repo well under 1 GB total.

### A new project card
Copy this into the `<div class="grid">` block in the Projects section:

```html
<article class="card">
  <h3>Project title</h3>
  <p class="subtitle">Context · Role · Year</p>
  <p>Two or three sentences. Lead with what it does, then the result.</p>
  <ul class="tags"><li>Tool</li><li>Method</li><li>Skill</li></ul>
</article>
```

The grid reflows automatically — no layout changes needed.

### A new experience entry
Copy into the `<ol class="timeline">` block, newest first:

```html
<li>
  <p class="when">Mon Year &ndash; Mon Year</p>
  <h3>Job title &mdash; Company</h3>
  <p>What you did and what it produced.</p>
</li>
```

### An image inside a project card
```html
<img src="assets/your-image.png" alt="Describe what the image shows"
     style="width:100%;border-radius:10px;margin-top:1rem" loading="lazy">
```

Always write a real `alt` description — it's read by screen readers and shown if the image fails.

## Restyling

Everything visual is controlled by the variables at the top of `style.css`:

```css
--navy:   #1B365D;   /* accent, matches the CV */
--ink:    #14181D;   /* body text */
--bg:     #FFFFFF;
--max:    min(1100px, 92vw);   /* content width */
```

Change those and the whole site follows. Dark mode has its own block directly underneath and follows the visitor's OS setting automatically.

## Outstanding

- [ ] Add the correlation plot
- [ ] Add CV and write-up PDFs
- [ ] Name the Meraki tech stack in the Experience section
- [ ] Point "View the code" at the actual simulator repo rather than the profile
- [ ] Optional: social preview image, then uncomment the `og:image` tag in `<head>`

## Notes

- Written for accessibility: semantic landmarks, keyboard focus rings, a skip link, reduced-motion support. Please don't strip these when editing.
- The correlation plot appears **above** the text on mobile — recruiters open links on phones, and the graph is the most persuasive thing on the page.
