import { PropertyInspection, SyncQueueItem, AuditLogEntry, UserRole, PriorityLevel } from '../types';
import { syncInspectionToSupabase } from './supabaseClient';

const STORAGE_KEY = 'sipre_inspections_data';
const SYNC_QUEUE_KEY = 'sipre_sync_queue';
const AUDIT_LOGS_KEY = 'sipre_audit_logs';
const CLEANUP_KEY = 'sipre_dev_storage_cleaned_v2';

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
      // 1. Clean localStorage legacy keys
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SYNC_QUEUE_KEY);
      localStorage.removeItem(AUDIT_LOGS_KEY);
      localStorage.removeItem('sipre_demo_data');
      localStorage.removeItem('sipre_inspections');
      localStorage.removeItem('inspections');
      localStorage.removeItem('properties');

      // 2. Clean sessionStorage
      sessionStorage.clear();

      // 3. Clean legacy IndexedDB databases if any exist
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        try {
          window.indexedDB.deleteDatabase('sipre');
          window.indexedDB.deleteDatabase('sipre_db');
          window.indexedDB.deleteDatabase('inspections_db');
        } catch {
          // ignore
        }
      }

      // Mark cleanup complete so subsequent real user entries are preserved
      localStorage.setItem(CLEANUP_KEY, 'true');
    }
  } catch (err) {
    console.warn('Storage cleanup error:', err);
  }
}

// Run cleanup immediately on module load
if (typeof window !== 'undefined') {
  runDevStorageCleanup();
}

export function getInspections(): PropertyInspection[] {
  try {
    runDevStorageCleanup();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter out any legacy demo records
    const cleanList = parsed.filter((item) => !isLegacyDemoRecord(item));

    // If demo records were filtered out, rewrite storage
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

  // Add audit log
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

  // Queue for cloud sync if available
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

export function recordAuditLog(entry: AuditLogEntry): void {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    const logs: AuditLogEntry[] = raw ? JSON.parse(raw) : [];
    logs.unshift(entry);
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 500))); // Keep last 500
  } catch (err) {
    console.error('Error logging audit trail:', err);
  }
}

export function getAuditLogs(inspectionId?: string): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    const logs: AuditLogEntry[] = raw ? JSON.parse(raw) : [];
    if (inspectionId) {
      return logs.filter((l) => l.inspectionId === inspectionId);
    }
    return logs;
  } catch {
    return [];
  }
}

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
