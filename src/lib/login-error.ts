type AuthError = { status?: number; code?: string; message: string };

export function loginErrorMessage(error: AuthError): string {
  if (error.code === 'invalid_credentials' || error.status === 400) return 'Wrong email or password.';
  return "Can't reach the database right now. Check the internet connection and try again.";
}
