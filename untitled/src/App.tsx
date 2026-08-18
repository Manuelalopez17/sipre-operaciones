import React, { useState, useEffect } from 'react';
import { PropertyInspection, UserRole, VisitRecord } from './types';
import {
  getInspections,
  saveInspection,
  saveVisit,
  getPendingSyncCount,
  processSyncQueue,
  subscribeToNetworkStatus
} from './lib/storage';
import { getVisitsFromDb } from './lib/remoteCore';
import { AuthProvider, useAuth } from './context/AuthContext';
import { subscribeToOperationalRealtime } from './lib/supabaseService';
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

  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [isReferencesModalOpen, setIsReferencesModalOpen] = useState<boolean>(false);
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState<boolean>(false);
  const [isScheduleVisitModalOpen, setIsScheduleVisitModalOpen] = useState<boolean>(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState<boolean>(false);

  const refreshData = () => {
    const loaded = getInspections();
    setInspections(loaded);
    setPendingSyncCount(getPendingSyncCount());
  };

  const syncRemoteVisitsToLocal = async () => {
    try {
      const remoteVisits = await getVisitsFromDb();
      remoteVisits.forEach((visit) => saveVisit(visit, 'Supabase Sync'));
    } catch (err) {
      console.warn('Could not mirror Supabase visits into dashboard cache:', err);
    }
  };

  useEffect(() => {
    const loaded = getInspections();
    setInspections(loaded);
    setPendingSyncCount(getPendingSyncCount());

    syncRemoteVisitsToLocal().then(refreshData);

    const unsubNetwork = subscribeToNetworkStatus((online) => {
      setIsOnline(online);
      if (online) handleTriggerSync();
    });

    const unsubRealtime = subscribeToOperationalRealtime((table, payload) => {
      console.log(`[Realtime Sync] Change detected on ${table}:`, payload);
      if (table === 'visits' || table === 'visit_assignments') {
        syncRemoteVisitsToLocal().then(refreshData);
      } else {
        refreshData();
      }
    });

    return () => {
      unsubNetwork();
      unsubRealtime();
    };
  }, []);

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

  const handleNavigate = (view: MainNavView) => {
    if (view === 'references') setIsReferencesModalOpen(true);
    else setActiveView(view);
  };

  const handleStartFieldMode = (visit?: VisitRecord) => {
    setSelectedVisitForField(visit);
    setActiveView('field-mode');
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
        onOpenNewCaseModal={() => setIsNewCaseModalOpen(true)}
        onOpenScheduleVisitModal={() => setIsScheduleVisitModalOpen(true)}
        onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
      />

      <main className="flex-1 pb-10">
        {activeView === 'dashboard' && (
          <Dashboard
            onNavigate={handleNavigate}
            onOpenNewCaseModal={() => setIsNewCaseModalOpen(true)}
            onOpenScheduleVisitModal={() => setIsScheduleVisitModalOpen(true)}
          />
        )}

        {activeView === 'agenda' && (
          <AgendaView onOpenScheduleVisitModal={() => setIsScheduleVisitModalOpen(true)} />
        )}

        {activeView === 'cases' && (
          <CasesView
            onOpenNewCaseModal={() => setIsNewCaseModalOpen(true)}
            onOpenScheduleVisitModal={() => setIsScheduleVisitModalOpen(true)}
            onStartFieldMode={(visit) => handleStartFieldMode(visit)}
            onNavigateToWorkFronts={() => setActiveView('work-fronts')}
          />
        )}

        {activeView === 'visits' && (
          <VisitsView
            onOpenScheduleVisitModal={() => setIsScheduleVisitModalOpen(true)}
            onStartFieldMode={(visit) => handleStartFieldMode(visit)}
          />
        )}

        {activeView === 'work-fronts' && (
          <WorkFrontsView
            onNavigateToMaterials={() => setActiveView('materials')}
            onNavigateToDeliveries={() => setActiveView('deliveries')}
          />
        )}

        {activeView === 'materials' && (
          <MaterialsView onNavigateToDeliveries={() => setActiveView('deliveries')} />
        )}

        {activeView === 'deliveries' && <DeliveriesView />}
        {activeView === 'billing' && <BillingView />}
        {activeView === 'team' && <TeamView />}

        {activeView === 'inspections' && (
          <CoordinatorOperations
            inspections={inspections}
            onSelectInspection={handleSelectInspection}
            onViewReport={handleViewReport}
          />
        )}

        {activeView === 'field-mode' && (
          <FieldModeView
            onBackToDashboard={() => setActiveView('dashboard')}
            onFinalizeToTechnicalReview={() => setActiveView('technical-review')}
            initialVisit={selectedVisitForField}
          />
        )}

        {activeView === 'technical-review' && (
          <TechnicalReviewView onNavigateToClientApproval={() => setActiveView('client-approval')} />
        )}

        {activeView === 'client-approval' && (
          <ClientApprovalView onBackToDashboard={() => setActiveView('dashboard')} />
        )}

        {activeView === 'form' && selectedInspection && (
          <InspectionForm
            inspection={selectedInspection}
            onSaveInspection={handleSaveInspection}
            onBack={() => setActiveView('inspections')}
            onViewReport={handleViewReport}
            currentRole={currentRole}
          />
        )}

        {activeView === 'report' && selectedInspection && (
          <ReportView inspection={selectedInspection} onBack={() => setActiveView('inspections')} />
        )}
      </main>

      <NewCaseModal
        isOpen={isNewCaseModalOpen}
        onClose={() => setIsNewCaseModalOpen(false)}
        onCaseCreated={() => refreshData()}
      />

      <ScheduleVisitModal
        isOpen={isScheduleVisitModalOpen}
        onClose={() => setIsScheduleVisitModalOpen(false)}
        onVisitCreated={() => syncRemoteVisitsToLocal().then(refreshData)}
      />

      <EmergencyConfigModal isOpen={isEmergencyModalOpen} onClose={() => setIsEmergencyModalOpen(false)} />
      <TechnicalReferencesModal isOpen={isReferencesModalOpen} onClose={() => setIsReferencesModalOpen(false)} />
      <SupabaseConfigModal isOpen={isSupabaseModalOpen} onClose={() => setIsSupabaseModalOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => (
  <AuthProvider>
    <AppInner />
  </AuthProvider>
);

export default App;
