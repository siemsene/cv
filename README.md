# Enno Siemsen — CV (website + PDF)

A modern CV that renders as both a website ([siemsen.edutool.org](https://siemsen.edutool.org))
and a typeset PDF, generated from **one** data file. Citation counts come live from OpenAlex.

```
data/cv.yaml ──┐
               ├─► public/cv-data.json ──► Astro website (dist/)
OpenAlex   ────┘                       └─► Typst PDF (public/cv.pdf)
```

## Editing your CV

Everything lives in **`data/cv.yaml`** — positions, education, publications, awards, teaching,
etc. Edit it in any text editor (or directly on GitHub) and commit. The website and PDF both
rebuild from it. You never edit citation counts by hand; those are pulled from OpenAlex by DOI.

- To add a **publication**: copy an existing block under `publications:`, set `category` to
  `journal`, `other`, or `working`, and fill in `authors`, `title`, `venue`, `year`, and (for
  citation matching) the `doi`.
- Your OpenAlex author id is set once in `profile.openalex_author_id`.

### Finding a DOI for a new paper

```bash
npm run dois     # lists every OpenAlex work (title, year, DOI, citations)
```

Copy the DOI into the matching `publications` entry. `npm run data` warns if any DOI in
`cv.yaml` has no OpenAlex match (a typo) or if a notable OpenAlex paper is missing from your list.

## Local development

```bash
npm install
npm run dev      # http://localhost:4321  (rebuilds data, skips the network)
```

Full production build (fetches fresh citations + builds the PDF):

```bash
npm run build    # fetch → data → pdf → astro build  →  output in dist/
npm run preview  # serve the built site locally
```

### Scripts

| Script          | Does                                                            |
| --------------- | -------------------------------------------------------------- |
| `npm run fetch` | Pull author metrics + per-DOI citations → `data/openalex.json` |
| `npm run data`  | Merge `cv.yaml` + citations → `public/cv-data.json`            |
| `npm run pdf`   | Compile the Typst CV → `public/cv.pdf`                          |
| `npm run dois`  | List all OpenAlex works to find DOIs                            |

If OpenAlex is unreachable, the build reuses the committed `data/openalex.json` so it never fails.

### Typst (PDF) locally

CI installs Typst automatically. For local PDF builds, install Typst and either put it on your
`PATH` or drop the binary at `./bin/typst` (the `npm run pdf` wrapper checks both). See
<https://github.com/typst/typst>. The PDF template is `pdf/cv.typ`.

## Deployment (Cloudflare Pages)

Pushing to `main` builds and deploys automatically via `.github/workflows/deploy.yml`. The
workflow also runs **weekly** (Mondays) to refresh citation counts, and can be triggered manually
from the Actions tab.

One-time setup:

1. **Create the Pages project** (dashboard → Workers & Pages → Create → Pages → *Direct Upload*,
   or it's created on first `wrangler pages deploy`). Name it **`siemsen-cv`** (must match
   `--project-name` in the workflow).
2. **Add repo secrets** (Settings → Secrets and variables → Actions):
   - `CLOUDFLARE_API_TOKEN` — a token with the *Cloudflare Pages: Edit* permission.
   - `CLOUDFLARE_ACCOUNT_ID` — your account id (Cloudflare dashboard URL / right sidebar).
3. **Custom domain**: in the Pages project → Custom domains → add `siemsen.edutool.org`.
   Since `edutool.org` DNS is on Cloudflare, the `siemsen` CNAME is added for you. Done.

> Prefer a Git-connected Pages project instead of GitHub Actions? It works, but the build image
> doesn't ship Typst — you'd have to download it in the build command. The Actions approach here
> avoids that and gives native weekly scheduling.
