import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Eye, FileText, Loader2, MapPin, Pencil, RefreshCw, Trash2, UserCheck, X } from 'lucide-react';
import { VisitRecord, WorkFrontRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { isCoordinator, isManagement, isProfessional } from '../lib/roles';
import { getVisitsFromDb } from '../lib/remoteCore';
import { getSupabaseClient } from '../lib/supabaseClient';
import { getWorkFrontsFromDb } from '../lib/workFrontRemote';
import {
  getClientApprovalsRemote,
  getTechnicalDecisionsRemote,
  RemoteClientApproval,
  RemoteTechnicalDecision,
  saveTechnicalDecisionRemote,
  subscribeWorkflowRemote,
} from '../lib/workflowRemote';
import { deleteTechnicalDecisionTestFlow, updateTechnicalDecisionRemote } from '../lib/workflowCrudRemote';
import { deleteVisitTestRemote } from '../lib/visitCleanupRemote';

interface TechnicalReviewViewProps {
  onNavigateToClientApproval?: () => void;
}

const upper = (value?: string) => String(value || '').trim().toUpperCase();
const prettyDate = (value?: string) => value ? new Date(value).toLocaleString('es-CO') : '';

export const TechnicalReviewView: React.FC<TechnicalReviewViewProps> = ({ onNavigateToClientApproval }) => {
  const { user, profile } = useAuth();
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [decisions, setDecisions] = useState<RemoteTechnicalDecision[]>([]);
  const [approvals, setApprovals] = useState<RemoteClientApproval[]>([]);
  const [fronts, setFronts] = useState<WorkFrontRecord[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<VisitRecord | null>(null);
  const [editingDecision, setEditingDecision] = useState<RemoteTechnicalDecision | null>(null);
  const [editingPendingVisit, setEditingPendingVisit] = useState<VisitRecord | null>(null);
  const [visitEdit, setVisitEdit] = useState({ clientName: '', address: '', municipality: '', neighborhood: '', visitObjective: '' });
  const [selectedDecision, setSelectedDecision] = useState('');
  const [formData, setFormData] = useState({ technicalJustification: '', proposedIntervention: '', temporaryMeasures: '', additionalStudies: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const professional = isProfessional(profile?.role);
  const adminCleanup = isCoordinator(profile?.role) || isManagement(profile?.role);
  const myName = (profile?.full_name || '').trim().toLowerCase();

  const assignedToMe = (visit: VisitRecord) => {
    const assignedId = (visit as any).responsibleProfessionalId || '';
    const assignedName = (visit.responsibleProfessional || '').trim().toLowerCase();
    return Boolean((user?.id && assignedId === user.id) || (myName && assignedName === myName));
  };

  const canManageVisit = (visit: VisitRecord) => adminCleanup || (professional && assignedToMe(visit));

  const load = async () => {
    setLoading(true);
    try {
      const [visitRows, decisionRows, approvalRows, frontRows] = await Promise.all([
        getVisitsFromDb(),
        getTechnicalDecisionsRemote(),
        getClientApprovalsRemote().catch(() => []),
        getWorkFrontsFromDb().catch(() => []),
      ]);
      setVisits(visitRows);
      setDecisions(decisionRows);
      setApprovals(approvalRows);
      setFronts(frontRows);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'No se pudo cargar la bandeja de conceptos técnicos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsubscribe = subscribeWorkflowRemote(load);
    const timer = window.setInterval(load, 8000);
    return () => { unsubscribe(); window.clearInterval(timer); };
  }, [user?.id, profile?.full_name, profile?.role]);

  const visibleVisits = useMemo(() => professional ? visits.filter(assignedToMe) : visits, [visits, professional, user?.id, myName]);
  const decisionVisitIds = useMemo(() => new Set(decisions.map(d => d.visitId).filter(Boolean)), [decisions]);
  const pending = useMemo(() => visibleVisits.filter(v => upper(v.status) === 'TERMINADA' && !decisionVisitIds.has(v.id)), [visibleVisits, decisionVisitIds]);

  const latestApprovalByDecision = useMemo(() => {
    const map = new Map<string, RemoteClientApproval>();
    approvals.forEach(a => { if (!map.has(a.decisionId)) map.set(a.decisionId, a); });
    return map;
  }, [approvals]);

  const visibleDecisions = useMemo(() => {
    const visitIds = new Set(visibleVisits.map(v => v.id));
    return professional ? decisions.filter(d => !!d.visitId && visitIds.has(d.visitId)) : decisions;
  }, [decisions, visibleVisits, professional]);

  const resetConceptForm = () => {
    setSelectedVisit(null);
    setEditingDecision(null);
    setSelectedDecision('');
    setFormData({ technicalJustification: '', proposedIntervention: '', temporaryMeasures: '', additionalStudies: '' });
  };

  const openForm = async (visit: VisitRecord) => {
    if (!professional || !assignedToMe(visit)) return;
    setEditingDecision(null);
    setSelectedVisit(visit);
    setSelectedDecision('');
    setFormData({ technicalJustification: '', proposedIntervention: '', temporaryMeasures: '', additionalStudies: '' });
    setError(null);
    const client = getSupabaseClient();
    if (client) {
      const { data } = await client.from('visit_assessments').select('*').eq('visit_id', visit.id).maybeSingle();
      if (data) {
        setFormData({
          technicalJustification: data.professional_conclusion || data.main_findings_summary || '',
          proposedIntervention: '',
          temporaryMeasures: data.temporary_measures || '',
          additionalStudies: data.additional_studies || '',
        });
      }
    }
  };

  const beginEdit = (decision: RemoteTechnicalDecision) => {
    const visit = visits.find(v => v.id === decision.visitId);
    if (!visit || !canManageVisit(visit)) return;
    setEditingDecision(decision);
    setSelectedVisit(visit);
    setSelectedDecision(decision.decision);
    setFormData({
      technicalJustification: decision.technicalJustification || '',
      proposedIntervention: decision.proposedIntervention || '',
      temporaryMeasures: decision.temporaryMeasures || '',
      additionalStudies: decision.additionalStudies || '',
    });
    setError(null);
  };

  const beginPendingVisitEdit = (visit: VisitRecord) => {
    if (!canManageVisit(visit)) return;
    setEditingPendingVisit(visit);
    setVisitEdit({
      clientName: visit.clientName || '',
      address: visit.address || '',
      municipality: visit.municipality || '',
      neighborhood: visit.neighborhood || '',
      visitObjective: visit.visitObjective || visit.visitReason || '',
    });
    setError(null);
  };

  const savePendingVisit = async () => {
    if (!editingPendingVisit || !canManageVisit(editingPendingVisit)) return;
    const client = getSupabaseClient();
    if (!client) return setError('Supabase no está configurado.');
    if (!visitEdit.clientName.trim() || !visitEdit.address.trim() || !visitEdit.municipality.trim()) {
      return setError('Completa cliente/predio, dirección y municipio.');
    }

    setSaving(true);
    setError(null);
    try {
      const { error: updateError } = await client.from('visits').update({
        client_name: visitEdit.clientName.trim(),
        address: visitEdit.address.trim(),
        municipality: visitEdit.municipality.trim(),
        neighborhood: visitEdit.neighborhood.trim(),
        visit_objective: visitEdit.visitObjective.trim(),
        objective: visitEdit.visitObjective.trim(),
        updated_at: new Date().toISOString(),
      }).eq('id', editingPendingVisit.id);
      if (updateError) throw new Error(updateError.message);
      setEditingPendingVisit(null);
      setNotice('Datos de la visita actualizados correctamente.');
      await load();
      window.setTimeout(() => setNotice(null), 4000);
    } catch (e: any) {
      setError(e?.message || 'No se pudo editar la visita.');
    } finally {
      setSaving(false);
    }
  };

  const deletePendingVisit = async (visit: VisitRecord) => {
    if (!canManageVisit(visit)) return;
    const ok = window.confirm(`¿Eliminar la visita de prueba "${visit.clientName || visit.address}"?\n\nSi contiene información técnica real, el sistema impedirá que un profesional la borre accidentalmente.`);
    if (!ok) return;
    setBusyId(visit.id);
    setError(null);
    try {
      await deleteVisitTestRemote(visit.id);
      setNotice('Visita/prueba eliminada correctamente.');
      await load();
      window.setTimeout(() => setNotice(null), 4000);
    } catch (e: any) {
      setError(e?.message || 'No se pudo eliminar la visita de prueba.');
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    if (loading || selectedVisit || !professional) return;
    const requested = sessionStorage.getItem('sipre_selected_review_visit');
    if (!requested) return;
    const visit = pending.find(v => v.id === requested);
    if (visit) openForm(visit);
    sessionStorage.removeItem('sipre_selected_review_visit');
  }, [loading, pending.length, professional]);

  const emitConcept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit || !canManageVisit(selectedVisit)) return;
    if (!selectedDecision) return setError('Selecciona la decisión técnica principal.');
    if (!formData.technicalJustification.trim()) return setError('Escribe la justificación técnica del concepto.');
    if (selectedDecision === 'REQUIERE INTERVENCIÓN' && !formData.proposedIntervention.trim()) {
      return setError('Para una intervención debes indicar el alcance técnico propuesto.');
    }
    if (!selectedVisit.caseId) return setError('La visita no tiene un expediente vinculado.');

    setSaving(true);
    setError(null);
    try {
      if (editingDecision) {
        await updateTechnicalDecisionRemote({
          id: editingDecision.id,
          decision: selectedDecision,
          technicalJustification: formData.technicalJustification,
          proposedIntervention: formData.proposedIntervention,
          temporaryMeasures: formData.temporaryMeasures,
          additionalStudies: formData.additionalStudies,
        });
        setNotice('Concepto editado correctamente en Supabase.');
      } else {
        await saveTechnicalDecisionRemote({
          caseId: selectedVisit.caseId,
          visitId: selectedVisit.id,
          decision: selectedDecision,
          technicalJustification: formData.technicalJustification,
          proposedIntervention: formData.proposedIntervention,
          temporaryMeasures: formData.temporaryMeasures,
          additionalStudies: formData.additionalStudies,
          responsibleProfessional: profile?.full_name || selectedVisit.responsibleProfessional,
          userId: user?.id,
        });
        setNotice(selectedDecision === 'REQUIERE INTERVENCIÓN' ? 'Concepto guardado. El caso pasó a aprobación.' : 'Concepto guardado y retirado de pendientes.');
      }
      resetConceptForm();
      await load();
      window.setTimeout(() => setNotice(null), 5000);
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar el concepto técnico.');
    } finally {
      setSaving(false);
    }
  };

  const deleteConcept = async (decision: RemoteTechnicalDecision) => {
    const visit = visits.find(v => v.id === decision.visitId);
    if (!visit || !canManageVisit(visit)) return;
    const ok = window.confirm('¿Eliminar este concepto y reiniciar su flujo de prueba?\n\nTambién se intentará borrar la aprobación y el frente derivado asociados a esta visita.');
    if (!ok) return;
    setBusyId(decision.id);
    setError(null);
    try {
      await deleteTechnicalDecisionTestFlow({ id: decision.id, visitId: decision.visitId, caseId: decision.caseId });
      setNotice('Concepto de prueba eliminado. La visita vuelve a quedar disponible para emitir un concepto nuevo.');
      await load();
      window.setTimeout(() => setNotice(null), 5000);
    } catch (e: any) {
      setError(e?.message || 'No se pudo borrar la prueba.');
    } finally {
      setBusyId(null);
    }
  };

  const goApproval = (decision: RemoteTechnicalDecision) => {
    sessionStorage.setItem('sipre_selected_approval_decision', decision.id);
    onNavigateToClientApproval?.();
  };

  const decisionOptions = ['NO REQUIERE INTERVENCIÓN', 'REQUIERE INTERVENCIÓN', 'REQUIERE EVALUACIÓN ADICIONAL', 'REQUIERE ENSAYOS'];

  return (
    <div id="sipre-technical-review-screen" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">Conceptos Técnicos</div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 mt-1"><FileText className="w-6 h-6 text-cyan-400" />Bandeja e informe consolidado de conceptos</h1>
          <p className="text-xs text-slate-400 mt-1">Los pendientes y conceptos emitidos ahora permiten corregir datos y eliminar registros de prueba.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-2 rounded-xl bg-amber-950 border border-amber-800 text-amber-300 text-xs font-bold">{pending.length} pendiente(s)</span>
          <button onClick={load} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1"><RefreshCw className="w-4 h-4" />Actualizar</button>
        </div>
      </div>

      {notice && <div className="bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-xl p-3 text-xs font-bold">{notice}</div>}
      {error && <div className="bg-red-950 border border-red-800 text-red-300 rounded-xl p-3 text-xs">{error}</div>}

      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Cargando conceptos...</div>
      ) : (
        <>
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div><h2 className="font-black text-white">Pendientes de concepto</h2><p className="text-xs text-slate-400">Visitas terminadas sin concepto emitido. Puedes editar sus datos o borrar una prueba antes de continuar.</p></div>
              <span className="font-mono text-amber-500 text-sm">{pending.length}</span>
            </div>
            {pending.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pending.map(v => {
                  const canManage = canManageVisit(v);
                  return (
                    <div key={v.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-3">
                      <div><div className="font-black text-white">{v.clientName}</div><div className="text-slate-400 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{v.address}, {v.municipality}</div><div className="text-slate-500 mt-1"><UserCheck className="w-3.5 h-3.5 inline mr-1" />{v.responsibleProfessional}</div></div>
                      <div className="flex flex-wrap gap-2 border-t border-slate-800 pt-3">
                        {professional && assignedToMe(v) && <button onClick={() => openForm(v)} className="px-3 py-2 rounded-lg bg-amber-600 text-white font-bold">Emitir concepto</button>}
                        {canManage && <button onClick={() => beginPendingVisitEdit(v)} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-bold flex items-center gap-1"><Pencil className="w-3.5 h-3.5" />Editar datos</button>}
                        {canManage && <button disabled={busyId === v.id} onClick={() => deletePendingVisit(v)} className="px-3 py-2 rounded-lg bg-red-950 border border-red-800 text-red-300 font-bold flex items-center gap-1">{busyId === v.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}Borrar prueba</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <div className="text-xs text-slate-500 py-5 text-center">No hay visitas pendientes para este usuario.</div>}
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3"><div><h2 className="font-black text-white">Resumen de conceptos emitidos</h2><p className="text-xs text-slate-400">Consolidado remoto con edición y borrado de concepto de prueba.</p></div><span className="font-mono text-cyan-500 text-sm">{visibleDecisions.length}</span></div>
            {visibleDecisions.length ? (
              <div className="space-y-3">
                {visibleDecisions.map(d => {
                  const visit = visits.find(v => v.id === d.visitId);
                  const approval = latestApprovalByDecision.get(d.id);
                  const front = fronts.find(f => f.visitId === d.visitId);
                  const intervention = upper(d.decision) === 'REQUIERE INTERVENCIÓN';
                  const canEditDelete = !!visit && canManageVisit(visit);
                  return (
                    <article key={d.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-3">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3"><div><div className="text-base font-black text-white">{visit?.clientName || visit?.address || d.caseId}</div><div className="text-slate-400 mt-1">{visit?.address || ''}</div></div><span className={`px-2.5 py-1 rounded-full font-bold border ${intervention ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-emerald-950 text-emerald-300 border-emerald-800'}`}>{d.decision}</span></div>
                      <div><div className="text-[10px] font-bold text-slate-500 uppercase">Justificación técnica</div><p className="text-slate-300 mt-1 whitespace-pre-wrap">{d.technicalJustification}</p></div>
                      {d.proposedIntervention && <div><div className="text-[10px] font-bold text-slate-500 uppercase">Intervención propuesta</div><p className="text-slate-300 mt-1 whitespace-pre-wrap">{d.proposedIntervention}</p></div>}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2"><div className="bg-slate-900 rounded-lg border border-slate-800 p-2"><span className="text-slate-500">Profesional</span><div className="font-bold text-slate-200 mt-0.5">{d.responsibleProfessional || visit?.responsibleProfessional}</div></div><div className="bg-slate-900 rounded-lg border border-slate-800 p-2"><span className="text-slate-500">Aprobación</span><div className="font-bold text-slate-200 mt-0.5">{intervention ? (approval?.status || 'Pendiente') : 'No aplica'}</div></div><div className="bg-slate-900 rounded-lg border border-slate-800 p-2"><span className="text-slate-500">Frente</span><div className="font-bold text-slate-200 mt-0.5">{front ? `${front.frontCode} · ${front.status}` : (intervention ? 'Aún no creado' : 'No aplica')}</div></div></div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3"><span className="text-[10px] text-slate-500">Emitido: {prettyDate(d.date)}</span><div className="flex flex-wrap gap-2">{intervention && <button onClick={() => goApproval(d)} className="px-3 py-2 rounded-lg bg-cyan-600 text-white font-bold flex items-center gap-1"><Eye className="w-3.5 h-3.5" />Aprobación</button>}{canEditDelete && <button onClick={() => beginEdit(d)} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-bold flex items-center gap-1"><Pencil className="w-3.5 h-3.5" />Editar</button>}{canEditDelete && <button disabled={busyId === d.id} onClick={() => deleteConcept(d)} className="px-3 py-2 rounded-lg bg-red-950 border border-red-800 text-red-300 font-bold flex items-center gap-1">{busyId === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}Borrar prueba</button>}</div></div>
                    </article>
                  );
                })}
              </div>
            ) : <div className="text-xs text-slate-500 py-5 text-center">Aún no hay conceptos técnicos guardados.</div>}
          </section>
        </>
      )}

      {editingPendingVisit && (
        <div className="fixed inset-0 z-[75] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-6">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3"><div><h2 className="font-black text-white">Editar datos de la visita</h2><p className="text-xs text-slate-400 mt-1">Esta edición no borra el informe ni las evidencias existentes.</p></div><button onClick={() => setEditingPendingVisit(null)} className="p-2 rounded-lg bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs"><div className="sm:col-span-2"><label className="block font-bold text-slate-400 mb-1">Cliente / predio</label><input value={visitEdit.clientName} onChange={e => setVisitEdit({ ...visitEdit, clientName: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" /></div><div className="sm:col-span-2"><label className="block font-bold text-slate-400 mb-1">Dirección</label><input value={visitEdit.address} onChange={e => setVisitEdit({ ...visitEdit, address: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" /></div><div><label className="block font-bold text-slate-400 mb-1">Municipio</label><input value={visitEdit.municipality} onChange={e => setVisitEdit({ ...visitEdit, municipality: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" /></div><div><label className="block font-bold text-slate-400 mb-1">Barrio / sector</label><input value={visitEdit.neighborhood} onChange={e => setVisitEdit({ ...visitEdit, neighborhood: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" /></div><div className="sm:col-span-2"><label className="block font-bold text-slate-400 mb-1">Objetivo</label><textarea rows={3} value={visitEdit.visitObjective} onChange={e => setVisitEdit({ ...visitEdit, visitObjective: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" /></div></div>
            <div className="flex justify-end gap-2 border-t border-slate-800 pt-3"><button onClick={() => setEditingPendingVisit(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">Cancelar</button><button disabled={saving} onClick={savePendingVisit} className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold flex items-center gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}Guardar cambios</button></div>
          </div>
        </div>
      )}

      {selectedVisit && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={emitConcept} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-6">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3"><div><h2 className="font-black text-white">{editingDecision ? 'Editar concepto técnico' : 'Emitir concepto técnico'}</h2><p className="text-xs text-slate-400 mt-1">{selectedVisit.clientName} · {selectedVisit.address}</p></div><button type="button" onClick={resetConceptForm} className="p-2 rounded-lg bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button></div>
            <div><label className="block text-xs font-bold text-slate-400 mb-2">Decisión técnica *</label><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{decisionOptions.map(option => <button key={option} type="button" onClick={() => setSelectedDecision(option)} className={`p-3 rounded-xl border text-left text-xs font-bold ${selectedDecision === option ? 'bg-cyan-950 border-cyan-600 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>{option}</button>)}</div></div>
            <div><label className="block text-xs font-bold text-slate-400 mb-1">Justificación técnica *</label><textarea rows={5} value={formData.technicalJustification} onChange={e => setFormData({ ...formData, technicalJustification: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" required /></div>
            <div><label className="block text-xs font-bold text-slate-400 mb-1">Intervención propuesta / alcance</label><textarea rows={3} value={formData.proposedIntervention} onChange={e => setFormData({ ...formData, proposedIntervention: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label className="block text-xs font-bold text-slate-400 mb-1">Medidas temporales</label><textarea rows={3} value={formData.temporaryMeasures} onChange={e => setFormData({ ...formData, temporaryMeasures: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" /></div><div><label className="block text-xs font-bold text-slate-400 mb-1">Estudios / ensayos adicionales</label><textarea rows={3} value={formData.additionalStudies} onChange={e => setFormData({ ...formData, additionalStudies: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" /></div></div>
            <div className="flex justify-end gap-2 border-t border-slate-800 pt-3"><button type="button" onClick={resetConceptForm} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">Cancelar</button><button disabled={saving} className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold flex items-center gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}{editingDecision ? 'Guardar cambios' : 'Guardar y emitir concepto'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
};
