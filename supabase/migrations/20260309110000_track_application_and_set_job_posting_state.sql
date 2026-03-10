-- track_application(): Inserts application and clears To Apply/Skipped state.
-- Enforces invariant: tracked jobs cannot be in To Apply or Skipped.
create or replace function "public"."track_application"(
  "p_user_id" text,
  "p_job_posting_id" uuid,
  "p_applied_date" date
)
returns void
language plpgsql
as $function$
begin
  -- Serialize writes for this user/job pair to avoid races across concurrent requests.
  -- This keeps application and job posting state transitions consistent.
  perform pg_advisory_xact_lock(hashtext(p_user_id), hashtext(p_job_posting_id::text));

  insert into "public"."application" (
    "status",
    "applied_date",
    "user_id",
    "job_posting_id"
  ) values (
    'Applied',
    p_applied_date,
    p_user_id,
    p_job_posting_id
  );

  -- No note: delete state row entirely
  delete from "public"."user_job_posting_state"
  where "user_id" = p_user_id
    and "job_posting_id" = p_job_posting_id
    and "note" is null
    and ("to_apply_at" is not null or "skipped_at" is not null);

  -- Has note: keep row, clear to_apply_at and skipped_at
  update "public"."user_job_posting_state"
  set
    "to_apply_at" = null,
    "skipped_at" = null
  where "user_id" = p_user_id
    and "job_posting_id" = p_job_posting_id
    and "note" is not null
    and ("to_apply_at" is not null or "skipped_at" is not null);
end;
$function$;



-- set_job_posting_state(): Manages To Apply/Skipped/Note
-- Rejects set_to_apply/set_skipped when job is already tracked.
create or replace function "public"."set_job_posting_state"(
  "p_user_id" text,
  "p_job_posting_id" uuid,
  "p_action" text,
  "p_note" text default null
)
returns jsonb
language plpgsql
as $function$
declare
  v_now timestamptz := now();
  v_existing "public"."user_job_posting_state"%rowtype;
  v_result "public"."user_job_posting_state"%rowtype;
  v_next_to_apply_at timestamptz;
  v_next_skipped_at timestamptz;
  v_next_note text;
begin
  -- Serialize writes for this user/job pair to avoid races across concurrent requests.
  -- This keeps application and job posting state transitions consistent.
  perform pg_advisory_xact_lock(hashtext(p_user_id), hashtext(p_job_posting_id::text));

  -- Keep the RPC contract explicit and reject unknown actions at the database boundary
  if p_action not in ('set_to_apply', 'clear_to_apply', 'set_skipped', 'clear_skipped', 'set_note') then
    raise exception 'Invalid job posting state action.'
      using errcode = 'P0001', detail = 'INVALID_JOB_POSTING_STATE_ACTION';
  end if;

  -- Enforce invariant: tracked jobs cannot be in To Apply or Skipped
  if p_action in ('set_to_apply', 'set_skipped') and exists (
    select 1
    from "public"."application" as a
    where a."user_id" = p_user_id
      and a."job_posting_id" = p_job_posting_id
  ) then
    raise exception 'Tracked jobs cannot also be in To Apply or Skipped.'
      using errcode = 'P0001', detail = 'TRACKED_JOB_STATE_CONFLICT';
  end if;

  -- Read current state and derive next state: set_to_apply and set_skipped are mutually exclusive
  select *
  into v_existing
  from "public"."user_job_posting_state"
  where "user_id" = p_user_id
    and "job_posting_id" = p_job_posting_id;

  v_next_to_apply_at := case
    when p_action = 'set_to_apply' then v_now
    when p_action = 'clear_to_apply' then null
    when p_action = 'set_skipped' then null
    else v_existing."to_apply_at"
  end;

  v_next_skipped_at := case
    when p_action = 'set_skipped' then v_now
    when p_action = 'clear_skipped' then null
    when p_action = 'set_to_apply' then null
    else v_existing."skipped_at"
  end;

  v_next_note := case
    when p_action = 'set_note' then p_note
    else v_existing."note"
  end;

  -- Avoid storing empty rows when no state remains for this user/job pair
  if v_next_to_apply_at is null and v_next_skipped_at is null and v_next_note is null then
    delete from "public"."user_job_posting_state"
    where "user_id" = p_user_id
      and "job_posting_id" = p_job_posting_id;

    return null;
  end if;

  -- Upsert state: keep exactly one state row per user/job pair
  insert into "public"."user_job_posting_state" (
    "user_id",
    "job_posting_id",
    "to_apply_at",
    "skipped_at",
    "note"
  ) values (
    p_user_id,
    p_job_posting_id,
    v_next_to_apply_at,
    v_next_skipped_at,
    v_next_note
  )
  on conflict ("user_id", "job_posting_id")
  do update set
    "to_apply_at" = excluded."to_apply_at",
    "skipped_at" = excluded."skipped_at",
    "note" = excluded."note"
  returning *
  into v_result;

  -- Return the stored row shape so the API can refresh client state directly
  return jsonb_build_object(
    'job_posting_id', v_result."job_posting_id",
    'to_apply_at', v_result."to_apply_at",
    'skipped_at', v_result."skipped_at",
    'note', v_result."note",
    'created_at', v_result."created_at",
    'updated_at', v_result."updated_at"
  );
end;
$function$;

