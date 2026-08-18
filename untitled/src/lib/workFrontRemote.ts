import { getSupabaseClient } from './supabaseClient';
import { WorkFrontRecord, WorkFrontStatus } from '../types';

const CACHE_KEY = 'sipre_work_fronts_data';

function uiStatus(value?: string): WorkFrontStatus {
  const v = (value || '').toLowerCase();
  if (v === 'programmed' || v === 'scheduled' || v === 'programado') return 'PROGRAMADO';
  if (v === 'ready_to_start' || v === 'ready' || v === 'listo para iniciar') return 'LISTO PARA INICIAR';
  if (v === 'in_progress' || v === 'executing' || v === 'en ejecución') return 'EN EJECUCIÓN';
  if (v === 'suspended' || v === 'suspendido') return 'SUSPENDIDO';
  if (v === 'pending_handover' || v === 'pendiente de entrega') return 'PENDIENTE DE ENTREGA';
  if (v === 'delivered' || v === 'entregado') return 'ENTREGADO';
  if (v === 'closed' || v === 'cerrado') return 'CERRADO';
  return 'PENDIENTE';
}

function dbStatus(value?: WorkFrontStatus | string): string {
  switch ((value || '').toString().toUpperCase()) {
    case 'PROGRAMADO': return 'scheduled';
    case 'LISTO PARA INICIAR': return 'ready_to_start';
    case 'EN EJECUCIÓN': return 'in_progress';
    case 'SUSPENDIDO': return 'suspended';
    case 'PENDIENTE DE ENTREGA': return 'pending_handover';
    case 'ENTREGADO': return 'delivered';
    case 'CERRADO': return 'closed';
    default: return 'pending';
  }
}

function cache(fronts: WorkFrontRecord[]) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(fronts)); } catch { /* ignore */ }
}

export async function getWorkFrontsFromDb(): Promise<WorkFrontRecord[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data: rows, error } = await client
    .from('work_fronts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const caseIds = [...new Set((rows || []).map((r: any) => r.case_id).filter(Boolean))];
  const profileIds = [...new Set((rows || []).map((r: any) => r.responsible_professional_id).filter(Boolean))];

  const caseMap = new Map<string, any>();
  if (caseIds.length) {
    const { data } = await client.from('cases').select('id, case_code, client_name, address').in('id', caseIds);
    (data || []).forEach((c: any) => caseMap.set(c.id, c));
  }

  const profileMap = new Map<string, any>();
  if (profileIds.length) {
    const { data } = await client.from('profiles').select('id, full_name').in('id', profileIds);
    (data || []).forEach((p: any) => profileMap.set(p.id, p));
  }

  const fronts: WorkFrontRecord[] = (rows || []).map((r: any) => {
    const c = caseMap.get(r.case_id) || {};
    const p = profileMap.get(r.responsible_professional_id) || {};
    return {
      id: r.id,
      frontCode: r.front_code || r.id,
      caseId: r.case_id || '',
      caseCode: r.case_code || c.case_code || '',
      visitId: r.originating_visit_id || r.visit_id || undefined,
      propertyAddress: r.property_address || c.address || 'Dirección pendiente',
      clientName: r.client_name || c.client_name || 'Cliente',
      repairScope: r.scope_description || r.repair_scope || 'Intervención técnica',
      responsibleTechnicalProfessional: r.responsible_professional_name || p.full_name || 'Por asignar',
      fieldSupervisor: r.field_supervisor || 'Por asignar',
      plannedStartDate: r.planned_start_date || '',
      plannedCompletionDate: r.planned_completion_date || '',
      actualStartDate: r.actual_start_date || undefined,
      actualCompletionDate: r.actual_completion_date || undefined,
      status: uiStatus(r.status),
      progressCategory: r.progress_category || (uiStatus(r.status) === 'EN EJECUCIÓN' ? 'En proceso' : uiStatus(r.status) === 'ENTREGADO' || uiStatus(r.status) === 'CERRADO' ? 'Completado' : 'No iniciado'),
      createdAt: r.created_at || new Date().toISOString(),
      updatedAt: r.updated_at || r.created_at || new Date().toISOString(),
    } as WorkFrontRecord;
  });

  cache(fronts);
  return fronts;
}

