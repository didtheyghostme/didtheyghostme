create table if not exists "public"."application_review" (
  "id" uuid not null default gen_random_uuid(),
  "application_id" uuid not null,
  "user_id" text not null default public.requesting_user_id(),
  "content" text not null,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  constraint "application_review_pkey" primary key ("id"),
  constraint "application_review_application_id_fkey" foreign key ("application_id") references "public"."application" ("id") on delete cascade,
  constraint "application_review_user_id_fkey" foreign key ("user_id") references "public"."user_data" ("user_id") on delete cascade
);

create unique index if not exists "unique_application_review_application_id" on "public"."application_review" using btree ("application_id");
create index if not exists "idx_application_review_application_id" on "public"."application_review" using btree ("application_id");

alter table "public"."application_review" enable row level security;

drop policy if exists "Enable read access for all users" on "public"."application_review";
create policy "Enable read access for all users" on "public"."application_review"
for select
using (true);

drop policy if exists "Enable insert for owners only" on "public"."application_review";
create policy "Enable insert for owners only" on "public"."application_review"
for insert
to authenticated
with check (
  public.requesting_user_id() = "user_id"
  and exists (
    select 1
    from "public"."application" a
    where a.id = "application_id"
      and a.user_id = public.requesting_user_id()
  )
);

drop policy if exists "Enable update for owners only" on "public"."application_review";
create policy "Enable update for owners only" on "public"."application_review"
for update
to authenticated
using (public.requesting_user_id() = "user_id")
with check (
  public.requesting_user_id() = "user_id"
  and exists (
    select 1
    from "public"."application" a
    where a.id = "application_id"
      and a.user_id = public.requesting_user_id()
  )
);

drop policy if exists "Enable delete for owners only" on "public"."application_review";
create policy "Enable delete for owners only" on "public"."application_review"
for delete
to authenticated
using (public.requesting_user_id() = "user_id");

drop trigger if exists "set_application_review_updated_at" on "public"."application_review";
create trigger "set_application_review_updated_at"
before update on "public"."application_review"
for each row
execute function "public"."set_updated_at"();

grant all on table "public"."application_review" to "anon";
grant all on table "public"."application_review" to "authenticated";
grant all on table "public"."application_review" to "service_role";

