"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";

import { fetcher } from "@/lib/fetcher";

export default function CompanyDetails() {
  const { id } = useParams();
  const { data: company, error, isLoading } = useSWR<Company>(`/api/company/${id}`, fetcher);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading company data</div>;
  if (!company) return <div>Company not found</div>;

  return (
    <div>
      <h1>{company.company_name}</h1>
      <p>URL: {company.company_url}</p>
      <p>Status: {company.status}</p>
      {/* Add more company details as needed */}
    </div>
  );
}
