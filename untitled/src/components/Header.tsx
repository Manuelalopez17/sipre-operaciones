import React, { useState } from 'react';
import { UserRole } from '../types';
import { 
  Building2, 
  ShieldAlert, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  BookOpen, 
  Database, 
  PlusCircle, 
  LayoutDashboard, 
  Calendar, 
  FolderKanban, 
  ClipboardList, 
  HardHat, 
  Wrench, 
  Boxes, 
  Truck,
  CreditCard,
  Users, 
  Smartphone, 
  Menu, 
  X,
  UserCheck,
  LogOut,
  User,
  FileText,
  FileCheck2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDisplayRole } from '../lib/roles';

export type MainNavView = 
  | 'dashboard' 
  | 'agenda' 
  | 'visits'
  | 'reports'
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
  currentRole,
  onRoleChange,
  isOnline,
  pendingSyncCount,
  onSyncClick,
  isSyncing,
  activeView,
  onNavigate,
  onOpenSupabaseModal,
  onOpenNewCaseModal,
  onOpenScheduleVisitModal,
  onOpenEmergencyModal,
}) => {
  const { user, profile, signOut, currentEmergency } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'INICIO', icon: LayoutDashboard },
    { id: 'agenda', label: 'AGENDA', icon: Calendar },
    { id: 'visits', label: 'VISITAS', icon: ClipboardList },
    { id: 'reports', label: 'INFORMES', icon: FileText },
    { id: 'technical-review', label: 'CONCEPTOS', icon: FileCheck2 },
    { id: 'cases', label: 'EXPEDIENTES', icon: FolderKanban },
    { id: 'work-fronts', label: 'FRENTES DE OBRA', icon: Wrench },
    { id: 'materials', label: 'MATERIALES', icon: Boxes },
    { id: 'deliveries', label: 'ENTREGAS', icon: Truck },
    { id: 'billing', label: 'COBROS', icon: CreditCard },
    { id: 'team', label: 'EQUIPO', icon: Users },
  ] as const;

  const handleNavClick = (viewId: MainNavView) => {
    onNavigate(viewId);
    setIsMobileMenuOpen(false);
  };

  return (
    <header id="sipre-header" className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-md">
      {currentEmergency ? (
        <div className="bg-amber-950/70 border-b border-amber-800/60 px-4 py-1 flex items-center justify-between text-[11px] text-amber-200">
          <div className="flex items-center space-x-2 truncate max-w-2xl"><ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-pulse" /><span className="font-bold text-amber-300">EMERGENCIA ACTIVA:</span><span className="truncate">{currentEmergency.name} ({currentEmergency.municipality}, {currentEmergency.department})</span></div>
          {onOpenEmergencyModal && <button onClick={onOpenEmergencyModal} className="text-[10px] text-amber-400 hover:text-amber-200 underline font-bold">Cambiar Evento</button>}
        </div>
      ) : onOpenEmergencyModal ? (
        <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-1 flex items-center justify-between text-[11px] text-slate-400"><span>No hay evento sísmico o contingencia activa configurada.</span><button onClick={onOpenEmergencyModal} className="text-cyan-400 hover:text-cyan-300 font-bold underline text-[10px]">+ Configurar Emergencia</button></div>
      ) : null}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div id="brand-logo" className="flex items-center space-x-2.5 cursor-pointer flex-shrink-0" onClick={() => handleNavClick('dashboard')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center shadow-lg border border-cyan-500/30"><Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" /></div>
            <div><div className="flex items-center space-x-1.5"><span className="font-mono font-black text-base sm:text-lg tracking-wider text-white">SIPRE</span><span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/80">OPERACIONES</span></div><p className="text-[10px] text-slate-400 font-medium hidden sm:block">Centro de Operaciones Técnicas y Patología Estructural</p></div>
          </div>

          <nav className="hidden xl:flex items-center space-x-1">
            {navItems.map((item) => { const Icon = item.icon; const isActive = activeView === item.id; return <button key={item.id} id={`nav-tab-${item.id}`} onClick={() => handleNavClick(item.id as MainNavView)} className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${isActive ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'}`}><Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} /><span>{item.label}</span></button>; })}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="xl:hidden p-2 rounded-lg bg-slate-800 border border-slate-700"><Menu className="w-5 h-5" /></button>
            <div className="hidden md:flex items-center gap-1 text-[10px] text-slate-400">{isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-red-400" />}{pendingSyncCount > 0 && <button onClick={onSyncClick} className="flex items-center gap-1 px-2 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800">{isSyncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}{pendingSyncCount}</button>}</div>
            <button onClick={onOpenNewCaseModal} className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold"><PlusCircle className="w-4 h-4" />Nuevo Expediente</button>
            <div className="relative"><button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="p-2 rounded-lg bg-slate-800 border border-slate-700"><User className="w-4 h-4" /></button>{isUserMenuOpen && <div className="absolute right-0 mt-2 w-64 bg-white text-slate-900 border border-slate-200 rounded-xl shadow-xl p-3 z-50"><div className="font-bold text-sm">{profile?.full_name || user?.email}</div><div className="text-xs text-slate-500">{getDisplayRole(profile?.role)}</div><div className="border-t border-slate-200 mt-3 pt-2 space-y-1"><button onClick={onOpenSupabaseModal} className="w-full text-left px-2 py-2 rounded hover:bg-slate-50 text-xs flex items-center gap-2"><Database className="w-4 h-4" />Configuración</button><button onClick={() => handleNavClick('references')} className="w-full text-left px-2 py-2 rounded hover:bg-slate-50 text-xs flex items-center gap-2"><BookOpen className="w-4 h-4" />Referencias</button><button onClick={() => signOut()} className="w-full text-left px-2 py-2 rounded hover:bg-red-50 text-xs text-red-600 flex items-center gap-2"><LogOut className="w-4 h-4" />Cerrar sesión</button></div></div>}</div>
          </div>
        </div>

        {isMobileMenuOpen && <div className="xl:hidden pb-3 grid grid-cols-2 sm:grid-cols-3 gap-2">{navItems.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => handleNavClick(item.id as MainNavView)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-xs font-bold"><Icon className="w-4 h-4" />{item.label}</button>; })}</div>}
      </div>
    </header>
  );
};
