import React, { useEffect, useMemo, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, PlusCircle, Clock } from 'lucide-react';
import { VisitRecord } from '../types';
import { getVisitsFromDb, subscribeVisitsRealtime } from '../lib/remoteCore';

interface AgendaViewProps {
  onOpenScheduleVisitModal: () => void;
  visits?: VisitRecord[];
}

export const AgendaView: React.FC<AgendaViewProps> = ({ onOpenScheduleVisitModal, visits: propVisits }) => {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visitsList, setVisitsList] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    if (propVisits) {
      setVisitsList(propVisits);
      setLoading(false);
      return;
    }
    try {
      const rows = await getVisitsFromDb();
      setVisitsList(rows);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'No se pudo cargar la agenda desde Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    const unsubscribe = subscribeVisitsRealtime(() => reload());
    return unsubscribe;
  }, [propVisits]);

  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const daysOfWeek = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

  const days = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();
    const result: { dayNumber: number | null; dateStr: string; active: boolean }[] = [];
    for (let i = 0; i < firstDayIndex; i++) result.push({ dayNumber: null, dateStr: '', active: false });
    for (let d = 1; d <= totalDays; d++) {
      result.push({ dayNumber: d, dateStr: `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`, active: true });
    }
    return result;
  }, [currentDate]);

  const move = (dir: number) => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + dir);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7 * dir);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">Planificación Operativa</div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 mt-1"><CalendarIcon className="w-6 h-6 text-cyan-400"/>Agenda de Visitas</h1>
          <p className="text-xs text-slate-400 mt-1">Agenda compartida y sincronizada con Supabase.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex gap-1">
            {(['month','week','day'] as const).map(v => <button key={v} onClick={() => setViewMode(v)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${viewMode===v?'bg-cyan-600 text-white':'text-slate-400 hover:text-white'}`}>{v==='month'?'Mes':v==='week'?'Semana':'Día'}</button>)}
          </div>
          <button onClick={onOpenScheduleVisitModal} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"><PlusCircle className="w-4 h-4"/>PROGRAMAR VISITA</button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-white">{months[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
          <button onClick={() => setCurrentDate(new Date())} className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg text-xs">Hoy</button>
          <button onClick={reload} className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg text-xs">Actualizar</button>
        </div>
        <div className="flex gap-2"><button onClick={() => move(-1)} className="p-2 bg-slate-800 rounded-lg"><ChevronLeft className="w-4 h-4"/></button><button onClick={() => move(1)} className="p-2 bg-slate-800 rounded-lg"><ChevronRight className="w-4 h-4"/></button></div>
      </div>

      {error && <div className="bg-red-950 border border-red-800 text-red-200 rounded-xl p-3 text-sm">{error}</div>}
      {loading ? <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">Cargando agenda compartida...</div> : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          {viewMode === 'month' ? <>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase pb-2 border-b border-slate-800">{daysOfWeek.map(d => <div key={d}>{d}</div>)}</div>
            <div className="grid grid-cols-7 gap-2 mt-2">
              {days.map((item, idx) => {
                const dayVisits = item.dateStr ? visitsList.filter(v => v.date === item.dateStr) : [];
                return <div key={idx} className={`min-h-[95px] p-2 rounded-xl border ${item.active?'bg-slate-950/70 border-slate-800':'bg-slate-950/20 border-slate-900 opacity-40'}`}>
                  <div className="text-xs font-mono font-bold text-slate-300">{item.dayNumber || ''}</div>
                  <div className="space-y-1 mt-1">{dayVisits.map(v => <div key={v.id} className="bg-cyan-950/80 border border-cyan-800/60 rounded p-1 text-[10px] text-cyan-200" title={`${v.address} - ${v.responsibleProfessional}`}><div className="font-bold truncate">{v.startTime} · {v.clientName}</div><div className="truncate text-cyan-400">{v.responsibleProfessional}</div><div className="truncate text-slate-400">{v.status}</div></div>)}</div>
                </div>;
              })}
            </div>
          </> : <div className="py-12 text-center"><Clock className="w-8 h-8 text-cyan-400 mx-auto mb-3"/><h3 className="font-bold text-white">Vista de {viewMode==='week'?'Semana':'Día'}</h3><p className="text-xs text-slate-400 mt-1">Las visitas sincronizadas siguen disponibles en la vista mensual mientras completamos las franjas horarias.</p></div>}
        </div>
      )}

      {!loading && visitsList.length === 0 && <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center"><h3 className="font-bold text-white">No hay visitas programadas</h3><p className="text-xs text-slate-400 mt-1">Las visitas que guardes aquí quedarán en Supabase y podrán ser vistas por otros usuarios autorizados.</p></div>}
    </div>
  );
};
