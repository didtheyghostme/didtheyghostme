import { DBTable } from "@/lib/constants/dbTables";

type InterviewExperienceBase = Pick<InterviewExperienceTable, "id" | "round_no" | "difficulty" | "description" | "interview_date" | "response_date" | "interview_tags" | "created_at">;

type UserInfo = Pick<User, "full_name" | "profile_pic_url">;

export type JobPostPageInterviewData = InterviewExperienceBase & {
  [DBTable.APPLICATION]: Pick<ApplicationTable, "id" | "job_posting_id" | "status">;
  [DBTable.USER]: UserInfo;
};

export type InterviewExperienceCardData = InterviewExperienceBase & {
  [DBTable.USER]: UserInfo;
};
