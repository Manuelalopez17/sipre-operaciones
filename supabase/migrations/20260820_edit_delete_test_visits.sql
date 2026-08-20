-- SIPRE: edición y eliminación segura de visitas/pruebas
-- No elimina datos al instalarse. Solo crea funciones para que la app pueda borrar
-- una visita cuando el usuario lo solicita explícitamente.

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

  if v_email in ('csgrupotecnico2026@gmail.com', 'lopezecheverrymanuela@gmail.com') then
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

create or replace function public.sipre_delete_assigned_test_visit(p_visit_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_visit record;
  v_is_explicit_test boolean := false;
  v_has_technical_data boolean := false;
  t text;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  -- Coordinación/Gerencia conserva el flujo de limpieza total existente.
  if public.sipre_can_coordinate_visits() then
    perform public.sipre_delete_visit(p_visit_id);
    return;
  end if;

  select * into v_visit
  from public.visits
  where id = p_visit_id;

  if v_visit.id is null then
    raise exception 'VISIT_NOT_FOUND';
  end if;

  if coalesce(v_visit.assigned_to::text, '') <> auth.uid()::text
     and not exists (
       select 1 from public.visit_assignments va
       where va.visit_id = p_visit_id
         and va.user_id = auth.uid()
     ) then
    raise exception 'NOT_ASSIGNED_TO_VISIT';
  end if;

  v_is_explicit_test :=
    lower(coalesce(v_visit.client_name, '')) ~ '(prueba|test|demo)'
    or lower(coalesce(v_visit.objective, '')) ~ '(prueba|test|demo)'
    or lower(coalesce(v_visit.visit_objective, '')) ~ '(prueba|test|demo)';

  -- Si NO está marcada textualmente como prueba, solo permitimos borrar una
  -- asignación limpia: sin informe, evidencias, inspección, concepto ni frente.
  foreach t in array array[
    'reports',
    'technical_decisions',
    'findings',
    'evidence_files',
    'visit_assessments',
    'inspections'
  ] loop
    if to_regclass('public.' || t) is not null
       and exists (
         select 1 from information_schema.columns
         where table_schema = 'public'
           and table_name = t
           and column_name = 'visit_id'
       ) then
      execute format('select exists(select 1 from public.%I where visit_id = $1)', t)
        into v_has_technical_data
        using p_visit_id;
      exit when v_has_technical_data;
    end if;
  end loop;

  if not v_has_technical_data
     and to_regclass('public.work_fronts') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'work_fronts'
         and column_name = 'originating_visit_id'
     ) then
    select exists(
      select 1 from public.work_fronts where originating_visit_id = p_visit_id
    ) into v_has_technical_data;
  end if;

  if v_has_technical_data and not v_is_explicit_test then
    raise exception 'VISIT_HAS_TECHNICAL_DATA';
  end if;

  -- Para una visita marcada como prueba, limpiamos sus datos derivados.
  if v_is_explicit_test then
    foreach t in array array[
      'reports',
      'client_approvals',
      'technical_decisions',
      'findings',
      'evidence_files',
      'visit_assessments',
      'inspections',
      'field_visit_drafts',
      'activity_log'
    ] loop
      if to_regclass('public.' || t) is not null
         and exists (
           select 1 from information_schema.columns
           where table_schema = 'public'
             and table_name = t
             and column_name = 'visit_id'
         ) then
        execute format('delete from public.%I where visit_id::text = $1', t)
          using p_visit_id::text;
      end if;
    end loop;
  else
    if to_regclass('public.field_visit_drafts') is not null then
      delete from public.field_visit_drafts where visit_id = p_visit_id::text;
    end if;
  end if;

  delete from public.visit_assignments where visit_id = p_visit_id;
  delete from public.visits where id = p_visit_id;
end;
$$;

grant execute on function public.sipre_delete_assigned_test_visit(uuid) to authenticated;

notify pgrst, 'reload schema';