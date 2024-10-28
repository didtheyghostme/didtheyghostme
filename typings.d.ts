type Note = {
  id?: number; // Optional for new entries
  title: string;
};

type BaseUser = {
  user_id: string;
};

type ClerkUserProfileData = {
  // add other user fields in future, like name, profile pic, etc.
  full_name: string;
  profile_pic_url: string;
};

type JoinedUser = {
  user_data: ClerkUserProfileData; // user refer to the database table user, referenced by DBTable.USER_DATA
};

// user settings? default Singapore

// type User = BaseUser & ClerkUserProfileData;

// Supabase database tables
type CompanyTable = {
  id: string; // Optional for new entries
  company_name: string; // todo: rename to name
  company_url: string;
  status: string | null; //todo remove this when updating the company table page
  created_at: string;
  // logo_url: string; // todo: add logo.dev API url to this?
} & BaseUser;

type JobPostingTable = {
  id: string;
  title: string;
  country: string;
  url: string | null;
  closed_date: string | null;
  created_at: string;
  company_id: string;
  // add job_status: "Verified by admin?"
  // or job_posted_date: string | null; for admin to set date, show new on UI if set
  // or another table flagged job status with toggle default to Open: "Open" | "Closed" | "Flagged";
} & BaseUser;

type ApplicationStatus = "Applied" | "Interviewing" | "Rejected" | "Ghosted" | "Offered";

type ApplicationTable = {
  id: string;
  status: ApplicationStatus; // default start with APPLIED
  applied_date: string;
  first_response_date: string | null;
  created_at: string;
  job_posting_id: string;
} & BaseUser;

type InterviewTag = "Online Assessment" | "HR/Recruiter" | "Technical" | "Behavioral" | "Hiring Manager" | "Final Round";

type InterviewExperienceTable = {
  id: string;
  round_no: number;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string; // ? from markdown?
  interview_date: string;
  response_date: string | null;
  interview_tags: InterviewTag[] | null;
  created_at: string;
  application_id: string;
} & BaseUser;

// Question is same table as CommentTable
type CommentEntityType = "job_posting" | "question" | "interview_experience";

type CommentTable = {
  id: string;
  content: string;
  entity_type: CommentEntityType;
  entity_id: string;
  created_at: string;
} & BaseUser;

type ReportAdminTable = {
  id: string;
  entity_type: CommentEntityType;
  entity_id: string;
  report_type: "Link Expired" | "Other";
  report_message: string | null;
  status: "Pending" | "Rejected" | "Resolved"; // default Pending in DB
  created_at: string;
  resolution_notes: string | null;
  handled_by: string | null;
  handled_at: string | null;
} & BaseUser;

// Utility Types (for insert)

type NullableKeys<T> = {
  [K in keyof T]: null extends T[K] ? K : never;
}[keyof T];

type GlobalGeneratedKeys = "id" | "created_at";

type ExcludeGeneratedKeys<T> = Omit<T, NullableKeys<T> | GlobalGeneratedKeys | keyof ClerkUserProfileData>;

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

type JoinedApplication = ApplicationTable & JoinedUser;

type ProcessedApplication = ProcessedDataObject<JoinedApplication>;
type ProcessedApplications = ProcessedDataArray<JoinedApplication>;

type Company = CompanyTable;

type JobPosting = JobPostingTable;
