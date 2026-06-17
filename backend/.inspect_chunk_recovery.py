import asyncio
from pathlib import Path
from sqlalchemy import create_engine, text
from app.core.config import settings
import importlib.util

BASE_DIR = Path(__file__).resolve().parent
WORKSPACE_DIR = BASE_DIR.parent
PDF_RELATIVE = Path('..') / 'UNIVERSIDAD' / 'gestion de proyectos' / 'alloxentric' / 'ISO 27001-2022 Español.pdf'
PDF_PATH = (BASE_DIR / PDF_RELATIVE).resolve()
print('BASE_DIR=', BASE_DIR)
print('WORKSPACE_DIR=', WORKSPACE_DIR)
print('PDF_PATH=', PDF_PATH)
print('PDF_EXISTS=', PDF_PATH.exists())

try:
    import PyPDF2
except Exception as exc:
    print('PyPDF2 import failed:', type(exc).__name__, exc)
    raise

if PDF_PATH.exists():
    reader = PyPDF2.PdfReader(str(PDF_PATH))
    print('PDF_NUM_PAGES=', len(reader.pages))
    for page_index in [6, 7, 8]:
        if page_index >= len(reader.pages):
            print(f'PAGE {page_index+1} OUT OF RANGE')
            continue
        page = reader.pages[page_index]
        text = page.extract_text() or ''
        print(f'--- PAGE {page_index+1} START ---')
        print(text[:4000])
        print(f'--- PAGE {page_index+1} END ---')
else:
    print('PDF not found; skipping PDF extraction')

print('\n--- DATABASE CHECK ---')
print('DATABASE_URL=', settings.database_url)
engine = create_engine(settings.database_url)
with engine.connect() as conn:
    cnt = conn.execute(text('SELECT COUNT(*) FROM iso_27001_chunks')).scalar_one()
    print('ISO_CHUNKS=', cnt)
    rows = conn.execute(text('SELECT clause_ref, title, substring(content,1,200) AS preview FROM iso_27001_chunks WHERE clause_ref LIKE :pref ORDER BY clause_ref'), {'pref': 'A.5%'}).fetchall()
    print('A.5 CHUNKS COUNT=', len(rows))
    for row in rows:
        print('ROW:', row[0], row[1], repr(row[2]))

print('\n--- EMBEDDING QUERY ---')
# Load gemini_service from file to avoid importing app.workers package init with pandas dependency
spec = importlib.util.spec_from_file_location('gemini_service', BASE_DIR / 'app' / 'workers' / 'gemini_service.py')
gemini = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gemini)

async def query_embedding():
    query_text = 'A.5.2 roles y responsabilidades de seguridad de la información'
    print('QUERY_TEXT=', query_text)
    emb = await gemini.generate_embedding(query_text)
    print('EMBEDDING LENGTH=', len(emb))
    print('EMBEDDING SAMPLE=', emb[:10])
    emb_literal = '[' + ','.join(f'{float(v):.8f}' for v in emb) + ']'
    with engine.connect() as conn:
        results = conn.execute(
            text(
                'SELECT clause_ref, title, 1 - (embedding <=> CAST(:embedding AS vector)) AS relevance_score '
                'FROM iso_27001_chunks WHERE embedding IS NOT NULL ORDER BY embedding <=> CAST(:embedding AS vector) LIMIT 10'
            ),
            {'embedding': emb_literal}
        ).fetchall()
    print('TOP_K=', len(results))
    for row in results:
        print('RESULT:', row[0], row[1], row[2])

asyncio.run(query_embedding())
