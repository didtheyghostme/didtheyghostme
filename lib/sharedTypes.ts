import { DBTable } from "@/lib/constants/dbTables";

type InterviewExperienceBase = Pick<InterviewExperienceTable, "id" | "round_no" | "difficulty" | "description" | "interview_date" | "response_date" | "interview_tags" | "created_at">;

export type JobPostPageInterviewData = InterviewExperienceBase & {
  [DBTable.APPLICATION]: Pick<ApplicationTable, "id" | "job_posting_id" | "status">;
} & JoinedUser;

export type InterviewExperienceCardData = InterviewExperienceBase & JoinedUser;
