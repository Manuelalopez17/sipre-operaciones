import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, MapPin, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import { CasePriority, CaseRecord, PropertyType } from '../types';
import { createVisitInDb, getCasesFromDb } from '../lib/remoteCore';
import { useAuth } from '../context/AuthContext';

interface ScheduleVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVisitCreated?: () => void;
}

export const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({ isOpen, onClose, onVisitCreated }) => {
  const { user, activeProfiles } = useAuth();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [caseId, setCaseId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0,10), startTime: '09:00', estimatedEndTime: '11:00',
    clientName: '', address: '', municipality: '', neighborhood: '', propertyType: 'Edificio' as PropertyType,
    responsibleProfessionalId: '', responsibleProfessional: '', assignedTeam: '', visitReason: 'Inspección técnica',
    visitObjective: '', preparationObservations: '', priority: 'Normal' as CasePriority,
  });

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    getCasesFromDb().then(setCases).catch((e:any) => setError(e?.message || 'No se pudieron cargar los expedientes.'));
  }, [isOpen]);

  if (!isOpen) return null;

  const selectCase = (id: string) => {
    setCaseId(id);
    const c = cases.find(x => x.id === id);
    if (c) setForm(prev => ({ ...prev, clientName: c.clientName || '', address: c.address || '', municipality: c.municipality || '', neighborhood: c.neighborhood || '', propertyType: c.propertyType, priority: c.priority }));
  };

  const selectProfessional = (id: string) => {
    const p = activeProfiles.find(x => x.id === id);
    setForm(prev => ({ ...prev, responsibleProfessionalId: id, responsibleProfessional: p?.full_name || '' }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!caseId) return setError('Selecciona el expediente al que pertenece la visita.');
    if (!form.responsibleProfessionalId) return setError('Selecciona el profesional responsable.');
    if (!form.clientName.trim() || !form.address.trim() || !form.municipality.trim()) return setError('Completa cliente, dirección y municipio.');
    setLoading(true);
    try {
      const c = cases.find(x => x.id === caseId);
      await createVisitInDb({
        caseId, caseCode: c?.code, date: form.date, startTime: form.startTime, estimatedEndTime: form.estimatedEndTime,
        clientName: form.clientName, address: form.address, municipality: form.municipality, neighborhood: form.neighborhood,
        propertyType: form.propertyType, responsibleProfessionalId: form.responsibleProfessionalId,
        responsibleProfessionalName: form.responsibleProfessional, assignedTeam: form.assignedTeam,
        visitReason: form.visitReason, visitObjective: form.visitObjective, preparationObservations: form.preparationObservations,
        priority: form.priority, createdBy: user?.id,
      });
      onVisitCreated?.();
      onClose();
    } catch (e:any) {
      setError(e?.message || 'No se pudo guardar la visita en Supabase.');
    } finally { setLoading(false); }
  };

  const professionals = activeProfiles.filter(p => p.active !== false && (p.role === 'inspector' || p.role === 'structural_specialist' || p.role === 'Inspector'));

  return <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
      <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-5">
        <div><h2 className="text-lg font-black text-white flex items-center gap-2"><Calendar className="w-5 h-5 text-cyan-400"/>Programar Nueva Visita</h2><p className="text-xs text-slate-400 mt-1">La visita se guarda en Supabase y queda disponible para el profesional asignado.</p></div>
        <button onClick={onClose} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"><X className="w-4 h-4"/></button>
      </div>
      {error && <div className="mb-4 p-3 rounded-xl bg-red-950 border border-red-800 text-red-200 text-xs flex gap-2"><AlertCircle className="w-4 h-4 shrink-0"/>{error}</div>}
      <form onSubmit={submit} className="space-y-4 text-xs">
        <section className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <label className="block font-bold text-white">Expediente *</label>
          <select value={caseId} onChange={e => selectCase(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" required><option value="">Seleccione expediente...</option>{cases.map(c => <option key={c.id} value={c.id}>{c.code} · {c.clientName} · {c.address}</option>)}</select>
          {cases.length===0 && <p className="text-amber-300">No hay expedientes en Supabase. Crea primero un expediente.</p>}
        </section>
        <section className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 font-bold text-white"><Clock className="w-4 h-4 text-cyan-400"/>Fecha y horario</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" required/><input type="time" value={form.startTime} onChange={e=>setForm({...form,startTime:e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" required/><input type="time" value={form.estimatedEndTime} onChange={e=>setForm({...form,estimatedEndTime:e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" required/></div>
        </section>
        <section className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 font-bold text-white"><MapPin className="w-4 h-4 text-cyan-400"/>Predio</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><input placeholder="Cliente" value={form.clientName} onChange={e=>setForm({...form,clientName:e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" required/><input placeholder="Dirección" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" required/><input placeholder="Municipio" value={form.municipality} onChange={e=>setForm({...form,municipality:e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" required/><input placeholder="Barrio / sector" value={form.neighborhood} onChange={e=>setForm({...form,neighborhood:e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"/></div>
        </section>
        <section className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 font-bold text-white"><UserCheck className="w-4 h-4 text-cyan-400"/>Profesional responsable *</div>
          <select value={form.responsibleProfessionalId} onChange={e=>selectProfessional(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white" required><option value="">Seleccione profesional...</option>{professionals.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select>
          <textarea placeholder="Objetivo de la visita" value={form.visitObjective} onChange={e=>setForm({...form,visitObjective:e.target.value})} className="w-full min-h-[80px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"/>
        </section>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300">Cancelar</button><button disabled={loading} className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-2 disabled:opacity-60">{loading&&<Loader2 className="w-4 h-4 animate-spin"/>}Guardar visita</button></div>
      </form>
    </div>
  </div>;
};
