-- 1) safe_to_date function
CREATE OR REPLACE FUNCTION safe_to_date(p_date TEXT)
RETURNS DATE AS $$
BEGIN
  RETURN p_date::DATE;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;


-- 2) update application_and_interview_rounds function, update application and upsert interview rounds, delete/insert interview_tag_mapping
CREATE OR REPLACE FUNCTION update_application_and_interview_rounds(
  p_user_id TEXT,
  p_application_id UUID,
  p_applied_date DATE,
  p_first_response_date DATE,
  p_status TEXT,
  p_interview_rounds JSONB
) RETURNS VOID AS $$
DECLARE
  v_interview_experience_id UUID;
  v_round JSONB;
  v_round_no INT;
  v_updated_at TIMESTAMPTZ := NOW();
  v_round_nos INT[];
BEGIN
  BEGIN
    -- 1. Update application
    UPDATE application
    SET 
      applied_date = p_applied_date,
      first_response_date = p_first_response_date,
      status = p_status,
      updated_at = v_updated_at
    WHERE id = p_application_id AND user_id = p_user_id;

    -- 2. Get round numbers
    -- COALESCE: Returns first non-null value. Here, returns empty array if array_agg is null
    SELECT COALESCE(array_agg(ordinality), ARRAY[]::int[]) INTO v_round_nos
    FROM jsonb_array_elements(p_interview_rounds) WITH ORDINALITY AS elem(value, ordinality);

    -- 3. Delete removed interview rounds
    -- unnest: Expands array into rows, making it usable in NOT IN clause
    DELETE FROM interview_experience
    WHERE application_id = p_application_id
      AND user_id = p_user_id
      AND round_no NOT IN (SELECT unnest(v_round_nos));

    -- 4. Process each round
    FOR v_round, v_round_no IN 
      SELECT value, ordinality 
      FROM jsonb_array_elements(p_interview_rounds) WITH ORDINALITY
    LOOP
      -- Upsert interview experience
      INSERT INTO interview_experience (
        round_no, -- Using the array index + 1
        description,
        interview_date,
        response_date,
        application_id,
        user_id,
        updated_at
      ) VALUES (
        v_round_no,
        v_round->>'description',
        (v_round->>'interview_date')::DATE,
        (v_round->>'response_date')::DATE,
        p_application_id,
        p_user_id,
        v_updated_at
      )
      ON CONFLICT (application_id, round_no, user_id) DO UPDATE SET
        description = EXCLUDED.description,
        interview_date = EXCLUDED.interview_date,
        response_date = EXCLUDED.response_date,
        updated_at = EXCLUDED.updated_at
      RETURNING id INTO v_interview_experience_id;

      -- Handle tags for this round
      IF v_round ? 'interview_tags' AND (v_round->>'interview_tags') IS NOT NULL THEN
        -- Delete removed tags
        DELETE FROM interview_tag_mapping
        WHERE interview_experience_id = v_interview_experience_id
        AND interview_tag_id NOT IN (
          SELECT it.id
          FROM jsonb_array_elements_text(v_round->'interview_tags') AS selected_tags
          INNER JOIN interview_tag it ON it.tag_name = selected_tags
        );

        -- Insert new tags
        INSERT INTO interview_tag_mapping (
          interview_experience_id,
          interview_tag_id,
          user_id
        )
        SELECT
          v_interview_experience_id,
          it.id,
          p_user_id
        FROM 
          jsonb_array_elements_text(v_round->'interview_tags') AS selected_tags
          INNER JOIN interview_tag it ON it.tag_name = selected_tags
        ON CONFLICT (interview_experience_id, interview_tag_id) DO NOTHING;
      ELSE
        -- If no tags array or null, delete all tags for this round
        DELETE FROM interview_tag_mapping
        WHERE interview_experience_id = v_interview_experience_id;
      END IF;


      -- Handle leetcode questions for this round
      IF v_round ? 'leetcode_questions' AND (v_round->>'leetcode_questions') IS NOT NULL THEN
          -- First delete mappings that are no longer needed
          DELETE FROM interview_experience_leetcode_question
          WHERE interview_experience_id = v_interview_experience_id
          AND interview_experience_round_no = v_round_no
          AND leetcode_question_number NOT IN (
              SELECT (q->>'question_number')::INT
              FROM jsonb_array_elements(v_round->'leetcode_questions') AS q
          );

          -- Insert/Update mappings
          INSERT INTO interview_experience_leetcode_question (
              interview_experience_id,
              interview_experience_round_no,  -- Add round_no
              leetcode_question_number,
              user_id
          )
          SELECT
              v_interview_experience_id,
              v_round_no,                    -- Add round_no
              (q->>'question_number')::INT,
              p_user_id
          FROM jsonb_array_elements(v_round->'leetcode_questions') AS q
          ON CONFLICT (interview_experience_id, interview_experience_round_no, leetcode_question_number)
          DO NOTHING;
      ELSE
          -- If no leetcode questions, delete from the table
          DELETE FROM interview_experience_leetcode_question
          WHERE interview_experience_id = v_interview_experience_id
          AND interview_experience_round_no = v_round_no;
         
      END IF;


    END LOOP;

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error: %', SQLERRM;
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql;




