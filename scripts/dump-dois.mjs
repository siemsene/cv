// One-time helper: dump every OpenAlex work (title, year, DOI, citations)
// for the configured author, sorted by citations. Use this to find the DOI
// for a curated publication when first filling in data/cv.yaml.
//
// Run: npm run dois
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cv = yaml.load(readFileSync(resolve(__dirname, '../data/cv.yaml'), 'utf8'));
const authorId = cv?.profile?.openalex_author_id;
const MAILTO = 'esiemsen@wisc.edu';

const rows = [];
let cursor = '*';
while (cursor) {
  const url =
    `https://api.openalex.org/works?filter=author.id:${authorId}` +
    `&select=title,publication_year,doi,cited_by_count&per-page=200&cursor=${encodeURIComponent(cursor)}&mailto=${MAILTO}`;
  const res = await fetch(url);
  const page = await res.json();
  for (const w of page.results) {
    rows.push({
      c: w.cited_by_count ?? 0,
      y: w.publication_year ?? '',
      doi: (w.doi || '').replace(/^https?:\/\/(dx\.)?doi\.org\//, ''),
      t: (w.title || '').slice(0, 70),
    });
  }
  cursor = page.meta?.next_cursor || null;
}

rows.sort((a, b) => b.c - a.c);
for (const r of rows) {
  console.log(`${String(r.c).padStart(5)}  ${r.y}  ${r.doi.padEnd(40)}  ${r.t}`);
}
console.log(`\n${rows.length} works total.`);
