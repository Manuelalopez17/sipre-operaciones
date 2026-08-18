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
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDisplayRole } from '../lib/roles';

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
      
      {/* Top Emergency Active Context Banner */}
      {currentEmergency ? (
        <div className="bg-amber-950/70 border-b border-amber-800/60 px-4 py-1 flex items-center justify-between text-[11px] text-amber-200">
          <div className="flex items-center space-x-2 truncate max-w-2xl">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-pulse" />
            <span className="font-bold text-amber-300">EMERGENCIA ACTIVA:</span>
            <span className="truncate">{currentEmergency.name} ({currentEmergency.municipality}, {currentEmergency.department})</span>
          </div>
          {onOpenEmergencyModal && (
            <button
              onClick={onOpenEmergencyModal}
              className="text-[10px] text-amber-400 hover:text-amber-200 underline font-bold"
            >
              Cambiar Evento
            </button>
          )}
        </div>
      ) : (
        onOpenEmergencyModal && (
          <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>No hay evento sísmico o contingencia activa configurada.</span>
            <button
              onClick={onOpenEmergencyModal}
              className="text-cyan-400 hover:text-cyan-300 font-bold underline text-[10px]"
            >
              + Configurar Emergencia
            </button>
          </div>
        )
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & App Title */}
          <div 
            id="brand-logo"
            className="flex items-center space-x-2.5 cursor-pointer flex-shrink-0" 
            onClick={() => handleNavClick('dashboard')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center shadow-lg border border-cyan-500/30">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-mono font-black text-base sm:text-lg tracking-wider text-white">SIPRE</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/80">
                  OPERACIONES
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Centro de Operaciones Técnicas y Patología Estructural
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (Desktop) */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => handleNavClick(item.id as MainNavView)}
                  className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center space-x-2">
            
            {/* Quick Field Mode Button */}
            <button
              id="header-btn-field-mode"
              onClick={() => handleNavClick('field-mode')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm ${
                activeView === 'field-mode'
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
              title="Iniciar o continuar Modo Campo"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline">MODO CAMPO</span>
            </button>

            {/* Quick Action Button: New Case */}
            <button
              id="header-btn-new-case"
              onClick={onOpenNewCaseModal}
              className="hidden lg:flex items-center space-x-1 bg-cyan-600 hover:bg-cyan-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
              title="Crear Nuevo Expediente"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nuevo Expediente</span>
            </button>

            {/* Technical Norms & References */}
            <button
              id="header-btn-references"
              onClick={() => handleNavClick('references')}
              className="hidden sm:flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
              title="Referencias Técnicas (NSR-10, AIS 410, FEMA)"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Normas</span>
            </button>

            {/* Supabase Cloud Connection Status */}
            <button
              id="header-btn-supabase-status"
              onClick={onOpenSupabaseModal}
              className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 px-2 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition-colors text-slate-300 hover:text-white"
              title="Estado de conexión Supabase"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline text-[11px]">Nube</span>
            </button>

            {/* Sync Queue Badge & Trigger */}
            <button
              id="header-btn-sync"
              onClick={onSyncClick}
              disabled={isSyncing}
              className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                pendingSyncCount > 0
                  ? 'bg-amber-950/80 border-amber-600/60 text-amber-300 hover:bg-amber-900'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title={pendingSyncCount > 0 ? `${pendingSyncCount} pendientes por sincronizar` : 'Todo sincronizado'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
              {pendingSyncCount > 0 && (
                <span className="bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                  {pendingSyncCount}
                </span>
              )}
            </button>

            {/* Online / Offline Status Badge */}
            <div 
              id="header-online-status"
              className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-bold border ${
                isOnline 
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80' 
                  : 'bg-red-950/80 text-red-300 border-red-800/80'
              }`}
              title={isOnline ? 'Conexión activa' : 'Sin conexión - Modo Local/Offline activo'}
            >
              {isOnline ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-red-400" />}
              <span className="hidden md:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* User Profile & Sign Out button */}
            {user && (
              <div className="relative flex items-center space-x-1.5 pl-1.5 border-l border-slate-800">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-white leading-tight truncate max-w-[140px]">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">
                    {getDisplayRole(profile?.role)}
                  </span>
                </div>

                <button
                  id="btn-sign-out"
                  onClick={() => signOut()}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-300 border border-slate-700 transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              id="header-mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>
      </div>

      {/* Secondary Desktop Navigation Row for Medium/Large screens */}
      <div className="hidden lg:flex xl:hidden border-t border-slate-800 bg-slate-900/90 px-4 py-1.5 overflow-x-auto space-x-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id as MainNavView)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div id="header-mobile-drawer" className="xl:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          
          {user && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs mb-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="font-bold text-white">{profile?.full_name || user.email}</div>
                  <div className="text-[10px] text-cyan-400 font-semibold uppercase">{getDisplayRole(profile?.role)}</div>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="px-2.5 py-1 bg-red-950 border border-red-800 text-red-300 font-bold rounded-lg text-xs flex items-center space-x-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                onOpenNewCaseModal();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center space-x-1 bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg text-xs font-bold"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nuevo Expediente</span>
            </button>

            <button
              onClick={() => {
                onOpenScheduleVisitModal();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-lg text-xs font-bold border border-slate-700"
            >
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Agendar Visita</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id as MainNavView)}
                  className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors text-left ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-300 hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <button
              onClick={() => handleNavClick('references')}
              className="flex items-center space-x-1 text-slate-300 hover:text-cyan-400"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Referencias NSR-10 / AIS 410</span>
            </button>

            <button
              onClick={onOpenSupabaseModal}
              className="flex items-center space-x-1 text-slate-300 hover:text-emerald-400"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Supabase</span>
            </button>
          </div>

        </div>
      )}
    </header>
  );
};
