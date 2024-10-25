export const API = {
  COMPANY: {
    getAll: "/api/company",
    getById: (company_id: string) => `/api/company/${company_id}`,
  },
  JOB_POSTING: {
    getAll: ({ page, search }: { page: number; search: string }) => `/api/job?page=${page}&search=${encodeURIComponent(search)}`,
    getAllByCompanyId: (company_id: string) => `/api/company/${company_id}/job`,
    getById: (job_posting_id: string) => `/api/job/${job_posting_id}`,
  },
  APPLICATION: {
    getAllByJobPostingId: (job_posting_id: string) => `/api/job/${job_posting_id}/application`, // return all applications for a job posting
    getByApplicationId: (application_id: string) => `/api/application/${application_id}`, // return one application by id
  },
  INTERVIEW: {
    getAllByApplicationId: (application_id: string) => `/api/application/${application_id}/interview`, // return all interviews for an application
    getAllByJobPostingId: (job_posting_id: string) => `/api/job/${job_posting_id}/interview`, // return all interviews for a job posting
  },
} as const;

export const DB_RPC = {
  UPDATE_INTERVIEW_ROUNDS: "update_interview_rounds",
} as const;
