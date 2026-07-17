"""
Servidor HTTP fino sobre a mesma logica de ataque_core.py, usado apenas pelo
ataque-web (botao "iniciar ataque" com progresso em tempo real).

Ao contrario do ataque.py (CLI), este servidor NUNCA aceita um host de alvo
vindo do cliente: o alvo e sempre TARGET_API_URL (validado no startup por
seguranca.py), fixo na rede interna do laboratorio.
"""

import os
import sys
import threading
import time
import uuid
from dataclasses import asdict
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ataque_core import carregar_wordlist, rodar_cenario_stream
from cliente_api import DefesaApiClient
from modelos import StatusTentativa
from seguranca import AlvoNaoPermitidoError, validar_alvo

TARGET_API_URL = os.environ.get("TARGET_API_URL", "http://defesa-api:8080")
WORDLIST_PATH = os.path.join(os.path.dirname(__file__), "wordlists", "comuns.txt")

try:
    validar_alvo(TARGET_API_URL)
except AlvoNaoPermitidoError as exc:
    print(f"[ERRO] {exc}", file=sys.stderr)
    sys.exit(1)

app = FastAPI(title="ataque-api", description="Dispara ataques de forca bruta contra o defesa-api do laboratorio")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_lock = threading.Lock()
_execucoes: dict[str, dict] = {}
_execucao_ativa: str | None = None


class IniciarAtaqueRequest(BaseModel):
    usuario: str = "joao.silva"
    modo: Literal["sem-defesa", "com-defesa"] = "sem-defesa"
    delay: float = 0.15


def _tentativa_para_dict(tentativa) -> dict:
    dados = asdict(tentativa)
    dados["status"] = tentativa.status.value if isinstance(tentativa.status, StatusTentativa) else tentativa.status
    return dados


def _rodar_em_background(execucao_id: str, usuario: str, modo: str, delay: float) -> None:
    global _execucao_ativa
    defesa_ativa = modo == "com-defesa"
    client = DefesaApiClient(TARGET_API_URL)
    inicio = time.perf_counter()

    try:
        senhas = carregar_wordlist(WORDLIST_PATH)
        for tentativa in rodar_cenario_stream(client, defesa_ativa, usuario, senhas, delay):
            with _lock:
                _execucoes[execucao_id]["tentativas"].append(_tentativa_para_dict(tentativa))

        with _lock:
            execucao = _execucoes[execucao_id]
            execucao["tempo_total"] = time.perf_counter() - inicio
            if execucao["tentativas"]:
                ultima = execucao["tentativas"][-1]
                if ultima["status"] == StatusTentativa.SUCESSO.value:
                    execucao["desfecho"] = "sucesso"
                    execucao["senha_encontrada"] = ultima["senha"]
                elif ultima["status"] == StatusTentativa.BLOQUEADO.value:
                    execucao["desfecho"] = "bloqueado"
                else:
                    execucao["desfecho"] = "esgotado"
            else:
                execucao["desfecho"] = "esgotado"
            execucao["status"] = "concluido"
    except Exception as exc:  # noqa: BLE001 - reportado ao cliente via status "erro"
        with _lock:
            _execucoes[execucao_id]["status"] = "erro"
            _execucoes[execucao_id]["erro"] = str(exc)
    finally:
        try:
            client.set_defense(True)  # deixa a API no estado seguro ao final
        except Exception:
            pass
        with _lock:
            _execucao_ativa = None


@app.post("/ataques")
def iniciar_ataque(req: IniciarAtaqueRequest):
    global _execucao_ativa
    with _lock:
        if _execucao_ativa is not None and _execucoes.get(_execucao_ativa, {}).get("status") == "executando":
            raise HTTPException(status_code=409, detail="Ja existe um ataque em andamento. Aguarde terminar.")

        execucao_id = str(uuid.uuid4())
        _execucoes[execucao_id] = {
            "id": execucao_id,
            "status": "executando",
            "usuario": req.usuario,
            "modo": req.modo,
            "tentativas": [],
            "desfecho": None,
            "tempo_total": None,
            "senha_encontrada": None,
            "erro": None,
        }
        _execucao_ativa = execucao_id

    thread = threading.Thread(
        target=_rodar_em_background,
        args=(execucao_id, req.usuario, req.modo, req.delay),
        daemon=True,
    )
    thread.start()
    return _execucoes[execucao_id]


@app.get("/ataques/{execucao_id}")
def obter_ataque(execucao_id: str):
    with _lock:
        execucao = _execucoes.get(execucao_id)
        if execucao is None:
            raise HTTPException(status_code=404, detail="Execucao nao encontrada")
        return dict(execucao)


@app.get("/saude")
def saude():
    return {"status": "ok", "alvo": TARGET_API_URL}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "9000")))
