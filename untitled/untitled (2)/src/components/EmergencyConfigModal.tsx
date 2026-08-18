import React, { useState } from 'react';
import { ShieldAlert, X, CheckCircle2, AlertCircle, Calendar, MapPin, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface EmergencyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyConfigModal: React.FC<EmergencyConfigModalProps> = ({ isOpen, onClose }) => {
  const { createEmergency, currentEmergency } = useAuth();
  const [name, setName] = useState<string>('');
  const [eventType, setEventType] = useState<string>('Sismo');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState<string>('Antioquia');
  const [municipality, setMunicipality] = useState<string>('Medellín');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !municipality.trim()) {
      setErrorMsg('Por favor completa el nombre del evento y el municipio.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await createEmergency({
        name: name.trim(),
        event_type: eventType,
        date,
        department: department.trim(),
        municipality: municipality.trim(),
        description: description.trim(),
        is_active: true,
      });

      if (!res) {
        setErrorMsg('No se pudo crear el registro de emergencia en Supabase.');
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al guardar emergencia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="modal-emergency-config" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Configuración de Emergencia Activa</h3>
              <p className="text-xs text-slate-400">Define el marco del evento sísmico o contingencia para el triaje.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Nombre de la Emergencia / Evento <span className="text-red-400">*</span>
            </label>
            <input
              id="input-emergency-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Sismo Occidente Antioquia Mw 5.8 - 2026"
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Tipo de Evento
              </label>
              <select
                id="select-emergency-type"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 outline-none"
              >
                <option value="Sismo">Sismo / Terremoto</option>
                <option value="Deslizamiento">Movimiento en masa / Deslizamiento</option>
                <option value="Asentamiento">Asentamiento Diferencial</option>
                <option value="Afectación Vecina">Afectación por Obra Vecina</option>
                <option value="Colapso Parcial">Falla Estructural / Colapso Parcial</option>
                <option value="Inundación">Inundación / Socavación</option>
                <option value="Inspección Preventiva">Inspección Preventiva</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Fecha del Evento
              </label>
              <input
                id="input-emergency-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Departamento <span className="text-red-400">*</span>
              </label>
              <input
                id="input-emergency-department"
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Municipio Afectado <span className="text-red-400">*</span>
              </label>
              <input
                id="input-emergency-municipality"
                type="text"
                required
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-xl px-3.5 py-2.5 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Descripción / Alcance Operativo
            </label>
            <textarea
              id="input-emergency-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del área afectada, directrices del DAGRD / UNGRD y objetivos de la evaluación..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-xl p-3 outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
            >
              Cancelar
            </button>
            <button
              id="btn-create-emergency-submit"
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-600/25 transition-all"
            >
              {loading ? 'Guardando...' : 'ESTABLECER EMERGENCIA ACTIVA'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
