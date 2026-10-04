const kids = (n: number) => `${n} kid${n === 1 ? '' : 's'}`;

export function summarizeInsert(requested: number, inserted: number) {
  const skipped = requested - inserted;
  const message =
    inserted === 0
      ? `Nothing new — ${skipped} already logged.`
      : `Saved ${kids(inserted)}.${skipped ? ` ${skipped} already logged.` : ''}`;
  return { inserted, skipped, message };
}
