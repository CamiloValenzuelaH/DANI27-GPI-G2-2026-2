# Catálogo de Amenazas ISO 27005

## Implementación

Se ha implementado un catálogo de amenazas estandarizado basado en ISO 27005 como tabla de referencia separada para el módulo de riesgos.

### Componentes Implementados

#### 1. **Modelo de Base de Datos**
- **Tabla**: `iso_threat_catalog`
- **Ubicación**: `backend/app/models/iso_threat_catalog.py`
- **Campos**:
  - `id` (UUID): Identificador único
  - `code` (String): Código único (ej: T-01, T-02)
  - `name` (String): Nombre de la amenaza
  - `category` (String): Categoría (HUMAN, TECHNICAL, ENVIRONMENTAL, ORGANIZATIONAL)
  - `description` (Text): Descripción detallada
  - `affected_controls` (Array): Lista de referencias de controles Anexo A relacionados
  - `created_at`, `updated_at` (DateTime): Timestamps

#### 2. **Migración Alembic**
- **Archivo**: `backend/migrations/versions/g3b4c5d6e7f8_add_iso_threat_catalog.py`
- **Acción**: Crea la tabla `iso_threat_catalog` con índices y restricción de unicidad en `code`

#### 3. **Script de Seed Idempotente**
- **Archivo**: `backend/scripts/seed_iso_threat_catalog.py`
- **Amenazas Incluidas**: 24 amenazas basadas en ISO 27005 cubiertas en 4 categorías:
  - **HUMAN** (6): Acceso no autorizado, Phishing, Ingeniería social, Error humano, Abuso de privilegios, Fuga de información
  - **TECHNICAL** (9): Malware, DoS/DDoS, Inyección SQL, Robo de credenciales, Man-in-the-Middle, Explotación de vulnerabilidades, Fallo de autenticación, Intercepción de datos, Ransomware
  - **ENVIRONMENTAL** (4): Desastre natural, Falla de energía, Falla de hardware, Fluctuaciones ambientales
  - **ORGANIZATIONAL** (5): Falta de política, Falta de formación, Falta de cumplimiento, Discontinuidad de negocio, Falta de auditoría

#### 4. **Schemas y Respuestas**
- **Archivo**: `backend/app/schemas/iso_threat_catalog.py`
- **Esquemas**:
  - `ISOThreatCatalogResponse`: Respuesta individual de una amenaza
  - `ISOThreatCatalogByCategory`: Amenazas agrupadas por categoría

#### 5. **Servicio**
- **Archivo**: `backend/app/services/iso_threat_catalog_service.py`
- **Funciones**:
  - `get_iso_threat_catalog_all()`: Obtener todas las amenazas
  - `get_iso_threat_catalog_by_category()`: Agrupar por categoría
  - `get_iso_threat_catalog_by_code()`: Obtener por código
  - `add_iso_threat_to_risk()`: Agregar amenaza del catálogo a un riesgo

#### 6. **Endpoints API**

##### GET `/api/v1/threats/catalog`
**Descripción**: Obtener el catálogo completo de amenazas agrupado por categoría

**Respuesta**:
```json
[
  {
    "category": "HUMAN",
    "threats": [
      {
        "id": "uuid-1",
        "code": "T-01",
        "name": "Acceso No Autorizado",
        "category": "HUMAN",
        "description": "Intento de acceso a sistemas...",
        "affected_controls": ["A.5.1", "A.5.2", "A.6.1"],
        "created_at": "2026-05-27T...",
        "updated_at": "2026-05-27T..."
      }
    ]
  },
  {
    "category": "TECHNICAL",
    "threats": [...]
  }
]
```

##### POST `/api/v1/risks/{risk_id}/threats/from-catalog`
**Descripción**: Agregar una amenaza del catálogo directamente a un riesgo sin crear manualmente

**Body**:
```json
{
  "catalog_threat_code": "T-01"
}
```

**Respuesta**: `ThreatResponse` (la amenaza creada en la organización)
```json
{
  "id": "uuid",
  "organization_id": "org-uuid",
  "name": "Acceso No Autorizado",
  "description": "Intento de acceso a sistemas...",
  "category": "HUMAN",
  "likelihood": 3,
  "created_at": "2026-05-27T...",
  "updated_at": "2026-05-27T..."
}
```

### Instalación y Ejecución

#### Opción 1: Con Docker Compose (Recomendado)
```bash
# Desde la raíz del proyecto
docker-compose up

# El entrypoint.sh ejecutará automáticamente:
# 1. Las migraciones Alembic
# 2. El seed del catálogo ISO de amenazas
```

#### Opción 2: Ejecución Manual en Desarrollo
```bash
cd backend

# 1. Aplicar migraciones
python -m alembic upgrade head

# 2. Ejecutar seed del catálogo
python scripts/seed_iso_threat_catalog.py
```

### Características Clave

✅ **Tabla de Referencia Separada**: El catálogo no modifica el modelo de `Threat` existente
✅ **Idempotencia**: El script de seed no duplica amenazas si ya existen
✅ **ISO 27005 Completo**: Incluye 24 amenazas de las 4 categorías principales
✅ **Controles Relacionados**: Cada amenaza especifica los controles Anexo A relacionados
✅ **Integración con Riesgos**: Permite agregar amenazas del catálogo directamente a riesgos
✅ **Agrupación por Categoría**: El endpoint `/catalog` devuelve amenazas organizadas por tipo

### Testing

#### 1. Verificar que la tabla existe
```bash
# Conectar a la base de datos
psql postgresql://postgres:password1234@localhost:5433/dani27001

# Consultar amenazas
SELECT code, name, category FROM iso_threat_catalog LIMIT 5;
```

#### 2. Obtener el catálogo completo
```bash
curl -X GET http://localhost:8001/api/v1/threats/catalog \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 3. Agregar amenaza a un riesgo
```bash
curl -X POST http://localhost:8001/api/v1/risks/{risk_id}/threats/from-catalog \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"catalog_threat_code": "T-01"}'
```

### Estructura del Catálogo

| Código | Categoría | Nombre | Controles Ejemplo |
|--------|-----------|--------|------------------|
| T-01 | HUMAN | Acceso No Autorizado | A.5.1, A.5.2, A.6.1 |
| T-02 | HUMAN | Phishing | A.5.2, A.6.2, A.8.31 |
| T-07 | TECHNICAL | Malware | A.5.2, A.8.1, A.8.7 |
| T-16 | ENVIRONMENTAL | Desastre Natural | A.5.1, A.6.1, A.8.30 |
| T-20 | ORGANIZATIONAL | Falta de Política | A.5.1, A.5.37, A.6.1 |

### Notas Importantes

- El catálogo es una **tabla global**, no vinculada a organizaciones específicas
- Al agregar una amenaza del catálogo a un riesgo, se **crea una copia** en la organización
- Si la amenaza ya existe en la organización, se **reutiliza** sin duplicar
- El valor por defecto de `likelihood` es 3 (medio) al crear desde el catálogo
- Los `affected_controls` pueden usarse para auditoría y trazabilidad
