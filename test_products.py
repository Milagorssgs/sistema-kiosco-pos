import urllib.request, json, urllib.error
import urllib.parse
data = urllib.parse.urlencode({'username': 'admin@motogest.com', 'password': 'moto2026'}).encode('utf-8')
req = urllib.request.Request(
    'https://kiosco-backend-db.vercel.app/api/login',
    data=data,
    headers={'Content-Type': 'application/x-www-form-urlencoded'}
)
res = urllib.request.urlopen(req)
token = json.loads(res.read().decode('utf-8'))['access_token']

req2 = urllib.request.Request(
    'https://kiosco-backend-db.vercel.app/api/productos',
    headers={'Authorization': f'Bearer {token}'}
)
res2 = urllib.request.urlopen(req2)
prods = json.loads(res2.read().decode('utf-8'))
print(f"Number of products: {len(prods)}")
