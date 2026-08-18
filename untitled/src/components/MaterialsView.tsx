import React, { useEffect, useMemo, useState } from 'react';
import { Boxes, PlusCircle, Search, X, Truck, Eye, ShieldCheck } from 'lucide-react';
import { MaterialRequestRecord } from '../types';
import { getMaterialRequests, saveMaterialRequest, generateNextMaterialRequestCode } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { isOperative } from '../lib/roles';

interface MaterialsViewProps { onNavigateToDeliveries?: () => void; }

export const MaterialsView: React.FC<MaterialsViewProps> = ({ onNavigateToDeliveries }) => {
  const { profile } = useAuth();
  const canEdit = isOperative(profile?.role);
  const [requests, setRequests] = useState<MaterialRequestRecord[]>([]);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ workFrontCode:'', caseCode:'', urgency:'Media', justification:'', materialName:'', quantity:1, unit:'un' });

  const reload = () => setRequests(getMaterialRequests());
  useEffect(() => { reload(); }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(r => `${r.requestCode || r.requestNumber || r.id} ${r.workFrontCode || ''} ${r.caseCode || ''}`.toLowerCase().includes(q));
  }, [requests, search]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !form.materialName.trim()) return;
    const now = new Date().toISOString();
    saveMaterialRequest({
      id: `REQ-${Date.now()}`,
      requestCode: generateNextMaterialRequestCode(),
      workFrontId: '',
      workFrontCode: form.workFrontCode,
      caseId: '',
      caseCode: form.caseCode,
      requestDate: now.slice(0,10),
      requestedBy: profile?.full_name || 'Operativo',
      urgency: form.urgency as any,
      status: 'SOLICITADO',
      justification: form.justification,
      items: [{ id:`ITM-${Date.now()}`, name:form.materialName, requestedQuantity:Number(form.quantity)||1, unit:form.unit }],
      createdAt: now,
      updatedAt: now,
    });
    reload();
    setCreating(false);
    setForm({ workFrontCode:'', caseCode:'', urgency:'Media', justification:'', materialName:'', quantity:1, unit:'un' });
  };

  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div><div className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">Logística</div><h1 className="text-2xl font-black text-white flex items-center gap-2 mt-1"><Boxes className="w-6 h-6 text-cyan-400"/>Materiales</h1><p className="text-xs text-slate-400 mt-1">{canEdit?'Tu rol Operativo puede registrar y gestionar solicitudes de materiales.':'Modo lectura. Solo el personal Operativo puede modificar materiales.'}</p></div>
      <div className="flex gap-2">{onNavigateToDeliveries&&<button onClick={onNavigateToDeliveries} className="bg-slate-800 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"><Truck className="w-4 h-4"/>Entregas</button>}{canEdit&&<button onClick={()=>setCreating(true)} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"><PlusCircle className="w-4 h-4"/>Nueva solicitud</button>}</div>
    </div>

    {!canEdit&&<div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 flex items-center gap-2"><Eye className="w-4 h-4 text-cyan-400"/>Consulta autorizada. Los controles de edición están bloqueados para este rol.</div>}
    {canEdit&&<div className="bg-amber-950/30 border border-amber-900 rounded-xl p-3 text-xs text-amber-100 flex items-center gap-2"><ShieldCheck className="w-4 h-4"/>Las modificaciones quedan asociadas al usuario operativo autenticado.</div>}

    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar solicitud, frente o expediente..." className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white"/></div></div>

    {visible.length===0?<div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">No hay solicitudes de materiales.</div>:<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{visible.map(r=><div key={r.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3"><div className="flex justify-between gap-2"><span className="font-mono text-xs font-bold text-cyan-400">{r.requestCode||r.requestNumber||r.id}</span><span className="text-[10px] px-2 py-1 rounded-full bg-blue-950 text-blue-300 border border-blue-800">{r.status}</span></div><div className="text-xs text-slate-300"><div><span className="text-slate-500">Frente:</span> {r.workFrontCode||'-'}</div><div><span className="text-slate-500">Expediente:</span> {r.caseCode||'-'}</div><div><span className="text-slate-500">Solicitado por:</span> {r.requestedBy}</div></div><div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-300">{r.items?.map((i:any)=><div key={i.id}>{i.name||i.materialName}: {i.requestedQuantity||i.quantity} {i.unit}</div>)}</div></div>)}</div>}

    {creating&&canEdit&&<div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4"><form onSubmit={submit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-lg w-full space-y-3"><div className="flex items-center justify-between"><h2 className="font-black text-white">Nueva solicitud de materiales</h2><button type="button" onClick={()=>setCreating(false)} className="p-2 bg-slate-800 rounded-lg"><X className="w-4 h-4"/></button></div><input placeholder="Código frente" value={form.workFrontCode} onChange={e=>setForm({...form,workFrontCode:e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"/><input placeholder="Código expediente" value={form.caseCode} onChange={e=>setForm({...form,caseCode:e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"/><input required placeholder="Material *" value={form.materialName} onChange={e=>setForm({...form,materialName:e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"/><div className="grid grid-cols-2 gap-2"><input type="number" min="0" step="0.01" value={form.quantity} onChange={e=>setForm({...form,quantity:Number(e.target.value)})} className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"/><input placeholder="Unidad" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"/></div><textarea placeholder="Justificación / observaciones" value={form.justification} onChange={e=>setForm({...form,justification:e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"/><div className="flex justify-end gap-2"><button type="button" onClick={()=>setCreating(false)} className="px-4 py-2 bg-slate-800 rounded-xl text-xs">Cancelar</button><button className="px-4 py-2 bg-cyan-600 rounded-xl text-xs font-bold">Guardar solicitud</button></div></form></div>}
  </div>;
};
