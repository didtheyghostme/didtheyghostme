import { DBTable } from "@/lib/constants/dbTables";
import { SelectObject, buildSelectString } from "@/lib/buildSelectString";
import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { JOB_STATUS } from "@/lib/constants/jobPostingStatus";

type ExportJobSelect = Pick<JobPostingTable, "id" | "title" | "created_at" | "url" | "company_id" | "job_status"> & {
  [DBTable.COMPANY]: Pick<CompanyTable, "company_name">;
} & JobPostingCountry &
  JobPostingExperienceLevel &
  JobPostingJobCategory;

type ExportJobRow = StrictOmit<ExportJobSelect, "job_posting_country" | "job_posting_experience_level" | "job_posting_job_category"> &
  JobPostingCountryJoined &
  JobPostingExperienceLevelJoined &
  JobPostingJobCategoryJoined;

function hasCountry(job: ExportJobRow, countryName: string): boolean {
  return job.job_posting_country?.some((x) => x.country.country_name === countryName) ?? false;
}

function hasExperienceLevel(job: ExportJobRow, experienceLevel: ExperienceLevel): boolean {
  return job.job_posting_experience_level?.some((x) => x.experience_level.experience_level === experienceLevel) ?? false;
}

function hasJobCategory(job: ExportJobRow, jobCategory: JobCategoryName): boolean {
  return job.job_posting_job_category?.some((x) => x.job_category.job_category_name === jobCategory) ?? false;
}

export type ExportReadmeJob = {
  jobPostingId: string;
  title: string;
  createdAt: string;
  applyUrl: string | null;
  companyId: string;
  companyName: string;
};

export async function exportSgInternTechVerifiedJobs(): Promise<ExportReadmeJob[]> {
  const supabase = await createClerkSupabaseClientSsr();

  const selectObject: SelectObject<ExportJobSelect> = {
    id: true,
    title: true,
    created_at: true,
    url: true,
    company_id: true,
    job_status: true,
    [DBTable.COMPANY]: {
      company_name: true,
    },
    [DBTable.JOB_POSTING_COUNTRY]: {
      __isLeftJoin: true,
      [DBTable.COUNTRY]: {
        id: true,
        country_name: true,
      },
    },
    [DBTable.JOB_POSTING_EXPERIENCE_LEVEL]: {
      __isLeftJoin: true,
      [DBTable.EXPERIENCE_LEVEL]: {
        id: true,
        experience_level: true,
      },
    },
    [DBTable.JOB_POSTING_JOB_CATEGORY]: {
      __isLeftJoin: true,
      [DBTable.JOB_CATEGORY]: {
        id: true,
        job_category_name: true,
      },
    },
  };

  const selectString = buildSelectString(selectObject);

  const { data, error } = await supabase.from(DBTable.JOB_POSTING).select(selectString).eq("job_status", JOB_STATUS.Verified).returns<ExportJobRow[]>();

  if (error) throw error;

  const filtered = (data ?? [])
    .filter((job) => hasCountry(job, "Singapore"))
    .filter((job) => hasExperienceLevel(job, "Internship"))
    .filter((job) => hasJobCategory(job, "Tech"))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return filtered.map((job) => ({
    jobPostingId: job.id,
    title: job.title,
    createdAt: job.created_at,
    applyUrl: job.url,
    companyId: job.company_id,
    companyName: job.company.company_name,
  }));
}
