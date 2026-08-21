import { useState, useEffect } from 'react';
import { 
  Store, Tag, Wallet, Banknote, CreditCard, SplitSquareHorizontal, 
  Trash2, Printer, Plus, Minus, X, Check, Search, TrendingUp, AlertTriangle, 
  Info, Clock, Pencil, FileSpreadsheet, Target, ClipboardList,
  Wrench, Bike, PackageSearch, Image as ImageIcon, ExternalLink, UploadCloud,
  Moon, Sun, Smartphone, Lock, KeyRound, LogOut
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = "https://kiosco-backend-db.vercel.app/api";

const playAudio = (type) => {
  const urls = {
    success: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3', 
    error: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',   
    click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
    notification: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
  };
  const audio = new Audio(urls[type]);
  audio.volume = type === 'click' ? 0.2 : 0.5;
  audio.play().catch(() => {});
};

const formatMoney = (val) => {
  const num = parseFloat(val);
  if (isNaN(num)) return '0';
  return num.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

export default function App() {
  // --- SEGURIDAD Y LOGIN ---
  const [isLogueado, setIsLogueado] = useState(localStorage.getItem('auth_motogest') === 'true');
  const [claveInput, setClaveInput] = useState('');
  const CLAVE_SECRETA = "moto2026"; // Acá podés escribir la contraseña que quieras
// --- FÁBRICA DE ETIQUETAS ---
  const renderEtiquetas = (texto, colorFondo, colorTexto) => {
    if (!texto) return null;
    // Cortamos el texto por las comas y dibujamos una etiqueta por cada palabra
    return texto.split(',').map((palabra, index) => (
      <span 
        key={index} 
        className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-md mr-1 mb-1 shadow-sm ${colorFondo} ${colorTexto}`}
      >
        {palabra.trim()}
      </span>
    ));
  };
  // ----------------------------
  const manejarLogin = (e) => {
    e.preventDefault();
    if (claveInput === CLAVE_SECRETA) {
      localStorage.setItem('auth_motogest', 'true');
      setIsLogueado(true);
      playAudio('success');
      toast.success("¡Bienvenida a MotoGest!");
    } else {
      playAudio('error');
      toast.error("Contraseña incorrecta");
      setClaveInput('');
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('auth_motogest');
    setIsLogueado(false);
  };
  // -------------------------
  const [vistaActiva, setVistaActiva] = useState('pos');
  const [horaActual, setHoraActual] = useState(new Date());
  const [modoOscuro, setModoOscuro] = useState(false);
  
  const [catalogo, setCatalogo] = useState([]);
  const [historialVentas, setHistorialVentas] = useState([]);
  const [finanzas, setFinanzas] = useState(null);
  const [filtroTiempo, setFiltroTiempo] = useState('dia');
  const [historialProd, setHistorialProd] = useState([]);
  const [alertasInteligentes, setAlertasInteligentes] = useState([]);

  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  
  const [modalMixto, setModalMixto] = useState(false);
  const [montoEfMixto, setMontoEfMixto] = useState('');
  const [montoTrMixto, setMontoTrMixto] = useState('');
  const [montoTjMixto, setMontoTjMixto] = useState('');
  
  const [modalEfectivo, setModalEfectivo] = useState(false);
  const [pagaCon, setPagaCon] = useState('');

  const [subVistaFinanzas, setSubVistaFinanzas] = useState('resumen');
  const [filtroHistorial, setFiltroHistorial] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState('Todos');
  const [formEgreso, setFormEgreso] = useState({ descripcion: '', monto: '', metodo: 'Efectivo' });

  const [busquedaCatalogo, setBusquedaCatalogo] = useState('');
  const [productoEditando, setProductoEditando] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  
  const [catForm, setCatForm] = useState({ 
    codigo_sku: '', nombre: '', marca: '', modelos_compatibles: '', 
    categoria: 'Repuesto', ubicacion_deposito: '', precio_costo: '', 
    precio_venta: '', stock_actual: '', stock_minimo: '2', imagen: ''
  });

  const [prodForm, setProdForm] = useState({ 
    producto: '', costo: '', cantidad: '', margenDeseado: '50', precio: '' 
  });

  const fetchAPI = async (endpoint, method = 'GET', body = null) => {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_URL}/${endpoint}`, opts);
    if (!res.ok) throw new Error('Error API');
    return res.json();
  };

  const cargarDatos = async () => {
    try {
      setCatalogo(await fetchAPI('productos'));
      setHistorialVentas(await fetchAPI('ventas'));
      setHistorialProd(await fetchAPI('rendimientos'));
      cargarFinanzas('dia');
      const alertasNuevas = await fetchAPI('alertas');
      setAlertasInteligentes(alertasNuevas);s
      if (alertasNuevas.length > 0) {
      playAudio('notification');
      setTimeout(() => setAlertasInteligentes([]), 10000);
    } catch (e) { 
      toast.error("Error al conectar con servidor"); 
    }
  };

  const cargarFinanzas = async (filtro) => {
    try { 
      setFiltroTiempo(filtro); 
      setFinanzas(await fetchAPI(`finanzas?filtro=${filtro}`)); 
    } catch (e) {}
  };

  useEffect(() => { 
    cargarDatos(); 
    const intervaloReloj = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(intervaloReloj);
  }, []);
  const comprimirImagen = (archivo) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(archivo);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Achicamos la foto a un máximo de 400x400 píxeles (ideal para catálogo)
          const MAX_WIDTH = 400; 
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // La transformamos a formato WEBP con calidad al 70% (súper liviana)
          const dataUrl = canvas.toDataURL('image/webp', 0.7);
          resolve(dataUrl);
        };
      };
    });
  };
  const manejarSeleccionArchivo = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    
    setSubiendoFoto(true);
    try {
      const imagenComprimida = await comprimirImagen(archivo);
      setCatForm(prev => ({...prev, imagen: imagenComprimida}));
      toast.success("¡Foto comprimida y cargada!", { id: "upload" });
    } catch (error) {
      toast.error("Error al procesar la imagen");
    } finally {
      setSubiendoFoto(false);
    }
  };

  const manejarPegadoImagen = async (e) => {
    const items = e.clipboardData.items;
    let archivoImagen = null;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) { archivoImagen = items[i].getAsFile(); break; }
    }
    if (!archivoImagen) return toast.error("No se detectó ninguna imagen.");
    
    setSubiendoFoto(true);
    try {
      const imagenComprimida = await comprimirImagen(archivoImagen);
      setCatForm(prev => ({...prev, imagen: imagenComprimida}));
      toast.success("¡Foto pegada y comprimida!", { id: "upload" });
    } catch (error) {
      toast.error("Error al procesar la imagen");
    } finally {
      setSubiendoFoto(false);
    }
  };
  const abrirBuscadorGoogle = () => {
    if (!catForm.nombre) return toast.error("Escribí el nombre del repuesto primero");
    const query = encodeURIComponent(`${catForm.nombre} ${catForm.marca} repuesto moto`);
    window.open(`https://www.google.com/search?tbm=isch&q=${query}`, '_blank');
  };

  const rankingVentasPOS = {}; 
  const rankingProduccionMap = {}; 
  const hoyDate = new Date();
  const mesActual = hoyDate.getMonth();
  const anioActual = hoyDate.getFullYear();

  historialVentas.forEach(v => {
    const fechaVenta = new Date(v.fecha);
    const esMesActual = fechaVenta.getMonth() === mesActual && fechaVenta.getFullYear() === anioActual;

    v.detalle_ticket.split(' | ').forEach(i => {
      const match = i.match(/([\d.]+)x (.*?) \((.*?)\)/); 
      if(match) { 
        const cant = parseFloat(match[1]);
        const nombre = match[2].trim();
        const unidad = match[3].trim();
        rankingVentasPOS[nombre] = (rankingVentasPOS[nombre] || 0) + cant;
        if (esMesActual && unidad !== 'Libre') {
          const prodKey = `${nombre}:::${unidad}`;
          rankingProduccionMap[prodKey] = (rankingProduccionMap[prodKey] || 0) + cant;
        }
      }
    });
  });
  
  const catalogoOrdenado = [...catalogo].sort((a, b) => (rankingVentasPOS[b.nombre] || 0) - (rankingVentasPOS[a.nombre] || 0));
  
  const catalogoFiltradoPOS = catalogoOrdenado.filter(prod => 
    prod.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    (prod.marca && prod.marca.toLowerCase().includes(busqueda.toLowerCase())) ||
    (prod.modelos_compatibles && prod.modelos_compatibles.toLowerCase().includes(busqueda.toLowerCase())) ||
    (prod.codigo_sku && prod.codigo_sku.toLowerCase().includes(busqueda.toLowerCase()))
  );
  
  const catalogoFiltradoABM = catalogo.filter(prod => 
    prod.nombre.toLowerCase().includes(busquedaCatalogo.toLowerCase()) ||
    (prod.marca && prod.marca.toLowerCase().includes(busquedaCatalogo.toLowerCase())) ||
    (prod.codigo_sku && prod.codigo_sku.toLowerCase().includes(busquedaCatalogo.toLowerCase()))
  );

  const top3Produccion = Object.entries(rankingProduccionMap)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 3)
    .map(item => {
      const [nombre, unidad] = item[0].split(':::');
      return { nombre, unidad, cantidad: parseFloat(item[1].toFixed(2)) };
    });

  const totalCarrito = carrito.reduce((sum, item) => sum + ((parseFloat(item.cantidad) || 0) * (parseFloat(item.precioBase) || 0)), 0); 
  const vueltoEfectivo = (parseFloat(pagaCon) || 0) - totalCarrito;

  const agregarAlCarrito = (prod) => {
    if (prod.stock_actual <= 0) {
      playAudio('error');
      return toast.error(`No podés vender "${prod.nombre}". ¡El stock está en cero!`);
    }

    playAudio('click');
    const idUnico = prod.id;
    const precioVentaNum = parseFloat(prod.precio_venta) || 0;
    setCarrito(prev => {
      const existeIdx = prev.findIndex(i => i.idUnico === idUnico);
      if (existeIdx >= 0) {
        if (prev[existeIdx].cantidad >= prod.stock_actual) {
          toast.error(`Stock máximo alcanzado. Solo tenés ${prod.stock_actual} unidades.`);
          return prev;
        }
        const nuevo = [...prev];
        nuevo[existeIdx].cantidad = (parseFloat(nuevo[existeIdx].cantidad) || 0) + 1;
        return nuevo;
      }
      return [...prev, { idUnico, nombre: prod.nombre, marca: prod.marca, modelos_compatibles: prod.modelos_compatibles, unidad: 'Unidad', precioBase: precioVentaNum, cantidad: 1, stockMax: prod.stock_actual }];
    });
  };

  const agregarLibre = () => {
    const desc = window.prompt("Descripción de la venta:");
    if (!desc) return;
    const montoRaw = window.prompt("Monto a cobrar ($):");
    const monto = parseFloat(montoRaw.replace(',', '.'));
    if (monto > 0) setCarrito([...carrito, { idUnico: Date.now(), nombre: desc, unidad: 'Libre', precioBase: monto, cantidad: 1 }]);
  };

  const actualizarInputCantidad = (idx, valorBruto) => {
    const n = [...carrito];
    let val = String(valorBruto).replace(',', '.');
    const numVal = parseFloat(val);
    
    if (n[idx].stockMax !== undefined && numVal > n[idx].stockMax) {
      toast.error(`Solo tenés ${n[idx].stockMax} unidades en stock.`);
      val = n[idx].stockMax.toString();
    }
    
    n[idx].cantidad = val;
    setCarrito(n);
  };

  const procesarCantidadBlur = (idx) => {
    const n = [...carrito];
    const val = parseFloat(n[idx].cantidad);
    if (isNaN(val) || val <= 0) n.splice(idx, 1); 
    else n[idx].cantidad = val; 
    setCarrito(n);
  };

  const cobrar = async (metodo, ef = 0, tr = 0, tj = 0) => {
    if (carrito.length === 0) { playAudio('error'); return toast.error("Carrito vacío"); }
    let efectivo = ef, transferencia = tr, tarjeta = tj;
    if (metodo === 'Efectivo') efectivo = totalCarrito;
    if (metodo === 'Transferencia') transferencia = totalCarrito;
    if (metodo === 'Tarjeta') tarjeta = totalCarrito;

    const detalle = carrito.map(i => `${parseFloat(i.cantidad) || 0}x ${i.nombre} (${i.unidad})`).join(' | ');
    const itemsVenta = carrito.filter(i => i.unidad !== 'Libre').map(i => ({ id: i.idUnico, cantidad: parseFloat(i.cantidad) || 1 }));

    try {
      await fetchAPI('ventas', 'POST', { total: totalCarrito, efectivo, transferencia, tarjeta, detalle_ticket: detalle, items: itemsVenta });
      playAudio('success'); 
      toast.success("¡Cobro Exitoso y stock descontado!");
      setCarrito([]); setModalMixto(false); setModalEfectivo(false); setMontoEfMixto(''); setMontoTrMixto(''); setMontoTjMixto(''); setPagaCon('');
      cargarDatos();
    } catch (e) { playAudio('error'); toast.error("Error al registrar venta"); }
  };

  const anularVenta = async (id) => {
    if(!window.confirm('¿Anular permanentemente?')) return;
    try { await fetchAPI(`ventas/${id}`, 'DELETE'); cargarDatos(); toast.success('Venta anulada'); } catch(e){}
  };

  const cargarParaEditar = (prod) => {
    setProductoEditando(prod.id);
    setCatForm({ ...prod, precio_costo: prod.precio_costo?.toString()||'', precio_venta: prod.precio_venta?.toString()||'', stock_actual: prod.stock_actual?.toString()||'0', stock_minimo: prod.stock_minimo?.toString()||'2' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success(`Editando: ${prod.nombre}`);
  };

  const cancelarEdicion = () => {
    setProductoEditando(null);
    setCatForm({ codigo_sku: '', nombre: '', marca: '', modelos_compatibles: '', categoria: 'Repuesto', ubicacion_deposito: '', precio_costo: '', precio_venta: '', stock_actual: '', stock_minimo: '2', imagen: '' }); 
  };
  
  const guardarProducto = async () => {
    if (!catForm.nombre) return toast.error("El nombre es obligatorio");
    if (!catForm.precio_venta) return toast.error("Falta el precio de venta");

    const payload = { ...catForm, precio_costo: parseFloat(String(catForm.precio_costo).replace(',','.')) || 0, precio_venta: parseFloat(String(catForm.precio_venta).replace(',','.')) || 0, stock_actual: parseInt(catForm.stock_actual) || 0, stock_minimo: parseInt(catForm.stock_minimo) || 2 };

    try {
      if (productoEditando) { await fetchAPI(`productos/${productoEditando}`, 'PUT', payload); toast.success("Repuesto actualizado"); } 
      else { await fetchAPI('productos', 'POST', payload); toast.success("Repuesto guardado"); }
      cancelarEdicion(); cargarDatos();
    } catch (e) { toast.error("Error al guardar"); }
  };

  const borrarProducto = async (id) => {
    if(!window.confirm("¿Borrar repuesto del sistema?")) return;
    try { await fetchAPI(`productos/${id}`, 'DELETE'); cargarDatos(); toast.success("Borrado"); } catch(e){}
  };

  const guardarEgreso = async () => {
    if (!formEgreso.monto || !formEgreso.descripcion) return;
    try { 
      await fetchAPI('egresos', 'POST', { 
        monto: parseFloat(String(formEgreso.monto).replace(',','.')), 
        descripcion: formEgreso.descripcion,
        metodo: formEgreso.metodo
      }); 
      toast.success("Egreso registrado"); 
      setFormEgreso({ descripcion: '', monto: '', metodo: 'Efectivo' }); 
      cargarFinanzas(filtroTiempo); 
    } catch(e) { }
  };

  const descargarBackupCSV = () => {
    if (historialVentas.length === 0) return toast.error('No hay ventas para exportar');
    let csv = '\uFEFFID Ticket;Fecha;Hora;Total Cobrado;Efectivo;Transferencia;Tarjeta;Detalle de Productos\n';
    historialVentas.forEach(v => {
      const fechaObj = new Date(v.fecha);
      csv += `${v.id};${fechaObj.toLocaleDateString()};${fechaObj.toLocaleTimeString()};${v.total};${v.efectivo};${v.transferencia};${v.tarjeta || 0};"${v.detalle_ticket.replace(/"/g, '""')}"\n`;
    });
    const link = document.createElement('a'); 
    link.href = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.setAttribute('download', `Copia_Seguridad_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success("Excel descargado");
  };

  const historialFiltrado = historialVentas.filter(v => {
    const coincideTexto = v.detalle_ticket.toLowerCase().includes(filtroHistorial.toLowerCase()) || v.total.toString().includes(filtroHistorial);
    const cantPagos = (v.efectivo>0?1:0) + (v.transferencia>0?1:0) + ((v.tarjeta||0)>0?1:0);
    let metodoString = 'Efectivo';
    if (cantPagos > 1) metodoString = 'Mixto';
    else if (v.transferencia > 0) metodoString = 'Transferencia';
    else if ((v.tarjeta||0) > 0) metodoString = 'Tarjeta';
    
    return coincideTexto && (filtroMetodo === 'Todos' || metodoString === filtroMetodo);
  });

  const costoProduccionNum = parseFloat(String(prodForm.costo).replace(',','.')) || 0;
  const cantProducidaNum = parseFloat(String(prodForm.cantidad).replace(',','.')) || 0;
  const costoUnitario = cantProducidaNum > 0 ? (costoProduccionNum / cantProducidaNum) : 0;
  const precioSugerido = costoUnitario > 0 ? costoUnitario * (1 + ((parseFloat(prodForm.margenDeseado) || 0) / 100)) : 0;

  const guardarProduccion = async () => {
    if (!prodForm.producto || !prodForm.costo || !prodForm.precio) return toast.error("Completá todos los campos obligatorios");
    try { 
      await fetchAPI('rendimientos', 'POST', { producto: prodForm.producto, costo_produccion: costoProduccionNum, precio_venta_estimado: parseFloat(String(prodForm.precio).replace(',','.')), cantidad_producida: cantProducidaNum || 1 }); 
      toast.success("Registrado correctamente"); setProdForm({ producto: '', costo: '', precio: '', cantidad: '', margenDeseado: '50' }); cargarDatos(); 
    } catch(e) { toast.error("Error al registrar"); }
  };

  let totalHoy = 0, totalSemana = 0, totalMes = 0;
  const hoyDateObj = new Date();
  const inicioHoy = new Date(hoyDateObj.getFullYear(), hoyDateObj.getMonth(), hoyDateObj.getDate()).getTime();
  const diffDia = hoyDateObj.getDate() - hoyDateObj.getDay() + (hoyDateObj.getDay() === 0 ? -6 : 1);
  const inicioSemana = new Date(hoyDateObj.getFullYear(), hoyDateObj.getMonth(), diffDia).getTime();
  const inicioMes = new Date(hoyDateObj.getFullYear(), hoyDateObj.getMonth(), 1).getTime();

  historialVentas.forEach(v => {
      const f = new Date(v.fecha).getTime();
      if (f >= inicioHoy) totalHoy += v.total;
      if (f >= inicioSemana) totalSemana += v.total;
      if (f >= inicioMes) totalMes += v.total;
  });

  if (!isLogueado) {
    return (
      <div translate="no" className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans selection:bg-indigo-500/30">
        <Toaster position="top-center" toastOptions={{ duration: 10000 }} />
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-sm animate-fade-in text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
          <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-700">
            <Lock className="text-indigo-400" size={28} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide mb-1">MotoGest</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Acceso Restringido</p>
          
          <form onSubmit={manejarLogin} className="space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"><KeyRound size={18}/></span>
              <input 
                type="password" 
                placeholder="Ingresar contraseña..." 
                value={claveInput}
                onChange={(e) => setClaveInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-4 font-bold outline-none focus:border-indigo-500 transition-colors placeholder-slate-600"
                autoFocus
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl uppercase text-sm tracking-wider shadow-md transition-colors">
              Ingresar al sistema
            </button>
          </form>
        </div>
      </div>
    );
  }
  return (
    <div translate="no" className={`min-h-screen font-sans print:bg-white selection:bg-indigo-200 ${modoOscuro ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      <Toaster position="top-center" className="print:hidden" />
      
      <header className={`shadow-md sticky top-0 z-30 print:hidden border-b-4 ${modoOscuro ? 'bg-slate-900 border-indigo-500 text-white' : 'bg-slate-900 border-indigo-600 text-white'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex gap-1 sm:gap-2 items-center">
            {[
              { id: 'pos', icon: Store, label: 'Caja' },
              { id: 'catalogo', icon: Wrench, label: 'Catálogo' },
              { id: 'finanzas', icon: Wallet, label: 'Cierres & Caja' },
              { id: 'produccion', icon: PackageSearch, label: 'Costeos' },
            ].map(btn => (
              <button key={btn.id} onClick={() => {playAudio('click'); setVistaActiva(btn.id)}} className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap shrink-0 text-xs sm:text-base ${vistaActiva === btn.id ? 'bg-indigo-600 text-white shadow-md scale-105' : 'hover:bg-slate-800 text-slate-300'}`}>
                <btn.icon size={18} className="hidden sm:block" /> {btn.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <button onClick={() => { playAudio('click'); setModoOscuro(!modoOscuro); }} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shadow-sm">
          {modoOscuro ? <Sun size={18}/> : <Moon size={18}/>}
        </button>

        <button onClick={() => { playAudio('click'); cerrarSesion(); }} className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-rose-400 transition-colors shadow-sm flex items-center gap-1 text-xs font-bold" title="Cerrar Caja">
          <LogOut size={18}/>
        </button>
            <div className="hidden md:flex items-center gap-2 font-black text-indigo-400">
              <Bike size={24}/> MotoGest
            </div>
          </div>
        </div>
      </header>

      {alertasInteligentes.length > 0 && vistaActiva === 'pos' && (
        <div className="max-w-7xl mx-auto px-4 mt-4 animate-fade-in flex flex-col gap-2 print:hidden">
          {alertasInteligentes.slice(0, 3).map(alerta => (
            <div key={alerta.id} className={`flex items-center justify-between p-3 rounded-xl shadow-sm border ${
                alerta.tipo === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' : 
                alerta.tipo === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 
                alerta.tipo === 'error'   ? 'bg-rose-50 border-rose-200 text-rose-900' :
                'bg-blue-50 border-blue-200 text-blue-900'
              }`}>
              <div className="flex items-center gap-3">
                {alerta.tipo === 'warning' ? <AlertTriangle size={20} className="text-amber-500" /> : 
                 alerta.tipo === 'success' ? <TrendingUp size={20} className="text-emerald-500"/> : 
                 alerta.tipo === 'error'   ? <AlertTriangle size={20} className="text-rose-500"/> :
                 <Info size={20} className="text-blue-500"/>}
                <div>
                  <h4 className="font-bold text-sm">{alerta.titulo}</h4>
                  <p className="text-xs opacity-80">{alerta.mensaje}</p>
                </div>
              </div>
              <button onClick={() => setAlertasInteligentes(alertasInteligentes.filter(a => a.id !== alerta.id))} className="p-1 rounded-md opacity-50 hover:opacity-100 transition-opacity"><X size={18} /></button>
            </div>
          ))}
        </div>
      )}

      <main className="max-w-7xl mx-auto mt-4 sm:mt-6 px-3 sm:px-4 pb-12 print:mt-0 print:p-0">
        
        {vistaActiva === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 animate-fade-in relative">
            <div className="lg:col-span-2 space-y-4">
              <div className={`p-4 sm:p-5 rounded-2xl shadow-sm border transition-all ${modoOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <div>
                    <h2 className={`text-lg sm:text-xl font-bold flex items-center gap-2 ${modoOscuro ? 'text-white' : 'text-slate-800'}`}><Store/> Punto de Venta</h2>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1 flex items-center gap-1.5"><Clock size={12} className="text-indigo-400"/> {horaActual.toLocaleDateString('es-AR')} — {horaActual.toLocaleTimeString('es-AR')}</p>
                  </div>
                  
                  <div className="relative w-full sm:w-80 group flex-shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search size={18}/></span>
                    <input type="text" placeholder="Buscar repuesto, moto o SKU (F3)..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={`w-full rounded-xl py-2 pl-10 pr-4 text-sm font-medium outline-none border focus:border-indigo-500 ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-200'}`} />
                    {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={16}/></button>}
                  </div>
                  <button onClick={agregarLibre} className={`w-full sm:w-auto px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${modoOscuro ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>+ Libre (Servicio)</button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                  {catalogoFiltradoPOS.map(prod => (
                    <div key={prod.id} className={`border rounded-xl p-2.5 sm:p-3 shadow-sm flex flex-col group cursor-pointer transition-all hover:scale-[1.02] ${modoOscuro ? 'bg-slate-800 border-slate-700 hover:border-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-400'}`} onClick={() => agregarAlCarrito(prod)}>
                      <div className={`w-full h-24 sm:h-32 mb-2 rounded-lg flex items-center justify-center overflow-hidden border relative ${modoOscuro ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200/50'}`}>
                        <span className="absolute top-1 right-1 text-[8px] sm:text-[9px] bg-indigo-600 font-black px-1.5 py-0.5 rounded shadow-sm text-white uppercase">{prod.categoria}</span>
                        {prod.imagen ? <img src={prod.imagen} alt={prod.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <ImageIcon size={32} className="text-slate-400" />}
                      </div>

                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`font-bold text-xs sm:text-sm leading-tight line-clamp-2 ${modoOscuro ? 'text-white' : 'text-slate-800'}`}>{prod.nombre}</h3>
                       </div>
        <div className="flex flex-wrap mt-1 mb-2">
          {renderEtiquetas(prod.marca, 'bg-blue-800/80', 'text-blue-100')}
          {renderEtiquetas(prod.modelos_compatibles, 'bg-emerald-800/80', 'text-emerald-100')}
        </div>
                      
                      <div className={`mt-auto flex justify-between items-end pt-2 border-t ${modoOscuro ? 'border-slate-700' : 'border-slate-50'}`}>
                        <div className="flex flex-col">
                          <span className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase hidden sm:block">{prod.codigo_sku || 'S/N'}</span>
                          <span className={`text-[9px] sm:text-[10px] font-bold ${prod.stock_actual <= prod.stock_minimo ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}>Stock: {prod.stock_actual}</span>
                        </div>
                        <span className="font-black text-indigo-400 bg-indigo-500/10 px-1.5 sm:px-2 py-1 rounded-lg text-sm sm:text-lg">${formatMoney(prod.precio_venta)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-4 sm:p-5 rounded-2xl shadow-sm border ${modoOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className={`font-bold mb-3 flex justify-between items-center border-b pb-2 text-sm sm:text-base ${modoOscuro ? 'text-slate-200 border-slate-800' : 'text-slate-700'}`}>
                  Últimos cobros <span className={`text-xs px-2 py-1 rounded ${modoOscuro ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{historialVentas.length} hoy</span>
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {historialVentas.slice(0,8).map(v => (
                    <div key={v.id} className={`min-w-[200px] sm:min-w-[240px] p-3 sm:p-4 rounded-xl border shrink-0 ${modoOscuro ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-black text-lg sm:text-xl text-emerald-400">${formatMoney(v.total)}</span>
                        <button onClick={() => anularVenta(v.id)} className="text-rose-400 hover:bg-rose-500/10 p-1.5 rounded"><Trash2 size={14}/></button>
                      </div>
                      <p className={`text-[10px] sm:text-xs line-clamp-3 mb-2 ${modoOscuro ? 'text-slate-300' : 'text-slate-600'}`}>{v.detalle_ticket}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`rounded-2xl shadow-xl border flex flex-col h-auto max-h-[60vh] lg:max-h-none lg:h-[calc(100vh-120px)] lg:sticky lg:top-24 overflow-hidden ${modoOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="bg-slate-900 text-white p-3 sm:p-4 text-center flex justify-between items-center border-b-2 border-indigo-600">
                <h2 className="font-black tracking-widest uppercase text-base sm:text-lg">Ticket Caja</h2>
                {carrito.length > 0 && <button onClick={() => setCarrito([])} className="text-rose-400 hover:text-rose-300"><Trash2 size={18}/></button>}
              </div>
              
              <div className={`flex-1 overflow-y-auto p-3 space-y-2 relative ${modoOscuro ? 'bg-slate-950' : 'bg-slate-50'}`}>
                {carrito.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-2"><Store size={40}/><p className="font-medium text-sm">Esperando productos</p></div>
                ) : (
                  carrito.map((item, idx) => {
                    const cantSegura = parseFloat(item.cantidad) || 0;
                    const pbSeguro = parseFloat(item.precioBase) || 0;
                    return (
                      <div key={item.idUnico} className={`flex flex-col p-3 rounded-xl shadow-sm border transition-colors ${modoOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 pr-2">
                            <p className={`font-bold text-xs sm:text-sm leading-tight ${modoOscuro ? 'text-white' : 'text-slate-800'}`}>{item.nombre}</p> 
                            {/* SELECTORES DE VARIANTE EN EL CARRITO */}
              <div className="flex flex-wrap gap-1 mt-1">
                {item.marca && item.marca.includes(',') && (
                  <select
                    className={`text-[10px] font-bold px-1 py-0.5 rounded outline-none cursor-pointer border ${modoOscuro ? 'bg-slate-800 text-blue-300 border-blue-900/50' : 'bg-blue-50 text-blue-700 border-blue-200'}`}
                    value={item.marcaSeleccionada || ''}
                    onChange={(e) => {
                      const nuevoCarrito = [...carrito];
                      nuevoCarrito[idx] = { ...nuevoCarrito[idx], marcaSeleccionada: e.target.value };
                      setCarrito(nuevoCarrito);
                    }}
                  >
                    <option value="">¿Qué marca?</option>
                    {item.marca.split(',').map((m, i) => (
                      <option key={i} value={m.trim()}>{m.trim()}</option>
                    ))}
                  </select>
                )}

                {item.modelos_compatibles && item.modelos_compatibles.includes(',') && (
                  <select
                    className={`text-[10px] font-bold px-1 py-0.5 rounded outline-none cursor-pointer border ${modoOscuro ? 'bg-slate-800 text-emerald-300 border-emerald-900/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}
                    value={item.modeloSeleccionado || ''}
                    onChange={(e) => {
                      const nuevoCarrito = [...carrito];
                      nuevoCarrito[idx] = { ...nuevoCarrito[idx], modeloSeleccionado: e.target.value };
                      setCarrito(nuevoCarrito);
                    }}
                  >
                    <option value="">¿Qué modelo?</option>
                    {item.modelos_compatibles.split(',').map((m, i) => (
                      <option key={i} value={m.trim()}>{m.trim()}</option>
                    ))}
                  </select>
                )}
              </div>
              {/* FIN SELECTORES */}
                            {item.unidad === 'Libre' && <p className={`text-[9px] font-bold uppercase mt-1 inline-block px-1.5 py-0.5 rounded ${modoOscuro ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>Servicio Libre</p>}
                          </div>
                          <span className={`font-black text-base sm:text-lg pt-1 ${modoOscuro ? 'text-white' : 'text-slate-800'}`}>${formatMoney(cantSegura * pbSeguro)}</span>
                        </div>
                        <div className={`flex items-center justify-between border-t pt-2 sm:pt-3 mt-1 ${modoOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
                          <button onClick={() => {playAudio('click'); setCarrito(carrito.filter((_,i)=>i!==idx))}} className="text-rose-400 text-[10px] sm:text-xs font-bold px-2 py-1.5 rounded-lg hover:bg-rose-500/10 flex items-center gap-1"><Trash2 size={12}/> Quitar</button>
                          <div className={`flex items-center rounded-lg p-1 border ${modoOscuro ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                            <button onClick={() => { playAudio('click'); actualizarInputCantidad(idx, Math.max(0, cantSegura - 1)); procesarCantidadBlur(idx); }} className={`p-1.5 rounded-md shadow-sm ${modoOscuro ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-white text-slate-600'}`}><Minus size={12}/></button>
                            <input type="text" inputMode="decimal" value={item.cantidad} onChange={(e) => actualizarInputCantidad(idx, e.target.value)} onBlur={() => procesarCantidadBlur(idx)} className={`font-black w-10 sm:w-14 text-center text-xs sm:text-sm bg-transparent outline-none ${modoOscuro ? 'text-white' : 'text-slate-800'}`}/>
                            <button onClick={() => { playAudio('click'); actualizarInputCantidad(idx, cantSegura + 1); procesarCantidadBlur(idx); }} className={`p-1.5 rounded-md shadow-sm ${modoOscuro ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-white text-slate-600'}`}><Plus size={12}/></button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className={`p-3 sm:p-4 border-t ${modoOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <div className={`flex justify-between items-center mb-3 sm:mb-4 p-3 sm:p-4 rounded-xl border ${modoOscuro ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                  <span className={`font-black uppercase tracking-widest text-xs sm:text-sm ${modoOscuro ? 'text-slate-400' : 'text-slate-500'}`}>Total:</span>
                  <span className="text-3xl sm:text-4xl font-black text-emerald-400">${formatMoney(totalCarrito)}</span>
                </div>
                
                {modalEfectivo && (
                  <div className={`p-3 sm:p-4 rounded-xl border relative mb-4 ${modoOscuro ? 'bg-emerald-950/40 border-emerald-800' : 'bg-emerald-50 border-emerald-200'}`}>
                    <button onClick={() => setModalEfectivo(false)} className="absolute top-2 right-2 text-slate-400"><X size={18}/></button>
                    <p className={`text-sm font-black mb-3 ${modoOscuro ? 'text-emerald-300' : 'text-emerald-800'}`}>Cobro Efectivo</p>
                    <input type="text" inputMode="decimal" placeholder="¿Con cuánto paga?" value={pagaCon} onChange={(e) => setPagaCon(e.target.value.replace(',','.'))} className={`w-full p-2.5 sm:p-3 rounded-xl border-2 font-black text-lg sm:text-xl mb-2 outline-none ${modoOscuro ? 'bg-slate-900 border-emerald-800 text-white' : 'bg-white border-emerald-200'}`} autoFocus />
                    <div className={`p-3 sm:p-4 rounded-xl mb-3 flex justify-between items-center ${vueltoEfectivo >= 0 ? 'bg-emerald-600 text-white' : 'bg-rose-950 text-rose-300'}`}>
                      <span className="font-bold text-[10px] sm:text-xs uppercase">Vuelto:</span>
                      <span className="font-black text-xl sm:text-2xl">{vueltoEfectivo >= 0 ? `$${formatMoney(vueltoEfectivo)}` : 'Falta dinero'}</span>
                    </div>
                    <button onClick={() => { if(vueltoEfectivo < 0){ playAudio('error'); return toast.error("Monto insuficiente"); } cobrar('Efectivo'); }} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 sm:py-4 rounded-xl flex justify-center items-center gap-2"><Check size={20}/> Confirmar</button>
                  </div>
                )}
                
                {modalMixto && (
                  <div className={`p-3 sm:p-4 rounded-xl border relative mb-4 ${modoOscuro ? 'bg-blue-950/40 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                    <button onClick={() => setModalMixto(false)} className="absolute top-2 right-2 text-slate-400"><X size={18}/></button>
                    <p className={`text-sm font-black mb-3 ${modoOscuro ? 'text-blue-300' : 'text-blue-800'}`}>Pago Dividido (Mixto)</p>
                    
                    <div className="space-y-2 mb-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input type="text" inputMode="decimal" placeholder="Efectivo" value={montoEfMixto} onChange={(e) => setMontoEfMixto(e.target.value.replace(',','.'))} className={`w-full pl-7 p-2 rounded-lg border-2 font-bold text-sm outline-none ${modoOscuro ? 'bg-slate-900 border-blue-800 text-white' : 'bg-white border-blue-200'}`} />
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input type="text" inputMode="decimal" placeholder="Transferencia" value={montoTrMixto} onChange={(e) => setMontoTrMixto(e.target.value.replace(',','.'))} className={`w-full pl-7 p-2 rounded-lg border-2 font-bold text-sm outline-none ${modoOscuro ? 'bg-slate-900 border-blue-800 text-white' : 'bg-white border-blue-200'}`} />
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input type="text" inputMode="decimal" placeholder="Tarjeta" value={montoTjMixto} onChange={(e) => setMontoTjMixto(e.target.value.replace(',','.'))} className={`w-full pl-7 p-2 rounded-lg border-2 font-bold text-sm outline-none ${modoOscuro ? 'bg-slate-900 border-blue-800 text-white' : 'bg-white border-blue-200'}`} />
                      </div>
                    </div>

                    <div className={`flex justify-between items-center p-2.5 rounded-lg mb-3 ${modoOscuro ? 'bg-indigo-950 text-indigo-200' : 'bg-indigo-100 text-indigo-800'}`}>
                      <span className="text-[10px] sm:text-xs font-bold uppercase">Suma Ingresada</span>
                      <span className="font-black text-base sm:text-lg">
                        ${formatMoney((parseFloat(montoEfMixto)||0) + (parseFloat(montoTrMixto)||0) + (parseFloat(montoTjMixto)||0))} <span className="text-xs sm:text-sm opacity-50 font-medium">/ {formatMoney(totalCarrito)}</span>
                      </span>
                    </div>
                    <button onClick={() => { 
                      const ef = parseFloat(montoEfMixto)||0; 
                      const tr = parseFloat(montoTrMixto)||0; 
                      const tj = parseFloat(montoTjMixto)||0; 
                      if(Math.abs((ef + tr + tj) - totalCarrito) > 0.01) { playAudio('error'); return toast.error("La suma no coincide con el total de la venta."); } 
                      cobrar('Mixto', ef, tr, tj); 
                    }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 sm:py-3 rounded-lg flex justify-center items-center gap-2">
                      <Check size={18}/> Confirmar Cobro
                    </button>
                  </div>
                )}
                
                {!modalEfectivo && !modalMixto && (
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => { if(carrito.length > 0) setModalEfectivo(true); else toast.error("Carrito vacío"); }} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 sm:py-4 rounded-xl flex flex-col justify-center items-center gap-1 text-[9px] sm:text-xs uppercase shadow-sm">
                      <Banknote size={18}/> Efectivo
                    </button>
                    <button onClick={() => cobrar('Transferencia')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 sm:py-4 rounded-xl flex flex-col justify-center items-center gap-1 text-[9px] sm:text-xs uppercase shadow-sm">
                      <Smartphone size={18}/> Transf.
                    </button>
                    <button onClick={() => cobrar('Tarjeta')} className="bg-amber-600 hover:bg-amber-700 text-white font-black py-3 sm:py-4 rounded-xl flex flex-col justify-center items-center gap-1 text-[9px] sm:text-xs uppercase shadow-sm">
                      <CreditCard size={18}/> Tarjeta
                    </button>
                    <button onClick={() => { if(carrito.length > 0) setModalMixto(true); else toast.error("Carrito vacío"); }} className={`col-span-3 font-black py-3 sm:py-4 rounded-xl flex justify-center items-center gap-2 text-xs sm:text-sm uppercase shadow-sm ${modoOscuro ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}>
                      <SplitSquareHorizontal size={18}/> Dividir Pago (Mixto)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {vistaActiva === 'catalogo' && (
           <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 animate-fade-in print:hidden">
             
             <div className="lg:col-span-2 space-y-4 h-fit lg:sticky lg:top-24">
               <div className={`p-4 sm:p-5 rounded-2xl shadow-sm border-2 relative overflow-hidden ${modoOscuro ? 'bg-slate-900 border-indigo-900' : 'bg-white border-indigo-100'}`}>
                 <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                 <h3 className={`font-black mb-2 flex items-center gap-2 text-sm uppercase ${modoOscuro ? 'text-indigo-300' : 'text-indigo-900'}`}><UploadCloud size={16}/> Foto del Producto</h3>
                 <p className="text-[10px] sm:text-xs text-slate-400 mb-3">Buscá la foto en Google y elegila desde tu computadora con el botón.</p>
                 <div className="flex flex-col sm:flex-row gap-2 mb-3">
                   <input type="text" placeholder="Ej: Espejo Titan" value={catForm.nombre} onChange={e => setCatForm({...catForm, nombre: e.target.value})} className={`flex-1 rounded-xl p-2.5 outline-none font-bold text-sm border focus:border-indigo-400 ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                   <button onClick={abrirBuscadorGoogle} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2.5 sm:py-2 rounded-xl flex justify-center items-center gap-1 font-bold text-xs whitespace-nowrap shadow-sm"><ExternalLink size={14}/> Googlear</button>
                 </div>
                 <div className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-all ${catForm.imagen ? (modoOscuro ? 'border-emerald-500 bg-emerald-950/30' : 'border-emerald-400 bg-emerald-50') : (modoOscuro ? 'border-indigo-900 bg-slate-800' : 'border-indigo-200 bg-indigo-50')}`} onPaste={manejarPegadoImagen} tabIndex="0">
                   {subiendoFoto ? (
                     <div className="text-indigo-400 font-bold text-sm flex items-center gap-2 animate-pulse"><UploadCloud size={18}/> Subiendo...</div>
                   ) : catForm.imagen ? (
                     <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                       <div className="flex items-center gap-3">
                         <img src={catForm.imagen} alt="Preview" className="w-14 h-14 object-cover rounded-lg shadow-sm border border-emerald-500" />
                         <div>
                           <p className="text-emerald-400 font-black text-sm">¡Foto lista!</p>
                           <label className="text-xs text-indigo-400 underline cursor-pointer">Elegir otra<input type="file" accept="image/*" onChange={manejarSeleccionArchivo} className="hidden" /></label>
                         </div>
                       </div>
                     </div>
                   ) : (
                     <div className="text-center">
                       <ImageIcon size={24} className="text-indigo-400 mx-auto mb-2"/>
                       <label className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-2 rounded-xl cursor-pointer shadow-md inline-flex items-center gap-2"><UploadCloud size={16}/> Buscar foto en la PC<input type="file" accept="image/*" onChange={manejarSeleccionArchivo} className="hidden" /></label>
                     </div>
                   )}
                 </div>
               </div>

               <div className={`p-4 sm:p-6 rounded-2xl border shadow-sm ${modoOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h3 className={`font-black flex items-center gap-2 text-base sm:text-lg ${modoOscuro ? 'text-white' : 'text-slate-800'}`}>{productoEditando ? <Pencil size={18}/> : <Wrench size={18}/>} {productoEditando ? 'Editando Ficha' : 'Datos Principales'}</h3>
                  {productoEditando && <button onClick={cancelarEdicion} className="text-xs font-bold bg-white text-rose-500 px-3 py-1 rounded-md border border-rose-200">Cancelar</button>}
                </div>
                
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-xs font-bold text-indigo-400 uppercase ml-1">Nombre del producto *</label>
                    <input type="text" placeholder="Ej: Pastillas de freno" value={catForm.nombre} onChange={e => setCatForm({...catForm, nombre: e.target.value})} className={`w-full rounded-xl p-2.5 outline-none font-bold text-sm border focus:border-indigo-400 ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">Código SKU <span className="text-[10px] opacity-70">(Opc.)</span></label>
                      <input type="text" placeholder="Ej: HD-458" value={catForm.codigo_sku} onChange={e => setCatForm({...catForm, codigo_sku: e.target.value})} className={`w-full rounded-xl p-2.5 outline-none text-sm font-mono border focus:border-indigo-400 ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">Marca <span className="text-[10px] opacity-70">(Opc.)</span></label>
                      <input type="text" placeholder="Ej: Honda" value={catForm.marca} onChange={e => setCatForm({...catForm, marca: e.target.value})} className={`w-full rounded-xl p-2.5 outline-none text-sm border focus:border-indigo-400 ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Modelos compatibles <span className="text-[10px] opacity-70">(Opcional)</span></label>
                    <input type="text" placeholder="Ej: Titan 150" value={catForm.modelos_compatibles} onChange={e => setCatForm({...catForm, modelos_compatibles: e.target.value})} className={`w-full rounded-xl p-2.5 outline-none text-sm border focus:border-indigo-400 ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">Categoría</label>
                      <select value={catForm.categoria} onChange={e => setCatForm({...catForm, categoria: e.target.value})} className={`w-full rounded-xl p-2.5 outline-none text-sm font-bold border focus:border-indigo-400 ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                        <option value="Repuesto">Repuesto</option>
                        <option value="Accesorio">Accesorio</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">Ubicación</label>
                      <input type="text" placeholder="Ej: Estante 4-B" value={catForm.ubicacion_deposito} onChange={e => setCatForm({...catForm, ubicacion_deposito: e.target.value})} className={`w-full rounded-xl p-2.5 outline-none text-sm border focus:border-indigo-400 ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-amber-100/50 border-amber-200 text-slate-800'}`} />
                    </div>
                  </div>
                </div>

                <div className={`border-t pt-4 mb-4 grid grid-cols-2 gap-3 ${modoOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Costo ($)</label>
                    <input type="text" inputMode="decimal" placeholder="0.00" value={catForm.precio_costo} onChange={e => setCatForm({...catForm, precio_costo: e.target.value.replace(',','.')})} className={`w-full rounded-xl p-2.5 outline-none font-bold text-sm border focus:border-indigo-400 ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-600'}`} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Venta ($)</label>
                    <input type="text" inputMode="decimal" placeholder="0.00" value={catForm.precio_venta} onChange={e => setCatForm({...catForm, precio_venta: e.target.value.replace(',','.')})} className={`w-full rounded-xl p-2.5 outline-none font-black text-sm border focus:border-emerald-500 ${modoOscuro ? 'bg-slate-800 border-emerald-700 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-700'}`} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Stock Físico</label>
                    <input type="number" placeholder="0" value={catForm.stock_actual} onChange={e => setCatForm({...catForm, stock_actual: e.target.value})} className={`w-full rounded-xl p-2.5 outline-none font-bold text-sm border ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Alerta Mínimo</label>
                    <input type="number" placeholder="2" value={catForm.stock_minimo} onChange={e => setCatForm({...catForm, stock_minimo: e.target.value})} className={`w-full rounded-xl p-2.5 outline-none font-bold text-sm border text-rose-500 ${modoOscuro ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
                  </div>
                </div>
                <button onClick={guardarProducto} className={`w-full text-white py-3 mt-2 rounded-xl font-black tracking-wider shadow-md transition-colors uppercase text-sm sm:text-base ${productoEditando ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 hover:bg-slate-800'}`}>
                  {productoEditando ? 'Actualizar Ficha' : 'Guardar en Catálogo'}
                </button>
               </div>
             </div>

             <div className={`lg:col-span-3 p-4 sm:p-6 rounded-2xl shadow-sm border ${modoOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 border-b pb-4 ${modoOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
                <h3 className={`font-bold text-base sm:text-lg flex items-center gap-2 ${modoOscuro ? 'text-white' : 'text-slate-800'}`}>
                  Base de Datos Repuestos 
                  <span className={`px-2 py-1 rounded-md text-[10px] sm:text-xs font-black ${modoOscuro ? 'bg-slate-800 text-indigo-400' : 'bg-slate-100 text-slate-700'}`}>{catalogo.length} ítems</span>
                </h3>
                <div className="relative w-full sm:w-72">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search size={18}/></span>
                  <input type="text" placeholder="Buscar repuesto..." value={busquedaCatalogo} onChange={(e) => setBusquedaCatalogo(e.target.value)} className={`w-full rounded-xl py-2 pl-10 pr-4 text-sm sm:text-base font-medium outline-none border focus:border-indigo-500 ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                </div>
              </div>

              <div className="space-y-3">
                {catalogoFiltradoABM.map(prod => (
                  <div key={prod.id} className={`flex flex-col sm:flex-row justify-between sm:items-center p-3 rounded-xl border shadow-sm transition-colors gap-3 sm:gap-0 ${modoOscuro ? 'bg-slate-800 border-slate-700 hover:border-indigo-500' : 'bg-slate-50 border-slate-200 hover:border-indigo-300'}`}>
                    
                    <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                      <div className={`w-16 h-16 shrink-0 rounded-lg border overflow-hidden flex items-center justify-center relative ${modoOscuro ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <span className="absolute bottom-0 left-0 w-full text-center bg-indigo-600 text-white text-[8px] uppercase font-bold py-0.5">{prod.categoria}</span>
                        {prod.imagen ? <img src={prod.imagen} alt={prod.nombre} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-slate-500" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${modoOscuro ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
            {prod.codigo_sku || 'S/N'}
          </span>
          <p className={`font-black text-sm sm:text-base truncate ${modoOscuro ? 'text-white' : 'text-slate-800'}`}>{prod.nombre}</p>
        </div>
          <div className="flex flex-wrap mt-1 mb-2">
            {renderEtiquetas(prod.marca, 'bg-blue-800/80', 'text-blue-100')}
            {renderEtiquetas(prod.modelos_compatibles, 'bg-emerald-800/80', 'text-emerald-100')}
          </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${prod.stock_actual <= prod.stock_minimo ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'}`}>Stock: {prod.stock_actual}</span>
                          {prod.ubicacion_deposito && <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${modoOscuro ? 'bg-indigo-950 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>Lugar: {prod.ubicacion_deposito}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto border-t sm:border-0 pt-2 sm:pt-0 border-slate-200/50">
                      <p className={`font-black text-base sm:text-lg px-2 py-1 rounded-lg border shadow-sm ${modoOscuro ? 'bg-slate-900 border-slate-700 text-indigo-400' : 'bg-white border-slate-100 text-indigo-600'}`}>${formatMoney(prod.precio_venta)}</p>
                      <div className="flex gap-1 mt-0 sm:mt-2">
                        <button onClick={() => cargarParaEditar(prod)} className={`p-1.5 shadow-sm rounded-md ${modoOscuro ? 'bg-slate-900 text-indigo-400 hover:bg-slate-700' : 'bg-white text-blue-500'}`}><Pencil size={16}/></button>
                        <button onClick={() => borrarProducto(prod.id)} className={`p-1.5 shadow-sm rounded-md ${modoOscuro ? 'bg-slate-900 text-rose-400 hover:bg-slate-700' : 'bg-white text-rose-400'}`}><Trash2 size={16}/></button>
                      </div>
                    </div>
                  </div>
                ))}
                {catalogoFiltradoABM.length === 0 && (
                  <p className="text-slate-400 text-sm italic text-center py-8">No se encontraron productos.</p>
                )}
              </div>
            </div>
           </div>
        )}

        {vistaActiva === 'finanzas' && finanzas && (
          <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 animate-fade-in">
            <div className={`p-2 rounded-2xl shadow-sm border print:hidden flex flex-col sm:flex-row justify-center gap-2 ${modoOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <button onClick={() => setSubVistaFinanzas('resumen')} className={`flex justify-center items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm sm:text-base ${subVistaFinanzas === 'resumen' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}>Dashboard de Cierre</button>
              <button onClick={() => setSubVistaFinanzas('auditoria')} className={`flex justify-center items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm sm:text-base ${subVistaFinanzas === 'auditoria' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}>Auditoría de Tickets</button>
            </div>

            {subVistaFinanzas === 'resumen' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 animate-fade-in">
                <div className={`lg:col-span-2 p-4 sm:p-8 rounded-2xl shadow-xl border print:shadow-none print:border-none print:p-0 ${modoOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6 print:hidden border-b pb-4 ${modoOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
                      <h3 className={`font-black text-lg sm:text-xl uppercase tracking-wide ${modoOscuro ? 'text-white' : 'text-slate-800'}`}>Reporte de Caja</h3>
                      <select value={filtroTiempo} onChange={(e) => cargarFinanzas(e.target.value)} className={`border font-bold rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm outline-none focus:border-indigo-500 ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                        <option value="dia">Día Actual</option>
                        <option value="semana">Esta Semana</option>
                        <option value="mes">Este Mes</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className={`p-4 sm:p-5 rounded-2xl border ${modoOscuro ? 'bg-emerald-950/20 border-emerald-900' : 'bg-emerald-50 border-emerald-100'}`}>
                      <p className="text-emerald-500 font-bold mb-1 uppercase tracking-wider text-[10px] sm:text-xs">Total Ingresos</p>
                      <p className="text-3xl sm:text-4xl font-black text-emerald-400">${formatMoney(finanzas.ingresos.total)}</p>
                      <div className={`grid grid-cols-3 gap-1 sm:gap-2 mt-3 pt-3 border-t ${modoOscuro ? 'border-emerald-900/50' : 'border-emerald-200/50'}`}>
                        <div><p className="text-[8px] sm:text-[9px] text-emerald-500 font-bold uppercase">Efectivo</p><p className="font-black text-xs sm:text-sm text-emerald-400">${formatMoney(finanzas.ingresos.efectivo)}</p></div>
                        <div><p className="text-[8px] sm:text-[9px] text-emerald-500 font-bold uppercase">Transf.</p><p className="font-black text-xs sm:text-sm text-emerald-400">${formatMoney(finanzas.ingresos.transferencia)}</p></div>
                        <div><p className="text-[8px] sm:text-[9px] text-emerald-500 font-bold uppercase">Tarjeta</p><p className="font-black text-xs sm:text-sm text-emerald-400">${formatMoney(finanzas.ingresos.tarjeta)}</p></div>
                      </div>
                    </div>
                    <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col ${modoOscuro ? 'bg-rose-950/20 border-rose-900' : 'bg-rose-50 border-rose-100'}`}>
                      <p className="text-rose-500 font-bold mb-1 uppercase tracking-wider text-[10px] sm:text-xs">Total Egresos</p>
                      <p className="text-3xl sm:text-4xl font-black text-rose-400">-${formatMoney(finanzas.egresos.total)}</p>
                      <div className={`grid grid-cols-3 gap-1 sm:gap-2 mt-auto pt-3 border-t ${modoOscuro ? 'border-rose-900/50' : 'border-rose-200/50'}`}>
                        <div><p className="text-[8px] sm:text-[9px] text-rose-500 font-bold uppercase">Efectivo</p><p className="font-black text-xs sm:text-sm text-rose-400">-${formatMoney(finanzas.egresos.efectivo)}</p></div>
                        <div><p className="text-[8px] sm:text-[9px] text-rose-500 font-bold uppercase">Transf.</p><p className="font-black text-xs sm:text-sm text-rose-400">-${formatMoney(finanzas.egresos.transferencia)}</p></div>
                        <div><p className="text-[8px] sm:text-[9px] text-rose-500 font-bold uppercase">Tarjeta</p><p className="font-black text-xs sm:text-sm text-rose-400">-${formatMoney(finanzas.egresos.tarjeta)}</p></div>
                      </div>
                    </div>
                  </div>
                  <div className={`p-4 sm:p-6 rounded-2xl border-2 text-center mb-6 sm:mb-8 ${modoOscuro ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                    <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">Caja Teórica (Debe haber)</p>
                    <h3 className="text-4xl sm:text-5xl font-black">${formatMoney(finanzas.balance_neto)}</h3>
                  </div>

                  <div className={`pt-4 sm:pt-6 border-t ${modoOscuro ? 'border-slate-800' : 'border-slate-200'}`}>
                    <h3 className={`font-bold mb-3 sm:mb-4 uppercase text-xs sm:text-sm ${modoOscuro ? 'text-slate-400' : 'text-slate-500'}`}>Histórico de Ingresos Brutos</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className={`p-3 sm:p-4 rounded-xl border flex sm:block justify-between items-center ${modoOscuro ? 'bg-indigo-950/20 border-indigo-900' : 'bg-indigo-50 border-indigo-100'}`}>
                        <p className="text-[10px] text-indigo-500 font-bold uppercase sm:mb-1">Total Hoy</p>
                        <p className="text-lg sm:text-2xl font-black text-indigo-400">${formatMoney(totalHoy)}</p>
                      </div>
                      <div className={`p-3 sm:p-4 rounded-xl border flex sm:block justify-between items-center ${modoOscuro ? 'bg-blue-950/20 border-blue-900' : 'bg-blue-50 border-blue-100'}`}>
                        <p className="text-[10px] text-blue-500 font-bold uppercase sm:mb-1">Total Semana</p>
                        <p className="text-lg sm:text-2xl font-black text-blue-400">${formatMoney(totalSemana)}</p>
                      </div>
                      <div className={`p-3 sm:p-4 rounded-xl border flex sm:block justify-between items-center ${modoOscuro ? 'bg-purple-950/20 border-purple-900' : 'bg-purple-50 border-purple-100'}`}>
                        <p className="text-[10px] text-purple-500 font-bold uppercase sm:mb-1">Total Mes</p>
                        <p className="text-lg sm:text-2xl font-black text-purple-400">${formatMoney(totalMes)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-1 space-y-6 print:hidden">
                  <div className={`p-4 sm:p-5 rounded-2xl shadow-sm border ${modoOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className={`font-bold mb-3 text-xs sm:text-sm uppercase ${modoOscuro ? 'text-white' : 'text-slate-800'}`}>Extraer dinero / Gasto</h3>
                    <input type="text" placeholder="Motivo (Ej: Pago proveedor)" value={formEgreso.descripcion} onChange={e=>setFormEgreso({...formEgreso, descripcion: e.target.value})} className={`w-full border rounded-lg p-2.5 mb-2 text-sm outline-none focus:border-rose-400 ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'}`} />
                    
                    <div className="flex flex-col sm:flex-row gap-2 mb-3">
                      <input type="text" inputMode="decimal" placeholder="Monto ($)" value={formEgreso.monto} onChange={e=>setFormEgreso({...formEgreso, monto: e.target.value.replace(',','.')})} className={`w-full sm:w-1/2 border rounded-lg p-2.5 text-sm font-bold outline-none focus:border-rose-400 ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'}`} />
                      <select value={formEgreso.metodo} onChange={e=>setFormEgreso({...formEgreso, metodo: e.target.value})} className={`w-full sm:w-1/2 border rounded-lg p-2.5 text-sm font-bold outline-none focus:border-rose-400 ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Transferencia">Transferencia</option>
                        <option value="Tarjeta">Tarjeta</option>
                      </select>
                    </div>

                    <button onClick={guardarEgreso} className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold py-2.5 rounded-lg text-sm transition-colors">Registrar Salida</button>

                    {finanzas.lista_egresos.length > 0 && (
                      <div className={`mt-4 pt-4 border-t ${modoOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
                        <p className={`text-[10px] sm:text-xs font-bold mb-2 uppercase ${modoOscuro ? 'text-slate-500' : 'text-slate-400'}`}>Últimos gastos ({filtroTiempo})</p>
                        <div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto no-scrollbar">
                          {finanzas.lista_egresos.map(e => (
                             <div key={e.id} className="flex justify-between items-center text-[10px] sm:text-xs">
                                <span className={`truncate pr-2 ${modoOscuro ? 'text-slate-400' : 'text-slate-500'}`}>- {e.desc}</span>
                                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                  <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded font-black ${e.metodo==='Efectivo'?'bg-blue-500/20 text-blue-400':e.metodo==='Tarjeta'?'bg-amber-500/20 text-amber-400':'bg-emerald-500/20 text-emerald-400'}`}>{e.metodo}</span>
                                  <span className="text-rose-400 font-bold">${formatMoney(e.monto)}</span>
                                </div>
                             </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {subVistaFinanzas === 'auditoria' && (
              <div className={`p-4 sm:p-6 rounded-2xl shadow-sm border animate-fade-in print:hidden ${modoOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <h3 className={`font-black text-lg sm:text-xl ${modoOscuro ? 'text-white' : 'text-slate-800'}`}>Auditoría de Tickets</h3>
                  <button onClick={descargarBackupCSV} className="w-full sm:w-auto flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm sm:text-base font-bold shadow-md"><FileSpreadsheet size={16}/> Descargar Excel</button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:gap-6">
                  <input type="text" placeholder="Buscar ticket o monto..." value={filtroHistorial} onChange={(e) => setFiltroHistorial(e.target.value)} className={`w-full rounded-xl py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base font-medium outline-none border focus:border-indigo-500 ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                  <select value={filtroMetodo} onChange={(e) => setFiltroMetodo(e.target.value)} className={`rounded-xl p-2 sm:p-3 text-sm sm:text-base font-medium outline-none border focus:border-indigo-500 ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <option value="Todos">Todos los pagos</option>
                    <option value="Efectivo">Solo Efectivo</option>
                    <option value="Transferencia">Solo Transf.</option>
                    <option value="Tarjeta">Solo Tarjeta</option>
                    <option value="Mixto">Pagos Mixtos</option>
                  </select>
                </div>

                <div className={`overflow-x-auto rounded-xl border ${modoOscuro ? 'border-slate-800' : 'border-slate-200'}`}>
                  <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
                    <thead className="bg-slate-900 text-white">
                      <tr>
                        <th className="p-3 sm:p-4 font-bold">#</th>
                        <th className="p-3 sm:p-4 font-bold">Fecha / Hora</th>
                        <th className="p-3 sm:p-4 font-bold">Detalle</th>
                        <th className="p-3 sm:p-4 font-bold">Pago</th>
                        <th className="p-3 sm:p-4 font-bold">Total</th>
                        <th className="p-3 sm:p-4 font-bold text-center">X</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${modoOscuro ? 'divide-slate-800' : 'divide-slate-200'}`}>
                      {historialFiltrado.map(v => {
                        const cantPagos = (v.efectivo > 0 ? 1 : 0) + (v.transferencia > 0 ? 1 : 0) + ((v.tarjeta || 0) > 0 ? 1 : 0);
                        const esMixto = cantPagos > 1;
                        let colorBadge = 'bg-blue-500/20 text-blue-400';
                        let textoBadge = 'Efectivo';
                        
                        if (esMixto) { colorBadge = 'bg-indigo-500/20 text-indigo-400'; textoBadge = 'Mixto'; }
                        else if (v.transferencia > 0) { colorBadge = 'bg-emerald-500/20 text-emerald-400'; textoBadge = 'Transf.'; }
                        else if ((v.tarjeta || 0) > 0) { colorBadge = 'bg-amber-500/20 text-amber-400'; textoBadge = 'Tarjeta'; }

                        return (
                          <tr key={v.id} className={`transition-colors ${modoOscuro ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                            <td className="p-3 sm:p-4 font-black text-slate-400">{v.id}</td>
                            <td className={`p-3 sm:p-4 font-medium ${modoOscuro ? 'text-slate-300' : 'text-slate-600'}`}>{new Date(v.fecha).toLocaleDateString()} <span className="opacity-50">|</span> {new Date(v.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                            <td className="p-3 sm:p-4"><p className={`max-w-[150px] sm:max-w-[300px] truncate ${modoOscuro ? 'text-slate-200' : 'text-slate-700'}`} title={v.detalle_ticket}>{v.detalle_ticket}</p></td>
                            <td className="p-3 sm:p-4">
                              <span className={`px-2 py-1 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${colorBadge}`}>{textoBadge}</span>
                              {esMixto && (
                                <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold mt-1 sm:mt-1.5 flex flex-col sm:flex-row gap-0.5 sm:gap-1.5">
                                  {v.efectivo > 0 && <span>Ef: ${formatMoney(v.efectivo)}</span>}
                                  {v.transferencia > 0 && <span>Tr: ${formatMoney(v.transferencia)}</span>}
                                  {(v.tarjeta || 0) > 0 && <span>Tj: ${formatMoney(v.tarjeta)}</span>}
                                </div>
                              )}
                            </td>
                            <td className={`p-3 sm:p-4 font-black ${modoOscuro ? 'text-white' : 'text-slate-800'}`}>{formatMoney(v.total)}</td>
                            <td className="p-3 sm:p-4 text-center"><button onClick={() => anularVenta(v.id)} className="text-rose-400 hover:bg-rose-500/10 p-1.5 sm:p-2 rounded-lg"><Trash2 size={16}/></button></td>
                          </tr>
                        );
                      })}
                      {historialFiltrado.length === 0 && (
                        <tr><td colSpan="6" className="text-center p-6 sm:p-8 text-slate-400 italic">No hay tickets registrados.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {vistaActiva === 'produccion' && (
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 animate-fade-in print:hidden">
            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-br from-indigo-950 to-slate-900 p-5 sm:p-6 rounded-2xl shadow-lg text-white border border-indigo-900">
                <h3 className="font-black uppercase tracking-wider text-xs sm:text-sm mb-3 sm:mb-4 text-indigo-300">Inteligencia Comercial</h3>
                <p className="text-[10px] sm:text-xs text-slate-300 mb-3 sm:mb-4">Repuestos más vendidos este mes:</p>
                <div className="space-y-2 sm:space-y-3">
                  {top3Produccion.map((item, idx) => (
                    <div key={idx} className="bg-white/10 rounded-xl p-2.5 sm:p-3 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-xs sm:text-sm text-white">{item.nombre}</p>
                        <p className="text-[9px] sm:text-[10px] text-indigo-300 uppercase mt-0.5">Top #{idx+1}</p>
                      </div>
                      <span className="bg-indigo-600 text-white font-black text-[10px] sm:text-xs px-2 py-1 rounded-lg">{item.cantidad} uni.</span>
                    </div>
                  ))}
                  {top3Produccion.length === 0 && <p className="text-[10px] sm:text-xs text-slate-400 italic">No hay ventas registradas este mes.</p>}
                </div>
              </div>
            </div>

            <div className={`lg:col-span-2 p-4 sm:p-6 rounded-2xl shadow-sm border ${modoOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 ${modoOscuro ? 'text-white' : 'text-slate-800'}`}>Calculadora Automática de Inversión</h2>
              <div className={`p-4 sm:p-6 rounded-2xl border mb-6 sm:mb-8 ${modoOscuro ? 'bg-indigo-950/20 border-indigo-900' : 'bg-blue-50 border-blue-100'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-indigo-400 uppercase ml-1">Lote o Repuesto comprado</label>
                    <input type="text" placeholder="Ej: Kit Transmisión Titan" value={prodForm.producto} onChange={e => setProdForm({...prodForm, producto: e.target.value})} className={`w-full border p-2.5 sm:p-3 rounded-xl outline-none font-bold text-sm sm:text-base ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-white text-slate-800'}`} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-indigo-400 uppercase ml-1">Inversión Total ($)</label>
                    <input type="text" inputMode="decimal" placeholder="Ej: 50000" value={prodForm.costo} onChange={e => setProdForm({...prodForm, costo: e.target.value.replace(',','.')})} className={`w-full border p-2.5 sm:p-3 rounded-xl outline-none font-black text-sm sm:text-base ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-white text-slate-800'}`} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-indigo-400 uppercase ml-1">¿Cuántas unidades traía?</label>
                    <input type="text" inputMode="decimal" placeholder="Ej: 5" value={prodForm.cantidad} onChange={e => setProdForm({...prodForm, cantidad: e.target.value.replace(',','.')})} className={`w-full border p-2.5 sm:p-3 rounded-xl outline-none font-black text-sm sm:text-base ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-white text-slate-800'}`} />
                  </div>
                </div>
                <div className={`p-3 sm:p-4 rounded-xl border mb-4 shadow-sm ${modoOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-200'}`}>
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <span className="font-bold text-xs sm:text-sm text-slate-400">Costo real unitario:</span>
                    <span className="font-black text-base sm:text-lg text-rose-500">${formatMoney(costoUnitario)}</span>
                  </div>
                  <div className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border-t pt-3 sm:pt-4 ${modoOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div className="flex-1">
                      <label className="text-[10px] sm:text-xs font-bold text-indigo-400 uppercase">Margen Deseado (%)</label>
                      <div className="flex items-center mt-1">
                        <input type="range" min="10" max="300" step="5" value={prodForm.margenDeseado} onChange={e => setProdForm({...prodForm, margenDeseado: e.target.value})} className="w-full accent-indigo-500" />
                        <span className="ml-3 font-black text-indigo-400 text-sm sm:text-base w-10 sm:w-12">{prodForm.margenDeseado}%</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg text-right sm:w-1/3 ${modoOscuro ? 'bg-slate-800 text-emerald-400' : 'bg-blue-100 text-emerald-700'}`}>
                      <p className="text-[9px] sm:text-[10px] font-bold uppercase opacity-80">Sugerido</p>
                      <p className="font-black text-lg sm:text-xl">${formatMoney(precioSugerido)}</p>
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-xs font-bold text-indigo-400 uppercase ml-1">Precio Final de Venta ($)</label>
                  <input type="text" inputMode="decimal" placeholder="Ej: 15000" value={prodForm.precio} onChange={e => setProdForm({...prodForm, precio: e.target.value.replace(',','.')})} className={`w-full border p-2.5 sm:p-3 rounded-xl outline-none font-black text-base sm:text-lg ${modoOscuro ? 'bg-slate-800 border-slate-700 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`} />
                </div>
                <button onClick={guardarProduccion} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 sm:py-3 rounded-xl uppercase text-sm sm:text-base shadow-md">Guardar en Historial</button>
              </div>

              <h3 className={`font-bold mb-3 sm:mb-4 border-b pb-2 text-sm sm:text-base ${modoOscuro ? 'text-white border-slate-800' : 'text-slate-600'}`}>Historial de Inversiones</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {historialProd.map((r) => {
                  const costoInvertido = r.costo_produccion || 0;
                  const unidades = r.cantidad_producida || 1;
                  const precioUnidad = r.precio_venta_estimado || 0;
                  const ganancia = (precioUnidad * unidades) - costoInvertido;
                  return (
                    <div key={r.id} className={`border p-3 sm:p-4 rounded-2xl relative overflow-hidden ${modoOscuro ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${ganancia > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      <span className={`font-black ml-2 text-sm sm:text-base ${modoOscuro ? 'text-white' : 'text-slate-800'}`}>{r.producto}</span>
                      <span className="text-[10px] sm:text-xs font-bold text-slate-400 ml-1">({unids => unids} uni.)</span>
                      <div className={`flex justify-between text-[10px] sm:text-xs font-bold p-1.5 sm:p-2 rounded-lg ml-2 mt-2 ${modoOscuro ? 'bg-slate-900 text-slate-300' : 'bg-white text-slate-600'}`}>
                        <span>Inv: <strong className="text-rose-500">${formatMoney(costoInvertido)}</strong></span>
                      </div>
                      <div className={`mt-2 font-black text-[10px] sm:text-sm px-2 py-1 rounded-lg ml-2 inline-block ${ganancia > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        Ganancia: ${formatMoney(ganancia)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}