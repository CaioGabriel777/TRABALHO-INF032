"use client";

import { useEffect, useRef, useState } from "react";
import { Execucao, Modo, buscarExecucao, iniciarAtaque } from "@/lib/api";
import LinhaTentativa from "@/components/LinhaTentativa";

const INTERVALO_POLL_MS = 500;

function linhaResumo(execucao: Execucao): { texto: string; cor: string } {
  if (execucao.status === "erro") {
    return { texto: `=== erro: ${execucao.erro} ===`, cor: "text-term-red" };
  }
  if (execucao.desfecho === "sucesso") {
    return {
      texto: `=== senha encontrada: "${execucao.senha_encontrada}" em ${execucao.tentativas.length} tentativas (${execucao.tempo_total?.toFixed(2)}s) ===`,
      cor: "text-term-green terminal-glow",
    };
  }
  if (execucao.desfecho === "bloqueado") {
    return {
      texto: `=== bloqueado pela defesa apos ${execucao.tentativas.length} tentativas (${execucao.tempo_total?.toFixed(2)}s) ===`,
      cor: "text-term-red terminal-glow",
    };
  }
  return {
    texto: `=== wordlist esgotada sem sucesso, ${execucao.tentativas.length} tentativas (${execucao.tempo_total?.toFixed(2)}s) ===`,
    cor: "text-term-amber",
  };
}

export default function Console() {
  const [usuario, setUsuario] = useState("joao.silva");
  const [modo, setModo] = useState<Modo>("sem-defesa");
  const [execucao, setExecucao] = useState<Execucao | null>(null);
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const execucaoId = execucao?.id;
  const status = execucao?.status;
  const executando = status === "executando";

  useEffect(() => {
    if (!execucaoId || status !== "executando") return;
    const intervalId = setInterval(async () => {
      try {
        const atualizada = await buscarExecucao(execucaoId);
        setExecucao(atualizada);
      } catch {
        // ignora falhas transitorias de rede durante o polling
      }
    }, INTERVALO_POLL_MS);
    return () => clearInterval(intervalId);
  }, [execucaoId, status]);

  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight });
  }, [execucao?.tentativas.length]);

  async function disparar() {
    setErroLocal(null);
    try {
      const nova = await iniciarAtaque(usuario, modo, 0.15);
      setExecucao(nova);
    } catch (e) {
      setErroLocal(e instanceof Error ? e.message : "erro desconhecido");
    }
  }

  return (
    <main className="scanlines mx-auto min-h-screen max-w-3xl px-6 py-10">
      <pre className="text-term-green terminal-glow text-xs sm:text-sm">{`
        _
   __ _| |_ __ _  __ _ _   _  ___
  / _\` | __/ _\` |/ _\` | | | |/ _ \\
 | (_| | || (_| | (_| | |_| |  __/
  \\__,_|\\__\\__,_|\\__, |\\__,_|\\___|
                    |_|            -cli`}</pre>

      <p className="mt-2 text-xs text-term-green-dim">
        laboratorio educacional &middot; alvo fixo: defesa-api (rede interna do docker-compose)
      </p>

      <div className="mt-6 rounded border border-term-border bg-term-panel p-4">
        <p className="mb-3 text-sm text-term-green-dim">
          $ ataque-cli --usuario <span className="text-term-cyan">{usuario || "?"}</span> --modo{" "}
          <span className="text-term-cyan">{modo}</span>
        </p>

        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-xs text-term-green-dim">
            usuario
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              disabled={executando}
              className="w-40 border-b border-term-border bg-transparent px-1 py-1 text-sm text-term-green outline-none focus:border-term-green disabled:opacity-50"
              spellCheck={false}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-term-green-dim">
            modo
            <select
              value={modo}
              onChange={(e) => setModo(e.target.value as Modo)}
              disabled={executando}
              className="border-b border-term-border bg-term-panel px-1 py-1 text-sm text-term-green outline-none focus:border-term-green disabled:opacity-50"
            >
              <option value="sem-defesa">sem defesa</option>
              <option value="com-defesa">com defesa ativa</option>
            </select>
          </label>

          <button
            type="button"
            onClick={disparar}
            disabled={executando || !usuario}
            className="border border-term-green px-4 py-1.5 text-sm text-term-green transition-colors hover:bg-term-green hover:text-term-bg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-term-green"
          >
            {executando ? "executando..." : "[ executar ataque ]"}
          </button>
        </div>

        {erroLocal && <p className="mt-3 text-sm text-term-red">$ erro: {erroLocal}</p>}
      </div>

      <div
        ref={outputRef}
        className="mt-6 h-96 overflow-y-auto rounded border border-term-border bg-black/40 p-4"
      >
        {!execucao && (
          <p className="text-sm text-term-green-dim">
            aguardando comando... preencha o usuario alvo e clique em executar ataque.
          </p>
        )}

        {execucao?.tentativas.map((t) => (
          <LinhaTentativa key={t.indice} tentativa={t} />
        ))}

        {executando && (
          <span className="cursor-blink text-term-green">_</span>
        )}

        {execucao && execucao.status !== "executando" && (
          <p className={`mt-2 text-sm ${linhaResumo(execucao).cor}`}>{linhaResumo(execucao).texto}</p>
        )}
      </div>
    </main>
  );
}
