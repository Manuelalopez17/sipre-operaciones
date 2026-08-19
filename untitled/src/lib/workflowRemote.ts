import { getSupabaseClient } from './supabaseClient';
import { MaterialRequestItem, MaterialRequestStatus } from '../types';

export interface RemoteTechnicalDecision {
  id: string;
  caseId: string;
  visitId?: string;
  decision: string;
  technicalJustification: string;
  proposedIntervention?: string;
  temporaryMeasures?: string;
  additionalStudies?: string;
  responsibleProfessional?: string;
  date?: string;
  createdAt?: string;
}

export interface RemoteClientApproval {
  id: string;
  decisionId: string;
  caseId?: string;
  visitId?: string;
  status: string;
  clientRepresentativeName: string;
  observations: string;
  date: string;
  createdBy?: string;
  createdAt: string;
}

export interface RemoteMaterialRequest {
  id: string;
  requestCode: string;
  caseId?: string;
  caseCode?: string;
  workFrontId: string;
  workFrontCode?: string;
  requestedBy: string;
  requestDate: string;
  requiredDate?: string;
  urgency?: 'Baja' | 'Media' | 'Alta' | 'Urgente';
  justification?: string;
  status: MaterialRequestStatus;
  items: MaterialRequestItem[];
  createdAt: string;
  updatedAt: string;
}

const newId = () => (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
  ? crypto.randomUUID()
  : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);

const asDetails = (value: any): any => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return {}; }
};

export async function getTechnicalDecisionsRemote(): Promise<RemoteTechnicalDecision[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('technical_decisions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`No se pudieron cargar los conceptos técnicos: ${error.message}`);

  return (data || []).map((row: any) => ({
    id: row.id,
    caseId: row.case_id || row.caseId || '',
    visitId: row.visit_id || row.visitId || undefined,
    decision: row.decision_type || row.decision || '',
    technicalJustification: row.technical_rationale || row.technical_justification || row.technicalJustification || '',
    proposedIntervention: row.proposed_intervention || row.proposedIntervention || '',
    temporaryMeasures: row.temporary_measures || row.temporaryMeasures || '',
    additionalStudies: row.additional_studies || row.additionalStudies || '',
    responsibleProfessional: row.decided_by || row.responsible_professional || row.responsibleProfessional || '',
    date: row.decided_at || row.date || row.created_at || '',
    createdAt: row.created_at || row.decided_at || '',
  }));
}

export async function saveTechnicalDecisionRemote(input: {
  caseId: string;
  visitId: string;
  decision: string;
  technicalJustification: string;
  proposedIntervention?: string;
  temporaryMeasures?: string;
  additionalStudies?: string;
  responsibleProfessional: string;
  userId?: string;
}): Promise<RemoteTechnicalDecision> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');

  const id = newId();
  const now = new Date().toISOString();
  const payload = {
    id,
    case_id: input.caseId,
    visit_id: input.visitId,
    decision_type: input.decision,
    technical_rationale: input.technicalJustification.trim(),
    proposed_intervention: input.proposedIntervention?.trim() || null,
    temporary_measures: input.temporaryMeasures?.trim() || null,
    additional_studies: input.additionalStudies?.trim() || null,
    decided_by: input.responsibleProfessional,
    decided_at: now,
    created_at: now,
  };

  const { data, error } = await client
    .from('technical_decisions')
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(`No se pudo guardar el concepto técnico: ${error.message}`);

  if (input.caseId) {
    const nextStatus = String(input.decision).toUpperCase() === 'REQUIERE INTERVENCIÓN'
      ? 'CLIENT_APPROVAL'
      : 'INTERVENTION_DECISION';
    const { error: caseError } = await client
      .from('cases')
      .update({ status: nextStatus, updated_at: now })
      .eq('id', input.caseId);
    if (caseError) console.warn('No se pudo actualizar el estado del expediente:', caseError.message);
  }

  try {
    await client.from('activity_log').insert({
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      user_id: input.userId || null,
      user_name: input.responsibleProfessional,
      user_role: 'Profesional',
      action: `Concepto técnico emitido: ${input.decision}`,
      entity_type: 'technical_decision',
      entity_id: id,
      case_id: input.caseId,
      visit_id: input.visitId,
      details: { decision: input.decision },
      created_at: now,
    });
  } catch { /* audit is secondary to the technical decision */ }

  return {
    id: data.id,
    caseId: data.case_id,
    visitId: data.visit_id,
    decision: data.decision_type,
    technicalJustification: data.technical_rationale,
    proposedIntervention: data.proposed_intervention || '',
    temporaryMeasures: data.temporary_measures || '',
    additionalStudies: data.additional_studies || '',
    responsibleProfessional: data.decided_by || input.responsibleProfessional,
    date: data.decided_at || now,
    createdAt: data.created_at || now,
  };
}

