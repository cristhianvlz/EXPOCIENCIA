import urllib.request, json

data = json.dumps({
    'query': 'mutation { loginConTotp(username: "cristhian", password: "9046177") { token ok error needsSetup requires2fa } }'
}).encode('utf-8')

req = urllib.request.Request('http://localhost:8000/graphql/', data=data, headers={'Content-Type': 'application/json'})
try:
    res = urllib.request.urlopen(req)
    print(res.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(e)
