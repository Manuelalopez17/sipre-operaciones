import React, { useEffect, useMemo, useState } from 'react';
import { Boxes, PlusCircle, Search, RefreshCw, Loader2, X, AlertCircle, Wrench, UserCheck, ArrowRight } from 'lucide-react';
import { MaterialRequestItem, MaterialRequestStatus, WorkFrontRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { isOperative, isProfessional } from '../lib/roles';
import { getWorkFrontsFromDb, subscribeWorkFrontsRealtime } from '../lib/workFrontRemote';
import {
  createRemoteMaterialRequest,
  getRemoteMaterialRequests,
  RemoteMaterialRequest,
  subscribeWorkflowRemote,
  updateRemoteMaterialRequestStatus,
} from '../lib/workflowRemote';

interface MaterialsViewProps {
  onNavigateToDeliveries?: () => void;
}

const statusOptions: MaterialRequestStatus[] = ['SOLICITADO','EN REVISIÓN','APROBADO','COMPRADO','PREPARADO EN BODEGA','DESPACHADO','ENTREGADO','CANCELADO'];

export const MaterialsView: React.FC<MaterialsViewProps> = ({ onNavigateToDeliveries }) => {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<RemoteMaterialRequest[]>([]);
  const [fronts, setFronts] = useState<WorkFrontRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [frontId, setFrontId] = useState('');
  const [urgency, setUrgency] = useState<'Baja'|'Media'|'Alta'|'Urgente'>('Media');
  const [requiredDate, setRequiredDate] = useState('');
  const [justification, setJustification] = useState('');
  const [items, setItems] = useState<Array<{ name: string; requestedQuantity: number; unit: string; technicalSpecification: string }>>([
    { name: '', requestedQuantity: 1, unit: 'un', technicalSpecification: '' },
  ]);

  const professional = isProfessional(profile?.role);
  const operative = isOperative(profile?.role);
  const myName = (profile?.full_name || '').trim().toLowerCase();

  const isMine = (front: WorkFrontRecord) => {
    const resp = (front.responsibleTechnicalProfessional || '').trim().toLowerCase();
    return Boolean(myName && resp && (resp.includes(myName) || myName.includes(resp)));
  };

  const eligibleFronts = useMemo(() => fronts.filter(f => f.status === 'EN EJECUCIÓN' && (!professional || isMine(f))), [fronts, professional, myName]);

  const load = async () => {
    setLoading(true);
    try {
      const [requestRows, frontRows] = await Promise.all([getRemoteMaterialRequests(), getWorkFrontsFromDb()]);
      setRequests(requestRows);
      setFronts(frontRows);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'No se pudieron cargar las solicitudes remotas de materiales.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsubWorkflow = subscribeWorkflowRemote(load);
    const unsubFronts = subscribeWorkFrontsRealtime(load);
    const timer = window.setInterval(load, 7000);
    return () => { unsubWorkflow(); unsubFronts(); window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (loading || !professional) return;
    const requestedFront = sessionStorage.getItem('sipre_selected_material_front');
    if (!requestedFront) return;
    if (eligibleFronts.some(f => f.id === requestedFront)) {
      setFrontId(requestedFront);
      setCreateOpen(true);
    }
    sessionStorage.removeItem('sipre_selected_material_front');
  }, [loading, eligibleFronts.length, professional]);

  const filtered = useMemo(() => requests.filter(r => {
    const hay = `${r.requestCode} ${r.workFrontCode || ''} ${r.requestedBy} ${r.items.map(i => i.name || i.materialName || '').join(' ')}`.toLowerCase();
    return !search.trim() || hay.includes(search.trim().toLowerCase());
  }), [requests, search]);

  const resetForm = () => {
    setFrontId(''); setUrgency('Media'); setRequiredDate(''); setJustification('');
    setItems([{ name: '', requestedQuantity: 1, unit: 'un', technicalSpecification: '' }]);
  };

  const createRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professional) return;
    const front = fronts.find(f => f.id === frontId);
    if (!front || !isMine(front) || front.status !== 'EN EJECUCIÓN') return setError('Selecciona un frente EN EJECUCIÓN que esté a tu cargo.');
    const validItems = items.filter(i => i.name.trim() && Number(i.requestedQuantity) > 0);
    if (!validItems.length) return setError('Incluye al menos un material con cantidad válida.');

    setSaving(true);
    setError(null);
    try {
      const remoteItems: MaterialRequestItem[] = validItems.map((item, index) => ({
        id: `${Date.now()}-${index}`,
        name: item.name.trim(),
        requestedQuantity: Number(item.requestedQuantity),
        unit: item.unit,
        technicalSpecification: item.technicalSpecification.trim(),
      }));
      await createRemoteMaterialRequest({
        caseId: front.caseId,
        caseCode: front.caseCode,
        workFrontId: front.id,
        workFrontCode: front.frontCode,
        requestedBy: profile?.full_name || user?.email || 'Profesional SIPRE',
        requiredDate: requiredDate || undefined,
        urgency,
        justification,
        items: remoteItems,
        userId: user?.id,
        userRole: profile?.role,
      });
      setCreateOpen(false);
      resetForm();
      setNotice('Solicitud de materiales guardada remotamente. El personal operativo ya puede verla y gestionarla.');
      await load();
      window.setTimeout(() => setNotice(null), 5000);
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar la solicitud de materiales.');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (request: RemoteMaterialRequest, status: MaterialRequestStatus) => {
    if (!operative) return;
    setBusyId(request.id);
    setError(null);
    try {
      await updateRemoteMaterialRequestStatus({
        requestId: request.id,
        workFrontId: request.workFrontId,
        caseId: request.caseId,
        status,
        userId: user?.id,
        userName: profile?.full_name || user?.email || 'Operativo SIPRE',
        userRole: profile?.role,
      });
      await load();
    } catch (e: any) {
      setError(e?.message || 'No se pudo actualizar el estado de materiales.');
    } finally {
      setBusyId(null);
    }
  };

  const addRow = () => setItems([...items, { name: '', requestedQuantity: 1, unit: 'un', technicalSpecification: '' }]);
  const updateRow = (index: number, field: string, value: any) => setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  const removeRow = (index: number) => items.length > 1 && setItems(items.filter((_, i) => i !== index));

  return (
    <div id="sipre-materials-screen" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div><div className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">Materiales Remotos</div><h1 className="text-2xl font-black text-white flex items-center gap-2 mt-1"><Boxes className="w-6 h-6 text-cyan-400" />Solicitudes de materiales</h1><p className="text-xs text-slate-400 mt-1">El profesional solicita desde un frente EN EJECUCIÓN; el personal operativo gestiona el suministro y todos los usuarios ven los cambios remotamente.</p></div>
        <div className="flex flex-wrap gap-2">{professional && <button onClick={() => setCreateOpen(true)} disabled={!eligibleFronts.length} className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"><PlusCircle className="w-4 h-4" />Solicitar materiales</button>}<button onClick={onNavigateToDeliveries} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200">Entregas</button><button onClick={load} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1"><RefreshCw className="w-4 h-4" />Actualizar</button></div>
      </div>

      {notice && <div className="bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-xl p-3 text-xs font-bold">{notice}</div>}
      {error && <div className="bg-red-950 border border-red-800 text-red-300 rounded-xl p-3 text-xs flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><div className="relative"><Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por código, frente, profesional o material..." className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white" /></div></div>

      {loading ? <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Cargando solicitudes remotas...</div> : filtered.length ? <div className="space-y-3">{filtered.map(request => <article key={request.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg text-xs space-y-3"><div className="flex flex-col md:flex-row md:items-start justify-between gap-3"><div><div className="font-mono font-black text-cyan-500">{request.requestCode}</div><div className="font-black text-white text-base mt-1">{request.workFrontCode || request.workFrontId}</div><div className="text-slate-400 mt-1 flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" />Solicita: {request.requestedBy}</div></div><div className="flex items-center gap-2"><span className="px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold">{request.status}</span>{busyId === request.id && <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />}</div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{request.items.map(item => <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3"><div className="font-bold text-slate-200">{item.name || item.materialName}</div><div className="text-slate-500 mt-0.5">{item.requestedQuantity || item.quantity} {item.unit}</div>{item.technicalSpecification && <div className="text-slate-400 mt-1">{item.technicalSpecification}</div>}</div>)}</div>{request.justification && <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-400"><strong className="text-slate-500">Justificación: </strong>{request.justification}</div>}<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800 pt-3"><div className="text-slate-500">Solicitud: {request.requestDate}{request.requiredDate ? ` · Requerido: ${request.requiredDate}` : ''} · Urgencia: {request.urgency}</div>{operative ? <select disabled={busyId === request.id} value={request.status} onChange={e => changeStatus(request, e.target.value as MaterialRequestStatus)} className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">{statusOptions.map(status => <option key={status} value={status}>{status}</option>)}</select> : <span className="text-[10px] text-slate-500">Seguimiento en modo lectura</span>}</div></article>)}</div> : <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center"><Boxes className="w-8 h-8 text-slate-600 mx-auto mb-2" /><h3 className="font-bold text-white">No hay solicitudes remotas registradas</h3><p className="text-xs text-slate-400 mt-1">Cuando un profesional active un frente podrá generar la primera solicitud desde aquí.</p></div>}

      {createOpen && <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"><form onSubmit={createRequest} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-6"><div className="flex items-start justify-between border-b border-slate-800 pb-3"><div><h2 className="font-black text-white flex items-center gap-2"><Wrench className="w-4 h-4 text-cyan-400" />Nueva solicitud de materiales</h2><p className="text-xs text-slate-400 mt-1">Solo para un frente activo a tu cargo.</p></div><button type="button" onClick={() => setCreateOpen(false)} className="p-2 rounded-lg bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button></div>
        <div><label className="block text-xs font-bold text-slate-400 mb-1">Frente de obra *</label><select required value={frontId} onChange={e => setFrontId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"><option value="">Seleccione frente...</option>{eligibleFronts.map(front => <option key={front.id} value={front.id}>{front.frontCode} · {front.clientName}</option>)}</select></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label className="block text-xs font-bold text-slate-400 mb-1">Urgencia</label><select value={urgency} onChange={e => setUrgency(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"><option>Baja</option><option>Media</option><option>Alta</option><option>Urgente</option></select></div><div><label className="block text-xs font-bold text-slate-400 mb-1">Fecha requerida</label><input type="date" value={requiredDate} onChange={e => setRequiredDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" /></div></div>
        <div><label className="block text-xs font-bold text-slate-400 mb-1">Justificación / actividad asociada</label><textarea rows={2} value={justification} onChange={e => setJustification(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" /></div>
        <div className="space-y-2"><div className="flex items-center justify-between"><label className="text-xs font-bold text-slate-400">Materiales *</label><button type="button" onClick={addRow} className="text-xs font-bold text-cyan-500">+ Agregar ítem</button></div>{items.map((item, index) => <div key={index} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_2fr_auto] gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3"><input required placeholder="Material" value={item.name} onChange={e => updateRow(index, 'name', e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white" /><input type="number" min="0.01" step="any" value={item.requestedQuantity} onChange={e => updateRow(index, 'requestedQuantity', Number(e.target.value))} className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white" /><input placeholder="Unidad" value={item.unit} onChange={e => updateRow(index, 'unit', e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white" /><input placeholder="Especificación" value={item.technicalSpecification} onChange={e => updateRow(index, 'technicalSpecification', e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white" /><button type="button" onClick={() => removeRow(index)} className="p-2 text-red-500"><X className="w-4 h-4" /></button></div>)}</div>
        <div className="flex justify-end gap-2 border-t border-slate-800 pt-3"><button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">Cancelar</button><button disabled={saving} className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold flex items-center gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}Enviar solicitud remota</button></div>
      </form></div>}
    </div>
  );
};
