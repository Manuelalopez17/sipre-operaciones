import { getSupabaseClient } from './supabaseClient';
import {
  UserProfile,
  EmergencyRecord,
  PropertyRecord,
  CaseRecord,
  CaseStatus,
  VisitRecord,
  VisitStatus,
  VisitAssignmentRecord,
  FindingRecord,
  EvidenceFileRecord,
  ActivityLogEntry,
  VisitAssessmentRecord,
  TechnicalDecisionRecord,
  RepairItemRecord,
  ClientApprovalRecord,
  WorkFrontRecord,
  MaterialRequestRecord,
  MaterialDeliveryRecord,
  WorkLogRecord,
  ClientHandoverRecord,
  BillingRecord,
  PaymentRecord,
  CollectionActionRecord,
  ReportRecord
} from '../types';

/**
 * Log operational events to activity_log table in Supabase
 */
export async function recordActivity(
  action: string,
  details?: any,
  context?: {
    userId?: string;
    userName?: string;
    userRole?: string;
    caseId?: string;
    visitId?: string;
    workFrontId?: string;
    entityType?: string;
    entityId?: string;
  }
): Promise<void> {
  const client = getSupabaseClient();
  const entry: ActivityLogEntry = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: context?.userId,
    user_name: context?.userName || 'Usuario Operativo',
    user_role: context?.userRole || 'Operador',
    action,
    entity_type: context?.entityType,
    entity_id: context?.entityId,
    case_id: context?.caseId,
    visit_id: context?.visitId,
    work_front_id: context?.workFrontId,
    details: details || {},
    created_at: new Date().toISOString(),
  };

  if (client) {
    try {
      await client.from('activity_log').insert(entry);
    } catch (err) {
      console.warn('Activity log DB insert error (fallback to local):', err);
    }
  }

  // Also save to local storage for instant audit trail
  try {
    const raw = localStorage.getItem('sipre_activity_logs');
    const logs = raw ? JSON.parse(raw) : [];
    logs.unshift(entry);
    localStorage.setItem('sipre_activity_logs', JSON.stringify(logs.slice(0, 300)));
  } catch {
    // ignore
  }
}

// -------------------------------------------------------------
// 1. PROFILES
// -------------------------------------------------------------

export async function getActiveProfiles(): Promise<UserProfile[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) {
      console.warn('Error fetching profiles from Supabase:', error.message);
      return [];
    }

    return (data || []).map((p: any) => ({
      id: p.id,
      full_name: p.full_name || p.name || 'Profesional SIPRE',
      role: p.role || 'inspector',
      professional_license: p.professional_license || p.license || '',
      organization: p.organization || '',
      email: p.email || '',
      phone: p.phone || '',
      active: p.active !== false,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));
  } catch (err) {
    console.warn('Profiles query error:', err);
    return [];
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const client = getSupabaseClient();
  if (!client || !userId) return null;

  try {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      full_name: data.full_name || data.name || 'Usuario',
      role: data.role || 'inspector',
      professional_license: data.professional_license || '',
      organization: data.organization || '',
      email: data.email || '',
      phone: data.phone || '',
      active: data.active !== false,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (err) {
    console.warn('Get user profile error:', err);
    return null;
  }
}

export async function upsertUserProfile(profile: Partial<UserProfile> & { id: string }): Promise<UserProfile | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const payload = {
      id: profile.id,
      full_name: profile.full_name,
      role: profile.role,
      professional_license: profile.professional_license,
      organization: profile.organization,
      email: profile.email,
      phone: profile.phone,
      active: profile.active !== false,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('profiles')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.warn('Upsert profile error:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('Upsert profile error:', err);
    return null;
  }
}

// -------------------------------------------------------------
// 2. EMERGENCIES
// -------------------------------------------------------------

export async function getActiveEmergency(): Promise<EmergencyRecord | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('emergencies')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      // Try fetching the latest emergency even if is_active flag not explicitly set
      const { data: latest } = await client
        .from('emergencies')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return latest || null;
    }

    return data;
  } catch (err) {
    console.warn('Get active emergency error:', err);
    return null;
  }
}