-- 3) function to get questions with reply counts and user_data as an object (fetch)
CREATE OR REPLACE FUNCTION get_questions_with_reply_counts(job_posting_id UUID)
RETURNS TABLE (
  id UUID,
  content TEXT,
  entity_type TEXT,
  entity_id UUID,
  user_id TEXT,
  created_at TIMESTAMPTZ,
  reply_count BIGINT,
  user_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.content,
    q.entity_type,
    q.entity_id,
    q.user_id,
    q.created_at,
    (SELECT COUNT(*) FROM comment r WHERE r.entity_type = 'question' AND r.entity_id = q.id) AS reply_count,
    jsonb_build_object(
      'full_name', ud.full_name,
      'profile_pic_url', ud.profile_pic_url
    ) AS user_data
  FROM comment q
  JOIN user_data ud ON q.user_id = ud.user_id
  WHERE q.entity_type = 'job_posting' AND q.entity_id = job_posting_id
  ORDER BY q.created_at DESC;
END;
$$ LANGUAGE plpgsql;



-- 4) function to get applications with interview stats
create or replace function get_applications_with_interview_stats(job_posting_id_param uuid)
returns table (
  id uuid,
  status text,
  applied_date DATE,
  first_response_date DATE,
  created_at timestamp with time zone,
  full_name text,
  profile_pic_url text,
  number_of_rounds bigint,
  number_of_comments bigint,
  interview_tags text[]
) as $$
begin
  return query
  SELECT 
    a.id,
    a.status,
    a.applied_date,
    a.first_response_date,
    a.created_at,
    u.full_name,
    u.profile_pic_url,
    COUNT(DISTINCT ie.id) as number_of_rounds,
    COUNT(DISTINCT c.id) as number_of_comments,
    array_agg(DISTINCT t.tag) FILTER (WHERE t.tag IS NOT NULL) as interview_tags
  FROM application a
  LEFT JOIN user_data u ON a.user_id = u.user_id
  INNER JOIN interview_experience ie ON a.id = ie.application_id
  LEFT JOIN LATERAL unnest(ie.interview_tags) as t(tag) ON true
  LEFT JOIN comment c ON c.entity_type = 'interview_experience' 
    AND c.entity_id = ie.id
  WHERE a.job_posting_id = job_posting_id_param
  GROUP BY 
    a.id,
    a.status,
    a.applied_date,
    a.first_response_date,
    a.created_at,
    u.full_name,
    u.profile_pic_url;
end;
$$ language plpgsql;




