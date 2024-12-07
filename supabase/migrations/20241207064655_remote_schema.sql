set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_user_preferences_and_options(p_user_id text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_default_countries text[];
    v_default_job_categories text[];
    v_default_experience_levels text[];
BEGIN
    -- Get user preferences as arrays
    SELECT ARRAY_AGG(preference_value) INTO v_default_countries
    FROM user_preference
    WHERE user_id = p_user_id AND preference_key = 'default_country';

    SELECT ARRAY_AGG(preference_value) INTO v_default_job_categories
    FROM user_preference
    WHERE user_id = p_user_id AND preference_key = 'default_job_category';

    SELECT ARRAY_AGG(preference_value) INTO v_default_experience_levels
    FROM user_preference
    WHERE user_id = p_user_id AND preference_key = 'default_experience_level';

    -- Return flattened results
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


