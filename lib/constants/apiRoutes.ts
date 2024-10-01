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
    getByJobPostingId: (jobPostingId: string) => `/api/job/${jobPostingId}/application`,
  },
  INTERVIEW: {
    getByApplicationId: (applicationId: string) => `/api/interview/${applicationId}`,
  },
} as const;
