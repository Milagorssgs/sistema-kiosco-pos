import urllib.request, json, urllib.error
req = urllib.request.Request(
    'https://kiosco-backend-db.vercel.app/api/superadmin/registrar-cliente',
    data=json.dumps({'nombre_local': 'MotoGest Admin', 'email': 'admin@motogest.com', 'password': 'moto2026'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
try:
    res = urllib.request.urlopen(req)
    print("Success:", res.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("Error:", e.code, e.read().decode('utf-8'))
