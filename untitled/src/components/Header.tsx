import React, { useState } from 'react';
import { UserRole } from '../types';
import { Building2, ShieldAlert, Wifi, WifiOff, RefreshCw, BookOpen, Database, LayoutDashboard, Calendar, FolderKanban, ClipboardList, Wrench, Boxes, Truck, CreditCard, Users, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDisplayRole, getRoleCategory } from '../lib/roles';

export type MainNavView =
  | 'dashboard'
  | 'agenda'
  | 'visits'
  | 'cases'
  | 'work-fronts'
  | 'materials'
  | 'deliveries'
  | 'billing'
  | 'team'
  | 'inspections'
  | 'field-mode'
  | 'form'
  | 'report'
  | 'technical-review'
  | 'client-approval'
  | 'references';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isOnline: boolean;
  pendingSyncCount: number;
  onSyncClick: () => void;
  isSyncing: boolean;
  activeView: MainNavView;
  onNavigate: (view: MainNavView) => void;
  onOpenSupabaseModal: () => void;
  onOpenNewCaseModal: () => void;
  onOpenScheduleVisitModal: () => void;
  onOpenEmergencyModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isOnline,
  pendingSyncCount,
  onSyncClick,
  isSyncing,
  activeView,
  onNavigate,
  onOpenSupabaseModal,
  onOpenEmergencyModal,
}) => {
  const { user, profile, signOut, currentEmergency } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = getRoleCategory(profile?.role);

  const allItems = [
    { id: 'dashboard' as MainNavView, label: 'INICIO', icon: LayoutDashboard, roles: ['PROFESIONAL','COORDINADOR','GERENCIA','OPERATIVO'] },
    { id: 'agenda' as MainNavView, label: 'AGENDA', icon: Calendar, roles: ['PROFESIONAL','COORDINADOR','GERENCIA'] },
    { id: 'visits' as MainNavView, label: 'VISITAS', icon: ClipboardList, roles: ['PROFESIONAL','COORDINADOR','GERENCIA'] },
    { id: 'cases' as MainNavView, label: 'EXPEDIENTES', icon: FolderKanban, roles: ['PROFESIONAL','COORDINADOR','GERENCIA'] },
    { id: 'work-fronts' as MainNavView, label: 'FRENTES', icon: Wrench, roles: ['PROFESIONAL','COORDINADOR','GERENCIA','OPERATIVO'] },
    { id: 'materials' as MainNavView, label: 'MATERIALES', icon: Boxes, roles: ['COORDINADOR','GERENCIA','OPERATIVO'] },
    { id: 'deliveries' as MainNavView, label: 'ENTREGAS', icon: Truck, roles: ['COORDINADOR','GERENCIA','OPERATIVO'] },
    { id: 'billing' as MainNavView, label: 'COBROS', icon: CreditCard, roles: ['GERENCIA'] },
    { id: 'team' as MainNavView, label: 'EQUIPO', icon: Users, roles: ['COORDINADOR','GERENCIA'] },
  ];

  const navItems = allItems.filter(item => item.roles.includes(role));

  const navigate = (view: MainNavView) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-md">
      {currentEmergency ? (
        <div className="bg-amber-950/70 border-b border-amber-800/60 px-4 py-1 flex items-center justify-between text-[11px] text-amber-200">
          <div className="flex items-center gap-2 truncate">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-bold text-amber-300">EMERGENCIA ACTIVA:</span>
            <span className="truncate">{currentEmergency.name} ({currentEmergency.municipality}, {currentEmergency.department})</span>
          </div>
          {role === 'COORDINADOR' && onOpenEmergencyModal && (
            <button onClick={onOpenEmergencyModal} className="text-amber-400 hover:text-amber-200 underline font-bold">Cambiar evento</button>
          )}
        </div>
      ) : role === 'COORDINADOR' && onOpenEmergencyModal ? (
        <div className="bg-slate-950 border-b border-slate-800 px-4 py-1 flex items-center justify-between text-[11px] text-slate-400">
          <span>No hay emergencia activa.</span>
          <button onClick={onOpenEmergencyModal} className="text-cyan-400 underline font-bold">Configurar emergencia</button>
        </div>
      ) : null}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-3">
          <button onClick={() => navigate('dashboard')} className="flex items-center gap-2.5 shrink-0 text-left">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center border border-cyan-500/30">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5"><span className="font-mono font-black text-lg tracking-wider">SIPRE</span><span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">OPERACIONES</span></div>
              <div className="hidden sm:block text-[10px] text-slate-400">Centro de Operaciones Técnicas</div>
            </div>
          </button>

          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = activeView === item.id;
              return (
                <button key={item.id} onClick={() => navigate(item.id)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${active ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40' : 'text-slate-300 border-transparent hover:bg-slate-800'}`}>
                  <Icon className="w-3.5 h-3.5" />{item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => navigate('references')} className="hidden md:flex p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300" title="Referencias técnicas"><BookOpen className="w-4 h-4 text-cyan-400" /></button>
            <button onClick={onOpenSupabaseModal} className="hidden md:flex p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300" title="Estado de Supabase"><Database className="w-4 h-4 text-emerald-400" /></button>
            <button onClick={onSyncClick} disabled={isSyncing} className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 relative" title="Sincronizar">
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {pendingSyncCount > 0 && <span className="absolute -right-1 -top-1 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center">{pendingSyncCount}</span>}
            </button>
            <div className={`hidden sm:flex p-2 rounded-lg border ${isOnline ? 'bg-emerald-950 border-emerald-800 text-emerald-300' : 'bg-red-950 border-red-800 text-red-300'}`} title={isOnline ? 'En línea' : 'Sin conexión'}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </div>
            {user && (
              <div className="hidden sm:block text-right max-w-[150px]">
                <div className="text-xs font-bold text-white truncate">{profile?.full_name || user.email}</div>
                <div className="text-[10px] text-cyan-400 uppercase font-bold">{getDisplayRole(profile?.role)}</div>
              </div>
            )}
            <button onClick={() => signOut()} className="p-2 rounded-lg bg-slate-800 hover:bg-red-950 border border-slate-700 text-slate-300" title="Cerrar sesión"><LogOut className="w-4 h-4" /></button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="xl:hidden p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">{mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="xl:hidden border-t border-slate-800 bg-slate-900 p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {navItems.map(item => {
              const Icon = item.icon;
              return <button key={item.id} onClick={() => navigate(item.id)} className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200"><Icon className="w-4 h-4 text-cyan-400" />{item.label}</button>;
            })}
          </div>
          <div className="mt-3 text-[11px] text-slate-400">Sesión: <strong className="text-white">{profile?.full_name || user?.email}</strong> · {getDisplayRole(profile?.role)}</div>
        </div>
      )}
    </header>
  );
};
