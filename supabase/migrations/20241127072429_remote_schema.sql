drop trigger if exists "after_trigger_job_posting_changelog" on "public"."job_posting";

drop function if exists "public"."trigger_job_posting_changelog"();

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_job_with_countries(p_job_posting_id uuid, p_title text, p_url text, p_country_ids uuid[], p_closed_date date, p_job_status text, p_job_posted_date date)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_old_job_posting job_posting%ROWTYPE;
  v_new_job_posting job_posting%ROWTYPE;
  v_old_country_ids uuid[];
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

  -- Build history for changed fields (fixing NULL at source)
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

  -- Insert changelog if there are any changes
  IF v_history IS NOT NULL AND v_history <> '{}'::jsonb THEN
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


