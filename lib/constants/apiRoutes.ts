export const API = {
  COMPANY: {
    getAll: "/api/company",
    getById: (id: string) => `/api/company/${id}`,
  },
  JOB_POSTING: {
    getAllByCompanyId: (companyId: string) => `/api/company/${companyId}/job`,
    getById: (id: string) => `/api/job/${id}`,
  },
  APPLICATION: {
    getAllByJobPostingId: (jobPostingId: string) => `/api/job/${jobPostingId}/application`, // return all applications for a job posting
    getByApplicationId: (applicationId: string) => `/api/application/${applicationId}`, // return one application by id
  },
  INTERVIEW: {
    getAllByApplicationId: (applicationId: string) => `/api/interview/${applicationId}`, // return all interviews for an application
    getAllByJobPostingId: (jobPostingId: string) => `/api/job/${jobPostingId}/interview`, // return all interviews for a job posting
  },
} as const;

export const DB_RPC = {
  UPDATE_INTERVIEW_ROUNDS: "update_interview_rounds",
} as const;
