import type { GET as JobGET } from "@/app/api/job/[job_posting_id]/route";

// Import the return type of the GET function

export const API_ROUTES = {
  COMPANY: {
    getAll: "/api/company",
    getById: (id: string) => `/api/company/${id}`,
  },
  JOB_POSTING: {
    getAllByCompanyId: (companyId: string) => `/api/company/${companyId}/job`,
    getById: (id: string) => `/api/job/${id}`,
  },
} as const;

export type ApiRoutes = typeof API_ROUTES;
