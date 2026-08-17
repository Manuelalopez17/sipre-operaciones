import React, { useState } from 'react';
import { 
  ClipboardList, 
  Calendar, 
  MapPin, 
  Clock, 
  UserCheck, 
  PlusCircle, 
  Smartphone, 
  CheckCircle2, 
  Play, 
  Building, 
  Users,
  AlertCircle
} from 'lucide-react';
import { VisitRecord, VisitStatus } from '../types';

interface VisitsViewProps {
  onOpenScheduleVisitModal: () => void;
  onStartFieldMode: (visit?: VisitRecord) => void;
  visits?: VisitRecord[];
}

export const VisitsView: React.FC<VisitsViewProps> = ({
  onOpenScheduleVisitModal,
  onStartFieldMode,
  visits = [],
}) => {
  const [activeTab, setActiveTab] = useState<'programadas' | 'confirmadas' | 'en_campo' | 'terminadas' | 'mis_visitas'>('programadas');
  const [devActionMessage, setDevActionMessage] = useState<string | null>(null);

  const tabs = [
    { id: 'programadas', label: 'Programadas', count: 0 },
    { id: 'confirmadas', label: 'Confirmadas', count: 0 },
    { id: 'en_campo', label: 'En campo', count: 0 },
    { id: 'terminadas', label: 'Terminadas', count: 0 },
    { id: 'mis_visitas', label: 'Mis Visitas (Asignadas)', count: 0 },
  ] as const;

  const handleActionNotice = (action: string) => {
    setDevActionMessage(`Acción "${action}": Persistencia pendiente de habilitación.`);
    setTimeout(() => setDevActionMessage(null), 3000);
  };

  return (
    <div id="sipre-visits-screen" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
              Operaciones de Campo
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2.5">
            <ClipboardList className="w-6 h-6 text-cyan-400" />
            <span>Gestión de Visitas Técnicas</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Control de inspecciones programadas, confirmadas, en terreno y finalizadas
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            id="btn-visits-direct-field"
            onClick={() => onStartFieldMode()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-600/25 border border-emerald-400/40 transition-all active:scale-95"
          >
            <Smartphone className="w-4 h-4" />
            <span>MODO CAMPO DIRECTO</span>
          </button>

          <button
            id="btn-visits-schedule"
            onClick={onOpenScheduleVisitModal}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-cyan-600/25 border border-cyan-400/40 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ PROGRAMAR VISITA</span>
          </button>
        </div>
      </div>

      {devActionMessage && (
        <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-600 text-amber-200 font-bold text-xs text-center flex items-center justify-center space-x-2 animate-pulse">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span>{devActionMessage}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-xl">
        <div className="flex flex-wrap gap-1 border-b border-slate-800 pb-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === t.id
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{t.label}</span>
              <span className={`text-[10px] px-2 py-0.2 rounded-full font-mono font-bold ${
                activeTab === t.id ? 'bg-cyan-900 text-cyan-200' : 'bg-slate-800 text-slate-400'
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content Display - Empty States */}
        <div className="p-6">
          {activeTab === 'programadas' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                <Calendar className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-200">No hay visitas programadas</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Las nuevas visitas técnicas agendadas aparecerán en esta sección pendientes de confirmación.
                </p>
              </div>
              <button
                onClick={onOpenScheduleVisitModal}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center space-x-2 shadow"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Programar Visita</span>
              </button>
            </div>
          )}

          {activeTab === 'confirmadas' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-200">No hay visitas confirmadas</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Visitas con fecha y hora confirmadas por el cliente y el equipo técnico evaluador.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'en_campo' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                <MapPin className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-200">No hay visitas en campo en este momento</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Cuando un inspector inicie el Modo Campo en un predio, su estado cambiará a &quot;En campo&quot; en tiempo real.
                </p>
              </div>
              <button
                onClick={() => onStartFieldMode()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center space-x-2 shadow"
              >
                <Smartphone className="w-4 h-4" />
                <span>Iniciar Modo Campo de Prueba</span>
              </button>
            </div>
          )}

          {activeTab === 'terminadas' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                <ClipboardList className="w-7 h-7 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-200">No hay visitas terminadas</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Las visitas finalizadas pasarán automáticamente a la bandeja de Revisión Técnica por Especialista.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'mis_visitas' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Panel de Profesional Asignado</h3>
                    <p className="text-xs text-slate-400">Visualización de tus asignaciones técnicas de inspección</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleActionNotice('CONFIRMAR VISITA')}
                    className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all"
                  >
                    CONFIRMAR VISITA
                  </button>
                  <button
                    onClick={() => onStartFieldMode()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>INICIAR VISITA</span>
                  </button>
                </div>
              </div>

              <div className="py-10 text-center space-y-3 bg-slate-950/60 rounded-xl border border-slate-800/80 p-6">
                <p className="text-sm font-bold text-slate-200">No tienes visitas asignadas pendientes</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Cuando la coordinación te asigne una inspección técnica, verás aquí la fecha, hora, ubicación, objetivo y equipo asignado.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
