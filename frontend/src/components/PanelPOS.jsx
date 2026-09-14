import { 
  Store, Clock, Search, X, Image as ImageIcon, Download, Trash2, 
  Minus, Plus, Check, Banknote, Smartphone, CreditCard, SplitSquareHorizontal 
} from 'lucide-react';

export default function PanelPOS({
  modoOscuro, horaActual, busqueda, setBusqueda, agregarLibre,
  catalogoFiltradoPOS, paginaActual, setPaginaActual, agregarAlCarrito,
  renderEtiquetas, formatMoney, historialVentas, generarPDF, anularVenta,
  carrito, setCarrito, totalCarrito, modalEfectivo, setModalEfectivo,
  pagaCon, setPagaCon, vueltoEfectivo, cobrar, modalMixto, setModalMixto,
  montoEfMixto, setMontoEfMixto, montoTrMixto, setMontoTrMixto,
  montoTjMixto, setMontoTjMixto, playAudio, actualizarInputCantidad,
  procesarCantidadBlur, toast
}) {
  return (
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
            {catalogoFiltradoPOS.slice((paginaActual - 1) * 10, paginaActual * 10).map(prod => (
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
          {/* CONTROLES DE PAGINACIÓN CAJA */}
      {Math.ceil(catalogoFiltradoPOS.length / 10) > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6 mb-4 w-full print:hidden">
          <button
            onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
            disabled={paginaActual === 1}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${paginaActual === 1 ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
          >
            Anterior
          </button>

          <span className="text-xs font-bold text-slate-400">
            Página {paginaActual} de {Math.ceil(catalogoFiltradoPOS.length / 10)}
          </span>

          <button
            onClick={() => setPaginaActual(prev => Math.min(prev + 1, Math.ceil(catalogoFiltradoPOS.length / 10)))}
            disabled={paginaActual === Math.ceil(catalogoFiltradoPOS.length / 10)}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${paginaActual === Math.ceil(catalogoFiltradoPOS.length / 10) ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
          >
            Siguiente
          </button>
        </div>
      )}
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
                  <div className="flex items-center gap-1">
                    <button onClick={() => generarPDF("COMPROBANTE DE VENTA", v.id, "Consumidor Final", v.detalle_ticket, v.total)} className="text-indigo-400 hover:bg-indigo-500/10 p-1.5 rounded" title="Descargar PDF"><Download size={14}/></button>
                    <button onClick={() => anularVenta(v.id)} className="text-rose-400 hover:bg-rose-500/10 p-1.5 rounded"><Trash2 size={14}/></button>
                  </div>
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
  );
}
