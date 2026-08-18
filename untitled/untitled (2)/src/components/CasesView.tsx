import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  Search, 
  Filter, 
  PlusCircle, 
  Calendar, 
  MapPin, 
  UserCheck, 
  Building, 
  ArrowUpDown, 
  History, 
  FileText, 
  Clock, 
  AlertCircle,
  Eye,
  X,
  Wrench,
  Boxes,
  Truck,
  CreditCard,
  Users,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { CaseRecord, CaseStatus, CasePriority, VisitRecord, WorkFrontRecord } from '../types';
import { getCases, getVisits, getWorkFronts, saveCase, updateCaseStatus } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { recordActivity } from '../lib/supabaseService';

interface CasesViewProps {
  onOpenNewCaseModal: () => void;
  onOpenScheduleVisitModal: (caseRecord?: CaseRecord) => void;
  onStartFieldMode: (visit?: VisitRecord) => void;
  onNavigateToWorkFronts?: () => void;
}

export const CasesView: React.FC<CasesViewProps> = ({
  onOpenNewCaseModal,
  onOpenScheduleVisitModal,
  onStartFieldMode,
  onNavigateToWorkFronts,
}) => {
  const { user, profile } = useAuth();
  const [casesList, setCasesList] = useState<CaseRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterMunicipality, setFilterMunicipality] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  
  // 14 Sub-sections / tabs inside the case detail
  const [activeCaseTab, setActiveCaseTab] = useState<
    | 'resumen'
    | 'visitas'
    | 'inspeccion'
    | 'patologias'
    | 'decision'
    | 'reparaciones'
    | 'frente_obra'
    | 'materiales'
    | 'personal'
    | 'bitacora'
    | 'entregas'
    | 'facturacion'
    | 'evidencias'
    | 'historial'
  >('resumen');

  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const reloadCases = () => {
    setCasesList(getCases());
  };

  useEffect(() => {
    reloadCases();
  }, []);

  const handleCaseAction = (actionName: string, newStatus?: CaseStatus) => {
    const actorName = profile?.full_name || 'Usuario Operativo';
    const actorRole = (profile?.role as any) || 'Coordinator';

    if (selectedCase && newStatus) {
      updateCaseStatus(selectedCase.id, newStatus, actorName, `Acción ejecutada: ${actionName}`);
      recordActivity(
        `Estado de expediente actualizado a ${newStatus} (${actionName})`,
        { previousStatus: selectedCase.status, newStatus },
        {
          userId: user?.id,
          userName: actorName,
          userRole: profile?.role,
          caseId: selectedCase.id,
          entityType: 'case',
          entityId: selectedCase.id,
        }
      );
      reloadCases();
      setSelectedCase({ ...selectedCase, status: newStatus });
    }
    setActionNotice(`Acción "${actionName}" ejecutada exitosamente.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const filteredCases = casesList.filter((c) => {
    const matchesSearch = 
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.municipality.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || c.priority === filterPriority;
    const matchesMunicipality = filterMunicipality === 'all' || c.municipality === filterMunicipality;

    return matchesSearch && matchesStatus && matchesPriority && matchesMunicipality;
  });

  const getStatusBadge = (status: CaseStatus) => {
    const s = (status || '').toUpperCase();
    if (s.includes('NUEVO')) return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-950 text-blue-300 border border-blue-800">NUEVO</span>;
    if (s.includes('VISITA PENDIENTE')) return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-800">VISITA PENDIENTE</span>;
    if (s.includes('VISITA PROGRAMADA')) return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">VISITA PROGRAMADA</span>;
    if (s.includes('VISITA EN CURSO')) return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 animate-pulse">VISITA EN CURSO</span>;
    if (s.includes('INSPECCIÓN REALIZADA')) return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-950 text-purple-300 border border-purple-800">INSPECCIÓN REALIZADA</span>;
    if (s.includes('EN REVISIÓN TÉCNICA')) return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-950 text-orange-300 border border-orange-800">EN REVISIÓN TÉCNICA</span>;
    if (s.includes('CONCEPTO EMITIDO')) return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">CONCEPTO EMITIDO</span>;
    if (s.includes('EN REPARACIÓN')) return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950 text-rose-300 border border-rose-800">EN REPARACIÓN</span>;
    if (s.includes('ENTREGADO')) return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-950 text-teal-300 border border-teal-800">ENTREGADO</span>;
    if (s.includes('CERRADO')) return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">CERRADO</span>;
    return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300">{status}</span>;
  };

  const getPriorityBadge = (p: CasePriority) => {
    if (p === 'Alta' || p === 'Urgente') return <span className="text-red-400 font-bold">● {p}</span>;
    if (p === 'Normal') return <span className="text-amber-400 font-bold">● Normal</span>;
    return <span className="text-emerald-400 font-bold">● Baja</span>;
  };

  return (
    <div id="sipre-cases-screen" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header and New Case CTA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
              Expediente Central
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2.5 mt-1">
            <FolderKanban className="w-6 h-6 text-cyan-400" />
            <span>Expedientes Técnicos</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestión completa del ciclo de vida: solicitud, agendamiento, peritaje de campo, frente de obra, entregas y cobros.
          </p>
        </div>

        <button
          id="btn-cases-new-case"
          onClick={onOpenNewCaseModal}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-cyan-600/25 border border-cyan-400/40 transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ NUEVO EXPEDIENTE</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-cyan-950/90 border border-cyan-500 text-cyan-200 font-bold text-xs text-center flex items-center justify-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Search & Multi-Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código (ej. EXP-2026-0001), cliente, dirección o municipio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Filter Selects */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Todos los Estados</option>
              <option value="NUEVO">NUEVO</option>
              <option value="VISITA PENDIENTE">VISITA PENDIENTE</option>
              <option value="VISITA PROGRAMADA">VISITA PROGRAMADA</option>
              <option value="VISITA EN CURSO">VISITA EN CURSO</option>
              <option value="INSPECCIÓN REALIZADA">INSPECCIÓN REALIZADA</option>
              <option value="EN REVISIÓN TÉCNICA">EN REVISIÓN TÉCNICA</option>
              <option value="CONCEPTO EMITIDO">CONCEPTO EMITIDO</option>
              <option value="EN REPARACIÓN">EN REPARACIÓN</option>
              <option value="ENTREGADO">ENTREGADO</option>
              <option value="CERRADO">CERRADO</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Todas las Prioridades</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>

            <select
              value={filterMunicipality}
              onChange={(e) => setFilterMunicipality(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Todos los Municipios</option>
              <option value="Medellín">Medellín</option>
              <option value="Envigado">Envigado</option>
              <option value="Itagüí">Itagüí</option>
              <option value="Bello">Bello</option>
              <option value="Sabaneta">Sabaneta</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cases Table / Grid */}
      {filteredCases.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 pl-5">Código</th>
                  <th className="p-3.5">Cliente / Inmueble</th>
                  <th className="p-3.5">Ubicación</th>
                  <th className="p-3.5">Prioridad</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5">Coordinador</th>
                  <th className="p-3.5 pr-5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="p-3.5 pl-5 font-mono font-bold text-cyan-400">
                      {c.code}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-white block">{c.clientName}</span>
                      <span className="text-[11px] text-slate-400">{c.propertyType}</span>
                    </td>
                    <td className="p-3.5">
                      <span>{c.address}</span>
                      <span className="text-[11px] text-slate-500 block">{c.municipality}, {c.department}</span>
                    </td>
                    <td className="p-3.5">
                      {getPriorityBadge(c.priority)}
                    </td>
                    <td className="p-3.5">
                      {getStatusBadge(c.status)}
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {c.responsibleCoordinator || 'Por asignar'}
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <button
                        onClick={() => setSelectedCase(c)}
                        className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3 py-1.5 rounded-lg font-bold border border-slate-700 hover:border-cyan-500/50 flex items-center space-x-1 ml-auto transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Detalle</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600">
            <FolderKanban className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No hay expedientes registrados</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Todos los contadores están en cero. Puedes crear un nuevo expediente técnico con el cliente y predio para iniciar la gestión operativa.
            </p>
          </div>
          <button
            onClick={onOpenNewCaseModal}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center space-x-2 shadow-lg shadow-cyan-600/20 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ NUEVO EXPEDIENTE</span>
          </button>
        </div>
      )}

      {/* ========================================================
          DETALLE COMPLETO DEL EXPEDIENTE (14 SUB-SECTIONS / TABS)
         ======================================================== */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            
            {/* Modal Top Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {selectedCase.code}
                  </span>
                  {getStatusBadge(selectedCase.status)}
                  {getPriorityBadge(selectedCase.priority)}
                </div>
                <h2 className="text-lg font-black text-white mt-1">
                  {selectedCase.clientName}
                </h2>
                <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{selectedCase.address}, {selectedCase.municipality}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedCase(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Ribbon on Case */}
            <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center gap-1.5 text-xs">
              <button
                onClick={() => {
                  setSelectedCase(null);
                  onOpenScheduleVisitModal(selectedCase);
                }}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>AGENDAR VISITA</span>
              </button>

              <button
                onClick={() => {
                  setSelectedCase(null);
                  onStartFieldMode();
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>INICIAR VISITA</span>
              </button>

              <button
                onClick={() => handleCaseAction('EMITIR CONCEPTO', 'INTERVENTION_DECISION')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>EMITIR CONCEPTO</span>
              </button>

              <button
                onClick={() => handleCaseAction('ENVIAR APROBACIÓN AL CLIENTE', 'CLIENT_APPROVAL')}
                className="bg-purple-600 hover:bg-purple-500 text-white px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ENVIAR APROBACIÓN</span>
              </button>

              <button
                onClick={() => {
                  handleCaseAction('CREAR FRENTE DE OBRA', 'INTERVENTION');
                  if (onNavigateToWorkFronts) {
                    setSelectedCase(null);
                    onNavigateToWorkFronts();
                  }
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>CREAR FRENTE OBRA</span>
              </button>

              <button
                onClick={() => handleCaseAction('CERRAR EXPEDIENTE', 'CLOSED')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg font-bold border border-slate-700 ml-auto"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>CERRAR</span>
              </button>
            </div>

            {/* 14 Sub-sections / Tabs Navigation */}
            <div className="bg-slate-950 border-b border-slate-800 px-3 py-2 overflow-x-auto flex space-x-1">
              {[
                { id: 'resumen', label: 'Resumen' },
                { id: 'visitas', label: 'Visitas' },
                { id: 'inspeccion', label: 'Inspección' },
                { id: 'patologias', label: 'Patologías' },
                { id: 'decision', label: 'Decisión' },
                { id: 'reparaciones', label: 'Reparaciones' },
                { id: 'frente_obra', label: 'Frente de Obra' },
                { id: 'materiales', label: 'Materiales' },
                { id: 'personal', label: 'Personal' },
                { id: 'bitacora', label: 'Bitácora' },
                { id: 'entregas', label: 'Entregas' },
                { id: 'facturacion', label: 'Facturación' },
                { id: 'evidencias', label: 'Evidencias' },
                { id: 'historial', label: 'Auditoría' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCaseTab(tab.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                    activeCaseTab === tab.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sub-section Body */}
            <div className="p-5 overflow-y-auto flex-1 text-xs text-slate-300 space-y-4">
              
              {activeCaseTab === 'resumen' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-500 block">Tipo Inmueble:</span>
                      <span className="font-bold text-white">{selectedCase.propertyType}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Municipio / Depto:</span>
                      <span className="font-bold text-white">{selectedCase.municipality}, {selectedCase.department}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Fecha Creación:</span>
                      <span className="font-mono text-slate-300">{selectedCase.createdAt?.split('T')[0] || 'Hoy'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Coordinador:</span>
                      <span className="font-bold text-cyan-300">{selectedCase.responsibleCoordinator || 'Sin asignar'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Prioridad:</span>
                      <span className="font-bold">{selectedCase.priority}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Última Actividad:</span>
                      <span className="font-mono text-slate-400">{selectedCase.lastActivityAt?.split('T')[0] || 'Hoy'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Descripción del Caso:</span>
                    <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-200">
                      {selectedCase.description || 'Sin descripción adicional registrada.'}
                    </p>
                  </div>
                </div>
              )}

              {activeCaseTab === 'visitas' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Visitas Técnicas Vinculadas</span>
                    <button
                      onClick={() => {
                        setSelectedCase(null);
                        onOpenScheduleVisitModal(selectedCase);
                      }}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Agendar Visita</span>
                    </button>
                  </div>
                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-500">
                    No hay visitas agendadas para este expediente.
                  </div>
                </div>
              )}

              {activeCaseTab === 'inspeccion' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Inspección Técnica de Campo</span>
                    <button
                      onClick={() => {
                        setSelectedCase(null);
                        onStartFieldMode();
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Abrir Modo Campo</span>
                    </button>
                  </div>
                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-500">
                    No se ha consolidado un registro de inspección para este caso.
                  </div>
                </div>
              )}

              {activeCaseTab === 'patologias' && (
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-500">
                  Hallazgos patológicos registrados en campo se listarán aquí con severidad y fotos.
                </div>
              )}

              {activeCaseTab === 'decision' && (
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-500">
                  Dictamen técnico final y decisión de intervención structural.
                </div>
              )}

              {activeCaseTab === 'reparaciones' && (
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-500">
                  Ítems de reparación técnica cuantificados y especificados.
                </div>
              )}

              {activeCaseTab === 'frente_obra' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Frente de Obra Asignado</span>
                  </div>
                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-500">
                    No se ha iniciado un frente de obra para este caso.
                  </div>
                </div>
              )}

              {activeCaseTab === 'materiales' && (
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-500">
                  Solicitudes de materiales, insumos químicos y pedidos al almacén.
                </div>
              )}

              {activeCaseTab === 'personal' && (
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-500">
                  Cuadrilla y personal operativo asignado al inmueble.
                </div>
              )}

              {activeCaseTab === 'bitacora' && (
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-500">
                  Entradas diarias de avance técnico y condiciones en sitio.
                </div>
              )}

              {activeCaseTab === 'entregas' && (
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-500">
                  Actas de entrega formal de reparaciones y satisfacción del cliente.
                </div>
              )}

              {activeCaseTab === 'facturacion' && (
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-500">
                  Cuentas de cobro, facturas, anticipos y recibos de pago.
                </div>
              )}

              {activeCaseTab === 'evidencias' && (
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-500">
                  Registro fotográfico completo (Antes, Durante y Después).
                </div>
              )}

              {activeCaseTab === 'historial' && (
                <div className="space-y-2">
                  <span className="font-bold text-white block">Trazabilidad y Auditoría</span>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Creación del expediente</span>
                      <span>{selectedCase.createdAt}</span>
                    </div>
                    <div className="flex justify-between text-cyan-400">
                      <span>Estado actual: {selectedCase.status}</span>
                      <span>{selectedCase.lastActivityAt}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Bottom Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setSelectedCase(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold"
              >
                Cerrar Expediente
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
