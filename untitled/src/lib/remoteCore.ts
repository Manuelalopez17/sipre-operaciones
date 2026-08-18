import { getSupabaseClient } from './supabaseClient';
import { CaseRecord, CaseStatus, VisitRecord, VisitStatus } from '../types';

const uuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
};

async function activeEmergencyId(): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.from('emergencies').select('id').eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (data?.id) return data.id;
  const { data: latest } = await client.from('emergencies').select('id').order('created_at', { ascending: false }).limit(1).maybeSingle();
  return latest?.id || null;
}

export async function getCasesFromDb(): Promise<CaseRecord[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from('cases').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map((c: any) => ({
    id: c.id,
    code: c.case_code || c.id,
    requestDate: c.request_date || c.created_at?.slice(0,10) || new Date().toISOString().slice(0,10),
    clientName: c.client_name || c.client || '',
    contactPerson: c.contact_person || '',
    phone: c.phone || '',
    email: c.email || '',
    address: c.address || '',
    municipality: c.municipality || '',
    department: c.department || '',
    neighborhood: c.neighborhood || '',
    propertyType: c.property_type || 'Edificio',
    caseType: c.case_type || 'Inspección',
    priority: c.priority || 'Normal',
    requestDescription: c.request_description || c.description || '',
    responsibleCoordinator: c.responsible_coordinator || '',
    status: (c.status || 'NEW_CASE') as CaseStatus,
    createdAt: c.created_at || new Date().toISOString(),
    updatedAt: c.updated_at || new Date().toISOString(),
  }));
}

