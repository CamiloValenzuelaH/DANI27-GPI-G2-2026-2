# Inventario de Dockerfiles

Este proyecto tiene dos `Dockerfile` activos.

## 1) [backend/Dockerfile](backend/Dockerfile)
- Ubicación: `backend/Dockerfile`
- Función: construye la imagen del backend Python/FastAPI.
- Base: `python:3.12.9`
- Instala dependencias desde `backend/requirements.txt`.
- Copia el código del backend al contenedor.
- Expone el puerto `8000`.
- Comando por defecto: `uvicorn main:app --host 0.0.0.0 --port 8000`.
- Uso en el sistema: `docker-compose.yml` lo usa para los servicios `backend`, `celery-worker` y `celery-beat`.

## 2) [frontend/Dockerfile](frontend/Dockerfile)
- Ubicación: `frontend/Dockerfile`
- Función: construye la imagen del frontend React/Vite.
- Base: `node:18-slim`
- Instala dependencias desde `frontend/package.json` y `frontend/package-lock.json`.
- Copia el código del frontend al contenedor.
- Expone el puerto `5173`.
- Comando por defecto: `npm run dev -- --host`.
- Uso en el sistema: `docker-compose.yml` lo usa para el servicio `frontend`.

## Relación con Docker Compose
El archivo [docker-compose.yml](docker-compose.yml) define la orquestación completa del sistema:
- `db` usa una imagen ya publicada de PostgreSQL con pgvector.
- `redis` usa una imagen oficial de Redis.
- `backend`, `celery-worker` y `celery-beat` se construyen desde `backend/Dockerfile`.
- `frontend` se construye desde `frontend/Dockerfile`.
- `mailhog` usa una imagen ya publicada para pruebas de correo.

## Resumen
No se encontraron otros `Dockerfile` en el workspace además de estos dos.
