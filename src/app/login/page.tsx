import { isSupabaseConfigured, NOT_CONFIGURED_MESSAGE } from '@/lib/supabase/config';
import { LoginForm } from './LoginForm';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const initial = !isSupabaseConfigured()
    ? NOT_CONFIGURED_MESSAGE
    : error === 'not-teacher'
      ? 'This account is not a teacher. Ask the admin to add you.'
      : null;
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <h1 className="font-card text-4xl font-bold uppercase text-gold">Leaders Login</h1>
      <LoginForm initialError={initial} />
    </main>
  );
}
