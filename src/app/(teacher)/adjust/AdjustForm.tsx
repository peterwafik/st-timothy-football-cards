'use client';
import { useActionState, useEffect, useRef } from 'react';
import { useFormSubmit } from '@/components/useFormSubmit';
import { addAdjustment } from './actions';

const field = 'rounded-lg bg-white px-3 py-2 text-black';

export function AdjustForm({ kids, defaultDate }: { kids: { id: string; name: string }[]; defaultDate: string }) {
  const [state, action, pending] = useActionState(addAdjustment, null);
  const onSubmit = useFormSubmit(action);
  const form = useRef<HTMLFormElement>(null);
  // Clear the form after a successful save; keep the typing after an error.
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);
  return (
    <form ref={form} onSubmit={onSubmit} className="flex flex-col gap-3">
      <h1 className="font-card text-3xl font-bold uppercase">Bonus / Deduct</h1>
      <select name="kid_id" required className={field} defaultValue="">
        <option value="" disabled>Choose kid…</option>
        {kids.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
      </select>
      <div className="flex gap-4">
        <label className="flex items-center gap-2"><input type="radio" name="kind" value="bonus" defaultChecked /> Bonus</label>
        <label className="flex items-center gap-2"><input type="radio" name="kind" value="deduct" /> Deduct</label>
      </div>
      <input name="points" type="number" min={1} max={10000} required placeholder="Points" className={field} />
      <input name="reason" required placeholder="Reason (e.g. helped clean the class)" className={field} />
      <input name="date" type="date" required defaultValue={defaultDate} className={field} />
      {state && <p role="status" className={state.ok ? 'text-green-300' : 'text-red-300'}>{state.message}</p>}
      <button disabled={pending} className="rounded-lg bg-gold py-3 font-card text-xl font-bold uppercase text-pitch disabled:opacity-60">
        {pending ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
