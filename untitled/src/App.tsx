import React, { useEffect, useState } from 'react';
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
import { getCasesFromDb } from './lib/supabaseService';
import { getVisitsFromDb } from './lib/remoteCore';
import { finishVisitInDb, subscribeToOperationalRealtime } from './lib/supabaseService';
import { syncWorkFrontCacheFromDb } from './lib/workFrontRemote';
import { AuthProvider, useAuth } from './context/AuthContext';
import { isCoordinator, isManagement, isProfessional } from './lib/roles';
import { Header, MainNavView } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { AgendaView } from './components/AgendaView';
import { CasesView } from './components/CasesView';
import { VisitsView } from './components/VisitsView';
import { WorkFrontsView } from './components/WorkFrontsRemoteView';
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

  const planner = isCoordinator(profile?.role) || isManagement(profile?.role);

  const refreshData = () => {
    setInspections(getInspections());
    setPendingSyncCount(getPendingSyncCount());
  };

  const syncRemoteOperationalToLocal = async () => {
    try {
      const [remoteVisits, remoteCases] = await Promise.all([
        getVisitsFromDb(),
        getCasesFromDb(),
      ]);
      remoteVisits.forEach((visit) => saveVisit(visit, 'Supabase Sync'));
      remoteCases.forEach((caseRecord) => saveCase(caseRecord, 'Supabase Sync'));
      await syncWorkFrontCacheFromDb();
    } catch (err) {
      console.warn('Could not synchronize remote SIPRE operation:', err);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    refreshData();
    syncRemoteOperationalToLocal().then(refreshData);

    const unsubNetwork = subscribeToNetworkStatus((online) => {
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
    if (view === 'references') {
      setIsReferencesModalOpen(true);
      return;
    }
    if (view === 'field-mode' && !selectedVisitForField) {
      window.alert('Para iniciar Modo Campo abre primero una visita que esté asignada a tu usuario.');
      setActiveView('visits');
      return;
    }
    setActiveView(view);
  };

  const openNewCase = () => {
    if (!planner) {
      window.alert('La creación de expedientes corresponde a Coordinación o Gerencia.');
      return;
    }
    setIsNewCaseModalOpen(true);
  };

  const openScheduleVisit = () => {
    if (!planner) {
      window.alert('La programación de visitas corresponde a Coordinación o Gerencia.');
      return;
    }
    setIsScheduleVisitModalOpen(true);
  };

  const openEmergency = () => {
    if (!planner) {
      window.alert('La configuración operativa corresponde a Coordinación o Gerencia.');
      return;
    }
    setIsEmergencyModalOpen(true);
  };

  const handleStartFieldMode = (visit?: VisitRecord) => {
    if (!visit) {
      setActiveView('visits');
      return;
    }
    if (!isProfessional(profile?.role)) {
      window.alert('Solo el profesional responsable de la visita puede iniciar o continuar la inspección.');
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
      window.alert('Esta visita está asignada a otro profesional.');
      return;
    }

    setSelectedVisitForField(visit);
    setActiveView('field-mode');
  };

  const handleFinalizeFieldInspection = async () => {
    const visit = selectedVisitForField;
    const relatedInspection = getInspections()
      .filter((inspection) => !visit?.id || inspection.visitId === visit.id)
      .sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')))[0];

    if (visit?.id && user?.id) {
      const ok = await finishVisitInDb(
        visit.id,
        user.id,
        profile?.full_name || user.email || 'Profesional SIPRE'
      );
      if (!ok) {
        window.alert('El informe se guardó, pero no fue posible marcar la visita como terminada en Supabase. Pulsa Sincronizar e inténtalo nuevamente.');
        return;
      }
      await syncRemoteOperationalToLocal();
      refreshData();
    }

    if (relatedInspection) {
      setSelectedInspection(relatedInspection);
      setActiveView('report');
    } else {
      setActiveView('inspections');
    }
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
        onOpenNewCaseModal={openNewCase}
        onOpenScheduleVisitModal={openScheduleVisit}
        onOpenEmergencyModal={openEmergency}
      />

      <main className="flex-1 pb-10">
        {activeView === 'dashboard' && <Dashboard onNavigate={handleNavigate} onOpenNewCaseModal={openNewCase} onOpenScheduleVisitModal={openScheduleVisit} />}
        {activeView === 'agenda' && <AgendaView onOpenScheduleVisitModal={openScheduleVisit} />}
        {activeView === 'cases' && <CasesView onOpenNewCaseModal={openNewCase} onOpenScheduleVisitModal={openScheduleVisit} onStartFieldMode={handleStartFieldMode} onNavigateToWorkFronts={() => setActiveView('work-fronts')} />}
        {activeView === 'visits' && <VisitsView onOpenScheduleVisitModal={openScheduleVisit} onStartFieldMode={handleStartFieldMode} />}
        {activeView === 'work-fronts' && <WorkFrontsView onNavigateToMaterials={() => setActiveView('materials')} onNavigateToDeliveries={() => setActiveView('deliveries')} />}
        {activeView === 'materials' && <MaterialsView onNavigateToDeliveries={() => setActiveView('deliveries')} />}
        {activeView === 'deliveries' && <DeliveriesView />}
        {activeView === 'billing' && <BillingView />}
        {activeView === 'team' && <TeamView />}
        {activeView === 'inspections' && <CoordinatorOperations inspections={inspections} onSelectInspection={handleSelectInspection} onViewReport={handleViewReport} />}
        {activeView === 'field-mode' && selectedVisitForField && <FieldModeView onBackToDashboard={() => setActiveView('visits')} onFinalizeToTechnicalReview={handleFinalizeFieldInspection} initialVisit={selectedVisitForField} />}
        {activeView === 'technical-review' && <TechnicalReviewView onNavigateToClientApproval={() => setActiveView('client-approval')} />}
        {activeView === 'client-approval' && <ClientApprovalView onBackToDashboard={() => setActiveView('dashboard')} />}
        {activeView === 'form' && selectedInspection && <InspectionForm inspection={selectedInspection} onSaveInspection={handleSaveInspection} onBack={() => setActiveView('inspections')} onViewReport={handleViewReport} currentRole={currentRole} />}
        {activeView === 'report' && selectedInspection && <ReportView inspection={selectedInspection} onBack={() => setActiveView('visits')} />}
      </main>

      <NewCaseModal isOpen={isNewCaseModalOpen && planner} onClose={() => setIsNewCaseModalOpen(false)} onCaseCreated={() => syncRemoteOperationalToLocal().then(refreshData)} />
      <ScheduleVisitModal isOpen={isScheduleVisitModalOpen && planner} onClose={() => setIsScheduleVisitModalOpen(false)} onVisitCreated={() => syncRemoteOperationalToLocal().then(refreshData)} />
      <EmergencyConfigModal isOpen={isEmergencyModalOpen && planner} onClose={() => setIsEmergencyModalOpen(false)} />
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
