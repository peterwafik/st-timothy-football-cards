import { expect, test } from 'vitest';
import { ensureTeacherAccount, type TeacherAccountDeps } from './teacher-accounts';

type Row = { user_id: string; name: string; role: string };

function fakeDeps(existing: { id: string; email: string }[] = [], upsertError: string | null = null) {
  const users = [...existing];
  const teachers: Row[] = [];
  const passwords = new Map<string, string>();
  const deps: TeacherAccountDeps = {
    auth: {
      async createUser({ email, password }) {
        if (users.some((u) => u.email === email)) {
          return { data: { user: null }, error: { message: 'A user with this email address has already been registered', code: 'email_exists' } };
        }
        const user = { id: `u${users.length + 1}`, email };
        users.push(user);
        passwords.set(user.id, password);
        return { data: { user }, error: null };
      },
      async listUsers({ page, perPage }) {
        return { data: { users: users.slice((page - 1) * perPage, page * perPage) }, error: null };
      },
      async updateUserById(id, { password }) {
        passwords.set(id, password);
        return { error: null };
      },
    },
    async upsertTeacher(row) {
      if (upsertError) return { error: { message: upsertError } };
      teachers.push(row);
      return { error: null };
    },
  };
  return { deps, users, teachers, passwords };
}

const input = { name: 'Mina', email: 'mina@example.com', password: 'temp-pass-1', role: 'teacher' as const };

test('creates a new account and teacher row', async () => {
  const f = fakeDeps();
  expect(await ensureTeacherAccount(f.deps, input)).toEqual({ ok: true, existed: false });
  expect(f.teachers).toEqual([{ user_id: 'u1', name: 'Mina', role: 'teacher' }]);
});

test('re-adding a removed teacher reuses the existing login and resets the password', async () => {
  const f = fakeDeps([{ id: 'old-id', email: 'mina@example.com' }]);
  expect(await ensureTeacherAccount(f.deps, input)).toEqual({ ok: true, existed: true });
  expect(f.teachers).toEqual([{ user_id: 'old-id', name: 'Mina', role: 'teacher' }]);
  expect(f.passwords.get('old-id')).toBe('temp-pass-1');
});

test('email matching ignores case', async () => {
  const f = fakeDeps([{ id: 'old-id', email: 'mina@example.com' }]);
  const r = await ensureTeacherAccount(f.deps, { ...input, email: 'Mina@Example.com' });
  expect(r).toEqual({ ok: true, existed: true });
});

test('a failed teacher insert is reported, not hidden', async () => {
  const f = fakeDeps([], 'db down');
  expect(await ensureTeacherAccount(f.deps, input)).toEqual({ ok: false, error: 'Login created but could not add as teacher: db down' });
});
