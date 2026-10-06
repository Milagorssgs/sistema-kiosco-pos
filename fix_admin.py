from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String

DATABASE_URL = "postgresql+psycopg2://postgres.wsnqcrfkdjgfypnvrshx:mili_fer2026@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class DBUsuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    local_id = Column(Integer)
    email = Column(String, unique=True, index=True)

db = SessionLocal()
usuario = db.query(DBUsuario).filter(DBUsuario.email == "admin@motogest.com").first()
if usuario:
    print(f"Usuario actual local_id: {usuario.local_id}")
    usuario.local_id = 1
    db.commit()
    print("Actualizado a local_id = 1")
else:
    print("No se encontro el usuario")
