import os
import json
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    try:
        with open('backend/.env', 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line.startswith('DATABASE_URL='):
                    DATABASE_URL = line.split('=',1)[1]
                    break
    except Exception:
        pass

if not DATABASE_URL:
    print('No DATABASE_URL found', flush=True)
    raise SystemExit(1)

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    sql = text("SELECT clause_ref, title, LEFT(content, 120) as content_preview FROM iso_27001_chunks WHERE section_type = 'annex_a' ORDER BY clause_ref")
    result = conn.execute(sql)
    rows = []
    for r in result.mappings():
        rows.append({'clause_ref': r['clause_ref'], 'title': r['title'], 'content_preview': r['content_preview']})

out='/app/chunks_preview.json'
with open(out, 'w', encoding='utf-8') as f:
    json.dump(rows, f, ensure_ascii=False, indent=2)
print('WROTE', out)
