// Merge data/cv.yaml with data/openalex.json into public/cv-data.json.
//
// The merged file is the single input consumed by BOTH the website
// (src/data/cv.ts) and the Typst PDF (pdf/cv.typ). Citation counts are
// attached to each publication by matching its DOI.
//
// Run: npm run data
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const CV_PATH = resolve(root, 'data/cv.yaml');
const OA_PATH = resolve(root, 'data/openalex.json');
const OUT_DIR = resolve(root, 'public');
const OUT_PATH = resolve(OUT_DIR, 'cv-data.json');

const normalizeDoi = (doi) =>
  (doi || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, '');

const cv = yaml.load(readFileSync(CV_PATH, 'utf8'));
const oa = existsSync(OA_PATH)
  ? JSON.parse(readFileSync(OA_PATH, 'utf8'))
  : { metrics: {}, citationsByDoi: {} };

const citationsByDoi = oa.citationsByDoi || {};
const usedDois = new Set();

// Attach citation counts to publications.
let matched = 0;
const unmatched = [];
for (const pub of cv.publications || []) {
  const doi = normalizeDoi(pub.doi);
  if (!doi) continue;
  if (Object.prototype.hasOwnProperty.call(citationsByDoi, doi)) {
    pub.citations = citationsByDoi[doi];
    usedDois.add(doi);
    matched++;
  } else {
    unmatched.push(`${pub.authors} (${pub.year ?? 'n.d.'}) — doi:${doi}`);
  }
}

cv.metrics = oa.metrics || {};
cv.generated_at = new Date().toISOString();

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(cv, null, 2) + '\n');

// ---- Reporting ----
console.log(`Merged data → public/cv-data.json`);
console.log(`  citations attached to ${matched} publications`);
if (unmatched.length) {
  console.warn(`  ⚠ ${unmatched.length} curated DOI(s) had no OpenAlex match (check for typos):`);
  for (const u of unmatched) console.warn(`      ${u}`);
}

// Surface notable OpenAlex works NOT on the curated list (e.g. a new paper
// to add), ignoring obvious noise (preprints, abstracts, book chapters).
const NOISE = [/ssrn/, /arxiv/, /abstract/, /amproc/, /eorms/, /9781/, /1003399599-/];
const missing = Object.entries(citationsByDoi)
  .filter(([doi]) => !usedDois.has(doi))
  .filter(([doi]) => !NOISE.some((re) => re.test(doi)))
  .filter(([, c]) => c >= 5)
  .sort((a, b) => b[1] - a[1]);
if (missing.length) {
  console.log(`  ℹ OpenAlex works with ≥5 citations not in the curated list (review):`);
  for (const [doi, c] of missing) console.log(`      ${c} cites — doi:${doi}`);
}