export async function syncWorkFrontCacheFromDb(): Promise<WorkFrontRecord[]> {
  try {
    return await getWorkFrontsFromDb();
  } catch (err) {
    console.warn('Work-front cache sync error:', err);
    return [];
  }
}

export async function createWorkFrontFromVisitInDb(input: any): Promise<WorkFrontRecord> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');
  if (!input?.caseId) throw new Error('El frente debe estar vinculado a un expediente.');

  const { data: authData } = await client.auth.getUser();
  const currentUserId = authData?.user?.id || null;

  const { data: caseRow } = await client
    .from('cases')
    .select('id, case_code, property_id, client_name, address')
    .eq('id', input.caseId)
    .maybeSingle();

  let professionalId = input.responsibleTechnicalProfessionalId || null;
  if (!professionalId && input.responsibleTechnicalProfessional) {
    const { data: profileRow } = await client
      .from('profiles')
      .select('id')
      .ilike('full_name', input.responsibleTechnicalProfessional.trim())
      .limit(1)
      .maybeSingle();
    professionalId = profileRow?.id || null;
  }
  if (!professionalId && input.visitId) {
    const { data: visitRow } = await client
      .from('visits')
      .select('assigned_to')
      .eq('id', input.visitId)
      .maybeSingle();
    professionalId = visitRow?.assigned_to || null;
  }

  const year = new Date().getFullYear();
  const { count } = await client.from('work_fronts').select('*', { count: 'exact', head: true });
  const frontCode = `FO-${year}-${String((count || 0) + 1).padStart(4, '0')}`;
  const now = new Date().toISOString();

  const payload: any = {
    case_id: input.caseId,
    originating_visit_id: input.visitId || null,
    property_id: caseRow?.property_id || null,
    front_code: frontCode,
    scope_description: input.repairScope || input.scopeDescription || 'Intervención y reparación técnica',
    responsible_professional_id: professionalId,
    planned_start_date: input.plannedStartDate || null,
    planned_completion_date: input.plannedCompletionDate || null,
    status: 'pending',
    created_by: currentUserId,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await client.from('work_fronts').insert(payload).select().single();
  if (error) throw new Error(`No se pudo crear el frente de obra: ${error.message}`);

  const fronts = await getWorkFrontsFromDb();
  const created = fronts.find(f => f.id === data.id);
  if (created) return created;

  return {
    id: data.id,
    frontCode,
    caseId: input.caseId,
    caseCode: caseRow?.case_code || input.caseCode || '',
    visitId: input.visitId,
    propertyAddress: caseRow?.address || input.propertyAddress || '',
    clientName: caseRow?.client_name || input.clientName || '',
    repairScope: payload.scope_description,
    responsibleTechnicalProfessional: input.responsibleTechnicalProfessional || 'Por asignar',
    fieldSupervisor: input.fieldSupervisor || 'Por asignar',
    plannedStartDate: input.plannedStartDate || '',
    plannedCompletionDate: input.plannedCompletionDate || '',
    status: 'PENDIENTE',
    progressCategory: 'No iniciado',
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateWorkFrontStatusInDb(id: string, status: WorkFrontStatus): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');
  const { error } = await client.from('work_fronts').update({ status: dbStatus(status), updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
  await getWorkFrontsFromDb();
}

export async function deleteWorkFrontInDb(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');

  const { data: evidenceRows } = await client.from('evidence_files').select('storage_path').eq('work_front_id', id);
  const paths = (evidenceRows || []).map((row: any) => row.storage_path).filter(Boolean);
  if (paths.length) await client.storage.from('sipre-files').remove(paths);

  const { error: rpcError } = await client.rpc('sipre_delete_work_front', { p_work_front_id: id });
  if (rpcError) {
    const message = String(rpcError.message || '').toLowerCase();
    const functionMissing = message.includes('sipre_delete_work_front') && (message.includes('not found') || message.includes('schema cache') || message.includes('function'));
    if (!functionMissing) throw new Error(rpcError.message);

    const { error } = await client.from('work_fronts').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  await getWorkFrontsFromDb();
}

export function subscribeWorkFrontsRealtime(onChange: () => void): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};
  const channel = client.channel(`sipre-work-fronts-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'work_fronts' }, onChange)
    .subscribe();
  return () => { client.removeChannel(channel); };
}
