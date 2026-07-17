"""Loop de forca bruta e orquestracao dos cenarios de comparacao.

O loop "de verdade" vive em executar_ataque_stream, um gerador que produz uma
Tentativa por vez. executar_ataque (usado pelo ataque-cli) e o servidor HTTP
usado pelo ataque-web (servidor.py) consomem o mesmo gerador, entao a logica
de ataque tem uma unica fonte de verdade.
"""

import time
from collections.abc import Iterator
from datetime import datetime, timezone

import requests

from cliente_api import DefesaApiClient
from modelos import ResultadoCenario, StatusTentativa, Tentativa


def carregar_wordlist(caminho: str) -> list[str]:
    senhas = []
    with open(caminho, "r", encoding="utf-8") as arquivo:
        for linha in arquivo:
            linha = linha.strip()
            if not linha or linha.startswith("#"):
                continue
            senhas.append(linha)
    if not senhas:
        raise ValueError(f"Wordlist '{caminho}' esta vazia")
    return senhas


def _mapear_status(status_code: int) -> StatusTentativa:
    if status_code == 200:
        return StatusTentativa.SUCESSO
    if status_code == 401:
        return StatusTentativa.FALHA
    if status_code == 429:
        return StatusTentativa.BLOQUEADO
    return StatusTentativa.ERRO


def executar_ataque_stream(client: DefesaApiClient, usuario: str, senhas: list[str], delay: float) -> Iterator[Tentativa]:
    """Tenta cada senha da wordlist, indo produzindo uma Tentativa por vez.

    Para na primeira SUCESSO ou BLOQUEADO (ou ao esgotar a wordlist).
    """
    for indice, senha in enumerate(senhas, start=1):
        t0 = time.perf_counter()
        try:
            resposta = client.login(usuario, senha)
            status = _mapear_status(resposta.status_code)
        except requests.RequestException:
            status = StatusTentativa.ERRO
        tempo_resposta = time.perf_counter() - t0

        tentativa = Tentativa(
            indice=indice,
            senha=senha,
            status=status,
            tempo_resposta=tempo_resposta,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
        yield tentativa

        if status in (StatusTentativa.SUCESSO, StatusTentativa.BLOQUEADO):
            return

        time.sleep(delay)


def executar_ataque(client: DefesaApiClient, usuario: str, senhas: list[str], delay: float) -> ResultadoCenario:
    """Roda o ataque ate o fim e devolve o resultado consolidado (uso pelo CLI)."""
    resultado = ResultadoCenario(nome="", defesa_ativa=False, usuario=usuario)
    inicio = time.perf_counter()

    for tentativa in executar_ataque_stream(client, usuario, senhas, delay):
        resultado.tentativas.append(tentativa)

    resultado.tempo_total = time.perf_counter() - inicio
    if resultado.tentativas:
        ultima = resultado.tentativas[-1]
        if ultima.status == StatusTentativa.SUCESSO:
            resultado.desfecho = "sucesso"
            resultado.senha_encontrada = ultima.senha
        elif ultima.status == StatusTentativa.BLOQUEADO:
            resultado.desfecho = "bloqueado"

    return resultado


def rodar_cenario(
    client: DefesaApiClient,
    nome: str,
    defesa_ativa: bool,
    usuario: str,
    senhas: list[str],
    delay: float,
) -> ResultadoCenario:
    """Configura o modo de defesa no defesa-api, zera o rate limiter e ataca."""
    client.set_defense(defesa_ativa)
    client.reset_defense()
    resultado = executar_ataque(client, usuario, senhas, delay)
    resultado.nome = nome
    resultado.defesa_ativa = defesa_ativa
    return resultado


def rodar_cenario_stream(
    client: DefesaApiClient,
    defesa_ativa: bool,
    usuario: str,
    senhas: list[str],
    delay: float,
) -> Iterator[Tentativa]:
    """Mesma configuracao de rodar_cenario, mas produzindo tentativas conforme acontecem."""
    client.set_defense(defesa_ativa)
    client.reset_defense()
    yield from executar_ataque_stream(client, usuario, senhas, delay)
