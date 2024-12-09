set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_user_preferences(p_user_id text, p_default_countries text[], p_default_job_categories text[], p_default_experience_levels text[])
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Delete country preferences that are no longer needed
  DELETE FROM user_preference 
  WHERE user_id = p_user_id 
    AND preference_key = 'default_countries'
    AND preference_value NOT IN (SELECT unnest(p_default_countries));

  -- Delete job category preferences that are no longer needed
  DELETE FROM user_preference 
  WHERE user_id = p_user_id 
    AND preference_key = 'default_job_categories'
    AND preference_value NOT IN (SELECT unnest(p_default_job_categories));

  -- Delete experience level preferences that are no longer needed
  DELETE FROM user_preference 
  WHERE user_id = p_user_id 
    AND preference_key = 'default_experience_levels'
    AND preference_value NOT IN (SELECT unnest(p_default_experience_levels));
  
  -- Insert new preferences with conflict handling
  INSERT INTO user_preference (user_id, preference_key, preference_value)
  SELECT 
    p_user_id,
    'default_countries'::text,
    unnest(p_default_countries)
  ON CONFLICT (user_id, preference_key, preference_value) 
  DO NOTHING;

  INSERT INTO user_preference (user_id, preference_key, preference_value)
  SELECT 
    p_user_id,
    'default_job_categories'::text,
    unnest(p_default_job_categories)
  ON CONFLICT (user_id, preference_key, preference_value) 
  DO NOTHING;

  INSERT INTO user_preference (user_id, preference_key, preference_value)
  SELECT 
    p_user_id,
    'default_experience_levels'::text,
    unnest(p_default_experience_levels)
  ON CONFLICT (user_id, preference_key, preference_value) 
  DO NOTHING;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_preferences_and_options(p_user_id text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_default_countries text[];
    v_default_job_categories text[];
    v_default_experience_levels text[];
BEGIN
    -- Get user preferences as arrays only if user_id is provided
    IF p_user_id IS NOT NULL THEN
        SELECT ARRAY_AGG(preference_value) INTO v_default_countries
        FROM user_preference
        WHERE user_id = p_user_id AND preference_key = 'default_countries';

        SELECT ARRAY_AGG(preference_value) INTO v_default_job_categories
        FROM user_preference
        WHERE user_id = p_user_id AND preference_key = 'default_job_categories';

        SELECT ARRAY_AGG(preference_value) INTO v_default_experience_levels
        FROM user_preference
        WHERE user_id = p_user_id AND preference_key = 'default_experience_levels';
    END IF;

    -- Return flattened results with defaults for both logged-in and logged-out users
    RETURN json_build_object(
        'default_countries', COALESCE(v_default_countries, ARRAY['Singapore']),
        'default_job_categories', COALESCE(v_default_job_categories, ARRAY['Tech']),
        'default_experience_levels', COALESCE(v_default_experience_levels, ARRAY['Internship']),
        'available_countries', (
            SELECT json_agg(country_name ORDER BY country_name)
            FROM (SELECT country_name FROM get_available_countries()) as countries
        ),
        'all_job_categories', (
            SELECT json_agg(job_category_name ORDER BY created_at ASC)
            FROM job_category
        ),
        'all_experience_levels', (
            SELECT json_agg(experience_level ORDER BY created_at ASC)
            FROM experience_level
        )
    );
END;
$function$
;


