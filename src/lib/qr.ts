import 'server-only';
import QRCode from 'qrcode';
import { siteBaseUrl } from './site-url';

export function cardUrl(code: string): string {
  return `${siteBaseUrl()}/card/${code}`;
}

export function qrDataUrl(code: string): Promise<string> {
  return QRCode.toDataURL(cardUrl(code), { margin: 1, width: 300, errorCorrectionLevel: 'M' });
}
