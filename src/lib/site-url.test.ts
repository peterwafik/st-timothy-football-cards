import { expect, test } from 'vitest';
import { isLocalUrl, siteBaseUrl } from './site-url';

test('missing site URL falls back to localhost and is flagged as local', () => {
  expect(siteBaseUrl(undefined)).toBe('http://localhost:3000');
  expect(isLocalUrl(siteBaseUrl(undefined))).toBe(true);
  expect(isLocalUrl(siteBaseUrl(''))).toBe(true);
});

test('real domains are not local and lose a trailing slash', () => {
  expect(siteBaseUrl('https://st-timothy.vercel.app/')).toBe('https://st-timothy.vercel.app');
  expect(isLocalUrl('https://st-timothy.vercel.app/card/abc')).toBe(false);
  expect(isLocalUrl('http://127.0.0.1:3000/card/abc')).toBe(true);
});
