import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, MapPin, Clock, UserCheck, PlusCircle, Navigation, Play, CheckCircle2, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { VisitRecord } from '../types';
import { getVisitsFromDb, subscribeVisitsRealtime } from '../lib/remoteCore';
import { getSupabaseClient } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { isCoordinator, isManagement, isProfessional } from '../lib/roles';

interface VisitsViewProps {
  onOpenScheduleVisitModal: () => void;
  onStartFieldMode: (visit?: VisitRecord) => void;
}

export const VisitsView: React.FC<VisitsViewProps> = ({ onOpenScheduleVisitModal, onStartFieldMode }) => {
  const { user, profile } = useAuth();
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const professionalRole = isProfessional(profile?.role);
  const coordinatorRole = isCoordinator(profile?.role);
  const managementRole = isManagement(profile?.role);

  const reload = async () => {
    try {
      setVisits(await getVisitsFromDb());
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'No se pudieron cargar las visitas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    const unsub = subscribeVisitsRealtime(reload);
    return unsub;
  }, []);

  const isAssignedToCurrentUser = (v: VisitRecord) => {
    const uid = user?.id || '';
    const name = (profile?.full_name || '').trim().toLowerCase();
    const assignedId = (v as any).responsibleProfessionalId || '';
    const assignedName = (v.responsibleProfessional || '').trim().toLowerCase();
    return Boolean((uid && assignedId === uid) || (name && assignedName === name));
  };

  const visible = useMemo(() => {
    if (professionalRole) return visits.filter(isAssignedToCurrentUser);
    return visits;
  }, [visits, professionalRole, user?.id, profile?.full_name]);

  const updateStatus = async (visit: VisitRecord, status: string) => {
    if (!professionalRole || !isAssignedToCurrentUser(visit)) {
      setError('Solo el profesional responsable asignado a esta visita puede cambiar su estado o iniciar la inspección.');
      return;
    }

    const client = getSupabaseClient();
    if (!client) return setError('Supabase no está configurado.');

    setActing(visit.id);
    setError(null);
    try {
      const now = new Date().toISOString();
      const patch: any = { status, updated_at: now };
      if (status === 'CONFIRMADA') patch.confirmed_at = now;
      if (status === 'EN RUTA') patch.en_route_at = now;
      if (status === 'EN SITIO') {
        patch.on_site_at = now;
        patch.check_in_at = now;
        if ('geolocation' in navigator) {
          const pos: GeolocationPosition | null = await new Promise(resolve =>
            navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
              enableHighAccuracy: true,
              timeout: 6000,
              maximumAge: 0,
            })
          );
          if (pos) {
            patch.check_in_latitude = pos.coords.latitude;
            patch.check_in_longitude = pos.coords.longitude;
          }
        }
      }
      if (status === 'EN INSPECCIÓN') patch.inspection_started_at = now;
      if (status === 'TERMINADA') {
        patch.check_out_at = now;
        patch.completed_by = user?.id || null;
      }

      const { error: dbError } = await client.from('visits').update(patch).eq('id', visit.id);
      if (dbError) throw new Error(dbError.message);

      if (status === 'CONFIRMADA' && user?.id) {
        await client
          .from('visit_assignments')
          .update({ assignment_status: 'accepted', responded_at: now })
          .eq('visit_id', visit.id)
          .eq('user_id', user.id);
      }

      setNotice(`Visita actualizada: ${status}`);
      setTimeout(() => setNotice(null), 3000);
      await reload();
    } catch (e: any) {
      setError(e?.message || 'No se pudo actualizar la visita.');
    } finally {
      setActing(null);
    }
  };

  const badge = (status: string) => {
    const s = (status || '').toUpperCase();
    const cls = s.includes('TERMINADA')
      ? 'bg-slate-800 text-slate-300'
      : s.includes('SITIO')
      ? 'bg-emerald-950 text-emerald-300'
      : s.includes('RUTA')
      ? 'bg-amber-950 text-amber-300'
      : s.includes('INSPECCIÓN')
      ? 'bg-purple-950 text-purple-300'
      : s.includes('CONFIRMADA')
      ? 'bg-cyan-950 text-cyan-300'
      : 'bg-blue-950 text-blue-300';
    return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-700 ${cls}`}>{status}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">Operaciones de Campo</div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 mt-1">
            <ClipboardList className="w-6 h-6 text-cyan-400" />Gestión de Visitas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {professionalRole
              ? 'Solo puedes operar las visitas que están asignadas a tu usuario.'
              : coordinatorRole
              ? 'Seguimiento de todas las visitas. La edición, reasignación y eliminación se realiza desde Agenda.'
              : managementRole
              ? 'Vista de seguimiento en modo lectura. Gerencia no modifica la operación técnica.'
              : 'Vista operativa en modo consulta.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={reload} className="bg-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs flex items-center gap-1">
            <RefreshCw className="w-4 h-4" />Actualizar
          </button>
          {coordinatorRole && (
            <button onClick={onOpenScheduleVisitModal} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />PROGRAMAR VISITA
            </button>
          )}
        </div>
      </div>

      {notice && <div className="bg-emerald-950 border border-emerald-800 text-emerald-200 rounded-xl p-3 text-xs font-bold">{notice}</div>}
      {error && <div className="bg-red-950 border border-red-800 text-red-200 rounded-xl p-3 text-xs">{error}</div>}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center gap-2 text-xs text-slate-300">
        <ShieldCheck className="w-4 h-4 text-cyan-400" />
        <span>
          {professionalRole ? `Mostrando únicamente visitas asignadas a ${profile?.full_name || 'tu usuario'}.` : `Mostrando ${visible.length} visita(s) registradas.`}
        </span>
      </div>

      {loading ? (
        <div className="text-center p-10 text-slate-400">Cargando visitas...</div>
      ) : visible.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">
          {professionalRole ? 'No tienes visitas asignadas.' : 'No hay visitas registradas.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visible.map(v => {
            const assignedToMe = isAssignedToCurrentUser(v);
            const canOperate = professionalRole && assignedToMe;
            return (
              <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <h3 className="font-black text-white">{v.clientName}</h3>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{v.address}, {v.municipality}</div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{v.date} · {v.startTime}–{v.estimatedEndTime}</div>
                  </div>
                  {badge(v.status)}
                </div>

                <div className="text-xs bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                  <div className="text-slate-500 uppercase font-bold text-[10px]">Profesional responsable</div>
                  <div className="text-cyan-300 font-bold mt-1">{v.responsibleProfessional}</div>
                  <div className="text-slate-400 mt-2">{v.visitObjective || v.visitReason}</div>
                </div>

                {canOperate ? (
                  <div className="flex flex-wrap gap-2">
                    {(v.status === 'PROGRAMADA' || v.status === 'scheduled') && (
                      <button disabled={acting === v.id} onClick={() => updateStatus(v, 'CONFIRMADA')} className="bg-cyan-600 px-3 py-2 rounded-lg text-xs font-bold">Confirmar</button>
                    )}
                    {v.status === 'CONFIRMADA' && (
                      <button disabled={acting === v.id} onClick={() => updateStatus(v, 'EN RUTA')} className="bg-amber-600 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1"><Navigation className="w-3.5 h-3.5" />En ruta</button>
                    )}
                    {v.status === 'EN RUTA' && (
                      <button disabled={acting === v.id} onClick={() => updateStatus(v, 'EN SITIO')} className="bg-emerald-600 px-3 py-2 rounded-lg text-xs font-bold">Ya estoy en sitio</button>
                    )}
                    {v.status === 'EN SITIO' && (
                      <button disabled={acting === v.id} onClick={async () => { await updateStatus(v, 'EN INSPECCIÓN'); onStartFieldMode(v); }} className="bg-purple-600 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1"><Play className="w-3.5 h-3.5" />Iniciar inspección</button>
                    )}
                    {v.status === 'EN INSPECCIÓN' && (
                      <button onClick={() => onStartFieldMode(v)} className="bg-purple-700 px-3 py-2 rounded-lg text-xs font-bold">Continuar inspección</button>
                    )}
                    {v.status === 'EN INSPECCIÓN' && (
                      <button disabled={acting === v.id} onClick={() => updateStatus(v, 'TERMINADA')} className="bg-slate-700 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Terminar</button>
                    )}
                    {acting === v.id && <span className="text-xs text-cyan-300 flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" />Guardando...</span>}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-3">
                    {coordinatorRole ? 'Seguimiento únicamente. Para corregir, reasignar o eliminar esta visita usa Agenda.' : 'Modo lectura: las acciones de campo pertenecen al profesional asignado.'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
