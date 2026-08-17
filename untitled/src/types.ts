export type UserRole =
  | 'Administrator'
  | 'Coordinator'
  | 'Inspector'
  | 'StructuralSpecialist'
  | 'Viewer';

export type PriorityLevel = 'GREEN' | 'YELLOW' | 'RED';

export type CasePriority = 'Baja' | 'Normal' | 'Alta' | 'Urgente';

export type CaseStatus =
  | 'NEW_CASE'
  | 'VISIT_PENDING'
  | 'VISIT_SCHEDULED'
  | 'VISIT_CONFIRMED'
  | 'VISIT_IN_PROGRESS'
  | 'VISIT_COMPLETED'
  | 'TECHNICAL_REVIEW'
  | 'INTERVENTION_DECISION'
  | 'CLIENT_APPROVAL'
  | 'MATERIALS'
  | 'INTERVENTION'
  | 'HANDOVER'
  | 'BILLING'
  | 'CLOSED';

export type CaseType =
  | 'Inspección'
  | 'Post-sismo'
  | 'Patología'
  | 'Evaluación estructural'
  | 'Reparación'
  | 'Seguimiento'
  | 'Otro';

export type PropertyType =
  | 'Casa'
  | 'Edificio'
  | 'Local comercial'
  | 'Bodega'
  | 'Institucional'
  | 'Industrial'
  | 'Otro';

export type VisitStatus = 'Programada' | 'Confirmada' | 'En campo' | 'Terminada' | 'Cancelada';

export type DocStatusOption = 'Sí' | 'No' | 'Parciales' | 'Parcial' | 'No se conoce' | 'No disponible' | 'No aplica';

export interface CaseDocumentation {
  blueprints: 'Sí' | 'No' | 'Parciales' | 'No se conoce';
  structuralDesign: 'Sí' | 'No' | 'Parcial' | 'No se conoce';
  soilStudy: 'Sí' | 'No' | 'No disponible' | 'No aplica';
  calculationMemories: 'Sí' | 'No' | 'Parciales' | 'No se conoce';
  buildingPermit: 'Sí' | 'No' | 'No se conoce' | 'No aplica';
  attachedFiles?: string[];
  notes?: string;
}

