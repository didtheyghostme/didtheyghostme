

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."App status enum" AS ENUM (
    'Applied',
    'Interviewing',
    'Rejected',
    'Ghosted',
    'Offered'
);


ALTER TYPE "public"."App status enum" OWNER TO "postgres";


COMMENT ON TYPE "public"."App status enum" IS 'follow typings';



CREATE TYPE "public"."Job Posting ENUM" AS ENUM (
    'Pending',
    'Verified',
    'Closed',
    'Rejected',
    'No URL'
);


ALTER TYPE "public"."Job Posting ENUM" OWNER TO "postgres";


COMMENT ON TYPE "public"."Job Posting ENUM" IS 'the statuses in supabase';



CREATE TYPE "public"."entity type" AS ENUM (
    'job_posting',
    'question',
    'interview_experience'
);


ALTER TYPE "public"."entity type" OWNER TO "postgres";


CREATE TYPE "public"."report admin report type" AS ENUM (
    'Link Expired',
    'Other'
);


ALTER TYPE "public"."report admin report type" OWNER TO "postgres";


CREATE TYPE "public"."report admin status" AS ENUM (
    'Pending',
    'Rejected',
    'Resolved'
);


ALTER TYPE "public"."report admin status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_applications_with_interview_stats"("job_posting_id_param" "uuid") RETURNS TABLE("id" "uuid", "status" "text", "applied_date" "date", "first_response_date" "date", "created_at" timestamp with time zone, "full_name" "text", "profile_pic_url" "text", "number_of_rounds" bigint, "number_of_comments" bigint, "interview_tags" "text"[])
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
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
    array_agg(DISTINCT it.tag_name) FILTER (WHERE it.tag_name IS NOT NULL) as interview_tags
  FROM application a
  LEFT JOIN user_data u ON a.user_id = u.user_id
  INNER JOIN interview_experience ie ON a.id = ie.application_id
  LEFT JOIN interview_tag_mapping itm ON ie.id = itm.interview_experience_id
  LEFT JOIN interview_tag it ON itm.interview_tag_id = it.id
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
END;
$$;