export async function createCaseInDb(input: {
  clientName: string; contactPerson: string; phone: string; email: string;
  address: string; municipality: string; department?: string; neighborhood: string;
  propertyType: string; caseType: string; priority: string; requestDescription: string;
  responsibleCoordinator: string; createdBy?: string; emergencyId?: string;
}): Promise<CaseRecord> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');
  const emergencyId = input.emergencyId || await activeEmergencyId();
  if (!emergencyId) throw new Error('Primero debes configurar una emergencia activa en SIPRE.');

  let propertyId: string | null = null;
  const { data: existing } = await client.from('properties').select('id').eq('emergency_id', emergencyId).ilike('address', input.address.trim()).ilike('municipality', input.municipality.trim()).limit(1).maybeSingle();
  if (existing?.id) {
    propertyId = existing.id;
  } else {
    const pid = uuid();
    const { data: prop, error: propError } = await client.from('properties').insert({
      id: pid,
      emergency_id: emergencyId,
      address: input.address.trim(),
      neighborhood: input.neighborhood.trim(),
      municipality: input.municipality.trim(),
      department: input.department || '',
      property_type: input.propertyType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select('id').single();
    if (propError) throw new Error(`No se pudo crear el predio: ${propError.message}`);
    propertyId = prop.id;
  }

  const year = new Date().getFullYear();
  const { count } = await client.from('cases').select('*', { count: 'exact', head: true });
  const caseCode = `SIPRE-${year}-${String((count || 0) + 1).padStart(6, '0')}`;
  const id = uuid();
  const now = new Date().toISOString();
  const { data, error } = await client.from('cases').insert({
    id,
    emergency_id: emergencyId,
    property_id: propertyId,
    case_code: caseCode,
    client_name: input.clientName.trim(),
    contact_person: input.contactPerson.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    address: input.address.trim(),
    municipality: input.municipality.trim(),
    department: input.department || '',
    neighborhood: input.neighborhood.trim(),
    property_type: input.propertyType,
    case_type: input.caseType,
    priority: input.priority,
    request_description: input.requestDescription.trim(),
    responsible_coordinator: input.responsibleCoordinator.trim(),
    status: 'NEW_CASE',
    created_by: input.createdBy || null,
    request_date: now.slice(0,10),
    created_at: now,
    updated_at: now,
  }).select().single();
  if (error) throw new Error(`No se pudo crear el expediente: ${error.message}`);

  return {
    id: data.id,
    code: data.case_code,
    requestDate: data.request_date || now.slice(0,10),
    clientName: data.client_name,
    contactPerson: data.contact_person || '',
    phone: data.phone || '',
    email: data.email || '',
    address: data.address,
    municipality: data.municipality,
    department: data.department || '',
    neighborhood: data.neighborhood || '',
    propertyType: data.property_type || 'Edificio',
    caseType: data.case_type || 'Inspección',
    priority: data.priority || 'Normal',
    requestDescription: data.request_description || '',
    responsibleCoordinator: data.responsible_coordinator || '',
    status: (data.status || 'NEW_CASE') as CaseStatus,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getVisitsFromDb(): Promise<VisitRecord[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from('visits').select('*').order('date', { ascending: true }).order('start_time', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map((v: any) => ({
    id: v.id,
    caseId: v.case_id,
    caseCode: v.case_code || '',
    date: v.date || v.scheduled_start?.slice(0,10) || '',
    startTime: v.start_time || (v.scheduled_start ? new Date(v.scheduled_start).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : ''),
    estimatedEndTime: v.estimated_end_time || '',
    clientName: v.client_name || '',
    address: v.address || v.location || '',
    municipality: v.municipality || '',
    neighborhood: v.neighborhood || '',
    department: v.department || '',
    propertyType: v.property_type || 'Edificio',
    responsibleProfessional: v.responsible_professional || '',
    assignedTeam: v.assigned_team || '',
    visitReason: v.visit_reason || v.visit_type || '',
    visitObjective: v.visit_objective || v.objective || '',
    preparationObservations: v.preparation_observations || '',
    priority: v.priority || 'Normal',
    status: (v.status || 'PROGRAMADA') as VisitStatus,
    enRouteAt: v.en_route_at,
    onSiteAt: v.on_site_at,
    inspectionStartedAt: v.inspection_started_at,
    completedAt: v.check_out_at,
    createdAt: v.created_at || new Date().toISOString(),
    updatedAt: v.updated_at || new Date().toISOString(),
    ...(v.assigned_to ? { responsibleProfessionalId: v.assigned_to } : {}),
  } as any));
}

export async function createVisitInDb(input: {
  caseId: string; caseCode?: string; date: string; startTime: string; estimatedEndTime: string;
  clientName: string; address: string; municipality: string; neighborhood?: string; propertyType: string;
  responsibleProfessionalId: string; responsibleProfessionalName: string; assignedTeam?: string;
  visitReason?: string; visitObjective: string; preparationObservations?: string; priority?: string; createdBy?: string;
}): Promise<VisitRecord> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');
  if (!input.caseId) throw new Error('La visita debe pertenecer a un expediente.');
  const year = new Date().getFullYear();
  const { count } = await client.from('visits').select('*', { count: 'exact', head: true });
  const visitCode = `VIS-${year}-${String((count || 0) + 1).padStart(6, '0')}`;
  const id = uuid();
  const now = new Date().toISOString();
  const start = new Date(`${input.date}T${input.startTime}:00`).toISOString();
  const end = new Date(`${input.date}T${input.estimatedEndTime}:00`).toISOString();
  const { data, error } = await client.from('visits').insert({
    id,
    visit_code: visitCode,
    case_id: input.caseId,
    case_code: input.caseCode || null,
    visit_type: input.visitReason || 'technical_inspection',
    scheduled_start: start,
    scheduled_end: end,
    date: input.date,
    start_time: input.startTime,
    estimated_end_time: input.estimatedEndTime,
    location: input.address.trim(),
    client_name: input.clientName.trim(),
    address: input.address.trim(),
    municipality: input.municipality.trim(),
    neighborhood: input.neighborhood || '',
    property_type: input.propertyType,
    assigned_to: input.responsibleProfessionalId,
    responsible_professional: input.responsibleProfessionalName,
    assigned_team: input.assignedTeam || '',
    visit_reason: input.visitReason || 'Inspección',
    visit_objective: input.visitObjective || '',
    objective: input.visitObjective || '',
    preparation_observations: input.preparationObservations || '',
    priority: input.priority || 'Normal',
    status: 'PROGRAMADA',
    created_by: input.createdBy || null,
    created_at: now,
    updated_at: now,
  }).select().single();
  if (error) throw new Error(`No se pudo programar la visita: ${error.message}`);

  const { error: assignError } = await client.from('visit_assignments').insert({
    id: uuid(),
    visit_id: id,
    user_id: input.responsibleProfessionalId,
    professional_name: input.responsibleProfessionalName,
    role_in_visit: 'Líder de Inspección',
    assignment_status: 'assigned',
    created_at: now,
  });
  if (assignError) console.warn('La visita se creó, pero la asignación adicional reportó:', assignError.message);

  return (await getVisitsFromDb()).find(v => v.id === data.id) || ({
    id: data.id, caseId: data.case_id, caseCode: data.case_code || '', date: data.date,
    startTime: data.start_time, estimatedEndTime: data.estimated_end_time,
    clientName: data.client_name, address: data.address, municipality: data.municipality,
    neighborhood: data.neighborhood || '', department: data.department || '', propertyType: data.property_type || 'Edificio',
    responsibleProfessional: data.responsible_professional, assignedTeam: data.assigned_team || '',
    visitReason: data.visit_reason || '', visitObjective: data.visit_objective || '', preparationObservations: data.preparation_observations || '',
    priority: data.priority || 'Normal', status: data.status as VisitStatus, createdAt: data.created_at, updatedAt: data.updated_at,
  } as VisitRecord);
}

export function subscribeVisitsRealtime(onChange: () => void): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};
  const channel = client.channel(`sipre-visits-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'visit_assignments' }, onChange)
    .subscribe();
  return () => { client.removeChannel(channel); };
}
