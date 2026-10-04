'use client';
import { useActionState, useState } from 'react';
import { buttonPrimary, field, Label, Notice, PageHeader, Panel } from '@/components/staff/ui';
import { useFormSubmit } from '@/components/useFormSubmit';
import { addAdjustment } from './actions';

const QUICK_POINTS = [25, 50, 100];

type Kind = 'bonus' | 'deduct';

// Kid, date, points and reason. Remounted (and so cleared) after each successful save.
function AdjustFields({ kids, defaultDate, kind }: { kids: { id: string; name: string }[]; defaultDate: string; kind: Kind }) {
  const [points, setPoints] = useState('');
  const bonus = kind === 'bonus';
  return (
    <Panel>
      <div className="grid gap-5 sm:grid-cols-2">
        <Label text="Kid">
          <select name="kid_id" required className={field} defaultValue="">
            <option value="" disabled>Choose a kid…</option>
            {kids.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
          </select>
        </Label>
        <Label text="Date">
          <input name="date" type="date" required defaultValue={defaultDate} className={field} />
        </Label>
        <Label text="Points">
          <div className="flex flex-wrap gap-2">
            <input
              name="points"
              type="number"
              min={1}
              max={10000}
              required
              placeholder="Points"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className={`${field} w-32! shrink-0`}
            />
            {QUICK_POINTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPoints(String(p))}
                className={`rounded-full px-4 font-stadium text-xl font-bold ring-1 ${points === String(p) ? 'bg-chalk text-dugout ring-chalk' : 'ring-chalk/30 hover:bg-chalk/10'}`}
              >
                {bonus ? '+' : '−'}{p}
              </button>
            ))}
          </div>
        </Label>
        <Label text="Reason" hint={bonus ? 'Shown on the kid’s page.' : 'Kept private: the kid’s page only says “Points deducted”.'}>
          <input name="reason" required placeholder={bonus ? 'e.g. helped clean the class' : 'e.g. talking during prayer'} className={field} />
        </Label>
      </div>
    </Panel>
  );
}

export function AdjustForm({ kids, defaultDate }: { kids: { id: string; name: string }[]; defaultDate: string }) {
  const [state, action, pending] = useActionState(addAdjustment, null);
  const onSubmit = useFormSubmit(action);
  const [kind, setKind] = useState<Kind>('bonus');
  const bonus = kind === 'bonus';

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <PageHeader title="Bonus / Deduct" subtitle="Reward something special, or take points off for behaviour." />
      <input type="hidden" name="kind" value={kind} />

      <Panel>
        <div className="grid grid-cols-2 gap-3" role="group" aria-label="Bonus or deduct">
          <button
            type="button"
            aria-pressed={bonus}
            onClick={() => setKind('bonus')}
            className={`rounded-xl px-4 py-4 text-left ring-1 transition ${bonus ? 'bg-[#3ddc84] text-dugout ring-[#3ddc84]' : 'bg-dugout/60 ring-chalk/20 hover:ring-chalk/50'}`}
          >
            <span className="block font-stadium text-4xl font-extrabold leading-none">+ Bonus</span>
            <span className="font-card text-base font-bold opacity-80">Adds points</span>
          </button>
          <button
            type="button"
            aria-pressed={!bonus}
            onClick={() => setKind('deduct')}
            className={`rounded-xl px-4 py-4 text-left ring-1 transition ${!bonus ? 'bg-[#ef6461] text-dugout ring-[#ef6461]' : 'bg-dugout/60 ring-chalk/20 hover:ring-chalk/50'}`}
          >
            <span className="block font-stadium text-4xl font-extrabold leading-none">− Deduct</span>
            <span className="font-card text-base font-bold opacity-80">Takes points off and lowers BEH</span>
          </button>
        </div>
      </Panel>

      <AdjustFields key={state?.savedAt ?? 0} kids={kids} defaultDate={defaultDate} kind={kind} />

      <div className="flex flex-wrap items-center gap-4">
        <button disabled={pending} className={buttonPrimary}>
          {pending ? 'Saving…' : bonus ? 'Give bonus' : 'Deduct points'}
        </button>
        {state && <div className="flex-1"><Notice ok={state.ok}>{state.message}</Notice></div>}
      </div>
    </form>
  );
}
