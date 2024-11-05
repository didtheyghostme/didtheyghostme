"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardBody, Avatar, Button } from "@nextui-org/react";
import mixpanel from "mixpanel-browser";

import { CommentSection } from "./CommentSection";

import { API } from "@/lib/constants/apiRoutes";
import { fetcher } from "@/lib/fetcher";
import { QuestionPageRequest } from "@/app/api/comment/[comment_id]/route";
import { formatHowLongAgo } from "@/lib/formatDateUtils";
import { ArrowLeftIcon } from "@/components/icons";

export default function QuestionPage() {
  const { comment_id } = useParams();

  const router = useRouter();

  const { data: question, error, isLoading } = useSWR<QuestionPageRequest>(API.COMMENT.getById(comment_id as string), fetcher);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading question</div>;
  if (!question) return <div>Question not found</div>;

  const handleBackClick = () => {
    mixpanel.track("back_button_clicked", {
      page: "question_page",
      comment_id: comment_id,
    });
    router.push(`/job/${question.entity_id}?tab=Questions`);
  };

  return (
    <div className="">
      <Button className="mb-4" color="primary" startContent={<ArrowLeftIcon />} variant="light" onClick={handleBackClick}>
        Back
      </Button>
      <Card className="mb-8">
        <CardBody>
          <div className="flex items-start space-x-4">
            <Avatar className="flex-shrink-0" name={question.user_data.full_name} src={question.user_data.profile_pic_url} />
            <div className="flex-grow">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-default-500">{question.user_data.full_name}</span>
                <span className="text-sm text-gray-500">{formatHowLongAgo(question.created_at)}</span>
              </div>
              <p className="mb-4 whitespace-pre-wrap text-lg">{question.content}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <CommentSection entity_id={comment_id as string} entity_type="question" />
    </div>
  );
}
