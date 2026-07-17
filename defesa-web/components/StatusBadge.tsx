import type { StatusTentativa } from "@/lib/api";

const ESTILOS: Record<StatusTentativa, { bg: string; text: string; label: string }> = {
  SUCESSO: { bg: "bg-status-good/10", text: "text-status-good", label: "sucesso" },
  FALHA: { bg: "bg-status-warning/15", text: "text-amber-700", label: "falha" },
  BLOQUEADO: { bg: "bg-status-critical/10", text: "text-status-critical", label: "bloqueado" },
};

export default function StatusBadge({ status }: { status: StatusTentativa }) {
  const estilo = ESTILOS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${estilo.bg} ${estilo.text}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {estilo.label}
    </span>
  );
}
