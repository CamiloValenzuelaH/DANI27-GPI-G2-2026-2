import asyncio
import traceback
from app.workers.gemini_service import analyze_chunk_with_deepseek

if __name__ == '__main__':
    doc = (
        "El documento de ejemplo contiene políticas y procedimientos de seguridad sobre gestión "
        "de contraseñas, roles y responsabilidades, y control de acceso. Se describen procesos "
        "de rotación, almacenamiento seguro y auditoría. El texto es suficientemente largo para "
        "reproducir truncamiento si ocurre."
    )
    chunk = {
        "clause_ref": "A.6.1",
        "title": "Organización de la seguridad de la información",
        "content": (
            "La organizacion debe definir roles y responsabilidades para la gestion de la "
            "seguridad de la informacion, incluyendo la gestion de contrasenas y control de accesos."
        ),
    }

    try:
        res = asyncio.run(analyze_chunk_with_deepseek(doc, chunk))
        print('RESULT_OK:', res)
    except Exception:
        traceback.print_exc()
