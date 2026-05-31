create table if not exists public.team_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.team_state
add column if not exists payload jsonb not null default '{}'::jsonb;

alter table public.team_state
add column if not exists updated_at timestamptz not null default now();

alter table public.team_state
drop column if exists invite_code_hash;

alter table public.team_state
drop column if exists updated_by;

drop policy if exists "Team members can read team state" on public.team_state;
drop policy if exists "Team members can update team state" on public.team_state;
drop policy if exists "Public can read team state" on public.team_state;
drop policy if exists "Public can update team state" on public.team_state;

drop table if exists public.team_members;
drop function if exists public.join_team(text, text);
drop function if exists public.is_team_member(text);

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

alter table public.team_state enable row level security;

create policy "Public can read team state"
on public.team_state
for select
to anon, authenticated
using (id = 'ksch-spiele');

create policy "Public can update team state"
on public.team_state
for update
to anon, authenticated
using (id = 'ksch-spiele')
with check (id = 'ksch-spiele');

grant select, update on public.team_state to anon, authenticated;

insert into public.team_state (id, payload)
values ('ksch-spiele', '{}'::jsonb)
on conflict (id) do nothing;

do $$
begin
  alter publication supabase_realtime add table public.team_state;
exception
  when duplicate_object then null;
end $$;
