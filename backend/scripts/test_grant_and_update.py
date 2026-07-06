import json
import urllib.request
import sys

BASE = 'http://localhost:8001/api/v1'

def do_login():
    url = f"{BASE}/auth/login"
    data = json.dumps({'email':'admin@alloxentric.demo','password':'Perrito2012'}).encode()
    req = urllib.request.Request(url, data=data, headers={'Content-Type':'application/json'})
    try:
        r = urllib.request.urlopen(req, timeout=10)
        body = r.read().decode()
        print('LOGIN_STATUS', r.getcode())
        print(body)
        j = json.loads(body)
        token = j['tokens']['access_token']
        return token
    except urllib.error.HTTPError as e:
        print('LOGIN_HTTP_ERROR', e.code, e.read().decode())
        sys.exit(2)
    except Exception as e:
        print('LOGIN_ERROR', e)
        sys.exit(3)


def do_update(token):
    url = f"{BASE}/audit-schedule"
    payload = {'cycle_frequency': 'monthly'}
    data = json.dumps(payload).encode()
    headers = {'Content-Type':'application/json', 'Authorization': f'Bearer {token}'}
    req = urllib.request.Request(url, data=data, headers=headers, method='PUT')
    try:
        r = urllib.request.urlopen(req, timeout=10)
        body = r.read().decode()
        print('PUT_STATUS', r.getcode())
        print(body)
    except urllib.error.HTTPError as e:
        print('PUT_HTTP_ERROR', e.code, e.read().decode())
        sys.exit(4)
    except Exception as e:
        print('PUT_ERROR', e)
        sys.exit(5)


if __name__ == '__main__':
    t = do_login()
    do_update(t)
