"""Cliente HTTP fino para o defesa-api."""

import time

import requests


class DefesaApiClient:

    def __init__(self, base_url: str, timeout: float = 5.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.session = requests.Session()

    def login(self, username: str, password: str) -> requests.Response:
        return self.session.post(
            f"{self.base_url}/login",
            json={"username": username, "password": password},
            timeout=self.timeout,
        )

    def set_defense(self, enabled: bool) -> dict:
        resp = self.session.post(
            f"{self.base_url}/admin/defense",
            json={"enabled": enabled},
            timeout=self.timeout,
        )
        resp.raise_for_status()
        return resp.json()

    def reset_defense(self) -> None:
        resp = self.session.post(f"{self.base_url}/admin/defense/reset", timeout=self.timeout)
        resp.raise_for_status()

    def get_defense_status(self) -> dict:
        resp = self.session.get(f"{self.base_url}/admin/defense", timeout=self.timeout)
        resp.raise_for_status()
        return resp.json()

    def aguardar_pronto(self, tentativas: int = 20, intervalo: float = 2.0) -> None:
        """Espera o defesa-api aceitar requisicoes (util logo apos `docker compose up`)."""
        ultimo_erro = None
        for i in range(1, tentativas + 1):
            try:
                self.get_defense_status()
                return
            except requests.RequestException as exc:
                ultimo_erro = exc
                print(f"  aguardando defesa-api ficar pronto... ({i}/{tentativas})")
                time.sleep(intervalo)
        raise RuntimeError(f"defesa-api nao respondeu em {self.base_url} apos {tentativas} tentativas") from ultimo_erro
