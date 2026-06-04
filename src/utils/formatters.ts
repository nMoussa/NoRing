export function formatTimestamp(
  ts: number | null | string,
  neverLabel: string,
): string {
  if (ts == null) return neverLabel;
  const ms = typeof ts === 'string' ? parseFloat(ts) * 1000 : ts;
  return new Date(ms).toLocaleString();
}

export function statusCheckLabel(
  ok: boolean,
  okText: string,
  rawValue: string,
): string {
  return ok ? `✓ ${okText}` : `✗ ${rawValue}`;
}
