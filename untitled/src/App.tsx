import React, { useState, useEffect } from 'react';
import { PropertyInspection, UserRole, VisitRecord } from './types';
import {
  getInspections,
  saveInspection,
  saveVisit,
  saveCase,
  getPendingSyncCount,
  processSyncQueue,
  subscribeToNetworkStatus,
} from './lib/storage';
import { getVisitsFromDb } from './lib/remoteCore';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getCasesFromDb, subscribeToOperationalRealtime, finishVisitInDb } from './lib/supabaseService';
import { syncWorkFrontCacheFromDb } from './lib/workFrontRemote';
import { getRoleCategory, isPlanner, isProfessional } from './lib/roles';
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

  /**
   * Hydrates the browser cache from the shared Supabase database.
   * Several legacy screens still read the fast local cache, so we keep that
   * cache mirrored from the cloud to preserve the complete interface on every device.
   */
  const syncRemoteOperationalToLocal = async () => {
    if (!user?.id) return;
    try {
      const [remoteVisits, remoteCases] = await Promise.all([
        getVisitsFromDb(),
        getCasesFromDb(),
      ]);
      remoteVisits.forEach(visit => saveVisit(visit, 'Supabase Sync'));
      remoteCases.forEach(caseRecord => saveCase(caseRecord, 'Supabase Sync'));
      await syncWorkFrontCacheFromDb();
    } catch (err) {
      console.warn('Could not mirror Supabase operational data into dashboard cache:', err);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    refreshData();
    syncRemoteOperationalToLocal().then(refreshData);

    const unsubNetwork = subscribeToNetworkStatus(online => {
      setIsOnline(online);
      if (online) handleTriggerSync();
    });

    const unsubRealtime = subscribeToOperationalRealtime((table, payload) => {
      console.log(`[Realtime Sync] Change detected on ${table}:`, payload);
      if (['visits', 'visit_assignments', 'cases', 'work_fronts'].includes(table)) {
        syncRemoteOperationalToLocal().then(refreshData);
      } else {
        refreshData();
      }
    });

    return () => {
      unsubNetwork();
      unsubRealtime();
    };
  }, [user?.id]);

  useEffect(() => {
    setActiveView('dashboard');
    setSelectedVisitForField(undefined);
  }, [user?.id, profile?.role]);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      await processSyncQueue();
      await syncRemoteOperationalToLocal();
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

    // Professional: full technical context in read mode, with write access only
    // to the inspection/report that belongs to an assigned visit.
    if (role === 'PROFESIONAL') {
      return [
        'agenda','visits','cases','work-fronts','materials','deliveries','team',
        'inspections','field-mode','technical-review','client-approval','report'
      ].includes(view);
    }

    // Coordinator and Management can see the complete operation. Their write
    // permissions are controlled inside each screen.
    if (role === 'COORDINADOR' || role === 'GERENCIA') {
      return [
        'agenda','visits','cases','work-fronts','materials','deliveries','billing',
        'team','inspections','report'
      ].includes(view);
    }

    // Operative personnel need the context of the case/front plus logistics.
    return ['cases','work-fronts','materials','deliveries','team'].includes(view);
  };

  const handleNavigate = (view: MainNavView) => {
    if (view === 'references') return setIsReferencesModalOpen(true);
    if (!roleAllowsView(view)) return setActiveView('dashboard');
    if (view === 'field-mode') return; // opens only from an assigned visit
    setActiveView(view);
  };

  const openNewCase = () => {
    if (isPlanner(profile?.role)) setIsNewCaseModalOpen(true);
  };

  const openScheduleVisit = () => {
    if (isPlanner(profile?.role)) setIsScheduleVisitModalOpen(true);
  };

  const openEmergency = () => {
    if (isPlanner(profile?.role)) setIsEmergencyModalOpen(true);
  };

  const handleStartFieldMode = (visit?: VisitRecord) => {
    if (!visit || !isProfessional(profile?.role)) {
      window.alert('El modo campo solo puede iniciarse desde una visita asignada al profesional autenticado.');
      return;
    }

    const assignedId = (visit as any).responsibleProfessionalId || '';
    const assignedName = (visit.responsibleProfessional || '').trim().toLowerCase();
    const myName = (profile?.full_name || '').trim().toLowerCase();
    const assignedToMe = Boolean(
      (user?.id && assignedId === user.id) ||
      (myName && assignedName === myName)
    );

    if (!assignedToMe) {
      window.alert('Esta visita está asignada a otro profesional. No puedes iniciar ni editar su inspección.');
      return;
    }

    setSelectedVisitForField(visit);
    setActiveView('field-mode');
  };

  const handleFinalizeFieldInspection = async () => {
    if (selectedVisitForField?.id && user?.id) {
      const ok = await finishVisitInDb(
        selectedVisitForField.id,
        user.id,
        profile?.full_name || user.email || 'Profesional SIPRE'
      );
      if (!ok) {
        window.alert('La inspección se guardó localmente, pero no fue posible marcar la visita como terminada en Supabase. Revisa la conexión e inténtalo nuevamente.');
        return;
      }
      await syncRemoteOperationalToLocal();
      refreshData();
    }
    setActiveView('technical-review');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 animate-pulse">
          <ShieldCheck className="w-9 h-9" />
        </div>
        <div className="flex items-center space-x-2 text-cyan-400 text-sm font-bold font-mono">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>CARGANDO SISTEMA SIPRE...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginView onOpenSupabaseConfig={() => setIsSupabaseModalOpen(true)} />
        <SupabaseConfigModal isOpen={isSupabaseModalOpen} onClose={() => setIsSupabaseModalOpen(false)} />
      </>
    );
  }

  const planner = isPlanner(profile?.role);

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
        {activeView === 'dashboard' && (
          <Dashboard
            onNavigate={handleNavigate}
            onOpenNewCaseModal={openNewCase}
            onOpenScheduleVisitModal={openScheduleVisit}
          />
        )}
        {activeView === 'agenda' && <AgendaView onOpenScheduleVisitModal={openScheduleVisit} />}
        {activeView === 'cases' && (
          <CasesView
            onOpenNewCaseModal={openNewCase}
            onOpenScheduleVisitModal={openScheduleVisit}
            onStartFieldMode={handleStartFieldMode}
            onNavigateToWorkFronts={() => handleNavigate('work-fronts')}
          />
        )}
        {activeView === 'visits' && <VisitsView onOpenScheduleVisitModal={openScheduleVisit} onStartFieldMode={handleStartFieldMode} />}
        {activeView === 'work-fronts' && <WorkFrontsView onNavigateToMaterials={() => handleNavigate('materials')} onNavigateToDeliveries={() => handleNavigate('deliveries')} />}
        {activeView === 'materials' && <MaterialsView onNavigateToDeliveries={() => handleNavigate('deliveries')} />}
        {activeView === 'deliveries' && <DeliveriesView />}
        {activeView === 'billing' && <BillingView />}
        {activeView === 'team' && <TeamView />}
        {activeView === 'inspections' && <CoordinatorOperations inspections={inspections} onSelectInspection={handleSelectInspection} onViewReport={handleViewReport} />}
        {activeView === 'field-mode' && selectedVisitForField && isProfessional(profile?.role) && (
          <FieldModeView
            onBackToDashboard={() => setActiveView('visits')}
            onFinalizeToTechnicalReview={handleFinalizeFieldInspection}
            initialVisit={selectedVisitForField}
          />
        )}
        {activeView === 'technical-review' && isProfessional(profile?.role) && (
          <TechnicalReviewView onNavigateToClientApproval={() => setActiveView('client-approval')} />
        )}
        {activeView === 'client-approval' && isProfessional(profile?.role) && (
          <ClientApprovalView onBackToDashboard={() => setActiveView('dashboard')} />
        )}
        {activeView === 'form' && selectedInspection && isProfessional(profile?.role) && (
          <InspectionForm
            inspection={selectedInspection}
            onSaveInspection={handleSaveInspection}
            onBack={() => setActiveView('inspections')}
            onViewReport={handleViewReport}
            currentRole={currentRole}
          />
        )}
        {activeView === 'report' && selectedInspection && (
          <ReportView inspection={selectedInspection} onBack={() => setActiveView('dashboard')} />
        )}
      </main>

      <NewCaseModal
        isOpen={isNewCaseModalOpen && planner}
        onClose={() => setIsNewCaseModalOpen(false)}
        onCaseCreated={() => syncRemoteOperationalToLocal().then(refreshData)}
      />
      <ScheduleVisitModal
        isOpen={isScheduleVisitModalOpen && planner}
        onClose={() => setIsScheduleVisitModalOpen(false)}
        onVisitCreated={() => syncRemoteOperationalToLocal().then(refreshData)}
      />
      <EmergencyConfigModal isOpen={isEmergencyModalOpen && planner} onClose={() => setIsEmergencyModalOpen(false)} />
      <TechnicalReferencesModal isOpen={isReferencesModalOpen} onClose={() => setIsReferencesModalOpen(false)} />
      <SupabaseConfigModal isOpen={isSupabaseModalOpen} onClose={() => setIsSupabaseModalOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => <AuthProvider><AppInner /></AuthProvider>;
export default App;
