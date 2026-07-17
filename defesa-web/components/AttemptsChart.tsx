const LINHAS: { chave: "SUCESSO" | "FALHA" | "BLOQUEADO"; rotulo: string; cor: string }[] = [
  { chave: "SUCESSO", rotulo: "Sucesso", cor: "bg-status-good" },
  { chave: "FALHA", rotulo: "Falha", cor: "bg-status-warning" },
  { chave: "BLOQUEADO", rotulo: "Bloqueado", cor: "bg-status-critical" },
];

export default function AttemptsChart({ contagens }: { contagens: Record<string, number> }) {
  const maior = Math.max(1, ...LINHAS.map((l) => contagens[l.chave] ?? 0));

  return (
    <div className="rounded-xl bg-surface p-5 shadow-card">
      <p className="text-sm font-medium text-ink-secondary">Tentativas por status</p>
      <div className="mt-4 space-y-3">
        {LINHAS.map((linha) => {
          const valor = contagens[linha.chave] ?? 0;
          const largura = Math.max(2, (valor / maior) * 100);
          return (
            <div key={linha.chave} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs text-ink-secondary">{linha.rotulo}</span>
              <div className="h-3 flex-1 rounded-full bg-page">
                <div
                  className={`h-3 rounded-full ${linha.cor} transition-all duration-500`}
                  style={{ width: `${largura}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-xs font-medium tabular-nums text-ink-primary">
                {valor}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
