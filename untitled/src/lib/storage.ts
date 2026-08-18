import { 
  PropertyInspection, 
  SyncQueueItem, 
  AuditLogEntry, 
  UserRole, 
  CaseRecord, 
  CaseStatus,
  VisitRecord,
  WorkFrontRecord,
  WorkFrontLogEntry,
  PersonnelOnSiteRecord,
  WorkScheduleActivity,
  MaterialRequestRecord,
  MaterialDeliveryRecord,
  WorkLogRecord,
  TechnicalHandoverApproval,
  ClientHandoverRecord,
  BillingRecord,
  PaymentRecord,
  CollectionActionRecord,
  RepairItemRecord,
  VisitStatus
} from '../types';
import { syncInspectionToSupabase } from './supabaseClient';

const STORAGE_KEY = 'sipre_inspections_data';
const CASES_STORAGE_KEY = 'sipre_cases_data';
const VISITS_STORAGE_KEY = 'sipre_visits_data';
const WORK_FRONTS_KEY = 'sipre_work_fronts_data';
const PERSONNEL_KEY = 'sipre_personnel_data';
const SCHEDULES_KEY = 'sipre_schedules_data';
const MATERIAL_REQUESTS_KEY = 'sipre_material_requests_data';
const MATERIAL_DELIVERIES_KEY = 'sipre_material_deliveries_data';
const WORK_LOGS_KEY = 'sipre_work_logs_data';
const TECHNICAL_APPROVALS_KEY = 'sipre_technical_approvals_data';
const CLIENT_HANDOVERS_KEY = 'sipre_client_handovers_data';
const BILLINGS_KEY = 'sipre_billings_data';
const PAYMENTS_KEY = 'sipre_payments_data';
const COLLECTIONS_KEY = 'sipre_collections_data';
const REPAIR_ITEMS_KEY = 'sipre_repair_items_data';
const SYNC_QUEUE_KEY = 'sipre_sync_queue';
const AUDIT_LOGS_KEY = 'sipre_audit_logs';
const CLEANUP_KEY = 'sipre_dev_storage_cleaned_v3';

/**
 * Check if a record is a legacy mock/sample inspection from previous development builds.
 */
function isLegacyDemoRecord(record: any): boolean {
  if (!record || typeof record !== 'object') return true;
  const str = JSON.stringify(record).toLowerCase();
  return (
    str.includes('carlos mendoza') ||
    str.includes('cpn-38291-col') ||
    str.includes('carrera 43a') ||
    str.includes('el poblado') ||
    str.includes('ungrd / sci') ||
    str.includes('patología y riesgo estructural s.a.s') ||
    str.includes('columna c-01') ||
    str.includes('viga v-102') ||
    str.includes('sipre-2024-001') ||
    str.includes('sipre-2026-0042')
  );
}

/**
 * One-time development cleanup to purge legacy demo data from browser storages.
 */
export function runDevStorageCleanup(): void {
  try {
    const hasCleaned = localStorage.getItem(CLEANUP_KEY);
    if (!hasCleaned) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SYNC_QUEUE_KEY);
      localStorage.removeItem(AUDIT_LOGS_KEY);
      localStorage.removeItem('sipre_demo_data');
      localStorage.removeItem('sipre_inspections');
      localStorage.removeItem('inspections');
      localStorage.removeItem('properties');
      sessionStorage.clear();

      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        try {
          window.indexedDB.deleteDatabase('sipre');
          window.indexedDB.deleteDatabase('sipre_db');
          window.indexedDB.deleteDatabase('inspections_db');
        } catch {
          // ignore
        }
      }

      localStorage.setItem(CLEANUP_KEY, 'true');
    }
  } catch (err) {
    console.warn('Storage cleanup error:', err);
  }
}

if (typeof window !== 'undefined') {
  runDevStorageCleanup();
}

// -------------------------------------------------------------
// AUDIT PRINCIPLE
// -------------------------------------------------------------
export function recordAuditLog(entry: AuditLogEntry): void {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    const logs: AuditLogEntry[] = raw ? JSON.parse(raw) : [];
    logs.unshift(entry);
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 500)));
  } catch (err) {
    console.error('Error logging audit trail:', err);
  }
}

