import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  UserCheck, 
  Users, 
  Building, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  ShieldAlert
} from 'lucide-react';
import { PropertyType, CasePriority } from '../types';

interface ScheduleVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    estimatedEndTime: '11:00',
    clientName: '',
    address: '',
    municipality: '',
    neighborhood: '',
    propertyType: 'Edificio' as PropertyType,
    responsibleProfessional: '',
    assignedTeam: '',
    visitReason: '',
    visitObjective: '',
    preparationObservations: '',
    priority: 'Normal' as CasePriority,
  });

  const [devMessage, setDevMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate required fields
    if (!formData.clientName.trim()) {
      setValidationError('El nombre del cliente es obligatorio.');
      return;
    }
    if (!formData.address.trim()) {
      setValidationError('La dirección del predio es obligatoria.');
      return;
    }
    if (!formData.municipality.trim()) {
      setValidationError('El municipio es obligatorio.');
      return;
    }
    if (!formData.responsibleProfessional.trim()) {
      setValidationError('Debe asignar un profesional responsable.');
      return;
    }

    // Form validated successfully - display non-persistent development notice as instructed
    setDevMessage('Persistencia pendiente de habilitación.');
    setTimeout(() => {
      setDevMessage(null);
      onClose();
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Programar Visita Técnica
              </h2>
              <p className="text-xs text-slate-400">
                Agendamiento de inspección en campo y asignación de equipo técnico
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Banner */}
        <div className="bg-cyan-950/40 border-b border-cyan-900/50 px-6 py-2 text-xs text-cyan-300 flex items-center space-x-2">
          <Info className="w-4 h-4 flex-shrink-0 text-cyan-400" />
          <span>Fase de validación de interfaz técnica. Las escrituras en base de datos se activarán en el siguiente paso.</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-200">
          
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {devMessage && (
            <div className="p-4 rounded-xl bg-amber-950/80 border border-amber-600 text-amber-200 font-bold text-center flex items-center justify-center space-x-2 animate-pulse">
              <CheckCircle2 className="w-5 h-5 text-amber-400" />
              <span>{devMessage}</span>
            </div>
          )}

          {/* Date and Time Group */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Fecha y Horario de la Visita</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Fecha</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Hora de Inicio</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Hora Estimada de Fin</label>
                <input
                  type="time"
                  value={formData.estimatedEndTime}
                  onChange={(e) => setFormData({ ...formData, estimatedEndTime: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Client & Location */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cliente y Ubicación del Predio</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Cliente / Solicitante *</label>
                <input
                  type="text"
                  placeholder="Ej: Administración Edificio Torres del Parque"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Dirección del Inmueble *</label>
                <input
                  type="text"
                  placeholder="Ej: Carrera 43A # 12-45"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Municipio *</label>
                <input
                  type="text"
                  placeholder="Ej: Medellín"
                  value={formData.municipality}
                  onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Barrio / Sector</label>
                <input
                  type="text"
                  placeholder="Ej: El Poblado"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tipo de Inmueble</label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value as PropertyType })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="Casa">Casa</option>
                  <option value="Edificio">Edificio</option>
                  <option value="Local comercial">Local comercial</option>
                  <option value="Bodega">Bodega</option>
                  <option value="Institucional">Institucional</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Nivel de Prioridad</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as CasePriority })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer font-bold"
                >
                  <option value="Baja">Baja</option>
                  <option value="Normal">Normal</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente (Emergencia)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Technical Team Assignment */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Personal Técnico Asignado</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Profesional Responsable *</label>
                <input
                  type="text"
                  placeholder="Ej: Ing. Evaluador Estructural"
                  value={formData.responsibleProfessional}
                  onChange={(e) => setFormData({ ...formData, responsibleProfessional: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Equipo / Acompañantes Asignados</label>
                <input
                  type="text"
                  placeholder="Ej: Brigada Técnica 1 / Auxiliar de Inspección"
                  value={formData.assignedTeam}
                  onChange={(e) => setFormData({ ...formData, assignedTeam: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Visit Purpose & Preparation */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <Building className="w-3.5 h-3.5 text-cyan-400" />
              <span>Objetivo y Motivo de la Visita</span>
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Motivo de la Visita</label>
                <input
                  type="text"
                  placeholder="Ej: Grietas en muros de mampostería y columna tras sismo reciente"
                  value={formData.visitReason}
                  onChange={(e) => setFormData({ ...formData, visitReason: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Objetivo Técnico de la Visita</label>
                <textarea
                  rows={2}
                  placeholder="Ej: Levantamiento de patologías estructurales, medición de fisuras con fisurómetro y recomendación de triaje preliminar."
                  value={formData.visitObjective}
                  onChange={(e) => setFormData({ ...formData, visitObjective: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Observaciones de Preparación / Equipamiento Requerido</label>
                <input
                  type="text"
                  placeholder="Ej: Llevar escalera, fisurómetro calibrado, linterna táctica, EPP completo."
                  value={formData.preparationObservations}
                  onChange={(e) => setFormData({ ...formData, preparationObservations: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-600/25 active:scale-95 flex items-center space-x-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>PROGRAMAR VISITA</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
