"""Estruturas de dados usadas para medir e reportar um ataque."""

from dataclasses import dataclass, field
from enum import Enum


class StatusTentativa(str, Enum):
    SUCESSO = "SUCESSO"
    FALHA = "FALHA"
    BLOQUEADO = "BLOQUEADO"
    ERRO = "ERRO"


@dataclass
class Tentativa:
    indice: int
    senha: str
    status: StatusTentativa
    tempo_resposta: float
    timestamp: str


@dataclass
class ResultadoCenario:
    nome: str
    defesa_ativa: bool
    usuario: str
    tentativas: list[Tentativa] = field(default_factory=list)
    tempo_total: float = 0.0
    desfecho: str = "esgotado"  # "sucesso" | "bloqueado" | "esgotado"
    senha_encontrada: str | None = None

    @property
    def total_tentativas(self) -> int:
        return len(self.tentativas)

    @property
    def taxa_sucesso(self) -> float:
        if not self.tentativas:
            return 0.0
        sucessos = sum(1 for t in self.tentativas if t.status == StatusTentativa.SUCESSO)
        return sucessos / len(self.tentativas)
