import React, { useState, useRef, useEffect } from 'react';
import { 
  Smartphone, 
  ChevronLeft, 
  ChevronRight, 
  Camera, 
  Upload, 
  Video, 
  Mic, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  PlusCircle, 
  Trash2, 
  Layers, 
  Building2, 
  FileCheck, 
  Compass, 
  Paperclip, 
  CheckSquare, 
  Square, 
  ArrowRight,
  MapPin,
  Clock,
  User,
  Phone,
  Mail,
  Home,
  Check,
  X,
  AlertCircle,
  Wrench,
  FolderKanban,
  Save,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { 
  PropertyType, 
  StructuralSystem, 
  CaseDocumentation,
  BuildingElementType,
  DamageSeverity,
  DocStatusOption,
  RepairDecisionOption,
  RepairItemRecord,
  EvidenceCategory,
  EvidenceMediaItem,
  InspectionWalkthroughZone,
  Finding,
  VisitRecord
} from '../types';
import { 
  saveInspection, 
  generateNextInspectionId, 
  saveCase, 
  generateNextCaseCode, 
  saveWorkFront, 
  generateNextWorkFrontCode,
  saveRepairItem 
} from '../lib/storage';
import { uploadEvidenceFile, getEvidenceFilesFromDb } from '../lib/supabaseService';
import { useAuth } from '../context/AuthContext';

interface FieldModeViewProps {
  onBackToDashboard: () => void;
  onFinalizeToTechnicalReview: () => void;
  initialVisit?: VisitRecord;
}

export const FieldModeView: React.FC<FieldModeViewProps> = ({
  onBackToDashboard,
  onFinalizeToTechnicalReview,
  initialVisit,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 10;
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  // Step 1: Identificación del Predio
  const [propertyData, setPropertyData] = useState({
    address: initialVisit?.address || '',
    neighborhood: initialVisit?.neighborhood || '',
    municipality: initialVisit?.municipality || 'Medellín',
    department: initialVisit?.department || 'Antioquia',
    propertyType: (initialVisit?.propertyType || 'Casa') as PropertyType,
    apartmentUnit: '',
    towerBlock: '',
    floorLevel: '',
    buildingFloorsCount: '',
    approxAreaM2: '',
    currentUse: '',
    approxConstructionYear: '',
    approxOccupants: '',
    gpsLat: '6.2086',
    gpsLng: '-75.5684',
    gpsCaptured: false,
  });

  // Step 2: Propietario / Cliente
  const [clientData, setClientData] = useState({
    ownerName: initialVisit?.clientName || '',
    occupantName: '',
    clientOrganization: '',
    identificationNumber: '',
    phone: '',
    email: '',
    contactPerson: '',
    relationshipWithProperty: 'Propietario',
    whoAttendsVisit: '',
    clientObservations: '',
  });

  // Step 3: Documentación Disponible
  const [docs, setDocs] = useState<CaseDocumentation>({
    blueprints: 'No',
    structuralDesign: 'No',
    soilStudy: 'No disponible',
    calculationMemories: 'No se conoce',
    buildingPermit: 'No se conoce',
    previousTechnicalReports: 'No',
    preEventPhotos: 'No',
    notes: '',
  });

  // Step 4: Caracterización del Inmueble
  const [characterization, setCharacterization] = useState({
    structuralSystem: 'Pórticos de Concreto Reforzado' as StructuralSystem,
    predominantMaterial: '',
    foundationType: '',
    floorSystem: '',
    roofType: '',
    masonryType: '',
    previousModifications: '',
    previousRepairs: '',
    knownPreviousDamage: '',
    generalCondition: '',
  });

  // Step 5: Recorrido de Inspección por Zonas
  const defaultZones: InspectionWalkthroughZone[] = [
    { id: 'zone-ext', name: 'Exterior y Fachada', description: '', technicalNotes: '', photos: [], videos: [], voiceNotes: [], findingsCount: 0 },
    { id: 'zone-acc', name: 'Accesos y Portería', description: '', technicalNotes: '', photos: [], videos: [], voiceNotes: [], findingsCount: 0 },
    { id: 'zone-p1', name: 'Primer Piso', description: '', technicalNotes: '', photos: [], videos: [], voiceNotes: [], findingsCount: 0 },
    { id: 'zone-ps', name: 'Pisos Superiores', description: '', technicalNotes: '', photos: [], videos: [], voiceNotes: [], findingsCount: 0 },
    { id: 'zone-sot', name: 'Sótano / Cimentación', description: '', technicalNotes: '', photos: [], videos: [], voiceNotes: [], findingsCount: 0 },
    { id: 'zone-cub', name: 'Cubierta / Techo', description: '', technicalNotes: '', photos: [], videos: [], voiceNotes: [], findingsCount: 0 },
    { id: 'zone-zc', name: 'Zonas Comunes', description: '', technicalNotes: '', photos: [], videos: [], voiceNotes: [], findingsCount: 0 },
    { id: 'zone-esc', name: 'Escaleras y Circulaciones', description: '', technicalNotes: '', photos: [], videos: [], voiceNotes: [], findingsCount: 0 },
    { id: 'zone-terr', name: 'Terreno y Entorno', description: '', technicalNotes: '', photos: [], videos: [], voiceNotes: [], findingsCount: 0 },
  ];
  const [walkthroughZones, setWalkthroughZones] = useState<InspectionWalkthroughZone[]>(defaultZones);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('zone-ext');
  const [customZoneName, setCustomZoneName] = useState<string>('');

  // Step 6: Hallazgos (Empty by default)
  const [findingsList, setFindingsList] = useState<Finding[]>([]);
  const [isAddingFinding, setIsAddingFinding] = useState<boolean>(false);
  const [currentFindingForm, setCurrentFindingForm] = useState<Partial<Finding>>({
    elementType: 'Columna',
    elementLabel: '',
    zone: 'Primer Piso',
    floor: '1',
    location: '',
    isStructural: true,
    material: 'Concreto Reforzado',
    description: '',
    damageType: 'Grieta / Fisura',
    crackType: 'Diagonal',
    crackWidth: '<0.3 mm',
    crackOrientation: 'Diagonal',
    crackLength: '',
    severity: 'Moderada',
    possibleCause: '',
    professionalObservation: '',
    additionalVerificationRequired: '',
    repairPotentiallyRequired: 'POR DETERMINAR',
  });

  // Step 7: Evidencias Multimedia
  const [evidenceList, setEvidenceList] = useState<EvidenceMediaItem[]>([]);
  const [activeEvidenceCategory, setActiveEvidenceCategory] = useState<EvidenceCategory>('GENERAL VISIT');
  const [mediaUploading, setMediaUploading] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [pendingMediaDescription, setPendingMediaDescription] = useState<string>('');
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);

  const photoCaptureRef = useRef<HTMLInputElement | null>(null);
  const photoUploadRef = useRef<HTMLInputElement | null>(null);
  const videoCaptureRef = useRef<HTMLInputElement | null>(null);
  const audioFileRef = useRef<HTMLInputElement | null>(null);
  const documentFileRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const { user, profile } = useAuth();

  const reloadEvidenceFromDb = async () => {
    if (!initialVisit?.id && !initialVisit?.caseId) return;
    const items = await getEvidenceFilesFromDb({ caseId: initialVisit?.caseId, visitId: initialVisit?.id });
    setEvidenceList(items);
  };

  useEffect(() => {
    reloadEvidenceFromDb();
    return () => audioStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, [initialVisit?.id, initialVisit?.caseId]);

  const handleEvidenceFile = async (file: File, mediaType: EvidenceMediaItem['mediaType'], description?: string) => {
    setMediaUploading(true);
    setMediaError(null);
    try {
      const result = await uploadEvidenceFile(file, {
        caseId: initialVisit?.caseId,
        visitId: initialVisit?.id,
        category: activeEvidenceCategory,
        description: description || pendingMediaDescription || `${mediaType} de inspección en campo`,
        uploadedBy: user?.id,
      });
      if (!result.success || !result.url) throw new Error(result.error || 'No se pudo guardar la evidencia en Supabase.');
      const now = new Date();
      const item: EvidenceMediaItem = {
        id: result.storagePath || `EV-${Date.now()}`,
        mediaType,
        url: result.url,
        filename: file.name,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        user: profile?.full_name || user?.email || 'Usuario SIPRE',
        visitId: initialVisit?.id,
        caseId: initialVisit?.caseId,
        category: activeEvidenceCategory,
        description: description || pendingMediaDescription || `${mediaType} de inspección en campo`,
        createdAt: now.toISOString(),
      };
      setEvidenceList((prev) => [item, ...prev.filter((x) => x.id !== item.id)]);
      setPendingMediaDescription('');
      setSavedSuccessMsg(`${file.name} guardado en SIPRE y disponible para el equipo.`);
      setTimeout(() => setSavedSuccessMsg(null), 3500);
    } catch (err: any) {
      setMediaError(err?.message || 'No se pudo guardar la evidencia. Verifique conexión y permisos.');
    } finally {
      setMediaUploading(false);
    }
  };

  const handleInputEvidence = async (e: React.ChangeEvent<HTMLInputElement>, mediaType: EvidenceMediaItem['mediaType']) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) await handleEvidenceFile(file, mediaType);
  };

  const startVoiceRecording = async () => {
    setMediaError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      audioFileRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        const mime = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mime });
        const ext = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';
        const file = new File([blob], `nota-voz-${Date.now()}.${ext}`, { type: mime });
        stream.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
        await handleEvidenceFile(file, 'voice', pendingMediaDescription || 'Nota de voz de inspección en campo');
      };
      recorder.start();
      setIsRecordingVoice(true);
    } catch (err) {
      console.warn('Microphone capture failed:', err);
      audioFileRef.current?.click();
      setMediaError('No fue posible abrir el micrófono directamente. Puedes grabar o seleccionar un audio desde el dispositivo.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    setIsRecordingVoice(false);
  };

  // Step 8: Conclusiones de la Visita
  const [conclusions, setConclusions] = useState({
    walkthroughSummary: '',
    mainFindingsSummary: '',
    generalPropertyCondition: 'Estable con afectaciones localizadas',
    structuralObservations: '',
    masonryObservations: '',
    nonstructuralObservations: '',
    groundObservations: '',
    potentialCauses: '',
    additionalStudiesRequired: '',
    immediateRecommendations: '',
    accessRestrictionsNote: 'Ninguna',
    temporaryMeasuresNote: '',
    professionalConclusion: '',
    responsibleProfessionalName: initialVisit?.responsibleProfessional || 'Ingeniero Evaluador',
    professionalLicense: 'CPN-00000-COL',
  });

  // Step 9: Decisión Técnica & Propuesta de Reparaciones
  const [repairDecision, setRepairDecision] = useState<RepairDecisionOption>('REQUIERE REPARACIÓN');
  const [followUpRequired, setFollowUpRequired] = useState<boolean>(false);
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [proposedRepairs, setProposedRepairs] = useState<RepairItemRecord[]>([]);
  const [isAddingRepairItem, setIsAddingRepairItem] = useState<boolean>(false);
  const [newRepairItem, setNewRepairItem] = useState<Partial<RepairItemRecord>>({
    elementLocation: '',
    problem: '',
    repairDescription: '',
    priority: 'Alta',
    estimatedQuantity: 1,
    unit: 'm²',
    technicalSpecification: '',
    expectedMaterials: '',
    specialistRequired: true,
    clientApprovalStatus: 'PENDIENTE',
  });

  // Client Approval Section
  const [clientApproval, setClientApproval] = useState({
    representativeName: clientData.ownerName || '',
    status: 'PENDIENTE' as any,
    comments: '',
  });

  // Navigation handlers
  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddCustomZone = () => {
    if (!customZoneName.trim()) return;
    const newZone: InspectionWalkthroughZone = {
      id: 'zone-' + Date.now(),
      name: customZoneName.trim(),
      description: '',
      technicalNotes: '',
      photos: [],
      videos: [],
      voiceNotes: [],
      findingsCount: 0,
    };
    setWalkthroughZones([...walkthroughZones, newZone]);
    setSelectedZoneId(newZone.id);
    setCustomZoneName('');
  };

  const handleSaveFinding = () => {
    if (!currentFindingForm.elementLabel?.trim() && !currentFindingForm.description?.trim()) return;
    const newF: Finding = {
      id: 'FIND-' + (findingsList.length + 1).toString().padStart(3, '0'),
      elementId: 'ELEM-' + (findingsList.length + 1),
      elementType: currentFindingForm.elementType || 'Elemento',
      elementLabel: currentFindingForm.elementLabel || `Elemento #${findingsList.length + 1}`,
      floor: currentFindingForm.floor || '1',
      zone: currentFindingForm.zone || 'General',
      location: currentFindingForm.location || '',
      isStructural: currentFindingForm.isStructural ?? true,
      material: currentFindingForm.material || 'Concreto',
      description: currentFindingForm.description || '',
      damageType: currentFindingForm.damageType || 'Fisura',
      crackType: currentFindingForm.crackType,
      crackWidth: currentFindingForm.crackWidth,
      crackOrientation: currentFindingForm.crackOrientation,
      crackLength: currentFindingForm.crackLength,
      severity: (currentFindingForm.severity || 'Moderada') as DamageSeverity,
      possibleCause: currentFindingForm.possibleCause || '',
      professionalObservation: currentFindingForm.professionalObservation || '',
      additionalVerificationRequired: currentFindingForm.additionalVerificationRequired || '',
      repairPotentiallyRequired: currentFindingForm.repairPotentiallyRequired || 'POR DETERMINAR',
      createdAt: new Date().toISOString(),
    };
    setFindingsList([...findingsList, newF]);
    setIsAddingFinding(false);
    setCurrentFindingForm({
      elementType: 'Columna',
      elementLabel: '',
      zone: 'Primer Piso',
      floor: '1',
      location: '',
      isStructural: true,
      material: 'Concreto Reforzado',
      description: '',
      damageType: 'Grieta / Fisura',
      crackType: 'Diagonal',
      crackWidth: '<0.3 mm',
      crackOrientation: 'Diagonal',
      crackLength: '',
      severity: 'Moderada',
      possibleCause: '',
      professionalObservation: '',
      additionalVerificationRequired: '',
      repairPotentiallyRequired: 'POR DETERMINAR',
    });
  };

  const handleAddRepairItem = () => {
    if (!newRepairItem.elementLocation?.trim() && !newRepairItem.repairDescription?.trim()) return;
    const item: RepairItemRecord = {
      id: 'REP-' + (proposedRepairs.length + 1).toString().padStart(3, '0'),
      caseId: initialVisit?.caseId || 'EXP-2026-0001',
      visitId: initialVisit?.id || 'VIS-2026-0001',
      elementLocation: newRepairItem.elementLocation || '',
      problem: newRepairItem.problem || '',
      repairDescription: newRepairItem.repairDescription || '',
      priority: (newRepairItem.priority || 'Alta') as any,
      estimatedQuantity: Number(newRepairItem.estimatedQuantity) || 1,
      unit: (newRepairItem.unit || 'm²') as any,
      technicalSpecification: newRepairItem.technicalSpecification || '',
      expectedMaterials: newRepairItem.expectedMaterials || '',
      specialistRequired: newRepairItem.specialistRequired ?? true,
      clientApprovalStatus: 'PENDIENTE',
      createdAt: new Date().toISOString(),
    };
    setProposedRepairs([...proposedRepairs, item]);
    saveRepairItem(item);
    setIsAddingRepairItem(false);
    setNewRepairItem({
      elementLocation: '',
      problem: '',
      repairDescription: '',
      priority: 'Alta',
      estimatedQuantity: 1,
      unit: 'm²',
      technicalSpecification: '',
      expectedMaterials: '',
      specialistRequired: true,
      clientApprovalStatus: 'PENDIENTE',
    });
  };

  const handleCreateWorkFrontFromDecision = () => {
    const newFrontCode = generateNextWorkFrontCode();
    const caseCode = initialVisit?.caseCode || generateNextCaseCode();

    const newFront = saveWorkFront({
      id: 'WF-' + Date.now(),
      frontCode: newFrontCode,
      caseId: initialVisit?.caseId || 'EXP-' + Date.now(),
      caseCode: caseCode,
      visitId: initialVisit?.id,
      propertyAddress: propertyData.address || 'Inmueble evaluado',
      clientName: clientData.ownerName || 'Cliente',
      repairScope: proposedRepairs.map(r => `${r.elementLocation}: ${r.repairDescription}`).join('; ') || 'Intervención y reparación técnica estructural',
      responsibleTechnicalProfessional: conclusions.responsibleProfessionalName,
      fieldSupervisor: 'Por asignar',
      plannedStartDate: new Date().toISOString().split('T')[0],
      plannedCompletionDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'PENDIENTE',
      progressCategory: 'No iniciado',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setSavedSuccessMsg(`¡Frente de Obra ${newFront.frontCode} creado exitosamente y vinculado al caso!`);
    setTimeout(() => setSavedSuccessMsg(null), 5000);
  };

  const handleFinalizeFullInspection = () => {
    const inspectionId = generateNextInspectionId();
    const nowIso = new Date().toISOString();

    const inspectionRecord = saveInspection({
      id: inspectionId,
      caseId: initialVisit?.caseId,
      visitId: initialVisit?.id,
      date: nowIso.split('T')[0],
      time: nowIso.split('T')[1].substring(0, 5),
      inspectorName: conclusions.responsibleProfessionalName,
      professionalLicense: conclusions.professionalLicense,
      organization: 'SIPRE Operaciones',
      address: propertyData.address || 'Dirección no especificada',
      neighborhood: propertyData.neighborhood,
      municipality: propertyData.municipality,
      department: propertyData.department,
      propertyType: propertyData.propertyType,
      apartmentUnit: propertyData.apartmentUnit,
      towerBlock: propertyData.towerBlock,
      floorLevel: propertyData.floorLevel,
      gps: {
        latitude: parseFloat(propertyData.gpsLat) || 6.2086,
        longitude: parseFloat(propertyData.gpsLng) || -75.5684,
        timestamp: nowIso,
      },
      ownerName: clientData.ownerName,
      occupantName: clientData.occupantName,
      ownerPhone: clientData.phone,
      ownerEmail: clientData.email,
      contactPerson: clientData.contactPerson,
      buildingUse: 'Residencial',
      floors: parseInt(propertyData.buildingFloorsCount) || 1,
      basements: 0,
      documentation: docs,
      structuralSystem: characterization.structuralSystem,
      predominantMaterial: characterization.predominantMaterial,
      foundationType: characterization.foundationType,
      floorSystem: characterization.floorSystem,
      roofType: characterization.roofType,
      masonryType: characterization.masonryType,
      generalObservations: characterization.generalCondition,
      walkthroughZones: walkthroughZones,
      elements: [],
      findings: findingsList,
      photos: [],
      videos: [],
      voiceNotes: [],
      evidenceMedia: evidenceList,
      walkthroughSummary: conclusions.walkthroughSummary,
      mainFindingsSummary: conclusions.mainFindingsSummary,
      generalPropertyCondition: conclusions.generalPropertyCondition,
      structuralObservations: conclusions.structuralObservations,
      masonryObservations: conclusions.masonryObservations,
      nonstructuralObservations: conclusions.nonstructuralObservations,
      groundObservations: conclusions.groundObservations,
      potentialCauses: conclusions.potentialCauses,
      additionalStudiesRequired: conclusions.additionalStudiesRequired,
      immediateRecommendations: conclusions.immediateRecommendations,
      repairDecision: repairDecision,
      repairFollowUpRequired: followUpRequired,
      repairFollowUpDate: followUpDate,
      proposedRepairs: proposedRepairs,
      preliminaryPriority: 'YELLOW',
      isPreliminaryPriorityConfirmed: true,
      professionalAssessment: {
        conclusion: conclusions.professionalConclusion || 'Inspección técnica finalizada en campo.',
        immediateRecommendations: conclusions.immediateRecommendations || 'Seguir protocolo de intervención.',
        accessRestrictions: (conclusions.accessRestrictionsNote as any) || 'Ninguna',
        temporaryStabilization: conclusions.temporaryMeasuresNote || '',
        additionalStudiesRequired: conclusions.additionalStudiesRequired || '',
        structuralEvaluationRequired: false,
        monitoringRequired: false,
        repairRequired: repairDecision === 'REQUIERE REPARACIÓN',
        evacuationRecommendation: 'No Requerida',
        additionalComments: '',
        finalPriorityConfirmed: 'YELLOW',
        confirmedByProfessional: true,
        inspectorName: conclusions.responsibleProfessionalName,
        professionalLicense: conclusions.professionalLicense,
        organization: 'SIPRE',
        date: nowIso.split('T')[0],
      },
      status: 'Completada',
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    setSavedSuccessMsg(`¡Inspección ${inspectionRecord.id} guardada exitosamente!`);
    setTimeout(() => {
      onFinalizeToTechnicalReview();
    }, 1500);
  };

  const stepsLabels = [
    'Predio',
    'Cliente',
    'Documentación',
    'Caracterización',
    'Recorrido',
    'Hallazgos',
    'Evidencias',
    'Conclusiones',
    'Decisión',
    'Finalizar',
  ];

  return (
    <div id="sipre-field-mode-screen" className="max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      
      {/* Top Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Volver al Centro de Operaciones"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">
                MODO CAMPO
              </span>
              <span className="text-xs text-slate-400 font-mono">Paso {currentStep} de {totalSteps}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {stepsLabels[currentStep - 1]}
            </h1>
          </div>
        </div>

        <button
          onClick={handleFinalizeFullInspection}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Guardar</span>
        </button>
      </div>

      {savedSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 font-bold text-xs text-center flex items-center justify-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{savedSuccessMsg}</span>
        </div>
      )}

      {/* 10-Step Progress Indicator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg overflow-x-auto">
        <div className="flex items-center justify-between min-w-[580px] gap-1">
          {stepsLabels.map((label, idx) => {
            const stepNumber = idx + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <button
                key={idx}
                onClick={() => setCurrentStep(stepNumber)}
                className={`flex-1 flex flex-col items-center py-1 px-1.5 rounded-lg text-center transition-all ${
                  isCurrent
                    ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                    : isCompleted
                    ? 'text-emerald-400 hover:bg-slate-800'
                    : 'text-slate-500 hover:bg-slate-800/40'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold font-mono mb-1 ${
                    isCurrent
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepNumber}
                </div>
                <span className="text-[10px] font-bold tracking-tight truncate max-w-[65px]">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">

        {/* ========================================================
            STEP 1: IDENTIFICACIÓN DEL PREDIO
           ======================================================== */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <span>1. Identificación del Predio</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Localización geográfica, tipología estructural y características básicas del inmueble
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-bold mb-1">Dirección del Inmueble *</label>
                <input
                  type="text"
                  value={propertyData.address}
                  onChange={(e) => setPropertyData({ ...propertyData, address: e.target.value })}
                  placeholder="Ej. Carrera 43A # 18 Sur - 120"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Barrio / Sector</label>
                <input
                  type="text"
                  value={propertyData.neighborhood}
                  onChange={(e) => setPropertyData({ ...propertyData, neighborhood: e.target.value })}
                  placeholder="Ej. El Poblado"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Municipio</label>
                <input
                  type="text"
                  value={propertyData.municipality}
                  onChange={(e) => setPropertyData({ ...propertyData, municipality: e.target.value })}
                  placeholder="Ej. Medellín"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Departamento</label>
                <input
                  type="text"
                  value={propertyData.department}
                  onChange={(e) => setPropertyData({ ...propertyData, department: e.target.value })}
                  placeholder="Ej. Antioquia"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Tipo de Inmueble</label>
                <select
                  value={propertyData.propertyType}
                  onChange={(e) => setPropertyData({ ...propertyData, propertyType: e.target.value as PropertyType })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Casa">Casa</option>
                  <option value="Apartamento">Apartamento</option>
                  <option value="Edificio">Edificio</option>
                  <option value="Local comercial">Local comercial</option>
                  <option value="Bodega">Bodega</option>
                  <option value="Institucional">Institucional</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Conditional fields if Apartamento or Edificio */}
              {(propertyData.propertyType === 'Apartamento' || propertyData.propertyType === 'Edificio') && (
                <>
                  <div>
                    <label className="block text-cyan-300 font-bold mb-1">Número de Apto / Unidad</label>
                    <input
                      type="text"
                      value={propertyData.apartmentUnit}
                      onChange={(e) => setPropertyData({ ...propertyData, apartmentUnit: e.target.value })}
                      placeholder="Ej. Apto 402"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-cyan-300 font-bold mb-1">Torre / Bloque</label>
                    <input
                      type="text"
                      value={propertyData.towerBlock}
                      onChange={(e) => setPropertyData({ ...propertyData, towerBlock: e.target.value })}
                      placeholder="Ej. Torre 2"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-cyan-300 font-bold mb-1">Piso / Nivel</label>
                    <input
                      type="text"
                      value={propertyData.floorLevel}
                      onChange={(e) => setPropertyData({ ...propertyData, floorLevel: e.target.value })}
                      placeholder="Ej. Piso 4"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-300 font-bold mb-1">Número de Pisos de la Edificación</label>
                <input
                  type="number"
                  value={propertyData.buildingFloorsCount}
                  onChange={(e) => setPropertyData({ ...propertyData, buildingFloorsCount: e.target.value })}
                  placeholder="Ej. 4"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Área Aproximada (m²)</label>
                <input
                  type="text"
                  value={propertyData.approxAreaM2}
                  onChange={(e) => setPropertyData({ ...propertyData, approxAreaM2: e.target.value })}
                  placeholder="Ej. 120"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Uso Actual</label>
                <input
                  type="text"
                  value={propertyData.currentUse}
                  onChange={(e) => setPropertyData({ ...propertyData, currentUse: e.target.value })}
                  placeholder="Ej. Vivienda familiar"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Año de Construcción Aprox.</label>
                <input
                  type="text"
                  value={propertyData.approxConstructionYear}
                  onChange={(e) => setPropertyData({ ...propertyData, approxConstructionYear: e.target.value })}
                  placeholder="Ej. 2010"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Ocupantes Aproximados</label>
                <input
                  type="text"
                  value={propertyData.approxOccupants}
                  onChange={(e) => setPropertyData({ ...propertyData, approxOccupants: e.target.value })}
                  placeholder="Ej. 4 personas"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* GPS Capture Placeholder */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Coordenadas GPS de la Inspección</span>
                <span className="text-[11px] font-mono text-slate-400">
                  Lat: {propertyData.gpsLat}, Lng: {propertyData.gpsLng} {propertyData.gpsCaptured && '(Confirmado)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPropertyData({ ...propertyData, gpsCaptured: true })}
                className="bg-slate-800 hover:bg-slate-700 text-cyan-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 transition-colors"
              >
                Capturar GPS
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 2: PROPIETARIO / CLIENTE
           ======================================================== */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <User className="w-5 h-5 text-cyan-400" />
                <span>2. Información del Propietario / Cliente</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Datos de contacto, persona que atiende la visita y vinculación con el inmueble
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nombre del Propietario *</label>
                <input
                  type="text"
                  value={clientData.ownerName}
                  onChange={(e) => setClientData({ ...clientData, ownerName: e.target.value })}
                  placeholder="Nombre completo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Nombre Ocupante (si es diferente)</label>
                <input
                  type="text"
                  value={clientData.occupantName}
                  onChange={(e) => setClientData({ ...clientData, occupantName: e.target.value })}
                  placeholder="Nombre del arrendatario u ocupante"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Cliente / Organización / Copropiedad</label>
                <input
                  type="text"
                  value={clientData.clientOrganization}
                  onChange={(e) => setClientData({ ...clientData, clientOrganization: e.target.value })}
                  placeholder="Ej. Edificio Los Robles P.H."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Número de Identificación (Cédula / NIT)</label>
                <input
                  type="text"
                  value={clientData.identificationNumber}
                  onChange={(e) => setClientData({ ...clientData, identificationNumber: e.target.value })}
                  placeholder="Opcional"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Teléfono / Celular *</label>
                <input
                  type="tel"
                  value={clientData.phone}
                  onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                  placeholder="Ej. 300 123 4567"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={clientData.email}
                  onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Persona de Contacto</label>
                <input
                  type="text"
                  value={clientData.contactPerson}
                  onChange={(e) => setClientData({ ...clientData, contactPerson: e.target.value })}
                  placeholder="Persona encargada"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Relación con el Inmueble</label>
                <select
                  value={clientData.relationshipWithProperty}
                  onChange={(e) => setClientData({ ...clientData, relationshipWithProperty: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Propietario">Propietario</option>
                  <option value="Arrendatario">Arrendatario</option>
                  <option value="Administrador">Administrador</option>
                  <option value="Apoderado">Apoderado</option>
                  <option value="Contratista">Contratista</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Quién Atiende la Visita</label>
                <input
                  type="text"
                  value={clientData.whoAttendsVisit}
                  onChange={(e) => setClientData({ ...clientData, whoAttendsVisit: e.target.value })}
                  placeholder="Nombre de quien recibe al inspector"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-bold mb-1">Observaciones Iniciales del Cliente</label>
                <textarea
                  rows={2}
                  value={clientData.clientObservations}
                  onChange={(e) => setClientData({ ...clientData, clientObservations: e.target.value })}
                  placeholder="Descripción del motivo de solicitud o antecedentes mencionados por el cliente..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 3: DOCUMENTACIÓN DISPONIBLE
           ======================================================== */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-cyan-400" />
                <span>3. Documentación Técnica Disponible</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Verificación de planos, estudios geotécnicos y antecedentes constructivos
              </p>
            </div>

            <div className="space-y-3">
              {[
                { key: 'blueprints', label: '¿Cuenta con planos arquitectónicos?' },
                { key: 'structuralDesign', label: '¿Cuenta con planos estructurales?' },
                { key: 'soilStudy', label: '¿Cuenta con estudio de suelos?' },
                { key: 'calculationMemories', label: '¿Cuenta con memorias de cálculo?' },
                { key: 'buildingPermit', label: '¿Cuenta con licencia de construcción?' },
                { key: 'previousTechnicalReports', label: '¿Cuenta con informes técnicos previos?' },
                { key: 'preEventPhotos', label: '¿Cuenta con fotografías anteriores al evento?' },
              ].map((docItem) => {
                const currentVal = (docs as any)[docItem.key] || 'No';
                const options: DocStatusOption[] = ['Sí', 'No', 'Parcial', 'No disponible', 'No se conoce', 'No aplica'];

                return (
                  <div key={docItem.key} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-200">{docItem.label}</span>
                    <div className="flex flex-wrap gap-1">
                      {options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setDocs({ ...docs, [docItem.key]: opt })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            currentVal === opt
                              ? 'bg-cyan-600 text-white shadow'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">Notas sobre la Documentación</label>
              <textarea
                rows={2}
                value={docs.notes || ''}
                onChange={(e) => setDocs({ ...docs, notes: e.target.value })}
                placeholder="Detalles sobre planos entregados, curaduría de origen o restricciones..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 4: CARACTERIZACIÓN
           ======================================================== */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <span>4. Caracterización Estructural</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Definición del sistema resistente a sismos, materiales y antecedentes patológicos
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Sistema Estructural Principal</label>
                <select
                  value={characterization.structuralSystem}
                  onChange={(e) => setCharacterization({ ...characterization, structuralSystem: e.target.value as StructuralSystem })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Pórticos de Concreto Reforzado">Pórticos de Concreto Reforzado</option>
                  <option value="Mampostería Confinada">Mampostería Confinada</option>
                  <option value="Mampostería Estructural">Mampostería Estructural</option>
                  <option value="Mampostería No Reforzada">Mampostería No Reforzada</option>
                  <option value="Sistema Dual (Pórticos y Muros)">Sistema Dual (Pórticos y Muros)</option>
                  <option value="Estructura Metálica">Estructura Metálica</option>
                  <option value="Estructura de Madera">Estructura de Madera</option>
                  <option value="Sistema Mixto">Sistema Mixto</option>
                  <option value="Desconocido">Desconocido</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Material Predominante</label>
                <input
                  type="text"
                  value={characterization.predominantMaterial}
                  onChange={(e) => setCharacterization({ ...characterization, predominantMaterial: e.target.value })}
                  placeholder="Ej. Concreto f'c 21 MPa / Ladrillo tolete"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Tipo de Cimentación (si se conoce)</label>
                <input
                  type="text"
                  value={characterization.foundationType}
                  onChange={(e) => setCharacterization({ ...characterization, foundationType: e.target.value })}
                  placeholder="Ej. Zapatas aisladas con vigas de amarre"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Sistema de Entrepiso</label>
                <input
                  type="text"
                  value={characterization.floorSystem}
                  onChange={(e) => setCharacterization({ ...characterization, floorSystem: e.target.value })}
                  placeholder="Ej. Losa aligerada en una dirección"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Tipo de Cubierta</label>
                <input
                  type="text"
                  value={characterization.roofType}
                  onChange={(e) => setCharacterization({ ...characterization, roofType: e.target.value })}
                  placeholder="Ej. Losa maciza impermeabilizada / Teja"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Tipo de Mampostería</label>
                <input
                  type="text"
                  value={characterization.masonryType}
                  onChange={(e) => setCharacterization({ ...characterization, masonryType: e.target.value })}
                  placeholder="Ej. Ladrillo de arcilla cocida / Bloque de concreto"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Modificaciones Estructurales Previas</label>
                <input
                  type="text"
                  value={characterization.previousModifications}
                  onChange={(e) => setCharacterization({ ...characterization, previousModifications: e.target.value })}
                  placeholder="Ej. Demolición de muros divisorios en 2018"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Reparaciones Anteriores</label>
                <input
                  type="text"
                  value={characterization.previousRepairs}
                  onChange={(e) => setCharacterization({ ...characterization, previousRepairs: e.target.value })}
                  placeholder="Ej. Resane superficial con mortero"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-bold mb-1">Condición General Observada</label>
                <textarea
                  rows={2}
                  value={characterization.generalCondition}
                  onChange={(e) => setCharacterization({ ...characterization, generalCondition: e.target.value })}
                  placeholder="Apreciación global sobre regularidad en planta, elevación, entorno y estado de conservación..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 5: RECORRIDO E INSPECCIÓN POR ZONAS
           ======================================================== */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Compass className="w-5 h-5 text-cyan-400" />
                <span>5. Recorrido de Inspección por Zonas</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Organización sistemática del recorrido en campo por niveles y áreas del predio
              </p>
            </div>

            {/* Zone Selector Pills */}
            <div className="flex flex-wrap gap-1.5">
              {walkthroughZones.map((zone) => (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setSelectedZoneId(zone.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    selectedZoneId === zone.id
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>{zone.name}</span>
                  {zone.findingsCount > 0 && (
                    <span className="bg-red-500 text-white px-1.5 py-0.2 rounded-full text-[10px]">
                      {zone.findingsCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Add Custom Zone */}
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="text"
                value={customZoneName}
                onChange={(e) => setCustomZoneName(e.target.value)}
                placeholder="Nombre de nueva zona (ej. Cuarto de Máquinas)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomZone}
                className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 flex items-center space-x-1"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Agregar Zona</span>
              </button>
            </div>

            {/* Selected Zone Card */}
            {(() => {
              const activeZone = walkthroughZones.find(z => z.id === selectedZoneId) || walkthroughZones[0];
              return (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                      Zona Activa: {activeZone.name}
                    </span>
                    <button
                      onClick={() => {
                        setCurrentFindingForm({ ...currentFindingForm, zone: activeZone.name });
                        setIsAddingFinding(true);
                        setCurrentStep(6);
                      }}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Hallazgo en esta zona</span>
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Descripción del Recorrido en esta Zona</label>
                      <textarea
                        rows={2}
                        value={activeZone.description}
                        onChange={(e) => {
                          const updated = walkthroughZones.map(z => z.id === activeZone.id ? { ...z, description: e.target.value } : z);
                          setWalkthroughZones(updated);
                        }}
                        placeholder={`Observaciones visuales del recorrido en ${activeZone.name}...`}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <button type="button" onClick={() => { setActiveEvidenceCategory('GENERAL VISIT'); setPendingMediaDescription(`Zona: ${activeZone.name}`); photoCaptureRef.current?.click(); }} className="bg-slate-900 hover:bg-slate-800 text-slate-300 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center justify-center space-y-1 text-center">
                        <Camera className="w-4 h-4 text-cyan-400" /><span className="text-[11px] font-bold">Foto</span>
                      </button>
                      <button type="button" onClick={() => { setActiveEvidenceCategory('GENERAL VISIT'); setPendingMediaDescription(`Zona: ${activeZone.name}`); videoCaptureRef.current?.click(); }} className="bg-slate-900 hover:bg-slate-800 text-slate-300 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center justify-center space-y-1 text-center">
                        <Video className="w-4 h-4 text-purple-400" /><span className="text-[11px] font-bold">Video</span>
                      </button>
                      <button type="button" onClick={() => { setActiveEvidenceCategory('GENERAL VISIT'); setPendingMediaDescription(`Zona: ${activeZone.name}`); if (isRecordingVoice) stopVoiceRecording(); else startVoiceRecording(); }} className={`bg-slate-900 hover:bg-slate-800 p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 text-center ${isRecordingVoice ? 'border-red-500 text-red-300' : 'border-slate-800 text-slate-300'}`}>
                        <Mic className={`w-4 h-4 ${isRecordingVoice ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`} /><span className="text-[11px] font-bold">{isRecordingVoice ? 'Detener Voz' : 'Nota de Voz'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ========================================================
            STEP 6: HALLAZGOS Y PATOLOGÍA
           ======================================================== */}
        {currentStep === 6 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <ShieldAlert className="w-5 h-5 text-cyan-400" />
                  <span>6. Registro de Hallazgos Patológicos</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fisuras, deformaciones, asentamientos, humedades y daños estructurales
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingFinding(true)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Nuevo Hallazgo</span>
              </button>
            </div>

            {/* Form for new finding */}
            {isAddingFinding && (
              <div className="bg-slate-950 p-5 rounded-2xl border border-cyan-500/50 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    REGISTRAR HALLAZGO #{findingsList.length + 1}
                  </span>
                  <button
                    onClick={() => setIsAddingFinding(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Elemento Afectado</label>
                    <select
                      value={currentFindingForm.elementType}
                      onChange={(e) => setCurrentFindingForm({ ...currentFindingForm, elementType: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="Columna">Columna</option>
                      <option value="Viga">Viga</option>
                      <option value="Muro Estructural">Muro Estructural</option>
                      <option value="Muro de Mampostería">Muro de Mampostería</option>
                      <option value="Losa / Entrepiso">Losa / Entrepiso</option>
                      <option value="Escalera">Escalera</option>
                      <option value="Cimentación">Cimentación</option>
                      <option value="Fachada">Fachada</option>
                      <option value="Cubierta">Cubierta</option>
                      <option value="Terreno / Suelo">Terreno / Suelo</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Etiqueta / Identificador</label>
                    <input
                      type="text"
                      value={currentFindingForm.elementLabel}
                      onChange={(e) => setCurrentFindingForm({ ...currentFindingForm, elementLabel: e.target.value })}
                      placeholder="Ej. Columna C-04 Eje B-2"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Zona / Nivel</label>
                    <input
                      type="text"
                      value={currentFindingForm.zone}
                      onChange={(e) => setCurrentFindingForm({ ...currentFindingForm, zone: e.target.value })}
                      placeholder="Ej. Primer piso / Fachada principal"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Tipo de Daño</label>
                    <select
                      value={currentFindingForm.damageType}
                      onChange={(e) => setCurrentFindingForm({ ...currentFindingForm, damageType: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="Grieta / Fisura">Grieta / Fisura</option>
                      <option value="Aplastamiento de Concreto">Aplastamiento de Concreto</option>
                      <option value="Desprendimiento de Recubrimiento">Desprendimiento de Recubrimiento</option>
                      <option value="Acero Expuesto / Pandeado">Acero Expuesto / Pandeado</option>
                      <option value="Deformación Permanente">Deformación Permanente</option>
                      <option value="Desplazamiento Relativo">Desplazamiento Relativo</option>
                      <option value="Humedad / Eflorescencia">Humedad / Eflorescencia</option>
                      <option value="Asentamiento Diferencial">Asentamiento Diferencial</option>
                      <option value="Falla en Unión Viga-Columna">Falla en Unión Viga-Columna</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Tipo de Grieta</label>
                    <select
                      value={currentFindingForm.crackType}
                      onChange={(e) => setCurrentFindingForm({ ...currentFindingForm, crackType: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="Diagonal (Cortante)">Diagonal (Cortante)</option>
                      <option value="Vertical (Flexión)">Vertical (Flexión)</option>
                      <option value="Horizontal (Compresión/Junta)">Horizontal (Compresión/Junta)</option>
                      <option value="Escalonada (Mampostería)">Escalonada (Mampostería)</option>
                      <option value="En X (Corte Cíclico)">En X (Corte Cíclico)</option>
                      <option value="Mapeo / Retracción">Mapeo / Retracción</option>
                      <option value="Irregular">Irregular</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Apertura / Ancho (mm)</label>
                    <select
                      value={currentFindingForm.crackWidth}
                      onChange={(e) => setCurrentFindingForm({ ...currentFindingForm, crackWidth: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="<0.1 mm">&lt;0.1 mm (Microfisura)</option>
                      <option value="0.1–0.3 mm">0.1–0.3 mm (Fisura capilar)</option>
                      <option value="0.3–0.5 mm">0.3–0.5 mm (Fisura moderada)</option>
                      <option value="0.5–1.0 mm">0.5–1.0 mm (Grieta intermedia)</option>
                      <option value="1–3 mm">1–3 mm (Grieta severa)</option>
                      <option value=">3 mm">&gt;3 mm (Grieta crítica)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Severidad Preliminar</label>
                    <select
                      value={currentFindingForm.severity}
                      onChange={(e) => setCurrentFindingForm({ ...currentFindingForm, severity: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="Baja">Baja (Verde)</option>
                      <option value="Moderada">Moderada (Amarillo)</option>
                      <option value="Severa">Severa (Naranja)</option>
                      <option value="Crítica">Crítica (Rojo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">¿Requiere Reparación Potencial?</label>
                    <select
                      value={currentFindingForm.repairPotentiallyRequired}
                      onChange={(e) => setCurrentFindingForm({ ...currentFindingForm, repairPotentiallyRequired: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="SÍ">SÍ</option>
                      <option value="NO">NO</option>
                      <option value="POR DETERMINAR">POR DETERMINAR</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-bold mb-1">Descripción Detallada del Hallazgo</label>
                    <textarea
                      rows={2}
                      value={currentFindingForm.description}
                      onChange={(e) => setCurrentFindingForm({ ...currentFindingForm, description: e.target.value })}
                      placeholder="Describa la longitud, profundidad, afectación y características del elemento..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-bold mb-1">Posible Causa / Observación Profesional</label>
                    <input
                      type="text"
                      value={currentFindingForm.possibleCause}
                      onChange={(e) => setCurrentFindingForm({ ...currentFindingForm, possibleCause: e.target.value })}
                      placeholder="Ej. Esfuerzos cortantes sísmicos, sobrecarga o asentamiento localizado"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* AI Safety Disclaimer Box */}
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-start space-x-2 text-[11px] text-slate-400">
                  <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-cyan-300">Asistencia Técnica IA Preliminar: </span>
                    <span>
                      La IA proporciona referencias comparativas (NSR-10 / AIS 410). La habitabilidad, seguridad y decisión final de intervención corresponden exclusivamente al profesional facultado.
                    </span>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddingFinding(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveFinding}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold"
                  >
                    Guardar Hallazgo
                  </button>
                </div>
              </div>
            )}

            {/* List of registered findings */}
            {findingsList.length > 0 ? (
              <div className="space-y-3">
                {findingsList.map((f, idx) => (
                  <div
                    key={f.id}
                    className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start justify-between space-x-3"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {f.id}
                        </span>
                        <span className="font-bold text-white">{f.elementLabel} ({f.elementType})</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          {f.severity}
                        </span>
                        <span className="text-slate-500">| Zona: {f.zone}</span>
                      </div>
                      <p className="text-slate-300">{f.description || 'Sin descripción detallada'}</p>
                      <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                        <span>Daño: <strong className="text-slate-200">{f.damageType}</strong></span>
                        <span>Tipo de grieta: <strong className="text-slate-200">{f.crackType}</strong></span>
                        <span>Apertura: <strong className="text-slate-200">{f.crackWidth}</strong></span>
                        <span>Requiere reparación: <strong className="text-cyan-300">{f.repairPotentiallyRequired}</strong></span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFindingsList(findingsList.filter(item => item.id !== f.id))}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-900 transition-colors"
                      title="Eliminar hallazgo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center space-y-2">
                <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto" />
                <h3 className="text-xs font-bold text-slate-300">No hay hallazgos registrados aún</h3>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Registra los elementos dañados, tipo de fisuras, dimensiones y severidad para estructurar el dictamen.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            STEP 7: EVIDENCIAS
           ======================================================== */}
        {currentStep === 7 && (
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center space-x-2"><Camera className="w-5 h-5 text-cyan-400" /><span>7. Evidencias y Galería de Inspección</span></h2>
              <p className="text-xs text-slate-400 mt-0.5">Fotos, videos, notas de voz y documentos almacenados en SIPRE para consulta remota.</p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['GENERAL VISIT','FINDINGS','BEFORE REPAIR','DURING REPAIR','AFTER REPAIR','MATERIALS','MATERIAL DELIVERY','FINAL HANDOVER'].map((cat) => (
                <button key={cat} type="button" onClick={() => setActiveEvidenceCategory(cat as EvidenceCategory)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeEvidenceCategory === cat ? 'bg-cyan-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'}`}>{cat}</button>
              ))}
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Descripción opcional de la evidencia</label>
              <input type="text" value={pendingMediaDescription} onChange={(e) => setPendingMediaDescription(e.target.value)} placeholder="Ej. Fisura diagonal en columna C-03, primer piso" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none" />
            </div>

            <input ref={photoCaptureRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleInputEvidence(e, 'photo')} />
            <input ref={photoUploadRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleInputEvidence(e, 'photo')} />
            <input ref={videoCaptureRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={(e) => handleInputEvidence(e, 'video')} />
            <input ref={audioFileRef} type="file" accept="audio/*" className="hidden" onChange={(e) => handleInputEvidence(e, 'voice')} />
            <input ref={documentFileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*" className="hidden" onChange={(e) => handleInputEvidence(e, 'document')} />

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
              <button type="button" disabled={mediaUploading} onClick={() => photoCaptureRef.current?.click()} className="bg-slate-950 disabled:opacity-50 p-3 rounded-xl border border-slate-800 flex flex-col items-center space-y-1.5 text-xs font-bold text-slate-200"><Camera className="w-5 h-5 text-cyan-400" /><span>Tomar Foto</span></button>
              <button type="button" disabled={mediaUploading} onClick={() => photoUploadRef.current?.click()} className="bg-slate-950 disabled:opacity-50 p-3 rounded-xl border border-slate-800 flex flex-col items-center space-y-1.5 text-xs font-bold text-slate-200"><Upload className="w-5 h-5 text-blue-400" /><span>Subir Foto</span></button>
              <button type="button" disabled={mediaUploading} onClick={() => videoCaptureRef.current?.click()} className="bg-slate-950 disabled:opacity-50 p-3 rounded-xl border border-slate-800 flex flex-col items-center space-y-1.5 text-xs font-bold text-slate-200"><Video className="w-5 h-5 text-purple-400" /><span>Grabar Video</span></button>
              <button type="button" disabled={mediaUploading} onClick={isRecordingVoice ? stopVoiceRecording : startVoiceRecording} className={`bg-slate-950 disabled:opacity-50 p-3 rounded-xl border flex flex-col items-center space-y-1.5 text-xs font-bold ${isRecordingVoice ? 'border-red-500 text-red-300' : 'border-slate-800 text-slate-200'}`}><Mic className={`w-5 h-5 ${isRecordingVoice ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`} /><span>{isRecordingVoice ? 'Detener Voz' : 'Nota de Voz'}</span></button>
              <button type="button" disabled={mediaUploading} onClick={() => documentFileRef.current?.click()} className="bg-slate-950 disabled:opacity-50 p-3 rounded-xl border border-slate-800 flex flex-col items-center space-y-1.5 text-xs font-bold text-slate-200"><FileText className="w-5 h-5 text-amber-400" /><span>Documento</span></button>
            </div>

            {mediaUploading && <div className="bg-cyan-950/60 border border-cyan-800 rounded-xl px-4 py-3 text-xs text-cyan-200 font-bold">Guardando evidencia en SIPRE…</div>}
            {mediaError && <div className="bg-red-950/60 border border-red-800 rounded-xl px-4 py-3 text-xs text-red-200">{mediaError}</div>}

            {evidenceList.filter((item) => item.category === activeEvidenceCategory).length === 0 ? (
              <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center space-y-2"><Camera className="w-8 h-8 text-slate-600 mx-auto" /><h3 className="text-xs font-bold text-slate-300">Sin archivos en la categoría "{activeEvidenceCategory}"</h3><p className="text-[11px] text-slate-500">Las evidencias se guardarán en Supabase y quedarán disponibles para el equipo.</p></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {evidenceList.filter((item) => item.category === activeEvidenceCategory).map((item) => (
                  <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                    {item.mediaType === 'photo' && <img src={item.url} alt={item.description || item.filename || 'Evidencia'} className="w-full h-48 object-cover bg-black" />}
                    {item.mediaType === 'video' && <video src={item.url} controls playsInline className="w-full h-48 object-contain bg-black" />}
                    {item.mediaType === 'voice' && <div className="p-4 bg-slate-900"><audio src={item.url} controls className="w-full" /></div>}
                    {item.mediaType === 'document' && <div className="p-5 text-center bg-slate-900"><a href={item.url} target="_blank" rel="noreferrer" className="text-cyan-300 text-xs font-bold hover:underline">Abrir documento</a></div>}
                    <div className="p-3 space-y-1"><div className="text-xs font-bold text-white truncate">{item.filename || item.mediaType}</div><div className="text-[10px] text-slate-500">{item.date} {item.time} · {item.user}</div><div className="text-[11px] text-slate-300">{item.description}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            STEP 8: CONCLUSIONES DE LA VISITA
           ======================================================== */}
        {currentStep === 8 && (
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span>8. Conclusiones de la Visita Técnica</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Dictamen del recorrido, observaciones por sistema y recomendaciones inmediatas
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Resumen del Recorrido Técnico</label>
                <textarea
                  rows={2}
                  value={conclusions.walkthroughSummary}
                  onChange={(e) => setConclusions({ ...conclusions, walkthroughSummary: e.target.value })}
                  placeholder="Síntesis del recorrido efectuado por todos los niveles y áreas accesibles..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Principales Hallazgos y Afectaciones</label>
                <textarea
                  rows={2}
                  value={conclusions.mainFindingsSummary}
                  onChange={(e) => setConclusions({ ...conclusions, mainFindingsSummary: e.target.value })}
                  placeholder="Resumen de los elementos con mayor compromiso o severidad observada..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Observaciones Estructurales</label>
                  <textarea
                    rows={2}
                    value={conclusions.structuralObservations}
                    onChange={(e) => setConclusions({ ...conclusions, structuralObservations: e.target.value })}
                    placeholder="Columnas, vigas, muros estructurales, losas..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Observaciones de Mampostería</label>
                  <textarea
                    rows={2}
                    value={conclusions.masonryObservations}
                    onChange={(e) => setConclusions({ ...conclusions, masonryObservations: e.target.value })}
                    placeholder="Muros confinados, divisorios, juntas de pega..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Observaciones No Estructurales</label>
                  <textarea
                    rows={2}
                    value={conclusions.nonstructuralObservations}
                    onChange={(e) => setConclusions({ ...conclusions, nonstructuralObservations: e.target.value })}
                    placeholder="Fachadas, cielo rasos, ventanería, instalaciones..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Observaciones de Terreno / Entorno</label>
                  <textarea
                    rows={2}
                    value={conclusions.groundObservations}
                    onChange={(e) => setConclusions({ ...conclusions, groundObservations: e.target.value })}
                    placeholder="Taludes, asentamientos, grietas en piso..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Recomendaciones Inmediatas y Medidas Provisionales</label>
                <textarea
                  rows={2}
                  value={conclusions.immediateRecommendations}
                  onChange={(e) => setConclusions({ ...conclusions, immediateRecommendations: e.target.value })}
                  placeholder="Apuntalamientos provisionales, restricción preventiva de áreas o señalización..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Conclusión Técnica Profesional *</label>
                <textarea
                  rows={3}
                  value={conclusions.professionalConclusion}
                  onChange={(e) => setConclusions({ ...conclusions, professionalConclusion: e.target.value })}
                  placeholder="Concepto técnico emitido por el profesional responsable..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 9: DECISIÓN TÉCNICA & PROPUESTAS
           ======================================================== */}
        {currentStep === 9 && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Wrench className="w-5 h-5 text-cyan-400" />
                <span>9. Decisión Técnica de Reparación</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Definición formal de la necesidad de intervención y apertura de frente de obra
              </p>
            </div>

            {/* Core Decision Question */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <label className="block text-sm font-black text-white">
                ¿SE REQUIERE INTERVENCIÓN / REPARACIÓN?
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 'NO REQUIERE REPARACIÓN', label: 'NO REQUIERE REPARACIÓN', desc: 'Estructura estable sin riesgo' },
                  { id: 'REQUIERE REPARACIÓN', label: 'REQUIERE REPARACIÓN', desc: 'Apertura de frente de obra y reparaciones' },
                  { id: 'REQUIERE EVALUACIÓN ADICIONAL', label: 'REQUIERE EVALUACIÓN ADICIONAL', desc: 'Análisis estructural especializado' },
                  { id: 'REQUIERE ENSAYOS', label: 'REQUIERE ENSAYOS', desc: 'Ensayos destructivos o no destructivos' },
                  { id: 'REQUIERE MONITOREO', label: 'REQUIERE MONITOREO', desc: 'Seguimiento periódico de fisuras' },
                  { id: 'INFORMACIÓN INSUFICIENTE', label: 'INFORMACIÓN INSUFICIENTE', desc: 'Requiere antecedentes técnicos' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRepairDecision(opt.id as RepairDecisionOption)}
                    className={`p-3.5 rounded-xl text-left border transition-all ${
                      repairDecision === opt.id
                        ? 'bg-cyan-600/20 border-cyan-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{opt.label}</span>
                      {repairDecision === opt.id && <Check className="w-4 h-4 text-cyan-400" />}
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* If NO REQUIERE REPARACIÓN */}
            {repairDecision === 'NO REQUIERE REPARACIÓN' && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="chk-followup"
                    checked={followUpRequired}
                    onChange={(e) => setFollowUpRequired(e.target.checked)}
                    className="w-4 h-4 text-cyan-600 rounded bg-slate-900 border-slate-700"
                  />
                  <label htmlFor="chk-followup" className="text-slate-200 font-bold">
                    ¿Requiere seguimiento o visita de control posterior?
                  </label>
                </div>

                {followUpRequired && (
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Fecha programada de seguimiento</label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* If REQUIERE REPARACIÓN */}
            {repairDecision === 'REQUIERE REPARACIÓN' && (
              <div className="space-y-4">
                
                {/* Proposed Repairs List */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                        Reparaciones Propuestas ({proposedRepairs.length})
                      </h3>
                      <p className="text-[11px] text-slate-400">Alcance de actividades técnicas a cotizar y ejecutar</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddingRepairItem(true)}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Agregar Reparación</span>
                    </button>
                  </div>

                  {isAddingRepairItem && (
                    <div className="bg-slate-900 p-4 rounded-xl border border-cyan-500/40 space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Elemento / Ubicación *</label>
                          <input
                            type="text"
                            value={newRepairItem.elementLocation}
                            onChange={(e) => setNewRepairItem({ ...newRepairItem, elementLocation: e.target.value })}
                            placeholder="Ej. Columna C-02 Eje B"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Problema Identificado</label>
                          <input
                            type="text"
                            value={newRepairItem.problem}
                            onChange={(e) => setNewRepairItem({ ...newRepairItem, problem: e.target.value })}
                            placeholder="Ej. Fisura diagonal por cortante"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-slate-300 font-bold mb-1">Descripción de la Reparación *</label>
                          <textarea
                            rows={2}
                            value={newRepairItem.repairDescription}
                            onChange={(e) => setNewRepairItem({ ...newRepairItem, repairDescription: e.target.value })}
                            placeholder="Ej. Inyección de resina epóxica de baja viscosidad previa colocación de puertos..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Cantidad Estimada</label>
                          <input
                            type="number"
                            value={newRepairItem.estimatedQuantity}
                            onChange={(e) => setNewRepairItem({ ...newRepairItem, estimatedQuantity: Number(e.target.value) })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Unidad</label>
                          <select
                            value={newRepairItem.unit}
                            onChange={(e) => setNewRepairItem({ ...newRepairItem, unit: e.target.value as any })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                          >
                            <option value="m">m (metro lineal)</option>
                            <option value="m²">m² (metro cuadrado)</option>
                            <option value="m³">m³ (metro cúbico)</option>
                            <option value="un">un (unidad)</option>
                            <option value="kg">kg (kilogramos)</option>
                            <option value="global">global</option>
                            <option value="punto">punto</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingRepairItem(false)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleAddRepairItem}
                          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold"
                        >
                          Guardar Ítem
                        </button>
                      </div>
                    </div>
                  )}

                  {proposedRepairs.length > 0 ? (
                    <div className="space-y-2">
                      {proposedRepairs.map((item, idx) => (
                        <div key={item.id} className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white block">{item.elementLocation}</span>
                            <p className="text-slate-300 text-[11px]">{item.repairDescription}</p>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Cantidad: {item.estimatedQuantity} {item.unit} | Prioridad: {item.priority}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setProposedRepairs(proposedRepairs.filter(r => r.id !== item.id))}
                            className="p-1 text-slate-500 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-slate-500 text-xs">
                      No hay reparaciones propuestas definidas aún. Agrega los ítems para cotizar al cliente.
                    </div>
                  )}
                </div>

                {/* Create Work Front Action */}
                <div className="bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border border-cyan-500/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center space-x-2">
                      <Wrench className="w-4 h-4 text-cyan-400" />
                      <span>Crear Frente de Obra Operativo</span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Vincula las reparaciones al expediente, asigna personal en sitio, solicitudes de materiales y bitácoras.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateWorkFrontFromDecision}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-center space-x-2 whitespace-nowrap active:scale-95 transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>CREAR FRENTE DE OBRA</span>
                  </button>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ========================================================
            STEP 10: FINALIZAR VISITA
           ======================================================== */}
        {currentStep === 10 && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>10. Finalizar y Registrar Visita Técnica</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Confirmación de dictamen, firma del profesional y consolidación en el expediente
              </p>
            </div>

            {/* Summary Box */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Inmueble:</span>
                <span className="font-bold text-white">{propertyData.address || 'Dirección en campo'}, {propertyData.municipality}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Cliente / Propietario:</span>
                <span className="font-bold text-white">{clientData.ownerName || 'Cliente'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Sistema Estructural:</span>
                <span className="font-semibold text-cyan-300">{characterization.structuralSystem}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Total Hallazgos Registrados:</span>
                <span className="font-bold text-white">{findingsList.length} hallazgos</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Decisión Técnica:</span>
                <span className="font-black text-amber-400">{repairDecision}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Profesional Responsable:</span>
                <span className="font-bold text-emerald-400">{conclusions.responsibleProfessionalName} ({conclusions.professionalLicense})</span>
              </div>
            </div>

            {/* Professional Signoff Disclaimer */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start space-x-3 text-xs text-slate-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Certificación de Inspección en Sitio</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  El profesional certifica que la información consignada corresponde al estado visible del inmueble en la fecha y hora de la visita técnica de conformidad con los lineamientos de la NSR-10 y AIS 410.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleFinalizeFullInspection}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm py-3.5 px-6 rounded-xl shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>FINALIZAR Y REGISTRAR EN EXPEDIENTE</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Step Navigation Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevStep}
          disabled={currentStep === 1}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
            currentStep === 1
              ? 'opacity-40 cursor-not-allowed bg-slate-950 border-slate-800 text-slate-600'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Anterior</span>
        </button>

        <span className="text-xs font-mono text-slate-400 font-bold">
          {currentStep} / {totalSteps}
        </span>

        {currentStep < totalSteps ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <span>Siguiente</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinalizeFullInspection}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finalizar</span>
          </button>
        )}
      </div>

    </div>
  );
};
