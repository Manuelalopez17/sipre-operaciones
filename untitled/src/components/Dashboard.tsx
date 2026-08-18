import React from 'react';
import { Calendar, ClipboardList, FolderKanban, MapPin, Wrench, Boxes, Truck, CreditCard, Eye, ShieldCheck, ArrowRight } from 'lucide-react';
import { MainNavView } from './Header';
import { getVisits, getCases, getWorkFronts, getMaterialRequests, getMaterialDeliveries, getBillings, getPayments } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { getDisplayRole, getRoleCategory } from '../lib/roles';
import { VisitRecord } from '../types';

interface DashboardProps {
  onNavigate: (view: MainNavView) => void;
  onOpenNewCaseModal: () => void;
  onOpenScheduleVisitModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onOpenNewCaseModal, onOpenScheduleVisitModal }) => {
  const { user, profile } = useAuth();
  const visits = getVisits();
  const cases = getCases();
  const workFronts = getWorkFronts();
  const materialRequests = getMaterialRequests();
  const deliveries = getMaterialDeliveries();
  const billings = getBillings();
  const payments = getPayments();

  const role = getRoleCategory(profile?.role);
  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Usuario SIPRE';
  const userId = user?.id || '';
  const today = new Date().toISOString().split('T')[0];

  const assignedToMe = (v: VisitRecord) => {
    const assignedId = (v as any).responsibleProfessionalId || '';
    const assignedName = (v.responsibleProfessional || '').trim().toLowerCase();
    const myName = userName.trim().toLowerCase();
    return Boolean((userId && assignedId === userId) || (myName && assignedName === myName));
  };

  const myVisits = visits.filter(assignedToMe);
  const myVisitsToday = myVisits.filter(v => v.date === today);
  const myFronts = workFronts.filter(w => {
    const p = (w.responsibleTechnicalProfessional || '').toLowerCase();
    return p && (p.includes(userName.toLowerCase()) || userName.toLowerCase().includes(p));
  });

  const Card = ({ title, value, subtitle, icon: Icon, onClick }: any) => (
    <button onClick={onClick} className="text-left bg-slate-900 border border-slate-800 hover:border-cyan-700 rounded-2xl p-5 shadow-lg transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider font-bold text-slate-400">{title}</div>
          <div className="text-3xl font-black text-white mt-1">{value}</div>
          <div className="text-[11px] text-slate-500 mt-1">{subtitle}</div>
        </div>
        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800"><Icon className="w-5 h-5 text-cyan-400" /></div>
      </div>
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono font-bold uppercase tracking-widest">
          <ShieldCheck className="w-4 h-4" />Acceso por usuario autenticado
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">Hola, {userName}</h1>
        <p className="text-sm text-slate-300 mt-1">
          Rol activo: <strong className="text-cyan-400">{getDisplayRole(profile?.role)}</strong>. Esta vista y sus permisos se determinan por tu correo y perfil de Supabase.
        </p>
      </div>

      {role === 'PROFESIONAL' && (
        <div className="space-y-5">
          <div className="bg-cyan-950/30 border border-cyan-900 rounded-2xl p-4 text-sm text-cyan-100">
            Solo puedes iniciar, diligenciar y finalizar las visitas asignadas a tu propio usuario. Coordinación administra la agenda.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="Mis visitas de hoy" value={myVisitsToday.length} subtitle="Asignadas a tu usuario" icon={Calendar} onClick={() => onNavigate('visits')} />
            <Card title="Mis visitas" value={myVisits.length} subtitle="Programadas y ejecutadas" icon={ClipboardList} onClick={() => onNavigate('visits')} />
            <Card title="Mis frentes" value={myFronts.length} subtitle="Frentes bajo tu responsabilidad técnica" icon={Wrench} onClick={() => onNavigate('work-fronts')} />
          </div>
          {myVisitsToday.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h2 className="font-black text-white mb-3">Visitas asignadas hoy</h2>
              <div className="space-y-2">
                {myVisitsToday.map(v => (
                  <button key={v.id} onClick={() => onNavigate('visits')} className="w-full text-left bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-white text-sm">{v.clientName}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{v.address} · {v.startTime}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-cyan-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {role === 'COORDINADOR' && (
        <div className="space-y-5">
          <div className="bg-blue-950/30 border border-blue-900 rounded-2xl p-4 text-sm text-blue-100">
            Coordinación programa, edita, reasigna y elimina visitas. Puede seguir toda la operación, pero no modifica la inspección técnica diligenciada por los profesionales.
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={onOpenNewCaseModal} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-bold">+ Nuevo expediente</button>
            <button onClick={onOpenScheduleVisitModal} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold">+ Programar visita</button>
            <button onClick={() => onNavigate('agenda')} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold">Administrar agenda</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card title="Agenda de hoy" value={visits.filter(v => v.date === today).length} subtitle="Todas las visitas" icon={Calendar} onClick={() => onNavigate('agenda')} />
            <Card title="Visitas totales" value={visits.length} subtitle="Seguimiento operativo" icon={ClipboardList} onClick={() => onNavigate('visits')} />
            <Card title="Expedientes" value={cases.length} subtitle="Casos registrados" icon={FolderKanban} onClick={() => onNavigate('cases')} />
            <Card title="Frentes" value={workFronts.length} subtitle="Seguimiento de intervenciones" icon={Wrench} onClick={() => onNavigate('work-fronts')} />
          </div>
        </div>
      )}

      {role === 'GERENCIA' && (
        <div className="space-y-5">
          <div className="bg-purple-950/30 border border-purple-900 rounded-2xl p-4 text-sm text-purple-100 flex items-start gap-2">
            <Eye className="w-4 h-4 mt-0.5" />
            <span>Gerencia visualiza toda la operación en modo lectura. La única sección operativa editable para este rol es Cobros y Pagos.</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card title="Visitas" value={visits.length} subtitle="Vista completa" icon={ClipboardList} onClick={() => onNavigate('visits')} />
            <Card title="Expedientes" value={cases.length} subtitle="Vista completa" icon={FolderKanban} onClick={() => onNavigate('cases')} />
            <Card title="Frentes" value={workFronts.length} subtitle="Vista completa" icon={Wrench} onClick={() => onNavigate('work-fronts')} />
            <Card title="Cobros" value={billings.length} subtitle={`Pagos registrados: ${payments.length}`} icon={CreditCard} onClick={() => onNavigate('billing')} />
          </div>
        </div>
      )}

      {role === 'OPERATIVO' && (
        <div className="space-y-5">
          <div className="bg-amber-950/30 border border-amber-900 rounded-2xl p-4 text-sm text-amber-100">
            El personal operativo gestiona materiales, despachos y entregas. No puede iniciar visitas ni modificar información técnica del profesional.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="Frentes" value={workFronts.length} subtitle="Consulta para ejecución" icon={Wrench} onClick={() => onNavigate('work-fronts')} />
            <Card title="Materiales" value={materialRequests.length} subtitle="Solicitudes y preparación" icon={Boxes} onClick={() => onNavigate('materials')} />
            <Card title="Entregas" value={deliveries.length} subtitle="Despachos y recepción" icon={Truck} onClick={() => onNavigate('deliveries')} />
          </div>
        </div>
      )}
    </div>
  );
};
