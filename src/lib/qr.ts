import 'server-only';
import QRCode from 'qrcode';

export function cardUrl(code: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/card/${code}`;
}

export function qrDataUrl(code: string): Promise<string> {
  return QRCode.toDataURL(cardUrl(code), { margin: 1, width: 300, errorCorrectionLevel: 'M' });
}
