import urllib.request
import json
import urllib.error

try:
    req = urllib.request.Request(
        'http://localhost:8000/graphql/',
        data=json.dumps({'query': 'mutation { tokenAuth(username: "admin", password: "12") { token } }'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode('utf-8'))
    
    # if password is wrong, token is missing
    if 'errors' in data:
        print("Login error:", data['errors'])
        exit()
        
    token = data['data']['tokenAuth']['token']
    
    req2 = urllib.request.Request(
        'http://localhost:8000/graphql/',
        data=json.dumps({'query': '{ todosLosUsuarios { idUsuario } }'}).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'Authorization': 'JWT ' + token}
    )
    res2 = urllib.request.urlopen(req2)
    print(res2.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print('HTTP ERROR', e.code)
    print(e.read().decode('utf-8'))
except Exception as e:
    print('Error:', e)
