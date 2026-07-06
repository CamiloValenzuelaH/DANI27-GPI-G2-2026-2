from pathlib import Path
import re
import json

content = Path('data/tutorialContent.ts').read_text(encoding='utf-8')
# extract the array literal for mainTutorials by removing type annotation and export
m = re.search(r'export\s+const\s+mainTutorials\s*:\s*TutorialStep\[\]\s*=\s*(\[)', content)
if not m:
    raise SystemExit('mainTutorials array start not found')
start = m.start(1)

# find matching bracket for top-level array
in_str = None
depth = 0
end = None
for i in range(start, len(content)):
    c = content[i]
    if in_str:
        if c == '\\':
            continue
        if c == in_str:
            in_str = None
        continue
    if c in ('"', "'", '`'):
        in_str = c
        continue
    if c == '[':
        depth += 1
    elif c == ']':
        depth -= 1
        if depth == 0:
            end = i
            break
if end is None:
    raise SystemExit('mainTutorials array end not found')
arr_text = content[start:end+1]
# remove type annotation if any
# not needed here

# convert to JS by replacing backticks? no need
code = 'const mainTutorials = ' + arr_text + '; console.log(JSON.stringify(mainTutorials));'

# evaluate using node via subprocess
import subprocess

result = subprocess.run(['node', '-e', code], capture_output=True, text=True)
if result.returncode != 0:
    raise SystemExit(f'node failed: {result.stderr}')

main_tutorials = json.loads(result.stdout)
expected_keys = []
for step in main_tutorials:
    expected_keys.append(f"tutorial.steps.{step['id']}.title")
    expected_keys.append(f"tutorial.steps.{step['id']}.description")
    for section in step.get('sections', []):
        expected_keys.append(f"tutorial.steps.{step['id']}.sections.{section['id']}.title")
        expected_keys.append(f"tutorial.steps.{step['id']}.sections.{section['id']}.content")
        if section.get('action') is not None:
            expected_keys.append(f"tutorial.steps.{step['id']}.sections.{section['id']}.action")

Path('frontend_expected_tutorial_keys.json').write_text(json.dumps(expected_keys, indent=2, ensure_ascii=False), encoding='utf-8')
print('WROTE frontend_expected_tutorial_keys.json', len(expected_keys))
