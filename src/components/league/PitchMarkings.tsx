// Chalk lines of a pitch seen from above: halfway line, centre circle and spot.
export function PitchMarkings() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1000 700"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <g fill="none" stroke="var(--color-chalk)" strokeOpacity="0.3" strokeWidth="4">
        <line x1="-50" y1="470" x2="1050" y2="470" />
        <circle cx="500" cy="470" r="250" />
        <path d="M-50 40 H1050" strokeOpacity="0.18" />
      </g>
      <circle cx="500" cy="470" r="9" fill="var(--color-chalk)" fillOpacity="0.35" />
    </svg>
  );
}
