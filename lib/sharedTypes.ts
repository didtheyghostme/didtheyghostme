// Leetcode Questions Input
export type LeetcodeQuestionInput = Pick<LeetcodeQuestion, "question_number" | "difficulty">;

export const LEETCODE_DIFFICULTY = {
  Easy: "Easy",
  Medium: "Medium",
  Hard: "Hard",
} as const satisfies Record<LeetcodeDifficulty, LeetcodeDifficulty>;

const DIFFICULTY_ORDER = {
  Easy: 0,
  Medium: 1,
  Hard: 2,
} as const satisfies Record<LeetcodeDifficulty, number>;

export function utilSortLeetcodeQuestionsDifficulty(questions: LeetcodeQuestionInput[]) {
  return [...questions].sort((a, b) => {
    // First sort by difficulty
    const diffOrder = DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty];

    // If difficulties are the same, sort by question number
    return diffOrder !== 0 ? diffOrder : a.question_number - b.question_number;
  });
}

// Interview Experience

type InterviewExperienceBase = Pick<InterviewExperienceTable, "id" | "round_no" | "description" | "interview_date" | "response_date" | "created_at"> & {
  interview_tags: InterviewTag[] | null;
  leetcode_questions: LeetcodeQuestionInput[] | null;
};

export type InterviewExperienceCardData = InterviewExperienceBase & JoinedUser;
