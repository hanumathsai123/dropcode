create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  company_name text not null check (length(company_name) between 1 and 120),
  title text not null check (length(title) between 1 and 160),
  description text not null default '' check (length(description) <= 1000),
  destination_url text not null,
  button_text text not null default 'Learn More' check (length(button_text) between 1 and 60),
  button_alignment text not null default 'right' check (button_alignment in ('left', 'right')),
  media_path text not null,
  media_type text not null check (media_type in ('image', 'video')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promotions_valid_window check (end_at > start_at)
);

alter table public.promotions
  add column if not exists button_alignment text not null default 'right'
  check (button_alignment in ('left', 'right'));

create index if not exists promotions_active_window_idx
  on public.promotions (enabled, start_at, end_at);

create or replace function public.update_promotions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists promotions_updated_at on public.promotions;
create trigger promotions_updated_at
  before update on public.promotions
  for each row execute function public.update_promotions_updated_at();

alter table public.promotions enable row level security;
revoke all on table public.promotions from anon, authenticated;
grant all on table public.promotions to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'promotion-media',
  'promotion-media',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
