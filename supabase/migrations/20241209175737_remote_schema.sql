drop function if exists "public"."get_user_preferences_and_options"(p_user_id text);

drop function if exists "public"."update_user_preferences"(p_user_id text, p_default_countries text[], p_default_job_categories text[], p_default_experience_levels text[]);

drop function if exists "public"."get_available_countries"();

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_user_preferences_insert_job(p_user_id text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_insert_default_countries text[];
    v_insert_default_job_categories text[];
    v_insert_default_experience_levels text[];
    v_all_options json;
BEGIN
    -- Get all options
    v_all_options := helper_user_preferences_get_all_options(
        p_include_available_countries := false,
        p_include_all_countries := true
    );
    
    -- Get user preferences
    IF p_user_id IS NOT NULL THEN
        SELECT ARRAY_AGG(preference_value) INTO v_insert_default_countries
        FROM user_preference
        WHERE user_id = p_user_id AND preference_key = 'insert_default_countries';

        SELECT ARRAY_AGG(preference_value) INTO v_insert_default_job_categories
        FROM user_preference
        WHERE user_id = p_user_id AND preference_key = 'insert_default_job_categories';

        SELECT ARRAY_AGG(preference_value) INTO v_insert_default_experience_levels
        FROM user_preference
        WHERE user_id = p_user_id AND preference_key = 'insert_default_experience_levels';
    END IF;

    RETURN jsonb_build_object(
        'insert_default_countries', COALESCE(v_insert_default_countries, ARRAY['Singapore']),
        'insert_default_job_categories', COALESCE(v_insert_default_job_categories, ARRAY['Tech']),
        'insert_default_experience_levels', COALESCE(v_insert_default_experience_levels, ARRAY['Internship'])
    ) || v_all_options::jsonb;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_preferences_job_search(p_user_id text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_default_countries text[];
    v_default_job_categories text[];
    v_default_experience_levels text[];
    v_all_options json;
BEGIN
    -- Get all options
    v_all_options := helper_user_preferences_get_all_options(
        p_include_available_countries := true,
        p_include_all_countries := false
    );

    -- Get user preferences
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

    RETURN jsonb_build_object(
        'default_countries', COALESCE(v_default_countries, ARRAY['Singapore']),
        'default_job_categories', COALESCE(v_default_job_categories, ARRAY['Tech']),
        'default_experience_levels', COALESCE(v_default_experience_levels, ARRAY['Internship'])
    ) || v_all_options::jsonb;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_preferences_settings(p_user_id text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_default_countries text[];
    v_default_job_categories text[];
    v_default_experience_levels text[];
    v_insert_default_countries text[];
    v_insert_default_job_categories text[];
    v_insert_default_experience_levels text[];
    v_all_options json;
BEGIN
    -- Get all options
    v_all_options := helper_user_preferences_get_all_options(
        p_include_available_countries := true,
        p_include_all_countries := true
    );
    
    -- Get user preferences
    IF p_user_id IS NOT NULL THEN
        -- Get search preferences
        SELECT ARRAY_AGG(preference_value) INTO v_default_countries
        FROM user_preference
        WHERE user_id = p_user_id AND preference_key = 'default_countries';

        SELECT ARRAY_AGG(preference_value) INTO v_default_job_categories
        FROM user_preference
        WHERE user_id = p_user_id AND preference_key = 'default_job_categories';

        SELECT ARRAY_AGG(preference_value) INTO v_default_experience_levels
        FROM user_preference
        WHERE user_id = p_user_id AND preference_key = 'default_experience_levels';

        -- Get insert preferences
        SELECT ARRAY_AGG(preference_value) INTO v_insert_default_countries
        FROM user_preference
        WHERE user_id = p_user_id AND preference_key = 'insert_default_countries';

        SELECT ARRAY_AGG(preference_value) INTO v_insert_default_job_categories
        FROM user_preference
        WHERE user_id = p_user_id AND preference_key = 'insert_default_job_categories';

        SELECT ARRAY_AGG(preference_value) INTO v_insert_default_experience_levels
        FROM user_preference
        WHERE user_id = p_user_id AND preference_key = 'insert_default_experience_levels';
    END IF;

    RETURN jsonb_build_object(
        'default_countries', COALESCE(v_default_countries, ARRAY['Singapore']),
        'default_job_categories', COALESCE(v_default_job_categories, ARRAY['Tech']),
        'default_experience_levels', COALESCE(v_default_experience_levels, ARRAY['Internship']),
        'insert_default_countries', COALESCE(v_insert_default_countries, ARRAY['Singapore']),
        'insert_default_job_categories', COALESCE(v_insert_default_job_categories, ARRAY['Tech']),
        'insert_default_experience_levels', COALESCE(v_insert_default_experience_levels, ARRAY['Internship'])
    ) || v_all_options::jsonb;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.helper_user_preferences_get_all_options(p_include_available_countries boolean DEFAULT false, p_include_all_countries boolean DEFAULT true)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_result jsonb := '{}'::jsonb;
BEGIN
    -- Add available_countries if requested
    IF p_include_available_countries THEN
        v_result := v_result || jsonb_build_object(
            'available_countries',
            (SELECT json_agg(country_name) FROM get_available_countries())
        );
    END IF;

    -- Add all_countries if requested
    IF p_include_all_countries THEN
        v_result := v_result || jsonb_build_object(
            'all_countries',
            (SELECT json_agg(country_name ORDER BY country_name ASC) FROM country)
        );
    END IF;

    -- Add job categories
    v_result := v_result || jsonb_build_object(
        'all_job_categories',
        (SELECT json_agg(job_category_name ORDER BY created_at ASC) FROM job_category)
    );

    -- Add experience levels
    v_result := v_result || jsonb_build_object(
        'all_experience_levels',
        (SELECT json_agg(experience_level ORDER BY created_at ASC) FROM experience_level)
    );

    RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_preferences(p_user_id text, p_default_countries text[], p_default_job_categories text[], p_default_experience_levels text[], p_insert_default_countries text[], p_insert_default_job_categories text[], p_insert_default_experience_levels text[])
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Delete search preferences that are no longer needed
  DELETE FROM user_preference 
  WHERE user_id = p_user_id 
    AND preference_key = 'default_countries'
    AND preference_value NOT IN (SELECT unnest(p_default_countries));

  DELETE FROM user_preference 
  WHERE user_id = p_user_id 
    AND preference_key = 'default_job_categories'
    AND preference_value NOT IN (SELECT unnest(p_default_job_categories));

  DELETE FROM user_preference 
  WHERE user_id = p_user_id 
    AND preference_key = 'default_experience_levels'
    AND preference_value NOT IN (SELECT unnest(p_default_experience_levels));

  -- Delete insert preferences that are no longer needed
  DELETE FROM user_preference 
  WHERE user_id = p_user_id 
    AND preference_key = 'insert_default_countries'
    AND preference_value NOT IN (SELECT unnest(p_insert_default_countries));

  DELETE FROM user_preference 
  WHERE user_id = p_user_id 
    AND preference_key = 'insert_default_job_categories'
    AND preference_value NOT IN (SELECT unnest(p_insert_default_job_categories));

  DELETE FROM user_preference 
  WHERE user_id = p_user_id 
    AND preference_key = 'insert_default_experience_levels'
    AND preference_value NOT IN (SELECT unnest(p_insert_default_experience_levels));
  
  -- Insert new search preferences
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

  -- Insert new insert preferences
  INSERT INTO user_preference (user_id, preference_key, preference_value)
  SELECT 
    p_user_id,
    'insert_default_countries'::text,
    unnest(p_insert_default_countries)
  ON CONFLICT (user_id, preference_key, preference_value) 
  DO NOTHING;

  INSERT INTO user_preference (user_id, preference_key, preference_value)
  SELECT 
    p_user_id,
    'insert_default_job_categories'::text,
    unnest(p_insert_default_job_categories)
  ON CONFLICT (user_id, preference_key, preference_value) 
  DO NOTHING;

  INSERT INTO user_preference (user_id, preference_key, preference_value)
  SELECT 
    p_user_id,
    'insert_default_experience_levels'::text,
    unnest(p_insert_default_experience_levels)
  ON CONFLICT (user_id, preference_key, preference_value) 
  DO NOTHING;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_available_countries()
 RETURNS TABLE(country_name text)
 LANGUAGE sql
AS $function$
    SELECT DISTINCT c.country_name
    FROM job_posting_country jpc
    INNER JOIN country c ON c.id = jpc.country_id
    ORDER BY c.country_name ASC;
$function$
;


