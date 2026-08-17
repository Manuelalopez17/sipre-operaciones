import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { CaseRecord, CaseStatus, CasePriority } from '../types';

interface CasesViewProps {
  onOpenNewCaseModal: () => void;
  cases?: CaseRecord[];
}

export const CasesView: React.FC<CasesViewProps> = ({
  onOpenNewCaseModal,
  cases = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterResponsible, setFilterResponsible] = useState<string>('all');
  const [filterMunicipality, setFilterMunicipality] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [activeCaseTab, setActiveCaseTab] = useState<'info' | 'history'>('info');

  const filteredCases = cases.filter((c) => {
    const matchesSearch = 
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.municipality.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || c.priority === filterPriority;
    const matchesMunicipality = filterMunicipality === 'all' || c.municipality === filterMunicipality;
    const matchesResponsible = filterResponsible === 'all' || c.responsibleCoordinator === filterResponsible;

    return matchesSearch && matchesStatus && matchesPriority && matchesMunicipality && matchesResponsible;
  });

  return (
    <div id="sipre-cases-screen" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header and New Case CTA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
              Gestión Integral
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2.5">
            <FolderKanban className="w-6 h-6 text-cyan-400" />
            <span>Expedientes Técnicos</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Seguimiento de casos desde solicitud, inspección, peritaje hasta decisión de intervención
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

      {/* Search & Multi-Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código, cliente, dirección o municipio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Filter Selects */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {/* Estado */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">Estado: Todos</option>
              <option value="NEW_CASE">Nuevo Caso</option>
              <option value="VISIT_PENDING">Visita Pendiente</option>
              <option value="VISIT_SCHEDULED">Visita Programada</option>
              <option value="VISIT_CONFIRMED">Visita Confirmada</option>
              <option value="VISIT_IN_PROGRESS">Visita en Campo</option>
              <option value="VISIT_COMPLETED">Visita Terminada</option>
              <option value="TECHNICAL_REVIEW">Revisión Técnica</option>
              <option value="CLIENT_APPROVAL">Aprobación Cliente</option>
            </select>

            {/* Prioridad */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">Prioridad: Todas</option>
              <option value="Baja">Baja</option>
              <option value="Normal">Normal</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>

            {/* Responsable */}
            <select
              value={filterResponsible}
              onChange={(e) => setFilterResponsible(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">Responsable: Todos</option>
            </select>

            {/* Municipio */}
            <select
              value={filterMunicipality}
              onChange={(e) => setFilterMunicipality(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">Municipio: Todos</option>
            </select>
          </div>

        </div>
      </div>

      {/* Case List or Empty State */}
      {filteredCases.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
            <FolderKanban className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-200">No hay expedientes registrados</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Todos los casos e inspecciones técnicas creadas aparecerán listados aquí para control de flujo y auditoría técnica.
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCases.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedCase(c)}
              className="bg-slate-900 border border-slate-800 hover:border-cyan-500/60 rounded-2xl p-5 cursor-pointer transition-all shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/70 border border-cyan-800 px-2 py-0.5 rounded">
                  {c.code}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {c.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white line-clamp-1">{c.clientName}</h3>
              <p className="text-xs text-slate-400 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span>{c.address}, {c.municipality}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Case Details Drawer / Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">{selectedCase.code}</h3>
                  <p className="text-xs text-slate-400">{selectedCase.clientName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Case Tabs */}
            <div className="flex border-b border-slate-800 px-6 bg-slate-950/40 text-xs">
              <button
                onClick={() => setActiveCaseTab('info')}
                className={`py-3 px-4 font-bold border-b-2 transition-colors ${
                  activeCaseTab === 'info'
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                INFORMACIÓN GENERAL
              </button>
              <button
                onClick={() => setActiveCaseTab('history')}
                className={`py-3 px-4 font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
                  activeCaseTab === 'history'
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>HISTORIAL</span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-300">
              {activeCaseTab === 'info' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Dirección</span>
                      <span className="text-slate-200 font-semibold">{selectedCase.address}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Municipio</span>
                      <span className="text-slate-200 font-semibold">{selectedCase.municipality}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Tipo de Caso</span>
                      <span className="text-slate-200 font-semibold">{selectedCase.caseType}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Prioridad</span>
                      <span className="text-slate-200 font-semibold">{selectedCase.priority}</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Descripción de la Solicitud</span>
                    <p className="text-slate-300 leading-relaxed">{selectedCase.requestDescription}</p>
                  </div>
                </div>
              )}

              {activeCaseTab === 'history' && (
                <div className="py-8 text-center space-y-3 bg-slate-950 rounded-xl border border-slate-800 p-6">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                    <History className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-slate-200">No hay actividad registrada</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    El registro de auditoría y la línea de tiempo se poblarán automáticamente conforme avance la inspección y la revisión técnica.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedCase(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
