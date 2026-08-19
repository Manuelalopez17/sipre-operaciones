import { getSupabaseClient } from './supabaseClient';
import { MaterialRequestItem } from '../types';
import { deleteWorkFrontInDb } from './workFrontRemote';

function ensureAffected(rows: any[] | null, label: string) {
  if (!rows || rows.length === 0) {
    throw new Error(`${label}: Supabase no permitió modificar el registro. Revisa los permisos RLS del usuario.`);
  }
}

export async function updateTechnicalDecisionRemote(input: {
  id: string;
  decision: string;
  technicalJustification: string;
  proposedIntervention?: string;
  temporaryMeasures?: string;
  additionalStudies?: string;
}): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');
  const { data, error } = await client.from('technical_decisions').update({
    decision_type: input.decision,
    technical_rationale: input.technicalJustification.trim(),
    proposed_intervention: input.proposedIntervention?.trim() || null,
    temporary_measures: input.temporaryMeasures?.trim() || null,
    additional_studies: input.additionalStudies?.trim() || null,
    decided_at: new Date().toISOString(),
  }).eq('id', input.id).select('id');
  if (error) throw new Error(`No se pudo editar el concepto: ${error.message}`);
  ensureAffected(data, 'Editar concepto');
}

export async function deleteTechnicalDecisionTestFlow(input: {
  id: string;
  visitId?: string;
  caseId?: string;
}): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');

  // Remove derived work front first so its material/evidence dependencies are cleared.
  if (input.visitId) {
    const { data: frontRows, error: frontLookupError } = await client
      .from('work_fronts')
      .select('id')
      .eq('originating_visit_id', input.visitId);
    if (frontLookupError) throw new Error(`No se pudo revisar el frente derivado: ${frontLookupError.message}`);
    for (const front of frontRows || []) {
      await deleteWorkFrontInDb(front.id);
    }
  }

  // Remove approvals/material audit records linked to this concept/visit where permissions allow it.
  const { error: approvalDeleteError } = await client
    .from('activity_log')
    .delete()
    .eq('entity_type', 'client_approval')
    .eq('entity_id', input.id);
  if (approvalDeleteError) throw new Error(`No se pudo borrar la aprobación asociada: ${approvalDeleteError.message}`);

  const { data, error } = await client
    .from('technical_decisions')
    .delete()
    .eq('id', input.id)
    .select('id');
  if (error) throw new Error(`No se pudo borrar el concepto: ${error.message}`);
  ensureAffected(data, 'Borrar concepto');

  if (input.caseId) {
    // Return the case to a neutral post-visit state for another end-to-end test.
    await client.from('cases').update({ status: 'TECHNICAL_REVIEW', updated_at: new Date().toISOString() }).eq('id', input.caseId);
  }
}

export async function deleteClientApprovalRemote(decisionId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');
  const { data, error } = await client
    .from('activity_log')
    .delete()
    .eq('entity_type', 'client_approval')
    .eq('entity_id', decisionId)
    .select('id');
  if (error) throw new Error(`No se pudo borrar la aprobación: ${error.message}`);
  ensureAffected(data, 'Borrar aprobación');
}

export async function updateMaterialRequestRemote(input: {
  requestId: string;
  requiredDate?: string;
  urgency?: string;
  justification?: string;
  items: MaterialRequestItem[];
}): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');

  const { data: rows, error: readError } = await client
    .from('activity_log')
    .select('id, details')
    .eq('entity_type', 'material_request')
    .eq('entity_id', input.requestId)
    .order('created_at', { ascending: true })
    .limit(1);
  if (readError) throw new Error(`No se pudo leer la solicitud: ${readError.message}`);
  if (!rows?.length) throw new Error('No se encontró la solicitud remota para editar.');

  const current = typeof rows[0].details === 'object' && rows[0].details ? rows[0].details : {};
  const details = {
    ...current,
    requiredDate: input.requiredDate || null,
    urgency: input.urgency || current.urgency || 'Media',
    justification: input.justification?.trim() || '',
    items: input.items,
    editedAt: new Date().toISOString(),
  };

  const { data, error } = await client
    .from('activity_log')
    .update({ details, action: `Solicitud de materiales editada: ${current.requestCode || input.requestId}` })
    .eq('id', rows[0].id)
    .select('id');
  if (error) throw new Error(`No se pudo editar la solicitud: ${error.message}`);
  ensureAffected(data, 'Editar solicitud de materiales');
}

export async function deleteMaterialRequestRemote(requestId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');
  const { data, error } = await client
    .from('activity_log')
    .delete()
    .eq('entity_id', requestId)
    .in('entity_type', ['material_request', 'material_request_status'])
    .select('id');
  if (error) throw new Error(`No se pudo borrar la solicitud: ${error.message}`);
  ensureAffected(data, 'Borrar solicitud de materiales');
}

export async function updateWorkFrontDetailsRemote(input: {
  id: string;
  repairScope: string;
  plannedStartDate?: string;
  plannedCompletionDate?: string;
}): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');
  const { data, error } = await client.from('work_fronts').update({
    scope_description: input.repairScope.trim(),
    planned_start_date: input.plannedStartDate || null,
    planned_completion_date: input.plannedCompletionDate || null,
    updated_at: new Date().toISOString(),
  }).eq('id', input.id).select('id');
  if (error) throw new Error(`No se pudo editar el frente: ${error.message}`);
  ensureAffected(data, 'Editar frente de obra');
}
