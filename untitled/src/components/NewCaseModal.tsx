import React, { useState } from 'react';
import { 
  X, 
  FolderKanban, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Calendar,
  FileText,
  UserCheck
} from 'lucide-react';
import { CaseType, CasePriority, PropertyType } from '../types';

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewCaseModal: React.FC<NewCaseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    code: `EXP-${currentYear}-0001`,
    requestDate: new Date().toISOString().split('T')[0],
    clientName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    municipality: '',
    neighborhood: '',
    propertyType: 'Edificio' as PropertyType,
    caseType: 'Inspección' as CaseType,
    priority: 'Normal' as CasePriority,
    requestDescription: '',
    responsibleCoordinator: '',
  });

  const [devMessage, setDevMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate fields
    if (!formData.clientName.trim()) {
      setValidationError('El nombre del cliente o entidad solicitante es obligatorio.');
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
    if (!formData.requestDescription.trim()) {
      setValidationError('La descripción de la solicitud técnica es requerida.');
      return;
    }

    // Validated without persistence as instructed
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
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Nuevo Expediente Técnico
              </h2>
              <p className="text-xs text-slate-400">
                Apertura de caso para evaluación de patología y riesgo estructural
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

        {/* Development notice */}
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

          {/* Identification and Dates */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Identificación del Expediente</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Código de Expediente</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Fecha de Solicitud</label>
                <input
                  type="date"
                  value={formData.requestDate}
                  onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tipo de Caso</label>
                <select
                  value={formData.caseType}
                  onChange={(e) => setFormData({ ...formData, caseType: e.target.value as CaseType })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="Inspección">Inspección</option>
                  <option value="Post-sismo">Post-sismo</option>
                  <option value="Patología">Patología</option>
                  <option value="Evaluación estructural">Evaluación estructural</option>
                  <option value="Reparación">Reparación</option>
                  <option value="Seguimiento">Seguimiento</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Client & Contact */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Información del Cliente y Contacto</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Cliente / Solicitante *</label>
                <input
                  type="text"
                  placeholder="Ej: Copropiedad Edificio Altamira"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Persona de Contacto</label>
                <input
                  type="text"
                  placeholder="Ej: Administrador / Propietario"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Teléfono</label>
                <input
                  type="tel"
                  placeholder="Ej: +57 300 123 4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="Ej: contacto@edificioaltamira.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Location & Property */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ubicación del Predio</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Dirección del Predio *</label>
                <input
                  type="text"
                  placeholder="Ej: Calle 50 # 40-20"
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
                  placeholder="Ej: Envigado"
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
                  placeholder="Ej: La Magnolia"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
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
            </div>
          </div>

          {/* Priority, Coordinator & Description */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Prioridad y Asignación de Coordinación</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Prioridad</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as CasePriority })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer font-bold"
                >
                  <option value="Baja">Baja</option>
                  <option value="Normal">Normal</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente (Riesgo Inminente)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Coordinador Responsable</label>
                <input
                  type="text"
                  placeholder="Ej: Ing. Coordinador de Operaciones"
                  value={formData.responsibleCoordinator}
                  onChange={(e) => setFormData({ ...formData, responsibleCoordinator: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Descripción de la Solicitud *</label>
              <textarea
                rows={3}
                placeholder="Detalle los síntomas observados por el cliente, afectaciones, antecedentes y requerimiento de inspección..."
                value={formData.requestDescription}
                onChange={(e) => setFormData({ ...formData, requestDescription: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                required
              />
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
              <FolderKanban className="w-4 h-4" />
              <span>CREAR EXPEDIENTE</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
