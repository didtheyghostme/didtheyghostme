export const API = {
  COMPANY: {
    getAll: "/api/company",
    getById: (company_id: string) => `/api/company/${company_id}`,
  },
  JOB_POSTING: {
    getAll: ({
      page,
      search,
      isVerified,
      selectedCountries,
      sortOrder,
      experienceLevelIds,
      jobCategoryIds,
    }: {
      page: number;
      search: string;
      isVerified: boolean;
      selectedCountries: string[];
      sortOrder: "ASC" | "DESC";
      experienceLevelIds: string[];
      jobCategoryIds: string[];
    }) =>
      `/api/job?page=${page}` +
      `&search=${encodeURIComponent(search)}` +
      `&isVerified=${isVerified}` +
      `&countries=${selectedCountries}` +
      `&sortOrder=${sortOrder}` +
      `&experienceLevelIds=${experienceLevelIds}` +
      `&jobCategoryIds=${jobCategoryIds}`,
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
    getOnlineAssessmentsByJobPostingId: (job_posting_id: string) => `/api/job/${job_posting_id}/interview/online`, // return all online assessments for a job posting
  },
  COMMENT: {
    getAllByThisEntity: (entity_id: string, entity_type: CommentEntityType) => `/api/comment?entity_id=${entity_id}&entity_type=${entity_type}`, // return all comments for an entity
    getById: (comment_id: string) => `/api/comment/${comment_id}`, // return one comment by id
  },
  PROTECTED: {
    getByCurrentUser: "/api/applications", // return all applications for the current user
    getSettings: "/api/settings", // return user preferences settings for the current user
  },
  ADMIN: {
    getAllReports: "/api/admin", // return all reports
    getAllJobs: "/api/admin/job", // return all jobs
    getJobChangelog: (job_posting_id: string) => `/api/admin/job/${job_posting_id}/changelog`, // return changelog for a job
  },
  COUNTRY: {
    getAll: "/api/country", // return all countries
    getAvailable: "/api/country/available", // return all available countries
  },
  EXPERIENCE_LEVEL: {
    getAll: "/api/experience-level", // return all experience levels
  },
  JOB_CATEGORY: {
    getAll: "/api/job-category", // return all job categories
  },
} as const;

export const DB_RPC = {
  UPDATE_APPLICATION_AND_INTERVIEW_ROUNDS: "update_application_and_interview_rounds",
  GET_QUESTIONS_WITH_REPLY_COUNTS: "get_questions_with_reply_counts",
  GET_APPLICATIONS_WITH_INTERVIEW_STATS: "get_applications_with_interview_stats",
  GET_INTERVIEW_ROUNDS_WITH_TAG_NAMES: "get_interview_rounds_with_tag_names",
  GET_ONLINE_ASSESSMENTS_BY_JOB_POSTING_ID: "get_online_assessments_by_job_posting_id",
  INSERT_JOB_WITH_COUNTRIES: "insert_job_with_countries",
  UPDATE_JOB_WITH_COUNTRIES: "update_job_with_countries",
  GET_ALL_SEARCH_JOBS: "get_all_search_jobs",
  GET_USER_PREFERENCES_AND_OPTIONS: "get_user_preferences_and_options",
} as const;
