import type { Tentativa } from "@/lib/api";

const ETIQUETA: Record<Tentativa["status"], { texto: string; cor: string }> = {
  SUCESSO: { texto: "[ OK ]", cor: "text-term-green terminal-glow" },
  FALHA: { texto: "[FAIL]", cor: "text-term-amber" },
  BLOQUEADO: { texto: "[BLOCK]", cor: "text-term-red terminal-glow" },
  ERRO: { texto: "[ERR ]", cor: "text-term-red" },
};

export default function LinhaTentativa({ tentativa }: { tentativa: Tentativa }) {
  const etiqueta = ETIQUETA[tentativa.status];
  const hora = new Date(tentativa.timestamp).toLocaleTimeString("pt-BR", { hour12: false });

  return (
    <div className="whitespace-pre text-sm leading-relaxed">
      <span className="text-term-green-dim">{hora}</span>{" "}
      <span className="text-term-green-dim">tentativa {String(tentativa.indice).padStart(2, "0")}</span>{" "}
      <span className={etiqueta.cor}>{etiqueta.texto}</span>{" "}
      <span className="text-term-green-dim">senha=</span>
      <span className="text-term-cyan">&quot;{tentativa.senha}&quot;</span>{" "}
      <span className="text-term-green-dim">({tentativa.tempo_resposta.toFixed(3)}s)</span>
    </div>
  );
}
