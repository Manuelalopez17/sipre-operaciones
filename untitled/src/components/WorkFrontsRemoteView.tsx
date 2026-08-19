import React, { useEffect, useMemo, useState } from 'react';
import { Wrench, Search, RefreshCw, MapPin, Calendar, UserCheck, Trash2, AlertCircle, Loader2, Boxes, Truck, Play, CheckCircle2, Pencil } from 'lucide-react';
import { WorkFrontRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { isCoordinator, isManagement, isProfessional } from '../lib/roles';
import { deleteWorkFrontInDb, getWorkFrontsFromDb, subscribeWorkFrontsRealtime, updateWorkFrontStatusInDb } from '../lib/workFrontRemote';
import { updateWorkFrontDetailsRemote } from '../lib/workflowCrudRemote';

interface WorkFrontsViewProps {
  onNavigateToMaterials?: () => void;
  onNavigateToDeliveries?: () => void;
}

export const WorkFrontsView: React.FC<WorkFrontsViewProps> = ({ onNavigateToMaterials, onNavigateToDeliveries }) => {
  const { user, profile } = useAuth();
  const [fronts, setFronts] = useState<WorkFrontRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [onlyMine, setOnlyMine] = useState(() => isProfessional(profile?.role));
  const [busyId, setBusyId] = useState<string | null>(null);

  const professional = isProfessional(profile?.role);
  const adminCleanup = isCoordinator(profile?.role) || isManagement(profile?.role);
  const myName = (profile?.full_name || user?.email?.split('@')[0] || '').toLowerCase().trim();

  const load = async () => {
    setLoading(true);
    try { setFronts(await getWorkFrontsFromDb()); setError(null); }
    catch (e: any) { setError(e?.message || 'No se pudieron cargar los frentes desde Supabase.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); const unsub = subscribeWorkFrontsRealtime(load); return unsub; }, []);

  const isMine = (front: WorkFrontRecord) => {
    const resp = (front.responsibleTechnicalProfessional || '').toLowerCase().trim();
    return Boolean(myName && resp && (resp.includes(myName) || myName.includes(resp)));
  };

  const filtered = useMemo(() => fronts.filter(f => {
    const hay = `${f.frontCode} ${f.caseCode || ''} ${f.clientName} ${f.propertyAddress} ${f.responsibleTechnicalProfessional}`.toLowerCase();
    const matchesSearch = !search.trim() || hay.includes(search.toLowerCase().trim());
    return matchesSearch && (!onlyMine || isMine(f));
  }), [fronts, search, onlyMine, myName]);

  const canEditDelete = (front: WorkFrontRecord) => adminCleanup || (professional && isMine(front));

  const activateFront = async (front: WorkFrontRecord) => {
    if (!professional || !isMine(front)) return;
    if (!window.confirm(`¿Confirmas que hoy inician actividades en el frente ${front.frontCode}?\n\nEl frente pasará a EN EJECUCIÓN.`)) return;
    setBusyId(front.id); setError(null);
    try { await updateWorkFrontStatusInDb(front.id, 'EN EJECUCIÓN'); setNotice(`Frente ${front.frontCode} activado.`); await load(); }
    catch (e: any) { setError(e?.message || 'No se pudo activar el frente.'); }
    finally { setBusyId(null); }
  };

  const editFront = async (front: WorkFrontRecord) => {
    if (!canEditDelete(front)) return;
    const scope = window.prompt('Editar alcance del frente:', front.repairScope || '');
    if (scope === null) return;
    const start = window.prompt('Fecha prevista de inicio (AAAA-MM-DD o vacío):', front.plannedStartDate || '');
    if (start === null) return;
    const end = window.prompt('Fecha prevista de terminación (AAAA-MM-DD o vacío):', front.plannedCompletionDate || '');
    if (end === null) return;
    setBusyId(front.id); setError(null);
    try {
      await updateWorkFrontDetailsRemote({ id: front.id, repairScope: scope, plannedStartDate: start || undefined, plannedCompletionDate: end || undefined });
      setNotice(`Frente ${front.frontCode} editado correctamente.`); await load();
    } catch (e: any) { setError(e?.message || 'No se pudo editar el frente.'); }
    finally { setBusyId(null); }
  };

  const goMaterials = (front: WorkFrontRecord) => { sessionStorage.setItem('sipre_selected_material_front', front.id); onNavigateToMaterials?.(); };

  const remove = async (front: WorkFrontRecord) => {
    if (!canEditDelete(front)) return;
    if (!window.confirm(`¿Eliminar definitivamente el frente ${front.frontCode}?\n\nÚsalo para borrar una prueba o dato creado por error.`)) return;
    setBusyId(front.id); setError(null);
    try { await deleteWorkFrontInDb(front.id); setNotice(`Frente ${front.frontCode} eliminado.`); await load(); }
    catch (e: any) { setError(e?.message || 'No se pudo eliminar el frente.'); }
    finally { setBusyId(null); }
  };

  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><div className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">Ejecución Remota</div><h1 className="text-2xl font-black text-white flex items-center gap-2 mt-1"><Wrench className="w-6 h-6 text-cyan-400"/>Frentes de Obra y Reparación</h1><p className="text-xs text-slate-400 mt-1">Puedes editar o borrar tus propios frentes de prueba; Coordinación/Gerencia pueden corregir cualquier registro.</p></div><div className="flex flex-wrap gap-2"><button onClick={onNavigateToMaterials} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"><Boxes className="w-4 h-4"/>Materiales</button><button onClick={onNavigateToDeliveries} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"><Truck className="w-4 h-4"/>Entregas</button><button onClick={load} className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white flex items-center gap-1.5"><RefreshCw className="w-4 h-4"/>Actualizar</button></div></div>
    {notice && <div className="bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-xl p-3 text-xs font-bold">{notice}</div>}
    {error && <div className="bg-red-950 border border-red-800 text-red-200 rounded-xl p-3 text-xs flex gap-2"><AlertCircle className="w-4 h-4 shrink-0"/>{error}</div>}
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 sm:items-center"><div className="relative flex-1"><Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por frente, expediente, cliente, dirección o profesional..." className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white"/></div>{professional && <label className="flex items-center gap-2 text-xs text-slate-300 font-bold bg-slate-950 px-3 py-2 rounded-xl border border-slate-800"><input type="checkbox" checked={onlyMine} onChange={e=>setOnlyMine(e.target.checked)}/>Solo frentes a mi cargo</label>}<span className="text-xs text-slate-400 font-mono">{filtered.length} frente(s)</span></div>
    {loading ? <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2"/>Cargando frentes...</div> : filtered.length === 0 ? <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center"><Wrench className="w-8 h-8 text-slate-600 mx-auto mb-2"/><h3 className="text-sm font-bold text-white">No hay frentes para mostrar</h3></div> : <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{filtered.map(front => { const mine = isMine(front); const canChange = canEditDelete(front); return <div key={front.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-cyan-400 text-xs font-bold">{front.frontCode}</div><div className="text-base font-black text-white mt-0.5">{front.clientName}</div><div className="text-xs text-slate-400 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-cyan-400"/>{front.propertyAddress}</div></div>{canChange && <div className="flex gap-2"><button disabled={busyId===front.id} onClick={()=>editFront(front)} title="Editar" className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300"><Pencil className="w-4 h-4"/></button><button disabled={busyId===front.id} onClick={()=>remove(front)} title="Eliminar" className="p-2 rounded-lg bg-red-950/60 border border-red-900 text-red-300"><Trash2 className="w-4 h-4"/></button></div>}</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs"><div className="bg-slate-950 rounded-xl p-3 border border-slate-800"><div className="text-slate-500 font-bold">PROFESIONAL RESPONSABLE</div><div className="text-slate-200 mt-1 flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 text-cyan-400"/>{front.responsibleTechnicalProfessional}</div></div><div className="bg-slate-950 rounded-xl p-3 border border-slate-800"><div className="text-slate-500 font-bold">PROGRAMACIÓN</div><div className="text-slate-200 mt-1 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-cyan-400"/>{front.plannedStartDate || 'Por programar'} → {front.plannedCompletionDate || 'Por programar'}</div></div></div><div><div className="text-[11px] text-slate-500 font-bold mb-1">ALCANCE</div><div className="text-xs text-slate-300 bg-slate-950 border border-slate-800 rounded-xl p-3">{front.repairScope}</div></div><div className="flex items-center justify-between gap-2 border-t border-slate-800 pt-3"><div><div className="text-[10px] text-slate-500 font-bold">ESTADO</div><div className="font-black text-sm text-cyan-500 mt-0.5">{front.status}</div></div><div className="flex gap-2">{professional && mine && front.status === 'PENDIENTE' && <button disabled={busyId===front.id} onClick={() => activateFront(front)} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1">{busyId===front.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4"/>}ACTIVAR FRENTE</button>}{professional && mine && front.status === 'EN EJECUCIÓN' && <button onClick={() => goMaterials(front)} className="px-3 py-2 rounded-lg bg-cyan-600 text-white text-xs font-bold flex items-center gap-1"><Boxes className="w-4 h-4"/>Solicitar materiales</button>}{front.status === 'ENTREGADO' || front.status === 'CERRADO' ? <CheckCircle2 className="w-5 h-5 text-emerald-500"/> : null}</div></div></div>; })}</div>}
  </div>;
};
