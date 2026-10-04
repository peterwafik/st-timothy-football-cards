'use client';
import { useState, useTransition } from 'react';

// Two-tap confirm without browser dialogs. If the action returns a message, it failed: show it.
export function ConfirmButton({
  action,
  label,
  confirmLabel,
}: {
  action: () => Promise<string | void>;
  label: string;
  confirmLabel: string;
}) {
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function confirm() {
    setError(null);
    start(async () => {
      const failure = await action();
      if (failure) setError(failure);
    });
  }

  if (!armed) {
    return <button type="button" onClick={() => setArmed(true)} className="text-sm text-red-300 underline">{label}</button>;
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={pending} onClick={confirm} className="rounded bg-red-600 px-2 py-1 text-sm font-bold">
        {pending ? '…' : confirmLabel}
      </button>
      <button type="button" onClick={() => setArmed(false)} className="text-sm underline">Cancel</button>
      {error && <span role="alert" className="text-sm text-red-300">{error}</span>}
    </span>
  );
}
