-- safe_to_date function
CREATE OR REPLACE FUNCTION safe_to_date(p_date TEXT)
RETURNS DATE AS $$
BEGIN
  RETURN p_date::DATE;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- update_interview_rounds function, delete all interview rounds for an application and insert new ones
CREATE OR REPLACE FUNCTION update_interview_rounds(
  p_user_id TEXT,
  p_application_id UUID,
  p_interview_rounds JSONB
)
RETURNS SETOF interview_experience AS $$
BEGIN
  -- Delete existing rounds
  DELETE FROM interview_experience
  WHERE application_id = p_application_id AND user_id = p_user_id;

  -- Insert new rounds
  WITH new_rounds AS (
    SELECT
      (ROW_NUMBER() OVER ())::INTEGER AS round_no,
      x.description,
      safe_to_date(x.interview_date) AS interview_date,
      safe_to_date(x.response_date) AS response_date,
      p_application_id AS application_id,
      p_user_id AS user_id
    FROM jsonb_to_recordset(p_interview_rounds) AS x(
      description TEXT,
      interview_date TEXT,
      response_date TEXT
    )
  )
  INSERT INTO interview_experience (round_no, description, interview_date, response_date, application_id, user_id)
  SELECT round_no, description, interview_date, response_date, application_id, user_id FROM new_rounds;

  -- Return the new data
  RETURN QUERY
  SELECT * FROM interview_experience
  WHERE application_id = p_application_id AND user_id = p_user_id
  ORDER BY round_no;
END;
$$ LANGUAGE plpgsql;

-- update_interview_rounds function with upserting (current version)
CREATE OR REPLACE FUNCTION update_interview_rounds(
  p_user_id TEXT,
  p_application_id UUID,
  p_interview_rounds JSONB
)
RETURNS VOID AS $$
BEGIN
  -- Upsert new or updated rounds directly from JSONB with ordinality to preserve order
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
