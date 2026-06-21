import sys
import os
import httpx
import time

if len(sys.argv) < 3:
    print('Usage: submit_validation.py <TOKEN> <FILE_PATH> [comma_separated_clause_refs]')
    sys.exit(2)

TOKEN = sys.argv[1]
FILE_PATH = sys.argv[2]
CLAUSE_CSV = sys.argv[3] if len(sys.argv) > 3 else ''

base = os.environ.get('API_BASE', 'http://127.0.0.1:8000')
url = base.rstrip('/') + '/api/validate/external'

if CLAUSE_CSV:
    refs = [r.strip() for r in CLAUSE_CSV.split(',') if r.strip()]
    qs = '&'.join([f'clause_refs={httpx.utils.quote(r)}' for r in refs])
    url = url + '?' + qs

headers = {'Authorization': f'Bearer {TOKEN}'}

with httpx.Client(timeout=120.0) as client:
    with open(FILE_PATH, 'rb') as fh:
        files = {'file': (os.path.basename(FILE_PATH), fh, 'application/pdf')}
        resp = client.post(url, headers=headers, files=files)

    print('STATUS', resp.status_code)
    print(resp.text)
    if resp.status_code >= 300:
        sys.exit(1)

    try:
        job = resp.json()
    except Exception:
        print('Invalid JSON response')
        sys.exit(1)

    job_id = job.get('job_id')
    if not job_id:
        print('no job_id')
        sys.exit(1)

    print('job_id=', job_id)

    # Poll for result
    get_url = base.rstrip('/') + f'/api/validate/external/{job_id}'
    for attempt in range(60):
        r = client.get(get_url, headers=headers)
        if r.status_code == 200:
            try:
                data = r.json()
                status = data.get('status')
                print('poll', attempt, 'status', status)
                if status in ('completed', 'failed'):
                    print('RESULT')
                    print(r.text)
                    sys.exit(0)
            except Exception:
                pass
        else:
            print('poll status', r.status_code)
        time.sleep(1)

    print('timed out waiting for job completion')
    sys.exit(2)
