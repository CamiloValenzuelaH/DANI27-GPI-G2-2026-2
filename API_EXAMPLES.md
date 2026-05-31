# Ejemplos de Uso: Catálogo de Amenazas ISO 27005

## 1. Obtener el Catálogo Completo Agrupado por Categoría

### Request
```bash
curl -X GET "http://localhost:8001/api/v1/threats/catalog" \
  -H "accept: application/json"
```

### Response (200 OK)
```json
[
  {
    "category": "HUMAN",
    "threats": [
      {
        "id": "a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p",
        "code": "T-01",
        "name": "Acceso No Autorizado",
        "category": "HUMAN",
        "description": "Intento de acceso a sistemas, datos o instalaciones por personas no autorizadas. Incluye acceso físico no autorizado a servidores, centros de datos o áreas restringidas.",
        "affected_controls": [
          "A.5.1",
          "A.5.2",
          "A.6.1",
          "A.8.1",
          "A.8.2",
          "A.8.3"
        ],
        "created_at": "2026-05-27T10:30:00Z",
        "updated_at": "2026-05-27T10:30:00Z"
      },
      {
        "id": "b2c3d4e5-f6a7-4g7h-8i9j-0k1l2m3n4o5p",
        "code": "T-02",
        "name": "Phishing",
        "category": "HUMAN",
        "description": "Ataques de ingeniería social mediante correos electrónicos fraudulentos o mensajes falsificados para obtener credenciales o información sensible.",
        "affected_controls": [
          "A.5.2",
          "A.6.2",
          "A.8.31",
          "A.8.32"
        ],
        "created_at": "2026-05-27T10:30:00Z",
        "updated_at": "2026-05-27T10:30:00Z"
      },
      {
        "id": "c3d4e5f6-a7b8-4g7h-8i9j-0k1l2m3n4o5p",
        "code": "T-03",
        "name": "Ingeniería Social",
        "category": "HUMAN",
        "description": "Manipulación de personas para obtener información confidencial, credenciales o acceso a sistemas mediante pretextos o fraudes.",
        "affected_controls": [
          "A.5.1",
          "A.5.2",
          "A.6.2",
          "A.8.31"
        ],
        "created_at": "2026-05-27T10:30:00Z",
        "updated_at": "2026-05-27T10:30:00Z"
      }
    ]
  },
  {
    "category": "TECHNICAL",
    "threats": [
      {
        "id": "d4e5f6a7-b8c9-4g7h-8i9j-0k1l2m3n4o5p",
        "code": "T-07",
        "name": "Malware",
        "category": "TECHNICAL",
        "description": "Software malicioso (virus, troyanos, gusanos, ransomware) que puede infectar sistemas, robar datos o causar daño operacional.",
        "affected_controls": [
          "A.5.2",
          "A.8.1",
          "A.8.7",
          "A.8.8",
          "A.8.9",
          "A.8.32"
        ],
        "created_at": "2026-05-27T10:30:00Z",
        "updated_at": "2026-05-27T10:30:00Z"
      },
      {
        "id": "e5f6a7b8-c9d0-4g7h-8i9j-0k1l2m3n4o5p",
        "code": "T-08",
        "name": "Denegación de Servicio (DoS/DDoS)",
        "category": "TECHNICAL",
        "description": "Ataque que busca hacer un servicio no disponible mediante sobrecarga de solicitudes o explotación de vulnerabilidades.",
        "affected_controls": [
          "A.5.2",
          "A.8.1",
          "A.8.6",
          "A.8.23",
          "A.8.26"
        ],
        "created_at": "2026-05-27T10:30:00Z",
        "updated_at": "2026-05-27T10:30:00Z"
      }
    ]
  },
  {
    "category": "ENVIRONMENTAL",
    "threats": [
      {
        "id": "f6a7b8c9-d0e1-4g7h-8i9j-0k1l2m3n4o5p",
        "code": "T-16",
        "name": "Desastre Natural",
        "category": "ENVIRONMENTAL",
        "description": "Eventos naturales (terremotos, inundaciones, tormentas, incendios) que pueden destruir infraestructura física y causar indisponibilidad.",
        "affected_controls": [
          "A.5.1",
          "A.6.1",
          "A.8.1",
          "A.8.30",
          "A.8.32"
        ],
        "created_at": "2026-05-27T10:30:00Z",
        "updated_at": "2026-05-27T10:30:00Z"
      }
    ]
  },
  {
    "category": "ORGANIZATIONAL",
    "threats": [
      {
        "id": "g7a8b9c0-d1e2-4g7h-8i9j-0k1l2m3n4o5p",
        "code": "T-20",
        "name": "Falta de Política de Seguridad",
        "category": "ORGANIZATIONAL",
        "description": "Ausencia o debilidad de políticas, procedimientos y directrices de seguridad que definen responsabilidades y controles.",
        "affected_controls": [
          "A.5.1",
          "A.5.37",
          "A.6.1",
          "A.6.2"
        ],
        "created_at": "2026-05-27T10:30:00Z",
        "updated_at": "2026-05-27T10:30:00Z"
      }
    ]
  }
]
```

---

## 2. Agregar una Amenaza del Catálogo a un Riesgo

