import { SupabaseUserRole } from '../types';

export type SipreRoleCategory = 'PROFESIONAL' | 'COORDINADOR' | 'GERENCIA' | 'OPERATIVO';

export interface RoleConfig {
  dbRole: SupabaseUserRole;
  uiLabel: string;
  description: string;
  category: SipreRoleCategory;
  color: string;
  badgeBg: string;
  badgeBorder: string;
}

export const SIPRE_ROLES: Record<string, RoleConfig> = {
  inspector: {
    dbRole: 'inspector', uiLabel: 'Profesional',
    description: 'Ejecuta sus visitas asignadas, registra la inspección, finaliza sus informes y realiza seguimiento técnico a sus frentes.',
    category: 'PROFESIONAL', color: 'text-cyan-400', badgeBg: 'bg-cyan-950/80', badgeBorder: 'border-cyan-800',
  },
  structural_specialist: {
    dbRole: 'structural_specialist', uiLabel: 'Profesional',
    description: 'Especialista técnico con permisos equivalentes al profesional para visitas y frentes que le sean asignados.',
    category: 'PROFESIONAL', color: 'text-cyan-400', badgeBg: 'bg-cyan-950/80', badgeBorder: 'border-cyan-800',
  },
  coordinator: {
    dbRole: 'coordinator', uiLabel: 'Coordinador',
    description: 'Administra expedientes, agenda, programación, edición, reasignación y eliminación de visitas; supervisa toda la operación sin modificar el contenido técnico del profesional.',
    category: 'COORDINADOR', color: 'text-blue-400', badgeBg: 'bg-blue-950/80', badgeBorder: 'border-blue-800',
  },
  administrator: {
    dbRole: 'administrator', uiLabel: 'Gerencia',
    description: 'Visualiza toda la operación, administra expedientes y agenda junto con Coordinación, y gestiona cobros y pagos.',
    category: 'GERENCIA', color: 'text-purple-400', badgeBg: 'bg-purple-950/80', badgeBorder: 'border-purple-800',
  },
  administrative: {
    dbRole: 'administrative', uiLabel: 'Gerencia',
    description: 'Visualiza toda la operación, apoya programación y administra cobros y pagos.',
    category: 'GERENCIA', color: 'text-purple-400', badgeBg: 'bg-purple-950/80', badgeBorder: 'border-purple-800',
  },
  field_supervisor: {
    dbRole: 'field_supervisor', uiLabel: 'Operativo',
    description: 'Gestiona materiales, despachos, entregas y registros operativos de los frentes.',
    category: 'OPERATIVO', color: 'text-amber-400', badgeBg: 'bg-amber-950/80', badgeBorder: 'border-amber-800',
  },
  warehouse: {
    dbRole: 'warehouse', uiLabel: 'Operativo',
    description: 'Gestiona materiales y despachos.',
    category: 'OPERATIVO', color: 'text-amber-400', badgeBg: 'bg-amber-950/80', badgeBorder: 'border-amber-800',
  },
  driver: {
    dbRole: 'driver', uiLabel: 'Operativo',
    description: 'Gestiona transporte y entregas.',
    category: 'OPERATIVO', color: 'text-amber-400', badgeBg: 'bg-amber-950/80', badgeBorder: 'border-amber-800',
  },
};

export function getDisplayRole(role?: string | null): string {
  if (!role) return 'Profesional';
  const clean = role.toLowerCase().trim();
  if (['inspector','structural_specialist','profesional'].includes(clean)) return 'Profesional';
  if (['coordinator','coordinador'].includes(clean)) return 'Coordinador';
  if (['administrator','administrative','admin','gerencia'].includes(clean)) return 'Gerencia';
  if (['field_supervisor','warehouse','driver','operativo','supervisor'].includes(clean)) return 'Operativo';
  return SIPRE_ROLES[clean]?.uiLabel || 'Profesional';
}

export function getRoleCategory(role?: string | null): SipreRoleCategory {
  const display = getDisplayRole(role);
  if (display === 'Coordinador') return 'COORDINADOR';
  if (display === 'Gerencia') return 'GERENCIA';
  if (display === 'Operativo') return 'OPERATIVO';
  return 'PROFESIONAL';
}

export const isProfessional = (role?: string | null) => getRoleCategory(role) === 'PROFESIONAL';
export const isCoordinator = (role?: string | null) => getRoleCategory(role) === 'COORDINADOR';
export const isManagement = (role?: string | null) => getRoleCategory(role) === 'GERENCIA';
export const isOperative = (role?: string | null) => getRoleCategory(role) === 'OPERATIVO';
export const isPlanner = (role?: string | null) => isCoordinator(role) || isManagement(role);

// Matriz de permisos SIPRE.
export const canCreateCases = (role?: string | null) => isPlanner(role);
export const canScheduleVisits = (role?: string | null) => isPlanner(role);
export const canEditVisits = (role?: string | null) => isPlanner(role);
export const canDeleteVisits = (role?: string | null) => isPlanner(role);

// La información técnica de una visita pertenece al profesional asignado.
export const canStartAssignedVisit = (role?: string | null) => isProfessional(role);
export const canEditProfessionalInspection = (role?: string | null) => isProfessional(role);
export const canIssueTechnicalConclusion = (role?: string | null) => isProfessional(role);
export const canApproveReports = (role?: string | null) => isProfessional(role);

// Gerencia administra cobros; Coordinación puede consultarlos.
export const canViewBilling = (role?: string | null) => isPlanner(role);
export const canModifyBilling = (role?: string | null) => isManagement(role);

// Operación logística.
export const canManageMaterials = (role?: string | null) => isOperative(role);
export const canManageDeliveries = (role?: string | null) => isOperative(role);
export const canManageWorkFronts = (role?: string | null) => isProfessional(role) || isOperative(role);

// Coordinación y Gerencia pueden ver el conjunto completo de la operación.
export const canViewAllOperationalData = (role?: string | null) => isPlanner(role);
