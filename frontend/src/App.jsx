import { useState, useEffect } from 'react';
import { 
  Store, Tag, Wallet, ChefHat, Banknote, CreditCard, SplitSquareHorizontal, 
  Trash2, Printer, Plus, Minus, X, Check, Search, TrendingUp, AlertTriangle, 
  Download, ClipboardList, Target, Scale, Info, Clock, Pencil, FileSpreadsheet 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Sonidos del sistema
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

// Formateador de dinero (A prueba de errores y con puntos de miles)
const formatMoney = (val) => {
  const num = parseFloat(val);
  if (isNaN(num)) return '0';
  return num.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

export default function App() {
  const [vistaActiva, setVistaActiva] = useState('pos');
  const [horaActual, setHoraActual] = useState(new Date());
  
  // DATOS GLOBALES
  const [catalogo, setCatalogo] = useState([]);
  const [historialVentas, setHistorialVentas] = useState([]);
  const [finanzas, setFinanzas] = useState(null);
  const [filtroTiempo, setFiltroTiempo] = useState('dia');
  const [historialProd, setHistorialProd] = useState([]);
  const [alertasInteligentes, setAlertasInteligentes] = useState([]);

  // ESTADOS CAJA (POS)
  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  
  // MODALES CAJA
  const [modalMixto, setModalMixto] = useState(false);
  const [montoEfMixto, setMontoEfMixto] = useState('');
  const [modalEfectivo, setModalEfectivo] = useState(false);
  const [pagaCon, setPagaCon] = useState('');
  const [modalPeso, setModalPeso] = useState({ open: false, prod: null, pesoManual: '' });

  // ESTADOS FINANZAS Y AUDITORÍA
  const [subVistaFinanzas, setSubVistaFinanzas] = useState('resumen');
  const [filtroHistorial, setFiltroHistorial] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState('Todos');
  const [dineroEnCaja, setDineroEnCaja] = useState('');
  const [formEgreso, setFormEgreso] = useState({ descripcion: '', monto: '' });

  // ESTADOS ABM CATÁLOGO (CON EDICIÓN)
  const [busquedaCatalogo, setBusquedaCatalogo] = useState('');
  const [productoEditando, setProductoEditando] = useState(null);
  const unidadesComunes = ['Unidad', '1/2 Docena', 'Docena', '100 Gr', '1/4 Kilo', '1/2 Kilo', 'Kilo', 'Porción', 'Promo'];
  const [catForm, setCatForm] = useState({ 
    nombre: '', 
    tipo_venta: 'simple', 
    precio_base: '', 
    variantes: [{ unidad: 'Docena', precio: '' }] 
  });
  const [catVariantes, setCatVariantes] = useState([{ unidad: 'Unidad', precio: '' }]);

  // ESTADOS PRODUCCIÓN
  const [prodForm, setProdForm] = useState({ 
    producto: '', 
    costo: '', 
    cantidad: '', 
    margenDeseado: '50', 
    precio: '' 
  });

  // --- API HELPER ---
  const fetchAPI = async (endpoint, method = 'GET', body = null) => {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`https://kiosco-backend.ddns.net/api/${endpoint}`, opts);
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
      setAlertasInteligentes(alertasNuevas);
      if (alertasNuevas.length > 0) playAudio('notification');
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (vistaActiva !== 'pos' || modalEfectivo || modalMixto || modalPeso.open) return;
      if (e.key === 'F3') { 
        e.preventDefault(); 
        document.getElementById('buscador-pos')?.focus(); 
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [vistaActiva, modalEfectivo, modalMixto, modalPeso.open]);

  // --- INTELIGENCIA DE DATOS (MES ACTUAL + UNIDADES) ---
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
        
        // Ranking general histórico para ordenar el catálogo del POS
        rankingVentasPOS[nombre] = (rankingVentasPOS[nombre] || 0) + cant;

        // Ranking de producción (Solo mes actual y separadas por unidad de medida)
        if (esMesActual && unidad !== 'Libre') {
          const prodKey = `${nombre}:::${unidad}`;
          rankingProduccionMap[prodKey] = (rankingProduccionMap[prodKey] || 0) + cant;
        }
      }
    });
  });
  
  const catalogoOrdenado = [...catalogo].sort((a, b) => (rankingVentasPOS[b.nombre] || 0) - (rankingVentasPOS[a.nombre] || 0));
  const catalogoFiltradoPOS = catalogoOrdenado.filter(prod => prod.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  const catalogoFiltradoABM = catalogo.filter(prod => prod.nombre.toLowerCase().includes(busquedaCatalogo.toLowerCase()));
  
  // Transformar el mapa en la lista Top 3 de Producción
  const top3Produccion = Object.entries(rankingProduccionMap)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 3)
    .map(item => {
      const [nombre, unidad] = item[0].split(':::');
      return { nombre, unidad, cantidad: parseFloat(item[1].toFixed(2)) };
    });

  // --- LÓGICA MATEMÁTICA CAJA (POS BLINDADA) ---
  const totalCarrito = carrito.reduce((sum, item) => {
    const cant = parseFloat(item.cantidad) || 0;
    const precioBase = parseFloat(item.precioBase) || 0;
    return sum + (cant * precioBase);
  }, 0); 
  
  const vueltoEfectivo = (parseFloat(pagaCon) || 0) - totalCarrito;

  const agregarAlCarrito = (prod, varData = null) => {
    playAudio('click');
    if (prod.tipo_venta === 'peso') {
      setModalPeso({ open: true, prod: prod, pesoManual: '' });
      return;
    }
    
    let idUnico, unidadStr, precioBaseNum;
    if (prod.tipo_venta === 'simple') {
      idUnico = `${prod.id}-simple`;
      unidadStr = 'Unidad';
      precioBaseNum = parseFloat(prod.precio_base) || 0;
    } else {
      idUnico = `${prod.id}-${varData.unidad}`;
      unidadStr = varData.unidad;
      precioBaseNum = parseFloat(varData.precio) || 0;
    }

    setCarrito(prev => {
      const existeIdx = prev.findIndex(i => i.idUnico === idUnico);
      if (existeIdx >= 0) {
        const nuevo = [...prev];
        nuevo[existeIdx].cantidad = (parseFloat(nuevo[existeIdx].cantidad) || 0) + 1;
        return nuevo;
      }
      return [...prev, { 
        idUnico, 
        nombre: prod.nombre, 
        unidad: unidadStr, 
        precioBase: precioBaseNum, 
        cantidad: 1 
      }];
    });
  };

  const confirmarPeso = (pesoGramosRaw) => {
    const gramosLimpio = String(pesoGramosRaw).replace(',', '.');
    const gramosNum = parseFloat(gramosLimpio);
    
    if (isNaN(gramosNum) || gramosNum <= 0) return toast.error("Peso inválido. Ingresá gramos (Ej: 250)");
    
    const pesoKilos = gramosNum / 1000;
    const precioBaseUnKilo = parseFloat(modalPeso.prod.precio_base) || 0;
    
    setCarrito([...carrito, { 
      idUnico: Date.now(), 
      nombre: modalPeso.prod.nombre, 
      unidad: `${gramosNum}g`, 
      precioBase: precioBaseUnKilo, 
      cantidad: pesoKilos 
    }]);
    setModalPeso({ open: false, prod: null, pesoManual: '' });
    playAudio('click');
  };

  const agregarLibre = () => {
    const desc = window.prompt("Descripción de la venta:");
    if (!desc) return;
    const montoRaw = window.prompt("Monto a cobrar ($):");
    const monto = parseFloat(montoRaw.replace(',', '.'));
    if (monto > 0) {
      setCarrito([...carrito, { 
        idUnico: Date.now(), 
        nombre: desc, 
        unidad: 'Libre', 
        precioBase: monto, 
        cantidad: 1 
      }]);
    }
  };

  const actualizarInputCantidad = (idx, valorBruto) => {
    const n = [...carrito];
    n[idx].cantidad = String(valorBruto).replace(',', '.');
    setCarrito(n);
  };

  const procesarCantidadBlur = (idx) => {
    const n = [...carrito];
    const val = parseFloat(n[idx].cantidad);
    if (isNaN(val) || val <= 0) { 
      n.splice(idx, 1); 
    } else { 
      n[idx].cantidad = val; 
    }
    setCarrito(n);
  };

  const cobrar = async (metodo, ef = 0, tr = 0) => {
    if (carrito.length === 0) { 
      playAudio('error'); 
      return toast.error("Carrito vacío"); 
    }
    let efectivo = ef, transferencia = tr;
    if (metodo === 'Efectivo') efectivo = totalCarrito;
    if (metodo === 'Transferencia') transferencia = totalCarrito;

    const detalle = carrito.map(i => `${parseFloat(i.cantidad) || 0}x ${i.nombre} (${i.unidad})`).join(' | ');

    try {
      await fetchAPI('ventas', 'POST', { 
        total: totalCarrito, 
        efectivo, 
        transferencia, 
        detalle_ticket: detalle 
      });
      playAudio('success'); 
      toast.success("¡Cobro Exitoso!");
      setCarrito([]); 
      setModalMixto(false); 
      setModalEfectivo(false); 
      setMontoEfMixto(''); 
      setPagaCon('');
      cargarDatos();
    } catch (e) { 
      playAudio('error'); 
      toast.error("Error al registrar venta"); 
    }
  };

  const anularVenta = async (id) => {
    if(!window.confirm('¿Anular permanentemente?')) return;
    try { 
      await fetchAPI(`ventas/${id}`, 'DELETE'); 
      cargarDatos(); 
      toast.success('Venta anulada'); 
    } catch(e){}
  };

  // --- LÓGICA CATÁLOGO Y EDICIÓN ---
  const updateVariante = (idx, campo, valor) => { 
    const nuevas = [...catVariantes]; 
    nuevas[idx][campo] = valor.replace(',','.'); 
    setCatVariantes(nuevas); 
  };
  
  const addVariante = () => {
    setCatVariantes([...catVariantes, { unidad: 'Unidad', precio: '' }]);
  };
  
  const removeVariante = (idx) => {
    setCatVariantes(catVariantes.filter((_, i) => i !== idx));
  };

  const cargarParaEditar = (prod) => {
    setProductoEditando(prod.id);
    setCatForm({
      nombre: prod.nombre,
      tipo_venta: prod.tipo_venta,
      precio_base: prod.precio_base.toString(),
      variantes: prod.variantes.length > 0 ? prod.variantes : [{ unidad: 'Docena', precio: '' }]
    });
    setCatVariantes(prod.variantes.length > 0 ? prod.variantes : [{ unidad: 'Unidad', precio: '' }]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success(`Editando: ${prod.nombre}`);
  };

  const cancelarEdicion = () => {
    setProductoEditando(null);
    setCatForm({ 
      nombre: '', 
      tipo_venta: 'simple', 
      precio_base: '', 
      variantes: [{ unidad: 'Docena', precio: '' }] 
    }); 
    setCatVariantes([{ unidad: 'Unidad', precio: '' }]);
  };
  
  const guardarProducto = async () => {
    if (!catForm.nombre) return toast.error("Falta nombre");
    if (catForm.tipo_venta === 'variantes' && catVariantes.some(v => !v.precio)) return toast.error("Las variantes necesitan precio");
    if (catForm.tipo_venta !== 'variantes' && !catForm.precio_base) return toast.error("Falta precio base");

    const payload = { 
      nombre: catForm.nombre, 
      tipo_venta: catForm.tipo_venta,
      precio_base: parseFloat(String(catForm.precio_base).replace(',','.')) || 0,
      variantes: catForm.tipo_venta === 'variantes' ? catVariantes.map(v => ({ 
        unidad: v.unidad, 
        precio: parseFloat(String(v.precio).replace(',','.')) || 0 
      })) : []
    };

    try {
      if (productoEditando) {
        await fetchAPI(`productos/${productoEditando}`, 'PUT', payload);
        toast.success("Producto actualizado");
      } else {
        await fetchAPI('productos', 'POST', payload);
        toast.success("Producto creado"); 
      }
      cancelarEdicion();
      cargarDatos();
    } catch (e) { 
      toast.error("Error al guardar"); 
    }
  };

  const borrarProducto = async (id) => {
    if(!window.confirm("¿Borrar producto?")) return;
    try { 
      await fetchAPI(`productos/${id}`, 'DELETE'); 
      cargarDatos(); 
      toast.success("Borrado"); 
    } catch(e){}
  };

  // --- LÓGICA FINANZAS Y AUDITORÍA ---
  const guardarEgreso = async () => {
    if (!formEgreso.monto || !formEgreso.descripcion) return;
    try { 
      await fetchAPI('egresos', 'POST', { 
        monto: parseFloat(String(formEgreso.monto).replace(',','.')), 
        descripcion: formEgreso.descripcion 
      }); 
      toast.success("Egreso registrado"); 
      setFormEgreso({ descripcion: '', monto: '' }); 
      cargarFinanzas(filtroTiempo); 
    } catch(e) { }
  };

  const descargarBackupCSV = () => {
    if (historialVentas.length === 0) return toast.error('No hay ventas para exportar');
    
    let csv = '\uFEFFID Ticket;Fecha;Hora;Total Cobrado;Efectivo;Transferencia;Detalle de Productos\n';
    
    historialVentas.forEach(v => {
      const fechaObj = new Date(v.fecha);
      const fechaStr = fechaObj.toLocaleDateString();
      const horaStr = fechaObj.toLocaleTimeString();
      const detalleLimpio = v.detalle_ticket.replace(/"/g, '""');
      
      csv += `${v.id};${fechaStr};${horaStr};${v.total};${v.efectivo};${v.transferencia};"${detalleLimpio}"\n`;
    });
    
    const link = document.createElement('a'); 
    link.href = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.setAttribute('download', `Copia_Seguridad_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
    document.body.appendChild(link); 
    link.click(); 
    document.body.removeChild(link);
    toast.success("Excel descargado");
  };

  const historialFiltrado = historialVentas.filter(v => {
    const coincideTexto = v.detalle_ticket.toLowerCase().includes(filtroHistorial.toLowerCase()) || v.total.toString().includes(filtroHistorial);
    const esMixto = v.efectivo > 0 && v.transferencia > 0;
    const metodoString = esMixto ? 'Mixto' : (v.efectivo > 0 ? 'Efectivo' : 'Transferencia');
    return coincideTexto && (filtroMetodo === 'Todos' || metodoString === filtroMetodo);
  });

  // --- LÓGICA PRODUCCIÓN INTELIGENTE ---
  const costoProduccionNum = parseFloat(String(prodForm.costo).replace(',','.')) || 0;
  const cantProducidaNum = parseFloat(String(prodForm.cantidad).replace(',','.')) || 0;
  const costoUnitario = cantProducidaNum > 0 ? (costoProduccionNum / cantProducidaNum) : 0;
  const margenDeseadoNum = parseFloat(prodForm.margenDeseado) || 0;
  const precioSugerido = costoUnitario > 0 ? costoUnitario * (1 + (margenDeseadoNum / 100)) : 0;

  const guardarProduccion = async () => {
    if (!prodForm.producto || !prodForm.costo || !prodForm.precio) return toast.error("Completá todos los campos obligatorios");
    try { 
      await fetchAPI('rendimientos', 'POST', { 
        producto: prodForm.producto, 
        costo_produccion: costoProduccionNum, 
        precio_venta_estimado: parseFloat(String(prodForm.precio).replace(',','.')), 
        cantidad_producida: cantProducidaNum || 1
      }); 
      toast.success("Registrado correctamente"); 
      setProdForm({ producto: '', costo: '', precio: '', cantidad: '', margenDeseado: '50' }); 
      cargarDatos(); 
    } catch(e) { 
      toast.error("Error al registrar"); 
    }
  };

  // --- RENDER COMPLETO ---
  return (
    <div translate="no" className="min-h-screen bg-slate-50 text-slate-800 font-sans print:bg-white selection:bg-blue-200">
      <Toaster position="top-center" className="print:hidden" />
      
      {/* NAVBAR */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex gap-2">
            {[
              { id: 'pos', icon: Store, label: 'Caja POS' },
              { id: 'catalogo', icon: Tag, label: 'Catálogo' },
              { id: 'finanzas', icon: Wallet, label: 'Finanzas & Auditoría' },
              { id: 'produccion', icon: ChefHat, label: 'Producción' },
            ].map(btn => (
              <button 
                key={btn.id} 
                onClick={() => {playAudio('click'); setVistaActiva(btn.id)}} 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap shrink-0 ${vistaActiva === btn.id ? 'bg-blue-600 shadow-md scale-105' : 'hover:bg-slate-800 text-slate-300'}`}
              >
                <btn.icon size={18} /> {btn.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ALERTAS INTELIGENTES */}
      {alertasInteligentes.length > 0 && vistaActiva === 'pos' && (
        <div className="max-w-7xl mx-auto px-4 mt-4 animate-fade-in flex flex-col gap-2 print:hidden">
          {alertasInteligentes.map(alerta => (
            <div 
              key={alerta.id} 
              className={`flex items-center justify-between p-3 rounded-xl shadow-sm border ${
                alerta.tipo === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                alerta.tipo === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {alerta.tipo === 'warning' ? <AlertTriangle size={20} className="text-amber-500" /> : 
                 alerta.tipo === 'success' ? <TrendingUp size={20} className="text-emerald-500"/> : 
                 <Info size={20} className="text-blue-500"/>}
                <div>
                  <h4 className="font-bold text-sm">{alerta.titulo}</h4>
                  <p className="text-xs opacity-80">{alerta.mensaje}</p>
                </div>
              </div>
              <button 
                onClick={() => setAlertasInteligentes(alertasInteligentes.filter(a => a.id !== alerta.id))} 
                className="p-1 rounded-md opacity-50 hover:opacity-100 transition-opacity"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      <main className="max-w-7xl mx-auto mt-6 px-4 pb-12 print:mt-0 print:p-0">
        
        {/* =========================================================
            VISTA 1: PUNTO DE VENTA (CAJA)
            ========================================================= */}
        {vistaActiva === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in relative">
            
            {/* MODAL BALANZA (VENTA EN GRAMOS) */}
            {modalPeso.open && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
                <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fade-in">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black text-xl flex items-center gap-2 text-slate-800">
                      <Scale size={24} className="text-amber-500"/> Balanza
                    </h3>
                    <button 
                      onClick={() => setModalPeso({open:false, prod:null, pesoManual:''})} 
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X size={20}/>
                    </button>
                  </div>
                  
                  <p className="text-center font-bold text-lg text-slate-700 mb-1">
                    {modalPeso.prod.nombre}
                  </p>
                  
                  <p className="text-center text-sm text-slate-500 mb-6">
                    ${formatMoney(modalPeso.prod.precio_base)} por Kilo
                  </p>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[100, 200, 250, 500, 750, 1000].map(peso => (
                      <button 
                        key={peso} 
                        onClick={() => confirmarPeso(peso)} 
                        className="bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-900 border border-amber-200 font-bold py-2 rounded-xl transition-all"
                      >
                        {peso >= 1000 ? `${peso/1000} Kg` : `${peso}g`}
                      </button>
                    ))}
                  </div>
                  
                  <div className="relative mt-4">
                    <input 
                      type="text" 
                      inputMode="numeric" 
                      placeholder="Ej: 350" 
                      value={modalPeso.pesoManual} 
                      onChange={e => setModalPeso({...modalPeso, pesoManual: e.target.value.replace(/\D/g,'')})} 
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 font-bold text-center outline-none focus:border-amber-400"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Gramos</span>
                  </div>
                  
                  <button 
                    onClick={() => confirmarPeso(modalPeso.pesoManual)} 
                    className="w-full mt-3 bg-slate-800 hover:bg-slate-900 text-white font-black py-3 rounded-xl shadow-md"
                  >
                    Agregar a Ticket
                  </button>
                </div>
              </div>
            )}

            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 transition-all">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Store/> Punto de Venta
                      {finanzas && finanzas.lista_egresos.length === 0 && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-1 rounded-full animate-pulse flex items-center gap-1">
                          <AlertTriangle size={12}/> Sin gastos hoy
                        </span>
                      )}
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1 flex items-center gap-1.5">
                      <Clock size={12} className="text-blue-500"/>
                      {horaActual.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })} — {horaActual.toLocaleTimeString('es-AR')}
                    </p>
                  </div>
                  
                  <div className="relative w-full sm:w-64 group flex-shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Search size={18}/>
                    </span>
                    <input 
                      id="buscador-pos" 
                      type="text" 
                      placeholder="Buscar (F3)..." 
                      value={busqueda} 
                      onChange={(e) => setBusqueda(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" 
                    />
                    {busqueda && (
                      <button 
                        onClick={() => setBusqueda('')} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={16}/>
                      </button>
                    )}
                  </div>
                  
                  <button 
                    onClick={agregarLibre} 
                    className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap"
                  >
                    + Libre
                  </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {catalogoFiltradoPOS.map(prod => (
                    <div 
                      key={prod.id} 
                      className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-blue-400 flex flex-col group cursor-pointer" 
                      onClick={() => prod.tipo_venta !== 'variantes' && agregarAlCarrito(prod)}
                    >
                      <h3 className="font-bold text-slate-800 mb-2 truncate text-sm" title={prod.nombre}>
                        {rankingVentasPOS[prod.nombre] > 5 && <span className="text-amber-500 mr-1 text-xs">★</span>}
                        {prod.nombre}
                      </h3>
                      
                      {prod.tipo_venta === 'simple' && (
                        <span className="mt-auto font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-center">
                          ${formatMoney(prod.precio_base)}
                        </span>
                      )}
                      
                      {prod.tipo_venta === 'peso' && (
                        <span className="mt-auto font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg text-center flex justify-center items-center gap-1">
                          <Scale size={14}/> ${formatMoney(prod.precio_base)}/kg
                        </span>
                      )}
                      
                      {prod.tipo_venta === 'variantes' && (
                        <div className="flex flex-col gap-1.5 mt-auto">
                          {prod.variantes.map((v, i) => (
                            <button 
                              key={i} 
                              onClick={(e) => { e.stopPropagation(); agregarAlCarrito(prod, v); }} 
                              className="w-full bg-slate-50 hover:bg-blue-600 hover:text-white border border-slate-100 text-slate-700 rounded-lg px-2 py-1 text-left transition-colors flex justify-between items-center"
                            >
                              <span className="text-[10px] font-bold uppercase truncate">{v.unidad}</span>
                              <span className="font-black text-sm">${formatMoney(v.precio)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ÚLTIMAS VENTAS */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-3 flex justify-between items-center border-b pb-2">
                  Últimos cobros 
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded">{historialVentas.length} hoy</span>
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {historialVentas.slice(0,8).map(v => (
                    <div 
                      key={v.id} 
                      className="min-w-[240px] bg-slate-50 p-4 rounded-xl border border-slate-200 shrink-0 relative hover:border-slate-300"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-black text-xl text-emerald-600">${formatMoney(v.total)}</span>
                        <button 
                          onClick={() => anularVenta(v.id)} 
                          className="text-rose-400 hover:bg-rose-100 p-1.5 rounded"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-3 mb-2">{v.detalle_ticket}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CARRITO Y COBRO CON CANTIDADES EDITABLES BLINDADAS */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col h-[calc(100vh-120px)] lg:sticky lg:top-24 overflow-hidden">
              <div className="bg-slate-800 text-white p-4 text-center flex justify-between items-center">
                <h2 className="font-black tracking-widest uppercase text-lg">Ticket de Venta</h2>
                {carrito.length > 0 && (
                  <button 
                    onClick={() => setCarrito([])} 
                    className="text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 size={20}/>
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50 relative">
                {carrito.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-2">
                    <Store size={48}/>
                    <p className="font-medium">Caja lista</p>
                  </div>
                ) : (
                  carrito.map((item, idx) => {
                    const prodCatalogo = catalogo.find(p => p.nombre === item.nombre);
                    const cantSegura = parseFloat(item.cantidad) || 0;
                    const pbSeguro = parseFloat(item.precioBase) || 0;
                    const subtotal = cantSegura * pbSeguro;

                    return (
                      <div 
                        key={item.idUnico} 
                        className="flex flex-col bg-white p-3 rounded-xl shadow-sm border border-slate-200 animate-fade-in hover:border-blue-300 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 pr-2">
                            <p className="font-bold text-sm text-slate-800 leading-tight">{item.nombre}</p>
                            
                            {item.unidad !== 'Libre' && item.unidad !== 'Kg' && prodCatalogo && prodCatalogo.tipo_venta === 'variantes' ? (
                              <select
                                value={item.idUnico}
                                onChange={(e) => {
                                  const newIdUnico = e.target.value;
                                  const variant = prodCatalogo.variantes.find(v => `${prodCatalogo.id}-${v.unidad}` === newIdUnico);
                                  if (variant) {
                                    const n = [...carrito]; 
                                    n[idx].idUnico = newIdUnico; 
                                    n[idx].unidad = variant.unidad; 
                                    n[idx].precioBase = parseFloat(variant.precio) || 0; 
                                    setCarrito(n);
                                  }
                                }}
                                className="mt-1 text-[11px] font-bold text-blue-700 bg-blue-50/80 px-2 py-1 rounded border border-blue-200 outline-none cursor-pointer w-full"
                              >
                                {prodCatalogo.variantes.map(v => (
                                  <option key={`${prodCatalogo.id}-${v.unidad}`} value={`${prodCatalogo.id}-${v.unidad}`}>
                                    {v.unidad} (${v.precio})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded">
                                {item.unidad}
                              </p>
                            )}
                          </div>
                          <span className="font-black text-slate-800 text-lg pt-1">
                            ${formatMoney(subtotal)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                          <button 
                            onClick={() => {playAudio('click'); setCarrito(carrito.filter((_,i)=>i!==idx))}} 
                            className="text-rose-400 text-xs font-bold px-2 py-1.5 rounded-lg hover:bg-rose-50 flex items-center gap-1"
                          >
                            <Trash2 size={14}/> Quitar
                          </button>
                          
                          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                            <button 
                              onClick={() => { playAudio('click'); actualizarInputCantidad(idx, Math.max(0, cantSegura - 1)); procesarCantidadBlur(idx); }} 
                              className="p-1.5 hover:bg-white text-slate-600 rounded-md shadow-sm active:scale-95"
                            >
                              <Minus size={14}/>
                            </button>
                            <input 
                              type="text" 
                              inputMode="decimal"
                              value={item.cantidad} 
                              onChange={(e) => actualizarInputCantidad(idx, e.target.value)} 
                              onBlur={() => procesarCantidadBlur(idx)} 
                              className="font-black w-14 text-center text-sm bg-transparent outline-none text-slate-800"
                            />
                            <button 
                              onClick={() => { playAudio('click'); actualizarInputCantidad(idx, cantSegura + 1); procesarCantidadBlur(idx); }} 
                              className="p-1.5 hover:bg-white text-slate-600 rounded-md shadow-sm active:scale-95"
                            >
                              <Plus size={14}/>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.02)] z-10">
                <div className="flex justify-between items-center mb-4 bg-slate-100 p-4 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-black uppercase tracking-widest text-sm">Total a Cobrar:</span>
                  <span className="text-5xl font-black text-emerald-600">${formatMoney(totalCarrito)}</span>
                </div>
                
                {/* MODAL COBRO EFECTIVO */}
                {modalEfectivo && (
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 relative">
                    <button 
                      onClick={() => setModalEfectivo(false)} 
                      className="absolute top-2 right-2 text-slate-400 hover:text-slate-700"
                    >
                      <X size={18}/>
                    </button>
                    <p className="text-sm font-black text-emerald-800 mb-3 flex items-center gap-2">
                      <Banknote size={16}/> Cobro Efectivo
                    </p>
                    <input 
                      type="text" 
                      inputMode="decimal" 
                      placeholder="¿Con cuánto paga?" 
                      value={pagaCon} 
                      onChange={(e) => setPagaCon(e.target.value.replace(',','.'))} 
                      className="w-full p-3 rounded-xl border-2 border-emerald-200 font-black text-xl outline-none focus:border-emerald-500 mb-2 transition-colors" 
                      autoFocus
                    />
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[1000, 2000, 5000, 10000].map(b => (
                        <button 
                          key={b} 
                          onClick={() => {playAudio('click'); setPagaCon(b.toString())}} 
                          className="bg-white border border-emerald-200 text-emerald-700 text-xs font-black py-2 rounded-lg hover:bg-emerald-100 hover:scale-105 transition-all active:scale-95"
                        >
                          ${b}
                        </button>
                      ))}
                    </div>
                    <div className={`p-4 rounded-xl mb-3 flex justify-between items-center transition-colors ${vueltoEfectivo >= 0 ? 'bg-emerald-600 text-white shadow-inner' : 'bg-rose-100 text-rose-800'}`}>
                      <span className="font-bold text-xs uppercase tracking-widest">Vuelto a entregar:</span>
                      <span className="font-black text-2xl">{vueltoEfectivo >= 0 ? `$${formatMoney(vueltoEfectivo)}` : 'Falta dinero'}</span>
                    </div>
                    <button 
                      onClick={() => { if(vueltoEfectivo < 0){ playAudio('error'); return toast.error("Monto insuficiente"); } cobrar('Efectivo'); }} 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl flex justify-center items-center gap-2 shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95 uppercase tracking-wider"
                    >
                      <Check size={20}/> Confirmar
                    </button>
                  </div>
                )}
                
                {/* MODAL COBRO MIXTO */}
                {modalMixto && (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 relative">
                    <button 
                      onClick={() => setModalMixto(false)} 
                      className="absolute top-2 right-2 text-slate-400 hover:text-slate-700"
                    >
                      <X size={18}/>
                    </button>
                    <p className="text-sm font-black text-blue-800 mb-3 flex items-center gap-2">
                      <SplitSquareHorizontal size={16}/> Pago Mixto
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Abona en Efectivo</label>
                        <input 
                          type="text" 
                          inputMode="decimal" 
                          placeholder="$0" 
                          value={montoEfMixto} 
                          onChange={(e) => setMontoEfMixto(e.target.value.replace(',','.'))} 
                          className="w-full p-2.5 rounded-lg border-2 border-blue-200 font-bold text-lg outline-none focus:border-blue-500" 
                          autoFocus
                        />
                      </div>
                      <div className="flex justify-between items-center bg-indigo-100 p-2.5 rounded-lg">
                        <span className="text-xs font-bold text-indigo-800 uppercase">Resto Transf.</span>
                        <span className="font-black text-indigo-700 text-lg">
                          ${formatMoney(Math.max(0, totalCarrito - (parseFloat(montoEfMixto)||0)))}
                        </span>
                      </div>
                      <button 
                        onClick={() => { const ef = parseFloat(montoEfMixto)||0; if(ef<0 || ef>totalCarrito) { playAudio('error'); return toast.error("Monto inválido"); } cobrar('Mixto', ef, totalCarrito - ef); }} 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 shadow-md"
                      >
                        <Check size={20}/> Confirmar Cobro
                      </button>
                    </div>
                  </div>
                )}
                
                {/* BOTONERA PRINCIPAL DE COBROS */}
                {!modalEfectivo && !modalMixto && (
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => { if(carrito.length > 0) setModalEfectivo(true); else {playAudio('error'); toast.error("Carrito vacío");} }} 
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-xl flex justify-center items-center gap-2 shadow-sm transition-transform active:scale-95 text-sm uppercase tracking-wide"
                    >
                      <Banknote size={18}/> Efectivo
                    </button>
                    <button 
                      onClick={() => cobrar('Transferencia')} 
                      className="bg-indigo-500 hover:bg-indigo-600 text-white font-black py-4 rounded-xl flex justify-center items-center gap-2 shadow-sm transition-transform active:scale-95 text-sm uppercase tracking-wide"
                    >
                      <CreditCard size={18}/> Transf.
                    </button>
                    <button 
                      onClick={() => { if(carrito.length > 0) setModalMixto(true); else {playAudio('error'); toast.error("Carrito vacío");} }} 
                      className="col-span-2 bg-slate-800 hover:bg-slate-900 text-white font-black py-4 rounded-xl flex justify-center items-center gap-2 shadow-sm transition-transform active:scale-95 text-sm uppercase tracking-wide"
                    >
                      <SplitSquareHorizontal size={18}/> Dividir Pago (Mixto)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            VISTA 2: CATÁLOGO (CRUD COMPLETO CON EDICIÓN)
            ========================================================= */}
        {vistaActiva === 'catalogo' && (
           <div className="max-w-5xl mx-auto grid lg:grid-cols-5 gap-6 animate-fade-in print:hidden">
             
             {/* Formulario de Creación / Edición */}
             <div className="lg:col-span-2 bg-blue-50 p-6 rounded-2xl border border-blue-100 h-fit sticky top-24 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-blue-900 flex items-center gap-2 text-lg">
                  {productoEditando ? <Pencil size={20}/> : <Plus size={20}/>} 
                  {productoEditando ? 'Editando Producto' : 'Crear Producto'}
                </h3>
                {productoEditando && (
                  <button 
                    onClick={cancelarEdicion} 
                    className="text-xs font-bold bg-white text-rose-500 px-3 py-1 rounded-md border border-rose-200 hover:bg-rose-50"
                  >
                    Cancelar
                  </button>
                )}
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-blue-800 uppercase ml-1">Modalidad de Venta</label>
                  <select 
                    value={catForm.tipo_venta} 
                    onChange={e => setCatForm({...catForm, tipo_venta: e.target.value})} 
                    className="w-full border-2 border-white bg-white focus:bg-white rounded-xl p-3 outline-none focus:border-blue-400 font-bold text-sm"
                  >
                    <option value="simple">Simple (Precio Único)</option>
                    <option value="peso">Por Peso (Balanza Dinámica)</option>
                    <option value="variantes">Múltiples Variantes (Panadería)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-blue-800 uppercase ml-1">Nombre (Ej: Jamón / Pan)</label>
                  <input 
                    type="text" 
                    placeholder="Escriba aquí..." 
                    value={catForm.nombre} 
                    onChange={e => setCatForm({...catForm, nombre: e.target.value})} 
                    className="w-full border-2 border-white bg-white focus:bg-white rounded-xl p-3 outline-none focus:border-blue-400 font-bold" 
                  />
                </div>
                
                {catForm.tipo_venta !== 'variantes' && (
                  <div>
                    <label className="text-xs font-bold text-blue-800 uppercase ml-1">
                      {catForm.tipo_venta === 'peso' ? 'Precio por Kilo ($)' : 'Precio Final ($)'}
                    </label>
                    <input 
                      type="text" 
                      inputMode="decimal" 
                      placeholder="0.00" 
                      value={catForm.precio_base} 
                      onChange={e => setCatForm({...catForm, precio_base: e.target.value.replace(',','.')})} 
                      className="w-full border-2 border-white bg-white focus:bg-white rounded-xl p-3 outline-none focus:border-blue-400 font-black text-blue-900" 
                    />
                  </div>
                )}

                {catForm.tipo_venta === 'variantes' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-blue-800 uppercase ml-1">Variantes y Precios</label>
                    {catVariantes.map((v, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                        <select 
                          value={v.unidad} 
                          onChange={e => updateVariante(idx, 'unidad', e.target.value)} 
                          className="flex-1 bg-transparent border-r border-slate-200 p-2 font-bold outline-none text-sm"
                        >
                          {unidadesComunes.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <span className="text-slate-400 font-bold pl-2">$</span>
                        <input 
                          type="text" 
                          inputMode="decimal" 
                          placeholder="Precio" 
                          value={v.precio} 
                          onChange={e => updateVariante(idx, 'precio', e.target.value)} 
                          className="w-1/3 p-2 font-black outline-none" 
                        />
                        {catVariantes.length > 1 && (
                          <button 
                            onClick={() => removeVariante(idx)} 
                            className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 size={18}/>
                          </button>
                        )}
                      </div>
                    ))}
                    <button 
                      onClick={addVariante} 
                      className="w-full flex items-center justify-center gap-1 bg-white border-2 border-blue-200 text-blue-700 py-2.5 rounded-xl font-bold hover:bg-blue-100 transition-colors mt-2"
                    >
                      <Plus size={18}/> Sumar variante
                    </button>
                  </div>
                )}
              </div>
              <button 
                onClick={guardarProducto} 
                className={`w-full text-white py-3 rounded-xl font-black tracking-wider shadow-md transition-colors uppercase ${productoEditando ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {productoEditando ? 'Actualizar Producto' : 'Guardar en Catálogo'}
              </button>
            </div>

            {/* Listado del Catálogo */}
            <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b pb-4">
                <h3 className="font-bold text-slate-800 text-lg">
                  Catálogo Activo 
                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs ml-2">{catalogo.length} ítems</span>
                </h3>
                <div className="relative w-full sm:w-64">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search size={18}/></span>
                  <input 
                    type="text" 
                    placeholder="Buscar en catálogo..." 
                    value={busquedaCatalogo} 
                    onChange={(e) => setBusquedaCatalogo(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 font-medium outline-none focus:border-blue-500" 
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {catalogoFiltradoABM.map(prod => (
                  <div 
                    key={prod.id} 
                    className={`flex justify-between items-start p-4 rounded-xl border shadow-sm transition-colors ${productoEditando === prod.id ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}`}
                  >
                    <div className="w-full">
                      <div className="flex items-center gap-2 mb-3">
                        <p className="font-black text-slate-800">{prod.nombre}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${prod.tipo_venta === 'peso' ? 'bg-amber-100 text-amber-700' : prod.tipo_venta === 'variantes' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                          {prod.tipo_venta}
                        </span>
                      </div>
                      
                      {prod.tipo_venta === 'simple' && (
                        <p className="font-black text-slate-800 bg-white p-2 rounded-lg border border-slate-100 inline-block">
                          ${formatMoney(prod.precio_base)}
                        </p>
                      )}
                      {prod.tipo_venta === 'peso' && (
                        <p className="font-black text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 inline-flex items-center gap-1">
                          <Scale size={14}/> ${formatMoney(prod.precio_base)} / Kg
                        </p>
                      )}
                      {prod.tipo_venta === 'variantes' && (
                        <div className="space-y-1.5">
                          {prod.variantes.map((v, i) => (
                            <div key={i} className="flex justify-between items-center bg-white px-3 py-1.5 rounded-lg text-sm border border-slate-100">
                              <span className="font-medium text-slate-600 uppercase tracking-wider text-[10px]">{v.unidad}</span>
                              <span className="font-black text-slate-800">${formatMoney(v.precio)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-3">
                      <button 
                        onClick={() => cargarParaEditar(prod)} 
                        className="p-2 text-blue-500 hover:text-white hover:bg-blue-500 rounded-lg transition-colors shadow-sm bg-white" 
                        title="Editar"
                      >
                        <Pencil size={18}/>
                      </button>
                      <button 
                        onClick={() => borrarProducto(prod.id)} 
                        className="p-2 text-rose-400 hover:text-white hover:bg-rose-500 rounded-lg transition-colors shadow-sm bg-white" 
                        title="Eliminar"
                      >
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  </div>
                ))}
                {catalogoFiltradoABM.length === 0 && (
                  <p className="text-slate-400 text-sm italic col-span-2 text-center py-8">
                    No se encontraron productos.
                  </p>
                )}
              </div>
            </div>
           </div>
        )}

        {/* =========================================================
            VISTA 3: FINANZAS Y AUDITORÍA
            ========================================================= */}
        {vistaActiva === 'finanzas' && finanzas && (
          <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
            
            {/* Navegación Interna */}
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 print:hidden flex justify-center gap-2">
              <button 
                onClick={() => setSubVistaFinanzas('resumen')} 
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${subVistaFinanzas === 'resumen' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <BarChart size={18}/> Dashboard de Cierre
              </button>
              <button 
                onClick={() => setSubVistaFinanzas('auditoria')} 
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${subVistaFinanzas === 'auditoria' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <ClipboardList size={18}/> Auditoría de Tickets
              </button>
            </div>

            {/* Dashboard Resumen */}
            {subVistaFinanzas === 'resumen' && (
              <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
                <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-xl border border-slate-200 print:shadow-none print:border-none print:p-0">
                  <div className="flex justify-between items-center mb-6 print:hidden border-b pb-4">
                    <div className="flex items-center gap-4">
                      <h3 className="font-black text-slate-800 text-xl uppercase tracking-wide">Reporte de Caja</h3>
                      <select 
                        value={filtroTiempo} 
                        onChange={(e) => cargarFinanzas(e.target.value)} 
                        className="bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg px-3 py-1.5 outline-none focus:border-blue-500"
                      >
                        <option value="dia">Día Actual</option>
                        <option value="semana">Esta Semana</option>
                        <option value="mes">Este Mes</option>
                      </select>
                    </div>
                    <button 
                      onClick={() => window.print()} 
                      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors"
                    >
                      <Printer size={16} /> Imprimir
                    </button>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                      <p className="text-emerald-800 font-bold mb-1 uppercase tracking-wider text-xs">Total Ingresos</p>
                      <p className="text-4xl font-black text-emerald-600">${formatMoney(finanzas.ingresos.total)}</p>
                      <div className="flex gap-2 mt-3 pt-3 border-t border-emerald-200/50">
                        <div className="flex-1">
                          <p className="text-[10px] text-emerald-600 font-bold uppercase">Efectivo</p>
                          <p className="font-black text-emerald-700">${formatMoney(finanzas.ingresos.efectivo)}</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-emerald-600 font-bold uppercase">Transf.</p>
                          <p className="font-black text-emerald-700">${formatMoney(finanzas.ingresos.transferencia)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100">
                      <p className="text-rose-800 font-bold mb-1 uppercase tracking-wider text-xs">Total Egresos</p>
                      <p className="text-4xl font-black text-rose-600">-${formatMoney(finanzas.egresos_totales)}</p>
                      <div className="mt-3 pt-3 border-t border-rose-200/50">
                        <p className="text-[10px] text-rose-600 font-bold uppercase">{finanzas.lista_egresos.length} Gastos de caja</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 rounded-2xl border-2 text-center bg-slate-50 border-slate-200 mb-8">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Caja Teórica (Debe haber)</p>
                    <h3 className="text-5xl font-black text-slate-800">${formatMoney(finanzas.balance_neto)}</h3>
                  </div>
                </div>

                <div className="lg:col-span-1 space-y-6 print:hidden">
                  <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-xl">
                    <h3 className="font-black mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
                      <Wallet size={16}/> Cierre de Caja Real
                    </h3>
                    <div className="relative mb-4">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                      <input 
                        type="text" 
                        inputMode="decimal" 
                        placeholder="0.00" 
                        value={dineroEnCaja} 
                        onChange={(e) => setDineroEnCaja(e.target.value.replace(',','.'))} 
                        className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl py-3 pl-8 pr-4 text-2xl font-black text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    {dineroEnCaja !== '' && (
                      <div className={`p-4 rounded-xl border-2 animate-fade-in ${parseFloat(dineroEnCaja) === (finanzas.ingresos.efectivo - finanzas.egresos_totales) ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-rose-500/20 border-rose-500/50 text-rose-400'}`}>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-80">Diferencia</p>
                        <h4 className="text-2xl font-black">${formatMoney(parseFloat(dineroEnCaja) - (finanzas.ingresos.efectivo - finanzas.egresos_totales))}</h4>
                        <p className="text-xs mt-1 font-medium">{parseFloat(dineroEnCaja) === (finanzas.ingresos.efectivo - finanzas.egresos_totales) ? '¡Caja perfecta!' : parseFloat(dineroEnCaja) > (finanzas.ingresos.efectivo - finanzas.egresos_totales) ? 'Sobrante' : 'Faltante'}</p>
                      </div>
                    )}
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase">Extraer dinero / Gasto</h3>
                    <input 
                      type="text" 
                      placeholder="Motivo" 
                      value={formEgreso.descripcion} 
                      onChange={e=>setFormEgreso({...formEgreso, descripcion: e.target.value})} 
                      className="w-full border-2 border-slate-100 rounded-lg p-2.5 mb-2 text-sm outline-none focus:border-rose-400" 
                    />
                    <input 
                      type="text" 
                      inputMode="decimal" 
                      placeholder="Monto ($)" 
                      value={formEgreso.monto} 
                      onChange={e=>setFormEgreso({...formEgreso, monto: e.target.value.replace(',','.')})} 
                      className="w-full border-2 border-slate-100 rounded-lg p-2.5 mb-3 text-sm font-bold outline-none focus:border-rose-400" 
                    />
                    <button 
                      onClick={guardarEgreso} 
                      className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-2.5 rounded-lg transition-colors text-sm"
                    >
                      Registrar Salida
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Auditoría Completa de Tickets */}
            {subVistaFinanzas === 'auditoria' && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-fade-in print:hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h3 className="font-black text-slate-800 text-xl flex items-center gap-2">
                    <ClipboardList/> Auditoría de Todos los Tickets
                  </h3>
                  <button 
                    onClick={descargarBackupCSV} 
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95"
                  >
                    <FileSpreadsheet size={18}/> Descargar Excel
                  </button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search size={18}/></span>
                    <input 
                      type="text" 
                      placeholder="Buscar por producto o monto..." 
                      value={filtroHistorial} 
                      onChange={(e) => setFiltroHistorial(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 font-medium outline-none focus:border-blue-500" 
                    />
                  </div>
                  <select 
                    value={filtroMetodo} 
                    onChange={(e) => setFiltroMetodo(e.target.value)} 
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium outline-none focus:border-blue-500"
                  >
                    <option value="Todos">Todos los métodos de pago</option>
                    <option value="Efectivo">Solo Efectivo</option>
                    <option value="Transferencia">Solo Transferencia</option>
                    <option value="Mixto">Pagos Mixtos</option>
                  </select>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="p-4 font-bold">Ticket #</th>
                        <th className="p-4 font-bold">Fecha / Hora</th>
                        <th className="p-4 font-bold">Detalle</th>
                        <th className="p-4 font-bold">Método</th>
                        <th className="p-4 font-bold">Total</th>
                        <th className="p-4 font-bold text-center">Auditar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {historialFiltrado.map(v => {
                        const esMixto = v.efectivo > 0 && v.transferencia > 0;
                        const metodoTxt = esMixto ? 'Mixto' : (v.efectivo > 0 ? 'Efectivo' : 'Transf.');
                        return (
                          <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-black text-slate-500">{v.id.toString().padStart(4, '0')}</td>
                            <td className="p-4 text-slate-600 font-medium">
                              {new Date(v.fecha).toLocaleDateString()} | {new Date(v.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                            </td>
                            <td className="p-4">
                              <p className="max-w-[300px] truncate text-slate-700" title={v.detalle_ticket}>{v.detalle_ticket}</p>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${esMixto ? 'bg-blue-100 text-blue-700' : (v.efectivo > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700')}`}>
                                {metodoTxt}
                              </span>
                              {/* DESGLOSE MIXTO */}
                              {esMixto && (
                                <div className="text-[10px] text-slate-500 font-bold mt-1 tracking-wide">
                                  Ef: ${formatMoney(v.efectivo)} | Tr: ${formatMoney(v.transferencia)}
                                </div>
                              )}
                            </td>
                            <td className="p-4 font-black text-slate-800">${formatMoney(v.total)}</td>
                            <td className="p-4 text-center">
                              <button 
                                onClick={() => anularVenta(v.id)} 
                                className="text-rose-400 hover:text-white hover:bg-rose-500 p-2 rounded-lg transition-colors"
                              >
                                <Trash2 size={16}/>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {historialFiltrado.length === 0 && <div className="text-center text-slate-400 py-10 font-medium">No se encontraron ventas.</div>}
                </div>
              </div>
            )}
            
            {/* VISTA IMPRESIÓN CIERRE Z (SÓLO VISIBLE AL IMPRIMIR) */}
            <div className="hidden print:block w-full max-w-2xl mx-auto font-mono text-black p-8">
               <h1 className="text-3xl font-black text-center mb-2 border-b-4 border-black pb-4 uppercase">Reporte Cierre Z - Caja</h1>
               <p className="text-center font-bold text-lg mb-8 uppercase border-b-2 border-black pb-2">
                 Fecha: {new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}
               </p>
               
               <div className="grid grid-cols-2 gap-8 mb-8 border-b-2 border-black pb-8">
                 <div>
                   <h2 className="text-xl font-bold uppercase mb-4 border-b border-black inline-block">Resumen Ingresos</h2>
                   <p className="text-lg flex justify-between mb-1"><span>Efectivo:</span> <strong>${formatMoney(finanzas.ingresos.efectivo)}</strong></p>
                   <p className="text-lg flex justify-between mb-1"><span>Transferencia:</span> <strong>${formatMoney(finanzas.ingresos.transferencia)}</strong></p>
                   <p className="text-xl font-black flex justify-between mt-4 border-t-2 border-dashed border-black pt-2"><span>TOTAL VENTAS:</span> <span>${formatMoney(finanzas.ingresos.total)}</span></p>
                 </div>
                 <div>
                   <h2 className="text-xl font-bold uppercase mb-4 border-b border-black inline-block">Resumen Egresos</h2>
                   <p className="text-lg flex justify-between mb-1"><span>Gastos Caja:</span> <strong>${formatMoney(finanzas.egresos_totales)}</strong></p>
                   <p className="text-xl font-black flex justify-between mt-4 border-t-2 border-dashed border-black pt-2"><span>CAJA TEÓRICA:</span> <span>${formatMoney(finanzas.balance_neto)}</span></p>
                 </div>
               </div>

               {finanzas.lista_egresos.length > 0 && (
                 <div className="mb-12">
                   <h2 className="text-xl font-bold uppercase mb-2 border-b border-black">Detalle de Gastos</h2>
                   <table className="w-full text-left text-lg">
                     <tbody>
                       {finanzas.lista_egresos.map(e => (
                         <tr key={e.id} className="border-b border-gray-300">
                           <td className="py-2">- {e.desc}</td>
                           <td className="py-2 text-right font-bold">${formatMoney(e.monto)}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}

               <div className="mt-20 pt-10 grid grid-cols-2 text-center text-sm font-bold uppercase border-t-2 border-black">
                 <p>__________________________<br/>Firma Cajero</p>
                 <p>__________________________<br/>Firma Encargado</p>
               </div>
            </div>
          </div>
        )}

        {/* =========================================================
            VISTA 4: PRODUCCIÓN (ASISTENTE DE COSTEO)
            ========================================================= */}
        {vistaActiva === 'produccion' && (
          <div className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-6 animate-fade-in print:hidden">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl shadow-lg text-white">
                <h3 className="font-black uppercase tracking-wider text-sm mb-4 flex items-center gap-2 text-indigo-200">
                  <TrendingUp size={16}/> Inteligencia Comercial
                </h3>
                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  Basado en tus ventas reales de este mes, deberías priorizar la producción de:
                </p>
                <div className="space-y-3">
                  {top3Produccion.map((item, idx) => {
                    let unidadTxt = item.unidad;
                    if (unidadTxt === 'Unidad') unidadTxt = item.cantidad === 1 ? 'unidad' : 'unidades';
                    else if (unidadTxt === 'Docena') unidadTxt = item.cantidad === 1 ? 'docena' : 'docenas';
                    else if (unidadTxt === 'Kg' || unidadTxt === 'kg') unidadTxt = 'kg';

                    return (
                      <div key={idx} className="bg-white/10 rounded-xl p-3 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm leading-tight text-white">{item.nombre}</p>
                          <p className="text-[10px] text-indigo-300 font-bold uppercase mt-0.5">Top #{idx+1} del mes</p>
                        </div>
                        <span className="bg-indigo-500 text-white font-black text-xs px-2.5 py-1 rounded-lg">
                          {item.cantidad} {unidadTxt}
                        </span>
                      </div>
                    );
                  })}
                  {top3Produccion.length === 0 && <p className="text-sm text-slate-400 italic">No hay ventas registradas este mes.</p>}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2"><ChefHat/> Asistente de Precios y Costeo</h2>
              
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 mb-8">
                <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2 uppercase text-sm tracking-wider"><Target size={18}/> Calculadora Automática</h3>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-amber-800 uppercase ml-1">¿Qué estás elaborando?</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Masa para Pizzas" 
                      value={prodForm.producto} 
                      onChange={e => setProdForm({...prodForm, producto: e.target.value})} 
                      className="w-full border-2 border-white bg-white p-3 rounded-xl outline-none focus:border-amber-400 font-bold" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-amber-800 uppercase ml-1">Inversión Total ($)</label>
                    <input 
                      type="text" 
                      inputMode="decimal" 
                      placeholder="Ej: 5000" 
                      value={prodForm.costo} 
                      onChange={e => setProdForm({...prodForm, costo: e.target.value.replace(',','.')})} 
                      className="w-full border-2 border-white bg-white p-3 rounded-xl outline-none focus:border-amber-400 font-black text-amber-900" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-amber-800 uppercase ml-1">¿Cuántas unidades salieron?</label>
                    <input 
                      type="text" 
                      inputMode="decimal" 
                      placeholder="Ej: 10" 
                      value={prodForm.cantidad} 
                      onChange={e => setProdForm({...prodForm, cantidad: e.target.value.replace(',','.')})} 
                      className="w-full border-2 border-white bg-white p-3 rounded-xl outline-none focus:border-amber-400 font-black text-amber-900" 
                    />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-amber-200 mb-4 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-slate-600 text-sm">Costo por unidad fabricada:</span>
                    <span className="font-black text-lg text-rose-600">${formatMoney(costoUnitario)}</span>
                  </div>
                  <div className="flex items-center gap-4 border-t border-slate-100 pt-4">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-amber-800 uppercase">Margen Deseado (%)</label>
                      <div className="flex items-center mt-1">
                        <input 
                          type="range" 
                          min="10" max="200" step="5" 
                          value={prodForm.margenDeseado} 
                          onChange={e => setProdForm({...prodForm, margenDeseado: e.target.value})} 
                          className="w-full accent-amber-500" 
                        />
                        <span className="ml-3 font-black text-amber-700 w-12">{prodForm.margenDeseado}%</span>
                      </div>
                    </div>
                    <div className="bg-amber-100 p-3 rounded-lg text-right min-w-[120px]">
                      <p className="text-[10px] font-bold text-amber-800 uppercase">Precio Sugerido</p>
                      <p className="font-black text-xl text-emerald-700">${formatMoney(precioSugerido)}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-bold text-amber-800 uppercase ml-1">Precio de Venta Definitivo ($)</label>
                  <p className="text-[10px] text-amber-700 ml-1 mb-1 leading-tight">Ingresá el precio al que realmente lo vas a vender en el local para guardarlo en el historial.</p>
                  <input 
                    type="text" 
                    inputMode="decimal" 
                    placeholder="Ej: 800" 
                    value={prodForm.precio} 
                    onChange={e => setProdForm({...prodForm, precio: e.target.value.replace(',','.')})} 
                    className="w-full border-2 border-emerald-200 bg-emerald-50 focus:bg-white p-3 rounded-xl outline-none focus:border-emerald-400 font-black text-lg text-emerald-900" 
                  />
                </div>

                <button 
                  onClick={guardarProduccion} 
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-3 rounded-xl shadow-md uppercase tracking-wider text-sm transition-transform active:scale-95"
                >
                  Guardar Costeo en Historial
                </button>
              </div>

              <h3 className="font-bold text-slate-600 mb-4 border-b pb-2">Historial de Elaboración</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {historialProd.map((r) => {
                  const costoInvertido = r.costo_produccion || 0;
                  const unidades = r.cantidad_producida || 1;
                  const precioUnidad = r.precio_venta_estimado || 0;
                  const ingresoPot = precioUnidad * unidades;
                  const ganancia = ingresoPot - costoInvertido;
                  const porcentaje = costoInvertido > 0 ? ((ganancia / costoInvertido) * 100).toFixed(0) : 100;

                  return (
                    <div key={r.id} className="bg-slate-50 border p-4 rounded-2xl relative overflow-hidden group hover:border-slate-200 transition-colors">
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${ganancia > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      <span className="font-black text-slate-800 ml-2 text-lg">{r.producto}</span>
                      <span className="text-xs font-bold text-slate-400 ml-1">({unidades} uni.)</span>
                      <div className="flex justify-between text-xs text-slate-600 font-medium bg-white p-2 rounded-lg ml-2 mt-2">
                        <span>Inv: <strong className="text-rose-600">${formatMoney(costoInvertido)}</strong></span>
                        <span>Total: <strong className="text-emerald-600">${formatMoney(ingresoPot)}</strong></span>
                      </div>
                      <div className={`mt-2 font-black text-sm px-2.5 py-1 rounded-lg ml-2 inline-block self-start ${ganancia > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        Ganancia Pura: ${formatMoney(ganancia)} <span className="opacity-70">({porcentaje}%)</span>
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