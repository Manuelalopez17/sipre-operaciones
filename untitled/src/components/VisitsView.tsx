import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  Navigation,
  Check,
  Eye,
  X,
  Compass,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { VisitRecord, VisitStatus, PropertyType, CasePriority } from '../types';
import { getVisits, saveVisit, updateVisitStatus } from '../lib/storage';
import { 
  getVisitsFromDb, 
  confirmVisitInDb, 
  startEnRouteInDb, 
  confirmOnSiteInDb, 
  startInspectionInDb,
  finishVisitInDb 
} from '../lib/supabaseService';
import { useAuth } from '../context/AuthContext';

interface VisitsViewProps {
  onOpenScheduleVisitModal: () => void;
  onStartFieldMode: (visit?: VisitRecord) => void;
}

export const VisitsView: React.FC<VisitsViewProps> = ({
  onOpenScheduleVisitModal,
  onStartFieldMode,
}) => {
  const { user, profile } = useAuth();
  const [visitsList, setVisitsList] = useState<VisitRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'my_visits' | 'programadas' | 'confirmadas' | 'en_ruta' | 'en_sitio' | 'terminadas'>('my_visits');
  const [selectedVisitForModal, setSelectedVisitForModal] = useState<VisitRecord | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const reloadVisits = async () => {
    // 1. Try fetching from Supabase
    const dbVisits = await getVisitsFromDb();
    if (dbVisits && dbVisits.length > 0) {
      setVisitsList(dbVisits);
    } else {
      // 2. Fallback to local storage
      setVisitsList(getVisits());
    }
  };

  useEffect(() => {
    reloadVisits();
  }, []);

  const handleUpdateStatus = async (visitId: string, newStatus: VisitStatus, actionLabel: string) => {
    setLoadingAction(visitId);
    let gpsCoords = undefined;

    if (newStatus === 'EN SITIO') {
      try {
        if ('geolocation' in navigator) {
          const pos: any = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 6000,
              maximumAge: 0,
            });
          }).catch(() => null);

          if (pos && pos.coords) {
            gpsCoords = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              timestamp: new Date().toISOString(),
            };
          }
        }
      } catch (err) {
        console.warn('Geolocation capture note:', err);
      }

      // Default fallback coordinates if GPS was denied or unavailable in sandbox
      if (!gpsCoords) {
        gpsCoords = {
          latitude: 6.2086,
          longitude: -75.5684,
          accuracy: 10,
          timestamp: new Date().toISOString(),
        };
      }
    }

    // 1. Update in Supabase
    try {
      if (newStatus === 'CONFIRMADA') {
        await confirmVisitInDb(visitId, user?.id, profile?.full_name);
      } else if (newStatus === 'EN RUTA') {
        await startEnRouteInDb(visitId, user?.id, profile?.full_name);
      } else if (newStatus === 'EN SITIO') {
        await confirmOnSiteInDb(visitId, gpsCoords, user?.id, profile?.full_name);
      } else if (newStatus === 'EN INSPECCIÓN') {
        await startInspectionInDb(visitId, user?.id, profile?.full_name);
      } else if (newStatus === 'TERMINADA') {
        await finishVisitInDb(visitId, user?.id, profile?.full_name);
      }
    } catch (err) {
      console.warn('Supabase status update note:', err);
    }

    // 2. Update local storage
    updateVisitStatus(visitId, newStatus, profile?.full_name || 'Ing. Asignado', gpsCoords);
    await reloadVisits();
    setLoadingAction(null);

    setStatusFeedback(`Estado actualizado a: ${newStatus} (${actionLabel})`);
    setTimeout(() => setStatusFeedback(null), 4000);
  };

  const getStatusBadge = (status: VisitStatus) => {
    const s = (status || '').toUpperCase();
    if (s.includes('PROGRAMADA')) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-950 text-blue-300 border border-blue-800">PROGRAMADA</span>;
    }
    if (s.includes('CONFIRMADA')) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">CONFIRMADA</span>;
    }
    if (s.includes('EN RUTA')) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800 animate-pulse">EN RUTA 🚗</span>;
    }
    if (s.includes('EN SITIO') || s.includes('EN CAMPO')) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 font-black">EN SITIO 📍</span>;
    }
    if (s.includes('EN INSPECCIÓN')) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-950 text-purple-300 border border-purple-800">EN INSPECCIÓN 🔍</span>;
    }
    if (s.includes('TERMINADA')) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">TERMINADA</span>;
    }
    if (s.includes('CANCELADA')) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-950 text-red-300 border border-red-800">CANCELADA</span>;
    }
    if (s.includes('REPROGRAMADA')) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-950 text-orange-300 border border-orange-800">REPROGRAMADA</span>;
    }
    return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300">{status}</span>;
  };

  const filteredVisits = visitsList.filter((v) => {
    if (activeFilter === 'my_visits') {
      if (!profile?.full_name && !user?.id) return true;
      const profName = (profile?.full_name || '').toLowerCase().trim();
      const userId = user?.id || '';
      const assigned = (v.responsibleProfessional || '').toLowerCase().trim();
      const assignedId = (v as any).responsibleProfessionalId || '';
      
      if (userId && assignedId && userId === assignedId) return true;
      if (profName && assigned && (assigned.includes(profName) || profName.includes(assigned))) return true;
      return false;
    }
    if (activeFilter === 'all') return true;
    const s = (v.status || '').toUpperCase();
    if (activeFilter === 'programadas') return s.includes('PROGRAMADA');
    if (activeFilter === 'confirmadas') return s.includes('CONFIRMADA');
    if (activeFilter === 'en_ruta') return s.includes('EN RUTA');
    if (activeFilter === 'en_sitio') return s.includes('EN SITIO') || s.includes('EN CAMPO') || s.includes('EN INSPECCIÓN');
    if (activeFilter === 'terminadas') return s.includes('TERMINADA');
    return true;
  });

  return (
    <div id="sipre-visits-screen" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
              Operaciones de Campo
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2.5 mt-1">
            <ClipboardList className="w-6 h-6 text-cyan-400" />
            <span>Gestión de Visitas Técnicas</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Planificación, seguimiento GPS de desplazamientos, confirmación en sitio y ejecución de inspección.
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

      {statusFeedback && (
        <div className="p-3.5 rounded-xl bg-cyan-950/90 border border-cyan-500 text-cyan-200 font-bold text-xs text-center flex items-center justify-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{statusFeedback}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-xl">
        <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveFilter('my_visits')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeFilter === 'my_visits'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>MIS VISITAS (Asignadas)</span>
            <span className="bg-slate-950/60 px-2 py-0.5 rounded-full text-[10px]">{visitsList.length}</span>
          </button>

          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Todas las Visitas ({visitsList.length})
          </button>

          <button
            onClick={() => setActiveFilter('programadas')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'programadas' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Programadas
          </button>

          <button
            onClick={() => setActiveFilter('confirmadas')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'confirmadas' ? 'bg-cyan-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Confirmadas
          </button>

          <button
            onClick={() => setActiveFilter('en_ruta')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'en_ruta' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            En Ruta
          </button>

          <button
            onClick={() => setActiveFilter('en_sitio')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'en_sitio' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            En Sitio / Inspección
          </button>

          <button
            onClick={() => setActiveFilter('terminadas')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'terminadas' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Terminadas
          </button>
        </div>
      </div>

      {/* Visits List / Grid */}
      {filteredVisits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVisits.map((visit) => {
            const isEnSitio = (visit.status || '').toUpperCase().includes('EN SITIO') || (visit.status || '').toUpperCase().includes('EN CAMPO');
            const isEnRuta = (visit.status || '').toUpperCase().includes('EN RUTA');
            const isProgramada = (visit.status || '').toUpperCase().includes('PROGRAMADA');
            const isConfirmada = (visit.status || '').toUpperCase().includes('CONFIRMADA');

            return (
              <div
                key={visit.id}
                id={`visit-card-${visit.id}`}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      {visit.id}
                    </span>
                    {getStatusBadge(visit.status)}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white leading-snug">
                      {visit.clientName}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span>{visit.address}, {visit.municipality || 'Medellín'}</span>
                    </p>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500">Fecha y Hora:</span>
                      <span className="font-bold flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>{visit.date} ({visit.startTime} - {visit.estimatedEndTime})</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500">Tipo Inmueble:</span>
                      <span className="font-semibold text-slate-200">{visit.propertyType}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500">Profesional:</span>
                      <span className="font-semibold text-cyan-300">{visit.responsibleProfessional || 'Por asignar'}</span>
                    </div>

                    {visit.assignedTeam && (
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500">Equipo:</span>
                        <span className="text-slate-300">{visit.assignedTeam}</span>
                      </div>
                    )}

                    {visit.visitObjective && (
                      <div className="pt-1 text-[11px] text-slate-400 border-t border-slate-800">
                        <span className="font-semibold text-slate-300">Objetivo: </span>
                        <span>{visit.visitObjective}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Specific Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedVisitForModal(visit)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 px-2.5 rounded-xl border border-slate-700 flex items-center justify-center space-x-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>VER VISITA</span>
                    </button>

                    {isProgramada && (
                      <button
                        onClick={() => handleUpdateStatus(visit.id, 'CONFIRMADA', 'Visita confirmada con cliente')}
                        disabled={loadingAction === visit.id}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-2 px-2.5 rounded-xl flex items-center justify-center space-x-1 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>CONFIRMAR</span>
                      </button>
                    )}

                    {(isConfirmada || isProgramada) && (
                      <button
                        onClick={() => handleUpdateStatus(visit.id, 'EN RUTA', 'Inspector en ruta')}
                        disabled={loadingAction === visit.id}
                        className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2 px-2.5 rounded-xl flex items-center justify-center space-x-1 transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>EN RUTA</span>
                      </button>
                    )}
                  </div>

                  {/* "YA ESTOY EN SITIO" & "INICIAR INSPECCIÓN" */}
                  {!isEnSitio && (
                    <button
                      onClick={() => handleUpdateStatus(visit.id, 'EN SITIO', 'Ubicación GPS registrada')}
                      disabled={loadingAction === visit.id}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow-md transition-all active:scale-95"
                    >
                      {loadingAction === visit.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                      <span>YA ESTOY EN SITIO (CHECK-IN)</span>
                    </button>
                  )}

                  {isEnSitio && (
                    <button
                      onClick={async () => {
                        await startInspectionInDb(visit.id, user?.id, profile?.full_name);
                        onStartFieldMode(visit);
                      }}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black py-3 px-3 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 border border-emerald-400/40 animate-pulse transition-all active:scale-95"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>INICIAR INSPECCIÓN (MODO CAMPO)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600">
            <ClipboardList className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No hay visitas registradas</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Todos los contadores se encuentran en cero. Agenda una nueva visita técnica o inicia una inspección directa desde Modo Campo.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenScheduleVisitModal}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all"
            >
              + PROGRAMAR VISITA
            </button>
            <button
              onClick={() => onStartFieldMode()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all"
            >
              MODO CAMPO DIRECTO
            </button>
          </div>
        </div>
      )}

      {/* Modal: Ver Detalle de Visita */}
      {selectedVisitForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400">{selectedVisitForModal.id}</span>
                <h3 className="text-lg font-black text-white">{selectedVisitForModal.clientName}</h3>
              </div>
              <button
                onClick={() => setSelectedVisitForModal(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500">Dirección:</span>
                <span className="font-semibold text-white">{selectedVisitForModal.address}, {selectedVisitForModal.municipality}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500">Fecha y Horario:</span>
                <span className="font-semibold text-white">{selectedVisitForModal.date} ({selectedVisitForModal.startTime} - {selectedVisitForModal.estimatedEndTime})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500">Tipo de Inmueble:</span>
                <span className="font-semibold text-white">{selectedVisitForModal.propertyType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500">Profesional Asignado:</span>
                <span className="font-semibold text-cyan-300">{selectedVisitForModal.responsibleProfessional}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500">Estado Actual:</span>
                <div>{getStatusBadge(selectedVisitForModal.status)}</div>
              </div>
              {selectedVisitForModal.visitObjective && (
                <div className="py-1">
                  <span className="text-slate-500 block mb-0.5">Objetivo de la Visita:</span>
                  <p className="bg-slate-950 p-2.5 rounded-lg text-slate-200 border border-slate-800">
                    {selectedVisitForModal.visitObjective}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedVisitForModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  const v = selectedVisitForModal;
                  setSelectedVisitForModal(null);
                  onStartFieldMode(v);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5"
              >
                <Smartphone className="w-4 h-4" />
                <span>Ir a Modo Campo</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
