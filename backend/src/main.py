from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from supabase import create_client, Client
import os

app = FastAPI(title="Sistema POS Repuestos MotoGest")

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

# --- CREDENCIALES DE SUPABASE (NUBE) ---
SUPABASE_URL = "https://wsnqcrfkdjgfypnvrshx.supabase.co"
SUPABASE_KEY = "sb_secret_spUh9LTlCljlv1h9fV4rbg_eJlrCavi"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- CONEXIÓN A POSTGRESQL ---
DATABASE_URL = "postgresql+psycopg2://postgres.wsnqcrfkdjgfypnvrshx:mili_fer2026@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# --- MODELOS DE BASE DE DATOS ---
class DBVenta(Base):
    __tablename__ = "ventas"
    id = Column(Integer, primary_key=True, index=True)
    total = Column(Float, nullable=False)
    efectivo = Column(Float, default=0.0)
    transferencia = Column(Float, default=0.0)
    tarjeta = Column(Float, default=0.0)
    detalle_ticket = Column(String, nullable=False)
    fecha = Column(DateTime, default=datetime.now)

class DBProducto(Base):
    __tablename__ = "productos"
    id = Column(Integer, primary_key=True, index=True)
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

class DBEgreso(Base):
    __tablename__ = "egresos"
    id = Column(Integer, primary_key=True, index=True)
    monto = Column(Float, nullable=False)
    descripcion = Column(String, nullable=False)
    metodo = Column(String, default="Efectivo")
    fecha = Column(DateTime, default=datetime.now)

class DBRendimiento(Base):
    __tablename__ = "rendimientos"
    id = Column(Integer, primary_key=True, index=True)
    producto = Column(String, nullable=False)
    costo_produccion = Column(Float, nullable=False)
    precio_venta_estimado = Column(Float, nullable=False)
    cantidad_producida = Column(Integer, nullable=False)
    fecha = Column(DateTime, default=datetime.now)

# Esto crea las tablas automáticamente en Supabase si no existen
Base.metadata.create_all(bind=engine)

# --- ESQUEMAS PYDANTIC ---
class ItemVenta(BaseModel):
    id: int
    cantidad: float

class VentaCreate(BaseModel):
    total: float
    efectivo: float
    transferencia: float
    tarjeta: float = 0.0
    detalle_ticket: str
    items: List[ItemVenta] = []

class ProductoCreate(BaseModel):
    codigo_sku: Optional[str] = ""
    nombre: str
    marca: Optional[str] = ""
    modelos_compatibles: Optional[str] = ""
    categoria: str = "Repuesto"
    ubicacion_deposito: Optional[str] = ""
    precio_costo: float = 0.0
    precio_venta: float
    stock_actual: int = 0
    stock_minimo: int = 2
    imagen: Optional[str] = None

class EgresoCreate(BaseModel):
    monto: float
    descripcion: str
    metodo: str = "Efectivo"

class RendimientoCreate(BaseModel):
    producto: str
    costo_produccion: float
    precio_venta_estimado: float
    cantidad_producida: int

# --- RUTAS DE LA API ---
@app.post("/api/upload")
async def upload_imagen(file: UploadFile = File(...)):
    timestamp = int(datetime.now().timestamp())
    extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"prod_{timestamp}.{extension}"
    
    file_bytes = await file.read()
    
    try:
        # Sube la foto al "Bucket" de Supabase
        res = supabase.storage.from_("repuestos").upload(
            path=filename, 
            file=file_bytes, 
            file_options={"content-type": file.content_type}
        )
        # Consigue el link público de la foto en la nube
        public_url = supabase.storage.from_("repuestos").get_public_url(filename)
        return {"url": public_url}
    except Exception as e:
        print("Error subiendo foto a Supabase:", e)
        raise HTTPException(status_code=500, detail="Error al subir la imagen a la nube")

@app.post("/api/ventas")
def registrar_venta(venta: VentaCreate, db: Session = Depends(get_db)):
    nueva_venta = DBVenta(
        total=venta.total, efectivo=venta.efectivo, transferencia=venta.transferencia, 
        tarjeta=venta.tarjeta, detalle_ticket=venta.detalle_ticket
    )
    db.add(nueva_venta)
    for item in venta.items:
        prod = db.query(DBProducto).filter(DBProducto.id == item.id).first()
        if prod:
            prod.stock_actual = max(0, prod.stock_actual - int(item.cantidad))
    db.commit()
    return nueva_venta

@app.get("/api/ventas")
def obtener_ventas(db: Session = Depends(get_db)):
    return db.query(DBVenta).order_by(DBVenta.id.desc()).all()

@app.delete("/api/ventas/{id}")
def anular_venta(id: int, db: Session = Depends(get_db)):
    venta = db.query(DBVenta).filter(DBVenta.id == id).first()
    if venta:
        db.delete(venta)
        db.commit()
        return {"mensaje": "Ok"}
    raise HTTPException(status_code=404)

