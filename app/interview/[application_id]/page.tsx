"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardBody, CardHeader, Divider, Chip, Button, Spacer, cn, Dropdown, DropdownItem, DropdownMenu, DropdownSection, DropdownTrigger } from "@nextui-org/react";

import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";
import { AddNoteIcon, ArrowLeftIcon, DeleteDocumentIcon, EditDocumentIcon, FlagIcon } from "@/components/icons";
import { APPLICATION_STATUS } from "@/lib/constants/applicationStatus";

export default function InterviewExperiencePage() {
  const { application_id } = useParams();
  const { data: applicationDetails, error, isLoading } = useSWR<ProcessedApplication>(API.APPLICATION.getByApplicationId(application_id as string), fetcher);

  const router = useRouter();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading application details</div>;
  if (!applicationDetails) return <div>Application not found</div>;

  const handleBackClick = () => {
    router.back();
  };

  const handleAddNewInterviewRoundClick = () => {
    console.log("add new interview round");
    // TODO: add new interview round form with the tiptap markdown editor - modal or?
    // button to save the entire form? or add straight away update, with edit pencil button and delete trash icon for current user item true?
  };

  const handleReceivedResponseClick = () => {
    console.log("I have received a response");
    // TODO: show modal with calendar form to call API update the response date first_response_at, change application status to Interviewing
  };

  const handleGhostedClick = () => {
    console.log("I have been ghosted");
    // TODO: call API to update application status to Ghosted, if first response date not set, show calendar to set
  };

  const handleMenuItemClick = (key: React.Key) => {
    console.log("menu item clicked", key);
    // TODO: call API, if first response date, show calendar to set
    // if status is rejected or offered, show calendar to ask when the date is for first_response_at
  };

  const iconClasses = "text-xl text-default-500 pointer-events-none flex-shrink-0";

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
          <div>
            <span>Status:</span> <Chip color="primary">Applied</Chip>
          </div>
          {/* TODO: first, use date picker input */}
          <p>First response: {applicationDetails.first_response_at} </p>

          {/* TODO: add calendar icon to update the first response date instead of the dropdown below? */}
        </CardBody>
        {/* TODO: add a dropdown to select the application status and call API to update the application status */}
        <Dropdown>
          <DropdownTrigger>
            <Button variant="bordered">Update status</Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Dropdown menu with description" selectionMode="single" variant="faded" onAction={handleMenuItemClick}>
            <DropdownSection showDivider title="Status">
              <DropdownItem key={APPLICATION_STATUS.APPLIED} description="Input first response date" shortcut="⌘N" startContent={<AddNoteIcon className={iconClasses} />}>
                Received response
              </DropdownItem>
              {/* <DropdownItem key="copy" description="You are interviewing" shortcut="⌘C" startContent={<CopyDocumentIcon className={iconClasses} />}>
                {APPLICATION_STATUS.INTERVIEWING}
              </DropdownItem> */}
            </DropdownSection>
            <DropdownSection showDivider>
              <DropdownItem
                key={APPLICATION_STATUS.GHOSTED}
                className="text-warning"
                color="warning"
                description="You have been ghosted"
                shortcut="⌘⇧E"
                startContent={<EditDocumentIcon className={cn(iconClasses, "text-warning")} />}
              >
                {APPLICATION_STATUS.GHOSTED}
              </DropdownItem>
              <DropdownItem
                key={APPLICATION_STATUS.REJECTED}
                className="text-danger"
                color="danger"
                description="You have been rejected"
                shortcut="⌘⇧D"
                startContent={<DeleteDocumentIcon className={cn(iconClasses, "text-danger")} />}
              >
                {APPLICATION_STATUS.REJECTED}
              </DropdownItem>
            </DropdownSection>
            <DropdownSection>
              <DropdownItem
                key={APPLICATION_STATUS.OFFER}
                className="text-success"
                color="success"
                description="You have received an offer :)"
                shortcut="⌘⇧D"
                startContent={<FlagIcon className={cn(iconClasses, "text-success")} />}
              >
                {APPLICATION_STATUS.OFFER}
              </DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      </Card>

      <h2 className="mb-4 text-2xl font-semibold">Interview Rounds</h2>

      {/* TODO: interviews.map(interview) here */}
      <Card key={applicationDetails.id} className="mb-4">
        <CardHeader>
          <h3 className="text-xl font-semibold">Round {applicationDetails.first_response_at}</h3>
        </CardHeader>
        <Divider />
        <CardBody>
          <span>
            Difficulty: <Chip color={applicationDetails.status === "Applied" ? "success" : applicationDetails.status === "Interviewing" ? "warning" : "danger"}>Medium</Chip>
          </span>
          <p>Date: {new Date(applicationDetails.created_at).toLocaleDateString()}</p>
        </CardBody>
      </Card>

      <Spacer y={4} />

      <Button color="primary" onPress={handleAddNewInterviewRoundClick}>
        Add New Interview Round
      </Button>
    </div>
  );
}
