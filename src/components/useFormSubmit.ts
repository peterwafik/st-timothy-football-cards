'use client';
import { useTransition, type FormEvent } from 'react';

// Submits a form to a useActionState action without React's automatic form reset,
// so a teacher's typing survives a server-side validation error.
export function useFormSubmit(dispatch: (fd: FormData) => void) {
  const [, startTransition] = useTransition();
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    startTransition(() => dispatch(fd));
  };
}
