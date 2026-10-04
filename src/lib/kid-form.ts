import { clubById } from './clubs';
import { isValidISODate } from './dates';
import { isFlagCode } from './flags';

export interface KidFields {
  name: string; photo_url: string | null; flag: string; club: string;
  ssk: number | null; joined_on: string; active: boolean;
}

const OUR_PHOTOS = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''}/storage/v1/object/public/photos/`;

export function parseKidForm(
  fd: FormData,
  { photoPrefix = OUR_PHOTOS }: { photoPrefix?: string } = {},
): { ok: true; value: KidFields } | { ok: false; error: string } {
  const name = String(fd.get('name') ?? '').trim().replace(/\s+/g, ' ');
  if (!name) return { ok: false, error: 'Name is required.' };
  if (name.length > 40) return { ok: false, error: 'Name is too long (max 40).' };

  const sskRaw = String(fd.get('ssk') ?? '').trim();
  let ssk: number | null = null;
  if (sskRaw !== '') {
    ssk = Number(sskRaw);
    if (!Number.isInteger(ssk) || ssk < 0 || ssk > 99) return { ok: false, error: 'SSK must be 0–99.' };
  }

  const joined_on = String(fd.get('joined_on') ?? '');
  if (!isValidISODate(joined_on)) return { ok: false, error: 'Pick a valid join date.' };

  const flagRaw = String(fd.get('flag') ?? '');
  const clubRaw = String(fd.get('club') ?? '');
  const photo = String(fd.get('photo_url') ?? '').trim();
  // Only photos uploaded to our own storage end up on the public card.
  if (photo && !photo.startsWith(photoPrefix)) return { ok: false, error: 'Use the photo button to add a photo.' };

  return {
    ok: true,
    value: {
      name,
      photo_url: photo || null,
      flag: isFlagCode(flagRaw) ? flagRaw : 'EG',
      club: clubById(clubRaw).id,
      ssk,
      joined_on,
      active: fd.get('active') === 'on',
    },
  };
}
