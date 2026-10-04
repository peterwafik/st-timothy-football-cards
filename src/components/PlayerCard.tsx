import { ClubCrest } from './ClubCrest';
import { Flag } from './Flag';
import { isLightTier, nameFontScale, rankLabel, templateForTier, type CardData } from '@/lib/card';
import type { StatKey } from '@/lib/scoring';

const LEFT: StatKey[] = ['SSK', 'RIB', 'PRA'];
const RIGHT: StatKey[] = ['CHA', 'SSA', 'BEH'];
const ROW_TOPS = ['67.5%', '74%', '80.5%'];

export function PlayerCard({ data, width = 340, hideStats = false }: { data: CardData; width?: number; hideStats?: boolean }) {
  const height = (width * 257) / 182;
  const ink = isLightTier(data.tier) ? '#3a2a12' : '#ffffff';
  const { num, suffix } = rankLabel(data.tier);
  const px = (fraction: number) => `${fraction * width}px`;
  const template = `/templates/${templateForTier(data.tier)}.png`;

  const statColumn = (keys: StatKey[], left: string) =>
    keys.map((k, i) => (
      <div key={k} className="absolute flex items-baseline justify-center gap-[0.35em]" style={{ left, top: ROW_TOPS[i], width: '36%' }}>
        <span data-testid={`stat-${k}`} style={{ fontSize: px(0.072), fontWeight: 700 }}>{data.stats[k]}</span>
        <span style={{ fontSize: px(0.062), fontWeight: 500 }}>{k}</span>
      </div>
    ));

  return (
    <div className="relative select-none font-card leading-none" style={{ width, height, color: ink }}>
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
              left: '30%', top: '7%', width: '62%', height: '50%',
              maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 75%, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 75%, transparent)',
            }}
          />
        </div>
      ) : (
        <svg viewBox="0 0 100 100" className="absolute opacity-40" style={{ left: '38%', top: '14%', width: '46%' }} aria-hidden>
          <circle cx="50" cy="35" r="20" fill={ink} />
          <path d="M10 100 C10 65 90 65 90 100 Z" fill={ink} />
        </svg>
      )}

      <div className="absolute text-center" style={{ left: '10%', top: '12%', width: '24%' }}>
        <div style={{ fontSize: px(0.16), fontWeight: 700 }}>{num}</div>
        <div style={{ fontSize: px(0.06), fontWeight: 500, marginTop: px(0.01) }}>{suffix}</div>
      </div>
      <div className="absolute" style={{ left: '14%', top: '31.6%', width: '16%' }}>
        <Flag code={data.flag} />
      </div>
      <div className="absolute" style={{ left: '14%', top: '42%', width: '16%' }}>
        <ClubCrest club={data.club} />
      </div>

      <div className="absolute w-full whitespace-nowrap text-center uppercase" style={{ top: '55.5%', fontSize: px(nameFontScale(data.name)), fontWeight: 700 }}>
        {data.name}
      </div>

      {!hideStats && (
        <>
          {statColumn(LEFT, '12%')}
          {statColumn(RIGHT, '52%')}
        </>
      )}

      {!data.active && (
        <div className="absolute left-0 right-0 bg-black/70 py-1 text-center font-bold uppercase tracking-widest text-white" style={{ top: '45%', fontSize: px(0.07) }}>
          Retired
        </div>
      )}
    </div>
  );
}
