"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardBody, CardHeader, Divider, Link, Chip, Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from "@nextui-org/react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

import { fetcher } from "@/lib/fetcher";
import { AddJobFormData, addJobSchema } from "@/lib/schema/addJobSchema";
import { useCreateJob } from "@/lib/hooks/useCreateJob";
import COUNTRIES from "@/lib/constants/countries";
import { API } from "@/lib/constants/apiRoutes";
import { formatHowLongAgo, isRecentDate } from "@/lib/formatDateUtils";

export default function CompanyDetailsPage() {
  const pathname = usePathname();

  const { company_id } = useParams();

  const { data: company, error, isLoading } = useSWR<Company>(API.COMPANY.getById(company_id as string), fetcher);

  const { data: allJobs, error: jobError, isLoading: jobIsLoading } = useSWR<JobPosting[]>(API.JOB_POSTING.getAllByCompanyId(company_id as string), fetcher);

  // console.warn("jobs", allJobs);

  const { createJob } = useCreateJob(company_id as string);

  const router = useRouter();

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

  if (isLoading) return <div>Loading company...</div>;
  if (error) return <div>Error loading company data</div>;
  if (!company) return <div>Company not found</div>;

  if (jobIsLoading) return <div>Loading...</div>;
  if (jobError) return <div>Error loading job data</div>;
  if (!allJobs) return <div>Job not found</div>;

  const openJobs = allJobs.filter((job) => job.job_status !== "Closed");
  const closedJobs = allJobs.filter((job) => job.job_status === "Closed");

  const handleAddThisJob = handleSubmit(async (data: AddJobFormData) => {
    console.log("Form data", data);

    // TODO: add this job to the company using server action and mutation
    try {
      await createJob(data);
      handleCloseModal();
    } catch (err) {
      console.error("Error adding job:", err);
    }
  });

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const handleViewJobClick = (job: JobPosting) => {
    console.log("Viewing job", job);
    // TODO: implement go to the job page, show all the interview experiences
    // TODO: on job page, have button to "Track this job", which then add to Application table with today date
    // TODO: the button then changes to "View my application", next step is fill in date of when the first contact -> round 0 = applied, round 1 = contacted
    // TODO: after that, have a button to "Add Interview Experience" with markdown editor
    router.push(`/job/${job.id}`);
  };

  const handleViewMoreButtonClick = (job: JobPosting) => {
    handleViewJobClick(job);
  };

  return (
    <div className="">
      {/* Company Name and URL */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">{company.company_name}</h1>
        <Link isExternal showAnchorIcon className="text-primary" href={company.company_url}>
          Company website
        </Link>
      </div>

      {/* Open Positions with modal */}
      <div className="mb-4 flex justify-between">
        <p className="text-2xl font-semibold">Open Positions</p>
        <SignedIn>
          <Button
            className="rounded-full border-2 border-green-700 px-4 py-2 text-green-700 transition-colors duration-300 hover:bg-green-700 hover:text-white"
            variant="flat"
            onPress={handleOpenModal}
          >
            Add a new job
          </Button>
        </SignedIn>
        <SignedOut>
          <SignInButton fallbackRedirectUrl={pathname} mode="modal">
            <Button className="rounded-full border-2 border-green-700 px-4 py-2 text-green-700 transition-colors duration-300 hover:bg-green-700 hover:text-white" variant="flat">
              Add a new job
            </Button>
          </SignInButton>
        </SignedOut>
      </div>

      <SignedIn>
        <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
          <ModalContent>
            <form onSubmit={handleAddThisJob}>
              <ModalHeader className="flex flex-col gap-1">Add New Job</ModalHeader>
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
                    <Select {...field} defaultSelectedKeys={[field.value]} errorMessage={errors.country?.message} label="Country" placeholder="Select a country">
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={handleCloseModal}>
                  Cancel
                </Button>
                <Button color="primary" type="submit">
                  Add Job
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      </SignedIn>

      {openJobs.length === 0 && <div>No open jobs yet</div>}

      {/* Job Cards open */}
      {openJobs.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {/* TODO 5 nov: ongoing / closed */}
          {openJobs.map((job) => (
            <Card key={job.id} isPressable onPress={() => handleViewJobClick(job)}>
              <CardBody className="flex h-full flex-col">
                <div className="flex-grow">
                  <p className="mb-2 text-xl font-semibold">{job.title}</p>
                  <p className="mb-4 text-default-500">• {formatHowLongAgo(job.created_at)} </p>
                  {job.job_posted_date && isRecentDate(job.job_posted_date) && (
                    <Chip className="mb-4" color="secondary" variant="flat">
                      New
                    </Chip>
                  )}
                </div>
                <Button as="span" className="mt-auto w-full" size="sm" variant="flat" onPress={() => handleViewMoreButtonClick(job)}>
                  View More
                </Button>
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
              <Card key={job.id} isPressable onPress={() => handleViewJobClick(job)}>
                <CardBody className="flex h-full flex-col">
                  <p className="mb-2 text-xl font-semibold">{job.title}</p>
                  <p className="mb-4 text-default-500">• {formatHowLongAgo(job.created_at)} </p>
                  <Button as="span" className="mt-auto w-full" size="sm" variant="flat" onPress={() => handleViewMoreButtonClick(job)}>
                    View More
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
