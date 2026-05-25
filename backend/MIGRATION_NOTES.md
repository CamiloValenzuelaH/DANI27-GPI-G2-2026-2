## Migración de Node.js BullMQ a Python Celery

### Cambios principales:

1. **Eliminado**: Servicio Node.js `validation-worker` con BullMQ
2. **Agregado**: Worker Celery en Python dentro del mismo backend

### Ventajas:


### Estructura nueva:

```
backend/
├── app/
│   └── workers/
│       ├── __init__.py
│       ├── celery_app.py          # Configuración de Celery
│       ├── validation_tasks.py    # Tareas principales
│       ├── file_extraction.py     # Extracción de archivos
│       ├── gemini_service.py      # Cliente IA híbrido: DeepSeek para texto, Gemini para embeddings
│       └── ...
```

### Cómo ejecutar:

**Desarrollo:**
```bash
# Terminal 1: API Backend
cd backend
python -m uvicorn main:app --reload --port 8000

# Terminal 2: Celery Worker
cd backend
celery -A app.workers.celery_app worker --loglevel=info
```

**Producción (Docker):**
```bash
docker-compose up
```

### Tareas disponibles:


### Variables de entorno necesarias:

```
DEEPSEEK_API_KEY=tu_key_aqui
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Proveedor de embeddings si mantienes este flujo híbrido
GEMINI_API_KEY=tu_key_aqui
GEMINI_EMBEDDING_MODEL=models/embedding-004
REDIS_URL=redis://redis:6379/0
DATABASE_URL=postgresql://...
VALIDATION_JOBS_DIR=/shared/validation_jobs
```

### Monitoreo:

Usa Flower para monitorear Celery:
```bash
pip install flower
celery -A app.workers.celery_app flower --port=5555
```

Luego accede a: http://localhost:5555
