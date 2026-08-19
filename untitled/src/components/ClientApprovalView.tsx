import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle, RefreshCw, Loader2, Wrench, UserCheck, MapPin, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isCoordinator } from '../lib/roles';
import { VisitRecord, WorkFrontRecord } from '../types';
import { getVisitsFromDb } from '../lib/remoteCore';
import { createWorkFrontFromVisitInDb, getWorkFrontsFromDb } from '../lib/workFrontRemote';
import { getSupabaseClient } from '../lib/supabaseClient';
import {
  getClientApprovalsRemote,
  getTechnicalDecisionsRemote,
  RemoteClientApproval,
  RemoteTechnicalDecision,
  saveClientApprovalRemote,
  subscribeWorkflowRemote,
} from '../lib/workflowRemote';

interface ClientApprovalViewProps {
  onBackToDashboard?: () => void;
}

const upper = (value?: string) => String(value || '').trim().toUpperCase();

export const ClientApprovalView: React.FC<ClientApprovalViewProps> = ({ onBackToDashboard }) => {
  const { user, profile } = useAuth();
  const [decisions, setDecisions] = useState<RemoteTechnicalDecision[]>([]);
  const [approvals, setApprovals] = useState<RemoteClientApproval[]>([]);
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [fronts, setFronts] = useState<WorkFrontRecord[]>([]);
  const [selected, setSelected] = useState<RemoteTechnicalDecision | null>(null);
  const [status, setStatus] = useState('Pendiente');
  const [representative, setRepresentative] = useState('');
  const [observations, setObservations] = useState('');
  const [decisionDate, setDecisionDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canManage = isCoordinator(profile?.role);

  const load = async () => {
    setLoading(true);
    try {
      const [decisionRows, approvalRows, visitRows, frontRows] = await Promise.all([
        getTechnicalDecisionsRemote(),
        getClientApprovalsRemote(),
        getVisitsFromDb(),
        getWorkFrontsFromDb().catch(() => []),
      ]);
      setDecisions(decisionRows.filter(d => upper(d.decision) === 'REQUIERE INTERVENCIÓN'));
      setApprovals(approvalRows);
      setVisits(visitRows);
      setFronts(frontRows);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'No se pudo cargar la aprobación de intervenciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsub = subscribeWorkflowRemote(load);
    const timer = window.setInterval(load, 8000);
    return () => { unsub(); window.clearInterval(timer); };
  }, []);

  const latestApproval = useMemo(() => {
    const map = new Map<string, RemoteClientApproval>();
    approvals.forEach(a => { if (!map.has(a.decisionId)) map.set(a.decisionId, a); });
    return map;
  }, [approvals]);

  const pending = useMemo(() => decisions.filter(d => !latestApproval.has(d.id) || upper(latestApproval.get(d.id)?.status) === 'PENDIENTE'), [decisions, latestApproval]);
  const approved = useMemo(() => decisions.filter(d => ['APROBADO', 'APROBADO CON OBSERVACIONES'].includes(upper(latestApproval.get(d.id)?.status))), [decisions, latestApproval]);
  const rejected = useMemo(() => decisions.filter(d => upper(latestApproval.get(d.id)?.status) === 'NO APROBADO'), [decisions, latestApproval]);

  const openDecision = (decision: RemoteTechnicalDecision) => {
    setSelected(decision);
    const existing = latestApproval.get(decision.id);
    setStatus(existing?.status || 'Pendiente');
    setRepresentative(existing?.clientRepresentativeName || '');
    setObservations(existing?.observations || '');
    setDecisionDate(existing?.date || new Date().toISOString().slice(0, 10));
    setError(null);
  };

  useEffect(() => {
    if (loading || selected) return;
    const requested = sessionStorage.getItem('sipre_selected_approval_decision');
    if (!requested) return;
    const decision = decisions.find(d => d.id === requested);
    if (decision) openDecision(decision);
    sessionStorage.removeItem('sipre_selected_approval_decision');
  }, [loading, decisions.length]);

  const saveApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !canManage) return;
    if (!representative.trim()) return setError('Ingresa el nombre del representante del cliente.');
    const visit = visits.find(v => v.id === selected.visitId);
    if (!visit) return setError('No se encontró la visita relacionada con este concepto.');

    setSaving(true);
    setError(null);
    try {
      await saveClientApprovalRemote({
        decisionId: selected.id,
        caseId: selected.caseId,
        visitId: selected.visitId,
        status,
        clientRepresentativeName: representative,
        observations,
        date: decisionDate,
        userId: user?.id,
        userName: profile?.full_name || user?.email || 'Coordinación SIPRE',
        userRole: profile?.role,
      });

      let front = fronts.find(f => f.visitId === selected.visitId);
      if (['APROBADO', 'APROBADO CON OBSERVACIONES'].includes(upper(status))) {
        if (!front) {
          front = await createWorkFrontFromVisitInDb({
            caseId: selected.caseId,
            caseCode: visit.caseCode,
            visitId: selected.visitId,
            clientName: visit.clientName,
            propertyAddress: visit.address,
            repairScope: selected.proposedIntervention || selected.technicalJustification,
            responsibleTechnicalProfessional: visit.responsibleProfessional,
          });
        }

        const client = getSupabaseClient();
        if (client && selected.caseId) {
          await client.from('cases').update({ status: 'MATERIALS', updated_at: new Date().toISOString() }).eq('id', selected.caseId);
        }
        setNotice(`Aprobación registrada. ${front ? `Frente ${front.frontCode} creado/enlazado en estado PENDIENTE. ` : ''}El profesional responsable debe activarlo cuando inicien las actividades.`);
      } else if (upper(status) === 'NO APROBADO') {
        setNotice('Decisión del cliente registrada como NO APROBADO. No se creó frente de obra.');
      } else {
        setNotice('Aprobación guardada en estado pendiente.');
      }

      setSelected(null);
      await load();
      window.setTimeout(() => setNotice(null), 6500);
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar la decisión del cliente.');
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = [
    { value: 'Pendiente', label: 'Pendiente', icon: Clock },
    { value: 'Aprobado', label: 'Aprobado', icon: CheckCircle2 },
    { value: 'Aprobado con observaciones', label: 'Aprobado con observaciones', icon: AlertTriangle },
    { value: 'No aprobado', label: 'No aprobado', icon: XCircle },
  ];

  const card = (decision: RemoteTechnicalDecision) => {
    const visit = visits.find(v => v.id === decision.visitId);
    const approval = latestApproval.get(decision.id);
    const front = fronts.find(f => f.visitId === decision.visitId);
    return <article key={decision.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-3">
      <div className="flex items-start justify-between gap-3"><div><div className="font-black text-white text-base">{visit?.clientName || visit?.address || decision.caseId}</div><div className="text-slate-400 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{visit?.address || ''}</div></div><span className="px-2.5 py-1 rounded-full border bg-amber-950 border-amber-800 text-amber-300 font-bold">{approval?.status || 'Pendiente'}</span></div>
      <div><div className="text-[10px] font-bold uppercase text-slate-500">Concepto profesional</div><p className="text-slate-300 mt-1">{decision.technicalJustification}</p></div>
      {decision.proposedIntervention && <div><div className="text-[10px] font-bold uppercase text-slate-500">Intervención propuesta</div><p className="text-slate-300 mt-1">{decision.proposedIntervention}</p></div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><div className="bg-slate-900 border border-slate-800 rounded-lg p-2"><span className="text-slate-500">Profesional técnico</span><div className="font-bold text-slate-200 mt-0.5">{decision.responsibleProfessional || visit?.responsibleProfessional}</div></div><div className="bg-slate-900 border border-slate-800 rounded-lg p-2"><span className="text-slate-500">Frente de obra</span><div className="font-bold text-slate-200 mt-0.5">{front ? `${front.frontCode} · ${front.status}` : 'Aún no creado'}</div></div></div>
      <div className="flex justify-end border-t border-slate-800 pt-3">{canManage ? <button onClick={() => openDecision(decision)} className="px-3 py-2 rounded-lg bg-cyan-600 text-white font-bold">{approval ? 'Actualizar aprobación' : 'Registrar aprobación'}</button> : <span className="text-[10px] text-slate-500">Modo seguimiento</span>}</div>
    </article>;
  };

  return (
    <div id="sipre-client-approval-screen" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><div className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">Aprobación de Intervenciones</div><h1 className="text-2xl font-black text-white flex items-center gap-2 mt-1"><CheckCircle2 className="w-6 h-6 text-cyan-400" />Propuestas y decisiones del cliente</h1><p className="text-xs text-slate-400 mt-1">Una aprobación positiva crea o enlaza el frente de obra en PENDIENTE; el profesional lo activa al iniciar trabajos.</p></div><button onClick={load} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1"><RefreshCw className="w-4 h-4" />Actualizar</button></div>

      {notice && <div className="bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-xl p-3 text-xs font-bold">{notice}</div>}
      {error && <div className="bg-red-950 border border-red-800 text-red-300 rounded-xl p-3 text-xs">{error}</div>}

      {loading ? <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Cargando aprobaciones...</div> : <>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-xs text-slate-500">Pendientes</div><div className="text-2xl font-black text-amber-600">{pending.length}</div></div><div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-xs text-slate-500">Aprobados</div><div className="text-2xl font-black text-emerald-600">{approved.length}</div></div><div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-xs text-slate-500">No aprobados</div><div className="text-2xl font-black text-red-600">{rejected.length}</div></div></div>
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"><div className="border-b border-slate-800 pb-3"><h2 className="font-black text-white">Consolidado de propuestas de intervención</h2><p className="text-xs text-slate-400">Todos los conceptos que requieren intervención y su estado de aprobación.</p></div>{decisions.length ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">{decisions.map(card)}</div> : <div className="text-xs text-slate-500 text-center py-6">No hay conceptos que requieran intervención.</div>}</section>
      </>}

      {selected && <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"><form onSubmit={saveApproval} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-6"><div className="flex items-start justify-between border-b border-slate-800 pb-3"><div><h2 className="font-black text-white">Registrar decisión del cliente</h2><p className="text-xs text-slate-400 mt-1">{visits.find(v => v.id === selected.visitId)?.clientName || selected.caseId}</p></div><button type="button" onClick={() => setSelected(null)} className="p-2 rounded-lg bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button></div>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs"><div className="font-bold text-slate-500 uppercase text-[10px]">Intervención presentada</div><p className="text-slate-300 mt-1">{selected.proposedIntervention || selected.technicalJustification}</p></div>
        <div><label className="block text-xs font-bold text-slate-400 mb-2">Estado *</label><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{statusOptions.map(opt => { const Icon = opt.icon; return <button key={opt.value} type="button" onClick={() => setStatus(opt.value)} className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${status === opt.value ? 'bg-cyan-950 border-cyan-600 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}><Icon className="w-4 h-4" />{opt.label}</button>; })}</div></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label className="block text-xs font-bold text-slate-400 mb-1">Representante del cliente *</label><input required value={representative} onChange={e => setRepresentative(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" /></div><div><label className="block text-xs font-bold text-slate-400 mb-1">Fecha</label><input type="date" value={decisionDate} onChange={e => setDecisionDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" /></div></div>
        <div><label className="block text-xs font-bold text-slate-400 mb-1">Observaciones / condiciones</label><textarea rows={4} value={observations} onChange={e => setObservations(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" /></div>
        <div className="flex justify-end gap-2 border-t border-slate-800 pt-3"><button type="button" onClick={() => setSelected(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">Cancelar</button><button disabled={saving} className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold flex items-center gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}Guardar decisión</button></div>
      </form></div>}
    </div>
  );
};
