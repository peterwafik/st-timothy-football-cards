'use client';
import { useActionState } from 'react';
import { buttonPrimary, field, Notice } from '@/components/staff/ui';
import { useFormSubmit } from '@/components/useFormSubmit';
import { signIn } from './actions';

export function LoginForm({ initialError }: { initialError: string | null }) {
  const [error, action, pending] = useActionState(signIn, initialError);
  const onSubmit = useFormSubmit(action);
  return (
    <form
      onSubmit={onSubmit}
      className="relative flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-dugout/90 p-6 shadow-2xl ring-1 ring-chalk/15 backdrop-blur"
    >
      <input name="email" type="email" autoComplete="email" placeholder="Email" aria-label="Email" required className={field} />
      <input name="password" type="password" autoComplete="current-password" placeholder="Password" aria-label="Password" required className={field} />
      {error && <Notice ok={false}>{error}</Notice>}
      <button disabled={pending} className={`${buttonPrimary} mt-2`}>{pending ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}
