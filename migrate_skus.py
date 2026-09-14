import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class DBProducto(Base):
    __tablename__ = "productos"
    id = Column(Integer, primary_key=True, index=True)
    local_id = Column(Integer, default=1)
    codigo_sku = Column(String, index=True, nullable=True)
    nombre = Column(String, nullable=False)
    marca = Column(String, default="")
    modelos_compatibles = Column(String, default="")
    categoria = Column(String, default="Repuesto")
    ubicacion_deposito = Column(String, default="")
    precio_costo = Column(Float, default=0.0)
    precio_venta = Column(Float, nullable=False)
    stock_actual = Column(Integer, default=0)
    stock_minimo = Column(Integer, default=2)
    imagen = Column(String, nullable=True)

DATABASE_URL = "postgresql+psycopg2://postgres.wsnqcrfkdjgfypnvrshx:mili_fer2026@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def migrate_skus():
    db = SessionLocal()
    try:
        productos = db.query(DBProducto).order_by(DBProducto.id).all()
        current_seq = 1
        
        for prod in productos:
            # Generate 4 digit code (e.g., 0001, 0002)
            new_sku = f"{current_seq:04d}"
            prod.codigo_sku = new_sku
            current_seq += 1
            
        db.commit()
        print(f"Migrados {len(productos)} productos con códigos secuenciales.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_skus()
