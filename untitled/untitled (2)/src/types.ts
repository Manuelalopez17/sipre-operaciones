export type UserRole =
  | 'Administrator'
  | 'Coordinator'
  | 'Inspector'
  | 'StructuralSpecialist'
  | 'Viewer'
  | 'administrator'
  | 'coordinator'
  | 'inspector'
  | 'structural_specialist'
  | 'field_supervisor'
  | 'warehouse'
  | 'driver'
  | 'administrative';

export type SupabaseUserRole =
  | 'administrator'
  | 'coordinator'
  | 'inspector'
  | 'structural_specialist'
  | 'field_supervisor'
  | 'warehouse'
  | 'driver'
  | 'administrative';

export interface UserProfile {
  id: string;
  full_name: string;
  role: SupabaseUserRole | string;
  professional_license?: string;
  organization?: string;
  email?: string;
  phone?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EmergencyRecord {
  id: string;
  name: string;
  event_type: string;
  date: string;
  department: string;
  municipality: string;
  description: string;
  is_active: boolean;
  created_by?: string;
  created_at?: string;
}

export interface PropertyRecord {
  id: string;
  address: string;
  neighborhood?: string;
  municipality: string;
  department: string;
  property_type?: PropertyType | string;
  building_use?: string;
  floors?: number;
  basements?: number;
  approx_area_m2?: number;
  structural_system?: string;
  gps?: any;
  created_at?: string;
  updated_at?: string;
}

export interface VisitAssignmentRecord {
  id: string;
  visit_id: string;
  user_id: string;
  professional_name: string;
  role_in_visit?: string;
  assignment_status?: 'assigned' | 'accepted' | 'rejected' | string;
  responded_at?: string;
  created_at?: string;
}

export interface FindingRecord {
  id: string;
  case_id: string;
  visit_id?: string;
  inspection_id?: string;
  finding_number?: number;
  zone?: string;
  floor?: string;
  element?: string;
  category?: string;
  material?: string;
  description?: string;
  damage_type?: string;
  crack_data?: any;
  severity?: DamageSeverity | string;
  possible_cause?: string;
  professional_observation?: string;
  additional_verification?: string;
  repair_required?: boolean;
  photo_url?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EvidenceFileRecord {
  id: string;
  case_id?: string;
  visit_id?: string;
  inspection_id?: string;
  finding_id?: string;
  work_front_id?: string;
  category?: EvidenceCategory | string;
  storage_path: string;
  filename: string;
  file_type?: string;
  file_size?: number;
  description?: string;
  uploaded_by?: string;
  created_at?: string;
}

export interface ActivityLogEntry {
  id: string;
  user_id?: string;
  user_name: string;
  user_role: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  case_id?: string;
  visit_id?: string;
  work_front_id?: string;
  details?: any;
  created_at: string;
}

export interface VisitAssessmentRecord {
  id?: string;
  visit_id: string;
  case_id?: string;
  inspection_id?: string;
  walkthrough_summary?: string;
  main_findings_summary?: string;
  general_condition?: string;
  structural_obs?: string;
  masonry_obs?: string;
  non_structural_obs?: string;
  soil_obs?: string;
  possible_causes?: string;
  additional_studies?: string;
  recommendations?: string;
  temporary_measures?: string;
  professional_conclusion?: string;
  created_at?: string;
  updated_at?: string;
}

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
  | 'Apartamento'
  | 'Edificio'
  | 'Local comercial'
  | 'Bodega'
  | 'Institucional'
  | 'Industrial'
  | 'Otro';

export type VisitStatus =
  | 'PROGRAMADA'
  | 'CONFIRMADA'
  | 'EN RUTA'
  | 'EN SITIO'
  | 'EN INSPECCIÓN'
  | 'TERMINADA'
  | 'CANCELADA'
  | 'REPROGRAMADA'
  | 'Programada'
  | 'Confirmada'
  | 'En campo'
  | 'Terminada'
  | 'Cancelada';

export type DocStatusOption = 'Sí' | 'No' | 'Parcial' | 'Parciales' | 'No se conoce' | 'No disponible' | 'No aplica';

export interface CaseDocumentation {
  blueprints: DocStatusOption;
  structuralDesign: DocStatusOption;
  soilStudy: DocStatusOption;
  calculationMemories: DocStatusOption;
  buildingPermit: DocStatusOption;
  previousTechnicalReports?: DocStatusOption;
  preEventPhotos?: DocStatusOption;
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
  department?: string;
  propertyType: PropertyType;
  responsibleProfessional: string;
  assignedTeam: string;
  visitReason: string;
  visitObjective: string;
  preparationObservations: string;
  priority: CasePriority;
  status: VisitStatus;
  enRouteAt?: string;
  onSiteAt?: string;
  inspectionStartedAt?: string;
  completedAt?: string;
  gpsLocation?: GPSCoordinate;
  createdAt: string;
  updatedAt: string;
}

export type TechnicalDecisionType = RepairDecisionOption | 'REQUIERE INFORMACIÓN ADICIONAL';

export type BillingPaymentStatus = PaymentStatus;

export type DeliveryStatus =
  | MaterialDeliveryStatus
  | 'PROGRAMADA'
  | 'Programada'
  | 'En ruta'
  | 'Entregada'
  | 'Entregado'
  | 'Rechazada'
  | 'Rechazado';

export interface WorkFrontLogEntry {
  id: string;
  workFrontId: string;
  date: string;
  time?: string;
  authorName?: string;
  authorRole?: string;
  title?: string;
  description: string;
  workProgressPercentage?: number;
  weatherCondition?: string;
  photos?: string[];
  createdAt: string;
}

export type RepairDecisionOption =
  | 'NO REQUIERE REPARACIÓN'
  | 'REQUIERE REPARACIÓN'
  | 'REQUIERE EVALUACIÓN ADICIONAL'
  | 'REQUIERE ENSAYOS'
  | 'REQUIERE MONITOREO'
  | 'INFORMACIÓN INSUFICIENTE'
  | 'NO REQUIERE INTERVENCIÓN'
  | 'REQUIERE INTERVENCIÓN';

export interface TechnicalDecisionRecord {
  id: string;
  caseId: string;
  visitId?: string;
  decision: RepairDecisionOption;
  technicalJustification: string;
  proposedIntervention?: string;
  temporaryMeasures?: string;
  additionalStudies?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  finalRecommendations?: string;
  responsibleProfessional: string;
  professionalLicense: string;
  date: string;
}

export type RepairPriority = 'Baja' | 'Media' | 'Alta' | 'Urgente';
export type RepairItemApprovalStatus = 'PENDIENTE' | 'APROBADO' | 'APROBADO CON OBSERVACIONES' | 'NO APROBADO';

export interface RepairItemRecord {
  id: string;
  caseId: string;
  visitId?: string;
  findingId?: string;
  elementLocation: string;
  problem: string;
  repairDescription: string;
  priority: RepairPriority;
  estimatedQuantity: number;
  unit: 'm' | 'm²' | 'm³' | 'ml' | 'un' | 'kg' | 'global' | 'punto' | 'tramo';
  technicalSpecification: string;
  expectedMaterials: string;
  specialistRequired: boolean;
  observation?: string;
  clientApprovalStatus: RepairItemApprovalStatus;
  createdAt: string;
}

export type ClientApprovalStatus =
  | 'PENDIENTE'
  | 'APROBADO'
  | 'APROBADO CON OBSERVACIONES'
  | 'NO APROBADO'
  | 'Pendiente'
  | 'Aprobado'
  | 'Aprobado con observaciones'
  | 'No aprobado';

export interface ClientApprovalRecord {
  id: string;
  caseId: string;
  visitId?: string;
  proposedIntervention?: string;
  technicalSummary?: string;
  repairScopePresented: string;
  status: ClientApprovalStatus;
  clientRepresentativeName: string;
  observations: string;
  date: string;
  signatureDataUrl?: string;
  signaturePlaceholder?: boolean;
  createdAt: string;
}

// -------------------------------------------------------------
// WORK FRONT (FRENTE DE OBRA)
// -------------------------------------------------------------

export type WorkFrontStatus =
  | 'PENDIENTE'
  | 'PROGRAMADO'
  | 'LISTO PARA INICIAR'
  | 'EN EJECUCIÓN'
  | 'SUSPENDIDO'
  | 'PENDIENTE DE ENTREGA'
  | 'ENTREGADO'
  | 'CERRADO';

export interface WorkFrontRecord {
  id: string; // e.g. "FO-2026-0001"
  frontCode: string;
  caseId: string;
  caseCode?: string;
  visitId?: string;
  propertyAddress: string;
  clientName: string;
  repairScope: string;
  responsibleTechnicalProfessional: string;
  fieldSupervisor: string;
  plannedStartDate: string;
  plannedCompletionDate: string;
  actualStartDate?: string;
  actualCompletionDate?: string;
  status: WorkFrontStatus;
  progressCategory?: 'No iniciado' | 'En proceso' | 'Completado';
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// PERSONNEL ON SITE (PERSONAL EN SITIO)
// -------------------------------------------------------------

export interface PersonnelOnSiteRecord {
  id: string;
  workFrontId: string;
  date: string;
  supervisor: string;
  technicalProfessional: string;
  workers: string[];
  contractorCrew: string;
  driver?: string;
  arrivalTime: string;
  departureTime?: string;
  activitiesAssigned: string;
  attendanceObservations?: string;
  createdAt: string;
}

// -------------------------------------------------------------
// REPAIR SCHEDULE (PROGRAMACIÓN)
// -------------------------------------------------------------

export type ActivityScheduleStatus = 'PENDIENTE' | 'EN PROCESO' | 'COMPLETADA' | 'REPROGRAMADA';

export interface WorkScheduleActivity {
  id: string;
  workFrontId: string;
  activityName: string;
  responsiblePerson: string;
  plannedDate: string;
  startTime: string;
  expectedDuration: string; // e.g. "4 horas", "2 días"
  dependencies?: string;
  status: ActivityScheduleStatus;
  createdAt: string;
}

// -------------------------------------------------------------
// MATERIAL REQUEST (SOLICITUD DE MATERIALES)
// -------------------------------------------------------------

export type MaterialOrigin = 'COMPRA' | 'BODEGA' | 'DISPONIBLE EN OBRA';
export type MaterialRequestStatus =
  | 'SOLICITADO'
  | 'EN REVISIÓN'
  | 'APROBADO'
  | 'COMPRADO'
  | 'PREPARADO EN BODEGA'
  | 'DESPACHADO'
  | 'ENTREGADO'
  | 'CANCELADO';

export interface MaterialRequestItem {
  id: string;
  materialName?: string;
  name?: string;
  description?: string;
  quantity?: number;
  requestedQuantity?: number;
  unit: string;
  technicalSpecification?: string;
  status?: string;
}

export interface MaterialRequestRecord {
  id: string; // e.g. "SOL-2026-0001"
  requestNumber?: string;
  requestCode?: string;
  caseId?: string;
  caseCode?: string;
  visitId?: string;
  workFrontId?: string;
  workFrontCode?: string;
  requestDate: string;
  requestedBy: string;
  requiredDate?: string;
  urgency?: 'Baja' | 'Media' | 'Alta' | 'Urgente';
  origin?: MaterialOrigin;
  supplier?: string;
  warehouse?: string;
  justification?: string;
  status: MaterialRequestStatus;
  items: MaterialRequestItem[];
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// MATERIAL DELIVERY (ENTREGA DE MATERIALES)
// -------------------------------------------------------------

export type MaterialDeliveryStatus =
  | 'PROGRAMADA'
  | 'EN RUTA'
  | 'ENTREGA PARCIAL'
  | 'ENTREGADO COMPLETO'
  | 'ENTREGADA EN SITIO'
  | 'ENTREGADO CON NOVEDAD'
  | 'RECHAZADO'
  | 'RECHAZADA';

export interface MaterialDeliveryTransportedItem {
  materialName?: string;
  name?: string;
  quantity?: number;
  deliveredQuantity?: number;
  unit: string;
  materialItemId?: string;
}

export interface MaterialDeliveryRecord {
  id: string; // e.g. "ENT-2026-0001"
  deliveryNumber?: string;
  deliveryNoteCode?: string;
  materialRequestId?: string;
  materialRequestCode?: string;
  workFrontId: string;
  workFrontCode?: string;
  caseId?: string;
  caseCode?: string;
  origin?: string;
  driverResponsible?: string;
  driverCourierName?: string;
  driverPhone?: string;
  vehicle?: string;
  transportType?: string;
  departureDateTime: string;
  arrivalDateTime?: string;
  estimatedArrivalDateTime?: string;
  materialsTransported?: MaterialDeliveryTransportedItem[];
  deliveredItems?: MaterialDeliveryTransportedItem[];
  personDelivering?: string;
  personReceivingOnSite?: string;
  status: MaterialDeliveryStatus;
  deliveryObservations?: string;
  deliveryPhotoUrl?: string;
  materialsPhotoUrl?: string;
  recipientSignatureDataUrl?: string;
  receivedOnSiteAt?: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// DAILY WORK LOG / EXECUTION (REGISTRO DE EJECUCIÓN)
// -------------------------------------------------------------

export interface WorkLogRecord {
  id: string;
  workFrontId: string;
  date: string;
  supervisor: string;
  personnelPresent: string[];
  activitiesPlanned: string;
  activitiesExecuted: string;
  repairItemsWorkedOn: string[];
  quantitiesExecuted: string;
  materialsUsed: string;
  equipmentUsed: string;
  problemsOrIncidents?: string;
  pendingActivities: string;
  technicalObservations: string;
  photosBefore: string[];
  photosDuring: string[];
  photosAfter: string[];
  createdAt: string;
}

// -------------------------------------------------------------
// TECHNICAL APPROVAL & CLIENT HANDOVER
// -------------------------------------------------------------

export type TechnicalApprovalStatus = 'APROBADO' | 'APROBADO CON OBSERVACIONES' | 'RECHAZADO / REQUIERE CORRECCIÓN';

export interface TechnicalHandoverApproval {
  id: string;
  workFrontId: string;
  caseId?: string;
  professionalName: string;
  role: string;
  approvalStatus: TechnicalApprovalStatus;
  comments: string;
  date: string;
  signatureDataUrl?: string;
  createdAt: string;
}

export type ClientHandoverStatus = 'PENDIENTE' | 'ENTREGADO' | 'ENTREGADO CON OBSERVACIONES' | 'RECHAZADO';

export interface ClientHandoverRecord {
  id: string;
  workFrontId: string;
  caseId?: string;
  handoverDate: string;
  handoverTime: string;
  personDelivering: string;
  clientRepresentativeReceiving: string;
  summaryOfWorksDelivered: string;
  pendingItems: string;
  clientComments: string;
  finalDeliveryPhotos: string[];
  signatureDataUrl?: string;
  status: ClientHandoverStatus;
  createdAt: string;
}

// -------------------------------------------------------------
// ADMINISTRATIVE BILLING & PAYMENTS (COBROS Y PAGOS)
// -------------------------------------------------------------

export type PaymentStatus =
  | 'SIN COTIZAR'
  | 'COTIZACIÓN ENVIADA'
  | 'PENDIENTE APROBACIÓN'
  | 'APROBADO'
  | 'ANTICIPO PENDIENTE'
  | 'ANTICIPO RECIBIDO'
  | 'PENDIENTE DE COBRO'
  | 'PAGO PARCIAL'
  | 'PAGADO'
  | 'VENCIDO';

export interface BillingRecord {
  id: string;
  billingCode?: string;
  caseId: string;
  caseCode?: string;
  workFrontId?: string;
  workFrontCode?: string;
  clientName?: string;
  concept?: string;
  quotedValue?: number;
  approvedValue?: number;
  advanceRequired?: number;
  advanceReceived?: number;
  advanceRequested?: number;
  amountInvoiced?: number;
  amountPaid?: number;
  paidAmount?: number;
  totalAmount?: number;
  balancePending?: number;
  paymentStatus: PaymentStatus;
  paymentTerms?: string;
  notes?: string;
  payments?: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

export type PaymentType = 'Anticipo' | 'Pago parcial' | 'Pago final' | 'Otro';

export interface PaymentRecord {
  id: string;
  caseId: string;
  workFrontId?: string;
  billingId?: string;
  date: string;
  amount: number;
  paymentType: PaymentType;
  reference: string;
  recordedBy: string;
  observation?: string;
  createdAt: string;
}

export type CollectionActionType =
  | 'Factura enviada'
  | 'Recordatorio enviado'
  | 'Llamada'
  | 'Compromiso de pago'
  | 'Pago recibido'
  | 'Otro';

export interface CollectionActionRecord {
  id: string;
  caseId: string;
  workFrontId?: string;
  date: string;
  action: CollectionActionType;
  responsible: string;
  comments: string;
  nextFollowUpDate?: string;
  createdAt: string;
}

// -------------------------------------------------------------
// EVIDENCE & MEDIA
// -------------------------------------------------------------

export type EvidenceCategory =
  | 'GENERAL VISIT'
  | 'FINDINGS'
  | 'BEFORE REPAIR'
  | 'DURING REPAIR'
  | 'AFTER REPAIR'
  | 'MATERIALS'
  | 'MATERIAL DELIVERY'
  | 'FINAL HANDOVER';

export interface EvidenceMediaItem {
  id: string;
  mediaType: 'photo' | 'video' | 'voice' | 'document';
  url: string;
  filename?: string;
  date: string;
  time: string;
  user: string;
  visitId?: string;
  caseId?: string;
  workFrontId?: string;
  category: EvidenceCategory;
  description: string;
  annotations?: PhotoAnnotation[];
  createdAt: string;
}

export interface InspectionWalkthroughZone {
  id: string;
  name: string; // e.g. "Exterior", "Accesos", "Primer piso", "Pisos superiores", "Sótano", "Cubierta", "Zonas comunes", "Apartamento/Unidad", "Fachada", "Escaleras", "Áreas de servicios", "Terreno y entorno"
  description: string;
  technicalNotes: string;
  photos: PhotoMetadata[];
  videos: VideoMetadata[];
  voiceNotes: VoiceNoteMetadata[];
  findingsCount: number;
}

// -------------------------------------------------------------
// STRUCTURAL & PATHOLOGY TYPES
// -------------------------------------------------------------

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
  measurementValue?: string;
}

export interface PhotoMetadata {
  id: string;
  photoNumber: number;
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
  zone?: string;
  floor: string;
  location: string;
  material?: string;
  isStructural?: boolean;
  description: string;
  damageType: string;
  severity: DamageSeverity;
  crackType?: string;
  crackWidth?: string;
  crackOrientation?: string;
  crackLength?: string;
  possibleCause?: string;
  professionalObservation?: string;
  additionalVerificationRequired?: string;
  repairPotentiallyRequired?: 'SÍ' | 'NO' | 'POR DETERMINAR' | 'YES' | 'NO' | 'TO BE DETERMINED';
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
  label: string;
  floor: string;
  location: string;
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
  userRole?: UserRole;
  action: string;
  record?: string;
  inspectionId?: string;
  previousStatus?: string;
  newStatus?: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  details?: string;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  event: string;
  user: string;
  role: string;
  details?: string;
}

export interface PropertyInspection {
  id: string;
  caseId?: string;
  visitId?: string;
  date: string;
  time: string;
  inspectorName: string;
  professionalLicense: string;
  organization: string;
  contactPhone?: string;

