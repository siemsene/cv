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

## Deployment (Cloudflare Workers Static Assets)

The site is hosted as a Cloudflare **Worker with static assets** (`wrangler.jsonc`), served at
`siemsen.edutool.org`. Pushing to `main` builds and deploys automatically via
`.github/workflows/deploy.yml`; the workflow also runs **weekly** (Mondays) to refresh citation
counts, and can be triggered manually from the Actions tab.

One-time setup:

1. **Create the project**: dashboard → Workers & Pages → Create → *Upload Static Files*. Name it
   **`siemsen-cv`** (must match `name` in `wrangler.jsonc`), upload `dist/` once to bootstrap.
2. **Add repo secrets** (Settings → Secrets and variables → Actions):
   - `CLOUDFLARE_API_TOKEN` — a token from the **"Edit Cloudflare Workers"** template
     (needs *Workers Scripts: Edit*).
   - `CLOUDFLARE_ACCOUNT_ID` — your account id (Cloudflare dashboard URL / right sidebar).
3. **Custom domain**: in the Worker → Settings → Domains & Routes → add `siemsen.edutool.org`.
   Since `edutool.org` DNS is on Cloudflare, the record is added for you.

After that, `wrangler deploy` (run by the workflow) updates the same Worker and the custom domain
stays attached. The PDF is served at `/cv.pdf`, the machine-readable data at `/cv-data.json`.
