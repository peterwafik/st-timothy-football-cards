'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

async function resize(file: File, max = 800): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('resize failed'))), 'image/png'));
}

export function PhotoUploader({ initialUrl }: { initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl ?? '');
  const [original, setOriginal] = useState<Blob | null>(null);
  const [cutout, setCutout] = useState<Blob | null>(null);
  const [status, setStatus] = useState('');

  async function onFile(file: File | undefined) {
    if (!file) return;
    setCutout(null);
    setStatus('Resizing…');
    try {
      const small = await resize(file);
      setOriginal(small);
      setStatus('Removing background (the first time can take up to a minute)…');
      const { removeBackground } = await import('@imgly/background-removal');
      setCutout(await removeBackground(small));
      setStatus('Choose which photo to use.');
    } catch {
      setStatus('Background removal failed — you can use the original photo.');
    }
  }

  async function upload(blob: Blob) {
    setStatus('Uploading…');
    const path = `${crypto.randomUUID()}.png`;
    const supabase = createClient();
    const { error } = await supabase.storage.from('photos').upload(path, blob, { contentType: 'image/png' });
    if (error) { setStatus('Upload failed. Try again.'); return; }
    setUrl(supabase.storage.from('photos').getPublicUrl(path).data.publicUrl);
    setOriginal(null);
    setCutout(null);
    setStatus('Photo ready — press Save to keep it.');
  }

  const preview = (b: Blob) => URL.createObjectURL(b);

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="photo_url" value={url} />
      {url && <img src={url} alt="Current photo" className="h-32 w-32 rounded-lg bg-white/10 object-cover object-top" />}
      <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
      {(original || cutout) && (
        <div className="flex gap-3">
          {cutout && (
            <button type="button" onClick={() => upload(cutout)} className="flex flex-col items-center gap-1">
              <img src={preview(cutout)} alt="Cutout" className="h-32 w-32 rounded-lg bg-white/10 object-contain" />
              <span className="text-sm underline">Use cutout</span>
            </button>
          )}
          {original && (
            <button type="button" onClick={() => upload(original)} className="flex flex-col items-center gap-1">
              <img src={preview(original)} alt="Original" className="h-32 w-32 rounded-lg object-cover" />
              <span className="text-sm underline">Use original</span>
            </button>
          )}
        </div>
      )}
      {status && <p className="text-sm text-white/70">{status}</p>}
    </div>
  );
}
