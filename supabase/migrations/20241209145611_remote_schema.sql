drop function if exists "public"."insert_job_with_countries"(p_title text, p_url text, p_company_id uuid, p_user_id text, p_country_names text[], p_experience_level_names text[], p_job_category_names text[]);

alter table "public"."job_posting" add column "job_url_linkedin" text;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.insert_job_with_countries(p_title text, p_url text, p_company_id uuid, p_user_id text, p_country_names text[], p_experience_level_names text[], p_job_category_names text[], p_job_url_linkedin text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare
  v_job_id uuid;
  v_country_ids uuid[];
  v_experience_level_ids uuid[];
  v_job_category_ids uuid[];
begin
  -- Convert country names to IDs
  SELECT ARRAY_AGG(id) INTO v_country_ids
  FROM country
  WHERE country_name = ANY(p_country_names);

  -- Convert experience level names to IDs
  SELECT ARRAY_AGG(id) INTO v_experience_level_ids
  FROM experience_level
  WHERE experience_level = ANY(p_experience_level_names);

  -- Convert job category names to IDs
  SELECT ARRAY_AGG(id) INTO v_job_category_ids
  FROM job_category
  WHERE job_category_name = ANY(p_job_category_names);

  -- Insert the job posting and get the ID
  insert into job_posting (
    title,
    url,
    company_id,
    user_id,
    job_status,
    job_url_linkedin
  ) values (
    p_title,
    p_url,
    p_company_id,
    p_user_id,
    case when p_url is null then 'No URL' else 'Pending' end,
    p_job_url_linkedin
  ) returning id into v_job_id;

  -- Insert the country relationships
  insert into job_posting_country (
    job_posting_id,
    country_id
  )
  select 
    v_job_id,
    unnest(v_country_ids)
  where array_length(v_country_ids, 1) > 0;

  -- Insert the experience level relationships
  insert into job_posting_experience_level (
    job_posting_id,
    experience_level_id
  )
  select 
    v_job_id,
    unnest(v_experience_level_ids)
  where array_length(v_experience_level_ids, 1) > 0;

  -- Insert the job category relationships
  insert into job_posting_job_category (
    job_posting_id,
    job_category_id
  )
  select 
    v_job_id,
    unnest(v_job_category_ids)
  where array_length(v_job_category_ids, 1) > 0;

end;
$function$
;


