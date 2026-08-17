import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  UserCheck, 
  ArrowRight, 
  Info, 
  Clock, 
  Wrench,
  Search,
  Filter
} from 'lucide-react';
import { TechnicalDecisionType, TechnicalDecisionRecord } from '../types';

interface TechnicalReviewViewProps {
  onNavigateToClientApproval?: () => void;
}

export const TechnicalReviewView: React.FC<TechnicalReviewViewProps> = ({
  onNavigateToClientApproval,
}) => {
  const [selectedDecision, setSelectedDecision] = useState<TechnicalDecisionType>('REQUIERE INTERVENCIÓN');
  const [formData, setFormData] = useState({
    technicalJustification: 'Basado en los hallazgos en campo (fisuración diagonal por cortante en columna C-2 del primer piso y pérdida de confinamiento), la estructura requiere reforzamiento y rigidización para restablecer la capacidad sismorresistente según NSR-10.',
    proposedIntervention: 'Encamisado de concreto reforzado o refuerzo con polímeros reforzados con fibra de carbono (CFRP) en columna C-2, más inyección epóxica en fisuras estructurales.',
    temporaryMeasures: 'Instalación inmediata de puntales metálicos de alta capacidad (apuntalamiento temporal) en el pórtico adyacente a la columna C-2.',
    additionalStudies: 'Extracción de núcleos de concreto (ASTM C42) y ensayo de esclerometría para verificar resistencia a la compresión f\'c in-situ.',
    responsibleProfessional: 'Ing. Especialista en Estructuras',
    professionalLicense: 'CPN-12345-COL',
  });

  const [devMessage, setDevMessage] = useState<string | null>(null);

  const decisionOptions: { type: TechnicalDecisionType; desc: string; color: string }[] = [
    { type: 'NO REQUIERE INTERVENCIÓN', desc: 'Afectaciones menores o cosméticas sin compromiso estructural.', color: 'text-emerald-400 border-emerald-700/60 bg-emerald-950/40' },
    { type: 'REQUIERE INTERVENCIÓN', desc: 'Daños estructurales que exigen obras de reparación o reforzamiento.', color: 'text-rose-400 border-rose-700/60 bg-rose-950/40' },
    { type: 'REQUIERE EVALUACIÓN ADICIONAL', desc: 'Análisis detallado de vulnerabilidad o modelación numérica requerida.', color: 'text-amber-400 border-amber-700/60 bg-amber-950/40' },
    { type: 'REQUIERE ENSAYOS', desc: 'Ensayos no destructivos o destructivos (núcleos, ultrasonido, ferroscan).', color: 'text-cyan-400 border-cyan-700/60 bg-cyan-950/40' },
    { type: 'REQUIERE INFORMACIÓN ADICIONAL', desc: 'Pendiente de entrega de planos o memorias de cálculo originales.', color: 'text-purple-400 border-purple-700/60 bg-purple-950/40' },
  ];

  const handleSaveDecision = (e: React.FormEvent) => {
    e.preventDefault();
    setDevMessage('Persistencia pendiente de habilitación.');
    setTimeout(() => {
      setDevMessage(null);
      if (onNavigateToClientApproval) {
        onNavigateToClientApproval();
      }
    }, 2800);
  };

  return (
    <div id="sipre-technical-review-screen" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
              Dictamen Especializado
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2.5">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>Revisión Técnica y Concepto Estructural</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Emisión de dictamen profesional, prescripción de medidas y decisión de intervención
          </p>
        </div>

        <span className="bg-amber-950/80 text-amber-300 border border-amber-700/80 px-3 py-1.5 rounded-xl text-xs font-bold font-mono">
          0 Casos Pendientes en Cola
        </span>
      </div>

      {devMessage && (
        <div className="p-4 rounded-xl bg-amber-950/80 border border-amber-600 text-amber-200 font-bold text-center flex items-center justify-center space-x-2 animate-pulse text-xs">
          <CheckCircle2 className="w-5 h-5 text-amber-400" />
          <span>{devMessage}</span>
        </div>
      )}

      {/* Empty State Banner */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-200">No hay expedientes pendientes de revisión técnica</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Cuando se finalice una visita en Modo Campo, el expediente ingresará automáticamente a esta bandeja para el concepto del ingeniero especialista.
          </p>
        </div>
      </div>

      {/* Technical Review Form Example / Simulator */}
      <form onSubmit={handleSaveDecision} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 text-xs text-slate-200">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Formulario de Decisión Técnica Estructural
          </h2>
          <span className="text-[11px] font-mono text-cyan-400">NSR-10 / AIS 410</span>
        </div>

        {/* 5 Decision Options Selector */}
        <div className="space-y-2">
          <label className="block text-slate-400 font-semibold mb-1">Decisión Técnica Principal *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {decisionOptions.map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => setSelectedDecision(opt.type)}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  selectedDecision === opt.type
                    ? `${opt.color} shadow-lg ring-1 ring-cyan-400`
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs">{opt.type}</span>
                  {selectedDecision === opt.type && (
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Justificación Técnica del Dictamen *</label>
            <textarea
              rows={3}
              value={formData.technicalJustification}
              onChange={(e) => setFormData({ ...formData, technicalJustification: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Intervención Propuesta / Alcance Técnico</label>
            <textarea
              rows={3}
              value={formData.proposedIntervention}
              onChange={(e) => setFormData({ ...formData, proposedIntervention: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Medidas Temporales / Apuntalamientos</label>
              <textarea
                rows={2}
                value={formData.temporaryMeasures}
                onChange={(e) => setFormData({ ...formData, temporaryMeasures: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Estudios Adicionales / Ensayos Requeridos</label>
              <textarea
                rows={2}
                value={formData.additionalStudies}
                onChange={(e) => setFormData({ ...formData, additionalStudies: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Profesional Especialista Responsable</label>
              <input
                type="text"
                value={formData.responsibleProfessional}
                onChange={(e) => setFormData({ ...formData, responsibleProfessional: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Matrícula Profesional (COPNIA / CPN)</label>
              <input
                type="text"
                value={formData.professionalLicense}
                onChange={(e) => setFormData({ ...formData, professionalLicense: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 focus:outline-none focus:border-cyan-500 font-mono"
                required
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <span className="text-[11px] text-slate-500">
            Al registrar el concepto, el caso avanzará a la etapa de <strong>Aprobación del Cliente</strong>.
          </span>
          <button
            type="submit"
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center space-x-1.5 shadow-lg shadow-cyan-600/25 active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>EMITIR CONCEPTO TÉCNICO</span>
          </button>
        </div>

      </form>

    </div>
  );
};
