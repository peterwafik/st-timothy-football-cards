'use client';
import { useState, useTransition } from 'react';

export function ConfirmButton({ action, label, confirmLabel }: { action: () => Promise<void>; label: string; confirmLabel: string }) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  if (!armed) {
    return <button type="button" onClick={() => setArmed(true)} className="text-sm text-red-300 underline">{label}</button>;
  }
  return (
    <span className="flex gap-2">
      <button type="button" disabled={pending} onClick={() => start(action)} className="rounded bg-red-600 px-2 py-1 text-sm font-bold">
        {pending ? '…' : confirmLabel}
      </button>
      <button type="button" onClick={() => setArmed(false)} className="text-sm underline">Cancel</button>
    </span>
  );
}
