// Fetch OpenAlex author metrics + per-DOI citation counts.
//
// Writes data/openalex.json. If OpenAlex is unreachable, the existing
// data/openalex.json is kept (so the build still succeeds offline).
//
// Run: npm run fetch
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const CV_PATH = resolve(root, 'data/cv.yaml');
const OUT_PATH = resolve(root, 'data/openalex.json');

// Polite-pool contact (https://docs.openalex.org/how-to-use-the-api/rate-limits-and-authentication).
const MAILTO = 'siemsene@gmail.com';

const cv = yaml.load(readFileSync(CV_PATH, 'utf8'));
const authorId = cv?.profile?.openalex_author_id;
if (!authorId) {
  console.error('No profile.openalex_author_id in data/cv.yaml — skipping fetch.');
  process.exit(0);
}

const normalizeDoi = (doi) =>
  (doi || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, '');

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': `siemsen-cv (${MAILTO})` } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

async function main() {
  const base = 'https://api.openalex.org';

  // 1) Author-level aggregate metrics.
  const author = await getJson(`${base}/authors/${authorId}?mailto=${MAILTO}`);
  const metrics = {
    cited_by_count: author.cited_by_count ?? null,
    works_count: author.works_count ?? null,
    h_index: author.summary_stats?.h_index ?? null,
    i10_index: author.summary_stats?.i10_index ?? null,
  };

  // 2) Per-work citation counts, keyed by normalized DOI.
  const citationsByDoi = {};
  let cursor = '*';
  let fetched = 0;
  while (cursor) {
    const url =
      `${base}/works?filter=author.id:${authorId}` +
      `&select=doi,cited_by_count&per-page=200&cursor=${encodeURIComponent(cursor)}&mailto=${MAILTO}`;
    const page = await getJson(url);
    for (const w of page.results) {
      const doi = normalizeDoi(w.doi);
      if (doi) citationsByDoi[doi] = w.cited_by_count ?? 0;
    }
    fetched += page.results.length;
    cursor = page.meta?.next_cursor || null;
  }

  const payload = {
    fetched_at: new Date().toISOString(),
    author_id: authorId,
    metrics,
    citationsByDoi,
  };
  writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2) + '\n');
  console.log(
    `OpenAlex: ${metrics.cited_by_count} citations, h-index ${metrics.h_index}, ` +
      `${Object.keys(citationsByDoi).length} works with DOIs (from ${fetched} works).`,
  );
}

main().catch((err) => {
  console.error(`OpenAlex fetch failed: ${err.message}`);
  if (existsSync(OUT_PATH)) {
    console.error('Keeping existing data/openalex.json as fallback.');
    process.exit(0);
  }
  // No cache to fall back on — write an empty shell so the build can proceed.
  writeFileSync(
    OUT_PATH,
    JSON.stringify(
      { fetched_at: null, author_id: authorId, metrics: {}, citationsByDoi: {} },
      null,
      2,
    ) + '\n',
  );
  console.error('No cache found; wrote empty openalex.json (no citation data this build).');
  process.exit(0);
});
