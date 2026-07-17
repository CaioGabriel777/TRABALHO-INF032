export default function BlockedIpsCard({ ips }: { ips: string[] }) {
  return (
    <div className="rounded-xl bg-surface p-5 shadow-card">
      <p className="text-sm font-medium text-ink-secondary">IPs bloqueados recentemente</p>
      {ips.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">Nenhum IP bloqueado no momento.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {ips.map((ip) => (
            <li
              key={ip}
              className="flex items-center gap-2 rounded-lg bg-status-critical/5 px-3 py-2 text-sm font-medium tabular-nums text-status-critical"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-status-critical" />
              {ip}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