ALTER FUNCTION "public"."get_applications_with_interview_stats"("job_posting_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_interview_rounds_with_tag_names"("p_application_id" "uuid") RETURNS TABLE("id" "uuid", "round_no" smallint, "description" "text", "interview_date" "date", "response_date" "date", "created_at" timestamp with time zone, "interview_tags" "text"[], "leetcode_questions" "jsonb"[], "user_data" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."get_interview_rounds_with_tag_names"("p_application_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_online_assessments_by_job_posting_id"("p_job_posting_id" "uuid") RETURNS TABLE("id" "uuid", "round_no" smallint, "description" "text", "interview_date" "date", "response_date" "date", "created_at" timestamp with time zone, "interview_tags" "text"[], "leetcode_questions" "jsonb"[], "user_data" "jsonb", "application_id" "uuid")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  SET search_path = public;  -- Ensures tables are from public schema
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
$$;


ALTER FUNCTION "public"."get_online_assessments_by_job_posting_id"("p_job_posting_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_questions_with_reply_counts"("job_posting_id" "uuid") RETURNS TABLE("id" "uuid", "content" "text", "entity_type" "text", "entity_id" "uuid", "user_id" "text", "created_at" timestamp with time zone, "reply_count" bigint, "user_data" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."get_questions_with_reply_counts"("job_posting_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'custom_role',
    ''
  )::text = 'admin';$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."requesting_user_id"() RETURNS "text"
    LANGUAGE "sql"
    AS $$SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
)::text;$$;


ALTER FUNCTION "public"."requesting_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."safe_to_date"("p_date" "text") RETURNS "date"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN p_date::DATE;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."safe_to_date"("p_date" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_job_posting_changelog"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."trigger_job_posting_changelog"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_application_and_interview_rounds"("p_user_id" "text", "p_application_id" "uuid", "p_applied_date" "date", "p_first_response_date" "date", "p_status" "text", "p_interview_rounds" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_application_and_interview_rounds"("p_user_id" "text", "p_application_id" "uuid", "p_applied_date" "date", "p_first_response_date" "date", "p_status" "text", "p_interview_rounds" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."application" (
    "status" "text" NOT NULL,
    "applied_date" "date" NOT NULL,
    "first_response_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "text" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_posting_id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "application_status_check" CHECK (("status" = ANY (ARRAY['Applied'::"text", 'Interviewing'::"text", 'Rejected'::"text", 'Ghosted'::"text", 'Offered'::"text"])))
);


ALTER TABLE "public"."application" OWNER TO "postgres";


COMMENT ON TABLE "public"."application" IS 'store the applications of this specific job';



CREATE TABLE IF NOT EXISTS "public"."comment" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "comment_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['job_posting'::"text", 'question'::"text", 'interview_experience'::"text"])))
);


ALTER TABLE "public"."comment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_name" "text" NOT NULL,
    "company_url" "text" NOT NULL,
    "user_id" "text" DEFAULT "public"."requesting_user_id"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "logo_url" "text"
);


ALTER TABLE "public"."company" OWNER TO "postgres";


COMMENT ON TABLE "public"."company" IS 'This is a duplicate of company';



COMMENT ON COLUMN "public"."company"."logo_url" IS 'logo_dev url for image';



CREATE TABLE IF NOT EXISTS "public"."interview_experience" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "round_no" smallint NOT NULL,
    "description" "text",
    "interview_date" "date" NOT NULL,
    "response_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."interview_experience" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interview_experience_leetcode_question" (
    "interview_experience_id" "uuid" NOT NULL,
    "leetcode_question_number" integer NOT NULL,
    "user_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "interview_experience_round_no" smallint NOT NULL
);


ALTER TABLE "public"."interview_experience_leetcode_question" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interview_tag" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tag_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."interview_tag" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interview_tag_mapping" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "interview_experience_id" "uuid" NOT NULL,
    "interview_tag_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."interview_tag_mapping" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_posting" (
    "title" "text" NOT NULL,
    "country" "text" NOT NULL,
    "closed_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "text" NOT NULL,
    "url" "text",
    "company_id" "uuid" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_posted_date" "date",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "job_status" "text" NOT NULL,
    CONSTRAINT "job_posting_job_status_check" CHECK (("job_status" = ANY (ARRAY['Pending'::"text", 'Verified'::"text", 'Closed'::"text", 'Rejected'::"text", 'No URL'::"text"])))
);


ALTER TABLE "public"."job_posting" OWNER TO "postgres";


COMMENT ON TABLE "public"."job_posting" IS 'This is a duplicate of job_posting';



COMMENT ON COLUMN "public"."job_posting"."url" IS 'url posting';



COMMENT ON COLUMN "public"."job_posting"."job_posted_date" IS 'managed by admin manually editedd';



CREATE TABLE IF NOT EXISTS "public"."job_posting_changelog" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_posting_id" "uuid" NOT NULL,
    "history" "jsonb" NOT NULL,
    "handled_by" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "chaneglog_notes" "text"
);


ALTER TABLE "public"."job_posting_changelog" OWNER TO "postgres";


COMMENT ON COLUMN "public"."job_posting_changelog"."chaneglog_notes" IS 'manually edited by admin';



CREATE TABLE IF NOT EXISTS "public"."leetcode_question" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question_number" integer NOT NULL,
    "difficulty" "text" NOT NULL,
    "interview_experience_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "text" NOT NULL,
    "interview_experience_round_no" smallint NOT NULL,
    CONSTRAINT "leetcode_question_difficulty_check" CHECK (("difficulty" = ANY (ARRAY['Easy'::"text", 'Medium'::"text", 'Hard'::"text"])))
);


ALTER TABLE "public"."leetcode_question" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."report_admin" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "report_message" "text",
    "user_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolution_notes" "text",
    "handled_by" "text",
    "handled_at" timestamp with time zone,
    "report_status" "public"."report admin status" DEFAULT 'Pending'::"public"."report admin status" NOT NULL,
    "report_type" "text" NOT NULL,
    CONSTRAINT "report_admin_report_status_check" CHECK (("report_status" = ANY (ARRAY['Pending'::"public"."report admin status", 'Rejected'::"public"."report admin status", 'Resolved'::"public"."report admin status"])))
);


ALTER TABLE "public"."report_admin" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "profile_pic_url" "text" NOT NULL,
    "user_id" "text" DEFAULT "public"."requesting_user_id"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_data" OWNER TO "postgres";


ALTER TABLE ONLY "public"."interview_experience_leetcode_question"
    ADD CONSTRAINT "InterviewExperienceLeetcodeQuestion_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leetcode_question"
    ADD CONSTRAINT "LeetcodeQuestion_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment"
    ADD CONSTRAINT "comment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company"
    ADD CONSTRAINT "company_company_name_key" UNIQUE ("company_name");



