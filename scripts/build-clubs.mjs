// Downloads club logos into public/clubs/<country>/<club>.png and writes src/lib/clubs.generated.json.
// Usage: node scripts/build-clubs.mjs     (one-off, ~8 minutes because of API rate limits; re-run to refresh)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as tar from 'tar';

const OUT_DIR = 'public/clubs';
const CATALOG = 'src/lib/clubs.generated.json';
const EUROPE_TARBALL = 'https://codeload.github.com/luukhopman/football-logos/tar.gz/refs/heads/master';
const SPORTSDB = 'https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=';
const SPORTSDB_LEAGUE = 'https://www.thesportsdb.com/api/v1/json/123/search_all_teams.php?l=';
const COUNTRY_ALIASES = { 'United States': 'USA', 'Türkiye': 'Turkey' };

const slug = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const country = (c) => COUNTRY_ALIASES[c] ?? c;

const catalog = [];
const seen = new Set();
function add({ name, country: c, league }, png) {
  const id = `${slug(c)}/${slug(name)}`;
  if (seen.has(id)) return false;
  seen.add(id);
  fs.mkdirSync(path.join(OUT_DIR, slug(c)), { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, `${id}.png`), png);
  catalog.push({ id, name, country: c, league, logo: `/clubs/${id}.png` });
  return true;
}

async function europe() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'logos-'));
  const tgz = path.join(tmp, 'logos.tgz');
  const res = await fetch(EUROPE_TARBALL);
  if (!res.ok) throw new Error(`Europe download failed: ${res.status}`);
  fs.writeFileSync(tgz, Buffer.from(await res.arrayBuffer()));
  await tar.x({ file: tgz, cwd: tmp });
  const root = path.join(tmp, 'football-logos-master', 'logos');
  let n = 0;
  for (const dir of fs.readdirSync(root)) {
    const [c, league] = dir.split(' - ');
    for (const file of fs.readdirSync(path.join(root, dir)).filter((f) => f.endsWith('.png'))) {
      if (add({ name: file.slice(0, -4), country: country(c), league }, fs.readFileSync(path.join(root, dir, file)))) n++;
    }
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`Europe: ${n} clubs`);
}

async function getTeams(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await sleep(2100); // free tier: ~30 requests/minute
    const res = await fetch(url);
    if (res.status === 429) { await sleep(60_000); continue; }
    if (!res.ok) return [];
    return ((await res.json()).teams ?? []).filter((t) => t.strSport === 'Soccer' && t.strBadge);
  }
  return [];
}

// Only accept a club from the wanted country; MLS also contains Canadian clubs.
const belongs = (t, wanted) =>
  country(t.strCountry) === wanted || (wanted === 'USA' && /Major League Soccer/.test(t.strLeague ?? ''));

async function addTeam(team, wanted) {
  const img = await fetch(`${team.strBadge}/small`);
  if (!img.ok) return false;
  return add(
    { name: team.strTeam, country: country(team.strCountry || wanted), league: team.strLeague || '' },
    Buffer.from(await img.arrayBuffer()),
  );
}

async function world() {
  const list = JSON.parse(fs.readFileSync('scripts/world-clubs.json', 'utf8'));
  const missed = [];
  for (const [wanted, { leagues, clubs }] of Object.entries(list)) {
    // League listings return up to 10 clubs each on the free tier, all with the right country.
    for (const league of leagues) {
      for (const team of await getTeams(SPORTSDB_LEAGUE + encodeURIComponent(league))) {
        if (belongs(team, wanted) && (await addTeam(team, wanted))) process.stdout.write('+');
      }
    }
    for (const name of clubs) {
      const team = (await getTeams(SPORTSDB + encodeURIComponent(name))).find((t) => belongs(t, wanted));
      if (!team) { missed.push(`${wanted}: ${name}`); continue; }
      await addTeam(team, wanted);
      process.stdout.write('.');
    }
  }
  console.log(`
World: done. Missed ${missed.length}:`);
  for (const m of missed) console.log('  -', m);
}

fs.rmSync(OUT_DIR, { recursive: true, force: true });
await europe();
await world();
catalog.sort((a, b) => a.country.localeCompare(b.country) || a.league.localeCompare(b.league) || a.name.localeCompare(b.name));
fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 1) + '\n');
console.log(`Wrote ${catalog.length} clubs to ${CATALOG}`);
