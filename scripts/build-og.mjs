// Generates a static 1200x630 Open Graph card (public/og.jpg) for social/link
// previews: portrait on the left, name + title on a paper background on the
// right. Run via `npm run og`. Uses sharp (installed for image optimization).
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const cv = JSON.parse(readFileSync(resolve('public/cv-data.json'), 'utf8'));
const { name, title, affiliation } = cv.profile;

const W = 1200, H = 630, PHOTO_W = 430;
const TX = PHOTO_W + 64; // left edge of the text column
const paper = '#fbfaf6', ink = '#211e1a', inkSoft = '#4a463f', accent = '#7c2d36';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Greedy word-wrap to a max character count per line (approximate, since we
// can't measure glyphs without a layout engine).
const wrap = (text, max) => {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if (line && (line + ' ' + w).length > max) { lines.push(line); line = w; }
    else line = line ? line + ' ' + w : w;
  }
  if (line) lines.push(line);
  return lines;
};

const tspans = (lines, x, lh) =>
  lines.map((l, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lh}">${esc(l)}</tspan>`).join('');

const titleLines = wrap(title, 34);
const affLines = wrap(affiliation, 40);

let y = 200;
const nameSvg = `<text x="${TX}" y="${y}" font-size="68" font-weight="600" fill="${ink}">${esc(name)}</text>`;
y += 78;
const subSvg = `<text x="${TX}" y="${y}" font-size="30" fill="${accent}">${tspans(titleLines, TX, 40)}</text>`;
y += 40 * titleLines.length + 24;
const affSvg = `<text x="${TX}" y="${y}" font-size="25" fill="${inkSoft}">${tspans(affLines, TX, 34)}</text>`;

const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${paper}"/>
  <rect x="${PHOTO_W}" y="0" width="6" height="${H}" fill="${accent}"/>
  <g font-family="Georgia, 'Times New Roman', serif">
    ${nameSvg}
    ${subSvg}
    ${affSvg}
    <text x="${TX}" y="568" font-size="23" fill="${inkSoft}" font-family="Arial, sans-serif">siemsen.edutool.org &#183; Curriculum Vitae</text>
  </g>
</svg>`;

const portrait = await sharp('photos/Enno 1.png')
  .resize(PHOTO_W, H, { fit: 'cover', position: 'top' })
  .toBuffer();

await sharp(Buffer.from(svg))
  .composite([{ input: portrait, left: 0, top: 0 }])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile('public/og.jpg');

console.log('Wrote public/og.jpg');
