# Resumen de Implementación: Catálogo de Amenazas ISO 27005

## ✅ Tareas Completadas

### 1. **Modelo de Base de Datos** ✓
- Archivo: `backend/app/models/iso_threat_catalog.py`
- Tabla: `iso_threat_catalog`
- Campos:
  - `id`: UUID (clave primaria)
  - `code`: String(20) - Único (T-01, T-02, ..., T-24)
  - `name`: String(255) - Nombre de la amenaza
  - `category`: String(50) - HUMAN, TECHNICAL, ENVIRONMENTAL, ORGANIZATIONAL
  - `description`: Text - Descripción completa
  - `affected_controls`: Array(String(20)) - Referencias de controles Anexo A
  - `created_at`, `updated_at`: DateTime - Timestamps automáticos
- Índices: `code`, `category`

### 2. **Migración Alembic** ✓
- Archivo: `backend/migrations/versions/g3b4c5d6e7f8_add_iso_threat_catalog.py`
- Crea la tabla con restricción UNIQUE en `code`
- Crea índices para optimización de consultas
- Downgradeable automáticamente

### 3. **Script de Seed Idempotente** ✓
- Archivo: `backend/scripts/seed_iso_threat_catalog.py`
- **24 amenazas** basadas en ISO 27005:

| Categoría | Cantidad | Ejemplos |
|-----------|----------|----------|
| HUMAN | 6 | Acceso no autorizado, Phishing, Error humano, etc. |
| TECHNICAL | 9 | Malware, DoS/DDoS, Inyección SQL, Ransomware, etc. |
| ENVIRONMENTAL | 4 | Desastre natural, Falla energética, Falla hardware |
| ORGANIZATIONAL | 5 | Falta de política, Falta de formación, etc. |

- Idempotente: No duplica si ya existen
- Cada amenaza especifica controles Anexo A relacionados

### 4. **Schemas API** ✓
- Archivo: `backend/app/schemas/iso_threat_catalog.py`
- `ISOThreatCatalogResponse`: Respuesta individual
- `ISOThreatCatalogByCategory`: Agrupación por categoría

### 5. **Servicio Backend** ✓
- Archivo: `backend/app/services/iso_threat_catalog_service.py`
- Funciones:
  - `get_iso_threat_catalog_all()`: Todas las amenazas
  - `get_iso_threat_catalog_by_category()`: Agrupadas por categoría
  - `get_iso_threat_catalog_by_code()`: Búsqueda por código
  - `add_iso_threat_to_risk()`: Agregar amenaza a riesgo

### 6. **Endpoints API** ✓

#### GET `/api/v1/threats/catalog`
- **Descripción**: Obtener catálogo completo agrupado por categoría
- **Autenticación**: No requiere (tabla de referencia global)
- **Respuesta**: Lista de amenazas por categoría

#### POST `/api/v1/risks/{risk_id}/threats/from-catalog`
- **Descripción**: Agregar amenaza del catálogo directamente a un riesgo
- **Body**: `{ "catalog_threat_code": "T-01" }`
- **Autenticación**: Requiere token (user organización)
- **Respuesta**: `ThreatResponse` (la amenaza creada en la organización)

### 7. **Integraciones** ✓
- Actualizado: `backend/app/models/__init__.py` - Importación del modelo
- Actualizado: `backend/app/api/v1/threats.py` - Nuevo endpoint de catálogo
- Actualizado: `backend/app/api/v1/risks.py` - Nuevo endpoint de agregar amenaza
- Actualizado: `backend/entrypoint.sh` - Auto-seed del catálogo al iniciar

### 8. **Documentación** ✓
- `backend/ISO_THREAT_CATALOG_README.md` - Guía completa
- `backend/scripts/test_iso_threat_catalog.py` - Script de validación

## 📊 Datos del Catálogo

