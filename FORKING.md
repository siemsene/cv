# Build and host your own CV from this repo

This repo turns **one YAML file** into both a CV website and a typeset PDF.
Fork it, replace the data with yours, and you have your own CV site with
citation counts that refresh themselves weekly.

```
data/cv.yaml ──┐
               ├─► public/cv-data.json ──► Astro website (dist/)
OpenAlex   ────┘                       └─► Typst PDF (public/cv.pdf)
```

What you get:

- A fast static website (Astro + Tailwind) with your positions, publications,
  awards, teaching, and service.
- A matching PDF (Typst), rebuilt on every deploy and served at `/cv.pdf`.
- Live citation counts from [OpenAlex](https://openalex.org), matched to your
  publications by DOI and refreshed automatically every week by GitHub Actions.

## Prerequisites

- **Node.js 22+** and npm.
- **Typst** — only needed to build the PDF locally; CI installs it for you.
  Install from <https://github.com/typst/typst> and either put `typst` on your
  `PATH` or drop the binary at `./bin/typst`.
- A **Cloudflare account** (free tier is fine) for the default hosting setup —
  or any static host, see [Other hosts](#other-hosts).

## Step 1 — Fork and run it locally

```bash
git clone https://github.com/<you>/<your-fork>.git
cd <your-fork>
npm install
npm run dev      # http://localhost:4321
```

`npm run dev` rebuilds the data file but skips the network and the PDF, so it
works offline and without Typst. The full production pipeline is:

```bash
npm run build    # fetch citations → merge data → compile PDF → build site
npm run preview  # serve the built dist/ locally
```

Note: `npm run build` **fails if Typst is not installed** — that's expected
locally; install Typst or rely on CI, which sets it up automatically.

## Step 2 — Make it yours: the data

### `data/cv.yaml` — your entire CV

Everything content-related lives in this one file: profile, links, positions,
education, publications, awards, teaching, service. There is no separate schema
doc — the file is its own example. Replace the existing entries with yours,
keeping the structure; the comments inside the file explain the conventions.

A few specifics:

- **Publications** have a `category` of `journal`, `other`, or `working`, plus
  `authors`, `title`, `venue`, `year`, and a `doi` (used to match citation
  counts). Never type citation counts by hand — they're filled in from OpenAlex.
- **`profile.openalex_author_id`** powers the citation counts. Find yours by
  searching your name at [openalex.org](https://openalex.org) — the ID looks
  like `A5086167634`. It's **optional**: if you remove it, the fetch step is
  skipped cleanly and the site simply shows no citation metrics.
- Once your author ID is set, run `npm run dois` to list every work OpenAlex
  knows for you (title, year, DOI, citations) so you can copy DOIs into your
  `publications:` entries. `npm run data` warns about DOIs that don't match
  (usually a typo) and about notable OpenAlex papers missing from your list.

### `photos/` — your portrait(s)

Drop one or more photos (`png`, `jpg`, `jpeg`, or `webp`) into `photos/` and
delete the existing ones. They're picked up automatically — each visitor sees
one at random, optimized to a small WebP at build time. Portrait-orientation
(4:5) crops look best. If you'd rather have no photo, remove the `<Portrait />`
component from `src/components/Sidebar.astro`.

### Leftovers to delete

- `CV 3-31-26.pdf` in the repo root is the original owner's source PDF and is
  not used by the build — delete it.
- `data/openalex.json` contains the owner's cached citation data; your first
  `npm run build` (or `npm run fetch`) overwrites it.

## Step 3 — Make it yours: hardcoded spots

A handful of values are hardcoded in code/config and need a one-time edit:

| File | What to change |
| --- | --- |
| `src/components/Publication.astro` (line 8) | The regex `/(Siemsen,?\s*E\.?)/g` bolds the owner's name in author lists on the website — replace with your own name pattern, e.g. `/(Doe,?\s*J\.?)/g`. |
| `pdf/cv.typ` (lines 64–67) | The same name-bolding for the PDF: `s.split("Siemsen")` — replace `"Siemsen"` (both occurrences) with your last name. |
| `src/components/Portrait.astro` (lines 23, 34) | The `alt` text on the portrait image — set it to your name. |
| `astro.config.mjs` (line 8) | `site:` — your site's final URL (used for canonical links). |
| `wrangler.jsonc` (line 5) | `name:` — your Cloudflare Worker name; must match the project you create in Step 4. |
| `scripts/fetch-openalex.mjs` (line 18) and `scripts/dump-dois.mjs` (line 14) | `MAILTO` — your contact email, sent to OpenAlex's [polite pool](https://docs.openalex.org/how-to-use-the-api/rate-limits-and-authentication) for better rate limits. |
| `package.json` | `name` and `description` — cosmetic, but nice to update. |

## Step 4 — Deploy (Cloudflare Workers static assets)

The included workflow (`.github/workflows/deploy.yml`) builds and deploys on
every push to `main`, runs **weekly** (Mondays) to refresh citation counts, and
can be triggered manually from the Actions tab.

One-time setup:

1. **Create the Worker project**: Cloudflare dashboard → Workers & Pages →
   Create → *Upload Static Files*. Name it to match `name` in `wrangler.jsonc`.
   Upload your locally built `dist/` once to bootstrap it.
2. **Add repo secrets** (GitHub repo → Settings → Secrets and variables →
   Actions):
   - `CLOUDFLARE_API_TOKEN` — create from the **"Edit Cloudflare Workers"**
     token template (needs *Workers Scripts: Edit*).
   - `CLOUDFLARE_ACCOUNT_ID` — shown in the Cloudflare dashboard URL and right
     sidebar.
3. **Custom domain** (optional): in the Worker → Settings → Domains & Routes →
   add your domain. If its DNS is on Cloudflare, the record is created for you.
   Without a custom domain, set `workers_dev: true` in `wrangler.jsonc` to use
   the free `*.workers.dev` address.

> **Fork note:** GitHub disables scheduled workflows on forks until you enable
> them — open the **Actions** tab of your fork and click "I understand my
> workflows, go ahead and enable them", or the weekly citation refresh won't run.

After setup, every push to `main` redeploys. The PDF is served at `/cv.pdf` and
the machine-readable data at `/cv-data.json`.

## Other hosts

Nothing about the site requires Cloudflare — `npm run build` produces a plain
static `dist/` folder that works on GitHub Pages, Netlify, Vercel, or any
static host. Delete `wrangler.jsonc` and replace the deploy step in
`.github/workflows/deploy.yml` with your host's standard
[Astro deployment](https://docs.astro.build/en/guides/deploy/) action; keep the
build steps (including the Typst install) as they are.

## Troubleshooting

- **OpenAlex unreachable during a build** — the committed `data/openalex.json`
  is reused, so the build never fails on network errors; citation counts are
  just slightly stale until the next successful fetch.
- **`npm run data` warns about a DOI** — either the DOI in `cv.yaml` has a typo
  (no OpenAlex match) or OpenAlex lists a notable paper that's missing from
  your `publications:`. Run `npm run dois` to compare.
- **`npm run build` fails with "Typst not found"** — install Typst or place the
  binary at `./bin/typst`. `npm run dev` works without it.
- **Deploy fails with an authentication error** — check that both repo secrets
  are set and that the API token was created from the *Edit Cloudflare Workers*
  template.
