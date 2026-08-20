import { getSupabaseClient } from './supabaseClient';

export interface FieldDraftRecord<T = any> {
  id?: string;
  visitId: string;
  caseId?: string;
  currentStep: number;
  status: 'BORRADOR' | 'COMPLETADA';
  snapshot: T;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

const clampStep = (value: number) => Math.max(1, Math.min(10, Number(value) || 1));

export async function getFieldDraftRemote<T = any>(visitId: string): Promise<FieldDraftRecord<T> | null> {
  const client = getSupabaseClient();
  if (!client || !visitId) return null;

  const { data, error } = await client
    .from('field_visit_drafts')
    .select('*')
    .eq('visit_id', visitId)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar el borrador remoto: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    visitId: data.visit_id,
    caseId: data.case_id || undefined,
    currentStep: clampStep(data.current_step),
    status: data.draft_status === 'COMPLETADA' ? 'COMPLETADA' : 'BORRADOR',
    snapshot: data.snapshot || {},
    updatedBy: data.updated_by || undefined,
    createdAt: data.created_at || undefined,
    updatedAt: data.updated_at || undefined,
  };
}

export async function saveFieldDraftRemote<T = any>(input: {
  visitId: string;
  caseId?: string;
  currentStep: number;
  status?: 'BORRADOR' | 'COMPLETADA';
  snapshot: T;
  userId?: string;
}): Promise<FieldDraftRecord<T>> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');
  if (!input.visitId) throw new Error('La visita no tiene un identificador válido.');

  const now = new Date().toISOString();
  const payload = {
    visit_id: input.visitId,
    case_id: input.caseId || null,
    current_step: clampStep(input.currentStep),
    draft_status: input.status || 'BORRADOR',
    snapshot: input.snapshot || {},
    updated_by: input.userId || null,
    updated_at: now,
  };

  const { data, error } = await client
    .from('field_visit_drafts')
    .upsert(payload, { onConflict: 'visit_id' })
    .select('*')
    .single();

  if (error) throw new Error(`No se pudo guardar el borrador remoto: ${error.message}`);

  return {
    id: data.id,
    visitId: data.visit_id,
    caseId: data.case_id || undefined,
    currentStep: clampStep(data.current_step),
    status: data.draft_status === 'COMPLETADA' ? 'COMPLETADA' : 'BORRADOR',
    snapshot: data.snapshot || {},
    updatedBy: data.updated_by || undefined,
    createdAt: data.created_at || undefined,
    updatedAt: data.updated_at || undefined,
  };
}

export function subscribeFieldDraftRemote(visitId: string, onChange: () => void): () => void {
  const client = getSupabaseClient();
  if (!client || !visitId) return () => {};
  const channel = client
    .channel(`sipre-field-draft-${visitId}-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'field_visit_drafts',
      filter: `visit_id=eq.${visitId}`,
    }, onChange)
    .subscribe();
  return () => { client.removeChannel(channel); };
}
