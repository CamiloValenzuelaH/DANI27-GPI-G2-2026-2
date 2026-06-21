import json
p='latest_job_result.json'
out='latest_job_result_pretty.json'
with open(p, 'r', encoding='utf-8') as f:
    data = json.load(f)
with open(out, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print('wrote', out)
