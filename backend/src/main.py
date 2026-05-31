from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import json

from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

app = FastAPI(title="Sistema POS Kiosco Profesional")

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

DATABASE_URL = "sqlite:///./kiosco.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# ==========================================
# 1. MODELOS DE BASE DE DATOS
# ==========================================
class DBVenta(Base):
    __tablename__ = "ventas"
    id = Column(Integer, primary_key=True, index=True)
    total = Column(Float, nullable=False)
    efectivo = Column(Float, default=0.0)
    transferencia = Column(Float, default=0.0)
    detalle_ticket = Column(String, nullable=False)
    fecha = Column(DateTime, default=datetime.now)

class DBProducto(Base):
    __tablename__ = "productos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    tipo_venta = Column(String, default="simple") # 'simple', 'peso', 'variantes'
    precio_base = Column(Float, default=0.0)      # Usado para 'simple' y 'peso' (Precio x Kg)
    variantes = Column(String, default="[]")      # Guardará JSON para 'variantes'

class DBEgreso(Base):
    __tablename__ = "egresos"
    id = Column(Integer, primary_key=True, index=True)
    monto = Column(Float, nullable=False)
    descripcion = Column(String, nullable=False)
    fecha = Column(DateTime, default=datetime.now)

class DBRendimiento(Base):
    __tablename__ = "rendimientos"
    id = Column(Integer, primary_key=True, index=True)
    producto = Column(String, nullable=False)
    costo_produccion = Column(Float, nullable=False)
    precio_venta_estimado = Column(Float, nullable=False)
    cantidad_producida = Column(Integer, nullable=False)
    fecha = Column(DateTime, default=datetime.now)

Base.metadata.create_all(bind=engine)

# ==========================================
# 2. SCHEMAS (Pydantic)
# ==========================================
class VentaCreate(BaseModel):
    total: float
    efectivo: float
    transferencia: float
    detalle_ticket: str

class ProductoCreate(BaseModel):
    nombre: str
    tipo_venta: str
    precio_base: float = 0.0
    variantes: List[Dict[str, Any]] = []

class EgresoCreate(BaseModel):
    monto: float
    descripcion: str

class RendimientoCreate(BaseModel):
    producto: str
    costo_produccion: float
    precio_venta_estimado: float
    cantidad_producida: int

# ==========================================
# 3. ENDPOINTS
# ==========================================
@app.post("/api/ventas")
def registrar_venta(venta: VentaCreate, db: Session = Depends(get_db)):
    nueva_venta = DBVenta(total=venta.total, efectivo=venta.efectivo, transferencia=venta.transferencia, detalle_ticket=venta.detalle_ticket)
    db.add(nueva_venta)
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

# --- NUEVOS PRODUCTOS DINÁMICOS ---
@app.post("/api/productos")
def crear_producto(producto: ProductoCreate, db: Session = Depends(get_db)):
    vars_json = json.dumps(producto.variantes)
    nuevo_prod = DBProducto(nombre=producto.nombre, tipo_venta=producto.tipo_venta, precio_base=producto.precio_base, variantes=vars_json)
    db.add(nuevo_prod)
    db.commit()
    return {"mensaje": "Ok"}

@app.get("/api/productos")
def obtener_productos(db: Session = Depends(get_db)):
    productos = db.query(DBProducto).all()
    res = []
    for p in productos:
        res.append({
            "id": p.id,
            "nombre": p.nombre,
            "tipo_venta": p.tipo_venta,
            "precio_base": p.precio_base,
            "variantes": json.loads(p.variantes)
        })
    return res

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
    if not prod:
        raise HTTPException(status_code=404)
    
    prod.nombre = producto.nombre
    prod.tipo_venta = producto.tipo_venta
    prod.precio_base = producto.precio_base
    prod.variantes = json.dumps(producto.variantes)
    
    db.commit()
    return {"mensaje": "Ok"}

# --- FINANZAS Y PRODUCCIÓN ---
@app.post("/api/egresos")
def registrar_egreso(egreso: EgresoCreate, db: Session = Depends(get_db)):
    nuevo = DBEgreso(monto=egreso.monto, descripcion=egreso.descripcion)
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
    egresos = db.query(DBEgreso).filter(DBEgreso.fecha >= fecha_inicio).all()
    
    total_efectivo = sum(v.efectivo for v in ventas)
    total_transferencia = sum(v.transferencia for v in ventas)
    total_ingresos = sum(v.total for v in ventas)
    total_egresos = sum(e.monto for e in egresos)
    
    return {
        "ingresos": {"efectivo": total_efectivo, "transferencia": total_transferencia, "total": total_ingresos},
        "egresos_totales": total_egresos,
        "balance_neto": total_ingresos - total_egresos,
        "lista_egresos": [{"id": e.id, "desc": e.descripcion, "monto": e.monto, "fecha": e.fecha} for e in egresos]
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
    hoy = datetime.now().date()
    ayer = hoy - timedelta(days=1)

    # 1. Analizar Ventas (Hoy vs Ayer)
    ventas = db.query(DBVenta).all()
    ventas_hoy = sum(v.total for v in ventas if v.fecha.date() == hoy)
    ventas_ayer = sum(v.total for v in ventas if v.fecha.date() == ayer)
    
    # Solo avisamos si ayer hubo ventas (para no molestar el primer día de uso)
    if ventas_ayer > 0:
        if ventas_hoy < ventas_ayer:
            alertas.append({
                "id": "ventas_bajas",
                "tipo": "warning", 
                "titulo": "Ventas por debajo del promedio",
                "mensaje": f"Ayer cerraste con ${ventas_ayer}. Hoy vas ${ventas_hoy}. ¡A ofrecer promociones!"
            })
        elif ventas_hoy > ventas_ayer:
            alertas.append({
                "id": "ventas_altas",
                "tipo": "success", 
                "titulo": "¡Excelente ritmo!",
                "mensaje": f"Ya superaste las ventas de ayer (${ventas_ayer})."
            })

    # 2. Analizar Gastos Olvidados
    ultimo_egreso = db.query(DBEgreso).order_by(DBEgreso.id.desc()).first()
    if ultimo_egreso:
        dias_sin_gastos = (hoy - ultimo_egreso.fecha.date()).days
        if dias_sin_gastos >= 3:
            alertas.append({
                "id": "gastos_olvidados",
                "tipo": "info", 
                "titulo": "Posible olvido de caja",
                "mensaje": f"Hace {dias_sin_gastos} días que no registrás ningún gasto o pago a proveedores."
            })
            
    return alertas