-- 5) function to get interview rounds with tag names
CREATE OR REPLACE FUNCTION get_interview_rounds_with_tag_names(p_application_id UUID)
RETURNS TABLE (
  id UUID,
  round_no INT2,
  description TEXT,
  interview_date DATE,
  response_date DATE,
  created_at TIMESTAMPTZ,
  interview_tags TEXT[],
  leetcode_questions JSONB[],
  user_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ie.id,
    ie.round_no,
    ie.description,
    ie.interview_date,
    ie.response_date,
    ie.created_at,
    ARRAY_AGG(it.tag_name) FILTER (WHERE it.tag_name IS NOT NULL) AS interview_tags,
    (
      SELECT ARRAY_AGG(
        jsonb_build_object(
          'question_number', ielq.leetcode_question_number,
          'difficulty', lq.difficulty
        )
      )
      FROM interview_experience_leetcode_question ielq
      LEFT JOIN leetcode_question lq ON 
        ielq.leetcode_question_number = lq.question_number
      WHERE ielq.interview_experience_id = ie.id
        AND ielq.interview_experience_round_no = ie.round_no
    ) AS leetcode_questions,
    jsonb_build_object(
      'full_name', ud.full_name,
      'profile_pic_url', ud.profile_pic_url
    ) AS user_data
  FROM interview_experience ie
  LEFT JOIN interview_tag_mapping itm ON ie.id = itm.interview_experience_id
  LEFT JOIN interview_tag it ON itm.interview_tag_id = it.id
  JOIN user_data ud ON ie.user_id = ud.user_id
  WHERE ie.application_id = p_application_id
  GROUP BY 
    ie.id,
    ie.round_no,
    ie.description,
    ie.interview_date,
    ie.response_date,
    ie.created_at,
    ud.full_name,
    ud.profile_pic_url
  ORDER BY ie.round_no ASC;
END;
$$ LANGUAGE plpgsql;

-- 6) function to get online assessments by job posting id
CREATE OR REPLACE FUNCTION get_online_assessments_by_job_posting_id(p_job_posting_id UUID)
RETURNS TABLE (
  id UUID,
  round_no INT2,
  description TEXT,
  interview_date DATE,
  response_date DATE,
  created_at TIMESTAMPTZ,
  interview_tags TEXT[],
  leetcode_questions JSONB[],
  user_data JSONB,
  application_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ie.id,
    ie.round_no,
    ie.description,
    ie.interview_date,
    ie.response_date,
    ie.created_at,
    ARRAY_AGG(it.tag_name) FILTER (WHERE it.tag_name IS NOT NULL) AS interview_tags,
    (
      SELECT ARRAY_AGG(
        jsonb_build_object(
          'question_number', ielq.leetcode_question_number,
          'difficulty', lq.difficulty
        )
      )
      FROM interview_experience_leetcode_question ielq
      LEFT JOIN leetcode_question lq ON 
        ielq.leetcode_question_number = lq.question_number
      WHERE ielq.interview_experience_id = ie.id
        AND ielq.interview_experience_round_no = ie.round_no
    ) AS leetcode_questions,
    jsonb_build_object(
      'full_name', ud.full_name,
      'profile_pic_url', ud.profile_pic_url
    ) AS user_data,
    ie.application_id
  FROM interview_experience ie
  JOIN application a ON ie.application_id = a.id
  LEFT JOIN interview_tag_mapping itm ON ie.id = itm.interview_experience_id
  LEFT JOIN interview_tag it ON itm.interview_tag_id = it.id
  JOIN user_data ud ON ie.user_id = ud.user_id
  WHERE 
    a.job_posting_id = p_job_posting_id
    AND EXISTS (
      SELECT 1 
      FROM interview_tag_mapping itm2
      JOIN interview_tag it2 ON itm2.interview_tag_id = it2.id
      WHERE itm2.interview_experience_id = ie.id 
      AND it2.tag_name = 'Online Assessment'
    )
  GROUP BY 
    ie.id,
    ie.round_no,
    ie.description,
    ie.interview_date,
    ie.response_date,
    ie.created_at,
    ud.full_name,
    ud.profile_pic_url,
    ie.application_id
  ORDER BY ie.created_at DESC;
END;
$$ LANGUAGE plpgsql;


-- 7) function to insert job with countries
create or replace function insert_job_with_countries(
  p_title text,
  p_url text,
  p_company_id uuid,
  p_user_id text,
  p_country_names text[],
  p_experience_level_names text[],
  p_job_category_names text[],
  p_job_url_linkedin text
) returns void as $$
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
$$ language plpgsql;



