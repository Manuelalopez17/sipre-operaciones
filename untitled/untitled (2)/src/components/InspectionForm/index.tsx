import React, { useState } from 'react';
import { 
  PropertyInspection, 
  BuildingElement, 
  Finding, 
  PhotoMetadata, 
  VoiceNoteMetadata, 
  VideoMetadata, 
  ProfessionalAssessment, 
  GPSCoordinate,
  UserRole
} from '../../types';
import { PropertySection } from './PropertySection';
import { ElementsSection } from './ElementsSection';
import { FindingsSection } from './FindingsSection';
import { VoiceNotesSection } from './VoiceNotesSection';
import { VideoSection } from './VideoSection';
import { ProfessionalAssessmentSection } from './ProfessionalAssessmentSection';
import { PhotoAnnotationModal } from './PhotoAnnotationModal';
import { AIAssistantDrawer } from './AIAssistantDrawer';
import { 
  Save, 
  ArrowLeft, 
  FileText, 
  Sparkles, 
  Building, 
  Layers, 
  AlertOctagon, 
  Camera, 
  ShieldCheck,
  CheckCircle,
  Clock
} from 'lucide-react';

interface InspectionFormProps {
  inspection: PropertyInspection;
  onSaveInspection: (updated: PropertyInspection) => void;
  onBack: () => void;
  onViewReport: (inspection: PropertyInspection) => void;
  currentRole: UserRole;
}

