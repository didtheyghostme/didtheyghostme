type LeetcodeQuestionInput = Pick<LeetcodeQuestion, "question_number" | "difficulty">;

type InterviewExperienceBase = Pick<InterviewExperienceTable, "id" | "round_no" | "description" | "interview_date" | "response_date" | "created_at"> & {
  interview_tags: InterviewTag[] | null;
  leetcode_questions: LeetcodeQuestionInput[] | null;
};

export type InterviewExperienceCardData = InterviewExperienceBase & JoinedUser;
