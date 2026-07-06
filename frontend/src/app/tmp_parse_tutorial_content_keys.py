from pathlib import Path
import re
import json

text = Path('data/tutorialContent.ts').read_text(encoding='utf-8')
start = text.find('export const mainTutorials')
if start == -1:
    raise SystemExit('mainTutorials not found')
eq = text.find('=', start)
arr_start = text.find('[', eq)
if arr_start == -1:
    raise SystemExit('array start not found')

# find matching closing bracket at depth 0 for the array literal
in_str = None
depth = 0
end = None
for i in range(arr_start, len(text)):
    c = text[i]
    if in_str:
        if c == '\\':
            i += 1
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
    raise SystemExit('array end not found')

arr_text = text[arr_start:end+1]

# parse steps and sections by scanning objects
keys = []
i = 0
while i < len(arr_text):
    if arr_text[i] == '{':
        depth = 0
        in_str = None
        start_obj = i
        j = i
        while j < len(arr_text):
            c = arr_text[j]
            if in_str:
                if c == '\\':
                    j += 2
                    continue
                if c == in_str:
                    in_str = None
                j += 1
                continue
            if c in ('"', "'", '`'):
                in_str = c
                j += 1
                continue
            if c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0:
                    obj = arr_text[start_obj:j+1]
                    # step id
                    m = re.search(r"id\s*:\s*'([^']+)'", obj)
                    if m:
                        step_id = m.group(1)
                        keys.append(f'tutorial.steps.{step_id}.title')
                        keys.append(f'tutorial.steps.{step_id}.description')
                        sec_match = re.search(r'sections\s*:\s*\[', obj)
                        if sec_match:
                            sec_start = sec_match.end() - 1
                            # find matching ] for sections array within this object
                            sec_depth = 0
                            sec_in = None
                            k = sec_start
                            while k < len(obj):
                                cc = obj[k]
                                if sec_in:
                                    if cc == '\\':
                                        k += 2
                                        continue
                                    if cc == sec_in:
                                        sec_in = None
                                    k += 1
                                    continue
                                if cc in ('"', "'", '`'):
                                    sec_in = cc
                                    k += 1
                                    continue
                                if cc == '[':
                                    sec_depth += 1
                                elif cc == ']':
                                    sec_depth -= 1
                                    if sec_depth == 0:
                                        sec_body = obj[sec_start:k+1]
                                        # parse section objects within sec_body
                                        l = 0
                                        while l < len(sec_body):
                                            if sec_body[l] == '{':
                                                sdepth = 0
                                                sin = None
                                                sstart = l
                                                m2 = l
                                                while m2 < len(sec_body):
                                                    cc2 = sec_body[m2]
                                                    if sin:
                                                        if cc2 == '\\':
                                                            m2 += 2
                                                            continue
                                                        if cc2 == sin:
                                                            sin = None
                                                        m2 += 1
                                                        continue
                                                    if cc2 in ('"', "'", '`'):
                                                        sin = cc2
                                                        m2 += 1
                                                        continue
                                                    if cc2 == '{':
                                                        sdepth += 1
                                                    elif cc2 == '}':
                                                        sdepth -= 1
                                                        if sdepth == 0:
                                                            section = sec_body[sstart:m2+1]
                                                            sec_id_match = re.search(r"id\s*:\s*'([^']+)'", section)
                                                            if sec_id_match:
                                                                section_id = sec_id_match.group(1)
                                                                keys.append(f'tutorial.steps.{step_id}.sections.{section_id}.title')
                                                                keys.append(f'tutorial.steps.{step_id}.sections.{section_id}.content')
                                                                if re.search(r"action\s*:\s*(`(?:[^`]|\\.)*`|'(?:[^'\\]|\\.)*')", section):
                                                                    keys.append(f'tutorial.steps.{step_id}.sections.{section_id}.action')
                                                            l = m2
                                                            break
                                                    m2 += 1
                                            l += 1
                                        break
                                k += 1
                    i = j
                    break
            j += 1
    i += 1

Path('frontend_expected_tutorial_keys.json').write_text(json.dumps(keys, indent=2, ensure_ascii=False), encoding='utf-8')
print('WROTE', len(keys), 'keys')