export async function getClientApprovalsRemote(): Promise<RemoteClientApproval[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('activity_log')
    .select('*')
    .eq('entity_type', 'client_approval')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`No se pudieron cargar las aprobaciones: ${error.message}`);

  return (data || []).map((row: any) => {
    const details = asDetails(row.details);
    return {
      id: row.id,
      decisionId: details.decisionId || row.entity_id || '',
      caseId: row.case_id || details.caseId || undefined,
      visitId: row.visit_id || details.visitId || undefined,
      status: details.status || 'Pendiente',
      clientRepresentativeName: details.clientRepresentativeName || '',
      observations: details.observations || '',
      date: details.date || row.created_at?.slice(0, 10) || '',
      createdBy: row.user_name || '',
      createdAt: row.created_at || new Date().toISOString(),
    } as RemoteClientApproval;
  });
}

export async function saveClientApprovalRemote(input: {
  decisionId: string;
  caseId?: string;
  visitId?: string;
  status: string;
  clientRepresentativeName: string;
  observations: string;
  date: string;
  userId?: string;
  userName?: string;
  userRole?: string;
}): Promise<RemoteClientApproval> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');
  const now = new Date().toISOString();
  const id = `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const details = {
    decisionId: input.decisionId,
    caseId: input.caseId || null,
    visitId: input.visitId || null,
    status: input.status,
    clientRepresentativeName: input.clientRepresentativeName.trim(),
    observations: input.observations.trim(),
    date: input.date,
  };

  const { error } = await client.from('activity_log').insert({
    id,
    user_id: input.userId || null,
    user_name: input.userName || 'Coordinación SIPRE',
    user_role: input.userRole || 'Coordinador',
    action: `Decisión del cliente registrada: ${input.status}`,
    entity_type: 'client_approval',
    entity_id: input.decisionId,
    case_id: input.caseId || null,
    visit_id: input.visitId || null,
    details,
    created_at: now,
  });
  if (error) throw new Error(`No se pudo guardar la aprobación del cliente: ${error.message}`);

  return {
    id,
    decisionId: input.decisionId,
    caseId: input.caseId,
    visitId: input.visitId,
    status: input.status,
    clientRepresentativeName: input.clientRepresentativeName.trim(),
    observations: input.observations.trim(),
    date: input.date,
    createdBy: input.userName,
    createdAt: now,
  };
}

export async function getRemoteMaterialRequests(): Promise<RemoteMaterialRequest[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('activity_log')
    .select('*')
    .in('entity_type', ['material_request', 'material_request_status'])
    .order('created_at', { ascending: true });
  if (error) throw new Error(`No se pudieron cargar las solicitudes de materiales: ${error.message}`);

  const requests = new Map<string, RemoteMaterialRequest>();
  for (const row of data || []) {
    const details = asDetails(row.details);
    const requestId = row.entity_id || details.requestId;
    if (!requestId) continue;
    if (row.entity_type === 'material_request') {
      requests.set(requestId, {
        id: requestId,
        requestCode: details.requestCode || requestId,
        caseId: row.case_id || details.caseId || undefined,
        caseCode: details.caseCode || undefined,
        workFrontId: row.work_front_id || details.workFrontId || '',
        workFrontCode: details.workFrontCode || undefined,
        requestedBy: details.requestedBy || row.user_name || '',
        requestDate: details.requestDate || row.created_at?.slice(0, 10) || '',
        requiredDate: details.requiredDate || undefined,
        urgency: details.urgency || 'Media',
        justification: details.justification || '',
        status: (details.status || 'SOLICITADO') as MaterialRequestStatus,
        items: Array.isArray(details.items) ? details.items : [],
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.created_at || new Date().toISOString(),
      });
    } else if (row.entity_type === 'material_request_status') {
      const existing = requests.get(requestId);
      if (existing) {
        existing.status = (details.status || existing.status) as MaterialRequestStatus;
        existing.updatedAt = row.created_at || existing.updatedAt;
      }
    }
  }
  return [...requests.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createRemoteMaterialRequest(input: {
  caseId?: string;
  caseCode?: string;
  workFrontId: string;
  workFrontCode?: string;
  requestedBy: string;
  requiredDate?: string;
  urgency?: 'Baja' | 'Media' | 'Alta' | 'Urgente';
  justification?: string;
  items: MaterialRequestItem[];
  userId?: string;
  userRole?: string;
}): Promise<RemoteMaterialRequest> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');
  const requestId = `MR-${newId()}`;
  const now = new Date().toISOString();
  const requestCode = `SOL-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  const requestDate = now.slice(0, 10);
  const details = {
    requestId,
    requestCode,
    caseId: input.caseId || null,
    caseCode: input.caseCode || null,
    workFrontId: input.workFrontId,
    workFrontCode: input.workFrontCode || null,
    requestedBy: input.requestedBy,
    requestDate,
    requiredDate: input.requiredDate || null,
    urgency: input.urgency || 'Media',
    justification: input.justification?.trim() || '',
    status: 'SOLICITADO',
    items: input.items,
  };

  const { error } = await client.from('activity_log').insert({
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user_id: input.userId || null,
    user_name: input.requestedBy,
    user_role: input.userRole || 'Profesional',
    action: `Solicitud de materiales creada: ${requestCode}`,
    entity_type: 'material_request',
    entity_id: requestId,
    case_id: input.caseId || null,
    work_front_id: input.workFrontId,
    details,
    created_at: now,
  });
  if (error) throw new Error(`No se pudo crear la solicitud de materiales: ${error.message}`);

  return {
    id: requestId,
    requestCode,
    caseId: input.caseId,
    caseCode: input.caseCode,
    workFrontId: input.workFrontId,
    workFrontCode: input.workFrontCode,
    requestedBy: input.requestedBy,
    requestDate,
    requiredDate: input.requiredDate,
    urgency: input.urgency || 'Media',
    justification: input.justification || '',
    status: 'SOLICITADO',
    items: input.items,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateRemoteMaterialRequestStatus(input: {
  requestId: string;
  workFrontId?: string;
  caseId?: string;
  status: MaterialRequestStatus;
  userId?: string;
  userName?: string;
  userRole?: string;
}): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');
  const now = new Date().toISOString();
  const { error } = await client.from('activity_log').insert({
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user_id: input.userId || null,
    user_name: input.userName || 'Operativo SIPRE',
    user_role: input.userRole || 'Operativo',
    action: `Estado de materiales actualizado: ${input.status}`,
    entity_type: 'material_request_status',
    entity_id: input.requestId,
    case_id: input.caseId || null,
    work_front_id: input.workFrontId || null,
    details: { requestId: input.requestId, status: input.status },
    created_at: now,
  });
  if (error) throw new Error(`No se pudo actualizar la solicitud: ${error.message}`);
}

export function subscribeWorkflowRemote(onChange: () => void): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};
  const channel = client
    .channel(`sipre-workflow-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'technical_decisions' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_log' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'work_fronts' }, onChange)
    .subscribe();
  return () => { client.removeChannel(channel); };
}
