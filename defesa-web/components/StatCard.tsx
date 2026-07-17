export default function StatCard({
  label,
  value,
  hint,
  accent = "text-ink-primary",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl bg-surface p-5 shadow-card">
      <p className="text-sm font-medium text-ink-secondary">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${accent}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
