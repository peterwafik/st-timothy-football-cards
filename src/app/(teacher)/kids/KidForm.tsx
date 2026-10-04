'use client';
import { useActionState } from 'react';
import { useFormSubmit } from '@/components/useFormSubmit';
import type { KidFields } from '@/lib/kid-form';
import { saveKid } from './actions';
import { PhotoUploader } from './PhotoUploader';
import { ClubPicker, FlagPicker, PositionPicker } from './Pickers';

const field = 'rounded-lg bg-white px-3 py-2 text-black';

export function KidForm({ id, initial }: { id: string | null; initial: KidFields }) {
  const [error, action, pending] = useActionState(saveKid.bind(null, id), null);
  const onSubmit = useFormSubmit(action);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">Name
        <input name="name" required defaultValue={initial.name} className={field} />
      </label>
      <PhotoUploader initialUrl={initial.photo_url} />
      <PositionPicker initial={initial.position} />
      <FlagPicker initial={initial.flag} />
      <ClubPicker initial={initial.club} />
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">SSK (Social Skills 0–99, blank = not rated)
          <input name="ssk" type="number" min={0} max={99} defaultValue={initial.ssk ?? ''} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-sm">Joined on
          <input name="joined_on" type="date" required defaultValue={initial.joined_on} className={field} />
        </label>
      </div>
      <label className="flex items-center gap-2"><input name="active" type="checkbox" defaultChecked={initial.active} /> Active in class</label>
      {error && <p role="alert" className="text-red-300">{error}</p>}
      <button disabled={pending} className="rounded-lg bg-gold py-3 font-card text-xl font-bold uppercase text-pitch disabled:opacity-60">
        {pending ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
