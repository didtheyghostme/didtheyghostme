"use client";

import { useState } from "react";
import useSWR from "swr";
import { Input } from "@nextui-org/react";

import { JobPostingCard } from "./JobPostingCard";

import { API } from "@/lib/constants/apiRoutes";
import { fetcher } from "@/lib/fetcher";

export default function AdminJobsPage() {
  const [search, setSearch] = useState("");
  const { data: jobs, error, isLoading } = useSWR<JobPostingTable[]>(API.ADMIN.getAllJobs, fetcher);

  console.warn("ADMIN job client pages....", jobs, error, isLoading);

  if (error) return <div>Failed to load jobs</div>;
  if (isLoading) return <div>Loading...</div>;
  if (!jobs) return <div>No jobs found</div>;

  const filteredJobs = jobs.filter((job) => job.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="mb-4">
        <Input placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredJobs.map((job) => (
          <JobPostingCard key={job.id} jobPosting={job} />
        ))}
      </div>
    </div>
  );
}
