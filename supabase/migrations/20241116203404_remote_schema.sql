drop policy "Enable insert for authenticated users only" on "public"."job_posting_country";

drop function if exists "public"."insert_job_with_countries"(p_title text, p_url text, p_company_id uuid, p_user_id text, p_country_ids uuid[]);

create table "public"."experience_level" (
    "id" uuid not null default gen_random_uuid(),
    "experience_level" text not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."experience_level" enable row level security;

create table "public"."job_posting_experience_level" (
    "id" uuid not null default gen_random_uuid(),
    "job_posting_id" uuid not null,
    "experience_level_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."job_posting_experience_level" enable row level security;

CREATE UNIQUE INDEX country_country_name_key ON public.country USING btree (country_name);

CREATE UNIQUE INDEX experience_level_experience_level_key ON public.experience_level USING btree (experience_level);

CREATE UNIQUE INDEX experience_level_pkey ON public.experience_level USING btree (id);

CREATE UNIQUE INDEX job_posting_experience_level_pkey ON public.job_posting_experience_level USING btree (id);

CREATE UNIQUE INDEX unique_job_posting_experience_level ON public.job_posting_experience_level USING btree (job_posting_id, experience_level_id);

alter table "public"."experience_level" add constraint "experience_level_pkey" PRIMARY KEY using index "experience_level_pkey";

alter table "public"."job_posting_experience_level" add constraint "job_posting_experience_level_pkey" PRIMARY KEY using index "job_posting_experience_level_pkey";

alter table "public"."country" add constraint "country_country_name_key" UNIQUE using index "country_country_name_key";

alter table "public"."experience_level" add constraint "experience_level_experience_level_key" UNIQUE using index "experience_level_experience_level_key";

alter table "public"."job_posting_experience_level" add constraint "job_posting_experience_level_experience_level_id_fkey" FOREIGN KEY (experience_level_id) REFERENCES experience_level(id) not valid;

alter table "public"."job_posting_experience_level" validate constraint "job_posting_experience_level_experience_level_id_fkey";

alter table "public"."job_posting_experience_level" add constraint "job_posting_experience_level_job_posting_id_fkey" FOREIGN KEY (job_posting_id) REFERENCES job_posting(id) not valid;

alter table "public"."job_posting_experience_level" validate constraint "job_posting_experience_level_job_posting_id_fkey";

alter table "public"."job_posting_experience_level" add constraint "unique_job_posting_experience_level" UNIQUE using index "unique_job_posting_experience_level";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.insert_job_with_countries(p_title text, p_url text, p_company_id uuid, p_user_id text, p_country_ids uuid[], p_experience_level_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare
  v_job_id uuid;
begin
  -- Insert the job posting and get just the ID
  insert into job_posting (
    title,
    url,
    company_id,
    user_id,
    job_status
  ) values (
    p_title,
    p_url,
    p_company_id,
    p_user_id,
    case when p_url is null then 'No URL' else 'Pending' end
  ) returning id into v_job_id;

  -- Insert the country relationships
  insert into job_posting_country (
    job_posting_id,
    country_id
  )
  select 
    v_job_id,
    unnest(p_country_ids)
  where array_length(p_country_ids, 1) > 0;

  -- Insert the experience level relationship
  insert into job_posting_experience_level (
    job_posting_id,
    experience_level_id
  ) values (
    v_job_id,
    p_experience_level_id
  );
end;
$function$
;

grant delete on table "public"."experience_level" to "anon";

grant insert on table "public"."experience_level" to "anon";

grant references on table "public"."experience_level" to "anon";

grant select on table "public"."experience_level" to "anon";

grant trigger on table "public"."experience_level" to "anon";

grant truncate on table "public"."experience_level" to "anon";

grant update on table "public"."experience_level" to "anon";

grant delete on table "public"."experience_level" to "authenticated";

grant insert on table "public"."experience_level" to "authenticated";

grant references on table "public"."experience_level" to "authenticated";

grant select on table "public"."experience_level" to "authenticated";

grant trigger on table "public"."experience_level" to "authenticated";

grant truncate on table "public"."experience_level" to "authenticated";

grant update on table "public"."experience_level" to "authenticated";

grant delete on table "public"."experience_level" to "service_role";

grant insert on table "public"."experience_level" to "service_role";

grant references on table "public"."experience_level" to "service_role";

grant select on table "public"."experience_level" to "service_role";

grant trigger on table "public"."experience_level" to "service_role";

grant truncate on table "public"."experience_level" to "service_role";

grant update on table "public"."experience_level" to "service_role";

grant delete on table "public"."job_posting_experience_level" to "anon";

grant insert on table "public"."job_posting_experience_level" to "anon";

grant references on table "public"."job_posting_experience_level" to "anon";

grant select on table "public"."job_posting_experience_level" to "anon";

grant trigger on table "public"."job_posting_experience_level" to "anon";

grant truncate on table "public"."job_posting_experience_level" to "anon";

grant update on table "public"."job_posting_experience_level" to "anon";

grant delete on table "public"."job_posting_experience_level" to "authenticated";

grant insert on table "public"."job_posting_experience_level" to "authenticated";

grant references on table "public"."job_posting_experience_level" to "authenticated";

grant select on table "public"."job_posting_experience_level" to "authenticated";

grant trigger on table "public"."job_posting_experience_level" to "authenticated";

grant truncate on table "public"."job_posting_experience_level" to "authenticated";

grant update on table "public"."job_posting_experience_level" to "authenticated";

grant delete on table "public"."job_posting_experience_level" to "service_role";

grant insert on table "public"."job_posting_experience_level" to "service_role";

grant references on table "public"."job_posting_experience_level" to "service_role";

grant select on table "public"."job_posting_experience_level" to "service_role";

grant trigger on table "public"."job_posting_experience_level" to "service_role";

grant truncate on table "public"."job_posting_experience_level" to "service_role";

grant update on table "public"."job_posting_experience_level" to "service_role";

create policy "Enable read access for all users"
on "public"."experience_level"
as permissive
for select
to public
using (true);


create policy "Enable insert for authenticated users and ADMIN only"
on "public"."job_posting_country"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM job_posting
  WHERE ((job_posting.id = job_posting_country.job_posting_id) AND ((requesting_user_id() = job_posting.user_id) OR is_admin())))));


create policy "Enable insert for authenticated users and ADMIN only"
on "public"."job_posting_experience_level"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM job_posting
  WHERE ((job_posting.id = job_posting_experience_level.job_posting_id) AND ((job_posting.user_id = requesting_user_id()) OR is_admin())))));


create policy "Enable read access for all users"
on "public"."job_posting_experience_level"
as permissive
for select
to public
using (true);


create policy "Enable update for ADMIN only"
on "public"."job_posting_experience_level"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM job_posting
  WHERE ((job_posting.id = job_posting_experience_level.job_posting_id) AND is_admin()))))
with check ((EXISTS ( SELECT 1
   FROM job_posting
  WHERE ((job_posting.id = job_posting_experience_level.job_posting_id) AND is_admin()))));