@app.post("/api/productos")
def crear_producto(producto: ProductoCreate, db: Session = Depends(get_db)):
    nuevo_prod = DBProducto(
        codigo_sku=producto.codigo_sku, nombre=producto.nombre, marca=producto.marca,
        modelos_compatibles=producto.modelos_compatibles, categoria=producto.categoria,
        ubicacion_deposito=producto.ubicacion_deposito, precio_costo=producto.precio_costo,
        precio_venta=producto.precio_venta, stock_actual=producto.stock_actual,
        stock_minimo=producto.stock_minimo, imagen=producto.imagen
    )
    db.add(nuevo_prod)
    db.commit()
    return {"mensaje": "Producto creado"}

@app.get("/api/productos")
def obtener_productos(db: Session = Depends(get_db)):
    return db.query(DBProducto).order_by(DBProducto.nombre).all()

@app.delete("/api/productos/{id}")
def borrar_producto(id: int, db: Session = Depends(get_db)):
    prod = db.query(DBProducto).filter(DBProducto.id == id).first()
    if prod:
        db.delete(prod)
        db.commit()
        return {"mensaje": "Ok"}
    raise HTTPException(status_code=404)

@app.put("/api/productos/{id}")
def actualizar_producto(id: int, producto: ProductoCreate, db: Session = Depends(get_db)):
    prod = db.query(DBProducto).filter(DBProducto.id == id).first()
    if not prod: raise HTTPException(status_code=404)
    prod.codigo_sku = producto.codigo_sku
    prod.nombre = producto.nombre
    prod.marca = producto.marca
    prod.modelos_compatibles = producto.modelos_compatibles
    prod.categoria = producto.categoria
    prod.ubicacion_deposito = producto.ubicacion_deposito
    prod.precio_costo = producto.precio_costo
    prod.precio_venta = producto.precio_venta
    prod.stock_actual = producto.stock_actual
    prod.stock_minimo = producto.stock_minimo
    if producto.imagen: prod.imagen = producto.imagen
    db.commit()
    return {"mensaje": "Ok"}

@app.post("/api/egresos")
def registrar_egreso(egreso: EgresoCreate, db: Session = Depends(get_db)):
    nuevo = DBEgreso(monto=egreso.monto, descripcion=egreso.descripcion, metodo=egreso.metodo)
    db.add(nuevo)
    db.commit()
    return nuevo

@app.get("/api/finanzas")
def obtener_finanzas(filtro: str = "dia", db: Session = Depends(get_db)):
    hoy = datetime.now()
    if filtro == "semana": fecha_inicio = hoy - timedelta(days=hoy.weekday())
    elif filtro == "mes": fecha_inicio = hoy.replace(day=1)
    else: fecha_inicio = hoy.replace(hour=0, minute=0, second=0, microsecond=0)

    ventas = db.query(DBVenta).filter(DBVenta.fecha >= fecha_inicio).all()
    egresos = db.query(DBEgreso).filter(DBEgreso.fecha >= fecha_inicio).order_by(DBEgreso.id.desc()).all()
    
    total_efectivo = sum(v.efectivo for v in ventas)
    total_transferencia = sum(v.transferencia for v in ventas)
    total_tarjeta = sum(v.tarjeta for v in ventas)
    total_ingresos = sum(v.total for v in ventas)
    
    egresos_efectivo = sum(e.monto for e in egresos if e.metodo == 'Efectivo')
    egresos_transferencia = sum(e.monto for e in egresos if e.metodo == 'Transferencia')
    egresos_tarjeta = sum(e.monto for e in egresos if e.metodo == 'Tarjeta')
    total_egresos = sum(e.monto for e in egresos)
    
    return {
        "ingresos": {"efectivo": total_efectivo, "transferencia": total_transferencia, "tarjeta": total_tarjeta, "total": total_ingresos},
        "egresos": {"efectivo": egresos_efectivo, "transferencia": egresos_transferencia, "tarjeta": egresos_tarjeta, "total": total_egresos},
        "balance_neto": total_ingresos - total_egresos,
        "lista_egresos": [{"id": e.id, "desc": e.descripcion, "monto": e.monto, "metodo": e.metodo, "fecha": e.fecha} for e in egresos]
    }

@app.post("/api/rendimientos")
def registrar_rendimiento(rendimiento: RendimientoCreate, db: Session = Depends(get_db)):
    nuevo = DBRendimiento(**rendimiento.dict())
    db.add(nuevo)
    db.commit()
    return nuevo

@app.get("/api/rendimientos")
def obtener_rendimientos(db: Session = Depends(get_db)):
    return db.query(DBRendimiento).order_by(DBRendimiento.id.desc()).limit(10).all()

@app.get("/api/alertas")
def obtener_alertas(db: Session = Depends(get_db)):
    alertas = []
    productos = db.query(DBProducto).all()
    for p in productos:
        if p.stock_actual <= 0:
            alertas.append({"id": f"stock_cero_{p.id}", "tipo": "error", "titulo": "¡Repuesto Agotado!", "mensaje": f"No te queda stock de '{p.nombre}'. ¡Reponelo urgente!"})
        elif p.stock_actual <= p.stock_minimo:
            alertas.append({"id": f"stock_bajo_{p.id}", "tipo": "warning", "titulo": "Alerta de Stock Mínimo", "mensaje": f"Te quedan solo {p.stock_actual} unidades de '{p.nombre}'."})
    return alertas