import json
from sqlalchemy import create_engine, MetaData, Table

DATABASE_URL = "postgresql+psycopg2://postgres.wsnqcrfkdjgfypnvrshx:mili_fer2026@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require"

engine = create_engine(DATABASE_URL)
metadata = MetaData()
metadata.reflect(bind=engine)

productos_table = Table("productos", metadata, autoload_with=engine)

def dict_helper(row):
    d = dict(row._mapping)
    for k, v in d.items():
        if hasattr(v, "isoformat"):
            d[k] = v.isoformat()
    return d

with engine.connect() as conn:
    result = conn.execute(productos_table.select()).fetchall()
    productos = [dict_helper(row) for row in result]
    
    with open("productos_backup.json", "w", encoding="utf-8") as f:
        json.dump(productos, f, indent=2, ensure_ascii=False)

print(f"Backup creado exitosamente. {len(productos)} productos guardados en productos_backup.json")
