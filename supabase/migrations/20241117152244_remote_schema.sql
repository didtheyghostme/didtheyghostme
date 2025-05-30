set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_all_search_jobs(p_page integer, p_search text, p_is_verified boolean, p_country_ids uuid[], p_experience_level_id uuid, p_sort_order text DEFAULT 'DESC'::text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_limit int := 10;
  v_offset int;
  v_total_count int;
  v_default_experience_level_id uuid;
  v_default_country_id uuid;
BEGIN
  v_offset := (p_page - 1) * v_limit;

  -- Get default IDs once at the start
  SELECT id INTO v_default_experience_level_id
  FROM experience_level
  WHERE experience_level = 'Internship';

  SELECT id INTO v_default_country_id
  FROM country
  WHERE country_name = 'Singapore';

  -- Count query
  SELECT COUNT(DISTINCT jp.id) INTO v_total_count
  FROM job_posting jp
  INNER JOIN company c ON jp.company_id = c.id
  INNER JOIN job_posting_country jpc ON jp.id = jpc.job_posting_id
  INNER JOIN job_posting_experience_level jpel ON jp.id = jpel.job_posting_id
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
    AND (
      CASE 
        WHEN p_country_ids IS NOT NULL THEN jpc.country_id = ANY(p_country_ids)
        ELSE jpc.country_id = v_default_country_id
      END
    )
    AND (
      CASE 
        WHEN p_experience_level_id IS NOT NULL THEN jpel.experience_level_id = p_experience_level_id
        ELSE jpel.experience_level_id = v_default_experience_level_id
      END
    );

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
                    'country_name', co.country_name
                  )
                )
              )
              FROM job_posting_country jpc2
              INNER JOIN country co ON jpc2.country_id = co.id
              WHERE jpc2.job_posting_id = jp.id
            ) as job_posting_country,
            json_build_object(
              'experience_level', el.experience_level
            ) as experience_level
          FROM job_posting jp
          INNER JOIN company c ON jp.company_id = c.id
          INNER JOIN job_posting_country jpc ON jp.id = jpc.job_posting_id
          INNER JOIN country co ON jpc.country_id = co.id
          INNER JOIN job_posting_experience_level jpel ON jp.id = jpel.job_posting_id
          INNER JOIN experience_level el ON jpel.experience_level_id = el.id
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
            AND (
              CASE 
                WHEN p_country_ids IS NOT NULL THEN jpc.country_id = ANY(p_country_ids)
                ELSE jpc.country_id = v_default_country_id
              END
            )
            AND (
              CASE 
                WHEN p_experience_level_id IS NOT NULL THEN jpel.experience_level_id = p_experience_level_id
                ELSE jpel.experience_level_id = v_default_experience_level_id
              END
            )
          GROUP BY 
            jp.id, 
            jp.title, 
            jp.updated_at, 
            jp.job_posted_date, 
            jp.closed_date,
            c.company_name, 
            c.logo_url,
            el.experience_level
          ORDER BY 
            CASE WHEN p_sort_order = 'ASC' THEN jp.updated_at END ASC,
            CASE WHEN p_sort_order = 'DESC' THEN jp.updated_at END DESC
          LIMIT v_limit
          OFFSET v_offset
        ) t
      ),
      '[]'::json -- Return empty array if no data found
    ),
    'totalPages', GREATEST(1, CEIL(v_total_count::float / v_limit))
  );
END;
$function$
;


