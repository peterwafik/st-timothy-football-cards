'use client';
import { toPng } from 'html-to-image';
import { useState } from 'react';

export function DownloadCardButton({ targetId, fileName }: { targetId: string; fileName: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    const node = document.getElementById(targetId);
    if (!node) return;
    setBusy(true);
    setError(null);
    try {
      const url = await toPng(node, { pixelRatio: 3, cacheBust: true });
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
    } catch {
      setError('Could not create the image. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button onClick={download} disabled={busy} className="rounded-full bg-gold px-6 py-3 font-card text-lg font-bold uppercase text-pitch disabled:opacity-60">
        {busy ? 'Preparing…' : 'Download card'}
      </button>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