export async function createEmergencyInDb(emergency: Omit<EmergencyRecord, 'id'> & { id?: string }): Promise<EmergencyRecord | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const id = emergency.id || `EMG-${Date.now().toString(36).toUpperCase()}`;
    const payload = {
      id,
      name: emergency.name,
      event_type: emergency.event_type,
      date: emergency.date,
      department: emergency.department,
      municipality: emergency.municipality,
      description: emergency.description,
      is_active: emergency.is_active !== false,
      created_by: emergency.created_by,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('emergencies')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.warn('Create emergency error:', error.message);
      return null;
    }

    await recordActivity('Emergencia configurada', { name: emergency.name, event_type: emergency.event_type }, {
      userId: emergency.created_by,
      entityType: 'emergency',
      entityId: id,
    });

    return data;
  } catch (err) {
    console.warn('Create emergency error:', err);
    return null;
  }
}

// -------------------------------------------------------------
// 3. PROPERTIES & CASES
// -------------------------------------------------------------

export async function getOrCreateProperty(property: {
  address: string;
  municipality: string;
  department?: string;
  neighborhood?: string;
  propertyType?: string;
  buildingUse?: string;
  floors?: number;
  approxAreaM2?: number;
  structuralSystem?: string;
  gps?: any;
}): Promise<PropertyRecord | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    // Check if property exists with same address and municipality
    const { data: existing } = await client
      .from('properties')
      .select('*')
      .ilike('address', property.address.trim())
      .ilike('municipality', property.municipality.trim())
      .limit(1)
      .maybeSingle();

    if (existing) {
      return existing;
    }

    const id = `PROP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const payload = {
      id,
      address: property.address.trim(),
      neighborhood: property.neighborhood || '',
      municipality: property.municipality.trim(),
      department: property.department || 'Antioquia',
      property_type: property.propertyType || 'Casa',
      building_use: property.buildingUse || '',
      floors: property.floors || 1,
      approx_area_m2: property.approxAreaM2 || null,
      structural_system: property.structuralSystem || 'Mampostería Confinada',
      gps: property.gps || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client.from('properties').insert(payload).select().single();
    if (error) {
      console.warn('Property insert error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Property create error:', err);
    return null;
  }
}

export async function getCasesFromDb(): Promise<CaseRecord[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching cases from Supabase:', error.message);
      return [];
    }

    return (data || []).map((c: any) => ({
      id: c.id || c.case_code,
      code: c.case_code || c.id,
      requestDate: c.request_date || c.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      clientName: c.client_name || c.client || '',
      contactPerson: c.contact_person || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      municipality: c.municipality || 'Medellín',
      department: c.department || 'Antioquia',
      neighborhood: c.neighborhood || '',
      propertyType: c.property_type || 'Casa',
      caseType: c.case_type || 'Inspección',
      priority: c.priority || 'Normal',
      requestDescription: c.request_description || c.description || '',
      responsibleCoordinator: c.responsible_coordinator || c.coordinator_name || 'Coordinador Técnico',
      status: (c.status || 'NEW_CASE') as CaseStatus,
      createdAt: c.created_at || new Date().toISOString(),
      updatedAt: c.updated_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('Cases query error:', err);
    return [];
  }
}

export async function createCaseInDb(caseData: {
  clientName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  municipality: string;
  department?: string;
  neighborhood: string;
  propertyType: string;
  caseType: string;
  priority: string;
  requestDescription: string;
  responsibleCoordinator: string;
  createdBy?: string;
  emergencyId?: string;
}): Promise<CaseRecord | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    // 1. Create or link property
    const property = await getOrCreateProperty({
      address: caseData.address,
      municipality: caseData.municipality,
      department: caseData.department,
      neighborhood: caseData.neighborhood,
      propertyType: caseData.propertyType,
    });

    // 2. Determine next sequential case code from real DB count
    const year = new Date().getFullYear();
    const { count } = await client.from('cases').select('*', { count: 'exact', head: true });
    const nextSeq = (count || 0) + 1;
    const caseCode = `SIPRE-${year}-${nextSeq.toString().padStart(6, '0')}`;

    const payload = {
      id: caseCode,
      case_code: caseCode,
      client_name: caseData.clientName,
      contact_person: caseData.contactPerson,
      phone: caseData.phone,
      email: caseData.email,
      address: caseData.address,
      municipality: caseData.municipality,
      department: caseData.department || 'Antioquia',
      neighborhood: caseData.neighborhood,
      property_id: property?.id || null,
      property_type: caseData.propertyType,
      case_type: caseData.caseType,
      priority: caseData.priority,
      request_description: caseData.requestDescription,
      responsible_coordinator: caseData.responsibleCoordinator,
      status: 'NEW_CASE',
      created_by: caseData.createdBy || null,
      emergency_id: caseData.emergencyId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client.from('cases').insert(payload).select().single();
    if (error) {
      console.warn('Case insert error:', error.message);
      return null;
    }

    await recordActivity('Nuevo Expediente Creado', { caseCode, client: caseData.clientName }, {
      userId: caseData.createdBy,
      caseId: caseCode,
      entityType: 'case',
      entityId: caseCode,
    });

    return {
      id: data.id,
      code: data.case_code,
      requestDate: data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      clientName: data.client_name,
      contactPerson: data.contact_person,
      phone: data.phone,
      email: data.email,
      address: data.address,
      municipality: data.municipality,
      department: data.department,
      neighborhood: data.neighborhood,
      propertyType: data.property_type,
      caseType: data.case_type,
      priority: data.priority,
      requestDescription: data.request_description,
      responsibleCoordinator: data.responsible_coordinator,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.warn('Create case error:', err);
    return null;
  }
}

export async function updateCaseStatusInDb(caseId: string, newStatus: CaseStatus, userRole = 'Coordinador', notes?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('cases')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .or(`id.eq.${caseId},case_code.eq.${caseId}`);

    if (error) {
      console.warn('Update case status error:', error.message);
      return false;
    }

    await recordActivity(`Estado de expediente actualizado a ${newStatus}`, { notes }, {
      userRole,
      caseId,
      entityType: 'case',
      entityId: caseId,
    });

    return true;
  } catch (err) {
    console.warn('Update case status error:', err);
    return false;
  }
}

// -------------------------------------------------------------
// 4. VISITS & ASSIGNMENTS
// -------------------------------------------------------------

export async function getVisitsFromDb(): Promise<VisitRecord[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('visits')
      .select('*')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.warn('Error fetching visits from Supabase:', error.message);
      return [];
    }

    return (data || []).map((v: any) => ({
      id: v.id || v.visit_code,
      caseId: v.case_id,
      caseCode: v.case_code || v.case_id,
      date: v.date,
      startTime: v.start_time || '08:00',
      estimatedEndTime: v.estimated_end_time || '10:00',
      clientName: v.client_name || '',
      address: v.address || '',
      municipality: v.municipality || 'Medellín',
      neighborhood: v.neighborhood || '',
      department: v.department || 'Antioquia',
      propertyType: v.property_type || 'Casa',
      responsibleProfessional: v.responsible_professional || 'Ingeniero Asignado',
      assignedTeam: v.assigned_team || '',
      visitReason: v.visit_reason || 'Inspección',
      visitObjective: v.visit_objective || '',
      preparationObservations: v.preparation_observations || '',
      priority: v.priority || 'Normal',
      status: v.status as VisitStatus,
      enRouteAt: v.en_route_at,
      onSiteAt: v.on_site_at,
      inspectionStartedAt: v.inspection_started_at,
      completedAt: v.check_out_at || v.completed_at,
      gpsLocation: v.check_in_latitude && v.check_in_longitude ? {
        latitude: v.check_in_latitude,
        longitude: v.check_in_longitude,
        timestamp: v.check_in_at || v.on_site_at || new Date().toISOString()
      } : undefined,
      createdAt: v.created_at || new Date().toISOString(),
      updatedAt: v.updated_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('Visits query error:', err);
    return [];
  }
}

export async function createVisitInDb(visitData: {
  caseId?: string;
  caseCode?: string;
  date: string;
  startTime: string;
  estimatedEndTime: string;
  clientName: string;
  address: string;
  municipality: string;
  neighborhood?: string;
  propertyType: string;
  responsibleProfessionalId: string;
  responsibleProfessionalName: string;
  assignedTeam?: string;
  additionalTeamMembers?: { id: string; name: string }[];
  visitReason?: string;
  visitObjective: string;
  preparationObservations?: string;
  priority?: string;
  createdBy?: string;
}): Promise<VisitRecord | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const year = new Date().getFullYear();
    const { count } = await client.from('visits').select('*', { count: 'exact', head: true });
    const nextSeq = (count || 0) + 1;
    const visitId = `VIS-${year}-${nextSeq.toString().padStart(6, '0')}`;

    const payload = {
      id: visitId,
      visit_code: visitId,
      case_id: visitData.caseId || null,
      case_code: visitData.caseCode || visitData.caseId || null,
      date: visitData.date,
      start_time: visitData.startTime,
      estimated_end_time: visitData.estimatedEndTime,
      client_name: visitData.clientName,
      address: visitData.address,
      municipality: visitData.municipality,
      neighborhood: visitData.neighborhood || '',
      property_type: visitData.propertyType,
      assigned_to: visitData.responsibleProfessionalId,
      responsible_professional: visitData.responsibleProfessionalName,
      assigned_team: visitData.assignedTeam || '',
      visit_reason: visitData.visitReason || 'Inspección',
      visit_objective: visitData.visitObjective,
      preparation_observations: visitData.preparationObservations || '',
      priority: visitData.priority || 'Normal',
      status: 'PROGRAMADA',
      created_by: visitData.createdBy || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client.from('visits').insert(payload).select().single();
    if (error) {
      console.warn('Visit insert error:', error.message);
      return null;
    }

    // Create visit_assignments record for responsible professional
    try {
      await client.from('visit_assignments').insert({
        id: `va-${Date.now()}-1`,
        visit_id: visitId,
        user_id: visitData.responsibleProfessionalId,
        professional_name: visitData.responsibleProfessionalName,
        role_in_visit: 'Líder de Inspección',
        assignment_status: 'assigned',
        created_at: new Date().toISOString(),
      });

      // Create assignments for additional team members
      if (visitData.additionalTeamMembers && visitData.additionalTeamMembers.length > 0) {
        for (let i = 0; i < visitData.additionalTeamMembers.length; i++) {
          const m = visitData.additionalTeamMembers[i];
          await client.from('visit_assignments').insert({
            id: `va-${Date.now()}-${i + 2}`,
            visit_id: visitId,
            user_id: m.id,
            professional_name: m.name,
            role_in_visit: 'Acompañante Técnico',
            assignment_status: 'assigned',
            created_at: new Date().toISOString(),
          });
        }
      }
    } catch (assignErr) {
      console.warn('Visit assignment insert error:', assignErr);
    }

    await recordActivity('Visita Programada', { visitId, client: visitData.clientName, professional: visitData.responsibleProfessionalName }, {
      userId: visitData.createdBy,
      caseId: visitData.caseId,
      visitId,
      entityType: 'visit',
      entityId: visitId,
    });

    return {
      id: data.id,
      caseId: data.case_id,
      caseCode: data.case_code,
      date: data.date,
      startTime: data.start_time,
      estimatedEndTime: data.estimated_end_time,
      clientName: data.client_name,
      address: data.address,
      municipality: data.municipality,
      neighborhood: data.neighborhood,
      propertyType: data.property_type,
      responsibleProfessional: data.responsible_professional,
      assignedTeam: data.assigned_team,
      visitReason: data.visit_reason,
      visitObjective: data.visit_objective,
      preparationObservations: data.preparation_observations,
      priority: data.priority,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.warn('Create visit error:', err);
    return null;
  }
}

export async function confirmVisitInDb(visitId: string, userId?: string, userName?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const now = new Date().toISOString();
    await client
      .from('visits')
      .update({
        status: 'CONFIRMADA',
        confirmed_at: now,
        updated_at: now,
      })
      .eq('id', visitId);

    // Update assignment status
    if (userId) {
      await client
        .from('visit_assignments')
        .update({
          assignment_status: 'accepted',
          responded_at: now,
        })
        .eq('visit_id', visitId)
        .eq('user_id', userId);
    }

    await recordActivity('Visita Confirmada', { visitId }, {
      userId,
      userName,
      visitId,
      entityType: 'visit',
      entityId: visitId,
    });

    return true;
  } catch (err) {
    console.warn('Confirm visit error:', err);
    return false;
  }
}

export async function startEnRouteInDb(visitId: string, userId?: string, userName?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const now = new Date().toISOString();
    await client
      .from('visits')
      .update({
        status: 'EN RUTA',
        en_route_at: now,
        updated_at: now,
      })
      .eq('id', visitId);

    await recordActivity('Desplazamiento iniciado (En Ruta)', { visitId }, {
      userId,
      userName,
      visitId,
      entityType: 'visit',
      entityId: visitId,
    });

    return true;
  } catch (err) {
    console.warn('En route error:', err);
    return false;
  }
}

export async function confirmOnSiteInDb(
  visitId: string,
  gps?: { latitude: number; longitude: number },
  userId?: string,
  userName?: string
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const now = new Date().toISOString();
    const payload: any = {
      status: 'EN SITIO',
      on_site_at: now,
      check_in_at: now,
      updated_at: now,
    };

    if (gps) {
      payload.check_in_latitude = gps.latitude;
      payload.check_in_longitude = gps.longitude;
    }

    await client.from('visits').update(payload).eq('id', visitId);

    await recordActivity('Profesional en sitio (Check-in GPS)', { visitId, gps }, {
      userId,
      userName,
      visitId,
      entityType: 'visit',
      entityId: visitId,
    });

    return true;
  } catch (err) {
    console.warn('On site error:', err);
    return false;
  }
}

export async function startInspectionInDb(visitId: string, userId?: string, userName?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const now = new Date().toISOString();
    await client
      .from('visits')
      .update({
        status: 'EN INSPECCIÓN',
        inspection_started_at: now,
        updated_at: now,
      })
      .eq('id', visitId);

    // Ensure assessment record exists
    await client.from('visit_assessments').upsert({
      visit_id: visitId,
      updated_at: now,
    }, { onConflict: 'visit_id' });

    await recordActivity('Inspección Técnica Iniciada (Modo Campo)', { visitId }, {
      userId,
      userName,
      visitId,
      entityType: 'visit',
      entityId: visitId,
    });

    return true;
  } catch (err) {
    console.warn('Start inspection error:', err);
    return false;
  }
}

export async function finishVisitInDb(visitId: string, userId?: string, userName?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const now = new Date().toISOString();
    await client
      .from('visits')
      .update({
        status: 'TERMINADA',
        check_out_at: now,
        completed_by: userId || null,
        updated_at: now,
      })
      .eq('id', visitId);

    await recordActivity('Visita de Campo Finalizada', { visitId }, {
      userId,
      userName,
      visitId,
      entityType: 'visit',
      entityId: visitId,
    });

    return true;
  } catch (err) {
    console.warn('Finish visit error:', err);
    return false;
  }
}

// -------------------------------------------------------------
// 5. FINDINGS & VISIT ASSESSMENTS
// -------------------------------------------------------------

export async function getFindingsFromDb(caseId?: string, visitId?: string): Promise<FindingRecord[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    let query = client.from('findings').select('*').order('created_at', { ascending: true });
    if (caseId) query = query.eq('case_id', caseId);
    if (visitId) query = query.eq('visit_id', visitId);

    const { data, error } = await query;
    if (error) {
      console.warn('Findings query error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Get findings error:', err);
    return [];
  }
}

export async function saveFindingInDb(finding: FindingRecord): Promise<FindingRecord | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const payload = {
      id: finding.id || `fnd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      case_id: finding.case_id,
      visit_id: finding.visit_id || null,
      inspection_id: finding.inspection_id || null,
      finding_number: finding.finding_number || 1,
      zone: finding.zone || '',
      floor: finding.floor || '',
      element: finding.element || '',
      category: finding.category || '',
      material: finding.material || '',
      description: finding.description || '',
      damage_type: finding.damage_type || '',
      crack_data: finding.crack_data || null,
      severity: finding.severity || 'Leve',
      possible_cause: finding.possible_cause || '',
      professional_observation: finding.professional_observation || '',
      additional_verification: finding.additional_verification || '',
      repair_required: finding.repair_required !== false,
      photo_url: finding.photo_url || null,
      created_by: finding.created_by || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('findings')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.warn('Save finding error:', error.message);
      return null;
    }

    await recordActivity('Hallazgo Patológico Registrado', { element: finding.element, severity: finding.severity }, {
      userId: finding.created_by,
      caseId: finding.case_id,
      visitId: finding.visit_id,
      entityType: 'finding',
      entityId: data.id,
    });

    return data;
  } catch (err) {
    console.warn('Save finding error:', err);
    return null;
  }
}

