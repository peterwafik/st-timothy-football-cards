// Copies all flag SVGs into public/flags and writes src/lib/flags.generated.json.
// Usage: node scripts/copy-flags.mjs
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'node_modules/country-flag-icons/3x2';
const OUT = 'public/flags';
const SPECIAL = { 'GB-ENG': 'England', 'GB-SCT': 'Scotland', 'GB-WLS': 'Wales', 'GB-NIR': 'Northern Ireland' };
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

fs.mkdirSync(OUT, { recursive: true });
const flags = [];
for (const file of fs.readdirSync(SRC).filter((f) => f.endsWith('.svg'))) {
  const code = file.slice(0, -4);
  let name = SPECIAL[code];
  if (!name && /^[A-Z]{2}$/.test(code)) {
    try {
      const n = regionNames.of(code);
      if (n && n !== code) name = n;
    } catch { /* unknown region code */ }
  }
  if (!name) continue;
  fs.copyFileSync(path.join(SRC, file), path.join(OUT, file));
  flags.push({ code, name });
}
flags.sort((a, b) => a.name.localeCompare(b.name));
fs.writeFileSync('src/lib/flags.generated.json', JSON.stringify(flags, null, 1) + '\n');
console.log(`Copied ${flags.length} flags`);
