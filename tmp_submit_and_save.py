import sys
import os
import httpx
import time
from urllib.parse import quote


def main():
    if len(sys.argv) < 4:
        print('Usage: tmp_submit_and_save.py <TOKEN> <FILE_PATH> <comma_separated_clause_refs>')
        return 2

    TOKEN = sys.argv[1]
    FILE_PATH = sys.argv[2]
    CLAUSE_CSV = sys.argv[3]

    base = os.environ.get('API_BASE', 'http://127.0.0.1:8000')
    url = base.rstrip('/') + '/api/validate/external'

    refs = [r.strip() for r in CLAUSE_CSV.split(',') if r.strip()]
    qs = '&'.join([f'clause_refs={quote(r)}' for r in refs])
    url = url + '?' + qs

    headers = {'Authorization': f'Bearer {TOKEN}'}

    with httpx.Client(timeout=120.0) as client:
        with open(FILE_PATH, 'rb') as fh:
            files = {'file': (os.path.basename(FILE_PATH), fh, 'application/pdf')}
            resp = client.post(url, headers=headers, files=files)

        if resp.status_code >= 300:
            print('POST failed', resp.status_code)
            print(resp.text)
            return 1

        job = resp.json()
        job_id = job.get('job_id')
        if not job_id:
            print('no job_id in response')
            print(resp.text)
            return 1

        print('job_id=', job_id)

        get_url = base.rstrip('/') + f'/api/validate/external/{job_id}'
        for attempt in range(300):
            r = client.get(get_url, headers=headers)
            if r.status_code == 200:
                data = r.json()
                status = data.get('status')
                print('poll', attempt, 'status', status)
                if status in ('completed', 'failed'):
                    # write full JSON to file
                    out_path = '/app/latest_job_result.json'
                    with open(out_path, 'w', encoding='utf-8') as out:
                        out.write(r.text)
                    print('WROTE', out_path)
                    return 0
            else:
                print('poll status', r.status_code)
            time.sleep(1)

        print('timed out')
        return 2


if __name__ == '__main__':
    sys.exit(main())
