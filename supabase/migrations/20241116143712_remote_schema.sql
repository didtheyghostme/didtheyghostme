create table "public"."country" (
    "id" uuid not null default gen_random_uuid(),
    "country_name" text not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."country" enable row level security;

create table "public"."job_posting_country" (
    "id" uuid not null default gen_random_uuid(),
    "job_posting_id" uuid not null,
    "country_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."job_posting_country" enable row level security;

alter table "public"."job_posting" drop column "country";

CREATE UNIQUE INDEX country_pkey ON public.country USING btree (id);

CREATE UNIQUE INDEX job_posting_country_pkey ON public.job_posting_country USING btree (id);

CREATE UNIQUE INDEX unique_job_posting_country ON public.job_posting_country USING btree (job_posting_id, country_id);

alter table "public"."country" add constraint "country_pkey" PRIMARY KEY using index "country_pkey";

alter table "public"."job_posting_country" add constraint "job_posting_country_pkey" PRIMARY KEY using index "job_posting_country_pkey";

alter table "public"."job_posting_country" add constraint "job_posting_country_country_id_fkey" FOREIGN KEY (country_id) REFERENCES country(id) not valid;

alter table "public"."job_posting_country" validate constraint "job_posting_country_country_id_fkey";

alter table "public"."job_posting_country" add constraint "job_posting_country_job_posting_id_fkey" FOREIGN KEY (job_posting_id) REFERENCES job_posting(id) not valid;

alter table "public"."job_posting_country" validate constraint "job_posting_country_job_posting_id_fkey";

alter table "public"."job_posting_country" add constraint "unique_job_posting_country" UNIQUE using index "unique_job_posting_country";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.insert_job_with_countries(p_title text, p_url text, p_company_id uuid, p_user_id text, p_country_ids uuid[])
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
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_job_with_countries(p_job_posting_id uuid, p_title text, p_url text, p_country_ids uuid[], p_closed_date date, p_job_status text, p_job_posted_date date)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Delete country relationships that are no longer needed
  DELETE FROM job_posting_country
  WHERE job_posting_id = p_job_posting_id
    AND country_id NOT IN (
      SELECT unnest(p_country_ids)
    );

  -- Insert/Update country relationships
  INSERT INTO job_posting_country (
    job_posting_id,
    country_id
  )
  SELECT
    p_job_posting_id,
    unnest(p_country_ids)
  WHERE array_length(p_country_ids, 1) > 0
  ON CONFLICT (job_posting_id, country_id) DO NOTHING;

  -- Now update job_posting
  UPDATE job_posting SET
    title = p_title,
    url = p_url,
    closed_date = p_closed_date,
    job_status = p_job_status,
    job_posted_date = p_job_posted_date,
    updated_at = CASE
      WHEN job_status = 'No URL' AND p_job_status = 'Verified'
      THEN NOW()
      ELSE updated_at
    END
  WHERE id = p_job_posting_id;
END;
$function$
;

grant delete on table "public"."country" to "anon";

grant insert on table "public"."country" to "anon";

grant references on table "public"."country" to "anon";

grant select on table "public"."country" to "anon";

grant trigger on table "public"."country" to "anon";

grant truncate on table "public"."country" to "anon";

grant update on table "public"."country" to "anon";

grant delete on table "public"."country" to "authenticated";

grant insert on table "public"."country" to "authenticated";

grant references on table "public"."country" to "authenticated";

grant select on table "public"."country" to "authenticated";

grant trigger on table "public"."country" to "authenticated";

grant truncate on table "public"."country" to "authenticated";

grant update on table "public"."country" to "authenticated";

grant delete on table "public"."country" to "service_role";

grant insert on table "public"."country" to "service_role";

grant references on table "public"."country" to "service_role";

grant select on table "public"."country" to "service_role";

grant trigger on table "public"."country" to "service_role";

grant truncate on table "public"."country" to "service_role";

grant update on table "public"."country" to "service_role";

grant delete on table "public"."job_posting_country" to "anon";

grant insert on table "public"."job_posting_country" to "anon";

grant references on table "public"."job_posting_country" to "anon";

grant select on table "public"."job_posting_country" to "anon";

grant trigger on table "public"."job_posting_country" to "anon";

grant truncate on table "public"."job_posting_country" to "anon";

grant update on table "public"."job_posting_country" to "anon";

grant delete on table "public"."job_posting_country" to "authenticated";

grant insert on table "public"."job_posting_country" to "authenticated";

grant references on table "public"."job_posting_country" to "authenticated";

grant select on table "public"."job_posting_country" to "authenticated";

grant trigger on table "public"."job_posting_country" to "authenticated";

grant truncate on table "public"."job_posting_country" to "authenticated";

grant update on table "public"."job_posting_country" to "authenticated";

grant delete on table "public"."job_posting_country" to "service_role";

grant insert on table "public"."job_posting_country" to "service_role";

grant references on table "public"."job_posting_country" to "service_role";

grant select on table "public"."job_posting_country" to "service_role";

grant trigger on table "public"."job_posting_country" to "service_role";

grant truncate on table "public"."job_posting_country" to "service_role";

grant update on table "public"."job_posting_country" to "service_role";

create policy "Enable read access for all users"
on "public"."country"
as permissive
for select
to public
using (true);


create policy "Enable delete for ADMIN only"
on "public"."job_posting_country"
as permissive
for delete
to authenticated
using ((is_admin() AND (EXISTS ( SELECT 1
   FROM job_posting
  WHERE (job_posting.id = job_posting_country.job_posting_id)))));


create policy "Enable insert for authenticated users only"
on "public"."job_posting_country"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM job_posting
  WHERE ((job_posting.id = job_posting_country.job_posting_id) AND ((requesting_user_id() = job_posting.user_id) OR is_admin())))));


create policy "Enable read access for all users"
on "public"."job_posting_country"
as permissive
for select
to public
using (true);