export interface CaseRecord {
  id: string; // e.g. "EXP-2026-0001"
  code: string;
  requestDate: string;
  clientName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  municipality: string;
  department?: string;
  neighborhood: string;
  propertyType: PropertyType;
  caseType: CaseType;
  priority: CasePriority;
  requestDescription: string;
  responsibleCoordinator: string;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface VisitRecord {
  id: string; // e.g. "VIS-2026-0001"
  caseId?: string;
  caseCode?: string;
  date: string;
  startTime: string;
  estimatedEndTime: string;
  clientName: string;
  address: string;
  municipality: string;
  neighborhood: string;
  propertyType: PropertyType;
  responsibleProfessional: string;
  assignedTeam: string;
  visitReason: string;
  visitObjective: string;
  preparationObservations: string;
  priority: CasePriority;
  status: VisitStatus;
  createdAt: string;
  updatedAt: string;
}

export type TechnicalDecisionType =
  | 'NO REQUIERE INTERVENCIÓN'
  | 'REQUIERE INTERVENCIÓN'
  | 'REQUIERE EVALUACIÓN ADICIONAL'
  | 'REQUIERE ENSAYOS'
  | 'REQUIERE INFORMACIÓN ADICIONAL';

export interface TechnicalDecisionRecord {
  id: string;
  caseId: string;
  decision: TechnicalDecisionType;
  technicalJustification: string;
  proposedIntervention: string;
  temporaryMeasures: string;
  additionalStudies: string;
  responsibleProfessional: string;
  professionalLicense: string;
  date: string;
}

export type ClientApprovalStatus = 'Pendiente' | 'Aprobado' | 'Aprobado con observaciones' | 'No aprobado';

export interface ClientApprovalRecord {
  id: string;
  caseId: string;
  proposedIntervention: string;
  technicalSummary: string;
  status: ClientApprovalStatus;
  clientRepresentativeName: string;
  observations: string;
  date: string;
  signaturePlaceholder?: boolean;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  event: string;
  user: string;
  role: string;
  details?: string;
}

export type StructuralSystem =
  | 'Pórticos de Concreto Reforzado'
  | 'Mampostería Confinada'
  | 'Mampostería Estructural'
  | 'Mampostería No Reforzada'
  | 'Sistema Dual (Pórticos y Muros)'
  | 'Estructura Metálica'
  | 'Estructura de Madera'
  | 'Estructura Prefabricada'
  | 'Sistema Mixto'
  | 'Desconocido'
  | 'Otro';

export type StructuralSystemType = StructuralSystem;

export type BuildingElementType =
  | 'Columna'
  | 'Viga'
  | 'Muro Estructural'
  | 'Muro de Mampostería'
  | 'Losa / Entrepiso'
  | 'Piso'
  | 'Cimentación'
  | 'Escalera'
  | 'Cubierta / Techo'
  | 'Elemento de Acero'
  | 'Elemento de Madera'
  | 'Fachada'
  | 'Parapeto'
  | 'Cielorraso'
  | 'Ventana'
  | 'Puerta'
  | 'Instalación / Tubería / Tanque'
  | 'Terreno / Suelo'
  | 'Talud'
  | 'Otro';

export type ElementType = BuildingElementType;

export type DamageCategory = 'Estructural' | 'No Estructural' | 'Geotécnico / Suelo';

export type DamageSeverity = 'Baja' | 'Moderada' | 'Severa' | 'Crítica';
export type SeverityLevel = DamageSeverity;

export type CrackOrientation =
  | 'Horizontal'
  | 'Vertical'
  | 'Diagonal'
  | 'Escalonada'
  | 'Radial'
  | 'Longitudinal'
  | 'Transversal'
  | 'Irregular';

export type CrackWidthRange =
  | '<0.1 mm'
  | '0.1–0.3 mm'
  | '0.3–0.5 mm'
  | '0.5–1.0 mm'
  | '1–3 mm'
  | '>3 mm'
  | '< 0.1 mm'
  | '0.1 - 0.3 mm'
  | '0.3 - 0.5 mm'
  | '0.5 - 1.0 mm'
  | '1.0 - 3.0 mm'
  | '> 3.0 mm'
  | 'No medido';

export type CrackActivity = 'Activa' | 'Inactiva' | 'No determinado';
export type CrackDepth = 'Superficial' | 'Profunda' | 'Pasante / Atraviesa' | 'No determinado';

export type InspectionStatus =
  | 'Borrador'
  | 'En Progreso'
  | 'Completada'
  | 'Revisión por Especialista'
  | 'Aprobada';

export interface GPSCoordinate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  timestamp: string;
}

export interface PhotoAnnotation {
  type: 'arrow' | 'line' | 'circle' | 'rectangle' | 'freehand' | 'text' | 'measurement';
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  text?: string;
  measurementValue?: string; // e.g. "0.4 mm" or "1.2 m"
}

export interface PhotoMetadata {
  id: string;
  photoNumber: number; // For PHOTO 01, PHOTO 02...
  originalUrl: string;
  annotatedUrl?: string;
  annotations?: PhotoAnnotation[];
  elementId?: string;
  elementName?: string;
  findingId?: string;
  date: string;
  time: string;
  gps?: GPSCoordinate;
  inspector: string;
  description: string;
  inspectorObservation?: string;
  aiAnalysis?: AIPreliminaryAnalysis;
}

