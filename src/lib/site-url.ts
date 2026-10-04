const FALLBACK = 'http://localhost:3000';

export function siteBaseUrl(configured: string | undefined = process.env.NEXT_PUBLIC_SITE_URL): string {
  return (configured || FALLBACK).replace(/\/$/, '');
}

export function isLocalUrl(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(url);
}
