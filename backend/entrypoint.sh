#!/bin/sh
set -e

AUTO_SEED="${AUTO_SEED_ISO_CHUNKS:-1}"
DB_MAX_RETRIES="${DB_MAX_RETRIES:-20}"
DB_RETRY_SECONDS="${DB_RETRY_SECONDS:-3}"
MIGRATION_MAX_RETRIES="${MIGRATION_MAX_RETRIES:-10}"
MIGRATION_RETRY_SECONDS="${MIGRATION_RETRY_SECONDS:-3}"
SEED_MAX_RETRIES="${AUTO_SEED_MAX_RETRIES:-15}"
SEED_RETRY_SECONDS="${AUTO_SEED_RETRY_SECONDS:-3}"

is_true() {
  case "$1" in
    1|true|TRUE|yes|YES|on|ON) return 0 ;;
    *) return 1 ;;
  esac
}

echo "[entrypoint] Esperando base de datos..."
attempt=1
while [ "$attempt" -le "$DB_MAX_RETRIES" ]; do
  if python - <<'PY'
import os
from sqlalchemy import create_engine, text

database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise RuntimeError("DATABASE_URL no estÃ¡ definido")

engine = create_engine(database_url)
with engine.connect() as connection:
    connection.execute(text("SELECT 1"))
PY
  then
    echo "[entrypoint] Base de datos disponible."
    break
  fi

  echo "[entrypoint] DB no disponible (intento $attempt/$DB_MAX_RETRIES)."
  if [ "$attempt" -eq "$DB_MAX_RETRIES" ]; then
    echo "[entrypoint] No se pudo conectar a DB. Abortando startup."
    exit 1
  fi

  attempt=$((attempt + 1))
  sleep "$DB_RETRY_SECONDS"
done

echo "[entrypoint] Aplicando migraciones Alembic..."
attempt=1
while [ "$attempt" -le "$MIGRATION_MAX_RETRIES" ]; do
  if alembic upgrade head; then
    echo "[entrypoint] Migraciones aplicadas correctamente."
    break
  fi

  echo "[entrypoint] MigraciÃ³n fallÃ³ (intento $attempt/$MIGRATION_MAX_RETRIES)."
  if [ "$attempt" -eq "$MIGRATION_MAX_RETRIES" ]; then
    echo "[entrypoint] No se pudieron aplicar migraciones. Abortando startup."
    exit 1
  fi

  attempt=$((attempt + 1))
  sleep "$MIGRATION_RETRY_SECONDS"
done

# ---> INICIO HACK RENDER: Inyección de datos obligatoria <---
echo "[entrypoint] Ejecutando seeders base obligatorios..."
python -m app.db.seed
python /app/scripts/seed_demo.py
python /app/scripts/seed_assessment_questions.py
# ---> FIN HACK RENDER <---

if is_true "$AUTO_SEED"; then
  echo "[entrypoint] Auto-seed ISO chunks habilitado (modo background)."
  (
    attempt=1
    while [ "$attempt" -le "$SEED_MAX_RETRIES" ]; do
      if python /app/scripts/seed_iso_chunks.py; then
        echo "[entrypoint] Seed ISO chunks finalizado."
        break
      fi

      echo "[entrypoint] Seed ISO chunks fallÃ³ (intento $attempt/$SEED_MAX_RETRIES)."
      if [ "$attempt" -eq "$SEED_MAX_RETRIES" ]; then
        echo "[entrypoint] Se agotaron reintentos de seed ISO chunks."
      fi

      attempt=$((attempt + 1))
      sleep "$SEED_RETRY_SECONDS"
    done

    attempt=1
    while [ "$attempt" -le "$SEED_MAX_RETRIES" ]; do
      if python /app/scripts/seed_iso_threat_catalog.py; then
        echo "[entrypoint] Seed catálogo de amenazas ISO finalizado."
        exit 0
      fi

      echo "[entrypoint] Seed catálogo de amenazas ISO fallÃ³ (intento $attempt/$SEED_MAX_RETRIES)."
      if [ "$attempt" -eq "$SEED_MAX_RETRIES" ]; then
        echo "[entrypoint] Se agotaron reintentos de seed catálogo de amenazas ISO."
        exit 0
      fi

      attempt=$((attempt + 1))
      sleep "$SEED_RETRY_SECONDS"
    done
  ) &
else
  echo "[entrypoint] Auto-seed ISO chunks deshabilitado (AUTO_SEED_ISO_CHUNKS=$AUTO_SEED)."
fi

if [ "$#" -eq 0 ]; then
  set -- uvicorn main:app --host 0.0.0.0 --port 8000
fi

exec "$@"