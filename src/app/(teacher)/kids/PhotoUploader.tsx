'use client';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('resize failed'))), type, quality),
  );
}

// Re-encoding through a canvas also strips EXIF/GPS data from phone photos.
async function resize(file: File, max = 800): Promise<{ png: Blob; jpeg: Blob }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  // PNG feeds the background remover; the uncut original is stored as a much smaller JPEG.
  return { png: await toBlob(canvas, 'image/png'), jpeg: await toBlob(canvas, 'image/jpeg', 0.88) };
}

// Object URL for a preview, released when the blob changes or the component unmounts.
function usePreviewUrl(blob: Blob | null): string | null {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  return url;
}

export function PhotoUploader({ initialUrl }: { initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl ?? '');
  const [original, setOriginal] = useState<Blob | null>(null);
  const [cutout, setCutout] = useState<Blob | null>(null);
  const [status, setStatus] = useState('');
  const originalPreview = usePreviewUrl(original);
  const cutoutPreview = usePreviewUrl(cutout);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setCutout(null);
    setStatus('Resizing…');
    try {
      const { png, jpeg } = await resize(file);
      setOriginal(jpeg);
      setStatus('Removing background (the first time can take up to a minute)…');
      const { removeBackground } = await import('@imgly/background-removal');
      setCutout(await removeBackground(png));
      setStatus('Choose which photo to use.');
    } catch {
      setStatus('Background removal failed — you can use the original photo.');
    }
  }

  async function upload(blob: Blob) {
    setStatus('Uploading…');
    const isJpeg = blob.type === 'image/jpeg';
    const path = `${crypto.randomUUID()}.${isJpeg ? 'jpg' : 'png'}`;
    const supabase = createClient();
    const { error } = await supabase.storage.from('photos').upload(path, blob, { contentType: isJpeg ? 'image/jpeg' : 'image/png' });
    if (error) { setStatus('Upload failed. Try again.'); return; }
    setUrl(supabase.storage.from('photos').getPublicUrl(path).data.publicUrl);
    setOriginal(null);
    setCutout(null);
    setStatus('Photo ready — press Save to keep it.');
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="photo_url" value={url} />
      {url && <img src={url} alt="Current photo" className="h-32 w-32 rounded-lg bg-white/10 object-cover object-top" />}
      <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
      {(original || cutout) && (
        <div className="flex gap-3">
          {cutout && (
            <button type="button" onClick={() => upload(cutout)} className="flex flex-col items-center gap-1">
              <img src={cutoutPreview ?? undefined} alt="Cutout" className="h-32 w-32 rounded-lg bg-white/10 object-contain" />
              <span className="text-sm underline">Use cutout</span>
            </button>
          )}
          {original && (
            <button type="button" onClick={() => upload(original)} className="flex flex-col items-center gap-1">
              <img src={originalPreview ?? undefined} alt="Original" className="h-32 w-32 rounded-lg object-cover" />
              <span className="text-sm underline">Use original</span>
            </button>
          )}
        </div>
      )}
      {status && <p className="text-sm text-white/70">{status}</p>}
    </div>
  );
}