ALTER TABLE ONLY "public"."company"
    ADD CONSTRAINT "company_company_url_key" UNIQUE ("company_url");



ALTER TABLE ONLY "public"."company"
    ADD CONSTRAINT "company_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_experience"
    ADD CONSTRAINT "interview_experience_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_tag_mapping"
    ADD CONSTRAINT "interview_tag_mapping_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_tag"
    ADD CONSTRAINT "interview_tag_name_key" UNIQUE ("tag_name");



ALTER TABLE ONLY "public"."interview_tag"
    ADD CONSTRAINT "interview_tag_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_posting_changelog"
    ADD CONSTRAINT "job_posting_changelog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_posting"
    ADD CONSTRAINT "job_posting_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."report_admin"
    ADD CONSTRAINT "report_admin_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_experience_leetcode_question"
    ADD CONSTRAINT "unique_interview_experience_leetcode_question" UNIQUE ("interview_experience_id", "leetcode_question_number", "interview_experience_round_no");



ALTER TABLE ONLY "public"."interview_experience"
    ADD CONSTRAINT "unique_interview_round" UNIQUE ("application_id", "user_id", "round_no");



ALTER TABLE ONLY "public"."interview_tag_mapping"
    ADD CONSTRAINT "unique_interview_tag" UNIQUE ("interview_experience_id", "interview_tag_id");



ALTER TABLE ONLY "public"."leetcode_question"
    ADD CONSTRAINT "unique_leetcode_question" UNIQUE ("interview_experience_id", "question_number", "interview_experience_round_no");



ALTER TABLE ONLY "public"."user_data"
    ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_data"
    ADD CONSTRAINT "user_user_id_key" UNIQUE ("user_id");



CREATE OR REPLACE TRIGGER "after_trigger_job_posting_changelog" AFTER UPDATE ON "public"."job_posting" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_job_posting_changelog"();



ALTER TABLE ONLY "public"."interview_experience_leetcode_question"
    ADD CONSTRAINT "InterviewExperienceLeetcodeQuestion_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_data"("user_id");



ALTER TABLE ONLY "public"."leetcode_question"
    ADD CONSTRAINT "LeetcodeQuestion_interview_experience_id_fkey" FOREIGN KEY ("interview_experience_id") REFERENCES "public"."interview_experience"("id");



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_posting"("id");



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_data"("user_id");



ALTER TABLE ONLY "public"."comment"
    ADD CONSTRAINT "comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_data"("user_id");



ALTER TABLE ONLY "public"."company"
    ADD CONSTRAINT "company_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_data"("user_id");



ALTER TABLE ONLY "public"."interview_experience"
    ADD CONSTRAINT "interview_experience_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id");



ALTER TABLE ONLY "public"."interview_experience"
    ADD CONSTRAINT "interview_experience_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_data"("user_id");



ALTER TABLE ONLY "public"."interview_tag_mapping"
    ADD CONSTRAINT "interview_tag_mapping_interview_experience_id_fkey" FOREIGN KEY ("interview_experience_id") REFERENCES "public"."interview_experience"("id");



ALTER TABLE ONLY "public"."interview_tag_mapping"
    ADD CONSTRAINT "interview_tag_mapping_interview_tag_id_fkey" FOREIGN KEY ("interview_tag_id") REFERENCES "public"."interview_tag"("id");



ALTER TABLE ONLY "public"."interview_tag_mapping"
    ADD CONSTRAINT "interview_tag_mapping_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_data"("user_id");



ALTER TABLE ONLY "public"."job_posting_changelog"
    ADD CONSTRAINT "job_posting_changelog_handled_by_fkey" FOREIGN KEY ("handled_by") REFERENCES "public"."user_data"("user_id");



ALTER TABLE ONLY "public"."job_posting_changelog"
    ADD CONSTRAINT "job_posting_changelog_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_posting"("id");



ALTER TABLE ONLY "public"."job_posting"
    ADD CONSTRAINT "job_posting_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id");



ALTER TABLE ONLY "public"."job_posting"
    ADD CONSTRAINT "job_posting_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_data"("user_id");



ALTER TABLE ONLY "public"."leetcode_question"
    ADD CONSTRAINT "leetcode_question_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_data"("user_id");



ALTER TABLE ONLY "public"."report_admin"
    ADD CONSTRAINT "report_admin_handled_by_fkey" FOREIGN KEY ("handled_by") REFERENCES "public"."user_data"("user_id");



ALTER TABLE ONLY "public"."report_admin"
    ADD CONSTRAINT "report_admin_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_data"("user_id");



