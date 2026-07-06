import re
from pathlib import Path
p=Path('frontend/src/app/types/index.ts')
text=p.read_text(encoding='utf-8')
lines=text.splitlines()
locales=['en','es','pt','de','fr','it']
res={l:0 for l in locales}
current=None
for line in lines:
    m=re.match(r"^\s*([a-z]{2}):\s*\{", line)
    if m:
        current=m.group(1)
    if current in locales:
        res[current]+= len(re.findall(r"'assets\.[^']+'\s*:", line))
print(res)
