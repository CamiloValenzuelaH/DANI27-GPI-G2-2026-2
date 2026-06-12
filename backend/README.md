## 🛠️ Configuración del Entorno

### Requisitos
- **Python:** 3.12.9
- **Base de Datos:** PostgreSQL 15+ en local

### Variables de entorno relevantes
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`
- `REDIS_URL`

### Pasos para levantar el Backend
1. **Clonar el repo e entrar a la carpeta:**
   ```bash
   git clone ...
   cd backend

### Dashboard Metrics API
- Endpoint: `GET /api/v1/dashboard/metrics`
- Scope: devuelve KPIs de documentación, implementación y testeo por organización autenticada.
- Frontend local esperado: `http://localhost:5174`
- Backend local esperado: `http://localhost:8001`

El endpoint usa la `DATABASE_URL` cargada desde `backend/.env` y calcula un resumen agregado más una tendencia mensual de los últimos 5 meses.