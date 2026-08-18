import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  PlusCircle, 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Users, 
  Boxes, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FolderKanban, 
  Camera, 
  Eye, 
  X, 
  FileText,
  Play,
  Pause,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { WorkFrontRecord, WorkFrontStatus, WorkLogRecord, WorkFrontLogEntry } from '../types';
import { getWorkFronts, saveWorkFront, generateNextWorkFrontCode, saveWorkLog, getWorkLogs, addWorkFrontLogEntry, getWorkFrontLogEntries } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { getDisplayRole, isOperative } from '../lib/roles';
import { recordActivity } from '../lib/supabaseService';

interface WorkFrontsViewProps {
  onNavigateToMaterials?: () => void;
  onNavigateToDeliveries?: () => void;
}

export const WorkFrontsView: React.FC<WorkFrontsViewProps> = ({
  onNavigateToMaterials,
  onNavigateToDeliveries,
}) => {
  const { user, profile } = useAuth();
  const [frontsList, setFrontsList] = useState<WorkFrontRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedFront, setSelectedFront] = useState<WorkFrontRecord | null>(null);
  const [isCreatingFront, setIsCreatingFront] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'resumen' | 'actividades' | 'bitacora' | 'evidencias' | 'personal' | 'materiales' | 'entrega'>('resumen');
  
  // New Work Front form state
  const [newFrontForm, setNewFrontForm] = useState({
    caseCode: '',
    propertyAddress: '',
    clientName: '',
    repairScope: '',
    responsibleTechnicalProfessional: profile?.full_name || 'Ingeniero Evaluador',
    fieldSupervisor: '',
    plannedStartDate: new Date().toISOString().split('T')[0],
    plannedCompletionDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  });

  // Operative Execution State
  const [operativeCheckInDone, setOperativeCheckInDone] = useState<Record<string, boolean>>({});
  const [operativePhotos, setOperativePhotos] = useState<Array<{ id: string; stage: 'ANTES' | 'DURANTE' | 'DESPUES'; url: string; description: string; timestamp: string }>>([]);
  const [newPhotoStage, setNewPhotoStage] = useState<'ANTES' | 'DURANTE' | 'DESPUES'>('ANTES');
  const [newPhotoDesc, setNewPhotoDesc] = useState('');

  // Log Entry Form state
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [newLogForm, setNewLogForm] = useState({
    title: '',
    description: '',
    workProgressPercentage: 0,
    weatherCondition: 'Despejado',
  });

  const reloadFronts = () => {
    setFrontsList(getWorkFronts());
  };

  useEffect(() => {
    reloadFronts();
  }, []);

  const handleCreateWorkFront = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFrontForm.propertyAddress.trim()) return;

    const nextCode = generateNextWorkFrontCode();
    const created = saveWorkFront({
      id: 'WF-' + Date.now(),
      frontCode: nextCode,
      caseId: 'EXP-' + Date.now(),
      caseCode: newFrontForm.caseCode || 'EXP-2026-0001',
      propertyAddress: newFrontForm.propertyAddress,
      clientName: newFrontForm.clientName || 'Cliente',
      repairScope: newFrontForm.repairScope || 'Reparaciones estructurales y adecuaciones técnicas',
      responsibleTechnicalProfessional: newFrontForm.responsibleTechnicalProfessional,
      fieldSupervisor: newFrontForm.fieldSupervisor || 'Por asignar',
      plannedStartDate: newFrontForm.plannedStartDate,
      plannedCompletionDate: newFrontForm.plannedCompletionDate,
      status: 'PENDIENTE',
      progressCategory: 'No iniciado',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    reloadFronts();
    setIsCreatingFront(false);
    setNewFrontForm({
      caseCode: '',
      propertyAddress: '',
      clientName: '',
      repairScope: '',
      responsibleTechnicalProfessional: 'Ingeniero Evaluador',
      fieldSupervisor: '',
      plannedStartDate: new Date().toISOString().split('T')[0],
      plannedCompletionDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    });
  };

  const handleAddLog = () => {
    if (!selectedFront || !newLogForm.description.trim()) return;

    const author = profile?.full_name || 'Personal Técnico';
    const roleLabel = getDisplayRole(profile?.role);

    const logEntry: WorkFrontLogEntry = {
      id: 'LOG-' + Date.now(),
      workFrontId: selectedFront.id,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      authorName: author,
      authorRole: roleLabel,
      title: newLogForm.title || 'Reporte diario de obra',
      description: newLogForm.description,
      workProgressPercentage: Number(newLogForm.workProgressPercentage) || 0,
      weatherCondition: newLogForm.weatherCondition,
      photos: [],
      createdAt: new Date().toISOString(),
    };

    addWorkFrontLogEntry(logEntry);
    recordActivity(
      `Nueva entrada en bitácora de frente ${selectedFront.frontCode}`,
      { title: logEntry.title, progress: logEntry.workProgressPercentage },
      {
        userId: user?.id,
        userName: author,
        userRole: profile?.role,
        entityType: 'work_front',
        entityId: selectedFront.id,
      }
    );
    reloadFronts();
    setIsAddingLog(false);
    setNewLogForm({
      title: '',
      description: '',
      workProgressPercentage: 0,
      weatherCondition: 'Despejado',
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setOperativePhotos((prev) => [
        ...prev,
        {
          id: 'photo-' + Date.now(),
          stage: newPhotoStage,
          url: base64,
          description: newPhotoDesc || `Foto ${newPhotoStage} de intervención`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setNewPhotoDesc('');
    };
    reader.readAsDataURL(file);
  };

  const getStatusBadge = (status: WorkFrontStatus) => {
    const s = (status || '').toUpperCase();
    if (s.includes('PENDIENTE')) return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-800">PENDIENTE</span>;
    if (s.includes('LISTO')) return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">LISTO PARA INICIAR</span>;
    if (s.includes('EJECUCIÓN')) return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 animate-pulse">EN EJECUCIÓN ⚡</span>;
    if (s.includes('DETENIDO')) return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-950 text-red-300 border border-red-800">DETENIDO ⚠️</span>;
    if (s.includes('ENTREGA')) return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-950 text-teal-300 border border-teal-800">PENDIENTE DE ENTREGA</span>;
    if (s.includes('TERMINADO') || s.includes('ENTREGADO')) return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">ENTREGADO</span>;
    return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300">{status}</span>;
  };

  const filteredFronts = frontsList.filter((f) => {
    const matchesSearch = 
      f.frontCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || f.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div id="sipre-work-fronts-screen" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
              Ejecución Técnica
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2.5 mt-1">
            <Wrench className="w-6 h-6 text-cyan-400" />
            <span>Frentes de Obra y Reparación</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Supervisión en sitio, asignación de cuadrillas, bitácora diaria de avance y control de entregas.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingFront(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-cyan-600/25 border border-cyan-400/40 transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ NUEVO FRENTE DE OBRA</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código (ej. FO-2026-0001), dirección o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
        >
          <option value="all">Todos los Estados</option>
          <option value="PENDIENTE">PENDIENTE</option>
          <option value="LISTO PARA INICIAR">LISTO PARA INICIAR</option>
          <option value="EN EJECUCIÓN">EN EJECUCIÓN</option>
          <option value="DETENIDO">DETENIDO</option>
          <option value="PENDIENTE DE ENTREGA">PENDIENTE DE ENTREGA</option>
          <option value="ENTREGADO">ENTREGADO</option>
        </select>
      </div>

      {/* List / Cards */}
      {filteredFronts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFronts.map((front) => (
            <div
              key={front.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                    {front.frontCode}
                  </span>
                  {getStatusBadge(front.status)}
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{front.clientName}</h3>
                  <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span>{front.propertyAddress}</span>
                  </p>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expediente:</span>
                    <span className="font-mono font-bold text-cyan-300">{front.caseCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Supervisor:</span>
                    <span className="font-semibold text-white">{front.fieldSupervisor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fechas:</span>
                    <span className="text-[11px]">{front.plannedStartDate} → {front.plannedCompletionDate}</span>
                  </div>
                  {front.repairScope && (
                    <div className="pt-1 text-[11px] text-slate-400 border-t border-slate-800">
                      <span className="font-semibold text-slate-300">Alcance: </span>
                      <span>{front.repairScope}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400">
                  Avance: <strong className="text-emerald-400">{front.progressCategory}</strong>
                </span>
                <button
                  onClick={() => setSelectedFront(front)}
                  className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 flex items-center space-x-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Bitácora</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600">
            <Wrench className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No hay frentes de obra activos</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Los frentes de obra se abren automáticamente tras emitir una decisión de reparación técnica o manualmente desde este panel.
            </p>
          </div>
          <button
            onClick={() => setIsCreatingFront(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center space-x-2 shadow-lg transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ CREAR FRENTE DE OBRA</span>
          </button>
        </div>
      )}

      {/* Modal: Nuevo Frente de Obra */}
      {isCreatingFront && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateWorkFront} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Wrench className="w-5 h-5 text-cyan-400" />
                <span>Nuevo Frente de Obra</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingFront(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Dirección del Inmueble *</label>
                <input
                  type="text"
                  required
                  value={newFrontForm.propertyAddress}
                  onChange={(e) => setNewFrontForm({ ...newFrontForm, propertyAddress: e.target.value })}
                  placeholder="Ej. Calle 10 # 43E - 20"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  value={newFrontForm.clientName}
                  onChange={(e) => setNewFrontForm({ ...newFrontForm, clientName: e.target.value })}
                  placeholder="Ej. Juan Pérez"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Código de Expediente Vinculado</label>
                <input
                  type="text"
                  value={newFrontForm.caseCode}
                  onChange={(e) => setNewFrontForm({ ...newFrontForm, caseCode: e.target.value })}
                  placeholder="Ej. EXP-2026-0001"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Alcance de la Reparación</label>
                <textarea
                  rows={2}
                  value={newFrontForm.repairScope}
                  onChange={(e) => setNewFrontForm({ ...newFrontForm, repairScope: e.target.value })}
                  placeholder="Descripción técnica de las actividades a ejecutar..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Fecha Inicio Planeada</label>
                  <input
                    type="date"
                    value={newFrontForm.plannedStartDate}
                    onChange={(e) => setNewFrontForm({ ...newFrontForm, plannedStartDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Fecha Entrega Planeada</label>
                  <input
                    type="date"
                    value={newFrontForm.plannedCompletionDate}
                    onChange={(e) => setNewFrontForm({ ...newFrontForm, plannedCompletionDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsCreatingFront(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md"
              >
                Crear Frente
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Detalle y Bitácora del Frente */}
      {selectedFront && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {selectedFront.frontCode}
                  </span>
                  {getStatusBadge(selectedFront.status)}
                </div>
                <h2 className="text-base sm:text-lg font-black text-white mt-1">
                  {selectedFront.propertyAddress}
                </h2>
                <span className="text-xs text-slate-400">Cliente: {selectedFront.clientName} | Expediente: {selectedFront.caseCode}</span>
              </div>
              <button
                onClick={() => setSelectedFront(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="bg-slate-950 border-b border-slate-800 px-3 py-2 flex space-x-2 text-xs overflow-x-auto">
              {['resumen', 'actividades', 'bitacora', 'evidencias', 'personal', 'materiales', 'entrega'].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveDetailTab(t as any)}
                  className={`px-3 py-1 rounded-lg font-bold capitalize transition-colors ${
                    activeDetailTab === t
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t === 'actividades' ? 'Mis Actividades' : t === 'evidencias' ? 'Fotos Antes / Durante / Después' : t}
                </button>
              ))}
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-slate-300">
              {activeDetailTab === 'resumen' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-500 block">Profesional Responsable:</span>
                      <span className="font-bold text-cyan-300">{selectedFront.responsibleTechnicalProfessional}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Supervisor de Campo:</span>
                      <span className="font-bold text-white">{selectedFront.fieldSupervisor}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Fecha Inicio:</span>
                      <span className="font-mono text-slate-300">{selectedFront.plannedStartDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Fecha Estimada Entrega:</span>
                      <span className="font-mono text-slate-300">{selectedFront.plannedCompletionDate}</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-300 block mb-1">Alcance Técnico:</span>
                    <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-200">
                      {selectedFront.repairScope}
                    </p>
                  </div>
                </div>
              )}

              {activeDetailTab === 'actividades' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white uppercase text-[11px] tracking-wider">Control Operativo del Frente</span>
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">Operativo</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white">Llegada a Sitio (Check-In)</div>
                          <div className="text-[11px] text-slate-400">Marca tu presencia en el predio</div>
                        </div>
                        <button
                          onClick={() => setOperativeCheckInDone(prev => ({ ...prev, [selectedFront.id]: true }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            operativeCheckInDone[selectedFront.id]
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {operativeCheckInDone[selectedFront.id] ? '✓ En Sitio' : 'Marcar Llegada'}
                        </button>
                      </div>

                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white">Recepción de Materiales</div>
                          <div className="text-[11px] text-slate-400">Verificar insumos entregados</div>
                        </div>
                        <button
                          onClick={() => {
                            if (onNavigateToMaterials) onNavigateToMaterials();
                          }}
                          className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                        >
                          Ver Insumos
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === 'evidencias' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Registro Fotográfico (Antes / Durante / Después)</span>
                      <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
                        {(['ANTES', 'DURANTE', 'DESPUES'] as const).map(st => (
                          <button
                            key={st}
                            onClick={() => setNewPhotoStage(st)}
                            className={`px-2 py-0.5 rounded font-bold ${
                              newPhotoStage === st ? 'bg-cyan-600 text-white' : 'text-slate-400'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Descripción de la foto..."
                        value={newPhotoDesc}
                        onChange={e => setNewPhotoDesc(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                      />
                      <label className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center space-x-1 cursor-pointer">
                        <Camera className="w-4 h-4" />
                        <span>Subir Foto {newPhotoStage}</span>
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                    </div>

                    {operativePhotos.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                        {operativePhotos.map(p => (
                          <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-2 space-y-1">
                            <img src={p.url} alt={p.description} className="w-full h-24 object-cover rounded-lg" />
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-cyan-400">{p.stage}</span>
                              <span className="text-slate-500">{p.timestamp}</span>
                            </div>
                            <p className="text-[11px] text-slate-300 truncate">{p.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-slate-500">
                        No se han cargado fotografías de ejecución para este frente aún.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeDetailTab === 'bitacora' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Bitácora Diaria de Obra</span>
                    <button
                      onClick={() => setIsAddingLog(true)}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded-lg font-bold flex items-center space-x-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Nueva Entrada</span>
                    </button>
                  </div>

                  {isAddingLog && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/40 space-y-3">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Título de la Entrada</label>
                        <input
                          type="text"
                          value={newLogForm.title}
                          onChange={(e) => setNewLogForm({ ...newLogForm, title: e.target.value })}
                          placeholder="Ej. Inyección de resina epóxica en viga 2"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Descripción del Avance</label>
                        <textarea
                          rows={2}
                          value={newLogForm.description}
                          onChange={(e) => setNewLogForm({ ...newLogForm, description: e.target.value })}
                          placeholder="Detalles de las actividades realizadas hoy en el inmueble..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingLog(false)}
                          className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleAddLog}
                          className="bg-cyan-600 text-white px-4 py-1 rounded-lg font-bold"
                        >
                          Guardar Entrada
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-500">
                    No hay entradas registradas en la bitácora para este frente.
                  </div>
                </div>
              )}

              {activeDetailTab === 'personal' && (
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-500">
                  Cuadrilla de oficiales y ayudantes asignados al frente de obra.
                </div>
              )}

              {activeDetailTab === 'materiales' && (
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-500">
                  Insumos estructurales y despachos programados para este inmueble.
                </div>
              )}

              {activeDetailTab === 'entrega' && (
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-500">
                  Acta de entrega final y firma de satisfacción del propietario.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setSelectedFront(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold"
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
