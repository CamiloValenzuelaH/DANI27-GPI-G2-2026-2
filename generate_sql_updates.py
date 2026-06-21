import json
from pathlib import Path
p=Path('chunks_preview.json')
if not p.exists():
    print('chunks_preview.json not found')
    raise SystemExit(1)
arr=json.load(p.open(encoding='utf-8'))
sql_lines=[]
for item in arr:
    ref=item.get('clause_ref')
    preview=item.get('content_preview','')
    desc=''
    if ':' in preview:
        desc_part=preview.split(':',1)[1].strip()
        desc=desc_part.split('\n',1)[0].strip()
        if '.' in desc:
            desc=desc.split('.',1)[0].strip()+'.'
        else:
            if not desc.endswith('.'):
                desc=desc.rstrip()+' .'
    else:
        desc=preview.split('\n',1)[0].strip()
    low=desc.lower()
    if 'roles' in low or 'responsabilidades' in low:
        ev='Evidencia básica: asignación de responsable y descripción del rol.'
    elif 'formación' in low or 'concienciación' in low or 'capacitación' in low:
        ev='Evidencia básica: plan de formación y registros de capacitación.'
    elif 'privacidad' in low or 'protección de datos' in low or 'dpi' in low:
        ev='Evidencia básica: políticas de privacidad, DPIA o contratos DPA según aplique.'
    elif 'proveedor' in low or 'proveedores' in low or 'adquisic' in low:
        ev='Evidencia básica: contratos/SLA y registros de evaluación de proveedores.'
    elif 'auditor' in low or 'revisión independiente' in low or 'auditoría' in low:
        ev='Evidencia básica: informe de auditoría independiente y plan de acción.'
    elif 'incidentes' in low or 'respuesta a incidentes' in low:
        ev='Evidencia básica: procedimiento de respuesta a incidentes y registros de incidentes.'
    else:
        ev='Evidencia básica: documento pertinente y registros o ejemplos que respalden la afirmación.'
    content=f"{desc} {ev}"
    content_sql=content.replace("'","''")
    sql=f"UPDATE iso_27001_chunks SET content = '{content_sql}' WHERE clause_ref = '{ref}' AND section_type = 'annex_a';"
    sql_lines.append(sql)
out=Path('sql_updates_annex_a_93.sql')
out.write_text('\n'.join(sql_lines), encoding='utf-8')
print('WROTE', out)
