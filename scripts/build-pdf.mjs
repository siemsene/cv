// Compile the Typst CV to public/cv.pdf.
// Uses `typst` from PATH (CI installs it via setup-typst); falls back to a
// locally downloaded ./bin/typst for development.
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const localBin = resolve(root, 'bin/typst');
const bin = existsSync(localBin) ? localBin : 'typst';

const args = ['compile', 'pdf/cv.typ', 'public/cv.pdf', '--root', '.'];
const res = spawnSync(bin, args, { cwd: root, stdio: 'inherit' });

if (res.error) {
  if (res.error.code === 'ENOENT') {
    console.error(
      'Typst not found. Install it (https://github.com/typst/typst) or place the binary at ./bin/typst.',
    );
    process.exit(1);
  }
  throw res.error;
}
process.exit(res.status ?? 0);
