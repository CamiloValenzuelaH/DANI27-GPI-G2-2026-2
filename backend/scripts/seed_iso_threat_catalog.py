"""
Seed de catálogo de amenazas estandarizado basado en ISO 27005.

Uso desde `backend/`:

    python scripts/seed_iso_threat_catalog.py

Inserta las principales amenazas del catálogo ISO 27005 si no existen.
El script es idempotente: no duplica amenazas si ya existen.
"""

from __future__ import annotations

import sys
from pathlib import Path


def ensure_backend_on_path() -> None:
    script_path = Path(__file__).resolve()
    backend_dir = script_path.parent.parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))


# Catálogo de amenazas basado en ISO 27005
# Estructura: (code, name, category, description, affected_controls)
ISO_THREAT_CATALOG = [
    # HUMAN THREATS
    (
        "T-01",
        "Acceso No Autorizado",
        "HUMAN",
        "Intento de acceso a sistemas, datos o instalaciones por personas no autorizadas. Incluye acceso físico no autorizado a servidores, centros de datos o áreas restringidas.",
        ["A.5.1", "A.5.2", "A.6.1", "A.8.1", "A.8.2", "A.8.3"],
    ),
    (
        "T-02",
        "Phishing",
        "HUMAN",
        "Ataques de ingeniería social mediante correos electrónicos fraudulentos o mensajes falsificados para obtener credenciales o información sensible.",
        ["A.5.2", "A.6.2", "A.8.31", "A.8.32"],
    ),
    (
        "T-03",
        "Ingeniería Social",
        "HUMAN",
        "Manipulación de personas para obtener información confidencial, credenciales o acceso a sistemas mediante pretextos o fraudes.",
        ["A.5.1", "A.5.2", "A.6.2", "A.8.31"],
    ),
    (
        "T-04",
        "Error Humano",
        "HUMAN",
        "Fallos cometidos por empleados durante operaciones normales: borrado accidental de datos, configuración incorrecta, incumplimiento de procedimientos.",
        ["A.5.1", "A.8.1", "A.8.3", "A.8.32", "A.8.33"],
    ),
    (
        "T-05",
        "Abuso de Privilegios",
        "HUMAN",
        "Uso indebido de derechos de acceso y privilegios por parte de usuarios autorizados para acceder, modificar o eliminar datos no autorizados.",
        ["A.5.1", "A.5.15", "A.8.1", "A.8.3", "A.9.4"],
    ),
    (
        "T-06",
        "Fuga de Información Interna",
        "HUMAN",
        "Divulgación no autorizada de información sensible o confidencial por empleados, contratistas o partners, intencionalmente o accidentalmente.",
        ["A.5.1", "A.5.2", "A.6.1", "A.8.1", "A.8.2", "A.8.32"],
    ),
    # TECHNICAL THREATS
    (
        "T-07",
        "Malware",
        "TECHNICAL",
        "Software malicioso (virus, troyanos, gusanos, ransomware) que puede infectar sistemas, robar datos o causar daño operacional.",
        ["A.5.2", "A.8.1", "A.8.7", "A.8.8", "A.8.9", "A.8.32"],
    ),
    (
        "T-08",
        "Denegación de Servicio (DoS/DDoS)",
        "TECHNICAL",
        "Ataque que busca hacer un servicio no disponible mediante sobrecarga de solicitudes o explotación de vulnerabilidades.",
        ["A.5.2", "A.8.1", "A.8.6", "A.8.23", "A.8.26"],
    ),
    (
        "T-09",
        "Inyección SQL",
        "TECHNICAL",
        "Explotación de vulnerabilidades en aplicaciones web para insertar código SQL malicioso e acceder, modificar o eliminar datos de bases de datos.",
        ["A.5.2", "A.8.1", "A.8.25", "A.8.28"],
    ),
    (
        "T-10",
        "Robo de Credenciales",
        "TECHNICAL",
        "Obtención no autorizada de nombres de usuario y contraseñas mediante ataques de fuerza bruta, diccionarios o captura de tráfico.",
        ["A.5.1", "A.5.2", "A.8.1", "A.8.2", "A.8.3"],
    ),
    (
        "T-11",
        "Man-in-the-Middle (MITM)",
        "TECHNICAL",
        "Interceptación de comunicaciones entre dos partes para espiar o modificar datos en tránsito.",
        ["A.5.2", "A.8.1", "A.8.24", "A.8.25", "A.8.26"],
    ),
    (
        "T-12",
        "Explotación de Vulnerabilidades",
        "TECHNICAL",
        "Aprovechamiento de defectos de seguridad en software, firmware o configuraciones para obtener acceso no autorizado.",
        ["A.5.2", "A.8.1", "A.8.25", "A.8.28", "A.8.29"],
    ),
    (
        "T-13",
        "Fallo de Autenticación",
        "TECHNICAL",
        "Debilidad en mecanismos de autenticación que permite acceso no autorizado: contraseñas débiles, factores duplicados, sesiones sin validar.",
        ["A.5.1", "A.5.2", "A.8.1", "A.8.2", "A.8.3"],
    ),
    (
        "T-14",
        "Intercepción de Datos",
        "TECHNICAL",
        "Captura no autorizada de datos en tránsito a través de la red o en reposo en dispositivos no protegidos.",
        ["A.5.1", "A.5.2", "A.8.1", "A.8.24", "A.8.28"],
    ),
    (
        "T-15",
        "Ransomware",
        "TECHNICAL",
        "Software malicioso que cifra datos críticos y exige pago para su liberación, causando indisponibilidad y pérdida de datos.",
        ["A.5.2", "A.8.1", "A.8.7", "A.8.8", "A.8.9", "A.8.12"],
    ),
    # ENVIRONMENTAL THREATS
    (
        "T-16",
        "Desastre Natural",
        "ENVIRONMENTAL",
        "Eventos naturales (terremotos, inundaciones, tormentas, incendios) que pueden destruir infraestructura física y causar indisponibilidad.",
        ["A.5.1", "A.6.1", "A.8.1", "A.8.30", "A.8.32"],
    ),
    (
        "T-17",
        "Falla de Energía Eléctrica",
        "ENVIRONMENTAL",
        "Corte de suministro eléctrico que causa indisponibilidad de sistemas, pérdida de datos no guardados y corrupción de equipos.",
        ["A.8.1", "A.8.3", "A.8.30", "A.8.32"],
    ),
    (
        "T-18",
        "Falla de Hardware",
        "ENVIRONMENTAL",
        "Mal funcionamiento de componentes físicos (discos duros, servidores, switches) que causa pérdida de datos o indisponibilidad del servicio.",
        ["A.5.2", "A.8.1", "A.8.3", "A.8.12", "A.8.30"],
    ),
    (
        "T-19",
        "Fluctuaciones de Temperatura y Humedad",
        "ENVIRONMENTAL",
        "Variaciones extremas en condiciones ambientales que dañan equipos, acortan su vida útil o causar fallos operacionales.",
        ["A.8.1", "A.8.30", "A.8.32"],
    ),
    # ORGANIZATIONAL THREATS
    (
        "T-20",
        "Falta de Política de Seguridad",
        "ORGANIZATIONAL",
        "Ausencia o debilidad de políticas, procedimientos y directrices de seguridad que definen responsabilidades y controles.",
        ["A.5.1", "A.5.37", "A.6.1", "A.6.2"],
    ),
    (
        "T-21",
        "Falta de Formación y Conciencia",
        "ORGANIZATIONAL",
        "Personal insuficientemente capacitado en seguridad de información, desconocimiento de amenazas y mejores prácticas.",
        ["A.5.2", "A.5.37", "A.6.2", "A.8.31", "A.8.32"],
    ),
    (
        "T-22",
        "Falta de Cumplimiento Normativo",
        "ORGANIZATIONAL",
        "Incumplimiento de regulaciones, leyes o normativas de seguridad que pueden resultar en sanciones y exposición legal.",
        ["A.5.1", "A.5.2", "A.5.37", "A.6.1", "A.6.2"],
    ),
    (
        "T-23",
        "Discontinuidad de Negocio",
        "ORGANIZATIONAL",
        "Falta de planes de continuidad, recuperación de desastres o redundancia que cause indisponibilidad prolongada.",
        ["A.5.1", "A.8.30", "A.8.32"],
    ),
    (
        "T-24",
        "Falta de Auditoría y Monitoreo",
        "ORGANIZATIONAL",
        "Ausencia de mecanismos de registro, auditoría y monitoreo que impide detectar y responder a incidentes de seguridad.",
        ["A.5.2", "A.8.1", "A.8.15", "A.8.33"],
    ),
]


def seed() -> None:
    ensure_backend_on_path()

    from app.db.database import SessionLocal
    from app.models.iso_threat_catalog import ISOThreatCatalog

    db = SessionLocal()
    try:
        for code, name, category, description, controls in ISO_THREAT_CATALOG:
            # Verificar si la amenaza ya existe (idempotencia)
            existing = db.query(ISOThreatCatalog).filter(ISOThreatCatalog.code == code).first()
            if existing:
                print(f"Amenaza {code} ya existe, omitiendo...")
                continue

            threat = ISOThreatCatalog(
                code=code,
                name=name,
                category=category,
                description=description,
                affected_controls=controls,
            )
            db.add(threat)
            print(f"Insertando: {code} - {name}")

        db.commit()
        print(f"✓ Catálogo de amenazas ISO 27005 sembrado exitosamente con {len(ISO_THREAT_CATALOG)} amenazas")

    except Exception as e:
        db.rollback()
        print(f"✗ Error durante seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
