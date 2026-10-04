import { requireTeacher } from '@/lib/auth';
import { qrDataUrl } from '@/lib/qr';

export const dynamic = 'force-dynamic';

export default async function QrSheet() {
  const { supabase } = await requireTeacher();
  const { data: kids } = await supabase.from('kids').select('id, name, public_code').eq('active', true).order('name');
  const items = await Promise.all((kids ?? []).map(async (k) => ({ ...k, qr: await qrDataUrl(k.public_code) })));
  const isLocal = (process.env.NEXT_PUBLIC_SITE_URL ?? '').includes('localhost');
  return (
    <div>
      {isLocal && (
        <p className="mb-4 rounded bg-yellow-200 p-3 text-black print:hidden">
          These QR codes point to localhost and won&apos;t open on phones. Set NEXT_PUBLIC_SITE_URL to the Vercel address before printing.
        </p>
      )}
      <p className="mb-4 print:hidden">Use your browser&apos;s Print (Ctrl+P) — 12 cards per A4 page.</p>
      <div className="grid grid-cols-3 gap-4 bg-white p-4 text-black print:gap-2 print:p-0">
        {items.map((k) => (
          <div key={k.id} className="flex break-inside-avoid flex-col items-center gap-1 rounded border border-gray-300 p-2">
            <img src={k.qr} alt="" className="h-36 w-36" />
            <span className="font-card text-lg font-bold uppercase">{k.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
