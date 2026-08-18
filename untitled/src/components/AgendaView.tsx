import React, { useEffect, useMemo, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, PlusCircle, Clock, Pencil, X, Loader2, Save, UserCheck } from 'lucide-react';
import { VisitRecord } from '../types';
import { getVisitsFromDb, subscribeVisitsRealtime } from '../lib/remoteCore';
import { getSupabaseClient } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

interface AgendaViewProps {
  onOpenScheduleVisitModal: () => void;
  visits?: VisitRecord[];
}

export const AgendaView: React.FC<AgendaViewProps> = ({ onOpenScheduleVisitModal, visits: propVisits }) => {
  const { activeProfiles } = useAuth();
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visitsList, setVisitsList] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<VisitRecord | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    date: '', startTime: '', estimatedEndTime: '', responsibleProfessionalId: '', visitObjective: ''
  });

  const professionals = activeProfiles.filter(p => p.active !== false && (p.role === 'inspector' || p.role === 'structural_specialist' || p.role === 'Inspector'));

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

  const openEditVisit = (visit: VisitRecord) => {
    const assignedId = (visit as any).responsibleProfessionalId || professionals.find(p => p.full_name === visit.responsibleProfessional)?.id || '';
    setSelectedVisit(visit);
    setEditForm({
      date: visit.date,
      startTime: visit.startTime,
      estimatedEndTime: visit.estimatedEndTime,
      responsibleProfessionalId: assignedId,
      visitObjective: visit.visitObjective || '',
    });
    setEditError(null);
  };

  const saveVisitChanges = async () => {
    if (!selectedVisit) return;
    if (!editForm.responsibleProfessionalId) return setEditError('Selecciona el profesional responsable.');
    if (editForm.estimatedEndTime <= editForm.startTime) return setEditError('La hora de finalización debe ser posterior a la hora de inicio.');

    const client = getSupabaseClient();
    if (!client) return setEditError('Supabase no está configurado.');

    const professional = professionals.find(p => p.id === editForm.responsibleProfessionalId);
    if (!professional) return setEditError('No se encontró el profesional seleccionado.');

    setEditSaving(true);
    setEditError(null);
    try {
      const now = new Date().toISOString();
      const scheduledStart = new Date(`${editForm.date}T${editForm.startTime}:00`).toISOString();
      const scheduledEnd = new Date(`${editForm.date}T${editForm.estimatedEndTime}:00`).toISOString();

      const { error: visitError } = await client.from('visits').update({
        date: editForm.date,
        start_time: editForm.startTime,
        estimated_end_time: editForm.estimatedEndTime,
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        assigned_to: professional.id,
        responsible_professional: professional.full_name,
        visit_objective: editForm.visitObjective,
        objective: editForm.visitObjective,
        updated_at: now,
      }).eq('id', selectedVisit.id);
      if (visitError) throw new Error(visitError.message);

      const { data: assignment, error: assignmentReadError } = await client
        .from('visit_assignments')
        .select('id')
        .eq('visit_id', selectedVisit.id)
        .eq('role_in_visit', 'Líder de Inspección')
        .limit(1)
        .maybeSingle();
      if (assignmentReadError) throw new Error(assignmentReadError.message);

      if (assignment?.id) {
        const { error: assignmentUpdateError } = await client.from('visit_assignments').update({
          user_id: professional.id,
          professional_name: professional.full_name,
          assignment_status: 'assigned',
          responded_at: null,
        }).eq('id', assignment.id);
        if (assignmentUpdateError) throw new Error(assignmentUpdateError.message);
      }

      await reload();
      setSelectedVisit(null);
    } catch (e: any) {
      setEditError(e?.message || 'No se pudo actualizar la visita.');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">Planificación Operativa</div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 mt-1"><CalendarIcon className="w-6 h-6 text-cyan-400"/>Agenda de Visitas</h1>
          <p className="text-xs text-slate-400 mt-1">Agenda compartida y sincronizada con Supabase. Haz clic sobre una visita para editarla o reasignarla.</p>
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
                  <div className="space-y-1 mt-1">{dayVisits.map(v => <button type="button" onClick={() => openEditVisit(v)} key={v.id} className="w-full text-left bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-800/60 rounded p-1 text-[10px] text-cyan-200" title={`Editar ${v.address} - ${v.responsibleProfessional}`}><div className="font-bold truncate flex items-center gap-1">{v.startTime} · {v.clientName}<Pencil className="w-2.5 h-2.5 shrink-0"/></div><div className="truncate text-cyan-400">{v.responsibleProfessional}</div><div className="truncate text-slate-400">{v.status}</div></button>)}</div>
                </div>;
              })}
            </div>
          </> : <div className="py-12 text-center"><Clock className="w-8 h-8 text-cyan-400 mx-auto mb-3"/><h3 className="font-bold text-white">Vista de {viewMode==='week'?'Semana':'Día'}</h3><p className="text-xs text-slate-400 mt-1">Las visitas sincronizadas siguen disponibles en la vista mensual mientras completamos las franjas horarias.</p></div>}
        </div>
      )}

      {!loading && visitsList.length === 0 && <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center"><h3 className="font-bold text-white">No hay visitas programadas</h3><p className="text-xs text-slate-400 mt-1">Las visitas que guardes aquí quedarán en Supabase y podrán ser vistas por otros usuarios autorizados.</p></div>}

      {selectedVisit && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-white flex items-center gap-2"><Pencil className="w-4 h-4 text-cyan-400"/>Editar visita programada</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedVisit.clientName} · {selectedVisit.address}</p>
              </div>
              <button onClick={() => setSelectedVisit(null)} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"><X className="w-4 h-4"/></button>
            </div>

            {editError && <div className="bg-red-950 border border-red-800 text-red-200 rounded-xl p-3 text-xs">{editError}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-3"><label className="block text-slate-300 font-bold mb-1">Fecha</label><input type="date" value={editForm.date} onChange={e => setEditForm({...editForm,date:e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"/></div>
              <div><label className="block text-slate-300 font-bold mb-1">Hora inicio</label><input type="time" value={editForm.startTime} onChange={e => setEditForm({...editForm,startTime:e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"/></div>
              <div><label className="block text-slate-300 font-bold mb-1">Hora fin</label><input type="time" value={editForm.estimatedEndTime} onChange={e => setEditForm({...editForm,estimatedEndTime:e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"/></div>
              <div className="sm:col-span-3"><label className="block text-slate-300 font-bold mb-1 flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 text-cyan-400"/>Profesional responsable</label><select value={editForm.responsibleProfessionalId} onChange={e => setEditForm({...editForm,responsibleProfessionalId:e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"><option value="">Seleccione profesional...</option>{professionals.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select></div>
              <div className="sm:col-span-3"><label className="block text-slate-300 font-bold mb-1">Objetivo de la visita</label><textarea rows={3} value={editForm.visitObjective} onChange={e => setEditForm({...editForm,visitObjective:e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"/></div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setSelectedVisit(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">Cancelar</button>
              <button disabled={editSaving} onClick={saveVisitChanges} className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-60">{editSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}Guardar cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
