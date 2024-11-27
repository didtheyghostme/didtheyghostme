drop function if exists "public"."insert_job_with_countries"(p_title text, p_url text, p_company_id uuid, p_user_id text, p_country_ids uuid[], p_experience_level_id uuid);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.insert_job_with_countries(p_title text, p_url text, p_company_id uuid, p_user_id text, p_country_ids uuid[], p_experience_level_ids uuid[])
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

end;
$function$
;


