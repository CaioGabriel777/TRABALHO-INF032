export type StatusTentativa = "SUCESSO" | "FALHA" | "BLOQUEADO";

export interface TentativaLogin {
  id: number;
  username: string;
  ip: string;
  status: StatusTentativa;
  timestamp: string;
}

export interface DefenseStatus {
  enabled: boolean;
  maxAttempts: number;
  windowSeconds: number;
}

// Roda no navegador do usuario: precisa da porta publicada do defesa-api no
// host (docker-compose expoe 8080:8080), nao do hostname interno do compose.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!resp.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} -> ${resp.status}`);
  }
  if (resp.status === 204) {
    return undefined as T;
  }
  return resp.json() as Promise<T>;
}

export function fetchLogs(limit = 200): Promise<TentativaLogin[]> {
  return requestJson<TentativaLogin[]>(`/logs?limit=${limit}`);
}

export function fetchDefenseStatus(): Promise<DefenseStatus> {
  return requestJson<DefenseStatus>("/admin/defense");
}

export function setDefenseEnabled(enabled: boolean): Promise<DefenseStatus> {
  return requestJson<DefenseStatus>("/admin/defense", {
    method: "POST",
    body: JSON.stringify({ enabled }),
  });
}

export function resetDefense(): Promise<void> {
  return requestJson<void>("/admin/defense/reset", { method: "POST" });
}
