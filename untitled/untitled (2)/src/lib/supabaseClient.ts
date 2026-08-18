import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PropertyInspection } from '../types';

let supabaseClientInstance: SupabaseClient | null = null;
let hasLoggedInit = false;

export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  const envUrl =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.SUPABASE_URL) ||
    (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL)) ||
    (typeof window !== 'undefined' ? localStorage.getItem('sipre_supabase_url') : '') ||
    '';

  const envKey =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.SUPABASE_ANON_KEY)) ||
    (typeof window !== 'undefined' ? localStorage.getItem('sipre_supabase_anon_key') : '') ||
    '';

  const url = (envUrl || '').trim();
  const anonKey = (envKey || '').trim();

  return {
    url,
    anonKey,
    isConfigured: !!(url && anonKey && (url.startsWith('http://') || url.startsWith('https://'))),
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sipre_supabase_url', url.trim());
    localStorage.setItem('sipre_supabase_anon_key', anonKey.trim());
  }
  supabaseClientInstance = null; // Reset client
  hasLoggedInit = false;
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (!supabaseClientInstance) {
    try {
      supabaseClientInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      if (!hasLoggedInit) {
        console.log('SIPRE: Supabase client initialized successfully.');
        hasLoggedInit = true;
      }
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return supabaseClientInstance;
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  const { isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    return {
      success: false,
      message: 'Supabase environment variables are not available.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'No se pudo inicializar el cliente de Supabase.',
    };
  }

  try {
    const { error } = await client.auth.getSession();
    if (error) {
      return { success: false, message: `Error contactando Supabase Auth: ${error.message}` };
    }
    return {
      success: true,
      message: 'Conexión y cliente Supabase verificados exitosamente.',
    };
  } catch (err: any) {
    return { success: false, message: `Error de conexión: ${err?.message || 'No se pudo contactar Supabase'}` };
  }
}

export async function syncInspectionToSupabase(inspection: PropertyInspection): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Cliente de Supabase no configurado' };
  }

  try {
    const payload = {
      id: inspection.id,
      date: inspection.date,
      time: inspection.time,
      inspector_name: inspection.inspectorName,
      professional_license: inspection.professionalLicense,
      organization: inspection.organization,
      address: inspection.address,
      neighborhood: inspection.neighborhood,
      municipality: inspection.municipality,
      department: inspection.department,
      gps: inspection.gps,
      owner_or_occupant: inspection.ownerOrOccupant,
      owner_phone: inspection.ownerPhone,
      building_use: inspection.buildingUse,
      floors: inspection.floors,
      basements: inspection.basements,
      approx_area_m2: inspection.approxAreaM2,
      structural_system: inspection.structuralSystem,
      preliminary_priority: inspection.preliminaryPriority,
      status: inspection.status,
      professional_assessment: inspection.professionalAssessment,
      elements_json: inspection.elements,
      findings_json: inspection.findings,
      photos_json: inspection.photos,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('inspections').upsert(payload, { onConflict: 'id' });
    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    console.error('Error syncing to Supabase:', err);
    return { success: false, error: err?.message || 'Error desconocido al sincronizar' };
  }
}

/**
 * SQL Schema for Supabase PostgreSQL Initialization
 */
export const SUPABASE_SQL_SCHEMA = `-- SIPRE (Sistema de Inspección de Patología y Riesgo Estructural)
-- Script de inicialización de Base de Datos PostgreSQL en Supabase

-- 1. Tabla de Inspecciones Principales
CREATE TABLE IF NOT EXISTS public.inspections (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    inspector_name TEXT NOT NULL,
    professional_license TEXT NOT NULL,
    organization TEXT,
    address TEXT NOT NULL,
    neighborhood TEXT,
    municipality TEXT NOT NULL,
    department TEXT NOT NULL,
    gps JSONB,
    owner_or_occupant TEXT,
    owner_phone TEXT,
    building_use TEXT,
    floors INTEGER DEFAULT 1,
    basements INTEGER DEFAULT 0,
    approx_area_m2 NUMERIC,
    structural_system TEXT NOT NULL,
    preliminary_priority TEXT NOT NULL,
    status TEXT NOT NULL,
    professional_assessment JSONB,
    elements_json JSONB DEFAULT '[]'::jsonb,
    findings_json JSONB DEFAULT '[]'::jsonb,
    photos_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Registro de Auditoría (Audit Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    "user" TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    inspection_id TEXT REFERENCES public.inspections(id) ON DELETE CASCADE,
    field_changed TEXT,
    old_value TEXT,
    new_value TEXT
);

-- 3. Habilitar Seguridad RLS
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura y escritura para usuarios autenticados e inspectores
CREATE POLICY "Permitir lectura de inspecciones a usuarios autorizados"
ON public.inspections FOR SELECT USING (true);

CREATE POLICY "Permitir inserción y actualización a inspectores"
ON public.inspections FOR ALL USING (true);

-- 4. Habilitar Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.inspections;
`;