### Amenazas HUMAN (6)
- T-01: Acceso No Autorizado → Controles: A.5.1, A.5.2, A.6.1
- T-02: Phishing → Controles: A.5.2, A.6.2, A.8.31
- T-03: Ingeniería Social → Controles: A.5.1, A.5.2, A.6.2
- T-04: Error Humano → Controles: A.5.1, A.8.1, A.8.3
- T-05: Abuso de Privilegios → Controles: A.5.1, A.5.15, A.8.1
- T-06: Fuga de Información → Controles: A.5.1, A.5.2, A.6.1

### Amenazas TECHNICAL (9)
- T-07: Malware
- T-08: Denegación de Servicio (DoS/DDoS)
- T-09: Inyección SQL
- T-10: Robo de Credenciales
- T-11: Man-in-the-Middle (MITM)
- T-12: Explotación de Vulnerabilidades
- T-13: Fallo de Autenticación
- T-14: Intercepción de Datos
- T-15: Ransomware

### Amenazas ENVIRONMENTAL (4)
- T-16: Desastre Natural
- T-17: Falla de Energía Eléctrica
- T-18: Falla de Hardware
- T-19: Fluctuaciones de Temperatura

### Amenazas ORGANIZATIONAL (5)
- T-20: Falta de Política de Seguridad
- T-21: Falta de Formación y Conciencia
- T-22: Falta de Cumplimiento Normativo
- T-23: Discontinuidad de Negocio
- T-24: Falta de Auditoría y Monitoreo

## 🚀 Uso

### Iniciar la Aplicación
```bash
docker-compose up
# El entrypoint.sh ejecutará automáticamente:
# 1. Migraciones Alembic
# 2. Seed del catálogo ISO de amenazas
```

### Obtener Catálogo
```bash
curl -X GET http://localhost:8001/api/v1/threats/catalog \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Agregar Amenaza a Riesgo
```bash
curl -X POST http://localhost:8001/api/v1/risks/{risk_id}/threats/from-catalog \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"catalog_threat_code": "T-01"}'
```

## 🔍 Características Destacadas

✅ **Separación de Responsabilidades**: Tabla de referencia independiente del modelo `Threat`
✅ **ISO 27005 Basado**: 24 amenazas de categorías reconocidas internacionalmente
✅ **Trazabilidad**: Cada amenaza mapea controles Anexo A relacionados
✅ **Reutilización**: Amenazas del catálogo se reutilizan en la organización
✅ **Idempotencia**: El seed no duplica datos en ejecuciones múltiples
✅ **Integración Fluida**: Endpoints intuitivosy integrados con el módulo de riesgos

## 📝 Notas Importantes

- El catálogo es **global** (no vinculado a organización)
- Al agregar una amenaza a un riesgo, se **crea una copia** en la organización
- Si la amenaza ya existe en la org, se **reutiliza**
- Likelihood por defecto: 3 (medio) al crear desde catálogo
- Los affected_controls se pueden usar para auditoría y compliance
- La tabla no modifica el modelo `Threat` existente

## 📦 Archivos Modificados/Creados

### Creados (7)
- `backend/app/models/iso_threat_catalog.py`
- `backend/app/schemas/iso_threat_catalog.py`
- `backend/app/services/iso_threat_catalog_service.py`
- `backend/scripts/seed_iso_threat_catalog.py`
- `backend/scripts/test_iso_threat_catalog.py`
- `backend/migrations/versions/g3b4c5d6e7f8_add_iso_threat_catalog.py`
- `backend/ISO_THREAT_CATALOG_README.md`

### Modificados (3)
- `backend/app/models/__init__.py` - +1 import
- `backend/app/api/v1/threats.py` - +1 endpoint
- `backend/app/api/v1/risks.py` - +1 endpoint
- `backend/entrypoint.sh` - +auto-seed

## ✨ Próximos Pasos Opcionales

1. Crear un endpoint PUT/PATCH para actualizar el catálogo (admin only)
2. Agregar endpoint para estadísticas del catálogo
3. Implementar búsqueda por nombre o control
4. Crear reportes de amenazas por asset o riesgo
