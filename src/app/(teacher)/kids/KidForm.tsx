'use client';
import { useActionState } from 'react';
import { buttonPrimary, field, Label, Notice, Panel } from '@/components/staff/ui';
import { useFormSubmit } from '@/components/useFormSubmit';
import type { KidFields } from '@/lib/kid-form';
import { saveKid } from './actions';
import { PhotoUploader } from './PhotoUploader';
import { ClubPicker, FlagPicker, PositionPicker } from './Pickers';

export function KidForm({ id, initial }: { id: string | null; initial: KidFields }) {
  const [error, action, pending] = useActionState(saveKid.bind(null, id), null);
  const onSubmit = useFormSubmit(action);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <Panel title="Player">
        <div className="flex flex-col gap-5">
          <Label text="Name">
            <input name="name" required defaultValue={initial.name} className={field} />
          </Label>
          <div className="flex flex-col gap-1.5">
            <span className="font-card text-base font-bold text-chalk/90">Photo</span>
            <PhotoUploader initialUrl={initial.photo_url} />
          </div>
        </div>
      </Panel>

      <Panel title="On the card">
        <div className="flex flex-col gap-5">
          <PositionPicker initial={initial.position} />
          <FlagPicker initial={initial.flag} />
          <ClubPicker initial={initial.club} />
        </div>
      </Panel>

      <Panel title="In the squad">
        <div className="grid gap-5 sm:grid-cols-2">
          <Label text="Social Skills (SSK)" hint="0–99, rated by the teachers. Leave empty until rated.">
            <input name="ssk" type="number" min={0} max={99} defaultValue={initial.ssk ?? ''} className={field} />
          </Label>
          <Label text="Joined on" hint="Weeks before this don't count against the kid.">
            <input name="joined_on" type="date" required defaultValue={initial.joined_on} className={field} />
          </Label>
        </div>
        <label className="mt-5 flex items-center gap-3 font-card text-lg font-bold">
          <input name="active" type="checkbox" defaultChecked={initial.active} className="h-6 w-6 accent-[var(--color-trophy)]" />
          Active in the class
        </label>
      </Panel>

      <div className="flex flex-wrap items-center gap-4">
        <button disabled={pending} className={buttonPrimary}>{pending ? 'Saving…' : id ? 'Save changes' : 'Add kid'}</button>
        {error && <div className="flex-1"><Notice ok={false}>{error}</Notice></div>}
      </div>
    </form>
  );
}
