const kids = (n: number) => `${n} kid${n === 1 ? '' : 's'}`;

export function summarizeInsert(requested: number, inserted: number) {
  const skipped = requested - inserted;
  const message =
    inserted === 0
      ? `Nothing new — ${skipped} already logged this week.`
      : `Saved ${kids(inserted)}.${skipped ? ` ${skipped} already logged this week.` : ''}`;
  return { inserted, skipped, message };
}