export async function saveVisitAssessmentInDb(assessment: VisitAssessmentRecord): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      ...assessment,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('visit_assessments')
      .upsert(payload, { onConflict: 'visit_id' });

    if (error) {
      console.warn('Save visit assessment error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Save visit assessment error:', err);
    return false;
  }
}

// -------------------------------------------------------------
// 6. TECHNICAL DECISION & REPAIRS
// -------------------------------------------------------------

export async function saveTechnicalDecisionInDb(decision: TechnicalDecisionRecord, userId?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: decision.id,
      case_id: decision.caseId,
      visit_id: decision.visitId || null,
      decision_type: decision.decision,
      technical_rationale: decision.technicalJustification,
      proposed_intervention: decision.proposedIntervention || null,
      temporary_measures: decision.temporaryMeasures || null,
      additional_studies: decision.additionalStudies || null,
      decided_by: decision.responsibleProfessional,
      decided_at: decision.date || new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('technical_decisions')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Save technical decision error:', error.message);
      return false;
    }

    await recordActivity('Decisión Técnica Emitida', { decision: decision.decision }, {
      userId,
      userName: decision.responsibleProfessional,
      caseId: decision.caseId,
      visitId: decision.visitId,
      entityType: 'technical_decision',
      entityId: decision.id,
    });

    return true;
  } catch (err) {
    console.warn('Save technical decision error:', err);
    return false;
  }
}

