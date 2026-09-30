create table if not exists public.shares (
	id uuid primary key default gen_random_uuid(),
	share_code text not null unique,
	kind text not null check (kind in ('text', 'document')),
	title text,
	encrypted_content text,
	file_path text,
	file_name text,
	file_size bigint,
	mime_type text,
	created_at timestamptz not null default now(),
	expires_at timestamptz not null,
	max_views integer not null default 1 check (max_views > 0),
	view_count integer not null default 0 check (view_count >= 0),
	download_count integer not null default 0 check (download_count >= 0),
	last_accessed_at timestamptz
);

create index if not exists shares_created_at_idx
	on public.shares (created_at desc);

create table if not exists public.recovery_requests (
	id uuid primary key default gen_random_uuid(),
	share_id uuid references public.shares (id) on delete set null,
	share_code text,
	requester_email text not null,
	reason text not null,
	status text not null default 'pending',
	resolution_note text,
	resolved_at timestamptz,
	created_at timestamptz not null default now()
);

create index if not exists recovery_requests_created_at_idx
	on public.recovery_requests (created_at desc);

alter table public.shares enable row level security;
alter table public.recovery_requests enable row level security;

insert into storage.buckets (id, name, public, file_size_limit)
values ('share-files', 'share-files', false, 26214400)
on conflict (id) do update
set public = false, file_size_limit = excluded.file_size_limit;

do $$
begin
	if exists (
		select 1 from pg_publication where pubname = 'supabase_realtime'
	) then
		if not exists (
			select 1 from pg_publication_tables
			where pubname = 'supabase_realtime'
				and schemaname = 'public'
				and tablename = 'shares'
		) then
			alter publication supabase_realtime add table public.shares;
		end if;

		if not exists (
			select 1 from pg_publication_tables
			where pubname = 'supabase_realtime'
				and schemaname = 'public'
				and tablename = 'recovery_requests'
		) then
			alter publication supabase_realtime add table public.recovery_requests;
		end if;
	end if;
end
$$;
