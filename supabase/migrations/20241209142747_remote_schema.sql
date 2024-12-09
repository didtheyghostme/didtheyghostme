drop function if exists "public"."get_all_search_jobs"(p_page integer, p_search text, p_is_verified boolean, p_country_names text[], p_experience_level_names text[], p_job_category_names text[], p_sort_order text);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_all_search_jobs(p_page integer, p_search text, p_is_verified boolean, p_country_names text[], p_experience_level_names text[], p_job_category_names text[], p_sort_order text DEFAULT 'DESC'::text, p_user_id text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_limit int := 10;
  v_offset int;
  v_total_count int;
  v_country_ids uuid[];
  v_experience_level_ids uuid[];
  v_job_category_ids uuid[];
  v_user_country_names text[];
  v_user_experience_level_names text[];
  v_user_job_category_names text[];
BEGIN
  v_offset := (p_page - 1) * v_limit;

  -- Convert names to IDs only if names are provided
  IF p_country_names IS NOT NULL AND array_length(p_country_names, 1) > 0 THEN
    SELECT ARRAY_AGG(id) INTO v_country_ids
    FROM country
    WHERE country_name = ANY(p_country_names);
  ELSE
    -- Try to get user preferences first
    IF p_user_id IS NOT NULL THEN
      SELECT ARRAY_AGG(preference_value) INTO v_user_country_names
      FROM user_preference
      WHERE user_id = p_user_id AND preference_key = 'default_countries';
    END IF;

    -- If user preferences exist, use them, otherwise fall back to default
    IF v_user_country_names IS NOT NULL AND array_length(v_user_country_names, 1) > 0 THEN
      SELECT ARRAY_AGG(id) INTO v_country_ids
      FROM country
      WHERE country_name = ANY(v_user_country_names);
    ELSE
      SELECT ARRAY_AGG(id) INTO v_country_ids
      FROM country
      WHERE country_name IN ('Singapore');
    END IF;
  END IF;

  -- Similar pattern for experience levels
  IF p_experience_level_names IS NOT NULL AND array_length(p_experience_level_names, 1) > 0 THEN
    SELECT ARRAY_AGG(id) INTO v_experience_level_ids
    FROM experience_level
    WHERE experience_level = ANY(p_experience_level_names);
  ELSE
    IF p_user_id IS NOT NULL THEN
      SELECT ARRAY_AGG(preference_value) INTO v_user_experience_level_names
      FROM user_preference
      WHERE user_id = p_user_id AND preference_key = 'default_experience_levels';
    END IF;

    IF v_user_experience_level_names IS NOT NULL AND array_length(v_user_experience_level_names, 1) > 0 THEN
      SELECT ARRAY_AGG(id) INTO v_experience_level_ids
      FROM experience_level
      WHERE experience_level = ANY(v_user_experience_level_names);
    ELSE
      SELECT ARRAY_AGG(id) INTO v_experience_level_ids
      FROM experience_level
      WHERE experience_level IN ('Internship');
    END IF;
  END IF;

  -- And for job categories
  IF p_job_category_names IS NOT NULL AND array_length(p_job_category_names, 1) > 0 THEN
    SELECT ARRAY_AGG(id) INTO v_job_category_ids
    FROM job_category
    WHERE job_category_name = ANY(p_job_category_names);
  ELSE
    IF p_user_id IS NOT NULL THEN
      SELECT ARRAY_AGG(preference_value) INTO v_user_job_category_names
      FROM user_preference
      WHERE user_id = p_user_id AND preference_key = 'default_job_categories';
    END IF;

    IF v_user_job_category_names IS NOT NULL AND array_length(v_user_job_category_names, 1) > 0 THEN
      SELECT ARRAY_AGG(id) INTO v_job_category_ids
      FROM job_category
      WHERE job_category_name = ANY(v_user_job_category_names);
    ELSE
      SELECT ARRAY_AGG(id) INTO v_job_category_ids
      FROM job_category
      WHERE job_category_name IN ('Tech');
    END IF;
  END IF;

  -- Count query
  SELECT COUNT(DISTINCT jp.id) INTO v_total_count
  FROM job_posting jp
  INNER JOIN company c ON jp.company_id = c.id
  INNER JOIN job_posting_country jpc ON jp.id = jpc.job_posting_id
  INNER JOIN job_posting_experience_level jpel ON jp.id = jpel.job_posting_id
  INNER JOIN job_posting_job_category jpjc ON jp.id = jpjc.job_posting_id
  WHERE
    -- Filter by job status (Verified only or both Pending and Verified)
    CASE
      WHEN p_is_verified THEN jp.job_status = 'Verified'
      ELSE jp.job_status IN ('Pending', 'Verified')
    END
    -- Search in job title or company name (if search text provided)
    AND (
      p_search = '' 
      OR jp.title ILIKE '%' || p_search || '%'
      OR c.company_name ILIKE '%' || p_search || '%'
    )
    -- Filter by country
    AND jpc.country_id = ANY(v_country_ids)
    -- Filter by experience level
    AND jpel.experience_level_id = ANY(v_experience_level_ids)
    -- Filter by job category
    AND jpjc.job_category_id = ANY(v_job_category_ids);

  -- Return JSON object containing data and pagination info
  RETURN json_build_object(
    'data', COALESCE(
      (
        SELECT json_agg(row_to_json(t))
        FROM (
          SELECT
            jp.id,
            jp.title,
            jp.updated_at,
            jp.job_posted_date,
            jp.closed_date,
            json_build_object(
              'company_name', c.company_name,
              'logo_url', c.logo_url
            ) as company,
            -- Subquery to get all countries for each job
            (
              SELECT json_agg(
                json_build_object(
                  'country', json_build_object(
                    'country_name', co2.country_name
                  )
                )
              )
              FROM job_posting_country jpc2
              INNER JOIN country co2 ON jpc2.country_id = co2.id
              WHERE jpc2.job_posting_id = jp.id
            ) as job_posting_country,
            -- Subquery to get all experience levels for each job
            (
              SELECT json_agg(
                json_build_object(
                  'experience_level', json_build_object(
                    'experience_level', el2.experience_level
                  )
                )
              )
              FROM job_posting_experience_level jpel2
              INNER JOIN experience_level el2 ON jpel2.experience_level_id = el2.id
              WHERE jpel2.job_posting_id = jp.id
            ) as job_posting_experience_level,
            -- Subquery to get all job categories for each job
            (
              SELECT json_agg(
                json_build_object(
                  'job_category', json_build_object(
                    'job_category_name', jc2.job_category_name
                  )
                )
              )
              FROM job_posting_job_category jpjc2
              INNER JOIN job_category jc2 ON jpjc2.job_category_id = jc2.id
              WHERE jpjc2.job_posting_id = jp.id
            ) as job_posting_job_category
          FROM job_posting jp
          INNER JOIN company c ON jp.company_id = c.id
          INNER JOIN job_posting_country jpc ON jp.id = jpc.job_posting_id
          INNER JOIN country co ON jpc.country_id = co.id
          INNER JOIN job_posting_experience_level jpel ON jp.id = jpel.job_posting_id
          INNER JOIN experience_level el ON jpel.experience_level_id = el.id
          INNER JOIN job_posting_job_category jpjc ON jp.id = jpjc.job_posting_id
          INNER JOIN job_category jc ON jpjc.job_category_id = jc.id
          WHERE 
            CASE
              WHEN p_is_verified THEN jp.job_status = 'Verified'
              ELSE jp.job_status IN ('Pending', 'Verified')
            END
            AND (
              p_search = '' 
              OR jp.title ILIKE '%' || p_search || '%'
              OR c.company_name ILIKE '%' || p_search || '%'
            )
            AND jpc.country_id = ANY(v_country_ids)
            AND jpel.experience_level_id = ANY(v_experience_level_ids)
            AND jpjc.job_category_id = ANY(v_job_category_ids)
          GROUP BY 
            jp.id, 
            jp.title, 
            jp.updated_at, 
            jp.job_posted_date, 
            jp.closed_date,
            c.company_name, 
            c.logo_url
          ORDER BY 
            CASE WHEN p_sort_order = 'ASC' THEN jp.updated_at END ASC,
            CASE WHEN p_sort_order = 'DESC' THEN jp.updated_at END DESC
          LIMIT v_limit
          OFFSET v_offset
        ) t
      ),
      '[]'::json -- Return empty array if no data found
    ),
    -- Calculate total pages (minimum 1 page)
    'totalPages', GREATEST(1, CEIL(v_total_count::float / v_limit))
  );
END;
$function$
;


