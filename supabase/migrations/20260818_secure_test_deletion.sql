-- SIPRE: eliminación segura de registros de prueba/datos erróneos
-- Ejecutar una sola vez en Supabase SQL Editor si las políticas RLS impiden borrar desde la app.

create or replace function public.sipre_can_coordinate_visits()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_email text;
begin
  if auth.uid() is null then
    return false;
  end if;

  select lower(coalesce(role, '')) into v_role
  from public.profiles
  where id = auth.uid();

  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  if v_email = 'csgrupotecnico2026@gmail.com' then
    return true;
  end if;

  return v_role in (
    'coordinator', 'coordinador',
    'administrator', 'admin', 'gerencia',
    'field_supervisor', 'operativo', 'supervisor',
    'warehouse', 'driver', 'administrative'
  );
end;
$$;

grant execute on function public.sipre_can_coordinate_visits() to authenticated;

create or replace function public.sipre_delete_work_front(p_work_front_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t text;
begin
  if not public.sipre_can_coordinate_visits() then
    raise exception 'No autorizado para eliminar frentes de prueba';
  end if;

  foreach t in array array[
    'material_deliveries',
    'material_requests',
    'work_logs',
    'technical_handover_approvals',
    'client_handovers',
    'billing_records',
    'payments',
    'collection_actions',
    'evidence_files'
  ] loop
    if to_regclass('public.' || t) is not null
       and exists (
         select 1
         from information_schema.columns
         where table_schema = 'public'
           and table_name = t
           and column_name = 'work_front_id'
       ) then
      execute format('delete from public.%I where work_front_id = $1', t)
      using p_work_front_id;
    end if;
  end loop;

  if to_regclass('public.work_fronts') is not null then
    delete from public.work_fronts where id = p_work_front_id;
  end if;
end;
$$;

grant execute on function public.sipre_delete_work_front(uuid) to authenticated;

create or replace function public.sipre_delete_visit(p_visit_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t text;
  front_rec record;
begin
  if not public.sipre_can_coordinate_visits() then
    raise exception 'No autorizado para eliminar visitas de prueba';
  end if;

  -- Eliminar primero los frentes derivados de la visita.
  if to_regclass('public.work_fronts') is not null
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'work_fronts'
         and column_name = 'originating_visit_id'
     ) then
    for front_rec in execute 'select id from public.work_fronts where originating_visit_id = $1' using p_visit_id loop
      perform public.sipre_delete_work_front(front_rec.id);
    end loop;
  end if;

  -- Limpiar tablas hijas conocidas que tengan visit_id.
  foreach t in array array[
    'reports',
    'client_approvals',
    'technical_decisions',
    'findings',
    'evidence_files',
    'visit_assessments',
    'inspections',
    'visit_assignments',
    'activity_log'
  ] loop
    if to_regclass('public.' || t) is not null
       and exists (
         select 1
         from information_schema.columns
         where table_schema = 'public'
           and table_name = t
           and column_name = 'visit_id'
       ) then
      execute format('delete from public.%I where visit_id = $1', t)
      using p_visit_id;
    end if;
  end loop;

  delete from public.visits where id = p_visit_id;
end;
$$;

grant execute on function public.sipre_delete_visit(uuid) to authenticated;

notify pgrst, 'reload schema';
