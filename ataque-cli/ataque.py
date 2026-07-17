#!/usr/bin/env python3
"""
Script de ataque de forca bruta educacional.

ATENCAO: este script SO pode mirar no defesa-api dentro da rede interna do
docker-compose deste laboratorio (ver seguranca.py). Nunca deve ser apontado
para IPs ou dominios externos/arbitrarios.
"""

import argparse
import os
import sys
from datetime import datetime

import relatorio
from ataque_core import carregar_wordlist, rodar_cenario
from cliente_api import DefesaApiClient
from seguranca import AlvoNaoPermitidoError, validar_alvo


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Ataque de forca bruta educacional contra o defesa-api do laboratorio.",
    )
    parser.add_argument(
        "--host",
        default=os.environ.get("TARGET_API_URL", "http://defesa-api:8080"),
        help="URL base do defesa-api, precisa estar na rede interna do lab (default: %(default)s)",
    )
    parser.add_argument("--usuario", default="joao.silva", help="usuario alvo (default: %(default)s)")
    parser.add_argument(
        "--wordlist",
        default=os.path.join(os.path.dirname(__file__), "wordlists", "comuns.txt"),
        help="arquivo .txt com senhas, uma por linha (default: %(default)s)",
    )
    parser.add_argument(
        "--modo",
        choices=["sem-defesa", "com-defesa", "comparar"],
        default="comparar",
        help="cenario a rodar (default: %(default)s, roda os dois e compara)",
    )
    parser.add_argument("--delay", type=float, default=0.1, help="segundos de espera entre tentativas (default: %(default)s)")
    parser.add_argument(
        "--saida",
        default=os.path.join(os.path.dirname(__file__), "relatorios"),
        help="diretorio onde salvar o relatorio (default: %(default)s)",
    )
    return parser.parse_args()


def imprimir_resumo(resultado) -> None:
    print(f"  desfecho: {resultado.desfecho}")
    print(f"  tentativas: {resultado.total_tentativas}")
    print(f"  tempo total: {resultado.tempo_total:.2f}s")
    if resultado.senha_encontrada:
        print(f"  senha encontrada: {resultado.senha_encontrada}")


def main() -> None:
    args = parse_args()

    try:
        validar_alvo(args.host)
    except AlvoNaoPermitidoError as exc:
        print(f"[ERRO] {exc}", file=sys.stderr)
        sys.exit(1)

    try:
        senhas = carregar_wordlist(args.wordlist)
    except (FileNotFoundError, ValueError) as exc:
        print(f"[ERRO] {exc}", file=sys.stderr)
        sys.exit(1)

    print(f"Wordlist carregada: {len(senhas)} senhas de '{args.wordlist}'")
    print(f"Alvo: {args.host}/login  |  usuario: {args.usuario}  |  modo: {args.modo}")

    client = DefesaApiClient(args.host)
    client.aguardar_pronto()

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    diretorio_saida = os.path.join(args.saida, timestamp)

    try:
        if args.modo == "comparar":
            print("\n=== Cenario 1: SEM DEFESA (rate limiting desligado) ===")
            resultado_sem_defesa = rodar_cenario(client, "sem defesa", False, args.usuario, senhas, args.delay)
            imprimir_resumo(resultado_sem_defesa)

            print("\n=== Cenario 2: COM DEFESA ATIVA (rate limiting ligado) ===")
            resultado_com_defesa = rodar_cenario(client, "com defesa ativa", True, args.usuario, senhas, args.delay)
            imprimir_resumo(resultado_com_defesa)

            relatorio.gerar_relatorio_comparativo(resultado_sem_defesa, resultado_com_defesa, diretorio_saida)
        else:
            defesa_ativa = args.modo == "com-defesa"
            nome = "com defesa ativa" if defesa_ativa else "sem defesa"
            print(f"\n=== Cenario: {nome.upper()} ===")
            resultado = rodar_cenario(client, nome, defesa_ativa, args.usuario, senhas, args.delay)
            imprimir_resumo(resultado)
            relatorio.gerar_relatorio_simples(resultado, diretorio_saida)
    finally:
        # deixa a API no estado seguro (defesa ligada) ao final da execucao
        client.set_defense(True)

    print(f"\nRelatorio salvo em: {diretorio_saida}/")


if __name__ == "__main__":
    main()
