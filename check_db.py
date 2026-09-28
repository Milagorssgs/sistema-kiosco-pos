from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql+psycopg2://postgres.wsnqcrfkdjgfypnvrshx:mili_fer2026@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    res = conn.execute(text("SELECT id, nombre, codigo_sku FROM productos ORDER BY id DESC LIMIT 5")).fetchall()
    for r in res:
        print(r)
