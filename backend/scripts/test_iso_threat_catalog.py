"""
Script de validación para la implementación del catálogo de amenazas ISO 27005.

Uso desde `backend/`:
    python scripts/test_iso_threat_catalog.py
"""

from __future__ import annotations

import sys
from pathlib import Path


def ensure_backend_on_path() -> None:
    script_path = Path(__file__).resolve()
    backend_dir = script_path.parent.parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))


def validate_models() -> bool:
    """Validar que los modelos se importan correctamente"""
    try:
        ensure_backend_on_path()
        from app.models.iso_threat_catalog import ISOThreatCatalog
        print("✓ Modelo ISOThreatCatalog importado correctamente")
        return True
    except Exception as e:
        print(f"✗ Error al importar modelo: {e}")
        return False


def validate_schemas() -> bool:
    """Validar que los esquemas se importan correctamente"""
    try:
        ensure_backend_on_path()
        from app.schemas.iso_threat_catalog import (
            ISOThreatCatalogResponse,
            ISOThreatCatalogByCategory,
        )
        print("✓ Esquemas ISO Threat Catalog importados correctamente")
        return True
    except Exception as e:
        print(f"✗ Error al importar esquemas: {e}")
        return False


def validate_services() -> bool:
    """Validar que los servicios se importan correctamente"""
    try:
        ensure_backend_on_path()
        from app.services import iso_threat_catalog_service
        print("✓ Servicio iso_threat_catalog_service importado correctamente")
        return True
    except Exception as e:
        print(f"✗ Error al importar servicio: {e}")
        return False


def validate_endpoints() -> bool:
    """Validar que los endpoints se importan correctamente"""
    try:
        ensure_backend_on_path()
        from app.api.v1 import threats, risks
        print("✓ Endpoints (threats, risks) importados correctamente")
        return True
    except Exception as e:
        print(f"✗ Error al importar endpoints: {e}")
        return False


def validate_migration() -> bool:
    """Validar que el archivo de migración existe"""
    try:
        migration_file = Path(__file__).parent.parent / "migrations" / "versions" / "g3b4c5d6e7f8_add_iso_threat_catalog.py"
        if migration_file.exists():
            print(f"✓ Archivo de migración encontrado: {migration_file.name}")
            return True
        else:
            print(f"✗ Archivo de migración no encontrado: {migration_file}")
            return False
    except Exception as e:
        print(f"✗ Error al validar migración: {e}")
        return False


def validate_seed_data() -> bool:
    """Validar que el script de seed tiene datos válidos"""
    try:
        ensure_backend_on_path()
        from scripts.seed_iso_threat_catalog import ISO_THREAT_CATALOG
        
        if len(ISO_THREAT_CATALOG) >= 20:
            print(f"✓ Script de seed contiene {len(ISO_THREAT_CATALOG)} amenazas (mínimo 20 requerido)")
            
            # Validar estructura
            for code, name, category, description, controls in ISO_THREAT_CATALOG:
                if not all([code, name, category, description, isinstance(controls, list)]):
                    print(f"✗ Amenaza inválida: {code}")
                    return False
            
            print(f"✓ Todas las amenazas tienen estructura válida")
            return True
        else:
            print(f"✗ Script de seed contiene {len(ISO_THREAT_CATALOG)} amenazas (mínimo 20 requerido)")
            return False
    except Exception as e:
        print(f"✗ Error al validar seed data: {e}")
        return False


def main() -> None:
    print("=" * 60)
    print("VALIDACIÓN: Catálogo de Amenazas ISO 27005")
    print("=" * 60)
    print()

    results = [
        ("Modelos", validate_models()),
        ("Esquemas", validate_schemas()),
        ("Servicios", validate_services()),
        ("Endpoints", validate_endpoints()),
        ("Migración Alembic", validate_migration()),
        ("Seed Data", validate_seed_data()),
    ]

    print()
    print("=" * 60)
    print("RESUMEN")
    print("=" * 60)
    
    all_passed = True
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{name}: {status}")
        if not passed:
            all_passed = False

    print()
    if all_passed:
        print("✓ Todas las validaciones pasaron correctamente")
        print()
        print("Próximos pasos:")
        print("1. Ejecutar migraciones: alembic upgrade head")
        print("2. Ejecutar seed: python scripts/seed_iso_threat_catalog.py")
        print("3. Probar endpoints:")
        print("   - GET /api/v1/threats/catalog")
        print("   - POST /api/v1/risks/{risk_id}/threats/from-catalog")
    else:
        print("✗ Algunas validaciones fallaron")
        sys.exit(1)


if __name__ == "__main__":
    main()
