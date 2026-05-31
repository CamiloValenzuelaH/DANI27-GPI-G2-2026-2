# Guía de Inicio Rápido: Catálogo de Amenazas ISO 27005

## 🚀 Inicio Rápido (5 minutos)

### Opción 1: Con Docker Compose (Recomendado)
```bash
# Desde la raíz del proyecto
cd /c/Users/Camilo/Desktop/DANI27-GPI-G2-2026-2-develop

# Levantar los servicios
docker-compose up

# El sistema ejecutará automáticamente:
# 1. ✅ Migraciones Alembic
# 2. ✅ Seed del catálogo (24 amenazas)
# 3. ✅ Inicia el backend en puerto 8001

# En otra terminal, verificar que está listo:
curl http://localhost:8001/health
# Resultado: {"status":"ok","app":"..."}
```

### Opción 2: Ejecución Manual en Desarrollo
```bash
cd backend

# 1. Asegurarse de que el entorno virtual está activado
# (o usar docker exec si está en contenedor)

# 2. Aplicar migraciones
python -m alembic upgrade head

# 3. Ejecutar seed
python scripts/seed_iso_threat_catalog.py

# 4. Iniciar servidor
uvicorn main:app --reload
```

---

## 📝 Primeras Pruebas

### Test 1: Obtener el Catálogo Completo
```bash
# Sin autenticación requerida
curl -X GET "http://localhost:8001/api/v1/threats/catalog" \
  -H "accept: application/json"

# Respuesta esperada:
# [
#   {
#     "category": "HUMAN",
#     "threats": [
#       {"code": "T-01", "name": "Acceso No Autorizado", ...},
#       {"code": "T-02", "name": "Phishing", ...},
#       ...
#     ]
#   },
#   {
#     "category": "TECHNICAL",
#     "threats": [...]
#   },
#   ...
# ]
```

### Test 2: Verificar en la Base de Datos
```bash
# Conectar a PostgreSQL
psql postgresql://postgres:password1234@localhost:5433/dani27001

# Listar amenazas
SELECT COUNT(*) as total_amenazas FROM iso_threat_catalog;
# Resultado: 24

# Ver por categoría
SELECT category, COUNT(*) FROM iso_threat_catalog GROUP BY category;
# Resultado:
# HUMAN         | 6
# TECHNICAL     | 9
# ENVIRONMENTAL | 4
# ORGANIZATIONAL| 5

# Salir
\q
```

### Test 3: Agregar Amenaza a un Riesgo (Requiere Token)
```bash
# Variables
RISK_ID="550e8400-e29b-41d4-a716-446655440000"  # Cambiar por ID real
TOKEN="your-jwt-token-here"

# Agregar amenaza
curl -X POST "http://localhost:8001/api/v1/risks/$RISK_ID/threats/from-catalog" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"catalog_threat_code": "T-01"}'

# Respuesta esperada:
# {
#   "id": "uuid",
#   "organization_id": "org-uuid",
#   "name": "Acceso No Autorizado",
#   "category": "HUMAN",
#   "likelihood": 3,
#   ...
# }
```

---

## 📚 Documentación Completa

| Documento | Contenido |
|-----------|----------|
| **ISO_THREAT_CATALOG_README.md** | Guía técnica completa del catálogo |
| **IMPLEMENTATION_SUMMARY.md** | Resumen de cambios implementados |
| **API_EXAMPLES.md** | Ejemplos detallados de API |
| **ARCHITECTURE_DIAGRAM.md** | Arquitectura e integración |
| **CHECKLIST.md** | Lista de verificación completa |
| **QUICK_START.md** | Este documento |

---

## 🔍 Verificación de Salud

### 1. Verificar Componentes
```bash
cd backend
python scripts/test_iso_threat_catalog.py

# Resultado esperado:
# ✓ Esquemas ISO Threat Catalog importados correctamente
# ✓ Archivo de migración encontrado
# ✓ Script de seed contiene 24 amenazas
# ✓ Todas las amenazas tienen estructura válida
```

### 2. Verificar Base de Datos
```bash
# Contar amenazas
psql postgresql://postgres:password1234@localhost:5433/dani27001 \
  -c "SELECT COUNT(*) FROM iso_threat_catalog;"

# Resultado esperado: 24
```

### 3. Verificar API
```bash
# Obtener catálogo
curl http://localhost:8001/api/v1/threats/catalog \
  | jq 'length'

# Resultado esperado: 4 (categorías)
```

---

## 🎯 Flujo Típico de Uso

### Paso 1: Usuario Crea un Riesgo
```bash
curl -X POST "http://localhost:8001/api/v1/risks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "asset_id": "asset-uuid",
    "name": "Posible acceso no autorizado",
    "probability": 3,
    "impact": 4
  }'

# Guardar risk_id de la respuesta
```

