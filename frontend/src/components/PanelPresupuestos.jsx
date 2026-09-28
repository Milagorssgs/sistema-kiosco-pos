import { FileText, Search, Download } from 'lucide-react';

export default function PanelPresupuestos({
  modoOscuro, busquedaPresupuesto, setBusquedaPresupuesto, catalogo,
  carritoPresupuesto, setCarritoPresupuesto, formatMoney, clientePresupuesto,
  setClientePresupuesto, notasPresupuesto, setNotasPresupuesto,
  guardarYDescargarPresupuesto
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 animate-fade-in relative">
      
      {/* Catálogo para Presupuestar */}
      <div className="lg:col-span-2 flex flex-col h-[calc(100vh-100px)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-black flex items-center gap-2 ${modoOscuro ? 'text-white' : 'text-slate-800'}`}><FileText /> Armar Presupuesto</h2>
          <div className="relative w-full sm:w-80">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search size={18}/></span>
            <input type="text" placeholder="Buscar repuesto..." value={busquedaPresupuesto} onChange={(e) => setBusquedaPresupuesto(e.target.value)} className={`w-full rounded-xl py-2 pl-10 pr-4 text-sm font-medium outline-none border focus:border-indigo-500 ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 overflow-y-auto pr-2 pb-20">
          {catalogo.filter(p => p.nombre.toLowerCase().includes(busquedaPresupuesto.toLowerCase()) || p.codigo_sku?.toLowerCase().includes(busquedaPresupuesto.toLowerCase())).slice(0, 20).map(prod => (
            <div key={prod.id} onClick={() => {
              const existe = carritoPresupuesto.find(item => item.id === prod.id);
              if(existe) {
                setCarritoPresupuesto(carritoPresupuesto.map(item => item.id === prod.id ? {...item, cantidad: item.cantidad + 1} : item));
              } else {
                setCarritoPresupuesto([...carritoPresupuesto, {...prod, cantidad: 1}]);
              }
            }} className={`border rounded-xl p-2.5 sm:p-3 shadow-sm flex flex-col group cursor-pointer transition-all hover:border-indigo-500 ${modoOscuro ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <span className="text-[10px] font-mono text-slate-400 mb-1">{prod.codigo_sku || 'S/N'}</span>
              <h3 className={`font-bold text-xs sm:text-sm line-clamp-2 mb-2 ${modoOscuro ? 'text-white' : 'text-slate-800'}`}>{prod.nombre}</h3>
              <span className="font-black text-indigo-400 mt-auto">${formatMoney(prod.precio_venta)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Panel del Presupuesto */}
      <div className={`border rounded-2xl p-4 flex flex-col h-auto max-h-[60vh] lg:max-h-none lg:h-[calc(100vh-120px)] lg:sticky lg:top-24 overflow-hidden shadow-xl ${modoOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`p-3 sm:p-4 text-center border-b-2 border-indigo-600 ${modoOscuro ? 'bg-slate-900 text-white' : 'bg-indigo-50 text-indigo-900'}`}>
          <h2 className="font-black tracking-widest uppercase text-base">Cotización</h2>
        </div>
        <div className="p-3">
          <input type="text" placeholder="Nombre del Cliente..." value={clientePresupuesto} onChange={(e) => setClientePresupuesto(e.target.value)} className={`w-full border rounded-lg p-2.5 mb-2 text-sm outline-none focus:border-indigo-500 ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
          <input type="text" placeholder="Observaciones..." value={notasPresupuesto} onChange={(e) => setNotasPresupuesto(e.target.value)} className={`w-full border rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
        </div>

        <div className={`flex-1 overflow-y-auto p-3 space-y-2 ${modoOscuro ? 'bg-slate-950' : 'bg-slate-50'}`}>
          {carritoPresupuesto.length === 0 ? (
             <p className="text-center text-slate-500 mt-4 text-sm font-medium">Agregá productos para presupuestar</p>
          ) : (
            carritoPresupuesto.map((item, idx) => (
              <div key={item.id} className={`flex justify-between items-center p-2 rounded-xl border ${modoOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                 <div className="flex-1 min-w-0 pr-2">
                    <p className={`text-sm font-bold truncate ${modoOscuro ? 'text-white' : 'text-slate-800'}`}>{item.nombre}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => {
                         const arr = [...carritoPresupuesto];
                         if(arr[idx].cantidad > 1) arr[idx].cantidad -= 1;
                         else arr.splice(idx, 1);
                         setCarritoPresupuesto(arr);
                      }} className={`px-2 py-0.5 rounded ${modoOscuro ? 'bg-slate-700' : 'bg-slate-200'}`}>-</button>
                      <span className={`text-xs font-bold ${modoOscuro ? 'text-slate-300' : 'text-slate-600'}`}>{item.cantidad}</span>
                      <button onClick={() => {
                         const arr = [...carritoPresupuesto];
                         arr[idx].cantidad += 1;
                         setCarritoPresupuesto(arr);
                      }} className={`px-2 py-0.5 rounded ${modoOscuro ? 'bg-slate-700' : 'bg-slate-200'}`}>+</button>
                      <span className="text-xs text-slate-400 ml-2">${formatMoney(item.precio_venta)} c/u</span>
                    </div>
                 </div>
                 <div className="flex flex-col items-end gap-1">
                    <span className={`font-bold ${modoOscuro ? 'text-white' : 'text-slate-800'}`}>${formatMoney(item.precio_venta * item.cantidad)}</span>
                    <button onClick={() => setCarritoPresupuesto(carritoPresupuesto.filter((_, i) => i !== idx))} className="text-rose-500 text-xs font-bold hover:underline">Quitar</button>
                 </div>
              </div>
            ))
          )}
        </div>

        <div className={`p-4 border-t ${modoOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-end mb-4">
            <span className={`font-bold uppercase text-xs ${modoOscuro ? 'text-slate-400' : 'text-slate-500'}`}>Total a cotizar</span>
            <span className="text-2xl font-black text-indigo-500">${formatMoney(carritoPresupuesto.reduce((a, b) => a + (b.precio_venta * b.cantidad), 0))}</span>
          </div>
          <button onClick={guardarYDescargarPresupuesto} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl uppercase tracking-widest flex justify-center items-center gap-2 text-sm shadow-md transition-all">
            <Download size={18} /> Descargar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
