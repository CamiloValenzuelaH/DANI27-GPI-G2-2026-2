import os
import json
from sqlalchemy import create_engine, text

refs = ['A.5.2', 'A.5.25', 'A.5.35', 'A.5.36', 'A.6.3']

# Try to get DATABASE_URL from env or backend/.env
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    # try to read backend/.env
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
    print('No DATABASE_URL found in environment or backend/.env', flush=True)
    raise SystemExit(1)

print('Using DATABASE_URL:', DATABASE_URL, flush=True)

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    sql = text("SELECT clause_ref, title, content FROM iso_27001_chunks WHERE clause_ref = ANY(:refs) ORDER BY clause_ref")
    result = conn.execute(sql, {'refs': refs})
    rows = []
    for r in result:
        rows.append({'clause_ref': r['clause_ref'], 'title': r['title'], 'content': r['content']})

print(json.dumps(rows, ensure_ascii=False, indent=2))
