import { Chip } from "@nextui-org/react";

import { LeetcodeQuestionInput } from "@/lib/sharedTypes";
import { LEETCODE_DIFFICULTY, utilSortLeetcodeQuestionsDifficulty } from "@/lib/sharedTypes";
import { utilSortInterviewTags } from "@/app/interview/[application_id]/InterviewTagsModal";

type InterviewTagsAndLeetcodeProps = {
  interview_tags: InterviewTag[] | null;
  leetcode_questions: LeetcodeQuestionInput[] | null;
};

export function InterviewTagsAndLeetcodeChips({ interview_tags, leetcode_questions }: InterviewTagsAndLeetcodeProps) {
  if ((!interview_tags || interview_tags.length === 0) && (!leetcode_questions || leetcode_questions.length === 0)) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Interview tags */}
      {interview_tags &&
        interview_tags.length > 0 &&
        utilSortInterviewTags(interview_tags).map((tag) => (
          <Chip key={tag} color="secondary" size="sm" variant="flat">
            {tag}
          </Chip>
        ))}

      {/* LeetCode questions */}
      {leetcode_questions &&
        leetcode_questions.length > 0 &&
        utilSortLeetcodeQuestionsDifficulty(leetcode_questions).map((question, index) => (
          <Chip key={index} color={question.difficulty === LEETCODE_DIFFICULTY.Easy ? "success" : question.difficulty === LEETCODE_DIFFICULTY.Medium ? "warning" : "danger"} size="sm" variant="flat">
            LC-{question.question_number} ({question.difficulty})
          </Chip>
        ))}
    </div>
  );
}
