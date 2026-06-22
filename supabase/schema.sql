-- ចម្លងកូដនេះទាំងអស់ ហើយ Paste ក្នុង Supabase Dashboard > SQL Editor > New query > Run

-- ============ profiles ============
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'member' check (role in ('admin','member')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_own_or_any_authenticated"
  on profiles for select
  to authenticated
  using (true);

-- ============ tasks (ការងារត្រូវធ្វើ / reminders) ============
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  time text not null default '09:00',
  remind_day_before text default 'none',
  remind_same_day int default 30,
  reminded_day_before boolean default false,
  reminded_same_day boolean default false,
  done boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table tasks enable row level security;

create policy "tasks_all_for_authenticated"
  on tasks for all
  to authenticated
  using (true)
  with check (true);

-- ============ tracker_jobs (កត់ត្រាការងារ) ============
create table if not exists tracker_jobs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  time text default '09:00',
  end_date date,
  status text not null default 'pending' check (status in ('pending','done')),
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table tracker_jobs enable row level security;

create policy "tracker_jobs_all_for_authenticated"
  on tracker_jobs for all
  to authenticated
  using (true)
  with check (true);

-- ============ telegram_settings (ការកំណត់ Telegram, admin only) ============
create table if not exists telegram_settings (
  id int primary key default 1,
  bot_token text,
  chat_id text,
  updated_at timestamptz default now()
);

alter table telegram_settings enable row level security;

create policy "telegram_settings_select_authenticated"
  on telegram_settings for select
  to authenticated
  using (true);

create policy "telegram_settings_write_admin_only"
  on telegram_settings for all
  to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- ============ Trigger: auto-set created_by on insert ============
create or replace function set_created_by()
returns trigger as $$
begin
  new.created_by := auth.uid();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tasks_set_created_by on tasks;
create trigger tasks_set_created_by before insert on tasks
  for each row execute function set_created_by();

drop trigger if exists tracker_jobs_set_created_by on tracker_jobs;
create trigger tracker_jobs_set_created_by before insert on tracker_jobs
  for each row execute function set_created_by();

-- ============ First admin account ============
-- បន្ទាប់ពី Run SQL ខាងលើ អ្នកត្រូវបង្កើត admin ដំបូងតាមវិធីនេះ៖
-- 1) ទៅ Supabase Dashboard > Authentication > Users > Add user
--    បញ្ចូល email + password របស់អ្នក ហើយ tick "Auto Confirm User"
-- 2) ចម្លង UUID របស់ user នោះ (ចុចលើ user ដើម្បីមើល id)
-- 3) ត្រឡប់មក SQL Editor រួច Run command ខាងក្រោម (ដូរ YOUR-UUID-HERE និងឈ្មោះ)៖
--
-- insert into profiles (id, full_name, role) values ('YOUR-UUID-HERE', 'ឈ្មោះអ្នក', 'admin');
