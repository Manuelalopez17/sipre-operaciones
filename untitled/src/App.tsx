import React, { useState, useEffect } from 'react';
import { PropertyInspection, UserRole, VisitRecord } from './types';
import { getInspections, saveInspection, saveVisit, getPendingSyncCount, processSyncQueue, subscribeToNetworkStatus } from './lib/storage';
import { getVisitsFromDb } from './lib/remoteCore';
import { AuthProvider, useAuth } from './context/AuthContext';
import { subscribeToOperationalRealtime } from './lib/supabaseService';
import { getRoleCategory, isCoordinator, isProfessional } from './lib/roles';
import { Header, MainNavView } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { AgendaView } from './components/AgendaView';
import { CasesView } from './components/CasesView';
import { VisitsView } from './components/VisitsView';
import { WorkFrontsView } from './components/WorkFrontsView';
import { MaterialsView } from './components/MaterialsView';
import { DeliveriesView } from './components/DeliveriesView';
import { BillingView } from './components/BillingView';
import { TeamView } from './components/TeamView';
import { FieldModeView } from './components/FieldModeView';
import { TechnicalReviewView } from './components/TechnicalReviewView';
import { ClientApprovalView } from './components/ClientApprovalView';
import { CoordinatorOperations } from './components/CoordinatorOperations';
import { InspectionForm } from './components/InspectionForm';
import { ReportView } from './components/ReportView';
import { NewCaseModal } from './components/NewCaseModal';
import { ScheduleVisitModal } from './components/ScheduleVisitModal';
import { EmergencyConfigModal } from './components/EmergencyConfigModal';
import { TechnicalReferencesModal } from './components/TechnicalReferencesModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { LoginView } from './components/LoginView';
import { ShieldCheck, Loader2 } from 'lucide-react';