-- 8) function to update job with countries for ADMIN
CREATE OR REPLACE FUNCTION update_job_with_countries(
  p_job_posting_id uuid,
  p_title text,
  p_url text,
  p_job_url_linkedin text,
  p_country_ids uuid[],
  p_closed_date DATE,
  p_job_status text,
  p_job_posted_date DATE,
  p_experience_level_ids uuid[],
  p_job_category_ids uuid[]
) returns void as $$
DECLARE
  v_old_job_posting job_posting%ROWTYPE;
  v_new_job_posting job_posting%ROWTYPE;
  v_old_country_ids uuid[];
  v_old_experience_level_ids uuid[];
  v_old_job_category_ids uuid[];
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

  -- Get old job category IDs before any changes
  v_old_job_category_ids := ARRAY(
    SELECT job_category_id 
    FROM job_posting_job_category 
    WHERE job_posting_id = p_job_posting_id
    ORDER BY job_category_id
  );

  -- Update job_posting and get new data
  UPDATE job_posting SET
    title = p_title,
    url = p_url,
    job_url_linkedin = p_job_url_linkedin,
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

  -- Delete job category relationships that are no longer needed
  DELETE FROM job_posting_job_category
  WHERE job_posting_id = p_job_posting_id
  AND job_category_id NOT IN (SELECT unnest(p_job_category_ids));

  -- Insert/Update job category relationships
  INSERT INTO job_posting_job_category (job_posting_id, job_category_id)
  SELECT p_job_posting_id, unnest(p_job_category_ids)
  WHERE array_length(p_job_category_ids, 1) > 0
  ON CONFLICT (job_posting_id, job_category_id) DO NOTHING;

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

  -- Add job category changes if any exist
  IF v_old_job_category_ids IS DISTINCT FROM (SELECT ARRAY(SELECT unnest(p_job_category_ids) ORDER BY 1)) THEN
    v_history := v_history || jsonb_build_object(
      'job_categories', jsonb_build_object(
        'old', (
          SELECT jsonb_agg(job_category_name ORDER BY job_category_name)
          FROM job_category
          WHERE id IN (SELECT UNNEST(v_old_job_category_ids))
        ),
        'new', (
          SELECT jsonb_agg(job_category_name ORDER BY job_category_name)
          FROM job_category
          WHERE id IN (SELECT UNNEST(p_job_category_ids))
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
$$ LANGUAGE plpgsql;



-- 9) function to get all searched jobs
CREATE OR REPLACE FUNCTION get_all_search_jobs(
  p_page int,
  p_search text,
  p_is_verified boolean,
  p_country_names text[],
  p_experience_level_names text[],
  p_job_category_names text[],
  p_sort_order text DEFAULT 'DESC',
  p_user_id text DEFAULT NULL
)
RETURNS json AS $$
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
$$ LANGUAGE plpgsql;



-- 10) function to get all available countries
CREATE OR REPLACE FUNCTION get_available_countries()
RETURNS TABLE (country_name text) 
LANGUAGE sql AS $$
    SELECT DISTINCT c.country_name
    FROM job_posting_country jpc
    INNER JOIN country c ON c.id = jpc.country_id
    ORDER BY c.country_name ASC;
$$;


-- 11) function to update user preferences
CREATE OR REPLACE FUNCTION update_user_preferences(
  p_user_id text,
  -- Search preferences
  p_default_countries text[],
  p_default_job_categories text[],
  p_default_experience_levels text[],
  -- Insert preferences
  p_insert_default_countries text[],
  p_insert_default_job_categories text[],
  p_insert_default_experience_levels text[]
) RETURNS void AS $$
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
$$ LANGUAGE plpgsql;


-- 12) Helper function to get all options for user preferences
CREATE OR REPLACE FUNCTION helper_user_preferences_get_all_options(
    p_include_available_countries boolean DEFAULT false,
    p_include_all_countries boolean DEFAULT true
) RETURNS json AS $$
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
$$ LANGUAGE plpgsql;


-- 13) function to get user preferences for job search
CREATE OR REPLACE FUNCTION get_user_preferences_job_search(p_user_id text DEFAULT NULL)
RETURNS json AS $$
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
$$ LANGUAGE plpgsql;



-- 14) function to get user preferences for insert job
CREATE OR REPLACE FUNCTION get_user_preferences_insert_job(p_user_id text DEFAULT NULL)
RETURNS json AS $$
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
$$ LANGUAGE plpgsql;



-- 15) function to get user preferences for settings
CREATE OR REPLACE FUNCTION get_user_preferences_settings(p_user_id text DEFAULT NULL)
RETURNS json AS $$
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
$$ LANGUAGE plpgsql;