drop function if exists "public"."insert_job_with_countries"(p_title text, p_url text, p_company_id uuid, p_user_id text, p_country_ids uuid[], p_experience_level_ids uuid[]);

create table "public"."job_category" (
    "id" uuid not null default gen_random_uuid(),
    "job_category_name" text not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."job_category" enable row level security;

create table "public"."job_posting_job_category" (
    "id" uuid not null default gen_random_uuid(),
    "job_posting_id" uuid not null,
    "job_category_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."job_posting_job_category" enable row level security;

CREATE UNIQUE INDEX job_category_job_category_name_key ON public.job_category USING btree (job_category_name);

CREATE UNIQUE INDEX job_category_pkey ON public.job_category USING btree (id);

CREATE UNIQUE INDEX job_posting_job_category_pkey ON public.job_posting_job_category USING btree (id);

CREATE UNIQUE INDEX unique_job_posting_job_category ON public.job_posting_job_category USING btree (job_posting_id, job_category_id);

alter table "public"."job_category" add constraint "job_category_pkey" PRIMARY KEY using index "job_category_pkey";

alter table "public"."job_posting_job_category" add constraint "job_posting_job_category_pkey" PRIMARY KEY using index "job_posting_job_category_pkey";

alter table "public"."job_category" add constraint "job_category_job_category_name_key" UNIQUE using index "job_category_job_category_name_key";

alter table "public"."job_posting_job_category" add constraint "job_posting_job_category_job_category_id_fkey" FOREIGN KEY (job_category_id) REFERENCES job_category(id) not valid;

alter table "public"."job_posting_job_category" validate constraint "job_posting_job_category_job_category_id_fkey";

alter table "public"."job_posting_job_category" add constraint "job_posting_job_category_job_posting_id_fkey" FOREIGN KEY (job_posting_id) REFERENCES job_posting(id) not valid;

alter table "public"."job_posting_job_category" validate constraint "job_posting_job_category_job_posting_id_fkey";

alter table "public"."job_posting_job_category" add constraint "unique_job_posting_job_category" UNIQUE using index "unique_job_posting_job_category";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.insert_job_with_countries(p_title text, p_url text, p_company_id uuid, p_user_id text, p_country_ids uuid[], p_experience_level_ids uuid[], p_job_category_ids uuid[])
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


  -- Insert the experience level relationships (similar to countries)
  insert into job_posting_experience_level (
    job_posting_id,
    experience_level_id
  )
  select 
    v_job_id,
    unnest(p_experience_level_ids)
  where array_length(p_experience_level_ids, 1) > 0;

  -- Insert the job category relationships
  insert into job_posting_job_category (
    job_posting_id,
    job_category_id
  )
  select 
    v_job_id,
    unnest(p_job_category_ids)
  where array_length(p_job_category_ids, 1) > 0;

end;
$function$
;

grant delete on table "public"."job_category" to "anon";

grant insert on table "public"."job_category" to "anon";

grant references on table "public"."job_category" to "anon";

grant select on table "public"."job_category" to "anon";

grant trigger on table "public"."job_category" to "anon";

grant truncate on table "public"."job_category" to "anon";

grant update on table "public"."job_category" to "anon";

grant delete on table "public"."job_category" to "authenticated";

grant insert on table "public"."job_category" to "authenticated";

grant references on table "public"."job_category" to "authenticated";

grant select on table "public"."job_category" to "authenticated";

grant trigger on table "public"."job_category" to "authenticated";

grant truncate on table "public"."job_category" to "authenticated";

grant update on table "public"."job_category" to "authenticated";

grant delete on table "public"."job_category" to "service_role";

grant insert on table "public"."job_category" to "service_role";

grant references on table "public"."job_category" to "service_role";

grant select on table "public"."job_category" to "service_role";

grant trigger on table "public"."job_category" to "service_role";

grant truncate on table "public"."job_category" to "service_role";

grant update on table "public"."job_category" to "service_role";

grant delete on table "public"."job_posting_job_category" to "anon";

grant insert on table "public"."job_posting_job_category" to "anon";

grant references on table "public"."job_posting_job_category" to "anon";

grant select on table "public"."job_posting_job_category" to "anon";

grant trigger on table "public"."job_posting_job_category" to "anon";

grant truncate on table "public"."job_posting_job_category" to "anon";

grant update on table "public"."job_posting_job_category" to "anon";

grant delete on table "public"."job_posting_job_category" to "authenticated";

grant insert on table "public"."job_posting_job_category" to "authenticated";

grant references on table "public"."job_posting_job_category" to "authenticated";

grant select on table "public"."job_posting_job_category" to "authenticated";

grant trigger on table "public"."job_posting_job_category" to "authenticated";

grant truncate on table "public"."job_posting_job_category" to "authenticated";

grant update on table "public"."job_posting_job_category" to "authenticated";

grant delete on table "public"."job_posting_job_category" to "service_role";

grant insert on table "public"."job_posting_job_category" to "service_role";

grant references on table "public"."job_posting_job_category" to "service_role";

grant select on table "public"."job_posting_job_category" to "service_role";

grant trigger on table "public"."job_posting_job_category" to "service_role";

grant truncate on table "public"."job_posting_job_category" to "service_role";

grant update on table "public"."job_posting_job_category" to "service_role";

create policy "Enable read access for all users"
on "public"."job_category"
as permissive
for select
to public
using (true);


create policy "Enable delete for ADMIN only"
on "public"."job_posting_job_category"
as permissive
for delete
to authenticated
using ((is_admin() AND (EXISTS ( SELECT 1
   FROM job_posting
  WHERE (job_posting.id = job_posting_job_category.job_posting_id)))));


create policy "Enable insert for authenticated users and ADMIN only"
on "public"."job_posting_job_category"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM job_posting
  WHERE ((job_posting.id = job_posting_job_category.job_posting_id) AND ((job_posting.user_id = requesting_user_id()) OR is_admin())))));


create policy "Enable read access for all users"
on "public"."job_posting_job_category"
as permissive
for select
to public
using (true);



