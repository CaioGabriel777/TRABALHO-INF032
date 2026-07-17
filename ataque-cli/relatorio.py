"""Geracao de relatorio (texto + JSON + grafico) comparando cenarios de ataque."""

import json
import os
from dataclasses import asdict

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from modelos import ResultadoCenario

# Paleta categorica validada (skill dataviz): ordem fixa, slot 1 e 2.
COR_SEM_DEFESA = "#2a78d6"   # azul
COR_COM_DEFESA = "#008300"   # verde
COR_SUPERFICIE = "#fcfcfb"
COR_TINTA_PRIMARIA = "#0b0b0b"
COR_TINTA_SECUNDARIA = "#52514e"
COR_TINTA_MUTED = "#898781"
COR_GRADE = "#e1e0d9"
COR_BASELINE = "#c3c2b7"


def gerar_relatorio_comparativo(sem_defesa: ResultadoCenario, com_defesa: ResultadoCenario, diretorio_saida: str) -> None:
    os.makedirs(diretorio_saida, exist_ok=True)
    texto = _montar_texto_comparativo(sem_defesa, com_defesa)
    print("\n" + texto)

    with open(os.path.join(diretorio_saida, "comparacao.txt"), "w", encoding="utf-8") as f:
        f.write(texto)

    with open(os.path.join(diretorio_saida, "dados.json"), "w", encoding="utf-8") as f:
        json.dump({
            "sem_defesa": _resultado_para_dict(sem_defesa),
            "com_defesa": _resultado_para_dict(com_defesa),
        }, f, indent=2, ensure_ascii=False)

    _gerar_grafico_comparativo(sem_defesa, com_defesa, os.path.join(diretorio_saida, "comparacao.png"))


def gerar_relatorio_simples(resultado: ResultadoCenario, diretorio_saida: str) -> None:
    os.makedirs(diretorio_saida, exist_ok=True)
    texto = _montar_texto_simples(resultado)
    print("\n" + texto)

    with open(os.path.join(diretorio_saida, "resultado.txt"), "w", encoding="utf-8") as f:
        f.write(texto)

    with open(os.path.join(diretorio_saida, "dados.json"), "w", encoding="utf-8") as f:
        json.dump(_resultado_para_dict(resultado), f, indent=2, ensure_ascii=False)


def _resultado_para_dict(resultado: ResultadoCenario) -> dict:
    dados = asdict(resultado)
    dados["total_tentativas"] = resultado.total_tentativas
    dados["taxa_sucesso"] = resultado.taxa_sucesso
    return dados


def _linha_resumo(r: ResultadoCenario) -> str:
    return (
        f"  cenario:            {r.nome}\n"
        f"  usuario alvo:       {r.usuario}\n"
        f"  desfecho:           {r.desfecho}\n"
        f"  tentativas:         {r.total_tentativas}\n"
        f"  tempo total:        {r.tempo_total:.2f}s\n"
        f"  taxa de sucesso:    {r.taxa_sucesso * 100:.1f}%\n"
        f"  senha encontrada:   {r.senha_encontrada or '-'}\n"
    )


def _montar_texto_simples(r: ResultadoCenario) -> str:
    linhas = ["=== Relatorio de ataque ===", _linha_resumo(r)]
    return "\n".join(linhas)


def _montar_texto_comparativo(sem_defesa: ResultadoCenario, com_defesa: ResultadoCenario) -> str:
    linhas = [
        "=== Relatorio comparativo: sem defesa vs. com defesa ativa ===",
        "",
        "-- Cenario 1: sem defesa --",
        _linha_resumo(sem_defesa),
        "-- Cenario 2: com defesa ativa --",
        _linha_resumo(com_defesa),
        "-- Conclusao --",
    ]
    if com_defesa.desfecho == "bloqueado" and sem_defesa.desfecho == "sucesso":
        linhas.append(
            f"  A defesa bloqueou o ataque apos {com_defesa.total_tentativas} tentativas, "
            f"impedindo o brute force que teria descoberto a senha em {sem_defesa.total_tentativas} "
            f"tentativas sem protecao."
        )
    else:
        linhas.append("  Compare os campos acima: tentativas, tempo total e desfecho de cada cenario.")
    return "\n".join(linhas)


def _gerar_grafico_comparativo(sem_defesa: ResultadoCenario, com_defesa: ResultadoCenario, caminho_png: str) -> None:
    fig, eixos = plt.subplots(1, 3, figsize=(11, 4), facecolor=COR_SUPERFICIE)
    fig.suptitle(
        "Ataque de forca bruta: sem defesa vs. com defesa ativa",
        fontsize=13, color=COR_TINTA_PRIMARIA, fontweight="bold",
    )

    rotulos = ["sem defesa", "com defesa\nativa"]
    cores = [COR_SEM_DEFESA, COR_COM_DEFESA]

    metricas = [
        ("Tentativas ate o desfecho", [sem_defesa.total_tentativas, com_defesa.total_tentativas], ""),
        ("Tempo total (s)", [round(sem_defesa.tempo_total, 2), round(com_defesa.tempo_total, 2)], "s"),
        ("Taxa de sucesso (%)", [round(sem_defesa.taxa_sucesso * 100, 1), round(com_defesa.taxa_sucesso * 100, 1)], "%"),
    ]

    for eixo, (titulo, valores, sufixo) in zip(eixos, metricas):
        eixo.set_facecolor(COR_SUPERFICIE)
        barras = eixo.bar(rotulos, valores, color=cores, width=0.55, zorder=3)
        eixo.set_title(titulo, fontsize=10.5, color=COR_TINTA_PRIMARIA, pad=10)
        for lado in ("top", "right", "left"):
            eixo.spines[lado].set_visible(False)
        eixo.spines["bottom"].set_color(COR_BASELINE)
        eixo.tick_params(axis="x", colors=COR_TINTA_SECUNDARIA, labelsize=9.5)
        eixo.tick_params(axis="y", colors=COR_TINTA_MUTED, labelsize=8.5)
        eixo.yaxis.grid(True, color=COR_GRADE, linewidth=0.8, zorder=0)
        eixo.set_axisbelow(True)
        maior = max(valores) if max(valores) > 0 else 1
        eixo.set_ylim(0, maior * 1.25)
        for barra, valor in zip(barras, valores):
            eixo.text(
                barra.get_x() + barra.get_width() / 2,
                barra.get_height() + maior * 0.03,
                f"{valor}{sufixo}",
                ha="center", va="bottom", fontsize=9.5, color=COR_TINTA_PRIMARIA,
            )

    fig.tight_layout(rect=(0, 0, 1, 0.93))
    fig.savefig(caminho_png, dpi=150, facecolor=COR_SUPERFICIE)
    plt.close(fig)
