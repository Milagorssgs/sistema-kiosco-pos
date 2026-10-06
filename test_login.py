import urllib.request, json, urllib.error
import urllib.parse
data = urllib.parse.urlencode({'username': 'admin@motogest.com', 'password': 'moto2026'}).encode('utf-8')
req = urllib.request.Request(
    'https://kiosco-backend-db.vercel.app/api/login',
    data=data,
    headers={'Content-Type': 'application/x-www-form-urlencoded'}
)
try:
    res = urllib.request.urlopen(req)
    print("Success:", res.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("Error:", e.code, e.read().decode('utf-8'))
