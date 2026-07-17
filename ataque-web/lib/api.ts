export type StatusTentativa = "SUCESSO" | "FALHA" | "BLOQUEADO" | "ERRO";
export type Modo = "sem-defesa" | "com-defesa";

export interface Tentativa {
  indice: number;
  senha: string;
  status: StatusTentativa;
  tempo_resposta: number;
  timestamp: string;
}

export interface Execucao {
  id: string;
  status: "executando" | "concluido" | "erro";
  usuario: string;
  modo: Modo;
  tentativas: Tentativa[];
  desfecho: "sucesso" | "bloqueado" | "esgotado" | null;
  tempo_total: number | null;
  senha_encontrada: string | null;
  erro: string | null;
}

// Roda no navegador do usuario: precisa da porta publicada do ataque-api no
// host, nao do hostname interno do docker-compose.
const ATTACK_API_URL = process.env.NEXT_PUBLIC_ATTACK_API_URL ?? "http://localhost:9000";

export async function iniciarAtaque(usuario: string, modo: Modo, delay: number): Promise<Execucao> {
  const resp = await fetch(`${ATTACK_API_URL}/ataques`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, modo, delay }),
  });
  if (!resp.ok) {
    const corpo = await resp.json().catch(() => ({}));
    throw new Error(corpo.detail ?? `POST /ataques -> ${resp.status}`);
  }
  return resp.json();
}

export async function buscarExecucao(id: string): Promise<Execucao> {
  const resp = await fetch(`${ATTACK_API_URL}/ataques/${id}`, { cache: "no-store" });
  if (!resp.ok) {
    throw new Error(`GET /ataques/${id} -> ${resp.status}`);
  }
  return resp.json();
}
