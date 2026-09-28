import { 
  UploadCloud, ExternalLink, Image as ImageIcon, 
  Pencil, Wrench, Search, Trash2 
} from 'lucide-react';

export default function PanelCatalogo({
  modoOscuro, catForm, setCatForm, subiendoFoto, productoEditando,
  abrirBuscadorGoogle, manejarPegadoImagen, manejarSeleccionArchivo,
  cancelarEdicion, guardarProducto, catalogo, busquedaCatalogo,
  setBusquedaCatalogo, catalogoFiltradoABM, paginaActual, setPaginaActual,
  renderEtiquetas, formatMoney, cargarParaEditar, borrarProducto
}) {
  return (
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
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Código SKU</label>
              <input type="text" placeholder="Auto-generado" disabled value={catForm.codigo_sku} onChange={e => setCatForm({...catForm, codigo_sku: e.target.value})} className={`w-full rounded-xl p-2.5 outline-none text-sm font-mono border ${modoOscuro ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`} />
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
        {catalogoFiltradoABM.slice((paginaActual - 1) * 10, paginaActual * 10).map(prod => (
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
        {/* CONTROLES DE PAGINACIÓN */}
    {Math.ceil(catalogoFiltradoABM.length / 10) > 1 && (
      <div className="flex justify-center items-center gap-4 my-8 w-full print:hidden">
        <button
          onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
          disabled={paginaActual === 1}
          className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${paginaActual === 1 ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
        >
          Anterior
        </button>

        <span className="text-xs font-bold text-slate-400">
          Página {paginaActual} de {Math.ceil(catalogoFiltradoABM.length / 10)}
        </span>

        <button
          onClick={() => setPaginaActual(prev => Math.min(prev + 1, Math.ceil(catalogoFiltradoABM.length / 10)))}
          disabled={paginaActual === Math.ceil(catalogoFiltradoABM.length / 10)}
          className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${paginaActual === Math.ceil(catalogoFiltradoABM.length / 10) ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
        >
          Siguiente
        </button>
      </div>
    )}
        {catalogoFiltradoABM.length === 0 && (
          <p className="text-slate-400 text-sm italic text-center py-8">No se encontraron productos.</p>
        )}
      </div>
      </div>
    </div>
  );
}
