import { ClubCrest } from './ClubCrest';
import { Flag } from './Flag';
import { cardInk, isLightTier, nameFontScale, templateUrl, type CardData } from '@/lib/card';
import type { StatKey } from '@/lib/scoring';

// Layout measured from last year's printed cards and the templates' own marker lines:
// short dashes at 30% and 39.5% of the height (centred 26.4% across), divider at 63.4%, centre line at 50%.
const COLUMN_CENTRE = 26.4; // % across: number, position, flag and crest share this column
const ROWS = [68.4, 75.6, 82.8]; // % down: centre of each stat row
const STAT_FONT = 0.06; // × card width
const LEFT: StatKey[] = ['SSK', 'RIB', 'PRA'];
const RIGHT: StatKey[] = ['CHA', 'SSA', 'BEH'];
// Value right-aligned against its label, like "70 SSK | 80 CHA".
const COLUMNS = [
  { keys: LEFT, valueRight: 72, labelLeft: 30 }, // value ends at 28% across
  { keys: RIGHT, valueRight: 36, labelLeft: 66 }, // value ends at 64% across
];

export function PlayerCard({ data, width = 340, hideStats = false }: { data: CardData; width?: number; hideStats?: boolean }) {
  const height = (width * 257) / 182;
  const ink = cardInk(data.tier);
  // On the dark, busy designs (e.g. the crystal card) a soft shadow lifts the text off the artwork.
  const textShadow = isLightTier(data.tier) ? undefined : '0 1px 2px rgba(0,0,0,0.6), 0 0 8px rgba(0,0,0,0.45)';
  const px = (fraction: number) => `${fraction * width}px`;
  const template = templateUrl(data.tier);
  const statTop = (row: number) => `calc(${ROWS[row]}% - ${px(STAT_FONT / 2)})`;
  const inColumn = (widthPct: number) => ({ left: `${COLUMN_CENTRE - widthPct / 2}%`, width: `${widthPct}%` });

  return (
    <div className="relative select-none font-card leading-none" style={{ width, height, color: ink, textShadow }}>
      <img src={template} alt="" className="absolute inset-0 h-full w-full" />

      {data.photoUrl ? (
        // Outer layer clips the photo to the card silhouette (the template's alpha channel).
        <div
          className="absolute inset-0"
          style={{
            maskImage: `url(${template})`, WebkitMaskImage: `url(${template})`,
            maskSize: '100% 100%', WebkitMaskSize: '100% 100%',
          }}
        >
          <img
            src={data.photoUrl}
            alt={data.name}
            crossOrigin="anonymous"
            className="absolute object-cover object-top"
            style={{
              left: '33%', top: '8%', width: '59%', height: '52%',
              maskImage: 'linear-gradient(to bottom, transparent, black 8%, black 72%, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 8%, black 72%, transparent)',
            }}
          />
        </div>
      ) : (
        <svg viewBox="0 0 100 100" className="absolute opacity-35" style={{ left: '40%', top: '13%', width: '46%' }} aria-hidden>
          <circle cx="50" cy="35" r="20" fill={ink} />
          <path d="M10 100 C10 65 90 65 90 100 Z" fill={ink} />
        </svg>
      )}

      {textShadow && (
        // Darker strip behind the number/flag/crest column, as on last year's cards, so they read on busy artwork.
        <div
          aria-hidden
          className="absolute"
          style={{
            left: `${COLUMN_CENTRE - 13}%`, width: '26%', top: '10%', height: '45%',
            background: 'rgba(0,0,0,0.32)',
            maskImage: 'linear-gradient(to right, transparent, black 25%, black 75%, transparent), linear-gradient(to bottom, transparent, black 18%, black 70%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 25%, black 75%, transparent), linear-gradient(to bottom, transparent, black 18%, black 70%, transparent)',
            maskComposite: 'intersect',
            WebkitMaskComposite: 'source-in',
          }}
        />
      )}

      {data.active && (
        // Rank number with the playing position under it, as on last year's cards. Retired players have no rank.
        <div className="absolute text-center" style={{ ...inColumn(24), top: '10.5%' }}>
          <div style={{ fontSize: px(0.155), fontWeight: 700 }}>{data.tier}</div>
          {data.position && (
            <div style={{ fontSize: px(0.06), fontWeight: 500, marginTop: px(0.015), letterSpacing: '0.04em' }}>{data.position}</div>
          )}
        </div>
      )}
      {/* Flag sits between the template's two short dashes; the club crest just below. */}
      <div className="absolute" style={{ ...inColumn(17), top: '30.9%' }}>
        <Flag code={data.flag} />
      </div>
      <div className="absolute" style={{ ...inColumn(17), top: '41.5%' }}>
        <ClubCrest club={data.club} />
      </div>

      <div
        className="absolute w-full whitespace-nowrap text-center uppercase"
        style={{ top: '55%', fontSize: px(nameFontScale(data.name)), fontWeight: 700, letterSpacing: '0.01em' }}
      >
        {data.name}
      </div>

      {!hideStats &&
        COLUMNS.map(({ keys, valueRight, labelLeft }) =>
          keys.map((k, row) => (
            <div key={k}>
              <span
                data-testid={`stat-${k}`}
                className="absolute text-right tabular-nums"
                style={{ right: `${valueRight}%`, top: statTop(row), fontSize: px(STAT_FONT), fontWeight: 700 }}
              >
                {data.stats[k]}
              </span>
              <span className="absolute" style={{ left: `${labelLeft}%`, top: statTop(row), fontSize: px(STAT_FONT), fontWeight: 500 }}>
                {k}
              </span>
            </div>
          )),
        )}

      {!data.active && (
        <div className="absolute left-0 right-0 bg-black/70 py-1 text-center font-bold uppercase tracking-widest text-white" style={{ top: '45%', fontSize: px(0.07) }}>
          Retired
        </div>
      )}
    </div>
  );
}
