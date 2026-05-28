export type DateRangeFilter = {
  from?: string;
  to?: string;
};

export function appendDateRange(
  column: string,
  range: DateRangeFilter | undefined,
  values: unknown[],
): string {
  if (!range?.from && !range?.to) return '';
  const parts: string[] = [];
  if (range.from) {
    values.push(range.from);
    parts.push(`${column} >= $${values.length}::date`);
  }
  if (range.to) {
    values.push(range.to);
    parts.push(`${column} < ($${values.length}::date + INTERVAL '1 day')`);
  }
  return ` AND ${parts.join(' AND ')}`;
}
