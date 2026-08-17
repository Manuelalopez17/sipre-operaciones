import React, { useState, useEffect } from 'react';
import { PropertyInspection, UserRole, CaseRecord, VisitRecord } from './types';
import { 
  getInspections, 
  saveInspection, 
  getPendingSyncCount, 
  processSyncQueue,
  subscribeToNetworkStatus 
} from './lib/storage';
import { Header, MainNavView } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { AgendaView } from './components/AgendaView';
import { CasesView } from './components/CasesView';
import { VisitsView } from './components/VisitsView';
import { FieldModeView } from './components/FieldModeView';
import { TechnicalReviewView } from './components/TechnicalReviewView';
import { ClientApprovalView } from './components/ClientApprovalView';
import { PendingModuleView } from './components/PendingModuleView';
import { CoordinatorOperations } from './components/CoordinatorOperations';
import { InspectionForm } from './components/InspectionForm';
import { ReportView } from './components/ReportView';
import { NewCaseModal } from './components/NewCaseModal';
import { ScheduleVisitModal } from './components/ScheduleVisitModal';
import { TechnicalReferencesModal } from './components/TechnicalReferencesModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';

export const App: React.FC = () => {
  const [inspections, setInspections] = useState<PropertyInspection[]>([]);
  const [activeView, setActiveView] = useState<MainNavView>('dashboard');
  const [selectedInspection, setSelectedInspection] = useState<PropertyInspection | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('Inspector');

  // Network & Sync state
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals state
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [isReferencesModalOpen, setIsReferencesModalOpen] = useState<boolean>(false);
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState<boolean>(false);
  const [isScheduleVisitModalOpen, setIsScheduleVisitModalOpen] = useState<boolean>(false);

  // Load initial clean data and listen to network status
  useEffect(() => {
    const loaded = getInspections();
    setInspections(loaded);
    setPendingSyncCount(getPendingSyncCount());

    const unsubscribe = subscribeToNetworkStatus((online) => {
      setIsOnline(online);
      if (online) {
        handleTriggerSync();
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshData = () => {
    const loaded = getInspections();
    setInspections(loaded);
    setPendingSyncCount(getPendingSyncCount());
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      await processSyncQueue();
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
    } else {
      setActiveView(view);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      
      {/* Universal Technical Operations Header */}
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
      />

      {/* Main Operational Router */}
      <main className="flex-1 pb-10">
        
        {/* 1. INICIO - Operational Dashboard */}
        {activeView === 'dashboard' && (
          <Dashboard
            onNavigate={handleNavigate}
            onOpenNewCaseModal={() => setIsNewCaseModalOpen(true)}
            onOpenScheduleVisitModal={() => setIsScheduleVisitModalOpen(true)}
          />
        )}

        {/* 2. AGENDA - Visit Planning & Calendar */}
        {activeView === 'agenda' && (
          <AgendaView
            onOpenScheduleVisitModal={() => setIsScheduleVisitModalOpen(true)}
          />
        )}

        {/* 3. EXPEDIENTES - Case Management & History */}
        {activeView === 'cases' && (
          <CasesView
            onOpenNewCaseModal={() => setIsNewCaseModalOpen(true)}
          />
        )}

        {/* 4. VISITAS - Operations & Assigned Professional (Mis Visitas) */}
        {activeView === 'visits' && (
          <VisitsView
            onOpenScheduleVisitModal={() => setIsScheduleVisitModalOpen(true)}
            onStartFieldMode={() => setActiveView('field-mode')}
          />
        )}

        {/* 5. INSPECCIONES - Structural Pathology & Emergency Triages */}
        {activeView === 'inspections' && (
          <CoordinatorOperations
            inspections={inspections}
            onSelectInspection={handleSelectInspection}
            onViewReport={handleViewReport}
          />
        )}

        {/* 6. INTERVENCIONES - Pending Module */}
        {activeView === 'interventions' && (
          <PendingModuleView
            moduleName="Intervenciones y Obras"
            moduleType="interventions"
            onBackToDashboard={() => setActiveView('dashboard')}
          />
        )}

        {/* 7. MATERIALES - Pending Module */}
        {activeView === 'materials' && (
          <PendingModuleView
            moduleName="Materiales y Logística"
            moduleType="materials"
            onBackToDashboard={() => setActiveView('dashboard')}
          />
        )}

        {/* 8. EQUIPO - Technical Team */}
        {activeView === 'team' && (
          <PendingModuleView
            moduleName="Equipo Técnico"
            moduleType="team"
            onBackToDashboard={() => setActiveView('dashboard')}
          />
        )}

        {/* 9. MODO CAMPO - Mobile-First 8-Step Field Inspection */}
        {activeView === 'field-mode' && (
          <FieldModeView
            onBackToDashboard={() => setActiveView('dashboard')}
            onFinalizeToTechnicalReview={() => setActiveView('technical-review')}
          />
        )}

        {/* 10. REVISIÓN TÉCNICA - Specialist Concept */}
        {activeView === 'technical-review' && (
          <TechnicalReviewView
            onNavigateToClientApproval={() => setActiveView('client-approval')}
          />
        )}

        {/* 11. APROBACIÓN DEL CLIENTE - Acceptance & Signature */}
        {activeView === 'client-approval' && (
          <ClientApprovalView
            onBackToDashboard={() => setActiveView('dashboard')}
          />
        )}

        {/* 12. INSPECTION FORM - Pathology Form */}
        {activeView === 'form' && selectedInspection && (
          <InspectionForm
            inspection={selectedInspection}
            onSaveInspection={handleSaveInspection}
            onBack={() => setActiveView('inspections')}
            onViewReport={handleViewReport}
            currentRole={currentRole}
          />
        )}

        {/* 13. REPORT VIEW - Inspection Report */}
        {activeView === 'report' && selectedInspection && (
          <ReportView
            inspection={selectedInspection}
            onBack={() => setActiveView('inspections')}
          />
        )}

      </main>

      {/* New Case Modal */}
      <NewCaseModal
        isOpen={isNewCaseModalOpen}
        onClose={() => setIsNewCaseModalOpen(false)}
      />

      {/* Schedule Visit Modal */}
      <ScheduleVisitModal
        isOpen={isScheduleVisitModalOpen}
        onClose={() => setIsScheduleVisitModalOpen(false)}
      />

      {/* Technical Standards Modal */}
      <TechnicalReferencesModal
        isOpen={isReferencesModalOpen}
        onClose={() => setIsReferencesModalOpen(false)}
      />

      {/* Supabase Database & Sync Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

    </div>
  );
};

export default App;
