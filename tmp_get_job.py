import httpx
import sys

JOB_ID = '00a71168-a7b1-4a19-b599-eefc8ec50021'
TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjODllMGNjNy1mZmM0LTQ1OWUtYjQ0NS1lNzQ4NWQwOTMyMjQiLCJleHAiOjE3ODE5ODY0NzEsImlhdCI6MTc4MTk4NTU3MX0.4kj3EQkexqdtN_STO0cqRRISgxRHZTbNGKUOP7bjf1A'
BASE = 'http://127.0.0.1:8000'
url = f"{BASE}/api/validate/external/{JOB_ID}"
headers = {'Authorization': f'Bearer {TOKEN}'}

with httpx.Client(timeout=60.0) as c:
    r = c.get(url, headers=headers)
    print(r.text)
    try:
        data = r.json()
        refs = [f['clause_ref'] for f in data.get('findings',[])]
        print('\nCLAUSE_REFS:', refs)
    except Exception as e:
        print('error parsing json', e)
