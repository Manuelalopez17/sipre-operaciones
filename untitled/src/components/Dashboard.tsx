import React, { useState } from 'react';
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
  Boxes,
  Truck,
  CreditCard,
  CheckSquare,
  Users,
  Search,
  Sparkles,
  Camera,
  Play,
  Navigation,
  Eye,
  FileCheck,
  ChevronRight,
  DollarSign,
  Briefcase,
  Layers,
  Award
} from 'lucide-react';
import { MainNavView } from './Header';
import { 
  getVisits, 
  getCases, 
  getWorkFronts, 
  getMaterialRequests, 
  getMaterialDeliveries,
  getBillings,
  getPayments,
  getWorkLogs,
  addWorkFrontLogEntry,
  updateVisitStatus
} from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { getDisplayRole, getRoleCategory } from '../lib/roles';
import { VisitRecord, WorkFrontRecord } from '../types';

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
  const { user, profile } = useAuth();
  
  // Real data state
  const visits = getVisits();
  const cases = getCases();
  const workFronts = getWorkFronts();
  const materialRequests = getMaterialRequests();
  const deliveries = getMaterialDeliveries();
  const billings = getBillings();
  const payments = getPayments();

  const userRoleCategory = getRoleCategory(profile?.role);
  const [selectedRoleView, setSelectedRoleView] = useState<'PROFESIONAL' | 'COORDINADOR' | 'GERENCIA' | 'OPERATIVO'>(userRoleCategory);

  const todayStr = new Date().toISOString().split('T')[0];
  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Usuario SIPRE';
  const userId = user?.id || '';

  // -------------------------------------------------------------
  // Filtered queries for each specific view
  // -------------------------------------------------------------
  
  // Is this visit assigned to the current user?
  const isAssignedToUser = (v: VisitRecord) => {
    if (!userName && !userId) return false;
    const profName = userName.toLowerCase().trim();
    const assigned = (v.responsibleProfessional || '').toLowerCase().trim();
    const assignedId = (v as any).responsibleProfessionalId || '';
    if (userId && assignedId && userId === assignedId) return true;
    if (profName && assigned && (assigned.includes(profName) || profName.includes(assigned))) return true;
    return false;
  };

  // 1. PROFESSIONAL DATA
  const myVisitsToday = visits.filter(v => v.date === todayStr && isAssignedToUser(v));
  const myUpcomingVisits = visits.filter(v => v.date > todayStr && isAssignedToUser(v));
  const myVisitsInField = visits.filter(v => 
    isAssignedToUser(v) && 
    (v.status === 'EN RUTA' || v.status === 'EN SITIO' || v.status === 'EN INSPECCIÓN')
  );
  const myWorkFronts = workFronts.filter(w => {
    const resp = (w.responsibleTechnicalProfessional || '').toLowerCase();
    return resp.includes(userName.toLowerCase()) || userName.toLowerCase().includes(resp);
  });
  const myPendingReports = visits.filter(v => isAssignedToUser(v) && (v.status === 'TERMINADA' || v.status === 'EN INSPECCIÓN'));

  // 2. COORDINATOR DATA
  const coordinatorAgendaToday = visits.filter(v => v.date === todayStr);
  const coordinatorUnassignedVisits = visits.filter(v => !v.responsibleProfessional || v.responsibleProfessional === 'Por asignar' || v.responsibleProfessional === '');
  const coordinatorProfessionalsOnSite = visits.filter(v => v.status === 'EN SITIO' || v.status === 'EN RUTA');
  const coordinatorVisitsInProgress = visits.filter(v => 
    v.status === 'CONFIRMADA' || v.status === 'EN RUTA' || v.status === 'EN SITIO' || v.status === 'EN INSPECCIÓN'
  );
  const coordinatorActiveWorkFronts = workFronts.filter(w => w.status === 'EN EJECUCIÓN' || w.status === 'LISTO PARA INICIAR');
  const coordinatorPendingMaterials = materialRequests.filter(m => m.status === 'SOLICITADO' || m.status === 'EN REVISIÓN');

  // 3. GERENCIA DATA
  const totalVisitsCount = visits.length;
  const gerenciaActiveFronts = workFronts.filter(w => w.status === 'EN EJECUCIÓN' || w.status === 'LISTO PARA INICIAR');
  const gerenciaCompletedWork = workFronts.filter(w => w.status === 'CERRADO' || w.status === 'ENTREGADO');
  const gerenciaDeliveries = deliveries;
  const pendingBillingCount = billings.filter(b => b.paymentStatus === 'PENDIENTE DE COBRO' || b.paymentStatus === 'ANTICIPO PENDIENTE').length;
  const paidCount = billings.filter(b => b.paymentStatus === 'PAGADO').length;
  const totalPendingAmount = billings
    .filter(b => b.paymentStatus === 'PENDIENTE DE COBRO' || b.paymentStatus === 'ANTICIPO PENDIENTE')
    .reduce((acc, b) => acc + (b.totalAmount || 0), 0);
  const totalPaidAmount = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  // 4. OPERATIVE DATA
  const operativeActivitiesToday = [
    ...workFronts.filter(w => w.status === 'EN EJECUCIÓN').map(w => ({
      id: 'act-' + w.id,
      title: `Ejecución de actividades en ${w.propertyAddress}`,
      frontCode: w.frontCode,
      clientName: w.clientName,
      status: w.status,
      type: 'Frente de Obra'
    })),
    ...deliveries.filter(d => d.status === 'EN RUTA' || d.departureDateTime?.startsWith(todayStr)).map(d => ({
      id: 'del-' + d.id,
      title: `Despacho y entrega de insumos: ${d.deliveryNoteCode || d.deliveryNumber || d.id}`,
      frontCode: d.workFrontCode,
      clientName: d.driverCourierName || 'Entrega en ruta',
      status: d.status,
      type: 'Entrega'
    }))
  ];
  const operativeAssignedFronts = workFronts;
  const operativeMaterials = materialRequests;
  const operativeDeliveries = deliveries;

  // Quick execution log handler for operatives
  const [logModalFront, setLogModalFront] = useState<WorkFrontRecord | null>(null);
  const [logForm, setLogForm] = useState({
    title: '',
    description: '',
    progressPercentage: 10,
    weatherCondition: 'Despejado',
    personnelCount: 3,
  });
  const [logSuccessMsg, setLogSuccessMsg] = useState<string | null>(null);

  const handleQuickLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logModalFront) return;

    addWorkFrontLogEntry({
      id: 'LOG-' + Date.now(),
      workFrontId: logModalFront.id,
      date: todayStr,
      time: new Date().toTimeString().substring(0, 5),
      authorName: userName,
      authorRole: 'Operativo',
      title: logForm.title || 'Registro de avance diario',
      description: logForm.description,
      workProgressPercentage: Number(logForm.progressPercentage),
      weatherCondition: logForm.weatherCondition,
      photos: [],
      createdAt: new Date().toISOString(),
    });

    setLogSuccessMsg('Actividad de ejecución registrada con éxito.');
    setTimeout(() => {
      setLogSuccessMsg(null);
      setLogModalFront(null);
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Welcome & Perspective Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-cyan-500/10 via-blue-500/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                SIPRE
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Panel Personalizado
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
              Hola, {userName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-0.5">
              Rol activo: <span className="font-bold text-cyan-400">{getDisplayRole(profile?.role)}</span>. Configurado para la operación técnica en tiempo real.
            </p>
          </div>

          {/* Role Perspective Switcher for Initial Team Verification */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 px-2 hidden sm:inline">Vista:</span>
            
            <button
              onClick={() => setSelectedRoleView('PROFESIONAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedRoleView === 'PROFESIONAL'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Profesional
            </button>

            <button
              onClick={() => setSelectedRoleView('COORDINADOR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedRoleView === 'COORDINADOR'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Coordinador
            </button>

            <button
              onClick={() => setSelectedRoleView('GERENCIA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedRoleView === 'GERENCIA'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Gerencia
            </button>

            <button
              onClick={() => setSelectedRoleView('OPERATIVO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedRoleView === 'OPERATIVO'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Operativo
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. PROFESSIONAL HOME                                                      */}
      {/* ========================================================================= */}
      {selectedRoleView === 'PROFESIONAL' && (
        <div className="space-y-6" id="view-professional-home">
          
          {/* Quick CTA row for Professional */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2">
              <HardHat className="w-5 h-5 text-cyan-400" />
              <div>
                <h2 className="text-sm font-bold text-white">Espacio de Trabajo del Profesional</h2>
                <p className="text-xs text-slate-400">Inspección de campo, patología estructural, dictamen técnico y dirección de frentes.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('field-mode')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-md active:scale-95"
              >
                <Smartphone className="w-4 h-4" />
                <span>INICIAR MODO CAMPO</span>
              </button>
              <button
                onClick={() => onNavigate('visits')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2 rounded-xl border border-slate-700"
              >
                Mis Visitas Asignadas
              </button>
            </div>
          </div>

          {/* 5 Specific Professional Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* 1. MIS VISITAS DE HOY */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">MIS VISITAS DE HOY</h3>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {myVisitsToday.length}
                </span>
              </div>

              {myVisitsToday.length > 0 ? (
                <div className="space-y-2.5">
                  {myVisitsToday.map(v => (
                    <div key={v.id} className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">{v.clientName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          <span>{v.address}, {v.municipality}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Horario: {v.startTime} - {v.estimatedEndTime} | Estado: <span className="text-cyan-300 font-bold">{v.status}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onNavigate('field-mode')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1"
                      >
                        <Play className="w-3 h-3" />
                        <span>Inspeccionar</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/40">
                  No tienes visitas programadas para hoy.
                </div>
              )}
            </div>

            {/* 2. PRÓXIMAS VISITAS */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">PRÓXIMAS VISITAS</h3>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                  {myUpcomingVisits.length}
                </span>
              </div>

              {myUpcomingVisits.length > 0 ? (
                <div className="space-y-2.5">
                  {myUpcomingVisits.map(v => (
                    <div key={v.id} className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">{v.clientName}</div>
                        <div className="text-[11px] text-slate-400">{v.address}</div>
                        <div className="text-[10px] text-cyan-400 font-mono mt-0.5">Fecha: {v.date} ({v.startTime})</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">{v.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/40">
                  No hay visitas futuras agendadas en tu calendario.
                </div>
              )}
            </div>

            {/* 3. VISITAS EN CAMPO */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Navigation className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">VISITAS EN CAMPO</h3>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {myVisitsInField.length}
                </span>
              </div>

              {myVisitsInField.length > 0 ? (
                <div className="space-y-2.5">
                  {myVisitsInField.map(v => (
                    <div key={v.id} className="p-3 bg-emerald-950/20 border border-emerald-800/60 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">{v.clientName}</div>
                        <div className="text-[11px] text-slate-300">{v.address}</div>
                        <div className="text-[10px] text-emerald-400 font-bold mt-0.5">Estado: {v.status} 📍</div>
                      </div>
                      <button
                        onClick={() => onNavigate('field-mode')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1"
                      >
                        <span>Continuar</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/40">
                  No tienes inspecciones activas en ruta o en sitio en este momento.
                </div>
              )}
            </div>

            {/* 4. FRENTES A MI CARGO */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">FRENTES A MI CARGO</h3>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                  {myWorkFronts.length}
                </span>
              </div>

              {myWorkFronts.length > 0 ? (
                <div className="space-y-2.5">
                  {myWorkFronts.map(w => (
                    <div key={w.id} className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">{w.frontCode} - {w.clientName}</div>
                        <div className="text-[11px] text-slate-400">{w.propertyAddress}</div>
                        <div className="text-[10px] text-purple-400 mt-0.5">Avance: {w.progressCategory || 'En proceso'}</div>
                      </div>
                      <button
                        onClick={() => onNavigate('work-fronts')}
                        className="bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg"
                      >
                        Gestionar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/40">
                  No tienes frentes de obra técnicos bajo tu responsabilidad directa.
                </div>
              )}
            </div>

            {/* 5. INFORMES PENDIENTES */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">INFORMES PENDIENTES</h3>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                  {myPendingReports.length}
                </span>
              </div>

              {myPendingReports.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {myPendingReports.map(v => (
                    <div key={v.id} className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">{v.clientName}</div>
                        <div className="text-[11px] text-slate-400">{v.address}</div>
                        <div className="text-[10px] text-amber-400 font-bold mt-0.5">Visita finalizada - Pendiente dictamen y firma</div>
                      </div>
                      <button
                        onClick={() => onNavigate('technical-review')}
                        className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                      >
                        Emitir Concepto
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/40">
                  No hay informes técnicos pendientes por emitir o aprobar.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. COORDINATOR HOME                                                       */}
      {/* ========================================================================= */}
      {selectedRoleView === 'COORDINADOR' && (
        <div className="space-y-6" id="view-coordinator-home">
          
          {/* Quick CTA row for Coordinator */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2">
              <FolderKanban className="w-5 h-5 text-blue-400" />
              <div>
                <h2 className="text-sm font-bold text-white">Centro de Coordinación Operativa</h2>
                <p className="text-xs text-slate-400">Programación de agenda, asignación de profesionales, control de frentes y materiales.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenNewCaseModal}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-md active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Nuevo Expediente</span>
              </button>
              <button
                onClick={onOpenScheduleVisitModal}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-md active:scale-95"
              >
                <Calendar className="w-4 h-4" />
                <span>+ Programar Visita</span>
              </button>
            </div>
          </div>

          {/* 6 Specific Coordinator Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* 1. AGENDA DE HOY */}
            <div 
              onClick={() => onNavigate('agenda')}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 cursor-pointer hover:border-blue-700/60 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-800/60">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-2xl font-mono font-black text-white">{coordinatorAgendaToday.length}</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">AGENDA DE HOY</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Visitas técnicas programadas para la jornada de hoy.</p>
              </div>
            </div>

            {/* 2. VISITAS SIN ASIGNAR */}
            <div 
              onClick={() => onNavigate('visits')}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 cursor-pointer hover:border-amber-700/60 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-800/60">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-2xl font-mono font-black text-white">{coordinatorUnassignedVisits.length}</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">VISITAS SIN ASIGNAR</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Visitas pendientes de asignar profesional responsable.</p>
              </div>
            </div>

            {/* 3. PROFESIONALES EN SITIO */}
            <div 
              onClick={() => onNavigate('visits')}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 cursor-pointer hover:border-emerald-700/60 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-2xl font-mono font-black text-white">{coordinatorProfessionalsOnSite.length}</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">PROFESIONALES EN SITIO</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Técnicos con reporte GPS de llegada al inmueble.</p>
              </div>
            </div>

            {/* 4. VISITAS EN CURSO */}
            <div 
              onClick={() => onNavigate('visits')}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 cursor-pointer hover:border-cyan-700/60 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/60">
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-2xl font-mono font-black text-white">{coordinatorVisitsInProgress.length}</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">VISITAS EN CURSO</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Confirmadas, en ruta o en inspección activa.</p>
              </div>
            </div>

            {/* 5. FRENTES ACTIVOS */}
            <div 
              onClick={() => onNavigate('work-fronts')}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 cursor-pointer hover:border-purple-700/60 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-800/60">
                  <Wrench className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-2xl font-mono font-black text-white">{coordinatorActiveWorkFronts.length}</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">FRENTES ACTIVOS</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Obras de reparación e intervención en ejecución.</p>
              </div>
            </div>

            {/* 6. MATERIALES PENDIENTES */}
            <div 
              onClick={() => onNavigate('materials')}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 cursor-pointer hover:border-orange-700/60 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-orange-950/60 border border-orange-800/60">
                  <Boxes className="w-5 h-5 text-orange-400" />
                </div>
                <span className="text-2xl font-mono font-black text-white">{coordinatorPendingMaterials.length}</span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">MATERIALES PENDIENTES</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Solicitudes de insumos por despachar o recibir.</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. GERENCIA HOME                                                          */}
      {/* ========================================================================= */}
      {selectedRoleView === 'GERENCIA' && (
        <div className="space-y-6" id="view-gerencia-home">
          
          {/* Executive Overview Header */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-purple-950 border border-purple-800">
                <Briefcase className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">Panel Directivo y de Gerencia</h2>
                <p className="text-xs text-slate-400">Supervisión integral de operaciones, flujo de caja, frentes de obra y trazabilidad.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('billing')}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow"
              >
                <CreditCard className="w-4 h-4" />
                <span>Gestión de Cobros</span>
              </button>
              <button
                onClick={() => onNavigate('cases')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700"
              >
                Todos los Expedientes
              </button>
            </div>
          </div>

          {/* 7 Specific Gerencia Sections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. OPERACIÓN HOY */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">OPERACIÓN HOY</span>
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-mono font-black text-white">
                {coordinatorAgendaToday.length} <span className="text-xs text-slate-400 font-normal">visitas hoy</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {coordinatorProfessionalsOnSite.length} profesionales activos en sitio
              </div>
            </div>

            {/* 2. VISITAS */}
            <div 
              onClick={() => onNavigate('visits')}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow space-y-2 cursor-pointer hover:border-slate-700"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">VISITAS TOTALES</span>
                <Calendar className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-mono font-black text-white">{totalVisitsCount}</div>
              <div className="text-[11px] text-slate-400">
                {visits.filter(v => v.status === 'TERMINADA').length} finalizadas con éxito
              </div>
            </div>

            {/* 3. FRENTES ACTIVOS */}
            <div 
              onClick={() => onNavigate('work-fronts')}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow space-y-2 cursor-pointer hover:border-slate-700"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">FRENTES ACTIVOS</span>
                <Wrench className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-mono font-black text-white">{gerenciaActiveFronts.length}</div>
              <div className="text-[11px] text-slate-400">
                Obras civiles y reparaciones en curso
              </div>
            </div>

            {/* 4. TRABAJOS TERMINADOS */}
            <div 
              onClick={() => onNavigate('work-fronts')}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow space-y-2 cursor-pointer hover:border-slate-700"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">TRABAJOS TERMINADOS</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-mono font-black text-white">{gerenciaCompletedWork.length}</div>
              <div className="text-[11px] text-slate-400">
                Intervenciones y entregas técnicas
              </div>
            </div>

            {/* 5. ENTREGAS */}
            <div 
              onClick={() => onNavigate('deliveries')}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow space-y-2 cursor-pointer hover:border-slate-700"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">ENTREGAS Y DESPACHOS</span>
                <Truck className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-mono font-black text-white">{gerenciaDeliveries.length}</div>
              <div className="text-[11px] text-slate-400">
                Remisiones e insumos enviados
              </div>
            </div>

            {/* 6. PENDIENTE DE COBRO */}
            <div 
              onClick={() => onNavigate('billing')}
              className="bg-slate-900 border border-orange-900/60 rounded-2xl p-4 shadow space-y-2 cursor-pointer hover:border-orange-700"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-300">PENDIENTE DE COBRO</span>
                <DollarSign className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-2xl font-mono font-black text-orange-400">
                ${totalPendingAmount.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400">
                {pendingBillingCount} cuentas de cobro pendientes
              </div>
            </div>

            {/* 7. PAGADO */}
            <div 
              onClick={() => onNavigate('billing')}
              className="bg-slate-900 border border-emerald-900/60 rounded-2xl p-4 shadow space-y-2 cursor-pointer hover:border-emerald-700 sm:col-span-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300">PAGADO / RECAUDADO</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-mono font-black text-emerald-400">
                ${totalPaidAmount.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400">
                {paidCount} facturas y anticipos recaudados exitosamente
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. OPERATIVE HOME                                                         */}
      {/* ========================================================================= */}
      {selectedRoleView === 'OPERATIVO' && (
        <div className="space-y-6" id="view-operative-home">
          
          {/* Quick Operative Banner */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-950 border border-amber-800">
                <HardHat className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">Panel Operativo de Campo</h2>
                <p className="text-xs text-slate-400">
                  Control de actividades asignadas, frentes de obra, recepción de materiales y registro de bitácora.
                </p>
              </div>
            </div>
            <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-400">
              <span className="text-amber-400 font-bold">Nota de Rol:</span> Decisiones estructurales reservadas para el profesional.
            </div>
          </div>

          {/* 5 Specific Operative Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* 1. MIS ACTIVIDADES HOY */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <CheckSquare className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">MIS ACTIVIDADES HOY</h3>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                  {operativeActivitiesToday.length}
                </span>
              </div>

              {operativeActivitiesToday.length > 0 ? (
                <div className="space-y-2.5">
                  {operativeActivitiesToday.map(act => (
                    <div key={act.id} className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">{act.title}</div>
                        <div className="text-[11px] text-slate-400">Frente: {act.frontCode} | Cliente: {act.clientName}</div>
                        <div className="text-[10px] text-amber-400 font-bold mt-0.5">{act.type} - {act.status}</div>
                      </div>
                      <button
                        onClick={() => {
                          const front = workFronts.find(w => w.frontCode === act.frontCode);
                          if (front) setLogModalFront(front);
                        }}
                        className="bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg"
                      >
                        Registrar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/40">
                  No hay actividades operativas asignadas para hoy.
                </div>
              )}
            </div>

            {/* 2. FRENTES ASIGNADOS */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">FRENTES ASIGNADOS</h3>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {operativeAssignedFronts.length}
                </span>
              </div>

              {operativeAssignedFronts.length > 0 ? (
                <div className="space-y-2.5">
                  {operativeAssignedFronts.slice(0, 4).map(w => (
                    <div key={w.id} className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">{w.frontCode} - {w.clientName}</div>
                        <div className="text-[11px] text-slate-400">{w.propertyAddress}</div>
                        <div className="text-[10px] text-cyan-400 mt-0.5">Estado: {w.status}</div>
                      </div>
                      <button
                        onClick={() => setLogModalFront(w)}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg"
                      >
                        Bitácora
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/40">
                  No hay frentes asignados actualmente.
                </div>
              )}
            </div>

            {/* 3. MATERIALES */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Boxes className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">MATERIALES</h3>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-orange-950 text-orange-300 border border-orange-800">
                  {operativeMaterials.length}
                </span>
              </div>

              {operativeMaterials.length > 0 ? (
                <div className="space-y-2.5">
                  {operativeMaterials.slice(0, 3).map(m => (
                    <div key={m.id} className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">{m.requestCode || m.requestNumber || m.id} - {m.workFrontCode || 'Frente'}</div>
                        <div className="text-[11px] text-slate-400">{m.items?.length || 0} ítems solicitados</div>
                        <div className="text-[10px] text-orange-400 font-bold mt-0.5">Estado: {m.status}</div>
                      </div>
                      <button
                        onClick={() => onNavigate('materials')}
                        className="bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg"
                      >
                        Ver Insumos
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/40">
                  No hay solicitudes de materiales pendientes.
                </div>
              )}
            </div>

            {/* 4. ENTREGAS */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">ENTREGAS</h3>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {operativeDeliveries.length}
                </span>
              </div>

              {operativeDeliveries.length > 0 ? (
                <div className="space-y-2.5">
                  {operativeDeliveries.slice(0, 3).map(d => (
                    <div key={d.id} className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">{d.deliveryNoteCode || d.deliveryNumber || d.id} ({d.workFrontCode || 'Frente'})</div>
                        <div className="text-[11px] text-slate-400">{d.driverCourierName || 'Entrega'}</div>
                        <div className="text-[10px] text-indigo-400 font-bold mt-0.5">{d.status}</div>
                      </div>
                      <button
                        onClick={() => onNavigate('deliveries')}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg"
                      >
                        Recepción
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/40">
                  No hay despachos ni entregas registradas.
                </div>
              )}
            </div>

            {/* 5. REGISTRO DE EJECUCIÓN */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">REGISTRO DE EJECUCIÓN (BITÁCORA EN SITIO)</h3>
                </div>
                <button
                  onClick={() => onNavigate('work-fronts')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-bold"
                >
                  Ver Frentes Completos →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">1. Fotos ANTES / DURANTE / DESPUÉS</span>
                  <p className="text-slate-300 text-[11px]">Sube evidencia fotográfica directa de la ejecución de actividades.</p>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">2. Cuadrilla en Sitio</span>
                  <p className="text-slate-300 text-[11px]">Registra el número de operarios y oficiales activos en el inmueble.</p>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">3. Recepción de Materiales</span>
                  <p className="text-slate-300 text-[11px]">Confirma las cantidades de insumos recibidos a conformidad.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal: Quick Log Registration for Operatives */}
      {logModalFront && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400">{logModalFront.frontCode}</span>
                <h3 className="text-base font-black text-white">Registro de Ejecución Diaria</h3>
              </div>
              <button
                onClick={() => setLogModalFront(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {logSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-200 text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{logSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleQuickLogSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Título de la Actividad</label>
                <input
                  type="text"
                  value={logForm.title}
                  onChange={e => setLogForm({ ...logForm, title: e.target.value })}
                  placeholder="Ej: Picado de recubrimiento y colocación de apuntalamiento"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Observaciones y Avance Ejecutado</label>
                <textarea
                  rows={3}
                  value={logForm.description}
                  onChange={e => setLogForm({ ...logForm, description: e.target.value })}
                  placeholder="Detalla las labores realizadas por la cuadrilla en la jornada..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Personal en Sitio</label>
                  <input
                    type="number"
                    value={logForm.personnelCount}
                    onChange={e => setLogForm({ ...logForm, personnelCount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">% Estimado de Avance</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={logForm.progressPercentage}
                    onChange={e => setLogForm({ ...logForm, progressPercentage: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setLogModalFront(null)}
                  className="bg-slate-800 text-slate-300 px-4 py-2 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl font-bold"
                >
                  Guardar Bitácora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
