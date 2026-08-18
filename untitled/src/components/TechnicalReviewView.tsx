import React, { useState } from 'react';
import { FileText, CheckCircle2, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { RepairDecisionOption, TechnicalDecisionRecord, VisitRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { isProfessional } from '../lib/roles';
import { saveTechnicalDecisionInDb } from '../lib/supabaseService';

interface TechnicalReviewViewProps {
  visit?: VisitRecord;
  onNavigateToClientApproval?: () => void;
  onBackToDashboard?: () => void;
}

export const TechnicalReviewView: React.FC<TechnicalReviewViewProps> = ({
  visit,
  onNavigateToClientApproval,
  onBackToDashboard,
}) => {
  const { user, profile } = useAuth();
  const [selectedDecision, setSelectedDecision] = useState<RepairDecisionOption>('NO REQUIERE INTERVENCIÓN');
  const [formData, setFormData] = useState({
    technicalJustification: '',
    proposedIntervention: '',
    temporaryMeasures: '',
    additionalStudies: '',
    finalRecommendations: '',
    responsibleProfessional: profile?.full_name || visit?.responsibleProfessional || '',
    professionalLicense: profile?.professional_license || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userAllowed = isProfessional(profile?.role);

  const decisionOptions: { type: RepairDecisionOption; desc: string }[] = [
    { type: 'NO REQUIERE INTERVENCIÓN', desc: 'La visita puede cerrarse sin frente de reparación.' },
    { type: 'REQUIERE INTERVENCIÓN', desc: 'Se requiere reparación o intervención técnica.' },
    { type: 'REQUIERE EVALUACIÓN ADICIONAL', desc: 'Se requiere análisis estructural o evaluación especializada.' },
    { type: 'REQUIERE ENSAYOS', desc: 'Se requieren ensayos o verificaciones adicionales.' },
    { type: 'REQUIERE MONITOREO', desc: 'Se requiere seguimiento periódico.' },
    { type: 'INFORMACIÓN INSUFICIENTE', desc: 'No existe información suficiente para concluir.' },
  ];

  const handleSaveDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!userAllowed) return setError('Solo el profesional responsable puede emitir y finalizar el concepto técnico.');
    if (!visit?.id || !visit?.caseId) return setError('No se encontró la visita o el expediente asociado. Regresa a Mis Visitas y abre nuevamente la inspección.');
    if (!formData.technicalJustification.trim()) return setError('Ingresa la justificación técnica antes de finalizar el informe.');
    if (!formData.responsibleProfessional.trim()) return setError('Falta el nombre del profesional responsable.');

    setSaving(true);
    try {
      const decision: TechnicalDecisionRecord = {
        id: `TD-${visit.id}`,
        caseId: visit.caseId,
        visitId: visit.id,
        decision: selectedDecision,
        technicalJustification: formData.technicalJustification.trim(),
        proposedIntervention: formData.proposedIntervention.trim(),
        temporaryMeasures: formData.temporaryMeasures.trim(),
        additionalStudies: formData.additionalStudies.trim(),
        finalRecommendations: formData.finalRecommendations.trim(),
        responsibleProfessional: formData.responsibleProfessional.trim(),
        professionalLicense: formData.professionalLicense.trim(),
        date: new Date().toISOString(),
      };

      const ok = await saveTechnicalDecisionInDb(decision, user?.id);
      if (!ok) throw new Error('Supabase no confirmó el guardado del concepto técnico.');

      setMessage('Informe técnico finalizado y concepto profesional guardado en SIPRE.');

      setTimeout(() => {
        const needsClientApproval = selectedDecision === 'REQUIERE INTERVENCIÓN' || selectedDecision === 'REQUIERE REPARACIÓN';
        if (needsClientApproval && onNavigateToClientApproval) onNavigateToClientApproval();
        else if (onBackToDashboard) onBackToDashboard();
      }, 1200);
    } catch (e: any) {
      setError(e?.message || 'No se pudo finalizar el informe técnico.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="sipre-technical-review-screen" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">Cierre del Informe Profesional</div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2 mt-1"><FileText className="w-6 h-6 text-cyan-400" />Revisión Técnica y Concepto Final</h1>
            <p className="text-xs text-slate-400 mt-1">La visita ya fue terminada. Este paso guarda el concepto técnico final del profesional en Supabase.</p>
          </div>
          {onBackToDashboard && (
            <button onClick={onBackToDashboard} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1"><ArrowLeft className="w-4 h-4" />Volver</button>
          )}
        </div>

        {visit && (
          <div className="mt-4 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div><span className="text-slate-500">Cliente:</span> <strong className="text-white">{visit.clientName}</strong></div>
            <div><span className="text-slate-500">Visita:</span> <strong className="text-white">{visit.id}</strong></div>
            <div><span className="text-slate-500">Dirección:</span> <strong className="text-white">{visit.address}</strong></div>
            <div><span className="text-slate-500">Profesional:</span> <strong className="text-cyan-300">{visit.responsibleProfessional}</strong></div>
          </div>
        )}
      </div>

      {message && <div className="p-4 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-200 text-sm font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5" />{message}</div>}
      {error && <div className="p-4 rounded-xl bg-red-950 border border-red-800 text-red-200 text-sm flex items-center gap-2"><AlertTriangle className="w-5 h-5" />{error}</div>}

      <form onSubmit={handleSaveDecision} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 text-xs text-slate-200">
        <div>
          <label className="block text-slate-300 font-bold mb-2">Decisión técnica *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {decisionOptions.map(opt => (
              <button
                key={opt.type}
                type="button"
                onClick={() => setSelectedDecision(opt.type)}
                className={`p-3 rounded-xl border text-left ${selectedDecision === opt.type ? 'bg-cyan-950 border-cyan-500 text-cyan-200' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
              >
                <div className="font-black text-xs">{opt.type}</div>
                <div className="text-[10px] mt-1">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-bold mb-1">Justificación técnica *</label>
          <textarea rows={5} required value={formData.technicalJustification} onChange={e => setFormData({ ...formData, technicalJustification: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500" placeholder="Conclusión sustentada en los hallazgos de la visita..." />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-bold mb-1">Intervención propuesta</label>
            <textarea rows={3} value={formData.proposedIntervention} onChange={e => setFormData({ ...formData, proposedIntervention: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="block text-slate-300 font-bold mb-1">Medidas temporales</label>
            <textarea rows={3} value={formData.temporaryMeasures} onChange={e => setFormData({ ...formData, temporaryMeasures: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="block text-slate-300 font-bold mb-1">Estudios / ensayos adicionales</label>
            <textarea rows={3} value={formData.additionalStudies} onChange={e => setFormData({ ...formData, additionalStudies: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="block text-slate-300 font-bold mb-1">Recomendaciones finales</label>
            <textarea rows={3} value={formData.finalRecommendations} onChange={e => setFormData({ ...formData, finalRecommendations: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="block text-slate-300 font-bold mb-1">Profesional responsable *</label>
            <input required value={formData.responsibleProfessional} onChange={e => setFormData({ ...formData, responsibleProfessional: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" />
          </div>
          <div>
            <label className="block text-slate-300 font-bold mb-1">Matrícula profesional</label>
            <input value={formData.professionalLicense} onChange={e => setFormData({ ...formData, professionalLicense: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button disabled={saving || !userAllowed} type="submit" className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            FINALIZAR INFORME TÉCNICO
          </button>
        </div>
      </form>
    </div>
  );
};
