create extension if not exists pgcrypto;

create table if not exists public.team_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  invite_code_hash text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.team_state
add column if not exists invite_code_hash text;

create table if not exists public.team_members (
  team_id text not null references public.team_state(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_team_state_updated_at on public.team_state;
create trigger set_team_state_updated_at
before update on public.team_state
for each row
execute function public.set_updated_at();

create or replace function public.is_team_member(team_id_to_check text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.team_members member
    where member.team_id = team_id_to_check
      and member.user_id = auth.uid()
  );
$$;

create or replace function public.join_team(invite_team_id text, invite_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  stored_hash text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select invite_code_hash
  into stored_hash
  from public.team_state
  where id = invite_team_id;

  if stored_hash is null then
    raise exception 'team_not_found';
  end if;

  if crypt(invite_code, stored_hash) <> stored_hash then
    raise exception 'invalid_invite_code';
  end if;

  insert into public.team_members (team_id, user_id)
  values (invite_team_id, auth.uid())
  on conflict (team_id, user_id) do nothing;

  return true;
end;
$$;

alter table public.team_state enable row level security;
alter table public.team_members enable row level security;

drop policy if exists "Team members can read team state" on public.team_state;
create policy "Team members can read team state"
on public.team_state
for select
to authenticated
using (public.is_team_member(id));

drop policy if exists "Team members can update team state" on public.team_state;
create policy "Team members can update team state"
on public.team_state
for update
to authenticated
using (public.is_team_member(id))
with check (public.is_team_member(id));

drop policy if exists "Team members can read their own membership" on public.team_members;
create policy "Team members can read their own membership"
on public.team_members
for select
to authenticated
using (user_id = auth.uid());

grant execute on function public.join_team(text, text) to authenticated;

insert into public.team_state (id, invite_code_hash, payload)
values (
  'ksch-spiele',
  crypt('01234', gen_salt('bf')),
  '{}'::jsonb
)
on conflict (id) do update
set invite_code_hash = excluded.invite_code_hash;

do $$
begin
  alter publication supabase_realtime add table public.team_state;
exception
  when duplicate_object then null;
end $$;
