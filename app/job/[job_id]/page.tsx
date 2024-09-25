"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardBody, CardHeader, Divider, Chip, Button, Spacer, LinkIcon, Link, useDisclosure } from "@nextui-org/react";

import ReportLinkModal from "./ReportLinkModal";

import { fetcher } from "@/lib/fetcher";
import { ArrowLeftIcon, FlagIcon } from "@/components/icons";

type JobDetails = {
  id: number;
  title: string;
  country: string;
  url: string | null;
  company: {
    id: number;
    company_name: string;
  };
};

export default function JobDetailsPage() {
  const { job_id } = useParams();
  const { data: jobDetails, error, isLoading } = useSWR<JobDetails>(`/api/job/${job_id}`, fetcher);
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading job details</div>;
  if (!jobDetails) return <div>Job not found</div>;

  const handleBackClick = () => {
    router.push(`/company/${jobDetails.company.id}`);
  };

  const handleReportLinkClick = () => {
    onOpen(); // Open the modal
  };

  const handleTrackJobClick = () => {
    console.log("Track job");
    // TODO: add to Application table, status default Applied
  };

  const handleApplicationClick = () => {
    console.log("Application clicked");
    // TODO: go to specific application page, with application id, show all interview experiences of this application
  };

  return (
    <div className="mx-auto max-w-[1024px] p-4">
      <Button className="mb-4" color="primary" startContent={<ArrowLeftIcon />} variant="light" onPress={handleBackClick}>
        Back to {jobDetails.company.company_name}
      </Button>

      <Card className="mb-8">
        <CardHeader className="flex flex-row justify-between">
          <h1 className="text-3xl font-bold">{jobDetails.title}</h1>
          {jobDetails.url && (
            <div className="flex items-center gap-2">
              <Link isExternal href={jobDetails.url}>
                <LinkIcon />
                Job portal
              </Link>
              <Button color="danger" size="sm" startContent={<FlagIcon />} variant="flat" onPress={handleReportLinkClick}>
                Report Link
              </Button>
            </div>
          )}
        </CardHeader>
        <Divider />
        <CardBody>
          <p className="text-lg">Location: {jobDetails.country}</p>
          <Spacer y={2} />
          <Chip color="primary" variant="flat">
            Active
          </Chip>

          <Button color="success" variant="bordered" onPress={handleTrackJobClick}>
            Track this job
          </Button>
        </CardBody>
      </Card>

      {/* TODO: add application cards below */}
      <div className="flex gap-4">
        <Card isPressable className="w-full" onPress={handleApplicationClick}>
          <CardHeader>
            <h2 className="text-xl font-bold">Anonymous</h2>
          </CardHeader>
          <CardBody>
            <p>3 rounds</p>
            <p>Status: Applied and waiting for response</p>
            <Chip color="primary" variant="flat">
              Applied
            </Chip>
            <Chip color="danger" variant="flat">
              Rejected
            </Chip>
          </CardBody>
        </Card>
      </div>

      <ReportLinkModal isOpen={isOpen} jobId={jobDetails.id} onClose={onClose} />
    </div>
  );
}
