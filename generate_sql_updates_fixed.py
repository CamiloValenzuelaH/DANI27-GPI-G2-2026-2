import json
from pathlib import Path
p=Path('chunks_preview.json')
if not p.exists():
    print('chunks_preview.json not found')
    raise SystemExit(1)
arr=json.load(p.open(encoding='utf-8'))
# approved exact updates (use exactly these texts)
approved={
    'A.5.2': "Define y comunica roles y responsabilidades de seguridad de la información. Evidencia básica: asignación de responsable y descripción del rol.",
    'A.5.25': "Establece el procedimiento para evaluar eventos de seguridad y decidir si son incidentes. Evidencia básica: procedimiento documentado y registros de decisiones.",
    'A.5.35': "Describe la revisión independiente de la seguridad de la información. Evidencia básica: informe de auditoría con hallazgos y plan de acción.",
    'A.5.36': "Verifica el cumplimiento con políticas, reglas y normas de seguridad de la información. Evidencia básica: política vigente y registros de revisión de cumplimiento.",
    'A.6.3': "Asegura formación y concienciación en seguridad de la información. Evidencia básica: plan de formación y registros de capacitación."
}
sql_lines=[]
for item in arr:
    ref=item.get('clause_ref')
    title=item.get('title','').strip()
    if ref in approved:
        content=approved[ref]
    else:
        # use title field as the control name per instruction
        name=title
        if not name.endswith('.'):
            name=name.strip()+'.'
        content=f"{name} Evidencia básica: documento o registro que demuestre su implementación."
    content_sql=content.replace("'","''")
    sql=f"UPDATE iso_27001_chunks SET content = '{content_sql}' WHERE clause_ref = '{ref}' AND section_type = 'annex_a';"
    sql_lines.append(sql)
out=Path('sql_updates_annex_a_93_fixed.sql')
out.write_text('\n'.join(sql_lines), encoding='utf-8')
print('WROTE', out)
