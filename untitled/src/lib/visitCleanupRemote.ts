import { getSupabaseClient } from './supabaseClient';

export async function deleteVisitTestRemote(visitId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');

  const { data: evidenceRows } = await client
    .from('evidence_files')
    .select('storage_path')
    .eq('visit_id', visitId);
  const storagePaths = (evidenceRows || []).map((row: any) => row.storage_path).filter(Boolean);

  // Primero intenta la limpieza administrativa completa.
  const { error: adminError } = await client.rpc('sipre_delete_visit', { p_visit_id: visitId });
  if (adminError) {
    // Si el usuario no es Coordinación/Gerencia, la función segura permite borrar
    // únicamente su propia visita si es una prueba explícita o una asignación sin datos técnicos.
    const { error: safeError } = await client.rpc('sipre_delete_assigned_test_visit', { p_visit_id: visitId });
    if (safeError) {
      const message = String(safeError.message || '');
      if (message.includes('VISIT_HAS_TECHNICAL_DATA')) {
        throw new Error('Esta visita contiene información técnica real. Solo Coordinación/Gerencia puede eliminarla completamente.');
      }
      if (message.includes('NOT_ASSIGNED_TO_VISIT')) {
        throw new Error('Esta visita está asignada a otro profesional.');
      }
      throw new Error(message || adminError.message || 'No se pudo eliminar la visita.');
    }
  }

  if (storagePaths.length) {
    await client.storage.from('sipre-files').remove(storagePaths);
  }
}
