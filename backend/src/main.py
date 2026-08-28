from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from supabase import create_client, Client
import os

app = FastAPI(title="Sistema POS Repuestos MotoGest Multi-Local")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SEGURIDAD Y TOKENS ---
SECRET_KEY = "SUPER_SECRETO_MOTOGEST_2026_NO_COMPARTIR"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# El auto_error=False es la magia: si React no manda token, no tira error (Retrocompatibilidad)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login", auto_error=False) 

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

# --- MODELOS DE BASE DE DATOS ACTUALIZADOS ---
class DBLocal(Base):
    __tablename__ = "locales"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    fecha_alta = Column(DateTime, default=datetime.now)

class DBUsuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    local_id = Column(Integer, default=1)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    rol = Column(String, default="admin")

class DBVenta(Base):
    __tablename__ = "ventas"
    id = Column(Integer, primary_key=True, index=True)
    local_id = Column(Integer, default=1)
    total = Column(Float, nullable=False)
    efectivo = Column(Float, default=0.0)
    transferencia = Column(Float, default=0.0)
    tarjeta = Column(Float, default=0.0)
    detalle_ticket = Column(String, nullable=False)
    fecha = Column(DateTime, default=datetime.now)

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

class DBEgreso(Base):
    __tablename__ = "egresos"
    id = Column(Integer, primary_key=True, index=True)
    local_id = Column(Integer, default=1)
    monto = Column(Float, nullable=False)
    descripcion = Column(String, nullable=False)
    metodo = Column(String, default="Efectivo")
    fecha = Column(DateTime, default=datetime.now)

class DBRendimiento(Base):
    __tablename__ = "rendimientos"
    id = Column(Integer, primary_key=True, index=True)
    local_id = Column(Integer, default=1)
    producto = Column(String, nullable=False)
    costo_produccion = Column(Float, nullable=False)
    precio_venta_estimado = Column(Float, nullable=False)
    cantidad_producida = Column(Integer, nullable=False)
    fecha = Column(DateTime, default=datetime.now)

class DBPresupuesto(Base):
    __tablename__ = "presupuestos"
    id = Column(Integer, primary_key=True, index=True)
    local_id = Column(Integer, default=1)
    cliente = Column(String, default="Consumidor Final")
    total = Column(Float, nullable=False)
    detalle_ticket = Column(String, nullable=False) # Guardaremos los items acá
    observaciones = Column(String, default="")
    fecha = Column(DateTime, default=datetime.now)

Base.metadata.create_all(bind=engine)

