"""Servicio para extraer contenido de archivos en diferentes formatos."""

import io
import re
from typing import Optional

try:
    from PyPDF2 import PdfReader
except ImportError:
    PdfReader = None

try:
    from docx import Document
except ImportError:
    Document = None

try:
    from openpyxl import load_workbook
except ImportError:
    load_workbook = None

try:
    from PIL import Image
    import pytesseract
except ImportError:
    Image = None
    pytesseract = None


def extract_text_from_pdf(content: bytes, max_chars: int | None = None) -> str:
    """Extrae texto de un PDF."""
    if not PdfReader:
        return "[No se pudo extraer texto: librería PyPDF2 no disponible]"
    
    try:
        pdf_file = io.BytesIO(content)
        reader = PdfReader(pdf_file)
        text_parts = []
        
        for page_num, page in enumerate(reader.pages):
            try:
                text_parts.append(f"\n--- Página {page_num + 1} ---\n")
                text_parts.append(page.extract_text() or "")
            except Exception as e:
                text_parts.append(f"[Error extrayendo página {page_num + 1}: {str(e)}]")
        
        text = "".join(text_parts)
        return text if max_chars is None else text[:max_chars]
    except Exception as e:
        return f"[Error al procesar PDF: {str(e)}]"


def extract_text_from_docx(content: bytes, max_chars: int | None = None) -> str:
    """Extrae texto de un documento Word (.docx)."""
    if not Document:
        return "[No se pudo extraer texto: librería python-docx no disponible]"
    
    try:
        docx_file = io.BytesIO(content)
        doc = Document(docx_file)
        text = ""

        core_properties = getattr(doc, "core_properties", None)
        if core_properties:
            metadata_lines = []
            if getattr(core_properties, "author", None):
                metadata_lines.append(f"Autor: {core_properties.author}")
            if getattr(core_properties, "created", None):
                metadata_lines.append(f"Creado: {core_properties.created}")
            if getattr(core_properties, "modified", None):
                metadata_lines.append(f"Modificado: {core_properties.modified}")
            if metadata_lines:
                text += "\n".join(metadata_lines) + "\n\n"
        
        for para in doc.paragraphs:
            text += para.text + "\n"
        
        # También extraer de tablas
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text for cell in row.cells)
                text += row_text + "\n"

        # Encabezados y pies de página suelen contener fecha, responsable o firma.
        for section in doc.sections:
            header = getattr(section, "header", None)
            footer = getattr(section, "footer", None)
            if header:
                for para in header.paragraphs:
                    text += para.text + "\n"
            if footer:
                for para in footer.paragraphs:
                    text += para.text + "\n"

        text = re.sub(r"[\t\r\f\v]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text).strip()
        
        return text if max_chars is None else text[:max_chars]
    except Exception as e:
        return f"[Error al procesar DOCX: {str(e)}]"


def extract_text_from_excel(content: bytes, max_chars: int | None = None) -> str:
    """Extrae texto de un archivo Excel (.xlsx, .xls)."""
    if not load_workbook:
        return "[No se pudo extraer texto: librería openpyxl no disponible]"
    
    try:
        excel_file = io.BytesIO(content)
        workbook = load_workbook(excel_file)
        text = ""
        
        for sheet_name in workbook.sheetnames[:5]:  # Máximo 5 hojas
            sheet = workbook[sheet_name]
            text += f"\n--- Hoja: {sheet_name} ---\n"
            
            for row in sheet.iter_rows(values_only=True):
                row_text = " | ".join(str(cell) if cell is not None else "" for cell in row)
                text += row_text + "\n"
        
        return text if max_chars is None else text[:max_chars]
    except Exception as e:
        return f"[Error al procesar Excel: {str(e)}]"


def extract_text_from_image(content: bytes, max_chars: int = 50000) -> str:
    """Intenta extraer texto de una imagen usando OCR básico."""
    if not Image:
        return "[No se pudo extraer texto: librería Pillow no disponible]"
    
    try:
        image_file = io.BytesIO(content)
        image = Image.open(image_file)
        
        # Información básica de la imagen
        text = f"[Imagen: {image.format} - Dimensiones: {image.size}]\n"
        
        # Si pytesseract está disponible, intentar OCR
        if pytesseract:
            try:
                ocr_text = pytesseract.image_to_string(image)
                if ocr_text.strip():
                    text += "Texto detectado:\n" + ocr_text
                else:
                    text += "[Imagen sin texto legible para OCR]"
            except Exception:
                text += "[OCR no disponible en el servidor]"
        else:
            text += "[OCR no disponible: pytesseract no instalado]"
        
        return text[:max_chars]
    except Exception as e:
        return f"[Error al procesar imagen: {str(e)}]"


def extract_text_from_txt(content: bytes, max_chars: int | None = None) -> str:
    """Extrae texto de un archivo de texto plano."""
    try:
        text = content.decode('utf-8')
        return text if max_chars is None else text[:max_chars]
    except UnicodeDecodeError:
        try:
            text = content.decode('latin-1')
            return text if max_chars is None else text[:max_chars]
        except Exception as e:
            return f"[Error al procesar archivo de texto: {str(e)}]"


def extract_text_from_file(
    content: bytes,
    file_extension: str,
    max_chars: int | None = None
) -> str:
    """
    Extrae texto del contenido del archivo basado en su extensión.
    
    Args:
        content: Bytes del contenido del archivo
        file_extension: Extensión del archivo (ej: '.pdf', '.docx')
        max_chars: Máximo número de caracteres a extraer, o None para sin límite
    
    Returns:
        Texto extraído del archivo
    """
    file_ext = file_extension.lower()
    
    if file_ext == '.pdf':
        return extract_text_from_pdf(content, max_chars)
    elif file_ext in ['.docx', '.doc']:
        return extract_text_from_docx(content, max_chars)
    elif file_ext in ['.xlsx', '.xls']:
        return extract_text_from_excel(content, max_chars)
    elif file_ext in ['.jpg', '.png', '.jpeg', '.gif', '.bmp']:
        return extract_text_from_image(content, max_chars)
    elif file_ext == '.txt':
        return extract_text_from_txt(content, max_chars)
    else:
        return f"[Tipo de archivo no soportado: {file_ext}]"
