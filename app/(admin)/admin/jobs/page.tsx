"use client";

import { useState } from "react";
import useSWR from "swr";
import { Input } from "@nextui-org/react";

import { JobPostingCard } from "./JobPostingCard";

import { API } from "@/lib/constants/apiRoutes";
import { fetcher } from "@/lib/fetcher";
import { AllJobPostingWithCompany } from "@/app/api/(admin)/admin/job/route";
import { ExperienceLevelSelect } from "@/app/api/experience-level/route";
import { JobCategorySelect } from "@/app/api/job-category/route";

export default function AdminJobsPage() {
  const [search, setSearch] = useState("");
  const { data: jobs, error, isLoading } = useSWR<AllJobPostingWithCompany[]>(API.ADMIN.getAllJobs, fetcher);

  // console.log("ADMIN job client pages....", jobs, error, isLoading);

  const { data: countries = [], error: countriesError, isLoading: countriesLoading } = useSWR<CountryTable[]>(API.COUNTRY.getAll, fetcher);

  const { data: experienceLevels = [], error: experienceLevelsError, isLoading: experienceLevelsLoading } = useSWR<ExperienceLevelSelect[]>(API.EXPERIENCE_LEVEL.getAll, fetcher);

  const { data: jobCategories = [], error: jobCategoriesError, isLoading: jobCategoriesLoading } = useSWR<JobCategorySelect[]>(API.JOB_CATEGORY.getAll, fetcher);

  if (error || countriesError || experienceLevelsError || jobCategoriesError) return <div>Failed to load jobs</div>;
  if (isLoading || countriesLoading || experienceLevelsLoading || jobCategoriesLoading) return <div>Loading...</div>;
  if (!jobs) return <div>No jobs found</div>;

  const filteredJobs = jobs.filter((job) => {
    const searchTerm = search.toLowerCase();

    return job.title.toLowerCase().includes(searchTerm) || job.company.company_name.toLowerCase().includes(searchTerm);
  });

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="mb-4">
        <Input placeholder="Search jobs by job title or company name" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredJobs.map((job) => (
          <JobPostingCard key={job.id} countries={countries} experienceLevels={experienceLevels} jobCategories={jobCategories} jobPosting={job} />
        ))}
      </div>
    </div>
  );
}