export function getAuditLogs(recordId?: string): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    const logs: AuditLogEntry[] = raw ? JSON.parse(raw) : [];
    if (recordId) {
      return logs.filter((l) => l.inspectionId === recordId || l.record === recordId);
    }
    return logs;
  } catch {
    return [];
  }
}

// -------------------------------------------------------------
// EXPEDIENTES / CASES
// -------------------------------------------------------------
export function getCases(): CaseRecord[] {
  try {
    const raw = localStorage.getItem(CASES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getCase(id: string): CaseRecord | undefined {
  return getCases().find((c) => c.id === id || c.code === id);
}

export function saveCase(
  caseRecord: CaseRecord, 
  currentUser = 'Coordinador Técnico', 
  currentRole: UserRole = 'Coordinator'
): CaseRecord {
  const all = getCases();
  const index = all.findIndex((c) => c.id === caseRecord.id);
  const updated: CaseRecord = {
    ...caseRecord,
    updatedAt: new Date().toISOString(),
  };

  const prevStatus = index >= 0 ? all[index].status : undefined;
  if (index >= 0) {
    all[index] = updated;
  } else {
    all.unshift(updated);
  }

  localStorage.setItem(CASES_STORAGE_KEY, JSON.stringify(all));

  recordAuditLog({
    id: 'AUD-CASE-' + Date.now(),
    timestamp: new Date().toISOString(),
    user: currentUser,
    userRole: currentRole,
    action: index >= 0 ? 'Actualización de Expediente' : 'Creación de Expediente',
    record: updated.code || updated.id,
    previousStatus: prevStatus,
    newStatus: updated.status,
    details: `Expediente: ${updated.clientName} - ${updated.address}`,
  });

  return updated;
}

export function generateNextCaseCode(): string {
  const year = new Date().getFullYear();
  const all = getCases();
  const num = (all.length + 1).toString().padStart(4, '0');
  return `EXP-${year}-${num}`;
}

export function updateCaseStatus(
  caseId: string,
  newStatus: CaseStatus,
  currentUser = 'Coordinador Técnico',
  details = 'Actualización de estado de expediente'
): CaseRecord | undefined {
  const c = getCase(caseId);
  if (!c) return undefined;
  const updated: CaseRecord = {
    ...c,
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };
  return saveCase(updated, currentUser);
}

export function generateNextBillingCode(): string {
  const year = new Date().getFullYear();
  const all = getBillings();
  const num = (all.length + 1).toString().padStart(4, '0');
  return `CC-${year}-${num}`;
}

// -------------------------------------------------------------
// VISITAS / VISITS
// -------------------------------------------------------------
export function getVisits(): VisitRecord[] {
  try {
    const raw = localStorage.getItem(VISITS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getVisit(id: string): VisitRecord | undefined {
  return getVisits().find((v) => v.id === id);
}

export function saveVisit(
  visitRecord: VisitRecord, 
  currentUser = 'Coordinador Técnico', 
  currentRole: UserRole = 'Coordinator'
): VisitRecord {
  const all = getVisits();
  const index = all.findIndex((v) => v.id === visitRecord.id);
  const updated: VisitRecord = {
    ...visitRecord,
    updatedAt: new Date().toISOString(),
  };

  const prevStatus = index >= 0 ? all[index].status : undefined;
  if (index >= 0) {
    all[index] = updated;
  } else {
    all.unshift(updated);
  }

  localStorage.setItem(VISITS_STORAGE_KEY, JSON.stringify(all));

  recordAuditLog({
    id: 'AUD-VISIT-' + Date.now(),
    timestamp: new Date().toISOString(),
    user: currentUser,
    userRole: currentRole,
    action: index >= 0 ? `Actualización de Visita (${updated.status})` : 'Programación de Visita',
    record: updated.id,
    previousStatus: prevStatus,
    newStatus: updated.status,
    details: `Visita ${updated.id} - ${updated.address} (${updated.responsibleProfessional})`,
  });

  return updated;
}

export function updateVisitStatus(
  visitId: string, 
  newStatus: VisitStatus, 
  currentUser = 'Inspector', 
  gpsLocation?: any
): VisitRecord | undefined {
  const visit = getVisit(visitId);
  if (!visit) return undefined;

  const now = new Date().toISOString();
  const updated: VisitRecord = {
    ...visit,
    status: newStatus,
    updatedAt: now,
  };

  if (newStatus === 'EN RUTA') updated.enRouteAt = now;
  if (newStatus === 'EN SITIO') {
    updated.onSiteAt = now;
    if (gpsLocation) updated.gpsLocation = gpsLocation;
  }
  if (newStatus === 'EN INSPECCIÓN') updated.inspectionStartedAt = now;
  if (newStatus === 'TERMINADA') updated.completedAt = now;

  return saveVisit(updated, currentUser, 'Inspector');
}

export function generateNextVisitCode(): string {
  const year = new Date().getFullYear();
  const all = getVisits();
  const num = (all.length + 1).toString().padStart(4, '0');
  return `VIS-${year}-${num}`;
}

// -------------------------------------------------------------
// FRENTES DE OBRA / WORK FRONTS
// -------------------------------------------------------------
export function getWorkFronts(): WorkFrontRecord[] {
  try {
    const raw = localStorage.getItem(WORK_FRONTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getWorkFront(id: string): WorkFrontRecord | undefined {
  return getWorkFronts().find((f) => f.id === id || f.frontCode === id);
}

export function saveWorkFront(
  front: WorkFrontRecord, 
  currentUser = 'Coordinador Técnico', 
  currentRole: UserRole = 'Coordinator'
): WorkFrontRecord {
  const all = getWorkFronts();
  const index = all.findIndex((f) => f.id === front.id);
  const updated: WorkFrontRecord = {
    ...front,
    updatedAt: new Date().toISOString(),
  };

  const prevStatus = index >= 0 ? all[index].status : undefined;
  if (index >= 0) {
    all[index] = updated;
  } else {
    all.unshift(updated);
  }

  localStorage.setItem(WORK_FRONTS_KEY, JSON.stringify(all));

  recordAuditLog({
    id: 'AUD-WF-' + Date.now(),
    timestamp: new Date().toISOString(),
    user: currentUser,
    userRole: currentRole,
    action: index >= 0 ? `Actualización de Frente de Obra (${updated.status})` : 'Apertura de Frente de Obra',
    record: updated.frontCode || updated.id,
    previousStatus: prevStatus,
    newStatus: updated.status,
    details: `Frente ${updated.frontCode} - ${updated.propertyAddress}`,
  });

  return updated;
}

export function generateNextWorkFrontCode(): string {
  const year = new Date().getFullYear();
  const all = getWorkFronts();
  const num = (all.length + 1).toString().padStart(4, '0');
  return `FO-${year}-${num}`;
}

// -------------------------------------------------------------
// PERSONAL EN SITIO
// -------------------------------------------------------------
export function getPersonnelOnSite(workFrontId?: string): PersonnelOnSiteRecord[] {
  try {
    const raw = localStorage.getItem(PERSONNEL_KEY);
    const all: PersonnelOnSiteRecord[] = raw ? JSON.parse(raw) : [];
    if (workFrontId) {
      return all.filter((p) => p.workFrontId === workFrontId);
    }
    return all;
  } catch {
    return [];
  }
}

export function savePersonnelOnSite(record: PersonnelOnSiteRecord, currentUser = 'Supervisor de Campo'): PersonnelOnSiteRecord {
  const all = getPersonnelOnSite();
  const index = all.findIndex((p) => p.id === record.id);
  if (index >= 0) {
    all[index] = record;
  } else {
    all.unshift(record);
  }
  localStorage.setItem(PERSONNEL_KEY, JSON.stringify(all));

  recordAuditLog({
    id: 'AUD-PERS-' + Date.now(),
    timestamp: new Date().toISOString(),
    user: currentUser,
    action: 'Registro de Asistencia y Personal en Sitio',
    record: record.workFrontId,
    details: `Supervisor: ${record.supervisor}, ${record.workers?.length || 0} operarios`,
  });

  return record;
}

// -------------------------------------------------------------
// PROGRAMACIÓN / SCHEDULE
// -------------------------------------------------------------
export function getWorkSchedules(workFrontId?: string): WorkScheduleActivity[] {
  try {
    const raw = localStorage.getItem(SCHEDULES_KEY);
    const all: WorkScheduleActivity[] = raw ? JSON.parse(raw) : [];
    if (workFrontId) {
      return all.filter((s) => s.workFrontId === workFrontId);
    }
    return all;
  } catch {
    return [];
  }
}

export function saveWorkSchedule(activity: WorkScheduleActivity): WorkScheduleActivity {
  const all = getWorkSchedules();
  const index = all.findIndex((s) => s.id === activity.id);
  if (index >= 0) {
    all[index] = activity;
  } else {
    all.push(activity);
  }
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(all));
  return activity;
}

// -------------------------------------------------------------
// SOLICITUD DE MATERIALES
// -------------------------------------------------------------
export function getMaterialRequests(workFrontId?: string): MaterialRequestRecord[] {
  try {
    const raw = localStorage.getItem(MATERIAL_REQUESTS_KEY);
    const all: MaterialRequestRecord[] = raw ? JSON.parse(raw) : [];
    if (workFrontId) {
      return all.filter((m) => m.workFrontId === workFrontId);
    }
    return all;
  } catch {
    return [];
  }
}

export function saveMaterialRequest(request: MaterialRequestRecord, currentUser = 'Supervisor'): MaterialRequestRecord {
  const all = getMaterialRequests();
  const index = all.findIndex((m) => m.id === request.id);
  const updated = { ...request, updatedAt: new Date().toISOString() };
  if (index >= 0) {
    all[index] = updated;
  } else {
    all.unshift(updated);
  }
  localStorage.setItem(MATERIAL_REQUESTS_KEY, JSON.stringify(all));

  recordAuditLog({
    id: 'AUD-MAT-REQ-' + Date.now(),
    timestamp: new Date().toISOString(),
    user: currentUser,
    action: `Solicitud de Materiales (${updated.status})`,
    record: updated.requestNumber,
    newStatus: updated.status,
    details: `${updated.items.length} ítems solicitados (${updated.origin})`,
  });

  return updated;
}

export function generateNextMaterialRequestCode(): string {
  const year = new Date().getFullYear();
  const all = getMaterialRequests();
  const num = (all.length + 1).toString().padStart(4, '0');
  return `SOL-${year}-${num}`;
}

// -------------------------------------------------------------
// ENTREGA DE MATERIALES
// -------------------------------------------------------------
export function getMaterialDeliveries(workFrontId?: string): MaterialDeliveryRecord[] {
  try {
    const raw = localStorage.getItem(MATERIAL_DELIVERIES_KEY);
    const all: MaterialDeliveryRecord[] = raw ? JSON.parse(raw) : [];
    if (workFrontId) {
      return all.filter((d) => d.workFrontId === workFrontId);
    }
    return all;
  } catch {
    return [];
  }
}

export function saveMaterialDelivery(delivery: MaterialDeliveryRecord, currentUser = 'Transportador'): MaterialDeliveryRecord {
  const all = getMaterialDeliveries();
  const index = all.findIndex((d) => d.id === delivery.id);
  const updated = { ...delivery, updatedAt: new Date().toISOString() };
  if (index >= 0) {
    all[index] = updated;
  } else {
    all.unshift(updated);
  }
  localStorage.setItem(MATERIAL_DELIVERIES_KEY, JSON.stringify(all));

  recordAuditLog({
    id: 'AUD-DELIVERY-' + Date.now(),
    timestamp: new Date().toISOString(),
    user: currentUser,
    action: `Entrega de Materiales (${updated.status})`,
    record: updated.deliveryNumber,
    newStatus: updated.status,
    details: `Responsable: ${updated.driverResponsible}, Recibe: ${updated.personReceivingOnSite}`,
  });

  return updated;
}

export function generateNextDeliveryCode(): string {
  const year = new Date().getFullYear();
  const all = getMaterialDeliveries();
  const num = (all.length + 1).toString().padStart(4, '0');
  return `ENT-${year}-${num}`;
}

// -------------------------------------------------------------
// REGISTRO DE EJECUCIÓN (BITÁCORAS DIARIAS)
// -------------------------------------------------------------
export function getWorkLogs(workFrontId?: string): WorkLogRecord[] {
  try {
    const raw = localStorage.getItem(WORK_LOGS_KEY);
    const all: WorkLogRecord[] = raw ? JSON.parse(raw) : [];
    if (workFrontId) {
      return all.filter((l) => l.workFrontId === workFrontId);
    }
    return all;
  } catch {
    return [];
  }
}

const WORK_FRONT_LOGS_KEY = 'sipre_work_front_logs_data';

export function getWorkFrontLogEntries(workFrontId?: string): WorkFrontLogEntry[] {
  try {
    const raw = localStorage.getItem(WORK_FRONT_LOGS_KEY);
    const all: WorkFrontLogEntry[] = raw ? JSON.parse(raw) : [];
    if (workFrontId) {
      return all.filter((l) => l.workFrontId === workFrontId);
    }
    return all;
  } catch {
    return [];
  }
}

export function addWorkFrontLogEntry(log: WorkFrontLogEntry): WorkFrontLogEntry {
  const all = getWorkFrontLogEntries();
  all.unshift(log);
  localStorage.setItem(WORK_FRONT_LOGS_KEY, JSON.stringify(all));
  return log;
}

export function saveWorkLog(log: WorkLogRecord, currentUser = 'Supervisor'): WorkLogRecord {
  const all = getWorkLogs();
  const index = all.findIndex((l) => l.id === log.id);
  if (index >= 0) {
    all[index] = log;
  } else {
    all.unshift(log);
  }
  localStorage.setItem(WORK_LOGS_KEY, JSON.stringify(all));

  recordAuditLog({
    id: 'AUD-LOG-' + Date.now(),
    timestamp: new Date().toISOString(),
    user: currentUser,
    action: 'Bitácora Diaria de Ejecución',
    record: log.workFrontId,
    details: `Fecha ${log.date} - ${log.activitiesExecuted}`,
  });

  return log;
}

// -------------------------------------------------------------
// REPARACIONES PROPUESTAS
// -------------------------------------------------------------
export function getRepairItems(caseId?: string): RepairItemRecord[] {
  try {
    const raw = localStorage.getItem(REPAIR_ITEMS_KEY);
    const all: RepairItemRecord[] = raw ? JSON.parse(raw) : [];
    if (caseId) {
      return all.filter((r) => r.caseId === caseId);
    }
    return all;
  } catch {
    return [];
  }
}

export function saveRepairItem(item: RepairItemRecord): RepairItemRecord {
  const all = getRepairItems();
  const index = all.findIndex((r) => r.id === item.id);
  if (index >= 0) {
    all[index] = item;
  } else {
    all.push(item);
  }
  localStorage.setItem(REPAIR_ITEMS_KEY, JSON.stringify(all));
  return item;
}

// -------------------------------------------------------------
// APROBACIÓN TÉCNICA Y ENTREGA AL CLIENTE
// -------------------------------------------------------------
export function getTechnicalApprovals(workFrontId?: string): TechnicalHandoverApproval[] {
  try {
    const raw = localStorage.getItem(TECHNICAL_APPROVALS_KEY);
    const all: TechnicalHandoverApproval[] = raw ? JSON.parse(raw) : [];
    if (workFrontId) {
      return all.filter((a) => a.workFrontId === workFrontId);
    }
    return all;
  } catch {
    return [];
  }
}

export function saveTechnicalApproval(approval: TechnicalHandoverApproval, currentUser = 'Especialista'): TechnicalHandoverApproval {
  const all = getTechnicalApprovals();
  const index = all.findIndex((a) => a.id === approval.id);
  if (index >= 0) {
    all[index] = approval;
  } else {
    all.unshift(approval);
  }
  localStorage.setItem(TECHNICAL_APPROVALS_KEY, JSON.stringify(all));

  recordAuditLog({
    id: 'AUD-TECH-APP-' + Date.now(),
    timestamp: new Date().toISOString(),
    user: currentUser,
    action: `Aprobación Técnica de Entrega (${approval.approvalStatus})`,
    record: approval.workFrontId,
    newStatus: approval.approvalStatus,
    details: `${approval.professionalName} (${approval.role})`,
  });

  return approval;
}

export function getClientHandovers(workFrontId?: string): ClientHandoverRecord[] {
  try {
    const raw = localStorage.getItem(CLIENT_HANDOVERS_KEY);
    const all: ClientHandoverRecord[] = raw ? JSON.parse(raw) : [];
    if (workFrontId) {
      return all.filter((h) => h.workFrontId === workFrontId);
    }
    return all;
  } catch {
    return [];
  }
}

export function saveClientHandover(handover: ClientHandoverRecord, currentUser = 'Coordinador'): ClientHandoverRecord {
  const all = getClientHandovers();
  const index = all.findIndex((h) => h.id === handover.id);
  if (index >= 0) {
    all[index] = handover;
  } else {
    all.unshift(handover);
  }
  localStorage.setItem(CLIENT_HANDOVERS_KEY, JSON.stringify(all));

  recordAuditLog({
    id: 'AUD-CLIENT-HANDOVER-' + Date.now(),
    timestamp: new Date().toISOString(),
    user: currentUser,
    action: `Acta de Entrega al Cliente (${handover.status})`,
    record: handover.workFrontId,
    newStatus: handover.status,
    details: `Recibe: ${handover.clientRepresentativeReceiving}`,
  });

  return handover;
}

// -------------------------------------------------------------
// COBROS Y PAGOS
// -------------------------------------------------------------
export function getBillings(caseId?: string): BillingRecord[] {
  try {
    const raw = localStorage.getItem(BILLINGS_KEY);
    const all: BillingRecord[] = raw ? JSON.parse(raw) : [];
    if (caseId) {
      return all.filter((b) => b.caseId === caseId);
    }
    return all;
  } catch {
    return [];
  }
}

export function saveBilling(billing: BillingRecord): BillingRecord {
  const all = getBillings();
  const index = all.findIndex((b) => b.id === billing.id);
  const updated = { ...billing, updatedAt: new Date().toISOString() };
  if (index >= 0) {
    all[index] = updated;
  } else {
    all.unshift(updated);
  }
  localStorage.setItem(BILLINGS_KEY, JSON.stringify(all));
  return updated;
}

export function getPayments(caseId?: string): PaymentRecord[] {
  try {
    const raw = localStorage.getItem(PAYMENTS_KEY);
    const all: PaymentRecord[] = raw ? JSON.parse(raw) : [];
    if (caseId) {
      return all.filter((p) => p.caseId === caseId);
    }
    return all;
  } catch {
    return [];
  }
}

export function savePayment(payment: PaymentRecord, currentUser = 'Administrativo'): PaymentRecord {
  const all = getPayments();
  all.unshift(payment);
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(all));

  recordAuditLog({
    id: 'AUD-PAY-' + Date.now(),
    timestamp: new Date().toISOString(),
    user: currentUser,
    action: 'Registro de Pago Recibido',
    record: payment.caseId,
    details: `${payment.paymentType} - Ref: ${payment.reference}`,
  });

  return payment;
}

export function getCollectionActions(caseId?: string): CollectionActionRecord[] {
  try {
    const raw = localStorage.getItem(COLLECTIONS_KEY);
    const all: CollectionActionRecord[] = raw ? JSON.parse(raw) : [];
    if (caseId) {
      return all.filter((c) => c.caseId === caseId);
    }
    return all;
  } catch {
    return [];
  }
}

export function saveCollectionAction(action: CollectionActionRecord, currentUser = 'Administrativo'): CollectionActionRecord {
  const all = getCollectionActions();
  all.unshift(action);
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(all));

  recordAuditLog({
    id: 'AUD-COLLECT-' + Date.now(),
    timestamp: new Date().toISOString(),
    user: currentUser,
    action: `Gestión de Cobro (${action.action})`,
    record: action.caseId,
    details: `${action.action} por ${action.responsible}`,
  });

  return action;
}

// -------------------------------------------------------------
// INSPECCIONES
// -------------------------------------------------------------
export function getInspections(): PropertyInspection[] {
  try {
    runDevStorageCleanup();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const cleanList = parsed.filter((item) => !isLegacyDemoRecord(item));
    if (cleanList.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanList));
    }
    return cleanList;
  } catch (err) {
    console.error('Error loading inspections from local storage:', err);
    return [];
  }
}

export function getInspection(id: string): PropertyInspection | undefined {
  const all = getInspections();
  return all.find((item) => item.id === id);
}

export function saveInspection(
  inspection: PropertyInspection,
  currentUser: string = 'Inspector de Campo',
  currentRole: UserRole = 'Inspector',
  actionNote?: string
): PropertyInspection {
  const all = getInspections();
  const index = all.findIndex((i) => i.id === inspection.id);

  const updatedInspection: PropertyInspection = {
    ...inspection,
    updatedAt: new Date().toISOString(),
  };

  const auditEntry: AuditLogEntry = {
    id: 'AUD-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    user: currentUser,
    userRole: currentRole,
    action: actionNote || (index >= 0 ? 'Actualización de Inspección' : 'Creación de Inspección'),
    inspectionId: inspection.id,
  };

  if (!updatedInspection.auditTrail) {
    updatedInspection.auditTrail = [];
  }
  updatedInspection.auditTrail.unshift(auditEntry);

  if (index >= 0) {
    all[index] = updatedInspection;
  } else {
    all.unshift(updatedInspection);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  recordAuditLog(auditEntry);

  queueSyncAction({
    id: 'QUEUE-' + Date.now(),
    inspectionId: inspection.id,
    action: index >= 0 ? 'update' : 'create',
    payload: updatedInspection,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  });

  return updatedInspection;
}

export function deleteInspection(id: string, currentUser: string = 'Inspector', currentRole: UserRole = 'Administrator'): boolean {
  const all = getInspections();
  const filtered = all.filter((i) => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

  const auditEntry: AuditLogEntry = {
    id: 'AUD-' + Date.now(),
    timestamp: new Date().toISOString(),
    user: currentUser,
    userRole: currentRole,
    action: `Eliminación de Inspección ${id}`,
    inspectionId: id,
  };
  recordAuditLog(auditEntry);

  queueSyncAction({
    id: 'QUEUE-' + Date.now(),
    inspectionId: id,
    action: 'delete',
    payload: { id },
    timestamp: new Date().toISOString(),
    retryCount: 0,
  });

  return true;
}

// -------------------------------------------------------------
// SYNC QUEUE & NETWORK
// -------------------------------------------------------------
export function queueSyncAction(item: SyncQueueItem): void {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    const queue: SyncQueueItem[] = raw ? JSON.parse(raw) : [];
    queue.push(item);
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Error queueing sync item:', err);
  }
}

export function getSyncQueue(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearSyncQueue(): void {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify([]));
}

export async function processSyncQueue(): Promise<{ syncedCount: number; errors: string[] }> {
  const queue = getSyncQueue();
  if (queue.length === 0) return { syncedCount: 0, errors: [] };

  const errors: string[] = [];
  let syncedCount = 0;
  const remainingQueue: SyncQueueItem[] = [];

  for (const item of queue) {
    if (item.action === 'create' || item.action === 'update') {
      const res = await syncInspectionToSupabase(item.payload);
      if (res.success) {
        syncedCount++;
      } else {
        item.retryCount = (item.retryCount || 0) + 1;
        remainingQueue.push(item);
        errors.push(`Inspección ${item.inspectionId}: ${res.error}`);
      }
    }
  }

  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remainingQueue));
  return { syncedCount, errors };
}

export function getPendingSyncCount(): number {
  return getSyncQueue().length;
}

export function subscribeToNetworkStatus(callback: (isOnline: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

export function generateNextInspectionId(): string {
  const year = new Date().getFullYear();
  const all = getInspections();
  const num = (all.length + 1).toString().padStart(4, '0');
  return `SIPRE-${year}-${num}`;
}