CREATE POLICY "Enable delete for users based on user_id" ON "public"."interview_experience" FOR DELETE TO "authenticated" USING (("public"."requesting_user_id"() = "user_id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."interview_experience_leetcode_question" FOR DELETE TO "authenticated" USING (("public"."requesting_user_id"() = "user_id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."interview_tag_mapping" FOR DELETE TO "authenticated" USING (("public"."requesting_user_id"() = "user_id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."leetcode_question" FOR DELETE TO "authenticated" USING (("public"."requesting_user_id"() = "user_id"));



CREATE POLICY "Enable insert for admin only" ON "public"."job_posting_changelog" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "Enable insert for admin only" ON "public"."report_admin" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "Enable insert for authenticated users only" ON "public"."comment" FOR INSERT TO "authenticated" WITH CHECK (("public"."requesting_user_id"() = "user_id"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."interview_experience_leetcode_question" FOR INSERT TO "authenticated" WITH CHECK (("public"."requesting_user_id"() = "user_id"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."interview_tag_mapping" FOR INSERT TO "authenticated" WITH CHECK (("public"."requesting_user_id"() = "user_id"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."leetcode_question" FOR INSERT TO "authenticated" WITH CHECK (("public"."requesting_user_id"() = "user_id"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."user_data" FOR INSERT TO "authenticated" WITH CHECK (("public"."requesting_user_id"() = "user_id"));



CREATE POLICY "Enable insert for authenticated users only, with check" ON "public"."interview_experience" FOR INSERT TO "authenticated" WITH CHECK (("public"."requesting_user_id"() = "user_id"));



CREATE POLICY "Enable read access for all users" ON "public"."application" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."comment" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."company" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."interview_experience" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."interview_experience_leetcode_question" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."interview_tag" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."interview_tag_mapping" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."job_posting" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."leetcode_question" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."user_data" FOR SELECT USING (true);



CREATE POLICY "Enable update for ADMIN ONLY" ON "public"."job_posting" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Enable update for admin only" ON "public"."report_admin" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Enable update for users based on email" ON "public"."comment" FOR UPDATE TO "authenticated" USING (("public"."requesting_user_id"() = "user_id")) WITH CHECK (("public"."requesting_user_id"() = "user_id"));



CREATE POLICY "Enable update for users based on email" ON "public"."interview_experience_leetcode_question" FOR UPDATE TO "authenticated" USING (("public"."requesting_user_id"() = "user_id")) WITH CHECK (("public"."requesting_user_id"() = "user_id"));



CREATE POLICY "Enable update for users based on email" ON "public"."interview_tag_mapping" FOR UPDATE TO "authenticated" USING (("public"."requesting_user_id"() = "user_id")) WITH CHECK (("public"."requesting_user_id"() = "user_id"));



CREATE POLICY "Enable update for users based on email" ON "public"."leetcode_question" FOR UPDATE TO "authenticated" USING (("public"."requesting_user_id"() = "user_id")) WITH CHECK (("public"."requesting_user_id"() = "user_id"));



CREATE POLICY "Enable update for users based on email" ON "public"."user_data" FOR UPDATE TO "authenticated" USING (("public"."requesting_user_id"() = "user_id")) WITH CHECK (("public"."requesting_user_id"() = "user_id"));



CREATE POLICY "Enable update interview, using, with check" ON "public"."interview_experience" FOR UPDATE TO "authenticated" USING (("public"."requesting_user_id"() = "user_id")) WITH CHECK (("public"."requesting_user_id"() = "user_id"));



CREATE POLICY "Enable view all data for admin only" ON "public"."report_admin" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "allow user to update their own application" ON "public"."application" FOR UPDATE TO "authenticated" USING (("public"."requesting_user_id"() = "user_id"));



ALTER TABLE "public"."application" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "enable select for admin only" ON "public"."job_posting_changelog" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "insert company with their own user id" ON "public"."company" FOR INSERT TO "authenticated" WITH CHECK (("public"."requesting_user_id"() = "user_id"));



CREATE POLICY "insert jobsss" ON "public"."job_posting" FOR INSERT TO "authenticated" WITH CHECK (("public"."requesting_user_id"() = "user_id"));



CREATE POLICY "insert new application by this user" ON "public"."application" FOR INSERT TO "authenticated" WITH CHECK (("public"."requesting_user_id"() = "user_id"));



ALTER TABLE "public"."interview_experience" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interview_experience_leetcode_question" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interview_tag" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interview_tag_mapping" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_posting" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_posting_changelog" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leetcode_question" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."report_admin" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_data" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
































































































































































































GRANT ALL ON FUNCTION "public"."get_applications_with_interview_stats"("job_posting_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_applications_with_interview_stats"("job_posting_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_applications_with_interview_stats"("job_posting_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_interview_rounds_with_tag_names"("p_application_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_interview_rounds_with_tag_names"("p_application_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_interview_rounds_with_tag_names"("p_application_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_online_assessments_by_job_posting_id"("p_job_posting_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_online_assessments_by_job_posting_id"("p_job_posting_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_online_assessments_by_job_posting_id"("p_job_posting_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_questions_with_reply_counts"("job_posting_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_questions_with_reply_counts"("job_posting_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_questions_with_reply_counts"("job_posting_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."requesting_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."requesting_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."requesting_user_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."safe_to_date"("p_date" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."safe_to_date"("p_date" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."safe_to_date"("p_date" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_job_posting_changelog"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_job_posting_changelog"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_job_posting_changelog"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_application_and_interview_rounds"("p_user_id" "text", "p_application_id" "uuid", "p_applied_date" "date", "p_first_response_date" "date", "p_status" "text", "p_interview_rounds" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_application_and_interview_rounds"("p_user_id" "text", "p_application_id" "uuid", "p_applied_date" "date", "p_first_response_date" "date", "p_status" "text", "p_interview_rounds" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_application_and_interview_rounds"("p_user_id" "text", "p_application_id" "uuid", "p_applied_date" "date", "p_first_response_date" "date", "p_status" "text", "p_interview_rounds" "jsonb") TO "service_role";





















GRANT ALL ON TABLE "public"."application" TO "anon";
GRANT ALL ON TABLE "public"."application" TO "authenticated";
GRANT ALL ON TABLE "public"."application" TO "service_role";



GRANT ALL ON TABLE "public"."comment" TO "anon";
GRANT ALL ON TABLE "public"."comment" TO "authenticated";
GRANT ALL ON TABLE "public"."comment" TO "service_role";



GRANT ALL ON TABLE "public"."company" TO "anon";
GRANT ALL ON TABLE "public"."company" TO "authenticated";
GRANT ALL ON TABLE "public"."company" TO "service_role";



GRANT ALL ON TABLE "public"."interview_experience" TO "anon";
GRANT ALL ON TABLE "public"."interview_experience" TO "authenticated";
GRANT ALL ON TABLE "public"."interview_experience" TO "service_role";



GRANT ALL ON TABLE "public"."interview_experience_leetcode_question" TO "anon";
GRANT ALL ON TABLE "public"."interview_experience_leetcode_question" TO "authenticated";
GRANT ALL ON TABLE "public"."interview_experience_leetcode_question" TO "service_role";



GRANT ALL ON TABLE "public"."interview_tag" TO "anon";
GRANT ALL ON TABLE "public"."interview_tag" TO "authenticated";
GRANT ALL ON TABLE "public"."interview_tag" TO "service_role";



GRANT ALL ON TABLE "public"."interview_tag_mapping" TO "anon";
GRANT ALL ON TABLE "public"."interview_tag_mapping" TO "authenticated";
GRANT ALL ON TABLE "public"."interview_tag_mapping" TO "service_role";



GRANT ALL ON TABLE "public"."job_posting" TO "anon";
GRANT ALL ON TABLE "public"."job_posting" TO "authenticated";
GRANT ALL ON TABLE "public"."job_posting" TO "service_role";



GRANT ALL ON TABLE "public"."job_posting_changelog" TO "anon";
GRANT ALL ON TABLE "public"."job_posting_changelog" TO "authenticated";
GRANT ALL ON TABLE "public"."job_posting_changelog" TO "service_role";



GRANT ALL ON TABLE "public"."leetcode_question" TO "anon";
GRANT ALL ON TABLE "public"."leetcode_question" TO "authenticated";
GRANT ALL ON TABLE "public"."leetcode_question" TO "service_role";



GRANT ALL ON TABLE "public"."report_admin" TO "anon";
GRANT ALL ON TABLE "public"."report_admin" TO "authenticated";
GRANT ALL ON TABLE "public"."report_admin" TO "service_role";



GRANT ALL ON TABLE "public"."user_data" TO "anon";
GRANT ALL ON TABLE "public"."user_data" TO "authenticated";
GRANT ALL ON TABLE "public"."user_data" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
