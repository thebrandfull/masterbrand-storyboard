create table if not exists focus_sessions (
  id uuid primary key default uuid_generate_v4(),
  brand_id uuid references brands(id) on delete set null,
  duration_minutes integer not null check (duration_minutes > 0),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_focus_sessions_brand_id on focus_sessions(brand_id);
create index if not exists idx_focus_sessions_started_at on focus_sessions(started_at);

alter table focus_sessions enable row level security;

drop policy if exists "Allow all operations on focus_sessions" on focus_sessions;
create policy "Allow all operations on focus_sessions" on focus_sessions for all using (true) with check (true);
