import { expect, test } from 'vitest';
import { loginErrorMessage } from './login-error';

test('wrong credentials say so', () => {
  expect(loginErrorMessage({ status: 400, code: 'invalid_credentials', message: 'Invalid login credentials' })).toBe('Wrong email or password.');
});

test('network or server problems are not blamed on the password', () => {
  expect(loginErrorMessage({ status: 0, message: 'fetch failed' })).toBe("Can't reach the database right now. Check the internet connection and try again.");
  expect(loginErrorMessage({ status: 500, message: 'oops' })).toBe("Can't reach the database right now. Check the internet connection and try again.");
});
