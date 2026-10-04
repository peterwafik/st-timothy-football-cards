type Page<T> = { data: T[] | null; error: { message: string } | null };

// Reads every row, page by page. Advances by the rows actually returned and stops on an empty page,
// so it stays correct even if the project's "Max rows" setting is lower than pageSize.
export async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<Page<T>>, pageSize = 1000): Promise<T[]> {
  const out: T[] = [];
  for (;;) {
    const { data, error } = await page(out.length, out.length + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return out;
    out.push(...data);
  }
}
