import React, { useEffect, useMemo, useState } from 'react';
import { Users, PlusCircle, Search, Mail, Award, Phone, Edit3, X, Loader2, RefreshCw, UserCheck, HardHat, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSupabaseClient } from '../lib/supabaseClient';
import { getVisitsFromDb, subscribeVisitsRealtime } from '../lib/remoteCore';
import { getDisplayRole, isProfessional } from '../lib/roles';
import { UserProfile, VisitRecord, SupabaseUserRole } from '../types';

const roleOptions: { value: SupabaseUserRole; label: string }[] = [
  { value: 'inspector', label: 'Profesional' },
  { value: 'structural_specialist', label: 'Profesional especialista' },
  { value: 'coordinator', label: 'Coordinador' },
  { value: 'administrator', label: 'Gerencia' },
  { value: 'field_supervisor', label: 'Operativo' },
];

export const TeamView: React.FC = () => {
  const { profile, activeProfiles, reloadActiveProfiles } = useAuth();
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ fullName: '', email: '', license: '', phone: '' });

  const canManage = !isProfessional(profile?.role);

  const load = async () => {
    try {
      await reloadActiveProfiles();
      setVisits(await getVisitsFromDb());
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'No se pudo actualizar el equipo.');
    }
  };

  useEffect(() => {
    load();
    const unsub = subscribeVisitsRealtime(() => getVisitsFromDb().then(setVisits).catch(() => {}));
    return unsub;
  }, []);

  const fieldStatus = (member: UserProfile) => {
    if (member.active === false) return 'Inactivo';
    const name = (member.full_name || '').trim().toLowerCase();
    const memberVisits = visits.filter(v => {
      const assignedId = (v as any).responsibleProfessionalId || '';
      const assignedName = (v.responsibleProfessional || '').trim().toLowerCase();
      return assignedId === member.id || (name && assignedName === name);
    });
    if (memberVisits.some(v => ['EN SITIO', 'EN INSPECCIÓN'].includes(String(v.status || '').toUpperCase()))) return 'En obra';
    if (memberVisits.some(v => String(v.status || '').toUpperCase() === 'EN RUTA')) return 'En ruta';
    return 'Disponible';
  };

  const members = useMemo(() => activeProfiles.filter(member => {
    const hay = `${member.full_name || ''} ${member.email || ''} ${member.professional_license || ''} ${getDisplayRole(member.role)}`.toLowerCase();
    const matchesSearch = !search.trim() || hay.includes(search.trim().toLowerCase());
    const matchesRole = roleFilter === 'all' || getDisplayRole(member.role) === roleFilter;
    return matchesSearch && matchesRole;
  }), [activeProfiles, search, roleFilter]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !canManage) return;
    const client = getSupabaseClient();
    if (!client) return setError('Supabase no está configurado.');
    setSaving(true);
    setError(null);
    try {
      const { error: dbError } = await client.from('profiles').update({
        full_name: editing.full_name,
        role: editing.role,
        professional_license: editing.professional_license || '',
        phone: editing.phone || '',
        email: editing.email || '',
        active: editing.active !== false,
        updated_at: new Date().toISOString(),
      }).eq('id', editing.id);
      if (dbError) throw new Error(dbError.message);
      await reloadActiveProfiles();
      setEditing(null);
      setNotice('Datos del usuario actualizados.');
      setTimeout(() => setNotice(null), 3000);
    } catch (e: any) {
      setError(e?.message || 'No se pudo actualizar el usuario.');
    } finally {
      setSaving(false);
    }
  };

  const inviteProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    const client = getSupabaseClient();
    if (!client) return setError('Supabase no está configurado.');
    if (!inviteForm.fullName.trim() || !inviteForm.email.trim()) return setError('Completa nombre y correo del profesional.');

    setSaving(true);
    setError(null);
    try {
      const { error: inviteError } = await client.auth.signInWithOtp({
        email: inviteForm.email.trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: window.location.origin,
          data: {
            full_name: inviteForm.fullName.trim(),
            role: 'inspector',
            professional_license: inviteForm.license.trim(),
            phone: inviteForm.phone.trim(),
          },
        },
      });
      if (inviteError) throw new Error(inviteError.message);
      setInviteOpen(false);
      setInviteForm({ fullName: '', email: '', license: '', phone: '' });
      setNotice('Invitación enviada. Cuando el profesional active el acceso desde su correo, aparecerá automáticamente para asignarle visitas.');
      setTimeout(() => setNotice(null), 6000);
    } catch (e: any) {
      setError(e?.message || 'No se pudo enviar la invitación.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">Equipo SIPRE</div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 mt-1"><Users className="w-6 h-6 text-cyan-400" />Profesionales y personal operativo</h1>
          <p className="text-xs text-slate-400 mt-1">Usuarios reales registrados en Supabase. Los profesionales activos quedan disponibles para asignación de visitas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={load} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"><RefreshCw className="w-4 h-4" />Actualizar</button>
          {canManage && <button onClick={() => setInviteOpen(true)} className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white flex items-center gap-1.5"><PlusCircle className="w-4 h-4" />Invitar profesional</button>}
        </div>
      </div>

      {notice && <div className="bg-emerald-950 border border-emerald-800 text-emerald-200 rounded-xl p-3 text-xs font-bold">{notice}</div>}
      {error && <div className="bg-red-950 border border-red-800 text-red-200 rounded-xl p-3 text-xs">{error}</div>}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, correo, matrícula o rol..." className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white" /></div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"><option value="all">Todos los roles</option><option value="Profesional">Profesional</option><option value="Coordinador">Coordinador</option><option value="Gerencia">Gerencia</option><option value="Operativo">Operativo</option></select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {members.map(member => {
          const status = fieldStatus(member);
          return (
            <div key={member.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex justify-between gap-3">
                <div><div className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">{getDisplayRole(member.role)}</div><h3 className="text-base font-black text-white mt-1">{member.full_name}</h3></div>
                <span className={`h-fit px-2.5 py-1 rounded-full text-[10px] font-bold border ${status === 'En obra' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : status === 'En ruta' ? 'bg-amber-950 text-amber-300 border-amber-800' : status === 'Inactivo' ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-cyan-950 text-cyan-300 border-cyan-800'}`}>{status}</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{member.email || 'Sin correo registrado'}</div>
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{member.phone || 'Sin teléfono'}</div>
                <div className="flex items-center gap-2"><Award className="w-3.5 h-3.5" />{member.professional_license || 'Sin matrícula registrada'}</div>
              </div>
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" />{member.active === false ? 'No asignable' : isProfessional(member.role) ? 'Asignable a visitas' : 'Usuario operativo'}</span>
                {canManage && <button onClick={() => setEditing({ ...member })} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1"><Edit3 className="w-3.5 h-3.5" />Editar</button>}
              </div>
            </div>
          );
        })}
      </div>

      {members.length === 0 && <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center"><HardHat className="w-8 h-8 text-slate-600 mx-auto mb-2" /><div className="font-bold text-white">No hay usuarios para mostrar</div><div className="text-xs text-slate-400 mt-1">Actualiza la lista o invita un nuevo profesional.</div></div>}

      {editing && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={saveProfile} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3"><h3 className="font-black text-white">Editar usuario</h3><button type="button" onClick={() => setEditing(null)} className="p-2 rounded-lg bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2"><label className="block text-slate-300 font-bold mb-1">Nombre completo</label><input value={editing.full_name || ''} onChange={e => setEditing({ ...editing, full_name: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white" required /></div>
              <div><label className="block text-slate-300 font-bold mb-1">Rol</label><select value={editing.role} onChange={e => setEditing({ ...editing, role: e.target.value as SupabaseUserRole })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white">{roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
              <div><label className="block text-slate-300 font-bold mb-1">Matrícula</label><input value={editing.professional_license || ''} onChange={e => setEditing({ ...editing, professional_license: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white" /></div>
              <div><label className="block text-slate-300 font-bold mb-1">Teléfono</label><input value={editing.phone || ''} onChange={e => setEditing({ ...editing, phone: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white" /></div>
              <div><label className="block text-slate-300 font-bold mb-1">Correo</label><input type="email" value={editing.email || ''} onChange={e => setEditing({ ...editing, email: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white" /></div>
              <label className="sm:col-span-2 flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300"><input type="checkbox" checked={editing.active !== false} onChange={e => setEditing({ ...editing, active: e.target.checked })} />Usuario activo y disponible para la operación</label>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800"><button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">Cancelar</button><button disabled={saving} className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Guardar cambios</button></div>
          </form>
        </div>
      )}

      {inviteOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={inviteProfessional} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3"><div><h3 className="font-black text-white flex items-center gap-2"><Send className="w-4 h-4 text-cyan-400" />Invitar nuevo profesional</h3><p className="text-xs text-slate-400 mt-1">Recibirá un enlace de acceso. Al activarlo quedará registrado como Profesional y podrá ser asignado a visitas.</p></div><button type="button" onClick={() => setInviteOpen(false)} className="p-2 rounded-lg bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2"><label className="block text-slate-300 font-bold mb-1">Nombre completo *</label><input value={inviteForm.fullName} onChange={e => setInviteForm({ ...inviteForm, fullName: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white" required /></div>
              <div className="sm:col-span-2"><label className="block text-slate-300 font-bold mb-1">Correo *</label><input type="email" value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white" required /></div>
              <div><label className="block text-slate-300 font-bold mb-1">Matrícula</label><input value={inviteForm.license} onChange={e => setInviteForm({ ...inviteForm, license: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white" /></div>
              <div><label className="block text-slate-300 font-bold mb-1">Teléfono</label><input value={inviteForm.phone} onChange={e => setInviteForm({ ...inviteForm, phone: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white" /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800"><button type="button" onClick={() => setInviteOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">Cancelar</button><button disabled={saving} className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Enviar invitación</button></div>
          </form>
        </div>
      )}
    </div>
  );
};
