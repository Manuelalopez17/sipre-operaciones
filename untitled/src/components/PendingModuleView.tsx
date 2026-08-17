import React from 'react';
import { Wrench, Boxes, Users, Clock, ArrowLeft, ShieldCheck } from 'lucide-react';
import { MainNavView } from './Header';

interface PendingModuleViewProps {
  moduleName: string;
  moduleType: 'interventions' | 'materials' | 'team';
  onBackToDashboard: () => void;
}

export const PendingModuleView: React.FC<PendingModuleViewProps> = ({
  moduleName,
  moduleType,
  onBackToDashboard,
}) => {
  const getIcon = () => {
    switch (moduleType) {
      case 'interventions':
        return Wrench;
      case 'materials':
        return Boxes;
      case 'team':
        return Users;
      default:
        return Clock;
    }
  };

  const Icon = getIcon();

  const getDetails = () => {
    switch (moduleType) {
      case 'interventions':
        return {
          title: 'Módulo de Intervenciones y Obras',
          description: 'Gestión de ejecución de obras estructurales, cronogramas de reparación, apuntalamientos, supervisión técnica y actas de entrega final.',
        };
      case 'materials':
        return {
          title: 'Módulo de Materiales y Logística',
          description: 'Requisición de insumos técnicos, control de inventario de morteros epóxicos, polímeros de carbono (CFRP), acero de refuerzo y equipos de ensayo.',
        };
      case 'team':
        return {
          title: 'Módulo de Equipo Técnico',
          description: 'Directorio de ingenieros especialistas, inspectores de campo, brigadas de emergencia y asignación de roles operativos.',
        };
      default:
        return {
          title: moduleName,
          description: 'Módulo operativo en proceso de desarrollo.',
        };
    }
  };

  const info = getDetails();

  return (
    <div id={`sipre-pending-${moduleType}`} className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      
      {/* Back button */}
      <button
        onClick={onBackToDashboard}
        className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al Centro de Operaciones</span>
      </button>

      {/* Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 shadow-inner">
          <Icon className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block">
            Módulo pendiente de habilitación
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {info.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {info.description}
          </p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 max-w-md mx-auto flex items-center justify-center space-x-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Este componente se integrará en la fase de ejecución de intervenciones.</span>
        </div>

        <div className="pt-2">
          <button
            onClick={onBackToDashboard}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/25 active:scale-95 transition-all"
          >
            Regresar al Inicio
          </button>
        </div>

      </div>

    </div>
  );
};