export interface AIPreliminaryAnalysis {
  observedCondition: string;
  possiblePathologyClassification: string;
  possibleCauses: string[];
  structuralRelevance: string;
  nonstructuralRelevance: string;
  additionalVerificationRequired: string[];
  recommendedMeasurements: string[];
  recommendedAdditionalPhotographs: string[];
  potentialWarningIndicators: string[];
  referenceCategories: string[];
  confidenceLevel: 'Alta' | 'Media' | 'Baja';
  recommendedPreliminaryPriority: PriorityLevel;
  disclaimer: string;
  analyzedAt: string;
}

export interface CrackData {
  widthMm?: number;
  widthRange: CrackWidthRange;
  approxLengthCm?: number;
  lengthCm?: number;
  orientation: CrackOrientation;
  locationDetails?: string;
  depth?: CrackDepth;
  depthMm?: number;
  crossesElement: boolean;
  activity: CrackActivity;
  dateDetected?: string;
}

export interface StructuralChecklist {
  // Columns
  diagonalCracking?: boolean;
  horizontalCracking?: boolean;
  concreteSpalling?: boolean;
  concreteCrushing?: boolean;
  exposedReinforcement?: boolean;
  buckledReinforcement?: boolean;
  permanentDeformation?: boolean;
  jointDamage?: boolean;
  displacement?: boolean;
  corrosion?: boolean;

  // Beams
  verticalCracking?: boolean;
  flexuralDamage?: boolean;
  shearIndicators?: boolean;
  lossOfSupport?: boolean;
  excessiveDeformation?: boolean;

  // Slabs
  slabCracking?: boolean;
  deflection?: boolean;
  punchingIndicators?: boolean;
  perimeterCracking?: boolean;

  // Structural Walls
  sliding?: boolean;
  separationFromSlab?: boolean;
  separationFromFoundation?: boolean;
  outOfPlaneDeformation?: boolean;

  // Masonry
  mortarJointCracking?: boolean;
  stairStepCracking?: boolean;
  wallColumnSeparation?: boolean;
  wallBeamSeparation?: boolean;
  unitFracture?: boolean;
  partialWallFailure?: boolean;
  wallLeaning?: boolean;
  damageAroundOpenings?: boolean;
  outOfPlaneMovement?: boolean;

  // Ground conditions
  groundCracks?: boolean;
  settlement?: boolean;
  subsidence?: boolean;
  landslide?: boolean;
  slopeInstability?: boolean;
  erosion?: boolean;
  liquefactionIndicators?: boolean;
  rockfall?: boolean;
  foundationExposure?: boolean;

  // Non-structural
  facadeDamage?: boolean;
  parapetDamage?: boolean;
  ceilingDamage?: boolean;
  glassDamage?: boolean;
  lightingDamage?: boolean;
  equipmentDamage?: boolean;
  tankDamage?: boolean;
  pipeDamage?: boolean;
  partitionsDamage?: boolean;
  railingsDamage?: boolean;
  architecturalFinishesDamage?: boolean;
}

