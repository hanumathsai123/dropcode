create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  maintenance_enabled boolean not null default false,
  maintenance_message text not null default 'We are making a few improvements. Please check back shortly.',
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
revoke all on table public.site_settings from anon, authenticated;
grant all on table public.site_settings to service_role;

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;