const AppInner: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [inspections, setInspections] = useState<PropertyInspection[]>([]);
  const [activeView, setActiveView] = useState<MainNavView>('dashboard');
  const [selectedInspection, setSelectedInspection] = useState<PropertyInspection | null>(null);
  const [selectedVisitForField, setSelectedVisitForField] = useState<VisitRecord | undefined>(undefined);
  const [currentRole, setCurrentRole] = useState<UserRole>('Inspector');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isReferencesModalOpen, setIsReferencesModalOpen] = useState(false);
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [isScheduleVisitModalOpen, setIsScheduleVisitModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  const refreshData = () => {
    setInspections(getInspections());
    setPendingSyncCount(getPendingSyncCount());
  };

  const syncRemoteVisitsToLocal = async () => {
    try {
      const remoteVisits = await getVisitsFromDb();
      remoteVisits.forEach(visit => saveVisit(visit, 'Supabase Sync'));
    } catch (err) {
      console.warn('Could not mirror Supabase visits into dashboard cache:', err);
    }
  };

  useEffect(() => {
    refreshData();
    syncRemoteVisitsToLocal().then(refreshData);
    const unsubNetwork = subscribeToNetworkStatus(online => {
      setIsOnline(online);
      if (online) handleTriggerSync();
    });
    const unsubRealtime = subscribeToOperationalRealtime((table, payload) => {
      console.log(`[Realtime Sync] Change detected on ${table}:`, payload);
      if (table === 'visits' || table === 'visit_assignments') syncRemoteVisitsToLocal().then(refreshData);
      else refreshData();
    });
    return () => { unsubNetwork(); unsubRealtime(); };
  }, []);

  useEffect(() => {
    setActiveView('dashboard');
    setSelectedVisitForField(undefined);
  }, [user?.id, profile?.role]);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      await processSyncQueue();
      await syncRemoteVisitsToLocal();
      refreshData();
    } catch (err) {
      console.warn('Sync queue error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveInspection = (updated: PropertyInspection) => {
    if (!isProfessional(profile?.role)) return;
    saveInspection(updated);
    refreshData();
    setSelectedInspection(updated);
  };

  const handleSelectInspection = (inspection: PropertyInspection) => {
    setSelectedInspection(inspection);
    setActiveView('form');
  };

  const handleViewReport = (inspection: PropertyInspection) => {
    setSelectedInspection(inspection);
    setActiveView('report');
  };

  const roleAllowsView = (view: MainNavView) => {
    const role = getRoleCategory(profile?.role);
    if (view === 'dashboard' || view === 'references') return true;
    if (role === 'PROFESIONAL') return ['agenda','visits','cases','work-fronts','field-mode','technical-review','client-approval','report'].includes(view);
    if (role === 'COORDINADOR') return ['agenda','visits','cases','work-fronts','materials','deliveries','team','report'].includes(view);
    if (role === 'GERENCIA') return ['agenda','visits','cases','work-fronts','materials','deliveries','billing','team','report'].includes(view);
    return ['work-fronts','materials','deliveries'].includes(view);
  };

  const handleNavigate = (view: MainNavView) => {
    if (view === 'references') return setIsReferencesModalOpen(true);
    if (!roleAllowsView(view)) return setActiveView('dashboard');
    if (view === 'field-mode') return; // El modo campo solo se abre desde una visita asignada.
    setActiveView(view);
  };

  const openNewCase = () => {
    if (isCoordinator(profile?.role)) setIsNewCaseModalOpen(true);
  };
  const openScheduleVisit = () => {
    if (isCoordinator(profile?.role)) setIsScheduleVisitModalOpen(true);
  };
  const openEmergency = () => {
    if (isCoordinator(profile?.role)) setIsEmergencyModalOpen(true);
  };

  const handleStartFieldMode = (visit?: VisitRecord) => {
    if (!visit || !isProfessional(profile?.role)) {
      window.alert('El modo campo solo puede iniciarse desde una visita asignada al profesional autenticado.');
      return;
    }
    const assignedId = (visit as any).responsibleProfessionalId || '';
    const assignedName = (visit.responsibleProfessional || '').trim().toLowerCase();
    const myName = (profile?.full_name || '').trim().toLowerCase();
    const assignedToMe = Boolean((user?.id && assignedId === user.id) || (myName && assignedName === myName));
    if (!assignedToMe) {
      window.alert('Esta visita está asignada a otro profesional. No puedes iniciar ni editar su inspección.');
      return;
    }
    setSelectedVisitForField(visit);
    setActiveView('field-mode');
  };

  if (authLoading) {
    return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4"><div className="w-16 h-16 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 animate-pulse"><ShieldCheck className="w-9 h-9" /></div><div className="flex items-center space-x-2 text-cyan-400 text-sm font-bold font-mono"><Loader2 className="w-4 h-4 animate-spin" /><span>CARGANDO SISTEMA SIPRE...</span></div></div>;
  }

  if (!user) {
    return <><LoginView onOpenSupabaseConfig={() => setIsSupabaseModalOpen(true)} /><SupabaseConfigModal isOpen={isSupabaseModalOpen} onClose={() => setIsSupabaseModalOpen(false)} /></>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        onSyncClick={handleTriggerSync}
        isSyncing={isSyncing}
        activeView={activeView}
        onNavigate={handleNavigate}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenNewCaseModal={openNewCase}
        onOpenScheduleVisitModal={openScheduleVisit}
        onOpenEmergencyModal={openEmergency}
      />

      <main className="flex-1 pb-10">
        {activeView === 'dashboard' && <Dashboard onNavigate={handleNavigate} onOpenNewCaseModal={openNewCase} onOpenScheduleVisitModal={openScheduleVisit} />}
        {activeView === 'agenda' && <AgendaView onOpenScheduleVisitModal={openScheduleVisit} />}
        {activeView === 'cases' && <CasesView onOpenNewCaseModal={openNewCase} onOpenScheduleVisitModal={openScheduleVisit} onStartFieldMode={handleStartFieldMode} onNavigateToWorkFronts={() => handleNavigate('work-fronts')} />}
        {activeView === 'visits' && <VisitsView onOpenScheduleVisitModal={openScheduleVisit} onStartFieldMode={handleStartFieldMode} />}
        {activeView === 'work-fronts' && <WorkFrontsView onNavigateToMaterials={() => handleNavigate('materials')} onNavigateToDeliveries={() => handleNavigate('deliveries')} />}
        {activeView === 'materials' && <MaterialsView onNavigateToDeliveries={() => handleNavigate('deliveries')} />}
        {activeView === 'deliveries' && <DeliveriesView />}
        {activeView === 'billing' && <BillingView />}
        {activeView === 'team' && <TeamView />}
        {activeView === 'inspections' && <CoordinatorOperations inspections={inspections} onSelectInspection={handleSelectInspection} onViewReport={handleViewReport} />}
        {activeView === 'field-mode' && selectedVisitForField && <FieldModeView onBackToDashboard={() => setActiveView('visits')} onFinalizeToTechnicalReview={() => setActiveView('technical-review')} initialVisit={selectedVisitForField} />}
        {activeView === 'technical-review' && isProfessional(profile?.role) && <TechnicalReviewView onNavigateToClientApproval={() => setActiveView('client-approval')} />}
        {activeView === 'client-approval' && isProfessional(profile?.role) && <ClientApprovalView onBackToDashboard={() => setActiveView('dashboard')} />}
        {activeView === 'form' && selectedInspection && isProfessional(profile?.role) && <InspectionForm inspection={selectedInspection} onSaveInspection={handleSaveInspection} onBack={() => setActiveView('inspections')} onViewReport={handleViewReport} currentRole={currentRole} />}
        {activeView === 'report' && selectedInspection && <ReportView inspection={selectedInspection} onBack={() => setActiveView('dashboard')} />}
      </main>

      <NewCaseModal isOpen={isNewCaseModalOpen && isCoordinator(profile?.role)} onClose={() => setIsNewCaseModalOpen(false)} onCaseCreated={refreshData} />
      <ScheduleVisitModal isOpen={isScheduleVisitModalOpen && isCoordinator(profile?.role)} onClose={() => setIsScheduleVisitModalOpen(false)} onVisitCreated={() => syncRemoteVisitsToLocal().then(refreshData)} />
      <EmergencyConfigModal isOpen={isEmergencyModalOpen && isCoordinator(profile?.role)} onClose={() => setIsEmergencyModalOpen(false)} />
      <TechnicalReferencesModal isOpen={isReferencesModalOpen} onClose={() => setIsReferencesModalOpen(false)} />
      <SupabaseConfigModal isOpen={isSupabaseModalOpen} onClose={() => setIsSupabaseModalOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => <AuthProvider><AppInner /></AuthProvider>;
export default App;
