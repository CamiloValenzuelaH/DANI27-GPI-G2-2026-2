# Arquitectura e Integración: Catálogo de Amenazas ISO 27005

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Módulo de Riesgos                                      │  │
│  │  - Listar riesgos                                       │  │
│  │  - Crear riesgo                                         │  │
│  │  - Vista de catálogo de amenazas                        │  │
│  │  - Agregar amenaza al riesgo (desde catálogo)          │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                         HTTP/HTTPS
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API v1 Endpoints                                        │  │
│  │                                                          │  │
│  │  GET  /threats/catalog                                  │  │
│  │  └─→ iso_threat_catalog_service.get_by_category()      │  │
│  │                                                          │  │
│  │  POST /risks/{id}/threats/from-catalog                  │  │
│  │  └─→ iso_threat_catalog_service.add_iso_threat_to_risk()│ │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Services                                                │  │
│  │                                                          │  │
│  │  iso_threat_catalog_service                             │  │
│  │  ├─ get_iso_threat_catalog_all()                        │  │
│  │  ├─ get_iso_threat_catalog_by_category()                │  │
│  │  ├─ get_iso_threat_catalog_by_code()                    │  │
│  │  └─ add_iso_threat_to_risk()                            │  │
│  │                                                          │  │
│  │  risk_service (existente)                               │  │
│  │  threat_service (existente)                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Data Access Layer (SQLAlchemy ORM)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                         SQL Queries
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  iso_threat_catalog (NEW)                               │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │ id (UUID PK)                                    │    │  │
│  │  │ code (String UNIQUE) - T-01 to T-24            │    │  │
│  │  │ name (String)                                  │    │  │
│  │  │ category (String) - HUMAN/TECHNICAL/etc.       │    │  │
│  │  │ description (Text)                              │    │  │
│  │  │ affected_controls (Array)                       │    │  │
│  │  │ created_at, updated_at (DateTime)               │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │                                                         │  │
│  │  threats (EXISTING - organización-specific)            │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │ id (UUID PK)                                    │    │  │
│  │  │ organization_id (UUID FK) → organizations      │    │  │
│  │  │ name, description, category, likelihood        │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │                                                         │  │
│  │  risks (EXISTING)                                      │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │ id (UUID PK)                                    │    │  │
│  │  │ organization_id (UUID FK)                       │    │  │
│  │  │ asset_id (UUID FK)                              │    │  │
│  │  │ ... probability, impact, etc.                   │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │                                                         │  │
│  │  risk_threats (EXISTING - join table)                  │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │ risk_id (UUID FK) → risks                       │    │  │
│  │  │ threat_id (UUID FK) → threats                   │    │  │
│  │  │ organization_id (UUID FK)                       │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Flujo de Datos

### 1. Obtener Catálogo de Amenazas

```
Frontend Request
│
├─ GET /api/v1/threats/catalog
│
↓
FastAPI Router (threats.py)
│
├─ No requiere autenticación
├─ Llamar: iso_threat_catalog_service.get_iso_threat_catalog_by_category()
│
↓
Service Layer (iso_threat_catalog_service.py)
│
├─ Query: SELECT DISTINCT category FROM iso_threat_catalog
├─ Para cada categoría:
│  └─ Query: SELECT * FROM iso_threat_catalog WHERE category = ?
│
↓
Database (PostgreSQL)
│
├─ Retorna amenazas agrupadas por categoría
│
↓
Schema Validation (ISOThreatCatalogByCategory)
│
├─ Cada amenaza se convierte a ISOThreatCatalogResponse
├─ Se agrupa en ISOThreatCatalogByCategory
│
↓
Response JSON
│
└─ Frontend recibe lista de categorías con sus amenazas
```

### 2. Agregar Amenaza del Catálogo a un Riesgo

```
Frontend Request
│
├─ POST /api/v1/risks/{risk_id}/threats/from-catalog
├─ Body: { "catalog_threat_code": "T-01" }
├─ Headers: { Authorization: Bearer TOKEN }
│
↓
FastAPI Router (risks.py)
│
├─ Validar autenticación → get_current_org()
├─ Extraer risk_id y catalog_threat_code
├─ Llamar: iso_threat_catalog_service.add_iso_threat_to_risk()
│
↓
Service Layer (iso_threat_catalog_service.py)
│
├─ Step 1: Validar que el riesgo existe y pertenece a org
│  └─ Query: SELECT * FROM risks WHERE id = ? AND organization_id = ?
│
├─ Step 2: Obtener amenaza del catálogo
│  └─ Query: SELECT * FROM iso_threat_catalog WHERE code = ?
│
├─ Step 3: Buscar si la amenaza ya existe en la organización
│  └─ Query: SELECT * FROM threats WHERE organization_id = ? AND name = ?
│
├─ Step 4a: Si NO existe → Crear copia en tabla threats
│  └─ INSERT INTO threats (organization_id, name, description, ...)
│
├─ Step 4b: Si existe → Usar la existente
│
├─ Step 5: Vincular amenaza al riesgo (si no está ya vinculada)
│  └─ INSERT INTO risk_threats (risk_id, threat_id, organization_id)
│
↓
Database Changes
│
├─ Nueva fila en threats (o reutilizada)
├─ Nueva relación en risk_threats
│
↓
Response JSON (ThreatResponse)
│
└─ Frontend recibe la amenaza creada/reutilizada
```

## Flujo de Inicialización (Startup)

