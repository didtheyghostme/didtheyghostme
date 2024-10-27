import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Checkbox } from "@nextui-org/react";
import { useState } from "react";

import { INTERVIEW_TAGS } from "@/lib/schema/updateInterviewRoundSchema";

const INTERVIEW_TAG_MAP: Record<InterviewTag, string> = {
  "Online Assessment": "Examples: Take home assignments, HackerRank, LeetCode, HireVue, recorded video questions, etc. (usually not with a human interviewer)",
  "HR/Recruiter": "A call with HR/Recruiter, usually conducted via phone or video",
  Technical: "In-depth assessment of technical skills",
  Behavioral: "Evaluation of soft skills and past experiences",
  "Hiring Manager": "Interview conducted by the hiring manager",
  "Final Round": "",
};

type InterviewTagsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedTags: InterviewTag[];
  onTagsChange: (tags: InterviewTag[]) => void;
};

export function InterviewTagsModal({ isOpen, onClose, selectedTags, onTagsChange }: InterviewTagsModalProps) {
  const [localSelectedTags, setLocalSelectedTags] = useState<InterviewTag[]>(selectedTags);

  const handleTagToggle = (tag: InterviewTag) => {
    setLocalSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSave = () => {
    const sortedTags = INTERVIEW_TAGS.filter((tag) => localSelectedTags.includes(tag));

    onTagsChange(sortedTags);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Select Interview Tags</ModalHeader>
        <ModalBody>
          {INTERVIEW_TAGS.map((tag) => (
            <div key={tag} className="mb-4">
              <Checkbox className="mb-1" isSelected={localSelectedTags.includes(tag)} onValueChange={() => handleTagToggle(tag)}>
                {tag}
              </Checkbox>
              <p className="ml-6 text-sm text-gray-500">{INTERVIEW_TAG_MAP[tag]}</p>
            </div>
          ))}
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSave}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
