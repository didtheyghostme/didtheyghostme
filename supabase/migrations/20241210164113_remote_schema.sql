drop policy "Enable delete for users based on user_id" on "public"."leetcode_question";

drop policy "Enable insert for authenticated users only" on "public"."leetcode_question";

drop policy "Enable update for users based on email" on "public"."leetcode_question";

alter table "public"."leetcode_question" drop constraint "LeetcodeQuestion_interview_experience_id_fkey";

alter table "public"."leetcode_question" drop constraint "leetcode_question_user_id_fkey";

alter table "public"."leetcode_question" drop constraint "unique_leetcode_question";

drop index if exists "public"."unique_leetcode_question";

alter table "public"."leetcode_question" drop column "interview_experience_id";

alter table "public"."leetcode_question" drop column "interview_experience_round_no";

alter table "public"."leetcode_question" drop column "user_id";

alter table "public"."leetcode_question" add column "leetcode_title" text not null;

alter table "public"."leetcode_question" add column "leetcode_url" text not null;

CREATE UNIQUE INDEX leetcode_question_question_number_key ON public.leetcode_question USING btree (question_number);

alter table "public"."interview_experience_leetcode_question" add constraint "interview_experience_leetcode_que_leetcode_question_number_fkey" FOREIGN KEY (leetcode_question_number) REFERENCES leetcode_question(question_number) not valid;

alter table "public"."interview_experience_leetcode_question" validate constraint "interview_experience_leetcode_que_leetcode_question_number_fkey";

alter table "public"."interview_experience_leetcode_question" add constraint "interview_experience_leetcode_ques_interview_experience_id_fkey" FOREIGN KEY (interview_experience_id) REFERENCES interview_experience(id) not valid;

alter table "public"."interview_experience_leetcode_question" validate constraint "interview_experience_leetcode_ques_interview_experience_id_fkey";

alter table "public"."leetcode_question" add constraint "leetcode_question_question_number_key" UNIQUE using index "leetcode_question_question_number_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_interview_rounds_with_tag_names(p_application_id uuid)
 RETURNS TABLE(id uuid, round_no smallint, description text, interview_date date, response_date date, created_at timestamp with time zone, interview_tags text[], leetcode_questions jsonb[], user_data jsonb)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_online_assessments_by_job_posting_id(p_job_posting_id uuid)
 RETURNS TABLE(id uuid, round_no smallint, description text, interview_date date, response_date date, created_at timestamp with time zone, interview_tags text[], leetcode_questions jsonb[], user_data jsonb, application_id uuid)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_application_and_interview_rounds(p_user_id text, p_application_id uuid, p_applied_date date, p_first_response_date date, p_status text, p_interview_rounds jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;


