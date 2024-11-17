set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_all_search_jobs(p_page integer, p_search text, p_is_verified boolean, p_country_ids uuid[])
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_limit int := 10;
  v_offset int;
  v_total_count int;
BEGIN
  v_offset := (p_page - 1) * v_limit;

  SELECT COUNT(DISTINCT jp.id) INTO v_total_count
  FROM job_posting jp
  INNER JOIN company c ON jp.company_id = c.id  -- Add company join
  LEFT JOIN job_posting_country jpc ON jp.id = jpc.job_posting_id
  WHERE 
    CASE 
      WHEN p_is_verified THEN jp.job_status = 'Verified'
      ELSE jp.job_status IN ('Pending', 'Verified')
    END
    AND (
      p_search = '' 
      OR jp.title ILIKE '%' || p_search || '%'
      OR c.company_name ILIKE '%' || p_search || '%'  -- Add company name search
    )
    AND (
      p_country_ids IS NULL 
      OR jpc.country_id = ANY(p_country_ids)
    );

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
            COALESCE(
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
              ),
              '[]'::json
            ) as job_posting_country
          FROM job_posting jp
          INNER JOIN company c ON jp.company_id = c.id
          LEFT JOIN job_posting_country jpc ON jp.id = jpc.job_posting_id
          INNER JOIN country co ON jpc.country_id = co.id
          WHERE 
            CASE 
              WHEN p_is_verified THEN jp.job_status = 'Verified'
              ELSE jp.job_status IN ('Pending', 'Verified')
            END
            AND (
              p_search = '' 
              OR jp.title ILIKE '%' || p_search || '%'
              OR c.company_name ILIKE '%' || p_search || '%'  -- Add company name search
            )
            AND (
              p_country_ids IS NULL 
              OR jpc.country_id = ANY(p_country_ids)
            )
          GROUP BY 
            jp.id, 
            jp.title, 
            jp.updated_at, 
            jp.job_posted_date, 
            jp.closed_date,
            c.company_name, 
            c.logo_url
          ORDER BY jp.updated_at DESC
          LIMIT v_limit
          OFFSET v_offset
        ) t
      ),
      '[]'::json
    ),
    'totalPages', GREATEST(1, CEIL(v_total_count::float / v_limit))
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_available_countries()
 RETURNS TABLE(id uuid, country_name text)
 LANGUAGE sql
AS $function$
  SELECT DISTINCT c.id, c.country_name
  FROM job_posting_country jpc
  JOIN country c ON c.id = jpc.country_id
  ORDER BY c.country_name;
$function$
;


