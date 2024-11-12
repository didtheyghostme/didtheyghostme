"use client";

import { useParams, usePathname } from "next/navigation";
import useSWR from "swr";
import { Card, CardBody, Link, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from "@nextui-org/react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import mixpanel from "mixpanel-browser";
import { toast } from "sonner";

import { fetcher } from "@/lib/fetcher";
import { AddJobFormData, addJobSchema } from "@/lib/schema/addJobSchema";
import { useCreateJob } from "@/lib/hooks/useCreateJob";
import COUNTRIES from "@/lib/constants/countries";
import { API } from "@/lib/constants/apiRoutes";
import { formatDateDayMonthYear, formatHowLongAgo, isRecentDate } from "@/lib/formatDateUtils";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { PlusIcon } from "@/components/icons";
import { ERROR_MESSAGES, isRateLimitError } from "@/lib/errorHandling";
import { RateLimitErrorMessage } from "@/components/RateLimitErrorMessage";
import { LoadingContent } from "@/components/LoadingContent";
import { ErrorMessageContent } from "@/components/ErrorMessageContent";
import { DataNotFoundMessage } from "@/components/DataNotFoundMessage";
import { CustomChip } from "@/components/CustomChip";
import { CustomButton } from "@/components/CustomButton";

export type CompanyDetailsPageCompanyResponse = Pick<CompanyTable, "company_name" | "company_url" | "logo_url">;

export type CompanyDetailsPageAllJobsResponse = Pick<JobPostingTable, "id" | "title" | "job_status" | "updated_at" | "job_posted_date" | "closed_date">;

export default function CompanyDetailsPage() {
  const pathname = usePathname();

  const { company_id } = useParams();

  const { data: company, error, isLoading } = useSWR<CompanyDetailsPageCompanyResponse>(API.COMPANY.getById(company_id as string), fetcher);

  const { data: allJobs, error: jobError, isLoading: jobIsLoading } = useSWR<CompanyDetailsPageAllJobsResponse[]>(API.JOB_POSTING.getAllByCompanyId(company_id as string), fetcher);

  // console.warn("jobs", allJobs);

  const { createJob, isCreating } = useCreateJob(company_id as string);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setFocus,
  } = useForm<AddJobFormData>({
    resolver: zodResolver(addJobSchema),
    defaultValues: {
      title: "",
      country: "Singapore",
      url: null,
    },
  });

  useEffect(() => {
    if (isModalOpen) {
      setFocus("title");
    }
  }, [isModalOpen, setFocus]);

  if (isLoading || jobIsLoading) return <LoadingContent />;
  if (error || jobError) {
    if (isRateLimitError(error) || isRateLimitError(jobError)) {
      return <RateLimitErrorMessage />;
    }

    return <ErrorMessageContent message="Failed to load data" />;
  }
  if (!company) return <DataNotFoundMessage message="Company not found" />;
  if (!allJobs) return <DataNotFoundMessage message="Job not found" />;

  const openJobs = allJobs.filter((job) => job.job_status !== "Closed");
  const closedJobs = allJobs.filter((job) => job.job_status === "Closed");

  const handleAddThisJob = handleSubmit(async (data: AddJobFormData) => {
    // TODO: add this job to the company using server action and mutation
    if (isCreating) return;

    try {
      await createJob(data);

      mixpanel.track("Job Added", {
        company_name: company.company_name,
        company_id,
        job_title: data.title,
      });
      toast.success("Job added successfully");

      handleCloseModal();
    } catch (err) {
      console.error("Error adding job:", err);
      if (isRateLimitError(err)) {
        toast.error(ERROR_MESSAGES.TOO_MANY_REQUESTS);

        return; // Return early to avoid showing generic error
      }

      mixpanel.track("Company Details", {
        action: "job_creation_error",
        company_id,
        job_title: data.title,
        error: err instanceof Error ? err.message : "Unknown error occurred",
      });
      toast.error("Error adding job");
    }
  });

  const handleOpenModal = () => {
    mixpanel.track("Company Details", {
      action: "add_a_new_job_clicked",
      company_id,
      company_name: company.company_name,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    mixpanel.track("Company Details", {
      action: "add_a_new_job_modal_closed",
      company_id,
    });
    setIsModalOpen(false);
    reset();
  };

  const mixpanelTrackViewJobCardClick = (job: CompanyDetailsPageAllJobsResponse) => {
    // TODO: implement go to the job page, show all the interview experiences
    // TODO: on job page, have button to "Track this job", which then add to Application table with today date
    // TODO: the button then changes to "View my application", next step is fill in date of when the first contact -> round 0 = applied, round 1 = contacted
    // TODO: after that, have a button to "Add Interview Experience" with markdown editor
    mixpanel.track("Company Details", {
      action: "view_job_card_clicked",
      company_id,
      job_id: job.id,
      job_status: job.job_status,
    });
  };

  const mixpanelTrackViewMoreButtonClick = (job: CompanyDetailsPageAllJobsResponse) => {
    mixpanel.track("Company Details", {
      action: "view_more_button_clicked",
      company_id,
      job_id: job.id,
      job_status: job.job_status,
    });
  };

  const handleCompanyWebsiteClick = () => {
    mixpanel.track("Company Details", {
      action: "company_website_button_clicked",
      company_id,
      company_name: company.company_name,
    });
  };

  return (
    <div className="pb-12">
      {/* Company Name and Logo and URL */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 flex-shrink-0">
            <ImageWithFallback companyName={company.company_name} src={company.logo_url} />
          </div>
          <h1 className="break-words text-base font-bold sm:text-3xl">{company.company_name}</h1>
        </div>
        <Link isExternal showAnchorIcon className="whitespace-nowrap text-primary hover:underline" href={company.company_url} onPress={handleCompanyWebsiteClick}>
          Company website
        </Link>
      </div>

      {/* Open Positions with modal */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-lg font-semibold sm:text-2xl">Open Positions</p>
        <SignedIn>
          <CustomButton
            className="gap-0 bg-primary px-3 py-2 text-sm text-primary-foreground shadow-lg transition-all duration-200 hover:opacity-90 sm:px-4 sm:py-2.5 sm:text-base"
            color="primary"
            endContent={<PlusIcon />}
            variant="solid"
            onPress={handleOpenModal}
          >
            Add a new job
          </CustomButton>
        </SignedIn>
        <SignedOut>
          <SignInButton fallbackRedirectUrl={pathname} mode="modal">
            <CustomButton
              className="gap-0 bg-primary px-3 py-2 text-sm text-primary-foreground shadow-lg transition-all duration-200 hover:opacity-90 sm:px-4 sm:py-2.5 sm:text-base"
              color="primary"
              endContent={<PlusIcon />}
              variant="solid"
              onPress={handleOpenModal}
            >
              Add a new job
            </CustomButton>
          </SignInButton>
        </SignedOut>
      </div>

      <SignedIn>
        <Modal isOpen={isModalOpen} placement="center" onClose={handleCloseModal}>
          <ModalContent>
            <form onSubmit={handleAddThisJob}>
              <ModalHeader className="flex flex-col gap-1 pb-0 pt-4 sm:py-4">Add New Job</ModalHeader>
              <ModalBody>
                <Controller
                  control={control}
                  name="title"
                  render={({ field }) => (
                    <Input {...field} isRequired errorMessage={errors.title?.message} isInvalid={!!errors.title} label="Job Title" placeholder="Enter job title" variant="bordered" />
                  )}
                />
                <Controller
                  control={control}
                  name="url"
                  render={({ field }) => (
                    <Input
                      {...field}
                      errorMessage={errors.url?.message}
                      isInvalid={!!errors.url && field.value !== null}
                      label="Job URL (optional)"
                      placeholder="Enter job application URL from the company"
                      value={field.value ?? ""}
                      variant="bordered"
                      onChange={(e) => {
                        const value = e.target.value.trim();

                        field.onChange(value === "" ? null : value);
                      }}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="country"
                  render={({ field }) => (
                    <Select defaultSelectedKeys={[field.value]} errorMessage={errors.country?.message} label="Country" placeholder="Select a country">
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                />
              </ModalBody>
              <ModalFooter className="">
                <CustomButton color="danger" variant="light" onPress={handleCloseModal}>
                  Cancel
                </CustomButton>
                <CustomButton color="primary" isLoading={isCreating} type="submit">
                  Add Job
                </CustomButton>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      </SignedIn>

      {openJobs.length === 0 && <DataNotFoundMessage message="No one has posted any open positions yet" title="No open jobs yet" />}

      {/* Job Cards open */}
      {openJobs.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {openJobs.map((job) => (
            <Card key={job.id} isPressable as={Link} href={`/job/${job.id}`} onPress={() => mixpanelTrackViewJobCardClick(job)}>
              <CardBody className="flex h-full flex-col">
                <div className="flex-grow">
                  <p className="mb-2 text-xl font-semibold">{job.title}</p>
                  <p className="mb-4 text-default-500">• {formatHowLongAgo(job.updated_at)} </p>
                  {job.job_posted_date && isRecentDate(job.job_posted_date) && (
                    <CustomChip className="mb-4" color="secondary" variant="flat">
                      New
                    </CustomChip>
                  )}
                </div>
                <CustomButton as="span" className="mt-auto w-full" size="sm" variant="flat" onPress={() => mixpanelTrackViewMoreButtonClick(job)}>
                  View More
                </CustomButton>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* closed jobs */}
      {closedJobs.length > 0 && (
        <div className="flex flex-col gap-4 py-8">
          <p className="text-2xl font-semibold">Closed Positions</p>

          <div className="grid grid-cols-1 gap-4 opacity-75 sm:grid-cols-2 md:grid-cols-3">
            {closedJobs.map((job) => (
              <Card key={job.id} isPressable as={Link} href={`/job/${job.id}`} onPress={() => mixpanelTrackViewJobCardClick(job)}>
                <CardBody className="flex h-full flex-col">
                  <p className="mb-2 text-xl font-semibold">{job.title}</p>
                  <p className="mb-4 text-default-500">• {formatHowLongAgo(job.updated_at)} </p>
                  {job.job_posted_date && (
                    <p>
                      Posted Date: <span className="text-default-700">{formatDateDayMonthYear(job.job_posted_date)}</span>
                    </p>
                  )}
                  {job.closed_date && (
                    <p>
                      Closed Date: <span className="text-default-700">{formatDateDayMonthYear(job.closed_date)}</span>
                    </p>
                  )}
                  <CustomButton as="span" className="mt-auto w-full" size="sm" variant="flat" onPress={() => mixpanelTrackViewMoreButtonClick(job)}>
                    View More
                  </CustomButton>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
