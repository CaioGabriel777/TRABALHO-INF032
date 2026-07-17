"""
Guarda de seguranca do laboratorio.

Este script de ataque e estritamente educacional e so pode mirar no
defesa-api rodando dentro da rede interna do docker-compose deste projeto.
Qualquer outro host (IP ou dominio externo/arbitrario) e recusado antes de
qualquer requisicao ser enviada.
"""

from urllib.parse import urlparse

ALVOS_PERMITIDOS = {"defesa-api", "localhost", "127.0.0.1"}


class AlvoNaoPermitidoError(ValueError):
    pass


def validar_alvo(url: str) -> None:
    host = urlparse(url).hostname
    if host is None or host.lower() not in ALVOS_PERMITIDOS:
        raise AlvoNaoPermitidoError(
            f"Alvo '{url}' nao e permitido. Este script e um laboratorio "
            f"educacional e so pode atacar o defesa-api dentro da rede do "
            f"docker-compose deste projeto (hosts permitidos: "
            f"{', '.join(sorted(ALVOS_PERMITIDOS))})."
        )
