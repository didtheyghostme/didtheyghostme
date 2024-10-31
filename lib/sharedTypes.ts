type InterviewExperienceBase = Pick<InterviewExperienceTable, "id" | "round_no" | "difficulty" | "description" | "interview_date" | "response_date" | "interview_tags" | "created_at">;

export type InterviewExperienceCardData = InterviewExperienceBase & JoinedUser;