### Request
```bash
curl -X POST "http://localhost:8001/api/v1/risks/550e8400-e29b-41d4-a716-446655440000/threats/from-catalog" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "catalog_threat_code": "T-01"
  }'
```

### Response (200 OK)
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "organization_id": "770e8400-e29b-41d4-a716-446655440000",
  "name": "Acceso No Autorizado",
  "description": "Intento de acceso a sistemas, datos o instalaciones por personas no autorizadas. Incluye acceso físico no autorizado a servidores, centros de datos o áreas restringidas.",
  "category": "HUMAN",
  "likelihood": 3,
  "created_at": "2026-05-27T11:45:00Z",
  "updated_at": "2026-05-27T11:45:00Z"
}
```

### Response (404 NOT FOUND) - Si el riesgo no existe
```json
{
  "detail": "Riesgo no encontrado"
}
```

### Response (404 NOT FOUND) - Si el código de amenaza no existe
```json
{
  "detail": "Amenaza del catálogo con código 'T-999' no encontrada"
}
```

### Response (401 UNAUTHORIZED) - Si no hay token
```json
{
  "detail": "Not authenticated"
}
```

---

## 3. Flujo Completo: Crear Riesgo → Agregar Amenaza del Catálogo

### Paso 1: Crear un Riesgo
```bash
curl -X POST "http://localhost:8001/api/v1/risks" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "asset_id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "Posible acceso no autorizado a base de datos",
    "description": "Riesgo de acceso de usuarios externos a información sensible",
    "probability": 2,
    "impact": 4
  }'
```

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "organization_id": "770e8400-e29b-41d4-a716-446655440000",
  "asset_id": "660e8400-e29b-41d4-a716-446655440000",
  "name": "Posible acceso no autorizado a base de datos",
  "description": "Riesgo de acceso de usuarios externos a información sensible",
  "probability": 2,
  "impact": 4,
  "inherent_risk": 8,
  "inherent_risk_level": "medio",
  "inherent_risk_color": "amarillo",
  "residual_risk": 8,
  "residual_risk_level": "medio",
  "residual_risk_color": "amarillo",
  "treatment_probability": null,
  "treatment_impact": null,
  "created_at": "2026-05-27T11:40:00Z",
  "updated_at": "2026-05-27T11:40:00Z"
}
```

### Paso 2: Obtener Catálogo de Amenazas
```bash
curl -X GET "http://localhost:8001/api/v1/threats/catalog" \
  -H "accept: application/json" \
  -H "Authorization: Bearer {TOKEN}"
```

### Paso 3: Agregar Amenaza del Catálogo al Riesgo
```bash
curl -X POST "http://localhost:8001/api/v1/risks/550e8400-e29b-41d4-a716-446655440000/threats/from-catalog" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "catalog_threat_code": "T-01"
  }'
```

Response:
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "organization_id": "770e8400-e29b-41d4-a716-446655440000",
  "name": "Acceso No Autorizado",
  "description": "Intento de acceso a sistemas, datos o instalaciones por personas no autorizadas...",
  "category": "HUMAN",
  "likelihood": 3,
  "created_at": "2026-05-27T11:45:00Z",
  "updated_at": "2026-05-27T11:45:00Z"
}
```

---

## 4. Casos de Uso Avanzados

### Agregar Múltiples Amenazas a un Riesgo
```bash
# Amenaza 1: Acceso no autorizado
curl -X POST "http://localhost:8001/api/v1/risks/{risk_id}/threats/from-catalog" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{"catalog_threat_code": "T-01"}'

# Amenaza 2: Phishing
curl -X POST "http://localhost:8001/api/v1/risks/{risk_id}/threats/from-catalog" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{"catalog_threat_code": "T-02"}'

# Amenaza 3: Malware
curl -X POST "http://localhost:8001/api/v1/risks/{risk_id}/threats/from-catalog" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{"catalog_threat_code": "T-07"}'
```

### Filtrar Catálogo por Categoría (Frontend)
```javascript
// Obtener catálogo
const response = await fetch('/api/v1/threats/catalog');
const catalogByCategory = await response.json();

// Filtrar solo amenazas TECHNICAL
const technicalThreats = catalogByCategory.find(c => c.category === 'TECHNICAL');
console.log(technicalThreats.threats);

// Resultado: [T-07, T-08, T-09, T-10, T-11, T-12, T-13, T-14, T-15]
```

---

## 5. Códigos de Respuesta Esperados

| Código | Escenario |
|--------|-----------|
| 200 | Operación exitosa (GET, POST add threat) |
| 201 | Recurso creado (POST risk) |
| 204 | Recurso eliminado (DELETE) |
| 400 | Solicitud inválida |
| 401 | No autenticado |
| 403 | No autorizado (diferente organización) |
| 404 | Recurso no encontrado |
| 500 | Error del servidor |

---

## 6. Validaciones

### Código de Amenaza Válido
- Formato: `T-XX` donde XX es un número de 01 a 24
- Ejemplo válido: `T-01`, `T-07`, `T-20`, `T-24`

### Categorías Válidas
- `HUMAN`
- `TECHNICAL`
- `ENVIRONMENTAL`
- `ORGANIZATIONAL`

### Controles Válidos (Ejemplo)
- `A.5.1`, `A.5.2`, ..., `A.8.33` (Anexo A ISO 27001)
