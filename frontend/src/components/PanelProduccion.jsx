export default function PanelProduccion({
  top3Produccion, modoOscuro, prodForm, setProdForm, formatMoney,
  costoUnitario, precioSugerido, guardarProduccion, historialProd
}) {
  return (
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
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 ml-1">({unidades} uni.)</span>
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
  );
}
