from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String
from passlib.context import CryptContext

DATABASE_URL = "postgresql+psycopg2://postgres.wsnqcrfkdjgfypnvrshx:mili_fer2026@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class DBUsuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)

db = SessionLocal()
usuario = db.query(DBUsuario).filter(DBUsuario.email == "admin@motogest.com").first()
if usuario:
    usuario.password_hash = pwd_context.hash("emi17")
    db.commit()
    print("Contraseña actualizada con éxito.")
else:
    print("Usuario no encontrado.")
