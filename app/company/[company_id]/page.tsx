"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardBody, CardHeader, Divider, Link, Chip, Button, Spacer, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from "@nextui-org/react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { fetcher } from "@/lib/fetcher";
import { AddJobFormData, addJobSchema } from "@/lib/schema/addJobSchema";
import { useCreateJob } from "@/lib/hooks/useCreateJob";
import COUNTRIES from "@/lib/constants/countries";

export default function CompanyDetailsPage() {
  const { company_id } = useParams();
  const { data: company, error, isLoading } = useSWR<Company>(`/api/company/${company_id}`, fetcher);

  const { data: allJobs, error: jobError, isLoading: jobIsLoading } = useSWR<JobPosting[]>(`/api/company/${company_id}/job`, fetcher);

  // console.warn("jobs", allJobs);

  const { createJob } = useCreateJob(Number(company_id));

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
    <div className="mx-auto max-w-[1024px] p-4">
      {/* Company Name and URL */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">{company.company_name}</h1>
        <Link isExternal showAnchorIcon className="text-primary" href={company.company_url}>
          {company.company_url}
        </Link>
      </div>

      {/* Dashboard */}
      <Card className="mb-8">
        <CardHeader>
          <h2 className="text-2xl font-semibold">Dashboard</h2>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="flex flex-wrap gap-4">
            <Card>
              <CardBody>
                <p className="text-lg font-semibold">Total Jobs</p>
                <p className="text-3xl">42</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-lg font-semibold">Active Applications</p>
                <p className="text-3xl">18</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-lg font-semibold">Interviews Scheduled</p>
                <p className="text-3xl">5</p>
              </CardBody>
            </Card>
          </div>
        </CardBody>
      </Card>

      {/* Open Positions with modal */}
      <div className="mb-4 flex justify-between">
        <h2 className="text-2xl font-semibold">Open Positions</h2>
        <Button className="rounded-full border-2 border-green-700 px-4 py-2 text-green-700 transition-colors duration-300 hover:bg-green-700 hover:text-white" variant="flat" onPress={handleOpenModal}>
          Add a new job
        </Button>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <ModalContent>
          <form onSubmit={handleAddThisJob}>
            <ModalHeader className="flex flex-col gap-1">Add New Job</ModalHeader>
            <ModalBody>
              <Controller
                control={control}
                name="title"
                render={({ field }) => <Input {...field} errorMessage={errors.title?.message} isInvalid={!!errors.title} label="Job Title" placeholder="Enter job title" variant="bordered" />}
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

      {/* Job Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {allJobs.map((job) => (
          <Card key={job.id} isPressable onPress={() => handleViewJobClick(job)}>
            <CardBody>
              <h3 className="mb-2 text-xl font-semibold">{job.title}</h3>
              <p className="mb-4 text-default-500">{job.country} • Ongoing</p>
              <Chip className="mb-4" color="secondary" variant="flat">
                New
              </Chip>
              <Spacer y={2} />
              <Button as="span" size="sm" variant="flat" onPress={() => handleViewMoreButtonClick(job)}>
                View More
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
