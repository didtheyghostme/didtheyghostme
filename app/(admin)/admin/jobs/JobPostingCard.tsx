"use client";

import { useState } from "react";
import { Card, Modal, ModalContent, Link } from "@nextui-org/react";

import { JobPostingEditForm } from "./JobPostingEditForm";
import { JobPostingHistory } from "./JobPostingHistory";

import { CustomButton } from "@/components/CustomButton";

function EditIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function JobPostingCard({ jobPosting }: { jobPosting: JobPostingTable }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isViewingHistory, setIsViewingHistory] = useState(false);

  return (
    <Card className="bg-content1 p-4">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-medium">{jobPosting.title}</h3>
          <div className="mt-2 space-y-1 text-sm text-default-500">
            <p>
              Status: <span className="text-default-700">{jobPosting.job_status}</span>
            </p>
            <p>
              Country: <span className="text-default-700">{jobPosting.country}</span>
            </p>
            <p>
              Internal URL: <Link href={`/job/${jobPosting.id}`}>View</Link>
            </p>

            {jobPosting.url && (
              <p>
                URL:{" "}
                <a className="text-primary hover:underline" href={jobPosting.url} rel="noopener noreferrer" target="_blank">
                  View job portal URL
                </a>
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <CustomButton isIconOnly variant="light" onPress={() => setIsEditing(true)}>
            <EditIcon />
          </CustomButton>
          <CustomButton isIconOnly variant="light" onPress={() => setIsViewingHistory(true)}>
            <HistoryIcon />
          </CustomButton>
        </div>
      </div>

      <Modal isOpen={isEditing} onOpenChange={(open) => setIsEditing(open)}>
        <ModalContent>{(onClose) => <JobPostingEditForm jobPosting={jobPosting} onClose={onClose} />}</ModalContent>
      </Modal>

      <Modal isOpen={isViewingHistory} size="2xl" onOpenChange={(open) => setIsViewingHistory(open)}>
        <ModalContent>
          <JobPostingHistory jobPostingId={jobPosting.id} />
        </ModalContent>
      </Modal>
    </Card>
  );
}
