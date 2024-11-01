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
BEGIN
  BEGIN
    -- Update application
    UPDATE application
    SET 
      applied_date = p_applied_date,
      first_response_date = p_first_response_date,
      status = p_status
    WHERE id = p_application_id AND user_id = p_user_id;

    -- Delete related tag mappings
    DELETE FROM interview_tag_mapping
    WHERE interview_experience_id IN (
      SELECT id FROM interview_experience
      WHERE application_id = p_application_id AND user_id = p_user_id
    );

    -- Delete existing interview rounds
    DELETE FROM interview_experience
    WHERE application_id = p_application_id AND user_id = p_user_id;
    
    -- Loop through each interview round with its index
    FOR v_round, v_round_no IN 
      SELECT value, ordinality 
      FROM jsonb_array_elements(p_interview_rounds) WITH ORDINALITY
    LOOP
      -- Insert interview experience and get its ID
      INSERT INTO interview_experience (
        round_no,
        description,
        interview_date,
        response_date,
        application_id,
        user_id
      ) VALUES (
        v_round_no, -- Using the array index + 1
        v_round->>'description',
        (v_round->>'interview_date')::DATE,
        (v_round->>'response_date')::DATE,
        p_application_id,
        p_user_id
      ) RETURNING id INTO v_interview_experience_id;

      -- Insert tag mappings for this interview experience, use SELECT DISTINCT if there could be duplicate
      IF v_round ? 'interview_tags' AND (v_round->>'interview_tags') IS NOT NULL THEN
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
          jsonb_array_elements_text(v_round->'interview_tags') as selected_tags
          INNER JOIN interview_tag it ON it.tag_name = selected_tags;
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
  difficulty TEXT,
  description TEXT,
  interview_date DATE,
  response_date DATE,
  created_at TIMESTAMPTZ,
  interview_tags TEXT[],
  user_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ie.id,
    ie.round_no,
    ie.difficulty,
    ie.description,
    ie.interview_date,
    ie.response_date,
    ie.created_at,
    ARRAY_AGG(it.tag_name) FILTER (WHERE it.tag_name IS NOT NULL) AS interview_tags,
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
    ie.difficulty,
    ie.description,
    ie.interview_date,
    ie.response_date,
    ie.created_at,
    ud.full_name,
    ud.profile_pic_url
  ORDER BY ie.round_no ASC;
END;
$$ LANGUAGE plpgsql;