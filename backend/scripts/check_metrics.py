"""
TEMPORAL: script de comprobación de métricas.

Este archivo se dejó en el repositorio como herramienta temporal para pruebas
locales. Puedes mantenerlo para volver a ejecutar rápidamente la comprobación
de `GET /api/v1/dashboard/metrics`.

Cómo ejecutarlo (desde la raíz del repo):

    docker-compose exec backend python scripts/check_metrics.py


"""

from __future__ import annotations

import httpx


def main():
    client = httpx.Client(timeout=10.0)
    login_url = "http://127.0.0.1:8000/api/v1/auth/login"
    metrics_url = "http://127.0.0.1:8000/api/v1/dashboard/metrics"

    resp = client.post(login_url, json={"email": "admin@alloxentric.demo", "password": "DemoPass123!"})
    print("login status", resp.status_code)
    if resp.status_code != 200:
        print(resp.text)
        return
    token = resp.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    r = client.get(metrics_url, headers=headers)
    print("metrics status", r.status_code)
    print(r.text)


if __name__ == "__main__":
    main()
