import urllib.request
import json
url = "https://kiosco-backend-db.vercel.app/api/productos"
data = {
    "nombre": "Test Product Rotating Bug",
    "precio_venta": 1000
}
req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as response:
    print(response.read().decode())
