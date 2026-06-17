<<<<<<< HEAD
"""Utilidades para extracción de texto desde archivos."""

import io
from pathlib import Path

import PyPDF2
from docx import Document
from openpyxl import load_workbook


async def extract_text_from_pdf(buffer: bytes, max_chars: int = 50000) -> str:
    """Extrae texto de un PDF."""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(buffer))
        text_parts = []
        for page in pdf_reader.pages:
            text_parts.append(page.extract_text())
        text = "".join(text_parts)
        return text[:max_chars]
    except Exception as e:
        raise ValueError(f"Error extrayendo PDF: {e}") from e


async def extract_text_from_docx(buffer: bytes, max_chars: int = 50000) -> str:
    """Extrae texto de un DOCX."""
    try:
        doc = Document(io.BytesIO(buffer))
        text_parts = [para.text for para in doc.paragraphs]
        text = "\n".join(text_parts)
        return text[:max_chars]
    except Exception as e:
        raise ValueError(f"Error extrayendo DOCX: {e}") from e


async def extract_text_from_excel(buffer: bytes, max_chars: int = 50000) -> str:
    """Extrae texto de un XLSX/XLS."""
    try:
        workbook = load_workbook(io.BytesIO(buffer))
        lines = []
        for sheet_name in list(workbook.sheetnames)[:5]:
            sheet = workbook[sheet_name]
            lines.append(f"--- Hoja: {sheet_name} ---")
            for row in sheet.iter_rows(values_only=True):
                row_text = " | ".join(
                    "" if cell is None else str(cell) for cell in row
                )
                if row_text.strip():
                    lines.append(row_text)
        text = "\n".join(lines)
        return text[:max_chars]
    except Exception as e:
        raise ValueError(f"Error extrayendo XLSX: {e}") from e


async def extract_text_from_file(file_path: str, max_chars: int = 50000) -> str:
    """Extrae texto desde un archivo según su tipo."""
    path = Path(file_path)
    ext = path.suffix.lower()

    # Leer archivo
    with open(file_path, "rb") as f:
        buffer = f.read()

    if ext == ".pdf":
        return await extract_text_from_pdf(buffer, max_chars)
    elif ext in {".docx", ".doc"}:
        return await extract_text_from_docx(buffer, max_chars)
    elif ext in {".xlsx", ".xls"}:
        return await extract_text_from_excel(buffer, max_chars)
    elif ext in {".txt", ".md", ".csv"}:
        return buffer.decode("utf-8")[:max_chars]
    else:
        raise ValueError(f"Tipo de archivo no soportado: {ext}")
=======
"""Utilidades para extracción de texto desde archivos."""

import io
from pathlib import Path

import PyPDF2
from docx import Document
from openpyxl import load_workbook


async def extract_text_from_pdf(buffer: bytes, max_chars: int | None = 50000) -> str:
    """Extrae texto de un PDF."""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(buffer))
        text_parts = []
        for page in pdf_reader.pages:
            text_parts.append(page.extract_text() or "")
        text = "".join(text_parts)
        return text[:max_chars] if max_chars is not None else text
    except Exception as e:
        raise ValueError(f"Error extrayendo PDF: {e}") from e


async def extract_text_from_docx(buffer: bytes, max_chars: int = 50000) -> str:
    """Extrae texto de un DOCX."""
    try:
        doc = Document(io.BytesIO(buffer))
        text_parts = [para.text for para in doc.paragraphs]
        text = "\n".join(text_parts)
        return text[:max_chars]
    except Exception as e:
        raise ValueError(f"Error extrayendo DOCX: {e}") from e


async def extract_text_from_excel(buffer: bytes, max_chars: int = 50000) -> str:
    """Extrae texto de un XLSX/XLS."""
    try:
        workbook = load_workbook(io.BytesIO(buffer))
        lines = []
        for sheet_name in list(workbook.sheetnames)[:5]:
            sheet = workbook[sheet_name]
            lines.append(f"--- Hoja: {sheet_name} ---")
            for row in sheet.iter_rows(values_only=True):
                row_text = " | ".join(
                    "" if cell is None else str(cell) for cell in row
                )
                if row_text.strip():
                    lines.append(row_text)
        text = "\n".join(lines)
        return text[:max_chars]
    except Exception as e:
        raise ValueError(f"Error extrayendo XLSX: {e}") from e


async def extract_text_from_file(file_path: str, max_chars: int | None = None) -> str:
    """Extrae texto desde un archivo según su tipo."""
    path = Path(file_path)
    ext = path.suffix.lower()

    # Leer archivo
    with open(file_path, "rb") as f:
        buffer = f.read()

    if ext == ".pdf":
        return await extract_text_from_pdf(buffer, max_chars)
    elif ext in {".docx", ".doc"}:
        return await extract_text_from_docx(buffer, max_chars)
    elif ext in {".xlsx", ".xls"}:
        return await extract_text_from_excel(buffer, max_chars)
    elif ext in {".txt", ".md", ".csv"}:
        return buffer.decode("utf-8")[:max_chars]
    else:
        raise ValueError(f"Tipo de archivo no soportado: {ext}")
>>>>>>> Chat-bot
