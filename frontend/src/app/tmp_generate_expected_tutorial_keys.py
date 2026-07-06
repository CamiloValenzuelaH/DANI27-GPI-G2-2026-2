from pathlib import Path
import re, json, subprocess, sys

path = Path('data/tutorialContent.ts')
text = path.read_text(encoding='utf-8')
text = re.sub(r'export\s+const\s+mainTutorials\s*:\s*TutorialStep\[\]\s*=\s*', 'const mainTutorials = ', text)
code = text + '\nconsole.log(JSON.stringify(mainTutorials));'
proc = subprocess.run(['node', '-e', code], capture_output=True, text=True)
if proc.returncode != 0:
    print('NODE ERROR:')
    print(proc.stderr)
    sys.exit(1)
main_tutorials = json.loads(proc.stdout)
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
print('WROTE', len(expected_keys), 'keys')
