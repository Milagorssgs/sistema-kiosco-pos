import { useState } from 'react';
import { FileSpreadsheet, Download, Trash2, RotateCcw, X } from 'lucide-react';

export default function PanelFinanzas({
  modoOscuro, subVistaFinanzas, setSubVistaFinanzas, filtroTiempo, cargarFinanzas,
  fechaInicio, setFechaInicio, fechaFin, setFechaFin,
  finanzas, formatMoney, totalHoy, totalSemana, totalMes, formEgreso, setFormEgreso,
  guardarEgreso, descargarBackupCSV, filtroHistorial, setFiltroHistorial,
  filtroMetodo, setFiltroMetodo, filtroEmpleado, setFiltroEmpleado,
  historialFiltrado, generarPDF, anularVenta, reembolsos = [], registrarReembolso
}) {
  const [modalReembolso, setModalReembolso] = useState(null);
  const [prodSeleccionado, setProdSeleccionado] = useState('');
  const [cantDevolver, setCantDevolver] = useState('1');
  const [motivoDevolucion, setMotivoDevolucion] = useState('');

  const abrirModalReembolso = (venta) => {
    let items = [];
    try { items = JSON.parse(venta.items_json || '[]'); } catch (e) { items = []; }
    setModalReembolso({ venta, items });
    if (items.length > 0) {
      setProdSeleccionado(String(items[0].id));
    } else {
      setProdSeleccionado('');
    }
    setCantDevolver('1');
    setMotivoDevolucion('');
  };

  const confirmarReembolso = async (e) => {
    e.preventDefault();
    if (!modalReembolso || !prodSeleccionado) return;
    const item = modalReembolso.items.find(i => String(i.id) === String(prodSeleccionado));
    if (!item) return;
    const cant = parseFloat(cantDevolver) || 0;
    const monto = cant * (parseFloat(item.precio_unitario) || 0);
    const ok = await registrarReembolso({
      venta_id: modalReembolso.venta.id,
      producto_id: parseInt(prodSeleccionado),
      cantidad: cant,
      monto_reembolsado: monto,
      motivo: motivoDevolucion
    });
    if (ok) setModalReembolso(null);
  };
  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 animate-fade-in">
      <div className={`p-2 rounded-2xl shadow-sm border print:hidden flex flex-col sm:flex-row justify-center gap-2 ${modoOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <button onClick={() => setSubVistaFinanzas('resumen')} className={`flex justify-center items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm sm:text-base ${subVistaFinanzas === 'resumen' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}>Dashboard de Cierre</button>
        <button onClick={() => setSubVistaFinanzas('auditoria')} className={`flex justify-center items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm sm:text-base ${subVistaFinanzas === 'auditoria' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}>Auditoría de Tickets</button>
      </div>

      {subVistaFinanzas === 'resumen' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 animate-fade-in">
          <div className={`lg:col-span-2 p-4 sm:p-8 rounded-2xl shadow-xl border print:shadow-none print:border-none print:p-0 ${modoOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6 print:hidden border-b pb-4 ${modoOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 sm:gap-4 w-full lg:w-auto justify-between lg:justify-start">
                <h3 className={`font-black text-lg sm:text-xl uppercase tracking-wide ${modoOscuro ? 'text-white' : 'text-slate-800'}`}>Reporte de Caja</h3>
                
                <div className="flex flex-wrap items-center gap-2">
                  <select value={filtroTiempo} onChange={(e) => cargarFinanzas(e.target.value, fechaInicio, fechaFin)} className={`border font-bold rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm outline-none focus:border-indigo-500 ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                    <option value="dia">Día Actual</option>
                    <option value="semana">Esta Semana</option>
                    <option value="mes">Este Mes</option>
                    <option value="personalizado">Fechas Personalizadas</option>
                  </select>

                  {filtroTiempo === 'personalizado' && (
                    <div className="flex items-center gap-2">
                      <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className={`border rounded-lg px-2 py-1.5 text-xs sm:text-sm outline-none ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`} />
                      <span className={modoOscuro ? 'text-slate-400' : 'text-slate-500'}>a</span>
                      <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className={`border rounded-lg px-2 py-1.5 text-xs sm:text-sm outline-none ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`} />
                      <button onClick={() => cargarFinanzas('personalizado', fechaInicio, fechaFin)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold shadow-md transition-colors">Buscar</button>
                    </div>
                  )}
                </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className={`p-4 rounded-2xl border ${modoOscuro ? 'bg-purple-950/20 border-purple-900' : 'bg-purple-50 border-purple-100'}`}>
                <p className="text-purple-500 font-bold mb-1 uppercase tracking-wider text-[10px] sm:text-xs">Total Vendido — Empleado 1</p>
                <p className="text-2xl sm:text-3xl font-black text-purple-400">${formatMoney(finanzas.ventas_por_empleado?.empleado_1 || 0)}</p>
              </div>
              <div className={`p-4 rounded-2xl border ${modoOscuro ? 'bg-sky-950/20 border-sky-900' : 'bg-sky-50 border-sky-100'}`}>
                <p className="text-sky-500 font-bold mb-1 uppercase tracking-wider text-[10px] sm:text-xs">Total Vendido — Empleado 2</p>
                <p className="text-2xl sm:text-3xl font-black text-sky-400">${formatMoney(finanzas.ventas_por_empleado?.empleado_2 || 0)}</p>
              </div>
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
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:gap-6">
            <input type="text" placeholder="Buscar ticket o monto..." value={filtroHistorial} onChange={(e) => setFiltroHistorial(e.target.value)} className={`w-full rounded-xl py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base font-medium outline-none border focus:border-indigo-500 ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
            <select value={filtroMetodo} onChange={(e) => setFiltroMetodo(e.target.value)} className={`rounded-xl p-2 sm:p-3 text-sm sm:text-base font-medium outline-none border focus:border-indigo-500 ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
              <option value="Todos">Todos los pagos</option>
              <option value="Efectivo">Solo Efectivo</option>
              <option value="Transferencia">Solo Transf.</option>
              <option value="Tarjeta">Solo Tarjeta</option>
              <option value="Mixto">Pagos Mixtos</option>
            </select>
            <select value={filtroEmpleado} onChange={(e) => setFiltroEmpleado(e.target.value)} className={`rounded-xl p-2 sm:p-3 text-sm sm:text-base font-medium outline-none border focus:border-indigo-500 ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
              <option value="Todos">Todos los empleados</option>
              <option value="Empleado 1">Empleado 1</option>
              <option value="Empleado 2">Empleado 2</option>
            </select>
          </div>

          <div className={`overflow-x-auto rounded-xl border ${modoOscuro ? 'border-slate-800' : 'border-slate-200'}`}>
            <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-3 sm:p-4 font-bold">#</th>
                  <th className="p-3 sm:p-4 font-bold">Fecha / Hora</th>
                  <th className="p-3 sm:p-4 font-bold">Empleado</th>
                  <th className="p-3 sm:p-4 font-bold">Detalle</th>
                  <th className="p-3 sm:p-4 font-bold">Pago</th>
                  <th className="p-3 sm:p-4 font-bold">Total</th>
                  <th className="p-3 sm:p-4 font-bold text-center">Acciones</th>
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
                      <td className="p-3 sm:p-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${(v.empleado || 'Empleado 1') === 'Empleado 1' ? 'bg-purple-500/20 text-purple-400' : 'bg-sky-500/20 text-sky-400'}`}>
                          {v.empleado || 'Empleado 1'}
                        </span>
                      </td>
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
                      <td className="p-3 sm:p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => generarPDF("COMPROBANTE DE VENTA", v.id, "Consumidor Final", v.detalle_ticket, v.total)} className="text-indigo-400 hover:bg-indigo-500/10 p-1.5 sm:p-2 rounded-lg" title="Descargar PDF"><Download size={16}/></button>
                          <button onClick={() => abrirModalReembolso(v)} className="text-amber-400 hover:bg-amber-500/10 p-1.5 sm:p-2 rounded-lg" title="Registrar Reembolso / Devolución"><RotateCcw size={16}/></button>
                          <button onClick={() => anularVenta(v.id)} className="text-rose-400 hover:bg-rose-500/10 p-1.5 sm:p-2 rounded-lg" title="Anular Venta"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {historialFiltrado.length === 0 && (
                  <tr><td colSpan="7" className="text-center p-6 sm:p-8 text-slate-400 italic">No hay tickets registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-8">
            <h4 className={`font-black text-base sm:text-lg mb-3 ${modoOscuro ? 'text-white' : 'text-slate-800'}`}>Historial de Reembolsos y Devoluciones</h4>
            <div className={`overflow-x-auto rounded-xl border ${modoOscuro ? 'border-slate-800' : 'border-slate-200'}`}>
              <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="p-3 sm:p-4 font-bold">Ticket #</th>
                    <th className="p-3 sm:p-4 font-bold">Fecha / Hora</th>
                    <th className="p-3 sm:p-4 font-bold">Empleado</th>
                    <th className="p-3 sm:p-4 font-bold">Producto</th>
                    <th className="p-3 sm:p-4 font-bold">Cant.</th>
                    <th className="p-3 sm:p-4 font-bold">Reembolsado</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${modoOscuro ? 'divide-slate-800' : 'divide-slate-200'}`}>
                  {reembolsos.map(r => (
                    <tr key={r.id} className={`transition-colors ${modoOscuro ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                      <td className="p-3 sm:p-4 font-black text-amber-400">#{r.venta_id}</td>
                      <td className={`p-3 sm:p-4 font-medium ${modoOscuro ? 'text-slate-300' : 'text-slate-600'}`}>{new Date(r.fecha).toLocaleDateString()} <span className="opacity-50">|</span> {new Date(r.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                      <td className="p-3 sm:p-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${r.empleado === 'Empleado 1' ? 'bg-purple-500/20 text-purple-400' : 'bg-sky-500/20 text-sky-400'}`}>
                          {r.empleado}
                        </span>
                      </td>
                      <td className={`p-3 sm:p-4 font-bold ${modoOscuro ? 'text-slate-200' : 'text-slate-700'}`}>{r.producto_nombre}</td>
                      <td className="p-3 sm:p-4 font-black text-emerald-400">+{r.cantidad}</td>
                      <td className={`p-3 sm:p-4 font-black ${modoOscuro ? 'text-white' : 'text-slate-800'}`}>${formatMoney(r.monto_reembolsado)}</td>
                    </tr>
                  ))}
                  {reembolsos.length === 0 && (
                    <tr><td colSpan="6" className="text-center p-6 text-slate-400 italic">No hay reembolsos registrados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {modalReembolso && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${modoOscuro ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-lg">Devolución — Ticket #{modalReembolso.venta.id}</h3>
              <button onClick={() => setModalReembolso(null)} className="text-slate-400 hover:text-rose-500"><X size={20}/></button>
            </div>
            {modalReembolso.items.length === 0 ? (
              <p className="text-sm text-amber-400 py-4">Este ticket es anterior al registro detallado de ítems y no posee productos vinculados para devolución automática.</p>
            ) : (
              <form onSubmit={confirmarReembolso} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Producto a devolver</label>
                  <select value={prodSeleccionado} onChange={e => setProdSeleccionado(e.target.value)} className={`w-full rounded-xl p-3 text-sm font-bold border outline-none ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}>
                    {modalReembolso.items.map((item, idx) => (
                      <option key={idx} value={item.id}>{item.nombre || `Producto #${item.id}`} (Vendidos: {item.cantidad})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Cantidad a devolver</label>
                  <input type="number" min="1" step="1" value={cantDevolver} onChange={e => setCantDevolver(e.target.value)} className={`w-full rounded-xl p-3 text-sm font-bold border outline-none ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Motivo (opcional)</label>
                  <input type="text" placeholder="Ej: Falla, cambio..." value={motivoDevolucion} onChange={e => setMotivoDevolucion(e.target.value)} className={`w-full rounded-xl p-3 text-sm font-medium border outline-none ${modoOscuro ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setModalReembolso(null)} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-800">Cancelar</button>
                  <button type="submit" className="px-5 py-2 rounded-xl text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md">Confirmar Devolución</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
