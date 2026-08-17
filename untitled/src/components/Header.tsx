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
  Users, 
  Smartphone, 
  Menu, 
  X,
  UserCheck
} from 'lucide-react';

export type MainNavView = 
  | 'dashboard' 
  | 'agenda' 
  | 'cases' 
  | 'visits' 
  | 'inspections' 
  | 'interventions' 
  | 'materials' 
  | 'team' 
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
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'INICIO', icon: LayoutDashboard },
    { id: 'agenda', label: 'AGENDA', icon: Calendar },
    { id: 'cases', label: 'EXPEDIENTES', icon: FolderKanban },
    { id: 'visits', label: 'VISITAS', icon: ClipboardList },
    { id: 'inspections', label: 'INSPECCIONES', icon: HardHat },
    { id: 'interventions', label: 'INTERVENCIONES', icon: Wrench },
    { id: 'materials', label: 'MATERIALES', icon: Boxes },
    { id: 'team', label: 'EQUIPO', icon: Users },
  ] as const;

  const handleNavClick = (viewId: MainNavView) => {
    onNavigate(viewId);
    setIsMobileMenuOpen(false);
  };

  return (
    <header id="sipre-header" className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-md">
      {/* Top Main Navigation Bar */}
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
                <span className="font-black tracking-wider text-lg sm:text-xl text-white font-mono">SIPRE</span>
                <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[9px] sm:text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">
                  Operaciones Técnicas
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden md:block">
                Evaluación Técnica y Respuesta de Emergencia
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => handleNavClick(item.id as MainNavView)}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold tracking-wide flex items-center space-x-1.5 transition-colors ${
                    isActive
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Tools & Actions */}
          <div className="flex items-center space-x-2">
            
            {/* Field Mode Direct Button */}
            <button
              id="btn-nav-field-mode"
              onClick={() => handleNavClick('field-mode')}
              title="Modo Campo optimizado para Android y terreno"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 border transition-all ${
                activeView === 'field-mode'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                  : 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border-emerald-700/80'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">MODO CAMPO</span>
            </button>

            {/* Offline / Online Sync Indicator */}
            <div className="flex items-center">
              {isOnline ? (
                <div className="flex items-center space-x-1 bg-slate-800/80 border border-slate-700/80 rounded-lg px-2 py-1 text-xs">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="text-slate-300 text-[10px] font-medium hidden lg:inline">En Línea</span>
                  {pendingSyncCount > 0 && (
                    <span className="ml-1 bg-amber-500 text-slate-950 font-bold text-[9px] px-1 py-0.2 rounded-full">
                      {pendingSyncCount}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-1 bg-amber-950/60 border border-amber-600/50 rounded-lg px-2 py-1 text-xs text-amber-300">
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold text-[10px]">Offline</span>
                </div>
              )}

              {pendingSyncCount > 0 && (
                <button
                  id="btn-sync-data"
                  onClick={onSyncClick}
                  disabled={isSyncing}
                  title="Sincronizar datos locales con el servidor"
                  className="ml-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="hidden md:inline">SYNC</span>
                </button>
              )}
            </div>

            {/* Technical References Modal */}
            <button
              id="btn-technical-references"
              onClick={() => handleNavClick('references')}
              title="Normas Técnicas de Referencia (NSR-10, AIS 410, FEMA)"
              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700 hidden sm:flex"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {/* Supabase Config Button */}
            <button
              id="btn-supabase-modal"
              onClick={onOpenSupabaseModal}
              title="Configuración de Base de Datos y Supabase"
              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
            >
              <Database className="w-4 h-4" />
            </button>

            {/* Role Switcher */}
            <div className="relative hidden sm:flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400 mr-1" />
              <select
                id="role-selector"
                value={currentRole}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="bg-transparent text-[11px] font-medium text-slate-200 focus:outline-none cursor-pointer pr-1"
                aria-label="Seleccionar Rol de Usuario"
              >
                <option value="Inspector" className="bg-slate-900 text-white">Inspector</option>
                <option value="StructuralSpecialist" className="bg-slate-900 text-white">Especialista</option>
                <option value="Coordinator" className="bg-slate-900 text-white">Coordinador</option>
                <option value="Administrator" className="bg-slate-900 text-white">Admin</option>
                <option value="Viewer" className="bg-slate-900 text-white">Visualizador</option>
              </select>
            </div>

            {/* Quick Actions Dropdown / Direct Buttons */}
            <div className="hidden lg:flex items-center space-x-1.5">
              <button
                id="btn-header-new-case"
                onClick={onOpenNewCaseModal}
                className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 shadow transition-all active:scale-95 whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>+ EXPEDIENTE</span>
              </button>

              <button
                id="btn-header-schedule-visit"
                onClick={onOpenScheduleVisitModal}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-lg shadow-cyan-600/20 border border-cyan-400/40 transition-all active:scale-95 whitespace-nowrap"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>+ VISITA</span>
              </button>
            </div>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              id="btn-mobile-menu"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Abrir Menú de Navegación"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div id="mobile-nav-drawer" className="xl:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id as MainNavView)}
                  className={`p-2.5 rounded-lg text-xs font-bold flex items-center space-x-2 transition-colors ${
                    isActive
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                onOpenNewCaseModal();
                setIsMobileMenuOpen(false);
              }}
              className="bg-slate-800 text-cyan-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Nuevo Expediente</span>
            </button>

            <button
              onClick={() => {
                onOpenScheduleVisitModal();
                setIsMobileMenuOpen(false);
              }}
              className="bg-cyan-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>+ Programar Visita</span>
            </button>
          </div>
        </div>
      )}

      {/* Safety Notice & Engineering Standards Bar */}
      <div className="bg-slate-950/90 border-t border-slate-800/80 px-4 py-1 text-[11px] text-slate-400 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center space-x-2 whitespace-nowrap">
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <span className="font-semibold text-slate-300">Aviso de Seguridad:</span>
          <span>La IA es una herramienta de asistencia técnica preliminar. Toda decisión estructural requiere verificación y concepto de un profesional matriculado.</span>
        </div>
        <span className="font-mono text-[10px] text-slate-400 ml-4 hidden md:inline">NSR-10 / AIS 410 / FEMA P-2055 Compliant</span>
      </div>
    </header>
  );
};
