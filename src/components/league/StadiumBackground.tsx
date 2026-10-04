// Mown-grass stripes, darkened toward the edges like a floodlit stadium at night.
const GRASS = 'repeating-linear-gradient(180deg, var(--color-grass) 0 80px, var(--color-grass-light) 80px 160px)';
const VIGNETTE = 'radial-gradient(ellipse at 50% 20%, transparent 35%, rgba(0, 0, 0, 0.55) 100%)';

export function StadiumBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden text-chalk" style={{ background: GRASS }}>
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: VIGNETTE }} />
      <div className="relative mx-auto max-w-5xl px-4 pb-16">{children}</div>
    </div>
  );
}
