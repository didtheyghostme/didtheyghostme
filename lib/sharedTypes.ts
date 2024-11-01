type InterviewExperienceBase = Pick<InterviewExperienceTable, "id" | "round_no" | "difficulty" | "description" | "interview_date" | "response_date" | "created_at"> & {
  interview_tags: InterviewTag[] | null;
};

export type InterviewExperienceCardData = InterviewExperienceBase & JoinedUser;
