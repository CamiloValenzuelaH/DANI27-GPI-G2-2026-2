from pathlib import Path
import re, json

index = Path('types/index.ts').read_text(encoding='utf-8')
m = re.search(r"es\s*:\s*\{([\s\S]*?)\n\s*\},\s*pt\s*:\s*\{", index)
if not m:
    raise SystemExit('es block not found')
block = m.group(1)
es_keys = re.findall(r"\n\s*'([^']+)':", block)
expected = json.loads(Path('frontend_expected_tutorial_keys.json').read_text(encoding='utf-8'))
missing = [k for k in expected if k not in es_keys]
extra = [k for k in es_keys if k.startswith('tutorial.steps.') and k not in expected]
print('ES KEYS', len(es_keys))
print('EXPECTED', len(expected))
print('MISSING', len(missing))
for k in missing:
    print('M', k)
print('EXTRA', len(extra))
for k in extra:
    print('X', k)
