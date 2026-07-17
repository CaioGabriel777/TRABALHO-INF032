"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DefenseStatus,
  TentativaLogin,
  fetchDefenseStatus,
  fetchLogs,
  setDefenseEnabled,
} from "@/lib/api";
import StatCard from "@/components/StatCard";
import AttemptsChart from "@/components/AttemptsChart";
import AttemptsTable from "@/components/AttemptsTable";
import DefenseToggle from "@/components/DefenseToggle";
import BlockedIpsCard from "@/components/BlockedIpsCard";

const INTERVALO_MS = 4000;

function ipsBloqueadosRecentemente(tentativas: TentativaLogin[]): string[] {
  const ultimoStatusPorIp = new Map<string, string>();
  for (const t of tentativas) {
    if (!ultimoStatusPorIp.has(t.ip)) {
      ultimoStatusPorIp.set(t.ip, t.status);
    }
  }
  return [...ultimoStatusPorIp.entries()]
    .filter(([, status]) => status === "BLOQUEADO")
    .map(([ip]) => ip);
}

export default function DashboardPage() {
  const [tentativas, setTentativas] = useState<TentativaLogin[]>([]);
  const [defesa, setDefesa] = useState<DefenseStatus | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendenteToggle, setPendenteToggle] = useState(false);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);
  const primeiraCarga = useRef(true);

  const carregar = useCallback(async () => {
    try {
      const [logs, status] = await Promise.all([fetchLogs(200), fetchDefenseStatus()]);
      setTentativas(logs);
      setDefesa(status);
      setAtualizadoEm(new Date());
      setErro(null);
    } catch {
      setErro("Nao foi possivel conectar ao defesa-api. Verifique se os containers estao no ar.");
    } finally {
      primeiraCarga.current = false;
    }
  }, []);

  useEffect(() => {
    carregar();
    const id = setInterval(carregar, INTERVALO_MS);
    return () => clearInterval(id);
  }, [carregar]);

  async function alternarDefesa(enabled: boolean) {
    setPendenteToggle(true);
    try {
      const novoStatus = await setDefenseEnabled(enabled);
      setDefesa(novoStatus);
    } finally {
      setPendenteToggle(false);
    }
  }

  const total = tentativas.length;
  const contagens = tentativas.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});
  const sucessos = contagens.SUCESSO ?? 0;
  const taxaSucesso = total > 0 ? ((sucessos / total) * 100).toFixed(1) : "0.0";
  const ipsBloqueados = ipsBloqueadosRecentemente(tentativas);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-primary">Painel de defesa</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Monitoramento das tentativas de login do laboratorio Ataque x Defesa
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span className="h-2 w-2 animate-pulse rounded-full bg-status-good" />
          {atualizadoEm
            ? `atualizado as ${atualizadoEm.toLocaleTimeString("pt-BR", { hour12: false })}`
            : "conectando..."}
        </div>
      </header>

      {erro && (
        <div className="mb-6 rounded-xl bg-status-critical/10 px-5 py-3 text-sm text-status-critical">
          {erro}
        </div>
      )}

      <div className="mb-6">
        <DefenseToggle status={defesa} onToggle={alternarDefesa} pending={pendenteToggle} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total de tentativas" value={String(total)} />
        <StatCard label="Sucessos" value={String(sucessos)} accent="text-status-good" />
        <StatCard label="Falhas" value={String(contagens.FALHA ?? 0)} accent="text-amber-600" />
        <StatCard label="Bloqueadas" value={String(contagens.BLOQUEADO ?? 0)} accent="text-status-critical" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttemptsChart contagens={contagens} />
        </div>
        <BlockedIpsCard ips={ipsBloqueados} />
      </div>

      <AttemptsTable tentativas={tentativas} />

      <p className="mt-6 text-center text-xs text-ink-muted">
        Taxa de sucesso geral: {taxaSucesso}% &middot; atualiza a cada {INTERVALO_MS / 1000}s
      </p>
    </main>
  );
}
