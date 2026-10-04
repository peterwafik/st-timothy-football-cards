'use client';
import { useActionState } from 'react';
import { signIn } from './actions';

export function LoginForm({ initialError }: { initialError: string | null }) {
  const [error, action, pending] = useActionState(signIn, initialError);
  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-3">
      <input name="email" type="email" autoComplete="email" placeholder="Email" required className="rounded-lg bg-white px-4 py-3 text-black" />
      <input name="password" type="password" autoComplete="current-password" placeholder="Password" required className="rounded-lg bg-white px-4 py-3 text-black" />
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <button disabled={pending} className="rounded-lg bg-gold py-3 font-card text-xl font-bold uppercase text-pitch disabled:opacity-60">
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
