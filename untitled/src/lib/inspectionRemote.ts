import { getSupabaseClient } from './supabaseClient';
import { PropertyInspection } from '../types';

export interface RemoteInspectionSnapshot {
  id: string;
  inspectionId: string;
  visitId?: string;
  caseId?: string;
  snapshot: PropertyInspection;
  updatedAt: string;
}

const migrationKey = (inspection: PropertyInspection) => `sipre_remote_snapshot_${inspection.id}_${inspection.updatedAt || inspection.createdAt || ''}`;

export async function saveInspectionSnapshotRemote(inspection: PropertyInspection, userId?: string, userName?: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');
  const now = new Date().toISOString();
  const payload = {
    id: `inspection-snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user_id: userId || null,
    user_name: userName || inspection.inspectorName || 'Profesional SIPRE',
    user_role: 'Profesional',
    action: 'Snapshot completo de inspección guardado',
    entity_type: 'inspection_snapshot',
    entity_id: inspection.id,
    case_id: inspection.caseId || null,
    visit_id: inspection.visitId || null,
    details: {
      snapshot: inspection,
      source: 'sipre_full_inspection_snapshot',
      version: 1,
    },
    created_at: now,
  };
  const { error } = await client.from('activity_log').insert(payload);
  if (error) throw new Error(`No se pudo guardar el informe completo en Supabase: ${error.message}`);
}

export async function getInspectionSnapshotsRemote(): Promise<RemoteInspectionSnapshot[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from('activity_log').select('*').eq('entity_type', 'inspection_snapshot').order('created_at', { ascending: false });
  if (error) throw new Error(`No se pudieron cargar los informes remotos: ${error.message}`);

  const latestByInspection = new Map<string, RemoteInspectionSnapshot>();
  for (const row of data || []) {
    const inspectionId = row.entity_id || row.details?.snapshot?.id;
    if (!inspectionId || latestByInspection.has(inspectionId)) continue;
    latestByInspection.set(inspectionId, {
      id: row.id,
      inspectionId,
      visitId: row.visit_id || row.details?.snapshot?.visitId || undefined,
      caseId: row.case_id || row.details?.snapshot?.caseId || undefined,
      snapshot: row.details?.snapshot || row.details || {},
      updatedAt: row.created_at || new Date().toISOString(),
    });
  }
  return [...latestByInspection.values()];
}

export async function getInspectionSnapshotByVisit(visitId: string): Promise<PropertyInspection | null> {
  const client = getSupabaseClient();
  if (!client || !visitId) return null;
  const { data, error } = await client.from('activity_log').select('*').eq('entity_type', 'inspection_snapshot').eq('visit_id', visitId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.details?.snapshot || data?.details || null;
}

export async function migrateLocalInspectionSnapshots(inspections: PropertyInspection[], userId?: string, userName?: string): Promise<number> {
  let migrated = 0;
  for (const inspection of inspections || []) {
    try {
      const key = migrationKey(inspection);
      if (typeof window !== 'undefined' && localStorage.getItem(key) === 'true') continue;
      await saveInspectionSnapshotRemote(inspection, userId, userName);
      if (typeof window !== 'undefined') localStorage.setItem(key, 'true');
      migrated += 1;
    } catch (err) {
      console.warn('Could not migrate local inspection snapshot:', inspection.id, err);
    }
  }
  return migrated;
}

export function subscribeInspectionSnapshots(onChange: () => void): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};
  const channel = client.channel(`sipre-inspection-snapshots-${Math.random().toString(36).slice(2)}`).on('postgres_changes', { event: '*', schema: 'public', table: 'activity_log' }, onChange).subscribe();
  return () => { client.removeChannel(channel); };
}
