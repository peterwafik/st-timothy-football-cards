// Shared look for the servants' pages: dugout panels on the stadium pitch, dark fields, gold primary actions.

export const field =
  'w-full rounded-xl bg-dugout/80 px-4 py-3 font-card text-lg text-chalk ring-1 ring-chalk/20 placeholder:text-chalk/40 ' +
  'focus:outline-none focus:ring-2 focus:ring-floodlight [color-scheme:dark] disabled:opacity-60';

export const buttonPrimary =
  'rounded-full bg-trophy px-6 py-3 font-stadium text-xl font-extrabold text-dugout shadow-lg shadow-black/30 ' +
  'hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-floodlight disabled:opacity-50';

export const buttonGhost =
  'rounded-full border border-chalk/40 px-4 py-2 font-card text-base font-bold text-chalk hover:bg-chalk hover:text-dugout ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-floodlight';

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end gap-4">
      <div className="flex-1">
        <h1 className="font-stadium text-5xl font-extrabold leading-none sm:text-6xl">{title}</h1>
        {subtitle && <p className="mt-2 font-card text-lg text-chalk/75">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Panel({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl bg-dugout/90 p-5 shadow-2xl ring-1 ring-chalk/15 backdrop-blur sm:p-6 ${className}`}>
      {title && <h2 className="mb-4 font-stadium text-3xl font-bold">{title}</h2>}
      {children}
    </section>
  );
}

export function Label({ text, hint, children }: { text: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-card text-base font-bold text-chalk/90">{text}</span>
      {children}
      {hint && <span className="font-card text-sm text-chalk/60">{hint}</span>}
    </label>
  );
}

export function Notice({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <p
      role={ok ? 'status' : 'alert'}
      className={`rounded-xl px-4 py-3 font-card text-lg font-bold ${ok ? 'bg-[#3ddc84]/15 text-[#7ff0b1]' : 'bg-[#ef6461]/15 text-[#ff9a96]'}`}
    >
      {children}
    </p>
  );
}
