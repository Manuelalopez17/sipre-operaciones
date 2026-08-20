import React, { useEffect, useMemo, useState } from 'react';
import { Award, Edit3, Loader2, Mail, Phone, RefreshCw, Search, ShieldCheck, UserCheck, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSupabaseClient } from '../lib/supabaseClient';
import { getDisplayRole, isCoordinator, isManagement, isProfessional } from '../lib/roles';
import { SupabaseUserRole, UserProfile } from '../types';

const roleOptions: { value: SupabaseUserRole; label: string }[] = [
  { value: 'inspector', label: 'Profesional' },
  { value: 'structural_specialist', label: 'Profesional especialista' },
  { value: 'coordinator', label: 'Coordinador' },
  { value: 'administrator', label: 'Gerencia' },
  { value: 'field_supervisor', label: 'Operativo' },
];

export const TeamView: React.FC = () => {
  const { user, profile, activeProfiles, reloadActiveProfiles } = useAuth();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const email = String(user?.email || profile?.email || '').trim().toLowerCase();
  const canManage = isCoordinator(profile?.role) || isManagement(profile?.role) || ['lopezecheverrymanuela@gmail.com','csgrupotecnico2026@gmail.com'].includes(email);

  const load = async () => {
    setLoading(true);
    try {
      await reloadActiveProfiles();
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'No se pudo actualizar la lista de usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const members = useMemo(() => activeProfiles.filter(member => {
    const hay = `${member.full_name || ''} ${member.email || ''} ${member.professional_license || ''} ${getDisplayRole(member.role)}`.toLowerCase();
    return !search.trim() || hay.includes(search.trim().toLowerCase());
  }).sort((a, b) => {
    if ((a.active === false) !== (b.active === false)) return a.active === false ? -1 : 1;
    return String(a.full_name || '').localeCompare(String(b.full_name || ''));
  }), [activeProfiles, search]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !canManage) return;
    const client = getSupabaseClient();
    if (!client) return setError('Supabase no está configurado.');

    setSaving(true);
    setError(null);
    try {
      const { error: rpcError } = await client.rpc('sipre_update_profile', {
        p_user_id: editing.id,
        p_full_name: editing.full_name || '',
        p_role: editing.role || 'inspector',
        p_professional_license: editing.professional_license || '',
        p_phone: editing.phone || '',
        p_active: editing.active !== false,
      });
      if (rpcError) throw new Error(rpcError.message);
      await reloadActiveProfiles();
      setEditing(null);
      setNotice('Usuario actualizado. Ya puede ingresar desde cualquier computador o celular con su propio correo y contraseña.');
      window.setTimeout(() => setNotice(null), 5000);
    } catch (e: any) {
      setError(e?.message || 'No se pudo actualizar el usuario. Ejecuta primero la migración de usuarios en Supabase si aún no se ha aplicado.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono font-bold tracking-widest text-teal-700 uppercase">Usuarios SIPRE</div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 mt-1"><Users className="w-6 h-6 text-teal-700" />Accesos individuales y roles</h1>
          <p className="text-xs text-slate-500 mt-1">Cada persona usa su propio correo y contraseña. La sesión funciona desde celular, tableta o computador y deja trazabilidad individual.</p>
        </div>
        <button onClick={load} className="px-3 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Actualizar</button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900">
        <div className="font-black flex items-center gap-2"><ShieldCheck className="w-4 h-4" />Cómo agregar un usuario</div>
        <p className="mt-1">La persona entra a la pantalla inicial de SIPRE, selecciona <strong>Crear cuenta</strong>, registra nombre, correo y contraseña. El perfil queda pendiente. Luego Coordinación/Gerencia lo activa aquí y define si es Profesional, Coordinador, Gerencia u Operativo.</p>
      </div>

      {notice && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs font-bold">{notice}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"><div className="relative"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, correo, matrícula o rol..." className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 bg-white" /></div></div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {members.map(member => (
          <article key={member.id} className={`bg-white border rounded-2xl p-5 shadow-sm space-y-4 ${member.active === false ? 'border-amber-300' : 'border-slate-200'}`}>
            <div className="flex items-start justify-between gap-3">
              <div><div className="text-[10px] uppercase tracking-wider text-teal-700 font-bold">{getDisplayRole(member.role)}</div><h3 className="text-base font-black text-slate-900 mt-1">{member.full_name || 'Usuario sin nombre'}</h3></div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${member.active === false ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>{member.active === false ? 'Pendiente / Inactivo' : 'Activo'}</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{member.email || 'Sin correo registrado'}</div>
              <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{member.phone || 'Sin teléfono'}</div>
              <div className="flex items-center gap-2"><Award className="w-3.5 h-3.5" />{member.professional_license || 'Sin matrícula registrada'}</div>
            </div>
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between gap-2"><span className="text-[10px] text-slate-500 flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" />{isProfessional(member.role) ? 'Asignable a visitas' : 'Acceso según rol'}</span>{canManage && <button onClick={() => setEditing({ ...member })} className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1"><Edit3 className="w-3.5 h-3.5" />Editar</button>}</div>
          </article>
        ))}
      </div>

      {!members.length && !loading && <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">No hay usuarios para mostrar.</div>}

      {editing && <div className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4"><form onSubmit={saveProfile} className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3"><div><h3 className="font-black text-slate-900">Editar acceso</h3><p className="text-xs text-slate-500 mt-1">{editing.email}</p></div><button type="button" onClick={() => setEditing(null)} className="p-2 rounded-lg bg-slate-100 text-slate-500"><X className="w-4 h-4" /></button></div>
        <div><label className="block text-xs font-bold text-slate-700 mb-1">Nombre completo</label><input required value={editing.full_name || ''} onChange={e => setEditing({ ...editing, full_name: e.target.value })} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label className="block text-xs font-bold text-slate-700 mb-1">Rol</label><select value={editing.role || 'inspector'} onChange={e => setEditing({ ...editing, role: e.target.value as SupabaseUserRole })} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs bg-white">{roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div><div><label className="block text-xs font-bold text-slate-700 mb-1">Matrícula</label><input value={editing.professional_license || ''} onChange={e => setEditing({ ...editing, professional_license: e.target.value })} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs" /></div></div>
        <div><label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label><input value={editing.phone || ''} onChange={e => setEditing({ ...editing, phone: e.target.value })} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs" /></div>
        <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700"><input type="checkbox" checked={editing.active !== false} onChange={e => setEditing({ ...editing, active: e.target.checked })} />Usuario activo y autorizado para ingresar</label>
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-3"><button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">Cancelar</button><button disabled={saving} className="px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Guardar cambios</button></div>
      </form></div>}
    </div>
  );
};
