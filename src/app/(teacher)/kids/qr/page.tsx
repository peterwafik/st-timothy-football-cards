import Link from 'next/link';
import { buttonGhost, Notice, PageHeader } from '@/components/staff/ui';
import { requireTeacher } from '@/lib/auth';
import { chunk } from '@/lib/chunk';
import { cardUrl, qrDataUrl } from '@/lib/qr';
import { isLocalUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

const PER_PAGE = 12;

export default async function QrSheet() {
  const { supabase } = await requireTeacher();
  const { data: kids } = await supabase.from('kids').select('id, name, public_code').eq('active', true).order('name');
  const items = await Promise.all((kids ?? []).map(async (k) => ({ ...k, qr: await qrDataUrl(k.public_code) })));
  const isLocal = isLocalUrl(cardUrl('x'));
  return (
    <div>
      <div className="print:hidden">
        <PageHeader title="QR codes" subtitle="Press Ctrl+P (or Share → Print on a phone). Each A4 page holds 12 codes to cut out.">
          <Link href="/kids" className={buttonGhost}>All kids</Link>
        </PageHeader>
        {isLocal && (
          <div className="mb-6">
            <Notice ok={false}>
              These codes point to this computer (localhost), so they won&apos;t open on phones. Put the site online and set
              NEXT_PUBLIC_SITE_URL to its address before printing.
            </Notice>
          </div>
        )}
      </div>
      {chunk(items, PER_PAGE).map((page, i) => (
        // One A4 sheet: 3 columns x 4 rows, then a page break.
        <div key={i} className="mb-4 grid grid-cols-3 gap-4 rounded-2xl bg-white p-4 text-black break-after-page print:rounded-none print:mb-0 print:h-[277mm] print:grid-rows-4 print:gap-2 print:p-0">
          {page.map((k) => (
            <div key={k.id} className="flex break-inside-avoid flex-col items-center justify-center gap-1 rounded border border-gray-300 p-2">
              <img src={k.qr} alt="" className="h-36 w-36" />
              <span className="font-card text-lg font-bold uppercase">{k.name}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
