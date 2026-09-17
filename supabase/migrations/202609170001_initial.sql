-- Apply once in the SQL Editor of the owner's NEW assignment-only Supabase project.
-- No reset, sample data, account creation, or destructive statements.
begin;

create table public.profiles (
  id uuid primary key default auth.uid() references auth.users(id),
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null check (
    char_length(display_name) between 1 and 30
    and display_name = btrim(display_name, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')
  ),
  bio text not null default '' check (char_length(bio) <= 160),
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles(id),
  content text not null check (
    char_length(content) between 1 and 500
    and content = btrim(content, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')
  ),
  created_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id),
  parent_id uuid,
  author_id uuid not null default auth.uid() references public.profiles(id),
  content text not null check (
    char_length(content) between 1 and 500
    and content = btrim(content, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')
  ),
  created_at timestamptz not null default now(),
  unique (post_id, id),
  foreign key (post_id, parent_id) references public.comments(post_id, id)
);

create table public.follows (
  follower_id uuid not null default auth.uid() references public.profiles(id),
  followee_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create function public.check_comment_parent()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.parent_id is not null and not exists (
    select 1 from public.comments parent
    where parent.id = new.parent_id
      and parent.post_id = new.post_id
      and parent.parent_id is null
  ) then
    raise exception 'Reply must reference a root comment on the same post'
      using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.check_comment_parent() from public, anon, authenticated;
create trigger comments_parent_guard before insert on public.comments
for each row execute function public.check_comment_parent();

create index posts_feed_idx on public.posts (created_at desc, id desc);
create index posts_author_idx on public.posts (author_id, created_at desc, id desc);
create index comments_thread_idx on public.comments (post_id, parent_id, created_at, id);
create index follows_reverse_idx on public.follows (followee_id, follower_id);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;

revoke all on public.profiles, public.posts, public.comments, public.follows from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
-- Every column here is public; Auth emails and credentials remain in auth.users.
grant select on public.profiles, public.posts, public.comments, public.follows to anon, authenticated;
grant insert (username, display_name, bio) on public.profiles to authenticated;
grant insert (content) on public.posts to authenticated;
grant insert (post_id, parent_id, content) on public.comments to authenticated;
grant insert (followee_id) on public.follows to authenticated;
grant delete on public.follows to authenticated;

create policy profiles_read on public.profiles for select to anon, authenticated using (true);
create policy posts_read on public.posts for select to anon, authenticated using (true);
create policy comments_read on public.comments for select to anon, authenticated using (true);
create policy follows_read on public.follows for select to anon, authenticated using (true);

-- The anonymous Auth feature is disabled in the dashboard, and also denied here.
create policy profiles_insert on public.profiles for insert to authenticated with check (
  id = (select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'), 'false') = 'false'
);
create policy posts_insert on public.posts for insert to authenticated with check (
  author_id = (select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'), 'false') = 'false'
);
create policy comments_insert on public.comments for insert to authenticated with check (
  author_id = (select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'), 'false') = 'false'
);
create policy follows_insert on public.follows for insert to authenticated with check (
  follower_id = (select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'), 'false') = 'false'
);
create policy follows_delete on public.follows for delete to authenticated using (
  follower_id = (select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'), 'false') = 'false'
);

commit;
