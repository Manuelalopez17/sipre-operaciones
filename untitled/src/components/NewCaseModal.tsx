import React, { useState } from 'react';
import { X, FolderKanban, AlertCircle, Loader2 } from 'lucide-react';
import { CasePriority, CaseType, PropertyType } from '../types';
import { createCaseInDb } from '../lib/remoteCore';
import { saveCase } from '../lib/storage';
import { useAuth } from '../context/AuthContext';

interface NewCaseModalProps { isOpen: boolean; onClose: () => void; onCaseCreated?: () => void; }

export const NewCaseModal: React.FC<NewCaseModalProps> = ({ isOpen, onClose, onCaseCreated }) => {
  const { user, profile, currentEmergency } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    clientName:'', contactPerson:'', phone:'', email:'', address:'',
    municipality: currentEmergency?.municipality || '', department: currentEmergency?.department || '', neighborhood:'',
    propertyType:'Edificio' as PropertyType, caseType:'Inspección' as CaseType, priority:'Normal' as CasePriority,
    requestDescription:'', responsibleCoordinator: profile?.full_name || 'Coordinador Técnico',
  });
  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!form.clientName.trim() || !form.address.trim() || !form.municipality.trim() || !form.requestDescription.trim()) return setError('Completa cliente, dirección, municipio y descripción de la solicitud.');
    setLoading(true);
    try {
      const dbCase = await createCaseInDb({ ...form, createdBy:user?.id, emergencyId:currentEmergency?.id });
      saveCase({
        id: dbCase.id, code: dbCase.code, requestDate: dbCase.requestDate, clientName: dbCase.clientName,
        contactPerson: dbCase.contactPerson, phone: dbCase.phone, email: dbCase.email, address: dbCase.address,
        municipality: dbCase.municipality, department: dbCase.department, neighborhood: dbCase.neighborhood,
        propertyType: dbCase.propertyType, caseType: dbCase.caseType, priority: dbCase.priority,
        requestDescription: dbCase.requestDescription, responsibleCoordinator: dbCase.responsibleCoordinator,
        status: dbCase.status, createdAt: dbCase.createdAt, updatedAt: dbCase.updatedAt,
      });
      onCaseCreated?.(); onClose();
    } catch (e:any) { setError(e?.message || 'No se pudo crear el expediente en Supabase.'); }
    finally { setLoading(false); }
  };

  const inputClass='w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500';
  return <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
      <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-5"><div><h2 className="text-lg font-black text-white flex items-center gap-2"><FolderKanban className="w-5 h-5 text-cyan-400"/>Crear Nuevo Expediente</h2><p className="text-xs text-slate-400 mt-1">El expediente se guarda en la base compartida de SIPRE.</p></div><button onClick={onClose} className="p-2 bg-slate-800 rounded-lg text-slate-400"><X className="w-4 h-4"/></button></div>
      {error && <div className="mb-4 p-3 rounded-xl bg-red-950 border border-red-800 text-red-200 text-xs flex gap-2"><AlertCircle className="w-4 h-4 shrink-0"/>{error}</div>}
      {!currentEmergency && <div className="mb-4 p-3 rounded-xl bg-amber-950 border border-amber-800 text-amber-200 text-xs">Antes de crear el primer expediente, configura una emergencia activa desde SIPRE.</div>}
      <form onSubmit={submit} className="space-y-4">
        <section className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className={inputClass} placeholder="Cliente / solicitante *" value={form.clientName} onChange={e=>setForm({...form,clientName:e.target.value})}/><input className={inputClass} placeholder="Persona de contacto" value={form.contactPerson} onChange={e=>setForm({...form,contactPerson:e.target.value})}/><input className={inputClass} placeholder="Teléfono" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><input className={inputClass} placeholder="Correo" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
        </section>
        <section className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className={inputClass} placeholder="Dirección *" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/><input className={inputClass} placeholder="Municipio *" value={form.municipality} onChange={e=>setForm({...form,municipality:e.target.value})}/><input className={inputClass} placeholder="Departamento" value={form.department} onChange={e=>setForm({...form,department:e.target.value})}/><input className={inputClass} placeholder="Barrio / sector" value={form.neighborhood} onChange={e=>setForm({...form,neighborhood:e.target.value})}/>
          <select className={inputClass} value={form.propertyType} onChange={e=>setForm({...form,propertyType:e.target.value as PropertyType})}><option>Casa</option><option>Edificio</option><option>Apartamento</option><option>Bodega</option><option>Institucional</option><option>Industrial</option><option>Otro</option></select>
          <select className={inputClass} value={form.priority} onChange={e=>setForm({...form,priority:e.target.value as CasePriority})}><option>Baja</option><option>Normal</option><option>Alta</option><option>Urgente</option></select>
        </section>
        <section className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3"><textarea className={`${inputClass} min-h-[100px]`} placeholder="Descripción de la solicitud técnica *" value={form.requestDescription} onChange={e=>setForm({...form,requestDescription:e.target.value})}/><input className={inputClass} placeholder="Coordinador responsable" value={form.responsibleCoordinator} onChange={e=>setForm({...form,responsibleCoordinator:e.target.value})}/></section>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300 text-xs">Cancelar</button><button disabled={loading} className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white text-xs font-bold flex items-center gap-2 disabled:opacity-60">{loading&&<Loader2 className="w-4 h-4 animate-spin"/>}Crear expediente</button></div>
      </form>
    </div>
  </div>;
};
