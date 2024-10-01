"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardBody, CardHeader, Divider, Chip, Button, Spacer } from "@nextui-org/react";

import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";
import { ArrowLeftIcon } from "@/components/icons";

export default function InterviewExperiencePage() {
  const { application_id } = useParams();
  const { data: applicationDetails, error, isLoading } = useSWR<ApplicationResponse>(API.INTERVIEW.getByApplicationId(application_id as string), fetcher);

  const router = useRouter();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading application details</div>;
  if (!applicationDetails) return <div>Application not found</div>;

  const handleBackClick = () => {
    router.back();
  };

  const handleAddNewInterviewRoundClick = () => {
    console.log("add new interview round");
  };

  return (
    <div className="mx-auto max-w-[1024px]">
      <Button className="mb-4" color="primary" startContent={<ArrowLeftIcon />} variant="light" onPress={handleBackClick}>
        Back to job
      </Button>

      <h1 className="mb-4 text-3xl font-bold">Interview Experience</h1>

      <Card className="mb-8">
        <CardHeader>
          <h2 className="text-2xl font-semibold">title</h2>
          <p className="text-default-500">company name</p>
        </CardHeader>
        <Divider />
        <CardBody>
          <p>Applied on: 12/12/2024</p>
          <p>
            Status: <Chip color="primary">Applied</Chip>
          </p>
          <p>First response: 12/12/2024</p>
        </CardBody>
      </Card>

      <h2 className="mb-4 text-2xl font-semibold">Interview Rounds</h2>

      {applicationDetails.data.map((application) => (
        <Card key={application.id} className="mb-4">
          <CardHeader>
            <h3 className="text-xl font-semibold">Round {application.first_response_at}</h3>
          </CardHeader>
          <Divider />
          <CardBody>
            <p>
              Difficulty: <Chip color={application.status === "Applied" ? "success" : application.status === "Interviewing" ? "warning" : "danger"}>Medium</Chip>
            </p>
            <p>Date: {new Date(application.created_at).toLocaleDateString()}</p>
          </CardBody>
        </Card>
      ))}

      <Spacer y={4} />

      <Button color="primary" onPress={handleAddNewInterviewRoundClick}>
        Add New Interview Round
      </Button>
    </div>
  );
}