// -------------------------------------------------------------
// 7. FILE & PHOTO STORAGE (Supabase Storage 'sipre-files')
// -------------------------------------------------------------

/**
 * Client-side image compression before uploading
 */
async function compressImageClientSide(file: File, maxDim = 1920, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              resolve(blob || file);
            },
            'image/jpeg',
            quality
          );
        } else {
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export async function uploadEvidenceFile(
  file: File,
  metadata: {
    caseId?: string;
    visitId?: string;
    inspectionId?: string;
    findingId?: string;
    workFrontId?: string;
    category?: string;
    description?: string;
    uploadedBy?: string;
  }
): Promise<{ success: boolean; url?: string; storagePath?: string; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Cliente de Supabase no disponible' };
  }

  try {
    const compressedBlob = await compressImageClientSide(file);
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const storagePath = `${metadata.caseId || 'general'}/${timestamp}-${randomStr}.${ext}`;

    const { error: uploadError } = await client.storage
      .from('sipre-files')
      .upload(storagePath, compressedBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'image/jpeg',
      });

    if (uploadError) {
      console.warn('Storage upload error:', uploadError.message);
      return { success: false, error: uploadError.message };
    }

    // Get signed URL or public URL
    const { data: urlData } = client.storage.from('sipre-files').getPublicUrl(storagePath);
    const fileUrl = urlData?.publicUrl || storagePath;

    // Record in evidence_files
    const evidencePayload: EvidenceFileRecord = {
      id: `ev-${timestamp}-${randomStr}`,
      case_id: metadata.caseId,
      visit_id: metadata.visitId,
      inspection_id: metadata.inspectionId,
      finding_id: metadata.findingId,
      work_front_id: metadata.workFrontId,
      category: metadata.category || 'Fotográfica',
      storage_path: storagePath,
      filename: file.name,
      file_type: file.type,
      file_size: file.size,
      description: metadata.description || '',
      uploaded_by: metadata.uploadedBy,
      created_at: new Date().toISOString(),
    };

    await client.from('evidence_files').insert(evidencePayload);

    return {
      success: true,
      url: fileUrl,
      storagePath,
    };
  } catch (err: any) {
    console.warn('Upload evidence error:', err);
    return { success: false, error: err?.message || 'Error al subir archivo' };
  }
}

// -------------------------------------------------------------
// 8. REALTIME SUBSCRIPTIONS
// -------------------------------------------------------------

export function subscribeToOperationalRealtime(onTableUpdate: (table: string, payload: any) => void): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  try {
    const channel = client
      .channel('sipre-operational-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cases' },
        (payload) => onTableUpdate('cases', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visits' },
        (payload) => onTableUpdate('visits', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visit_assignments' },
        (payload) => onTableUpdate('visit_assignments', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'findings' },
        (payload) => onTableUpdate('findings', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'technical_decisions' },
        (payload) => onTableUpdate('technical_decisions', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_fronts' },
        (payload) => onTableUpdate('work_fronts', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'material_requests' },
        (payload) => onTableUpdate('material_requests', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'material_deliveries' },
        (payload) => onTableUpdate('material_deliveries', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_logs' },
        (payload) => onTableUpdate('work_logs', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'billing_records' },
        (payload) => onTableUpdate('billing_records', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        (payload) => onTableUpdate('payments', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        (payload) => onTableUpdate('reports', payload)
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime subscription error:', err);
    return () => {};
  }
}
