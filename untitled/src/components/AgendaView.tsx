import React, { useEffect, useMemo, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, PlusCircle, Clock, Pencil, X, Loader2, Save, UserCheck, Trash2, Eye, MapPin } from 'lucide-react';
import { VisitRecord } from '../types';
import { getVisitsFromDb, subscribeVisitsRealtime } from '../lib/remoteCore';
import { getSupabaseClient } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { isProfessional } from '../lib/roles';
import { deleteWorkFrontInDb } from '../lib/workFrontRemote';

interface AgendaViewProps {
  onOpenScheduleVisitModal: () => void;
  visits?: VisitRecord[];
}

const normalizeTime = (value?: string) => {
  if (!value) return '';
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : '';
};

const dateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDay = (value: string) => {
  if (!value) return '';
  const d = new Date(`${value}T12:00:00`);
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'short' });
};

export const AgendaView: React.FC<AgendaViewProps> = ({ onOpenScheduleVisitModal, visits: propVisits }) => {
  const { user, profile, activeProfiles } = useAuth();
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visitsList, setVisitsList] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<VisitRecord | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    clientName: '',
    address: '',
    municipality: '',
    neighborhood: '',
    date: '',
    startTime: '',
    estimatedEndTime: '',
    responsibleProfessionalId: '',
    visitObjective: '',
    status: 'PROGRAMADA',
  });

  const professional = isProfessional(profile?.role);
  const planner = !professional;
  const professionals = activeProfiles.filter(
    p => p.active !== false && ['inspector', 'structural_specialist', 'profesional'].includes(String(p.role || '').toLowerCase())
  );

  const isAssignedToMe = (visit: VisitRecord) => {
    const assignedId = (visit as any).responsibleProfessionalId || '';
    const assignedName = (visit.responsibleProfessional || '').trim().toLowerCase();
    const myName = (profile?.full_name || '').trim().toLowerCase();
    return Boolean((user?.id && assignedId === user.id) || (myName && assignedName === myName));
  };

  const reload = async () => {
    if (propVisits) {
      setVisitsList(propVisits);
      setLoading(false);
      return;
    }
    try {
      setVisitsList(await getVisitsFromDb());
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'No se pudo cargar la agenda desde Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    const unsubscribe = subscribeVisitsRealtime(reload);
    return unsubscribe;
  }, [propVisits]);

  const displayedVisits = useMemo(() => {
    if (professional) return visitsList.filter(isAssignedToMe);
    return visitsList;
  }, [visitsList, professional, user?.id, profile?.full_name]);

  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const daysOfWeek = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();
    const result: { dayNumber: number | null; dateStr: string; active: boolean }[] = [];
    for (let i = 0; i < firstDayIndex; i++) result.push({ dayNumber: null, dateStr: '', active: false });
    for (let d = 1; d <= totalDays; d++) {
      result.push({ dayNumber: d, dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, active: true });
    }
    return result;
  }, [currentDate]);

  const weekDates = useMemo(() => {
    const start = new Date(currentDate);
    const mondayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - mondayOffset);
    return Array.from({ length: 7 }, (_, index) => {
      const d = new Date(start);
      d.setDate(start.getDate() + index);
      return dateStr(d);
    });
  }, [currentDate]);

  const dayVisits = useMemo(
    () => displayedVisits.filter(v => v.date === dateStr(currentDate)).sort((a, b) => normalizeTime(a.startTime).localeCompare(normalizeTime(b.startTime))),
    [displayedVisits, currentDate]
  );

  const move = (dir: number) => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + dir);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7 * dir);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const openVisit = (visit: VisitRecord) => {
    const assignedId = (visit as any).responsibleProfessionalId || professionals.find(p => p.full_name === visit.responsibleProfessional)?.id || '';
    setSelectedVisit(visit);
    setEditForm({
      clientName: visit.clientName || '',
      address: visit.address || '',
      municipality: visit.municipality || '',
      neighborhood: visit.neighborhood || '',
      date: visit.date || '',
      startTime: normalizeTime(visit.startTime),
      estimatedEndTime: normalizeTime(visit.estimatedEndTime),
      responsibleProfessionalId: assignedId,
      visitObjective: visit.visitObjective || '',
      status: visit.status || 'PROGRAMADA',
    });
    setEditError(null);
  };

  const saveVisitChanges = async () => {
    if (!selectedVisit || !planner) return;
    if (!editForm.responsibleProfessionalId) return setEditError('Selecciona el profesional responsable.');
    if (!editForm.clientName.trim() || !editForm.address.trim() || !editForm.municipality.trim()) return setEditError('Completa cliente/predio, dirección y municipio.');
    if (!editForm.date || !editForm.startTime || !editForm.estimatedEndTime) return setEditError('Completa fecha y horario.');
    if (editForm.estimatedEndTime <= editForm.startTime) return setEditError('La hora de finalización debe ser posterior a la hora de inicio.');

    const client = getSupabaseClient();
    if (!client) return setEditError('Supabase no está configurado.');
    const assignedProfessional = professionals.find(p => p.id === editForm.responsibleProfessionalId);
    if (!assignedProfessional) return setEditError('No se encontró el profesional seleccionado.');

    setEditSaving(true);
    setEditError(null);
    try {
      const now = new Date().toISOString();
      const scheduledStart = new Date(`${editForm.date}T${editForm.startTime}:00`).toISOString();
      const scheduledEnd = new Date(`${editForm.date}T${editForm.estimatedEndTime}:00`).toISOString();
      const statusPatch: any = { status: editForm.status, updated_at: now };

      if (['PROGRAMADA', 'scheduled', 'REPROGRAMADA'].includes(editForm.status)) {
        Object.assign(statusPatch, {
          confirmed_at: null,
          en_route_at: null,
          on_site_at: null,
          check_in_at: null,
          inspection_started_at: null,
          check_out_at: null,
          completed_by: null,
        });
      }

      const { error: visitError } = await client.from('visits').update({
        client_name: editForm.clientName.trim(),
        address: editForm.address.trim(),
        municipality: editForm.municipality.trim(),
        neighborhood: editForm.neighborhood.trim(),
        date: editForm.date,
        start_time: editForm.startTime,
        estimated_end_time: editForm.estimatedEndTime,
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        assigned_to: assignedProfessional.id,
        responsible_professional: assignedProfessional.full_name,
        visit_objective: editForm.visitObjective,
        objective: editForm.visitObjective,
        ...statusPatch,
      }).eq('id', selectedVisit.id);
      if (visitError) throw new Error(visitError.message);

      const { data: assignments, error: assignmentReadError } = await client
        .from('visit_assignments')
        .select('id')
        .eq('visit_id', selectedVisit.id)
        .limit(1);
      if (assignmentReadError) throw new Error(assignmentReadError.message);

      if (assignments?.length) {
        const { error: assignmentError } = await client.from('visit_assignments').update({
          user_id: assignedProfessional.id,
          professional_name: assignedProfessional.full_name,
          assignment_status: editForm.status === 'CONFIRMADA' ? 'accepted' : 'assigned',
          responded_at: editForm.status === 'CONFIRMADA' ? now : null,
        }).eq('id', assignments[0].id);
        if (assignmentError) throw new Error(assignmentError.message);
      } else {
        const { error: assignmentError } = await client.from('visit_assignments').insert({
          visit_id: selectedVisit.id,
          user_id: assignedProfessional.id,
          professional_name: assignedProfessional.full_name,
          role_in_visit: 'Líder de Inspección',
          assignment_status: 'assigned',
        });
        if (assignmentError) throw new Error(assignmentError.message);
      }

      await reload();
      setSelectedVisit(null);
    } catch (e: any) {
      setEditError(e?.message || 'No se pudo actualizar la visita.');
    } finally {
      setEditSaving(false);
    }
  };

  const legacyDelete = async (visitId: string) => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase no está configurado.');

    const { data: relatedFronts } = await client.from('work_fronts').select('id').eq('originating_visit_id', visitId);
    for (const front of relatedFronts || []) await deleteWorkFrontInDb(front.id);

    const childTables = ['reports','client_approvals','technical_decisions','findings','evidence_files','visit_assessments','inspections','visit_assignments'];
    for (const table of childTables) {
      const { error: childError } = await client.from(table).delete().eq('visit_id', visitId);
      if (childError && !String(childError.message || '').toLowerCase().includes('could not find')) {
        console.warn(`No se pudo limpiar ${table}:`, childError.message);
      }
    }

    const { error: visitError } = await client.from('visits').delete().eq('id', visitId);
    if (visitError) throw new Error(visitError.message);
  };

  const deleteVisit = async () => {
    if (!selectedVisit || !planner) return;
    const ok = window.confirm(`¿Eliminar definitivamente la visita de ${selectedVisit.clientName}?\n\nSe eliminarán también los datos de prueba relacionados con esta visita.`);
    if (!ok) return;

    const client = getSupabaseClient();
    if (!client) return setEditError('Supabase no está configurado.');

    setEditSaving(true);
    setEditError(null);
    try {
      const visitId = selectedVisit.id;

      const { data: evidenceRows } = await client.from('evidence_files').select('storage_path').eq('visit_id', visitId);
      const storagePaths = (evidenceRows || []).map((r: any) => r.storage_path).filter(Boolean);
      if (storagePaths.length) await client.storage.from('sipre-files').remove(storagePaths);

      const { error: rpcError } = await client.rpc('sipre_delete_visit', { p_visit_id: visitId });
      if (rpcError) {
        const msg = String(rpcError.message || '').toLowerCase();
        const functionMissing = msg.includes('sipre_delete_visit') && (msg.includes('not found') || msg.includes('schema cache') || msg.includes('function'));
        if (functionMissing) await legacyDelete(visitId);
        else throw new Error(rpcError.message);
      }

      await reload();
      setSelectedVisit(null);
    } catch (e: any) {
      setEditError(`No se pudo eliminar la prueba: ${e?.message || 'error desconocido'}. Si aparece un mensaje de permisos/RLS, instala una sola vez el SQL de eliminación segura de SIPRE en Supabase.`);
    } finally {
      setEditSaving(false);
    }
  };

  const visitCard = (v: VisitRecord) => (
    <button key={v.id} type="button" onClick={() => openVisit(v)} className="w-full text-left bg-slate-950 border border-slate-800 hover:border-cyan-700 rounded-xl p-3 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold text-white text-sm truncate">{normalizeTime(v.startTime)} · {v.clientName || v.address}</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{v.address}, {v.municipality}</span></div>
          <div className="text-xs text-cyan-300 mt-1 flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" />{v.responsibleProfessional || 'Por asignar'}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0"><span className="text-[10px] px-2 py-1 rounded-full bg-slate-800 text-slate-300">{v.status}</span>{planner ? <Pencil className="w-4 h-4 text-cyan-400" /> : <Eye className="w-4 h-4 text-slate-400" />}</div>
      </div>
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">Planificación Operativa</div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 mt-1"><CalendarIcon className="w-6 h-6 text-cyan-400" />Agenda de Visitas</h1>
          <p className="text-xs text-slate-400 mt-1">{planner ? 'Puedes editar, reasignar y eliminar pruebas desde las vistas Mes, Semana y Día.' : 'Aquí ves tu agenda personal según el usuario con el que ingresaste.'}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex gap-1">
            {(['month','week','day'] as const).map(v => <button key={v} onClick={() => setViewMode(v)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${viewMode === v ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>{v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}</button>)}
          </div>
          {planner && <button onClick={onOpenScheduleVisitModal} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"><PlusCircle className="w-4 h-4" />PROGRAMAR VISITA</button>}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-bold text-white">{viewMode === 'day' ? formatDay(dateStr(currentDate)) : `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`}</h2>
          <button onClick={() => setCurrentDate(new Date())} className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg text-xs">Hoy</button>
          <button onClick={reload} className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg text-xs">Actualizar</button>
        </div>
        <div className="flex gap-2"><button onClick={() => move(-1)} className="p-2 bg-slate-800 rounded-lg"><ChevronLeft className="w-4 h-4" /></button><button onClick={() => move(1)} className="p-2 bg-slate-800 rounded-lg"><ChevronRight className="w-4 h-4" /></button></div>
      </div>

      {error && <div className="bg-red-950 border border-red-800 text-red-200 rounded-xl p-3 text-sm">{error}</div>}

      {loading ? <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">Cargando agenda compartida...</div> : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          {viewMode === 'month' && <>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase pb-2 border-b border-slate-800">{daysOfWeek.map(d => <div key={d}>{d}</div>)}</div>
            <div className="grid grid-cols-7 gap-2 mt-2">
              {monthDays.map((item, idx) => {
                const visits = item.dateStr ? displayedVisits.filter(v => v.date === item.dateStr) : [];
                return <div key={idx} className={`min-h-[105px] p-2 rounded-xl border ${item.active ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-950/20 border-slate-900 opacity-40'}`}>
                  <div className="text-xs font-mono font-bold text-slate-300">{item.dayNumber || ''}</div>
                  <div className="space-y-1 mt-1">{visits.map(v => <button key={v.id} type="button" onClick={() => openVisit(v)} className="w-full text-left bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-800/60 rounded p-1 text-[10px] text-cyan-200"><div className="font-bold truncate flex items-center gap-1">{normalizeTime(v.startTime)} · {v.clientName}{planner ? <Pencil className="w-2.5 h-2.5 shrink-0" /> : <Eye className="w-2.5 h-2.5 shrink-0" />}</div><div className="truncate text-cyan-400">{v.responsibleProfessional}</div><div className="truncate text-slate-400">{v.status}</div></button>)}</div>
                </div>;
              })}
            </div>
          </>}

          {viewMode === 'week' && <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
            {weekDates.map(day => {
              const visits = displayedVisits.filter(v => v.date === day).sort((a, b) => normalizeTime(a.startTime).localeCompare(normalizeTime(b.startTime)));
              const today = day === dateStr(new Date());
              return <section key={day} className={`rounded-xl border p-3 min-h-[180px] ${today ? 'bg-cyan-950/25 border-cyan-800' : 'bg-slate-950/60 border-slate-800'}`}>
                <div className="text-xs font-black text-white capitalize">{formatDay(day)}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{visits.length} visita(s)</div>
                <div className="space-y-2 mt-3">{visits.map(visitCard)}{!visits.length && <div className="text-[11px] text-slate-600 py-4 text-center">Sin visitas</div>}</div>
              </section>;
            })}
          </div>}

          {viewMode === 'day' && <div className="space-y-3">
            <div className="flex items-center justify-between"><div><h3 className="font-black text-white capitalize">{formatDay(dateStr(currentDate))}</h3><p className="text-xs text-slate-400">{planner ? 'Haz clic en cualquier visita para editarla, reasignarla o eliminar una prueba.' : 'Tus visitas asignadas para este día.'}</p></div><span className="text-xs font-mono text-cyan-300">{dayVisits.length} visita(s)</span></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{dayVisits.map(visitCard)}</div>
            {!dayVisits.length && <div className="p-8 text-center text-slate-500 bg-slate-950/50 rounded-xl border border-slate-800">No hay visitas programadas para este día.</div>}
          </div>}
        </div>
      )}

      {selectedVisit && <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-4 my-6">
          <div className="flex items-start justify-between border-b border-slate-800 pb-3"><div><h3 className="font-black text-white flex items-center gap-2">{planner ? <Pencil className="w-4 h-4 text-cyan-400" /> : <Eye className="w-4 h-4 text-cyan-400" />}{planner ? 'Editar visita' : 'Detalle de visita'}</h3><p className="text-xs text-slate-400 mt-1">{selectedVisit.clientName} · {selectedVisit.address}</p></div><button onClick={() => setSelectedVisit(null)} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button></div>
          {editError && <div className="bg-red-950 border border-red-800 text-red-200 rounded-xl p-3 text-xs">{editError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div><label className="block text-slate-300 font-bold mb-1">Cliente / predio</label><input disabled={!planner} value={editForm.clientName} onChange={e => setEditForm({ ...editForm, clientName: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white disabled:opacity-70" /></div>
            <div><label className="block text-slate-300 font-bold mb-1">Municipio</label><input disabled={!planner} value={editForm.municipality} onChange={e => setEditForm({ ...editForm, municipality: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white disabled:opacity-70" /></div>
            <div className="sm:col-span-2"><label className="block text-slate-300 font-bold mb-1">Dirección</label><input disabled={!planner} value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white disabled:opacity-70" /></div>
            <div><label className="block text-slate-300 font-bold mb-1">Barrio / sector</label><input disabled={!planner} value={editForm.neighborhood} onChange={e => setEditForm({ ...editForm, neighborhood: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white disabled:opacity-70" /></div>
            <div><label className="block text-slate-300 font-bold mb-1">Fecha</label><input disabled={!planner} type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white disabled:opacity-70" /></div>
            <div><label className="block text-slate-300 font-bold mb-1">Hora inicio</label><input disabled={!planner} type="time" value={editForm.startTime} onChange={e => setEditForm({ ...editForm, startTime: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white disabled:opacity-70" /></div>
            <div><label className="block text-slate-300 font-bold mb-1">Hora fin</label><input disabled={!planner} type="time" value={editForm.estimatedEndTime} onChange={e => setEditForm({ ...editForm, estimatedEndTime: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white disabled:opacity-70" /></div>
            <div className="sm:col-span-2"><label className="block text-slate-300 font-bold mb-1 flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 text-cyan-400" />Profesional responsable</label><select disabled={!planner} value={editForm.responsibleProfessionalId} onChange={e => setEditForm({ ...editForm, responsibleProfessionalId: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white disabled:opacity-70"><option value="">Seleccione profesional...</option>{professionals.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select></div>
            <div className="sm:col-span-2"><label className="block text-slate-300 font-bold mb-1">Estado</label><select disabled={!planner} value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white disabled:opacity-70"><option value="PROGRAMADA">PROGRAMADA</option><option value="CONFIRMADA">CONFIRMADA</option><option value="EN RUTA">EN RUTA</option><option value="EN SITIO">EN SITIO</option><option value="EN INSPECCIÓN">EN INSPECCIÓN</option><option value="TERMINADA">TERMINADA</option><option value="REPROGRAMADA">REPROGRAMADA</option><option value="CANCELADA">CANCELADA</option></select></div>
            <div className="sm:col-span-2"><label className="block text-slate-300 font-bold mb-1">Objetivo de la visita</label><textarea disabled={!planner} rows={3} value={editForm.visitObjective} onChange={e => setEditForm({ ...editForm, visitObjective: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white disabled:opacity-70" /></div>
          </div>
          <div className="flex justify-between gap-2 pt-2 border-t border-slate-800">
            {planner ? <button disabled={editSaving} onClick={deleteVisit} className="px-4 py-2 rounded-xl bg-red-950 border border-red-800 text-red-300 text-xs font-bold flex items-center gap-1 disabled:opacity-50"><Trash2 className="w-4 h-4" />Eliminar prueba / dato erróneo</button> : <span className="text-[11px] text-slate-500">Modo lectura</span>}
            <div className="flex gap-2"><button onClick={() => setSelectedVisit(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">Cerrar</button>{planner && <button disabled={editSaving} onClick={saveVisitChanges} className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2">{editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Guardar cambios</button>}</div>
          </div>
        </div>
      </div>}
    </div>
  );
};