### Paso 2: Frontend Muestra Catálogo
```javascript
// Obtener catálogo
const catalog = await fetch('/api/v1/threats/catalog').then(r => r.json());

// Mostrar amenazas por categoría
catalog.forEach(category => {
  console.log(category.category);
  category.threats.forEach(threat => {
    console.log(`  ${threat.code}: ${threat.name}`);
  });
});
```

### Paso 3: Usuario Selecciona una Amenaza
```javascript
// Usuario selecciona "T-01 - Acceso No Autorizado"
const selectedCode = "T-01";

// Enviar al backend
await fetch(`/api/v1/risks/${riskId}/threats/from-catalog`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    catalog_threat_code: selectedCode
  })
});

// ✅ La amenaza se agregó al riesgo
```

---

## 🐛 Troubleshooting

### Problema: "Table iso_threat_catalog not found"
**Solución**: Ejecutar migraciones
```bash
cd backend
python -m alembic upgrade head
```

### Problema: "No seeds encontrados en iso_threat_catalog"
**Solución**: Ejecutar el script de seed
```bash
python scripts/seed_iso_threat_catalog.py
```

### Problema: Errores de importación
**Solución**: Verificar que `ISOThreatCatalog` está en `/backend/app/models/__init__.py`
```python
from app.models.iso_threat_catalog import ISOThreatCatalog
```

### Problema: Status 401 en agregar amenaza
**Solución**: Token inválido o expirado. Obtener nuevo token:
```bash
curl -X POST "http://localhost:8001/api/v1/auth/login" \
  -d '{"username":"user","password":"pass"}'
```

### Problema: Status 404 en riesgo
**Solución**: Verificar que el risk_id existe y pertenece a la organización:
```bash
# Obtener riesgos
curl "http://localhost:8001/api/v1/risks" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Estadísticas del Catálogo

```
Total de Amenazas: 24

HUMAN (25%)
├─ T-01: Acceso No Autorizado
├─ T-02: Phishing
├─ T-03: Ingeniería Social
├─ T-04: Error Humano
├─ T-05: Abuso de Privilegios
└─ T-06: Fuga de Información

TECHNICAL (37.5%)
├─ T-07: Malware
├─ T-08: DoS/DDoS
├─ T-09: Inyección SQL
├─ T-10: Robo de Credenciales
├─ T-11: Man-in-the-Middle
├─ T-12: Explotación de Vulnerabilidades
├─ T-13: Fallo de Autenticación
├─ T-14: Intercepción de Datos
└─ T-15: Ransomware

ENVIRONMENTAL (16.7%)
├─ T-16: Desastre Natural
├─ T-17: Falla de Energía
├─ T-18: Falla de Hardware
└─ T-19: Fluctuaciones de Temperatura

ORGANIZATIONAL (20.8%)
├─ T-20: Falta de Política
├─ T-21: Falta de Formación
├─ T-22: Falta de Cumplimiento
├─ T-23: Discontinuidad de Negocio
└─ T-24: Falta de Auditoría
```

---

## 🔐 Seguridad

| Aspecto | Implementación |
|--------|-----------------|
| Autenticación | Requerida para agregar amenazas |
| Autorización | Validación de organización |
| Aislamiento | Datos separados por org |
| Integridad | Constraints UNIQUE en código |
| Auditoría | Timestamps created_at, updated_at |

---

## 🚨 Próximos Pasos

### Fase 1: Testing
- [x] Pruebas unitarias (completar)
- [x] Pruebas integración (completar)
- [ ] Pruebas load testing
- [ ] Pruebas seguridad

### Fase 2: Optimización
- [ ] Implementar caching en GET /catalog
- [ ] Agregar paginación (si catálogo crece)
- [ ] Optimizar índices si es necesario

### Fase 3: Extensiones
- [ ] Admin endpoint para actualizar catálogo
- [ ] Reportes de amenazas por asset
- [ ] Estadísticas de catálogo
- [ ] Búsqueda/filtro por controles

---

## ✅ Checklist de Deployment

- [ ] Código pushed a repository
- [ ] Migraciones testadas en dev
- [ ] Seed testado en dev
- [ ] Endpoints testados con token
- [ ] Documentación actualizada
- [ ] CI/CD pipeline pasando
- [ ] Code review completado
- [ ] Testing en staging environment
- [ ] Performance testing completado
- [ ] Rollback plan documentado
- [ ] Monitoring configurado
- [ ] On-call procedure establecido
- [ ] Deploy a producción

---

## 📞 Support

Para problemas o dudas:
1. Revisar documentación en `/backend/ISO_THREAT_CATALOG_README.md`
2. Ejecutar script de test: `python scripts/test_iso_threat_catalog.py`
3. Revisar logs de Docker: `docker-compose logs backend`
4. Consultar archivo ARCHITECTURE_DIAGRAM.md

---

**¡Listo para usar! 🎉**
