import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Download } from 'lucide-react'; // Agregamos íconos para el PDF
import { useState, useEffect } from 'react';
import { 
  Store, Tag, Wallet, Banknote, CreditCard, SplitSquareHorizontal, 
  Trash2, Printer, Plus, Minus, X, Check, Search, TrendingUp, AlertTriangle, 
  Info, Clock, Pencil, FileSpreadsheet, Target, ClipboardList,
  Wrench, Bike, PackageSearch, Image as ImageIcon, ExternalLink, UploadCloud,
  Moon, Sun, Smartphone, Lock, KeyRound, LogOut, Mail
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import PanelPOS from './components/PanelPOS';
import PanelCatalogo from './components/PanelCatalogo';
import PanelFinanzas from './components/PanelFinanzas';
import PanelProduccion from './components/PanelProduccion';
import PanelPresupuestos from './components/PanelPresupuestos';
// Para desarrollo local descomentar la siguiente línea y comentar la de Vercel:
// const API_URL = "http://localhost:8000/api";
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
  const [paginaActual, setPaginaActual] = useState(1);
  
  // Estados para Presupuestos
  const [carritoPresupuesto, setCarritoPresupuesto] = useState([]);
  const [clientePresupuesto, setClientePresupuesto] = useState('');
  const [notasPresupuesto, setNotasPresupuesto] = useState('');
  const [busquedaPresupuesto, setBusquedaPresupuesto] = useState('');
  
  // --- SEGURIDAD Y LOGIN ---
  const [isLogueado, setIsLogueado] = useState(localStorage.getItem('auth_motogest') === 'true');
  const [claveInput, setClaveInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const CLAVE_SECRETA = "moto2026"; // Acá podés escribir la contraseña que quieras

  // --- FÁBRICA DE ETIQUETAS ---
  const renderEtiquetas = (texto, colorFondo, colorTexto) => {
    if (!texto) return null;
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
  const manejarLogin = async (e) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', emailInput);
      formData.append('password', claveInput);

      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

      if (!res.ok) throw new Error("Credenciales inválidas");

      const data = await res.json();
      localStorage.setItem('motogest_token', data.access_token); 
      setIsLogueado(true);
      toast.success("¡Bienvenido a MotoGest!");
      cargarDatos();
    } catch (error) {
      toast.error("Email o contraseña incorrectos");
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('auth_motogest');
    setIsLogueado(false);
  };

// --- GENERADORES DE PDF (BLINDADOS) ---
  const generarPDF = (titulo, numeroDoc, cliente, itemsRaw, total, notas = "") => {
    try {
      const doc = new jsPDF();

      // Cabecera del negocio
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229);
      doc.text("MOTOGEST", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Repuestos y Accesorios para Motos", 14, 26);

      // Info del Documento
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text(titulo, 130, 20);
      doc.setFontSize(10);
      doc.text(`Nº: ${String(numeroDoc || '001').padStart(6, '0')}`, 130, 26);
      doc.text(`Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, 130, 32);

      // Datos del Cliente
      doc.setFontSize(11);
      doc.text(`Cliente: ${cliente || 'Consumidor Final'}`, 14, 40);
      if (notas) doc.text(`Observaciones: ${notas}`, 14, 46);

      // Procesar items (compatible con Array de objetos o Texto Plano)
      let tableRows = [];
      if (Array.isArray(itemsRaw)) {
        tableRows = itemsRaw.map(item => [
          item.nombre || item.producto || "Repuesto",
          item.cantidad || 1,
          `$${formatMoney(item.precio_venta || item.precioBase || item.precio || 0)}`,
          `$${formatMoney((item.precio_venta || item.precioBase || item.precio || 0) * (item.cantidad || 1))}`
        ]);
      } else if (typeof itemsRaw === 'string') {
        tableRows = itemsRaw.split(' | ').map(str => {
          const match = str.match(/([\d.]+)x (.*?) \((.*?)\)/);
          if (match) {
            return [match[2], match[1], "-", "-"];
          }
          return [str, "1", "-", "-"];
        });
      }

      const tableColumn = ["Producto / Detalle", "Cant.", "Precio Unit.", "Subtotal"];

      autoTable(doc, {
        startY: notas ? 52 : 46,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
      });

      // Total
      const finalY = doc.lastAutoTable.finalY || 60;
      doc.setFontSize(14);
      doc.text(`TOTAL: $${formatMoney(total)}`, 140, finalY + 10);

      doc.save(`${titulo.replace(/\s+/g, '_')}_${numeroDoc || 'DOC'}.pdf`);
      toast.success("PDF descargado correctamente");
    } catch (err) {
      console.error(err);
      toast.error("Error al renderizar el documento PDF");
    }
  };

  const guardarYDescargarPresupuesto = async () => {
    if (carritoPresupuesto.length === 0) return toast.error("Agregá productos al presupuesto");
    const total = carritoPresupuesto.reduce((acc, item) => acc + (item.precio_venta * item.cantidad), 0);
    const numRandom = Math.floor(1000 + Math.random() * 9000);

    // 1. Descarga inmediata del PDF
    generarPDF("PRESUPUESTO", numRandom, clientePresupuesto, carritoPresupuesto, total, notasPresupuesto);

    // 2. Intento de persistencia en background sin bloquear
    try {
      await fetchAPI('presupuestos', 'POST', {
        cliente: clientePresupuesto || "Consumidor Final",
        total: total,
        detalle_ticket: JSON.stringify(carritoPresupuesto),
        observaciones: notasPresupuesto || ""
      });
    } catch (e) {
      console.warn("No se pudo persistir en base de datos, PDF generado localmente.");
    }

    setCarritoPresupuesto([]);
    setClientePresupuesto('');
    setNotasPresupuesto('');
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
    const token = localStorage.getItem('motogest_token');
    const headers = { 'Content-Type': 'application/json' };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const opts = { method, headers };
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
      setAlertasInteligentes(alertasNuevas);
      if (alertasNuevas.length > 0) {
        playAudio('notification');
        setTimeout(() => setAlertasInteligentes([]), 10000);
      }
    } catch (e) {
        //toast.error("Error al conectar con servidor");
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
      <Login 
        emailInput={emailInput}
        setEmailInput={setEmailInput}
        claveInput={claveInput}
        setClaveInput={setClaveInput}
        manejarLogin={manejarLogin}
      />
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
              { id: 'presupuestos', icon: FileText, label: 'Presupuestos' },
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
          <PanelPOS
            modoOscuro={modoOscuro} horaActual={horaActual} busqueda={busqueda}
            setBusqueda={setBusqueda} agregarLibre={agregarLibre}
            catalogoFiltradoPOS={catalogoFiltradoPOS} paginaActual={paginaActual}
            setPaginaActual={setPaginaActual} agregarAlCarrito={agregarAlCarrito}
            renderEtiquetas={renderEtiquetas} formatMoney={formatMoney}
            historialVentas={historialVentas} generarPDF={generarPDF}
            anularVenta={anularVenta} carrito={carrito} setCarrito={setCarrito}
            totalCarrito={totalCarrito} modalEfectivo={modalEfectivo}
            setModalEfectivo={setModalEfectivo} pagaCon={pagaCon}
            setPagaCon={setPagaCon} vueltoEfectivo={vueltoEfectivo} cobrar={cobrar}
            modalMixto={modalMixto} setModalMixto={setModalMixto}
            montoEfMixto={montoEfMixto} setMontoEfMixto={setMontoEfMixto}
            montoTrMixto={montoTrMixto} setMontoTrMixto={setMontoTrMixto}
            montoTjMixto={montoTjMixto} setMontoTjMixto={setMontoTjMixto}
            playAudio={playAudio} actualizarInputCantidad={actualizarInputCantidad}
            procesarCantidadBlur={procesarCantidadBlur} toast={toast}
          />
        )}

        {vistaActiva === 'catalogo' && (
          <PanelCatalogo
            modoOscuro={modoOscuro} catForm={catForm} setCatForm={setCatForm}
            subiendoFoto={subiendoFoto} productoEditando={productoEditando}
            abrirBuscadorGoogle={abrirBuscadorGoogle}
            manejarPegadoImagen={manejarPegadoImagen}
            manejarSeleccionArchivo={manejarSeleccionArchivo}
            cancelarEdicion={cancelarEdicion} guardarProducto={guardarProducto}
            catalogo={catalogo} busquedaCatalogo={busquedaCatalogo}
            setBusquedaCatalogo={setBusquedaCatalogo}
            catalogoFiltradoABM={catalogoFiltradoABM} paginaActual={paginaActual}
            setPaginaActual={setPaginaActual} renderEtiquetas={renderEtiquetas}
            formatMoney={formatMoney} cargarParaEditar={cargarParaEditar}
            borrarProducto={borrarProducto}
          />
        )}

        {vistaActiva === 'finanzas' && finanzas && (
          <PanelFinanzas
            modoOscuro={modoOscuro} subVistaFinanzas={subVistaFinanzas}
            setSubVistaFinanzas={setSubVistaFinanzas} filtroTiempo={filtroTiempo}
            cargarFinanzas={cargarFinanzas} finanzas={finanzas}
            formatMoney={formatMoney} totalHoy={totalHoy} totalSemana={totalSemana}
            totalMes={totalMes} formEgreso={formEgreso} setFormEgreso={setFormEgreso}
            guardarEgreso={guardarEgreso} descargarBackupCSV={descargarBackupCSV}
            filtroHistorial={filtroHistorial} setFiltroHistorial={setFiltroHistorial}
            filtroMetodo={filtroMetodo} setFiltroMetodo={setFiltroMetodo}
            historialFiltrado={historialFiltrado} generarPDF={generarPDF}
            anularVenta={anularVenta}
          />
        )}

        {vistaActiva === 'produccion' && (
          <PanelProduccion
            top3Produccion={top3Produccion} modoOscuro={modoOscuro}
            prodForm={prodForm} setProdForm={setProdForm}
            formatMoney={formatMoney} costoUnitario={costoUnitario}
            precioSugerido={precioSugerido} guardarProduccion={guardarProduccion}
            historialProd={historialProd}
          />
        )}

        {vistaActiva === 'presupuestos' && (
          <PanelPresupuestos
            modoOscuro={modoOscuro} busquedaPresupuesto={busquedaPresupuesto}
            setBusquedaPresupuesto={setBusquedaPresupuesto} catalogo={catalogo}
            carritoPresupuesto={carritoPresupuesto}
            setCarritoPresupuesto={setCarritoPresupuesto} formatMoney={formatMoney}
            clientePresupuesto={clientePresupuesto}
            setClientePresupuesto={setClientePresupuesto}
            notasPresupuesto={notasPresupuesto} setNotasPresupuesto={setNotasPresupuesto}
            guardarYDescargarPresupuesto={guardarYDescargarPresupuesto}
          />
        )}

      </main>
    </div>
  );
}