import React from 'react';
import { 
  FolderKanban, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  FileText, 
  Wrench, 
  PlusCircle, 
  Smartphone, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Clock, 
  HardHat,
  Search,
  Sparkles
} from 'lucide-react';
import { MainNavView } from './Header';

interface DashboardProps {
  onNavigate: (view: MainNavView) => void;
  onOpenNewCaseModal: () => void;
  onOpenScheduleVisitModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onOpenNewCaseModal,
  onOpenScheduleVisitModal,
}) => {
  // Operational counters must strictly remain at zero
  const metrics = [
    {
      id: 'active-cases',
      title: 'Expedientes activos',
      count: 0,
      icon: FolderKanban,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-950/40',
      borderColor: 'border-cyan-800/60',
      subtext: 'Casos en gestión técnica',
      targetView: 'cases' as MainNavView,
    },
    {
      id: 'scheduled-today',
      title: 'Visitas programadas hoy',
      count: 0,
      icon: Calendar,
      color: 'text-blue-400',
      bgColor: 'bg-blue-950/40',
      borderColor: 'border-blue-800/60',
      subtext: 'Agendadas para la jornada',
      targetView: 'agenda' as MainNavView,
    },
    {
      id: 'field-visits',
      title: 'Visitas en campo',
      count: 0,
      icon: MapPin,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/40',
      borderColor: 'border-emerald-800/60',
      subtext: 'Inspectores activos en terreno',
      targetView: 'visits' as MainNavView,
    },
    {
      id: 'pending-review',
      title: 'Pendientes de revisión técnica',
      count: 0,
      icon: FileText,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/40',
      borderColor: 'border-amber-800/60',
      subtext: 'Esperando concepto especialista',
      targetView: 'technical-review' as MainNavView,
    },
    {
      id: 'pending-approval',
      title: 'Pendientes aprobación cliente',
      count: 0,
      icon: CheckCircle2,
      color: 'text-purple-400',
      bgColor: 'bg-purple-950/40',
      borderColor: 'border-purple-800/60',
      subtext: 'Propuestas enviadas',
      targetView: 'client-approval' as MainNavView,
    },
    {
      id: 'active-interventions',
      title: 'Intervenciones activas',
      count: 0,
      icon: Wrench,
      color: 'text-rose-400',
      bgColor: 'bg-rose-950/40',
      borderColor: 'border-rose-800/60',
      subtext: 'Obras y reparaciones en curso',
      targetView: 'interventions' as MainNavView,
    },
  ];

  return (
    <div id="sipre-operational-dashboard" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                SIPRE • Plataforma Operativa
              </span>
              <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Sistema Listo</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Centro de Operaciones Técnicas
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Gestión centralizada del ciclo de vida de expedientes: Solicitud, Programación de Visitas, Inspección de Patología Estructural en Terreno, Revisión Técnica y Aprobación de Intervención.
            </p>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-dash-new-case"
              onClick={onOpenNewCaseModal}
              className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-cyan-400" />
              <span>+ Nuevo Expediente</span>
            </button>

            <button
              id="btn-dash-schedule-visit"
              onClick={onOpenScheduleVisitModal}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-cyan-600/25 border border-cyan-400/40 transition-all active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              <span>+ Programar Visita</span>
            </button>

            <button
              id="btn-dash-field-mode"
              onClick={() => onNavigate('field-mode')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-600/25 border border-emerald-400/40 transition-all active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              <span>Iniciar Modo Campo</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Main Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              id={`metric-card-${card.id}`}
              onClick={() => onNavigate(card.targetView)}
              className={`${card.bgColor} border ${card.borderColor} rounded-2xl p-5 shadow-lg hover:border-slate-600 cursor-pointer transition-all duration-200 group flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-300 block mb-1">
                    {card.title}
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                    {card.count}
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-slate-900/80 border border-slate-800 ${card.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">{card.subtext}</span>
                <span className="text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center font-bold text-[11px]">
                  Ver <ArrowRight className="w-3 h-3 ml-1" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Operational Workflow Map */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Activity className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white">Flujo Operativo Integrado de Casos</h2>
              <p className="text-xs text-slate-400">Ciclo estandarizado de atención técnica y peritaje estructural</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
            Fase 1: Hasta Aprobación Cliente
          </span>
        </div>

        {/* Visual Progress Steps */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
          {[
            { step: '1', title: 'Nuevo Expediente', desc: 'Registro de solicitud', view: 'cases' as MainNavView },
            { step: '2', title: 'Agendamiento', desc: 'Asignación y fecha', view: 'agenda' as MainNavView },
            { step: '3', title: 'Confirmación', desc: 'Validación con cliente', view: 'visits' as MainNavView },
            { step: '4', title: 'Modo Campo', desc: 'Inspección técnica', view: 'field-mode' as MainNavView },
            { step: '5', title: 'Visita Completa', desc: 'Registro de hallazgos', view: 'visits' as MainNavView },
            { step: '6', title: 'Revisión Técnica', desc: 'Concepto profesional', view: 'technical-review' as MainNavView },
            { step: '7', title: 'Aprobación Cliente', desc: 'Aceptación propuesta', view: 'client-approval' as MainNavView },
          ].map((item, idx) => (
            <div
              key={item.step}
              onClick={() => onNavigate(item.view)}
              className="bg-slate-950/70 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 p-3 rounded-xl cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-400 text-[10px] font-bold font-mono flex items-center justify-center mb-1.5">
                  {item.step}
                </span>
                <p className="text-xs font-bold text-white line-clamp-1">{item.title}</p>
                <p className="text-[10px] text-slate-400 line-clamp-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State Sections for Operational Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Today's Scheduled Visits Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Visitas Programadas para Hoy</h3>
            </div>
            <button
              onClick={() => onNavigate('agenda')}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300"
            >
              Ver Agenda Completa
            </button>
          </div>

          <div className="py-8 text-center space-y-3 bg-slate-950/60 rounded-xl border border-slate-800/80 p-6">
            <div className="w-12 h-12 mx-auto rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">No hay visitas programadas para hoy</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Utiliza el botón de programación para coordinar una nueva inspección técnica o peritaje estructural.
              </p>
            </div>
            <button
              onClick={onOpenScheduleVisitModal}
              className="mt-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 px-4 py-2 rounded-lg text-xs font-bold inline-flex items-center space-x-1.5 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Programar Primera Visita</span>
            </button>
          </div>
        </div>

        {/* Active Cases & Field Inspections Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <FolderKanban className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Expedientes Recientes</h3>
            </div>
            <button
              onClick={() => onNavigate('cases')}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300"
            >
              Ver Todos los Expedientes
            </button>
          </div>

          <div className="py-8 text-center space-y-3 bg-slate-950/60 rounded-xl border border-slate-800/80 p-6">
            <div className="w-12 h-12 mx-auto rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">No hay expedientes registrados</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Registra un nuevo caso para iniciar el flujo de atención, asignación de equipo y seguimiento.
              </p>
            </div>
            <button
              onClick={onOpenNewCaseModal}
              className="mt-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-xs font-bold inline-flex items-center space-x-1.5 transition-all shadow"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Crear Nuevo Expediente</span>
            </button>
          </div>
        </div>

      </div>

      {/* Engineering Norms and Emergency Protocol Quick Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Protocolo alineado con <strong>NSR-10 Título A/C</strong>, <strong>AIS 410</strong> y <strong>FEMA P-2055 / ATC-20</strong>.</span>
        </div>
        <button
          onClick={() => onNavigate('references')}
          className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-1"
        >
          <span>Consultar Normas Técnicas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
