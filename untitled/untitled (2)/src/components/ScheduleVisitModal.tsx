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
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { PropertyType, CasePriority } from '../types';
import { saveVisit, generateNextVisitCode } from '../lib/storage';
import { createVisitInDb } from '../lib/supabaseService';
import { useAuth } from '../context/AuthContext';

interface ScheduleVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVisitCreated?: () => void;
}

export const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({
  isOpen,
  onClose,
  onVisitCreated,
}) => {
  const { user, profile, activeProfiles } = useAuth();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    estimatedEndTime: '11:00',
    clientName: '',
    address: '',
    municipality: '',
    neighborhood: '',
    propertyType: 'Edificio' as PropertyType,
    responsibleProfessionalId: user?.id || '',
    responsibleProfessional: profile?.full_name || '',
    assignedTeam: '',
    visitReason: '',
    visitObjective: '',
    preparationObservations: '',
    priority: 'Normal' as CasePriority,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProfessionalSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const found = activeProfiles.find((p) => p.id === selectedId);
    if (found) {
      setFormData({
        ...formData,
        responsibleProfessionalId: found.id,
        responsibleProfessional: found.full_name,
      });
    } else {
      setFormData({
        ...formData,
        responsibleProfessionalId: '',
        responsibleProfessional: selectedId,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    setLoading(true);

    try {
      // 1. Save to Supabase
      const dbVisit = await createVisitInDb({
        date: formData.date,
        startTime: formData.startTime,
        estimatedEndTime: formData.estimatedEndTime,
        clientName: formData.clientName.trim(),
        address: formData.address.trim(),
        municipality: formData.municipality.trim(),
        neighborhood: formData.neighborhood.trim(),
        propertyType: formData.propertyType,
        responsibleProfessionalId: formData.responsibleProfessionalId || user?.id || 'prof-1',
        responsibleProfessionalName: formData.responsibleProfessional.trim(),
        assignedTeam: formData.assignedTeam.trim(),
        visitReason: formData.visitReason.trim(),
        visitObjective: formData.visitObjective.trim(),
        preparationObservations: formData.preparationObservations.trim(),
        priority: formData.priority,
        createdBy: user?.id,
      });

      // 2. Also save to local storage for instant access & offline durability
      const visitCode = dbVisit?.id || generateNextVisitCode();
      saveVisit({
        id: visitCode,
        date: formData.date,
        startTime: formData.startTime,
        estimatedEndTime: formData.estimatedEndTime,
        clientName: formData.clientName.trim(),
        address: formData.address.trim(),
        municipality: formData.municipality.trim(),
        neighborhood: formData.neighborhood.trim(),
        propertyType: formData.propertyType,
        responsibleProfessional: formData.responsibleProfessional.trim(),
        assignedTeam: formData.assignedTeam.trim(),
        visitReason: formData.visitReason.trim(),
        visitObjective: formData.visitObjective.trim(),
        preparationObservations: formData.preparationObservations.trim(),
        priority: formData.priority,
        status: 'PROGRAMADA',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (onVisitCreated) {
        onVisitCreated();
      }

      onClose();
    } catch (err: any) {
      console.warn('Schedule visit error:', err);
      // Fallback local save
      const nextCode = generateNextVisitCode();
      saveVisit({
        id: nextCode,
        date: formData.date,
        startTime: formData.startTime,
        estimatedEndTime: formData.estimatedEndTime,
        clientName: formData.clientName.trim(),
        address: formData.address.trim(),
        municipality: formData.municipality.trim(),
        neighborhood: formData.neighborhood.trim(),
        propertyType: formData.propertyType,
        responsibleProfessional: formData.responsibleProfessional.trim(),
        assignedTeam: formData.assignedTeam.trim(),
        visitReason: formData.visitReason.trim(),
        visitObjective: formData.visitObjective.trim(),
        preparationObservations: formData.preparationObservations.trim(),
        priority: formData.priority,
        status: 'PROGRAMADA',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      if (onVisitCreated) onVisitCreated();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="modal-schedule-visit" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center space-x-2">
                <span>Programar Nueva Visita Técnica</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  AGENDA
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Asigna el profesional responsable, fecha, franja horaria y objetivo técnico de la inspección.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-200 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
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
                  <option value="Apartamento">Apartamento</option>
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
                {(() => {
                  const professionalProfiles = activeProfiles.filter(
                    (p) => p.active !== false && (p.role === 'inspector' || p.role === 'Inspector' || p.role === 'structural_specialist')
                  );
                  return professionalProfiles.length > 0 ? (
                    <select
                      value={formData.responsibleProfessionalId}
                      onChange={handleProfessionalSelect}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer font-semibold"
                      required
                    >
                      <option value="">Seleccione profesional responsable...</option>
                      {professionalProfiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.full_name} (Profesional) {p.professional_license ? `[${p.professional_license}]` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Ej: Ing. Evaluador Estructural"
                      value={formData.responsibleProfessional}
                      onChange={(e) => setFormData({ ...formData, responsibleProfessional: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      required
                    />
                  );
                })()}
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

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-submit-schedule-visit"
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/30 transition-all flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Programando...</span>
                </>
              ) : (
                <span>PROGRAMAR VISITA</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