export interface Finding {
  id: string;
  elementId: string;
  elementType: BuildingElementType | string;
  elementLabel: string;
  category?: DamageCategory;
  floor: string;
  location: string;
  description: string;
  damageType: string;
  severity: DamageSeverity;
  measurements?: string;
  crack?: CrackData;
  checklist?: StructuralChecklist;
  checklistTags?: string[];
  immediateHazard?: boolean;
  photoIds?: string[];
  inspectorObservations?: string;
  photos?: PhotoMetadata[];
  videos?: VideoMetadata[];
  voiceNotes?: VoiceNoteMetadata[];
  aiPreliminaryAnalysis?: AIPreliminaryAnalysis;
  professionalAssessment?: string;
  recommendedAction?: string;
  attachedReferences?: TechnicalReference[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BuildingElement {
  id: string;
  type: BuildingElementType | string;
  label: string; // e.g. "Columna C-04 Eje B-2"
  floor: string; // e.g. "Piso 1", "Sótano 1"
  location: string; // e.g. "Costado Norte / Fachada Principal"
  material?: string;
  structuralCategory?: 'Estructural' | 'No Estructural' | 'Geotécnico / Suelo';
  category?: DamageCategory;
  notes?: string;
  findingsCount: number;
}

export interface VoiceNoteMetadata {
  id: string;
  audioBlobUrl?: string;
  audioBase64?: string;
  durationSeconds: number;
  recordedAt: string;
  rawTranscription?: string;
  structuredNote?: string;
  technicalClassification?: string;
  inspectorEditedNote?: string;
  isTranscribed: boolean;
}

export interface VideoMetadata {
  id: string;
  url: string;
  filename: string;
  sizeBytes: number;
  durationSeconds?: number;
  description: string;
  uploadedAt: string;
  supabaseStoragePath?: string;
}

export interface ProfessionalAssessment {
  conclusion: string;
  immediateRecommendations: string;
  accessRestrictions: 'Ninguna' | 'Acceso Restringido Parcial' | 'Prohibido el Ingreso';
  temporaryStabilization: string;
  additionalStudiesRequired: string;
  structuralEvaluationRequired: boolean;
  monitoringRequired: boolean;
  repairRequired: boolean;
  evacuationRecommendation: 'No Requerida' | 'Evacuación Preventiva Parcial' | 'Evacuación Total Inmediata';
  additionalComments: string;
  finalPriorityConfirmed: PriorityLevel;
  confirmedByProfessional: boolean;
  inspectorName: string;
  professionalLicense: string;
  organization: string;
  date: string;
  digitalSignatureDataUrl?: string;
}

export interface TechnicalReference {
  id: string;
  title: string;
  organization: string;
  standard: string;
  section: string;
  year: string;
  url?: string;
  relevantExcerpt: string;
  inspectorNote?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  userRole: UserRole;
  action: string;
  inspectionId: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
}

export interface PropertyInspection {
  id: string; // e.g. "SIPRE-2026-0042"
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  inspectorName: string;
  professionalLicense: string;
  organization: string;
  contactPhone?: string;

  // Property Details
  address: string;
  neighborhood: string;
  municipality: string;
  department: string;
  gps: GPSCoordinate;
  ownerOrOccupant?: string;
  ownerPhone?: string;
  buildingUse: 'Residencial' | 'Comercial' | 'Institucional / Hospital' | 'Educativo' | 'Industrial' | 'Mixto' | 'Otro';
  approxConstructionYear?: number;
  constructionYear?: number;
  floors: number;
  basements: number;
  approxAreaM2?: number;
  approximateAreaM2?: number;
  currentOccupancy?: 'Ocupada' | 'Desocupada' | 'Parcialmente Ocupada';
  occupancyStatus?: 'Ocupada' | 'Desocupada' | 'Parcialmente Ocupada';
  approxOccupants?: number;

  // Structural Characteristics
  structuralSystem: StructuralSystem;
  primaryConstructionMaterial?: string;
  foundationType?: string;
  previousStructuralModifications?: string;
  previousDamage?: string;
  generalObservations?: string;

  // Elements & Findings
  elements: BuildingElement[];
  findings: Finding[];
  photos: PhotoMetadata[];
  videos: VideoMetadata[];
  voiceNotes: VoiceNoteMetadata[];

  // Priority & Assessment
  preliminaryPriority: PriorityLevel;
  isPreliminaryPriorityConfirmed: boolean;
  professionalAssessment: ProfessionalAssessment;

  // Management & Status
  status: InspectionStatus;
  attachedReferences?: TechnicalReference[];
  auditTrail?: AuditLogEntry[];
  syncStatus?: 'synced' | 'pending' | 'conflict';
  createdAt: string;
  updatedAt: string;
}

export interface SyncQueueItem {
  id: string;
  inspectionId: string;
  action: 'create' | 'update' | 'delete' | 'upload_media';
  payload: any;
  timestamp: string;
  retryCount: number;
}