  // Property Details
  address: string;
  neighborhood: string;
  municipality: string;
  department: string;
  propertyType?: PropertyType;
  apartmentUnit?: string;
  towerBlock?: string;
  floorLevel?: string;
  buildingFloorsCount?: number;
  gps: GPSCoordinate;
  ownerOrOccupant?: string;
  ownerName?: string;
  occupantName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  contactPerson?: string;
  relationshipWithProperty?: string;
  whoAttendsVisit?: string;
  clientOrganization?: string;
  identificationNumber?: string;
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

  // Documentation
  documentation?: CaseDocumentation;

  // Structural Characteristics
  structuralSystem: StructuralSystem;
  primaryConstructionMaterial?: string;
  predominantMaterial?: string;
  foundationType?: string;
  floorSystem?: string;
  roofType?: string;
  masonryType?: string;
  previousStructuralModifications?: string;
  previousRepairs?: string;
  previousDamage?: string;
  generalObservations?: string;
  generalCondition?: string;

  // Inspection Walkthrough Zones & Elements
  walkthroughZones?: InspectionWalkthroughZone[];
  elements: BuildingElement[];
  findings: Finding[];
  photos: PhotoMetadata[];
  videos: VideoMetadata[];
  voiceNotes: VoiceNoteMetadata[];
  evidenceMedia?: EvidenceMediaItem[];

  // Conclusions
  walkthroughSummary?: string;
  mainFindingsSummary?: string;
  generalPropertyCondition?: string;
  structuralObservations?: string;
  masonryObservations?: string;
  nonstructuralObservations?: string;
  groundObservations?: string;
  potentialCauses?: string;
  additionalStudiesRequired?: string;
  immediateRecommendations?: string;
  accessRestrictionsNote?: string;
  temporaryMeasuresNote?: string;

  // Repair Decision
  repairDecision?: RepairDecisionOption;
  repairFollowUpRequired?: boolean;
  repairFollowUpDate?: string;
  proposedRepairs?: RepairItemRecord[];

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

export interface ReportRecord {
  id: string;
  reportNumber: string;
  caseId?: string;
  visitId?: string;
  inspectionId?: string;
  clientName: string;
  propertyAddress: string;
  municipality: string;
  structuralSystem?: string;
  damageSeverity?: string;
  habitabilityStatus?: string;
  executiveSummary: string;
  technicalConclusions: string;
  recommendations: string;
  responsibleProfessionalName: string;
  professionalLicense?: string;
  generatedAt: string;
  pdfUrl?: string;
  status: 'BORRADOR' | 'EMITIDO' | 'ENTREGADO_CLIENTE';
}

