import time
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql+psycopg2://postgres.wsnqcrfkdjgfypnvrshx:mili_fer2026@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE ventas ADD COLUMN IF NOT EXISTS subtotal FLOAT DEFAULT 0.0;"))
        conn.execute(text("ALTER TABLE ventas ADD COLUMN IF NOT EXISTS tipo_ajuste VARCHAR DEFAULT 'ninguno';"))
        conn.execute(text("ALTER TABLE ventas ADD COLUMN IF NOT EXISTS porcentaje_ajuste FLOAT DEFAULT 0.0;"))
        conn.execute(text("ALTER TABLE ventas ADD COLUMN IF NOT EXISTS monto_ajuste FLOAT DEFAULT 0.0;"))
        conn.commit()
    print("Database columns added successfully.")
except Exception as e:
    print("Error:", e)
