"use client";

import type { DefenseStatus } from "@/lib/api";

export default function DefenseToggle({
  status,
  onToggle,
  pending,
}: {
  status: DefenseStatus | null;
  onToggle: (enabled: boolean) => void;
  pending: boolean;
}) {
  const enabled = status?.enabled ?? true;

  return (
    <div className="flex items-center gap-4 rounded-xl bg-surface px-5 py-4 shadow-card">
      <div>
        <p className="text-sm font-medium text-ink-secondary">Rate limiting</p>
        <p className="text-xs text-ink-muted">
          {status ? `${status.maxAttempts} tentativas / ${status.windowSeconds}s` : "carregando..."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={pending || !status}
        onClick={() => onToggle(!enabled)}
        className={`ml-auto inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors disabled:opacity-50 ${
          enabled ? "bg-status-good" : "bg-ink-muted"
        }`}
      >
        <span
          className={`h-6 w-6 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      <span className="w-14 text-xs font-medium text-ink-secondary">
        {enabled ? "ativa" : "desligada"}
      </span>
    </div>
  );
}
