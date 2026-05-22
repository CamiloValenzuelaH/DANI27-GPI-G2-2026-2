import subprocess
import os

# 1. Crea la carpeta de PDFs automáticamente si no existe
jobs_dir = os.environ.get("VALIDATION_JOBS_DIR", "/tmp/validation_jobs")
os.makedirs(jobs_dir, exist_ok=True)

# 2. Enciende el motor de Celery en segundo plano
print("Iniciando Celery Worker...")
subprocess.Popen(["celery", "-A", "app.workers.celery_app", "worker", "--loglevel=info", "--concurrency=2"])

# 3. Enciende el servidor de Uvicorn en primer plano
print("Iniciando Uvicorn...")
subprocess.run(["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"])
