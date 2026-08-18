import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  FileText, 
  User, 
  Calendar, 
  PenTool, 
  AlertCircle, 
  Building, 
  CheckCheck,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { ClientApprovalStatus, ClientApprovalRecord } from '../types';

interface ClientApprovalViewProps {
  onBackToDashboard?: () => void;
}

export const ClientApprovalView: React.FC<ClientApprovalViewProps> = ({
  onBackToDashboard,
}) => {
  const [status, setStatus] = useState<ClientApprovalStatus>('Pendiente');
  const [formData, setFormData] = useState({
    clientRepresentativeName: '',
    observations: '',
    date: new Date().toISOString().split('T')[0],
    proposedIntervention: 'Reforzamiento y encamisado de columna C-2 con polímeros de fibra de carbono (CFRP) e inyección estructural de grietas.',
    technicalSummary: 'Evaluación técnica post-sismo concluyó necesidad de intervención prioritaria en elemento C-2 para restablecer confinamiento y capacidad portante.',
  });

  const [devMessage, setDevMessage] = useState<string | null>(null);

  const statusOptions: { val: ClientApprovalStatus; label: string; color: string; icon: any }[] = [
    { val: 'Pendiente', label: 'Pendiente de Respuesta', color: 'bg-amber-950/60 border-amber-700/60 text-amber-300', icon: Clock },
    { val: 'Aprobado', label: 'Aprobado', color: 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300', icon: CheckCheck },
    { val: 'Aprobado con observaciones', label: 'Aprobado con Observaciones', color: 'bg-cyan-950/60 border-cyan-700/60 text-cyan-300', icon: AlertTriangle },
    { val: 'No aprobado', label: 'No Aprobado', color: 'bg-rose-950/60 border-rose-700/60 text-rose-300', icon: XCircle },
  ];

  const handleSaveApproval = (e: React.FormEvent) => {
    e.preventDefault();
    setDevMessage('Persistencia pendiente de habilitación.');
    setTimeout(() => {
      setDevMessage(null);
      if (onBackToDashboard) onBackToDashboard();
    }, 2800);
  };

  return (
    <div id="sipre-client-approval-screen" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
              Validación y Aceptación
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2.5">
            <CheckCircle2 className="w-6 h-6 text-cyan-400" />
            <span>Aprobación del Cliente</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro de conformidad, observaciones y firma del representante del cliente
          </p>
        </div>

        <span className="bg-purple-950/80 text-purple-300 border border-purple-700/80 px-3 py-1.5 rounded-xl text-xs font-bold font-mono">
          0 Propuestas Pendientes
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
          <h3 className="text-sm font-bold text-slate-200">No hay propuestas pendientes de aprobación del cliente</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Cuando un especialista emita un dictamen técnico que requiera intervención, la propuesta técnica se enviará a esta sección para firma y formalización del cliente.
          </p>
        </div>
      </div>

      {/* Approval Form Simulator */}
      <form onSubmit={handleSaveApproval} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 text-xs text-slate-200">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Formulario de Aprobación de Intervención
          </h2>
          <span className="text-[11px] font-mono text-cyan-400">Acta de Conformidad</span>
        </div>

        {/* Technical Summary Readonly Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <div>
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-1">
              Resumen Técnico del Dictamen
            </span>
            <p className="text-slate-300 leading-relaxed bg-slate-900/70 p-3 rounded-lg border border-slate-800">
              {formData.technicalSummary}
            </p>
          </div>

          <div>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">
              Intervención Propuesta
            </span>
            <p className="text-slate-300 leading-relaxed bg-slate-900/70 p-3 rounded-lg border border-slate-800">
              {formData.proposedIntervention}
            </p>
          </div>
        </div>

        {/* Status Selector */}
        <div className="space-y-2">
          <label className="block text-slate-400 font-semibold mb-1">Estado de la Decisión del Cliente *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {statusOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setStatus(opt.val)}
                  className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition-all ${
                    status === opt.val
                      ? `${opt.color} shadow-lg ring-1 ring-cyan-400 font-bold`
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Client Representative & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Nombre Representante del Cliente *</label>
            <input
              type="text"
              placeholder="Ej: Juan Pérez (Presidente Consejo de Administración)"
              value={formData.clientRepresentativeName}
              onChange={(e) => setFormData({ ...formData, clientRepresentativeName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Fecha de Notificación / Decisión</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-cyan-500 font-mono"
              required
            />
          </div>
        </div>

        {/* Observations */}
        <div>
          <label className="block text-slate-400 font-semibold mb-1">Observaciones o Condiciones del Cliente</label>
          <textarea
            rows={3}
            placeholder="Detalles sobre cronograma de obra aceptado, restricciones horarias de acceso o requerimientos específicos..."
            value={formData.observations}
            onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Future Digital Signature Area Placeholder */}
        <div className="bg-slate-950 border border-dashed border-slate-700 rounded-xl p-6 text-center space-y-2">
          <PenTool className="w-6 h-6 text-cyan-400 mx-auto" />
          <h3 className="font-bold text-white text-xs">Módulo de Firma Digital del Cliente</h3>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Área de captura de firma biométrica / digital para formalización de actas técnicas y trazabilidad legal.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <span className="text-[11px] text-slate-500">
            Al aprobarse, el caso avanzará a la programación de <strong>Materiales</strong> e <strong>Intervención</strong>.
          </span>
          <button
            type="submit"
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center space-x-1.5 shadow-lg shadow-cyan-600/25 active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>REGISTRAR DECISIÓN DE CLIENTE</span>
          </button>
        </div>

      </form>

    </div>
  );
};
