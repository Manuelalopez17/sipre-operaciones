import React, { useEffect, useMemo, useState } from 'react';
import { Truck, PlusCircle, Search, X, Eye, ShieldCheck } from 'lucide-react';
import { MaterialDeliveryRecord } from '../types';
import { getMaterialDeliveries, saveMaterialDelivery, generateNextDeliveryCode } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { isOperative } from '../lib/roles';

export const DeliveriesView: React.FC = () => {
  const { profile } = useAuth();
  const canEdit = isOperative(profile?.role);
  const [deliveries, setDeliveries] = useState<MaterialDeliveryRecord[]>([]);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ workFrontCode:'', driverCourierName:'', driverPhone:'', transportType:'Vehículo propio', departureDateTime:new Date().toISOString().slice(0,10)+'T08:00', estimatedArrivalDateTime:new Date().toISOString().slice(0,10)+'T10:00', itemsSummary:'' });

  const reload = () => setDeliveries(getMaterialDeliveries());
  useEffect(() => { reload(); }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return deliveries;
    return deliveries.filter(d => `${d.deliveryNoteCode || d.deliveryNumber || d.id} ${d.workFrontCode || ''} ${d.driverCourierName || ''}`.toLowerCase().includes(q));
  }, [deliveries, search]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !form.workFrontCode.trim()) return;
    const now = new Date().toISOString();
    saveMaterialDelivery({
      id:`DEL-${Date.now()}`,
      deliveryNoteCode:generateNextDeliveryCode(),
      materialRequestId:'',
      materialRequestCode:'',
      workFrontId:'',
      workFrontCode:form.workFrontCode,
      departureDateTime:form.departureDateTime,
      estimatedArrivalDateTime:form.estimatedArrivalDateTime,
      transportType:form.transportType,
      driverCourierName:form.driverCourierName || profile?.full_name || 'Operativo',
      driverPhone:form.driverPhone,
      status:'PROGRAMADA',
      deliveredItems:[{ materialItemId:`ITM-${Date.now()}`, name:form.itemsSummary || 'Materiales de obra', deliveredQuantity:1, unit:'global' }],
      createdAt:now,
      updatedAt:now,
    });
    reload();
    setCreating(false);
    setForm({ workFrontCode:'', driverCourierName:'', driverPhone:'', transportType:'Vehículo propio', departureDateTime:new Date().toISOString().slice(0,10)+'T08:00', estimatedArrivalDateTime:new Date().toISOString().slice(0,10)+'T10:00', itemsSummary:'' });
  };

  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div><div className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">Logística</div><h1 className="text-2xl font-black text-white flex items-center gap-2 mt-1"><Truck className="w-6 h-6 text-cyan-400"/>Entregas</h1><p className="text-xs text-slate-400 mt-1">{canEdit?'Tu rol Operativo puede registrar y gestionar entregas.':'Modo lectura. Solo el personal Operativo puede modificar entregas.'}</p></div>
      {canEdit&&<button onClick={()=>setCreating(true)} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"><PlusCircle className="w-4 h-4"/>Nueva entrega</button>}
    </div>

    {!canEdit&&<div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 flex items-center gap-2"><Eye className="w-4 h-4 text-cyan-400"/>Consulta autorizada. Los controles de edición están bloqueados para este rol.</div>}
    {canEdit&&<div className="bg-amber-950/30 border border-amber-900 rounded-xl p-3 text-xs text-amber-100 flex items-center gap-2"><ShieldCheck className="w-4 h-4"/>Las modificaciones quedan asociadas al usuario operativo autenticado.</div>}

    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar entrega, frente o conductor..." className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white"/></div></div>

    {visible.length===0?<div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">No hay entregas registradas.</div>:<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{visible.map(d=><div key={d.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3"><div className="flex justify-between gap-2"><span className="font-mono text-xs font-bold text-cyan-400">{d.deliveryNoteCode||d.deliveryNumber||d.id}</span><span className="text-[10px] px-2 py-1 rounded-full bg-blue-950 text-blue-300 border border-blue-800">{d.status}</span></div><div className="text-xs text-slate-300 space-y-1"><div><span className="text-slate-500">Frente:</span> {d.workFrontCode||'-'}</div><div><span className="text-slate-500">Conductor:</span> {d.driverCourierName||'-'}</div><div><span className="text-slate-500">Salida:</span> {d.departureDateTime||'-'}</div><div><span className="text-slate-500">Llegada estimada:</span> {d.estimatedArrivalDateTime||'-'}</div></div></div>)}</div>}

    {creating&&canEdit&&<div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4"><form onSubmit={submit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-lg w-full space-y-3"><div className="flex items-center justify-between"><h2 className="font-black text-white">Nueva entrega</h2><button type="button" onClick={()=>setCreating(false)} className="p-2 bg-slate-800 rounded-lg"><X className="w-4 h-4"/></button></div><input required placeholder="Código frente *" value={form.workFrontCode} onChange={e=>setForm({...form,workFrontCode:e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"/><input placeholder="Conductor / responsable" value={form.driverCourierName} onChange={e=>setForm({...form,driverCourierName:e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"/><input placeholder="Teléfono" value={form.driverPhone} onChange={e=>setForm({...form,driverPhone:e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"/><input placeholder="Materiales transportados" value={form.itemsSummary} onChange={e=>setForm({...form,itemsSummary:e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"/><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><input type="datetime-local" value={form.departureDateTime} onChange={e=>setForm({...form,departureDateTime:e.target.value})} className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"/><input type="datetime-local" value={form.estimatedArrivalDateTime} onChange={e=>setForm({...form,estimatedArrivalDateTime:e.target.value})} className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"/></div><div className="flex justify-end gap-2"><button type="button" onClick={()=>setCreating(false)} className="px-4 py-2 bg-slate-800 rounded-xl text-xs">Cancelar</button><button className="px-4 py-2 bg-cyan-600 rounded-xl text-xs font-bold">Guardar entrega</button></div></form></div>}
  </div>;
};
