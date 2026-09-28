const MONEY = /R\$\s*[-−+]?\s*(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{2})?/g;

export function SensitiveText({ value }: { value: string }) {
  const parts: React.ReactNode[] = [];
  let previous = 0;
  let index = 0;
  for (const match of value.matchAll(MONEY)) {
    const start = match.index ?? 0;
    if (start > previous) parts.push(value.slice(previous, start));
    parts.push(<span key={index++} data-sensitive="true">{match[0]}</span>);
    previous = start + match[0].length;
  }
  if (previous < value.length) parts.push(value.slice(previous));
  return <>{parts}</>;
}
