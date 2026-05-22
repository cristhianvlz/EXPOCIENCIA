import urllib.request
import json
import urllib.error

query = '{ __type(name: "UsuarioType") { fields { name } } }'

req = urllib.request.Request(
    'http://localhost:8000/graphql/',
    data=json.dumps({'query': query}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    res = urllib.request.urlopen(req)
    print(res.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print('HTTP ERROR', e.code)
    print(e.read().decode('utf-8'))