```
Docker Compose startup
│
├─ backend service starts
│
↓
entrypoint.sh runs
│
├─ Step 1: Esperar a que PostgreSQL esté disponible
│  └─ Test connection con: SELECT 1
│
├─ Step 2: Ejecutar migraciones Alembic
│  ├─ alembic upgrade head
│  ├─ Incluye: g3b4c5d6e7f8_add_iso_threat_catalog.py
│  └─ Crea tabla: iso_threat_catalog
│
├─ Step 3: Ejecutar seeds (background)
│  ├─ python scripts/seed_iso_chunks.py
│  └─ python scripts/seed_iso_threat_catalog.py
│     ├─ Lee ISO_THREAT_CATALOG (24 amenazas)
│     ├─ Inserta cada una si no existe (idempotente)
│     └─ Commit cambios
│
├─ Step 4: Iniciar uvicorn
│  └─ uvicorn main:app --host 0.0.0.0 --port 8000
│
↓
Backend está listo para recibir requests
│
└─ Endpoints disponibles:
   ├─ GET /api/v1/threats/catalog
   ├─ POST /api/v1/risks/{id}/threats/from-catalog
   └─ ... (otros endpoints existentes)
```

## Integración con Módulo de Riesgos (Existente)

### Relaciones de Datos

```
iso_threat_catalog (Global Reference)
│
├─ 1-to-Many ─┐
│             ├─→ threats (Org-specific copies)
│             │   │
│             │   ├─ Many-to-Many ─→ risks (via risk_threats)
│             │   └─ Belongs to organization
│             │
└─ Completamente independiente de threats
   (Tabla separada, no modifica existentes)
```

### Operaciones Permitidas

```
✓ Crear amenaza manualmente → Usa threat_service
✓ Crear amenaza desde catálogo → Usa iso_threat_catalog_service
✓ Listar amenazas de org → threat_service
✓ Listar catálogo completo → iso_threat_catalog_service
✓ Vincular amenaza a riesgo (manual) → risk_service.link_threat_to_risk()
✓ Vincular amenaza a riesgo (desde catálogo) → iso_threat_catalog_service.add_iso_threat_to_risk()
✓ Actualizar amenaza → threat_service.update_threat()
✓ Eliminar amenaza → threat_service.delete_threat()
✗ Actualizar catálogo → No implementado (es referencia global)
✗ Eliminar del catálogo → No implementado (es referencia global)
```

## Consideraciones de Seguridad

```
Autenticación
├─ GET /threats/catalog → No requiere (tabla de referencia pública)
└─ POST /risks/{id}/threats/from-catalog → Requiere auth + org validation

Autorización
├─ Riesgo debe pertenecer a la organización del usuario
├─ Amenaza se crea dentro de la organización
└─ Solo usuarios de esa org pueden ver y usar las amenazas

Aislamiento de Datos
├─ iso_threat_catalog: Sin organización (compartido)
├─ threats: Aislado por organization_id
├─ risks: Aislado por organization_id
└─ risk_threats: Validado por organization_id en join
```

## Escalabilidad

```
Performance
├─ Índices en iso_threat_catalog (code, category)
├─ Índices en threats (org_id, created_at, category)
├─ Query de catálogo → O(1) grouping en memoria
└─ Seed script → O(n) donde n=24

Caching (Future Optimization)
├─ GET /catalog → Cacheable (datos estáticos)
├─ TTL: No necesario (datos globales estables)
└─ Invalidar solo si se actualiza catálogo

Concurrent Access
├─ PostgreSQL maneja concurrencia nativa
├─ SQLAlchemy ORM con transacciones ACID
├─ Seed es idempotente (safe para re-runs)
└─ Validación de riesgo/amenaza evita duplicación
```

## Testing

```
Unit Tests Sugeridos
├─ iso_threat_catalog_service:
│  ├─ test_get_all_threats()
│  ├─ test_get_by_category()
│  ├─ test_get_by_code_found()
│  ├─ test_get_by_code_not_found()
│  └─ test_add_to_risk()
│
├─ Endpoints:
│  ├─ test_get_catalog_endpoint()
│  ├─ test_add_threat_to_risk_endpoint()
│  └─ test_add_threat_auth_required()
│
└─ Database:
   ├─ test_migration_creates_table()
   └─ test_seed_creates_24_threats()

Integration Tests
├─ Complete flow: Create risk → Add threat from catalog
└─ Verify threat appears in risk.linked_threats
```

## Monitoreo

```
Logs
├─ entrypoint.sh logs: Migration & seed status
├─ FastAPI logs: Request/response times
└─ Database logs: Query performance

Metrics
├─ Catálogo: # de amenazas por categoría
├─ Uso: # de amenazas del catálogo agregadas a riesgos
└─ Performance: Query time para GET /catalog

Health Checks
├─ DB connection alive
├─ Catálogo seeded correctly (count query)
└─ Endpoints responding
```

## Árbol completo del proyecto

El árbol completo con todos los archivos y carpetas está guardado en [ARCHITECTURE_TREE_FULL.txt](ARCHITECTURE_TREE_FULL.txt).

Extracto inicial:

```text
Listado de rutas de carpetas
C:.
|   .env
|   .gitignore
|   .vercelignore
|   API_EXAMPLES.md
|   ARCHITECTURE_DIAGRAM.md
|   ARCHITECTURE_TREE.txt
|   ARCHITECTURE_TREE_FULL.txt
|   docker-compose.yml
|   IMPLEMENTATION_SUMMARY.md
|   IMPORTANTE_PARA_USAR_DOCKER.txt
|   INDEX.md
|   init.sql
|   QUICK_START.md
|   README.md
```

Si quieres que inserte el árbol completo aquí (archivo Markdown) o que lo divida por secciones, dime cómo prefieres la presentación.
