import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Camera, Check, CheckCircle2, ChevronLeft, ChevronRight, FileText,
  Loader2, Mic, PlusCircle, Save, Trash2, Upload, Video
} from 'lucide-react';
import {
  CaseDocumentation, DamageSeverity, DocStatusOption, EvidenceCategory, EvidenceMediaItem,
  Finding, InspectionWalkthroughZone, PropertyInspection, PropertyType, RepairDecisionOption,
  RepairItemRecord, StructuralSystem, VisitRecord
} from '../types';
import { generateNextInspectionId, saveInspection } from '../lib/storage';
import { getEvidenceFilesFromDb, saveVisitAssessmentInDb, uploadEvidenceFile } from '../lib/supabaseService';
import { getFieldDraftRemote, saveFieldDraftRemote } from '../lib/fieldDraftRemote';
import { saveInspectionSnapshotRemote } from '../lib/inspectionRemote';
import { useAuth } from '../context/AuthContext';

interface FieldModeViewProps {
  onBackToDashboard: () => void;
  onFinalizeToTechnicalReview: () => void;
  initialVisit?: VisitRecord;
}

const emptyZones: InspectionWalkthroughZone[] = [
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

const inputClass = 'w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-200';
const labelClass = 'block text-xs font-bold text-slate-700 mb-1';

export const FieldModeView: React.FC<FieldModeViewProps> = ({ onBackToDashboard, onFinalizeToTechnicalReview, initialVisit }) => {
  const { user, profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [draftReady, setDraftReady] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [propertyData, setPropertyData] = useState({
    address: initialVisit?.address || '', neighborhood: initialVisit?.neighborhood || '', municipality: initialVisit?.municipality || '', department: initialVisit?.department || '',
    propertyType: (initialVisit?.propertyType || 'Casa') as PropertyType, apartmentUnit: '', towerBlock: '', floorLevel: '', buildingFloorsCount: '', approxAreaM2: '', currentUse: '', approxConstructionYear: '', approxOccupants: '', gpsLat: '', gpsLng: ''
  });
  const [clientData, setClientData] = useState({
    ownerName: initialVisit?.clientName || '', occupantName: '', clientOrganization: '', identificationNumber: '', phone: '', email: '', contactPerson: '', relationshipWithProperty: 'Propietario', whoAttendsVisit: '', clientObservations: ''
  });
  const [docs, setDocs] = useState<CaseDocumentation>({
    blueprints: 'No', structuralDesign: 'No', soilStudy: 'No disponible', calculationMemories: 'No se conoce', buildingPermit: 'No se conoce', previousTechnicalReports: 'No', preEventPhotos: 'No', notes: ''
  });
  const [characterization, setCharacterization] = useState({
    structuralSystem: 'Pórticos de Concreto Reforzado' as StructuralSystem, predominantMaterial: '', foundationType: '', floorSystem: '', roofType: '', masonryType: '', previousModifications: '', previousRepairs: '', knownPreviousDamage: '', generalCondition: ''
  });
  const [walkthroughZones, setWalkthroughZones] = useState<InspectionWalkthroughZone[]>(emptyZones);
  const [selectedZoneId, setSelectedZoneId] = useState('zone-ext');
  const [customZoneName, setCustomZoneName] = useState('');
  const [findingsList, setFindingsList] = useState<Finding[]>([]);
  const [findingForm, setFindingForm] = useState({ zone: 'Exterior y Fachada', floor: '', elementType: 'Muro de Mampostería', elementLabel: '', material: '', damageType: 'Grieta / Fisura', severity: 'Moderada' as DamageSeverity, description: '', possibleCause: '', professionalObservation: '', additionalVerificationRequired: '', repairPotentiallyRequired: 'POR DETERMINAR' as 'SÍ' | 'NO' | 'POR DETERMINAR' });
  const [evidenceList, setEvidenceList] = useState<EvidenceMediaItem[]>([]);
  const [activeEvidenceCategory, setActiveEvidenceCategory] = useState<EvidenceCategory>('GENERAL VISIT');
  const [mediaUploading, setMediaUploading] = useState(false);
  const [conclusions, setConclusions] = useState({
    walkthroughSummary: '', mainFindingsSummary: '', generalPropertyCondition: '', structuralObservations: '', masonryObservations: '', nonstructuralObservations: '', groundObservations: '', potentialCauses: '', additionalStudiesRequired: '', immediateRecommendations: '', accessRestrictionsNote: 'Ninguna', temporaryMeasuresNote: '', professionalConclusion: ''
  });
  const [repairDecision, setRepairDecision] = useState<RepairDecisionOption>('REQUIERE EVALUACIÓN ADICIONAL');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [proposedRepairs, setProposedRepairs] = useState<RepairItemRecord[]>([]);
  const [repairForm, setRepairForm] = useState({ elementLocation: '', problem: '', repairDescription: '', priority: 'Alta' as 'Baja' | 'Media' | 'Alta' | 'Urgente', estimatedQuantity: 1, unit: 'm²', technicalSpecification: '', expectedMaterials: '', specialistRequired: false });

  const photoCaptureRef = useRef<HTMLInputElement | null>(null);
  const photoUploadRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLInputElement | null>(null);
  const documentRef = useRef<HTMLInputElement | null>(null);

  const steps = ['Predio','Cliente','Documentación','Caracterización','Recorrido','Hallazgos','Evidencias','Conclusiones','Decisión','Finalizar'];

  const snapshot = useMemo(() => ({
    propertyData, clientData, docs, characterization, walkthroughZones, selectedZoneId,
    findingsList, evidenceList, conclusions, repairDecision, followUpRequired, followUpDate, proposedRepairs
  }), [propertyData, clientData, docs, characterization, walkthroughZones, selectedZoneId, findingsList, evidenceList, conclusions, repairDecision, followUpRequired, followUpDate, proposedRepairs]);

  const applyDraft = (value: any) => {
    if (!value) return;
    if (value.propertyData) setPropertyData(value.propertyData);
    if (value.clientData) setClientData(value.clientData);
    if (value.docs) setDocs(value.docs);
    if (value.characterization) setCharacterization(value.characterization);
    if (value.walkthroughZones) setWalkthroughZones(value.walkthroughZones);
    if (value.selectedZoneId) setSelectedZoneId(value.selectedZoneId);
    if (value.findingsList) setFindingsList(value.findingsList);
    if (value.evidenceList) setEvidenceList(value.evidenceList);
    if (value.conclusions) setConclusions(value.conclusions);
    if (value.repairDecision) setRepairDecision(value.repairDecision);
    if (typeof value.followUpRequired === 'boolean') setFollowUpRequired(value.followUpRequired);
    if (value.followUpDate) setFollowUpDate(value.followUpDate);
    if (value.proposedRepairs) setProposedRepairs(value.proposedRepairs);
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!initialVisit?.id) { setDraftReady(true); return; }
      try {
        const [draft, evidence] = await Promise.all([
          getFieldDraftRemote(initialVisit.id).catch(() => null),
          getEvidenceFilesFromDb({ caseId: initialVisit.caseId, visitId: initialVisit.id }).catch(() => []),
        ]);
        if (!mounted) return;
        if (draft?.snapshot) {
          applyDraft(draft.snapshot);
          setCurrentStep(draft.status === 'COMPLETADA' ? 10 : draft.currentStep);
        }
        if (evidence.length) setEvidenceList(evidence);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'No se pudo recuperar el borrador remoto.');
      } finally {
        if (mounted) setDraftReady(true);
      }
    };
    load();
    return () => { mounted = false; };
  }, [initialVisit?.id]);

  const persistDraft = async (step = currentStep, showNotice = false) => {
    if (!initialVisit?.id || !draftReady) return;
    setSavingDraft(true);
    try {
      await saveFieldDraftRemote({ visitId: initialVisit.id, caseId: initialVisit.caseId, currentStep: step, snapshot, userId: user?.id });
      if (showNotice) {
        setNotice('Borrador guardado en Supabase. Puedes continuar desde otro dispositivo con el mismo usuario.');
        window.setTimeout(() => setNotice(null), 3500);
      }
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar remotamente. Verifica que la migración de borradores esté aplicada en Supabase.');
    } finally {
      setSavingDraft(false);
    }
  };

  useEffect(() => {
    if (!draftReady || !initialVisit?.id) return;
    const timer = window.setTimeout(() => { persistDraft(currentStep, false); }, 1600);
    return () => window.clearTimeout(timer);
  }, [snapshot, currentStep, draftReady, initialVisit?.id]);

  const goStep = async (step: number) => {
    await persistDraft(step, false);
    setCurrentStep(Math.max(1, Math.min(10, step)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEvidenceFile = async (file: File, mediaType: EvidenceMediaItem['mediaType']) => {
    if (!initialVisit?.id) return;
    setMediaUploading(true); setError(null);
    try {
      const result = await uploadEvidenceFile(file, {
        caseId: initialVisit.caseId, visitId: initialVisit.id, category: activeEvidenceCategory,
        description: `${mediaType} de inspección en campo`, uploadedBy: user?.id,
      });
      if (!result.success) throw new Error(result.error || 'No se pudo guardar la evidencia.');
      const evidence = await getEvidenceFilesFromDb({ caseId: initialVisit.caseId, visitId: initialVisit.id });
      setEvidenceList(evidence);
      setNotice(`${file.name} guardado remotamente.`);
      window.setTimeout(() => setNotice(null), 2500);
    } catch (e: any) {
      setError(e?.message || 'No se pudo subir la evidencia.');
    } finally { setMediaUploading(false); }
  };

  const fileChange = (mediaType: EvidenceMediaItem['mediaType']) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) await handleEvidenceFile(file, mediaType);
  };

  const addZone = () => {
    if (!customZoneName.trim()) return;
    const zone: InspectionWalkthroughZone = { id: `zone-${Date.now()}`, name: customZoneName.trim(), description: '', technicalNotes: '', photos: [], videos: [], voiceNotes: [], findingsCount: 0 };
    setWalkthroughZones(prev => [...prev, zone]); setSelectedZoneId(zone.id); setCustomZoneName('');
  };

  const updateZone = (field: 'description' | 'technicalNotes', value: string) => setWalkthroughZones(prev => prev.map(z => z.id === selectedZoneId ? { ...z, [field]: value } : z));
  const selectedZone = walkthroughZones.find(z => z.id === selectedZoneId) || walkthroughZones[0];

  const addFinding = () => {
    if (!findingForm.elementLabel.trim() && !findingForm.description.trim()) return;
    const finding: Finding = {
      id: `FIND-${Date.now()}`, elementId: `ELEM-${Date.now()}`, elementType: findingForm.elementType,
      elementLabel: findingForm.elementLabel || findingForm.elementType, zone: findingForm.zone, floor: findingForm.floor,
      location: findingForm.zone, material: findingForm.material, description: findingForm.description, damageType: findingForm.damageType,
      severity: findingForm.severity, possibleCause: findingForm.possibleCause, professionalObservation: findingForm.professionalObservation,
      additionalVerificationRequired: findingForm.additionalVerificationRequired, repairPotentiallyRequired: findingForm.repairPotentiallyRequired,
      createdAt: new Date().toISOString(),
    };
    setFindingsList(prev => [...prev, finding]);
    setWalkthroughZones(prev => prev.map(z => z.name === findingForm.zone ? { ...z, findingsCount: (z.findingsCount || 0) + 1 } : z));
    setFindingForm({ ...findingForm, elementLabel: '', material: '', description: '', possibleCause: '', professionalObservation: '', additionalVerificationRequired: '' });
  };

  const addRepair = () => {
    if (!repairForm.elementLocation.trim() && !repairForm.repairDescription.trim()) return;
    const item: RepairItemRecord = {
      id: `REP-${Date.now()}`, caseId: initialVisit?.caseId || '', visitId: initialVisit?.id,
      elementLocation: repairForm.elementLocation, problem: repairForm.problem, repairDescription: repairForm.repairDescription,
      priority: repairForm.priority, estimatedQuantity: Number(repairForm.estimatedQuantity) || 1, unit: repairForm.unit as any,
      technicalSpecification: repairForm.technicalSpecification, expectedMaterials: repairForm.expectedMaterials,
      specialistRequired: repairForm.specialistRequired, clientApprovalStatus: 'PENDIENTE', createdAt: new Date().toISOString(),
    };
    setProposedRepairs(prev => [...prev, item]);
    setRepairForm({ ...repairForm, elementLocation: '', problem: '', repairDescription: '', technicalSpecification: '', expectedMaterials: '' });
  };

  const finalize = async () => {
    if (!initialVisit?.id) return setError('La visita no tiene identificador.');
    setFinalizing(true); setError(null);
    try {
      const now = new Date();
      const nowIso = now.toISOString();
      const inspection: PropertyInspection = {
        id: generateNextInspectionId(), caseId: initialVisit.caseId, visitId: initialVisit.id,
        date: nowIso.slice(0,10), time: now.toTimeString().slice(0,5),
        inspectorName: profile?.full_name || initialVisit.responsibleProfessional || user?.email || 'Profesional SIPRE',
        professionalLicense: profile?.professional_license || '', organization: profile?.organization || 'SIPRE Operaciones',
        address: propertyData.address, neighborhood: propertyData.neighborhood, municipality: propertyData.municipality, department: propertyData.department,
        propertyType: propertyData.propertyType, apartmentUnit: propertyData.apartmentUnit, towerBlock: propertyData.towerBlock, floorLevel: propertyData.floorLevel,
        buildingFloorsCount: Number(propertyData.buildingFloorsCount) || undefined, approxAreaM2: Number(propertyData.approxAreaM2) || undefined,
        approxConstructionYear: Number(propertyData.approxConstructionYear) || undefined, approxOccupants: Number(propertyData.approxOccupants) || undefined,
        gps: { latitude: Number(propertyData.gpsLat) || 0, longitude: Number(propertyData.gpsLng) || 0, timestamp: nowIso },
        ownerName: clientData.ownerName, occupantName: clientData.occupantName, ownerPhone: clientData.phone, ownerEmail: clientData.email,
        contactPerson: clientData.contactPerson, relationshipWithProperty: clientData.relationshipWithProperty, whoAttendsVisit: clientData.whoAttendsVisit,
        clientOrganization: clientData.clientOrganization, identificationNumber: clientData.identificationNumber,
        buildingUse: (propertyData.currentUse || 'Otro') as any, floors: Number(propertyData.buildingFloorsCount) || 0, basements: 0,
        documentation: docs, structuralSystem: characterization.structuralSystem, predominantMaterial: characterization.predominantMaterial,
        foundationType: characterization.foundationType, floorSystem: characterization.floorSystem, roofType: characterization.roofType,
        masonryType: characterization.masonryType, previousStructuralModifications: characterization.previousModifications,
        previousRepairs: characterization.previousRepairs, previousDamage: characterization.knownPreviousDamage,
        generalCondition: characterization.generalCondition, walkthroughZones, elements: [], findings: findingsList, photos: [], videos: [], voiceNotes: [], evidenceMedia: evidenceList,
        walkthroughSummary: conclusions.walkthroughSummary, mainFindingsSummary: conclusions.mainFindingsSummary,
        generalPropertyCondition: conclusions.generalPropertyCondition, structuralObservations: conclusions.structuralObservations,
        masonryObservations: conclusions.masonryObservations, nonstructuralObservations: conclusions.nonstructuralObservations,
        groundObservations: conclusions.groundObservations, potentialCauses: conclusions.potentialCauses,
        additionalStudiesRequired: conclusions.additionalStudiesRequired, immediateRecommendations: conclusions.immediateRecommendations,
        accessRestrictionsNote: conclusions.accessRestrictionsNote, temporaryMeasuresNote: conclusions.temporaryMeasuresNote,
        repairDecision, repairFollowUpRequired: followUpRequired, repairFollowUpDate: followUpDate, proposedRepairs,
        preliminaryPriority: 'YELLOW', isPreliminaryPriorityConfirmed: false,
        professionalAssessment: {
          conclusion: conclusions.professionalConclusion, immediateRecommendations: conclusions.immediateRecommendations,
          accessRestrictions: conclusions.accessRestrictionsNote as any, temporaryStabilization: conclusions.temporaryMeasuresNote,
          additionalStudiesRequired: conclusions.additionalStudiesRequired, structuralEvaluationRequired: false,
          monitoringRequired: followUpRequired, repairRequired: ['REQUIERE REPARACIÓN','REQUIERE INTERVENCIÓN'].includes(repairDecision),
          evacuationRecommendation: 'No Requerida', additionalComments: clientData.clientObservations,
          finalPriorityConfirmed: 'YELLOW', confirmedByProfessional: false,
          inspectorName: profile?.full_name || initialVisit.responsibleProfessional || '', professionalLicense: profile?.professional_license || '',
          organization: profile?.organization || 'SIPRE Operaciones', date: nowIso.slice(0,10),
        },
        status: 'Completada', createdAt: nowIso, updatedAt: nowIso,
      };

      saveInspection(inspection);
      await saveInspectionSnapshotRemote(inspection, user?.id, profile?.full_name || user?.email || 'Profesional SIPRE');
      await saveVisitAssessmentInDb({
        visit_id: initialVisit.id, case_id: initialVisit.caseId, inspection_id: inspection.id,
        walkthrough_summary: conclusions.walkthroughSummary, main_findings_summary: conclusions.mainFindingsSummary,
        general_condition: conclusions.generalPropertyCondition, structural_obs: conclusions.structuralObservations,
        masonry_obs: conclusions.masonryObservations, non_structural_obs: conclusions.nonstructuralObservations,
        soil_obs: conclusions.groundObservations, possible_causes: conclusions.potentialCauses,
        additional_studies: conclusions.additionalStudiesRequired, recommendations: conclusions.immediateRecommendations,
        temporary_measures: conclusions.temporaryMeasuresNote, professional_conclusion: conclusions.professionalConclusion,
      });
      await saveFieldDraftRemote({ visitId: initialVisit.id, caseId: initialVisit.caseId, currentStep: 10, status: 'COMPLETADA', snapshot, userId: user?.id });
      setNotice('Inspección completa guardada en Supabase. El informe ya puede abrirse desde otro dispositivo.');
      window.setTimeout(onFinalizeToTechnicalReview, 700);
    } catch (e: any) {
      setError(e?.message || 'No se pudo finalizar la inspección remotamente.');
    } finally { setFinalizing(false); }
  };

  if (!draftReady) return <div className="max-w-4xl mx-auto p-10 text-center text-slate-500"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Cargando borrador remoto...</div>;

  const docOptions: DocStatusOption[] = ['Sí','No','Parcial','No disponible','No se conoce','No aplica'];

  return <div id="sipre-field-mode-screen" className="max-w-5xl mx-auto px-3 sm:px-6 py-5 space-y-4">
    <input ref={photoCaptureRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={fileChange('photo')} />
    <input ref={photoUploadRef} type="file" accept="image/*" className="hidden" onChange={fileChange('photo')} />
    <input ref={videoRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={fileChange('video')} />
    <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={fileChange('voice')} />
    <input ref={documentRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*" className="hidden" onChange={fileChange('document')} />

    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
      <div className="flex items-center gap-3"><button onClick={onBackToDashboard} className="p-2 rounded-xl bg-slate-100 text-slate-600"><ArrowLeft className="w-4 h-4" /></button><div><div className="text-[10px] font-mono font-bold text-teal-700 uppercase">Modo Campo · Paso {currentStep}/10</div><h1 className="text-xl font-black text-slate-900">{steps[currentStep - 1]}</h1><p className="text-xs text-slate-500">{initialVisit?.clientName} · {initialVisit?.address}</p></div></div>
      <button onClick={() => persistDraft(currentStep, true)} disabled={savingDraft} className="px-3 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5">{savingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Guardar borrador</button>
    </div>

    {notice && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs font-bold">{notice}</div>}
    {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs">{error}</div>}

    <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm overflow-x-auto"><div className="flex gap-1 min-w-[700px]">{steps.map((label, idx) => <button key={label} onClick={() => goStep(idx + 1)} className={`flex-1 rounded-xl py-2 text-[10px] font-bold ${currentStep === idx + 1 ? 'bg-teal-700 text-white' : idx + 1 < currentStep ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{idx + 1 < currentStep ? <Check className="w-3 h-3 inline mr-1" /> : null}{idx + 1}. {label}</button>)}</div></div>

    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-sm space-y-5">
      {currentStep === 1 && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><label className={labelClass}>Dirección *</label><input value={propertyData.address} onChange={e => setPropertyData({...propertyData,address:e.target.value})} className={inputClass} /></div>
        <div><label className={labelClass}>Barrio / sector</label><input value={propertyData.neighborhood} onChange={e => setPropertyData({...propertyData,neighborhood:e.target.value})} className={inputClass} /></div>
        <div><label className={labelClass}>Municipio</label><input value={propertyData.municipality} onChange={e => setPropertyData({...propertyData,municipality:e.target.value})} className={inputClass} /></div>
        <div><label className={labelClass}>Departamento</label><input value={propertyData.department} onChange={e => setPropertyData({...propertyData,department:e.target.value})} className={inputClass} /></div>
        <div><label className={labelClass}>Tipo de inmueble</label><select value={propertyData.propertyType} onChange={e => setPropertyData({...propertyData,propertyType:e.target.value as PropertyType})} className={inputClass}>{['Casa','Apartamento','Edificio','Local comercial','Bodega','Institucional','Industrial','Otro'].map(v=><option key={v}>{v}</option>)}</select></div>
        <div><label className={labelClass}>Apto / unidad</label><input value={propertyData.apartmentUnit} onChange={e => setPropertyData({...propertyData,apartmentUnit:e.target.value})} className={inputClass} /></div>
        <div><label className={labelClass}>Torre / bloque</label><input value={propertyData.towerBlock} onChange={e => setPropertyData({...propertyData,towerBlock:e.target.value})} className={inputClass} /></div>
        <div><label className={labelClass}>Piso / nivel</label><input value={propertyData.floorLevel} onChange={e => setPropertyData({...propertyData,floorLevel:e.target.value})} className={inputClass} /></div>
        <div><label className={labelClass}>Número de pisos</label><input type="number" value={propertyData.buildingFloorsCount} onChange={e => setPropertyData({...propertyData,buildingFloorsCount:e.target.value})} className={inputClass} /></div>
        <div><label className={labelClass}>Área aproximada m²</label><input value={propertyData.approxAreaM2} onChange={e => setPropertyData({...propertyData,approxAreaM2:e.target.value})} className={inputClass} /></div>
        <div><label className={labelClass}>Uso actual</label><input value={propertyData.currentUse} onChange={e => setPropertyData({...propertyData,currentUse:e.target.value})} className={inputClass} /></div>
        <div><label className={labelClass}>Año construcción aprox.</label><input value={propertyData.approxConstructionYear} onChange={e => setPropertyData({...propertyData,approxConstructionYear:e.target.value})} className={inputClass} /></div>
        <div><label className={labelClass}>Ocupantes aprox.</label><input value={propertyData.approxOccupants} onChange={e => setPropertyData({...propertyData,approxOccupants:e.target.value})} className={inputClass} /></div>
        <div><label className={labelClass}>GPS latitud</label><input value={propertyData.gpsLat} onChange={e => setPropertyData({...propertyData,gpsLat:e.target.value})} className={inputClass} /></div>
        <div><label className={labelClass}>GPS longitud</label><input value={propertyData.gpsLng} onChange={e => setPropertyData({...propertyData,gpsLng:e.target.value})} className={inputClass} /></div>
      </div>}

      {currentStep === 2 && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {([['ownerName','Propietario *'],['occupantName','Ocupante'],['clientOrganization','Organización / copropiedad'],['identificationNumber','Cédula / NIT'],['phone','Teléfono'],['email','Correo'],['contactPerson','Persona de contacto'],['relationshipWithProperty','Relación con inmueble'],['whoAttendsVisit','Quién atiende la visita']] as const).map(([key,label])=><div key={key}><label className={labelClass}>{label}</label><input value={clientData[key]} onChange={e=>setClientData({...clientData,[key]:e.target.value})} className={inputClass} /></div>)}
        <div className="sm:col-span-2"><label className={labelClass}>Observaciones iniciales del cliente</label><textarea rows={4} value={clientData.clientObservations} onChange={e=>setClientData({...clientData,clientObservations:e.target.value})} className={inputClass} /></div>
      </div>}

      {currentStep === 3 && <div className="space-y-3">{([
        ['blueprints','Planos arquitectónicos'],['structuralDesign','Planos estructurales'],['soilStudy','Estudio de suelos'],['calculationMemories','Memorias de cálculo'],['buildingPermit','Licencia de construcción'],['previousTechnicalReports','Informes técnicos previos'],['preEventPhotos','Fotografías previas']
      ] as const).map(([key,label])=><div key={key} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center"><span className="text-xs font-bold text-slate-700">{label}</span><select value={(docs as any)[key]} onChange={e=>setDocs({...docs,[key]:e.target.value as DocStatusOption})} className={inputClass}>{docOptions.map(o=><option key={o}>{o}</option>)}</select></div>)}<div><label className={labelClass}>Notas de documentación</label><textarea rows={4} value={docs.notes || ''} onChange={e=>setDocs({...docs,notes:e.target.value})} className={inputClass} /></div></div>}

      {currentStep === 4 && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className={labelClass}>Sistema estructural</label><select value={characterization.structuralSystem} onChange={e=>setCharacterization({...characterization,structuralSystem:e.target.value as StructuralSystem})} className={inputClass}>{['Pórticos de Concreto Reforzado','Mampostería Confinada','Mampostería Estructural','Mampostería No Reforzada','Sistema Dual (Pórticos y Muros)','Estructura Metálica','Estructura de Madera','Estructura Prefabricada','Sistema Mixto','Desconocido','Otro'].map(v=><option key={v}>{v}</option>)}</select></div>
        {([['predominantMaterial','Material predominante'],['foundationType','Cimentación'],['floorSystem','Sistema de entrepiso'],['roofType','Cubierta'],['masonryType','Mampostería'],['previousModifications','Modificaciones previas'],['previousRepairs','Reparaciones previas'],['knownPreviousDamage','Daños previos conocidos'],['generalCondition','Condición general']] as const).map(([key,label])=><div key={key} className={['previousModifications','previousRepairs','knownPreviousDamage','generalCondition'].includes(key) ? 'sm:col-span-2' : ''}><label className={labelClass}>{label}</label>{['previousModifications','previousRepairs','knownPreviousDamage','generalCondition'].includes(key)?<textarea rows={3} value={characterization[key]} onChange={e=>setCharacterization({...characterization,[key]:e.target.value})} className={inputClass}/>:<input value={characterization[key]} onChange={e=>setCharacterization({...characterization,[key]:e.target.value})} className={inputClass}/>}</div>)}
      </div>}

      {currentStep === 5 && <div className="space-y-4"><div className="flex flex-wrap gap-2">{walkthroughZones.map(z=><button key={z.id} onClick={()=>setSelectedZoneId(z.id)} className={`px-3 py-2 rounded-lg text-xs font-bold border ${selectedZoneId===z.id?'bg-teal-700 text-white border-teal-700':'bg-slate-50 text-slate-700 border-slate-200'}`}>{z.name}</button>)}</div><div className="flex gap-2"><input value={customZoneName} onChange={e=>setCustomZoneName(e.target.value)} placeholder="Agregar otra zona" className={inputClass}/><button onClick={addZone} className="px-3 py-2 rounded-xl bg-slate-900 text-white"><PlusCircle className="w-4 h-4"/></button></div>{selectedZone&&<div className="grid gap-3"><div><label className={labelClass}>Descripción de {selectedZone.name}</label><textarea rows={4} value={selectedZone.description} onChange={e=>updateZone('description',e.target.value)} className={inputClass}/></div><div><label className={labelClass}>Notas técnicas</label><textarea rows={4} value={selectedZone.technicalNotes} onChange={e=>updateZone('technicalNotes',e.target.value)} className={inputClass}/></div></div>}</div>}

      {currentStep === 6 && <div className="space-y-4"><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{walkthroughZones.length>0&&<div><label className={labelClass}>Zona</label><select value={findingForm.zone} onChange={e=>setFindingForm({...findingForm,zone:e.target.value})} className={inputClass}>{walkthroughZones.map(z=><option key={z.id}>{z.name}</option>)}</select></div>}<div><label className={labelClass}>Piso / nivel</label><input value={findingForm.floor} onChange={e=>setFindingForm({...findingForm,floor:e.target.value})} className={inputClass}/></div><div><label className={labelClass}>Elemento</label><input value={findingForm.elementType} onChange={e=>setFindingForm({...findingForm,elementType:e.target.value})} className={inputClass}/></div><div><label className={labelClass}>Identificación del elemento</label><input value={findingForm.elementLabel} onChange={e=>setFindingForm({...findingForm,elementLabel:e.target.value})} className={inputClass}/></div><div><label className={labelClass}>Material</label><input value={findingForm.material} onChange={e=>setFindingForm({...findingForm,material:e.target.value})} className={inputClass}/></div><div><label className={labelClass}>Tipo de daño</label><input value={findingForm.damageType} onChange={e=>setFindingForm({...findingForm,damageType:e.target.value})} className={inputClass}/></div><div><label className={labelClass}>Severidad</label><select value={findingForm.severity} onChange={e=>setFindingForm({...findingForm,severity:e.target.value as DamageSeverity})} className={inputClass}>{['Baja','Moderada','Severa','Crítica'].map(v=><option key={v}>{v}</option>)}</select></div><div><label className={labelClass}>Reparación potencial</label><select value={findingForm.repairPotentiallyRequired} onChange={e=>setFindingForm({...findingForm,repairPotentiallyRequired:e.target.value as any})} className={inputClass}>{['POR DETERMINAR','SÍ','NO'].map(v=><option key={v}>{v}</option>)}</select></div><div className="sm:col-span-2"><label className={labelClass}>Descripción</label><textarea rows={3} value={findingForm.description} onChange={e=>setFindingForm({...findingForm,description:e.target.value})} className={inputClass}/></div><div className="sm:col-span-2"><label className={labelClass}>Posible causa</label><textarea rows={2} value={findingForm.possibleCause} onChange={e=>setFindingForm({...findingForm,possibleCause:e.target.value})} className={inputClass}/></div><div className="sm:col-span-2"><label className={labelClass}>Observación profesional</label><textarea rows={2} value={findingForm.professionalObservation} onChange={e=>setFindingForm({...findingForm,professionalObservation:e.target.value})} className={inputClass}/></div><div className="sm:col-span-2"><label className={labelClass}>Verificación adicional</label><textarea rows={2} value={findingForm.additionalVerificationRequired} onChange={e=>setFindingForm({...findingForm,additionalVerificationRequired:e.target.value})} className={inputClass}/></div></div><button onClick={addFinding} className="px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold">Agregar hallazgo</button>{findingsList.map((f,i)=><div key={f.id} className="border border-slate-200 rounded-xl p-3 text-xs flex justify-between gap-3"><div><div className="font-black">{i+1}. {f.elementLabel}</div><div className="text-slate-500">{f.zone} · {f.damageType} · {f.severity}</div><div className="mt-1">{f.description}</div></div><button onClick={()=>setFindingsList(prev=>prev.filter(x=>x.id!==f.id))} className="text-red-600"><Trash2 className="w-4 h-4"/></button></div>)}</div>}

      {currentStep === 7 && <div className="space-y-4"><div><label className={labelClass}>Categoría</label><select value={activeEvidenceCategory} onChange={e=>setActiveEvidenceCategory(e.target.value as EvidenceCategory)} className={inputClass}>{['GENERAL VISIT','FINDINGS','BEFORE REPAIR','DURING REPAIR','AFTER REPAIR','MATERIALS','MATERIAL DELIVERY','FINAL HANDOVER'].map(v=><option key={v}>{v}</option>)}</select></div><div className="grid grid-cols-2 sm:grid-cols-5 gap-2">{[[Camera,'Tomar foto',()=>photoCaptureRef.current?.click()],[Upload,'Subir foto',()=>photoUploadRef.current?.click()],[Video,'Video',()=>videoRef.current?.click()],[Mic,'Audio',()=>audioRef.current?.click()],[FileText,'Documento',()=>documentRef.current?.click()]].map(([Icon,label,action]:any)=><button key={label} onClick={action} disabled={mediaUploading} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 flex flex-col items-center gap-1"><Icon className="w-5 h-5 text-teal-700"/>{label}</button>)}</div>{mediaUploading&&<div className="text-xs text-teal-700 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/>Subiendo evidencia...</div>}<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{evidenceList.map(ev=><div key={ev.id} className="border border-slate-200 rounded-xl p-3 text-xs">{ev.mediaType==='photo'&&<img src={ev.url} alt={ev.filename} className="w-full max-h-56 object-contain rounded bg-slate-50"/>}<div className="font-bold mt-2">{ev.filename || ev.mediaType}</div><div className="text-slate-500">{ev.category} · {ev.date} {ev.time}</div><div>{ev.description}</div></div>)}</div></div>}

      {currentStep === 8 && <div className="grid grid-cols-1 gap-4">{([['walkthroughSummary','Resumen del recorrido'],['mainFindingsSummary','Resumen de hallazgos'],['generalPropertyCondition','Condición general del inmueble'],['structuralObservations','Observaciones estructurales'],['masonryObservations','Observaciones de mampostería'],['nonstructuralObservations','Observaciones no estructurales'],['groundObservations','Terreno / suelo'],['potentialCauses','Causas potenciales'],['additionalStudiesRequired','Estudios adicionales'],['immediateRecommendations','Recomendaciones inmediatas'],['accessRestrictionsNote','Restricciones de acceso'],['temporaryMeasuresNote','Medidas temporales'],['professionalConclusion','Conclusión profesional']] as const).map(([key,label])=><div key={key}><label className={labelClass}>{label}</label><textarea rows={3} value={conclusions[key]} onChange={e=>setConclusions({...conclusions,[key]:e.target.value})} className={inputClass}/></div>)}</div>}

      {currentStep === 9 && <div className="space-y-4"><div><label className={labelClass}>Decisión técnica preliminar</label><select value={repairDecision} onChange={e=>setRepairDecision(e.target.value as RepairDecisionOption)} className={inputClass}>{['NO REQUIERE INTERVENCIÓN','REQUIERE INTERVENCIÓN','REQUIERE REPARACIÓN','REQUIERE EVALUACIÓN ADICIONAL','REQUIERE ENSAYOS','REQUIERE MONITOREO','INFORMACIÓN INSUFICIENTE'].map(v=><option key={v}>{v}</option>)}</select></div><label className="flex items-center gap-2 text-xs font-bold text-slate-700"><input type="checkbox" checked={followUpRequired} onChange={e=>setFollowUpRequired(e.target.checked)}/>Requiere seguimiento</label>{followUpRequired&&<input type="date" value={followUpDate} onChange={e=>setFollowUpDate(e.target.value)} className={inputClass}/>}<div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label className={labelClass}>Elemento / ubicación</label><input value={repairForm.elementLocation} onChange={e=>setRepairForm({...repairForm,elementLocation:e.target.value})} className={inputClass}/></div><div><label className={labelClass}>Problema</label><input value={repairForm.problem} onChange={e=>setRepairForm({...repairForm,problem:e.target.value})} className={inputClass}/></div><div className="sm:col-span-2"><label className={labelClass}>Intervención propuesta</label><textarea rows={3} value={repairForm.repairDescription} onChange={e=>setRepairForm({...repairForm,repairDescription:e.target.value})} className={inputClass}/></div><div><label className={labelClass}>Cantidad estimada</label><input type="number" value={repairForm.estimatedQuantity} onChange={e=>setRepairForm({...repairForm,estimatedQuantity:Number(e.target.value)})} className={inputClass}/></div><div><label className={labelClass}>Unidad</label><input value={repairForm.unit} onChange={e=>setRepairForm({...repairForm,unit:e.target.value})} className={inputClass}/></div><div className="sm:col-span-2"><label className={labelClass}>Especificación técnica</label><textarea rows={2} value={repairForm.technicalSpecification} onChange={e=>setRepairForm({...repairForm,technicalSpecification:e.target.value})} className={inputClass}/></div><div className="sm:col-span-2"><label className={labelClass}>Materiales esperados</label><textarea rows={2} value={repairForm.expectedMaterials} onChange={e=>setRepairForm({...repairForm,expectedMaterials:e.target.value})} className={inputClass}/></div></div><button onClick={addRepair} className="px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold">Agregar intervención</button>{proposedRepairs.map((r,i)=><div key={r.id} className="border border-slate-200 rounded-xl p-3 text-xs"><div className="font-black">{i+1}. {r.elementLocation}</div><div>{r.repairDescription}</div><div className="text-slate-500">{r.estimatedQuantity} {r.unit} · {r.priority}</div></div>)}</div>}

      {currentStep === 10 && <div className="space-y-4"><div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-sm text-teal-900"><div className="font-black">Revisión final</div><p className="mt-1">Al finalizar se guarda el registro completo en Supabase y queda disponible en INFORMES desde cualquier dispositivo autorizado. Las fotografías se integran desde el almacenamiento remoto.</p></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs"><div className="bg-slate-50 rounded-xl p-3"><div className="text-slate-500">Zonas</div><div className="text-xl font-black">{walkthroughZones.length}</div></div><div className="bg-slate-50 rounded-xl p-3"><div className="text-slate-500">Hallazgos</div><div className="text-xl font-black">{findingsList.length}</div></div><div className="bg-slate-50 rounded-xl p-3"><div className="text-slate-500">Evidencias</div><div className="text-xl font-black">{evidenceList.length}</div></div><div className="bg-slate-50 rounded-xl p-3"><div className="text-slate-500">Intervenciones</div><div className="text-xl font-black">{proposedRepairs.length}</div></div></div><button onClick={finalize} disabled={finalizing} className="w-full px-5 py-3 rounded-xl bg-emerald-700 text-white text-sm font-black flex items-center justify-center gap-2">{finalizing?<Loader2 className="w-5 h-5 animate-spin"/>:<CheckCircle2 className="w-5 h-5"/>}FINALIZAR Y GENERAR INFORME</button></div>}
    </div>

    <div className="flex justify-between gap-3"><button onClick={()=>goStep(currentStep-1)} disabled={currentStep===1} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold disabled:opacity-40 flex items-center gap-1"><ChevronLeft className="w-4 h-4"/>Anterior</button>{currentStep<10&&<button onClick={()=>goStep(currentStep+1)} className="px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold flex items-center gap-1">Guardar y continuar<ChevronRight className="w-4 h-4"/></button>}</div>
  </div>;
};
