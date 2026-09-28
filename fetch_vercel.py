import urllib.request
import json
url = "https://kiosco-backend-db.vercel.app/api/productos"
req = urllib.request.Request(url)
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode())
    print(json.dumps(data[:3], indent=2))
