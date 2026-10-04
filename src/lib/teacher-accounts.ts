type AuthError = { message: string; code?: string } | null;

export interface TeacherAccountDeps {
  auth: {
    createUser(args: { email: string; password: string; email_confirm: boolean }): Promise<{ data: { user: { id: string } | null }; error: AuthError }>;
    listUsers(args: { page: number; perPage: number }): Promise<{ data: { users: { id: string; email?: string }[] }; error: AuthError }>;
    updateUserById(id: string, attrs: { password: string }): Promise<{ error: AuthError }>;
  };
  upsertTeacher(row: { user_id: string; name: string; role: 'teacher' | 'admin' }): Promise<{ error: { message: string } | null }>;
}

export type TeacherAccountResult = { ok: true; existed: boolean } | { ok: false; error: string };

const PAGE_SIZE = 1000;

async function findUserByEmail(auth: TeacherAccountDeps['auth'], email: string): Promise<string | null> {
  for (let page = 1; ; page++) {
    const { data, error } = await auth.listUsers({ page, perPage: PAGE_SIZE });
    if (error) return null;
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match.id;
    if (data.users.length < PAGE_SIZE) return null;
  }
}

// Creates a login for a teacher, or reuses an existing one (e.g. a teacher who was removed and is
// being added back) and resets its password to the new temporary one.
export async function ensureTeacherAccount(
  deps: TeacherAccountDeps,
  input: { name: string; email: string; password: string; role: 'teacher' | 'admin' },
): Promise<TeacherAccountResult> {
  const email = input.email.trim().toLowerCase();
  const created = await deps.auth.createUser({ email, password: input.password, email_confirm: true });

  let userId = created.data.user?.id ?? null;
  const existed = !userId;
  if (!userId) {
    const alreadyExists = created.error?.code === 'email_exists' || /already/i.test(created.error?.message ?? '');
    if (!alreadyExists) return { ok: false, error: `Could not create user: ${created.error?.message ?? 'unknown error'}` };
    userId = await findUserByEmail(deps.auth, email);
    if (!userId) return { ok: false, error: 'This email already has an account but it could not be found.' };
    const { error } = await deps.auth.updateUserById(userId, { password: input.password });
    if (error) return { ok: false, error: `Could not reset password: ${error.message}` };
  }

  const { error } = await deps.upsertTeacher({ user_id: userId, name: input.name, role: input.role });
  if (error) return { ok: false, error: `Login created but could not add as servant: ${error.message}` };
  return { ok: true, existed };
}
