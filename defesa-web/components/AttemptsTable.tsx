import type { TentativaLogin } from "@/lib/api";
import StatusBadge from "./StatusBadge";

function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour12: false });
}

export default function AttemptsTable({ tentativas }: { tentativas: TentativaLogin[] }) {
  return (
    <div className="rounded-xl bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-ink-primary/5 px-5 py-4">
        <p className="text-sm font-medium text-ink-secondary">Tentativas recentes</p>
        <span className="text-xs text-ink-muted">{tentativas.length} registros</span>
      </div>
      <div className="max-h-[420px] overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-surface text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-5 py-2 font-medium">Horario</th>
              <th className="px-5 py-2 font-medium">Usuario</th>
              <th className="px-5 py-2 font-medium">IP</th>
              <th className="px-5 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {tentativas.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-ink-muted">
                  Nenhuma tentativa registrada ainda.
                </td>
              </tr>
            )}
            {tentativas.map((t) => (
              <tr key={t.id} className="border-t border-ink-primary/5 hover:bg-page/60">
                <td className="px-5 py-2 tabular-nums text-ink-secondary">{formatarHora(t.timestamp)}</td>
                <td className="px-5 py-2 font-medium text-ink-primary">{t.username}</td>
                <td className="px-5 py-2 tabular-nums text-ink-secondary">{t.ip}</td>
                <td className="px-5 py-2">
                  <StatusBadge status={t.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
