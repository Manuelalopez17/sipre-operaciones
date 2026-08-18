import { SupabaseUserRole, UserRole } from '../types';

/**
 * SIPRE Role Mapping definition
 * Database role -> Simplified Visible UI Role
 * 
 * inspector -> "Profesional"
 * coordinator -> "Coordinador"
 * administrator -> "Gerencia"
 * field_supervisor -> "Operativo"
 */

export interface RoleConfig {
  dbRole: SupabaseUserRole;
  uiLabel: string;
  description: string;
  category: 'PROFESIONAL' | 'COORDINADOR' | 'GERENCIA' | 'OPERATIVO';
  color: string;
  badgeBg: string;
  badgeBorder: string;
}

export const SIPRE_ROLES: Record<string, RoleConfig> = {
  inspector: {
    dbRole: 'inspector',
    uiLabel: 'Profesional',
    description: 'Evaluación técnica, patología estructural, dictamen y dirección de frentes.',
    category: 'PROFESIONAL',
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-950/80',
    badgeBorder: 'border-cyan-800',
  },
  coordinator: {
    dbRole: 'coordinator',
    uiLabel: 'Coordinador',
    description: 'Apertura de expedientes, asignación de profesionales, agenda y suministros.',
    category: 'COORDINADOR',
    color: 'text-blue-400',
    badgeBg: 'bg-blue-950/80',
    badgeBorder: 'border-blue-800',
  },
  administrator: {
    dbRole: 'administrator',
    uiLabel: 'Gerencia',
    description: 'Visibilidad completa, seguimiento de indicadores, entregas, cobros y auditoría.',
    category: 'GERENCIA',
    color: 'text-purple-400',
    badgeBg: 'bg-purple-950/80',
    badgeBorder: 'border-purple-800',
  },
  field_supervisor: {
    dbRole: 'field_supervisor',
    uiLabel: 'Operativo',
    description: 'Ejecución en campo, registro de actividades, fotos antes/durante/después y recepción de materiales.',
    category: 'OPERATIVO',
    color: 'text-amber-400',
    badgeBg: 'bg-amber-950/80',
    badgeBorder: 'border-amber-800',
  },
  // Legacy / secondary database role mappings
  structural_specialist: {
    dbRole: 'structural_specialist',
    uiLabel: 'Profesional',
    description: 'Especialista en vulnerabilidad sísmica y patología estructural.',
    category: 'PROFESIONAL',
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-950/80',
    badgeBorder: 'border-cyan-800',
  },
  warehouse: {
    dbRole: 'warehouse',
    uiLabel: 'Operativo',
    description: 'Almacén y despacho de insumos.',
    category: 'OPERATIVO',
    color: 'text-amber-400',
    badgeBg: 'bg-amber-950/80',
    badgeBorder: 'border-amber-800',
  },
  driver: {
    dbRole: 'driver',
    uiLabel: 'Operativo',
    description: 'Transporte y entregas en campo.',
    category: 'OPERATIVO',
    color: 'text-amber-400',
    badgeBg: 'bg-amber-950/80',
    badgeBorder: 'border-amber-800',
  },
  administrative: {
    dbRole: 'administrative',
    uiLabel: 'Gerencia',
    description: 'Facturación y cobranza administrativa.',
    category: 'GERENCIA',
    color: 'text-purple-400',
    badgeBg: 'bg-purple-950/80',
    badgeBorder: 'border-purple-800',
  },
};

/**
 * Returns the simplified, user-facing label for any database role key
 */
export function getDisplayRole(role?: string | null): string {
  if (!role) return 'Profesional';
  const clean = role.toLowerCase().trim();
  
  if (clean === 'inspector' || clean === 'structural_specialist' || clean === 'profesional') {
    return 'Profesional';
  }
  if (clean === 'coordinator' || clean === 'coordinador') {
    return 'Coordinador';
  }
  if (clean === 'administrator' || clean === 'admin' || clean === 'gerencia') {
    return 'Gerencia';
  }
  if (clean === 'field_supervisor' || clean === 'warehouse' || clean === 'driver' || clean === 'operativo' || clean === 'supervisor') {
    return 'Operativo';
  }
  
  return SIPRE_ROLES[clean]?.uiLabel || 'Profesional';
}

/**
 * Returns role category to determine dashboard views and permissions
 */
export function getRoleCategory(role?: string | null): 'PROFESIONAL' | 'COORDINADOR' | 'GERENCIA' | 'OPERATIVO' {
  const display = getDisplayRole(role);
  if (display === 'Profesional') return 'PROFESIONAL';
  if (display === 'Coordinador') return 'COORDINADOR';
  if (display === 'Gerencia') return 'GERENCIA';
  return 'OPERATIVO';
}

/**
 * Permission checks
 */
export function isProfessional(role?: string | null): boolean {
  return getRoleCategory(role) === 'PROFESIONAL';
}

export function isCoordinator(role?: string | null): boolean {
  return getRoleCategory(role) === 'COORDINADOR';
}

export function isManagement(role?: string | null): boolean {
  return getRoleCategory(role) === 'GERENCIA';
}

export function isOperative(role?: string | null): boolean {
  return getRoleCategory(role) === 'OPERATIVO';
}

/**
 * Operative permission restrictions
 */
export function canIssueTechnicalConclusion(role?: string | null): boolean {
  const cat = getRoleCategory(role);
  return cat === 'PROFESIONAL' || cat === 'GERENCIA';
}

export function canApproveReports(role?: string | null): boolean {
  const cat = getRoleCategory(role);
  return cat === 'PROFESIONAL' || cat === 'GERENCIA';
}

export function canModifyBilling(role?: string | null): boolean {
  const cat = getRoleCategory(role);
  return cat === 'COORDINADOR' || cat === 'GERENCIA';
}

export function canScheduleVisits(role?: string | null): boolean {
  const cat = getRoleCategory(role);
  return cat === 'COORDINADOR' || cat === 'GERENCIA';
}

export function canManageWorkFronts(role?: string | null): boolean {
  return true; // All roles can see/interact with work fronts according to their duties
}
