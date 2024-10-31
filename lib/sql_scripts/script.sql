-- safe_to_date function
CREATE OR REPLACE FUNCTION safe_to_date(p_date TEXT)
RETURNS DATE AS $$
BEGIN
  RETURN p_date::DATE;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- update application_and_interview_rounds function, update application and upsert interview rounds
CREATE OR REPLACE FUNCTION update_application_and_interview_rounds(
  p_user_id TEXT,
  p_application_id UUID,
  p_applied_date DATE,
  p_first_response_date DATE,
  p_status TEXT,
  p_interview_rounds JSONB
)
RETURNS VOID AS $$
BEGIN
  -- Update application details
  UPDATE application
  SET applied_date = p_applied_date,
      first_response_date = p_first_response_date,
      status = p_status
  WHERE id = p_application_id AND user_id = p_user_id;

  -- Upsert new or updated interview rounds directly from JSONB with ordinality to preserve order
  WITH input_rounds AS (
    SELECT 
      ord AS round_no,
      x->>'description' AS description,
      safe_to_date(x->>'interview_date') AS interview_date,
      safe_to_date(x->>'response_date') AS response_date,
      -- Extract interview_tags as text array, handling arrays and ensuring it's not a scalar
      CASE 
        WHEN jsonb_typeof(x->'interview_tags') = 'array' THEN 
          ARRAY(
            SELECT jsonb_array_elements_text(x->'interview_tags')
          )
        ELSE
          NULL
      END AS interview_tags
    FROM jsonb_array_elements(p_interview_rounds) WITH ORDINALITY AS arr(x, ord)
  )
  INSERT INTO interview_experience (
    round_no, 
    description, 
    interview_date, 
    response_date, 
    interview_tags,
    application_id, 
    user_id
  )
  SELECT 
    round_no,
    description,
    interview_date,
    response_date,
    interview_tags,
    p_application_id,
    p_user_id
  FROM input_rounds
  ON CONFLICT (application_id, user_id, round_no)
  DO UPDATE SET
    description = EXCLUDED.description,
    interview_date = EXCLUDED.interview_date,
    response_date = EXCLUDED.response_date,
    interview_tags = EXCLUDED.interview_tags;

  -- Delete any rounds that are no longer present in the input
  DELETE FROM interview_experience
  WHERE application_id = p_application_id 
    AND user_id = p_user_id
    AND round_no > (
      SELECT COUNT(*) 
      FROM jsonb_array_elements(p_interview_rounds)
    );

  -- No return statement needed
END;
$$ LANGUAGE plpgsql;


-- function to get questions with reply counts and user_data as an object (fetch)
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