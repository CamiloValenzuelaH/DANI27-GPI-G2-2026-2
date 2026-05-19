import subprocess

# 1. Enciende el motor de Celery (el cocinero) en segundo plano
print("Iniciando Celery Worker...")
subprocess.Popen(["celery", "-A", "app.workers.celery_app", "worker", "--loglevel=info", "--concurrency=2"])

# 2. Enciende el servidor de Uvicorn (el cajero) en primer plano
print("Iniciando Uvicorn...")
subprocess.run(["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"])