# --- DEPENDENCIA DE SEGURIDAD (EL GUARDIÁN) ---
def get_usuario_actual(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    # TRUCO DE RETROCOMPATIBILIDAD: Si entran sin Token (El React actual), asumimos que es el Local 1
    if not token:
        return DBUsuario(local_id=1, email="sistema_antiguo@local1.com")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        usuario = db.query(DBUsuario).filter(DBUsuario.email == email).first()
        if usuario is None:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        return usuario
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expirado o inválido")

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

# --- HERRAMIENTA EXCLUSIVA PARA EL DUEÑO DEL SISTEMA ---
class NuevoCliente(BaseModel):
    nombre_local: str
    email: str
    password: str

@app.post("/api/superadmin/registrar-cliente")
def registrar_nuevo_cliente(cliente: NuevoCliente, db: Session = Depends(get_db)):
    """Usá esta ruta desde el Swagger (/docs) para dar de alta a los locales que te compren el sistema"""
    
    # 1. Verificamos que el mail no esté repetido
    existe = db.query(DBUsuario).filter(DBUsuario.email == cliente.email).first()
    if existe:
        raise HTTPException(status_code=400, detail="Este email ya está registrado")
    
    # 2. Creamos el nuevo negocio en la base de datos
    nuevo_local = DBLocal(nombre=cliente.nombre_local)
    db.add(nuevo_local)
    db.commit() 
    db.refresh(nuevo_local) # Esto nos devuelve el ID que le tocó al local
    
    # 3. Le creamos su usuario seguro vinculado a ese negocio
    nuevo_usuario = DBUsuario(
        local_id=nuevo_local.id,
        email=cliente.email,
        password_hash=pwd_context.hash(cliente.password),
        rol="admin"
    )
    db.add(nuevo_usuario)
    db.commit()
    
    return {
        "mensaje": "¡Cliente registrado con éxito!",
        "local_id": nuevo_local.id,
        "negocio": cliente.nombre_local,
        "email_acceso": cliente.email
    }
@app.post("/api/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = db.query(DBUsuario).filter(DBUsuario.email == form_data.username).first()
    if not usuario or not pwd_context.verify(form_data.password, usuario.password_hash):
        raise HTTPException(status_code=400, detail="Email o contraseña incorrectos")
    
    token_data = {"sub": usuario.email, "exp": datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)}
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    
    return {"access_token": token, "token_type": "bearer", "local_id": usuario.local_id}

# --- RUTAS DE LA API (AHORA PROTEGIDAS Y FILTRADAS POR LOCAL) ---
@app.post("/api/upload")
async def upload_imagen(file: UploadFile = File(...)):
    # La subida de imagen se mantiene igual porque Supabase maneja los archivos globalmente
    timestamp = int(datetime.now().timestamp())
    extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"prod_{timestamp}.{extension}"
    file_bytes = await file.read()
    try:
        supabase.storage.from_("repuestos").upload(path=filename, file=file_bytes, file_options={"content-type": file.content_type})
        return {"url": supabase.storage.from_("repuestos").get_public_url(filename)}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al subir la imagen")

@app.post("/api/ventas")
def registrar_venta(venta: VentaCreate, db: Session = Depends(get_db), usuario: DBUsuario = Depends(get_usuario_actual)):
    nueva_venta = DBVenta(
        local_id=usuario.local_id, # Se asigna al local del usuario logueado
        total=venta.total, efectivo=venta.efectivo, transferencia=venta.transferencia, 
        tarjeta=venta.tarjeta, detalle_ticket=venta.detalle_ticket
    )
    db.add(nueva_venta)
    for item in venta.items:
        prod = db.query(DBProducto).filter(DBProducto.id == item.id, DBProducto.local_id == usuario.local_id).first()
        if prod:
            prod.stock_actual = max(0, prod.stock_actual - int(item.cantidad))
    db.commit()
    return nueva_venta

@app.get("/api/ventas")
def obtener_ventas(db: Session = Depends(get_db), usuario: DBUsuario = Depends(get_usuario_actual)):
    return db.query(DBVenta).filter(DBVenta.local_id == usuario.local_id).order_by(DBVenta.id.desc()).all()

@app.delete("/api/ventas/{id}")
def anular_venta(id: int, db: Session = Depends(get_db), usuario: DBUsuario = Depends(get_usuario_actual)):
    venta = db.query(DBVenta).filter(DBVenta.id == id, DBVenta.local_id == usuario.local_id).first()
    if venta:
        db.delete(venta)
        db.commit()
        return {"mensaje": "Ok"}
    raise HTTPException(status_code=404)

@app.post("/api/productos")
def crear_producto(producto: ProductoCreate, db: Session = Depends(get_db), usuario: DBUsuario = Depends(get_usuario_actual)):
    nuevo_prod = DBProducto(
        local_id=usuario.local_id,
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
def obtener_productos(db: Session = Depends(get_db), usuario: DBUsuario = Depends(get_usuario_actual)):
    return db.query(DBProducto).filter(DBProducto.local_id == usuario.local_id).order_by(DBProducto.nombre).all()

@app.delete("/api/productos/{id}")
def borrar_producto(id: int, db: Session = Depends(get_db), usuario: DBUsuario = Depends(get_usuario_actual)):
    prod = db.query(DBProducto).filter(DBProducto.id == id, DBProducto.local_id == usuario.local_id).first()
    if prod:
        db.delete(prod)
        db.commit()
        return {"mensaje": "Ok"}
    raise HTTPException(status_code=404)

@app.put("/api/productos/{id}")
def actualizar_producto(id: int, producto: ProductoCreate, db: Session = Depends(get_db), usuario: DBUsuario = Depends(get_usuario_actual)):
    prod = db.query(DBProducto).filter(DBProducto.id == id, DBProducto.local_id == usuario.local_id).first()
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
def registrar_egreso(egreso: EgresoCreate, db: Session = Depends(get_db), usuario: DBUsuario = Depends(get_usuario_actual)):
    nuevo = DBEgreso(local_id=usuario.local_id, monto=egreso.monto, descripcion=egreso.descripcion, metodo=egreso.metodo)
    db.add(nuevo)
    db.commit()
    return nuevo

@app.get("/api/finanzas")
def obtener_finanzas(filtro: str = "dia", db: Session = Depends(get_db), usuario: DBUsuario = Depends(get_usuario_actual)):
    hoy = datetime.now()
    if filtro == "semana": fecha_inicio = hoy - timedelta(days=hoy.weekday())
    elif filtro == "mes": fecha_inicio = hoy.replace(day=1)
    else: fecha_inicio = hoy.replace(hour=0, minute=0, second=0, microsecond=0)

    ventas = db.query(DBVenta).filter(DBVenta.fecha >= fecha_inicio, DBVenta.local_id == usuario.local_id).all()
    egresos = db.query(DBEgreso).filter(DBEgreso.fecha >= fecha_inicio, DBEgreso.local_id == usuario.local_id).order_by(DBEgreso.id.desc()).all()
    
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
def registrar_rendimiento(rendimiento: RendimientoCreate, db: Session = Depends(get_db), usuario: DBUsuario = Depends(get_usuario_actual)):
    nuevo = DBRendimiento(**rendimiento.dict(), local_id=usuario.local_id)
    db.add(nuevo)
    db.commit()
    return nuevo

@app.get("/api/rendimientos")
def obtener_rendimientos(db: Session = Depends(get_db), usuario: DBUsuario = Depends(get_usuario_actual)):
    return db.query(DBRendimiento).filter(DBRendimiento.local_id == usuario.local_id).order_by(DBRendimiento.id.desc()).limit(10).all()

@app.get("/api/alertas")
def obtener_alertas(db: Session = Depends(get_db), usuario: DBUsuario = Depends(get_usuario_actual)):
    alertas = []
    productos = db.query(DBProducto).filter(DBProducto.local_id == usuario.local_id).all()
    for p in productos:
        if p.stock_actual <= 0:
            alertas.append({"id": f"stock_cero_{p.id}", "tipo": "error", "titulo": "¡Repuesto Agotado!", "mensaje": f"No te queda stock de '{p.nombre}'. ¡Reponelo urgente!"})
        elif p.stock_actual <= p.stock_minimo:
            alertas.append({"id": f"stock_bajo_{p.id}", "tipo": "warning", "titulo": "Alerta de Stock Mínimo", "mensaje": f"Te quedan solo {p.stock_actual} unidades de '{p.nombre}'."})
    return alertas

# --- MÓDULO DE PRESUPUESTOS (NO AFECTA STOCK) ---
class PresupuestoCreate(BaseModel):
    cliente: str = "Consumidor Final"
    total: float
    detalle_ticket: str
    observaciones: str = ""

@app.post("/api/presupuestos")
def crear_presupuesto(presupuesto: PresupuestoCreate, db: Session = Depends(get_db), usuario: DBUsuario = Depends(get_usuario_actual)):
    nuevo = DBPresupuesto(
        local_id=usuario.local_id,
        cliente=presupuesto.cliente,
        total=presupuesto.total,
        detalle_ticket=presupuesto.detalle_ticket,
        observaciones=presupuesto.observaciones
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@app.get("/api/presupuestos")
def obtener_presupuestos(db: Session = Depends(get_db), usuario: DBUsuario = Depends(get_usuario_actual)):
    return db.query(DBPresupuesto).filter(DBPresupuesto.local_id == usuario.local_id).order_by(DBPresupuesto.id.desc()).all()