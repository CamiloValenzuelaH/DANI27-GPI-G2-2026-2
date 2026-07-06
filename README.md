# DANI27 - Plataforma de Gestion ISO 27001

Sistema web para gestion de cumplimiento, autoevaluacion, evidencias, riesgos y soporte de auditoria.

## Vision general

El proyecto se compone de:

- `frontend`: aplicacion React + Vite.
- `backend`: API FastAPI + workers Celery.
- `db`: PostgreSQL con extension pgvector.
- `redis`: broker/cache para tareas asincronas.
- `mailhog`: captura de correo para entorno local.

La orquestacion local se hace con `docker-compose.yml` en la raiz.

## Estructura principal

```text
.
|- docker-compose.yml
|- init.sql
|- backend/
|  |- Dockerfile
|  |- entrypoint.sh
|  |- main.py
|  |- app/
|  |- migrations/
|  |- scripts/
|  |- tests/
|- frontend/
|  |- Dockerfile
|  |- package.json
|  |- src/
```

## Requisitos

- Docker
- Docker Compose

Opcional para desarrollo sin Docker:

- Python 3.12+
- Node.js 18+

## Variables de entorno

El repositorio tiene ejemplos para configurar el sistema:

- `.example.env` (raiz, usado por `docker-compose.yml`)
- `backend/.example.env`
- `frontend/.example.env`

Crear los archivos reales a partir de los ejemplos:

```bash
cp .example.env .env
cp backend/.example.env backend/.env
cp frontend/.example.env frontend/.env
```

En Windows PowerShell:

```powershell
Copy-Item .example.env .env
Copy-Item backend/.example.env backend/.env
Copy-Item frontend/.example.env frontend/.env
```

## Levantar el sistema (local con Docker)

Desde la raiz del proyecto:

```bash
docker compose up -d --build
```

Servicios y puertos por defecto:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8001`
- PostgreSQL: `localhost:5433`
- Redis: `localhost:6379`
- Mailhog UI: `http://localhost:8025`

Ver logs:

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f celery-worker
```

Detener servicios:

```bash
docker compose down
```

## Migraciones y seed

El `backend/entrypoint.sh` aplica migraciones y ejecuta seeds al iniciar (segun variables de entorno).

Si necesitas ejecutar migraciones manualmente:

```bash
docker compose exec backend alembic upgrade head
```

## Flujo recomendado para desarrollo

1. Configurar `.env` desde los `.example.env`.
2. Levantar stack con `docker compose up -d --build`.
3. Validar salud de backend y frontend en sus puertos.
4. Trabajar por ramas y commitear cambios por modulo.

## Soporte rapido

Si un servicio no levanta:

1. Revisa `docker compose ps`.
2. Revisa logs del servicio.
3. Verifica que los `.env` esten completos.
4. Reinicia solo el servicio afectado:

```bash
docker compose restart backend
docker compose restart frontend
```
