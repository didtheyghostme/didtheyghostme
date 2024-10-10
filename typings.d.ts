type Note = {
  id?: number; // Optional for new entries
  title: string;
};
type User = {
  user_id: string;
  // add other user fields in future, like name, profile pic, etc.
};

// Supabase database tables
type CompanyTable = {
  id: number; // Optional for new entries
  company_name: string; // todo: rename to name
  company_url: string;
  created_at: string;
  status: string | null; //todo remove this when updating the company table page
  // logo_url: string; // todo: add logo.dev API url to this?
} & User;

type JobPostingTable = {
  id: number; // TODO: change to uuid from postgres gen_random_uuid(), which is string
  title: string;
  country: string;
  url: string | null;
  created_at: string;
  closed_at: string | null;
  company_id: number;
  // add job_status: "Verified by admin?"
  // or another table flagged job status with toggle default to Open: "Open" | "Closed" | "Flagged";
} & User;

type ApplicationStatus = "Applied" | "Interviewing" | "Rejected" | "Hired" | "Ghosted" | "Offered";

type ApplicationTable = {
  id: string;
  status: ApplicationStatus; // default start with APPLIED
  applied_at: string;
  first_response_at: string | null;
  created_at: string;
  job_posting_id: number;
} & User;

type InterviewExperienceTable = {
  id: number;
  round_no: number;
  difficulty: "Easy" | "Medium" | "Hard";
  created_at: string;
  application_id: string;
} & User;

// Utility Types (for insert)

type NullableKeys<T> = {
  [K in keyof T]: null extends T[K] ? K : never;
}[keyof T];

type GlobalGeneratedKeys = "id" | "created_at";

type ExcludeGeneratedKeys<T> = Omit<T, NullableKeys<T> | GlobalGeneratedKeys>;

type InsertApplication = ExcludeGeneratedKeys<ApplicationTable>;

// Response types below

type WithCurrentUserFlag = {
  isCurrentUserItem: boolean;
};

type DataRequired = {
  id: string;
  user_id: string;
};

type ProcessedDataObject<T extends DataRequired> = Omit<T, "user_id"> & WithCurrentUserFlag;

// process to convert T[] to ProcessedData<T>, boolean if current user_id is in T[]
type ProcessedDataArray<T extends DataRequired> = {
  data: Array<ProcessedDataObject<T>>;
  currentUserItemId: string | null;
};

type ProcessedApplication = ProcessedDataObject<ApplicationTable>;
type ProcessedApplications = ProcessedDataArray<ApplicationTable>;

type Company = CompanyTable;

type JobPosting = JobPostingTable;
