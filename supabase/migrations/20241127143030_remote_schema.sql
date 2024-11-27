drop policy "Enable update for ADMIN only" on "public"."job_posting_experience_level";

drop function if exists "public"."update_job_with_countries"(p_job_posting_id uuid, p_title text, p_url text, p_country_ids uuid[], p_closed_date date, p_job_status text, p_job_posted_date date);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_job_with_countries(p_job_posting_id uuid, p_title text, p_url text, p_country_ids uuid[], p_closed_date date, p_job_status text, p_job_posted_date date, p_experience_level_ids uuid[])
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_old_job_posting job_posting%ROWTYPE;
  v_new_job_posting job_posting%ROWTYPE;
  v_old_country_ids uuid[];
  v_old_experience_level_ids uuid[];
  v_history jsonb;
BEGIN
  -- Get old data first
  SELECT * INTO v_old_job_posting 
  FROM job_posting 
  WHERE id = p_job_posting_id;

  -- Get old country IDs before any changes
  v_old_country_ids := ARRAY(
    SELECT country_id 
    FROM job_posting_country 
    WHERE job_posting_id = p_job_posting_id
    ORDER BY country_id
  );

  -- Get old experience level IDs before any changes
  v_old_experience_level_ids := ARRAY(
    SELECT experience_level_id 
    FROM job_posting_experience_level 
    WHERE job_posting_id = p_job_posting_id
    ORDER BY experience_level_id
  );

  -- Update job_posting and get new data
  UPDATE job_posting SET
    title = p_title,
    url = p_url,
    closed_date = p_closed_date,
    job_status = p_job_status,
    job_posted_date = p_job_posted_date,
    updated_at = CASE 
      WHEN job_status = 'No URL' AND p_job_status = 'Verified' 
      THEN now() 
      ELSE updated_at 
    END
  WHERE id = p_job_posting_id
  RETURNING * INTO v_new_job_posting;

  -- Delete country relationships that are no longer needed
  DELETE FROM job_posting_country
  WHERE job_posting_id = p_job_posting_id
  AND country_id NOT IN (SELECT unnest(p_country_ids));

  -- Insert/Update country relationships
  INSERT INTO job_posting_country (job_posting_id, country_id)
  SELECT p_job_posting_id, unnest(p_country_ids)
  WHERE array_length(p_country_ids, 1) > 0
  ON CONFLICT (job_posting_id, country_id) DO NOTHING;

  -- Delete experience level relationships that are no longer needed
  DELETE FROM job_posting_experience_level
  WHERE job_posting_id = p_job_posting_id
  AND experience_level_id NOT IN (SELECT unnest(p_experience_level_ids));

  -- Insert/Update experience level relationships
  INSERT INTO job_posting_experience_level (job_posting_id, experience_level_id)
  SELECT p_job_posting_id, unnest(p_experience_level_ids)
  WHERE array_length(p_experience_level_ids, 1) > 0
  ON CONFLICT (job_posting_id, experience_level_id) DO NOTHING;

  -- Build history for changed fields (fixing NULL at source) using COALESCE
  SELECT COALESCE(jsonb_object_agg(
    NEW_data.key,
    jsonb_build_object(
      'old', OLD_data.value,
      'new', NEW_data.value
    )
  ), '{}'::jsonb)
  INTO v_history
  FROM jsonb_each(to_jsonb(v_new_job_posting)) AS NEW_data(key, value)
  JOIN jsonb_each(to_jsonb(v_old_job_posting)) AS OLD_data(key, value)
    ON NEW_data.key = OLD_data.key
  WHERE NEW_data.key NOT IN ('id', 'created_at', 'updated_at', 'user_id')
    AND OLD_data.value IS DISTINCT FROM NEW_data.value;

  -- Add country changes if any exist
  IF v_old_country_ids IS DISTINCT FROM (SELECT ARRAY(SELECT unnest(p_country_ids) ORDER BY 1)) THEN
    v_history := v_history || jsonb_build_object(
      'countries', jsonb_build_object(
        'old', (
          SELECT jsonb_agg(country_name ORDER BY country_name)
          FROM country
          WHERE id IN (
            SELECT UNNEST(v_old_country_ids)
          )
        ),
        'new', (
          SELECT jsonb_agg(country_name ORDER BY country_name)
          FROM country
          WHERE id IN (
            SELECT UNNEST(p_country_ids)
          )
        )
      )
    );
  END IF;

  -- Add experience level changes if any exist
  IF v_old_experience_level_ids IS DISTINCT FROM (SELECT ARRAY(SELECT unnest(p_experience_level_ids) ORDER BY 1)) THEN
    v_history := v_history || jsonb_build_object(
      'experience_levels', jsonb_build_object(
        'old', (
          SELECT jsonb_agg(experience_level ORDER BY experience_level)
          FROM experience_level
          WHERE id IN (
            SELECT UNNEST(v_old_experience_level_ids)
          )
        ),
        'new', (
          SELECT jsonb_agg(experience_level ORDER BY experience_level)
          FROM experience_level
          WHERE id IN (
            SELECT UNNEST(p_experience_level_ids)
          )
        )
      )
    );
  END IF;

  -- Insert changelog if there are any changes
  IF v_history <> '{}'::jsonb THEN
    INSERT INTO job_posting_changelog (
      job_posting_id,
      history,
      handled_by
    ) VALUES (
      p_job_posting_id,
      v_history,
      requesting_user_id()
    );
  END IF;

END;
$function$
;

create policy "Enable delete for ADMIN only"
on "public"."job_posting_experience_level"
as permissive
for delete
to authenticated
using ((is_admin() AND (EXISTS ( SELECT 1
   FROM job_posting
  WHERE (job_posting.id = job_posting_experience_level.job_posting_id)))));



