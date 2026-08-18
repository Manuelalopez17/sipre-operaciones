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
  UserCheck,
  Loader2
} from 'lucide-react';
import { CaseType, CasePriority, PropertyType } from '../types';
import { saveCase, generateNextCaseCode } from '../lib/storage';
import { createCaseInDb } from '../lib/supabaseService';
import { useAuth } from '../context/AuthContext';

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseCreated?: () => void;
}

export const NewCaseModal: React.FC<NewCaseModalProps> = ({
  isOpen,
  onClose,
  onCaseCreated,
}) => {
  const { user, profile, currentEmergency } = useAuth();
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    requestDate: new Date().toISOString().split('T')[0],
    clientName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    municipality: currentEmergency?.municipality || 'Medellín',
    neighborhood: '',
    department: currentEmergency?.department || 'Antioquia',
    propertyType: 'Edificio' as PropertyType,
    caseType: 'Inspección' as CaseType,
    priority: 'Normal' as CasePriority,
    requestDescription: '',
    responsibleCoordinator: profile?.full_name || 'Coordinador Técnico',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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

    setLoading(true);

    try {
      // 1. Create in Supabase DB
      const dbCase = await createCaseInDb({
        clientName: formData.clientName.trim(),
        contactPerson: formData.contactPerson.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        municipality: formData.municipality.trim(),
        department: formData.department.trim(),
        neighborhood: formData.neighborhood.trim(),
        propertyType: formData.propertyType,
        caseType: formData.caseType,
        priority: formData.priority,
        requestDescription: formData.requestDescription.trim(),
        responsibleCoordinator: formData.responsibleCoordinator.trim(),
        createdBy: user?.id,
        emergencyId: currentEmergency?.id,
      });

      // 2. Also save to local storage for instant durability
      const code = dbCase?.code || generateNextCaseCode();
      saveCase({
        id: code,
        code,
        requestDate: formData.requestDate,
        clientName: formData.clientName.trim(),
        contactPerson: formData.contactPerson.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        municipality: formData.municipality.trim(),
        department: formData.department.trim(),
        neighborhood: formData.neighborhood.trim(),
        propertyType: formData.propertyType,
        caseType: formData.caseType,
        priority: formData.priority,
        requestDescription: formData.requestDescription.trim(),
        responsibleCoordinator: formData.responsibleCoordinator || 'Coordinador Técnico',
        status: 'NEW_CASE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (onCaseCreated) {
        onCaseCreated();
      }

      onClose();
    } catch (err) {
      console.warn('Create case error:', err);
      // Local fallback
      const nextCode = generateNextCaseCode();
      saveCase({
        id: nextCode,
        code: nextCode,
        requestDate: formData.requestDate,
        clientName: formData.clientName.trim(),
        contactPerson: formData.contactPerson.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        municipality: formData.municipality.trim(),
        department: formData.department.trim(),
        neighborhood: formData.neighborhood.trim(),
        propertyType: formData.propertyType,
        caseType: formData.caseType,
        priority: formData.priority,
        requestDescription: formData.requestDescription.trim(),
        responsibleCoordinator: formData.responsibleCoordinator || 'Coordinador Técnico',
        status: 'NEW_CASE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      if (onCaseCreated) onCaseCreated();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="modal-new-case" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center space-x-2">
                <span>Crear Nuevo Expediente</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  EXPEDIENTE TÉCNICO
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Apertura oficial de caso para evaluación de patologías, peritaje o triaje estructural.
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

        {/* Validation Error Banner */}
        {validationError && (
          <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-200 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Metadata */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </div>

          {/* Client Info */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Información del Cliente y Contacto</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Cliente / Propietario *</label>
                <input
                  type="text"
                  placeholder="Ej: Edificio San Jerónimo P.H."
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
                  placeholder="Ej: Juan Pérez (Administrador)"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Teléfono</label>
                <input
                  type="tel"
                  placeholder="Ej: 300 123 4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="Ej: administracion@edificiosanjeronimo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ubicación y Tipología</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Dirección del Predio *</label>
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
            </div>
          </div>

          {/* Scope and Details */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <Building className="w-3.5 h-3.5 text-cyan-400" />
              <span>Clasificación y Solicitud Técnica</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tipo de Caso / Servicio</label>
                <select
                  value={formData.caseType}
                  onChange={(e) => setFormData({ ...formData, caseType: e.target.value as CaseType })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="Inspección">Inspección</option>
                  <option value="Post-sismo">Post-sismo (Evaluación Rápida)</option>
                  <option value="Patología">Patología Estructural</option>
                  <option value="Evaluación estructural">Evaluación Estructural Detallada</option>
                  <option value="Reparación">Reparación / Reforzamiento</option>
                  <option value="Seguimiento">Seguimiento / Monitoreo</option>
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
                  <option value="Urgente">Urgente (Riesgo Inminente)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Descripción de la Solicitud Técnica *</label>
              <textarea
                rows={3}
                placeholder="Detalle de los daños reportados, antecedentes, fecha del evento detonante y requerimientos específicos del solicitante..."
                value={formData.requestDescription}
                onChange={(e) => setFormData({ ...formData, requestDescription: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-submit-new-case"
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/30 transition-all flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creando...</span>
                </>
              ) : (
                <span>CREAR EXPEDIENTE</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
