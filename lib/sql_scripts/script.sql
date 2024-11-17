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

          -- Then delete questions that are no longer needed
          DELETE FROM leetcode_question
          WHERE interview_experience_id = v_interview_experience_id
          AND interview_experience_round_no = v_round_no
          AND question_number NOT IN (
              SELECT (q->>'question_number')::INT
              FROM jsonb_array_elements(v_round->'leetcode_questions') AS q
          );

          -- Insert/Update leetcode questions
          INSERT INTO leetcode_question (
              interview_experience_id,
              interview_experience_round_no,  -- Add round_no
              question_number,
              difficulty,
              user_id
          )
          SELECT 
              v_interview_experience_id,
              v_round_no,                    -- Add round_no
              (q->>'question_number')::INT,
              q->>'difficulty',
              p_user_id
          FROM jsonb_array_elements(v_round->'leetcode_questions') AS q
          ON CONFLICT (interview_experience_id, interview_experience_round_no, question_number) 
          DO UPDATE SET
              difficulty = EXCLUDED.difficulty;

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
          -- If no leetcode questions, delete from both tables
          DELETE FROM interview_experience_leetcode_question
          WHERE interview_experience_id = v_interview_experience_id
          AND interview_experience_round_no = v_round_no;
          
          DELETE FROM leetcode_question
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
        ielq.interview_experience_id = lq.interview_experience_id AND
        ielq.interview_experience_round_no = lq.interview_experience_round_no AND
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
        ielq.interview_experience_id = lq.interview_experience_id AND
        ielq.interview_experience_round_no = lq.interview_experience_round_no AND
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
  p_country_ids uuid[],
  p_experience_level_id uuid
) returns void as $$
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

  -- Insert the experience level relationship
  insert into job_posting_experience_level (
    job_posting_id,
    experience_level_id
  ) values (
    v_job_id,
    p_experience_level_id
  );
end;
$$ language plpgsql;


-- 8) function to update job with countries for ADMIN
create or replace function update_job_with_countries(
  p_job_posting_id uuid,
  p_title text,
  p_url text,
  p_country_ids uuid[],
  p_closed_date DATE,
  p_job_status text,
  p_job_posted_date DATE
) returns void as $$
begin
  -- Update job_posting
  update job_posting set
    title = p_title,
    url = p_url,
    closed_date = p_closed_date,
    job_status = p_job_status,
    job_posted_date = p_job_posted_date,
    updated_at = case 
      when job_status = 'No URL' and p_job_status = 'Verified' 
      then now() 
      else updated_at 
    end
  where id = p_job_posting_id;

  -- Delete country relationships that are no longer needed
  delete from job_posting_country
  where job_posting_id = p_job_posting_id
  and country_id NOT IN (
    select unnest(p_country_ids)
  );

  -- Insert/Update country relationships
  insert into job_posting_country (
    job_posting_id,
    country_id
  )
  select 
    p_job_posting_id,
    unnest(p_country_ids)
  where array_length(p_country_ids, 1) > 0
  on conflict (job_posting_id, country_id) do nothing;

end;
$$ language plpgsql;



-- 9) function to get all searched jobs
CREATE OR REPLACE FUNCTION get_all_search_jobs(
  p_page int,
  p_search text,
  p_is_verified boolean,
  p_country_ids uuid[],
  p_experience_level_id uuid,
  p_sort_order text DEFAULT 'DESC'
)
RETURNS json AS $$
DECLARE
  v_limit int := 10;
  v_offset int;
  v_total_count int;
BEGIN
  v_offset := (p_page - 1) * v_limit;

  -- Uses INNER JOINs because every job must have a company, country, and experience level
  -- Count query
  SELECT COUNT(DISTINCT jp.id) INTO v_total_count
  FROM job_posting jp
  INNER JOIN company c ON jp.company_id = c.id
  INNER JOIN job_posting_country jpc ON jp.id = jpc.job_posting_id
  INNER JOIN job_posting_experience_level jpel ON jp.id = jpel.job_posting_id
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
    -- Filter by selected countries (if any)
    AND (
      p_country_ids IS NULL 
      OR jpc.country_id = ANY(p_country_ids)
    )
    -- Filter by experience level (if selected)
    AND (
      p_experience_level_id IS NULL 
      OR jpel.experience_level_id = p_experience_level_id
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
              p_country_ids IS NULL 
              OR jpc.country_id = ANY(p_country_ids)
            )
            AND (
              p_experience_level_id IS NULL 
              OR jpel.experience_level_id = p_experience_level_id
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
      '[]'::json -- Return an empty array if no data is found
    ),
    -- Calculate total pages (minimum 1 page)
    'totalPages', GREATEST(1, CEIL(v_total_count::float / v_limit))
  );
END;
$$ LANGUAGE plpgsql;



-- 10) function to get all available countries
create or replace function get_available_countries()
returns table (
  id uuid,
  country_name text
) language sql as $$
  SELECT DISTINCT c.id, c.country_name
  FROM job_posting_country jpc
  JOIN country c ON c.id = jpc.country_id
  ORDER BY c.country_name;
$$;


-- TRIGGERS

DROP TRIGGER IF EXISTS after_trigger_job_posting_changelog ON job_posting;
DROP FUNCTION IF EXISTS trigger_job_posting_changelog();

CREATE OR REPLACE FUNCTION trigger_job_posting_changelog()
RETURNS TRIGGER AS $$
DECLARE
  history JSONB := '{}'::JSONB;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Get only the changed fields with their old and new values
    SELECT jsonb_object_agg(
      NEW_data.key,
      jsonb_build_object(
        'old', OLD_data.value,
        'new', NEW_data.value
      )
    )
    INTO history
    FROM jsonb_each(to_jsonb(NEW)) AS NEW_data(key, value)
    JOIN jsonb_each(to_jsonb(OLD)) AS OLD_data(key, value)
      ON NEW_data.key = OLD_data.key
    WHERE NEW_data.key NOT IN ('id', 'created_at', 'updated_at', 'user_id')
      AND OLD_data.value IS DISTINCT FROM NEW_data.value;

    -- Only insert if there are actual changes
    IF history IS NOT NULL AND history <> '{}'::JSONB THEN
      INSERT INTO job_posting_changelog (
        job_posting_id,
        history,  -- This will store only changed fields with old/new values
        handled_by
      ) VALUES (
        NEW.id,
        history,
        requesting_user_id()
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Then create the trigger
CREATE TRIGGER after_trigger_job_posting_changelog
AFTER UPDATE ON job_posting
FOR EACH ROW
EXECUTE FUNCTION trigger_job_posting_changelog();


-- SELECT * FROM information_schema.triggers 
-- WHERE trigger_name = 'after_trigger_job_posting_changelog';