export const InspectionForm: React.FC<InspectionFormProps> = ({
  inspection,
  onSaveInspection,
  onBack,
  onViewReport,
  currentRole,
}) => {
  const [currentInspection, setCurrentInspection] = useState<PropertyInspection>(inspection);
  const [activeTab, setActiveTab] = useState<'property' | 'elements' | 'findings' | 'media' | 'assessment'>('property');
  
  // Modals / Drawers state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [activePhotoTarget, setActivePhotoTarget] = useState<{ elementId?: string; elementName?: string; findingId?: string }>({});
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [selectedFindingForAi, setSelectedFindingForAi] = useState<Finding | null>(null);

  const [saveToast, setSaveToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Property fields update
  const handleUpdatePropertyField = (field: keyof PropertyInspection, value: any) => {
    setCurrentInspection((prev) => {
      const updated = { ...prev, [field]: value, updatedAt: new Date().toISOString() };
      onSaveInspection(updated);
      return updated;
    });
  };

  const handleUpdateGps = (gps: GPSCoordinate) => {
    setCurrentInspection((prev) => {
      const updated = { ...prev, gps, updatedAt: new Date().toISOString() };
      onSaveInspection(updated);
      return updated;
    });
    showToast('Coordenadas GPS actualizadas.');
  };

  // Elements handling
  const handleAddElement = (element: BuildingElement) => {
    setCurrentInspection((prev) => {
      const elements = [...(prev.elements || []), element];
      const updated = { ...prev, elements, updatedAt: new Date().toISOString() };
      onSaveInspection(updated);
      return updated;
    });
    showToast(`Elemento ${element.label} agregado.`);
  };

  const handleUpdateElement = (element: BuildingElement) => {
    setCurrentInspection((prev) => {
      const elements = prev.elements.map((e) => (e.id === element.id ? element : e));
      const updated = { ...prev, elements, updatedAt: new Date().toISOString() };
      onSaveInspection(updated);
      return updated;
    });
  };

  const handleDeleteElement = (elementId: string) => {
    setCurrentInspection((prev) => {
      const elements = prev.elements.filter((e) => e.id !== elementId);
      // also filter findings
      const findings = prev.findings.filter((f) => f.elementId !== elementId);
      const updated = { ...prev, elements, findings, updatedAt: new Date().toISOString() };
      onSaveInspection(updated);
      return updated;
    });
    showToast('Elemento eliminado.');
  };

  // Findings handling
  const handleAddFinding = (finding: Finding) => {
    setCurrentInspection((prev) => {
      const findings = [...(prev.findings || []), finding];
      // update element finding count
      const elements = prev.elements.map((e) => {
        if (e.id === finding.elementId) {
          return { ...e, findingsCount: (e.findingsCount || 0) + 1 };
        }
        return e;
      });

      // Auto update preliminary priority if critical
      let priority = prev.preliminaryPriority;
      if (finding.severity === 'Crítica' || finding.immediateHazard) {
        priority = 'RED';
      } else if (finding.severity === 'Severa' && priority !== 'RED') {
        priority = 'YELLOW';
      }

      const updated = { 
        ...prev, 
        findings, 
        elements, 
        preliminaryPriority: priority, 
        updatedAt: new Date().toISOString() 
      };
      onSaveInspection(updated);
      return updated;
    });
    showToast('Hallazgo registrado con éxito.');
  };

  const handleUpdateFinding = (finding: Finding) => {
    setCurrentInspection((prev) => {
      const findings = prev.findings.map((f) => (f.id === finding.id ? finding : f));
      const updated = { ...prev, findings, updatedAt: new Date().toISOString() };
      onSaveInspection(updated);
      return updated;
    });
  };

  const handleDeleteFinding = (findingId: string) => {
    setCurrentInspection((prev) => {
      const findings = prev.findings.filter((f) => f.id !== findingId);
      const updated = { ...prev, findings, updatedAt: new Date().toISOString() };
      onSaveInspection(updated);
      return updated;
    });
    showToast('Hallazgo eliminado.');
  };

  // Photos handling
  const handleSavePhoto = (photo: PhotoMetadata) => {
    setCurrentInspection((prev) => {
      const photoIndexed = { ...photo, photoNumber: (prev.photos?.length || 0) + 1 };
      const photos = [...(prev.photos || []), photoIndexed];
      
      // If attached to finding, link ID
      let findings = prev.findings;
      if (photo.findingId) {
        findings = prev.findings.map((f) => {
          if (f.id === photo.findingId) {
            return { ...f, photoIds: [...(f.photoIds || []), photo.id] };
          }
          return f;
        });
      }

      const updated = { ...prev, photos, findings, updatedAt: new Date().toISOString() };
      onSaveInspection(updated);
      return updated;
    });
    showToast('Fotografía guardada y anotada.');
  };

  // Voice Notes handling
  const handleAddVoiceNote = (note: VoiceNoteMetadata) => {
    setCurrentInspection((prev) => {
      const voiceNotes = [...(prev.voiceNotes || []), note];
      const updated = { ...prev, voiceNotes, updatedAt: new Date().toISOString() };
      onSaveInspection(updated);
      return updated;
    });
    showToast('Nota de voz guardada.');
  };

  const handleUpdateVoiceNote = (note: VoiceNoteMetadata) => {
    setCurrentInspection((prev) => {
      const voiceNotes = prev.voiceNotes.map((vn) => (vn.id === note.id ? note : vn));
      const updated = { ...prev, voiceNotes, updatedAt: new Date().toISOString() };
      onSaveInspection(updated);
      return updated;
    });
  };

  const handleDeleteVoiceNote = (id: string) => {
    setCurrentInspection((prev) => {
      const voiceNotes = prev.voiceNotes.filter((vn) => vn.id !== id);
      const updated = { ...prev, voiceNotes, updatedAt: new Date().toISOString() };
      onSaveInspection(updated);
      return updated;
    });
  };

  // Videos handling
  const handleAddVideo = (video: VideoMetadata) => {
    setCurrentInspection((prev) => {
      const videos = [...(prev.videos || []), video];
      const updated = { ...prev, videos, updatedAt: new Date().toISOString() };
      onSaveInspection(updated);
      return updated;
    });
    showToast('Video registrado.');
  };

  const handleDeleteVideo = (id: string) => {
    setCurrentInspection((prev) => {
      const videos = prev.videos.filter((v) => v.id !== id);
      const updated = { ...prev, videos, updatedAt: new Date().toISOString() };
      onSaveInspection(updated);
      return updated;
    });
  };

  // Professional Assessment handling
  const handleUpdateAssessment = (assessment: ProfessionalAssessment, isConfirmed: boolean) => {
    setCurrentInspection((prev) => {
      const updated: PropertyInspection = {
        ...prev,
        professionalAssessment: assessment,
        preliminaryPriority: assessment.finalPriorityConfirmed || prev.preliminaryPriority,
        isPreliminaryPriorityConfirmed: isConfirmed,
        status: isConfirmed ? 'Completada' : 'En Progreso',
        updatedAt: new Date().toISOString(),
      };
      onSaveInspection(updated);
      return updated;
    });
    showToast('Concepto profesional actualizado.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 animate-fade-in">
          <CheckCircle className="w-4 h-4" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Volver al Panel Principal"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm font-bold text-cyan-400">
                {currentInspection.id}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  currentInspection.preliminaryPriority === 'RED'
                    ? 'bg-red-950 text-red-300 border border-red-800'
                    : currentInspection.preliminaryPriority === 'YELLOW'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                Prioridad: {currentInspection.preliminaryPriority}
              </span>
            </div>
            <h1 className="text-base font-bold text-white leading-tight">
              {currentInspection.address || 'Nueva Inspección Técnica'}
            </h1>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedFindingForAi(null);
              setIsAiAssistantOpen(true);
            }}
            className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Asistente IA</span>
          </button>

          <button
            onClick={() => onViewReport(currentInspection)}
            className="bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Generar Informe</span>
          </button>

          <button
            onClick={() => {
              onSaveInspection(currentInspection);
              showToast('Inspección guardada localmente.');
            }}
            className="bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs for Form Sections */}
      <div className="flex overflow-x-auto space-x-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('property')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-colors ${
            activeTab === 'property'
              ? 'bg-cyan-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>1. Inmueble</span>
        </button>

        <button
          onClick={() => setActiveTab('elements')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-colors ${
            activeTab === 'elements'
              ? 'bg-cyan-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>2. Elementos ({currentInspection.elements?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('findings')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-colors ${
            activeTab === 'findings'
              ? 'bg-cyan-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>3. Hallazgos ({currentInspection.findings?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-colors ${
            activeTab === 'media'
              ? 'bg-cyan-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>4. Multimedia ({currentInspection.photos?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('assessment')}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-colors ${
            activeTab === 'assessment'
              ? 'bg-cyan-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>5. Dictamen y Firma</span>
        </button>
      </div>

      {/* Main Section Content */}
      <div className="space-y-6">
        
        {/* SECTION 1: PROPERTY */}
        {activeTab === 'property' && (
          <PropertySection
            inspection={currentInspection}
            onUpdateField={handleUpdatePropertyField}
            onUpdateGps={handleUpdateGps}
          />
        )}

        {/* SECTION 2: ELEMENTS */}
        {activeTab === 'elements' && (
          <ElementsSection
            elements={currentInspection.elements || []}
            onAddElement={handleAddElement}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
            onSelectElementForFindings={(elem) => {
              setActiveTab('findings');
            }}
          />
        )}

        {/* SECTION 3: FINDINGS & CRACKS */}
        {activeTab === 'findings' && (
          <FindingsSection
            findings={currentInspection.findings || []}
            elements={currentInspection.elements || []}
            onAddFinding={handleAddFinding}
            onUpdateFinding={handleUpdateFinding}
            onDeleteFinding={handleDeleteFinding}
            onOpenPhotoModal={(elemId, elemName, findId) => {
              setActivePhotoTarget({ elementId: elemId, elementName: elemName, findingId: findId });
              setIsPhotoModalOpen(true);
            }}
            onOpenAIAssistant={(finding) => {
              setSelectedFindingForAi(finding);
              setIsAiAssistantOpen(true);
            }}
          />
        )}

        {/* SECTION 4: MEDIA (VOICE, VIDEO, PHOTOS) */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            
            {/* Photographic Record Gallery & Action */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Camera className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Fotografías y Anotaciones ({currentInspection.photos?.length || 0})
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setActivePhotoTarget({});
                    setIsPhotoModalOpen(true);
                  }}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow"
                >
                  <Camera className="w-4 h-4" />
                  <span>TOMAR / ANOTAR FOTO</span>
                </button>
              </div>

              {currentInspection.photos?.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center space-y-2">
                  <Camera className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">No se han registrado fotografías aún.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentInspection.photos?.map((photo, idx) => (
                    <div
                      key={photo.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow space-y-2 p-3"
                    >
                      <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                        <img
                          src={photo.annotatedUrl || photo.originalUrl}
                          alt={photo.description}
                          className="max-h-full object-contain"
                        />
                      </div>
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between font-bold text-white">
                          <span>FOTO {(idx + 1).toString().padStart(2, '0')}</span>
                          <span className="text-cyan-400 font-mono text-[10px]">{photo.elementName || 'General'}</span>
                        </div>
                        <p className="text-slate-300 text-[11px] truncate">{photo.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Voice Notes */}
            <VoiceNotesSection
              voiceNotes={currentInspection.voiceNotes || []}
              onAddVoiceNote={handleAddVoiceNote}
              onUpdateVoiceNote={handleUpdateVoiceNote}
              onDeleteVoiceNote={handleDeleteVoiceNote}
            />

            {/* Videos */}
            <VideoSection
              videos={currentInspection.videos || []}
              onAddVideo={handleAddVideo}
              onDeleteVideo={handleDeleteVideo}
            />

          </div>
        )}

        {/* SECTION 5: PROFESSIONAL ASSESSMENT */}
        {activeTab === 'assessment' && (
          <ProfessionalAssessmentSection
            assessment={currentInspection.professionalAssessment || {
              inspectorName: currentInspection.inspectorName,
              professionalLicense: currentInspection.professionalLicense,
              organization: currentInspection.organization,
              date: currentInspection.date,
              conclusion: '',
              immediateRecommendations: '',
              temporaryStabilization: '',
              accessRestrictions: 'Ninguna',
              evacuationRecommendation: 'No Requerida',
              structuralEvaluationRequired: false,
              monitoringRequired: false,
              repairRequired: false,
              confirmedByProfessional: currentInspection.isPreliminaryPriorityConfirmed,
              finalPriorityConfirmed: currentInspection.preliminaryPriority,
            }}
            preliminaryPriority={currentInspection.preliminaryPriority}
            isConfirmed={currentInspection.isPreliminaryPriorityConfirmed}
            onUpdateAssessment={handleUpdateAssessment}
            inspectorName={currentInspection.inspectorName}
            professionalLicense={currentInspection.professionalLicense}
            organization={currentInspection.organization}
          />
        )}

      </div>

      {/* Photo Annotation Modal */}
      <PhotoAnnotationModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onSavePhoto={handleSavePhoto}
        inspectionId={currentInspection.id}
        elementId={activePhotoTarget.elementId}
        elementName={activePhotoTarget.elementName}
        findingId={activePhotoTarget.findingId}
        inspectorName={currentInspection.inspectorName}
        currentGps={currentInspection.gps}
        contextData={{
          structuralSystem: currentInspection.structuralSystem,
        }}
      />

      {/* AI Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        inspection={currentInspection}
        selectedFinding={selectedFindingForAi}
      />

    </div>
  );
};
