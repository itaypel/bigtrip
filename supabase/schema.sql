-- Packing list sync schema. Run once in the Supabase dashboard → SQL Editor.
-- Safe to re-run.

create table if not exists public.checked_items (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  item_id    text        not null,
  checked    boolean     not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.checked_items enable row level security;

-- Each user sees and edits only their own rows.
drop policy if exists "own rows: select" on public.checked_items;
drop policy if exists "own rows: insert" on public.checked_items;
drop policy if exists "own rows: update" on public.checked_items;
drop policy if exists "own rows: delete" on public.checked_items;

create policy "own rows: select" on public.checked_items
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "own rows: insert" on public.checked_items
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own rows: update" on public.checked_items
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "own rows: delete" on public.checked_items
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.checked_items to authenticated;
revoke all on public.checked_items from anon;

-- Offline devices may upload old changes late. Keep whichever change is newest,
-- so a phone coming back online can't overwrite a newer edit made on the web.
create or replace function public.checked_items_keep_newest()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.updated_at < old.updated_at then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists keep_newest on public.checked_items;
create trigger keep_newest
  before update on public.checked_items
  for each row execute function public.checked_items_keep_newest();

-- Live updates between devices.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'checked_items'
  ) then
    alter publication supabase_realtime add table public.checked_items;
  end if;
end;
$$;
