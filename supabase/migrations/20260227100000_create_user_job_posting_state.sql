create table if not exists "public"."user_job_posting_state" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" text not null default public.requesting_user_id(),
  "job_posting_id" uuid not null,
  "to_apply_at" timestamp with time zone,
  "skipped_at" timestamp with time zone,
  "note" text,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  constraint "user_job_posting_state_pkey" primary key ("id"),
  constraint "user_job_posting_state_job_posting_id_fkey" foreign key ("job_posting_id") references "public"."job_posting" ("id") on delete cascade,
  constraint "user_job_posting_state_user_id_fkey" foreign key ("user_id") references "public"."user_data" ("user_id") on delete cascade
);

create unique index if not exists "unique_user_job_posting_state" on "public"."user_job_posting_state" using btree ("user_id", "job_posting_id");
create index if not exists "idx_user_job_posting_state_user_to_apply" on "public"."user_job_posting_state" using btree ("user_id", "to_apply_at");
create index if not exists "idx_user_job_posting_state_user_skipped" on "public"."user_job_posting_state" using btree ("user_id", "skipped_at");

alter table "public"."user_job_posting_state" enable row level security;

drop policy if exists "Enable owner read" on "public"."user_job_posting_state";
create policy "Enable owner read" on "public"."user_job_posting_state"
for select
to authenticated
using (public.requesting_user_id() = "user_id");

drop policy if exists "Enable owner insert" on "public"."user_job_posting_state";
create policy "Enable owner insert" on "public"."user_job_posting_state"
for insert
to authenticated
with check (public.requesting_user_id() = "user_id");

drop policy if exists "Enable owner update" on "public"."user_job_posting_state";
create policy "Enable owner update" on "public"."user_job_posting_state"
for update
to authenticated
using (public.requesting_user_id() = "user_id")
with check (public.requesting_user_id() = "user_id");

drop policy if exists "Enable owner delete" on "public"."user_job_posting_state";
create policy "Enable owner delete" on "public"."user_job_posting_state"
for delete
to authenticated
using (public.requesting_user_id() = "user_id");

create or replace function "public"."set_updated_at"()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists "set_user_job_posting_state_updated_at" on "public"."user_job_posting_state";
create trigger "set_user_job_posting_state_updated_at"
before update on "public"."user_job_posting_state"
for each row
execute function "public"."set_updated_at"();

grant all on table "public"."user_job_posting_state" to "anon";
grant all on table "public"."user_job_posting_state" to "authenticated";
grant all on table "public"."user_job_posting_state" to "service_role";

