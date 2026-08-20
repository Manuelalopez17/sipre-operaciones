-- SIPRE: usuarios individuales, perfiles seguros y borradores remotos de visita
-- No elimina visitas, evidencias, inspecciones ni informes existentes.

begin;

-- -----------------------------------------------------------------------------
-- 1) Perfiles: cada usuario Auth debe tener un perfil operacional
-- -----------------------------------------------------------------------------
alter table if exists public.profiles
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.sipre_handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  requested_role text := lower(coalesce(meta->>'role', 'inspector'));
  source_name text := coalesce(meta->>'signup_source', 'dashboard');
  safe_role text;
  initial_active boolean;
begin
  safe_role := case
    when requested_role in ('inspector','structural_specialist','coordinator','administrator','field_supervisor','warehouse','driver','administrative')
      then requested_role
    else 'inspector'
  end;

  -- Registro abierto desde SIPRE nunca se auto-eleva ni queda activo sin revisión.
  if source_name = 'sipre_public' then
    safe_role := 'inspector';
    initial_active := false;
  else
    initial_active := true;
  end if;

  insert into public.profiles (
    id, full_name, role, professional_license, organization, email, phone, active, created_at, updated_at
  ) values (
    new.id,
    coalesce(nullif(meta->>'full_name',''), split_part(coalesce(new.email,''),'@',1), 'Usuario SIPRE'),
    safe_role,
    coalesce(meta->>'professional_license',''),
    coalesce(nullif(meta->>'organization',''), 'SIPRE Operaciones'),
    new.email,
    coalesce(meta->>'phone',''),
    initial_active,
    now(),
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_sipre on auth.users;
create trigger on_auth_user_created_sipre
after insert on auth.users
for each row execute function public.sipre_handle_new_auth_user();

-- Crea el perfil del propio usuario si por alguna razón histórica no existe.
create or replace function public.sipre_ensure_my_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.profiles;
  auth_email text;
  auth_meta jsonb;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select email, coalesce(raw_user_meta_data,'{}'::jsonb)
    into auth_email, auth_meta
  from auth.users
  where id = auth.uid();

  insert into public.profiles (
    id, full_name, role, professional_license, organization, email, phone, active, created_at, updated_at
  ) values (
    auth.uid(),
    coalesce(nullif(auth_meta->>'full_name',''), split_part(coalesce(auth_email,''),'@',1), 'Usuario SIPRE'),
    'inspector',
    coalesce(auth_meta->>'professional_license',''),
    'SIPRE Operaciones',
    auth_email,
    coalesce(auth_meta->>'phone',''),
    true,
    now(),
    now()
  )
  on conflict (id) do nothing;

  select * into result from public.profiles where id = auth.uid();
  return result;
end;
$$;

grant execute on function public.sipre_ensure_my_profile() to authenticated;

create or replace function public.sipre_can_manage_users()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active is not false
      and lower(coalesce(p.role,'')) in ('coordinator','coordinador','administrator','admin','gerencia','administrative')
  )
  or lower(coalesce(auth.jwt()->>'email','')) in (
    'lopezecheverrymanuela@gmail.com',
    'csgrupotecnico2026@gmail.com'
  );
$$;

grant execute on function public.sipre_can_manage_users() to authenticated;

create or replace function public.sipre_update_profile(
  p_user_id uuid,
  p_full_name text,
  p_role text,
  p_professional_license text,
  p_phone text,
  p_active boolean
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.profiles;
  safe_role text := lower(coalesce(p_role,'inspector'));
begin
  if not public.sipre_can_manage_users() then
    raise exception 'USER_MANAGEMENT_NOT_ALLOWED';
  end if;

  if safe_role not in ('inspector','structural_specialist','coordinator','administrator','field_supervisor','warehouse','driver','administrative') then
    raise exception 'INVALID_ROLE';
  end if;

  update public.profiles
  set full_name = coalesce(nullif(trim(p_full_name),''), full_name),
      role = safe_role,
      professional_license = coalesce(p_professional_license,''),
      phone = coalesce(p_phone,''),
      active = coalesce(p_active,true),
      updated_at = now()
  where id = p_user_id
  returning * into result;

  if result.id is null then
    raise exception 'PROFILE_NOT_FOUND';
  end if;
  return result;
end;
$$;

grant execute on function public.sipre_update_profile(uuid,text,text,text,text,boolean) to authenticated;

alter table public.profiles enable row level security;
drop policy if exists sipre_profiles_authenticated_select on public.profiles;
create policy sipre_profiles_authenticated_select
on public.profiles for select
to authenticated
using (true);

-- Las modificaciones de rol/activación se hacen por RPC security definer.
drop policy if exists sipre_profiles_own_insert on public.profiles;
create policy sipre_profiles_own_insert
on public.profiles for insert
to authenticated
with check (id = auth.uid());

-- -----------------------------------------------------------------------------
-- 2) Borradores remotos completos de Modo Campo
-- -----------------------------------------------------------------------------
create table if not exists public.field_visit_drafts (
  id uuid primary key default gen_random_uuid(),
  visit_id text not null unique,
  case_id text,
  current_step integer not null default 1 check (current_step between 1 and 10),
  draft_status text not null default 'BORRADOR' check (draft_status in ('BORRADOR','COMPLETADA')),
  snapshot jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists field_visit_drafts_case_id_idx on public.field_visit_drafts(case_id);
create index if not exists field_visit_drafts_updated_at_idx on public.field_visit_drafts(updated_at desc);

create or replace function public.sipre_can_edit_visit_draft(p_visit_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.visits v
    where v.id::text = p_visit_id
      and (
        v.assigned_to::text = auth.uid()::text
        or exists (
          select 1 from public.visit_assignments va
          where va.visit_id::text = v.id::text
            and va.user_id::text = auth.uid()::text
            and lower(coalesce(va.role_in_visit,'')) like '%líder%'
        )
      )
  );
$$;

grant execute on function public.sipre_can_edit_visit_draft(text) to authenticated;

alter table public.field_visit_drafts enable row level security;
drop policy if exists field_visit_drafts_authenticated_select on public.field_visit_drafts;
create policy field_visit_drafts_authenticated_select
on public.field_visit_drafts for select
to authenticated
using (true);

drop policy if exists field_visit_drafts_assigned_insert on public.field_visit_drafts;
create policy field_visit_drafts_assigned_insert
on public.field_visit_drafts for insert
to authenticated
with check (public.sipre_can_edit_visit_draft(visit_id));

drop policy if exists field_visit_drafts_assigned_update on public.field_visit_drafts;
create policy field_visit_drafts_assigned_update
on public.field_visit_drafts for update
to authenticated
using (public.sipre_can_edit_visit_draft(visit_id))
with check (public.sipre_can_edit_visit_draft(visit_id));

-- -----------------------------------------------------------------------------
-- 3) Realtime para borradores (si la publicación ya existe, no falla)
-- -----------------------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.field_visit_drafts;
  exception when duplicate_object then
    null;
  end;
end $$;

notify pgrst, 'reload schema';
commit;
