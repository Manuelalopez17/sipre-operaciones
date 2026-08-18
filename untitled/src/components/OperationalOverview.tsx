import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, HardHat, FileCheck2, MapPin, Clock, UserCheck, RefreshCw, Loader2 } from 'lucide-react';
import { VisitRecord } from '../types';
import { getVisitsFromDb, subscribeVisitsRealtime } from '../lib/remoteCore';
import { getSupabaseClient } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { isProfessional } from '../lib/roles';

interface DecisionRow {
  id: string;
  visit_id?: string | null;
  case_id?: string | null;
  decision?: string | null;
  technical_justification?: string | null;
  final_recommendations?: string | null;
  responsible_professional?: string | null;
  date?: string | null;
  created_at?: string | null;
}

const upper = (value?: string) => String(value || '').trim().toUpperCase();

export const OperationalOverview: React.FC = () => {
  const { user, profile } = useAuth();
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [decisions, setDecisions] = useState<DecisionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const professional = isProfessional(profile?.role);

  const assignedToMe = (visit: VisitRecord) => {
    const uid = user?.id || '';
    const myName = (profile?.full_name || '').trim().toLowerCase();
    const assignedId = (visit as any).responsibleProfessionalId || '';
    const assignedName = (visit.responsibleProfessional || '').trim().toLowerCase();
    return Boolean((uid && assignedId === uid) || (myName && assignedName === myName));
  };

  const load = async () => {
    setLoading(true);
    try {
      const rows = await getVisitsFromDb();
      setVisits(rows);

      const client = getSupabaseClient();
      if (client) {
        const { data, error: decisionError } = await client
          .from('technical_decisions')
          .select('*')
          .order('created_at', { ascending: false });
        if (decisionError) throw new Error(decisionError.message);
        setDecisions((data || []) as DecisionRow[]);
      }
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'No se pudo cargar el panel operativo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsubVisits = subscribeVisitsRealtime(load);
    const client = getSupabaseClient();
    const channel = client
      ? client
          .channel(`sipre-overview-${Math.random().toString(36).slice(2)}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'technical_decisions' }, load)
          .subscribe()
      : null;
    return () => {
      unsubVisits();
      if (client && channel) client.removeChannel(channel);
    };
  }, [user?.id, profile?.full_name, profile?.role]);

  const visibleVisits = useMemo(
    () => professional ? visits.filter(assignedToMe) : visits,
    [visits, professional, user?.id, profile?.full_name]
  );

  const assignedVisits = useMemo(
    () => [...visibleVisits]
      .sort((a, b) => `${a.date || ''} ${a.startTime || ''}`.localeCompare(`${b.date || ''} ${b.startTime || ''}`))
      .slice(0, 12),
    [visibleVisits]
  );

  const onSite = useMemo(
    () => visibleVisits.filter(v => ['EN SITIO', 'EN INSPECCIÓN'].includes(upper(v.status))),
    [visibleVisits]
  );

  const conclusionRows = useMemo(() => {
    const visitMap = new Map(visibleVisits.map(v => [v.id, v]));
    return decisions
      .filter(d => !professional || (d.visit_id ? visitMap.has(d.visit_id) : false))
      .map(d => ({ decision: d, visit: d.visit_id ? visitMap.get(d.visit_id) : undefined }))
      .slice(0, 10);
  }, [decisions, visibleVisits, professional]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Seguimiento operativo en vivo</h2>
          <p className="text-xs text-slate-400">
            {professional
              ? 'Tus visitas asignadas, presencia en obra y conclusiones registradas.'
              : 'Visitas asignadas, profesionales actualmente en obra y conclusiones de las inspecciones.'}
          </p>
        </div>
        <button onClick={load} className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <RefreshCw className="w-4 h-4" />Actualizar
        </button>
      </div>

      {error && <div className="bg-red-950 border border-red-800 text-red-200 rounded-xl p-3 text-xs">{error}</div>}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Cargando seguimiento...</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2"><ClipboardList className="w-5 h-5 text-cyan-400" /><h3 className="font-black text-white">Visitas asignadas</h3></div>
              <span className="text-xs font-mono text-cyan-300">{visibleVisits.length}</span>
            </div>
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {assignedVisits.length ? assignedVisits.map(v => (
                <div key={v.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs">
                  <div className="flex justify-between gap-2"><strong className="text-white">{v.clientName || v.address}</strong><span className="text-cyan-300 font-bold">{v.status}</span></div>
                  <div className="text-slate-400 mt-1 flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" />{v.responsibleProfessional || 'Por asignar'}</div>
                  <div className="text-slate-500 mt-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{v.date} · {v.startTime}</div>
                </div>
              )) : <p className="text-xs text-slate-500 py-4 text-center">No hay visitas para mostrar.</p>}
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2"><HardHat className="w-5 h-5 text-emerald-400" /><h3 className="font-black text-white">Profesionales en obra</h3></div>
              <span className="text-xs font-mono text-emerald-300">{onSite.length}</span>
            </div>
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {onSite.length ? onSite.map(v => (
                <div key={v.id} className="bg-slate-950 border border-emerald-900/50 rounded-xl p-3 text-xs">
                  <div className="font-bold text-emerald-300">{v.responsibleProfessional || 'Profesional'}</div>
                  <div className="text-white mt-1">{v.clientName}</div>
                  <div className="text-slate-400 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{v.address}, {v.municipality}</div>
                  <div className="text-slate-500 mt-1">Estado: <span className="text-emerald-300 font-bold">{v.status}</span></div>
                </div>
              )) : <p className="text-xs text-slate-500 py-4 text-center">Actualmente no hay profesionales marcados EN SITIO o EN INSPECCIÓN.</p>}
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2"><FileCheck2 className="w-5 h-5 text-purple-400" /><h3 className="font-black text-white">Conclusiones de visitas</h3></div>
              <span className="text-xs font-mono text-purple-300">{conclusionRows.length}</span>
            </div>
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {conclusionRows.length ? conclusionRows.map(({ decision, visit }) => (
                <div key={decision.id} className="bg-slate-950 border border-purple-900/40 rounded-xl p-3 text-xs">
                  <div className="font-bold text-purple-300">{decision.decision || 'Conclusión técnica'}</div>
                  <div className="text-white mt-1">{visit?.clientName || visit?.address || 'Visita técnica'}</div>
                  <div className="text-slate-400 mt-1 line-clamp-3">{decision.technical_justification || decision.final_recommendations || 'Sin justificación registrada.'}</div>
                  <div className="text-slate-500 mt-2">{decision.responsible_professional || visit?.responsibleProfessional || ''}{decision.date ? ` · ${decision.date}` : ''}</div>
                </div>
              )) : <p className="text-xs text-slate-500 py-4 text-center">Aún no hay conclusiones técnicas guardadas.</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
